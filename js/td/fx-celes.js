/* ===== TD：セレスの演出（FXC）。通常攻撃（彗星の光弾）と技 3 種（遅延の砂＝時計の陣・刻の矢＝時計の針の矢 3 連・クロノスロウ＝時計の波）。部品は FXK（fxkit.js）
 時間割（アニメの hit に放出を合わせる。atk の hit＝約 0.36 秒・cast の hit＝約 0.59 秒）：
  通常攻撃：杖先の溜め（hit の 0.2 秒前から光と星の粒が集まる）→ hit：発射の星の閃光 → 彗星（0.09〜0.2 秒・白い芯＋紫の光＋金の星の尾）→ 着弾（白い芯→放射の光線→輪→漂う星の粒）＋敵が 0.06 秒止まって白→紫に染まる。
  技：足元の輪が縮みながら溜まる（hit まで）→ hit：放出。色＝紫（主）＋金（補う）＋青（溜め）＋白（芯）。星臨中は 紺・氷の水色・淡い金。
 ダメージの数字は着弾に合わせて遅らせる（e._dl を view.js が読む）。描くだけで、ロジック（TDS）の結果には触れない */
'use strict';
const FXC=(()=>{
const K=FXK,TAU=K.TAU,cl=K.clamp;
const PAL={m:'#b07aff',c2:'#f2b347',ch:'#9fd8ff',dk:'#6a3fd0',lt:'#e6d6ff'},AW={m:'#7f9cff',c2:'#f2e2a0',ch:'#bfe6ff',dk:'#2a3fa0',lt:'#dbe8ff'};
const pal=u=>u.awT>0?AW:PAL;
/* 杖先（発射・溜めの位置）：向きに応じて前へ */
const MZ={a:[26,56],c:[12,70]};
const mz=(u,k)=>({x:u.x+(u.ox||0)+(u.face||-1)*MZ[k][0],y:u.y-MZ[k][1]});
function ht(u,anim,def){const aw=u.awT>0;let t=null;try{t=TDA.hitT(u.id,aw?'aw_'+anim:anim,aw);if(t==null)t=TDA.hitT(u.id,anim,false);}catch(e){}return t==null?def:t;}
/* 着弾：白い芯 → 放射の光線 → 輪 → 漂う星の粒 */
function impact(x,y,P,big,dl=0){const s=big?1.4:1;
 K.fx({dl,d:.46,draw(g,p,t){
  if(p<.3){const q=1-p/.3;K.bloom(g,x,y,(big?16:12)*q+4,P.lt,.9*q+.1,.3);}
  const e=K.eo(cl(p/.28)),fa=Math.pow(1-p,1.4);
  g.globalCompositeOperation='lighter';
  for(let i=0;i<8;i++){const a=i*TAU/8+.2,long=i%2===0,r0=3+e*6,r1=5+e*(long?26:15)*s;g.globalAlpha=fa*(long?.95:.7);g.strokeStyle=long?P.m:P.c2;g.lineWidth=long?2:1;g.beginPath();g.moveTo(Math.round(x+Math.cos(a)*r0),Math.round(y+Math.sin(a)*r0));g.lineTo(Math.round(x+Math.cos(a)*r1),Math.round(y+Math.sin(a)*r1));g.stroke();
   if(long){g.strokeStyle='#fff';g.lineWidth=1;g.globalAlpha=fa*.8;g.beginPath();g.moveTo(Math.round(x+Math.cos(a)*r0),Math.round(y+Math.sin(a)*r0));g.lineTo(Math.round(x+Math.cos(a)*(r0+(r1-r0)*.55)),Math.round(y+Math.sin(a)*(r0+(r1-r0)*.55)));g.stroke();}}
  const rr=K.eo(cl(p/.5))*(big?32:22);g.globalAlpha=1;K.ring(g,x,y,rr,rr*.62,3*(1-p)+1,P.m,Math.pow(1-p,1.2),'#fff');
  if(p>.12){const r2=K.eo(cl((p-.12)/.5))*(big?22:14);K.ring(g,x,y,r2,r2*.62,1,P.c2,Math.pow(1-p,1.5)*.9);}
  if(p<.35)K.star4(g,x,y,(big?13:9)*(1-p/.35*.4),P.lt,1-p/.35,'#fff');},
  upd(dt,t){if(t-dt<=0){K.stars(x,y,big?7:5,P.c2,{w:10,h:8,d:.85,up:8});K.sparks(x,y,big?10:6,P.m,{sp:95,d:.3});}}});}
/* 通常攻撃 */
function atk(u,f,e,st){const P=pal(u),H=ht(u,'atk',.36),M=mz(u,'a'),T0={x:f.x,y:f.y-14},d=Math.hypot(T0.x-M.x,T0.y-M.y),tf=cl(d/360,.09,.2);
 /* 溜め（hit の 0.2 秒前から） */
 K.fx({d:H,draw(g,p,t){const q=K.sm(cl((t-(H-.22))/.22));if(q<=0)return;K.bloom(g,M.x,M.y,2+q*7,P.ch,.3+.6*q,.3);
  for(let i=0;i<3;i++){const a=t*16+i*2.1,r=20*(1-q)*(1-q)+1;K.dot(g,M.x+Math.cos(a)*r,M.y+Math.sin(a)*r*.8,1+(q>.7?1:0),i?P.ch:P.lt,q);}}});
 /* 発射の閃光（星） */
 K.fx({dl:H,d:.16,draw(g,p){const e2=K.eo(cl(p*3)),a=1-p*p;K.star4(g,M.x,M.y,3+e2*11,P.m,a,'#fff');K.bloom(g,M.x,M.y,9*(1-p)+3,P.c2,a*.8,.2);}});
 /* 彗星の光弾：白い芯・紫の光・金の星の尾 */
 K.fx({dl:H,d:tf+.05,draw(g,p,t){const T={x:f.x,y:f.y-14},q=cl(t/tf),at=k=>{k=cl(k);return{x:M.x+(T.x-M.x)*k,y:M.y+(T.y-M.y)*k-Math.sin(k*Math.PI)*9};};
  for(let i=11;i>=0;i--){const k=q-i*.05;if(k<0)continue;const o=at(k),r=(1-i/12)*6+1.2,col=i<2?P.lt:i<6?P.m:P.dk,a=(1-i/12)*.8;K.glow(g,o.x,o.y,r*2,col,a*.55);if(i%2===0)K.dot(g,o.x,o.y,Math.max(1,r*.55),col,a);}
  const h=at(q),ha=1-cl((t-tf)/.05);K.bloom(g,h.x,h.y,8,P.m,ha,.3);K.star4(g,h.x,h.y,4+Math.sin(t*40),P.c2,ha*.9,'#fff');},
  upd(dt,t){if(t<tf){const q=cl(t/tf),x=M.x+(f.x-M.x)*q,y=M.y+(f.y-14-M.y)*q;K.stars(x,y,1,P.c2,{w:2,h:2,d:.4,up:2,v:.6});}}});
 impact(f.x,f.y-14,P,!!e.cr,H+tf);
 K.hit(f,st,{dl:H+tf,c:P.m,stop:.06});
 return H+tf;}
/* 技の予告：足元の輪が縮みながら溜まる → hit で外へ放つ。杖先に青い溜めと星の粒、放出の星の閃光 */
function prelude(u,P,H){const M=mz(u,'c');
 K.fx({layer:'back',d:H+.3,draw(g,p,t){const ux=u.x+(u.ox||0),uy=u.y+1;
  if(t<=H){const q=t/H,rx=32*(1-.42*K.ei(q)),a=.3+.6*q;K.ring(g,ux,uy,rx,rx*.42,2,P.m,a,q>.6?'#fff':null);
   const n=12;g.globalCompositeOperation='lighter';for(let i=0;i<n;i++){const an=i*TAU/n+t*1.6;K.dot(g,ux+Math.cos(an)*rx*.8,uy+Math.sin(an)*rx*.8*.42,i%3?1:2,P.c2,a);}}
  else{const r=cl((t-H)/.3),rr=14+K.eo(r)*36;K.ring(g,ux,uy,rr,rr*.42,3*(1-r)+1,P.c2,1-r,'#fff');}}});
 K.fx({d:H+.18,draw(g,p,t){if(t<=H){const q=K.sm(t/H);K.bloom(g,M.x,M.y,2+q*9,P.ch,.25+.65*q,.3);
   for(let i=0;i<4;i++){const a=t*10+i*TAU/4,r=24*(1-q)*(1-q)+1;K.dot(g,M.x+Math.cos(a)*r,M.y+Math.sin(a)*r*.8,i%2?1:2,i%2?P.ch:P.lt,.4+.6*q);}}
   else{const r=cl((t-H)/.18);K.star4(g,M.x,M.y,3+K.eo(r*3)*13,P.m,1-r*r,'#fff');K.bloom(g,M.x,M.y,10*(1-r)+3,P.c2,(1-r)*.8,.2);}},
  upd(dt,t){if(t<H&&Math.random()<dt*14){const ux=u.x+(u.ox||0),a=Math.random()*TAU;K.p({k:'star',x:ux+Math.cos(a)*18,y:u.y-2,vx:-Math.cos(a)*10,vy:-rnd(20,40),d:.5,c:Math.random()<.3?'#fff':P.c2,s:1,ph:Math.random()*9});}}});}
const rnd=K.rnd;
/* 遅延の砂・加速の刻（slow）：敵の足元に地面に沿った楕円の時計の陣。縁が残り時間で減る・回る針・砂がらせんで降る・遅くなった敵に小さな時計 */
function field(u,f,sk,P,H,st,haste){const T={x:f.x,y:f.y},R=sk.r||70,dur=sk.dur||6,c1=haste?P.ch:P.m,spd=haste?2.6:1.1;
 const zOf=()=>st.fields.find(z=>z.u===u&&Math.abs(z.x-T.x)<.6&&Math.abs(z.y-T.y)<.6);
 K.fx({layer:'back',dl:H,d:dur+.6,draw(g,p,t,e){const z=zOf();if(!z&&t>.3){e.t=e.d;return;}const rem=z?z.t:0,fr=cl(rem/dur),a=cl(rem/.5),op=K.eo(cl(t/.2));if(a<=0)return;const rx=R*op,ry=rx*.42;
  g.save();g.translate(T.x,T.y);g.scale(1,.42);K.glow(g,0,0,rx*1.08,c1,.34*a);g.restore();
  K.ring(g,T.x,T.y,rx,ry,1,c1,.35*a);g.globalCompositeOperation='lighter';
  g.strokeStyle=P.c2;g.lineWidth=2;g.globalAlpha=.95*a;g.beginPath();g.ellipse(T.x,T.y,rx,ry,0,-Math.PI/2,-Math.PI/2+fr*TAU);g.stroke();g.globalAlpha=.25*a;g.lineWidth=5;g.stroke();
  g.globalAlpha=a;for(let i=0;i<12;i++){const an=i*TAU/12-Math.PI/2,c=Math.cos(an),s=Math.sin(an),big=i%3===0;g.strokeStyle=big?'#fff':P.c2;g.lineWidth=1;g.globalAlpha=a*(big?.95:.7);g.beginPath();g.moveTo(Math.round(T.x+c*rx*(big?.8:.86)),Math.round(T.y+s*ry*(big?.8:.86)));g.lineTo(Math.round(T.x+c*rx*.95),Math.round(T.y+s*ry*.95));g.stroke();}
  g.setLineDash([3,4]);g.lineDashOffset=t*8;g.globalAlpha=.4*a;g.strokeStyle=c1;g.lineWidth=1;g.beginPath();g.ellipse(T.x,T.y,rx*.62,ry*.62,0,0,TAU);g.stroke();g.setLineDash([]);
  const ang=-Math.PI/2+t*spd+3.5*(1-K.eo(cl(t/.9))),hr=-Math.PI/2+t*spd/12;g.lineCap='round';
  for(const[an,L,w,c]of[[hr,.5,2,P.c2],[ang,.8,2,P.c2]]){const x=T.x+Math.cos(an)*rx*L,y=T.y+Math.sin(an)*ry*L;g.globalAlpha=a;g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.moveTo(T.x,T.y);g.lineTo(x,y);g.stroke();g.strokeStyle='#fff';g.lineWidth=1;g.beginPath();g.moveTo(T.x,T.y);g.lineTo(x,y);g.stroke();}
  g.lineCap='butt';K.dot(g,T.x,T.y,3,'#fff',a);
  if(t<.25){const q=t/.25;K.ring(g,T.x,T.y,R*(1+.18*(1-q)),R*.42*(1+.18*(1-q)),2,'#fff',(1-q)*.8);}}});
 K.fx({dl:H,d:dur+.6,draw(g,p,t,e){const z=zOf();if(!z&&t>.3)return;const rem=z?z.t:0,a=cl(rem/.5),op=K.eo(cl(t/.2));if(a<=0)return;
  g.globalCompositeOperation='lighter';
  for(let i=0;i<16;i++){const ph=(t*.8+i/16)%1,an=ph*TAU*1.6+i*1.7,r=R*.78*op*(1-ph*.85),hh=46*(1-ph*ph),x=T.x+Math.cos(an)*r,y=T.y+Math.sin(an)*r*.42-hh,fa=Math.min(1,ph*8)*(1-Math.pow(ph,6))*a;
   K.glow(g,x,y,3,P.c2,fa*.5);K.dot(g,x,y,i%4===0?2:1,i%5===0?'#fff':P.c2,fa);}
  const ex=cl((t-.15)/.2);for(const m of st.foes){if(m.hp<=0||Math.hypot(m.x-T.x,m.y-T.y)>R)continue;const my=m.y-(m.boss?84:46)-Math.sin(t*3+m.uid)*1.5,mx=Math.round(m.x),r=m.boss?8:5;
   g.globalAlpha=ex*a;g.strokeStyle=P.c2;g.lineWidth=1;g.beginPath();g.arc(mx,Math.round(my),r,0,TAU);g.stroke();K.glow(g,mx,my,r*1.8,P.c2,.3*ex*a);
   g.strokeStyle='#fff';g.beginPath();g.moveTo(mx,my);g.lineTo(Math.round(mx+Math.cos(-t*3+m.uid)*r*.8),Math.round(my+Math.sin(-t*3+m.uid)*r*.8));g.moveTo(mx,my);g.lineTo(mx,my-r*.5);g.stroke();K.dot(g,mx,my-r-3,1,P.c2,ex*a);}},
  upd(dt,t){if(t-dt<=0){for(let i=0;i<12;i++){const an=i*TAU/12;K.p({k:'star',x:T.x+Math.cos(an)*R*.9,y:T.y+Math.sin(an)*R*.9*.42,vx:Math.cos(an)*14,vy:-rnd(14,30),d:.7,c:i%3?P.c2:'#fff',s:1,ph:i});}}}});
 return 0;}
/* 刻の矢（strike）：時計の針の形の光の矢が、だんだん速く 3 連 */
function hand(g,x,y,a,len,P,al){g.save();g.translate(x,y);g.rotate(a);g.globalCompositeOperation='lighter';g.globalAlpha=al;
 g.fillStyle=P.c2;g.beginPath();g.moveTo(0,0);g.lineTo(-6,-2.4);g.lineTo(-len+4,-1);g.lineTo(-len,0);g.lineTo(-len+4,1);g.lineTo(-6,2.4);g.closePath();g.fill();
 g.strokeStyle=P.m;g.lineWidth=1;g.globalAlpha=al*.9;g.beginPath();g.arc(-len+1,0,2.4,0,TAU);g.stroke();
 g.strokeStyle='#fff';g.globalAlpha=al;g.lineWidth=1;g.beginPath();g.moveTo(-1,0);g.lineTo(-len*.72,0);g.stroke();g.restore();}
function arrows(u,f,sk,P,H,st){const M=mz(u,'c'),L=[0,.2,.32],TF=[.17,.13,.1];
 L.forEach((l,i)=>{const tf=TF[i];
  K.fx({dl:H+l,d:tf+.1,draw(g,p,t){const T={x:f.x,y:f.y-14},q=cl(t/tf),at=k=>({x:M.x+(T.x-M.x)*cl(k),y:M.y+(T.y-M.y)*cl(k)-Math.sin(cl(k)*Math.PI)*12}),an=k=>{const a=at(k-.03),b=at(k+.03);return Math.atan2(b.y-a.y,b.x-a.x);};
   const fa=1-cl((t-tf)/.08);for(let j=3;j>=0;j--){const k=q-j*.07;if(k<0)continue;const o=at(k);hand(g,o.x,o.y,an(k),24-j*2,P,fa*(j?.28/j:1));}
   const h=at(q);K.bloom(g,h.x,h.y,9,P.m,fa,.25);},
   upd(dt,t){if(t<tf){const q=cl(t/tf);K.stars(M.x+(f.x-M.x)*q,M.y+(f.y-14-M.y)*q,1,P.c2,{w:2,h:2,d:.35,up:2,v:.5});}}});
  impact(f.x,f.y-14,P,i===2,H+l+tf);
  K.hit(f,st,{dl:H+l+tf,c:P.m,stop:i===2?.08:.045});});
 const D=H+L[2]+TF[2];
 /* 3 本目の着弾：背後に時計の文字盤が一瞬 */
 K.fx({dl:D,d:.5,draw(g,p,t){const x=f.x,y=f.y-16,r=K.eo(cl(p*4))*16,a=Math.pow(1-p,1.3);K.ring(g,x,y,r,r,2,P.c2,a,'#fff');g.globalCompositeOperation='lighter';
  for(let i=0;i<12;i++){const an=i*TAU/12-Math.PI/2;K.dot(g,x+Math.cos(an)*r*.82,y+Math.sin(an)*r*.82,i%3?1:2,P.c2,a*K.eo(cl(p*5)));}
  const hh=-Math.PI/2+p*TAU*.6;g.strokeStyle='#fff';g.globalAlpha=a;g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(Math.round(x+Math.cos(hh)*r*.7),Math.round(y+Math.sin(hh)*r*.7));g.stroke();}});
 return D;}
/* クロノスロウ（nova・敵の足元）：時計の波。逆回りの輪が広がり、針が巻き戻る */
function wave(u,f,sk,P,H,st){const x=f.x,y=f.y,R=sk.r||56;
 K.fx({layer:'back',dl:H,d:.7,draw(g,p,t){const e=K.eo(cl(p/.35)),fa=Math.pow(1-p,1.2);K.ring(g,x,y,R*e,R*e*.42,3*(1-p)+1,P.m,fa,'#fff');K.ring(g,x,y,R*.7*K.eo(cl((p-.08)/.35)),R*.7*K.eo(cl((p-.08)/.35))*.42,1,P.c2,fa);
  g.globalCompositeOperation='lighter';for(let i=0;i<12;i++){const an=i*TAU/12-p*5;K.dot(g,x+Math.cos(an)*R*e*.9,y+Math.sin(an)*R*e*.9*.42,i%3?1:2,P.c2,fa);}
  const hh=-Math.PI/2-(1-K.eo(cl(p/.6)))*TAU;g.strokeStyle='#fff';g.globalAlpha=fa;g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(Math.round(x+Math.cos(hh)*R*.6*e),Math.round(y+Math.sin(hh)*R*.6*e*.42));g.stroke();}});
 K.fx({dl:H,d:.3,draw(g,p){K.bloom(g,x,y-8,16*(1-p)+4,P.lt,1-p,.3);K.star4(g,x,y-8,6+K.eo(p*3)*16,P.m,1-p,'#fff');}});
 return H;}
function cast(u,e,st){const sk=e.sk,f=e.f;if(!f||!sk)return null;if(!(sk.k==='slow'||sk.k==='strike'||sk.k==='nova'))return null;
 const P=pal(u),H=ht(u,'cast',.59);prelude(u,P,H);u._skK=sk.k;
 let dl=0;if(sk.k==='slow')dl=field(u,f,sk,P,H,st,sk.id==='kasoku');else if(sk.k==='strike')dl=arrows(u,f,sk,P,H,st);else dl=wave(u,f,sk,P,H,st);
 u._skDl=dl;u._skT=st.t;return dl;}
/* 技の命中（sk）：strike は cast 側で反応を出してあるので数字の遅れだけ。nova は敵ごとに小さな着弾 */
function skHit(u,f,e,st){if(u._skDl==null||st.t-u._skT>.05)return 0;const dl=u._skDl;if(u._skK==='nova'){const P=pal(u);K.hit(f,st,{dl,c:P.m,stop:.06});impact(f.x,f.y-14,P,false,dl);}return dl;}
return{atk,cast,skHit};})();
