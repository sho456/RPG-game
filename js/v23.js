/* ===== ver0.23 戦闘画面・ダメージ演出・ホーム・図鑑・画面倍率・探索・星臨演出の改良 =====
 1. 戦闘画面：キャラ横のHP/SPを廃止し、画面下の「パーティ情報欄」（4人分）に統合。
    敵の情報は上部の固定帯に置き、キャラはその帯と下の行動順の間（演技エリア）だけに配置する。
    味方は全身が見える間隔で並べ（狭い画面では2列のジグザグ）、敵は互いに重ならない位置を探して置く
 2. ダメージ表示：数字・Critical・Weak・Guard・Miss・BREAK を同じ書体（斜体のコンデンス体）・縁取り・動きで統一。
    ダメージの割合で大きさを4段階に。味方への被ダメは味方の左側（敵側）に右寄せで出し、体に被せない
 3. ホーム：各要素の位置を実際の大きさから計算して、どの画面サイズでも重ならないようにする
 4. 図鑑：敵・仲間・装備をタップすると専用の詳細画面へ。ドット絵のモーション（待機・攻撃・魔法・被弾…）を再生できる
 5. 画面倍率：ホーム・施設・ワールドマップ・探索・戦闘で同じ倍率（画面幅いっぱい）に統一。戻ったときに拡大して見えない
 6. 探索：テキスト表示の切り替え。非表示のときはマップを広げ、新しい知らせは地図の下に短く流す
 7. 星臨：演出テキスト（カットイン）が終わってから、星臨のアニメーション（光の柱・ポーズ）を再生する
 既存の処理は包む（ラップする）か、同じ動作を保ったまま置き換える。セーブデータの形は変えない（設定に1項目追加のみ） */
'use strict';
const VER23='ver0.23';
const V23=(()=>{
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const px=v=>parseFloat(v)||0;
const app=$('#app');app.classList.add('v23');
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const DEV=()=>{try{return!!(G&&G.dev);}catch(e){return false;}};
const appW=()=>Math.max(240,Math.min(app.clientWidth||innerWidth,480));
const oh=el=>{if(!el||!el.isConnected)return 0;const s=getComputedStyle(el);if(s.display==='none')return 0;return el.offsetHeight+px(s.marginTop)+px(s.marginBottom);};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* ==================== 5. 画面倍率の統一 ====================
 原因：ホーム（と戦闘）は「画面幅いっぱい＝小数倍」、施設・ワールドマップ・探索は「整数倍（2倍）」で描いていたため、
 施設からホームへ戻ると絵が約8%大きくなり、拡大されたように見えていた。
 対策：キャンバスを使う画面はすべて同じ倍率（画面幅 ÷ 論理幅）・同じ描画領域（左右いっぱい）にそろえる */
{const _fit=fit;fit=function(){if(scene==='town'||scene==='field'){const aw=appW(),st=$('#stage');SC=aw/W;const h=Math.round(H*SC);
  cv.style.width=aw+'px';cv.style.height=h+'px';st.style.width=aw+'px';st.style.height=h+'px';
  app.classList.toggle('home22',scene==='town'&&TSC==='home'&&V22.HM.on);if(scene==='field'&&F)fitField();return;}
 _fit();};}
/* 画面が切り替わるときは、拡大・移動なしの短いフェードだけにする */
let TRK='';
function fadeIn(){const k=scene+'|'+(typeof TSC!=='undefined'?TSC:'');if(k===TRK)return;TRK=k;app.classList.remove('tr23');void app.offsetWidth;app.classList.add('tr23');}
{const _sh=show;show=function(m){_sh(m);app.dataset.sc=m;fadeIn();if(m!=='battle'){const p=$('#pt23');if(p)p.innerHTML='';}};}
{const _ro=roomOpen;roomOpen=function(...a){const r=_ro(...a);fadeIn();try{fit();}catch(e){}return r;};}

/* ==================== 1. 戦闘画面 ==================== */
const LY={top:40,bot:150,heroL:118,hudPx:80,botPx:46};
const CMDMIN=()=>innerHeight<620?128:innerHeight<700?146:innerHeight<800?160:172;
/* 上の固定帯（敵の名前・HP・弱点）と、下の行動順・星臨ボタンの高さ（画面px） */
function hudPx(){const hd=$('#bt22 .b22hd'),bt=$('#bt22 .b22btn');let h=0;if(hd&&hd.offsetParent)h=hd.offsetTop+hd.offsetHeight;if(bt&&bt.offsetParent)h=Math.max(h,bt.offsetTop+bt.offsetHeight);return Math.max(h,58);}
function botPx(){const st=$('#stage'),o=$('#bt22 .b22ord'),a=$('#bt22 .b22aw');if(!st)return 46;const sh=st.offsetHeight;let t=sh;for(const e of[o,a])if(e&&e.offsetParent)t=Math.min(t,e.offsetTop);return Math.max(40,sh-t);}
function battleH(){const sc=appW()/W,ch=V21.contentH(),used=Math.max(oh($('#msg')),40)+Math.max(oh($('#pt23')),76)+Math.max(oh($('#bbar')),44)+CMDMIN();
 return clamp(Math.floor((ch-used)/sc),132,300);}
/* 味方：右側に縦に並べる。間隔が体の高さより狭いときは2列のジグザグにして、全身が重ならないようにする */
function placeHeroes(){const hs=B.heroes,n=hs.length;if(!n)return;let hh=0,ww=0;hs.forEach(h=>{const D=V19.dims(h);hh=Math.max(hh,D.h);ww=Math.max(ww,D.w);});
 const band=LY.bot-LY.top,back=W-12-ww/2,dx=ww+6;
 /* 1列に入るなら1列（ゆるい弓なり）。入らなければ列を増やす（2列＝ジグザグ、さらに狭ければ斜め一列） */
 let c=1;for(;c<n;c++){const k=Math.ceil(n/c);if(k===1||(band-hh)/(k-1)>=hh+2)break;}const k=Math.ceil(n/c),s=k>1?(band-hh)/(k-1):0;
 hs.forEach((h,i)=>{let fx,fy;
  if(c===1){fy=n===1?LY.top+hh+(band-hh)*.62:LY.top+hh+s*i;fx=back-Math.round(9*Math.sin(Math.PI*(i+.5)/n));}
  else if(k===1){fx=back-i*dx*.82;fy=LY.top+hh+(band-hh)*(n>1?i/(n-1):.5);}
  else{const col=i%c,row=Math.floor(i/c);fx=back-col*dx;fy=LY.top+hh+row*s+(col%2?Math.min(s/2,band-hh-row*s):0);}
  fy=Math.min(fy,LY.bot);h.x=fx-8*h.sc;h.y=Math.round(fy-16*h.sc+2);h._fx23=fx;});
 LY.heroL=Math.min(...hs.map(h=>h._fx23))-ww/2;}
/* 敵：演技エリアの中で、互いに重ならない位置を探す（ボスは中央寄り、手下は手前と上下へ） */
const ANC={1:[[.5,.62]],2:[[.3,.4],[.68,.8]],3:[[.26,.3],[.7,.56],[.3,.88]],4:[[.26,.28],[.72,.4],[.26,.72],[.72,.9]],5:[[.2,.25],[.6,.3],[.25,.65],[.75,.7],[.45,.95]]};
const BANC=[[.86,.22],[.86,.92],[.14,.18],[.14,.96]];
function eDims(e){const D=V19.dims(e);return{w:D.w,h:D.h};}
function capScale(e,band,wid){const A=e.A;if(!A||A.none)return;if(A.sc23==null)A.sc23=A.sc;A.sc=A.sc23;e._cap23=0;const D=eDims(e),k=Math.min(1,band*.96/D.h,wid*.96/D.w);if(k<1){A.sc=A.sc23*k;e._cap23=A.sc;}}
function placeEnemies(full){const x0=3,x1=Math.max(60,LY.heroL-10),band=LY.bot-LY.top,es=B.enemies;
 const fixed=full?[]:es.filter(e=>e._p23&&e.alive),todo=full?es.filter(e=>e.alive||!e._p23):es.filter(e=>!e._p23);if(!todo.length)return;
 const box=e=>{const D=eDims(e),fx=e.x+8*e.sc,fy=e.y+16*e.sc-2;return[fx-D.w/2,fy-D.h,fx+D.w/2,fy];};
 const placed=fixed.map(box),boss=es.some(e=>e.boss&&e.alive),bossT=todo.filter(e=>e.boss),mins=todo.filter(e=>!e.boss);
 const order=[...bossT,...mins],nM=mins.length+(full?0:fixed.filter(e=>!e.boss).length);let mi=full?0:fixed.filter(e=>!e.boss).length;
 for(const e of order){ANIM.setup(e);capScale(e,band,x1-x0);let ax,ay;
  if(e.boss){ax=.4;ay=.62;}else{const k=mi++;const L=boss?BANC:(ANC[Math.min(5,Math.max(1,nM))]||ANC[5]);const a=L[k%L.length];ax=a[0];ay=a[1];}
  /* 重ならない場所が無ければ、その敵を少しずつ縮めて探し直す（最小72%） */
  let best=null;for(const shrink of[1,.86,.72]){if(shrink<1&&e.A&&!e.A.none){e.A.sc=(e._cap23||e.A.sc23||e.A.sc)*shrink;e._cap23=e.A.sc;}
   const D=eDims(e),fxA=x0+D.w/2+(x1-x0-D.w)*ax,fyA=LY.top+D.h+(band-D.h)*ay;let bc=1e18,bo=0;best=null;
   for(let fy=LY.top+D.h;fy<=LY.bot+.01;fy+=2)for(let fx=x0+D.w/2;fx<=x1-D.w/2+.01;fx+=2){const b=[fx-D.w/2-2,fy-D.h-2,fx+D.w/2+2,fy+2];let ov=0;
     for(const p of placed){const ix=Math.min(b[2],p[2])-Math.max(b[0],p[0]),iy=Math.min(b[3],p[3])-Math.max(b[1],p[1]);if(ix>0&&iy>0)ov+=ix*iy;}
     const c=ov*60+Math.hypot(fx-fxA,(fy-fyA)*1.2);if(c<bc){bc=c;bo=ov;best=[fx,fy];}}
   if(!best)best=[fxA,fyA];if(bo<=0)break;}
  e.x=best[0]-8*e.sc;e.y=Math.round(best[1]-16*e.sc+2);e._p23=1;placed.push(box(e));}}
function layout(full=true){if(scene!=='battle'||!B)return;const nh=battleH();if(nh!==H){setH(nh);try{BG=makeBg(V22.BL.th,V22.BL.boss);if(typeof VOIDED!=='undefined'&&VOIDED&&typeof desat==='function')BG=desat(BG);}catch(e){}}else fit();
 LY.hudPx=hudPx();LY.botPx=botPx();LY.top=(LY.hudPx+6)/SC;LY.bot=H-(LY.botPx+3)/SC;if(LY.bot-LY.top<44)LY.bot=LY.top+44;
 placeHeroes();placeEnemies(full);app.style.setProperty('--hud23',LY.hudPx+'px');app.style.setProperty('--bot23',LY.botPx+'px');refresh();}
{const _sb=startBattle;startBattle=function(list,opts){const r=_sb(list,opts);try{PT.sig='';ensurePT();renderPT();layout(true);requestAnimationFrame(()=>{try{layout(true);}catch(e){}});}catch(e){console.error(e);}return r;};}
addEventListener('resize',()=>{if(scene==='battle')requestAnimationFrame(()=>requestAnimationFrame(()=>{try{layout(true);}catch(e){}}));});
/* 召喚・形態変化で後から出た敵も、重ならない位置へ置く。縮めた敵の大きさを保つ */
{const _d=draw;draw=function(){_d();if(scene!=='battle'||!B)return;try{for(const e of B.enemies){if(e._cap23&&e.A&&e.A.sc>e._cap23+1e-6)e.A.sc=e._cap23;}if(B.enemies.some(e=>!e._p23))placeEnemies(false);}catch(e){if(!draw._e23){draw._e23=1;console.error(e);}}};}

/* ---------- 下部のパーティ情報欄（4人分の HP・SP・星臨ゲージ・状態） ---------- */
const PT={sig:''};
function ensurePT(){let el=$('#pt23');if(!el){el=document.createElement('div');el.id='pt23';$('#party').after(el);
  el.addEventListener('click',e=>{const c=e.target.closest('.pc23');if(!c||!B)return;const h=B.heroes[+c.dataset.i];if(h){SFX.sel();heroSheet(h);}});}return el;}
const STN=s=>{try{return s.k==='weak'?s.el:(V20.STN[s.k]||['',''])[1];}catch(e){return s.k;}};
const isBuff=s=>{try{return V20.isBuff(s);}catch(e){return false;}};
function stHTML(h,max=3){const L=(h.sts||[]);const v=L.slice(0,max).map(s=>`<i class="${isBuff(s)?'bu':'de'}">${STN(s)}${['atk','def','mag','res','spd','crit'].includes(s.k)?(s.v>0?'▲':'▼'):''}</i>`).join('');return v+(L.length>max?`<i class="mo">+${L.length-max}</i>`:'')+(h.guard?'<i class="gd">防御</i>':'');}
function renderPT(){const el=ensurePT();if(!B)return;const sig=B.heroes.map(h=>h.id).join(',');if(PT.sig!==sig||!el.firstChild){PT.sig=sig;
  el.innerHTML=B.heroes.map((h,i)=>`<div class="pc23" data-i="${i}" style="--ec:${elCol(h.id)}"><div class="r1"><img class="fc" alt=""><div class="nm"><b>${esc(h.name)}</b><span class="st"></span></div></div>
   <div class="hp"><em>HP</em><b class="hv"></b></div><div class="hb"><u></u><i></i></div><div class="sp"><em>SP</em><b class="sv"></b><div class="sb"><i></i></div></div><div class="ag"><s><i></i></s><span></span></div></div>`).join('');}
 const cur=B.cur&&B.cur.side===0?B.cur:null,dev=DEV();
 B.heroes.forEach((h,i)=>{const c=el.children[i];if(!c)return;const hp=Math.max(0,h.hp),pc=h.mhp?hp/h.mhp*100:0,low=h.alive&&pc<30,G2=typeof GAUGE!=='undefined'&&GAUGE.includes(h.id);
  const cls=`pc23${cur===h?' cur':''}${h.alive?'':' down'}${low?' low':''}${h.aw?' awk':''}${!h.aw&&h.ag>=100&&h.alive?' full':''}`;if(c.className!==cls)c.className=cls;
  const fc=c.querySelector('.fc'),f=face(h.id,h.aw);if(fc.getAttribute('src')!==f)fc.src=f;
  const hv=c.querySelector('.hv'),ht=String(hp);if(hv.textContent!==ht)hv.textContent=ht;
  const bw=pc.toFixed(1)+'%',bi=c.querySelector('.hb i'),bu=c.querySelector('.hb u');if(bi.style.width!==bw){bi.style.width=bw;bu.style.width=bw;}
  const sv=c.querySelector('.sv'),st=dev?'∞':String(h.sp);if(sv.textContent!==st)sv.textContent=st;const sb=c.querySelector('.sb i'),sw=(dev?100:clamp(h.sp,0,100))+'%';if(sb.style.width!==sw)sb.style.width=sw;
  let gw,gt;if(h.aw){gw=G2?h.ag:clamp((1-h.awT/Math.max(1,awN(h)))*100,0,100);gt=G2?Math.round(h.ag)+'':'残'+Math.max(0,awN(h)-h.awT);}else{gw=Math.min(100,h.ag);gt=h.ag>=100?SEIRIN.n+'OK':Math.floor(h.ag)+'%';}
  const ag=c.querySelector('.ag i'),aw=gw.toFixed(1)+'%';if(ag.style.width!==aw)ag.style.width=aw;const as=c.querySelector('.ag span');if(as.textContent!==gt)as.textContent=gt;
  const sh=stHTML(h),se=c.querySelector('.st');if(se._h!==sh){se._h=sh;se.innerHTML=sh;}});}
function heroSheet(h){const sts=(h.sts||[]).map(s=>`<li class="${isBuff(s)?'bu':'de'}"><b>${esc(STN(s))}${['atk','def','mag','res','spd','crit'].includes(s.k)?(s.v>0?'▲':'▼'):''}</b><span>${s.t<50?'残り'+s.t+'ターン':'戦闘中ずっと'}</span></li>`).join('');
 ovOpen(`<div class="hs23" style="--ec:${elCol(h.id)}"><div class="hh"><img src="${art(h.id,h.aw)}" alt=""><div><b>${esc(h.name)}</b><small>Lv${G.h[h.id].lv}　${esc(clsOf(h.id))}</small></div></div>
  <dl class="dl22"><dt>HP</dt><dd>${Math.max(0,h.hp)} / ${h.mhp}</dd><dt>SP</dt><dd>${DEV()?'∞':h.sp} / 100</dd><dt>${SEIRIN.g}</dt><dd>${h.aw?SEIRIN.n+'中（'+esc(AW[h.id].name)+'）':Math.floor(h.ag)+'%'}</dd><dt>状態</dt><dd>${h.alive?(h.guard?'防御中':'通常'):'戦闘不能'}</dd></dl>
  ${sts?`<ul class="sl23">${sts}</ul>`:'<div class="nn">強化・弱体はかかっていない</div>'}</div><button class="tbtn back wide" data-a="close">閉じる</button>`,{close:ovClose});}
{const _rf=refresh;refresh=function(){_rf();if(!B||scene!=='battle')return;try{renderPT();}catch(e){console.error(e);}};}

/* ==================== 2. ダメージ・戦闘演出 ==================== */
/* 書式：大きな数は「万」でまとめる（663万） */
const fmtN=n=>{n=Math.abs(n|0);return n>=100000?`${Math.floor(n/10000)}<small>万</small>`:String(n);};
const KANJI=/^[぀-ヿ一-鿿]/;
function anchor(u){const A=u.A||{};let fx,fy,D;try{[fx,fy]=V19.foot(u);D=V19.dims(u);}catch(e){fx=u.x+8*u.sc;fy=u.y+16*u.sc;D={w:16,h:24};}
 fx+=(A.wx||0)+(A.kb||0);fy+=(A.wy||0);return{fx,fy,w:D.w,h:D.h};}
function popLayer(){let L=$('#pp23');if(!L||!L.isConnected){L=document.createElement('div');L.id='pp23';$('#stage').appendChild(L);}return L;}
const LIFE=k=>Math.round(k*(speed>=4?.7:speed>=2?.85:1));
/* 同じ相手への表示は段をずらして積む（重ならない） */
function slotOf(u){const now=performance.now();u._pp23=(u._pp23||[]).filter(p=>p.end>now&&p.el.isConnected);const used=new Set(u._pp23.map(p=>p.s));let s=0;while(used.has(s))s++;return s;}
function placePop(el,u,slot){const a=anchor(u),st=$('#stage'),SW=st.offsetWidth,SH=st.offsetHeight,w=el.offsetWidth,h=el.offsetHeight,hero=u.side===0;
 /* 下の段にいる表示の高さの分だけずらす（重ならない） */
 const now=performance.now(),off=(u._pp23||[]).filter(p=>p.s<slot&&p.end>now&&p.el.isConnected).reduce((t,p)=>t+p.el.offsetHeight*.9,0);
 let x,y;if(hero){x=(a.fx-a.w/2-4)*SC-w-(slot%2?8:0);y=(a.fy-a.h*.62)*SC-h/2+off;}
 else{x=(a.fx)*SC-w/2+(slot%2?12:0);y=(a.fy-a.h*.55)*SC-h/2-off;}
 const xmax=hero?SW-4-w:Math.max(4,Math.min(SW-4,LY.heroL*SC-4)-w);
 x=clamp(x,4,Math.max(4,xmax));y=clamp(y,LY.hudPx+2,Math.max(LY.hudPx+2,SH-LY.botPx-h-2));el.style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px)`;}
function mkPop(u,cls,inner,life){const L=popLayer(),el=document.createElement('div');el.className='p23 '+(u.side===0?'h ':'e ')+cls;el.innerHTML=`<div class="in">${inner}</div>`;
 el.style.setProperty('--life',life+'ms');L.appendChild(el);const s=slotOf(u);placePop(el,u,s);const rec={el,s,end:performance.now()+life,t:performance.now()};u._pp23.push(rec);setTimeout(()=>el.remove(),life+40);return rec;}
function baseFs(u){return u.side===0?clamp(SC*8.6,17,23):clamp(SC*11.5,22,31);}
function tierOf(u,d){const r=d/Math.max(1,u.mhp||1);return r>=.35?3:r>=.15?2:r>=.05?1:0;}
const TIERK=[1,1.14,1.32,1.55];
function dmgPop(u,s,kind,el){const v=parseInt(s,10),heal=s[0]==='+',crit=/crit/.test(kind),weak=/weak/.test(kind),psn=/psn/.test(kind),grd=u.side===0&&!heal&&!!u.guard,t=heal?0:tierOf(u,Math.abs(v));
 const fs=Math.round(baseFs(u)*TIERK[t]*(crit?1.18:1)*(heal?.9:1));
 const lb=(crit?'<span class="cr">Critical</span>':'')+(weak?`<span class="wk">Weak${el?`<b>${esc(el)}</b>`:''}</span>`:'')+(grd?'<span class="gd">Guard</span>':'')+(psn?'<span class="sb23">毒</span>':'');
 const cls=`dmg t${t}${crit?' crit':''}${weak?' weak':''}${heal?' heal':''}${psn?' psn':''}${grd?' grd':''}`;
 const r=mkPop(u,cls,`<div class="lb">${lb}</div><div class="n" style="font-size:${fs}px">${heal?'+':''}${fmtN(v)}</div>`,LIFE(crit||t>=2?1350:1150));
 r.dmg=1;u._lb23=r;if(crit||t>=3){r.el.classList.add('fl');}return r;}
function wordPop(u,s,kind){const miss=s==='MISS',brk=/brk/.test(kind)||/^BREAK/.test(s);const fs=Math.round(baseFs(u)*(brk?1.05:.9));
 return mkPop(u,miss?'word miss':'word brk',`<div class="w" style="font-size:${fs}px">${miss?'Miss':'BREAK!!'}</div>`,LIFE(brk?1300:1000));}
/* 小さな文字（状態・AG+・DELAY など）。直前のダメージ表示があれば、その見出しに加える（Guard／スタン／430 の形） */
function tagPop(u,s,col,kind){const now=performance.now();
 const R=u._lb23;if(R&&now-R.t<420&&R.el.isConnected&&!/fu/.test(kind||'')){const lb=R.el.querySelector('.lb');if(lb&&lb.children.length<4){lb.insertAdjacentHTML('beforeend',`<span class="sb23">${esc(s)}</span>`);placePop(R.el,u,R.s);return;}}
 const up=/\bup\b/.test(kind||''),dn=/\bdn\b/.test(kind||'');
 /* 同じ相手へほぼ同時に出る状態表示（攻撃↑・魔力↑…）は1行にまとめる */
 const T0=u._tg23;if(T0&&now-T0.t<350&&T0.el.isConnected&&T0.n<4){const g=T0.el.querySelector('.in');g.insertAdjacentHTML('beforeend',`<div class="g" style="--c:${col||'#fff'}">${esc(s)}</div>`);T0.n++;placePop(T0.el,u,T0.s);return;}
 const r=mkPop(u,'tag'+(up?' up':dn?' dn':'')+(KANJI.test(s)?' jp':''),`<div class="g" style="--c:${col||'#fff'}">${esc(s)}</div>`,LIFE(1000));r.n=1;u._tg23=r;}
const _pop0=V17F.pop;
function pop23(u,txt,col,small,kind,el){kind=kind||'';if(scene!=='battle'||!B||!u||u.x==null)return _pop0(u,txt,col,small,kind,el);
 try{const s=String(txt);
  if(/fu/.test(kind)&&small){skBanner(s,u.side);return;}
  if(!small&&/^[+\-]?\d+$/.test(s))return void dmgPop(u,s,kind,el);
  if(s==='MISS'||/brk/.test(kind)||/^BREAK/.test(s))return void wordPop(u,s,kind);
  tagPop(u,s,col,kind);}catch(e){console.error(e);_pop0(u,txt,col,small,kind,el);}}
V17F.pop=pop23;
/* 技名：上の固定帯のすぐ下、中央に出す（キャラに被らない） */
function skBanner(n,side){let k=$('#skn20');if(!k){k=document.createElement('div');k.id='skn20';$('#stage').appendChild(k);}k.className=side?'e':'';k.innerHTML=`<b>${esc(n)}</b>`;k.classList.remove('show');void k.offsetWidth;k.classList.add('show');}
/* 連撃数（HITS）も上の帯の下・右寄せに */

/* ==================== 7. 星臨：テキスト → アニメーション の順に ====================
 これまで：カットイン（文字）と、キャラのポーズ・光の柱が同時に始まり重なっていた。
 これから：①カットイン（「星」「臨」→ 名前と星座名）を出し切って消す → ②戦場に戻して光の柱・ポーズ・衝撃を再生 */
function seirinText(u){return new Promise(res=>{const st=$('#stage');st.querySelectorAll('.bossin').forEach(e=>e.remove());let c=$('#sr23');if(!c){c=document.createElement('div');c.id='sr23';st.appendChild(c);}
 const A=AW[u.id],lv=u.awLv||1,ec=elCol(u.id),k=speed>=4?.6:speed>=2?.8:1;c.style.setProperty('--ec',ec);c.style.setProperty('--k',k);
 c.innerHTML=`<div class="bg"><i></i><i></i><i></i></div><div class="kj"><b>星</b><b>臨</b></div><div class="tx"><div class="t">${esc(u.name)} ― ${SEIRIN.en}${lv>1?'　位階'+ROMAN[lv]:''}</div><div class="b">《${esc(A.name)}》</div></div><img class="pf" src="${art(u.id,true)}" alt="">`;
 c.className='on';try{tone(523,.08,'triangle',.05);setTimeout(()=>tone(784,.12,'triangle',.05),110);}catch(e){}
 setTimeout(()=>{c.className='on out';},Math.round(1350*k));setTimeout(()=>{c.className='';c.innerHTML='';res();},Math.round(1700*k));});}
{const _aw=awaken;awaken=async function(u){if(!B||scene!=='battle')return _aw(u);const cut=$('#cut');
  try{await seirinText(u);}catch(e){console.error(e);}
  cut.classList.add('mute23');B.flashBg=Math.max(B.flashBg||0,26);
  try{return await _aw(u);}finally{cut.classList.remove('mute23');try{const[x,y]=V19.mid(u);FX19.ring(x,y,'#ffffff',{r1:30,dur:420});}catch(e){}}};}

/* ==================== 6. 探索：テキスト表示の切り替え ====================
 右下の「文」ボタンで、下のテキスト欄を表示／非表示にする（設定に保存）。
 非表示のときはテキスト欄の分だけマップを縦に広げ、新しい知らせはマップ下部に短く流す（タップでテキスト欄を戻す） */
const msgHidden=()=>!!(G&&G.set&&G.set.fmsg23);
function fieldUI(){if(scene!=='field')return;const st=$('#stage');let b=$('#ft23');
 if(!b){b=document.createElement('button');b.id='ft23';b.type='button';st.appendChild(b);b.addEventListener('pointerdown',e=>e.stopPropagation());
  b.addEventListener('click',e=>{e.stopPropagation();SFX.sel();G.set.fmsg23=!msgHidden();try{save();}catch(x){}applyFieldMsg(true);});}
 let k=$('#fk23');if(!k){k=document.createElement('div');k.id='fk23';st.appendChild(k);k.addEventListener('pointerdown',e=>e.stopPropagation());k.addEventListener('click',e=>{e.stopPropagation();G.set.fmsg23=false;try{save();}catch(x){}applyFieldMsg(true);});}
 const h=msgHidden();b.innerHTML=`<b>文</b><small>${h?'表示':'隠す'}</small>`;b.classList.toggle('off',h);b.setAttribute('aria-label',h?'テキストを表示':'テキストを隠す');}
function applyFieldMsg(anim){const h=msgHidden()&&scene==='field';app.classList.toggle('fmh23',h);fieldUI();if(!h){const k=$('#fk23');if(k)k.classList.remove('show');}
 if(scene==='field'&&F){fitField();if(anim)fadeIn();}}
/* マップの高さ：テキスト欄・仲間の欄・ボタンを除いた残りすべて（16の倍数に切り捨てない＝下に余白を残さない） */
fitField=function(){if(scene!=='field'||!F)return;const cmd=$('#cmd'),mapH=(typeof MH!=='undefined'?MH:24)*16;let slack=0;
 /* ボタン欄（#cmd）は残りの高さを埋めて伸びるので、その中の「余り」をマップに回す */
 try{const kids=[...cmd.children].filter(e=>e.offsetParent);if(kids.length){const cr=cmd.getBoundingClientRect(),bot=Math.max(...kids.map(e=>e.getBoundingClientRect().bottom));slack=cr.bottom-px(getComputedStyle(cmd).paddingBottom)-bot-4;}}catch(e){}
 const h=clamp(H+Math.floor(slack/SC),144,Math.min(mapH,560));if(h!==H)setH(h);};
/* テキスト非表示中に届いた知らせを、マップの下に短く出す */
let FKT=0;
new MutationObserver(()=>{if(scene!=='field'||!msgHidden())return;const m=$('#msg'),k=$('#fk23');if(!m||!k)return;const html=m.innerHTML.trim();if(!html||k._h===html)return;k._h=html;
 k.innerHTML=`<span>${html}</span>`;k.classList.remove('show');void k.offsetWidth;k.classList.add('show');clearTimeout(FKT);FKT=setTimeout(()=>k.classList.remove('show'),3600);}).observe($('#msg'),{childList:true,subtree:true,characterData:true});
{const _ef=enterField;enterField=function(...a){const r=_ef(...a);try{applyFieldMsg(false);}catch(e){console.error(e);}return r;};}
{const _sh=show;show=function(m){_sh(m);if(m!=='field')app.classList.remove('fmh23');else requestAnimationFrame(()=>{try{applyFieldMsg(false);}catch(e){}});};}

/* ==================== 4. 図鑑：専用の詳細画面とモーション再生 ====================
 一覧（敵・仲間・装備）→ タップで詳細。詳細では戦闘と同じリグ・同じポーズ定義でドット絵を動かす。
 敵：待機／攻撃／魔法／溜め／被弾／ブレイク／撃破　仲間：待機／ダッシュ／攻撃／大技／魔法／防御／被弾／瀕死／勝利／戦闘不能／星臨 */
const ZK={t:'e',from:'home',cur:null,dt:'info'};
const ZV={u:null,cv:null,raf:0,busy:0,alpha:1,white:0,label:'待機',parts:[],flip:false,shake:0,run:0};
const RUN23={ta:.3,cr:2,fF:[-6,2.5],fN:[6.5,0],hF:[2,4],hN:[4,4],sw:2.5};
const zkList=()=>({e:zkEnemies(),h:Object.keys(PROF),i:zkEquip()});
const seenE=k=>!!(G.zk&&G.zk.e[k]),seenI=x=>!!(G.zk&&G.zk.i[x.k]),joined=id=>G.members.includes(id);
function zkBack(){zvStop();if(ZK.from==='bar')tavern();else townMenu();}
const ELCH=(e,on=true)=>`<i class="zel${on?'':' off'}" style="--c:${ELC[e]||'#8890c0'}">${e}</i>`;
zkMenu=function(m){if(typeof TSC!=='undefined'&&(TSC==='home'||TSC==='bar'))ZK.from=TSC==='home'?'home':'bar';zvStop();G.zk=G.zk||{e:{},i:{}};G.inv.forEach(zkItem);
 const Lst=zkList(),ne=Lst.e.filter(seenE).length,nh=Lst.h.filter(joined).length,ni=Lst.i.filter(seenI).length,t=ZK.t;
 log((m||'<b>図鑑</b>　タップすると専用の詳細画面を開く')+`<br><small>敵 ${ne}/${Lst.e.length}　仲間 ${nh}/${Lst.h.length}　装備 ${ni}/${Lst.i.length}</small>`);
 let body='';
 if(t==='e')body='<div class="zgrid z23">'+Lst.e.map((k,i)=>{const s=seenE(k);return`<button class="ztile${s?'':' un'}${ED[k].boss?' bs':''}" data-a="e" data-v="${k}"><em>${String(i+1).padStart(2,'0')}</em><img src="${zimg(k,!s)}" alt=""><span>${s?esc(ED[k].name):'？？？'}</span></button>`;}).join('')+'</div>';
 if(t==='h')body='<div class="zhg">'+Lst.h.map(id=>{const j=joined(id);return`<button class="zhc${j?'':' un'}" data-a="h" data-v="${id}" style="--ec:${elCol(id)}"><img src="${j?art(id):zimg(id,1)}" alt=""><b>${j?esc(HB[id].name):'？？？'}</b><small>${j?esc(clsOf(id)):'未加入'}</small></button>`;}).join('')+'</div>';
 if(t==='i')body='<div class="zig">'+Lst.i.map((x,i)=>{const s=seenI(x),ik=icKey(x);return`<button class="zic${s?'':' un'}" data-a="i" data-v="${i}">${ik?`<img src="${s?IC21.render(ik,4):IC21.shadow(ik)}" alt="">`:''}<b>${s?esc(x.n):'？？？'}</b><small>${esc(x.t)}</small></button>`;}).join('')+'</div>';
 panel(`<div class="ftabs zt23" style="grid-template-columns:repeat(3,1fr)">${[['e','敵'],['h','仲間'],['i','装備']].map(([k,n])=>`<button class="${t===k?'on':''}" data-a="tab" data-v="${k}">${n}</button>`).join('')}</div>${body}<button class="tbtn back wide" data-a="back">戻る</button>`,
  {tab:k=>{ZK.t=k;zkMenu();},e:k=>zkDetail('e',k,'info'),h:id=>zkDetail('h',id,'prof'),i:i=>zkDetail('i',+i),back:zkBack});};
const icKey=x=>typeof IC21==='undefined'?null:x.k.startsWith('set:')?'S_'+x.k.split(':')[1]+'_'+x.k.split(':')[2]:'L_'+x.k;
zkEnemy=k=>zkDetail('e',k);zkHero=id=>zkDetail('h',id);
/* ---------- 詳細画面 ---------- */
function zkDetail(type,key,dt){const L=zkList()[type],idx=type==='i'?key:L.indexOf(key);if(idx<0)return;ZK.cur={type,key,idx};if(dt)ZK.dt=dt;
 const n=L.length,prev=(idx-1+n)%n,next=(idx+1)%n,pv=type==='i'?prev:L[prev],nx=type==='i'?next:L[next];let h='';
 if(type==='e')h=enemyHTML(key);else if(type==='h')h=heroHTML(key);else h=equipHTML(L[idx]);
 panel(`<div class="zd23"><div class="zdh"><button class="zb" data-a="list">◀ 一覧</button><b>No.${String(idx+1).padStart(2,'0')}</b><span class="nv"><button data-a="go" data-v="${pv}" aria-label="前へ">◀</button><button data-a="go" data-v="${nx}" aria-label="次へ">▶</button></span></div>${h}</div>
  <button class="tbtn back wide" data-a="list">図鑑の一覧へ</button>`,
  {list:()=>{zvStop();zkMenu();},go:v=>{zvStop();zkDetail(type,type==='i'?+v:v);},dt:v=>{ZK.dt=v;zkDetail(type,key);},mo:v=>zvPlay(v),flip:()=>{ZV.flip=!ZV.flip;},
   ex:v=>{const im=$('#cmd .zex img');if(im)im.src=exprFace(key,v);$('#cmd').querySelectorAll('.zex [data-a="ex"]').forEach(b=>b.classList.toggle('on',b.dataset.v===v));},
   sk:v=>{const s=SK[v];if(s)try{V22.skInfo(s);}catch(e){}}});
 const c=$('#cmd .zv canvas');if(c)zvStart(c,type,key);else zvStop();}
const tabsH=(L)=>`<div class="zdt">${L.map(([k,n])=>`<button class="${ZK.dt===k?'on':''}" data-a="dt" data-v="${k}">${n}</button>`).join('')}</div>`;
const motH=(L)=>`<div class="zm">${L.map(([k,n])=>`<button data-a="mo" data-v="${k}">${n}</button>`).join('')}<button class="fl" data-a="flip">⇄ 向き</button></div>`;
const viewH=(bg)=>`<div class="zv" style="--bg:${bg}"><canvas></canvas><span class="zvl">待機</span></div>`;
function habitat(k){const o=[];try{for(const id in AREAS){const A=AREAS[id];if(!A||!A.name)continue;const g=[...(A.groups||[]),...(A.libGroups||[])];if(g.some(x=>x.includes(k))||(A.boss&&A.boss.kind===k))o.push(A.name);}}catch(e){}
 if(typeof TMOBS!=='undefined'&&TMOBS.includes(k))o.push('天への塔');return[...new Set(o)];}
const TGT={one:'単体',all:'全体'};
function enemyHTML(k){const d=ED[k],s=seenE(k)||DEV(),n=(G.zk.e[k]|0);if(!['info','sk','dot'].includes(ZK.dt))ZK.dt='info';
 const head=`<div class="zdn"><b>${s?esc(d.name):'？？？'}</b>${d.boss?'<em class="bs">BOSS</em>':''}<small>${s?'撃破 '+n+'体':'未撃破'}</small></div>`;
 if(!s)return head+`<div class="zv un"><img src="${zimg(k,1)}" alt=""></div><div class="zno">まだ倒したことがない敵。倒すとドット絵・能力・技が記録される。${habitat(k).length?`<br>出現：${habitat(k).map(esc).join('・')}`:''}</div>`;
 let body='';
 if(ZK.dt==='info'){const st=[['HP',d.mhp],['攻撃',d.atk],['防御',d.def],['魔力',d.mag],['精神',d.res],['速さ',d.spd]];
  body=`<div class="zst">${st.map(([a,v])=>`<div><small>${a}</small><b>${v}</b></div>`).join('')}</div>
  <dl class="dl22"><dt>弱点</dt><dd>${d.weak.map(e=>ELCH(e)).join('')}</dd><dt>シールド</dt><dd>◆${d.brk}</dd><dt>落とす物</dt><dd>${[...new Set((d.drop||[]).map(([m])=>MATS[m]?MATS[m].n:m))].map(esc).join('・')||'なし'}</dd>
  <dt>出現</dt><dd>${habitat(k).map(esc).join('・')||'特別な戦い'}</dd>${d.xp?`<dt>報酬</dt><dd>経験値 ${d.xp}・${d.gold}G</dd>`:''}</dl>`;}
 if(ZK.dt==='sk'){const ai=d.ai,acts=(ai?ai.acts:d.acts)||[],rows=acts.map(([a,w])=>[a,Math.round(w*100)+'%']);if(ai&&ai.charge)rows.push([ai.charge,`${ai.every}ターンごとに溜めて放つ`]);
  body=`<div class="zsl">${rows.map(([a,w])=>{const e=EA[a];if(!e)return'';return`<div class="zsk"><span class="el">${e.el?ELCH(e.el):'<i class="zel" style="--c:#c8c8d8">無</i>'}</span><b>${esc(e.n)}</b><small>${e.k==='mag'?'魔法':'物理'}・${TGT[e.t]||'―'}・威力${e.pow||'―'}</small><em>${esc(w)}</em></div>`;}).join('')}</div>
  ${ai&&ai.summon&&ED[ai.summon]?`<div class="zno">HPが半分を切ると「${esc(ED[ai.summon].name)}」を呼び出す</div>`:''}<div class="zno">弱点を突いてシールドを0にすると BREAK。溜め中にブレイクすると大技を打ち消せる。</div>`;}
 if(ZK.dt==='dot')body=`<div class="zdots"><figure><img src="${zimg(k)}" alt=""><figcaption>図鑑用（48×48）</figcaption></figure><figure><img src="${zimg(k,1)}" alt=""><figcaption>未発見のシルエット</figcaption></figure></div><div class="zno">上の再生ボタンで、戦闘中と同じ動き（同じ骨格・同じポーズ）を確認できる。</div>`;
 const mv=[['idle','待機'],['atk','攻撃'],['cast','魔法'],['chg','溜め'],['hit','被弾'],['brk','ブレイク'],['die','撃破']];
 return head+viewH('#3a1a3a')+motH(mv)+tabsH([['info','能力'],['sk','技'],['dot','ドット絵']])+`<div class="zbody">${body}</div>`;}
function heroHTML(id){const j=joined(id)||DEV(),P=PROF[id],hb=HB[id];if(!['prof','art','dot','sk','aw'].includes(ZK.dt))ZK.dt='prof';
 const head=`<div class="zdn" style="--ec:${elCol(id)}">${elOf(id)?ELCH(elOf(id)):''}<b>${j?esc(hb.name):'？？？'}</b><small>${j&&G.h[id]?'Lv'+G.h[id].lv+'　'+esc(clsOf(id)):'未加入'}</small></div>`;
 if(!j)return head+`<div class="zv un"><img src="${zimg(id,1)}" alt=""></div><div class="zno">加入条件：${esc(P[3])}</div>`;
 let body='';
 if(ZK.dt==='prof'){let s=null;try{s=stats(id);}catch(e){}const gr=hb.g||{};const st=[['HP','mhp'],['攻撃','atk'],['防御','def'],['魔力','mag'],['精神','res'],['速さ','spd']];
  body=`<div class="zpf"><img src="${art(id)}" alt=""><div><div class="zq">「${esc(P[2])}」</div><dl class="dl22"><dt>年齢・身分</dt><dd>${esc(P[0])}</dd><dt>職・武器・属性</dt><dd>${esc(P[1])}</dd><dt>加入</dt><dd>${esc(P[3])}</dd></dl></div></div>
  <div class="zst">${st.map(([a,k])=>`<div><small>${a}<i>${gr[k]||''}</i></small><b>${s?Math.round(s[k]):hb[k]}</b></div>`).join('')}</div>`;}
 if(ZK.dt==='art')body=`<div class="zart"><figure><img src="${art(id)}" alt=""><figcaption>通常</figcaption></figure><figure class="aw"><img src="${art(id,true)}" alt=""><figcaption>${SEIRIN.n}「${esc(AW[id].name)}」</figcaption></figure></div>
  <div class="zex"><img src="${exprFace(id,'n')}" alt=""><div>${Object.entries(EXN).map(([k,n],i)=>`<button class="${i?'':'on'}" data-a="ex" data-v="${k}">${n}</button>`).join('')}</div></div>`;
 if(ZK.dt==='dot')body=`<div class="zdots"><figure><img src="${face(id)}" alt=""><figcaption>顔（行動順・欄）</figcaption></figure><figure><img src="${face(id,true)}" alt=""><figcaption>顔（${SEIRIN.n}）</figcaption></figure><figure><img src="${zimg(id)}" alt=""><figcaption>図鑑用</figcaption></figure></div><div class="zno">上の再生ボタンで、戦闘中と同じ動きを確認できる。「${SEIRIN.n}」で姿が切り替わる。</div>`;
 if(ZK.dt==='sk'){const have=new Set(skillList(id)),src={};(hb.skills||[]).forEach(k=>src[k]='初期');(typeof LSK!=='undefined'&&LSK[id]||[]).forEach(([l,k])=>src[k]=src[k]||'Lv'+l);
  try{for(const p in BOARD[id]){const nd=BOARD[id][p];if(nd&&nd.t==='skill')src[nd.v]=src[nd.v]||'星盤';}}catch(e){}
  body=`<div class="zsl">${Object.keys(src).filter(k=>SK[k]).map(k=>{const s=SK[k],[el,ec]=skBadge(s),ok=have.has(k);return`<button class="zsk${ok?'':' off'}" data-a="sk" data-v="${k}"><span class="el"><i class="zel" style="--c:${ec}">${el}</i></span><b>${esc(s.n)}</b><small>${esc(s.d||'')}</small><em>${ok?(s.sp?'SP'+s.sp:'習得'):esc(src[k])}</em></button>`;}).join('')}</div>`;}
 if(ZK.dt==='aw'){const A=AW[id],lv=(G.h[id]&&G.h[id].awLv)||1,cm=[...(A.cmds||[]),'goku'+id].filter(k=>SK[k]);
  body=`<div class="zaw"><b>「${esc(A.name)}」</b><small>${esc(A.type||'')}　位階${ROMAN[lv]}　${'★'.repeat(lv)}${'☆'.repeat(3-lv)}</small><p>${esc(SEIRIN.lore)}</p></div><div class="zsl">${cm.map(k=>{const s=SK[k],[el,ec]=skBadge(s);return`<button class="zsk" data-a="sk" data-v="${k}"><span class="el"><i class="zel" style="--c:${ec}">${el}</i></span><b>${esc(s.n)}</b><small>${esc(s.d||'')}</small><em>${/^goku/.test(k)?'位階Ⅲ':s.gauge?'ゲージ'+s.gauge:''}</em></button>`;}).join('')}</div>`;}
 const mv=[['idle','待機'],['run','ダッシュ'],['atk','攻撃'],['big','大技'],['cast','魔法'],['guard','防御'],['hit','被弾'],['low','瀕死'],['win','勝利'],['down','戦闘不能'],['aw',SEIRIN.n]];
 return head+viewH(elCol(id))+motH(mv)+tabsH([['prof','人物'],['art','立ち絵'],['dot','ドット絵'],['sk','技'],['aw',SEIRIN.n]])+`<div class="zbody">${body}</div>`;}
function equipHTML(x){const s=seenI(x)||DEV(),ik=icKey(x),L0=x.k.startsWith('set:')?null:LEG[x.k],who=L0&&L0.who&&HB[L0.who]?HB[L0.who].name:'';
 const sl={w:'武器',sub:'盾・副装備',head:'頭',body:'体',acc:'装飾品'};
 return`<div class="zdn"><b>${s?esc(x.n):'？？？'}</b><em class="it">${esc(x.t)}</em></div><div class="zeq">${ik?`<img src="${s?IC21.render(ik,8):IC21.shadow(ik)}" alt="">`:''}</div>
  ${s?`<dl class="dl22"><dt>種別</dt><dd>${esc(x.t)}${L0&&L0.slot?'・'+(sl[L0.slot]||L0.slot):''}</dd>${who?`<dt>専用</dt><dd>${esc(who)}</dd>`:''}<dt>効果</dt><dd>${esc(x.d)}</dd></dl>`:'<div class="zno">まだ手に入れていない。強敵や宝箱、絆の物語から手に入ることがある。</div>'}`;}
/* ---------- モーション再生（戦闘と同じリグ・ポーズ） ---------- */
function zvStop(){cancelAnimationFrame(ZV.raf);ZV.raf=0;ZV.cv=null;ZV.u=null;ZV.busy=0;}
function zvStart(c,type,key){cancelAnimationFrame(ZV.raf);const u=type==='h'?{id:key,side:0,spr:key,name:HB[key].name,x:0,y:0,sc:2,alive:true,hp:100,mhp:100,aw:false,awLv:(G.h[key]&&G.h[key].awLv)||1,guard:false,sts:[]}
  :{kind:key,side:1,spr:key,name:ED[key].name,x:0,y:0,sc:ED[key].sc||2,alive:true,hp:100,mhp:100,boss:!!ED[key].boss,broken:false,charging:false,sts:[]};
 let A;try{A=ANIM.setup(u);}catch(e){A={none:1};}if(A.none){const im=document.createElement('img');im.src=zimg(key);c.replaceWith(im);return;}
 Object.assign(ZV,{u,cv:c,busy:0,alpha:1,white:0,parts:[],flip:false,shake:0,label:'待機'});const loop=()=>{if(!ZV.cv||!ZV.cv.isConnected){zvStop();return;}try{zvDraw();}catch(e){console.error(e);zvStop();return;}ZV.raf=requestAnimationFrame(loop);};ZV.raf=requestAnimationFrame(loop);}
function zvDraw(){const c=ZV.cv,u=ZV.u,dpr=Math.min(3,devicePixelRatio||1),cw=c.clientWidth,ch=c.clientHeight;if(!cw||!ch)return;const Wd=Math.round(cw*dpr),Hd=Math.round(ch*dpr);if(c.width!==Wd||c.height!==Hd){c.width=Wd;c.height=Hd;}
 const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,Wd,Hd);ANIM.tick();const A=ANIM.setup(u),R=A.rig,pose=ANIM.poseOf(u),[wx,wy,hop]=ANIM.world(u);
 const f=SPRX.frame(A.name,pose,A.palKey,A.pal,ZV.flip?!A.flip:A.flip,1,A.extra);if(!f)return;
 const z=Math.max(1,Math.floor(Math.min(Hd*.7/(R.hgt||36),Wd*.46/(R.wid||22)))),gy=Math.round(Hd*.86),sx=ZV.shake>0?((ZV.shake--)%2?z:-z):0,cx=Math.round(Wd/2)+sx;
 /* 床：格子と影 */
 g.fillStyle='rgba(255,255,255,.06)';for(let x=(cx%(z*8));x<Wd;x+=z*8)g.fillRect(x,gy,z,Hd-gy);g.fillRect(0,gy,Wd,z);
 const sw=Math.round((R.wid||22)*.46)*z;g.fillStyle='rgba(0,0,0,.35)';g.fillRect(cx+wx*1.5*z-sw,gy-z,sw*2,z*2);g.fillRect(cx+wx*1.5*z-sw+2*z,gy+z,sw*2-4*z,z);
 let img=f.cv;if(ZV.white>0){ZV.white--;if(ZV.white>1)img=SPRX.white(f);}
 g.globalAlpha=ZV.alpha*(u.side===0&&!u.alive?.78:1);g.drawImage(img,Math.round(cx+wx*1.5*z-f.ax*z),Math.round(gy+wy*1.5*z+hop*1.5*z-f.ay*z),f.w*z,f.h*z);g.globalAlpha=1;
 /* 星臨のオーラ・粒子 */
 if(u.aw&&Math.random()<.5)ZV.parts.push({x:(Math.random()-.5)*14,y:0,vx:0,vy:-.35-Math.random()*.5,l:34,c:Math.random()<.3?'#ffffff':'#ffe27a',s:1});
 if(u.charging&&Math.random()<.6)ZV.parts.push({x:(Math.random()-.5)*(R.wid||22),y:0,vx:0,vy:-.8-Math.random(),l:22,c:Math.random()<.5?'#ffb030':'#ffe27a',s:1});
 if(u.broken){const t=performance.now()/260,top=gy-(R.hgt||36)*z-4*z;for(let i=0;i<3;i++){const a=t+i*2.094,xx=cx+Math.cos(a)*(R.wid||22)*.35*z,yy=top+Math.sin(a)*2*z;g.fillStyle=Math.sin(a)>0?'#ffe14a':'#c8a020';g.fillRect(xx-z,yy,3*z,z);g.fillRect(xx,yy-z,z,3*z);}}
 ZV.parts=ZV.parts.filter(p=>p.l-->0);for(const p of ZV.parts){p.x+=p.vx;p.y+=p.vy;p.vy+=p.gr||0;g.globalAlpha=Math.min(1,p.l/12);g.fillStyle=p.c;g.fillRect(Math.round(cx+p.x*z),Math.round(gy-((R.hgt||36)*(p.my||0))*z+p.y*z),p.s*z,p.s*z);}g.globalAlpha=1;}
function burst(n,col,my=.5,sp=1.6){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=.4+Math.random()*sp;ZV.parts.push({x:(ZV.flip?1:-1)*(ZV.u.side===0?1:-1)*6,y:0,my,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:16+Math.random()*12|0,c:col[i%col.length],s:i%3?1:2});}}
const T=ms=>ANIM.T(ms);
async function zvPlay(k){const u=ZV.u;if(!u||ZV.busy)return;ZV.busy=1;const A=ANIM.setup(u),R=A.rig,hum=R.type==='hum',dir=(u.side===0?-1:1)*(ZV.flip?-1:1);
 const lab=t=>{ZV.label=t;const e=$('#cmd .zvl');if(e)e.textContent=t;};const btn=$('#cmd').querySelector(`.zm [data-v="${k}"]`);$('#cmd').querySelectorAll('.zm button').forEach(b=>b.classList.toggle('on',b===btn));
 const reset=()=>{u.guard=false;u.hp=100;u.alive=true;u.broken=false;u.charging=false;ZV.alpha=1;};
 try{const nm=btn?btn.textContent:k;lab(nm);
  if(k==='idle'){reset();ANIM.idle(u,200);}
  else if(k==='low'){reset();u.hp=10;}else if(k==='down'){reset();u.alive=false;}else if(k==='guard'){reset();u.guard=true;}
  else if(k==='chg'){reset();u.charging=true;}else if(k==='brk'){reset();u.broken=true;burst(14,['#ffe14a','#ffffff']);ZV.shake=8;}
  else if(k==='aw'){reset();u.aw=!u.aw;ANIM.setup(u);if(u.aw){await ANIM.to(u,V19.AWK,220,'back');burst(26,['#ffe27a','#ffffff','#7fd6ff'],.5,2);ZV.white=4;await T(500);}ANIM.idle(u,260);lab(u.aw?SEIRIN.n+'中':'待機');}
  else if(k==='hit'){reset();const M=ANIM.MST[A.name];await ANIM.to(u,hum?ANIM.HST.hit:(M&&M.hit)||{},60);A.kbv=-dir*5;ZV.white=4;burst(8,['#ffffff','#ffd0a0']);await T(320);ANIM.idle(u,200);}
  else if(k==='die'){reset();ZV.white=6;burst(20,['#ffffff','#c8b0ff'],.5,1);for(let i=0;i<=14;i++){ZV.alpha=1-i/14;await sleep(45);}await sleep(500);ZV.alpha=1;ANIM.idle(u,1);}
  else if(k==='run'){reset();ANIM.to(u,RUN23,140);await ANIM.move(u,dir*14,0,420,'io',3);await T(120);ANIM.to(u,RUN23,120);await ANIM.move(u,0,0,380,'io',3);ANIM.idle(u,200);}
  else if(k==='win'){reset();ANIM.move(u,0,0,380,'lin',7);await ANIM.to(u,V19.VIC.a,180,'out');await ANIM.to(u,V19.VIC.b,200,'in');burst(10,['#ffe27a','#ffffff']);await T(800);ANIM.idle(u,260);}
  else if(k==='cast'){reset();if(hum){const cp=V19.CAST[R.wp]||V19.CAST._;await ANIM.to(u,cp.a,380);for(let i=0;i<3;i++){burst(5,['#9fd8ff','#ffffff'],.6,.8);await T(90);}await ANIM.to(u,cp.b,120,'in');burst(16,['#9fd8ff','#ffffff','#c8b0ff'],.5,2.2);await T(420);}
   else{const M=V19.MA[A.name]||{},c=M.cast||{};await ANIM.to(u,c.w||{},380);burst(10,['#c8b0ff','#ffffff'],.6,.8);await ANIM.to(u,c.h||{},160,'in');burst(16,['#ff9ad6','#ffffff'],.5,2.2);await T(420);}ANIM.idle(u,220);}
  else if(k==='atk'||k==='big'){reset();
   if(hum){const wp=V19.WP[R.wp]||V19.WP.sword;ANIM.to(u,RUN23,120);await ANIM.move(u,dir*10,0,260,'io',3);
    if(R.wp==='bow'&&V19.BOW){await ANIM.to(u,V19.BOW.aim,160);await ANIM.to(u,V19.BOW.draw,260);await ANIM.to(u,V19.BOW.loose,60,'in');burst(8,['#ffffff','#ffe14a']);await T(260);}
    else{const seq=k==='big'?[wp.H]:wp.seq.slice(0,2);for(const s of seq){await ANIM.to(u,s.w,s.wt);await ANIM.to(u,s.h,s.ht,'in');burst(k==='big'?22:10,k==='big'?['#ffe27a','#ffffff','#ff9a40']:['#ffffff','#ffe27a'],.55,k==='big'?2.4:1.6);if(k==='big'){ZV.shake=10;ZV.white=0;}await T(k==='big'?260:120);}}
    await T(160);ANIM.to(u,RUN23,100);await ANIM.move(u,0,0,300,'io',2);}
   else{const M=V19.MA[A.name]||{},ap=M.ap||{ms:260,hop:4},a=M.atk||{};await ANIM.move(u,dir*8,0,ap.ms,'io',ap.hop);await ANIM.to(u,a.w||{},a.wt||150);if(a.m)await ANIM.to(u,a.m,a.mt||100);await ANIM.to(u,a.h||{},a.ht||70,'in');burst(a.big?20:10,['#ffffff','#ffb070']);if(a.big)ZV.shake=8;await T(320);await ANIM.move(u,0,0,ap.ms,'io',ap.hop);}
   ANIM.idle(u,220);}
 }catch(e){console.error(e);}finally{ZV.busy=0;}}

/* ==================== 3. ホーム画面：実際の大きさから配置を決める ====================
 これまでは各要素を固定の座標で置いていたため、画面が低い・狭いと右メニューと「NEXT」、
 お知らせ（トースト）と左右の列、DEVボタンと左の列が重なっていた。
 上の帯（資源・街名・依頼）と下の帯（出撃・ナビ）を先に測り、その間の高さに左右の列を収める */
function homeFix(){if(scene!=='town'||TSC!=='home')return;const R=$('#labels .h22');if(!R)return;const rb=R.getBoundingClientRect();if(!rb.height)return;
 const q=s=>R.querySelector(s),rel=el=>{const r=el.getBoundingClientRect();return{l:r.left-rb.left,t:r.top-rb.top,r:r.right-rb.left,b:r.bottom-rb.top,w:r.width,h:r.height};};
 const mis=q('.h22mis'),nav=q('.h22nav'),go=q('.h22go'),L=q('.h22left'),Rt=q('.h22right');if(!mis||!nav||!go||!L||!Rt)return;
 const top=rel(mis).b+8,navT=rel(nav).t,W0=rb.width;
 /* 下の「NEXT・挑戦・出撃」は幅を左の列の右までに制限 */
 const nx=q('.h22nx');if(nx)nx.style.maxWidth=Math.max(120,W0-84-6)+'px';
 const goT=rel(go).t;
 /* 右のメニュー：上の帯と「NEXT」の間に7つのボタンを収める（足りなければボタンを低く・アイコンを小さく） */
 const nb=Rt.children.length||1,availR=goT-8-top,bh=clamp(Math.floor((availR-8)/nb),28,46);
 Rt.style.top=top+'px';Rt.style.setProperty('--bh',bh+'px');Rt.classList.toggle('cmp23',bh<36);Rt.classList.toggle('xs23',bh<31);
 /* 左の列（道具屋・鍛冶屋・鑑定屋）とDEVボタン */
 L.style.top=top+'px';const nl=L.children.length||1,devOn=!!G.dev,availL=navT-8-top-(devOn?34:0),gap=clamp(Math.floor((availL-nl*62)/Math.max(1,nl-1)),2,12);
 L.style.gap=gap+'px';L.classList.toggle('cmp23',availL<nl*62);
 const dv=$('#devB');if(dv){if(devOn){const lb=rel(L).b;dv.style.top=Math.round(lb+6)+'px';dv.style.bottom='auto';}else{dv.style.top='';}}
 /* お知らせ：左右の列のあいだ、依頼の下に。はみ出す分は省略し、タップで閉じる */
 const t=q('.h22toast')||$('#labels .h22toast');if(t){const lr=rel(L).r,rl=rel(Rt).l;t.style.left=Math.round(lr+6)+'px';t.style.width=Math.max(120,Math.round(rl-lr-12))+'px';t.style.top=top+'px';t.style.maxHeight=Math.max(60,Math.round(goT-top-10))+'px';}
 /* 街を歩く仲間は左右の列とお知らせの下にもぐらないよう、そのまま（絵の一部）。 */}
{const _tm=townMenu;townMenu=function(m){_tm(m);fadeIn();try{homeFix();requestAnimationFrame(homeFix);setTimeout(homeFix,120);}catch(e){console.error(e);}};}
addEventListener('resize',()=>{if(scene==='town'&&TSC==='home')requestAnimationFrame(()=>requestAnimationFrame(()=>{try{homeFix();}catch(e){}}));});
/* お知らせはタップで閉じる */
document.addEventListener('click',e=>{const t=e.target.closest('.h22toast');if(t)t.classList.remove('show');});

/* ==================== お知らせ・開発者メニュー ==================== */
const NEWS23=`<div class="nt"><b>${VER23}</b>　戦闘画面を作り直しました。<br><small>・HP／SP／${SEIRIN.g}は画面下の<b>パーティ情報欄</b>に（タップで状態の詳細）。敵の名前・HP・弱点は画面上の固定帯に。<br>・ダメージ表示を一新（Critical／Weak／Guard／Miss／BREAK）。<br>・${SEIRIN.n}は、演出テキストのあとにアニメーションが流れます。<br>・図鑑：タップで専用の詳細画面。ドット絵の動きを再生できます。<br>・探索：右下の「文」でテキストの表示／非表示を切り替え。</small></div>`;
document.addEventListener('click',e=>{const t=e.target.closest('[data-h22="news"]');if(!t||scene!=='town')return;e.stopPropagation();e.preventDefault();SFX.sel();
 const vn=V22.HM.news||'';ovOpen(`<div class="nw22"><div class="nh"><b>お知らせ</b></div>${vn||'<div class="nn">新しいお知らせはありません</div>'}${NEWS23}</div><button class="tbtn back wide" data-a="close">閉じる</button>`,{close:ovClose});},true);
function dev23(m){log((m||`<b>${VER23}</b>　戦闘画面・ダメージ表示・${SEIRIN.n}演出・図鑑・探索の確認`));
 menu([{l:'戦闘：ボス＋手下',s:'配置・パーティ情報欄・ダメージ表示',cls:'ready',f:()=>devBattle([{kind:'boss2',lv:10},{kind:'moss',lv:8},{kind:'jadewolf',lv:8}],'midori',{theme:'forest'})},
  {l:'戦闘：大型ボス',s:'演技エリアに収まるか',f:()=>devBattle([{kind:'boss9',lv:60}],'ryuu',{theme:'lava'})},
  {l:'ダメージ表示の見本',s:'Critical・Weak・Guard・Miss・BREAK',f:()=>{devBattle([{kind:'boss',lv:5},{kind:'slime',lv:5}],'haido');setTimeout(sample,1400);}},
  {l:'図鑑（モーション再生）',f:()=>zkMenu()},{l:'探索（テキスト切り替え）',f:()=>enterField('midori')},{l:'戻る',cls:'back',f:()=>dvMenu()}],true);}
function sample(){if(!B)return;const e=B.enemies[0],s=B.enemies[1],h=B.heroes;let i=0;const q=[()=>pop(e,128,'#fff',false,''),()=>pop(e,864,'#fff',false,'weak','光'),()=>pop(e,2480,'#fff',false,'crit weak','打'),
  ()=>{h[1].guard=true;pop(h[1],412,'#f88',false,'hurt');setTimeout(()=>pop(h[1],'スタン','#ffe14a',true,'st20 dn'),40);},()=>pop(h[2],'MISS','#fff',true),()=>{if(s)pop(s,'BREAK!!','#fff',false,'brk');},()=>pop(h[3],'+640','#7dffa8'),()=>{h[1].guard=false;}];
 const go=()=>{if(i<q.length){try{q[i++]();}catch(x){}setTimeout(go,520);}};go();}
{const _dv=dvMenu;dvMenu=function(m){_dv(m);try{addCmd(VER23+' 戦闘画面・図鑑','配置・ダメージ表示・'+SEIRIN.n+'演出・図鑑',dev23,0,'ready');}catch(e){}};}

/* 版表示 */
{const _t=title;title=function(){_t();const v=$('#verL');if(v)v.textContent=VER23;};const v=$('#verL');if(v)v.textContent=VER23;}
try{document.title='アストラル・ブレイカー '+VER23;}catch(e){}
return{zkDetail,zvPlay,ZV,homeFix,applyFieldMsg,layout,LY,renderPT,pop23,seirinText,fadeIn,placeEnemies,placeHeroes,battleH,esc,clamp,appW,oh,sleep,DEV};})();
