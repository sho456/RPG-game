/* ===== ver0.19 ドット絵・待機モーション・戦闘演出の全面強化（戦闘への統合） =====
 既存の戦闘ロジック（ダメージ計算・行動順・星臨など）には手を入れず、
 hit / doAction / enemyTurn / kill … を包んで「見せ方」だけを差し込む。
 1. 戦闘画面の描画（ドットを整数倍で表示・重なり順・影・状態表示）
 2. 攻撃の振り付け（予備動作 → 踏み込み → 攻撃 → 命中・ヒットストップ → 反動 → 復帰）
 3. 被弾・ノックバック・撃破（溶けるように消える）・戦闘不能・勝利
 4. 他の画面（立ち絵・図鑑・行動順アイコン・カットイン）にも新しいドット絵を使う */
let PXL=2/3,DS=1;/* PXL=1ドットの大きさ（論理座標） DS=端末の画素密度に合わせた描き込み倍率（見た目の大きさは一定） */
const V19=(()=>{
const{T,to,idle,move,setup,stop}=ANIM;
const foot=u=>[u.x+8*u.sc,u.y+16*u.sc-2];
const dims=u=>{const A=setup(u);return A.none?{w:20,h:26}:{w:(A.rig.wid||22)*A.sc*DS*PXL,h:(A.rig.hgt||36)*A.sc*DS*PXL};};
const mid=u=>{const[fx,fy]=foot(u),A=u.A||{};return[fx+(A.wx||0),fy-dims(u).h*.5+(A.wy||0)];};
/* リグの見た目の大きさ（ドット）。演出の位置決めと影に使う */
for(const[k,w,h,st]of[['slime',28,22,90],['wolf',40,30,90],['golem',46,54,120],['shroom',34,38,100],['bookghost',36,44,100],['boss',44,62,110]])Object.assign(RIG[k],{wid:w,hgt:h,step:st});
RIG.golem.nsc=.86;/* 通常敵のゴーレムは少し小さく（上部の表示と重ならないように） */
for(const k in RIG)if(RIG[k].type==='hum')Object.assign(RIG[k],{wid:20,hgt:RIG[k].B.leg+RIG[k].B.tor+15,step:100});

/* ---------- 武器ごとの攻撃モーション（味方・人型の敵 共通） ----------
 w=予備動作 h=振り抜き wt,ht=所要ms arc=斬撃の弧 fx=命中エフェクトの種類 */
const RUN={ta:.3,cr:2,fF:[-6,2.5],fN:[6.5,0],hF:[2,4],hN:[4,4],sw:2.5};
const SW=[{w:{ta:-.2,cr:1,fF:[-4,0],fN:[5,0],hF:[3,-6],wa:2.5,hN:[-3,3],sw:1.5},wt:150,h:{ta:.42,cr:3.5,fF:[-7,0],fN:[6,0],hF:[-7,5],wa:-.5,hN:[4,5],sw:-2.5,ex:2,hx:-1},ht:60,arc:[-2.3,.7]},
 {w:{ta:.28,cr:3,fF:[-5,0],fN:[5,0],hF:[4,6],wa:-2.6,hN:[-2,4],sw:-1},wt:120,h:{ta:-.12,cr:.5,fF:[-6,0],fN:[5,0],hF:[-6,-4],wa:1,hN:[3,5],sw:2.5,ex:2},ht:60,arc:[1.2,-2]},
 {w:{ta:-.1,cr:2,hF:[4,1],wa:.1,hN:[-3,3],fF:[-3,0],fN:[5,0],sw:1},wt:120,h:{ta:.46,cr:3,hF:[-9,1],wa:.05,hN:[4,4],fF:[-9,0],fN:[6,0],ex:2,sw:-2.5},ht:50,fx:'thrust'}];
const SWH={w:{y:-12,ta:-.3,cr:3,fF:[-2,3],fN:[3,5],hF:[3,-7],wa:2.7,hN:[-2,-4],sw:2},wt:240,h:{y:0,ta:.55,cr:4.5,fF:[-7,0],fN:[6,0],hF:[-6,7],wa:-.9,hN:[4,6],ex:2,sw:-3},ht:70,arc:[-2.5,1],big:1};
const WP={
 sword:{fx:'slash',r:13,seq:SW,H:SWH},
 great:{fx:'slash',r:18,slow:1.4,seq:[SW[0],SW[1]],H:SWH,heavy:1},
 dual:{fx:'slash',r:10,slow:.75,seq:[
  {w:{ta:.2,cr:3,hF:[3,2],wa:.2,hN:[4,2],wb:2.8,sw:1},wt:90,h:{ta:.5,cr:3.5,hF:[-9,2],wa:.1,fF:[-8,0],fN:[5,0],hN:[4,3],wb:2.8,ex:2,sw:-2},ht:45,fx:'thrust'},
  {w:{ta:.3,cr:3,hN:[5,0],wb:2.6,hF:[-3,3],wa:.6},wt:80,h:{ta:.36,cr:3,hN:[-8,3],wb:.4,hF:[2,4],wa:2.8,fF:[-7,0],ex:2,sw:2},ht:45,arc:[-2.6,.2]},
  {w:{y:-6,ta:-.2,cr:3,hF:[3,-5],wa:2.4,hN:[4,-4],wb:2.2,fF:[-2,3],fN:[3,4]},wt:120,h:{y:0,ta:.5,cr:4,hF:[-7,6],wa:-.6,hN:[-6,5],wb:-.4,fF:[-7,0],fN:[5,0],ex:2},ht:50,arc:[1.6,-1.8]}],
  H:{w:{y:-9,ta:-.25,cr:3,hF:[3,-5],wa:2.4,hN:[4,-4],wb:2.2,fF:[-2,3],fN:[3,5]},wt:200,h:{y:0,ta:.55,cr:4,hF:[-8,5],wa:-.2,hN:[-6,6],wb:-.3,fF:[-8,0],fN:[5,0],ex:2},ht:55,fx:'thrust',big:1}},
 axe:{fx:'slash',r:15,slow:1.3,heavy:1,seq:[
  {w:{ta:-.28,cr:1,hF:[3,-6],wa:2.3,hN:[1,-5],fF:[-3,0],fN:[5,0]},wt:190,h:{ta:.5,cr:2.5,hF:[-7,6],wa:-.6,hN:[-5,6],fF:[-6,0],fN:[5,0],ex:2},ht:70,arc:[-2.4,1],fx:'slam'},
  {w:{ta:.2,cr:2,hF:[5,3],wa:3.2,hN:[2,4]},wt:170,h:{ta:.1,cr:2,hF:[-8,2],wa:.1,hN:[-4,4],fF:[-6,0],ex:2},ht:70,arc:[2.6,-.4]}],
  H:{w:{y:-9,ta:-.3,cr:2,hF:[3,-7],wa:2.5,hN:[1,-6],fF:[-2,3],fN:[3,4]},wt:260,h:{y:0,ta:.55,cr:3,hF:[-6,7],wa:-.9,hN:[-5,7],fF:[-6,0],fN:[5,0],ex:2},ht:70,arc:[-2.5,1],fx:'slam',big:1}},
 scythe:{fx:'slash',r:19,slow:1.25,seq:[
  {w:{ta:-.1,cr:1,hF:[5,1],wa:3,hN:[2,3],fF:[-3,0],fN:[5,0],sw:2},wt:180,h:{ta:.42,cr:2.5,hF:[-7,3],wa:.2,hN:[-3,5],fF:[-7,0],fN:[5,0],ex:2,sw:-3},ht:70,arc:[-2.9,.5]},
  {w:{ta:.3,cr:2,hF:[3,6],wa:-2.4,hN:[1,5],sw:-2},wt:150,h:{ta:-.1,cr:1,hF:[-6,-3],wa:1.2,hN:[-2,3],fF:[-6,0],ex:2,sw:3},ht:70,arc:[1.6,-2.4]}],
  H:{w:{y:-8,ta:-.3,cr:2,hF:[5,-4],wa:2.9,hN:[2,-2],fF:[-2,3],fN:[3,4],sw:3},wt:250,h:{y:0,ta:.5,cr:3,hF:[-7,5],wa:-.3,hN:[-3,6],fF:[-7,0],fN:[5,0],ex:2,sw:-3},ht:70,arc:[-3,.9],big:1}},
 fist:{fx:'fist',r:9,slow:.7,seq:[
  {w:{ta:.1,cr:2.5,hF:[2,1],hN:[-1,2]},wt:70,h:{ta:.36,cr:2.5,hF:[-9.5,-.5],hN:[2,3],fF:[-7,0],fN:[4,0],ex:2,sw:-2},ht:40},
  {w:{ta:.2,cr:2.5,hN:[5,1],hF:[-4,1]},wt:70,h:{ta:.52,cr:3,hN:[-9.5,0],hF:[1,3],fF:[-7,0],fN:[5,0],ex:2,sw:2},ht:40},
  {w:{ta:-.2,cr:1,fF:[-2,5],hF:[1,2],hN:[3,2]},wt:90,h:{ta:-.36,cr:0,fF:[-11,11],hF:[3,3],hN:[4,2],ex:2,sw:3},ht:45,kick:1},
  {w:{ta:.4,cr:5,hF:[1,6],hN:[2,4]},wt:90,h:{ta:-.1,cr:0,y:-4,hF:[-6,-8],hN:[3,5],fF:[-4,2],fN:[4,0],ex:2,sw:-2},ht:45}],
  H:{w:{y:-11,ta:-.2,cr:3,fF:[-3,5],fN:[3,3],hF:[1,2],hN:[3,1],sw:2},wt:210,h:{y:-2,ta:-.4,cr:0,fF:[-12,5],fN:[5,2],hF:[3,3],hN:[5,1],ex:2,sw:3},ht:60,kick:1,big:1}},
 claw:{fx:'claw',r:10,slow:.9,seq:[
  {w:{ta:-.15,cr:1,hF:[1,-7],wa:1.2,hN:[3,5]},wt:120,h:{ta:.42,cr:3,hF:[-8,5],wa:-.3,hN:[4,5],fF:[-7,0],ex:2},ht:50},
  {w:{ta:.1,cr:2,hN:[5,-5],wb:1.4,hF:[-3,4]},wt:100,h:{ta:.46,cr:3,hN:[-8,5],wb:-.2,hF:[2,5],fF:[-7,0],ex:2},ht:50}],
  H:{w:{y:-9,ta:-.25,cr:3,hF:[1,-7],wa:1.3,hN:[3,-6],wb:1.3,fF:[-2,3],fN:[3,4]},wt:220,h:{y:0,ta:.5,cr:4,hF:[-8,5],wa:-.3,hN:[-6,6],wb:-.3,fF:[-7,0],ex:2},ht:60,big:1}}};
WP.staff={fx:'fist',r:9,seq:[{w:{ta:-.2,hF:[2,-5],wa:2.2,hN:[-1,2]},wt:150,h:{ta:.4,cr:2,hF:[-7,4],wa:-.1,hN:[3,5],fF:[-6,0],ex:2},ht:60}]};WP.book=WP.staff;WP.bow=WP.staff;
const BOW={aim:{ta:-.05,hF:[-8,0],wa:.03,hN:[-8,.5],dr:0,ar:1,fF:[-5,0],fN:[4,0]},draw:{ta:-.16,hF:[-8,0],wa:.03,hN:[-2.5,-.5],dr:5.5,ar:1,fF:[-5,0],fN:[4.5,0],sw:-1},loose:{ta:-.05,hF:[-8.5,.5],wa:.03,hN:[1,-2],dr:0,ar:0,fF:[-5,0],fN:[4,0],sw:2}};
const CAST={staff:{a:{ta:-.12,hF:[-3,-4],wa:1.55,hN:[-4,1],hy:-.5,fx:1},b:{ta:.2,hF:[-8,0],wa:1,hN:[2,5],ex:2,fx:1}},
 book:{a:{ta:-.1,hF:[-5,1],hN:[-5,-5],q2:1,fx:3},b:{ta:.16,hF:[-5,2],hN:[-9,0],q2:1,ex:2,fx:5}},
 scythe:{a:{ta:-.1,hN:[-3,-5],hF:[-1,6],fx:3},b:{ta:.28,hN:[-9,0],ex:2,fx:6}},
 _:{a:{ta:-.12,hN:[-4,-5],cr:1},b:{ta:.22,hN:[-9,0],cr:2,ex:2}}};
const VIC={a:{ta:-.12,y:-6,hF:[-2,-7],wa:1.6,hN:[4,1],ex:2,fF:[-3,2],fN:[3,3]},b:{ta:-.08,hF:[-2,-7],wa:1.6,hN:[4,2],ex:2}};
const AWK={ta:-.25,cr:1.5,hF:[-5,-1],hN:[5,-1],ex:2,hy:-1,fF:[-5,0],fN:[5,0]};
/* ---------- 種族ごとの攻撃モーション（敵） ---------- */
const MA={
 slime:{ap:{ms:260,hop:9},atk:{w:{sq:.75,lx:2},wt:150,h:{sq:-.8,lx:-3,x:-4,y:-4,mo:1},ht:70,fx:'fist'},
  slam:{w:{sq:.85},wt:170,m:{y:-20,sq:-.75,lx:-1},mt:170,h:{y:0,sq:1,mo:1},ht:80,fx:'slam'},cast:{w:{sq:.6,mo:.5},h:{sq:-.6,mo:1,lx:-2}}},
 wolf:{ap:{ms:230,hop:6},atk:{w:{pt:-1.6,fa:[-8,7],fb:[-5,4],hy:-2,er:-1,hk:1,x:2},wt:150,h:{pt:2.2,fa:[-14,1],hx:-2,hy:1,jw:.5,x:-4,hk:1},ht:60,fx:'claw'},
  bite:{w:{pt:1.6,hx:2,hy:1,hk:1.4,x:3,jw:.3,er:-1},wt:170,m:{pt:1,hx:-4,hy:0,jw:1.3,x:-5},mt:60,h:{pt:1,hx:-5,hy:.5,jw:0,x:-6},ht:40,fx:'bite'},
  cast:{w:{pt:1.5,hy:1.5,hk:1.5,jw:.2,wg:.2},h:{pt:-1.2,hy:-4,hx:1,jw:1.3,er:-1,tl:1,wg:1,fx:2}}},
 golem:{ap:{ms:380,hop:3,stomp:1},atk:{w:{ln:-3.5,by:-1,hN:[2,-13],hy:-1,gl:2},wt:260,h:{ln:5.5,by:2.5,hN:[-22,16],hy:1.5,dz:2},ht:80,fx:'slam',big:1},
  cast:{w:{hF:[-10,2],hN:[-6,0],gl:2,ln:-1.5,by:1},h:{hF:[-14,-2],hN:[-10,-3],gl:2,ln:2}}},
 shroom:{ap:{ms:260,hop:5},atk:{w:{sq:.6,ln:-4,ar:.6},wt:160,h:{sq:-.5,ln:7,x:-5,mo:1,ar:1},ht:60,fx:'fist'},cast:{w:{sq:.8,ar:1,sp:2,mo:.6},h:{sq:-.6,ar:1,sp:5,mo:1}}},
 bookghost:{ap:{ms:260,hop:0},atk:{w:{ar:1,y:-13,op:1},wt:170,h:{ar:-.3,x:-6,y:-5,mo:1,op:-1},ht:60,fx:'claw'},cast:{w:{op:2.5,fl:2,ar:.6,ey:1},h:{op:2.5,fl:3,ar:1,ey:1,mo:1}}},
 boss:{ap:{ms:340,hop:0},atk:{w:{ln:-3.5,hN:[4,-13],hy:-1,ey:2,y:-8},wt:230,h:{ln:5.5,hN:[-21,10],ey:2,y:-3},ht:70,fx:'claw',big:1},
  cast:{w:{hF:[-10,3],hN:[9,2],gp:2,ey:2,cl:2,y:-8},h:{hF:[-13,-3],hN:[11,-5],gp:2,ey:2,cl:-2,y:-9}}}};
const EAK={claw:'atk',bite:'bite',press:'slam',slam:'slam',slash2:'atk',dslash:'atk'};
let EAN=null;const eaKey=sk=>{if(!EAN||!EAN.has(sk)){EAN=new Map();for(const k in EA)EAN.set(EA[k],k);}return EAN.get(sk);};
const PHYS=['斬','打','突'],elCol=el=>ELC[el]||'#ffffff';

/* ---------- 振り付け ---------- */
let CUR=null,LAST=null;
function near(u,t){const[tx,ty]=foot(t),[ux,uy]=foot(u),dir=u.side===0?1:-1;return[tx+dir*(dims(t).w*.5+dims(u).w*.5+1)+((t.A&&t.A.wx)||0)-ux,ty+1-uy];}
async function dash(u,t,ms){const A=u.A,R=A.rig;if(R.type==='hum'){to(u,RUN,ms*.4);await move(u,...near(u,t),ms,'out');}
 else{const ap=(MA[A.name]||{}).ap||{ms:260,hop:4};await move(u,...near(u,t),ms||ap.ms,'io',ap.hop);if(ap.stomp){B.shake=Math.max(B.shake,5);FX19.smash(foot(u)[0]+A.wx,foot(u)[1]+A.wy,'#b8a888',{size:.7});}}}
const styleOf=(u,sk)=>{const A=u.A,k=sk.k;if(A.rig.type!=='hum')return k==='mag'?'cast':'melee';if(['mag','reso','zen','release','release2','pct'].includes(k))return'cast';return A.rig.wp==='bow'?'shoot':'melee';};
const NOHIT=['guard','kenshu','taunt','healAll','guardRegen','item','roar','charge','haste','cheer','grace','scan','reviveAll','barrier','revive','heal','rewind','tstop'];
/* 行動の開始：味方（技は分かっている） */
async function pre(u,sk,t){const A=setup(u);if(A.none||!u.alive)return;const c=u._act={sk,n:0};
 if(NOHIT.includes(sk.k)||(sk.k!=='phys'&&sk.k!=='mag'&&!['reso','zen','release','release2','pct','rhythm'].includes(sk.k)&&sk.pow==null)){c.sup=1;
  const[mx,my]=mid(u),[fx,fy]=foot(u),hs=B.heroes.filter(h=>h.alive);
  if(sk.k==='guard'||sk.k==='kenshu'){FX19.shield(mx,my,sk.k==='kenshu'?'#ffd65a':'#c8d8ff');return;}
  const cp=CAST[A.rig.wp]||CAST._;to(u,cp.a,180);const col=sk.k==='taunt'?'#ff8a5a':sk.k==='roar'?'#ffb030':['heal','healAll','revive','reviveAll','guardRegen'].includes(sk.k)?'#7dffa8':'#ffe27a';
  FX19.circle(fx,fy,col,{dur:650});FX19.gather(mx,my-4,col,10,300);await T(230);to(u,cp.b,90,'in');
  if(sk.k==='reviveAll')B.heroes.forEach(h=>FX19.pillar(...foot(h)));
  else if(sk.k==='barrier')hs.forEach(h=>FX19.shield(...mid(h)));else if(sk.k==='taunt'){FX19.ring(mx,my,'#ff8a5a',{r1:18});FX19.ring(mx,my,'#ffffff',{r1:12,delay:90});}
  else if(sk.k==='roar')aliveE().forEach(e=>FX19.ring(...mid(e),col,{r1:14,dash:1}));else if(sk.k==='rewind')hs.forEach(h=>FX19.ring(...mid(h),'#d8c8ff',{r0:16,r1:2}));
  return;}
 c.style=sk.k==='rhythm'?'melee':styleOf(u,sk);
 if(c.style==='melee'){const tg=sk.t==='all'?aliveE()[0]:(t&&t.alive?t:aliveE()[0]);if(tg){c.last=tg;c.ready=dash(u,tg,200);}}
 else if(c.style==='shoot'){c.ready=to(u,BOW.aim,160);}
 else{const cp=CAST[A.rig.wp]||CAST._,big=(sk.pow||0)>=2||sk.t==='all'||sk.k!=='mag',col=elCol(sk.el),[fx,fy]=foot(u),[mx,my]=mid(u);c.big=big;
  to(u,cp.a,200);FX19.circle(fx,fy,col,{dur:big?900:650,r:big?17:13});FX19.gather(mx-4,my-6,col,big?18:10,big?460:300);
  c.ready=(async()=>{await T(big?430:270);await to(u,cp.b,90,'in');})();}}
/* 1撃ぶんの攻撃動作。戻り値を待ってから命中処理に入る */
async function strike(a,t,sk){const c=a._act,A=a.A;if(!c||!A||A.none||!a.alive)return;c.n++;const first=c.n===1,R=A.rig,hum=R.type==='hum';c.fx=null;
 if(c.style==null){c.style=styleOf(a,sk);if(c.style==='cast'){c.big=(sk.pow||0)>=2;}}
 if(hum&&c.style==='melee'){if(c.ready){await c.ready;c.ready=null;}else if(first||c.last!==t)await dash(a,t,first?200:110);c.last=t;
  const S=WP[R.wp]||WP.sword,heavy=first&&!sk.hits&&sk.t==='one'&&((sk.pow||0)>=2||(sk.fixed!=null))&&S.H,v=heavy?S.H:S.seq[(c.n-1)%S.seq.length],m=(S.slow||1)*(c.n>1?.62:1);
  if(v.w.y)move(a,A.wx,A.wy,(v.wt+v.ht)*m,'lin',0);
  await to(a,v.w,v.wt*m,'out');await to(a,v.h,v.ht*m,'in');c.fx={type:v.fx||S.fx,arc:v.arc,r:S.r,big:v.big||S.heavy,kick:v.kick};return;}
 if(hum&&c.style==='shoot'){if(c.ready){await c.ready;c.ready=null;}await to(a,BOW.draw,first?210:110,'out');await T(first?90:20);to(a,BOW.loose,50);
  const[ax,ay]=mid(a),[tx,ty]=mid(t),d=a.side===0?-1:1;await FX19.proj(ax+d*8,ay-3,tx,ty,'arrow',elCol(sk.el),130);to(a,BOW.aim,140);c.fx={type:'pierce'};return;}
 if(hum){/* 術：詠唱は最初の1回だけ。全体術は1人ずつ着弾する */
  if(c.ready){await c.ready;c.ready=null;}else if(first){const cp=CAST[R.wp]||CAST._,col=elCol(sk.el),[fx,fy]=foot(a);to(a,cp.a,200);FX19.circle(fx,fy,col,{dur:700,r:c.big?17:13});FX19.gather(...mid(a),col,12,320);await T(c.big?430:290);await to(a,cp.b,90,'in');}
  if(sk.basic||(first&&sk.t==='one'&&!c.big)){const[ax,ay]=mid(a),[tx,ty]=mid(t);await FX19.proj(ax+(a.side===0?-6:6),ay-3,tx,ty,'bolt',elCol(sk.el),150);}
  c.fx={type:'elem',big:c.big};return;}
 /* 敵（人型以外） */
 const M=MA[A.name]||MA.slime,phys=sk.k!=='mag',kind=phys?(EAK[eaKey(sk)]||'atk'):'cast',cl=M[kind]||M.atk;
 if(phys){if(first||c.last!==t)await dash(a,t,first?0:130);c.last=t;await to(a,cl.w,cl.wt,'out');if(cl.m){if(cl.m.y)move(a,A.wx,A.wy,cl.mt+cl.ht,'lin',0);await to(a,cl.m,cl.mt,'out');}await to(a,cl.h,cl.ht,'in');
  c.fx={type:cl.fx,big:cl.big||(sk.pow||0)>=1.4,r:Math.min(20,dims(a).w*.45),mon:A.name};return;}
 if(first){const big=(sk.pow||0)>=2,col=elCol(sk.el),[fx,fy]=foot(a),[mx,my]=mid(a);c.big=big;to(a,cl.w,240);FX19.circle(fx,fy,col,{dur:big?1000:700,r:Math.max(13,dims(a).w*.6)});FX19.gather(mx,my,col,big?22:12,big?520:320);
  if(big){B.flashBg=Math.max(B.flashBg||0,8);B.flashCol=col;}await T(big?560:330);await to(a,cl.h,100,'in');if(sk.t==='one'){const[tx,ty]=mid(t);await FX19.proj(mx+8,my,tx,ty,'bolt',col,160);}}
 c.fx={type:'elem',big:c.big};}
/* 行動の終わり：元の位置へ跳んで戻る */
async function finish(u){const c=u._act;u._act=null;const A=u.A;if(!A||A.none)return;
 if(A.wx||A.wy||A.mv){if(A.rig.type==='hum'&&u.alive)to(u,{ta:-.12,cr:2,fF:[-3,2],fN:[4,3],sw:-2},120);await move(u,0,0,A.rig.type==='hum'?210:280,'io',A.name==='golem'||A.name==='boss'||A.name==='bookghost'?1:6);}
 idle(u,200);}

/* 命中した瞬間：被弾ポーズ・ノックバック・エフェクト・揺れ */
function onHurt(t,d){const A=t.A;if(!A||A.none)return;const c=CUR&&CUR.a._act,sk=CUR?CUR.sk:{},r=LAST||{},fx=(c&&c.fx)||{type:sk.k==='mag'?'elem':'burst'},away=t.side===0?1:-1,[x,y]=mid(t),[fx0,fy0]=foot(t),D=dims(t),col=elCol(sk.el);
 if(!d){A.kbv+=away*2.4;return;}
 const pw=Math.max(.35,Math.min(1.7,d/t.mhp*5+(r.crit?.5:0)+(fx.big?.4:0)))*(t.guard?.4:1)*(t.boss?.55:1);A.flash=5;A.kbv+=away*pw*2.6;
 if(t.alive&&t.hp>0&&!t.guard){const hp=A.rig.type==='hum'?ANIM.HST.hit:(ANIM.MST[A.name]||{}).hit;if(hp){to(t,hp,50);const tk=A.hitT=(A.hitT||0)+1;setTimeout(()=>{if(A.hitT===tk&&!t._act&&t.alive)idle(t,220);},260*ANIM.SP());}}
 const sc=Math.max(.8,Math.min(1.8,D.h/24)),flip=CUR&&CUR.a.side===1;
 switch(fx.type){
  case'slash':{let[a0,a1]=fx.arc||[-2.3,.7];if(flip){a0=3.1416-a0;a1=3.1416-a1;}FX19.slash(x,y,{a0,a1,r:(fx.r||13)*(fx.big?1.25:1),w:fx.big?4.6:3.2,col:PHYS.includes(sk.el)||!sk.el?'#e8f0ff':col,dur:fx.big?280:220});FX19.spray(x,y,fx.big?9:5,['#ffffff',col],1.5,.06,16);if(!PHYS.includes(sk.el)&&sk.el)FX19.elem(sk.el,x,y,.65*sc);break;}
  case'thrust':case'pierce':FX19.thrust(x,y,flip?1:-1,col);FX19.burst(x,y,col,{size:.8,rays:6,rot:.4});if(!PHYS.includes(sk.el)&&sk.el)FX19.elem(sk.el,x,y,.6*sc);break;
  case'claw':FX19.claw(x,y,flip?1:-1,PHYS.includes(sk.el)||!sk.el?'#ffd8d0':col,{size:fx.big?1.5:1});FX19.spray(x,y,6,['#ffffff','#ff8a7a'],1.4,.08,16);break;
  case'bite':FX19.bite(x,y,'#ffe8e0',{size:fx.big?1.4:1});FX19.spray(x,y,5,['#ff6a5a','#ffffff'],1.2,.1,18);break;
  case'slam':FX19.smash(x,fy0,PHYS.includes(sk.el)||!sk.el?'#d8c8a8':col,{size:fx.big?1.4:1});FX19.burst(x,y,'#ffffff',{size:1.2});if(!PHYS.includes(sk.el)&&sk.el)FX19.elem(sk.el,x,y,.7*sc);break;
  case'fist':FX19.burst(x,y,PHYS.includes(sk.el)||!sk.el?'#ffe9a0':col,{size:fx.big?1.5:1,rays:fx.kick?10:8,rot:(c?c.n:0)*.5});FX19.ring(x,y,'#ffffff',{r0:1,r1:fx.big?15:10,dur:200});if(!PHYS.includes(sk.el)&&sk.el)FX19.elem(sk.el,x,y,.6*sc);break;
  case'elem':FX19.elem(PHYS.includes(sk.el)?'':sk.el,x,y+D.h*.18,sc*(fx.big?1.3:1));if(PHYS.includes(sk.el))FX19.slash(x,y,{col:'#e8f0ff'});break;
  default:FX19.burst(x,y,col,{size:1.1});}
 if(r.crit){FX19.burst(x,y,'#ffe14a',{size:1.9,rays:12,dur:300});FX19.ring(x,y,'#ffe14a',{r1:22,dur:320});}
 if(r.weak)FX19.ring(x,y,'#ffb030',{r0:3,r1:17,dur:280,dash:1,thick:2});
 if(t.guard)FX19.shield(x,y,'#c8d8ff');
 B.shake=Math.max(B.shake||0,Math.round(2+pw*5+(r.crit?5:0)+(fx.big?3:0)));}

/* ---------- 既存関数を包む ---------- */
{const _c=calc;calc=function(a,t,sk){const r=_c(a,t,sk);LAST=r;return r;};}
{const _h=hurt;hurt=function(t,d){const r=_h(t,d);try{onHurt(t,r);}catch(e){console.error(e);}return r;};}
{const _hit=V17F.hit;hit=async function(a,t,sk){try{await strike(a,t,sk);}catch(e){console.error(e);}
  const n0=B.fx.length,was=t.alive;CUR={a,sk};LAST=null;const pr=_hit(a,t,sk);B.fx.length=Math.min(B.fx.length,n0);const r=LAST||{},c=a._act,big=c&&c.fx&&c.fx.big;CUR=null;
  await stop(a._act&&a._act.n>1&&sk.hits?26:38+(r.crit?70:0)+(r.weak?28:0)+(big?55:0));return pr;};}
{const _da=V17F.doAction;doAction=async function(u,sk,t){try{await pre(u,sk,t);}catch(e){console.error(e);}try{return await _da(u,sk,t);}finally{try{await finish(u);}catch(e){console.error(e);}}};}
{const _et=V17F.enemyTurn;enemyTurn=async function(e){setup(e);e._act={n:0};const ch0=e.charging;try{const pr=_et(e);if(!ch0&&e.charging&&e.A&&!e.A.none){const[x,y]=mid(e);FX19.gather(x,y,'#ffb030',20,500);FX19.ring(x,y,'#ffb030',{r0:20,r1:3,dur:420});}return await pr;}finally{try{await finish(e);}catch(x){console.error(x);}}};}
{const _k=V17F.kill;kill=async function(t){const boss=t.side===1&&t.boss,pr=_k(t),A=t.A;if(!t.alive&&A&&!A.none){
   if(t.side===1){A.dead={t0:ANIM.now,dur:(boss?1700:680)*ANIM.SP()};A.dcv=null;const[x,y]=mid(t),D=dims(t);FX19.burst(x,y,'#ffffff',{size:1.6,rays:10});FX19.ring(x,y,'#d8c8ff',{r1:20});
    if(boss){/* ボス撃破：連鎖する爆発と長い崩壊（ver0.18 の演出を引き継ぐ） */B.shake=30;B.flashBg=30;B.flashCol='#ffffff';try{SFX.brk();}catch(e){}setTimeout(()=>{try{SFX.brk();}catch(e){}},260*SPD[speed]);
     for(let k=0;k<7;k++){const ex=x+(Math.random()-.5)*D.w*.7,ey=y+(Math.random()-.5)*D.h*.6;FX19.burst(ex,ey,k%2?'#ffb070':'#ffffff',{size:1.7,rays:10,delay:k*150});FX19.ring(ex,ey,'#ff9a40',{r1:17,delay:k*150});}await pr;await wait(900);return;}}
   else{A.hitT=(A.hitT||0)+1;to(t,ANIM.HST.dead(A.rig),420,'in');}}return pr;};}
{const _db=doBreak;doBreak=async function(t,a){const pr=_db(t,a),A=t.A;if(A&&!A.none){const[x,y]=mid(t);FX19.burst(x,y,'#ffffff',{size:2.2,rays:14,dur:340});FX19.ring(x,y,'#7fd6ff',{r1:26,dur:380,thick:2});FX19.ring(x,y,'#ffffff',{r1:18,dur:300,delay:70});FX19.spray(x,y,16,['#ffffff','#7fd6ff','#ffe14a'],2.2,.1,26);A.kbv+=(t.side===0?1:-1)*4;B.flashBg=Math.max(B.flashBg||0,7);}return pr;};}
{const _aw=V17F.awaken;awaken=async function(u){const pr=_aw(u);B.shake=10;try{const A=setup(u);if(!A.none){const cv2=document.querySelector('#cut canvas');if(cv2)cutArt(cv2,u.spr+'_aw');
   to(u,AWK,220,'back');const[x,y]=mid(u),[fx,fy]=foot(u);FX19.pillar(fx,fy,'#ffe27a');FX19.circle(fx,fy,'#ffe27a',{dur:1200,r:18});FX19.gather(x,y,'#ffe27a',24,600);FX19.ring(x,y,'#ffffff',{r1:26,dur:420,delay:200});}}catch(e){console.error(e);}
  try{return await pr;}finally{idle(u,260);}};}
{const _rs=reso;reso=async function(u){const pr=_rs(u);try{document.querySelectorAll('#cut canvas[data-id]').forEach(c=>cutArt(c,c.dataset.id+'_aw'));resoPair().forEach(h=>{const A=setup(h);if(A.none)return;to(h,AWK,220,'back');const[fx,fy]=foot(h);FX19.circle(fx,fy,'#ff9ad6',{dur:1500,r:18});FX19.gather(...mid(h),'#ffffff',20,700);});}catch(e){console.error(e);}
  try{return await pr;}finally{B.heroes.forEach(h=>{if(h!==u&&h.A&&h.A.act)idle(h,260);});}};}
{const _end=V17F.end;end=async function(win){if(win&&B){try{B.heroes.forEach((h,i)=>{if(!h.alive||!h.A||h.A.none)return;setTimeout(async()=>{move(h,0,0,380,'lin',7);await to(h,VIC.a,180,'out');await to(h,VIC.b,200,'in');},i*90);});await T(820);}catch(e){console.error(e);}}const r=await _end(win);try{if(win&&B&&/レベルアップ/.test($('#ov').innerHTML))B.heroes.forEach(h=>{if(h.alive&&h.A&&!h.A.none)FX19.buff(...mid(h));});}catch(e){}return r;};}
/* 回復・復活・補助などの文字ポップに合わせてエフェクトを出す（ver0.18 の仕組みを新エフェクトで引き継ぐ） */
pop=function(u,txt,col,small,kind,el){V17F.pop(u,txt,col,small,kind,el);if(!B||!u||u.x==null||!u.A||u.A.none)return;try{const s=String(txt),[x,y]=mid(u);
  if(/^\+\d+$/.test(s))FX19.heal(x,y);else if(s==='REVIVE'||s==='奇跡！')FX19.pillar(...foot(u));else if(/^AG\+|^SP\+|HASTE|充填/.test(s))FX19.buff(x,y,/SP/.test(s)?'#6fb2ff':/HASTE/.test(s)?'#8ff0a8':'#ffe27a');
  else if(s==='DELAY'||s==='凍結'||s==='STOP')FX19.ring(x,y,'#7fd6ff',{r0:15,r1:3,dash:1,dur:340});else if(s==='MISS')FX19.spray(x,y,7,['#ffffff','#c8ffd8'],1.3,0,14);else if(s==='SCAN')FX19.ring(x,y,'#7fd6ff',{r1:15,dash:1});}catch(e){}};
{const _sb=startBattle;startBattle=function(list,opts={}){FX19.clear();return _sb(list,opts);};}
/* ボスの部位破壊（ver0.16）：欠けた部位を新しいドット絵に反映する */
partBreak=async function(e){const i=e.pb||0;if(i>=PARTS.length)return;e.pb=i+1;const[pn,fr]=PARTS[i],A=setup(e);e.atk=Math.round(e.atk*.9);e.mag=Math.round(e.mag*.9);
 if(!A.none){const[fx,fy]=foot(e),D=dims(e),u=(fr[0]+fr[2])/2,v=(fr[1]+fr[3])/2,x=fx+(A.flip?.5-u:u-.5)*D.w,y=fy-D.h*(1-v);
  FX19.burst(x,y,'#ffb070',{size:2,rays:12,dur:340});FX19.ring(x,y,'#ff7a30',{r1:22,dur:360,thick:2});FX19.ring(x,y,'#ffd080',{r1:15,delay:80});
  for(let n=0;n<26;n++)FX19.part(x+(Math.random()-.5)*D.w*.4,y+(Math.random()-.5)*D.h*.25,(Math.random()-.5)*3,-1-Math.random()*2.4,['#ffd080','#8a7a8a','#5a4a5a','#ff7a30'][n%4],40+Math.random()*24|0,.16,n%3?1:2);A.kbv-=3;}
 B.shake=20;B.flashBg=12;B.flashCol='#ffb070';sfxPart();
 const el=document.createElement('div');el.className='pbrk';el.innerHTML=`部位破壊！<small>${e.name}の${pn}が砕けた　攻撃・魔力-10%</small>`;$('#stage').appendChild(el);setTimeout(()=>el.remove(),1500);
 pop(e,pn+'破壊','#ffb070',true);log(`<b>部位破壊！</b> ${e.name}の${pn}が砕け散った（攻撃・魔力-10%　${e.pb}/${PARTS.length}）`);await wait(650);};

/* ---------- 描画 ---------- */
const hash=(x,y,s)=>{let h=(x*374761393+y*668265263+s*1274126177)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;};
/* 部位破壊：破壊済みの部位を欠けさせたフレームを作る（フレームごとにキャッシュ） */
function eroded(f,u,A){const key='e'+u.pb+(A.flip?'f':'')+DS;if(f[key])return f[key];const c=document.createElement('canvas');c.width=f.w;c.height=f.h;const g=c.getContext('2d');g.drawImage(f.cv,0,0);const id=g.getImageData(0,0,f.w,f.h),p=id.data,R=A.rig,w=R.wid*A.sc*DS,h=R.hgt*A.sc*DS,x0=f.ax-w/2,y0=f.ay-h;
 for(let i=0;i<u.pb&&i<PARTS.length;i++){let[a,b,c2,d]=PARTS[i][1];if(A.flip){const t=1-a;a=1-c2;c2=t;}const X0=x0+a*w,X1=x0+c2*w,Y0=y0+b*h,Y1=y0+d*h,cx=(X0+X1)/2,cy=(Y0+Y1)/2,rx=(X1-X0)/2,ry=(Y1-Y0)/2;
  for(let y=Math.max(0,Y0-3|0);y<Math.min(f.h,Y1+3);y++)for(let x=Math.max(0,X0-3|0);x<Math.min(f.w,X1+3);x++){const k=(y*f.w+x)*4;if(p[k+3]<20)continue;const dd=Math.hypot((x-cx)/rx,(y-cy)/ry)+hash(x>>1,y>>1,i)*.55-Math.abs(Math.sin(x*.9+y*.5))*.2;
   if(dd<.82)p[k+3]=0;else if(dd<1.08){const hot=hash(x,y,i+9)<.22;p[k]=hot?255:p[k]*.4;p[k+1]=hot?150:p[k+1]*.36;p[k+2]=hot?60:p[k+2]*.42;}}}
 g.putImageData(id,0,0);return f[key]={cv:c,w:f.w,h:f.h,ax:f.ax,ay:f.ay};}
const BY4=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
/* 撃破：白く光ったあと、網点のパターンで下から上へ溶けていく */
function dissolve(f,A,k){const st=Math.floor(k*12);if(A.dcv&&A.dst===st)return A.dcv;const c=A.dcv||(A.dcv=document.createElement('canvas'));c.width=f.w;c.height=f.h;const g=c.getContext('2d');g.drawImage(k<.22?SPRX.white(f):f.cv,0,0);
 if(k>=.22){const id=g.getImageData(0,0,f.w,f.h),p=id.data,kk=(k-.22)/.78;for(let y=0;y<f.h;y++){const yy=1-y/f.h;for(let x=0;x<f.w;x++){const i=(y*f.w+x)*4;if(!p[i+3])continue;if(BY4[(y&3)*4+(x&3)]/16<kk*1.7-yy*.7)p[i+3]=0;else{p[i]=Math.min(255,p[i]+kk*90);p[i+1]=Math.min(255,p[i+1]+kk*70);p[i+2]=Math.min(255,p[i+2]+kk*120);}}}g.putImageData(id,0,0);}A.dst=st;return c;}
function drawU(u,k,p,sx,sy){const A=setup(u);if(A.none)return;
 if(u.side===1&&!u.alive){if(A.gone)return;if(!A.dead){A.dead={t0:ANIM.now,dur:680*ANIM.SP()};A.dcv=null;}}else if(A.dead||A.gone){A.dead=null;A.gone=0;A.dcv=null;}
 const[wx,wy,hop]=ANIM.world(u),pose=ANIM.poseOf(u);const S=A.sc*DS;let f=SPRX.frame(A.name,pose,A.palKey,A.pal,A.flip,S,A.extra);if(!f)return;if(u.pb)f=eroded(f,u,A);
 const[fx,fy]=foot(u),ix=B.intro>0&&u.side===1&&u.boss?-(B.intro/90)*(B.intro/90)*70:0,X0=Math.round((fx+wx+ix)*k/p)*p+sx,Y0=Math.round((fy+wy)*k/p)*p+sy,X=X0-f.ax*p,Y=Y0+Math.round(hop*k/p)*p-f.ay*p,R=A.rig;
 /* 足元の影 */
 if(!A.dead){const sw=Math.round(R.wid*S*.42*(1+hop*.02)),al=u.side===0&&!u.alive?.2:.32;ctx.fillStyle=`rgba(0,0,0,${al})`;ctx.fillRect(X0-(sw-2)*p,Y0-p,(sw*2-4)*p,p);ctx.fillRect(X0-sw*p,Y0,sw*2*p,p*2);ctx.fillRect(X0-(sw-2)*p,Y0+2*p,(sw*2-4)*p,p);}
 if(u.flash>0){u.flash=0;if(!A.flash)A.flash=4;}
 let img=f.cv;if(A.dead){const kk=(ANIM.now-A.dead.t0)/A.dead.dur;if(kk>=1){A.gone=1;A.dead=null;A.dcv=null;return;}img=dissolve(f,A,kk);if(kk>.25&&Math.random()<.5){const D=dims(u);FX19.part(fx+wx+(Math.random()-.5)*D.w,fy-Math.random()*D.h,(Math.random()-.5)*.4,-.5-Math.random()*.7,Math.random()<.5?'#ffffff':'#c8b0ff',22,0);}}
 else if(A.flash>0){if(A.flash>2)img=SPRX.white(f);A.flash--;}
 if(u.side===0&&!u.alive)ctx.globalAlpha=.78;ctx.drawImage(img,X,Y,f.w*p,f.h*p);ctx.globalAlpha=1;
 /* 状態の表示：星臨のオーラ／溜め／ブレイク（星が回る）／狙いの枠／行動中の矢印 */
 const top=Y0-Math.round(R.hgt*S)*p,hw=Math.round(R.wid*S/2)*p,t=ANIM.now;
 if(u.aw&&u.alive&&Math.random()<.3+.2*(u.awLv||1))B.parts.push({x:fx+wx+(Math.random()-.5)*14,y:fy-2,vy:-.4-Math.random()*.5*(u.awLv||1),l:30,c:(u.awLv||1)>=3&&Math.random()<.4?'#ffffff':(u.awLv||1)>=2&&Math.random()<.3?'#7fd6ff':'#ffe27a'});
 if(u.side===1&&u.alive){if(u.charging&&Math.random()<.6)FX19.part(fx+(Math.random()-.5)*dims(u).w*1.2,fy,(Math.random()-.5)*.3,-.9-Math.random()*.9,Math.random()<.5?'#ffb030':'#ffe27a',20,0,Math.random()<.3?2:1);
  if(u.broken)for(let i=0;i<3;i++){const a=t/260+i*2.094,xx=X0+Math.round(Math.cos(a)*hw*.7/p)*p,yy=top-3*p+Math.round(Math.sin(a)*2)*p;ctx.fillStyle=Math.sin(a)>0?'#ffe14a':'#c8a020';ctx.fillRect(xx-p,yy,3*p,p);ctx.fillRect(xx,yy-p,p,3*p);}
  if(B.tgt===u&&aliveE().length>1&&!B.rt22){const q=(Math.floor(t/260)%2)*p,L=4*p,x0=X0-hw-2*p-q,x1=X0+hw+2*p+q,y0=top-2*p-q,y1=Y0+3*p+q;ctx.fillStyle='#ffd65a';for(const[cx,cy,dx,dy]of[[x0,y0,1,1],[x1,y0,-1,1],[x0,y1,1,-1],[x1,y1,-1,-1]]){ctx.fillRect(dx>0?cx:cx-L,dy>0?cy:cy-p,L,p);ctx.fillRect(dx>0?cx:cx-p,dy>0?cy:cy-L,p,L);}}}
 if(B.cur===u&&u.side===0&&!u._act){const ay=top-6*p+(Math.floor(t/270)%2)*p;ctx.fillStyle='#3a2a08';ctx.fillRect(X0-3*p,ay-p,7*p,p);ctx.fillStyle='#f3c64b';ctx.fillRect(X0-2*p,ay,5*p,p);ctx.fillRect(X0-p,ay+p,3*p,p);ctx.fillRect(X0,ay+2*p,p,p);}}
function drawBattle(){const k=bK();if(cv.width!==W*k||cv.height!==H*k){cv.width=W*k;cv.height=H*k;}const p=Math.max(1,Math.round(k*2/3));PXL=p/k;DS=Math.round(k/p/1.5*1000)/1000;ANIM.tick();
 let sx=0,sy=0;if(B&&B.shake>0){const m=Math.min(4,1+Math.floor(B.shake/5));sx=((tick&1)?m:-m)*p;sy=(((tick>>1)&1)?1:-1)*Math.ceil(m/2)*p;B.shake--;}
 ctx.setTransform(k,0,0,k,0,0);ctx.imageSmoothingEnabled=false;ctx.drawImage(BG,0,0);if(sx||sy){ctx.setTransform(k,0,0,k,sx,sy);ctx.drawImage(BG,0,0);}
 if(!B)return;if(B.intro>0)B.intro--;if(B.fx2&&B.fx2.length)B.fx2.length=0;if(B.heroes.some(h=>h.aw)){ctx.fillStyle='rgba(255,210,110,.07)';ctx.fillRect(0,0,W,H);}
 /* 旧来の簡易エフェクト要求（B.fx）は新しいエフェクトに置き換える */
 if(B.fx.length){for(const f of B.fx)if(!f.t||f.t<=0){if(f.m)FX19.ring(f.x,f.y,f.c,{r1:20,delay:Math.max(0,-f.t)*16});else FX19.burst(f.x,f.y,f.c);}B.fx.length=0;}
 ctx.setTransform(1,0,0,1,0,0);FX19.draw(ctx,k,p,0,sx,sy);
 const us=[...B.enemies,...B.heroes].map(u=>{const A=setup(u);return[u,u.y+16*u.sc+(A.wy||0)+(u._act?.5:0)];}).sort((a,b)=>a[1]-b[1]);for(const[u]of us)drawU(u,k,p,sx,sy);
 FX19.draw(ctx,k,p,1,sx,sy);ctx.setTransform(k,0,0,k,sx,sy);
 if(B.domain){ctx.fillStyle='rgba(255,220,120,.10)';ctx.fillRect(0,0,W,H);ctx.strokeStyle='rgba(255,230,150,.35)';for(const[gx,gy,gr,sp]of[[28,22,14,1],[150,30,10,-1.4],[96,10,7,2]]){const a0=tick/60*sp;ctx.beginPath();ctx.arc(gx,gy,gr,0,7);ctx.stroke();for(let i=0;i<8;i++){const an=a0+i/8*6.283;ctx.fillStyle='rgba(255,230,150,.35)';ctx.fillRect(gx+Math.cos(an)*(gr+2)-1|0,gy+Math.sin(an)*(gr+2)-1|0,3,3);}}}
 if(B.barrier>0){ctx.fillStyle='rgba(127,214,255,.5)';for(let j=0;j<H;j+=PXL*2)ctx.fillRect(Math.round((100+Math.sin(j*.11+tick/14)*2)/PXL)*PXL,j,PXL,PXL);}
 B.parts=B.parts.filter(q=>{q.y+=q.vy;q.l--;ctx.fillStyle=q.c;ctx.globalAlpha=Math.min(1,q.l/30);ctx.fillRect(Math.round(q.x/PXL)*PXL,Math.round(q.y/PXL)*PXL,PXL,PXL);return q.l>0;});ctx.globalAlpha=1;
 if(B.deb&&B.deb.length)drawDeb();
 if(B.flashBg>0){ctx.setTransform(k,0,0,k,0,0);ctx.globalAlpha=Math.min(1,B.flashBg/40);ctx.fillStyle=B.flashCol||'#fff4c8';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;B.flashBg--;if(!B.flashBg)B.flashCol=null;}
 /* ボス戦の導入（ver0.18）：上下の帯と暗転 */
 if(B.intro>0){ctx.setTransform(k,0,0,k,0,0);const q=Math.min(1,B.intro/20);ctx.fillStyle='#05020e';ctx.fillRect(0,0,W,Math.round(14*q));ctx.fillRect(0,H-Math.round(14*q),W,Math.round(14*q));if(B.intro>70){ctx.fillStyle=`rgba(5,2,14,${(B.intro-70)/20})`;ctx.fillRect(0,0,W,H);}}}
{const _d=draw;draw=function(){if(scene!=='battle')return _d();tick++;try{drawBattle();}catch(e){if(!draw._err){draw._err=1;console.error(e);}}requestAnimationFrame(draw);};}

/* 装備している武器の素材（銅・鉄・鋼・星鋼）とレジェンドで、刃の色が変わる（ver0.18 の仕様を引き継ぐ） */
ANIM.setLook(u=>{if(u.side!==0||typeof findItem!=='function')return null;const s=u.aw?1:0;if(u._lk19&&u._lk19.s===s)return u._lk19.v;let v=null;
 try{const h=G&&G.h[u.id],it=h&&h.eq&&h.eq.w&&findItem(h.eq.w);if(it){const c=it.leg&&LEGCOL[it.leg]?LEGCOL[it.leg]:TIERC[it.rar===4||it.set?'星鋼':MATL(it.ilv)];if(c)v={k:'|'+c,pal:{m:c,M:PX.tint(c,.56,1.1,-12)}};}}catch(e){}
 u._lk19={s,v};return v;});
/* ---------- 他の画面にも新しいドット絵を使う ---------- */
let KEYS=new WeakMap();const keyOf=src=>{if(!KEYS.has(src))for(const k in IMG)KEYS.set(IMG[k],k);return KEYS.get(src);};
const STILL=new WeakMap();
/* 待機の基本姿勢 1 枚を N×N の枠に収めて返す（立ち絵・図鑑・マップのプレビュー用）。face=向き */
function still(key,N,right){const inf=SPRX.info(key);if(!inf)return null;const kd=key.replace(/_(aw|w)$/,'').replace(/^vo_/,''),K=ANIM.KIND[kd]||{},name=K.rig||inf.rig,R=RIG[name],pal=K.pal?Object.assign({},inf.pal,K.pal):inf.pal;
 let sc=N>=64?1.3:1;const fit=(N-2)/Math.max(R.wid+4,R.hgt+4);if(sc>fit)sc=fit;const pose=ANIM.base({rig:R});if(pose.y)pose.y=0;
 const f=SPRX.frame(name,pose,key+(K.pal?'k':''),pal,!!right,sc,K.extra||''),c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 g.drawImage(f.cv,Math.round(N/2-f.ax),Math.round(N-2-f.ay));return c;}
{const _hi=hiImg;hiImg=function(src,N,shade){if(!src)return src;const key=keyOf(src);if(!key||/_w$/.test(key))return _hi(src,N,shade);let m=STILL.get(src);if(!m){m={};STILL.set(src,m);}if(m[N])return m[N];const kd=key.replace(/_aw$/,''),ed=ED[kd];
  const c=still(key,N,ed&&!ed.flip);return m[N]=c||_hi(src,N,shade);};}
function cutArt(cv2,key){const c=still(IMG[key]?key:key.replace(/_aw$/,''),48,false);if(!c)return;cv2.width=cv2.height=48;const g=cv2.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(c,0,0);}
/* 行動順のアイコン：味方は顔まわり、敵は小さく描き直した全身 */
const ICO=new Map();
function icon(u){const key=sprKey(u),A=setup(u);if(A.none)return null;let c=ICO.get(key);if(c)return c;c=document.createElement('canvas');c.width=c.height=18;const g=c.getContext('2d'),R=A.rig,pose=ANIM.base(A);if(pose.y)pose.y=0;
 if(R.type==='hum'){const f=SPRX.frame(A.name,pose,A.palKey,A.pal,A.flip,1,A.extra),hy=R.B.leg+R.B.tor+R.B.hr-3;g.drawImage(f.cv,Math.round(9-f.ax+(A.flip?-1:1)),Math.round(10+hy-f.ay));}
 else{const sc=Math.min(.62,17/Math.max(R.wid,R.hgt)),f=SPRX.frame(A.name,pose,A.palKey,A.pal,A.flip,sc,A.extra);g.drawImage(f.cv,Math.round(9-f.ax),Math.round(17-f.ay));}
 ICO.set(key,c);return c;}
/* 図鑑：新しいドット絵（未発見はシルエット） */
try{for(const k in IMG){if(/_(w|aw)$/.test(k)||!SPRX.info(k))continue;for(const sil of[0,1])Object.defineProperty(ZIMG,k+(sil?'_w':''),{configurable:true,enumerable:true,get(){const ed=ED[k],c=still(k,48,ed&&!ed.flip);const v=c?(sil?PX.whiteOf(c):c).toDataURL():'';Object.defineProperty(ZIMG,k+(sil?'_w':''),{value:v,writable:true,configurable:true,enumerable:true});return v;}});}}catch(e){}
/* 版表示 */
const VER19='ver0.19';{const _t=title;title=function(){_t();const v=$('#verL');if(v)v.textContent=VER19;};const v=$('#verL');if(v)v.textContent=VER19;}
return{foot,mid,dims,WP,MA,CAST,BOW,VIC,AWK,still,icon,drawBattle};})();
