/* ===== 技の演出：ミレイユ（魔導書・炎と氷） =====
 炎は三角の陣から「立ちのぼる」、氷は六角の陣から「生える・砕ける」。大魔法ほど陣の角が増える。書き方は js/battle/seq.js の冒頭 */
'use strict';
{const DUAL=['#ffffff','#ffe0a0','#ff7a3a','#7fd6ff','#2a5aa8'],CAST={mB:-2,mS:-1,mU:1},PUSH={mB:2,mF:1};
/* ファイア：三角の陣。書から火の玉を撃ち、当たって燃え上がる */
BXS.def('fire',{kind:'cast',
 pre:{ms:230,do:[[0,'pose',CAST,170],[0,'fx','circle',{on:'af',ramp:'炎',r:10,style:3,step:1,dur:560}],[0,'fx','gather',{on:'a',dx:6,dy:-6,ramp:'炎',n:9,ms:210,r:12}]]},
 strike:{ms:200,do:[[0,'pose',PUSH,50],[0,'fx','proj',{on:'a',dx:8,dy:-6,to:'t',kind:'orb',ramp:'炎',ms:150,s:1.2}],[50,'idle',160]]},
 impact:[[0,'fx','flame',{s:1,dur:400}],[0,'fx','flare',{ramp:'炎',rays:6,s:1}],[0,'fx','shock',{ramp:'炎',r1:12,dur:220}],[0,'shake',3]]});
/* ブリザド：六角の陣。三つの氷片が順に飛び、足元から結晶が生えて砕ける */
BXS.def('blizz',{kind:'cast',
 pre:{ms:230,do:[[0,'pose',CAST,170],[0,'fx','circle',{on:'af',ramp:'氷',r:10,style:6,step:2,spin:-2,dur:560}],[0,'fx','gather',{on:'a',dx:6,dy:-6,ramp:'氷',n:9,ms:210,r:12,kind:2}]]},
 strike:{ms:230,do:[[0,'pose',PUSH,50],[0,'fx','proj',{on:'a',dx:8,dy:-10,to:'t',tdy:-5,kind:'shard',ramp:'氷',ms:120,arc:0}],[40,'fx','proj',{on:'a',dx:8,dy:-5,to:'t',kind:'shard',ramp:'氷',ms:120,arc:0}],[80,'fx','proj',{on:'a',dx:8,dy:0,to:'t',tdy:5,kind:'shard',ramp:'氷',ms:120,arc:0}],[60,'idle',160]]},
 impact:[[0,'fx','shards',{on:'tf',n:4,s:.9}],[0,'fx','shock',{ramp:'氷',r1:13,dash:1,dur:240}],[0,'shake',3]]});
/* フレイムウェーブ：大きめの陣から炎の波が走り、敵の足元を低く広く焼いていく */
BXS.def('flamewave',{kind:'cast',
 pre:{ms:300,do:[[0,'pose',CAST,180],[0,'fx','circle',{on:'af',ramp:'炎',r:14,style:3,step:1,dur:800,runes:6}],[0,'fx','gather',{on:'a',dx:6,dy:-4,ramp:'炎',n:14,ms:280,r:16}]]},
 strike:c=>c.n===1?{ms:220,do:[[0,'pose',{mB:3,mF:2,mS:1},60,'in'],[0,'fx','proj',{on:'a',dx:8,dy:4,to:'t',tdy:6,kind:'wave',ramp:'炎',ms:200,s:1.7,arc:0}],[0,'fx','dust',{on:'af',dx:8,n:4,ramp:'炎'}]]}:{ms:50,do:[]},
 impact:[[0,'fx','flame',{on:'tf',dy:-4,s:.8,w:16,h:15,dur:380}],[0,'fx','sparks',{on:'tf',ramp:'炎',n:6,ang:-1.57,spread:1.8,g:.02}],[0,'shake',3]]});
/* プリズム・ブランド：相手の体に、炎と氷の二色の印を焼き付ける（弱点を刻む） */
BXS.def('prism',{kind:'cast',
 pre:{ms:240,do:[[0,'pose',CAST,170],[0,'fx','circle',{on:'af',ramp:DUAL,r:10,style:6,step:1,dur:560}],[0,'fx','glint',{on:'a',dx:7,dy:-6,ramp:DUAL,s:1.2}]]},
 strike:{ms:200,do:[[0,'pose',PUSH,50],[0,'fx','beam',{on:'a',dx:8,dy:-6,to:'t',ramp:DUAL,w:1.6,dur:200}]]},
 impact:[[0,'fx','circle',{ramp:DUAL,r:9,sq:1,style:6,step:2,spin:4,dur:640,layer:1,glow:0}],[0,'fx','flame',{dx:-5,s:.5,dur:300,embers:3}],[0,'fx','shards',{on:'tf',dx:5,n:2,s:.5,dur:320}],[200,'fx','glint',{ramp:DUAL,s:1.5}],[0,'shake',2]]});
/* メテオスウォーム：空が暗くなり、八角の陣。燃える岩が斜めに降りそそぎ、地面で弾ける */
BXS.def('meteor',{kind:'cast',big:1,
 pre:{ms:420,do:[[0,'dim',.5,240],[0,'bars',1],[0,'pose',{mB:-3,mS:-2,mU:2},220],[0,'fx','circle',{on:'af',ramp:'炎',r:16,style:8,step:3,dur:1400,runes:8}],[0,'fx','gather',{on:'ah',dy:-8,ramp:'炎',n:16,ms:380,r:20}],[200,'tint','#ff5020',.18,500]]},
 strike:{ms:120,do:[[0,'fx','proj',{on:'t',dx:-24,dy:-74,to:'t',kind:'orb',ramp:'炎',ms:120,s:1.6,arc:0,ease:'in'}]]},
 impact:[[0,'fx','flame',{on:'tf',dy:-4,s:.7,dur:300,embers:4}],[0,'fx','shock',{on:'tf',ramp:'炎',r0:2,r1:14,sq:.3,layer:0}],[0,'fx','flare',{ramp:'炎',rays:6,s:1.1}],[0,'fx','dust',{on:'tf',n:3}],[0,'shake',5]]});
/* ファイガ（星臨）：頭上で火球を育ててから撃つ。三本の火柱が立ち、熱の輪が広がる */
BXS.def('fira2',{kind:'cast',big:1,
 pre:{ms:420,do:[[0,'dim',.35,200],[0,'pose',{mB:-3,mS:-2,mU:2},200],[0,'fx','circle',{on:'af',ramp:'炎',r:15,style:5,step:2,dur:900,runes:5}],[0,'fx','gather',{on:'ah',dy:-9,ramp:'炎',n:16,ms:380,r:20}],[120,'fx','orb',{on:'ah',dy:-9,ramp:'炎',core:'#ff8a28',r:6,dur:560,orbit:5}]]},
 strike:{ms:230,do:[[0,'pose',{mB:4,mF:3,mS:1},60,'in'],[0,'fx','proj',{on:'ah',dy:-9,to:'t',kind:'orb',ramp:'炎',ms:160,s:2,arc:4}],[70,'idle',180]]},
 impact:[[0,'fx','flame',{s:1.6,h:34,dur:480}],[60,'fx','flame',{dx:9,s:1,dur:380}],[60,'fx','flame',{dx:-9,s:1,dur:380}],[0,'fx','shock',{ramp:'炎',r1:22,thick:2}],[0,'fx','flare',{ramp:'炎',rays:8,s:1.6}],[0,'flash','#ffb060',8],[0,'shake',9],[0,'punch',{z:1.07,on:'t'},280]]});
/* ブリザガ（星臨）：冷気が相手へ集まり、巨大な結晶が一気に生えて、氷の柱とともに砕ける */
BXS.def('blizz2',{kind:'cast',big:1,
 pre:{ms:420,do:[[0,'dim',.35,200],[0,'pose',{mB:-3,mS:-2,mU:2},200],[0,'fx','circle',{on:'af',ramp:'氷',r:15,style:6,step:2,spin:-3,dur:900,runes:8}],[0,'fx','gather',{on:'t',ramp:'氷',n:18,ms:400,r:24,kind:2}]]},
 strike:{ms:160,do:[[0,'pose',{mB:3,mF:2},60,'in'],[0,'tint','#bfe8ff',.22,360]]},
 impact:[[0,'fx','shards',{on:'tf',n:7,s:1.5,dur:540}],[0,'fx','shock',{ramp:'氷',r1:24,dash:1,thick:2}],[90,'fx','pillar',{on:'tf',ramp:'氷',w:6,h:60,dur:360}],[0,'fx','flare',{ramp:'氷',rays:6,s:1.4,rot:.5}],[0,'shake',8],[0,'punch',{z:1.07,on:'t'},280]]});
/* 絶対零度の太陽（星臨）：戦場の中央に、氷の輪をまとった小さな太陽。一度内へ潰れてから、炎と氷の二重の波が全員を呑む */
BXS.def('zettai',{kind:'cast',big:1,
 pre:{ms:900,do:[[0,'dim',.7,300],[0,'bars',1],[0,'pose',{mB:-3,mS:-2,mU:3},260],[0,'fx','circle',{on:'af',ramp:DUAL,r:18,style:8,step:3,dur:1700,runes:10}],
  [0,'fx','gather',{on:'c',dy:-18,ramp:'炎',n:14,ms:520,r:34}],[120,'fx','gather',{on:'c',dy:-18,ramp:'氷',n:14,ms:520,r:34,kind:2}],[300,'fx','orb',{on:'c',dy:-18,ramp:'炎',core:'#ffd24a',r:10,dur:1000,orbit:0}],
  [380,'fx','shock',{on:'c',dy:-18,ramp:'氷',r0:13,r1:17,dur:300}],[560,'fx','shock',{on:'c',dy:-18,ramp:'氷',r0:13,r1:19,dur:300}],[740,'fx','shock',{on:'c',dy:-18,ramp:'氷',r0:13,r1:21,dur:300}],
  [300,'cam',{z:1.1,on:'c'},500],[600,'fx','speedlines',{on:'c',dy:-18,n:22,col:'#d8f6ff',dur:420}]]},
 strike:c=>c.n===1?{ms:420,do:[[0,'pose',{mB:5,mS:2,mF:2},70,'in'],[0,'fx','orb',{on:'c',dy:-18,ramp:'氷',r:14,mode:'implode',dur:300}],[200,'flash','#ffffff',14],[200,'shake',14],[200,'camreset',300],
   [200,'fx','shock',{on:'c',dy:-18,ramp:'氷',r0:6,r1:84,thick:2,dur:520}],[260,'fx','shock',{on:'c',dy:-18,ramp:'炎',r0:6,r1:64,thick:2,dur:480}],[200,'tint','#ffffff',.5,420]]}:{ms:60,do:[]},
 impact:[[0,'fx','flame',{s:1.1,dur:420}],[70,'fx','shards',{on:'tf',n:5,s:1.1,dur:460}],[0,'fx','flare',{ramp:DUAL,rays:8,s:1.5}],[0,'shake',6]]});}
