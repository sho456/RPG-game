/* ===== ver0.31 装備：枠の再編・各レアリティの新装備・新レジェンド =====
 1. 装備の枠：武器・主防具（main）・副防具（sub）・装飾品×2（acc1・acc2）の 5 枠
    旧データ：体（body）→ 主防具、頭（head）・盾／護符（sub）→ 副防具。王家の冠は装飾品になる（王家の遺品 4 部位を同時に着られる）
    セーブの読み込み時に自動で移し替える（着ていた頭と盾が両方あるときは、強いほうを副防具に残し、もう一方は持ち物へ）
 2. 3 枠ぶんだった防具の性能を 2 枠に配り直した（主防具は防御と HP、副防具は種類ごとに防御・HP・精神・素早さ）
 3. 新しい装備：武器（キャラ別の武器種ごと）・主防具・副防具・装飾品に、コモン〜エピックの名前付き装備を追加。
    名前付き装備は「固有の効果」を 1 つ持つ。装備Lv60・90 からは終盤専用の装備（星鉄・星銀・天極の系統）も出る
 4. 新しいレジェンド（主防具・副防具・装飾品・まだ持っていなかったキャラの武器）
 5. 終盤の付加能力：与ダメ・技の威力・会心ダメ・被ダメ軽減（装備Lv60以上で付く） */
'use strict';
const V31I=(()=>{
const {GINF}=V31;
/* ---------- 枠 ---------- */
const NS=s=>s==='body'?'main':s==='head'?'sub':s;
SLOTS6.splice(0,SLOTS6.length,'w','main','sub','acc1','acc2');
for(const k in SLOTN)delete SLOTN[k];Object.assign(SLOTN,{w:'武器',main:'主防具',sub:'副防具',acc1:'装飾品1',acc2:'装飾品2'});
try{Object.assign(TERMS.EQUIP,{weapon:'武器',armor:'主防具',cloth:'副防具',acc:'装飾品'});
 Object.assign(TERMS.SLOT_CAT,{main:'armor',body:'armor',sub:'cloth',head:'cloth'});
 Object.assign(TERMS.SLOT_LABEL,{main:'主防具',sub:'副防具',body:'主防具',head:'副防具',acc1:'装飾品1',acc2:'装飾品2',acc:'装飾品'});}catch(e){}
try{INVT.arm=['防具',i=>i.slot==='main'||i.slot==='sub'];}catch(e){}
const EMPTY=()=>({w:null,main:null,sub:null,acc1:null,acc2:null});

/* ---------- 付加能力（終盤） ---------- */
Object.assign(OPS,{dmgP:['与ダメ','%',3,8],skDmg:['技の威力','%',5,15],critDmg:['会心ダメ','%',8,25],dmgCut:['被ダメ軽減','%',2,5]});
Object.assign(W8,{dmgP:3,skDmg:1.5,critDmg:.6,dmgCut:3});
const LATE=new Set(['dmgP','skDmg','critDmg','dmgCut']);
try{Object.assign(SHORT,{dmgP:'与',skDmg:'威',critDmg:'撃',dmgCut:'護',magP:'魔',drop:'ド'});}catch(e){}

/* ---------- 武器種と名前付き武器 ---------- */
const WT={rio:'剣',gald:'大剣',mire:'魔導書',noah:'杖',shion:'双剣',erna:'弓',balza:'斧',crow:'大鎌',hakua:'手甲',jin:'爪',celes:'砂時計',valk:'竜剣'};
/* [レアリティ, 名前, 固有の効果] */
const WN={
 剣:[[1,'騎士の剣',{crit:4}],[1,'疾風の剣',{spd:.6}],[2,'蒼月の剣',{weakDmg:14}],[2,'灯火の剣',{atkP:6}],[3,'星剣ルミナス',{awDmg:16}],[3,'天剣アルクス',{atkP:9}]],
 大剣:[[1,'守護の大剣',{defP:5}],[1,'岩砕の大剣',{atkP:4}],[2,'城壁の大剣',{mhpP:8}],[2,'獅子王の大剣',{crit:6}],[3,'聖騎士の大剣',{defP:10}],[3,'大地の大剣',{atkP:9}]],
 魔導書:[[1,'炎の魔導書',{magP:4}],[1,'氷の魔導書',{spGain:4}],[2,'双極の魔導書',{weakDmg:14}],[2,'星詠みの魔導書',{magP:7}],[3,'原初の魔導書',{magP:10}],[3,'紅蓮の魔導書',{awDmg:16}]],
 杖:[[1,'祈りの杖',{resP:5}],[1,'癒しの杖',{spGain:4}],[2,'聖銀の杖',{magP:6}],[2,'天啓の杖',{startAG:14}],[3,'大司教の杖',{resP:10}],[3,'星霊の杖',{magP:9}]],
 双剣:[[1,'影の双剣',{crit:4}],[1,'疾風の双剣',{spd:.6}],[2,'夜叉の双剣',{atkP:6}],[2,'燕返しの双剣',{spd:1}],[3,'朧月の双剣',{crit:9}],[3,'修羅の双剣',{atkP:9}]],
 弓:[[1,'狩人の弓',{crit:4}],[1,'雷の弓',{weakDmg:10}],[2,'鷹目の弓',{crit:7}],[2,'迅雷の弓',{spd:.9}],[3,'天狼の弓',{weakDmg:20}],[3,'流星の弓',{atkP:9}]],
 斧:[[1,'鍛冶師の斧',{atkP:4}],[1,'戦士の斧',{mhpP:5}],[2,'溶岩の斧',{atkP:7}],[2,'巨人の斧',{defP:7}],[3,'炎帝の斧',{atkP:10}],[3,'山砕きの斧',{awDmg:16}]],
 大鎌:[[1,'呪いの大鎌',{magP:4}],[1,'闇夜の大鎌',{crit:4}],[2,'死神の大鎌',{weakDmg:14}],[2,'魂狩りの大鎌',{magP:7}],[3,'葬送の大鎌',{magP:10}],[3,'黄泉の大鎌',{awDmg:16}]],
 手甲:[[1,'拳士の手甲',{atkP:4}],[1,'氷の手甲',{spd:.6}],[2,'吹雪の手甲',{crit:6}],[2,'武神の手甲',{atkP:7}],[3,'氷帝の手甲',{atkP:10}],[3,'金剛の手甲',{defP:10}]],
 爪:[[1,'獣の爪',{atkP:4}],[1,'狩猟の爪',{crit:4}],[2,'獣王の爪',{atkP:7}],[2,'疾風の爪',{spd:.9}],[3,'大地の爪',{mhpP:10}],[3,'神獣の爪',{atkP:10}]],
 砂時計:[[1,'刻の砂時計',{spd:.6}],[1,'銀の砂時計',{magP:4}],[2,'星の砂時計',{magP:7}],[2,'逆巻きの砂時計',{startAG:14}],[3,'永劫の砂時計',{magP:10}],[3,'時の女王の砂時計',{spd:1.4}]],
 竜剣:[[1,'竜鱗の竜剣',{defP:5}],[1,'火竜の竜剣',{atkP:4}],[2,'黒鱗の竜剣',{atkP:7}],[2,'竜騎士の竜剣',{crit:6}],[3,'灼竜の竜剣',{atkP:10}],[3,'竜王家の竜剣',{awDmg:16}]]};
/* 終盤の系統（装備Lv60・90 から）：武器の名前は「系統＋の＋武器種」 */
const LATEW=[[60,1,'星鉄',{dmgP:4}],[60,2,'星銀',{skDmg:10}],[90,3,'天極',{dmgP:8,critDmg:15}]];

/* ---------- 防具・装飾品 ---------- */
/* b：基礎値［係数a, 係数b］→ a + b×装備Lv。fx：固有の効果 */
const B_HEAVY={def:[5,2],mhp:[10,3]},B_LIGHT={def:[3,1.4],mhp:[6,2],spd:[.3,.04]},B_ROBE={def:[2,1],res:[3,1.6],mag:[2,.8]};
const B_SHIELD={def:[4,1.6]},B_HELM={def:[3,1.1],mhp:[6,2]},B_CHARM={res:[3,1.4]},B_BAND={def:[2,.7],spd:[.2,.03],mag:[1,.5]};
const CAT={
 main:[[0,'@の鎧',B_HEAVY],[0,'旅人の外套',B_LIGHT],[0,'見習いのローブ',B_ROBE],
  [1,'騎士の鎧',B_HEAVY,{defP:4}],[1,'狩人の外套',B_LIGHT,{crit:3}],[1,'魔術師のローブ',B_ROBE,{magP:4}],
  [2,'聖騎士の鎧',B_HEAVY,{mhpP:7}],[2,'疾風の外套',B_LIGHT,{spd:.7}],[2,'賢者のローブ',B_ROBE,{resP:7}],
  [3,'竜鱗の鎧',B_HEAVY,{defP:9}],[3,'影縫いの外套',B_LIGHT,{weakDmg:15}],[3,'星詠みのローブ',B_ROBE,{awDmg:14}],
  [1,'星鉄の鎧',B_HEAVY,{dmgCut:2},60],[2,'星銀の外套',B_LIGHT,{dmgP:4},60],[2,'星銀のローブ',B_ROBE,{skDmg:8},60],[3,'天極の鎧',B_HEAVY,{dmgCut:5,mhpP:8},90],[3,'天極の外套',B_LIGHT,{dmgP:7},90],[3,'天極のローブ',B_ROBE,{skDmg:14},90]],
 sub:[[0,'@の小盾',B_SHIELD],[0,'@の兜',B_HELM],[0,'灯の護符',B_CHARM],[0,'@の額当て',B_BAND],
  [1,'騎士の盾',B_SHIELD,{defP:4}],[1,'狩人の兜',B_HELM,{crit:3}],[1,'守りの護符',B_CHARM,{resP:5}],
  [2,'聖銀の盾',B_SHIELD,{mhpP:6}],[2,'獅子の兜',B_HELM,{atkP:5}],[2,'魔除けの護符',B_CHARM,{magP:5}],[2,'疾風の額当て',B_BAND,{spd:.7}],
  [3,'竜鱗の盾',B_SHIELD,{defP:9}],[3,'星の冠',B_BAND,{awDmg:14}],[3,'天使の護符',B_CHARM,{resP:10}],[3,'鬼神の兜',B_HELM,{atkP:8}],
  [1,'星鉄の盾',B_SHIELD,{dmgCut:2},60],[2,'星銀の兜',B_HELM,{critDmg:12},60],[3,'天極の盾',B_SHIELD,{dmgCut:5},90],[3,'天極の冠',B_BAND,{skDmg:12},90]],
 acc:[[0,'生命の指輪',{mhp:[12,5]}],[0,'疾風の指輪',{spd:[.3,.06]}],[0,'魔石の首飾り',{mag:[2,1.2]}],[0,'星砂の首飾り',{res:[2,1.2]}],
  [1,'力の指輪',{atk:[2,1.1]},{atkP:3}],[1,'守りの指輪',{def:[2,1.1]},{defP:3}],[1,'癒しの首飾り',{mhp:[10,4]},{resP:3}],
  [2,'勇者の指輪',{atk:[2,1],mhp:[8,3]},{crit:5}],[2,'賢者の首飾り',{mag:[2,1],res:[2,.8]},{magP:5}],[2,'俊足の指輪',{spd:[.4,.07]},{startAG:12}],
  [3,'星霊の首飾り',{mag:[3,1.3],mhp:[8,3]},{awDmg:15}],[3,'天命の指輪',{atk:[3,1.3],def:[2,.8]},{weakDmg:18}],[3,'覇者の指輪',{atk:[3,1.4]},{crit:8}],
  [1,'星鉄の指輪',{atk:[2,1.1],mag:[2,1.1]},{dmgP:3},60],[2,'星銀の首飾り',{mhp:[12,5]},{critDmg:12},60],[3,'天極の指輪',{atk:[3,1.4],mag:[3,1.4]},{dmgP:6},90],[3,'天極の首飾り',{mhp:[14,6]},{skDmg:12},90]]};

/* ---------- 新しいレジェンド ---------- */
Object.assign(LEG,{
 tenkoku:{n:'天極の聖鎧',slot:'main',d:'受けるダメージ-20%'},seikai:{n:'星海の外套',slot:'main',d:'手番の開始時、SP+10・HP4%回復'},
 haou:{n:'覇王の盾',slot:'sub',d:'戦闘開始時、最大HP25%の障壁を張る'},tengan:{n:'天眼の冠',slot:'sub',d:'会心率+15%・会心ダメ+50%'},
 shuuen:{n:'終焉の指輪',slot:'acc',d:'与ダメ+20%'},seishin:{n:'星神の首飾り',slot:'acc',d:'技の威力+30%'},
 fue:{n:'不壊の大剣',slot:'w',who:'gald',d:'挑発・防御中に受けるダメージ-40%'},tsukikage:{n:'月影の双剣',slot:'w',who:'shion',d:'素早さ+20%・会心率+10%'},
 tenkei:{n:'天恵の杖',slot:'w',who:'noah',d:'回復量+50%'},enjin:{n:'炉神の斧',slot:'w',who:'balza',d:'炎属性の与ダメ+40%'},
 juushin:{n:'獣神の爪',slot:'w',who:'jin',d:'HP50%以下のとき与ダメ+50%・被ダメ-20%'}});
for(const k in LEG)LEG[k].slot=NS(LEG[k].slot);
/* レジェンドの見た目（既存の絵から近いものを使う） */
const LICON={tenkoku:'armor_星鋼',seikai:'L_hoshikuzu',haou:'L_gyokuza',tengan:'S_royal_head',shuuen:'L_kiseki',seishin:'L_senkou',fue:'gsword_星鋼',tsukikage:'dual_星鋼',tenkei:'staff_星鋼',enjin:'axe_星鋼',juushin:'claw_星鋼'};
/* 戦闘中の効果（V20 のパッシブの仕組みに乗せる） */
const LPS={
 L_tenkoku:{n:'天極の聖鎧',d:LEG.tenkoku.d,inc:()=>.8},
 L_seikai:{n:'星海の外套',d:LEG.seikai.d,turn:u=>{u.sp=Math.min(100,u.sp+10);if(u.hp<u.mhp){const v=Math.round(u.mhp*.04);u.hp=Math.min(u.mhp,u.hp+v);pop(u,'+'+v,'#7dffa8',true);}}},
 L_haou:{n:'覇王の盾',d:LEG.haou.d,start:u=>V20.addSt(u,'shield',Math.round(u.mhp*.25),99)},
 L_fue:{n:'不壊の大剣',d:LEG.fue.d,inc:t=>t.taunt>0||t.guard?.6:1},
 L_tenkei:{n:'天恵の杖',d:LEG.tenkei.d,healB:()=>50},
 L_enjin:{n:'炉神の斧',d:LEG.enjin.d,out:(a,t,sk)=>sk&&sk.el==='炎'?1.4:1},
 L_juushin:{n:'獣神の爪',d:LEG.juushin.d,out:a=>a.hp<=a.mhp*.5?1.5:1,inc:t=>t.hp<=t.mhp*.5?.8:1}};
Object.assign(V20.PS,LPS);
{const _h=hero;hero=function(id){const u=_h(id);try{u.ps20=u.ps20||[];for(const l of u.legs||[])if(LPS['L_'+l]&&!u.ps20.some(p=>p.id==='L_'+l))u.ps20.push({id:'L_'+l,v:0});}catch(e){console.error(e);}return u;};}
/* 能力値に効くレジェンド（画面の数値にも出す） */
{const _s=stats;stats=function(id){const o=_s(id),L=o.legs||[];
 if(L.includes('tengan')){o.crit+=15;o.critDmg=(o.critDmg||0)+50;}if(L.includes('shuuen'))o.dmgP=(o.dmgP||0)+20;if(L.includes('seishin'))o.skDmg=(o.skDmg||0)+30;
 if(L.includes('tsukikage')){o.spd=+(o.spd*1.2).toFixed(2);o.crit+=10;}return o;};}

/* ---------- 生成 ---------- */
const pick=a=>a[Math.random()*a.length|0];
const opScale=ilv=>.7+.3*Math.min(1,ilv/40);
function addFx(it,fx){if(!fx)return;for(const k in fx){let v=fx[k]*opScale(it.ilv)*(1+(it.rar||0)*.06);v=k==='spd'?+v.toFixed(1):Math.max(1,Math.round(v));it.ops.push({k,v,fx:1});}}
function catPick(slot,rar,ilv){const L=CAT[slot].filter(e=>(e[4]||0)<=ilv);const ex=L.filter(e=>e[0]===rar);
 if(rar>=1){const late=ex.filter(e=>e[4]);if(late.length&&Math.random()<.45)return pick(late);if(ex.length)return pick(ex.filter(e=>!e[4]).length?ex.filter(e=>!e[4]):ex);}
 return pick(L.filter(e=>e[0]===0));}
function setBase(it,b,mul=1){it.base={};for(const k in b){const[a,c]=b[k];let v=(a+c*it.ilv)*mul;it.base[k]=k==='spd'?+v.toFixed(1):Math.round(v);}}
function weaponName(it){const t=WT[it.who];if(!t||it.leg)return;const late=LATEW.filter(([lv,r])=>it.ilv>=lv&&r===it.rar);
 if(late.length&&Math.random()<.5){const[, ,nm,fx]=pick(late);it.name=nm+'の'+t;addFx(it,fx);return;}
 const ns=(WN[t]||[]).filter(x=>x[0]===it.rar);if(!ns.length)return;const[,nm,fx]=pick(ns);it.name=nm;addFx(it,fx);for(const k in it.base)it.base[k]=Math.round(it.base[k]*(1+.04*it.rar));}
function inflate(it){const g=GINF(it.ilv);if(g===1)return;for(const k in it.base)it.base[k]=k==='spd'?+(it.base[k]*Math.sqrt(g)).toFixed(1):Math.round(it.base[k]*g);}
genItem=function(ilv,minR=0,bonus=0,slot=null,rarFix=null){
 const rar=rarFix!=null?rarFix:rollRar(minR,bonus);ilv=Math.max(1,Math.round(ilv));
 if(!slot){const r=Math.random();slot=r<.3?'w':r<.53?'main':r<.76?'sub':'acc';}
 slot=NS(slot);if(slot==='acc1'||slot==='acc2')slot='acc';
 const it={uid:++G.uid,slot,ilv,rar,plus:0,ops:[],unid:rar>=3,lock:false,base:{}};
 if(rar===4){const al=Object.keys(LEG).filter(k=>!LEG[k].uq),ks=al.filter(k=>LEG[k].slot===slot);it.leg=ks.length?pick(ks):pick(al);it.slot=slot=LEG[it.leg].slot;}
 const m=MATL(ilv);
 if(slot==='w'){it.who=(it.leg&&LEG[it.leg].who)||pick(G.members);wbase(it,ilv,m);if(it.rar>=1&&it.rar<=3)weaponName(it);}
 else{const e=it.leg?null:catPick(slot,rar,ilv);
  if(it.leg){const lb={main:B_HEAVY,sub:B_SHIELD,acc:{atk:[3,1.2],mag:[3,1.2],mhp:[10,3]}}[slot];setBase(it,lb,1.15);}
  else{setBase(it,e[2],1+.04*rar);it.name=e[1].replace('@',m);if(slot==='acc')addFx(it,e[3]);else addFx(it,e[3]);}}
 inflate(it);
 if(it.leg)it.name=LEG[it.leg].n;
 const keys=Object.keys(OPS).filter(k=>ilv>=60||!LATE.has(k));
 for(let i=0;i<rar;i++){
  if(Math.random()<.12&&!it.ops.some(o=>o.k==='atkEl')){it.ops.push({k:'atkEl',v:pick(['光','地','打'])});continue;}
  const av=keys.filter(k=>!it.ops.some(o=>o.k===k));if(!av.length)break;const k=pick(av),[,,a,b]=OPS[k];
  let v=(a+(b-a)*Math.random())*(.6+.4*Math.min(1,ilv/10))*(1+rar*.08);it.ops.push({k,v:k==='spd'?+v.toFixed(1):Math.max(1,Math.round(v))});}
 it.sock=Array(it.rar>=3?2:it.rar>=2?1:0).fill(null);return it;};
fixedItem=function(slot,who,ilv,name){const it=genItem(ilv,0,0,slot,0);if(who&&it.slot==='w'){it.who=who;wbase(it,ilv,MATL(ilv));inflate(it);}if(name)it.name=name;return it;};
/* 王家の遺品：鎧＝主防具、盾＝副防具、冠・指輪＝装飾品 */
const ROY={main:['王家の鎧',B_HEAVY],sub:['王家の盾',B_SHIELD],crown:['王家の冠',{def:[2,.8],mag:[2,.9],mhp:[8,3]}],acc:['王家の指輪',{atk:[2,1.1],mhp:[8,3]}]};
royalItem=function(slot,ilv){slot=slot==='head'?'crown':NS(slot);const R=ROY[slot]||ROY.acc,it=genItem(ilv,0,0,slot==='crown'?'acc':slot,3);it.ops=[];
 for(let i=0;i<3;i++){const av=Object.keys(OPS).filter(k=>!LATE.has(k)&&!it.ops.some(o=>o.k===k)),k=pick(av),[,,a,b]=OPS[k];let v=(a+(b-a)*Math.random())*(1+3*.08);it.ops.push({k,v:k==='spd'?+v.toFixed(1):Math.max(1,Math.round(v))});}
 setBase(it,R[1],1.1);inflate(it);it.set='royal';it.name=R[0];return it;};
try{royalRand=ilv=>royalItem(pick(['main','sub','crown','acc']),ilv);}catch(e){}
{const _u=uqItem;uqItem=function(id){const it=_u(id);inflate(it);return it;};}

/* ---------- 見た目（アイコン） ---------- */
const TIER=['星鋼','銅','鉄','鋼'];
const tierOf=it=>{const n=it.name||'';for(const t of TIER)if(n.startsWith(t+'の'))return t;return MATL(it.ilv||1);};
const WK=[['竜剣','dsword'],['大剣','gsword'],['双剣','dual'],['魔導書','tome'],['大鎌','scythe'],['砂時計','glass'],['手甲','fist'],['爪','claw'],['剣','sword'],['杖','staff'],['弓','bow'],['斧','axe']];
const NAMED={'灯の護符':'charm','守りの護符':'charm','魔除けの護符':'charm','天使の護符':'charm','生命の指輪':'ring_life','疾風の指輪':'ring_wind','俊足の指輪':'ring_wind','魔石の首飾り':'neck_mag','賢者の首飾り':'neck_mag','星霊の首飾り':'neck_mag',
 '星砂の首飾り':'neck_sand','癒しの首飾り':'neck_sand','星銀の首飾り':'neck_sand','天極の首飾り':'L_senkou','天極の指輪':'L_kiseki','覇者の指輪':'L_futago','王家の冠':'S_royal_head','王家の鎧':'S_royal_body','王家の盾':'S_royal_sub','王家の指輪':'S_royal_acc',
 '星の冠':'S_royal_head','天極の冠':'S_royal_head'};
function keyOf(it){const D=IC21.DES;if(!it)return'armor_鉄';if(it.leg&&D['L_'+it.leg])return'L_'+it.leg;if(it.leg&&LICON[it.leg])return LICON[it.leg];
 const n=it.name||'';if(NAMED[n]&&D[NAMED[n]])return NAMED[n];const t=tierOf(it);
 if(it.slot==='w'){const w=WK.find(([s])=>n.includes(s));if(w)return w[1]+'_'+t;}
 if(it.slot==='main')return/外套|ローブ/.test(n)?(it.rar>=3?'L_hoshikuzu':'armor_'+t):'armor_'+t;
 if(it.slot==='sub')return n.includes('護符')?'charm':n.includes('兜')?'helm_'+t:/額当て|冠/.test(n)?'band_'+t:'shield_'+t;
 if(it.slot==='acc')return n.includes('首飾り')?'neck_mag':'ring_life';
 const w=WK.find(([s])=>n.includes(s));return w?w[1]+'_'+t:'armor_'+t;}
itemIcon=function(it){try{return IC21.render(keyOf(it),it&&!it.unid?(it.rar||0):Math.min(2,(it&&it.rar)||0));}catch(e){console.error(e);return ICON.eq;}};

/* ---------- セーブの移し替え ---------- */
function migItems(g){
 for(const it of g.inv||[]){if(it.slot==='body')it.slot='main';else if(it.slot==='head'){it.slot=it.set==='royal'?'acc':'sub';}if(it.leg&&LEG[it.leg])it.slot=LEG[it.leg].slot;}
 for(const id in g.h){const h=g.h[id];if(!h||!h.eq)continue;const e=h.eq;if('main'in e&&!('head'in e)&&!('body'in e))continue;
  const find=u=>u&&(g.inv||[]).find(i=>i.uid===u);const n=EMPTY();n.w=e.w||null;n.acc1=e.acc1||null;n.acc2=e.acc2||null;n.main=e.body||null;
  const cand=[e.sub,e.head].map(find).filter(Boolean);
  /* 王家の冠は装飾品の空きへ */
  for(const it of cand.filter(i=>i.slot==='acc')){if(!n.acc1)n.acc1=it.uid;else if(!n.acc2)n.acc2=it.uid;}
  const subs=cand.filter(i=>i.slot==='sub').sort((a,b)=>{try{return score(b,id)-score(a,id);}catch(x){return 0;}});if(subs[0])n.sub=subs[0].uid;
  h.eq=n;}}
{const _mg=migrate;migrate=function(g){const r=_mg(g);try{migItems(G);if(G.stock)G.stock.forEach(it=>{it.slot=NS(it.slot);});G.mats.seishou=G.mats.seishou||0;}catch(e){console.error(e);}return r;};}
{const _nm=newMember;newMember=function(id){_nm(id);try{const h=G.h[id];if(h&&h.eq&&('head'in h.eq||'body'in h.eq))h.eq=Object.assign(EMPTY(),{w:h.eq.w});}catch(e){console.error(e);}};}
/* 開発用：装備一式 */
devGear=function(lv=55){G.inv=G.inv.filter(i=>!i.dev);for(const id of G.members){const h=G.h[id];h.eq=Object.assign(EMPTY(),h.eq||{});const w=fixedItem('w',id,lv);w.rar=3;w.unid=false;w.dev=1;G.inv.push(w);h.eq.w=w.uid;
 for(const[sl,es]of[['main','main'],['sub','sub'],['acc','acc1'],['acc','acc2']]){const it=genItem(lv,2,0,sl,2);it.unid=false;it.dev=1;G.inv.push(it);h.eq[es]=it.uid;}}};

/* 鍛冶屋の品揃え：出撃ごとに入れ替わる。終盤でも使えるよう、品物のLvの上限を 30 → 100 に（武器2・主防具1・副防具2・装飾品1） */
{const _sm=smith;smith=function(m){try{if(G.stockAt!==G.sorties||!G.stock){const lv=Math.max(1,Math.min(100,Math.max(...G.party.map(i=>G.h[i].lv))-1));
 G.stock=['w','w','main','sub','sub','acc'].map((sl,i)=>genItem(lv,0,0,sl,G.fac.smith>=4&&i===0?2:i%3===2?1:0));G.stockAt=G.sorties;}}catch(e){console.error(e);}return _sm(m);};}
/* 図鑑（装備）の分類：枠の名前 */
return{NS,WT,WN,CAT,LATEW,keyOf,inflate,addFx,migItems,LPS,EMPTY};})();
