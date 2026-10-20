// The single outbound LiquipediaDB gateway. All endpoints share this ledger.
const HOUR=3600000,SPACING=65000,ERROR_TTL=300000,MAX_BYTES=262144;
export const liquipediaLedgerKey='liquipedia/v1/request-ledger.json';
type Ledger={version:1;requests:number[];notBefore:number;pending:boolean};
type Envelope={result:Record<string,unknown>[];error?:string[];warning?:string[]};
type Cached={version:1;source:string;fetchedAt:string;status:number;expiresAt:number|null;data:Envelope};
export class LiquipediaRequestError extends Error {
  constructor(public code:string,message:string,public status=503,public retryAfterSeconds?:number){super(message);this.name='LiquipediaRequestError';}
}
function failure(){return new LiquipediaRequestError('STORAGE_UNAVAILABLE','Shared API storage is unavailable. No new request is allowed.');}
function envelope(value:unknown):value is Envelope {
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const x=value as Envelope;
  return Array.isArray(x.result)&&x.result.every(r=>r&&typeof r==='object'&&!Array.isArray(r))&&
    [x.error,x.warning].every(v=>v===undefined||Array.isArray(v)&&v.every(s=>typeof s==='string'));
}
function canonical(resource:RequestInfo|URL,init?:RequestInit):string {
  const method=init?.method||(resource instanceof Request?resource.method:'GET');
  const u=new URL(resource instanceof Request?resource.url:String(resource));
  const allowed=['wiki','limit','offset','conditions','query','order','groupby','template','date','pagination'];
  if(method.toUpperCase()!=='GET'||init?.body||u.origin!=='https://api.liquipedia.net'||u.username||u.password||u.hash||
    !/^\/api\/v3\/(player|team|squadplayer|transfer|teamtemplate|teamtemplatelist)$/.test(u.pathname)||
    u.searchParams.getAll('wiki').length!==1||u.searchParams.get('wiki')!=='callofduty'||
    [...u.searchParams.keys()].some(k=>!allowed.includes(k)||u.searchParams.getAll(k).length!==1))
    throw new LiquipediaRequestError('INVALID_API_REQUEST','Only approved Call of Duty API GET requests are allowed.',400);
  u.searchParams.sort();return u.toString();
}
async function cacheKey(url:string){const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(url));return 'liquipedia/v1/cache/'+[...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,'0')).join('')+'.json';}
function response(record:Cached,hit:boolean,now:number){return Response.json(record.data,{status:record.status,headers:{
  'Cache-Control':'private, no-store','X-Prestige-Cache':hit?'hit':'miss','X-Prestige-Fetched-At':record.fetchedAt,
  ...(record.status===429&&record.expiresAt?{'Retry-After':String(Math.max(1,Math.ceil((record.expiresAt-now)/1000)))}:{})}});}
async function reserve(bucket:R2Bucket,now:number){
  for(let attempt=0;attempt<4;attempt++){
    const old=await bucket.get(liquipediaLedgerKey);
    const ledger:Ledger=old?await old.json():{version:1,requests:[],notBefore:0,pending:false};
    if(ledger.version!==1||!Array.isArray(ledger.requests)||ledger.requests.some(t=>!Number.isFinite(t))||!Number.isFinite(ledger.notBefore)||typeof ledger.pending!=='boolean')throw failure();
    if(ledger.pending)throw new LiquipediaRequestError('REQUEST_UNRESOLVED','A previous API request is unresolved. New requests are paused for review.',503);
    const recent=ledger.requests.filter(t=>t>=now-HOUR).sort((a,b)=>a-b);
    const waitUntil=Math.max(ledger.notBefore,recent.length>=60?recent[0]+HOUR+1:0);
    if(waitUntil>now)throw new LiquipediaRequestError(recent.length>=60?'HOURLY_LIMIT':'REQUEST_SPACING','The shared API request budget requires a wait.',429,Math.ceil((waitUntil-now)/1000));
    const next:Ledger={version:1,requests:[...recent,now],notBefore:now+SPACING,pending:true};
    // Conditional create/update prevents concurrent Workers reserving the same slot.
    const stored=await bucket.put(liquipediaLedgerKey,JSON.stringify(next),{onlyIf:old?{etagMatches:old.etag}:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'application/json'}});
    if(stored)return {ledger:next,etag:stored.etag};
  }
  throw new LiquipediaRequestError('REQUEST_CONTENTION','Another request is updating the shared budget. Try again shortly.',429,65);
}
async function readBounded(r:Response){const reader=r.body?.getReader();if(!reader)throw Error('Empty response');let text='',bytes=0;const decoder=new TextDecoder();try{while(true){const x=await reader.read();if(x.done)break;bytes+=x.value.byteLength;if(bytes>MAX_BYTES){await reader.cancel();throw Error('Response too large');}text+=decoder.decode(x.value,{stream:true});}return text+decoder.decode();}finally{reader.releaseLock();}}
function retryAt(value:string|null,now:number){if(!value)return now+HOUR;const seconds=Number(value);const time=value.trim()!==''&&Number.isFinite(seconds)?now+Math.max(0,seconds)*1000:Date.parse(value);return Number.isFinite(time)?Math.max(now+SPACING,time):now+HOUR;}

export function createLiquipediaFetch(bucket:R2Bucket|undefined,key:string|undefined,options:{fetcher?:typeof fetch;now?:()=>number}={}):typeof fetch {
  const upstream=options.fetcher||fetch,clock=options.now||Date.now;
  return async(resource,init)=>{
    if(!bucket)throw failure();
    if(!key?.trim())throw new LiquipediaRequestError('KEY_MISSING','API key is not configured.');
    const url=canonical(resource,init);
    if([key.trim(),encodeURIComponent(key.trim())].some(v=>url.includes(v)))throw new LiquipediaRequestError('INVALID_API_REQUEST','Credentials must not appear in request URLs.',400);
    const objectKey=await cacheKey(url),now=clock();
    try{
      const object=await bucket.get(objectKey);
      if(object){const cached=await object.json<Cached>();
        if(cached.version!==1||cached.source!==url||!envelope(cached.data)||!Number.isFinite(Date.parse(cached.fetchedAt))||!Number.isInteger(cached.status)||cached.status<200||cached.status>599||cached.expiresAt!==null&&!Number.isFinite(cached.expiresAt))throw failure();
        if(cached.expiresAt===null||cached.expiresAt>now)return response(cached,true,now);
      }
      const slot=await reserve(bucket,now);
      let status=503,data:Envelope={result:[],error:['Liquipedia request failed.']},until=clock()+ERROR_TTL;
      let success=false;
      try{
        const r=await upstream(url,{method:'GET',redirect:'manual',signal:AbortSignal.timeout(15000),headers:{
          Authorization:'Apikey '+key.trim(),Accept:'application/json','Accept-Encoding':'gzip',
          'User-Agent':'Prestige/1.0 (https://games.cdlarabic.com; https://github.com/fahadwar/prestige)'}});
        status=r.status===200?502:r.status>=400&&r.status<=599?r.status:502;
        if(r.status===429)until=retryAt(r.headers.get('Retry-After'),clock());
        if(r.status===200){const text=await readBounded(r);
          // Never persist a response that reflects the credential.
          const secret=key.trim();if([secret,encodeURIComponent(secret),btoa(secret)].some(v=>v&&text.includes(v)))throw Error('Unsafe response');
          const parsed:unknown=JSON.parse(text);
          if(envelope(parsed)&&!parsed.error?.length){data=parsed;status=200;success=true;}
        }else{await r.body?.cancel();}
      }catch{/* Count failed attempts, store only a fixed safe error, and do not retry. */}
      const finished=clock(),record:Cached={version:1,source:url,fetchedAt:new Date(finished).toISOString(),status,expiresAt:success?null:Math.max(until,finished+SPACING),data};
      const saved=await bucket.put(objectKey,JSON.stringify(record),{httpMetadata:{contentType:'application/json'}});
      if(!saved)throw failure();
      // A crash or storage error leaves pending=true: fail closed, never guess
      // whether a request happened or release an unaccounted quota slot.
      const cleared=await bucket.put(liquipediaLedgerKey,JSON.stringify({...slot.ledger,pending:false,notBefore:success?finished+SPACING:record.expiresAt}),{onlyIf:{etagMatches:slot.etag},httpMetadata:{contentType:'application/json'}});
      if(!cleared)throw failure();
      return response(record,false,finished);
    }catch(error){if(error instanceof LiquipediaRequestError)throw error;throw failure();}
  };
}
