import {z} from 'zod';
import {evaluate,rosters} from '../game/engine';
import {rosterShareText} from './roster-share';
import {evaluateGuess} from '../game/guess-player';
import {evaluateMissing} from '../game/missing';
import {evaluateRanking} from '../game/ranking';
import {evaluateConnections} from '../game/connections';
import {evaluateTime} from '../game/time-machine';
import {resultCaption} from './result-types';
import {validateShareDate} from './submission-date';
export const shareId=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const input=z.object({submission:z.object({game:z.enum(['roster','guess-player','missing-player','connections','ranking','time-machine']).default('roster'),id:z.string().max(40),guesses:z.union([z.array(z.string().max(80)).max(10),z.array(z.number().int()).max(3),z.array(z.array(z.string().max(80)).max(4)).max(7)]),hints:z.number().int().min(0).max(2).default(0),surrender:z.boolean(),mode:z.enum(['daily','practice']),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/)}),image:z.string().max(1500000)});
const noStore={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export type SocialMeta={title:string;description:string;createdAt:string;gamePath?:string;height?:number};
function encodeMeta(value:SocialMeta){return btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value))))}
export function decodeMeta(value:string):SocialMeta{return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(value),c=>c.charCodeAt(0))))}
export async function createSocialLink(request:Request,bucket?:R2Bucket){
 try{
 if(request.headers.get('Origin')!==new URL(request.url).origin)return Response.json({error:'طلب غير مسموح'},{status:403,headers:noStore});
 if(!bucket)return Response.json({error:'خدمة روابط النتائج غير جاهزة'},{status:503,headers:noStore});
 if(Number(request.headers.get('content-length'))>1550000)return Response.json({error:'الصورة كبيرة جداً'},{status:413,headers:noStore});
 const reader=request.body?.getReader();if(!reader)throw Error('طلب غير صالح');const chunks:Uint8Array[]=[];let length=0;while(true){const r=await reader.read();if(r.done)break;length+=r.value.length;if(length>1550000){await reader.cancel();return Response.json({error:'الصورة كبيرة جداً'},{status:413,headers:noStore})}chunks.push(r.value)}const all=new Uint8Array(length);let pos=0;for(const chunk of chunks){all.set(chunk,pos);pos+=chunk.length}
 const {submission:s,image}=input.parse(JSON.parse(new TextDecoder().decode(all)));
 validateShareDate(s);
 const names=()=>{if(!s.guesses.every(g=>typeof g==='string'))throw Error('محاولات غير صالحة');return s.guesses as string[]};
 const titleMap={'roster':'تحدي التشكيلة','guess-player':'من اللاعب؟','missing-player':'اللاعب المفقود','connections':'روابط اللاعبين','ranking':'رتّبهم','time-machine':'آلة الزمن'};
 let result:{done:boolean;won:boolean;score:number;maxScore:number};let description:string;
 if(s.game==='roster'){const r=evaluate(s.id,names(),s.hints,s.surrender);if(!r.done||!r.answers)throw Error('أكمل الجولة أولاً');const q=rosters.find(q=>q.id===s.id)!;result=r;description=rosterShareText({team:q.team,season:q.season,date:s.date,mode:s.mode,...r,answers:r.answers})}
 else{if(s.game==='guess-player')result=evaluateGuess(s.id,names(),s.surrender);else if(s.game==='missing-player')result=evaluateMissing(s.id,names(),s.surrender);else if(s.game==='ranking')result=evaluateRanking(s.id,names());else if(s.game==='time-machine'){if(!s.guesses.every(g=>typeof g==='number'))throw Error('محاولات غير صالحة');result=evaluateTime(s.id,s.guesses as number[],s.surrender)}else{if(!s.guesses.every(g=>Array.isArray(g)&&g.every(p=>typeof p==='string')))throw Error('محاولات غير صالحة');result=evaluateConnections(s.id,s.guesses as string[][],s.surrender)}if(!result.done)throw Error('أكمل الجولة أولاً');description=resultCaption({game:s.game,title:titleMap[s.game],date:s.date,mode:s.mode,...result,summary:'',players:[]})}
 const bytes=Uint8Array.from(atob(image),c=>c.charCodeAt(0));if(bytes.length<33||bytes.length>1100000||![137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))throw Error('صيغة صورة غير صالحة');const view=new DataView(bytes.buffer);if(view.getUint32(8)!==13||view.getUint32(12)!==0x49484452||view.getUint32(16)!==1200||![630,840,1200].includes(view.getUint32(20)))throw Error('أبعاد الصورة غير صالحة');
 const meta:SocialMeta={title:`برستيج | ${titleMap[s.game]} — ${result.score} من ${result.maxScore}`,description,createdAt:new Date().toISOString(),gamePath:'/'+s.game,height:view.getUint32(20)};
 // Same completed result + same image reuses the same object and URL.
 const metadataBytes=new TextEncoder().encode(meta.title+meta.description),fingerprint=new Uint8Array(bytes.length+metadataBytes.length);fingerprint.set(bytes);fingerprint.set(metadataBytes,bytes.length);const hash=await crypto.subtle.digest('SHA-256',fingerprint);const hex=[...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');const id=hex.slice(0,8)+'-'+hex.slice(8,12)+'-4'+hex.slice(13,16)+'-a'+hex.slice(17,20)+'-'+hex.slice(20,32);
 await bucket.put('results/'+id+'.png',bytes,{httpMetadata:{contentType:'image/png'},customMetadata:{card:encodeMeta(meta)}});
 return Response.json({id,url:new URL('/share/'+id,request.url).toString()},{headers:noStore});
 }catch{return Response.json({error:'تعذر إنشاء رابط النتيجة. تحقق من اكتمال الجولة والصورة.'},{status:400,headers:noStore})}
}
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function socialHtml(meta:SocialMeta,url:string){const image=url+'/image';return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(meta.title)}</title><meta name="description" content="${escape(meta.description)}"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${escape(url)}"><meta property="og:type" content="website"><meta property="og:locale" content="ar_SA"><meta property="og:site_name" content="برستيج"><meta property="og:title" content="${escape(meta.title)}"><meta property="og:description" content="${escape(meta.description)}"><meta property="og:url" content="${escape(url)}"><meta property="og:image" content="${escape(image)}"><meta property="og:image:secure_url" content="${escape(image)}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="${meta.height||840}"><meta property="og:image:alt" content="بطاقة نتيجتي في برستيج"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(meta.title)}"><meta name="twitter:description" content="${escape(meta.description)}"><meta name="twitter:image" content="${escape(image)}"><meta name="twitter:image:alt" content="بطاقة نتيجتي في برستيج"><link rel="icon" href="/prestige-monogram-concept.png"><style>body{margin:0;padding:28px 16px;background:#10171b;color:#f2efdf;font:16px/1.8 Tahoma,Arial,sans-serif;text-align:center}main{max-width:850px;margin:auto}img{display:block;width:100%;height:auto;border:1px solid #4c603c;border-radius:12px}h1{font-size:24px}p{color:#b5c5a6;white-space:pre-line}a{display:inline-block;padding:12px 25px;background:#c1ff12;color:#17210f;border-radius:7px;font-weight:bold;text-decoration:none}</style></head><body><main><h1>تحدّي أصدقائك في برستيج</h1><img src="${escape(image)}" width="1200" height="${meta.height||840}" alt="بطاقة نتيجتي في برستيج"><p>${escape(meta.description)}</p><a href="${escape(meta.gamePath||'/roster')}">العب التحدي</a></main></body></html>`}
export async function getSocialResult(request:Request,id:string,bucket:R2Bucket|undefined,image=false){
 if(!shareId.test(id))return new Response('Not found',{status:404});if(!bucket)return new Response('Unavailable',{status:503});const key='results/'+id+'.png',object=image?await bucket.get(key):await bucket.head(key);if(!object)return new Response('Not found',{status:404});
 const headers={'Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"};
 if(image)return new Response((object as R2ObjectBody).body,{headers:{...headers,'Content-Type':'image/png','Content-Disposition':'inline'}});
 try{const meta=decodeMeta(object.customMetadata?.card||''),url=new URL('/share/'+id,request.url).toString();return new Response(socialHtml(meta,url),{headers:{...headers,'Content-Type':'text/html; charset=utf-8'}})}catch{return new Response('Not found',{status:404})}
}
