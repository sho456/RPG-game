/* ===== TD の音（TDSFX）：WebAudio で合成する効果音と、章ごとの短い BGM。音源ファイルなし =====
 効果音：TDSFX.ev(e)（sim の出来事 st.ev を js/td/view.js が 1 つずつ渡す）。種類ごとに間引き、0.1 秒あたりの数にも上限（×2 速でもうるさくない）。
 部品はスキル rs-battle-fx の効果音のレシピ（ノイズの層 swoosh・金属音 ring・低いドン thump・下がる鈴 chime）を TD 向けに短くしたもの。属性で音の高さを変える。
 BGM：js/ver16.js の BGM（compose・bgmTick の合成チップチューン）に TD の曲 SONGS['td:…'] を足し、BGM.force で切り替える
  （章の地図＝td:map・戦闘＝td:b:<ステージの th>・ボスがいる間＝td:boss・勝利＝win）。BGM の関数は上書きしない。
 AudioContext は js/engine.js の AC（最初のタップで au() が作る）を使い、ここでは作らない。
 ミュート：TDSFX.toggle()（効果音と BGM をまとめて。localStorage 'astral_sfx'、BGM は ver16 の 'astral_bgm' もそろえる）。戦闘画面の上の帯のアイコン TDSFX.icon() */
'use strict';
const TDSFX=(()=>{
let on=true;try{on=localStorage.getItem('astral_sfx')!=='0';}catch(e){}
let M=null,last={},win=[];
const live=()=>on&&typeof AC!=='undefined'&&AC&&AC.state==='running';
/* 出口：圧縮をかけてから鳴らす（重なっても割れない） */
function out(){if(M&&M.context===AC)return M;const c=AC.createDynamicsCompressor();c.threshold.value=-20;c.knee.value=12;c.ratio.value=5;c.connect(AC.destination);
 M=AC.createGain();M.gain.value=.85;M.connect(c);return M;}
function nb(){if(typeof noiseBuf==='function')return noiseBuf();const b=AC.createBuffer(1,AC.sampleRate,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b;}
/* ---------- 部品（w＝何秒あとに鳴らすか） ---------- */
function osc(f,d,type,v,f2,w=0){const t=AC.currentTime+w,o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);
 if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+d);
 o.connect(g).connect(out());o.start(t);o.stop(t+d+.03);}
/* 層：帯域を動かすノイズ（風・炎・水）。f0→f1 */
function swoosh(f0,f1,d,v,q=1.2,w=0,type='bandpass'){const t=AC.currentTime+w,s=AC.createBufferSource(),b=AC.createBiquadFilter(),g=AC.createGain();
 s.buffer=nb();s.loop=true;b.type=type;b.Q.value=q;b.frequency.setValueAtTime(f0,t);b.frequency.exponentialRampToValueAtTime(f1,t+d);
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+Math.min(.04,d/4));g.gain.exponentialRampToValueAtTime(.0001,t+d);
 s.connect(b).connect(g).connect(out());s.start(t,Math.random()*.5);s.stop(t+d+.05);}
/* 打（高い）：整数倍でない倍音 3 つの金属音 */
function ring(f,d=.12,v=.02,w=0){[1,1.87,2.71].forEach((m,i)=>osc(f*m,d*(1-i*.2),'sine',v/(i+1),0,w));}
/* 打（低い）：着弾の「ドン」 */
function thump(v=.09,w=0,f=130,f2=45,d=.14){osc(f,d,'sine',v,f2,w);}
/* 合図：鈴（下がる・上がる） */
function chime(fs,gap=.07,v=.018,w=0,d=.2){fs.forEach((f,i)=>osc(f,d,'sine',v,0,w+i*gap));}
/* 属性 → 音の高さの倍率 */
const ELF={'斬':1,'打':.8,'突':1.2,'熱':.9,'冷':1.35,'雷':1.15,'陽':1.25,'陰':.72};
/* ---------- 間引き：同じ種類は min 秒あける・0.1 秒に 7 音まで ---------- */
function gate(k,min){const n=AC.currentTime;if(n-(last[k]||-9)<min)return false;win=win.filter(x=>n-x<.1);if(win.length>=7&&min<.3)return false;last[k]=n;win.push(n);return true;}
/* ---------- 音の一覧 ---------- */
const R={
 deploy:()=>{thump(.08);chime([1047,1568],.06,.022,.02);},
 retreat:()=>{swoosh(2400,500,.18,.03);osc(660,.14,'triangle',.025,330);},
 slash:m=>{swoosh(1100*m,3200*m,.08,.032,1.4);ring(4000*m,.06,.01,.03);},
 arrow:m=>{swoosh(5000,2500,.05,.02,2,0,'highpass');osc(2400*m,.05,'square',.007,1300*m,.01);},
 spell:m=>{swoosh(500*m,1600*m,.12,.03,3);osc(880*m,.1,'sine',.016,440*m,.02);},
 lampshot:()=>{osc(1700,.08,'sine',.012,850);},
 weak:m=>{ring(7500*m,.08,.012);},
 crit:()=>{thump(.06,0,180,60,.09);ring(5200,.07,.012);},
 kill:()=>{thump(.07,0,180,50,.12);swoosh(1800,300,.14,.025,.8,0,'lowpass');chime([6500,5700],.05,.008,.05,.12);},
 bosskill:()=>{thump(.13);thump(.1,.12);swoosh(3000,200,.7,.06,.8);chime([8300,6500,6100,5700],.12,.014,.2,.25);},
 boss:()=>{osc(55,1.1,'sawtooth',.035,48);osc(82,1.1,'triangle',.05,70);thump(.12);thump(.12,.28);},
 wave:()=>{osc(392,.14,'triangle',.04);osc(523,.22,'triangle',.04,0,.12);},
 call:()=>{osc(523,.07,'triangle',.03);osc(784,.1,'triangle',.03,0,.06);},
 clear:()=>{chime([1568,1319,1175],.08,.016);},
 life:()=>{osc(220,.22,'sawtooth',.045,110);thump(.12);osc(196,.26,'sawtooth',.04,98,.2);},
 lamp:()=>{swoosh(300,2400,.4,.03,1.5);chime([784,988,1175,1568],.07,.02,.04,.26);},
 heal:()=>{chime([1319,1568,2093],.06,.014,0,.25);swoosh(800,2600,.3,.012,3);},
 charge:()=>{osc(180,1,'sine',.025,720);swoosh(400,2400,1,.015,6);},
 cancel:()=>{ring(3000,.12,.016);swoosh(2400,400,.2,.02);},
 drain:()=>{swoosh(2000,250,.6,.035,2);osc(300,.5,'triangle',.02,120);},
 summon:()=>{swoosh(200,900,.35,.03,4);osc(110,.35,'sawtooth',.02,220);},
 fall:()=>{osc(440,.35,'triangle',.04,110);swoosh(1500,200,.3,.02);},
 win:()=>{[523,659,784,1047].forEach((f,i)=>osc(f,.24,'triangle',.045,0,i*.11));chime([2093,2637,3136],.08,.014,.5,.4);},
 lose:()=>{[392,349,311,262].forEach((f,i)=>osc(f,.34,'triangle',.04,0,i*.2));swoosh(800,150,1.2,.02,1,.2);},
 /* 星臨：溜め（上がる層）→ 放出（ドン＋金属音 4k→7.9k→4k＋落ちるノイズ）→ 上がる鈴 5 音（最後は 1 オクターブ上） */
 ult:m=>{swoosh(200,3200,.3,.045,1);osc(220*m,.3,'sine',.02,880*m);thump(.14,.24);ring(4000,.12,.02,.24);ring(7900,.18,.022,.3);ring(4000,.12,.014,.36);
  swoosh(3000,260,.6,.06,.9,.24);chime([1047,1319,1568,2093,4186].map(f=>f*m),.07,.016,.42,.3);}};
/* 技：役割と働きごとの組み（層＋打＋合図）。主の打（7.5k）は閃光と同じ刻みに */
const SK={
 strike:m=>{swoosh(900*m,2600*m,.22,.04);ring(4000*m,.09,.016,.05);ring(7500*m,.12,.018,.1);thump(.09,.1);ring(4000*m,.09,.01,.16);},
 guard:()=>{ring(1200,.3,.03);thump(.1);osc(300,.3,'triangle',.03,260,.02);},
 nova:m=>{thump(.11);swoosh(3000*m,300,.4,.05,.9);ring(7900*m,.18,.014,.04);},
 stun:m=>{swoosh(1500*m,4000*m,.12,.03,2);ring(6000*m,.07,.014,.04);ring(9000*m,.06,.012,.09);ring(7000*m,.06,.01,.17);},
 chain:()=>{for(let i=0;i<3;i++){swoosh(6000,2500,.06,.04,1,i*.05,'highpass');osc(1200-i*200,.05,'square',.01,300,i*.05);}thump(.06,.03);},
 curse:()=>{osc(110,.4,'sawtooth',.03,82);osc(116,.4,'sawtooth',.025,87);swoosh(1200,200,.4,.025,3);},
 heal:()=>R.heal(),
 slow:()=>{for(let i=0;i<4;i++)ring(3200-i*250,.05,.012,i*.08);swoosh(2400,500,.45,.02,4);}};
function play(k,m=1){if(!live())return;try{(R[k]||SK[k])&&(R[k]||SK[k])(m);}catch(e){}}
/* ---------- 出来事 → 音 ---------- */
function ev(e){if(!live())return;const m=e.u&&e.u.h?ELF[e.u.h.el]||1:1;
 try{switch(e.k){
  case'hit':{if(e.big)return;const u=e.u;if(u.id==='lamp'){if(gate('lamp',.12))R.lampshot();return;}
   const far=u.h.rng>60,mag=u.h.dmgK==='mag';if(!e.sk){if(far&&!mag){if(gate('arrow',.06))R.arrow(m);}else if(mag){if(gate('spell',.07))R.spell(m);}else if(gate('slash',.05))R.slash(m);}
   if(e.weak&&gate('weak',.1))R.weak(m);if(e.cr&&gate('crit',.12))R.crit();return;}
  case'cast':if(e.sk.k==='heal'||gate('sk'+e.sk.k,.12))SK[e.sk.k]&&SK[e.sk.k](m);return;
  case'kill':if(e.f.boss)R.bosskill();else if(gate('kill',.06))R.kill();return;
  case'spawn':if(e.f.boss&&gate('boss',2))R.boss();return;
  case'wave':if(gate('wave',.5))R.wave();return;
  case'call':R.call();return;
  case'clear':R.clear();return;
  case'leak':if(gate('life',.25))R.life();return;
  case'beam':if(!e.u){if(gate('life',.25))R.life();}else{thump(.12);swoosh(2600,300,.3,.04);}return;
  case'lamp':R.lamp();return;
  case'ult':R.ult(m);return;
  case'aw':R.lamp();return;
  case'deploy':R.deploy();return;
  case'retreat':R.retreat();return;
  case'fall':R.fall();return;
  case'charge':R.charge();return;
  case'gcancel':R.cancel();return;
  case'drain':R.drain();return;
  case'summon':if(gate('summon',.5))R.summon();return;
  case'end':(e.win?R.win:R.lose)();return;}}catch(err){}}
/* ---------- BGM（ver16 の合成エンジンに曲を足すだけ） ---------- */
/* [型, BPM, 主音, 旋法, A の和音進行, B の和音進行]。型は ver16 の STY（calm/town/field/dungeon/battle/boss） */
const SONG={'td:map':['calm',84,60,'maj',[0,5,3,4],[3,4,0,0]],'td:boss':['boss',144,62,'hm',[0,1,5,4],[0,1,4,4]],
 'td:b:ash':['field',118,62,'dor',[0,6,3,0],[2,3,4,4]],'td:b:forest':['field',106,65,'maj',[0,4,5,3],[3,4,1,4]],'td:b:chapel':['dungeon',88,62,'hm',[0,5,3,4],[5,3,4,4]],
 'td:b:storm':['battle',138,64,'min',[0,5,6,4],[3,4,5,6]],'td:b:ice':['town',96,61,'min',[0,3,5,4],[5,6,0,4]],'td:b:ruin':['dungeon',96,63,'dor',[0,1,3,0],[5,3,4,4]],
 'td:b:tower':['field',116,67,'lyd',[0,1,0,4],[5,3,1,4]],'td:b:void':['dungeon',82,58,'phr',[0,1,0,6],[5,6,1,0]]};
try{if(typeof SONGS!=='undefined')Object.assign(SONGS,SONG);}catch(e){}
let mine=false;
const shown=id=>{const r=document.getElementById(id);return!!r&&!r.classList.contains('hide');};
function want(){if(shown('cb')&&typeof CB!=='undefined'){const s=CB.st;if(!s||s.over)return s&&s.over.win?'win':'td:map';
  if(s.foes.some(f=>f.boss&&f.hp>0))return'td:boss';const k='td:b:'+(s.S.th||'ash');return SONG[k]?k:'td:b:ash';}
 if(shown('tdm'))return'td:map';return null;}
function bgm(){if(typeof BGM==='undefined')return;const w=want();if(w){BGM.force=w;mine=true;}else if(mine){BGM.force=null;mine=false;}}
setInterval(()=>{try{bgm();}catch(e){}},300);
/* ---------- ミュート ---------- */
function toggle(){on=!on;try{localStorage.setItem('astral_sfx',on?'1':'0');}catch(e){}
 try{if(typeof BGM!=='undefined'&&BGM.on!==on&&typeof bgmToggle==='function')bgmToggle();}catch(e){}return on;}
function icon(){return`<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M2 6h3l4-3v10l-4-3H2z" fill="currentColor"/>${on?
 '<path d="M11 5.5q1.6 2.5 0 5M12.8 3.8q3 4.2 0 8.4" fill="none" stroke="currentColor" stroke-width="1.4"/>':'<path d="M11 5.5l4 5M15 5.5l-4 5" stroke="currentColor" stroke-width="1.4"/>'}</svg>`;}
return{ev,play,toggle,icon,get on(){return on;}};})();
