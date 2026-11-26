/* ===== コマンド戦闘の操作盤（CBH。ver0.60 で TD の操作盤 js/td/hud.js を置き換えた正本）：上の帯・技と術のボタン・仲間の札 =====
 下の盤：選んでいる仲間の技・術（アイコン・名前・消費 BP）→ 押すと次の仲間へ。全員が決まると戦闘が進む（▶ で残りをおまかせにして始める）。
 仲間の札：顔・HP・BP・星臨のゲージ（顔の縁の金の輪。満ちると札の星が光り、押すと星臨）。決めた技は札の右上に小さく。
 敵を狙う：戦場の敵をタップ（js/cb/view.js の tap）。字は少なく：使えない技は灰紫、選んでいる仲間は金の縁、行動中は明るく。 */
'use strict';
const CBH=(()=>{
let ui=null,top=null,auto=false,spd=1;const FACE={};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ELC={'斬':'#e8e8f0','打':'#d9a066','突':'#b0e0ff','熱':'#ff7a3c','冷':'#7fd8ff','雷':'#ffe14a','陽':'#fff1a8','陰':'#b07aff'};
const cfg=()=>{try{G.cb=G.cb||{};return G.cb;}catch(e){return{};}};
const face=id=>FACE[id]||(FACE[id]=CB.pic(id,0,48));
const keyOf=sk=>sk._k||(()=>{try{return RSC.keyOf(sk);}catch(e){return'';}})();
function open(u,t){ui=u;top=t;const c=cfg();auto=!!c.auto;spd=c.spd||1;CB.setSpeed(spd);ui.onclick=click;top.onclick=click;draw();}
/* ---------- 描く ---------- */
function draw(){const b=CB.b;if(!b||!ui)return;const ph=CB.phase,sel=CB.sel;
 top.innerHTML=`<div class="cb-w">${b.waves.map((_,i)=>`<i class="${i<b.wave?'done':i===b.wave?'on':''}"></i>`).join('')}</div><span class="cb-turn" title="ターン">${b.turn||''}</span><span class="sp"></span>
 <button class="cb-tb${auto?' on':''}" data-a="auto">AUTO</button><button class="cb-tb${spd>1?' on':''}" data-a="spd">×${spd}</button><button class="cb-tb" data-a="snd" aria-label="音">${TDSFX.icon()}</button><button class="cb-tb" data-a="menu" aria-label="メニュー">Ⅱ</button>`;
 const inp=ph==='input'&&!auto;
 ui.className='cb-ui'+(inp?' inp':'');
 ui.innerHTML=`<div class="cb-cmds">${inp&&sel?cmds(sel):''}</div>
 <div class="cb-party">${b.heroes.map((u,i)=>card(u,i,ph,sel)).join('')}<button class="cb-go${inp?' on':''}" data-a="go" aria-label="戦う" ${inp?'':'disabled'}>▶</button></div>`;
 tick();}
function cmds(u){const L=[];const pick=u.cmd&&u.cmd.sk;
 const btn=(sk,v,ou)=>{const c=CBE.costOf(u,sk),off=c>u.bp,el=sk.el||u.basic.el,ic=sk.basic?`<span class="ic bs" style="--c:${ELC[el]||'#fff'}"></span>`:TDI.img(keyOf(sk),el,ou);
  return`<button class="cb-sk${ou?' ou':''}${off?' off':''}${pick===sk?' on':''}" data-a="sk" data-v="${v}" ${off?'disabled':''}><span class="ic">${ic}</span><b>${esc(sk.n)}</b>${c?`<i class="bp">${c}</i>`:''}</button>`;};
 L.push(btn(u.basic,'b'));u.sks.forEach((sk,i)=>L.push(btn(sk,i)));if(u.awOn>0&&u.ou&&!u.ouUsed)L.push(btn(u.ou,'o',1));
 return L.join('');}
function card(u,i,ph,sel){const down=u.hp<=0,pk=u.cmd&&u.cmd.sk,awR=CBE.canAw(u)&&ph==='input';
 const ic=pk?(pk.basic?`<span class="ic bs" style="--c:${ELC[u.basic.el]}"></span>`:TDI.img(keyOf(pk),pk.el||u.basic.el,!!pk.ougi)):'';
 return`<button class="cb-card${sel===u&&ph==='input'?' sel':''}${down?' down':''}${u.awOn>0?' aw':''}${CB.acting===u?' act':''}" data-a="card" data-v="${i}">
  <span class="fc" style="--p:${(u.ag/100).toFixed(2)}"><img src="${face(u.id)}" alt="${esc(u.name)}"></span>
  <span class="hp"><i></i></span><span class="nb"><b class="hpn"></b><b class="bpn"></b></span>${ic?`<span class="pk">${ic}</span>`:''}${awR?`<span class="awb" data-a="aw" data-v="${i}" aria-label="星臨"></span>`:''}</button>`;}
/* 毎コマ：HP の棒と数字（表示の HP＝dhp。当たった瞬間に減る） */
function tick(){const b=CB.b;if(!b||!ui)return;const C=ui.querySelectorAll('.cb-card');b.heroes.forEach((u,i)=>{const c=C[i];if(!c)return;const hp=Math.max(0,Math.round(u.dhp??u.hp)),r=hp/u.mhp;
  const bar=c.querySelector('.hp i');bar.style.width=(r*100).toFixed(1)+'%';bar.className=r<.3?'low':'';c.querySelector('.hpn').textContent=hp;c.querySelector('.bpn').textContent=u.bp;
  c.querySelector('.fc').style.setProperty('--p',(u.ag/100).toFixed(2));});}
function acting(u){CB.acting=u;draw();}
/* ---------- 押す ---------- */
function nextSel(){const b=CB.b,L=CBE.H(b);const n=L.find(u=>!u.cmd);CB.sel=n||null;if(!n){CB.start();}draw();}
function click(e){const a=e.target.closest('[data-a]');if(!a||a.disabled)return;e.stopPropagation();const k=a.dataset.a,v=a.dataset.v,b=CB.b;if(!b)return;const snd=x=>{try{TDSFX.play(x);}catch(er){}};
 if(k==='auto'){auto=!auto;cfg().auto=auto;if(auto&&CB.phase==='input')CB.start();draw();return;}
 if(k==='spd'){spd=spd>=2?1:2;cfg().spd=spd;CB.setSpeed(spd);draw();return;}
 if(k==='snd'){TDSFX.toggle();draw();return;}
 if(k==='menu'){CB.sheet(`<h3>${esc(b.S.name)}</h3><div class="td-acts"><button class="td-btn" data-a="flee">撤退</button><button class="td-btn on" data-a="resume">続ける</button></div>`);return;}
 if(CB.phase!=='input')return;
 if(k==='aw'){const u=b.heroes[+v];if(CB.awaken(u)){CB.sel=u;snd('lamp');}draw();return;}
 if(k==='card'){const u=b.heroes[+v];if(u.hp>0){CB.sel=u;snd('deploy');draw();}return;}
 if(k==='go'){CBE.auto(b);CB.sel=null;CB.start();draw();return;}
 if(k==='sk'){const u=CB.sel;if(!u)return;const sk=v==='b'?u.basic:v==='o'?u.ou:u.sks[+v];if(!sk||CBE.costOf(u,sk)>u.bp)return;
  const tg=sk.t==='ally'?CBE.best(b,u,sk):sk.t==='one'||sk.basic?(CB.tgt&&CB.tgt.hp>0?CB.tgt:CBE.best(b,u,sk)):null;u.cmd={sk,tg};snd('deploy');nextSel();}}
return{open,draw,tick,acting,speed:()=>spd,auto:()=>auto};})();
