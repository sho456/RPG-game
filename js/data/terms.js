/* ===== ver0.29 呼称・分類の共通規格（TERMS） =====
 ゲーム内の表示・データ・管理ファイルで使う「正式な呼び名と分類」をここ 1 か所で定義する。
 画面の文言を変えたい・分類を足したいときはこのファイルだけを直す（各画面は TERMS を参照する）。

 【キャラクター】 味方：プレイアブルキャラ ／ 敵：通常敵・中ボス・大ボス
 【装備品】       武器・主防具・服防具・装飾品
 【技・能力】     物理：通常攻撃（物理）・防御・攻撃スキル・補助スキル（バフ・デバフ・かばう系）・回復スキル
                  魔法：通常攻撃（魔法）・攻撃魔法・補助魔法（バフ・デバフ）・回復魔法
                  星臨 ／ パッシブスキル
 【ダメージ】     通常ダメージ・Weakダメージ・Resistダメージ・Criticalダメージ

 データ側の対応（既存のセーブ・装備の slot 値は変えない）
  ・装備の枠 → 分類：w＝武器、body（鎧・外套）・sub（盾・護符）＝主防具、head（兜・冠・額当て）＝服防具、acc＝装飾品
  ・敵：ED[k].rank（'normal'|'mid'|'big'）。未指定なら boss 指定とエリアのボスかどうかから決める
  ・技：SK[k].cat で個別に指定できる（未指定なら k・威力・使い手から自動判定）
  ・Resist：ED[k].resist＝['氷'] のように指定。弱点でない属性で当てると 0.5 倍、「Resist」と表示 */
const TERMS=(()=>{
/* ---------- 呼称 ---------- */
const CHAR={playable:'プレイアブルキャラ',normal:'通常敵',mid:'中ボス',big:'大ボス'};
const CHAR_SIDE={playable:'味方',normal:'敵',mid:'敵',big:'敵'};
const EQUIP={weapon:'武器',armor:'主防具',cloth:'服防具',acc:'装飾品'};
const GROUP={phys:'物理',mag:'魔法',seirin:'星臨',passive:'パッシブ'};
const SKILL={
 phys_normal:{n:'通常攻撃（物理）',g:'phys',s:'通常攻撃'},guard:{n:'防御',g:'phys',s:'防御'},
 phys_attack:{n:'攻撃スキル',g:'phys',s:'攻撃'},phys_support:{n:'補助スキル',g:'phys',s:'補助',d:'バフ・デバフ・かばう系'},phys_heal:{n:'回復スキル',g:'phys',s:'回復'},
 mag_normal:{n:'通常攻撃（魔法）',g:'mag',s:'通常攻撃'},mag_attack:{n:'攻撃魔法',g:'mag',s:'攻撃'},mag_support:{n:'補助魔法',g:'mag',s:'補助',d:'バフ・デバフ'},mag_heal:{n:'回復魔法',g:'mag',s:'回復'},
 seirin:{n:'星臨',g:'seirin',s:'星臨'},passive:{n:'パッシブスキル',g:'passive',s:'パッシブ'}};
const DMG={normal:{n:'通常ダメージ',lb:'',mul:1},weak:{n:'Weakダメージ',lb:'Weak',mul:1.7},resist:{n:'Resistダメージ',lb:'Resist',mul:.5},crit:{n:'Criticalダメージ',lb:'Critical',mul:1.5}};
/* 装備の枠 → 分類 */
const SLOT_CAT={w:'weapon',body:'armor',sub:'armor',head:'cloth',acc:'acc',acc1:'acc',acc2:'acc',a:'armor'};
const SLOT_LABEL={w:'武器',body:'主防具・体',sub:'主防具・盾',head:'服防具・頭',acc1:'装飾品1',acc2:'装飾品2',acc:'装飾品'};

/* ---------- キャラクター区分 ---------- */
/* 大ボス：章・エリアの主ボスと終盤の決戦。中ボス：それ以外の boss 指定（塔・回廊の番人、残影、決闘の相手など） */
const BIG=new Set(['boss9','boss7','last2','last3']);
let areaBoss=null;
function aBoss(){if(areaBoss)return areaBoss;areaBoss=new Set();try{for(const id in AREAS){const A=AREAS[id];if(A&&A.boss&&A.boss.kind)areaBoss.add(A.boss.kind);}}catch(e){}return areaBoss;}
const baseKey=k=>String(k||'').split('|')[0].replace(/_aw$/,'').replace(/^vo_/,'');
function charCat(key){const k=baseKey(key);
 if(typeof HB!=='undefined'&&HB[k])return'playable';
 const d=typeof ED!=='undefined'&&ED[k];
 if(d&&d.rank)return d.rank;
 if(/^kb\d+$/.test(k))return'mid';
 if(!d)return'normal';
 if(BIG.has(k)||(d.boss&&aBoss().has(k)))return'big';
 if(d.boss||d.solo)return'mid';
 return'normal';}
const charName=key=>CHAR[charCat(key)];

/* ---------- 装備区分 ---------- */
function equipCat(x){const s=typeof x==='string'?x:x&&(x.slot||(x.leg&&LEG[x.leg]&&LEG[x.leg].slot));return SLOT_CAT[s]||'acc';}
const equipName=x=>EQUIP[equipCat(x)];

/* ---------- 技区分 ---------- */
const HEAL=new Set(['heal','healAll','revive','reviveAll','grace']);
const SUPPORT=new Set(['taunt','kenshu','guardRegen','barrier','haste','cheer','scan','charge','tstop','rewind','roar','sup20','steal']);
const isKana=n=>/^[゠-ヿ・ー\s]+$/.test(String(n||''));
let SEIRIN_SET=null;
function seirinSet(){if(SEIRIN_SET)return SEIRIN_SET;const s=new Set();try{for(const id in AW)(AW[id].cmds||[]).forEach(k=>s.add(k));}catch(e){}
 try{for(const k in SK)if(/^goku/.test(k)||['zen','reso','release','release2','kenshu'].includes(SK[k].k))s.add(k);}catch(e){}return SEIRIN_SET=s;}
/* 技を使えるキャラ（初期・Lv習得・星盤・ジョブ） */
let OWN=null;
function owners(){if(OWN)return OWN;OWN={};const add=(k,id)=>{(OWN[k]=OWN[k]||new Set()).add(id);};
 try{for(const id in HB)(HB[id].skills||[]).forEach(k=>add(k,id));}catch(e){}
 try{const L=(typeof V20!=='undefined'&&V20.LSK)||{};for(const id in L)L[id].forEach(([,k])=>add(k,id));}catch(e){}
 try{for(const id in BOARD)for(const p in BOARD[id]){const n=BOARD[id][p];if(n&&n.t==='skill')add(n.v,id);}}catch(e){}
 return OWN;}
const magUser=id=>{try{return!!MAG(id);}catch(e){return false;}};
/* sk：技のオブジェクト or SK のキー。owner：使い手のキャラ id（省略可） */
function skillCat(sk,owner){let key=null;if(typeof sk==='string'){key=sk;sk=SK[sk];}if(!sk)return null;
 if(!key){try{for(const k in SK)if(SK[k]===sk){key=k;break;}}catch(e){}}
 if(sk.cat&&SKILL[sk.cat])return sk.cat;
 if(sk.k==='guard')return'guard';
 if(sk.basic)return sk.k==='mag'?'mag_normal':'phys_normal';
 if(key&&seirinSet().has(key))return'seirin';
 /* 魔法か：k が mag、名前がカタカナの呪文、または使い手が魔法職で物理技ではない */
 const own=owner?[owner]:key&&owners()[key]?[...owners()[key]]:[];
 const mag=sk.k==='mag'||(sk.k!=='phys'&&(isKana(sk.n)||(own.length&&own.every(magUser))));
 const heal=HEAL.has(sk.k)||sk.role==='heal'||!!sk.heal20;
 if(heal)return mag?'mag_heal':'phys_heal';
 if(SUPPORT.has(sk.k)||(sk.pow==null&&sk.fixed==null&&!['pct','rhythm'].includes(sk.k)))return mag?'mag_support':'phys_support';
 return mag?'mag_attack':'phys_attack';}
const skillName=(sk,owner)=>{const c=skillCat(sk,owner);return c?SKILL[c].n:'';};
/* 敵の技（EA）：物理＝攻撃スキル、魔法＝攻撃魔法 */
const enemyActCat=e=>e&&e.k==='mag'?'mag_attack':'phys_attack';

/* ---------- ダメージ区分 ---------- */
function dmgCat(r){return!r?'normal':r.crit?'crit':r.weak?'weak':r.resist?'resist':'normal';}
const RESIST_MUL=DMG.resist.mul;
function resists(t,el){if(!t||!el||t.side!==1)return false;const d=typeof ED!=='undefined'&&ED[baseKey(t.kind||t.spr)];const rs=t.resist||(d&&d.resist);return!!(rs&&rs.includes(el));}

/* ---------- 表示用の小さな部品 ---------- */
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const chip=(cls,txt)=>`<i class="tm29 ${cls}">${esc(txt)}</i>`;
const charChip=key=>{const c=charCat(key);return chip('c-'+c,CHAR[c]);};
const skillChip=(sk,owner)=>{const c=skillCat(sk,owner);return c?chip('s-'+SKILL[c].g,SKILL[c].n):'';};
const equipChip=x=>{const c=equipCat(x);return chip('e-'+c,EQUIP[c]);};
return{CHAR,CHAR_SIDE,EQUIP,GROUP,SKILL,DMG,SLOT_CAT,SLOT_LABEL,charCat,charName,equipCat,equipName,skillCat,skillName,enemyActCat,dmgCat,resists,RESIST_MUL,charChip,skillChip,equipChip,chip,
 reset(){areaBoss=null;SEIRIN_SET=null;OWN=null;}};})();

/* ---------- データへの反映 ---------- */
/* 装備の枠の表示名（編成・装備変更・詳細の各画面が SLOTN を参照する） */
try{Object.assign(SLOTN,{w:TERMS.SLOT_LABEL.w,body:TERMS.SLOT_LABEL.body,sub:TERMS.SLOT_LABEL.sub,head:TERMS.SLOT_LABEL.head,acc1:TERMS.SLOT_LABEL.acc1,acc2:TERMS.SLOT_LABEL.acc2});}catch(e){}
/* 通常攻撃・防御の正式名は区分名で扱う（画面に出る技名「攻撃」「魔弾」「防御」はそのまま） */
try{GUARD.cat='guard';}catch(e){}
/* 自動判定と違う区分にしたい技（祈りの系統は魔法として扱う） */
try{for(const[k,c]of[['kaihou','mag_heal']])if(SK[k])SK[k].cat=c;}catch(e){}
/* Resist（耐性）：自分と同じ属性の攻撃に強い敵（ver0.29 で追加。弱点と重ならないものだけ） */
try{for(const[k,el]of[['iceslime','氷'],['snowwolf','氷'],['yukirei','氷'],['boss5','氷'],['lavaslime','炎'],['firedrake','炎'],['ember','炎'],['boss9','炎'],['raiwolf','雷']])
  if(ED[k]&&!(ED[k].weak||[]).includes(el))ED[k].resist=[el];}catch(e){}
/* ダメージ計算：耐性を足す（弱点・会心の判定はそのまま。Resist は弱点でないときだけ） */
{const _c=calc;calc=function(a,t,sk){const r=_c(a,t,sk);try{if(r&&!r.weak&&sk&&sk.el&&TERMS.resists(t,sk.el)){r.d=Math.max(1,Math.round(r.d*TERMS.RESIST_MUL));r.resist=true;}}catch(e){}return r;};}
