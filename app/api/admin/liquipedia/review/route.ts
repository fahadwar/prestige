import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../../../chatgpt-auth';
import {isLiquipediaAdmin} from '../../../../../lib/server/liquipedia';
import {createLiquipediaFetch,LiquipediaRequestError} from '../../../../../lib/server/liquipedia-storage';
import {kindOf,getReview,collectReviewPage} from '../../../../../lib/server/liquipedia-review';
import {type ReviewFilter} from '../../../../../lib/server/liquipedia-matching';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
async function authorize(request:Request,write:boolean){
  const user=await getChatGPTUser();
  if(!user)return Response.json({ok:false,message:'Sign in with ChatGPT first.'},{status:401,headers});
  if(!isLiquipediaAdmin(user.email,env.LIQUIPEDIA_ADMIN_EMAIL))return Response.json({ok:false,message:'Owner access required.'},{status:403,headers});
  if(write&&request.headers.get('origin')!==new URL(request.url).origin)return Response.json({ok:false,message:'Same-origin request required.'},{status:403,headers});
}
function failure(error:unknown){const known=error instanceof LiquipediaRequestError;return Response.json({ok:false,message:known?error.message:'Review storage is unavailable. Progress was not confirmed; reload before retrying.',...(known?{code:error.code,retryAfterSeconds:error.retryAfterSeconds}:{})},{status:known?error.status:503,headers:{...headers,...(known&&error.retryAfterSeconds?{'Retry-After':String(error.retryAfterSeconds)}:{})}});}
export async function GET(request:Request){const denied=await authorize(request,false);if(denied)return denied;try{
  const url=new URL(request.url),kind=kindOf(url.searchParams.get('kind')),download=url.searchParams.get('download')==='1';
  const result=await getReview(env.BUCKET,kind,Number(url.searchParams.get('page')||0),download,(url.searchParams.get('filter')||'all') as ReviewFilter);
  return Response.json(result,{headers:{...headers,...(download?{'Content-Disposition':`attachment; filename="prestige-liquipedia-${kind}-review.json"`}:{})}});
}catch(error){return failure(error);}}
export async function POST(request:Request){const denied=await authorize(request,true);if(denied)return denied;try{
  if(!request.headers.get('content-type')?.startsWith('application/json'))return Response.json({ok:false,message:'JSON required.'},{status:415,headers});
  // Bound the admin command body before parsing it.
  const reader=request.body?.getReader();if(!reader)throw new LiquipediaRequestError('INVALID_COMMAND','Missing command.',400);
  let size=0,body='';const decoder=new TextDecoder();try{while(true){const p=await reader.read();if(p.done)break;size+=p.value.byteLength;if(size>1024){await reader.cancel();throw new LiquipediaRequestError('INVALID_COMMAND','Command too large.',413);}body+=decoder.decode(p.value,{stream:true});}body+=decoder.decode();}finally{reader.releaseLock();}
  let command;try{command=JSON.parse(body);}catch{throw new LiquipediaRequestError('INVALID_COMMAND','Invalid JSON command.',400);}
  if(!command||typeof command!=='object'||Array.isArray(command)||!Number.isInteger(command.offset)||command.offset<0||command.offset>9900||Object.keys(command).some(k=>!['kind','offset'].includes(k)))throw new LiquipediaRequestError('INVALID_COMMAND','Invalid page command.',400);
  const kind=kindOf(command.kind);
  return Response.json(await collectReviewPage(env.BUCKET,kind,command.offset,createLiquipediaFetch(env.BUCKET,env.LIQUIPEDIA_API_KEY)),{headers});
}catch(error){return failure(error);}}
