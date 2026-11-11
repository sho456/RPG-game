/* ===== ver0.19 アニメーション管理 =====
 ユニットごとに状態（待機／行動中のポーズ補間／待機への復帰／移動／被弾の反動）を持つ。
 ・待機：リグごとの関数 IDLE[name](t) が、時刻からポーズを返す（呼吸・揺れ・しぐさを層で重ねる）
 ・行動：ANIM.to(u, ポーズ, ms, ease) でキーポーズへ「コマ送り」補間する（40ms刻み。ぼかさない）
 ・状態：瀕死・防御・戦闘不能・ブレイク・溜めは、待機ポーズへの上書きとして表現する
 ・区分：Idle / Run(ダッシュ) / Attack / Skill / Magic(Cast) / Guard / Hit / Knockback / Victory / Defeat(瀕死) / Death */
const ANIM=(()=>{
const SP=()=>SPD[speed]/1.7;
const T=ms=>new Promise(r=>setTimeout(r,Math.max(0,ms*SP())));
let now=0,last=0,freeze=0;
function tick(){const t=performance.now(),dt=Math.min(60,(t-last)||16);last=t;if(freeze>0){freeze-=dt;return;}now+=dt;}
const lerp=(a,b,t)=>a+(b-a)*t;
const EASE={lin:t=>t,out:t=>1-(1-t)*(1-t),out3:t=>1-Math.pow(1-t,3),in:t=>t*t,in3:t=>t*t*t,io:t=>t<.5?2*t*t:1-2*(1-t)*(1-t),back:t=>{const c=1.9;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);}};
const DISC={bl:1,ex:1,fx:1};
function mixPose(a,b,t){const o={};for(const k in b){const x=a[k],y=b[k];o[k]=Array.isArray(y)?(Array.isArray(x)?[lerp(x[0],y[0],t),lerp(x[1],y[1],t)]:y):(typeof y==='number'&&typeof x==='number'&&!DISC[k])?lerp(x,y,t):(t<.5&&x!=null?x:y);}return o;}

/* 敵ごとの派生形・倍率（色替えでも形や大きさを変える） */
const KIND={boss5:{extra:'fox',sc:1.75},tower20:{extra:'fox',sc:1.6},firedrake:{extra:'drake'},last2:{extra:'drake',sc:1.9},
 boss9:{rig:'wolf',extra:'dragon',sc:2.3,pal:{g:'#4a2222',G:'#1a0a0a',w:'#ff7038',x:'#ffe040'}},
 jelly:{extra:'jelly'},shade:{extra:'shade'},yukirei:{extra:'yuki'},ember:{extra:'spirit'},boss3:{extra:'priest'},boss6:{extra:'queen'}};
let look=null;const GS=1.2;/* 全体の表示倍率（ver0.18 の見た目の大きさに合わせる） */
function setup(u){const lk=look?look(u):null,sk0=sprKey(u),key=sk0+(lk?lk.k:'');let A=u.A;if(A&&A.key===key)return A;const inf=SPRX.info(sk0)||SPRX.info(u.spr);if(!inf){u.A=Object.assign(A||{},{none:1,key});return u.A;}
 const kd=(u.kind||u.spr||'').replace(/^vo_/,''),K=KIND[kd]||{},name=K.rig||inf.rig,R=RIG[name],boss=u.side===1&&u.sc>2;
 A=Object.assign(A||{wx:0,wy:0,kb:0,kbv:0,seed:((u.x|0)*37+(u.y|0)*91+(u.side?700:0))%4000,cur:null,act:null,rel:null,mv:null,flash:0},
  {none:0,key,rig:R,name,pal:(K.pal||lk)?Object.assign({},inf.pal,K.pal,lk&&lk.pal):inf.pal,palKey:key+(K.pal?'k':''),extra:K.extra||'',sc:GS*(K.sc||(boss?(R.type==='hum'?1.85:name==='boss'?1.28:1.5)*(u.sc/3):(R.nsc||1))),flip:u.side===1});
 u.A=A;return A;}
const base=A=>A.rig.type==='hum'?Object.assign({},HUM.D0,A.rig.pose):Object.assign({},A.rig.pose);
const swapH=(R,p)=>{if(R.wh!=='N'||!p)return p;const o=Object.assign({},p),a=p.hF,b=p.hN;if(a)o.hN=[a[0]+4,a[1]];else delete o.hN;if(b)o.hF=[b[0]-4,b[1]];else delete o.hF;return o;};

/* ---------- 待機モーション（キャラクター／種族ごとに別の関数） ---------- */
const IDLE={_:()=>({})};
const mk=(t)=>({S:(per,ph=0)=>Math.sin((t/per+ph)*6.2832),U:(per,ph=0)=>(Math.sin((t/per+ph)*6.2832)+1)/2,
 ev:(per,dur,ph=0)=>{const x=(t+ph*per)%per;return x<dur?x/dur:-1;},blink:(per=3300)=>((t%per)<120||((t+per*.45)%(per*2.3))<110)?1:0});
/* --- 味方 --- */
IDLE.rio=(t,u,A,b)=>{const{S,U,blink}=mk(t),bo=U(560)>.55?1:0;/* つま先で軽く弾む。剣先が呼吸で上下、襟巻きと髪がなびく */
 return{cr:b.cr+bo*.5,br:U(1120),wa:b.wa+S(1120)*.07,hF:[b.hF[0],b.hF[1]+bo*.5],sw:S(700)*1.2,q:U(350)>.5?1:0,bl:blink()};};
IDLE.gald=(t,u,A,b)=>{const{S,U,ev,blink}=mk(t),g=ev(5200,900);/* 重く深い呼吸。盾を構え直し、外套と羽根飾りがゆっくり揺れる */
 return{br:U(2100)*1.6,sw:S(1500)*1.3,q:U(750)>.5?1:0,hF:[b.hF[0]-(g>=0?Math.sin(g*3.14)*1.5:0),b.hF[1]+U(2100)*.6-(g>=0?Math.sin(g*3.14)*1.5:0)],wa:b.wa+S(2100,.25)*.04+(g>=0?Math.sin(g*3.14)*.12:0),cr:b.cr+U(2100)*.5,bl:blink(4100)};};
IDLE.mire=(t,u,A,b)=>{const{S,U,ev,blink}=mk(t),pg=ev(4200,520);/* 魔導書を読む。ときどき頁をめくり、書から魔力の粒が立つ */
 return{br:U(1650),sw:S(1300)*1.2,q:U(650)>.5?1:0,q2:pg>=0?(pg<.5?1:.5):0,hN:pg>=0?[b.hN[0]-1-Math.sin(pg*3.14)*3,b.hN[1]-1.5]:[b.hN[0],b.hN[1]+U(1650)*.5],hy:pg>=0?.5:0,fx:1+Math.floor(t/170)%7,bl:blink(3000)};};
IDLE.shion=(t,u,A,b)=>{const{S,U,ev,blink}=mk(t),bo=U(500),fl=ev(3600,380);/* 低い構えで小刻みに体を揺らす。短剣をくるりと回す癖 */
 return{cr:b.cr+bo*.9,x:S(1000)*1,br:U(500),sw:S(360)*1.6,wa:b.wa+S(500)*.14,wb:fl>=0?b.wb+fl*6.283:b.wb+S(500,.5)*.14,hN:fl>=0?[b.hN[0]+.5,b.hN[1]-2.5]:b.hN,fF:[b.fF[0]+S(1000)*.6,0],bl:blink(2600)};};
IDLE.noah=(t,u,A,b)=>{const{U,ev}=mk(t),tl=ev(4300,1100),bk=(t%5200)<220;/* ほぼ直立不動。機械的に首をかしげ、光輪だけが回り続ける */
 return{br:U(2700)*.6,hx:tl>=0?-.5:.5,hy:tl>=0?.5:0,q2:Math.floor(t/150)*.35,sw:U(2700)>.5?.5:0,fx:(t%1400)<450?1:0,bl:bk?1:0};};
IDLE.erna=(t,u,A,b)=>{const{S,U,ev,blink}=mk(t),ck=ev(4700,900),d=ck>=0?Math.sin(ck*3.14):0;/* 片足に体重をかけて立つ。弦の張りを確かめる。長い結い髪が揺れる */
 return{br:U(1500),sw:S(900)*1.5,dr:d*2.5,hF:[b.hF[0]-d*2,b.hF[1]-d*4],wa:b.wa-d*.9,hN:d>0?[b.hN[0]-4-d*1.5,b.hN[1]-3-d*2]:[b.hN[0],b.hN[1]+U(1500)*.4],ln:b.ln+S(3000)*.4,bl:blink(3700)};};
IDLE.balza=(t,u,A,b)=>{const{S,U,ev,blink}=mk(t),tp=ev(820,160),st=ev(6100,300);/* 腹で息をする。担いだ斧を肩で弾ませ、ひげが揺れる。ときどき足を踏み鳴らす */
 return{br:U(1400)*1.5,sw:S(1400)*.8,wa:b.wa+(tp>=0?.1:0),hF:[b.hF[0],b.hF[1]-(tp>=0?.5:0)],fF:st>=0?[b.fF[0],Math.sin(st*3.14)*2.5]:b.fF,cr:U(1400)*.6,fx:Math.floor(t/210)%3===0?1:0,bl:blink(3900)};};
IDLE.crow=(t,u,A,b)=>{const{S,U,blink}=mk(t);/* 猫背でゆらりと揺れる。裂けた裾が風に流れ、指先に呪いの火が巡る */
 return{ln:b.ln+S(2400)*.6,br:U(2400)*.8,sw:S(1100)*1.6,wa:b.wa+S(2400,.2)*.05,hN:[b.hN[0]-1+S(1800)*.6,b.hN[1]-1.5+S(900)*.8],fx:1+Math.floor(t/140)%9,hy:b.hy+U(2400)*.4,bl:blink(4500)};};
IDLE.hakua=(t,u,A,b)=>{const{S,U,ev,blink}=mk(t),bo=U(430),jb=ev(3100,180);/* 軽いフットワークで弾み、両拳を交互に揺らす。ときどき素早い牽制の突き */
 return{cr:b.cr+bo*1.1,br:bo,sw:S(430)*1.5,hF:jb>=0?[b.hF[0]-4,b.hF[1]]:[b.hF[0]+S(860)*.9,b.hF[1]+S(430)*.6],hN:[b.hN[0]-S(860)*.9,b.hN[1]+S(430,.5)*.6],fF:[b.fF[0]+S(860)*.5,0],fN:[b.fN[0]+S(860)*.5,0],ta:jb>=0?.12:0,fx:1+Math.floor(t/160)%6,bl:blink(2900)};};
IDLE.jin=(t,u,A,b)=>{const{S,U,ev,blink}=mk(t),sc=ev(6400,800),hop=ev(1350,260),pc=ev(7300,1500);/* のんびり立つ。頭をかく。足元でポポが跳ね、耳と尾を動かし、うろつく */
 return{br:U(1750)*1.1,sw:S(1500),hN:sc>=0?[b.hN[0]-1+Math.sin(sc*25)*.6,b.hN[1]-13]:[b.hN[0],b.hN[1]+U(1750)*.5],hx:sc>=0?.5:0,ln:b.ln+S(3500)*.4,
  pp:hop>=0?Math.sin(hop*3.14)*3:0,pe:(t%900)<120?1:0,pt:S(330)*1.2,ppx:pc>=0?-Math.sin(pc*3.14)*3:0,bl:blink(3500)};};
IDLE.celes=(t,u,A,b)=>{const{S,U,blink}=mk(t);/* 宙に浮いてゆっくり上下する。帽子の先と裾がなびき、砂時計の砂が落ち続ける */
 return{y:b.y+S(1900)*1.6,br:U(1900)*.7,sw:S(1300)*1.5,q:U(650)>.5?1:0,q2:Math.floor(t/600)%2,wa:b.wa+S(1900,.3)*.05,hN:[b.hN[0]+S(1900)*.5,b.hN[1]+S(950)*.5],bl:blink(3600)};};
IDLE.valk=(t,u,A,b)=>{const{S,U,ev,blink}=mk(t),sm=ev(2700,480);/* 肩で大きく息をする。翼が開閉し、尾が揺れ、口元から煙が漏れる */
 return{br:U(1850)*1.5,wg:U(1850,.1)*.6,sw:S(1200)*1.4,wa:b.wa+S(1850)*.03,hF:[b.hF[0],b.hF[1]+U(1850)*.5],cr:b.cr+U(1850)*.5,fx:sm>=0?1+Math.floor(sm*3):0,bl:blink(4300)};};
/* --- 敵 --- */
IDLE.slime=(t)=>{const{S,U,blink}=mk(t),w=S(760);/* ぷるぷる震える。つぶれて戻る、の繰り返し。中で泡が昇る */
 return{sq:w>0?w*.5:w*.28,lx:S(1520)*1.6,wb:Math.floor(t/240)%6,bb:Math.floor(t/200)%4,bl:blink(2800)};};
IDLE.wolf=(t,u,A)=>{const{S,U,ev,blink}=mk(t),ex=A.extra,gr=ev(5200,700),ef=ev(2700,140),sc=ev(4300,420);
 if(ex==='fox')return{br:U(1500),tl:S(1100)*2,hy:S(2200)*.8,er:ef>=0?-1:0,hx:S(4400)*.6,bl:blink(3400)};/* 妖狐：尾を扇のように揺らし、静かに佇む */
 if(ex==='drake'||ex==='dragon')return{br:U(1300)*1.3,wg:U(ex==='dragon'?1500:520),tl:S(900)*1.3,hy:S(1300)*1,jw:gr>=0?.9:0,fx:gr>=0?1+Math.floor(gr*6)%3:0,pt:gr>=0?-.6:0,bl:blink(3900)};/* 竜：羽ばたき、ときどき口から火が漏れる */
 return{br:U(520),tl:S(300)*1.3,hy:gr>=0?1.6:S(1400)*.9,hk:gr>=0?1:0,jw:gr>=0?.5:(U(260)>.6?.3:0),er:ef>=0?-1:0,fa:sc>=0?[-9-Math.sin(sc*3.14)*1.5,Math.sin(sc*3.14)*2.5]:[-9,0],pt:gr>=0?1:0,bl:blink(3100)};};/* 狼：荒い息、尾、耳。うなって身を低くし、前足で地面を掻く */
IDLE.golem=(t)=>{const{S,U,ev}=mk(t),dz=ev(3600,420);/* 巨体がゆっくり沈んでは持ち上がる。腕が遅れて揺れ、核が明滅し、砂がこぼれる */
 return{by:U(2300)*1.8,hy:U(2300,.12)*1,hF:[-6+S(2300,.2)*.8,17+U(2300,.15)*1.2],hN:[5-S(2300,.2)*.8,17+U(2300,.2)*1.2],gl:1+S(1400),dz:dz>=0?1+Math.floor(dz*3):0,ln:S(4600)*.6};};
IDLE.shroom=(t,u,A)=>{const{S,U,ev,blink}=mk(t),sp=ev(3300,1000);
 if(A.extra==='jelly'){const c=(t%1700)/1700,pu=c<.2?c/.2:1-(c-.2)/.8;return{y:-7+Math.sin(c*6.283)*2.5-pu*1.5,sq:pu*.7-.2,tn:t/330,ln:S(3400)*1.2,bl:blink(3600)};}/* 海月：傘をすぼめて進み、ゆっくり開く。触手がたなびく */
 return{sq:S(1040)*.4,ln:S(2080)*2.2,st:S(1040)>.3?1:0,ar:U(2080)*.25,sp:sp>=0?1+Math.floor(sp*6):0,bl:blink(3000)};};/* 茸：傘を左右に揺らし、ときどき胞子を散らす */
IDLE.bookghost=(t,u,A)=>{const{S,U,ev}=mk(t),pg=ev(2900,460);
 if(A.extra==='shade')return{y:-6+S(2600)*1.5,ws:t/520,ar:.1+U(2600)*.25,ey:U(1300)>.7?1:0,x:S(5200)*2};/* 影法師：ゆっくり伸び縮みし、爪をだらりと下げる */
 if(A.extra==='yuki')return{y:-9+S(1700)*2.5,ws:t/330,ar:.3+S(1700)*.25,ey:U(600)>.5?1:0,x:S(3400)*2.5};/* 雪霊：ふわりと舞い、結晶がまわりを巡る */
 if(A.extra)return{y:-9+S(1300)*3,ws:t/230,ar:.25+S(900)*.3,ey:U(520)>.5?1:0,x:S(2600)*1.5};/* 精霊：炎のようにゆらめき、漂う */
 return{y:-8+S(1650)*2.6,ws:t/380,fl:pg>=0?1+Math.floor(pg*3):0,op:U(1650)*1.2,ey:U(700)>.6?1:0,ar:.2+S(1250)*.2,tl:S(700)};};/* 書：宙に浮き、頁がひとりでにめくれ、霊体が揺らぐ */
IDLE.boss=(t)=>{const{S,U}=mk(t);/* 番人：浮遊。外套が漂い、目と胸の空洞が脈打つ。腕が呼吸のように開く */
 return{y:-5+S(2400)*2.2,cl:S(1400)*2.4,br:U(2400)*1.5,ey:U(800)>.5?1:0,gp:1+S(1800),hF:[-7-U(2400)*1.5,15-U(2400)*1],hN:[6+U(2400)*1.5,15-U(2400,.1)*1],hy:U(2400,.15)*1};};

/* ---------- 状態ポーズ（待機への上書き） ---------- */
const HST={low:{cr:5.5,ta:.42,hy:1,fF:[-4,0],fN:[5.5,0],hN:[1,8.5],hF:[-3,7.5]},guard:{cr:2,ta:.08,hF:[-4,1],hN:[-5,3],wa:1.85},
 dead:R=>({cr:R.B.leg-2.2,ta:1.42,hy:1.5,hx:.5,fF:[5,0],fN:[9.5,0],hF:[-6,2.5],hN:[-2,3],wa:.12,wb:3,bl:1,sw:0,y:R.pose&&R.pose.y<0?0:0,fx:0}),
 hit:{ta:-.3,cr:1.5,hx:1,hy:.5,hF:[1,3],hN:[4,3],ex:1,sw:-2,x:1.5}};
const MST={slime:{brk:{sq:.85,lx:2,bl:1},chg:{sq:-.45,mo:.7},hit:{sq:.65,lx:3,bl:1}},
 wolf:{brk:{pt:2.6,hy:3.5,er:-2,tl:-1,bl:1,jw:.4},chg:{pt:2,hk:1.6,jw:.6,hy:1,er:-1},hit:{pt:-1.2,hx:2,hy:-1.5,er:-2,bl:1,x:2}},
 golem:{brk:{by:4,ln:3,hy:3.5,gl:0,hF:[-5,19],hN:[6,19]},chg:{gl:2,by:1.5,hF:[-9,7],hN:[8,7],hy:-1},hit:{ln:-3.5,hy:1.5,by:1,x:1.5}},
 shroom:{brk:{sq:.9,ln:3,bl:1},chg:{sq:-.6,ar:1,sp:2},hit:{sq:.55,ln:-4,bl:1}},
 bookghost:{brk:{y:-2,op:-2,ar:-.3,ey:0},chg:{op:2.5,ey:1,ar:1,mo:1},hit:{y:-5,ar:.6,op:-1.5,x:2}},
 boss:{brk:{y:-1,ln:2.5,hy:4.5,ey:0,gp:0,hF:[-5,17],hN:[5,17]},chg:{gp:2,ey:2,hF:[-10,3],hN:[9,3],y:-8},hit:{ln:-3.5,hy:1.5,ey:0,x:1.5}}};
function stateMod(u,A,p,t){const R=A.rig;
 if(R.type==='hum'){if(!u.alive)return Object.assign(p,swapH(R,HST.dead(R)));if(u.side===0){if(u.guard)Object.assign(p,swapH(R,HST.guard));else if(u.hp<u.mhp*.25)Object.assign(p,swapH(R,HST.low),{br:(p.br||0)*1.6});}
  else{if(u.broken)Object.assign(p,swapH(R,HST.low));else if(u.charging)Object.assign(p,{ta:-.15,cr:2,x:(Math.floor(t/60)%2)*.6});}return p;}
 const M=MST[A.name]||{};if(u.broken&&M.brk)Object.assign(p,M.brk,{x:(Math.floor(t/90)%2)*.5});else if(u.charging&&M.chg)Object.assign(p,M.chg,{x:(Math.floor(t/60)%2)*.8});return p;}

function poseOf(u){const A=u.A,R=A.rig,b=base(A),stp=R.step||100,st=Math.floor((now+A.seed)/stp)*stp;
 let p=Object.assign(b,(IDLE[A.name]||IDLE._)(st*(u.aw?1.3:1),u,A,Object.assign({},b)));p=stateMod(u,A,p,st);
 if(A.act){const a=A.act;let k=(now-a.t0)/a.dur;if(k>=1)p=a.to;else{k=Math.ceil(k*a.n)/a.n;p=mixPose(a.from,a.to,EASE[a.ease](k));}}
 else if(A.rel){const a=A.rel;let k=(now-a.t0)/a.dur;if(k>=1)A.rel=null;else{k=Math.ceil(k*a.n)/a.n;p=mixPose(a.from,p,EASE.io(k));}}
 A.cur=p;return p;}
/* キーポーズへ補間する。pose はリグの基本姿勢への上書き */
function to(u,pose,ms,ease='out'){const A=setup(u);if(A.none)return T(ms);const from=A.cur||base(A),dur=Math.max(1,ms*SP());
 A.act={from,to:Object.assign(base(A),swapH(A.rig,pose)),t0:now,dur,ease,n:Math.max(1,Math.round(dur/42))};A.rel=null;return T(ms);}
function idle(u,ms=160){const A=u.A;if(!A||A.none||!A.act)return;const dur=Math.max(1,ms*SP());A.rel={from:A.cur||base(A),t0:now,dur,n:Math.max(1,Math.round(dur/42))};A.act=null;}
/* 立ち位置からの移動（戦場座標）。hop=跳ねの高さ */
function move(u,x,y,ms,ease='out',hop=0){const A=setup(u);if(A.none)return T(ms);A.mv={fx:A.wx,fy:A.wy,tx:x,ty:y,t0:now,dur:Math.max(1,ms*SP()),ease,hop};return T(ms);}
function world(u){const A=u.A;let hy=0;if(A.mv){const m=A.mv;let k=(now-m.t0)/m.dur;if(k>=1){A.wx=m.tx;A.wy=m.ty;A.mv=null;}else{const e=EASE[m.ease](k);A.wx=lerp(m.fx,m.tx,e);A.wy=lerp(m.fy,m.ty,e);hy=-Math.sin(k*3.1416)*m.hop;}}
 if(A.kb||A.kbv){A.kbv+=-A.kb*.3;A.kbv*=.62;A.kb+=A.kbv;if(Math.abs(A.kb)<.15&&Math.abs(A.kbv)<.15)A.kb=A.kbv=0;}
 return[A.wx+A.kb,A.wy,hy];}
function stop(ms){freeze=ms*SP();return T(ms);}
return{setLook(f){look=f;},T,SP,tick,setup,poseOf,to,idle,move,world,stop,base,KIND,IDLE,HST,MST,EASE,get now(){return now;},mixPose};})();
