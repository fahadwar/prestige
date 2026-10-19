'use client';
import {useEffect,type Dispatch,type SetStateAction} from 'react';
import {reconcileDailyStreak,type DailyStreak} from './streak';

export function useDailyStreak<T extends DailyStreak>(setStats:Dispatch<SetStateAction<T>>) {
  useEffect(()=>{
    let timer:ReturnType<typeof setTimeout>;
    const refresh=()=>setStats(previous=>reconcileDailyStreak(previous));
    const schedule=()=>{refresh();timer=setTimeout(schedule,86400000-Date.now()%86400000+50);};
    schedule();
    window.addEventListener('focus',refresh);
    document.addEventListener('visibilitychange',refresh);
    return ()=>{clearTimeout(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};
  },[setStats]);
}
