/* ===== 灯都ルミナス ===== */
function enterTown(m){show('town');setH(128);TOWN=makeTown(townP());gardenTick();$('#ov').classList.add('hide');healAll();save();townMenu(m);}
/* 未使用：js/ver17.js が置き換え */
const QS=[{id:'q1',n:'灰狼退治',d:'灰狼を3体倒す',ok:()=>G.q.wolf>=3,pg:()=>`${Math.min(3,G.q.wolf)}/3`,rw:'150G',give:()=>{G.gold+=150;}},
 {id:'q2',n:'灰石の納品',d:'灰石を3個納める',ok:()=>G.mats.haiseki>=3,pg:()=>`${G.mats.haiseki}/3`,rw:'星の雫×1',give:()=>{G.mats.haiseki-=3;addItem('drop',1);}},
 {id:'q3',n:'街道の番人',d:'虚ろの番人を倒す',ok:()=>G.flags.boss1,pg:()=>G.flags.boss1?'達成':'未達成',rw:'500G・不死鳥の羽',give:()=>{G.gold+=500;addItem('feather',1);}}];
function board(){}/* 未使用：js/ver18-town.js が置き換え */
/* 未使用：js/ver18-town.js が置き換え */
function townMenu(){}

function tavern(){}/* 未使用：js/ch9.js が置き換え */
/* 未使用：js/ver17.js が置き換え */
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

/* ===== 装備系UI（パネル） ===== */
let ACT={};
function panel(html,acts){const c=$('#cmd');if(scene==='town')$('#stage').style.display='none';c.className='panel';ACT=acts||{};c.innerHTML=html;c.scrollTop=0;}
$('#cmd').addEventListener('click',e=>{if(!$('#cmd').classList.contains('panel'))return;const t=e.target.closest('[data-a]');if(!t||t.classList.contains('off'))return;const f=ACT[t.dataset.a];if(f){SFX.sel();f(t.dataset.v);}});
const chips=(arr,cls='')=>arr.map(x=>`<span class="chp ${cls}">${x}</span>`).join('');
function icard(it,o={}){const w=eqBy(it.uid),c=RAR[it.rar];
 return`<div class="icard r${it.rar}${o.off?' off':''}" data-a="${o.a||''}" data-v="${it.uid}"><img class="iic" src="${itemIcon(it)}" data-eqi="${it.uid}"><div class="ibody"><div class="inm">${it.lock?'🔒':''}${iname(it)}</div>
 <div class="isub"><span class="rb">${c.n}</span> Lv${it.ilv}${it.who?'　'+HB[it.who].name+'専用':''}${w&&!o.noeq?`　<span class="eqt">${HB[w].name}装備中</span>`:''}</div>
 <div>${o.diff||chips(it.unid?['未鑑定']:Object.entries(itemBase(it)).map(([k,v])=>BN[k]+' '+v))}${it.unid?'':chips(it.ops.map(opTxt),'op')}${it.leg&&!it.unid?chips(['★'+LEG[it.leg].d],'lg'):''}${it.set&&!it.unid?chips([`${SETS[it.set].n}　2部位：${SETS[it.set].d2}／4部位：${SETS[it.set].d4}`],'lg'):''}${!it.unid&&it.sock&&it.sock.length?chips(it.sock.map(k=>k?'◆'+STONES[k].n:'◇空き'),'sk'):''}</div></div>${o.right?`<div class="iright">${o.right}</div>`:''}</div>`;}

/* 未使用：js/ver17.js が置き換え */

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

function smith(){}
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

const invCap=()=>200+(G.fac.store-1)*75;
const ecap=()=>Math.min(12,2+2*G.fac.smith);
const townP=()=>{if(!G||!G.fac)return 1;const s=Object.values(G.fac).reduce((a,b)=>a+b,0);return .15+.85*Math.min(1,(s-6)/29);};
/* 未使用：js/ver18-town.js が置き換え */
const ISLE=(()=>{const c=document.createElement('canvas');c.width=40;c.height=24;const g=c.getContext('2d'),R=rng(31);

 })();
function gardenTick(){if(!G.fac.garden)return;const n=Math.min(10,G.sorties-(G.garden.last||0));if(n>0)G.garden.n=Math.min(10,(G.garden.n||0)+n);G.garden.last=G.sorties;}

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
