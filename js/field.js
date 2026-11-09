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
function drawTown(){ctx.drawImage(TOWN,0,0);if(G&&G.fac&&G.fac.garden)ctx.drawImage(ISLE,132,26+Math.round(Math.sin(tick/40)*2));const a=.18+.08*Math.sin(tick/25);
 const gr=ctx.createRadialGradient(90,24,2,90,24,40);gr.addColorStop(0,`rgba(255,230,140,${a+.2})`);gr.addColorStop(1,'rgba(255,230,140,0)');ctx.fillStyle=gr;ctx.fillRect(40,0,100,70);
 const ang=tick/90,dx=Math.cos(ang);ctx.fillStyle=`rgba(255,240,180,${.10*Math.abs(dx)})`;ctx.beginPath();ctx.moveTo(90,24);ctx.lineTo(90+dx*120,14);ctx.lineTo(90+dx*120,34);ctx.fill();}

/* ===== フィールドのタイル ===== */
function tl(fn,seed){const c=document.createElement('canvas');c.width=c.height=16;const g=c.getContext('2d');fn(g,rng(seed));return c;}
const px=(g,c,x,y,w=1,h=1)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
const grass=(g,R)=>{px(g,'#46563c',0,0,16,16);for(let i=0;i<16;i++)px(g,R()<.5?'#56684a':'#3a4832',R()*16|0,R()*16|0);for(let i=0;i<3;i++){const x=R()*14|0,y=R()*14|0;px(g,'#62744f',x,y);px(g,'#62744f',x+1,y-1);}};
const road=(g,R)=>{px(g,'#7d7058',0,0,16,16);for(let i=0;i<18;i++)px(g,R()<.5?'#918468':'#625744',R()*16|0,R()*16|0);for(let i=0;i<2;i++){const x=R()*13|0,y=R()*13|0;px(g,'#9a9488',x,y,2,2);px(g,'#5a5448',x+1,y+2,2,1);}};
const TL={};
['.','.','.'].forEach((_,i)=>TL['.'+i]=tl(grass,20+i));
TL[',']=tl(road,30);
for(let i=0;i<2;i++)TL['T'+i]=tl((g,R)=>{grass(g,R);for(let y=0;y<14;y++)for(let x=0;x<16;x++){const d=(x-7.5)**2/56+(y-6.5)**2/42;if(d<1)px(g,d<.5&&x<8&&y<7?'#4c6e3e':(R()<.15?'#24381f':'#33502c'),x,y);}px(g,'#4a3020',7,12,2,4);px(g,'#2a1c12',8,13,1,3);},40+i);
TL['R']=tl((g,R)=>{grass(g,R);for(let y=4;y<15;y++)for(let x=2;x<14;x++){const d=(x-8)**2/36+(y-10)**2/26;if(d<1)px(g,d<.35&&y<10?'#a6a6ae':y>11?'#55555c':'#7c7c86',x,y);}},50);
for(let f=0;f<2;f++)TL['~'+f]=tl((g,R)=>{px(g,'#2b4a74',0,0,16,16);for(let y=2;y<16;y+=5)for(let x=0;x<16;x++)if((x+f*3+y)%8<3)px(g,'#4a74a8',x,y);px(g,'#6a94c8',(f*7+3)%16,(f*5+8)%16);},60);
TL['#']=tl((g,R)=>{px(g,'#55556a',0,0,16,16);for(let y=0;y<16;y+=4){px(g,'#3e3e50',0,y+3,16,1);for(let x=(y%8?4:0);x<16;x+=8)px(g,'#3e3e50',x,y,1,4);}for(let i=0;i<6;i++)px(g,'#6a6a80',R()*16|0,R()*16|0);},70);
TL['C']=tl((g,R)=>{road(g,R);px(g,'#3a2412',3,6,10,8);px(g,'#8a5a2a',4,7,8,6);px(g,'#a8743a',4,7,8,2);px(g,'#e8c040',4,9,8,1);px(g,'#fff3a0',7,9,2,2);},80);
TL['c']=tl((g,R)=>{road(g,R);px(g,'#3a2412',3,8,10,6);px(g,'#5a3a1a',4,9,8,4);px(g,'#8a5a2a',4,5,8,3);px(g,'#e8c040',4,12,8,1);},80);
TL['G']=tl((g,R)=>{grass(g,R);px(g,'#6a6a78',5,9,6,4);px(g,'#9a9aa8',6,9,3,2);px(g,'#cfe8ff',8,6);px(g,'#cfe8ff',7,7,3,1);px(g,'#cfe8ff',8,8);},90);
TL['g']=tl((g,R)=>{grass(g,R);px(g,'#55555f',5,10,6,3);},90);
TL['S']=tl((g,R)=>{road(g,R);px(g,'#3a3a4e',7,3,2,12);px(g,'#22222e',5,14,6,2);px(g,'#ffd36a',6,1,4,3);px(g,'#fff3b0',7,2,2,1);},95);
TL['B']=tl((g,R)=>{road(g,R);for(let i=0;i<30;i++){const a=R()*6.28,r=R()*7;px(g,R()<.5?'#3b2a5c':'#6a4c9c',8+Math.cos(a)*r|0,8+Math.sin(a)*r|0);}},96);
const gr2=(g,R)=>{px(g,'#3a6a34',0,0,16,16);for(let i=0;i<18;i++)px(g,R()<.5?'#4c8442':'#2c5428',R()*16|0,R()*16|0);for(let i=0;i<3;i++){const x=R()*14|0,y=R()*14|0;px(g,'#6aa85a',x,y);px(g,'#6aa85a',x+1,y-1);}};
for(let i=0;i<3;i++)TL['F'+i]=tl(gr2,120+i);
for(let i=0;i<2;i++)TL['X'+i]=tl((g,R)=>{gr2(g,R);for(let y=0;y<14;y++)for(let x=0;x<16;x++){const d=(x-7.5)**2/56+(y-6.5)**2/42;if(d<1)px(g,d<.5&&x<8&&y<7?'#4a9a44':(R()<.15?'#1a4a1e':'#2a6a2c'),x,y);}px(g,'#4a3020',7,12,2,4);},130+i);
const snow=(g,R)=>{px(g,'#d8e4f0',0,0,16,16);for(let i=0;i<18;i++)px(g,R()<.5?'#ffffff':'#b8c8dc',R()*16|0,R()*16|0);};
for(let i=0;i<3;i++)TL['W'+i]=tl(snow,190+i);
for(let i=0;i<2;i++)TL['Z'+i]=tl((g,R)=>{snow(g,R);for(let y=1;y<13;y++){const w=Math.floor(y*.55)+1;for(let x=8-w;x<8+w;x++)px(g,(y%4===1)?'#f0f6ff':(R()<.2?'#1a3a2a':'#2a4a3a'),x,y);}px(g,'#4a3020',7,13,2,3);},195+i);
TL['i']=tl((g,R)=>{px(g,'#a8d8f0',0,0,16,16);for(let k=0;k<16;k++){px(g,'#e8f8ff',k,(k*.6+2)|0);px(g,'#e8f8ff',k,(k*.6+9)%16|0);}px(g,'#78b0d0',3,12,4,1);px(g,'#78b0d0',10,4,3,1);},197);
TL['h']=tl((g,R)=>{px(g,'#6a2a24',0,0,16,16);for(let y=3;y<16;y+=4){px(g,'#4a1a18',0,y,16,1);px(g,'#8a3a30',0,y-3,16,1);}for(let i=0;i<6;i++)px(g,'#7a3028',R()*16|0,R()*16|0);},198);
TL['r']=tl((g,R)=>{px(g,'#3a3228',0,0,16,16);for(let i=0;i<20;i++)px(g,R()<.5?'#4a4034':'#2a241c',R()*16|0,R()*16|0);},180);
TL['l']=tl((g,R)=>{px(g,'#3a3228',0,0,16,16);for(let i=0;i<14;i++)px(g,R()<.5?'#4a4034':'#2a241c',R()*16|0,R()*16|0);for(let x=1;x<16;x+=4)px(g,'#5a3a22',x,3,2,10);px(g,'#9a9aa4',0,5,16,1);px(g,'#9a9aa4',0,10,16,1);},181);
TL['Y']=tl((g,R)=>{px(g,'#1e1a16',0,0,16,16);for(let i=0;i<6;i++){const x=R()*12|0,y=R()*12|0;px(g,'#3a3228',x,y,4,3);px(g,'#4a4038',x,y,3,1);}for(let i=0;i<8;i++)px(g,'#0e0c0a',R()*16|0,R()*16|0);},182);
TL['E']=tl((g,R)=>{grass(g,R);px(g,'#5a5a66',3,2,10,14);px(g,'#8a8a96',4,2,8,14);px(g,'#a6a6b2',4,2,2,14);px(g,'#5a5a66',6,6,1,4);px(g,'#5a5a66',9,9,2,1);px(g,'#8a8a96',3,0,3,2);px(g,'#8a8a96',9,1,3,1);},183);
TL['z']=tl((g,R)=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++)px(g,((x>>3)+(y>>3))%2?'#7a768c':'#6a667c',x,y);px(g,'#5a566c',0,15,16,1);px(g,'#5a566c',15,0,1,16);for(let i=0;i<6;i++)px(g,'#8a86a0',R()*16|0,R()*16|0);},160);
TL['P']=tl((g,R)=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++)px(g,((x>>3)+(y>>3))%2?'#7a768c':'#6a667c',x,y);px(g,'#3a3648',3,14,10,2);px(g,'#b8b4cc',4,0,8,14);px(g,'#d8d4e8',5,0,2,14);px(g,'#8a86a0',10,0,2,14);px(g,'#e8e4f4',3,0,10,2);},170);
TL['f']=tl((g,R)=>{px(g,'#4a3a2e',0,0,16,16);for(let y=3;y<16;y+=4)px(g,'#3a2c22',0,y,16,1);for(let i=0;i<10;i++)px(g,'#5a4838',R()*16|0,R()*16|0);},140);
TL['K']=tl((g,R)=>{px(g,'#2a1a10',0,0,16,16);for(let y=1;y<16;y+=5){px(g,'#5a3a22',0,y+4,16,1);for(let x=1;x<15;x+=2)px(g,['#8a2a2a','#2a4a8a','#2a6a3a','#8a7a2a','#5a2a6a'][R()*5|0],x,y,1+(R()<.4?1:0),4);}},150);
TL['t']=tl((g,R)=>{px(g,'#2a2e58',0,0,16,16);px(g,'#20244a',0,15,16,1);px(g,'#20244a',15,0,1,16);for(let i=0;i<8;i++)px(g,R()<.7?'#4a4e88':'#ffffff',R()*16|0,R()*16|0);},220);
TL['^']=tl((g,R)=>{px(g,'#2a2e58',0,0,16,16);for(let i=0;i<4;i++){px(g,'#c8ccff',2+i,3+i*3,12-i*2,2);px(g,'#8890d0',2+i,5+i*3,12-i*2,1);}px(g,'#ffffff',7,1,2,2);},221);
TL['Q']=tl((g,R)=>{px(g,'#2a2e58',0,0,16,16);for(let i=0;i<4;i++){px(g,'#5a5e88',2+i,3+i*3,12-i*2,2);}px(g,'#b07cff',3,7,10,1);px(g,'#b07cff',7,3,1,10);},222);
TL['o']=tl((g,R)=>{px(g,'#5a6a78',0,0,16,16);for(let y=0;y<16;y+=8)px(g,'#4a5866',0,y+7,16,1);for(let x=0;x<16;x+=8)px(g,'#4a5866',x,0,1,16);for(let i=0;i<10;i++)px(g,R()<.5?'#3a6a4a':'#6a7a88',R()*16|0,R()*16|0);},210);
TL['x']=tl((g,R)=>{px(g,'#2b4a74',0,0,16,16);for(let y=1;y<16;y+=5){px(g,'#8a6a3a',1,y,14,4);px(g,'#a8885a',1,y,14,1);px(g,'#5a3a1a',1,y+3,14,1);}},211);
for(let f=0;f<2;f++)TL['L'+f]=tl((g,R)=>{px(g,'#5a6a78',0,0,16,16);px(g,'#3a3a48',5,10,6,4);px(g,'#8a8a96',7,f?6:3,2,7);px(g,f?'#6fb2ff':'#ffd34a',6,f?11:2,4,3);},212+f);
TL['n']=tl((g,R)=>{px(g,'#1e3a2a',0,0,16,16);for(let i=0;i<14;i++)px(g,R()<.5?'#3a8a6a':'#2a5a44',R()*16|0,R()*16|0);for(let i=0;i<4;i++)px(g,'#9fffe0',R()*16|0,R()*16|0);},214);
function tileImg(t,x,y){if(t==='L')return TL['L'+(F&&F.water==='low'?1:0)];if(t==='w')return TL['~'+((tick>>5)%2)];if(t==='m')return TL['m'+((tick>>4)%2)];const fo=A&&A.theme==='forest',ic=A&&A.theme==='ice';if(t==='.')return TL[(fo?'F':ic?'W':'.')+((x*7+y*13)%3)];if(t==='T')return TL[(fo?'X':ic?'Z':'T')+((x+y)%2)];if(t==='~')return TL['~'+((tick>>5)%2)];return TL[t]||TL['.0'];}

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
function tileAt(x,y){if(x<0||y<0||x>=MW||y>=MH)return'T';const t=MAP1[y][x],k=x+','+y;
 if(t==='C'&&G.flags.chest[ck(x,y)])return'c';if(t==='G'&&F.gathered[k])return'g';if(t==='B'&&F.bossDown)return AREA==='haido'?',':AREA==='seido'?'z':AREA==='raimei'?'r':AREA==='kouka'?'h':AREA==='ouito'?'o':AREA==='tower'||AREA==='zankyo'?'t':AREA==='kairou'?'v':AREA==='ryuu'?'r':'f';if(t==='Q')return F.bossDown?'^':'Q';if(t==='V')return'r';if(t==='w')return F.water==='low'?'o':'w';if(t==='x')return F.water==='high'?'x':'~';if(t==='n')return F.night?'n':'T';if(t==='J')return'.';if(t==='Y'&&AREA==='zankyo')return G.flags.echo&&G.flags.echo[k]?'t':'e';if(t==='D')return'r';if(t==='U')return'h';if(t==='M')return'f';if(t==='N')return'z';return t;}
const walk=(x,y)=>'.,CcGgSfzrlEihoxLnt^evm'.includes(tileAt(x,y));
function bfs(sx,sy,tx,ty){if(!walk(tx,ty))return null;const prev={},q=[[sx,sy]];prev[sx+','+sy]=null;
 while(q.length){const[x,y]=q.shift();if(x===tx&&y===ty){const p=[];let k=x+','+y;while(prev[k]!==null){p.unshift(k.split(',').map(Number));k=prev[k];}return p;}
  for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(k in prev||!walk(nx,ny))continue;prev[k]=x+','+y;q.push([nx,ny]);}}return null;}

function enterField(id='haido',keep){setArea(id);show('field');setH(224);F=null;
 let sx=0,sy=0;MAP1.forEach((r,y)=>{const i=r.indexOf('S');if(i>=0){sx=i;sy=y;}});
 const mkU=(x,y)=>({tx:x,ty:y,fx:x,fy:y,px:x*16,py:y*16,dir:-1});
 if(!keep)G.sorties++;F={water:'high',night:false,dayT:0,bossDown:false,pause:false,safe:0,gathered:{},p:Object.assign(mkU(sx,sy),{t:null,path:[]}),g:mkU(sx,sy),en:[],lock:false,left:false,camX:0,camY:0,tap:null,cur:null};
 for(let i=0;i<7;i++)spawnOne();
 log(A.intro+'行きたい場所をタップで移動。'+goldTxt());hud(`${A.name}　<b>${A.rec.replace('推奨','')}</b>`);fieldMenu();renderPartyStatic();fitField();}
function spawnOne(){for(let i=0;i<300;i++){const x=Math.random()*MW|0,y=Math.random()*MH|0;
 if(!walk(x,y)||'CGSBMNEVUiwxLnJ^QDY'.includes(MAP1[y][x]))continue;if(Math.abs(x-F.p.tx)+Math.abs(y-F.p.ty)<7)continue;if(F.en.some(e=>e.tx===x&&e.ty===y))continue;
 const[l0,l1]=A.lv,lv=Math.max(l0,Math.min(l1,l0+Math.floor((MH-3-y)/((MH-3)/(l1-l0+1))))),gs='fzrlho'.includes(MAP1[y][x])&&A.libGroups?A.libGroups:GROUPS;
 F.en.push({tx:x,ty:y,fx:x,fy:y,px:x*16,py:y*16,t:null,kinds:gs[Math.random()*gs.length|0],lv,dir:1,chase:false,cd:Math.random()*900});return;}}

let lastT=0;
function updField(dt){const p=F.p,g=F.g;if(F.lock||F.pause)return;if(F.safe>0)F.safe-=dt;
 if(AREA==='midori'){F.dayT+=dt;if(F.dayT>40000&&MAP1[p.ty][p.tx]!=='n'&&p.t==null){F.dayT=0;F.night=!F.night;banner(F.night?'夜になった――月明かりの小道が現れた':'朝になった','#9fd8ff');}}
 if(A.theme==='storm'){const pt=MAP1[p.ty][p.tx],out='.,GE'.includes(pt);
  if(F.bolt){F.bolt.t-=dt;if(F.bolt.t<=0){const bo=F.bolt;F.bolt=null;F.flash=8;F.strike={x:bo.x,y:bo.y,t:12};SFX.brk();
   if(bo.x===p.tx&&bo.y===p.ty){G.party.forEach(id=>{const m=stats(id).mhp;G.h[id].hp=Math.max(1,(G.h[id].hp??m)-Math.round(m*.08));});log('<b>落雷！</b> パーティがダメージを受けた（HP-8%）');renderPartyStatic();}}}
  else if(out){F.boltCd=(F.boltCd??2500)-dt;if(F.boltCd<=0){F.boltCd=2200+Math.random()*2000;for(let i=0;i<10;i++){const x=p.tx+(Math.random()*5|0)-2,y=p.ty+(Math.random()*5|0)-2;if('.,'.includes(tileAt(x,y))){F.bolt={x,y,t:1000};break;}}}}}
 if(p.t!=null){p.t+=dt/(MAP1[p.ty][p.tx]==='i'?75:150);const k=Math.min(1,p.t);p.px=(p.fx+(p.tx-p.fx)*k)*16;p.py=(p.fy+(p.ty-p.fy)*k)*16;g.px=(g.fx+(g.tx-g.fx)*k)*16;g.py=(g.fy+(g.ty-g.fy)*k)*16;
  if(p.t>=1){p.t=null;arrive();if(F.lock)return;}}
 if(p.t==null&&p.path.length){const n=p.path.shift();const e=F.en.find(o=>o.tx===n[0]&&o.ty===n[1]);if(e)return encounter(e,true);
  p.fx=p.tx;p.fy=p.ty;p.tx=n[0];p.ty=n[1];if(p.tx!==p.fx)p.dir=p.tx>p.fx?1:-1;p.t=0;
  g.fx=g.tx;g.fy=g.ty;g.tx=p.fx;g.ty=p.fy;if(g.tx!==g.fx)g.dir=g.tx>g.fx?1:-1;}
 for(const e of F.en){
  if(e.t!=null){e.t+=dt/260;const k=Math.min(1,e.t);e.px=(e.fx+(e.tx-e.fx)*k)*16;e.py=(e.fy+(e.ty-e.fy)*k)*16;
   if(e.t>=1){e.t=null;if(e.tx===p.tx&&e.ty===p.ty)return encounter(e,false);}continue;}
  e.cd-=dt;if(e.cd>0||F.safe>0)continue;
  const dx=p.tx-e.tx,dy=p.ty-e.ty,dist=Math.abs(dx)+Math.abs(dy);e.chase=dist<=4;e.cd=e.chase?420:700+Math.random()*1000;
  let opt;if(e.chase){opt=[];if(dx)opt.push([Math.sign(dx),0]);if(dy)opt.push([0,Math.sign(dy)]);if(Math.abs(dy)>Math.abs(dx))opt.reverse();}
  else{if(Math.random()<.45)continue;opt=[[[1,0],[-1,0],[0,1],[0,-1]][Math.random()*4|0]];}
  for(const[ox,oy]of opt){const nx=e.tx+ox,ny=e.ty+oy;if(!walk(nx,ny)||'SiwxnJLD'.includes(MAP1[ny][nx])||F.en.some(o=>o!==e&&o.tx===nx&&o.ty===ny))continue;
   e.fx=e.tx;e.fy=e.ty;e.tx=nx;e.ty=ny;if(ox)e.dir=ox;e.t=0;break;}}
 if(p.t==null&&F.safe<=0){const c=F.en.find(e=>e.t==null&&e.tx===p.tx&&e.ty===p.ty);if(c)encounter(c,false);}}

function arrive(){const p=F.p,t=MAP1[p.ty][p.tx],k=p.tx+','+p.ty;
 if(t==='M'&&!G.flags.mireMet){p.path=[];mireEvent();}
 if(t==='N'&&!G.flags.noahMet){p.path=[];noahEvent();}
 if(AREA==='tower'&&tileAt(p.tx,p.ty)==='^'){p.path=[];F.lock=true;banner(G.tower.cur>=29?'最上階へ…':'上の階へ…','#c8ccff');SFX.aw();setTimeout(()=>enterTower(G.tower.cur+1,true),700);return;}
 if(AREA==='kairou'&&tileAt(p.tx,p.ty)==='^'){p.path=[];F.lock=true;banner('さらに深い層へ…','#c8b0ff');SFX.aw();setTimeout(()=>enterKairou(G.kairou.cur+1,true),700);return;}
 if(t==='Y'&&tileAt(p.tx,p.ty)==='e'){p.path=[];echoEvent(p.tx,p.ty);}
 if(t==='D'&&!G.flags.valkMet){p.path=[];valkEvent();}
 if(t==='m')lavaBurn();
 if(t==='U'&&!G.flags.hakuaMet){p.path=[];hakuaEvent();}
 if(t==='J'&&F.night&&!G.flags.jinMet){p.path=[];jinEvent();}
 if(t==='L'&&!p.path.length){F.water=F.water==='high'?'low':'high';F.en=F.en.filter(e=>walk(e.tx,e.ty));F.flash=6;SFX.brk();banner(F.water==='low'?'水位が下がった！ 水路が歩ける':'水位が上がった！ 橋が浮かんだ','#6fb2ff');}
 if(t==='i'){const dx=p.tx-p.fx,dy=p.ty-p.fy,nx=p.tx+dx,ny=p.ty+dy;p.path=(dx||dy)&&walk(nx,ny)?[[nx,ny]]:[];}
 if(t==='E'&&!G.flags.ernaMet){p.path=[];ernaEvent();}
 if(t==='V'&&!G.flags.balzaMet){p.path=[];balzaEvent();}
 if(t==='C'&&!G.flags.chest[ck(p.tx,p.ty)]){G.flags.chest[ck(p.tx,p.ty)]=1;p.path=[];F.lock=true;F.chest={x:p.tx,y:p.ty,t:0,k};SFX.sel();}
 else if(t==='G'&&!F.gathered[k]){F.gathered[k]=1;const n=1+(Math.random()<.4?1:0);G.mats.haiseki+=n;let s=`灰石×${n}`;if(Math.random()<.25){G.mats.kakera++;s+='・虚の欠片×1';}banner('採取：'+s,'#cfe8ff');SFX.heal();save();}
 else if(t==='S'&&F.left&&!p.path.length)askReturn();
 if(t!=='S')F.left=true;
 const adj=!F.bossDown&&BSX>=0&&Math.abs(p.tx-BSX)+Math.abs(p.ty-BSY)===1;
 if(adj&&(F.bossAsk||!F.adjB)&&!p.path.length){F.bossAsk=false;askBoss();}F.adjB=adj;}
function banner(h,c='#ffe27a'){const d=document.createElement('div');d.className='bnr';d.style.top=(38+$('#pops').querySelectorAll('.bnr').length*16)+'%';d.innerHTML=h;d.style.borderColor=c;$('#pops').appendChild(d);setTimeout(()=>d.remove(),2300);}
function openChest(k){const r=CREW[CHESTS.indexOf(k)]||{gold:50};let s='',c='#ffe27a';SFX.aw();
 if(r.gold){G.gold+=r.gold;s=`${r.gold}G`;}
 if(r.item){addItem(r.item,r.n);s=`${ITEMS[r.item].n}×${r.n}`;c='#7dffa8';}
 if(r.loot){const it=genItem(r.loot[0],r.loot[1]);s=addLoot(it);c=RAR[it.rar].c;}
 if(r.royal){const it=royalItem(r.royal,34);s=addLoot(it);c='#ffa040';}
 F.chest.c=c;banner('宝箱を開けた！<br><b>'+s+'</b>',c);log(`宝箱を開けた！　<b>${s}</b>`+goldTxt());save();}
function encounter(e,first){F.p.path=[];const minLv=Math.min(...G.party.map(i=>G.h[i].lv));const list=e.kinds.map(k=>({kind:k,lv:e.lv}));
 if(minLv>=e.lv+5){F.en.splice(F.en.indexOf(e),1);const r=rewards(list);banner('一閃！');log(`<b>一閃！</b> 弱い魔物を退けた　経験値+${r.xp}　${r.gold}G${r.loot.length?'　'+r.loot.join('、'):''}`+goldTxt());SFX.hit();save();renderPartyStatic();return;}
 F.lock=true;F.cur=e;F.flash=14;SFX.warn();
 setTimeout(()=>startBattle(list,{first,onEnd:afterBattle}),450);}
function afterBattle(mode){const e=F.cur;if(e&&mode!=='flee')F.en.splice(F.en.indexOf(e),1);F.cur=null;
 if(F.en.length<5&&Math.random()<.7)spawnOne();
 show('field');$('#ov').classList.add('hide');F.lock=false;hud(`${A.name}　<b>${A.rec.replace('推奨','')}</b>`);F.safe=mode==='flee'?3000:1500;
 if(B.opts.boss&&mode!=='flee')F.bossDown=true;log(mode==='flee'?'戦闘から離脱した。':B.opts.boss?`<b>${ED[A.boss.kind].name}を倒した！</b> 次の出撃でまた挑める`+(AREA==='haido'?'（翠の森が解放された）':''):'戦いに勝利した。'+goldTxt());fieldMenu();renderPartyStatic();fitField();
 if(mode===true&&B.opts.event==='erna'){G.flags.ernaMet=1;newMember('erna');save();fieldMenu('<b>エルナが仲間になった！</b> 「……悪くない腕ね。いいわ、付き合ってあげる」');renderPartyStatic();}
 if(mode===true&&B.opts.event==='balza'){G.flags.balzaMet=1;newMember('balza');save();fieldMenu('<b>バルザが仲間になった！</b> 「助かったわい。礼に、わしの槌を貸してやろう」');renderPartyStatic();}
 if(mode===true&&B.opts.event==='valk'){G.flags.valkMet=1;newMember('valk');SFX.aw();save();fieldMenu('<b>ヴァルクが仲間になった！</b> 「……いい灯だ。喰らうのはやめた。隣で燃えるほうが面白い」'+(G.party.includes('valk')?'':'（控えに入った）'));renderPartyStatic();}
 if(mode===true&&B.opts.boss&&AREA==='kairou')kairouBossWin();
 if(mode===true&&B.opts.boss&&AREA==='raimei'&&!G.flags.crowChoice)crowChoice();
 if(mode===true&&B.opts.boss&&AREA==='zankyo'&&!G.flags.endSeen)ending();}
function askBoss(){F.pause=true;if(AREA==='zankyo'&&echoN()<3){log(`星核の扉は固く閉ざされている。<br>――<b>3つの残響</b>を辿れば、扉は応えるはずだ。（${echoN()}/3）`);menu([{l:'戻る',f:fieldMenu}]);return;}const bk=A.bossKind?A.bossKind():A.boss.kind,bn=ED[bk].name,done=G.flags[A.bflag];banner(bn,'#b07cff');SFX.warn();
 log(`<b>${bn}</b>の気配がする…　${done?'再び挑みますか？（倒すたびに報酬を得られる）':'挑みますか？'}（推奨Lv${A.boss.lv-1}〜）<br><small>周りの魔物は動きを止めている</small>`);
 menu([{l:'挑む',cls:'ready',f:()=>{F.lock=true;F.pause=false;startBattle([{kind:bk,lv:A.boss.lv}],{boss:true,stages:A.stages,onEnd:afterBattle});}},{l:'やめる',f:fieldMenu}]);}
function mireEvent(){F.pause=true;banner('ミレイユ','#c08cff');
 log('<b>ミレイユ</b>「……侵入者？ いいえ、虚蝕の匂いがしない。あなたたちも星片の記録を探しているのね」<br>「この先の守護像は、私ひとりじゃ抜けられない。……手を組まない？」');
 menu([{l:'仲間にする',cls:'ready',f:()=>{G.flags.mireMet=1;newMember('mire');SFX.aw();save();fieldMenu('<b>ミレイユが仲間になった！</b>'+(G.party.includes('mire')?'':'（控えに入った）'));renderPartyStatic();}},
  {l:'今はやめる',f:()=>{G.flags.mireMet=1;G.declined=[...(G.declined||[]),'mire'];save();fieldMenu('ミレイユ「そう。気が変わったら星降り亭に来て」');}}]);}
function askReturn(){F.pause=true;log('帰還の灯を灯して、灯都へ戻りますか？');
 menu([{l:'灯都へ戻る',cls:'ready',f:()=>enterTown('灯都へ帰還した。仲間のHPが全回復した。')},{l:'探索を続ける',f:fieldMenu}]);}
function fieldMenu(m){F.pause=false;if(m)log(m);
 menu([{l:'メニュー',s:'時間が止まる',cls:'ready',f:pauseMenu},{l:'ミニマップ',s:G.set.mm?'表示中':'非表示',cls:G.set.mm?'ready':'',f:()=>{G.set.mm=!G.set.mm;save();fieldMenu();}},{l:'帰還の灯',s:'灯都へ戻る',f:askReturn}]);}
function pauseMenu(m){F.pause=true;F.p.path=[];log(m||'<b>PAUSE</b>　時間が止まっている'+goldTxt());
 menu([{l:'ステータス',f:()=>openSheet(G.party[0])},{l:'回復',s:`ポーション×${G.items.potion}`,dis:!G.items.potion,f:fieldHeal},{l:'持ち物',f:()=>pauseMenu(bagTxt())},{l:'閉じる',cls:'back',f:()=>fieldMenu('探索を再開')}]);}
function statusView(id){const h=G.h[id],o=nextM(id);
 log(statLine(id)+`<br><small>次のLvまで${nextXP(h.lv)-h.xp}　星ポイント残り${ptsLeft(id)}　ジョブ：${h.job?JOBS[h.job].n+' Lv'+h.jobs[h.job].lv:'なし'}</small><br>技：${skillList(id).map(k=>SK[k].n).join('・')}<br>装備：`+
  SLOTS6.map(s=>{const it=h.eq[s]&&findItem(h.eq[s]);return it?ihtml(it):'';}).filter(Boolean).join('、'));
 menu([{l:`${HB[o].name}を見る`,f:()=>statusView(o)},{l:'戻る',cls:'back',f:()=>pauseMenu()}]);}
function fieldHeal(){const id=G.party.map(i=>({i,r:(G.h[i].hp??stats(i).mhp)/stats(i).mhp})).sort((a,b)=>a.r-b.r)[0].i;
 const m=stats(id).mhp;G.h[id].hp=Math.min(m,(G.h[id].hp??m)+120);G.items.potion--;SFX.heal();pauseMenu(`${HB[id].name}のHPを回復した`);renderPartyStatic();save();}
const bagTxt=()=>'<b>持ち物</b>'+goldTxt()+'<br>'+Object.keys(ITEMS).map(k=>`${ii(ICON[k])}${ITEMS[k].n}×${G.items[k]||0}`).join('　')+'<br>'+Object.keys(MATS).map(k=>`${ii(ICON[k])}${MATS[k].n}×${G.mats[k]||0}`).join('　');
function renderPartyStatic(){const p=$('#party');p.className='row';p.innerHTML=G.party.map(id=>{const s=stats(id),h=G.h[id],hp=h.hp??s.mhp;
 return`<div class="pcs" data-id="${id}"><img class="fc" src="${face(id)}"><div class="nm">${HB[id].name} <span class="lv">Lv${h.lv}</span></div><div class="hb"><i style="width:${hp/s.mhp*100}%"></i></div><div class="ht">${hp}/${s.mhp}</div></div>`;}).join('');
 p.querySelectorAll('.pcs').forEach(d=>d.onclick=()=>{SFX.sel();openSheet(d.dataset.id);});}

function drawField(){const p=F.p,dt=Math.min(50,performance.now()-lastT);lastT=performance.now();updField(dt);
 F.camX=Math.max(0,Math.min(MW*16-W,Math.round(p.px+8-W/2)));F.camY=Math.max(0,Math.min(MH*16-H,Math.round(p.py+8-H/2)));
 const cx=F.camX,cy=F.camY,x0=cx>>4,y0=cy>>4;
 for(let y=y0;y<=y0+(H>>4)+1;y++)for(let x=x0;x<=x0+(W>>4)+1;x++)ctx.drawImage(tileImg(tileAt(x,y),x,y),x*16-cx,y*16-cy);
 if(F.bolt&&(tick>>2)%2){ctx.fillStyle='rgba(255,240,80,.45)';ctx.fillRect(F.bolt.x*16-cx,F.bolt.y*16-cy,16,16);}
 if(F.strike&&F.strike.t-->0){ctx.strokeStyle='#fff8b0';ctx.lineWidth=2;ctx.beginPath();let lx=F.strike.x*16-cx+8,ly=0;ctx.moveTo(lx,ly);while(ly<F.strike.y*16-cy+8){lx+=(Math.random()*8-4);ly+=10;ctx.lineTo(lx,ly);}ctx.stroke();ctx.lineWidth=1;}
 if(F.tap&&F.tap.t-->0&&(F.tap.t>>2)%2){ctx.strokeStyle='#ffe27a';ctx.strokeRect(F.tap.x*16-cx+.5,F.tap.y*16-cy+.5,15,15);}
 if(F.chest){const c=F.chest,x=c.x*16-cx,y=c.y*16-cy;c.t++;
  if(c.t<26)ctx.drawImage(TL.C,x+((c.t>>1)%2?1:-1),y);
  else{if(c.t===26)openChest(c.k);const a=Math.max(0,1-(c.t-26)/60);ctx.fillStyle=`rgba(255,240,170,${.45*a})`;ctx.fillRect(x+5,y-30,6,38);ctx.fillRect(x+3,y-10,10,18);
   ctx.fillStyle=c.c||'#ffe27a';const iy=y-4-Math.min(18,(c.t-26)*.6);ctx.fillRect(x+6,iy,4,4);ctx.fillStyle='#fff';ctx.fillRect(x+7,iy+1,1,1);
   for(let i=0;i<3;i++){ctx.fillStyle='#fff3b0';ctx.fillRect(x+Math.random()*16|0,y-Math.random()*26|0,1,1);}}
  if(c.t>95){F.chest=null;F.lock=false;}}
 const sp=[...F.en.map(e=>({u:e,img:IMG[e.kinds[0]],flip:e.kinds[0]==='wolf'?e.dir<0:false,bob:1})),{u:F.g,img:IMG[G.party[1]||G.party[0]],flip:F.g.dir>0},{u:p,img:IMG[G.party[0]],flip:p.dir>0}];
 if(!F.bossDown&&BSX>=0)sp.push({u:{px:BSX*16-8,py:BSY*16-14,tx:BSX},img:IMG[A.bossKind?A.bossKind():A.boss.kind],bob:1,sc:2});
 if(AREA==='midori'&&F.night&&!G.flags.jinMet){MAP1.forEach((r,y)=>{const x=r.indexOf('J');if(x>=0)sp.push({u:{px:x*16,py:y*16,tx:x},img:IMG.jin,bob:1});});}
 if(UX>=0&&!G.flags.hakuaMet)sp.push({u:{px:UX*16,py:UY*16,tx:UX},img:IMG.hakua,bob:1});
 if(EX>=0&&!G.flags.ernaMet)sp.push({u:{px:EX*16,py:EY*16-6,tx:EX},img:IMG.erna,bob:1});
 if(VX>=0&&!G.flags.balzaMet)sp.push({u:{px:VX*16,py:VY*16,tx:VX},img:IMG.balza,bob:1});
 if(NX>=0&&!G.flags.noahMet)sp.push({u:{px:NX*16,py:NY*16,tx:NX},img:IMG.noah,bob:1});
 if(DX>=0&&!G.flags.valkMet)sp.push({u:{px:DX*16,py:DY*16-4,tx:DX},img:IMG.valk,bob:1});
 if(MX>=0&&!G.flags.mireMet)sp.push({u:{px:MX*16,py:MY*16,tx:MX},img:IMG.mire,bob:1});sp.sort((a,b)=>a.u.py-b.u.py);
 for(const s of sp){const x=Math.round(s.u.px-cx),y=Math.round(s.u.py-cy-3+(s.bob?Math.sin(tick/10+s.u.tx)*1:0));
  const z=16*(s.sc||1);ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(x+z*.2,y+z,z*.6,2);
  if(s.flip){ctx.save();ctx.translate(x+16,y);ctx.scale(-1,1);ctx.drawImage(s.img,0,0);ctx.restore();}else ctx.drawImage(s.img,x,y,z,z);
  if(s.sc){ctx.fillStyle='#b07cff';for(let i=0;i<2;i++)ctx.fillRect(x+4+Math.random()*24|0,y+Math.random()*30|0,1,1);}
  if(s.u.chase){ctx.fillStyle='#ff5a5a';ctx.fillRect(x+7,y-6,2,4);ctx.fillRect(x+7,y-1,2,1);}
  if(s.u.kinds&&s.u.kinds.length>1){ctx.fillStyle='#fff';ctx.font='6px monospace';ctx.fillText('×'+s.u.kinds.length,x+11,y+4);}}
 if(F.night){ctx.fillStyle='rgba(8,16,60,.48)';ctx.fillRect(0,0,W,H);for(let i=0;i<14;i++){ctx.fillStyle=`rgba(200,255,150,${.5+.5*Math.sin(tick/9+i)})`;ctx.fillRect((i*47+Math.sin(tick/50+i)*20+200)%W|0,(i*71+Math.cos(tick/60+i)*15+200)%H|0,1,1);}}
 if(A.theme==='ice'){ctx.fillStyle='rgba(255,255,255,.85)';for(let i=0;i<45;i++){ctx.fillRect((i*53+tick*(.25+i%3*.15))%W|0,(i*97+tick*(.5+(i%4)*.2))%H|0,i%5?1:2,i%5?1:2);}}
 if(A.theme==='void'){ctx.fillStyle='rgba(30,0,70,.3)';ctx.fillRect(0,0,W,H);for(let i=0;i<30;i++){ctx.fillStyle=['#ffffff','#c8b0ff','#ff80ff'][i%3];ctx.fillRect((i*61+Math.sin(tick/40+i)*8)%W|0,(H-((i*89+tick*(.2+i%4*.1))%H))|0,1,1);}}
 FXHOOK.forEach(f=>f());
 if(F.flash>0){ctx.fillStyle=`rgba(255,255,255,${F.flash/14})`;ctx.fillRect(0,0,W,H);F.flash--;}
 if(G.set.mm){const z=2,ox=W-MW*z-4,oy=4;ctx.fillStyle='rgba(5,7,16,.75)';ctx.fillRect(ox-2,oy-2,MW*z+4,MH*z+4);
  const MC={'.':'#3c4a34',',':'#7d7058','T':'#1c2a18','R':'#555','~':'#2b4a74','#':'#4a4a5a','C':'#ffd34a','c':'#7d7058','G':'#9fd8ff','g':'#3c4a34','S':'#ff9a40',f:'#5a4a3a',K:'#24182a',B:'#5a4a3a',z:'#6a6678',P:'#c8c4d8',r:'#3a3228',l:'#5a5048',Y:'#141210',E:'#c0c0d0',i:'#a8d8f0',h:'#6a2a24',o:'#5a6a78',w:'#2b4a74',x:'#8a6a3a',L:'#ffd34a',n:'#3a8a6a',t:'#2a2e58','^':'#c8ccff',Q:'#8a8ab0',e:'#c8b0ff',v:'#3a2a5a',q:'#120a20',m:'#d04a1a'};
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const t=tileAt(x,y);ctx.fillStyle=MC[t]||'#3c4a34';ctx.fillRect(ox+x*z,oy+y*z,z,z);}
  if(!F.bossDown&&BSX>=0){ctx.fillStyle='#c060ff';ctx.fillRect(ox+BSX*z-1,oy+BSY*z-1,4,4);}
  ctx.fillStyle='#ff4a5a';F.en.forEach(e=>ctx.fillRect(ox+e.tx*z,oy+e.ty*z,z,z));
  if((tick>>3)%2){ctx.fillStyle='#fff';ctx.fillRect(ox+F.p.tx*z-1,oy+F.p.ty*z-1,4,4);}}
 if(F.pause){ctx.fillStyle='rgba(0,0,10,.35)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff';ctx.font='bold 10px sans-serif';ctx.fillText('PAUSE',6,14);}}
cv.addEventListener('pointerdown',ev=>{const r=cv.getBoundingClientRect();if(scene==='board')return boardTap(ev.clientX-r.left,ev.clientY-r.top);if(scene!=='field'||F.lock||F.pause)return;au();
 const tx=Math.floor(((ev.clientX-r.left)/SC+F.camX)/16),ty=Math.floor(((ev.clientY-r.top)/SC+F.camY)/16);
 if(tx===F.p.tx&&ty===F.p.ty&&F.p.t==null){SFX.sel();openSheet(G.party[0]);return;}
 const p=F.p;
 if(!F.bossDown&&tx===BSX&&ty===BSY){let best=null;for(const[dx,dy]of[[0,1],[1,0],[-1,0],[0,-1]]){const q=bfs(p.tx,p.ty,BSX+dx,BSY+dy);if(q&&(!best||q.length<best.length))best=q;}
  if(best){p.path=best;F.bossAsk=true;F.tap={x:tx,y:ty,t:40};if(!best.length)askBoss();}return;}
 const path=bfs(p.tx,p.ty,tx,ty);if(path){p.path=path;F.tap={x:tx,y:ty,t:40};if(!path.length&&MAP1[ty][tx]==='S')askReturn();}});
