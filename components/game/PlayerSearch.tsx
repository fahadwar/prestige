'use client';
import {useState} from 'react';
import {normalize} from '../../lib/game/identity';
export default function PlayerSearch({players,guesses,disabled,onGuess}:{players:string[];guesses:string[];disabled:boolean;onGuess:(player:string)=>void}){
 const [input,setInput]=useState(''),[active,setActive]=useState(0),[error,setError]=useState('');
 const available=players.filter(p=>!guesses.some(g=>normalize(g)===normalize(p)));
 const matches=available.filter(p=>p.toLowerCase().includes(input.trim().toLowerCase())||normalize(p).includes(normalize(input))).slice(0,8);
 function select(p:string){if(disabled)return;setInput('');setError('');setActive(0);onGuess(p);}
 function submit(){const exact=available.find(p=>normalize(p)===normalize(input));const p=exact||matches[active];if(input.trim()&&p)select(p);else setError('اختر اسماً من نتائج البحث');}
 return <div className="player-search"><label htmlFor="missing-search">من اللاعب المفقود؟</label><form onSubmit={e=>{e.preventDefault();submit()}}><input id="missing-search" dir="ltr" autoComplete="off" value={input} placeholder="ابحث باسم اللاعب بالإنجليزية" disabled={disabled} role="combobox" aria-expanded={!!input&&matches.length>0} aria-controls="missing-options" aria-autocomplete="list" aria-activedescendant={input&&matches[active]?'missing-option-'+active:undefined} onChange={e=>{setInput(e.target.value);setActive(0);setError('')}} onKeyDown={e=>{if(e.key==='ArrowDown'){e.preventDefault();setActive(i=>Math.min(i+1,matches.length-1))}if(e.key==='ArrowUp'){e.preventDefault();setActive(i=>Math.max(0,i-1))}if(e.key==='Escape')setInput('')}}/><button className="primary" disabled={disabled||!input.trim()}>تأكيد الإجابة</button></form>{input&&<div id="missing-options" role="listbox" className="suggestions">{matches.length?matches.map((p,i)=><button id={'missing-option-'+i} key={p} type="button" role="option" aria-selected={active===i} className={active===i?'search-active':''} dir="ltr" disabled={disabled} onMouseEnter={()=>setActive(i)} onClick={()=>select(p)}>{p}<span>＋</span></button>):<p>لا توجد نتائج مطابقة</p>}</div>}{error&&<p role="status" className="notice">{error}</p>}</div>
}
