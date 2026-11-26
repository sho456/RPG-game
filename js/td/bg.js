/* ===== 戦闘と章の地図の背景（TDBG）：章ごとの空・遠景・中景・地面。コマンド戦闘（js/cb/view.js）が被写界深度をかけて重ねる =====
 make({S:{W,th}}, vw) → {sky, far, mid, ground, P}（論理 1px＝1 ドットで描いた画像。表示で拡大してドット絵に見せる）。
 テーマ：ash（灰の街道）・forest（翠の森）・chapel（祈りの廃聖堂）・storm（雷の高原）・ice（氷華の社）・ruin（水底の王都）・tower（天への塔）・void（虚の底）。
 絵はすべてコードで描く（色は各テーマの PAL を土台に、整数座標・ディザで塗る）。
 ver0.61：空＝段グラデ＋ディザ・雲の層・星・月の暈・テーマの特徴（稲光・オーロラ・光の柱・虚の裂け目 など）／遠景＝大きな影の形＋灯り＋足元の霞／
 中景＝テーマの小物（木・柱・石碑・鳥居・結晶 など）／地面＝石畳・草・雪・水たまり・ひび・苔などの質感。キャラの帯（y250〜380）は明暗を穏やかに */
'use strict';
const TDBG=(()=>{
const H=420,GT=196;/* 地面の始まり */
const PAL={
 ash:{sky:['#15142a','#2c2944','#4a4258'],moon:'#d8d2e8',far:'#24223a',farL:'#3a3654',mid:'#1b1a2e',ground:['#2f2d3c','#353343','#3b3949'],road:'#4e4858',roadE:'#5d5768',edge:'#1f1d2a',tuft:'#4a4a52',prop:'#151424'},
 forest:{sky:['#07131a','#0f2a2a','#1c4038'],moon:'#e2f0d8',far:'#0f2620',farL:'#1a3a2e',mid:'#0a1a14',ground:['#16301f','#1b3824','#21402a'],road:'#4a3c2a',roadE:'#5c4b34',edge:'#0f1f14',tuft:'#2f5a34',prop:'#08140e'},
 chapel:{sky:['#120a22','#26163c','#3e2552'],moon:'#ecd8f0',far:'#22163a',farL:'#3a2856',mid:'#170e28',ground:['#2c2440','#302746','#352b4c'],road:'#4c3a5c',roadE:'#5e4a70',edge:'#1a1228',tuft:'#4a3a60',prop:'#120a1e'},
 storm:{sky:['#0e1220','#1f2a3a','#38455a'],moon:'#d8e0f0',far:'#1a2232',farL:'#2e3a50',mid:'#111826',ground:['#2a2e38','#30343e','#363a44'],road:'#4a4a52',roadE:'#5a5a62',edge:'#1a1c24',tuft:'#4a5260',prop:'#0e1018'},
 ice:{sky:['#0c1630','#1c3058','#3a5a88'],moon:'#f0f6ff',far:'#2a3e64',farL:'#8aa4c8',mid:'#1a2848',ground:['#46587a','#506284','#5a6c8e'],road:'#6a80a0',roadE:'#8aa0bc',edge:'#2e3c5a',tuft:'#9ab0cc',prop:'#3a4a6a'},
 ruin:{sky:['#08202a','#12404a','#2a6a70'],moon:'#d8f0ec',far:'#0a2229',farL:'#1e4a50',mid:'#061418',ground:['#123038','#163840','#1a4048'],road:'#3a5a5e',roadE:'#4a6c70',edge:'#0a2028',tuft:'#2a6a6a',prop:'#061418'},
 tower:{sky:['#1a1030','#3a2a60','#7a6aa0'],moon:'#fff6e0',far:'#6a5c94',farL:'#b4a8d8',mid:'#3a3060',ground:['#423c64','#4a4470','#524c78'],road:'#7a74a0',roadE:'#8e88b4',edge:'#2a2448',tuft:'#9a94c0',prop:'#2a2448'},
 void:{sky:['#07041a','#1a0e34','#34185a'],moon:'#b07aff',far:'#140a24',farL:'#3a1a5a',mid:'#0c0618',ground:['#1a1028','#1e122e','#221434'],road:'#3a2650',roadE:'#4c3466',edge:'#0c0618',tuft:'#5a3a7a',prop:'#08040e'}};
function rnd(seed){let s=seed;return()=>(s=(s*16807)%2147483647)/2147483647;}
const cv=(w,h)=>{const c=document.createElement('canvas');c.width=Math.ceil(w);c.height=h;return c;};
function mix(a,b,t){const h=x=>[1,3,5].map(i=>parseInt(x.slice(i,i+2),16)),A=h(a),B=h(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');}
const F=(g,c,x,y,w,h,al)=>{g.globalAlpha=al==null?1:al;g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));g.globalAlpha=1;};
/* 整数の円・楕円（アンチエイリアスなし） */
function ell(g,c,cx,cy,rx,ry,al){g.globalAlpha=al==null?1:al;g.fillStyle=c;for(let j=-Math.round(ry);j<=Math.round(ry);j++){const w=Math.round(rx*Math.sqrt(Math.max(0,1-(j*j)/(ry*ry+.01))));g.fillRect(Math.round(cx)-w,Math.round(cy)+j,w*2+1,1);}g.globalAlpha=1;}
const disc=(g,c,cx,cy,r,al)=>ell(g,c,cx,cy,r,r,al);
const glow=(g,c,x,y,r,al)=>{for(let i=4;i>=1;i--)disc(g,c,x,y,r*i/4,al/4*(5-i)*.5);};
/* 点と点をつなぐ太さ t の線 */
function line(g,c,x0,y0,x1,y1,t,al){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))|0;g.globalAlpha=al==null?1:al;g.fillStyle=c;for(let i=0;i<=n;i++){const k=n?i/n:0;g.fillRect(Math.round(x0+(x1-x0)*k),Math.round(y0+(y1-y0)*k),t,t);}g.globalAlpha=1;}
function poly(g,c,pts){g.fillStyle=c;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fill();}
const BY=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
/* 雲のかたまり（楕円の重なり＋上を明るく） */
function cloud(g,c,x,y,w,h,R,hi){const n=3+(R()*3|0);for(let i=0;i<n;i++){const cx=x+w*(.15+.7*R()),rw=w*(.18+.2*R()),rh=h*(.35+.4*R());ell(g,c,cx,y-rh*.3+R()*h*.3,rw,rh);}
 ell(g,c,x+w/2,y+h*.15,w*.5,h*.28);if(hi){g.globalAlpha=.5;g.fillStyle=hi;for(let i=0;i<n;i++){g.fillRect(Math.round(x+w*(.2+.6*R())),Math.round(y-h*.35+R()*4),Math.round(w*.14),1);}g.globalAlpha=1;}}
const mist=(g,c,w,y0,y1,a)=>{for(let y=y0;y<y1;y+=2)F(g,c,0,y,w,2,a*(y-y0)/(y1-y0));};
const star=(g,R,n,ymax,w,cols)=>{for(let i=0;i<n;i++){const x=R()*w|0,y=R()*ymax|0;F(g,cols[R()*cols.length|0],x,y,1,1,.35+R()*.5);if(R()>.93){F(g,'#fff6d8',x-1,y,3,1,.25);F(g,'#fff6d8',x,y-1,1,3,.25);}}};
function moon(g,P,x,y,r,halo){for(let i=halo;i>r;i-=3)disc(g,P.moon,x,y,i,.022);disc(g,mix(P.moon,P.sky[1],.55),x,y,r+2);disc(g,P.moon,x,y,r);
 disc(g,mix(P.moon,P.sky[0],.18),x-r*.3,y+r*.2,r*.28);disc(g,mix(P.moon,P.sky[0],.15),x+r*.35,y-r*.3,r*.18);}
/* ---------- 空：画面に固定（ディザの段グラデ・雲・星・月・テーマの特徴） ---------- */
function sky(P,th,R){const SH=GT+40,c=cv(480,SH),g=c.getContext('2d'),n=14;
 for(let y=0;y<SH;y+=2){const k=Math.min(1,y/(SH-1)),a=P.sky,j=k<.5?0:1,t=k<.5?k*2:(k-.5)*2,f=mix(a[j],a[j+1],t),f2=mix(a[j],a[j+1],Math.min(1,t+.07));
  F(g,f,0,y,480,2);for(let x=0;x<480;x+=2)if(BY[(x/2&3)+((y/2&3)<<2)]<(t*n%1)*16)F(g,f2,x,y,2,2);}
 if(th==='ash'){star(g,R,40,GT*.6,480,['#b8b0d8']);moon(g,P,196,52,15,52);
  for(let i=0;i<7;i++)cloud(g,mix(P.sky[1],P.sky[2],.35+R()*.3),R()*440,40+i*20+R()*10,90+R()*90,10+R()*6,R,mix(P.sky[2],P.moon,.25));
  for(let i=0;i<5;i++){const x=240+R()*200,y=50+R()*40;F(g,P.prop,x,y,2,1);F(g,P.prop,x+2,y-1,2,1);F(g,P.prop,x+4,y,2,1);}}
 else if(th==='forest'){star(g,R,26,GT*.5,480,['#c8ff9a','#b8d8c8']);moon(g,P,196,60,16,60);
  for(let i=0;i<4;i++)cloud(g,mix(P.sky[1],P.sky[2],.5),R()*400,50+i*30,100+R()*80,10,R,null);
  for(let i=0;i<6;i++){const x=40+R()*400,w=14+R()*16;for(let y=0;y<GT+30;y+=2){g.globalAlpha=.045*(1-y/(GT+40));g.fillStyle=P.moon;const o=(y*.35)|0;g.fillRect(x+o,y,w,2);}g.globalAlpha=1;}
  for(let x=0;x<480;x+=6){const h=6+Math.sin(x*.07)*5+R()*10;F(g,P.mid,x,0,6,h);if(R()>.5)F(g,P.mid,x+1,h,3,3+R()*5|0);}}
 else if(th==='chapel'){star(g,R,34,GT*.6,480,['#e0c8f0','#a898d0']);for(let i=0;i<14;i++){const a=i/14*6.283;line(g,P.moon,200,60,200+Math.cos(a)*120,60+Math.sin(a)*120,1,.035);}
  moon(g,P,200,60,22,78);for(let i=0;i<6;i++)cloud(g,mix(P.sky[1],P.sky[2],.3+R()*.35),R()*440,36+i*24+R()*8,80+R()*90,10+R()*6,R,mix(P.sky[2],P.moon,.3));}
 else if(th==='storm'){const cl=mix(P.sky[0],P.sky[1],.5);for(let i=0;i<9;i++)cloud(g,mix(cl,P.sky[2],R()*.5),R()*440-20,4+i*14+R()*10,110+R()*100,16+R()*10,R,mix(P.sky[2],'#ffffff',.18));
  moon(g,P,270,70,10,34);for(let i=0;i<5;i++)cloud(g,mix(cl,P.sky[0],.4),R()*440,20+R()*60,120+R()*80,18,R,null);
  [[90,30],[250,10]].forEach(([bx,by])=>{glow(g,'#9ab4e0',bx,by+30,60,.2);let x=bx,y=by;for(let i=0;i<9;i++){const nx=x+(R()-.5)*26|0,ny=y+14+R()*8|0;line(g,'#6a84b8',x,y,nx,ny,3,.25);line(g,'#dbe6ff',x,y,nx,ny,1,.9);if(i==4&&R()>.3)line(g,'#dbe6ff',nx,ny,nx+(R()>.5?24:-24),ny+22,1,.7);x=nx;y=ny;}});
  for(let i=0;i<110;i++){const x=R()*480|0,y=R()*GT|0;line(g,'#9ab0d0',x,y,x-2,y+6,1,.16);}}
 else if(th==='ice'){star(g,R,110,GT*.75,480,['#e8f2ff','#a8c8f0','#ffffff']);
  for(let x=0;x<480;x++){const y0=28+Math.sin(x*.017)*18+Math.sin(x*.05+1)*5,hh=44+Math.sin(x*.031)*14+R()*3;
   for(let y=0;y<hh;y+=2){const k=y/hh;g.globalAlpha=.3*(1-k)*(.55+.45*Math.sin(x*.11));g.fillStyle=mix(k<.5?'#5ad0a8':'#4aa0c8',k<.5?'#4aa0c8':'#9a78d8',k<.5?k*2:(k-.5)*2);g.fillRect(x,Math.round(y0-hh*.2+y),1,2);}}g.globalAlpha=1;
  moon(g,P,250,46,12,40);for(let i=0;i<4;i++)cloud(g,mix(P.sky[1],P.sky[2],.4),R()*440,110+i*14,110+R()*80,8,R,P.moon);}
 else if(th==='ruin'){for(let i=0;i<9;i++){const x=R()*520-20,w=10+R()*20;for(let y=0;y<SH;y+=2){g.globalAlpha=.05*(1-y/SH);g.fillStyle=P.moon;g.fillRect(x+(y*.4|0),y,w,2);}}g.globalAlpha=1;
  star(g,R,50,GT,480,['#a8e8e0','#7ac8c8']);for(let i=0;i<22;i++){const x=R()*480|0,y=R()*GT|0,r=1+R()*2|0;ell(g,P.moon,x,y,r,r,.15);F(g,P.moon,x-r*.4,y-r*.4,1,1,.5);}
  for(let x=0;x<480;x+=8){const h=3+Math.sin(x*.09)*2+R()*3;F(g,P.moon,x,0,8,h,.12);}
  [[100,46,34],[250,66,22]].forEach(([x,y,l])=>{poly(g,mix(P.sky[1],P.sky[0],.4),[[x,y],[x+l,y+l*.15],[x+l*1.3,y+l*.4],[x+l,y+l*.5],[x,y+10]]);});}
 else if(th==='tower'){star(g,R,70,GT*.5,480,['#fff6e0','#d0c8f0']);moon(g,P,110,52,14,56);
  for(let i=0;i<5;i++)cloud(g,mix(P.sky[1],P.sky[2],.5+R()*.3),R()*440,60+i*22+R()*10,90+R()*80,10,R,mix(P.sky[2],P.moon,.35));
  for(let x=-20;x<500;x+=16)ell(g,mix(P.sky[2],P.moon,.1+R()*.15),x+R()*10,GT-22+R()*16+Math.sin(x*.03)*6,22+R()*14,10+R()*8);
  for(let x=-20;x<500;x+=20)ell(g,mix(P.sky[2],P.far,.4),x+R()*10,GT+6+R()*20,26+R()*12,12+R()*6);
  for(let x=-10;x<500;x+=30)F(g,mix(P.sky[2],P.moon,.5),x+R()*10,GT-30-R()*16,16+R()*14|0,1,.5);
  for(let i=0;i<30;i++){const w=7-i*.15;F(g,P.moon,230-w,0,w*2,GT-20,.012+.002*(30-i)/30);}F(g,'#fff6e0',227,0,6,GT-22,.18);F(g,'#fff6e0',229,0,2,GT-22,.35);glow(g,'#fff6e0',230,GT-26,34,.3);}
 else{star(g,R,60,GT*.8,480,['#b07aff','#8a6ac8','#d8c8ff']);
  for(let i=0;i<7;i++){cloud(g,mix(P.sky[1],P.sky[2],R()),R()*440,20+R()*140,90+R()*90,10+R()*8,R,null);}
  glow(g,'#7a3ac8',230,70,110,.22);let x=234,y=0;const pts=[];for(let i=0;i<14;i++){pts.push([x,y]);x+=(R()-.5)*22|0;y+=12+R()*8|0;}
  for(let i=0;i<pts.length-1;i++){const t=Math.max(1,5-i*.35)|0;line(g,'#7a3ac8',pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1],t+4,.25);line(g,'#b07aff',pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1],t+2,.55);line(g,'#f0e0ff',pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1],Math.max(1,t-1),.9);}
  for(let i=0;i<16;i++){const a=R()*6.283,d=30+R()*110,x=230+Math.cos(a)*d*1.5,y=70+Math.sin(a)*d*.8,r=2+R()*5;if(y<GT-10){poly(g,mix(P.far,P.farL,.3),[[x,y-r],[x+r*.7,y],[x,y+r*1.2],[x-r*.7,y]]);F(g,'#b07aff',x,y-r,1,r,.5);}}}
 return c;}
/* ---------- 遠景：大きな影の形＋灯り＋足元の霞（ぼかされるので細かい線は使わない） ---------- */
function ridge(g,c,w,base,amp,f,R,ph){let p=R()*9+(ph||0);for(let x=0;x<w;x+=2){const h=amp*(.55+.3*Math.sin(x*f+p)+.15*Math.sin(x*f*2.7+p*2));F(g,c,x,base-h,2,h+H);}}
const win=(g,x,y,c)=>{F(g,c||'#e8c27a',x,y,2,3,.85);};
function far(P,th,w,R){const c=cv(w,H),g=c.getContext('2d'),warm='#e8c27a';const hz=mix(P.sky[2],P.far,.35);
 if(th==='ash'){ridge(g,mix(P.far,P.sky[2],.25),w,GT-8,34,.012,R);ridge(g,P.far,w,GT,24,.02,R);
  for(let x=-10;x<w;x+=40+R()*40){const bw=24+R()*30,bh=26+R()*40;F(g,P.far,x,GT-bh,bw,bh+30);poly(g,P.far,[[x-3,GT-bh],[x+bw/2,GT-bh-12-R()*10],[x+bw+3,GT-bh]]);if(R()>.5)F(g,c,x+bw*.5,GT-bh+(R()*6|0),5+R()*bw*.3|0,6+R()*10|0,0);}
  F(g,P.far,w*.62,GT-96,12,96);F(g,P.far,w*.62-3,GT-100,18,6);F(g,P.far,w*.62+2,GT-110,8,10);win(g,w*.62+5,GT-90,warm);
  for(let i=0;i<9;i++)win(g,R()*w|0,GT-6-R()*26|0,warm);
  for(let i=0;i<3;i++){const x=R()*w;for(let y=0;y<40;y+=3)ell(g,P.sky[2],x+Math.sin(y*.2)*3,GT-60-y,3+y*.1,2,.1);}}
 else if(th==='forest'){ridge(g,mix(P.far,P.sky[2],.3),w,GT-10,46,.011,R);
  for(let x=0;x<w;x+=5){const h=30+Math.sin(x*.025)*14+R()*22;F(g,P.far,x,GT-h,6,h+30);F(g,P.farL,x,GT-h,6,1,.9);if(R()>.7)F(g,P.far,x+1,GT-h-6-R()*8,4,8);}
  const lx=w*.55;F(g,P.farL,lx-10,GT-86,22,86,.7);F(g,P.far,lx-8,GT-84,18,84);disc(g,P.far,lx+1,GT-86,9);for(let i=0;i<3;i++)F(g,mix(P.moon,P.far,.3),lx-5+i*5,GT-70,2,8,.6);F(g,P.far,lx-16,GT-50,10,50);F(g,P.far,lx+14,GT-60,8,60);
  for(let i=0;i<8;i++)F(g,'#c8ff9a',R()*w|0,GT-12-R()*60|0,1,1,.7);}
 else if(th==='chapel'){ridge(g,mix(P.far,P.sky[2],.2),w,GT-6,22,.014,R);
  const cx=w*.5;F(g,P.far,cx-50,GT-92,100,92+20);poly(g,P.far,[[cx-56,GT-92],[cx,GT-150],[cx+56,GT-92]]);
  [-62,62].forEach(o=>{F(g,P.far,cx+o-9,GT-130,18,130);poly(g,P.far,[[cx+o-12,GT-130],[cx+o,GT-176],[cx+o+12,GT-130]]);win(g,cx+o-1,GT-110,'#7a4a9a');});
  poly(g,P.far,[[cx-6,GT-150],[cx,GT-190],[cx+6,GT-150]]);F(g,P.far,cx-1,GT-200,2,12);
  disc(g,'#6a4a9a',cx,GT-100,11,.9);disc(g,'#aa7ac8',cx,GT-100,6,.8);F(g,'#e0c8f0',cx-1,GT-101,3,3,.8);
  for(let i=0;i<5;i++){const x=cx-36+i*18;F(g,'#4a6aaa',x,GT-60,3,14,.8);}
  for(let x=0;x<w;x+=1)if(Math.abs(x-cx)>95&&R()>.55)F(g,P.far,x,GT-8-R()*16,1,24);
  F(g,P.far,cx-90,GT-40,30,40);F(g,P.far,cx+60,GT-30,36,30);for(let x=cx-85;x<cx+95;x+=14)if(R()>.4)F(g,P.far,x,GT-46-R()*10,6,10);}
 else if(th==='storm'){ridge(g,mix(P.far,P.sky[2],.3),w,GT-30,56,.009,R);ridge(g,P.far,w,GT-4,40,.017,R,3);
  for(let i=0;i<6;i++){const x=R()*w,h=40+R()*50;poly(g,P.far,[[x-14,GT],[x-4,GT-h],[x+2,GT-h-8],[x+12,GT-h+6],[x+16,GT]]);}
  const tx=w*.3;F(g,P.far,tx,GT-98,16,98);F(g,P.far,tx-4,GT-98,24,6);F(g,P.far,tx+2,GT-108,4,10);F(g,P.far,tx+10,GT-110,4,12);win(g,tx+6,GT-80,'#9ab4e0');
  const fx=w*.75;F(g,P.far,fx,GT-40,34,40);F(g,P.far,fx+6,GT-62,8,22);glow(g,'#e8a050',fx+10,GT-22,16,.35);F(g,'#e8a050',fx+8,GT-22,4,6,.8);}
 else if(th==='ice'){ridge(g,mix(P.far,P.sky[2],.35),w,GT-30,70,.008,R,1);
  for(let x=0;x<w;x+=2){const h=26+Math.abs(Math.sin(x*.012+1))*84+Math.sin(x*.05)*4;F(g,P.far,x,GT-h,2,h+30);if(h>64)F(g,P.farL,x,GT-h,2,Math.min(30,h-60),.75);}
  F(g,mix(P.far,P.sky[2],.2),0,GT-6,w,40);
  const tx=w*.7;F(g,'#6a3a48',tx,GT-34,3,34);F(g,'#6a3a48',tx+24,GT-34,3,34);F(g,'#6a3a48',tx-5,GT-36,38,4);F(g,'#6a3a48',tx-2,GT-28,32,3);
  const sx=w*.3;F(g,P.far,sx,GT-30,30,30);poly(g,P.far,[[sx-6,GT-30],[sx+15,GT-46],[sx+36,GT-30]]);win(g,sx+13,GT-18,'#f0d890');
  for(let i=0;i<40;i++)F(g,'#ffffff',R()*w|0,GT-20-R()*120|0,1,1,.3);}
 else if(th==='ruin'){ridge(g,mix(P.far,P.sky[2],.25),w,GT-4,30,.012,R);
  for(let x=-10;x<w;x+=36+R()*36){const bw=18+R()*26,bh=40+R()*80,sk=(R()-.5)*14;poly(g,P.far,[[x,GT+20],[x+sk,GT-bh],[x+sk+bw,GT-bh],[x+bw,GT+20]]);
   if(R()>.5)poly(g,P.far,[[x+sk-3,GT-bh],[x+sk+bw/2,GT-bh-16],[x+sk+bw+3,GT-bh]]);else disc(g,P.far,x+sk+bw/2,GT-bh,bw/2);
   if(R()>.45)F(g,P.farL,x+sk+bw*.4,GT-bh+10,3,5,.6);}
  const ax=w*.5;F(g,P.far,ax-30,GT-70,10,70);F(g,P.far,ax+20,GT-70,10,70);F(g,P.far,ax-30,GT-74,60,10);for(let j=0;j<14;j++){const hw=Math.sqrt(Math.max(0,196-(j-14)*(j-14)));g.clearRect(Math.round(ax-hw),GT-64+j,Math.round(hw*2),1);}
  g.clearRect(ax-20,GT-50,40,50);for(let i=0;i<10;i++)ell(g,P.moon,R()*w,GT-20-R()*90,2,2,.12);}
 else if(th==='tower'){for(let x=0;x<w;x+=2)F(g,mix(P.far,P.sky[2],.4),x,GT-26-Math.sin(x*.03)*8,2,60);
  const tx=w*.4;poly(g,P.far,[[tx-22,GT+10],[tx-14,GT-170],[tx-6,GT-176],[tx-6,GT-210],[tx+6,GT-210],[tx+6,GT-176],[tx+14,GT-170],[tx+22,GT+10]]);
  F(g,P.farL,tx-6,GT-210,2,170,.5);for(let i=0;i<9;i++)win(g,tx-2+(i%2)*2,GT-40-i*17,'#fff0c0');glow(g,'#fff6e0',tx,GT-212,18,.55);F(g,'#fff6e0',tx-1,GT-216,3,6,.9);
  F(g,P.far,tx-34,GT-72,12,72);F(g,P.far,tx+22,GT-90,12,90);for(let i=0;i<5;i++){const x=R()*w,y=GT-60-R()*70;poly(g,P.far,[[x-9,y],[x+9,y],[x+4,y+7],[x-3,y+9]]);}
  for(let x=-20;x<w;x+=16)ell(g,mix(P.sky[2],P.moon,.22+R()*.12),x+R()*8,GT-10+R()*14,20+R()*10,9+R()*5);}
 else{for(let i=0;i<7;i++){const x=R()*w,y=GT-100+R()*60,r=18+R()*20;F(g,P.far,x-r,y,r*2,5);poly(g,P.far,[[x-r,y+5],[x+r,y+5],[x+r*.3,y+r+R()*14],[x-r*.2,y+r*1.6]]);F(g,P.farL,x-r,y,r*2,1,.9);}
  for(let x=-10;x<w;x+=30+R()*34){const bh=40+R()*90,bw=10+R()*14;poly(g,P.far,[[x,GT+20],[x+2,GT-bh],[x+bw*.6,GT-bh-14],[x+bw,GT-bh+4],[x+bw+4,GT+20]]);F(g,P.farL,x+2,GT-bh,1,bh-20,.6);}
  for(let i=0;i<10;i++){const x=R()*w,y=GT-30-R()*100;poly(g,'#7a3ac8',[[x,y-3],[x+2,y],[x,y+3],[x-2,y]]);}}
 mist(g,hz,w,GT-60,GT+2,.7);F(g,hz,0,GT-2,w,30,.5);return c;}
/* ---------- 中景：テーマの小物（中くらいの細かさ。縁に薄い照り返し） ---------- */
function branch(g,c,x,y,a,l,t,d,R){if(d<=0||l<3)return;const x1=x+Math.cos(a)*l,y1=y+Math.sin(a)*l;line(g,c,x,y,x1,y1,t);const n=2;for(let i=0;i<n;i++)branch(g,c,x1,y1,a+(i?.5:-.5)*(.6+R()*.5),l*(.62+R()*.15),Math.max(1,t-1),d-1,R);}
function mid(P,th,w,R){const c=cv(w,H),g=c.getContext('2d'),m=P.mid,rim=mix(P.mid,P.farL,.3),gl='#e8c27a';
 const base=(x,ww)=>{F(g,m,x,GT-2,ww,14);};
 for(let x=14;x<w;x+=62+R()*70){
  if(th==='ash'){const k=R();
   if(k<.5){const h=70+R()*40;F(g,m,x,GT-h,5,h+10);F(g,rim,x,GT-h,1,h,.5);branch(g,m,x+2,GT-h+8,-1.9,22,3,4,R);branch(g,m,x+3,GT-h+16,-1.2,20,3,4,R);}
   else if(k<.8){F(g,m,x,GT-14,3,18);F(g,m,x+22,GT-12,3,16);F(g,m,x-3,GT-12,36,3);F(g,m,x-3,GT-6,36,2);for(let i=0;i<4;i++)F(g,m,x+4+i*7,GT-20+(i%2)*4,2,14);}
   else{F(g,m,x,GT-50,3,56);F(g,m,x-2,GT-54,12,6);glow(g,gl,x+6,GT-50,10,.4);F(g,gl,x+4,GT-52,4,4,.9);F(g,m,x-10,GT-18,30,12);ell(g,m,x-2,GT-6,8,8);ell(g,m,x+14,GT-6,8,8);}}
  else if(th==='forest'){const h=84+R()*50,tw=8+R()*5|0;poly(g,m,[[x-3,GT+10],[x+2,GT-h],[x+tw-2,GT-h],[x+tw+4,GT+10]]);F(g,rim,x+2,GT-h,1,h,.35);
   for(let i=0;i<5;i++){const r=16+R()*14;disc(g,m,x+tw/2+(R()-.5)*44,GT-h+(R()-.5)*26,r);}
   for(let i=0;i<3;i++)F(g,mix(m,P.farL,.4),x+tw/2+(R()-.5)*40|0,GT-h-10+R()*14|0,6,1,.6);
   for(let i=0;i<3;i++)F(g,m,x+(R()*30|0),GT-h+16,1,20+R()*24|0);
   for(let i=0;i<3;i++){const fx=x+R()*60|0,fy=GT-16-R()*80|0;glow(g,'#c8ff9a',fx,fy,3,.5);F(g,'#e8ffc8',fx,fy,1,1,.9);}
   if(R()>.5){ell(g,m,x+22,GT,10,6);F(g,'#7ae8c8',x+20,GT-4,2,2,.8);F(g,'#7ae8c8',x+25,GT-3,1,1,.8);}}
  else if(th==='chapel'){const k=R();
   if(k<.6){const h=96+R()*34;F(g,m,x,GT-h,12,h+10);F(g,m,x-3,GT-h,18,5);F(g,m,x-2,GT-8,16,10);F(g,rim,x+1,GT-h+5,1,h-10,.45);
    if(R()>.5){F(g,m,x+12,GT-h+6,38,6);F(g,m,x+46,GT-h+2,12,h+8);F(g,m,x+49,GT-h,6,4);for(let j=0;j<5;j++)F(g,m,x+14+j*7,GT-h+12,2,3+j%2*2);x+=40;}}
   else if(k<.85){F(g,m,x,GT-30,10,34);ell(g,m,x+5,GT-30,5,5);F(g,m,x-3,GT-2,16,6);F(g,rim,x,GT-28,1,24,.4);}
   else{F(g,m,x,GT-22,4,26);F(g,m,x-4,GT-4,12,6);glow(g,gl,x+2,GT-26,8,.5);F(g,'#fff0c0',x+1,GT-30,2,5,.9);}}
  else if(th==='storm'){const h=50+R()*60;poly(g,m,[[x,GT+10],[x+2,GT-h],[x+10,GT-h-5],[x+16,GT-h+10],[x+20,GT+10]]);F(g,rim,x+2,GT-h,1,h-6,.4);
   if(R()>.5){F(g,m,x+22,GT-26,3,34);F(g,m,x+30,GT-22,3,30);line(g,m,x+23,GT-24,x+31,GT-20,1);line(g,m,x+23,GT-18,x+31,GT-14,1);}
   for(let i=0;i<5;i++)F(g,m,x-8+i*6+R()*30|0,GT-2-R()*8|0,1,10);}
  else if(th==='ice'){const k=R();
   if(k<.4){const tw=44;F(g,'#4a2a3a',x,GT-52,5,58);F(g,'#4a2a3a',x+tw-6,GT-52,5,58);F(g,'#4a2a3a',x-7,GT-56,tw+14,5);F(g,'#4a2a3a',x-3,GT-46,tw+6,3);F(g,'#d8e8f8',x-7,GT-58,tw+14,2,.5);}
   else if(k<.75){const h=70+R()*40;for(let i=0;i<5;i++){const wd=6+(5-i)*6;poly(g,m,[[x+22-wd,GT-h+i*(h/5)+(h/5)],[x+22,GT-h+i*(h/5)-4],[x+22+wd,GT-h+i*(h/5)+(h/5)]]);F(g,'#d8e8f8',x+22-wd*.6,GT-h+i*(h/5)+2,wd*1.2,2,.4);}F(g,m,x+20,GT-8,4,14);}
   else{F(g,m,x+6,GT-16,5,20);F(g,m,x+2,GT-26,14,10);F(g,m,x,GT-30,18,4);F(g,'#d8e8f8',x,GT-32,18,3,.55);F(g,gl,x+6,GT-22,5,5,.9);glow(g,gl,x+8,GT-20,9,.35);}}
  else if(th==='ruin'){const k=R();
   if(k<.55){const h=70+R()*60;F(g,m,x,GT-h,12,h+10);F(g,m,x-3,GT-h,18,5);F(g,m,x-2,GT-12,16,8);for(let i=0;i<4;i++)ell(g,P.tuft,x+(R()*12|0),GT-h*R(),2,1+R()*2,.45);F(g,rim,x+1,GT-h+5,1,h-10,.4);
    for(let i=0;i<3;i++){const sx=x+12+i*3;let y=GT;for(let j=0;j<20;j++){y-=2;F(g,m,sx+Math.sin(j*.5+i)*3,y,2,2);}}}
   else if(k<.8){ell(g,m,x+10,GT-4,16,10);ell(g,m,x+22,GT-8,10,14);for(let i=0;i<5;i++){F(g,'#7ae8c8',x+R()*30|0,GT-16+R()*14|0,1,2,.7);}}
   else{for(let i=0;i<4;i++){let y=GT+4;const sx=x+i*5;for(let j=0;j<28;j++){y-=2;F(g,m,sx+Math.sin(j*.35+i*2)*4,y,2,2);}}}
   for(let i=0;i<4;i++){const bx=x+R()*50,by=GT-20-R()*100;ell(g,P.moon,bx,by,2,2,.2);F(g,P.moon,bx-1,by-1,1,1,.5);}}
  else if(th==='tower'){const h=100+R()*50;F(g,m,x,GT-h,14,h+10);F(g,m,x-3,GT-h,20,6);F(g,m,x-3,GT-8,20,10);F(g,rim,x+1,GT-h+6,1,h-10,.5);F(g,'#d8b868',x-3,GT-h-1,20,1,.7);
   for(let i=0;i<4;i++)F(g,'#d8b868',x+5,GT-h+18+i*18,4,6,.75);glow(g,'#e8c878',x+7,GT-h+30,12,.22);
   if(R()>.5){F(g,m,x+22,GT-30,4,36);poly(g,mix(m,P.moon,.18),[[x+26,GT-30],[x+44,GT-26],[x+40,GT-20],[x+44,GT-14],[x+26,GT-14]]);}
   ell(g,mix(P.sky[2],P.moon,.2),x+30,GT+2,22,8,.6);}
  else{const k=R();
   if(k<.7){const h=50+R()*70;poly(g,m,[[x,GT+8],[x+5,GT-h*.6],[x+11,GT-h],[x+16,GT-h*.5],[x+22,GT+8]]);poly(g,mix(m,'#7a3ac8',.5),[[x+8,GT+4],[x+11,GT-h],[x+13,GT-h*.7],[x+12,GT+4]]);glow(g,'#a068e8',x+11,GT-h*.4,16,.25);F(g,'#d8b8ff',x+11,GT-h,1,2,.9);
    poly(g,m,[[x+26,GT+8],[x+30,GT-h*.35],[x+36,GT+8]]);}
   else{const y=GT-40-R()*40;poly(g,m,[[x,y],[x+30,y],[x+22,y+14],[x+12,y+26],[x+6,y+10]]);F(g,'#a068e8',x,y,30,1,.7);glow(g,'#a068e8',x+15,y+16,10,.2);}}
 }
 mist(g,mix(P.sky[2],P.mid,.5),w,GT-30,GT+10,.5);return c;}
/* ---------- 地面：奥ほど暗く霞む。質感はテーマごと、キャラの帯（y250〜380）は穏やかに ---------- */
function cobble(g,W,R,hl,sh,sz,al){let y=GT+2,row=0;while(y<H){const rh=Math.round(4+(y-GT)/(H-GT)*(sz||12)),sw=rh*2.3;F(g,sh,0,y,W,1,.3*al);
  for(let x=-(row%2?sw/2:0)-(R()*sw|0);x<W;x+=sw){const j=sw*(.8+R()*.4);F(g,sh,x,y,1,rh,.3*al);const v=R();F(g,v>.5?'#ffffff':'#000000',x+1,y+1,j-1,rh-1,.03+.03*al);F(g,hl,x+1,y+1,j-2,1,.1*al);}
  y+=rh;row++;}}
function crack(g,c,x,y,n,R,dx,al){for(let i=0;i<n;i++){const nx=x+(R()-.3)*dx,ny=y+(R()-.5)*8;line(g,c,x,y,nx,ny,1,al);if(R()>.85)crack(g,c,nx,ny,4,R,dx,al);x=nx;y=ny;}}
function ground(P,st,R){const W=st.S.W,th=st.S.th||'ash',c=cv(W,H),g=c.getContext('2d');
 for(let y=GT;y<H;y+=2){const t=(y-GT)/(H-GT),q=Math.round(t*7)/7;F(g,mix(mix(P.ground[0],P.ground[1],Math.min(1,q*2)),P.ground[2],Math.max(0,q*2-1)),0,y,W,2);}
 const gl=(th==='ice'?'#a8c0e0':'#ffffff');
 if(th==='ash'){cobble(g,W,R,P.roadE,P.edge,10,.9);for(let i=0;i<W/10;i++){const x=R()*W|0,y=GT+6+R()*(H-GT-10)|0;ell(g,P.tuft,x,y,3+R()*4,1,.3);}
  for(let i=0;i<W/9;i++){const x=R()*W|0,y=GT+4+R()*(H-GT-8)|0;F(g,P.tuft,x,y,1,3+R()*3|0,.8);F(g,P.tuft,x+2,y+1,1,3,.8);}
  for(let i=0;i<W/10;i++)F(g,'#6a6270',R()*W|0,GT+4+R()*(H-GT-8)|0,2,1,.6);}
 else if(th==='forest'){for(let i=0;i<60;i++)ell(g,R()>.5?P.ground[0]:P.tuft,R()*W,GT+6+R()*(H-GT-10),12+R()*30,2+R()*5,.12);
  for(let y=252;y<380;y+=2){const o=Math.sin(y*.05)*14+Math.sin(y*.13)*4;F(g,P.road,W*.12+o,y,W*.76,2,.16);}
  for(let i=0;i<W/3;i++){const x=R()*W|0,y=GT+4+R()*(H-GT-8)|0;g.globalAlpha=.9;F(g,P.tuft,x,y,1,3);F(g,P.tuft,x+2,y-1,1,4);F(g,P.tuft,x+4,y+1,1,2);if(R()>.8)F(g,mix(P.tuft,'#ffffff',.25),x+1,y-2,1,1);}
  for(let i=0;i<W/14;i++)F(g,'#7a9a4a',R()*W|0,GT+10+R()*(H-GT-16)|0,2,1,.5);
  for(let i=0;i<26;i++){const x=R()*W|0,y=GT+8+R()*(H-GT-14)|0;F(g,R()>.5?'#c8ff9a':'#f0e8a8',x,y,1,1,.55);}
  for(let i=0;i<5;i++){const x=R()*W|0,y=GT+4+R()*30|0;line(g,P.edge,x,y,x+10+R()*20,y+8+R()*6,2,.4);}}
 else if(th==='chapel'){cobble(g,W,R,P.roadE,P.edge,16,1);
  for(let y=250;y<382;y+=2){F(g,'#6a2a4a',W*.1,y,W*.8,2,.1);}F(g,'#c8a050',W*.1,250,W*.8,1,.12);F(g,'#c8a050',W*.1,381,W*.8,1,.12);
  for(let i=0;i<14;i++)crack(g,P.edge,R()*W,GT+8+R()*(H-GT-16),6,R,14,.5);
  for(let i=0;i<22;i++){const x=R()*W|0,y=GT+4+R()*(H-GT-8)|0;F(g,P.tuft,x,y,2+R()*4|0,2,.7);}
  for(let i=0;i<5;i++){const x=R()*W|0,y=GT+14+R()*30|0;ell(g,'#8a6aaa',x,y,2,1,.5);}}
 else if(th==='storm'){for(let i=0;i<60;i++)ell(g,R()>.5?P.edge:P.roadE,R()*W,GT+6+R()*(H-GT-10),10+R()*26,2+R()*4,.08);
  for(let i=0;i<10;i++)crack(g,P.edge,R()*W,GT+8+R()*(H-GT-16),8,R,10,.5);
  for(let i=0;i<9;i++){const x=R()*W|0,y=GT+10+R()*(H-GT-20)|0;if(y>250&&y<380&&R()>.3)continue;const rx=10+R()*18,ry=2+R()*3;ell(g,mix(P.sky[1],P.edge,.4),x,y,rx,ry,.7);ell(g,P.sky[2],x,y-ry*.3,rx*.6,Math.max(0,ry*.4),.35);F(g,'#b0c0e0',x-rx*.5,y-ry*.5,rx*.7,1,.3);}
  for(let i=0;i<W/10;i++){const x=R()*W|0,y=GT+4+R()*(H-GT-8)|0;F(g,P.tuft,x,y,1,3,.8);F(g,P.tuft,x+2,y+1,1,2,.8);}
  for(let i=0;i<50;i++){const x=R()*W|0,y=GT+6+R()*(H-GT-12)|0;ell(g,'#9ab0d0',x,y,2,1,.18);}}
 else if(th==='ice'){for(let i=0;i<46;i++){const x=R()*W,y=GT+10+R()*(H-GT-24),rx=18+R()*40,ry=3+R()*6;ell(g,P.edge,x,y+ry*.5,rx,ry,.12);ell(g,'#9ab0d0',x,y-ry*.2,rx*.9,ry*.7,.1);}
  for(let i=0;i<6;i++){const x=R()*W|0,y=GT+10+R()*(H-GT-20)|0;ell(g,'#7ac0d8',x,y,10+R()*14,2+R()*2,.25);F(g,'#d8f0ff',x-6,y-1,10,1,.35);}
  for(let i=0;i<W/6;i++){const x=R()*W|0,y=GT+4+R()*(H-GT-8)|0;F(g,'#ffffff',x,y,1,1,.35+R()*.4);}
  for(let i=0;i<12;i++){const x=R()*W|0,y=GT+8+R()*(H-GT-16)|0;F(g,P.tuft,x,y,1,3,.7);F(g,P.tuft,x+2,y,1,2,.7);}
  for(let i=0;i<14;i++){const x=R()*W|0,y=GT+10+R()*(H-GT-20)|0;F(g,P.edge,x,y,2,1,.3);F(g,P.edge,x+3,y+1,2,1,.3);}}
 else if(th==='ruin'){cobble(g,W,R,P.roadE,P.edge,14,.9);
  for(let i=0;i<70;i++){const x=R()*W,y=GT+6+R()*(H-GT-10),rx=8+R()*20;ell(g,P.moon,x,y,rx,1,.035);ell(g,P.moon,x+rx*.3,y+2,rx*.5,1,.03);}
  for(let i=0;i<9;i++)crack(g,P.edge,R()*W,GT+8+R()*(H-GT-16),6,R,10,.45);
  for(let i=0;i<W/12;i++){const x=R()*W|0,y=GT+4+R()*(H-GT-8)|0;F(g,P.tuft,x,y,1,3,.6);F(g,P.tuft,x+2,y+1,1,2,.6);if(R()>.8)F(g,'#7ae8c8',x,y,1,1,.8);}
  for(let i=0;i<24;i++){const x=R()*W|0,y=GT+6+R()*(H-GT-12)|0;F(g,'#a8e8e0',x,y,1,1,.35);}}
 else if(th==='tower'){cobble(g,W,R,P.roadE,P.edge,18,.7);
  for(let x=0;x<=W;x+=W/8)line(g,'#d8b868',W*.5+(x-W*.5)*.22,GT,x,H,1,.07);
  for(let i=0;i<14;i++){const x=R()*W,y=GT+4+R()*60;ell(g,'#fff6e0',x,y,20+R()*30,2,.06);}
  for(let i=0;i<40;i++)F(g,'#fff6e0',R()*W|0,GT+4+R()*(H-GT-8)|0,1,1,.35);}
 else{for(let i=0;i<50;i++)ell(g,R()>.5?'#000000':P.ground[2],R()*W,GT+6+R()*(H-GT-10),10+R()*24,2+R()*4,.15);
  for(let i=0;i<22;i++){const x=R()*W,y=GT+8+R()*(H-GT-16),mb=(y>250&&y<380)?.3:.7;crack(g,'#7a3ac8',x,y,10,R,10,.35*mb);crack(g,'#c8a0ff',x,y,10,R,10,.12*mb);}
  for(let i=0;i<40;i++){const x=R()*W|0,y=GT+6+R()*(H-GT-12)|0;F(g,'#b07aff',x,y,1,1,.3);}
  for(let i=0;i<10;i++){const x=R()*W|0,y=GT+8+R()*(H-GT-16)|0;poly(g,P.edge,[[x,y],[x+2,y-6],[x+4,y]]);F(g,'#7a3ac8',x+2,y-6,1,3,.6);}}
 /* 奥の霞（地平線に向かって空の色へ）・手前の暗がり・入口の虚蝕の霧 */
 const hz=mix(P.sky[2],P.far,.35);for(let y=GT;y<GT+56;y+=2)F(g,hz,0,y,W,2,.62*Math.pow(1-(y-GT)/56,1.6));
 F(g,P.edge,0,GT,W,2);F(g,'#000000',0,GT+2,W,1,.18);
 for(let y=H-70;y<H;y+=2)F(g,P.edge,0,y,W,2,.5*(y-(H-70))/70);
 const gr=g.createLinearGradient(0,0,90,0);gr.addColorStop(0,'rgba(90,60,130,.5)');gr.addColorStop(1,'rgba(90,60,130,0)');g.fillStyle=gr;g.fillRect(0,GT,90,H-GT);
 return c;}
function make(st,vw){const th=st.S.th||'ash',P=PAL[th]||PAL.ash,R=rnd(th.length*977+st.S.W),W=st.S.W;
 return{sky:sky(P,th,R),far:far(P,th,(W-vw)*.25+vw+40,R),mid:mid(P,th,(W-vw)*.55+vw+40,R),ground:ground(P,st,R),P};}
return{make,H,GT};})();
