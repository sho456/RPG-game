/* ===== ver0.22 画面の全面改良・「星臨」・ミッション一括受け取り・開発者モード拡張 =====
 1. 戦闘画面：戦場を画面幅いっぱい・縦に広く。左上に対象の名前／HPゲージ／弱点、右上にメニュー。
    下部は「キャラ帯（名前・星臨ゲージ・立ち絵）→ HP/SP/状態 → 技リスト → AUTO・リピート」の順に整理
 2. ホーム画面：街を画面全体に広げ、文字情報を減らす。依頼はミッション画面へ、編成は下部ナビへ統合
 3. 編成画面：カードを縦長に。技・共鳴技・星臨はタップで専用画面を開き、効果・性能・説明を確認できる
 4. デザインの統一：夜空の紺 × 金の縁取り × 星の青緑。ボタン・窓・アイコンを共通の規則で描く
 5. 開発者モード：全データ開放。戦闘中はSP・ゲージ・条件を無視して技を使え、星臨・共鳴技も無制限
 6. ミッション：受け取り可能な報酬だけを一括で受け取る
 7. 「覚醒」→「星臨（せいりん）」：星片に宿る星座を、その身に降ろす力。ゲージは「星臨ゲージ（ASTRAL GAUGE）」
 既存の処理は包む（ラップする）か、同じ動作を保ったまま置き換える。セーブデータの形は変えない */
'use strict';
const VER22='ver0.22';
const SEIRIN={n:'星臨',kana:'せいりん',en:'ASTRAL ADVENT',g:'星臨ゲージ',ge:'ASTRAL GAUGE',
 lore:'星片に宿る星座を、その身に降ろす力。ゲージが満ちると発動でき、行動を消費しない。位階（Ⅰ〜Ⅲ）が上がるほど長く、強くなる。'};
const V22=(()=>{
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const px=v=>parseFloat(v)||0;
const DEV=()=>{try{return!!(G&&G.dev);}catch(e){return false;}};
const app=$('#app');app.classList.add('v22');
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);

/* ==================== 共通：アイコン（16×16 の塗りSVG） ==================== */
const IP={
 home:'M8 1.2 .8 7.6h2.1V14.8h4.2v-4.2h1.8v4.2h4.2V7.6h2.1z',
 party:'M5.6 1.8a2.6 2.6 0 110 5.2 2.6 2.6 0 010-5.2zm5.3 1a2.1 2.1 0 110 4.2 2.1 2.1 0 010-4.2zM.8 14.4c0-3.2 2.1-5.6 4.8-5.6s4.8 2.4 4.8 5.6zm10 0c0-1.7-.5-3.1-1.4-4.2.5-.2 1-.3 1.6-.3 2.3 0 4.2 1.9 4.2 4.5z',
 star:'M8 .6l2.2 4.6 5 .7-3.6 3.5.9 5L8 12 3.5 14.4l.9-5L.8 5.9l5-.7z',
 smith:'M9.4 1.2 14.8 6.6 13.2 8.2 11.6 6.6 4.2 14 2 11.8 9.4 4.4 7.8 2.8z',
 bar:'M2.6 2.4h8.2v2.2h1.6a1.4 1.4 0 011.4 1.4v4.4a1.4 1.4 0 01-1.4 1.4h-1.6v1.6a1.2 1.2 0 01-1.2 1.2H3.8a1.2 1.2 0 01-1.2-1.2zm8.2 4.2v3.4h1.4V6.6z',
 shop:'M2.4 5.2h11.2l-1 9.6H3.4zM5.2 5.2a2.8 2.8 0 015.6 0H9.4a1.4 1.4 0 00-2.8 0z',
 menu:'M1.6 2.6h12.8v2.2H1.6zm0 4.3h12.8v2.2H1.6zm0 4.3h12.8v2.2H1.6z',
 scroll:'M3.4 1h7.4l3 3v11H3.4zm2.2 4.6v1.2h6.2V5.6zm0 3v1.2h6.2V8.6zm0 3v1.2h4V11.6z',
 bag:'M5 4.4V3.6a3 3 0 016 0v.8h2.2l1 10.6H1.8l1-10.6zm1.6 0h2.8v-.8a1.4 1.4 0 00-2.8 0z',
 book:'M1.4 2.2h5a1.6 1.6 0 011.6 1.6v10.6a1.4 1.4 0 00-1.4-1.2H1.4zm13.2 0h-5A1.6 1.6 0 008 3.8v10.6a1.4 1.4 0 011.4-1.2h5.2z',
 heart:'M8 14.4S.8 9.8.8 5.6A3.6 3.6 0 018 4a3.6 3.6 0 017.2 1.6C15.2 9.8 8 14.4 8 14.4z',
 castle:'M.8 5.6h2V3.4h2v2.2h1.8V3.4h2.8v2.2h1.8V3.4h2v2.2h2V15H9.6v-3.2H6.4V15H.8z',
 bell:'M8 .8a1.1 1.1 0 011.1 1.1v.6a4.6 4.6 0 013.5 4.5v3.6l1.6 1.6H1.8l1.6-1.6V7a4.6 4.6 0 013.5-4.5v-.6A1.1 1.1 0 018 .8zM6.3 13.2h3.4a1.7 1.7 0 01-3.4 0z',
 sword:'M13.2.8h2v2l-8 8 1 1-1.2 1.2-1-1-2.2 2.2-2.2-2.2 2.2-2.2-1-1L3 7.6l1 1z',
 link:'M6.6 9.4 9.4 6.6m-4.6.6L3.4 8.6a2.6 2.6 0 003.7 3.7l1.4-1.4m2.3-1.1 1.4-1.4a2.6 2.6 0 00-3.7-3.7L7.1 4.1',
 flame:'M8 .6c1.2 3.2 4.6 4.6 4.6 8.8a4.6 4.6 0 01-9.2 0c0-2.4 1.2-3.6 2.2-4.6.1 2.2 1.2 2.9 1.9 2.9C7.1 5.1 7.4 3 8 .6z',
 back:'M6.4 2.4.8 8l5.6 5.6V9.8h5.2a2.2 2.2 0 010 4.4H9.8V16h1.8a4 4 0 000-8H6.4z',
 fast:'M1 3l6 5-6 5zm7 0 6 5-6 5z',
 gear:'M6.8.8h2.4l.4 2 1.4.6 1.7-1.1 1.7 1.7-1.1 1.7.6 1.4 2 .4v2.4l-2 .4-.6 1.4 1.1 1.7-1.7 1.7-1.7-1.1-1.4.6-.4 2H6.8l-.4-2-1.4-.6-1.7 1.1-1.7-1.7 1.1-1.7-.6-1.4-2-.4V6.8l2-.4.6-1.4-1.1-1.7 1.7-1.7 1.7 1.1 1.4-.6zM8 5.4a2.6 2.6 0 100 5.2 2.6 2.6 0 000-5.2z',
 gift:'M1.6 5.4h12.8v3H1.6zm1 3.6h4.6v6H2.6zm6.2 0h4.6v6H8.8zM8 5.2C6.4 2 3.6 2.6 4.2 4.2 4.6 5.2 6.6 5.2 8 5.2zm0 0c1.6-3.2 4.4-2.6 3.8-1 -.4 1-2.4 1-3.8 1z',
 hand:'M1 6.6h7.4l-.9-1.6C7 4 7.8 3.2 8.8 3.8l4.6 3c.8.5 1.3 1.4 1.3 2.4v1.6c0 1.7-1.4 3-3 3H6.4c-.7 0-1.2-.5-1.2-1.1 0-.4.2-.7.5-.9-.6-.1-1-.6-1-1.1 0-.4.2-.7.5-.9-.6-.1-1-.6-1-1.2 0-.2 0-.3.1-.5H1z',
 eye:'M8 3.4C4.4 3.4 1.6 6 .6 8c1 2 3.8 4.6 7.4 4.6s6.4-2.6 7.4-4.6c-1-2-3.8-4.6-7.4-4.6zm0 2a2.6 2.6 0 110 5.2 2.6 2.6 0 010-5.2z',
 trophy:'M4 1.4h8v1.4h2.6v1.6c0 2-1.4 3.6-3.2 3.9A4 4 0 018.8 10.6V12.8h2.8v1.8H4.4v-1.8h2.8v-2.2A4 4 0 014.6 8.3C2.8 8 1.4 6.4 1.4 4.4V2.8H4zm-1.2 3v.2c0 1 .5 1.8 1.2 2.2V4.4zm10.4 0H12v2.4c.7-.4 1.2-1.2 1.2-2.2z'};
const ic=(k,c='')=>`<svg class="ic22 ${c}" viewBox="0 0 16 16" aria-hidden="true">${k==='link'?`<path d="${IP[k]}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`:`<path d="${IP[k]}"/>`}</svg>`;
const hx=(el,col,cls='')=>`<i class="hx20 ${cls}" style="--c:${col||'#8890c0'}">${el||'無'}</i>`;
const isBadge=n=>n?`<i class="bd22">${n===true?'!':n>99?'99+':n}</i>`:'';

/* ==================== 1. 戦闘画面 ==================== */
const BL={dy:0,starting:false,th:undefined,boss:false,act:0};
const HM={on:false,ty:48,sky:null,ext:null,extH:0,walk:[],news:''};
{const _mb=makeBg;makeBg=function(th,boss){if(scene==='battle'){BL.th=th;BL.boss=boss;}return _mb(th,boss);};}
const appW=()=>{const a=$('#app');return Math.max(240,Math.min(a.clientWidth||innerWidth,480));};
const isHome=()=>scene==='town'&&typeof TSC!=='undefined'&&TSC==='home'&&HM.on;
/* ver0.24：戦場の高さ・味方の配置は ver0.23 の layout（V23）に一本化。ここにあった旧配置（relayout）は戦闘開始・画面回転のたびに
 背景の作り直しと配置を二重に行い、一瞬だけ旧配置が見えることがあったため削除 */
{const _fit=fit;fit=function(){const st=$('#stage');
 if(scene==='battle'||isHome()){const aw=appW();SC=aw/W;const h=Math.round(H*SC);cv.style.width=aw+'px';cv.style.height=h+'px';st.style.width=aw+'px';st.style.height=h+'px';
  app.classList.toggle('home22',isHome());if(scene==='battle'&&B)refresh();return;}
 app.classList.remove('home22');_fit();};}
{const _sb=startBattle;startBattle=function(list,opts){BL.dy=0;BL.act=0;BL.starting=true;let r;try{r=_sb(list,opts);}finally{BL.starting=false;}
 try{B.rt22=1;ensureHud();if(DEV())devRefill();}catch(e){console.error(e);}return r;};}
addEventListener('resize',()=>{if(isHome())requestAnimationFrame(()=>{try{homeLayout();}catch(e){}});});
{const _sh=show;show=function(m){_sh(m);app.classList.add('v22');if(m!=='battle'){const h=$('#bt22');if(h)h.style.display='none';}else{const h=$('#bt22');if(h)h.style.display='';}
 if(m!=='town'){HM.on=false;app.classList.remove('home22');}};}
/* 行動数（ACTIONS）を数える */
{const _da=doAction;doAction=async function(u,sk,t){try{if(B&&u&&u.side===0)BL.act++;}catch(e){}return _da(u,sk,t);};}

/* ---------- 戦場の上に重ねる表示（左上：対象の情報／右上：メニュー／左下：行動順／右下：星臨） ---------- */
function ensureHud(){let h=$('#bt22');if(h&&h.isConnected){h.style.display='';return h;}
 h=document.createElement('div');h.id='bt22';
 h.innerHTML=`<div class="b22hd"><div class="b22rt"><span><small>TURN</small><b class="tn">1</b></span><span><small>ACTIONS</small><b class="ac">0</b></span><span class="dv">DEV ∞</span></div><div class="b22tg"></div></div>
  <div class="b22btn"><button class="rb sp" data-b22="spd">${ic('fast')}<b>×1</b></button><button class="rb mn" data-b22="cfg">${ic('menu')}</button></div>
  <button class="b22aw" data-b22="aw" disabled><span class="g"><i></i></span><b>${SEIRIN.n}</b><small>${SEIRIN.en}</small></button>
  <div id="rt22"><i class="r1"></i><i class="r2"></i><i class="r3"><s></s><s></s><s></s><s></s></i><b>Weak</b></div>`;
 $('#stage').appendChild(h);return h;}
document.addEventListener('click',e=>{const t=e.target.closest('[data-b22]');if(!t||t.disabled)return;const k=t.dataset.b22;
 if(k==='spd'){SFX.sel();$('#spd').click();bbar(true);updHud();}
 else if(k==='cfg'){SFX.sel();try{cfgOpen();}catch(x){}}
 else if(k==='aw'){if(B&&B.pick){au();B.pick.aw();}}});
const WEAKSYM={w:'▲',u:'?'};
let HK='';
function updHud(){if(!B||scene!=='battle')return;const h=ensureHud();h.classList.toggle('dev',DEV());
 h.querySelector('.tn').textContent=B.turns;h.querySelector('.ac').textContent=BL.act;const sp=h.querySelector('.rb.sp b');if(sp)sp.textContent='×'+speed;
 /* 対象 */
 const t=B.tgt&&B.tgt.alive?B.tgt:aliveE()[0],tg=h.querySelector('.b22tg');
 if(!t){tg.innerHTML='';HK='';}else{const kw=t.weak.filter(x=>t.known.has(x)),tmp=(t.sts||[]).filter(s=>s.k==='weak').map(s=>s.el),unk=t.weak.length-t.known.size,multi=aliveE().length>1;let tags='';try{tags=tagH(t);}catch(x){}
  const k=[t.name,t.lv,t.boss,kw.join(''),tmp.join(''),unk,tags,multi].join('|');
  if(k!==HK||!tg.firstChild){HK=k;tg.className='b22tg'+(t.boss?' boss':'');
   tg.innerHTML=`<div class="nm">${t.boss?'<em class="bs">BOSS</em>':multi?'<em>TARGET</em>':''}<b>${t.name}</b><small>Lv${t.lv}</small></div>
    <div class="hp"><div class="bar"><s></s><u></u><i></i></div><em class="cnt"></em></div>
    <div class="wk">${ELS10.map(e=>{const w=kw.includes(e),tm=tmp.includes(e);return`<span class="${w?'w':''}${tm?' tm':''}" style="--c:${ELC[e]}"><i>${e}</i><u>${w||tm?WEAKSYM.w:''}</u></span>`;}).join('')}${unk>0?`<span class="q"><i>?</i><u>×${unk}</u></span>`:''}</div>
    ${tags?`<div class="st">${tags}</div>`:''}`;}
  hpBar(t,tg);}
 /* 星臨ボタン */
 const a=B.cur&&B.cur.side===0?B.cur:null,bt=h.querySelector('.b22aw');
 if(a){const rdy=!!B.pick&&!a.aw&&(DEV()||(a.ag>=100&&B.heroes.filter(x=>x.aw).length<2));bt.disabled=!rdy;bt.classList.toggle('rdy',rdy);bt.classList.toggle('on',!!a.aw);bt.style.display='';
  bt.querySelector('.g i').style.width=(a.aw?100:Math.min(100,a.ag))+'%';bt.querySelector('small').textContent=a.aw?'星臨中':rdy?SEIRIN.en:Math.floor(a.ag)+'%';}
 else{bt.disabled=true;bt.classList.remove('rdy');bt.querySelector('small').textContent=SEIRIN.en;}}
/* 対象のHPゲージ（ボスは複数本：ver0.21 の本数計算を使う） */
const BCOL=['#e5484d','#ff8a30','#ffd040','#6fdc7f','#5ad0ff','#c08cff'];
function hpBar(t,tg){const bs=V21.barState(t),bar=tg.querySelector('.bar');if(!bar)return;const fi=bar.querySelector('i'),tr=bar.querySelector('u'),bg=bar.querySelector('s');
 const fw=(bs.fill*100).toFixed(2)+'%',cur=BCOL[Math.max(0,bs.rem-1)]||BCOL[5],nxt=bs.rem>1?(BCOL[bs.rem-2]||BCOL[5]):'#2a0e14';
 if(bar._t!==t){bar._t=t;tr.style.transition='none';tr.style.width=fw;void tr.offsetWidth;tr.style.transition='';}
 if(fi.style.width!==fw){fi.style.width=fw;tr.style.width=fw;}if(fi._c!==cur){fi._c=cur;fi.style.setProperty('--c',cur);}if(bg._c!==nxt){bg._c=nxt;bg.style.background=nxt;}
 const cnt=tg.querySelector('.cnt'),ct=bs.n>1?'×'+bs.rem:'';if(cnt.textContent!==ct){cnt.textContent=ct;cnt.style.color=cur;}}
/* 狙いの輪（弱点を突く技を選んでいるときは WEAK） */
function reticle(){const r=$('#rt22');if(!r)return;if(!B||scene!=='battle'||B.over){r.style.display='none';return;}const t=B.tgt&&B.tgt.alive?B.tgt:null;
 if(!t||(!B.pick&&aliveE().length<2)){r.style.display='none';return;}let mx,my;try{[mx,my]=V19.mid(t);}catch(e){mx=t.x+8*t.sc;my=t.y+8*t.sc;}
 /* ver0.24：照準の大きさは敵の大きさに依らず画面幅の約13%（参考資料の比率）。大型ボスでも輪が体を覆い尽くさない */
 const A=t.A||{},x=(mx+(A.wx||0)+(A.kb||0))*SC,y=(my+(A.wy||0))*SC,s=Math.round(Math.max(44,Math.min(66,appW()*.132))),sk=B.sel22,wk=!!(sk&&sk.el&&t.weak.includes(sk.el)&&(t.known.has(sk.el)||(t.sts||[]).some(q=>q.k==='weak'&&q.el===sk.el)));
 const tf=`translate(${Math.round(x-s/2)}px,${Math.round(y-s/2)}px)`;if(r._tf!==tf){r._tf=tf;r.style.transform=tf;}if(r._s!==s){r._s=s;r.style.width=r.style.height=s+'px';}
 r.classList.toggle('wk',wk);r.style.display='block';}
{const _d=draw;draw=function(){_d();try{if(scene==='battle'&&B){reticle();const t=B.tgt&&B.tgt.alive?B.tgt:aliveE()[0],tg=$('#bt22 .b22tg');if(t&&tg)hpBar(t,tg);}}catch(e){if(!draw._e22){draw._e22=1;console.error(e);}}};}

/* ---------- 行動中キャラの帯（名前・星臨ゲージ・立ち絵・HP/SP/状態） ---------- */
function panel22(){const P=$('#party');if(!B||!P)return;const a=B.cur&&B.cur.side===0?B.cur:(B.lastH&&B.heroes.includes(B.lastH)?B.lastH:B.heroes[0]);if(!a)return;
 const my=B.cur===a,el=elOf(a.id),ec=ELC[el]||'#c8b0ff',lv=G.h[a.id].awLv||1,low=a.hp<a.mhp*.3,dev=DEV(),G2=GAUGE.includes(a.id);
 const gw=a.aw?(G2?a.ag:clamp((1-a.awT/Math.max(1,awN(a)))*100,0,100)):Math.min(100,a.ag),gv=a.aw?(G2?Math.round(a.ag)+'':'残'+Math.max(0,awN(a)-a.awT)):Math.floor(a.ag)+'%';
 const sts=(a.sts||[]).map(s=>{const b=V20.isBuff(s),nm=s.k==='weak'?s.el:(V20.STN[s.k]||['',''])[1];return`<i class="si20 ${b?'bu':'de'}">${nm}${(['atk','def','mag','res','spd','crit'].includes(s.k))?(s.v>0?'▲':'▼'):''}${s.t<50?`<sub>${s.t}</sub>`:''}</i>`;}).join('');
 let tg='';try{tg=tagH(a);}catch(e){}
 const ht=`<i class="ap1" style="display:none"></i><i class="bp20" style="display:none"></i><div class="bp22${a.aw?' awk':''}${my?'':' off'}${a.ag>=100&&!a.aw?' full':''}" style="--ec:${ec}">
  <div class="pn"><div class="nm">${hx(el,ec,'sm')}<b>${a.name}</b><small>Lv${G.h[a.id].lv}</small><span class="rk" title="${SEIRIN.n}位階">${'<i class="on"></i>'.repeat(lv)}${'<i></i>'.repeat(3-lv)}</span></div>
   <div class="gg"><em>${a.aw?AW[a.id].name:SEIRIN.ge}</em><div class="bar"><i style="width:${gw}%"></i></div><span>${gv}</span></div></div>
  <img class="pf" src="${art(a.id,a.aw)}" alt="">
  <div class="sr"><div class="bx hp${low?' low':''}"><em>HP</em><b>${a.hp}</b><small>/${a.mhp}</small></div><div class="bx sp"><em>SP</em><b>${dev?'∞':a.sp}</b><small>/100</small></div><div class="bx ts">${sts||tg||'<small class="nst">状態異常なし</small>'}</div></div></div>`;
 if(P._h22!==ht||!P.querySelector('.bp22')){P._h22=ht;P.innerHTML=ht;}P.className='act v22';}
/* 味方：足元の右に HP（大きな数字）・SP・星臨ゲージ */
function heroLabs(){B.heroes.forEach(h=>{const el=h._pl;if(!el)return;let fx,fy;try{[fx,fy]=V19.foot(h);}catch(e){fx=h.x+16;fy=h.y+30;}
 el.style.left=Math.round((fx+4)*SC)+'px';el.style.top=Math.round((fy-15)*SC)+'px';el.classList.add('v22');
 const hs=el.querySelector('.hs span');if(hs)hs.textContent=DEV()?'SP∞':'SP'+h.sp;const em=el.querySelector('.hs em');if(em&&h.ag>=100&&!h.aw)em.textContent=SEIRIN.n+'OK';});}
{const _rf=refresh;refresh=function(){_rf();if(!B||scene!=='battle')return;try{updHud();}catch(e){console.error(e);}};}

/* ---------- 技リスト（ver0.17 の入力処理を引き継ぎ、見た目と開発者モードを追加） ---------- */
const KINDN=s=>s.k==='phys'||s.k==='rhythm'||s.basic?['物理','ph']:s.k==='mag'?['魔法','mg']:(/heal|revive/i.test(s.k||'')||s.role==='heal'||s.heal20)?['回復','hl']:s.k==='item'?['道具','it']:['補助','sp'];
const TGTN=s=>s.k==='healAll'||s.k==='reviveAll'?'味方全体':s.t==='one'?'敵単体':s.t==='all'?(KINDN(s)[1]==='hl'||KINDN(s)[1]==='sp'?'味方全体':'敵全体'):s.t==='ally'?'味方1人':s.t==='self'?'自分':'―';
const REQN={charged:'充填後のみ',lowhp:'HP25%以下のとき',stk3:'対消滅3段階で解禁'};
const reqTxt=r=>!r?'':REQN[r]||(HB[r]?`${HB[r].name}の${SEIRIN.n}後`:'特殊条件');
function skInfo(sk,u){const s=sk.basic?Object.assign({},sk,{n:sk.n==='攻撃'?'通常攻撃':sk.n,d:'SPを使わない基本の攻撃'}):sk;const[kn,kc]=KINDN(s),[el,ec]=skBadge(s);
 const pw=s.fixed?'固定':s.pow?`${s.pow}${s.hits>1?' ×'+s.hits+'回':''}`:'―',cost=s.sp?'SP '+s.sp:s.gauge?'ゲージ '+s.gauge:s.gaugeAll?'ゲージ全部':'なし';
 ovOpen(`<div class="inf22" style="--ec:${ec}"><div class="ih">${hx(el,ec)}<b>${esc(s.n||(ITEMS[s.id]&&ITEMS[s.id].n)||'')}</b><span class="tg ${kc}">${kn}</span></div>
  <div class="id">${esc(s.d||(ITEMS[s.id]&&ITEMS[s.id].d)||'')}</div>
  <dl class="dl22">${s.k!=='item'&&typeof TERMS!=='undefined'?`<dt>区分</dt><dd>${TERMS.skillName(s,u&&u.side===0?u.id:null)}</dd>`:''}<dt>属性</dt><dd>${s.el||'なし'}</dd><dt>対象</dt><dd>${TGTN(s)}</dd><dt>威力</dt><dd>${pw}</dd><dt>消費</dt><dd>${cost}</dd>${s.req?`<dt>条件</dt><dd>${reqTxt(s.req)}</dd>`:''}${s.delay?`<dt>追加</dt><dd>敵の行動を遅らせる</dd>`:''}${s.hpCost?`<dt>代償</dt><dd>HP${Math.round(s.hpCost*100)}%</dd>`:''}</dl>
  ${u&&B&&B.tgt&&s.el?`<div class="iw">${B.tgt.name}に対して：${B.tgt.weak.includes(s.el)&&B.tgt.known.has(s.el)?'<b class="w">弱点を突ける ▲</b>':B.tgt.known.size>=B.tgt.weak.length?(typeof TERMS!=='undefined'&&TERMS.resists(B.tgt,s.el)?'<b>耐性がある（Resist）</b>':'弱点ではない'):'まだ分からない'}</div>`:''}</div>
  <button class="tbtn back wide" data-a="close">閉じる</button>`,{close:ovClose});}
chooseRoot=function(u){
 if(u.id==='valk'&&u.aw&&!DEV())return(async()=>{log('竜血が暴れる――<b>ヴァルクは止まらない！</b>');await wait(450);return autoPick(u);})();
 return new Promise(res0=>{let tab='sk',sel=-1,sub=null,lock=false,R=[];const dev=DEV();
  const res=v=>{B.res=null;B.pick=null;B.sel22=null;bbar();res0(v);};
  const fin=(sk,t)=>{LASTA[u.id]={sk};res(t?{sk,t}:{sk});};
  B.res=()=>res(autoPick(u));
  const use=sk=>{if(sk.k==='reso'||sk.t==='all'||sk.t==='self')return fin(sk);
   if(sk.t==='one'){if(!B.tgt||!B.tgt.alive)B.tgt=aliveE()[0];return fin(sk,B.tgt);}
   const pool=sk.revive?B.heroes.filter(h=>!h.alive):aliveH();if(!pool.length){log('対象がいない');return;}
   sub={t:`<b>${sk.n||ITEMS[sk.id].n}</b>　誰に使う？`,rows:pool.map(t=>({el:'味',ec:elCol(t.id),n:t.name,d:t.alive?`HP ${t.hp}/${t.mhp}`:'戦闘不能',cost:t.alive?`${t.hp}/${t.mhp}`:'',now:1,f:()=>fin(sk,t)}))};draw();};
  const rows=()=>{if(sub)return[...sub.rows,{el:'戻',ec:'#aab0d8',n:'もどる',cls:'back',now:1,f:()=>{sub=null;draw();}}];const o=[];
   if(tab==='sk'){if(canReso())o.push({el:'共',ec:'#ff9ad6',n:`共鳴技「${resoName()}」`,d:'二人の'+SEIRIN.n+'を重ねる大技'+(dev?'（開発：何度でも）':'（1戦闘に1回）'),cls:'reso',sk:{n:'共鳴技「'+resoName()+'」',k:'reso',t:'all',d:'二人の星臨を重ねる大技（1戦闘に1回）'},f:()=>fin({k:'reso'})});
    const a=ATK(u),[ae,ac]=skBadge(a);o.push({el:ae,ec:ac,n:a.n==='攻撃'?'通常攻撃':a.n,d:'SPを使わない基本の攻撃',cost:'SP 0',sk:a,cls:'basic',f:()=>use(a)});
    (u.aw?awCmds(u):u.skills).forEach(k=>{const s=SK[k];if(!s)return;const[e,c]=skBadge(s);o.push({el:e,ec:c,n:s.n,d:s.d||'',sk:s,cost:s.sp?'SP '+s.sp:s.gauge?'ゲージ '+s.gauge:'―',ng:!dev&&(s.sp||0)>u.sp,dis:!dev&&skDis(u,s),f:()=>use(s)});});}
   if(tab==='it'){const I=G.items,dead=B.heroes.some(h=>!h.alive);Object.keys(ITEMS).filter(k=>(I[k]||0)>0||k==='potion').forEach(k=>{const rv=k==='feather'||k==='tail';
     o.push({el:'道',ec:'#7dffa8',n:ITEMS[k].n,d:ITEMS[k].d,cost:'×'+(I[k]||0),ng:!I[k],dis:!I[k]||(rv&&!dead),now:1,sk:{n:ITEMS[k].n,k:'item',id:k,t:'ally',d:ITEMS[k].d},f:()=>use({k:'item',id:k,t:'ally',revive:rv})});});}
   if(tab==='op'){const rs=G.members.filter(id=>!B.heroes.some(h=>h.id===id)&&G.h[id].hp!==0),nf=!!B.opts.boss||!!B.opts.event||!!B.opts.trial;
    o.push({el:'守',ec:'#9fd8ff',n:'防御',d:'次の手番まで被ダメージ半減',f:()=>fin(GUARD)});
    o.push({el:'替',ec:'#c8b0ff',n:'交代',d:rs.length?'控えの仲間と入れ替わる（行動を消費しない）':'控えがいない',dis:!rs.length||u.swapped||u.aw,now:1,f:()=>{sub={t:'<b>交代</b>　誰と入れ替わる？',rows:rs.map(id=>({el:elOf(id)||'無',ec:elCol(id),n:HB[id].name,d:`Lv${G.h[id].lv}　${clsOf(id)}`,cost:'Lv'+G.h[id].lv,now:1,f:()=>res({swap:id})}))};draw();}});
    if(u.aw&&(u.id==='rio'||dev)&&!canReso())o.push({el:'解',ec:'#ffe27a',n:SEIRIN.n+'解除',d:'任意で'+SEIRIN.n+'を解く',f:()=>{endAw(u);sel=-1;draw();}});
    o.push({el:'逃',ec:'#aab0d8',n:'逃げる',d:nf?'この戦いからは逃げられない':'素早さが高いほど成功しやすい',dis:nf,f:()=>res({flee:1})});}
   return o;};
  const tabs=[['sk',u.aw?SEIRIN.n+'技':'技'],['it','道具'],['op','作戦']];
  const draw=()=>{const c=$('#cmd');c.className='bcmd v22';sel=-1;B.sel22=null;if(lock){c.innerHTML='<div class="bwait">…</div>';return;}R=rows();
   c.innerHTML=(sub?`<div class="bsub v22">${sub.t}</div>`:`<div class="btabs v22">${tabs.map(([k,l])=>`<button class="${tab===k?'on':''}" data-t="${k}">${l}</button>`).join('')}${dev?'<span class="dvt">DEV ∞</span>':''}</div>`)+
    `<div class="blist v22">${R.map((r,i)=>`<button class="sk ${r.cls||''}" data-i="${i}" data-v20="1" ${r.dis?'disabled':''}><span class="hd">${ic('hand')}</span>${r.el?hx(r.el,r.ec,'el'):''}<span class="nm">${r.n}</span>${r.cost?`<span class="cost${r.ng?' ng':''}">${r.cost.replace(/^(SP|ゲージ) /,'<small>$1</small>')}</span>`:''}${r.sk?`<span class="inf" data-inf="${i}">i</span>`:''}</button>`).join('')}</div>`;
   c.scrollTop=0;bbar();};
  const head=()=>log(`<b>${u.name}</b>の番${u.aw?`（${AW[u.id].name}：${awTag(u).trim()}）`:''}　<small>技を2回タップで決定／敵をタップで狙う</small>`);
  B.pick={u,tab:k=>{tab=k;sub=null;SFX.sel();draw();},
   row:i=>{const r=R[i];if(!r||r.dis)return;SFX.sel();if(r.now||G.set.tap1||sel===i)return r.f();sel=i;B.sel22=r.sk||null;[...$('#cmd').querySelectorAll('.blist .sk')].forEach((b,j)=>b.classList.toggle('sel',j===i));
    log(`<b>${r.n}</b>　${r.d||''}<br><small style="color:#ffe27a">▶ もう一度タップで決定${B.tgt&&aliveE().length>1?'（狙い：'+B.tgt.name+'）':''}</small>`);},
   info:i=>{const r=R[i];if(r&&r.sk){SFX.sel();skInfo(r.sk,u);}},
   rep:()=>{const s=repOK(u);if(s&&!lock)use(s);},retarget:()=>{if(sel>=0&&R[sel])log(`<b>${R[sel].n}</b>　${R[sel].d||''}<br><small style="color:#ffe27a">▶ もう一度タップで決定（狙い：${B.tgt.name}）</small>`);},
   aw:async()=>{if(lock||u.aw)return;if(!DEV()&&!(u.ag>=100&&B.heroes.filter(h=>h.aw).length<2))return;if(DEV())u.ag=100;lock=true;sub=null;draw();await awaken(u);lock=false;tab='sk';draw();updHud();tip(canReso()?'reso':'awake2');}};
  head();draw();refresh();
  if(!tip('battle')&&u.ag>=100&&!u.aw)tip('awake');});};
/* ⓘ：行の選択より先に拾う */
$('#cmd').addEventListener('click',e=>{const t=e.target.closest('[data-inf]');if(!t||!B||!B.pick||!B.pick.info)return;e.stopPropagation();e.preventDefault();B.pick.info(+t.dataset.inf);},true);
/* 下のボタン：速度・通常AUTO・全力AUTO・リピート */
bbar=function(force){const b=$('#bbar');if(!b||!G)return;const p=B&&B.pick,l=p&&repOK(p.u),sg=[l?l.n:'',auto,AM,G.set.autoAw,speed].join();if(!force&&b._s===sg)return;b._s=sg;b.classList.add('v22');
 b.innerHTML=`<button data-b22="spd" class="spd">${ic('fast')}<b>×${speed}</b></button><button data-b="n" class="au${auto&&AM==='n'?' on':''}">通常AUTO<small>${SEIRIN.n}：${AWN[G.set.autoAw]}</small></button><button data-b="f" class="au f${auto&&AM==='f'?' on':''}">全力AUTO<small>${SEIRIN.n}・共鳴も使う</small></button><button data-b="rep" class="rp" ${l?'':'disabled'}>リピート<small>${l?esc(l.n==='攻撃'?'通常攻撃':l.n):'前回と同じ行動'}</small></button>`;};
/* 星臨の演出：大きな「星臨」の文字と星座の輪 */
{const _aw=awaken;awaken=async function(u){const p=_aw(u),cut=$('#cut');try{const A=AW[u.id],lv=u.awLv||1,ec=elCol(u.id);cut.classList.add('sr22');cut.style.setProperty('--ec',ec);
  const tx=[...cut.children].find(x=>x.tagName==='DIV');if(tx)tx.className='sr22t',tx.innerHTML=`<div class="t">${u.name} ― ${SEIRIN.en}${lv>1?'　位階'+ROMAN[lv]:''}</div><div class="b">《${A.name}》</div>`;
  cut.insertAdjacentHTML('afterbegin',`<div class="sr22bg"><i></i><i></i><i></i></div><div class="sr22k"><b>星</b><b>臨</b></div>`);}catch(e){console.error(e);}
 try{return await p;}finally{cut.classList.remove('sr22');}};}

/* ---------- 開発者モード：戦闘中はSP・ゲージ・星臨・共鳴技が無制限 ---------- */
/* SP・星臨ゲージを満タンに保つ。星臨の持続（行動回数）は通常どおり減る＝連続行動が止まらなくなることはない。
   解けたらすぐ再発動でき、同時星臨の人数制限・共鳴技の1戦闘1回の制限もない */
function devRefill(){if(!DEV()||!B)return;B.heroes.forEach(h=>{if(!h.alive)return;h.sp=100;if(h.aw){if(GAUGE.includes(h.id))h.ag=100;}else h.ag=100;});B.reso=false;B.zenUsed=false;}
{const _ht=heroTurn;heroTurn=async function(u){if(DEV())devRefill();const r=await _ht(u);if(DEV())devRefill();return r;};}
{const _rs=reso;reso=async function(u){const r=await _rs(u);if(DEV()&&B)B.reso=false;return r;};}

/* ==================== 2. ホーム画面 ==================== */
const homeHgt=()=>{const sc=appW()/W;return clamp(Math.floor(V21.contentH()/sc),240,460);};
function homeLayout(){if(!isHome())return;const hh=homeHgt();HM.ty=clamp(Math.round((hh-HOME_H)*.3),24,56);if(H!==hh)setH(hh);else fit();}
/* 街の絵の上（空）と下（広場）を描き足して、画面全体を街にする */
function skyExt(h){if(HM.sky&&HM.sky.height===h)return HM.sky;const c=document.createElement('canvas');c.width=W;c.height=Math.max(1,h);const g=c.getContext('2d'),R=rng(2201);
 const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#020310');gr.addColorStop(1,'#060822');g.fillStyle=gr;g.fillRect(0,0,W,h);
 for(let i=0;i<h*1.4;i++){g.fillStyle=['#ffffff','#c8d0ff','#ffe9a0','#8890c0'][R()*4|0];g.fillRect(R()*W|0,R()*h|0,1,1);}return HM.sky=c;}
function plazaExt(h){if(HM.ext&&HM.extH===h)return HM.ext;const c=document.createElement('canvas');c.width=W;c.height=Math.max(1,h);const g=c.getContext('2d'),R=rng(2202);
 const mix=(a,b,t)=>{const p=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));const x=p(a),y=p(b);return'rgb('+x.map((v,i)=>Math.round(v+(y[i]-v)*t)).join(',')+')';};
 for(let yy=0;yy<h;yy++){g.fillStyle=mix('#33314a','#25233a',Math.min(1,yy/Math.max(1,h)));g.fillRect(0,yy,W,1);}
 /* 石畳（街の絵と同じ並びで続ける。手前ほど少し大きく） */
 for(let y=174;y<HOME_H+h;y+=5){const yy=y-HOME_H,off=((y/5)|0)%2?4:0;for(let xx=-off;xx<W;xx+=9){g.fillStyle='#2a2840';g.fillRect(xx,yy+4,8,1);g.fillRect(xx+8,yy,1,5);if(R()<.25){g.fillStyle='#55537a';g.fillRect(xx+1,yy,6,1);}if(R()<.12){g.fillStyle='#4a4868';g.fillRect(xx+2,yy+1,4,2);}}}
 /* 赤い絨毯（奥から手前へ広がる） */
 for(let yy=-2;yy<h;yy++){const y=HOME_H+yy,w=5+(y-100)*.07,x0=Math.round(90-w),ww=Math.round(w*2);g.fillStyle=(y%6)<1?'#7a1f2a':'#b0323c';g.fillRect(x0,yy,ww,1);g.fillStyle='#e8c040';g.fillRect(x0,yy,1,1);g.fillStyle='#a8801e';g.fillRect(x0+ww-1,yy,1,1);
  if(y%12===0){g.fillStyle='rgba(255,220,120,.35)';g.fillRect(x0+3,yy,ww-6,1);}}
 /* 街灯・花壇・旗（左右対称） */
 const lamp=(x,y)=>{g.fillStyle='#1a1830';g.fillRect(x-1,y-26,3,26);g.fillStyle='#3a3858';g.fillRect(x-1,y-26,1,26);g.fillStyle='#1a1830';g.fillRect(x-3,y-2,7,2);g.fillRect(x-3,y-30,7,4);g.fillStyle='#ffe9a0';g.fillRect(x-2,y-29,5,2);g.fillStyle='rgba(255,220,120,.18)';g.fillRect(x-6,y-34,13,10);};
 const bed=(x,y,w)=>{g.fillStyle='#4a3a2a';g.fillRect(x,y,w,5);g.fillStyle='#6a5240';g.fillRect(x,y,w,1);g.fillStyle='#2e6a3a';g.fillRect(x+1,y-3,w-2,4);g.fillStyle='#3e8a4a';g.fillRect(x+2,y-4,w-4,2);for(let i=0;i<w/3;i++){g.fillStyle=['#ff8aa0','#ffe27a','#ffffff','#9fd8ff'][(i+x)%4];g.fillRect(x+2+((i*3+1)%(w-4)),y-4+(i%2),1,1);}};
 const flag=(x,y,c)=>{g.fillStyle='#8a7a5a';g.fillRect(x,y-34,1,34);g.fillStyle=c;g.fillRect(x+1,y-33,7,10);g.fillStyle='#e8c040';g.fillRect(x+1,y-24,7,1);g.fillRect(x+3,y-30,3,3);};
 if(h>30){lamp(22,30);lamp(158,30);bed(4,44,26);bed(150,44,26);}
 if(h>70){flag(40,72,'#3a4aa8');flag(132,72,'#b0323c');bed(12,92,22);bed(146,92,22);lamp(36,108);lamp(144,108);}
 /* 手前を少し暗く（下のボタンを読みやすく） */
 const gr=g.createLinearGradient(0,Math.max(0,h-90),0,h);gr.addColorStop(0,'rgba(5,6,15,0)');gr.addColorStop(1,'rgba(5,6,15,.7)');g.fillStyle=gr;g.fillRect(0,Math.max(0,h-90),W,90);
 HM.extH=h;return HM.ext=c;}
const _drawHome=drawHome;
drawHome=function(){if(!HM.on)return _drawHome();const off=HM.ty,eh=Math.max(0,H-off-HOME_H);ctx.drawImage(skyExt(off+2),0,0);ctx.drawImage(townImg(),0,off);if(eh)ctx.drawImage(plazaExt(eh),0,off+HOME_H);
 const a=.5+.2*Math.sin(tick/25);lampGlow(90,24+off,34,a);
 const ang=tick/110,dx=Math.cos(ang),al=.16*Math.abs(dx);if(al>.01){ctx.fillStyle=`rgba(255,240,180,${al})`;const dir=dx>0?1:-1;for(let i=0;i<60;i++){const x=90+dir*i*2,hh=2+i*.34;ctx.fillRect(dir>0?x:x-2,Math.round(24+off-hh/2),2,Math.round(hh));}}
 for(let k=0;k<4;k++){const t=(tick+k*22)%88;ctx.fillStyle=`rgba(200,200,220,${.45*(1-t/88)})`;ctx.fillRect(Math.round(160+Math.sin((t+k*9)*.08)*3),off+81-Math.round(t*.32),3+(t>40?1:0),3);}
 ctx.fillStyle=(tick>>3)%2?'#ffe9a0':'#ffb040';ctx.fillRect(153,off+116,3,2);
 if((tick>>4)%4===0){ctx.fillStyle='#ffffff';ctx.fillRect(86+((tick>>4)*3)%9,off+113+((tick>>4)*5)%12,1,1);}
 for(const[lx,ly]of[[22,HOME_H+30-29],[158,HOME_H+30-29],[36,HOME_H+108-29],[144,HOME_H+108-29]])if(ly<HOME_H+eh)lampGlow(lx,off+ly,10,.35+.1*Math.sin(tick/17+lx));
 if(G&&G.fac&&G.fac.garden){const gy=off+40+Math.round(Math.sin(tick/40)*2);ctx.drawImage(gardenIsle(),18,gy);}
 /* 広場を歩く仲間（広げた広場も使う） */
 if(G&&G.party){const W2=HM.walk,ymax=Math.min(HOME_H+eh-6,H-off-Math.round(150/SC)),ymin=124;while(W2.length<G.party.length)W2.push({x:60+W2.length*20,y:150+W2.length*5,tx:0,ty:0,w:20+W2.length*30,d:-1,mv:0});W2.length=G.party.length;
  W2.forEach(w=>{if(w.y>ymax)w.y=ymax;if(w.w>0){w.w--;w.mv=0;if(!w.w){for(let t=0;t<8;t++){w.tx=40+Math.random()*100;w.ty=ymin+Math.random()*Math.max(10,ymax-ymin);if(Math.hypot((w.tx-90)/14,(w.ty-140)/9)>1.25)break;}}}
   else{const ddx=w.tx-w.x,ddy=w.ty-w.y,d=Math.hypot(ddx,ddy);if(d<.6){w.w=60+Math.random()*160|0;w.mv=0;}else{w.x+=ddx/d*.3;w.y+=ddy/d*.22;w.mv=1;if(Math.abs(ddx)>.3)w.d=ddx>0?1:-1;}}});
  W2.map((w,i)=>[w,G.party[i]]).sort((p,q)=>p[0].y-q[0].y).forEach(([w,id],i)=>drawSprite(SPDEF[id]?id:'rio',w.mv?'walk':'idle',w.mv?(tick>>3):(tick>>4)+i,FOPT,Math.round(w.x),Math.round(w.y)+off,w.d>0));}};
/* 次の目的地 */
function nextDest(){let w=null;try{w=[...WAREAS].reverse().find(x=>x.need());}catch(e){}if(!w)return null;const A=AREAS[w.id];return{ch:w.ch||'',nm:w.nm||(A&&A.name)||'',rc:(A&&A.rec)||(w.rec&&w.rec())||''};}
function homeBadges(){const un=G.inv.filter(i=>i.unid).length,pts=G.members.some(i=>ptsLeft(i)>0),np=G.members.reduce((a,i)=>a+Math.max(0,ptsLeft(i)),0),bn=typeof bondReadyN==='function'?bondReadyN():0,
 qr=QS.filter(q=>{try{return!G.q.done[q.id]&&q.ok();}catch(e){return false;}}).length,qd=QS.filter(q=>G.q.done[q.id]).length,gd=G.fac.garden&&G.garden&&G.garden.n,
 tr=G.members.some(id=>{const l=G.h[id].awLv||1;return l<3&&G.h[id].lv>=(l===1?15:30);});return{un,pts,np,bn,qr,qd,gd,tr};}
let TOAST=null;
function toast(html){const L=$('#labels');if(!L||!html)return;let t=L.querySelector('.h22toast');if(!t){t=document.createElement('div');t.className='h22toast';L.appendChild(t);}
 t.innerHTML=html;t.classList.remove('show');void t.offsetWidth;t.classList.add('show');clearTimeout(TOAST);TOAST=setTimeout(()=>{t.classList.remove('show');},4200);}
const DEFMSG='大灯（おおあかり）に守られた最後の街。準備を整えよう。';
townMenu=function(m){WMS.on=false;TSC='home';if(scene!=='town')show('town');HM.on=true;homeLayout();app.classList.add('home22');devBtn(!!G.dev);hud('');$('#stage').style.display='';
 const warn=!G.dev&&G.sorties-(G.lastExp??0)>=8?'<br><small style="color:#ffb030">⚠ しばらく記録の控えを取っていません。「メニュー→書き出す」で控えを</small>':'';
 log((m||DEFMSG)+warn);const vn=G.flags.boss8&&typeof voidNews==='function'?voidNews():'';
 const b=homeBadges(),pw=G.party.reduce((s,id)=>s+power(id),0),nx=nextDest();
 $('#labels').innerHTML=`<div class="h22">
  <div class="h22top"><span class="rs t"><img src="${ICON.tou}" alt=""><b>${fmt(G.tou||0)}</b></span><span class="rs s"><img src="${ICON.go}" alt=""><b>${G.sorties}</b><small>出撃</small></span><span class="rs g"><img src="${ICON.coin}" alt=""><b>${fmt(G.gold)}</b></span></div>
  <div class="h22name"><b>灯都ルミナス</b><span class="ch">${chapter()}</span><em>パーティ戦闘力</em><strong>${fmt(pw)}</strong></div>
  <button class="h22mis${b.qr?' rdy':''}" data-h22="quest"><span class="wing l"></span><span class="mt"><b>依頼ミッション</b><small>${b.qr?'報酬を受け取れる！':'達成して報酬GET!'}</small></span><span class="mp"><i style="width:${QS.length?b.qd/QS.length*100:0}%"></i><em>${b.qd}/${QS.length}</em></span><span class="wing r"></span>${isBadge(b.qr)}</button>
  <div class="h22left">${[['shop','shop','道具屋'],['smith','smith','鍛冶屋'],['appraise','eye','鑑定屋']].map(([g,k,l])=>`<button class="h22dia" data-h22="${g}"><span class="dia">${ic(k)}</span><b>${l}</b>${isBadge(g==='appraise'?b.un:0)}</button>`).join('')}</div>
  <div class="h22right">${[['menu','menu','メニュー',0],['news','bell','お知らせ',vn?true:0],['quest','scroll','ミッション',b.qr],['inv','bag','持ち物',0],['zk','book','図鑑',0],['bond','heart','絆',b.bn],['dev','castle','発展',b.gd?true:0]].map(([g,k,l,n])=>`<button data-h22="${g}">${ic(k)}<small>${l}</small>${isBadge(n)}</button>`).join('')}</div>
  <div class="h22go">${nx?`<button class="h22nx" data-h22="go"><em>NEXT</em><b>${esc(nx.nm)}</b><small>${esc(nx.rc)}</small></button>`:''}
   <button class="h22tr${b.tr?' rdy':''}" data-h22="trial"><b>挑戦</b><small>${SEIRIN.n}の試練</small>${isBadge(b.tr?true:0)}</button>
   <button class="h22sortie" data-h22="go"><span class="rg"></span><b>出撃</b><small>WORLD MAP</small></button></div>
  <nav class="h22nav">${[['home','home','ホーム',0],['party','party','編成',b.pts],['star','star','星詠み',b.pts],['smith','smith','鍛冶屋',0],['tavern','bar','酒場',b.bn],['shop','shop','道具屋',0]].map(([g,k,l,n])=>`<button data-h22="${g}" class="${g==='home'?'on':''}">${ic(k)}<b>${l}</b>${isBadge(n)}</button>`).join('')}</nav></div>`;
 HM.news=vn;const c=$('#cmd');c.className='home22';c.innerHTML='';
 if(m&&m!==DEFMSG)toast(m+(vn&&/虚蝕/.test(vn)?'':''));else if(warn)toast(warn.replace(/^<br>/,''));
 tip('town');};
const HGO={quest:()=>missionScreen('home'),menu:()=>saveMenu(),news:()=>newsSheet(),inv:()=>invMenu(),zk:()=>zkMenu(),bond:()=>bondMenu(),dev:()=>devMenu(),trial:()=>trialMenu(),
 home:()=>townMenu(),party:()=>partyScreen(),star:()=>openBoard(G.party[0]),smith:()=>smith(),tavern:()=>tavern(),shop:()=>shop(),appraise:()=>appraise(),go:()=>worldMap()};
document.addEventListener('click',e=>{const t=e.target.closest('[data-h22]');if(!t||scene!=='town'||t.disabled)return;const f=HGO[t.dataset.h22];if(!f)return;SFX.sel();HM.on=false;app.classList.remove('home22');f();});
function newsSheet(){const vn=HM.news||'';ovOpen(`<div class="nw22"><div class="nh">${ic('bell')}<b>お知らせ</b></div>${vn||'<div class="nn">新しいお知らせはありません</div>'}
 <div class="nt"><b>ver0.22</b>　戦闘・ホーム・編成の画面を一新。「覚醒」は<b>${SEIRIN.n}（${SEIRIN.kana}）</b>に改めました。<br><small>${SEIRIN.lore}</small></div></div><button class="tbtn back wide" data-a="close">閉じる</button>`,{close:ovClose});}
/* ホーム以外の画面へ移るときは全画面の街をやめる */
{const _pn=panel;panel=function(html,acts){if(scene==='town'&&HM.on){HM.on=false;app.classList.remove('home22');}_pn(html,acts);};}
{const _mn=menu;menu=function(items,list,xc){if(scene==='town'&&HM.on){HM.on=false;app.classList.remove('home22');}_mn(items,list,xc);};}
{const _ro=roomOpen;roomOpen=function(...a){HM.on=false;app.classList.remove('home22');return _ro(...a);};}
{const _wm=worldMap;worldMap=function(m){HM.on=false;app.classList.remove('home22');return _wm(m);};}

/* ==================== 6. ミッション（一括受け取り） ==================== */
let MT='rdy',MFROM='home';
const qOk=q=>{try{return!G.q.done[q.id]&&!!q.ok();}catch(e){return false;}};
const qPg=q=>{try{return String(q.pg());}catch(e){return'';}};
function claimQuests(list){const got=[];for(const q of list){if(G.q.done[q.id]||!qOk(q))continue;try{q.give();G.q.done[q.id]=1;got.push(q);}catch(e){console.error(e);}}if(got.length){SFX.aw();save();}return got;}
function claimedSheet(got){ovOpen(`<div class="cl22"><div class="ch">${ic('gift')}<b>報酬を受け取りました</b><small>${got.length}件</small></div><div class="cs">${got.map((q,i)=>`<div class="ci" style="--d:${i*.06}s"><b>${esc(q.n)}</b><span>${esc(q.rw)}</span></div>`).join('')}</div></div>
 <button class="tbtn gold wide" data-a="close">OK</button>`,{close:()=>{ovClose();missionScreen();}});}
function missionScreen(from,m){if(from)MFROM=from;if(scene!=='town')show('town');TSC='other';
 const L=QS.map(q=>({q,done:!!G.q.done[q.id],ok:qOk(q)})),rdy=L.filter(x=>x.ok),prog=L.filter(x=>!x.done&&!x.ok),done=L.filter(x=>x.done);
 if(MT==='rdy'&&!rdy.length&&!m)MT=prog.length?'prog':'done';
 const list=MT==='rdy'?rdy:MT==='prog'?prog:done;
 log(m||`<b>ミッション</b>　達成した依頼の報酬を受け取れる。<b>一括受け取り</b>なら、受け取れるものだけをまとめて受け取る`);
 const row=({q,done,ok})=>{const pg=qPg(q),mt=/^(\d+)\/(\d+)$/.exec(pg),pc=done||ok?100:mt?Math.min(100,+mt[1]/+mt[2]*100):0;
  return`<div class="ms22c${done?' done':ok?' ok':''}"><div class="mh"><span class="ic">${ic(done?'trophy':ok?'gift':'scroll')}</span><b>${esc(q.n)}</b><span class="st">${done?'受取済み':ok?'達成！':esc(pg)}</span></div>
   <div class="md">${esc(q.d)}</div><div class="mb"><i style="width:${pc}%"></i></div><div class="mr"><em>報酬</em><span>${esc(q.rw)}</span>${ok?`<button class="tbtn gold" data-a="one" data-v="${q.id}">受け取る</button>`:''}</div></div>`;};
 panel(`<div class="ms22"><div class="mt22"><div class="tt">${ic('scroll')}<b>ミッション</b></div><div class="cnt"><b>${done.length}</b>/${QS.length}<small>受取済み</small></div></div>
  <div class="stabs ms22t">${[['rdy','受け取り可能',rdy.length],['prog','進行中',prog.length],['done','受取済み',done.length]].map(([k,l,n])=>`<button class="${MT===k?'on':''}" data-a="tab" data-v="${k}">${l}<b>${n}</b></button>`).join('')}</div>
  <div class="ms22l">${list.map(row).join('')||`<div class="emp22">${MT==='rdy'?'受け取れる報酬はありません':MT==='prog'?'進行中の依頼はありません':'まだ受け取った報酬はありません'}</div>`}</div></div>
  <div class="tbar2"><button class="tbtn gold" data-a="all" ${rdy.length?'':'disabled'}>一括受け取り<small>${rdy.length?rdy.length+'件':'対象なし'}</small></button><button class="tbtn back" data-a="back">${MFROM==='tavern'?'◀ 酒場へ':'◀ ホームへ'}</button></div>`,
 {tab:k=>{MT=k;missionScreen();},one:id=>{const q=QS.find(x=>x.id===id);if(!q)return;const got=claimQuests([q]);if(got.length)claimedSheet(got);else missionScreen(null,'この依頼はまだ受け取れない');},
  all:()=>{const got=claimQuests(QS.filter(qOk));if(got.length){MT='done';claimedSheet(got);}else missionScreen(null,'受け取れる報酬はありません');},
  back:()=>{MT='rdy';MFROM==='tavern'?tavern():townMenu();}});}
board=function(m){missionScreen('tavern',m);};

/* ==================== 3. 編成画面 ==================== */
const RANKC=['','#9fb4ff','#ffd65a','#ff8af0'];
partyScreen=function(m){const P=G.party,bench=G.members.filter(id=>!P.includes(id)),tot=P.reduce((a,id)=>a+power(id),0),sel=PSEL&&G.members.includes(PSEL)?PSEL:(PSEL=null);
 log(m||(sel?`<b>${HB[sel].name}</b>を選択中　入れ替える相手をタップ／もう一度タップで詳細`:'<b>編成</b>　カードをタップで選ぶ。前衛は4人まで<br><small>技・共鳴技・星臨は下のボタンから確認できる</small>'));
 const eqs=id=>SLOTS6.map(sl=>{const it=G.h[id].eq[sl]&&findItem(G.h[id].eq[sl]);return it?`<img class="r${it.rar}" src="${itemIcon(it)}" alt="">`:'<i></i>';}).join('');
 const card=(id,i)=>{const h=G.h[id],pl=ptsLeft(id),lv=h.awLv||1,ec=elCol(id);return`<div class="pc22${sel===id?' sel':''}" data-a="c" data-v="${id}" style="--ec:${ec};--rc:${RANKC[lv]}">
  <div class="rk"><b>${ROMAN[lv]}</b></div><div class="ar"><i class="no">${i+1}</i>${conSvg(id)}<img src="${art(id)}" alt=""></div>
  <div class="nm">${hx(elOf(id),ec,'sm')}<span>${HB[id].name}</span></div><div class="lv">Lv${h.lv}<small>${clsOf(id)}</small></div>
  <div class="pw"><small>戦闘力</small><b>${fmt(power(id))}</b></div><div class="eq">${eqs(id)}</div>
  <button class="bd${pl>0?' rdy':''}" data-a="bd" data-v="${id}">✦ 星盤${pl>0?`<b>${pl}</b>`:''}</button></div>`;};
 const rs=resoPairs(P).filter(x=>x.uniq).length;
 panel(`<div class="ps22"><div class="ph"><div class="pt">${ic('party')}<b>パーティ編成</b><small>${chapter()}　仲間 ${G.members.length}人</small></div><div class="pp"><small>パーティ戦闘力</small><b>${fmt(tot)}</b></div></div>
  <div class="pcs">${P.map(card).join('')}${Array.from({length:4-P.length},()=>`<div class="pc22 emp" data-a="e"><b>＋</b><small>空き</small></div>`).join('')}</div>
  ${sel?`<div class="pact"><button class="tbtn gold" data-a="det">詳細・装備</button><button class="tbtn" data-a="bd" data-v="${sel}">星盤</button><button class="tbtn" data-a="rm" ${P.includes(sel)&&P.length>1?'':'disabled'}>控えへ</button><button class="tbtn back" data-a="x">選択解除</button></div>`:''}
  <div class="pin22"><button data-a="inf" data-v="sk"><span class="i">${ic('sword')}</span><b>技</b><small>効果・威力・消費</small></button><button data-a="inf" data-v="rs"><span class="i">${ic('link')}</span><b>共鳴技</b><small>${rs?`固有 ${rs}組`:'組み合わせ'}</small></button><button data-a="inf" data-v="aw"><span class="i">${ic('star')}</span><b>${SEIRIN.n}</b><small>位階・${SEIRIN.n}技</small></button></div>
  <div class="ttl2">控え ${bench.length}人</div><div class="pbench">${bench.map(id=>`<div class="pbt${sel===id?' sel':''}" data-a="c" data-v="${id}" style="--ec:${elCol(id)}"><img src="${art(id)}" alt=""><b>${HB[id].name}</b><small>Lv${G.h[id].lv}　${fmt(power(id))}</small></div>`).join('')||'<div class="emp" style="grid-column:1/-1">控えの仲間はいない</div>'}</div></div>
  <div class="tbar2"><button class="tbtn" data-a="inv">持ち物 <small>${G.inv.length}個</small></button><button class="tbtn back" data-a="back">◀ ホームへ</button></div>`,
 {c:id=>{if(!PSEL){PSEL=id;return partyScreen();}if(PSEL===id){PSEL=null;return equipMenu(id);}
   const a=PSEL,ia=P.indexOf(a),ib=P.indexOf(id);PSEL=null;if(ia>=0&&ib>=0){P[ia]=id;P[ib]=a;}else if(ia>=0)P[ia]=id;else if(ib>=0)P[ib]=a;else{PSEL=id;return partyScreen();}
   save();partyScreen(`<b>${HB[a].name}</b>と<b>${HB[id].name}</b>を入れ替えた`);},
  e:()=>{if(PSEL&&!P.includes(PSEL)){const a=PSEL;PSEL=null;P.push(a);save();partyScreen(`<b>${HB[a].name}</b>を前衛に加えた`);}else partyScreen('空き枠：下の<b>控え</b>から仲間を選んで、もう一度ここをタップ');},
  det:()=>{const a=PSEL;PSEL=null;equipMenu(a);},bd:id=>{PSEL=null;BFROM='party';BS.sel=null;openBoard(id);},
  rm:()=>{const a=PSEL;PSEL=null;G.party=P.filter(x=>x!==a);save();partyScreen(`<b>${HB[a].name}</b>を控えに下げた`);},x:()=>{PSEL=null;partyScreen();},
  inf:k=>{const id=PSEL||G.party[0];PSEL=null;partyInfo(k,id);},inv:()=>invMenu(),back:()=>{PSEL=null;townMenu();}});
 tip('party');};
formation=function(){partyScreen();};

/* ---------- 技・共鳴技・星臨の専用画面 ---------- */
function skSrc(id){const o={};(HB[id].skills||[]).forEach(k=>o[k]='初期');const h=G.h[id];(h.board||[]).forEach(k=>{const n=BOARD[id]&&BOARD[id][k];if(n&&n.t==='skill')o[n.v]='星盤';});
 (V20.LSK[id]||[]).forEach(([l,k])=>{if(!o[k])o[k]='Lv'+l;});return o;}
function skCard(k,o={}){const s=SK[k];if(!s)return'';const[kn,kc]=KINDN(s),[el,ec]=skBadge(s),pw=s.fixed?'固定':s.pow?`${s.pow}${s.hits>1?' ×'+s.hits+'回':''}`:'―',cost=s.sp?'SP '+s.sp:s.gauge?'ゲージ '+s.gauge:s.gaugeAll?'ゲージ全部':'なし';
 return`<div class="sk22 x22${o.lock?' lock':''}${o.cls?' '+o.cls:''}" style="--ec:${ec}"><div class="h">${hx(el,ec,'sm')}<b>${esc(s.n)}</b>${o.tag?`<span class="tg ${o.tc||''}">${o.tag}</span>`:''}<span class="tg ${kc}">${kn}</span>${cost!=='なし'?`<span class="c">${cost}</span>`:''}<i class="ar"></i></div>
  <div class="d">${esc(s.d||'')}</div><dl class="dl22"><dt>属性</dt><dd>${s.el||'なし'}</dd><dt>種類</dt><dd>${kn}</dd><dt>対象</dt><dd>${TGTN(s)}</dd><dt>威力</dt><dd>${pw}</dd><dt>消費</dt><dd>${cost}</dd>${o.src?`<dt>習得</dt><dd>${o.src}</dd>`:''}${s.req?`<dt>条件</dt><dd>${reqTxt(s.req)}</dd>`:''}${s.delay?'<dt>追加</dt><dd>敵の行動を遅らせる</dd>':''}${s.hpCost?`<dt>代償</dt><dd>HP${Math.round(s.hpCost*100)}%</dd>`:''}</dl></div>`;}
function skillsHTML(id){const lv=G.h[id].lv,src=skSrc(id),have=skillList(id),cp=V20.charPS(id),w=G.h[id].eq.w&&findItem(G.h[id].eq.w),wp=V20.wpOf(w);
 const later=(V20.LSK[id]||[]).filter(([l,k])=>!have.includes(k));
 return`<div class="sh22">技 <small>${have.length}種　タップで詳細</small></div>${have.map(k=>skCard(k,{src:src[k]})).join('')}
  ${later.length?`<div class="sh22">習得予定</div>${later.map(([l,k])=>skCard(k,{lock:1,src:'Lv'+l,tag:'Lv'+l,tc:'lk'})).join('')}`:''}
  <div class="sh22">パッシブ</div>${cp.map(p=>{const P=V20.PS[p.id];return`<div class="sk22 x22 ps${p.on?'':' lock'}"><div class="h"><i class="hx20 sm" style="--c:#c8b0ff">専</i><b>${P.n}</b><span class="tg ${p.on?'sp':'lk'}">${p.on?'習得':'Lv'+p.lv}</span><i class="ar"></i></div><div class="d">${P.d}</div><dl class="dl22"><dt>種類</dt><dd>キャラ専用パッシブ</dd><dt>習得</dt><dd>Lv${p.lv}</dd></dl></div>`;}).join('')}
  <div class="sk22 x22 ps${wp?'':' lock'}"><div class="h"><i class="hx20 sm" style="--c:#ffd65a">武</i><b>${wp?wp.n:'武器パッシブなし'}</b><span class="tg ${wp?'sp':'lk'}">武器</span><i class="ar"></i></div><div class="d">${wp?wp.d:'アンコモン以上の武器を装備すると、武器ごとの固有パッシブが付く'}</div><dl class="dl22"><dt>種類</dt><dd>武器パッシブ</dd><dt>装備</dt><dd>${w?esc(w.name):'なし'}</dd></dl></div>`;}
function seirinHTML(id){const h=G.h[id],A=AW[id],lv=h.awLv||1,nx=lv+1,req=nx===2?15:30,ok=lv<3&&h.lv>=req,cmds=A.cmds||[];
 return`<div class="aw22" style="--ec:${elCol(id)}"><div class="ah"><img src="${art(id,true)}" alt=""><div><small>${SEIRIN.n}・${esc(A.type)}</small><b>《${esc(A.name)}》</b><span class="rk">${'<i class="on"></i>'.repeat(lv)}${'<i></i>'.repeat(3-lv)}<em>位階${ROMAN[lv]}</em></span></div></div>
  <div class="ad">${esc(AWD[id]||'')}</div><div class="al">${SEIRIN.n}（${SEIRIN.kana}）…${SEIRIN.lore}</div>
  <dl class="dl22"><dt>種類</dt><dd>${esc(A.type)}</dd><dt>持続</dt><dd>${GAUGE.includes(id)?'ゲージが尽きるまで':(A.turns+(lv-1))+'回の行動'}</dd><dt>発動</dt><dd>${SEIRIN.g}100%で発動（行動を消費しない）</dd><dt>位階</dt><dd>${lv>=3?'最高位（極技を習得）':`次：位階${ROMAN[nx]}（Lv${req}以上で試練）`}</dd></dl>
  ${lv<3?`<button class="tbtn${ok?' gold':''} wide" data-a="tr" ${ok?'':'disabled'}>${SEIRIN.n}の試練へ<small>${ok?'挑戦できる':`Lv${req}で挑戦できる`}</small></button>`:''}</div>
  <div class="sh22">${SEIRIN.n}技 <small>${SEIRIN.n}中だけ使える</small></div>${cmds.map(k=>skCard(k,{tag:SEIRIN.n,tc:'aw'})).join('')}${SK['goku'+id]?skCard('goku'+id,{lock:lv<3,tag:lv>=3?'極技':'位階Ⅲ',tc:lv>=3?'aw':'lk'}):''}`;}
function resoPairs(P){const o=[];for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const k=[P[i],P[j]].sort().join(',');o.push({a:P[i],b:P[j],key:k,uniq:!!RESO[k],nm:RESO[k]||'星界共鳴',X:RFX[k]||{c:'#ff9ad6'}});}return o;}
function resoCard(p,dim){const X=p.X,el=X.el||OWNEL[[p.a,p.b].sort()[0]]||'光',fx=X.fx?RFXD[X.fx]:'敵全体に大ダメージ',mul=X.m||1;
 return`<div class="rs22 x22${p.uniq?' uq':''}${dim?' lock':''}" style="--rc:${X.c||'#ff9ad6'}"><div class="h"><span class="fc"><img src="${face(p.a)}" alt=""><b>×</b><img src="${face(p.b)}" alt=""></span><span class="n"><small>${HB[p.a].name} × ${HB[p.b].name}</small><b>${esc(p.nm)}</b></span>${p.uniq?'<span class="tg aw">固有</span>':'<span class="tg lk">汎用</span>'}<i class="ar"></i></div>
  <div class="d">${fx}</div><dl class="dl22"><dt>属性</dt><dd>${el}</dd><dt>対象</dt><dd>${X.fx==='single'?'最もHPの多い敵':'敵全体'}</dd><dt>威力</dt><dd>2人の攻撃・魔力の高い方の合計×3${mul!==1?' ×'+mul:''}</dd><dt>追加</dt><dd>${X.fx?RFXD[X.fx]:'なし'}</dd><dt>回復</dt><dd>味方全員のHP${X.fx==='revive'?'60%（倒れた仲間も復活）':'30%'}</dd><dt>条件</dt><dd>2人が同時に${SEIRIN.n}中（1戦闘に1回）</dd></dl></div>`;}
function resoHTML(){const ps=resoPairs(G.party),inP=new Set(ps.map(p=>p.key)),others=Object.keys(RESO).filter(k=>!inP.has(k)).map(k=>{const[a,b]=k.split(',');return HB[a]&&HB[b]?{a,b,key:k,uniq:1,nm:RESO[k],X:RFX[k]||{c:'#ff9ad6'}}:null;}).filter(Boolean);
 return`<div class="note22">${ic('link')}<span>2人が同時に<b>${SEIRIN.n}</b>すると、技の一覧に<b>共鳴技</b>が現れる。組み合わせごとに名前と追加効果が変わる。</span></div>
  <div class="sh22">今の編成 <small>${ps.length}組</small></div>${ps.map(p=>resoCard(p)).join('')||'<div class="emp22">2人以上で編成すると表示される</div>'}
  ${others.length?`<div class="sh22">ほかの固有共鳴 <small>編成すると使える</small></div>${others.map(p=>resoCard(p,1)).join('')}`:''}`;}
let PI={k:'sk',id:null};
function partyInfo(k,id){if(k)PI.k=k;if(id)PI.id=id;if(!PI.id||!G.members.includes(PI.id))PI.id=G.party[0];const cur=PI.id,ids=[...G.party,...G.members.filter(x=>!G.party.includes(x))];
 log(PI.k==='sk'?`<b>${HB[cur].name}の技</b>　タップで効果・威力・消費を表示`:PI.k==='rs'?'<b>共鳴技</b>　組み合わせごとの効果':`<b>${HB[cur].name}の${SEIRIN.n}</b>　位階と${SEIRIN.n}技を確認できる`);
 panel(`<div class="pi22"><div class="stabs pi22t">${[['sk','技','sword'],['rs','共鳴技','link'],['aw',SEIRIN.n,'star']].map(([kk,l,i])=>`<button class="${PI.k===kk?'on':''}" data-a="k" data-v="${kk}">${ic(i)}${l}</button>`).join('')}</div>
  ${PI.k!=='rs'?`<div class="pim">${ids.map(x=>`<button class="${x===cur?'on':''}${G.party.includes(x)?'':' bn'}" data-a="m" data-v="${x}" style="--ec:${elCol(x)}"><img src="${face(x)}" alt=""><small>${HB[x].name}</small></button>`).join('')}</div>`:''}
  <div class="pib">${PI.k==='sk'?skillsHTML(cur):PI.k==='rs'?resoHTML():seirinHTML(cur)}</div></div>
  <div class="tbar2"><button class="tbtn" data-a="det">${HB[cur].name}の詳細</button><button class="tbtn back" data-a="back">◀ 編成へ</button></div>`,
 {k:v=>partyInfo(v),m:v=>partyInfo(null,v),tr:()=>trialMenu(),det:()=>{CTAB=PI.k==='aw'?'aw':PI.k==='sk'?'sk':'st';equipMenu(PI.id);},back:()=>partyScreen()});}
/* 開閉（.x22 をタップ） */
document.addEventListener('click',e=>{const x=e.target.closest('.x22');if(!x||e.target.closest('[data-a]:not(.x22)'))return;x.classList.toggle('open');try{tone(x.classList.contains('open')?880:660,.03,'square',.02);}catch(er){}});

/* ---------- キャラ詳細：タブを「能力値・装備・技・星臨・星盤」に ---------- */
{const _ch=charHTML;charHTML=function(id,tab,ed){const mine=tab==='sk'||tab==='aw';let s=_ch(id,mine?'__':tab,ed);
 try{if(mine)s=s.replace('<div class="cbody"></div>',`<div class="cbody c22">${tab==='sk'?skillsHTML(id):seirinHTML(id)}</div>`);
  s=s.replace(/<div class="ctabs">[\s\S]*?<\/div>/,`<div class="ctabs c22">${[['st','能力値'],['eq','装備'],['sk','技'],['aw',SEIRIN.n],['bd','星盤']].map(([k,l])=>`<button class="${tab===k?'on':''}" data-a="tab" data-v="${k}">${l}</button>`).join('')}</div>`);}catch(e){console.error(e);}
 return s;};}
/* キャラ詳細から試練へ（tr アクションが無い画面のため） */
{const _em=equipMenu;equipMenu=function(id,m){_em(id,m);try{if(ACT&&!ACT.tr)ACT.tr=()=>trialMenu();}catch(e){}};}
{const _os=openSheet;openSheet=function(id,tab){_os(id,tab);try{if(SACT&&!SACT.tr)SACT.tr=()=>{ovClose();trialMenu();};}catch(e){}};}

/* ==================== 5. 開発者モード：全データ開放 ==================== */
let DEVDONE=false;
function devUnlockAll(){if(!DEV())return'';const n0={m:G.members.length,inv:G.inv.length};
 for(const id of Object.keys(HB))if(!G.members.includes(id))newMember(id);
 Object.assign(G.flags,{boss1:true,boss2:true,boss3:true,boss4:true,boss5:true,boss6:true,boss7:true,boss8:true,boss9:true,kr30:true,endSeen:1,zenkyo:1,mireMet:1,noahMet:1,ernaMet:1,balzaMet:1,hakuaMet:1,jinMet:1,celesMet:1,valkMet:1,uqRio:1});
 if(!G.flags.crowChoice)G.flags.crowChoice='save';G.declined=[];
 for(const id of G.members){const h=G.h[id];h.lv=Math.max(h.lv||1,55);h.awLv=3;h.hp=null;for(const j in JOBS)h.jobs[j]={lv:10,xp:0};if(BOARD[id])h.board=[...new Set([...(h.board||[]),...Object.keys(BOARD[id])])];}
 for(const k in G.fac)G.fac[k]=5;G.fac.garden=Math.max(1,G.fac.garden||0);
 G.tower=Object.assign(G.tower||{},{cp:26,max:30});if(typeof kst==='function'){const K=kst();K.cp=Math.max(K.cp||1,31);K.max=Math.max(K.max||0,50);}
 G.gold=Math.max(G.gold,9999999);G.tou=Math.max(G.tou||0,999999);
 for(const k in ITEMS)G.items[k]=Math.max(G.items[k]||0,99);for(const k in MATS)G.mats[k]=Math.max(G.mats[k]||0,999);for(const k in STONES)G.stones[k]=Math.max(G.stones[k]||0,99);
 /* 装備：レジェンド・専用ユニーク・王家セットを、持っていないものだけ追加 */
 const hasLeg=new Set(G.inv.filter(i=>i.leg).map(i=>i.leg));Object.keys(LEG).forEach(k=>{if(hasLeg.has(k))return;let it=null;try{it=LEG[k].uq&&typeof uqItem==='function'?uqItem(k.replace(/^uq_/,'')):devLeg(k);}catch(e){}if(it){it.unid=false;G.inv.push(it);try{zkItem(it);}catch(e){}}});
 const hasSet=new Set(G.inv.filter(i=>i.set==='royal').map(i=>i.slot));if(typeof ROYAL!=='undefined')for(const s in ROYAL)if(!hasSet.has(s)&&!hasSet.has(s==='acc'?'acc':s)){try{const it=royalItem(s,40);it.unid=false;G.inv.push(it);zkItem(it);}catch(e){}}
 G.inv.forEach(i=>{i.unid=false;});
 /* 図鑑・弱点・絆 */
 G.zk=G.zk||{e:{},i:{}};G.known=G.known||{};try{zkEnemies().forEach(k=>{G.zk.e[k]=G.zk.e[k]||1;});}catch(e){}for(const k in ED)if(!/^(tr_|vo_)/.test(k)&&ED[k].weak)G.known[k]=[...ED[k].weak];
 try{bondIds().forEach(id=>{const b=bondOf(id);b.p=Math.max(b.p,99);});}catch(e){}
 G.tut=G.tut||{};if(typeof TIPS!=='undefined')for(const k in TIPS)G.tut[k]=1;
 save();return`仲間 ${n0.m}→${G.members.length}人・装備 ${n0.inv}→${G.inv.length}個`;}
{const _et=enterTown;enterTown=function(m){if(DEV()&&!DEVDONE){DEVDONE=true;try{const r=devUnlockAll();m=(m?m+'<br>':'')+`<small>ver0.22：全データを開放した（${r}）</small>`;}catch(e){console.error(e);}}return _et(m);};}
{const _t=title;title=function(){DEVDONE=false;return _t();};}
function dev22(m){log((m||`<b>ver0.22</b>　画面の全面改良・${SEIRIN.n}・ミッション一括受け取り`)+`<br><small>開発者モードの戦闘：SP・ゲージ・使用条件を無視／${SEIRIN.n}・共鳴技は何度でも</small>`);
 menu([{l:'全データを再開放',s:'仲間・装備・道具・ステージ・図鑑・星盤',cls:'ready',f:()=>{const r=devUnlockAll();dev22('全データを開放した（'+r+'）');}},
  {l:'ボス戦（新しい戦闘画面）',s:'虚ろの番人　HPゲージ'+V21.barsOf({boss:true,mhp:ED.boss.mhp,kind:'boss'})+'本',f:()=>devBattle([{kind:'boss',lv:5}],'haido')},
  {l:'敵3体と戦う',s:'狙いの輪・WEAK表示',f:()=>devBattle([{kind:'snowwolf',lv:30},{kind:'yukirei',lv:30},{kind:'onimusha',lv:30}],'kouka',{boss:false})},
  {l:'黒炎竜ヴォルガノン',s:'大型ボス',f:()=>devBattle([{kind:'boss9',lv:68}],'ryuu',{theme:'lava'})},
  {l:'ミッションを未受取に戻す',s:'一括受け取りの確認用',f:()=>{G.q.done={};save();dev22('ミッションを未受取に戻した（ホームの「依頼ミッション」から一括受け取りを確認）');}},
  {l:'ミッション画面を開く',f:()=>missionScreen('home')},{l:'編成：技・共鳴技・星臨',f:()=>partyInfo('sk',G.party[0])},
  {l:'戻る',cls:'back',f:()=>dvMenu()}],true);}
{const _dv=dvMenu;dvMenu=function(m){_dv(m);try{addCmd('ver0.22 画面刷新・'+SEIRIN.n,'全データ開放・戦闘無制限・ミッション一括',dev22,0,'ready');}catch(e){}};}

/* ==================== 7. 「星臨」に合わせた説明 ==================== */
try{TIPS.battle=['戦闘のしかた',['自分の番が来たら、下の一覧から<b>技をタップ→もう一度タップ</b>で決定。<b>ⓘ</b>で技の詳しい性能を見られる。','<b>敵をタップ</b>すると狙いが変わる。左上に狙った敵の<b>HP</b>と<b>弱点</b>（▲）が出る。','弱点を突くと <b>1.7倍</b> の大ダメージ。敵が「溜め」たら次の大技に<b>防御</b>で備えよう。','左下が<b>行動順</b>。面倒なら下の<b>通常AUTO</b>、同じ行動を繰り返すなら<b>リピート</b>。']];
 TIPS.awake=[SEIRIN.n+'できる！',[`<b>${SEIRIN.g}（${SEIRIN.ge}／AG）</b>が100%になった。右下の<b>${SEIRIN.n}</b>ボタンで発動――星片に宿る星座をその身に降ろす。<b>行動を消費しない</b>ので、そのまま強力な${SEIRIN.n}技を撃てる。`,`2人が同時に${SEIRIN.n}すると、<b>共鳴技</b>が使えるようになる。`]];}catch(e){}

/* ==================== 版表示 ==================== */
{const _t=title;title=function(){_t();const v=$('#verL');if(v)v.textContent=VER22;};const v=$('#verL');if(v)v.textContent=VER22;}
try{document.title='アストラル・ブレイカー '+VER22;}catch(e){}
return{updHud,panel22,missionScreen,claimQuests,partyInfo,devUnlockAll,homeLayout,HM,BL,skInfo,dev22};})();
