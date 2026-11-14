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

/* ---- ver0.36：残りの技 ---- */
/* 鼓舞の灯：掲げた灯から金の輪が広がり、仲間の足元に小さな灯がともる */
BXS.def('kobu',{kind:'self',
 pre:{ms:520,do:[[0,'pose',{mU:1,mB:-2,mS:-1},180],[0,'fx','glint',{on:'ah',dy:-3,ramp:'buff',s:1.6,dur:320}],[60,'fx','pillar',{on:'af',ramp:'buff',w:4,h:50,dur:380}],[0,'sfx','sel'],
  [200,'fx','shock',{on:'af',ramp:'buff',r0:3,r1:34,sq:.35,layer:0,dur:420,thick:2}],[260,'fx','circle',{on:'hsf',ramp:'buff',r:8,style:0,dur:520,each:60}],[280,'fx','rise',{on:'hsf',ramp:'buff',n:6,w:10,h:24,each:60}]]}});
/* 灯火連斬：振り下ろし → 斬り上げ → 突きの三連。最後の一突きだけ光が弾ける */
BXS.def('torirensan',{kind:'melee',
 strike:[{ms:160,do:[[0,'pose',{mL:-2,mB:-1,mS:1,mF:-2},100],[100,'pose',{mL:3,mB:4,mS:-1,mF:5},50,'in'],[100,'ghost',{col:'#fff3a6',n:2,gap:22}]]},
         {ms:110,do:[[0,'pose',{mL:1,mB:5,mS:1,mF:4},50],[50,'pose',{mL:2,mB:-2,mS:-2,mF:6,mU:1},50,'in'],[50,'ghost',{col:'#fff3a6',n:2,gap:22}]]},
         {ms:150,do:[[0,'pose',{mL:-3,mS:1,mF:1},80],[80,'pose',{mL:5,mB:3,mF:10,mS:-1},50,'in'],[80,'ghost',{col:'#ffffff',n:4,gap:16}]]}],
 impact:c=>c.n%3===1?[[0,'fx','crescent',{ramp:'光',r:11,w:3,a0:-2.3,a1:.5,dur:190}],[0,'shake',2]]:c.n%3===2?[[0,'fx','crescent',{ramp:'光',r:11,w:3,a0:1.4,a1:-1.7,dur:190}],[0,'shake',2]]:
  [[0,'fx','stab',{ramp:'光',len:28,n:5}],[0,'fx','flare',{ramp:'光',rays:6,s:1.2}],[0,'fx','sparks',{ramp:'光',n:8,speed:2.4}],[0,'fx','shock',{ramp:'光',r1:14,dur:220}],[0,'shake',6]]});
/* 星光斬（星臨）：場が暗くなり、頭上で剣が星になる。振り下ろすと、星形に交わる斬り筋と光の柱 */
BXS.def('seikou',{kind:'melee',big:1,dashMs:260,
 pre:{ms:380,do:[[0,'dim',.5,220],[0,'bars',1],[0,'fx','circle',{on:'af',ramp:'光',r:12,style:5,step:2,dur:700,runes:6}],[0,'fx','gather',{on:'a',dy:-8,ramp:'光',n:16,ms:340,r:22}],[240,'fx','glint',{on:'ah',dy:-4,ramp:'光',s:2,dur:260}]]},
 strike:{ms:300,do:[[0,'pose',{mU:3,mL:-3,mB:-3,mS:-2},190],[0,'cam',{z:1.12,on:'t'},240],[200,'pose',{mL:4,mB:6,mF:7,mS:1},60,'in'],[200,'ghost',{col:'#fff3a6',n:4,gap:20}],[150,'fx','speedlines',{on:'t',n:20,col:'#fff8d0'}]]},
 impact:[[0,'fx','crescent',{ramp:'光',r:22,w:7,a0:-2.4,a1:1,dur:320,edge:1}],[60,'fx','cut',{ramp:'光',ang:-.9,len:50,w:2.6,split:1,dur:340}],[110,'fx','cut',{ramp:'光',ang:.5,len:40,w:2.2,split:1,dur:320}],[160,'fx','cut',{ramp:'光',ang:1.57,len:44,w:2.2,dur:300}],
  [120,'fx','pillar',{on:'tf',ramp:'光',w:9,h:90,dur:420}],[0,'fx','flare',{ramp:'光',rays:8,s:1.9}],[0,'fx','sparks',{ramp:'光',n:14,speed:2.6}],[0,'fx','shock',{ramp:'光',r1:26,thick:2}],[0,'flash','#fff8d0',10],[0,'shake',12]],
 after:{ms:200,do:[[0,'pose',{mS:1,mB:2},160]]}});
/* 流星連斬（星臨）：高く跳び、斜めに降る光の筋で全員を斬る */
BXS.def('ryusei',{kind:'melee',stay:1,big:1,
 pre:{ms:0,do:[[0,'dim',.35,200]]},
 strike:c=>c.n===1?{ms:320,do:[[0,'pose',{mS:2},90],[90,'pose',{mU:7,mL:2,mS:-2},160],[90,'move',{to:'fwd',d:4,hop:14},230,'out'],[90,'ghost',{col:'#fff3a6',n:5,gap:30}],[260,'pose',{mL:4,mB:5,mF:4},50,'in']]}:{ms:70,do:[]},
 impact:[[0,'fx','beam',{dx:-14,dy:-52,to:'t',ramp:'光',w:3,dur:220}],[40,'fx','cut',{ramp:'光',ang:-1.1,len:26,w:2,dur:220}],[40,'fx','flare',{ramp:'光',s:1,rays:4,rot:.78}],[40,'fx','sparks',{ramp:'光',n:6}],[0,'shake',4]]});
/* 継承・城壁崩し（星臨）：ガルドの型をなぞり、剣を地に突き立てる。光をまとった岩の槍が列をなす */
BXS.def('keishou',{kind:'melee',stay:1,big:1,
 pre:{ms:300,do:[[0,'dim',.4,200],[0,'fx','circle',{on:'af',ramp:'地',r:14,style:4,step:1,dur:800}],[0,'fx','gather',{on:'a',ramp:'光',n:12,ms:280,r:18}]]},
 strike:c=>c.n===1?{ms:340,do:[[0,'pose',{mU:3,mS:-2,mB:-2},200],[210,'pose',{mS:3,mB:6,mL:2},60,'in'],[270,'fx','shock',{on:'af',ramp:'地',r0:4,r1:44,sq:.3,layer:0,thick:2,dur:420}],[270,'fx','dust',{on:'af',n:6}],[270,'shake',8]]}:{ms:70,do:[]},
 impact:[[0,'fx','spikes',{on:'tf',n:4,s:1.1,dir:1}],[60,'fx','pillar',{on:'tf',ramp:'光',w:4,h:50,dur:300}],[0,'fx','flare',{ramp:'地',rays:6,s:1.2}],[0,'shake',7]]});
