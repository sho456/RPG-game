/* ===== ver0.30 図鑑のキャラクタービューア（ZVIEW） =====
 図鑑に載せる絵は「正面」「待機」「星臨」の 3 種だけ。キャラクターのデザイン・配色・体格・シルエットを
 そろえるための公式な基準画像として扱う（ver0.29 の回転・側面/背面・骨格・自動回転・表情は廃止）。
 ・縮尺の統一：3 種すべてを「同じ素材サイズ（sk）・同じ整数倍率（z）・同じ足元の線・同じキャンバス」で描く。
   sk と z は 3 種の絵をまとめて枠に収まるように 1 度だけ決めるので、形態を切り替えても拡大・縮小しない。
   星臨の素材（<id>_K）は通常の姿と同じ体格に作ってある（tools/spx_normalize.py・assets_src/character_scale.json）
 ・正面：素材の front（動かさない）。敵は正面の原画がある場合だけ
 ・待機：戦闘と同じ待機ポーズ（anim.js の IDLE）を、戦闘と同じ向き（FACING）で再生
 ・星臨：戦闘と同じ星臨の絵（<id>_K の awk）を、待機と同じ呼吸で再生。光の粒を添える
 ・提供原画の無い敵（旧リグ）：待機だけ（戦闘と同じ描き方）。
 ・連続フレーム（素材パックの anims）があれば、待機・星臨はそのコマを再生する（SPX.animFrame） */
const ZVIEW=(()=>{
const S={cv:null,raf:0,u:null,key:null,type:'h',motion:'idle',parts:[],plan:null,last:null,onInfo:null,fit:{}};
const NAMES={front:'正面',idle:'待機',seirin:'星臨'};

/* ---------- 対象の絵の構成 ---------- */
function spxOf(u){if(typeof SPX==='undefined'||!SPX.ready)return null;const A=ANIM.setup(u);if(A.none||!A.rig||!A.rig.spx)return null;const r=SPX.parse(u.spr)||SPX.parse(A.palKey);if(!r)return null;return{id:A.rig.spx,v:r.v||'',A};}
/* 掲載する形態と、縮尺を決めるのに使う絵（素材id・ポーズ名）の一覧 */
function planOf(u){const P=spxOf(u);
 if(!P){const A=ANIM.setup(u);return A.none?null:{legacy:1,modes:['idle']};}
 const c=SPX.D[P.id],hum=c.kind==='hum',K=hum&&u.side===0?SPX.D[P.id+'_K']:null,fs0=Object.values(c.sizes)[0].frames;
 const modes=[],refs=[];
 if(fs0.front){modes.push('front');refs.push([P.id,'front']);}
 modes.push('idle');refs.push([P.id,hum?'stance':'idle']);
 if(hum&&u.side===0&&(K||c.palAw)){modes.push('seirin');refs.push(K?[P.id+'_K','awk']:[P.id,'stance']);}
 return{id:P.id,v:P.v,hum,K:!!K,modes,refs};}
/* 素材サイズと倍率：3 種の絵をまとめた外枠（足元を合わせ、動きの余白を足す）が、枠の 80%（高さ）・90%（幅）に
   整数倍で収まる組のうち、大きく見えて、拡大率の低い（描き込みの多い）ものを選ぶ */
const MARGIN=6;/* 待機・星臨の揺れ（ドット）の余白 */
function fitOf(pl,Wd,Hd){const k=Wd+'x'+Hd;if(pl._fit&&pl._fitK===k)return pl._fit;const Z=SPX.D[pl.id].sizes;let best=null;
 for(const sk in Z){if(!'bB'.includes(sk[0]))continue;let L=0,R=0,T=0,ok=true;
  for(const[cid,nm]of pl.refs){const C=SPX.D[cid].sizes[sk],fr=C&&C.frames[nm];if(!fr){ok=false;break;}L=Math.max(L,fr[4]+1);R=Math.max(R,fr[2]-fr[4]);T=Math.max(T,fr[5]+1);}
  if(!ok)continue;const w=2*Math.max(L,R)+MARGIN*2,h=T+MARGIN;const z=Math.floor(Math.min(Hd*.80/h,Wd*.90/w));if(z<1)continue;
  const ref=Z[sk].frames[pl.refs[0][1]]||Object.values(Z[sk].frames)[0],sc=z*ref[3]*(1-.06*(z-1));if(!best||sc>best.sc)best={sk,z,sc};}
 if(!best){const sk=Object.keys(Z).filter(s=>'bB'.includes(s[0])).sort((a,b)=>Z[a].dots-Z[b].dots)[0];best={sk,z:1};}
 pl._fit=best;pl._fitK=k;return best;}

/* ---------- 1 コマ ---------- */
function frameOf(Wd,Hd){const u=S.u,pl=S.plan,mo=S.motion;
 if(pl.legacy){const A=ANIM.setup(u),R=A.rig,pose=ANIM.poseOf(u);const f=SPRX.frame(A.name,pose||ANIM.base(A),A.palKey,A.pal,A.flip,1,A.extra);if(!f)return null;
  const z=Math.max(1,Math.floor(Math.min(Hd*.70/(R.hgt||36),Wd*.50/(R.wid||22))));return{cv:f.cv,w:f.w,h:f.h,ax:f.ax,ay:f.ay,z};}
 const{sk,z}=fitOf(pl,Wd,Hd),c=SPX.D[pl.id],want=FACING.of(S.key,u.side),mir=cid=>FACING.mirror(SPX.D[cid].face,want);
 let f=null,dx=0,dy=0;
 if(mo==='front')f=SPX.cut(pl.id,sk,pl.v,'front',false,0,0);
 else{const pose=ANIM.poseOf(u)||{};
  if(mo==='seirin'&&pl.K){const a=SPX.AWS.stance,br=(pose.br||0)>.5?1:0;const an=SPX.animFrame(pl.id+'_K',sk,'awk');f=SPX.cut(pl.id+'_K',sk,'',an||'awk',mir(pl.id+'_K'),-a.l,an?0:br);dy=pose.y||0;}
  else if(pl.hum){const fs=c.sizes[sk].frames;let nm=SPX.heroFrame(pose);if(!fs[nm])nm=(SPX.FB[nm]||[]).find(n=>fs[n])||'stance';
   const an=SPX.animFrame(pl.id,sk,nm);f=SPX.cut(pl.id,sk,mo==='seirin'?'aw':pl.v,an||nm,mir(pl.id),0,!an&&nm==='stance'&&(pose.br||0)>.5?1:0);dx=(pose.x||0)*(want==='R'?1:-1);dy=pose.y||0;}
  else{const m=SPX.monShape(pose,ANIM.setup(u).rig.type==='hum'),an=SPX.animFrame(pl.id,sk,'idle');f=SPX.cut(pl.id,sk,pl.v,an||'idle',mir(pl.id),Math.max(-6,Math.min(6,m.shear))*(c.face==='R'?1:-1),an?0:m.breath,an?0:m.sq);dx=m.dx*(want==='R'?1:-1);dy=m.dy;}}
 if(!f)return null;
 dx=Math.max(-MARGIN,Math.min(MARGIN,Math.round(dx)));dy=Math.max(-MARGIN,Math.min(MARGIN,Math.round(dy)));
 return{cv:f.cv,w:f.w,h:f.h,ax:f.ax-dx,ay:f.ay-dy,z,sk};}

/* ---------- 描画（足元の線・中心はどの形態でも同じ） ---------- */
function draw(){const c=S.cv,u=S.u;if(!c||!u)return;const dpr=Math.min(3,devicePixelRatio||1),cw=c.clientWidth,ch=c.clientHeight;if(!cw||!ch)return;
 const Wd=Math.round(cw*dpr),Hd=Math.round(ch*dpr);if(c.width!==Wd||c.height!==Hd){c.width=Wd;c.height=Hd;}
 const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,Wd,Hd);ANIM.tick();
 const V=frameOf(Wd,Hd);if(!V)return;S.last=V;const z=V.z,gy=Math.round(Hd*.88),cx=Math.round(Wd/2);
 /* 床：格子と影（影の幅は形態によらず一定＝通常の待機の絵の幅） */
 g.fillStyle='rgba(255,255,255,.06)';for(let x=(cx%(z*8));x<Wd;x+=z*8)g.fillRect(x,gy,Math.max(1,z>>1),Hd-gy);g.fillRect(0,gy,Wd,z);
 const sw=Math.round((S.shadowW||V.w)*.36*z);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(cx-sw,gy-z,sw*2,z*2);
 g.drawImage(V.cv,Math.round(cx-(V.ax+.5)*z),Math.round(gy-(V.ay+1)*z),V.w*z,V.h*z);
 if(S.motion==='seirin'){if(Math.random()<.5)S.parts.push({x:(Math.random()-.5)*(S.shadowW||V.w)*.9,y:0,vy:-.35-Math.random()*.5,l:34,c:Math.random()<.3?'#ffffff':'#ffe27a'});
  S.parts=S.parts.filter(p=>p.l-->0);for(const p of S.parts){p.y+=p.vy;g.globalAlpha=Math.min(1,p.l/12);g.fillStyle=p.c;g.fillRect(Math.round(cx+p.x*z),Math.round(gy-z*2+p.y*z),z,z);}g.globalAlpha=1;}}
function loop(){if(!S.cv||!S.cv.isConnected){stop();return;}try{draw();}catch(e){console.error(e);stop();return;}S.raf=requestAnimationFrame(loop);}

/* ---------- 公開 ---------- */
/* type：'h'（プレイアブルキャラ）| 'e'（敵） */
function start(c,type,key){stop();const hero=type==='h';
 const u=hero?{id:key,side:0,spr:key,name:HB[key].name,x:0,y:0,sc:2,alive:true,hp:100,mhp:100,aw:false,awLv:(G.h[key]&&G.h[key].awLv)||1,guard:false,sts:[]}
  :{kind:key,side:1,spr:key,name:ED[key].name,x:0,y:0,sc:ED[key].sc||2,alive:true,hp:100,mhp:100,boss:!!ED[key].boss,charging:false,sts:[]};
 let A,pl;try{A=ANIM.setup(u);pl=A.none?null:planOf(u);}catch(e){console.error(e);pl=null;}if(!pl)return false;
 Object.assign(S,{cv:c,u,key,type,plan:pl,motion:pl.modes.includes('idle')?'idle':pl.modes[0],parts:[],last:null,shadowW:0});
 setMotion(S.motion);S.raf=requestAnimationFrame(loop);return true;}
function stop(){cancelAnimationFrame(S.raf);S.raf=0;S.cv=null;S.u=null;}
function setMotion(m){if(!S.u||!S.plan||!S.plan.modes.includes(m))return;S.motion=m;S.parts=[];S.u.aw=m==='seirin';
 try{ANIM.setup(S.u);ANIM.idle(S.u,1);}catch(e){}
 /* 影の幅：通常の待機の絵の幅（形態で変えない） */
 try{if(!S.plan.legacy&&S.cv){const dpr=Math.min(3,devicePixelRatio||1),{sk}=fitOf(S.plan,Math.round(S.cv.clientWidth*dpr),Math.round(S.cv.clientHeight*dpr)),fr=SPX.D[S.plan.id].sizes[sk].frames[S.plan.hum?'stance':'idle'];S.shadowW=fr?fr[2]:0;}}catch(e){}
 if(S.onInfo)try{S.onInfo({motion:m});}catch(e){}}
/* 戦闘での向き（FACING）を切り替える（待機・星臨の向きも同じになる） */
function flipBattle(){if(!S.u)return null;return FACING.toggle(S.key,S.u.side);}
const modes=()=>S.plan?S.plan.modes.slice():[];
return{start,stop,setMotion,flipBattle,modes,NAMES,S,set onInfo(f){S.onInfo=f;}};})();
