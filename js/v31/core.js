/* ===== ver0.31 共通：能力のインフレ・レベル上限120・限界突破・新しい能力値 =====
 1. 成長：Lv60 を超えると、Lv が 1 上がるごとに能力（HP・攻撃・防御・魔力・精神）が 1.035 倍ずつ伸びる（INF）。
    装備も同じく、装備Lv60 を超えると基礎値が 1.035 倍ずつ伸びる（GINF）。敵も同じ曲線で強くなる（v31/enemies.js）
 2. レベル上限：通常は Lv99。エンドコンテンツ専用の素材「天極の星晶」とお金で「限界突破」すると 105→110→115→120 まで上がる
 3. 経験値：Lv60 からは次のLvまでの経験値が段階的に増える（xpNeed）
 4. 新しい能力値（天星盤・終盤の装備・新しいパッシブで上がる）
    与ダメ（dmgP）・技の威力（skDmg）・会心ダメ（critDmg）・被ダメ軽減（dmgCut、最大60%）
    さらに Lv60 を超えると、技（通常攻撃以外）の威力が Lv ごとに +1.5% 上がる
 セーブに増える項目：G.h[id].cap（レベル上限）・G.h[id].board2（天星盤）・G.mats.seishou（天極の星晶）・G.qs（クエスト） */
'use strict';
const V31=(()=>{
const VER='ver0.31';
const INF=lv=>lv<=60?1:Math.pow(1.035,lv-60);
const GINF=ilv=>ilv<=60?1:Math.pow(1.035,ilv-60);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fm=n=>Math.round(n||0).toLocaleString('en-US');

/* ---------- 素材：天極の星晶（限界突破専用・エンドコンテンツでのみ入手） ---------- */
MATS.seishou={n:'天極の星晶',p:5000};
try{IC21.def('seishou',['#fff3b0','#4a8aff','#ffffff','#ff9ad8'],'f',[],{glow:'#ffe27a',ga:120,sp:2,spc:'#fff3b0',dr:(t,M)=>{
 t.poly([[12,0],[17,8],[15,20],[12,23],[9,20],[7,8]],M.e);t.poly([[12,0],[7,8],[9,20],[12,11]],M.d);t.poly([[12,0],[17,8],[15,20],[12,11]],M.f);
 t.poly([[12,3],[14,9],[12,17],[10,9]],M.a);t.poly([[12,3],[10,9],[12,12]],M.w);
 t.poly([[4,9],[7,12],[6,18],[3,15]],M.k);t.poly([[20,9],[17,12],[18,18],[21,15]],M.k);t.px(4,10,M.w);t.px(20,10,M.w);t.px(12,6,M.w);}});
 ICON.seishou=IC21.render('seishou',0);}catch(e){console.error(e);ICON.seishou=ICON.kakera;}

/* ---------- 経験値・レベル上限・限界突破 ---------- */
const xpNeed=l=>l<60?nextXP(l):Math.round(nextXP(l)*(1+(l-59)*.1));
const BASECAP=99,MAXLV=120;
const LBS=[{to:105,n:2,g:100000},{to:110,n:4,g:300000},{to:115,n:6,g:600000},{to:120,n:8,g:1000000}];
const capOf=id=>{const h=G&&G.h&&G.h[id];return Math.min(MAXLV,(h&&h.cap)||BASECAP);};
const lbStage=id=>LBS.filter(s=>s.to<=capOf(id)).length;
/* 格下の敵からの経験値：味方の平均Lvが敵より 5 以上高いと、1 Lv ごとに -6%（最低 20%）。決闘などのイベント戦は対象外 */
let XPF=1;
gainXP=function(id,x){x=Math.round(x*XPF);const s=G.h[id];s.xp+=x;let n=0;const cap=capOf(id);
 while(s.lv<cap&&s.xp>=xpNeed(s.lv)){s.xp-=xpNeed(s.lv);s.lv++;n++;}
 if(s.lv>=cap)s.xp=Math.min(s.xp,xpNeed(s.lv));return n;};
{const _rw=rewards;rewards=function(es){XPF=1;try{if(!(B&&B.opts&&B.opts.event)){const pl=G.party.reduce((a,i)=>a+G.h[i].lv,0)/Math.max(1,G.party.length),el=Math.max(...es.map(e=>e.lv||1)),gap=pl-el-5;if(gap>0)XPF=Math.max(.2,1-gap*.06);}}catch(e){XPF=1;}
 let r;try{r=_rw(es);}finally{if(r&&XPF!==1)r.xp=Math.round(r.xp*XPF);XPF=1;}return r;};}
/* 限界突破：成功なら null、できなければ理由を返す */
function lbCheck(id){const st=LBS[lbStage(id)],h=G.h[id];if(!st)return'これ以上は突破できない（Lv120）';
 if(h.lv<capOf(id))return`Lv${capOf(id)}に達すると突破できる`;if((G.mats.seishou||0)<st.n)return`${MATS.seishou.n}が足りない（${G.mats.seishou||0}/${st.n}）`;if(G.gold<st.g)return'お金が足りない';return null;}
function limitBreak(id){const why=lbCheck(id);if(why)return why;const st=LBS[lbStage(id)];G.mats.seishou-=st.n;G.gold-=st.g;G.h[id].cap=st.to;save();return null;}

/* ---------- 能力：インフレと新しい能力値 ---------- */
const XK=['dmgP','skDmg','critDmg','dmgCut'];
{const _s=stats;stats=function(id){const o=_s(id),h=G.h[id],m=INF(h.lv);
 if(m!==1)for(const k of['mhp','atk','def','mag','res'])o[k]=Math.round(o[k]*m);
 let g={},b={};try{g=gear(id);b=bonus(id);}catch(e){}
 for(const k of XK)o[k]=Math.round(((g[k]||0)+(b[k]||0))*10)/10;
 if(h.lv>60)o.skDmg=Math.round((o.skDmg+(h.lv-60)*1.5)*10)/10;
 return o;};}
/* ダメージ：与ダメ・技の威力・会心ダメ・被ダメ軽減（ほかの倍率のあとに掛ける） */
{const _c=calc;calc=function(a,t,sk){const r=_c(a,t,sk);try{let m=1;
 if(a&&a.side===0){if(a.dmgP)m*=1+a.dmgP/100;if(sk&&!sk.basic&&a.skDmg)m*=1+a.skDmg/100;if(r.crit&&a.critDmg)m*=(1.5+a.critDmg/100)/1.5;}
 if(t&&t.side===0&&t.dmgCut)m*=1-Math.min(60,t.dmgCut)/100;
 if(m!==1)r.d=Math.max(1,Math.round(r.d*m));}catch(e){console.error(e);}return r;};}

/* ---------- 表示の補助 ---------- */
/* キャラ詳細の「次のLvまで」を新しい経験値曲線に合わせ、Lv に上限を添える */
{const _ch=charHTML;charHTML=function(id,tab,ed){let s=_ch(id,tab,ed);try{const h=G.h[id],need=Math.max(0,xpNeed(h.lv)-h.xp),old=Math.max(0,nextXP(h.lv)-h.xp);
 s=s.replace(new RegExp(`(次のLvまで</span><b>)${old}(</b>)`),`$1${h.lv>=capOf(id)?'上限（限界突破で解放）':fm(need)}$2`);
 s=s.replace(/(<span><i class="gn">◆<\/i>Lv<\/span><b>)(\d+)(<\/b>)/,`$1$2<small class="cap31">/${capOf(id)}</small>$3`);}catch(e){console.error(e);}return s;};}

/* ---------- 限界突破の画面 ---------- */
let LBFROM=null;
function lbScreen(from,msg){if(from)LBFROM=from;if(scene!=='town'){show('town');try{if(H!==128)setH(128);}catch(e){}}const st0=s=>LBS[s];
 const rows=G.members.map(id=>{const h=G.h[id],s=lbStage(id),nx=st0(s),why=lbCheck(id),cap=capOf(id);
  return`<div class="lb31${why?'':' ok'}"><img src="${face(id)}"><div class="lbn"><b>${esc(HB[id].name)}</b><small>Lv${h.lv} / 上限 ${cap}</small><div class="lbs">${LBS.map((x,i)=>`<i class="${i<s?'on':''}">${i<s?'◆':'◇'}</i>`).join('')}</div></div>
   <div class="lbc">${nx?`<small>次：上限 ${nx.to}</small><span><img src="${ICON.seishou}">×${nx.n}　${fm(nx.g)}G</span>`:'<small>最大</small><span>Lv120 解放済み</span>'}</div>
   <button class="tbtn${why?'':' gold'}" data-a="lb" data-v="${id}" ${why?'disabled':''}>突破</button>${why&&nx?`<em>${esc(why)}</em>`:''}</div>`;}).join('');
 log(msg||`<b>限界突破</b>　Lv${BASECAP}の壁を越える。<b>${MATS.seishou.n}</b>は天極のクエスト（エンドコンテンツ）でしか手に入らない`);
 panel(`<div class="lbh31"><div><small>所持</small><b><img src="${ICON.seishou}">${MATS.seishou.n} ×${G.mats.seishou||0}</b></div><div><small>所持金</small><b>${fm(G.gold)} G</b></div></div>
  <div class="lbnote">上限は ${BASECAP} → ${LBS.map(x=>x.to).join(' → ')}。突破するたびに<b>天星ポイント+10</b>。上限に達している間に得た経験値は、次のLv1つ分まで持ち越せる</div>
  <div class="lbl31">${rows}</div><button class="tbtn back wide" data-a="back">戻る</button>`,
 {lb:id=>{const why=limitBreak(id);if(why){lbScreen(null,why);return;}SFX.aw();lbScreen(null,`<b>${HB[id].name}</b>のレベル上限が <b>${capOf(id)}</b> になった！`);},
  back:()=>{const f=LBFROM;LBFROM=null;if(typeof f==='function')f();else enterTown();}});}

/* ---------- 版表示・お知らせ ---------- */
const NEWS=`<div class="nt"><b>${VER}</b>　大型アップデート<br><small>・<b>クエスト制</b>：マップ探索を廃止し、章ごとのクエストに。区切りで<b>中ボス・大ボス</b>、複数の戦闘が続くクエストも。宝箱は敵が落とす。<br>・<b>レベル上限120</b>：Lv99から先は「限界突破」（素材：天極の星晶）。<br>・<b>天星盤</b>：星盤の上位版（Lv60から）。強力な技・パッシブ・新しい能力値。<br>・<b>装備枠</b>：武器・主防具・副防具・装飾品×2 に再編。新しい装備を各レアリティに追加。<br>・<b>エンドコンテンツ</b>：天極の門・星海の深淵・終焉の星域・極限の星闘。</small></div>`;
document.addEventListener('click',e=>{const t=e.target.closest('[data-h22="news"]');if(!t||scene!=='town')return;
 setTimeout(()=>{try{const o=document.querySelector('.nw22');if(o&&!o.querySelector('.n31')){const d=document.createElement('div');d.className='n31';d.innerHTML=NEWS;const h=o.querySelector('.nh');h?h.after(d):o.prepend(d);}}catch(e){}},0);},true);
{const _t=title;title=function(){_t();const v=$('#verL');if(v)v.textContent=VER;};const v=$('#verL');if(v)v.textContent=VER;}
try{document.title='アストラル・ブレイカー '+VER;}catch(e){}

return{VER,INF,GINF,xpNeed,BASECAP,MAXLV,LBS,capOf,lbStage,lbCheck,limitBreak,lbScreen,XK,esc,fm};})();
