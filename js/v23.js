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
{const _sh=show;show=function(m){_sh(m);app.dataset.sc=m;fadeIn();};}
{const _ro=roomOpen;roomOpen=function(...a){const r=_ro(...a);fadeIn();try{fit();}catch(e){}return r;};}

/* ==================== 1. 戦闘画面 ==================== */
const LY={top:40,bot:150,heroL:118,hudPx:80,botPx:46};
/* ver0.25：後の版が戦場の高さ・上下の帯・味方の配置を差し替えるための入口 */
const HK23={};
const CMDMIN=()=>innerHeight<620?128:innerHeight<700?146:innerHeight<800?160:172;
/* 上の固定帯（敵の名前・HP・弱点）と、下の行動順・星臨ボタンの高さ（画面px） */
function hudPx(){const hd=$('#bt22 .b22hd'),bt=$('#bt22 .b22btn');let h=0;if(hd&&hd.offsetParent)h=hd.offsetTop+hd.offsetHeight;if(bt&&bt.offsetParent)h=Math.max(h,bt.offsetTop+bt.offsetHeight);return Math.max(h,58);}
function botPx(){const st=$('#stage'),o=$('#bt22 .b22ord'),a=$('#bt22 .b22aw');if(!st)return 46;const sh=st.offsetHeight;let t=sh;for(const e of[o,a])if(e&&e.offsetParent)t=Math.min(t,e.offsetTop);return Math.max(40,sh-t);}
function battleH(){if(HK23.battleH)return HK23.battleH();const sc=appW()/W,ch=V21.contentH(),used=Math.max(oh($('#msg')),40)+Math.max(oh($('#bp24')),84)+Math.max(oh($('#bbar')),44)+CMDMIN();
 return clamp(Math.floor((ch-used)/sc),132,300);}
/* 味方：右側に縦に並べる。間隔が体の高さより狭いときは2列のジグザグにして、全身が重ならないようにする */
function placeHeroes(){const hs=B.heroes,n=hs.length;if(!n)return;LY.ebot=null;if(HK23.placeHeroes)return HK23.placeHeroes(hs,LY);let hh=0,ww=0;hs.forEach(h=>{const D=V19.dims(h);hh=Math.max(hh,D.h);ww=Math.max(ww,D.w);});
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
function placeEnemies(full){const x0=3,x1=Math.max(60,LY.heroL-10),EB=LY.ebot!=null?LY.ebot:LY.bot,band=EB-LY.top,es=B.enemies;
 const fixed=full?[]:es.filter(e=>e._p23&&e.alive),todo=full?es.filter(e=>e.alive||!e._p23):es.filter(e=>!e._p23);if(!todo.length)return;
 const box=e=>{const D=eDims(e),fx=e.x+8*e.sc,fy=e.y+16*e.sc-2;return[fx-D.w/2,fy-D.h,fx+D.w/2,fy];};
 const placed=fixed.map(box),boss=es.some(e=>e.boss&&e.alive),bossT=todo.filter(e=>e.boss),mins=todo.filter(e=>!e.boss);
 const order=[...bossT,...mins],nM=mins.length+(full?0:fixed.filter(e=>!e.boss).length);let mi=full?0:fixed.filter(e=>!e.boss).length;
 for(const e of order){ANIM.setup(e);capScale(e,band,x1-x0);let ax,ay;
  if(e.boss){ax=.4;ay=.62;}else{const k=mi++;const L=boss?BANC:(ANC[Math.min(5,Math.max(1,nM))]||ANC[5]);const a=L[k%L.length];ax=a[0];ay=a[1];}
  /* 重ならない場所が無ければ、その敵を少しずつ縮めて探し直す（最小72%） */
  let best=null;for(const shrink of[1,.86,.72]){if(shrink<1&&e.A&&!e.A.none){e.A.sc=(e._cap23||e.A.sc23||e.A.sc)*shrink;e._cap23=e.A.sc;}
   const D=eDims(e),fxA=x0+D.w/2+(x1-x0-D.w)*ax,fyA=LY.top+D.h+(band-D.h)*ay;let bc=1e18,bo=0;best=null;
   for(let fy=LY.top+D.h;fy<=EB+.01;fy+=2)for(let fx=x0+D.w/2;fx<=x1-D.w/2+.01;fx+=2){const b=[fx-D.w/2-2,fy-D.h-2,fx+D.w/2+2,fy+2];let ov=0;
     for(const p of placed){const ix=Math.min(b[2],p[2])-Math.max(b[0],p[0]),iy=Math.min(b[3],p[3])-Math.max(b[1],p[1]);if(ix>0&&iy>0)ov+=ix*iy;}
     const c=ov*60+Math.hypot(fx-fxA,(fy-fyA)*1.2);if(c<bc){bc=c;bo=ov;best=[fx,fy];}}
   if(!best)best=[fxA,fyA];if(bo<=0)break;}
  e.x=best[0]-8*e.sc;e.y=Math.round(best[1]-16*e.sc+2);e._p23=1;placed.push(box(e));}}
function layout(full=true){if(scene!=='battle'||!B)return;const nh=battleH();if(nh!==H){setH(nh);try{BG=makeBg(V22.BL.th,V22.BL.boss);if(typeof VOIDED!=='undefined'&&VOIDED&&typeof desat==='function')BG=desat(BG);}catch(e){}}else fit();
 LY.hudPx=(HK23.hudPx||hudPx)();LY.botPx=(HK23.botPx||botPx)();LY.top=(LY.hudPx+6)/SC;LY.bot=H-(LY.botPx+3)/SC;if(LY.bot-LY.top<44)LY.bot=LY.top+44;
 placeHeroes();placeEnemies(full);app.style.setProperty('--hud23',LY.hudPx+'px');app.style.setProperty('--bot23',LY.botPx+'px');refresh();}
{const _sb=startBattle;startBattle=function(list,opts){const r=_sb(list,opts);try{layout(true);requestAnimationFrame(()=>{try{layout(true);}catch(e){}});}catch(e){console.error(e);}return r;};}
addEventListener('resize',()=>{if(scene==='battle')requestAnimationFrame(()=>requestAnimationFrame(()=>{try{layout(true);}catch(e){}}));});
/* 召喚・形態変化で後から出た敵も、重ならない位置へ置く。縮めた敵の大きさを保つ */
{const _d=draw;draw=function(){_d();if(scene!=='battle'||!B)return;try{for(const e of B.enemies){if(e._cap23&&e.A&&e.A.sc>e._cap23+1e-6)e.A.sc=e._cap23;}if(B.enemies.some(e=>!e._p23))placeEnemies(false);}catch(e){if(!draw._e23){draw._e23=1;console.error(e);}}};}

/* 下部のパーティ情報欄は ver0.24（v24.js）の「行動中キャラのパネル＋戦場のHP表示」に置き換え */

/* ==================== 2. ダメージ・戦闘演出 ====================
 ver0.24（v24.js）の配置マネージャ＋Canvas文字（TX24）に置き換え */

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

/* ==================== 4. 図鑑 ====================
 ver0.29 で js/zukan/zukan.js（一覧・詳細）と js/zukan/viewer.js（回転ビューア）へ移した */

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
/* お知らせの表示は ver0.24（v24.js）で最新版の内容と合わせて行う（以前は版ごとに別々に開き、二重に開いていた） */
function dev23(m){log((m||`<b>${VER23}</b>　戦闘画面・ダメージ表示・${SEIRIN.n}演出・図鑑・探索の確認`));
 menu([{l:'戦闘：ボス＋手下',s:'配置・パーティ情報欄・ダメージ表示',cls:'ready',f:()=>devBattle([{kind:'boss2',lv:10},{kind:'moss',lv:8},{kind:'jadewolf',lv:8}],'midori',{theme:'forest'})},
  {l:'戦闘：大型ボス',s:'演技エリアに収まるか',f:()=>devBattle([{kind:'boss9',lv:60}],'ryuu',{theme:'lava'})},
  {l:'ダメージ表示の見本',s:'Critical・Weak・Guard・Miss',f:()=>{devBattle([{kind:'boss',lv:5},{kind:'slime',lv:5}],'haido');setTimeout(sample,1400);}},
  {l:'図鑑（モーション再生）',f:()=>zkMenu()},{l:'探索（テキスト切り替え）',f:()=>enterField('midori')},{l:'戻る',cls:'back',f:()=>dvMenu()}],true);}
function sample(){if(!B)return;const e=B.enemies[0],s=B.enemies[1],h=B.heroes;let i=0;const q=[()=>pop(e,128,'#fff',false,''),()=>pop(e,864,'#fff',false,'weak','光'),()=>pop(e,2480,'#fff',false,'crit weak','打'),
  ()=>{h[1].guard=true;pop(h[1],412,'#f88',false,'hurt');setTimeout(()=>pop(h[1],'スタン','#ffe14a',true,'st20 dn'),40);},()=>pop(h[2],'MISS','#fff',true),()=>pop(h[3],'+640','#7dffa8'),()=>{h[1].guard=false;}];
 const go=()=>{if(i<q.length){try{q[i++]();}catch(x){}setTimeout(go,520);}};go();}
{const _dv=dvMenu;dvMenu=function(m){_dv(m);try{addCmd(VER23+' 戦闘画面・図鑑','配置・ダメージ表示・'+SEIRIN.n+'演出・図鑑',dev23,0,'ready');}catch(e){}};}

/* 版表示 */
{const _t=title;title=function(){_t();const v=$('#verL');if(v)v.textContent=VER23;};const v=$('#verL');if(v)v.textContent=VER23;}
try{document.title='アストラル・ブレイカー '+VER23;}catch(e){}
return{HK23,NEWS23,homeFix,applyFieldMsg,layout,LY,seirinText,fadeIn,placeEnemies,placeHeroes,battleH,esc,clamp,appW,oh,sleep,DEV};})();
