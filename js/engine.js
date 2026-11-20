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

/* ===== 戦闘 ===== */
let B=null,G=null,F=null,speed=1,auto=false;
const SPD={1:1.7,2:.75,4:.35};
const wait=ms=>new Promise(r=>setTimeout(r,ms*SPD[speed]));
const log=t=>{$('#msg').innerHTML=t;};
const aliveE=()=>B.enemies.filter(e=>e.alive),aliveH=()=>B.heroes.filter(h=>h.alive);

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

/* 未使用：js/ch5.js が置き換え */

/* ===== 星臨 ===== */

/* ===== 行動 ===== */

let ATK=u=>MAG(u.id)?{n:'魔弾',el:u.atkEl||null,k:'mag',pow:.8,t:'one',basic:true}:({n:'攻撃',el:u.aw&&u.id==='rio'?'陽':(u.atkEl||u.elem),k:'phys',pow:1,t:'one',basic:true});
const GUARD={n:'防御',k:'guard',t:'self'};

/* ===== メニュー ===== */
function menu(items,list,xc){const c=$('#cmd');if(scene==='town')$('#stage').style.display=xc==='grid9'?'':'none';c.className=(list?'list':'')+(xc?' '+xc:'');c.innerHTML='';
 items.forEach(it=>{const b=document.createElement('button');b.className='c '+(it.cls||'');b.innerHTML=(it.ic?`<img class="ic" src="${ICON[it.ic]}">`:'')+it.l+(it.s?`<small>${it.s}</small>`:'');b.disabled=!!it.dis;
  b.onclick=()=>{SFX.sel();it.f();};c.appendChild(b);});}

/* ===== 敵 ===== */
/* 未使用：js/rs/battle.js が置き換え */

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
