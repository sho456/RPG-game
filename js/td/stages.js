/* ===== TD のステージと章（TDD.STAGE・TDD.CH・TDD.ORDER の正本）。書式は docs/TD-DESIGN.md 6 章・スキル td-stage-author =====
 戦場は横に長い 1 本の帯（論理の高さ 420、幅 W）。敵は左から入り、右端の灯（拠点）を目指す。画面は横にスクロールする。
 本編の 8 章を TD 用に 6 章へまとめる（P2 は序章〜第 2 章の 13 ステージ）。会話と加入は本編のクエスト（QD）から引く */
'use strict';
(()=>{
const GY=300;/* 灯の足元の高さ */
/* 道：lanes は道の高さの列。どの道も最後は灯へ斜めに合流する */
function lanePath(W,y){return[[-30,y],[W-150,y],[W-70,GY]];}
/* 地図を作る：f＝[道の番号, x]（道の上の台座）・b＝[x, y]（道の外の台座） */
function map(W,lanes,f,b,r){return{W,base:[W-46,GY],light:{r:r||Math.round(W*.33)},paths:lanes.map(y=>lanePath(W,y)),
 pads:[...f.map(([l,x],i)=>({id:'f'+(i+1),k:'f',lane:l,x})),...b.map(([x,y],i)=>({id:'b'+(i+1),k:'b',x,y}))]};}
/* 1 本道（高さ 300）と 2 本道（262・338）の型 */
const ONE=W=>map(W,[GY],[[0,W*.42],[0,W*.58],[0,W*.72],[0,W*.84]],[[W*.3,244],[W*.48,244],[W*.64,244],[W*.78,244],[W*.42,356],[W*.6,356],[W*.76,356],[W*.88,356]]);
const TWO=W=>map(W,[262,338],[[0,W*.4],[0,W*.62],[0,W*.8],[1,W*.45],[1,W*.66],[1,W*.82]],
 [[W*.34,214],[W*.56,214],[W*.74,214],[W*.3,300],[W*.5,300],[W*.68,300],[W*.86,300],[W*.4,384],[W*.6,384],[W*.78,384]]);
const q=id=>{try{for(const c of QD.CH)for(const x of c.qs)if(x.id===id)return x;}catch(e){}return null;};
const pre=id=>{const x=q(id);return x&&x.pre?x.pre:null;};
const post=who=>{try{return QD.POST[who].lines;}catch(e){return null;}};
/* ステージ：e＝[出る秒, 敵, 数, 間隔, 道（省略で交互）] */
const S=(id,o,M)=>Object.assign({id,cap:6,cost0:10,star:{time:240}},M,o);
const L={
 /* ---------- 序章 灰の街道 ---------- */
 td0_1:S('td0_1',{star:{time:145},hk:2.0,q:'q0_1',name:'灰色の街道',lv:1,th:'ash',cap:4,cost0:14,pre:pre('q0_1'),tut:1,
  waves:[{e:[[2,'slime',4,2.4]]},{e:[[1,'slime',6,1.8]]},{e:[[1,'slime',5,1.6],[6,'wolf',4,1.8]]}]},ONE(860)),
 td0_2:S('td0_2',{star:{time:130},hk:1.84,q:'q0_2',name:'灰狼の遠吠え',lv:2,th:'ash',cap:4,join:'shion',
  join_lines:[[null,'n','狼の群れが散ったあと、物陰から少年が顔を出した。'],['shion','h','へえ、やるじゃん。灯守ってのは口だけじゃないんだな'],['shion','n','俺はシオン。街の孤児の面倒を見てる。……虚蝕を追うなら、足の速い奴がいた方がいいだろ？']],
  waves:[{e:[[2,'wolf',5,1.6]]},{e:[[1,'slime',6,1.3],[5,'wolf',5,1.3]]},{e:[[1,'wolf',8,1.1],[4,'slime',6,1.2]]}]},ONE(920)),
 td0_3:S('td0_3',{star:{time:145},hk:1.28,q:'q0_4',name:'灰狼の頭目',lv:4,th:'ash',cap:5,pre:pre('q0_4'),
  waves:[{e:[[2,'slime',4,1.8],[7,'wolf',3,1.4]]},{e:[[1,'wolf',6,1.1],[4,'slime',5,1.3]]},{e:[[2,'m_wolf',1,1,0],[4,'slime',5,1.3],[8,'wolf',6,1.1]]}]},ONE(1000)),
 td0_4:S('td0_4',{star:{time:155},hk:0.74,q:'q0_5',name:'虚ろの番人',lv:5,th:'ash',cap:5,boss:1,pre:pre('q0_5'),
  waves:[{e:[[2,'slime',6,1.4],[6,'wolf',4,1.3]]},{e:[[1,'wolf',8,1],[3,'slime',6,1.2]]},{e:[[2,'boss',1,1,1],[5,'wolf',6,1.2],[10,'slime',6,1.2]]}]},TWO(1040)),
 /* ---------- 第1章 翠の森・沈黙の図書遺跡 ---------- */
 td1_1:S('td1_1',{star:{time:160},hk:2.12,q:'q1_1',name:'翠の森へ',lv:6,th:'forest',pre:pre('q1_1'),
  waves:[{e:[[2,'moss',5,1.6]]},{e:[[1,'jadewolf',5,1.2],[5,'moss',5,1.4]]},{e:[[1,'jadewolf',7,1],[4,'moss',6,1.2]]}]},TWO(1040)),
 td1_2:S('td1_2',{star:{time:185},hk:1.26,q:'q1_3',name:'図書遺跡の少女',lv:7,th:'forest',join:'mire',join_lines:post('mire'),
  waves:[{e:[[2,'shroom',5,1.5]]},{e:[[1,'bookghost',5,1.6],[5,'shroom',4,1.5]]},{e:[[1,'bookghost',6,1.2],[4,'moss',6,1.2],[9,'jadewolf',4,1.2]]}]},TWO(1060)),
 td1_3:S('td1_3',{star:{time:140},hk:0.77,bk:0.7,q:'q1_4',name:'翠狼の主',lv:8,th:'forest',
  waves:[{e:[[2,'jadewolf',6,1.1]]},{e:[[1,'moss',6,1.2],[4,'shroom',5,1.3]]},{e:[[2,'m_jade',1,1,0],[4,'jadewolf',8,.9],[10,'moss',5,1.2]]}]},TWO(1080)),
 td1_4:S('td1_4',{star:{time:150},hk:2.05,q:'q1_5',name:'月夜の小道',lv:9,th:'forest',join:'jin',join_lines:post('jin'),
  waves:[{e:[[2,'moss',6,1.2],[5,'jadewolf',4,1]]},{e:[[1,'shroom',6,1.1],[3,'bookghost',5,1.3]]},{e:[[1,'jadewolf',8,.8],[4,'moss',6,1],[8,'bookghost',5,1.1]]}]},TWO(1080)),
 td1_5:S('td1_5',{star:{time:150},hk:0.56,bk:0.5,q:'q1_7',name:'禁書の守護像',lv:10,th:'forest',boss:1,pre:pre('q1_7'),
  waves:[{e:[[2,'bookghost',6,1.2],[5,'shroom',5,1.2]]},{e:[[1,'jadewolf',8,.9],[4,'moss',6,1.1]]},{e:[[2,'boss2',1,1,1],[4,'bookghost',8,1.1],[9,'jadewolf',6,1]]}]},TWO(1120)),
 /* ---------- 第2章 祈りの廃聖堂 ---------- */
 td2_1:S('td2_1',{star:{time:150},hk:1.59,q:'q2_1',name:'祈りの絶えた道',lv:11,th:'chapel',
  waves:[{e:[[2,'cursedslime',6,1.4]]},{e:[[1,'darkknight',4,1.8],[4,'cursedslime',5,1.3]]},{e:[[1,'darkknight',6,1.3],[4,'cursedslime',6,1.1]]}]},TWO(1080)),
 td2_2:S('td2_2',{star:{time:160},hk:1.94,q:'q2_3',name:'眠れる人形',lv:13,th:'chapel',join:'noah',join_lines:post('noah'),
  waves:[{e:[[2,'shade',6,1.2]]},{e:[[1,'darkknight',5,1.5],[4,'shade',5,1.2]]},{e:[[1,'shade',8,.9],[4,'cursedslime',6,1.1],[9,'darkknight',4,1.4]]}]},TWO(1100)),
 td2_3:S('td2_3',{star:{time:150},hk:0.75,bk:0.25,q:'q2_4',name:'聖堂騎士長',lv:14,th:'chapel',
  waves:[{e:[[2,'darkknight',5,1.4],[6,'shade',4,1.1]]},{e:[[1,'cursedslime',8,1],[4,'shade',6,1]]},{e:[[2,'m_knight',1,1,0],[4,'darkknight',6,1.2],[9,'shade',6,1]]}]},TWO(1120)),
 td2_4:S('td2_4',{star:{time:200},hk:1.0,bk:0.22,q:'q2_6',name:'虚ろの司祭',lv:16,th:'chapel',boss:1,pre:pre('q2_6'),
  waves:[{e:[[2,'shade',8,1],[5,'cursedslime',6,1.1]]},{e:[[1,'darkknight',7,1.1],[4,'shade',7,.9]]},{e:[[1,'darkknight',6,1.2],[5,'cursedslime',8,.9]]},{e:[[2,'boss3',1,1,1],[4,'shade',8,1],[9,'darkknight',6,1.2]]}]},TWO(1160))};
/* 章（本編の 8 章を 6 章に。P2 は 3 章） */
const CH=[
 {id:'c0',ch:'序章',n:'灰の街道',th:'ash',st:['td0_1','td0_2','td0_3','td0_4'],intro:'虚蝕に色を奪われた古い街道。灯都ルミナスを出て、最初の灯を守る。'},
 {id:'c1',ch:'第1章',n:'翠の森・沈黙の図書遺跡',th:'forest',st:['td1_1','td1_2','td1_3','td1_4','td1_5'],intro:'まだ色の残る森と、星片の記録が眠る図書遺跡。'},
 {id:'c2',ch:'第2章',n:'祈りの廃聖堂',th:'chapel',st:['td2_1','td2_2','td2_3','td2_4'],intro:'祈りの声が途絶えた聖堂。奥で星片の人形が眠っている。'},
 {id:'c3',ch:'第3章',n:'雷鳴と氷華',th:'storm',st:[],soon:1,intro:'雷鳴高原・黒鉄鉱山・東方の島（本編の第3・4章をまとめる）'},
 {id:'c4',ch:'第4章',n:'沈んだ王都と天への塔',th:'ruin',st:[],soon:1,intro:'本編の第5・6章をまとめる'},
 {id:'c5',ch:'終章',n:'星核の残響',th:'void',st:[],soon:1,intro:''}];
Object.assign(TDD.STAGE,L);TDD.CH.push(...CH);TDD.ORDER.push(...CH.flatMap(c=>c.st));
/* その時点で仲間になっている顔ぶれ（計測用）：最初はリオとガルド。join はクリア後に加わる */
TDD.rosterAt=id=>{const r=['rio','gald'];for(const s of TDD.ORDER){if(s===id)break;const j=L[s]&&L[s].join;if(j)r.push(j);}return r;};
})();
