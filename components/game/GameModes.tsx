'use client';
import {Clock3,Shuffle,ArrowLeft} from 'lucide-react';

type Mode='daily'|'practice';
type Props={mode:Mode;disabled?:boolean;date?:string;onModeChange:(mode:Mode)=>void};
export default function GameModes({mode,disabled=false,date,onModeChange}:Props){
 return <div className="game-modes">
  <div className="game-mode-choices" role="group" aria-label="طريقة اللعب">
   <button type="button" className={'game-mode-choice'+(mode==='daily'?' is-active':'')} aria-pressed={mode==='daily'} disabled={disabled} onClick={()=>onModeChange('daily')}>
    <span className="game-mode-label"><Clock3 size={22} aria-hidden="true"/><strong>تحدي اليوم</strong></span>
    <span className="game-mode-description">تحدٍ واحد يتجدد يومياً</span>
   </button>
   <button type="button" className={'game-mode-choice'+(mode==='practice'?' is-active':'')} aria-pressed={mode==='practice'} disabled={disabled} onClick={()=>onModeChange('practice')}>
    <span className="game-mode-label"><Shuffle size={22} aria-hidden="true"/><strong>العب بلا حدود</strong></span>
    <span className="game-mode-description">جولات جديدة بدون انتظار</span>
   </button>
  </div>
  <p className="game-mode-date" aria-label="تاريخ الجولة بالتوقيت العالمي">{date&&<><time dateTime={date} dir="ltr">{date}</time><span aria-hidden="true">·</span><span dir="ltr">UTC</span></>}</p>
 </div>;
}
export function PlayAgainButton({disabled=false,onClick}:{disabled?:boolean;onClick:()=>void}){
 return <button type="button" className="primary play-again" disabled={disabled} onClick={onClick}><Shuffle size={20} aria-hidden="true"/><span>العب جولة أخرى</span><ArrowLeft size={18} aria-hidden="true"/></button>;
}
