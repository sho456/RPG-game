/* ===== ver0.37 戦闘システム刷新（データ）=====
 ロマンシング サガ リ・ユニバース（以下 RS）の戦闘の仕組みを分析し、この作品の世界観・キャラに合わせて組み直した。
 分析と対応表は docs/RS-SYSTEM.md。ここは「データ」だけ（能力値・技・術・アビリティ・星臨・陣形）。
 処理は js/rs/core.js（能力値・習得・セーブ）、js/rs/battle.js（ターン・BP・LP）、js/rs/ui.js（画面）。

 呼称（RS に合わせたもの）
  ・技（わざ）＝武器による物理の行動、術（じゅつ）＝魔法の行動。まとめて「技・術」
  ・BP（バトルポイント）＝技・術の消費。毎ターン回復する。通常攻撃は消費 0
  ・威力ランク（E〜SSS）、技・術の練達（錬磨石で 3 段階）、LP（ライフポイント）
  ・アビリティ（旧パッシブ）、陣形
  ・能力値：腕力・体力・器用さ・素早さ・知力・精神・魅力（7 種）／攻撃属性 8 種／武器種 8 種
 RS の固有の技名・キャラ・絵は使っていない（仕組みと呼び名だけを取り入れ、中身はこの作品のもの） */
'use strict';
const RSD=(()=>{

/* ==================== 攻撃属性（8 種） ====================
 斬・打・突（物理）／熱・冷・雷（術の三属性）／陽・陰（光と闇）。技・術・敵の攻撃・弱点・耐性・装備はすべてこの 8 つ */
const EL8=['斬','打','突','熱','冷','雷','陽','陰'];
/* ==================== 武器種（8 種） ====================
 武器種と攻撃属性は別の概念。武器種は「通常攻撃の属性」と「技の威力に使う能力値」を決める。
 w：技の威力の配分（RS の「武器ごとに参照する能力値」）。mag：通常攻撃が術（知力）になる武器 */
const WPN={
 '剣':  {el:'斬',w:{str:.7,dex:.3},ic:'sword',d:'腕力が主。器用さも少し'},
 '短剣':{el:'突',w:{dex:.8,str:.2},ic:'dagger',d:'器用さが主'},
 '大剣':{el:'斬',w:{str:1},ic:'gsword',d:'腕力だけで威力が決まる'},
 '斧':  {el:'斬',w:{str:.9,dex:.1},ic:'axe',d:'腕力が主'},
 '体術':{el:'打',w:{str:.5,agi:.5},ic:'fist',d:'腕力と素早さ'},
 '弓':  {el:'突',w:{dex:.8,str:.2},ic:'bow',d:'器用さが主'},
 '杖':  {el:'打',w:{str:.6,dex:.4},ic:'staff',mag:1,d:'通常攻撃は知力で放つ魔弾'},
 '双剣':{el:'斬',w:{dex:.6,str:.4},ic:'dual',d:'器用さと腕力'}};
const WPNS=Object.keys(WPN);
/* ==================== 能力値（7 種） ==================== */
const ST7=['str','vit','dex','agi','int','wil','cha'];
const ST7N={str:'腕力',vit:'体力',dex:'器用さ',agi:'素早さ',int:'知力',wil:'精神',cha:'魅力'};
const ST7S={str:'腕',vit:'体',dex:'器',agi:'速',int:'知',wil:'精',cha:'魅'};
const ST7D={
 str:'剣・大剣・斧・体術などの物理攻撃の威力',
 vit:'技（物理攻撃）への防御力',
 dex:'攻撃の命中率と、短剣・弓・双剣の威力',
 agi:'行動順・回避率・命中率と、体術の威力',
 int:'熱・冷・雷などの術の威力と命中率。状態異常・能力変化の付与成功率',
 wil:'術への防御力。状態異常・能力変化への耐性',
 cha:'回復を受けたときの回復量・回復アビリティの回復量・状態異常の付与成功率'};
/* キャラごとの設定。
 w：武器種　el：得意属性（キャラの色・星臨の属性）　hand：Lv1 の値と成長（S〜D）のうち手で決めるもの
 （体力＝旧防御・精神＝旧精神・知力＝旧魔力・素早さ＝旧素早さ×3 は自動。武器の主能力は旧来の「攻撃」と同じ強さになるよう自動で決める）
 lp：LP（ライフポイント）　bp：BP の［初期, 最大, 毎ターンの回復］ */
const HERO={
 rio:  {w:'剣',  el:'陽',lp:9, bp:[8,20,4],hand:{dex:[30,'B'],cha:[32,'A']}},
 gald: {w:'大剣',el:'打',lp:12,bp:[7,18,3],hand:{dex:[18,'D'],cha:[24,'C']}},
 mire: {w:'杖',  el:'熱',lp:7, bp:[9,24,4],hand:{dex:[22,'C'],cha:[34,'A']}},
 shion:{w:'短剣',el:'斬',lp:8, bp:[8,20,4],hand:{str:[22,'C'],cha:[24,'B']}},
 noah: {w:'杖',  el:'陽',lp:8, bp:[9,24,4],hand:{dex:[20,'C'],cha:[44,'S']}},
 erna: {w:'弓',  el:'雷',lp:8, bp:[8,20,4],hand:{str:[26,'B'],cha:[28,'B']}},
 balza:{w:'斧',  el:'熱',lp:11,bp:[7,18,3],hand:{dex:[22,'C'],cha:[20,'D']}},
 crow: {w:'杖',  el:'陰',lp:7, bp:[9,22,4],hand:{dex:[24,'B'],cha:[40,'S']},
  /* 鎌杖：武器種は杖（術・魔弾）、形は大鎌。鎌としての通常攻撃（斬・腕力と器用さ・与ダメの10%を吸収）も使える */
  shape:'大鎌',alt:{bn:'鎌',n:'鎌の一閃',el:'斬',drain:.1,d:'大鎌の刃で斬る（斬・技・腕力と器用さ）。与ダメの10%を吸収'}},
 hakua:{w:'体術',el:'冷',lp:9, bp:[8,20,4],hand:{dex:[30,'A'],cha:[26,'B']}},
 jin:  {w:'双剣',el:'打',lp:10,bp:[8,20,4],hand:{str:[26,'B'],cha:[26,'B']}},
 celes:{w:'杖',  el:'陰',lp:7, bp:[9,24,4],hand:{dex:[24,'B'],cha:[36,'A']}},
 valk: {w:'大剣',el:'熱',lp:11,bp:[7,20,3],hand:{dex:[22,'C'],cha:[30,'B']}}};

/* ==================== BP・威力ランク・技の熟練 ==================== */
/* ver0.45 BP の見直し：装備の「BP回復力」を廃止したぶん、初期BPを+2・毎ターンの回復を 4（重装の 3 人は 3）に。
 1 ターン目から B〜A の技を使え、B の技は毎ターン、A 以上は貯めて使う手触り（ロマサガRS の BP の回り方に近づける） */
const BP={max:20,start:8,regen:4};
const RANK={E:.8,D:1.05,C:1.35,B:1.65,A:2,S:2.5,SS:3.2,SSS:4.2};
const RANKS=Object.keys(RANK);
const RBP={E:1,D:2,C:3,B:4,A:6,S:8,SS:10,SSS:12};
/* 旧：技の熟練（技Lv）。ver0.47 で廃止し練達（js/rs/mastery.js）に置き換え。表は古いセーブの読み込み用に残す */
const PROF=[0,3,8,15,25,40,60,85,115,150];
/* HP・LP の決まり */
const LP_FIX=7;/* LP は全員 7 固定（ver0.44） */
const HPLP={dying:.3/*最大HPのこの割合以下で瀕死*/,healLp:1/*回復術の LP 消費*/,reviveMin:.1};

/* ==================== 技・術 ==================== */
const TGT={one:'敵単体',all:'敵全体',ally:'味方1人',self:'自分',allies:'味方全体'};
const ON={t:'対象',self:'自分',allies:'味方全体',enemies:'敵全体'};
const STK={atk:'攻撃',def:'防御',mag:'魔力',res:'精神',spd:'素早さ',crit:'会心率'};
function fxTxt(f){const on=ON[f.on||'t']||'',p=f.p!=null&&f.p<1?`${Math.round(f.p*100)}%で`:'',T=f.t>=50?'':`（${f.t}ターン）`;let s;
 if(STK[f.k])s=`${on}の${STK[f.k]}${f.v>0?'+':'-'}${Math.abs(f.v)}%${T}`;
 else if(f.k==='poison')s=`${on}を毒にする（毎ターン最大HPの${Math.round(f.v*100)}%）${T}`;
 else if(f.k==='stun')s=`${on}をスタン（1回休み）`;
 else if(f.k==='para')s=`${on}をマヒ${T}`;
 else if(f.k==='blind')s=`${on}を暗闇${T}`;
 else if(f.k==='weak')s=`${on}に${f.el}の弱点を付ける${T}`;
 else if(f.k==='regen')s=`${on}に継続回復（毎ターン最大HPの${Math.round(f.v*100)}%）${T}`;
 else if(f.k==='prot')s=`${on}の被ダメ-${f.v}%${T}`;
 else if(f.k==='mark')s=`${on}の被ダメ+${f.v}%${T}`;
 else if(f.k==='shield')s=`${on}に最大HP${Math.round(f.v*100)}%の障壁`;
 else if(f.k==='counter')s=`${on}を反撃の構えにする（威力${f.v}）${T}`;
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
 for(const k of['delay','cond20','pierce20','drain','steal','purge20','heal20','cleanse20','taunt20','auto','prio','post','crit','ct20','fixedK','ougi','hits','role','w','revive','selfPre'])if(o[k]!=null)sk[k]=o[k];
 if(sk.k==='sup20'&&!sk.role)sk.role=o.heal20?'heal':'buff';
 sk.d=o.d||descOf(sk);NEW[id]=sk;return sk;}
const CONDN={brk:'HP半分以下の敵に威力1.5倍',debuff:'弱体1つにつき威力+25%（最大+75%）',lowhp:'自分のHPが減るほど威力上昇（最大+80%）',spd:'敵より速いほど威力上昇（最大+40%）',poison:'毒の敵に威力1.8倍',full:'HP満タンの敵に威力1.5倍'};
function descOf(s){const L=[];
 if(s.k==='phys'||s.k==='mag')L.push(`${s.el||'無'}・${TGT[s.t]||''}・威力${s.rk||(s.ougi?'極':'特')}${s.hits>1?'×'+s.hits+'回':''}`);
 else if(s.k==='heal')L.push(`${TGT[s.t]}のHPを${Math.round(s.pow*100)}%回復`);
 else if(s.k==='sup20'){if(s.heal20)L.push(`味方全体のHPを${Math.round(s.heal20*100)}%回復`);if(s.cleanse20)L.push('味方全体の弱体を解除');}
 if(s.prio===1)L.push('先制（早く動く）');if(s.prio===-1)L.push('後発（最後に動く）');
 if(s.delay)L.push('当てた敵の行動を遅らせる');if(s.pierce20)L.push(`防御・精神を${Math.round(s.pierce20*100)}%無視`);if(s.drain)L.push(`与ダメの${Math.round(s.drain*100)}%を吸収`);
 if(s.steal)L.push('攻撃しながら道具を盗む');if(s.purge20)L.push('当てた敵の強化をすべて消す');if(s.crit)L.push(`会心率+${s.crit}%`);if(s.cond20)L.push(CONDN[s.cond20]);
 if(s.auto)L.push('敵の弱点の属性に変化');if(s.taunt20)L.push(`${s.taunt20}ターン挑発する`);if(s.ct20)L.push('味方全体の行動を早める');
 for(const f of s.fx20||[])L.push(fxTxt(f));for(const f of s.self20||[])L.push((s.selfPre?'攻撃の前に':'')+fxTxt(Object.assign({on:'self'},f)));for(const f of s.post||[])L.push(fxTxt(f));
 return L.join('／');}

/* --- リオ（剣・光） --- */
S('koujin',{n:'光刃',el:'陽',rk:'B',fx:[{k:'def',v:-15,t:2,p:.5}]});
S('harai',{n:'斬り払い',el:'斬',rk:'C',t:'all',fx:[{k:'atk',v:-15,t:2,p:.3}]});
S('kobu',{n:'鼓舞の灯',k:'sup20',t:'self',bp:6,heal20:.15,sup:[{on:'allies',k:'atk',v:15,t:3},{on:'allies',k:'mag',v:15,t:3}]});
S('torirensan',{n:'灯火連斬',el:'陽',rk:'A',hits:3,cond20:'brk',crit:20});
S('shiden',{n:'紫電一閃',el:'雷',rk:'S',prio:1,fx:[{k:'stun',v:1,t:1,p:.35}]});
S('x_rio1',{n:'天灯星斬',el:'陽',rk:'SSS',selfPre:1,fx:[{k:'def',v:-25,t:3}],self:[{k:'atk',v:20,t:3}]});
S('seikou',{n:'星光終天斬',el:'陽',pow:6,bp:0,ougi:1,post:[{on:'allies',k:'atk',v:20,t:3},{on:'allies',k:'mag',v:20,t:3}]});
/* --- ガルド（大剣と盾・地） --- */
S('tateuchi',{n:'盾撃',el:'打',rk:'C',delay:35,fx:[{k:'stun',v:1,t:1,p:.3}]});
S('chouhatsu',{n:'挑発',k:'sup20',t:'self',bp:3,taunt20:2,sup:[{on:'self',k:'def',v:30,t:2},{on:'self',k:'res',v:30,t:2}],role:'guard'});
S('chiretsu',{n:'地裂斬',el:'打',rk:'A',fx:[{k:'def',v:-25,t:3,p:.6}]});
S('saigan',{n:'砕岩撃',el:'打',rk:'B',t:'all',fx:[{k:'spd',v:-20,t:2,p:.4}]});
S('teppekikamae',{n:'鉄壁の構え',k:'sup20',t:'self',bp:6,taunt20:2,sup:[{on:'allies',k:'prot',v:20,t:2},{on:'self',k:'counter',v:1.2,t:3}],role:'guard'});
S('x_gald1',{n:'天崩撃',el:'打',rk:'SSS',fx:[{k:'def',v:-30,t:3}],post:[{on:'allies',k:'prot',v:20,t:2}]});
S('houkai',{n:'城壁崩し',el:'打',pow:1,t:'all',bp:0,ougi:1,fixedK:'store',d:'受け止めて蓄積した力（蓄積×0.9＋攻撃×3）を敵全体へ放つ。蓄積は0に戻る'});
/* --- ミレイユ（杖・炎と氷の術） --- */
S('fire',{n:'ファイア',ty:'術',k:'mag',el:'熱',rk:'B',fx:[{k:'poison',v:.04,t:3,p:.3}]});
S('blizz',{n:'ブリザド',ty:'術',k:'mag',el:'冷',rk:'B',fx:[{k:'spd',v:-20,t:2,p:.4}]});
S('flamewave',{n:'フレイムウェーブ',ty:'術',k:'mag',el:'熱',rk:'B',t:'all',fx:[{k:'res',v:-15,t:2,p:.3}]});
S('prism',{n:'プリズム・ブランド',ty:'術',k:'mag',el:'熱',rk:'A',fx:[{k:'weak',el:'熱',t:3},{k:'weak',el:'冷',t:3}]});
S('meteor',{n:'メテオスウォーム',ty:'術',k:'mag',el:'熱',rk:'S',t:'all',hits:3,bp:11});
S('x_mire2',{n:'アブソリュート・ゼロ',ty:'術',k:'mag',el:'冷',rk:'SSS',fx:[{k:'stun',v:1,t:1,p:.4}]});
S('zettai',{n:'絶対零度の太陽',ty:'術',k:'mag',el:'冷',t:'all',pow:3.8,bp:0,ougi:1,post:[{on:'enemies',k:'res',v:-30,t:3}]});
/* --- シオン（小剣・風） --- */
S('shippu',{n:'疾風斬',el:'斬',rk:'C',prio:1,steal:1});
S('kagenui',{n:'影縫い',el:'突',rk:'C',bp:4,delay:40,fx:[{k:'para',v:1,t:1,p:.35}]});
S('dokujin',{n:'毒刃',el:'突',rk:'B',fx:[{k:'poison',v:.05,t:3,p:.75}]});
S('genei',{n:'幻影乱舞',el:'斬',rk:'A',hits:4,cond20:'spd'});
S('oborozuki',{n:'朧月',el:'斬',rk:'B',t:'all',self:[{k:'evade',v:25,t:2}]});
S('x_shion1',{n:'瞬影千刃',el:'斬',rk:'SSS',hits:7,delay:30});
S('ou_shion',{n:'影縫・千刃乱',el:'斬',pow:6,hits:6,bp:0,ougi:1,prio:1,fx:[{k:'stun',v:1,t:1,p:.5}]});
/* --- ノア（杖・光の術と回復） --- */
S('inori',{n:'祈り',ty:'術',k:'heal',t:'ally',pow:.35,bp:4,post:[{on:'t',k:'regen',v:.05,t:2}],role:'heal'});
S('holy',{n:'ホーリー',ty:'術',k:'mag',el:'陽',rk:'B',fx:[{k:'mark',v:15,t:2,p:.4}]});
S('mamori',{n:'守りの祈り',ty:'術',k:'sup20',t:'self',bp:6,sup:[{on:'allies',k:'prot',v:25,t:3}],role:'guard'});
S('regene',{n:'リジェネレイト',ty:'術',k:'sup20',t:'self',bp:7,heal20:.2,cleanse20:1,sup:[{on:'allies',k:'regen',v:.08,t:3}]});
S('dispel',{n:'ディスペル・ライト',ty:'術',k:'mag',el:'陽',rk:'A',purge20:1});
S('x_noah1',{n:'天使の福音',ty:'術',k:'sup20',t:'self',bp:12,heal20:.6,cleanse20:1,sup:[{on:'allies',k:'regen',v:.08,t:3}]});
S('ou_noah',{n:'聖機の福音',ty:'術',k:'reviveAll',t:'self',bp:0,ougi:1,post:[{on:'allies',k:'prot',v:30,t:3}],d:'戦闘不能の味方を復活させ、味方全体のHPを40%回復／味方全体の被ダメ-30%(3T)'});
/* --- エルナ（弓・雷） --- */
S('raiya',{n:'雷矢',el:'雷',rk:'B',fx:[{k:'para',v:1,t:1,p:.25}]});
S('nerai',{n:'狙い撃ち',el:'突',rk:'A',pierce20:.3,crit:20});
S('samidare',{n:'五月雨撃ち',el:'突',rk:'B',t:'all',hits:2});
S('ashidome',{n:'足止めの矢',el:'突',rk:'B',bp:5,delay:30,fx:[{k:'spd',v:-30,t:3}]});
S('kantsuu',{n:'貫通射',el:'突',rk:'S',pierce20:.5});
S('x_erna1',{n:'天穿雷霆',el:'雷',rk:'SSS',pierce20:.5,fx:[{k:'stun',v:1,t:1,p:.3}]});
S('ou_erna',{n:'天穿・神鳴',el:'雷',t:'all',pow:3.6,bp:0,ougi:1,fx:[{k:'stun',v:1,t:1,p:.4}]});
/* --- バルザ（槌・炎） --- */
S('tekkai',{n:'鉄塊落とし',el:'打',rk:'B',fx:[{k:'def',v:-15,t:2,p:.4}]});
S('shuuri',{n:'鍛冶師の手入れ',k:'sup20',t:'self',bp:5,sup:[{on:'allies',k:'def',v:20,t:3},{on:'self',k:'atk',v:15,t:3}]});
S('kaentanda',{n:'火炎鍛打',el:'熱',rk:'A',selfPre:1,self:[{k:'atk',v:20,t:3}],fx:[{k:'poison',v:.04,t:3,p:.3}]});
S('daichiwari',{n:'大地割り',el:'打',rk:'B',t:'all',fx:[{k:'spd',v:-20,t:2,p:.5}]});
S('gouen',{n:'業炎',el:'熱',rk:'A',t:'all'});
S('x_balza1',{n:'灼熱の鉄槌',el:'熱',rk:'SSS',prio:-1,selfPre:1,self:[{k:'atk',v:30,t:3}]});
S('youtetsu',{n:'溶鉄爆砕',el:'熱',t:'all',pow:3.6,bp:0,ougi:1,fx:[{k:'def',v:-30,t:3}]});
/* --- クロウ（大鎌・闇の術） --- */
S('noroi',{n:'呪い',ty:'術',k:'mag',el:'陰',rk:'B',fx:[{k:'poison',v:.05,t:3,p:.5}]});
S('yaminami',{n:'闇波',ty:'術',k:'mag',el:'陰',rk:'C',t:'all',fx:[{k:'blind',v:1,t:2,p:.3}]});
S('fushoku',{n:'腐食の呪い',ty:'術',k:'mag',el:'陰',rk:'C',bp:5,fx:[{k:'def',v:-25,t:3},{k:'res',v:-25,t:3}]});
S('tamakurai',{n:'魂喰らい',ty:'術',k:'mag',el:'陰',rk:'A',drain:.4,cond20:'debuff'});
S('shisen',{n:'死の宣告',ty:'術',k:'mag',el:'陰',rk:'S',bp:9,cond20:'poison'});
S('x_crow1',{n:'冥王の審判',ty:'術',k:'mag',el:'陰',rk:'SS',t:'all',bp:12,fx:[{k:'poison',v:.06,t:3,p:.6}]});
S('ou_crow',{n:'死経',ty:'術',k:'pct',t:'all',bp:0,ougi:1,d:'敵全体の今のHPの40%を削る（ボスは12%）。防御・耐性に左右されない'});
/* --- ハクア（体術・氷） --- */
S('shouken',{n:'掌底',el:'打',rk:'C',hits:2,fx:[{k:'def',v:-10,t:2,p:.3}]});
S('hyouken',{n:'氷拳',el:'冷',rk:'B',fx:[{k:'spd',v:-15,t:2,p:.4}]});
S('hyouketsu',{n:'氷結掌',el:'冷',rk:'A',fx:[{k:'stun',v:1,t:1,p:.35}]});
S('hyakuretsu',{n:'百裂拳',el:'打',rk:'A',hits:6,bp:7});
S('tsurara',{n:'氷柱落とし',el:'冷',rk:'A',t:'all',bp:9});
S('x_hakua1',{n:'氷華千連',el:'冷',rk:'SSS',hits:10});
S('ranbu',{n:'氷華乱舞・終の型',k:'rhythm',el:'冷',t:'one',bp:0,ougi:1,d:'白い輪が青い輪に重なった瞬間にタップ。決まるほど連撃が伸びる（最大16連）。12連以上で敵を凍結'});
/* --- ジン（爪・地、相棒ポポ） --- */
S('tsume',{n:'爪撃',el:'斬',rk:'B',hits:2});
S('popo',{n:'ポポ突撃',el:'打',rk:'B',hits:2,fx:[{k:'atk',v:-15,t:2,p:.5}]});
S('kazekiri',{n:'風切り',el:'斬',rk:'B',t:'all'});
S('kemonohoko',{n:'獣の咆哮',k:'sup20',t:'self',bp:6,sup:[{on:'allies',k:'atk',v:20,t:3},{on:'enemies',k:'def',v:-10,t:3}]});
S('goga',{n:'剛牙',el:'斬',rk:'S'});
S('x_jin2',{n:'ポポ・メテオ',el:'打',rk:'SSS',fx:[{k:'atk',v:-20,t:3}]});
S('ou_jin',{n:'獣王撃',el:'斬',pow:6,bp:0,ougi:1,auto:EL8,d:'ポポと一つになった全力の一撃。敵の弱点の属性に変化する'});
/* --- セレス（杖・時の術） --- */
S('tokiya',{n:'刻の矢',ty:'術',k:'mag',el:'陰',rk:'B'});
S('chien',{n:'遅延の砂',ty:'術',k:'mag',el:'陰',rk:'C',t:'all',delay:30,fx:[{k:'blind',v:1,t:2,p:.35}]});
S('kasoku',{n:'加速の刻',ty:'術',k:'sup20',t:'self',bp:5,ct20:.3,sup:[{on:'allies',k:'spd',v:25,t:3}]});
S('chronoslow',{n:'クロノスロウ',ty:'術',k:'mag',el:'陰',rk:'B',t:'all',fx:[{k:'spd',v:-25,t:3}]});
S('shuuen',{n:'終焉の針',ty:'術',k:'mag',el:'陰',rk:'S',bp:9});
S('x_celes2',{n:'永劫の刻',ty:'術',k:'sup20',t:'self',bp:12,ct20:.5,sup:[{on:'allies',k:'spd',v:40,t:3},{on:'allies',k:'atk',v:20,t:3},{on:'allies',k:'mag',v:20,t:3}]});
S('makimodoshi',{n:'巻き戻し',ty:'術',k:'rewind',t:'self',bp:0,ougi:1,d:'星臨した瞬間まで、味方全員のHP・戦闘不能を巻き戻す'});
/* --- ヴァルク（大剣・炎と闇の竜） --- */
S('ryuuga',{n:'竜牙斬',el:'熱',rk:'B',fx:[{k:'poison',v:.04,t:3,p:.3}]});
S('kokuen',{n:'黒炎薙ぎ',el:'陰',rk:'C',t:'all'});
S('ryurinkamae',{n:'竜鱗の構え',k:'sup20',t:'self',bp:5,sup:[{on:'self',k:'shield',v:.22,t:99},{on:'self',k:'counter',v:1,t:3}],role:'guard'});
S('ryuumetsu',{n:'竜滅斬',el:'斬',rk:'S'});
S('gouka',{n:'劫火',el:'熱',rk:'A',t:'all',fx:[{k:'poison',v:.04,t:3,p:.4}]});
S('x_valk2',{n:'黒竜断',el:'陰',rk:'SSS',drain:.2});
S('gokuvalk',{n:'終焉竜咆',el:'熱',t:'all',pow:3.8,bp:0,ougi:1});
/* キャラごとの技・術の習得の元データ（6 つ）。下の統合で 4 つ（Lv1・Lv1・Lv10・星盤）になる */
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

/* ver0.64：技・術は 1 人 4 つ。Lv10 の技＋旧ひらめきの技、星盤の技＋天星盤の技をそれぞれ 1 つに統合（ひらめきは廃止）。
 名前と鍵はランクの高い方（同じなら先の方）。ランクは高い方・全体／連撃は強い方・状態異常／強化／回復などの効果は両方を合わせる。
 覚え方：Lv1・Lv1・Lv10・星盤 */
(()=>{const ri=r=>r?RANKS.indexOf(r):-1,cat=(x,y)=>[...(x||[]),...(y||[])],atk=s=>s.k==='phys'||s.k==='mag';
 const merge=(a,b)=>{const A=NEW[a],B=NEW[b];if(!A||!B)return a;const kk=ri(B.rk)>ri(A.rk)?b:a,base=!atk(A)&&atk(B)?B:A,o=Object.assign({},base,{n:NEW[kk].n});
  if(ri(B.rk)>ri(o.rk))o.rk=B.rk;if(A.t==='all'||B.t==='all')o.t='all';o.hits=Math.max(A.hits||1,B.hits||1);if(o.hits<2)delete o.hits;
  o.fx20=cat(A.fx20,B.fx20);o.self20=cat(A.self20,B.self20);o.post=cat(A.post,B.post);
  for(const k of['delay','pierce20','drain','heal20','cleanse20','taunt20','purge20','crit','ct20'])if(A[k]!=null||B[k]!=null)o[k]=Math.max(A[k]||0,B[k]||0);
  if(atk(o)&&o.rk){let p=RANK[o.rk];if(o.t==='all')p*=.62;if(o.hits>1)p=p/o.hits*1.08;o.pow=+p.toFixed(3);}o.bp=Math.max(A.bp||0,B.bp||0);
  for(const k of['fx20','self20','post'])if(!o[k].length)delete o[k];o.d=descOf(o);NEW[kk]=o;delete NEW[kk===a?b:a];return kk;};
 for(const id in LEARN){const L=LEARN[id];if(L.length<6)continue;const k3=merge(L[2][0],L[3][0]),k4=merge(L[4][0],L[5][0]);LEARN[id]=[L[0],L[1],[k3,'lv',10],[k4,'board']];}})();

/* アビリティ（AB・ABL）は js/rs/abilities.js（ver0.45：3 段階＋Ⅲの固有名の特殊効果） */
const ABL=[1,25,50],AB={};

/* ==================== 星臨（特殊アビリティ＋奥義） ====================
 星臨ゲージ（ASTRAL GAUGE）が満ちると行動を消費せずに発動。3 ターン（＋位階・星盤）続く。
 発動中は「星臨アビリティ」で大きく強化され、いつもの技・術に加えて「奥義」を 1 度だけ使える（BP 0）。
 note：engine.js などに元からある星臨の効果（説明だけ。処理は既存のもの） */
const AWX={
 rio:{n:'灯星継承',ou:'seikou',note:['全能力+20%'],fx:[{t:'dmg',v:20},{t:'bpr',v:2},{t:'allydmg',v:10},{t:'fu',c:'skill',v:.5,pw:1,el:'陽',nm:'灯星の残光'}]},
 gald:{n:'不落城塞',ou:'houkai',note:['受けるダメージ-45%','敵の攻撃を全て引き受ける','受けたダメージを蓄積（奥義で放つ）'],fx:[{t:'regen',on:'self',v:5},{t:'bpr',v:1}]},
 mire:{n:'双極の書架',ou:'zettai',note:[],fx:[{t:'dmg',c:'mag',v:40},{t:'dmg',c:'altel',v:20},{t:'bpcut',c:'mag',v:2}]},
 shion:{n:'影縫いの刻',ou:'ou_shion',note:['発動時、敵全体の行動を遅らせる'],fx:[{t:'prio',v:200},{t:'fu',c:'single',v:.4,pw:.8,el:'斬',nm:'影縫いの追撃'},{t:'dodge',v:20}]},
 noah:{n:'機巧の聖域',ou:'ou_noah',note:['聖域：味方が倒れるダメージを、それぞれ1度だけHP1で耐える'],fx:[{t:'regen',on:'allies',v:10},{t:'heal',v:30}]},
 erna:{n:'天穿つ眼',ou:'ou_erna',note:['攻撃が全て会心になる'],fx:[{t:'dmg',c:'weak',v:30},{t:'pierce',v:30}]},
 balza:{n:'炉心解放',ou:'youtetsu',note:['ターンごとに攻撃+15%（積み上がる）'],fx:[{t:'dmg',c:'el:熱',v:30},{t:'cut',v:20}]},
 crow:{n:'千の呪言',ou:'ou_crow',note:['失ったHPに応じて与ダメ上昇（最大+150%）'],fx:[{t:'onhit',c:'el:陰',k:'poison',v:.06,d:3,p:1},{t:'drain',v:10}]},
 hakua:{n:'氷華乱舞',ou:'ranbu',note:[],fx:[{t:'hits',v:2},{t:'fu',c:'multi',v:.5,pw:1,el:'冷',nm:'六花の舞'},{t:'onhit',c:'el:冷',k:'stun',v:1,d:1,p:.25},{t:'dmg',c:'multi',v:20}]},
 jin:{n:'獣魂合一',ou:'ou_jin',note:['攻撃・素早さ+30%'],fx:[{t:'fu',c:'any',v:.6,pw:1.2,el:'打',nm:'ポポの猛撃'}]},
 celes:{n:'刻の円環',ou:'makimodoshi',note:['発動の瞬間の味方のHP・戦闘不能を記録する（奥義で巻き戻す）'],fx:[{t:'onaw',on:'enemies',k:'spd',v:-30,d:3},{t:'allybpr',v:1}]},
 valk:{n:'竜血星臨',ou:'gokuvalk',note:['与ダメ1.5倍'],fx:[{t:'cut',c:'el:熱|陰',v:50},{t:'drain',v:10},{t:'counter',v:.4,pw:1.5}]}};
const AW_TURNS=3;

/* ver0.64：陣形は廃止。立ち位置（並び順 1〜4 の［x：0＝前列〜1＝後列, y：0＝上〜1＝下］）だけ残し、能力の補正は無し */
const FORM={seikan:{n:'',p:[[0,.5],[.5,.12],[.5,.88],[1,.5]],s:[[],[],[],[]]}};

return{LP_FIX,EL8,WPN,WPNS,ST7,ST7N,ST7S,ST7D,HERO,BP,RANK,RANKS,RBP,PROF,HPLP,TGT,NEW,LEARN,ABL,AB,AWX,AW_TURNS,FORM,fxTxt,descOf};})();
