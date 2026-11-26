/* ===== 戦闘の強化・弱体のアイコン（BST。ver0.65 の正本） =====
 コマンド入力中に、コマンド欄の上へ各キャラの強化（青）・弱体（赤）・状態異常（紫）を顔の横に小さなアイコンで並べる（ver0.66。頭上には出さない）。
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
let root=null,sig='',tab='h';const FACE=new Map();
function face(u){const k=u.id||u.kind||u.name;if(FACE.has(k))return FACE.get(k);let s='';try{const c=V19.icon(u);if(c)s=c.toDataURL();}catch(e){}FACE.set(k,s);return s;}
function build(){const app=$('#app');if(!app)return null;if(root&&root.parentNode===app)return root;root=document.createElement('div');root.id='bst';app.appendChild(root);
 root.addEventListener('click',e=>{const a=e.target.closest('[data-bst]');if(!a)return;e.stopPropagation();tab=a.dataset.bst;open();});return root;}
const sts=u=>(u&&u.alive&&u.sts||[]).filter(s=>s&&s.k&&(s.t==null||s.t>0));
/* ver0.66：頭上には出さない。コマンド入力中だけ、コマンド欄のすぐ上に 1 列（味方は左・敵は右。いま選んでいる味方は枠） */
function tick(){const on=scene==='battle'&&B&&!B.over&&$('#app').classList.contains('in38');const r=build();if(!r)return;
 if(!on){if(sig!=='off'){sig='off';r.innerHTML='';r.className='';}return;}
 const L=[...B.heroes,...B.enemies],cur=B.pick&&B.pick.u;
 const s2=(cur&&cur.id||'')+'|'+L.map(u=>sts(u).map(s=>s.k+s.v+(s.el||'')).join(',')).join('|');if(s2===sig)return;sig=s2;
 const g=u=>{const S=sts(u);if(!S.length&&u!==cur)return'';const f=face(u);
  return`<button class="bst-g ${u.side?'foe':'ally'}${u===cur?' on':''}" data-bst="${u.side?'e':'h'}" aria-label="${esc(u.name)}">${f?`<img src="${f}" alt="">`:''}${S.slice(0,5).map(s=>ic(s)).join('')}${S.length>5?`<em>+${S.length-5}</em>`:''}</button>`;};
 const h=B.heroes.map(g).join(''),e=B.enemies.filter(u=>u.alive).map(g).join('');
 r.innerHTML=h+(e?`<span class="sp"></span>${e}`:'');r.className=r.innerHTML?'on':'';}
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
