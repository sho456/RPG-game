/* ===== ver0.31 クエスト制（マップ探索の廃止） =====
 1. 出撃先はクエスト一覧。章ごとに複数のクエストがあり、区切りに中ボス・大ボスのクエストがある。
    1 つのクエストで 2〜4 回の戦闘が続くものもある（戦闘の合間に HP・LP は回復しない。倒れた仲間は LP が残っていれば HP20% で起きる。ver0.38 から敵を全滅させると自動で次の戦闘へ）
 2. 表記：一覧に「戦闘×3」「中ボス」「大ボス」「推奨Lv」「CLEAR／クリア回数」、戦闘中に「BATTLE 2/3」、
    出発時に「BATTLE 1/3」の見出し、報酬画面に宝箱とクエスト名、最後に「QUEST CLEAR」とクリアボーナス
 3. 宝箱は敵が落とす（通常の敵はまれに銅の宝箱、中ボスは銀、大ボスは金。金の宝箱からはレジェンドや天極の星晶も）
 4. 仲間の加入・クロウの選択・残響・エンディングは、該当クエストの初回クリア後のイベントになった
 5. 虚蝕化：本編の章のうち 1 つが、出撃 3 回ごとに入れ替わりで虚蝕化（敵が強いぶん、ドロップと灯力が増える）
 6. 全滅してもお金は減らない（クエスト失敗。それまでに得た報酬は残る）。戦闘中のメニュー（≡）から撤退もできる
 旧データ：ボスの旗・仲間の加入・塔の到達階・残響・回廊の到達層から、クリア済みのクエストを自動で決める */

function qCleared(id){return!!(G&&G.qs&&G.qs.c&&G.qs.c[id]);}
const V31Q=(()=>{
const{esc,fm}=V31,{CH,POST}=QD;
const QS=()=>G.qs||(G.qs={c:{},seen:{}});

const chById=id=>CH.find(c=>c.id===id);
/* ---------- 虚の回廊（10層で 1 クエスト・どこまでも続く） ---------- */
const KRC={};
function krQ(f0){if(KRC[f0])return KRC[f0];const fb=f0+9;
 const w=[0,1,2].map(i=>{const f=f0+i*3;let g=['vo_shade'];try{g=makeKairouArea(f).groups[i];}catch(e){}return{e:g,lv:kLv(f)};});
 w.push({e:[kBoss(fb)],lv:kLv(fb)});
 return KRC[f0]={id:'kr'+f0,n:`${f0}〜${fb}層`,lv:kLv(fb),w,f0,d:`色を失った星の記憶が積み重なる回廊。${fb}層に番人がいる。`,post:fb===30?'celes':null,first:{loot:[[kLv(fb),3]]}};}
function krQuests(){const K=kst(),n=Math.floor(Math.max(0,(K.cp||1)-1)/10)+1,o=[];for(let i=0;i<n;i++)o.push(krQ(i*10+1));return o;}
const qsOf=c=>c.dyn==='kairou'?krQuests():c.qs;

const chOpen=c=>{try{return!!c.need();}catch(e){return false;}};
function qOpen(c,q){if(!chOpen(c))return false;const L=qsOf(c),i=L.indexOf(q);return i<=0||qCleared(L[i-1].id);}

const waveOf=w=>Array.isArray(w)?{e:w}:w;
const kindOf=k=>k==='@crow'?(G.flags&&G.flags.crowChoice?'boss4b':'boss4'):k;

const known=k=>{k=kindOf(k);return!!(G.zk&&G.zk.e&&G.zk.e[k])||!!(G.known&&G.known[k]);};

/* ---------- 旧データからの移し替え（何度呼んでもよい。クリアを足すだけ） ---------- */
function migQ(){if(!G)return;const S=QS(),done=id=>{if(!S.c[id])S.c[id]=1;};const F=G.flags||{};
 const FC={boss1:'c0',boss2:'c1',boss3:'c2',boss4:'c3',boss5:'c4',boss6:'c5',boss7:'c6',boss8:'c7',boss9:'d1'};
 for(const f in FC)if(F[f])chById(FC[f]).qs.forEach(q=>done(q.id));
 for(const[f,q]of[['mireMet','q1_3'],['jinMet','q1_5'],['noahMet','q2_3'],['ernaMet','q3_2'],['balzaMet','q3_4'],['hakuaMet','q4_3'],['valkMet','d1_3']])if(F[f])done(q);
 const tm=(G.tower&&G.tower.max)||0;chById('c6').qs.forEach(q=>{if(q.tw&&(tm>q.tw||(tm>=q.tw&&q.tw%10)))done(q.id);});
 const en=Object.keys(F.echo||{}).length;if(en)done('q7_1');['q7_2','q7_3','q7_4'].slice(0,en).forEach(done);
 const K=G.kairou;if(K)for(let f0=1;f0+9<(K.cp||1);f0+=10)done('kr'+f0);
 for(const c of CH){const L=qsOf(c);let last=-1;L.forEach((q,i)=>{if(S.c[q.id])last=i;});for(let i=0;i<last;i++)done(L[i].id);}}
{const _mg=migrate;migrate=function(g){const r=_mg(g);try{QS();migQ();}catch(e){console.error(e);}return r;};}

/* ---------- 宝箱 ---------- */

try{for(const[k,c1,c2,c3]of[['chest_bronze','#c8743a','#7a4a22','#e0b060'],['chest_silver','#d8e0ec','#6a7488','#9fd8ff'],['chest_gold','#ffd34a','#a8701a','#ff6a6a']])
 IC21.def(k,[c1,c2,c3],'f',[],{glow:k==='chest_gold'?'#ffe27a':k==='chest_silver'?'#cfe8ff':null,ga:90,sp:k==='chest_gold'?2:k==='chest_silver'?1:0,dr:(t,M)=>{
  t.rect(3,9,18,11,M.e);t.rect(4,10,16,9,M.d);t.rect(3,4,18,6,M.e);t.rect(4,5,16,4,M.a);t.rect(4,5,16,1,M.w);
  t.rect(3,9,18,2,M.b);t.rect(6,4,2,16,M.c);t.rect(16,4,2,16,M.c);t.rect(10,8,4,5,M.h);t.rect(11,9,2,2,M.g);t.px(11,11,M.x);}});}catch(e){console.error(e);}

let QR=null,LASTCH=[];

/* 報酬画面（v20-ui が作った画面）にクエストの表記と宝箱を足す */

/* ---------- 戦闘中の表記 ---------- */
{const _rf=refresh;refresh=function(){_rf();try{if(scene!=='battle'||!B)return;const rt=document.querySelector('#bt22 .b22rt');if(!rt)return;let s=rt.querySelector('.qw31');
 if(B.opts&&B.opts.quest&&QR){if(!s){s=document.createElement('span');s.className='qw31';rt.appendChild(s);}const t=`<small>BATTLE</small><b>${QR.wave+1}/${QR.q.w.length}</b>`;if(s.innerHTML!==t)s.innerHTML=t;}else if(s)s.remove();}catch(e){}};}

/* ---------- 進行 ---------- */

function ovShow(html,cls){const ov=$('#ov');ov.classList.remove('hide','rw20ov','ttl');ov.className=(ov.className||'').replace(/\bq\w+31ov\b/g,'');ov.classList.add(cls||'qi31ov');ov.innerHTML=html;ov.scrollTop=0;return ov;}
/* ver0.38：連続戦闘は自動で次へ（移行演出は autoNext）。撤退は戦闘中のメニューから */

function qFail(kind){const q=QR&&QR.q;try{VOIDED=false;}catch(e){}
 ovShow(`<div class="qc31 fail"><div class="qcT"><span>${kind==='lose'?'QUEST':'RETREAT'}</span><span>${kind==='lose'?'FAILED':''}</span></div><div class="qcn"><b>${esc(q?q.n:'')}</b><em>${kind==='lose'?'全滅した……灯守たちに救われ、灯都へ運ばれた':'撤退した'}</em></div>
  <div class="qcg"><div><em>獲得EXP</em><b>${fm(QR?QR.tot.xp:0)}</b></div><div><em>獲得GOLD</em><b>${fm(QR?QR.tot.gold:0)}</b></div><div><em>装備</em><b>${QR?QR.tot.items:0}</b></div></div>
  <div class="qno31">それまでに得た報酬は持ち帰った（お金は減らない）</div><button class="big gold" id="qok">クエスト一覧へ</button><button class="big" id="qtown">灯都へ戻る</button></div>`,'qc31ov');
 QR=null;save();$('#qok').onclick=()=>{SFX.sel();healAll();questMap();};$('#qtown').onclick=()=>{SFX.sel();enterTown('灯都へ帰還した。仲間のHPが全回復した。');};}
/* 全滅：クエスト中はお金を失わない／勝利：報酬画面に表記を足す */

/* ver0.38：敵を全滅させたら、報酬画面を挟まずに次の戦闘へ（獲得したものは移行演出の中に小さく出す） */

/* ---------- 初回クリア後のイベント ---------- */

let TOAST='';
/* ver0.49：クエストの前後の会話（ストーリー）は表示しない。台詞のデータ（設定）は残し、続きの処理だけを進める */

/* ---------- クエスト一覧の画面 ---------- */
const QM={on:false,tab:0,ch:{},sel:null,cur:null,bgs:{},st:new Map(),view:'list'};
const TABS=[['本編',()=>true,''],['深層',()=>!!G.flags.boss8,'終章クリアで開放'],['天極',()=>!!G.flags.boss9,'竜の巣クリアで開放']];

const lvTag=lv=>`推奨Lv${lv}`;

/* ---------- ver0.32 クエスト情報（専用のタブ） ----------
 一覧でクエストを選ぶと、このタブに移る。上の画面は出撃前の対峙（敵とパーティ）。概要・出現する敵（戦闘ごと）・報酬・パーティを見て出撃する */

function questMap(m){migQ();const ov=$('#ov');ov.classList.add('hide');ov.classList.remove('qi31ov','qc31ov','qr31ov','rw20ov');const p=worldMap31;p(m);}

/* ver0.32：出撃前の画面。クエストに出る敵（ボスを先頭に最大 3 体）が左、パーティが右で向かい合う。
   絵は戦闘と同じ原画（SPX）で、向きは FACING（図鑑で設定した向き → 既定：味方は左・敵は右）。未遭遇の敵はシルエット */
function qmFoes(q){if(!q)return[];const ks=[];for(const w of q.w)for(const k of waveOf(w).e.map(kindOf))if(ED[k]&&!ks.includes(k))ks.push(k);
 const bs=ks.filter(k=>ED[k].boss),ns=ks.filter(k=>!ED[k].boss);return[...bs.slice(-1),...ns].slice(0,3);}
const QSLOT={1:[[40,92]],2:[[24,74],[50,92]],3:[[18,68],[54,76],[34,94]]};/* 敵の足元（後ろ→前）。前ほど大きく見えるよう最後をボスに */
const HSLOT=[[116,62],[150,69],[128,84],[162,91]];
function qmCv(spr,fk,side,area,sil){const key=spr+'|'+fk+'|'+side+'|'+area+'|'+(sil?1:0)+'|'+FACING.of(fk,side);if(QM.st.has(key))return QM.st.get(key);let f=null;
 try{f=SPX.unitCv(spr,fk,side,{area});}catch(e){}if(f&&sil){const c=silOf(f.cv);f=Object.assign({},f,{cv:c});}if(f)QM.st.set(key,f);return f;}
function drawQM(){const x0=QM.cur;if(!x0)return;const th=x0.th||'ash';if(!QM.bgs[th])QM.bgs[th]=makeBg(th,true);ctx.drawImage(QM.bgs[th],0,0);if(x0.vd){ctx.fillStyle='rgba(120,60,200,.24)';ctx.fillRect(0,0,W,H);}
 const k=bK(),zi=Math.max(1,Math.floor(k*.75)),u=k/zi;/* 1 ドット＝zi 画素（整数倍でドットをそろえる）。u＝論理 1px あたりのドット数 */
 const put=(f,fx,fy,bob)=>{if(!f)return;ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;
  ctx.fillStyle='rgba(0,0,0,.35)';const sw=Math.round(f.w*zi*.32);ctx.fillRect(Math.round(fx*k-sw),Math.round(fy*k-zi),sw*2,zi*2);
  ctx.drawImage(f.cv,Math.round(fx*k-(f.ax+.5)*zi),Math.round((fy+bob)*k-(f.ay+1)*zi),f.w*zi,f.h*zi);ctx.restore();};
 const foes=SPX.ready?qmFoes(x0.q):[],sl=QSLOT[Math.max(1,foes.length)]||QSLOT[1],kn=k2=>known(k2)||(x0.q&&qCleared(x0.q.id));
 const order=foes.slice().reverse();/* 後ろの列から描く（先頭＝ボスは最前列） */
 if(SPX.ready){order.forEach((fk,i)=>{const d=ED[fk],[fx,fy]=sl[sl.length-1-i]||sl[0],big=d.boss?d.rank==='big'||TERMS.charCat(fk)==='big':false;
   put(qmCv(d.spr||fk,fk,1,(d.boss?(big?46:40):32)*u,!kn(fk)),fx,fy,Math.round(Math.sin(tick/26+i)*1.2));});
  G.party.map((id,i)=>[HSLOT[i],id,i]).filter(x=>x[0]).sort((a,b)=>a[0][1]-b[0][1]).forEach(([[fx,fy],id,i])=>put(qmCv(id,id,0,30*u,false),fx,fy,((tick>>5)+i)%2));}
 const g=ctx.createLinearGradient(0,84,0,H);g.addColorStop(0,'rgba(5,6,15,0)');g.addColorStop(1,'rgba(5,6,15,.9)');ctx.fillStyle=g;ctx.fillRect(0,84,W,H-84);}
{const _d=draw;draw=function(){if(QM.on&&scene==='town'&&$('#cmd').classList.contains('qm31')){tick++;const k=bK();if(cv.width!==W*k||cv.height!==H*k){cv.width=W*k;cv.height=H*k;}ctx.setTransform(k,0,0,k,0,0);ctx.imageSmoothingEnabled=false;try{drawQM();}catch(e){}requestAnimationFrame(draw);return;}QM.on=false;_d();};}

/* ---------- 旧マップへの入口をクエストへ ---------- */

function nextQ(){try{for(const tab of[2,1,0]){if(!TABS[tab][1]())continue;for(const c of CH.filter(x=>x.tab===tab&&chOpen(x)&&!x.dyn)){const q=qsOf(c).find(y=>qOpen(c,y)&&!qCleared(y.id));if(q)return{ch:c.ch,nm:q.n,rc:lvTag(q.lv)};}}}catch(e){}return null;}
{const _tm=townMenu;townMenu=function(m){QM.on=false;if(TOAST&&!m){m=TOAST;TOAST='';}_tm(m);try{document.querySelectorAll('.h22sortie small').forEach(s=>{if(s.textContent==='WORLD MAP')s.textContent='QUEST';});const nx=nextQ(),b=document.querySelector('.h22nx');if(b&&nx){const bb=b.querySelector('b'),sm=b.querySelector('small');if(bb)bb.textContent=nx.nm;if(sm)sm.textContent=nx.rc;}else if(b&&!nx)b.style.visibility='hidden';}catch(e){}};}
try{TIPS.map=['クエスト',['章を選んで、クエストをタップすると詳細が開く。<b>▼出撃▼</b>で出発。','1つのクエストで<b>戦闘が何回か続く</b>ことがある（BATTLE 1/3 など）。戦闘の合間にHPは回復しない。','<b>中ボス・大ボス</b>は章の区切り。<b>宝箱は敵が落とす</b>。クリアしたクエストは何度でも挑める。']];
 TIPS.town[1][1]='<b>出撃</b>：クエストを選んで冒険へ。<br><b>編成</b>：仲間の入れ替え・装備・星盤はここから。';}catch(e){}

try{TIPS.how=['遊び方',['<b>灯都</b>で準備 → <b>出撃</b>でクエストへ → 章の<b>大ボス</b>を倒すと次の章へ。灯都に戻るとHP全回復＆自動セーブ。','1つのクエストで戦闘が何回か続くことがある。<b>宝箱は敵が落とす</b>（中ボスは銀、大ボスは金）。','戦闘：弱点を突いて大ダメージ、ゲージ100%で<b>星臨</b>（行動を消費しない）。','Lv60からは<b>天星盤</b>、Lv99からは<b>限界突破</b>（天極の星晶）でLv120まで。']];}catch(e){}
const HOWTO='<b>遊び方</b><br>・灯都で準備→「出撃」でクエストを選ぶ。章の区切りに<b>中ボス・大ボス</b>。1つのクエストで戦闘が何回か続くこともある（敵を全滅させると自動で次の戦闘へ）。<br>・<b>宝箱は敵が落とす</b>（まれに銅、中ボスは銀、大ボスは金）。<br>・戦闘：ターンの始めに全員の技・術を選ぶ（BPを使う）。弱点の属性を突いて大ダメージ、ゲージ100%で<b>星臨</b>（行動を消費しない）。HPが0で気絶しLP-1、LPが残っていれば回復術で復活。<br>・灯都に戻るとHP・LP全回復＆自動セーブ。<b>編成</b>で装備と星盤。Lv60から<b>天星盤</b>、Lv99から<b>限界突破</b>でLv120まで。';
{const _t=title;title=function(){_t();try{const h=$('#hw');if(h)h.innerHTML=HOWTO;}catch(e){}};try{const h=$('#hw');if(h)h.innerHTML=HOWTO;}catch(e){}}
/* ---------- 開発者メニュー ---------- */

/* ver0.38：戦闘中のメニューから撤退（それまでに得た報酬は持ち帰る） */
function retreat(){if(!QR)return;if(B){B.over=true;B.heroes.forEach(h=>{G.h[h.id].hp=h.alive?h.hp:Math.ceil(h.mhp*.2);});}$('#cmd').innerHTML='';try{ovClose();}catch(e){}save();qFail('retreat');}
return{retreat};})();
