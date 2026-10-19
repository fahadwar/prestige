'use client';
import RosterShare from './RosterShare';
import type {GameSubmission,ResultCard} from '../../lib/sharing/result-types';
export default function GameResultShare({card,submission}:{card:ResultCard;submission:GameSubmission}){return <RosterShare card={card} submission={submission} value={{team:'',season:0,date:card.date,mode:card.mode,won:card.won,score:card.score,maxScore:card.maxScore,correct:card.players.filter(p=>p.correct).map(p=>p.handle),answers:card.players.map(p=>p.handle),wrong:card.players.filter(p=>!p.correct).length}}/>}
