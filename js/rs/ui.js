/* ===== 戦闘システムの画面 =====
 1. 戦闘のコマンド入力（RS 風）：行動するキャラの顔・HP/LP/BP の帯・技の一覧（通常攻撃＋セットした 4 つ＋奥義）。
    下の段に「戻る（前のキャラ）・道具・交代」。技はタップで指を動かし、もう 1 回タップで決定（ver0.40）。ⓘ で詳細
 2. 下のボタン：通常AUTO・全力AUTO・リピート（速度は画面上のボタンだけ）
 3. キャラ詳細：能力（7 能力値＋アビリティ）・技・術（技セット）・星臨（星臨アビリティと奥義）・星盤
 戦場の配置・スライド演出・上の帯は js/v38/battle-ui.js、編成画面は js/v38/party.js */
'use strict';
const RSU=(()=>{
const D=RSD,C=RSC,X=RSB,esc=C.esc,clamp=C.clamp;
const DEV=()=>{try{return!!(G&&G.dev);}catch(e){return false;}};
const hx=(el,col,cls='')=>`<i class="hx20 ${cls}" style="--c:${col||'#8890c0'}">${el||'無'}</i>`;
const badge=s=>{try{return skBadge(s);}catch(e){return[s.el||'無','#c8c8e0'];}};
const tyOf=s=>s.basic?(s.k==='mag'?'術':'技'):s.ougi?'奥義':s.k==='item'?'道具':s.ty||(s.k==='mag'?'術':'技');
const tyCls=s=>s.ougi?'aw':s.k==='item'?'it':/heal|revive/i.test(s.k||'')||s.heal20||s.role==='heal'?'hl':s.k==='sup20'||s.k==='rewind'?'sp':tyOf(s)==='術'?'mg':'ph';
const wpOf=u=>(u&&(u.wpn||(stats(u.id||u)||{}).rsW))||'剣';
const basicName=(u,sk)=>`通常攻撃（${(sk&&sk.bn)||wpOf(u)}）`;

/* ==================== 技の詳細 ==================== */
/* 技・術の詳細（ver0.43：ロマサガRS の技の詳細の窓のように）
   ┌[アイコン] 技名                 [属性][属性]┐
   │           威力  C │ Rank  3              │
   │           BP    8 │ LP    -              │
   ├ 攻撃/遠/敵全体（熱+陽）                     ┤
   └ 説明（習得・技Lv・弱点の手がかり）            ┘ */
function info(sk,u){const id=u&&(u.id||u),s=sk.basic?Object.assign({},sk,{n:basicName(u,sk),d:sk.d||(sk.k==='mag'?'BPを使わない基本の攻撃。杖は知力で魔弾を放つ':'BPを使わない基本の攻撃。武器の属性で攻撃する')}):sk,k=C.keyOf(sk);
 const cost=s.basic?0:s.ougi?0:s.k==='item'?'-':u&&u.side===0?C.costOf(u,s):(s.bp??'-'),pl=id&&k&&D.NEW[k]?C.profLv(id,k):null,lp=C.lpCost(s);
 const els=[...new Set([s.el,s.el2].filter(x=>x&&ELN[x]))];
 const ty=tyOf(s),kind=s.ougi?'奥義':/heal|revive/i.test(s.k||'')||s.heal20||s.role==='heal'?'回復':s.k==='sup20'||s.pow==null&&!s.basic&&s.k!=='item'?'補助':ty==='術'?'術攻撃':'攻撃';
 const W0=id&&D.HERO[id]?D.HERO[id].w:'',far=ty==='術'||W0==='弓'||W0==='杖'||/矢|射|撃ち|波|弾/.test(s.n||'');
 const tags=[kind,kind.includes('攻撃')||kind==='奥義'?(far?'遠':'近'):null,s.prio>0?'ファスト':s.prio<0?'ディレイ':null,(D.TGT[s.t]||(s.t==='ally'?'味方1人':null)),s.hits>1?`${s.hits}回攻撃`:null].filter(Boolean).join('/')+(els.length?`（${els.join('+')}）`:'');
 const how=id&&k&&HB[id]&&C.howTxt(id,k);
 const hint=u&&B&&B.tgt&&s.el&&scene==='battle'?(B.tgt.weak.includes(s.el)&&B.tgt.known.has(s.el)?`<b class="w">${esc(B.tgt.name)}の弱点を突ける</b>`:B.tgt.kR&&B.tgt.kR.has(s.el)?`<b class="r">${esc(B.tgt.name)}は耐性がある</b>`:''):'';
 ovOpen(`<div class="ski43">
  <div class="top">${skIcon(id,s)}<div class="nm"><div class="t"><b>${esc(s.n||'')}</b><span class="els">${els.map(e=>`<i class="hx43" style="--c:${ELN[e]}">${e}</i>`).join('')}</span></div>
   <div class="g"><div><em>威力</em><b>${s.rk||(s.basic?'D':s.ougi?'奥':'-')}</b></div><div><em>Rank</em><b>${pl||'-'}</b></div><div class="two"><span><em>BP</em><b>${cost}</b></span><i></i><span><em>LP</em><b>${lp||'-'}</b></span></div></div></div></div>
  <div class="dsc"><p class="tgs">${esc(tags)}</p><p>${KW.markT(s.d||'')}</p>
   ${hint?`<p class="sub">${hint}</p>`:''}</div></div>
  <button class="tbtn back wide" data-a="close">閉じる</button>`,{close:ovClose});}

/* ==================== 戦闘のコマンド入力（RS 風） ==================== */
const GL={hp:'<svg viewBox="0 0 16 16"><path d="M8 14 2.6 8.6a3.3 3.3 0 0 1 4.7-4.7L8 4.6l.7-.7a3.3 3.3 0 0 1 4.7 4.7z"/></svg>',
 back:'<svg viewBox="0 0 16 16"><path d="M6 3 2 7l4 4V8.5h4.5A2.5 2.5 0 0 1 13 11v2h1.5v-2A4 4 0 0 0 10.5 7H6z"/></svg>',
 bag:'<svg viewBox="0 0 16 16"><path d="M5 5V4a3 3 0 0 1 6 0v1h2.2l.8 9.5H2L2.8 5zm1.4 0h3.2V4a1.6 1.6 0 0 0-3.2 0z"/></svg>',
 swap:'<svg viewBox="0 0 16 16"><path d="M4 2 1 5l3 3V6h8V4H4zm8 6v2H4v2h8v2l3-3z"/></svg>'};
function canAw(u){return!!u&&u.alive&&!u.aw&&(DEV()||(u.ag>=100&&B.heroes.filter(h=>h.aw).length<2));}
function chips(u){const hp=Math.max(0,u.hp),dy=X.dying(u);
 return`<div class="c38s"><span class="hp${dy?' dy':''}"><em>HP</em><b>${hp}</b><small>/${u.mhp}</small><i style="--r:${(hp/u.mhp*100).toFixed(1)}%"></i></span>
  <span class="lp"><em>LP</em><b>${u.lp}</b><small>/${u.lpMax}</small></span>
  <span class="bp"><em>BP</em><b>${DEV()?'∞':u.sp}</b><small>/${u.bpMax}</small><u>+${X.bpReg(u)}</u></span></div>`;}
chooseRoot=function(u,ctx={}){const idx=ctx.idx||0,tot=ctx.n||1;
 return new Promise(res0=>{let sub=null,lock=false,R=[];const dev=DEV();
  const res=v=>{B.res=null;B.pick=null;try{bbar(true);}catch(e){}res0(v);};
  const fin=(sk,t)=>{LASTA[u.id]={sk};SFX.sel();
   res(t?{sk,t}:{sk});};
  /* 指の位置：この戦闘でそのキャラが最後に選んだコマンド（なければ先頭） */
  const same=(a,b)=>!!a&&!!b&&(a===b||(a.basic&&b.basic?a.bn===b.bn&&a.k===b.k:!!C.keyOf(a)&&C.keyOf(a)===C.keyOf(b)));
  const pkOf=()=>{if(sub)return-1;const la=LASTA[u.id]&&LASTA[u.id].sk;const i=R.findIndex(r=>!r.dis&&same(r.sk,la));return i>=0?i:R.findIndex(r=>!r.dis);};
  /* 技・術は 2 段階：1 回目のタップで指を動かす → 指のある行をもう 1 回タップで決定（cur＝指の行） */
  let cur=-1;
  const mark=i=>{cur=i;const l=$('#cmd .c38l');if(!l)return;l.querySelectorAll('.r').forEach((b,j)=>b.classList.toggle('pk',j===i));};
  B.res=()=>res(autoPick(u));
  const use=sk=>{if(sk.t==='all'||sk.t==='self')return fin(sk);
   if(sk.t==='one'||sk.basic){if(!B.tgt||!B.tgt.alive)B.tgt=aliveE()[0];return fin(sk,B.tgt);}
   const heal1=C.isHealSpell(sk),pool=sk.revive?B.heroes.filter(h=>!h.alive&&(h.lp||0)>0):heal1?B.heroes.filter(h=>h.alive||(h.lp||0)>0):aliveH();
   if(!pool.length){log('対象がいない');return;}
   sub={t:`${esc(sk.n||ITEMS[sk.id].n)}　誰に？`,rows:pool.map(t=>({face:t.id,n:t.name,d:t.alive?`HP ${t.hp}/${t.mhp}`:`気絶（LP ${t.lp}）`,cost:t.alive?'':'復活',now:1,f:()=>fin(sk,t)}))};draw();};
  const rows=()=>{if(sub)return sub.rows;const o=[];
   if(u.aw){const ok=SK[(D.AWX[u.id]||{}).ou];if(ok){const[e,c]=badge(ok),used=!!u._rsOugi,noSnap=ok.k==='rewind'&&!B.snap;o.push({el:e,ec:c,n:ok.n,tag:'奥義',sk:ok,cost:used?'使用済':'BP 0',cls:'ougi',dis:used||noSnap,f:()=>use(ok)});}}
   basicsOf(u).forEach(a=>{const[ae,ac]=badge(a);o.push({el:ae,ec:ac,n:basicName(u,a),sk:a,cost:'BP 0',cls:'basic',f:()=>use(a)});});
   (u.rsSet||[]).forEach(k=>{const s=SK[k];if(!s)return;const[e,c]=badge(s),cs=C.costOf(u,s),lp=C.lpCost(s),pl=C.profLv(u.id,k),ngB=!dev&&cs>u.sp,ngL=!dev&&lp&&(u.lp||0)<=lp;
    o.push({el:e,ec:c,n:s.n,lv:pl>1?pl:0,sk:s,cost:'BP '+cs,lp,ng:ngB||ngL,dis:ngB||ngL,f:()=>use(s)});});
   if(!(u.rsSet||[]).length)o.push({el:'？',ec:'#aab0d8',n:'技セットが空（キャラ詳細の「技・術」でセット）',dis:1,f:()=>{}});
   return o;};
  const items=()=>{const I=G.items,down=B.heroes.some(h=>!h.alive&&(h.lp||0)>0);
   sub={t:'道具',rows:Object.keys(ITEMS).filter(k=>(I[k]||0)>0||k==='potion').map(k=>{const rv=k==='feather'||k==='tail';
    return{el:'道',ec:'#7dffa8',n:ITEMS[k].n,d:ITEMS[k].d,cost:'×'+(I[k]||0),ng:!I[k],dis:!I[k]||(rv&&!down),now:1,sk:{n:ITEMS[k].n,k:'item',id:k,t:'ally',d:ITEMS[k].d},f:()=>use({k:'item',id:k,t:'ally',revive:rv,n:ITEMS[k].n})};})};draw();};
  const swaps=()=>{const rs=G.members.filter(id=>!B.heroes.some(h=>h.id===id)&&G.h[id].hp!==0);
   sub={t:'交代',rows:rs.map(id=>({face:id,n:HB[id].name,d:`Lv${G.h[id].lv}　${D.HERO[id]?D.HERO[id].w:''}`,cost:'交代',now:1,f:()=>res({swap:id})}))};draw();};
  const draw=()=>{const c=$('#cmd');c.className='c38';if(lock){c.innerHTML='<div class="c38w">…</div>';return;}R=rows();if(!sub&&(cur<0||!R[cur]||R[cur].dis))cur=pkOf();const pk=sub?-1:cur;
   const rsN=G.members.filter(id=>!B.heroes.some(h=>h.id===id)&&G.h[id].hp!==0).length,ag=Math.floor(u.aw?100:u.ag),aw=canAw(u);
   c.innerHTML=`<div class="c38p">
    <div class="c38h" style="--ec:${elCol(u.id)}"><img class="fc" src="${face(u.id,u.aw)}" alt=""><div class="nm"><b>${esc(u.name)}</b><small>${idx+1}/${tot}${u.aw?`　${SEIRIN.n} 残り${X.awLeft(u)}`:''}</small></div>
     <button class="aw${aw?' rdy':''}${u.aw?' on':''}" data-c38="aw" ${aw?'':'aria-disabled="true"'} style="--g:${ag}%"><i></i><b>${u.aw?'星臨中':aw?'星臨':ag+'%'}</b></button></div>
    ${chips(u)}
    ${sub?`<div class="c38t"><button data-c38="sub">${GL.back}</button><b>${sub.t}</b></div>`:''}
    <div class="c38l">${R.map((r,i)=>`<button class="r ${r.cls||''}${r.ng?' ng':''}${i===pk?' pk':''}" data-i38="${i}" ${r.dis?'disabled':''}>${r.face?`<img src="${face(r.face)}" alt="">`:r.sk&&r.sk.k!=='item'?elStack(r.sk,B.tgt):hx(r.el,r.ec,'el')}<span class="n">${r.tag?`<em>${r.tag}</em>`:''}${esc(r.n).replace(/^(.*)$/,'$1')}${r.lv?`<small>技Lv${r.lv}</small>`:''}${r.d&&(r.face||sub)?`<small class="d">${esc(r.d)}</small>`:''}</span>${costHTML(r.cost,r.lp,r.ng)}${r.sk?`<span class="inf" data-inf38="${i}">i</span>`:''}</button>`).join('')}</div>
    <div class="c38f"><button data-c38="back" ${idx>0&&!sub?'':'disabled'}>${GL.back}<small>戻る</small></button><button data-c38="it" ${sub?'disabled':''}>${GL.bag}<small>道具</small></button><button data-c38="sw" ${rsN&&!u.swapped&&!u.aw&&!sub?'':'disabled'}>${GL.swap}<small>交代</small></button></div></div>`;
   c.scrollTop=0;const l=c.querySelector('.c38l');if(l)l.scrollTop=0;try{bbar(true);}catch(e){}};
  B.pick={u,
   row:i=>{const r=R[i];if(!r||r.dis||lock)return;if(!sub&&cur!==i){SFX.sel();mark(i);return;}r.f();},
   info:i=>{const r=R[i];if(r&&r.sk){SFX.sel();info(r.sk,u);}},
   cmd:k=>{if(lock)return;SFX.sel();if(k==='back')return res({back:1});if(k==='it')return items();if(k==='sw')return swaps();if(k==='sub'){sub=null;draw();}if(k==='aw')B.pick.aw();},
   rep:()=>{const s=repOK(u);if(s&&!lock)use(s);},retarget:()=>{draw();},
   aw:async()=>{if(lock||u.aw||!canAw(u))return;if(DEV())u.ag=100;lock=true;sub=null;draw();const rr=B.res;B.res=null;await awaken(u);B.res=rr;lock=false;draw();}};
  draw();refresh();});};
/* コマンド欄のタップ（技の行・ⓘ・下の段） */
$('#cmd').addEventListener('click',e=>{const c=$('#cmd');if(!c.classList.contains('c38')||!B||!B.pick)return;
 const inf=e.target.closest('[data-inf38]');if(inf){e.stopPropagation();B.pick.info(+inf.dataset.inf38);return;}
 const b=e.target.closest('[data-c38]');if(b){if(b.getAttribute('aria-disabled')==='true'||b.disabled)return;B.pick.cmd(b.dataset.c38);return;}
 const r=e.target.closest('[data-i38]');if(r&&!r.disabled)B.pick.row(+r.dataset.i38);},true);

/* ==================== 下のボタン：通常AUTO・全力AUTO・リピート ==================== */
bbar=function(){const b=$('#bbar');if(!b||!G)return;const p=B&&B.pick,l=p&&repOK(p.u),sg=[l?l.n:'',auto,AM,G.set.autoAw].join();if(b._s===sg&&b.firstChild)return;b._s=sg;
 b.className='b38';
 b.innerHTML=`<button data-b="n" class="au${auto&&AM==='n'?' on':''}">通常AUTO<small>${SEIRIN.n}：${AWN[G.set.autoAw]}</small></button><button data-b="f" class="au f${auto&&AM==='f'?' on':''}">全力AUTO<small>${SEIRIN.n}も使う</small></button><button data-b="rep" class="rp" ${l?'':'disabled'}>リピート<small>${l?esc(l.basic?'通常攻撃':l.n):'前回と同じ行動'}</small></button>`;};

/* ==================== キャラ詳細 ==================== */
const RK=['','Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ'];
function stars(r){return`<span class="rsst">${[1,2,3].map(i=>`<i class="${i<=r?'on':''}"></i>`).join('')}</span>`;}
/* 技・術の行（ver0.41：ロマサガRS の技一覧のように「アイコン＋名前＋Rank＋属性」だけ。説明は ⓘ で出す）
   アイコン：js/ui/skill-icons.js（SKICON）の白いシルエット（技の内容ごと）。色は種類（技＝赤・術＝青・回復＝緑・補助＝金・奥義＝虹）
   Rank＝技Lv（使うほど上がる。旧「熟練」） */
const ELN=ELN43;/* 属性の文字の色は js/data/resist.js（耐性の印と共通） */
/* 属性の六角マーク（ver0.43：ロマサガRS のコマンド欄のように暗い金属の六角形に銀の文字。2 属性は縦に重ねる）
   t（狙っている敵）が分かっている弱点なら赤く、耐性なら青く光る */
function elStack(sk,t){let L=[...new Set([sk.el,sk.el2].filter(x=>x&&ELN[x]))];const nb=!L.length;if(nb)L=[badge(sk)[0]||'無'];
 const st=e=>!t||nb?'':t.weak&&t.weak.includes(e)&&t.known&&t.known.has(e)?' wk':t.kR&&t.kR.has(e)?' rs':'';
 return`<span class="els43${L.length>1?' two':''}">${L.map(e=>`<i class="hx43${st(e)}" style="--c:${ELN[e]||'#c8c8e0'}">${esc(e)}</i>`).join('')}</span>`;}
/* 消費の表示：「BP　6」（足りないと数字が赤）・「LP　1」を右寄せで縦に */
function costHTML(cost,lp,ng){const m=/^BP\s*(\d+)/.exec(String(cost||''));
 if(!m)return`<span class="c43">${cost?`<span><b class="tx">${esc(cost)}</b></span>`:''}</span>`;
 return`<span class="c43"><span><em>BP</em><b${ng?' class="ng"':''}>${m[1]}</b></span>${lp?`<span><em>LP</em><b>${lp}</b></span>`:''}</span>`;}
function skIcon(id,s,sm){const t=tyCls(s),[el]=badge(s);let g='';
 try{g=SKICON.html(s);}catch(e){}
 if(!g)g=`<b>${esc(el||'術')}</b>`;
 return`<span class="ski ${t}${sm?' sm':''}">${g}</span>`;}
function elBadges(s){const L=[...new Set([s.el,s.el2].filter(x=>x&&ELN[x]))];return L.map(e=>`<i class="hx43" style="--c:${ELN[e]}">${e}</i>`).join('');}
function skCard(id,k,o={}){const s=SK[k];if(!s)return'';const on=o.set,pl=C.profLv(id,k),u={id,side:0},lp=C.lpCost(s);
 return`<div class="sk41${o.lock?' lock':''}${on?' on':''}${o.pend?' pend':''}${o.info?' tapi':''}"${o.btn?` data-a="rsk" data-v="${k}"`:o.info?` data-a="rsinfo" data-v="${k}"`:''}>
  ${skIcon(id,s)}${on?`<i class="sno">${o.i+1}</i>`:''}
  <div class="m"><b class="n">${esc(s.n)}</b><div class="r">${o.lock?`<small class="how">${esc(o.how||'')}</small>`:`<span class="rank"><small>Rank</small><b>${pl}</b></span>`}${elBadges(s)}</div></div>
  ${s.ougi?'<span class="c43"><span><b class="tx">奥義</b></span></span>':costHTML('BP '+C.costOf(u,s),lp)}
  ${o.btn||o.lock||o.info?`<button class="sinf" data-a="rsinfo" data-v="${k}" aria-label="詳細">i</button>`:''}</div>`;}
/* 技・術セット（ver0.40）：枠をタップ → 技をタップで入れる／技をタップでセット・外す／枠どうしをタップで並べ替え。
   選択中の枠・技は SPK に持つ（画面を描き直しても残る） */
const SPK={id:null,slot:null,sk:null};
function skillsHTML(id){if(SPK.id!==id){SPK.id=id;SPK.slot=SPK.sk=null;}
 const set=C.setOf(id),L=C.learned(id),all=(D.LEARN[id]||[]).map(x=>x[0]),lock=all.filter(k=>!L.includes(k)),pend=SPK.slot!=null||SPK.sk!=null;
 return`<div class="sh22">技・術セット <small>${set.length}/4　タップで付け外し</small></div>
  <div class="rsset s41${pend?' pend':''}">${[0,1,2,3].map(i=>{const k=set[i],s=k&&SK[k],sel=SPK.slot===i?' sel':'';return s?`<button class="sl on${sel}" data-a="rsslot" data-v="${i}">${skIcon(id,s,1)}<b>${esc(s.n)}</b></button>`:`<button class="sl${sel}" data-a="rsslot" data-v="${i}"><span class="ski em">＋</span><b>&nbsp;</b></button>`;}).join('')}</div>
  <div class="sh22">覚えている技・術 <small>${L.length}種</small></div><div class="skl40 skl41${pend?' pend':''}">${L.map(k=>skCard(id,k,{set:set.includes(k),i:set.indexOf(k),btn:1,pend:SPK.sk===k,how:C.howTxt(id,k)})).join('')}</div>
  ${lock.length?`<div class="sh22">まだ覚えていない</div><div class="skl41">${lock.map(k=>skCard(id,k,{lock:1,how:C.howTxt(id,k)})).join('')}</div>`:''}`;}
/* 枠 i に技 k を入れる（k が別の枠にあれば入れ替え） */
function putSet(id,i,k){const h=G.h[id],a=C.setOf(id).slice(),j=a.indexOf(k);
 if(j>=0){if(i<a.length){[a[i],a[j]]=[a[j],a[i]];}else{a.splice(j,1);a.push(k);}}else if(i<a.length)a[i]=k;else a.push(k);h.sset=a.slice(0,4);}
function tapSlot(id,i){const a=C.setOf(id);
 if(SPK.sk){putSet(id,i,SPK.sk);SPK.sk=SPK.slot=null;return;}
 if(SPK.slot===i){if(a[i])G.h[id].sset=a.filter((_,j)=>j!==i);SPK.slot=null;return;}
 if(SPK.slot!=null&&a[SPK.slot]&&a[i]){const b=a.slice();[b[SPK.slot],b[i]]=[b[i],b[SPK.slot]];G.h[id].sset=b;SPK.slot=null;return;}
 SPK.slot=i;}
function tapSkill(id,k){const a=C.setOf(id);
 if(SPK.slot!=null){putSet(id,SPK.slot,k);SPK.slot=SPK.sk=null;return;}
 if(SPK.sk===k){SPK.sk=null;return;}
 if(a.includes(k)){G.h[id].sset=a.filter(x=>x!==k);return;}
 if(a.length<4){G.h[id].sset=a.concat(k);return;}
 SPK.sk=k;}
/* アビリティのタブ（ver0.44）：名前と段階だけを並べ、タップで別の窓に詳細（abInfo） */
function abHTML(id){const h=G.h[id];let wp=null,w=null;try{w=h.eq.w&&findItem(h.eq.w);wp=V20.wpOf(w);}catch(e){}
 return`${(D.AB[id]||[]).map((A,i)=>{const r=C.abRank(id,i),lv0=D.ABL[i];
   return`<div class="rsab a44${r?'':' lock'}" data-a="rsab" data-v="${i}"><div class="h"><i class="n">${i+1}</i><b>${esc(A.n)}</b>${stars(r)}<em>${r?'段階'+RK[r]:'Lv'+lv0+'で解放'}</em><i class="ar44">›</i></div></div>`;}).join('')}
  <div class="rsab a44${wp?'':' lock'}" data-a="rsab" data-v="w"><div class="h"><i class="n">武</i><b>${wp?esc(wp.n):'武器アビリティなし'}</b><i class="ar44">›</i></div></div>`;}
/* アビリティの詳細（ver0.45：3 段階。いまの効果・次の段階で増えるもの・段階Ⅲの固有名の特殊効果【…】。用語は緑でタップできる） */
function abInfo(id,v,back){const h=G.h[id];let top,list,sub='',nx=[],spb='';
 if(v==='w'){let wp=null;try{wp=V20.wpOf(h.eq.w&&findItem(h.eq.w));}catch(e){}top=`<i class="n">武</i><b>${wp?esc(wp.n):'武器アビリティなし'}</b>`;list=[wp?wp.d:'アンコモン以上の武器に付く'];}
 else{const i=+v,A=D.AB[id][i],r=C.abRank(id,i),lv0=D.ABL[i],ups=C.abUps(id);top=`<i class="n">${i+1}</i><b>${esc(A.n)}</b>${stars(r)}<em>${r?'段階'+RK[r]:'未解放'}</em>`;
  list=C.abDesc(id,i,Math.max(1,r));nx=r&&r<3?C.abNext(id,i,r):[];
  if(A.sp)spb=`<div class="sp45${r>=3?' on':''}"><div class="t"><em>段階Ⅲ</em>${KW.mark('【'+esc(A.sp.n)+'】')}${r>=3?'':'<small>未解放</small>'}</div><p>${KW.markT(A.sp.d)}</p></div>`;
  sub=`Lv${lv0}でⅠ・Lv${lv0+20}でⅡ・Lv${lv0+40}でⅢ（星盤・天星盤の強化で早まる）${ups[i+1]?`　強化 +${ups[i+1]}`:''}`;}
 ovOpen(`<div class="ski43 ab44"><div class="abh">${top}</div><div class="dsc"><ul>${list.map(t=>`<li>${KW.markT(t)}</li>`).join('')}</ul>
  ${nx.length?`<div class="nx45"><em>次の段階</em><ul>${nx.map(t=>`<li>${KW.markT(t)}</li>`).join('')}</ul></div>`:''}${spb}${sub?`<p class="sub">${sub}</p>`:''}</div></div>
  <button class="tbtn back wide" data-a="close">閉じる</button>`,{close:()=>{ovClose();if(back)back();}});}
function awHTML(id){const h=G.h[id],A=AW[id],Xw=D.AWX[id],lv=h.awLv||1,nx=lv+1,req=nx===2?15:30,ok=lv<3&&h.lv>=req,ou=Xw&&SK[Xw.ou],ef=C.awEffects(id);
 return`<div class="aw22" style="--ec:${elCol(id)}"><div class="ah"><img src="${art(id,true)}" alt=""><div><small>${SEIRIN.n}</small><b>《${esc(A.name)}》</b><span class="rk">${'<i class="on"></i>'.repeat(lv)}${'<i></i>'.repeat(3-lv)}<em>位階${ROMAN[lv]}</em></span></div></div>
  <ul class="rsaw">${(Xw?Xw.note:[]).map(t=>`<li>${KW.markT(t)}</li>`).join('')}${ef.map(e=>`<li>${KW.markT(C.effTxt(e))}</li>`).join('')}</ul>
  <dl class="dl22"><dt>持続</dt><dd>${awN({id,awTurn:(stats(id).awTurn||0),awLv:lv})}ターン</dd><dt>発動</dt><dd>${SEIRIN.g}100%（行動を消費しない）</dd></dl>
  ${lv<3?`<button class="tbtn${ok?' gold':''} wide" data-a="tr" ${ok?'':'disabled'}>${SEIRIN.n}の試練<small>${ok?'挑戦できる':`Lv${req}で挑戦できる`}</small></button>`:''}</div>
  <div class="sh22">奥義 <small>${SEIRIN.n}中に1度・BP 0　タップで詳細</small></div>${ou?skCard(id,Xw.ou,{info:1}):''}`;}
/* 能力：7 能力値（役割つき）＋ HP・LP・BP ＋ アビリティ */
/* 能力：7 能力値・武器種・LP・BP。説明は出さず、タップで詳細（V38H の吹き出し） */
function st7HTML(id){const s=stats(id),r=s.s7;if(!r)return'';const P=C.pf(id),H=D.HERO[id]||{};
 return`<div class="st38"><button class="w" data-h38="wp:${id}"><b>${esc(P.wp)}${H.shape?`<small>（形：${esc(H.shape)}）</small>`:''}</b><small>武器種</small><i class="q"></i></button>
  <div class="lb"><button data-h38="lp:${id}"><em>LP</em><b>${s.lpMax}</b><i class="q"></i></button><button data-h38="bp:${id}"><em>BP</em><b>${s.bp0}<small>初期</small></b><b>${s.bpMax}<small>最大</small></b><b>+${s.bpReg+Math.min(2,Math.floor((s.spGain||0)/5))}<small>回復</small></b><i class="q"></i></button></div>
  <div class="g7">${D.ST7.map(k=>`<button class="r${P.w[k]?' wp':''}" data-h38="st:${id}:${k}"><span><i class="g${P.base[k][1]}">${P.base[k][1]}</i>${D.ST7N[k]}</span><b>${r[k]}</b></button>`).join('')}</div>${ELR.row(id)}</div>`;}
/* キャラ詳細のタブ：能力（能力値＋人物）・アビリティ（ver0.41 で別タブ）・技・術・星臨（装備は上の枠）。星盤は下の「星盤」ボタンで開く（ver0.39 でタブを統合） */
const TABS=[['st','能力'],['ab','アビリティ'],['sk','技・術'],['aw',SEIRIN.n]];
{const _ch=charHTML;charHTML=function(id,tab,ed){if(tab==='eq'||tab==='bd')tab='st';const mine=tab==='sk'||tab==='aw'||tab==='ab';let s=_ch(id,mine?'__':tab,ed);
 try{if(mine)s=s.replace('<div class="cbody"></div>',`<div class="cbody c22 rs37">${tab==='sk'?skillsHTML(id):tab==='ab'?abHTML(id):awHTML(id)}</div>`);
  if(tab==='st'){const i=s.indexOf('<div class="cnote">');const add=st7HTML(id);/* 人物の紹介は図鑑に（ver0.43） */s=i>=0?s.slice(0,i)+add+s.slice(i):s+add;}
  s=s.replace(/<div class="ctabs[^"]*">[\s\S]*?<\/div>/,`<div class="ctabs c22 rs37 t38">${TABS.map(([k,l])=>`<button class="${tab===k?'on':''}" data-a="tab" data-v="${k}">${l}</button>`).join('')}</div>`);
  s=s.replace(/パッシブ/g,'アビリティ');}catch(e){console.error(e);}
 return s;};}
function acts(o,id,re,back){o.rsab=v=>abInfo(id,v,back);o.rsslot=i=>{tapSlot(id,+i);save();re();};o.rsk=k=>{tapSkill(id,k);save();re();};o.rsinfo=k=>info(SK[k],{id,side:0});}
/* 描き直しても、下の欄のスクロール位置を保つ */
const keepScroll=(sel,f)=>{const el=$(sel),y=el?el.scrollTop:0;f();const e2=$(sel);if(e2)e2.scrollTop=y;};
{const _em=equipMenu;equipMenu=function(id,m){if(CTAB==='eq')CTAB='st';_em(id,m);try{const cid=G.members.includes(id)?id:G.party[0];acts(ACT,cid,mm=>keepScroll('#cmd',()=>equipMenu(cid,mm)));}catch(e){console.error(e);}};}
{const _os=openSheet;openSheet=function(id,tab){_os(id,tab);try{const cid=G.members.includes(id)?id:G.party[0];acts(SACT,cid,()=>keepScroll('#sheet .swin',()=>openSheet(cid)),()=>openSheet(cid));}catch(e){console.error(e);}};}

return{info,skillsHTML,abHTML,awHTML,st7HTML,canAw,basicName};})();
