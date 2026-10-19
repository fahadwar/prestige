// Server-only adapter. Never import this module from a client component.
export const transferEndpoint = 'https://api.liquipedia.net/api/v3/transfer?wiki=callofduty&limit=1';
export type ProbeResult = {ok:boolean; message:string; upstreamStatus?:number; arrayCounts?:Record<string,number>; checkedAt:string; diagnostic?:{stage:string;code:string;detail?:string}};

export function safeDiagnostic(error:unknown,key:string):string {
  const messages:string[]=[];let current=error;
  for(let i=0;i<3&&current instanceof Error;i++) {messages.push(current.message);current=current.cause;}
  let text=messages.join(' / ')||'Unknown runtime error';
  const variants=[key,key.trim()];
  try{variants.push(encodeURIComponent(key.trim()));}catch{}
  try{variants.push(btoa(key.trim()));}catch{}
  variants.sort((a,b)=>b.length-a.length);
  for(const value of variants.filter(Boolean))text=text.split(value).join('[REDACTED]');
  return text.replace(/Apikey\s+[^\s"'<>]+/gi,'Apikey [REDACTED]').replace(/[\r\n\t]/g,' ').slice(0,240);
}

export function isLiquipediaAdmin(email:string|undefined|null, adminEmail:string|undefined) {
  return !!email && !!adminEmail && email.toLowerCase() === adminEmail.toLowerCase();
}

export async function probeLiquipedia(key:string|undefined, fetcher:typeof fetch=fetch):Promise<ProbeResult> {
  const checkedAt = new Date().toISOString();
  if (!key?.trim()) return {ok:false,message:'API key is not configured.',checkedAt};
  let stage='request'; let upstreamStatus:number|undefined;
  try {
    const response = await fetcher(transferEndpoint, {
      method:'GET', redirect:'manual', signal:AbortSignal.timeout(15000),
      headers:{Authorization:`Apikey ${key.trim()}`,Accept:'application/json',
        'Cache-Control':'no-store',
        'User-Agent':'Prestige/1.0 (https://games.cdlarabic.com; https://github.com/fahadwar/prestige)'},
    });
    upstreamStatus=response.status;
    if(response.status>=300&&response.status<400)return {ok:false,message:'Liquipedia redirected the API request. Credentials were not forwarded.',upstreamStatus,checkedAt,diagnostic:{stage:'response',code:'UPSTREAM_REDIRECT'}};
    if (!response.ok) return {ok:false,message:'Liquipedia rejected the request. Check API permissions and endpoint access.',upstreamStatus:response.status,checkedAt};
    stage='body';
    // Do not return or log upstream bodies: failures may contain credential details.
    const reader=response.body?.getReader();
    if(!reader) return {ok:false,message:'Liquipedia returned an empty response.',checkedAt};
    let text=''; let bytes=0; const decoder=new TextDecoder();
    try {
      while(true) { const part=await reader.read(); if(part.done)break;
        bytes+=part.value.byteLength;
        if(bytes>262144) {await reader.cancel();return {ok:false,message:'Response exceeded the connection-test limit.',checkedAt};}
        text+=decoder.decode(part.value,{stream:true});
      }
      text+=decoder.decode();
    } finally {reader.releaseLock();}
    stage='json';
    // Do not include JSON.parse error text, which can echo the upstream body.
    let data:unknown;
    try{data=JSON.parse(text);}catch{return {ok:false,message:'Liquipedia returned a non-JSON response.',upstreamStatus,checkedAt,diagnostic:{stage,code:'INVALID_JSON'}};}
    if(!data || typeof data!=='object' || Array.isArray(data)) return {ok:false,message:'Unexpected API response format; review required.',checkedAt};
    const obj=data as Record<string,unknown>;
    const hasErrors=(value:unknown)=>Array.isArray(value)?value.length>0:!!value;
    if(obj.success===false || obj.status==='error' || hasErrors(obj.error) || hasErrors(obj.errors))
      return {ok:false,message:'Liquipedia returned an API error. No game data was changed.',upstreamStatus:response.status,checkedAt};
    // Report only bounded counts; transfer payloads remain on the server and are discarded.
    const arrayCounts:Record<string,number>={};
    for(const name of ['result','results','data','transfers']) if(Array.isArray(obj[name]))arrayCounts[name]=(obj[name] as unknown[]).length;
    if(!Object.keys(arrayCounts).length)return {ok:false,message:'JSON received, but the transfer response schema needs review.',upstreamStatus:response.status,checkedAt};
    return {ok:true,message:'Authenticated transfer request succeeded. No game data was changed.',upstreamStatus:response.status,arrayCounts,checkedAt};
  } catch(error) {
    const timeout=error instanceof Error&&['TimeoutError','AbortError'].includes(error.name);
    return {ok:false,message:timeout?'Liquipedia request timed out.':'The server could not complete the Liquipedia request.',upstreamStatus,checkedAt,
      diagnostic:{stage,code:timeout?'TIMEOUT':'RUNTIME_ERROR',detail:safeDiagnostic(error,key)}};
  }
}
