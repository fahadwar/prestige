import puzzles from './ranking-puzzles.json';
import schedule from './ranking-schedule.json';
import catalogue from '../../data/players/guess-profiles.json';
import {normalize} from './identity';
export {puzzles};
export function rankingPuzzle(id:string){const q=puzzles.find(p=>p.id===id);if(!q)throw Error('التحدي غير موجود');return q;}
export function dailyRanking(date=new Date()){const offset=Math.floor(+date/86400000)-Math.floor(Date.parse(schedule.startsOn+'T00:00:00Z')/86400000),n=((offset%schedule.questionIds.length)+schedule.questionIds.length)%schedule.questionIds.length;return schedule.questionIds[n];}
export function rankingPool(exclude:string|null){const next=puzzles.filter(q=>q.id!==exclude);return next.length?next:puzzles;}
export function rankingQuestion(id:string){const q=rankingPuzzle(id);return {id:q.id,players:q.players,direction:'oldest-first'};}
export function evaluateRanking(id:string,order:string[]){
 const q=rankingPuzzle(id);
 if(order.length!==5||new Set(order.map(normalize)).size!==5||order.some(p=>!q.players.some(n=>normalize(n)===normalize(p))))throw Error('يجب ترتيب اللاعبين الخمسة دون تكرار');
 const entries=q.players.map(name=>{const p=catalogue.players.find(p=>normalize(p.handle)===normalize(name));if(!p)throw Error('بيانات اللاعب غير مكتملة');return p;});
 if(new Set(entries.map(p=>p.birthDate)).size!==5)throw Error('تحدٍ غير صالح');
 const correct=[...entries].sort((a,b)=>a.birthDate.localeCompare(b.birthDate)),submitted=order.map(name=>entries.find(p=>normalize(p.handle)===normalize(name))!);
 const rows=submitted.map((p,i)=>({handle:p.handle,birthDate:p.birthDate,position:i+1,correctPosition:correct.findIndex(c=>c.id===p.id)+1,isCorrect:correct[i].id===p.id}));
 const correctPositions=rows.filter(r=>r.isCorrect).length;
 return {done:true,won:correctPositions===5,correctPositions,score:correctPositions*100,maxScore:500,submitted:rows,answers:correct.map((p,i)=>({handle:p.handle,birthDate:p.birthDate,position:i+1,sources:p.sources.slice(0,3)}))};
}
