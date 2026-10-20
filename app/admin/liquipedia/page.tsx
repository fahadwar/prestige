import {env} from 'cloudflare:workers';
import {getChatGPTUser,chatGPTSignInPath} from '../../chatgpt-auth';
import {isLiquipediaAdmin} from '../../../lib/server/liquipedia';
import ProbeButton from './ProbeButton';
import {identityImportSummary} from '../../../lib/game/liquipedia-identities';
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
        <section style={{marginTop:32,padding:16,border:'1px solid #555',borderRadius:8}}><h2>Published game import</h2><p>{identityImportSummary.identities} identity records and {identityImportSummary.linkedTeams} linked teams are imported into Guess Player answer reveals. {identityImportSummary.newPlayableTargets} new playable targets were added.</p><p>The playable pool remains 104. New targets still need verified birth dates, playing roles and dated team evidence; roster and career games require their own historical evidence.</p><p style={{overflowWrap:'anywhere'}}>Batch: {identityImportSummary.batchId||'none'}</p></section>
        <ReviewPanel/>
        <p style={{marginTop:24}}>Data source: <a href="https://liquipedia.net/callofduty/Main_Page">Liquipedia Call of Duty</a>. API access only; source and license attribution must accompany any data released in games.</p>
      </>}
  </main>;
}
