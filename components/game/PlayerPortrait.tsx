'use client';
import {useState} from 'react';
import {getPortrait} from '../../lib/game/portraits';
export default function PlayerPortrait({handle}:{handle:string}){
 const [failed,setFailed]=useState(false),portrait=getPortrait(handle),hasPhoto=portrait&&!failed;
 return <div className="player-portrait"><img key={hasPhoto?portrait.image:'fallback'} src={hasPhoto?portrait.image:'/players/silhouette.svg'} alt={hasPhoto?'صورة اللاعب '+handle:'صورة غير متاحة للاعب '+handle} width={100} height={112} loading="lazy" decoding="async" style={{objectPosition:portrait?.position||'center',objectFit:portrait?.fit||'cover'}} onError={()=>setFailed(true)}/></div>
}
