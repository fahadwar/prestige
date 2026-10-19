import {z} from 'zod';
import {puzzles,seasons,dailyTime,timePool,timeQuestion,evaluateTime} from '../../../lib/game/time-machine';
const headers={'Cache-Control':'no-store'};
export async function GET(request:Request){try{
 const u=new URL(request.url),mode=u.searchParams.get('mode')||'daily';if(!['daily','practice'].includes(mode))throw Error('اختيار غير صالح');
 const pool=timePool(u.searchParams.get('exclude')),id=mode==='daily'?dailyTime():pool[Math.floor(Math.random()*pool.length)].id;
 return Response.json({question:timeQuestion(id),seasons,day:Math.floor(Date.now()/86400000),date:new Date().toISOString().slice(0,10),coverage:{questions:puzzles.length}},{headers});
}catch{return Response.json({error:'تعذر تحميل التحدي'},{status:400,headers});}}
export async function POST(request:Request){try{
 const raw=await request.text();if(raw.length>2048)return Response.json({error:'الطلب كبير جداً'},{status:413,headers});
 const b=z.object({id:z.string().max(40),guesses:z.array(z.number().int()).max(3),mode:z.enum(['daily','practice']),surrender:z.boolean().optional()}).parse(JSON.parse(raw));
 if(b.mode==='daily'&&b.id!==dailyTime())throw Error('بدأ تحدٍ يومي جديد. أعد تحميل الصفحة');
 return Response.json(evaluateTime(b.id,b.guesses,b.surrender===true),{headers});
}catch(e){return Response.json({error:e instanceof z.ZodError||e instanceof SyntaxError?'طلب غير صالح':e instanceof Error?e.message:'تعذر التحقق من الموسم'},{status:400,headers});}}
