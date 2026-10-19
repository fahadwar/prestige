'use client';
import {reconcileDailyStreak} from '../../lib/game/streak';
import {useDailyStreak} from '../../lib/game/use-daily-streak';
import GameResultShare from '../../components/game/GameResultShare';
import {arabicNumber as n} from '../../lib/sharing/roster-share';
import {SiteHeader,SiteFooter} from '../../components/game/SiteChrome';
import {useEffect,useRef,useState} from 'react';
import {Crosshair,Users,Clock3,Shuffle,Share2,Target,Trophy,Flame,ArrowRight,Check} from 'lucide-react';
import PlayerPortrait from '../../components/game/PlayerPortrait';
type Question={id:string;team:string;players:string[];rosterSize:number};
type Payload={question:Question;seasons:number[];day:number;date:string};
type Result={won:boolean;done:boolean;attempts:number;remaining:number;score:number;maxScore:number;rows:{season:number;direction:'correct'|'earlier'|'later'}[];answer?:{season:number;evidence:{rosterId:string;event:string;startDate:string;endDate:string;source:string}[]}};
type Stats={played:number;wins:number;streak:number;best:number;lastDay:number};
const initial:Result={won:false,done:false,attempts:0,remaining:3,score:0,maxScore:300,rows:[]};
const emptyStats:Stats={played:0,wins:0,streak:0,best:0,lastDay:0};
const statsKey='cdlar-time-stats-v1';
export default function TimeMachine(){
 const [data,setData]=useState<Payload>(),[mode,setMode]=useState<'daily'|'practice'>('daily'),[season,setSeason]=useState<number>(),[guesses,setGuesses]=useState<number[]>([]),[result,setResult]=useState<Result>(initial),[busy,setBusy]=useState(true),[notice,setNotice]=useState(''),[stats,setStats]=useState<Stats>(emptyStats),[rules,setRules]=useState(false);
 const request=useRef(0),inFlight=useRef(false),round=useRef('');
 async function load(nextMode:'daily'|'practice'='daily'){
  const token=++request.current;setBusy(true);setNotice('');
  try{
   const params=new URLSearchParams({mode:nextMode});if(data)params.set('exclude',data.question.id);
   const response=await fetch('/api/time-machine?'+params);if(!response.ok)throw Error('تعذر تحميل التحدي. حاول مرة أخرى.');const payload=await response.json() as Payload;if(token!==request.current)return;
   setData(payload);setMode(nextMode);setGuesses([]);setSeason(undefined);setResult(initial);round.current=crypto.randomUUID();
   if(nextMode==='daily'){
    try{
     const saved=JSON.parse(localStorage.getItem('cdlar-time-v1-'+payload.day)||'null');
     if(saved?.id===payload.question.id){const check=await fetch('/api/time-machine',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...saved,mode:'daily'})});if(check.ok&&token===request.current){setResult(await check.json() as Result);setGuesses(saved.guesses);}}
    }catch{setNotice('المتصفح لا يسمح باستعادة التقدم المحفوظ');}
   }
  }catch(e){if(token===request.current)setNotice(e instanceof Error?e.message:'تعذر تحميل التحدي');}finally{if(token===request.current)setBusy(false);}
 }
 useDailyStreak(setStats);
 useEffect(()=>{try{setStats(reconcileDailyStreak(JSON.parse(localStorage.getItem(statsKey)||'null')||emptyStats))}catch{}load();return()=>{request.current++}},[]);
 async function play(year?:number,surrender=false){
  if(!data||busy||result.done||inFlight.current)return;
  if(year&&guesses.includes(year)){setNotice('سبق أن اخترت هذا الموسم');return;}
  const next=year?[...guesses,year]:guesses;const token=request.current;inFlight.current=true;setBusy(true);setNotice('');
  try{
   const response=await fetch('/api/time-machine',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:data.question.id,mode,guesses:next,surrender})});const value=await response.json() as Result&{error?:string};if(token!==request.current)return;if(!response.ok)throw Error(value.error||'تعذر التحقق من الإجابة');
   setResult(value);setGuesses(next);setNotice(value.won?'إجابة صحيحة! عرفت الموسم.':value.done?'انتهت الجولة. هذا هو الموسم الصحيح.':'إجابة غير صحيحة. بقيت '+value.remaining+' محاولة.');
   try{
    if(mode==='daily')localStorage.setItem('cdlar-time-v1-'+data.day,JSON.stringify({id:data.question.id,guesses:next,surrender}));
    if(value.done){
     const completion='cdlar-time-counted-'+(mode==='daily'?data.day:round.current);
     if(!localStorage.getItem(completion)){
      const previous=JSON.parse(localStorage.getItem(statsKey)||'null') as Stats|null;const prior=reconcileDailyStreak(previous||emptyStats);const streak=mode==='daily'?(value.won?(prior.lastDay===data.day-1?prior.streak+1:1):0):prior.streak;
      const updated={played:prior.played+1,wins:prior.wins+(value.won?1:0),streak,best:Math.max(prior.best,streak),lastDay:mode==='daily'?data.day:prior.lastDay};localStorage.setItem(completion,'1');localStorage.setItem(statsKey,JSON.stringify(updated));setStats(updated);
     }
    }
   }catch{setNotice('اكتملت المحاولة، لكن المتصفح لا يسمح بحفظ التقدم');}
  }catch(e){setNotice(e instanceof Error?e.message:'تعذر الاتصال. لم تُحتسب محاولة.');}finally{inFlight.current=false;if(token===request.current)setBusy(false);}
 }

 return <><SiteHeader rulesOpen={rules} onRules={()=>setRules(!rules)}/><main className="missing-page">
 <a className="back-link" href="/"><ArrowRight size={15}/> كل الألعاب</a><div className="section-heading"><div><span className="eyebrow">فريق واحد. في أي موسم؟</span><h1>آلة الزمن</h1><p className="muted">التشكيلة كاملة أمامك. اختر الموسم خلال ثلاث محاولات.</p></div><span className="tag">اللعبة السادسة</span></div>
 <section className="stats">{[[Target,stats.played,'جولات لعبتها'],[Check,stats.wins,'إجابات صحيحة'],[Flame,stats.streak,'سلسلتك اليومية'],[Trophy,stats.best,'أفضل سلسلة']].map(([Icon,n,label]:any)=><div key={label}><Icon size={20}/><b>{n}</b><span>{label}</span></div>)}</section>
 {rules&&<section className="rules" id="game-rules"><h2>كيف تلعب؟</h2><p>اختر موسم التشكيلة، وليس سنة التقاط الصورة. لديك ثلاث محاولات مختلفة. التلميح يخبرك إن كان الموسم أقدم أو أحدث. 300 نقطة من الأولى، 200 من الثانية، 100 من الثالثة. نستبعد أي تشكيلة ظهرت في أكثر من موسم داخل أرشيفنا، حتى تحت اسم فريق مختلف. قد يبدأ الموسم في السنة السابقة. يتغير التحدي عند منتصف الليل UTC. الإحصائيات محلية وغير مصنفة.</p><button onClick={()=>setRules(false)}>إغلاق</button></section>}
 <div className="arena-layout missing-arena"><section className="arena"><div className="tabs"><button disabled={busy} className={mode==='daily'?'selected':''} onClick={()=>load()}><Clock3 size={16}/> تحدي اليوم</button><button disabled={busy} className={mode==='practice'?'selected':''} onClick={()=>load('practice')}><Shuffle size={16}/> العب بلا حدود</button><span dir="ltr">{data?.date} · UTC</span></div><div className="game-content">
 <div className="game-meta"><span>آلة الزمن · {mode==='daily'?'التحدي اليومي':'تدريب'}</span><span>{data?'284 سؤالاً':'جارٍ التحميل'}</span></div><h3 dir="ltr">{data?.question.team||'جارٍ تحميل الفريق…'}</h3><p className="subtitle">في أي موسم لعبت هذه التشكيلة مع هذا الفريق؟</p>
 <div className={'slots '+(data?.question.rosterSize===5?'five':'')}>{(data?.question.players||[]).map((p,i)=><div className="slot filled" key={p}><span className="slot-number">0{i+1}</span><PlayerPortrait handle={p}/><b dir="ltr">{p}</b></div>)}</div><p className="muted">الصور قد تكون من موسم مختلف؛ اعتمد على أسماء التشكيلة.</p>
 {!result.done&&data?<><div className="attempt-track" aria-label={'المحاولات المتبقية: '+result.remaining}><span>المحاولات المتبقية</span>{[0,1,2].map(i=><b key={i} className={i<result.attempts?'used':''}>{i+1}</b>)}</div><div className="time-season-grid" aria-label="اختر الموسم">{data.seasons.map(y=><button key={y} disabled={busy||guesses.includes(y)} aria-pressed={season===y} className={season===y?'selected':''} onClick={()=>setSeason(y)}>{y}{guesses.includes(y)?' ×':''}</button>)}</div><button className="primary" disabled={busy||!season||guesses.includes(season)} onClick={()=>{if(season)play(season)}}>تأكيد الموسم {season||''}</button><div className="game-tools"><span>الإجابة من أول محاولة: <b>300 نقطة</b></span><button disabled={busy} onClick={()=>play(undefined,true)}>استسلام وكشف الموسم</button></div></>:result.done?<div className="completed"><h2>{result.won?'عرفت الموسم!':'الموسم الصحيح'}</h2><p><b>{result.answer?.season}</b> · النتيجة: <b>{result.score}/300</b></p>{data&&<GameResultShare submission={{game:'time-machine',id:data.question.id,guesses:guesses,surrender:!result.won&&result.attempts<3,mode,date:data.date}} card={{game:'time-machine',title:'آلة الزمن',date:data.date,mode,won:result.won,score:result.score,maxScore:result.maxScore,summary:'المحاولات: '+n(result.attempts)+' من '+n(3),subject:data.question.team+' · '+(result.answer?.season||''),players:data.question.players.map(p=>({handle:p,tag:result.won?'الموسم صحيح':'تم كشف الموسم',correct:result.won}))}}/>}<button className="secondary" disabled={busy} onClick={()=>load('practice')}>جولة أخرى</button></div>:<button className="secondary" disabled={busy} onClick={()=>load(mode)}>{busy?'جارٍ التحميل…':'إعادة المحاولة'}</button>}
 <div className="notice" role="status" aria-live="polite">{notice}</div><div className="guess-history">{result.rows.map(r=><span key={r.season} className={r.direction==='correct'?'right':'wrong'}>{r.season} · {r.direction==='correct'?'صحيح ✓':r.direction==='earlier'?'الموسم أقدم':'الموسم أحدث'}</span>)}</div>
 </div></section>
 </div>
 <SiteFooter/></main></>
}
