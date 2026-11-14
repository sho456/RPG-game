/* ===== ver0.35 味方のモーション（12 人） =====
 1. 待機の癖（QUIRK）：呼吸・弾み・浮遊・揺れを、1 枚絵の変形（js/battle/rig.js の mL・mB・mS・mU…）で足す
 2. 通常攻撃（'id:atk'）：武器と性格ごとに、予備動作・踏み込み・命中の形を変える
 3. 防御（'cat:guard'）・走り出しの砂ぼこり
 4. 被弾（react）：ダメージの大きさでのけぞりが変わる。大きな一撃は後ろへ弾かれる
 5. 勝利（VICT）：12 人それぞれの決めの動き
 6. 復活（revive）：倒れた姿から起き上がる
 書き方は js/battle/seq.js の冒頭を参照 */
'use strict';
const BXM=(()=>{
const Z=BXR.Z,TAU=6.2832;
const mk=t=>({S:(per,ph=0)=>Math.sin((t/per+ph)*TAU),U:(per,ph=0)=>(Math.sin((t/per+ph)*TAU)+1)/2,ev:(per,dur,ph=0)=>{const x=(t+ph*per)%per;return x<dur?x/dur:-1;}});
/* ---------- 1. 待機の癖 ---------- */
const QUIRK={
 rio:t=>{const{U}=mk(t);return{mU:U(560)>.6?1:0};},/* つま先で軽く弾む */
 gald:t=>{const{U}=mk(t);return{mS:U(2100)>.62?1:0};},/* 重く深い呼吸で、鎧ごと沈む */
 mire:t=>{const{ev}=mk(t),pg=ev(4200,520);return{mB:pg>=0?-1:0};},/* 頁をめくるとき、少し胸を起こす */
 shion:t=>{const{S,U}=mk(t);return{mL:S(1000)>.5?1:S(1000)<-.5?-1:0,mS:U(500)>.6?1:0};},/* 低い構えで左右に揺れる */
 noah:t=>{const{ev}=mk(t),tl=ev(4300,1100);return{mB:tl>=0?1:0};},/* ときどき小さくうなずく */
 erna:t=>{const{ev}=mk(t),ck=ev(4700,900);return{mL:ck>=0?-1:0,mB:ck>=0?-1:0};},/* 弦の張りを確かめて身を引く */
 balza:t=>{const{U,ev}=mk(t),st=ev(6100,300);return{mS:st>=0?2:U(1400)>.6?1:0};},/* 腹で息をし、ときどき足を踏み鳴らす */
 crow:t=>{const{S}=mk(t),s=S(2400);return{mL:s>.55?1:s<-.55?-1:0,mB:1};},/* 猫背でゆらりと揺れる */
 hakua:t=>{const{U,ev}=mk(t),jb=ev(3100,180);return{mU:U(430)>.55?1:0,mF:jb>=0?2:0,mL:jb>=0?1:0};},/* 軽いフットワーク。ときどき牽制の突き */
 jin:t=>{const{ev}=mk(t),sc=ev(6400,800);return{mB:sc>=0?1:0,mL:sc>=0?-1:0};},/* 頭をかく */
 celes:t=>{const{S}=mk(t);return{mU:2+Math.round(S(1900)*1.6)};},/* 宙に浮いてゆっくり上下する */
 valk:t=>{const{U}=mk(t),b=U(1850);return{mS:b>.7?-1:0,mB:b>.7?-1:0};}};/* 肩で大きく息をして胸を張る */
/* 素材の読み込みが終わったら、待機の関数に変形の値を足す（値が常にあるので、行動からの戻りも滑らかにつながる） */
{const iv=setInterval(()=>{if(typeof SPX==='undefined'||!SPX.ready)return;clearInterval(iv);
  for(const id in QUIRK){const k='spx_'+id,f=ANIM.IDLE[k];if(!f||f._bx)continue;const q=QUIRK[id],w=(t,u,A,b)=>Object.assign({},Z,f(t,u,A,b),q(t,u));w._bx=1;ANIM.IDLE[k]=w;}
  try{if(typeof B!=='undefined'&&B)B.heroes.forEach(h=>{h.A=null;});}catch(e){}},120);}

/* ---------- 2. 通常攻撃 ---------- */
const STEEL=['#ffffff','#fff0d8','#ffb060','#c8601c','#6a2a08'],DRAGON=['#ffffff','#ffd8a8','#ff6a30','#a81c10','#400808'],ASTRAL=['#ffffff','#e6dcff','#b8a0ff','#7a5cf0','#3a2a90'];
/* ガルド（大剣）：大きく振りかぶり、体重を乗せて叩き斬る。地面に輪が走る */
BXS.def('gald:atk',{kind:'melee',dashMs:240,
 strike:{ms:300,do:[[0,'pose',{mL:-3,mB:-3,mS:-2,mU:1},200],[205,'pose',{mL:2,mB:6,mS:2,mF:5},70,'in'],[205,'ghost',{col:'#ffe9c0',n:2,gap:30}]]},
 impact:[[0,'fx','crescent',{ramp:'斬',r:17,w:5.6,a0:-1.9,a1:1.1,dur:260}],[0,'fx','shock',{on:'tf',ramp:'地',r0:3,r1:17,sq:.3,layer:0,thick:2}],[0,'fx','dust',{on:'tf',n:5}],[0,'fx','flare',{ramp:'斬',s:1.1}],[0,'shake',6]]});
/* シオン（双短剣）：一瞬で間合いを詰め、交差する細い斬り筋を残す */
BXS.def('shion:atk',{kind:'melee',dashMs:130,
 strike:{ms:90,do:[[0,'pose',{mL:4,mB:3,mF:7,mS:-1},60,'in'],[0,'ghost',{col:'#8ff0a8',n:3,gap:16,dur:170}]]},
 impact:c=>[[0,'fx','cut',{ramp:'風',ang:c.n%2?.75:-.75,len:22,w:1.6,dur:200}],[40,'fx','cut',{ramp:'風',ang:c.n%2?-.6:.6,len:18,w:1.4,dur:180}],[0,'fx','sparks',{ramp:'風',n:4,speed:2.4}],[0,'shake',2]]});
/* エルナ（弓）：身を引いて引き絞り、雷をまとった矢を放つ */
BXS.def('erna:atk',{kind:'shoot',
 strike:{ms:300,do:[[0,'pose',{mL:-2,mB:-2,mF:-1},170],[70,'fx','glint',{on:'a',dx:7,dy:-3,ramp:'雷',s:.8}],[200,'pose',{mL:1,mF:-2},40],[200,'fx','proj',{on:'a',dx:8,dy:-3,to:'t',kind:'arrow',ramp:'雷',ms:100}]]},
 impact:[[0,'fx','stab',{ramp:'雷',len:18,n:3}],[0,'fx','flare',{ramp:'雷',s:.8,rot:.5}],[0,'shake',2]]});
/* バルザ（斧）：斧を担いで反り、遠心力で叩きつける。破片が飛ぶ */
BXS.def('balza:atk',{kind:'melee',dashMs:250,
 strike:{ms:320,do:[[0,'pose',{mL:-3,mR:-12,mS:1,mF:-2},220],[225,'pose',{mL:3,mB:5,mR:14,mF:6,mS:1},70,'in'],[225,'ghost',{col:'#ffb070',n:2,gap:30}]]},
 impact:[[0,'fx','crescent',{ramp:STEEL,r:15,w:6.2,a0:-2.6,a1:.4,dur:250}],[0,'fx','spikes',{on:'tf',n:2,s:.5,dur:300}],[0,'fx','flare',{ramp:STEEL,rays:6,s:1.2}],[0,'shake',7]]});
/* ハクア（拳）：ジャブ → ストレート → 回し蹴り。氷の火花が散る */
BXS.def('hakua:atk',{kind:'melee',dashMs:150,
 strike:[{ms:80,do:[[0,'pose',{mL:2,mF:6},50,'in'],[0,'ghost',{col:'#bff4ff',n:2,gap:18,dur:150}]]},
         {ms:95,do:[[0,'pose',{mL:4,mB:3,mF:8,mS:-1},60,'in'],[0,'ghost',{col:'#bff4ff',n:2,gap:18,dur:150}]]},
         {ms:130,do:[[0,'pose',{mR:-25,mU:3,mF:7},90,'in'],[0,'ghost',{col:'#bff4ff',n:3,gap:22,dur:170}]]}],
 impact:c=>[[0,'fx','flare',{ramp:'氷',rays:8,s:c.n%3===0?1.3:.9,rot:c.n*.5}],[0,'fx','shock',{ramp:'氷',r0:1,r1:c.n%3===0?13:9,dur:200}],[0,'fx','sparks',{ramp:'氷',n:4}],[0,'shake',c.n%3===0?5:2]]});
/* ジン（爪）：身を沈めて飛びかかり、三本の爪あとを刻む */
BXS.def('jin:atk',{kind:'melee',dashMs:200,
 strike:{ms:170,do:[[0,'pose',{mS:2,mL:-1},90],[95,'pose',{mL:4,mB:3,mF:6,mU:3,mS:-2},70,'in'],[95,'ghost',{col:'#e8c890',n:2,gap:24}]]},
 impact:[[0,'fx','cut',{ramp:'地',ang:-1.05,len:17,w:1.8,dy:-5,dx:-3,dur:210}],[25,'fx','cut',{ramp:'地',ang:-1.05,len:19,w:2,dur:210}],[50,'fx','cut',{ramp:'地',ang:-1.05,len:17,w:1.8,dy:5,dx:3,dur:210}],[0,'fx','sparks',{ramp:'blood',n:5,speed:1.6}],[0,'shake',4]]});
/* ヴァルク（竜の大剣）：翼で浮き、落ちる勢いで薙ぐ。炎が尾を引く */
BXS.def('valk:atk',{kind:'melee',dashMs:230,
 strike:{ms:260,do:[[0,'pose',{mU:4,mL:-2,mS:-1},170],[175,'pose',{mU:0,mL:4,mB:4,mF:7,mS:1},70,'in'],[175,'ghost',{col:'#ff9a60',n:3,gap:24}]]},
 impact:[[0,'fx','crescent',{ramp:DRAGON,r:18,w:6,a0:-2.2,a1:1,dur:270,edge:1}],[40,'fx','flame',{on:'tf',s:.6,dur:320,embers:5}],[0,'fx','flare',{ramp:DRAGON,s:1.2}],[0,'shake',6]]});
/* ミレイユ（魔導書）：足元に三角の陣。書から火の魔弾を撃つ */
BXS.def('mire:atk',{kind:'cast',
 strike:{ms:330,do:[[0,'pose',{mB:-2,mS:-1,mU:1},160],[0,'fx','circle',{on:'af',ramp:'炎',r:8,style:3,step:1,dur:300,glow:0}],[60,'fx','gather',{on:'a',dx:6,dy:-6,ramp:'炎',n:6,ms:150,r:9}],
  [200,'pose',{mB:2,mF:1},50],[200,'fx','proj',{on:'a',dx:8,dy:-6,to:'t',kind:'orb',ramp:'炎',ms:130}]]},
 impact:[[0,'fx','flame',{s:.55,dur:300,embers:5}],[0,'fx','flare',{ramp:'炎',rays:6,s:.9}],[0,'shake',2]]});
/* ノア（聖杖）：頭上に光の輪。弧を描いて落ちる光の珠 */
BXS.def('noah:atk',{kind:'cast',
 strike:{ms:340,do:[[0,'pose',{mU:2,mS:-1},170],[0,'fx','shock',{on:'ah',ramp:'光',r0:2,r1:7,sq:.3,dur:300}],[200,'pose',{mB:2},50],[200,'fx','proj',{on:'ah',dx:4,to:'t',kind:'orb',ramp:'光',ms:140,arc:9,s:.8}]]},
 impact:[[0,'fx','pillar',{on:'tf',ramp:'光',w:3.5,h:40,dur:300}],[0,'fx','glint',{ramp:'光',s:1.2}],[0,'shake',2]]});
/* クロウ（大鎌・呪術）：手元に闇を溜め、鎌の形の波として飛ばす。当たると内へ潰れる */
BXS.def('crow:atk',{kind:'cast',
 strike:{ms:330,do:[[0,'pose',{mL:-2,mB:2},170],[0,'fx','orb',{on:'a',dx:8,dy:-2,ramp:'闇',r:4,dur:200,orbit:4}],[190,'pose',{mL:3,mB:3,mF:2},50,'in'],[190,'fx','proj',{on:'a',dx:9,dy:-2,to:'t',kind:'wave',ramp:'闇',ms:140,arc:0}]]},
 impact:[[0,'fx','orb',{ramp:'闇',r:7,mode:'implode',dur:300}],[0,'shake',3]]});
/* セレス（時の杖）：浮いたまま杖を振り、星の欠片を一直線に撃つ。当たると輪が縮む（時が巻き戻る印） */
BXS.def('celes:atk',{kind:'cast',
 strike:{ms:310,do:[[0,'pose',{mU:4,mB:-1},160],[0,'fx','circle',{on:'af',ramp:ASTRAL,r:8,style:6,step:1,spin:-3,dur:300,glow:0}],[190,'pose',{mU:3,mB:2},50],[190,'fx','proj',{on:'a',dx:8,dy:-5,to:'t',kind:'shard',ramp:ASTRAL,ms:120,arc:0}]]},
 impact:[[0,'fx','shock',{ramp:ASTRAL,r0:13,r1:2,dash:1,dur:260}],[120,'fx','glint',{ramp:ASTRAL,s:1.1}],[0,'shake',2]]});

/* ---------- 3. 防御・走り出し ---------- */
BXS.def('cat:guard',{kind:'self',pre:{ms:140,do:[[0,'pose',{mL:-2,mS:2,mF:-1},100],[0,'fx','ward',{on:'a',ramp:'buff',r:12,dur:420}]]}});
{const _d=V19.dash;V19.dash=function(u,t,ms){try{if(u&&u.side===0&&u.A&&!u.A.none){const[x,y]=BX.at(u,'foot');BXP.dust(x,y,{n:3,dir:-BX.dir(u),s:.8});if(BXR.CH[u.id]&&BXR.CH[u.id].w<.8)BX.ghost(u,{col:'#dfe8ff',n:2,gap:40,a:.35});}}catch(e){}return _d(u,t,ms);};}

/* ---------- 4. 被弾 ---------- */
/* pw＝一撃の重さ（0.35〜1.7）。軽ければ身じろぎ、重ければ大きくのけぞって後ろへ弾かれる */
function react(t,pw,r){if(!t||t.side!==0||!t.A||t.A.none||!t.A.rig||!t.A.rig.spx)return false;const A=t.A,c=BXR.CH[t.id]||{w:1},k=Math.min(1.7,pw)/c.w;
 ANIM.to(t,{mL:-2-k*3,mB:-1-k,mR:Math.round(k*9),mF:-1-k*2.5,mS:k>1?-1:0},50);
 if(pw>1.15){const[x,y]=BX.at(t,'foot');BXP.dust(x,y,{n:4,dir:-BX.dir(t)});}
 const tk=A.hitT=(A.hitT||0)+1;setTimeout(()=>{if(A.hitT===tk&&!t._act&&t.alive)ANIM.idle(t,240);},(230+k*90)*ANIM.SP());return true;}

/* ---------- 5. 勝利 ---------- */
const T=ms=>ANIM.T(ms),to=(h,p,ms,e)=>ANIM.to(h,p,ms,e),fx=(n,h,w,o)=>{const[x,y]=BX.at(h,w);BXP[n](x+(o&&o.dx||0)*BX.dir(h),y+(o&&o.dy||0),o||{});};
const VICT={
 async rio(h){ANIM.move(h,0,0,340,'lin',8);await to(h,{mU:3,mB:-2,mS:-2},170);fx('glint',h,'head',{dx:4,dy:-2,ramp:'光',s:1.3});await to(h,{mB:-2,mS:-1,mU:1},200,'in');},/* 跳ねて剣を掲げる */
 async gald(h){await to(h,{mS:2,mL:1},220);fx('dust',h,'foot',{n:4});BX.shake(2);await to(h,{mS:-1,mB:-3},260,'out');},/* 剣を地に突き、胸を張る */
 async mire(h){for(let i=0;i<2;i++){ANIM.move(h,0,0,220,'lin',5);await to(h,{mS:-1,mU:1},110);await to(h,{mS:1},110);}fx('rise',h,'foot',{ramp:'炎',n:6,w:10});await to(h,{mB:-2,mS:-1},160);},/* 小さく二度跳ねる */
 async shion(h){ANIM.move(h,0,0,330,'lin',11);BX.ghost(h,{col:'#8ff0a8',n:4,gap:60});await to(h,{mR:-360,mU:2},330,'lin');await to(h,{mR:0,mS:1,mL:1},10);await to(h,{mL:1,mS:0},140);},/* 後ろへ宙返り */
 async noah(h){fx('rise',h,'foot',{ramp:'光',n:10,w:12,h:30});await to(h,{mU:4,mS:-1},420,'io');fx('shock',h,'head',{ramp:'光',r0:2,r1:9,sq:.3});await to(h,{mU:3,mS:-1,mB:-1},260);},/* 光に包まれて浮く */
 async erna(h){await to(h,{mL:-2,mB:-3},200);fx('glint',h,'head',{dx:6,dy:-4,ramp:'雷',s:1.2});await to(h,{mL:-1,mB:-2,mS:-1},240);},/* 弓を高く掲げる */
 async balza(h){await to(h,{mS:-2,mU:2},160);await to(h,{mS:3},70,'in');BX.shake(4);fx('dust',h,'foot',{n:6,s:1.2});fx('shock',h,'foot',{ramp:'地',r1:14,sq:.3,layer:0});await to(h,{mS:-1,mB:-2},260);},/* 足を踏み鳴らして笑う */
 async crow(h){fx('gather',h,'mid',{ramp:'闇',n:10,r:16,ms:420});await to(h,{mL:-2,mB:-1},420,'io');fx('orb',h,'mid',{dx:7,dy:-3,ramp:'闇',r:3,dur:420,orbit:4});await to(h,{mL:-1},200);},/* 静かに背を伸ばし、指先に火を灯す */
 async hakua(h){await to(h,{mF:5,mL:2},70,'in');fx('flare',h,'mid',{dx:10,ramp:'氷',s:.8,rays:6});await to(h,{mF:0},90);await to(h,{mF:5,mL:3,mB:2},70,'in');fx('flare',h,'mid',{dx:10,dy:-3,ramp:'氷',s:.8,rays:6,rot:.5});ANIM.move(h,0,0,260,'lin',7);await to(h,{mU:2,mS:-2,mB:-2},240);},/* 二連の突きから拳を突き上げる */
 async jin(h){for(let i=0;i<2;i++){ANIM.move(h,0,0,260,'lin',10);await to(h,{mS:-2,mB:-1},130);await to(h,{mS:2},130,'in');fx('dust',h,'foot',{n:3});}await to(h,{mS:-1,mB:-2},160);},/* 大きく二度跳ねる */
 async celes(h){fx('petals',h,'mid',{ramp:ASTRAL,n:10,r:10});await to(h,{mU:6,mL:-1},260,'io');fx('circle',h,'foot',{ramp:ASTRAL,r:10,style:6,step:2,dur:700});await to(h,{mU:5,mB:-1},300);},/* 高く浮き、星を散らす */
 async valk(h){await to(h,{mS:1,mB:3},200);BX.shake(5);fx('shock',h,'mid',{ramp:DRAGON,r0:4,r1:22,dur:380});fx('shock',h,'mid',{ramp:DRAGON,r0:2,r1:15,dur:320,delay:110});await to(h,{mS:-2,mB:-3,mL:-1},110,'out');await T(260);}};/* 身を沈めてから天へ咆える */
/* 勝利の動き（V19 の end から呼ばれる）。true を返すと従来の動きは出さない */
function victory(h,i){const f=VICT[h.id];if(!f||!h.A||h.A.none||!h.A.rig||!h.A.rig.spx)return false;f(h).catch(e=>console.error(e));return true;}

/* ---------- 6. 復活 ---------- */
function revive(u){if(!u||u.side!==0||!u.A||u.A.none)return false;const[x,y]=BX.at(u,'foot');BXP.pillar(x,y,{ramp:'heal',w:9,h:70,dur:520});BXP.rise(x,y,{ramp:'heal',n:12,w:14,h:32});BXP.shock(x,y,{ramp:'heal',r1:15,sq:.3,layer:0});
 ANIM.to(u,{mS:3,mB:5,mL:2},10);setTimeout(()=>{ANIM.to(u,{mS:-1,mB:-1,mU:1},260,'out');setTimeout(()=>{if(!u._act)ANIM.idle(u,240);},300*ANIM.SP());},60*ANIM.SP());return true;}

/* 差し込み */
V19.ext.react=react;V19.ext.victory=victory;
{const _p=V19.ext.popFx;V19.ext.popFx=function(u,s,kind){if(s==='REVIVE'||s==='奇跡！'){try{if(revive(u))return true;}catch(e){}}return _p(u,s,kind);};}
return{QUIRK,VICT,react,victory,revive,STEEL,DRAGON,ASTRAL};})();
