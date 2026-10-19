'use client';
import GameResultShare from '../../components/game/GameResultShare';
import {arabicNumber as n} from '../../lib/sharing/roster-share';
import {SiteHeader,SiteFooter} from '../../components/game/SiteChrome';
import {useEffect,useRef,useState} from 'react';
import {Crosshair,UserRound,Clock3,Shuffle,Share2,Target,Trophy,Flame,ArrowRight,Check} from 'lucide-react';
import PlayerPortrait from '../../components/game/PlayerPortrait';
import PlayerSearch from '../../components/game/PlayerSearch';
import {normalize} from '../../lib/game/identity';
type Profile={handle:string;age:number;countryCode:string;country:string;role:string;team:string;teamBasis:string;teamDate:string;sources:string[]};
type GuessRow=Profile&{correct:boolean;matches:{country:boolean;age:'older'|'younger'|'equal';role:boolean;team:boolean}};
type Payload={question:{id:string;referenceDate:string};players:string[];day:number;date:string;coverage:{players:number;referenceDate:string}};
type Result={won:boolean;done:boolean;attempts:number;remaining:number;score:number;maxScore:number;rows:GuessRow[];answer?:Profile};
type Stats={played:number;wins:number;streak:number;best:number;lastDay:number};
const initial:Result={won:false,done:false,attempts:0,remaining:6,score:0,maxScore:600,rows:[]};
const emptyStats:Stats={played:0,wins:0,streak:0,best:0,lastDay:0};
const statsKey='cdlar-guess-stats-v1';
export default function GuessPlayer(){
 const [data,setData]=useState<Payload>(),[mode,setMode]=useState<'daily'|'practice'>('daily'),[guesses,setGuesses]=useState<string[]>([]),[result,setResult]=useState<Result>(initial),[busy,setBusy]=useState(true),[notice,setNotice]=useState(''),[stats,setStats]=useState<Stats>(emptyStats),[rules,setRules]=useState(false);
 const request=useRef(0),inFlight=useRef(false),round=useRef('');
 async function load(nextMode:'daily'|'practice'='daily'){
  const token=++request.current;setBusy(true);setNotice('');
  try{
   const params=new URLSearchParams({mode:nextMode});if(data)params.set('exclude',data.question.id);
   const response=await fetch('/api/guess-player?'+params);if(!response.ok)throw Error('تعذر تحميل التحدي. حاول مرة أخرى.');const payload=await response.json() as Payload;if(token!==request.current)return;
   setData(payload);setMode(nextMode);setGuesses([]);setResult(initial);round.current=crypto.randomUUID();
   if(nextMode==='daily'){
    try{
     const saved=JSON.parse(localStorage.getItem('cdlar-guess-v1-'+payload.day)||'null');
     if(saved?.id===payload.question.id){const check=await fetch('/api/guess-player',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...saved,mode:'daily'})});if(check.ok&&token===request.current){setResult(await check.json() as Result);setGuesses(saved.guesses);}}
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
   const response=await fetch('/api/guess-player',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:data.question.id,mode,guesses:next,surrender})});const value=await response.json() as Result&{error?:string};if(token!==request.current)return;if(!response.ok)throw Error(value.error||'تعذر التحقق من الإجابة');
   setResult(value);setGuesses(next);setNotice(value.won?'عرفت اللاعب!':value.done?'انتهت الجولة. هذا هو اللاعب المطلوب.':'قارن الصفات، ثم جرّب اسماً آخر. بقيت '+value.remaining+' محاولة.');
   try{
    if(mode==='daily')localStorage.setItem('cdlar-guess-v1-'+data.day,JSON.stringify({id:data.question.id,guesses:next,surrender}));
    if(value.done){
     const completion='cdlar-guess-counted-'+(mode==='daily'?data.day:round.current);
     if(!localStorage.getItem(completion)){
      const previous=JSON.parse(localStorage.getItem(statsKey)||'null') as Stats|null;const prior=previous||emptyStats;const streak=mode==='daily'?(value.won?(prior.lastDay===data.day-1?prior.streak+1:1):0):prior.streak;
      const updated={played:prior.played+1,wins:prior.wins+(value.won?1:0),streak,best:Math.max(prior.best,streak),lastDay:mode==='daily'?data.day:prior.lastDay};localStorage.setItem(completion,'1');localStorage.setItem(statsKey,JSON.stringify(updated));setStats(updated);
     }
    }
   }catch{setNotice('اكتملت المحاولة، لكن المتصفح لا يسمح بحفظ التقدم');}
  }catch(e){setNotice(e instanceof Error?e.message:'تعذر الاتصال. لم تُحتسب محاولة.');}finally{inFlight.current=false;if(token===request.current)setBusy(false);}
 }

 return <><SiteHeader rulesOpen={rules} onRules={()=>setRules(!rules)}/><main className="missing-page guess-page">
 <a className="back-link" href="/"><ArrowRight size={15}/> كل الألعاب</a><div className="section-heading"><div><span className="eyebrow">كل محاولة تقرّبك من الاسم.</span><h1>من اللاعب؟</h1><p className="muted">ست محاولات. قارن البلد والعمر والدور والفريق لتكتشف اللاعب.</p></div><span className="tag">اللعبة الرابعة</span></div>
 <section className="stats">{[[Target,stats.played,'جولات لعبتها'],[Check,stats.wins,'إجابات صحيحة'],[Flame,stats.streak,'سلسلتك اليومية'],[Trophy,stats.best,'أفضل سلسلة']].map(([Icon,n,label]:any)=><div key={label}><Icon size={20}/><b>{n}</b><span>{label}</span></div>)}</section>
 {rules&&<section className="rules" id="game-rules"><h2>كيف تلعب؟</h2><p>اختر اسماً من قائمة اللاعبين الموثقين. بعد كل محاولة تظهر صفات اللاعب الذي اخترته: البلد والعمر والدور والفريق. الأخضر يعني أن الصفة تطابق اللاعب المطلوب. سهم ↑ يعني أن اللاعب المطلوب أكبر عمراً، وسهم ↓ يعني أنه أصغر. تساوي العمر يعني نفس عدد السنوات، وليس نفس تاريخ الميلاد. يجب أن تجد الاسم الصحيح حتى لو تطابقت الصفات. البلد هو البلد الرئيسي المسجل في الملف، والدور تصنيف AR أو SMG أو Flex. الفريق هو الفريق الموثق لكل لاعب حسب التاريخ الظاهر، وقد يكون من الأرشيف ولا يمثل فريقه الحالي. تطابق الفريق يعني نفس اسم الفريق. العمر محسوب بتاريخ {data?.question.referenceDate}. لديك ست محاولات؛ الإجابة الصحيحة تمنحك من 600 نقطة في الأولى إلى 100 في السادسة. يتغير تحدي اليوم عند منتصف الليل UTC.</p><button onClick={()=>setRules(false)}>إغلاق</button></section>}
 <div className="arena-layout missing-arena"><section className="arena"><div className="tabs"><button disabled={busy} className={mode==='daily'?'selected':''} onClick={()=>load()}><Clock3 size={16}/> تحدي اليوم</button><button disabled={busy} className={mode==='practice'?'selected':''} onClick={()=>load('practice')}><Shuffle size={16}/> العب بلا حدود</button><span dir="ltr">{data?.date} · UTC</span></div><div className="game-content">
 <div className="game-meta"><span>{mode==='daily'?'التحدي اليومي':'تدريب'}</span><span>ست محاولات</span></div>
 <div className="guess-mystery">{result.done&&result.answer?<PlayerPortrait handle={result.answer.handle}/>:<UserRound size={46}/>}<h3 dir={result.done?'ltr':'rtl'}>{result.answer?.handle||'من اللاعب المخفي؟'}</h3>{result.done&&result.answer?<p>{result.answer.country} · {result.answer.age} سنة · <span dir="ltr">{result.answer.role} · {result.answer.team} ({result.answer.teamDate})</span></p>:<p>ابدأ باسم. كل صفة تكشف لك جزءاً من الحل.</p>}</div>
 <p className="guess-reference">العمر محسوب بتاريخ <b dir="ltr">{data?.question.referenceDate||'2026-10-18'}</b> · الفريق الموثق يظهر مع تاريخه وقد يختلف عن الفريق الحالي.</p>
 {!result.done&&data&&<><div className="attempt-track"><span>المحاولات المتبقية</span>{[0,1,2,3,4,5].map(i=><b key={i} className={i<result.attempts?'used':''}>{i+1}</b>)}</div><PlayerSearch key={data.question.id} players={data.players} guesses={guesses} disabled={busy} onGuess={p=>play(p)}/><div className="game-tools"><span>الإجابة من أول محاولة: <b>600 نقطة</b></span><button disabled={busy} onClick={()=>play(undefined,true)}>استسلام وكشف اللاعب</button></div></>}
 <div className="notice" role="status" aria-live="polite">{notice}</div>
 <div className="guess-results" aria-label="نتائج المقارنات">{result.rows.map(row=><article className={'guess-result-row '+(row.correct?'correct-player':'')} key={row.handle}><div className="guess-name"><PlayerPortrait handle={row.handle}/><b dir="ltr">{row.handle}</b>{row.correct&&<Check size={17}/>}</div><div className={'guess-trait '+(row.matches.country?'match':'different')}><small>البلد</small><b>{row.country}</b><span>{row.matches.country?'مطابق':'مختلف'}</span></div><div className={'guess-trait '+(row.matches.age==='equal'?'match':'age-direction')}><small>العمر</small><b>{row.age} {row.matches.age==='older'?'↑':row.matches.age==='younger'?'↓':'='}</b><span>{row.matches.age==='older'?'الهدف أكبر عمراً':row.matches.age==='younger'?'الهدف أصغر عمراً':'نفس العمر'}</span></div><div className={'guess-trait '+(row.matches.role?'match':'different')}><small>الدور</small><b dir="ltr">{row.role}</b><span>{row.matches.role?'مطابق':'مختلف'}</span></div><div className={'guess-trait '+(row.matches.team?'match':'different')}><small>الفريق الموثق</small><b dir="ltr">{row.team}</b><small dir="ltr">{row.teamDate}</small><span>{row.matches.team?'مطابق':'مختلف'}</span></div></article>)}</div>
 {result.done&&<div className="completed"><h2>{result.won?'عرفت اللاعب!':'انتهت الجولة'}</h2><p>النتيجة: <b>{result.score}/600</b> · المحاولات: {result.attempts}/6</p>{data&&<GameResultShare submission={{game:'guess-player',id:data.question.id,guesses:guesses,surrender:!result.won&&result.attempts<6,mode,date:data.date}} card={{game:'guess-player',title:'من اللاعب؟',date:data.date,mode,won:result.won,score:result.score,maxScore:result.maxScore,summary:'المحاولات: '+n(result.attempts)+' من '+n(6),subject:result.answer?.handle,players:[...result.rows.map((p,i)=>({handle:p.handle,tag:p.correct?'صحيح':'محاولة '+n(i+1),correct:p.correct})),...(result.answer&&!result.rows.some(p=>normalize(p.handle)===normalize(result.answer!.handle))?[{handle:result.answer.handle,tag:'الحل',correct:false}]:[])]}}/>}<button className="secondary" disabled={busy} onClick={()=>load('practice')}>لاعب آخر</button></div>}
 {!data&&<button className="secondary" disabled={busy} onClick={()=>load(mode)}>{busy?'جارٍ تحميل التحدي…':'إعادة المحاولة'}</button>}
 </div></section>
 </div>
 <SiteFooter/></main></>
}
