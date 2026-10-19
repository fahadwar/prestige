import {daily} from '../game/engine';
import {dailyMissing} from '../game/missing';
import {dailyGuess} from '../game/guess-player';
import {dailyConnections} from '../game/connections';
import {dailyRanking} from '../game/ranking';
import {dailyTime} from '../game/time-machine';
import missingSchedule from '../game/missing-schedule.json';
import guessSchedule from '../game/guess-schedule.json';
import connectionsSchedule from '../game/connections-schedule.json';
import rankingSchedule from '../game/ranking-schedule.json';
import timeSchedule from '../game/time-schedule.json';
import type {ShareGame} from './result-types';

// Roster's legacy rotation starts on UTC day 20743 (2026-10-17),
// before its current frozen schedule starts on 2026-10-18.
const starts:Record<ShareGame,string>={roster:'2026-10-17','missing-player':missingSchedule.startsOn,
  'guess-player':guessSchedule.startsOn,connections:connectionsSchedule.startsOn,
  ranking:rankingSchedule.startsOn,'time-machine':timeSchedule.startsOn};
const dailyId:Record<ShareGame,(date:Date)=>string>={roster:date=>daily(date).id,
  'missing-player':dailyMissing,'guess-player':dailyGuess,connections:dailyConnections,
  ranking:dailyRanking,'time-machine':dailyTime};

export function parseShareDate(value:string,now=new Date()):Date {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw Error('تاريخ غير صالح');
  const date=new Date(value+'T00:00:00Z');
  // Reject calendar rollovers such as February 30, not just malformed strings.
  if(!Number.isFinite(+date)||date.toISOString().slice(0,10)!==value||value>now.toISOString().slice(0,10))throw Error('تاريخ غير صالح');
  return date;
}

export function validateShareDate(submission:{game:ShareGame;mode:'daily'|'practice';date:string;id:string},now=new Date()) {
  const date=parseShareDate(submission.date,now);
  if(submission.mode==='daily'&&(submission.date<starts[submission.game]||submission.id!==dailyId[submission.game](date)))
    throw Error('النتيجة لا تطابق تحدي ذلك اليوم');
}
