/* ===== ver0.18 顔グラ・立ち絵・図鑑の絵・アイコン（16×16）・街の人 ===== */
'use strict';
/* ---------- 顔の位置 ---------- */
function faceCenter(key){const d=SPDEF[key];if(!d)return[9,9];if(d.human)return[d.face[0]+9,d.face[1]+9];const s=d.s||1,f=d.draw;
 return f===dSlime?[d.ax+3,d.ay-9]:f===dBeast?[d.ax+13*s,d.ay-15*s]:f===dShroom?[d.ax+2,d.ay-12]:f===dJelly?[d.ax+3,d.ay-25]:f===dBook?[d.ax,d.ay-18]:f===dShade?[d.ax+3,d.ay-29]:f===dYuki?[d.ax+2,d.ay-23]:f===dEmber?[d.ax+2,d.ay-13]:
  f===dGolem?[d.ax+1.5*s,d.ay-24*s]:f===dWarden?[d.ax+2,d.ay-47]:f===dPriest?[d.ax+2,d.ay-52]:f===dQueen?[d.ax+2,d.ay-55]:f===dDragon?[d.ax+36,d.ay-45]:[d.ax,d.ay-d.h*.5];}
const PORC=new Map();
function portrait(key,opt,size,flip){const ck=key+'|'+(opt||'')+'|'+size+'|'+(flip?1:0);let c=PORC.get(ck);if(c)return c;const f=frameOf(key,'idle',0,opt||''),[cx,cy]=faceCenter(key);c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 if(flip){g.translate(size,0);g.scale(-1,1);}g.drawImage(f.c,Math.round(cx-size/2),Math.round(cy-size/2),size,size,0,0,size,size);PORC.set(ck,c);return c;}
function trimCanvas(src,pad=1){const w=src.width,h=src.height,d=src.getContext('2d').getImageData(0,0,w,h).data;let x0=w,y0=h,x1=0,y1=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>10){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 if(x1<x0)return src;const s=Math.max(x1-x0+1,y1-y0+1)+pad*2,c=document.createElement('canvas');c.width=c.height=s;c.getContext('2d').drawImage(src,x0,y0,x1-x0+1,y1-y0+1,((s-(x1-x0+1))>>1),s-pad-(y1-y0+1),x1-x0+1,y1-y0+1);return c;}
const awO=aw=>aw?'{"aw":1}':'';
const FACE18={},ART18={};
face=function(id,aw){const key=SPDEF[id]?id:'rio',k=key+(aw?'_aw':'');return FACE18[k]||(FACE18[k]=portrait(key,awO(aw),18).toDataURL());};
art=function(id,aw){const key=SPDEF[id]?id:'rio',k=key+(aw?'_aw':'');if(ART18[k])return ART18[k];const f=frameOf(key,'idle',0,awO(aw)),c=document.createElement('canvas');c.width=c.height=42;c.getContext('2d').drawImage(f.c,HAX-25,HAY-40,42,42,0,0,42,42);return ART18[k]=c.toDataURL();};
/* 旧16×16の絵を参照している箇所（図鑑など）へ新しい絵を渡す */
function syncIMG(){for(const k in SPDEF){try{const d=SPDEF[k],f=frameOf(k,'idle',0,''),t=trimCanvas(f.c);IMG[k]=t;IMG[k+'_w']=whiteOf(t);if(d.human&&d.aw)IMG[k+'_aw']=trimCanvas(frameOf(k,'idle',0,awO(1)).c);}catch(e){}}}
syncIMG();
{const _vk=voidKind;voidKind=function(k){const vk=_vk(k);try{if(!IMG[vk]||IMG[vk].width===16){const key=resolveSpr(vk),t=trimCanvas(frameOf(key,'idle',0,'').c);IMG[vk]=t;IMG[vk+'_w']=whiteOf(t);}}catch(e){}return vk;};}
/* 行動順バー：新しい顔ドットで描き直す */
{const _rf=refresh;refresh=function(){_rf();if(!B||scene!=='battle')return;try{const cs=$('#order').querySelectorAll('.o canvas'),us=preview().slice(0,7);cs.forEach((c,i)=>{const u=us[i];if(!u)return;const key=uKey(u),d=SPDEF[key],g=c.getContext('2d');g.clearRect(0,0,18,18);g.drawImage(portrait(key,u.side===0?awO(u.aw):'',18,u.side===1&&d.human),0,0);});}catch(e){}};}
/* 覚醒・共鳴技のカットイン */
if(typeof reso==='function'){const _rs=reso;reso=async function(u){const p=_rs(u);try{$('#cut').querySelectorAll('canvas').forEach(c=>{const id=c.dataset.id;if(!id||!SPDEF[id])return;c.width=c.height=24;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(portrait(id,awO(1),24),0,0);});}catch(e){}
  if(B){B.heroes.filter(h=>h.aw&&h.alive).forEach(h=>{setAni(h,'awaken',{sp:aSp(9),hold:1});const[mx]=uMid(h);FX('awaken',mx,feet(h)[1],{c:'#ff9ad6'});});}await p;if(B)B.heroes.forEach(h=>{if(h.alive&&h.an&&h.an.k==='awaken')setAni(h,'idle');});};}
/* 会話の顔グラ（表情5種）：目・眉・口を描き分ける */
exprFace=function(id,ex='n'){const key=id+':'+ex;if(EXC[key])return EXC[key];const k=SPDEF[id]?id:'rio',d=SPDEF[k],S=4,N=16,src=portrait(k,'',N),c=document.createElement('canvas');c.width=c.height=N*S;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const t=document.createElement('canvas');t.width=t.height=N;const q=t.getContext('2d');q.drawImage(src,0,0);
 /* 目の位置：頭グリッドの 'e'（上まぶた）を探す */
 const eyes=[];d.head.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch==='e'||(ch==='o'&&d.head[y+1]&&d.head[y+1][x]==='b'))eyes.push([x,y]);}));
 const f0=frameOf(k,'idle',0,''),[cx,cy]=faceCenter(k),hw=d.head.reduce((a,r)=>Math.max(a,r.length),0),hx0=HAX-(hw>>1)+(d.hdx||0),hy0=HAY-(d.hip??7)-(d.float?3:0)-(d.tup??8)-d.head.length+(d.hup??2),ox=Math.round(cx-N/2),oy=Math.round(cy-N/2);
 const P=(x,y,w,h,col)=>{q.fillStyle=col;q.fillRect(x,y,w,h);},sk=cHex(ramp(d.pal.skin)[1]),sk2=cHex(ramp(d.pal.skin)[2]),D='#1a1420',E=eyes.map(([x,y])=>[hx0+x-ox,hy0+y-oy]).filter(([x,y])=>x>=0&&y>=0&&x<N&&y<N);
 if(E.length){const my=Math.max(...E.map(e=>e[1]))+3,mx=Math.round((E[0][0]+E[E.length-1][0])/2);
  if(ex==='h'){E.forEach(([x,y])=>{P(x,y,1,2,sk);P(x,y,1,1,D);});if(E.length>1)P(E[1][0]+1,E[1][1],1,2,sk);P(mx,my,2,1,'#c0405a');E.forEach(([x,y])=>P(x-1,y+2,1,1,'#ff9aa8'));}
  if(ex==='a'){E.forEach(([x,y],i)=>{P(x-(i?0:1),y-1,2,1,D);});P(mx,my,2,1,D);}
  if(ex==='s'){E.forEach(([x,y],i)=>{P(x,y,1,1,sk2);P(x,y+1,1,1,D);});P(E[0][0],E[0][1]+2,1,2,'#7fd6ff');P(mx,my,2,1,sk2);}
  if(ex==='o'){E.forEach(([x,y])=>{P(x,y-1,1,1,'#ffffff');P(x,y,1,2,D);});P(mx,my,1,2,D);}
  if(ex==='n')P(mx,my,2,1,sk2);}
 g.fillStyle=EXBG[ex]||EXBG.n;g.fillRect(0,0,c.width,c.height);for(let y=0;y<c.height;y+=4)for(let x=(y>>2)%2*4;x<c.width;x+=8){g.fillStyle='rgba(255,255,255,.035)';g.fillRect(x,y,4,4);}
 g.drawImage(t,0,0,N,N,0,0,N*S,N*S);const M=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x*2,y*2,w*2,h*2);};
 if(ex==='h'){M(25,3,1,5,'#ffe27a');M(23,5,5,1,'#ffe27a');M(28,9,1,3,'#fff6c8');M(27,10,3,1,'#fff6c8');}
 if(ex==='a'){M(24,3,2,5,'#ff4050');M(22,5,6,2,'#ff4050');M(27,2,2,2,'#ff4050');}
 if(ex==='s'){M(26,3,1,4,'#7fd6ff');M(25,6,3,2,'#7fd6ff');M(28,8,1,3,'#7fd6ff');}
 if(ex==='o'){M(26,2,2,5,'#ffe27a');M(26,8,2,2,'#ffe27a');}
 return EXC[key]=c.toDataURL();};

/* ---------- アイコン（16×16） ---------- */
const IC18={};
function icBuf(fn,ol){const b=new Buf(16,16);fn(b);if(ol!==false)b.outline();return b.canvas().toDataURL();}
const GEMC=c=>{const r=ramp(c);return(b,x=8,y=8,s=4)=>{b.poly([[x,y-s],[x+s,y],[x,y+s],[x-s,y]],r[1]);b.poly([[x,y-s],[x-s,y],[x,y]],r[0]);b.poly([[x,y+s],[x+s,y],[x,y]],r[2]);b.px(x-1,y-2,C('#ffffff'));};};
const ICD={
 sword:(b,R)=>drawWeapon(b,'sword',3,13,135,R),gsword:(b,R)=>drawWeapon(b,'gsword',3,13,135,R),
 dual:(b,R)=>{const h=ramp('#7a4a30'),g=ramp('#e8c040');for(const[x0,x1]of[[3,12],[12,3]]){b.line(x0,13,x0+(x1-x0)*.25,10.5,h[1],1);b.line(x0+(x1-x0)*.3,10,x1,2,R.blade[1],2);b.line(x0+(x1-x0)*.35,9,x1,2,R.blade[0],1);const gx=x0+(x1-x0)*.28;b.rect(gx-1,10,3,1,g[1]);}},
 tome:(b,R)=>{const c=R.cover||ramp('#a8324a'),w=ramp('#efe6cc'),g=ramp('#e8c040');b.rect(3,2,10,12,c[1]);b.rect(3,2,2,12,c[2]);b.rect(12,3,1,11,w[1]);b.rect(4,13,9,1,w[2]);b.rect(6,4,5,1,g[1]);b.rect(6,10,5,1,g[1]);GEMC(cHex(R.blade[1]))(b,8,7,2);},
 staff:(b,R)=>{const w=ramp('#8a5a34'),g=ramp('#e8c040');b.line(3,14,10,5,w[1],1);b.line(4,14,11,5,w[2],1);b.rect(9,5,3,2,g[1]);b.ell(12,3.5,2.6,2.6,R.blade[1]);b.px(11,2,C('#ffffff'));b.px(13,5,R.blade[2]);},
 bow:(b,R)=>{const w=ramp('#9a6a3a');for(let i=-6;i<=6;i++){const x=11-Math.round(i*i/6.5);b.px(x,8+i,w[1]);b.px(x+1,8+i,w[i<0?0:2]);}b.line(5,2,5,14,C('#f0ece0'),1);b.line(2,8,13,8,R.blade[1],1);b.px(14,8,R.blade[0]);b.px(13,7,R.blade[1]);b.px(13,9,R.blade[1]);b.px(2,7,C('#d84a4a'));b.px(2,9,C('#d84a4a'));},
 axe:(b,R)=>{const w=ramp('#8a5a34');b.line(4,14,10,3,w[1],1);b.line(5,14,11,3,w[2],1);b.ell(10,5.5,4,4.2,R.blade[1]);b.ell(8.6,5,2,2.6,R.blade[0]);b.rect(11,4,2,4,R.blade[2]);b.rect(9,3,3,1,w[2]);},
 scythe:(b,R)=>{const w=ramp('#6a4a5a');b.line(6,15,11,2,w[1],1);b.line(7,15,12,2,w[2],1);for(let i=0;i<9;i++){const x=11-i,y=2+Math.round(i*i/11);b.rect(x,y,1,i<6?3:2,R.blade[1]);b.px(x,y,R.blade[0]);}b.px(2,9,R.blade[0]);},
 shield:(b,R)=>{const g=ramp('#e8c040');b.poly([[3,2],[13,2],[13,8],[8,14.5],[3,8]],R.blade[1]);b.poly([[3,2],[8,2],[8,14],[3,8]],R.blade[0]);b.rect(3,2,10,1,R.blade[0]);b.rect(7,4,2,7,g[1]);b.rect(5,6,6,2,g[1]);b.px(7,6,g[0]);},
 charm:(b,R)=>{const w=ramp('#f0e8d0'),r=ramp('#c8343c'),g=ramp('#e8c040');b.rect(7,0,2,2,g[1]);b.rect(5,2,6,12,w[1]);b.rect(5,2,1,12,w[0]);b.rect(10,2,1,12,w[2]);b.rect(7,4,2,1,r[1]);b.rect(6,6,4,1,r[1]);b.rect(7,7,2,3,r[1]);b.rect(6,11,4,1,r[1]);b.px(8,13,R.blade[1]);},
 helm:(b,R)=>{const r=ramp('#c8343c');b.ell(8,8,5.5,5.5,R.blade[1]);b.rect(2,9,12,5,0);b.rect(3,9,10,4,R.blade[1]);b.ell(6.5,6,2.6,2.6,R.blade[0]);b.rect(4,9,8,2,C('#1a1626'));b.rect(7,9,2,4,R.blade[2]);b.rect(7,1,2,3,r[1]);b.px(9,2,r[2]);b.rect(11,10,2,3,R.blade[2]);},
 circ:(b,R)=>{const g=R.blade;b.rect(3,9,10,4,g[1]);b.rect(3,9,10,1,g[0]);b.rect(3,12,10,1,g[2]);for(const x of[3,7,11])b.poly([[x,9],[x+1,4+(x===7?-2:0)],[x+2,9]],g[1]);b.px(8,3,g[0]);GEMC('#d04060')(b,8,11,1.5);b.px(4,11,C('#40a0e0'));b.px(12,11,C('#40a0e0'));},
 armor:(b,R)=>{const g=ramp('#e8c040');b.poly([[4,3],[12,3],[13,8],[12,14],[4,14],[3,8]],R.blade[1]);b.ell(3.5,4.5,2.5,2.5,R.blade[0]);b.ell(12.5,4.5,2.5,2.5,R.blade[2]);b.rect(6,2,4,2,C('#1a1626'));b.rect(5,5,2,8,R.blade[0]);b.rect(11,5,1,9,R.blade[2]);b.rect(4,10,8,1,g[1]);b.rect(7,6,2,3,g[1]);},
 ring:(b,R)=>{const g=ramp('#e8c040');b.ell(8,10,4.5,4.5,g[1]);b.ell(8,10,2.6,2.6,0);b.ell(6.6,8.6,1.4,1.4,g[0]);b.ell(8,10,2.6,2.6,0);GEMC(cHex(R.blade[1]))(b,8,4,2.6);},
 neck:(b,R)=>{const g=ramp('#e8c040');for(let i=0;i<6;i++){b.px(3+i,2+i,g[i%2?1:0]);b.px(12-i,2+i,g[i%2?1:2]);}b.rect(7,8,2,1,g[1]);GEMC(cHex(R.blade[1]))(b,8,11,3);},
 fist:(b,R)=>{const l=ramp('#7a4a30');b.rect(4,4,8,7,R.blade[1]);b.rect(4,4,8,2,R.blade[0]);for(const x of[6,8,10])b.rect(x,5,1,4,R.blade[2]);b.rect(3,7,2,3,R.blade[1]);b.rect(5,11,6,3,l[1]);b.rect(5,11,6,1,l[0]);b.px(5,5,C('#ffffff'));},
 claw:(b,R)=>{const l=ramp('#7a4a30');b.rect(4,11,8,3,l[1]);b.rect(4,11,8,1,l[0]);for(const[x,d]of[[4,-1],[7,0],[10,1]]){b.line(x+1,11,x+1+d,3,R.blade[1],1);b.line(x+2,11,x+2+d,4,R.blade[2],1);b.px(x+1+d,2,R.blade[0]);}},
 potion:(b,R)=>flask(b,'#e04858',0),hipotion:(b,R)=>flask(b,'#ff7a40',1),ether:(b,R)=>flask(b,'#4a8ae8',0),
 drop:b=>{const y=ramp('#ffd84a');b.poly([[8,1],[12,9],[4,9]],y[1]);b.ell(8,10,4.2,4.2,y[1]);b.ell(6.6,9,1.6,2,y[0]);b.px(6,8,C('#ffffff'));b.rect(9,11,2,2,y[2]);},
 drop2:b=>{const y=ramp('#9fe8ff');b.poly([[8,0],[13,9],[3,9]],y[1]);b.ell(8,10,5,5,y[1]);b.ell(6.4,9,2,2.4,y[0]);b.px(6,8,C('#ffffff'));b.px(5,7,C('#ffffff'));b.rect(9,12,3,2,y[2]);b.px(13,3,C('#ffffff'));b.px(2,5,C('#ffffff'));},
 feather:b=>feather(b,'#ff9a30','#ffd84a'),tail:b=>{feather(b,'#e83a3a','#ffb030');b.px(13,2,C('#ffffff'));b.px(3,5,C('#ffe27a'));},
 haiseki:b=>{const s=ramp('#8e909c');b.poly([[3,9],[6,4],[11,5],[13,9],[11,13],[5,13]],s[1]);b.poly([[3,9],[6,4],[8,7],[6,11]],s[0]);b.poly([[11,13],[13,9],[9,10]],s[2]);b.px(7,6,C('#ffffff'));},
 kiba:b=>{const w=ramp('#f0ecd8');b.poly([[4,2],[9,3],[12,8],[12,14],[9,10],[6,6]],w[1]);b.line(5,3,10,8,w[0],1);b.line(12,10,12,13,w[2],1);b.rect(4,2,3,2,ramp('#c8a8a0')[1]);},
 kakera:b=>{GEMC('#8a5ad8')(b,8,8,6);b.px(11,4,C('#ffffff'));b.px(4,11,C('#c8b0ff'));},
 go:b=>{const p=ramp('#8a8a9c'),r=ramp('#d83a3a'),g=ramp('#e8c040');b.rect(3,1,2,14,p[1]);b.rect(3,1,1,14,p[0]);b.poly([[5,2],[14,3.5],[11,6],[14,8.5],[5,10]],r[1]);b.rect(5,2,8,2,r[0]);b.px(8,6,g[1]);b.rect(7,5,3,1,g[1]);b.rect(8,4,1,3,g[1]);b.rect(2,14,5,2,p[2]);b.px(3,0,g[1]);},
 eq:b=>{const a=ramp('#4a8ae8'),c=ramp('#e8a030'),s=ramp('#f4d0a8');b.ell(5.5,5,2.6,2.6,s[1]);b.poly([[1,14],[2,9],[9,9],[10,14]],a[1]);b.rect(2,9,7,1,a[0]);b.ell(11,6.5,2.4,2.4,s[2]);b.poly([[7,14],[8,10],[14,10],[15,14]],c[1]);b.rect(8,10,6,1,c[0]);},
 bar:b=>{const w=ramp('#a87038'),y=ramp('#f0b030'),f=ramp('#fff6e0');b.rect(3,5,8,9,w[1]);b.rect(4,6,6,7,y[1]);b.rect(4,6,2,7,y[0]);b.rect(3,5,8,1,w[0]);b.rect(3,13,8,1,w[2]);b.rect(11,7,3,1,w[1]);b.rect(13,7,1,5,w[1]);b.rect(11,11,3,1,w[2]);b.ell(5,4,2.2,1.8,f[1]);b.ell(8.5,3.6,2.6,2,f[1]);b.px(5,3,C('#ffffff'));},
 smith:b=>{const m=ramp('#8a94a8'),w=ramp('#8a5a34');b.rect(2,8,11,3,m[1]);b.rect(2,8,11,1,m[0]);b.poly([[13,8],[15,9],[13,10]],m[1]);b.rect(5,11,5,2,m[2]);b.rect(3,13,9,2,m[1]);b.rect(3,13,9,1,m[0]);b.line(6,6,12,1,w[1],1);b.rect(3,3,5,3,m[1]);b.rect(3,3,5,1,m[0]);b.px(11,6,C('#ffb030'));b.px(13,5,C('#ffe27a'));},
 eye:b=>{const g=ramp('#e8c040'),c=ramp('#9fe0ff'),w=ramp('#8a5a34');b.ell(7,7,5.5,5.5,g[1]);b.ell(7,7,4,4,c[1]);b.ell(5.6,5.6,1.8,1.8,c[0]);b.px(5,5,C('#ffffff'));b.line(11,11,14,14,w[1],2);},
 shop:b=>{const l=ramp('#b07840'),g=ramp('#ffd84a');b.poly([[3,6],[13,6],[14,14],[2,14]],l[1]);b.poly([[3,6],[6,6],[5,14],[2,14]],l[0]);b.rect(5,3,6,3,l[1]);b.rect(4,5,8,1,l[2]);b.rect(6,2,4,1,l[2]);b.ell(8,10,2.6,2.6,g[1]);b.px(7,9,C('#ffffff'));b.rect(8,9,1,3,g[2]);},
 star:b=>{const s=ramp('#c8ccf0'),y=ramp('#ffd84a');b.poly([[5,15],[6,6],[10,6],[11,15]],s[1]);b.rect(6,6,1,9,s[0]);b.rect(9,6,1,9,s[2]);b.rect(5,6,6,1,s[2]);b.rect(7,9,2,3,C('#2a2e58'));b.poly([[8,0],[9,2.5],[11.5,2.5],[9.5,4],[10.3,6.4],[8,5],[5.7,6.4],[6.5,4],[4.5,2.5],[7,2.5]],y[1]);b.px(7,2,C('#ffffff'));},
 door:b=>{const w=ramp('#c8a070'),r=ramp('#c8483a'),d=ramp('#6a4630');b.rect(3,7,10,8,w[1]);b.rect(3,7,2,8,w[0]);b.poly([[1,8],[8,1],[15,8]],r[1]);b.line(2,7,8,1,r[0],1);b.rect(7,10,3,5,d[1]);b.px(9,12,C('#ffd84a'));b.rect(4,9,2,2,C('#ffe9a0'));b.rect(11,9,1,2,C('#ffe9a0'));b.rect(11,2,2,3,d[1]);},
 rec:b=>{const c=ramp('#3a5ab0'),w=ramp('#efe6cc'),g=ramp('#e8c040');b.rect(2,3,11,11,c[1]);b.rect(2,3,2,11,c[2]);b.rect(12,4,1,10,w[1]);b.rect(4,13,9,1,w[2]);b.rect(5,5,6,1,g[1]);b.rect(5,7,6,1,w[1]);b.rect(5,9,4,1,w[1]);b.line(10,12,14,6,ramp('#f0f0f8')[1],1);b.px(14,5,ramp('#f0f0f8')[0]);b.px(9,13,C('#1a1626'));},
 quest:b=>{const w=ramp('#efe6cc'),r=ramp('#c8343c');b.rect(3,2,10,13,w[1]);b.rect(3,2,10,1,w[0]);b.rect(12,3,1,12,w[2]);for(const y of[5,7,9])b.rect(5,y,6,1,ramp('#8a7a60')[1]);b.ell(10,12,2,2,r[1]);b.px(9,11,r[0]);b.px(8,0,r[1]);b.px(8,1,r[2]);},
 bond:b=>{const r=ramp('#f0607a');b.ell(5.5,6,3.4,3.4,r[1]);b.ell(10.5,6,3.4,3.4,r[1]);b.poly([[2.4,7.5],[13.6,7.5],[8,14]],r[1]);b.ell(5,5,1.4,1.4,r[0]);b.px(4,4,C('#ffffff'));b.px(11,9,r[2]);},
 book:b=>ICD.tome(b,{blade:ramp('#40c0a0'),cover:ramp('#3a7a5a')}),
 coin:b=>{const g=ramp('#ffd84a');b.ell(8,8,5.5,5.5,g[1]);b.ell(7,7,3.6,3.6,g[0]);b.ell(8,8,3,3,g[1]);b.rect(7,5,2,6,g[2]);b.px(5,5,C('#ffffff'));},
 tou:b=>{const g=ramp('#9fd8ff');b.poly([[8,1],[11,7],[8,15],[5,7]],g[1]);b.poly([[8,1],[5,7],[8,9]],g[0]);b.px(7,4,C('#ffffff'));b.px(12,3,C('#ffffff'));b.px(3,10,g[0]);},
 back:b=>{const s=ramp('#c8ccf0');b.poly([[2,8],[8,2],[8,6],[14,6],[14,10],[8,10],[8,14]],s[1]);b.rect(8,6,6,1,s[0]);},
 gear:b=>{const s=ramp('#b8c0d4');b.ell(8,8,5,5,s[1]);for(let a=0;a<8;a++)b.rect(Math.round(8+Math.cos(a*.785)*6)-1,Math.round(8+Math.sin(a*.785)*6)-1,2,2,s[1]);b.ell(8,8,2.2,2.2,0);b.ell(6.4,6.4,1.6,1.6,s[0]);b.ell(8,8,2.2,2.2,0);},
};
function flask(b,col,hi){const g=ramp('#d8e8f4'),l=ramp(col),k=ramp('#a87038');b.rect(7,1,2,2,k[1]);b.rect(6,3,4,3,g[1]);b.rect(6,3,1,3,g[0]);b.ell(8,10,5,4.6,g[1]);b.ell(8,10.6,4.2,3.6,l[1]);b.rect(4,8,8,1,l[0]);b.ell(6,10,1.4,1.8,l[0]);b.px(5,8,C('#ffffff'));b.px(5,9,C('#ffffff'));b.rect(10,11,2,2,l[2]);if(hi){b.rect(5,6,6,1,ramp('#e8c040')[1]);b.px(12,3,C('#ffffff'));b.px(13,4,C('#ffe27a'));}}
function feather(b,c1,c2){const a=ramp(c1),y=ramp(c2);b.poly([[13,1],[14,5],[7,13],[3,13],[4,9]],a[1]);b.poly([[13,1],[4,9],[5,12],[12,4]],y[1]);b.line(13,2,3,14,ramp('#fff6e0')[1],1);b.px(8,5,a[2]);b.px(6,8,a[2]);b.px(10,8,a[2]);b.px(2,15,ramp('#fff6e0')[2]);}
const icon18=(k,o)=>{const ck=k+'|'+(o||'');if(IC18[ck])return IC18[ck];const fn=ICD[k]||ICD.shop,R={blade:ramp(TIERC[o]||o||'#c8d0e0'),leather:ramp('#7a4a30'),hilt:ramp('#7a4a30'),guard:ramp('#e8c040'),trim:ramp('#e8c040'),metal:ramp(TIERC[o]||'#b8c0d0'),white:ramp('#f4f0e6'),glow:ramp('#ffe27a')};return IC18[ck]=icBuf(b=>fn(b,R));};
iicon=function(k,tier){return icon18(ICD[k]?k:'armor',tier||'鉄');};
for(const k of['potion','hipotion','ether','drop','drop2','feather','tail','haiseki','kiba','kakera','go','eq','bar','smith','eye','shop','star','rec','door','quest','bond','book','coin','tou','back','gear'])ICON[k]=icon18(k);
if(typeof STONES!=='undefined')for(const k in STONES)ICON['st_'+k]=icBuf(b=>GEMC(STONES[k].c)(b,8,8,5));
if(typeof ITEMS!=='undefined')for(const k in ITEMS)if(!ICD[k])ICON[k]=ICON[k]||ICON.potion;

/* ---------- 街の人（酒場の主人・道具屋・鍛冶屋・鑑定士・灯守） ---------- */
const NPCD={
barkeep:{pal:{hair:'#5a4030',skin:'#e8b890',eye:'#3a2a1a',cloth:'#f0ece0',cloth2:'#3a3040',trim:'#7a3a30',leather:'#4a3020'},
 head:["....hhhhhh....","..hhhhhhhhhh..",".hhihhhhhhhhh.","hhhhhhhhhhhhHh","hhhhhhhhhhhHHh","hhsshhshhhhHH.","hsssssssshHHh.","hsesewsssHHh..",".sbsbwssshH...",".shhhhssSH....","..hhhhhSS.....","...sSS........"],
 torso:["..sss....",".kkttcC..","kkctccCC.","kcttccCC.","kcttccCC.",".ttttttT.",".tttttT..","........."],style:{fax:-5,fay:2,bax:-3,bay:3}},
shopgirl:{pal:{hair:'#e8904a',skin:'#fbd8b8',eye:'#3a8a5a',cloth:'#4aa870',cloth2:'#6a4a3a',trim:'#f0ece0',acc:'#e8c040',leather:'#6a4630'},
 head:["....hhhhhh....","..hhiiihhhhh..",".hiiihhhhhhhh.","hhihhhhhhhhhHh","ttttttttttttTT","hhhhhhhhhhhHHh","hhsshhshhhhHHh","hsesewsshhhHHh","hsbsbwsshhhHHh","hhssssssHhhHH.","hhHssssS.hHHh.","hh.ssSS...hHh."],
 torso:["..sks....",".tkkkcC..","kkttccC..","kcttccCC.","kcttccCC.",".aaqaaA..",".kcccC...","........."],style:{fax:-5,fay:1,bax:-3,bay:3}},
smithy:{pal:{hair:'#3a3a44',skin:'#c8906a',eye:'#2a2018',cloth:'#6a4a3a',cloth2:'#3a3038',trim:'#8a5a40',metal:'#8a94a8',leather:'#4a3020',blade:'#b8c0d0'},
 head:["..............","...mmmmmmm....","..mnnmmmmmmm..",".mnmmmmmmmmMM.",".hhhhhhhhhhHH.",".sshhsshhshhH.",".sesewssshhhH.","hsbsbwsShhhhH.","hhssssssShhhH.",".hhhhhhhhHHH..","..hhhhhhHH....","...hhHH......."],
 torso:[".lllllll..","lltttttLL.","lttttttTL.","ltttyttTL.",".ttttttT..",".tttttT...",".........."],hip:6,tup:6,hup:4,weapon:'axe',sleeve:'skin',legGap:3,bigFoot:1,style:{wa:100,fax:-4,fay:2}},
seer:{pal:{hair:'#d8d8e8',skin:'#e8c8a8',eye:'#6a4ac8',cloth:'#5a3a8a',cloth2:'#3a2a5c',trim:'#e8c040',acc:'#e8c040',leather:'#3a2a40',guard:'#e8c040',glow:'#9fe0ff'},
 head:["....cccccc....","..cckkkcccCc..",".ckkccccccCCc.","ckkcccccccCCCc","cayaaaaaaaaACc","chhhhhhhhhhHCc","chsshhshhhHHCc","hsesewsshhHHC.","hsbsbwsshhHH..","hhsssssshH....",".hhhhhhhH.....","..hhhHH......."],
 torso:["..skks....",".ykkccC...","kkcccccC..","kccyyccCC.","kccccccCC.",".aaaqaaA..",".kccccCC..",".kcccccCC.","kkcccccCC.","kcccccccCC","kcccccccCC","kkccccccCC","yyyytyyyTT"],robe:1,weapon:'staff',style:{fax:-7,fay:3,wa:62}}};
for(const k in NPCD)regHero(k,NPCD[k]);
