/* ===== 開発者モード（通常セーブとは別枠 astral_save_dev） ===== */
const DEVKEY='astral_save_dev';
function devLeg(k,lv=55){for(let n=0;n<300;n++){const it=genItem(lv,4,0,LEG[k].slot,4);if(it.leg===k){it.unid=false;return it;}}return null;}
function devGear(){G.inv=G.inv.filter(i=>!i.dev);for(const id of G.members){const h=G.h[id],w=fixedItem('w',id,55);w.rar=3;w.unid=false;w.dev=1;G.inv.push(w);h.eq.w=w.uid;
  for(const[sl,es]of[['body','body'],['head','head'],['sub','sub'],['acc','acc1'],['acc','acc2']]){const it=genItem(55,2,0,sl,2);it.unid=false;it.dev=1;G.inv.push(it);h.eq[es]=it.uid;}}}
function devGame(){SAVE=DEVKEY;migrate(newGame());G.dev=1;G.gold=999999;G.tou=99999;
 for(const id of Object.keys(HB))if(!G.members.includes(id))newMember(id);
 Object.assign(G.flags,{boss1:true,boss2:true,boss3:true,boss4:true,boss5:true,boss6:true,boss7:true,mireMet:1,noahMet:1,ernaMet:1,balzaMet:1,crowChoice:'save',hakuaMet:1,jinMet:1,celesMet:1,valkMet:1});
 for(const id of G.members){const h=G.h[id];h.lv=55;h.xp=0;h.hp=null;h.awLv=3;for(const j in JOBS)h.jobs[j]={lv:10,xp:0};}
 for(const k in G.fac)G.fac[k]=5;G.tower={cp:26,cur:26,max:30};G.kairou={cp:31,cur:31,max:31};devGear();devItems();devLegs();devRoyal();save();}
function devItems(){for(const k in ITEMS)G.items[k]=9;for(const k in MATS)G.mats[k]=99;for(const k in STONES)G.stones[k]=9;}
function devLegs(){Object.keys(LEG).forEach(k=>{const it=devLeg(k);if(it)G.inv.push(it);});}
function devRoyal(){for(const s in ROYAL){const it=royalItem(s,40);it.unid=false;G.inv.push(it);}}
function devStart(){SAVE=DEVKEY;const s=loadSave(),ov=$('#ov');
 const go=()=>{setSpeed(G.speed||2);enterTown('<b>開発者モード</b>――全要素を解放した状態。画面右下の「DEV」から各verの要素へ直行できる。<br><small>通常のセーブには一切影響しません</small>');};
 if(!s){devGame();return go();}
 ov.innerHTML=`<div class="logo" style="font-size:24px">開発者モード</div><div class="sub">通常セーブとは別枠の開発用データ</div><div class="tmenu"><button class="big gold" id="dc">開発データの続き</button><button class="big" id="dn">作り直す（全解放）</button><button class="big" id="db" style="height:40px;font-size:13px">タイトルへ</button></div>`;
 $('#dc').onclick=()=>{migrate(Object.assign(newGame(),s));G.dev=1;go();};$('#dn').onclick=()=>{devGame();go();};$('#db').onclick=title;}
const devBack=m=>()=>enterTown(m||'開発：戻った');
function devBattle(list,area,opts={}){setArea(area);startBattle(list,Object.assign({boss:true,onEnd:devBack('開発：戦闘終了')},opts));}
function dvMenu(m){log((m||'<b>開発者メニュー</b>　verごとの追加要素へ直行')+goldTxt());
 menu([{l:'ver0.14 クリア後',s:'虚の回廊・竜の巣・セレス・ヴァルク・虚蝕化',cls:'ready',f:dev14},{l:'ver0.13 終章',s:'星核の残響・全共鳴・ラスボス・エンディング',f:dev13},{l:'ver0.12 天への塔',s:'任意階・星核の守護者・レジェンド',f:dev12},{l:'ver0.11 覚醒の深化',s:'試練・覚醒段階',f:dev11},
  {l:'ver0.10 沈んだ王都',s:'王都・王家セット',f:()=>menu([{l:'沈んだ王都へ',cls:'ready',f:()=>enterField('ouito')},{l:'王家セットを受け取る',f:()=>{devRoyal();save();dvMenu('王家セット4部位を受け取った');}},{l:'沈みし女王戦',f:()=>devBattle([{kind:'boss6',lv:37}],'ouito',{theme:'ruin'})},{l:'戻る',cls:'back',f:()=>dvMenu()}],true)},
  {l:'ver0.9 街の発展',s:'施設Lv切替',f:()=>menu([{l:'全施設Lv5',f:()=>{for(const k in G.fac)G.fac[k]=5;save();dvMenu('全施設Lv5');}},{l:'全施設Lv1（庭園なし）',f:()=>{for(const k in G.fac)G.fac[k]=k==='garden'?0:1;save();dvMenu('全施設Lv1に戻した');}},{l:'街の発展を開く',f:()=>devMenu()},{l:'戻る',cls:'back',f:()=>dvMenu()}],true)},
  {l:'エリアへ直行',s:'各章のマップ',f:devAreas},{l:'ボス戦',s:'全ボスと即戦闘',f:devBoss},{l:'育成・所持品',s:'Lv・お金・道具',f:devGrow},
  {l:'灯都へ戻る',cls:'back',f:()=>townMenu()},{l:'タイトルへ（開発終了）',cls:'back',f:title}],true);}
function dev14(m){G.flags.boss8=true;G.flags.endSeen=1;const K=kst(),va=voidArea(G.sorties+1);
 log((m||'<b>ver0.14 クリア後</b>')+`<br><small>回廊：最深${K.max||0}層・中継${K.cp}層　セレス：${G.members.includes('celes')?'加入':'未'}　ヴァルク：${G.members.includes('valk')?'加入':'未'}　虚蝕化：${va?AREAS[va].name:'なし'}</small>`);
 const vlist=[null,...VOIDABLE.map(a=>a[0])],vi=vlist.indexOf(G.voidOv===undefined?va:G.voidOv);
 menu([{l:'虚の回廊（層を選ぶ）',cls:'ready',f:()=>menu([...[1,9,10,11,20,29,30,31,40,50].map(f=>({l:`${f}層`,s:f%10===0?'番人の層':'',f:()=>{K.cp=Math.max(K.cp,31);enterKairou(f);}})),{l:'戻る',cls:'back',f:()=>dev14()}],true)},
  {l:'竜の巣へ',f:()=>enterField('ryuu')},{l:'ヴァルクと決闘',f:()=>devBattle([{kind:'valkE',lv:1}],'ryuu',{boss:false,event:'valk',theme:'lava'})},
  {l:'黒炎竜ヴォルガノン戦',f:()=>devBattle([{kind:'boss9',lv:68}],'ryuu',{theme:'lava'})},
  {l:'回廊30層の番人戦',f:()=>{K.cur=30;AREAS.kairou=makeKairouArea(30);devBattle([{kind:kBoss(30),lv:84}],'kairou',{theme:'void'});}},
  {l:'虚蝕化エリアを切り替え',s:'次：'+((v=>v?AREAS[v].name:'なし')(vlist[(vi+1)%vlist.length])),f:()=>{G.voidOv=vlist[(vi+1)%vlist.length];save();dev14('虚蝕化エリアを切り替えた（出撃で確認）');}},
  {l:'虚蝕化を自然な周期に戻す',f:()=>{delete G.voidOv;save();dev14('虚蝕化を通常の周期に戻した');}},
  {l:'セレス・ヴァルクを未加入に戻す',f:()=>{G.members=G.members.filter(i=>i!=='celes'&&i!=='valk');G.party=G.party.filter(i=>i!=='celes'&&i!=='valk');if(!G.party.length)G.party=['rio'];G.flags.celesMet=0;G.flags.valkMet=0;G.declined=(G.declined||[]).filter(i=>i!=='celes'&&i!=='valk');save();dev14('セレス・ヴァルクを未加入にした（回廊30層・竜の巣で再加入）');}},
  {l:'戻る',cls:'back',f:()=>dvMenu()}],true);}
function dev13(m){log((m||'<b>ver0.13 終章</b>')+`<br><small>残響${echoN()}/3　全共鳴：${G.flags.zenkyo?'習得':'未'}　クリア：${G.flags.boss8?'済':'未'}</small>`);
 menu([{l:'星核の残響へ',cls:'ready',f:()=>enterField('zankyo')},{l:'ラスボス3形態戦へ直行',f:()=>devBattle([{kind:'last1',lv:55}],'zankyo',{stages:AREAS.zankyo.stages,theme:'void'})},
  {l:'第3形態だけ戦う',f:()=>devBattle([{kind:'last3',lv:58}],'zankyo',{theme:'void'})},{l:'エンディングを見る',f:ending},
  {l:G.flags.zenkyo?'全共鳴を未習得にする':'全共鳴を習得する',f:()=>{G.flags.zenkyo=G.flags.zenkyo?0:1;save();dev13();}},
  {l:'残響・全共鳴・クリアをリセット',f:()=>{G.flags.echo={};G.flags.zenkyo=0;G.flags.boss8=false;G.flags.endSeen=0;save();dev13('終章を未クリア状態に戻した');}},{l:'戻る',cls:'back',f:()=>dvMenu()}],true);}
function dev12(m){log((m||'<b>ver0.12 天への塔</b>　階を選んで直行'));
 menu([...[1,6,10,11,16,20,21,26,30].map(f=>({l:`${f}階`,s:f%10===0?'番人の階':'',f:()=>{G.tower.cp=Math.max(G.tower.cp,26);enterTower(f);}})),{l:'星核の守護者戦',f:()=>{AREAS.tower=makeTowerArea(30);G.tower.cur=30;devBattle([{kind:'boss7',lv:50}],'tower',{theme:'tower'});}},
  {l:'レジェンド全種を受け取る',s:Object.keys(LEG).length+'種',f:()=>{devLegs();save();dev12('レジェンドを全種受け取った（装備画面で確認）');}},{l:'戻る',cls:'back',f:()=>dvMenu()}],true);}
function dev11(m){log(m||'<b>ver0.11 覚醒の深化</b>');
 menu([{l:'覚醒の試練',cls:'ready',f:()=>trialMenu()},...[1,2,3].map(n=>({l:`全員の覚醒段階を${ROMAN[n]}に`,f:()=>{G.members.forEach(id=>G.h[id].awLv=n);save();dev11(`全員の覚醒段階を${ROMAN[n]}にした`);}})),{l:'戻る',cls:'back',f:()=>dvMenu()}],true);}
function devAreas(){menu([...Object.keys(AREAS).filter(k=>k!=='tower'&&k!=='kairou').map(k=>({l:AREAS[k].name,s:AREAS[k].rec||'',f:()=>enterField(k)})),{l:'戻る',cls:'back',f:()=>dvMenu()}],true);}
function devBoss(){const ks=Object.keys(ED).filter(k=>ED[k].boss&&!k.startsWith('tr_')&&!k.startsWith('kb')),ar={boss1:'haido',boss2:'midori',boss3:'seido',boss4:'raimei',boss5:'kouka',boss6:'ouito',boss9:'ryuu'};
 menu([...ks.map(k=>({l:ED[k].name,s:`HP${ED[k].mhp}`,f:()=>devBattle([{kind:k,lv:55}],k.startsWith('last')?'zankyo':ar[k]||'haido',k.startsWith('last')?{theme:'void'}:{})})),{l:'戻る',cls:'back',f:()=>dvMenu()}],true);}
function devGrow(m){log((m||'<b>育成・所持品</b>')+`<br><small>${G.party.map(i=>HB[i].name+' Lv'+G.h[i].lv).join('　')}</small>`);
 const setLv=n=>{G.members.forEach(id=>{G.h[id].lv=n;G.h[id].xp=0;G.h[id].hp=null;});save();devGrow(`全員Lv${n}にした`);};
 menu([{l:'全員Lv+5',f:()=>setLv(Math.min(99,G.h.rio.lv+5))},{l:'全員Lv30',f:()=>setLv(30)},{l:'全員Lv55',f:()=>setLv(55)},{l:'全員Lv99',f:()=>setLv(99)},
  {l:'999999G・灯力MAX',f:()=>{G.gold=999999;G.tou=99999;save();devGrow('お金と灯力を補充');}},{l:'道具・素材・星石MAX',f:()=>{devItems();save();devGrow('道具・素材・星石を補充');}},
  {l:'Lv55用の装備に揃える',f:()=>{devGear();save();devGrow('全員にLv55装備を付けた');}},{l:'戻る',cls:'back',f:()=>dvMenu()}],true);}
