/* ===== ver0.20 戦闘の深化：状態効果・専用パッシブ・新スキル／魔法・敵の新戦術 =====
 既存の戦闘ロジック（calc / hurt / hit / doAction / heroTurn / enemyTurn …）を包み、
 1. 状態効果（バフ・デバフ・継続回復・毒・スタン・属性耐性低下・被ダメ増加・障壁・反撃・回避）
 2. キャラクター専用パッシブ（各2種・Lv25で2つ目を習得）と武器パッシブ（アンコモン以上の武器に固有効果）
 3. 新しいアクティブスキル・魔法（各キャラ2種・Lv8／Lv28で習得）
 4. 敵の新戦術（ボスの激昂・攻撃に付く弱体化・一部の敵の鼓舞）
 を追加する。セーブデータには新しい項目を書き込まない（武器パッシブは装備のuidから決まる）。 */
'use strict';
const V20=(()=>{
const R=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const footOf=u=>(typeof V19!=='undefined'&&V19.foot&&u.A&&!u.A.none)?V19.foot(u):[u.x+8*u.sc,u.y+16*u.sc-2];
const midOf=u=>{try{if(typeof V19!=='undefined'&&V19.mid&&u.A&&!u.A.none)return V19.mid(u);}catch(e){}return[u.x+8*u.sc,u.y+8*u.sc];};
const fx=(f,...a)=>{try{if(typeof FX19!=='undefined'&&FX19[f])FX19[f](...a);}catch(e){}};

/* ==================== 1. 状態効果 ==================== */
/* k: atk/def/mag/res/spd/crit（v=％）, regen/poison（v=最大HPに対する割合/ターン）, stun, mark（被ダメ+v%）, prot（被ダメ-v%）,
      weak（el を一時的に弱点にする）, shield（v=吸収量）, counter（v=反撃の威力）, evade（v=回避率％）, enrage（敵：攻撃・魔力+v%） */
const STN={atk:['攻撃','攻'],def:['防御','防'],mag:['魔力','魔'],res:['精神','精'],spd:['素早さ','速'],crit:['会心','会'],regen:['継続回復','再'],poison:['毒','毒'],stun:['スタン','痺'],
 mark:['被ダメ増加','標'],prot:['被ダメ軽減','護'],weak:['弱点付与','弱'],shield:['障壁','壁'],counter:['反撃態勢','返'],evade:['回避','避'],enrage:['激昂','怒']};
const STAT5=['atk','def','mag','res','spd'];let LASTC=null;
/* 一時的な弱点が切れたら、判明済みの弱点からも外す（図鑑には本来の弱点だけを残す） */
function fixWeak(u){if(!u||!u._w0)return;const ws=stsOf(u).filter(s=>s.k==='weak').map(s=>s.el);u.weak=[...new Set([...u._w0,...ws])];if(u.known)for(const k of[...u.known])if(!u.weak.includes(k))u.known.delete(k);
 if(u.kind&&G.known&&G.known[u.kind])G.known[u.kind]=G.known[u.kind].filter(k=>u._w0.includes(k));}
const isBuff=s=>['regen','prot','shield','counter','evade','enrage'].includes(s.k)||(STAT5.includes(s.k)||s.k==='crit')&&s.v>0;
const stsOf=u=>u.sts||(u.sts=[]);
const hasSt=(u,k)=>stsOf(u).some(s=>s.k===k);
const stSum=(u,k)=>stsOf(u).filter(s=>s.k===k).reduce((a,s)=>a+s.v,0);
function base0(u){if(!u._b0)u._b0={atk:u.atk,def:u.def,mag:u.mag,res:u.res,spd:u.spd,crit:u.crit||0};return u._b0;}
function recalc(u){const b=base0(u);for(const k of STAT5){let p=stSum(u,k)+(k==='atk'||k==='mag'?stSum(u,'enrage'):0);p=clamp(p,-60,80);const v=b[k]*(1+p/100);u[k]=k==='spd'?Math.max(1,+v.toFixed(2)):Math.max(1,Math.round(v));}
 u.crit=b.crit+clamp(stSum(u,'crit'),-50,60);}
/* 付与：同じ種類・同じ向き（強化／弱体）は重ねず、強い方・長い方を残す */
function addSt(u,k,v,t,o={}){if(!u||!u.alive)return false;const L=stsOf(u);
 if(k==='stun'&&u.boss){u.ct+=60/Math.max(1,u.spd);popS(u,'DELAY','#7fd6ff');return true;}
 if(k==='poison'&&u.boss)v*=.35;
 const same=L.find(s=>s.k===k&&(k==='weak'?s.el===o.el:Math.sign(s.v||1)===Math.sign(v||1)));
 if(same){same.v=Math.abs(v)>Math.abs(same.v)?v:same.v;same.t=Math.max(same.t,t);if(o.el)same.el=o.el;}
 else L.push(Object.assign({k,v,t},o));
 if(k==='weak'&&u.weak&&!u.weak.includes(o.el)){u._w0=u._w0||[...u.weak];u.weak=[...u.weak,o.el];}
 if(STAT5.includes(k)||k==='crit'||k==='enrage')recalc(u);
 const nm=k==='weak'?o.el+'弱点':(STAT5.includes(k)||k==='crit')?`${STN[k][0]}${v>0?'↑':'↓'}`:STN[k][0];
 popS(u,nm,isBuff({k,v})?'#8ff0a8':'#ff9a7a',isBuff({k,v})?'up':'dn');return true;}
function clearSt(u,pred){const L=stsOf(u),n0=L.length;u.sts=L.filter(s=>!pred(s));fixWeak(u);recalc(u);return n0-u.sts.length;}
function popS(u,txt,col,kind){try{pop(u,txt,col,true,'st20 '+(kind||''));}catch(e){}}
/* 手番の開始：継続回復・毒を処理し、効果時間を1減らす。スタンなら true を返す */
async function tickSts(u){const L=stsOf(u);if(!L.length||!u.alive)return false;let stun=false;
 for(const s of L){if(s.k==='regen'&&u.hp<u.mhp){const v=Math.max(1,Math.round(u.mhp*s.v));u.hp=Math.min(u.mhp,u.hp+v);pop(u,'+'+v,'#7dffa8');}
  if(s.k==='poison'){let v=Math.max(1,Math.round(u.mhp*s.v));if(u.side===0)v=Math.min(v,u.hp-1);if(v>0){u.hp=Math.max(0,u.hp-v);u.flash=6;pop(u,v,'#c07cff',false,'psn');}}
  if(s.k==='stun'&&s.t>0){stun=true;}}
 for(const s of L)s.t--;const gone=L.filter(s=>s.t<=0&&s.k!=='shield');
 u.sts=L.filter(s=>s.t>0||(s.k==='shield'&&s.v>0&&s.t>-99));
 if(gone.length){fixWeak(u);recalc(u);}
 refresh();if(u.side===1&&u.hp<=0){await kill(u);return true;}
 if(stun){pop(u,'スタン','#ffe14a',true,'st20 dn');log(`${u.name}は<b>しびれて動けない</b>！`);await wait(450);}
 return stun;}

/* ==================== 2. パッシブ ==================== */
/* 各パッシブ：n=名前 d=説明 と、戦闘中のフック
   start(u)・turn(u)・out(a,t,sk)→与ダメ倍率・inc(t,a,sk)→被ダメ倍率・hit(a,t,sk,r,d)・hurt(t,a,d)・kill(a,t)・acted(u,sk) */
const lowHP=(u,p)=>u.hp<=u.mhp*p;
const elIs=(sk,...e)=>e.includes(sk.el);
const fuQ=(a,t,sk)=>{(B.q20=B.q20||[]).push({a,t,sk:Object.assign({_fu:1},sk)});};
const PS={
 /* --- キャラクター専用 --- */
 c_rio1:{n:'灯火の導き',d:'戦闘開始時、味方全員の攻撃・魔力+8%（3ターン）',start:u=>{aliveH().forEach(h=>{addSt(h,'atk',8,3);addSt(h,'mag',8,3);});}},
 c_rio2:{n:'空白の共鳴',d:'星臨中の仲間がいる間、自分の与ダメ+20%',out:a=>B.heroes.some(h=>h!==a&&h.aw&&h.alive)?1.2:1},
 c_gald1:{n:'鉄壁の誓い',d:'HPが50%以上のとき、受けるダメージ-15%',inc:t=>t.hp>=t.mhp*.5?.85:1},
 c_gald2:{n:'報復の盾',d:'単体攻撃を受けると35%で反撃（打・威力0.8）',hurt:(t,a,d,sk)=>{if(a&&a.side===1&&sk&&sk.t==='one'&&d>0&&Math.random()<.35)(B.cq20=B.cq20||[]).push({a:t,t:a,sk:{n:'報復の盾',el:'打',k:'phys',pow:.8,t:'one',_fu:1}});}},
 c_mire1:{n:'双極循環',d:'直前と違う属性の魔法を使うと与ダメ+20%',out:(a,t,sk)=>sk.k==='mag'&&sk.el&&a._le20&&a._le20!==sk.el?1.2:1,acted:(u,sk)=>{if(sk.k==='mag'&&sk.el)u._le20=sk.el;}},
 c_mire2:{n:'魔力暴走',d:'会心が出るとSP+8、対象の精神-15%（2ターン）',hit:(a,t,sk,r)=>{if(r.crit){a.sp=Math.min(100,a.sp+8);if(t.alive)addSt(t,'res',-15,2);}}},
 c_shion1:{n:'影走り',d:'戦闘開始時、素早さ+20%（3ターン）',start:u=>addSt(u,'spd',20,3)},
 c_shion2:{n:'追い打ち',d:'単体攻撃で弱点を突くと30%で追撃（風・威力0.5）',hit:(a,t,sk,r)=>{if(r.weak&&sk.t==='one'&&t.alive&&Math.random()<.3)fuQ(a,t,{n:'追い打ち',el:'風',k:'phys',pow:.5,t:'one'});}},
 c_noah1:{n:'慈愛の機構',d:'手番の開始時、HPが最も低い味方を最大HPの6%回復',turn:u=>{const h=aliveH().filter(x=>x.hp<x.mhp).sort((a,b)=>a.hp/a.mhp-b.hp/b.mhp)[0];if(h){const v=Math.round(h.mhp*.06);h.hp=Math.min(h.mhp,h.hp+v);pop(h,'+'+v,'#7dffa8');}}},
 c_noah2:{n:'聖印の加護',d:'ノアが回復した味方は受けるダメージ-15%（2ターン）',healed:(u,t)=>addSt(t,'prot',15,2)},
 c_erna1:{n:'鷹の目',d:'弱点を突く攻撃は会心率+25%',critB:(a,t,sk)=>t.weak&&sk.el&&t.weak.includes(sk.el)?25:0},
 c_erna2:{n:'狙撃態勢',d:'HPが満タンの敵への与ダメ+30%',out:(a,t)=>t.hp>=t.mhp?1.3:1},
 c_balza1:{n:'炉の熱',d:'攻撃するたびに与ダメ+5%（最大+25%・戦闘中）',out:a=>1+.05*Math.min(5,a._heat20||0),acted:(u,sk)=>{if(sk.k==='phys'||sk.k==='mag'||sk.basic)u._heat20=Math.min(5,(u._heat20||0)+1);}},
 c_balza2:{n:'不屈',d:'HP30%以下で与ダメ+20%・受けるダメージ-25%',out:a=>lowHP(a,.3)?1.2:1,inc:t=>lowHP(t,.3)?.75:1},
 c_crow1:{n:'呪詛の残り香',d:'闇属性の攻撃が当たると30%で毒（3ターン）',hit:(a,t,sk)=>{if(elIs(sk,'闇')&&t.alive&&Math.random()<.3)addSt(t,'poison',.04,3);}},
 c_crow2:{n:'血の契約',d:'敵を倒すとHP10%回復・SP+10',kill:a=>{const v=Math.round(a.mhp*.1);a.hp=Math.min(a.mhp,a.hp+v);a.sp=Math.min(100,a.sp+10);pop(a,'+'+v,'#7dffa8',true);}},
 c_hakua1:{n:'連撃の型',d:'同じ敵を続けて攻撃するたび与ダメ+6%（最大+30%）',out:(a,t)=>1+.06*Math.min(5,a._ct20===t?a._cn20||0:0),hit:(a,t)=>{if(a._ct20===t)a._cn20=(a._cn20||0)+1;else{a._ct20=t;a._cn20=0;}}},
 c_hakua2:{n:'氷華の気',d:'氷属性で攻撃した敵の素早さ-15%（2ターン）',hit:(a,t,sk)=>{if(elIs(sk,'氷')&&t.alive)addSt(t,'spd',-15,2);}},
 c_jin1:{n:'ポポの援護',d:'行動のあと25%でポポが追撃（地・威力0.6）',acted:(u,sk)=>{if(sk.k==='phys'||sk.k==='mag'||sk.basic){const t=aliveE().sort((a,b)=>a.hp-b.hp)[0];if(t&&Math.random()<.25)fuQ(u,t,{n:'ポポの援護',el:'地',k:'phys',pow:.6,t:'one'});}}},
 c_jin2:{n:'野生の勘',d:'HP50%以下のとき20%で攻撃を回避',dodge:t=>lowHP(t,.5)?20:0},
 c_celes1:{n:'刻読み',d:'戦闘開始時、味方全員の素早さ+10%（3ターン）',start:u=>aliveH().forEach(h=>addSt(h,'spd',10,3))},
 c_celes2:{n:'時の歪み',d:'魔法が当たった敵を25%で遅らせる',hit:(a,t,sk)=>{if(sk.k==='mag'&&t.alive&&Math.random()<.25){t.ct+=(t.boss?15:35)/Math.max(1,t.spd);pop(t,'DELAY','#7fd6ff',true);}}},
 c_valk1:{n:'竜鱗',d:'炎・闇属性で受けるダメージ-30%',inc:(t,a,sk)=>sk&&elIs(sk,'炎','闇')?.7:1},
 c_valk2:{n:'竜の闘志',d:'攻撃を受けるたび攻撃+4%（最大+20%・戦闘中）',hurt:t=>{if(t.alive&&(t._fg20||0)<5){t._fg20=(t._fg20||0)+1;base0(t);t._b0.atk=Math.round(t._b0.atk*1.04);recalc(t);}}},
 /* --- 武器 --- */
 w_light:{n:'光刃の加護',d:'光属性の与ダメ+{v}%',v:15,out:(a,t,sk,v)=>elIs(sk,'光')?1+v/100:1},
 w_mikiri:{n:'見切り',d:'会心率+{v}%',v:8,critB:(a,t,sk,v)=>v},
 w_yuuki:{n:'勇気の刃',d:'HP80%以上のとき与ダメ+{v}%',v:12,out:(a,t,sk,v)=>a.hp>=a.mhp*.8?1+v/100:1},
 w_guard:{n:'守護者',d:'受けるダメージ-{v}%',v:8,inc:(t,a,sk,v)=>1-v/100},
 w_taunt:{n:'挑戦者',d:'挑発・防御中に受けるダメージ-{v}%',v:20,inc:(t,a,sk,v)=>t.taunt>0||t.guard?1-v/100:1},
 w_quake:{n:'地鳴り',d:'地属性の与ダメ+{v}%',v:15,out:(a,t,sk,v)=>elIs(sk,'地')?1+v/100:1},
 w_fire:{n:'炎の頁',d:'炎属性の与ダメ+{v}%',v:15,out:(a,t,sk,v)=>elIs(sk,'炎')?1+v/100:1},
 w_ice:{n:'氷の頁',d:'氷属性の与ダメ+{v}%',v:15,out:(a,t,sk,v)=>elIs(sk,'氷')?1+v/100:1},
 w_wisdom:{n:'知識の泉',d:'戦闘開始時のSP+{v}',v:20,start:(u,v)=>{u.sp=Math.min(100,u.sp+Math.round(v));}},
 w_twin:{n:'二刀の冴え',d:'通常攻撃のあと{v}%で追撃（威力0.4）',v:30,acted:(u,sk,v)=>{if(sk.basic){const t=aliveE()[0];if(t&&Math.random()<v/100)fuQ(u,t,{n:'二刀の冴え',el:'斬',k:'phys',pow:.4,t:'one'});}}},
 w_vital:{n:'急所狙い',d:'弱点を突いたときの会心率+{v}%',v:15,critB:(a,t,sk,v)=>sk&&sk.el&&t.weak&&t.weak.includes(sk.el)?v:0},
 w_thief:{n:'盗賊の勘',d:'ドロップ率+{v}%',v:10,make:(u,v)=>{u.drop=(u.drop||0)+v;}},
 w_mercy:{n:'慈雨',d:'回復量+{v}%',v:20,healB:(u,v)=>v},
 w_bless:{n:'祝福',d:'戦闘開始時、味方全員の精神+{v}%（3ターン）',v:10,start:(u,v)=>aliveH().forEach(h=>addSt(h,'res',Math.round(v),3))},
 w_aegis:{n:'聖なる守り',d:'戦闘開始時、味方全員に最大HP{v}%の障壁',v:8,start:(u,v)=>aliveH().forEach(h=>addSt(h,'shield',Math.round(h.mhp*v/100),99))},
 w_volt:{n:'雷の矢',d:'雷属性の与ダメ+{v}%',v:15,out:(a,t,sk,v)=>elIs(sk,'雷')?1+v/100:1},
 w_quick:{n:'速射',d:'素早さ+{v}%',v:8,make:(u,v)=>{u.spd=+(u.spd*(1+v/100)).toFixed(2);}},
 w_weakshot:{n:'急所射ち',d:'弱点を突いたときの与ダメ+{v}%',v:15,out:(a,t,sk,v)=>t.weak&&sk.el&&t.weak.includes(sk.el)?1+v/100:1},
 w_heavy:{n:'重撃',d:'与ダメ+{v}%（代わりに素早さ-5%）',v:10,make:u=>{u.spd=+(u.spd*.95).toFixed(2);},out:(a,t,sk,v)=>1+v/100},
 w_crush:{n:'破砕',d:'攻撃が当たると15%で敵の防御-{v}%（2ターン）',v:20,hit:(a,t,sk,r,d,v)=>{if(t.alive&&!sk._fu&&Math.random()<.15)addSt(t,'def',-Math.round(v),2);}},
 w_forge:{n:'炉熱',d:'炎属性の与ダメ+{v}%',v:15,out:(a,t,sk,v)=>elIs(sk,'炎')?1+v/100:1},
 w_drain:{n:'吸魂',d:'与ダメの{v}%をHPとして吸収',v:5,hit:(a,t,sk,r,d,v)=>{if(d>0&&a.hp<a.mhp){const h=Math.max(1,Math.round(d*v/100));a.hp=Math.min(a.mhp,a.hp+h);}}},
 w_reaper:{n:'死神の鎌',d:'HP30%以下の敵への与ダメ+{v}%',v:25,out:(a,t,sk,v)=>lowHP(t,.3)?1+v/100:1},
 w_dark:{n:'闇の刃',d:'闇属性の与ダメ+{v}%',v:15,out:(a,t,sk,v)=>elIs(sk,'闇')?1+v/100:1},
 w_rush:{n:'疾風拳',d:'多段攻撃の各撃の与ダメ+{v}%',v:10,out:(a,t,sk,v)=>sk.hits>1||sk.k==='rhythm'?1+v/100:1},
 w_frost:{n:'凍拳',d:'氷属性の与ダメ+{v}%',v:15,out:(a,t,sk,v)=>elIs(sk,'氷')?1+v/100:1},
 w_chi:{n:'気功',d:'手番の開始時にHPを最大HPの{v}%回復',v:3,turn:(u,v)=>{if(u.hp<u.mhp){const h=Math.round(u.mhp*v/100);u.hp=Math.min(u.mhp,u.hp+h);pop(u,'+'+h,'#7dffa8',true);}}},
 w_wild:{n:'野性',d:'HP50%以下のとき与ダメ+{v}%',v:15,out:(a,t,sk,v)=>lowHP(a,.5)?1+v/100:1},
 w_earth:{n:'大地の爪',d:'地属性の与ダメ+{v}%',v:15,out:(a,t,sk,v)=>elIs(sk,'地')?1+v/100:1},
 w_hunt:{n:'狩猟本能',d:'HP半分以下の敵への与ダメ+{v}%',v:12,out:(a,t,sk,v)=>t.hp<=t.mhp*.5?1+v/100:1},
 w_clock:{n:'刻の針',d:'素早さ+{v}%',v:10,make:(u,v)=>{u.spd=+(u.spd*(1+v/100)).toFixed(2);}},
 w_star:{n:'星詠み',d:'魔法の与ダメ+{v}%',v:12,out:(a,t,sk,v)=>sk.k==='mag'?1+v/100:1},
 w_fang:{n:'竜牙',d:'攻撃のあと{v}%で追撃（炎・威力0.5）',v:12,acted:(u,sk,v)=>{if(sk.k==='phys'||sk.basic){const t=aliveE()[0];if(t&&Math.random()<v/100)fuQ(u,t,{n:'竜牙',el:'炎',k:'phys',pow:.5,t:'one'});}}},
 w_dblood:{n:'竜の血',d:'敵を倒すとAG+{v}',v:15,kill:(a,t,v)=>{if(!a.aw)a.ag=Math.min(100,a.ag+v);}}};
/* キャラごとの専用パッシブと、武器種ごとの候補 */
const CPS={rio:['c_rio1','c_rio2'],gald:['c_gald1','c_gald2'],mire:['c_mire1','c_mire2'],shion:['c_shion1','c_shion2'],noah:['c_noah1','c_noah2'],erna:['c_erna1','c_erna2'],
 balza:['c_balza1','c_balza2'],crow:['c_crow1','c_crow2'],hakua:['c_hakua1','c_hakua2'],jin:['c_jin1','c_jin2'],celes:['c_celes1','c_celes2'],valk:['c_valk1','c_valk2']};
const CP_LV=[1,25];
const WPS={rio:['w_light','w_mikiri','w_yuuki'],gald:['w_guard','w_taunt','w_quake'],mire:['w_fire','w_ice','w_wisdom'],shion:['w_twin','w_vital','w_thief'],
 noah:['w_mercy','w_bless','w_aegis'],erna:['w_volt','w_quick','w_weakshot'],balza:['w_heavy','w_crush','w_forge'],crow:['w_drain','w_reaper','w_dark'],
 hakua:['w_rush','w_frost','w_chi'],jin:['w_wild','w_earth','w_hunt'],celes:['w_clock','w_star','w_mercy'],valk:['w_fang','w_dblood','w_heavy']};
const WMUL=[0,1,1.25,1.5,1.8];
/* 武器パッシブ：アンコモン以上の武器に、uid から決まる1種が付く（レアリティで効果量が上がる） */
function wpOf(it){if(!it||it.slot!=='w'||it.unid||!it.who||!(it.rar>=1))return null;const pool=WPS[it.who];if(!pool)return null;const id=pool[(it.uid*7+3)%pool.length],P=PS[id];
 const v=+(P.v*WMUL[Math.min(4,it.rar)]).toFixed(P.v<5?1:0);return{id,v,n:P.n,d:P.d.replace('{v}',v)};}
function wpText(it){const w=wpOf(it);return w?`<span class="wp20">◆武器パッシブ「${w.n}」${w.d}</span>`:'';}
function charPS(id){const lv=(G.h[id]&&G.h[id].lv)||1;return(CPS[id]||[]).map((k,i)=>({id:k,v:0,on:lv>=CP_LV[i],lv:CP_LV[i]}));}
/* 戦闘ユニットに付くパッシブの一覧 */
function unitPS(u){if(u.side!==0)return[];const o=charPS(u.id).filter(p=>p.on);const w=G.h[u.id]&&G.h[u.id].eq.w&&findItem(G.h[u.id].eq.w),wp=wpOf(w);if(wp)o.push(wp);return o;}
function each(u,ev,...a){let r=null;for(const p of(u.ps20||[])){const P=PS[p.id];if(P&&P[ev]){try{const x=P[ev](u,...a,p.v);if(typeof x==='number')r=(r==null?1:r)*x;}catch(e){console.error(e);}}}return r;}
function sumEv(u,ev,...a){let s=0;for(const p of(u.ps20||[])){const P=PS[p.id];if(P&&P[ev]){try{s+=+P[ev](u,...a,p.v)||0;}catch(e){}}}return s;}

/* ==================== 3. 新しいスキル・魔法 ==================== */
/* sup20：支援技（fx20 を付与・heal20 で回復）。攻撃技の fx20 は命中した相手ごとに1回だけ判定。
   cond20：brk（HP半分以下の敵×1.5）・debuff（弱体1つにつき+25%、最大+75%）・lowhp（HPが減るほど最大+80%）・spd（速さの差で最大+40%）・poison（毒の敵×1.8）・full（HP満タンの敵×1.5）
   pierce20：防御・精神の一部を無視　purge20：敵の強化を消し、消した数だけ威力上昇　self20：使用後に自分へ付与 */
const NSK={
 kobu:{n:'鼓舞の灯',sp:25,k:'sup20',t:'self',fx20:[{on:'allies',k:'atk',v:15,t:3},{on:'allies',k:'mag',v:15,t:3}],d:'味方全員の攻撃・魔力+15%（3ターン）',role:'buff'},
 torirensan:{n:'灯火連斬',sp:35,el:'光',k:'phys',pow:.62,hits:3,t:'one',cond20:'brk',d:'光の3連撃。HP半分以下の敵には威力1.5倍'},
 teppekikamae:{n:'鉄壁の構え',sp:20,k:'sup20',t:'self',fx20:[{on:'self',k:'def',v:40,t:3},{on:'self',k:'res',v:40,t:3}],taunt20:2,d:'自分の防御・精神+40%（3ターン）＋2ターン挑発',role:'guard'},
 saigan:{n:'砕岩撃',sp:25,el:'打',k:'phys',pow:1.3,t:'one',fx20:[{on:'t',k:'def',v:-25,t:3}],d:'打撃＋敵の防御-25%（3ターン）'},
 prism:{n:'プリズム・ブランド',sp:22,el:'炎',k:'mag',pow:.8,t:'one',fx20:[{on:'t',k:'weak',el:'炎',t:3},{on:'t',k:'weak',el:'氷',t:3}],d:'炎の魔法＋敵に炎・氷の弱点を刻む（3ターン）'},
 meteor:{n:'メテオスウォーム',sp:45,el:'炎',k:'mag',pow:.42,hits:3,t:'all',d:'炎の隕石を3回、敵全体へ（消費大）'},
 dokujin:{n:'毒刃',sp:15,el:'突',k:'phys',pow:1,t:'one',fx20:[{on:'t',k:'poison',v:.05,t:3,p:.75}],d:'突き＋75%で毒（最大HP5%×3ターン）'},
 genei:{n:'幻影乱舞',sp:30,el:'風',k:'phys',pow:.4,hits:4,t:'one',cond20:'spd',d:'風の4連撃。敵より速いほど威力上昇（最大+40%）'},
 regene:{n:'リジェネレイト',sp:25,k:'sup20',t:'self',fx20:[{on:'allies',k:'regen',v:.08,t:3}],d:'味方全員に継続回復（最大HP8%×3ターン）',role:'heal'},
 dispel:{n:'ディスペル・ライト',sp:25,el:'光',k:'mag',pow:1,t:'one',purge20:1,d:'光の魔法＋敵の強化を全て消す（消した数×30%威力上昇）'},
 ashidome:{n:'足止めの矢',sp:20,el:'突',k:'phys',pow:1,t:'one',delay:30,fx20:[{on:'t',k:'spd',v:-30,t:3}],d:'射撃＋敵の素早さ-30%（3ターン）・行動を遅らせる'},
 senkou:{n:'穿光の矢',sp:30,el:'光',k:'phys',pow:1.55,t:'one',pierce20:.5,d:'光の矢。敵の防御を半分無視する'},
 kaentanda:{n:'火炎鍛打',sp:25,el:'炎',k:'phys',pow:1.35,t:'one',self20:[{k:'atk',v:20,t:3}],d:'炎の一撃＋自分の攻撃+20%（3ターン）'},
 daichiwari:{n:'大地割り',sp:40,el:'地',k:'phys',pow:1,t:'all',w:1.35,fx20:[{on:'t',k:'spd',v:-20,t:2}],d:'敵全体に地の衝撃＋素早さ-20%（2ターン）。次の手番が遅い'},
 fushoku:{n:'腐食の呪い',sp:20,el:'闇',k:'mag',pow:.6,t:'one',fx20:[{on:'t',k:'def',v:-25,t:3},{on:'t',k:'res',v:-25,t:3}],d:'闇の呪い＋敵の防御・精神-25%（3ターン）'},
 tamakurai:{n:'魂喰らい',sp:35,el:'闇',k:'mag',pow:1.35,t:'one',drain:.4,cond20:'debuff',d:'闇の魔法。与ダメの40%を吸収。弱体1つにつき威力+25%'},
 hyakuretsu:{n:'百裂拳',sp:35,el:'打',k:'phys',pow:.32,hits:6,t:'one',d:'打撃6連打。弱点なら1撃ごとに大きく響く'},
 hyouketsu:{n:'氷結掌',sp:25,el:'氷',k:'phys',pow:1.2,t:'one',fx20:[{on:'t',k:'stun',v:1,t:1,p:.35}],d:'氷の掌打＋35%で凍結（1回休み。ボスは遅延）'},
 popototsu:{n:'ポポ突撃',sp:20,el:'地',k:'phys',pow:.65,hits:2,t:'one',fx20:[{on:'t',k:'atk',v:-15,t:2}],d:'ポポと2連撃＋敵の攻撃-15%（2ターン）'},
 kemonohoko:{n:'獣の咆哮',sp:30,k:'sup20',t:'self',fx20:[{on:'allies',k:'atk',v:20,t:3},{on:'enemies',k:'def',v:-10,t:3}],d:'味方全員の攻撃+20%・敵全体の防御-10%（3ターン）',role:'buff'},
 chronoslow:{n:'クロノスロウ',sp:30,el:null,k:'mag',pow:.7,t:'all',fx20:[{on:'t',k:'spd',v:-25,t:3}],d:'時の魔法・敵全体＋素早さ-25%（3ターン）'},
 hastearea:{n:'ヘイストエリア',sp:30,k:'sup20',t:'self',fx20:[{on:'allies',k:'spd',v:25,t:3}],ct20:.3,d:'味方全員の素早さ+25%（3ターン）＋次の手番を早める',role:'buff'},
 ryurinkamae:{n:'竜鱗の構え',sp:20,k:'sup20',t:'self',fx20:[{on:'self',k:'shield',v:.22,t:99},{on:'self',k:'counter',v:1,t:3}],d:'最大HP22%の障壁＋3ターン反撃態勢（威力1.0）',role:'guard'},
 kokuryu:{n:'黒竜の吐息',sp:40,el:'闇',k:'mag',pow:.95,t:'all',fx20:[{on:'t',k:'poison',v:.04,t:3,p:.4}],d:'闇の吐息・敵全体＋40%で毒（3ターン）'},
 /* 職業・汎用（誰でも：ジョブLv5で習得） */
 seiten:{n:'星天の加護',sp:30,k:'sup20',t:'self',fx20:[{on:'allies',k:'prot',v:20,t:3}],d:'味方全員の受けるダメージ-20%（3ターン）',role:'guard'},
 kaihou:{n:'解き放つ祈り',sp:20,k:'sup20',t:'self',cleanse20:1,heal20:.15,d:'味方全員の弱体を消し、HP15%回復',role:'heal'}};
Object.assign(SK,NSK);
/* キャラごとの習得（Lv8／Lv28） */
const LSK={rio:[[8,'kobu'],[28,'torirensan']],gald:[[8,'saigan'],[28,'teppekikamae']],mire:[[8,'prism'],[28,'meteor']],shion:[[8,'dokujin'],[28,'genei']],
 noah:[[8,'regene'],[28,'dispel']],erna:[[8,'ashidome'],[28,'senkou']],balza:[[8,'kaentanda'],[28,'daichiwari']],crow:[[8,'fushoku'],[28,'tamakurai']],
 hakua:[[8,'hyouketsu'],[28,'hyakuretsu']],jin:[[8,'popototsu'],[28,'kemonohoko']],celes:[[8,'chronoslow'],[28,'hastearea']],valk:[[8,'ryurinkamae'],[28,'kokuryu']]};
/* ジョブにも新しい技（癒し手Lv5：解き放つ祈り／重騎士Lv5：星天の加護） */
try{if(JOBS.iyashi&&!JOBS.iyashi.sk.some(s=>s[1]==='kaihou'))JOBS.iyashi.sk.push([5,'kaihou']);if(JOBS.juukishi&&!JOBS.juukishi.sk.some(s=>s[1]==='seiten'))JOBS.juukishi.sk.push([5,'seiten']);}catch(e){}
{const _sl=skillList;skillList=function(id){const s=_sl(id),lv=(G.h[id]&&G.h[id].lv)||1;for(const[l,k]of(LSK[id]||[]))if(lv>=l&&!s.includes(k))s.push(k);return s;};}

/* ==================== 4. 敵の新戦術 ==================== */
/* 敵の攻撃に弱体化を付ける */
const EFX={spore:[{k:'poison',v:.03,t:3,p:.3}],curse:[{k:'res',v:-15,t:2,p:.4}],icewave:[{k:'spd',v:-15,t:2,p:.35}],slam:[{k:'def',v:-15,t:2,p:.3}],bite:[{k:'poison',v:.03,t:2,p:.2}],
 wave2:[{k:'atk',v:-10,t:2,p:.3}],blizzard:[{k:'spd',v:-20,t:2,p:.5}],bell:[{k:'mag',v:-15,t:2,p:.5}],kinju:[{k:'def',v:-15,t:2,p:.5}],senju:[{k:'poison',v:.04,t:3,p:.4}],
 deluge:[{k:'spd',v:-15,t:2,p:.5}],dfire:[{k:'poison',v:.03,t:2,p:.25}],tide:[{k:'def',v:-15,t:2,p:.3}],slash2:[{k:'def',v:-10,t:2,p:.25}]};
for(const k in EFX)if(EA[k])EA[k].fx20=EFX[k].map(f=>Object.assign({on:'t'},f));
/* 一部の敵は仲間を鼓舞する（攻撃+20%・3ターン） */
const RALLY=['darkknight','onimusha','shade','yukirei','bookghost'];

/* ==================== 戦闘への組み込み ==================== */
/* ユニット生成：パッシブを付ける（武器パッシブの能力変化もここで） */
{const _hero=hero;hero=function(id){const u=_hero(id);try{u.sts=[];u.ps20=unitPS(u);for(const p of u.ps20){const P=PS[p.id];if(P&&P.make)P.make(u,p.v);}}catch(e){console.error(e);}return u;};}
{const _sb=startBattle;startBattle=function(list,opts={}){const r=_sb(list,opts);try{if(B){B.q20=[];B.cq20=[];B.round20=1;B.heroes.forEach(h=>{h.sts=h.sts||[];base0(h);});B.enemies.forEach(e=>{e.sts=[];base0(e);});
  setTimeout(()=>{if(!B||B.over)return;B.heroes.forEach(h=>{if(h.alive)each(h,'start');});refresh();},380);}}catch(e){console.error(e);}return r;};}
/* 与ダメ・被ダメの倍率（状態効果・パッシブ・スキルの条件） */
{const _c=calc;calc=function(a,t,sk){let def0=null;
 if(sk.pierce20){def0=[t.def,t.res];t.def=Math.round(t.def*(1-sk.pierce20));t.res=Math.round(t.res*(1-sk.pierce20));}
 /* 会心率の上乗せ（パッシブ） */
 let cb=0;if(a.side===0)cb=sumEv(a,'critB',t,sk);if(cb)a.crit=(a.crit||0)+cb;
 let r;try{r=_c(a,t,sk);}finally{if(def0){t.def=def0[0];t.res=def0[1];}if(cb)a.crit-=cb;}
 let m=1;
 if(a.side===0){const x=each(a,'out',t,sk);if(x!=null)m*=x;}
 if(t.side===0){const x=each(t,'inc',a,sk);if(x!=null)m*=x;}
 const mk=stSum(t,'mark'),pr=stSum(t,'prot');if(mk)m*=1+mk/100;if(pr)m*=Math.max(.3,1-pr/100);
 const c=sk.cond20;
 if(c==='brk'&&t.hp<=t.mhp*.5)m*=1.5;
 if(c==='debuff')m*=1+.25*Math.min(3,stsOf(t).filter(s=>!isBuff(s)).length);
 if(c==='lowhp')m*=1+.8*(1-a.hp/a.mhp);
 if(c==='spd')m*=1+clamp((a.spd-t.spd)*.04,0,.4);
 if(c==='poison'&&hasSt(t,'poison'))m*=1.8;
 if(c==='full'&&t.hp>=t.mhp)m*=1.5;
 if(sk._purge)m*=1+.3*sk._purge;
 if(m!==1)r.d=Math.max(1,Math.round(r.d*m));return r;};}
/* 被ダメ：障壁・回避 */
{const _h=hurt;hurt=function(t,d){const a=B&&B._atk20,sk=B&&B._sk20;
 if(t.alive&&d>0&&a&&a!==t&&!(sk&&sk.k==='heal')){
  const ev=stSum(t,'evade')+(t.side===0?sumEv(t,'dodge'):0);
  if(ev>0&&Math.random()*100<ev){setTimeout(()=>pop(t,'MISS','#ffffff',true),50);return 0;}
  const sh=stsOf(t).find(s=>s.k==='shield'&&s.v>0);if(sh){const ab=Math.min(sh.v,d);sh.v-=ab;d-=ab;setTimeout(()=>pop(t,'障壁 -'+ab,'#9fd8ff',true,'st20 up'),40);if(sh.v<=0)t.sts=t.sts.filter(s=>s!==sh);if(d<=0)return 0;}}
 const r=_h(t,d);
 try{if(a&&a!==t&&r>0){if(t.side===0)each(t,'hurt',a,r,sk);
  if(hasSt(t,'counter')&&a.alive&&a.side!==t.side&&sk&&!sk._fu){const c=stsOf(t).find(s=>s.k==='counter');(B.cq20=B.cq20||[]).push({a:t,t:a,sk:{n:'反撃',el:t.side===0?(t.atkEl||t.elem||'斬'):'斬',k:'phys',pow:c.v,t:'one',_fu:1}});}}}catch(e){console.error(e);}
 return r;};}
/* 命中：パッシブの発動・スキルの追加効果 */
{const _hit=hit;hit=async function(a,t,sk){if(!B)return _hit(a,t,sk);const pa=B._atk20,ps=B._sk20;B._atk20=a;B._sk20=sk;LASTC=null;
 let d;try{d=await _hit(a,t,sk);}finally{if(B){B._atk20=pa;B._sk20=ps;}}
 if(!B)return d;
 try{const r=LASTC||{};fixWeak(t);
  if(a.side===0&&!sk._fu)each(a,'hit',t,sk,r,d);
  /* 追加効果は1回の行動で、相手1体につき1度だけ */
  if(sk.fx20&&B){B._fx20=B._fx20||new Set();if(!B._fx20.has(t)){B._fx20.add(t);for(const f of sk.fx20){if(f.on!=='t')continue;if(f.p!=null&&Math.random()>=f.p)continue;if(!t.alive)break;
    addSt(t,f.k,f.v,f.t,f.el?{el:f.el}:{});}}}
  if(a.side===0&&!t.alive&&!sk._fu)each(a,'kill',t);
 }catch(e){console.error(e);}
 return d;};}
/* calc の直近の結果を控える（パッシブの「会心時」「弱点時」に使う） */
{const _c=calc;calc=function(a,t,sk){const r=_c(a,t,sk);LASTC=r;return r;};}

/* 追撃・反撃の実行 */
async function drain(q){let n=0;while(B&&!B.over&&q&&q.length&&n<6){const{a,t,sk}=q.shift();n++;let tg=t;if(!tg||!tg.alive)tg=(a.side===0?aliveE():aliveH())[0];if(!a.alive||!tg)continue;
  pop(a,sk.n,'#ffe27a',true,'st20 fu');await wait(160);try{const[x,y]=midOf(tg);fx(sk.k==='mag'?'burst':'slash',x,y,ELC[sk.el]||'#ffffff',{size:1});}catch(e){}
  await hit(a,tg,sk);await wait(180);if(!aliveE().length||!aliveH().length)break;}}

/* 支援技（sup20）の処理 */
async function support(u,sk){u.sp-=sk.sp||0;log(`${u.name}の<b>${sk.n}</b>！`);
 try{const A=ANIM.setup(u);if(!A.none){ANIM.to(u,{ta:-.15,hN:[-4,-6],hF:[-3,-4],cr:1,ex:2},180);}}catch(e){}
 const[fx0,fy0]=footOf(u),[mx,my]=midOf(u),col=sk.role==='heal'?'#7dffa8':sk.role==='guard'?'#9fd8ff':'#ffe27a';
 fx('circle',fx0,fy0,col,{dur:700,r:16});fx('gather',mx,my-4,col,14,320);SFX.heal();await wait(420);
 const ps=sk.fx20||[];
 for(const f of ps){const tg=f.on==='self'?[u]:f.on==='allies'?aliveH():f.on==='enemies'?aliveE():[];for(const t of tg){let v=f.v;if(f.k==='shield')v=Math.round(t.mhp*f.v);addSt(t,f.k,v,f.t,f.el?{el:f.el}:{});if(t.side===0){const[x,y]=midOf(t);fx(isBuff({k:f.k,v})?'buff':'ring',x,y,col);}}}
 if(sk.taunt20){u.taunt=Math.max(u.taunt||0,sk.taunt20);}
 if(sk.cleanse20){let n=0;aliveH().forEach(h=>{n+=clearSt(h,s=>!isBuff(s));});if(n)log(`${u.name}の<b>${sk.n}</b>！ 弱体を${n}つ打ち消した`);}
 if(sk.heal20){const hb=1+sumEv(u,'healB')/100;aliveH().forEach(h=>{const v=Math.round(h.mhp*sk.heal20*hb);h.hp=Math.min(h.mhp,h.hp+v);pop(h,'+'+v,'#7dffa8');each(u,'healed',h);});}
 if(sk.ct20)aliveH().forEach(h=>{if(h!==u)h.ct=Math.max(0,h.ct*(1-sk.ct20));});
 refresh();await wait(380);try{ANIM.idle(u,200);}catch(e){}setCT(u,sk.w||1);}

{const _da=doAction;doAction=async function(u,sk,t){if(!B)return _da(u,sk,t);B._fx20=new Set();B.q20=[];
 if(sk&&sk.k==='sup20'){await support(u,sk);if(u.side===0)each(u,'acted',sk);await drain(B.q20);return;}
 /* 敵の強化を剥がす */
 let s2=sk;if(sk&&sk.purge20&&t&&t.alive){const n=clearSt(t,s=>isBuff(s));if(n){pop(t,`強化解除×${n}`,'#fff3a6',true,'st20 dn');log(`<b>${sk.n}</b>――${t.name}の強化を${n}つ打ち消した！`);s2=Object.assign({},sk,{_purge:n});}}
 /* 回復量アップ（武器パッシブ）：heal 系 */
 let hb=0;if(u.side===0&&sk&&(sk.k==='heal'||sk.k==='healAll'))hb=sumEv(u,'healB');if(hb)s2=Object.assign({},s2,{pow:s2.pow*(1+hb/100)});
 const hp0=u.side===0&&sk&&['heal','healAll','revive','reviveAll'].includes(sk.k)?B.heroes.map(h=>h.hp):null;
 const r=await _da(u,s2,t);
 try{if(hp0)B.heroes.forEach((h,i)=>{if(h.hp>hp0[i])each(u,'healed',h);});
  if(u.alive&&sk&&sk.self20)for(const f of sk.self20)addSt(u,f.k,f.v,f.t);
  if(u.side===0&&u.alive&&sk)each(u,'acted',sk);}catch(e){console.error(e);}
 await drain(B.q20);await drain(B.cq20);refresh();return r;};}

/* 手番の開始：状態効果の経過・パッシブ */
{const _ht=heroTurn;heroTurn=async function(u){if(!B||B.over)return _ht(u);
 try{each(u,'turn');}catch(e){}
 const stun=await tickSts(u);if(!u.alive||!aliveE().length)return;
 if(stun){u.guard=false;setCT(u);refresh();return;}
 return _ht(u);};}
{const _et=enemyTurn;enemyTurn=async function(e){if(!B||B.over)return _et(e);B.cq20=[];
 const stun=await tickSts(e);if(!e.alive)return;if(stun){setCT(e);refresh();return;}
 /* ボスの激昂：HP40%を切ると一度だけ攻撃・魔力+25% */
 if(e.boss&&!e._rage&&e.hp<e.mhp*.4){e._rage=1;addSt(e,'enrage',25,99);B.shake=10;log(`${e.name}は<b>激昂した</b>！ 攻撃と魔力が上がった（ノアのディスペル・ライトで消せる）`);SFX.warn();try{const[x,y]=midOf(e);fx('ring',x,y,'#ff5a3a',{r1:26,dur:420,thick:2});}catch(x){}refresh();await wait(650);}
 /* 一部の敵は仲間を鼓舞する */
 if(!e.boss&&RALLY.includes(e.kind)&&!e.charging&&Math.random()<.18&&!aliveE().every(x=>hasSt(x,'atk'))){e.turn++;log(`${e.name}は<b>仲間を鼓舞した</b>！（攻撃+20%）`);
  try{const[x,y]=midOf(e);fx('ring',x,y,'#ff8a5a',{r1:18});}catch(x){}aliveE().forEach(x=>addSt(x,'atk',20,3));SFX.warn();setCT(e);refresh();await wait(600);return;}
 B._fx20=new Set();const r=await _et(e);await drain(B.cq20);return r;};}

/* オート：支援技も使う */
{const _ap=autoPick;autoPick=function(u){const r=_ap(u);try{if(!r||r.aw||!r.sk||r.sk.k==='reso'||u.aw)return r;
  const own=(u.skills||[]).map(k=>SK[k]).filter(s=>s&&s.k==='sup20'&&(s.sp||0)<=u.sp);
  const heal=own.find(s=>s.role==='heal'&&aliveH().some(h=>h.hp<h.mhp*.5));if(heal)return{sk:heal};
  const bf=own.find(s=>s.role!=='heal'&&!(s.fx20||[]).every(f=>f.on==='enemies'||(f.on==='self'?hasSt(u,f.k):aliveH().every(h=>hasSt(h,f.k)))));if(bf&&Math.random()<.35)return{sk:bf};
  if(r.sk.basic){const nv=Object.values(NSK),at=(u.skills||[]).map(k=>SK[k]).filter(s=>s&&nv.includes(s)&&(s.k==='phys'||s.k==='mag')&&(s.sp||0)<=u.sp-10);if(at.length&&Math.random()<.4){const s=at[Math.random()*at.length|0];return{sk:s,t:r.t||aliveE()[0]};}}}catch(e){}return r;};}

/* 状態タグ（味方パネル・敵ラベルに出す） */
{const _st=stTags;stTags=function(u){const t=_st(u);try{for(const s of stsOf(u)){const b=isBuff(s),nm=s.k==='weak'?s.el+'弱':(STAT5.includes(s.k)||s.k==='crit')?STN[s.k][1]+(s.v>0?'↑':'↓'):STN[s.k][1];t.push([nm+(s.t<50?s.t:''),'s20 '+(b?'bu':'de')]);}}catch(e){}return t;};}

/* 装備カードに武器パッシブを表示 */
{const _ic=icard;icard=function(it,o={}){const s=_ic(it,o);if(!it||it.unid||!wpOf(it))return s;const w=wpOf(it),ch=`<span class="chp wp">◆${w.n}：${w.d}</span>`,k=o.right?s.lastIndexOf('</div></div><div class="iright">'):s.length-18;return k>0?s.slice(0,k)+ch+s.slice(k):s;};}
/* 装備の評価：武器パッシブ分を少し加点 */
{const _sc=score;score=function(it,id){const s=_sc(it,id);return wpOf(it)?s+6*(it.rar||1):s;};}

return{PS,CPS,WPS,LSK,NSK,STN,charPS,wpOf,wpText,unitPS,addSt,clearSt,stsOf,isBuff,tickSts,CP_LV};})();
