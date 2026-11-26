/* ===== 章とステージ（TDD.STAGE・TDD.CH・TDD.ORDER の正本）。ver0.60 からコマンド戦闘のステージ（マップなし） =====
 1 ステージ＝ name・lv（推奨）・th（背景の章の型）・waves・会話（pre・join・join_lines）。ID の td〜 はセーブの互換のため残す。
 ver0.60 で TD 専用の項目（戦場の幅・道・灯・配置の上限・コスト・星の時間・HP の補正・仕掛け・出現の秒と間隔）を削除 */
'use strict';
(()=>{
const q=id=>{try{for(const c of QD.CH)for(const x of c.qs)if(x.id===id)return x;}catch(e){}return null;};
const pre=id=>{const x=q(id);return x&&x.pre?x.pre:null;};
const post=who=>{try{return QD.POST[who].lines;}catch(e){return null;}};
/* ステージ：e＝[出る秒, 敵, 数, 間隔, 道（省略で交互）] */
const S=(id,o,M)=>Object.assign({id,star:{time:240}},M,o);
const L={
 /* ---------- 序章 灰の街道 ---------- */
 td0_1:S('td0_1',{q:'q0_1',name:'灰色の街道',lv:1,th:'ash',pre:pre('q0_1'),
  waves:[{e:[['slime',4]]},{e:[['slime',6]]},{e:[['slime',5],['wolf',4]]}]}),
 td0_2:S('td0_2',{q:'q0_2',name:'灰狼の遠吠え',lv:2,th:'ash',join:'shion',
  join_lines:[[null,'n','狼の群れが散ったあと、物陰から少年が顔を出した。'],['shion','h','へえ、やるじゃん。灯守ってのは口だけじゃないんだな'],['shion','n','俺はシオン。街の孤児の面倒を見てる。……虚蝕を追うなら、足の速い奴がいた方がいいだろ？']],
  waves:[{e:[['wolf',5]]},{e:[['slime',6],['wolf',5]]},{e:[['wolf',8],['slime',6]]}]}),
 td0_3:S('td0_3',{q:'q0_4',name:'灰狼の頭目',lv:3,th:'ash',pre:pre('q0_4'),
  waves:[{e:[['slime',4],['wolf',3]]},{e:[['wolf',6],['slime',5]]},{e:[['m_wolf',1],['slime',5],['wolf',6]]}]}),
 td0_4:S('td0_4',{q:'q0_5',name:'虚ろの番人',lv:4,th:'ash',boss:1,pre:pre('q0_5'),
  waves:[{e:[['slime',6],['wolf',4]]},{e:[['wolf',8],['slime',6]]},{e:[['boss',1],['wolf',6],['slime',6]]}]}),
 /* ---------- 第1章 翠の森・沈黙の図書遺跡 ---------- */
 td1_1:S('td1_1',{q:'q1_1',name:'翠の森へ',lv:6,th:'forest',pre:pre('q1_1'),
  waves:[{e:[['moss',5]]},{e:[['jadewolf',5],['moss',5]]},{e:[['jadewolf',7],['moss',6]]}]}),
 td1_2:S('td1_2',{q:'q1_3',name:'図書遺跡の少女',lv:7,th:'forest',join:'mire',join_lines:post('mire'),
  waves:[{e:[['shroom',5]]},{e:[['bookghost',5],['shroom',4]]},{e:[['bookghost',6],['moss',6],['jadewolf',4]]}]}),
 td1_3:S('td1_3',{q:'q1_4',name:'翠狼の主',lv:8,th:'forest',
  waves:[{e:[['jadewolf',6]]},{e:[['moss',6],['shroom',5]]},{e:[['m_jade',1],['jadewolf',8],['moss',5]]}]}),
 td1_4:S('td1_4',{q:'q1_5',name:'月夜の小道',lv:9,th:'forest',join:'jin',join_lines:post('jin'),
  waves:[{e:[['moss',6],['jadewolf',4]]},{e:[['shroom',6],['bookghost',5]]},{e:[['jadewolf',8],['moss',6],['bookghost',5]]}]}),
 td1_5:S('td1_5',{q:'q1_7',name:'禁書の守護像',lv:10,th:'forest',boss:1,pre:pre('q1_7'),
  waves:[{e:[['bookghost',6],['shroom',5]]},{e:[['jadewolf',8],['moss',6]]},{e:[['boss2',1],['bookghost',8],['jadewolf',6]]}]}),
 /* ---------- 第2章 祈りの廃聖堂 ---------- */
 td2_1:S('td2_1',{q:'q2_1',name:'祈りの絶えた道',lv:11,th:'chapel',
  waves:[{e:[['cursedslime',6]]},{e:[['darkknight',4],['cursedslime',5]]},{e:[['darkknight',6],['cursedslime',6]]}]}),
 td2_2:S('td2_2',{q:'q2_3',name:'眠れる人形',lv:13,th:'chapel',join:'noah',join_lines:post('noah'),
  waves:[{e:[['shade',6]]},{e:[['darkknight',5],['shade',5]]},{e:[['shade',8],['cursedslime',6],['darkknight',4]]}]}),
 td2_3:S('td2_3',{q:'q2_4',name:'聖堂騎士長',lv:14,th:'chapel',
  waves:[{e:[['darkknight',5],['shade',4]]},{e:[['cursedslime',8],['shade',6]]},{e:[['m_knight',1],['darkknight',6],['shade',6]]}]}),
 td2_4:S('td2_4',{q:'q2_6',name:'虚ろの司祭',lv:16,th:'chapel',boss:1,pre:pre('q2_6'),
  waves:[{e:[['shade',8],['cursedslime',6]]},{e:[['darkknight',7],['shade',7]]},{e:[['darkknight',6],['cursedslime',8]]},{e:[['boss3',1],['shade',8],['darkknight',6]]}]}),
 /* ---------- 第3章 雷鳴と氷華（本編の第3・4章） ---------- */
 td3_1:S('td3_1',{q:'q3_1',name:'雷の高原',lv:17,th:'storm',
  waves:[{e:[['raiwolf',7]]},{e:[['ironslime',6],['raiwolf',6]]},{e:[['raiwolf',9],['ironslime',7]]}]}),
 td3_2:S('td3_2',{q:'q3_2',name:'崩れた塔の射手',lv:18,th:'storm',boss:1,pre:pre('q3_2'),join:'erna',join_lines:post('erna'),
  waves:[{e:[['raiwolf',8]]},{e:[['ironslime',7],['raiwolf',7]]},{e:[['ernaE',1],['raiwolf',8]]}]}),
 td3_3:S('td3_3',{q:'q3_4',name:'炉を守れ',lv:21,th:'storm',boss:1,pre:pre('q3_4'),join:'balza',join_lines:post('balza'),
  waves:[{e:[['golemkin',5],['minerghost',5]]},{e:[['ironslime',7],['minerghost',7]]},{e:[['golemboss',1],['golemkin',6],['minerghost',7]]}]}),
 td3_4:S('td3_4',{q:'q3_6',name:'虚蝕の呪術師',lv:23,th:'storm',boss:1,pre:pre('q3_6'),join:'crow',
  join_lines:[[null,'n','黒い羽根が落ちきると、男は膝をついていた。'],['crow','n','……虚蝕に家族を喰われた。だから虚蝕を喰らう術を覚えた。それだけだ'],['crow','h','灯守か。皮肉なもんだな。……いいだろう、その灯が消えるまで付き合ってやる']],
  waves:[{e:[['minerghost',8]]},{e:[['darkknight',7],['minerghost',7]]},{e:[['boss4',1],['darkknight',6],['minerghost',8]]}]}),
 td3_5:S('td3_5',{q:'q4_3',name:'社の巫女',lv:26,th:'ice',join:'hakua',join_lines:post('hakua'),
  waves:[{e:[['snowwolf',8]]},{e:[['yukirei',8],['iceslime',6]]},{e:[['onimusha',6],['snowwolf',8],['yukirei',6]]}]}),
 td3_6:S('td3_6',{q:'q4_6',name:'氷華の妖狐',lv:30,th:'ice',boss:1,pre:pre('q4_6'),
  waves:[{e:[['yukirei',9],['snowwolf',6]]},{e:[['onimusha',7],['iceslime',8]]},{e:[['boss5',1],['yukirei',9],['onimusha',6]]}]}),
 /* ---------- 第4章 沈んだ王都と天への塔（本編の第5・6章） ---------- */
 td4_1:S('td4_1',{q:'q5_1',name:'水底の大通り',lv:31,th:'ruin',
  waves:[{e:[['waterslime',8]]},{e:[['jelly',9],['waterslime',6]]},{e:[['waterslime',9],['jelly',9]]}]}),
 td4_2:S('td4_2',{q:'q5_4',name:'近衛隊長',lv:34,th:'ruin',boss:1,
  waves:[{e:[['drowned',7]]},{e:[['jelly',9],['drowned',6]]},{e:[['m_guard',1],['drowned',7],['waterslime',8]]}]}),
 td4_3:S('td4_3',{q:'q5_6',name:'沈みし女王',lv:37,th:'ruin',boss:1,pre:pre('q5_6'),
  waves:[{e:[['drowned',8],['jelly',7]]},{e:[['waterslime',10],['drowned',7]]},{e:[['boss6',1],['jelly',10],['drowned',7]]}]}),
 td4_4:S('td4_4',{q:'q6_2',name:'塔の番兵',lv:42,th:'tower',boss:1,join:'celes',join_lines:post('celes'),
  waves:[{e:[['minerghost',8],['jelly',8]]},{e:[['yukirei',10],['drowned',7]]},{e:[['tower10',1],['golemkin',7],['minerghost',8]]}]}),
 td4_5:S('td4_5',{q:'q6_4',name:'天狐の残照',lv:46,th:'tower',boss:1,join:'valk',join_lines:post('valk'),
  waves:[{e:[['snowwolf',10],['iceslime',8]]},{e:[['onimusha',8],['jelly',9]]},{e:[['tower20',1],['yukirei',10],['onimusha',7]]}]}),
 td4_6:S('td4_6',{q:'q6_6',name:'星核の守護者',lv:50,th:'tower',boss:1,pre:pre('q6_6'),
  waves:[{e:[['shade',10],['onimusha',7]]},{e:[['minerghost',10],['waterslime',8]]},{e:[['darkknight',9],['shade',10]]},{e:[['boss7',1],['shade',10],['onimusha',7]]}]}),
 /* ---------- 終章 星核の残響 ---------- */
 td5_1:S('td5_1',{q:'q7_1',name:'虚の底',lv:50,th:'void',
  waves:[{e:[['darkknight',9]]},{e:[['shade',10],['golemkin',6]]},{e:[['darkknight',9],['shade',10],['golemkin',6]]}]}),
 td5_2:S('td5_2',{q:'q7_4',name:'残響の番兵',lv:53,th:'void',boss:1,
  waves:[{e:[['onimusha',8],['yukirei',9]]},{e:[['golemkin',7],['shade',10]]},{e:[['m_echo',1],['darkknight',9],['shade',10]]}]}),
 td5_3:S('td5_3',{q:'q7_5',name:'星核の扉',lv:55,th:'void',boss:1,pre:pre('q7_5'),fin:1,
  waves:[{e:[['darkknight',8],['shade',9]]},{e:[['last1',1],['shade',10]]},{e:[['last2',1],['onimusha',8]]},{e:[['last3',1],['shade',12],['darkknight',8]]}]})
};
/* ---------- 天への塔（やり込み・全章クリア後）：WAVE は js/cb/engine.js の infWave が毎回作る。到達の最高は G.td.inf ---------- */
const INF={td_inf:S('td_inf',{inf:1,name:'天への塔',lv:50,th:'tower',waves:[],
 pool:['shade','darkknight','onimusha','yukirei','golemkin','minerghost','jelly','drowned','snowwolf','raiwolf','waterslime'],
 bosses:['tower10','boss5','m_guard','tower20','m_echo','boss7']})};
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
