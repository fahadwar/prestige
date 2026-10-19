import {z} from 'zod';
import {puzzles,connectionsPool,connectionsQuestion,dailyConnections,evaluateConnections} from '../../../lib/game/connections';
const headers={'Cache-Control':'no-store'};
export async function GET(request:Request){try{
 const u=new URL(request.url),mode=u.searchParams.get('mode')||'daily',season=u.searchParams.get('season');
 if(!['daily','practice'].includes(mode)||season&&!puzzles.some(p=>String(p.season)===season))throw Error('اختيار غير صالح');
 const pool=connectionsPool(season,u.searchParams.get('exclude')),id=mode==='daily'?dailyConnections():pool[Math.floor(Math.random()*pool.length)].id;
 return Response.json({question:connectionsQuestion(id),day:Math.floor(Date.now()/86400000),date:new Date().toISOString().slice(0,10),coverage:{puzzles:puzzles.length,seasons:[2021,2022,2023,2024,2025,2026]}},{headers});
}catch{return Response.json({error:'تعذر تحميل التحدي'},{status:400,headers});}}
export async function POST(request:Request){try{
 const raw=await request.text();if(raw.length>4096)return Response.json({error:'الطلب كبير جداً'},{status:413,headers});
 const b=z.object({id:z.string().max(40),guesses:z.array(z.array(z.string().max(80)).length(4)).max(7),mode:z.enum(['daily','practice']),surrender:z.boolean().optional()}).parse(JSON.parse(raw));
 if(b.mode==='daily'&&b.id!==dailyConnections())throw Error('بدأ تحدٍ يومي جديد. أعد تحميل الصفحة');
 return Response.json(evaluateConnections(b.id,b.guesses,b.surrender===true),{headers});
}catch(e){return Response.json({error:e instanceof z.ZodError||e instanceof SyntaxError?'طلب غير صالح':e instanceof Error?e.message:'تعذر التحقق من الإجابة'},{status:400,headers});}}
