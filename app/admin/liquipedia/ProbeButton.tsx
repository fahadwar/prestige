'use client';
import {useState} from 'react';
export default function ProbeButton(){
  const [busy,setBusy]=useState(false),[result,setResult]=useState('');
  async function test(){setBusy(true);setResult('Testing…');try{
    const response=await fetch('/api/admin/liquipedia/probe',{method:'POST',credentials:'same-origin'});
    const data=await response.json();setResult(JSON.stringify(data,null,2));
  }catch{setResult('Connection test could not complete. Please try again.');}finally{setBusy(false);}}
  return <><button type="button" disabled={busy} onClick={test} style={{padding:'12px 20px',background:'#e8b44e',color:'#111',borderRadius:8,cursor:busy?'wait':'pointer',fontWeight:700}}>{busy?'Testing…':'Test Liquipedia connection'}</button><pre role="status" aria-live="polite" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',marginTop:24}}>{result}</pre></>;
}
