import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Module from 'node:module';
import ts from 'typescript';
let cleanup;
const cache=new Map();
function load(file){const filename=path.resolve(file);if(cache.has(filename))return cache.get(filename).exports;const m=new Module(filename);m.filename=filename;m.paths=Module._nodeModulePaths(path.dirname(filename));const original=m.require.bind(m);m.require=id=>id==='react'?{useEffect:effect=>{cleanup=effect();}}:id.startsWith('.')?load(path.resolve(path.dirname(filename),id+'.ts')):original(id);cache.set(filename,m);m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);return m.exports;}
const {reconcileDailyStreak}=load('lib/game/streak.ts');
const now=new Date('2026-10-19T12:00:00Z'),day=Math.floor(+now/86400000);
for(const key of ['last','lastDay']){
 for(const last of [day,day-1]){const saved={played:20,wins:14,streak:4,best:9,[key]:last};assert.equal(reconcileDailyStreak(saved,now),saved);}
 for(const last of [day-2,day-20,day+1,undefined,NaN]){const saved={played:20,wins:14,streak:4,best:9,[key]:last},result=reconcileDailyStreak(saved,now);assert.deepEqual(result,{...saved,streak:0});assert.equal(saved.streak,4,'Input must remain unchanged');}
 const lost={played:20,wins:14,streak:0,best:9,[key]:day};assert.equal(reconcileDailyStreak(lost,now),lost);
 const expired=reconcileDailyStreak({played:20,wins:14,streak:4,best:9,[key]:day-2},now);
 const practice={...expired,played:expired.played+1,wins:expired.wins+1};assert.equal(reconcileDailyStreak(practice,now).streak,0);
}
assert.equal(reconcileDailyStreak({streak:3,best:7,lastDay:day-1},new Date('2026-10-19T23:59:59Z')).streak,3);
assert.equal(reconcileDailyStreak({streak:3,best:7,lastDay:day-1},new Date('2026-10-20T00:00:00Z')).streak,0);

// Exercise the real hook with a deterministic browser clock and effect lifecycle.
const savedGlobals={Date:globalThis.Date,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout,window:globalThis.window,document:globalThis.document};
let clock=+new Date('2026-10-19T23:59:59Z'),nextId=0;const timers=new Map(),windowEvents=new Map(),documentEvents=new Map();
const surface=events=>({addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:(name,fn)=>{if(events.get(name)===fn)events.delete(name);}});
try{
 globalThis.Date=class extends savedGlobals.Date{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}};
 globalThis.setTimeout=(fn,delay)=>{const id=++nextId;timers.set(id,{fn,delay});return id;};globalThis.clearTimeout=id=>timers.delete(id);
 globalThis.window=surface(windowEvents);globalThis.document=surface(documentEvents);
 const {useDailyStreak}=load('lib/game/use-daily-streak.ts');
 let state={played:20,wins:14,streak:4,best:9,lastDay:day-1};
 useDailyStreak(update=>{state=typeof update==='function'?update(state):update;});
 assert.equal(state.streak,4);assert.equal(timers.size,1);assert.equal([...timers.values()][0].delay,1050);
 clock=+new savedGlobals.Date('2026-10-20T00:00:00.050Z');const [id,timer]=[...timers][0];timers.delete(id);timer.fn();assert.equal(state.streak,0);assert.equal(state.best,9);assert.equal(timers.size,1);
 state={...state,streak:4,lastDay:day};windowEvents.get('focus')();assert.equal(state.streak,4,'Yesterday remains active on return');
 clock=+new savedGlobals.Date('2026-10-21T12:00:00Z');windowEvents.get('focus')();assert.equal(state.streak,0,'Missed day expires on focus');
 state={...state,streak:4};documentEvents.get('visibilitychange')();assert.equal(state.streak,0,'Returning to a suspended tab expires its streak');
 cleanup();assert.equal(timers.size,0);assert.equal(windowEvents.size,0);assert.equal(documentEvents.size,0);
}finally{for(const [key,value] of Object.entries(savedGlobals)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
console.log('PASS: both saved-stat formats preserve current/yesterday streaks and best/totals, expire missed days without mutation, and refresh on UTC midnight, focus and visibility with cleanup.');
