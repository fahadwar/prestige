import puzzles from './time-puzzles.json';
import schedule from './time-schedule.json';
export {puzzles};
export const seasons=[...new Set(puzzles.map(q=>q.season))].sort((a,b)=>a-b);
export function timePuzzle(id:string){const q=puzzles.find(p=>p.id===id);if(!q)throw Error('التحدي غير موجود');return q;}
export function dailyTime(date=new Date()){const offset=Math.floor(+date/86400000)-Math.floor(Date.parse(schedule.startsOn+'T00:00:00Z')/86400000),n=((offset%schedule.questionIds.length)+schedule.questionIds.length)%schedule.questionIds.length;return schedule.questionIds[n];}
export function timePool(exclude:string|null){const next=puzzles.filter(q=>q.id!==exclude);return next.length?next:puzzles;}
export function timeQuestion(id:string){const q=timePuzzle(id);return {id:q.id,team:q.team,players:q.players,rosterSize:q.rosterSize};}
export function evaluateTime(id:string,guesses:number[],surrender=false){
 const q=timePuzzle(id);if(guesses.length>3||new Set(guesses).size!==guesses.length||guesses.some(y=>!Number.isInteger(y)||!seasons.includes(y)))throw Error('محاولات غير صالحة');
 let won=false;const rows: {season:number;direction:'correct'|'earlier'|'later'}[]=[];
 for(const year of guesses){if(won)throw Error('انتهى التحدي بالفعل');won=year===q.season;rows.push({season:year,direction:won?'correct':q.season<year?'earlier':'later'});}
 const done=won||guesses.length===3||surrender;
 return {won,done,attempts:guesses.length,remaining:3-guesses.length,rows,score:won?(4-guesses.length)*100:0,maxScore:300,...(done?{answer:{season:q.season,evidence:q.evidence}}:{})};
}
