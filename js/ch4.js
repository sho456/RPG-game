/* ===== 第4章データ ===== */
SPR.hakua=["......GGGG......",".....GGGGGG.....","....GGGGGGGG....","....GssGGGGGr...","....GesGGGGGr...","....sssGGGG.....",".....ssGwwG.....","...uswwwwwwG....","..uuswwwwwww....","...u.wwwwwwws...",".....rrrrrrrr...",".....rrrRrrrr...","....rrrrRrrrrr..","....rrrRrrRrrr..",".....bb...bb....","....bbb...bbb..."];
IMG.hakua=mk(SPR.hakua,{G:'#1a1a24'});IMG.hakua_w=mk(SPR.hakua,null,'#ffffff');IMG.hakua_aw=mk(SPR.hakua,{G:'#e8f4ff',r:'#40a0e0',R:'#2060a0',u:'#bff4ff'});
for(const[k,b,pal]of[['snowwolf','wolf',{g:'#e8eef8',G:'#8a9ab0',w:'#ffffff',x:'#40a0ff'}],['iceslime','slime',{v:'#8ad0f0',V:'#3a7aa0',p:'#d8f4ff'}],
 ['yukirei','bookghost',{V:'#a0c8e0',w:'#f0f8ff',q:'#80a0c0',p:'#c8e8ff',o:'#40a0ff'}],['onimusha','gald',{a:'#a03030',A:'#601818',r:'#202020',R:'#101010',s:'#c09080',d:'#302020',y:'#e0c040',e:'#ffe040'}],
 ['boss5','wolf',{g:'#f4f8ff',G:'#90b0d0',w:'#ffffff',x:'#a040ff'}]]){SPR[k]=SPR[b];IMG[k]=mk(SPR[b],pal);IMG[k+'_w']=mk(SPR[b],null,'#ffffff');}
IIS.fist=["","...MMMMM....","..MmmmmmM...","..MmMmMmM...","..MmmmmmMM..","..MmmmmmmM..","...MmmmmM...","...MbbbbM...","...bbbbbb...","...bbbbbb..."];ITYPE.unshift(['手甲','fist']);
Object.assign(EA,{blizzard:{n:'絶対氷河',el:'氷',k:'mag',pow:2.5,t:'all'},icewave:{n:'氷華の息',el:'氷',k:'mag',pow:1.2,t:'all'},slash2:{n:'鬼斬り',el:'斬',k:'phys',pow:1.5,t:'one'}});
Object.assign(ED,{
 snowwolf:{name:'雪狼',mhp:170,atk:62,def:18,mag:20,res:14,spd:16,weak:['炎','雷'],xp:30,gold:20,drop:[['kiba',.5]],acts:[['claw',.6],['bite',.4]]},
 iceslime:{name:'氷スライム',mhp:180,atk:54,def:24,mag:40,res:20,spd:8,weak:['炎','打'],xp:28,gold:20,drop:[['haiseki',.5]],acts:[['claw',.5],['icewave',.5]]},
 yukirei:{name:'雪霊',mhp:160,atk:30,def:16,mag:70,res:12,spd:14,weak:['炎','光'],xp:32,gold:22,drop:[['kakera',.25]],acts:[['curse',.5],['icewave',.5]]},
 onimusha:{name:'鬼武者',mhp:240,atk:72,def:26,mag:20,res:16,spd:11,weak:['光','氷'],xp:36,gold:26,drop:[['kiba',.3],['kakera',.2]],acts:[['slash2',.6],['claw',.4]],flip:1},
 boss5:{name:'氷華の妖狐',mhp:10000,atk:250,def:72,mag:285,res:70,spd:16,weak:['炎','雷'],sc:3,boss:true,xp:3600,gold:4000,drop:[['kakera',1],['kakera',1],['kakera',1],['kakera',1],['kakera',1]],
  ai:{every:3,charge:'blizzard',acts:[['claw',.4],['bite',.3],['icewave',.3]],summon:'yukirei',sumLv:29},ilv:30}});
HB.hakua={name:'ハクア',mhp:260,atk:46,def:22,mag:24,res:26,spd:15,g:{mhp:'B',atk:'S',def:'C',mag:'C',res:'B',spd:'A'},skills:['shouken','hyouken','renken']};
Object.assign(SK,{shouken:{n:'掌拳',sp:15,el:'打',k:'phys',pow:1.3,t:'one',d:'打撃・単体'},hyouken:{n:'氷拳',sp:20,el:'氷',k:'phys',pow:1.5,t:'one',d:'氷属性の拳'},renken:{n:'連拳',sp:25,el:'打',k:'phys',pow:.6,hits:3,t:'one',d:'打撃3連打'},
 tsurara:{n:'氷柱落とし',sp:35,el:'氷',k:'phys',pow:1,t:'all',d:'氷・敵全体'},kakato:{n:'踵落とし',sp:35,el:'打',k:'phys',pow:2.3,t:'one',d:'打撃・単体の大技'},
 ranbu:{n:'乱舞',k:'rhythm',t:'one',d:'光る輪が重なる瞬間にタップで連撃（最大12）。12連で凍結'},hyoukajin:{n:'氷華陣',el:'氷',k:'phys',pow:1.2,t:'all',d:'氷・敵全体'}});
AW.hakua={name:'氷華乱舞',type:'入力型',turns:2,cmds:['ranbu','hyoukajin']};
AWD.hakua='タイミングよくタップするほど連撃が伸びる（最大12）。12連成功で敵を凍結';
BDEF.hakua=mkB('氷華座',[['atkP'],['spd'],['crit'],['mhpP'],['defP'],['weakDmg','resP']],['2,-3','-2,-1','-3,2','2,1'],'tsurara','kakato',[[{atkP:12},'剛拳：攻撃+12%'],[{crit:10},'見切り：会心率+10%'],[{spd:2},'疾駆：素早さ+2'],[{weakDmg:20},'急所：弱点ダメ+20%']]);
BOARD.hakua=buildBoard('hakua');
Object.assign(RESO,{'hakua,mire':'氷炎の舞','hakua,rio':'灯華一閃','hakua,shion':'雪影','gald,hakua':'氷壁の陣'});
const MAP5=["####################","#hhhhhhhhBhhhhhhhhh#","#hhhhhhhhhhhhhhhhUh#","#hCh#hhhhhhhhh#hhhh#","#hhh#hhhhhhhhh#hhhh#","#######hhhhhh#######","TTTTTT#hhhhhh#TTTTTT","TTTT...,,,,,,...TTTT","TTT...,,,,,,,,...TTT","TT..T..,,,,,,..T..TT","T....iiiiiiiiii....T","T.C.iiiiRiiiiiii...T","T...iiiiiiiiiRiii..T","T..iiiRiiiiiiiiii..T","T...iiiiiiiiiiii...T","TT...,,,,,,,,,,..G.T","T..G..,,,,,,,,....TT","TT.....,,,,,,.....TT","T..TT...,,,,...C..TT","T..TT...,,,,......TT","TT.....,,,,....TT..T","T~~~...,,,,......~~T","T~~~~..,,,,.....~~~T","TT~~...,,,,..C...~TT","TTT....,,,,......TTT","TTTT....,,,....TTTTT","TTTTTT..,S,.TTTTTTTT","TTTTTTTTTTTTTTTTTTTT"].map(r=>r.padEnd(20,'T').slice(0,20));
AREAS.kouka={name:'東方の島・氷華の社',map:MAP5,lv:[24,30],groups:[['snowwolf'],['snowwolf','snowwolf'],['iceslime','snowwolf'],['yukirei','iceslime'],['iceslime','iceslime','snowwolf']],
 libGroups:[['onimusha'],['onimusha','yukirei'],['yukirei','yukirei'],['onimusha','onimusha']],crew:[{gold:4000},{loot:[27,2]},{item:'feather',n:3},{loot:[28,3]}],boss:{kind:'boss5',lv:30},bflag:'boss5',theme:'ice',rec:'推奨Lv24〜30',
 intro:'<b>第4章　東方の島</b>――雪に閉ざされた島。<b>氷の上は止まるまで滑る</b>。岩を目印に進もう。北の氷華の社に、星片を守る巫女がいるという。'};
const Q4=[{id:'q7',n:'社の主',d:'氷華の妖狐を倒す',ok:()=>!!G.flags.boss5,pg:()=>G.flags.boss5?'達成':'未達成',rw:'8000G・不死鳥の羽×3',give:()=>{G.gold+=8000;addItem('feather',3);}}];
function hakuaEvent(){F.pause=true;banner('ハクア','#bff4ff');
 log('<b>ハクア</b>「あっ、お客さん！？ 社に来る人なんて何年ぶりだろ！」<br>「……そっか、空の穴を閉じに行くんだ。巫女の使命なんてガラじゃないけど――一緒に行かせて！ お腹すいたし！」');
 menu([{l:'仲間にする',cls:'ready',f:()=>{G.flags.hakuaMet=1;newMember('hakua');SFX.aw();save();fieldMenu('<b>ハクアが仲間になった！</b>'+(G.party.includes('hakua')?'':'（控えに入った）'));renderPartyStatic();}},
  {l:'今はやめる',f:()=>{G.flags.hakuaMet=1;G.declined=[...(G.declined||[]),'hakua'];save();fieldMenu('ハクア「えー！ じゃあ酒場で待ってるね！」');}}]);}
function rhythm(){return new Promise(res=>{const ov=document.createElement('div');ov.className='rhy';ov.innerHTML='<div class="rt"></div><div class="rr"></div><div class="rc">0</div><div class="rl">TAP!</div>';$('#stage').appendChild(ov);
 const P=640,t0=performance.now()+400,rr=ov.querySelector('.rr'),rc=ov.querySelector('.rc');let hits=0,last=-1,done=false;
 const loop=now=>{if(done)return;const ph=(now-t0)/P,b=Math.floor(ph);if(b>=12){done=true;setTimeout(()=>{ov.remove();res(hits);},250);return;}
  rr.style.transform=`translate(-50%,-50%) scale(${ph<0?2.6:2.6-1.8*(ph-b)})`;requestAnimationFrame(loop);};
 ov.onpointerdown=e=>{e.preventDefault();const ph=(performance.now()-t0)/P,b=Math.floor(ph);if(ph<0||b===last||b>=12)return;last=b;const sc=2.6-1.8*(ph-b),ok=Math.abs(sc-1)<.24;
  ov.classList.remove('ok','ng');void ov.offsetWidth;ov.classList.add(ok?'ok':'ng');if(ok){hits++;rc.textContent=hits;SFX.weak();}else SFX.sel();};
 requestAnimationFrame(loop);});}
