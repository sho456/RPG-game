/* ===== TD：セレスの星臨に入る演出と奥義「刻の巻き戻し」（FXU）。部品は FXK（fxkit.js）。fx.js の celesAw/celesUlt・cultB/cultF を置き換えた =====
 星臨（TDA の aw_in：0〜.99 秒＝溜め・.99〜1.38 秒＝白いシルエット・〜1.86 秒＝星臨の姿）：
  足元に時計の陣（金の縁が走る・星の六芒）→ 星がらせんで昇り胸に光が集まる → シルエットの瞬間に光の柱・星の閃光・輪 3 重 → 姿が現れたら星の粒が降って消える。星臨中は足元に小さな星の陣を薄く。
 奥義（アニメの hit＝H）：段ごとに主役 1 つ。溜め→空の高みの時計（12 の刻み・12 の星）→巻き戻し→静寂→長針の光の槍（敵の密集へ）→白飛び・柱・輪 2 つ→欠片と星の雨。暗転は背景だけ（back 層）。
 描くだけで、ロジック（TDS）の結果には触れない */
'use strict';
const FXU=(()=>{
const K=FXK,TAU=K.TAU,cl=K.clamp,sm=K.sm,rnd=K.rnd;
const G='#f2b347',GL='#fff0b8',BL='#9fd8ff',BD='#7f9cff',VI='#8a5cff',W='#ffffff';
const FH=()=>typeof TDD!=='undefined'?TDD.K.FH:420;
const rgba=(c,a)=>{const n=parseInt(c.slice(1),16);return`rgba(${n>>16},${n>>8&255},${n&255},${a})`;};
let cur=null;
function reset(){cur=null;}
function shk(){if(!cur)return 0;const q=cur.t-cur.H;return q>=0&&q<.4?8*(1-q/.4)*(1-q/.4):0;}
/* 縦の光の柱：下（y1）が濃く上へ透ける。段になった太さ（外の色・中・白い芯） */
function column(g,x,y0,y1,w,c1,c2,a){if(a<=.01||y1-y0<2)return;const o=g.globalCompositeOperation;g.globalCompositeOperation='lighter';
 for(const[k,c,aa]of[[1,c1,.32],[.55,c2,.65],[.2,W,.95]]){const gr=g.createLinearGradient(0,y0,0,y1);gr.addColorStop(0,rgba(c,0));gr.addColorStop(.75,rgba(c,aa*a));gr.addColorStop(1,rgba(c,aa*a));g.fillStyle=gr;const ww=Math.max(1,Math.round(w*k));g.fillRect(Math.round(x-ww/2),y0,ww,y1-y0);}
 g.globalCompositeOperation=o;}
/* 光の糸：加算の細い帯 3 層（広い淡い・中・芯） */
function thread(g,x0,y0,x1,y1,col,a){const o=g.globalCompositeOperation;g.globalCompositeOperation='lighter';g.lineCap='round';const al=g.globalAlpha;
 for(const[w,c,aa]of[[5,col,.1],[2,col,.28],[1,'#e8f2ff',.7]]){g.globalAlpha=al*a*aa;g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();}
 g.globalAlpha=al;g.lineCap='butt';g.globalCompositeOperation=o;}
/* 走る縁：上から時計回りに sw（0〜1）まで。先頭に光 */
function arcRing(g,x,y,rx,ry,w,col,a,sw,core){if(sw<=.004||a<=.01)return;const o=g.globalCompositeOperation,al=g.globalAlpha,lw=g.lineWidth,s0=-Math.PI/2,e=s0+TAU*Math.min(1,sw);g.globalCompositeOperation='lighter';
 for(const[ww,c,aa]of(core?[[w+4,col,.17],[w,col,1],[1,core,.85]]:[[w+4,col,.17],[w,col,1]])){g.strokeStyle=c;g.lineWidth=ww;g.globalAlpha=al*a*aa;g.beginPath();g.ellipse(x,y,rx,ry,0,s0,e,false);g.stroke();}
 g.globalCompositeOperation=o;g.globalAlpha=al;g.lineWidth=lw;if(sw<1)K.bloom(g,x+Math.cos(e)*rx,y+Math.sin(e)*ry,4+w,col,a,.3);}
/* 先の細い光線（放射） */
function ray(g,x,y,a,r0,r1,w,col,al){const c=Math.cos(a),s=Math.sin(a),px=-s*w,py=c*w;g.globalAlpha=al;g.fillStyle=col;g.beginPath();g.moveTo(x+c*r0+px,y+(s*r0+py)*.6);g.lineTo(x+c*r1,y+s*r1*.6);g.lineTo(x+c*r0-px,y+(s*r0-py)*.6);g.closePath();g.fill();}
/* ====================== 星臨に入る ====================== */
function aw(u,st){const id=u.id,X=()=>u.x+(u.ox||0),Y=()=>u.y;let tw=.99,te=1.38,du=1.86;
 try{tw=TDA.at(id,'aw_in',12)||tw;te=TDA.at(id,'aw_in',17)||te;du=TDA.dur(id,'aw_in')||du;}catch(e){}
 const R0=34;
 /* 時計の陣（足元・金の太い縁）：縁が走る → 星の六芒が回る → 光の柱の瞬間に脈打ち、姿が出たら消える */
 K.fx({layer:'back',d:du+.4,draw(g,p,t){const fo=t<te?1:1-sm(cl((t-te)/(du+.4-te)));if(fo<=.01)return;const x=X(),y=Y()+1,pu=1+.1*sm(t/tw)+.12*K.eo(cl((t-tw)/.2))*(1-cl((t-tw)/.5)),rx=R0*pu,ry=rx*.42,dr=K.eo(cl(t/.4));
  g.save();g.translate(x,y);g.scale(1,.42);K.glow(g,0,0,rx*1.1,'#2a3fa0',.5*dr*fo);K.glow(g,0,0,rx*.9,BL,.16*dr*fo*(1+sm(t/tw)));g.restore();
  arcRing(g,x,y,rx,ry,2,G,fo,dr,GL);arcRing(g,x,y,rx*.8,ry*.8,1,BD,fo*.85,K.eo(cl((t-.08)/.4)),null);
  g.globalCompositeOperation='lighter';for(let i=0;i<12;i++){const an=i*TAU/12-Math.PI/2;if(i/12>dr)break;K.dot(g,x+Math.cos(an)*rx*.93,y+Math.sin(an)*ry*.93,i%3?1:2,i%3?G:W,fo);}
  const rot=t*.9,pts=[];for(let i=0;i<6;i++){const an=rot+i*TAU/6;pts.push([x+Math.cos(an)*rx*.7,y+Math.sin(an)*ry*.7]);}
  const sq=K.eo(cl((t-.25)/.35));if(sq>0){for(let i=0;i<6;i++){const a=pts[i],b=pts[(i+2)%6];thread(g,a[0],a[1],a[0]+(b[0]-a[0])*sq,a[1]+(b[1]-a[1])*sq,BL,fo*.8);}
   for(let i=0;i<6;i++)K.star4(g,pts[i][0],pts[i][1],i%2?2:3,i%2?BL:GL,fo*sq);}
  K.bloom(g,x,y,5+4*sm(t/tw),BL,fo*.7,.3);}});
 /* 星のらせん（足元→胸）と胸に集まる光 → シルエットの瞬間に消える */
 K.fx({d:tw+.1,draw(g,p,t){const x=X(),y=Y(),ramp=sm(cl(t/.3)),fo=1-sm(cl((t-(tw-.12))/.22)),A=ramp*fo,q=sm(cl(t/tw));if(A<=.01)return;g.globalCompositeOperation='lighter';
  for(let s=0;s<3;s++)for(let i=0;i<14;i++){const ph=((i/14+t*(.8+1.5*q)+s/3)%1),an=ph*TAU*1.5+s*2.1,r=26*(1-ph*.8)+3,yy=y-4-ph*66;const a=A*Math.min(1,ph*6)*(1-ph*ph);
   if(i%4===0)K.star4(g,x+Math.cos(an)*r,yy+Math.sin(an)*r*.3,2+(s?0:1),s?BL:GL,a);else{K.glow(g,x+Math.cos(an)*r,yy+Math.sin(an)*r*.3,3,s?BL:GL,a*.5);K.dot(g,x+Math.cos(an)*r,yy+Math.sin(an)*r*.3,1,s?BL:W,a);}}
  K.bloom(g,x,y-34,3+15*K.ei(q),BL,(.15+.75*K.ei(q))*fo,.3);}});
 /* 光の柱・星の閃光・輪 3 重（シルエットの瞬間） */
 K.fx({dl:tw,d:.8,draw(g,p,t){const x=X(),y=Y(),q=cl(t/.55),a=Math.pow(1-q,1.1);
  column(g,x,y-170,y,18*(1-q*.8)+3,BL,GL,a);
  if(q<1){K.bloom(g,x,y-34,30*(1-q*.5)+8,GL,a,.28);K.star4(g,x,y-34,36*(1-q*.55)+4,BL,a,W);}
  const cols=[W,G,BL],mx=[70,52,40];for(let i=0;i<3;i++){const qq=cl((t-i*.07)/.7);if(qq<=0||qq>=1)continue;const r=K.eo(cl(qq/.4))*mx[i];K.ring(g,x,y+1,r,r*.42,3-i*.7,cols[i],Math.pow(1-qq,2),i?null:W);}},
  upd(dt,t){if(t-dt<=0){K.sparks(X(),Y()-34,24,BL,{sp:120,d:.45,gr:50});K.stars(X(),Y()-40,10,GL,{w:14,h:18,up:14,d:.9,s:1.3});}}});
 /* 姿が現れたら星の粒が降って消える */
 K.fx({dl:te-.12,d:du-te+.9,upd(dt,t){if(t<.7&&Math.random()<dt*34){const x=X()+rnd(-18,18);K.p({k:'star',x,y:Y()-rnd(64,84),vx:rnd(-5,5),vy:rnd(14,40),gr:40,d:rnd(.5,.9),c:Math.random()<.35?W:GL,s:1.1,ph:Math.random()*9});}},draw(){}});
 /* 星臨中：足元にゆっくり回る小さな星の陣（薄く） */
 K.fx({layer:'back',dl:Math.max(0,du-.3),d:Math.max(1,u.awT||1),draw(g,p,t,e){if(!(u.awT>0)||!st.units.includes(u)){e.t=e.d;return;}const x=X(),y=Y()+1,a=sm(cl(t/.5))*.5*cl(u.awT/.6);
  K.ring(g,x,y,19,19*.42,1,GL,a*.45);g.globalCompositeOperation='lighter';for(let i=0;i<6;i++){const an=t*.7+i*TAU/6;K.dot(g,x+Math.cos(an)*19,y+Math.sin(an)*19*.42,i%2?1:2,i%2?BL:GL,a);}}});}
/* ====================== 奥義 ====================== */
/* 段ごとに主役を 1 つ：溜め（光が胸へ吸い込まれる）→ 天空の時計（空の高みに太い金の円・12 の星・12 の刻み）→ 巻き戻し（長針・短針が逆回り）
   → 静寂（いちばん暗い）→ 長針が光の槍になって敵の密集へ落ちる → 刺さる瞬間（白飛び・太い柱・輪 2 つ・揺れ）→ 余韻（時計が砕けて欠片が降る・ゆっくりの星の雨・背景は長く戻る） */
function ult(e,st,B){const u=e.u;let H=1.8;try{H=TDA.hitT(u.id,0,u.awT>0)||1.8;}catch(x){}H=cl(H,.9,2.6);
 const vw=()=>B.vw(),cam=()=>B.cam(),C=()=>{const R=Math.min(vw()*.24,70);return{x:cam()+vw()/2,y:R+36,R};},ux=()=>u.x+(u.ox||0),uy=()=>u.y;
 const tq=H-.2,s0=-Math.PI/2;
 /* 槍の落ちる先：見えている範囲でいちばん敵が密集している所（近くの敵 60px 以内の数が最大の敵とその仲間の中心） */
 const vis=st.foes.filter(f=>f.hp>0&&f.x>cam()+8&&f.x<cam()+vw()-8);let T={x:cam()+vw()/2,y:uy()};
 if(vis.length){let bn=-1,bd=1e9;for(const f of vis){const nb=vis.filter(g=>Math.abs(g.x-f.x)<60&&Math.abs(g.y-f.y)<70),d=Math.abs(f.x-(cam()+vw()/2));if(nb.length>bn||(nb.length===bn&&d<bd)){bn=nb.length;bd=d;T={x:nb.reduce((a,g)=>a+g.x,0)/nb.length,y:nb.reduce((a,g)=>a+g.y,0)/nb.length};}}}
 const hx=T.x,hy=T.y,c0=C(),aT=Math.atan2(hy-8-c0.y,hx-c0.x);
 cur=K.fx({d:H+2,draw(){}});cur.H=H;u._ultT=st.t;u._ultH=H;
 /* --- 背景の暗転（back）：紺へ → 静寂でいちばん暗い → 槍の刺さる瞬間から長くゆっくり戻る --- */
 K.fx({layer:'back',d:H+1.3,draw(g,p,t){const t1=H*.55;let a=.5*sm(cl(t/(H*.22)))+.32*sm(cl((t-t1)/(tq-t1)));if(t>H)a*=1-sm(cl((t-H)/1.15));if(a<=.005)return;
  const x0=cam()-4,w=vw()+8,h=FH();g.globalAlpha=a;g.fillStyle='#03061c';g.fillRect(x0,0,w,h);
  if(t>H*.78&&t<=H){g.globalAlpha=.22*sm(cl((t-H*.78)/.15));g.fillStyle='#160d38';g.fillRect(x0,0,w,h);}g.globalAlpha=1;}});
 /* --- ① 溜め：太い光の筋が胸へ吸い込まれる（10 本） --- */
 K.fx({d:H*.3,draw(g,p,t){const x=ux(),y=uy()-30,tc=H*.3,A=sm(cl(t/.1))*(1-sm(cl((t-tc*.75)/(tc*.25))));if(A<=.01)return;g.globalCompositeOperation='lighter';g.lineCap='round';
  for(let i=0;i<10;i++){const an=i*TAU/10+.3,ph=((t*1.8+i*.37)%1),r1=95*(1-ph)+8,r0=r1+26*(1-ph*.5),a=A*Math.min(1,ph*5)*(.4+.6*ph),X1=x+Math.cos(an)*r1,Y1=y+Math.sin(an)*r1*.7,X0=x+Math.cos(an)*r0,Y0=y+Math.sin(an)*r0*.7;
   g.globalAlpha=a*.35;g.strokeStyle=BL;g.lineWidth=4;g.beginPath();g.moveTo(X0,Y0);g.lineTo(X1,Y1);g.stroke();g.globalAlpha=a;g.strokeStyle=GL;g.lineWidth=2;g.beginPath();g.moveTo(X0,Y0);g.lineTo(X1,Y1);g.stroke();}
  g.lineCap='butt';g.globalAlpha=1;K.bloom(g,x,y,4+14*K.ei(cl(t/tc)),BL,.2+.7*K.ei(cl(t/tc)),.3);
  if(t<.25){const q=t/.25;K.ring(g,x,uy()+1,16+q*34,(16+q*34)*.42,2,BL,1-q,W);}}});
 /* --- ② 天空の時計（back）：太い金の円が走る → 12 の刻み → 12 の星が順に灯る。星座の線は無し --- */
 const clockA=t=>{const fo=t>H?1-cl((t-H)/.2):1;return fo<=0?0:fo*(1-.65*sm(cl((t-(H*.78))/(tq-H*.78+.01))));};
 K.fx({layer:'back',d:H+.4,draw(g,p,t){const c=C(),R=c.R,fa=clockA(t),t0=H*.22;if(t<t0*.9||fa<=.01)return;const q=t-t0,sw=K.eo(cl(q/.3)),face=sm(cl(q/.4));
  K.glow(g,c.x,c.y,R*1.7,'#2a3fa0',.5*face*fa);K.glow(g,c.x,c.y,R*.9,'#5a46c8',.18*face*fa);
  arcRing(g,c.x,c.y,R,R,4,G,fa,sw,GL);
  g.globalCompositeOperation='lighter';g.lineCap='butt';
  for(let i=0;i<12;i++){if(i/12>sw)break;const an=s0+i*TAU/12,m=i%3===0,r0=R*(m?.76:.84),r1=R*.95,cs=Math.cos(an),sn=Math.sin(an);g.globalAlpha=fa;g.strokeStyle=m?W:G;g.lineWidth=m?4:3;g.beginPath();g.moveTo(c.x+cs*r0,c.y+sn*r0);g.lineTo(c.x+cs*r1,c.y+sn*r1);g.stroke();}
  g.globalAlpha=1;
  for(let i=0;i<12;i++){const k=cl((q-.12-i*.025)/.18);if(k<=0)continue;const an=s0+i*TAU/12,sc=k<.6?k/.6*1.3:1.3-.3*(k-.6)/.4,big=i%3===0,r=R*.58;K.bloom(g,c.x+Math.cos(an)*r,c.y+Math.sin(an)*r,(big?8:5)*sc,big?W:GL,fa*.7,0);K.star4(g,c.x+Math.cos(an)*r,c.y+Math.sin(an)*r,(big?7:4)*sc,big?W:GL,fa);}
  /* ③ 巻き戻し：長針（槍の向きで止まる）と短針が逆回り。残像は 2 本 */
  const r0=H*.5,r1=H*.8,hv=sm(cl((t-t0-.15)/.2)),rw=t=>sm(cl((t-r0)/(r1-r0))),ang=(t,k)=>aT+TAU*k*(1-rw(t)),hand=(an,L,w,col,a)=>{if(a<=.01)return;const ex=c.x+Math.cos(an)*R*L,ey=c.y+Math.sin(an)*R*L;g.globalCompositeOperation='lighter';g.lineCap='round';
   g.globalAlpha=a*.25;g.strokeStyle=col;g.lineWidth=w+4;g.beginPath();g.moveTo(c.x,c.y);g.lineTo(ex,ey);g.stroke();g.globalAlpha=a;g.lineWidth=w;g.beginPath();g.moveTo(c.x,c.y);g.lineTo(ex,ey);g.stroke();g.globalAlpha=a*.9;g.strokeStyle=W;g.lineWidth=Math.max(1,w-4);g.beginPath();g.moveTo(c.x,c.y);g.lineTo(ex,ey);g.stroke();g.lineCap='butt';g.globalAlpha=1;};
  if(hv>0&&t<tq){const mid=t>r0&&t<r1;if(mid)for(let k=2;k>=1;k--)hand(ang(t-k*.045,1.5),.82,5,BL,fa*hv*.3/k);
   hand(ang(t,1.5),.82,6,GL,fa*hv);hand(ang(t,.75)+.6,.5,7,G,fa*hv);}
  const gm=sm(cl((t-t0-.2)/.15)),fl=t>tq?1-cl((t-tq)/.25):1;K.bloom(g,c.x,c.y,6+5*gm+(t>tq&&t<=H?8*fl:0),t>tq?W:GL,fa*gm*.9,.35);K.diamond(g,c.x,c.y,3,W,fa*gm);}});
 /* --- ⑤ 光の槍：長針が離れ、敵の密集へ一直線（だんだん速く・尾を引く） --- */
 K.fx({dl:tq,d:H-tq+.02,draw(g,p,t){const c=C(),R=c.R,q=cl(t/(H-tq)),k=q*q,sx=c.x+Math.cos(aT)*R*.82,sy=c.y+Math.sin(aT)*R*.82,tx=hx,ty=hy-8,x=sx+(tx-sx)*k,y=sy+(ty-sy)*k,an=Math.atan2(ty-sy,tx-sx),dist=Math.hypot(x-sx,y-sy),TL=Math.min(dist,150),L=60;
  g.save();g.translate(sx,sy);g.rotate(an);g.globalCompositeOperation='lighter';
  const trail=(w,col,a)=>{const gr=g.createLinearGradient(dist-TL,0,dist,0);gr.addColorStop(0,rgba(col,0));gr.addColorStop(1,rgba(col,a));g.fillStyle=gr;g.beginPath();g.moveTo(dist-TL,0);g.lineTo(dist,-w);g.lineTo(dist,w);g.closePath();g.fill();};
  trail(9,G,.5);trail(4,W,.8);g.translate(dist,0);
  const poly=(l,w,col,a)=>{g.globalAlpha=a;g.fillStyle=col;g.beginPath();g.moveTo(8,0);g.lineTo(-l*.2,-w);g.lineTo(-l,-w*.3);g.lineTo(-l,w*.3);g.lineTo(-l*.2,w);g.closePath();g.fill();};
  poly(L*1.05,9,G,.55);poly(L,6,GL,.9);poly(L*.85,2.5,W,1);g.restore();g.globalAlpha=1;
  K.bloom(g,x,y,10+8*q,GL,1,.3);K.star4(g,x,y,8+10*q,W,1,W);}});
 /* --- 着弾：白飛び 0.08 秒・太い 1 本の柱・輪 2 つ（速く大きい／遅い）・星 1 つ --- */
 K.fx({dl:H,d:.08,draw(g,p){g.globalAlpha=.9*(1-p);g.fillStyle='#fffbe8';g.fillRect(cam()-4,-4,vw()+8,FH()+8);g.globalAlpha=1;}});
 K.fx({dl:H,d:1.1,draw(g,p,t){const q=cl(t/.7),a=Math.pow(1-q,.9);
  K.glow(g,hx,hy-12,Math.min(vw(),190)*.6,GL,.5*Math.pow(1-cl(t/.5),2));
  column(g,hx,-10,hy,46*(1-q)+6,G,GL,a);
  if(q<1){K.bloom(g,hx,hy-10,36*(1-q*.6)+8,GL,a,.3);K.star4(g,hx,hy-10,60*(1-q*.6)+6,W,a,W);}
  const q1=cl(t/.7),r1=K.eo(cl(q1/.35))*Math.min(vw()*.6,225);if(q1<1)K.ring(g,hx,hy+1,r1,r1*.28,5,W,Math.pow(1-q1,2),G);
  const q2=cl((t-.08)/1.0),r2=K.eoc(q2)*120;if(q2>0&&q2<1)K.ring(g,hx,hy+1,r2,r2*.28,3,G,Math.pow(1-q2,1.5),null);},
  upd(dt,t){if(t-dt<=0){K.sparks(hx,hy-10,16,G,{sp:170,d:.5,gr:110});K.stars(hx,hy-10,6,GL,{w:26,h:12,up:20,d:1.1,s:1.7});}}});
 /* --- ⑥ 余韻：時計が砕けて大きな欠片がゆっくり降る（12 枚） --- */
 const SH=[];for(let i=0;i<12;i++){const an=s0+(i+rnd(-.3,.3))*TAU/12,k=rnd(.35,.95);SH.push({an,k,vx:Math.cos(an)*rnd(8,26),vy:rnd(6,22),rot:rnd(0,6),vr:rnd(-2.2,2.2),s:rnd(5,9),c:i%3?G:GL});}
 K.fx({dl:H,d:1.7,draw(g,p,t){const c=C(),fa=1-cl((t-.9)/.8);if(fa<=.01)return;g.globalCompositeOperation='lighter';
  const f0=cl(t/.12);if(f0<1){arcRing(g,c.x,c.y,c.R*(1+t*.8),c.R*(1+t*.8),4,GL,1-f0,1,null);}
  for(const s of SH){const x=c.x+Math.cos(s.an)*c.R*s.k+s.vx*t,y=c.y+Math.sin(s.an)*c.R*s.k+s.vy*t+22*t*t,r=s.rot+s.vr*t;g.save();g.translate(x,y);g.rotate(r);
   for(const[m,col,a]of[[1.5,s.c,.28],[1,s.c,.8],[.45,W,.9]]){g.globalAlpha=fa*a;g.fillStyle=col;g.beginPath();g.moveTo(s.s*m,0);g.lineTo(-s.s*.6*m,-s.s*.5*m);g.lineTo(-s.s*.3*m,s.s*.6*m);g.closePath();g.fill();}g.restore();}g.globalAlpha=1;}});
 /* 星の雨：粒は少なく・大きく・ゆっくり */
 K.fx({dl:H+.1,d:1.1,upd(dt,t){if(Math.random()<dt*14)K.p({k:'star',x:cam()+Math.random()*vw(),y:-4,vx:rnd(-6,6),vy:rnd(70,105),d:rnd(1.3,1.8),c:Math.random()<.4?GL:BL,s:rnd(2.2,2.8),ph:Math.random()*9});},draw(){}});
 /* 敵に時計の印（金の輪＋逆回りの針） */
 K.fx({dl:H+.15,d:1.7,draw(g,p,t){const fa=cl(t/.2)*(1-cl((t-1.1)/.6));if(fa<=.01)return;
  for(const f of st.foes){if(f.hp<=0)continue;const r=f.boss?9:6,fy=f.y-(f.boss?88:52)-Math.sin(t*3+f.uid)*1.5,fx=Math.round(f.x);
   K.glow(g,fx,fy,r*2.2,G,.4*fa);K.ring(g,fx,fy,r,r,2,G,fa,GL);g.globalCompositeOperation='lighter';g.globalAlpha=fa;g.strokeStyle=W;g.lineWidth=2;g.beginPath();g.moveTo(fx,Math.round(fy));
   g.lineTo(Math.round(fx+Math.cos(-t*5+f.uid)*r*.8),Math.round(fy+Math.sin(-t*5+f.uid)*r*.8));g.stroke();g.globalAlpha=1;}}});
 /* 当たった敵に手応え（槍の刺さる瞬間・白→金） */
 for(const f of st.foes)K.hit(f,st,{dl:H,c:'#fff1a8',stop:.1,pw:1.4});
 return H;}
/* 数字の遅れ：奥義の命中は槍が刺さる時刻に合わせる（なければ 0） */
function hitDl(u,st){return u._ultT!=null&&st.t-u._ultT<=.05?u._ultH:0;}
return{aw,ult,shk,reset,hitDl};})();
