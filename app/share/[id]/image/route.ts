import {env} from 'cloudflare:workers';
import {getSocialResult} from '../../../../lib/sharing/social-links';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){return getSocialResult(request,(await params).id,env.BUCKET,true)}
