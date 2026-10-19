// Server-only adapter. Never import this module from a client component.
export const transferEndpoint = 'https://api.liquipedia.net/api/v3/transfer?wiki=callofduty&limit=1';
export type ProbeResult = {ok:boolean; message:string; upstreamStatus?:number; arrayCounts?:Record<string,number>; checkedAt:string};

export function isLiquipediaAdmin(email:string|undefined|null, adminEmail:string|undefined) {
  return !!email && !!adminEmail && email.toLowerCase() === adminEmail.toLowerCase();
}

export async function probeLiquipedia(key:string|undefined, fetcher:typeof fetch=fetch):Promise<ProbeResult> {
  const checkedAt = new Date().toISOString();
  if (!key?.trim()) return {ok:false,message:'API key is not configured.',checkedAt};
  try {
    const response = await fetcher(transferEndpoint, {
      method:'GET', redirect:'error', cache:'no-store', signal:AbortSignal.timeout(15000),
      headers:{Authorization:`Apikey ${key.trim()}`,Accept:'application/json',
        'User-Agent':'Prestige/1.0 (https://games.cdlarabic.com; https://github.com/fahadwar/prestige)'},
    });
    if (!response.ok) return {ok:false,message:'Liquipedia rejected the request. Check API permissions and endpoint access.',upstreamStatus:response.status,checkedAt};
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
    const data:unknown=JSON.parse(text);
    if(!data || typeof data!=='object' || Array.isArray(data)) return {ok:false,message:'Unexpected API response format; review required.',checkedAt};
    const obj=data as Record<string,unknown>;
    if(obj.success===false || obj.status==='error' || obj.error || (obj.errors && (!Array.isArray(obj.errors)||obj.errors.length>0)))
      return {ok:false,message:'Liquipedia returned an API error. No game data was changed.',upstreamStatus:response.status,checkedAt};
    // Report only bounded counts; transfer payloads remain on the server and are discarded.
    const arrayCounts:Record<string,number>={};
    for(const name of ['result','results','data','transfers']) if(Array.isArray(obj[name]))arrayCounts[name]=(obj[name] as unknown[]).length;
    if(!Object.keys(arrayCounts).length)return {ok:false,message:'JSON received, but the transfer response schema needs review.',upstreamStatus:response.status,checkedAt};
    return {ok:true,message:'Authenticated transfer request succeeded. No game data was changed.',upstreamStatus:response.status,arrayCounts,checkedAt};
  } catch {return {ok:false,message:'Liquipedia could not be reached or returned invalid JSON. No game data was changed.',checkedAt};}
}
