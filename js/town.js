/* ===== 灯都ルミナス ===== */
function enterTown(m){show('town');setH(128);TOWN=makeTown(townP());gardenTick();$('#ov').classList.add('hide');healAll();save();townMenu(m);}
function worldMap(){}/* 未使用：js/ver17.js が置き換え */
const QS=[{id:'q1',n:'灰狼退治',d:'灰狼を3体倒す',ok:()=>G.q.wolf>=3,pg:()=>`${Math.min(3,G.q.wolf)}/3`,rw:'150G',give:()=>{G.gold+=150;}},
 {id:'q2',n:'灰石の納品',d:'灰石を3個納める',ok:()=>G.mats.haiseki>=3,pg:()=>`${G.mats.haiseki}/3`,rw:'星の雫×1',give:()=>{G.mats.haiseki-=3;addItem('drop',1);}},
 {id:'q3',n:'街道の番人',d:'虚ろの番人を倒す',ok:()=>G.flags.boss1,pg:()=>G.flags.boss1?'達成':'未達成',rw:'500G・不死鳥の羽',give:()=>{G.gold+=500;addItem('feather',1);}}];
function board(){}/* 未使用：js/ver18-town.js が置き換え */
function shop(){}/* 未使用：js/ver18-town.js が置き換え */
function townMenu(m){devBtn(!!G.dev);log((m||'大灯（おおあかり）に守られた最後の街。準備を整えよう。')+goldTxt()+(!G.dev&&G.sorties-(G.lastExp??0)>=8?'<br><small style="color:#ffb030">⚠ しばらく記録の控えを取っていません。「記録→書き出す」で控えを</small>':''));const un=G.inv.filter(i=>i.unid).length;
 hud(`灯都ルミナス　<b>${chapter()}</b>`);if(G.flags.boss8)$('#msg').insertAdjacentHTML('beforeend',voidNews());
 menu([{l:'出撃',ic:'go',cls:'ready',f:worldMap},{l:'装備',ic:'eq',f:()=>equipMenu(G.party[0])},{l:'酒場',ic:'bar',f:tavern},
  {l:'鍛冶屋',ic:'smith',f:smith},{l:'鑑定屋',ic:'eye',s:un?`未鑑定${un}`:'',cls:un?'ready':'',f:appraise},{l:'道具屋',ic:'shop',f:shop},
  {l:'星詠みの塔',ic:'star',cls:G.members.some(i=>ptsLeft(i)>0)?'ready':'',f:()=>openBoard(G.party[0])},{l:'街の発展',ic:'door',cls:G.fac.garden&&G.garden.n?'ready':'',f:devMenu},{l:'記録',ic:'rec',f:saveMenu}],false,'grid9');}
function statLine(id){const s=stats(id),h=G.h[id];return`<b>${HB[id].name}</b> Lv${h.lv}　HP${s.mhp} 攻${s.atk} 防${s.def} 魔${s.mag} 精${s.res} 速${+s.spd.toFixed(1)}`+
 [s.crit&&`会心+${s.crit}%`,s.weakDmg&&`弱点+${s.weakDmg}%`,s.startAG&&`開始AG${s.startAG}`,s.awDmg&&`星臨中+${s.awDmg}%`,s.spGain&&`SP+${s.spGain}`,s.drop&&`ドロップ+${s.drop}%`,s.atkEl&&`攻撃${s.atkEl}属性`].filter(Boolean).map(t=>`<span style="color:#7fd6ff"> ${t}</span>`).join('');}
function tavern(){}/* 未使用：js/ch9.js が置き換え */
function formation(){}/* 未使用：js/ver17.js が置き換え */
function ecost(it){return{g:Math.round((it.plus+1)*25*(1+it.ilv/4)),haiseki:it.plus+1,kakera:Math.max(0,it.plus-4)};}
function saveMenu(m){log((m?m+'<br>':'<b>記録</b>　街に戻ると自動でセーブ<br>')+`<div style="margin-top:6px;padding:6px 8px;border:1px solid #ffb030;border-radius:6px;background:rgba(255,176,48,.1);font-size:12px;color:#ffe0a0">⚠ セーブはこの端末のブラウザの中だけにあります。ブラウザのデータ削除・機種変更・プライベートブラウズで消えるので、ときどき<b>「書き出す」</b>で文字列を控え、メモ帳などに保管してください。<br>最後の書き出し：${G.lastExp==null?'まだ一度もない':G.sorties-G.lastExp===0?'今回の出撃中':(G.sorties-G.lastExp)+'回前の出撃'}</div>`);
 menu([{l:'セーブする',f:()=>saveMenu(save()?'セーブしました。':'この環境ではブラウザに保存できません。書き出しを使ってください。')},
  {l:'書き出す',s:'コピーして保管',cls:'ready',f:()=>{G.lastExp=G.sorties;save();const t=enc(G);log('<textarea id="sv" readonly style="width:100%;height:70px;font-size:10px">'+t+'</textarea>');
   try{navigator.clipboard.writeText(t).then(()=>log('クリップボードにコピーしました。メモ等に貼って保管してください。<textarea readonly style="width:100%;height:50px;font-size:10px">'+t+'</textarea>'),()=>{});}catch(e){}}},
  {l:'読み込む',s:'書き出した文字列',f:loadMenu},{l:'タイトルへ',f:title},{l:'戻る',cls:'back',f:()=>townMenu()}],true);}
function loadMenu(){log('書き出した文字列を貼り付けて「読み込む」<textarea id="sv" style="width:100%;height:70px;font-size:11px;-webkit-user-select:text;user-select:text"></textarea>');
 menu([{l:'読み込む',cls:'ready',f:()=>{try{migrate(Object.assign(newGame(),dec($('#sv').value)));save();setSpeed(G.speed||1);enterTown('記録を読み込みました。');}catch(e){log('読み込めませんでした。文字列を確認してください。');}}},{l:'戻る',cls:'back',f:()=>saveMenu()}],true);}

/* ===== タイトル ===== */
function title(){SAVE='astral_save_v1';show('title');const ov=$('#ov');ov.classList.remove('hide');ov.classList.add('ttl');const has=!!loadSave();let warn=false;
 ov.innerHTML=`<canvas id="tcv" width="180" height="320"></canvas><div class="tlogo">ASTRAL<br>BREAKER</div><div class="tsub">〜 星継ぎの灯 〜</div>
 <div class="tmenu"><button class="big" id="newg">はじめから</button><button class="big gold" id="cont" ${has?'':'disabled style="opacity:.35"'}>つづきから</button><button class="big" id="howto" style="height:40px;font-size:13px">遊び方</button></div>
 <div class="note" id="hw" style="display:none"><b>遊び方</b><br>・灯都で準備→「出撃」で各地へ。タップした場所へ歩く。<br>・魔物に<b>自分からぶつかると先制攻撃</b>。宝箱・採取ポイントを探そう。<br>・戦闘：弱点を突いて大ダメージ、AG100で<b>星臨</b>（行動を消費しない）。<br>・街に戻るとHP全回復＆自動セーブ。<b>星詠みの塔</b>で星盤とジョブ。</div>
 <div class="tfoot"><button id="devg">開発者モード</button><div class="ver" id="verL">ver0.17</div></div>`;
 $('#howto').onclick=()=>{const h=$('#hw');h.style.display=h.style.display==='none'?'block':'none';};
 $('#devg').onclick=()=>{au();devStart();};
 $('#cont').onclick=()=>{au();SAVE='astral_save_v1';migrate(Object.assign(newGame(),loadSave()));setSpeed(G.speed||1);enterTown('おかえりなさい。');};
 $('#newg').onclick=()=>{au();SAVE='astral_save_v1';if(has&&!warn){warn=true;$('#newg').textContent='もう一度押すと上書きして開始';return;}migrate(newGame());setSpeed(1);SFX.aw();
  enterTown('<b>序章</b>――大灯が揺らぎ、虚蝕が街に迫る。灯守見習いのリオは、元騎士団長ガルドと共に灰の街道へ向かう。');};}

/* ver0.34：戦闘速度は ×1・×2 の 2 段階（以前の ×4 の保存値は ×2 として読む） */
function setSpeed(v){v=+v===1?1:2;speed=v;$('#spd').textContent='×'+v;document.documentElement.style.setProperty('--pd',(v===1?1.4:.95)+'s');if(G)G.speed=v;}
$('#spd').onclick=()=>setSpeed(speed===1?2:1);
$('#autoB').onclick=()=>{auto=!auto;$('#autoB').classList.toggle('on',auto);if(auto&&B&&B.res&&!B.over)B.res();};
/* ===== 装備系UI（パネル） ===== */
let ACT={};
function panel(html,acts){const c=$('#cmd');if(scene==='town')$('#stage').style.display='none';c.className='panel';ACT=acts||{};c.innerHTML=html;c.scrollTop=0;}
$('#cmd').addEventListener('click',e=>{if(!$('#cmd').classList.contains('panel'))return;const t=e.target.closest('[data-a]');if(!t||t.classList.contains('off'))return;const f=ACT[t.dataset.a];if(f){SFX.sel();f(t.dataset.v);}});
const chips=(arr,cls='')=>arr.map(x=>`<span class="chp ${cls}">${x}</span>`).join('');
function icard(it,o={}){const w=eqBy(it.uid),c=RAR[it.rar];
 return`<div class="icard r${it.rar}${o.off?' off':''}" data-a="${o.a||''}" data-v="${it.uid}"><img class="iic" src="${itemIcon(it)}" data-eqi="${it.uid}"><div class="ibody"><div class="inm">${it.lock?'🔒':''}${iname(it)}</div>
 <div class="isub"><span class="rb">${c.n}</span> Lv${it.ilv}${it.who?'　'+HB[it.who].name+'専用':''}${w&&!o.noeq?`　<span class="eqt">${HB[w].name}装備中</span>`:''}</div>
 <div>${o.diff||chips(it.unid?['未鑑定']:Object.entries(itemBase(it)).map(([k,v])=>BN[k]+' '+v))}${it.unid?'':chips(it.ops.map(opTxt),'op')}${it.leg&&!it.unid?chips(['★'+LEG[it.leg].d],'lg'):''}${it.set&&!it.unid?chips([`${SETS[it.set].n}　2部位：${SETS[it.set].d2}／4部位：${SETS[it.set].d4}`],'lg'):''}${!it.unid&&it.sock&&it.sock.length?chips(it.sock.map(k=>k?'◆'+STONES[k].n:'◇空き'),'sk'):''}</div></div>${o.right?`<div class="iright">${o.right}</div>`:''}</div>`;}
function ehead(id){const s=stats(id),h=G.h[id];return`<div class="ehd"><img class="efc" src="${face(id)}"><div><div class="enm">${HB[id].name} <small>Lv${h.lv}</small></div>
 <div class="est">${[['HP',s.mhp],['攻',s.atk],['防',s.def],['魔',s.mag],['精',s.res],['速',+s.spd.toFixed(1)]].map(([k,v])=>`<span><i>${k}</i>${v}</span>`).join('')}</div></div></div>`;}
function equipMenu(){}/* 未使用：js/ver17.js が置き換え */
function pickEq(id,slot){const cur=G.h[id].eq[slot]&&findItem(G.h[id].eq[slot]),cb=cur?itemBase(cur):{},cs=cur?score(cur,id):0;
 const list=G.inv.filter(it=>canEq(it,id,slot)&&it.uid!==(cur&&cur.uid)).sort((a,b)=>score(b,id)-score(a,id)).slice(0,40);
 log(`<b>${HB[id].name}の${SLOTN[slot]}</b>　▲は今より強い候補`);
 const dif=it=>{const b=itemBase(it),ks=new Set([...Object.keys(b),...Object.keys(cb)]);return[...ks].map(k=>{const v=+((b[k]||0)-(cb[k]||0)).toFixed(1);return`<span class="chp ${v>0?'up':v<0?'dn':''}">${BN[k]} ${b[k]||0}${v?(v>0?' ▲':' ▼')+Math.abs(v):''}</span>`;}).join('');};
 panel(ehead(id)+(cur?`<div class="ttl2">今の装備</div>`+icard(cur,{noeq:1}):'')+`<div class="ttl2">候補 ${list.length}件</div>`+(list.length?list.map(it=>icard(it,{a:'eq',diff:dif(it),right:score(it,id)>cs?'<span class="up big">▲</span>':'<span class="dn big">▼</span>'})).join(''):'<div class="emp">装備できるものがない</div>')+
  `<div class="tbar2"><button class="tbtn" data-a="off" ${cur?'':'disabled'}>外す</button><button class="tbtn back" data-a="back">戻る</button></div>`,
  {eq:u=>{const it=findItem(+u);equip(id,slot,it.uid);save();equipMenu(id,`${iname(it)}を装備した`);},off:()=>{G.h[id].eq[slot]=null;save();equipMenu(id);},back:()=>equipMenu(id)});}
let INVF='all';const INVT={all:['全部',()=>1],w:['武器',i=>i.slot==='w'],arm:['防具',i=>'sub head body'.includes(i.slot)],acc:['装飾',i=>i.slot==='acc'],un:['未鑑定',i=>i.unid]};
function invMenu(m){const list=G.inv.filter(INVT[INVF][1]).sort((a,b)=>b.rar-a.rar||b.ilv-a.ilv),junk=G.inv.filter(i=>i.rar<=1&&!i.lock&&!i.unid&&!eqBy(i.uid));
 log((m||'<b>持ち物</b>　アイコンをタップで詳細')+goldTxt()+`<br><small>${G.inv.length}/200個</small>`);
 panel(`<div class="ftabs">${Object.entries(INVT).map(([k,[n]])=>`<button class="${INVF===k?'on':''}" data-a="tab" data-v="${k}">${n}</button>`).join('')}</div>
 <div class="igrid">${list.map(it=>{const w=eqBy(it.uid);return`<div class="itile r${it.rar}" data-a="item" data-v="${it.uid}"><img src="${itemIcon(it)}"><u class="eqi-b" data-eqi="${it.uid}">ⓘ</u>${it.plus?`<b class="pl">+${it.plus}</b>`:''}${w?`<b class="eb">E</b>`:''}${it.lock?'<b class="lk">🔒</b>':''}${it.unid?'<b class="un">?</b>':''}</div>`;}).join('')||'<div class="emp">なし</div>'}</div>
 <div class="tbar2"><button class="tbtn" data-a="junk" ${junk.length?'':'disabled'}>一括売却 <small>${junk.length}</small></button><button class="tbtn ${G.set.autoSell?'gold':''}" data-a="auto">自動売却 ${G.set.autoSell?'ON':'OFF'}</button></div>
 <button class="tbtn back wide" data-a="back">戻る</button>`,
 {tab:k=>{INVF=k;invMenu();},item:u=>itemMenu2(findItem(+u)),junk:()=>{const g=junk.reduce((a,i)=>a+price(i),0);G.inv=G.inv.filter(i=>!junk.includes(i));G.gold+=g;SFX.heal();save();invMenu(`コモン・アンコモン${junk.length}個を売却して${g}G`);},
  auto:()=>{G.set.autoSell=!G.set.autoSell;save();invMenu();},back:()=>equipMenu(G.party[0])});}
function itemMenu2(it){const w=eqBy(it.uid),dm=DISM[it.rar];log(`${ihtml(it)}`+goldTxt());
 const gone=m=>{G.inv=G.inv.filter(i=>i!==it);save();invMenu(m);};
 panel(icard(it,{})+`<div class="tbar3"><button class="tbtn" data-a="lock">${it.lock?'ロック解除':'ロック'}</button><button class="tbtn" data-a="sell" ${it.lock||w?'disabled':''}>売却<small>${price(it)}G</small></button>
 <button class="tbtn" data-a="dism" ${it.lock||w||it.unid?'disabled':''}>分解<small>${Object.entries(dm).map(([k,n])=>MATS[k].n+n).join(' ')}</small></button></div><button class="tbtn back wide" data-a="back">戻る</button>`,
 {lock:()=>{it.lock=!it.lock;save();itemMenu2(it);},sell:()=>{G.gold+=price(it);SFX.heal();gone(`${iname(it)}を売却した`);},dism:()=>{for(const[k,n]of Object.entries(dm))G.mats[k]+=n;SFX.brk();gone(`${iname(it)}を分解した`);},back:()=>invMenu()});}
const matLine=()=>Object.keys(MATS).map(k=>`${ii(ICON[k])}${MATS[k].n}×${G.mats[k]||0}`).join('　');
function smith(m){if(G.stockAt!==G.sorties||!G.stock){const lv=Math.max(1,Math.min(30,Math.max(...G.party.map(i=>G.h[i].lv))-1));G.stock=['w','w','body','head','sub','acc'].map((sl,i)=>genItem(lv,0,0,sl,G.fac.smith>=4&&i===0?2:i%3===2?1:0));G.stockAt=G.sorties;}
 log((m||'<b>鍛冶屋</b>　品揃えは出撃のたびに入れ替わる')+goldTxt()+'<br>'+matLine());
 panel(`<div class="ttl2">今日の品揃え</div>`+G.stock.map(it=>icard(it,{a:'buy',off:G.gold<price(it)*3,right:`<span class="pr">${price(it)*3}G</span>`})).join('')+
 `<div class="tbar2"><button class="tbtn gold" data-a="enh">強化<small>上限+${ecap()}</small></button><button class="tbtn" data-a="op" ${G.fac.smith<2?'disabled':''}>OP付け替え<small>${G.fac.smith<2?'鍛冶屋Lv2':''}</small></button><button class="tbtn" data-a="sock" ${G.fac.smith<3?'disabled':''}>ソケット<small>${G.fac.smith<3?'鍛冶屋Lv3':''}</small></button><button class="tbtn back" data-a="back">戻る</button></div>`,
 {buy:u=>{const it=G.stock.find(x=>x.uid===+u);G.gold-=price(it)*3;G.stock=G.stock.filter(x=>x!==it);it.uid=++G.uid;G.inv.push(it);SFX.aw();save();smith(`${iname(it)}を買った`);},enh:()=>enhance(),op:()=>opSwap(),sock:()=>sockMenu(),back:()=>townMenu()});}
function enhance(){}/* 未使用：js/ui/smith.js が置き換え */
function appraise(m){const un=G.inv.filter(i=>i.unid),cost=it=>Math.round((30+it.ilv*10)*(1-.1*(G.fac.eye-1))),tot=un.reduce((a,i)=>a+cost(i),0);
 log((m||'<b>鑑定屋</b>　エピック以上は鑑定するまで性能がわからない')+goldTxt());
 panel((un.length?`<div class="ttl2">未鑑定 ${un.length}個</div>`+un.map(it=>icard(it,{right:`<span class="pr">${cost(it)}G</span>`})).join(''):'<div class="emp">未鑑定品はない</div>')+
 `<div class="tbar2"><button class="tbtn gold" data-a="all" ${!un.length||G.gold<tot?'disabled':''}>一括鑑定 <small>${tot}G</small></button><button class="tbtn back" data-a="back">戻る</button></div>`,
 {all:()=>{G.gold-=tot;un.forEach(i=>{i.unid=false;i.up=0;if(Math.random()<(G.fac.eye-1)*.05&&upgradeRar(i))i.up=1;});SFX.aw();save();log('<b>鑑定結果</b>'+goldTxt());panel('<div class="ttl2">鑑定結果</div>'+un.map(it=>icard(it,{right:it.up?'<span class="pr">★レジェンド化！</span>':''})).join('')+'<button class="tbtn back wide" data-a="back">戻る</button>',{back:()=>appraise()});},back:()=>townMenu()});}

/* ===== ver0.9 街の発展 ===== */
Object.assign(ITEMS,{hipotion:{n:'ハイポーション',p:120,d:'HP50%回復',lv:2},ether:{n:'エーテル',p:150,d:'SP+50',lv:3},drop2:{n:'星の大雫',p:400,d:'AG+60',lv:4},tail:{n:'不死鳥の尾',p:600,d:'HP全快で復活',lv:5}});
ICON.hipotion=ICON.shop;ICON.ether=ICON.drop;ICON.drop2=ICON.drop;ICON.tail=ICON.feather;
const STONES={ruby:{n:'紅玉',v:{atkP:5},c:'#ff5a5a'},sapph:{n:'蒼玉',v:{defP:5},c:'#5a8aff'},emer:{n:'翠玉',v:{mhpP:6},c:'#5adc7a'},ame:{n:'紫水晶',v:{magP:5},c:'#c07aff'},
 moon:{n:'月長石',v:{resP:5},c:'#e0e8ff'},thun:{n:'雷石',v:{crit:3},c:'#ffe14a'},dia:{n:'金剛石',v:{weakDmg:8},c:'#ffffff'}};
const shadeHex=(h,f)=>{const n=parseInt(h.slice(1),16);return'#'+[n>>16,n>>8&255,n&255].map(v=>Math.min(255,Math.round(v*f)).toString(16).padStart(2,'0')).join('');};
for(const k in STONES){const c=document.createElement('canvas');c.width=c.height=12;const g=c.getContext('2d'),s=STONES[k],ov={p:shadeHex(s.c,1.3),v:s.c,V:shadeHex(s.c,.55)};
 IIS.kakera.forEach((r,y)=>{r=r.padEnd(12,'.');for(let x=0;x<12;x++)if(r[x]!=='.'){g.fillStyle=ov[r[x]]||PAL[r[x]];g.fillRect(x,y,1,1);}});ICON['st_'+k]=c.toDataURL();}
const stoneTxt=k=>`${ii(ICON['st_'+k],STONES[k].c)}${STONES[k].n}（${Object.entries(STONES[k].v).map(([a,b])=>opTxt({k:a,v:b})).join('')}）`;
const FAC={bar:['酒場','bar',l=>`戦闘の経験値+${(l-1)*5}%`],smith:['鍛冶屋','smith',l=>`強化上限+${Math.min(12,2+2*l)}${l>=2?'・OP付け替え':''}${l>=3?'・ソケット加工':''}${l>=4?'・品揃えにレア':''}`],
 eye:['鑑定屋','eye',l=>`鑑定でレジェンドに化ける確率${(l-1)*5}%・鑑定料${(l-1)*10}%引き`],shop:['道具屋','shop',l=>'品揃え：'+Object.values(ITEMS).filter(i=>(i.lv||1)<=l).map(i=>i.n).join('・')],
 tower:['星詠みの塔','star',l=>`ひらめき率+${(l-1)*10}%`],store:['倉庫','rec',l=>`持ち物の上限${200+(l-1)*75}個`],garden:['空中庭園','go',l=>l?`出撃ごとに素材と星石が育つ（Lv${l}）`:'未建設：建てると出撃のたびに素材が育つ']};
const fcost=(k,l)=>k==='garden'&&!l?{tou:60,gold:1000,haiseki:10}:{tou:40*l*l,gold:500*l*l,[l>=3?'kakera':'haiseki']:l>=3?l*2:l*6};
const invCap=()=>200+(G.fac.store-1)*75;
const ecap=()=>Math.min(12,2+2*G.fac.smith);
const townP=()=>{if(!G||!G.fac)return 1;const s=Object.values(G.fac).reduce((a,b)=>a+b,0);return .15+.85*Math.min(1,(s-6)/29);};
function makeTown(){}/* 未使用：js/ver18-town.js が置き換え */
const ISLE=(()=>{const c=document.createElement('canvas');c.width=40;c.height=24;const g=c.getContext('2d'),R=rng(31);
 for(let y=8;y<22;y++){const w=Math.max(0,18-(y-8)*1.4);g.fillStyle=y<11?'#5a4030':'#3a2820';g.fillRect(20-w|0,y,w*2|0,1);}
 g.fillStyle='#3e8a3a';g.fillRect(3,6,34,3);g.fillStyle='#5aac4a';g.fillRect(4,5,32,1);
 for(let i=0;i<5;i++){const tx=6+i*7;g.fillStyle='#2a6a2a';g.fillRect(tx,1,5,5);g.fillStyle='#4a3020';g.fillRect(tx+2,6,1,2);}
 g.fillStyle='#ff90c0';for(let i=0;i<6;i++)g.fillRect(4+R()*32|0,4+R()*2|0,1,1);g.fillStyle='#8ad0ff';g.fillRect(31,9,1,12);return c;})();
function gardenTick(){if(!G.fac.garden)return;const n=Math.min(10,G.sorties-(G.garden.last||0));if(n>0)G.garden.n=Math.min(10,(G.garden.n||0)+n);G.garden.last=G.sorties;}
function devMenu(m){gardenTick();log((m||'<b>街の発展</b>　灯力（とうりょく）と素材を注いで施設を育てる。育つほど街に色と灯りが戻る')+goldTxt());
 const have=c=>Object.entries(c).every(([k,v])=>k==='tou'?G.tou>=v:k==='gold'?G.gold>=v:(G.mats[k]||0)>=v);
 const ctxt=c=>Object.entries(c).map(([k,v])=>k==='tou'?`灯力${v}`:k==='gold'?`${v}G`:`${MATS[k].n}${v}`).join(' ');
 panel(`<div class="ttl2">所持：灯力 ${G.tou}　${G.gold}G　${matLine()}</div>`+Object.entries(FAC).map(([k,[n,ic,ef]])=>{const l=G.fac[k],c=fcost(k,l),mx=l>=5;
  return`<div class="icard ${['r0','r0','r1','r2','r3','r4'][l]}"><img class="iic" src="${ICON[ic]}"><div class="ibody"><div class="inm">${n} <small>Lv${l}/5</small></div><div class="isub">${ef(l)}</div>${mx?'':`<div><span class="chp up">次：${ef(l+1)}</span></div><div>${chips([ctxt(c)])}</div>`}</div>
  <div class="iright">${mx?'<span class="pr">MAX</span>':`<button class="tbtn ${have(c)?'gold':''}" style="width:64px;height:40px" data-a="up" data-v="${k}" ${have(c)?'':'disabled'}>${l?'強化':'建設'}</button>`}</div></div>`;}).join('')+
  (G.fac.garden?`<div class="tbar2"><button class="tbtn gold" data-a="harv" ${(G.garden.n||0)?'':'disabled'}>庭園で収穫 <small>${G.garden.n||0}回分</small></button><button class="tbtn back" data-a="back">戻る</button></div>`:'<button class="tbtn back wide" data-a="back">戻る</button>'),
 {up:k=>{const l=G.fac[k],c=fcost(k,l);for(const[a,v]of Object.entries(c)){if(a==='tou')G.tou-=v;else if(a==='gold')G.gold-=v;else G.mats[a]-=v;}G.fac[k]++;if(k==='garden')G.garden.last=G.sorties;SFX.aw();TOWN=makeTown(townP());save();devMenu(`<b>${FAC[k][0]}がLv${G.fac[k]}になった！</b> 街に灯りが増えた`);},
  harv:()=>{const n=G.garden.n,l=G.fac.garden,got={haiseki:2*l*n,kiba:l*n,kakera:Math.floor(l*n/2)};for(const k in got)G.mats[k]+=got[k];let st=[];for(let i=0;i<n;i++)if(Math.random()<.15*l){const k=Object.keys(STONES)[Math.random()*7|0];G.stones[k]=(G.stones[k]||0)+1;st.push(STONES[k].n);}
   G.garden.n=0;SFX.heal();save();devMenu(`庭園で収穫した：灰石${got.haiseki}・獣の牙${got.kiba}・虚の欠片${got.kakera}${st.length?'・星石（'+st.join('、')+'）':''}`);},back:()=>townMenu()});}
function opSwap(tg,ti){const can=i=>!i.unid&&i.ops.length;
 if(!tg){log('<b>OP付け替え</b>　付け替えたい装備を選ぶ（素材にした装備は消える）'+goldTxt());panel(G.inv.filter(can).sort((a,b)=>b.rar-a.rar).slice(0,40).map(it=>icard(it,{a:'t'})).join('')+'<button class="tbtn back wide" data-a="back">戻る</button>',{t:u=>opSwap(findItem(+u)),back:()=>smith()});return;}
 if(ti==null){log(`${ihtml(tg)}　入れ替えるOPを選ぶ`);panel(icard(tg,{})+'<div class="ttl2">入れ替えるOP</div>'+tg.ops.map((o,i)=>`<button class="tbtn wide" style="margin-bottom:6px" data-a="o" data-v="${i}">${opTxt(o)}</button>`).join('')+'<button class="tbtn back wide" data-a="back">戻る</button>',{o:i=>opSwap(tg,+i),back:()=>opSwap()});return;}
 const cost={g:Math.round(200+tg.ilv*40),k:1+Math.floor(tg.rar/2)},ok=G.gold>=cost.g&&G.mats.kakera>=cost.k,ds=G.inv.filter(i=>i!==tg&&can(i)&&!i.lock&&!eqBy(i.uid)).slice(0,40);
 log(`<b>${opTxt(tg.ops[ti])}</b> の代わりに付けるOPを選ぶ　費用：${cost.g}G・虚の欠片${cost.k}`+goldTxt());
 panel((ds.map(d=>`<div class="icard r${d.rar}"><img class="iic" src="${itemIcon(d)}"><div class="ibody"><div class="inm">${iname(d)}</div><div>${d.ops.map((o,j)=>`<button class="chp op" style="font-size:12px;padding:3px 7px;margin:3px 4px 0 0" data-a="p" data-v="${d.uid}:${j}" ${!ok||tg.ops.some((x,xi)=>xi!==ti&&x.k===o.k)?'disabled':''}>${opTxt(o)}</button>`).join('')}</div></div></div>`).join('')||'<div class="emp">素材にできる装備がない</div>')+'<button class="tbtn back wide" data-a="back">戻る</button>',
 {p:v=>{const[u,j]=v.split(':').map(Number),d=findItem(u),o=d.ops[j];tg.ops[ti]={...o};G.inv=G.inv.filter(i=>i!==d);G.gold-=cost.g;G.mats.kakera-=cost.k;SFX.aw();save();smith(`${iname(tg)}に<b>${opTxt(o)}</b>を付け替えた！`);},back:()=>opSwap(tg)});}
function sockMenu(it){const st=Object.keys(STONES).filter(k=>(G.stones[k]||0)>0);
 if(!it){log('<b>ソケット加工</b>　レア以上の装備には星石をはめる穴がある'+goldTxt()+'<br>星石：'+(Object.keys(STONES).filter(k=>G.stones[k]).map(k=>stoneTxt(k)+'×'+G.stones[k]).join('　')||'なし'));
  panel(G.inv.filter(i=>!i.unid&&i.sock&&i.sock.length).sort((a,b)=>(eqBy(b.uid)?1:0)-(eqBy(a.uid)?1:0)).slice(0,40).map(i=>icard(i,{a:'s'})).join('')||'<div class="emp">穴のある装備がない（レア以上に付く）</div>'+'',{s:u=>sockMenu(findItem(+u)),back:()=>smith()});$('#cmd').insertAdjacentHTML('beforeend','<button class="tbtn back wide" data-a="back">戻る</button>');return;}
 log(`${ihtml(it)}　穴をタップ：空き→星石をはめる／埋まり→外す（星石は戻る）`);
 panel(icard(it,{})+it.sock.map((k,i)=>`<button class="tbtn wide" style="margin-bottom:6px" data-a="h" data-v="${i}">${k?'◆ '+stoneTxt(k)+'　（外す）':'◇ 空きソケット'}</button>`).join('')+'<div class="ttl2">はめる星石を選んでから空きをタップ</div>'+
  (st.length?st.map(k=>`<button class="chp ${SELST===k?'up':''}" style="font-size:12px;padding:4px 8px;margin:3px" data-a="c" data-v="${k}">${stoneTxt(k)}×${G.stones[k]}</button>`).join(''):'<div class="emp">星石を持っていない（ボス・庭園・雑魚がまれに落とす）</div>')+'<button class="tbtn back wide" style="margin-top:8px" data-a="back">戻る</button>',
 {c:k=>{SELST=k;sockMenu(it);},h:i=>{i=+i;const k=it.sock[i];if(k){it.sock[i]=null;G.stones[k]=(G.stones[k]||0)+1;}else if(SELST&&G.stones[SELST]>0){it.sock[i]=SELST;G.stones[SELST]--;if(!G.stones[SELST])SELST=null;SFX.aw();}save();sockMenu(it);},back:()=>sockMenu()});}
let SELST=null;
function upgradeRar(it){if(it.rar>=4)return false;const n=genItem(it.ilv,0,0,it.slot,4);Object.assign(it,n,{uid:it.uid,unid:false});return true;}

QS.push(...Q2,...Q3,...Q4,...Q5,...Q6);
fit();draw();title();
