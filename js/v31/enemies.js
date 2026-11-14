/* ===== ver0.31 敵：インフレに合わせた強さの曲線・各章の中ボス・エンドコンテンツの敵 =====
 1. 強さ：Lv60 を超える敵は、能力のインフレ（INF）に加えて、HP×EHP・攻撃と魔力×EATK で強くなる
    （味方の天星盤・極技・終盤の装備・新しいパッシブのぶん）。Lv60 以下（本編）は今までどおり
 2. 見た目：既存の原画の色違い（パレットの写像）。ED[k].spr にスプライトのキー（'tr_○○4' など）を持たせ、
    戦闘ユニットの spr に入れる（データの kind はそのまま）
 3. 各章の中ボス（序章〜終章）と、天極の門・星海の深淵・終焉の星域・極限の星闘の敵
 4. 多段階のボス（stages）は、クエストで指定したレベルで次の形態を出す（以前は Lv58 固定） */
'use strict';
const V31E=(()=>{
const{INF}=V31;
const EHP=lv=>lv<=60?1:Math.pow(1.07,lv-60);
const ESPD=lv=>lv<=60?1:1+(lv-60)*.008;
const EATK=lv=>lv<=60?1:Math.pow(1.021,lv-60);
/* ---------- 色違いのパレット ---------- */
const hx=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const toH=a=>'#'+a.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
function rgb2hsl([r,g,b]){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0;const l=(mx+mn)/2;if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;}return[h,s,l];}
function hsl2rgb(h,s,l){const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;let[r,g,b]=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return[(r+m)*255,(g+m)*255,(b+m)*255];}
/* H：色相をこの値にそろえる（灰色は灰色のまま）／s・l：彩度・明るさの倍率 */
function recolor(pal,{H,s=1,l=1}){return pal.map((c,i)=>{if(i===pal.length-1||!/^#[0-9a-f]{6}$/i.test(c))return c;let[h,S,L]=rgb2hsl(hx(c));if(S>.08)h=H;S=Math.min(1,S*s);L=Math.min(.97,L*l);return toH(hsl2rgb(h,S,L));});}
const VAR={slime4:{H:185,s:.9,l:1.15},knight4:{H:45,s:.8,l:1.2},goldwolf4:{H:210,s:.5,l:1.25},icespirit4:{H:48,s:1,l:1.1},drake4:{H:50,s:.6,l:1.3},queen4:{H:45,s:.9,l:1.15},
 jelly4:{H:175,s:1,l:.85},shade4:{H:275,s:1.1,l:1},gknight4:{H:215,s:.8,l:.85},shroom4:{H:200,s:1,l:1},golem4:{H:175,s:.7,l:.9},drake5:{H:220,s:1,l:.85},
 banjin4:{H:355,s:.9,l:.7},drake6:{H:345,s:1,l:.7},ninja4:{H:280,s:.7,l:.6},golem5:{H:260,s:.3,l:.55},knight5:{H:48,s:.5,l:.55},golem6:{H:270,s:.5,l:1.25},valk4:{H:265,s:.9,l:.8},
 drake7:{H:30,s:1.1,l:1.05},queen5:{H:290,s:.6,l:1.1},golem7:{H:15,s:1,l:.9},
 wolf4:{H:0,s:.2,l:.72},goldwolf5:{H:130,s:1.1,l:.8},knight6:{H:270,s:.5,l:.9},gknight5:{H:0,s:1,l:.8},knight7:{H:190,s:.7,l:.8},golem8:{H:250,s:.4,l:1.1}};
/* ver0.32：元のキーが系統の色違い（灰狼 wolf → 狼の原画 goldwolf の graywolf など）なら、その色違いから作り、名前を trial<段>@<元のキー> にする（spx.js の parse と対） */
function applyVars(){if(typeof SPX==='undefined')return;const D=SPX.D,F=SPX.FAM||{};for(const k in VAR){const m=/^([a-z]+?)(\d)$/.exec(k);if(!m)continue;
 const fm2=F[m[1]],id=fm2&&D[fm2[0]]?fm2[0]:m[1],c=D[id];if(!c)continue;c.vars=c.vars||{};
 const src=fm2&&D[fm2[0]]?(fm2[1]&&c.vars[fm2[1]])||c.pal:c.pal;c.vars['trial'+m[2]+(id!==m[1]?'@'+m[1]:'')]=recolor(src,VAR[k]);}}
try{applyVars();}catch(e){console.error(e);}
const S=k=>'tr_'+k;

/* ---------- 敵の技 ---------- */
Object.assign(EA,{
 astral:{n:'星光の審判',el:'光',k:'mag',pow:2.8,t:'all'},abyss:{n:'深淵の大渦',el:'氷',k:'mag',pow:2.8,t:'all'},endray:{n:'終焉の光',el:'闇',k:'mag',pow:3,t:'all'},
 tidal:{n:'星海の奔流',el:'氷',k:'mag',pow:1.15,t:'all'},voidslash:{n:'虚空斬',el:'闇',k:'phys',pow:1.6,t:'one'},holyspear:{n:'光の槍',el:'光',k:'mag',pow:1.5,t:'one'},
 starclaw:{n:'星爪',el:'斬',k:'phys',pow:1.3,t:'one'},quake:{n:'大地震',el:'地',k:'phys',pow:1.1,t:'all'},genesis:{n:'原初の鉄槌',el:'地',k:'phys',pow:3.2,t:'all'},
 tokiyomi:{n:'刻詠みの終',el:'闇',k:'mag',pow:3.1,t:'all'},hadou:{n:'覇竜の咆哮',el:'炎',k:'mag',pow:3.1,t:'all'}});
try{for(const[k,f]of[['voidslash',[{k:'def',v:-20,t:2,p:.35}]],['tidal',[{k:'spd',v:-15,t:2,p:.3}]],['holyspear',[{k:'res',v:-15,t:2,p:.3}]],['starclaw',[{k:'poison',v:.03,t:2,p:.25}]]])EA[k].fx20=f.map(x=>Object.assign({on:'t'},x));}catch(e){}

/* ---------- 敵の定義 ---------- */
const N=(name,spr,st,weak,acts,xp,gold,drop,x={})=>Object.assign({name,spr,weak,acts,xp,gold,drop},st,x);
const st=(mhp,atk,def,mag,res,spd)=>({mhp,atk,def,mag,res,spd});
const BO=(name,spr,s,weak,ai,xp,gold,ilv,rank,x={})=>Object.assign({name,spr,weak,ai,xp,gold,ilv,rank,boss:true,sc:3,drop:Array(4).fill(['kakera',1])},s,x);
const NEW={
 /* 各章の中ボス（本編） */
 m_wolf:BO('灰狼の頭目',S('wolf4'),st(720,52,18,20,14,13),['地','斬'],{every:3,charge:'bite',acts:[['claw',.6],['bite',.4]],summon:'wolf',sumLv:3},50,140,4,'mid',{sc:2,flip:0}),
 m_jade:BO('翠狼の主',S('goldwolf5'),st(1900,96,30,30,22,15),['炎','斬'],{every:3,charge:'bite',acts:[['claw',.5],['bite',.5]],summon:'jadewolf',sumLv:7},140,420,8,'mid',{sc:2}),
 m_knight:BO('聖堂騎士長',S('knight6'),st(3600,140,40,60,30,11),['光','雷'],{every:3,charge:'slam',acts:[['claw',.5],['slam',.5]],summon:'darkknight',sumLv:13},300,900,14,'mid'),
 m_oni:BO('鬼武者の首領',S('gknight5'),st(7000,220,62,60,50,13),['光','氷'],{every:3,charge:'slash2',acts:[['slash2',.6],['claw',.4]],summon:'onimusha',sumLv:26},800,2600,27,'mid'),
 m_guard:BO('近衛隊長',S('knight7'),st(9500,260,72,120,60,13),['雷','光'],{every:3,charge:'tide',acts:[['slash2',.5],['claw',.3],['tide',.2]],summon:'drowned',sumLv:33},1300,4200,34,'mid'),
 m_echo:BO('残響の番兵',S('golem8'),st(16000,380,98,400,96,16),['闇','雷'],{every:3,charge:'starfall',acts:[['slam',.5],['wave',.3],['curse',.2]],summon:'shade',sumLv:52},2500,8000,53,'mid'),
 /* 天極の門（Lv70〜82） */
 g_slime:N('星霊スライム',S('slime4'),st(240,72,28,68,26,10),['闇','雷'],[['claw',.5],['tide',.5]],70,60,[['kakera',.3],['seishou',.012]]),
 g_knight:N('天門の衛士',S('knight4'),st(310,98,40,30,26,12),['闇','打'],[['slash2',.6],['claw',.4]],80,70,[['kiba',.4],['seishou',.012]],{flip:1}),
 g_wolf:N('天狼',S('goldwolf4'),st(260,100,30,20,20,18),['闇','炎'],[['claw',.4],['bite',.3],['starclaw',.3]],76,64,[['kiba',.5],['seishou',.012]]),
 g_spirit:N('星屑の精',S('icespirit4'),st(230,40,22,106,32,15),['闇','風'],[['holyspear',.5],['wave',.5]],78,66,[['kakera',.4],['seishou',.012]]),
 g_mid:BO('天門の守護獣',S('drake4'),st(40000,640,130,600,110,18),['闇','氷'],{every:3,charge:'astral',acts:[['claw',.4],['starclaw',.3],['holyspear',.3]],summon:'g_wolf',sumLv:74},2400,9000,76,'mid'),
 g_boss:BO('天門の女帝アストレア',S('queen4'),st(70000,700,140,760,130,19),['闇','雷'],{every:3,charge:'astral',acts:[['holyspear',.4],['wave',.3],['curse',.3]],summon:'g_knight',sumLv:80},4200,16000,82,'big',{flip:1}),
 /* 星海の深淵（Lv84〜98） */
 a_jelly:N('深淵海月',S('jelly4'),st(260,46,22,112,24,13),['雷','光'],[['tidal',.5],['spore',.5]],90,74,[['kakera',.4],['seishou',.015]]),
 a_shade:N('星喰らいの影',S('shade4'),st(240,40,22,120,30,16),['光','炎'],[['curse',.5],['wave2',.5]],92,76,[['kakera',.4],['seishou',.015]]),
 a_rider:N('深淵の騎兵',S('gknight4'),st(350,112,44,30,26,13),['雷','光'],[['slash2',.5],['voidslash',.5]],96,80,[['kiba',.4],['seishou',.015]]),
 a_spore:N('星海の胞子',S('shroom4'),st(330,82,30,92,28,9),['炎','斬'],[['spore',.6],['claw',.4]],88,72,[['haiseki',.6],['seishou',.015]]),
 a_mid:BO('深海の巨像',S('golem4'),st(60000,780,160,700,140,16),['雷','打'],{every:3,charge:'abyss',acts:[['slam',.5],['tidal',.3],['claw',.2]],summon:'a_rider',sumLv:88},3200,14000,90,'mid'),
 a_boss:BO('星海竜リヴァイア',S('drake5'),st(100000,860,170,900,150,20),['雷','光'],{every:3,charge:'abyss',acts:[['bite',.35],['tidal',.35],['claw',.3]],summon:'a_jelly',sumLv:96},5600,24000,98,'big'),
 /* 終焉の星域（Lv100〜118） */
 e_guard:N('終焉の番人',S('banjin4'),st(390,122,46,100,40,12),['光','雷'],[['claw',.4],['curse',.3],['wave',.3]],110,90,[['kakera',.5],['seishou',.02]]),
 e_drake:N('滅星竜の仔',S('drake6'),st(350,128,40,60,30,17),['氷','光'],[['claw',.4],['bite',.3],['dfire',.3]],108,88,[['kiba',.5],['seishou',.02]]),
 e_ninja:N('虚無の刺客',S('ninja4'),st(310,134,36,80,30,20),['光','打'],[['voidslash',.6],['claw',.4]],106,86,[['kakera',.4],['seishou',.02]]),
 e_golem:N('終焉の巨兵',S('golem5'),st(470,120,60,30,40,8),['雷','打'],[['slam',.6],['quake',.4]],114,92,[['haiseki',.6],['seishou',.02]]),
 e_mid:BO('星蝕の騎士王',S('knight5'),st(90000,980,190,700,160,19),['光','雷'],{every:3,charge:'endray',acts:[['voidslash',.5],['slash2',.3],['curse',.2]],summon:'e_ninja',sumLv:108},4200,22000,110,'mid',{flip:1}),
 e_boss1:BO('星核の亡骸',S('golem6'),st(120000,1000,200,1000,180,18),['闇','雷'],{every:3,charge:'endray',acts:[['slam',.4],['wave',.3],['quake',.3]],summon:'e_guard',sumLv:114},0,0,118,'big',{intro:'星核の亡骸が崩れ落ちる。その奥から、黒い竜の王が身を起こした――'}),
 e_boss2:BO('終焉の星神ゼノス',S('valk4'),st(160000,1100,210,1100,190,20),['光'],{every:3,charge:'endray',acts:[['voidslash',.4],['dfire',.3],['curse',.3]],summon:'e_drake',sumLv:116},7400,40000,120,'big',{flip:1}),
 /* 極限の星闘（Lv125〜140・何度でも挑める） */
 x_dragon:BO('天極の覇竜',S('drake7'),st(200000,1200,220,1150,200,21),['氷','闇'],{every:3,charge:'hadou',acts:[['claw',.35],['dfire',.35],['bite',.3]],summon:'e_drake',sumLv:119},9000,50000,121,'big'),
 x_nox:BO('虚神ノクス・極','last3',st(240000,1250,230,1300,220,21),['光'],{every:3,charge:'voidend',acts:[['mirror',.35],['curse',.35],['voidslash',.3]],summon:'a_shade',sumLv:121},10000,56000,123,'big',{flip:1}),
 x_queen:BO('刻の女帝',S('queen5'),st(280000,1300,240,1400,240,22),['炎','光'],{every:3,charge:'tokiyomi',acts:[['holyspear',.35],['chrono',.25],['wave',.4]],summon:'g_spirit',sumLv:123},11000,62000,125,'big',{flip:1}),
 x_titan:BO('原初の巨神',S('golem7'),st(340000,1400,260,1200,240,19),['雷','風'],{every:3,charge:'genesis',acts:[['slam',.4],['quake',.4],['claw',.2]],summon:'e_golem',sumLv:125},12000,70000,128,'big')};
for(const k in NEW){const d=NEW[k];if(d.boss){d.drop=k.startsWith('m_')?Array(3).fill(['kakera',1]):k.startsWith('x_')?[['seishou',1],['seishou',1],['seishou',.6],['seishou',.4],['kakera',1],['kakera',1]]:
 k.endsWith('mid')?[['seishou',.4],['kakera',1],['kakera',1],['kakera',1]]:[['seishou',1],['seishou',.5],['kakera',1],['kakera',1],['kakera',1]];}
 ED[k]=d;const b=d.spr.replace(/^tr_/,'').replace(/\d$/,'');const base={wolf:'wolf',goldwolf:'raiwolf',knight:'darkknight',gknight:'onimusha',golem:'golemkin',drake:'firedrake',queen:'boss6',jelly:'jelly',shade:'shade',shroom:'shroom',slime:'slime',icespirit:'yukirei',banjin:'boss',ninja:'boss4',valk:'valk',last:'last3'}[b]||'slime';
 SPR[k]=SPR[base]||SPR.slime;IMG[k]=IMG[base]||IMG.slime;IMG[k+'_w']=IMG[base+'_w']||IMG.slime_w;}
/* 経験値：回廊の番人・黒炎竜は 1 体で Lv が上がりすぎるので抑える（Lv60 以降の経験値曲線に合わせた） */
try{ED.boss9.xp=6000;}catch(e){}
{const _kb=kBoss;kBoss=function(f){const k=_kb(f);try{const d=ED[k];if(d&&!d._x31){d._x31=1;d.xp=Math.round(d.xp*.3);}}catch(e){}return k;};}
/* ボスの溜め技は弱め（EA の威力×0.85 で放つ）なので、新しい大技はそのまま。図鑑の区分は rank（mid／big） */
try{TERMS.reset();}catch(e){}

/* ---------- 強さの曲線と見た目のキー ---------- */
{const _en=enemy;enemy=function(kind,lv,x,y,suf=''){const e=_en(kind,lv,x,y,suf);try{const d=ED[kind];if(d&&d.spr)e.spr=d.spr;
 const L=e.lv||lv||1;if(L>60){const m=INF(L),h=EHP(L),a=EATK(L);e.mhp=Math.round(e.mhp*m*h);e.hp=e.mhp;for(const k of['atk','mag'])e[k]=Math.round(e[k]*m*a);for(const k of['def','res'])e[k]=Math.round(e[k]*m);e.spd=+(e.spd*ESPD(L)).toFixed(2);}}catch(x){console.error(x);}return e;};}
/* 多段階ボスの次の形態：クエストで決めたレベルで出す */
nextStage=async function(){B.stage=(B.stage||0)+1;const k=B.opts.stages[B.stage],prev=B.opts.stages[B.stage-1],lv=B.opts.stageLv||58;await wait(600);
 B.flashBg=26;B.shake=14;SFX.warn();log(ED[prev].intro||'');await wait(1400);
 const e=enemy(k,lv,18,34);B.enemies=[e];setCT(e);try{e.sts=[];}catch(x){}
 B.heroes.forEach(h=>{if(!h.alive){h.alive=true;h.hp=1;setCT(h);}const v=Math.round(h.mhp*.2);h.hp=Math.min(h.mhp,h.hp+v);h.sp=Math.min(100,(h.sp||0)+30);pop(h,'+'+v,'#7dffa8');});
 log(`星々の灯が仲間を支える――<b>${e.name}</b>が現れた！（第${B.stage+1}形態）`);refresh();await wait(1200);
 if(B.stage===B.opts.stages.length-1&&B.opts.zen!==false){const r=B.heroes.find(h=>h.id==='rio'&&h.alive);if(r&&G.flags.zenkyo&&!r.aw&&B.opts.stages[0]==='last1'){r.ag=100;pop(r,'星片が輝く','#ffe27a');log('空白の星片が、みんなの色で満ちていく――<b>リオのAGが最大になった！</b>');refresh();await wait(1000);}}};
/* 図鑑：新しい敵の絵（色違いのキーから） */
function zimg(){if(typeof ZIMG==='undefined'||typeof V19==='undefined')return;for(const k in NEW){const d=NEW[k];for(const sil of[0,1]){const zz=k+(sil?'_w':'');let val=null;
 try{Object.defineProperty(ZIMG,zz,{configurable:true,enumerable:true,get(){if(val===null){try{const c=V19.still(d.spr,48,!d.flip);val=c?(sil?PX.whiteOf(c):c).toDataURL():'';}catch(e){val='';}}return val;},set(x){val=x;}});}catch(e){}}}}
{let tries=0;const t=setInterval(()=>{tries++;if((typeof SPX!=='undefined'&&SPX.ready)||tries>60){clearInterval(t);try{applyVars();zimg();}catch(e){console.error(e);}}},250);}
/* 戦闘以外の画面で使う 1 枚絵 */
function still(kind,N=64){const d=ED[kind];try{return V19.still(d&&d.spr||kind,N,!(d&&d.flip));}catch(e){return null;}}

return{EHP,EATK,ESPD,VAR,recolor,NEW,still,applyVars};})();
