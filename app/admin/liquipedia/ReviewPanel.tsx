'use client';
import {useEffect,useState} from 'react';
type Summary={kind:string;status:string;pages:number;rawRows:number;uniqueRecords:number;duplicateRows:number;conflictingRecords:number;quarantinedRows:number;possibleExistingMatches:number;unmatchedCandidates:number;nextOffset:number|null;updatedAt:string|null;warnings:{offset:number;message:string}[]};
type Review={summary:Summary;page:number;reviewPages:number;records:{id:string;label:string;pagename:string;sourceUrl:string;occurrences:number;conflict:boolean;possibleExistingMatch:boolean;status:string;type:string;team:string}[]};
const button={padding:'10px 14px',border:'1px solid #666',borderRadius:6,background:'#252525',color:'#eee',cursor:'pointer'};
export default function ReviewPanel(){
  const [kind,setKind]=useState('player'),[review,setReview]=useState<Review|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[waitUntil,setWaitUntil]=useState(0),[now,setNow]=useState(Date.now());
  useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t);},[]);
  async function load(selected=kind,page=0){setBusy(true);try{const response=await fetch(`/api/admin/liquipedia/review?kind=${selected}&page=${page}`,{credentials:'same-origin',cache:'no-store'}),data=await response.json() as Review & {message?:string;retryAfterSeconds?:number;cache?:string};if(!response.ok)throw Error(data.message||'Could not load review.');setReview(data);}catch(error){setMessage(error instanceof Error?error.message:'Could not load review.');}finally{setBusy(false);}}
  useEffect(()=>{setReview(null);setMessage('');void load(kind);},[kind]);
  async function collect(){if(!review||review.summary.nextOffset===null)return;setBusy(true);setMessage('Fetching one page through the shared API budget…');try{
    const response=await fetch('/api/admin/liquipedia/review',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,offset:review.summary.nextOffset})}),data=await response.json() as Review & {message?:string;retryAfterSeconds?:number;cache?:string};
    if(data.retryAfterSeconds)setWaitUntil(Date.now()+data.retryAfterSeconds*1000);
    if(!response.ok)throw Error(data.message||'Page was not collected. Reload review before retrying.');
    setReview(data);setMessage(data.message+(data.cache==='stored'?' Stored API response reused.':''));if(data.cache==='live')setWaitUntil(Date.now()+65000);
  }catch(error){setMessage(error instanceof Error?error.message:'Page was not collected.');}finally{setBusy(false);}}
  const wait=Math.max(0,Math.ceil((waitUntil-now)/1000)),s=review?.summary;
  return <section style={{marginTop:48,borderTop:'1px solid #555',paddingTop:28}}>
    <h2 style={{fontSize:24,marginBottom:16}}>Players and teams — review staging</h2>
    <p style={{marginBottom:12}}>Each click collects up to 100 records. Progress is saved privately and resumes here. No automatic collection, identity merging or game import runs.</p>
    <p style={{marginBottom:20}}>Names without an existing match are candidates, not confirmed missing players or teams. Pagination ending does not prove complete wiki coverage or complete careers.</p>
    <label>Dataset: <select value={kind} disabled={busy} onChange={e=>setKind(e.target.value)} style={{...button,marginBottom:16}}><option value="player">Players</option><option value="team">Teams</option></select></label>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:20}}>
      <button style={button} disabled={busy||!s||s.nextOffset===null||wait>0} onClick={collect}>{busy?'Working…':wait?`Shared budget: wait ${wait}s`:s?.nextOffset===null?'Collection stopped':`Fetch ${kind} page ${(s?.pages||0)+1}`}</button>
      <button style={button} disabled={busy} onClick={()=>load()}>Reload saved review</button>
      {!!s?.pages&&<a style={button} href={`/api/admin/liquipedia/review?kind=${kind}&download=1`}>Download review JSON</a>}
    </div>
    <p role="status" aria-live="polite" style={{whiteSpace:'pre-wrap',marginBottom:16}}>{message}</p>
    {s&&<>
      <p style={{marginBottom:12}}>State: <strong>{s.status}</strong>. {s.pages} API pages · {s.rawRows} rows · {s.uniqueRecords} unique source objects.</p>
      <p style={{marginBottom:16}}>{s.possibleExistingMatches} possible existing matches · {s.unmatchedCandidates} unmatched candidates · {s.duplicateRows} duplicate rows · {s.conflictingRecords} conflicts · {s.quarantinedRows} quarantined rows.</p>
      {s.updatedAt&&<p style={{marginBottom:16}}>Last saved: {new Date(s.updatedAt).toLocaleString()}</p>}
      {!!s.warnings.length&&<div role="alert" style={{marginBottom:20}}>Collection paused for review.<ul>{s.warnings.map((w,i)=><li key={i}>Offset {w.offset}: {w.message}</li>)}</ul></div>}
      {!!review?.records.length&&<><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',textAlign:'left'}}><thead><tr>{['Source name','Existing data','Review flags'].map(h=><th key={h} style={{padding:10,borderBottom:'1px solid #666'}}>{h}</th>)}</tr></thead><tbody>{review.records.map(r=><tr key={r.id}><td style={{padding:10,borderBottom:'1px solid #444'}}><a href={r.sourceUrl} target="_blank" rel="noreferrer">{r.label}</a><div style={{fontSize:12,color:'#bbb'}}>{r.pagename}{r.team?` · ${r.team}`:''}</div></td><td style={{padding:10,borderBottom:'1px solid #444'}}>{r.possibleExistingMatch?'Possible name match':'Unmatched candidate'}</td><td style={{padding:10,borderBottom:'1px solid #444'}}>{[r.conflict?'Conflicting source rows':'',r.occurrences>1?`${r.occurrences} occurrences`:'',r.status,r.type].filter(Boolean).join(' · ')||'Needs review'}</td></tr>)}</tbody></table></div>
      <div style={{display:'flex',gap:12,alignItems:'center',marginTop:16}}><button style={button} disabled={busy||review.page===0} onClick={()=>load(kind,review.page-1)}>Previous</button><span>Review page {review.page+1} of {review.reviewPages}</span><button style={button} disabled={busy||review.page+1>=review.reviewPages} onClick={()=>load(kind,review.page+1)}>Next</button></div></>}
    </>}
    <p style={{marginTop:24}}>Data: <a href="https://liquipedia.net/callofduty/Main_Page">Liquipedia Call of Duty</a> · <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a>. Selected fields normalized and duplicates grouped for review. Individual source links accompany each name. Exports retain source pages, fetch timestamps, raw selected fields and all conflicting variants.</p>
  </section>;
}
