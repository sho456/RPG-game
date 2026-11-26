/* ===== 旧戦闘（ver0.49 のロマサガRS風）でセレスだけを今のコマ送りと演出で描く橋（CEL。ver0.63） =====
 絵：V19.dr（js/ver19.js の drawU）でセレスの 1 枚絵の代わりに TDA（js/td/uanim.js）のコマを足元に描く。
 演出：旧戦闘の doAction / hit / awaken を包み、TD の座標の「影の分身」（proxy）に出来事を出して TDFX・FXC・FXU（js/td/fx*.js）に描かせる。
 旧戦闘は幅 180 の小さな座標なので、TD の座標（セレスの背丈 86）との倍率 s を掛けて重ねる。数字・当たりの時刻は旧戦闘のまま。 */
'use strict';
const CEL=(()=>{
const ID='celes',M=new Map();let s=.34,last=0,on=false,clk=0;
/* 演出の時計：戦闘の速さに合わせて進む（×1 はゆっくり＝旧戦闘の wait と同じ倍率） */
const rate=()=>1.7/((typeof SPD!=='undefined'&&SPD[speed])||1.7),now=()=>clk;
const ST={get t(){return now();},fields:null,ev:[],S:{},get foes(){return B?B.enemies.filter(e=>e.alive).map(px):[];},get units(){return B?B.heroes.filter(h=>h.alive).map(px):[];}};
const isC=u=>u&&u.side===0&&u.id===ID&&typeof TDA!=='undefined'&&TDA.has(ID);
/* 旧のユニット → TD の座標の分身（足元の位置を倍率で割る） */
function px(u){let P=M.get(u);if(!P){P={id:u.id,side:u.side,uid:900+M.size,actK:null,actT:-9,hitT:-9,awT:0,mv:0,face:u.side?1:-1,hg:40,boss:!!u.boss,hp:1,mhp:1};
  if(u.side===0)try{P.h=TDD.hero(u.id,(G.h[u.id]||{}).lv||1,TDD.real(u.id));}catch(e){P.h={el:'陰',rng:200,sk:{k:'strike'},sks:[]};}M.set(u,P);}
 let fx=0,fy=0;try{const f=V19.foot(u),w=ANIM.world(u);fx=f[0]+w[0];fy=f[1]+w[1];}catch(e){fx=u.x;fy=u.y;}
 P.x=fx/s;P.y=fy/s;P.hp=u.hp;P.mhp=u.mhp;P.awT=u.aw?999:0;return P;}
const tdSk=(u,sk)=>{const P=px(u);let k=null;try{k=RSC.keyOf(sk);}catch(e){}return(P.h.sks||[]).find(x=>x.id===k)||null;};
const isOu=sk=>{try{const k=RSC.keyOf(sk);return!!sk.ougi||k===((RSD.AWX[ID]||{}).ou);}catch(e){return!!(sk&&sk.ougi);}};
function ev(e){try{TDFX.ev(e,ST);}catch(x){console.warn(x);}return e;}
function start(){if(on)return;on=true;try{TDFX.reset();TDA.clear();TDFX.bind({spr:()=>null,cam:()=>0,vw:()=>W/s});}catch(e){}}
/* 描く：セレスの足元 (X0,Y0)（画面の画素）に TDA のコマ。旧の背丈 h（論理）に合わせて倍率 s を決める */
V19.dr=function(u,X0,Y0,k,h){if(!isC(u)||!u.alive)return false;start();const p=Math.max(1,Math.round(k*2/3));s=Math.max(.05,h*p*1.1/(86*k));/* 旧の 1 ドット＝p 画素・座標の 1＝k 画素 */const P=px(u);
 ctx.save();ctx.setTransform(k*s,0,0,k*s,X0,Y0);const ok=TDA.draw(ctx,P,0,0,0,ctx.globalAlpha,ST);ctx.restore();return ok;};
/* 毎コマ：演出の層を旧戦闘の画面に重ねる */
{const _d=draw;draw=function(){_d();if(!on||scene!=='battle'||!B)return;const t=performance.now()/1000,dt=Math.min(.1,t-(last||t));last=t;clk+=dt*rate();
 try{TDFX.step(dt);const k=bK();ctx.save();ctx.setTransform(k*s,0,0,k*s,0,0);TDFX.back(ctx);TDFX.front(ctx);ctx.restore();}catch(e){}};}
/* 行動：通常攻撃＝atk、技・術＝cast（FXC）、奥義＝ult（FXU） */
{const _da=doAction;doAction=async function(u,sk,t){if(isC(u)&&sk){try{start();const P=px(u),tg=Array.isArray(t)?t[0]:t,f=tg&&tg.side===1?px(tg):(B.enemies.find(e=>e.alive)?px(B.enemies.find(e=>e.alive)):null),T=now();
  if(isOu(sk)){P.actK='ult';P.actT=T;ev({k:'ult',u:P,r:999,x:f?f.x:P.x-120,y:f?f.y:P.y});P.impT=T+1.1;}
  else{const ts=tdSk(u,sk);if(ts){P.actK='cast';P.actT=T;P.cs=ts;P._skDl=null;ev({k:'cast',u:P,sk:ts,f});P.impT=T+(P._skDl!=null?P._skDl:.35);}else{P.actK='atk';P.actT=T;P.impT=T+.25;}}}catch(e){console.warn(e);}}
 return _da(u,sk,t);};}
/* 命中：セレスの最初の命中は演出の着弾（impT）まで待って数字を出す（数字と光が同時） */
{const _h=hit;hit=async function(a,t,sk){try{if(isC(t))px(t).hitT=now();if(isC(a)&&t&&t.side===1){const P=px(a);if(P.impT!=null){const w=(P.impT-now())/rate();P.impT=null;if(w>0)await new Promise(r=>setTimeout(r,Math.min(1800,w*1000)));}const ts=sk?tdSk(a,sk):null;ev({k:'hit',u:px(a),f:px(t),v:0,sk:ts,big:isOu(sk)?1:0});}}catch(e){}return _h(a,t,sk);};}
{const _aw=awaken;awaken=async function(u){if(isC(u)){try{start();const P=px(u);P.actK='aw';P.actT=now();P.awT=999;ev({k:'aw',u:P});}catch(e){}}return _aw(u);};}
{const _sb=startBattle;startBattle=function(list,opts){on=false;M.clear();last=0;clk=0;return _sb(list,opts);};}
return{px,get s(){return s;}};})();
