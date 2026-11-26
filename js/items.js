/* ===== 装備（ハクスラ） ===== */
const RAR=[{n:'コモン',c:'#d8d8d8',m:1},{n:'アンコモン',c:'#6fdc7f',m:2},{n:'レア',c:'#6fb2ff',m:4},{n:'エピック',c:'#c08cff',m:8},{n:'レジェンド',c:'#ffa040',m:16}];
const SLOTN={w:'武器',sub:'副装備',head:'頭',body:'体',acc1:'装飾1',acc2:'装飾2'};
const SLOTS6=['w','sub','head','body','acc1','acc2'];
const OPS={atkP:['攻撃','%',3,10],defP:['防御','%',3,10],magP:['魔力','%',3,10],resP:['精神','%',3,10],mhpP:['最大HP','%',4,12],spd:['素早さ','+',.3,1.2],
 crit:['会心率','%',2,8],weakDmg:['弱点ダメ','%',8,25],startAG:['開始時AG','+',8,25],awDmg:['星臨中与ダメ','%',8,30],spGain:['BP回復力','+',3,10],drop:['ドロップ率','%',3,10]};
const LEG={koukagari:{n:'流星の後篝',slot:'acc',d:'星臨が解けるときAG50を残す'},shokei:{n:'処刑人の刃',slot:'w',who:'rio',d:'弱点を突いたときの与ダメ×1.3'},futago:{n:'双子星の首飾り',slot:'acc',d:'奥義の威力+30%'}};
const BN={atk:'攻',def:'防',res:'精',mag:'魔',mhp:'HP',spd:'速'};
const MATL=l=>l<=2?'銅':l<=5?'鉄':l<=9?'鋼':'星鋼';
const grp=s=>s.startsWith('acc')?'acc':s;
/* 武器の基礎値と名前（武器種 8 種：js/rs/data.js の RSD.HERO・RSD.WPN）。杖は魔力、それ以外は攻撃が上がる */
const WBASE={rio:[5,2.4],gald:[7,2.7],valk:[7,2.7],balza:[7,2.8],shion:[5,2.3],jin:[6,2.5],hakua:[6,2.6],erna:[5,2.4],mire:[5,2.6],noah:[4,2.4],crow:[4,2.5],celes:[4,2.5]};
const WNOUN={'体術':'手甲'};
const wtypeOf=who=>{try{return(RSD.HERO[who]||{}).w||'剣';}catch(e){return'剣';}};
const wnounOf=who=>{try{const H=RSD.HERO[who];if(H&&H.shape)return H.shape;}catch(e){}const t=wtypeOf(who);return WNOUN[t]||t;};
function wbase(it,ilv,m){const t=wtypeOf(it.who),[a,b]=WBASE[it.who]||[6,2.5],v=Math.round(a+ilv*b);it.base=t==='杖'?{mag:v}:{atk:v};if(it.who==='crow')it.base.atk=Math.round(v*.6);/* 鎌杖：魔力に加えて攻撃も上がる */it.name=m+'の'+wnounOf(it.who);}
function rollRar(minR,bonus){const r=Math.random()*100/(1+bonus);return Math.max(minR,r<.5?4:r<5?3:r<17?2:r<45?1:0);}
function genItem(){}/* 未使用：js/v31/items.js が置き換え */
function fixedItem(){}/* 未使用：js/v31/items.js が置き換え */
const findItem=u=>G.inv.find(i=>i.uid===u);
const nextM=id=>G.members[(G.members.indexOf(id)+1)%G.members.length];
const eqBy=u=>G.members.find(id=>Object.values(G.h[id].eq).includes(u))||null;
function itemBase(it){const o={};for(const k in it.base){const v=it.base[k]*(1+.1*it.plus);o[k]=k==='spd'?+v.toFixed(1):Math.round(v);}return o;}
const opTxt=o=>o.k==='atkEl'?`攻撃が${o.v}属性`:`${OPS[o.k][0]}+${o.v}${OPS[o.k][1]==='%'?'%':''}`;
const iname=it=>it.unid?`??? （${RAR[it.rar].n}・${SLOTN[it.slot]||'装飾'}）`:it.name+(it.plus?` +${it.plus}`:'');
const ihtml=it=>ii(itemIcon(it),RAR[it.rar].c)+`<span style="color:${RAR[it.rar].c}">${it.lock?'🔒':''}${iname(it)}</span>`;
const mainTxt=it=>Object.entries(itemBase(it)).map(([k,v])=>BN[k]+v).join(' ');
const detailTxt=it=>it.unid?'未鑑定（街の鑑定屋で鑑定）':`${mainTxt(it)}${it.ops.length?'　'+it.ops.map(opTxt).join('・'):''}${it.sock&&it.sock.length?'　'+it.sock.map(k=>k?STONES[k].n:'◇').join(''):''}${it.leg?'<br><span style="color:#ffa040">★'+LEG[it.leg].d+'</span>':''}`;
const price=it=>Math.round((8+it.ilv*6)*RAR[it.rar].m+it.plus*20);
const W8={atkP:2,defP:1.5,magP:.4,resP:.8,mhpP:1.5,spd:8,crit:2,weakDmg:.8,startAG:.8,awDmg:.6,spGain:1,drop:.5};
function score(it,id){if(it.unid)return-1e9;const b=itemBase(it);const mg=MAG(id);let s=(b.atk||0)*(mg?.15:1.2)+(b.def||0)+(b.res||0)*.6+(b.mag||0)*(mg?1.3:id==='rio'?.4:.1)+(b.mhp||0)*.15+(b.spd||0)*8;
 for(const o of it.ops)s+=o.k==='atkEl'?6:o.v*(mg&&o.k==='atkP'?.2:mg&&o.k==='magP'?2:(W8[o.k]||0));return s+(it.leg?30:0);}
const canEq=(it,id,slot)=>!it.unid&&it.slot===grp(slot)&&(!it.who||it.who===id);
function gear(id){const o={legs:[]};for(const s in G.h[id].eq){const it=G.h[id].eq[s]&&findItem(G.h[id].eq[s]);if(!it)continue;const b=itemBase(it);
 for(const k in b)o[k]=(o[k]||0)+b[k];for(const op of it.ops){if(op.k==='atkEl')o.atkEl=op.v;else o[op.k]=(o[op.k]||0)+op.v;}(it.sock||[]).forEach(k=>{if(k)for(const[a,v]of Object.entries(STONES[k].v))o[a]=(o[a]||0)+v;});if(it.leg)o.legs.push(it.leg);if(it.set){o._s=o._s||{};o._s[it.set]=(o._s[it.set]||0)+1;}}for(const k in o._s||{}){const S=SETS[k],n=o._s[k],add=v=>{for(const a in v)o[a]=(o[a]||0)+v[a];};if(n>=2)add(S.b2);if(n>=4)add(S.b4);}return o;}
function addLoot(it){if(G.set.autoSell&&it.rar===0&&!it.unid){G.gold+=price(it);return`<span style="color:#888">${it.name}（自動売却）</span>`;}
 if(G.inv.length>=invCap()){G.gold+=price(it);return`${iname(it)}（持ち物がいっぱいで売却）`;}G.inv.push(it);return ihtml(it);}
function equip(id,slot,uid){const o=uid&&eqBy(uid);if(o)for(const s in G.h[o].eq)if(G.h[o].eq[s]===uid)G.h[o].eq[s]=null;G.h[id].eq[slot]=uid;}
function bestEquip(id){for(const s of SLOTS6)G.h[id].eq[s]=null;
 for(const s of SLOTS6){const used=new Set(G.members.flatMap(m=>Object.values(G.h[m].eq)));
  const c=G.inv.filter(it=>canEq(it,id,s)&&!used.has(it.uid)).sort((a,b)=>score(b,id)-score(a,id))[0];if(c)G.h[id].eq[s]=c.uid;}}
const DISM=[{haiseki:1},{haiseki:2},{kiba:1,haiseki:2},{kakera:1},{kakera:3}];
function migrate(g){g.tower=g.tower||{cp:1,cur:1,max:0};g.tou=g.tou||0;g.fac=Object.assign({bar:1,smith:1,eye:1,shop:1,tower:1,store:1,garden:0},g.fac||{});g.garden=g.garden||{last:g.sorties||0,n:0};g.stones=g.stones||{};(g.inv||[]).forEach(i=>{if(!i.sock)i.sock=Array(i.rar>=3?2:i.rar>=2?1:0).fill(null);});g.members=g.members||['rio','gald'];g.party=g.party||['rio','gald'];g.inv=g.inv||[];g.uid=g.uid||0;g.set=g.set||{autoSell:false};g.sorties=g.sorties||0;G=g;
 for(const id of g.members){const h=g.h[id];h.board=h.board||['0,0'];h.jobs=h.jobs||{};h.pass=h.pass||[];if(h.job===undefined)h.job=null;if(!h.eq){h.eq={w:null,sub:null,head:null,body:null,acc1:null,acc2:null};
  const w=fixedItem('w',id,h.w&&/tetsu|tettai/.test(h.w)?3:1);g.inv.push(w);h.eq.w=w.uid;
  if(h.a){const a=fixedItem('body',null,h.a==='munaate'?3:1);g.inv.push(a);h.eq.body=a.uid;}delete h.w;delete h.a;}}
 return g;}

/* ===== 星盤 ===== */
Object.assign(SK,{
 shiden:{n:'紫電一閃',sp:30,el:'雷',k:'phys',pow:2,t:'one',w:.7,d:'雷の高速斬撃。次の手番が早い'},
 kibou:{n:'希望の灯',sp:35,k:'healAll',pow:.25,t:'self',d:'味方全員のHP25%回復'},
 gansai:{n:'岩砕き',sp:30,el:'打',k:'phys',pow:1.1,t:'all',d:'打属性・敵全体'},
 ikari:{n:'怒りの一撃',sp:35,el:'打',k:'phys',pow:2.3,t:'one',d:'打撃の大技・単体'},
 nidan:{n:'二段斬り',sp:20,el:'斬',k:'phys',pow:.85,hits:2,t:'one',d:'斬撃2回'},
 reppu:{n:'烈風斬',sp:25,el:'斬',k:'phys',pow:1.5,t:'one',d:'斬属性の斬撃'},
 kabau:{n:'かばう',sp:10,k:'taunt',guard:1,t:'self',d:'挑発＋防御'},
 teppeki:{n:'鉄壁',sp:25,k:'guardRegen',t:'self',d:'防御し、HP15%回復'},
 cure:{n:'ケアル',sp:15,k:'heal',pow:.3,t:'ally',d:'味方のHP30%回復'},
 recover:{n:'リカバー',sp:30,k:'healAll',pow:.2,t:'self',d:'味方全員のHP20%回復'},
 hikariya:{n:'光の矢',sp:15,el:'陽',k:'phys',pow:1.25,t:'one',d:'陽属性の射撃'},
 tsuchiya:{n:'地の矢',sp:15,el:'打',k:'phys',pow:1.25,t:'one',d:'打属性の射撃'}});
const HEXD=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
const SBASE={atkP:4,defP:4,mhpP:5,resP:4,magP:5,spd:.3,crit:3,weakDmg:8,startAG:8,awDmg:10,spGain:3};
const BDEF={
 rio:{star:'灯火座',sec:[['atkP'],['spd','crit'],['weakDmg','startAG'],['defP'],['mhpP'],['resP','magP']],mask:['2,-3','-1,-2','-3,2','1,2'],
  sp:{'2,-2':{t:'skill',v:'shiden'},'-2,2':{t:'skill',v:'kibou'},'0,-3':{t:'aw',v:{awTurn:1},d:'星臨の行動回数+1'},'3,-3':{t:'aw',v:{noRecoil:1},d:'星臨の反動を無効'},
   '3,0':{t:'fork',g:1,v:{atkP:12},d:'剛星：攻撃+12%'},'0,3':{t:'fork',g:1,v:{mhpP:15},d:'柔星：最大HP+15%'},
   '-3,0':{t:'fork',g:2,v:{awDmg:20},d:'烈星：星臨中与ダメ+20%'},'-3,3':{t:'fork',g:2,v:{weakDmg:20},d:'狙星：弱点ダメ+20%'}}},
 gald:{star:'城塞座',sec:[['atkP'],['defP'],['mhpP'],['resP'],['startAG','spGain'],['crit']],mask:['3,-1','-2,-1','-2,3','2,1'],
  sp:{'2,-2':{t:'skill',v:'gansai'},'-2,2':{t:'skill',v:'ikari'},'0,-3':{t:'aw',v:{awTurn:1},d:'星臨の行動回数+1'},'3,-3':{t:'aw',v:{storeUp:30},d:'蓄積効率+30%'},
   '3,0':{t:'fork',g:1,v:{atkP:12},d:'攻城：攻撃+12%'},'0,3':{t:'fork',g:1,v:{defP:15},d:'堅城：防御+15%'},
   '-3,0':{t:'fork',g:2,v:{startAG:25},d:'先陣：開始時AG+25'},'-3,3':{t:'fork',g:2,v:{spGain:8},d:'闘志：BP回復力+8（5ごとに毎ターンのBP回復+1）'}}}};
const hexDist=(q,r)=>(Math.abs(q)+Math.abs(r)+Math.abs(q+r))/2;
function buildBoard(id){const d=BDEF[id],N={};
 for(let q=-3;q<=3;q++)for(let r=-3;r<=3;r++){const ring=hexDist(q,r),k=q+','+r;if(ring>3||d.mask.includes(k))continue;
  if(!ring){N[k]={k,q,r,t:'core',cost:0,d:d.star+'の中心（星片）'};continue;}
  if(d.sp[k]){const s=d.sp[k];N[k]=Object.assign({k,q,r,cost:s.t==='skill'?2:3},s);if(s.t==='skill')N[k].d='技「'+SK[s.v].n+'」を習得：'+SK[s.v].d;continue;}
  const x=Math.sqrt(3)*(q+r/2),y=1.5*r;let a=Math.atan2(-y,x);if(a<0)a+=2*Math.PI;const sec=Math.round(a/(Math.PI/3))%6;
  const op=d.sec[sec],st=op[Math.abs(q*3+r*5)%op.length];let v=SBASE[st]*[0,1,1.3,1.6][ring];v=st==='spd'?+v.toFixed(1):Math.round(v);
  N[k]={k,q,r,t:'stat',cost:ring===3?2:1,v:{[st]:v},d:`${OPS[st][0]}+${v}${OPS[st][1]==='%'?'%':''}`};}
 return N;}
const BOARD={rio:buildBoard('rio'),gald:buildBoard('gald')};
const ptsTotal=id=>3+(G.h[id].lv-1)*3;
const ptsLeft=id=>ptsTotal(id)-G.h[id].board.reduce((a,k)=>a+(BOARD[id][k]?BOARD[id][k].cost:0),0);
function canUnlock(id,k){const N=BOARD[id],n=N[k],U=G.h[id].board;if(!n||U.includes(k))return false;
 if(n.t==='fork'&&U.some(u=>N[u]&&N[u].g===n.g&&N[u].t==='fork'))return false;
 return HEXD.some(([dq,dr])=>U.includes((n.q+dq)+','+(n.r+dr)));}
function bonus(id){const o={},add=v=>{for(const k in v)o[k]=(o[k]||0)+v[k];};
 G.h[id].board.forEach(k=>{const n=BOARD[id][k];if(n&&n.v&&n.t!=='skill')add(n.v);});return o;}
function skillList(id){const h=G.h[id],s=[...HB[id].skills];h.board.forEach(k=>{const n=BOARD[id][k];if(n&&n.t==='skill')s.push(n.v);});return s;}
function autoUnlock(id){let n=0;for(;;){const c=Object.keys(BOARD[id]).filter(k=>canUnlock(id,k)&&BOARD[id][k].cost<=ptsLeft(id));if(!c.length)break;
 const sc=k=>{const nd=BOARD[id][k];if(nd.t==='skill')return 25;if(nd.t==='aw')return 22;let s=0;for(const x in nd.v)s+=nd.v[x]*(W8[x]||1);return s/nd.cost;};
 c.sort((a,b)=>sc(b)-sc(a));G.h[id].board.push(c[0]);n++;}return n;}

/* --- 星盤画面 --- */
let BS={id:'rio',sel:null};
const BSTAR=(()=>{const c=document.createElement('canvas');c.width=W;c.height=224;const g=c.getContext('2d'),R=rng(5);g.fillStyle='#070914';g.fillRect(0,0,W,224);
 for(let i=0;i<120;i++){g.fillStyle=['#2a3060','#3a4078','#8890c0','#fff'][R()*4|0];g.fillRect(R()*W|0,R()*224|0,1,1);}return c;})();
const NCOL={core:'#fff3b0',stat:'#7fb6ff',skill:'#7dffa8',aw:'#ff7a7a',fork:'#c08cff'};
const npos=n=>[90+13*Math.sqrt(3)*(n.q+n.r/2),H/2+13*1.5*n.r];
const bcv=$('#bcv'),bctx=bcv.getContext('2d');
const SHORT={atkP:'攻',defP:'防',mhpP:'HP',resP:'精',magP:'魔',spd:'速',crit:'会',weakDmg:'弱',startAG:'AG',awDmg:'覚',spGain:'BP'};
const BGS=Array.from({length:90},(_,i)=>{const f=v=>v-Math.floor(v);return[f(Math.sin(i*99.7)*1e4),f(Math.sin(i*31.3)*1e4),f(Math.sin(i*7.1)*1e4)];});
/* 星盤の表示の高さ（CSS px）。ver0.21 で画面の高さに合わせて変える */
function BCH(){}/* 未使用：js/v21.js が置き換え */
function sizeBoard(){const d=window.devicePixelRatio||1;bcv.width=W*SC*d;bcv.height=Math.round(BCH()*d);bcv.style.width=W*SC+'px';bcv.style.height=BCH()+'px';bctx.setTransform(d,0,0,d,0,0);}
function bpos(){}/* 未使用：js/v21.js が置き換え */
function hexPath(c,x,y,r){c.beginPath();for(let i=0;i<6;i++){const a=Math.PI/180*(60*i-30);c.lineTo(x+r*Math.cos(a),y+r*Math.sin(a));}c.closePath();}
const shade=h=>{const n=parseInt(h.slice(1),16);return`rgb(${(n>>16)*.4|0},${(n>>8&255)*.4|0},${(n&255)*.4|0})`;};
function drawBoard(){}/* 未使用：js/ver17.js が置き換え */
function openBoard(id,m){show('board');setH(224);sizeBoard();BS.id=id;if(!BOARD[id][BS.sel])BS.sel=null;boardMenu(m);}
function boardMenu(){}/* 未使用：js/ver17.js が置き換え */
function boardTap(x,y){const N=BOARD[BS.id];let best=null,bd=1e9;for(const k in N){const[nx,ny,s]=bpos(N[k]),d=Math.hypot(nx-x,ny-y);if(d<s*.8&&d<bd){bd=d;best=k;}}if(best){BS.sel=best;SFX.sel();boardMenu();}}
