/* ===== ver0.14 クリア後：虚の回廊・竜の巣・セレス・ヴァルク・虚蝕化エリア ===== */
const S16=a=>a.map(r=>r.padEnd(16,'.').slice(0,16));
/* --- 仲間：セレス（時の魔女）・ヴァルク（竜人） --- */
SPR.celes=S16([".......VV.......","......VVvV......",".....VVvvyV.....","...VVVVVVVVVVV..","....kkkkkkkk....","....ksskkkkkk...","....esskkkkkk...","....ssskkkkk....",
 "..y..ssVvVkk....",".yuy.VvvvvVkk...","..y.sVvyyvvVk...","..b..VvvvvvV....","..b.VvvvvvvvV...","..b.VvvvvvvvvV..","..b.VVVVVVVVVV..",".....bb...bb...."]);
SPR.valk=S16(["...y.......y....","...yG.....Gy....","....GGGGGGG.....","....GrrrrrrG....","....GesrrrrG..R.","....rsssrrrG.RR.",".m...rssrrG.RRR.","mM..RRrrrrRRRRR.",
 "Mm.oRrrrrrrRRR..",".Mm.sRrorrrR....","..M..RrrrrrR....",".....GgggggG....",".....RrrrrrR....",".....RR...RR....",".....GG...GG....","....GGG...GGG..."]);
AWP.celes={V:'#f0e4ff',v:'#b89cff',k:'#ffffff',y:'#fff080',u:'#ffe27a'};AWP.valk={r:'#ff5a20',R:'#ffb040',G:'#2a0606',g:'#ff3a3a',e:'#fff060'};
for(const k of['celes','valk']){IMG[k]=mk(SPR[k]);IMG[k+'_w']=mk(SPR[k],null,'#ffffff');IMG[k+'_aw']=mk(SPR[k],AWP[k]);}
HB.celes={name:'セレス',mhp:200,atk:12,def:22,mag:44,res:40,spd:14,g:{mhp:'C',atk:'D',def:'B',mag:'S',res:'S',spd:'A'},skills:['tokiya','chien','kasoku']};
HB.valk={name:'ヴァルク',mhp:320,atk:44,def:30,mag:30,res:18,spd:10,g:{mhp:'S',atk:'S',def:'A',mag:'A',res:'C',spd:'C'},skills:['ryuuga','kokuen','ryuuhou']};
Object.assign(SK,{
 tokiya:{n:'刻の矢',sp:15,k:'mag',el:null,pow:1.5,t:'one',d:'無属性の魔法・単体（耐性に左右されない）'},
 chien:{n:'遅延の砂',sp:25,k:'mag',el:null,pow:.8,t:'all',delay:30,d:'無属性の全体魔法＋行動を遅らせる'},
 kasoku:{n:'加速の刻',sp:20,k:'haste',t:'self',d:'味方全員の次の手番を早める'},
 ryuusa:{n:'流砂の刻',sp:35,k:'mag',el:'地',pow:1.1,t:'all',d:'地の魔法・敵全体'},
 shuuen:{n:'終焉の針',sp:35,k:'mag',el:null,pow:2.5,t:'one',d:'無属性・単体の大魔法'},
 kokuha:{n:'刻破',k:'mag',el:null,pow:1.9,t:'all',d:'無属性の全体大魔法'},
 tokitome:{n:'時止め',k:'tstop',t:'all',d:'敵全体の時間を止め、行動を大きく遅らせる'},
 makimodoshi:{n:'巻き戻し',k:'rewind',t:'self',req:'snap',d:'円環に記録した瞬間まで味方のHP・SP・戦闘不能を巻き戻す（1戦闘1回・覚醒が解けても使える）'},
 gokuceles:{n:'永劫の円環',k:'mag',el:null,pow:3.2,t:'all',d:'覚醒Ⅲ：無属性の全体大魔法'},
 ryuuga:{n:'竜牙斬',sp:15,el:'炎',k:'phys',pow:1.5,t:'one',d:'炎の斬撃・単体'},
 kokuen:{n:'黒炎薙ぎ',sp:30,el:'闇',k:'phys',pow:.95,t:'all',d:'闇の斬撃・敵全体'},
 ryuuhou:{n:'竜の咆哮',sp:25,k:'roar',t:'all',d:'敵全体の行動を遅らせ、味方のAG+15'},
 gouka:{n:'劫火',sp:35,el:'炎',k:'phys',pow:1.1,t:'all',d:'炎・敵全体'},
 ryuumetsu:{n:'竜滅斬',sp:35,el:'斬',k:'phys',pow:2.4,t:'one',d:'斬撃・単体の大技'},
 ryuuen:{n:'竜炎',el:'炎',k:'phys',pow:1.5,t:'all',d:'炎の全体攻撃（自動）'},
 meiryuu:{n:'冥竜爪',el:'闇',k:'phys',pow:1.5,t:'all',d:'闇の全体攻撃（自動）'},
 gokuvalk:{n:'終焉竜咆',el:'炎',k:'phys',pow:2.6,t:'all',d:'覚醒Ⅲ：竜の全力・敵全体'}});
AW.celes={name:'刻の円環',type:'特殊',turns:3,cmds:['kokuha','tokitome','makimodoshi']};
AW.valk={name:'竜血覚醒',type:'ターン制',turns:3,cmds:['ryuuen','meiryuu']};
AWD.celes='発動の瞬間の味方全員のHP・SP・戦闘不能を記録。以降の好きな手番で1度だけ「巻き戻し」できる（覚醒が解けても使える）';
AWD.valk='竜化して与ダメ1.5倍。全体攻撃のみで、行動は自動（制御不能）。共鳴技はリオとだけ組める';
BDEF.celes=mkB('刻輪座',[['magP'],['resP'],['spd'],['mhpP'],['defP'],['awDmg','crit']],['3,-2','-1,-2','-3,1','2,1'],'ryuusa','shuuen',[[{magP:12},'刻魔：魔力+12%'],[{spd:2},'早鐘：素早さ+2'],[{awDmg:20},'円環：覚醒中与ダメ+20%'],[{resP:15},'悠久：精神+15%']]);
BDEF.valk=mkB('竜血座',[['atkP'],['mhpP'],['crit'],['defP'],['awDmg'],['spd']],['2,-3','-2,-1','-3,2','1,2'],'gouka','ryuumetsu',[[{atkP:12},'竜爪：攻撃+12%'],[{mhpP:15},'竜鱗：最大HP+15%'],[{awDmg:20},'逆鱗：覚醒中与ダメ+20%'],[{crit:10},'竜眼：会心率+10%']]);
BOARD.celes=buildBoard('celes');BOARD.valk=buildBoard('valk');
Object.assign(RESO,{'celes,rio':'刻灯の円環','celes,mire':'時空の書架','celes,noah':'永劫の祈り','celes,gald':'不朽の城壁','celes,shion':'影時雨','rio,valk':'竜灯の咆哮'});
Object.assign(RFX,{'celes,rio':{c:'#d8c8ff',fx:'delay'},'celes,noah':{c:'#f0e8ff',el:'光',fx:'revive',m:.6},'rio,valk':{c:'#ff5a30',el:'炎',m:2.2}});
Object.assign(TRIAL,{celes:['止まった時計の群れが、ひとりきりの千年を囁く。','「ひとりは慣れておる。……だが、もう数えなくてよいのじゃな」'],
 valk:['竜の血が、仲間ごと焼き尽くせと吠える。','「この炎は喰うためじゃない。並んで燃やすためのものだ」']});
OWNEL.valk='炎';
LEG.kokuyomi={n:'刻詠みの砂時計',slot:'w',who:'celes',d:'戦闘開始の瞬間を刻の円環に記録する（巻き戻しが最初から使える）'};
LEG.ryuuou={n:'竜王の大剣',slot:'w',who:'valk',d:'竜血覚醒中の与ダメが2倍になる（通常1.5倍）'};
ITYPE.unshift(['砂時計','staff'],['竜剣','gsword']);
{const _wb=wbase;wbase=function(it,ilv,m){if(it.who==='celes'){it.base={mag:Math.round(5+ilv*2.6)};it.name=m+'の砂時計';return;}if(it.who==='valk'){it.base={atk:Math.round(7+ilv*2.8)};it.name=m+'の竜剣';return;}_wb(it,ilv,m);};}

/* --- 戦闘：刻の円環（巻き戻し）・竜血覚醒（自動行動） --- */
function snapTake(u,msg){if(B.rewound)return;B.snap={};B.heroes.forEach(h=>B.snap[h.id]={hp:h.hp,alive:h.alive,sp:h.sp});B.awUsed.add('snap');if(!u.skills.includes('makimodoshi'))u.skills.push('makimodoshi');pop(u,'刻を記録','#d8c8ff',true);if(msg)log(msg);}
{const _aw=awaken;awaken=async function(u){await _aw(u);
 if(u.id==='celes')snapTake(u,'<b>刻の円環</b>――今この瞬間が記録された（巻き戻しは1戦闘1回）');
 if(u.id==='valk'){log('<b>竜血覚醒</b>――ヴァルクの瞳から理性の色が消えた！（行動は自動）');if(B.res&&!auto)B.res();}};}
{const _sb=startBattle;startBattle=function(list,opts={}){_sb(list,opts);if(VOIDED)BG=desat(BG);
 B.heroes.forEach(h=>{if(h.id==='celes'&&h.legs.includes('kokuyomi'))snapTake(h);});};}
{const _da=doAction;doAction=async function(u,sk,t){
 if(sk.k==='rewind'){const S=B.snap||{};B.rewound=1;B.awUsed.delete('snap');u.skills=u.skills.filter(k=>k!=='makimodoshi');B.flashBg=30;B.flashCol='#d8c8ff';SFX.aw();
  log(`<b>${u.name}の巻き戻し</b>――刻の円環が逆さに回る！`);await wait(500);
  B.heroes.forEach(h=>{const s=S[h.id];if(!s)return;const was=h.alive;h.alive=s.alive;h.hp=s.alive?Math.max(1,s.hp):0;h.sp=Math.max(h.sp,s.sp);if(h.alive&&!was)setCT(h);pop(h,'REWIND','#d8c8ff',true);});
  setCT(u);refresh();await wait(500);return;}
 if(sk.k==='tstop'){aliveE().forEach(e=>{e.ct+=(e.boss?60:120)/e.spd;pop(e,'STOP','#d8c8ff',true);});log(`${u.name}の<b>${sk.n}</b>！ 敵の時間が凍りつく`);B.flashBg=16;B.flashCol='#d8c8ff';SFX.warn();setCT(u);refresh();await wait(500);return;}
 if(sk.k==='roar'&&sk.sp)u.sp-=sk.sp;
 return _da(u,sk,t);};}
{const _ap=autoPick;autoPick=function(u){
 if(u.id==='valk'&&u.aw){const es=aliveE().sort((a,b)=>a.hp-b.hp);if((u.awLv||1)>=3&&!u._gk){u._gk=1;return{sk:SK.gokuvalk,t:es[0]};}return{sk:SK[Math.random()<.5?'ryuuen':'meiryuu'],t:es[0]};}
 if(u.id==='celes'&&B.awUsed.has('snap')&&B.snap){let lost=0,was=0;B.heroes.forEach(h=>{const s=B.snap[h.id];if(!s)return;was+=s.alive?s.hp:0;lost+=s.alive&&!h.alive?1:0;});const now=aliveH().reduce((a,h)=>a+h.hp,0);if(lost||now<was*.45)return{sk:SK.makimodoshi};}
 return _ap(u);};}
{const _cr=chooseRoot;chooseRoot=async function(u){if(u.id==='valk'&&u.aw){log('竜血が暴れる――<b>ヴァルクは止まらない！</b>');await wait(450);return autoPick(u);}return _cr(u);};}
{const _ca=calc;calc=function(a,t,sk){const r=_ca(a,t,sk);if(a.id==='valk'&&a.aw)r.d=Math.round(r.d*(a.legs&&a.legs.includes('ryuuou')?2:1.5));return r;};}

/* --- 敵：虚ろ化（グレースケール）・竜の巣・回廊の番人 --- */
const greyPal=rows=>{const o={};rows.join('').split('').forEach(ch=>{if(ch==='.'||o[ch])return;if('exo'.includes(ch)){o[ch]='#e080ff';return;}const n=parseInt((PAL[ch]||'#888888').slice(1),16),l=(n>>16)*.3+(n>>8&255)*.59+(n&255)*.11;
 o[ch]='#'+[l*.82+16,l*.78+10,l*.92+34].map(v=>Math.min(255,Math.round(v)).toString(16).padStart(2,'0')).join('');});return o;};
function desat(src){const c=document.createElement('canvas');c.width=src.width;c.height=src.height;const g=c.getContext('2d');g.drawImage(src,0,0);const d=g.getImageData(0,0,c.width,c.height),p=d.data;
 for(let i=0;i<p.length;i+=4){const l=p[i]*.3+p[i+1]*.59+p[i+2]*.11;p[i]=l*.8+14;p[i+1]=l*.74+8;p[i+2]=Math.min(255,l*.95+30);}g.putImageData(d,0,0);return c;}
function voidKind(k){if(k.startsWith('vo_'))return k;const vk='vo_'+k;if(!ED[vk]){const d=ED[k];SPR[vk]=SPR[k];IMG[vk]=mk(SPR[k],greyPal(SPR[k]));IMG[vk+'_w']=mk(SPR[k],null,'#ffffff');
 ED[vk]=Object.assign({},d,{name:'虚・'+d.name,mhp:Math.round(d.mhp*1.1),xp:Math.round(d.xp*1.4),gold:Math.round(d.gold*1.3),drop:[...d.drop,['kakera',.2]]});}return vk;}
for(const[k,b,pal]of[['firedrake','wolf',{g:'#c0402a',G:'#5a1a10',w:'#ffd080',x:'#ffe040'}],['lavaslime','slime',{v:'#e0602a',V:'#7a200a',p:'#ffc060'}],
 ['dragonewt','gald',{a:'#4a7a3a',A:'#24401c',r:'#c0402a',R:'#601808',s:'#7aa060',d:'#2a3a1a',y:'#e0c040',e:'#ffe040'}],['ember','bookghost',{V:'#5a1a0a',w:'#ffb060',q:'#e06030',p:'#ffd080',o:'#fff060'}],
 ['boss9','boss',{v:'#2a1414',V:'#100606',p:'#ff6030',y:'#ffb040',o:'#ffe040'}],['valkE','valk',{}]]){SPR[k]=SPR[b];IMG[k]=mk(SPR[b],pal);IMG[k+'_w']=mk(SPR[b],null,'#ffffff');}
Object.assign(EA,{dslash:{n:'竜剣・断',el:'斬',k:'phys',pow:1.6,t:'one'},dfire:{n:'黒炎',el:'炎',k:'mag',pow:1.2,t:'all'},dbreath:{n:'竜の息吹',el:'炎',k:'mag',pow:2.7,t:'all'},
 chrono:{n:'時喰らい',el:'闇',k:'mag',pow:2.8,t:'all'},ember:{n:'火の粉',el:'炎',k:'mag',pow:1.1,t:'one'}});
Object.assign(ED,{
 firedrake:{name:'火竜の仔',mhp:270,atk:88,def:30,mag:40,res:20,spd:15,weak:['氷','突'],brk:4,xp:48,gold:34,drop:[['kiba',.5],['kakera',.2]],acts:[['claw',.5],['bite',.3],['ember',.2]]},
 lavaslime:{name:'溶岩スライム',mhp:280,atk:74,def:34,mag:70,res:24,spd:9,weak:['氷','打'],brk:3,xp:44,gold:30,drop:[['haiseki',.6]],acts:[['claw',.5],['ember',.5]]},
 dragonewt:{name:'竜兵',mhp:300,atk:92,def:36,mag:30,res:22,spd:12,weak:['雷','氷'],brk:5,xp:52,gold:38,drop:[['kiba',.3],['kakera',.25]],acts:[['dslash',.6],['claw',.4]],flip:1},
 ember:{name:'残り火',mhp:220,atk:40,def:20,mag:96,res:18,spd:14,weak:['氷','光'],brk:3,xp:46,gold:32,drop:[['kakera',.3]],acts:[['ember',.6],['dfire',.4]]},
 boss9:{name:'黒炎竜ヴォルガノン',mhp:36000,atk:580,def:120,mag:560,res:104,spd:17,weak:['氷','光'],brk:16,sc:3,boss:true,xp:14000,gold:18000,drop:[['kakera',1],['kakera',1],['kakera',1],['kakera',1],['kakera',1],['kakera',1]],
  ai:{every:3,charge:'dbreath',acts:[['claw',.35],['dfire',.35],['bite',.3]],summon:'firedrake',sumLv:66},ilv:68},
 valkE:{name:'竜人ヴァルク',mhp:52000,atk:620,def:150,mag:380,res:110,spd:18,weak:['氷','光'],brk:12,xp:1500,gold:0,drop:[],ai:{every:3,charge:'dbreath',acts:[['dslash',.6],['dfire',.4]]},flip:1,sc:2}});
const KBASE=[['golemboss','虚ろの巨像'],['boss5','虚ろの妖狐'],['boss3','虚ろの司祭'],['boss6','虚ろの女王']],KEL=['光','闇','炎','氷','雷','風','地','斬','打','突'];
const kLv=f=>54+f;
function kBoss(f){const k='kb'+f;if(ED[k])return k;const[bk,nm]=f===30?['boss7','刻喰らいの番人']:KBASE[(f/10-1)%KBASE.length],b=ED[bk],s=f/10-1;
 SPR[k]=SPR[bk];IMG[k]=mk(SPR[bk],f===30?{a:'#d8c8ff',A:'#6a5aa0',o:'#ffe27a',y:'#ffffff',u:'#ffe27a'}:greyPal(SPR[bk]));IMG[k+'_w']=mk(SPR[bk],null,'#ffffff');
 ED[k]={name:nm,mhp:Math.round(30000*(1+s*.6)),atk:Math.round(540+f*10),mag:Math.round(560+f*10),def:Math.round(112+f*1.5),res:Math.round(104+f*1.5),spd:17+Math.min(6,f/20|0),
  weak:[KEL[(f*3)%10],KEL[(f*7+4)%10]].filter((x,i,a)=>a.indexOf(x)===i),brk:16+Math.min(6,f/20|0),sc:3,boss:true,xp:6000+f*400,gold:10000+f*500,drop:Array(6).fill(['kakera',1]),flip:b.flip,
  ai:{every:3,charge:f===30?'chrono':b.ai.charge,acts:b.ai.acts,summon:voidKind(b.ai.summon),sumLv:kLv(f)},ilv:kLv(f)};return k;}

/* --- 虚の回廊（自動生成・無限階層・10層ごとに番人） --- */
TL.v=tl((g,R)=>{px(g,'#2a2040',0,0,16,16);px(g,'#221a36',0,15,16,1);px(g,'#221a36',15,0,1,16);for(let i=0;i<9;i++)px(g,R()<.6?'#4a3a6a':R()<.5?'#8a8aa0':'#c8b0ff',R()*16|0,R()*16|0);},230);
TL.q=tl((g,R)=>{px(g,'#0e0818',0,0,16,16);for(let y=0;y<16;y+=4){px(g,'#1a1028',0,y+3,16,1);for(let x=(y%8?4:0);x<16;x+=8)px(g,'#1a1028',x,y,1,4);}for(let i=0;i<5;i++)px(g,R()<.5?'#3a2a5a':'#6a4c9c',R()*16|0,R()*16|0);},231);
const KMOBS=['drowned','onimusha','golemkin','shade','darkknight','raiwolf','jelly','yukirei','dragonewt','firedrake','ember','minerghost'];
const kst=()=>G.kairou||(G.kairou={cp:1,cur:1,max:0});
function genVoidFloor(f){for(let tr=0;;tr++){const R=rng(f*7919+101+tr*31),Wd=20,Hd=24,g=Array.from({length:Hd},()=>Array(Wd).fill('q')),rooms=[];
 for(let i=0;i<70&&rooms.length<7;i++){const w=4+(R()*4|0),h=3+(R()*3|0),x=1+(R()*(Wd-w-2)|0),y=1+(R()*(Hd-h-2)|0);if(rooms.some(r=>x<r.x+r.w+1&&x+w+1>r.x&&y<r.y+r.h+1&&y+h+1>r.y))continue;rooms.push({x,y,w,h,cx:x+(w>>1),cy:y+(h>>1)});}
 if(rooms.length<4)continue;rooms.sort((a,b)=>b.cy-a.cy);rooms.forEach(r=>{for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)g[y][x]='v';});
 for(let i=1;i<rooms.length;i++){const a=rooms[i-1],b=rooms[i];let x=a.cx,y=a.cy;while(x!==b.cx){g[y][x]='v';x+=Math.sign(b.cx-x);}while(y!==b.cy){g[y][x]='v';y+=Math.sign(b.cy-y);}g[y][x]='v';}
 const s=rooms[0],e=rooms[rooms.length-1],boss=f%10===0;g[s.cy][s.cx]='S';g[e.cy][e.cx]=boss?'Q':'^';if(boss)g[e.cy][e.cx-1]='B';
 for(let i=1;i<rooms.length-1&&i<5;i++){const r=rooms[i];g[r.y][r.x]=i===2?'G':'C';}
 return g.map(r=>r.join(''));}}
function makeKairouArea(f){const lv=kLv(f),boss=f%10===0,pool=KMOBS.map(voidKind);
 return{name:`虚の回廊 ${f}層`,map:genVoidFloor(f),lv:[lv,lv],groups:[0,1,2,3,4].map(i=>{const n=1+((f+i)%3);return Array.from({length:n},(_,j)=>pool[(f*5+i*3+j*7)%pool.length]);}),
  crew:[{loot:[lv,3]},{gold:5000+f*400},{loot:[lv,3]},{item:'drop2',n:1}],boss:boss?{kind:kBoss(f),lv}:null,bossKind:boss?()=>kBoss(f):null,bflag:boss?'kr'+f:'',theme:'void',rec:`Lv${lv}`,
  intro:`<b>虚の回廊 ${f}層</b>――色を失った星の記憶が、果てなく積み重なる回廊。${f%10===1?'（中継地点）':''}${boss?'<b>この層には番人がいる</b>。倒すと階段が開く。':'光る階段から、さらに深い層へ。'}`};}
function kairouMenu(){const K=kst(),cps=[];for(let f=1;f<=K.cp;f+=10)cps.push(f);
 log(`<b>虚の回廊</b>　果てのない回廊。10層ごとに番人がいて、倒した先の層が中継地点になる（最深到達：${K.max||0}層）`+goldTxt());
 menu([...cps.slice(-7).map(f=>({l:`${f}層から`,s:`推奨Lv${kLv(f)}`,cls:f===cps[cps.length-1]?'ready':'',f:()=>enterKairou(f)})),{l:'戻る',cls:'back',f:worldMap}],true);}
function enterKairou(f,keep){const K=kst();K.cur=f;K.max=Math.max(K.max||0,f);if(f%10===1&&f>K.cp)K.cp=f;AREAS.kairou=makeKairouArea(f);enterField('kairou',keep);if(keep&&f%10===1)banner(`中継地点 ${f}層を記録した`,'#c8b0ff');save();}
function kairouBossWin(){const f=kst().cur;banner('番人が崩れ、階段が開いた','#c8b0ff');if(f+1>kst().cp&&(f+1)%10===1)kst().cp=f+1;save();if(f===30&&!G.flags.celesMet)setTimeout(celesEvent,300);}
function celesEvent(){F.pause=true;banner('セレス','#e0d0ff');
 log('番人が砂のように崩れ、止まっていた時計の音が戻った。瓦礫の玉座に、砂時計の杖を抱えた少女が腰かけている。<br><b>セレス</b>「……ようやく来たか、灯守。千年ぶんの退屈を数えておったところじゃ」<br>「勘違いするでないぞ。寂しかったわけではない。……おぬしらの旅、わらわが見届けてやろう」');
 menu([{l:'仲間にする',cls:'ready',f:()=>{G.flags.celesMet=1;newMember('celes');SFX.aw();save();fieldMenu('<b>セレスが仲間になった！</b>'+(G.party.includes('celes')?'':'（控えに入った）'));renderPartyStatic();}},
  {l:'今はやめる',f:()=>{G.flags.celesMet=1;G.declined=[...(G.declined||[]),'celes'];save();fieldMenu('セレス「ふん、好きにせい。……酒場で待っておるからな」');}}]);}

/* --- 竜の巣 --- */
TL.m0=tl((g,R)=>{px(g,'#a02a0a',0,0,16,16);for(let i=0;i<22;i++)px(g,R()<.5?'#ff6a20':'#d04010',R()*16|0,R()*16|0);px(g,'#ffd060',4,5,3,1);px(g,'#ffd060',10,11,2,1);},240);
TL.m1=tl((g,R)=>{px(g,'#b0340c',0,0,16,16);for(let i=0;i<22;i++)px(g,R()<.5?'#ff8a30':'#d04010',R()*16|0,R()*16|0);px(g,'#ffe080',6,9,3,1);px(g,'#ffe080',11,3,2,1);},241);
AREAS.ryuu={name:'竜の巣',lv:[60,68],theme:'lava',rec:'推奨Lv60〜68',bflag:'boss9',boss:{kind:'boss9',lv:68},
 map:["YYYYYYYYYYYYYYYYYYYY","YYYYYYYYrBrYYYYYYYYY","YYYYYYYrrrrrYYYYYYYY","YYrrrYYrrrrrYYrrCrYY","YYrCrrrrrmrrrrrrrrYY","YYrrrYYmmmmmYYrrrrYY","YYYrYYYmmmmmYYYYrYYY","YrrrrrrrrmrrrrrrrrrY",
  "YrmmrrrrrrrrrrrmmrrY","YrmmrrYYYrYYYrrmmrDY","YrrrrrYrrrrrYrrrrrrY","YYYrYYYrrGrrYYYYrYYY","YrrrrrrrrrrrrrrrrrrY","YrrmmmrrrYYrrrmmmrrY","YrrmmmrrrYYrrrmmmrCY","YrrrrrrrrrrrrrrrrrrY",
  "YYYYrYYYYrrYYYYYrYYY","YrrrrrrrYrrYrrrrrrrY","YrGrrmrrrrrrrrmrrGrY","YrrrmmmrrrrrrmmmrrrY","YrrrrmrrrYYrrrmrrrrY","YYrrrrrrrYYrrrrrrrYY","YYYYrrrrrrrrrrrYYYYY","YYYYYYYrrrrrYYYYYYYY","YYYYYYYYrrSrYYYYYYYY","YYYYYYYYYYYYYYYYYYYY"],
 groups:[['firedrake'],['lavaslime','firedrake'],['dragonewt'],['ember','lavaslime'],['dragonewt','firedrake'],['dragonewt','ember','firedrake']],
 crew:[{loot:[64,3]},{gold:20000},{item:'tail',n:2},{loot:[66,3]}],
 intro:'<b>竜の巣</b>――星核が砕けた夜、竜たちが逃げ込んだ火山の洞。<b>溶岩の上を歩くとやけど</b>する（HP-4%）。奥で、竜人の剣士が強者を待っているという。'};
function lavaBurn(){G.party.forEach(id=>{const m=stats(id).mhp;G.h[id].hp=Math.max(1,(G.h[id].hp??m)-Math.round(m*.04));});F.flash=Math.max(F.flash||0,3);if(!(F.burnT>performance.now())){banner('溶岩でやけど！（HP-4%）','#ff7a30');F.burnT=performance.now()+2500;}renderPartyStatic();}
function valkEvent(){F.pause=true;banner('ヴァルク','#ff6030');
 log('溶岩の照り返しの中、大剣を担いだ竜人が振り返った。<br><b>ヴァルク</b>「……星核を鎮めた灯守か。噂より小さいな」<br>「強い灯なら、喰らってみたい。剣を抜け。俺に勝てたら、その旅に付き合ってやる」');
 menu([{l:'決闘する',cls:'ready',f:()=>{F.lock=true;F.pause=false;startBattle([{kind:'valkE',lv:1}],{event:'valk',onEnd:afterBattle});}},{l:'やめる',f:fieldMenu}]);}

/* --- 虚蝕化エリア（出撃3回ごとに入れ替わる周回イベント） --- */
let VOIDED=false;
const VOIDABLE=[['haido','boss1'],['midori','boss2'],['seido','boss3'],['raimei','boss4'],['kouka','boss5'],['ouito','boss6']];
function voidArea(s=G.sorties){if(!G.flags.boss8)return null;if(G.voidOv!==undefined)return G.voidOv;const ok=VOIDABLE.filter(([,f])=>G.flags[f]).map(a=>a[0]);if(!ok.length)return null;
 const R=rng(Math.floor(s/3)*131+7);return R()<.75?ok[R()*ok.length|0]:null;}
function voidNews(){const n=G.sorties+1,a=voidArea(n),left=3-n%3;
 return a?`<div class="vnews">◆<b>虚蝕化</b>：${AREAS[a].name}（あと${left}回の出撃）　敵が強いぶん、ドロップと灯力が増える</div>`:`<div class="vnews">◆虚蝕化しているエリアはない（あと${left}回の出撃で変化）</div>`;}
const voidify=e=>{e.kinds=e.kinds.map(voidKind);e.lv=Math.max(e.lv+18,56);};
{const _ef=enterField;enterField=function(id='haido',keep){VOIDED=false;_ef(id,keep);if(!keep&&voidArea(G.sorties)===id){VOIDED=F.voided=true;F.en.forEach(voidify);
 log('<b style="color:#d0b0ff">【虚蝕化】</b>'+A.intro+'<br><small>虚蝕で色を失い、魔物が強くなっている。そのぶんドロップと灯力が増える。</small>'+goldTxt());hud(`${A.name}　<b>虚蝕化</b>`);}};}
{const _so=spawnOne;spawnOne=function(){const n=F.en.length;_so();if(F.voided&&F.en.length>n)voidify(F.en[F.en.length-1]);};}
{const _et=enterTown;enterTown=function(m){VOIDED=false;_et(m);};}
{const _ab=afterBattle;afterBattle=function(mode){_ab(mode);if(F&&F.voided)hud(`${A.name}　<b>虚蝕化</b>`);};}
{const _rw=rewards;rewards=function(es){const r=_rw(es);
 if(VOIDED){es.forEach(e=>{if(!ED[e.kind].boss){G.q.voidK=(G.q.voidK||0)+1;if(Math.random()<.3)r.loot.push(addLoot(genItem(e.lv,1,1)));}});
  const ex=Math.round(r.gold*.5);G.gold+=ex;r.gold+=ex;G.tou+=r.tou;r.tou*=2;for(const k in r.drops){G.mats[k]+=r.drops[k];r.drops[k]*=2;}}
 if(AREA==='kairou'&&A===AREAS.kairou)es.forEach(e=>{if(ED[e.kind].boss)r.loot.push(addLoot(genItem(ED[e.kind].ilv||e.lv,0,0,null,4)));else if(Math.random()<.12)r.loot.push(addLoot(genItem(e.lv,2,.5)));});
 return r;};}
FXHOOK.push(()=>{if(F.voided){ctx.save();ctx.globalCompositeOperation='saturation';ctx.globalAlpha=.88;ctx.fillStyle='#808080';ctx.fillRect(0,0,W,H);ctx.restore();ctx.fillStyle='rgba(60,20,110,.18)';ctx.fillRect(0,0,W,H);
  for(let i=0;i<18;i++){ctx.fillStyle=['#c8b0ff','#ffffff','#8a6aff'][i%3];ctx.fillRect((i*67+Math.sin(tick/50+i)*10+300)%W|0,(H-((i*83+tick*(.15+i%3*.1))%H))|0,1,1);}}
 if(A&&A.theme==='lava'){ctx.fillStyle='rgba(255,90,20,.07)';ctx.fillRect(0,0,W,H);for(let i=0;i<22;i++){ctx.fillStyle=i%2?'#ffb040':'#ff6020';ctx.fillRect((i*59+Math.sin(tick/30+i)*6+400)%W|0,(H-((i*71+tick*(.3+i%4*.12))%H))|0,1,1);}}
 if(AREA==='kairou'){ctx.fillStyle='rgba(20,0,40,.18)';ctx.fillRect(0,0,W,H);}});

/* --- セーブ互換・依頼 --- */
{const _mg=migrate;migrate=function(g){_mg(g);g.kairou=g.kairou||{cp:1,cur:1,max:0};g.q=g.q||{wolf:0,done:{}};return g;};}
QS.push({id:'q11',n:'虚の深淵',d:'虚の回廊30層の番人を倒す',ok:()=>!!G.flags.kr30,pg:()=>G.flags.kr30?'達成':`最深${kst().max||0}層`,rw:'60000G・不死鳥の尾×3',give:()=>{G.gold+=60000;addItem('tail',3);}},
 {id:'q12',n:'竜の巣の主',d:'黒炎竜ヴォルガノンを倒す',ok:()=>!!G.flags.boss9,pg:()=>G.flags.boss9?'達成':'未達成',rw:'40000G・星の大雫×3',give:()=>{G.gold+=40000;addItem('drop2',3);}},
 {id:'q13',n:'虚蝕を祓え',d:'虚蝕化したエリアで魔物を30体倒す',ok:()=>(G.q.voidK||0)>=30,pg:()=>`${Math.min(30,G.q.voidK||0)}/30`,rw:'エピック装備×2',give:()=>{const lv=Math.max(...G.party.map(i=>G.h[i].lv));addLoot(genItem(lv,0,0,null,3));addLoot(genItem(lv,0,0,null,3));}});
