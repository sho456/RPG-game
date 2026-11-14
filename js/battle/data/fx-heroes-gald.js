/* ===== 技の演出：ガルド（元騎士団長・大剣と盾・地） =====
 重さが主役。動きは遅く大きく、命中では必ず地面が応える（輪・砂・岩）。書き方は js/battle/seq.js の冒頭 */
'use strict';
{const IRON=['#ffffff','#e8ecf4','#a8b4c8','#6a7890','#343c50'],AGGRO=['#ffffff','#ffd0b0','#ff8a5a','#c84a20','#601c08'],ROCK=['#ffffff','#d8c8a8','#8a7458','#4a3c2c','#201810'];
/* 盾撃：盾を構えたまま体ごとぶつかる。六角の盾の残像が相手に刻まれ、輪が縮む（行動の遅れ） */
BXS.def('tateuchi',{kind:'melee',dashMs:230,
 strike:{ms:180,do:[[0,'pose',{mL:-1,mS:1,mF:-2},120],[125,'pose',{mL:2,mF:9},50,'in'],[125,'ghost',{col:'#c8d8ff',n:2,gap:26}]]},
 impact:[[0,'fx','ward',{dx:-4,ramp:IRON,r:11,dur:280}],[0,'fx','shock',{ramp:'打',r1:14,dur:220}],[0,'fx','flare',{ramp:'打',rays:4,s:1}],[130,'fx','shock',{ramp:'氷',r0:13,r1:3,dash:1,dur:300}],[0,'shake',5]]});
/* 地裂斬：大剣を地面に叩き込み、裂け目から岩の槍が相手の足元を貫く */
BXS.def('chiretsu',{kind:'melee',dashMs:240,
 strike:{ms:310,do:[[0,'pose',{mU:2,mL:-3,mB:-3,mS:-2},200],[210,'pose',{mL:3,mB:7,mS:3,mF:5},70,'in'],[210,'ghost',{col:'#f0d090',n:2,gap:30}]]},
 impact:[[0,'fx','crescent',{ramp:'地',r:15,w:5,a0:-1.9,a1:1.1,dur:250}],[30,'fx','spikes',{on:'tf',n:4,s:1,dir:1}],[0,'fx','dust',{on:'tf',n:6,s:1.2}],[0,'shake',7]]});
/* 挑発：胸を張って剣で盾を打つ。赤い波が三度広がり、敵の頭上に怒りの印がつく */
BXS.def('chouhatsu',{kind:'self',
 pre:{ms:440,do:[[0,'pose',{mB:-3,mS:-1},140],[0,'sfx','sel'],[60,'fx','shock',{on:'a',ramp:AGGRO,r0:3,r1:20,dur:260}],[170,'fx','shock',{on:'a',ramp:AGGRO,r0:3,r1:27,dur:280}],[280,'fx','shock',{on:'a',ramp:AGGRO,r0:3,r1:34,dur:300,dash:1}],
  [60,'fx','flare',{on:'a',dx:6,ramp:IRON,rays:4,s:.8}],[240,'fx','glint',{on:'es',dy:-16,ramp:AGGRO,s:1.3,each:50}]]}});
/* 砕岩撃：横薙ぎの峰打ち。相手の表面にひびが走り、岩片が砕け落ちる（防御低下） */
BXS.def('saigan',{kind:'melee',dashMs:230,
 strike:{ms:260,do:[[0,'pose',{mR:-10,mL:-2,mS:1},170],[175,'pose',{mR:8,mL:3,mF:6},60,'in'],[175,'ghost',{col:'#e0b98a',n:2,gap:28}]]},
 impact:[[0,'fx','flare',{ramp:'打',rays:8,s:1.4}],[0,'fx','cut',{ramp:ROCK,ang:1.2,len:15,w:1.4,split:1,dur:320}],[40,'fx','cut',{ramp:ROCK,ang:-1,len:13,w:1.4,split:1,dur:300}],[60,'fx','shards',{on:'tf',ramp:ROCK,n:3,s:.7,dur:340}],[0,'shake',6]]});
/* 鉄壁の構え：腰を落とし、二重の盾の膜と地の陣で身を固める */
BXS.def('teppekikamae',{kind:'self',
 pre:{ms:480,do:[[0,'pose',{mS:2,mL:-1},160],[0,'fx','circle',{on:'af',ramp:'地',r:13,style:4,step:1,dur:700}],[0,'fx','ward',{on:'a',ramp:'buff',r:14,dur:460}],[130,'fx','ward',{on:'a',ramp:IRON,r:19,dur:520}],
  [130,'fx','shock',{on:'af',ramp:'地',r0:3,r1:18,sq:.3,layer:0}],[200,'fx','rise',{on:'af',ramp:'buff',n:8,w:14}],[0,'sfx','sel']]}});
/* 鉄槌：跳び上がり、全体重を乗せて剣の腹を叩きつける。二重の地の輪と砂柱 */
BXS.def('tettsui',{kind:'melee',dashMs:240,
 strike:{ms:330,do:[[0,'pose',{mS:2},90],[90,'pose',{mU:7,mS:-2,mL:-2},150],[90,'move',{to:'fwd',d:0,hop:9},230,'lin'],[250,'pose',{mU:0,mS:3,mB:5,mF:6},60,'in'],[250,'ghost',{col:'#e0b98a',n:3,gap:24}]]},
 impact:[[0,'fx','shock',{on:'tf',ramp:'打',r0:3,r1:20,sq:.3,layer:0,thick:2}],[70,'fx','shock',{on:'tf',ramp:'打',r0:3,r1:28,sq:.3,layer:0}],[0,'fx','flare',{ramp:'打',rays:6,s:1.5}],[0,'fx','dust',{on:'tf',n:7,s:1.3}],[0,'shake',8]]});
/* 堅守（星臨）：金の輪が外から締まり、城壁のような光の膜になる */
BXS.def('kenshu',{kind:'self',
 pre:{ms:320,do:[[0,'pose',{mS:2,mL:-2,mF:-1},120],[0,'fx','shock',{on:'a',ramp:'buff',r0:28,r1:13,thick:2,dur:260}],[150,'fx','ward',{on:'a',ramp:'光',r:17,dur:520}],[150,'fx','circle',{on:'af',ramp:'buff',r:14,style:6,step:1,dur:600}],[200,'fx','glint',{on:'ah',ramp:'buff',s:1.4}]]}});
/* 城壁崩し（星臨）：受け止めた力を地に流し、足元から大地の波を放つ。敵の下から岩の槍と地の柱 */
BXS.def('houkai',{kind:'cast',big:1,
 pre:{ms:460,do:[[0,'dim',.5,220],[0,'bars',1],[0,'pose',{mS:2,mB:2},200],[0,'fx','circle',{on:'af',ramp:'地',r:18,style:4,step:1,dur:1000,runes:8}],[0,'fx','gather',{on:'a',ramp:'地',n:20,ms:420,r:26}],[300,'pose',{mS:-2,mB:-3,mU:1},140]]},
 strike:c=>c.n===1?{ms:260,do:[[0,'pose',{mS:3,mB:5},60,'in'],[60,'fx','shock',{on:'af',ramp:'地',r0:5,r1:64,sq:.3,layer:0,thick:2,dur:460}],[60,'fx','dust',{on:'af',n:8,s:1.4}],[60,'shake',10],[60,'flash','#f0d090',6]]}:{ms:70,do:[]},
 impact:[[0,'fx','spikes',{on:'tf',n:5,s:1.3}],[40,'fx','pillar',{on:'tf',ramp:'地',w:8,h:50,dur:340}],[0,'fx','flare',{ramp:'地',rays:8,s:1.5}],[0,'shake',8]]});}
