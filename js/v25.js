/* ===== ver0.25 戦闘画面の全面リデザイン =====
 1. 戦場を画面いっぱいに：戦場（キャンバス）は画面の上端から下端まで。説明文（「○○の番」など）の欄は廃止。
    行動中キャラのパネル・技リスト・下のボタンは戦場の上に重ねる（参考資料と同じ構成）
 2. 戦闘情報は「自分の番」だけ：行動中キャラのパネルと技リスト、戦場の HP／SP 表示は、味方の入力待ちのときだけ出す。
    敵の行動中・演出中・AUTO 中は、下のボタンだけを残して戦場を広く見せる
 3. 味方は右側に縦一列（参考資料の配置・大きさ）。HP／SP は各キャラの左下
 4. 「星臨」ボタンを廃止：パネルの星臨ゲージそのものをタップして発動。満タンで金色に光り、端の星が脈打つ（文字の説明は出さない）。
    タップすると光の輪が広がってから発動する（発動できないときはゲージが小さく揺れる）
 5. 文字のデザイン：和文＝太い丸ゴシック、欧文・数字＝斜体のコンデンス体。濃紺×金、黒の縁取りで統一。
    ダメージ等の文字の大きさは参考資料の比率に合わせて一段小さく
 既存の戦闘処理は V23.HK23／V24.HK24 の入口と、関数の包み（ラップ）だけで差し替える。セーブデータの形は変えない */
'use strict';
const VER25='ver0.25';
const V25=(()=>{
const{clamp,esc,DEV,LY,HK23}=V23;
const app=$('#app');app.classList.add('v25');
const inB=()=>scene==='battle'&&!!B;
const stage=()=>$('#stage');

/* ==================== 文字の大きさ（参考資料の比率） ====================
 参考：幅 390px 換算で、敵へのダメージ数字の高さ ≒ 17px、味方 ≒ 11〜12px、Weak は数字の約 0.75 倍 */
Object.assign(V24.FS24,{e:[9.6,18,22],h:[6.6,13,16],hl:[6.8,14,16],cb:[10.5,19,25],lb:.66});
/* 大ダメージの拡大率も控えめに（キャラや演出を隠さない） */
V24.TIER.splice(0,4,1,1.07,1.16,1.28);
/* 演出文字の書体：Critical／Weak／Guard／Miss／BREAK＝太い斜体の丸ゴシック系（参考資料と同じ系統で、小さくても潰れない）。
 属性の漢字・状態は太い丸ゴシック。ver0.25 初版の明朝・セリフ体は小さいと線が細く読みにくかったため戻す */
try{
 Object.assign(TX24.FONT.lat,{f:'"Nunito","Arial Rounded MT Bold","Helvetica Neue",Arial,sans-serif',w:900,it:'italic',cap:.72});
 Object.assign(TX24.FONT.jp,{f:'"M PLUS Rounded 1c","Hiragino Maru Gothic ProN","Hiragino Sans","Noto Sans JP","Yu Gothic",sans-serif',w:800,it:'normal',cap:.86,skew:.2});
 /* 属性の漢字：参考資料と同じ「黒い墨の字＋白い縁」 */
 TX24.STYLE.elm={font:'jp',fill:[[0,'#3a3046'],[.55,'#14101c'],[1,'#000000']],ow:.17,oc:'#ffffff',sh:[.04,.07,'rgba(0,0,0,.6)']};
 TX24.STYLE.weak=Object.assign({},TX24.STYLE.weak,{fill:[[0,'#ffd2dc'],[.4,'#ff5a78'],[.58,'#e8163e'],[1,'#a0001e']],oc:'#2a0008',rc:'#ffffff',rw:.05});
 TX24.clear();TX24.preload();
}catch(e){console.error(e);}

/* ==================== 1. 画面の骨組み ==================== */
/* 戦場の高さ＝画面の高さいっぱい（論理px） */
const appH=()=>Math.max(320,app.clientHeight||innerHeight);
HK23.battleH=()=>{const sc=V23.appW()/W;return clamp(Math.ceil(appH()/sc),150,600);};
/* 上の帯（敵の名前・HP・弱点）の下端 */
HK23.hudPx=()=>{const hd=$('#bt22 .b22hd'),bt=$('#bt22 .b22btn');let h=0;if(hd&&hd.offsetParent)h=hd.offsetTop+hd.offsetHeight;if(bt&&bt.offsetParent)h=Math.max(h,bt.offsetTop+bt.offsetHeight);return Math.max(h,58)-6;};
/* 下の帯＝重ねて表示するパネルの上端から画面の下まで（パネルが隠れていても場所は空けておく） */
let DOCK=0;
HK23.botPx=()=>{const st=stage(),bp=$('#bp24');if(!st)return 46;const sh=st.offsetHeight;DOCK=(!bp||!bp.offsetParent)?Math.round(sh*.42):Math.max(46,sh-bp.offsetTop+2);return DOCK;};
/* 下のボタンだけのときの帯の高さ（ダメージ表示などはここまで下に出せる） */
const barPx=()=>{const st=stage(),bb=$('#bbar');if(!st||!bb||!bb.offsetParent)return 60;return Math.max(46,st.offsetHeight-bb.offsetTop+4);};

/* ==================== 2. 味方：右側に縦一列（参考資料の配置・大きさ） ====================
 参考資料：味方は画面右の縦一列（わずかに弓なり）、1人の背丈は画面幅の約 11%、間隔は背丈の 1.5〜2 倍。
 HP／SP の数字はキャラの左下（ver0.24 の配置）。敵はその左側の広い範囲に置く */
let K25=0,SLOT25=[];
function heroK(h,k){const A=ANIM.setup(h);if(!A||A.none)return;if(A._key25!==A.key||A._sc0==null){A._key25=A.key;A._sc0=A.sc;}h._k25=k;const s=A._sc0*k;if(Math.abs(A.sc-s)>1e-6)A.sc=s;}
HK23.placeHeroes=(hs,LY)=>{const n=hs.length;hs.forEach(h=>heroK(h,1));let ww=0,hh=0;hs.forEach(h=>{const D=V19.dims(h);ww=Math.max(ww,D.w);hh=Math.max(hh,D.h);});
 const k=clamp(V23.appW()*.112/(hh*SC),.72,1);hs.forEach(h=>heroK(h,k));ww*=k;hh*=k;
 const band=LY.bot-LY.top,s=n>1?Math.min(hh*1.9,(band-hh-4)/(n-1)):0,span=s*(n-1)+hh,top=LY.top+Math.max(2,(band-span)*.55),back=W*.84;
 K25=k;SLOT25=[];hs.forEach((h,i)=>{const fy=top+hh+s*i,fx=back-Math.round(W*.035*Math.sin(Math.PI*(i+.5)/n));SLOT25[i]=[fx,fy];h.x=fx-8*h.sc;h.y=Math.round(fy-16*h.sc+2);h._fx23=fx;});
 LY.heroL=Math.min(...hs.map(h=>h._fx23))-ww/2-14;};
/* 星臨・見た目の切り替えで絵の設定が作り直されても、大きさを保つ */
/* 交代で加わった味方：同じ縮尺・同じ持ち場に置く（新しい絵は縮尺が未設定のため、登場時だけ大きく見えていた） */
function fitNew(h,i){if(!K25)return;heroK(h,K25);const sl=SLOT25[i];if(sl&&!h.A?.mv){h.x=sl[0]-8*h.sc;h.y=Math.round(sl[1]-16*h.sc+2);h._fx23=sl[0];}try{V24.renderHL0();}catch(e){}}
{const _d=draw;draw=function(){if(scene==='battle'&&B){try{B.heroes.forEach((h,i)=>{if(h._k25)heroK(h,h._k25);else fitNew(h,i);});}catch(e){}}_d();if(scene==='battle'&&B){try{tick();}catch(e){if(!draw._e25){draw._e25=1;console.error(e);}}}};}

/* ==================== 3. 自分の番だけ情報を出す ==================== */
let MY=false,hideT=0;
const isMy=()=>inB()&&!B.over&&!!B.pick&&!!B.cur&&B.cur.side===0&&!app.classList.contains('aw25');
function setMy(v){if(v===MY){clearTimeout(hideT);hideT=0;return;}
 if(v){clearTimeout(hideT);hideT=0;MY=true;app.classList.add('my25');try{V24.renderBP();}catch(e){}return;}
 if(!hideT)hideT=setTimeout(()=>{hideT=0;MY=false;app.classList.remove('my25');},90);}
/* 行動中の味方の頭上の印 */
function marker(){let m=$('#mk25');if(!m||!m.isConnected){m=document.createElement('div');m.id='mk25';m.innerHTML='<i></i>';stage().appendChild(m);}return m;}
function tick(){setMy(isMy());const ov=!!B.over;if(app.classList.contains('ov25')!==ov)app.classList.toggle('ov25',ov);if(DOCK){const bp=MY?DOCK:barPx();if(LY.botPx!==bp)LY.botPx=bp;}const m=marker();if(!MY||!B.cur||B.cur.side!==0){if(m.style.display!=='none')m.style.display='none';return;}
 const b=V24.boxOf(B.cur,false),tf=`translate(${Math.round(b.cx-7)}px,${Math.round(b.t-16)}px)`;if(m._tf!==tf){m._tf=tf;m.style.transform=tf;}if(m.style.display!=='block')m.style.display='block';
 gaugeState();}
/* 星臨の演出中はパネルを隠す */
{const _aw=awaken;awaken=async function(u){const on=inB();if(on){app.classList.add('aw25');clearTimeout(hideT);hideT=0;MY=false;app.classList.remove('my25');}try{return await _aw(u);}finally{app.classList.remove('aw25');}};}

/* ==================== 4. 星臨ゲージをタップして発動 ==================== */
function canAw(a){return inB()&&!!B.pick&&B.pick.u===a&&!a.aw&&a.alive&&(DEV()||(a.ag>=100&&B.heroes.filter(x=>x.aw).length<2));}
function ensureGauge(){const bp=$('#bp24');if(!bp)return null;const od=bp.querySelector('.od');if(!od)return null;
 if(!od._v25){od._v25=1;od.setAttribute('role','button');od.setAttribute('aria-label',SEIRIN.n+'ゲージ（満タンでタップして発動）');
  od.insertAdjacentHTML('beforeend','<i class="st25" aria-hidden="true"></i><i class="rp25"></i>');od.querySelector('.g').insertAdjacentHTML('beforeend','<u class="sh25"></u>');}
 return od;}
function gaugeState(){const bp=$('#bp24'),od=ensureGauge();if(!bp||!od)return;const a=bp._h,r=!!a&&canAw(a);if(bp.classList.contains('rdy25')!==r)bp.classList.toggle('rdy25',r);const ad=r?'false':'true';if(od.getAttribute('aria-disabled')!==ad)od.setAttribute('aria-disabled',ad);}
let BUSY=false;
function tapGauge(od,e){const bp=$('#bp24'),a=bp&&bp._h;if(!a||!inB())return;
 if(!canAw(a)||BUSY){od.classList.remove('ng25');void od.offsetWidth;od.classList.add('ng25');try{tone(180,.06,'square',.03);}catch(x){}return;}
 BUSY=true;const r=od.getBoundingClientRect(),x=(e&&e.clientX?e.clientX-r.left:r.width/2),rp=od.querySelector('.rp25');
 if(rp){rp.style.left=Math.round(x)+'px';}bp.classList.remove('fire25');void bp.offsetWidth;bp.classList.add('fire25');
 try{tone(660,.06,'triangle',.05);setTimeout(()=>tone(990,.1,'triangle',.05),70);}catch(x){}
 setTimeout(()=>{BUSY=false;bp.classList.remove('fire25');if(inB()&&B.pick&&B.pick.u===a)B.pick.aw();},300);}
/* パネル本体のタップ（状態の詳細）より先にゲージのタップを拾う */
document.addEventListener('click',e=>{const od=e.target.closest('#bp24 .od');if(!od)return;e.stopPropagation();e.preventDefault();tapGauge(od,e);},true);

/* ==================== 5. 下のボタン・技リストの細部 ==================== */
/* 下のボタンの再描画のあとで、文字の段組みを整える */
{const _bb=bbar;bbar=function(f){_bb(f);const b=$('#bbar');if(b)b.classList.add('v25');};}

/* ==================== 組み込み ==================== */
{const _rf=refresh;refresh=function(){_rf();if(!inB())return;try{ensureGauge();gaugeState();}catch(e){console.error(e);}};}
{const _sb=startBattle;startBattle=function(list,opts){MY=false;app.classList.remove('my25','aw25');const r=_sb(list,opts);
  /* 書体の読み込みでパネルの高さが変わることがあるので、少し後にもう一度配置する */
  try{requestAnimationFrame(()=>{try{V23.layout(true);}catch(e){}});setTimeout(()=>{try{if(inB())V23.layout(false);}catch(e){}},400);}catch(e){}return r;};}
{const _sh=show;show=function(m){_sh(m);if(m!=='battle'){MY=false;clearTimeout(hideT);hideT=0;app.classList.remove('my25','aw25','ov25');}};}
try{document.fonts&&document.fonts.ready.then(()=>{if(inB()){try{V23.layout(false);}catch(e){}}});}catch(e){}

/* ==================== お知らせ・開発者メニュー・版表示 ==================== */
const NEWS25=`<div class="nt"><b>${VER25}</b>　戦闘画面を全面的に作り直しました。<br><small>・戦場を画面いっぱいに広げ、「○○の番」などの説明文を廃止。<br>・行動中キャラのパネル・技リスト・HP表示は、自分の番のときだけ表示。<br>・味方は画面右に縦一列（参考資料の配置）。<br>・「${SEIRIN.n}」ボタンを廃止。満タンで光るゲージをタップすると発動します。<br>・文字の書体・縁取り・配色を一新しました。</small></div>`;
document.addEventListener('click',e=>{const t=e.target.closest('[data-h22="news"]');if(!t||scene!=='town')return;e.stopPropagation();e.preventDefault();SFX.sel();
 const vn=V22.HM.news||'';ovOpen(`<div class="nw22"><div class="nh"><b>お知らせ</b></div>${vn||''}${NEWS25}${V23.NEWS23||''}</div><button class="tbtn back wide" data-a="close">閉じる</button>`,{close:ovClose});},true);
function dev25(m){log(m||`<b>${VER25}</b>　戦闘画面の確認`);
 menu([{l:'通常戦（敵3体）',s:'縦一列の配置・自分の番だけの表示',cls:'ready',f:()=>devBattle([{kind:'slime',lv:5},{kind:'wolf',lv:5},{kind:'shroom',lv:5}],'haido',{boss:false})},
  {l:'ボス＋手下',s:'上の帯・照準・ダメージ表示',f:()=>devBattle([{kind:'boss2',lv:10},{kind:'moss',lv:8},{kind:'jadewolf',lv:8}],'midori',{theme:'forest'})},
  {l:'大型ボス',s:'敵の大きさと味方の列',f:()=>devBattle([{kind:'boss9',lv:60}],'ryuu',{theme:'lava'})},
  {l:'ダメージ同時表示の負荷試験',s:'文字の大きさ・重なり',f:()=>{devBattle([{kind:'slime',lv:5},{kind:'wolf',lv:5},{kind:'shroom',lv:5}],'haido',{boss:false});setTimeout(()=>V24.stress(),1300);}},
  {l:'戻る',cls:'back',f:()=>dvMenu()}],true);}
{const _dv=dvMenu;dvMenu=function(m){_dv(m);try{addCmd(VER25+' 戦闘画面','縦一列・ゲージで星臨・自分の番だけ表示',dev25,0,'ready');}catch(e){}};}
{const _t=title;title=function(){_t();const v=$('#verL');if(v)v.textContent=VER25;};const v=$('#verL');if(v)v.textContent=VER25;}
try{document.title='アストラル・ブレイカー '+VER25;}catch(e){}
return{NEWS25,dev25,tapGauge,canAw,heroK,tick,get MY(){return MY;}};})();
