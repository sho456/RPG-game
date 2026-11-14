/* ===== ver0.34 技の演出の台帳と再生（BXS） =====
 技 1 つ＝データ 1 件。「予備動作 → 発動（1 撃ごと） → 命中 → 余韻」を、時刻つきの手順の列で書く。

 ■ 登録
   BXS.def('koujin', {...})            技 id（SK のキー）
   BXS.def('rio:atk', {...})           キャラの通常攻撃（'atk' は全員共通）
   BXS.def('ea:claw', {...})           敵の行動（EA のキー）。'slime:ea:claw' のように敵の種類で上書きできる
   探す順：'キャラ:技' ＞ '技' ＞ 'キャラ:cat:区分' ＞ 'cat:区分'。無ければ従来の振り付け（js/ver19.js）のまま動く

 ■ 定義
   kind   'melee' 相手の前まで走る（stay:1 で 2 体目からは走らない）／'cast' その場で放つ／'shoot' その場で撃つ／'self' 命中の無い技（回復・補助）
   big    1 で大技（ヒットストップが長い）
   pre    {ms, do:[手順…]}   予備動作（行動の最初に 1 回）
   strike {ms, do:[…]}       1 撃ぶんの動き。終わった瞬間が命中。配列なら連撃で順に使う。関数 (ctx)=>{ms,do} も可
   impact [手順…]            命中の瞬間（対象の位置で出す）。関数 (ctx)=>[…] も可
   after  {ms, do:[…]}       余韻（行動の最後に 1 回）

 ■ 手順 [時刻ms, 種類, …]
   ['pose', ポーズ, ms, ease]            行動者のポーズ（{f:'lunge'} のように絵の名前を直接書ける）
   ['move', {to:'near'|'home'|'fwd'|'back', d, hop}, ms, ease]
   ['fx', 部品名, {on, dx, dy, …}]       部品（js/battle/prim.js）。on＝'a' 行動者 'af' 足元 'ah' 頭上／'t' 'tf' 'th' 対象／
                                         'ts' 対象全員 'hs' 味方全員 'es' 敵全員／'c' 中央。dx は「前」への距離
   ['cam', {z, on}, ms] ['camreset', ms] ['shake', n] ['flash', 色, n] ['dim', 濃さ, ms] ['tint', 色, 濃さ, ms] ['bars', 0|1]
   ['stop', ms]（ヒットストップ） ['sfx', 名前] ['ghost', {col,n,gap}] ['call', (ctx)=>{}]
   ctx＝{a 行動者, t 対象, sk 技, n 何撃目, dir 前の向き, r 命中の結果（crit・weak）, d ダメージ} */
'use strict';
const BXS=(()=>{
const T=ms=>ANIM.T(ms),REG={};
function def(key,d){REG[key]=Object.assign({key},d);return d;}
/* ---------- 技 → キー ---------- */
let NM=null;
function keyOf(sk){if(!sk)return null;if(sk.basic)return'atk';let k=null;try{k=MOTION.skKey(sk);}catch(e){}if(k)return k;
 if(!NM){NM=new Map();try{for(const i in EA)if(!NM.has(EA[i].n))NM.set(EA[i].n,'ea:'+i);}catch(e){}try{for(const i in SK)if(!NM.has(SK[i].n))NM.set(SK[i].n,i);}catch(e){}}
 return NM.get(sk.n)||null;}
const whoOf=u=>u.side===0?u.id:String(u.kind||u.spr||'').replace(/^vo_/,'');
function find(u,sk){if(!u||!sk)return null;const who=whoOf(u),key=keyOf(sk);if(key){if(REG[who+':'+key])return REG[who+':'+key];if(REG[key])return REG[key];}
 let cat=null;try{cat=TERMS.skillCat(sk,u.side===0?u.id:null);}catch(e){}if(cat){if(REG[who+':cat:'+cat])return REG[who+':cat:'+cat];if(REG['cat:'+cat])return REG['cat:'+cat];}return null;}

/* ---------- 手順の実行 ---------- */
const MIR=['a0','a1','ang'];
function spots(on,ctx){const{a,t}=ctx,one=(u,w)=>[BX.at(u,w)];
 switch(on){case'a':return one(a);case'af':return one(a,'foot');case'ah':return one(a,'head');case't':return one(t);case'tf':return one(t,'foot');case'th':return one(t,'head');
  case'ts':return(ctx.ts&&ctx.ts.length?ctx.ts:[t]).filter(Boolean).map(u=>BX.at(u));case'tsf':return(ctx.ts&&ctx.ts.length?ctx.ts:[t]).filter(Boolean).map(u=>BX.at(u,'foot'));
  case'hs':return B.heroes.filter(h=>h.alive).map(u=>BX.at(u));case'hsf':return B.heroes.filter(h=>h.alive).map(u=>BX.at(u,'foot'));
  case'es':return B.enemies.filter(h=>h.alive).map(u=>BX.at(u));case'esf':return B.enemies.filter(h=>h.alive).map(u=>BX.at(u,'foot'));
  case'c':return[[W/2,H/2]];default:return one(t||a);}}
function fx(name,o,ctx,dflt){const f=BXP[name];if(!f)return;o=o||{};const d=ctx.dir,ps=spots(o.on||dflt,ctx);
 ps.forEach(([x,y],i)=>{const q=Object.assign({},o,{dir:o.dir==null?d:o.dir*(d===1?-1:1)});if(d===1&&o.mirror!==0)for(const k of MIR)if(q[k]!=null)q[k]=3.1416-q[k];
  if(o.to){const tp=typeof o.to==='string'?spots(o.to,ctx)[0]:[x+o.to[0]*d,y+o.to[1]];q.to=[tp[0]+(o.tdx||0)*d,tp[1]+(o.tdy||0)];}
  if(o.from&&typeof o.from==='string'){const fp=spots(o.from,ctx)[0];q.from=[fp[0]+(o.fdx||0)*d,fp[1]+(o.fdy||0)];}
  if(o.each)q.delay=(q.delay||0)+i*o.each;f(x+(o.dx||0)*d,y+(o.dy||0),q);});}
function exec(s,ctx,dflt){const a=ctx.a,ty=s[1];
 switch(ty){
  case'pose':ANIM.to(a,s[2]||{},s[3]||100,s[4]||'out');break;
  case'tpose':if(ctx.t)ANIM.to(ctx.t,s[2]||{},s[3]||100,s[4]||'out');break;
  case'idle':ANIM.idle(a,s[2]||160);break;
  case'move':{const m=s[2]||{},A=a.A;if(!A||A.none)break;let x=A.wx,y=A.wy;
   if(m.to==='near'&&ctx.t)[x,y]=V19.near(a,ctx.t);else if(m.to==='home'){x=0;y=0;}else if(m.to==='fwd')x=A.wx+ctx.dir*(m.d||8);else if(m.to==='back')x=A.wx-ctx.dir*(m.d||8);
   if(m.dy)y+=m.dy;ANIM.move(a,x,y,s[3]||160,s[4]||'out',m.hop||0);break;}
  case'fx':fx(s[2],s[3],ctx,dflt);break;
  case'cam':{const o=s[2]||{},p=spots(o.on||dflt,ctx)[0];BX.cam.to({z:o.z||1.1,x:p[0],y:p[1]},s[3]||200,o.ease);break;}
  case'punch':{const o=s[2]||{},p=spots(o.on||dflt,ctx)[0];BX.cam.punch({z:o.z||1.08,x:p[0],y:p[1]},s[3]||240);break;}
  case'camreset':BX.cam.reset(s[2]||220);break;
  case'shake':BX.shake(s[2]||6);break;
  case'flash':BX.flash(s[2]||'#ffffff',s[3]||8);break;
  case'dim':BX.dim(s[2]||0,s[3]||200);break;
  case'tint':BX.tint(s[2]||'#ffffff',s[3]==null?.3:s[3],s[4]||300);break;
  case'bars':BX.bars(s[2]);break;
  case'stop':ANIM.stop(s[2]||40);break;
  case'sfx':try{SFX[s[2]]&&SFX[s[2]]();}catch(e){}break;
  case'ghost':BX.ghost(a,s[2]||{});break;
  case'call':s[2](ctx);break;}}
const pick=(v,ctx)=>{let p=v;if(Array.isArray(p)&&p.length&&!Array.isArray(p[0])&&typeof p[0]==='object')p=p[(ctx.n-1+p.length*99)%p.length];return typeof p==='function'?p(ctx):p;};
/* 手順の列を時刻どおりに流し、ms 経ったら終わる。途中で失敗しても必ず終わる */
async function play(ph,ctx,dflt){ph=pick(ph,ctx);if(!ph)return;const steps=(typeof ph.do==='function'?ph.do(ctx):ph.do)||[],ord=steps.slice().sort((p,q)=>p[0]-q[0]);let t=0;
 for(const s of ord){if(s[0]>t){await T(s[0]-t);t=s[0];}try{exec(s,ctx,dflt);}catch(e){console.error('BXS',ctx.def&&ctx.def.key,s[1],e);}}
 const ms=typeof ph.ms==='function'?ph.ms(ctx):ph.ms||0;if(ms>t)await T(ms-t);}
/* 命中の手順は待たない（時刻だけ守って流す） */
function fire(steps,ctx,dflt){steps=pick(steps,ctx);if(!steps)return;if(!Array.isArray(steps))steps=steps.do||[];const c2=Object.assign({},ctx);
 for(const s of steps){if(!s[0]){try{exec(s,c2,dflt);}catch(e){console.error('BXS',ctx.def&&ctx.def.key,s[1],e);}}else setTimeout(()=>{if(typeof B!=='undefined'&&B&&!B.over||ctx.viewer)try{exec(s,c2,dflt);}catch(e){}},s[0]*ANIM.SP());}}
const cap=(p,ms)=>Promise.race([p,new Promise(r=>setTimeout(r,ms))]);

/* ---------- ver0.19 の振り付けへの差し込み（V19.ext） ---------- */
const mk=(a,t,sk,d)=>({a,t,sk,def:d,n:0,dir:BX.dir(a),ts:null,r:null,d:0});
const tgOf=(u,sk,t)=>{const es=u.side===0?B.enemies.filter(e=>e.alive):B.heroes.filter(e=>e.alive);return sk.t==='all'?es[0]:(t&&t.alive?t:es[0]);};
const LIVE=new Set();/* 台帳の演出で動いている最中のユニット（その間、文字ポップに付く汎用エフェクトは出さない） */
async function pre(u,sk,t,c){const d=c.bx,ctx=c.ctx=mk(u,t,sk,d);LIVE.add(u);
 if(d.kind==='self'){ctx.t=t&&t.alive?t:u;if(sk.t==='all'||sk.t==='ally'&&!t)ctx.ts=B.heroes.filter(h=>h.alive);await cap(play(d.pre,ctx,'a'),6000);return;}
 const es=u.side===0?B.enemies.filter(e=>e.alive):B.heroes.filter(e=>e.alive);ctx.ts=sk.t==='all'?es:null;const tg=tgOf(u,sk,t);ctx.t=tg;const jobs=[];
 if(d.kind==='melee'&&tg){c.last=tg;jobs.push(V19.dash(u,tg,d.dashMs||200));}
 if(d.pre)jobs.push(play(d.pre,ctx,'a'));
 c.ready=cap(Promise.all(jobs),6000);}
async function strike(a,t,sk,c){const d=c.bx,ctx=c.ctx||(c.ctx=mk(a,t,sk,d));ctx.t=t;ctx.n=c.n;ctx.hsk=sk;
 if(c.ready){await c.ready;c.ready=null;}else if(d.kind==='melee'&&c.last!==t&&!d.stay)await V19.dash(a,t,110);c.last=t;
 await cap(play(d.strike,ctx,'a'),6000);c.fx={type:'bx',big:d.big};}
function impact(a,t,sk,c,r,dmg){const d=c.bx,ctx=c.ctx;if(!d||!ctx)return;ctx.t=t;ctx.r=r||{};ctx.d=dmg;fire(d.impact,ctx,'t');}
async function after(u,c){const d=c.bx;try{if(d.after)await cap(play(d.after,c.ctx,'a'),6000);}finally{LIVE.delete(u);BX.cam.reset(200);BX.dim(0,200);BX.bars(0);}}
V19.ext={find,pre,strike,impact,after,popFx:()=>LIVE.size>0};
{const _sb=startBattle;startBattle=function(list,opts={}){BX.clear();LIVE.clear();return _sb(list,opts);};}
return{def,find,keyOf,REG,play,fire,exec,get n(){return Object.keys(REG).length;}};})();
