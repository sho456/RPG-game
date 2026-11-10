/* ===== ver0.18 探索：タイルの描き直し・フィールドのキャラ表示・敵配置・ミニマップ ===== */
'use strict';
/* ---------- マップの差し替えと宝箱の移し替え ---------- */
for(const k in MAPS18)if(AREAS[k])AREAS[k].map=MAPS18[k];
const chestsOf=m=>{const o=[];m.forEach((r,y)=>[...r].forEach((t,x)=>{if(t==='C')o.push([x,y]);}));return o;};
{const _mg=migrate;migrate=function(g){const r=_mg(g);try{if(G&&(G.mapv||0)<18){const fl=G.flags.chest=G.flags.chest||{};for(const k in OLDCH){const key=p=>k==='haido'?p[0]+','+p[1]:k+':'+p[0]+','+p[1],o=OLDCH[k],n=chestsOf(MAPS18[k]),st=o.map(p=>!!fl[key(p)]);o.forEach(p=>{delete fl[key(p)];});n.forEach((p,i)=>{if(st[i])fl[key(p)]=1;});}G.mapv=18;}}catch(e){}return r;};}
/* 自動生成の階（塔・回廊）：番人の周りを広間にする */
function carveBoss(map,fl){const g=map.map(r=>[...r]),H2=g.length,W2=g[0].length;let bx=-1,by=-1;g.forEach((r,y)=>r.forEach((t,x)=>{if(t==='B'){bx=x;by=y;}}));if(bx<0)return map;
 for(let y=Math.max(1,by-4);y<=Math.min(H2-2,by+1);y++)for(let x=Math.max(1,bx-3);x<=Math.min(W2-2,bx+3);x++)if(g[y][x]==='#'||g[y][x]==='q')g[y][x]=fl;return g.map(r=>r.join(''));}
{const _mt=makeTowerArea;makeTowerArea=function(f){const a=_mt(f);a.map=carveBoss(a.map,'t');return a;};}
{const _mk=makeKairouArea;makeKairouArea=function(f){const a=_mk(f);a.map=carveBoss(a.map,'v');return a;};}

/* ---------- タイル ---------- */
const T18={};
const tcan=(w,h,fn)=>{const b=new Buf(w,h);fn(b);return b.canvas();};
const GP={ash:['#6f7f5a','#566848','#45563a','#38462f'],forest:['#69b257','#4a9444','#377a38','#28602e'],ice:['#ffffff','#e4ecf6','#c4d2e4','#a8b8d0'],storm:['#8a8a5e','#6a6a48','#56563a','#44442e'],lava:['#5a4038','#46302a','#38241f','#2a1a16'],void:['#3a2c56','#2c2044','#221836','#18102a'],ruin:['#6f8a80','#56706a','#445c58','#344846'],chapel:['#6f7f5a','#566848','#45563a','#38462f'],tower:['#6f7f5a','#566848','#45563a','#38462f']};
const gp=()=>GP[(A&&A.theme)||'ash']||GP.ash;
function tGround(th,v){const k='g'+th+v;if(T18[k])return T18[k];const P=GP[th]||GP.ash,c=P.map(C),R=rng(v*31+th.length*7+3);
 return T18[k]=tcan(16,16,b=>{b.rect(0,0,16,16,c[1]);for(let i=0;i<9;i++){const x=R()*15|0,y=R()*16|0;b.px(x,y,c[2]);b.px(x+1,y,c[2]);if(R()<.4)b.px(x,y+1,c[2]);}
  for(let i=0;i<5;i++){const x=1+R()*13|0,y=2+R()*13|0;b.px(x,y,c[0]);b.px(x,y-1,c[0]);b.px(x+1,y-1,c[2]);}
  if(th==='ice'){for(let i=0;i<3;i++)b.px(R()*16|0,R()*16|0,C('#ffffff'));}
  else if(v===1&&th!=='lava'&&th!=='void'){const x=3+R()*9|0,y=4+R()*8|0;b.px(x,y,C(th==='forest'?'#fff3a0':'#d8d8c0'));b.px(x,y+1,c[3]);}
  else if(v===2){const x=2+R()*10|0,y=5+R()*8|0;b.px(x,y,c[3]);b.px(x+1,y-1,c[0]);b.px(x+2,y,c[3]);}});}
const RP={ash:['#b0a284','#94866a','#7a6c54','#5e5240'],forest:['#c8b080','#aa9264','#8a744c','#6a5838'],ice:['#d8d0c8','#b8b0ac','#989090','#787074'],storm:['#a09a88','#84806e','#6a6658','#525044'],chapel:['#b0a8a0','#948c86','#7a726e','#5e5856']};
function tRoad(th,v){const k='r'+th+v;if(T18[k])return T18[k];const c=(RP[th]||RP.ash).map(C),R=rng(v*17+th.length*3+9);
 return T18[k]=tcan(16,16,b=>{b.rect(0,0,16,16,c[1]);for(let i=0;i<12;i++)b.px(R()*16|0,R()*16|0,c[R()<.5?0:2]);for(let i=0;i<3;i++){const x=1+R()*12|0,y=1+R()*12|0;b.rect(x,y,3,2,c[0]);b.rect(x,y+2,3,1,c[3]);b.px(x+3,y+1,c[3]);}});}
/* 道のふち（草がかぶさる） */
function tFringe(th,side){const k='f'+th+side;if(T18[k])return T18[k];const c=(GP[th]||GP.ash).map(C),R=rng(side*13+5);
 return T18[k]=tcan(16,16,b=>{for(let i=0;i<16;i++){const d=1+(R()*3|0);for(let j=0;j<d;j++){const col=j===d-1?c[2]:c[1];if(side===0)b.px(i,j,col);else if(side===1)b.px(15-j,i,col);else if(side===2)b.px(i,15-j,col);else b.px(j,i,col);}}});}
/* 木（背が高い：下端が根元） */
const TREEP={ash:['#7d9460','#5d7449','#44583a','#2e3e2c'],forest:['#7cc860','#4fa44a','#33803c','#1f5a30'],ice:['#4a7a5e','#356048','#264a3a','#18342c']};
function tTree(th,v){const k='t'+th+v;if(T18[k])return T18[k];const P=TREEP[th]||TREEP.ash,R3=[C(P[0]),C(P[1]),C(P[2]),C(P[3])],tr=ramp('#6a4a30');
 return T18[k]=tcan(18,24,b=>{part(b,q=>{q.rect(7,17,4,6,tr[1]);q.rect(7,17,1,6,tr[0]);q.rect(10,17,1,6,tr[2]);q.px(6,22,tr[2]);q.px(11,22,tr[2]);});
  part(b,q=>{const t=new Buf(18,24);t.ell(9,9+v,8,7,R3[1]);t.ell(5,12,5,4.6,R3[1]);t.ell(13,12,5,4.6,R3[1]);t.ell(9,5+v,5.5,4.4,R3[1]);lit(t,R3,9,9,9,9,1);q.blit(t,0,0);
   for(const[x,y]of[[5,7],[11,5],[8,10],[13,9],[4,11]])q.px(x,y+v,R3[0]);for(const[x,y]of[[9,14],[6,15],[12,15],[14,12]])q.px(x,y,R3[2]);
   if(th==='ice'){const s=C('#ffffff'),s2=C('#c8d8ec');q.ell(9,3+v,4.5,2,s);q.ell(5,9,3.4,1.5,s);q.ell(13,9,3.4,1.5,s);q.px(9,5+v,s2);q.px(4,10,s2);}});});}
function tRock(th){const k='k'+th;if(T18[k])return T18[k];const R3=ramp(th==='ice'?'#a8b8cc':th==='lava'?'#5a4a48':'#8a8a94');
 return T18[k]=tcan(16,16,b=>{part(b,q=>{const t=new Buf(16,16);t.ell(8,10,6.5,5,R3[1]);t.ell(5,11,3.5,3.5,R3[1]);lit(t,R3,8,10,7,5);q.blit(t,0,0);q.px(6,8,R3[0]);q.px(10,12,R3[2]);q.line(8,9,10,11,R3[2],1);if(th==='ice'){q.ell(8,6.5,4,1.6,C('#ffffff'));}});});}
/* 水（2コマ） */
function tWater(f,lava){const k=(lava?'lv':'w')+f;if(T18[k])return T18[k];const c=(lava?['#ffe080','#ff8a30','#d04a14','#a02a0a']:['#b8e0ff','#5a94d0','#3a6aa8','#2b4a80']).map(C);
 return T18[k]=tcan(16,16,b=>{b.rect(0,0,16,16,c[2]);for(let y=1;y<16;y+=4)for(let x=0;x<16;x++){const p=(x+f*4+y*3)%16;if(p<5)b.px(x,y+(p===2?-1:0),c[1]);if(p===1&&y%8===1)b.px(x,y-1,c[0]);}
  for(let i=0;i<3;i++)b.px((i*7+f*5+2)%16,(i*5+f*3+4)%16,c[lava?0:3]);});}
function tShore(side,lava){const k='sh'+side+(lava?'l':'');if(T18[k])return T18[k];const c=(lava?['#ffe080','#3a2018']:['#e8f8ff','#1e3a66']).map(C);
 return T18[k]=tcan(16,16,b=>{for(let i=0;i<16;i++){const w=(i*5)%3===0?1:0;if(side===0){b.px(i,0,c[1]);b.px(i,1,c[1]);if(!w)b.px(i,2,c[0]);}else if(side===1){b.px(15,i,c[1]);if(!w)b.px(14,i,c[0]);}else if(side===2){b.px(i,15,c[1]);}else{b.px(0,i,c[1]);if(!w)b.px(1,i,c[0]);}}});}
/* 壁：上面と正面 */
const WALLP={ash:'#6a6a84',forest:'#7a6450',chapel:'#6e6a8c',ice:'#9a3a30',ruin:'#4a7078',tower:'#b8b4d4',void:'#3a2c5c',storm:'#4a4238',lava:'#4a3530',mine:'#4a4238'};
function tWall(key,face){const k='W'+key+(face?'f':'t');if(T18[k])return T18[k];const R3=ramp(WALLP[key]||WALLP.ash),rock=key==='mine'||key==='lava'||key==='storm',R=rng(key.length*11+(face?3:0));
 return T18[k]=tcan(16,16,b=>{if(face){b.rect(0,0,16,16,R3[2]);if(rock){for(let i=0;i<7;i++){const x=R()*13|0,y=R()*13|0;b.rect(x,y,3+(R()*3|0),2,R3[1]);b.px(x,y,R3[0]);}b.rect(0,14,16,2,R3[3]);}
   else{for(let y=0;y<16;y+=5){b.rect(0,y+4,16,1,R3[3]);for(let x=(y%10?4:0);x<16;x+=8)b.rect(x,y,1,4,R3[3]);for(let x=(y%10?5:1);x<16;x+=8)b.rect(x,y,6,1,R3[1]);}b.rect(0,15,16,1,R3[3]);}b.rect(0,0,16,2,R3[1]);b.rect(0,0,16,1,R3[0]);}
  else{b.rect(0,0,16,16,R3[3]);if(rock){for(let i=0;i<5;i++){const x=R()*12|0,y=R()*12|0;b.rect(x,y,4,3,R3[2]);b.px(x,y,R3[1]);}}else{for(let i=0;i<6;i++)b.px(R()*16|0,R()*16|0,R3[2]);b.rect(0,0,16,1,R3[2]);}}});}
/* 床 */
function tFloor(t,v=0){const k='F'+t+v;if(T18[k])return T18[k];const R=rng(t.charCodeAt(0)*7+v*3);
 const mk=(hex,fn)=>T18[k]=tcan(16,16,b=>{const c=ramp(hex);b.rect(0,0,16,16,c[1]);fn(b,c);});
 if(t==='f')return mk('#a8845a',(b,c)=>{for(let y=7;y<16;y+=8)b.rect(0,y,16,1,c[2]);for(let y=0;y<16;y+=8)b.rect((y*3+v*7+3)%16,y,1,7,c[2]);for(let i=0;i<5;i++){const x=R()*14|0,y=R()*16|0;b.px(x,y,c[0]);b.px(x+1,y,c[0]);}for(let i=0;i<3;i++)b.px(R()*16|0,R()*16|0,c[2]);});
 if(t==='z')return mk('#8a86a4',(b,c)=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++)if(((x>>3)+(y>>3))%2)b.px(x,y,c[2]);b.rect(0,7,16,1,c[3]);b.rect(0,15,16,1,c[3]);b.rect(7,0,1,16,c[3]);b.rect(15,0,1,16,c[3]);b.px(1,1,c[0]);b.px(9,9,c[0]);for(let i=0;i<3;i++)b.px(R()*16|0,R()*16|0,c[0]);});
 if(t==='r')return mk('#4a4034',(b,c)=>{for(let i=0;i<14;i++)b.px(R()*16|0,R()*16|0,c[R()<.5?0:2]);for(let i=0;i<2;i++){const x=1+R()*12|0,y=1+R()*12|0;b.rect(x,y,2,2,c[0]);b.px(x+2,y+1,c[3]);b.px(x,y+2,c[3]);}});
 if(t==='l')return mk('#4a4034',(b,c)=>{for(let i=0;i<10;i++)b.px(R()*16|0,R()*16|0,c[R()<.5?0:2]);const w=ramp('#7a5234'),m=ramp('#a0a4b0');for(let x=1;x<16;x+=4){b.rect(x,2,2,12,w[1]);b.rect(x,2,1,12,w[0]);}b.rect(0,4,16,2,m[1]);b.rect(0,4,16,1,m[0]);b.rect(0,10,16,2,m[1]);b.rect(0,10,16,1,m[0]);});
 if(t==='h')return mk('#8a3a30',(b,c)=>{for(let y=3;y<16;y+=4){b.rect(0,y,16,1,c[3]);b.rect(0,y-3,16,1,c[0]);}for(let y=0;y<16;y+=4)b.rect((y*5+3)%16,y,1,3,c[2]);});
 if(t==='o')return mk('#5e7482',(b,c)=>{b.rect(0,7,16,1,c[3]);b.rect(0,15,16,1,c[3]);b.rect(7,0,1,7,c[3]);b.rect(3,8,1,7,c[3]);b.rect(12,8,1,7,c[3]);b.rect(0,0,16,1,c[0]);b.rect(0,8,16,1,c[0]);const m=ramp('#3a7a56');for(let i=0;i<4;i++){const x=R()*15|0,y=R()*15|0;b.px(x,y,m[1]);b.px(x+1,y,m[2]);}});
 if(t==='t')return mk('#34386a',(b,c)=>{b.rect(0,15,16,1,c[3]);b.rect(15,0,1,16,c[3]);b.rect(0,0,16,1,c[0]);b.rect(0,0,1,16,c[0]);for(let i=0;i<5;i++)b.px(1+R()*13|0,1+R()*13|0,R()<.4?C('#ffffff'):c[0]);b.px(7,7,C('#8a90d8'));});
 if(t==='v')return mk('#2e2448',(b,c)=>{b.rect(0,15,16,1,c[3]);b.rect(15,0,1,16,c[3]);for(let i=0;i<7;i++)b.px(R()*16|0,R()*16|0,R()<.3?C('#c8b0ff'):c[0]);});
 if(t==='i')return mk('#a8d8f0',(b,c)=>{for(let k2=0;k2<16;k2++){b.px(k2,(k2*.6+2)|0,c[0]);b.px(k2,((k2*.6+9)|0)%16,C('#ffffff'));}b.rect(3,12,4,1,c[2]);b.rect(10,4,3,1,c[2]);b.px(13,13,C('#ffffff'));});
 if(t==='x')return T18[k]=tcan(16,16,b=>{const w=ramp('#9a7444');b.rect(0,0,16,16,C('#2b4a80'));for(let y=0;y<16;y+=4){b.rect(1,y,14,3,w[1]);b.rect(1,y,14,1,w[0]);b.rect(1,y+3,14,1,w[3]);b.px(2,y+1,w[2]);b.px(13,y+1,w[2]);}b.rect(0,0,1,16,w[2]);b.rect(15,0,1,16,w[2]);});
 if(t==='n')return mk('#1e3a2a',(b,c)=>{const g2=ramp('#3a9a72');for(let i=0;i<12;i++)b.px(R()*16|0,R()*16|0,g2[R()<.5?1:2]);for(let i=0;i<4;i++)b.px(R()*16|0,R()*16|0,C('#9fffe0'));});
 if(t==='e')return mk('#34386a',(b,c)=>{b.ell(8,8,5,5,C('#6a50b0'));b.ell(8,8,3,3,C('#b090ff'));b.px(7,7,C('#ffffff'));for(let i=0;i<8;i++)b.px(2+(i*5)%12,2+(i*7)%12,C(i%2?'#ffffff':'#ffe27a'));});
 if(t==='^')return mk('#34386a',(b,c)=>{const s=ramp('#c8ccff');for(let i=0;i<4;i++){b.rect(2+i,3+i*3,12-i*2,2,s[1]);b.rect(2+i,3+i*3,12-i*2,1,s[0]);b.rect(2+i,5+i*3,12-i*2,1,s[3]);}b.rect(7,0,2,2,C('#ffffff'));});
 if(t==='Q')return mk('#34386a',(b,c)=>{const s=ramp('#5a5e88');for(let i=0;i<4;i++){b.rect(2+i,3+i*3,12-i*2,2,s[1]);b.rect(2+i,5+i*3,12-i*2,1,s[3]);}b.rect(3,7,10,1,C('#b07cff'));b.rect(7,3,1,10,C('#b07cff'));b.px(7,7,C('#ffffff'));});
 return tGround('ash',0);}
/* 置物：宝箱・採取・灯・レバー・本棚・柱・塔 */
function tObj(t,v=0){const k='O'+t+v;if(T18[k])return T18[k];
 if(t==='C'||t==='c')return T18[k]=tcan(16,18,b=>{const w=ramp('#9a6230'),g=ramp('#e8c040');part(b,q=>{if(t==='C'){q.rect(2,8,12,8,w[1]);q.rect(2,8,12,3,w[0]);q.rect(2,11,12,1,g[1]);q.rect(2,8,1,8,g[1]);q.rect(13,8,1,8,g[2]);q.rect(7,10,2,3,g[0]);q.px(7,12,w[3]);q.rect(3,14,10,1,w[2]);q.rect(2,7,12,1,w[0]);}
   else{q.rect(2,11,12,5,w[2]);q.rect(3,12,10,3,C('#2a1a10'));q.rect(2,11,1,5,g[2]);q.rect(13,11,1,5,g[2]);q.rect(2,5,12,5,w[1]);q.rect(2,5,12,1,w[0]);q.rect(2,9,12,1,g[2]);q.rect(3,6,10,3,w[2]);}});});
 if(t==='G'||t==='g')return T18[k]=tcan(16,18,b=>{const s=ramp('#7a7a8c'),c=ramp('#9fe0ff');part(b,q=>{q.ell(8,14,5,2.4,s[1]);q.px(5,13,s[0]);q.px(11,15,s[2]);if(t==='G'){q.poly([[5,13],[7,4],[9,13]],c[1]);q.poly([[8,13],[11,7],[12,13]],c[2]);q.poly([[3,13],[4,9],[6,13]],c[2]);q.line(7,5,7,11,c[0],1);q.px(7,4,C('#ffffff'));q.px(11,8,c[0]);}});});
 if(t==='S')return T18[k]=tcan(16,28,b=>{const m=ramp('#4a4a66'),g=ramp('#ffd36a');part(b,q=>{q.rect(7,10,2,15,m[1]);q.rect(7,10,1,15,m[0]);q.rect(5,24,6,3,m[2]);q.rect(5,24,6,1,m[1]);q.rect(4,8,8,2,m[1]);q.rect(5,2,6,6,g[1]);q.rect(6,3,3,3,g[0]);q.px(6,3,C('#ffffff'));q.rect(4,1,8,1,m[1]);q.rect(6,0,4,1,m[2]);q.rect(5,2,1,6,m[2]);q.rect(10,2,1,6,m[2]);});});
 if(t==='L')return T18[k]=tcan(16,18,b=>{const m=ramp('#6a6a7a'),c=C(v?'#6fb2ff':'#ffd34a');part(b,q=>{q.rect(4,12,8,4,m[1]);q.rect(4,12,8,1,m[0]);q.line(8,12,v?12:4,5,m[0],2);q.ell(v?12.5:4.5,4.5,2.2,2.2,c);});});
 if(t==='K')return T18[k]=tcan(16,24,b=>{const w=ramp('#6a4628');part(b,q=>{q.rect(0,2,16,22,w[2]);q.rect(0,2,16,2,w[0]);q.rect(0,2,1,22,w[1]);q.rect(15,2,1,22,w[3]);const R=rng(v*7+3);for(let y=5;y<22;y+=6){q.rect(1,y+5,14,1,w[1]);for(let x=1;x<15;){const bw=1+(R()*2|0),bh=3+(R()*2|0),c=ramp(['#b03838','#3858b0','#38884a','#b09a38','#7a3a90','#8a6a50'][R()*6|0]);q.rect(x,y+5-bh,bw,bh,c[1]);q.px(x,y+5-bh,c[0]);x+=bw+(R()<.2?1:0);}}},1);});
 if(t==='P')return T18[k]=tcan(16,30,b=>{const s=ramp('#c0bcd8');part(b,q=>{q.rect(3,26,10,3,s[2]);q.rect(3,26,10,1,s[1]);q.rect(4,4,8,22,s[1]);q.rect(4,4,2,22,s[0]);q.rect(10,4,2,22,s[2]);q.rect(7,4,1,22,s[2]);q.rect(2,1,12,3,s[1]);q.rect(2,1,12,1,s[0]);});});
 if(t==='E')return T18[k]=tcan(18,34,b=>{const s=ramp('#8a8a9c');part(b,q=>{q.rect(3,6,12,27,s[1]);q.rect(3,6,3,27,s[0]);q.rect(12,6,3,27,s[2]);for(let y=10;y<32;y+=5){q.rect(3,y,12,1,s[2]);q.rect(y%10?7:10,y-4,1,4,s[2]);}q.rect(7,24,4,9,C('#1e1a2a'));q.rect(8,12,2,4,C('#1e1a2a'));q.rect(2,3,4,4,s[1]);q.rect(8,2,3,5,s[1]);q.rect(13,4,3,3,s[2]);q.rect(2,3,1,4,s[0]);});});
 if(t==='B')return T18[k]=tcan(16,16,b=>{const c=[C('#b07cff'),C('#6a4c9c'),C('#3b2a5c')];b.ell(8,8,7,7,c[2]);b.ell(8,8,5.6,5.6,0);b.ell(8,8,4,4,c[1]);b.ell(8,8,2.6,2.6,0);b.px(8,1,c[0]);b.px(8,14,c[0]);b.px(1,8,c[0]);b.px(14,8,c[0]);b.px(7,7,c[0]);b.px(8,8,c[0]);});
 return null;}

/* ---------- タイルの見た目を決める ---------- */
const WALLCH='#Yq',TALL='TKPES';
const isWallT=t=>t==='#'||t==='q'||(t==='Y'&&AREA!=='zankyo');
const rawAt=(x,y)=>(x<0||y<0||x>=MW||y>=MH)?(MAP1[0][0]==='Y'?'Y':MAP1[0][0]==='#'?'#':'T'):MAP1[y][x];
function wallKey(t){if(t==='q')return'void';if(t==='Y')return AREA==='ryuu'?'lava':'mine';const th=A&&A.theme;return th==='forest'?'forest':th==='chapel'?'chapel':th==='ice'?'ice':th==='ruin'?'ruin':th==='tower'||th==='void'?(AREA==='kairou'?'void':'tower'):'ash';}
const outTheme=()=>{const th=A&&A.theme;return th==='forest'?'forest':th==='ice'?'ice':th==='storm'?'storm':th==='lava'?'lava':'ash';};
/* 地面（置物の下も含む） */
function groundImg(t,x,y){const th=outTheme(),v=(x*7+y*13)%3;
 if(t==='R'&&[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>rawAt(x+dx,y+dy)==='i').length>=2)return tFloor('i');
 if(t==='.'||t==='T'||t==='R'||t==='G'||t==='g'||t==='E'||t==='J')return tGround(th,v);
 if(t===','||t==='S'||t==='C'||t==='c'||t==='B')return AREA==='haido'||'.,TRG'.includes(rawAt(x,y+1))||'.,TRG'.includes(rawAt(x,y-1))||t===','?tRoad(th,(x+y)%2):tFloor(floorNear(x,y));
 if(t==='~')return tWater((tick>>5)%2);if(t==='w')return tWater((tick>>5)%2);if(t==='m')return tWater((tick>>4)%2,1);
 if(t==='K'||t==='M')return tFloor('f',(x+y)%2);if(t==='P'||t==='N')return tFloor('z');if(t==='L')return tFloor('o');if(t==='U')return tFloor('h');if(t==='V'||t==='D')return tFloor('r');
 if(isWallT(t))return tWall(wallKey(t),!isWallT(rawAt(x,y+1))&&y+1<MH);
 if(t==='Y')return tFloor('e');
 return tFloor(t,(x+y)%2);}
function floorNear(x,y){for(const[dx,dy]of[[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,1]]){const t=rawAt(x+dx,y+dy);if('fzrhotv'.includes(t))return t;}return A&&A.theme==='tower'?'t':A&&A.theme==='void'?'v':'r';}

/* ---------- 敵の配置 ----------
 通路には少数、広場には群れ、宝箱のそばには番をする敵、奥には強敵。出発点から歩いて届く場所にだけ置く */
function reach18(sx,sy,stop){const d=new Map([[sx+','+sy,0]]),q=[[sx,sy]];while(q.length){const[x,y]=q.shift(),v=d.get(x+','+y);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(d.has(k)||!walk(nx,ny))continue;d.set(k,v+1);q.push([nx,ny]);}}return d;}
const NOSPAWN='CGSBMNEVUiwxLnJ^QDYm';
function openness(x,y){let n=0;for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++)if(walk(x+i,y+j))n++;return n;}
function groupsAt(x,y){return'fzrlho'.includes(MAP1[y][x])&&A.libGroups?A.libGroups:GROUPS;}
function mkSym(x,y,kinds,lv,o){return Object.assign({tx:x,ty:y,fx:x,fy:y,px:x*16,py:y*16,t:null,kinds,lv,dir:Math.random()<.5?1:-1,chase:false,cd:400+Math.random()*900},o||{});}
function bossZone(D){if(BSX<0)return null;let cur=null,best=1e9;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const v=D.get((BSX+dx)+','+(BSY+dy));if(v!=null&&v<best){best=v;cur=[BSX+dx,BSY+dy];}}return cur?reach18(cur[0],cur[1]):null;}
function populate18(){const p=F.p,D=reach18(p.tx,p.ty),Db=bossZone(D),[l0,l1]=A.lv;let far=1;D.forEach(v=>{far=Math.max(far,v);});
 const bd=BSX>=0?Math.max(...[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>D.get((BSX+dx)+','+(BSY+dy))||0))||far:far;
 const lvAt=d=>Math.max(l0,Math.min(l1,l0+Math.floor(Math.min(.999,d/Math.max(1,bd))*(l1-l0+1))));
 const cand=[];D.forEach((d,k)=>{const[x,y]=k.split(',').map(Number);if(d<6||NOSPAWN.includes(MAP1[y][x]))return;if(Db&&(Db.get(k)??99)<=7)return;cand.push({x,y,d,o:openness(x,y)});});
 const en=[],taken=(x,y,r)=>en.some(e=>Math.abs(e.tx-x)+Math.abs(e.ty-y)<r),bySize=(gs,n)=>{const s=[...gs].sort((a,b)=>a.length-b.length);return n<0?s[Math.min(s.length-1,Math.random()*Math.ceil(s.length/2)|0)]:n>0?s[s.length-1-(Math.random()*Math.ceil(s.length/2)|0)]:gs[Math.random()*gs.length|0];};
 /* 宝箱の番 */
 CHESTS.forEach(ck2=>{const[cx,cy]=ck2.split(',').map(Number);if(G.flags.chest[ck(cx,cy)])return;const near=cand.filter(c=>{const m=Math.abs(c.x-cx)+Math.abs(c.y-cy);return m>=1&&m<=3;}).sort((a,b)=>b.o-a.o)[0];
  if(near&&!taken(near.x,near.y,2)&&Math.random()<.85)en.push(mkSym(near.x,near.y,bySize(groupsAt(near.x,near.y),1),Math.min(l1,lvAt(near.d)+1),{guard:1,hx:near.x,hy:near.y}));});
 /* 強敵：ボスへの道の奥、広い場所に1体（広いマップは2体） */
 /* 本道（出発点→ボス）を求め、そこから離れた脇道の広い場所を選ぶ */
 const road=[];if(BSX>=0){let cur=null,best=1e9;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const v=D.get((BSX+dx)+','+(BSY+dy));if(v!=null&&v<best){best=v;cur=[BSX+dx,BSY+dy];}}
  while(cur){road.push(cur);const v=D.get(cur[0]+','+cur[1]);if(!v)break;let nx=null;for(const[dx,dy]of[[0,1],[1,0],[-1,0],[0,-1]]){if(D.get((cur[0]+dx)+','+(cur[1]+dy))===v-1){nx=[cur[0]+dx,cur[1]+dy];break;}}cur=nx;}}
 const offRoad=c=>road.length?Math.min(...road.map(r=>Math.abs(r[0]-c.x)+Math.abs(r[1]-c.y))):9;
 const deep=cand.filter(c=>c.d>bd*.4&&c.o>=11&&offRoad(c)>=4&&MAP1[c.y][c.x]!==',').sort((a,b)=>(b.o+offRoad(b))-(a.o+offRoad(a))),nE=cand.length>340?2:1;
 for(let i=0,n=0;i<deep.length&&n<nE;i++){const c=deep[i];if(taken(c.x,c.y,7))continue;const gs=groupsAt(c.x,c.y),big=[...gs].sort((a,b)=>b.length-a.length)[0];en.push(mkSym(c.x,c.y,big.length<3?[...big,big[0]]:big,l1,{elite:1,guard:1,hx:c.x,hy:c.y}));n++;}
 /* 通路と広場 */
 const want=Math.max(5,Math.min(12,Math.round(cand.length/34)));for(let tries=0;tries<500&&en.length<want+ (en.length?0:0);tries++){const c=cand[Math.random()*cand.length|0];if(!c||taken(c.x,c.y,c.o>=17?4:5))continue;
  const zone=c.o>=17?1:c.o<=10?-1:0;en.push(mkSym(c.x,c.y,bySize(groupsAt(c.x,c.y),zone),lvAt(c.d),{zone}));if(en.filter(e=>!e.guard).length>=want)break;}
 F.en=en;if(F.voided)F.en.forEach(voidify);}
spawnOne=function(){if(!F||!A)return;const p=F.p,D=reach18(p.tx,p.ty),Db=bossZone(D),[l0,l1]=A.lv,c=[];D.forEach((d,k)=>{const[x,y]=k.split(',').map(Number);if(d<8||NOSPAWN.includes(MAP1[y][x]))return;if(Db&&(Db.get(k)??99)<=7)return;if(F.en.some(e=>Math.abs(e.tx-x)+Math.abs(e.ty-y)<4))return;c.push([x,y,d]);});
 if(!c.length)return;let far=1;D.forEach(v=>{far=Math.max(far,v);});const[x,y,d]=c[Math.random()*c.length|0],gs=groupsAt(x,y),e=mkSym(x,y,gs[Math.random()*gs.length|0],Math.max(l0,Math.min(l1,l0+Math.floor(d/far*(l1-l0+1)))));F.en.push(e);if(F.voided)voidify(e);};
{const _ef=enterField;enterField=function(id,keep){_ef(id,keep);if(!F)return;F.seen={};F.hist=[];F.face=[0,-1];F.steps={};populate18();seeAround();};}

/* ---------- ミニマップ ---------- */
function seeAround(){const p=F.p,r=5;for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){if(i*i+j*j>r*r+2)continue;const x=p.tx+i,y=p.ty+j;if(x>=0&&y>=0&&x<MW&&y<MH)F.seen[x+','+y]=1;}F.steps[p.tx+','+p.ty]=1;}
const MMC={'.':'#4a5c42',',':'#9a8a6a',T:'#1f2c1c',R:'#33333c','~':'#2b4a80','#':'#262638',C:'#9a8a6a',c:'#9a8a6a',G:'#4a5c42',g:'#4a5c42',S:'#9a8a6a',f:'#7a6048',K:'#3a2616',B:'#6a5a70',z:'#77738e',P:'#3a3850',r:'#5a5044',l:'#6a6054',Y:'#1a1612',E:'#4a5c42',i:'#a8d8f0',h:'#8a4038',o:'#5e7482',w:'#2b4a80',x:'#9a7444',L:'#5e7482',n:'#3a9a72',t:'#3c4078','^':'#3c4078',Q:'#3c4078',e:'#6a50b0',v:'#3a2e5a',q:'#140c22',m:'#d04a1a',J:'#4a5c42'};
function drawMini(big){const z=big?4:2,mw=MW*z,mh=MH*z,ox=big?Math.round((W-mw)/2):W-mw-5,oy=big?Math.max(14,Math.round((H-mh)/2)):5,p=F.p;
 ctx.fillStyle='rgba(6,8,20,.82)';ctx.fillRect(ox-3,oy-3,mw+6,mh+6);ctx.fillStyle='#c8a850';ctx.fillRect(ox-3,oy-3,mw+6,1);ctx.fillRect(ox-3,oy+mh+2,mw+6,1);ctx.fillRect(ox-3,oy-3,1,mh+6);ctx.fillRect(ox+mw+2,oy-3,1,mh+6);ctx.fillStyle='#5a4a20';ctx.fillRect(ox-2,oy-2,mw+4,1);ctx.fillRect(ox-2,oy-2,1,mh+4);
 for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const k=x+','+y;if(!F.seen[k]){if((x+y)%2===0){ctx.fillStyle='#161a30';ctx.fillRect(ox+x*z,oy+y*z,z,z);}continue;}const t=tileAt(x,y);ctx.fillStyle=MMC[t]||'#4a5c42';ctx.fillRect(ox+x*z,oy+y*z,z,z);
  if(F.steps[k]&&walk(x,y)){ctx.fillStyle='rgba(255,240,190,.28)';ctx.fillRect(ox+x*z,oy+y*z,z,z);}}
 const dot=(x,y,c,s)=>{ctx.fillStyle='#0a0c18';ctx.fillRect(ox+x*z-s,oy+y*z-s,z+2*s,z+2*s);ctx.fillStyle=c;ctx.fillRect(ox+x*z-s+1,oy+y*z-s+1,z+2*s-2,z+2*s-2);};
 for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const t=MAP1[y][x],k=x+','+y;if(t==='S')dot(x,y,'#ff9a40',1);if(!F.seen[k])continue;const ta=tileAt(x,y);if(ta==='C')dot(x,y,'#ffe14a',1);else if(ta==='G')dot(x,y,'#7fd6ff',1);else if(ta==='^')dot(x,y,'#ffffff',1);else if(ta==='L')dot(x,y,'#ffd34a',1);else if(ta==='e')dot(x,y,'#c8b0ff',1);}
 F.en.forEach(e=>{if(F.seen[e.tx+','+e.ty]){ctx.fillStyle=e.elite?'#ff9a30':'#ff4a5a';ctx.fillRect(ox+e.tx*z-(e.elite?1:0),oy+e.ty*z-(e.elite?1:0),z+(e.elite?2:0),z+(e.elite?2:0));}});
 if(!F.bossDown&&BSX>=0){const b=(tick>>4)%2;dot(BSX,BSY,b?'#e080ff':'#a040e0',2);}
 /* 現在地と向き */
 const px0=ox+p.tx*z,py0=oy+p.ty*z,[fx2,fy2]=F.face||[0,-1];ctx.fillStyle='#0a0c18';ctx.fillRect(px0-2,py0-2,z+4,z+4);ctx.fillRect(px0+fx2*(z+1)-1,py0+fy2*(z+1)-1,z+2,z+2);ctx.fillStyle=(tick>>3)%2?'#ffffff':'#ffe27a';ctx.fillRect(px0-1,py0-1,z+2,z+2);ctx.fillStyle='#ff6a30';ctx.fillRect(px0+fx2*(z+1),py0+fy2*(z+1),z,z);
 if(big){ctx.font='8px sans-serif';ctx.textBaseline='top';let lx=ox-2,ly=oy+mh+6;for(const[c,l]of[['#ffffff','現在地'],['#ff4a5a','魔物'],['#ff9a30','強敵'],['#e080ff','ボス'],['#ffe14a','宝箱'],['#7fd6ff','採取'],['#ff9a40','帰還の灯']]){const tw=ctx.measureText(l).width+12;if(lx+tw>W-2){lx=ox-2;ly+=11;}ctx.fillStyle='rgba(6,8,20,.82)';ctx.fillRect(lx-1,ly-1,tw,10);ctx.fillStyle=c;ctx.fillRect(lx+1,ly+2,4,4);ctx.fillStyle='#e8e4f4';ctx.fillText(l,lx+8,ly);lx+=tw+2;}}}
{const _fm=fieldMenu;fieldMenu=function(m){_fm(m);const b=$('#cmd').children[1];if(!b)return;const st=!G.set.mm?0:G.set.mmBig?2:1;b.innerHTML=`マップ<small>${['非表示','小さく表示','大きく表示'][st]}</small>`;b.className='c'+(st?' ready':'');
  b.onclick=()=>{SFX.sel();if(st===0){G.set.mm=true;G.set.mmBig=false;}else if(st===1){G.set.mmBig=true;}else{G.set.mm=false;G.set.mmBig=false;}save();fieldMenu();};};}

/* ---------- 探索画面の描画 ---------- */
const FOPT='{"noW":1}';
function fieldSprite(key,moving,ph){const d=SPDEF[key];if(!d)return null;const mv=moving&&d.human;return frameOf(key,mv?'walk':'idle',mv?(tick>>3)+ph:((tick>>4)+ph),d.human?FOPT:'');}
drawField=function(){const p=F.p,dt=Math.min(50,performance.now()-lastT);lastT=performance.now();const ptx=p.tx,pty=p.ty,wt0=F.water;updField(dt);if(scene!=='field'||!F)return;
 if(F.water!==wt0){for(let i=0;i<3;i++)if(F.en.length<7)spawnOne();}
 if(p.tx!==ptx||p.ty!==pty){F.face=[Math.sign(p.tx-ptx),Math.sign(p.ty-pty)];F.hist.push([ptx,pty]);if(F.hist.length>8)F.hist.shift();seeAround();}
 F.en.forEach(e=>{if(e.guard){const near=Math.abs(e.tx-p.tx)+Math.abs(e.ty-p.ty)<=3;if(!near)e.cd=1e9;else if(e.cd>1e6)e.cd=260;}});
 F.camX=Math.max(0,Math.min(MW*16-W,Math.round(p.px+8-W/2)));F.camY=Math.max(0,Math.min(MH*16-H,Math.round(p.py+8-H/2)));
 const cx=F.camX,cy=F.camY,x0=cx>>4,y0=cy>>4,x1=x0+(W>>4)+1,y1=y0+(H>>4)+2,th=outTheme(),objs=[];
 /* 1) 地面 */
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const t=tileAt(x,y),raw=rawAt(x,y),sx=x*16-cx,sy=y*16-cy;ctx.drawImage(groundImg(x<0||y<0||x>=MW||y>=MH?raw:t==='c'||t==='g'?raw:t,x,y),sx,sy);
  const road=t===','||(t==='S'&&'.,T'.includes(rawAt(x,y+1)));
  if(road){[[0,-1,0],[1,0,1],[0,1,2],[-1,0,3]].forEach(([dx,dy,s])=>{if('.TRGgEJ'.includes(tileAt(x+dx,y+dy))&&x+dx>=0&&x+dx<MW)ctx.drawImage(tFringe(th,s),sx,sy);});}
  if(t==='~'||t==='w'||t==='m'){const lv=t==='m';[[0,-1,0],[1,0,1],[0,1,2],[-1,0,3]].forEach(([dx,dy,s])=>{const n=tileAt(x+dx,y+dy);if(n!=='~'&&n!=='w'&&n!=='m'&&n!=='x')ctx.drawImage(tShore(s,lv),sx,sy);});}
  /* 壁の影 */
  if(walk(x,y)||t==='B'){const up=rawAt(x,y-1);if(isWallT(up)||up==='K'){ctx.fillStyle='rgba(8,6,20,.34)';ctx.fillRect(sx,sy,16,4);ctx.fillStyle='rgba(8,6,20,.16)';ctx.fillRect(sx,sy+4,16,2);}}
  if(t==='B'&&!F.bossDown)ctx.drawImage(tObj('B'),sx,sy);
  /* 2) 背の高い物・置物を集める */
  if(x>=0&&y>=0&&x<MW&&y<MH){
   if(t==='T')objs.push({y:y*16+15,b:y*16+15,img:tTree(TREEP[th]?th:'ash',(x+y)%2),x:sx-1});
   else if(raw==='R')objs.push({y:y*16+13,b:y*16+15,img:tRock(th),x:sx});
   else if(raw==='K')objs.push({y:y*16+15,b:y*16+15,img:tObj('K',(x*3+y)%4),x:sx});
   else if(raw==='P')objs.push({y:y*16+14,b:y*16+15,img:tObj('P'),x:sx});
   else if(raw==='E')objs.push({y:y*16+9,b:y*16+13,img:tObj('E'),x:sx-1});
   else if(raw==='S')objs.push({y:y*16+9,b:y*16+12,img:tObj('S'),x:sx,lamp:1});
   else if(raw==='C'&&!(F.chest&&F.chest.x===x&&F.chest.y===y))objs.push({y:y*16+9,b:y*16+14,img:tObj(t==='c'?'c':'C'),x:sx,spark:t==='C'});
   else if(raw==='G')objs.push({y:y*16+9,b:y*16+14,img:tObj(t==='g'?'g':'G'),x:sx,spark:t==='G'});
   else if(raw==='L')objs.push({y:y*16+9,b:y*16+14,img:tObj('L',F.water==='low'?1:0),x:sx});}}
 if(F.bolt&&(tick>>2)%2){ctx.fillStyle='rgba(255,240,80,.45)';ctx.fillRect(F.bolt.x*16-cx,F.bolt.y*16-cy,16,16);}
 if(F.tap&&F.tap.t-->0&&(F.tap.t>>2)%2){const tx=F.tap.x*16-cx,ty=F.tap.y*16-cy;ctx.fillStyle='#ffe27a';for(const[ax,ay]of[[0,0],[12,0],[0,12],[12,12]]){ctx.fillRect(tx+ax,ty+(ay?15:0),4,1);ctx.fillRect(tx+(ax?15:0),ty+ay,1,4);}}
 /* 3) キャラクター */
 const moving=p.t!=null,k=moving?Math.min(1,p.t):1,ids=G.party,hs=F.hist,n=hs.length,pos=i=>{if(i===0)return[p.px,p.py];const a=hs[n-i]||hs[0]||[p.tx,p.ty],b0=hs[n-i-1]||a;if(!moving)return[a[0]*16,a[1]*16];return[(b0[0]+(a[0]-b0[0])*k)*16,(b0[1]+(a[1]-b0[1])*k)*16];};
 let ldir=p.dir;ids.forEach((id,i)=>{if(i&&n<i)return;const[qx,qy]=pos(i),f=fieldSprite(SPDEF[id]?id:'rio',moving,i);let dir=ldir;if(i){const a=hs[n-i],b0=hs[n-i-1];if(a&&b0&&b0[0]!==a[0])dir=a[0]>b0[0]?1:-1;else{const nx=i===1?[p.tx,p.ty]:hs[n-i+1];if(a&&nx&&nx[0]!==a[0])dir=nx[0]>a[0]?1:-1;}}objs.push({y:qy+15+(i?-.1*i:.2),f,x:Math.round(qx-cx)+8,fy:Math.round(qy-cy)+15,flip:dir>0,shadow:1});});
 for(const e of F.en){const key=resolveSpr(e.kinds[0]),d=SPDEF[key],f=fieldSprite(key,e.t!=null,(e.tx*3+e.ty)|0),hum=d.human;objs.push({y:e.py+15,f,x:Math.round(e.px-cx)+8,fy:Math.round(e.py-cy)+15,flip:hum?e.dir>0:e.dir<0,shadow:1,en:e,key});}
 if(!F.bossDown&&BSX>=0){const key=resolveSpr(A.bossKind?A.bossKind():A.boss.kind),d=SPDEF[key];objs.push({y:BSY*16+15.5,f:frameOf(key,'idle',tick>>4,''),x:BSX*16-cx+8,fy:BSY*16-cy+15,flip:!!d.human,shadow:1,boss:1});}
 const npc=(c,xx,yy,id)=>{if(c)objs.push({y:yy*16+15,f:frameOf(id,'idle',tick>>4,FOPT),x:xx*16-cx+8,fy:yy*16-cy+15,flip:false,shadow:1,npc:1});};
 if(AREA==='midori'&&F.night&&!G.flags.jinMet)MAP1.forEach((r,y)=>{const x=r.indexOf('J');if(x>=0)npc(1,x,y,'jin');});
 npc(UX>=0&&!G.flags.hakuaMet,UX,UY,'hakua');npc(EX>=0&&!G.flags.ernaMet,EX,EY,'erna');npc(VX>=0&&!G.flags.balzaMet,VX,VY,'balza');npc(NX>=0&&!G.flags.noahMet,NX,NY,'noah');npc(DX>=0&&!G.flags.valkMet,DX,DY,'valk');npc(MX>=0&&!G.flags.mireMet,MX,MY,'mire');
 objs.sort((a,b)=>a.y-b.y);
 for(const o of objs){if(o.img){const oy2=o.b-cy-(o.img.height-1);ctx.drawImage(o.img,o.x,oy2);
   if(o.lamp){const a=.22+.08*Math.sin(tick/9);ctx.fillStyle=`rgba(255,220,120,${a})`;ctx.fillRect(o.x+1,oy2-2,14,12);ctx.fillRect(o.x-2,oy2+1,20,6);}
   if(o.spark&&(tick>>4)%3===0){ctx.fillStyle='#ffffff';const sx2=o.x+3+((tick>>4)*5)%10,sy2=oy2+4+((tick>>4)*3)%6;ctx.fillRect(sx2,sy2-1,1,3);ctx.fillRect(sx2-1,sy2,3,1);}continue;}
  const f=o.f;if(!f)continue;const x=o.x,y=o.fy;
  if(o.shadow){const sw=o.boss?Math.min(46,Math.round(f.W*.4)):12;ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(x-sw/2,y-1,sw,2);ctx.fillRect(x-sw/2+1,y-2,sw-2,1);ctx.fillRect(x-sw/2+1,y+1,sw-2,1);}
  const dx=o.flip?x-(f.W-f.ax):x-f.ax,dy=y-f.ay+1;
  const put=(img,ox2,oy2)=>{if(o.flip){ctx.save();ctx.translate(dx+f.W+(ox2||0),dy+(oy2||0));ctx.scale(-1,1);ctx.drawImage(img,0,0);ctx.restore();}else ctx.drawImage(img,dx+(ox2||0),dy+(oy2||0));};
  if(o.en&&o.en.elite){const t=tintFrame(f,'#ff6a30','el');ctx.globalAlpha=.5+.3*Math.sin(tick/6);for(const[a,b]of[[-1,0],[1,0],[0,-1],[0,1]])put(t,a,b);ctx.globalAlpha=1;}
  if(o.boss){const t=tintFrame(f,'#b060ff','bs');ctx.globalAlpha=.4+.3*Math.sin(tick/8);for(const[a,b]of[[-1,0],[1,0],[0,-1],[0,1]])put(t,a,b);ctx.globalAlpha=1;}
  put(f.c);
  if(o.boss){ctx.fillStyle='#c8a0ff';for(let i=0;i<3;i++)ctx.fillRect(x-14+((tick*2+i*23)%28),y-6-((tick+i*17)%34),1,1);}
  if(o.en){const e=o.en,top=y-Math.min(f.ay-4,34);if(e.chase){ctx.fillStyle='#17131f';ctx.fillRect(x-2,top-9,5,9);ctx.fillStyle='#ff5a5a';ctx.fillRect(x-1,top-8,3,4);ctx.fillRect(x-1,top-3,3,2);}
   else if(e.elite){ctx.fillStyle='#17131f';ctx.fillRect(x-4,top-8,9,6);ctx.fillStyle='#ffb030';ctx.fillRect(x-3,top-7,1,4);ctx.fillRect(x,top-7,1,4);ctx.fillRect(x+3,top-7,1,4);ctx.fillRect(x-3,top-4,7,1);}
   if(e.kinds.length>1){const n2=e.kinds.length;ctx.fillStyle='#17131f';ctx.fillRect(x+5,y-9,4+n2*2,5);ctx.fillStyle='#ffe27a';for(let i=0;i<n2;i++)ctx.fillRect(x+7+i*2,y-8,1,3);}}}
 /* 宝箱を開ける演出 */
 if(F.chest){const c=F.chest,x=c.x*16-cx,y=c.y*16-cy;c.t++;
  if(c.t<26)ctx.drawImage(tObj('C'),x+((c.t>>1)%2?1:-1),y-3);
  else{if(c.t===26)openChest(c.k);ctx.drawImage(tObj('c'),x,y-3);const a=Math.max(0,1-(c.t-26)/60);ctx.fillStyle=`rgba(255,240,170,${.45*a})`;ctx.fillRect(x+5,y-30,6,34);ctx.fillRect(x+3,y-12,10,16);
   ctx.fillStyle=c.c||'#ffe27a';const iy=y-6-Math.min(18,(c.t-26)*.6);ctx.fillRect(x+6,iy,4,4);ctx.fillStyle='#fff';ctx.fillRect(x+7,iy+1,1,1);for(let i=0;i<4;i++){ctx.fillStyle='#fff3b0';ctx.fillRect(x+((c.t*3+i*5)%16),y-((c.t*2+i*9)%28),1,1);}}
  if(c.t>95){F.chest=null;F.lock=false;}}
 if(F.strike&&F.strike.t-->0){let lx=F.strike.x*16-cx+8,ly=0;ctx.fillStyle='#fff8b0';while(ly<F.strike.y*16-cy+8){const nx=lx+(((ly*7+tick*5)%9)-4);for(let i=0;i<8;i++)ctx.fillRect(Math.round(lx+(nx-lx)*i/8)-1,ly+i,3,1);lx=nx;ly+=8;}}
 /* 4) 天候・時間・虚蝕 */
 if(F.night){ctx.fillStyle='rgba(8,16,60,.48)';ctx.fillRect(0,0,W,H);for(let i=0;i<14;i++){ctx.fillStyle=`rgba(200,255,150,${.5+.5*Math.sin(tick/9+i)})`;ctx.fillRect((i*47+Math.sin(tick/50+i)*20+200)%W|0,(i*71+Math.cos(tick/60+i)*15+200)%H|0,1,1);}}
 if(A.theme==='ice'){ctx.fillStyle='rgba(255,255,255,.85)';for(let i=0;i<45;i++){ctx.fillRect((i*53+tick*(.25+i%3*.15))%W|0,(i*97+tick*(.5+(i%4)*.2))%H|0,i%5?1:2,i%5?1:2);}}
 if(A.theme==='storm'){ctx.fillStyle='rgba(200,210,255,.35)';for(let i=0;i<30;i++){const rx=(i*61+tick*3)%W|0,ry=(i*37+tick*7)%H|0;ctx.fillRect(rx,ry,1,3);}}
 if(A.theme==='void'){ctx.fillStyle='rgba(30,0,70,.3)';ctx.fillRect(0,0,W,H);for(let i=0;i<30;i++){ctx.fillStyle=['#ffffff','#c8b0ff','#ff80ff'][i%3];ctx.fillRect((i*61+Math.sin(tick/40+i)*8)%W|0,(H-((i*89+tick*(.2+i%4*.1))%H))|0,1,1);}}
 FXHOOK.forEach(f=>f());
 if(F.flash>0){ctx.fillStyle=`rgba(255,255,255,${F.flash/14})`;ctx.fillRect(0,0,W,H);F.flash--;}
 if(G.set.mm)drawMini(!!G.set.mmBig);
 if(F.pause){ctx.fillStyle='rgba(0,0,10,.35)';ctx.fillRect(0,0,W,H);}};
