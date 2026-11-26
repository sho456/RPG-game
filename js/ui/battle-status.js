/* ===== 戦闘の強化・弱体のアイコン（BST。ver0.65 の正本） =====
 戦場の各キャラの頭上に、かかっている強化（青）・弱体（赤）・状態異常（紫）を小さなアイコンで並べる。
 アイコンをタップ → 専用のタブ（味方／敵）。キャラごとに効果・値・残りターン。
 データは旧戦闘の u.sts（js/v20-battle.js の addSt：k・v・t・el）。表示だけで、戦闘の処理には触らない。 */
'use strict';
const BST=(()=>{
const N={atk:'攻',def:'防',mag:'魔',res:'精',spd:'速',crit:'会',regen:'再',poison:'毒',stun:'痺',para:'麻',blind:'暗',kaiyu:'癒',mark:'標',prot:'護',weak:'弱',shield:'壁',counter:'返',evade:'避',enrage:'怒'};
const LN={atk:'攻撃',def:'防御',mag:'魔力',res:'精神',spd:'素早さ',crit:'会心',regen:'継続回復',poison:'毒',stun:'スタン',para:'マヒ',blind:'暗闇',kaiyu:'解癒',mark:'被ダメ増加',prot:'被ダメ軽減',weak:'弱点付与',shield:'障壁',counter:'反撃態勢',evade:'回避',enrage:'激昂'};
const STAT=['atk','def','mag','res','spd','crit'],AIL=['poison','stun','para','blind'],GOOD=['regen','kaiyu','prot','shield','counter','evade'];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* 種類：bu＝強化・de＝弱体・ai＝状態異常 */
const kind=s=>AIL.includes(s.k)?'ai':STAT.includes(s.k)?(s.v>0?'bu':'de'):GOOD.includes(s.k)?'bu':(s.k==='enrage'?'bu':'de');
const glyph=s=>s.k==='weak'?(s.el||'弱'):(N[s.k]||'?');
const arrow=s=>STAT.includes(s.k)?(s.v>0?'▲':'▼'):'';
const ic=(s,big)=>`<i class="bst-i ${kind(s)}${big?' big':''}"><b>${esc(glyph(s))}</b>${arrow(s)?`<u>${arrow(s)}</u>`:''}</i>`;
let root=null,sig='',tab='h';
function build(){const st=$('#stage');if(!st)return null;if(root&&root.parentNode===st)return root;root=document.createElement('div');root.id='bst';st.appendChild(root);
 root.addEventListener('click',e=>{const a=e.target.closest('[data-bst]');if(!a)return;e.stopPropagation();tab=a.dataset.bst;open();});return root;}
const sts=u=>(u&&u.alive&&u.sts||[]).filter(s=>s&&s.k&&(s.t==null||s.t>0));
/* 毎コマ：アイコンの列を頭上に置く（中身が変わったときだけ作り直し、位置は毎コマ） */
function tick(){if(scene!=='battle'||!B||B.over){if(root)root.innerHTML='';sig='';return;}const r=build();if(!r)return;
 const L=[...B.heroes,...B.enemies],cvs=$('#cv'),k=cvs.clientWidth/W;
 const s2=L.map(u=>sts(u).map(s=>s.k+s.v+(s.el||'')).join(',')).join('|');
 if(s2!==sig){sig=s2;r.innerHTML=L.map((u,i)=>{const S=sts(u);if(!S.length)return'';const sh=S.slice(0,4);
  return`<button class="bst-row ${u.side?'foe':'ally'}" data-bst="${u.side?'e':'h'}" data-i="${i}" aria-label="強化・弱体">${sh.map(s=>ic(s)).join('')}${S.length>4?`<em>+${S.length-4}</em>`:''}</button>`;}).join('');}
 r.querySelectorAll('.bst-row').forEach(el=>{const u=L[+el.dataset.i];if(!u)return;let fx=u.x,fy=u.y,h=24;try{const f=V19.foot(u),w=ANIM.world(u),D=V19.dims(u);fx=f[0]+w[0];fy=f[1]+w[1];h=D.h;}catch(e){}
  el.style.transform=`translate(${Math.round(fx*k+cvs.offsetLeft)}px,${Math.round((fy-h)*k+cvs.offsetTop-4)}px) translate(-50%,-100%)`;});}
/* 専用のタブ：味方／敵。キャラごとの効果の一覧 */
function open(){if(!B)return;const L=tab==='e'?B.enemies.filter(u=>u.alive):B.heroes;
 const row=s=>`<li>${ic(s,1)}<span>${esc(s.k==='weak'?(s.el||'')+'が弱点に':LN[s.k]||s.k)}${STAT.includes(s.k)?` <b class="${s.v>0?'up':'dn'}">${s.v>0?'+':''}${s.v}%</b>`:''}</span><small>${s.t!=null&&s.t<50?s.t+'T':'∞'}</small></li>`;
 const body=L.map(u=>{const S=sts(u);return`<section class="${S.length?'':'none'}"><h4>${esc(u.name)}</h4>${S.length?`<ul>${S.map(row).join('')}</ul>`:''}</section>`;}).join('');
 let ov=$('#bst-ov');if(!ov){ov=document.createElement('div');ov.id='bst-ov';document.body.appendChild(ov);
  ov.addEventListener('click',e=>{const a=e.target.closest('[data-t]');if(a){tab=a.dataset.t;open();return;}if(e.target===ov||e.target.closest('[data-x]'))ov.classList.add('hide');});}
 ov.innerHTML=`<div class="bst-p"><nav><button class="${tab==='h'?'on':''}" data-t="h">味方</button><button class="${tab==='e'?'on':''}" data-t="e">敵</button><button class="x" data-x="1" aria-label="閉じる">×</button></nav><div class="bst-b">${body}</div></div>`;
 ov.classList.remove('hide');}
{const _d=draw;draw=function(){_d();try{tick();}catch(e){}};}
return{open,tick};})();
