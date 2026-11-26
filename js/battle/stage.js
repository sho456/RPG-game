/* ===== 章のステージを ver0.49 のロマサガRS風の戦闘で戦う（STG。ver0.63 でコマンド戦闘 js/cb/* を置き換えた正本） =====
 出撃準備（js/td/menu.js の prep）→ STG.run(id, 仲間4人) → WAVE ごとに startBattle（旧戦闘。進行は js/rs/battle.js ほかの上書きの連鎖）
 → 勝てば次の WAVE（HP・LP は持ち越し、倒れた仲間は HP20% で起きる）→ 最後に TDM.settle（報酬）と結果の窓 → TDM.after。
 WAVE の読み替え：TD の大群を 1 戦 4 体までに（雑魚は数を 1/3・ボスは必ず・ボスの WAVE は取り巻き 2 体まで）。天への塔は毎回作る。
 星：勝利・誰も倒れない・規定ターン以内。 */
'use strict';
const STG=(()=>{
let R=null;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const isBoss=k=>{const e=ED[k];return!!(e&&(e.boss||k==='ernaE'||k==='valkE'));};
function wavesOf(S){return S.waves.map(w=>{const L=[];for(const[k,n]of w.e){if(!ED[k])continue;const b=isBoss(k),c=b?1:Math.max(1,Math.round(n/3));for(let i=0;i<c;i++)L.push({k,b});}
 L.sort((a,c)=>c.b-a.b);const out=[];for(const x of L){if(out.length>=4)break;if(!x.b&&out.length&&isBoss(out[0])&&out.length>=3)break;out.push(x.k);}return out;});}
function infWave(S,i){const pick=L=>L[Math.floor(Math.random()*L.length)];if((i+1)%5===0)return[pick(S.bosses),pick(S.pool)];const n=i<10?3:4,o=[];for(let k=0;k<n;k++)o.push(pick(S.pool));return o;}
/* TD の背景の型 → 旧戦闘の背景 */
const TH={ash:'ash',forest:'lib',chapel:'chapel',storm:'mine',ice:'shrine',ruin:'ruin',tower:'tower',void:'void'};
function run(id,party){const S=TDD.STAGE[id];if(!S)return;
 G.party=party.slice(0,4);for(const p of G.party)if(G.h[p])G.h[p].lp=null;healAll();
 R={id,S,wave:0,waves:S.inf?[]:wavesOf(S),turns:0,fell:0};R.par=S.inf?999:R.waves.length*3+(S.boss?4:1);
 try{save();}catch(e){}wave();}
function wave(){const S=R.S,i=R.wave,ks=S.inf?infWave(S,i):R.waves[i];if(S.inf)R.waves[i]=ks;const lv=S.lv+(S.inf?i*2:0);
 const list=ks.map(k=>({kind:k,lv}));
 startBattle(list,{boss:ks.some(isBoss),theme:TH[S.th]||'ash',quest:true,stg:1,stageLv:lv});}
/* 旧戦闘の終わり：ステージのときは WAVE を続けるか結果へ */
{const _e=end;end=async function(win){if(!(R&&B&&B.opts&&B.opts.stg))return _e(win);
 B.over=true;$('#cmd').innerHTML='';R.turns+=B.turn||0;
 for(const h of B.heroes){const s=G.h[h.id];if(!s)continue;if(!h.alive||h.hp<=0)R.fell++;s.hp=Math.max(h.hp,Math.ceil(h.mhp*.2));if(h.lp!=null)s.lp=h.lp;}
 if(win&&(R.S.inf||R.wave+1<R.waves.length)){R.wave++;try{save();}catch(e){}await wait(500);return wave();}
 finish(win);};}
function finish(win){const id=R.id,S=R.S,o={win,stars:[win?1:0,win&&!R.fell?1:0,win&&R.turns<=R.par?1:0],wave:R.wave};
 for(const p of G.party)if(G.h[p]){G.h[p].hp=null;G.h[p].lp=null;}
 let Q={rw:{xp:0,gold:0},first:false,chips:''};try{Q=TDM.settle(id,{over:o});}catch(e){console.error(e);}
 const ov=$('#ov');ov.className='';ov.classList.remove('hide');
 let html=Q.sheet;
 if(!html){const goals=[['勝利',o.stars[0]],['誰も倒れない',o.stars[1]],[`${R.par} ターン以内`,o.stars[2]]];
  html=`<h3>${win?'勝利':'敗北'}</h3><div class="sub">${esc(TDM.chOf(id).ch)}・${esc(S.name)}</div>
  <div class="td-stars">${o.stars.map(s=>`<i class="${s?'on':''}"></i>`).join('')}</div><ul class="td-goal">${goals.map(([t,s])=>`<li class="${s?'on':''}">${esc(t)}</li>`).join('')}</ul>
  ${win?`<div class="td-rw"><span>経験値 <b>${Q.rw.xp}</b></span><span>ゴールド <b>${Q.rw.gold}</b></span>${Q.first?'<span>初回</span>':''}${Q.chips||''}</div>`:''}
  <div class="td-acts"><button class="td-btn" data-a="again">もう一度</button>${win?`<button class="td-btn on" data-a="next">次へ</button>`:`<button class="td-btn" data-a="map">戻る</button>`}</div>`;}
 ov.innerHTML=`<div class="stg-res"><div class="td-panel">${html}</div></div>`;
 try{TDM.cleared(id,win,Q.first);}catch(e){}
 ov.onclick=e=>{const a=e.target.closest('[data-a]');if(!a)return;e.stopPropagation();const k=a.dataset.a;ov.onclick=null;ov.classList.add('hide');ov.innerHTML='';
  const prev=G.party.slice();R=null;
  if(k==='again')return TDM.prep(id);if(k==='next')return TDM.after(id,true);return TDM.after(id,false);};}
/* 背景：ver0.62 で描き込んだ 8 テーマ（TDBG）を旧戦闘の小さな画面（幅 W=180・高さ H は画面に合わせて変わる）に合成。
 地面の始まり（TDBG.GT）を高さの 30%、TDBG の下端を画面の下端に合わせ、横は中央（キャラの立つ所）を切り出す */
const BGC={};
function tdBg(th){const key=th+'|'+H;if(BGC[key])return BGC[key];const kk=.7*H/(420-TDBG.GT),ox=210-W/2/kk,oy=.3*H-TDBG.GT*kk;
 const L=TDBG.make({S:{W:420,th}},300),c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
 g.fillStyle=L.P.sky[0];g.fillRect(0,0,W,H);g.imageSmoothingEnabled=kk<1;g.setTransform(kk,0,0,kk,-ox*kk,oy);
 g.drawImage(L.sky,40,0);g.drawImage(L.far,40,0);g.drawImage(L.mid,40,0);g.drawImage(L.ground,0,0);
 g.setTransform(1,0,0,1,0,0);g.fillStyle='rgba(7,7,26,.12)';g.fillRect(0,0,W,H);return BGC[key]=c;}
{const _mb=makeBg;makeBg=function(th,boss){if(scene==='battle'&&R&&typeof TDBG!=='undefined'){try{return tdBg(R.S.th||'ash');}catch(e){console.error(e);}}return _mb(th,boss);};}
function hide(){/* 旧戦闘の画面はホーム・地図が上書きする */}
return{run,hide,wavesOf,get cur(){return R;}};})();
