import puzzles from './connections-puzzles.json';
import schedule from './connections-schedule.json';
import {normalize} from './identity';
export {puzzles};
const signature=(names:string[])=>names.map(normalize).sort().join('|');
export function connectionPuzzle(id:string){const q=puzzles.find(p=>p.id===id);if(!q)throw Error('التحدي غير موجود');return q;}
export function dailyConnections(date=new Date()){
 const offset=Math.floor(date.getTime()/86400000)-Math.floor(Date.parse(schedule.startsOn+'T00:00:00Z')/86400000),n=((offset%schedule.questionIds.length)+schedule.questionIds.length)%schedule.questionIds.length;
 return schedule.questionIds[n];
}
export function connectionsQuestion(id:string){const q=connectionPuzzle(id);return {id:q.id,season:q.season,tiles:q.tiles};}
export function connectionsPool(season:string|null,exclude:string|null){const pool=puzzles.filter(p=>!season||String(p.season)===season),next=pool.filter(p=>p.id!==exclude);return next.length?next:pool;}
export function evaluateConnections(id:string,guesses:string[][],surrender=false){
 const q=connectionPuzzle(id),solved:number[]=[],seen=new Set<string>(),history:{matched:number|null;oneAway:boolean}[]=[];let mistakes=0;
 if(guesses.length>7)throw Error('محاولات غير صالحة');
 for(const guess of guesses){
  if(solved.length===4||mistakes>=4)throw Error('انتهى التحدي بالفعل');
  if(guess.length!==4||new Set(guess.map(normalize)).size!==4||guess.some(p=>!q.tiles.some(t=>normalize(t)===normalize(p)))||guess.some(p=>solved.some(i=>q.groups[i].players.some(t=>normalize(t)===normalize(p)))))throw Error('اختر أربعة أسماء متاحة ومختلفة');
  const key=signature(guess);if(seen.has(key))throw Error('سبق أن جربت هذه المجموعة');seen.add(key);
  const index=q.groups.findIndex(g=>signature(g.players)===key);
  if(index>=0){solved.push(index);history.push({matched:index,oneAway:false});}
  else{mistakes++;const oneAway=q.groups.some((g,i)=>!solved.includes(i)&&guess.filter(p=>g.players.some(t=>normalize(t)===normalize(p))).length===3);history.push({matched:null,oneAway});}
 }
 const won=solved.length===4,done=won||mistakes>=4||surrender;
 return {won,done,mistakes,remaining:4-mistakes,solved:solved.map(i=>({...q.groups[i],color:i})),history,oneAway:history.at(-1)?.oneAway||false,score:Math.max(0,solved.length*100-mistakes*25),maxScore:400,...(done?{answers:q.groups.map((g,i)=>({...g,color:i}))}:{})};
}
