/* ===== UI素材 ===== */
const ICS={
go:["..y.........","..yrrrrr....","..yrrrrrr...","..yrrrrrrr..","..yrrrrrr...","..yrrrrr....","..y.........","..y.........","..y.........","..y.........",".yyy........","yyyyy......."],
eq:["..........m.",".........mm.","........mmM.",".......mmM..","......mmM...",".....mmM....","..y.mmM.....","...yyM......","...by.......","..b..y......",".b..........","............"],
bar:["............","..wwwww.....",".wwwwwww....",".bbbbbbb....",".byyyyyb.bb.",".byyyyyb..b.",".byyyyyb..b.",".byyyyyb.bb.",".byyyyyb....",".bbbbbbb....","............","............"],
smith:["............","...MMMM.....","...MmmM.b...","...MMMM.b...",".....b..b...",".....b......","..MMMMMMMM..","...MmmmmmM..","....MMMMM...","....MMMMM...","...MMMMMMM..","............"],
eye:["............","...MMMM.....","..M....M....",".M..uu..M...",".M.u..u.M...",".M.u..u.M...",".M..uu..M...","..M....M....","...MMMMbb...","........bb..",".........bb.","............"],
shop:["............","....bbb.....",".....w......","....w.w.....","...w...w....","..wxxxxxw...","..wxxxxxw...","..wxxkxxw...","..wxxxxxw...","...wwwww....","............","............"],
star:[".....y......",".....y......","....yyy.....","yyyyyyyyyyy.",".yyyyyyyyy..","..yyyyyyy...","..yyyyyyy...",".yyyy.yyyy..",".yyy...yyy..",".y.......y..","............","............"],
rec:["............",".rrrrrrrr...",".rwwwwwwrr..",".rwqqqqwrr..",".rwwwwwwrr..",".rwqqqqwrr..",".rwwwwwwrr..",".rwqqqwwrr..",".rwwwwwwrr..",".rrrrrrrrr..","..RRRRRRRR..","............"],
door:["............","...bbbbbb...","..bddddddb..","..bddddddb..","..bddddddb..","..bddddydb..","..bddddddb..","..bddddddb..","..bddddddb..","..bddddddb..",".bbbbbbbbbb.","............"]};
const ICON={};for(const k in ICS){const c=document.createElement('canvas');c.width=c.height=12;const g=c.getContext('2d');ICS[k].forEach((r,y)=>{r=r.padEnd(12,'.');for(let x=0;x<12;x++){const ch=r[x];if(ch!=='.'){g.fillStyle=PAL[ch]||'#f0f';g.fillRect(x,y,1,1);}}});ICON[k]=c.toDataURL();}
function face(){}/* 未使用：js/ver18-art.js が置き換え */
function hud(h){const d=$('#hud');d.innerHTML=h||'';d.style.display=h?'block':'none';}
const chapter=()=>G.flags.boss8?'クリア後':G.flags.boss7?'終章':G.flags.boss6?'第6章':G.flags.boss5?'第5章':G.flags.boss4?'第4章':G.flags.boss3?'第3章':G.flags.boss2?'第2章':G.flags.boss1?'第1章':'序章';
const SHOOT=[];
function drawTitle(){}
