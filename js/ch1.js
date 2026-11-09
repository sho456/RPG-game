/* ===== 第1章データ ===== */
Object.assign(PAL,{P:'#8a5ad8',Q:'#5a3a9a',n:'#d84a6a',N:'#8a2a44',u:'#4a90d0',q:'#6a6a80'});
Object.assign(SPR,{
mire:["......QPPQ......",".....QPPPPP.....","....QPPPPPPP....","....PPssPPPPQ...","....PesPPPPPQ...","....sssPPPPQ....",".....ssNnPPQ....","..y.nNnnnNPQ....",".yuy.nnwnnNP....",".yuuy.nnnnN.....","..yy.Nnnnnn.....",".....Nnnnnnn....","....Nnnnnnnnn...","....NNnnnnnNN...","......bb.bb.....",".....bbb.bbb...."],
shroom:["................","................","................",".....rrrrrr.....","...rrrwrrrrrr...","..rrwwrrrrwrrr..",".rrrrrrrrrrwrrr.",".RRrrrrrrrrrrRR.","..RRRRRRRRRRRR..",".....wwwwww.....",".....wewwew.....",".....wwwwww.....","....wwwwwwww....","....wwwwwwww....",".....ww..ww.....","................"],
bookghost:["................","................","....p......p....","...pVVVV.VVVVp..","..pVwwwwVwwwwVp.","..VwwqqwVwqqwwV.","..VwwwwwVwwwwwV.","..VwqqwwVwwqqwV.","..VwwwwwVwwwwwV.","..VVVVVVoVVVVVV.","...VVVVVVVVVVV..","......pvvp......",".......vv.......","......p..p......","................","................"],
golem:["....aaaaaaaa....","...aAAAAAAAAa...","...aAoAAAAoAa...","...aAAAAAAAAa...","....aAAyyAAa....",".aaaaaaaaaaaaaa.","aAAaAAAuuAAAaAAa","aAAaAAuyyuAAaAAa","aAAaAAAuuAAAaAAa","aAA.aAAAAAAa.AAa",".aa.aAAAAAAa.aa.","....aAAAAAAa....","....aAA..AAa....","....aAA..AAa....","...aaAA..AAaa...","...AAAA..AAAA..."]});
AWP.mire={P:'#b0e0ff',Q:'#6aa0e0',n:'#ff8a4a',N:'#c04a2a'};
for(const k of['mire','shroom','bookghost']){IMG[k]=mk(SPR[k]);IMG[k+'_w']=mk(SPR[k],null,'#ffffff');if(AWP[k])IMG[k+'_aw']=mk(SPR[k],AWP[k]);}
for(const[k,b,pal]of[['moss','slime',{v:'#4a8a4a',V:'#2a4a2a',p:'#8ad08a'}],['jadewolf','wolf',{g:'#5a8a6a',G:'#2a4a3a',w:'#c8e8c8'}],['boss2','golem',{a:'#9a8f7a',A:'#5e574a'}]]){SPR[k]=SPR[b];IMG[k]=mk(SPR[b],pal);IMG[k+'_w']=mk(SPR[b],null,'#ffffff');}
Object.assign(EA,{spore:{n:'胞子',el:'風',k:'mag',pow:.8,t:'all'},curse:{n:'呪詛の頁',el:'闇',k:'mag',pow:1.3,t:'one'},slam:{n:'石拳',el:'打',k:'phys',pow:1.2,t:'one'},kinju:{n:'禁呪・灰燼',el:'炎',k:'mag',pow:2.6,t:'all'}});
Object.assign(ED,{
 moss:{name:'苔スライム',mhp:160,atk:39,def:11,mag:20,res:12,spd:7,weak:['炎','光'],brk:2,xp:12,gold:8,drop:[['haiseki',.3],['kakera',.12]],acts:[['claw',.7],['press',.3]]},
 jadewolf:{name:'翠狼',mhp:140,atk:47,def:13,mag:8,res:10,spd:14,weak:['炎','斬'],brk:3,xp:16,gold:10,drop:[['kiba',.45]],acts:[['claw',.7],['bite',.3]]},
 shroom:{name:'毒茸',mhp:180,atk:40,def:14,mag:34,res:10,spd:8,weak:['炎','斬'],brk:3,xp:15,gold:9,drop:[['haiseki',.3]],acts:[['claw',.6],['spore',.4]]},
 bookghost:{name:'魔導書の亡霊',mhp:150,atk:24,def:16,mag:46,res:8,spd:11,weak:['炎','光'],brk:3,xp:18,gold:12,drop:[['kakera',.25]],acts:[['curse',.7],['claw',.3]]},
 boss2:{name:'禁書の守護像',mhp:3000,atk:122,def:40,mag:106,res:30,spd:9,weak:['氷','雷'],brk:10,sc:3,boss:true,xp:420,gold:600,drop:[['kakera',1],['kakera',1],['kakera',1],['kakera',1]],
  ai:{every:3,charge:'kinju',acts:[['slam',.6],['curse',.4]],summon:'bookghost',sumLv:9},ilv:10}});
ED.slime.acts=[['claw',.7],['press',.3]];ED.wolf.acts=[['claw',.7],['bite',.3]];ED.boss.ai={every:4,charge:'roar',acts:[['claw',.6],['wave',.4]],summon:'slime',sumLv:4};ED.boss.ilv=5;
HB.mire={name:'ミレイユ',mhp:190,atk:14,def:16,mag:40,res:30,spd:11,g:{mhp:'C',atk:'D',def:'C',mag:'S',res:'A',spd:'B'},skills:['fire','blizz','flamewave']};
Object.assign(SK,{fire:{n:'ファイア',sp:15,el:'炎',k:'mag',pow:1.4,t:'one',d:'炎の魔法・単体'},blizz:{n:'ブリザド',sp:15,el:'氷',k:'mag',pow:1.4,t:'one',d:'氷の魔法・単体'},
 flamewave:{n:'フレイムウェーブ',sp:30,el:'炎',k:'mag',pow:.9,t:'all',d:'炎の魔法・敵全体'},thunder:{n:'サンダー',sp:15,el:'雷',k:'mag',pow:1.4,t:'one',d:'雷の魔法・単体'},
 hyouga:{n:'氷河',sp:30,el:'氷',k:'mag',pow:.9,t:'all',d:'氷の魔法・敵全体'},
 fira2:{n:'ファイガ',k:'mag',el:'炎',pow:2,t:'one',gauge:25,d:'炎の大魔法（ゲージ25）'},blizz2:{n:'ブリザガ',k:'mag',el:'氷',pow:2,t:'one',gauge:25,d:'氷の大魔法（ゲージ25）'},
 zettai:{n:'絶対零度の太陽',k:'mag',el:null,pow:4.2,t:'all',req:'stk3',gaugeAll:1,d:'対消滅3段階で解禁・全体の大魔法'}});
AW.mire={name:'双極の書架',type:'ゲージ消費',turns:99,cmds:['fira2','blizz2','zettai']};
BDEF.mire={star:'双極座',sec:[['magP'],['resP'],['spd','crit'],['mhpP'],['defP'],['weakDmg','awDmg']],mask:['3,-2','-1,-2','-3,1','2,1'],
 sp:{'2,-2':{t:'skill',v:'thunder'},'-2,2':{t:'skill',v:'hyouga'},'0,-3':{t:'aw',v:{gaugeSave:5},d:'覚醒ゲージの消費-5'},'3,-3':{t:'aw',v:{noRecoil:1},d:'覚醒の反動を無効'},
  '3,0':{t:'fork',g:1,v:{magP:12},d:'灼星：魔力+12%'},'0,3':{t:'fork',g:1,v:{mhpP:15},d:'霜星：最大HP+15%'},
  '-3,0':{t:'fork',g:2,v:{awDmg:20},d:'極星：覚醒中与ダメ+20%'},'-3,3':{t:'fork',g:2,v:{weakDmg:20},d:'看破：弱点ダメ+20%'}}};
BOARD.mire=buildBoard('mire');
const RESO={'gald,rio':'灯火の城塞','mire,rio':'星火の書','gald,mire':'溶岩の城壁'};
const HPOS={1:[[130,46]],2:[[120,28],[140,62]],3:[[118,10],[140,44],[120,78]],4:[[116,2],[140,28],[118,56],[142,84]]};
function newMember(id){const lv=Math.max(1,Math.round(G.party.reduce((a,i)=>a+G.h[i].lv,0)/G.party.length)-2);
 G.h[id]={lv,xp:0,hp:null,eq:{w:null,sub:null,head:null,body:null,acc1:null,acc2:null},board:['0,0'],jobs:{},pass:[],job:null};
 const w=fixedItem('w',id,Math.max(1,lv-1));G.inv.push(w);G.h[id].eq.w=w.uid;if(!G.members.includes(id))G.members.push(id);if(G.party.length<4)G.party.push(id);}
/* --- エリア --- */
const MAP2=["####################","#KfKfKf##ff##fKfKfK#","#fffffff#fB#fffffff#","#fKfKff##ff##ffKfKf#","#ffffffffffffffffff#","#KK#fffKKffKKfff#KK#","#fC#ffffffffffff#Mf#","#ff#fKKfffffKKff#ff#","#ffffffffffffffffff#","#KKKfffKKffKKfffKKK#","#ffffffffffffffffff#","#fKfKfK#ff#KfKfKfCf#","#ffffff#ff#fffffff##","########ff##########","TTTTTTT.,,.TTTTTTTTT","TTTT.....,,....TTTTT","TT...G...,,.....C.TT","TT..TT...,,...TT..TT","T...TT..,,....TT...T","T......,,.........TT","TT...~~,,~~....R..TT","TT..~~~,,~~~......TT","TT...~~,,~~...TT..TT","TTT.....,,....TT..TT","TTC....,,..........T","TT....,,....TT....TT","TT..R.,,...TTTT.G.TT","TTT...,,....TT....TT","TTTT...,,.........TT","TTT.....,,....R...TT","TT..TT...,,.......TT","TT..TT....,,..TT..TT","TTT........,,.TT.TTT","TTTTT.......,,..TTTT","TTTTTTT.....,,.TTTTT","TTTTTTTT....,S.TTTTT","TTTTTTTTTTTTTTTTTTTT"].map(r=>r.padEnd(20,'T').slice(0,20));
const AREAS={
 haido:{name:'灰の街道',map:null,lv:[1,5],groups:[['slime'],['slime','slime'],['wolf'],['slime','wolf'],['wolf','slime','slime'],['wolf','wolf']],crew:[{gold:80},{item:'potion',n:2},{loot:[3,2]},{item:'drop',n:1}],boss:{kind:'boss',lv:5},bflag:'boss1',theme:'ash',rec:'推奨Lv1〜5',
  intro:'<b>灰の街道</b>――虚蝕に色を奪われた古い街道。'},
 midori:{name:'翠の森・沈黙の図書遺跡',map:MAP2,lv:[6,10],groups:[['moss','moss'],['jadewolf'],['shroom','moss'],['jadewolf','shroom'],['moss','jadewolf','shroom'],['bookghost'],['bookghost','bookghost']],
  libGroups:[['bookghost'],['bookghost','bookghost'],['bookghost','moss']],crew:[{gold:300},{loot:[9,2]},{item:'feather',n:1},{loot:[8,3]}],boss:{kind:'boss2',lv:10},bflag:'boss2',theme:'forest',rec:'推奨Lv6〜10',
  intro:'<b>第1章　翠の森</b>――深い森の奥に、星片の記録が眠るという「沈黙の図書遺跡」がある。'}};
