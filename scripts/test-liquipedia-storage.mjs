import fs from 'node:fs';import path from 'node:path';import Module from 'node:module';import ts from 'typescript';import assert from 'node:assert/strict';
const cache=new Map();function load(file){const filename=path.resolve(file);if(cache.has(filename))return cache.get(filename).exports;const m=new Module(filename);m.filename=filename;m.paths=Module._nodeModulePaths(path.dirname(filename));const original=m.require.bind(m);m.require=id=>id.startsWith('.')?load(path.resolve(path.dirname(filename),id+'.ts')):original(id);cache.set(filename,m);m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);return m.exports;}
const {createLiquipediaFetch,liquipediaLedgerKey}=load('lib/server/liquipedia-storage.ts');
const {probeLiquipedia}=load('lib/server/liquipedia.ts');
class Bucket{
 objects=new Map();serial=0;breakCache=false;
 async get(key){await Promise.resolve();const x=this.objects.get(key);return x?{etag:x.etag,json:async()=>JSON.parse(x.text)}:null;}
 async put(key,text,options={}){await Promise.resolve();if(this.breakCache&&key.includes('/cache/'))throw Error('storage failed');const old=this.objects.get(key),c=options.onlyIf;
  if(c instanceof Headers&&c.get('If-None-Match')==='*'&&old)return null;
  if(c?.etagMatches&&c.etagMatches!==old?.etag)return null;
  const x={etag:'etag-'+(++this.serial),text};this.objects.set(key,x);return {etag:x.etag};}
 ledger(){return JSON.parse(this.objects.get(liquipediaLedgerKey).text);}
}
const secret='fixture-only-private-key',url='https://api.liquipedia.net/api/v3/transfer?wiki=callofduty&limit=1';
const other='https://api.liquipedia.net/api/v3/team?wiki=callofduty&limit=1';
let now=Date.parse('2026-10-20T00:00:00Z'),calls=0;
const bucket=new Bucket(),fetcher=async(u,o)=>{calls++;assert.equal(o.method,'GET');assert.equal(o.redirect,'manual');assert.equal(o.headers.Authorization,'Apikey '+secret);assert.equal(o.headers['Accept-Encoding'],'gzip');return Response.json({result:[{player:'Fixture'}],error:[],warning:['Fixture warning']});};
const client=()=>createLiquipediaFetch(bucket,secret,{fetcher,now:()=>now});
const concurrent=await Promise.allSettled(Array.from({length:12},()=>client()(url)));
assert.equal(calls,1,'Concurrent Workers must reserve only one upstream request');assert.ok(concurrent.some(x=>x.status==='fulfilled'));
assert.equal(bucket.ledger().requests.length,1);assert.equal(bucket.ledger().pending,false);
const stored=await client()('https://api.liquipedia.net/api/v3/transfer?limit=1&wiki=callofduty');assert.equal(stored.headers.get('X-Prestige-Cache'),'hit');assert.equal(calls,1);
assert.deepEqual((await stored.json()).warning,['Fixture warning']);
const probe=await probeLiquipedia(secret,client());assert.equal(probe.ok,true);assert.equal(probe.cache.source,'stored');assert.deepEqual(probe.warnings,['Fixture warning']);assert.equal(calls,1);
await assert.rejects(client()(other),e=>e.code==='REQUEST_SPACING'&&e.status===429);
now+=65001;assert.equal((await client()(other)).status,200);assert.equal(calls,2);assert.equal(bucket.ledger().requests.length,2);
now+=100*86400000;assert.equal((await client()(url)).headers.get('X-Prestige-Cache'),'hit');assert.equal(calls,2,'Successful snapshots must not expire automatically');
for(const bad of ['https://example.test/api/v3/transfer?wiki=callofduty','https://api.liquipedia.net/callofduty/Main_Page','https://api.liquipedia.net/api/v3/player?wiki=dota2','https://api.liquipedia.net/api/v3/player?wiki=callofduty&apikey='+secret])await assert.rejects(client()(bad),e=>e.code==='INVALID_API_REQUEST');
await assert.rejects(client()(url,{method:'POST'}),e=>e.code==='INVALID_API_REQUEST');assert.equal(calls,2);
assert.ok(![...bucket.objects.values()].some(x=>x.text.includes(secret)),'Credentials must not enter cache or ledger');

const full=new Bucket();await full.put(liquipediaLedgerKey,JSON.stringify({version:1,requests:Array(60).fill(now-3600000+20),notBefore:0,pending:false}));let fullCalls=0;
const limited=createLiquipediaFetch(full,secret,{fetcher:async()=>{fullCalls++;return Response.json({result:[]});},now:()=>now});
await assert.rejects(limited(url),e=>e.code==='HOURLY_LIMIT'&&e.retryAfterSeconds>=1);assert.equal(fullCalls,0);now+=21;assert.equal((await limited(url)).status,200);assert.equal(fullCalls,1);

for(const broken of [undefined,{get:async()=>{throw Error('read failed');}},{get:async()=>null,put:async()=>null}]){
 let n=0;const f=createLiquipediaFetch(broken,secret,{fetcher:async()=>{n++;return Response.json({result:[]});}});await assert.rejects(f(url));assert.equal(n,0,'No network without a persisted reservation');
}
const failed=new Bucket();let failedCalls=0;const failureClient=()=>createLiquipediaFetch(failed,secret,{fetcher:async()=>{failedCalls++;throw Error(secret);},now:()=>now});
assert.equal((await failureClient()(url)).status,503);assert.equal(failed.ledger().requests.length,1);assert.equal((await failureClient()(url)).headers.get('X-Prestige-Cache'),'hit');assert.equal(failedCalls,1);assert.ok(![...failed.objects.values()].some(x=>x.text.includes(secret)));
now+=300001;await failureClient()(url);assert.equal(failedCalls,2);assert.equal(failed.ledger().requests.length,2);

const interrupted=new Bucket();interrupted.breakCache=true;let interruptedCalls=0;
const interruptClient=()=>createLiquipediaFetch(interrupted,secret,{fetcher:async()=>{interruptedCalls++;return Response.json({result:[]});},now:()=>now});
await assert.rejects(interruptClient()(url));assert.equal(interrupted.ledger().pending,true);interrupted.breakCache=false;
await assert.rejects(interruptClient()(other),e=>e.code==='REQUEST_UNRESOLVED');assert.equal(interruptedCalls,1);

const throttled=new Bucket();let throttleCalls=0;const throttledClient=()=>createLiquipediaFetch(throttled,secret,{fetcher:async()=>{throttleCalls++;return new Response('private error',{status:429,headers:{'Retry-After':'7200'}});},now:()=>now});
const wait=await throttledClient()(url);assert.equal(wait.status,429);assert.equal(wait.headers.get('Retry-After'),'7200');now+=3600001;
await assert.rejects(throttledClient()(other),e=>e.status===429&&e.retryAfterSeconds>3500);assert.equal((await throttledClient()(url)).status,429);assert.equal(throttleCalls,1);
for(const make of [()=>Response.json({result:[{key:secret}]}),()=>Response.json({result:[],error:['private error']}),()=>new Response('<html>no</html>'),()=>new Response('',{status:302,headers:{Location:'https://example.test'}}),()=>Response.json({result:[{x:'x'.repeat(270000)}]})]){
 const b=new Bucket();let n=0;const f=createLiquipediaFetch(b,secret,{fetcher:async()=>{n++;return make();},now:()=>now});const r=await f(url);assert.equal(r.status,502);assert.equal(n,1);assert.ok(![...b.objects.values()].some(x=>x.text.includes(secret)));assert.equal(b.ledger().pending,false);
}
console.log('PASS: shared conditional reservations under concurrency, rolling 60/hour budget, cross-endpoint spacing, persistent cache, gzip, warnings, retries/backoff, key secrecy and storage/crash fail-closed behavior.');
