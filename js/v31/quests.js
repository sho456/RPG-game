/* ===== ver0.31 クエスト制（マップ探索の廃止） =====
 1. 出撃先はクエスト一覧。章ごとに複数のクエストがあり、区切りに中ボス・大ボスのクエストがある。
    1 つのクエストで 2〜4 回の戦闘が続くものもある（戦闘の合間に HP は回復しない。倒れた仲間は HP20% で起きる）
 2. 表記：一覧に「戦闘×3」「中ボス」「大ボス」「推奨Lv」「CLEAR／クリア回数」、戦闘中に「BATTLE 2/3」、
    出発時に「BATTLE 1/3」の見出し、報酬画面に宝箱とクエスト名、最後に「QUEST CLEAR」とクリアボーナス
 3. 宝箱は敵が落とす（通常の敵はまれに銅の宝箱、中ボスは銀、大ボスは金。金の宝箱からはレジェンドや天極の星晶も）
 4. 仲間の加入・クロウの選択・残響・エンディングは、該当クエストの初回クリア後のイベントになった
 5. 虚蝕化：本編の章のうち 1 つが、出撃 3 回ごとに入れ替わりで虚蝕化（敵が強いぶん、ドロップと灯力が増える）
 6. 全滅してもお金は減らない（クエスト失敗。それまでに得た報酬は残る）。戦闘の合間に撤退もできる
 旧データ：ボスの旗・仲間の加入・塔の到達階・残響・回廊の到達層から、クリア済みのクエストを自動で決める */
'use strict';
function qCleared(id){return!!(G&&G.qs&&G.qs.c&&G.qs.c[id]);}
const V31Q=(()=>{
const{esc,fm}=V31,{CH,POST}=QD;
const QS=()=>G.qs||(G.qs={c:{},seen:{}});
const qCount=id=>QS().c[id]||0;
const chById=id=>CH.find(c=>c.id===id);
/* ---------- 虚の回廊（10層で 1 クエスト・どこまでも続く） ---------- */
const KRC={};
function krQ(f0){if(KRC[f0])return KRC[f0];const fb=f0+9;
 const w=[0,1,2].map(i=>{const f=f0+i*3;let g=['vo_shade'];try{g=makeKairouArea(f).groups[i];}catch(e){}return{e:g,lv:kLv(f)};});
 w.push({e:[kBoss(fb)],lv:kLv(fb)});
 return KRC[f0]={id:'kr'+f0,n:`${f0}〜${fb}層`,lv:kLv(fb),w,f0,d:`色を失った星の記憶が積み重なる回廊。${fb}層に番人がいる。`,post:fb===30?'celes':null,first:{loot:[[kLv(fb),3]]}};}
function krQuests(){const K=kst(),n=Math.floor(Math.max(0,(K.cp||1)-1)/10)+1,o=[];for(let i=0;i<n;i++)o.push(krQ(i*10+1));return o;}
const qsOf=c=>c.dyn==='kairou'?krQuests():c.qs;
function qById(id){for(const c of CH)for(const q of qsOf(c))if(q.id===id)return[c,q];if(/^kr\d+$/.test(id)){const q=krQ(+id.slice(2));return[chById('kr'),q];}return[null,null];}
const chOpen=c=>{try{return!!c.need();}catch(e){return false;}};
function qOpen(c,q){if(!chOpen(c))return false;const L=qsOf(c),i=L.indexOf(q);return i<=0||qCleared(L[i-1].id);}
const chDone=c=>{const L=qsOf(c);return L.length>0&&L.every(q=>qCleared(q.id))&&c.dyn!=='kairou';};
const waveOf=w=>Array.isArray(w)?{e:w}:w;
const kindOf=k=>k==='@crow'?(G.flags&&G.flags.crowChoice?'boss4b':'boss4'):k;
const rankOf=k=>{try{return TERMS.charCat(kindOf(k));}catch(e){return'normal';}};
function qRank(q){let r='';for(const w of q.w)for(const k of waveOf(w).e){const c=rankOf(k);if(c==='big')return'big';if(c==='mid')r='mid';}return r;}
const bossOf=q=>{for(let i=q.w.length-1;i>=0;i--){const e=waveOf(q.w[i]).e.map(kindOf);const b=e.find(k=>ED[k]&&ED[k].boss);if(b)return b;}const L=waveOf(q.w[q.w.length-1]).e.map(kindOf);return L[0];};
const isVoid=c=>{try{return c.tab===0&&voidArea(G.sorties+1)===c.area;}catch(e){return false;}};
const known=k=>{k=kindOf(k);return!!(G.zk&&G.zk.e&&G.zk.e[k])||!!(G.known&&G.known[k]);};

/* ---------- 旧データからの移し替え（何度呼んでもよい。クリアを足すだけ） ---------- */
function migQ(){if(!G)return;const S=QS(),done=id=>{if(!S.c[id])S.c[id]=1;};const F=G.flags||{};
 const FC={boss1:'c0',boss2:'c1',boss3:'c2',boss4:'c3',boss5:'c4',boss6:'c5',boss7:'c6',boss8:'c7',boss9:'d1'};
 for(const f in FC)if(F[f])chById(FC[f]).qs.forEach(q=>done(q.id));
 for(const[f,q]of[['mireMet','q1_3'],['jinMet','q1_5'],['noahMet','q2_3'],['ernaMet','q3_2'],['balzaMet','q3_4'],['hakuaMet','q4_3'],['valkMet','d1_3']])if(F[f])done(q);
 const tm=(G.tower&&G.tower.max)||0;chById('c6').qs.forEach(q=>{if(q.tw&&(tm>q.tw||(tm>=q.tw&&q.tw%10)))done(q.id);});
 const en=Object.keys(F.echo||{}).length;if(en)done('q7_1');['q7_2','q7_3','q7_4'].slice(0,en).forEach(done);
 const K=G.kairou;if(K)for(let f0=1;f0+9<(K.cp||1);f0+=10)done('kr'+f0);
 for(const c of CH){const L=qsOf(c);let last=-1;L.forEach((q,i)=>{if(S.c[q.id])last=i;});for(let i=0;i<last;i++)done(L[i].id);}}
{const _mg=migrate;migrate=function(g){const r=_mg(g);try{QS();migQ();}catch(e){console.error(e);}return r;};}

/* ---------- 宝箱 ---------- */
const CHEST={bronze:['銅の宝箱','#d08a4a'],silver:['銀の宝箱','#cfd8e8'],gold:['金の宝箱','#ffd34a']};
try{for(const[k,c1,c2,c3]of[['chest_bronze','#c8743a','#7a4a22','#e0b060'],['chest_silver','#d8e0ec','#6a7488','#9fd8ff'],['chest_gold','#ffd34a','#a8701a','#ff6a6a']])
 IC21.def(k,[c1,c2,c3],'f',[],{glow:k==='chest_gold'?'#ffe27a':k==='chest_silver'?'#cfe8ff':null,ga:90,sp:k==='chest_gold'?2:k==='chest_silver'?1:0,dr:(t,M)=>{
  t.rect(3,9,18,11,M.e);t.rect(4,10,16,9,M.d);t.rect(3,4,18,6,M.e);t.rect(4,5,16,4,M.a);t.rect(4,5,16,1,M.w);
  t.rect(3,9,18,2,M.b);t.rect(6,4,2,16,M.c);t.rect(16,4,2,16,M.c);t.rect(10,8,4,5,M.h);t.rect(11,9,2,2,M.g);t.px(11,11,M.x);}});}catch(e){console.error(e);}
const chestIcon=t=>{try{return IC21.render('chest_'+t,t==='gold'?4:t==='silver'?2:0);}catch(e){return ICON.eq;}};
const CONS=lv=>lv>=40?[['hipotion',2],['ether',1],['drop2',1]]:lv>=20?[['hipotion',1],['ether',1],['drop',1]]:[['potion',2],['drop',1],['feather',1]];
function openChest(tier,lv,bonus){const o={tier,lv,parts:[],items:[]};const gl=it=>{const txt=addLoot(it);o.items.push({it,txt});o.parts.push(txt);};
 const gold=n=>{n=Math.round(n);G.gold+=n;o.gold=(o.gold||0)+n;o.parts.push(fm(n)+'G');};
 const late=lv>=70;
 if(tier==='bronze'){const r=Math.random();if(r<.4)gold(lv*45*(late?6:1));else if(r<.7){const[k,n]=CONS(lv)[Math.random()*3|0];addItem(k,n);o.parts.push(`${ITEMS[k].n}×${n}`);}else gl(genItem(lv,1,bonus));}
 if(tier==='silver'){gl(genItem(lv,2,bonus));gold(lv*70*(late?8:1));if(late&&Math.random()<.25){G.mats.seishou=(G.mats.seishou||0)+1;o.parts.push(MATS.seishou.n+'×1');}}
 if(tier==='gold'){gl(genItem(lv,3,bonus));if(Math.random()<.18)gl(genItem(lv,0,0,null,4));gold(lv*120*(late?10:1));if(late){const n=1+(Math.random()<.35?1:0);G.mats.seishou=(G.mats.seishou||0)+n;o.parts.push(MATS.seishou.n+'×'+n);}
  else if(Math.random()<.5){const k=Object.keys(STONES)[Math.random()*7|0];G.stones[k]=(G.stones[k]||0)+1;o.parts.push('星石「'+STONES[k].n+'」');}}
 return o;}
let QR=null,LASTCH=[];
{const _rw=rewards;rewards=function(es){const r=_rw(es);LASTCH=[];try{if(B&&B.opts&&B.opts.quest&&QR){const bonus=G.party.reduce((a,i)=>a+stats(i).drop,0)/100,ch=[];
  es.forEach(e=>{const d=ED[e.kind];if(!d)return;if(d.boss){const big=rankOf(e.kind)==='big';ch.push(openChest(big?'gold':'silver',ED[e.kind].ilv||e.lv,bonus));if(big&&Math.random()<.5)ch.push(openChest('silver',ED[e.kind].ilv||e.lv,bonus));}
   else if(Math.random()<.06*(1+bonus)*(QR.vd?1.6:1))ch.push(openChest('bronze',e.lv,bonus));});
  LASTCH=ch;const cg=ch.reduce((a,c)=>a+(c.gold||0),0);r.gold+=cg;
  const T=QR.tot;T.xp+=r.xp;T.gold+=r.gold;T.tou+=r.tou||0;T.items+=(r.loot||[]).length+ch.reduce((a,c)=>a+c.items.length,0);T.chests.push(...ch.map(c=>c.tier));}}catch(e){console.error(e);}return r;};}
/* 報酬画面（v20-ui が作った画面）にクエストの表記と宝箱を足す */
function decorateReward(){const ov=$('#ov'),box=ov&&ov.querySelector('.rw20');if(!box||!QR)return;const n=QR.q.w.length,i=QR.wave+1,last=i>=n;
 const g=box.querySelector('.rwG');if(g&&!box.querySelector('.qh31')){const h=document.createElement('div');h.className='qh31';h.innerHTML=`<small>${esc(QR.q.n)}</small><b>BATTLE ${i}<i>/${n}</i></b>${last?'<em>CLEAR</em>':''}`;g.before(h);
  const gb=g.querySelectorAll('b')[1];if(gb){const cg=LASTCH.reduce((a,c)=>a+(c.gold||0),0);if(cg)gb.dataset.n=String(+(gb.dataset.n||0));}}
 const ch=LASTCH,btn=box.querySelector('#cont');
 if(ch.length&&btn&&!box.querySelector('.rwX31')){const d=document.createElement('div');d.className='rwX31';d.innerHTML=`<div class="rwh">敵が宝箱を落とした！</div>${ch.map((c,j)=>`<div class="cx31 ${c.tier}" style="--d:${.4+j*.22}s"><img src="${chestIcon(c.tier)}"><div><b style="color:${CHEST[c.tier][1]}">${CHEST[c.tier][0]}</b><small>${c.parts.join('・')}</small></div></div>`).join('')}`;btn.before(d);}
 if(btn)btn.textContent=last?'クエスト結果へ ▶':'次の戦闘へ ▶';}
/* ---------- 戦闘中の表記 ---------- */
{const _rf=refresh;refresh=function(){_rf();try{if(scene!=='battle'||!B)return;const rt=document.querySelector('#bt22 .b22rt');if(!rt)return;let s=rt.querySelector('.qw31');
 if(B.opts&&B.opts.quest&&QR){if(!s){s=document.createElement('span');s.className='qw31';rt.appendChild(s);}const t=`<small>BATTLE</small><b>${QR.wave+1}/${QR.q.w.length}</b>`;if(s.innerHTML!==t)s.innerHTML=t;}else if(s)s.remove();}catch(e){}};}
function waveBanner(boss){if(boss){setTimeout(()=>waveBanner0(boss),2600);return;}waveBanner0('');}
function waveBanner0(boss){try{if(scene!=='battle'||!QR)return;const st=$('#stage');st.querySelectorAll('.qb31').forEach(x=>x.remove());const d=document.createElement('div');d.className='qb31'+(boss?' boss':'');
 const n=QR.q.w.length;d.innerHTML=`<small>${esc(QR.q.n)}</small><b>BATTLE ${QR.wave+1}<i>/${n}</i></b>${boss?`<em>${boss==='big'?'BOSS BATTLE':'中ボス戦'}</em>`:QR.wave+1===n&&n>1?'<em>FINAL BATTLE</em>':''}`;st.appendChild(d);setTimeout(()=>d.remove(),2200);}catch(e){}}

/* ---------- 進行 ---------- */
function qStart(c,q){if(!G.party.length)return;healAll();G.sorties++;let vd=false;try{vd=c.tab===0&&voidArea(G.sorties)===c.area;}catch(e){}
 QR={c,q,wave:0,vd,tot:{xp:0,gold:0,tou:0,items:0,chests:[]},lv0:Object.fromEntries(G.members.map(id=>[id,G.h[id].lv]))};save();
 const go=()=>runWave();if(q.pre&&!QS().seen[q.id]){QS().seen[q.id]=1;save();talk(q.pre,go);}else go();}
function runWave(){const{c,q}=QR,w=waveOf(q.w[QR.wave]),lv=w.lv||q.lv;let list=w.e.map(kindOf).map(k=>({kind:k,lv}));
 if(QR.vd)list=list.map(e=>ED[e.kind]&&ED[e.kind].boss?e:{kind:voidKind(e.kind),lv:Math.max(e.lv+18,56)});
 const boss=list.some(e=>ED[e.kind]&&ED[e.kind].boss)||!!w.stages||!!w.ev,rk=list.map(e=>rankOf(e.kind)).includes('big')?'big':list.some(e=>rankOf(e.kind)==='mid')||w.ev?'mid':'';
 try{VOIDED=!!QR.vd;}catch(e){}AREA=c.area;F=null;A=null;
 if(c.dyn==='kairou'){try{const f=q.f0+QR.wave*3;kst().cur=f;AREAS.kairou=makeKairouArea(w.e.some(k=>/^kb/.test(k))?q.f0+9:f);A=AREAS.kairou;AREA='kairou';}catch(e){}}
 startBattle(list,{boss,stages:w.stages,stageLv:w.slv||lv,event:w.ev||null,theme:q.th||c.th,quest:true,onEnd:waveEnd});
 if(c.dyn==='kairou'&&B)B.opts.boss=boss;waveBanner(rk);}
function waveEnd(mode){try{VOIDED=false;}catch(e){}if(!QR)return enterTown();
 if(mode==='flee')return qFail('flee');QR.wave++;if(QR.wave<QR.q.w.length)interlude();else qClear();}
const partyHP=()=>`<div class="qhp31">${G.party.map(id=>{const s=stats(id),hp=G.h[id].hp??s.mhp,r=Math.max(0,Math.min(1,hp/s.mhp));return`<div><img src="${face(id)}"><span><b>${esc(HB[id].name)}</b><i><u style="width:${r*100}%;background:${r>.5?'#5adc7a':r>.25?'#ffd34a':'#ff5a5a'}"></u></i><small>${fm(hp)} / ${fm(s.mhp)}</small></span></div>`;}).join('')}</div>`;
function ovShow(html,cls){const ov=$('#ov');ov.classList.remove('hide','rw20ov','ttl');ov.className=(ov.className||'').replace(/\bq\w+31ov\b/g,'');ov.classList.add(cls||'qi31ov');ov.innerHTML=html;ov.scrollTop=0;return ov;}
function interlude(){const{q}=QR,n=q.w.length,w=waveOf(q.w[QR.wave]),es=w.e.map(kindOf),boss=es.find(k=>ED[k]&&ED[k].boss);
 const nm=es.map(k=>ED[k]?(ED[k].boss&&!known(k)?'？？？':ED[k].name):k);
 ovShow(`<div class="qi31"><div class="qt31">${esc(q.n)}</div><div class="qbn31"><small>NEXT</small>BATTLE <b>${QR.wave+1}</b><i>/${n}</i></div>
  <div class="qnx31">${boss?`<em class="${rankOf(boss)}">${rankOf(boss)==='big'?'大ボス':'中ボス'}</em>`:''}次の相手：${nm.map(esc).join('・')}</div>
  <div class="qst31"><span>ここまで</span><b>EXP ${fm(QR.tot.xp)}</b><b>${fm(QR.tot.gold)} G</b><b>装備 ${QR.tot.items}</b><b>宝箱 ${QR.tot.chests.length}</b></div>
  ${partyHP()}<div class="qno31">戦闘の合間に HP は回復しない（倒れた仲間は HP20% で立ち上がる）</div>
  <button class="big gold" id="qgo">次の戦闘へ ▶</button><button class="big" id="qret">撤退する<small>得た報酬は持ち帰る</small></button></div>`);
 $('#qgo').onclick=()=>{SFX.sel();runWave();};$('#qret').onclick=()=>{SFX.sel();qFail('retreat');};}
function lvUps(){const o=[];for(const id of G.members){const a=QR.lv0[id]||G.h[id].lv,b=G.h[id].lv;if(b>a)o.push(`${HB[id].name} Lv${a}→<b>${b}</b>`);}return o;}
function giveFirst(f){const o=[];if(!f)return o;if(f.g){G.gold+=f.g;o.push(fm(f.g)+'G');}(f.it||[]).forEach(([k,n])=>{addItem(k,n);o.push(`${ITEMS[k].n}×${n}`);});
 (f.mat||[]).forEach(([k,n])=>{G.mats[k]=(G.mats[k]||0)+n;o.push(`<span class="ss31">${MATS[k].n}×${n}</span>`);});
 (f.loot||[]).forEach(([lv,r])=>{const it=genItem(lv,r,0);o.push(addLoot(it));});(f.royal||[]).forEach(s=>{const it=royalItem(s,Math.max(31,G.h[G.party[0]].lv));it.unid=false;o.push(addLoot(it));});return o;}
function qClear(){const{c,q}=QR,S=QS(),first=!S.c[q.id];S.c[q.id]=(S.c[q.id]||0)+1;
 if(q.flag)G.flags[q.flag]=true;
 if(q.tw){G.tower=G.tower||{cp:1,cur:1,max:0};G.tower.max=Math.max(G.tower.max||0,q.tw);G.tower.cp=Math.max(G.tower.cp||1,Math.min(26,q.tw+1));if(q.tw%10===0)G.flags['tw'+q.tw]=true;}
 if(q.f0){const K=kst(),fb=q.f0+9;K.max=Math.max(K.max||0,fb);K.cp=Math.max(K.cp||1,fb+1);G.flags['kr'+fb]=true;if(fb>=30)G.flags.kr30=true;}
 const bx=Math.round(QR.tot.xp*.4),bg=Math.round(q.lv*25*q.w.length*(q.lv>=70?6:1));G.gold+=bg;for(const id of G.members){const m=stats(id).mhp,hp=G.h[id].hp;const n=gainXP(id,bx);if(n&&hp!=null)G.h[id].hp=Math.min(stats(id).mhp,hp+stats(id).mhp-m);}
 const fr=first?giveFirst(q.first):[],ups=lvUps();save();SFX.aw();
 const ch=QR.tot.chests,cc={gold:0,silver:0,bronze:0};ch.forEach(t=>cc[t]++);
 ovShow(`<div class="qc31"><div class="qcT"><span>QUEST</span><span>CLEAR</span></div><div class="qcn"><small>${esc(c.ch)}　${esc(c.n)}</small><b>${esc(q.n)}</b><em>クリア ${S.c[q.id]}回目</em></div>
  <div class="qcg"><div><em>獲得EXP</em><b>${fm(QR.tot.xp+bx)}</b></div><div><em>獲得GOLD</em><b>${fm(QR.tot.gold+bg)}</b></div><div><em>装備</em><b>${QR.tot.items}</b></div></div>
  <div class="qcb"><div class="rwh">クリアボーナス</div><span>EXP +${fm(bx)}</span><span>${fm(bg)} G</span>${ch.length?`<span>宝箱 ${['gold','silver','bronze'].filter(t=>cc[t]).map(t=>`<img src="${chestIcon(t)}">×${cc[t]}`).join(' ')}</span>`:''}</div>
  ${fr.length?`<div class="qcf"><div class="rwh">初回クリア報酬</div>${fr.map(x=>`<span>${x}</span>`).join('')}</div>`:''}
  ${ups.length?`<div class="qcu"><div class="rwh">レベルアップ</div>${ups.map(x=>`<span>${x}</span>`).join('')}</div>`:''}
  <button class="big gold" id="qok">${first&&q.post?'つづく ▶':'クエスト一覧へ'}</button>${first&&q.post?'':'<button class="big" id="qtown">灯都へ戻る</button>'}</div>`,'qc31ov');
 const done=()=>{const p=first&&q.post;QR=null;if(p)runPost(p,()=>questMap());else questMap();};
 $('#qok').onclick=()=>{SFX.sel();done();};const tb=$('#qtown');if(tb)tb.onclick=()=>{SFX.sel();QR=null;enterTown('灯都へ帰還した。仲間のHPが全回復した。');};}
function qFail(kind){const q=QR&&QR.q;try{VOIDED=false;}catch(e){}
 ovShow(`<div class="qc31 fail"><div class="qcT"><span>${kind==='lose'?'QUEST':'RETREAT'}</span><span>${kind==='lose'?'FAILED':''}</span></div><div class="qcn"><b>${esc(q?q.n:'')}</b><em>${kind==='lose'?'全滅した……灯守たちに救われ、灯都へ運ばれた':'撤退した'}</em></div>
  <div class="qcg"><div><em>獲得EXP</em><b>${fm(QR?QR.tot.xp:0)}</b></div><div><em>獲得GOLD</em><b>${fm(QR?QR.tot.gold:0)}</b></div><div><em>装備</em><b>${QR?QR.tot.items:0}</b></div></div>
  <div class="qno31">それまでに得た報酬は持ち帰った（お金は減らない）</div><button class="big gold" id="qok">クエスト一覧へ</button><button class="big" id="qtown">灯都へ戻る</button></div>`,'qc31ov');
 QR=null;save();$('#qok').onclick=()=>{SFX.sel();healAll();questMap();};$('#qtown').onclick=()=>{SFX.sel();enterTown('灯都へ帰還した。仲間のHPが全回復した。');};}
/* 全滅：クエスト中はお金を失わない／勝利：報酬画面に表記を足す */
{const _end=end;end=async function(win){if(!win&&B&&B.opts&&B.opts.quest&&QR){B.over=true;$('#cmd').innerHTML='';B.heroes.forEach(h=>{G.h[h.id].hp=Math.max(h.hp,Math.ceil(h.mhp*.2));});save();await wait(300);qFail('lose');return;}
 const r=await _end(win);try{if(win&&B&&B.opts&&B.opts.quest&&QR)decorateReward();}catch(e){console.error(e);}return r;};}
/* ---------- 初回クリア後のイベント ---------- */
function recruitAsk(P,done){const id=P.who;ovShow(`<div class="qr31"><img src="${art(id)}"><b>${esc(HB[id].name)}</b><small>仲間にしますか？</small><button class="big gold" id="qy">仲間にする</button><button class="big" id="qn">今はやめる</button></div>`,'qr31ov');
 $('#qy').onclick=()=>{SFX.aw();G.flags[P.flag]=1;newMember(id);save();toastMsg(`<b>${HB[id].name}が仲間になった！</b>`+(G.party.includes(id)?'':'（控えに入った）'));done();};
 $('#qn').onclick=()=>{SFX.sel();G.flags[P.flag]=1;G.declined=[...(G.declined||[]),id];save();toastMsg(P.decline||'');done();};}
let TOAST='';const toastMsg=h=>{TOAST=h;};
function runPost(p,done){const P=POST[p];
 if(p==='crow'){if(G.flags.crowChoice)return done();talk([[null,'n','クロウは膝をついた。体から虚蝕が抜けていく。'],['crow','s','……とどめを刺せ。虚蝕に家族を喰われ、俺も喰われた。生きる理由なんて、もう――']],()=>{
   ovShow(`<div class="qr31"><img src="${art('crow')}"><b>クロウ</b><small>どうする？</small><button class="big gold" id="qy">救う</button><button class="big" id="qn">見逃す</button></div>`,'qr31ov');
   $('#qy').onclick=()=>{SFX.aw();G.flags.crowChoice='save';newMember('crow');save();toastMsg('<b>クロウが仲間になった！</b> 「……物好きだな。借りは、虚蝕で返す」');done();};
   $('#qn').onclick=()=>{SFX.sel();G.flags.crowChoice='leave';const s=addLoot(genItem(23,3));save();toastMsg(`クロウは無言で去っていった。足元に${s}が残されていた。`);done();};});return;}
 if(/^echo_/.test(p)){const id=p.slice(5);G.flags.echo=G.flags.echo||{};const pg=(typeof ECHO!=='undefined'&&ECHO[id])||[];G.flags.echo[id]=1;if(id==='c')G.flags.zenkyo=1;save();talk(pg.map(t=>[null,'n',t]),()=>{toastMsg(Object.keys(G.flags.echo).length>=3?'<b>星核の扉が開いた。</b>最後のクエスト「星核の扉」へ。':`残響はあと${3-Object.keys(G.flags.echo).length}つ。`);done();});return;}
 if(p==='ending'){if(G.flags.endSeen)return done();try{$('#ov').classList.remove('qc31ov','qi31ov','qr31ov');}catch(e){}ending();return;}
 if(!P)return done();
 if(P.who&&G.members.includes(P.who)){G.flags[P.flag]=1;return done();}
 talk(P.lines,()=>{if(!P.who)return done();if(P.auto){G.flags[P.flag]=1;newMember(P.who);SFX.aw();save();toastMsg(`<b>${HB[P.who].name}が仲間になった！</b>`+(G.party.includes(P.who)?'':'（控えに入った）'));return done();}recruitAsk(P,done);});}

/* ---------- クエスト一覧の画面 ---------- */
const QM={on:false,tab:0,ch:{},sel:null,cur:null,bgs:{},st:new Map()};
const TABS=[['本編',()=>true,''],['深層',()=>!!G.flags.boss8,'終章クリアで開放'],['天極',()=>!!G.flags.boss9,'竜の巣クリアで開放']];
function defCh(tab){const L=CH.filter(c=>c.tab===tab&&chOpen(c));return(L.find(c=>!chDone(c))||L[L.length-1]||CH.find(c=>c.tab===tab)).id;}
function defQ(c){const L=qsOf(c).filter(q=>qOpen(c,q));return(L.find(q=>!qCleared(q.id))||L[L.length-1]||qsOf(c)[0]).id;}
const lvTag=lv=>`推奨Lv${lv}`;
function enemyNames(q){return q.w.map(w=>waveOf(w).e.map(kindOf).map(k=>{const d=ED[k];if(!d)return k;return d.boss&&!known(k)&&!qCleared(q.id)?'？？？':d.name;}));}
function render(m){try{migQ();}catch(e){}if(!TABS[QM.tab][1]())QM.tab=0;const tab=QM.tab,chs=CH.filter(c=>c.tab===tab);let cid=QM.ch[tab];if(!cid||!chOpen(chById(cid)))cid=QM.ch[tab]=defCh(tab);
 const c=chById(cid),L=qsOf(c);if(!QM.sel||!L.some(q=>q.id===QM.sel))QM.sel=defQ(c);const q=L.find(x=>x.id===QM.sel)||L[0];const vd=isVoid(c);
 QM.cur={c,q,boss:q?bossOf(q):null,vd,th:(q&&q.th)||c.th};QM.on=true;WMS.on=false;
 const clr=L.filter(x=>qCleared(x.id)).length;
 $('#labels').innerHTML=`<div class="wmr"><span class="g">${fm(G.gold)} G</span><span class="t">灯力 ${fm(G.tou||0)}</span><span class="s31"><img src="${ICON.seishou}">${G.mats.seishou||0}</span></div>
  <div class="wmt${vd?' vd':''}"><small>${esc(c.ch)}${vd?'　◆虚蝕化':''}</small><b>${esc(c.n)}</b><span>${q?esc(q.n)+'　'+lvTag(q.lv):''}</span></div>`;
 log((m?m+'<br>':'')+(TOAST?TOAST+'<br>':'')+esc(c.intro)+(vd?'<br><small style="color:#d0b0ff">虚蝕化中：敵が強いぶん、ドロップと灯力・宝箱が増える</small>':''));TOAST='';
 const chip=x=>{const op=chOpen(x),dn=chDone(x),xl=qsOf(x),n=xl.filter(y=>qCleared(y.id)).length,v=isVoid(x);
  return`<button class="qch31${x.id===cid?' on':''}${op?'':' lock'}${dn?' done':''}${v?' vd':''}" data-a="ch" data-v="${x.id}"><small>${esc(x.ch)}</small><b>${op?esc(x.n):'？？？'}</b><i>${op?(x.dyn?'最深 '+((kst().max)||0)+'層':`${n}/${xl.length}`):'🔒'}</i>${v?'<em>虚蝕化</em>':''}</button>`;};
 const row=(x,i)=>{const op=qOpen(c,x),s=x.id===QM.sel&&op,cn=qCount(x.id),rk=qRank(x),n=x.w.length,nm=s?enemyNames(x):null;
  const pips=x.w.map(w=>{const e=waveOf(w).e.map(kindOf),b=e.find(k=>ED[k]&&ED[k].boss);return`<i class="${b?rankOf(b):''}">${b?(rankOf(b)==='big'?'◆':'◇'):'●'}</i>`;}).join('');
  return`<div class="wrow qrow31${s?' sel':''}${op?'':' lock'}${vd?' vd':''}${rk?' r-'+rk:''}" data-a="sel" data-v="${x.id}">${cn?`<div class="wcl">CLEAR${cn>1?' ×'+cn:''}</div>`:''}
   <div class="wch">${c.dyn?'層':`No.${i+1}`}</div><div class="wnm">${rk?`<em class="rk31 ${rk}">${rk==='big'?'大ボス':'中ボス'}</em>`:''}${op?esc(x.n):'？？？'}</div>
   <div class="wrec">${op?`${lvTag(x.lv)}　<span class="bn">戦闘×${n}</span>${vd?'　<b>◆虚蝕化</b>':''}`:'🔒 前のクエストをクリアすると開放'}</div><div class="wdr qp31">${op?pips:''}</div>
   ${s?`<div class="wdet"><div class="qd31">${esc(x.d||'')}</div><div class="qe31">${nm.map((L2,j)=>`<div><span>${j+1}戦目</span>${L2.map(esc).join('・')}</div>`).join('')}</div>
    <div class="qr31x">${!cn&&x.first?`<span class="fr">初回報酬：${firstTxt(x.first)}</span>`:''}<span>宝箱：${rk==='big'?'金の宝箱（確定）':rk==='mid'?'銀の宝箱（確定）':'まれに銅の宝箱'}</span>${x.lv>=70?`<span class="ss31">${MATS.seishou.n}が出る</span>`:''}</div>
    <button class="tbtn gold wgo" data-a="go" data-v="${x.id}">▼ 出 撃 ▼</button></div>`:''}</div>`;};
 const cmd=$('#cmd');cmd.className='panel wmap qm31';
 cmd.innerHTML=`<div class="wtabs t31">${TABS.map(([l,ok,un],i)=>`<button class="${i===tab?'on':''}${ok()?'':' lock'}" data-a="tab" data-v="${i}">${ok()?l:'🔒 ？？？'}</button>`).join('')}</div>
  <div class="qchs31">${chs.map(chip).join('')}</div>
  <div class="wlist">${c.dyn?`<div class="qkr31">最深到達 ${(kst().max)||0}層。10層ごとに番人を倒すと先へ進める</div>`:''}${L.map(row).join('')}</div>
  <div class="wfoot"><button class="tbtn back" data-a="back">◀ 戻る</button><button class="tbtn" data-a="party">編成</button><div class="wfp">${G.party.map(id=>`<img src="${face(id)}">`).join('')}<small>戦闘力 <b>${fm(G.party.reduce((s,id)=>s+power(id),0))}</b></small></div></div>`;
 ACT={tab:k=>{k=+k;if(!TABS[k][1]()){log('🔒 '+TABS[k][2]);return;}QM.tab=k;QM.sel=null;render();},ch:id=>{const x=chById(id);if(!chOpen(x)){log('🔒 前の章の大ボスを倒すと開放');return;}QM.ch[QM.tab]=id;QM.sel=null;render();},
  sel:id=>{const x=L.find(y=>y.id===id);if(!x||!qOpen(c,x)){log('🔒 前のクエストをクリアすると開放');return;}if(QM.sel!==id){QM.sel=id;render();}},
  go:id=>{const x=L.find(y=>y.id===id);if(!x)return;QM.on=false;qStart(c,x);},back:()=>{QM.on=false;townMenu();},party:()=>{QM.on=false;partyScreen();}};
 const sr=cmd.querySelector('.wrow.sel');if(sr&&sr.scrollIntoView)sr.scrollIntoView({block:'nearest'});const cs=cmd.querySelector('.qch31.on');if(cs&&cs.scrollIntoView)cs.scrollIntoView({block:'nearest',inline:'center'});}
function firstTxt(f){const o=[];if(f.g)o.push(fm(f.g)+'G');(f.mat||[]).forEach(([k,n])=>o.push(MATS[k].n+'×'+n));(f.it||[]).forEach(([k,n])=>o.push(ITEMS[k].n+'×'+n));if(f.loot)o.push('装備×'+f.loot.length);if(f.royal)o.push('王家の遺品×'+f.royal.length);return o.join('・')||'—';}
function questMap(m){migQ();const ov=$('#ov');ov.classList.add('hide');ov.classList.remove('qi31ov','qc31ov','qr31ov','rw20ov');const p=worldMap31;p(m);}
let worldMap31=null;
{const _wm=worldMap;worldMap=function(m){try{if(scene!=='town')show('town');}catch(e){}try{const ov=$('#ov');if(!ov.classList.contains('ttl')){ov.classList.add('hide');ov.classList.remove('qi31ov','qc31ov','qr31ov','rw20ov');}}catch(e){}_wm('');try{render(m);tip('map');}catch(e){console.error(e);}};worldMap31=worldMap;}
/* プレビュー：選んだクエストのボス（なければ最後の敵）とパーティ */
function stillOf(k){if(QM.st.has(k))return QM.st.get(k);let c=null;try{c=V31E.still(k,64);}catch(e){}if(!c){try{c=hiImg(IMG[k],64,true);}catch(e){}}if(c&&typeof SPX!=='undefined'&&SPX.ready)QM.st.set(k,c);return c;}
function drawQM(){const x0=QM.cur;if(!x0)return;const th=x0.th||'ash';if(!QM.bgs[th])QM.bgs[th]=makeBg(th,true);ctx.drawImage(QM.bgs[th],0,0);if(x0.vd){ctx.fillStyle='rgba(120,60,200,.24)';ctx.fillRect(0,0,W,H);}
 const bk=x0.boss;if(bk){const d=ED[bk]||{},big=d.boss,s=big?54:40,x=16,y=92-s+Math.round(Math.sin(tick/26)*1.5);let img=stillOf(bk);const kn=known(bk)||(x0.q&&qCleared(x0.q.id));if(img&&!kn)img=silOf(img);
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(x+s*.15,91,s*.7,3);if(img)ctx.drawImage(img,x,y,s,s);}
 [[100,30],[134,37],[112,52],[146,59]].slice(0,G.party.length).map((p,i)=>[p,G.party[i]]).sort((a,b)=>a[0][1]-b[0][1]).forEach(([[x,y],id],i)=>{const yy=y+((tick>>5)+i)%2;ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(x+7,y+31,18,2);ctx.drawImage(hiImg(IMG[id],48,true),x,yy,32,32);});
 const g=ctx.createLinearGradient(0,84,0,H);g.addColorStop(0,'rgba(5,6,15,0)');g.addColorStop(1,'rgba(5,6,15,.9)');ctx.fillStyle=g;ctx.fillRect(0,84,W,H-84);}
{const _d=draw;draw=function(){if(QM.on&&scene==='town'&&$('#cmd').classList.contains('qm31')){tick++;const k=bK();if(cv.width!==W*k||cv.height!==H*k){cv.width=W*k;cv.height=H*k;}ctx.setTransform(k,0,0,k,0,0);ctx.imageSmoothingEnabled=false;try{drawQM();}catch(e){}requestAnimationFrame(draw);return;}QM.on=false;_d();};}

/* ---------- 旧マップへの入口をクエストへ ---------- */
enterField=function(){questMap('探索マップは廃止され、<b>クエスト制</b>になりました');};
try{enterTower=function(){questMap();};enterKairou=function(){questMap();};}catch(e){}
function nextQ(){try{for(const tab of[2,1,0]){if(!TABS[tab][1]())continue;for(const c of CH.filter(x=>x.tab===tab&&chOpen(x)&&!x.dyn)){const q=qsOf(c).find(y=>qOpen(c,y)&&!qCleared(y.id));if(q)return{ch:c.ch,nm:q.n,rc:lvTag(q.lv)};}}}catch(e){}return null;}
{const _tm=townMenu;townMenu=function(m){QM.on=false;if(TOAST&&!m){m=TOAST;TOAST='';}_tm(m);try{document.querySelectorAll('.h22sortie small').forEach(s=>{if(s.textContent==='WORLD MAP')s.textContent='QUEST';});const nx=nextQ(),b=document.querySelector('.h22nx');if(b&&nx){const bb=b.querySelector('b'),sm=b.querySelector('small');if(bb)bb.textContent=nx.nm;if(sm)sm.textContent=nx.rc;}else if(b&&!nx)b.style.visibility='hidden';}catch(e){}};}
try{TIPS.map=['クエスト',['章を選んで、クエストをタップすると詳細が開く。<b>▼出撃▼</b>で出発。','1つのクエストで<b>戦闘が何回か続く</b>ことがある（BATTLE 1/3 など）。戦闘の合間にHPは回復しない。','<b>中ボス・大ボス</b>は章の区切り。<b>宝箱は敵が落とす</b>。クリアしたクエストは何度でも挑める。']];
 TIPS.town[1][1]='<b>出撃</b>：クエストを選んで冒険へ。<br><b>編成</b>：仲間の入れ替え・装備・星盤はここから。';}catch(e){}

try{TIPS.how=['遊び方',['<b>灯都</b>で準備 → <b>出撃</b>でクエストへ → 章の<b>大ボス</b>を倒すと次の章へ。灯都に戻るとHP全回復＆自動セーブ。','1つのクエストで戦闘が何回か続くことがある。<b>宝箱は敵が落とす</b>（中ボスは銀、大ボスは金）。','戦闘：弱点を突いて大ダメージ、ゲージ100%で<b>星臨</b>（行動を消費しない）。2人星臨で<b>共鳴技</b>。','Lv60からは<b>天星盤</b>、Lv99からは<b>限界突破</b>（天極の星晶）でLv120まで。']];}catch(e){}
const HOWTO='<b>遊び方</b><br>・灯都で準備→「出撃」でクエストを選ぶ。章の区切りに<b>中ボス・大ボス</b>。1つのクエストで戦闘が何回か続くこともある。<br>・<b>宝箱は敵が落とす</b>（まれに銅、中ボスは銀、大ボスは金）。<br>・戦闘：技を2回タップで決定。弱点を突いて大ダメージ、ゲージ100%で<b>星臨</b>（行動を消費しない）。2人星臨で<b>共鳴技</b>。<br>・灯都に戻るとHP全回復＆自動セーブ。<b>編成</b>で装備と星盤。Lv60から<b>天星盤</b>、Lv99から<b>限界突破</b>でLv120まで。';
{const _t=title;title=function(){_t();try{const h=$('#hw');if(h)h.innerHTML=HOWTO;}catch(e){}};try{const h=$('#hw');if(h)h.innerHTML=HOWTO;}catch(e){}}
/* ---------- 開発者メニュー ---------- */
function devQuests(){menu([...CH.filter(c=>c.tab!==undefined).map(c=>({l:`${c.ch} ${c.n}`,s:`${qsOf(c).length}クエスト`,f:()=>menu([...qsOf(c).map(q=>({l:q.n,s:`Lv${q.lv}・戦闘×${q.w.length}`,f:()=>{QM.on=false;qStart(c,q);}})),{l:'戻る',cls:'back',f:devQuests}],true)})),{l:'戻る',cls:'back',f:()=>dev31()}],true);}
function devAll(){const S=QS();for(const c of CH)if(!c.dyn)c.qs.forEach(q=>{S.c[q.id]=S.c[q.id]||1;});Object.assign(G.flags,{boss1:true,boss2:true,boss3:true,boss4:true,boss5:true,boss6:true,boss7:true,boss8:true,boss9:true,endSeen:1});const K=kst();K.cp=Math.max(K.cp||1,41);K.max=Math.max(K.max||0,40);migQ();save();}
function devEnd(lv){for(const id of G.members){const h=G.h[id];h.cap=V31.MAXLV;h.lv=lv;h.xp=0;h.hp=null;h.awLv=3;}devGear(lv);for(const id of G.members){try{autoUnlock(id);V31B.b2(id);V31B.auto2(id);}catch(e){}}save();}
function dev31(m){log(m||`<b>${V31.VER}</b>　クエスト制・Lv120・天星盤・装備枠・エンドコンテンツの確認`);
 menu([{l:'クエスト一覧',s:'通常の画面',cls:'ready',f:()=>worldMap()},{l:'クエストへ直行',s:'章・クエストを選ぶ',f:devQuests},{l:'全クエストを開放',s:'本編・深層・天極',f:()=>{devAll();dev31('全クエストを開放した');}},
  {l:'全員 Lv70・装備Lv70',f:()=>{devEnd(70);dev31('全員Lv70（装備・星盤・天星盤も）');}},{l:'全員 Lv100・装備Lv100',f:()=>{devEnd(100);dev31('全員Lv100（装備・星盤・天星盤も）');}},{l:'全員 Lv120・装備Lv120',f:()=>{devEnd(120);dev31('全員Lv120（装備・星盤・天星盤も）');}},
  {l:'天極の星晶 +50',f:()=>{G.mats.seishou=(G.mats.seishou||0)+50;save();dev31('天極の星晶を50個受け取った');}},{l:'限界突破の画面',f:()=>V31.lbScreen(()=>dev31())},
  {l:'戻る',cls:'back',f:()=>dvMenu()}],true);}
{const _dv=dvMenu;dvMenu=function(m){_dv(m);try{addCmd(V31.VER+' クエスト・Lv120','クエスト制・天星盤・装備枠・エンドコンテンツ',dev31,0,'ready');}catch(e){}};}
try{devAreas=function(){devQuests();};}catch(e){}

return{QS,qById,qsOf,chOpen,qOpen,qStart,questMap,migQ,krQ,openChest,QM,render,qRank,bossOf,get QR(){return QR;},dev31,devEnd,devAll};})();
