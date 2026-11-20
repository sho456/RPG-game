/* ===== 戦闘表示（ver0.10） ===== */

/* 未使用：js/ver17.js が置き換え */

/* 未使用：js/v24.js が置き換え */

/* ===== 第5章：沈んだ王都 ===== */
const SETS={royal:{n:'王家の遺品',b2:{mhpP:10,defP:10},b4:{awDmg:25,startAG:20},d2:'最大HP+10%・防御+10%',d4:'星臨中与ダメ+25%・開始時AG+20'}};
const ROYAL={head:'王家の冠',body:'王家の鎧',sub:'王家の盾',acc:'王家の指輪'};ITYPE.unshift(['冠','circ'],['盾','shield']);
function royalItem(){}/* 未使用：js/v31/items.js が置き換え */

for(const[k,b,pal]of[['drowned','gald',{a:'#3a6a6a',A:'#1a3a3a',r:'#2a5a7a',R:'#103040',s:'#7a9a9a',d:'#1a3a3a',y:'#6ac0c0',e:'#40ffff'}],['jelly','shroom',{r:'#e070c0',R:'#8a3070',w:'#c0e0ff',e:'#203060'}],
 ['waterslime','slime',{v:'#3a8ad0',V:'#1a4a7a',p:'#8ad0ff'}],['boss6','noah',{w:'#2a4a7a',k:'#a0d0ff',y:'#40e0ff',s:'#a0b8d0',q:'#1a2a4a',e:'#40ffff'}]]){SPR[k]=SPR[b];IMG[k]=mk(SPR[b],pal);IMG[k+'_w']=mk(SPR[b],null,'#ffffff');}
Object.assign(EA,{deluge:{n:'大海嘯',el:'冷',k:'mag',pow:2.5,t:'all'},tide:{n:'潮の刃',el:'冷',k:'mag',pow:1.2,t:'one'}});
Object.assign(ED,{
 drowned:{name:'溺れた近衛',mhp:260,atk:80,def:30,mag:20,res:18,spd:11,weak:['雷','陽'],xp:40,gold:30,drop:[['kiba',.3],['kakera',.2]],acts:[['slash2',.6],['claw',.4]],flip:1},
 jelly:{name:'大海月',mhp:200,atk:40,def:18,mag:84,res:16,spd:12,weak:['雷','斬'],xp:38,gold:28,drop:[['kakera',.3]],acts:[['tide',.6],['spore',.4]]},
 waterslime:{name:'水精スライム',mhp:210,atk:66,def:26,mag:60,res:22,spd:9,weak:['雷','打'],xp:36,gold:26,drop:[['haiseki',.5]],acts:[['claw',.5],['tide',.5]]},
 boss6:{name:'沈みし女王',mhp:14000,atk:300,def:80,mag:340,res:80,spd:16,weak:['雷','陽'],sc:3,boss:true,xp:5200,gold:6000,drop:[['kakera',1],['kakera',1],['kakera',1],['kakera',1],['kakera',1]],
  ai:{every:3,charge:'deluge',acts:[['curse',.35],['tide',.35],['icewave',.3]],summon:'drowned',sumLv:36},ilv:37,flip:1}});
const MAP6=["####################","#ooooooo#oBo#ooooCo#","#ooooooo#ooo#oooooo#","#oooCooo##o##oooooo#","#oooooooooooooooooo#","#wwwwww#wwwwww#wwww#","#wwwwww#wwwwww#wwww#","#ooooooooooooooooLo#","#oo~~~oooooooo~~~oo#","#oo~~~oo####oo~~~oo#","#oooooooo#Go#oooooo#","#ooooCooo#oo#oooooo#","#oooooooooooooooooo#","#~~~~~~~~xx~~~~~~~~#","#~~~~~~~~xx~~~~~~~~#","#ooooooooooooooooCo#","#oLoooooooooooooooo#","#oooooo##oo##oooooo#","#######oooooo#######","TTTTTT#oooooo#TTTTTT","TTTTTT#ooSooo#TTTTTT","TTTTTTTTTTTTTTTTTTTT"].map(r=>r.padEnd(20,'T').slice(0,20));
AREAS.ouito={name:'沈んだ王都',map:MAP6,lv:[31,37],groups:[['waterslime'],['waterslime','jelly'],['drowned'],['jelly','jelly'],['drowned','waterslime'],['drowned','jelly','waterslime']],
 crew:[{royal:'head'},{gold:8000},{royal:'acc'},{loot:[36,3]}],boss:{kind:'boss6',lv:37},bflag:'boss6',theme:'ruin',rec:'推奨Lv31〜37',
 intro:'<b>第5章　沈んだ王都</b>――1000年前、星核を砕いた王の都。<b>レバーで水位が変わる</b>。水位が高いと橋が浮かび、低いと水路が歩ける。'};
const Q5=[{id:'q8',n:'王都の女王',d:'沈みし女王を倒す',ok:()=>!!G.flags.boss6,pg:()=>G.flags.boss6?'達成':'未達成',rw:'15000G・不死鳥の尾×2',give:()=>{G.gold+=15000;addItem('tail',2);}}];
/* ===== ジン ===== */
Object.assign(PAL,{});
SPR.jin=["................",".....dddd.......","....dddddd......","....dssdddd.....","....desdddd.....","....sssddd......",".....ssjjj......","...M.jjjjjj.....","..MM.jJjjjJs....","...M.jJjjjJ.....",".....bbbbbb.....",".....jjJjjj.....",".oo..jj..jj.....","oooo.bb..bb.....","owoo.bb..bb.....",".o.o.bbb.bbb...."];
IMG.jin=mk(SPR.jin,{j:'#6a8a4a',J:'#3a5a2a'});IMG.jin_w=mk(SPR.jin,null,'#ffffff');IMG.jin_aw=mk(SPR.jin,{j:'#d08030',J:'#8a4a10',d:'#ffb040',o:'#ffe040'});
HB.jin={name:'ジン',mhp:280,atk:40,def:26,mag:30,res:24,spd:13,g:{mhp:'A',atk:'B',def:'B',mag:'B',res:'B',spd:'B'},skills:['tsume','popo','kazekiri']};
Object.assign(SK,{tsume:{n:'爪撃',sp:15,el:'斬',k:'phys',pow:1.3,t:'one',d:'斬撃・単体'},popo:{n:'ポポ突進',sp:20,el:'打',k:'phys',pow:1.5,t:'one',d:'相棒の体当たり'},kazekiri:{n:'風切り',sp:30,el:'斬',k:'phys',pow:.9,t:'all',d:'風・敵全体'},
 goga:{n:'剛牙',sp:35,el:'斬',k:'phys',pow:2.2,t:'one',d:'斬撃・単体の大技'},tatsumaki:{n:'竜巻',sp:35,el:'斬',k:'phys',pow:1.1,t:'all',d:'風・敵全体'},
 juuou:{n:'獣王撃',el:'打',k:'phys',pow:1.8,t:'one',auto:['斬','打'],d:'敵の弱点に合わせて地か風に変わる'},shippuuga:{n:'疾風牙',el:'斬',k:'phys',pow:1,t:'all',d:'風・敵全体'},
 houkou:{n:'咆哮',k:'roar',t:'all',d:'敵全体の行動を遅らせ、味方のAG+15'}});
AW.jin={name:'獣魂合一',type:'ターン制',turns:4,cmds:['juuou','shippuuga','houkou']};AWD.jin='相棒ポポと合体。攻撃と素早さ+30%、獣王撃は敵の弱点に合わせて属性が変わる';
BDEF.jin=mkB('獣王座',[['atkP'],['mhpP'],['spd'],['defP'],['crit'],['resP']],['3,-2','-2,-1','-2,3','2,1'],'goga','tatsumaki',[[{atkP:12},'猛獣：攻撃+12%'],[{mhpP:15},'巨躯：最大HP+15%'],[{awDmg:20},'野生：星臨中与ダメ+20%'],[{spd:2},'俊足：素早さ+2']]);
BOARD.jin=buildBoard('jin');IIS.claw=["","..m...m...m.","..m...m...m.","..mm..mm..mm","...mM..mM..M","....MMMMMMM.","....MbbbbbM.",".....bbbbb..",".....bbbbb.."];ITYPE.unshift(['爪','claw']);

MAP2[19]=MAP2[19].slice(0,18)+'n'+MAP2[19].slice(19);MAP2[20]=MAP2[20].slice(0,17)+'TJ'+MAP2[20].slice(19);
AREAS.midori.intro+='<br><small>夜になると、月明かりの小道が現れるらしい……</small>';
