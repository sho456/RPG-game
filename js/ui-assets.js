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
const FACE={};function face(id,aw){const k=id+(aw?'_aw':'');if(FACE[k])return FACE[k];const b=bbox(id),c=document.createElement('canvas');c.width=c.height=16;
 c.getContext('2d').drawImage(IMG[aw&&IMG[id+'_aw']?id+'_aw':id],b.x,b.y,Math.min(16,b.w),Math.min(12,b.h),(16-Math.min(16,b.w))>>1,2,Math.min(16,b.w),Math.min(12,b.h));return FACE[k]=c.toDataURL();}
function hud(h){const d=$('#hud');d.innerHTML=h||'';d.style.display=h?'block':'none';}
const chapter=()=>G.flags.boss8?'クリア後':G.flags.boss7?'終章':G.flags.boss6?'第6章':G.flags.boss5?'第5章':G.flags.boss4?'第4章':G.flags.boss3?'第3章':G.flags.boss2?'第2章':G.flags.boss1?'第1章':'序章';
let TBG=null;const SHOOT=[];
function drawTitle(){const tc=$('#tcv');if(!tc)return;const g=tc.getContext('2d');g.imageSmoothingEnabled=false;
 if(!TBG){TBG=document.createElement('canvas');TBG.width=W;TBG.height=320;const b=TBG.getContext('2d'),R=rng(77);const cols=['#03040e','#0a0f30','#18205a','#2e2e6e'];
  for(let y=0;y<192;y++)for(let x=0;x<W;x++){const t=y/192*3,i=Math.min(2,Math.floor(t));b.fillStyle=(t-i)*16>BY[(y%4)*4+x%4]?cols[i+1]:cols[i];b.fillRect(x,y,1,1);}
  for(let i=0;i<140;i++){b.fillStyle=['#fff','#c8d0ff','#ffe9a0','#8890c0'][R()*4|0];b.fillRect(R()*W|0,R()*180|0,1,1);}b.drawImage(TOWN,0,0,W,128,0,192,W,128);}
 g.drawImage(TBG,0,0);const a=.25+.1*Math.sin(tick/25);const gr=g.createRadialGradient(90,216,2,90,216,60);gr.addColorStop(0,`rgba(255,230,140,${a+.25})`);gr.addColorStop(1,'rgba(255,230,140,0)');g.fillStyle=gr;g.fillRect(20,150,140,140);
 const dx=Math.cos(tick/90);g.fillStyle=`rgba(255,240,180,${.12*Math.abs(dx)})`;g.beginPath();g.moveTo(90,216);g.lineTo(90+dx*160,190);g.lineTo(90+dx*160,240);g.fill();
 if(Math.random()<.02)SHOOT.push({x:Math.random()*W,y:Math.random()*80,l:0});
 for(let i=SHOOT.length-1;i>=0;i--){const s=SHOOT[i];s.l++;s.x-=2.2;s.y+=1.1;for(let k=0;k<12;k++){g.fillStyle=`rgba(255,255,230,${(1-k/12)*(1-s.l/40)})`;g.fillRect(s.x+k*2|0,s.y-k|0,1,1);}if(s.l>40)SHOOT.splice(i,1);}}
