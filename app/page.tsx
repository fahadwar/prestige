'use client';
import {SiteHeader,SiteFooter} from '../components/game/SiteChrome';
import GameCover from '../components/game/GameCover';
import {ArrowUpLeft,Play,Flame} from 'lucide-react';
const games=[
 {id:'01',name:'التشكيلة',slug:'roster',desc:'كم اسماً تتذكر؟',label:'أكمل الفريق',accent:'#c1ff12'},
 {id:'02',name:'من اللاعب؟',slug:'guess-player',desc:'ست محاولات. لاعب واحد.',label:'اكتشف اللاعب',accent:'#c1ff12'},
 {id:'03',name:'روابط اللاعبين',slug:'connections',desc:'ستة عشر اسماً. أربع مجموعات.',label:'اربط الأسماء',accent:'#c1ff12'},
 {id:'04',name:'اللاعب المفقود',slug:'missing-player',desc:'اسم واحد يكمل التشكيلة.',label:'اعثر عليه',accent:'#c1ff12'},
 {id:'05',name:'رتّبهم',slug:'ranking',desc:'من الأكبر إلى الأصغر.',label:'رتّب الخمسة',accent:'#c1ff12'},
 {id:'06',name:'آلة الزمن',slug:'time-machine',desc:'تعرف الفريق. تتذكر الموسم؟',label:'اختر الموسم',accent:'#c1ff12'},
];
export default function Lobby(){return <><SiteHeader/><main className="lobby"><section className="lobby-hero"><div className="lobby-hero-copy"><span className="lobby-kicker"><Flame size={14}/> التحدي اليومي</span><h1>تعرفه.<br/><em>بس تقدر تجيبه؟</em></h1><p>لاعب واحد. ست محاولات.</p><a className="primary" href="/guess-player"><Play size={16} fill="currentColor"/> العب الآن</a><a className="hero-secondary" href="#games">كل الألعاب <ArrowUpLeft size={15}/></a></div><div className="lobby-hero-art" aria-hidden="true"><span className="hero-ring"/><span className="hero-art-word">GUESS WHO</span><div className="hero-player p-left"><img src="/players/bp-simp.webp" alt=""/><span>SIMP</span></div><div className="hero-player p-right"><img src="/players/bp-shotzzy.webp" alt=""/><span>SHOTZZY</span></div><div className="hero-mystery">?<span>WHO'S NEXT?</span></div><span className="hero-coordinate">PRESTIGE — PLAYER UNKNOWN / 002</span></div></section><section id="games" className="lobby-games"><div className="lobby-heading"><h2>اختر التحدي</h2><span>06 / GAMES</span></div><div className="arcade-grid">{games.map(({id,name,slug,desc,label,accent})=><a className={'arcade-card arcade-'+slug} href={'/'+slug} key={id} style={{'--card-accent':accent} as React.CSSProperties}><GameCover game={slug} id={id}/><div className="arcade-info"><span className="arcade-label">{label}</span><h3>{name}</h3><p>{desc}</p><span className="arcade-play">العب <ArrowUpLeft size={17}/></span></div></a>)}</div></section><div className="lobby-bottom"><span><i/> تحدٍ جديد كل يوم</span><span>بدون تسجيل. ادخل والعب.</span></div><SiteFooter/></main></>}
