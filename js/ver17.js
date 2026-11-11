/* ===== ver0.17 快適さ＋UI再構築 =====
 1. 画面の作り替え：編成／キャラ詳細（装備）／星盤／マップ選択／戦闘
 2. 快適さ：チュートリアル・セーブ3スロット・拾う前フィルター拡張・オートの星臨設定・テキスト速度 */
const VER='ver0.18';
const ELS10=['斬','打','突','炎','氷','雷','風','地','光','闇'];
const elOf=id=>OWNEL[id]||({valk:'炎'})[id]||null;
const elCol=id=>ELC[elOf(id)]||'#c8b0ff';
const clsOf=id=>(PROF[id]?PROF[id][1].split('／')[0]:'');
const fmt=n=>Math.round(n).toLocaleString('en-US');
const lsGet=k=>{try{return localStorage.getItem(k);}catch(e){return null;}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}};
/* 立ち絵（48×48ドットを拡大表示） */
const ARTC={};
function art(id,aw){const k=id+(aw?'_aw':'');if(ARTC[k])return ARTC[k];const c=hiImg(IMG[aw&&IMG[id+'_aw']?id+'_aw':id],48,true);return ARTC[k]=c&&c.toDataURL?c.toDataURL():'';}
/* 戦闘力：能力・星臨位階・技の数から算出する目安 */
function power(id){const s=stats(id),h=G.h[id];return Math.round(s.mhp*.6+Math.max(s.atk,s.mag)*7+Math.min(s.atk,s.mag)*1.5+(s.def+s.res)*3.5+s.spd*18+s.crit*6+s.weakDmg*3+s.awDmg*3+s.startAG*2+(h.awLv||1)*120+skillList(id).length*25);}
/* 星盤を星座として描く（解放した星が光り、線でつながる） */
function conSvg(id){const N=BOARD[id],U=G.h[id].board,P=n=>[50+7.4*Math.sqrt(3)*(n.q+n.r/2),50+7.4*1.5*n.r];let ln='',dt='';
 for(const k in N){const n=N[k],[x,y]=P(n),on=U.includes(k);dt+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${on?1.7:.8}"${on?' class="on"':''}/>`;
  if(on)for(const[dq,dr]of HEXD){const k2=(n.q+dq)+','+(n.r+dr);if(!N[k2]||k2<k||!U.includes(k2))continue;const[x2,y2]=P(N[k2]);ln+=`<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;}}
 return`<svg class="con" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">${ln}${dt}</svg>`;}
const rankH=id=>{const l=G.h[id].awLv||1;return`<div class="rk rk${l}"><b>${ROMAN[l]}</b></div>`;};
function addCmd(l,s,f,idx,cls){const c=$('#cmd'),b=document.createElement('button');b.className='c '+(cls||'');b.innerHTML=l+(s?`<small>${s}</small>`:'');b.onclick=()=>{SFX.sel();f();};c.insertBefore(b,c.children[idx]||null);return b;}

/* ---------- 設定の初期値 ---------- */
const AWN={save:'温存',boss:'ボス戦のみ',brk:'ブレイク中',any:'いつでも'};
const TXS=[['おそい',46],['ふつう',28],['はやい',12],['一瞬',0]];
const FLN=['しない','コモン','アンコモン以下','レア以下'];
{const _mg=migrate;migrate=function(g){const r=_mg(g),s=G.set;
 if(!s.flt)s.flt={rar:s.autoSell?0:-1,mode:'sell',keepUp:true};s.autoSell=false;
 if(!s.autoAw)s.autoAw='save';if(s.txt==null)s.txt=1;if(s.tut==null)s.tut=true;if(s.tap1==null)s.tap1=false;G.tut=G.tut||{};return r;};}

/* ---------- 画面切替の共通処理 ---------- */
let WMS={on:false,tab:0,sel:null,cur:null,bgs:{}};
{const _sh=show;show=function(m){_sh(m);WMS.on=false;$('#app').dataset.sc=m;const b=$('#bbar');if(b)b.style.display=m==='battle'?'grid':'none';$('#cmd').classList.remove('bcmd');};}
{const b=document.createElement('div');b.id='bbar';b.style.display='none';$('#app').insertBefore(b,$('#ov'));
 b.addEventListener('click',e=>{const t=e.target.closest('[data-b]');if(!t||t.disabled||!B||B.over)return;const k=t.dataset.b;SFX.sel();
  if(k==='rep'){if(B.pick)B.pick.rep();return;}
  if(auto&&AM===k)auto=false;else{auto=true;AM=k;}bbar(true);if(auto&&B.res)B.res();else refresh();});
 const c=document.createElement('button');c.className='tb';c.id='cfgB';c.textContent='≡';c.onclick=()=>{SFX.sel();cfgOpen();};$('#top').appendChild(c);}

/* ==================== 戦闘画面 ==================== */
/* 味方は右側に縦一列。HP・星臨ゲージは各キャラの横に、行動中のキャラは下の大きなパネルに表示 */
Object.assign(HPOS,{1:[[112,46]],2:[[114,24],[108,68]],3:[[114,8],[108,44],[114,80]],4:[[114,1],[108,31],[114,61],[108,91]]});
let AM='n';const LASTA={};
const awPolicy=()=>{const p=G.set.autoAw||'save';return p==='any'||(p==='boss'&&!!(B.opts.boss||B.opts.trial))||(p==='brk'&&aliveE().some(e=>e.broken));};
/* 通常AUTOは設定どおりに星臨を温存、全力AUTOは星臨・共鳴技もすぐ使う */
{const _ap=autoPick;autoPick=function(u){if(auto&&AM==='n'&&!u.aw&&u.ag>=100&&!awPolicy()){const ag=u.ag;u.ag=99;try{return _ap(u);}finally{u.ag=ag;}}return _ap(u);};}
const skDis=(u,s)=>{const lock=s.req==='charged'?!u.charged:s.req==='lowhp'?u.hp>u.mhp*.25:s.req==='stk3'?(u.stk||0)<3:s.req&&!B.awUsed.has(s.req);
 return!!((s.sp||0)>u.sp||lock||(s.k==='zen'&&B.zenUsed)||(s.revive&&!B.heroes.some(h=>!h.alive)));};
function repOK(u){const L=LASTA[u.id];if(!L)return null;let s=L.sk;if(s.basic)s=ATK(u);else if(s.k==='guard'){}else{if(s.k==='item'||s.k==='reso'||s.t==='ally')return null;if(!(u.aw?awCmds(u):u.skills).some(k=>SK[k]===s)||skDis(u,s))return null;}return s;}
function bbar(force){const b=$('#bbar');if(!b||!G)return;const p=B&&B.pick,l=p&&repOK(p.u),sg=[l?l.n:'',auto,AM,G.set.autoAw].join();if(!force&&b._s===sg)return;b._s=sg;
 b.innerHTML=`<button data-b="rep" ${l?'':'disabled'}>リピート<small>${l?l.n:'前回と同じ行動'}</small></button><button data-b="n" class="${auto&&AM==='n'?'on':''}">通常AUTO<small>星臨：${AWN[G.set.autoAw]}</small></button><button data-b="f" class="${auto&&AM==='f'?'on':''}">全力AUTO<small>星臨・共鳴も使う</small></button>`;}
const skBadge=s=>{const heal=['heal','healAll','revive','reviveAll','item'].includes(s.k);const el=s.el||(heal?'癒':['phys','mag','rhythm'].includes(s.k)?'無':'補');return[el,ELC[el]||(heal?'#7dffa8':el==='無'?'#d8d8e8':'#9fb4ff')];};
chooseRoot=function(u){
 if(u.id==='valk'&&u.aw)return(async()=>{log('竜血が暴れる――<b>ヴァルクは止まらない！</b>');await wait(450);return autoPick(u);})();
 return new Promise(res0=>{let tab='sk',sel=-1,sub=null,lock=false,R=[];
  const res=v=>{B.res=null;B.pick=null;bbar();res0(v);};
  const fin=(sk,t)=>{LASTA[u.id]={sk};res(t?{sk,t}:{sk});};
  B.res=()=>res(autoPick(u));
  const use=sk=>{if(sk.k==='reso'||sk.t==='all'||sk.t==='self')return fin(sk);
   if(sk.t==='one'){if(!B.tgt||!B.tgt.alive)B.tgt=aliveE()[0];return fin(sk,B.tgt);}
   const pool=sk.revive?B.heroes.filter(h=>!h.alive):aliveH();
   sub={t:`<b>${sk.n||ITEMS[sk.id].n}</b>　誰に使う？`,rows:pool.map(t=>({el:'味',ec:elCol(t.id),n:t.name,d:t.alive?`HP ${t.hp}/${t.mhp}`:'戦闘不能',now:1,f:()=>fin(sk,t)}))};draw();};
  const rows=()=>{if(sub)return[...sub.rows,{n:'もどる',cls:'back',now:1,f:()=>{sub=null;draw();}}];const o=[];
   if(tab==='sk'){if(canReso())o.push({el:'共',ec:'#ff9ad6',n:`共鳴技「${resoName()}」`,d:'二人の星臨を重ねる大技（1戦闘に1回）',cls:'reso',f:()=>fin({k:'reso'})});
    const a=ATK(u),[ae,ac]=skBadge(a);o.push({el:ae,ec:ac,n:a.n==='攻撃'?'通常攻撃':a.n,d:'SPを使わない基本の攻撃',cost:'SP 0',f:()=>use(a)});
    (u.aw?awCmds(u):u.skills).forEach(k=>{const s=SK[k],[e,c]=skBadge(s);o.push({el:e,ec:c,n:s.n,d:s.d||'',cost:s.sp?'SP '+s.sp:s.gauge?'ゲージ '+s.gauge:'―',ng:(s.sp||0)>u.sp,dis:skDis(u,s),f:()=>use(s)});});}
   if(tab==='it'){const I=G.items,dead=B.heroes.some(h=>!h.alive);Object.keys(ITEMS).filter(k=>(I[k]||0)>0||k==='potion').forEach(k=>{const rv=k==='feather'||k==='tail';
     o.push({el:'道',ec:'#7dffa8',n:ITEMS[k].n,d:ITEMS[k].d,cost:'×'+(I[k]||0),ng:!I[k],dis:!I[k]||(rv&&!dead),now:1,f:()=>use({k:'item',id:k,t:'ally',revive:rv})});});}
   if(tab==='op'){const rs=G.members.filter(id=>!B.heroes.some(h=>h.id===id)&&G.h[id].hp!==0),nf=!!B.opts.boss||!!B.opts.event||!!B.opts.trial;
    o.push({el:'守',ec:'#9fd8ff',n:'防御',d:'次の手番まで被ダメージ半減',f:()=>fin(GUARD)});
    o.push({el:'替',ec:'#c8b0ff',n:'交代',d:rs.length?'控えの仲間と入れ替わる（行動を消費しない）':'控えがいない',dis:!rs.length||u.swapped||u.aw,now:1,f:()=>{sub={t:'<b>交代</b>　誰と入れ替わる？',rows:rs.map(id=>({el:elOf(id)||'無',ec:elCol(id),n:HB[id].name,d:`Lv${G.h[id].lv}　${clsOf(id)}`,now:1,f:()=>res({swap:id})}))};draw();}});
    if(u.aw&&u.id==='rio'&&!canReso())o.push({el:'解',ec:'#ffe27a',n:'星臨解除',d:'任意で星臨を解く',f:()=>{endAw(u);sel=-1;draw();}});
    o.push({el:'逃',ec:'#aab0d8',n:'逃げる',d:nf?'この戦いからは逃げられない':'素早さが高いほど成功しやすい',dis:nf,f:()=>res({flee:1})});}
   return o;};
  const draw=()=>{const c=$('#cmd');c.className='bcmd';sel=-1;if(lock){c.innerHTML='<div class="bwait">…</div>';return;}R=rows();
   c.innerHTML=(sub?`<div class="bsub">${sub.t}</div>`:`<div class="btabs">${[['sk',u.aw?'星臨技':'技'],['it','道具'],['op','作戦']].map(([k,l])=>`<button class="${tab===k?'on':''}" data-t="${k}">${l}</button>`).join('')}</div>`)+
    `<div class="blist">${R.map((r,i)=>`<button class="sk ${r.cls||''}" data-i="${i}" ${r.dis?'disabled':''}>${r.el?`<i class="el" style="background:${r.ec}">${r.el}</i>`:''}<span class="nm">${r.n}${r.d?`<small>${r.d}</small>`:''}</span>${r.cost?`<span class="cost${r.ng?' ng':''}">${r.cost}</span>`:''}</button>`).join('')}</div>`;
   c.scrollTop=0;bbar();};
  const head=()=>log(`<b>${u.name}</b>の番${u.aw?`（${AW[u.id].name}：${awTag(u).trim()}）`:''}　<small>技を選ぶ／敵をタップで狙いを変える</small>`);
  B.pick={u,tab:k=>{tab=k;sub=null;SFX.sel();draw();},
   row:i=>{const r=R[i];if(!r||r.dis)return;SFX.sel();if(r.now||G.set.tap1||sel===i)return r.f();sel=i;[...$('#cmd').querySelectorAll('.sk')].forEach((b,j)=>b.classList.toggle('sel',j===i));
    log(`<b>${r.n}</b>　${r.d||''}<br><small style="color:#ffe27a">▶ もう一度タップで決定${B.tgt&&aliveE().length>1?'（狙い：'+B.tgt.name+'）':''}</small>`);},
   rep:()=>{const s=repOK(u);if(s&&!lock)use(s);},retarget:()=>{if(sel>=0&&R[sel])log(`<b>${R[sel].n}</b>　${R[sel].d||''}<br><small style="color:#ffe27a">▶ もう一度タップで決定（狙い：${B.tgt.name}）</small>`);},
   aw:async()=>{if(lock||!(u.ag>=100&&!u.aw&&B.heroes.filter(h=>h.aw).length<2))return;lock=true;sub=null;draw();await awaken(u);lock=false;tab='sk';draw();tip(canReso()?'reso':'awake2');}};
  head();draw();refresh();
  if(!tip('battle')&&u.ag>=100&&!u.aw)tip('awake');});};
$('#cmd').addEventListener('click',e=>{const c=$('#cmd');if(!c.classList.contains('bcmd')||!B||!B.pick)return;const tb=e.target.closest('[data-t]'),rw=e.target.closest('[data-i]');if(tb)B.pick.tab(tb.dataset.t);else if(rw&&!rw.disabled)B.pick.row(+rw.dataset.i);});
$('#party').addEventListener('click',e=>{if(e.target.closest('#awB')&&B&&B.pick){au();B.pick.aw();}});
/* 敵をタップして狙いを変える */
cv.addEventListener('pointerdown',ev=>{if(scene!=='battle'||!B||B.over)return;const r=cv.getBoundingClientRect(),x=(ev.clientX-r.left)/SC,y=(ev.clientY-r.top)/SC;let best=null,bd=1e9;
 aliveE().forEach(e=>{const s=16*e.sc,d=Math.hypot(e.x+s/2-x,e.y+s/2-y);if(d<s*.75&&d<bd){bd=d;best=e;}});
 if(best&&best!==B.tgt){B.tgt=best;SFX.sel();refresh();if(B.pick)B.pick.retarget();}});
{const _du=drawUnit;drawUnit=function(u){_du(u);if(B&&B.tgt===u&&u.alive&&u.side===1&&aliveE().length>1){const s=16*u.sc,x=u.x+Math.round(u.ox)-2,y=u.y-2,w=s+4,p=(tick>>4)%2,L=5;ctx.fillStyle='#ffd65a';
  for(const[cx,cy,dx,dy]of[[x-p,y-p,1,1],[x+w+p,y-p,-1,1],[x-p,y+w+p,1,-1],[x+w+p,y+w+p,-1,-1]]){ctx.fillRect(dx>0?cx:cx-L,cy-(dy>0?0:1),L,1);ctx.fillRect(cx-(dx>0?0:1),dy>0?cy:cy-L,1,L);}}};}
refresh=function(){if(!B||scene!=='battle')return;if(!B.tgt||!B.tgt.alive||!B.enemies.includes(B.tgt))B.tgt=aliveE()[0]||null;const L=$('#labels');
 [...L.children].forEach(el=>{if(el._e&&(!B.enemies.includes(el._e)||!el._e.alive))el.remove();if(el._h&&!B.heroes.includes(el._h))el.remove();});
 /* 敵：足元に名前・HP・シールド・判明した弱点 */
 aliveE().forEach(e=>{let el=e._el;if(!el||!el.isConnected){el=document.createElement('div');el.className='lab';el.innerHTML='<div class="n"></div><div class="hp"><b></b><i></i></div><div class="cs"></div>';el._e=e;e._el=el;L.appendChild(el);}
  const s=16*e.sc;el.style.left=Math.max(0,Math.min(W*SC-96,(e.x+s/2)*SC-47))+'px';el.style.top=Math.min(H*SC-38,(e.y+s)*SC-3)+'px';el.classList.toggle('tgt',B.tgt===e&&aliveE().length>1);
  el.querySelector('.n').innerHTML=`${e.name} <small>Lv${e.lv}</small>`;const pc=e.hp/e.mhp*100;el.querySelector('.hp i').style.width=pc+'%';el.querySelector('.hp b').style.width=pc+'%';const unk=e.weak.length-e.known.size;
  el.querySelector('.cs').innerHTML=(e.broken?'':`<span class="ch sh">◆${e.brk}</span>`)+[...e.known].map(k=>`<span class="ch el" style="background:${ELC[k]};border-color:${ELC[k]}">${k}</span>`).join('')+'<span class="ch">?</span>'.repeat(unk)+tagH(e);});
 /* 狙っている敵の弱点一覧 */
 let tp=L.querySelector('.tgp');if(!tp){tp=document.createElement('div');tp.className='tgp';L.appendChild(tp);}const t=B.tgt;tp.style.display=t?'':'none';
 if(t){const unk=t.weak.length-t.known.size;tp.innerHTML=`<div class="tn"><em>TARGET</em><b>${t.name}</b>${t.broken?'<span class="tg bk">BREAK</span>':`<span class="sd">◆${t.brk}</span>`}</div><div class="els">${ELS10.map(e=>`<i${t.known.has(e)?` class="w" style="background:${ELC[e]}"`:''}>${e}</i>`).join('')}${unk?`<u>?×${unk}</u>`:''}</div>`;}
 /* 味方：キャラの横にHP・SP・星臨ゲージ */
 B.heroes.forEach(h=>{let el=h._pl;if(!el||!el.isConnected){el=document.createElement('div');el.className='hpl';el.innerHTML='<b class="hv"></b><div class="hb"><u></u><i></i></div><div class="ab"><i></i></div><div class="hs"><span></span><em></em></div>';el._h=h;h._pl=el;L.appendChild(el);}
  const pc=Math.max(0,h.hp/h.mhp*100);el.style.left=(h.x+33)*SC+'px';el.style.top=(h.y+6)*SC+'px';el.className='hpl'+(B.cur===h?' cur':'')+(h.alive?'':' down')+(pc<30&&h.alive?' low':'')+(h.aw?' awk':'');
  el.querySelector('.hv').textContent=h.alive?h.hp:'戦闘不能';el.querySelector('.hb i').style.width=pc+'%';el.querySelector('.hb u').style.width=pc+'%';
  const ab=el.querySelector('.ab');ab.querySelector('i').style.width=Math.min(100,h.ag)+'%';ab.classList.toggle('full',h.ag>=100&&!h.aw);
  el.querySelector('.hs span').textContent='SP'+h.sp;el.querySelector('.hs em').textContent=h.aw?'星臨':h.ag>=100?'星臨OK':h.taunt>0?'挑発':h.guard?'防御':'';});
 /* 行動中のキャラ */
 const P=$('#party'),a=B.cur&&B.cur.side===0?B.cur:(B.lastH&&B.heroes.includes(B.lastH)?B.lastH:B.heroes[0]);B.lastH=a;
 const my=B.cur===a,rdy=my&&!!B.pick&&a.ag>=100&&!a.aw&&B.heroes.filter(h=>h.aw).length<2,low=a.hp<a.mhp*.3;
 const ht=`<div class="ap1"><div class="apl"><div class="apn"><b>${a.name}</b><small>Lv${G.h[a.id].lv}　${clsOf(a.id)}</small></div><div class="tgs">${tagH(a)}</div>
  <div class="apg${a.ag>=100&&!a.aw?' full':''}${a.aw?' on':''}"><em>${a.aw?AW[a.id].name:'ASTRAL GAUGE'}</em><div class="g"><i style="width:${Math.min(100,a.ag)}%"></i></div><span>${a.aw?(GAUGE.includes(a.id)?Math.round(a.ag):'残'+Math.max(0,awN(a)-a.awT)):Math.floor(a.ag)+'%'}</span></div></div>
  <button id="awB" class="${rdy?'rdy':''}${a.aw?' on':''}" ${rdy?'':'disabled'}>${a.aw?'星臨中':'星臨'}<small>${a.aw?'':rdy?'行動を消費しない':'ゲージ100%で'}</small></button><img class="apf" src="${art(a.id,a.aw)}"></div>
  <div class="ap2"><div class="bx hp${low?' low':''}"><em>HP</em><b>${a.hp}</b><small>/${a.mhp}</small></div><div class="bx sp"><em>SP</em><b>${a.sp}</b><small>/100</small></div><div class="bx tn"><em>TURN</em><b>${B.turns}</b></div></div>`;
 P.className='act'+(my?'':' off')+(a.aw?' awk':'');if(P._h!==ht||!P.querySelector('.ap1')){P._h=ht;P.innerHTML=ht;}
 /* 行動順 */
 const o=$('#order');o.innerHTML='';preview().slice(0,7).forEach((u,i)=>{const d=document.createElement('div');d.className='o'+(u.side?' e':'')+(u.aw?' aw':'');const c=document.createElement('canvas');c.width=c.height=18;
  const b=bbox(u.spr);c.getContext('2d').drawImage(IMG[sprKey(u)],b.x,b.y,b.w,b.h,(18-b.w)>>1,(18-b.h)>>1,b.w,b.h);d.appendChild(c);
  const hb=document.createElement('i');hb.className='ob';hb.style.width=`calc(${Math.max(0,u.hp/u.mhp*100)}% - 4px)`;d.appendChild(hb);
  const sf=u.side&&/[ABC]$/.test(u.name)?u.name.slice(-1):'';if(sf){const tx=document.createElement('b');tx.textContent=sf;d.appendChild(tx);}if(!i){const n=document.createElement('em');n.textContent='NEXT';d.appendChild(n);}o.appendChild(d);});
 /* 入力待ち以外のときのコマンド欄 */
 const c=$('#cmd');if(!B.pick&&!B.over&&(c.classList.contains('bcmd')||!c.children.length||c.querySelector('.wait'))){const k=auto?'a'+AM:'w';if(c.dataset.w!==k||!c.querySelector('.bwait')){c.className='bcmd';c.dataset.w=k;c.innerHTML=`<div class="bwait${auto?' au':''}">${auto?`<b>${AM==='f'?'全力AUTO':'通常AUTO'}</b> で戦闘中…<small>下のボタンをもう一度押すと手動に戻る</small>`:'…'}</div>`;}}
 bbar();};

/* ==================== 編成画面 ==================== */
let PSEL=null,CTAB='st',BFROM='town';
function partyScreen(m){const P=G.party,bench=G.members.filter(id=>!P.includes(id)),tot=P.reduce((a,id)=>a+power(id),0),sel=PSEL&&G.members.includes(PSEL)?PSEL:(PSEL=null);
 log(m||(sel?`<b>${HB[sel].name}</b>を選択中　入れ替えたい相手をタップ／もう一度タップで詳細`:'<b>編成</b>　カードをタップで選ぶ。前衛は4人まで、左から順に並ぶ<br><small>控えにも経験値が100%入る</small>'));
 const eqs=id=>SLOTS6.map(sl=>{const it=G.h[id].eq[sl]&&findItem(G.h[id].eq[sl]);return it?`<img class="r${it.rar}" src="${itemIcon(it)}">`:'<i></i>';}).join('');
 const card=(id,i)=>{const h=G.h[id],pl=ptsLeft(id);return`<div class="pcd${sel===id?' sel':''}" data-a="c" data-v="${id}" style="--ec:${elCol(id)}">${rankH(id)}<div class="pno">${i+1}</div>
  <div class="part">${conSvg(id)}<img src="${art(id)}"></div><div class="pnm"><i class="elc">${elOf(id)||'無'}</i>${HB[id].name}</div><div class="plv">Lv${h.lv}　${clsOf(id)}</div>
  <div class="ppw"><small>戦闘力</small><b>${fmt(power(id))}</b></div><div class="peq">${eqs(id)}</div>
  <div class="pbd${pl>0?' rdy':''}" data-a="bd" data-v="${id}"><b>✦</b><small>${pl>0?'星盤 残'+pl:'星盤'}</small></div></div>`;};
 const rs=[];for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const k=[P[i],P[j]].sort().join(',');if(RESO[k])rs.push(`<span class="chp lg">${HB[P[i]].name}×${HB[P[j]].name}「${RESO[k]}」</span>`);}
 panel(`<div class="pshd"><div class="pst"><b>✦ パーティ編成</b><small>${chapter()}　仲間 ${G.members.length}人</small></div><div class="psp"><small>パーティ戦闘力</small><b>${fmt(tot)}</b></div></div>
 <div class="pcards">${P.map(card).join('')}${Array.from({length:4-P.length},()=>`<div class="pcd emp" data-a="e"><b>＋</b><small>空き</small></div>`).join('')}</div>
 ${sel?`<div class="pact"><button class="tbtn gold" data-a="det">詳細・装備</button><button class="tbtn" data-a="bd" data-v="${sel}">星盤</button><button class="tbtn" data-a="rm" ${P.includes(sel)&&P.length>1?'':'disabled'}>控えへ</button><button class="tbtn back" data-a="x">選択解除</button></div>`:''}
 <div class="prs"><em>共鳴技</em>${rs.join('')||'<span class="chp">この編成に固有の共鳴技はない（2人が同時に星臨すると発動）</span>'}</div>
 <div class="ttl2">控え ${bench.length}人</div><div class="pbench">${bench.map(id=>`<div class="pbt${sel===id?' sel':''}" data-a="c" data-v="${id}" style="--ec:${elCol(id)}"><img src="${art(id)}"><b>${HB[id].name}</b><small>Lv${G.h[id].lv}　${fmt(power(id))}</small></div>`).join('')||'<div class="emp" style="grid-column:1/-1">控えの仲間はいない</div>'}</div>
 <div class="tbar2"><button class="tbtn" data-a="inv">持ち物 <small>${G.inv.length}個</small></button><button class="tbtn back" data-a="back">戻る</button></div>`,
 {c:id=>{if(!PSEL){PSEL=id;return partyScreen();}if(PSEL===id){PSEL=null;return equipMenu(id);}
   const a=PSEL,ia=P.indexOf(a),ib=P.indexOf(id);PSEL=null;if(ia>=0&&ib>=0){P[ia]=id;P[ib]=a;}else if(ia>=0)P[ia]=id;else if(ib>=0)P[ib]=a;else{PSEL=id;return partyScreen();}
   save();partyScreen(`<b>${HB[a].name}</b>と<b>${HB[id].name}</b>を入れ替えた`);},
  e:()=>{if(PSEL&&!P.includes(PSEL)){const a=PSEL;PSEL=null;P.push(a);save();partyScreen(`<b>${HB[a].name}</b>を前衛に加えた`);}else partyScreen('空き枠：下の<b>控え</b>から仲間を選んで、もう一度ここをタップ');},
  det:()=>{const a=PSEL;PSEL=null;equipMenu(a);},bd:id=>{PSEL=null;BFROM='party';BS.sel=null;openBoard(id);},
  rm:()=>{const a=PSEL;PSEL=null;G.party=P.filter(x=>x!==a);save();partyScreen(`<b>${HB[a].name}</b>を控えに下げた`);},x:()=>{PSEL=null;partyScreen();},inv:()=>invMenu(),back:()=>{PSEL=null;townMenu();}});
 tip('party');}
formation=function(){partyScreen();};

/* ==================== キャラ詳細（装備・能力・技・星盤） ==================== */
function charHTML(id,tab,ed){const s=stats(id),h=G.h[id],b=HB[id],A2=AW[id],lv=h.awLv||1,hp=h.hp??s.mhp;
 const slot=sl=>{const it=h.eq[sl]&&findItem(h.eq[sl]);return`<div class="cslot ${it?'r'+it.rar:'emp'}" data-a="pick" data-v="${sl}">${it?`<img src="${itemIcon(it)}">${it.plus?`<b>+${it.plus}</b>`:''}`:'<i>＋</i>'}<small>${SLOTN[sl]}</small></div>`;};
 const row=(k,v,g)=>`<div class="sr"><span>${g?`<i class="g${g}">${g}</i>`:'<i class="gn">◆</i>'}${k}</span><b>${v}</b></div>`;let body='';
 if(tab==='st')body=`<div class="cst"><div class="cl"><div class="cpw"><small>戦闘力</small><b>${fmt(power(id))}</b></div>
   <div class="cbx">${row('Lv',h.lv)}${row('次のLvまで',nextXP(h.lv)-h.xp)}${row('星臨位階','<span style="color:#ffe27a">'+'★'.repeat(lv)+'☆'.repeat(3-lv)+'</span>')}</div>
   <div class="cbx">${row('HP',hp+' / '+s.mhp)}${row('開始時AG',s.startAG)}${row('攻撃時SP','+'+(10+s.spGain))}</div></div>
  <div class="cr cbx">${row('最大HP',s.mhp,b.g.mhp)}${row('攻撃',s.atk,b.g.atk)}${row('防御',s.def,b.g.def)}${row('魔力',s.mag,b.g.mag)}${row('精神',s.res,b.g.res)}${row('素早さ',+s.spd.toFixed(1),b.g.spd)}${row('会心率',(6+s.crit)+'%')}${row('弱点ダメ','+'+s.weakDmg+'%')}${row('星臨中与ダメ','+'+s.awDmg+'%')}${row('ドロップ率','+'+s.drop+'%')}</div></div>
  <div class="cnote">S〜D は成長のしやすさ${s.atkEl?'　通常攻撃：'+s.atkEl+'属性':''}</div>`;
 if(tab==='eq')body=`<div class="slots">${SLOTS6.map(sl=>{const it=h.eq[sl]&&findItem(h.eq[sl]);return`<div class="slot ${it?'r'+it.rar:''}" data-a="pick" data-v="${sl}"><div class="sln">${SLOTN[sl]}</div>${it?`<img class="iic" src="${itemIcon(it)}"><div class="sit">${iname(it)}<br><small>${mainTxt(it)}</small></div>`:'<div class="sit emp">― なし ―</div>'}</div>`;}).join('')}</div>`;
 if(tab==='sk')body=`<div class="sh2">星臨「${A2.name}」<small>（${A2.type}・位階${ROMAN[lv]}）</small></div><div class="stx">${AWD[id]||''}<br>${[...A2.cmds,...(lv>=3?['goku'+id]:[])].map(k=>`<b>${SK[k].n}</b>：${SK[k].d||''}`).join('<br>')}</div>
  <div class="sh2">技</div><div class="stx">${skillList(id).map(k=>`<b>${SK[k].n}</b> <small>SP${SK[k].sp||0}</small>：${SK[k].d||''}`).join('<br>')}</div>`;
 if(tab==='bd')body=`<div class="sh2">星盤「${BDEF[id].star}」</div><div class="stx">解放した星 ${h.board.length-1}／${Object.keys(BOARD[id]).length-1}　残りポイント <b>${ptsLeft(id)}</b></div>
  <div class="sh2">ジョブ</div><div class="stx">${h.job?JOBS[h.job].n+' Lv'+h.jobs[h.job].lv:'なし'}<br>パッシブ：${learned(id).map(p=>{const[j,i]=p.split(':');return JOBS[j].ps[i][2];}).join('・')||'なし'}</div>
  ${PROF[id]?`<div class="sh2">人物</div><div class="stx">${PROF[id][0]}　${PROF[id][1]}<br>${PROF[id][2]}</div>`:''}`;
 return`<div class="chd" style="--ec:${elCol(id)}">${rankH(id)}<div class="chn"><small>［${A2.name}］${G.party.includes(id)?'前衛':'控え'}</small><b>${b.name}</b></div><div class="chc"><i class="elc">${elOf(id)||'無'}</i>${clsOf(id)}</div>${ed?'':'<button class="sx" data-a="close">✕</button>'}</div>
 <div class="cart" style="--ec:${elCol(id)}">${conSvg(id)}<div class="ceq l">${SLOTS6.slice(0,3).map(slot).join('')}</div><div class="ceq r">${SLOTS6.slice(3).map(slot).join('')}</div>
  <div class="cped"></div><img class="cspr" src="${art(id)}"><button class="cnav l" data-a="prev">◀</button><button class="cnav r" data-a="next">▶</button></div>
 <div class="ctabs">${[['st','能力値'],['eq','装備'],['sk','技・星臨'],['bd','星盤・ジョブ']].map(([k,l])=>`<button class="${tab===k?'on':''}" data-a="tab" data-v="${k}">${l}</button>`).join('')}</div><div class="cbody">${body}</div>`;}
equipMenu=function(id,m){if(!G.members.includes(id))id=G.party[0];const ids=G.members,i=ids.indexOf(id),n=bondReadyN();log((m||`<b>${HB[id].name}</b>　装備の枠をタップで着替え`)+goldTxt());
 panel(charHTML(id,CTAB,true)+`<div class="cbtn"><button class="tbtn gold" data-a="best">最強装備</button><button class="tbtn" data-a="inv">持ち物<small>${G.inv.length}個</small></button><button class="tbtn${ptsLeft(id)>0?' gold':''}" data-a="bd">星盤<small>残${ptsLeft(id)}</small></button><button class="tbtn" data-a="job">ジョブ</button>
  <button class="tbtn" data-a="tr">星臨の試練<small>位階${ROMAN[G.h[id].awLv||1]}</small></button><button class="tbtn${n?' gold':''}" data-a="bond">絆<small>${n?'新しい話 '+n:'語らい'}</small></button><button class="tbtn back" data-a="back" style="grid-column:span 2">戻る</button></div>`,
 {tab:k=>{CTAB=k;equipMenu(id);},pick:sl=>pickEq(id,sl),prev:()=>equipMenu(ids[(i-1+ids.length)%ids.length]),next:()=>equipMenu(ids[(i+1)%ids.length]),
  best:()=>{bestEquip(id);SFX.aw();save();equipMenu(id,'おすすめの装備にした');},inv:()=>invMenu(),bd:()=>{BFROM='party';BS.sel=null;openBoard(id);},job:()=>{BFROM='party';openBoard(id);jobMenu(id);},tr:()=>trialMenu(),bond:()=>bondMenu(),back:()=>partyScreen()});};
/* 探索中のステータス（同じ画面を読み取り専用で開く） */
let SACT={},SHP=null;
function ovOpen(html,acts){const sh=$('#sheet');if(sh.style.display!=='flex'&&scene==='field'&&F){SHP=F.pause;F.pause=true;}SACT=acts||{};sh.innerHTML=`<div class="swin v17">${html}</div>`;sh.style.display='flex';}
function ovClose(){$('#sheet').style.display='none';if(scene==='field'&&F&&SHP!==null){F.pause=SHP;}SHP=null;}
$('#sheet').addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t||t.disabled)return;const f=SACT[t.dataset.a];if(f){SFX.sel();f(t.dataset.v);}});
openSheet=function(id,tab){if(tab)CTAB=tab;if(!G.members.includes(id))id=G.party[0];const ids=G.members,i=ids.indexOf(id);
 ovOpen(charHTML(id,CTAB,false)+'<button class="tbtn back wide" data-a="close">閉じる</button>',{tab:k=>{CTAB=k;openSheet(id);},prev:()=>openSheet(ids[(i-1+ids.length)%ids.length]),next:()=>openSheet(ids[(i+1)%ids.length]),close:ovClose});};

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
  c.fillStyle=on?'#10142e':av?nc:'#4a5288';c.font=`bold ${Math.round(s*.42)}px -apple-system,"Hiragino Sans",sans-serif`;c.fillText(lab,x,y+1);}
 c.textAlign='left';c.textBaseline='alphabetic';};
const NTN={core:'星片',stat:'能力',skill:'技',aw:'星臨強化',fork:'分岐'};
boardMenu=function(m){const id=BS.id,n=BS.sel&&BOARD[id][BS.sel],U=G.h[id].board,pl=ptsLeft(id),tot=Object.keys(BOARD[id]).length-1,can=n&&canUnlock(id,n.k)&&n.cost<=pl;
 $('#labels').innerHTML=`<div class="bdh" style="--ec:${elCol(id)}"><img src="${art(id)}"><div class="bdn"><small>星盤「${BDEF[id].star}」</small><b>${HB[id].name}</b><span>Lv${G.h[id].lv}　解放 ${U.length-1}/${tot}</span></div><div class="bdp${pl>0?' rdy':''}"><small>星ポイント</small><b>${pl}</b></div></div>
  <div class="bdl">${Object.keys(NTN).filter(k=>k!=='core').map(k=>`<span><i style="background:${NCOL[k]}"></i>${NTN[k]}</span>`).join('')}</div>`;
 log(m||(n?`星を選択中。光る輪の星は解放できる`:'星をタップで詳細。<b>光る輪の星</b>が解放できる'));
 const st=n?(U.includes(n.k)?['解放済み','on']:canUnlock(id,n.k)?(n.cost<=pl?['解放できる','ok']:['ポイント不足','ng']):['未接続（隣の星を先に解放）','ng']):null;
 panel(`<div class="bdm">${G.members.map(x=>`<div class="bdf${x===id?' on':''}${ptsLeft(x)>0?' rdy':''}" data-a="m" data-v="${x}" style="--ec:${elCol(x)}"><img src="${art(x)}"><small>${HB[x].name}</small></div>`).join('')}</div>
 <div class="bdi"${n?` style="--nc:${NCOL[n.t]}"`:''}>${n?`<div class="bdt"><i>${NTN[n.t]}${n.t==='fork'?'（どちらか1つ）':''}</i><em class="${st[1]}">${st[0]}</em></div><b>${n.d}</b><small>必要ポイント ${n.cost}</small>`:'<div class="bdt"><i style="--nc:#8890c0">星を選ぶ</i></div><small>盤面の星をタップすると、効果と必要ポイントが表示される。中心の星片からつながる星だけ解放できる。</small>'}</div>
 <div class="bdb"><button class="tbtn gold" data-a="un" ${can?'':'disabled'}>解放${n?`<small>ポイント${n.cost}</small>`:''}</button><button class="tbtn" data-a="auto" ${pl>0?'':'disabled'}>おまかせ<small>自動で振り分け</small></button><button class="tbtn" data-a="rs">リセット<small>無料</small></button></div>
 <div class="bdb"><button class="tbtn" data-a="job">ジョブ<small>${G.h[id].job?JOBS[G.h[id].job].n:'未設定'}</small></button><button class="tbtn" data-a="tr">星臨の試練<small>位階${ROMAN[G.h[id].awLv||1]}</small></button><button class="tbtn back" data-a="back">戻る</button></div>`,
 {m:x=>{BS.sel=null;BS.id=x;boardMenu();},un:()=>{U.push(n.k);SFX.aw();save();boardMenu(`<b>${n.d}</b> を解放した！`);},
  auto:()=>{const c=autoUnlock(id);if(c)SFX.aw();save();boardMenu(c?`${c}個の星を解放した`:'解放できる星がない（ポイント不足）');},rs:()=>{G.h[id].board=['0,0'];BS.sel=null;save();boardMenu('星盤をリセットした（ポイントは全て戻る）');},
  job:()=>jobMenu(id),tr:()=>{enterTown();trialMenu();},back:()=>{const f=BFROM;BFROM='town';enterTown();if(f==='party')partyScreen();}});
 tip('board');};

/* ==================== マップ選択 ==================== */
const WAREAS=[{id:'haido',ch:'序章',need:()=>true},{id:'midori',ch:'第1章',need:()=>G.flags.boss1,un:'灰の街道のボスを倒すと解放'},{id:'seido',ch:'第2章',need:()=>G.flags.boss2,un:'図書遺跡のボスを倒すと解放'},
 {id:'raimei',ch:'第3章',need:()=>G.flags.boss3,un:'廃聖堂のボスを倒すと解放'},{id:'kouka',ch:'第4章',need:()=>G.flags.boss4,un:'第3章のボスを倒すと解放'},{id:'ouito',ch:'第5章',need:()=>G.flags.boss5,un:'第4章のボスを倒すと解放'},
 {id:'tower',ch:'第6章',nm:'天への塔',bf:'boss7',bk:()=>'boss7',need:()=>G.flags.boss6,un:'第5章のボスを倒すと解放',rec:()=>`最高到達 ${(G.tower&&G.tower.max)||0}階`,intro:'<b>第6章　天への塔</b>――星空へ続く白亜の塔。30階層。5階ごとの中継地点から挑める。'},
 {id:'zankyo',ch:'終章',need:()=>G.flags.boss7,un:'天への塔の頂上を制すると解放'},
 {id:'kairou',ch:'深層',t:1,nm:'虚の回廊',bf:'kr30',bk:()=>kBoss(10),need:()=>G.flags.boss8,un:'？？？',rec:()=>`最深到達 ${kst().max||0}層`,intro:'<b>虚の回廊</b>――果てのない回廊。10層ごとに番人がいて、倒した先の層が中継地点になる。'},
 {id:'ryuu',ch:'深層',t:1,need:()=>G.flags.boss8,un:'？？？'}];
const WTHEME={midori:'lib',seido:'chapel',raimei:'mine',kouka:'shrine',ouito:'ruin',tower:'tower',zankyo:'void',kairou:'void',ryuu:'lava'};
const SILC=new WeakMap();function silOf(src){let c=SILC.get(src);if(c)return c;c=document.createElement('canvas');c.width=src.width;c.height=src.height;const g=c.getContext('2d');g.drawImage(src,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#05060f';g.fillRect(0,0,c.width,c.height);SILC.set(src,c);return c;}
function wInfo(a){const A2=AREAS[a.id],st=AREAS[a.id]&&!['tower','kairou'].includes(a.id),open=!!a.need(),bf=a.bf||(A2&&A2.bflag);let bk=null;try{bk=a.bk?a.bk():A2.boss.kind;}catch(e){}
 const ds=new Set();[...(st?A2.groups.flat():[]),bk].forEach(k=>{((ED[k]&&ED[k].drop)||[]).forEach(([m])=>MATS[m]&&ds.add(m));});
 return{a,open,bk,clear:!!G.flags[bf],name:a.nm||A2.name,rec:a.rec?a.rec():A2.rec,intro:a.intro||A2.intro,drops:[...ds].slice(0,3),vd:voidArea(G.sorties+1)===a.id};}
worldMap=function(m){if(scene!=='town')show('town');if(WMS.tab&&!G.flags.boss8)WMS.tab=0;const list=WAREAS.filter(a=>(a.t||0)===WMS.tab).map(wInfo),deep=!!G.flags.boss8;
 if(!list.some(x=>x.a.id===WMS.sel&&x.open)){const op=list.filter(x=>x.open);WMS.sel=(op.find(x=>!x.clear)||op[op.length-1]||list[0]).a.id;}
 const cur=list.find(x=>x.a.id===WMS.sel);WMS.cur=cur;WMS.on=true;const th=WTHEME[cur.a.id]||'ash';if(!WMS.bgs[th])WMS.bgs[th]=makeBg(th,true);WMS.bg=WMS.bgs[th];
 $('#stage').style.display='';hud('');devBtn(false);
 $('#labels').innerHTML=`<div class="wmr"><span class="g">${fmt(G.gold)} G</span><span class="t">灯力 ${fmt(G.tou||0)}</span><span>出撃 ${G.sorties}回</span></div>
  <div class="wmt${cur.vd?' vd':''}"><small>${cur.a.ch}${cur.vd?'　◆虚蝕化':''}</small><b>${cur.name}</b><span>${cur.rec}</span></div>`;
 log((m?m+'<br>':'')+cur.intro);
 const floors=cur.a.id==='tower'?(()=>{const o=[];for(let f=1;f<=G.tower.cp;f+=5)o.push(f);return o.map(f=>[f,`${f}階`,`Lv${38+Math.floor(f*.4)}`]);})():cur.a.id==='kairou'?(()=>{const o=[];for(let f=1;f<=kst().cp;f+=10)o.push(f);return o.slice(-7).map(f=>[f,`${f}層`,`Lv${kLv(f)}`]);})():null;
 const row=x=>{const s=x.a.id===WMS.sel&&x.open;return`<div class="wrow${s?' sel':''}${x.open?'':' lock'}${x.vd?' vd':''}" data-a="sel" data-v="${x.a.id}">${x.clear?'<div class="wcl">CLEAR</div>':''}
  <div class="wch">${x.a.ch}</div><div class="wnm">${x.open||x.a.un!=='？？？'?x.name:'？？？'}</div><div class="wrec">${x.open?x.rec+(x.vd?'　<b>◆虚蝕化中</b>':''):'🔒 '+x.a.un}</div>
  <div class="wdr">${x.open?x.drops.map(k=>`<img src="${ICON[k]}">`).join('')+'<img src="'+ICON.eq+'">':''}</div>
  ${s?`<div class="wdet">${x.bk&&ED[x.bk]?`<span class="chp">ボス：${x.clear||G.zk&&G.zk.e&&G.zk.e[x.bk]?ED[x.bk].name:'？？？'}</span>`:''}${x.drops.map(k=>`<span class="chp">${MATS[k].n}</span>`).join('')}${x.vd?'<span class="chp sk">敵が強化・ドロップと灯力が増加</span>':''}
   ${floors?`<div class="wfl">${floors.map(([f,l,r],i)=>`<button class="tbtn${i===floors.length-1?' gold':''}" data-a="fl" data-v="${f}">${l}<small>${r}</small></button>`).join('')}</div>`:`<button class="tbtn gold wgo" data-a="go" data-v="${x.a.id}">▼ 出 撃 ▼</button>`}</div>`:''}</div>`;};
 const c=$('#cmd');c.className='panel wmap';ACT={tab:k=>{if(+k&&!deep)return;WMS.tab=+k;WMS.sel=null;worldMap();},sel:id=>{const x=list.find(v=>v.a.id===id);if(!x.open){log('🔒 '+(x.a.un==='？？？'?'まだ行くことができない':x.a.un));return;}if(WMS.sel!==id){WMS.sel=id;worldMap();}},
  go:id=>enterField(id),fl:f=>WMS.sel==='tower'?enterTower(+f):enterKairou(+f),back:()=>townMenu()};
 c.innerHTML=`<div class="wtabs"><button class="${WMS.tab===0?'on':''}" data-a="tab" data-v="0">本編</button><button class="${WMS.tab===1?'on':''}${deep?'':' lock'}" data-a="tab" data-v="1">${deep?'深層（クリア後）':'🔒 ？？？'}</button></div>
  <div class="wlist">${list.map(row).join('')}</div><div class="wfoot"><button class="tbtn back" data-a="back">◀ 戻る</button><div class="wfp">${G.party.map(id=>`<img src="${face(id)}">`).join('')}<small>パーティ戦闘力 <b>${fmt(G.party.reduce((s,id)=>s+power(id),0))}</b></small></div></div>`;
 const sr=c.querySelector('.wrow.sel');if(sr&&sr.scrollIntoView)sr.scrollIntoView({block:'nearest'});tip('map');};
/* プレビュー：選んだエリアの戦場にボスとパーティを並べる */
function drawWM(){const x0=WMS.cur;if(!x0||!WMS.bg)return;ctx.drawImage(WMS.bg,0,0);if(x0.vd){ctx.fillStyle='rgba(120,60,200,.24)';ctx.fillRect(0,0,W,H);}
 const bk=x0.bk;if(bk&&IMG[bk]){const d=ED[bk],s=16*(d.sc||2),x=22,y=90-s+Math.round(Math.sin(tick/26)*1.5),known=x0.clear||(G.zk&&G.zk.e&&G.zk.e[bk]);let img=hiImg(IMG[bk],d.boss?64:48,true);if(!known)img=silOf(img);
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(x+s*.15,89,s*.7,3);if(d.flip){ctx.save();ctx.translate(x+s,y);ctx.scale(-1,1);ctx.drawImage(img,0,0,s,s);ctx.restore();}else ctx.drawImage(img,x,y,s,s);}
 [[100,30],[134,37],[112,52],[146,59]].slice(0,G.party.length).map((p,i)=>[p,G.party[i]]).sort((a,b)=>a[0][1]-b[0][1]).forEach(([[x,y],id],i)=>{const yy=y+((tick>>5)+i)%2;ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(x+7,y+31,18,2);ctx.drawImage(hiImg(IMG[id],48,true),x,yy,32,32);});
 const g=ctx.createLinearGradient(0,84,0,H);g.addColorStop(0,'rgba(5,6,15,0)');g.addColorStop(1,'rgba(5,6,15,.9)');ctx.fillStyle=g;ctx.fillRect(0,84,W,H-84);}
{const _d=draw;draw=function(){if(WMS.on&&scene==='town'){tick++;const k=bK();if(cv.width!==W*k||cv.height!==H*k){cv.width=W*k;cv.height=H*k;}ctx.setTransform(k,0,0,k,0,0);ctx.imageSmoothingEnabled=false;drawWM();requestAnimationFrame(draw);return;}_d();};}

/* ==================== 街メニューへの組み込み ==================== */
{const _tm=townMenu;townMenu=function(m){WMS.on=false;_tm(m);const c=$('#cmd'),b=c.children[1],r=c.children[8];
 if(b){b.innerHTML=`<img class="ic" src="${ICON.eq}">編成<small>装備・星盤</small>`;b.onclick=()=>{SFX.sel();partyScreen();};if(G.members.some(i=>ptsLeft(i)>0))b.classList.add('ready');}
 if(r)r.innerHTML=`<img class="ic" src="${ICON.rec}">記録・設定`;tip('town');};}
{const _ef=enterField;enterField=function(id,keep){_ef(id,keep);tip('field');};}
{const _pm=pauseMenu;pauseMenu=function(m){_pm(m);addCmd('設定','速度・オート・フィルター',()=>cfgOpen(),3);};}
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
 <div class="cfr"><label>戦闘速度</label>${seg('spd',[[1,'×1'],[2,'×2'],[4,'×4']],speed)}</div>
 <div class="cfr"><label>コマンド決定<small>技の選び方</small></label>${seg('tap',[[0,'2タップ（確認あり）'],[1,'1タップ']],s.tap1?1:0)}</div>
 <div class="cfr"><label>通常AUTOの星臨<small>全力AUTOは常にすぐ使う</small></label>${seg('aw',Object.entries(AWN),s.autoAw)}</div>
 <div class="cfr"><label>拾う前フィルター<small>拾った装備を自動で処理する等級</small></label>${seg('fr',FLN.map((n,i)=>[i-1,n]),s.flt.rar)}</div>
 <div class="cfr"><label>フィルターの処理<small>未鑑定・レジェンド・セットは必ず残す</small></label>${seg('fm',[['sell','売却（G）'],['dism','分解（素材）']],s.flt.mode)}</div>
 <div class="cfr"><label>今より強い装備は残す<small>誰かの装備より強ければ処理しない</small></label>${seg('fk',[[1,'ON'],[0,'OFF']],s.flt.keepUp?1:0)}</div>
 <div class="cfr"><label>BGM</label>${seg('bgm',[[1,'ON'],[0,'OFF']],BGM.on?1:0)}</div>
 <div class="cfr"><label>チュートリアル<small>初めての画面で説明を出す</small></label>${seg('tut',[[1,'ON'],[0,'OFF']],s.tut?1:0)}</div>
 <div class="cfr"><label>説明をもう一度<small>次に開いた画面から再表示</small></label><div class="seg"><button data-a="trs">リセット</button><button data-a="how">遊び方</button></div></div></div>
 <button class="tbtn back wide" data-a="close">閉じる</button>`,
 {txt:v=>{s.txt=+v;re();},spd:v=>{setSpeed(+v);re();},tap:v=>{s.tap1=!!+v;re();},aw:v=>{s.autoAw=v;re();},fr:v=>{s.flt.rar=+v;re();},fm:v=>{s.flt.mode=v;re();},fk:v=>{s.flt.keepUp=!!+v;re();},
  bgm:v=>{if(BGM.on!==!!+v)bgmToggle();re();},tut:v=>{s.tut=!!+v;re();},trs:()=>{G.tut={};s.tut=true;save();cfgOpen(back);tipShow('how');},how:()=>tipShow('how'),close:()=>{ovClose();if(typeof back==='function')back();}});}

/* ==================== テキスト速度 ==================== */
talk=function(lines,done){const d=document.createElement('div');d.id='talk';
 d.innerHTML='<div class="tkw"><div class="tkp"><img></div><div class="tkb"><div class="tkn"></div><div class="tkt"></div><div class="tkx">▼</div></div></div><button class="tksk">スキップ ▶▶</button>';
 $('#app').appendChild(d);let i=-1,tm=null,full='';const im=d.querySelector('.tkp img'),pp=d.querySelector('.tkp'),nm=d.querySelector('.tkn'),tx=d.querySelector('.tkt');
 const fin=()=>{clearInterval(tm);tm=null;tx.innerHTML=full;};
 const next=()=>{i++;if(i>=lines.length){d.remove();if(done)done();return;}const[sp,ex,t]=lines[i];full=t;
  if(sp&&HB[sp]){pp.style.display='';im.src=exprFace(sp,ex);nm.textContent=HB[sp].name;nm.style.display='';d.classList.remove('nar');}else{pp.style.display='none';nm.style.display='none';d.classList.add('nar');}
  const ms=TXS[G&&G.set&&G.set.txt!=null?G.set.txt:1][1];tx.textContent='';clearInterval(tm);tm=null;if(!ms)return fin();let n=0;const cs=[...t];tm=setInterval(()=>{n++;tx.textContent=cs.slice(0,n).join('');if(n>=cs.length)fin();},ms);};
 d.onclick=e=>{if(e.target.closest('.tksk')){SFX.sel();i=lines.length-1;fin();next();return;}if(tm)fin();else{SFX.sel();next();}};next();};

/* ==================== チュートリアル ==================== */
const TIPS={
 town:['灯都ルミナス',['ここが拠点の<b>灯都</b>。帰ってくるたびにHPが全回復し、自動でセーブされる。','<b>出撃</b>：行き先を選んで冒険へ。<br><b>編成</b>：仲間の入れ替え・装備・星盤はここから。','ほかの施設は、冒険で手に入れた物を使うときに。<b>記録・設定</b>で文字の速さやオートの動きを変えられる。']],
 map:['行き先を選ぶ',['行きたいエリアをタップすると、上に<b>その場所のボスと推奨Lv</b>が出る。','よければ<b>▼出撃▼</b>を押して出発。<b>CLEAR</b>の付いたエリアは何度でも挑める。']],
 field:['探索のしかた',['<b>行きたい場所をタップ</b>すると歩く。宝箱や光る採取ポイントを探そう。','魔物に<b>自分からぶつかると先制攻撃</b>。背後を取られると不利になる。','危なくなったら<b>帰還の灯</b>で灯都へ。下の顔をタップすると仲間の状態を確認できる。']],
 battle:['戦闘のしかた',['上の並びが<b>行動順</b>。自分の番が来たら、下の一覧から<b>技をタップ→もう一度タップ</b>で決定。','<b>敵をタップ</b>すると狙いが変わる。左上に、狙った敵の<b>弱点</b>が出る（?はまだ不明）。','弱点を突いて <b>◆シールド</b> を0にすると <b>BREAK</b>。敵が動けなくなり、大ダメージの好機。','面倒なら下の<b>通常AUTO</b>。同じ行動を繰り返すなら<b>リピート</b>。']],
 awake:['星臨できる！',['金色の<b>ASTRAL GAUGE</b>が100%になった。<b>星臨</b>ボタンで発動――<b>行動を消費しない</b>ので、そのまま強力な星臨技を撃てる。','2人が同時に星臨すると、<b>共鳴技</b>が使えるようになる。']],
 awake2:['星臨中',['技の一覧が<b>星臨技</b>に変わった。星臨はキャラごとに性質が違う（ターン制・ゲージ消費など）。','効果が切れると反動で少し行動が遅れる。もう1人も星臨させると<b>共鳴技</b>。']],
 reso:['共鳴技',['2人の星片が<b>共鳴</b>した！ 技の一番上の<b>共鳴技</b>は、1戦闘に1回だけの切り札。']],
 party:['編成',['カードを<b>タップで選び</b>、入れ替えたい相手をタップ。<b>同じカードをもう一度</b>タップで詳細・装備へ。','カードの背景は、その仲間の<b>星盤</b>。解放した星が光ってつながる。✦ボタンから星盤へ。']],
 board:['星盤',['Lvが上がるともらえる<b>星ポイント</b>で星を解放する。<b>光る輪の星</b>が今解放できる星。','迷ったら<b>おまかせ</b>。<b>リセット</b>は無料なので、気軽に試せる。']],
 how:['遊び方',['<b>灯都</b>で準備 → <b>出撃</b>で各地へ → ボスを倒すと次の章へ。街に戻るとHP全回復＆自動セーブ。','戦闘：弱点で<b>BREAK</b>、ゲージ100%で<b>星臨</b>（行動を消費しない）、2人星臨で<b>共鳴技</b>。','育成：<b>編成</b>から装備と<b>星盤</b>。<b>星詠みの塔</b>でジョブと星臨の試練。','<b>記録・設定</b>：セーブは3スロット。オートの星臨・拾う前フィルター・テキスト速度を変えられる。']]};
function tip(key){if(!G||G.dev||!G.set||G.set.tut===false||!G.tut||G.tut[key]||!TIPS[key]||$('#tip'))return false;G.tut[key]=1;tipShow(key);return true;}
function tipShow(key){const[t,pg]=TIPS[key],old=$('#tip');if(old)old.remove();let i=0;const d=document.createElement('div');d.id='tip';$('#app').appendChild(d);
 const fp=scene==='field'&&F?F.pause:null;if(fp!==null)F.pause=true;
 const close=()=>{d.remove();if(fp!==null&&scene==='field'&&F)F.pause=fp;};
 const r=()=>{d.innerHTML=`<div class="tpw"><div class="tph"><em>TUTORIAL</em><b>${t}</b><span>${i+1}/${pg.length}</span></div><div class="tpb">${pg[i]}</div><div class="tpf"><button class="tpo" data-k="off">説明を出さない</button><button class="tpn" data-k="next">${i<pg.length-1?'次へ ▶':'OK'}</button></div></div>`;};
 d.onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;SFX.sel();if(b.dataset.k==='off'){if(G&&G.set){G.set.tut=false;save();}return close();}if(++i>=pg.length)return close();r();};r();}

/* ==================== セーブ3スロット ==================== */
const SLOTK=['astral_save_v1','astral_save_s2','astral_save_s3'];
const slotGet=i=>{try{const s=localStorage.getItem(SLOTK[i]);return s?JSON.parse(s):null;}catch(e){return null;}};
const slotCur=()=>Math.max(0,SLOTK.indexOf(SAVE));
const chapOf=f=>f.boss8?'クリア後':f.boss7?'終章':f.boss6?'第6章':f.boss5?'第5章':f.boss4?'第4章':f.boss3?'第3章':f.boss2?'第2章':f.boss1?'第1章':'序章';
const slotTxt=s=>{if(!s)return'― 記録なし ―';const ps=(s.party||['rio']).filter(id=>s.h&&s.h[id]);return`${chapOf(s.flags||{})}　Lv${Math.max(1,...ps.map(id=>s.h[id].lv))}　${ps.map(id=>HB[id]?HB[id].name:'').join('・')}<small>${fmt(s.gold||0)}G　出撃${s.sorties||0}回</small>`;};
title=function(){const last=Math.min(2,Math.max(0,+(lsGet('astral_slot')||0)));SAVE=SLOTK[last];show('title');const ov=$('#ov');ov.classList.remove('hide');ov.classList.add('ttl');
 ov.innerHTML=`<canvas id="tcv" width="180" height="320"></canvas><div class="tlogo">ASTRAL<br>BREAKER</div><div class="tsub">〜 星継ぎの灯 〜</div><div class="tmenu" id="tm"></div>
 <div class="note" id="hw" style="display:none"><b>遊び方</b><br>・灯都で準備→「出撃」で各地へ。タップした場所へ歩く。<br>・魔物に<b>自分からぶつかると先制攻撃</b>。宝箱・採取ポイントを探そう。<br>・戦闘：技を2回タップで決定。弱点でブレイク、ゲージ100%で<b>星臨</b>（行動を消費しない）。2人星臨で<b>共鳴技</b>。<br>・街に戻るとHP全回復＆自動セーブ。<b>編成</b>で装備と星盤。セーブは3スロット。</div>
 <div class="tfoot"><button id="devg">開発者モード</button><div class="ver" id="verL">${VER}</div></div>`;
 const tm=$('#tm'),has=()=>SLOTK.some((k,i)=>slotGet(i));
 const main=()=>{tm.className='tmenu';tm.innerHTML=`<button class="big" id="newg">はじめから</button><button class="big gold" id="cont" ${has()?'':'disabled style="opacity:.35"'}>つづきから</button><button class="big" id="howto" style="height:40px;font-size:13px">遊び方</button>`;
  $('#howto').onclick=()=>{const h=$('#hw');h.style.display=h.style.display==='none'?'block':'none';};$('#newg').onclick=()=>{au();SFX.sel();pick(true);};$('#cont').onclick=()=>{au();SFX.sel();pick(false);};};
 const pick=nw=>{$('#hw').style.display='none';let warn=-1;tm.className='tmenu sl';
  const r=()=>{tm.innerHTML=`<div class="slh">${nw?'はじめから：使うスロットを選ぶ':'つづきから：スロットを選ぶ'}</div>`+SLOTK.map((k,i)=>{const s=slotGet(i);return`<button class="slc${s?'':' emp'}${i===last&&s?' last':''}" data-s="${i}" ${!nw&&!s?'disabled':''}><b>スロット${i+1}${warn===i?'　<span style="color:#ff9a9a">もう一度押すと上書きして開始</span>':''}</b><span>${slotTxt(s)}</span></button>`;}).join('')+'<button class="big" id="slb" style="height:38px;font-size:13px">戻る</button>';
   $('#slb').onclick=()=>{SFX.sel();main();};tm.querySelectorAll('.slc').forEach(b=>b.onclick=()=>{au();const i=+b.dataset.s,s=slotGet(i);
    if(nw){if(s&&warn!==i){warn=i;SFX.sel();return r();}SAVE=SLOTK[i];lsSet('astral_slot',i);migrate(newGame());setSpeed(1);SFX.aw();enterTown('<b>序章</b>――大灯が揺らぎ、虚蝕が街に迫る。灯守見習いのリオは、元騎士団長ガルドと共に灰の街道へ向かう。');}
    else if(s){SAVE=SLOTK[i];lsSet('astral_slot',i);migrate(Object.assign(newGame(),s));setSpeed(G.speed||1);enterTown('おかえりなさい。');}});};r();};
 $('#devg').onclick=()=>{au();devStart();};main();deco16();const v=$('#verL');if(v)v.textContent=VER;};
/* 記録メニュー：今のスロット表示・別スロットへの複製・設定 */
{const _sm=saveMenu;saveMenu=function(m){_sm(m);if(SAVE===DEVKEY){addCmd('設定','テキスト速度・オート・フィルター',()=>cfgOpen(),3);return;}const cur=slotCur();
 $('#msg').insertAdjacentHTML('afterbegin',`<div class="slnow">使用中：<b>スロット${cur+1}</b>　${slotTxt(G).replace(/<small>.*/,'')}</div>`);
 addCmd('設定','テキスト速度・オート・フィルター',()=>cfgOpen(),0,'ready');
 addCmd('別のスロットへ複製','今の記録を他のスロットに写す',()=>{let warn=-1;const r=()=>{log('<b>別のスロットへ複製</b>　今の記録をそのまま写す（遊ぶスロットは変わらない）');
  menu([...SLOTK.map((k,i)=>({i,s:slotGet(i)})).filter(x=>x.i!==cur).map(x=>({l:`スロット${x.i+1}へ複製`+(warn===x.i?'　⚠もう一度押すと上書き':''),s:slotTxt(x.s).replace(/<\/?small>/g,'　'),cls:x.s?'':'ready',f:()=>{if(x.s&&warn!==x.i){warn=x.i;return r();}
    let ok=true;try{localStorage.setItem(SLOTK[x.i],JSON.stringify(G));}catch(e){ok=false;}saveMenu(ok?`スロット${x.i+1}に複製しました。`:'この環境では保存できませんでした。');}})),{l:'戻る',cls:'back',f:()=>saveMenu()}],true);};r();},3);};}

/* ==================== 開発者メニュー ==================== */
function dev17(m){log((m||'<b>ver0.17 快適さ＋UI再構築</b>')+`<br><small>スロット：${SAVE===DEVKEY?'開発用':slotCur()+1}　星臨AUTO：${AWN[G.set.autoAw]}　フィルター：${FLN[G.set.flt.rar+1]}</small>`);
 menu([{l:'編成画面を開く',cls:'ready',s:'カード・戦闘力・共鳴技・控え',f:()=>partyScreen()},{l:'マップ選択を開く',s:'プレビュー・CLEAR・ドロップ',f:()=>worldMap()},
  {l:'新しい戦闘画面（3体）',s:'狙い・2タップ決定・リピート・AUTO',f:()=>devBattle([{kind:'snowwolf',lv:30},{kind:'yukirei',lv:30},{kind:'onimusha',lv:30}],'kouka',{boss:false})},
  {l:'新しい戦闘画面（ボス）',s:'禁書の守護像',f:()=>devBattle([{kind:'boss2',lv:10}],'midori')},{l:'設定を開く',s:'テキスト速度・オート・フィルター',f:()=>cfgOpen()},
  {l:'チュートリアルを全て見る',s:'全9種を順番に表示',f:()=>{const ks=Object.keys(TIPS);let i=0;const nx=()=>{if(i>=ks.length)return;tipShow(ks[i++]);const t=setInterval(()=>{if(!$('#tip')){clearInterval(t);nx();}},200);};nx();}},
  {l:'フィルターの動作テスト',s:'装備を10個拾って結果を見る',f:()=>{const o=[];for(let i=0;i<10;i++)o.push(addLoot(genItem(30,0)));save();dev17('拾った結果：<br><small>'+o.join('、')+'</small>');}},{l:'戻る',cls:'back',f:()=>dvMenu()}],true);}
{const _dv=dvMenu;dvMenu=function(m){_dv(m);const c=$('#cmd'),b=document.createElement('button');b.className='c ready';b.innerHTML='ver0.17 快適さ＋UI再構築<small>編成・マップ選択・戦闘画面・3スロット・設定・チュートリアル</small>';b.onclick=()=>{SFX.sel();dev17();};c.insertBefore(b,c.children[0]);if(c.children[1])c.children[1].classList.remove('ready');};}
if(scene==='title')title();
