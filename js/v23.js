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
const CMDMIN=()=>innerHeight<700?146:innerHeight<800?160:172;
/* 上の固定帯（敵の名前・HP・弱点）と、下の行動順・星臨ボタンの高さ（画面px） */
function hudPx(){const hd=$('#bt22 .b22hd'),bt=$('#bt22 .b22btn');let h=0;if(hd&&hd.offsetParent)h=hd.offsetTop+hd.offsetHeight;if(bt&&bt.offsetParent)h=Math.max(h,bt.offsetTop+bt.offsetHeight);return Math.max(h,58);}
function botPx(){const st=$('#stage'),o=$('#bt22 .b22ord'),a=$('#bt22 .b22aw');if(!st)return 46;const sh=st.offsetHeight;let t=sh;for(const e of[o,a])if(e&&e.offsetParent)t=Math.min(t,e.offsetTop);return Math.max(40,sh-t);}
function battleH(){const sc=appW()/W,ch=V21.contentH(),used=Math.max(oh($('#msg')),40)+Math.max(oh($('#pt23')),76)+Math.max(oh($('#bbar')),44)+CMDMIN();
 return clamp(Math.floor((ch-used)/sc),132,300);}
/* 味方：右側に縦に並べる。間隔が体の高さより狭いときは2列のジグザグにして、全身が重ならないようにする */
function placeHeroes(){const hs=B.heroes,n=hs.length;if(!n)return;let hh=0,ww=0;hs.forEach(h=>{const D=V19.dims(h);hh=Math.max(hh,D.h);ww=Math.max(ww,D.w);});
 const band=LY.bot-LY.top,back=W-12-ww/2,front=back-ww-7,s=n>1?(band-hh)/(n-1):0,zig=n>2&&s<hh+3;
 hs.forEach((h,i)=>{const fy=n===1?LY.top+hh+(band-hh)*.62:LY.top+hh+s*i,fx=zig?(i%2?front:back):back-Math.round(9*Math.sin(Math.PI*(i+.5)/n));
  h.x=fx-8*h.sc;h.y=Math.round(fy-16*h.sc+2);h._fx23=fx;});
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
 for(const e of order){ANIM.setup(e);capScale(e,band,x1-x0);const D=eDims(e);let ax,ay;
  if(e.boss){ax=.4;ay=.62;}else{const k=mi++;const L=boss?BANC:(ANC[Math.min(5,Math.max(1,nM))]||ANC[5]);const a=L[k%L.length];ax=a[0];ay=a[1];}
  const fxA=x0+D.w/2+(x1-x0-D.w)*ax,fyA=LY.top+D.h+(band-D.h)*ay;let best=null,bc=1e18;
  for(let fy=LY.top+D.h;fy<=LY.bot+.01;fy+=2)for(let fx=x0+D.w/2;fx<=x1-D.w/2+.01;fx+=2){const b=[fx-D.w/2-2,fy-D.h-2,fx+D.w/2+2,fy+2];let ov=0;
    for(const p of placed){const ix=Math.min(b[2],p[2])-Math.max(b[0],p[0]),iy=Math.min(b[3],p[3])-Math.max(b[1],p[1]);if(ix>0&&iy>0)ov+=ix*iy;}
    const c=ov*60+Math.hypot(fx-fxA,(fy-fyA)*1.2);if(c<bc){bc=c;best=[fx,fy];}}
  if(!best)best=[fxA,fyA];e.x=best[0]-8*e.sc;e.y=Math.round(best[1]-16*e.sc+2);e._p23=1;placed.push(box(e));}}
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
   <div class="hp"><em>HP</em><b class="hv"></b></div><div class="hb"><u></u><i></i></div><div class="sp"><em>SP</em><b class="sv"></b><div class="sb"><i></i></div></div><div class="ag"><i></i><span></span></div></div>`).join('');}
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
 let x,y;if(hero){x=(a.fx-a.w/2-1)*SC-w;y=(a.fy-a.h*.62)*SC-h/2+slot*h*.62;if(slot%2)x-=10;}
 else{x=(a.fx)*SC-w/2+(slot%2?14:-6)*(slot?1:0);y=(a.fy-a.h*.55)*SC-h/2-slot*h*.58;}
 const xmax=hero?SW-4-w:Math.max(4,Math.min(SW-4,LY.heroL*SC-4)-w);
 x=clamp(x,4,Math.max(4,xmax));y=clamp(y,LY.hudPx+2,Math.max(LY.hudPx+2,SH-LY.botPx-h-2));el.style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px)`;}
function mkPop(u,cls,inner,life){const L=popLayer(),el=document.createElement('div');el.className='p23 '+(u.side===0?'h ':'e ')+cls;el.innerHTML=`<div class="in">${inner}</div>`;
 el.style.setProperty('--life',life+'ms');L.appendChild(el);const s=slotOf(u);placePop(el,u,s);const rec={el,s,end:performance.now()+life,t:performance.now()};u._pp23.push(rec);setTimeout(()=>el.remove(),life+40);return rec;}
function baseFs(u){return u.side===0?clamp(SC*8.6,17,23):clamp(SC*11.5,22,31);}
function tierOf(u,d){const r=d/Math.max(1,u.mhp||1);return r>=.35?3:r>=.15?2:r>=.05?1:0;}
const TIERK=[1,1.14,1.32,1.55];
let LASTLB=null;
function dmgPop(u,s,kind,el){const v=parseInt(s,10),heal=s[0]==='+',crit=/crit/.test(kind),weak=/weak/.test(kind),psn=/psn/.test(kind),grd=u.side===0&&!heal&&!!u.guard,t=heal?0:tierOf(u,Math.abs(v));
 const fs=Math.round(baseFs(u)*TIERK[t]*(crit?1.18:1)*(heal?.9:1));
 const lb=(crit?'<span class="cr">Critical</span>':'')+(weak?`<span class="wk">Weak${el?`<b>${esc(el)}</b>`:''}</span>`:'')+(grd?'<span class="gd">Guard</span>':'')+(psn?'<span class="sx">毒</span>':'');
 const cls=`dmg t${t}${crit?' crit':''}${weak?' weak':''}${heal?' heal':''}${psn?' psn':''}${grd?' grd':''}`;
 const r=mkPop(u,cls,`<div class="lb">${lb}</div><div class="n" style="font-size:${fs}px">${heal?'+':''}${fmtN(v)}</div>`,LIFE(crit||t>=2?1350:1150));
 r.dmg=1;LASTLB={u,r};if(crit||t>=3){r.el.classList.add('fl');}return r;}
function wordPop(u,s,kind){const miss=s==='MISS',brk=/brk/.test(kind)||/^BREAK/.test(s);const fs=Math.round(baseFs(u)*(brk?1.05:.9));
 return mkPop(u,miss?'word miss':'word brk',`<div class="w" style="font-size:${fs}px">${miss?'Miss':'BREAK!!'}</div>`,LIFE(brk?1300:1000));}
/* 小さな文字（状態・AG+・DELAY など）。直前のダメージ表示があれば、その見出しに加える（Guard／スタン／430 の形） */
function tagPop(u,s,col,kind){const now=performance.now();
 if(LASTLB&&LASTLB.u===u&&now-LASTLB.r.t<380&&LASTLB.r.el.isConnected&&!/fu/.test(kind||'')){const lb=LASTLB.r.el.querySelector('.lb');if(lb&&lb.children.length<4){lb.insertAdjacentHTML('beforeend',`<span class="sx" style="--c:${col||'#fff'}">${esc(s)}</span>`);placePop(LASTLB.r.el,u,LASTLB.r.s);return;}}
 const up=/\bup\b/.test(kind||''),dn=/\bdn\b/.test(kind||'');
 mkPop(u,'tag'+(up?' up':dn?' dn':'')+(KANJI.test(s)?' jp':''),`<div class="g" style="--c:${col||'#fff'}">${esc(s)}</div>`,LIFE(1000));}
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
function seirinText(u){return new Promise(res=>{const st=$('#stage');let c=$('#sr23');if(!c){c=document.createElement('div');c.id='sr23';st.appendChild(c);}
 const A=AW[u.id],lv=u.awLv||1,ec=elCol(u.id),k=speed>=4?.6:speed>=2?.8:1;c.style.setProperty('--ec',ec);c.style.setProperty('--k',k);
 c.innerHTML=`<div class="bg"><i></i><i></i><i></i></div><div class="kj"><b>星</b><b>臨</b></div><div class="tx"><div class="t">${esc(u.name)} ― ${SEIRIN.en}${lv>1?'　位階'+ROMAN[lv]:''}</div><div class="b">《${esc(A.name)}》</div></div><img class="pf" src="${art(u.id,true)}" alt="">`;
 c.className='on';try{tone(523,.08,'triangle',.05);setTimeout(()=>tone(784,.12,'triangle',.05),110);}catch(e){}
 setTimeout(()=>{c.className='on out';},Math.round(1350*k));setTimeout(()=>{c.className='';c.innerHTML='';res();},Math.round(1700*k));});}
{const _aw=awaken;awaken=async function(u){if(!B||scene!=='battle')return _aw(u);const cut=$('#cut');
  try{await seirinText(u);}catch(e){console.error(e);}
  cut.classList.add('mute23');B.flashBg=Math.max(B.flashBg||0,26);
  try{return await _aw(u);}finally{cut.classList.remove('mute23');try{const[x,y]=V19.mid(u);FX19.ring(x,y,'#ffffff',{r1:30,dur:420});}catch(e){}}};}

/* 版表示 */
{const _t=title;title=function(){_t();const v=$('#verL');if(v)v.textContent=VER23;};const v=$('#verL');if(v)v.textContent=VER23;}
try{document.title='アストラル・ブレイカー '+VER23;}catch(e){}
return{layout,LY,renderPT,pop23,seirinText,fadeIn,placeEnemies,placeHeroes,battleH,esc,clamp,appW,oh,sleep,DEV};})();
