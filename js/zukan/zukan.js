/* ===== 図鑑（一覧・詳細） ver0.30 =====
 一覧：敵・仲間・装備 → タップで詳細。
 詳細：キャラクタービューア（js/zukan/viewer.js）に「正面」「待機」「星臨」の 3 種だけを載せる（敵は 星臨 なし）。
  3 種は同じ縮尺・同じ足元・同じキャンバスで描き、デザイン・配色・体格・シルエットの公式な基準画像として扱う。
  （ver0.29 の 回転・正面/側面/背面の切り替え・自動回転・骨格表示・表情差分 は廃止）
  ・下部タブ：人物・技・星臨 の 3 種（敵は 人物・技）
  ・呼称・分類は TERMS（js/data/terms.js）に従う */
const ZUKAN=(()=>{
const ZK={t:'e',from:'home',dt:'prof',cat:'all',fam:'all'};
/* ver0.32 敵の系統：戦闘で使う原画（SPX のデータ id）から決める。原画の無い敵（旧リグ）はリグの名前から */
const FAMS=[['slime','スライム'],['beast','獣'],['dragon','竜'],['knight','騎士・武者'],['golem','巨像'],['spirit','霊・影'],['shroom','茸'],['jelly','海月'],['human','人型'],['other','その他']];
const FAMID={slime:'slime',wolf:'beast',goldwolf:'beast',drake:'dragon',boss9:'dragon',knight:'knight',gknight:'knight',golem:'golem',
 banjin:'spirit',shade:'spirit',icespirit:'spirit',bookghost:'spirit',shroom:'shroom',jelly:'jelly',queen:'human',ninja:'human'};
function famOf(k){const d=ED[k];if(!d)return'other';if(d.fam)return d.fam;let id='';
 try{const r=typeof SPX!=='undefined'&&SPX.parse(d.spr||k);if(r){id=r.id;if(SPX.D[id]&&SPX.D[id].kind==='hum'&&!FAMID[id])return'human';}}catch(e){}
 if(!id){try{const inf=SPRX.info(d.spr||k);id=inf&&inf.rig||'';}catch(e){}}
 return FAMID[id]||'other';}
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const DEV=()=>{try{return!!(G&&G.dev);}catch(e){return false;}};
const zkList=()=>({e:zkEnemies(),h:Object.keys(PROF),i:zkEquip()});
const seenE=k=>!!(G.zk&&G.zk.e[k]),seenI=x=>!!(G.zk&&G.zk.i[x.k]),joined=id=>G.members.includes(id);
const ELCH=(e,on=true)=>`<i class="zel${on?'':' off'}" style="--c:${ELC[e]||'#8890c0'}">${e}</i>`;
const icKey=x=>typeof IC21==='undefined'?null:x.k.startsWith('set:')?'S_'+x.k.split(':')[1]+'_'+x.k.split(':')[2]:'L_'+x.k;
const eqSlot=x=>x.k.startsWith('set:')?x.k.split(':')[2]:(LEG[x.k]&&LEG[x.k].slot);
function back(){ZVIEW.stop();if(ZK.from==='bar')tavern();else townMenu();}

/* ---------- 一覧 ---------- */
function list(m){if(typeof TSC!=='undefined'&&(TSC==='home'||TSC==='bar'))ZK.from=TSC==='home'?'home':'bar';ZVIEW.stop();G.zk=G.zk||{e:{},i:{}};G.inv.forEach(zkItem);
 const L=zkList(),ne=L.e.filter(seenE).length,nh=L.h.filter(joined).length,ni=L.i.filter(seenI).length,t=ZK.t;
 log((m||'<b>図鑑</b>　タップで詳細（正面・待機・星臨の基準画像）')+`<br><small>敵 ${ne}/${L.e.length}　${TERMS.CHAR.playable} ${nh}/${L.h.length}　装備 ${ni}/${L.i.length}</small>`);
 let body='';
 if(t==='e'){/* ver0.32：区分（通常敵／ボス）と系統で絞り込む。番号は全体の通し番号のまま */
  const inCat=k=>ZK.cat==='all'||(ZK.cat==='normal'?TERMS.charCat(k)==='normal':TERMS.charCat(k)!=='normal'),inFam=k=>ZK.fam==='all'||famOf(k)===ZK.fam;
  const fams=FAMS.filter(([f])=>L.e.some(k=>inCat(k)&&famOf(k)===f));if(ZK.fam!=='all'&&!fams.some(([f])=>f===ZK.fam))ZK.fam='all';
  const cnt=fn=>L.e.filter(fn).length;
  body=`<div class="zf32"><div class="zfc32">${[['all','すべて'],['normal','通常敵'],['boss','ボス']].map(([k,n])=>`<button class="${ZK.cat===k?'on':''}" data-a="cat" data-v="${k}">${n}<small>${cnt(x=>k==='all'||(k==='normal'?TERMS.charCat(x)==='normal':TERMS.charCat(x)!=='normal'))}</small></button>`).join('')}</div>
   <div class="zff32"><button class="${ZK.fam==='all'?'on':''}" data-a="fam" data-v="all">全系統</button>${fams.map(([f,n])=>`<button class="${ZK.fam===f?'on':''}" data-a="fam" data-v="${f}">${n}<small>${cnt(x=>inCat(x)&&famOf(x)===f)}</small></button>`).join('')}</div></div>`;
  const vis=L.e.map((k,i)=>[k,i]).filter(([k])=>inCat(k)&&inFam(k));
  body+='<div class="zgrid z23">'+vis.map(([k,i])=>{const s=seenE(k),c=TERMS.charCat(k);return`<button class="ztile${s?'':' un'}${c!=='normal'?' bs':''} zc-${c}" data-a="e" data-v="${k}"><em>${String(i+1).padStart(2,'0')}</em><img src="${zimg(k,!s)}" alt=""><span>${s?esc(ED[k].name):'？？？'}</span></button>`;}).join('')+'</div>'+(vis.length?'':'<div class="zn32">該当する敵がいない</div>');}
 if(t==='h')body='<div class="zhg">'+L.h.map(id=>{const j=joined(id);return`<button class="zhc${j?'':' un'}" data-a="h" data-v="${id}" style="--ec:${elCol(id)}"><img src="${j?art(id):zimg(id,1)}" alt=""><b>${j?esc(HB[id].name):'？？？'}</b><small>${j?esc(clsOf(id)):'未加入'}</small></button>`;}).join('')+'</div>';
 if(t==='i')body='<div class="zig">'+L.i.map((x,i)=>{const s=seenI(x),ik=icKey(x);return`<button class="zic${s?'':' un'}" data-a="i" data-v="${i}">${ik?`<img src="${s?IC21.render(ik,4):IC21.shadow(ik)}" alt="">`:''}<b>${s?esc(x.n):'？？？'}</b><small>${esc(TERMS.equipName(eqSlot(x)))}・${esc(x.t)}</small></button>`;}).join('')+'</div>';
 panel(`<div class="ftabs zt23" style="grid-template-columns:repeat(3,1fr)">${[['e','敵'],['h','仲間'],['i','装備']].map(([k,n])=>`<button class="${t===k?'on':''}" data-a="tab" data-v="${k}">${n}</button>`).join('')}</div>${body}<button class="tbtn back wide" data-a="back">戻る</button>`,
  {tab:k=>{ZK.t=k;list();},cat:k=>{ZK.cat=k;list();},fam:k=>{ZK.fam=k;list();},e:k=>detail('e',k,'prof'),h:id=>detail('h',id,'prof'),i:i=>detail('i',+i),back});}

/* ---------- 詳細 ---------- */
function detail(type,key,dt){const L=zkList()[type],idx=type==='i'?key:L.indexOf(key);if(idx<0)return;if(dt)ZK.dt=dt;
 const n=L.length,pv=type==='i'?(idx-1+n)%n:L[(idx-1+n)%n],nx=type==='i'?(idx+1)%n:L[(idx+1)%n];
 const h=type==='e'?enemyHTML(key):type==='h'?heroHTML(key):equipHTML(L[idx]);
 panel(`<div class="zd23 z29"><div class="zdh"><button class="zb" data-a="list">◀ 一覧</button><b>No.${String(idx+1).padStart(2,'0')}</b><span class="nv"><button data-a="go" data-v="${pv}" aria-label="前へ">◀</button><button data-a="go" data-v="${nx}" aria-label="次へ">▶</button></span></div>${h}</div>
  <button class="tbtn back wide" data-a="list">図鑑の一覧へ</button>`,
  {list:()=>{ZVIEW.stop();list();},go:v=>{ZVIEW.stop();detail(type,type==='i'?+v:v);},dt:v=>{ZK.dt=v;refreshBody(type,key);},
   mo:v=>{ZVIEW.setMotion(v);mark();},flip:()=>{ZVIEW.flipBattle();mark();},
   sk:v=>{const s=SK[v];if(s)try{V22.skInfo(s);}catch(e){}}});
 const c=$('#cmd .zv canvas');
 if(c){const ok=ZVIEW.start(c,type,key);if(!ok){const im=document.createElement('img');im.src=zimg(key);c.replaceWith(im);const zm=$('#cmd .zm');if(zm)zm.remove();}else{modeButtons();ZVIEW.onInfo=()=>mark();mark();}}
 else ZVIEW.stop();}
/* タブの中身だけ差し替える（回転ビューアは止めない） */
function refreshBody(type,key){const b=$('#cmd .zbody'),t=$('#cmd .zdt');if(!b||!t)return detail(type,key);
 const tmp=document.createElement('div');tmp.innerHTML=type==='e'?enemyHTML(key):heroHTML(key);
 const nb=tmp.querySelector('.zbody'),nt=tmp.querySelector('.zdt');if(nb)b.replaceWith(nb);if(nt)t.replaceWith(nt);}
/* 形態のボタン：素材にある形態だけ（敵は正面の原画がある場合だけ「正面」、星臨はプレイアブルキャラだけ） */
function modeButtons(){const zm=$('#cmd .zm');if(!zm)return;const ms=ZVIEW.modes();zm.style.gridTemplateColumns=`repeat(${ms.length},1fr)`;
 zm.innerHTML=ms.map(m=>`<button data-a="mo" data-v="${m}">${ZVIEW.NAMES[m]}</button>`).join('');}
/* ボタンの状態（選択中の形態・戦闘の向き） */
function mark(){const S=ZVIEW.S,cmd=$('#cmd');if(!cmd||!S.u)return;
 cmd.querySelectorAll('.zm [data-a="mo"]').forEach(b=>b.classList.toggle('on',b.dataset.v===S.motion));
 const ml=cmd.querySelector('.zvl');if(ml)ml.textContent=ZVIEW.NAMES[S.motion]||'';
 const f=cmd.querySelector('[data-a="flip"]');if(f){const d=FACING.of(S.key,S.u.side),def=FACING.base(S.key,S.u.side);f.innerHTML=`戦闘の向き：<b>${d==='L'?'左':'右'}</b>`;f.classList.toggle('on23d',d!==def);}}
const tabsH=L=>`<div class="zdt">${L.map(([k,n])=>`<button class="${ZK.dt===k?'on':''}" data-a="dt" data-v="${k}">${n}</button>`).join('')}</div>`;
function viewH(bg,aw){const mo=MOTION.ZUKAN.filter(m=>m!=='seirin'||aw);
 return`<div class="zv z29v z30v" style="--bg:${bg}"><canvas></canvas><span class="zvl">待機</span><button class="zfl fl" data-a="flip" title="戦闘でもこの向きで表示する">戦闘の向き</button></div>
 <div class="zm z29m" style="grid-template-columns:repeat(${mo.length},1fr)">${mo.map(m=>`<button data-a="mo" data-v="${m}">${ZVIEW.NAMES[m]}</button>`).join('')}</div>`;}
function habitat(k){const o=[];try{for(const id in AREAS){const A=AREAS[id];if(!A||!A.name)continue;const g=[...(A.groups||[]),...(A.libGroups||[])];if(g.some(x=>x.includes(k))||(A.boss&&A.boss.kind===k))o.push(A.name);}}catch(e){}
 if(typeof TMOBS!=='undefined'&&TMOBS.includes(k))o.push('天への塔');return[...new Set(o)];}
const TGT={one:'単体',all:'全体',ally:'味方単体',self:'自分'};
function skRow(k,s,right,owner,btn=true){const[el,ec]=skBadge(s);return`<${btn?'button':'div'} class="zsk"${btn?` data-a="sk" data-v="${k}"`:''}><span class="el"><i class="zel" style="--c:${ec}">${el}</i></span><b>${esc(s.n)}</b>${TERMS.skillChip(s,owner)}<small>${esc(s.d||'')}</small><em>${right||''}</em></${btn?'button':'div'}>`;}

function enemyHTML(k){const d=ED[k],s=seenE(k)||DEV(),n=(G.zk.e[k]|0);if(!['prof','sk'].includes(ZK.dt))ZK.dt='prof';const cat=TERMS.charCat(k);
 const head=`<div class="zdn"><b>${s?esc(d.name):'？？？'}</b>${TERMS.charChip(k)}<small>${s?'撃破 '+n+'体':'未撃破'}</small></div>`;
 if(!s)return head+`<div class="zv un"><img src="${zimg(k,1)}" alt=""></div><div class="zno">まだ倒したことがない${TERMS.CHAR[cat]}。倒すとドット絵・能力・技が記録される。${habitat(k).length?`<br>出現：${habitat(k).map(esc).join('・')}`:''}</div>`;
 let body='';
 if(ZK.dt==='prof'){const st=[['HP',d.mhp],['攻撃',d.atk],['防御',d.def],['魔力',d.mag],['精神',d.res],['速さ',d.spd]];
  body=`<div class="zst">${st.map(([a,v])=>`<div><small>${a}</small><b>${v}</b></div>`).join('')}</div>
  <dl class="dl22"><dt>区分</dt><dd>${TERMS.CHAR[cat]}</dd><dt>弱点</dt><dd>${(d.weak||[]).map(e=>ELCH(e)).join('')||'なし'}</dd>${d.resist?`<dt>耐性</dt><dd>${d.resist.map(e=>ELCH(e)).join('')}<small class="z29n">（${TERMS.DMG.resist.n}：×${TERMS.DMG.resist.mul}）</small></dd>`:''}
  <dt>落とす物</dt><dd>${[...new Set((d.drop||[]).map(([m])=>MATS[m]?MATS[m].n:m))].map(esc).join('・')||'なし'}</dd>
  <dt>出現</dt><dd>${habitat(k).map(esc).join('・')||'特別な戦い'}</dd>${d.xp?`<dt>報酬</dt><dd>経験値 ${d.xp}・${d.gold}G</dd>`:''}</dl>`;}
 if(ZK.dt==='sk'){const ai=d.ai,acts=(ai?ai.acts:d.acts)||[],rows=acts.map(([a,w])=>[a,Math.round(w*100)+'%']);if(ai&&ai.charge)rows.push([ai.charge,`${ai.every}ターンごとに溜めて放つ`]);
  body=`<div class="zsl">${rows.map(([a,w])=>{const e=EA[a];if(!e)return'';const c=TERMS.enemyActCat(e);return`<div class="zsk"><span class="el">${e.el?ELCH(e.el):'<i class="zel" style="--c:#c8c8d8">無</i>'}</span><b>${esc(e.n)}</b>${TERMS.chip('s-'+TERMS.SKILL[c].g,TERMS.SKILL[c].n)}<small>${TGT[e.t]||'―'}・威力${e.pow||'―'}</small><em>${esc(w)}</em></div>`;}).join('')}</div>
  ${ai&&ai.summon&&ED[ai.summon]?`<div class="zno">HPが半分を切ると「${esc(ED[ai.summon].name)}」を呼び出す</div>`:''}
  <div class="zno">${TERMS.DMG.weak.lb}：弱点を突くと ×${TERMS.DMG.weak.mul}　${TERMS.DMG.resist.lb}：耐性のある属性は ×${TERMS.DMG.resist.mul}　${TERMS.DMG.crit.lb}：会心で ×${TERMS.DMG.crit.mul}<br>溜めの次の手番は大技が来るので、防御で備えよう。</div>`;}
 return head+viewH('#3a1a3a',false)+tabsH([['prof','人物'],['sk','技']])+`<div class="zbody">${body}</div>`;}

function heroHTML(id){const j=joined(id)||DEV(),P=PROF[id],hb=HB[id];if(!['prof','sk','aw'].includes(ZK.dt))ZK.dt='prof';
 const head=`<div class="zdn" style="--ec:${elCol(id)}">${elOf(id)?ELCH(elOf(id)):''}<b>${j?esc(hb.name):'？？？'}</b>${TERMS.charChip(id)}<small>${j&&G.h[id]?'Lv'+G.h[id].lv+'　'+esc(clsOf(id)):'未加入'}</small></div>`;
 if(!j)return head+`<div class="zv un"><img src="${zimg(id,1)}" alt=""></div><div class="zno">加入条件：${esc(P[3])}</div>`;
 let body='';
 if(ZK.dt==='prof'){let s=null;try{s=stats(id);}catch(e){}const gr=hb.g||{};const st=[['HP','mhp'],['攻撃','atk'],['防御','def'],['魔力','mag'],['精神','res'],['速さ','spd']];
  body=`<div class="zpf"><img src="${art(id)}" alt=""><div><div class="zq">「${esc(P[2])}」</div><dl class="dl22"><dt>年齢・身分</dt><dd>${esc(P[0])}</dd><dt>職・武器・属性</dt><dd>${esc(P[1])}</dd><dt>加入</dt><dd>${esc(P[3])}</dd></dl></div></div>
  <div class="zst">${st.map(([a,k])=>`<div><small>${a}<i>${gr[k]||''}</i></small><b>${s?Math.round(s[k]):hb[k]}</b></div>`).join('')}</div>`;}
 if(ZK.dt==='sk'){const have=new Set(skillList(id)),src={};(hb.skills||[]).forEach(k=>src[k]='初期');((typeof V20!=='undefined'&&V20.LSK[id])||[]).forEach(([l,k])=>src[k]=src[k]||'Lv'+l);
  try{for(const p in BOARD[id]){const nd=BOARD[id][p];if(nd&&nd.t==='skill')src[nd.v]=src[nd.v]||'星盤';}}catch(e){}
  const ks=Object.keys(src).filter(k=>SK[k]&&TERMS.skillCat(k,id)!=='seirin'),grp=g=>ks.filter(k=>TERMS.SKILL[TERMS.skillCat(k,id)].g===g);
  const row=k=>{const s=SK[k],ok=have.has(k);return skRow(k,s,ok?(s.sp?'SP'+s.sp:'習得'):esc(src[k]),id).replace('class="zsk"',`class="zsk${ok?'':' off'}"`);};
  const atk=ATK({id,aw:false,atkEl:null,elem:MAG(id)?null:'斬'});
  let ps='';try{const cp=V20.charPS(id),w=G.h[id]&&G.h[id].eq.w&&findItem(G.h[id].eq.w),wp=V20.wpOf(w);
   ps=cp.map(p=>{const P2=V20.PS[p.id];return`<div class="zsk${p.on?'':' off'}"><span class="el"><i class="zel" style="--c:#c8b0ff">常</i></span><b>${esc(P2.n)}</b>${TERMS.chip('s-passive',TERMS.SKILL.passive.n)}<small>${esc(P2.d)}</small><em>${p.on?'専用':'Lv'+p.lv}</em></div>`;}).join('')+
    (wp?`<div class="zsk"><span class="el"><i class="zel" style="--c:#c8b0ff">常</i></span><b>${esc(wp.n)}</b>${TERMS.chip('s-passive',TERMS.SKILL.passive.n)}<small>${esc(wp.d)}</small><em>武器</em></div>`:'');}catch(e){}
  body=`<div class="zsh">${TERMS.GROUP.phys}・${TERMS.GROUP.mag}の基本</div><div class="zsl">${skRow('',atk,'',id,false)}${skRow('',GUARD,'',id,false)}</div>
  ${grp('phys').length?`<div class="zsh">${TERMS.GROUP.phys}</div><div class="zsl">${grp('phys').map(row).join('')}</div>`:''}
  ${grp('mag').length?`<div class="zsh">${TERMS.GROUP.mag}</div><div class="zsl">${grp('mag').map(row).join('')}</div>`:''}
  ${ps?`<div class="zsh">${TERMS.SKILL.passive.n}</div><div class="zsl">${ps}</div>`:''}`;}
 if(ZK.dt==='aw'){const A=AW[id],lv=(G.h[id]&&G.h[id].awLv)||1,cm=[...(A.cmds||[]),'goku'+id].filter(k=>SK[k]);
  body=`<div class="zaw"><b>「${esc(A.name)}」</b><small>${esc(A.type||'')}　位階${ROMAN[lv]}　${'★'.repeat(lv)}${'☆'.repeat(3-lv)}</small><p>${esc(SEIRIN.lore)}</p></div><div class="zsl">${cm.map(k=>skRow(k,SK[k],/^goku/.test(k)?'位階Ⅲ':SK[k].gauge?'ゲージ'+SK[k].gauge:'',id)).join('')}</div>`;}
 return head+viewH(elCol(id),!!AW[id])+tabsH([['prof','人物'],['sk','技'],['aw',SEIRIN.n]])+`<div class="zbody">${body}</div>`;}

function equipHTML(x){const s=seenI(x)||DEV(),ik=icKey(x),L0=x.k.startsWith('set:')?null:LEG[x.k],who=L0&&L0.who&&HB[L0.who]?HB[L0.who].name:'',sl=eqSlot(x);
 return`<div class="zdn"><b>${s?esc(x.n):'？？？'}</b>${TERMS.equipChip(sl)}<em class="it">${esc(x.t)}</em></div><div class="zeq">${ik?`<img src="${s?IC21.render(ik,4):IC21.shadow(ik)}" alt="">`:''}</div>
  ${s?`<dl class="dl22"><dt>分類</dt><dd>${esc(TERMS.equipName(sl))}${SLOTN[sl==='acc'?'acc1':sl]?'（'+esc(SLOTN[sl==='acc'?'acc1':sl].replace(/^.*・/,'').replace(/\d$/,''))+'）':''}</dd><dt>種別</dt><dd>${esc(x.t)}</dd>${who?`<dt>専用</dt><dd>${esc(who)}</dd>`:''}<dt>効果</dt><dd>${esc(x.d)}</dd></dl>`:'<div class="zno">まだ手に入れていない。強敵や宝箱、絆の物語から手に入ることがある。</div>'}`;}

/* 入口（ホーム・酒場・開発者メニューから呼ばれる関数を差し替える） */
zkMenu=list;zkEnemy=k=>detail('e',k,'prof');zkHero=id=>detail('h',id,'prof');
return{famOf,FAMS,list,detail,ZK};})();
