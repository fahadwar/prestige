import {env} from 'cloudflare:workers';
import {getChatGPTUser,chatGPTSignInPath} from '../../chatgpt-auth';
import {isLiquipediaAdmin} from '../../../lib/server/liquipedia';
import ProbeButton from './ProbeButton';
import ReviewPanel from './ReviewPanel';
export const dynamic='force-dynamic';
export const metadata={title:'Liquipedia connection | PRESTIGE',robots:{index:false,follow:false}};
export default async function Page(){
  const user=await getChatGPTUser();
  return <main dir="ltr" style={{maxWidth:760,margin:'64px auto',padding:24,color:'#eee',fontFamily:'sans-serif'}}>
    <h1 style={{fontSize:28,marginBottom:20}}>Liquipedia connection</h1>
    {!user?<a target="_top" href={chatGPTSignInPath('/admin/liquipedia')}>Sign in with ChatGPT</a>:
      !isLiquipediaAdmin(user.email,env.LIQUIPEDIA_ADMIN_EMAIL)?<p>Owner access required.</p>:<>
        <p style={{marginBottom:16}}>API key: {env.LIQUIPEDIA_API_KEY?'configured (value hidden)':'missing'}</p>
        <p style={{marginBottom:24}}>Stored results are reused. If no response is cached, this makes one server-side Call of Duty transfer request under the shared hourly limit. It does not import records or change any game.</p>
        <ProbeButton/>
        <ReviewPanel/>
        <p style={{marginTop:24}}>Data source: <a href="https://liquipedia.net/callofduty/Main_Page">Liquipedia Call of Duty</a>. API access only; source and license attribution must accompany any data released in games.</p>
      </>}
  </main>;
}
