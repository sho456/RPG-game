/* ===== ver0.19（前処理）=====
 ver0.18 が戦闘関数を包む前の関数と、16×16ドット絵の配色情報を控えておく。
 ver0.19 の戦闘演出は、ver0.18 の「モーション連動」層を置き換える形で、ここで控えた関数の上に組み立てる
 （ver0.18 側の待ち時間と二重にならないようにするため） */
const V17F={hit,doAction,enemyTurn,pop,kill,awaken,end};
DOT.snapAll();
{const _te=trialEnemy;trialEnemy=function(id,tier){const k=_te(id,tier);DOT.snap(k);return k;};}
{const _vk=voidKind;voidKind=function(k){const vk=_vk(k);DOT.snap(vk);return vk;};}
{const _kb=kBoss;kBoss=function(f){const k=_kb(f);DOT.snap(k);return k;};}
