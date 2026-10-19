import {env} from 'cloudflare:workers';
import {createSocialLink} from '../../../../lib/sharing/social-links';
export async function POST(request:Request){return createSocialLink(request,env.BUCKET)}
