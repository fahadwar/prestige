import ts from 'typescript';import fs from 'node:fs';import Module from 'node:module';import assert from 'node:assert/strict';import path from 'node:path';
const cache=new Map();function load(file){const filename=path.resolve(file);if(cache.has(filename))return cache.get(filename).exports;const m=new Module(filename);m.filename=filename;m.paths=Module._nodeModulePaths(path.dirname(filename));const original=m.require.bind(m);m.require=id=>id.startsWith('.')&&!id.endsWith('.json')?load(path.resolve(path.dirname(filename),id+'.ts')):original(id);cache.set(filename,m);m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,resolveJsonModule:true,esModuleInterop:true}}).outputText,filename);return m.exports;}
const {createSocialLink,getSocialResult,socialHtml,shareId}=load('lib/sharing/social-links.ts'),{rosters,players,normalize}=load('lib/game/engine.ts');
const q=rosters.find(q=>q.rosterSize===5),png=new Uint8Array(40);png.set([137,80,78,71,13,10,26,10]);const view=new DataView(png.buffer);view.setUint32(8,13);view.setUint32(12,0x49484452);view.setUint32(16,1200);view.setUint32(20,840);
const objects=new Map(),bucket={async put(k,v,options){objects.set(k,{bytes:v,...options})},async head(k){return objects.get(k)||null},async get(k){const o=objects.get(k);return o?{...o,body:new Blob([o.bytes]).stream()}:null}};
const submission={id:q.id,guesses:q.players,hints:0,surrender:false,mode:'practice',date:'2026-10-18'},image=Buffer.from(png).toString('base64');const send=(body,origin='https://site.test')=>createSocialLink(new Request('https://site.test/api/share/roster',{method:'POST',headers:{Origin:origin},body:JSON.stringify(body)}),bucket);
const res=await send({submission,image});assert.equal(res.status,200);const data=await res.json();assert.ok(shareId.test(data.id));assert.equal(data.url,'https://site.test/share/'+data.id);assert.equal(objects.size,1);assert.equal((await(await send({submission,image})).json()).id,data.id);assert.equal(objects.size,1);
const wrongRosterPlayers=players.filter(p=>!q.players.some(c=>normalize(c)===normalize(p))).filter((p,i,a)=>a.findIndex(c=>normalize(c)===normalize(p))===i).slice(0,6);
for(const guesses of [[...q.players,wrongRosterPlayers[0]],[...wrongRosterPlayers,q.players[0]]]){
 assert.equal((await send({submission:{...submission,guesses},image})).status,400);
 assert.equal(objects.size,1,'Rejected post-completion rounds must not create a stored result');
}
const page=await getSocialResult(new Request(data.url),data.id,bucket);assert.equal(page.status,200);assert.match(page.headers.get('Content-Type'),/text\/html/);const html=await page.text();assert.ok(html.includes('name="twitter:card" content="summary_large_image"'));assert.ok(html.includes('property="og:image" content="'+data.url+'/image"'));assert.ok(html.includes('name="twitter:image" content="'+data.url+'/image"'));assert.ok(html.includes('600'));assert.ok(html.includes('برستيج'));assert.ok(!html.includes('<script'));assert.ok(!html.includes('base64'));
const picture=await getSocialResult(new Request(data.url+'/image'),data.id,bucket,true);assert.equal(picture.status,200);assert.equal(picture.headers.get('Content-Type'),'image/png');assert.deepEqual(new Uint8Array(await picture.arrayBuffer()),png);
assert.equal((await send({submission,image},'https://evil.test')).status,403);assert.equal((await send({submission:{...submission,guesses:[]},image})).status,400);assert.equal((await send({submission,image:'bad'})).status,400);assert.equal((await send({submission:{...submission,id:'unknown'},image})).status,400);assert.equal((await getSocialResult(new Request('https://site.test/share/../../bad'),'../../bad',bucket)).status,404);assert.equal((await getSocialResult(new Request(data.url),data.id,undefined)).status,503);assert.equal((await getSocialResult(new Request(data.url),'00000000-0000-4000-a000-000000000000',bucket)).status,404);
const escaped=socialHtml({title:'<script>&"',description:'<img src=x onerror=alert(1)>',createdAt:''},data.url);assert.ok(!escaped.includes('<script>'));assert.ok(!escaped.includes('<img src=x'));assert.ok(escaped.includes('&lt;script&gt;'));
const large=new Request('https://site.test/api/share/roster',{method:'POST',headers:{Origin:'https://site.test','content-length':'1550001'},body:'x'});assert.equal((await createSocialLink(large,bucket)).status,413);console.log('PASS: per-result durable PNG links; raw HTML X/Open Graph metadata; image delivery; canonical paths; server-checked completion and score; deduplication; origin/size/image checks; escaping; missing storage/results. Live crawler behavior is checked separately.');
const gp=load('lib/game/guess-player.ts').profiles[0],rank=load('lib/game/ranking.ts').puzzles[0],conn=load('lib/game/connections.ts').puzzles[0],time=load('lib/game/time-machine.ts').puzzles[0];
const cases=[
 {game:'guess-player',id:gp.id,guesses:[gp.handle],title:'من اللاعب؟',score:600},
 {game:'missing-player',id:q.id+'.0',guesses:[q.players[0]],title:'اللاعب المفقود',score:300},
 {game:'ranking',id:rank.id,guesses:rank.players,title:'رتّبهم',score:load('lib/game/ranking.ts').evaluateRanking(rank.id,rank.players).score},
 {game:'connections',id:conn.id,guesses:conn.groups.map(g=>g.players),title:'روابط اللاعبين',score:400},
 {game:'time-machine',id:time.id,guesses:[time.season],title:'آلة الزمن',score:300}
];
for(const item of cases){const body={submission:{...submission,...item},image},r=await send(body);assert.equal(r.status,200,item.game);const d=await r.json(),html=await(await getSocialResult(new Request(d.url),d.id,bucket)).text();assert.ok(html.includes(item.title),item.game);assert.ok(html.includes(String(item.score)));assert.ok(html.includes('href="/'+item.game+'"'));assert.ok(html.includes('summary_large_image'));assert.equal((await send({...body,submission:{...body.submission,guesses:[]}})).status,400,item.game+' rejects unfinished');if(item.game!=='ranking'){assert.equal((await send({...body,submission:{...body.submission,guesses:[],surrender:true}})).status,200,item.game+' allows completed surrender')}assert.equal((await send({...body,submission:{...body.submission,guesses:['not-a-real-player']}})).status,400,item.game+' rejects invalid input');}
view.setUint32(20,1200);const tall=await send({submission:{...submission,...cases[3]},image:Buffer.from(png).toString('base64')});assert.equal(tall.status,200);const tallData=await tall.json();assert.ok((await(await getSocialResult(new Request(tallData.url),tallData.id,bucket)).text()).includes('property="og:image:height" content="1200"'));
assert.equal((await send({submission:{...submission,game:'unknown'},image})).status,400);
console.log('PASS: all six games create validated result cards; per-game caption/title/CTA; unfinished and invalid results rejected; surrender; 1200px Connections image metadata.');

view.setUint32(20,630);const landscape=await send({submission,image:Buffer.from(png).toString('base64')});assert.equal(landscape.status,200);const landscapeData=await landscape.json();assert.ok((await(await getSocialResult(new Request(landscapeData.url),landscapeData.id,bucket)).text()).includes('property="og:image:height" content="630"'));console.log('PASS: new social links accept 1200×630 images while older result-image sizes remain supported.');

const {parseShareDate}=load('lib/sharing/submission-date.ts'),fixedNow=new Date('2026-10-19T12:00:00Z');
assert.equal(parseShareDate('2024-02-29',fixedNow).toISOString(),'2024-02-29T00:00:00.000Z');
for(const date of ['2026-02-29','2026-02-30','2026-04-31','2026-00-01','2026-13-01','2026-01-00','2099-99-99','2026-1-01','2026-10-20'])assert.throws(()=>parseShareDate(date,fixedNow));
const dailyCases=[
 {game:'roster',id:date=>load('lib/game/engine.ts').daily(date).id,guesses:id=>rosters.find(q=>q.id===id).players,alternatives:rosters.map(q=>q.id),start:'2026-10-17'},
 {game:'missing-player',id:load('lib/game/missing.ts').dailyMissing,guesses:id=>[load('lib/game/missing.ts').missingChallenge(id).answer],alternatives:rosters.map(q=>q.id+'.0'),start:'2026-10-17'},
 {game:'guess-player',id:load('lib/game/guess-player.ts').dailyGuess,guesses:id=>[load('lib/game/guess-player.ts').guessProfile(id).handle],alternatives:load('lib/game/guess-player.ts').profiles.map(p=>p.id),start:'2026-10-18'},
 {game:'connections',id:load('lib/game/connections.ts').dailyConnections,guesses:id=>load('lib/game/connections.ts').connectionPuzzle(id).groups.map(g=>g.players),alternatives:load('lib/game/connections.ts').puzzles.map(p=>p.id),start:'2026-10-18'},
 {game:'ranking',id:load('lib/game/ranking.ts').dailyRanking,guesses:id=>load('lib/game/ranking.ts').rankingPuzzle(id).players,alternatives:load('lib/game/ranking.ts').puzzles.map(p=>p.id),start:'2026-10-18'},
 {game:'time-machine',id:load('lib/game/time-machine.ts').dailyTime,guesses:id=>[load('lib/game/time-machine.ts').timePuzzle(id).season],alternatives:load('lib/game/time-machine.ts').puzzles.map(p=>p.id),start:'2026-10-18'},
];
for(const item of dailyCases){
 const date='2026-10-18',id=item.id(new Date(date+'T00:00:00Z'));
 const valid={...submission,game:item.game,mode:'daily',date,id,guesses:item.guesses(id)};
 assert.equal((await send({submission:valid,image})).status,200,item.game+' accepts historical daily result');
 const other=item.alternatives.find(x=>x!==id),before=objects.size;
 assert.equal((await send({submission:{...valid,id:other,guesses:item.guesses(other)},image})).status,400,item.game+' rejects wrong daily question');
 for(const bad of ['2099-99-99','2026-02-30'])assert.equal((await send({submission:{...valid,date:bad},image})).status,400,item.game+' rejects impossible date');
 const future=new Date();future.setUTCDate(future.getUTCDate()+1);const futureDate=future.toISOString().slice(0,10),futureId=item.id(future);
 assert.equal((await send({submission:{...valid,date:futureDate,id:futureId,guesses:item.guesses(futureId)},image})).status,400,item.game+' rejects future daily result');
 const predate=new Date(item.start+'T00:00:00Z');predate.setUTCDate(predate.getUTCDate()-1);const preId=item.id(predate);
 assert.equal((await send({submission:{...valid,date:predate.toISOString().slice(0,10),id:preId,guesses:item.guesses(preId)},image})).status,400,item.game+' rejects pre-launch daily result');
 assert.equal(objects.size,before,'Rejected daily claims must not write storage');
 assert.equal((await send({submission:{...valid,mode:'practice',id:other,guesses:item.guesses(other)},image})).status,200,item.game+' practice accepts any valid question');
 assert.equal((await send({submission:{...valid,mode:'practice',date:'2099-99-99'},image})).status,400,item.game+' practice requires a real date too');
}
const legacyDate=new Date('2026-10-17T00:00:00Z'),legacyRoster=load('lib/game/engine.ts').daily(legacyDate);
assert.equal((await send({submission:{...submission,id:legacyRoster.id,guesses:legacyRoster.players,mode:'daily',date:'2026-10-17'},image})).status,200,'Roster legacy daily results remain shareable');
console.log('PASS: all six games validate real UTC share dates, reject future/pre-launch/mismatched daily claims without storage writes, and preserve historical daily, roster legacy and practice sharing.');
