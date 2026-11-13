/* ===== ver0.19 戦闘エフェクト =====
 すべて「スプライトと同じ大きさのドット」で描く（座標は戦場の論理座標、描画時にドット格子へ丸める）。
 攻撃の種類（斬る・突く・爪・噛みつき・叩きつけ・射撃）と属性（炎氷雷風地光闇）ごとに別のエフェクトを持つ。
 時間は ANIM の時計に従うので、ヒットストップ中はエフェクトも止まる */
const FX19=(()=>{
const L=[],PT=[];let G=null,k=3,p=2,ox=0,oy=0,lastT=0;
const dot=()=>p/k;
function R(x,y,w,h,c){G.fillStyle=c;G.fillRect(Math.round(x*k/p)*p+ox,Math.round(y*k/p)*p+oy,Math.max(p,Math.round(w*k/p)*p),Math.max(p,Math.round(h*k/p)*p));}
const D=(x,y,c,n=1)=>R(x,y,n*p/k,n*p/k,c);
const lit=(c,t)=>PX.mix(c,'#ffffff',t),drk=(c,t)=>PX.mix(c,'#000000',t);
function add(dur,f,layer=1,delay=0){const e={t0:ANIM.now+delay*ANIM.SP(),dur:Math.max(1,dur*ANIM.SP()),f,layer};L.push(e);return e;}
function part(x,y,vx,vy,c,l=24,g=0,s=1){if(PT.length<420)PT.push({x,y,vx,vy,c,l,l0:l,g,s});}
function spray(x,y,n,c,sp=1.2,g=.05,l=22,up=0){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=sp*(.4+Math.random()*.8);part(x,y,Math.cos(a)*v,Math.sin(a)*v-up,Array.isArray(c)?c[i%c.length]:c,l*(.6+Math.random()*.7)|0,g,Math.random()<.3?2:1);}}
function draw(ctx,kk,pp,layer,sx=0,sy=0){G=ctx;k=kk;p=pp;ox=sx;oy=sy;const now=ANIM.now;
 for(let i=L.length-1;i>=0;i--){const e=L[i];if(now<e.t0)continue;const t=(now-e.t0)/e.dur;if(t>=1){L.splice(i,1);continue;}if(e.layer===layer)e.f(t,e);}
 if(layer===1){const dt=Math.min(3,(now-lastT)/16.7);lastT=now;for(let i=PT.length-1;i>=0;i--){const q=PT[i];q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=q.g*dt;q.l-=dt;if(q.l<=0){PT.splice(i,1);continue;}if(q.l<q.l0*.25&&(Math.floor(q.l)&1))continue;D(q.x,q.y,q.c,q.s);}}}
const clear=()=>{L.length=0;PT.length=0;};

/* ---- 物理：斬撃の弧 ---- a0→a1 へ刃筋が走り、尾が追いかけて消える */
function slash(x,y,o={}){const a0=o.a0==null?-2.2:o.a0,a1=o.a1==null?.9:o.a1,r=o.r||13,w=o.w||3.2,col=o.col||'#ffffff',c2=lit(col,.55),cx=x-Math.cos((a0+a1)/2)*r*.25,cy=y-Math.sin((a0+a1)/2)*r*.25;
 return add(o.dur||230,t=>{const h=Math.min(1,t*2.1),tl=Math.max(0,t*1.7-.55),n=Math.ceil(Math.abs(a1-a0)*r*1.3);
  for(let i=Math.floor(tl*n);i<=h*n;i++){const u=i/n,a=a0+(a1-a0)*u,v=(u-tl)/Math.max(.01,h-tl),th=Math.max(.5,w*Math.sin(v*2.6+.3)*(1-t*.4)),ex=Math.cos(a),ey=Math.sin(a)*(o.sq||1);
   for(let s=-th/2;s<=th/2;s+=.62){const rr=r+s;D(cx+ex*rr,cy+ey*rr,Math.abs(s)<th*.28?'#ffffff':s>0?col:c2);}}
  if(t<.35){const a=a0+(a1-a0)*h;D(cx+Math.cos(a)*(r+2),cy+Math.sin(a)*(r+2)*(o.sq||1),'#ffffff',2);}},1,o.delay||0);}
/* ---- 突き：収束する線と中心の閃光 ---- */
function thrust(x,y,dir,col='#ffffff',o={}){return add(o.dur||200,t=>{const n=5,L0=22*(1-t);for(let i=0;i<n;i++){const yy=y+(i-2)*2.6*(1-t*.5),len=L0*(1-Math.abs(i-2)*.22),x0=x-dir*(len+3-t*6);R(Math.min(x0,x0+dir*len),yy,len,dot(),i===2?'#ffffff':lit(col,.3));}
  const s=(1-t)*5;for(let d=-s;d<=s;d+=.66){R(x-dir*2+d*.4-.3,y+d,.7,dot(),'#ffffff');}},1,o.delay||0);}
/* ---- 爪：3本の引っかき傷 ---- */
function claw(x,y,dir,col='#ffffff',o={}){const sz=o.size||1;return add(o.dur||240,t=>{for(let j=0;j<3;j++){const h=Math.min(1,t*2.4-j*.12),tl=Math.max(0,t*2-.8-j*.1);if(h<=0)continue;
   for(let u=tl;u<=h;u+=.045){const px=x+dir*(-7+u*14+j*4.2-4)*sz,py=y+(-8+u*16)*sz,th=Math.sin(u*3.14)*1.6+.4;R(px,py,th,dot(),u>h-.15?'#ffffff':j===1?lit(col,.5):col);}}},1,o.delay||0);}
/* ---- 噛みつき：上下の牙が閉じる ---- */
function bite(x,y,col='#ffffff',o={}){const sz=o.size||1;return add(o.dur||260,t=>{const cl=Math.min(1,t/.42),gap=(1-cl*cl)*9*sz,a=t>.42?1-(t-.42)/.58:1;if(a<.2&&(Math.floor(t*40)&1))return;
  for(let i=-3;i<=3;i++){const fx=x+i*2.7*sz,h=(4.2-Math.abs(i)*.7)*sz;for(let s=0;s<h;s+=.66){const w=(1-s/h)*1.5+.3;R(fx-w/2,y-gap-h+s+2,w,dot(),s<1?col:'#ffffff');R(fx+1.35*sz-w/2,y+gap+h-s-2,w,dot(),s<1?col:'#ffffff');}}
  if(t>.4&&t<.62)for(let i=-4;i<=4;i++)D(x+i*2.2,y,'#ffffff',t<.5?2:1);},1,o.delay||0);}
/* ---- 打撃・命中の火花 ---- */
function burst(x,y,col='#ffffff',o={}){const sz=o.size||1,n=o.rays||8,rot=o.rot||0;return add(o.dur||210,t=>{const r0=(2+t*9)*sz,len=(1-t)*8*sz;
  for(let i=0;i<n;i++){const a=rot+i/n*6.283,c=Math.cos(a),s=Math.sin(a),L2=len*(i%2?.6:1);for(let d=0;d<L2;d+=.66)D(x+c*(r0+d),y+s*(r0+d),d<L2*.5?'#ffffff':col);}
  const cs=(1-t)*4*sz;if(cs>.5)for(let d=-cs;d<=cs;d+=.66){const w=(cs-Math.abs(d))*1.2;R(x-w/2,y+d,w,dot(),'#ffffff');}},1,o.delay||0);}
function ring(x,y,col='#ffffff',o={}){const r0=o.r0||2,r1=o.r1||16,sq=o.sq||1;return add(o.dur||300,t=>{const r=r0+(r1-r0)*(1-(1-t)*(1-t)),n=Math.ceil(r*5);if(t>.7&&(Math.floor(t*30)&1))return;for(let i=0;i<n;i++){if(o.dash&&(i%4)>1)continue;const a=i/n*6.283;D(x+Math.cos(a)*r,y+Math.sin(a)*r*sq,i%3?col:lit(col,.6),o.thick||1);}},o.layer==null?1:o.layer,o.delay||0);}
/* ---- 叩きつけ：地面の衝撃 ---- */
function smash(x,y,col='#d8c8a8',o={}){const sz=o.size||1;ring(x,y,col,{r0:3,r1:20*sz,sq:.3,dur:320,thick:2});ring(x,y,'#ffffff',{r0:1,r1:13*sz,sq:.3,dur:240});
 for(let i=0;i<10*sz;i++)part(x+(Math.random()-.5)*14*sz,y,(Math.random()-.5)*1.6,-1.2-Math.random()*1.8,i%3?col:drk(col,.35),26+Math.random()*14|0,.14,i%4?1:2);
 return add(200,t=>{for(let i=-3;i<=3;i++){const h=(1-t)*(10-Math.abs(i)*2)*sz;R(x+i*3.6*sz,y-h,dot(),h,i%2?'#ffffff':col);}});}

/* ---- 属性 ---- */
const EL={
 '炎':(x,y,s=1)=>{spray(x,y-2,10*s,['#ffe27a','#ff9a30','#ff5020'],.9,-.03,30,.9);
  return add(430,t=>{const H=(t<.3?t/.3:1-(t-.3)/.7)*26*s,ph=Math.floor(t*14);for(let i=-4;i<=4;i++){const h=H*(1-Math.abs(i)/5)*(.75+((i*7+ph*3)%5)*.07);for(let d=0;d<h;d+=.66){const u=d/h;R(x+i*1.8*s+Math.sin((d+ph)*.9)*.8,y+4-d,1.9*s,dot(),u<.3?'#fff6c0':u<.55?'#ffc040':u<.8?'#ff7a28':'#d83018');}}});},
 '氷':(x,y,s=1)=>{const sh=[[-7,2,11],[0,-1,17],[6,3,12],[-3,5,8],[4,-4,9]];
  setTimeout(()=>spray(x,y-4,14*s,['#ffffff','#bff4ff','#7fd6ff'],1.5,.12,26,.6),330*ANIM.SP());
  return add(420,t=>{for(let j=0;j<sh.length;j++){const g=Math.min(1,Math.max(0,t*3.2-j*.22));if(g<=0||t>.8)continue;const[dx,dy,h0]=sh[j],h=h0*g*s,cx=x+dx*s,by=y+6+dy*.5;
    for(let d=0;d<h;d+=.66){const u=d/h,w=(u<.3?u/.3:1-(u-.3)/.7)*3.4*s+.5;R(cx-w/2,by-d,w/2,dot(),u>.75?'#ffffff':'#d8f6ff');R(cx,by-d,w/2,dot(),u>.75?'#bff4ff':'#6fc0f0');}}
   if(t>.8)for(let i=0;i<6;i++)D(x+(i-3)*4,y-6+((i*5)%7),'#ffffff');});},
 '雷':(x,y,s=1)=>{if(typeof B!=='undefined'&&B){B.flashBg=Math.max(B.flashBg||0,5);B.flashCol='#fff8c0';}spray(x,y,10*s,['#ffffff','#ffe14a'],1.8,.02,14);const seeds=[Math.random()*9,Math.random()*9,Math.random()*9];
  return add(330,t=>{if(t>.66)return;const sd=seeds[Math.floor(t*9)%3];let px=x+Math.sin(sd*7)*10,py=y-70;const n=12;for(let i=1;i<=n;i++){const nx=i===n?x:x+Math.sin(sd*13+i*2.4)*7*(1-i/n)+Math.sin(sd+i)*3,ny=y-70+70*i/n,st=Math.max(Math.abs(nx-px),Math.abs(ny-py))/.66;
    for(let q=0;q<st;q++){const u=q/st,qx=px+(nx-px)*u,qy=py+(ny-py)*u;R(qx-.7*s,qy,1.4*s+.7,dot(),'#ffe14a');D(qx,qy,'#ffffff');}px=nx;py=ny;}
   for(let i=0;i<6;i++){const a=i/6*6.283+t*8;D(x+Math.cos(a)*(4+t*10),y+Math.sin(a)*(2+t*5),'#fff8c0');}});},
 '風':(x,y,s=1)=>{for(let i=0;i<6;i++)part(x+(Math.random()-.5)*16,y+(Math.random()-.5)*14,-1.6-Math.random(),-.4+Math.random()*.4,i%2?'#8ff0a8':'#e0ffe8',22,0);
  slash(x,y,{a0:-2.6,a1:.4,r:11*s,w:2.6,col:'#8ff0a8',dur:230});slash(x,y,{a0:.5,a1:3.6,r:9*s,w:2.2,col:'#c8ffd8',dur:230,delay:70});return slash(x,y,{a0:-1,a1:2.2,r:14*s,w:2,col:'#8ff0a8',dur:230,delay:140});},
 '地':(x,y,s=1)=>{for(let i=0;i<9*s;i++)part(x+(Math.random()-.5)*18,y+7,(Math.random()-.5)*1.2,-1.4-Math.random()*1.6,i%2?'#d0a060':'#8a6a3a',28,.14,i%3?1:2);
  return add(420,t=>{const g=t<.25?t/.25:t>.7?1-(t-.7)/.3:1;for(const[dx,h0,w0]of[[-8,13,5],[0,21,7],[7,15,5.5],[-3,9,4]]){const h=h0*g*s,bx=x+dx*s,by=y+8;for(let d=0;d<h;d+=.66){const w=(1-d/h)*w0*s+.6;R(bx-w/2,by-d,w*.45,dot(),'#f0d090');R(bx-w/2+w*.45,by-d,w*.55,dot(),d/h>.6?'#b08040':'#7a5428');}}});},
 '光':(x,y,s=1)=>{spray(x,y,8*s,['#ffffff','#fff3a6'],.8,-.04,30,.8);
  return add(400,t=>{const w=(t<.2?t/.2:1-(t-.2)/.8)*9*s;if(w>.4){R(x-w/2,y-80,w,88,'#fff3a6');R(x-w/4,y-80,w/2,88,'#ffffff');}
   const c=(1-t)*14*s;for(let d=-c;d<=c;d+=.66){D(x+d,y,'#ffffff');D(x,y+d*.8,'#ffffff');if(Math.abs(d)<c*.55){D(x+d*.7,y+d*.7,'#fff3a6');D(x+d*.7,y-d*.7,'#fff3a6');}}});},
 '闇':(x,y,s=1)=>{for(let i=0;i<10;i++){const a=i/10*6.283;part(x+Math.cos(a)*16*s,y+Math.sin(a)*12*s,-Math.cos(a)*.9,-Math.sin(a)*.7,i%2?'#b07cff':'#5a2aa0',17,0,i%3?1:2);}
  return add(440,t=>{const r=(t<.55?t/.55:1-(t-.55)/.45*1.0)*9*s;if(r<.3)return;for(let dy=-r;dy<=r;dy+=.66){const w=Math.sqrt(r*r-dy*dy);R(x-w,y+dy,w*2,dot(),'#0c0418');D(x-w,y+dy,'#b07cff');D(x+w,y+dy,'#7a3ad8');}
   for(let i=0;i<8;i++){const a=i/8*6.283-t*7,rr=r+2+((i*3)%4);D(x+Math.cos(a)*rr,y+Math.sin(a)*rr,i%2?'#b07cff':'#e0c8ff');}if(t>.8)burst(x,y,'#b07cff',{size:.8*s,dur:150,rays:6});});},
 '':(x,y,s=1)=>{ring(x,y,'#c8d8ff',{r0:2,r1:13*s,dur:260});return burst(x,y,'#a8c0ff',{size:1.1*s,rays:8});}};
const elem=(el,x,y,s)=>(EL[el]||EL[''])(x,y,s);
/* ---- 飛び道具：矢・魔弾 ---- */
function proj(x0,y0,x1,y1,kind,col,ms){const dx=x1-x0,dy=y1-y0,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
 add(ms,t=>{const px=x0+dx*t,py=y0+dy*t-Math.sin(t*3.14)*(kind==='arrow'?5:2);
  if(kind==='arrow'){for(let i=0;i<9;i++)D(px-ux*i*.66,py-uy*i*.66,i<2?'#ffffff':i>6?col:'#d8c8a0');D(px-ux*5.4,py-uy*5.4-.7,col);for(let i=10;i<20;i+=2)D(px-ux*i*.66,py-uy*i*.66,lit(col,.4));}
  else{for(let r=3;r>=1;r--)for(let a=0;a<8;a++)D(px+Math.cos(a*.785)*r*.6,py+Math.sin(a*.785)*r*.6,r===1?'#ffffff':r===2?lit(col,.5):col);for(let i=1;i<7;i++)D(px-ux*i*1.6+Math.sin(i+t*30)*.6,py-uy*i*1.6+Math.cos(i*2+t*30)*.6,i<3?lit(col,.5):col);}});
 return ANIM.T(ms);}
/* ---- 魔法陣（足元）と魔力の収束 ---- */
function circle(x,y,col='#ffe27a',o={}){const r=o.r||13;return add(o.dur||600,t=>{const g=Math.min(1,t*4),f=t>.82?(Math.floor(t*40)&1):1;if(!f)return;const rr=r*g,n=Math.ceil(rr*4.5),rot=t*3;
  for(let i=0;i<n;i++){const a=i/n*6.283;D(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.32,i%2?col:lit(col,.6));}
  for(let i=0;i<n*.6;i++){const a=i/(n*.6)*6.283;if(i%3===0)continue;D(x+Math.cos(a)*rr*.68,y+Math.sin(a)*rr*.68*.32,col);}
  for(let i=0;i<6;i++){const a=rot+i/6*6.283;D(x+Math.cos(a)*rr*.84,y+Math.sin(a)*rr*.84*.32,'#ffffff',i%2?1:2);const b=a+3.14;R(x+Math.cos(a)*rr*.68,y+Math.sin(a)*rr*.68*.32-(t*10%5),dot(),2,lit(col,.4));}},0,o.delay||0);}
function gather(x,y,col='#ffe27a',n=12,ms=420){for(let i=0;i<n;i++){const a=Math.random()*6.283,r=14+Math.random()*10,l=ms/16.7*(.6+Math.random()*.4);part(x+Math.cos(a)*r,y+Math.sin(a)*r*.8,-Math.cos(a)*r/l,-Math.sin(a)*r*.8/l,i%3?col:'#ffffff',l|0,0,i%4?1:2);}}
/* ---- 回復・補助 ---- */
function heal(x,y,col='#7dffa8'){ring(x,y+10,col,{r0:2,r1:12,sq:.3,dur:420,layer:0});return add(620,t=>{for(let i=0;i<7;i++){const ph=(t*1.5+i*.137)%1,px=x+Math.sin(i*2.4)*9,py=y+8-ph*24;if(ph>.9)continue;const c=i%2?col:'#ffffff';D(px,py,c);if(i%3===0){D(px-.66,py,c);D(px+.66,py,c);D(px,py-.66,c);D(px,py+.66,c);}}});}
function buff(x,y,col='#ffe27a'){return add(520,t=>{for(let i=0;i<5;i++){const px=x+(i-2)*4.4,py=y+8-((t*1.4+i*.19)%1)*22;D(px,py,'#ffffff');D(px-.66,py+.66,col);D(px+.66,py+.66,col);D(px,py+.66,col);D(px,py+1.32,col);}});}
function shield(x,y,col='#ffe9a0'){return add(560,t=>{const r=12,f=t>.7&&(Math.floor(t*30)&1);if(f)return;for(let i=0;i<40;i++){const a=i/40*6.283;if(((i+Math.floor(t*20))%5)===0)continue;D(x+Math.cos(a)*r*.8,y+Math.sin(a)*r,i%2?col:'#ffffff');}for(let d=-5;d<=5;d+=.66)D(x-6+(t*26)%12+d*.3,y+d,'#ffffff');});}
function pillar(x,y,col='#fff3b0'){spray(x,y,10,['#ffffff',col],.7,-.05,34,1);return add(520,t=>{const w=(t<.25?t/.25:1-(t-.25)/.75)*10;if(w>.4){R(x-w/2,y-70,w,80,col);R(x-w/4,y-70,w/2,80,'#ffffff');}});}
return{draw,add,part,spray,clear,slash,thrust,claw,bite,burst,ring,smash,elem,EL,proj,circle,gather,heal,buff,shield,pillar,D,R,lit,get n(){return L.length+PT.length;}};})();
