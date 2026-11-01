import catalogue from '../../data/players/guess-profiles.json';
import schedule from './guess-schedule.json';
import {seasonProfiles,seasonProfileInfo,seasonReferenceDate} from './season-2027';
import {normalize} from './identity';
import {importedIdentity} from './liquipedia-identities';
export const profiles=catalogue.players;
export const referenceDate=catalogue.referenceDate;
export function ageAt(birthDate:string,date=referenceDate){const born=new Date(birthDate+'T00:00:00Z'),at=new Date(date+'T00:00:00Z');if(Number.isNaN(+born)||Number.isNaN(+at)||at<born)throw Error('تاريخ غير صالح');return at.getUTCFullYear()-born.getUTCFullYear()-(at.getUTCMonth()<born.getUTCMonth()||at.getUTCMonth()===born.getUTCMonth()&&at.getUTCDate()<born.getUTCDate()?1:0);}
export function guessProfile(id:string){const p=[...profiles,...seasonProfiles].find(p=>p.id===id);if(!p)throw Error('اللاعب غير متاح');return p;}
export function dailyGuess(date=new Date()){const offset=Math.floor(+date/86400000)-Math.floor(Date.parse(schedule.startsOn+'T00:00:00Z')/86400000),n=((offset%schedule.questionIds.length)+schedule.questionIds.length)%schedule.questionIds.length;return schedule.questionIds[n];}
export function guessPool(exclude:string|null,season:string|null=null){const pool=season==='2027'?seasonProfiles:profiles;const next=pool.filter(p=>p.id!==exclude);return next.length?next:pool;}
export function guessPlayersFor(id:string){return seasonProfileInfo(id)?seasonProfiles:profiles;}
function dateFor(id:string){return seasonProfileInfo(id)?seasonReferenceDate:referenceDate;}
export function guessQuestion(id:string){guessProfile(id);return {id,referenceDate:dateFor(id),...(seasonProfileInfo(id)?{season:2027}:{})};}
function display(p:ReturnType<typeof guessProfile>){return {handle:p.handle,age:ageAt(p.birthDate,dateFor(p.id)),countryCode:p.countryCode,country:p.country,role:p.role,team:p.team,teamBasis:p.teamBasis,teamDate:p.teamDate,sources:p.sources,...(seasonProfileInfo(p.id)?{seasonInfo:seasonProfileInfo(p.id)}:{})};}
export function evaluateGuess(id:string,guesses:string[],surrender=false){
 const target=guessProfile(id),pool=guessPlayersFor(id),at=dateFor(id);if(guesses.length>6||new Set(guesses.map(normalize)).size!==guesses.length)throw Error('محاولات غير صالحة');
 const rows=[];let won=false;
 for(const name of guesses){
  if(won)throw Error('انتهى التحدي بالفعل');const p=pool.find(p=>normalize(p.handle)===normalize(name));if(!p)throw Error('اختر لاعباً من القائمة الموثقة');
  const correct=p.id===target.id,age=ageAt(p.birthDate,at),targetAge=ageAt(target.birthDate,at);won=correct;
  rows.push({...display(p),correct,matches:{country:p.countryCode===target.countryCode,age:age===targetAge?'equal':targetAge>age?'older':'younger',role:p.role===target.role,team:p.team.trim().toLowerCase()===target.team.trim().toLowerCase()}});
 }
 const done=won||guesses.length===6||surrender;
 return {won,done,attempts:guesses.length,remaining:6-guesses.length,rows,score:won?(7-guesses.length)*100:0,maxScore:600,...(done?{answer:{...display(target),...(importedIdentity(target)?{identity:importedIdentity(target)}:{})}}:{})};
}
