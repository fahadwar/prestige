'use client';
import GameResultShare from '../../components/game/GameResultShare';
import {arabicNumber as n} from '../../lib/sharing/roster-share';
import {SiteHeader,SiteFooter} from '../../components/game/SiteChrome';
import {useEffect,useRef,useState} from 'react';
import {Crosshair,Users,Clock3,Shuffle,Share2,Target,Trophy,Flame,ArrowRight,Check} from 'lucide-react';
import PlayerPortrait from '../../components/game/PlayerPortrait';
import PlayerSearch from '../../components/game/PlayerSearch';
import {normalize} from '../../lib/game/identity';
type Question={id:string;challengeId:string;rosterId:string;team:string;season:number;title:string;event:string;rosterSize:number;startDate:string;endDate:string;source:string;slots:(string|null)[]};
type Payload={question:Question;players:string[];day:number;date:string};
type Result={won:boolean;done:boolean;attempts:number;remaining:number;score:number;maxScore:number;answer?:string};
type Stats={played:number;wins:number;streak:number;best:number;lastDay:number};
const initial:Result={won:false,done:false,attempts:0,remaining:3,score:0,maxScore:300};
const emptyStats:Stats={played:0,wins:0,streak:0,best:0,lastDay:0};
const statsKey='cdlar-missing-stats-v1';
export default function MissingPlayer(){
 const [data,setData]=useState<Payload>(),[mode,setMode]=useState<'daily'|'practice'>('daily'),[season,setSeason]=useState(''),[guesses,setGuesses]=useState<string[]>([]),[result,setResult]=useState<Result>(initial),[busy,setBusy]=useState(true),[notice,setNotice]=useState(''),[stats,setStats]=useState<Stats>(emptyStats),[rules,setRules]=useState(false);
 const request=useRef(0),inFlight=useRef(false),round=useRef('');
 async function load(nextMode:'daily'|'practice'='daily',selectedSeason=season){
  const token=++request.current;setBusy(true);setNotice('');
  try{
   const params=new URLSearchParams({mode:nextMode});if(nextMode==='practice'&&selectedSeason)params.set('season',selectedSeason);if(data)params.set('exclude',data.question.rosterId);
   const response=await fetch('/api/missing-player?'+params);if(!response.ok)throw Error('تعذر تحميل التحدي. حاول مرة أخرى.');const payload=await response.json() as Payload;if(token!==request.current)return;
   setData(payload);setMode(nextMode);setGuesses([]);setResult(initial);round.current=crypto.randomUUID();
   if(nextMode==='daily'){
    try{
     const saved=JSON.parse(localStorage.getItem('cdlar-missing-v1-'+payload.day)||'null');
     if(saved?.id===payload.question.challengeId){const check=await fetch('/api/missing-player',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...saved,mode:'daily'})});if(check.ok&&token===request.current){setResult(await check.json() as Result);setGuesses(saved.guesses);}}
    }catch{setNotice('المتصفح لا يسمح باستعادة التقدم المحفوظ');}
   }
  }catch(e){if(token===request.current)setNotice(e instanceof Error?e.message:'تعذر تحميل التحدي');}finally{if(token===request.current)setBusy(false);}
 }
 useEffect(()=>{try{setStats(JSON.parse(localStorage.getItem(statsKey)||'null')||emptyStats)}catch{}load();return()=>{request.current++}},[]);
 async function play(player?:string,surrender=false){
  if(!data||busy||result.done||inFlight.current)return;
  if(player&&guesses.some(g=>normalize(g)===normalize(player))){setNotice('سبق أن اخترت هذا اللاعب');return;}
  const next=player?[...guesses,player]:guesses;const token=request.current;inFlight.current=true;setBusy(true);setNotice('');
  try{
   const response=await fetch('/api/missing-player',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:data.question.challengeId,mode,guesses:next,surrender})});const value=await response.json() as Result&{error?:string};if(token!==request.current)return;if(!response.ok)throw Error(value.error||'تعذر التحقق من الإجابة');
   setResult(value);setGuesses(next);setNotice(value.won?'إجابة صحيحة! اكتملت التشكيلة.':value.done?'انتهت الجولة. هذا هو اللاعب المفقود.':'إجابة غير صحيحة. بقيت '+value.remaining+' محاولة.');
   try{
    if(mode==='daily')localStorage.setItem('cdlar-missing-v1-'+data.day,JSON.stringify({id:data.question.challengeId,guesses:next,surrender}));
    if(value.done){
     const completion='cdlar-missing-counted-'+(mode==='daily'?data.day:round.current);
     if(!localStorage.getItem(completion)){
      const previous=JSON.parse(localStorage.getItem(statsKey)||'null') as Stats|null;const prior=previous||emptyStats;const streak=mode==='daily'?(value.won?(prior.lastDay===data.day-1?prior.streak+1:1):0):prior.streak;
      const updated={played:prior.played+1,wins:prior.wins+(value.won?1:0),streak,best:Math.max(prior.best,streak),lastDay:mode==='daily'?data.day:prior.lastDay};localStorage.setItem(completion,'1');localStorage.setItem(statsKey,JSON.stringify(updated));setStats(updated);
     }
    }
   }catch{setNotice('اكتملت المحاولة، لكن المتصفح لا يسمح بحفظ التقدم');}
  }catch(e){setNotice(e instanceof Error?e.message:'تعذر الاتصال. لم تُحتسب محاولة.');}finally{inFlight.current=false;if(token===request.current)setBusy(false);}
 }

 return <><SiteHeader rulesOpen={rules} onRules={()=>setRules(!rules)}/><main className="missing-page">
 <a className="back-link" href="/"><ArrowRight size={15}/> كل الألعاب</a><div className="section-heading"><div><span className="eyebrow">اسم واحد يكمل الفريق</span><h1>اللاعب المفقود</h1><p className="muted">تعرف زملاءه. هل تتذكر اسمه؟ ثلاث محاولات لإكمال التشكيلة.</p></div><span className="tag">اللعبة الثانية</span></div>
 <section className="stats">{[[Target,stats.played,'جولات لعبتها'],[Check,stats.wins,'إجابات صحيحة'],[Flame,stats.streak,'سلسلتك اليومية'],[Trophy,stats.best,'أفضل سلسلة']].map(([Icon,n,label]:any)=><div key={label}><Icon size={20}/><b>{n}</b><span>{label}</span></div>)}</section>
 {rules&&<section className="rules" id="game-rules"><h2>كيف تلعب؟</h2><p>شاهد أسماء وصور زملاء اللاعب في البطولة المحددة، ثم اختر الاسم المفقود. لديك ثلاث محاولات مختلفة. الإجابة من أول محاولة تمنحك 300 نقطة، والثانية 200، والثالثة 100. تنتهي الجولة بعد ثلاث إجابات خاطئة أو الاستسلام. يتغير تحدي اليوم عند منتصف الليل UTC، ويُحفظ تقدمه على هذا المتصفح بشكل مستقل عن لعبة التشكيلة.</p><button onClick={()=>setRules(false)}>إغلاق</button></section>}
 <div className="arena-layout missing-arena"><section className="arena"><div className="tabs"><button disabled={busy} className={mode==='daily'?'selected':''} onClick={()=>load()}><Clock3 size={16}/> تحدي اليوم</button><button disabled={busy} className={mode==='practice'?'selected':''} onClick={()=>load('practice')}><Shuffle size={16}/> العب بلا حدود</button><span dir="ltr">{data?.date} · UTC</span></div><div className="game-content">
 {mode==='practice'&&<div className="season-filter"><label htmlFor="missing-season">الموسم</label><select id="missing-season" disabled={busy} value={season} onChange={e=>{setSeason(e.target.value);load('practice',e.target.value)}}><option value="">كل المواسم</option><option value="2017">2017 · IW</option><option value="2018">2018 · WWII</option><option value="2019">2019 · BO4</option><option value="2020">2020 · MW</option><option value="2021">2021 · CW</option><option value="2022">2022 · Vanguard</option><option value="2023">2023 · MWII</option><option value="2024">2024 · MWIII</option><option value="2025">2025 · BO6</option><option value="2026">2026 · BO7</option></select></div>}
 <div className="game-meta"><span>اللاعب المفقود · {mode==='daily'?'التحدي اليومي':'تدريب'}</span><span dir="ltr">CWL / {data?.question.season}</span></div><h3 dir="ltr">{data?.question.team||'جارٍ تحميل الفريق…'}</h3><p className="subtitle"><b dir="ltr">{data?.question.title}</b><span>•</span><span dir="ltr">{data?.question.event}</span></p><p className="period" dir="ltr">{data?.question.startDate} — {data?.question.endDate}</p>
 <div className={'slots '+(data?.question.rosterSize===5?'five':'')}>{(data?.question.slots||[null,null,null,null]).map((teammate,i)=>{const p=teammate||(result.done?result.answer:undefined);return <div className={'slot '+(p?'filled':'missing-slot')+(!teammate&&result.done?' revealed-slot':'')} key={i}><span className="slot-number">0{i+1}</span>{p?<PlayerPortrait key={p} handle={p}/>:<Users size={36}/>}<b dir="ltr">{p||'?'}</b><small>{teammate?'زميل في الفريق':result.done?'اللاعب المفقود':'من اللاعب؟'}</small></div>})}</div>
 {!result.done&&data?<><div className="attempt-track" aria-label={'المحاولات المتبقية: '+result.remaining}><span>المحاولات المتبقية</span>{[0,1,2].map(i=><b key={i} className={i<result.attempts?'used':''}>{i+1}</b>)}</div><PlayerSearch key={data.question.challengeId} players={data.players} guesses={guesses} disabled={busy} onGuess={p=>play(p)}/><div className="game-tools"><span>الإجابة من أول محاولة: <b>300 نقطة</b></span><button disabled={busy} onClick={()=>play(undefined,true)}>استسلام وكشف اللاعب</button></div></>:result.done?<div className="completed"><h2>{result.won?'عرفت اللاعب!':'التشكيلة اكتملت'}</h2><p><b dir="ltr">{result.answer}</b> · النتيجة: <b>{result.score}/300</b></p>{data&&<GameResultShare submission={{game:'missing-player',id:data.question.challengeId,guesses:guesses,surrender:!result.won&&result.attempts<3,mode,date:data.date}} card={{game:'missing-player',title:'اللاعب المفقود',date:data.date,mode,won:result.won,score:result.score,maxScore:result.maxScore,summary:'المحاولات: '+n(result.attempts)+' من '+n(3),subject:data.question.team,players:data.question.slots.map(p=>p||result.answer).filter((p):p is string=>!!p).map(p=>({handle:p,tag:p===result.answer?(result.won?'عرفته':'الحل'):'زميله',correct:p!==result.answer||result.won}))}}/>}<button className="secondary" disabled={busy} onClick={()=>load('practice')}>جولة أخرى</button></div>:<button className="secondary" disabled={busy} onClick={()=>load(mode)}>{busy?'جارٍ التحميل…':'إعادة المحاولة'}</button>}
 <div className="notice" role="status" aria-live="polite">{notice}</div>{guesses.length>0&&<div className="guess-history">{guesses.map(g=><span key={g} dir="ltr" className={result.answer&&normalize(g)===normalize(result.answer)?'right':'wrong'}>{g} {result.answer&&normalize(g)===normalize(result.answer)?'✓':'×'}</span>)}</div>}
 </div></section>
 </div>
 <SiteFooter/></main></>
}
