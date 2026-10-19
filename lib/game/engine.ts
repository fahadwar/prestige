import rosters from './rosters.json';
import legacy from './legacy-daily.json';
import schedule from './daily-schedule.json';
export {rosters};
export const players=[...new Set(rosters.flatMap(q=>q.players))].sort();
export const dayNumber=(date=new Date())=>Math.floor(date.getTime()/86400000);
const mod=(n:number,size:number)=>((n%size)+size)%size;
export function daily(date=new Date()){
 const day=dayNumber(date),start=dayNumber(new Date(schedule.startsOn+'T00:00:00Z'));
 const id=day<start?legacy[mod(day-20743,legacy.length)].id:schedule.questionIds[mod(day-start,schedule.questionIds.length)];
 const q=rosters.find(q=>q.id===id);if(!q)throw Error('التحدي غير متاح');return q;
}
export {normalize} from './identity';
import {normalize} from './identity';
export function resolvePlayer(s:string){return players.find(p=>normalize(p)===normalize(s));}
export function evaluate(id:string,guesses:string[],hints:number,surrender=false){
 const q=rosters.find(q=>q.id===id);if(!q)throw Error('السؤال غير موجود');
 if(!Number.isInteger(hints)||hints<0||hints>2||guesses.length>q.rosterSize+5||new Set(guesses.map(normalize)).size!==guesses.length||guesses.some(g=>!resolvePlayer(g)))throw Error('محاولات غير صالحة');
 const matched=new Set<string>();let wrong=0;
 for(const guess of guesses){
  if(matched.size===q.rosterSize||wrong>=6)throw Error('انتهى التحدي بالفعل');
  const player=q.players.find(p=>normalize(p)===normalize(guess));
  if(player)matched.add(player);else wrong++;
 }
 const correct=q.players.filter(p=>matched.has(p));
 const won=correct.length===q.rosterSize,done=won||wrong>=6||surrender;
 const hintsRemaining=q.players.filter(p=>!correct.includes(p));
 return {correct,wrong,won,done,score:Math.max(0,correct.length*100+(won?100:0)-wrong*25-hints*50),maxScore:q.rosterSize*100+100,answers:done?q.players:undefined,hint:hints?hintsRemaining.slice(0,hints).map(p=>p.slice(0,1)).join('، '):undefined};
}
export function practicePool(season:string|null,exclude:string|null){const filtered=rosters.filter(q=>!season||String(q.season)===season);const without=filtered.filter(q=>q.id!==exclude);return without.length?without:filtered;}
