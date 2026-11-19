/* ===== セーブ ===== */
let SAVE='astral_save_v1';
function newGame(){return{v:2,gold:120,h:{rio:{lv:1,xp:0,hp:null,w:null,a:null},gald:{lv:1,xp:0,hp:null,w:null,a:null}},
 items:{potion:3,drop:1,feather:1},mats:{haiseki:0,kiba:0,kakera:0},q:{wolf:0,done:{}},flags:{chest:{},boss1:false},known:{},speed:1};}
function save(){try{localStorage.setItem(SAVE,JSON.stringify(G));return true;}catch(e){return false;}}
function loadSave(){try{const s=localStorage.getItem(SAVE);return s?JSON.parse(s):null;}catch(e){return null;}}
const enc=o=>btoa(unescape(encodeURIComponent(JSON.stringify(o))));
const dec=t=>JSON.parse(decodeURIComponent(escape(atob(t.trim()))));
function healAll(){for(const id of G.members)G.h[id].hp=null;}
const addItem=(k,n)=>{G.items[k]=Math.min(9,(G.items[k]||0)+n);};
const goldTxt=()=>`<span style="float:right;color:#ffe27a">${G.gold}G${G.tou?'　<span style="color:#9fd8ff">灯力'+G.tou+'</span>':''}</span>`;

/* ===== 町の絵 ===== */
function makeTown(){const c=document.createElement('canvas');c.width=W;c.height=128;const g=c.getContext('2d');const R=rng(11);
 const sky=['#0b1030','#1b2350','#3a3a6e','#7a5a7a'],hz=96;
 for(let y=0;y<hz;y++)for(let x=0;x<W;x++){const t=y/hz*(sky.length-1),i=Math.min(sky.length-2,Math.floor(t));g.fillStyle=(t-i)*16>BY[(y%4)*4+x%4]?sky[i+1]:sky[i];g.fillRect(x,y,1,1);}
 for(let i=0;i<50;i++){g.fillStyle=R()<.5?'#fff':'#c8d0ff';g.fillRect(R()*W|0,R()*60|0,1,1);}
 for(let y=30;y<hz;y++){const w=4+(y-30)*.09;g.fillStyle=(y>>3)%2?'#2e2e44':'#3a3a56';g.fillRect(90-w|0,y,Math.ceil(w*2),1);}
 g.fillStyle='#22223a';g.fillRect(84,28,12,3);g.fillStyle='#fff3b0';g.fillRect(86,20,8,8);g.fillStyle='#ffd36a';g.fillRect(87,21,6,6);
 g.fillStyle='#22223a';for(let i=0;i<5;i++)g.fillRect(85+i,19-i,10-i*2,1);
 let x=0;while(x<W){const w=12+R()*12|0,h=16+R()*26|0;if(x+w>74&&x<106){x=106;continue;}
  const col=R()<.5?'#1a1d33':'#22264a';g.fillStyle=col;g.fillRect(x,hz-h,w,h);
  for(let i=0;i<=w/2;i++)g.fillRect(x+i,hz-h-i*.6|0,w-i*2,1);
  for(let wy=hz-h+4;wy<hz-4;wy+=6)for(let wx=x+2;wx<x+w-3;wx+=5)if(R()<.55){g.fillStyle=R()<.8?'#ffd36a':'#ffa040';g.fillRect(wx,wy,2,3);}
  x+=w+1;}
 for(let y=hz;y<128;y++)for(let x2=0;x2<W;x2++){g.fillStyle=((x2+(y>>2)*3)%8===0||y%4===0)?'#24222f':'#33304a';g.fillRect(x2,y,1,1);}
 return c;}
let TOWN=makeTown();
function drawTown(){}/* 未使用：js/ver18-town.js が置き換え */

/* ===== フィールドのタイル（探索マップは廃止。ch7・ch8 が TL に足すので入れ物と tl だけ残す） ===== */
function tl(fn,seed){const c=document.createElement('canvas');c.width=c.height=16;const g=c.getContext('2d');fn(g,rng(seed));return c;}
const px=(g,c,x,y,w=1,h=1)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
const TL={};

/* ===== 灰の街道 ===== */
const MAP_HAIDO=["TTTTTTTT####TTTTTTTT","TTTTTTT#,,,,#TTTTTTT","TTTTTTT#,,B,#TTTTTTT","TTTTTTT#,,,,#TTTTTTT","TTTT...##,,##...TTTT","TTT.....,,,,....C.TT","TT..RR..,,......R.TT","TT.....,,...~~~...TT","T..G...,,..~~~~~..TT","T.....,,....~~~...TT","TT...,,..........TTT","TT..,,.....TT.....TT","TTC.,,....TTTT....TT","TT..,,,....TT...G.TT","TTT...,,,.........TT","TTTT....,,,....RR.TT","TTT.......,,......TT","TT..~~~....,,.....TT","TT.~~~~~...,,..C..TT","TT..~~~...,,......TT","TT.......,,....TTTTT","TTTT...,,,...TTTTTTT","TTTTT.,,......TTTTTT","TTTT..,,...R...TTTTT","TTT...,,.......G.TTT","TT....,,,.........TT","TT.C....,,....RR..TT","TTT......,,.......TT","TTTT......,,....TTTT","TTTTT.....,,..TTTTTT","TTTTTT....,,.TTTTTTT","TTTTTTT...,,TTTTTTTT","TTTTTTTT..S.TTTTTTTT","TTTTTTTTTTTTTTTTTTTT"].map(r=>r.padEnd(20,'T').slice(0,20));
let MAP1=MAP_HAIDO,MW=20,MH=MAP1.length,AREA='haido',A=null,MX=-9,MY=-9,NX=-9,NY=-9,EX=-9,EY=-9,VX=-9,VY=-9,UX=-9,UY=-9,DX=-9,DY=-9;
const FXHOOK=[];
let CHESTS=[];
let CREW=[],BSX=-9,BSY=-9;
function setArea(id){AREA=id;A=AREAS[id];MAP1=A.map||MAP_HAIDO;MW=MAP1[0].length;MH=MAP1.length;CHESTS=[];BSX=BSY=MX=MY=NX=NY=EX=EY=VX=VY=UX=UY=DX=DY=-9;F&&(F.bolt=null);
 MAP1.forEach((r,y)=>[...r].forEach((t,x)=>{if(t==='C')CHESTS.push(x+','+y);if(t==='B'){BSX=x;BSY=y;}if(t==='M'){MX=x;MY=y;}if(t==='N'){NX=x;NY=y;}if(t==='E'){EX=x;EY=y;}if(t==='V'){VX=x;VY=y;}if(t==='U'){UX=x;UY=y;}if(t==='D'){DX=x;DY=y;}}));CREW=A.crew;GROUPS=A.groups;}
const ck=(x,y)=>AREA==='haido'?x+','+y:AREA==='tower'?'tw'+G.tower.cur+':'+x+','+y:AREA==='kairou'?'kr'+G.kairou.cur+':'+x+','+y:AREA+':'+x+','+y;
let GROUPS=[];
function tileAt(){return'T';}/* 探索マップは廃止（v31/quests.js）。名前だけ残す */
const walk=(x,y)=>'.,CcGgSfzrlEihoxLnt^evm'.includes(tileAt(x,y));

function enterField(){}function spawnOne(){}function afterBattle(){}function fieldMenu(){}function pauseMenu(){}function renderPartyStatic(){}/* 探索マップは廃止（v31/quests.js）。名前だけ残す */

let lastT=0;
function banner(h,c='#ffe27a'){const d=document.createElement('div');d.className='bnr';d.style.top=(38+$('#pops').querySelectorAll('.bnr').length*16)+'%';d.innerHTML=h;d.style.borderColor=c;$('#pops').appendChild(d);setTimeout(()=>d.remove(),2300);}

function drawField(){}/* 未使用：js/ver18-field.js が置き換え */
cv.addEventListener('pointerdown',ev=>{const r=cv.getBoundingClientRect();if(scene==='board')return boardTap(ev.clientX-r.left,ev.clientY-r.top);});
