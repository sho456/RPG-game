/* ===== ver0.18 敵・ボスのドット絵（右向き）。種族ごとに専用の体つき・動き・攻撃モーションを持つ ===== */
'use strict';
const INK=C('#17131f'),WHT=C('#ffffff');
/* 塗った色R[1]の領域に、左上からの光で明暗を付ける（大きい絵は境目を網掛け） */
function lit(q,R,cx,cy,rx,ry,dith){const w=q.w,h=q.h,s=q.d,base=R[1];for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(s[y*w+x]!==base)continue;const l=-((x+.5-cx)/rx*.62+(y+.5-cy)/ry*.78),ch=(x+y)&1;
  if(l>.5||(dith&&l>.34&&ch))s[y*w+x]=R[0];else if(l<-.42||(dith&&l<-.26&&ch))s[y*w+x]=R[2];}return q;}
const ball=(q,cx,cy,rx,ry,R,dith)=>{const t=new Buf(q.w,q.h);t.ell(cx,cy,rx,ry,R[1]);lit(t,R,cx,cy,rx,ry,dith);q.blit(t,0,0);return q;};
const blob=(q,fn,R,cx,cy,rx,ry,dith)=>{const t=new Buf(q.w,q.h);fn(t);lit(t,R,cx,cy,rx,ry,dith);q.blit(t,0,0);return q;};
const eyeDot=(q,x,y,c,hurt)=>{if(hurt){q.px(x-1,y,INK);q.px(x,y+1,INK);q.px(x+1,y,INK);}else{q.rect(x,y,2,3,INK);q.px(x,y,c||WHT);}};
function regEnemy(key,d){SPDEF[key]=d;}
const sway4=i=>[0,1,2,1][i%4];

/* ---------- スライム族：伸び縮みして跳ねる ---------- */
function dSlime(b,anim,i,d){const R=ramp(d.col),v=d.v,ax=d.ax,ay=d.ay;let sq=0,jy=0,dx=0;
 if(anim==='idle')sq=[0,.07,.12,.05][i];else if(anim==='atk'){sq=[.18,.3,-.3,-.12,.32,.08][i];jy=[0,0,5,8,0,0][i];dx=[-1,-2,3,7,6,2][i];}else if(anim==='hurt'){sq=[.24,.1][i];dx=[-3,-1][i];}else if(anim==='charge')sq=[-.1,-.18][i];
 const rx=10*(1+sq),ry=8.6*(1-sq),cx=ax+dx,cy=ay-jy-ry+.5,hurt=anim==='hurt';
 part(b,q=>{blob(q,t=>{t.ell(cx,cy,rx,ry,R[1]);t.ell(cx,cy+ry*.42,rx*1.04,ry*.62,R[1]);if(v==='iron'){t.rect(cx-rx*.7,cy-ry-1,rx*1.4,3,R[1]);}},R,cx,cy,rx,ry*1.1);
  /* つや */
  if(v!=='iron'){q.ell(cx-rx*.42,cy-ry*.42,2.6,1.7,R[0]);q.px(cx-rx*.5,cy-ry*.55,WHT);q.px(cx-rx*.5+1,cy-ry*.55,WHT);}
  if(v==='void'){for(const[px,py]of[[-5,2],[2,-4],[5,3],[-1,4],[7,-1]])q.px(cx+px,cy+py,(px+i)&1?WHT:C('#c8b0ff'));}
  if(v==='moss'){const M=ramp('#2f6a34');for(const[px,py]of[[-6,3],[-3,5],[4,5],[7,2],[0,6],[-8,1]])q.rect(cx+px,cy+py,2,1,M[1]);}
  if(v==='iron'){q.rect(cx-rx*.7,cy-ry-1,rx*1.4,1,R[0]);q.rect(cx-rx+2,cy-1,rx*2-4,1,R[2]);for(const px of[-6,-1,4])q.px(cx+px,cy+1,R[0]);q.px(cx-rx*.45,cy-ry*.5,WHT);}
  if(v==='ice'){q.line(cx-6,cy+2,cx-2,cy-2,R[0],1);q.line(cx+1,cy+4,cx+4,cy+1,R[0],1);q.px(cx-4,cy-3,WHT);}
  if(v==='water'){q.ell(cx+1,cy+2,rx*.5,ry*.42,R[0]);q.px(cx-3,cy+3,WHT);q.px(cx+5,cy-2,WHT);q.px(cx+2,cy+5,WHT);}
  if(v==='lava'){const K=ramp('#3a1a14');for(const[px,py,w]of[[-7,-1,4],[1,-5,5],[3,3,5],[-5,4,3]])q.rect(cx+px,cy+py,w,2,K[1]);q.px(cx-2,cy+1,C('#ffe080'));q.px(cx+6,cy,C('#ffe080'));q.px(cx-6,cy+2,C('#ffb040'));}
  if(v==='curse'){q.ell(cx+3,cy,3.4,3.4,WHT);q.ell(cx+4,cy,1.9,2.2,C('#d02a50'));q.rect(cx+4,cy-1,1,2,INK);if(hurt)q.rect(cx,cy-1,7,2,R[2]);}
  else{eyeDot(q,cx+2,cy-1,WHT,hurt);eyeDot(q,cx+6,cy-1,WHT,hurt);if(anim==='atk'&&i>1&&i<5)q.rect(cx+3,cy+3,4,2,INK);}});
 /* 種別の飾り */
 if(v==='moss')part(b,q=>{const L=ramp('#4fae4a');q.line(cx,cy-ry,cx-1,cy-ry-3,L[2],1);q.ell(cx-3,cy-ry-4+sway4(i)*.5,2.6,1.6,L[1]);q.ell(cx+2.5,cy-ry-5,2.4,1.5,L[0]);});
 if(v==='ice')part(b,q=>{const K=ramp('#c8f0ff');for(const[px,h]of[[-7,5],[-3,8],[1,6]])q.poly([[cx+px-2,cy-ry*.5],[cx+px,cy-ry*.5-h-(i&1)],[cx+px+2,cy-ry*.55]],K[1]);q.px(cx-3,cy-ry*.5-6,WHT);});
 if(v==='water')part(b,q=>{const K=ramp('#9fe0ff');for(const px of[-5,0,5])q.rect(cx+px,cy-ry-2-((px+i)&1),2,3,K[1]);q.px(cx-8,cy-ry-3-sway4(i),K[0]);q.px(cx+9,cy-ry-1+sway4(i),K[0]);});
 if(v==='lava'){const F=[C('#ffe080'),C('#ff9030'),C('#e04a18')];for(let k=0;k<3;k++){const px=cx-5+k*5,h=3+((k+i)%3);b.rect(px,cy-ry-h+1,2,h,F[1]);b.px(px,cy-ry-h,F[0]);b.px(px+1,cy-ry-h+2,F[2]);}}
 if(v==='curse')part(b,q=>{const K=ramp('#9aa0b4');for(let k=0;k<5;k++)q.rect(cx-9+k*4,cy+4+((k+i)&1),2,2,K[k&1?1:2]);});
 if(v==='void'){for(let k=0;k<3;k++)b.px(cx-6+k*6+((i+k)&1),cy-ry-2-((i+k)%3),C('#b07cff'));}
 if(anim==='charge'){for(let k=0;k<6;k++){const a=k/6*6.283+i;b.px(cx+Math.cos(a)*13,cy+Math.sin(a)*10,C('#ffb030'));}}}
const SLIMES={slime:['#6a4c9c','void'],moss:['#4a8a4a','moss'],cursedslime:['#8a3a62','curse'],ironslime:['#8490a4','iron'],iceslime:['#7cc8ee','ice'],waterslime:['#3a8ad8','water'],lavaslime:['#e0602a','lava']};
for(const k in SLIMES)regEnemy(k,{w:36,h:34,ax:17,ay:31,draw:dSlime,col:SLIMES[k][0],v:SLIMES[k][1]});

/* ---------- 四足の獣（狼・妖狐・火竜の仔・虚獣）：しゃがんで跳びかかり、噛みつく ---------- */
function dBeast(b,anim,i,d){const s=d.s||1,R=ramp(d.col),R2=ramp(d.col2||d.col),E=C(d.eye||'#ff5050'),ax=d.ax,ay=d.ay,f=d.f||{};
 let dx=0,jy=0,cr=0,hup=0,jaw=0,lf=0,lb=0,tl=sway4(i)-1,hurt=anim==='hurt';
 if(anim==='idle'){cr=[0,0,.5,.5][i];hup=[0,.5,0,0][i];}
 else if(anim==='atk'){dx=[-2,-3,5,11,9,3][i];jy=[0,0,5,4,0,0][i];cr=[1.5,2.5,0,0,1.5,.5][i];jaw=[0,0,1,2,0,0][i];lf=[0,0,4,5,1,0][i];lb=[0,0,-4,-3,0,0][i];hup=[-1,-1,1,0,-1,0][i];}
 else if(hurt){dx=[-4,-2][i];hup=[2,1][i];cr=1;}
 else if(anim==='charge'){hup=[3,4][i];cr=1;jaw=1;}
 const X=v=>ax+(v+dx)*s,Y=v=>ay-(v+jy)*s,big=s>1.3;
 /* 尾 */
 const nt=f.tails||1;for(let k=0;k<nt;k++){const sp=nt>1?(k-(nt-1)/2)*.42:0,tw=tl*(k&1?-1:1);part(b,q=>{let px=-9,py=10-cr;const L=f.thickTail?9:nt>1?13:8;for(let j=0;j<L;j++){const t=j/L,a=2.5+sp+tw*.12*t-(nt>1?t*.9:t*.5);px+=Math.cos(a)*-1*-1*0+(-Math.cos(a-3.14)*1);py+=Math.sin(a)*1;
    const w=f.thickTail?Math.max(1,3-t*2.4):nt>1?(t<.75?2.2+t:1.4):(t<.7?2:1.2);q.ell(X(px),Y(py),w*s,w*s,(nt>1&&t>.72)?R2[0]:f.thickTail?R[j&1?1:2]:R[1]);}
   if(f.tailFire){const p0=X(px),p1=Y(py);q.ell(p0,p1-2,2.4,3.2,C('#ff9030'));q.px(p0,p1-3-(i&1),C('#ffe080'));}});}
 /* 翼（竜の仔） */
 if(f.wings)part(b,q=>{const u=sway4(i);q.poly([[X(1),Y(13-cr)],[X(-5),Y(22+u-cr)],[X(-11),Y(17+u*.5-cr)],[X(-8),Y(13-cr)],[X(-5),Y(15-cr)],[X(-3),Y(12-cr)]],R2[2]);q.line(X(1),Y(13-cr),X(-5),Y(22+u-cr),R2[1],1);});
 const leg=(hx,far,off)=>part(b,q=>{const c=far?R[2]:R[1],fx=hx+off,top=7-cr,ly=jy?Math.max(0,off>0?2:1):0;q.line(X(hx),Y(top),X(fx),Y(1+ly),c,s>1.3?3:2);if(s>1.3)q.line(X(hx)+2,Y(top),X(fx)+2,Y(1+ly),c,3);q.rect(X(fx)-1,Y(1+ly)-1,(s>1.3?7:3),s>1.3?3:2,far?R[2]:R2[1]);});
 leg(-7,1,lb);leg(7,1,lf);
 /* 胴 */
 part(b,q=>{blob(q,t=>{t.ell(X(0),Y(9-cr),9.5*s,5*s,R[1]);t.ell(X(-6),Y(8.5-cr),4.2*s,5*s,R[1]);t.ell(X(7),Y(10.5-cr+hup*.3),5*s,5.6*s,R[1]);},R,X(0),Y(10-cr),11*s,6*s,big);
  if(f.belly)for(let k=0;k<5;k++)q.rect(X(-5+k*3),Y(5-cr),2*s|0||1,1,R2[0]);
  if(f.stars)for(const[px,py]of[[-6,10],[-1,8],[3,11],[6,8],[-3,12],[9,12]])q.px(X(px),Y(py-cr),(px+i)&1?WHT:C('#ff80ff'));
  if(f.stripe)for(const px of[-5,-1,3])q.line(X(px),Y(13-cr),X(px+1),Y(9-cr),R[2],1);});
 leg(-4,0,lb);leg(9,0,lf);
 /* たてがみ・背の飾り */
 if(f.mane==='leaf')part(b,q=>{const L=ramp('#58b050');for(let k=0;k<4;k++)q.ell(X(4-k*3.5),Y(15.5-cr-k*.5+((k+i)&1)*.4),2.4*s,1.5*s,L[k&1?1:0]);});
 if(f.mane==='spike')part(b,q=>{for(let k=0;k<5;k++)q.poly([[X(6-k*3.4),Y(14-cr)],[X(4.5-k*3.4),Y(19.5-cr+((k+i)&1))],[X(3-k*3.4),Y(14-cr)]],R2[0]);});
 if(f.mane==='fluff')part(b,q=>{for(let k=0;k<4;k++)q.ell(X(9-k*1.2),Y(7.5+k*1.6-cr),2.6*s,2*s,R2[0]);});
 if(f.mane==='void')part(b,q=>{const V=ramp('#b050ff');for(let k=0;k<6;k++)q.poly([[X(7-k*3),Y(14-cr)],[X(5-k*3-1),Y(21-cr+((k+i)%3))],[X(4-k*3),Y(14-cr)]],V[k&1?1:2]);});
 if(f.mane==='ice')part(b,q=>{const V=ramp('#bfeaff');for(let k=0;k<4;k++)q.poly([[X(5-k*3.6),Y(14-cr)],[X(3.5-k*3.6),Y(19-cr+(k&1))],[X(2.4-k*3.6),Y(14-cr)]],V[k&1?1:0]);});
 /* 頭 */
 const hx=12,hy=15.5-cr+hup;
 part(b,q=>{if(!f.noEars)q.poly([[X(hx-4),Y(hy+2)],[X(hx-3.5),Y(hy+8)],[X(hx-.5),Y(hy+3.5)]],R[2]);});
 part(b,q=>{blob(q,t=>{t.ell(X(hx),Y(hy),4.6*s,4.2*s,R[1]);t.poly([[X(hx+1),Y(hy+3)],[X(hx+8.5),Y(hy+.2)],[X(hx+8.5),Y(hy-1.4-(jaw?0:.6))],[X(hx+1),Y(hy-2.4)]],R[1]);},R,X(hx+1),Y(hy),6*s,4.4*s,big);
  if(jaw){q.poly([[X(hx+1.5),Y(hy-2.2)],[X(hx+8),Y(hy-2.4-jaw*1.3)],[X(hx+7),Y(hy-4-jaw*1.4)],[X(hx+1),Y(hy-4)]],R[2]);q.poly([[X(hx+3),Y(hy-1.6)],[X(hx+7.6),Y(hy-1.6)],[X(hx+7),Y(hy-2.4-jaw)],[X(hx+3),Y(hy-2.6)]],C('#b02a3a'));q.px(X(hx+6.5),Y(hy-1.5),WHT);q.px(X(hx+4.5),Y(hy-1.5),WHT);q.px(X(hx+6),Y(hy-3-jaw),WHT);}
  q.rect(X(hx+8),Y(hy+.4),Math.max(1,s|0),Math.max(1,s|0),INK);
  if(hurt){q.px(X(hx+2),Y(hy+1.4),INK);q.px(X(hx+3),Y(hy+.8),INK);q.px(X(hx+4),Y(hy+1.4),INK);}else{q.rect(X(hx+2.4),Y(hy+1.8),big?3:2,big?2:1,E);q.px(X(hx+2.4)+(big?2:1),Y(hy+1.8),INK);q.px(X(hx+1.6),Y(hy+2.6),R[2]);q.px(X(hx+2.6),Y(hy+2.8),R[2]);}
  if(f.eye3){q.px(X(hx-.5),Y(hy+3),E);q.px(X(hx+5),Y(hy+1.6),E);}
  if(f.mark){q.px(X(hx+1),Y(hy+3.4),C(f.mark));q.px(X(hx+2),Y(hy+4),C(f.mark));q.px(X(hx-2),Y(hy-.5),C(f.mark));if(big)q.rect(X(hx+.5),Y(hy+4.6),2,2,C(f.mark));}
  if(f.fang){q.px(X(hx+6),Y(hy-1.6),WHT);q.px(X(hx+6),Y(hy-2.6),WHT);}
  if(f.horns){q.line(X(hx-1),Y(hy+4),X(hx-3.5),Y(hy+8),R2[0],big?2:1);q.line(X(hx+1.5),Y(hy+4),X(hx+.5),Y(hy+7.5),R2[0],1);}});
 part(b,q=>{if(!f.noEars){q.poly([[X(hx-2),Y(hy+3)],[X(hx-.8),Y(hy+9)],[X(hx+2.2),Y(hy+3.8)]],R[1]);q.px(X(hx-.4),Y(hy+6),R2[0]);}});
 if(f.spark){for(let k=0;k<4;k++){const a=k*1.7+i*1.3;b.px(X(Math.cos(a)*11),Y(11+Math.sin(a)*7),k&1?C('#fff8a0'):WHT);}}
 if(f.frost){for(let k=0;k<5;k++)b.px(X(-12+k*6+((i+k)&1)),Y(1+((k*5+i*2)%20)),k&1?WHT:C('#bfeaff'));}
 if(f.ember){for(let k=0;k<4;k++)b.px(X(-9+k*6),Y(14+((k*3+i*2)%8)),k&1?C('#ffb040'):C('#ff6020'));}
 if(anim==='charge'){for(let k=0;k<8;k++){const a=k/8*6.283+i*.5;b.px(X(hx+8+Math.cos(a)*5),Y(hy+Math.sin(a)*5),C(d.chargeCol||'#ffb030'));}b.rect(X(hx+7.5),Y(hy-1.5),2,2,WHT);}}
const BEASTS={
 wolf:{col:'#8a8c98',col2:'#c8c8d2',eye:'#ff5a50',f:{fang:1}},
 jadewolf:{col:'#5a9a70',col2:'#c8e8c8',eye:'#ffd040',f:{mane:'leaf',fang:1}},
 raiwolf:{col:'#c8a838',col2:'#fff3a0',eye:'#40c8ff',f:{mane:'spike',spark:1,fang:1}},
 snowwolf:{col:'#dfe8f4',col2:'#ffffff',eye:'#40a0ff',f:{mane:'fluff',fang:1}},
 firedrake:{col:'#c8402a',col2:'#f0b050',eye:'#ffe040',f:{noEars:1,horns:1,wings:1,thickTail:1,tailFire:1,belly:1,fang:1}},
 boss5:{s:1.7,w:92,h:76,ax:44,ay:70,col:'#eef2fa',col2:'#b8a0ff',eye:'#b050ff',f:{tails:7,mark:'#a050e0',mane:'ice',frost:1,fang:1},chargeCol:'#9fe8ff'},
 tower20:{s:1.7,w:92,h:76,ax:44,ay:70,col:'#f4d890',col2:'#ff8a50',eye:'#ff4040',f:{tails:7,mark:'#e04030',mane:'fluff',fang:1},chargeCol:'#ffe080'},
 last2:{s:2,w:104,h:84,ax:50,ay:78,col:'#34184e',col2:'#b060ff',eye:'#ff50ff',f:{tails:3,mane:'void',stars:1,eye3:1,fang:1,horns:1},chargeCol:'#ff80ff'}};
for(const k in BEASTS)regEnemy(k,Object.assign({w:56,h:44,ax:24,ay:40,draw:dBeast},BEASTS[k]));

/* ---------- 毒茸：傘を揺すって胞子をまく ---------- */
function dShroom(b,anim,i,d){const R=ramp('#c8343c'),S=ramp('#f0e6d0'),ax=d.ax,ay=d.ay;let by=0,tilt=0,dx=0,sp=0;
 if(anim==='idle'){by=[0,1,1,0][i];tilt=[0,0,1,0][i];}else if(anim==='atk'){dx=[0,1,3,4,3,1][i];tilt=[-2,-3,3,4,-2,0][i];by=[1,2,0,0,1,0][i];sp=i>=2&&i<=4?i-1:0;}else if(anim==='hurt'){dx=-3+i;tilt=-3;}else if(anim==='charge'){by=[2,3][i];sp=1;}
 const cx=ax+dx,hurt=anim==='hurt';
 part(b,q=>{q.rect(cx-5,ay-2,4,2,S[2]);q.rect(cx+2,ay-2,4,2,S[2]);});
 part(b,q=>{blob(q,t=>{t.ell(cx,ay-8+by*.5,6,7,S[1]);},S,cx,ay-8,6,7);eyeDot(q,cx,ay-9+by,WHT,hurt);eyeDot(q,cx+4,ay-9+by,WHT,hurt);q.line(cx-1,ay-11+by,cx+2,ay-10+by,INK,1);q.line(cx+3,ay-10+by,cx+6,ay-11+by,INK,1);q.rect(cx+1,ay-5+by,3,1,S[2]);});
 part(b,q=>{const cy=ay-15+by;blob(q,t=>{t.ell(cx+tilt*.5,cy,12,7.5,R[1]);t.rect(cx-12+tilt*.5,cy,24,3,R[1]);for(let x=cx-13;x<cx+13;x++)for(let y=cy+3;y<cy+9;y++)t.px(x+Math.round(tilt*.5),y,0);},R,cx,cy-1,12,7);
  for(const[px,py,r]of[[-6,-3,2],[2,-5,1.6],[7,-1,1.7],[-1,0,1.3],[-10,1,1.2]])q.ell(cx+px+tilt*.5,cy+py,r,r*.8,S[0]);q.rect(cx-11+tilt*.5,cy+2,22,1,R[2]);});
 if(sp)for(let k=0;k<7;k++){const a=k*.9+sp,r=6+sp*4+(k%3)*2;b.px(cx+Math.cos(a)*r*1.3,ay-20-Math.abs(Math.sin(a))*r*.7,k&1?C('#c8f080'):C('#8fd050'));}}
regEnemy('shroom',{w:40,h:36,ax:19,ay:33,draw:dShroom});

/* ---------- 大海月：ふわふわ浮き、触手を打ちつける ---------- */
function dJelly(b,anim,i,d){const R=ramp('#e070c0'),K=ramp('#c8ecff'),ax=d.ax,ay=d.ay;let fl=[0,1,2,1][i%4],dx=0,sq=0,lash=0;
 if(anim==='atk'){dx=[0,-1,3,6,4,1][i];sq=[.1,.2,-.15,-.1,.1,0][i];lash=[0,0,1,2,1,0][i];fl=1;}else if(anim==='hurt'){dx=-3+i;sq=.15;}else if(anim==='charge'){sq=[-.1,-.2][i];}
 const cx=ax+dx,cy=ay-24-fl,rx=11*(1+sq),ry=9*(1-sq),hurt=anim==='hurt';
 for(let k=0;k<5;k++)part(b,q=>{const x0=cx-8+k*4;let px=x0,py=cy+4;for(let j=0;j<14;j++){const wv=Math.sin(j*.7+i*1.57+k)*1.6+(lash?j*lash*.45:0);q.rect(px+wv,py+j,k%2?1:2,1,k%2?K[1]:R[j%4<2?1:2]);}});
 part(b,q=>{blob(q,t=>{t.ell(cx,cy,rx,ry,R[1]);for(let x=cx-14;x<cx+14;x++)for(let y=cy+4;y<cy+12;y++)t.px(x,y,0);for(let k=0;k<6;k++)t.ell(cx-10+k*4,cy+3.5,2,1.6,R[1]);},R,cx,cy-1,rx,ry,1);
  q.ell(cx-1,cy-2,rx*.55,ry*.45,K[1]);q.ell(cx-2,cy-3,rx*.3,ry*.22,K[0]);q.px(cx-6,cy-5,WHT);q.px(cx-5,cy-6,WHT);eyeDot(q,cx+2,cy,WHT,hurt);eyeDot(q,cx+6,cy,WHT,hurt);});
 if(anim==='charge')for(let k=0;k<6;k++)b.px(cx+Math.cos(k+i)*14,cy+Math.sin(k+i)*11,C('#9fe8ff'));}
regEnemy('jelly',{w:40,h:46,ax:19,ay:43,draw:dJelly});

/* ---------- 魔導書の亡霊：頁をはためかせ、呪いの頁を飛ばす ---------- */
function dBook(b,anim,i,d){const P=ramp('#5a3a9a'),W=ramp('#efe6cc'),ax=d.ax,ay=d.ay;let fl=sway4(i),op=[0,1,0,-1][i%4],dx=0,gl=0;
 if(anim==='atk'){dx=[0,-1,2,4,3,1][i];op=[-2,-3,3,4,2,0][i];gl=i>=2&&i<5;}else if(anim==='hurt'){dx=-3+i;op=-3;}else if(anim==='charge'){op=[3,4][i];gl=1;}
 const cx=ax+dx,cy=ay-17-fl;
 for(let k=0;k<3;k++)b.px(cx-3+k*3+((i+k)&1),cy+11+k*2+((i*2+k)%3),k&1?P[0]:P[1]);
 part(b,q=>{q.poly([[cx-12,cy-4-op*.6],[cx,cy-1],[cx,cy+8],[cx-12,cy+5-op*.6]],P[1]);q.poly([[cx,cy-1],[cx+12,cy-4-op*.6],[cx+12,cy+5-op*.6],[cx,cy+8]],P[2]);});
 part(b,q=>{q.poly([[cx-11,cy-6-op],[cx,cy-3],[cx,cy+6],[cx-11,cy+3-op]],W[1]);q.poly([[cx,cy-3],[cx+11,cy-6-op],[cx+11,cy+3-op],[cx,cy+6]],W[0]);
  for(let k=0;k<3;k++){q.line(cx-9,cy-3-op*.8+k*3,cx-3,cy-1-op*.2+k*3,W[2],1);q.line(cx+3,cy-1-op*.2+k*3,cx+9,cy-3-op*.8+k*3,W[2],1);}q.rect(cx,cy-3,1,9,W[2]);});
 part(b,q=>{q.ell(cx+.5,cy-1,3.2,3.2,C(gl?'#ffe080':'#ff9a30'));q.rect(cx,cy-3,1,4,INK);q.px(cx-1,cy-2,WHT);},!gl);
 if(gl)for(let k=0;k<6;k++){const a=k/6*6.283+i;b.px(cx+Math.cos(a)*7,cy-1+Math.sin(a)*7,C('#b07cff'));}}
regEnemy('bookghost',{w:36,h:40,ax:18,ay:37,draw:dBook});

/* ---------- 霊体：影法師・雪霊・残り火 ---------- */
function dShade(b,anim,i,d){const R=ramp('#2a2444'),ax=d.ax,ay=d.ay;let dx=0,arm=0,fl=sway4(i);
 if(anim==='atk'){dx=[-1,-2,3,7,5,1][i];arm=[1,2,3,4,2,0][i];}else if(anim==='hurt'){dx=-4+i*2;}else if(anim==='charge')arm=2;
 const cx=ax+dx,top=ay-34-fl,hurt=anim==='hurt';
 part(b,q=>{q.line(cx-5,top+12,cx-10-(arm>2?-2:0),top+22-arm,R[2],2);for(let k=0;k<3;k++)q.px(cx-11+k,top+24-arm+k%2,R[2]);});
 part(b,q=>{blob(q,t=>{t.ell(cx,top+6,6,6,R[1]);t.poly([[cx-6,top+9],[cx+6,top+9],[cx+8,top+26],[cx+3+fl,top+34],[cx-2,top+30],[cx-6+fl,top+35],[cx-9,top+26]],R[1]);},R,cx,top+16,9,18);
  if(hurt){q.rect(cx,top+5,2,1,WHT);q.rect(cx+4,top+5,2,1,WHT);}else{q.rect(cx,top+4,2,2,C('#ff4050'));q.rect(cx+4,top+4,2,2,C('#ff4050'));q.px(cx,top+4,WHT);q.px(cx+4,top+4,WHT);}
  for(let k=0;k<4;k++)q.px(cx+k*2-1,top+8+(k&1),WHT);q.rect(cx-1,top+9,7,1,INK);});
 part(b,q=>{const hx=cx+8+arm*2,hy=top+16-arm*2;q.line(cx+5,top+12,hx,hy,R[1],2);for(let k=0;k<3;k++)q.line(hx,hy+k-1,hx+4,hy+k*2-3,R[0],1);});
 for(let k=0;k<4;k++)b.px(cx-8+k*5+((i+k)&1),top+30+((k+i)%4),C('#6a5aa8'));}
regEnemy('shade',{w:40,h:44,ax:18,ay:42,draw:dShade});
function dYuki(b,anim,i,d){const W=ramp('#eef4fc'),H=ramp('#9ac0e8'),ax=d.ax,ay=d.ay;let dx=0,arm=0,fl=sway4(i);
 if(anim==='atk'){dx=[0,-1,2,4,3,1][i];arm=[0,1,3,3,1,0][i];}else if(anim==='hurt')dx=-3+i;else if(anim==='charge')arm=2;
 const cx=ax+dx,top=ay-30-fl,hurt=anim==='hurt';
 part(b,q=>{q.poly([[cx-7,top+3],[cx+1,top+1],[cx+1,top+20],[cx-9-fl,top+22]],H[1]);q.line(cx-6,top+5,cx-7,top+19,H[2],1);});
 part(b,q=>{blob(q,t=>{t.poly([[cx-5,top+11],[cx+5,top+11],[cx+7,top+22],[cx+3,top+29+((i&1)?1:0)],[cx-1,top+26],[cx-5,top+30-((i&1)?1:0)],[cx-8,top+22]],W[1]);},W,cx,top+19,8,10);q.line(cx-1,top+12,cx+2,top+18,C('#7fb8e8'),1);q.rect(cx-5,top+18,11,1,C('#7fb8e8'));});
 part(b,q=>{q.ell(cx+1,top+7,5.2,5.2,ramp('#f6e6dc')[1]);q.poly([[cx-5,top+2],[cx+6,top+2],[cx+6,top+6],[cx+2,top+4],[cx-2,top+5],[cx-5,top+8]],H[0]);
  if(hurt){q.rect(cx+1,top+8,2,1,INK);q.rect(cx+4,top+8,2,1,INK);}else{q.rect(cx+1,top+7,1,2,C('#2a70c8'));q.rect(cx+4,top+7,1,2,C('#2a70c8'));}q.px(cx+3,top+10,C('#d06080'));});
 part(b,q=>{const hx=cx+7+arm*2,hy=top+15-arm;q.line(cx+4,top+13,hx,hy,W[1],2);q.px(hx+1,hy,ramp('#f6e6dc')[1]);});
 if(arm>1||anim==='charge')for(let k=0;k<6;k++)b.px(cx+11+k*2+(k&1),top+13-arm+((k*3+i)%5)-2,k&1?WHT:C('#bfeaff'));
 for(let k=0;k<4;k++)b.px(cx-10+k*6,top+4+((k*7+i*3)%24),WHT);}
regEnemy('yukirei',{w:40,h:40,ax:18,ay:38,draw:dYuki});
function dEmber(b,anim,i,d){const F=[C('#fff6c0'),C('#ffd050'),C('#ff8a28'),C('#d8401a'),C('#7a1c10')],ax=d.ax,ay=d.ay;let dx=0,big=0,fl=sway4(i);
 if(anim==='atk'){dx=[0,-2,3,6,4,1][i];big=[0,1,2,3,1,0][i];}else if(anim==='hurt')dx=-3+i;else if(anim==='charge')big=2+i;
 const cx=ax+dx,cy=ay-12-fl,k1=(i&1)?1:-1,hurt=anim==='hurt';
 const flame=(q,r,h,c,ox)=>q.poly([[cx-r,cy+2],[cx-r+1,cy-h*.4],[cx-r*.4+k1+ox,cy-h*.7],[cx+k1*2+ox,cy-h-big],[cx+r*.5+ox,cy-h*.55],[cx+r,cy-h*.2],[cx+r,cy+3],[cx+r*.5,cy+7],[cx-r*.5,cy+7]],c);
 part(b,q=>{flame(q,9,18,F[3],0);flame(q,7,13,F[2],k1);flame(q,5,8,F[1],0);q.ell(cx,cy+2,3,3,F[0]);
  if(hurt){q.rect(cx-1,cy,2,1,INK);q.rect(cx+3,cy,2,1,INK);}else{q.rect(cx,cy-1,2,3,INK);q.rect(cx+4,cy-1,2,3,INK);}q.rect(cx+1,cy+4,4,1,F[4]);},false);
 part(b,q=>{q.line(cx+7,cy+1,cx+11+big,cy-2-big,F[2],2);q.line(cx-7,cy+2,cx-10,cy,F[3],2);});
 for(let k=0;k<5;k++)b.px(cx-8+k*4+((i+k)&1),cy-18-((k*3+i*2)%7),k&1?F[1]:F[2]);}
regEnemy('ember',{w:36,h:40,ax:17,ay:38,draw:dEmber});

/* ---------- ゴーレム族：腕を振り上げて叩きつける。ボスは大型で専用の装飾 ---------- */
function dGolem(b,anim,i,d){const s=d.s||1,R=ramp(d.col),D=ramp(d.col2||d.col),E=C(d.eye||'#ff9a30'),ax=d.ax,ay=d.ay,f=d.f||{},big=s>1.3;
 let by=0,ln=0,ra=[14,8],la=[-14,8],dx=0,core=0;
 if(anim==='idle'){by=[0,.5,1,.5][i];ra=[14,8-by];la=[-14,8-by];}
 else if(anim==='atk'){dx=[0,-1,-1,3,3,1][i];ln=[-1,-2,-2,3,3,1][i];ra=[[13,16],[10,27],[9,30],[21,4],[21,3],[16,7]][i];la=[[-14,9],[-15,10],[-15,10],[-11,6],[-11,6],[-13,8]][i];by=[0,0,0,2,2,1][i];}
 else if(anim==='hurt'){dx=-3+i*2;ln=-3;ra=[15,12];la=[-12,12];}
 else if(anim==='charge'){ra=[11,25+i];la=[-11,25+i];core=1+i;by=1;}
 const X=v=>ax+(v+dx)*s,Y=v=>ay-v*s,L=v=>ln*v/22;
 const armF=(sh,hand,far)=>part(b,q=>{const c=far?D:R;q.line(X(sh[0]),Y(sh[1]),X(hand[0]),Y(hand[1]),c[far?2:1],Math.max(2,Math.round(3*s)));blob(q,t=>t.ell(X(hand[0]),Y(hand[1]),4.4*s,4.2*s,c[1]),c,X(hand[0]),Y(hand[1]),4.4*s,4.2*s,big);
  if(f.spikes)for(const a of[-.6,.3,1.2])q.px(X(hand[0])+Math.cos(a)*4*s,Y(hand[1])-Math.sin(a)*4*s,D[0]);});
 /* 背の飾り */
 if(f.wings)part(b,q=>{const u=sway4(i),K=ramp(f.wings);for(const sg of[-1,1])for(let k=0;k<3;k++)q.poly([[X(sg*6+L(20)),Y(20-by)],[X(sg*(17+k*4)+L(20)),Y(31-k*5+u)],[X(sg*(13+k*3)+L(20)),Y(22-k*5)]],K[k&1?1:0]);});
 if(f.halo)part(b,q=>{const u=sway4(i),K=ramp(f.halo);q.ell(X(1+L(30)),Y(33-by+u*.3),8*s*.7,2.2*s*.7,K[1]);q.ell(X(1+L(30)),Y(33-by+u*.3),5.6*s*.7,1.1*s*.7,0);},1);
 armF([-11+L(20),20-by],la,1);
 /* 脚 */
 part(b,q=>{for(const sg of[-1,1]){blob(q,t=>{t.rect(X(sg*4-2.5),Y(7),5*s,7*s,(sg<0?D:R)[1]);},sg<0?D:R,X(sg*4),Y(4),3*s,4*s);q.rect(X(sg*4-3.5),Y(1.6),7*s,2*s|0||2,(sg<0?D:R)[2]);}});
 /* 胴 */
 part(b,q=>{blob(q,t=>{t.poly([[X(-8),Y(7)],[X(8),Y(7)],[X(11+L(22)),Y(22-by)],[X(-11+L(22)),Y(22-by)]],R[1]);t.ell(X(-11+L(20)),Y(20-by),4.6*s,4.4*s,R[1]);t.ell(X(11+L(20)),Y(20-by),4.6*s,4.4*s,R[1]);},R,X(0),Y(15),13*s,9*s,big);
  /* ひび・継ぎ目 */
  q.line(X(-6),Y(11),X(-3),Y(14-by),R[2],1);q.line(X(5),Y(19-by),X(7),Y(15),R[2],1);q.rect(X(-7),Y(8.4),14*s,1,R[2]);
  if(f.runes)for(const[px,py]of[[-6,17],[-4,13],[6,12],[4,18]])q.rect(X(px+L(py)),Y(py-by),2,2,C(f.runes));
  if(f.molten){for(const[px,py,l]of[[-7,18,4],[3,12,5],[-2,9,3]])q.line(X(px),Y(py-by),X(px+l),Y(py-by-2),C('#ff8030'),1);q.px(X(-5),Y(17-by),C('#ffe080'));}
  if(f.plates){q.rect(X(-9+L(20)),Y(21-by),18*s,1,D[0]);q.rect(X(-8),Y(12),16*s,1,D[2]);}
  if(f.crystal)for(const[px,py]of[[-12,24],[-9,26],[11,25]])q.poly([[X(px-1.6+L(22)),Y(22-by)],[X(px+L(22)),Y(py+2-by)],[X(px+1.6+L(22)),Y(22-by)]],C(f.crystal));
  /* 核 */
  const cx=X(1+L(15)),cy=Y(15-by),cr=(2.4+core*.6)*s;q.ell(cx,cy,cr+1,cr+1,D[2]);q.ell(cx,cy,cr,cr,E);q.px(cx-1,cy-1,WHT);if(core)q.ell(cx,cy,cr*.5,cr*.5,WHT);});
 /* 頭 */
 part(b,q=>{const hx=X(1+L(26)),hy=Y(26-by);blob(q,t=>{t.rect(hx-3.5*s,hy-3*s,7.5*s,6.4*s,R[1]);if(f.crown)for(let k=0;k<3;k++)t.poly([[hx-3.5*s+k*2.6*s,hy-3*s],[hx-2.4*s+k*2.6*s,hy-6*s],[hx-1.2*s+k*2.6*s,hy-3*s]],R[1]);},R,hx,hy,4*s,3.4*s);
  q.rect(hx-2*s,hy-.6*s,6*s,Math.max(2,1.6*s),INK);if(anim==='hurt'){q.rect(hx-1*s,hy,2,1,E);q.rect(hx+2*s,hy,2,1,E);}else{q.rect(hx-.6*s,hy-.4*s,Math.max(2,1.4*s),Math.max(1,1.2*s),E);q.rect(hx+2*s,hy-.4*s,Math.max(2,1.4*s),Math.max(1,1.2*s),E);}
  if(f.horn){q.line(hx-3*s,hy-3*s,hx-5*s,hy-6*s,D[0],big?2:1);q.line(hx+4*s,hy-3*s,hx+6*s,hy-6*s,D[0],big?2:1);}
  if(f.book){q.rect(hx-1*s,hy-5*s,3*s,2*s,C('#5a3a9a'));q.rect(hx-1*s,hy-5*s,3*s,1,C('#efe6cc'));}});
 armF([11+L(20),20-by],ra,0);
 if(f.shards)for(let k=0;k<6;k++){const a=k/6*6.283+i*.4;part(b,q=>q.poly([[X(Math.cos(a)*19),Y(16+Math.sin(a)*13)],[X(Math.cos(a)*19+1.5),Y(19+Math.sin(a)*13)],[X(Math.cos(a)*19+3),Y(16+Math.sin(a)*13)],[X(Math.cos(a)*19+1.5),Y(13+Math.sin(a)*13)]],C(k&1?'#e8dcff':'#b0a0ff')));}
 if(anim==='atk'&&i===3)for(let k=0;k<6;k++)b.rect(X(17+k*2.4),Y(1+((k*3)%4)),2,2,k&1?R[0]:D[1]);
 if(anim==='charge')for(let k=0;k<10;k++){const a=k/10*6.283+i*.6;b.px(X(1+Math.cos(a)*(9+i*2)),Y(15+Math.sin(a)*(9+i*2)),E);}}
const GOLEMS={
 golem:{col:'#9aa6b8',col2:'#6a7488',eye:'#ffb030',f:{}},
 golemkin:{col:'#8a6a4a',col2:'#5a4630',eye:'#ffd040',f:{crystal:'#7fe0c0'}},
 boss2:{s:1.75,w:96,h:84,ax:46,ay:78,col:'#a89a82',col2:'#6e6454',eye:'#7fd6ff',f:{runes:'#7fd6ff',book:1,wings:'#8a7c66',plates:1}},
 golemboss:{s:1.9,w:104,h:88,ax:50,ay:82,col:'#3c3c48',col2:'#22222c',eye:'#ff6020',f:{molten:1,horn:1,spikes:1,plates:1}},
 boss7:{s:2,w:110,h:96,ax:53,ay:88,col:'#ece4c8',col2:'#b89c64',eye:'#40e0ff',f:{halo:'#ffe27a',wings:'#fff6d8',runes:'#40e0ff',crown:1}},
 tower10:{s:1.8,w:100,h:86,ax:48,ay:80,col:'#6a7aa4',col2:'#3a4a70',eye:'#ff40a0',f:{plates:1,horn:1,runes:'#ff9ad0'}},
 last1:{s:2,w:110,h:96,ax:53,ay:88,col:'#d8d0ff',col2:'#7868c8',eye:'#ffffff',f:{shards:1,halo:'#b0a0ff',crystal:'#ffffff',crown:1}}};
for(const k in GOLEMS)regEnemy(k,Object.assign({w:60,h:52,ax:28,ay:48,draw:dGolem},GOLEMS[k]));

/* ---------- ボス：虚ろの番人（冠をいただく虚の巨影。宙に浮く両手で薙ぎ払う） ---------- */
function dWarden(b,anim,i,d){const R=ramp(d.col||'#4a3478'),G=ramp(d.gold||'#e8c040'),E=C(d.eye||'#ffb030'),ax=d.ax,ay=d.ay,u=sway4(i);
 let dx=0,rh=[22,26],lh=[-20,24],by=u*.5,orb=0;
 if(anim==='atk'){dx=[0,-1,2,4,3,1][i];rh=[[24,34],[20,42],[30,30],[36,14],[32,12],[24,22]][i];lh=[[-20,24],[-21,26],[-18,22],[-14,18],[-16,20],[-19,23]][i];}
 else if(anim==='hurt'){dx=-4+i*2;rh=[26,34];lh=[-24,32];}
 else if(anim==='charge'){rh=[9,40+i];lh=[-7,40+i];orb=1+i;}
 const X=v=>ax+v+dx,Y=v=>ay-v-by;
 /* 裾（ゆらめく外套） */
 part(b,q=>{blob(q,t=>{t.poly([[X(-9),Y(40)],[X(9),Y(40)],[X(17),Y(14)],[X(20+u),Y(0)-by],[X(11),Y(3)-by],[X(5-u),Y(-1)-by],[X(-2),Y(4)-by],[X(-9+u),Y(-1)-by],[X(-15),Y(3)-by],[X(-21-u),Y(0)-by],[X(-17),Y(14)]],R[1]);t.ell(X(0),Y(38),12,9,R[1]);},R,X(0),Y(22),19,24,1);
  for(const[px,py]of[[-8,12],[5,8],[11,18],[-12,22],[2,26],[-4,6],[13,7],[-14,9]])q.px(X(px),Y(py),((px+i)&1)?WHT:C('#c8b0ff'));
  q.line(X(-3),Y(34),X(-6),Y(10),R[2],1);q.line(X(5),Y(34),X(9),Y(10),R[2],1);q.rect(X(-10),Y(31),20,2,G[1]);q.rect(X(-10),Y(31),20,1,G[0]);q.ell(X(0),Y(29),2.6,2.6,E);q.px(X(-1),Y(30),WHT);});
 /* 頭巾と仮面 */
 part(b,q=>{blob(q,t=>{t.ell(X(1),Y(46),10,9,R[1]);t.poly([[X(-9),Y(46)],[X(11),Y(46)],[X(9),Y(38)],[X(-7),Y(38)]],R[1]);},R,X(1),Y(46),10,9,1);q.ell(X(2),Y(44),6.5,5.5,INK);
  if(anim==='hurt'){q.rect(X(-1),Y(45),3,1,E);q.rect(X(4),Y(45),3,1,E);}else{q.poly([[X(-2),Y(46)],[X(2),Y(45)],[X(1),Y(43)],[X(-2),Y(44)]],E);q.poly([[X(4),Y(45)],[X(8),Y(46)],[X(8),Y(44)],[X(5),Y(43)]],E);q.px(X(0),Y(45),WHT);q.px(X(6),Y(45),WHT);}});
 /* 冠 */
 part(b,q=>{for(let k=0;k<5;k++)q.poly([[X(-9+k*4.4),Y(52)],[X(-7+k*4.4),Y(58+(k===2?4:k%2?1:2))],[X(-5+k*4.4),Y(52)]],G[k===2?0:1]);q.rect(X(-9),Y(53),21,3,G[1]);q.rect(X(-9),Y(53),21,1,G[0]);q.rect(X(0),Y(52.4),2,2,C('#d04060'));});
 /* 両手 */
 const hand=(p,far)=>part(b,q=>{const c=far?ramp('#32245a'):R;blob(q,t=>t.ell(X(p[0]),Y(p[1]),5.5,5,c[1]),c,X(p[0]),Y(p[1]),5.5,5);for(let k=0;k<3;k++)q.line(X(p[0]+3),Y(p[1]+2-k*2.5),X(p[0]+8),Y(p[1]+3-k*3.5),G[far?2:1],2);});
 hand(lh,1);hand(rh,0);
 if(orb){const ox=X(1),oy=Y(42+i);b.ell(ox,oy,3+orb,3+orb,C('#b07cff'));b.ell(ox,oy,1.5+orb*.5,1.5+orb*.5,WHT);for(let k=0;k<8;k++){const a=k/8*6.283+i;b.px(ox+Math.cos(a)*(8+orb),oy+Math.sin(a)*(8+orb),C('#ffb030'));}}
 for(let k=0;k<5;k++)b.px(X(-18+k*9+((i+k)&1)),Y(-2+((k*2+i)%4)),C('#8a6ac8'));}
regEnemy('boss',{w:84,h:80,ax:40,ay:70,draw:dWarden});
regEnemy('boss9w',{w:84,h:80,ax:40,ay:70,draw:dWarden,col:'#3a1414',gold:'#ff9040',eye:'#ffe040'});

/* ---------- ボス：虚ろの司祭（宙に浮く痩身の聖職者。終末の鐘を振るう） ---------- */
function dPriest(b,anim,i,d){const R=ramp(d.col||'#c8b070'),K=ramp(d.col2||'#6a5a30'),G=ramp('#e8c040'),E=C(d.eye||'#ff3030'),ax=d.ax,ay=d.ay,u=sway4(i);
 let dx=0,st=[13,30],sa=80,by=u,lh=[-9,22],ring=0;
 if(anim==='atk'){dx=[0,-1,1,3,2,1][i];st=[[13,32],[10,38],[14,36],[18,24],[17,22],[14,28]][i];sa=[85,120,95,20,10,60][i];ring=i>=3&&i<=4;}
 else if(anim==='hurt'){dx=-4+i*2;sa=110;}
 else if(anim==='charge'){st=[8,40+i];sa=90;lh=[-8,36+i];ring=1;}
 const X=v=>ax+v+dx,Y=v=>ay-v-by-4;
 part(b,q=>{q.line(X(-4),Y(34),X(lh[0]),Y(lh[1]),K[1],3);q.rect(X(lh[0])-1,Y(lh[1])-1,3,3,ramp('#d8ccc0')[1]);});
 part(b,q=>{blob(q,t=>{t.poly([[X(-6),Y(40)],[X(7),Y(40)],[X(10),Y(22)],[X(13+u),Y(2)],[X(7),Y(5)],[X(2-u),Y(0)],[X(-4),Y(5)],[X(-11-u),Y(1)],[X(-9),Y(22)]],R[1]);},R,X(0),Y(22),12,20,1);
  q.poly([[X(-2),Y(40)],[X(3),Y(40)],[X(4),Y(8)],[X(-3),Y(8)]],K[1]);q.rect(X(-1),Y(34),3,1,G[1]);q.rect(X(0),Y(36),1,6,G[1]);q.rect(X(-3),Y(8),8,1,G[1]);for(const py of[28,22,16])q.px(X(0),Y(py),G[0]);
  q.poly([[X(-8),Y(41)],[X(9),Y(41)],[X(11),Y(35)],[X(-10),Y(35)]],K[1]);q.rect(X(-10),Y(35.6),21,1,G[1]);});
 /* 頭：ミトラと虚ろな顔 */
 part(b,q=>{blob(q,t=>{t.ell(X(1),Y(46),6,6,R[1]);t.poly([[X(-5),Y(49)],[X(1),Y(63)],[X(7),Y(49)]],R[1]);},R,X(1),Y(50),7,9);q.ell(X(2),Y(45.5),4.2,4.2,INK);q.rect(X(0),Y(60),2,9,G[1]);q.rect(X(-2),Y(57),6,1,G[1]);q.rect(X(-5),Y(50),12,1,G[1]);
  if(anim==='hurt'){q.rect(X(0),Y(46),2,1,E);q.rect(X(4),Y(46),2,1,E);}else{q.rect(X(0),Y(47),2,2,E);q.rect(X(4),Y(47),2,2,E);q.px(X(0),Y(47),WHT);}});
 /* 鐘の杖 */
 part(b,q=>{drawWeapon(q,'bell',X(st[0]),Y(st[1]),180-sa,{leather:K,trim:G,guard:G,blade:G});});
 part(b,q=>{q.line(X(5),Y(34),X(st[0]),Y(st[1]),R[1],3);q.rect(X(st[0])-1,Y(st[1])-1,3,3,ramp('#d8ccc0')[1]);});
 if(ring){const a=(180-sa)*Math.PI/180,bx=X(st[0])-Math.cos(a)*10,byy=Y(st[1])-Math.sin(a)*10;for(let k=0;k<10;k++){const an=k/10*6.283+i*.3,r=7+(i&1)*3;b.px(bx+Math.cos(an)*r,byy+Math.sin(an)*r,k&1?C('#ffe9a0'):C('#b07cff'));}}
 for(let k=0;k<5;k++)b.px(X(-10+k*5+((i+k)&1)),Y(-3-((k*2+i)%5)),C('#8a6ac8'));}
regEnemy('boss3',{w:72,h:92,ax:34,ay:84,draw:dPriest});

/* ---------- ボス：沈みし女王（水の裳裾をまとう。王笏で潮を操る） ---------- */
function dQueen(b,anim,i,d){const R=ramp(d.col||'#2a5a9a'),Wt=ramp('#7fd0ff'),G=ramp('#e8d070'),S=ramp('#b8ccdc'),H=ramp(d.hair||'#a0d0ff'),E=C('#40ffff'),ax=d.ax,ay=d.ay,u=sway4(i);
 let dx=0,st=[13,34],sa=80,by=u*.5,lh=[-11,30],wave=0;
 if(anim==='atk'){dx=[0,-1,1,3,2,1][i];st=[[13,36],[9,44],[13,44],[19,30],[19,28],[15,32]][i];sa=[85,115,100,25,15,60][i];wave=i>=3&&i<=4;}
 else if(anim==='hurt'){dx=-4+i*2;sa=110;lh=[-13,36];}
 else if(anim==='charge'){st=[8,46];sa=90;lh=[-8,44];wave=1;}
 const X=v=>ax+v+dx,Y=v=>ay-v-by;
 /* 髪（後ろ） */
 part(b,q=>{q.poly([[X(-6),Y(54)],[X(6),Y(56)],[X(8),Y(40)],[X(-10-u),Y(22)],[X(-14),Y(30)],[X(-9),Y(44)]],H[2]);q.line(X(-5),Y(50),X(-10-u),Y(26),H[1],1);});
 part(b,q=>{q.line(X(-5),Y(42),X(lh[0]),Y(lh[1]),S[1],2);q.rect(X(lh[0])-1,Y(lh[1])-1,3,3,S[0]);});
 /* 裳裾：水が渦を巻く */
 part(b,q=>{blob(q,t=>{t.poly([[X(-5),Y(38)],[X(6),Y(38)],[X(12),Y(24)],[X(22+u),Y(4)],[X(24),Y(0)],[X(-23),Y(0)],[X(-21-u),Y(5)],[X(-11),Y(24)]],R[1]);},R,X(0),Y(16),22,20,1);
  for(let k=0;k<4;k++){const y0=4+k*7;q.line(X(-17+k*3),Y(y0+((k+i)&1)),X(-6+k),Y(y0+3),Wt[1],1);q.line(X(5-k),Y(y0+3),X(17-k*2),Y(y0+((k+i+1)&1)),Wt[1],1);}
  for(let k=0;k<8;k++)q.rect(X(-22+k*6+((i+k)&1)),Y(1),3,2,Wt[0]);q.rect(X(-5),Y(38),12,2,G[1]);q.rect(X(0),Y(37),2,10,G[1]);});
 /* 上半身 */
 part(b,q=>{blob(q,t=>{t.poly([[X(-6),Y(47)],[X(7),Y(47)],[X(6),Y(38)],[X(-5),Y(38)]],R[1]);},R,X(0),Y(43),7,5);q.rect(X(-6),Y(47),14,1,G[1]);q.ell(X(1),Y(44),1.6,1.6,E);});
 /* 顔と冠 */
 part(b,q=>{q.ell(X(1),Y(52),5.4,5.4,S[1]);q.poly([[X(-5),Y(57)],[X(7),Y(58)],[X(7),Y(53)],[X(3),Y(55)],[X(-1),Y(54)],[X(-5),Y(50)]],H[1]);q.line(X(-4),Y(56),X(2),Y(57),H[0],1);
  if(anim==='hurt'){q.rect(X(1),Y(52),2,1,INK);q.rect(X(4),Y(52),2,1,INK);}else{q.rect(X(1),Y(53),1,2,E);q.rect(X(4),Y(53),1,2,E);}q.px(X(3),Y(49),C('#7088a8'));});
 part(b,q=>{for(let k=0;k<4;k++)q.poly([[X(-5+k*3.4),Y(58)],[X(-3.5+k*3.4),Y(63+(k%2?0:2))],[X(-2+k*3.4),Y(58)]],G[1]);q.rect(X(-5),Y(59),13,2,G[1]);q.rect(X(-5),Y(59),13,1,G[0]);q.px(X(1),Y(58.6),E);});
 /* 王笏（三叉） */
 part(b,q=>{const a=sa*Math.PI/180,hx=X(st[0]),hy=Y(st[1]),ux=Math.cos(a),uy=-Math.sin(a);q.line(hx-ux*10,hy-uy*10,hx+ux*16,hy+uy*16,G[1],1);const tx=hx+ux*16,ty=hy+uy*16;q.line(tx-uy*4,ty+ux*4,tx+uy*4,ty-ux*4,G[1],1);for(const n of[-4,0,4])q.line(tx-uy*n,ty+ux*n,tx-uy*n+ux*5,ty+ux*n+uy*5,G[0],1);q.ell(tx,ty,1.6,1.6,E);});
 part(b,q=>{q.line(X(6),Y(42),X(st[0]),Y(st[1]),S[1],2);q.rect(X(st[0])-1,Y(st[1])-1,3,3,S[0]);});
 if(wave)for(let k=0;k<12;k++){const a=k/12*6.283+i*.5,r=26+(i&1)*3;b.px(X(Math.cos(a)*r),Y(20+Math.sin(a)*r*.8),k&1?Wt[0]:WHT);}
 for(let k=0;k<6;k++)b.px(X(-24+k*9+((i+k)&1)),Y(8+((k*5+i*3)%30)),k&1?Wt[0]:WHT);}
regEnemy('boss6',{w:84,h:88,ax:40,ay:82,draw:dQueen});

/* ---------- ボス：黒炎竜ヴォルガノン（翼を広げた巨竜。首を伸ばして噛みつき、息吹を溜める） ---------- */
function dDragon(b,anim,i,d){const R=ramp('#3a2026'),B2=ramp('#c8502a'),Hn=ramp('#e8d8a8'),F=[C('#fff6c0'),C('#ffd050'),C('#ff8a28'),C('#d8401a')],E=C('#ffe040'),ax=d.ax,ay=d.ay,u=sway4(i);
 let dx=0,hd=[30,44],jaw=0,wf=u,by=u*.5,breath=0;
 if(anim==='atk'){dx=[0,-2,2,5,4,1][i];hd=[[28,48],[24,52],[36,40],[44,30],[42,30],[34,40]][i];jaw=[0,1,2,2,0,0][i];wf=[2,3,0,-1,0,1][i];}
 else if(anim==='hurt'){dx=-4+i*2;hd=[24,52];wf=3;}
 else if(anim==='charge'){hd=[26,54+i];jaw=2;breath=1+i;wf=3;}
 const X=v=>ax+v+dx,Y=v=>ay-v;
 /* 奥の翼 */
 const wing=(far)=>part(b,q=>{const c=far?ramp('#2a1418'):R,m=far?ramp('#6a2418'):B2,ox=far?-2:-10,oy=far?40:42,tip=[ox-22-(far?6:0),oy+26+wf*2],k1=[ox-34,oy+8+wf],k2=[ox-26,oy-6+wf*.5],k3=[ox-14,oy-8];
   q.poly([[X(ox),Y(oy-by)],[X(tip[0]),Y(tip[1])],[X(k1[0]),Y(k1[1])],[X(k1[0]+5),Y(k1[1]+5)],[X(k2[0]),Y(k2[1])],[X(k2[0]+5),Y(k2[1]+5)],[X(k3[0]),Y(k3[1])],[X(ox-4),Y(oy-8-by)]],m[far?2:1]);
   for(const k of[k1,k2,k3])q.line(X(tip[0]),Y(tip[1]),X(k[0]),Y(k[1]),c[1],1);q.line(X(ox),Y(oy-by),X(tip[0]),Y(tip[1]),c[1],2);q.px(X(tip[0]),Y(tip[1]+1),Hn[1]);});
 wing(1);
 /* 尾 */
 part(b,q=>{let px=-16,py=12;for(let k=0;k<16;k++){const t=k/16;px-=1.6;py+=Math.sin(k*.5+u*.4)*1.1-(k>10?-.9:.3);q.ell(X(px),Y(py),5-t*4,4.4-t*3.4,R[k%3===2?2:1]);if(k%3===0&&k<13)q.px(X(px),Y(py+4.5-t*3),Hn[1]);}q.poly([[X(px-1),Y(py+3)],[X(px-6),Y(py+5)],[X(px-2),Y(py-2)]],B2[1]);});
 /* 奥の脚 */
 part(b,q=>{q.line(X(-12),Y(16),X(-15),Y(3),R[2],5);q.rect(X(-19),Y(2.4),8,3,R[2]);q.line(X(12),Y(18),X(16),Y(3),R[2],4);q.rect(X(13),Y(2.4),8,3,R[2]);});
 /* 胴 */
 part(b,q=>{blob(q,t=>{t.ell(X(0),Y(22-by),20,13,R[1]);t.ell(X(13),Y(28-by),11,11,R[1]);},R,X(2),Y(24),22,14,1);
  for(let k=0;k<7;k++){q.rect(X(-10+k*4.4),Y(12.5-by+(k>4?k-4:0)*1.6),4,2,B2[k&1?1:0]);}
  for(let k=0;k<6;k++)q.poly([[X(-14+k*5),Y(33-by+Math.min(2,k)*.8)],[X(-12+k*5),Y(38-by+Math.min(2,k))],[X(-10+k*5),Y(33-by+Math.min(2,k)*.8)]],Hn[k&1?1:2]);
  for(const[px,py]of[[-6,24],[2,20],[8,26],[-12,20],[14,22]])q.px(X(px),Y(py-by),R[0]);});
 /* 手前の脚 */
 part(b,q=>{blob(q,t=>{t.ell(X(-8),Y(14),7,8,R[1]);t.poly([[X(-11),Y(10)],[X(-5),Y(10)],[X(-6),Y(2)],[X(-12),Y(2)]],R[1]);},R,X(-8),Y(11),7,9,1);q.rect(X(-14),Y(2.4),11,3,R[1]);for(let k=0;k<3;k++)q.px(X(-4+k*-3.5),Y(.4),Hn[0]);
  q.line(X(17),Y(20-by),X(21),Y(4),R[1],4);q.rect(X(18),Y(2.4),9,3,R[1]);for(let k=0;k<3;k++)q.px(X(26-k*3),Y(.4),Hn[0]);});
 /* 首 */
 part(b,q=>{const n0=[18,32-by],n1=hd;for(let k=0;k<=8;k++){const t=k/8,px=n0[0]+(n1[0]-n0[0])*t+Math.sin(t*3.14)*-3,py=n0[1]+(n1[1]-n0[1])*t;q.ell(X(px),Y(py),6.4-t*2,6.4-t*2,R[k%3===1?2:1]);q.px(X(px+3-t),Y(py-4+t),B2[1]);}});
 /* 頭 */
 part(b,q=>{const hx=hd[0],hy=hd[1];q.line(X(hx-3),Y(hy+4),X(hx-10),Y(hy+11),Hn[1],2);q.line(X(hx-1),Y(hy+5),X(hx-5),Y(hy+13),Hn[0],2);
  blob(q,t=>{t.ell(X(hx),Y(hy),6.4,5.4,R[1]);t.poly([[X(hx+2),Y(hy+4)],[X(hx+15),Y(hy+1.5)],[X(hx+16),Y(hy-1.2)],[X(hx+2),Y(hy-2)]],R[1]);},R,X(hx+3),Y(hy),9,5.4,1);
  q.poly([[X(hx+2),Y(hy-2)],[X(hx+15),Y(hy-2-jaw*2)],[X(hx+13),Y(hy-4.4-jaw*2.4)],[X(hx+1),Y(hy-5)]],R[2]);
  if(jaw){q.poly([[X(hx+4),Y(hy-1.4)],[X(hx+14),Y(hy-1.4)],[X(hx+13),Y(hy-2-jaw*2)],[X(hx+4),Y(hy-3)]],breath?F[1]:C('#b02a3a'));}
  for(let k=0;k<4;k++){q.px(X(hx+6+k*2.6),Y(hy-1.6),WHT);if(jaw)q.px(X(hx+6+k*2.4),Y(hy-2.4-jaw*1.8),WHT);}
  q.rect(X(hx+14),Y(hy+1.6),2,1,INK);
  if(anim==='hurt'){q.line(X(hx+2),Y(hy+2),X(hx+5),Y(hy+1),E,1);}else{q.poly([[X(hx+2),Y(hy+3)],[X(hx+6),Y(hy+2)],[X(hx+5),Y(hy+.6)],[X(hx+2),Y(hy+1)]],E);q.rect(X(hx+4),Y(hy+2.4),1,2,INK);}
  q.line(X(hx+1),Y(hy+4.4),X(hx+7),Y(hy+3.4),R[2],1);});
 wing(0);
 if(breath){const hx=X(hd[0]+16),hy=Y(hd[1]-3);b.ell(hx,hy,2+breath*1.5,2+breath*1.5,F[2]);b.ell(hx,hy,1+breath,1+breath,F[0]);for(let k=0;k<10;k++){const a=k/10*6.283+i;b.px(hx+Math.cos(a)*(7+breath*2),hy+Math.sin(a)*(7+breath*2),F[k&1?1:2]);}}
 for(let k=0;k<6;k++)b.px(X(-30+k*12+((i+k)&1)),Y(4+((k*7+i*3)%40)),F[k&1?2:1]);}
regEnemy('boss9',{w:120,h:96,ax:60,ay:90,draw:dDragon});

/* ---------- 人型の敵（リグを共用。左向きで描き、敵として出すときは反転） ---------- */
const FOED={
darkknight:{pal:{hair:'#3a3048',skin:'#8a7a9a',eye:'#ff4040',cloth:'#3a3048',cloth2:'#6a2a8a',trim:'#8a6ab0',metal:'#6e5e92',leather:'#2a2030',blade:'#b8b0e0',glow:'#b07cff'},
 head:[".....rr.......","....rrpr......","..mmnmmmmr....",".mnnmmmmmMM...","mnnmmmmmmmMM..","mnmmmmmmmmMM..","mMMMMMMmmmMM..","moxooxommmMM..","moooooommMM...",".mMmMmMmmM....","..mMmMmMM.....","...mmMM......."],
 torso:["..mmmmm..",".nnmmmMM.","nnmmmmMMM","nmmtmmMMM","nmmmmmMMM",".mmmmmMM.",".llyllLL.",".mmmmmM..","........."],
 weapon:'sword',weaponB:'shield',legs:'metal',boots:'metal',sleeve:'metal',glove:'metal',legGap:3,bigFoot:1,sbx:0,style:{atk:'slash',wa:30,fax:-4,fay:4,bax:-6,bay:5},
 back:(b,c)=>capeBack(b,Object.assign({tw:9},c),c.R.cloth2,12,4)},
minerghost:{pal:{hair:'#5a4a3a',skin:'#9aa8a0',eye:'#ffb030',cloth:'#6a5a4a',cloth2:'#3a3028',trim:'#e8c040',metal:'#8a8a94',leather:'#4a3a2a',blade:'#a8a8b4',glow:'#ffb030'},
 head:["..............","....yyyyyy....","..yyyyGGyyyy..",".yyyyyGGyyyyT.","TTTTTTTTTTTTTT",".hhhhhhhhhHH..",".SSsSSsSSSHH..",".SxSSxSSSHH...",".SSSSSSSSH....",".SoSoSoSS.....","..SSSSSS......","...SSSS......."],
 torso:["..SSS....",".kcccCC..","kkcccCCC.","kccccCCC.","kcccCCCC.",".lllLLL..",".ccccC...","........."],
 weapon:'pick',style:{atk:'heavy',wa:70,fax:-4,fay:2},poseFix:(p,a,i)=>{if(a==='idle'){p.ln=-2;p.hd=[-1,1];}return p;}},
onimusha:{pal:{hair:'#1e1e28',skin:'#c8584a',eye:'#ffe040',cloth:'#a03030',cloth2:'#2a2a34',trim:'#e0c040',metal:'#3a3a48',leather:'#2a2020',blade:'#e8ecf4',glow:'#ffe040'},
 head:[".y..........y.",".yy........yy.","..yymmmmmmyy..","..mmnnmmmmmM..",".mmnmmmmmmmMM.",".mtttttttttTM.",".mSSsSSsSSSMM.",".SxoSxoSSSSM..",".SSSSSSSSSM...",".SwSwSwSSS....","..SSSSSSS.....","...SSSS......."],
 torso:["..mmmmm..",".ccmmmCC.","cckcccCCC","ctctctCCC","ccccccCCC",".tttttTT.",".ccccCC..",".cc.cC...","........."],
 weapon:'katana',legs:'cloth2',legGap:3,style:{atk:'slash',wa:28,fax:-5,fay:3}},
drowned:{pal:{hair:'#2a5a5a',skin:'#7a9a9a',eye:'#40ffff',cloth:'#3a6a6a',cloth2:'#2a5a7a',trim:'#6ac0c0',metal:'#4a7a7a',leather:'#1a3a3a',blade:'#a0e0e0',glow:'#40ffff'},
 head:["......r.......",".....rpr......","..mmmnmmmm....",".mnnmmmmmMM...","mnnmmmmmmmMM..","mnmmmmmmmmMM..","mmMMMMMmmmMM..","mSxSSxSmmmMM..",".SSSSSSSmMMh..",".SSSSSSShh.h..","..SSSSSh..h...","...SSS........"],
 torso:["..mmmmm..",".nnmmmMM.","nnmtmmMMM","nmmtmmMMM","nmmmmmMMM",".mmmmmMM.",".llyllLL.",".mmmmmM..","........."],
 weapon:'spear',weaponB:'shield',legs:'metal',boots:'metal',sleeve:'metal',glove:'metal',legGap:3,bigFoot:1,sbx:0,style:{atk:'stab',wa:15,wb:90,fax:-3,fay:3,bax:-6,bay:5},
 poseFix:(p,a,i)=>{if(a==='atk'){p.ba=[-6,5];p.wb=90;}return p;},
 back:(b,c)=>{for(let k=0;k<3;k++)b.px(c.ox+6+k*2,c.oy-16-((k*3+c.i*2)%8),C('#9fe8ff'));}},
dragonewt:{pal:{hair:'#3a6a2a',skin:'#6a9a50',eye:'#ffe040',cloth:'#c0402a',cloth2:'#2a4a1c',trim:'#e0c040',metal:'#7a8a6a',leather:'#3a2a1a',blade:'#d0d8c8',glow:'#ff8030'},
 head:["..y........y..","..yy......yy..","...yhhhhhhy...",".hhiihhhhhhh..","hiihhhhhhhhhH.","sshhhhhhhhhHH.","sssSshhhhhhHH.","soxssssshhHH..","ssssssSShHH...","wswswsSS......",".sssssS.......","..SSS........."],
 torso:["..sss....",".ccmmmCC.","cckcccCCC","ccctccCCC","ccccccCCC",".lllyLL..",".sssSS...","........."],
 weapon:'gsword',legs:'skin',boots:'skin',sleeve:'skin',legGap:3,bigFoot:1,style:{atk:'heavy',wa:25,fax:-4,fay:4},
 back:(b,c)=>tailBack(b,c,c.R.skin,11)}
};
for(const k in FOED)regHero(k,FOED[k]);
/* 仲間と同じ姿で敵として出るもの */
function regAlias(key,base,over){const d=Object.assign({},SPDEF[base],over||{});if(over&&over.pal)d.pal=Object.assign({},SPDEF[base].pal,over.pal);SPDEF[key]=d;}
function voidAura(col){return(b,c)=>{const V=ramp(col),u=sway4(c.i);part(b,q=>{for(const sg of[-1,1])for(let k=0;k<3;k++)q.poly([[c.ox+4,c.oy-10],[c.ox+4+sg*(4+k*4)+6,c.oy-22+k*5-u*(k&1?1:-1)],[c.ox+8+sg*(2+k*3),c.oy-12+k*3]],V[k&1?1:2]);});for(let k=0;k<5;k++)b.px(c.ox-10+k*5+((c.i+k)&1),c.oy-26+((k*5+c.i*3)%30),V[0]);};}
regAlias('boss4','crow',{pal:{cloth:'#2a1838',cloth2:'#140a20',eye:'#ff2040',acc:'#ff2040',blade:'#ff5070',glow:'#ff2040',skin:'#a898b0'},back:voidAura('#7a2a9a')});
regAlias('boss4b','crow',{pal:{cloth:'#22323e',cloth2:'#101820',eye:'#40ffff',acc:'#40ffff',blade:'#9ff8ff',glow:'#40ffff',skin:'#b0c0c8'},back:voidAura('#2a8a9a')});
regAlias('ernaE','erna');regAlias('valkE','valk');
regAlias('last3','rio',{pal:{hair:'#4a1a7a',skin:'#c8b0e0',eye:'#ff40ff',cloth:'#2a1048',cloth2:'#160828',trim:'#ff80ff',leather:'#1a0a2a',blade:'#ff80ff',glow:'#ff40ff'},
 back:(b,c)=>{const V=ramp('#7a30c8'),u=sway4(c.i);part(b,q=>{for(const sg of[-1,1])for(let k=0;k<4;k++)q.poly([[c.ox+3,c.oy-11],[c.ox+3+sg*(6+k*4)+5,c.oy-27+k*6-u*(k&1?1:-1)],[c.ox+6+sg*(3+k*3),c.oy-14+k*3]],V[k&1?1:2]);});
  part(b,q=>{q.ell(c.ox,c.oy-27-u*.5,8,2.4,C('#ff80ff'));q.ell(c.ox,c.oy-27-u*.5,6,1.2,0);},1);for(let k=0;k<6;k++)b.px(c.ox-14+k*6+((c.i+k)&1),c.oy-30+((k*5+c.i*3)%34),k&1?WHT:C('#ff80ff'));}});
/* 色を奪う（虚蝕化）・幻影化の後処理 */
function postGrey(b){const s=b.d;for(let i=0;i<s.length;i++){const c=s[i];if(!c)continue;const l=cR(c)*.3+cG(c)*.59+cB(c)*.11;s[i]=cRGB(Math.min(255,l*.82+12),Math.min(255,l*.76+8),Math.min(255,l*.98+30));}}
function postPhantom(t){return b=>{const s=b.d,p=C('#5a2aa0');for(let i=0;i<s.length;i++){const c=s[i];if(!c)continue;const m=cMix(c,p,.55);s[i]=cRGB(cR(m)*t,cG(m)*t,cB(m)*t);}};}
/* 敵の種類→スプライト定義（動的に作られる虚蝕化・回廊の番人・試練の幻影にも対応） */
function resolveSpr(kind){if(SPDEF[kind])return kind;let m;
 if(kind.startsWith('vo_')){const base=resolveSpr(kind.slice(3));if(base){SPDEF[kind]=Object.assign({},SPDEF[base],{post:postGrey});return kind;}}
 if((m=/^kb(\d+)$/.exec(kind))&&typeof KBASE!=='undefined'){const f=+m[1],bk=f===30?'boss7':KBASE[(f/10-1)%KBASE.length][0];SPDEF[kind]=Object.assign({},SPDEF[bk],f===30?{col:'#d8c8ff',col2:'#6a5aa0',eye:'#ffe27a'}:{post:postGrey});return kind;}
 if((m=/^tr_([a-z]+)(\d)$/.exec(kind))&&SPDEF[m[1]]){SPDEF[kind]=Object.assign({},SPDEF[m[1]],{post:postPhantom(m[2]==='2'?.8:.62)});return kind;}
 if(typeof SPR!=='undefined'&&typeof HB!=='undefined'&&HB[kind]&&SPDEF[kind])return kind;
 return SPDEF.slime?'slime':null;}
{const _f=frameOf;frameOf=function(key,anim='idle',i=0,opt=''){const def=SPDEF[key];if(!def||!def.post)return _f(key,anim,i,opt);const a=aniOf(def,anim);i=((i%a.n)+a.n)%a.n;const ck=key+'|'+anim+'|'+i+'|'+opt;let f=FRC.get(ck);if(f)return f;
 const b=new Buf(def.w,def.h);def.draw(b,anim,i,def,opt);def.post(b);f={c:b.canvas(),w:null,ax:def.ax,ay:def.ay,W:def.w,H:def.h};FRC.set(ck,f);return f;};}
