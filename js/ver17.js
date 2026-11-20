/* ===== ver0.17 快適さ＋UI再構築 =====
 1. 画面の作り替え：編成／キャラ詳細（装備）／星盤／マップ選択／戦闘
 2. 快適さ：チュートリアル・セーブ3スロット・拾う前フィルター拡張・オートの星臨設定・テキスト速度 */

const ELS10=['斬','打','突','熱','冷','雷','陽','陰'];

const elCol=id=>ELC[elOf(id)]||'#c8b0ff';
const clsOf=id=>(PROF[id]?PROF[id][1].split('／')[0]:'');
const fmt=n=>Math.round(n).toLocaleString('en-US');

/* 立ち絵（48×48ドットを拡大表示） */

function art(){}/* 未使用：js/ver18-art.js が置き換え */
/* 戦闘力：能力・星臨位階・技の数から算出する目安 */
function power(id){const s=stats(id),h=G.h[id];return Math.round(s.mhp*.6+Math.max(s.atk,s.mag)*7+Math.min(s.atk,s.mag)*1.5+(s.def+s.res)*3.5+s.spd*18+s.crit*6+s.weakDmg*3+s.awDmg*3+s.startAG*2+(h.awLv||1)*120+skillList(id).length*25);}
/* 星盤を星座として描く（解放した星が光り、線でつながる） */

/* ---------- 設定の初期値 ---------- */
const AWN={save:'温存',boss:'ボス戦のみ',any:'いつでも'};
const TXS=[['おそい',46],['ふつう',28],['はやい',12],['一瞬',0]];
const FLN=['しない','コモン','アンコモン以下','レア以下'];
{const _mg=migrate;migrate=function(g){const r=_mg(g),s=G.set;
 if(!s.flt)s.flt={rar:s.autoSell?0:-1,mode:'sell',keepUp:true};s.autoSell=false;
 if(!s.autoAw||s.autoAw==='brk')s.autoAw=s.autoAw==='brk'?'boss':'save';if(s.txt==null)s.txt=1;if(s.tut==null)s.tut=true;if(s.tap1==null)s.tap1=false;G.tut=G.tut||{};return r;};}

/* ---------- 画面切替の共通処理 ---------- */
let WMS={on:false,tab:0,sel:null,cur:null,bgs:{}};
{const _sh=show;show=function(m){_sh(m);WMS.on=false;$('#app').dataset.sc=m;const b=$('#bbar');if(b)b.style.display=m==='battle'?'grid':'none';$('#cmd').classList.remove('bcmd');};}
{const b=document.createElement('div');b.id='bbar';b.style.display='none';$('#app').insertBefore(b,$('#ov'));
 b.addEventListener('click',e=>{const t=e.target.closest('[data-b]');if(!t||t.disabled||!B||B.over)return;const k=t.dataset.b;SFX.sel();
  if(k==='rep'){if(B.pick)B.pick.rep();return;}
  if(k==='back'){if(B.pick&&B.pick.back)B.pick.back();return;}
  if(auto&&AM===k)auto=false;else{auto=true;AM=k;}bbar(true);if(auto&&B.res)B.res();else refresh();});
 const c=document.createElement('button');c.className='tb';c.id='cfgB';c.textContent='≡';c.onclick=()=>{SFX.sel();cfgOpen();};$('#top').appendChild(c);}

/* ==================== 戦闘画面 ==================== */
/* 味方は右側に縦一列。HP・星臨ゲージは各キャラの横に、行動中のキャラは下の大きなパネルに表示 */

let AM='n';const LASTA={};
const awPolicy=()=>{const p=G.set.autoAw||'save';return p==='any'||(p==='boss'&&!!(B.opts.boss||B.opts.trial));};
/* 通常AUTOは設定どおりに星臨を温存、全力AUTOは星臨もすぐ使う */

function repOK(){}/* 未使用：js/rs/battle.js が置き換え */
function bbar(){}/* 未使用：js/v22.js が置き換え */
const skBadge=s=>{const heal=['heal','healAll','revive','reviveAll','item'].includes(s.k);const el=s.el||(heal?'癒':['phys','mag','rhythm'].includes(s.k)?'無':'補');return[el,ELC[el]||(heal?'#7dffa8':el==='無'?'#d8d8e8':'#9fb4ff')];};
$('#cmd').addEventListener('click',e=>{const c=$('#cmd');if(!c.classList.contains('bcmd')||!B||!B.pick)return;const tb=e.target.closest('[data-t]'),rw=e.target.closest('[data-i]');if(tb)B.pick.tab(tb.dataset.t);else if(rw&&!rw.disabled)B.pick.row(+rw.dataset.i);});
$('#party').addEventListener('click',e=>{if(e.target.closest('#awB')&&B&&B.pick){au();B.pick.aw();}});
/* 敵をタップして狙いを変える */
cv.addEventListener('pointerdown',ev=>{if(scene!=='battle'||!B||B.over)return;const r=cv.getBoundingClientRect(),x=(ev.clientX-r.left)/SC,y=(ev.clientY-r.top)/SC;let best=null,bd=1e9;
 aliveE().forEach(e=>{let cx,cy,rr;try{const[fx,fy]=V19.foot(e),D=V19.dims(e),A=e.A||{};cx=fx+(A.wx||0);cy=fy-D.h/2;rr=Math.max(14,Math.max(D.w,D.h)*.62);}catch(x){const s=16*e.sc;cx=e.x+s/2;cy=e.y+s/2;rr=s*.75;}
  /* ver0.24：当たり判定を実際の絵の大きさで（縮小・拡大した敵もタップで狙える） */const d=Math.hypot(cx-x,cy-y);if(d<rr&&d<bd){bd=d;best=e;}});
 if(best&&best!==B.tgt){B.tgt=best;SFX.sel();refresh();if(B.pick)B.pick.retarget();}});
{const _du=drawUnit;drawUnit=function(u){_du(u);if(B&&B.tgt===u&&u.alive&&u.side===1&&aliveE().length>1){const s=16*u.sc,x=u.x+Math.round(u.ox)-2,y=u.y-2,w=s+4,p=(tick>>4)%2,L=5;ctx.fillStyle='#ffd65a';
  for(const[cx,cy,dx,dy]of[[x-p,y-p,1,1],[x+w+p,y-p,-1,1],[x-p,y+w+p,1,-1],[x+w+p,y+w+p,-1,-1]]){ctx.fillRect(dx>0?cx:cx-L,cy-(dy>0?0:1),L,1);ctx.fillRect(cx-(dx>0?0:1),dy>0?cy:cy-L,1,L);}}};}
refresh=function(){if(!B||scene!=='battle')return;if(!B.tgt||!B.tgt.alive||!B.enemies.includes(B.tgt))B.tgt=aliveE()[0]||null;const L=$('#labels');
 /* ver0.24：敵・味方の足元ラベル、#party の行動中パネル、行動順は後の版で別の表示に置き換わり、すべて非表示になっていたため生成しない
  （毎回の再描画で隠れたDOMを3層ぶん作り直していた）。行動中キャラの記録だけ残す */
 [...L.children].forEach(el=>{if(el._e||el._h||el.classList.contains('tgp'))el.remove();});
 B.lastH=B.cur&&B.cur.side===0?B.cur:(B.lastH&&B.heroes.includes(B.lastH)?B.lastH:B.heroes[0]);
 /* 入力待ち以外のときのコマンド欄 */
 const c=$('#cmd');if(!B.pick&&!B.over&&(c.classList.contains('bcmd')||!c.children.length||c.querySelector('.wait'))){const k=auto?'a'+AM:'w';if(c.dataset.w!==k||!c.querySelector('.bwait')){c.className='bcmd';c.dataset.w=k;c.innerHTML=`<div class="bwait${auto?' au':''}">${auto?`<b>${AM==='f'?'全力AUTO':'通常AUTO'}</b> で戦闘中…<small>下のボタンをもう一度押すと手動に戻る</small>`:'…'}</div>`;}}
 bbar();};

/* ==================== 編成画面 ==================== */
let PSEL=null,CTAB='st',BFROM='town';
function partyScreen(){}
/* 未使用：js/v22.js が置き換え */

/* ==================== キャラ詳細（装備・能力・技・星盤） ==================== */

/* 探索中のステータス（同じ画面を読み取り専用で開く） */
let SACT={},SHP=null;
function ovOpen(html,acts){const sh=$('#sheet');if(sh.style.display!=='flex'&&scene==='field'&&F){SHP=F.pause;F.pause=true;}SACT=acts||{};sh.innerHTML=`<div class="swin v17">${html}</div>`;sh.style.display='flex';}
function ovClose(){$('#sheet').style.display='none';if(scene==='field'&&F&&SHP!==null){F.pause=SHP;}SHP=null;}
$('#sheet').addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t||t.disabled)return;const f=SACT[t.dataset.a];if(f){SFX.sel();f(t.dataset.v);}});

/* ==================== 星盤 ==================== */
drawBoard=function(){const c=bctx,cw=W*SC,ch=BCH(),id=BS.id,N=BOARD[id],U=G.h[id].board,col=elCol(id),cx=cw/2,cy=bpos({q:0,r:0})[1];
 const bg=c.createRadialGradient(cx,cy,20,cx,cy,ch*.75);bg.addColorStop(0,'#1c2150');bg.addColorStop(1,'#05060f');c.fillStyle=bg;c.fillRect(0,0,cw,ch);
 BGS.forEach(([x,y,b],i)=>{c.fillStyle=`rgba(200,210,255,${.2+.5*b*(.6+.4*Math.sin(tick/30+i))})`;c.fillRect(x*cw,y*ch,1.5,1.5);});
 /* 星片の軌道（ゆっくり回る） */
 c.save();c.translate(cx,cy);for(const[r,sp,n]of[[cw*.47,1,24],[cw*.36,-1.6,14]]){c.strokeStyle='rgba(140,160,255,.13)';c.lineWidth=1;c.beginPath();c.arc(0,0,r,0,7);c.stroke();
  for(let i=0;i<n;i++){const a=tick/900*sp+i/n*6.283;c.fillStyle=i%6?'rgba(170,185,255,.3)':col;c.fillRect(Math.cos(a)*r-1,Math.sin(a)*r-1,i%6?1.5:3,i%6?1.5:3);}}c.restore();
 c.lineCap='round';
 for(const k in N){const n=N[k],[ax,ay]=bpos(n);for(const[dq,dr]of HEXD){const k2=(n.q+dq)+','+(n.r+dr);if(!N[k2]||k2<k)continue;const[bx,by]=bpos(N[k2]),on=U.includes(k)&&U.includes(k2);
  if(on){c.strokeStyle='rgba(255,214,110,.95)';c.lineWidth=3;c.shadowColor='#ffcf5a';c.shadowBlur=10;}else{c.strokeStyle='rgba(120,135,210,.2)';c.lineWidth=1.5;c.shadowBlur=0;}
  c.beginPath();c.moveTo(ax,ay);c.lineTo(bx,by);c.stroke();}}
 c.shadowBlur=0;c.textAlign='center';c.textBaseline='middle';
 for(const k in N){const n=N[k],[x,y,s]=bpos(n),on=U.includes(k),av=!on&&canUnlock(id,k),nc=NCOL[n.t],r=s*.64;hexPath(c,x,y,r);
  if(on){const g=c.createLinearGradient(x,y-r,x,y+r);g.addColorStop(0,nc);g.addColorStop(1,shade(nc));c.fillStyle=g;c.shadowColor=nc;c.shadowBlur=14;c.fill();c.shadowBlur=0;c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=1.5;c.stroke();}
  else if(av){c.fillStyle='#141a3a';c.fill();c.strokeStyle=nc;c.globalAlpha=.55+.45*Math.sin(tick/9);c.lineWidth=2.5;c.stroke();c.globalAlpha=1;}
  else{c.fillStyle='#0b0e22';c.fill();c.strokeStyle='#283060';c.lineWidth=1.5;c.stroke();}
  if(BS.sel===k){hexPath(c,x,y,r+5);c.strokeStyle='#fff';c.lineWidth=2;c.stroke();hexPath(c,x,y,r+9+2*Math.sin(tick/8));c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=1;c.stroke();}
  const lab=n.t==='core'?'★':n.t==='skill'?'技':n.t==='aw'?'醒':n.t==='fork'?'分':SHORT[Object.keys(n.v)[0]];
  c.fillStyle=on?'#10142e':av?nc:'#4a5288';c.font=`bold ${Math.round(s*.42)}px "M PLUS 1p","Hiragino Sans",sans-serif`;c.fillText(lab,x,y+1);}
 c.textAlign='left';c.textBaseline='alphabetic';};
const NTN={core:'星片',stat:'能力',skill:'技',aw:'星臨強化',fork:'分岐'};

/* ==================== マップ選択 ==================== */
const WAREAS=[{id:'haido',ch:'序章',need:()=>true},{id:'midori',ch:'第1章',need:()=>G.flags.boss1,un:'灰の街道のボスを倒すと解放'},{id:'seido',ch:'第2章',need:()=>G.flags.boss2,un:'図書遺跡のボスを倒すと解放'},
 {id:'raimei',ch:'第3章',need:()=>G.flags.boss3,un:'廃聖堂のボスを倒すと解放'},{id:'kouka',ch:'第4章',need:()=>G.flags.boss4,un:'第3章のボスを倒すと解放'},{id:'ouito',ch:'第5章',need:()=>G.flags.boss5,un:'第4章のボスを倒すと解放'},
 {id:'tower',ch:'第6章',nm:'天への塔',bf:'boss7',bk:()=>'boss7',need:()=>G.flags.boss6,un:'第5章のボスを倒すと解放',rec:()=>`最高到達 ${(G.tower&&G.tower.max)||0}階`,intro:'<b>第6章　天への塔</b>――星空へ続く白亜の塔。30階層。5階ごとの中継地点から挑める。'},
 {id:'zankyo',ch:'終章',need:()=>G.flags.boss7,un:'天への塔の頂上を制すると解放'},
 {id:'kairou',ch:'深層',t:1,nm:'虚の回廊',bf:'kr30',bk:()=>kBoss(10),need:()=>G.flags.boss8,un:'？？？',rec:()=>`最深到達 ${kst().max||0}層`,intro:'<b>虚の回廊</b>――果てのない回廊。10層ごとに番人がいて、倒した先の層が中継地点になる。'},
 {id:'ryuu',ch:'深層',t:1,need:()=>G.flags.boss8,un:'？？？'}];

const SILC=new WeakMap();function silOf(src){let c=SILC.get(src);if(c)return c;c=document.createElement('canvas');c.width=src.width;c.height=src.height;const g=c.getContext('2d');g.drawImage(src,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#05060f';g.fillRect(0,0,c.width,c.height);SILC.set(src,c);return c;}

/* プレビュー：選んだエリアの戦場にボスとパーティを並べる */
/* 未使用：js/ver18-town.js が置き換え */
{const _d=draw;draw=function(){if(WMS.on&&scene==='town'){tick++;const k=bK();if(cv.width!==W*k||cv.height!==H*k){cv.width=W*k;cv.height=H*k;}ctx.setTransform(k,0,0,k,0,0);ctx.imageSmoothingEnabled=false;drawWM();requestAnimationFrame(draw);return;}_d();};}

/* ==================== 街メニューへの組み込み ==================== */

{const _inv=invMenu;invMenu=function(m){_inv(m);const b=$('#cmd').querySelector('[data-a="auto"]'),f=G.set.flt;if(b){b.className='tbtn'+(f.rar>=0?' gold':'');b.innerHTML=`拾う前フィルター<small>${f.rar>=0?FLN[f.rar+1]+'を'+(f.mode==='dism'?'分解':'売却'):'OFF'}</small>`;}ACT.auto=()=>cfgOpen(()=>invMenu());ACT.back=()=>partyScreen();};}

/* ==================== 拾う前フィルター拡張 ==================== */
/* 等級（コモン／アンコモン以下／レア以下）・処理（売却／分解）・「今より強い装備は残す」を選べる。未鑑定・レジェンド・セット装備は必ず残す */
function isUpgrade(it){const sls=it.slot==='acc'?['acc1','acc2']:[it.slot];return G.members.some(id=>sls.some(sl=>{if(!canEq(it,id,sl))return false;const cur=G.h[id].eq[sl]&&findItem(G.h[id].eq[sl]);return!cur||score(it,id)>score(cur,id);}));}
{const _al=addLoot;addLoot=function(it){const f=G.set.flt;
 if(f&&f.rar>=0&&it.rar<=f.rar&&!it.unid&&!it.leg&&!it.set&&!(f.keepUp&&isUpgrade(it))){if(typeof zkItem==='function')zkItem(it);
  if(f.mode==='dism'){const dm=DISM[it.rar];for(const k in dm)G.mats[k]=(G.mats[k]||0)+dm[k];return`<span style="color:#888">${it.name}（自動分解）</span>`;}
  G.gold+=price(it);return`<span style="color:#888">${it.name}（自動売却）</span>`;}
 return _al(it);};}

/* ==================== 設定 ==================== */
function cfgOpen(back){const s=G&&G.set,seg=(k,opts,cur)=>`<div class="seg">${opts.map(([v,l])=>`<button class="${String(cur)===String(v)?'on':''}" data-a="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
 if(!s)return;const re=()=>{save();cfgOpen(back);if(scene==='battle')bbar(true);};
 ovOpen(`<div class="cfh"><b>✦ 設定</b><button class="sx" data-a="close">✕</button></div><div class="cfb">
 <div class="cfr"><label>テキスト速度<small>会話の文字送り</small></label>${seg('txt',TXS.map((t,i)=>[i,t[0]]),s.txt)}</div>
${typeof CFGX!=='undefined'?CFGX.html(seg):''}
 <div class="cfr"><label>通常AUTOの星臨<small>全力AUTOは常にすぐ使う</small></label>${seg('aw',Object.entries(AWN),s.autoAw)}</div>
 <div class="cfr"><label>拾う前フィルター<small>拾った装備を自動で処理する等級</small></label>${seg('fr',FLN.map((n,i)=>[i-1,n]),s.flt.rar)}</div>
 <div class="cfr"><label>フィルターの処理<small>未鑑定・レジェンド・セットは必ず残す</small></label>${seg('fm',[['sell','売却（G）'],['dism','分解（素材）']],s.flt.mode)}</div>
 <div class="cfr"><label>今より強い装備は残す<small>誰かの装備より強ければ処理しない</small></label>${seg('fk',[[1,'ON'],[0,'OFF']],s.flt.keepUp?1:0)}</div>
 <div class="cfr"><label>BGM</label>${seg('bgm',[[1,'ON'],[0,'OFF']],BGM.on?1:0)}</div>
 <div class="cfr"><label>チュートリアル<small>初めての画面で説明を出す</small></label>${seg('tut',[[1,'ON'],[0,'OFF']],s.tut?1:0)}</div>
 <div class="cfr"><label>説明をもう一度<small>次に開いた画面から再表示</small></label><div class="seg"><button data-a="trs">リセット</button><button data-a="how">遊び方</button></div></div></div>
 <button class="tbtn back wide" data-a="close">閉じる</button>`,
 Object.assign(typeof CFGX!=='undefined'?CFGX.acts(re):{},{txt:v=>{s.txt=+v;re();},spd:v=>{setSpeed(+v);re();},tap:v=>{s.tap1=!!+v;re();},aw:v=>{s.autoAw=v;re();},fr:v=>{s.flt.rar=+v;re();},fm:v=>{s.flt.mode=v;re();},fk:v=>{s.flt.keepUp=!!+v;re();},
  bgm:v=>{if(BGM.on!==!!+v)bgmToggle();re();},tut:v=>{s.tut=!!+v;re();},trs:()=>{G.tut={};s.tut=true;save();cfgOpen(back);tipShow('how');},how:()=>tipShow('how'),close:()=>{ovClose();if(typeof back==='function')back();}}));}

/* ==================== テキスト速度 ==================== */

/* ==================== チュートリアル ==================== */
const TIPS={
 town:['灯都ルミナス',['ここが拠点の<b>灯都</b>。帰ってくるたびにHPが全回復し、自動でセーブされる。','<b>出撃</b>：行き先を選んで冒険へ。<br><b>編成</b>：仲間の入れ替え・装備・星盤はここから。','ほかの施設は、冒険で手に入れた物を使うときに。<b>記録・設定</b>で文字の速さやオートの動きを変えられる。']],
 map:['行き先を選ぶ',['行きたいエリアをタップすると、上に<b>その場所のボスと推奨Lv</b>が出る。','よければ<b>▼出撃▼</b>を押して出発。<b>CLEAR</b>の付いたエリアは何度でも挑める。']],
 field:['探索のしかた',['<b>行きたい場所をタップ</b>すると歩く。宝箱や光る採取ポイントを探そう。','魔物に<b>自分からぶつかると先制攻撃</b>。背後を取られると不利になる。','危なくなったら<b>帰還の灯</b>で灯都へ。下の顔をタップすると仲間の状態を確認できる。']],
 battle:['戦闘のしかた',['上の並びが<b>行動順</b>。自分の番が来たら、下の一覧から<b>技をタップ→もう一度タップ</b>で決定。','<b>敵をタップ</b>すると狙いが変わる。左上に、狙った敵の<b>弱点</b>が出る（?はまだ不明）。','弱点を突くと <b>1.7倍</b> の大ダメージ。敵が「溜め」たら次の大技に<b>防御</b>で備えよう。','面倒なら下の<b>通常AUTO</b>。同じ行動を繰り返すなら<b>リピート</b>。']],
 awake:['星臨できる！',['金色の<b>ASTRAL GAUGE</b>が100%になった。<b>星臨</b>ボタンで発動――<b>行動を消費しない</b>ので、そのまま強力な星臨技を撃てる。','2人が同時に星臨すると']],
 awake2:['星臨中',['技の一覧が<b>星臨技</b>に変わった。星臨はキャラごとに性質が違う（ターン制・ゲージ消費など）。','効果が切れると反動で少し行動が遅れる。']],
 party:['編成',['カードを<b>タップで選び</b>、入れ替えたい相手をタップ。<b>同じカードをもう一度</b>タップで詳細・装備へ。','カードの背景は、その仲間の<b>星盤</b>。解放した星が光ってつながる。✦ボタンから星盤へ。']],
 board:['星盤',['Lvが上がるともらえる<b>星ポイント</b>で星を解放する。<b>光る輪の星</b>が今解放できる星。','迷ったら<b>おまかせ</b>。<b>リセット</b>は無料なので、気軽に試せる。']],
 how:['遊び方',['<b>灯都</b>で準備 → <b>出撃</b>で各地へ → ボスを倒すと次の章へ。街に戻るとHP全回復＆自動セーブ。','戦闘：弱点を突いて大ダメージ、ゲージ100%で<b>星臨</b>（行動を消費しない）','育成：<b>編成</b>から装備と<b>星盤</b>。<b>星詠みの塔</b>でジョブと星臨の試練。','<b>記録・設定</b>：セーブは3スロット。オートの星臨・拾う前フィルター・テキスト速度を変えられる。']]};
function tip(key){if(!G||G.dev||!G.set||G.set.tut===false||!G.tut||G.tut[key]||!TIPS[key]||$('#tip'))return false;G.tut[key]=1;tipShow(key);return true;}
function tipShow(key){const[t,pg]=TIPS[key],old=$('#tip');if(old)old.remove();let i=0;const d=document.createElement('div');d.id='tip';$('#app').appendChild(d);
 const fp=scene==='field'&&F?F.pause:null;if(fp!==null)F.pause=true;
 const close=()=>{d.remove();if(fp!==null&&scene==='field'&&F)F.pause=fp;};
 const r=()=>{d.innerHTML=`<div class="tpw"><div class="tph"><em>TUTORIAL</em><b>${t}</b><span>${i+1}/${pg.length}</span></div><div class="tpb">${pg[i]}</div><div class="tpf"><button class="tpo" data-k="off">説明を出さない</button><button class="tpn" data-k="next">${i<pg.length-1?'次へ ▶':'OK'}</button></div></div>`;};
 d.onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;SFX.sel();if(b.dataset.k==='off'){if(G&&G.set){G.set.tut=false;save();}return close();}if(++i>=pg.length)return close();r();};r();}

/* ==================== セーブ3スロット ==================== */

/* 記録メニュー：今のスロット表示・別スロットへの複製・設定 */

/* ==================== 開発者メニュー ==================== */

if(scene==='title')title();
