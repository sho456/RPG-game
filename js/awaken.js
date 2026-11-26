/* ===== ver0.11 星臨の深化 ===== */
const ROMAN=['','Ⅰ','Ⅱ','Ⅲ'];
Object.assign(SK,{
 gokurio:{n:'星灯一閃',el:'陽',k:'phys',pow:3,t:'all',d:'星臨Ⅲ：光の大斬撃・敵全体'},gokugald:{n:'金城鉄壁',k:'barrier',long:1,t:'self',d:'星臨Ⅲ：味方の被ダメ-30%が長く続く'},
 gokumire:{n:'星界の双極',k:'mag',el:null,pow:3,t:'all',gauge:50,d:'星臨Ⅲ：全体の大魔法（ゲージ50）'},gokushion:{n:'夢幻影縫い',el:'突',k:'phys',pow:1.6,t:'all',delay:60,d:'星臨Ⅲ：全体攻撃＋大きく遅らせる'},
 gokunoah:{n:'天上の聖歌',k:'reviveAll',t:'self',d:'星臨Ⅲ：倒れた仲間を全員復活し、HP40%回復'},gokuerna:{n:'流星穿',el:'突',k:'phys',pow:2.4,t:'all',gauge:40,delay:45,d:'星臨Ⅲ：全体射撃＋行動を遅らせる（ゲージ40）'},
 gokubalza:{n:'炉心臨界',el:'熱',k:'phys',pow:2,t:'all',d:'星臨Ⅲ：炎の全体大技（熱で威力上昇）'},gokucrow:{n:'冥界の門',el:'陰',k:'mag',pow:2.8,t:'all',hpCost:.15,d:'星臨Ⅲ：HP15%を払う闇の全体大魔法'},
 gokuhakua:{n:'氷華千本',el:'冷',k:'phys',pow:.45,hits:8,t:'one',d:'星臨Ⅲ：氷の8連撃'},gokujin:{n:'百獣の王',el:'打',k:'phys',pow:2.4,t:'all',auto:['斬','打'],d:'星臨Ⅲ：弱点を突く全体攻撃'}});
const awCmds=u=>[...AW[u.id].cmds,...((u.awLv||1)>=3?['goku'+u.id]:[]),...(u.id==='rio'&&G.flags.zenkyo?['zenkyo']:[])];
const TRIAL={rio:['空白の星片が、誰かの声で震えた。「おまえは、借り物の光で戦うのか？」','「借り物でいい。みんなの灯をつなぐのが、俺の光だ」'],
 gald:['守れなかった部下たちの幻が立ちはだかる。','「もう誰も失わん。この身が城壁である限り」'],mire:['炎と氷、二つの頁が反発し合う。','「矛盾ごと抱えて、それが私の魔法」'],
 shion:['孤児院の子どもたちの影が「置いていかないで」とささやく。','「置いてかねえよ。全部まとめて、俺が守る」'],noah:['人形に心はない、と古い祈りが告げる。','「心がないのなら、この祈りはどこから来るのでしょう」'],
 erna:['外した一矢の記憶が、弓を重くする。','「次は外さない。だから私は、構え続ける」'],balza:['冷えきった炉が、老いた腕を嘲笑う。','「火は消えとらん。わしが打つ限りな！」'],
 crow:['喰われた家族の声が、呪いの言葉を求める。','「呪いで救えるものがあるなら――俺が引き受ける」'],hakua:['巫女の使命が、氷の鎖になって絡みつく。','「使命だからじゃない。私が、行きたいから行くんだ！」'],
 jin:['ポポとの絆を試すように、獣の幻が吠える。','「俺たちは二人で一つ。どっちが欠けても王じゃない」']};
const OWNEL={rio:'陽',gald:'打',mire:'熱',shion:'斬',noah:'陽',erna:'雷',balza:'熱',crow:'陰',hakua:'冷',jin:'打'};
const mixHex=(a,b,t)=>{const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));const x=p(a),y=p(b);return'#'+x.map((v,i)=>Math.round(v*(1-t)+y[i]*t).toString(16).padStart(2,'0')).join('');};
EA.mirror={n:'幻影の一撃',el:null,k:'phys',pow:2.2,t:'all'};
function trialEnemy(id,tier){const k='tr_'+id+tier;if(!ED[k]){const pal={};SPR[id].join('').split('').forEach(ch=>{if(ch!=='.'&&!pal[ch])pal[ch]=shadeHex(mixHex(PAL[ch]||'#888888','#5a2aa0',.55),tier===2?.7:.55);});
  SPR[k]=SPR[id];IMG[k]=mk(SPR[id],pal);IMG[k+'_w']=mk(SPR[id],null,'#ffffff');const ws=['陽','陰','熱','冷','雷','斬','打','突'].filter(e=>e!==OWNEL[id]);
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
