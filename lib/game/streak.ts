export type DailyStreak={streak:number;best:number;last?:number;lastDay?:number};
export function reconcileDailyStreak<T extends DailyStreak>(stats:T,now=new Date()):T {
  const today=Math.floor(now.getTime()/86400000),last=stats.lastDay??stats.last;
  // Yesterday's win remains active while today's challenge is still pending.
  const active=Number.isInteger(last)&&(last===today||last===today-1);
  if(stats.streak!==0&&!active)return {...stats,streak:0};
  return stats;
}
