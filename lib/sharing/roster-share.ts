import {normalize} from '../game/identity';
export type RosterShare={team:string;season:number;date:string;mode:string;won:boolean;score:number;maxScore:number;correct:string[];answers:string[];wrong:number};
export const arabicNumber=(value:number)=>new Intl.NumberFormat('ar-SA',{useGrouping:false}).format(value);
export function rosterShareText(value:RosterShare){return `لعبت تحدي التشكيلة في برستيج!\n${value.mode==='daily'?'تحدي اليوم':'تدريب'} · ${value.won?'أكملت التشكيلة':'انتهت الجولة'}\nعرفت ${arabicNumber(value.correct.length)} من ${arabicNumber(value.answers.length)} لاعبين\nنتيجتي: ${arabicNumber(value.score)} من ${arabicNumber(value.maxScore)}\nتقدر تتفوق علي؟`}
export function xShareUrl(text:string,url:string){const target=new URL('https://x.com/intent/tweet');target.searchParams.set('text',text);target.searchParams.set('url',url);return target.toString()}
export function playerWasFound(value:RosterShare,handle:string){return value.correct.some(p=>normalize(p)===normalize(handle))}
