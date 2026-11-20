/* ===== アイテムアイコン ===== */
const IIS={
sword:["..........mM",".........mM.","........mM..",".......mM...","......mM....",".....mM.....","..y.mM......","...yM.......","...by.......","..b..y......",".b.........."],
gsword:[".........mmM","........mmM.",".......mmM..","......mmM...",".....mmM....","....mmM.....",".yy.mM......","..yyM.......","..bby.......",".bb..y......","bb.........."],
dual:["m.........m.",".m.......m..","..m.....m...","...m...m....","....m.m.....",".....M......","....m.m.....","...y...y....","..b.....b...",".b.......b.."],
tome:["",".rrrrrrrr...",".rRRRRRRrw..",".rRyyyyRrw..",".rRyRRyRrw..",".rRyyyyRrw..",".rRRRRRRrw..",".rRRRRRRrw..",".rrrrrrrrw..","..wwwwwwww.."],
staff:["....yuy.....","...yuuuy....","....yuy.....",".....b......",".....b......",".....b......",".....b......",".....b......",".....b......",".....b......",".....b......"],
bow:["...b........","..b.w.......",".b...w......",".b....w.....","b.....w.....","b...mmmmM...","b.....w.....",".b....w.....",".b...w......","..b.w.......","...b........"],
axe:[".....MmmM...","....MmmmmM..","....MmmmmmM.","....bMmmmM..","....b.MM....","....b.......","....b.......","....b.......","....b.......","...bbb......"],
scythe:[".MMMMMMm....","M......Mm...","........Mb..",".........b..","........b...","........b...",".......b....",".......b....","......b.....","......b.....",".....b......"],
shield:["","..MMMMMMMM..","..MmmmmmmM..","..MmmyymmM..","..MmyyyymM..","..MmmyymmM..","...MmmmmM...","....MmmM....",".....MM....."],
charm:[".....yy.....","....y..y....",".....yy.....","....uuuu....","...uuwwuu...","...uwuuwu...","...uuwwuu...","....uuuu....",".....uu....."],
helm:["","....MMMM....","...MmmmmM...","..MmmmmmmM..","..MmmmmmmM..","..MMMMMMMM..","..Mm.ee.mM..","..Mm....mM..","..MM....MM.."],
circ:["","","","..MMMMMMMM..",".MmmmuummmM.",".MMMMMMMMMM."],
armor:["","..MM....MM..",".MmmMMMMmmM.",".MmmmmmmmmM.",".MmmmyymmmM.","..MmmmmmmM..","..MmmmmmmM..","..MmmmmmmM..","..MMMMMMMM.."],
ring:["","",".....uu.....","....uwwu....",".....uu.....","....yyyy....","...y....y...","...y....y...","...y....y...","....yyyy...."],
neck:["..y......y..","..y......y..","...y....y...","....y..y....",".....yy.....","....uuuu....","....uwwu....","....uuuu....",".....uu....."],
drop:["",".....u......",".....u......","....uuu.....","...uuwuu....","...uwuuu....","..uuuuuuu...","..uuuuuuu...","...uuuuu....","....uuu....."],
feather:["..........o.",".........ox.","........oxo.",".......oxo..","......oxo...",".....oxo....","....oxo.....","...oxo......","..yo........",".y.........."],
haiseki:["","","....gggg....","...gGgggg...","..gggggGgg..","..ggGgggggG.","..Gggggggg..","...GGGGGG..."],
kiba:["","..www.......","...wwww.....","....wwww....",".....wwww...","......wwq...",".......wq...","........q..."],
kakera:[".....p......","....pvp.....","....pvv.....","...pvvvp....","...pvVvv....","..pvvVvvp...","...vvVvv....","....vvv.....",".....v......"]};
const TIER={'銅':{m:'#e0a070',M:'#9a5a30'},'鉄':{m:'#c8d0dc',M:'#7a8494'},'鋼':{m:'#eef4ff',M:'#8aa0c8'},'星鋼':{m:'#fff0a0',M:'#c0a040'}};
const IIC={};
function iicon(k,tier){const key=k+(tier||'');if(IIC[key])return IIC[key];const c=document.createElement('canvas');c.width=c.height=12;const g=c.getContext('2d'),ov=TIER[tier]||{};
 (IIS[k]||ICS.shop).forEach((r,y)=>{r=(r||'').padEnd(12,'.');for(let x=0;x<12;x++){const ch=r[x];if(ch!=='.'){g.fillStyle=ov[ch]||PAL[ch]||'#f0f';g.fillRect(x,y,1,1);}}});return IIC[key]=c.toDataURL();}
const ITYPE=[['大剣','gsword'],['双剣','dual'],['魔導書','tome'],['大鎌','scythe'],['剣','sword'],['杖','staff'],['弓','bow'],['斧','axe'],['小盾','shield'],['護符','charm'],['兜','helm'],['額当て','circ'],['鎧','armor'],['指輪','ring'],['首飾り','neck'],['後篝','neck'],['刃','sword']];
function itemIcon(it){const t=(ITYPE.find(([w])=>it.name.includes(w))||[0,it.slot==='acc'?'ring':'armor'])[1];return iicon(t,it.rar===4||it.set?'星鋼':MATL(it.ilv));}
ICON.potion=iicon('potion');ICON.drop=iicon('drop');ICON.feather=iicon('feather');ICON.haiseki=iicon('haiseki');ICON.kiba=iicon('kiba');ICON.kakera=iicon('kakera');
IIS.potion=ICS.shop;IIC.potion=ICON.shop;ICON.potion=ICON.shop;
const ii=(src,c)=>`<img class="ii" src="${src}" style="border-color:${c||'#4a5490'}">`;

/* ===== 第3章データ ===== */
Object.assign(SPR,{
crow:["......VVVV......",".....VVVVVV.....","....VVVVVVVV....","....VssVVVVV....","....VesVVVVV....",".....ssVVVV.....","MMMM..VvvvV.....","M..q.VvvvvvV....","...q.VvvxvvV....","...qsVvvvvvV....","...q.VvvvvvV....","...q.VvvvvvvV...","...q.VvvvvvvV...","...qVVvvvvvvVV..","...q..VV..VV....","......VV..VV...."],
erna:["................",".....yyyyy......","....yyyyyyy.....","...yyssyyyyy....","...yesyyyyyy....","...sssyyyyy.....","..M..ssccyy.....",".M...cCcccC.....","M...scCcwcC.....","M....cCcccC.....",".M...CbbbbC.....","..M..cCcccC.....",".....CccccC.....",".....bb..bb.....",".....bb..bb.....","....bbb..bbb...."],
balza:["................","................",".....AAAAA......","....AaaaaaA.....","....asesaaA.....","....dsssddd.....","...ddddddddd....","..MMddddddddd...",".MmMrrrrrrrrr...",".MMMrrrrrrrrr...","...brrrrrrrrrs..","...b.rRRRRRr....","...b.rrrrrrr....","...b.rrr.rrr....","....bbbb.bbbb...","................"]});
AWP.crow={v:'#9a2a4a',V:'#4a0a1a',x:'#ff4060'};AWP.erna={y:'#fff8c0',c:'#40c0ff',C:'#2060a0'};AWP.balza={r:'#ff8030',R:'#ffd040',d:'#ffb060'};
for(const k of['crow','erna','balza']){IMG[k]=mk(SPR[k]);IMG[k+'_w']=mk(SPR[k],null,'#ffffff');IMG[k+'_aw']=mk(SPR[k],AWP[k]);}
for(const[k,b,pal]of[['raiwolf','wolf',{g:'#d8c040',G:'#7a6a20',w:'#fff8c0',x:'#40c0ff'}],['ironslime','slime',{v:'#7a8494',V:'#3a4250',p:'#c8d0dc'}],['golemkin','golem',{a:'#8a6a4a',A:'#4a3a2a'}],
 ['minerghost','gald',{a:'#6a5a4a',A:'#3a3028',r:'#8a6a2a',R:'#4a3a10',s:'#9a8a7a',d:'#3a3028',y:'#c0a060',e:'#ffb030'}],['golemboss','golem',{a:'#3a3a44',A:'#1a1a22',o:'#ff6020',y:'#ff9040',u:'#ff6020'}],
 ['boss4','crow',{V:'#1a1028',v:'#3a1a48',x:'#ff2040',e:'#ff2040'}],['boss4b','crow',{V:'#101820',v:'#2a3a48',x:'#40ffff',e:'#40ffff'}],['ernaE','erna',{}]]){SPR[k]=SPR[b];IMG[k]=mk(SPR[b],pal);IMG[k+'_w']=mk(SPR[b],null,'#ffffff');}
Object.assign(EA,{arrow:{n:'狙撃',el:'突',k:'phys',pow:1.3,t:'one'},rain:{n:'五月雨射ち',el:'突',k:'phys',pow:.7,t:'all'},senju:{n:'千呪',el:'陰',k:'mag',pow:2.6,t:'all'},
 meltdown:{n:'溶鉄の奔流',el:'熱',k:'mag',pow:2.4,t:'all'},bolt:{n:'雷撃',el:'雷',k:'mag',pow:1.2,t:'one'}});
Object.assign(ED,{
 raiwolf:{name:'雷狼',mhp:160,atk:58,def:16,mag:30,res:12,spd:15,weak:['打','冷'],xp:24,gold:16,drop:[['kiba',.45]],acts:[['claw',.5],['bite',.3],['bolt',.2]]},
 ironslime:{name:'鉄スライム',mhp:170,atk:50,def:30,mag:20,res:14,spd:7,weak:['雷','打'],xp:22,gold:18,drop:[['haiseki',.5]],acts:[['claw',.6],['press',.4]]},
 golemkin:{name:'鉱石ゴーレム',mhp:260,atk:60,def:28,mag:10,res:12,spd:6,weak:['雷','打'],xp:28,gold:20,drop:[['haiseki',.5],['kakera',.1]],acts:[['slam',1]],sc:2},
 minerghost:{name:'坑道の亡者',mhp:210,atk:62,def:18,mag:30,res:14,spd:10,weak:['陽','熱'],xp:26,gold:18,drop:[['kakera',.2]],acts:[['claw',.6],['curse',.4]],flip:1},
 golemboss:{name:'黒鉄の巨像',mhp:5600,atk:330,def:66,mag:220,res:40,spd:15,weak:['雷','冷'],sc:3,boss:true,xp:1500,gold:1500,drop:[['kakera',1],['kakera',1],['haiseki',1]],ai:{every:3,charge:'meltdown',acts:[['slam',.7],['claw',.3]],summon:'golemkin',sumLv:20},ilv:20},
 boss4:{name:'虚蝕のクロウ',mhp:8000,atk:190,def:58,mag:250,res:58,spd:13,weak:['陽','雷'],sc:3,boss:true,xp:2200,gold:2500,drop:[['kakera',1],['kakera',1],['kakera',1],['kakera',1]],ai:{every:3,charge:'senju',acts:[['curse',.4],['wave2',.3],['claw',.3]],summon:'minerghost',sumLv:22},ilv:23,flip:1},
 ernaE:{name:'弓手エルナ',mhp:4200,atk:200,def:48,mag:80,res:48,spd:17,weak:['打','冷'],xp:900,gold:0,drop:[],acts:[['arrow',.65],['rain',.35]],flip:1,sc:2}});
ED.boss4b=Object.assign({},ED.boss4,{name:'虚蝕の残影'});ED.ernaE.solo=1;
HB.erna={name:'エルナ',mhp:210,atk:38,def:18,mag:22,res:18,spd:14,g:{mhp:'C',atk:'A',def:'C',mag:'B',res:'C',spd:'A'},skills:['raiya','nerai','samidare']};
HB.balza={name:'バルザ',mhp:300,atk:44,def:30,mag:8,res:18,spd:7,g:{mhp:'A',atk:'S',def:'A',mag:'D',res:'C',spd:'D'},skills:['tekkai','netsuda','shuuri']};
HB.crow={name:'クロウ',mhp:220,atk:30,def:16,mag:42,res:20,spd:11,g:{mhp:'B',atk:'B',def:'C',mag:'S',res:'D',spd:'B'},skills:['noroi','yaminami','kyuumei']};
Object.assign(SK,{
 raiya:{n:'雷矢',sp:15,el:'雷',k:'phys',pow:1.4,t:'one',d:'雷属性の射撃'},nerai:{n:'狙い撃ち',sp:25,el:'突',k:'phys',pow:1.9,t:'one',d:'急所を狙う強射'},samidare:{n:'五月雨射ち',sp:30,el:'突',k:'phys',pow:.8,t:'all',d:'突・敵全体'},
 kantsuu:{n:'貫通射',sp:30,el:'突',k:'phys',pow:2.3,t:'one',d:'突・単体の大技'},jinrai:{n:'迅雷',sp:35,el:'雷',k:'phys',pow:1,t:'all',d:'雷・敵全体'},
 raisen:{n:'雷閃',el:'雷',k:'phys',pow:1.5,t:'one',gauge:20,d:'雷の必殺射（ゲージ20）'},juuten:{n:'充填',k:'charge',t:'self',gauge:10,d:'次の手番で天穿を撃てる（ゲージ10）'},
 tenkuu:{n:'天穿',el:'突',k:'phys',pow:4.4,t:'one',gauge:40,req:'charged',delay:60,d:'充填後に解禁・大打撃＋行動を大きく遅らせる（ゲージ40）'},
 tekkai:{n:'鉄塊落とし',sp:20,el:'打',k:'phys',pow:1.6,t:'one',d:'打撃・単体'},netsuda:{n:'熱打',sp:20,el:'熱',k:'phys',pow:1.4,t:'one',d:'熱属性の打撃'},shuuri:{n:'応急修理',sp:20,k:'guardRegen',t:'self',d:'防御し、HP15%回復'},
 daichi:{n:'大地割り',sp:35,el:'打',k:'phys',pow:1,t:'all',d:'地・敵全体'},gouen:{n:'業炎撃',sp:35,el:'熱',k:'phys',pow:2.2,t:'one',d:'炎・単体の大技'},
 tanda:{n:'鍛打',el:'打',k:'phys',pow:1.4,t:'one',d:'打撃（熱で威力上昇）'},yakiire:{n:'焼入れ',el:'熱',k:'phys',pow:1.1,t:'all',d:'炎・敵全体'},youtetsu:{n:'溶鉄爆砕',k:'release2',t:'all',d:'星臨解除・熱を全体へ（溜めすぎると反動）'},
 noroi:{n:'呪い',sp:15,el:'陰',k:'mag',pow:1.4,t:'one',d:'闇の魔法・単体'},yaminami:{n:'闇の波動',sp:30,el:'陰',k:'mag',pow:.9,t:'all',d:'闇・敵全体'},kyuumei:{n:'吸命',sp:25,el:'陰',k:'mag',pow:1.1,t:'one',drain:.5,d:'与えたダメージの半分を回復'},
 shisen:{n:'死の宣告',sp:35,el:'陰',k:'mag',pow:2.4,t:'one',d:'闇・単体の大技'},yamisaki:{n:'闇裂き',sp:35,el:'陰',k:'mag',pow:1.2,t:'all',d:'闇・敵全体'},
 judan:{n:'呪弾',el:'陰',k:'mag',pow:1.6,t:'one',hpCost:.08,d:'HP8%を払う闇弾'},hanten:{n:'呪詛反転',el:'陰',k:'mag',pow:1,t:'all',delay:30,hpCost:.1,d:'HP10%を払い全体攻撃＋遅延'},
 shikyou:{n:'死経',k:'pct',t:'all',req:'lowhp',d:'HP25%以下で解禁・敵の現在HPを大きく削る'}});
AW.erna={name:'天穿つ眼',type:'ゲージ消費',turns:99,cmds:['raisen','juuten','tenkuu']};
AW.balza={name:'炉心解放',type:'蓄積型',turns:5,cmds:['tanda','yakiire','youtetsu']};
AW.crow={name:'千の呪言',type:'代償型',turns:3,cmds:['judan','hanten','shikyou']};
const AWD={rio:'3回の行動の間、全能力+20%。ガルドの星臨後は大技を模倣できる',gald:'味方への攻撃を全て受け止め被ダメ軽減。受けた分を蓄積し「城壁崩し」で放出',mire:'1手番に2回行動。炎と氷を交互に撃つと対消滅が溜まり、3段階で大魔法',
 shion:'敵全体の行動を遅らせ、3回連続で行動。強奪でレア装備を奪う',noah:'聖域を展開。味方が毎ターン回復し、倒れても1度だけ耐える',erna:'全攻撃が会心に。充填後の「天穿」で敵の行動を大きく遅らせる',
 balza:'行動ごとに攻撃+15%。溶鉄爆砕で放つが、溜めすぎると反動',crow:'技をHPで払う。HPが低いほど威力上昇。HP25%以下で「死経」解禁'};
const mkB=(star,sec,mask,s1,s2,f)=>({star,sec,mask,sp:{'2,-2':{t:'skill',v:s1},'-2,2':{t:'skill',v:s2},'0,-3':{t:'aw',v:{awTurn:1},d:'星臨の持続+1'},'3,-3':{t:'aw',v:{noRecoil:1},d:'星臨の反動を無効'},
 '3,0':{t:'fork',g:1,v:f[0][0],d:f[0][1]},'0,3':{t:'fork',g:1,v:f[1][0],d:f[1][1]},'-3,0':{t:'fork',g:2,v:f[2][0],d:f[2][1]},'-3,3':{t:'fork',g:2,v:f[3][0],d:f[3][1]}}});
BDEF.erna=mkB('天弓座',[['atkP'],['crit'],['spd'],['weakDmg'],['mhpP'],['defP']],['3,-2','-1,-2','-3,1','1,2'],'kantsuu','jinrai',[[{atkP:12},'剛弓：攻撃+12%'],[{crit:10},'鷹目：会心率+10%'],[{weakDmg:20},'射抜：弱点ダメ+20%'],[{spd:2},'疾風：素早さ+2']]);
BDEF.balza=mkB('炉心座',[['atkP'],['defP'],['mhpP'],['resP'],['crit'],['spGain']],['2,-3','-2,-1','-3,2','2,1'],'daichi','gouen',[[{atkP:12},'剛腕：攻撃+12%'],[{defP:15},'鉄肌：防御+15%'],[{awDmg:20},'灼熱：星臨中与ダメ+20%'],[{mhpP:15},'頑健：最大HP+15%']]);
BDEF.crow=mkB('冥府座',[['magP'],['mhpP'],['spd'],['resP'],['awDmg'],['crit']],['3,-1','-1,-2','-2,3','1,2'],'shisen','yamisaki',[[{magP:12},'冥魔：魔力+12%'],[{mhpP:15},'不死：最大HP+15%'],[{awDmg:20},'怨嗟：星臨中与ダメ+20%'],[{weakDmg:20},'呪眼：弱点ダメ+20%']]);
['erna','balza','crow'].forEach(k=>BOARD[k]=buildBoard(k));

const MAP4=["YYYYYYYYYYYYYYYYYYYY","YrrrrrrYYrrBrrYYrrrY","YrrCrrrYYrrrrrYYrrrY","YrrrrrrrrrrrrrrrrrrY","YYYYrrYYYYYYYYrrYYYY","YrrrrrrrrYYrrrrrrrrY","YrlllllrrYYrrrrrrVrY","YrrrrrlrrrrrrrrrrrrY","YYYrrrlrrYYrrrrrrCrY","YrrrrrlrrYYrrYYYYYYY","YrrrrrrrrrrrrrrrrrrY","YYYYYYYYrrrYYYYYYYYY","TT..R..Y,,,Y..R...TT","T.......,,,.......TT","T..R...,,,...C....TT","TT....,,,.....RR..TT","T....,,,...........T","T...,,,.....T..E...T","TT..,,......TT.....T","T....,,,...........T","T..R...,,,....R...TT","TT......,,,.......TT","T...G....,,,....G..T","T.........,,,......T","TT..RR.....,,,....TT","T...........,,,...TT","T..C........,,,....T","TT.........,,,....TT","TTT.......,,,....TTT","TTTT.....,,,....TTTT","TTTTTT...,S,..TTTTTT","TTTTTTTTTTTTTTTTTTTT"].map(r=>r.padEnd(20,'T').slice(0,20));
AREAS.raimei={name:'雷鳴高原・黒鉄鉱山',map:MAP4,lv:[17,23],groups:[['raiwolf'],['raiwolf','raiwolf'],['ironslime','raiwolf'],['ironslime','ironslime','raiwolf']],
 libGroups:[['golemkin'],['minerghost','ironslime'],['golemkin','minerghost'],['minerghost','minerghost']],crew:[{gold:2000},{loot:[20,2]},{item:'feather',n:2},{loot:[21,3]}],boss:{kind:'boss4',lv:23},bflag:'boss4',theme:'storm',rec:'推奨Lv17〜23',
 bossKind:()=>G.flags.crowChoice?'boss4b':'boss4',intro:'<b>第3章　雷鳴高原</b>――雷が絶えず落ちる高原。<b>光った場所には落雷</b>する。北の黒鉄鉱山の奥に、虚蝕の呪術師がいるという。'};
const Q3=[{id:'q6',n:'雷鳴の主',d:'虚蝕のクロウを倒す',ok:()=>!!G.flags.boss4,pg:()=>G.flags.boss4?'達成':'未達成',rw:'4000G・不死鳥の羽×2',give:()=>{G.gold+=4000;addItem('feather',2);}}];

/* ===== ステータス画面 ===== */

function openSheet(){}/* 未使用：js/ver17.js が置き換え */
function fitField(){}/* 未使用：js/v23.js が置き換え */
