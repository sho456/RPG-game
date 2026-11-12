/* ===== 第2章データ ===== */
Object.assign(PAL,{j:'#3aa868',J:'#1e6a3e'});
Object.assign(SPR,{
shion:["................",".....GgggG......","....GgggggggG...","...jjjjjjjjjj...","....gssggggG....","....esssgggG....","....ssssggG.....","m....sJjjjJ.....",".m..sJjjjjjJ....","..ms.JjjjjjJs...","....JbbbbbbJ.m..",".....JjjjjJ...m.",".....JjjjjJ.....",".....bb..bb.....",".....bb..bb.....","....bbb..bbb...."],
noah:["......kkkk......",".....kkkkkk.....","....kkyyyykk....","....kssskkkkq...","....kesskkkkq...","....qsssskkq....",".....qssqkkq....","...y.wwwwwwq....","...ywwywwywwq...","...y.wwwwwwwq...","...ysqwwwwwwq...","...y.wwywwwww...","...y.wwwwwwwww..","..yyywwwwwwwwww.","......qq.qq.....",".....qqq.qqq...."]});
AWP.shion={j:'#7af0ff',J:'#2a8ab0',g:'#e0e8ff',G:'#8090c0'};AWP.noah={w:'#fff6c8',y:'#ffd040',k:'#ffe9a0'};
for(const k of['shion','noah']){IMG[k]=mk(SPR[k]);IMG[k+'_w']=mk(SPR[k],null,'#ffffff');IMG[k+'_aw']=mk(SPR[k],AWP[k]);}
for(const[k,b,pal]of[['darkknight','gald',{a:'#3a3048',A:'#1e1828',r:'#6a2a8a',R:'#3a1050',s:'#7a6a8a',d:'#2a2030',y:'#8a6ab0',e:'#ff4040'}],['cursedslime','slime',{v:'#7a3a5a',V:'#3a1a2a',p:'#c07090'}],
 ['shade','bookghost',{V:'#1a1a2a',w:'#4a4a6a',q:'#8a8aaa',p:'#6a6a9a',o:'#ff4040'}],['boss3','boss',{v:'#c8b070',V:'#6a5a30',p:'#fff0b0',y:'#ff4040',o:'#ff2020'}]]){SPR[k]=SPR[b];IMG[k]=mk(SPR[b],pal);IMG[k+'_w']=mk(SPR[b],null,'#ffffff');}
Object.assign(EA,{wave2:{n:'影の波',el:'闇',k:'mag',pow:.9,t:'all'},bell:{n:'終末の鐘',el:'闇',k:'mag',pow:2.8,t:'all'}});
Object.assign(ED,{
 darkknight:{name:'亡霊騎士',mhp:210,atk:62,def:18,mag:10,res:14,spd:9,weak:['光','雷'],xp:20,gold:14,drop:[['kiba',.3],['kakera',.15]],acts:[['claw',.6],['slam',.4]],flip:1},
 cursedslime:{name:'呪縛スライム',mhp:170,atk:54,def:12,mag:42,res:12,spd:8,weak:['炎','光'],xp:16,gold:10,drop:[['haiseki',.3]],acts:[['claw',.6],['curse',.4]]},
 shade:{name:'影法師',mhp:150,atk:30,def:14,mag:62,res:10,spd:13,weak:['光','風'],xp:19,gold:12,drop:[['kakera',.25]],acts:[['curse',.6],['wave2',.4]]},
 boss3:{name:'虚ろの司祭',mhp:5600,atk:172,def:48,mag:162,res:40,spd:11,weak:['風','炎'],sc:3,boss:true,xp:900,gold:1200,drop:[['kakera',1],['kakera',1],['kakera',1],['kakera',1]],
  ai:{every:3,charge:'bell',acts:[['claw',.4],['wave',.3],['curse',.3]],summon:'darkknight',sumLv:15},ilv:16}});
HB.shion={name:'シオン',mhp:200,atk:34,def:16,mag:18,res:16,spd:16,g:{mhp:'C',atk:'A',def:'D',mag:'C',res:'C',spd:'S'},skills:['nusumu','shippu','kagenui']};
HB.noah={name:'ノア',mhp:230,atk:16,def:22,mag:34,res:40,spd:9,g:{mhp:'B',atk:'D',def:'B',mag:'A',res:'S',spd:'C'},skills:['inori','holy','mamori']};
Object.assign(SK,{
 nusumu:{n:'盗む',sp:10,el:'突',k:'phys',pow:.6,t:'one',steal:1,d:'攻撃しつつ素材や道具を盗む'},
 shippu:{n:'疾風斬',sp:20,el:'風',k:'phys',pow:1.4,t:'one',w:.8,d:'風属性・次の手番が早い'},
 kagenui:{n:'影縫い',sp:20,el:'突',k:'phys',pow:1,t:'one',delay:40,d:'突き＋行動を遅らせる'},
 kirisame:{n:'斬雨',sp:30,el:'風',k:'phys',pow:.9,t:'all',d:'風属性・敵全体'},
 ansatsu:{n:'暗殺',sp:35,el:'突',k:'phys',pow:2.4,t:'one',d:'急所を突く大技'},
 renei:{n:'連影斬',el:'風',k:'phys',pow:1.1,hits:2,t:'one',d:'風の2連撃'},
 kagenui2:{n:'影縫い・極',el:'突',k:'phys',pow:1,t:'all',delay:40,d:'敵全体の行動を遅らせる'},
 goudatsu:{n:'強奪',el:'突',k:'phys',pow:1.2,t:'one',steal:2,d:'レア以上の装備を確実に奪う'},
 inori:{n:'祈り',sp:15,k:'heal',pow:.35,t:'ally',d:'味方のHP35%回復'},
 holy:{n:'ホーリー',sp:20,el:'光',k:'mag',pow:1.5,t:'one',d:'光の魔法・単体'},
 mamori:{n:'守りの祈り',sp:30,k:'barrier',t:'self',d:'2ターン味方の被ダメ-30%'},
 raise:{n:'レイズ',sp:40,k:'revive',t:'ally',revive:1,d:'戦闘不能をHP40%で復活'},
 holyrain:{n:'ホーリーレイン',sp:35,el:'光',k:'mag',pow:.9,t:'all',d:'光の魔法・敵全体'},
 seiiki:{n:'聖域の祈り',k:'healAll',pow:.25,t:'self',d:'味方全員のHP25%回復'},
 seikou2:{n:'聖光',el:'光',k:'mag',pow:1.5,t:'all',d:'光の魔法・敵全体'}});
AW.shion={name:'影縫いの刻',type:'ターン制',turns:3,cmds:['renei','kagenui2','goudatsu']};
AW.noah={name:'機巧の聖域',type:'領域型',turns:3,cmds:['seiiki','seikou2']};
BDEF.shion={star:'疾風座',sec:[['spd','crit'],['atkP'],['weakDmg'],['mhpP'],['defP'],['drop','spGain']],mask:['2,-3','-2,-1','-3,2','2,1'],
 sp:{'2,-2':{t:'skill',v:'kirisame'},'-2,2':{t:'skill',v:'ansatsu'},'0,-3':{t:'aw',v:{awTurn:1},d:'連続行動+1'},'3,-3':{t:'aw',v:{noRecoil:1},d:'星臨の反動を無効'},
  '3,0':{t:'fork',g:1,v:{atkP:12},d:'迅刃：攻撃+12%'},'0,3':{t:'fork',g:1,v:{spd:2},d:'疾駆：素早さ+2'},'-3,0':{t:'fork',g:2,v:{drop:15},d:'目利き：ドロップ率+15%'},'-3,3':{t:'fork',g:2,v:{crit:10},d:'急所：会心率+10%'}}};
BDEF.noah={star:'機巧座',sec:[['resP'],['magP'],['mhpP'],['defP'],['spGain'],['startAG','awDmg']],mask:['3,-1','-1,-2','-2,3','1,2'],
 sp:{'2,-2':{t:'skill',v:'raise'},'-2,2':{t:'skill',v:'holyrain'},'0,-3':{t:'aw',v:{awTurn:1},d:'聖域の持続+1'},'3,-3':{t:'aw',v:{noRecoil:1},d:'星臨の反動を無効'},
  '3,0':{t:'fork',g:1,v:{resP:15},d:'聖骸：精神+15%'},'0,3':{t:'fork',g:1,v:{mhpP:15},d:'機巧：最大HP+15%'},'-3,0':{t:'fork',g:2,v:{magP:12},d:'神威：魔力+12%'},'-3,3':{t:'fork',g:2,v:{defP:15},d:'鉄甲：防御+15%'}}};
BOARD.shion=buildBoard('shion');BOARD.noah=buildBoard('noah');
Object.assign(RESO,{'rio,shion':'閃光迅影','gald,noah':'鉄壁の聖堂','mire,noah':'聖炎の祈り','noah,rio':'星灯の祈り','gald,shion':'影城塞','mire,shion':'風火輪','noah,shion':'影と聖印'});
const MAG=id=>id==='mire'||id==='noah'||id==='crow'||id==='celes';
const MAP3=["####################","#zzzzzzz#zz#zzzzzzz#","#zCzzzzz#zB#zzzzzNz#","#zzzzzzz#zz#zzzzzzz#","#zzzzzzzzzzzzzzzzzz#","####zz######zz######","#zzzzzzzzzzzzzzzzzz#","#zPzzPzzPzzPzzPzzPz#","#zzzzzzzzzzzzzzzzzz#","#zPzzPzzPzzPzzPzzPz#","#zzzzzzzzzzzzzzzzCz#","#zPzzPzzPzzPzzPzzPz#","#zzzzzzzzzzzzzzzzzz#","#######zzzzzz#######","TTTTT##zzzzzz##TTTTT","TTTT...,,,,,,...TTTT","TTT..G..,,,,..R..TTT","TT..C...,,,,......TT","TT.....,,,,.....G.TT","TT..RR..,,,,......TT","TTT.....,,,,.....TTT","TT......,,,,..TT..TT","TT..TT..,,,,..TT.CTT","TT..TT...,,,......TT","TTT.......,,,....TTT","TTTT.......,,,..TTTT","TTTTTT.....,,,.TTTTT","TTTTTTTT....,S.TTTTT","TTTTTTTTTTTTTTTTTTTT"].map(r=>r.padEnd(20,'T').slice(0,20));
AREAS.seido={name:'祈りの廃聖堂',map:MAP3,lv:[11,16],groups:[['cursedslime','cursedslime'],['darkknight'],['shade','cursedslime'],['darkknight','shade'],['shade','shade','cursedslime']],
 libGroups:[['darkknight','shade'],['shade','shade'],['darkknight','darkknight']],crew:[{gold:800},{loot:[14,2]},{item:'feather',n:2},{loot:[15,3]}],boss:{kind:'boss3',lv:16},bflag:'boss3',theme:'chapel',rec:'推奨Lv11〜16',
 intro:'<b>第2章　祈りの廃聖堂</b>――祈りの声が途絶えて久しい聖堂。奥で、星片で動く人形が眠っているという。'};
const Q2=[{id:'q4',n:'盗まれた鍵',d:'翠の森で翠狼を5体倒し、盗まれた鍵を取り返す',ok:()=>(G.q.jade||0)>=5,pg:()=>`${Math.min(5,G.q.jade||0)}/5`,rw:'？？？',give:()=>{newMember('shion');}},
 {id:'q5',n:'聖堂の闇',d:'虚ろの司祭を倒す',ok:()=>!!G.flags.boss3,pg:()=>G.flags.boss3?'達成':'未達成',rw:'2000G・不死鳥の羽×2',give:()=>{G.gold+=2000;addItem('feather',2);}}];
function noahEvent(){F.pause=true;banner('ノア','#ffe9a0');
 log('祭壇の脇で、白い人形が眠っている。胸の星片が、リオの星片に呼応して光った。<br><b>ノア</b>「……起動。あなたが、わたしを起こした方ですね。……祈りの続きを、手伝わせてください」');
 menu([{l:'仲間にする',cls:'ready',f:()=>{G.flags.noahMet=1;newMember('noah');SFX.aw();save();fieldMenu('<b>ノアが仲間になった！</b>'+(G.party.includes('noah')?'':'（控えに入った）'));renderPartyStatic();}},
  {l:'今はやめる',f:()=>{G.flags.noahMet=1;G.declined=[...(G.declined||[]),'noah'];save();fieldMenu('ノアは再び目を閉じた。（酒場で誘える）');}}]);}
