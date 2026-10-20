import type {GameIdentity} from '../../lib/game/liquipedia-identities';
const statuses:Record<string,string>={'Active':'نشط','Inactive':'غير نشط','Retired':'معتزل','Passed Away':'متوفى'};
export default function LiquipediaIdentity({identity}:{identity:GameIdentity}){
 return <aside aria-label="هوية اللاعب من Liquipedia" style={{border:'1px solid #3c4148',borderRadius:12,padding:16,margin:'16px 0',fontSize:13,lineHeight:1.9}}>
  <p><strong dir="auto">{identity.realName}</strong></p>
  <p>الحالة المسجلة: {statuses[identity.listedStatus]||identity.listedStatus} · تصنيف الملف: {identity.listedType==='staff'?'طاقم':'لاعب'}</p>
  {identity.listedTeam&&<p>الجهة المسجلة في الملف: <a href={identity.listedTeam.sourceUrl} target="_blank" rel="noreferrer" dir="ltr">{identity.listedTeam.name}</a></p>}
  <p className="muted">بيانات الملف وقت جلبه في <time dateTime={identity.fetchedAt} dir="ltr">{identity.fetchedAt.slice(0,10)}</time>. لا تغيّر الفريق التاريخي أو الدور المستخدم في التحدي، ولا تثبت اكتمال المسيرة.</p>
  <p>المصدر: <a href={identity.sourceUrl} target="_blank" rel="noreferrer" dir="ltr">Liquipedia</a> · <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer" dir="ltr">CC BY-SA 3.0</a>. رُبطت بيانات الهوية بالملف الموثق في اللعبة.</p>
 </aside>;
}
