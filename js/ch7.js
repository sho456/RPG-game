/* ===== ver0.13 終章「星核の残響」 ===== */
for(const[k,b,pal]of[['last1','golem',{a:'#d8d0ff',A:'#7060c0',o:'#ffffff',y:'#ffe9a0',u:'#b0a0ff'}],['last2','wolf',{g:'#2a1048',G:'#120624',w:'#c080ff',x:'#ff40ff'}],
 ['last3','rio',{H:'#2a0a4a',h:'#4a1a7a',s:'#c8b0e0',e:'#ff40ff',m:'#ff40ff',C:'#3a1a5a',c:'#5a2a8a',w:'#1a0a2a',y:'#ff80ff',b:'#100818'}]]){SPR[k]=SPR[b];IMG[k]=mk(SPR[b],pal);IMG[k+'_w']=mk(SPR[b],null,'#ffffff');}
EA.voidend={n:'虚無の終焉',el:'闇',k:'mag',pow:2.7,t:'all'};
EA.eclipse={n:'星蝕',el:'闇',k:'phys',pow:2.4,t:'all'};
const LASTD={boss:true,sc:3,drop:[['kakera',1],['kakera',1],['kakera',1]],xp:0,gold:0,ilv:55};
ED.last1=Object.assign({},LASTD,{name:'星核の残響',mhp:18000,atk:400,def:104,mag:430,res:100,spd:17,weak:['闇','雷'],ai:{every:3,charge:'starfall',acts:[['slam',.4],['wave',.3],['curse',.3]],summon:'shade',sumLv:52},
 intro:'星核の残響が砕け、虚の奥から黒い獣が這い出した――'});
ED.last2=Object.assign({},LASTD,{name:'虚獣ノクス',mhp:21000,atk:470,def:100,mag:430,res:96,spd:19,weak:['光','炎'],ai:{every:3,charge:'eclipse',acts:[['claw',.4],['slam',.3],['curse',.3]],summon:'shade',sumLv:52},
 intro:'ノクス「器よ……その空白、我がもらい受ける」<br>獣の影が、リオと同じ姿へと形を変えていく――'});
ED.last3=Object.assign({},LASTD,{name:'虚神ノクス',mhp:27000,atk:480,def:108,mag:510,res:104,spd:18,weak:['光'],flip:1,xp:12000,gold:20000,drop:[['kakera',1],['kakera',1],['kakera',1],['kakera',1],['kakera',1],['kakera',1]],
 ai:{every:3,charge:'voidend',acts:[['mirror',.35],['curse',.35],['wave',.3]],summon:'shade',sumLv:54},ilv:58});
SK.zenkyo={n:'全共鳴',k:'zen',t:'all',d:'終の星臨：仲間全員の灯を束ねる大技。全員のAGを力に変える（1戦闘1回）'};
const ECHO={a:['<b>残響Ⅰ</b>――大灯が初めて灯った夜。','灯守たちは、光の中から泣き声を聞いた。<br>星の雫に包まれた赤子。胸には、何の色も持たない星片。','「この子は星に選ばれたのか、星に捨てられたのか」<br>――それが、リオという名の始まりだった。'],
 b:['<b>残響Ⅱ</b>――ガルドの声がする。','「空白の星片……欠けているんじゃない。まだ、誰の色にも染まっていないだけだ」','だからリオは、誰の灯とも共鳴できた。<br>ミレイユの炎とも、ハクアの氷とも、クロウの闇とさえも。'],
 c:['<b>残響Ⅲ</b>――星核そのものの声が響く。','「わたしは星核。千年前、虚に喰われかけたわたしは、最後の光をひとつの命に託した」','「空白の星片は、わたし自身。すべての灯をつなぎ直すための器――それがおまえ」','リオ「……借り物の光でも、みんなの灯をつなげるなら。それが俺の光だ」<br><b style="color:#ffe27a">リオは終の星臨「全共鳴」を会得した！</b>']};
const echoN=()=>Object.keys(G.flags.echo||{}).length;
function echoEvent(x,y){const k=x+','+y,seen=G.flags.echo=G.flags.echo||{};if(seen[k])return;const id=['a','b','c'][echoN()];seen[k]=1;F.pause=true;F.flash=10;SFX.aw();
 const pg=ECHO[id];let i=0;const step=()=>{if(i<pg.length){log(pg[i++]);menu([{l:'▶ 次へ',cls:'ready',f:step}]);}else{if(id==='c')G.flags.zenkyo=1;save();fieldMenu(echoN()>=3?'<b>星核の扉が開いた。</b>最奥へ向かおう。':`残響はあと${3-echoN()}つ。`);}};step();}
{const c=document.createElement('canvas');c.width=c.height=16;const g=c.getContext('2d');g.drawImage(TL.t,0,0);for(let i=0;i<14;i++){g.fillStyle=['#ffffff','#c8b0ff','#ffe27a'][i%3];g.fillRect(4+(i*5)%8,3+(i*7)%10,1,1);}g.fillStyle='rgba(180,140,255,.45)';g.fillRect(6,6,4,4);TL.e=c;}
AREAS.zankyo={name:'星核の残響',lv:[50,54],theme:'void',rec:'推奨Lv50〜55',bflag:'boss8',boss:{kind:'last1',lv:55},stages:['last1','last2','last3'],
 map:['####################','#########B##########','########ttt#########','##C#####ttt#####G###','##t######t######t###','##tttttttttttttttt##','##t#####t###t####t##','#Yt#####t###t####tY#',
  '#tt##tttttttttt##tt#','#t###t###tt###t###t#','#t###t###tt###t###t#','#ttttt##tttt##ttttt#','###t####tYtt####t###','###t####tttt####t###','##Ctt####tt####ttC##','####t####tt####t####',
  '####tttttttttttttG##','#######t####t#######','####tttttttttttt####','####t####tt####t####','##Gtt####tt####tt###','#########tt#########','#########St#########','####################'],
 groups:[['darkknight','shade'],['onimusha','yukirei','shade'],['golemkin','golemkin'],['minerghost','darkknight'],['shade','shade','shade']],
 crew:[{loot:[54,3]},{gold:15000},{loot:[55,4]}],
 intro:'<b>終章　星核の残響</b>――塔の頂から落ちた先は、星々の記憶が漂う虚の底。<b>3つの残響</b>を辿り、星核の扉を開け。'};
async function nextStage(){B.stage=(B.stage||0)+1;const k=B.opts.stages[B.stage],prev=B.opts.stages[B.stage-1];await wait(600);
 B.flashBg=26;B.shake=14;SFX.warn();log(ED[prev].intro||'');await wait(1400);
 const e=enemy(k,58,18,34);B.enemies=[e];setCT(e);
 B.heroes.forEach(h=>{if(!h.alive){h.alive=true;h.hp=1;setCT(h);}const v=Math.round(h.mhp*.2);h.hp=Math.min(h.mhp,h.hp+v);h.sp=Math.min(100,(h.sp||0)+30);pop(h,'+'+v,'#7dffa8');});
 log(`星々の灯が仲間を支える――<b>${e.name}</b>が現れた！（第${B.stage+1}形態）`);refresh();await wait(1200);
 if(B.stage===B.opts.stages.length-1){const r=B.heroes.find(h=>h.id==='rio'&&h.alive);if(r&&G.flags.zenkyo&&!r.aw){r.ag=100;pop(r,'星片が輝く','#ffe27a');log('空白の星片が、みんなの色で満ちていく――<b>リオのAGが最大になった！</b>');refresh();await wait(1000);}}}
async function zenStrike(u){B.zenUsed=1;const hs=aliveH();const pw=hs.reduce((a,h)=>a+Math.max(st(h,'atk'),st(h,'mag'))*(1+h.ag/100)*(h.aw?1.4:1),0)*1.6;
 hs.forEach(h=>{if(!h.aw)h.ag=0;});B.flashBg=34;B.shake=20;SFX.brk();log(`<b style="color:#ffe27a">全共鳴</b>――${hs.map(h=>h.name).join('・')}の灯が、ひとつの光になる！`);refresh();await wait(900);
 for(const e of aliveE()){await hit(u,e,{n:'全共鳴',k:'phys',el:e.weak[0]||'光',fixed:pw,pow:1});await wait(150);}
 endAw(u);setCT(u);refresh();await wait(300);}
const CREDITS=`<div class="tlogo" style="position:static;font-size:30px">ASTRAL<br>BREAKER</div><div style="margin:6px 0 40px">〜 星継ぎの灯 〜</div>
<p><b>企画・原案</b><br>Sho</p><p><b>ゲームデザイン・プログラム・ドット絵</b><br>Claude</p><p><b>灯守たち</b><br>リオ　ガルド　ミレイユ　シオン<br>ノア　エルナ　バルザ　クロウ<br>ハクア　ジン＆ポポ</p>
<p><b>舞台</b><br>灯都ルミナス　灰の街道　翠の森<br>祈りの廃聖堂　雷鳴高原　氷華の社<br>沈んだ王都　天への塔　星核の残響</p><p><b>Special Thanks</b><br>遊んでくれたあなた</p><p style="margin-top:60px;font-size:18px">Thank you for playing!</p>`;
const EPI=['虚神ノクスが光の粒になって消えていく。','星核の声「ありがとう、わたしの器。……いいえ、リオ」<br>「もう器じゃない。あなたは、あなたの灯で生きて」','空白の星片は、今は仲間たちの色で、やわらかく輝いている。','灯都ルミナスに朝が来た。<br>大灯はもう揺らがない。――けれど、星の地図の端に、まだ知らない回廊が続いていた。'];
function ending(){G.flags.endSeen=1;save();F&&(F.pause=true);const ov=$('#ov');ov.classList.remove('hide');ov.style.background='#05030e';let i=0;
 const fin=()=>{ov.innerHTML='<div class="logo" style="font-size:30px">THE END</div><div class="sub">クリアデータを記録しました。<br>灯都に戻ると、新しい噂が届いている…</div><button class="big" id="cont">灯都へ</button>';
  $('#cont').onclick=()=>{ov.style.background='';enterTown('<b>エピローグ</b>――大灯は穏やかに燃えている。（クリア後も冒険を続けられる）');};};
 const roll=()=>{ov.innerHTML=`<style>@keyframes roll{from{transform:translateY(480px)}to{transform:translateY(-100%)}}#rl p{margin:0 0 34px;line-height:1.7}</style><div style="position:absolute;inset:0;overflow:hidden"><div id="rl" style="animation:roll 40s linear forwards;text-align:center;color:#e8ecff;font-size:13px">${CREDITS}</div></div><button id="skip" style="position:absolute;right:10px;top:10px;opacity:.6;width:auto;height:34px;font-size:12px;padding:0 12px" class="big">スキップ</button>`;
  $('#rl').addEventListener('animationend',fin);$('#skip').onclick=fin;};
 const step=()=>{if(i<EPI.length){ov.innerHTML=`<div class="sub" style="font-size:14px;line-height:1.8">${EPI[i++]}</div><button class="big" id="cont">▶</button>`;$('#cont').onclick=()=>{SFX.sel();step();};}else roll();};SFX.aw();step();}
QS.push({id:'q10',n:'星継ぎの灯',d:'虚神ノクスを倒す',ok:()=>!!G.flags.boss8,pg:()=>G.flags.boss8?'達成':`残響${echoN()}/3`,rw:'50000G・星の雫Ⅱ×5',give:()=>{G.gold+=50000;addItem('drop2',5);}});
