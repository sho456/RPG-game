/* ===== TD の戦場の背景（TDBG）：章ごとの空・遠景・中景・地面と道・灯（拠点）。横スクロールの奥行き（遠いほどゆっくり動く） =====
 make(stage, st) → {sky, far, mid, ground}（論理 1px＝1 ドットで描いた画像。表示で拡大してドット絵に見せる）。base(g, x, y, t) で灯を描く。
 テーマ：ash（灰の街道）・forest（翠の森）・chapel（祈りの廃聖堂）。絵はすべてコードで描く（色は各テーマの PAL だけ） */
'use strict';
const TDBG=(()=>{
const H=420,GT=196;/* 地面の始まり */
const PAL={
 ash:{sky:['#15142a','#2c2944','#4a4258'],moon:'#d8d2e8',far:'#24223a',farL:'#3a3654',mid:'#1b1a2e',ground:['#2f2d3c','#353343','#3b3949'],road:'#4e4858',roadE:'#5d5768',edge:'#1f1d2a',tuft:'#4a4a52',prop:'#151424'},
 forest:{sky:['#07131a','#0f2a2a','#1c4038'],moon:'#e2f0d8',far:'#0f2620',farL:'#1a3a2e',mid:'#0a1a14',ground:['#16301f','#1b3824','#21402a'],road:'#4a3c2a',roadE:'#5c4b34',edge:'#0f1f14',tuft:'#2f5a34',prop:'#08140e'},
 chapel:{sky:['#120a22','#26163c','#3e2552'],moon:'#ecd8f0',far:'#22163a',farL:'#3a2856',mid:'#170e28',ground:['#2c2440','#302746','#352b4c'],road:'#4c3a5c',roadE:'#5e4a70',edge:'#1a1228',tuft:'#4a3a60',prop:'#120a1e'},
 storm:{sky:['#0e1220','#1f2a3a','#38455a'],moon:'#d8e0f0',far:'#1a2232',farL:'#2e3a50',mid:'#111826',ground:['#2a2e38','#30343e','#363a44'],road:'#4a4a52',roadE:'#5a5a62',edge:'#1a1c24',tuft:'#4a5260',prop:'#0e1018',bolt:1},
 ice:{sky:['#0c1630','#1c3058','#3a5a88'],moon:'#f0f6ff',far:'#2a3e64',farL:'#c8daf0',mid:'#1a2848',ground:['#c8d8ec','#d6e2f2','#e2ecf8'],road:'#8aa0bc',roadE:'#a8bcd4',edge:'#5a7090',tuft:'#9ab0cc',prop:'#3a4a6a',snow:1},
 ruin:{sky:['#06141c','#0c2a34','#14404a'],moon:'#d8f0ec',far:'#0e2a32',farL:'#1e4a50',mid:'#0a1e26',ground:['#123038','#163840','#1a4048'],road:'#3a5a5e',roadE:'#4a6c70',edge:'#0a2028',tuft:'#2a6a6a',prop:'#061418'},
 tower:{sky:['#1a1030','#3a2a60','#7a6aa0'],moon:'#fff6e0',far:'#d8d0e8',farL:'#f4f0ff',mid:'#3a3060',ground:['#4a4470','#524c78','#5a5480'],road:'#7a74a0',roadE:'#8e88b4',edge:'#2a2448',tuft:'#9a94c0',prop:'#2a2448',cloud:1},
 void:{sky:['#05030c','#120a22','#22103a'],moon:'#b07aff',far:'#140a24',farL:'#3a1a5a',mid:'#0c0618',ground:['#1a1028','#1e122e','#221434'],road:'#3a2650',roadE:'#4c3466',edge:'#0c0618',tuft:'#5a3a7a',prop:'#08040e'}};
function rnd(seed){let s=seed;return()=>(s=(s*16807)%2147483647)/2147483647;}
const cv=(w,h)=>{const c=document.createElement('canvas');c.width=Math.ceil(w);c.height=h;return c;};
/* 空：画面に固定（グラデーションの帯を段にしてドットらしく）・星・月 */
function sky(P,R){const c=cv(480,GT+40),g=c.getContext('2d');const n=12;
 for(let i=0;i<n;i++){const k=i/(n-1),a=P.sky,j=k<.5?0:1,t=k<.5?k*2:(k-.5)*2;g.fillStyle=mix(a[j],a[j+1],t);g.fillRect(0,Math.floor(i*(GT+40)/n),480,Math.ceil((GT+40)/n)+1);}
 for(let i=0;i<70;i++){g.fillStyle=R()>.8?'#fff6d8':'#b8b0d8';g.fillRect(Math.floor(R()*480),Math.floor(R()*GT*.8),1,1);}
 g.fillStyle=mix(P.moon,P.sky[1],.6);g.beginPath();g.arc(196,48,18,0,7);g.fill();g.fillStyle=P.moon;g.beginPath();g.arc(196,48,15,0,7);g.fill();g.fillStyle=mix(P.moon,P.sky[0],.15);g.fillRect(189,43,3,3);g.fillRect(200,52,2,2);return c;}
/* 遠景：テーマごとの影絵（街並み・森の稜線・聖堂） */
function far(P,th,w,R){const c=cv(w,H),g=c.getContext('2d');
 if(th==='forest'){for(let x=0;x<w;x+=6){const h=40+Math.sin(x*.02)*14+R()*16;g.fillStyle=P.far;g.fillRect(x,GT-h,6,h+30);g.fillStyle=P.farL;g.fillRect(x,GT-h,6,2);}}
 else if(th==='storm'){for(let x=0;x<w;x+=4){const h=50+Math.abs(Math.sin(x*.008))*60+Math.sin(x*.05)*8;g.fillStyle=P.far;g.fillRect(x,GT-h,4,h+30);}}
 else if(th==='ice'){for(let x=0;x<w;x+=4){const h=40+Math.abs(Math.sin(x*.006+1))*70;g.fillStyle=P.far;g.fillRect(x,GT-h,4,h+30);if(h>80){g.fillStyle=P.farL;g.fillRect(x,GT-h,4,Math.min(14,h-80));}}}
 else if(th==='ruin'){for(let x=0;x<w;x+=50+R()*50){const bw=20+R()*30,bh=40+R()*70;g.fillStyle=P.far;g.fillRect(x,GT-bh,bw,bh+30);g.fillRect(x-4,GT-bh,bw+8,4);}}
 else if(th==='tower'){g.fillStyle=P.far;for(let x=0;x<w;x+=30){const y=GT-30-Math.sin(x*.03)*8;g.beginPath();g.arc(x,y,22+R()*10,0,7);g.fill();}g.fillRect(0,GT-30,w,60);}
 else if(th==='void'){for(let i=0;i<w/30;i++){const x=R()*w,y=40+R()*(GT-60),r=3+R()*8;g.fillStyle=R()>.5?P.farL:P.far;g.beginPath();g.moveTo(x,y-r);g.lineTo(x+r*.6,y);g.lineTo(x,y+r);g.lineTo(x-r*.6,y);g.fill();}}
 else if(th==='chapel'){for(let x=0;x<w;x+=90+R()*60){const bw=40+R()*40,bh=70+R()*60;g.fillStyle=P.far;g.fillRect(x,GT-bh,bw,bh+30);
   g.beginPath();g.moveTo(x-4,GT-bh);g.lineTo(x+bw/2,GT-bh-30-R()*30);g.lineTo(x+bw+4,GT-bh);g.fill();
   for(let i=0;i<3;i++){g.fillStyle=['#7a4a9a','#4a6aaa','#aa6a4a'][i];g.fillRect(x+8+i*(bw-16)/3,GT-bh+16,4,8);}}}
 else{for(let x=0;x<w;x+=30+R()*30){const bw=24+R()*30,bh=28+R()*44;g.fillStyle=P.far;g.fillRect(x,GT-bh,bw,bh+30);
   if(R()>.5){g.beginPath();g.moveTo(x-2,GT-bh);g.lineTo(x+bw/2,GT-bh-14);g.lineTo(x+bw+2,GT-bh);g.fill();}
   if(R()>.6){g.fillStyle=P.farL;g.fillRect(x+bw*.3,GT-bh+8,3,4);}}}
 return c;}
/* 中景：近い影（枯れ木と柵・大樹と蛍・柱とアーチ） */
function mid(P,th,w,R){const c=cv(w,H),g=c.getContext('2d');g.fillStyle=P.mid;
 for(let x=20;x<w;x+=70+R()*80){
  if(th==='forest'){const h=90+R()*50;g.fillRect(x,GT-h,10,h+10);for(let i=0;i<4;i++){const r=18+R()*14;g.beginPath();g.arc(x+5+(R()-.5)*30,GT-h+(R()-.2)*20,r,0,7);g.fill();}
   g.fillStyle='#c8ff9a';for(let i=0;i<3;i++)g.fillRect(Math.floor(x+R()*60),Math.floor(GT-20-R()*80),1,1);g.fillStyle=P.mid;}
  else if(th==='storm'){const h=60+R()*60;g.fillRect(x,GT-h,14,h+10);g.fillRect(x-4,GT-h,6,8);g.fillRect(x+12,GT-h+10,6,6);}
  else if(th==='ice'){const h=50+R()*20;g.fillStyle='#8a2a2a';g.fillRect(x,GT-h,4,h+6);g.fillRect(x+30,GT-h,4,h+6);g.fillRect(x-6,GT-h,46,4);g.fillRect(x-2,GT-h+10,38,3);g.fillStyle=P.mid;}
  else if(th==='ruin'){const h=70+R()*60;g.fillRect(x,GT-h,10,h+10);g.fillRect(x-3,GT-h,16,5);if(R()>.6){g.fillRect(x+10,GT-h+6,30,5);}}
  else if(th==='tower'){const h=120+R()*40;g.fillRect(x,GT-h,16,h+10);g.fillStyle='#c8a050';g.fillRect(x+6,GT-h+20,4,6);g.fillStyle=P.mid;}
  else if(th==='void'){const h=30+R()*80;g.beginPath();g.moveTo(x,GT+6);g.lineTo(x+6,GT-h);g.lineTo(x+12,GT+6);g.fill();}
  else if(th==='chapel'){const h=110+R()*30;g.fillRect(x,GT-h,12,h+10);g.fillRect(x-3,GT-h,18,6);if(R()>.5){g.fillRect(x+12,GT-h+6,40,6);g.fillRect(x+48,GT-h,12,h+10);x+=40;}}
  else{const h=40+R()*40;g.fillRect(x,GT-h,4,h+6);for(let i=0;i<3;i++){const y=GT-h+8+i*10,d=R()>.5?1:-1;g.fillRect(d>0?x+4:x-12,y,12,2);}
   for(let i=0;i<5;i++)g.fillRect(x+20+i*8,GT-10,2,14);g.fillRect(x+20,GT-6,40,2);}}
 return c;}
/* 地面：世界の幅いっぱい。土の段・道（縁と石）・草 */
function ground(P,st,R){const W=st.S.W,c=cv(W,H),g=c.getContext('2d');
 for(let y=GT;y<H;y+=4){g.fillStyle=P.ground[Math.min(2,Math.floor((y-GT)/((H-GT)/3)))];g.fillRect(0,y,W,4);}
 g.fillStyle=P.edge;g.fillRect(0,GT,W,2);
 for(let i=0;i<W*.6;i++){g.fillStyle=R()>.5?P.ground[0]:P.ground[2];g.fillRect(Math.floor(R()*W),GT+4+Math.floor(R()*(H-GT-4)),2+Math.floor(R()*3),1);}
 for(const L of(typeof TDS!=='undefined'?st.Ps:[])){const pts=st.S.paths[st.Ps.indexOf(L)];
  for(const[w,col]of[[30,P.edge],[26,P.road]]){g.strokeStyle=col;g.lineWidth=w;g.lineCap='butt';g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();}
  for(let s=0;s<L.L;s+=7){const a=TDS.at(L,s);g.fillStyle=R()>.5?P.roadE:P.edge;g.fillRect(Math.round(a.x),Math.round(a.y-12+R()*24),3,2);}}
 for(let i=0;i<W/14;i++){const x=Math.floor(R()*W),y=GT+8+Math.floor(R()*(H-GT-12));if(typeof TDS!=='undefined'&&st.Ps.some(L=>Math.abs(TDS.at(L,Math.max(0,Math.min(L.L,x+30))).y-y)<20))continue;
  g.fillStyle=P.tuft;g.fillRect(x,y,1,3);g.fillRect(x+2,y-1,1,4);g.fillRect(x+4,y+1,1,2);}
 /* 入口の虚蝕の霧 */
 const gr=g.createLinearGradient(0,0,90,0);gr.addColorStop(0,'rgba(90,60,130,.75)');gr.addColorStop(1,'rgba(90,60,130,0)');g.fillStyle=gr;g.fillRect(0,GT,90,H-GT);
 return c;}
function mix(a,b,t){const h=x=>[1,3,5].map(i=>parseInt(x.slice(i,i+2),16)),A=h(a),B=h(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');}
function make(st,vw){const th=st.S.th||'ash',P=PAL[th]||PAL.ash,R=rnd(th.length*977+st.S.W),W=st.S.W;
 return{sky:sky(P,R),far:far(P,th,(W-vw)*.25+vw+40,R),mid:mid(P,th,(W-vw)*.55+vw+40,R),ground:ground(P,st,R),P};}
/* 灯（拠点）：石の台・真鍮の柱・浮かぶ星の水晶（光は脈打つ） */
function base(g,x,y,t,hit){g.fillStyle='#0b0b1e';g.fillRect(x-24,y-4,48,12);g.fillStyle='#3a3d6a';g.fillRect(x-22,y-8,44,10);g.fillStyle='#575b96';g.fillRect(x-22,y-8,44,2);
 g.fillStyle='#4a3410';g.fillRect(x-6,y-96,12,88);g.fillStyle='#8a6420';g.fillRect(x-5,y-96,3,88);g.fillStyle='#c08a2c';for(const yy of[y-30,y-60,y-92])g.fillRect(x-8,yy,16,3);
 const fy=y-118+Math.sin(t*2)*3,k=.75+.25*Math.sin(t*3);
 const gr=g.createRadialGradient(x,fy,2,x,fy,46);gr.addColorStop(0,`rgba(255,226,160,${.65*k})`);gr.addColorStop(1,'rgba(242,179,71,0)');g.fillStyle=gr;g.fillRect(x-46,fy-46,92,92);
 g.fillStyle=hit?'#ff9a7a':'#ffe2a0';g.beginPath();g.moveTo(x,fy-14);g.lineTo(x+8,fy);g.lineTo(x,fy+14);g.lineTo(x-8,fy);g.fill();g.fillStyle='#fff8e0';g.fillRect(x-2,fy-6,3,9);}
return{make,base,H,GT};})();
