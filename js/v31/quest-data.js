/* ===== ver0.31 クエストのデータ（章・クエスト・会話） =====
 章：{id, tab(0本編/1深層/2天極), ch(章の呼び名), n(名前), area(旧エリアID：虚蝕化・王家の遺品などに使う), th(戦闘背景), intro, need()(開く条件), qs:[クエスト]}
 クエスト：Q(id, 名前, 推奨Lv, 戦闘の並び, 追加)
   戦闘の並び：[['slime','wolf'], ['boss']] のように 1 戦闘＝敵の配列。{e:[...], lv, stages:[...], ev:'erna'} でレベル・多段階ボス・決闘を指定
   追加：d(説明) pre(出発前の会話) post(初回クリア後のイベント) first(初回報酬) flag(クリアで立てる旗) th(背景) rep(繰り返し不可なら false) */
'use strict';
const QD=(()=>{
const Q=(id,n,lv,w,o={})=>Object.assign({id,n,lv,w},o);
const T=(sp,ex,t)=>[sp,ex,t];
/* 天への塔：階ごとの魔物（ch6 の makeTowerArea と同じ並び） */
const tw=(f,i)=>{try{return makeTowerArea(f).groups[i%5];}catch(e){return['shade','darkknight'];}};
const CH=[
 /* ===================== 本編 ===================== */
 {id:'c0',tab:0,ch:'序章',n:'灰の街道',area:'haido',th:'ash',intro:'虚蝕に色を奪われた古い街道。灯都ルミナスを出て、最初の一歩を踏み出す。',need:()=>true,qs:[
  Q('q0_1','灰色の街道',1,[['slime']],{d:'灯都を出てすぐの街道。色を失ったスライムが道をふさいでいる。',pre:[T(null,'n','灯都ルミナスの門を出ると、街道は灰色に沈んでいた。'),T('rio','n','……色がない。これが虚蝕か'),T('gald','n','気を抜くなよ、リオ。灯守の初仕事だ')],first:{g:80,it:[['potion',2]]}}),
  Q('q0_2','灰狼の遠吠え',2,[['wolf'],['slime','slime']],{d:'街道沿いに灰狼の群れが出る。2連戦。',first:{g:100,it:[['drop',1]]}}),
  Q('q0_3','色を奪われた丘',3,[['slime','wolf'],['wolf','wolf']],{d:'丘の上の古い道標まで。魔物の数が増えてきた。',first:{loot:[[3,2]]}}),
  Q('q0_4','灰狼の頭目',4,[['wolf','slime'],['m_wolf']],{d:'群れを率いる大きな灰狼。中ボス戦。',pre:[T('gald','n','あの大きいのが群れの頭だな。あいつを倒せば道が開ける')],first:{g:200,it:[['potion',2]]}}),
  Q('q0_5','虚ろの番人',5,[['wolf','slime','slime'],['boss']],{d:'街道の終わりを守る、虚蝕の番人。序章の大ボス。',flag:'boss1',pre:[T(null,'n','街道の果てに、黒い霧をまとった巨体が立っていた。'),T('rio','a','あれが……虚ろの番人！'),T('gald','n','星片が震えてる。リオ、星臨の準備をしておけ')],first:{g:300,it:[['feather',1]],loot:[[5,2]]}})]},
 {id:'c1',tab:0,ch:'第1章',n:'翠の森・沈黙の図書遺跡',area:'midori',th:'forest',intro:'深い森の奥に、星片の記録が眠るという「沈黙の図書遺跡」がある。',need:()=>!!G.flags.boss1,qs:[
  Q('q1_1','翠の森へ',6,[['moss','moss'],['jadewolf']],{d:'深い緑の森。苔むしたスライムと翠狼が棲む。',pre:[T(null,'n','灰の街道を抜けると、まだ色の残る森が広がっていた。'),T('rio','h','緑だ……！ ここはまだ虚蝕が浅いんだな')],first:{g:300}}),
  Q('q1_2','毒茸の群生地',7,[['shroom','moss'],['jadewolf','shroom']],{d:'胞子を撒く毒茸の群れ。毒に注意。',first:{loot:[[8,2]]}}),
  Q('q1_3','図書遺跡の少女',7,[['bookghost'],['bookghost','bookghost']],{d:'遺跡の入口で、魔導書の亡霊に囲まれた少女がいる。',post:'mire',first:{g:200}}),
  Q('q1_4','翠狼の主',8,[['jadewolf','jadewolf'],['m_jade']],{d:'森の翠狼を束ねる大狼。中ボス戦。',first:{g:400,it:[['feather',1]]}}),
  Q('q1_5','月夜の小道',9,[['moss','jadewolf','shroom'],['jadewolf','jadewolf']],{d:'夜にだけ現れる月明かりの小道。誰かが獣を抱えている。',post:'jin',first:{loot:[[9,2]]}}),
  Q('q1_6','禁書の間',9,[['bookghost','moss'],['bookghost','bookghost'],['bookghost','shroom']],{d:'遺跡の奥、亡霊が群れる書庫。3連戦。',first:{loot:[[9,3]]}}),
  Q('q1_7','禁書の守護像',10,[['bookghost','bookghost'],['boss2']],{d:'禁書を守る石の巨像。第1章の大ボス。',flag:'boss2',pre:[T('mire','n','この先に禁書がある。……守護像が目を覚ましたわ'),T('rio','n','行こう。星片の記録を確かめる')],first:{g:600,loot:[[10,3]]}})]},
 {id:'c2',tab:0,ch:'第2章',n:'祈りの廃聖堂',area:'seido',th:'chapel',intro:'祈りの声が途絶えて久しい聖堂。奥で、星片で動く人形が眠っているという。',need:()=>!!G.flags.boss2,qs:[
  Q('q2_1','祈りの絶えた道',11,[['cursedslime','cursedslime'],['darkknight']],{d:'聖堂へ続く参道。呪縛スライムと亡霊騎士。',first:{g:800}}),
  Q('q2_2','亡霊騎士団',12,[['darkknight','shade'],['darkknight','darkknight']],{d:'かつての聖堂騎士たちの亡霊が行く手を阻む。',first:{loot:[[13,2]]}}),
  Q('q2_3','眠れる人形',13,[['shade','cursedslime'],['shade','shade','cursedslime']],{d:'祭壇の脇で、白い人形が眠っている。',post:'noah',first:{it:[['feather',1]]}}),
  Q('q2_4','聖堂騎士長',14,[['darkknight','shade'],['m_knight']],{d:'騎士団を率いた騎士長の亡霊。中ボス戦。',first:{g:1200,loot:[[14,3]]}}),
  Q('q2_5','回廊の影法師',15,[['shade','shade'],['darkknight','shade'],['shade','shade','cursedslime']],{d:'影がうごめく回廊を抜ける。3連戦。',first:{loot:[[15,3]]}}),
  Q('q2_6','虚ろの司祭',16,[['darkknight','shade'],['boss3']],{d:'聖堂を虚蝕に染めた司祭。第2章の大ボス。',flag:'boss3',pre:[T('noah','n','……あの方が、祈りを止めた人。止めましょう'),T('gald','n','鐘の音に気をつけろ。あれは力を溜めている合図だ')],first:{g:1500,it:[['feather',2]]}})]},
 {id:'c3',tab:0,ch:'第3章',n:'雷鳴高原・黒鉄鉱山',area:'raimei',th:'storm',intro:'雷が絶えず落ちる高原。北の黒鉄鉱山の奥に、虚蝕の呪術師がいるという。',need:()=>!!G.flags.boss3,qs:[
  Q('q3_1','雷の高原',17,[['raiwolf'],['raiwolf','raiwolf']],{d:'雷をまとった狼が駆ける高原。',first:{g:2000}}),
  Q('q3_2','崩れた塔の射手',18,[['raiwolf','raiwolf'],{e:['ernaE'],lv:1,ev:'erna'}],{d:'崩れた塔の上から矢が飛んでくる。射手との決闘。',pre:[T(null,'n','崩れた塔の上から矢が飛んできた。'),T('erna','n','虚蝕を追ってるの？ ……口だけなら誰でも言える。私に勝てたら、ついて行ってあげる')],post:'erna',first:{loot:[[19,2]]}}),
  Q('q3_3','黒鉄鉱山',19,[['ironslime','raiwolf'],['golemkin'],['minerghost','ironslime']],{d:'鉄の匂いがする坑道。3連戦。',th:'mine',first:{loot:[[20,2]]}}),
  Q('q3_4','炉を守れ',21,[['golemkin','minerghost'],['golemboss']],{d:'鍛冶師の炉を黒鉄の巨像が襲う。中ボス戦。',th:'mine',pre:[T('balza','a','おい、そこの若いの！ 坑道の奥から黒鉄の巨像が湧いてきやがった。わしの炉を守るのを手伝え！')],post:'balza',first:{g:2500}}),
  Q('q3_5','坑道の亡者',22,[['minerghost','minerghost'],['golemkin','minerghost'],['ironslime','ironslime','raiwolf']],{d:'坑道の最深部へ。3連戦。',th:'mine',first:{loot:[[21,3]]}}),
  Q('q3_6','虚蝕の呪術師',23,[['minerghost','darkknight'],['@crow']],{d:'鉱山の奥に潜む呪術師。第3章の大ボス。',th:'mine',flag:'boss4',post:'crow',pre:[T(null,'n','坑道の最奥。黒い羽根が舞っている。'),T('rio','a','虚蝕の呪術師……あんたが高原を荒らしてるのか')],first:{g:3000,it:[['feather',2]]}})]},
 {id:'c4',tab:0,ch:'第4章',n:'東方の島・氷華の社',area:'kouka',th:'ice',intro:'雪に閉ざされた東方の島。北の氷華の社に、星片を守る巫女がいるという。',need:()=>!!G.flags.boss4,qs:[
  Q('q4_1','雪に閉ざされた島',24,[['snowwolf'],['snowwolf','snowwolf']],{d:'吹雪の島に上陸する。',first:{g:4000}}),
  Q('q4_2','氷原の雪霊',25,[['iceslime','snowwolf'],['yukirei','iceslime']],{d:'凍った湖に雪霊がさまよう。',first:{loot:[[26,2]]}}),
  Q('q4_3','社の巫女',26,[['yukirei','yukirei'],['onimusha']],{d:'氷華の社。元気な巫女が鬼武者に追われている。',th:'shrine',post:'hakua',first:{it:[['feather',1]]}}),
  Q('q4_4','鬼武者の首領',27,[['onimusha','yukirei'],['m_oni']],{d:'鬼武者たちを束ねる首領。中ボス戦。',th:'shrine',first:{g:5000,loot:[[27,3]]}}),
  Q('q4_5','千本鳥居',29,[['onimusha','onimusha'],['yukirei','iceslime'],['iceslime','iceslime','snowwolf']],{d:'社の奥へ続く千本鳥居。3連戦。',th:'shrine',first:{loot:[[28,3]]}}),
  Q('q4_6','氷華の妖狐',30,[['onimusha','yukirei'],['boss5']],{d:'社の主・氷華の妖狐。第4章の大ボス。',th:'shrine',flag:'boss5',pre:[T('hakua','n','あの子……社の主なのに、虚蝕に呑まれてる'),T('rio','n','助けよう。氷ごと砕かないように')],first:{g:6000,it:[['feather',3]]}})]},
 {id:'c5',tab:0,ch:'第5章',n:'沈んだ王都',area:'ouito',th:'ruin',intro:'1000年前、星核を砕いた王の都。水の底に沈んだ街を進む。',need:()=>!!G.flags.boss5,qs:[
  Q('q5_1','水底の大通り',31,[['waterslime'],['waterslime','jelly']],{d:'水に沈んだ大通り。',first:{g:8000}}),
  Q('q5_2','溺れた近衛',32,[['drowned'],['drowned','waterslime']],{d:'王に仕えた近衛兵の亡霊。',first:{loot:[[32,2]]}}),
  Q('q5_3','王家の宝物庫',33,[['jelly','jelly'],['drowned','jelly']],{d:'王家の遺品が眠る宝物庫。',first:{royal:['crown','acc']}}),
  Q('q5_4','近衛隊長',34,[['drowned','drowned'],['m_guard']],{d:'水門を守る近衛隊長。中ボス戦。',first:{g:10000,royal:['sub']}}),
  Q('q5_5','水門の攻防',36,[['drowned','jelly','waterslime'],['jelly','jelly'],['drowned','waterslime']],{d:'水門を開いて玉座の間へ。3連戦。',first:{loot:[[36,3]]}}),
  Q('q5_6','沈みし女王',37,[['drowned','jelly'],['boss6']],{d:'王都を沈めた女王。第5章の大ボス。',flag:'boss6',pre:[T(null,'n','水の玉座に、冠をいただいた女王が座っていた。'),T('mire','n','星核を砕いた王の……娘ね')],first:{g:15000,royal:['main'],it:[['tail',1]]}})]},
 {id:'c6',tab:0,ch:'第6章',n:'天への塔',area:'tower',th:'tower',intro:'星空へ続く白亜の塔。30階層を、5階ずつ登っていく。',need:()=>!!G.flags.boss6,qs:[
  Q('q6_1','1〜5階',38,[tw(2,0),tw(4,1),tw(5,2)],{d:'塔の下層。3連戦。',tw:5,first:{g:5000}}),
  Q('q6_2','6〜10階・塔の番兵',42,[tw(7,0),tw(9,1),['tower10']],{d:'10階の番兵が階段を守る。中ボス戦。',tw:10,first:{loot:[[42,3]]}}),
  Q('q6_3','11〜15階',43,[tw(12,2),tw(14,3),tw(15,4)],{d:'塔の中層。3連戦。',tw:15,first:{g:8000}}),
  Q('q6_4','16〜20階・天狐の残照',46,[tw(17,0),tw(19,1),['tower20']],{d:'20階に残る天狐の残照。中ボス戦。',tw:20,first:{loot:[[46,3]]}}),
  Q('q6_5','21〜25階',47,[tw(22,1),tw(24,3),tw(25,0)],{d:'塔の上層。3連戦。',tw:25,first:{g:12000}}),
  Q('q6_6','26〜30階・星核の守護者',50,[tw(27,2),tw(29,4),['boss7']],{d:'塔の頂で星核を守る者。第6章の大ボス。',tw:30,flag:'boss7',pre:[T('rio','n','この上に、星核がある')],first:{g:30000,it:[['tail',3]]}})]},
 {id:'c7',tab:0,ch:'終章',n:'星核の残響',area:'zankyo',th:'void',intro:'塔の頂から落ちた先は、星々の記憶が漂う虚の底。3つの残響を辿り、星核の扉を開く。',need:()=>!!G.flags.boss7,qs:[
  Q('q7_1','虚の底',50,[['darkknight','shade'],['golemkin','golemkin']],{d:'星々の記憶が漂う虚の底へ。',first:{loot:[[54,3]]}}),
  Q('q7_2','残響Ⅰ',51,[['onimusha','yukirei','shade'],['minerghost','darkknight']],{d:'大灯が初めて灯った夜の記憶。',post:'echo_a',first:{g:15000}}),
  Q('q7_3','残響Ⅱ',52,[['shade','shade','shade'],['darkknight','shade']],{d:'ガルドの声が響く記憶。',post:'echo_b',first:{loot:[[55,3]]}}),
  Q('q7_4','残響Ⅲ・残響の番兵',53,[['golemkin','golemkin'],['onimusha','yukirei','shade'],['m_echo']],{d:'星核そのものの声。最後の残響を守る番兵。中ボス戦。',post:'echo_c',first:{loot:[[55,4]]}}),
  Q('q7_5','星核の扉',55,[['darkknight','shade'],{e:['last1'],lv:55,stages:['last1','last2','last3'],slv:58}],{d:'星核の扉の向こう。3つの形態を持つ最後の敵。終章の大ボス。',flag:'boss8',post:'ending',pre:[T(null,'n','3つの残響が重なり、星核の扉が開いた。'),T('rio','n','みんなの灯を、ここでつなぐ'),T('gald','h','行ってこい、リオ。――いや、一緒に行くぞ')],first:{g:50000,it:[['drop2',5]]}})]},
 /* ===================== 深層（クリア後） ===================== */
 {id:'d1',tab:1,ch:'深層',n:'竜の巣',area:'ryuu',th:'lava',intro:'星核が砕けた夜、竜たちが逃げ込んだ火山の洞。奥で竜人の剣士が強者を待っている。',need:()=>!!G.flags.boss8,qs:[
  Q('d1_1','火山の洞',60,[['firedrake'],['lavaslime','firedrake']],{d:'溶岩が流れる火山の入口。',first:{g:20000}}),
  Q('d1_2','竜兵の詰所',62,[['dragonewt'],['dragonewt','firedrake'],['ember','lavaslime']],{d:'竜兵が守る詰所。3連戦。',first:{loot:[[62,3]]}}),
  Q('d1_3','竜人の決闘',64,[['dragonewt','ember'],{e:['valkE'],lv:1,ev:'valk'}],{d:'大剣を担いだ竜人が待つ。決闘（中ボス戦）。',pre:[T('valk','n','……星核を鎮めた灯守か。噂より小さいな'),T('valk','a','強い灯なら、喰らってみたい。剣を抜け。俺に勝てたら、その旅に付き合ってやる')],post:'valk',first:{it:[['tail',2]]}}),
  Q('d1_4','溶岩の回廊',66,[['dragonewt','ember','firedrake'],['lavaslime','lavaslime'],['dragonewt','firedrake']],{d:'溶岩の回廊を抜けて竜の寝床へ。3連戦。',first:{loot:[[66,3]]}}),
  Q('d1_5','黒炎竜ヴォルガノン',68,[['dragonewt','firedrake'],['boss9']],{d:'竜の巣の主。深層の大ボス。',flag:'boss9',first:{g:40000,loot:[[68,4]]}})]},
 {id:'kr',tab:1,ch:'深層',n:'虚の回廊',area:'kairou',th:'void',dyn:'kairou',intro:'果てのない回廊。10層ごとに番人がいる。クエスト1つで10層を進む（何度でも挑める）。',need:()=>!!G.flags.boss8,qs:[]},
 /* ===================== 天極（エンドコンテンツ） ===================== */
 {id:'e1',tab:2,ch:'天極 Ⅰ',n:'天極の門',area:'gate',th:'tower',intro:'星の地図の端、雲の上に浮かぶ白金の門。門をくぐった者だけが「天極の星晶」を手にする。',need:()=>!!G.flags.boss9,qs:[
  Q('e1_1','雲上の参道',70,[['g_slime','g_slime'],['g_wolf'],['g_knight','g_slime']],{d:'雲の上の参道。星霊が漂う。3連戦。',pre:[T(null,'n','竜の巣の最奥、溶岩の天井が裂け、雲の上へ続く光の道が現れた。'),T('valk','n','……天極の門。竜の言い伝えにある場所だ'),T('rio','n','この先に、まだ知らない星がある')],first:{g:50000,mat:[['seishou',1]]}}),
  Q('e1_2','天狼の群れ',72,[['g_wolf','g_wolf'],['g_wolf','g_spirit'],['g_wolf','g_wolf','g_slime']],{d:'白い天狼の群れ。素早い。3連戦。',first:{loot:[[72,3]]}}),
  Q('e1_3','星屑の聖域',74,[['g_spirit','g_slime'],['g_spirit','g_spirit'],['g_knight','g_spirit','g_slime']],{d:'星屑の精が守る聖域。魔法に注意。',first:{loot:[[74,3]]}}),
  Q('e1_4','門の守護獣',76,[['g_knight','g_wolf'],['g_knight','g_knight'],['g_mid']],{d:'門の前に伏す白金の守護獣。中ボス戦。',first:{g:80000,mat:[['seishou',2]]}}),
  Q('e1_5','衛士の大回廊',79,[['g_knight','g_knight','g_slime'],['g_wolf','g_spirit','g_wolf'],['g_knight','g_spirit'],['g_knight','g_knight','g_wolf']],{d:'天門の衛士が並ぶ大回廊。4連戦。',first:{loot:[[80,3],[80,3]]}}),
  Q('e1_6','天門の女帝アストレア',82,[['g_knight','g_spirit'],['g_wolf','g_knight'],['g_boss']],{d:'天極の門を統べる女帝。天極Ⅰの大ボス。',pre:[T(null,'n','門の奥、星の玉座に白金の女帝が座していた。'),T('noah','o','……星核と同じ光。でも、とても冷たい')],first:{g:120000,mat:[['seishou',3]],loot:[[82,4]]}})]},
 {id:'e2',tab:2,ch:'天極 Ⅱ',n:'星海の深淵',area:'abyss',th:'ruin',intro:'門の向こうに広がる、星の光が沈む海。深く潜るほど、古い星々の残骸が眠っている。',need:()=>!!qCleared('e1_6'),qs:[
  Q('e2_1','星の浅瀬',84,[['a_jelly','a_spore'],['a_rider'],['a_jelly','a_jelly']],{d:'星の光が揺れる浅瀬。3連戦。',pre:[T('mire','n','海の底に星が沈んでる……'),T('celes','n','千年前に砕けた星核のかけらじゃな。深く潜るほど、古い')],first:{g:150000,mat:[['seishou',2]]}}),
  Q('e2_2','胞子の珊瑚礁',87,[['a_spore','a_spore'],['a_spore','a_jelly'],['a_rider','a_spore','a_jelly']],{d:'胞子を撒く星海の珊瑚礁。3連戦。',first:{loot:[[87,3]]}}),
  Q('e2_3','影喰らいの海溝',89,[['a_shade','a_jelly'],['a_shade','a_shade'],['a_rider','a_shade']],{d:'光を喰う影が潜む海溝。',first:{loot:[[89,3]]}}),
  Q('e2_4','深海の巨像',90,[['a_rider','a_rider'],['a_shade','a_jelly','a_spore'],['a_mid']],{d:'海溝の底に立つ古代の巨像。中ボス戦。',first:{g:200000,mat:[['seishou',2]]}}),
  Q('e2_5','沈んだ星々',94,[['a_rider','a_shade','a_jelly'],['a_spore','a_spore','a_rider'],['a_shade','a_shade','a_jelly'],['a_rider','a_rider']],{d:'星々の残骸が眠る海底。4連戦。',first:{loot:[[94,3],[94,3]]}}),
  Q('e2_6','星海竜リヴァイア',98,[['a_rider','a_shade'],['a_jelly','a_rider','a_spore'],['a_boss']],{d:'星海を泳ぐ古の竜。天極Ⅱの大ボス。',pre:[T('valk','a','……でかい。竜の祖か'),T('jin','n','ポポが震えてる。来るぞ！')],first:{g:300000,mat:[['seishou',4]],loot:[[98,4]]}})]},
 {id:'e3',tab:2,ch:'天極 Ⅲ',n:'終焉の星域',area:'end',th:'void',intro:'星海の果て、すべての星が終わる場所。終焉の星神が、星の記憶を呑み込もうとしている。',need:()=>!!qCleared('e2_6'),qs:[
  Q('e3_1','終わりの岸辺',100,[['e_guard','e_drake'],['e_ninja','e_guard'],['e_golem','e_drake']],{d:'星の光が届かない岸辺。3連戦。',pre:[T(null,'n','星海の果て、空と海の境が消えた。'),T('rio','n','ここが……星の終わる場所')],first:{g:400000,mat:[['seishou',3]]}}),
  Q('e3_2','虚無の刺客',103,[['e_ninja','e_ninja'],['e_ninja','e_drake'],['e_ninja','e_ninja','e_guard']],{d:'音もなく迫る刺客。3連戦。',first:{loot:[[103,3]]}}),
  Q('e3_3','巨兵の行進',106,[['e_golem','e_golem'],['e_golem','e_guard'],['e_golem','e_golem','e_drake']],{d:'終焉の巨兵が隊列を組む。3連戦。',first:{loot:[[106,3]]}}),
  Q('e3_4','星蝕の騎士王',110,[['e_guard','e_ninja'],['e_drake','e_drake','e_golem'],['e_mid']],{d:'星を蝕む黒金の騎士王。中ボス戦。',first:{g:500000,mat:[['seishou',3]]}}),
  Q('e3_5','終焉の回廊',114,[['e_guard','e_drake','e_ninja'],['e_golem','e_golem','e_guard'],['e_ninja','e_ninja','e_drake'],['e_guard','e_guard','e_golem']],{d:'星神の座へ続く回廊。4連戦。',first:{loot:[[114,3],[114,3]]}}),
  Q('e3_6','終焉の星神ゼノス',118,[['e_guard','e_ninja'],['e_drake','e_golem','e_ninja'],{e:['e_boss1'],lv:118,stages:['e_boss1','e_boss2'],slv:120}],{d:'星の記憶を呑み込む終焉の星神。2つの形態を持つ。天極Ⅲの大ボス。',post:'xenos',pre:[T(null,'n','星々の亡骸が積み上がった玉座。その奥で、何かが目を開いた。'),T('rio','a','星を終わらせはしない。みんなの灯で、つなぎ直す！')],first:{g:800000,mat:[['seishou',5]],loot:[[120,4]]}})]},
 {id:'x1',tab:2,ch:'極限',n:'極限の星闘',area:'extreme',th:'lava',intro:'天極の果てに残る、星の覇者たちの影。何度でも挑める超高難度のクエスト。天極の星晶と最高級の装備が手に入る。',need:()=>!!qCleared('e3_6'),qs:[
  Q('x1_1','天極の覇竜',121,[['e_drake','e_drake','e_ninja'],['e_golem','e_drake','e_guard'],['x_dragon']],{d:'天極の空を統べる覇竜。',th:'lava',first:{mat:[['seishou',3]]}}),
  Q('x1_2','虚神ノクス・極',123,[['a_shade','a_shade','e_ninja'],['e_guard','a_shade','e_ninja'],['x_nox']],{d:'星の記憶から蘇った虚神。かつてより強い。',th:'void',first:{mat:[['seishou',3]]}}),
  Q('x1_3','刻の女帝',125,[['g_spirit','g_spirit','g_knight'],['e_ninja','g_spirit','e_guard'],['x_queen']],{d:'時を統べる女帝。素早く、強い。',th:'tower',first:{mat:[['seishou',4]]}}),
  Q('x1_4','原初の巨神',128,[['e_golem','e_golem','e_golem'],['e_golem','e_guard','e_drake'],['x_titan']],{d:'星が生まれる前から在った巨神。最強の敵。',th:'mine',first:{mat:[['seishou',5]]}})]}];
/* 会話：初回クリア後のイベント */
const POST={
 mire:{who:'mire',flag:'mireMet',lines:[T('mire','n','……侵入者？ いいえ、虚蝕の匂いがしない。あなたたちも星片の記録を探しているのね'),T('mire','h','この先の守護像は、私ひとりじゃ抜けられない。……手を組まない？')],decline:'ミレイユ「そう。気が変わったら星降り亭に来て」'},
 jin:{who:'jin',flag:'jinMet',lines:[T(null,'n','月明かりの下、怪我をした小さな獣を抱えた男がいた。'),T('jin','h','おっと、驚かせたか。こいつはポポ、俺の相棒さ。……あんたら、虚蝕を追ってるんだろ？ 夜の森で助けてもらった礼だ、ついて行くよ')],decline:'ジン「そうか。酒場で待ってるぜ」'},
 noah:{who:'noah',flag:'noahMet',lines:[T(null,'n','祭壇の脇で、白い人形が眠っている。胸の星片が、リオの星片に呼応して光った。'),T('noah','n','……起動。あなたが、わたしを起こした方ですね。……祈りの続きを、手伝わせてください')],decline:'ノアは再び目を閉じた。（酒場で誘える）'},
 hakua:{who:'hakua',flag:'hakuaMet',lines:[T('hakua','o','あっ、お客さん！？ 社に来る人なんて何年ぶりだろ！'),T('hakua','h','……そっか、空の穴を閉じに行くんだ。巫女の使命なんてガラじゃないけど――一緒に行かせて！ お腹すいたし！')],decline:'ハクア「えー！ じゃあ酒場で待ってるね！」'},
 erna:{who:'erna',flag:'ernaMet',auto:1,lines:[T('erna','h','……悪くない腕ね。いいわ、付き合ってあげる')]},
 balza:{who:'balza',flag:'balzaMet',auto:1,lines:[T('balza','h','助かったわい。礼に、わしの槌を貸してやろう')]},
 valk:{who:'valk',flag:'valkMet',auto:1,lines:[T('valk','h','……いい灯だ。喰らうのはやめた。隣で燃えるほうが面白い')]},
 celes:{who:'celes',flag:'celesMet',lines:[T(null,'n','番人が砂のように崩れ、止まっていた時計の音が戻った。瓦礫の玉座に、砂時計の杖を抱えた少女が腰かけている。'),T('celes','n','……ようやく来たか、灯守。千年ぶんの退屈を数えておったところじゃ'),T('celes','a','勘違いするでないぞ。寂しかったわけではない。……おぬしらの旅、わらわが見届けてやろう')],decline:'セレス「ふん、好きにせい。……酒場で待っておるからな」'},
 xenos:{lines:[T(null,'n','終焉の星神が光の粒となって散っていく。'),T('rio','n','終わりの先にも、星はまた生まれる。……そうだろ？'),T('celes','h','うむ。千年待った甲斐があったわ'),T(null,'n','天極の果てに、まだ強い星の影が残っている――<b>極限の星闘</b>が開いた。')]}};
return{CH,POST,Q,T};})();
