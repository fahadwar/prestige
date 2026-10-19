import {rosters,players,dayNumber,normalize} from './engine';
import schedule from './missing-schedule.json';
export function missingChallenge(id:string){
 const parts=id.split('.');if(parts.length!==2||!/^\d$/.test(parts[1]))throw Error('التحدي غير صالح');
 const roster=rosters.find(q=>q.id===parts[0]),index=Number(parts[1]);if(!roster||index>=roster.rosterSize)throw Error('التحدي غير موجود');
 return {roster,index,answer:roster.players[index]};
}
export function dailyMissing(date=new Date()){
 const start=dayNumber(new Date(schedule.startsOn+'T00:00:00Z')),offset=dayNumber(date)-start;
 const n=((offset%schedule.questionIds.length)+schedule.questionIds.length)%schedule.questionIds.length;
 const roster=rosters.find(q=>q.id===schedule.questionIds[n]);if(!roster)throw Error('التحدي غير متاح');
 let hash=2166136261;for(const c of roster.id)hash=Math.imul(hash^c.charCodeAt(0),16777619);
 const cycle=Math.floor(offset/schedule.questionIds.length);const index=((hash>>>0)+cycle)%roster.rosterSize;
 return roster.id+'.'+((index+roster.rosterSize)%roster.rosterSize);
}
export function missingQuestion(id:string){
 const {roster,index}=missingChallenge(id);const {players:answers,...meta}=roster;
 const slots=answers.map((p,i)=>i===index?null:p);
 return {...meta,id,rosterId:roster.id,challengeId:id,slots};
}
export function missingOptions(id:string){const q=missingQuestion(id);return players.filter(p=>!q.slots.some(s=>s&&normalize(s)===normalize(p)));}
export function evaluateMissing(id:string,guesses:string[],surrender=false){
 const {answer}=missingChallenge(id),allowed=missingOptions(id);
 if(guesses.length>3||new Set(guesses.map(normalize)).size!==guesses.length||guesses.some(g=>!allowed.some(p=>normalize(p)===normalize(g))))throw Error('محاولات غير صالحة');
 const winAt=guesses.findIndex(g=>normalize(g)===normalize(answer));if(winAt>=0&&winAt!==guesses.length-1)throw Error('انتهى التحدي بالفعل');
 const won=winAt>=0,done=won||guesses.length===3||surrender;
 return {won,done,attempts:guesses.length,remaining:3-guesses.length,score:won?(4-guesses.length)*100:0,maxScore:300,...(done?{answer}:{})};
}
