import {z} from 'zod';
import {dailyMissing,missingQuestion,missingOptions,evaluateMissing} from '../../../lib/game/missing';
import {practicePool,dayNumber} from '../../../lib/game/engine';
const headers={'Cache-Control':'no-store'};
export async function GET(request:Request){try{
 const u=new URL(request.url),mode=u.searchParams.get('mode')||'daily',season=u.searchParams.get('season');
 if(!['daily','practice'].includes(mode)||season&&!['2017','2018','2019','2020','2021','2022','2023','2024','2025','2026'].includes(season))throw Error('اختيار غير صالح');
 let id=dailyMissing();if(mode==='practice'){const pool=practicePool(season,u.searchParams.get('exclude'));const q=pool[Math.floor(Math.random()*pool.length)];id=q.id+'.'+Math.floor(Math.random()*q.rosterSize);}
 return Response.json({question:missingQuestion(id),players:missingOptions(id),day:dayNumber(),date:new Date().toISOString().slice(0,10)},{headers});
}catch{return Response.json({error:'تعذر تحميل التحدي'},{status:400,headers});}}
export async function POST(request:Request){try{
 const raw=await request.text();if(raw.length>2048)return Response.json({error:'الطلب كبير جداً'},{status:413,headers});
 const b=z.object({id:z.string().max(40),guesses:z.array(z.string().max(80)).max(3),mode:z.enum(['daily','practice']),surrender:z.boolean().optional()}).parse(JSON.parse(raw));
 if(b.mode==='daily'&&b.id!==dailyMissing())throw Error('بدأ تحدٍ يومي جديد. أعد تحميل الصفحة');
 return Response.json(evaluateMissing(b.id,b.guesses,b.surrender===true),{headers});
}catch(e){return Response.json({error:e instanceof z.ZodError||e instanceof SyntaxError?'طلب غير صالح':e instanceof Error?e.message:'تعذر التحقق من الإجابة'},{status:400,headers});}}
