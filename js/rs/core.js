/* ===== ver0.37 戦闘システム刷新（能力値・習得・技セット・アビリティ・星盤・セーブ）=====
 データは js/rs/data.js（RSD）。ここでは既存の仕組みに組み込む。
 ・能力値：8 種（腕力・体力・器用さ・素早さ・知力・精神・愛・魅力）。旧来の「攻撃」は武器種ごとの能力の配分から決まる
   （Lv1 の強さは旧来と同じになるよう主能力を自動で決める。防御＝体力・精神＝精神・魔力＝知力・素早さ＝素早さ÷3 は旧来と同じ値）
   器用さ→会心率、愛→回復量、魅力→追加効果の成功率・OD の溜まりやすさ
 ・技・術：キャラごとに 6 種（Lv・ひらめき・星盤・天星盤）＋ジョブの技 1 種。戦闘に持ち込めるのは 4 つ（技セット）
 ・アビリティ：3 つ（Lv1・25・50 で解放、段階 I〜V）。星盤・天星盤のノードで強化
 ・星臨：AW の中身を「星臨アビリティ＋奥義」に置き換える
 セーブに増える項目：G.h[id].sset（技セット）・skx（技の熟練）・glim（ひらめいた技）・sseen（自動でセットした技）・G.form（陣形） */
'use strict';
const RSC=(()=>{
const D=RSD;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const INF=lv=>{try{return V31.INF(lv);}catch(e){return 1;}};

/* ==================== 技・術を登録 ==================== */
for(const k in D.NEW)SK[k]=D.NEW[k];
/* 区分（TERMS）：技＝物理、術＝魔法 */
for(const k in D.NEW){const s=SK[k],g=s.ty==='術'?'mag':'phys';
 s.cat=s.ougi?'seirin':(s.k==='heal'||s.k==='healAll'||s.k==='reviveAll'||s.role==='heal'||s.heal20)?g+'_heal':(s.k==='sup20'||s.k==='rewind')?g+'_support':g+'_attack';}
try{Object.assign(TERMS.GROUP,{phys:'技',mag:'術',seirin:'星臨',passive:'アビリティ'});
 const N={phys_normal:'通常攻撃',phys_attack:'攻撃技',phys_support:'補助技',phys_heal:'回復技',mag_normal:'通常攻撃（術）',mag_attack:'攻撃術',mag_support:'補助術',mag_heal:'回復術',seirin:'奥義',passive:'アビリティ'};
 for(const k in N)if(TERMS.SKILL[k]){TERMS.SKILL[k].n=N[k];TERMS.SKILL[k].s=N[k].replace(/（.*）/,'');}TERMS.reset();}catch(e){console.error(e);}
/* キャラの技の一覧（図鑑・演出ビューア・区分の判定が参照する）を新しい 6 種に。旧来の Lv 習得表（V20.LSK）は空にする */
try{for(const id in D.LEARN){if(HB[id])HB[id].skills=D.LEARN[id].map(x=>x[0]);if(V20.LSK[id])V20.LSK[id]=[];}TERMS.reset();}catch(e){console.error(e);}
/* ジョブの技は 1 つずつに統合 */
try{for(const j in JOBS)if(D.JOBSK[j])JOBS[j].sk=[[1,D.JOBSK[j]]];}catch(e){console.error(e);}
/* 道具・能力の呼び名 */
try{if(ITEMS.ether)ITEMS.ether.d='BPを全回復';}catch(e){}
try{if(OPS.spGain)OPS.spGain[0]='通常攻撃時BP';}catch(e){}

/* ==================== 能力値（8 種） ==================== */
function prof8(id){const b=HB[id],P=D.HERO[id]||{w:'剣',hand:{}},w=D.WPN[P.w]||D.WPN['剣'],g=b.g||{};
 const base={vit:[b.def,g.def||'C'],wil:[b.res,g.res||'C'],int:[b.mag,g.mag||'C'],agi:[b.spd*3,g.spd||'C']};
 for(const k in P.hand)base[k]=P.hand[k].slice();
 const pk=Object.keys(w).sort((x,y)=>w[y]-w[x])[0];let rest=0;
 for(const k in w)if(k!==pk){if(!base[k])base[k]=[20,'C'];rest+=w[k]*base[k][0];}
 base[pk]=[Math.max(5,(b.atk-rest)/w[pk]),g.atk||'C'];
 for(const k of D.ST8)if(!base[k])base[k]=[20,'C'];
 return{base,w,pk,wp:P.w};}
const PROF8={};const pf=id=>PROF8[id]||(PROF8[id]=prof8(id));
/* Lv の能力値（装備・星盤を含まない素の値） */
function rs8(id,lv){const P=pf(id),o={};for(const k of D.ST8){const[b0,gr]=P.base[k],f=k==='agi'?.3:1;let v=b0*(1+(GR[gr]||.06)*f*(lv-1));if(k!=='agi')v*=INF(lv);o[k]=Math.round(v);}return o;}
const comp=(w,s)=>{let v=0;for(const k in w)v+=w[k]*s[k];return v;};
function derived(s){const m=D.ST8.reduce((a,k)=>a+s[k],0)/8;
 return{mean:m,critB:clamp(Math.round((s.dex/m-.8)*25),0,15),healMul:+clamp(.7+.4*s.lov/m,.8,1.6).toFixed(2),ailMul:+clamp(.6+.5*s.cha/m,.8,1.5).toFixed(2),odMul:+clamp(.8+.25*s.cha/m,.9,1.25).toFixed(2)};}
{const _s=stats;stats=function(id){const o=_s(id);try{if(!HB[id]||!G.h[id])return o;const h=G.h[id],lv=h.lv,P=pf(id),s=rs8(id,lv);
  let g={},bo={};try{g=gear(id);bo=bonus(id);}catch(e){}
  const old=HB[id].atk*(1+(GR[HB[id].g.atk]||.06)*(lv-1))*INF(lv),now=comp(P.w,s),pP=(g.atkP||0)+(bo.atkP||0);
  o.atk=Math.max(1,Math.round(o.atk+(now-old)*(1+pP/100)));
  const d=derived(s);o.crit=(o.crit||0)+d.critB;Object.assign(o,{rs8:s,rsW:P.wp,healMul:d.healMul,ailMul:d.ailMul,odMul:d.odMul,ougiUp:(bo.ougiUp||0)+abUps(id).O*30});
 }catch(e){console.error(e);}return o;};}

/* ==================== 技・術の習得とセット ==================== */
const hh=id=>{const h=G.h[id];if(!h)return null;h.skx=h.skx||{};h.glim=h.glim||[];h.sseen=h.sseen||[];return h;};
/* 習得済みの技・術（id の配列） */
function learned(id){const h=hh(id),o=[];if(!h)return o;
 for(const[k,how,lv]of D.LEARN[id]||[]){let ok=false;
  if(how==='lv')ok=h.lv>=lv;else if(how==='glim')ok=h.glim.includes(k);else if(how==='board')ok=(h.board||[]).includes('2,-2');else if(how==='board2')ok=(h.board2||[]).includes('2,-2');
  if(ok)o.push(k);}
 if(h.job&&D.JOBSK[h.job])o.push(D.JOBSK[h.job]);return o;}
/* 習得の方法の表示 */
function howTxt(id,k){const e=(D.LEARN[id]||[]).find(x=>x[0]===k);if(!e){const j=Object.keys(D.JOBSK).find(x=>D.JOBSK[x]===k);return j?`ジョブ「${JOBS[j].n}」`:'';}
 const[,how,lv]=e,g=SK[k].glim;return how==='lv'?`Lv${lv}`:how==='glim'?`ひらめき（Lv${lv}以上で「${SK[g.from].n}」を使うと閃くことがある）`:how==='board'?'星盤':'天星盤（Lv60〜）';}
skillList=function(id){return learned(id);};
/* 技セット（最大 4）。空きがあれば新しく覚えた技を自動で入れる（一度外した技は勝手に戻さない） */
function setOf(id){const h=hh(id);if(!h)return[];const L=learned(id);
 if(!Array.isArray(h.sset)){h.sset=L.slice(0,4);h.sseen=L.slice();}
 h.sset=h.sset.filter((k,i,a)=>L.includes(k)&&a.indexOf(k)===i).slice(0,4);
 for(const k of L)if(!h.sseen.includes(k)){h.sseen.push(k);if(h.sset.length<4)h.sset.push(k);}
 return h.sset.slice();}
function toggleSet(id,k){const h=hh(id);setOf(id);const i=h.sset.indexOf(k);if(i>=0){h.sset.splice(i,1);return'外した';}if(h.sset.length>=4)return'技セットがいっぱい（4つまで）';if(!learned(id).includes(k))return'まだ覚えていない';h.sset.push(k);return'セットした';}
function moveSet(id,k,d){const h=hh(id);setOf(id);const i=h.sset.indexOf(k),j=i+d;if(i<0||j<0||j>=h.sset.length)return;[h.sset[i],h.sset[j]]=[h.sset[j],h.sset[i]];}
/* 技の熟練 */
const profN=(id,k)=>{const h=hh(id);return h?h.skx[k]||0:0;};
const profLv=(id,k)=>{const n=profN(id,k);let l=1;for(let i=0;i<D.PROF.length;i++)if(n>=D.PROF[i])l=i+1;return Math.min(10,l);};
const profMul=(id,k)=>1+(profLv(id,k)-1)*.02;
function costOf(u,sk){if(!sk||sk.basic||sk.k==='item'||sk.k==='reso')return 0;let c=sk.bp!=null?sk.bp:0;if(!c)return 0;
 if(u&&u.side===0&&G.h[u.id]){const l=profLv(u.id,keyOf(sk));c-=(l>=4?1:0)+(l>=8?1:0);}
 try{c-=RSB.sumE(u,'bpcut',e=>RSB.cnd(e.c,u,null,sk));}catch(e){}
 return Math.max(1,c);}
let KEYM=null;
function keyOf(sk){if(!sk)return null;if(sk._k)return sk._k;if(!KEYM){KEYM=new Map();for(const k in SK)KEYM.set(SK[k],k);}return KEYM.get(sk)||null;}
for(const k in D.NEW)SK[k]._k=k;

/* ==================== アビリティ ==================== */
/* 星盤・天星盤による強化：ab1〜3（アビリティ）と O（奥義の威力） */
function abUps(id){const o={1:0,2:0,3:0,O:0};const h=G.h[id];if(!h)return o;
 try{for(const k of h.board||[]){const n=BOARD[id]&&BOARD[id][k];if(n&&n.t==='ab')o[n.v.abN]=(o[n.v.abN]||0)+1;}}catch(e){}
 try{const N=V31B.BOARD2[id];for(const k of h.board2||[]){const n=N&&N[k];if(n&&n.t==='ps'&&/^ab_up/.test(n.v.ps)){const x=n.v.ps.slice(5);o[x]=(o[x]||0)+1;}}}catch(e){}
 return o;}
/* アビリティ i（0〜2）の段階：0＝未解放、1〜5 */
function abRank(id,i){const h=G.h[id];if(!h)return 0;const l0=D.ABL[i];if(h.lv<l0)return 0;let r=1+(h.lv>=l0+30?1:0)+(h.lv>=l0+60?1:0);r+=abUps(id)[i+1]||0;return Math.min(5,r);}
const STATK=['atk','def','mag','res','spd','crit'];
/* 段階に応じた効果（配列は段階で引く）。onhit の r は、能力の増減なら「値」、状態異常なら「確率」 */
function resolve(f,rank){const o={};for(const k in f){const v=f[k];o[k]=Array.isArray(v)&&v.length===5&&k!=='c'?v[rank-1]:v;}
 if(f.r!=null){const r=o.r;if(f.t==='onhit'){if(STATK.includes(f.k)){o.v=r;o.p=1;}else{o.p=r;o.v=f.v;}}else if(f.t==='fu'||f.t==='counter'||f.t==='delay'||f.t==='cleanse'){o.p=r;o.v=r;}else o.v=r;}
 if(o.t==='fu'||o.t==='counter'){o.p=o.p!=null?o.p:o.v;o.pow=o.pw!=null?o.pw:1;}
 if(o.t==='kill'){o.hp=o.v;}
 delete o.r;return o;}
const active=e=>e&&(e.v||e.p||e.bp)&&!(e.t==='fu'&&!e.p);
function abEffects(id){const o=[];(D.AB[id]||[]).forEach((A,i)=>{const r=abRank(id,i);if(!r)return;for(const f of A.fx){const e=resolve(f,r);if(active(e)){e.src=A.n;o.push(e);}}});return o;}
const awEffects=id=>{const A=D.AWX[id];return A?A.fx.map(f=>Object.assign({src:A.n,p:f.t==='fu'?f.v:undefined,pow:f.pw},f)):[];};
/* 効果の説明文 */
const CN={phys:'技',mag:'術',basic:'通常攻撃',skill:'技・術',weak:'弱点を突くとき',weakmag:'弱点を突く術',single:'単体攻撃',aoe:'全体攻撃',multi:'連撃',hpfull:'HP満タンのとき',hplow:'HP50%以下のとき',hphigh:'HP50%以上のとき',
 tlow:'HP30%以下の敵',tfull:'HP満タンの敵',boss:'ボス',debuffed:'弱体のかかった敵',allyaw:'仲間が星臨中のとき',aw:'星臨中',altel:'直前と違う属性の術',crit:'会心が出たとき',any:'行動のあと',same:'同じ敵を続けて攻撃するたび',heat:'攻撃するたび'};
const cn=c=>!c||c==='any'&&false?'':c.startsWith&&c.startsWith('el:')?c.slice(3).replace('|','・')+'属性':CN[c]||'';
const pc=x=>Math.round(x*100)+'%';
function effTxt(e){const c=e.c?cn(e.c):'',cc=c?`${c}、`:'',ON={self:'自分',allies:'味方全体',lowest:'最もHPの減った味方',enemies:'敵全体'};
 switch(e.t){
  case'dmg':return`${cc}与ダメ+${e.v}%`;case'cut':return e.v<0?`${cc}被ダメ+${-e.v}%`:`${cc}被ダメ-${e.v}%`;case'crit':return`${cc}会心率+${e.v}%`;case'critd':return`会心ダメ+${e.v}%`;
  case'stat':return`${{atk:'攻撃',def:'防御',mag:'魔力',res:'精神',spd:'素早さ',mhp:'最大HP'}[e.k]}+${e.v}%`;case'bp0':return`初期BP+${e.v}`;case'bpr':return`毎ターンのBP回復+${e.v}`;case'bpmax':return`BP上限+${e.v}`;
  case'bpcut':return`${cc}消費BP-${e.v}`;case'od':return`OD上昇+${e.v}%`;case'chain':return`連携ダメ+${e.v}%`;case'ag':return`星臨ゲージ上昇+${e.v}%`;case'heal':return`回復量+${e.v}%`;
  case'regen':return`毎ターン、${ON[e.on]||'自分'}のHPを${e.v}%回復`;
  case'start':return e.k==='shield'?`戦闘開始時、${ON[e.on]}に最大HP${e.v}%の障壁`:`戦闘開始時、${ON[e.on]}の${{atk:'攻撃',def:'防御',mag:'魔力',res:'精神',spd:'素早さ',prot:'被ダメ軽減'}[e.k]}${e.k==='prot'?e.v+'%':'+'+e.v+'%'}（${e.d}T）`;
  case'onaw':return`星臨した時、${ON[e.on]}の${{spd:'素早さ',def:'防御',atk:'攻撃'}[e.k]}${e.v>0?'+':''}${e.v}%（${e.d}T）`;
  case'onhit':return STATK.includes(e.k)?`${cc}当てた敵の${{atk:'攻撃',def:'防御',mag:'魔力',res:'精神',spd:'素早さ'}[e.k]}${e.v}%（${e.d}T）`:`${cc}${pc(e.p)}で${e.k==='poison'?'毒':e.k==='stun'?'スタン':e.k}`;
  case'fu':return`${c||'攻撃のあと'}、${pc(e.p)}で追撃（${e.el||''}・威力${e.pow}）`;case'counter':return`単体攻撃を受けると${pc(e.p)}で反撃（威力${e.pow}）`;
  case'dodge':return`${cc}${e.v}%で攻撃を回避`;case'drain':return`与ダメの${e.v}%を吸収`;case'kill':return`敵を倒すと${e.hp?'HP'+e.hp+'%回復':''}${e.hp&&e.bp?'・':''}${e.bp?'BP+'+e.bp:''}`;
  case'guts':return'倒れるダメージを1度だけHP1で耐える';case'prio':return`行動順+${e.v}%（先に動きやすい）`;case'cleanse':return`毎ターン${pc(e.p)}で弱体を1つ解除`;
  case'taunt':return'敵に狙われやすい';case'hits':return`連撃の技・術の回数+${e.v}`;case'pierce':return`敵の防御・精神を${e.v}%無視`;
  case'stack':return`${e.c==='same'?'同じ敵を続けて攻撃するたび':'攻撃するたび'}与ダメ+${e.v}%（最大${e.max||5}回）`;case'rage':return`攻撃を受けるたび与ダメ+${e.v}%（最大${e.max||5}回）`;
  case'healprot':return`回復した味方の被ダメ-${e.v}%（2T）`;case'delay':return`${cc}${pc(e.p)}で当てた敵の行動を遅らせる`;case'allybp0':return`味方全体の初期BP+${e.v}`;case'allybpr':return`味方全体の毎ターンのBP回復+${e.v}`;
  case'allydmg':return`味方全体の与ダメ+${e.v}%`;case'awturn':return`星臨の持続+${e.v}ターン`;}
 return e.t;}
/* アビリティの各段階の説明（新しく付く効果と、伸びる数値） */
function abDesc(id,i,rank){const A=D.AB[id][i];return A.fx.map(f=>{const e=resolve(f,Math.max(1,rank||1));return active(e)?effTxt(e):null;}).filter(Boolean);}
/* 次の段階で変わること */
function abNext(id,i,rank){if(rank>=5)return[];const A=D.AB[id][i],now=new Set(abDesc(id,i,rank));return abDesc(id,i,rank+1).filter(x=>!now.has(x));}
/* 星盤・天星盤の強化ノード名 */
const abName=(id,i)=>(D.AB[id]&&D.AB[id][i]&&D.AB[id][i].n)||'';

/* ==================== 星臨：AW を置き換える ==================== */
for(const id in D.AWX){if(!AW[id])continue;const X=D.AWX[id];AW[id].turns=D.AW_TURNS;AW[id].type='強化型';AW[id].cmds=[X.ou];
 AWD[id]=`星臨アビリティ「${X.n}」：`+[...X.note,...awEffects(id).map(effTxt)].join('／')+`。奥義「${SK[X.ou].n}」を1度だけ使える`;}
try{GAUGE.length=0;}catch(e){}

/* ==================== 星盤・天星盤のノードを置き換える ==================== */
try{NCOL.ab='#ffb86b';SHORT.ab1=SHORT.ab2=SHORT.ab3='ア';SHORT.ougiUp='奥';if(typeof NTN!=='undefined')NTN.ab='アビリティ強化';}catch(e){}
function fixBoards(){
 for(const id in BOARD){const N=BOARD[id],L=D.LEARN[id];if(!N||!L)continue;const bs=L.find(x=>x[1]==='board');
  if(N['2,-2']&&bs){N['2,-2'].t='skill';N['2,-2'].v=bs[0];N['2,-2'].d=`技「${SK[bs[0]].n}」を習得：${SK[bs[0]].d}`;}
  if(N['-2,2']){Object.assign(N['-2,2'],{t:'ab',v:{abN:1},cost:3,d:`アビリティ「${abName(id,0)}」を強化（+1段階）`});}
  if(N['3,-3']){Object.assign(N['3,-3'],{t:'aw',v:{ougiUp:20},d:'奥義の威力+20%'});}
  if(N['0,-3']&&N['0,-3'].t==='aw')N['0,-3'].d='星臨の持続+1ターン';}
 try{const B2=V31B.BOARD2;for(const id in B2){const N=B2[id],L=D.LEARN[id];if(!N||!L)continue;const b2=L.find(x=>x[1]==='board2');
  if(N['2,-2']&&b2){N['2,-2'].v=b2[0];N['2,-2'].d=`極技「${SK[b2[0]].n}」を習得：${SK[b2[0]].d}`;}
  const ps=(k,ab,g)=>{if(!N[k])return;Object.assign(N[k],{t:'ps',g,v:{ps:'ab_up'+ab},d:ab==='O'?'奥義の威力+30%':`アビリティ「${abName(id,+ab-1)}」を強化（+1段階）`});};
  ps('-2,2','2',3);ps('4,-4','1',1);ps('4,0','2',1);ps('-4,4','3',2);ps('-4,0','O',2);
  if(N['0,-3'])N['0,-3'].d='星臨の持続+1ターン・星臨中与ダメ+20%';}}catch(e){console.error(e);}}
fixBoards();
try{for(const x of['1','2','3','O'])V20.PS['ab_up'+x]={n:x==='O'?'奥義強化':'アビリティ強化',d:x==='O'?'奥義の威力+30%':'アビリティを1段階強化'};}catch(e){}
/* 天星盤の画面の呼び名（「天星パッシブ」→「アビリティ強化」） */
{const _bm=boardMenu;boardMenu=function(m){_bm(m);try{for(const el of[$('#cmd'),$('#labels'),$('#msg')]){if(!el)continue;if(/天星パッシブ|パッシブ/.test(el.innerHTML))el.innerHTML=el.innerHTML.replace(/天星パッシブ/g,'アビリティ強化').replace(/パッシブ/g,'アビリティ');}}catch(e){}};}

/* ==================== 戦闘ユニット ==================== */
{const _h=hero;hero=function(id){const u=_h(id);try{
  /* 旧キャラ専用パッシブ・天星パッシブ（アビリティに置き換え）を外す */
  u.ps20=(u.ps20||[]).filter(p=>!/^c_|^tp_|^ab_up/.test(p.id));
  u.rsSet=setOf(id);u.skills=u.rsSet.slice();
  u.rsE=abEffects(id);
  for(const e of u.rsE)if(e.t==='stat')applyStat(u,e);
  u.awTurn=(u.awTurn||0)+u.rsE.filter(e=>e.t==='awturn').reduce((a,e)=>a+e.v,0);
  u.bpMax=D.BP.max;u.sp=D.BP.start;
 }catch(e){console.error(e);}return u;};}
function applyStat(u,e){const k=e.k,m=1+e.v/100;if(k==='mhp'){const r=u.mhp?u.hp/u.mhp:1;u.mhp=Math.round(u.mhp*m);u.hp=Math.max(u.alive?1:0,Math.round(u.mhp*r));}else if(k==='spd')u.spd=+(u.spd*m).toFixed(2);else if(u[k]!=null)u[k]=Math.round(u[k]*m);
 if(u._b0&&u._b0[k]!=null)u._b0[k]=k==='spd'?+(u._b0[k]*m).toFixed(2):Math.round(u._b0[k]*m);}

/* ==================== 陣形 ==================== */
const formOf=()=>D.FORM[G&&G.form]?G.form:'seikan';
function formEffects(i){const F=D.FORM[formOf()];return(F.s[i]||[]).map(f=>Object.assign({src:F.n},f));}
function applyForm(u,i){u.rsE=(u.rsE||[]).filter(e=>!e.form);const fe=formEffects(i).map(e=>Object.assign(e,{form:1}));for(const e of fe)if(e.t==='stat')applyStat(u,e);u.rsE=u.rsE.concat(fe);u.rsSlot=i;}

/* ==================== セーブ ==================== */
{const _m=migrate;migrate=function(g){const r=_m(g);try{const G0=r||g;G0.form=G0.form||'seikan';for(const id in G0.h){const h=G0.h[id];if(!h)continue;h.skx=h.skx||{};h.glim=h.glim||[];h.sseen=h.sseen||[];}}catch(e){console.error(e);}return r;};}

return{D,pf,rs8,derived,learned,howTxt,setOf,toggleSet,moveSet,profN,profLv,profMul,costOf,keyOf,abRank,abUps,abEffects,awEffects,abDesc,abNext,abName,effTxt,resolve,active,
 formOf,formEffects,applyForm,applyStat,esc,clamp};})();
