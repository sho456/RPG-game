/* ===== 背景（ディザリング生成） ===== */
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
const BY=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
function makeBg(th='ash',boss=false){const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');const R=rng(th.length*7+(boss?3:0)),hz=52;
 const dith=(y0,y1,cols)=>{for(let y=y0;y<y1;y++)for(let x=0;x<W;x++){const t=(y-y0)/(y1-y0)*(cols.length-1),i=Math.min(cols.length-2,Math.floor(t));g.fillStyle=(t-i)*16>BY[(y%4)*4+x%4]?cols[i+1]:cols[i];g.fillRect(x,y,1,1);}};
 if(th==='lib'){dith(0,hz,['#1a0f0a','#2e1c12','#3e2818']);for(let r=0;r<3;r++){const y=4+r*15;g.fillStyle='#24140c';g.fillRect(0,y+11,W,3);for(let x=0;x<W;x+=2+(R()*2|0)){g.fillStyle=['#7a2a2a','#2a4a7a','#2a6a3a','#8a7a2a','#5a2a6a','#6a5040'][R()*6|0];const h=7+(R()*4|0);g.fillRect(x,y+11-h,2,h);}}
  dith(hz,H,['#4a3424','#3a281a','#2a1c12']);for(let y=hz+4;y<H;y+=6){g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,y,W,1);}}
 else if(th==='chapel'){dith(0,hz,['#14121e','#24203a','#34304a']);for(const wx of[22,80,138]){for(let y=6;y<44;y++)for(let x=wx;x<wx+20;x++){const dx=x-wx-10;if(y<16&&dx*dx+(y-16)**2>100)continue;g.globalAlpha=.75;g.fillStyle=['#c84040','#4060d0','#e0c040','#40a060','#a050c0'][((x>>2)+(y>>2))%5];g.fillRect(x,y,1,1);}g.globalAlpha=1;}
  for(const q of[6,64,124,174]){g.fillStyle='#4a4660';g.fillRect(q-3,0,7,hz);g.fillStyle='#5e5a78';g.fillRect(q-3,0,2,hz);}
  for(let y=hz;y<H;y++)for(let x=0;x<W;x++){g.fillStyle=((x>>3)+(y>>2))%2?'#5a566e':'#46425a';g.fillRect(x,y,1,1);}}
 else if(th==='tower'){dith(0,hz,['#0a0c28','#1a1e50','#3a3a80','#6a5aa0']);for(let i=0;i<90;i++){g.fillStyle=['#fff','#c8ccff','#ffe9a0'][R()*3|0];g.fillRect(R()*W|0,R()*hz|0,1,1);}
  for(const q of[10,58,122,170]){g.fillStyle='#d8d4e8';g.fillRect(q-4,4,8,hz);g.fillStyle='#ffffff';g.fillRect(q-4,4,2,hz);g.fillStyle='#a8a4c0';g.fillRect(q+2,4,2,hz);}
  for(let y=hz;y<H;y++)for(let x=0;x<W;x++){g.fillStyle=((x>>3)+(y>>2))%2?'#e0dcf0':'#c8c4dc';g.fillRect(x,y,1,1);}}
 else if(th==='lava'){dith(0,hz,['#1a0806','#3a120a','#6a2410']);g.fillStyle='#2a0e08';for(let x=0;x<W;x++){const h=16+Math.sin(x*.06)*8+Math.sin(x*.17)*4;g.fillRect(x,hz-h,1,h);}
  for(let i=0;i<6;i++){const x=R()*W|0;g.fillStyle='#ff6020';for(let y=0;y<14;y++)g.fillRect(x+(Math.sin(y*.7)*1.5|0),hz-15+y,1,1);}
  dith(hz,H,['#3a1a10','#2a120a','#1a0a06']);for(let i=0;i<50;i++){g.fillStyle=R()<.5?'#ff7a30':'#ffb040';g.fillRect(R()*W|0,hz+R()*(H-hz)|0,R()<.3?2:1,1);}}
 else if(th==='void'){dith(0,H,['#05020e','#120628','#24104a','#120628']);for(let i=0;i<120;i++){g.fillStyle=['#fff','#c8b0ff','#8a6aff','#ffd0ff'][R()*4|0];g.fillRect(R()*W|0,R()*H|0,1,1);}
  for(let i=0;i<5;i++){const cx=R()*W,cy=R()*hz;for(let k=0;k<40;k++){g.fillStyle='rgba(160,100,255,.08)';g.fillRect(cx+(R()-.5)*40|0,cy+(R()-.5)*20|0,3,3);}}g.fillStyle='rgba(180,150,255,.25)';for(let x=0;x<W;x+=2)g.fillRect(x,hz+((x*7)%5),1,1);}
 else if(th==='ruin'){dith(0,hz,['#06121e','#0e2232','#163446']);for(let i=0;i<4;i++){g.fillStyle='rgba(140,220,255,.08)';for(let y=0;y<hz+30;y++)g.fillRect(20+i*44+y*.4|0,y,10,1);}
  for(const q of[14,66,118,170]){g.fillStyle='#2a4a5a';g.fillRect(q-4,8+(q%3)*6,8,hz);g.fillStyle='#3a6a7a';g.fillRect(q-4,8+(q%3)*6,2,hz);}dith(hz,H,['#1e4a5a','#163a48','#0e2a36']);for(let i=0;i<40;i++){g.fillStyle='rgba(180,240,255,.5)';g.fillRect(R()*W|0,R()*H|0,1,1);}}
 else if(th==='ice'){dith(0,hz,['#6a88b8','#8aa8d0','#b0c8e8','#d0e0f4']);g.fillStyle='#e8f0fa';for(let x=0;x<W;x++){const h=14+Math.sin(x*.08)*7+Math.sin(x*.21)*3;g.fillRect(x,hz-h,1,h);}g.fillStyle='#a8b8d0';for(let x=0;x<W;x+=1){const h=5+Math.sin(x*.13+1)*3;g.fillRect(x,hz-h,1,h);}
  dith(hz,H,['#e8f0f8','#d0dcea','#b8c8dc']);for(let i=0;i<70;i++){g.fillStyle='#ffffff';g.fillRect(R()*W|0,R()*H|0,1,1);}}
 else if(th==='shrine'){dith(0,hz,['#1a0a08','#2a1210','#3a1a14']);for(const q of[18,90,162]){g.fillStyle='#a02020';g.fillRect(q-4,0,8,hz);g.fillStyle='#c83a2a';g.fillRect(q-4,0,3,hz);g.fillStyle='#ffd080';g.fillRect(q+10,14,6,9);g.fillStyle='rgba(255,200,120,.16)';g.fillRect(q+4,6,18,24);}
  g.fillStyle='#2a1008';g.fillRect(0,4,W,5);dith(hz,H,['#6a2a20','#5a2018','#3a140e']);for(let y=hz+5;y<H;y+=6){g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,y,W,1);}}
 else if(th==='mine'){dith(0,hz,['#0e0c0a','#1e1a16','#2e2820']);for(let i=0;i<60;i++){g.fillStyle=R()<.5?'#3a3228':'#0a0806';g.fillRect(R()*W|0,R()*hz|0,2,2);}
  for(const bx of[28,90,152]){g.fillStyle='#4a3020';g.fillRect(bx-3,0,6,hz+4);g.fillStyle='#6a4830';g.fillRect(bx-3,0,2,hz+4);g.fillStyle='#ffb040';g.fillRect(bx+5,20,3,4);g.fillStyle='rgba(255,170,60,.18)';g.fillRect(bx-6,12,20,20);}
  g.fillStyle='#4a3020';g.fillRect(0,6,W,5);dith(hz,H,['#3a3228','#2a241c','#1c1812']);g.fillStyle='#8a8a94';g.fillRect(0,hz+30,W,1);g.fillRect(0,hz+44,W,1);for(let x=2;x<W;x+=8){g.fillStyle='#4a3020';g.fillRect(x,hz+28,3,19);}}
 else if(th==='storm'){dith(0,hz,boss?['#0a0612','#1a1028','#2e1e40']:['#0a0a14','#1e1e30','#3a3a52','#5a5a70']);g.strokeStyle='#fff6a0';g.beginPath();let lx=120,ly=0;g.moveTo(lx,ly);while(ly<hz-14){lx+=(R()*10-5)|0;ly+=6;g.lineTo(lx,ly);}g.stroke();
  g.fillStyle='#24242e';for(let x=0;x<W;x++){const h=10+Math.sin(x*.09)*5+Math.sin(x*.23)*3;g.fillRect(x,hz-h,1,h);}dith(hz,H,['#4a4a38','#3a3a2c','#2c2c20']);for(let i=0;i<60;i++){g.fillStyle=R()<.5?'#5a5a44':'#24241a';g.fillRect(R()*W|0,hz+R()*(H-hz)|0,1,1);}}
 else{const fo=th==='forest';dith(0,hz,boss?['#0d0618','#1e0f33','#3a1d52','#5c2f6a']:fo?['#0c2018','#14382a','#2a5a3c','#5a8a5a']:['#16234a','#2b3f78','#4a64a8','#8aa0d0']);
  for(let i=0;i<40;i++){g.fillStyle=R()<.5?'#fff':'#c8d0ff';g.fillRect(R()*W|0,R()*hz*.6|0,1,1);}
  if(fo){for(let i=0;i<26;i++){const x=R()*W|0,h=14+R()*22|0;g.fillStyle=i%2?'#163a22':'#0e2a18';for(let k=0;k<h;k++)g.fillRect(x-(k*.35|0),hz-h+k,(k*.7|0)+1,1);}}
  else{g.fillStyle=boss?'#2a1438':'#2a3a66';for(let x=0;x<W;x++){const h=12+Math.sin(x*.07)*6+Math.sin(x*.19+1)*3;g.fillRect(x,hz-h,1,h);}g.fillStyle=boss?'#1c0e28':'#1e2a4c';for(let x=0;x<W;x++){const h=6+Math.sin(x*.11+2)*3+Math.sin(x*.31)*2;g.fillRect(x,hz-h,1,h);}}
  dith(hz,H,boss?['#2a1c2e','#221628','#1a1020']:fo?['#2e5a2a','#24481f','#1a3616']:['#3d4a2e','#344027','#2a3420']);
  for(let i=0;i<70;i++){g.fillStyle=fo?(R()<.5?'#3e7038':'#1a3016'):boss?(R()<.5?'#3a2840':'#4a2a5a'):(R()<.5?'#4f5e38':'#2a3520');g.fillRect(R()*W|0,hz+R()*(H-hz)|0,R()<.3?2:1,1);}}
 if(boss&&th!=='ash'){g.fillStyle='rgba(60,0,80,.22)';g.fillRect(0,0,W,H);}
 g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,hz,W,1);return c;}

let BG=makeBg('ash');

/* ===== サウンド ===== */
let AC=null;
function au(){try{if(!AC)AC=new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();}catch(e){}}
function tone(f,d=.08,type='square',v=.05,f2){if(!AC)return;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0008,t+d);o.connect(g).connect(AC.destination);o.start(t);o.stop(t+d+.02);}
const SFX={sel:()=>tone(880,.04,'square',.03),hit:()=>tone(240,.12,'square',.06,70),weak:()=>{tone(660,.07);setTimeout(()=>tone(990,.1),60);},
 brk:()=>{tone(180,.35,'sawtooth',.08,40);setTimeout(()=>tone(1200,.15,'square',.04,600),80);},aw:()=>[523,659,784,1047,1319,1568].forEach((f,i)=>setTimeout(()=>tone(f,.16,'square',.05),i*65)),
 heal:()=>tone(523,.25,'triangle',.07,1046),ko:()=>tone(320,.45,'triangle',.07,60),warn:()=>{tone(200,.2,'sawtooth',.06);setTimeout(()=>tone(200,.2,'sawtooth',.06),220);}};

/* ===== データ ===== */
const SK={
 koujin:{n:'光刃',sp:20,el:'陽',k:'phys',pow:1.7,t:'one',d:'光の斬撃・単体'},
 harai:{n:'斬り払い',sp:25,el:'斬',k:'phys',pow:.9,t:'all',d:'斬撃・敵全体'},
 teate:{n:'応急手当',sp:20,k:'heal',pow:.35,t:'ally',d:'味方のHP35%回復'},
 tateuchi:{n:'盾撃',sp:15,el:'打',k:'phys',pow:1.2,t:'one',delay:35,d:'打撃＋行動を遅らせる'},
 chiretsu:{n:'地裂斬',sp:25,el:'打',k:'phys',pow:1.6,t:'one',d:'打属性の重い一撃'},
 chouhatsu:{n:'挑発',sp:15,k:'taunt',t:'self',d:'敵の単体攻撃を引きつける'},
 seikou:{n:'星光斬',sp:0,el:'陽',k:'phys',pow:3.0,t:'one',d:'光の大斬撃・単体'},
 ryusei:{n:'流星連斬',sp:0,el:'陽',k:'phys',pow:1.4,t:'all',d:'光の斬撃・敵全体'},
 keishou:{n:'継承・城壁崩し',sp:0,el:'打',k:'phys',pow:3,t:'all',req:'gald',d:'ガルドの星臨を模倣（ガルド星臨後）'},
 tettsui:{n:'鉄槌',sp:0,el:'打',k:'phys',pow:1.5,t:'one',d:'打撃・単体'},
 kenshu:{n:'堅守',k:'kenshu',t:'self',d:'被ダメ半減・蓄積1.5倍'},
 houkai:{n:'城壁崩し',k:'release',t:'all',d:'星臨解除・蓄積を全体へ放出'}};
const AW={rio:{name:'灯星継承',type:'ターン制',turns:3,cmds:['seikou','ryusei','keishou']},
 gald:{name:'不落城塞',type:'蓄積型',turns:4,cmds:['tettsui','kenshu','houkai']}};
const EA={claw:{n:'攻撃',el:'斬',k:'phys',pow:1,t:'one'},bite:{n:'噛みつき',el:'突',k:'phys',pow:1.4,t:'one'},press:{n:'のしかかり',el:'打',k:'phys',pow:1.25,t:'one'},
 wave:{n:'虚の波動',el:'陰',k:'mag',pow:1.15,t:'all'},roar:{n:'虚滅の咆哮',el:'陰',k:'mag',pow:3.0,t:'all'}};
const ED={slime:{name:'虚蝕スライム',mhp:150,atk:34,def:10,mag:16,res:14,spd:7,weak:['陽','打'],xp:10,gold:6,drop:[['haiseki',.25],['kakera',.12]]},
 wolf:{name:'灰狼',mhp:130,atk:40,def:12,mag:8,res:10,spd:13,weak:['打','斬'],xp:14,gold:9,drop:[['kiba',.4],['haiseki',.2]]},
 boss:{name:'虚ろの番人',mhp:1250,atk:62,def:26,mag:54,res:20,spd:10,weak:['陽','打'],sc:3,boss:true,xp:150,gold:200,drop:[['kakera',1],['kakera',1],['kakera',1]]}};
const HB={rio:{name:'リオ',mhp:240,atk:36,def:20,mag:28,res:22,spd:12,g:{mhp:'B',atk:'B',def:'B',mag:'B',res:'B',spd:'B'},skills:['koujin','harai','teate']},
 gald:{name:'ガルド',mhp:330,atk:31,def:32,mag:8,res:24,spd:8,g:{mhp:'S',atk:'B',def:'S',mag:'D',res:'A',spd:'D'},skills:['tateuchi','chiretsu','chouhatsu']}};
const GR={S:.09,A:.08,B:.07,C:.06,D:.05};

const ITEMS={potion:{n:'ポーション',p:30,d:'HP120回復'},drop:{n:'星の雫',p:120,d:'AG+30'},feather:{n:'不死鳥の羽',p:150,d:'戦闘不能から復活'}};
const MATS={haiseki:{n:'灰石',p:10},kiba:{n:'獣の牙',p:15},kakera:{n:'虚の欠片',p:40}};
const nextXP=l=>Math.round(15*Math.pow(l,1.5));
function stats(id){const b=HB[id],s=G.h[id],o={},g=gear(id),bo=bonus(id);for(const k in bo)g[k]=(g[k]||0)+bo[k];for(const k of['mhp','atk','def','mag','res','spd']){const v=b[k]*(1+GR[b.g[k]]*(k==='spd'?.3:1)*(s.lv-1))+(g[k]||0);o[k]=k==='spd'?+v.toFixed(2):Math.round(v);}
 for(const k of['atk','def','mag','res','mhp'])if(g[k+'P'])o[k]=Math.round(o[k]*(1+g[k+'P']/100));
 return Object.assign(o,{crit:g.crit||0,weakDmg:g.weakDmg||0,startAG:g.startAG||0,awDmg:g.awDmg||0,spGain:g.spGain||0,drop:g.drop||0,atkEl:g.atkEl||null,legs:g.legs,awTurn:g.awTurn||0,noRecoil:g.noRecoil||0,storeUp:g.storeUp||0,gaugeSave:g.gaugeSave||0});}
function hero(id){const s=stats(id),b=HB[id],pos={x:0,y:0};const hp=G.h[id].hp==null?s.mhp:Math.min(s.mhp,G.h[id].hp);
 return Object.assign({id,side:0,spr:id,name:b.name,skills:skillList(id),sp:50,ag:Math.min(100,s.startAG+(s.legs.includes('senkou')?50:0)),elem:MAG(id)?null:'斬',alive:hp>0,aw:false,awT:0,store:0,taunt:0,ox:0,tox:0,flash:0,sc:2},s,pos,{hp,awLv:G.h[id].awLv||1,awDmg:s.awDmg+((G.h[id].awLv||1)-1)*10});}
function enemy(kind,lv,x,y,suf=''){const d=ED[kind],L=d.boss?0:lv-1,M={mhp:.7+.17*L,atk:1+.14*L,mag:1+.14*L,def:.8+.1*L,res:.8+.1*L};
 const e={kind,lv,side:1,spr:kind,name:d.name+suf,weak:d.weak,boss:d.boss,known:new Set(G.known[kind]||[]),charging:false,turn:0,x,y,ox:0,tox:0,flash:0,fade:0,sc:d.sc||2,alive:true,spd:d.spd};
 for(const k of['mhp','atk','def','mag','res'])e[k]=Math.round(d[k]*M[k]);e.mhp=Math.max(1,Math.round(e.mhp*(d.boss?.93:.88)));
 /* ver0.25：ブレイク（被ダメ1.5倍・行動遅延・溜め打ち消し）と部位破壊（攻撃・魔力-10%×3）の廃止に合わせ、HPを通常-12%・ボス-7%、ボスの攻撃・魔力を-4% */
 if(d.boss){e.atk=Math.round(e.atk*.96);e.mag=Math.round(e.mag*.96);}e.hp=e.mhp;return e;}

/* ===== 戦闘 ===== */
let B=null,G=null,F=null,speed=1,auto=false;
const SPD={1:1.7,2:.75,4:.35};
const wait=ms=>new Promise(r=>setTimeout(r,ms*SPD[speed]));
const log=t=>{$('#msg').innerHTML=t;};
const aliveE=()=>B.enemies.filter(e=>e.alive),aliveH=()=>B.heroes.filter(h=>h.alive);
const spdOf=u=>u.spd*(u.aw&&u.id==='rio'?1.2:1)*(u.aw&&u.id==='jin'?1.3:1);
const st=(u,k)=>u[k]*(u.aw&&u.id==='rio'?1.2:1)*(u.aw&&u.id==='jin'&&k==='atk'?1.3:1)*(k==='atk'&&u.aw&&u.id==='balza'?1+.15*u.awT:1);
const setCT=(u,w=1)=>{u.ct=100/spdOf(u)*w;};
const gald=()=>B.heroes.find(h=>h.id==='gald'),rio=()=>B.heroes.find(h=>h.id==='rio');

/* 未使用：js/rs/battle.js が置き換え */

/* ver0.49：防御の式。基礎ダメージ＝攻撃（魔力）× 威力 × 防御の倍率
   防御の倍率＝1 ÷（1 + 防御 ÷（DEFK × 標準の防御））。標準の防御＝攻撃する側のレベルでの、仲間 12 人の体力（術なら精神）の平均（基礎ステータス）
   ・標準と同じ防御で 0.75 倍、2 倍で 0.6 倍、半分で 0.86 倍、0 で 1 倍。体力・精神・防御の強化と弱体・装備が、どのレベルでも同じ割合で効く
   ・以前の「攻撃×威力 − 防御×0.5」は、敵の攻撃が高いほど防御が効かず（Lv100 で 1 割未満）、術は精神が高いと 1 ダメージの両極端だった */
/* EATK：防御の式を変えて平均的な味方の受けるダメージが減った分（Lv40 で約 15%）を、敵の攻撃の倍率で戻す */
const DEFK=3,EATK=1.15,DREF={};
function defRef(lv,phys){lv=Math.max(1,Math.round(lv||1));const k=lv+(phys?'p':'m');if(DREF[k])return DREF[k];let v=0;
 try{const ids=Object.keys(RSD.HERO);let n=0;for(const id of ids){const o=RSC.rs7(id,lv);v+=phys?o.vit:o.wil;n++;}v/=Math.max(1,n);}catch(e){v=0;}
 return DREF[k]=v>0?v:20+lv*6;}
function calc(a,t,sk){const phys=sk.k!=='mag';const D=Math.max(0,st(t,phys?'def':'res'));
 const A=Math.max(1,sk.fixed!=null?sk.fixed:st(a,phys?'atk':'mag'));let d=(sk.fixed!=null?sk.fixed:A*sk.pow)/(1+D/(DEFK*defRef(a.lv||(a.side===0&&G.h[a.id]?G.h[a.id].lv:1),phys)));if(a.side===1)d*=EATK;d=Math.max(1,d);
 let weak=false;if(t.weak&&sk.el&&t.weak.includes(sk.el)){d*=1.7*(1+(a.weakDmg||0)/100);weak=true;}if(!phys&&a.legs&&a.legs.includes('taiyou'))d*=1.25;
 if(weak&&a.legs&&a.legs.includes('shokei'))d*=1.3;if(a.aw&&a.awDmg)d*=1+a.awDmg/100;if(a.aw&&a.id==='crow')d*=1+(1-a.hp/a.mhp)*1.5;const crit=(a.aw&&a.id==='erna')||Math.random()<.06+(a.crit||0)/100;if(crit)d*=1.5;d*=.95+Math.random()*.1;return{d:Math.round(d),weak,crit};}

function hurt(t,d){if(t.side===0){if(t.legs){if(t.legs.includes('kagerou')&&!t._dodge){t._dodge=1;setTimeout(()=>pop(t,'MISS','#ffffff',true),50);return 0;}if(t.legs.includes('gyokuza')&&!(B&&B.rs))d*=.85;}if(t.guard)d*=.5;if(t.id==='gald'&&t.aw){t.store+=d*(t.kenshu?1.5:1)*(1+(t.storeUp||0)/100);d*=.55;if(t.kenshu)d*=.5;}
  d=Math.max(1,Math.round(d));if(!t.aw)t.ag=Math.min(100,t.ag+d/t.mhp*60);}
 if(t.side===0){/* 結界・玉座（レジェンド）は RS の戦闘では受けるダメージの枠（js/rs/battle.js frames）で足す */if(B.barrier>0&&!B.rs)d=Math.max(1,Math.round(d*.7));if(B.domain&&t.hp-d<=0&&!t.saved){d=t.hp-1;t.saved=1;setTimeout(()=>pop(t,'聖域が守った','#ffe27a',true),150);}}
 t.hp=Math.max(0,t.hp-d);return d;}

function pop(){}/* 未使用：js/ch5.js が置き換え */

async function hit(a,t,sk){
 const r=calc(a,t,sk);const d=hurt(t,r.d);t.flash=8;if(a.side===0&&a.legs&&a.legs.includes('meikai')&&d>0){a.hp=Math.min(a.mhp,a.hp+Math.round(d*.2));}B.fx.push({x:t.x+8*t.sc,y:t.y+8*t.sc,t:0,m:sk.k==='mag',c:ELC[sk.el]||'#ffffff'});
 /* ver0.49：ミス・回避・障壁で 0 ダメージのときは、会心・弱点・耐性の印も数字も出さない（MISS・障壁の表示は hurt 側が出す） */
 if(!(d>0)){r.crit=r.weak=r.resist=false;t._xf=0;}
 if(d>0){pop(t,d,r.crit?'#ffe14a':r.weak?'#ffb030':(t.side===0?'#ff8a8a':'#ffffff'),false,(r.crit?'crit ':'')+(r.weak?'weak ':'')+(r.resist?'resist ':'')+(t.side===0?'hurt':''),sk.el);comboAdd(d);}
 if(r.weak)SFX.weak();else if(d>0)SFX.hit();if(r.crit)B.fx.push({x:t.x+8*t.sc,y:t.y+8*t.sc,t:0,m:true,c:'#ffe14a'});
 if(r.crit)B.shake=6;
 if(a.side===0){if(!a.aw)a.ag=Math.min(100,a.ag+(d>0?6:0)+(r.weak?10:0)+(r.crit?4:0));
  if(r.weak){t.known.add(sk.el);G.known[t.kind]=[...t.known];}}
 refresh();
 if(t.hp<=0)await kill(t);return d;}

async function kill(t){if(t.side===0&&t.legs&&t.legs.includes('kiseki')&&!t._ks){t._ks=1;t.hp=Math.round(t.mhp*.3);pop(t,'奇跡！','#ffe27a');log(`${t.name}は奇跡の指輪で立ち上がった！`);refresh();return;}t.alive=false;
 if(t.side){t.fade=24;SFX.ko();log(`${t.name}を倒した！`);}
 else{SFX.ko();log(`${t.name}は倒れた…`);if(t.aw)endAw(t,true);t.ag=0;aliveH().forEach(h=>{if(!h.aw)h.ag=Math.min(100,h.ag+25);});}
 refresh();await wait(300);}

/* ===== 星臨 ===== */
async function awaken(u){const A=AW[u.id];u.aw=true;u.awT=0;u.ag=GAUGE.includes(u.id)?100:0;u.charged=0;u.stk=0;u.lastEl=null;u.store=0;B.awUsed.add(u.id);if(u.id==='shion')aliveE().forEach(e=>{e.ct+=100/e.spd;pop(e,'DELAY','#7fd6ff',true);});if(u.id==='noah')B.domain=true;
 const cut=$('#cut');const c=document.createElement('canvas');c.width=16;c.height=16;c.getContext('2d').drawImage(IMG[u.spr+'_aw'],0,0);
 cut.style.background='';cut.innerHTML='';cut.appendChild(c);const tx=document.createElement('div');tx.innerHTML=`<div class="t">${u.name} ― 星臨${(u.awLv||1)>1?'・位階'+ROMAN[u.awLv]:''}</div><div class="b">${A.name}</div>`;cut.appendChild(tx);
 cut.classList.remove('show');void cut.offsetWidth;cut.classList.add('show');B.flashBg=30;SFX.aw();
 log(`<b>${u.name}、星臨――「${A.name}」！</b>`);refresh();await wait(1150);cut.classList.remove('show');}

function endAw(u,silent){u._gk=0;if(u.id==='noah')B.domain=false;u.aw=false;u.awT=0;u.store=0;u.stk=0;u.second=false;if(u.legs&&u.legs.includes('koukagari'))u.ag=50;if(!silent){if(!u.noRecoil)u.ct+=20/spdOf(u)*5;log(`${u.name}の星臨が解けた（反動で行動が遅れる）`);}refresh();}

async function release(g){const base=g.store*.9+st(g,'atk')*1.5;log(`<b>城壁崩し！</b> 蓄積した ${Math.round(g.store)} の力を解き放つ！`);
 B.flashBg=20;B.shake=14;SFX.brk();await wait(400);
 for(const e of aliveE()){await hit(g,e,{n:'城壁崩し',el:'打',k:'phys',fixed:base});await wait(120);}
 endAw(g);}

/* ===== 行動 ===== */
const awN=u=>AW[u.id].turns+(u.awTurn||0)+((u.awLv||1)-1);

let ATK=u=>MAG(u.id)?{n:'魔弾',el:u.atkEl||null,k:'mag',pow:.8,t:'one',basic:true}:({n:'攻撃',el:u.aw&&u.id==='rio'?'陽':(u.atkEl||u.elem),k:'phys',pow:1,t:'one',basic:true});
const GUARD={n:'防御',k:'guard',t:'self'};

async function doAction(u,sk,t){
 if(sk.k==='zen'){await zenStrike(u);return;}
 if(sk.k==='guard'){u.guard=true;if(!u.aw)u.ag=Math.min(100,u.ag+10);log(`${u.name}は身を守っている`);setCT(u,.7);return;}
 if(sk.k==='kenshu'){u.guard=true;u.kenshu=true;log('ガルドは城塞と化した――<b>堅守</b>');setCT(u,.7);return;}
 if(sk.k==='taunt'){u.sp-=sk.sp;u.taunt=3;if(sk.guard)u.guard=true;log(`${u.name}の${sk.n}！ 敵の視線が集まる`);SFX.sel();setCT(u);return;}
 if(sk.k==='healAll'){u.sp-=sk.sp;log(`${u.name}の${sk.n}！`);aliveH().forEach(h=>{const v=Math.round(h.mhp*sk.pow);h.hp=Math.min(h.mhp,h.hp+v);pop(h,'+'+v,'#7dffa8');});SFX.heal();setCT(u);refresh();await wait(500);return;}
 if(sk.k==='guardRegen'){u.sp-=sk.sp;u.guard=true;const v=Math.round(u.mhp*.15);u.hp=Math.min(u.mhp,u.hp+v);pop(u,'+'+v,'#7dffa8');log(`${u.name}の${sk.n}！`);SFX.heal();setCT(u,.8);refresh();await wait(450);return;}
 if(sk.k==='release'){await release(u);setCT(u);return;}
 if(sk.k==='item'){await useItem(u,sk.id,t);setCT(u,.8);return;}
 if(sk.k==='roar'){aliveE().forEach(e=>{e.ct+=40/e.spd;pop(e,'DELAY','#7fd6ff',true);});aliveH().forEach(h=>{if(!h.aw)h.ag=Math.min(100,h.ag+15);});log(`${u.name}の<b>咆哮</b>！ 敵がすくみ、味方が奮い立つ`);B.shake=8;SFX.warn();setCT(u);refresh();await wait(500);return;}
 if(sk.k==='rhythm'){B.combo={n:0,tot:0};setTimeout(comboEnd,4000);log('<b>氷華乱舞</b>――白い輪が青い輪に重なった瞬間にタップ！');await wait(300);const n0=auto?Math.round(5+Math.random()*6):await rhythm(),n=Math.min(16,n0+(u.legs&&u.legs.includes('hyouga')?4:0));
  log(`<b>${n}連撃！</b>`);u.tox=-10;for(let i=0;i<n&&t&&t.alive;i++){await hit(u,t,{n:'乱舞',el:i%3===2?'冷':'打',k:'phys',pow:.55});await wait(60);}u.tox=0;
  if(n0>=12&&t&&t.alive){t.ct+=150/t.spd;pop(t,'凍結','#bff4ff');log('<b>氷華終の型！</b> 敵が凍りついた');}setCT(u);return;}
 if(sk.k==='charge'){u.ag=Math.max(0,u.ag-(sk.gauge||0));u.charged=1;log(`${u.name}は弓を引き絞った…（天穿が撃てる）`);pop(u,'充填','#7fd6ff',true);setCT(u,.6);refresh();await wait(400);return;}
 if(sk.k==='release2'){const n=u.awT;log('<b>溶鉄爆砕！</b> 溜めた熱を叩きつける');B.shake=14;SFX.brk();for(const e of aliveE()){await hit(u,e,{n:sk.n,el:'熱',k:'phys',pow:1.6});await wait(100);}
  if(n>=4){const c=Math.round(u.mhp*.2);u.hp=Math.max(1,u.hp-c);pop(u,'-'+c,'#ff8a8a');log('熱が逆流した…！');}endAw(u);setCT(u);refresh();return;}
 if(sk.k==='pct'){log('<b>死経</b>――命を削る呪言が響く');B.flashBg=20;for(const e of aliveE()){const d=Math.max(1,Math.round(e.hp*(e.boss?.12:.4)));e.hp=Math.max(0,e.hp-d);e.flash=8;pop(e,d,'#b07cff');refresh();if(e.hp<=0)await kill(e);await wait(150);}setCT(u);return;}
 if(['haste','cheer','grace','scan'].includes(sk.k)){u.sp-=sk.sp||0;
  if(sk.k==='haste')aliveH().forEach(h=>{if(h!==u){h.ct=Math.max(0,h.ct-30/spdOf(h));pop(h,'HASTE','#8ff0a8',true);}});
  if(sk.k==='cheer')aliveH().forEach(h=>{if(!h.aw){h.ag=Math.min(100,h.ag+15);pop(h,'AG+15','#ffe27a',true);}});
  if(sk.k==='grace'&&t&&!t.aw){t.ag=Math.min(100,t.ag+40);pop(t,'AG+40','#ffe27a',true);}
  if(sk.k==='scan')aliveE().forEach(e=>{e.weak.forEach(w=>e.known.add(w));G.known[e.kind]=[...e.known];pop(e,'SCAN','#7fd6ff',true);});
  log(`${u.name}の${sk.n}！`);SFX.heal();setCT(u);refresh();await wait(450);return;}
 if(sk.k==='reviveAll'){B.heroes.forEach(h=>{if(!h.alive){h.alive=true;h.hp=1;setCT(h);}const v=Math.round(h.mhp*.4);h.hp=Math.min(h.mhp,h.hp+v);pop(h,'+'+v,'#7dffa8');});log(`${u.name}の<b>${sk.n}</b>！`);SFX.heal();B.flashBg=20;setCT(u);refresh();await wait(500);return;}
 if(sk.k==='barrier'){u.sp-=sk.sp||0;B.barrier=sk.long?6:3;log(`${u.name}の${sk.n}！ 光の膜が味方を包む`);SFX.heal();setCT(u);refresh();await wait(450);return;}
 if(sk.k==='revive'){u.sp-=sk.sp;t.alive=true;t.hp=Math.round(t.mhp*.4);setCT(t);pop(t,'REVIVE','#7dffa8');log(`${u.name}の${sk.n}！ ${t.name}が立ち上がった`);SFX.heal();setCT(u);refresh();await wait(450);return;}
 if(sk.k==='heal'){u.sp-=sk.sp;const v=Math.round(t.mhp*sk.pow);t.hp=Math.min(t.mhp,t.hp+v);log(`${u.name}の${sk.n}！`);pop(t,'+'+v,'#7dffa8');SFX.heal();setCT(u);refresh();await wait(450);return;}
 u.sp-=sk.sp||0;u.tox=-10;B.combo={n:0,tot:0};
 if(sk.gauge){u.ag=Math.max(0,u.ag-(sk.gauge-(u.gaugeSave||0)-((u.awLv||1)-1)*3));if(u.lastEl&&sk.el!==u.lastEl){u.stk=Math.min(3,(u.stk||0)+1);pop(u,'対消滅'+u.stk,'#ffb030',true);}u.lastEl=sk.el;}if(sk.gaugeAll)u.ag=0;if(sk.hpCost){const c=Math.round(u.mhp*sk.hpCost);u.hp=Math.max(1,u.hp-c);pop(u,'-'+c,'#b07cff',true);}if(sk.req==='charged')u.charged=0;log(`${u.name}の${sk.n}！`);refresh();await wait(180);
 const ts=sk.t==='all'?aliveE():[t&&t.alive?t:aliveE()[0]];
 /* ver0.46：全体攻撃は 1 ヒットごとに全員へ同時に当てる（演出は 1 回・命中と数字は全員同時。_sim の当たりは振りと止めを省く js/ver19.js） */
 if(ts.length>1&&!sk.basic){const sOf=e=>{let s2=sk.auto?{...sk,el:sk.auto.find(x=>e.weak.includes(x))||sk.el}:sk;return s2;},n=Math.max(...ts.map(e=>sOf(e).hits||1));
  for(let i=0;i<n;i++){let first=true;for(const e of ts){if(!e||!e.alive)continue;const s2=sOf(e);if(i>=(s2.hits||1))continue;const s3=Object.assign({},s2,first?{_simLead:1}:{_sim:1});first=false;
    const dd=await hit(u,e,s3);if(sk.drain&&dd){const v=Math.round(dd*sk.drain);u.hp=Math.min(u.mhp,u.hp+v);pop(u,'+'+v,'#7dffa8',true);}}
   await wait(sk.hits?160:120);}
  for(const e of ts){if(!e||!e.alive)continue;if(sk.steal)doSteal(u,e,sk.steal);if(sk.delay){e.ct+=sk.delay*(e.boss?.4:1)/e.spd;pop(e,'DELAY','#7fd6ff',true);}}
  await wait(140);}
 else for(const e of ts){if(!e)continue;let s2=sk.auto?{...sk,el:sk.auto.find(x=>e.weak.includes(x))||sk.el}:sk;if(sk.basic&&u.legs&&u.legs.includes('tenkyuu'))s2={...s2,hits:2};for(let i=0;i<(s2.hits||1)&&e.alive;i++){const dd=await hit(u,e,s2);if(sk.drain&&dd){const v=Math.round(dd*sk.drain);u.hp=Math.min(u.mhp,u.hp+v);pop(u,'+'+v,'#7dffa8',true);}if(sk.hits)await wait(120);}if(sk.steal&&e.alive)doSteal(u,e,sk.steal);if(sk.delay&&e.alive){e.ct+=sk.delay*(e.boss?.4:1)/e.spd;pop(e,'DELAY','#7fd6ff',true);}await wait(140);}
 if(sk.basic)u.sp=Math.min(100,u.sp+10+(u.spGain||0));
 comboEnd();u.tox=0;setCT(u,sk.w||(sk.t==='all'?1.1:1));await wait(200);}

function doSteal(u,e,lv){if(e.stolen){pop(e,'もう盗めない','#aab0d8',true);return;}if(lv<2&&Math.random()>.6){pop(e,'MISS','#aab0d8',true);return;}e.stolen=1;let s;
 if(lv>=2)s=addLoot(genItem(e.lv,2,0));else if(Math.random()<.5){const d=ED[e.kind].drop[0],k=d?d[0]:'haiseki';G.mats[k]=(G.mats[k]||0)+1;s=MATS[k].n;}else{addItem('potion',1);s='ポーション';}
 pop(e,'STEAL','#7dffa8',true);log(`${u.name}は<b>${s}</b>を盗んだ！`);}
async function useItem(u,id,t){G.items[id]--;const nm=ITEMS[id].n;
 if(id==='potion'||id==='hipotion'){const v=Math.min(id==='potion'?120:Math.round(t.mhp*.5),t.mhp-t.hp);t.hp+=v;pop(t,'+'+v,'#7dffa8');}
 if(id==='ether'){t.sp=Math.min(100,t.sp+50);pop(t,'SP+50','#6fb2ff',true);}
 if(id==='drop'||id==='drop2'){const v=id==='drop'?30:60;if(!t.aw)t.ag=Math.min(100,t.ag+v);pop(t,'AG+'+v,'#ffe27a',true);}
 if(id==='feather'||id==='tail'){t.alive=true;t.hp=id==='tail'?t.mhp:Math.round(t.mhp*.3);setCT(t);pop(t,'REVIVE','#7dffa8',true);}
 SFX.heal();log(`${u.name}は${nm}を使った`);
 refresh();await wait(450);}

function autoPick(){}

/* ===== メニュー ===== */
function menu(items,list,xc){const c=$('#cmd');if(scene==='town')$('#stage').style.display=xc==='grid9'?'':'none';c.className=(list?'list':'')+(xc?' '+xc:'');c.innerHTML='';
 items.forEach(it=>{const b=document.createElement('button');b.className='c '+(it.cls||'');b.innerHTML=(it.ic?`<img class="ic" src="${ICON[it.ic]}">`:'')+it.l+(it.s?`<small>${it.s}</small>`:'');b.disabled=!!it.dis;
  b.onclick=()=>{SFX.sel();it.f();};c.appendChild(b);});}
function chooseRoot(){}

/* ===== 敵 ===== */
function pickHero(){}/* 未使用：js/rs/battle.js が置き換え */
async function enemyTurn(e){
 e.turn++;let sk;const ai=ED[e.kind].ai,pick=a=>{let r=Math.random();for(const[k,w]of a){if((r-=w)<0)return k;}return a[0][0];};
 if(ai){
  if(e.charging){sk=Object.assign({},EA[ai.charge]);if(sk.pow)sk.pow*=.85;e.charging=false;}
  else if(!e.summoned&&ai.summon&&e.hp<e.mhp/2){e.summoned=true;log(`${e.name}が<b>眷属を呼び出した</b>！`);
   const s1=enemy(ai.summon,ai.sumLv,78,14,'A'),s2=enemy(ai.summon,ai.sumLv,78,80,'B');[s1,s2].forEach(s=>{setCT(s);B.enemies.push(s);});SFX.warn();setCT(e);refresh();await wait(700);return;}
  else if(e.turn%ai.every===0){e.charging=true;SFX.warn();pop(e,'溜め！','#ffb030');log(`${e.name}は<b>力を溜めている</b>…！ 防御で備えろ！`);setCT(e);refresh();await wait(800);return;}
  else sk=EA[pick(ai.acts)];}
 else sk=EA[pick(ED[e.kind].acts||[['claw',1]])];
 e.tox=10;log(`${e.name}の${sk.n}！`);refresh();await wait(260);
 let ts;
 if(sk.t==='all'){const g=gald();if(g&&g.alive&&g.aw){ts=[g];pop(g,'肩代わり','#ffe27a',true);log(`${e.name}の${sk.n}！ ――<b>ガルドが全てを受け止める</b>`);}else ts=aliveH();}
 else ts=[pickHero()];
 if(sk===EA.roar)B.shake=16;
 /* ver0.46：敵の全体攻撃も全員へ同時に当てる */
 if(ts.length>1){let first=true;for(const t of ts){await hit(e,t,Object.assign({},sk,first?{_simLead:1}:{_sim:1}));first=false;}await wait(260);}
 else for(const t of ts){await hit(e,t,sk);await wait(130);}
 e.tox=0;setCT(e);await wait(250);}

async function end(win){B.over=true;$('#cmd').innerHTML='';B.heroes.forEach(h=>{G.h[h.id].hp=Math.max(h.hp,Math.ceil(h.mhp*.2));});
 const ov=$('#ov');ov.classList.remove('hide');
 if(!win){if(B.opts.trial){G.party=B.opts.prevParty;save();ov.innerHTML=`<div class="logo" style="font-size:28px">試練失敗</div><div class="sub">幻影に押し返された。<br>鍛え直して、また挑もう（ペナルティなし）</div><button class="big" id="cont">灯都へ</button>`;$('#cont').onclick=()=>enterTown('試練の間から戻った…');return;}
  save();/* ver0.32：全滅してもお金は減らない（クエストと同じ決まり。それまでに得た報酬も残る） */
  ov.innerHTML=`<div class="logo" style="font-size:28px">全滅…</div><div class="sub">虚蝕に呑まれ、灯都へ運ばれた。<br>所持金は失わなかった（${G.gold}G）</div><button class="big" id="cont">灯都へ</button>`;
  $('#cont').onclick=()=>enterTown('灯守たちに救われ、灯都で目を覚ました…');return;}
 const r=rewards(B.enemies);if(B.opts.boss&&A)G.flags[A.bflag]=true;save();
 const dr=Object.entries(r.drops).map(([k,n])=>`${MATS[k].n}×${n}`).join('・');
 ov.innerHTML=`<div class="logo" style="font-size:28px">VICTORY</div><div class="sub">経験値 +${r.xp}　${r.gold}G 獲得　灯力+${r.tou}${r.sts.length?'<br>星石：'+r.sts.join('・'):''}${dr?'<br>入手：'+dr:''}${r.loot.length?'<br>装備：'+r.loot.join('、'):''}${r.ups.length?'<br><b style="color:#ffe27a">レベルアップ！ '+r.ups.join('・')+'</b>':''}</div><button class="big" id="cont">続ける</button>`;
 $('#cont').onclick=()=>{SFX.sel();B.opts.onEnd&&B.opts.onEnd(true);};}
function gainXP(){}/* 未使用：js/v31/core.js が置き換え */
function rewards(es){let xp=0,gold=0;const drops={};
 es.forEach(e=>{const d=ED[e.kind],m=1+.3*(e.lv-1);xp+=Math.round(d.xp*m*(1+.05*(G.fac.bar-1)));gold+=Math.round(d.gold*m);
  d.drop.forEach(([k,p])=>{if(Math.random()<p)drops[k]=(drops[k]||0)+1;});if(e.kind==='wolf')G.q.wolf++;if(e.kind==='jadewolf')G.q.jade=(G.q.jade||0)+1;});
 G.gold+=gold;for(const k in drops)G.mats[k]=(G.mats[k]||0)+drops[k];
 const tou=es.reduce((a,e)=>a+(ED[e.kind].boss?e.lv*10:e.lv),0);G.tou=(G.tou||0)+tou;const sts=[];es.forEach(e=>{const n=ED[e.kind].boss?2:Math.random()<.04?1:0;for(let i=0;i<n;i++){const k=Object.keys(STONES)[Math.random()*7|0];G.stones[k]=(G.stones[k]||0)+1;sts.push(STONES[k].n);}});
 const bonus=G.party.reduce((a,i)=>a+stats(i).drop,0)/100,loot=[];
 if(AREA==='ouito')es.forEach(e=>{if(ED[e.kind].boss||Math.random()<.06)loot.push(addLoot(royalRand(Math.max(31,e.lv))));});
 es.forEach(e=>{if(ED[e.kind].boss){const il=ED[e.kind].ilv||5;loot.push(addLoot(genItem(il,2,bonus)),addLoot(genItem(il,3,bonus)));}else if(Math.random()<.14*(1+bonus))loot.push(addLoot(genItem(e.lv,0,bonus)));});
 const ups=[];for(const id of G.members){const before=stats(id).mhp,hp=G.h[id].hp??before;const n=gainXP(id,xp);
  if(n){G.h[id].hp=hp+stats(id).mhp-before;ups.push(`${HB[id].name} Lv${G.h[id].lv}（星ポイント+${n*3}）`);}}
 if(ups.length)SFX.aw();return{xp,gold,drops,ups,loot,tou,sts};}

/* ===== 描画 ===== */
let tick=0;
function drawUnit(){}/* 未使用：js/ver16.js が置き換え */
function draw(){tick++;if(scene==='field'){drawField();requestAnimationFrame(draw);return;}if(scene==='board'){drawBoard();requestAnimationFrame(draw);return;}if(scene==='title'){drawTitle();requestAnimationFrame(draw);return;}if(scene!=='battle'){drawTown();requestAnimationFrame(draw);return;}ctx.save();
 if(B&&B.shake>0){ctx.translate((Math.random()*4-2)|0,(Math.random()*4-2)|0);B.shake--;}
 ctx.drawImage(BG,0,0);
 if(B){if(B.heroes.some(h=>h.aw)){ctx.fillStyle='rgba(255,210,110,.07)';ctx.fillRect(0,0,W,H);}
  [...B.enemies,...B.heroes].sort((a,b)=>a.y-b.y).forEach(drawUnit);
  B.fx=B.fx.filter(f=>{f.t++;ctx.globalAlpha=Math.max(0,1-f.t/14);ctx.fillStyle=f.c;
   if(f.m){const r=f.t*1.6;for(let a=0;a<12;a++){const an=a/12*6.283;ctx.fillRect(f.x+Math.cos(an)*r|0,f.y+Math.sin(an)*r|0,2,2);}}
   else{const L=Math.min(f.t,7)*3;for(let k=-1;k<=1;k++)for(let i=0;i<L;i++)ctx.fillRect(f.x-10+i+k*5|0,f.y-10+i-k*2|0,1,1);}
   ctx.globalAlpha=1;return f.t<14;});
  if(B.domain){ctx.fillStyle='rgba(255,220,120,.10)';ctx.fillRect(0,0,W,H);ctx.strokeStyle='rgba(255,230,150,.35)';for(const[gx,gy,gr,sp]of[[28,22,14,1],[150,30,10,-1.4],[96,10,7,2]]){const a0=tick/60*sp;ctx.beginPath();ctx.arc(gx,gy,gr,0,7);ctx.stroke();for(let i=0;i<8;i++){const an=a0+i/8*6.283;ctx.fillStyle='rgba(255,230,150,.35)';ctx.fillRect(gx+Math.cos(an)*(gr+2)-1|0,gy+Math.sin(an)*(gr+2)-1|0,3,3);}}}
  B.parts=B.parts.filter(p=>{p.y+=p.vy;p.l--;ctx.fillStyle=p.c;ctx.globalAlpha=p.l/30;ctx.fillRect(p.x|0,p.y|0,1,1);return p.l>0;});ctx.globalAlpha=1;
  if(B.flashBg>0){ctx.globalAlpha=Math.min(1,B.flashBg/40);ctx.fillStyle=B.flashCol||'#fff4c8';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;B.flashBg--;if(!B.flashBg)B.flashCol=null;}}
 ctx.restore();requestAnimationFrame(draw);}

/* ===== UI更新 ===== */

function refresh(){}/* 未使用：js/ch5.js が置き換え */

const ELC={'斬':'#cfd6e6','打':'#e0b98a','突':'#b9e0c9','熱':'#ff7a3a','冷':'#7fd6ff','雷':'#ffe14a','風':'#8ff0a8','地':'#d0a060','陽':'#fff3a6','陰':'#b07cff'};
