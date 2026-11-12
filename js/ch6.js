/* ===== ver0.12 レジェンド・新ジョブ・天への塔 ===== */
Object.assign(LEG,{hoshikuzu:{n:'星屑の外套',slot:'body',d:'毎ターンHP5%回復'},kagerou:{n:'陽炎の兜',slot:'head',d:'戦闘中1度だけ攻撃を完全回避'},gyokuza:{n:'玉座の盾',slot:'sub',d:'受けるダメージ-15%'},
 kiseki:{n:'奇跡の指輪',slot:'acc',d:'戦闘不能になった時、1度だけHP30%で復活'},senkou:{n:'閃光の首飾り',slot:'acc',d:'戦闘開始時AG+50'},tenkyuu:{n:'天弓アステリア',slot:'w',who:'erna',d:'通常攻撃が2回攻撃になる'},
 meikai:{n:'冥界の大鎌',slot:'w',who:'crow',d:'与ダメージの20%をHP吸収'},hyouga:{n:'氷河の手甲',slot:'w',who:'hakua',d:'乱舞の連撃+4（最大16）'},taiyou:{n:'太陽の魔導書',slot:'w',who:'mire',d:'魔法の威力+25%'}});
ITYPE.unshift(['外套','armor']);
Object.assign(SK,{kazemai:{n:'疾風の舞',sp:20,k:'haste',t:'self',d:'味方全員の次の手番を早める'},ouen:{n:'応援の舞',sp:25,k:'cheer',t:'self',d:'味方全員のAG+15'},
 megumi:{n:'星の恵み',sp:25,k:'grace',t:'ally',d:'味方1人のAG+40'},hoshiyomi:{n:'星読み',sp:15,k:'scan',t:'self',d:'敵全体の弱点をすべて暴く'}});
Object.assign(JOBS,{odoriko:{n:'舞踏家',d:'味方を加速させる',sk:[[1,'kazemai'],[4,'ouen']],ps:[[7,{startAG:15},'開始時AG+15'],[10,{spd:1.5},'素早さ+1.5']]},
 seijutsu:{n:'星術師',d:'星臨を支える（第5章クリアで解放）',lock:()=>!G.flags.boss6,sk:[[1,'megumi'],[4,'hoshiyomi']],ps:[[7,{awDmg:15},'星臨中与ダメ+15%'],[10,{noRecoil:1},'星臨の反動を無効']]}});
/* --- 天への塔 --- */
const G_TOWER_DEF={cp:1,cur:1};
const TMOBS=['raiwolf','golemkin','onimusha','drowned','jelly','snowwolf','darkknight','shade','yukirei','minerghost','iceslime','waterslime'];
ED.tower10=Object.assign({},ED.golemboss,{name:'塔の番兵',mhp:9800,atk:430,mag:300,def:96,res:60,ilv:42});
ED.tower20=Object.assign({},ED.boss5,{name:'天狐の残照',mhp:14000,atk:360,mag:420,def:96,res:96,ilv:46});
for(const[k,b,pal]of[['boss7','golem',{a:'#e8e0c0',A:'#a89060',o:'#40e0ff',y:'#ffffff',u:'#40e0ff'}],['tower10','golem',{a:'#6a7aa0',A:'#3a4a70',o:'#ff40a0',y:'#ffd0f0',u:'#ff40a0'}],['tower20','wolf',{g:'#ffe0a0',G:'#c09040',w:'#ffffff',x:'#ff4040'}]]){SPR[k]=SPR[b];IMG[k]=mk(SPR[b],pal);IMG[k+'_w']=mk(SPR[b],null,'#ffffff');}
EA.starfall={n:'星墜とし',el:'光',k:'mag',pow:2.6,t:'all'};
ED.boss7={name:'星核の守護者',mhp:20000,atk:360,def:96,mag:390,res:96,spd:17,weak:['闇','雷'],brk:16,sc:3,boss:true,xp:9000,gold:12000,drop:[['kakera',1],['kakera',1],['kakera',1],['kakera',1],['kakera',1],['kakera',1]],
 ai:{every:3,charge:'starfall',acts:[['slam',.4],['wave',.3],['curse',.3]],summon:'shade',sumLv:48},ilv:50};
function genFloor(f){const R=rng(f*977+13),Wd=20,Hd=24,g=Array.from({length:Hd},()=>Array(Wd).fill('#')),rooms=[];
 for(let i=0;i<40&&rooms.length<7;i++){const w=4+(R()*4|0),h=3+(R()*3|0),x=1+(R()*(Wd-w-2)|0),y=1+(R()*(Hd-h-2)|0);if(rooms.some(r=>x<r.x+r.w+1&&x+w+1>r.x&&y<r.y+r.h+1&&y+h+1>r.y))continue;rooms.push({x,y,w,h,cx:x+(w>>1),cy:y+(h>>1)});}
 rooms.sort((a,b)=>b.cy-a.cy);rooms.forEach(r=>{for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)g[y][x]='t';});
 for(let i=1;i<rooms.length;i++){const a=rooms[i-1],b=rooms[i];let x=a.cx,y=a.cy;while(x!==b.cx){g[y][x]='t';x+=Math.sign(b.cx-x);}while(y!==b.cy){g[y][x]='t';y+=Math.sign(b.cy-y);}g[y][x]='t';}
 const s=rooms[0],e=rooms[rooms.length-1],boss=f%10===0;g[s.cy][s.cx]='S';if(f<30)g[e.cy][e.cx]=boss?'Q':'^';if(boss){g[e.cy][f<30?e.cx-1:e.cx]='B';}
 for(let i=1;i<rooms.length-1&&i<4;i++){const r=rooms[i];g[r.y][r.x]=i===2?'G':'C';}
 return g.map(r=>r.join(''));}
function makeTowerArea(f){const lv=38+Math.floor(f*.4),map=genFloor(f),boss=f%10===0,bk=f===30?'boss7':f===20?'tower20':'tower10';
 return{name:`天への塔 ${f}階`,map,lv:[lv,lv],groups:[0,1,2,3,4].map(i=>{const n=1+((f+i)%3);return Array.from({length:n},(_,j)=>TMOBS[(f*3+i*5+j*7)%TMOBS.length]);}),
  crew:[{loot:[lv,2]},{gold:3000+f*300},{loot:[lv,3]}],boss:boss?{kind:bk,lv}:null,bossKind:boss?()=>bk:null,bflag:boss?(f===30?'boss7':'tw'+f):'',theme:'tower',rec:`Lv${lv}`,
  intro:`<b>天への塔 ${f}階</b>――星空へ続く白亜の塔。${f%5===1?'（中継地点）':''}${boss?'<b>この階には番人がいる</b>。倒さないと階段は開かない。':'光る階段から上の階へ。'}`};}
function towerMenu(){if(!G.tower)G.tower={...G_TOWER_DEF};const cps=[];for(let f=1;f<=G.tower.cp;f+=5)cps.push(f);
 log(`<b>天への塔</b>　5階ごとの中継地点から挑める（最高到達：${G.tower.max||1}階）`+goldTxt());
 menu([...cps.map(f=>({l:`${f}階から`,s:`推奨Lv${38+Math.floor(f*.4)}`,cls:f===cps[cps.length-1]?'ready':'',f:()=>enterTower(f)})),{l:'戻る',cls:'back',f:worldMap}],true);}
function enterTower(f,keep){G.tower.cur=f;G.tower.max=Math.max(G.tower.max||1,f);if(f%5===1&&f>G.tower.cp)G.tower.cp=f;AREAS.tower=makeTowerArea(f);enterField('tower',keep);if(keep&&f%5===1)banner(`中継地点 ${f}階を記録した`,'#9fd8ff');save();}
const Q6=[{id:'q9',n:'天への塔',d:'星核の守護者を倒す',ok:()=>!!G.flags.boss7,pg:()=>G.flags.boss7?'達成':`最高${(G.tower&&G.tower.max)||0}階`,rw:'30000G・不死鳥の尾×3',give:()=>{G.gold+=30000;addItem('tail',3);}}];
