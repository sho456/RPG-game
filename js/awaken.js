/* ===== ver0.11 星臨の深化 ===== */
const ROMAN=['','Ⅰ','Ⅱ','Ⅲ'];
Object.assign(SK,{
 gokurio:{n:'星灯一閃',el:'陽',k:'phys',pow:3,t:'all',d:'星臨Ⅲ：光の大斬撃・敵全体'},gokugald:{n:'金城鉄壁',k:'barrier',long:1,t:'self',d:'星臨Ⅲ：味方の被ダメ-30%が長く続く'},
 gokumire:{n:'星界の双極',k:'mag',el:null,pow:3,t:'all',gauge:50,d:'星臨Ⅲ：全体の大魔法（ゲージ50）'},gokushion:{n:'夢幻影縫い',el:'突',k:'phys',pow:1.6,t:'all',delay:60,d:'星臨Ⅲ：全体攻撃＋大きく遅らせる'},
 gokunoah:{n:'天上の聖歌',k:'reviveAll',t:'self',d:'星臨Ⅲ：倒れた仲間を全員復活し、HP40%回復'},gokuerna:{n:'流星穿',el:'突',k:'phys',pow:2.4,t:'all',gauge:40,delay:45,d:'星臨Ⅲ：全体射撃＋行動を遅らせる（ゲージ40）'},
 gokubalza:{n:'炉心臨界',el:'熱',k:'phys',pow:2,t:'all',d:'星臨Ⅲ：炎の全体大技（熱で威力上昇）'},gokucrow:{n:'冥界の門',el:'陰',k:'mag',pow:2.8,t:'all',hpCost:.15,d:'星臨Ⅲ：HP15%を払う闇の全体大魔法'},
 gokuhakua:{n:'氷華千本',el:'冷',k:'phys',pow:.45,hits:8,t:'one',d:'星臨Ⅲ：氷の8連撃'},gokujin:{n:'百獣の王',el:'打',k:'phys',pow:2.4,t:'all',auto:['斬','打'],d:'星臨Ⅲ：弱点を突く全体攻撃'}});

EA.mirror={n:'幻影の一撃',el:null,k:'phys',pow:2.2,t:'all'};

