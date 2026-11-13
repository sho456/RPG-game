/* ===== ver0.31 天星盤（星盤の上位版）・極技・新しいパッシブ =====
 1. 天星盤：Lv60 から開く、半径4の大きな星盤。Lv60 を超えた Lv1 ごとに天星ポイント+4、限界突破 1 回ごとに +10
    ・能力の星：通常の星盤よりずっと大きな上がり幅（外周ほど大きい）
    ・極の星：与ダメ・技の威力・会心ダメ・被ダメ軽減（新しい能力値）
    ・技の星：キャラごとの「極技」2 種
    ・星臨の星：星臨の行動回数・星臨中の与ダメ
    ・パッシブの星：天星パッシブ。外周の 2 か所の分岐で、それぞれ 2 つのうち 1 つを選ぶ
 2. キャラ専用パッシブを Lv60・Lv90 に 1 つずつ追加（各キャラ 4 つに）
 3. 技の強化：Lv60 を超えると技の威力が Lv ごとに +1.5%（v31/core.js）。極技は既存の技の 2〜3 倍の威力 */
'use strict';
const V31B=(()=>{
const{esc,fm,lbStage,capOf}=V31;
/* ---------- 極技 ---------- */
const XSK={
 x_rio1:{n:'天灯星斬',sp:45,el:'光',k:'phys',pow:4.2,t:'one',d:'光の極大斬撃・単体'},
 x_rio2:{n:'極光流星群',sp:55,el:'光',k:'phys',pow:.85,hits:3,t:'all',d:'光の3連撃・敵全体'},
 x_gald1:{n:'天崩撃',sp:40,el:'地',k:'phys',pow:3.6,t:'one',fx20:[{on:'t',k:'def',v:-30,t:3}],d:'地の極大打撃＋敵の防御-30%（3ターン）'},
 x_gald2:{n:'不落の聖壁',sp:45,k:'sup20',t:'self',fx20:[{on:'allies',k:'prot',v:35,t:3},{on:'self',k:'counter',v:1.5,t:3}],taunt20:3,d:'味方全員の被ダメ-35%（3ターン）＋3ターン挑発・反撃態勢',role:'guard'},
 x_mire1:{n:'ノヴァ・インフェルノ',sp:55,el:'炎',k:'mag',pow:2.6,t:'all',d:'炎の極大魔法・敵全体'},
 x_mire2:{n:'アブソリュート・ゼロ',sp:50,el:'氷',k:'mag',pow:4.6,t:'one',fx20:[{on:'t',k:'stun',v:1,t:1,p:.3}],d:'氷の極大魔法・単体＋30%で凍結'},
 x_shion1:{n:'瞬影千刃',sp:50,el:'風',k:'phys',pow:.62,hits:7,t:'one',d:'風の7連撃・単体'},
 x_shion2:{n:'影縫・極',sp:45,el:'斬',k:'phys',pow:2.2,t:'all',delay:40,d:'斬撃・敵全体＋行動を遅らせる'},
 x_noah1:{n:'天使の福音',sp:50,k:'sup20',t:'self',heal20:.6,cleanse20:1,fx20:[{on:'allies',k:'regen',v:.08,t:3}],d:'味方全員のHP60%回復・弱体解除＋継続回復（3ターン）',role:'heal'},
 x_noah2:{n:'ジャッジメント',sp:50,el:'光',k:'mag',pow:3,t:'all',d:'光の極大魔法・敵全体'},
 x_erna1:{n:'天穿雷霆',sp:50,el:'雷',k:'phys',pow:4.6,t:'one',pierce20:.5,d:'雷の極大射撃・単体。防御を半分無視'},
 x_erna2:{n:'流星雨',sp:50,el:'雷',k:'phys',pow:.75,hits:3,t:'all',d:'雷の矢の雨・敵全体に3連撃'},
 x_balza1:{n:'灼熱の鉄槌',sp:45,el:'炎',k:'phys',pow:5,t:'one',w:1.3,d:'炎の極大打撃・単体（次の手番が遅い）'},
 x_balza2:{n:'炉心解放',sp:55,el:'炎',k:'phys',pow:2.5,t:'all',self20:[{k:'atk',v:30,t:3}],d:'炎・敵全体＋自分の攻撃+30%（3ターン）'},
 x_crow1:{n:'冥王の審判',sp:55,el:'闇',k:'mag',pow:2.8,t:'all',fx20:[{on:'t',k:'poison',v:.06,t:3,p:.6}],d:'闇の極大魔法・敵全体＋60%で毒'},
 x_crow2:{n:'魂葬',sp:50,el:'闇',k:'mag',pow:4.4,t:'one',drain:.3,d:'闇の極大魔法・単体。与ダメの30%を吸収'},
 x_hakua1:{n:'氷華千連',sp:50,el:'氷',k:'phys',pow:.45,hits:10,t:'one',d:'氷の10連撃・単体'},
 x_hakua2:{n:'絶対零拳',sp:45,el:'氷',k:'phys',pow:4,t:'one',fx20:[{on:'t',k:'stun',v:1,t:1,p:.5}],d:'氷の極大拳撃＋50%で凍結'},
 x_jin1:{n:'獣王天翔',sp:50,el:'風',k:'phys',pow:2.3,t:'all',d:'風・敵全体の大技'},
 x_jin2:{n:'ポポ・メテオ',sp:45,el:'地',k:'phys',pow:4.4,t:'one',d:'ポポと地の極大突撃・単体'},
 x_celes1:{n:'時空断裂',sp:50,el:null,k:'mag',pow:4.2,t:'one',d:'時の極大魔法・単体'},
 x_celes2:{n:'永劫の刻',sp:50,k:'sup20',t:'self',fx20:[{on:'allies',k:'spd',v:40,t:3},{on:'allies',k:'atk',v:20,t:3},{on:'allies',k:'mag',v:20,t:3}],ct20:.5,d:'味方全員の素早さ+40%・攻撃/魔力+20%（3ターン）',role:'buff'},
 x_valk1:{n:'竜王滅炎',sp:55,el:'炎',k:'phys',pow:2.6,t:'all',d:'炎・敵全体の大技'},
 x_valk2:{n:'黒竜断',sp:50,el:'闇',k:'phys',pow:4.8,t:'one',d:'闇の極大斬撃・単体'}};
for(const k in XSK)XSK[k].x31=1;
Object.assign(SK,XSK);
try{TERMS.reset();}catch(e){}

/* ---------- 天星パッシブ（V20 のパッシブの仕組みに乗せる） ---------- */
const isWeak=(t,sk)=>t&&t.weak&&sk&&sk.el&&t.weak.includes(sk.el);
const TP={
 tp_tengeki:{n:'天撃',d:'HPが満タンのとき与ダメ+40%',out:a=>a.hp>=a.mhp?1.4:1},
 tp_hakai:{n:'破壊衝動',d:'弱点を突いた攻撃の与ダメ+35%',out:(a,t,sk)=>isWeak(t,sk)?1.35:1},
 tp_rensei:{n:'連星',d:'技を使うとSP+12',acted:(u,sk)=>{if(sk&&!sk.basic&&sk.sp)u.sp=Math.min(100,u.sp+12);}},
 tp_seigo:{n:'星護',d:'戦闘開始時、最大HP30%の障壁を張る',start:u=>V20.addSt(u,'shield',Math.round(u.mhp*.3),99)},
 tp_fukutsu:{n:'不屈の星',d:'HP50%以下のとき受けるダメージ-35%',inc:t=>t.hp<=t.mhp*.5?.65:1},
 tp_kakusei:{n:'覚醒の灯',d:'星臨中の与ダメ+50%',out:a=>a.aw?1.5:1},
 tp_senkou:{n:'先手必勝',d:'戦闘開始時AG+40・素早さ+25%（3ターン）',start:u=>{if(!u.aw)u.ag=Math.min(100,u.ag+40);V20.addSt(u,'spd',25,3);}},
 tp_shimei:{n:'死命',d:'HP30%以下の敵への与ダメ+60%',out:(a,t)=>t.hp<=t.mhp*.3?1.6:1},
 tp_kyuuketsu:{n:'星吸',d:'与ダメの8%をHPとして吸収',hit:(a,t,sk,r,d)=>{if(d>0&&a.hp<a.mhp&&a.alive){a.hp=Math.min(a.mhp,a.hp+Math.max(1,Math.round(d*.08)));}}},
 tp_kaimei:{n:'会心連鎖',d:'会心率+15%。会心が出るとAG+8',critB:()=>15,hit:(a,t,sk,r)=>{if(r&&r.crit&&!a.aw)a.ag=Math.min(100,a.ag+8);}},
 tp_shukufuku:{n:'星の祝福',d:'手番の開始時、味方全員のHPを4%回復',turn:u=>{aliveH().forEach(h=>{if(h.hp<h.mhp){const v=Math.round(h.mhp*.04);h.hp=Math.min(h.mhp,h.hp+v);pop(h,'+'+v,'#7dffa8',true);}});}},
 tp_hangeki:{n:'星の反撃',d:'単体攻撃を受けると35%で反撃（威力1.5）',hurt:(t,a,d,sk)=>{if(a&&a.side===1&&sk&&sk.t==='one'&&d>0&&t.alive&&Math.random()<.35)(B.cq20=B.cq20||[]).push({a:t,t:a,sk:{n:'星の反撃',el:t.atkEl||t.elem||'斬',k:MAG(t.id)?'mag':'phys',pow:1.5,t:'one',_fu:1}});}}};
/* ---------- キャラ専用パッシブ（Lv60・Lv90） ---------- */
const fuQ=(a,t,sk)=>{(B.q20=B.q20||[]).push({a,t,sk:Object.assign({_fu:1},sk)});};
const CP={
 c_rio3:{n:'星継ぐ者',d:'与ダメ+25%。星臨中はさらに+25%',out:a=>a.aw?1.5:1.25},
 c_rio4:{n:'灯火の極致',d:'戦闘開始時、味方全員の攻撃・魔力+25%（4ターン）',start:()=>aliveH().forEach(h=>{V20.addSt(h,'atk',25,4);V20.addSt(h,'mag',25,4);})},
 c_gald3:{n:'金剛不壊',d:'受けるダメージ-25%',inc:()=>.75},
 c_gald4:{n:'城塞の主',d:'戦闘開始時、味方全員に最大HP20%の障壁',start:()=>aliveH().forEach(h=>V20.addSt(h,'shield',Math.round(h.mhp*.2),99))},
 c_mire3:{n:'魔導の深淵',d:'魔法の与ダメ+35%',out:(a,t,sk)=>sk&&sk.k==='mag'?1.35:1},
 c_mire4:{n:'属性支配',d:'弱点を突いた魔法の与ダメ+40%',out:(a,t,sk)=>sk&&sk.k==='mag'&&isWeak(t,sk)?1.4:1},
 c_shion3:{n:'影の極意',d:'素早さ+25%',make:u=>{u.spd=+(u.spd*1.25).toFixed(2);}},
 c_shion4:{n:'千影',d:'単体攻撃のあと40%で追撃（風・威力0.8）',acted:(u,sk)=>{if(sk&&(sk.t==='one'||sk.basic)&&(sk.k==='phys'||sk.basic)){const t=aliveE().sort((a,b)=>a.hp-b.hp)[0];if(t&&Math.random()<.4)fuQ(u,t,{n:'千影',el:'風',k:'phys',pow:.8,t:'one'});}}},
 c_noah3:{n:'大いなる慈愛',d:'手番の開始時、味方全員のHPを5%回復',turn:()=>aliveH().forEach(h=>{if(h.hp<h.mhp){const v=Math.round(h.mhp*.05);h.hp=Math.min(h.mhp,h.hp+v);pop(h,'+'+v,'#7dffa8',true);}})},
 c_noah4:{n:'聖域の守り',d:'戦闘開始時、味方全員の受けるダメージ-25%（4ターン）',start:()=>aliveH().forEach(h=>V20.addSt(h,'prot',25,4))},
 c_erna3:{n:'必中の狙撃',d:'会心率+25%',critB:()=>25},
 c_erna4:{n:'天穿つ雷',d:'雷属性の与ダメ+40%',out:(a,t,sk)=>sk&&sk.el==='雷'?1.4:1},
 c_balza3:{n:'灼熱の炉心',d:'炎属性の与ダメ+40%',out:(a,t,sk)=>sk&&sk.el==='炎'?1.4:1},
 c_balza4:{n:'鋼の肉体',d:'HP50%以上のとき受けるダメージ-25%',inc:t=>t.hp>=t.mhp*.5?.75:1},
 c_crow3:{n:'死神の加護',d:'HP30%以下の敵への与ダメ+60%',out:(a,t)=>t.hp<=t.mhp*.3?1.6:1},
 c_crow4:{n:'魂の収穫',d:'敵を倒すとAG+25・SP+20',kill:a=>{if(!a.aw)a.ag=Math.min(100,a.ag+25);a.sp=Math.min(100,a.sp+20);}},
 c_hakua3:{n:'氷華絢爛',d:'多段攻撃の各撃の与ダメ+30%',out:(a,t,sk)=>sk&&(sk.hits>1||sk.k==='rhythm')?1.3:1},
 c_hakua4:{n:'凍てつく拳',d:'氷属性の与ダメ+40%',out:(a,t,sk)=>sk&&sk.el==='氷'?1.4:1},
 c_jin3:{n:'獣王の血',d:'与ダメ+20%・受けるダメージ-15%',out:()=>1.2,inc:()=>.85},
 c_jin4:{n:'ポポの本気',d:'行動のあと50%でポポが追撃（地・威力1.2）',acted:(u,sk)=>{if(sk&&(sk.k==='phys'||sk.k==='mag'||sk.basic)){const t=aliveE().sort((a,b)=>a.hp-b.hp)[0];if(t&&Math.random()<.5)fuQ(u,t,{n:'ポポの本気',el:'地',k:'phys',pow:1.2,t:'one'});}}},
 c_celes3:{n:'時の支配者',d:'戦闘開始時、味方全員の素早さ+25%（4ターン）',start:()=>aliveH().forEach(h=>V20.addSt(h,'spd',25,4))},
 c_celes4:{n:'刻の加速',d:'魔法の与ダメ+30%',out:(a,t,sk)=>sk&&sk.k==='mag'?1.3:1},
 c_valk3:{n:'竜王の威厳',d:'炎・闇属性の与ダメ+40%',out:(a,t,sk)=>sk&&(sk.el==='炎'||sk.el==='闇')?1.4:1},
 c_valk4:{n:'竜の再生',d:'手番の開始時、HPを最大HPの8%回復',turn:u=>{if(u.hp<u.mhp){const v=Math.round(u.mhp*.08);u.hp=Math.min(u.mhp,u.hp+v);pop(u,'+'+v,'#7dffa8',true);}}}};
Object.assign(V20.PS,TP,CP);
for(const id in V20.CPS){if(!V20.CPS[id].includes('c_'+id+'3'))V20.CPS[id].push('c_'+id+'3','c_'+id+'4');}
if(V20.CP_LV.length<4)V20.CP_LV.push(60,90);

/* ---------- 天星盤 ---------- */
const PSP={rio:[['tp_kakusei','tp_tengeki'],['tp_rensei','tp_seigo']],gald:[['tp_fukutsu','tp_hangeki'],['tp_seigo','tp_shukufuku']],mire:[['tp_hakai','tp_kakusei'],['tp_rensei','tp_kaimei']],
 shion:[['tp_senkou','tp_shimei'],['tp_kaimei','tp_hakai']],noah:[['tp_shukufuku','tp_seigo'],['tp_rensei','tp_fukutsu']],erna:[['tp_tengeki','tp_hakai'],['tp_kaimei','tp_senkou']],
 balza:[['tp_fukutsu','tp_kakusei'],['tp_hangeki','tp_kyuuketsu']],crow:[['tp_shimei','tp_kyuuketsu'],['tp_kakusei','tp_rensei']],hakua:[['tp_hakai','tp_kaimei'],['tp_senkou','tp_kyuuketsu']],
 jin:[['tp_tengeki','tp_hangeki'],['tp_kyuuketsu','tp_senkou']],celes:[['tp_rensei','tp_kakusei'],['tp_senkou','tp_shukufuku']],valk:[['tp_kakusei','tp_kyuuketsu'],['tp_fukutsu','tp_shimei']]};
const SB2={atkP:8,defP:8,mhpP:10,resP:8,magP:8,spd:.6,crit:3,weakDmg:6,startAG:8,awDmg:12,spGain:3,drop:5,dmgP:6,skDmg:10,critDmg:8,dmgCut:4};
const RMUL=[0,1,1.3,1.6,2],RCOST=[0,2,3,4,5];
const MASK2=['1,-4','-1,4','3,1','-3,-1','1,3','-1,-3'];
const EXN={'2,-4':'dmgP','-2,4':'skDmg','4,-2':'critDmg','-4,2':'dmgCut'};
const fmtV=(k,v)=>`${OPS[k]?OPS[k][0]:k}+${v}${OPS[k]&&OPS[k][1]==='%'?'%':''}`;
function build2(id){const d=BDEF[id],N={},ps=PSP[id]||PSP.rio,sk=[`x_${id}1`,`x_${id}2`];
 const SP={'2,-2':{t:'skill',v:sk[0]},'-2,2':{t:'skill',v:sk[1]},'0,-3':{t:'aw',v:{awTurn:1,awDmg:20},d:'星臨の行動回数+1・星臨中与ダメ+20%'},'0,3':{t:'aw',v:{awDmg:40},d:'星臨中与ダメ+40%'},
  '4,-4':{t:'ps',g:1,v:{ps:ps[0][0]}},'4,0':{t:'ps',g:1,v:{ps:ps[0][1]}},'-4,4':{t:'ps',g:2,v:{ps:ps[1][0]}},'-4,0':{t:'ps',g:2,v:{ps:ps[1][1]}}};
 for(let q=-4;q<=4;q++)for(let r=-4;r<=4;r++){const ring=hexDist(q,r),k=q+','+r;if(ring>4||MASK2.includes(k))continue;
  if(!ring){N[k]={k,q,r,t:'core',cost:0,d:'天星盤の中心'};continue;}
  if(SP[k]){const s=SP[k];N[k]=Object.assign({k,q,r},s);
   if(s.t==='skill'){N[k].cost=8;N[k].d=`極技「${SK[s.v].n}」を習得：${SK[s.v].d}`;}
   else if(s.t==='aw')N[k].cost=6;else if(s.t==='ps'){N[k].cost=10;const P=V20.PS[s.v.ps];N[k].d=`天星パッシブ「${P.n}」：${P.d}`;}continue;}
  if(EXN[k]){const st=EXN[k],v=SB2[st]*2;N[k]={k,q,r,t:'ex',cost:8,v:{[st]:v},d:fmtV(st,v)};continue;}
  const x=Math.sqrt(3)*(q+r/2),y=1.5*r;let a=Math.atan2(-y,x);if(a<0)a+=2*Math.PI;const sec=Math.round(a/(Math.PI/3))%6;
  let op=d.sec[sec];if(ring===4&&(q*7+r*3)%3===0)op=['dmgP','skDmg','critDmg'];
  const st=op[Math.abs(q*3+r*5)%op.length];let v=SB2[st]*RMUL[ring];v=st==='spd'?+v.toFixed(1):Math.round(v);
  N[k]={k,q,r,t:'stat',cost:RCOST[ring],v:{[st]:v},d:fmtV(st,v)};}
 return N;}
const BOARD2={};for(const id in BDEF)BOARD2[id]=build2(id);
const OPEN_LV=60;
const b2=id=>{const h=G.h[id];if(!h.board2)h.board2=['0,0'];return h.board2;};
const tenTotal=id=>Math.max(0,G.h[id].lv-(OPEN_LV-1))*4+lbStage(id)*10;
const tenLeft=id=>tenTotal(id)-b2(id).reduce((a,k)=>a+(BOARD2[id][k]?BOARD2[id][k].cost:0),0);
function canUnlock2(id,k){const N=BOARD2[id],n=N[k],U=b2(id);if(!n||U.includes(k))return false;
 if(n.t==='ps'&&U.some(u=>N[u]&&N[u].t==='ps'&&N[u].g===n.g))return false;
 return HEXD.some(([dq,dr])=>U.includes((n.q+dq)+','+(n.r+dr)));}
function auto2(id){let n=0;for(;;){const c=Object.keys(BOARD2[id]).filter(k=>canUnlock2(id,k)&&BOARD2[id][k].cost<=tenLeft(id));if(!c.length)break;
 const sc=k=>{const nd=BOARD2[id][k];if(nd.t==='skill')return 40;if(nd.t==='ps')return 36;if(nd.t==='aw')return 30;if(nd.t==='ex')return 28;let s=0;for(const x in nd.v)s+=nd.v[x]*(W8[x]||1);return s/nd.cost;};
 c.sort((a,b)=>sc(b)-sc(a));b2(id).push(c[0]);n++;}return n;}
/* 能力・技・パッシブへの反映 */
{const _bo=bonus;bonus=function(id){const o=_bo(id);try{const N=BOARD2[id];if(N&&G.h[id].board2)for(const k of G.h[id].board2){const n=N[k];if(n&&n.v&&(n.t==='stat'||n.t==='ex'||n.t==='aw'))for(const x in n.v)o[x]=(o[x]||0)+n.v[x];}}catch(e){console.error(e);}return o;};}
{const _sl=skillList;skillList=function(id){const s=_sl(id);try{const N=BOARD2[id];if(N&&G.h[id].board2)for(const k of G.h[id].board2){const n=N[k];if(n&&n.t==='skill'&&!s.includes(n.v))s.push(n.v);}}catch(e){}return s;};}
const psOf=id=>{const N=BOARD2[id],o=[];if(N&&G.h[id]&&G.h[id].board2)for(const k of G.h[id].board2){const n=N[k];if(n&&n.t==='ps')o.push(n.v.ps);}return o;};
{const _h=hero;hero=function(id){const u=_h(id);try{u.ps20=u.ps20||[];for(const p of psOf(id))if(!u.ps20.some(x=>x.id===p)){u.ps20.push({id:p,v:0});const P=V20.PS[p];if(P&&P.make)P.make(u,0);}}catch(e){console.error(e);}return u;};}
{const _pw=power;power=function(id){const s=stats(id);return Math.round(_pw(id)*(1+(s.dmgP||0)/100)*(1+(s.skDmg||0)/250)*(1+(s.dmgCut||0)/100)+psOf(id).length*400);};}

/* ---------- 天星盤の画面 ---------- */
Object.assign(NCOL,{ps:'#ffb86b',ex:'#ff6fb5'});
try{Object.assign(NTN,{ps:'天星パッシブ',ex:'極'});}catch(e){}
SHORT.ps='極';
const bpos2=n=>{const cw=W*SC,ch=BCH(),top=56,bot=20,av=ch-top-bot,s=Math.min(cw/(Math.sqrt(3)*9.4),av/13.4);return[cw/2+s*Math.sqrt(3)*(n.q+n.r/2),top+av/2+s*1.5*n.r,s];};
BS.up=false;
/* 描画：通常の星盤の描き方を、天星盤のデータに差し替えて使う */
{const _db=drawBoard;drawBoard=function(){if(!BS.up||scene!=='board')return _db();const id=BS.id,h=G.h[id],o={N:BOARD[id],U:h.board,bp:bpos,cu:canUnlock};
 b2(id);BOARD[id]=BOARD2[id];h.board=h.board2;bpos=bpos2;canUnlock=canUnlock2;
 try{_db();}finally{BOARD[id]=o.N;h.board=o.U;bpos=o.bp;canUnlock=o.cu;}
 try{const c=bctx,cw=W*SC;c.fillStyle='rgba(255,184,107,.10)';c.fillRect(0,0,cw,3);}catch(e){}};}
{const _bt=boardTap;boardTap=function(x,y){if(!BS.up)return _bt(x,y);const N=BOARD2[BS.id];let best=null,bd=1e9;for(const k in N){const[nx,ny,s]=bpos2(N[k]),d=Math.hypot(nx-x,ny-y);if(d<s*.8&&d<bd){bd=d;best=k;}}if(best){BS.sel=best;SFX.sel();boardMenu();}};}
const NT2={core:'中心',stat:'能力',skill:'極技',aw:'星臨強化',ps:'天星パッシブ',ex:'極'};
function upMenu(m){const id=BS.id,h=G.h[id],N=BOARD2[id],U=b2(id),n=BS.sel&&N[BS.sel],pl=tenLeft(id),tot=Object.keys(N).length-1,lock=h.lv<OPEN_LV,can=!lock&&n&&canUnlock2(id,n.k)&&n.cost<=pl;
 $('#labels').innerHTML=`<div class="bdh up31" style="--ec:${elCol(id)}"><img src="${art(id)}"><div class="bdn"><small>天星盤「${esc(BDEF[id].star)}・天」</small><b>${esc(HB[id].name)}</b><span>Lv${h.lv}/${capOf(id)}　解放 ${U.length-1}/${tot}</span></div><div class="bdp${pl>0&&!lock?' rdy':''}"><small>天星ポイント</small><b>${lock?'—':pl}</b></div></div>
  <div class="bdl">${['stat','ex','skill','aw','ps'].map(k=>`<span><i style="background:${NCOL[k]}"></i>${NT2[k]}</span>`).join('')}</div>${lock?`<div class="lk31">Lv${OPEN_LV}で開放<small>（あとLv${OPEN_LV-h.lv}）</small></div>`:''}`;
 log(m||(lock?`<b>天星盤</b>は Lv${OPEN_LV} から使える。Lv${OPEN_LV} を超えるとLv1ごとに<b>天星ポイント+4</b>、限界突破で<b>+10</b>`:n?'星を選択中。光る輪の星は解放できる':'星をタップで詳細。<b>光る輪の星</b>が解放できる'));
 const st=n?(U.includes(n.k)?['解放済み','on']:lock?['Lv不足','ng']:canUnlock2(id,n.k)?(n.cost<=pl?['解放できる','ok']:['ポイント不足','ng']):n.t==='ps'&&U.some(u=>N[u]&&N[u].t==='ps'&&N[u].g===n.g)?['もう一方を選択済み','ng']:['未接続（隣の星を先に解放）','ng']):null;
 panel(`<div class="bdm">${G.members.map(x=>`<div class="bdf${x===id?' on':''}${G.h[x].lv>=OPEN_LV&&tenLeft(x)>0?' rdy':''}" data-a="m" data-v="${x}" style="--ec:${elCol(x)}"><img src="${art(x)}"><small>${esc(HB[x].name)}</small></div>`).join('')}</div>
 <div class="bdi"${n?` style="--nc:${NCOL[n.t]}"`:''}>${n?`<div class="bdt"><i>${NT2[n.t]}${n.t==='ps'?'（2つのうち1つ）':''}</i><em class="${st[1]}">${st[0]}</em></div><b>${esc(n.d)}</b><small>必要ポイント ${n.cost}</small>`:'<div class="bdt"><i style="--nc:#ffb86b">天星盤</i></div><small>通常の星盤の上位版。大きな能力の上昇・極技・天星パッシブ・新しい能力値（与ダメ／技の威力／会心ダメ／被ダメ軽減）を解放できる。</small>'}</div>
 <div class="bdb"><button class="tbtn gold" data-a="un" ${can?'':'disabled'}>解放${n?`<small>ポイント${n.cost}</small>`:''}</button><button class="tbtn" data-a="auto" ${pl>0&&!lock?'':'disabled'}>おまかせ<small>自動で振り分け</small></button><button class="tbtn" data-a="rs">リセット<small>無料</small></button></div>
 <div class="bdb b31"><button class="tbtn" data-a="sw">通常の星盤へ<small>星ポイント</small></button><button class="tbtn${G.members.some(x=>!V31.lbCheck(x))?' gold':''}" data-a="lb">限界突破<small>上限 ${capOf(id)}</small></button><button class="tbtn back" data-a="back">戻る</button></div>`,
 {m:x=>{BS.sel=null;BS.id=x;boardMenu();},un:()=>{U.push(n.k);SFX.aw();save();boardMenu(`<b>${esc(n.d)}</b> を解放した！`);},
  auto:()=>{const c=auto2(id);if(c)SFX.aw();save();boardMenu(c?`${c}個の星を解放した`:'解放できる星がない（ポイント不足）');},rs:()=>{h.board2=['0,0'];BS.sel=null;save();boardMenu('天星盤をリセットした（ポイントは全て戻る）');},
  sw:()=>{BS.up=false;BS.sel=null;boardMenu();},lb:()=>V31.lbScreen(()=>{openBoard(id);BS.up=true;boardMenu();}),
  back:()=>{BS.up=false;const f=BFROM;BFROM='town';enterTown();if(f==='party')partyScreen();}});
 try{V21.boardFit();}catch(e){}}
{const _bm=boardMenu;boardMenu=function(m){if(BS.up)return upMenu(m);_bm(m);try{const c=$('#cmd'),rows=c.querySelectorAll('.bdb');const last=rows[rows.length-1];if(last&&!c.querySelector('.b31')){const id=BS.id,lv=G.h[id].lv,d=document.createElement('div');d.className='bdb b31';
  d.innerHTML=`<button class="tbtn${lv>=OPEN_LV&&tenLeft(id)>0?' gold':''}" data-a="sw">天星盤へ<small>${lv>=OPEN_LV?'天星ポイント '+tenLeft(id):'Lv'+OPEN_LV+'で開放'}</small></button><button class="tbtn" data-a="lb">限界突破<small>上限 ${capOf(id)}</small></button>`;
  last.before(d);ACT.sw=()=>{BS.up=true;BS.sel=null;boardMenu();};ACT.lb=()=>V31.lbScreen(()=>{openBoard(id);});V21.boardFit();}}catch(e){console.error(e);}};}
{const _ob=openBoard;openBoard=function(id,m){BS.up=false;return _ob(id,m);};}

/* ---------- キャラ詳細：新しい能力値・天星パッシブの表示 ---------- */
{const _ch=charHTML;charHTML=function(id,tab,ed){let s=_ch(id,tab,ed);try{if(tab==='st'){const st=stats(id),rows=[['与ダメ',st.dmgP],['技の威力',st.skDmg],['会心ダメ',st.critDmg],['被ダメ軽減',Math.min(60,st.dmgCut)]].filter(x=>x[1]>0)
   .map(([k,v])=>`<div class="sr x31"><span><i class="gn">◆</i>${k}</span><b>+${v}%</b></div>`).join('');
  if(rows)s=s.replace(/(ドロップ率<\/span><b>[^<]*<\/b><\/div>)/,'$1'+rows);}
 if(tab==='bd'&&G.h[id].lv>=OPEN_LV){const ps=psOf(id).map(p=>V20.PS[p]).filter(Boolean);s=s.replace(/(<div class="sh2">ジョブ<\/div>)/,`<div class="sh2">天星盤「${esc(BDEF[id].star)}・天」</div><div class="stx">解放 ${b2(id).length-1}／${Object.keys(BOARD2[id]).length-1}　天星ポイント残り <b>${tenLeft(id)}</b>${ps.length?'<br>天星パッシブ：'+ps.map(p=>esc(p.n)).join('・'):''}</div>$1`);}}catch(e){console.error(e);}return s;};}

return{XSK,TP,CP,PSP,BOARD2,build2,tenTotal,tenLeft,canUnlock2,auto2,psOf,OPEN_LV,b2};})();
