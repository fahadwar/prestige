import {z} from 'zod';
import {daily,rosters,players,evaluate,dayNumber,practicePool} from '../../../lib/game/engine';
import coverage from '../../../data/coverage.json';
const headers={'Cache-Control':'no-store'};
export async function GET(request:Request){
 const u=new URL(request.url),practice=u.searchParams.get('mode')==='practice',season=u.searchParams.get('season');
 if(season&&!['2017','2018','2019','2020','2021','2022','2023','2024','2025','2026'].includes(season))return Response.json({error:'الموسم غير متاح'},{status:400,headers});
 const pool=practicePool(season,u.searchParams.get('exclude')),q=practice?pool[Math.floor(Math.random()*pool.length)]:daily();
 const {players:answers,...question}=q;
 return Response.json({question,players,day:dayNumber(),date:new Date().toISOString().slice(0,10),coverage:{...coverage.summary,bySeason:coverage.summary.bySeason},seasons:[2017,2018,2019,2020,2021,2022,2023,2024,2025,2026]}, {headers});
}
export async function POST(request:Request){
 try{
  const raw=await request.text();if(raw.length>4096)return Response.json({error:'الطلب كبير جداً'},{status:413,headers});
  const b=z.object({id:z.string().max(40),guesses:z.array(z.string().max(80)).max(10),hints:z.number().int().min(0).max(2),mode:z.enum(['daily','practice']),surrender:z.boolean().optional()}).parse(JSON.parse(raw));
  if(b.mode==='daily'&&b.id!==daily().id)throw Error('بدأ تحدٍ يومي جديد. أعد تحميل الصفحة');
  return Response.json(evaluate(b.id,b.guesses,b.hints,b.surrender===true),{headers});
 }catch(e){return Response.json({error:e instanceof z.ZodError?'طلب غير صالح':e instanceof Error?e.message:'تعذر التحقق من الإجابة'},{status:400,headers});}
}
