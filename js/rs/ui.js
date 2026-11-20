/* ===== 戦闘システムの画面 =====
 1. 戦闘のコマンド入力（RS 風）：行動するキャラの顔・HP/LP/BP の帯・技の一覧（通常攻撃＋セットした 4 つ＋奥義）。
    下の段に「戻る（前のキャラ）・道具・交代」。技はタップで指を動かし、もう 1 回タップで決定（ver0.40）。ⓘ で詳細
 2. 下のボタン：通常AUTO・全力AUTO・リピート（速度は画面上のボタンだけ）
 3. キャラ詳細：能力（7 能力値＋アビリティ）・技・術（技セット）・星臨（星臨アビリティと奥義）・星盤
 戦場の配置・スライド演出・上の帯は js/v38/battle-ui.js、編成画面は js/v38/party.js */

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
   <div class="g"><div><em>威力</em><b>${s.rk||(s.basic?'D':s.ougi?'奥':'-')}</b></div><div><em>練達</em><b>${pl?RSM.RK[pl]:'-'}</b></div><div class="two"><span><em>BP</em><b>${cost}</b></span><i></i><span><em>LP</em><b>${lp||'-'}</b></span></div></div></div></div>
  <div class="dsc"><p class="tgs">${esc(tags)}</p><p>${KW.markT(s.d||'')}</p>
   ${hint?`<p class="sub">${hint}</p>`:''}</div>${id&&k&&HB[id]&&G.h[id]&&C.learned(id).includes(k)?RSM.html(id,k):''}</div>
  <button class="tbtn back wide" data-a="close">閉じる</button>`,{close:ovClose,mas:()=>{const why=RSM.up(id,k);if(why){try{toastMsg(why);}catch(e){}return;}try{SFX.aw();}catch(e){}info(sk,u);try{if(typeof CTAB!=='undefined'&&CTAB==='sk'&&$('#cmd .rs37'))equipMenu(id);}catch(e){}}});}

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
    o.push({el:e,ec:c,n:s.n,lv:0,sk:s,cost:'BP '+cs,lp,ng:ngB||ngL,dis:ngB||ngL,f:()=>use(s)});});
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
    <div class="c38f"><button data-c38="it" ${sub?'disabled':''}>${GL.bag}<small>道具</small></button><button data-c38="sw" ${rsN&&!u.swapped&&!u.aw&&!sub?'':'disabled'}>${GL.swap}<small>交代</small></button></div></div>`;
   c.scrollTop=0;const l=c.querySelector('.c38l');if(l)l.scrollTop=0;if(B.pick&&B.pick.u===u)B.pick.canBack=idx>0&&!sub&&!lock;try{bbar(true);}catch(e){}};
  B.pick={u,
   row:i=>{const r=R[i];if(!r||r.dis||lock)return;if(!sub&&cur!==i){SFX.sel();mark(i);return;}r.f();},
   info:i=>{const r=R[i];if(r&&r.sk){SFX.sel();info(r.sk,u);}},
   back:()=>{if(lock||sub||idx<=0)return;res({back:1});},
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
/* ver0.49：左端に「戻る」（前のキャラのコマンドへ。以前はコマンド欄の下の段）。AUTO は小さめの濃紺＋金の札 */
const AUI='<svg viewBox="0 0 16 16"><path d="M2 3.2v9.6L8 8zm6 0v9.6L14 8z"/></svg>';
bbar=function(){const b=$('#bbar');if(!b||!G)return;const p=B&&B.pick,l=p&&repOK(p.u),cb=!!(p&&p.canBack&&!auto),sg=[l?l.n:'',auto,AM,G.set.autoAw,cb].join();if(b._s===sg&&b.firstChild)return;b._s=sg;
 b.className='b38';
 b.innerHTML=`<button data-b="back" class="bk" ${cb?'':'disabled'} aria-label="戻る">${GL.back}<small>戻る</small></button><button data-b="n" class="au${auto&&AM==='n'?' on':''}"><i class="ai">${AUI}</i><span class="t"><span class="lt">AUTO</span><b>通常</b></span><small>${SEIRIN.n}：${AWN[G.set.autoAw]}</small></button><button data-b="f" class="au f${auto&&AM==='f'?' on':''}"><i class="ai">${AUI}</i><span class="t"><span class="lt">AUTO</span><b>全力</b></span><small>${SEIRIN.n}も使う</small></button><button data-b="rep" class="rp" ${l?'':'disabled'}>リピート<small>${l?esc(l.basic?'通常攻撃':l.n):'前回と同じ行動'}</small></button>`;};

/* ==================== キャラ詳細 ==================== */

/* 技・術の行（ver0.41：ロマサガRS の技一覧のように「アイコン＋名前＋Rank＋属性」だけ。説明は ⓘ で出す）
   アイコン：js/ui/skill-icons.js（SKICON）の白いシルエット（技の内容ごと）。色は種類（技＝赤・術＝青・回復＝緑・補助＝金・奥義＝虹）
   練達＝錬磨石で 3 段階まで強くする（ver0.47。旧 Rank＝技Lv） */
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

/* 技・術セット（ver0.40）：枠をタップ → 技をタップで入れる／技をタップでセット・外す／枠どうしをタップで並べ替え。
   選択中の枠・技は SPK に持つ（画面を描き直しても残る） */

/* 枠 i に技 k を入れる（k が別の枠にあれば入れ替え） */

/* アビリティのタブ（ver0.44）：名前と段階だけを並べ、タップで別の窓に詳細（abInfo） */

/* アビリティの詳細（ver0.45：3 段階。いまの効果・次の段階で増えるもの・段階Ⅲの固有名の特殊効果【…】。用語は緑でタップできる） */

/* 能力：7 能力値（役割つき）＋ HP・LP・BP ＋ アビリティ */
/* 能力：7 能力値・武器種・LP・BP。説明は出さず、タップで詳細（V38H の吹き出し） */

/* キャラ詳細のタブ：能力（能力値＋人物）・アビリティ（ver0.41 で別タブ）・技・術・星臨（装備は上の枠）。星盤は下の「星盤」ボタンで開く（ver0.39 でタブを統合） */

/* 描き直しても、下の欄のスクロール位置を保つ */

return{};})();
