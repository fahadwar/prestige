export default function GameMark({game}:{game:string}){
 if(game==='/')return <span className="nav-game-mark nav-lobby-mark" aria-hidden="true"><img src="/prestige-monogram-concept.png" alt="" width={32} height={32}/></span>;
 return <svg className="nav-game-mark" viewBox="0 0 32 32" aria-hidden="true" fill="none"><path className="mark-backplate" d="M3 1H26L31 6V29L29 31H6L1 26V3Z"/>
 {game==='/roster'&&<><path className="mark-muted" d="M4 9H11V24H4ZM21 9H28V24H21Z"/><path className="mark-solid" d="M12 6H20V26H12Z"/><path className="mark-cut" d="M14 20H18V22H14Z"/><path className="mark-detail" d="M5 26H10M22 26H27"/></>}
 {game==='/guess-player'&&<><path className="mark-muted" d="M8 5H24V27H8Z"/><path className="mark-solid" d="M13 9H20L22 11V15L18 18V20H14V16L18 13V12H13ZM14 22H18V25H14Z"/><path className="mark-detail" d="M4 12V6H7M28 20V26H25"/></>}
 {game==='/connections'&&<><path className="mark-solid" d="M5 6H11V11H5ZM13 6H19V11H13ZM21 6H27V11H21Z"/><path className="mark-muted" d="M5 14H11V19H5ZM13 14H19V19H13ZM21 14H27V19H21ZM5 22H11V27H5ZM13 22H19V27H13ZM21 22H27V27H21Z"/><path className="mark-detail" d="M10 8H22"/></>}
 {game==='/missing-player'&&<><path className="mark-muted" d="M4 8H11V25H4ZM21 8H28V25H21Z"/><path className="mark-dashed" d="M13 5H19V27H13Z"/><path className="mark-solid" d="M15 12H17V18H15ZM15 20H17V22H15Z"/></>}
 {game==='/ranking'&&<><path className="mark-solid" d="M5 7H11V27H5Z"/><path className="mark-muted" d="M13 13H19V27H13ZM21 19H27V27H21Z"/><path className="mark-detail" d="M6 4H10M14 10H18M22 16H26"/></>}
 {game==='/time-machine'&&<><path className="mark-muted" d="M4 8 20 4 25 25 9 29Z"/><path className="mark-solid" d="M11 7H28V25H11Z"/><path className="mark-cut" d="M14 10H25V13H14ZM14 16H18V21H14ZM21 16H25V21H21Z"/><path className="mark-detail" d="M5 13 7 12M6 17 8 16"/></>}
 </svg>
}
