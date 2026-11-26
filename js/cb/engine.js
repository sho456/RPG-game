/* ===== コマンド戦闘の進行（CBE。ver0.60 で TD の TDS を置き換えた正本）。DOM・描画に触れない純粋なロジック =====
 ロマサガRS 風のターン制：ターンの始めに BP 回復 → 味方全員のコマンドを先に決める → 素早さ順（±ゆらぎ・先制／後発）に敵味方が動く → ターンの終わり（毒・継続回復・強化の残り）。
 技・術・アビリティ・星臨・奥義は旧コマンド RPG のデータ（RSD・SK・RSC.abEffects・RSD.AWX）をそのまま使う。能力値は本編の stats(id)（装備・星盤込み）。
 ステージは TDD.STAGE（章・会話・報酬はそのまま）。TD の WAVE（大群）を 1 戦 4 体までの WAVE に読み替える（wavesOf）。
 見せ方は js/cb/view.js（CB）が act() の返す記録（rec）を時間に並べて再生する。 */
'use strict';
const CBE=(()=>{
const D=RSD,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ST=['atk','def','mag','res','spd','crit'];
const STN={atk:'攻撃',def:'防御',mag:'魔力',res:'精神',spd:'素早さ',crit:'会心'};
const AILN={poison:'毒',stun:'スタン',para:'マヒ',blind:'暗闇'};
/* 乱数（種つき。同じ種なら同じ結果） */
const rng=s=>()=>(s=(s*16807)%2147483647)/2147483647;
const val=e=>+(e.v!=null?e.v:e.r)||0;

/* ==================== 仲間・敵を作る ==================== */
/* 戦闘で使う技・術：覚えている技（最大 5）。セーブが無いとき（計測）は Lv で覚える技 */
function skKeys(id,lv){let L=[];try{L=TDD.skills(id).filter(x=>x.on).map(x=>x.k);}catch(e){}
 if(!L.length)try{L=(D.LEARN[id]||[]).filter(([k,how,l])=>how==='lv'&&l<=lv).map(x=>x[0]);}catch(e){}
 return L.filter(k=>SK[k]).slice(0,5);}
function basicOf(id){const w=D.WPN[D.HERO[id].w]||{};return{n:'通常攻撃',basic:1,k:w.mag?'mag':'phys',el:w.el||'打',pow:1,t:'one',bp:0,_k:'_basic'};}
function hero(id,i,b){const s=stats(id),h0=G.h[id]||{},lv=h0.lv||1,keys=skKeys(id,lv);
 let fx=null;try{fx=TDD.hero(id,lv,Object.assign(TDD.real(id),{sks:keys.length?keys:null}));}catch(e){console.error(e);}
 const ab=(()=>{try{return RSC.abEffects(id);}catch(e){return[];}})();
 const u={side:0,id,uid:++b.uid,i,name:HB[id].name,lv,s,s7:s.s7,mhp:s.mhp,hp:s.mhp,atk:s.atk,def:s.def,mag:s.mag,res:s.res,spd:s.spd,
  bp:s.bp0||8,bpMax:s.bpMax||20,bpReg:s.bpReg||4,lp:s.lpMax||7,lpMax:s.lpMax||7,sks:keys.map(k=>SK[k]),basic:basicOf(id),ou:SK[(D.AWX[id]||{}).ou]||null,
  ab,_b:b,ag:0,awOn:0,ouUsed:0,bufs:[],sts:{},shield:0,taunt:0,store:0,stack:0,guts:0,h:fx,tr:[],face:-1};
 for(const e of ab){const v=val(e);if(e.t==='bp0')u.bp+=v;if(e.t==='stat'&&e.k==='mhp'){u.mhp=Math.round(u.mhp*(1+v/100));u.hp=u.mhp;}if(e.t==='guts')u.guts=1;if(e.t==='ag'&&e.c==='start')u.ag+=v;}
 u.bp=Math.min(u.bp,u.bpMax);return u;}
/* 敵：ED（本編）とステージの Lv。雑魚は Lv で少しずつ強く */
/* ステージごとの補正（js/cb/tune.js の CBT＝[HP の倍率, 攻撃の倍率]。tools/cb_sim.js --tune で作る） */
function foe(kind,lv,b){const e=ED[kind];if(!e)return null;const boss=!!e.boss||kind==='ernaE'||kind==='valkE',T=(typeof CBT!=='undefined'&&b.S&&CBT[b.S.id])||[1,1],k=boss?1:1+.035*Math.max(0,lv-1),hk=(boss?1.15:1.2)*T[0]*(b.hk||1),ak=T[1]*(b.ak||1);
 let tr=[];try{tr=(TDD.TRAIT[kind]||[]).slice();}catch(x){}
 return{side:1,kind,uid:++b.uid,name:e.name,spr:e.spr||kind,boss,lv,mhp:Math.round(e.mhp*k*hk),hp:0,atk:Math.round((e.atk||30)*k*ak),def:Math.round((e.def||10)*k),mag:Math.round((e.mag||e.atk||20)*k*ak),res:Math.round((e.res||10)*k),
  spd:e.spd||8,weak:(e.weak||[]).slice(),resist:(e.resist||[]).slice(),acts:e.acts||(e.ai&&e.ai.acts)||null,ai:boss?e.ai||null:null,bufs:[],sts:{},shield:0,tr,dir:1,face:1,cnt:0,spdT:0};}
/* TD の WAVE（大群）→ 1 戦 4 体まで。ボスは必ず出す。雑魚は数を 1/3 に */
function wavesOf(S){return S.waves.map(w=>{const L=[];for(const[,k,n]of w.e){const e=ED[k];if(!e)continue;const boss=!!e.boss||k==='ernaE'||k==='valkE';const c=boss?1:Math.max(1,Math.round(n/3));for(let i=0;i<c;i++)L.push({k,boss});}
 L.sort((a,b)=>b.boss-a.boss);const out=[];for(const x of L){if(out.length>=4)break;if(!x.boss&&out.length&&ED[out[0]].boss&&out.length>=3)break;out.push(x.k);}return out;});}
/* 天への塔（S.inf）：WAVE を毎回作る。5 の倍数はボス。敵の Lv は WAVE ごとに +2 */
function infWave(b,i){const S=b.S,R=b.r,pick=L=>L[Math.floor(R()*L.length)];if((i+1)%5===0)return[pick(S.bosses),pick(S.pool)];const n=i<10?3:4,o=[];for(let k=0;k<n;k++)o.push(pick(S.pool));return o;}
function create(sid,party,o={}){const S=TDD.STAGE[sid];const b={sid,S,hk:o.hk,ak:o.ak,uid:0,turn:0,wave:0,r:rng(o.seed||((Date.now()%99991)+1)),heroes:[],foes:[],waves:[],fell:0,over:null,log:[]};
 b.waves=S.inf?[infWave(b,0)]:wavesOf(S);
 party.slice(0,4).forEach((id,i)=>{const u=hero(id,i,b);if(u)b.heroes.push(u);});
 b.par=S.inf?999:b.waves.length*3+(S.boss?4:1);spawn(b);
 /* 戦闘開始時の強化（start）：自分・味方全体・敵全体 */
 for(const u of b.heroes)for(const e of u.ab)if(e.t==='start'){const T=e.on==='allies'?b.heroes:e.on==='enemies'?b.foes:[u];for(const t of T)addBuf(t,e.k,e.on==='enemies'?-Math.abs(val(e)):val(e),e.d||3);}
 return b;}
function spawn(b){const L=b.waves[b.wave]||[];b.foes=L.map(k=>foe(k,b.S.lv+(b.S.inf?b.wave*2:0),b)).filter(Boolean);for(const f of b.foes)f.hp=f.mhp;}
const alive=L=>L.filter(u=>u.hp>0);
const H=b=>alive(b.heroes),F=b=>alive(b.foes);

/* ==================== 能力・効果 ==================== */
function addBuf(t,k,v,d){if(!ST.includes(k))return;const o=t.bufs.find(x=>x.k===k&&Math.sign(x.v)===Math.sign(v));if(o){o.v=clamp(o.v+v,-50,50);o.t=Math.max(o.t,d);}else t.bufs.push({k,v:clamp(v,-50,50),t:d});}
const bufOf=(u,k)=>u.bufs.reduce((a,x)=>x.k===k?a+x.v:a,0);
function eff(u){if(u.side!==0)return[];let L=u.ab;if(u.awOn>0){const A=D.AWX[u.id];if(A)L=L.concat(A.fx);}return L;}
function cnd(c,a,t,sk){if(!c||c==='any')return true;
 if(c.startsWith('el:'))return!!(sk&&sk.el&&c.slice(3).split('|').includes(sk.el));
 switch(c){case'phys':return!!sk&&sk.k!=='mag';case'mag':return!!sk&&sk.k==='mag';case'basic':return!!sk&&!!sk.basic;case'skill':return!!sk&&!sk.basic;
  case'weak':return!!(t&&sk&&t.weak&&t.weak.includes(elOf(a,t,sk)));case'weakmag':return!!(sk&&sk.k==='mag'&&cnd('weak',a,t,sk));
  case'single':return!!sk&&sk.t!=='all';case'aoe':return!!sk&&sk.t==='all';case'multi':return!!sk&&(sk.hits||1)>1;
  case'hpfull':return a.hp>=a.mhp;case'hplow':return a.hp<=a.mhp*.5;case'hphigh':return a.hp>=a.mhp*.5;case'tlow':return!!t&&t.hp<=t.mhp*.3;case'tfull':return!!t&&t.hp>=t.mhp;
  case'boss':return!!t&&!!t.boss;case'debuffed':return!!t&&t.bufs.some(x=>x.v<0);case'aw':return a.awOn>0;case'crit':return false;
  case'allyaw':return!!a._b&&a._b.heroes.some(h=>h.awOn>0);default:return false;}}
function sumE(u,t,pred){let s=0;for(const e of eff(u))if(e.t===t&&(!pred||pred(e)))s+=val(e);return s;}
function stat(u,k){let v=u[k]||0,p=bufOf(u,k);if(u.side===0){for(const e of u.ab)if(e.t==='stat'&&e.k===k)p+=val(e);
  if(u.awOn>0){const n=AWS[u.id];if(n&&n[k])p+=n[k];if(u.id==='balza'&&k==='atk')p+=15*Math.min(4,u.awN||0);}}
 return v*(1+clamp(p,-60,120)/100);}
/* 星臨の特記（AWX.note の処理） */
const AWS={rio:{atk:20,def:20,mag:20,res:20,spd:20},jin:{atk:30,spd:30}};
function elOf(a,t,sk){if(sk.auto&&t&&t.weak&&t.weak.length)return t.weak[0];return sk.el||(a.side===0?a.basic.el:null);}
/* 属性の倍率：敵は弱点 1.5・耐性 0.5。仲間は防具の属性耐性（ELR） */
function elMul(t,el){if(!el)return 1;if(t.side===1){if(t.weak.includes(el)||(t.sts.weak&&t.sts.weak.el===el))return 1.5;if(t.resist.includes(el))return.5;return 1;}
 try{return ELR.mul(t.id,el);}catch(e){return 1;}}

/* ==================== ダメージ ==================== */
/* 威力 × 攻撃 ×（攻撃 /（攻撃 + 防御×1.4））× 係数。物理は攻撃 対 防御、術は魔力 対 精神 */
const KH=2.1,KE=1.45;
function dmgOf(b,a,t,sk,o={}){const mag=sk.k==='mag',A=stat(a,mag?'mag':'atk'),pierce=clamp((sk.pierce20||0)+sumE(a,'pierce')/100,0,.8),Dd=stat(t,mag?'res':'def')*(1-pierce);
 const el=elOf(a,t,sk),em=elMul(t,el);let pow=o.pow||sk.pow||1;
 if(sk.cond20==='brk'&&t.hp<=t.mhp*.5)pow*=1.5;if(sk.cond20==='debuff')pow*=1+.25*Math.min(3,t.bufs.filter(x=>x.v<0).length);if(sk.cond20==='lowhp')pow*=1+.8*(1-a.hp/a.mhp);
 let d=pow*A*(A/(A+Dd*1.4))*(a.side===0?KH:KE);
 /* 与ダメ（アビリティ・星臨・装備）と被ダメ */
 if(a.side===0){let p=sumE(a,'dmg',e=>cnd(e.c,a,t,sk))+sumE(a,'allydmg')*0;for(const h of b.heroes)if(h!==a&&h.hp>0)p+=sumE(h,'allydmg');
  p+=(a.s.dmgP||0)+(sk.basic?0:a.s.skDmg||0)+(em>1?a.s.weakDmg||0:0)+a.stack*5;
  if(a.awOn>0&&a.id==='crow')p+=150*(1-a.hp/a.mhp);d*=1+p/100;const xf=sumE(a,'xf',e=>cnd(e.c,a,t,sk));if(xf)d*=1+xf/100;if(a.awOn>0&&a.id==='valk')d*=1.5;}
 if(t.side===0){let c=sumE(t,'cut',e=>cnd(e.c,a,t,sk))+(t.s.dmgCut||0);for(const h of b.heroes)if(h!==t&&h.hp>0)c+=sumE(h,'allycut');if(t.awOn>0&&t.id==='gald')c+=45;d*=1-clamp(c,0,70)/100;}
 if(t.sts.prot)d*=1-t.sts.prot.v/100;if(t.sts.mark)d*=1+t.sts.mark.v/100;
 d*=em;let cr=false;const cc=5+(a.side===0?(a.s.crit||0)+sumE(a,'crit',e=>cnd(e.c,a,t,sk))+(sk.crit||0)+bufOf(a,'crit'):0);
 if(a.side===0&&((a.awOn>0&&a.id==='erna')||b.r()*100<cc)){cr=true;d*=1.5+(sumE(a,'critd')+(a.s.critDmg||0))/100;}
 d*=.95+b.r()*.1;return{v:Math.max(1,Math.round(d)),cr,weak:em>1,res:em<1,el};}
/* 当てる（盾・こらえる・LP）。返り値は数字の記録 */
function hurt(b,t,v,a){if(t.shield>0){const s=Math.min(t.shield,v);t.shield-=s;v-=s;}
 if(t.side===0&&t.awOn>0&&t.id==='gald')t.store+=v;
 let kill=false;if(t.hp>0){t.hp-=v;if(t.hp<=0){if(t.side===0&&(t.guts||(t.sanct&&t.awSanct))){t.hp=1;if(t.guts)t.guts=0;else t.sanct=0;}else{t.hp=0;kill=true;}}}
 if(kill&&t.side===0){t.lp=Math.max(0,t.lp-1);b.fell++;t.bufs=[];t.sts={};t.awOn=0;}
 if(t.side===0&&!kill&&t.hp>0){t.ag=Math.min(100,t.ag+Math.round(v/t.mhp*70));const r=sumE(t,'rage');if(r)t.stack=Math.min(10,t.stack+1);}
 return kill;}
/* 状態・能力の変化を付ける。返り値は表示用の短い字（なければ null） */
function apply(b,a,t,f){if(!t||t.hp<=0)return null;const p=(()=>{try{return RSC.ailP(a,t,f);}catch(e){return f.p==null?1:f.p;}})();if(b.r()>p)return null;const d=f.t||f.d||2;
 if(ST.includes(f.k)){addBuf(t,f.k,f.v,d);return(STN[f.k]||f.k)+(f.v>0?'↑':'↓');}
 switch(f.k){case'poison':t.sts.poison={v:f.v||.05,t:d};return'毒';case'stun':if(t.boss&&b.r()<.5)return null;t.sts.stun={t:1};return'スタン';case'para':t.sts.para={t:d};return'マヒ';case'blind':t.sts.blind={t:d};return'暗闇';
  case'weak':t.sts.weak={el:f.el,t:d};return f.el+'弱点';case'regen':t.sts.regen={v:f.v,t:d};return'継続回復';case'prot':t.sts.prot={v:f.v,t:d};return'被ダメ↓';case'mark':t.sts.mark={v:f.v,t:d};return'被ダメ↑';
  case'shield':t.shield=Math.round(t.mhp*f.v);return'障壁';case'evade':t.sts.evade={v:f.v,t:d};return'回避↑';case'counter':t.sts.counter={v:f.v,t:d};return'反撃';default:return null;}}
function onTargets(b,a,on,t){if(on==='self')return[a];const mine=a.side===0?b.heroes:b.foes,oth=a.side===0?b.foes:b.heroes;
 if(on==='allies')return alive(mine);if(on==='enemies')return alive(oth);return t?[t]:[];}
function heal(b,a,t,frac){if(!t||t.hp<=0)return 0;const hr=t.side===0?(t.s.healRecv||1):1,ha=a.side===0?(a.s.healAb||1)*(1+sumE(a,'heal')/100):1,v=Math.round(t.mhp*frac*hr*ha);const h=Math.min(v,t.mhp-t.hp);t.hp+=h;return h;}

/* ==================== コマンド ==================== */
const costOf=(u,sk)=>{if(!sk||sk.basic||sk.ougi)return 0;let c=sk.bp||0;try{c=RSC.costOf({side:0,id:u.id},sk);}catch(e){}c-=sumE(u,'bpcut',e=>cnd(e.c,u,null,sk));return Math.max(1,c);};
const isSup=sk=>!(sk.k==='phys'||sk.k==='mag'||sk.k==='rhythm'||sk.k==='pct'||sk.fixedK);
const isHeal=sk=>sk.k==='heal'||sk.k==='healAll'||!!sk.heal20||sk.k==='reviveAll'||!!sk.revive;
/* 自動の選び方（AUTO・敵の弱点・回復の要否）：BP を見て一番よさそうな技 */
function autoPick(b,u){const foes=F(b),hs=H(b),low=hs.filter(h=>h.hp<h.mhp*.5).length,dead=b.heroes.filter(h=>h.hp<=0&&h.lp>0).length;
 if(u.awOn>0&&u.ou&&!u.ouUsed&&(u.ou.k!=='rewind'||low>=2||dead))return{sk:u.ou,tg:best(b,u,u.ou)};
 let bs=null,bv=-1;for(const sk of u.sks){const c=costOf(u,sk);if(c>u.bp)continue;let v=0;
  if(isHeal(sk))v=(low*40+dead*80)*(sk.t==='ally'?.7:1);
  else if(isSup(sk))v=b.turn===1||b.turn%3===1?18+c:4;
  else{const t=best(b,u,sk);v=(sk.pow||1)*(sk.hits||1)*(sk.t==='all'?Math.min(foes.length,4)*.75:1)*20;if(t&&t.weak&&t.weak.includes(elOf(u,t,sk)))v*=1.5;v-=c*1.2;if(u.bp-c<4&&c>4)v*=.7;}
  if(v>bv){bv=v;bs=sk;}}
 const sk=bs&&bv>22?bs:u.basic;return{sk,tg:best(b,u,sk)};}
function best(b,u,sk){if(sk.t==='ally'){const L=b.heroes.filter(h=>h.hp>0||(sk.revive&&h.lp>0));return L.sort((x,y)=>x.hp/x.mhp-y.hp/y.mhp)[0];}
 const L=F(b);if(!L.length)return null;const w=L.filter(f=>f.weak.includes(elOf(u,f,sk)));const P=w.length?w:L;return P.slice().sort((x,y)=>x.hp-y.hp)[0];}
function auto(b){for(const u of H(b))if(!u.cmd)u.cmd=autoPick(b,u);}
/* 敵の行動：ED.acts（[技,重み]）・ボスは every ターンごとに溜め技（前のターンに予告）・呼び出し */
function foeAct(b,f){const ai=f.ai;let key='claw';
 if(ai&&ai.charge&&f.charged){f.charged=0;key=ai.charge;const E0=EA[key]||EA.claw;return{sk:Object.assign({},E0,{pow:clamp(E0.pow*.85,1.2,2.2),t:'all',charge:1}),key};}
 const A=f.acts||(ai&&ai.acts);if(A&&A.length){let s=A.reduce((a,x)=>a+(x[1]||1),0)*b.r();for(const x of A){s-=x[1]||1;if(s<=0){key=x[0];break;}}}
 return{sk:EA[key]||EA.claw,key};}
function foeTarget(b,f,sk){const L=H(b);if(!L.length)return null;const t=L.find(h=>h.taunt>0||(h.awOn>0&&h.id==='gald'));if(t)return t;
 let w=0;const W=L.map(h=>{const x=h.i===0?1.4:1;w+=x;return x;});let r=b.r()*w;for(let i=0;i<L.length;i++){r-=W[i];if(r<=0)return L[i];}return L[0];}
/* ==================== ターン ==================== */
function turnStart(b){b.turn++;const rec=[];
 for(const u of H(b)){const r=u.bpReg+sumE(u,'bpr')+b.heroes.reduce((a,h)=>a+(h.hp>0&&h!==u?sumE(h,'allybpr'):0),0);if(b.turn>1)u.bp=Math.min(u.bpMax,u.bp+r);u.cmd=null;
  for(const e of eff(u))if(e.t==='tstart'){const T=e.on==='allies'?H(b):[u];for(const t of T)addBuf(t,e.k,val(e),1);}
  if(u.awOn>0&&u.id==='balza')u.awN=(u.awN||0)+1;}
 for(const f of F(b)){f.cmd=null;f.cnt++;f._n=0;if(f.chargeN){f.chargeN=0;f.charged=1;}const ai=f.ai;if(ai&&ai.charge&&ai.every&&f.cnt%ai.every===ai.every-1){f.charging=1;}}
 return rec;}
/* 行動の順：素早さ×（0.9〜1.1）。先制は前・後発は後ろ。ボスは仲間が 4 人なら 2 回 */
function order(b){const L=[];for(const u of H(b))L.push({u,k:stat(u,'spd')*(.9+b.r()*.2)*(1+sumE(u,'prio')/100)+(u.cmd&&u.cmd.sk.prio?u.cmd.sk.prio*1000:0)});
 const n=H(b).length;for(const f of F(b)){L.push({u:f,k:stat(f,'spd')*3*(.9+b.r()*.2)});if(f.boss&&n>=4)L.push({u:f,k:stat(f,'spd')*3*(.5+b.r()*.2),again:1});}
 return L.sort((a,c)=>c.k-a.k).map(x=>x.u);}
function turnEnd(b){const rec=[];
 for(const u of[...H(b),...F(b)]){const L=[];
  if(u.sts.poison){const v=Math.max(1,Math.round(u.mhp*u.sts.poison.v*(u.boss?.4:1)));const k=hurt(b,u,v,null);L.push({t:u,v,c:'poison',kill:k});}
  if(u.hp>0&&u.sts.regen){const h=heal(b,u,u,u.sts.regen.v);if(h)L.push({t:u,heal:h});}
  if(u.hp>0&&u.side===0){const r=sumE(u,'regen');if(r){const h=heal(b,u,u,r/100);if(h)L.push({t:u,heal:h});}}
  for(const k in u.sts){const s=u.sts[k];if(s.t!=null&&--s.t<=0)delete u.sts[k];}
  u.bufs=u.bufs.filter(x=>--x.t>0);if(u.taunt>0)u.taunt--;
  if(u.side===0&&u.awOn>0&&--u.awOn<=0){u.awOn=0;u.awEnd=1;}
  rec.push(...L);}
 return rec;}
function state(b){if(!H(b).length)return'lose';if(!F(b).length)return b.S.inf||b.wave+1<b.waves.length?'next':'win';return null;}
/* 次の WAVE：BP +2。倒れていた仲間は LP が残っていれば HP 25% で起きる（LP はもう減っている） */
function nextWave(b){b.wave++;if(b.S.inf&&!b.waves[b.wave])b.waves.push(infWave(b,b.wave));spawn(b);for(const u of b.heroes){if(u.hp<=0&&u.lp>0){u.hp=Math.round(u.mhp*.25);u.rev=1;}if(u.hp>0)u.bp=Math.min(u.bpMax,u.bp+2);}}
/* 星臨（行動を消費しない）：ゲージ 100 で。3 ターン（＋アビリティ）。セレスは味方の HP を記録（奥義で巻き戻す） */
function canAw(u){return u.hp>0&&u.ag>=100&&u.awOn<=0&&!u.awUsed;}
function awaken(b,u){if(!canAw(u))return null;u.ag=0;u.awUsed=1;u.awOn=D.AW_TURNS+sumE(u,'awturn');const rec={k:'aw',u,fx:[]};
 const A=D.AWX[u.id];if(A)for(const e of A.fx){if(e.t==='heal'){for(const h of H(b))heal(b,u,h,val(e)/100);}if(e.t==='onaw'){for(const t of onTargets(b,u,e.on))addBuf(t,e.k,val(e),e.d||3);}}
 if(u.id==='celes')b.snap=b.heroes.map(h=>({h,hp:h.hp}));if(u.id==='noah')for(const h of H(b))h.sanct=1;if(u.id==='shion')for(const f of F(b))f.delayed=1;
 for(const h of H(b))if(h!==u){const s=sumE(h,'agshare');if(s)h.ag=Math.min(100,h.ag+s);}
 return rec;}
/* 1 人の行動。返り値 rec＝{u, sk, tg:[...], hits:[{t,v,cr,weak,res,miss,kill,heal,hi}], tx:[{t,s}], fu:[rec…], skip} */
function act(b,u){if(u.hp<=0)return null;const again=u.side===1&&(u._n=(u._n||0)+1)>1;const rec={u,sk:null,tg:[],hits:[],tx:[],fu:[]};
 if(u.sts.stun){delete u.sts.stun;rec.skip='スタン';return rec;}
 if(u.sts.para&&b.r()<.35){rec.skip='マヒ';return rec;}
 if(u.side===1){if(u.charging&&!again){u.charging=0;u.chargeN=1;rec.charge=1;rec.skip='溜め';return rec;}
  const c=foeAct(b,u);rec.sk=c.sk;const t=foeTarget(b,u,c.sk);if(!t)return null;rec.tg=c.sk.t==='all'?H(b):[t];hitAll(b,u,c.sk,rec);
  if(u.ai&&u.ai.summon&&u.cnt%4===2&&F(b).length<4&&!again&&ED[u.ai.summon]){const f=foe(u.ai.summon,Math.max(1,b.S.lv-1),b);f.hp=f.mhp;b.foes.push(f);rec.summon=f;}
  return rec;}
 let c=u.cmd||autoPick(b,u);u.cmd=null;let sk=c.sk;const cost=costOf(u,sk);if(cost>u.bp){sk=u.basic;c={sk,tg:best(b,u,sk)};}
 u.bp-=cost;rec.sk=sk;rec.cost=cost;if(sk.ougi)u.ouUsed=1;
 /* 対象：倒れていたら別の敵へ */
 let t=c.tg;if(sk.t==='all'||sk.t==='allies'||sk.t==='self'){}else if(sk.t==='ally'){if(!t||(t.hp<=0&&!sk.revive))t=best(b,u,sk);}else if(!t||t.hp<=0||t.side===0)t=best(b,u,sk);
 rec.tg=sk.t==='all'?F(b):sk.t==='allies'?H(b):sk.t==='self'?[u]:t?[t]:[];
 if(sk.selfPre)for(const f of sk.self20||[])push(rec,u,apply(b,u,u,Object.assign({p:1},f)));
 if(sk.k==='rewind'){if(b.snap)for(const s of b.snap){const h=s.h;const was=h.hp;if(s.hp>0){if(h.hp<=0){h.lp=Math.max(1,h.lp);}h.hp=Math.max(h.hp,s.hp);}if(h.hp>was)rec.hits.push({t:h,heal:h.hp-was,rev:was<=0});}
  rec.tg=F(b);for(const f of F(b)){const d=dmgOf(b,u,f,{k:'mag',el:'陰',pow:2.6,t:'all'});const k=hurt(b,f,d.v,u);rec.hits.push(Object.assign({t:f,kill:k,big:1},d));addBuf(f,'spd',-30,3);}}
 else if(sk.k==='reviveAll'){for(const h of b.heroes){const was=h.hp;if(h.hp<=0&&h.lp>0)h.hp=1;heal(b,u,h,.4);if(h.hp>was)rec.hits.push({t:h,heal:h.hp-was,rev:was<=0});}rec.tg=H(b);}
 else if(sk.k==='pct'){for(const f of F(b)){const v=Math.max(1,Math.round(f.hp*(f.boss?.12:.4)));const k=hurt(b,f,v,u);rec.hits.push({t:f,v,kill:k,big:1});}rec.tg=F(b);}
 else if(isHeal(sk)&&!(sk.k==='phys'||sk.k==='mag')){const frac=sk.heal20||sk.pow||.3;
  for(const h of rec.tg){if(sk.revive&&h.hp<=0&&h.lp>0){h.hp=1;rec.hits.push({t:h,heal:heal(b,u,h,sk.revive>0&&sk.revive<1?sk.revive:.3)+1,rev:1});continue;}const v=heal(b,u,h,frac);rec.hits.push({t:h,heal:v});if(sk.cleanse20){h.bufs=h.bufs.filter(x=>x.v>0);delete h.sts.poison;delete h.sts.para;delete h.sts.blind;}}}
 else if(isSup(sk)){if(sk.heal20)for(const h of H(b))rec.hits.push({t:h,heal:heal(b,u,h,sk.heal20)});if(sk.cleanse20)for(const h of H(b)){h.bufs=h.bufs.filter(x=>x.v>0);delete h.sts.poison;delete h.sts.para;}
  if(sk.taunt20){u.taunt=sk.taunt20;push(rec,u,'挑発');}}
 else{if(sk.fixedK==='store'){const v=Math.round(u.store*.9+stat(u,'atk')*3);u.store=0;for(const f of F(b)){const k=hurt(b,f,v,u);rec.hits.push({t:f,v,kill:k,big:1});}rec.tg=F(b);}
  else hitAll(b,u,sk.k==='rhythm'?Object.assign({},sk,{k:'phys',pow:.55,hits:12,fx20:[{on:'t',k:'stun',v:1,t:1,p:.4}]}):sk,rec);}
 /* 補助の効果（fx20：対象・味方全体など）・自分への効果・攻撃のあと */
 if(isSup(sk)&&sk.fx20)for(const f of sk.fx20)for(const t of onTargets(b,u,f.on==='t'?(sk.t==='ally'?'t':sk.t==='self'?'self':'allies'):f.on,rec.tg[0]))push(rec,t,apply(b,u,t,Object.assign({p:1},f)));
 if(!sk.selfPre)for(const f of sk.self20||[])push(rec,u,apply(b,u,u,Object.assign({p:1},f)));
 for(const f of sk.post||[])for(const t of onTargets(b,u,f.on))push(rec,t,apply(b,u,t,Object.assign({p:1},f)));
 /* 行動のあと：星臨ゲージ・BP・積み上げ・追撃 */
 u.ag=Math.min(100,u.ag+Math.round((sk.basic?10:14)*(1+sumE(u,'ag')/100)));const ab=sumE(u,'actbp');if(ab)u.bp=Math.min(u.bpMax,u.bp+ab);if(sumE(u,'stack'))u.stack=Math.min(10,u.stack+1);
 if(!isSup(sk)&&rec.tg.length&&rec.tg[0].side===1)for(const e of eff(u))if(e.t==='fu'&&cnd(e.c,u,rec.tg[0],sk)&&b.r()<(e.p||e.v||.3)){const T=F(b);if(!T.length)break;const t2=rec.tg[0].hp>0?rec.tg[0]:T[0];
  const s2={n:e.nm||'追撃',k:'phys',el:e.el||sk.el,pow:e.pw||e.pow||1,t:'one',fu:1};const r2={u,sk:s2,tg:[t2],hits:[],tx:[],fu:[]};hitAll(b,u,s2,r2);rec.fu.push(r2);}
 return rec;}
function push(rec,t,s){if(s)rec.tx.push({t,s});}
/* 攻撃を当てる（全体・連撃・命中・状態・吸収・反撃） */
function hitAll(b,a,sk,rec){const n=(sk.hits||1)+(a.side===0&&!sk.basic?sumE(a,'hits',e=>cnd(e.c,a,null,sk)):0);let dealt=0;
 rec.tg.forEach((t0,ti)=>{for(let i=0;i<n;i++){let t=t0;if(t.hp<=0){if(sk.t==='all')break;const L=a.side===0?F(b):H(b);if(!L.length)break;t=L[0];}
  let hr=1;try{hr=RSC.hitRate(a,t,sk.basic?a.basic:sk);}catch(e){}if(a.sts.blind)hr-=.3;if(t.sts.evade)hr-=t.sts.evade.v/100;if(t.side===0)hr-=sumE(t,'dodge')/100;
  if(b.r()>hr){rec.hits.push({t,miss:1,hi:i,ti});continue;}
  const d=dmgOf(b,a,t,sk);const kill=hurt(b,t,d.v,a);dealt+=d.v;rec.hits.push(Object.assign({t,kill,hi:i,ti,big:sk.ougi?1:0},d));
  if(t.hp>0){for(const f of sk.fx20||[])if(f.on==='t')push(rec,t,apply(b,a,t,f));
   if(a.side===0)for(const e of eff(a))if(e.t==='onhit'&&cnd(e.c,a,t,sk))push(rec,t,apply(b,a,t,{k:e.k,v:e.k==='poison'?(e.v||.05):-(Math.abs(val(e))),t:e.d||2,p:e.p==null?.3:e.p}));
   if(sk.delay&&!t.done)t.delayed=1;if(sk.purge20)t.bufs=t.bufs.filter(x=>x.v<0);}
  if(kill&&a.side===0){a.ag=Math.min(100,a.ag+8);}}});
 if(a.side===0&&dealt){const dr=(sk.drain||0)+sumE(a,'drain')/100;if(dr>0){const h=Math.min(a.mhp-a.hp,Math.round(dealt*dr));if(h>0){a.hp+=h;rec.hits.push({t:a,heal:h,self:1});}}}
 /* 反撃の構え（敵の物理を受けたとき） */
 if(a.side===1&&sk.k!=='mag')for(const t of rec.tg)if(t.hp>0&&(t.sts.counter||sumE(t,'counter'))&&b.r()<.6){const pw=t.sts.counter?t.sts.counter.v:sumE(t,'counter');
  const s2={n:'反撃',k:'phys',el:t.basic.el,pow:Math.max(.6,pw||1),t:'one',fu:1},r2={u:t,sk:s2,tg:[a],hits:[],tx:[],fu:[]};hitAll(b,t,s2,r2);rec.fu.push(r2);break;}}
/* 星の数：勝ち・誰も倒れない・規定ターン以内 */
function stars(b,win){return[win?1:0,win&&!b.fell?1:0,win&&b.turn<=b.par?1:0];}
/* 画面を使わずに最後まで（計測・点検用）。AUTO で戦う */
function run(sid,party,seed,o={}){const b=create(sid,party,Object.assign({seed},o));for(let g=0;g<200;g++){turnStart(b);auto(b);let res=null;for(const u of order(b)){if(u.hp<=0)continue;const r=act(b,u);res=state(b);if(res)break;}
  if(!res){turnEnd(b);res=state(b);}if(res==='next'){nextWave(b);continue;}if(res){return{win:res==='win',turn:b.turn,fell:b.fell,stars:stars(b,res==='win'),hp:H(b).reduce((a,h)=>a+h.hp/h.mhp,0)/b.heroes.length};}}
 return{win:false,turn:b.turn,fell:b.fell,stars:[0,0,0],hp:0};}
return{create,turnStart,order,act,turnEnd,state,nextWave,awaken,canAw,auto,autoPick,best,costOf,isSup,isHeal,stat,stars,run,wavesOf,H,F,STN,AILN};})();
