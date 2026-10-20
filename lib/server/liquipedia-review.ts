// Review staging only. No game dataset is imported or written by this module.
import {LiquipediaRequestError} from './liquipedia-storage';
import rosters from '../game/rosters.json';
import {normalize} from '../game/identity';
export type Kind='player'|'team';
const PAGE_SIZE=100,MAX_PAGES=100,MAX_STAGE_BYTES=4*1024*1024;
const fields={player:'pageid,pagename,namespace,objectname,id,name,localizedname,type,nationality,teampagename,status',team:'pageid,pagename,namespace,objectname,name,status,template'};
type Row=Record<string,unknown>;
type Page={offset:number;url:string;fetchedAt:string;warnings:string[];rows:Row[]};
type State={version:1;kind:Kind;startedAt:string;updatedAt:string;status:'collecting'|'pagination-ended'|'review-required';pages:Page[]};
const key=(kind:Kind)=>`liquipedia/v1/review/${kind}.json`;
const text=(row:Row,name:string)=>typeof row[name]==='string'?(row[name] as string).trim():'';
export function kindOf(value:unknown):Kind {if(value!=='player'&&value!=='team')throw new LiquipediaRequestError('INVALID_KIND','Choose player or team.',400);return value;}
export function reviewUrl(kind:Kind,offset:number){const u=new URL('https://api.liquipedia.net/api/v3/'+kind);u.search=new URLSearchParams({wiki:'callofduty',limit:String(PAGE_SIZE),offset:String(offset),query:fields[kind],order:'pagename ASC, objectname ASC'}).toString();return u.toString();}
function validate(value:unknown,kind:Kind):State {
  const s=value as State;
  if(!s||s.version!==1||s.kind!==kind||!['collecting','pagination-ended','review-required'].includes(s.status)||!Array.isArray(s.pages)||s.pages.length>MAX_PAGES||typeof s.startedAt!=='string'||typeof s.updatedAt!=='string'||s.pages.some((p,i)=>p.offset!==i*PAGE_SIZE||p.url!==reviewUrl(kind,p.offset)||typeof p.fetchedAt!=='string'||!Array.isArray(p.warnings)||p.warnings.some(w=>typeof w!=='string')||!Array.isArray(p.rows)||p.rows.length>PAGE_SIZE||p.rows.some(r=>!r||typeof r!=='object'||Array.isArray(r))))throw new LiquipediaRequestError('STAGING_INVALID','Stored review is invalid; operator review is required. No API request was made.');
  return s;
}
async function read(bucket:R2Bucket|undefined,kind:Kind){if(!bucket)throw new LiquipediaRequestError('STORAGE_UNAVAILABLE','Shared review storage is unavailable.');const object=await bucket.get(key(kind));if(object&&object.size>MAX_STAGE_BYTES)throw new LiquipediaRequestError('STAGING_TOO_LARGE','Review snapshot exceeds its safety bound; operator review is required.');return {object,state:object?validate(await object.json(),kind):null};}
function sourceLink(pagename:string){return 'https://liquipedia.net/callofduty/'+pagename.split('/').map(s=>encodeURIComponent(s.replace(/ /g,'_'))).join('/');}
function signature(row:Row){return JSON.stringify(Object.fromEntries(Object.entries(row).sort(([a],[b])=>a.localeCompare(b))));}
const existingPlayers=new Set(rosters.flatMap(r=>r.players.map(normalize)));
const teamKey=(s:string)=>s.normalize('NFC').trim().toLowerCase();
const existingTeams=new Set(rosters.map(r=>teamKey(r.team)));
export function analyze(state:State|null,kind:Kind){
  const groups=new Map<string,{id:string;label:string;pagename:string;sourceUrl:string;row:Row;occurrences:number;conflict:boolean;fetchedAt:string[];possibleExistingMatch:boolean}>();
  let quarantined=0,duplicates=0;const quarantine:{offset:number;index:number;reason:string;row:Row}[]=[];
  for(const page of state?.pages||[])for(const [index,row] of page.rows.entries()){
    const pagename=text(row,'pagename').normalize('NFC'),objectname=text(row,'objectname').normalize('NFC');
    const label=kind==='player'?text(row,'id')||text(row,'name'):text(row,'name');
    if(!pagename||typeof row.objectname!=='string'||!label){quarantined++;quarantine.push({offset:page.offset,index,reason:'Missing pagename, object identity field or display name.',row});continue;}
    // Source object identity, never the player handle or team display name.
    const id=JSON.stringify(['callofduty',kind,pagename,objectname]);
    const prior=groups.get(id);
    if(prior){duplicates++;prior.occurrences++;prior.conflict ||= signature(prior.row)!==signature(row);if(!prior.fetchedAt.includes(page.fetchedAt))prior.fetchedAt.push(page.fetchedAt);continue;}
    const names=kind==='player'?[text(row,'id'),pagename,text(row,'name')]:[label,pagename];
    groups.set(id,{id,label,pagename,sourceUrl:sourceLink(pagename),row,occurrences:1,conflict:false,fetchedAt:[page.fetchedAt],possibleExistingMatch:names.some(n=>kind==='player'?existingPlayers.has(normalize(n)):existingTeams.has(teamKey(n)))});
  }
  const records=[...groups.values()];
  return {records,quarantine,summary:{kind,status:state?.status||'not-started',pages:state?.pages.length||0,rawRows:state?.pages.reduce((n,p)=>n+p.rows.length,0)||0,uniqueRecords:records.length,duplicateRows:duplicates,conflictingRecords:records.filter(r=>r.conflict).length,quarantinedRows:quarantined,possibleExistingMatches:records.filter(r=>r.possibleExistingMatch).length,unmatchedCandidates:records.filter(r=>!r.possibleExistingMatch).length,nextOffset:state?.status==='collecting'||!state?(state?.pages.length||0)*PAGE_SIZE:null,updatedAt:state?.updatedAt||null,startedAt:state?.startedAt||null,warnings:(state?.pages||[]).flatMap(p=>p.warnings.map(w=>({offset:p.offset,message:w}))),pageSize:PAGE_SIZE,maxPages:MAX_PAGES}};
}
export async function getReview(bucket:R2Bucket|undefined,kind:Kind,page=0,download=false){
  const {state}=await read(bucket,kind);const result=analyze(state,kind);
  if(download)return {schemaVersion:1,reviewOnly:true,attribution:{source:'Liquipedia Call of Duty',url:'https://liquipedia.net/callofduty/Main_Page',license:'CC-BY-SA-3.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/',changes:'Selected API fields normalized for review; duplicates grouped; no game import.'},notice:'Offset pagination is not an atomic snapshot. Pagination ended does not prove complete wiki coverage. Names are candidate matches only; no identities are merged. Historical rosters and complete careers are not established by this dataset.',...result,sourcePages:state?.pages||[]};
  if(!Number.isInteger(page)||page<0||page>500)throw new LiquipediaRequestError('INVALID_PAGE','Invalid review page.',400);
  return {summary:result.summary,records:result.records.slice(page*20,page*20+20).map(({row,...r})=>({...r,status:text(row,'status'),type:text(row,'type'),team:text(row,'teampagename')})),page,reviewPages:Math.ceil(result.records.length/20)};
}
export async function collectReviewPage(bucket:R2Bucket|undefined,kind:Kind,expectedOffset:number,fetcher:typeof fetch){
  const {object,state}=await read(bucket,kind);
  const offset=(state?.pages.length||0)*PAGE_SIZE;
  if(state&&state.status!=='collecting')throw new LiquipediaRequestError('REVIEW_STOPPED','Collection has stopped. Download and review the snapshot before further collection.',409);
  if(expectedOffset!==offset)throw new LiquipediaRequestError('STALE_REVIEW','Review progress changed. Reload before fetching another page.',409);
  const url=reviewUrl(kind,offset),response=await fetcher(url,{method:'GET'});
  if(!response.ok)throw new LiquipediaRequestError('UPSTREAM_FAILURE','The API page could not be collected. Review progress was not advanced.',response.status===429?429:502,response.status===429?Number(response.headers.get('Retry-After'))||3600:undefined);
  const value=await response.json() as {result?:unknown;error?:unknown;warning?:unknown};
  if(!Array.isArray(value.result)||value.result.length>PAGE_SIZE||value.result.some(r=>!r||typeof r!=='object'||Array.isArray(r))||value.error!==undefined&&(!Array.isArray(value.error)||value.error.length)||value.warning!==undefined&&(!Array.isArray(value.warning)||value.warning.some(w=>typeof w!=='string')))throw new LiquipediaRequestError('INVALID_PAGE','Unexpected API page. Review progress was not advanced.',502);
  // Persist only the requested fields. Keep every variant for conflict review.
  const rows=(value.result as Row[]).map(row=>Object.fromEntries(Object.entries(row).filter(([name])=>fields[kind].split(',').includes(name))));
  const warnings=(value.warning||[]) as string[],now=new Date().toISOString(),fetchedAt=response.headers.get('X-Prestige-Fetched-At');
  if(!fetchedAt||!Number.isFinite(Date.parse(fetchedAt)))throw new LiquipediaRequestError('MISSING_PROVENANCE','API fetch timestamp missing. Review progress was not advanced.',502);
  const previous=state?.pages||[];
  const repeated=rows.length>0&&previous.some(p=>JSON.stringify(p.rows.map(signature).sort())===JSON.stringify(rows.map(signature).sort()));
  const page:Page={offset,url,fetchedAt,warnings:[...warnings,...(repeated?['A previous page repeated at a different offset; pagination requires review.']:[])],rows};
  const pages=[...previous,page];
  const status=warnings.length||repeated||pages.length>=MAX_PAGES&&rows.length===PAGE_SIZE?'review-required':rows.length<PAGE_SIZE?'pagination-ended':'collecting';
  const next:State={version:1,kind,startedAt:state?.startedAt||now,updatedAt:now,status,pages};
  const serialized=JSON.stringify(next);if(new TextEncoder().encode(serialized).byteLength>MAX_STAGE_BYTES)throw new LiquipediaRequestError('STAGING_FULL','The review reached its storage safety bound. Download the existing snapshot for review. No page was added.',409);
  const saved=await bucket!.put(key(kind),serialized,{onlyIf:object?{etagMatches:object.etag}:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'application/json'}});
  if(!saved)throw new LiquipediaRequestError('STAGING_CONFLICT','Another request saved progress first. Reload; the API response remains cached.',409);
  return {ok:true,message:'One API page saved for review. No game data was changed.',cache:response.headers.get('X-Prestige-Cache')==='hit'?'stored':'live',...await getReview(bucket,kind)};
}
