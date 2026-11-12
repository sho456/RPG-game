/* ===== ver0.11 星臨の深化 ===== */
const ROMAN=['','Ⅰ','Ⅱ','Ⅲ'];
Object.assign(SK,{
 gokurio:{n:'星灯一閃',el:'光',k:'phys',pow:3,t:'all',d:'星臨Ⅲ：光の大斬撃・敵全体'},gokugald:{n:'金城鉄壁',k:'barrier',long:1,t:'self',d:'星臨Ⅲ：味方の被ダメ-30%が長く続く'},
 gokumire:{n:'星界の双極',k:'mag',el:null,pow:3,t:'all',gauge:50,d:'星臨Ⅲ：全体の大魔法（ゲージ50）'},gokushion:{n:'夢幻影縫い',el:'突',k:'phys',pow:1.6,t:'all',delay:60,d:'星臨Ⅲ：全体攻撃＋大きく遅らせる'},
 gokunoah:{n:'天上の聖歌',k:'reviveAll',t:'self',d:'星臨Ⅲ：倒れた仲間を全員復活し、HP40%回復'},gokuerna:{n:'流星穿',el:'突',k:'phys',pow:2.2,t:'all',gauge:40,brkAll:1,d:'星臨Ⅲ：全体射撃＋確実にブレイク（ゲージ40）'},
 gokubalza:{n:'炉心臨界',el:'炎',k:'phys',pow:2,t:'all',d:'星臨Ⅲ：炎の全体大技（熱で威力上昇）'},gokucrow:{n:'冥界の門',el:'闇',k:'mag',pow:2.8,t:'all',hpCost:.15,d:'星臨Ⅲ：HP15%を払う闇の全体大魔法'},
 gokuhakua:{n:'氷華千本',el:'氷',k:'phys',pow:.45,hits:8,t:'one',d:'星臨Ⅲ：氷の8連撃'},gokujin:{n:'百獣の王',el:'地',k:'phys',pow:2.4,t:'all',auto:['風','地'],d:'星臨Ⅲ：弱点を突く全体攻撃'}});
const awCmds=u=>[...AW[u.id].cmds,...((u.awLv||1)>=3?['goku'+u.id]:[]),...(u.id==='rio'&&G.flags.zenkyo?['zenkyo']:[])];
const TRIAL={rio:['空白の星片が、誰かの声で震えた。「おまえは、借り物の光で戦うのか？」','「借り物でいい。みんなの灯をつなぐのが、俺の光だ」'],
 gald:['守れなかった部下たちの幻が立ちはだかる。','「もう誰も失わん。この身が城壁である限り」'],mire:['炎と氷、二つの頁が反発し合う。','「矛盾ごと抱えて、それが私の魔法」'],
 shion:['孤児院の子どもたちの影が「置いていかないで」とささやく。','「置いてかねえよ。全部まとめて、俺が守る」'],noah:['人形に心はない、と古い祈りが告げる。','「心がないのなら、この祈りはどこから来るのでしょう」'],
 erna:['外した一矢の記憶が、弓を重くする。','「次は外さない。だから私は、構え続ける」'],balza:['冷えきった炉が、老いた腕を嘲笑う。','「火は消えとらん。わしが打つ限りな！」'],
 crow:['喰われた家族の声が、呪いの言葉を求める。','「呪いで救えるものがあるなら――俺が引き受ける」'],hakua:['巫女の使命が、氷の鎖になって絡みつく。','「使命だからじゃない。私が、行きたいから行くんだ！」'],
 jin:['ポポとの絆を試すように、獣の幻が吠える。','「俺たちは二人で一つ。どっちが欠けても王じゃない」']};
const OWNEL={rio:'光',gald:'地',mire:'炎',shion:'風',noah:'光',erna:'雷',balza:'炎',crow:'闇',hakua:'氷',jin:'地'};
const mixHex=(a,b,t)=>{const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));const x=p(a),y=p(b);return'#'+x.map((v,i)=>Math.round(v*(1-t)+y[i]*t).toString(16).padStart(2,'0')).join('');};
EA.mirror={n:'幻影の一撃',el:null,k:'phys',pow:2.2,t:'all'};
function trialEnemy(id,tier){const k='tr_'+id+tier;if(!ED[k]){const pal={};SPR[id].join('').split('').forEach(ch=>{if(ch!=='.'&&!pal[ch])pal[ch]=shadeHex(mixHex(PAL[ch]||'#888888','#5a2aa0',.55),tier===2?.7:.55);});
  SPR[k]=SPR[id];IMG[k]=mk(SPR[id],pal);IMG[k+'_w']=mk(SPR[id],null,'#ffffff');const ws=['光','闇','炎','氷','雷','風','地','斬','打','突'].filter(e=>e!==OWNEL[id]);
  const T=tier===2?{mhp:5200,atk:150,mag:150,def:44,res:44,spd:14}:{mhp:12000,atk:270,mag:290,def:70,res:70,spd:16};
  ED[k]=Object.assign({name:HB[id].name+'の幻影',weak:[ws[(id.length*3)%ws.length],ws[(id.length*7+3)%ws.length]],brk:tier===2?9:13,sc:3,boss:true,xp:tier===2?800:3000,gold:tier===2?1000:4000,drop:[['kakera',1],['kakera',1]],
   ai:{every:3,charge:'mirror',acts:[['claw',.5],['wave',.5]],summon:'shade',sumLv:tier===2?14:30},ilv:tier===2?16:32,flip:1},T);}return k;}
function trialMenu(m){log((m||'<b>星臨の試練</b>　星詠みの塔の奥で、自分の幻影と向き合う。勝つと星臨が一段深まる')+goldTxt());
 panel(G.members.map(id=>{const h=G.h[id],lv=h.awLv||1,nx=lv+1,req=nx===2?15:30,ok=lv<3&&h.lv>=req;
  return`<div class="icard r${lv===3?4:lv===2?2:0}"><img class="iic" src="${face(id,lv>1)}"><div class="ibody"><div class="inm">${HB[id].name}　<small>「${AW[id].name}」</small></div>
  <div class="isub">星臨 <span style="color:#ffe27a">${'★'.repeat(lv)}${'☆'.repeat(3-lv)}</span>　位階${ROMAN[lv]}</div><div>${lv>=3?chips(['極技「'+SK['goku'+id].n+'」習得済み'],'lg'):chips([`次：位階${ROMAN[nx]}（Lv${req}以上）`,nx===2?'持続+1・与ダメ+10%':'さらに強化＋極技「'+SK['goku'+id].n+'」'],ok?'up':'')}</div></div>
  <div class="iright">${lv>=3?'<span class="pr">MAX</span>':`<button class="tbtn ${ok?'gold':''}" style="width:62px;height:40px" data-a="go" data-v="${id}" ${ok?'':'disabled'}>挑む</button>`}</div></div>`;}).join('')+'<button class="tbtn back wide" data-a="back">戻る</button>',
 {go:id=>trialStart(id),back:()=>townMenu()});}
function trialStart(id){const tier=(G.h[id].awLv||1)+1,k=trialEnemy(id,tier),prev=[...G.party];G.party=[id,...prev.filter(x=>x!==id)].slice(0,4);healAll();
 log(`<b>星臨の試練　${HB[id].name}・位階${ROMAN[tier]}</b><br>${TRIAL[id][0]}`);
 menu([{l:'試練に挑む',cls:'ready',f:()=>startBattle([{kind:k,lv:1}],{trial:id,tier,prevParty:prev,theme:'void',onEnd:()=>trialWin(id,tier,prev)})},{l:'やめる',cls:'back',f:()=>{G.party=prev;trialMenu();}}]);}
function trialWin(id,tier,prev){G.h[id].awLv=tier;G.party=prev;save();SFX.aw();enterTown(`<b>${HB[id].name}の星臨が位階${ROMAN[tier]}に深まった！</b><br>${TRIAL[id][1]}`+(tier===3?`<br>極技「${SK['goku'+id].n}」を覚えた`:''));}
const RFX={'gald,rio':{c:'#ffd65a',el:'光',fx:'barrier'},'mire,rio':{c:'#ff7a3a',el:'炎',fx:'ag'},'noah,rio':{c:'#fff3b0',el:'光',fx:'revive',m:.6},'rio,shion':{c:'#8ff0a8',el:'風',fx:'delay'},
 'erna,rio':{c:'#ffe14a',el:'雷',fx:'single',m:2.4},'hakua,rio':{c:'#bff4ff',el:'氷',fx:'delay'},'jin,rio':{c:'#d08030',el:'地',fx:'ag'},'gald,noah':{c:'#e0e0ff',el:'光',fx:'barrier',m:.6},
 'balza,gald':{c:'#ff8030',el:'打',m:1.5},'crow,mire':{c:'#b07cff',el:'闇',m:1.35},'hakua,mire':{c:'#7fd6ff',el:'氷',fx:'break'},'mire,shion':{c:'#ff9a40',el:'風',fx:'delay'}};
const RFXD={barrier:'味方に光の城壁（被ダメ-30%）',ag:'味方全員のAG+30',revive:'倒れた仲間も復活',delay:'敵全体の行動を遅らせる',single:'最もHPの多い敵に集中＋確実にブレイク',break:'敵全員を確実にブレイク'};
async function reso(u){B.reso=true;const ps=resoPair(),key=ps.map(h=>h.id).sort().join(','),nm=resoName(),X=RFX[key]||{c:'#ff9ad6'};
 const cut=$('#cut');cut.style.background=`linear-gradient(90deg,transparent,${X.c}66 25%,${X.c}66 75%,transparent)`;
 cut.innerHTML=`<div class="rcut">${ps.map(h=>`<canvas data-id="${h.id}" width="16" height="16"></canvas>`).join('<b>×</b>')}<div><div class="t">共鳴技　${ps.map(h=>h.name).join(' × ')}</div><div class="b" style="text-shadow:0 0 10px ${X.c},2px 2px 0 #000">${nm}</div>${X.fx?`<div class="t">${RFXD[X.fx]}</div>`:''}</div></div>`;
 cut.querySelectorAll('canvas').forEach(c=>c.getContext('2d').drawImage(IMG[c.dataset.id+'_aw']||IMG[c.dataset.id],0,0));
 cut.classList.remove('show');void cut.offsetWidth;cut.classList.add('show');SFX.aw();B.flashBg=40;B.flashCol=X.c;await wait(1400);cut.classList.remove('show');B.shake=16;
 const base=ps.reduce((a,h)=>a+Math.max(st(h,'atk'),st(h,'mag')),0)*3*(X.m||1)*(ps.some(h=>h.legs.includes('futago'))?2:1),el=X.el||OWNEL[ps[0].id];
 const tg=X.fx==='single'?[aliveE().sort((a,b)=>b.hp-a.hp)[0]]:aliveE();B.combo={n:0,tot:0};
 for(const e of tg){if(!e)continue;await hit(u,e,{n:nm,el,k:'phys',fixed:base});if((X.fx==='break'||X.fx==='single')&&e.alive&&!e.broken){e.brk=0;await doBreak(e,u);}if(X.fx==='delay'&&e.alive){e.ct+=60/e.spd;pop(e,'DELAY','#7fd6ff',true);}await wait(120);}comboEnd();
 if(X.fx==='barrier'){B.barrier=4;log('光の城壁が味方を包んだ');}
 if(X.fx==='ag')aliveH().forEach(h=>{if(!h.aw){h.ag=Math.min(100,h.ag+30);pop(h,'AG+30','#ffe27a',true);}});
 if(X.fx==='revive')B.heroes.forEach(h=>{if(!h.alive){h.alive=true;h.hp=1;setCT(h);}});
 const hv=X.fx==='revive'?.6:.3;aliveH().forEach(h=>{const v=Math.round(h.mhp*hv);h.hp=Math.min(h.mhp,h.hp+v);pop(h,'+'+v,'#7dffa8');});SFX.heal();refresh();}
