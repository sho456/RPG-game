/* ===== ver0.22 画面の全面改良・「星臨」・ミッション一括受け取り・開発者モード拡張 =====
 1. 戦闘画面：戦場を画面幅いっぱい・縦に広く。左上に対象の名前／HPゲージ／弱点、右上にメニュー。
    下部は「キャラ帯（名前・星臨ゲージ・立ち絵）→ HP/SP/状態 → 技リスト → AUTO・リピート」の順に整理
 2. ホーム画面：街を画面全体に広げ、文字情報を減らす。依頼はミッション画面へ、編成は下部ナビへ統合
 3. 編成画面：カードを縦長に。技・星臨はタップで専用画面を開き、効果・性能・説明を確認できる
 4. デザインの統一：夜空の紺 × 金の縁取り × 星の青緑。ボタン・窓・アイコンを共通の規則で描く
 5. 開発者モード：全データ開放。戦闘中はSP・ゲージ・条件を無視して技を使え、星臨も無制限
 6. ミッション：受け取り可能な報酬だけを一括で受け取る
 7. 「覚醒」→「星臨（せいりん）」：星片に宿る星座を、その身に降ろす力。ゲージは「星臨ゲージ（ASTRAL GAUGE）」
 既存の処理は包む（ラップする）か、同じ動作を保ったまま置き換える。セーブデータの形は変えない */

const VER22='ver0.22';
const SEIRIN={n:'星臨',kana:'せいりん',en:'ASTRAL ADVENT',g:'星臨ゲージ',ge:'ASTRAL GAUGE',
 lore:'星片に宿る星座を、その身に降ろす力。ゲージが満ちると発動でき、行動を消費しない。位階（Ⅰ〜Ⅲ）が上がるほど長く、強くなる。'};
const V22=(()=>{
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

const DEV=()=>{try{return!!(G&&G.dev);}catch(e){return false;}};
const app=$('#app');app.classList.add('v22');
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);

/* ==================== 共通：アイコン（16×16 の塗りSVG） ==================== */
const IP={up:'M8 1.2 14.2 7.6H10.4V14.8H5.6V7.6H1.8Z',
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

addEventListener('resize',()=>{if(isHome())requestAnimationFrame(()=>{try{homeLayout();}catch(e){}});});
{const _sh=show;show=function(m){_sh(m);app.classList.add('v22');if(m!=='battle'){const h=$('#bt22');if(h)h.style.display='none';}else{const h=$('#bt22');if(h)h.style.display='';}
 if(m!=='town'){HM.on=false;app.classList.remove('home22');}};}
/* 行動数（ACTIONS）を数える */

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

let HK='';
function updHud(){if(!B||scene!=='battle')return;const h=ensureHud();h.classList.toggle('dev',DEV());
 h.querySelector('.tn').textContent=B.turns;h.querySelector('.ac').textContent=BL.act;const sp=h.querySelector('.rb.sp b');if(sp)sp.textContent='×'+speed;
 /* 対象 */
 const t=B.tgt&&B.tgt.alive?B.tgt:aliveE()[0],tg=h.querySelector('.b22tg');
 if(!t){tg.innerHTML='';HK='';}else{const kw=t.weak.filter(x=>t.known.has(x)),kr=[...(t.kR||[])],tmp=(t.sts||[]).filter(s=>s.k==='weak').map(s=>s.el),unk=t.weak.length-t.known.size,multi=aliveE().length>1;let tags='';try{tags=tagH(t);}catch(x){}
  const k=[t.name,t.lv,t.boss,kw.join(''),kr.join(''),tmp.join(''),unk,tags,multi].join('|');
  if(k!==HK||!tg.firstChild){HK=k;tg.className='b22tg'+(t.boss?' boss':'');
   tg.innerHTML=`<div class="nm">${t.boss?'<em class="bs">BOSS</em>':multi?'<em>TARGET</em>':''}<b>${t.name}</b><small>Lv${t.lv}</small></div>
    <div class="hp"><div class="bar"><s></s><u></u><i></i></div><em class="cnt"></em></div>
    <div class="wk">${ELS10.map(e=>{const w=kw.includes(e),tm=tmp.includes(e),r=!w&&!tm&&kr.includes(e);/* 弱点＝赤く光る・耐性＝青く光る（見つけたものだけ）。六角の質感・文字の色は属性耐性の印（.elh）と共通（ver0.45） */return`<span class="${w?'w':''}${tm?' tm':''}${r?' r':''}"><i class="hx43${w||tm?' wk':r?' rs':''}" style="--c:${ELN43[e]}">${e}</i></span>`;}).join('')}${unk>0?`<span class="q"><i>?</i><u>×${unk}</u></span>`:''}</div>
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

/* 味方：足元の右に HP（大きな数字）・SP・星臨ゲージ */

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
/* ⓘ：行の選択より先に拾う */
$('#cmd').addEventListener('click',e=>{const t=e.target.closest('[data-inf]');if(!t||!B||!B.pick||!B.pick.info)return;e.stopPropagation();e.preventDefault();B.pick.info(+t.dataset.inf);},true);
/* 下のボタン：速度・通常AUTO・全力AUTO・リピート */

/* 星臨の演出：大きな「星臨」の文字と星座の輪 */

/* ---------- 開発者モード：戦闘中はSP・ゲージ・星臨が無制限 ---------- */
/* SP・星臨ゲージを満タンに保つ。星臨の持続（行動回数）は通常どおり減る＝連続行動が止まらなくなることはない。
   解けたらすぐ再発動でき、同時星臨の人数制限もない */

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
 if(G&&G.party){const W2=HM.walk,ymax=Math.min(HOME_H+eh-6,H-off-Math.round(150/SC)),ymin=124;while(W2.length<G.party.length)W2.push({x:[34,146,66,114][W2.length%4],y:[150,154,166,170][W2.length%4],tx:0,ty:0,w:20+W2.length*30,d:-1,mv:0});/* ver0.32：最初から重ならないよう広場に散らす */W2.length=G.party.length;
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
  <nav class="h22nav">${[['home','home','ホーム',0],['party','party','編成',b.pts],['star','star','星詠み',b.pts],['smith','smith','鍛冶屋',0],['tavern','up','強化',(()=>{try{return GROW.readyN()?true:b.bn;}catch(e){return b.bn;}})()],['shop','shop','道具屋',0]].map(([g,k,l,n])=>`<button data-h22="${g}" class="${g==='home'?'on':''}">${ic(k)}<b>${l}</b>${isBadge(n)}</button>`).join('')}</nav></div>`;
 HM.news=vn;const c=$('#cmd');c.className='home22';c.innerHTML='';
 if(m&&m!==DEFMSG)toast(m+(vn&&/虚蝕/.test(vn)?'':''));else if(warn)toast(warn.replace(/^<br>/,''));
 tip('town');};
const HGO={menu:()=>saveMenu(),news:()=>newsSheet(),inv:()=>invMenu(),zk:()=>zkMenu(),home:()=>townMenu(),smith:()=>smith(),tavern:()=>tavern(),appraise:()=>appraise()};
document.addEventListener('click',e=>{const t=e.target.closest('[data-h22]');if(!t||scene!=='town'||t.disabled)return;const f=HGO[t.dataset.h22];if(!f)return;SFX.sel();HM.on=false;app.classList.remove('home22');f();});
function newsSheet(){const vn=HM.news||'';ovOpen(`<div class="nw22"><div class="nh">${ic('bell')}<b>お知らせ</b></div>${vn||'<div class="nn">新しいお知らせはありません</div>'}
 <div class="nt"><b>ver0.22</b>　戦闘・ホーム・編成の画面を一新。「覚醒」は<b>${SEIRIN.n}（${SEIRIN.kana}）</b>に改めました。<br><small>${SEIRIN.lore}</small></div></div><button class="tbtn back wide" data-a="close">閉じる</button>`,{close:ovClose});}
/* ホーム以外の画面へ移るときは全画面の街をやめる */
{const _pn=panel;panel=function(html,acts){if(scene==='town'&&HM.on){HM.on=false;app.classList.remove('home22');}_pn(html,acts);};}
{const _mn=menu;menu=function(items,list,xc){if(scene==='town'&&HM.on){HM.on=false;app.classList.remove('home22');}_mn(items,list,xc);};}
{const _ro=roomOpen;roomOpen=function(...a){HM.on=false;app.classList.remove('home22');return _ro(...a);};}

/* ==================== 6. ミッション（一括受け取り） ==================== */

/* ==================== 3. 編成画面 ==================== */

/* ---------- 技・星臨の専用画面 ---------- */

/* 開閉（.x22 をタップ） */
document.addEventListener('click',e=>{const x=e.target.closest('.x22');if(!x||e.target.closest('[data-a]:not(.x22)'))return;x.classList.toggle('open');try{tone(x.classList.contains('open')?880:660,.03,'square',.02);}catch(er){}});

/* ---------- キャラ詳細：タブを「能力値・装備・技・星臨・星盤」に ---------- */

/* キャラ詳細から試練へ（tr アクションが無い画面のため） */

/* ==================== 5. 開発者モード：全データ開放 ==================== */
let DEVDONE=false;

{const _et=enterTown;enterTown=function(m){if(DEV()&&!DEVDONE){DEVDONE=true;try{const r=devUnlockAll();m=(m?m+'<br>':'')+`<small>ver0.22：全データを開放した（${r}）</small>`;}catch(e){console.error(e);}}return _et(m);};}
{const _t=title;title=function(){DEVDONE=false;return _t();};}

/* ==================== 7. 「星臨」に合わせた説明 ==================== */
try{TIPS.battle=['戦闘のしかた',['自分の番が来たら、下の一覧から<b>技をタップ→もう一度タップ</b>で決定。<b>ⓘ</b>で技の詳しい性能を見られる。','<b>敵をタップ</b>すると狙いが変わる。左上に狙った敵の<b>HP</b>と<b>弱点</b>（▲）が出る。','弱点を突くと <b>1.7倍</b> の大ダメージ。敵が「溜め」たら次の大技に<b>防御</b>で備えよう。','左下が<b>行動順</b>。面倒なら下の<b>通常AUTO</b>、同じ行動を繰り返すなら<b>リピート</b>。']];
 TIPS.awake=[SEIRIN.n+'できる！',[`<b>${SEIRIN.g}（${SEIRIN.ge}／AG）</b>が100%になった。右下の<b>${SEIRIN.n}</b>ボタンで発動――星片に宿る星座をその身に降ろす。<b>行動を消費しない</b>ので、そのまま強力な${SEIRIN.n}技を撃てる。`,`2人が同時に${SEIRIN.n}すると`]];}catch(e){}

/* ==================== 版表示 ==================== */

try{document.title='アストラル・ブレイカー '+VER22;}catch(e){}
return{skInfo};})();
