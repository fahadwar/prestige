import catalogue from '../../data/players/guess-profiles.json';
import schedule from './guess-schedule.json';
import {normalize} from './identity';
import {importedIdentity} from './liquipedia-identities';
export const profiles=catalogue.players;
export const referenceDate=catalogue.referenceDate;
export function ageAt(birthDate:string,date=referenceDate){const born=new Date(birthDate+'T00:00:00Z'),at=new Date(date+'T00:00:00Z');if(Number.isNaN(+born)||Number.isNaN(+at)||at<born)throw Error('تاريخ غير صالح');return at.getUTCFullYear()-born.getUTCFullYear()-(at.getUTCMonth()<born.getUTCMonth()||at.getUTCMonth()===born.getUTCMonth()&&at.getUTCDate()<born.getUTCDate()?1:0);}
export function guessProfile(id:string){const p=profiles.find(p=>p.id===id);if(!p)throw Error('اللاعب غير متاح');return p;}
export function dailyGuess(date=new Date()){const offset=Math.floor(+date/86400000)-Math.floor(Date.parse(schedule.startsOn+'T00:00:00Z')/86400000),n=((offset%schedule.questionIds.length)+schedule.questionIds.length)%schedule.questionIds.length;return schedule.questionIds[n];}
export function guessPool(exclude:string|null){const next=profiles.filter(p=>p.id!==exclude);return next.length?next:profiles;}
export function guessQuestion(id:string){guessProfile(id);return {id,referenceDate};}
function display(p:typeof profiles[number]){return {handle:p.handle,age:ageAt(p.birthDate),countryCode:p.countryCode,country:p.country,role:p.role,team:p.team,teamBasis:p.teamBasis,teamDate:p.teamDate,sources:p.sources};}
export function evaluateGuess(id:string,guesses:string[],surrender=false){
 const target=guessProfile(id);if(guesses.length>6||new Set(guesses.map(normalize)).size!==guesses.length)throw Error('محاولات غير صالحة');
 const rows=[];let won=false;
 for(const name of guesses){
  if(won)throw Error('انتهى التحدي بالفعل');const p=profiles.find(p=>normalize(p.handle)===normalize(name));if(!p)throw Error('اختر لاعباً من القائمة الموثقة');
  const correct=p.id===target.id,age=ageAt(p.birthDate),targetAge=ageAt(target.birthDate);won=correct;
  rows.push({...display(p),correct,matches:{country:p.countryCode===target.countryCode,age:age===targetAge?'equal':targetAge>age?'older':'younger',role:p.role===target.role,team:p.team.trim().toLowerCase()===target.team.trim().toLowerCase()}});
 }
 const done=won||guesses.length===6||surrender;
 return {won,done,attempts:guesses.length,remaining:6-guesses.length,rows,score:won?(7-guesses.length)*100:0,maxScore:600,...(done?{answer:{...display(target),...(importedIdentity(target)?{identity:importedIdentity(target)}:{})}}:{})};
}
