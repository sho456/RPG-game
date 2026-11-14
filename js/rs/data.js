/* ===== ver0.37 戦闘システム刷新（データ）=====
 ロマンシング サガ リ・ユニバース（以下 RS）の戦闘の仕組みを分析し、この作品の世界観・キャラに合わせて組み直した。
 分析と対応表は docs/RS-SYSTEM.md。ここは「データ」だけ（能力値・技・術・アビリティ・星臨・陣形）。
 処理は js/rs/core.js（能力値・習得・セーブ）、js/rs/battle.js（ターン・BP・連携・OD）、js/rs/ui.js（画面）。

 呼称（RS に合わせたもの）
  ・技（わざ）＝武器による物理の行動、術（じゅつ）＝魔法の行動。まとめて「技・術」
  ・BP（バトルポイント）＝技・術の消費。毎ターン回復する。通常攻撃は消費 0
  ・威力ランク（E〜SSS）、連携（続けて攻撃するとダメージが伸びる）、オーバードライブ（OD）、ひらめき、技の熟練（技Lv）
  ・アビリティ（旧パッシブ）、陣形
  ・能力値：腕力・体力・器用さ・素早さ・知力・精神・愛・魅力
 RS の固有の技名・キャラ・絵は使っていない（仕組みと呼び名だけを取り入れ、中身はこの作品のもの） */
'use strict';
const RSD=(()=>{

/* ==================== 能力値（8 種） ==================== */
const ST8=['str','vit','dex','agi','int','wil','lov','cha'];
const ST8N={str:'腕力',vit:'体力',dex:'器用さ',agi:'素早さ',int:'知力',wil:'精神',lov:'愛',cha:'魅力'};
const ST8D={
 str:'剣・大剣・棍棒・体術などの技の威力',
 vit:'物理の被ダメージを減らす（防御）',
 dex:'小剣・弓・剣の技の威力と、会心率',
 agi:'行動順（高いほど先に動く）。体術・小剣の威力にも少し',
 int:'術の威力',
 wil:'術の被ダメージを減らす（精神）',
 lov:'回復の技・術の回復量',
 cha:'技・術の追加効果（状態異常・弱体）の成功率と、OD の溜まりやすさ'};
/* 武器種：技の威力に使う能力値の配分（RS の「武器ごとに参照する能力値」に相当） */
const WPN={
 '剣':{str:.6,dex:.4},'大剣':{str:.8,vit:.2},'小剣':{dex:.8,str:.2},'弓':{dex:.8,str:.2},'棍棒':{str:.9,vit:.1},
 '大鎌':{str:.6,int:.4},'体術':{str:.5,agi:.5},'爪':{str:.6,agi:.4},'杖':{str:.7,dex:.3}};
/* キャラごとの 8 能力。腕力などの「武器の主能力」は旧来の攻撃と同じ強さになるよう自動で決める（core.js）。
 hand：主能力以外で手で決める値（Lv1）と成長（S〜D） */
const HERO={
 rio:  {w:'剣',  hand:{dex:[30,'B'],lov:[30,'B'],cha:[32,'A']}},
 gald: {w:'大剣',hand:{dex:[18,'D'],lov:[26,'B'],cha:[22,'C']}},
 mire: {w:'杖',  hand:{dex:[22,'C'],lov:[20,'C'],cha:[34,'A']}},
 shion:{w:'小剣',hand:{str:[22,'C'],lov:[16,'D'],cha:[24,'B']}},
 noah: {w:'杖',  hand:{dex:[20,'C'],lov:[44,'S'],cha:[30,'B']}},
 erna: {w:'弓',  hand:{str:[26,'B'],lov:[22,'C'],cha:[28,'B']}},
 balza:{w:'棍棒',hand:{dex:[22,'C'],lov:[24,'C'],cha:[18,'D']}},
 crow: {w:'大鎌',hand:{dex:[24,'B'],lov:[12,'D'],cha:[40,'S']}},
 hakua:{w:'体術',hand:{dex:[30,'A'],lov:[26,'B'],cha:[26,'B']}},
 jin:  {w:'爪',  hand:{dex:[26,'B'],lov:[30,'B'],cha:[22,'C']}},
 celes:{w:'杖',  hand:{dex:[24,'B'],lov:[28,'B'],cha:[36,'A']}},
 valk: {w:'大剣',hand:{dex:[22,'C'],lov:[14,'D'],cha:[30,'B']}}};

/* ==================== BP・威力ランク・連携・OD ==================== */
const BP={max:20,start:6,regen:3,basic:1};
const RANK={E:.8,D:1.05,C:1.35,B:1.65,A:2,S:2.5,SS:3.2,SSS:4.2};
const RANKS=Object.keys(RANK);
const RBP={E:1,D:2,C:3,B:4,A:6,S:8,SS:10,SSS:12};
/* 連携：同じターンに味方が続けて攻撃すると、2 人目からダメージが伸びる（敵の行動・攻撃以外の行動で途切れる） */
const CHAIN=[1,1,1.15,1.3,1.45,1.6];
const OD={max:100,act:2.5,chain:2.5,weak:1.5,hurt:12,mul:1.2};
/* 技の熟練：使うほど技Lvが上がる（1〜10）。威力+2%/Lv、Lv4 と Lv8 で消費BP-1（最低1） */
const PROF=[0,3,8,15,25,40,60,85,115,150];

/* ==================== 技・術 ==================== */
const TGT={one:'敵単体',all:'敵全体',ally:'味方1人',self:'自分',allies:'味方全体'};
const ON={t:'対象',self:'自分',allies:'味方全体',enemies:'敵全体'};
const STK={atk:'攻撃',def:'防御',mag:'魔力',res:'精神',spd:'素早さ',crit:'会心率'};
function fxTxt(f){const on=ON[f.on||'t']||'',p=f.p!=null&&f.p<1?`${Math.round(f.p*100)}%で`:'',T=f.t>=50?'':`(${f.t}T)`;let s;
 if(STK[f.k])s=`${on}の${STK[f.k]}${f.v>0?'↑':'↓'}${Math.abs(f.v)}%${T}`;
 else if(f.k==='poison')s=`${on}を毒(最大HP${Math.round(f.v*100)}%/T)${T}`;
 else if(f.k==='stun')s=`${on}をスタン(1回休み・ボスは遅延)`;
 else if(f.k==='weak')s=`${on}に${f.el}弱点を付与${T}`;
 else if(f.k==='regen')s=`${on}に継続回復(最大HP${Math.round(f.v*100)}%/T)${T}`;
 else if(f.k==='prot')s=`${on}の被ダメ-${f.v}%${T}`;
 else if(f.k==='mark')s=`${on}の被ダメ+${f.v}%${T}`;
 else if(f.k==='shield')s=`${on}に障壁(最大HP${Math.round(f.v*100)}%)`;
 else if(f.k==='counter')s=`${on}に反撃態勢(威力${f.v})${T}`;
 else if(f.k==='evade')s=`${on}の回避+${f.v}%${T}`;
 else s=`${on}に${f.k}`;return p+s;}
/* S(id, 定義)：ty 技|術、k 種類、rk 威力ランク、bp 消費、t 対象、hits 回数、fx 対象への追加効果、self 自分への効果、post 攻撃後の範囲効果、
 prio 1＝先制 -1＝後発。その他（delay・cond20・pierce20・drain・steal・purge20・heal20・cleanse20・taunt20・auto…）は旧来の処理にそのまま渡す */
const NEW={};
function S(id,o){const sk={n:o.n,ty:o.ty||'技',k:o.k||'phys',el:o.el===undefined?null:o.el,t:o.t||'one',rk:o.rk||null,rs:1};
 const atk=sk.k==='phys'||sk.k==='mag';
 if(atk&&o.rk){let p=RANK[o.rk];if(sk.t==='all')p*=.62;if(o.hits>1){sk.hits=o.hits;p=p/o.hits*1.08;}sk.pow=+p.toFixed(3);}
 if(o.pow!=null)sk.pow=o.pow;
 sk.bp=o.bp!=null?o.bp:o.rk?RBP[o.rk]+(sk.t==='all'?2:0):3;
 if(o.fx)sk.fx20=o.fx.map(f=>Object.assign({on:'t'},f));
 if(o.self)sk.self20=o.self;
 if(o.sup)sk.fx20=o.sup;
 for(const k of['delay','cond20','pierce20','drain','steal','purge20','heal20','cleanse20','taunt20','auto','prio','post','crit','ct20','fixedK','glim','ougi','hits','role','w','revive'])if(o[k]!=null)sk[k]=o[k];
 if(sk.k==='sup20'&&!sk.role)sk.role=o.heal20?'heal':'buff';
 sk.d=o.d||descOf(sk);NEW[id]=sk;return sk;}
const CONDN={brk:'HP半分以下の敵に威力1.5倍',debuff:'弱体1つにつき威力+25%（最大+75%）',lowhp:'自分のHPが減るほど威力上昇（最大+80%）',spd:'敵より速いほど威力上昇（最大+40%）',poison:'毒の敵に威力1.8倍',full:'HP満タンの敵に威力1.5倍'};
function descOf(s){const L=[];
 if(s.k==='phys'||s.k==='mag')L.push(`${s.el||'無'}・${TGT[s.t]||''}・威力${s.rk||'特'}${s.hits>1?'×'+s.hits+'回':''}`);
 else if(s.k==='heal')L.push(`${TGT[s.t]}のHPを${Math.round(s.pow*100)}%回復`);
 else if(s.k==='sup20'){if(s.heal20)L.push(`味方全体のHPを${Math.round(s.heal20*100)}%回復`);if(s.cleanse20)L.push('味方全体の弱体を解除');}
 if(s.prio===1)L.push('先制');if(s.prio===-1)L.push('後発（最後に動く）');
 if(s.delay)L.push('対象の行動を遅らせる');if(s.pierce20)L.push(`防御・精神を${Math.round(s.pierce20*100)}%無視`);if(s.drain)L.push(`与ダメの${Math.round(s.drain*100)}%を吸収`);
 if(s.steal)L.push('攻撃しつつ盗む');if(s.purge20)L.push('対象の強化を全て解除');if(s.crit)L.push(`会心率+${s.crit}%`);if(s.cond20)L.push(CONDN[s.cond20]);
 if(s.auto)L.push('敵の弱点の属性に変化');if(s.taunt20)L.push(`${s.taunt20}T挑発（敵に狙われやすい）`);if(s.ct20)L.push('味方の行動を早める');
 for(const f of s.fx20||[])L.push(fxTxt(f));for(const f of s.self20||[])L.push(fxTxt(Object.assign({on:'self'},f)));for(const f of s.post||[])L.push(fxTxt(f));
 return L.join('／');}

const E10=['斬','打','突','炎','氷','雷','風','地','光','闇'];
/* --- リオ（剣・光） --- */
S('koujin',{n:'光刃',el:'光',rk:'B',fx:[{k:'def',v:-15,t:2,p:.5}]});
S('harai',{n:'斬り払い',el:'斬',rk:'C',t:'all',fx:[{k:'atk',v:-15,t:2,p:.3}]});
S('kobu',{n:'鼓舞の灯',k:'sup20',t:'self',bp:6,heal20:.15,sup:[{on:'allies',k:'atk',v:15,t:3},{on:'allies',k:'mag',v:15,t:3}]});
S('torirensan',{n:'灯火連斬',el:'光',rk:'A',hits:3,cond20:'brk',crit:20,glim:{from:'koujin',lv:20,p:.1}});
S('shiden',{n:'紫電一閃',el:'雷',rk:'S',prio:1,fx:[{k:'stun',v:1,t:1,p:.35}]});
S('x_rio1',{n:'天灯星斬',el:'光',rk:'SSS',fx:[{k:'def',v:-25,t:3}],self:[{k:'atk',v:20,t:3}]});
S('seikou',{n:'星光終天斬',el:'光',pow:6,bp:0,ougi:1,post:[{on:'allies',k:'atk',v:20,t:3},{on:'allies',k:'mag',v:20,t:3}]});
/* --- ガルド（大剣と盾・地） --- */
S('tateuchi',{n:'盾撃',el:'打',rk:'C',delay:35,fx:[{k:'atk',v:-15,t:2,p:.4}]});
S('chouhatsu',{n:'挑発',k:'sup20',t:'self',bp:3,taunt20:2,sup:[{on:'self',k:'def',v:30,t:2},{on:'self',k:'res',v:30,t:2}],role:'guard'});
S('chiretsu',{n:'地裂斬',el:'地',rk:'A',fx:[{k:'def',v:-25,t:3,p:.6}]});
S('saigan',{n:'砕岩撃',el:'打',rk:'B',t:'all',fx:[{k:'spd',v:-20,t:2,p:.4}],glim:{from:'tateuchi',lv:20,p:.1}});
S('teppekikamae',{n:'鉄壁の構え',k:'sup20',t:'self',bp:6,taunt20:2,sup:[{on:'allies',k:'prot',v:20,t:2},{on:'self',k:'counter',v:1.2,t:3}],role:'guard'});
S('x_gald1',{n:'天崩撃',el:'地',rk:'SSS',fx:[{k:'def',v:-30,t:3}],post:[{on:'allies',k:'prot',v:20,t:2}]});
S('houkai',{n:'城壁崩し',el:'地',pow:1,t:'all',bp:0,ougi:1,fixedK:'store',d:'受け止めて蓄積した力（蓄積×0.9＋攻撃×3）を敵全体へ放つ。蓄積は0に戻る'});
/* --- ミレイユ（杖・炎と氷の術） --- */
S('fire',{n:'ファイア',ty:'術',k:'mag',el:'炎',rk:'B',fx:[{k:'poison',v:.04,t:3,p:.3}]});
S('blizz',{n:'ブリザド',ty:'術',k:'mag',el:'氷',rk:'B',fx:[{k:'spd',v:-20,t:2,p:.4}]});
S('flamewave',{n:'フレイムウェーブ',ty:'術',k:'mag',el:'炎',rk:'B',t:'all',fx:[{k:'res',v:-15,t:2,p:.3}]});
S('prism',{n:'プリズム・ブランド',ty:'術',k:'mag',el:'炎',rk:'A',fx:[{k:'weak',el:'炎',t:3},{k:'weak',el:'氷',t:3}],glim:{from:'fire',lv:20,p:.1}});
S('meteor',{n:'メテオスウォーム',ty:'術',k:'mag',el:'炎',rk:'S',t:'all',hits:3,bp:11});
S('x_mire2',{n:'アブソリュート・ゼロ',ty:'術',k:'mag',el:'氷',rk:'SSS',fx:[{k:'stun',v:1,t:1,p:.4}]});
S('zettai',{n:'絶対零度の太陽',ty:'術',k:'mag',el:null,t:'all',pow:3.8,bp:0,ougi:1,post:[{on:'enemies',k:'res',v:-30,t:3}]});
/* --- シオン（小剣・風） --- */
S('shippu',{n:'疾風斬',el:'風',rk:'C',prio:1,steal:1});
S('kagenui',{n:'影縫い',el:'突',rk:'C',bp:4,delay:40,fx:[{k:'spd',v:-20,t:2,p:.5}]});
S('dokujin',{n:'毒刃',el:'突',rk:'B',fx:[{k:'poison',v:.05,t:3,p:.75}]});
S('genei',{n:'幻影乱舞',el:'風',rk:'A',hits:4,cond20:'spd',glim:{from:'shippu',lv:20,p:.1}});
S('oborozuki',{n:'朧月',el:'斬',rk:'B',t:'all',self:[{k:'evade',v:25,t:2}]});
S('x_shion1',{n:'瞬影千刃',el:'風',rk:'SSS',hits:7,delay:30});
S('ou_shion',{n:'影縫・千刃乱',el:'風',pow:6,hits:6,bp:0,ougi:1,prio:1,fx:[{k:'stun',v:1,t:1,p:.5}]});
/* --- ノア（杖・光の術と回復） --- */
S('inori',{n:'祈り',ty:'術',k:'heal',t:'ally',pow:.35,bp:4,post:[{on:'t',k:'regen',v:.05,t:2}],role:'heal'});
S('holy',{n:'ホーリー',ty:'術',k:'mag',el:'光',rk:'B',fx:[{k:'mark',v:15,t:2,p:.4}]});
S('mamori',{n:'守りの祈り',ty:'術',k:'sup20',t:'self',bp:6,sup:[{on:'allies',k:'prot',v:25,t:3}],role:'guard'});
S('regene',{n:'リジェネレイト',ty:'術',k:'sup20',t:'self',bp:7,heal20:.2,cleanse20:1,sup:[{on:'allies',k:'regen',v:.08,t:3}],glim:{from:'inori',lv:20,p:.12}});
S('dispel',{n:'ディスペル・ライト',ty:'術',k:'mag',el:'光',rk:'A',purge20:1});
S('x_noah1',{n:'天使の福音',ty:'術',k:'sup20',t:'self',bp:12,heal20:.6,cleanse20:1,sup:[{on:'allies',k:'regen',v:.08,t:3}]});
S('ou_noah',{n:'聖機の福音',ty:'術',k:'reviveAll',t:'self',bp:0,ougi:1,post:[{on:'allies',k:'prot',v:30,t:3}],d:'戦闘不能の味方を復活させ、味方全体のHPを40%回復／味方全体の被ダメ-30%(3T)'});
/* --- エルナ（弓・雷） --- */
S('raiya',{n:'雷矢',el:'雷',rk:'B',fx:[{k:'spd',v:-15,t:2,p:.3}]});
S('nerai',{n:'狙い撃ち',el:'突',rk:'A',pierce20:.3,crit:20});
S('samidare',{n:'五月雨撃ち',el:'突',rk:'B',t:'all',hits:2});
S('ashidome',{n:'足止めの矢',el:'突',rk:'B',bp:5,delay:30,fx:[{k:'spd',v:-30,t:3}],glim:{from:'raiya',lv:20,p:.1}});
S('kantsuu',{n:'貫通射',el:'突',rk:'S',pierce20:.5});
S('x_erna1',{n:'天穿雷霆',el:'雷',rk:'SSS',pierce20:.5,fx:[{k:'stun',v:1,t:1,p:.3}]});
S('ou_erna',{n:'天穿・神鳴',el:'雷',t:'all',pow:3.6,bp:0,ougi:1,fx:[{k:'stun',v:1,t:1,p:.4}]});
/* --- バルザ（槌・炎） --- */
S('tekkai',{n:'鉄塊落とし',el:'打',rk:'B',fx:[{k:'def',v:-15,t:2,p:.4}]});
S('shuuri',{n:'鍛冶師の手入れ',k:'sup20',t:'self',bp:5,sup:[{on:'allies',k:'def',v:20,t:3},{on:'self',k:'atk',v:15,t:3}]});
S('kaentanda',{n:'火炎鍛打',el:'炎',rk:'A',self:[{k:'atk',v:20,t:3}],fx:[{k:'poison',v:.04,t:3,p:.3}]});
S('daichiwari',{n:'大地割り',el:'地',rk:'B',t:'all',fx:[{k:'spd',v:-20,t:2,p:.5}],glim:{from:'tekkai',lv:20,p:.1}});
S('gouen',{n:'業炎',el:'炎',rk:'A',t:'all'});
S('x_balza1',{n:'灼熱の鉄槌',el:'炎',rk:'SSS',prio:-1,self:[{k:'atk',v:30,t:3}]});
S('youtetsu',{n:'溶鉄爆砕',el:'炎',t:'all',pow:3.6,bp:0,ougi:1,fx:[{k:'def',v:-30,t:3}]});
/* --- クロウ（大鎌・闇の術） --- */
S('noroi',{n:'呪い',ty:'術',k:'mag',el:'闇',rk:'B',fx:[{k:'poison',v:.05,t:3,p:.5}]});
S('yaminami',{n:'闇波',ty:'術',k:'mag',el:'闇',rk:'C',t:'all',fx:[{k:'res',v:-15,t:2,p:.3}]});
S('fushoku',{n:'腐食の呪い',ty:'術',k:'mag',el:'闇',rk:'C',bp:5,fx:[{k:'def',v:-25,t:3},{k:'res',v:-25,t:3}]});
S('tamakurai',{n:'魂喰らい',ty:'術',k:'mag',el:'闇',rk:'A',drain:.4,cond20:'debuff',glim:{from:'noroi',lv:20,p:.1}});
S('shisen',{n:'死の宣告',ty:'術',k:'mag',el:'闇',rk:'S',bp:9,cond20:'poison'});
S('x_crow1',{n:'冥王の審判',ty:'術',k:'mag',el:'闇',rk:'SS',t:'all',bp:13,fx:[{k:'poison',v:.06,t:3,p:.6}]});
S('ou_crow',{n:'死経',ty:'術',k:'pct',t:'all',bp:0,ougi:1,d:'敵全体の今のHPの40%を削る（ボスは12%）。防御・耐性に左右されない'});
/* --- ハクア（体術・氷） --- */
S('shouken',{n:'掌底',el:'打',rk:'C',hits:2,fx:[{k:'def',v:-10,t:2,p:.3}]});
S('hyouken',{n:'氷拳',el:'氷',rk:'B',fx:[{k:'spd',v:-15,t:2,p:.4}]});
S('hyouketsu',{n:'氷結掌',el:'氷',rk:'A',fx:[{k:'stun',v:1,t:1,p:.35}]});
S('hyakuretsu',{n:'百裂拳',el:'打',rk:'A',hits:6,bp:7,glim:{from:'shouken',lv:20,p:.1}});
S('tsurara',{n:'氷柱落とし',el:'氷',rk:'A',t:'all',bp:9});
S('x_hakua1',{n:'氷華千連',el:'氷',rk:'SSS',hits:10});
S('ranbu',{n:'氷華乱舞・終の型',k:'rhythm',el:'氷',t:'one',bp:0,ougi:1,d:'白い輪が青い輪に重なった瞬間にタップ。決まるほど連撃が伸びる（最大16連）。12連以上で敵を凍結'});
/* --- ジン（爪・地、相棒ポポ） --- */
S('tsume',{n:'爪撃',el:'斬',rk:'B',hits:2});
S('popo',{n:'ポポ突撃',el:'地',rk:'B',hits:2,fx:[{k:'atk',v:-15,t:2,p:.5}]});
S('kazekiri',{n:'風切り',el:'風',rk:'B',t:'all'});
S('kemonohoko',{n:'獣の咆哮',k:'sup20',t:'self',bp:6,sup:[{on:'allies',k:'atk',v:20,t:3},{on:'enemies',k:'def',v:-10,t:3}],glim:{from:'tsume',lv:20,p:.1}});
S('goga',{n:'剛牙',el:'斬',rk:'S'});
S('x_jin2',{n:'ポポ・メテオ',el:'地',rk:'SSS',fx:[{k:'atk',v:-20,t:3}]});
S('ou_jin',{n:'獣王撃',el:'斬',pow:6,bp:0,ougi:1,auto:E10,d:'ポポと一つになった全力の一撃。敵の弱点の属性に変化する'});
/* --- セレス（杖・時の術） --- */
S('tokiya',{n:'刻の矢',ty:'術',k:'mag',el:null,rk:'B'});
S('chien',{n:'遅延の砂',ty:'術',k:'mag',el:null,rk:'C',t:'all',delay:30,fx:[{k:'spd',v:-15,t:2,p:.5}]});
S('kasoku',{n:'加速の刻',ty:'術',k:'sup20',t:'self',bp:5,ct20:.3,sup:[{on:'allies',k:'spd',v:25,t:3}]});
S('chronoslow',{n:'クロノスロウ',ty:'術',k:'mag',el:null,rk:'B',t:'all',fx:[{k:'spd',v:-25,t:3}],glim:{from:'tokiya',lv:20,p:.1}});
S('shuuen',{n:'終焉の針',ty:'術',k:'mag',el:null,rk:'S',bp:9});
S('x_celes2',{n:'永劫の刻',ty:'術',k:'sup20',t:'self',bp:12,ct20:.5,sup:[{on:'allies',k:'spd',v:40,t:3},{on:'allies',k:'atk',v:20,t:3},{on:'allies',k:'mag',v:20,t:3}]});
S('makimodoshi',{n:'巻き戻し',ty:'術',k:'rewind',t:'self',bp:0,ougi:1,d:'星臨した瞬間まで、味方全員のHP・戦闘不能を巻き戻す'});
/* --- ヴァルク（大剣・炎と闇の竜） --- */
S('ryuuga',{n:'竜牙斬',el:'炎',rk:'B',fx:[{k:'poison',v:.04,t:3,p:.3}]});
S('kokuen',{n:'黒炎薙ぎ',el:'闇',rk:'C',t:'all'});
S('ryurinkamae',{n:'竜鱗の構え',k:'sup20',t:'self',bp:5,sup:[{on:'self',k:'shield',v:.22,t:99},{on:'self',k:'counter',v:1,t:3}],role:'guard'});
S('ryuumetsu',{n:'竜滅斬',el:'斬',rk:'S',glim:{from:'ryuuga',lv:20,p:.1}});
S('gouka',{n:'劫火',el:'炎',rk:'A',t:'all',fx:[{k:'poison',v:.04,t:3,p:.4}]});
S('x_valk2',{n:'黒竜断',el:'闇',rk:'SSS',drain:.2});
S('gokuvalk',{n:'終焉竜咆',el:'炎',t:'all',pow:3.8,bp:0,ougi:1});
/* --- ジョブの技（各ジョブ 1 つに統合） --- */
S('j_kenshi',{n:'烈風二段',el:'風',rk:'B',hits:2});
S('j_juukishi',{n:'護りの構え',k:'sup20',t:'self',bp:4,taunt20:2,sup:[{on:'self',k:'def',v:30,t:2},{on:'self',k:'prot',v:20,t:2}],role:'guard'});
S('j_iyashi',{n:'癒しの光',ty:'術',k:'sup20',t:'self',bp:6,heal20:.25,cleanse20:1});
S('j_kariudo',{n:'看破の矢',el:'突',rk:'B',auto:E10});

/* キャラごとの技・術の習得（lv：レベル／glim：ひらめき／board：星盤／board2：天星盤） */
const LEARN={
 rio:  [['koujin','lv',1],['harai','lv',1],['kobu','lv',10],['torirensan','glim',20],['shiden','board'],['x_rio1','board2']],
 gald: [['tateuchi','lv',1],['chouhatsu','lv',1],['chiretsu','lv',10],['saigan','glim',20],['teppekikamae','board'],['x_gald1','board2']],
 mire: [['fire','lv',1],['blizz','lv',1],['flamewave','lv',10],['prism','glim',20],['meteor','board'],['x_mire2','board2']],
 shion:[['shippu','lv',1],['kagenui','lv',1],['dokujin','lv',10],['genei','glim',20],['oborozuki','board'],['x_shion1','board2']],
 noah: [['inori','lv',1],['holy','lv',1],['mamori','lv',10],['regene','glim',20],['dispel','board'],['x_noah1','board2']],
 erna: [['raiya','lv',1],['nerai','lv',1],['samidare','lv',10],['ashidome','glim',20],['kantsuu','board'],['x_erna1','board2']],
 balza:[['tekkai','lv',1],['shuuri','lv',1],['kaentanda','lv',10],['daichiwari','glim',20],['gouen','board'],['x_balza1','board2']],
 crow: [['noroi','lv',1],['yaminami','lv',1],['fushoku','lv',10],['tamakurai','glim',20],['shisen','board'],['x_crow1','board2']],
 hakua:[['shouken','lv',1],['hyouken','lv',1],['hyouketsu','lv',10],['hyakuretsu','glim',20],['tsurara','board'],['x_hakua1','board2']],
 jin:  [['tsume','lv',1],['popo','lv',1],['kazekiri','lv',10],['kemonohoko','glim',20],['goga','board'],['x_jin2','board2']],
 celes:[['tokiya','lv',1],['chien','lv',1],['kasoku','lv',10],['chronoslow','glim',20],['shuuen','board'],['x_celes2','board2']],
 valk: [['ryuuga','lv',1],['kokuen','lv',1],['ryurinkamae','lv',10],['ryuumetsu','glim',20],['gouka','board'],['x_valk2','board2']]};
const JOBSK={kenshi:'j_kenshi',juukishi:'j_juukishi',iyashi:'j_iyashi',kariudo:'j_kariudo'};

/* ==================== アビリティ（旧パッシブ） ====================
 1 人 3 つ。Lv で解放され（I）、Lv と星盤・天星盤で強化される（最大 V）。1 つのアビリティに細かい効果がいくつも付き、
 段階が上がるごとに効果が増え、数値も伸びる。配列［I,II,III,IV,V］の 0 はその段階ではまだ無い効果。
 効果の種類（処理は battle.js の EF）
  dmg 与ダメ+% ／ cut 被ダメ-% ／ crit 会心率+ ／ critd 会心ダメ+% ／ stat 能力+%（atk def mag res spd mhp） ／ bp0 初期BP ／ bpr 毎ターンのBP回復
  bpcut 消費BP- ／ od OD上昇+% ／ chain 連携ダメ+% ／ ag 星臨ゲージ上昇+% ／ heal 回復量+% ／ regen 毎ターン回復（自分・味方全体・最も減った味方）
  start 戦闘開始時の強化 ／ onhit 攻撃が当たると状態付与 ／ fu 追撃 ／ counter 反撃 ／ dodge 回避 ／ drain 吸収 ／ kill 撃破時（BP・HP）
  guts 致死ダメージを1度だけHP1で耐える ／ prio 行動順+% ／ cleanse 毎ターン弱体を解除 ／ taunt 狙われやすさ ／ hits 連撃+ ／ pierce 防御無視%
  stack 行動ごとに与ダメが積み上がる ／ rage 被弾ごとに攻撃が積み上がる ／ healprot 回復した味方に被ダメ軽減 ／ delay 当てた敵を遅らせる ／ allybp0 味方全体の初期BP
 条件 c：phys mag basic skill weak weakmag single aoe multi el:炎|闇 hpfull hplow hphigh tlow tfull boss debuffed allyaw altel crit any */
const ABL=[1,25,50];/* アビリティ 1〜3 の解放Lv。そこから +30Lv ごとに段階が上がる（最大 III）。星盤・天星盤で +1 ずつ（最大 V） */
const AB={
 rio:[
  {n:'灯火の導き',fx:[{t:'start',on:'allies',k:'atk',r:[8,10,12,15,18],d:3},{t:'start',on:'allies',k:'mag',r:[8,10,12,15,18],d:3},{t:'crit',r:[0,3,5,7,10]},{t:'bp0',r:[0,1,1,2,2]},{t:'od',r:[0,0,10,15,20]},{t:'chain',r:[0,0,0,5,10]}]},
  {n:'空白の共鳴',fx:[{t:'dmg',c:'allyaw',r:[20,22,25,28,32]},{t:'ag',r:[10,15,20,25,30]},{t:'cut',r:[0,5,8,10,12]},{t:'awturn',r:[0,0,0,1,1]}]},
  {n:'星継ぐ者',fx:[{t:'dmg',r:[10,13,16,20,25]},{t:'dmg',c:'aw',r:[10,15,20,25,30]},{t:'bpr',r:[0,0,1,1,1]},{t:'guts',r:[0,0,0,1,1]}]}],
 gald:[
  {n:'鉄壁の誓い',fx:[{t:'cut',c:'hphigh',r:[15,17,20,22,25]},{t:'taunt',r:[1,1,2,2,3]},{t:'regen',on:'self',r:[0,2,3,4,5]},{t:'bp0',r:[0,1,1,1,2]}]},
  {n:'報復の盾',fx:[{t:'counter',r:[.3,.35,.4,.45,.5],pw:[.8,.9,1,1.2,1.4]},{t:'start',on:'self',k:'def',r:[0,10,15,20,25],d:3},{t:'cut',r:[0,0,5,8,10]}]},
  {n:'城塞の主',fx:[{t:'start',on:'allies',k:'shield',r:[10,12,15,18,20],d:99},{t:'cut',r:[10,12,15,20,25]},{t:'guts',r:[0,0,1,1,1]},{t:'od',r:[0,10,15,20,25]}]}],
 mire:[
  {n:'双極循環',fx:[{t:'dmg',c:'altel',r:[15,18,20,25,30]},{t:'dmg',c:'mag',r:[0,5,8,10,15]},{t:'bpcut',c:'mag',r:[0,0,0,1,1]},{t:'od',r:[0,0,10,10,15]}]},
  {n:'魔力暴走',fx:[{t:'onhit',c:'crit',k:'res',r:[-15,-15,-20,-20,-25],d:2},{t:'critd',r:[0,10,15,20,25]},{t:'crit',r:[5,6,8,10,12]},{t:'kill',bp:[0,1,1,2,2]}]},
  {n:'魔導の深淵',fx:[{t:'dmg',c:'mag',r:[15,20,25,30,35]},{t:'dmg',c:'weakmag',r:[0,10,15,20,25]},{t:'bpr',r:[0,0,1,1,1]}]}],
 shion:[
  {n:'影走り',fx:[{t:'start',on:'self',k:'spd',r:[20,25,30,35,40],d:3},{t:'prio',r:[10,15,20,25,30]},{t:'dodge',r:[0,5,8,10,12]}]},
  {n:'追い打ち',fx:[{t:'fu',c:'weak',r:[.3,.35,.4,.45,.5],pw:[.5,.6,.7,.8,1],el:'風'},{t:'crit',r:[0,5,8,10,12]},{t:'chain',r:[0,0,5,10,15]}]},
  {n:'千影',fx:[{t:'fu',c:'single',r:[.25,.3,.35,.4,.45],pw:.8,el:'風'},{t:'stat',k:'spd',r:[10,12,15,20,25]},{t:'kill',bp:[0,1,1,2,2]}]}],
 noah:[
  {n:'慈愛の機構',fx:[{t:'regen',on:'lowest',r:[6,7,8,9,10]},{t:'heal',r:[0,10,15,20,25]},{t:'cleanse',r:[0,0,.2,.3,.4]}]},
  {n:'聖印の加護',fx:[{t:'healprot',r:[15,18,20,22,25]},{t:'bpr',r:[0,0,1,1,1]},{t:'cut',r:[0,5,8,10,12]}]},
  {n:'聖域の守り',fx:[{t:'start',on:'allies',k:'prot',r:[15,18,20,22,25],d:3},{t:'regen',on:'allies',r:[3,3,4,4,5]},{t:'od',r:[0,10,15,20,25]}]}],
 erna:[
  {n:'鷹の目',fx:[{t:'crit',c:'weak',r:[20,22,25,28,30]},{t:'dmg',c:'weak',r:[0,5,10,12,15]},{t:'prio',r:[0,5,10,10,15]}]},
  {n:'狙撃態勢',fx:[{t:'dmg',c:'tfull',r:[25,30,35,40,45]},{t:'critd',r:[0,10,15,20,30]},{t:'pierce',r:[0,0,10,15,20]}]},
  {n:'天穿つ雷',fx:[{t:'dmg',c:'el:雷',r:[20,25,30,35,40]},{t:'crit',r:[5,7,10,12,15]},{t:'bp0',r:[0,1,1,2,2]}]}],
 balza:[
  {n:'炉の熱',fx:[{t:'stack',r:[5,5,6,6,8],max:5},{t:'cut',c:'hplow',r:[0,10,15,20,25]}]},
  {n:'不屈',fx:[{t:'dmg',c:'hplow',r:[20,22,25,28,30]},{t:'cut',c:'hplow',r:[15,18,20,22,25]},{t:'guts',r:[0,0,1,1,1]}]},
  {n:'灼熱の炉心',fx:[{t:'dmg',c:'el:炎',r:[20,25,30,35,40]},{t:'stat',k:'def',r:[5,8,10,12,15]},{t:'regen',on:'self',r:[0,0,3,4,5]}]}],
 crow:[
  {n:'呪詛の残り香',fx:[{t:'onhit',c:'el:闇',k:'poison',v:.04,d:3,r:[.3,.35,.4,.45,.5]},{t:'dmg',c:'debuffed',r:[0,8,10,12,15]}]},
  {n:'血の契約',fx:[{t:'kill',r:[10,10,12,15,15],bp:[1,1,2,2,3]},{t:'drain',r:[0,3,5,6,8]}]},
  {n:'死神の加護',fx:[{t:'dmg',c:'tlow',r:[30,40,45,50,60]},{t:'ag',r:[0,10,15,20,25]},{t:'crit',r:[0,0,5,8,10]}]}],
 hakua:[
  {n:'連撃の型',fx:[{t:'stack',c:'same',r:[6,6,7,7,8],max:5},{t:'hits',r:[0,0,0,1,1]}]},
  {n:'氷華の気',fx:[{t:'onhit',c:'el:氷',k:'spd',r:[-15,-18,-20,-22,-25],d:2},{t:'dmg',c:'el:氷',r:[0,10,15,20,25]}]},
  {n:'氷華絢爛',fx:[{t:'dmg',c:'multi',r:[15,18,22,26,30]},{t:'crit',r:[0,5,8,10,12]},{t:'chain',r:[0,5,8,10,15]}]}],
 jin:[
  {n:'ポポの援護',fx:[{t:'fu',c:'any',r:[.25,.3,.35,.4,.5],pw:[.6,.7,.8,1,1.2],el:'地',nm:'ポポの援護'},{t:'od',r:[0,5,10,15,20]}]},
  {n:'野生の勘',fx:[{t:'dodge',c:'hplow',r:[20,22,25,28,30]},{t:'stat',k:'atk',r:[0,5,8,10,12]}]},
  {n:'獣王の血',fx:[{t:'dmg',r:[10,12,15,18,20]},{t:'cut',r:[8,10,12,15,15]},{t:'regen',on:'self',r:[0,0,3,4,5]}]}],
 celes:[
  {n:'刻読み',fx:[{t:'start',on:'allies',k:'spd',r:[10,12,15,18,20],d:3},{t:'prio',r:[0,5,10,15,20]}]},
  {n:'時の歪み',fx:[{t:'delay',c:'mag',r:[.25,.3,.35,.4,.45]},{t:'dmg',c:'mag',r:[0,5,10,12,15]}]},
  {n:'刻の支配者',fx:[{t:'allybp0',r:[1,1,1,2,2]},{t:'dmg',c:'mag',r:[15,18,20,25,30]},{t:'ag',r:[0,10,15,20,25]}]}],
 valk:[
  {n:'竜鱗',fx:[{t:'cut',c:'el:炎|闇',r:[30,33,36,40,45]},{t:'cut',r:[0,5,8,10,12]},{t:'stat',k:'mhp',r:[0,5,8,10,12]}]},
  {n:'竜の闘志',fx:[{t:'rage',r:[4,4,5,5,6],max:5},{t:'counter',r:[0,0,.2,.25,.3],pw:1}]},
  {n:'竜王の威厳',fx:[{t:'dmg',c:'el:炎|闇',r:[20,25,30,35,40]},{t:'regen',on:'self',r:[5,5,6,7,8]}]}]};

/* ==================== 星臨（特殊アビリティ＋奥義） ====================
 星臨ゲージ（ASTRAL GAUGE）が満ちると行動を消費せずに発動。3 ターン（＋位階・星盤）続く。
 発動中は「星臨アビリティ」で大きく強化され、いつもの技・術に加えて「奥義」を 1 度だけ使える（BP 0）。
 note：engine.js などに元からある星臨の効果（説明だけ。処理は既存のもの） */
const AWX={
 rio:{n:'灯星継承',ou:'seikou',note:['全能力+20%'],fx:[{t:'dmg',v:20},{t:'bpr',v:2},{t:'allydmg',v:10}]},
 gald:{n:'不落城塞',ou:'houkai',note:['受けるダメージ-45%','敵の攻撃を全て引き受ける','受けたダメージを蓄積（奥義で放つ）'],fx:[{t:'regen',on:'self',v:5},{t:'bpr',v:1}]},
 mire:{n:'双極の書架',ou:'zettai',note:[],fx:[{t:'dmg',c:'mag',v:40},{t:'dmg',c:'altel',v:20},{t:'bpcut',c:'mag',v:2}]},
 shion:{n:'影縫いの刻',ou:'ou_shion',note:['発動時、敵全体の行動を遅らせる'],fx:[{t:'prio',v:200},{t:'fu',c:'single',v:.4,pw:.8,el:'風',nm:'影縫いの追撃'},{t:'dodge',v:20}]},
 noah:{n:'機巧の聖域',ou:'ou_noah',note:['聖域：味方が倒れるダメージを、それぞれ1度だけHP1で耐える'],fx:[{t:'regen',on:'allies',v:10},{t:'heal',v:30}]},
 erna:{n:'天穿つ眼',ou:'ou_erna',note:['攻撃が全て会心になる'],fx:[{t:'dmg',c:'weak',v:30},{t:'pierce',v:30}]},
 balza:{n:'炉心解放',ou:'youtetsu',note:['ターンごとに攻撃+15%（積み上がる）'],fx:[{t:'dmg',c:'el:炎',v:30},{t:'cut',v:20}]},
 crow:{n:'千の呪言',ou:'ou_crow',note:['失ったHPに応じて与ダメ上昇（最大+150%）'],fx:[{t:'onhit',c:'el:闇',k:'poison',v:.06,d:3,p:1},{t:'drain',v:10}]},
 hakua:{n:'氷華乱舞',ou:'ranbu',note:[],fx:[{t:'hits',v:2},{t:'onhit',c:'el:氷',k:'stun',v:1,d:1,p:.25},{t:'dmg',c:'multi',v:20}]},
 jin:{n:'獣魂合一',ou:'ou_jin',note:['攻撃・素早さ+30%'],fx:[{t:'fu',c:'any',v:.6,pw:1.2,el:'地',nm:'ポポの猛撃'}]},
 celes:{n:'刻の円環',ou:'makimodoshi',note:['発動の瞬間の味方のHP・戦闘不能を記録する（奥義で巻き戻す）'],fx:[{t:'onaw',on:'enemies',k:'spd',v:-30,d:3},{t:'allybpr',v:1}]},
 valk:{n:'竜血星臨',ou:'gokuvalk',note:['与ダメ1.5倍'],fx:[{t:'cut',c:'el:炎|闇',v:50},{t:'drain',v:10}]}};
const AW_TURNS=3;

/* ==================== 陣形 ====================
 編成の並び順（1〜4 番目）ごとに効果が付く。RS の陣形に相当 */
const FORM={
 seikan:{n:'星環の陣',d:'基本の陣形。全員の素早さ+5%・初期BP+1',s:[0,1,2,3].map(()=>[{t:'stat',k:'spd',v:5},{t:'bp0',v:1}])},
 tenkyu:{n:'天穹の陣',d:'攻めの陣形。1・2番目は技の与ダメ+15%で狙われやすい。3・4番目は術の与ダメ+15%',
  s:[[{t:'dmg',c:'phys',v:15},{t:'taunt',v:1}],[{t:'dmg',c:'phys',v:15},{t:'taunt',v:1}],[{t:'dmg',c:'mag',v:15}],[{t:'dmg',c:'mag',v:15}]]},
 jousai:{n:'城塞の陣',d:'守りの陣形。1番目が被ダメ-30%で敵を強く引きつける。ほかの3人は被ダメ-10%',
  s:[[{t:'cut',v:30},{t:'taunt',v:4}],[{t:'cut',v:10}],[{t:'cut',v:10}],[{t:'cut',v:10}]]},
 shippu:{n:'疾風の陣',d:'速攻の陣形。全員の素早さ+20%・初期BP+2。代わりに被ダメ+10%',s:[0,1,2,3].map(()=>[{t:'stat',k:'spd',v:20},{t:'bp0',v:2},{t:'cut',v:-10}])},
 rensei:{n:'連星の陣',d:'連携の陣形。全員の連携ダメ+15%・OD上昇+25%',s:[0,1,2,3].map(()=>[{t:'chain',v:15},{t:'od',v:25}])},
 shukusei:{n:'祝星の陣',d:'支えの陣形。全員の回復量+20%。2・3番目は毎ターンのBP回復+1',
  s:[[{t:'heal',v:20}],[{t:'heal',v:20},{t:'bpr',v:1}],[{t:'heal',v:20},{t:'bpr',v:1}],[{t:'heal',v:20}]]}};

return{ST8,ST8N,ST8D,WPN,HERO,BP,RANK,RANKS,RBP,CHAIN,OD,PROF,TGT,NEW,LEARN,JOBSK,ABL,AB,AWX,AW_TURNS,FORM,fxTxt,descOf,E10};})();
