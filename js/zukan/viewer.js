/* ===== ver0.29 図鑑の回転ビューア（ZVIEW） =====
 キャラクターを回しながら、正面・側面・背面の全方向からモーション（通常・待機・星臨）を確認する。
 ・向き（yaw）：0°＝正面、90°＝左側面（左を向く）、180°＝背面、270°＝右側面。ドラッグ・自動回転・ボタンで回す
 ・回転の途中は、隣り合う 2 方向の絵を「幅を縮めて切り替える」ことで滑らかに見せ、止まるときは方向にぴたりと合わせる
   （止まった絵は必ず整数倍の拡大で、ドットが歪まない）
 ・使う絵：MOTION.VIEWS（js/motion/registry.js）の表。素材に無い向きは自動補完する
     背面が無い → 正面（敵は側面）を鏡写しにし、頭の肌の部分を髪の色で塗り、全体に陰を落とす
     正面が無い（敵）→ 側面の絵をそのまま使う
   補完した向きは画面に「自動補完」と表示する。原画に背面・正面を足せば自動で「原画」に切り替わる
 ・待機・星臨は戦闘と同じ待機ポーズ（anim.js の IDLE）から、呼吸・上下動・揺れをすべての向きに同じように付ける
 ・骨格：SKEL（js/motion/skeleton.js）の関節を重ねて表示。開発者モードでは関節をドラッグして修正できる */
const ZVIEW=(()=>{
const KEYS=[{a:0,v:'front'},{a:90,v:'side',d:'L'},{a:180,v:'back'},{a:270,v:'side',d:'R'}];
const YAWN=a=>{a=((Math.round(a)%360)+360)%360;return a===0?'正面':a===90?'左側面':a===180?'背面':a===270?'右側面':a<90?'左斜め前':a<180?'左斜め後ろ':a<270?'右斜め後ろ':'右斜め前';};
const S={cv:null,raf:0,u:null,key:null,type:'h',motion:'idle',yaw:90,target:null,vel:0,auto:false,drag:null,skel:false,parts:[],ui:{},last:null,szc:{},hold:null,onInfo:null};
const norm=a=>((a%360)+360)%360;
const sdiff=(a,b)=>{let d=norm(b-a);return d>180?d-360:d;};
const DEVM=()=>{try{return!!(G&&G.dev);}catch(e){return false;}};

/* ---------- 背面の自動補完 ---------- */
const REAR=new WeakMap();
const isSkin=(r,g,b)=>{const mx=Math.max(r,g,b),mn=Math.min(r,g,b);if(mx<120)return false;const s=(mx-mn)/mx;return r>=g&&g>=b*.9&&r-b>28&&s>.12&&s<.62;};
function rear(src,sk,hum){let c=REAR.get(src);if(c)return c;const w=src.width,h=src.height;c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 g.translate(w,0);g.scale(-1,1);g.drawImage(src,0,0);g.setTransform(1,0,0,1,0,0);const d=g.getImageData(0,0,w,h),p=d.data,at=(x,y)=>(y*w+x)*4;
 if(hum&&sk&&sk.joints.head){const hx=w-1-sk.joints.head.x,hy=sk.joints.head.y,r=sk.headR*1.25,inC=(x,y)=>(x-hx)*(x-hx)+(y-hy)*(y-hy)<=r*r;
  /* 髪の色：頭の上半分で、肌でも輪郭でもない色のうち最も多いもの */
  const cnt=new Map();let x0=1e9,y0=1e9,x1=-1,y1=-1;
  for(let y=Math.max(0,Math.floor(hy-r));y<=Math.min(h-1,hy+r);y++)for(let x=Math.max(0,Math.floor(hx-r));x<=Math.min(w-1,hx+r);x++){if(!inC(x,y))continue;const i=at(x,y);if(!p[i+3])continue;
   const R=p[i],G2=p[i+1],B=p[i+2];if(isSkin(R,G2,B)){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);continue;}
   if(y<hy&&R+G2+B>90){const k=(R>>4)<<8|(G2>>4)<<4|(B>>4);cnt.set(k,(cnt.get(k)||0)+1);}}
  if(x1>=0&&cnt.size){let bk=0,bn=-1;cnt.forEach((n,k)=>{if(n>bn){bn=n;bk=k;}});const hr=((bk>>8)&15)*16+8,hg=((bk>>4)&15)*16+8,hb=(bk&15)*16+8;
   for(let y=y0-1;y<=y1+1;y++)for(let x=x0-1;x<=x1+1;x++){if(x<0||y<0||x>=w||y>=h||!inC(x,y))continue;const i=at(x,y);if(!p[i+3])continue;
    const l=(p[i]*.3+p[i+1]*.59+p[i+2]*.11)/255,k=.72+l*.45;p[i]=Math.min(255,hr*k);p[i+1]=Math.min(255,hg*k);p[i+2]=Math.min(255,hb*k);}}}
 for(let i=0;i<p.length;i+=4){if(!p[i+3])continue;p[i]=p[i]*.84;p[i+1]=p[i+1]*.85;p[i+2]=Math.min(255,p[i+2]*.88+6);}
 g.putImageData(d,0,0);REAR.set(src,c);return c;}
const MIR=new WeakMap();
function mirrorCv(src){let c=MIR.get(src);if(c)return c;c=document.createElement('canvas');c.width=src.width;c.height=src.height;const g=c.getContext('2d');g.translate(c.width,0);g.scale(-1,1);g.drawImage(src,0,0);MIR.set(src,c);return c;}

/* ---------- 絵の取得 ---------- */
function spxOf(u){if(typeof SPX==='undefined'||!SPX.ready)return null;const A=ANIM.setup(u);if(A.none||!A.rig||!A.rig.spx)return null;const r=SPX.parse(u.spr)||SPX.parse(A.palKey);if(!r)return null;return{id:A.rig.spx,v:r.v||'',A};}
/* 表示サイズ：止まった絵が整数倍で、表示枠の 66%（高さ）・62%（幅）に収まり、なるべく大きい素材を使う */
function pickSize(id,name,Wd,Hd){const k=id+'|'+name+'|'+Wd+'|'+Hd;if(S.szc[k])return S.szc[k];const Z=SPX.D[id].sizes;let best=null;
 for(const sk in Z){if(!'bBu'.includes(sk[0]))continue;const fr=Z[sk].frames[name]||Object.values(Z[sk].frames)[0];const z=Math.floor(Math.min(Hd*.66/fr[3],Wd*.62/fr[2]));if(z<1)continue;
  /* 大きく見えるほど良いが、拡大率が高い（小さい素材を引き伸ばす）ほど減点：描き込みの多い大きい素材を優先する */
  const sc=z*fr[3]*(1-.06*(z-1));if(!best||sc>best.sc)best={sk,z,sc};}
 if(!best){const sk=Object.keys(Z).filter(s=>'bBu'.includes(s[0])).sort((a,b)=>Z[a].dots-Z[b].dots)[0];best={sk,z:1};}return S.szc[k]=best;}
/* view：'front'|'side'|'back'、dir：側面の向き 'L'|'R' → {cv,w,h,ax,ay,src,sk(骨格),mir} */
function getView(view,dir,pose,Wd,Hd){const u=S.u,P=spxOf(u),mo=S.motion;
 if(P){const c=SPX.D[P.id],hum=c.kind==='hum',aw=mo==='seirin'&&hum&&SPX.D[P.id+'_K'];const T=(MOTION.VIEWS[hum?'hum':'mon']||{})[aw?'seirin':mo==='seirin'?'idle':mo]||MOTION.VIEWS.hum.idle;
  const cid=aw?P.id+'_K':P.id,cc=SPX.D[cid],v=aw?'':P.v;
  const ref=aw?'awk':hum?'stance':'idle',sz=pickSize(cid,ref,Wd,Hd),fs=cc.sizes[sz.sk].frames;
  const want=view==='side'?dir:'L';let name=T[view],src='orig',auto=null;
  if(view==='side'&&hum&&!aw&&pose&&mo!=='base'){const n0=SPX.heroFrame(pose);name=fs[n0]?n0:(SPX.FB[n0]||[]).find(n=>fs[n])||T.side;}
  if(!name||!fs[name]){if(view==='back'){auto='rear';name=fs[T.front]?T.front:T.side;}else{name=T.side;src='auto';}}
  if(view!=='side'&&cc.derived&&cc.derived.includes(name))src='auto';
  /* 待機の動き：呼吸・上下・揺れ（敵は戦闘と同じ傾け・つぶれ） */
  let br=0,dx=0,dy=0,sh=0,sq=0;
  if(pose&&mo!=='base'){br=(pose.br||0)>.5?1:0;dy=pose.y||0;
   if(!hum){const m=SPX.monShape(pose,ANIM.setup(u).rig.type==='hum');br=m.breath;dy=m.dy;sq=m.sq;if(view==='side'){sh=Math.max(-6,Math.min(6,m.shear))*(c.face==='R'?1:-1);dx=m.dx*(want==='R'?1:-1);}}
   else if(view==='side')dx=(pose.x||0)*(want==='R'?1:-1);}
  const mir=view==='side'?FACING.mirror(cc.face,want):false;
  const f=SPX.cut(cid,sz.sk,v,name,auto?false:mir,auto?0:sh,br,sq);if(!f)return null;
  let cv=f.cv,ax=f.ax,sk=null;try{sk=SKEL.of(cid,sz.sk,name);}catch(e){}
  if(auto==='rear'){cv=rear(f.cv,sk,!!(sk&&sk.type==='hum'));ax=f.w-1-f.ax;src='auto';}
  return{cv,w:f.w,h:f.h,ax:ax-Math.round(dx),ay:f.ay-Math.round(dy),src,sk,mir:auto==='rear'?true:mir,z:sz.z,cid,sz:sz.sk,name,hum,edit:!auto};}
 /* 旧リグ（提供原画の無い敵）：戦闘と同じ描き方の側面を基準に、向きは鏡写し、背面は自動補完 */
 const A=ANIM.setup(u);if(A.none)return null;const R=A.rig;
 const f=SPRX.frame(A.name,pose||ANIM.base(A),A.palKey,A.pal,A.flip,1,A.extra);if(!f)return null;
 const drawn=FACING.of(A.palKey,A.flip?1:0),z=Math.max(1,Math.floor(Math.min(Hd*.62/(R.hgt||36),Wd*.46/(R.wid||22))));
 const want=view==='side'?dir:drawn;let cv=f.cv,ax=f.ax,mir=want!==drawn,src=view==='side'?'orig':'auto';
 const type=R.type==='hum'?'hum':(SKEL.TYPES[{wolf:'beast',slime:'blob',shroom:'blob',bookghost:'float'}[A.name]]?{wolf:'beast',slime:'blob',shroom:'blob',bookghost:'float'}[A.name]:'blob');
 let sk=null;try{sk=SKEL.ofCanvas(f.cv,type,f.ay,drawn);}catch(e){}
 if(view==='back'){cv=rear(f.cv,sk,type==='hum');ax=f.w-1-f.ax;mir=true;}else if(mir){cv=mirrorCv(f.cv);ax=f.w-1-f.ax;}
 return{cv,w:f.w,h:f.h,ax,ay:f.ay,src,sk,mir,z,hum:type==='hum',edit:false};}

/* ---------- 描画 ---------- */
function segment(yaw){yaw=norm(yaw);const i=Math.floor(yaw/90)%4,a=KEYS[i],b=KEYS[(i+1)%4],t=(yaw-a.a)/90;return{k:t<.5?a:b,t,sx:1-.34*Math.sin(Math.PI*t)};}
function draw(){const c=S.cv,u=S.u;if(!c||!u)return;const dpr=Math.min(3,devicePixelRatio||1),cw=c.clientWidth,ch=c.clientHeight;if(!cw||!ch)return;
 const Wd=Math.round(cw*dpr),Hd=Math.round(ch*dpr);if(c.width!==Wd||c.height!==Hd){c.width=Wd;c.height=Hd;}
 const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,Wd,Hd);ANIM.tick();
 u.aw=S.motion==='seirin'&&u.side===0;const A=ANIM.setup(u);
 const pose=S.motion==='base'?null:ANIM.poseOf(u);
 const sg=segment(S.yaw),V=getView(sg.k.v,sg.k.d,pose,Wd,Hd);if(!V)return;S.last=V;
 const z=V.z,gy=Math.round(Hd*.86),cx=Math.round(Wd/2),sx=sg.sx;
 /* 床：格子と影 */
 g.fillStyle='rgba(255,255,255,.06)';for(let x=(cx%(z*8));x<Wd;x+=z*8)g.fillRect(x,gy,Math.max(1,z>>1),Hd-gy);g.fillRect(0,gy,Wd,z);
 const sw=Math.round(V.w*.36*z*sx);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(cx-sw,gy-z,sw*2,z*2);
 const X=Math.round(cx-(V.ax+.5)*z*sx),Y=Math.round(gy-(V.ay+1)*z),Wi=Math.max(1,Math.round(V.w*z*sx));
 g.drawImage(V.cv,X,Y,Wi,V.h*z);
 /* 星臨：オーラと光の粒 */
 if(u.aw&&Math.random()<.5)S.parts.push({x:(Math.random()-.5)*V.w*.6,y:0,vy:-.35-Math.random()*.5,l:34,c:Math.random()<.3?'#ffffff':'#ffe27a'});
 S.parts=S.parts.filter(p=>p.l-->0);for(const p of S.parts){p.y+=p.vy;g.globalAlpha=Math.min(1,p.l/12);g.fillStyle=p.c;g.fillRect(Math.round(cx+p.x*z*sx),Math.round(gy-z*2+p.y*z),z,z);}g.globalAlpha=1;
 /* 骨格 */
 if(S.skel&&V.sk){const s=V.sk,P=j=>{const xr=V.mir?(s.w-1-j.x):j.x;return[X+(xr+.5)*z*sx,Y+(j.y+.5)*z];};
  g.lineWidth=Math.max(1,dpr);g.strokeStyle='rgba(255,255,255,.75)';
  for(const[a,b]of s.bones){const A2=s.joints[a],B2=s.joints[b];if(!A2||!B2)continue;const p=P(A2),q=P(B2);g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(q[0],q[1]);g.stroke();}
  for(const k in s.joints){const j=s.joints[k],[x,y]=P(j),r=(S.hold&&S.hold.j===k?5:3.2)*dpr;g.fillStyle=j.src==='manual'?'#7dffa8':j.src==='low'?'#ff9a6a':'#ffe27a';g.beginPath();g.arc(x,y,r,0,6.283);g.fill();g.strokeStyle='#14102a';g.stroke();}
  S.skelMap={X,Y,z,sx,mir:V.mir,s,V};}
 info(sg);}
let INF='';
function info(sg){const V=S.last,yn=YAWN(S.yaw),src=V&&V.src==='auto'?'自動補完':'原画',k=yn+'|'+src+'|'+S.motion+'|'+S.auto;if(k===INF)return;INF=k;
 const U=S.ui;if(U.view)U.view.textContent=yn;if(U.src){U.src.textContent=src;U.src.classList.toggle('auto',src!=='原画');}
 if(S.onInfo)try{S.onInfo({yaw:S.yaw,yawName:yn,src,motion:S.motion,auto:S.auto});}catch(e){}}

/* ---------- 回転 ---------- */
function step(){if(S.drag)return;
 if(S.auto){S.yaw=norm(S.yaw+.8);return;}
 if(Math.abs(S.vel)>.25){S.yaw=norm(S.yaw+S.vel);S.vel*=.9;if(Math.abs(S.vel)<=.25){S.vel=0;S.target=Math.round(S.yaw/90)*90;}return;}
 if(S.target!=null){const d=sdiff(S.yaw,S.target);if(Math.abs(d)<.4){S.yaw=norm(S.target);S.target=null;}else S.yaw=norm(S.yaw+d*.2+Math.sign(d)*.3);}}
function loop(){if(!S.cv||!S.cv.isConnected){stop();return;}try{step();draw();}catch(e){console.error(e);stop();return;}S.raf=requestAnimationFrame(loop);}
function bind(c){c.style.touchAction='none';
 c.addEventListener('pointerdown',e=>{const r=c.getBoundingClientRect(),dpr=c.width/r.width,px=(e.clientX-r.left)*dpr,py=(e.clientY-r.top)*dpr;
  /* 開発者モード：骨格の関節をつかむ（向きがぴたり止まっているときだけ） */
  if(S.skel&&DEVM()&&S.skelMap&&S.target==null&&!S.auto&&S.yaw%90===0&&S.last&&S.last.edit){const M=S.skelMap;let best=null,bd=(14*dpr)**2;
   for(const k in M.s.joints){const j=M.s.joints[k],xr=M.mir?(M.s.w-1-j.x):j.x,x=M.X+(xr+.5)*M.z*M.sx,y=M.Y+(j.y+.5)*M.z,d=(x-px)**2+(y-py)**2;if(d<bd){bd=d;best=k;}}
   if(best){S.hold={j:best,M};c.setPointerCapture(e.pointerId);return;}}
  S.drag={x:e.clientX,t:performance.now(),v:0};S.auto=false;S.target=null;S.vel=0;c.setPointerCapture(e.pointerId);});
 c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect(),dpr=c.width/r.width;
  if(S.hold){const M=S.hold.M,px=(e.clientX-r.left)*dpr,py=(e.clientY-r.top)*dpr;let x=(px-M.X)/(M.z*M.sx)-.5,y=(py-M.Y)/M.z-.5;if(M.mir)x=M.s.w-1-x;
   const j=M.s.joints[S.hold.j];j.x=Math.max(0,Math.min(M.s.w-1,x));j.y=Math.max(0,Math.min(M.s.h-1,y));j.src='manual';return;}
  if(!S.drag)return;const dx=e.clientX-S.drag.x,now=performance.now();S.yaw=norm(S.yaw-dx*.9);S.drag.v=-dx*.9/Math.max(8,now-S.drag.t)*16;S.drag.x=e.clientX;S.drag.t=now;});
 const up=()=>{if(S.hold){const M=S.hold.M,j=M.s.joints[S.hold.j],V=M.V;try{SKEL.setManual(V.cid,V.name,S.hold.j,j.x,j.y,M.s.w,M.s.h);}catch(e){}S.hold=null;if(S.onSkel)S.onSkel();return;}
  if(!S.drag)return;S.vel=Math.max(-14,Math.min(14,S.drag.v));S.drag=null;if(Math.abs(S.vel)<=.25){S.vel=0;S.target=Math.round(S.yaw/90)*90;}};
 c.addEventListener('pointerup',up);c.addEventListener('pointercancel',up);}

/* ---------- 公開 ---------- */
/* type：'h'（プレイアブルキャラ）| 'e'（敵）。ui：{view,src}（表示中の向き・素材の出どころを書く要素） */
function start(c,type,key,ui={}){stop();const hero=type==='h';
 const u=hero?{id:key,side:0,spr:key,name:HB[key].name,x:0,y:0,sc:2,alive:true,hp:100,mhp:100,aw:false,awLv:(G.h[key]&&G.h[key].awLv)||1,guard:false,sts:[]}
  :{kind:key,side:1,spr:key,name:ED[key].name,x:0,y:0,sc:ED[key].sc||2,alive:true,hp:100,mhp:100,boss:!!ED[key].boss,charging:false,sts:[]};
 let A;try{A=ANIM.setup(u);}catch(e){A={none:1};}if(A.none)return false;
 Object.assign(S,{cv:c,u,key,type,motion:'idle',yaw:FACING.of(key,hero?0:1)==='L'?90:270,target:null,vel:0,auto:false,drag:null,parts:[],ui,last:null,hold:null});INF='';
 if(!c._zv){c._zv=1;bind(c);}S.raf=requestAnimationFrame(loop);return true;}
function stop(){cancelAnimationFrame(S.raf);S.raf=0;S.cv=null;S.u=null;S.drag=null;S.hold=null;}
function setMotion(m){if(!S.u)return;if(m==='seirin'&&S.u.side!==0)return;S.motion=m;S.parts=[];INF='';if(S.u){S.u.aw=m==='seirin';try{ANIM.setup(S.u);ANIM.idle(S.u,1);}catch(e){}}}
function face(v){S.auto=false;S.vel=0;const side=FACING.of(S.key,S.u&&S.u.side)==='L'?90:270;
 S.target=v==='front'?0:v==='back'?180:v==='side'?((S.target??S.yaw)%360===side?(side===90?270:90):side):v==='L'?90:270;}
function turn(n){S.auto=false;S.vel=0;const b=S.target!=null?S.target:Math.round(S.yaw/90)*90;S.target=norm(b+n*90);}
function toggleAuto(){S.auto=!S.auto;S.vel=0;if(!S.auto)S.target=Math.round(S.yaw/90)*90;INF='';return S.auto;}
function toggleSkel(){S.skel=!S.skel;return S.skel;}
/* 戦闘での向き（FACING）を切り替え、側面を見ているならその向きへ回す */
function flipBattle(){if(!S.u)return null;const nx=FACING.toggle(S.key,S.u.side);if(Math.round(S.yaw)%180===90)S.target=nx==='L'?90:270;return nx;}
return{start,stop,setMotion,face,turn,toggleAuto,toggleSkel,flipBattle,rear,getView,S,set onInfo(f){S.onInfo=f;},set onSkel(f){S.onSkel=f;},YAWN};})();
