'use client';
import {reconcileDailyStreak} from '../../lib/game/streak';
import {useDailyStreak} from '../../lib/game/use-daily-streak';
import GameResultShare from '../../components/game/GameResultShare';
import {arabicNumber as n} from '../../lib/sharing/roster-share';
import {SiteHeader,SiteFooter} from '../../components/game/SiteChrome';
import {useEffect,useRef,useState} from 'react';
import {Crosshair,Clock3,Shuffle,Share2,Target,Trophy,Flame,ArrowRight,ArrowUp,ArrowDown,GripVertical,Check} from 'lucide-react';
import PlayerPortrait from '../../components/game/PlayerPortrait';
type Payload={question:{id:string;players:string[];direction:string};day:number;date:string;coverage:{puzzles:number;players:number}};
type Result={done:boolean;won:boolean;correctPositions:number;score:number;maxScore:number;submitted:{handle:string;birthDate:string;position:number;correctPosition:number;isCorrect:boolean}[];answers:{handle:string;birthDate:string;position:number;sources:string[]}[]};
type Stats={played:number;wins:number;streak:number;best:number;lastDay:number};
const empty:Stats={played:0,wins:0,streak:0,best:0,lastDay:0},statsKey='cdlar-ranking-stats-v1';
const dateLabel=(date:string)=>new Intl.DateTimeFormat('ar',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(date+'T00:00:00Z'));
export default function Ranking(){
 const [data,setData]=useState<Payload>(),[mode,setMode]=useState<'daily'|'practice'>('daily'),[order,setOrder]=useState<string[]>([]),[result,setResult]=useState<Result>(),[busy,setBusy]=useState(true),[notice,setNotice]=useState(''),[stats,setStats]=useState<Stats>(empty),[rules,setRules]=useState(false);
 const request=useRef(0),inFlight=useRef(false),round=useRef(''),dragged=useRef<string|null>(null);
 async function load(nextMode:'daily'|'practice'='daily'){
  const token=++request.current;setBusy(true);setNotice('');dragged.current=null;
  try{
   const params=new URLSearchParams({mode:nextMode});if(data)params.set('exclude',data.question.id);
   const response=await fetch('/api/ranking?'+params);if(!response.ok)throw Error('تعذر تحميل التحدي. حاول مرة أخرى.');const payload=await response.json() as Payload;if(token!==request.current)return;
   setData(payload);setMode(nextMode);setOrder(payload.question.players);setResult(undefined);round.current=crypto.randomUUID();
   if(nextMode==='daily')try{
    const saved=JSON.parse(localStorage.getItem('cdlar-ranking-v1-'+payload.day)||'null');
    if(saved?.id===payload.question.id){const check=await fetch('/api/ranking',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...saved,mode:'daily'})});if(check.ok&&token===request.current){setResult(await check.json());setOrder(saved.order);}}
    else{const draft=JSON.parse(localStorage.getItem('cdlar-ranking-draft-'+payload.day)||'null');if(draft?.id===payload.question.id&&Array.isArray(draft.order)&&draft.order.length===5&&new Set(draft.order).size===5&&draft.order.every((p:string)=>payload.question.players.includes(p)))setOrder(draft.order);}
   }catch{setNotice('تعذر استعادة الترتيب المحفوظ');}
  }catch(e){if(token===request.current)setNotice(e instanceof Error?e.message:'تعذر تحميل التحدي');}finally{if(token===request.current)setBusy(false);}
 }
 useDailyStreak(setStats);
 useEffect(()=>{try{setStats(reconcileDailyStreak(JSON.parse(localStorage.getItem(statsKey)||'null')||empty))}catch{}load();return()=>{request.current++}},[]);
 function updateOrder(next:string[]){setOrder(next);if(mode==='daily'&&data)try{localStorage.setItem('cdlar-ranking-draft-'+data.day,JSON.stringify({id:data.question.id,order:next}))}catch{}}
 function move(from:number,to:number){if(busy||result||from===to||from<0||to<0||from>=order.length||to>=order.length)return;const next=[...order],[name]=next.splice(from,1);next.splice(to,0,name);updateOrder(next);setNotice('تم نقل '+name+' إلى المركز '+(to+1));}
 function shuffle(){if(busy||result)return;const next=[...order];for(let i=next.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[next[i],next[j]]=[next[j],next[i]];}updateOrder(next);setNotice('تم خلط الترتيب');}
 async function submit(){
  if(!data||busy||result||inFlight.current||order.length!==5)return;const token=request.current,submitted=[...order];inFlight.current=true;setBusy(true);setNotice('');
  try{
   const response=await fetch('/api/ranking',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:data.question.id,mode,order:submitted})});const value=await response.json() as Result&{error?:string};if(token!==request.current)return;if(!response.ok)throw Error(value.error||'تعذر التحقق من الترتيب');setResult(value);setNotice(value.won?'ترتيب كامل وصحيح!':'أصبت '+value.correctPositions+' من خمسة مراكز. شاهد الترتيب الصحيح أدناه.');
   try{
    if(mode==='daily')localStorage.setItem('cdlar-ranking-v1-'+data.day,JSON.stringify({id:data.question.id,order:submitted}));
    const completion='cdlar-ranking-counted-'+(mode==='daily'?data.day:round.current);
    if(!localStorage.getItem(completion)){const p=JSON.parse(localStorage.getItem(statsKey)||'null') as Stats|null,prior=reconcileDailyStreak(p||empty),streak=mode==='daily'?(value.won?(prior.lastDay===data.day-1?prior.streak+1:1):0):prior.streak,updated={played:prior.played+1,wins:prior.wins+(value.won?1:0),streak,best:Math.max(prior.best,streak),lastDay:mode==='daily'?data.day:prior.lastDay};localStorage.setItem(completion,'1');localStorage.setItem(statsKey,JSON.stringify(updated));setStats(updated);}
   }catch{setNotice('اكتمل التحدي، لكن تعذر حفظ التقدم على هذا المتصفح');}
  }catch(e){setNotice(e instanceof Error?e.message:'تعذر الاتصال. لم يُرسل ترتيبك.');}finally{inFlight.current=false;if(token===request.current)setBusy(false);}
 }

 return <><SiteHeader rulesOpen={rules} onRules={()=>setRules(!rules)}/><main className="missing-page ranking-page">
 <a className="back-link" href="/"><ArrowRight size={15}/> كل الألعاب</a><div className="section-heading"><div><span className="eyebrow">خمسة لاعبين. ترتيب واحد.</span><h1>رتّبهم</h1><p className="muted">من الأكبر إلى الأصغر عمراً. رتّب الأسماء ثم أرسل إجابتك النهائية.</p></div><span className="tag">اللعبة الخامسة</span></div>
 <section className="stats">{[[Target,stats.played,'جولات لعبتها'],[Check,stats.wins,'ترتيبات مكتملة'],[Flame,stats.streak,'سلسلتك اليومية'],[Trophy,stats.best,'أفضل سلسلة']].map(([Icon,n,label]:any)=><div key={label}><Icon size={20}/><b>{n}</b><span>{label}</span></div>)}</section>
 {rules&&<section className="rules" id="game-rules"><h2>كيف تلعب؟</h2><p>حرّك اللاعبين بالأسهم أو اسحب البطاقات. المركز الأول للأكبر عمراً، والخامس للأصغر. نقارن تواريخ الميلاد الكاملة، وليس العمر بالسنوات فقط. كل لاعب في مركزه الصحيح يمنحك 100 نقطة، والحد الأقصى 500. لديك إرسال نهائي واحد لكل جولة، وبعده تظهر الإجابة وتواريخ الميلاد. يمكن تعديل الترتيب بحرية قبل الإرسال. تُستبعد تواريخ الميلاد المتطابقة من اللغز نفسه. تحدي اليوم يتغير عند منتصف الليل UTC ويُحفظ على هذا المتصفح.</p><button onClick={()=>setRules(false)}>إغلاق</button></section>}
 <div className="arena-layout missing-arena"><section className="arena"><div className="tabs"><button disabled={busy} className={mode==='daily'?'selected':''} onClick={()=>load()}><Clock3 size={16}/> تحدي اليوم</button><button disabled={busy} className={mode==='practice'?'selected':''} onClick={()=>load('practice')}><Shuffle size={16}/> العب بلا حدود</button><span dir="ltr">{data?.date} · UTC</span></div><div className="game-content">
 <div className="game-meta"><span>{mode==='daily'?'الترتيب اليومي':'تدريب'}</span><span>الأكبر أولاً</span></div><h3>من الأكبر إلى الأصغر</h3><p className="subtitle ranking-instruction">المركز 1 للأكبر · المركز 5 للأصغر</p>
 {!result&&<><ol className="ranking-list" aria-label="ترتيبك من الأكبر إلى الأصغر">{order.map((p,i)=><li className="ranking-card" key={p} draggable={!busy} onDragStart={e=>{dragged.current=p;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',p)}} onDragEnd={()=>{dragged.current=null}} onDragOver={e=>{if(!busy&&dragged.current)e.preventDefault()}} onDrop={e=>{e.preventDefault();if(dragged.current){move(order.indexOf(dragged.current),i);dragged.current=null}}}><span className="rank-number">{i+1}</span><PlayerPortrait handle={p}/><div className="ranking-name"><b dir="ltr">{p}</b><small>{i===0?'الأكبر':i===4?'الأصغر':'حرّك لتغيّر المركز'}</small></div><div className="ranking-moves"><button aria-label={'نقل '+p+' إلى أعلى'} title="إلى أعلى" disabled={busy||i===0} onClick={()=>move(i,i-1)}><ArrowUp size={18}/></button><button aria-label={'نقل '+p+' إلى أسفل'} title="إلى أسفل" disabled={busy||i===4} onClick={()=>move(i,i+1)}><ArrowDown size={18}/></button></div><GripVertical className="drag-grip" size={19} aria-hidden="true"/></li>)}</ol>{data&&<><div className="ranking-actions"><button className="secondary" disabled={busy} onClick={shuffle}><Shuffle size={16}/> خلط الترتيب</button><button className="primary" disabled={busy||order.length!==5} onClick={submit}>أرسل ترتيبي النهائي</button></div><p className="ranking-final-note">بعد الإرسال تظهر تواريخ الميلاد، ولا يمكن تعديل الإجابة في هذه الجولة.</p></>}{!data&&<button className="secondary" disabled={busy} onClick={()=>load(mode)}>{busy?'جارٍ تحميل اللاعبين…':'إعادة المحاولة'}</button>}</>}
 <div className="notice" role="status" aria-live="polite">{notice}</div>
 {result&&<><div className="completed"><h2>{result.won?'رتّبتهم كلهم!':result.correctPositions+' من 5 مراكز صحيحة'}</h2><p>النتيجة: <b>{result.score}/500</b></p>{data&&<GameResultShare submission={{game:'ranking',id:data.question.id,guesses:result.submitted.map(p=>p.handle),surrender:false,mode,date:data.date}} card={{game:'ranking',title:'رتّبهم',date:data.date,mode,won:result.won,score:result.score,maxScore:result.maxScore,summary:'المراكز الصحيحة: '+n(result.correctPositions)+' من '+n(5),subject:'إجابتي من الأكبر إلى الأصغر',players:result.submitted.map(p=>({handle:p.handle,tag:'المركز '+n(p.position)+(p.isCorrect?' · صحيح':' · الصحيح '+n(p.correctPosition)),correct:p.isCorrect}))}}/>}<button className="secondary" disabled={busy} onClick={()=>load('practice')}>جولة أخرى</button></div><h4 className="ranking-result-title">إجابتك</h4><ol className="ranking-list submitted-ranking">{result.submitted.map(p=><li className={'ranking-card '+(p.isCorrect?'right-position':'wrong-position')} key={p.handle}><span className="rank-number">{p.position}</span><PlayerPortrait handle={p.handle}/><div className="ranking-name"><b dir="ltr">{p.handle}</b><small>{dateLabel(p.birthDate)}</small></div><span className="ranking-position-note">{p.isCorrect?'مركز صحيح':'الصحيح: '+p.correctPosition}</span></li>)}</ol><h4 className="ranking-result-title">الترتيب الصحيح — الأكبر أولاً</h4><ol className="ranking-list correct-ranking">{result.answers.map(p=><li className="ranking-card" key={p.handle}><span className="rank-number">{p.position}</span><PlayerPortrait handle={p.handle}/><div className="ranking-name"><b dir="ltr">{p.handle}</b><small>{dateLabel(p.birthDate)}</small></div></li>)}</ol></>}
 </div></section>
 </div>
 <SiteFooter/></main></>
}
