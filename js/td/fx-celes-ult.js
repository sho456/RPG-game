/* ===== TD：セレスの星臨に入る演出と奥義「刻の巻き戻し」（FXU）。部品は FXK（fxkit.js）。fx.js の celesAw/celesUlt・cultB/cultF を置き換えた =====
 星臨（TDA の aw_in：0〜.99 秒＝溜め・.99〜1.38 秒＝白いシルエット・〜1.86 秒＝星臨の姿）：
  足元に時計の陣（金の縁が走る・星の六芒）→ 星がらせんで昇り胸に光が集まる → シルエットの瞬間に光の柱・星の閃光・輪 3 重 → 姿が現れたら星の粒が降って消える。星臨中は足元に小さな星の陣を薄く。
 奥義（アニメの hit＝H。H≒1.8 秒。s＝t/H）：
  溜め 0〜.25（背景が紺へ・足元から光の柱と星のらせん）→ 天空の文字盤 .16〜.58（金の外縁が走り・目盛り・紺の内縁・12 の星が順に灯り・星座の光の糸・中心の宝石）
  → 巻き戻し .62〜.84（針が逆回り・外周の輪も逆回り）→ いちばん暗く静か（H−.3〜H・紫の単色の時間停止 .3 秒・針が光の槍になって降る）
  → H：白飛び（.1 秒）・輪 3 重（速く広がりゆっくり消える）・光の柱・放射・揺れ → 星の雨 → 粒が星になって昇る → 敵に時計の印。暗転は背景だけ（back 層）。当たった敵は FXK.hit。
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
function ult(e,st,B){const u=e.u;let H=1.8;try{H=TDA.hitT(u.id,0,u.awT>0)||1.8;}catch(x){}H=cl(H,.9,2.6);
 const vw=()=>B.vw(),cam=()=>B.cam(),C=()=>{const R=Math.min(vw()*.44,150);return{x:cam()+vw()/2,y:Math.min(110,R+22),R};},ux=()=>u.x+(u.ox||0),uy=()=>u.y;
 const tq=Math.max(H-.3,H*.78+.05);
 /* 敵の中心（槍の落ちる先）。見えている敵の平均 */
 const vis=st.foes.filter(f=>f.x>cam()-10&&f.x<cam()+vw()+10);const T={x:vis.length?vis.reduce((a,f)=>a+f.x,0)/vis.length:cam()+vw()/2,y:vis.length?vis.reduce((a,f)=>a+f.y,0)/vis.length:uy()};
 cur=K.fx({d:H+2,draw(){}});cur.H=H;u._ultT=st.t;u._ultH=H;
 /* --- 背景の暗転（back・背景だけ）：紺へ → いちばん暗く静か → 槍の刺さる瞬間に消える --- */
 K.fx({layer:'back',d:H+.6,draw(g,p,t){const t1=H*.72;let a=.5*sm(cl(t/(H*.25)))+.3*sm(cl((t-t1)/Math.max(.1,tq-t1)));if(t>H)a*=1-sm(cl((t-H)/.45));if(a<=.005)return;
  const x0=cam()-4,w=vw()+8,h=FH();g.globalAlpha=a;g.fillStyle='#050a2a';g.fillRect(x0,0,w,h);
  if(t>tq&&t<=H){g.globalAlpha=.28*sm(cl((t-tq)/.1));g.fillStyle='#1a1040';g.fillRect(x0,0,w,h);}g.globalAlpha=1;}});
 /* --- 溜め：足元の光の柱と星のらせん --- */
 K.fx({d:H,draw(g,p,t){const x=ux(),y=uy(),A=sm(cl(t/(H*.14)))*(1-sm(cl((t-H*.62)/(H*.18))));if(A<=.01)return;
  column(g,x,y-(120+t*40)*sm(cl(t/(H*.2))),y,6+Math.sin(t*24)*1.2,BL,GL,A*.9);
  g.globalCompositeOperation='lighter';for(let s=0;s<3;s++)for(let i=0;i<16;i++){const ph=((i/16+t*1.1+s/3)%1),an=ph*14+s*2.1,r=26*(1-ph)+4,a=A*(1-ph*.6);
   if(i%3===0)K.star4(g,x+Math.cos(an)*r,y-6-ph*100,2+(s?0:1),s?BL:GL,a);else K.dot(g,x+Math.cos(an)*r,y-6-ph*100,1,s?BL:W,a);}
  if(t<.3){const q=t/.3;K.ring(g,x,y+1,20+q*40,(20+q*40)*.42,2,BL,1-q,W);}}});
 /* --- 天空の文字盤（back）：外から内へ描かれる --- */
 K.fx({layer:'back',d:H+1.3,draw(g,p,t){const c=C(),R=c.R,s=t/H,fo=1-cl((t-H-.25)/.8);if(s<.14||fo<=.01)return;const P=(an,k)=>[c.x+Math.cos(an)*R*k,c.y+Math.sin(an)*R*k*.92];
  const sw=K.eo(cl((s-.16)/.24)),sw2=K.eo(cl((s-.24)/.22)),face=sm(cl((s-.2)/.3)),rew=K.eoc((s-.62)/.22),rot=.25*t-2.5*rew;
  g.save();g.translate(c.x,c.y);g.scale(1,.92);K.glow(g,0,0,R*1.15,'#2a3fa0',.55*face*fo);K.glow(g,0,0,R*.85,'#6f4fd8',.2*face*fo);g.restore();
  arcRing(g,c.x,c.y,R,R*.92,3,G,fo,sw,GL);arcRing(g,c.x,c.y,R*.88,R*.88*.92,2,'#3a56d8',fo*.9,sw2,BD);
  g.globalCompositeOperation='lighter';
  for(let i=0;i<60;i++){const f=i/60;if(f>sw2)break;const an=f*TAU-Math.PI/2,m5=i%5===0,q=P(an,m5?.935:.955);K.dot(g,q[0],q[1],m5?2:1,m5?W:G,fo*(m5?1:.7));}
  for(let i=0;i<40;i++){const an=i*TAU/40+rot,q=P(an,1.1),a=fo*face;K.dot(g,q[0],q[1],i%3?1:2,i%3?BD:G,a*(i%3?.55:.9));}
  K.ring(g,c.x,c.y,R*1.1,R*1.1*.92,1,BD,fo*face*.3);
  /* 星座の光の糸（12 の星を 5 つ飛びで結ぶ） */
  const tl=i=>H*(.34+i*.022);for(let i=0;i<12;i++){const j=(i+5)%12,q=K.eo(cl((t-tl(i)-.06)/(H*.2)));if(q<=0)continue;const A=P(i*TAU/12-Math.PI/2,.8),Bp=P(j*TAU/12-Math.PI/2,.8);thread(g,A[0],A[1],A[0]+(Bp[0]-A[0])*q,A[1]+(Bp[1]-A[1])*q,BL,fo*.5);}
  for(let i=0;i<12;i++){const q=cl((t-tl(i))/.2);if(q<=0)continue;const pt=P(i*TAU/12-Math.PI/2,.8),sc=q<.6?q/.6*1.3:1.3-.3*(q-.6)/.4,big=i%3===0;K.bloom(g,pt[0],pt[1],(big?9:6)*sc,big?W:GL,fo*.8,0);K.star4(g,pt[0],pt[1],(big?9:6)*sc,big?W:GL,fo);}
  /* 針（巻き戻しで逆回り・残像つき）。長針は tq で槍になって離れる */
  const ha=s<.45?0:sm(cl((s-.45)/.06));
  if(ha>0){const fw=sm(cl((s-.45)/.17)),m0=-Math.PI/2+TAU*1.2*fw,mT=-Math.PI/2-TAU*2,mAng=k=>{const sk=k<.62?k:.62;const f0=sm(cl((sk-.45)/.17)),a0=-Math.PI/2+TAU*1.2*f0;return k<.62?a0:a0+(mT-(-Math.PI/2+TAU*1.2))*K.eoc((k-.62)/.22);};
   const hand=(an,L,w,col,a)=>{const q=P(an,L);thread(g,c.x,c.y,q[0],q[1],col,a);if(w>2){g.globalCompositeOperation='lighter';g.globalAlpha=a;g.lineCap='round';g.strokeStyle=col;g.lineWidth=w;g.beginPath();g.moveTo(c.x,c.y);g.lineTo(q[0],q[1]);g.stroke();g.lineCap='butt';g.globalAlpha=1;}};
   hand(-Math.PI/2+.5-.5*rew+TAU*.1*fw,.5,3,G,fo*ha);
   if(t<tq){if(rew>0&&rew<1)for(let k=3;k>=1;k--)hand(mAng(Math.max(.45,s-k*.03)),.86,1,BL,fo*ha*.28/k);hand(mAng(s),.88,3,GL,fo*ha);const q=P(mAng(s),.88);K.bloom(g,q[0],q[1],5,GL,fo*ha*.8,.3);}}
  /* 中心の宝石：槍の発射で最も明るい */
  const gem=sm(cl((s-.5)/.1))*(.7+.3*Math.sin(t*6)),fl=1-cl((t-tq)/.35);K.bloom(g,c.x,c.y,6+5*gem+(t>tq?10*fl:0),t>tq?W:GL,fo*(gem*.9+(t>tq?fl:0)*.3),.35);K.diamond(g,c.x,c.y,3,W,fo*gem);}});
 /* --- 時間停止：紫の単色（0.3 秒）。輪郭は読める薄さ --- */
 K.fx({dl:H-.3,d:.3,draw(g,p,t){const x0=cam()-4,w=vw()+8;g.globalAlpha=.15*sm(cl(t/.08));g.fillStyle=VI;g.fillRect(x0,0,w,FH());g.globalAlpha=1;}});
 /* --- 光の槍：dial の中心から敵の中心へ。だんだん速く --- */
 K.fx({dl:tq,d:H-tq+.02,draw(g,p,t){const c=C(),q=cl(t/(H-tq)),k=q*q,tx=T.x,ty=T.y-8,x=c.x+(tx-c.x)*k,y=c.y+(ty-c.y)*k,an=Math.atan2(ty-c.y,tx-c.x),L=56*Math.min(1,.3+q*1.5);
  for(let i=1;i<=6;i++){const kk=Math.max(0,k-i*.05);K.glow(g,c.x+(tx-c.x)*kk,c.y+(ty-c.y)*kk,12-i,G,.35*(1-i/7));}
  g.save();g.translate(x,y);g.rotate(an);g.globalCompositeOperation='lighter';
  const poly=(l,w,col,a)=>{g.globalAlpha=a;g.fillStyle=col;g.beginPath();g.moveTo(0,0);g.lineTo(-l*.2,-w);g.lineTo(-l,-w*.25);g.lineTo(-l,w*.25);g.lineTo(-l*.2,w);g.closePath();g.fill();};
  poly(L*1.05,6,G,.45);poly(L,4,GL,.85);poly(L*.9,1.6,W,1);g.restore();g.globalAlpha=1;
  K.bloom(g,x,y,9+6*q,GL,1,.3);K.star4(g,x,y,5+7*q,W,1,W);}});
 /* --- 着弾：白飛び 0.1 秒・光の柱・放射・輪 3 重・星の雨 --- */
 const hx=T.x,hy=T.y;
 K.fx({dl:H,d:.1,draw(g,p){g.globalAlpha=.95*(1-p)*(1-p*.5);g.fillStyle='#fffbe8';g.fillRect(cam()-4,-4,vw()+8,FH()+8);g.globalAlpha=1;}});
 K.fx({dl:H,d:1.1,draw(g,p,t){const q=cl(t/.7),a=Math.pow(1-q,.8);
  K.glow(g,hx,hy-12,Math.min(vw(),200)*.7,GL,.55*Math.pow(1-cl(t/.6),2));
  column(g,hx,-10,hy,40*(1-q)+4,G,GL,a);
  g.globalCompositeOperation='lighter';const rq=K.eo(cl(t/.35));for(let i=0;i<14;i++){const an=i*TAU/14+.1,lg=i%2===0;ray(g,hx,hy-10,an,10+rq*20,16+rq*(lg?110:62),lg?3:2,lg?GL:G,(1-q)*(lg?.9:.6));}g.globalAlpha=1;
  if(q<1){K.bloom(g,hx,hy-10,40*(1-q*.6)+8,GL,a,.3);K.star4(g,hx,hy-10,62*(1-q*.6)+6,W,a,W);}
  const cols=[W,G,BL],wd=[4,3,2],mx=Math.min(vw()*.62,230);for(let i=0;i<3;i++){const qq=cl((t-i*.09)/.95);if(qq<=0||qq>=1)continue;const r=K.eo(cl(qq/.3))*mx*(1-i*.13);K.ring(g,hx,hy+1,r,r*.28,wd[i],cols[i],Math.pow(1-qq,2.2),i?null:W);}},
  upd(dt,t){if(t-dt<=0){K.sparks(hx,hy-10,40,G,{sp:190,d:.55,gr:120});K.sparks(hx,hy-10,16,W,{sp:120,d:.4});K.stars(hx,hy-10,14,GL,{w:30,h:14,up:20,d:1.0,s:1.5});}}});
 K.fx({dl:H+.05,d:1.0,upd(dt,t){if(Math.random()<dt*70){const x=cam()+Math.random()*vw();K.p({k:'star',x,y:-4,vx:rnd(-8,8),vy:rnd(170,260),d:rnd(.7,1.2),c:Math.random()<.4?GL:BL,s:rnd(1.2,1.9),ph:Math.random()*9});}
  if(Math.random()<dt*30)K.p({k:'spark',x:cam()+Math.random()*vw(),y:-4,vx:rnd(-12,12),vy:rnd(200,280),gr:80,d:.6,c:G});},draw(){}});
 /* 余韻：粒が星になって昇る */
 K.fx({dl:H+.3,d:1.5,upd(dt,t){const L=st.foes.filter(f=>f.hp>0);if(Math.random()<dt*26){const f=L.length?L[Math.floor(Math.random()*L.length)]:null,x=f?f.x:hx,y=f?f.y-8:hy-8;K.stars(x,y,1,GL,{w:10,h:10,up:14,d:1.1,s:1.3});}
  if(Math.random()<dt*20)K.embers(hx+rnd(-60,60),hy,1,G,{w:4,d:1.0});},draw(){}});
 /* 敵に時計の印（金の輪＋逆回りの針） */
 K.fx({dl:H+.15,d:1.9,draw(g,p,t){const fa=cl(t/.2)*(1-cl((t-1.3)/.6));if(fa<=.01)return;
  for(const f of st.foes){if(f.hp<=0)continue;const r=f.boss?9:6,fy=f.y-(f.boss?88:52)-Math.sin(t*3+f.uid)*1.5,fx=Math.round(f.x);
   K.glow(g,fx,fy,r*2.2,G,.4*fa);K.ring(g,fx,fy,r,r,1,G,fa,GL);g.globalCompositeOperation='lighter';g.globalAlpha=fa;g.strokeStyle=W;g.lineWidth=1;g.beginPath();g.moveTo(fx,Math.round(fy));
   g.lineTo(Math.round(fx+Math.cos(-t*5+f.uid)*r*.8),Math.round(fy+Math.sin(-t*5+f.uid)*r*.8));g.moveTo(fx,Math.round(fy));g.lineTo(fx,Math.round(fy-r*.55));g.stroke();g.globalAlpha=1;K.dot(g,fx,fy-r-3,1,G,fa);}}});
 /* 当たった敵に手応え（槍の刺さる瞬間・白→金） */
 for(const f of st.foes)K.hit(f,st,{dl:H,c:'#fff1a8',stop:.1,pw:1.4});
 return H;}
/* 数字の遅れ：奥義の命中は槍が刺さる時刻に合わせる（なければ 0） */
function hitDl(u,st){return u._ultT!=null&&st.t-u._ultT<=.05?u._ultH:0;}
return{aw,ult,shk,reset,hitDl};})();
