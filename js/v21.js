/* ===== ver0.21 表示の改善 =====
 1. 画面サイズ：実際に見えている高さ（全画面・セーフエリア込み）に合わせて各画面を収める
 2. 戦闘：敵のHP・状態は「狙っている敵」の頭上にだけ出す（敵1体ならその敵の頭上）。毎フレーム位置を追従
 3. ボス・高HPの敵：HPを複数本のゲージで表示（1本目が尽きると次のゲージが減り始める。ダメージ計算は変えない）
 4. 編成：カードに立ち姿を戻し、名前・職業・数値が重ならない配置に
 5. 星詠み（星盤）：画面の高さから盤面の大きさを決め、操作ボタンまでスクロールなしで収める
 6. 横スクロール：はみ出しの原因（負の余白）を直し、縦スクロール専用の領域は横に動かないように */

const VER21='ver0.21';
const V21=(()=>{
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const px=v=>parseFloat(v)||0;

/* ==================== 1. 画面サイズ ==================== */
/* 見えている高さを CSS 変数へ（iOS の全画面表示・ツールバーの出入りに追従） */
function setVH(){try{document.documentElement.style.setProperty('--apph',Math.round(innerHeight)+'px');}catch(e){}}
setVH();addEventListener('resize',setVH,true);addEventListener('orientationchange',()=>setTimeout(()=>{setVH();fit();if(scene==='town'&&TSC==='home')homeFit();},350));
if(window.visualViewport)visualViewport.addEventListener('resize',()=>{setVH();});
/* #app の中で使える高さ（上下のセーフエリアを除く） */
function contentH(){const a=$('#app'),s=getComputedStyle(a);return a.clientHeight-px(s.paddingTop)-px(s.paddingBottom);}
fit=function(){const sw=Math.max(1,Math.floor(Math.min(innerWidth,480)/W));let s=sw;
 if(scene==='battle'){const avail=contentH()-438;s=Math.max(1.35,Math.min(sw,avail/H));s=Math.floor(s*8)/8;}
 SC=s;const st=$('#stage'),h=scene==='board'?BCH():H*SC;cv.style.width=W*SC+'px';cv.style.height=h+'px';st.style.width=W*SC+'px';st.style.height=h+'px';
 if(scene==='battle'&&B)refresh();if(scene==='board'&&typeof sizeBoard==='function')sizeBoard();if(scene==='field'&&F&&typeof fitField==='function')fitField();};
/* ホーム：下のナビまで必ず見えるように、街の絵の高さを縮める */
function homeFit(){if(scene!=='town'||TSC!=='home')return;const c=$('#cmd');if(!c.classList.contains('home20'))return;
 const over=c.scrollHeight-c.clientHeight;if(over>1){const nh=clamp(H-Math.ceil(over/SC),104,H);if(nh!==H)setH(nh);}}

addEventListener('resize',()=>{try{if(scene==='town'&&TSC==='home')requestAnimationFrame(homeFit);if(scene==='board')requestAnimationFrame(boardFit);}catch(e){}});

/* ==================== 2・3. 戦闘：狙っている敵の情報とボスの複数HPゲージ ==================== */
/* ゲージの本数：敵データに bars があればそれを使う。なければボスのみ最大HPから決める（通常の敵は1本） */
function barsOf(e){if(!e)return 1;const d=ED[e.kind]||{};if(d.bars)return d.bars;if(!e.boss)return 1;const m=e.mhp;return m<2000?2:m<6000?3:m<15000?4:m<40000?5:6;}
/* 残りHPから「何本目を減らしているか」を求める（あふれたダメージは自然に次のゲージへ移る） */
function barState(e){const n=barsOf(e),per=e.mhp/n,hp=Math.max(0,e.hp);if(hp<=0)return{n,rem:0,fill:0};const rem=Math.min(n,Math.ceil(hp/per-1e-9));return{n,rem,fill:clamp((hp-(rem-1)*per)/per,0,1)};}
const BCOL=['#e5484d','#ff8a30','#ffd040','#6fdc7f','#5ad0ff','#c08cff'];
let EL=null,last={k:'',t:null,rem:0,w:0,h:0};
function ensure(){if(EL&&EL.isConnected)return EL;EL=document.createElement('div');EL.id='tg21';EL.innerHTML='<div class="t1"></div><div class="hpw"><div class="hb21"><s></s><u></u><i></i></div><em class="cnt"></em></div><div class="pip"></div><div class="t3"></div>';$('#labels').appendChild(EL);last={k:'',t:null,rem:0,w:0,h:0};return EL;}
function tgtOf(){if(!B)return null;const al=B.enemies.filter(e=>e.alive);if(!al.length)return null;return B.tgt&&B.tgt.alive&&B.enemies.includes(B.tgt)?B.tgt:al[0];}
function head(e){let fx,fy,w=20,h=26;try{[fx,fy]=V19.foot(e);const D=V19.dims(e);w=D.w;h=D.h;}catch(x){fx=e.x+8*e.sc;fy=e.y+16*e.sc;}
 const A=e.A||{},ix=B.intro>0&&e.boss?-(B.intro/90)*(B.intro/90)*70:0;return{x:(fx+(A.wx||0)+(A.kb||0)+ix)*SC,y:(fy+(A.wy||0)-h)*SC,w:w*SC,foot:(fy+(A.wy||0))*SC};}
function frame(){if(!B||scene!=='battle'){if(EL)EL.style.display='none';return;}const t=tgtOf(),el=ensure();if(!t||B.over){el.style.display='none';return;}
 const bs=barState(t),multi=bs.n>1,unk=t.weak.length-t.known.size,kw=t.weak.filter(x=>t.known.has(x)),tmp=(t.sts||[]).filter(s=>s.k==='weak').map(s=>s.el),one=B.enemies.filter(e=>e.alive).length===1;
 let tags='';try{tags=tagH(t);}catch(x){}
 const k=[t.name,t.lv,t.boss?1:0,kw.join(''),tmp.join(''),unk,tags,bs.n,one?1:0].join('|');
 if(k!==last.k){last.k=k;el.className=(t.boss?'boss ':'')+(multi?'multi ':'')+(one?'one':'');
  el.querySelector('.t1').innerHTML=`${t.boss?'<em class="bs">BOSS</em>':one?'':'<em>TARGET</em>'}<b>${t.name}</b><small>Lv${t.lv}</small>`;
  el.querySelector('.t3').innerHTML=(kw.length||unk||tmp.length?`<span class="wk">弱</span>`:'')+kw.map(x=>`<i class="w" style="--c:${ELC[x]}">${x}</i>`).join('')+tmp.filter(x=>!kw.includes(x)).map(x=>`<i class="w tm" style="--c:${ELC[x]}">${x}</i>`).join('')+(unk>0?`<i class="q">?×${unk}</i>`:'')+(tags?`<span class="tg">${tags}</span>`:'');
  el.querySelector('.pip').innerHTML=multi?Array.from({length:bs.n},(_,i)=>`<i style="--c:${BCOL[i]||BCOL[5]}"></i>`).join(''):'';
  el.style.display='';last.w=el.offsetWidth;last.h=el.offsetHeight;}
 /* ゲージ：狙いが変わったら残像を消して即座に切り替える */
 const hb=el.querySelector('.hb21'),fi=hb.querySelector('i'),tr=hb.querySelector('u'),bg=hb.querySelector('s');
 const fw=(bs.fill*100).toFixed(2)+'%',cur=BCOL[Math.max(0,bs.rem-1)]||BCOL[5],nxt=bs.rem>1?(BCOL[bs.rem-2]||BCOL[5]):'#2a0e14';
 if(last.t!==t){last.t=t;last.rem=bs.rem;tr.style.transition='none';tr.style.width=fw;void tr.offsetWidth;tr.style.transition='';}
 else if(bs.rem<last.rem){/* 1本削り切った：残像を新しいゲージの満タンから始め、割れる演出 */
  tr.style.transition='none';tr.style.width='100%';void tr.offsetWidth;tr.style.transition='';el.classList.remove('brk21');void el.offsetWidth;el.classList.add('brk21');
  /* ver0.49：ゲージの本数はダメージ表示に出さない（上の HP バーの ×N だけ） */try{SFX.brk&&SFX.brk();}catch(x){}last.rem=bs.rem;}
 else if(bs.rem>last.rem)last.rem=bs.rem;
 if(fi.style.width!==fw){fi.style.width=fw;tr.style.width=fw;}
 if(fi._c!==cur){fi._c=cur;fi.style.setProperty('--c',cur);}if(bg._c!==nxt){bg._c=nxt;bg.style.background=nxt;}
 const cnt=el.querySelector('.cnt'),ct=multi?'×'+bs.rem:'';if(cnt.textContent!==ct){cnt.textContent=ct;cnt.style.setProperty('--c',cur);}
 el.querySelectorAll('.pip i').forEach((p,i)=>{const on=i<bs.rem;if(p._on!==on){p._on=on;p.classList.toggle('off',!on);}p.classList.toggle('cur',i===bs.rem-1);});
 /* 位置：頭上 → 入らなければ画面上端（はみ出さない） */
 const hd=head(t),SW=W*SC,SH=H*SC,w=last.w||el.offsetWidth,h=last.h||el.offsetHeight;let x=clamp(hd.x-w/2,2,SW-w-2),y=hd.y-h-7,up=true;
 if(y<2){y=2;up=false;}y=Math.min(y,SH-h-2);const ax=clamp(hd.x-x,10,w-10);
 const tf=`translate(${Math.round(x)}px,${Math.round(y)}px)`;if(el._tf!==tf){el._tf=tf;el.style.transform=tf;}el.style.setProperty('--ax',Math.round(ax)+'px');el.classList.toggle('up',up);}
{const _d=draw;draw=function(){_d();try{frame();}catch(e){if(!frame._e){frame._e=1;console.error(e);}}};}

/* ==================== 4. 編成 ==================== */

/* ==================== 5. 星詠み（星盤） ==================== */
let BCH21=0;
BCH=function(){return BCH21||224*SC;};
bpos=function(n){const cw=W*SC,ch=BCH(),top=56,bot=20,av=ch-top-bot,s=Math.min(cw/(Math.sqrt(3)*7.4),av/10.4);return[cw/2+s*Math.sqrt(3)*(n.q+n.r/2),top+av/2+s*1.5*n.r,s];};
function boardFit(){if(scene!=='board')return;const c=$('#cmd'),m=$('#msg'),cs=getComputedStyle(c);let need=px(cs.paddingTop)+px(cs.paddingBottom)+px(cs.marginTop);
 for(const k of c.children){const s=getComputedStyle(k);need+=k.offsetHeight+px(s.marginTop)+px(s.marginBottom);}
 const ms=getComputedStyle(m),msgH=m.offsetHeight+px(ms.marginTop)+px(ms.marginBottom),h=clamp(Math.floor(contentH()-msgH-need-4),250,224*SC+90);
 if(h!==BCH21){BCH21=h;fit();}}

{const _ob=openBoard;openBoard=function(id,m){BCH21=0;return _ob(id,m);};}

/* ==================== 版表示 ==================== */

try{document.title='アストラル・ブレイカー '+VER21;}catch(e){}

return{barState,contentH,boardFit};})();
/* ==================== 開発者メニュー：ver0.21 の確認 ==================== */

