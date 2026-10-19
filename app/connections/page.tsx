'use client';
import {reconcileDailyStreak} from '../../lib/game/streak';
import {useDailyStreak} from '../../lib/game/use-daily-streak';
import GameResultShare from '../../components/game/GameResultShare';
import {arabicNumber as n} from '../../lib/sharing/roster-share';
import {SiteHeader,SiteFooter} from '../../components/game/SiteChrome';
import {useEffect,useRef,useState} from 'react';
import {Crosshair,Clock3,Shuffle,Share2,Target,Trophy,Flame,ArrowRight,Check,Link2} from 'lucide-react';
import {normalize} from '../../lib/game/identity';
import PlayerPortrait from '../../components/game/PlayerPortrait';
type Group={rosterId:string;team:string;season:number;event:string;date:string;players:string[];source:string;color:number};
type Payload={question:{id:string;season:number;tiles:string[]};day:number;date:string;coverage:{puzzles:number;seasons:number[]}};
type Result={won:boolean;done:boolean;mistakes:number;remaining:number;solved:Group[];history:{matched:number|null;oneAway:boolean}[];oneAway:boolean;score:number;maxScore:number;answers?:Group[]};
type Stats={played:number;wins:number;streak:number;best:number;lastDay:number};
const initial:Result={won:false,done:false,mistakes:0,remaining:4,solved:[],history:[],oneAway:false,score:0,maxScore:400},empty:Stats={played:0,wins:0,streak:0,best:0,lastDay:0};
const statsKey='cdlar-connections-stats-v1';
export default function Connections(){
 const [data,setData]=useState<Payload>(),[mode,setMode]=useState<'daily'|'practice'>('daily'),[season,setSeason]=useState(''),[order,setOrder]=useState<string[]>([]),[selected,setSelected]=useState<string[]>([]),[guesses,setGuesses]=useState<string[][]>([]),[result,setResult]=useState<Result>(initial),[busy,setBusy]=useState(true),[notice,setNotice]=useState(''),[rules,setRules]=useState(false),[stats,setStats]=useState<Stats>(empty);
 const request=useRef(0),inFlight=useRef(false),round=useRef('');
 async function load(nextMode:'daily'|'practice'='daily',year=season){
  const token=++request.current;setBusy(true);setNotice('');
  try{
   const params=new URLSearchParams({mode:nextMode});if(nextMode==='practice'&&year)params.set('season',year);if(data)params.set('exclude',data.question.id);
   const response=await fetch('/api/connections?'+params);if(!response.ok)throw Error('تعذر تحميل التحدي. حاول مرة أخرى.');const payload=await response.json() as Payload;if(token!==request.current)return;
   setData(payload);setMode(nextMode);setOrder(payload.question.tiles);setSelected([]);setGuesses([]);setResult(initial);round.current=crypto.randomUUID();
   if(nextMode==='daily')try{
    const saved=JSON.parse(localStorage.getItem('cdlar-connections-v1-'+payload.day)||'null');
    if(saved?.id===payload.question.id){const check=await fetch('/api/connections',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...saved,mode:'daily'})});if(check.ok&&token===request.current){setResult(await check.json());setGuesses(saved.guesses);}}
   }catch{setNotice('تعذر استعادة التقدم المحفوظ');}
  }catch(e){if(token===request.current)setNotice(e instanceof Error?e.message:'تعذر تحميل التحدي');}finally{if(token===request.current)setBusy(false);}
 }
 useDailyStreak(setStats);
 useEffect(()=>{try{setStats(reconcileDailyStreak(JSON.parse(localStorage.getItem(statsKey)||'null')||empty))}catch{}load();return()=>{request.current++}},[]);
 function toggle(name:string){if(busy||result.done)return;setSelected(old=>old.includes(name)?old.filter(p=>p!==name):old.length<4?[...old,name]:old);}
 function shuffle(){setOrder(old=>{const next=[...old];for(let i=next.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[next[i],next[j]]=[next[j],next[i]];}return next;});}
 async function submit(surrender=false){
  if(!data||busy||inFlight.current||result.done||!surrender&&selected.length!==4)return;
  const next=surrender?guesses:[...guesses,[...selected]],token=request.current;inFlight.current=true;setBusy(true);setNotice('');
  try{
   const response=await fetch('/api/connections',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:data.question.id,mode,guesses:next,surrender})});const value=await response.json() as Result&{error?:string};if(token!==request.current)return;if(!response.ok)throw Error(value.error||'تعذر التحقق');
   setResult(value);setGuesses(next);if(value.solved.length>result.solved.length||value.done)setSelected([]);
   setNotice(value.won?'اكتشفت الروابط الأربعة!':value.done?'انتهت الجولة. هذه هي التشكيلات الأربع.':value.solved.length>result.solved.length?'تشكيلة صحيحة! ابحث عن الرابط التالي.':value.oneAway?'قريب! ثلاثة أسماء من اختيارك تنتمي إلى تشكيلة واحدة.':'هذه ليست تشكيلة صحيحة. جرّب مجموعة أخرى.');
   try{
    if(mode==='daily')localStorage.setItem('cdlar-connections-v1-'+data.day,JSON.stringify({id:data.question.id,guesses:next,surrender}));
    if(value.done){const key='cdlar-connections-counted-'+(mode==='daily'?data.day:round.current);if(!localStorage.getItem(key)){
     const prior=JSON.parse(localStorage.getItem(statsKey)||'null') as Stats|null,p=reconcileDailyStreak(prior||empty),streak=mode==='daily'?(value.won?(p.lastDay===data.day-1?p.streak+1:1):0):p.streak;
     const updated={played:p.played+1,wins:p.wins+(value.won?1:0),streak,best:Math.max(p.best,streak),lastDay:mode==='daily'?data.day:p.lastDay};localStorage.setItem(key,'1');localStorage.setItem(statsKey,JSON.stringify(updated));setStats(updated);
    }}
   }catch{setNotice('اكتملت المحاولة، لكن تعذر حفظ التقدم على هذا المتصفح');}
  }catch(e){setNotice(e instanceof Error?e.message:'تعذر الاتصال. لم تُحتسب محاولة.');}finally{inFlight.current=false;if(token===request.current)setBusy(false);}
 }

 const visible=order.filter(p=>!result.solved.some(g=>g.players.some(s=>normalize(s)===normalize(p)))),groups=result.done?result.answers||[]:result.solved;
 return <><SiteHeader rulesOpen={rules} onRules={()=>setRules(!rules)}/><main className="missing-page connections-page">
 <a className="back-link" href="/"><ArrowRight size={15}/> كل الألعاب</a><div className="section-heading"><div><span className="eyebrow">ستة عشر اسماً. أربعة فرق.</span><h1>روابط اللاعبين</h1><p className="muted">اكتشف أربع تشكيلات من أربعة لاعبين. لديك أربعة أخطاء مسموحة.</p></div><span className="tag">اللعبة الثالثة</span></div>
 <section className="stats">{[[Target,stats.played,'جولات لعبتها'],[Check,stats.wins,'ألغاز اكتملت'],[Flame,stats.streak,'سلسلتك اليومية'],[Trophy,stats.best,'أفضل سلسلة']].map(([Icon,n,label]:any)=><div key={label}><Icon size={20}/><b>{n}</b><span>{label}</span></div>)}</section>
 {rules&&<section className="rules" id="game-rules"><h2>كيف تلعب؟</h2><p>اختر أربعة لاعبين كانوا تشكيلة فريق واحدة في مباراة موثقة من الموسم الموضح. اضغط «تحقق من المجموعة». كل تشكيلة صحيحة تبقى ظاهرة، وكل مجموعة خاطئة تستهلك خطأ واحداً. لديك أربعة أخطاء، ولا تُحتسب إعادة نفس المجموعة. تحصل على 100 نقطة لكل تشكيلة، ويُخصم 25 لكل خطأ. عند انتهاء الجولة تظهر الفرق. يتغير تحدي اليوم عند منتصف الليل UTC، ويُحفظ تقدمه على هذا المتصفح.</p><button onClick={()=>setRules(false)}>إغلاق</button></section>}
 <div className="arena-layout missing-arena"><section className="arena"><div className="tabs"><button disabled={busy} className={mode==='daily'?'selected':''} onClick={()=>load()}><Clock3 size={16}/> تحدي اليوم</button><button disabled={busy} className={mode==='practice'?'selected':''} onClick={()=>load('practice')}><Shuffle size={16}/> العب بلا حدود</button><span dir="ltr">{data?.date} · UTC</span></div><div className="game-content">
 {mode==='practice'&&<div className="season-filter"><label htmlFor="connections-season">الموسم</label><select id="connections-season" disabled={busy} value={season} onChange={e=>{setSeason(e.target.value);load('practice',e.target.value)}}><option value="">كل المواسم</option>{(data?.coverage.seasons||[2021,2022,2023,2024,2025,2026]).map(y=><option key={y} value={y}>{y}</option>)}</select></div>}
 <div className="game-meta"><span>{mode==='daily'?'اللغز اليومي':'تدريب'}</span><span dir="ltr">CDL · {data?.question.season}</span></div><h3>من لعبوا معاً؟</h3><p className="subtitle">كوّن أربع مجموعات. كل مجموعة تشكيلة موثقة من الموسم الموضح.</p>
 <div className="connection-groups">{groups.map(g=><article className={'connection-group group-color-'+g.color+(result.done&&!result.solved.some(s=>s.rosterId===g.rosterId)?' not-solved':'')} key={g.rosterId}><div className="connection-group-heading"><b dir="ltr">{g.team} · {g.season}</b></div><p dir="ltr">{g.event}</p><div className="connection-players">{g.players.map(p=><div key={p}><PlayerPortrait handle={p}/><span dir="ltr">{p}</span></div>)}</div></article>)}</div>
 {!result.done&&data&&<><div className="connection-board" aria-label="اختر أربعة لاعبين">{visible.map(p=><button type="button" className={'connection-tile '+(selected.includes(p)?'selected':'')} key={p} aria-pressed={selected.includes(p)} disabled={busy||selected.length===4&&!selected.includes(p)} onClick={()=>toggle(p)} dir="ltr">{p}</button>)}</div><div className="connection-selection" aria-live="polite">الأسماء المختارة: {selected.length}/4</div><div className="connection-controls"><button className="secondary" disabled={busy} onClick={shuffle}><Shuffle size={15}/> خلط الأسماء</button><button className="secondary" disabled={busy||!selected.length} onClick={()=>setSelected([])}>إلغاء الاختيار</button><button className="primary" disabled={busy||selected.length!==4} onClick={()=>submit()}>تحقق من المجموعة</button></div><div className="connection-lives"><span>الأخطاء المتاحة</span><div aria-label={'المتبقي: '+result.remaining}>{[0,1,2,3].map(i=><span className={i<result.remaining?'life':'life used'} key={i}/>)}</div><b>{result.remaining}/4</b></div><div className="game-tools"><span>النتيجة: <b>{result.score}/400</b></span><button disabled={busy} onClick={()=>submit(true)}>استسلام وكشف التشكيلات</button></div></>}
 {result.done&&<div className="completed"><h2>{result.won?'ربطتها كلها!':'انتهت الجولة'}</h2><p>اكتشفت {result.solved.length}/4 تشكيلات · النتيجة: <b>{result.score}/400</b></p>{data&&<GameResultShare submission={{game:'connections',id:data.question.id,guesses:guesses,surrender:!result.won&&result.mistakes<4,mode,date:data.date}} card={{game:'connections',title:'روابط اللاعبين',date:data.date,mode,won:result.won,score:result.score,maxScore:result.maxScore,summary:'المجموعات: '+n(result.solved.length)+' من '+n(4)+' · الأخطاء: '+n(result.mistakes),subject:undefined,players:(result.answers||result.solved).flatMap((g,i)=>g.players.map(p=>({handle:p,tag:'المجموعة '+n(i+1),correct:result.solved.some(s=>s.rosterId===g.rosterId)})))}}/>}<button className="secondary" disabled={busy} onClick={()=>load('practice')}>لغز آخر</button></div>}
 {!data&&<button className="secondary" disabled={busy} onClick={()=>load(mode)}>{busy?'جارٍ تحميل الأسماء…':'إعادة المحاولة'}</button>}
 <div className="notice" role="status" aria-live="polite">{notice}</div></div></section>
 </div>
 <SiteFooter/></main></>
}
