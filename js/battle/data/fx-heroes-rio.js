/* ===== 技の演出：リオ（灯守見習い・片手剣・光） =====
 ver0.34 は基盤の動作確認として、通常攻撃と最初の 3 技だけを入れている。残りの技は ver0.36 以降で足す。
 書き方は js/battle/seq.js の冒頭を参照 */
'use strict';
/* 通常攻撃：小さく構えて踏み込む。1 撃目は振り下ろし、2 撃目は斬り上げ */
BXS.def('rio:atk',{kind:'melee',
 strike:[{ms:170,do:[[0,'pose',{mL:-2,mB:-1,mS:1,mF:-2},110],[110,'pose',{mL:3,mB:4,mS:-1,mF:6},60,'in'],[110,'ghost',{col:'#dfe8ff',n:2,gap:28}]]},
         {ms:150,do:[[0,'pose',{mL:-2,mB:-1,mS:1,mF:-2},90],[90,'pose',{mL:3,mB:4,mS:-1,mF:6},60,'in'],[90,'ghost',{col:'#dfe8ff',n:2,gap:28}]]}],
 impact:c=>[[0,'fx','crescent',c.n%2?{ramp:'斬',r:12,a0:-2.3,a1:.7}:{ramp:'斬',r:12,a0:1.3,a1:-1.9}],[0,'fx','sparks',{ramp:'斬',n:5,ang:3.14,spread:2.2,mirror:1}],[0,'fx','flare',{ramp:'斬',s:.8,rot:.4}],[0,'shake',3]]});

/* 光刃：剣に灯を集め、踏み込んで一閃。三日月の斬撃のあとに、細い光の筋が遅れて走る */
BXS.def('koujin',{kind:'melee',big:1,
 pre:{ms:0,do:[[0,'fx','glint',{on:'ah',dx:5,dy:6,ramp:'光',s:1.2}],[0,'fx','gather',{on:'a',dx:4,dy:-4,ramp:'光',n:9,ms:230,r:14}]]},
 strike:{ms:240,do:[[0,'pose',{mL:-2,mB:-1,mS:1,mF:-2},140],[0,'fx','circle',{on:'af',ramp:'光',r:9,dur:330,style:0,spin:5}],[150,'pose',{mL:3,mB:4,mS:-1,mF:6},50,'in'],[150,'move',{to:'fwd',d:5},70],[150,'ghost',{col:'#fff3a6',n:3,gap:24}]]},
 impact:[[0,'fx','crescent',{ramp:'光',r:16,w:4.8,a0:-2.4,a1:.9,dur:270,edge:1}],[0,'fx','flare',{ramp:'光',rays:6,s:1.3,rot:.26}],[0,'fx','sparks',{ramp:'光',n:9,speed:2.2}],
  [70,'fx','cut',{ramp:'光',ang:-.62,len:38,w:2.2,split:1,dur:300}],[70,'fx','pillar',{on:'tf',ramp:'光',w:5,h:60,dur:320}],[0,'shake',7],[0,'punch',{z:1.07,on:'t'},260]]});

/* 斬り払い：敵の列の前へ出て、低い横薙ぎ。1 振りで全員を払う（2 体目からは刃が届くだけ） */
BXS.def('harai',{kind:'melee',stay:1,
 strike:c=>c.n===1?{ms:230,do:[[0,'pose',{mL:-2,mB:-1,mS:1,mF:-2},130],[130,'pose',{mL:3,mB:4,mS:-1,mF:6},60,'in'],[130,'ghost',{col:'#dfe8ff',n:3,gap:22}],
   [150,'fx','crescent',{on:'a',dx:13,dy:1,ramp:'斬',r:21,w:4,sq:.42,a0:-.3,a1:3.5,dur:260,hit:.5}],[150,'fx','dust',{on:'af',dx:6,n:5,dir:1}]]}:{ms:60,do:[]},
 impact:c=>[[0,'fx','cut',{ramp:'斬',ang:.12*(c.n%2?1:-1),len:26,w:2,dur:230}],[0,'fx','sparks',{ramp:'斬',n:5,ang:3.14,spread:1.6,mirror:1}],[0,'shake',3]]});

/* 応急手当：手をかざし、相手の足元に小さな灯の輪。緑の光が包んで昇る */
BXS.def('teate',{kind:'self',
 pre:{ms:420,do:[[0,'pose',{mL:-1,mB:-2,mS:-2,mU:2},160],[0,'fx','gather',{on:'a',dy:-6,ramp:'heal',n:8,ms:240,r:12}],[0,'sfx','heal'],
  [200,'fx','circle',{on:'tf',ramp:'heal',r:11,dur:560,style:4,step:1,spin:3}],[230,'fx','rise',{on:'tf',ramp:'heal',n:12,w:14,h:30}],[260,'fx','shock',{on:'tf',ramp:'heal',r0:2,r1:13,sq:.3,layer:0,dur:380}],[330,'fx','glint',{on:'th',ramp:'heal',s:1.1}]]}});
