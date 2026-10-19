import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../../../chatgpt-auth';
import {isLiquipediaAdmin,probeLiquipedia} from '../../../../../lib/server/liquipedia';

export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
let nextProbeAt=0;
export async function POST(request:Request) {
  const user=await getChatGPTUser();
  if(!user)return Response.json({ok:false,message:'Sign in with ChatGPT first.'},{status:401,headers});
  if(!isLiquipediaAdmin(user.email,env.LIQUIPEDIA_ADMIN_EMAIL))return Response.json({ok:false,message:'Owner access required.'},{status:403,headers});
  if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({ok:false,message:'Same-origin request required.'},{status:403,headers});
  if(Date.now()<nextProbeAt)return Response.json({ok:false,message:'Please wait one minute before testing again.'},{status:429,headers:{...headers,'Retry-After':'60'}});
  nextProbeAt=Date.now()+60000;
  const result=await probeLiquipedia(env.LIQUIPEDIA_API_KEY);
  return Response.json(result,{status:result.ok?200:502,headers});
}
