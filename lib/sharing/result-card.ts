import {getPortrait} from '../game/portraits';
import {arabicNumber} from './roster-share';
import {loadImage,text} from './roster-card';
import type {ResultCard} from './result-types';
export async function renderResultCard(value:ResultCard,showPlayers:boolean):Promise<Blob>{
 await document.fonts.ready;
 const players=value.players.slice(0,16),height=players.length>8?1200:840;
 const images=await Promise.all([loadImage('/prestige-wordmark-concept.png'),...players.map(p=>loadImage(showPlayers?(getPortrait(p.handle)?.image||'/players/silhouette.svg'):'/players/silhouette.svg'))]);
 const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=height;const c=canvas.getContext('2d');if(!c)throw Error('تعذر إنشاء بطاقة النتيجة');
 c.fillStyle='#10171b';c.fillRect(0,0,1200,height);c.strokeStyle='#29382c';for(let x=0;x<1200;x+=40){c.beginPath();c.moveTo(x,0);c.lineTo(x,height);c.stroke()}for(let y=0;y<height;y+=40){c.beginPath();c.moveTo(0,y);c.lineTo(1200,y);c.stroke()}c.fillStyle='#10171beb';c.fillRect(32,32,1136,height-64);c.fillStyle='#c1ff12';c.fillRect(65,45,100,5);
 if(images[0]){const im=images[0],h=80;c.drawImage(im,1118-h*im.width/im.height,50,h*im.width/im.height,h)}else text(c,'برستيج',1118,105,42);
 text(c,value.title,78,100,32,'#f2efdc','left');text(c,value.mode==='daily'?'تحدي اليوم':'تدريب',78,142,22,'#9cab92','left');text(c,value.won?'نجحت في التحدي!':'انتهت الجولة',600,205,35,'#c1ff63','center');
 text(c,showPlayers&&value.subject?value.subject:value.summary,600,250,24,'#c6d4bb','center');
 const columns=players.length>8?4:players.length>5?4:Math.max(players.length,1),rows=Math.ceil(players.length/columns),w=players.length===1?215:Math.min(215,(1040-(columns-1)*14)/columns),h=rows>1?145:245,gap=14,total=columns*w+(columns-1)*gap;
 for(let i=0;i<players.length;i++){const p=players[i],col=i%columns,row=Math.floor(i/columns),x=(1200-total)/2+(columns-1-col)*(w+gap),y=280+row*(h+14),photoHeight=h-62;c.fillStyle=p.correct?'#263a24':'#242b2f';c.fillRect(x,y,w,h);c.strokeStyle=p.correct?'#81ad4f':'#4f5e54';c.strokeRect(x,y,w,h);const im=images[i+1];if(im){c.save();c.beginPath();c.rect(x+5,y+5,w-10,photoHeight);c.clip();const scale=Math.max((w-10)/im.width,photoHeight/im.height);c.drawImage(im,x+(w-im.width*scale)/2,y+5,im.width*scale,im.height*scale);c.restore()}text(c,showPlayers?p.handle:'؟',x+w/2,y+h-34,23,'#f2efdc','center',w-14);text(c,showPlayers?p.tag:p.correct?'صحيح':'محاولة',x+w/2,y+h-10,16,p.correct?'#c1ff63':'#aab9a0','center',w-12);}
 const footer=height-220;text(c,`${arabicNumber(value.score)} / ${arabicNumber(value.maxScore)}`,600,footer+45,48,'#c1ff12','center');text(c,value.summary,600,footer+88,24,'#c8d4c1','center');c.fillStyle='#344a31';c.fillRect(78,height-95,1044,1);text(c,'مقدّم لكم من CDL Arabic',1118,height-54,20,'#afc29f');text(c,new Date(value.date+'T12:00:00Z').toLocaleDateString('ar-SA',{calendar:'gregory',year:'numeric',month:'long',day:'numeric'}),78,height-54,19,'#a6b496','left');
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('تعذر حفظ الصورة')),'image/png'));
}
