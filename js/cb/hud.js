/* ===== コマンド戦闘の操作盤（CBH。ver0.62 でロマサガRS風に作り直した正本。ver0.60 の札＋技の格子を置き換え） =====
 上：TURN・WAVE・速さ・AUTO・メニュー。その下に狙っている敵（TARGET・名前・Lv・HP・8 属性の六角＝弱点は赤︿・耐性は青﹀・未判明は ?）。
   行動中は、その代わりに「行動順」の顔の帯（味方は灯の縁・敵は赤の縁・いま動く者は大きく）。
 下：入力中＝選んでいる仲間の顔・名前・何人目か・星臨のゲージ（満ちると光り、押すと星臨）／HP・LP・BP の段／技と術の一覧（属性の六角・名前・消費 BP）
   ／戻る・AUTO通常（星臨は温存）・AUTO全力（星臨と奥義も使う）・リピート（前のターンと同じ行動）。
   行動中＝仲間 4 人の状態（顔・HP・BP・LP）。動いている仲間は灯の縁、敵に狙われた仲間は赤く点滅。 */
'use strict';
const CBH=(()=>{
let ui=null,top=null,auto=0,spd=1;const FACE={};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ELS=['斬','打','突','熱','冷','雷','陽','陰'];
const cfg=()=>{try{G.cb=G.cb||{};return G.cb;}catch(e){return{};}};
const face=u=>{const k=u.side?'f:'+u.spr:u.id;return FACE[k]||(FACE[k]=u.side?CB.picF(u):CB.pic(u.id,0,48));};
const hx=(e,cls='')=>`<i class="elh e${ELS.indexOf(e)} ${cls}"><b>${e}</b></i>`;
function open(u,t){ui=u;top=t;const c=cfg();auto=c.auto===true?1:(+c.auto||0);spd=c.spd||1;CB.setSpeed(spd);ui.onclick=click;top.onclick=click;draw();}
/* ---------- 上の帯 ---------- */
function topHtml(b,ph){const t=CB.tgt&&CB.tgt.hp>0?CB.tgt:null;
 let s=`<div class="cb-row"><span class="cb-turn"><small>TURN</small>${b.turn||1}</span><span class="cb-w">${b.waves.map((_,i)=>`<i class="${i<b.wave?'done':i===b.wave?'on':''}"></i>`).join('')}</span><span class="sp"></span>
 <button class="cb-tb${spd>1?' on':''}" data-a="spd">×${spd}</button><button class="cb-tb" data-a="snd" aria-label="音">${TDSFX.icon()}</button><button class="cb-tb" data-a="menu" aria-label="メニュー">Ⅱ</button></div>`;
 if(ph==='run'&&CB.ord&&CB.ord.length){s+=`<div class="cb-ord">${CB.ord.map(u=>`<span class="${u.side?'foe':'ally'}${CB.acting===u?' now':''}${u.hp<=0?' out':''}"><img src="${face(u)}" alt=""></span>`).join('')}</div>`;}
 else if(t){const kn=t.kn||{};s+=`<div class="cb-tgt" data-a="tgtinfo"><div class="nm"><em>TARGET</em><b>${esc(t.name)}</b><small>Lv${t.lv}</small></div><div class="bar"><i></i></div>
  <div class="els">${ELS.map(e=>kn[e]==='w'?hx(e,'wk'):kn[e]==='r'?hx(e,'rs'):kn[e]==='n'?hx(e):hx(e,'unk')).join('')}</div></div>`;}
 return s;}
/* ---------- 下の盤 ---------- */
function draw(){const b=CB.b;if(!b||!ui)return;const ph=CB.phase,sel=CB.sel,inp=ph==='input'&&!auto;
 top.innerHTML=topHtml(b,ph);
 ui.className='cb-ui'+(inp&&sel?' inp':'');
 ui.innerHTML=inp&&sel?inputHtml(b,sel):statusHtml(b,ph);
 tick();}
function inputHtml(b,u){const L=b.heroes,idx=L.indexOf(u),alive=L.filter(h=>h.hp>0),n=alive.indexOf(u)+1,aw=CBE.canAw(u),ag=Math.min(100,Math.round(u.ag));
 const row=(sk,v,ou)=>{const c=CBE.costOf(u,sk),off=c>u.bp,el=sk.el||u.basic.el,pick=u.cmd&&u.cmd.sk===sk;
  return`<button class="cb-sk${ou?' ou':''}${off?' off':''}${pick?' on':''}" data-a="sk" data-v="${v}" ${off?'disabled':''}>${hx(el)}<b>${esc(sk.n)}</b>${sk.t==='all'?'<span class="tg">全</span>':sk.t==='ally'?'<span class="tg al">味</span>':''}<span class="bp"><small>BP</small>${c}</span></button>`;};
 const rows=[row(u.basic,'b')];u.sks.forEach((sk,i)=>rows.push(row(sk,i)));if(u.awOn>0&&u.ou&&!u.ouUsed)rows.unshift(row(u.ou,'o',1));
 return`<div class="cb-head"><div class="who"><b>${esc(u.name)}</b><small>${n}/${alive.length}</small></div><div class="cb-mini">${L.map((h,i)=>mini(h,i,u)).join('')}</div>
  <button class="cb-ag${aw?' rdy':''}${u.awOn>0?' on':''}" data-a="aw" data-v="${idx}" style="--p:${ag/100}" ${aw?'':'disabled'} aria-label="星臨"><span>${u.awOn>0?'★':ag+'<small>%</small>'}</span></button></div>
 <div class="cb-st"><span class="hp"><small>HP</small><b class="hpn"></b><i class="bar"><i></i></i></span><span class="lp"><small>LP</small><b>${u.lp}</b><em>/${u.lpMax}</em></span><span class="bpx"><small>BP</small><b>${u.bp}</b><em>/${u.bpMax}</em></span></div>
 <div class="cb-list">${rows.join('')}</div>
 <div class="cb-foot"><button class="cb-fb" data-a="back" ${prevOf(b,u)?'':'disabled'}>戻る</button><button class="cb-fb au" data-a="auto1">AUTO<small>通常</small></button><button class="cb-fb au" data-a="auto2">AUTO<small>全力</small></button><button class="cb-fb" data-a="rep" ${b.last?'':'disabled'}>リピート</button></div>`;}
function mini(h,i,sel){const pk=h.cmd&&h.cmd.sk;return`<button class="cb-mc${h===sel?' sel':''}${h.hp<=0?' down':''}${pk?' done':''}${h.awOn>0?' aw':''}" data-a="card" data-v="${i}"><img src="${face(h)}" alt=""><i class="hp"><i></i></i>${pk?`<span class="pk">${hx(pk.el||h.basic.el)}</span>`:''}${CBE.canAw(h)?'<span class="agr"></span>':''}</button>`;}
function statusHtml(b,ph){return`<div class="cb-pty">${b.heroes.map((h,i)=>`<div class="cb-pc${CB.acting===h?' act':''}${CB.aim===h?' aim':''}${h.hp<=0?' down':''}${h.awOn>0?' aw':''}" data-i="${i}"><img src="${face(h)}" alt=""><b class="nm">${esc(h.name)}</b>
 <div class="hp"><b class="hpn"></b><div class="bar"><i></i></div></div><span class="sub"><em>BP</em><b class="bpn"></b></span><span class="sub"><em>LP</em><b>${h.lp}</b></span></div>`).join('')}</div>
 <div class="cb-foot run"><button class="cb-fb au${auto===1?' on':''}" data-a="auto1">AUTO<small>通常</small></button><button class="cb-fb au${auto===2?' on':''}" data-a="auto2">AUTO<small>全力</small></button></div>`;}
/* 毎コマ：HP の棒と数字（表示の HP＝dhp。当たった瞬間に減る）・狙いの HP */
function hpSet(el,u){if(!el)return;const hp=Math.max(0,Math.round(u.dhp??u.hp)),r=hp/u.mhp;const n=el.querySelector('.hpn');if(n)n.textContent=hp;const bar=el.querySelector('.bar i,.hp>i');if(bar){bar.style.width=(r*100).toFixed(1)+'%';bar.className=r<.3?'low':r<.6?'mid':'';}}
function tick(){const b=CB.b;if(!b||!ui)return;
 const sel=CB.sel;if(ui.classList.contains('inp')&&sel)hpSet(ui.querySelector('.cb-st .hp'),sel);
 ui.querySelectorAll('.cb-mc').forEach((c,i)=>hpSet(c,b.heroes[i]));
 ui.querySelectorAll('.cb-pc').forEach((c,i)=>{const h=b.heroes[i];hpSet(c,h);const bp=c.querySelector('.bpn');if(bp)bp.textContent=h.bp;});
 const t=CB.tgt,tb=top.querySelector('.cb-tgt .bar i');if(t&&tb){const r=Math.max(0,t.dhp??t.hp)/t.mhp;tb.style.width=(r*100).toFixed(1)+'%';}}
function acting(){draw();}
/* ---------- 押す ---------- */
function prevOf(b,u){const L=CBE.H(b),i=L.indexOf(u);return i>0?L[i-1]:null;}
function nextSel(){const b=CB.b,L=CBE.H(b);const n=L.find(u=>!u.cmd);CB.sel=n||null;if(!n)go();draw();}
function go(){const b=CB.b;b.last={};for(const u of b.heroes)if(u.cmd)b.last[u.id]=u.cmd.sk;CB.sel=null;CB.start();}
function snd(x){try{TDSFX.play(x);}catch(er){}}
function setAuto(m){auto=auto===m?0:m;cfg().auto=auto;const b=CB.b;if(auto&&CB.phase==='input'){for(const u of CBE.H(b))u.cmd=null;go();}draw();}
function click(e){const a=e.target.closest('[data-a]');if(!a||a.disabled)return;e.stopPropagation();const k=a.dataset.a,v=a.dataset.v,b=CB.b;if(!b)return;
 if(k==='auto1'||k==='auto2'){setAuto(k==='auto1'?1:2);snd('deploy');return;}
 if(k==='spd'){spd=spd>=3?1:spd+1;cfg().spd=spd;CB.setSpeed(spd);draw();return;}
 if(k==='snd'){TDSFX.toggle();draw();return;}
 if(k==='menu'){CB.sheet(`<h3>${esc(b.S.name)}</h3><div class="td-acts"><button class="td-btn" data-a="flee">撤退</button><button class="td-btn on" data-a="resume">続ける</button></div>`);return;}
 if(k==='tgtinfo'){const t=CB.tgt;if(t)CB.info(t);return;}
 if(CB.phase!=='input')return;
 if(k==='aw'){const u=b.heroes[+v];if(CB.awaken(u)){CB.sel=u;snd('lamp');}draw();return;}
 if(k==='card'){const u=b.heroes[+v];if(u.hp>0){CB.sel=u;u.cmd=null;snd('deploy');draw();}return;}
 if(k==='back'){const p=prevOf(b,CB.sel);if(p){p.cmd=null;CB.sel=p;snd('deploy');draw();}return;}
 if(k==='rep'){for(const u of CBE.H(b)){const sk=b.last&&b.last[u.id];const ok=sk&&(sk!==u.ou||(u.awOn>0&&!u.ouUsed))&&CBE.costOf(u,sk)<=u.bp;
   if(!u.cmd)u.cmd=ok?{sk,tg:tgFor(b,u,sk)}:CBE.autoPick(b,u);}snd('deploy');go();draw();return;}
 if(k==='sk'){const u=CB.sel;if(!u)return;const sk=v==='b'?u.basic:v==='o'?u.ou:u.sks[+v];if(!sk||CBE.costOf(u,sk)>u.bp)return;
  u.cmd={sk,tg:tgFor(b,u,sk)};snd('deploy');nextSel();}}
function tgFor(b,u,sk){return sk.t==='ally'?CBE.best(b,u,sk):sk.t==='one'||sk.basic?(CB.tgt&&CB.tgt.hp>0?CB.tgt:CBE.best(b,u,sk)):null;}
return{open,draw,tick,acting,speed:()=>spd,auto:()=>auto};})();
