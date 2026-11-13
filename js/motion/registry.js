/* ===== ver0.29 モーション台帳（MOTION） =====
 戦闘・図鑑で使うモーションの「名前・区分・使う絵・動き」を 1 か所で管理する。
 今後、通常攻撃・スキル・魔法・被弾・勝利などのモーションを大量に足すときは、ここへ登録するだけでよい。

 ■ 標準モーション（CATALOG）
   id ごとに 呼称（TERMS の区分と対応）・既定で使う絵（素材のポーズ名）・ループするか を持つ。
   既定の動き（振り付け）は従来どおり ver19.js（武器ごとの型）と anim.js（待機）が作る。
 ■ 素材のポーズ名（フレーム）
   味方：stance(待機・側面) front(正面) back(背面) ready lunge(攻撃) dash(走り) cast(魔法) guard hit weak(瀕死) win down awk(星臨)
   敵　：idle(側面) front(正面、あれば)
   新しいポーズは tools/build_spx_heroes.py の BATTLE に名前を足して原画から作る（例：'skill_koujin'）。
 ■ キャラ・技ごとの専用モーション（add）
   MOTION.add('rio', 'skill:koujin', {keys:[{pose:{f:'lunge',ta:.4},ms:120},{pose:{f:'skill_koujin'},ms:90,ease:'in'}], fx:{type:'slash',big:1}, approach:true});
   ・対象：'skill:技id' ＞ 'cat:技の区分（TERMS.SKILL のキー）' ＞ 'motion:標準モーションid' の順に探す
   ・keys：ANIM.to に渡すキーポーズの列。pose.f に素材のポーズ名を書くと、その絵を直接使う
   ・approach：近接（相手の前まで走る）。fx：命中エフェクトの種類（ver19 の onHurt が使う）
   登録が無い技は従来の振り付けのまま動く。 */
const MOTION=(()=>{
/* 標準モーション：g＝区分（TERMS.SKILL / 状態）、f＝既定の絵（側面）、loop＝待機系 */
const CATALOG={
 base:{n:'通常',g:'view',f:'stance',fm:'idle',loop:0,d:'基本姿勢（動かない）'},
 idle:{n:'待機',g:'view',f:'stance',fm:'idle',loop:1,d:'呼吸・しぐさ'},
 seirin:{n:'星臨',g:'seirin',f:'awk',loop:1,d:'星臨の姿'},
 run:{n:'ダッシュ',g:'move',f:'dash'},
 phys_normal:{n:'通常攻撃（物理）',g:'phys_normal',f:'lunge'},
 mag_normal:{n:'通常攻撃（魔法）',g:'mag_normal',f:'cast'},
 guard:{n:'防御',g:'guard',f:'guard'},
 phys_attack:{n:'攻撃スキル',g:'phys_attack',f:'lunge'},
 phys_support:{n:'補助スキル',g:'phys_support',f:'cast'},
 phys_heal:{n:'回復スキル',g:'phys_heal',f:'cast'},
 mag_attack:{n:'攻撃魔法',g:'mag_attack',f:'cast'},
 mag_support:{n:'補助魔法',g:'mag_support',f:'cast'},
 mag_heal:{n:'回復魔法',g:'mag_heal',f:'cast'},
 hit:{n:'被弾',g:'state',f:'hit'},
 low:{n:'瀕死',g:'state',f:'weak'},
 down:{n:'戦闘不能',g:'state',f:'down'},
 win:{n:'勝利',g:'state',f:'win'}};
/* 図鑑で確認できるモーション（ver0.29：通常・待機・星臨の 3 種に統一） */
const ZUKAN=['base','idle','seirin'];
/* 図鑑の回転表示で、向き（正面・側面・背面）ごとに使う素材のポーズ名。無い向きは自動補完（viewer.js） */
const VIEWS={
 hum:{base:{front:'front',side:'stance',back:'back'},idle:{front:'front',side:'stance',back:'back'},seirin:{front:'awk',side:'awk',back:null,K:1}},
 mon:{base:{front:'front',side:'idle',back:null},idle:{front:'front',side:'idle',back:null}}};

/* ---------- キャラ・技ごとの登録 ---------- */
const REG={};/* REG[キャラid or '*'][対象]＝定義 */
function add(who,target,def){(REG[who]=REG[who]||{})[target]=Object.assign({target},def);return def;}
function remove(who,target){if(REG[who])delete REG[who][target];}
const charOf=u=>u&&(u.side===0?u.id:String(u.kind||u.spr||'').replace(/^vo_/,''));
/* 行動に使う専用モーション（無ければ null＝従来の振り付け） */
function custom(u,sk){if(!u||!sk)return null;const who=charOf(u),key=skKey(sk);let cat=null;try{cat=TERMS.skillCat(sk,u.side===0?u.id:null);}catch(e){}
 for(const w of[who,'*']){const R=REG[w];if(!R)continue;if(key&&R['skill:'+key])return R['skill:'+key];if(cat&&R['cat:'+cat])return R['cat:'+cat];}
 return null;}
let SKR=null;
function skKey(sk){if(!SKR||!SKR.has(sk)){SKR=new Map();try{for(const k in SK)SKR.set(SK[k],k);}catch(e){}try{for(const k in EA)SKR.set(EA[k],'ea:'+k);}catch(e){}}return SKR.get(sk)||null;}
/* キーポーズの列を再生する（hitN：何撃目か。keys が関数なら (u,hitN) → 配列） */
async function play(u,def,hitN=1){const keys=typeof def.keys==='function'?def.keys(u,hitN):def.keys||[];
 for(const k of keys){if(k.move)ANIM.move(u,k.move[0],k.move[1],k.ms,k.ease||'out',k.hop||0);await ANIM.to(u,k.pose||{},k.ms||100,k.ease||'out');if(k.wait)await ANIM.T(k.wait);}}
/* 一覧（開発・図鑑用） */
function list(who){return Object.assign({},REG['*'],REG[who]);}
return{CATALOG,ZUKAN,VIEWS,add,remove,custom,play,list,skKey,REG};})();
