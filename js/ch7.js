/* ===== ver0.13 終章「星核の残響」 ===== */
for(const[k,b,pal]of[['last1','golem',{a:'#d8d0ff',A:'#7060c0',o:'#ffffff',y:'#ffe9a0',u:'#b0a0ff'}],['last2','wolf',{g:'#2a1048',G:'#120624',w:'#c080ff',x:'#ff40ff'}],
 ['last3','rio',{H:'#2a0a4a',h:'#4a1a7a',s:'#c8b0e0',e:'#ff40ff',m:'#ff40ff',C:'#3a1a5a',c:'#5a2a8a',w:'#1a0a2a',y:'#ff80ff',b:'#100818'}]]){SPR[k]=SPR[b];IMG[k]=mk(SPR[b],pal);IMG[k+'_w']=mk(SPR[b],null,'#ffffff');}
EA.voidend={n:'虚無の終焉',el:'陰',k:'mag',pow:2.7,t:'all'};
EA.eclipse={n:'星蝕',el:'陰',k:'phys',pow:2.4,t:'all'};
const LASTD={boss:true,sc:3,drop:[['kakera',1],['kakera',1],['kakera',1]],xp:0,gold:0,ilv:55};
ED.last1=Object.assign({},LASTD,{name:'星核の残響',mhp:18000,atk:400,def:104,mag:430,res:100,spd:17,weak:['陰','雷'],ai:{every:3,charge:'starfall',acts:[['slam',.4],['wave',.3],['curse',.3]],summon:'shade',sumLv:52},
 intro:'星核の残響が砕け、虚の奥から黒い獣が這い出した――'});
ED.last2=Object.assign({},LASTD,{name:'虚獣ノクス',mhp:21000,atk:470,def:100,mag:430,res:96,spd:19,weak:['陽','熱'],ai:{every:3,charge:'eclipse',acts:[['claw',.4],['slam',.3],['curse',.3]],summon:'shade',sumLv:52},
 intro:'ノクス「器よ……その空白、我がもらい受ける」<br>獣の影が、リオと同じ姿へと形を変えていく――'});
ED.last3=Object.assign({},LASTD,{name:'虚神ノクス',mhp:27000,atk:480,def:108,mag:510,res:104,spd:18,weak:['陽'],flip:1,xp:12000,gold:20000,drop:[['kakera',1],['kakera',1],['kakera',1],['kakera',1],['kakera',1],['kakera',1]],
 ai:{every:3,charge:'voidend',acts:[['mirror',.35],['curse',.35],['wave',.3]],summon:'shade',sumLv:54},ilv:58});
SK.zenkyo={n:'全共鳴',k:'zen',t:'all',d:'終の星臨：仲間全員の灯を束ねる大技。全員のAGを力に変える（1戦闘1回）'};

const echoN=()=>Object.keys(G.flags.echo||{}).length;

AREAS.zankyo={name:'星核の残響',lv:[50,54],theme:'void',rec:'推奨Lv50〜55',bflag:'boss8',boss:{kind:'last1',lv:55},stages:['last1','last2','last3'],
 map:['####################','#########B##########','########ttt#########','##C#####ttt#####G###','##t######t######t###','##tttttttttttttttt##','##t#####t###t####t##','#Yt#####t###t####tY#',
  '#tt##tttttttttt##tt#','#t###t###tt###t###t#','#t###t###tt###t###t#','#ttttt##tttt##ttttt#','###t####tYtt####t###','###t####tttt####t###','##Ctt####tt####ttC##','####t####tt####t####',
  '####tttttttttttttG##','#######t####t#######','####tttttttttttt####','####t####tt####t####','##Gtt####tt####tt###','#########tt#########','#########St#########','####################'],
 groups:[['darkknight','shade'],['onimusha','yukirei','shade'],['golemkin','golemkin'],['minerghost','darkknight'],['shade','shade','shade']],
 crew:[{loot:[54,3]},{gold:15000},{loot:[55,4]}],
 intro:'<b>終章　星核の残響</b>――塔の頂から落ちた先は、星々の記憶が漂う虚の底。<b>3つの残響</b>を辿り、星核の扉を開け。'};

QS.push({id:'q10',n:'星継ぎの灯',d:'虚神ノクスを倒す',ok:()=>!!G.flags.boss8,pg:()=>G.flags.boss8?'達成':`残響${echoN()}/3`,rw:'50000G・星の雫Ⅱ×5',give:()=>{G.gold+=50000;addItem('drop2',5);}});
