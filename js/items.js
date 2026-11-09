/* ===== 装備（ハクスラ） ===== */
const RAR=[{n:'コモン',c:'#d8d8d8',m:1},{n:'アンコモン',c:'#6fdc7f',m:2},{n:'レア',c:'#6fb2ff',m:4},{n:'エピック',c:'#c08cff',m:8},{n:'レジェンド',c:'#ffa040',m:16}];
const SLOTN={w:'武器',sub:'副装備',head:'頭',body:'体',acc1:'装飾1',acc2:'装飾2'};
const SLOTS6=['w','sub','head','body','acc1','acc2'];
const OPS={atkP:['攻撃','%',3,10],defP:['防御','%',3,10],magP:['魔力','%',3,10],resP:['精神','%',3,10],mhpP:['最大HP','%',4,12],spd:['素早さ','+',.3,1.2],
 crit:['会心率','%',2,8],weakDmg:['弱点ダメ','%',8,25],startAG:['開始時AG','+',8,25],awDmg:['覚醒中与ダメ','%',8,30],spGain:['攻撃時SP','+',3,10],drop:['ドロップ率','%',3,10]};
const LEG={koukagari:{n:'流星の後篝',slot:'acc',d:'覚醒が解けるときAG50を残す'},shokei:{n:'処刑人の刃',slot:'w',who:'rio',d:'ブレイク中の敵への与ダメ×2.0'},futago:{n:'双子星の首飾り',slot:'acc',d:'共鳴技の威力2倍'}};
const BN={atk:'攻',def:'防',res:'精',mag:'魔',mhp:'HP',spd:'速'};
const MATL=l=>l<=2?'銅':l<=5?'鉄':l<=9?'鋼':'星鋼';
const grp=s=>s.startsWith('acc')?'acc':s;
function wbase(it,ilv,m){if(it.who==='jin'){it.base={atk:Math.round(6+ilv*2.5)};it.name=m+'の爪';return;}if(it.who==='mire'){it.base={mag:Math.round(5+ilv*2.6)};it.name=m+'の魔導書';}else if(it.who==='noah'){it.base={mag:Math.round(4+ilv*2.4)};it.name=m+'の杖';}else if(it.who==='hakua'){it.base={atk:Math.round(6+ilv*2.6)};it.name=m+'の手甲';}else if(it.who==='crow'){it.base={mag:Math.round(4+ilv*2.5)};it.name=m+'の大鎌';}else if(it.who==='erna'){it.base={atk:Math.round(5+ilv*2.4)};it.name=m+'の弓';}else if(it.who==='balza'){it.base={atk:Math.round(7+ilv*2.8)};it.name=m+'の斧';}else if(it.who==='shion'){it.base={atk:Math.round(5+ilv*2.3)};it.name=m+'の双剣';}else{it.base={atk:Math.round(it.who==='rio'?5+ilv*2.4:7+ilv*2.7)};it.name=m+'の'+(it.who==='rio'?'剣':'大剣');}}
function rollRar(minR,bonus){const r=Math.random()*100/(1+bonus);return Math.max(minR,r<.5?4:r<5?3:r<17?2:r<45?1:0);}
function genItem(ilv,minR=0,bonus=0,slot=null,rarFix=null){
 const rar=rarFix!=null?rarFix:rollRar(minR,bonus);
 if(!slot){const r=Math.random();slot=r<.28?'w':r<.4?'sub':r<.58?'head':r<.78?'body':'acc';}
 const it={uid:++G.uid,slot,ilv,rar,plus:0,ops:[],unid:rar>=3,lock:false,base:{}};
 if(rar===4){const al=Object.keys(LEG).filter(k=>!LEG[k].uq),ks=al.filter(k=>LEG[k].slot===slot);it.leg=ks.length?ks[Math.random()*ks.length|0]:al[Math.random()*al.length|0];it.slot=slot=LEG[it.leg].slot;}
 const m=MATL(ilv);
 if(slot==='w'){it.who=(it.leg&&LEG[it.leg].who)||G.members[Math.random()*G.members.length|0];wbase(it,ilv,m);}
 else if(slot==='sub'){if(Math.random()<.5){it.base.def=Math.round(3+ilv*1.1);it.name=m+'の小盾';}else{it.base.res=Math.round(3+ilv*1.2);it.name='灯の護符';}}
 else if(slot==='head'){it.base.def=Math.round(2+ilv*.9);it.name=m+(Math.random()<.5?'の兜':'の額当て');}
 else if(slot==='body'){it.base.def=Math.round(4+ilv*1.6);it.name=m+'の鎧';}
 else{const r=Math.random();if(r<.4){it.base.mhp=Math.round(12+ilv*5);it.name='生命の指輪';}else if(r<.6){it.base.spd=+(.3+ilv*.06).toFixed(1);it.name='疾風の指輪';}
  else if(r<.8){it.base.mag=Math.round(2+ilv*1.2);it.name='魔石の首飾り';}else{it.base.res=Math.round(2+ilv*1.2);it.name='星砂の首飾り';}}
 if(it.leg)it.name=LEG[it.leg].n;
 for(let i=0;i<rar;i++){
  if(Math.random()<.12&&!it.ops.some(o=>o.k==='atkEl')){it.ops.push({k:'atkEl',v:['光','地','打'][Math.random()*3|0]});continue;}
  const av=Object.keys(OPS).filter(k=>!it.ops.some(o=>o.k===k)),k=av[Math.random()*av.length|0],[,,a,b]=OPS[k];
  let v=(a+(b-a)*Math.random())*(.6+.4*Math.min(1,ilv/10))*(1+rar*.08);it.ops.push({k,v:k==='spd'?+v.toFixed(1):Math.max(1,Math.round(v))});}
 it.sock=Array(it.rar>=3?2:it.rar>=2?1:0).fill(null);return it;}
function fixedItem(slot,who,ilv,name){const it=genItem(ilv,0,0,slot,0);if(who&&slot==='w'){it.who=who;wbase(it,ilv,MATL(ilv));}if(name)it.name=name;return it;}
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

/* ===== 星盤・ジョブ ===== */
Object.assign(SK,{
 shiden:{n:'紫電一閃',sp:30,el:'雷',k:'phys',pow:2,t:'one',w:.7,d:'雷の高速斬撃。次の手番が早い'},
 kibou:{n:'希望の灯',sp:35,k:'healAll',pow:.25,t:'self',d:'味方全員のHP25%回復'},
 gansai:{n:'岩砕き',sp:30,el:'地',k:'phys',pow:1.1,t:'all',d:'地属性・敵全体'},
 ikari:{n:'怒りの一撃',sp:35,el:'打',k:'phys',pow:2.3,t:'one',d:'打撃の大技・単体'},
 nidan:{n:'二段斬り',sp:20,el:'斬',k:'phys',pow:.85,hits:2,t:'one',d:'斬撃2回'},
 reppu:{n:'烈風斬',sp:25,el:'風',k:'phys',pow:1.5,t:'one',d:'風属性の斬撃'},
 kabau:{n:'かばう',sp:10,k:'taunt',guard:1,t:'self',d:'挑発＋防御'},
 teppeki:{n:'鉄壁',sp:25,k:'guardRegen',t:'self',d:'防御し、HP15%回復'},
 cure:{n:'ケアル',sp:15,k:'heal',pow:.3,t:'ally',d:'味方のHP30%回復'},
 recover:{n:'リカバー',sp:30,k:'healAll',pow:.2,t:'self',d:'味方全員のHP20%回復'},
 hikariya:{n:'光の矢',sp:15,el:'光',k:'phys',pow:1.25,t:'one',d:'光属性の射撃'},
 tsuchiya:{n:'地の矢',sp:15,el:'地',k:'phys',pow:1.25,t:'one',d:'地属性の射撃'}});
const JOBS={kenshi:{n:'剣士',d:'物理で押し切る',sk:[[1,'nidan'],[4,'reppu']],ps:[[7,{atkP:8},'攻撃+8%'],[10,{crit:5},'会心率+5%']]},
 juukishi:{n:'重騎士',d:'仲間を守る',sk:[[1,'kabau'],[4,'teppeki']],ps:[[7,{defP:10},'防御+10%'],[10,{mhpP:10},'最大HP+10%']]},
 iyashi:{n:'癒し手',d:'回復と支援',sk:[[1,'cure'],[4,'recover']],ps:[[7,{resP:10},'精神+10%'],[10,{spGain:5},'攻撃時SP+5']]},
 kariudo:{n:'狩人',d:'弱点を射抜く',sk:[[1,'hikariya'],[3,'tsuchiya']],ps:[[7,{weakDmg:15},'弱点ダメ+15%'],[10,{brkPlus:1},'ブレイク削り+1']]}};
const jobNext=l=>4+l*3;
const HEXD=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
const SBASE={atkP:4,defP:4,mhpP:5,resP:4,magP:5,spd:.3,crit:3,weakDmg:8,startAG:8,awDmg:10,spGain:3};
const BDEF={
 rio:{star:'灯火座',sec:[['atkP'],['spd','crit'],['weakDmg','startAG'],['defP'],['mhpP'],['resP','magP']],mask:['2,-3','-1,-2','-3,2','1,2'],
  sp:{'2,-2':{t:'skill',v:'shiden'},'-2,2':{t:'skill',v:'kibou'},'0,-3':{t:'aw',v:{awTurn:1},d:'覚醒の行動回数+1'},'3,-3':{t:'aw',v:{noRecoil:1},d:'覚醒の反動を無効'},
   '3,0':{t:'fork',g:1,v:{atkP:12},d:'剛星：攻撃+12%'},'0,3':{t:'fork',g:1,v:{mhpP:15},d:'柔星：最大HP+15%'},
   '-3,0':{t:'fork',g:2,v:{awDmg:20},d:'烈星：覚醒中与ダメ+20%'},'-3,3':{t:'fork',g:2,v:{weakDmg:20},d:'狙星：弱点ダメ+20%'}}},
 gald:{star:'城塞座',sec:[['atkP'],['defP'],['mhpP'],['resP'],['startAG','spGain'],['crit']],mask:['3,-1','-2,-1','-2,3','2,1'],
  sp:{'2,-2':{t:'skill',v:'gansai'},'-2,2':{t:'skill',v:'ikari'},'0,-3':{t:'aw',v:{awTurn:1},d:'覚醒の行動回数+1'},'3,-3':{t:'aw',v:{storeUp:30},d:'蓄積効率+30%'},
   '3,0':{t:'fork',g:1,v:{atkP:12},d:'攻城：攻撃+12%'},'0,3':{t:'fork',g:1,v:{defP:15},d:'堅城：防御+15%'},
   '-3,0':{t:'fork',g:2,v:{startAG:25},d:'先陣：開始時AG+25'},'-3,3':{t:'fork',g:2,v:{spGain:8},d:'闘志：攻撃時SP+8'}}}};
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
function learned(id){const h=G.h[id],o=[];if(h.job){const J=JOBS[h.job],lv=h.jobs[h.job].lv;J.ps.forEach(([l,v,d],i)=>{if(lv>=l)o.push(h.job+':'+i);});}
 h.pass.forEach(p=>{if(!o.includes(p))o.push(p);});return o;}
function bonus(id){const o={},add=v=>{for(const k in v)o[k]=(o[k]||0)+v[k];};
 G.h[id].board.forEach(k=>{const n=BOARD[id][k];if(n&&n.v&&n.t!=='skill')add(n.v);});
 learned(id).forEach(p=>{const[j,i]=p.split(':');add(JOBS[j].ps[i][1]);});return o;}
function skillList(id){const h=G.h[id],s=[...HB[id].skills];h.board.forEach(k=>{const n=BOARD[id][k];if(n&&n.t==='skill')s.push(n.v);});
 if(h.job){const lv=h.jobs[h.job].lv;JOBS[h.job].sk.forEach(([l,k])=>{if(lv>=l&&!s.includes(k))s.push(k);});}return s;}
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
const SHORT={atkP:'攻',defP:'防',mhpP:'HP',resP:'精',magP:'魔',spd:'速',crit:'会',weakDmg:'弱',startAG:'AG',awDmg:'覚',spGain:'SP'};
const BGS=Array.from({length:90},(_,i)=>{const f=v=>v-Math.floor(v);return[f(Math.sin(i*99.7)*1e4),f(Math.sin(i*31.3)*1e4),f(Math.sin(i*7.1)*1e4)];});
function sizeBoard(){const d=window.devicePixelRatio||1;bcv.width=W*SC*d;bcv.height=224*SC*d;bcv.style.width=W*SC+'px';bcv.style.height=224*SC+'px';bctx.setTransform(d,0,0,d,0,0);}
function bpos(n){const cw=W*SC,s=cw/(Math.sqrt(3)*7.4);return[cw/2+s*Math.sqrt(3)*(n.q+n.r/2),224*SC/2+18+s*1.5*n.r,s];}
function hexPath(c,x,y,r){c.beginPath();for(let i=0;i<6;i++){const a=Math.PI/180*(60*i-30);c.lineTo(x+r*Math.cos(a),y+r*Math.sin(a));}c.closePath();}
const shade=h=>{const n=parseInt(h.slice(1),16);return`rgb(${(n>>16)*.4|0},${(n>>8&255)*.4|0},${(n&255)*.4|0})`;};
function drawBoard(){const c=bctx,cw=W*SC,ch=224*SC,id=BS.id,N=BOARD[id],U=G.h[id].board;
 const bg=c.createRadialGradient(cw/2,ch/2,20,cw/2,ch/2,ch*.75);bg.addColorStop(0,'#1c2150');bg.addColorStop(1,'#05060f');c.fillStyle=bg;c.fillRect(0,0,cw,ch);
 BGS.forEach(([x,y,b],i)=>{c.fillStyle=`rgba(200,210,255,${.2+.5*b*(.6+.4*Math.sin(tick/30+i))})`;c.fillRect(x*cw,y*ch,1.5,1.5);});
 c.lineCap='round';
 for(const k in N){const n=N[k],[ax,ay]=bpos(n);for(const[dq,dr]of HEXD){const k2=(n.q+dq)+','+(n.r+dr);if(!N[k2]||k2<k)continue;const[bx,by]=bpos(N[k2]),on=U.includes(k)&&U.includes(k2);
  if(on){c.strokeStyle='rgba(255,214,110,.95)';c.lineWidth=3;c.shadowColor='#ffcf5a';c.shadowBlur=10;}else{c.strokeStyle='rgba(120,135,210,.2)';c.lineWidth=1.5;c.shadowBlur=0;}
  c.beginPath();c.moveTo(ax,ay);c.lineTo(bx,by);c.stroke();}}
 c.shadowBlur=0;c.textAlign='center';c.textBaseline='middle';
 for(const k in N){const n=N[k],[x,y,s]=bpos(n),on=U.includes(k),av=!on&&canUnlock(id,k),col=NCOL[n.t],r=s*.64;
  hexPath(c,x,y,r);
  if(on){const g=c.createLinearGradient(x,y-r,x,y+r);g.addColorStop(0,col);g.addColorStop(1,shade(col));c.fillStyle=g;c.shadowColor=col;c.shadowBlur=14;c.fill();c.shadowBlur=0;c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=1.5;c.stroke();}
  else if(av){c.fillStyle='#141a3a';c.fill();c.strokeStyle=col;c.globalAlpha=.55+.45*Math.sin(tick/9);c.lineWidth=2.5;c.stroke();c.globalAlpha=1;}
  else{c.fillStyle='#0b0e22';c.fill();c.strokeStyle='#283060';c.lineWidth=1.5;c.stroke();}
  if(BS.sel===k){hexPath(c,x,y,r+5);c.strokeStyle='#fff';c.lineWidth=2;c.stroke();}
  const lab=n.t==='core'?'★':n.t==='skill'?'技':n.t==='aw'?'醒':n.t==='fork'?'分':SHORT[Object.keys(n.v)[0]];
  c.fillStyle=on?'#10142e':av?col:'#4a5288';c.font=`bold ${Math.round(s*.42)}px -apple-system,"Hiragino Sans",sans-serif`;c.fillText(lab,x,y+1);}
 c.textAlign='left';c.textBaseline='alphabetic';c.fillStyle='#ffe27a';c.font='bold 15px -apple-system,"Hiragino Sans",sans-serif';c.fillText(`${HB[id].name}の星盤「${BDEF[id].star}」`,12,24);
 c.fillStyle='#cfd3f5';c.font='13px -apple-system,"Hiragino Sans",sans-serif';c.fillText(`星ポイント 残り ${ptsLeft(id)}　Lv${G.h[id].lv}`,12,44);}
function openBoard(id,m){show('board');setH(224);sizeBoard();BS.id=id;if(!BOARD[id][BS.sel])BS.sel=null;boardMenu(m);}
function boardMenu(m){const id=BS.id,n=BS.sel&&BOARD[id][BS.sel],U=G.h[id].board;
 const info=n?`<b style="color:${NCOL[n.t]}">${{core:'星片',stat:'能力',skill:'技',aw:'覚醒',fork:'分岐（どちらか1つ）'}[n.t]}</b>　${n.d}　<small>必要ポイント${n.cost}・${U.includes(n.k)?'解放済み':canUnlock(id,n.k)?'解放できる':'未接続'}</small>`:'星をタップで詳細。光る輪の星が解放できる。<br><small>青：能力　緑：技　赤：覚醒強化　紫：分岐（どちらか一方）</small>';
 log((m?m+'<br>':'')+info);
 menu([{l:'解放',s:n?`ポイント${n.cost}`:'星を選ぶ',cls:'ready',dis:!n||!canUnlock(id,n.k)||n.cost>ptsLeft(id),f:()=>{U.push(n.k);SFX.aw();save();boardMenu(`<b>${n.d}</b> を解放した！`);}},
  {l:'おまかせ解放',s:'自動で振り分け',f:()=>{const c=autoUnlock(id);if(c)SFX.aw();save();boardMenu(c?`${c}個の星を解放した`:'解放できる星がない（ポイント不足）');}},
  {l:'リセット',s:'無料でやり直し',f:()=>{G.h[id].board=['0,0'];save();boardMenu('星盤をリセットした');}},
  {l:`${HB[nextM(id)].name}の星盤`,f:()=>{BS.sel=null;openBoard(nextM(id));}},
  {l:'ジョブ',s:G.h[id].job?JOBS[G.h[id].job].n:'未設定',f:()=>jobMenu(id)},{l:'覚醒の試練',s:'段階'+ROMAN[G.h[id].awLv||1],cls:'ready',f:()=>{enterTown();trialMenu();}},{l:'戻る',cls:'back',f:()=>enterTown()}]);}
function boardTap(x,y){const N=BOARD[BS.id];let best=null,bd=1e9;for(const k in N){const[nx,ny,s]=bpos(N[k]),d=Math.hypot(nx-x,ny-y);if(d<s*.8&&d<bd){bd=d;best=k;}}if(best){BS.sel=best;SFX.sel();boardMenu();}}
/* --- ジョブ画面 --- */
function jobMenu(id,m){const h=G.h[id];
 log((m?m+'<br>':'')+`<b>${HB[id].name}のサブジョブ</b>：${h.job?JOBS[h.job].n+' Lv'+h.jobs[h.job].lv:'なし'}<br><small>戦闘で経験を積むとジョブLvが上がり技とパッシブを覚える。パッシブはジョブを変えても3つまで持ち出せる</small>`);
 menu([...Object.entries(JOBS).map(([k,J])=>{const js=h.jobs[k]||{lv:1,xp:0};
   return{dis:!!(J.lock&&J.lock()),l:`${J.n} Lv${js.lv}${h.job===k?' ◀':''}`,s:`${J.d}／技：${J.sk.map(([l,s])=>`${SK[s].n}(Lv${l})`).join('・')}／パッシブ：${J.ps.map(([l,,d])=>`${d}(Lv${l})`).join('・')}`,cls:'eq'+(h.job===k?' ready':''),
   f:()=>{h.job=k;h.jobs[k]=h.jobs[k]||{lv:1,xp:0};SFX.sel();save();jobMenu(id,`${J.n}に就いた`);}};}),
  {l:'持ち出しパッシブ',s:`${h.pass.length}/3`,f:()=>passMenu(id)},{l:'戻る',cls:'back',f:()=>openBoard(id)}],true);}
function passMenu(id){const h=G.h[id],all=[];for(const[k,J]of Object.entries(JOBS)){const js=h.jobs[k];if(!js||k===h.job)continue;J.ps.forEach(([l,,d],i)=>{if(js.lv>=l)all.push([k+':'+i,J.n+'：'+d]);});}
 log('<b>持ち出しパッシブ</b>　今のジョブ以外で覚えたパッシブを3つまでON<br>'+(all.length?'':'<small>まだ覚えたパッシブがない（ジョブLv7で習得）</small>'));
 menu([...all.map(([p,d])=>{const on=h.pass.includes(p);return{l:(on?'● ':'○ ')+d,cls:on?'ready':'',dis:!on&&h.pass.length>=3,f:()=>{h.pass=on?h.pass.filter(x=>x!==p):[...h.pass,p];save();passMenu(id);}};}),
  {l:'戻る',cls:'back',f:()=>jobMenu(id)}],true);}
function jobXP(es){const ups=[];for(const id of G.members){const h=G.h[id];if(!h.job)continue;const js=h.jobs[h.job];
 js.xp+=Math.round(es.reduce((a,e)=>a+(ED[e.kind].boss?15:3),0)*(1+.15*(G.fac.tower-1)));while(js.lv<10&&js.xp>=jobNext(js.lv)){js.xp-=jobNext(js.lv);js.lv++;ups.push(`${HB[id].name}の${JOBS[h.job].n}Lv${js.lv}`);}}return ups;}
