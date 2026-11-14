/* ===== ver0.34 演出の設定・星臨演出の長さ・演出ビューア =====
 1. 設定（CFGX）：設定画面に「星臨演出（通常／短縮／省略）」「演出の品質」「画面の揺れ」「点滅」を足す
 2. 星臨演出の長さ：短縮・省略のあいだ、演出の待ち時間をまとめて縮める（BX.scaled）
 3. 演出ビューア（BXV）：開発者メニューから開く。味方の技・敵の行動・星臨・状態を、相手と速度を選んで何度でも再生する
    ・戦闘そのものを使う（startBattle の opts.viewer）。手番は進めず、ビューアが選んだ行動だけを実行する
    ・行動のたびに全員の HP・SP を戻すので、誰も倒れない
    ・自動点検（tools/smoke.js --fx）からは BXV.play({t:'sk',hero,id}) を呼ぶ */
'use strict';
/* ---------- 1. 設定 ---------- */
const CFGX={
 html(seg){const s=BX.set();return`
 <div class="cfr"><label>星臨演出<small>星臨したときの演出の長さ</small></label>${seg('fxaw',[['full','通常'],['short','短縮'],['skip','省略']],s.aw)}</div>
 <div class="cfr"><label>演出の品質<small>自動：動きが重いときに粒を減らす</small></label>${seg('fxq',[['auto','自動'],['high','高'],['std','標準'],['low','低負荷']],s.q)}</div>
 <div class="cfr"><label>画面の揺れ</label>${seg('fxsh',[[2,'あり'],[1,'控えめ'],[0,'なし']],s.shake)}</div>
 <div class="cfr"><label>画面の点滅<small>強い光を弱める</small></label>${seg('fxfl',[[1,'あり'],[0,'控えめ']],s.flash)}</div>`;},
 acts(re){const s=BX.set();return{fxaw:v=>{s.aw=v;re();},fxq:v=>{s.q=v;re();},fxsh:v=>{s.shake=+v;re();},fxfl:v=>{s.flash=+v;re();}};}};

/* ---------- 2. 星臨演出の長さ ---------- */
{const _aw=awaken;awaken=async function(u){const m=BX.set().aw;if(m==='full'||!B||scene!=='battle')return _aw(u);
  const app=document.querySelector('#app');app.classList.add(m==='skip'?'bx-awskip':'bx-awshort');
  try{return await BX.scaled(m==='skip'?.06:.45,()=>_aw(u));}finally{app.classList.remove('bx-awskip','bx-awshort');}};}

/* ---------- 3. 演出ビューア ---------- */
const BXV=(()=>{
const $q=s=>document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms));
let on=false,busy=false,req=null,prevParty=null,st={tab:'hero',hero:'rio',sk:'atk',ek:'slime',ea:'claw',n:1,loop:false,low:false};
const hero=()=>B&&B.heroes.find(h=>h.id===st.hero)||B&&B.heroes[0],foe=()=>B&&B.enemies[0];
const awCmd=id=>Object.keys(AW).find(h=>(AW[h].cmds||[]).includes(id));
function restore(){if(!B)return;B.over=false;
 for(const h of B.heroes){h.alive=true;h.hp=st.low&&h.id===st.hero?Math.max(1,Math.round(h.mhp*.2)):h.mhp;h.sp=h.msp||h.sp;h.guard=false;h.kenshu=false;h._act=null;if(h.A&&h.A.act)ANIM.idle(h,200);}
 for(const e of B.enemies){e.alive=true;e.hp=e.mhp;e.charging=false;e.fade=0;e._act=null;}
 try{refresh();}catch(e){}}
function start(){on=true;if(!prevParty)prevParty=G.party.slice();
 const rest=Object.keys(HB).filter(id=>id!==st.hero&&G.members.includes(id));G.party=[st.hero,...rest.slice(0,3)];for(const id of G.party)if(G.h[id])G.h[id].hp=null;
 const boss=!!ED[st.ek].boss;auto=false;
 startBattle(Array.from({length:boss?1:st.n},()=>({kind:st.ek,lv:30})),{viewer:true,boss,onEnd(){}});
 B.intro=0;for(const h of B.heroes)h.awLv=h.awLv||3;restore();panel();}
/* 行動 1 回ぶん。r＝{t:'sk'|'ea'|'aw'|'awoff'|'state', …} */
async function exec(r){const h=hero(),e=foe();if(!h||!e)return;
 if(r.t==='sk'){const id=r.id,sk=id==='atk'?ATK(h):id==='guard'?GUARD:SK[id];if(!sk)return;h.sp=9999;
  if(awCmd(id)&&!h.aw){h.aw=true;h.awT=0;h.ag=100;h.charged=1;h.store=Math.max(h.store||0,300);}
  const tg=sk.t==='ally'?(B.heroes[1]||h):sk.t==='self'?h:e;await doAction(h,sk,tg);}
 else if(r.t==='ea'){const d=ED[e.kind],sv={ai:d.ai,acts:d.acts};d.ai=null;d.acts=[[r.id,1]];try{await enemyTurn(e);}finally{d.ai=sv.ai;d.acts=sv.acts;}}
 else if(r.t==='aw'){if(h.aw)endAw(h,true);h.ag=100;await awaken(h);}
 else if(r.t==='awoff'){if(h.aw)endAw(h,true);}
 else if(r.t==='state'){if(r.v==='hit')await hit(e,h,EA.claw);else if(r.v==='low')st.low=!st.low;else if(r.v==='guard')await doAction(h,GUARD,h);else if(r.v==='down'){await kill(h);await sleep(1400);}}}
const cap=(p,ms)=>Promise.race([p,sleep(ms).then(()=>'timeout')]);
/* 手番の代わり：次の依頼が来るまで待ち、実行して全員を戻す */
async function turn(){while(on&&B&&!B.over){if(!req){await sleep(50);continue;}const r=req;req=null;busy=true;stat();let res;
  try{res=await cap(exec(r),r.cap||20000);}catch(x){console.error('BXV',r,x);res='error:'+x.message;}
  busy=false;if(!on||!B)break;if(r.t!=='state'||r.v!=='down')restore();else{await sleep(200);restore();}
  if(r.done)r.done(res);if(st.loop&&!req&&r.t!=='aw'&&!r.done){await sleep(450*SPD[speed]);if(st.loop&&!req&&on)req=r;}stat();return;}}
{const _h=heroTurn;heroTurn=async function(u){if(B&&B.opts&&B.opts.viewer&&!busy)return turn();return _h(u);};
 const _e=enemyTurn;enemyTurn=async function(u){if(B&&B.opts&&B.opts.viewer&&!busy)return turn();return _e(u);};}
/* 外から 1 回再生する（自動点検用）。終わるか時間切れで結果を返す */
function play(r){return new Promise(res=>{if(!on||!B||B.over){res('closed');return;}req=Object.assign({},r,{done:res});});}
function close(){on=false;req=null;const el=$q('#bxv');if(el)el.remove();if(B)B.over=true;BX.clear();if(prevParty){G.party=prevParty;prevParty=null;}
 setTimeout(()=>{try{enterTown('開発：演出ビューアを閉じた');setTimeout(()=>{try{dvMenu();}catch(e){}},60);}catch(e){}},120);}

/* ---------- 画面 ---------- */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function heroSkills(id){const own=['atk','guard'];try{for(const k of HB[id].skills||[])own.push(k);}catch(e){}try{for(const[,k]of(V20.LSK[id]||[]))if(!own.includes(k))own.push(k);}catch(e){}
 try{const h=B&&B.heroes.find(x=>x.id===id);for(const k of(h&&h.skills)||[])if(typeof k==='string'&&SK[k]&&!own.includes(k))own.push(k);}catch(e){}
 try{for(const k of AW[id].cmds||[])if(!own.includes(k))own.push(k);}catch(e){}return own;}
const skName=k=>k==='atk'?'通常攻撃':k==='guard'?'防御':(SK[k]?SK[k].n:k);
const has=(who,k)=>!!(BXS.REG[who+':'+k]||BXS.REG[k]);
function panel(){let el=$q('#bxv');if(!el){el=document.createElement('div');el.id='bxv';$q('#app').appendChild(el);
  el.addEventListener('change',onChange);el.addEventListener('click',onClick);}
 const own=heroSkills(st.hero),all=Object.keys(SK).filter(k=>!own.includes(k)),e=foe(),kinds=Object.keys(ED);
 const opt=(v,l,cur)=>`<option value="${esc(v)}"${String(v)===String(cur)?' selected':''}>${esc(l)}</option>`;
 const tab=(k,l)=>`<button data-tab="${k}" class="${st.tab===k?'on':''}">${l}</button>`;
 let body='';
 if(st.tab==='hero')body=`<div class="r"><select data-k="hero">${Object.keys(HB).map(id=>opt(id,HB[id].name,st.hero)).join('')}</select>
   <select data-k="sk"><optgroup label="このキャラの技">${own.map(k=>opt(k,(has(st.hero,k)?'★':'')+skName(k),st.sk)).join('')}</optgroup><optgroup label="すべての技">${all.map(k=>opt(k,(has(st.hero,k)?'★':'')+SK[k].n,st.sk)).join('')}</optgroup></select>
   <button data-a="play" class="go">▶ 再生</button></div>
   <div class="r"><button data-a="aw">星臨する</button><button data-a="awoff">星臨を解く</button><button data-a="loop" class="${st.loop?'on':''}">くり返し</button></div>`;
 else if(st.tab==='enemy')body=`<div class="r"><select data-k="ea">${Object.keys(EA).map(k=>opt(k,(has(st.ek,'ea:'+k)?'★':'')+EA[k].n+'（'+k+'）',st.ea)).join('')}</select><button data-a="playea" class="go">▶ 再生</button><button data-a="loop" class="${st.loop?'on':''}">くり返し</button></div>`;
 else body=`<div class="r"><button data-a="s:hit">被弾</button><button data-a="s:guard">防御</button><button data-a="s:low" class="${st.low?'on':''}">瀕死</button><button data-a="s:down">戦闘不能</button></div>`;
 el.innerHTML=`<div class="h"><b>演出ビューア</b>${tab('hero','味方の技')}${tab('enemy','敵の行動')}${tab('state','状態')}<button data-a="close" class="x">✕</button></div>${body}
  <div class="r"><label>相手</label><select data-k="ek">${kinds.map(k=>opt(k,ED[k].name+(ED[k].boss?'★':''),st.ek)).join('')}</select>
   <span class="sg">${[1,2,3].map(n=>`<button data-a="n:${n}" class="${st.n===n?'on':''}">${n}体</button>`).join('')}</span>
   <span class="sg">${[1,2].map(v=>`<button data-a="spd:${v}" class="${speed===v?'on':''}">×${v}</button>`).join('')}</span></div>
  <div class="r"><label>星臨演出</label><span class="sg">${[['full','通常'],['short','短縮'],['skip','省略']].map(([v,l])=>`<button data-a="awm:${v}" class="${BX.set().aw===v?'on':''}">${l}</button>`).join('')}</span>
   <label>品質</label><span class="sg">${[['auto','自動'],['high','高'],['std','標準'],['low','低']].map(([v,l])=>`<button data-a="q:${v}" class="${BX.set().q===v?'on':''}">${l}</button>`).join('')}</span></div>
  <div class="s" id="bxvs"></div>`;stat();}
function stat(){const s=$q('#bxvs');if(!s)return;const k=st.tab==='enemy'?'ea:'+st.ea:st.sk,who=st.tab==='enemy'?st.ek:st.hero,c=BX.count;
 s.textContent=(busy?'再生中… ':'')+(st.tab==='state'?'':(has(who,k)?'★ 専用の演出あり':'従来の振り付け')+'　')+`登録 ${BXS.n} 件　${Math.round(BX.fps)}fps・品質 ${BX.tier}・粒 ${c.parts}`;}
setInterval(()=>{if(on)stat();},500);
function onChange(ev){const k=ev.target.dataset.k;if(!k)return;st[k]=ev.target.value;if(k==='hero'){st.sk='atk';st.low=false;start();}else if(k==='ek')start();else stat();}
function onClick(ev){const b=ev.target.closest('button');if(!b)return;try{SFX.sel();}catch(e){}
 if(b.dataset.tab){st.tab=b.dataset.tab;panel();return;}const a=b.dataset.a||'',[c,v]=a.split(':');
 if(c==='close')return close();if(c==='play')req={t:'sk',id:st.sk};else if(c==='playea')req={t:'ea',id:st.ea};else if(c==='aw'||c==='awoff')req={t:c};
 else if(c==='s'){req={t:'state',v};if(v==='low'){st.low=!st.low;req=null;restore();}}
 else if(c==='loop')st.loop=!st.loop;else if(c==='n'){st.n=+v;start();return;}else if(c==='spd')setSpeed(+v);else if(c==='awm')BX.set().aw=v;else if(c==='q')BX.set().q=v;
 if((c!=='play'&&c!=='playea'&&c!=='aw'&&c!=='awoff'&&c!=='s')||v==='low')panel();}
function open(o){Object.assign(st,o||{});if(!G.members.includes(st.hero))st.hero=G.party[0];start();}
{const _dv=dvMenu;dvMenu=function(m){_dv(m);try{addCmd('ver0.34 演出ビューア','味方の技・敵の行動・星臨・状態を何度でも再生',()=>open(),0,'ready');}catch(e){}};}
return{open,close,play,start,get on(){return on;},get busy(){return busy;},st,heroSkills};})();
