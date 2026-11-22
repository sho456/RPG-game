/* ===== TD のステージと章（TDD.STAGE・TDD.CH・TDD.ORDER の正本）。書式は docs/TD-DESIGN.md 6 章・スキル td-stage-author =====
 戦場は横に長い 1 本の帯（論理の高さ 420、幅 W）。敵は左から入り、右端の灯（拠点）を目指す。画面は横にスクロールする。
 本編の 8 章を TD 用に 6 章へまとめる（P2 は序章〜第 2 章の 13 ステージ）。会話と加入は本編のクエスト（QD）から引く */
'use strict';
(()=>{
const GY=300;/* 灯の足元の高さ */
/* 道：lanes は道の高さの列。どの道も最後は灯へ斜めに合流する */
function lanePath(W,y){return[[-30,y],[W-150,y],[W-70,GY]];}
/* 地図を作る：道の高さの列 lanes と灯の光の半径 r（既定は幅の 33%）。台座は無い（ver0.55：仲間は置いた場所の近くの道で、役割の隊形を組む） */
function map(W,lanes,r){return{W,base:[W-46,GY],light:{r:r||Math.round(W*.33)},paths:lanes.map(y=>lanePath(W,y))};}
/* 1 本道（高さ 300）・2 本道（262・338）・3 本道（244・300・356）の型 */
const ONE=W=>map(W,[GY]);
const TWO=W=>map(W,[262,338]);
const THREE=W=>map(W,[244,300,356]);
const q=id=>{try{for(const c of QD.CH)for(const x of c.qs)if(x.id===id)return x;}catch(e){}return null;};
const pre=id=>{const x=q(id);return x&&x.pre?x.pre:null;};
const post=who=>{try{return QD.POST[who].lines;}catch(e){return null;}};
/* ステージ：e＝[出る秒, 敵, 数, 間隔, 道（省略で交互）] */
const S=(id,o,M)=>Object.assign({id,cap:6,cost0:10,star:{time:240}},M,o);
const L={
 /* ---------- 序章 灰の街道 ---------- */
 td0_1:S('td0_1',{hk:2.0,star:{time:145},q:'q0_1',name:'灰色の街道',lv:1,th:'ash',cap:4,cost0:14,pre:pre('q0_1'),tut:1,
  waves:[{e:[[2,'slime',4,2.4]]},{e:[[1,'slime',6,1.8]]},{e:[[1,'slime',5,1.6],[6,'wolf',4,1.8]]}]},ONE(860)),
 td0_2:S('td0_2',{hk:1.28,star:{time:130},q:'q0_2',name:'灰狼の遠吠え',lv:2,th:'ash',cap:4,join:'shion',
  join_lines:[[null,'n','狼の群れが散ったあと、物陰から少年が顔を出した。'],['shion','h','へえ、やるじゃん。灯守ってのは口だけじゃないんだな'],['shion','n','俺はシオン。街の孤児の面倒を見てる。……虚蝕を追うなら、足の速い奴がいた方がいいだろ？']],
  waves:[{e:[[2,'wolf',5,1.6]]},{e:[[1,'slime',6,1.3],[5,'wolf',5,1.3]]},{e:[[1,'wolf',8,1.1],[4,'slime',6,1.2]]}]},ONE(920)),
 td0_3:S('td0_3',{hk:1.8,bk:0.8,star:{time:155},q:'q0_4',name:'灰狼の頭目',lv:3,th:'ash',cap:5,pre:pre('q0_4'),
  waves:[{e:[[2,'slime',4,1.8],[7,'wolf',3,1.4]]},{e:[[1,'wolf',6,1.1],[4,'slime',5,1.3]]},{e:[[2,'m_wolf',1,1,0],[4,'slime',5,1.3],[8,'wolf',6,1.1]]}]},ONE(1000)),
 td0_4:S('td0_4',{hk:0.85,bk:0.36,star:{time:155},q:'q0_5',name:'虚ろの番人',lv:4,th:'ash',cap:5,boss:1,pre:pre('q0_5'),
  waves:[{e:[[2,'slime',6,1.4],[6,'wolf',4,1.3]]},{e:[[1,'wolf',8,1],[3,'slime',6,1.2]]},{e:[[2,'boss',1,1,1],[5,'wolf',6,1.2],[10,'slime',6,1.2]]}]},TWO(1040)),
 /* ---------- 第1章 翠の森・沈黙の図書遺跡 ---------- */
 td1_1:S('td1_1',{hk:2.12,star:{time:165},q:'q1_1',name:'翠の森へ',lv:6,th:'forest',pre:pre('q1_1'),
  waves:[{e:[[2,'moss',5,1.6]]},{e:[[1,'jadewolf',5,1.2],[5,'moss',5,1.4]]},{e:[[1,'jadewolf',7,1],[4,'moss',6,1.2]]}]},TWO(1040)),
 td1_2:S('td1_2',{hk:1.26,star:{time:195},q:'q1_3',name:'図書遺跡の少女',lv:7,th:'forest',join:'mire',join_lines:post('mire'),
  waves:[{e:[[2,'shroom',5,1.5]]},{e:[[1,'bookghost',5,1.6],[5,'shroom',4,1.5]]},{e:[[1,'bookghost',6,1.2],[4,'moss',6,1.2],[9,'jadewolf',4,1.2]]}]},TWO(1060)),
 td1_3:S('td1_3',{hk:0.77,bk:1.51,star:{time:150},q:'q1_4',name:'翠狼の主',lv:8,th:'forest',
  waves:[{e:[[2,'jadewolf',6,1.1]]},{e:[[1,'moss',6,1.2],[4,'shroom',5,1.3]]},{e:[[2,'m_jade',1,1,0],[4,'jadewolf',8,.9],[10,'moss',5,1.2]]}]},TWO(1080)),
 td1_4:S('td1_4',{hk:1.71,star:{time:150},q:'q1_5',name:'月夜の小道',lv:9,th:'forest',join:'jin',join_lines:post('jin'),
  waves:[{e:[[2,'moss',6,1.2],[5,'jadewolf',4,1]]},{e:[[1,'shroom',6,1.1],[3,'bookghost',5,1.3]]},{e:[[1,'jadewolf',8,.8],[4,'moss',6,1],[8,'bookghost',5,1.1]]}]},TWO(1080)),
 td1_5:S('td1_5',{gim:{k:'drain',every:12},hk:0.89,bk:0.67,star:{time:155},q:'q1_7',name:'禁書の守護像',lv:10,th:'forest',boss:1,pre:pre('q1_7'),
  waves:[{e:[[2,'bookghost',6,1.2],[5,'shroom',5,1.2]]},{e:[[1,'jadewolf',8,.9],[4,'moss',6,1.1]]},{e:[[2,'boss2',1,1,1],[4,'bookghost',8,1.1],[9,'jadewolf',6,1]]}]},TWO(1120)),
 /* ---------- 第2章 祈りの廃聖堂 ---------- */
 td2_1:S('td2_1',{hk:1.59,star:{time:150},q:'q2_1',name:'祈りの絶えた道',lv:11,th:'chapel',
  waves:[{e:[[2,'cursedslime',6,1.4]]},{e:[[1,'darkknight',4,1.8],[4,'cursedslime',5,1.3]]},{e:[[1,'darkknight',6,1.3],[4,'cursedslime',6,1.1]]}]},TWO(1080)),
 td2_2:S('td2_2',{hk:1.94,star:{time:160},q:'q2_3',name:'眠れる人形',lv:13,th:'chapel',join:'noah',join_lines:post('noah'),
  waves:[{e:[[2,'shade',6,1.2]]},{e:[[1,'darkknight',5,1.5],[4,'shade',5,1.2]]},{e:[[1,'shade',8,.9],[4,'cursedslime',6,1.1],[9,'darkknight',4,1.4]]}]},TWO(1100)),
 td2_3:S('td2_3',{hk:0.83,bk:0.41,star:{time:155},q:'q2_4',name:'聖堂騎士長',lv:14,th:'chapel',
  waves:[{e:[[2,'darkknight',5,1.4],[6,'shade',4,1.1]]},{e:[[1,'cursedslime',8,1],[4,'shade',6,1]]},{e:[[2,'m_knight',1,1,0],[4,'darkknight',6,1.2],[9,'shade',6,1]]}]},TWO(1120)),
 td2_4:S('td2_4',{gim:{k:'charge',every:12},hk:0.6,bk:0.4,star:{time:190},q:'q2_6',name:'虚ろの司祭',lv:16,th:'chapel',boss:1,pre:pre('q2_6'),
  waves:[{e:[[2,'shade',8,1],[5,'cursedslime',6,1.1]]},{e:[[1,'darkknight',7,1.1],[4,'shade',7,.9]]},{e:[[1,'darkknight',6,1.2],[5,'cursedslime',8,.9]]},{e:[[2,'boss3',1,1,1],[4,'shade',8,1],[9,'darkknight',6,1.2]]}]},TWO(1160)),
 /* ---------- 第3章 雷鳴と氷華（本編の第3・4章） ---------- */
 td3_1:S('td3_1',{hk:1.86,star:{time:165},q:'q3_1',name:'雷の高原',lv:17,th:'storm',
  waves:[{e:[[2,'raiwolf',7,1.1]]},{e:[[1,'ironslime',6,1.4],[4,'raiwolf',6,1]]},{e:[[1,'raiwolf',9,.8],[3,'ironslime',7,1.1]]}]},TWO(1100)),
 td3_2:S('td3_2',{hk:1.01,bk:0.41,star:{time:140},q:'q3_2',name:'崩れた塔の射手',lv:18,th:'storm',boss:1,pre:pre('q3_2'),join:'erna',join_lines:post('erna'),gim:{k:'shift',every:9},
  waves:[{e:[[2,'raiwolf',8,1]]},{e:[[1,'ironslime',7,1.2],[4,'raiwolf',7,.9]]},{e:[[2,'ernaE',1,1,0],[4,'raiwolf',8,1]]}]},TWO(1120)),
 td3_3:S('td3_3',{hk:1,bk:0.46,star:{time:165},q:'q3_4',name:'炉を守れ',lv:21,th:'storm',boss:1,pre:pre('q3_4'),join:'balza',join_lines:post('balza'),gim:{k:'charge',every:11},
  waves:[{e:[[2,'golemkin',5,1.6],[5,'minerghost',5,1.2]]},{e:[[1,'ironslime',7,1.1],[4,'minerghost',7,1]]},{e:[[2,'golemboss',1,1,1],[4,'golemkin',6,1.4],[8,'minerghost',7,1]]}]},TWO(1140)),
 td3_4:S('td3_4',{hk:0.8,bk:0.22,star:{time:140},q:'q3_6',name:'虚蝕の呪術師',lv:23,th:'storm',boss:1,pre:pre('q3_6'),join:'crow',gim:{k:'drain',every:10},
  join_lines:[[null,'n','黒い羽根が落ちきると、男は膝をついていた。'],['crow','n','……虚蝕に家族を喰われた。だから虚蝕を喰らう術を覚えた。それだけだ'],['crow','h','灯守か。皮肉なもんだな。……いいだろう、その灯が消えるまで付き合ってやる']],
  waves:[{e:[[2,'minerghost',8,1]]},{e:[[1,'darkknight',7,1.2],[4,'minerghost',7,.9]]},{e:[[2,'boss4',1,1,0],[4,'darkknight',6,1.2],[8,'minerghost',8,.9]]}]},TWO(1160)),
 td3_5:S('td3_5',{hk:1.45,star:{time:145},q:'q4_3',name:'社の巫女',lv:26,th:'ice',join:'hakua',join_lines:post('hakua'),
  waves:[{e:[[2,'snowwolf',8,1]]},{e:[[1,'yukirei',8,1],[4,'iceslime',6,1.2]]},{e:[[1,'onimusha',6,1.3],[4,'snowwolf',8,.8],[9,'yukirei',6,1]]}]},THREE(1160)),
 td3_6:S('td3_6',{hk:0.5,bk:0.27,star:{time:130},q:'q4_6',name:'氷華の妖狐',lv:30,th:'ice',boss:1,pre:pre('q4_6'),gim:{k:'shift',every:8},
  waves:[{e:[[2,'yukirei',9,.9],[5,'snowwolf',6,1]]},{e:[[1,'onimusha',7,1.1],[4,'iceslime',8,1]]},{e:[[2,'boss5',1,1,1],[4,'yukirei',9,.9],[9,'onimusha',6,1.2]]}]},THREE(1180)),
 /* ---------- 第4章 沈んだ王都と天への塔（本編の第5・6章） ---------- */
 td4_1:S('td4_1',{hk:1.65,star:{time:160},q:'q5_1',name:'水底の大通り',lv:31,th:'ruin',
  waves:[{e:[[2,'waterslime',8,1.1]]},{e:[[1,'jelly',9,.9],[4,'waterslime',6,1.2]]},{e:[[1,'waterslime',9,.9],[3,'jelly',9,.8]]}]},THREE(1160)),
 td4_2:S('td4_2',{hk:0.6,bk:0.5,star:{time:155},q:'q5_4',name:'近衛隊長',lv:34,th:'ruin',boss:1,gim:{k:'charge',every:11},
  waves:[{e:[[2,'drowned',7,1.2]]},{e:[[1,'jelly',9,.9],[4,'drowned',6,1.1]]},{e:[[2,'m_guard',1,1,1],[4,'drowned',7,1.1],[9,'waterslime',8,1]]}]},THREE(1180)),
 td4_3:S('td4_3',{hk:0.21,bk:0.15,star:{time:115},q:'q5_6',name:'沈みし女王',lv:37,th:'ruin',boss:1,pre:pre('q5_6'),gim:{k:'drain',every:9},
  waves:[{e:[[2,'drowned',8,1],[5,'jelly',7,.9]]},{e:[[1,'waterslime',10,.8],[4,'drowned',7,1]]},{e:[[2,'boss6',1,1,1],[4,'jelly',10,.8],[9,'drowned',7,1]]}]},THREE(1200)),
 td4_4:S('td4_4',{hk:0.49,bk:0.33,star:{time:155},q:'q6_2',name:'塔の番兵',lv:42,th:'tower',boss:1,join:'celes',join_lines:post('celes'),gim:{k:'charge',every:10},
  waves:[{e:[[2,'minerghost',8,1],[5,'jelly',8,.9]]},{e:[[1,'yukirei',10,.8],[4,'drowned',7,1]]},{e:[[2,'tower10',1,1,1],[4,'golemkin',7,1.2],[9,'minerghost',8,.9]]}]},THREE(1200)),
 td4_5:S('td4_5',{hk:0.35,bk:0.205,star:{time:125},q:'q6_4',name:'天狐の残照',lv:46,th:'tower',boss:1,join:'valk',join_lines:post('valk'),gim:{k:'shift',every:8},
  waves:[{e:[[2,'snowwolf',10,.8],[5,'iceslime',8,1]]},{e:[[1,'onimusha',8,1],[4,'jelly',9,.8]]},{e:[[2,'tower20',1,1,1],[4,'yukirei',10,.8],[9,'onimusha',7,1]]}]},THREE(1220)),
 td4_6:S('td4_6',{hk:0.31,bk:0.27,star:{time:180},q:'q6_6',name:'星核の守護者',lv:50,th:'tower',boss:1,pre:pre('q6_6'),gim:{k:'charge',every:9},
  waves:[{e:[[2,'shade',10,.8],[5,'onimusha',7,1]]},{e:[[1,'minerghost',10,.8],[4,'waterslime',8,1]]},{e:[[1,'darkknight',9,.9],[4,'shade',10,.7]]},{e:[[2,'boss7',1,1,1],[4,'shade',10,.8],[9,'onimusha',7,1]]}]},THREE(1240)),
 /* ---------- 終章 星核の残響 ---------- */
 td5_1:S('td5_1',{hk:1.37,star:{time:175},q:'q7_1',name:'虚の底',lv:50,th:'void',
  waves:[{e:[[2,'darkknight',9,1]]},{e:[[1,'shade',10,.8],[4,'golemkin',6,1.3]]},{e:[[1,'darkknight',9,.9],[3,'shade',10,.7],[8,'golemkin',6,1.2]]}]},THREE(1220)),
 td5_2:S('td5_2',{hk:0.5,bk:0.25,star:{time:130},q:'q7_4',name:'残響の番兵',lv:53,th:'void',boss:1,gim:{k:'drain',every:9},
  waves:[{e:[[2,'onimusha',8,1],[5,'yukirei',9,.8]]},{e:[[1,'golemkin',7,1.2],[4,'shade',10,.7]]},{e:[[2,'m_echo',1,1,1],[4,'darkknight',9,.9],[9,'shade',10,.7]]}]},THREE(1240)),
 td5_3:S('td5_3',{hk:0.6,bk:0.09,star:{time:200},q:'q7_5',name:'星核の扉',lv:55,th:'void',boss:1,pre:pre('q7_5'),fin:1,gim:{k:'charge',every:12},
  waves:[{e:[[2,'darkknight',8,1],[6,'shade',9,.8]]},{e:[[2,'last1',1,1,1],[4,'shade',10,.7]]},{e:[[2,'last2',1,1,0],[4,'onimusha',8,.9]]},{e:[[2,'last3',1,1,2],[4,'shade',12,.6],[9,'darkknight',8,.9]]}]},THREE(1260))
};
/* ---------- 天への塔（やり込み・全章クリア後）：WAVE は sim.js の infWave が毎回作る。到達の最高は G.td.inf ---------- */
const INF={td_inf:S('td_inf',{inf:1,name:'天への塔',lv:50,th:'tower',cap:8,cost0:20,hk:.22,bk:.1,star:{time:9999},waves:[],
 pool:['shade','darkknight','onimusha','yukirei','golemkin','minerghost','jelly','drowned','snowwolf','raiwolf','waterslime'],
 bosses:['tower10','boss5','m_guard','tower20','m_echo','boss7']},THREE(1240))};
/* 章（本編の 8 章を 6 章に） */
const CH=[
 {id:'c0',ch:'序章',n:'灰の街道',th:'ash',st:['td0_1','td0_2','td0_3','td0_4'],intro:'虚蝕に色を奪われた古い街道。灯都ルミナスを出て、最初の灯を守る。'},
 {id:'c1',ch:'第1章',n:'翠の森・沈黙の図書遺跡',th:'forest',st:['td1_1','td1_2','td1_3','td1_4','td1_5'],intro:'まだ色の残る森と、星片の記録が眠る図書遺跡。'},
 {id:'c2',ch:'第2章',n:'祈りの廃聖堂',th:'chapel',st:['td2_1','td2_2','td2_3','td2_4'],intro:'祈りの声が途絶えた聖堂。奥で星片の人形が眠っている。'},
 {id:'c3',ch:'第3章',n:'雷鳴と氷華',th:'storm',st:['td3_1','td3_2','td3_3','td3_4','td3_5','td3_6'],intro:'雷鳴高原・黒鉄鉱山・東方の島'},
 {id:'c4',ch:'第4章',n:'沈んだ王都と天への塔',th:'ruin',st:['td4_1','td4_2','td4_3','td4_4','td4_5','td4_6'],intro:'沈んだ王都と天への塔'},
 {id:'c5',ch:'終章',n:'星核の残響',th:'void',st:['td5_1','td5_2','td5_3'],intro:'星核の残響'}];
Object.assign(TDD.STAGE,L,INF);TDD.INF='td_inf';TDD.CH.push(...CH);TDD.ORDER.push(...CH.flatMap(c=>c.st));
/* その時点で仲間になっている顔ぶれ（計測用）：最初はリオとガルド。join はクリア後に加わる */
TDD.rosterAt=id=>{const r=['rio','gald'];for(const s of TDD.ORDER){if(s===id)break;const j=L[s]&&L[s].join;if(j)r.push(j);}return r;};
})();
