/* ===== ver0.30 図鑑の基準画像・星臨の縮尺統一・素材制作パイプライン =====
 1. 図鑑：正面・待機・星臨の 3 種だけを、同じ縮尺・同じ足元・同じキャンバスで表示（js/zukan/viewer.js）
 2. 星臨の縮尺：旧データの星臨（セレス・シオン・バルザ・ハクア・エルナ）が通常の姿より 1.1〜1.3 倍大きかったのを、
    assets_src/character_scale.json の倍率でデータごと作り直した（戦闘・図鑑の両方に効く）
 3. 一覧：黒炎竜ヴォルガノンのサムネイルが小さかった（一覧用の中間サイズが無かった）のを、一覧用サイズを足して修正
 4. 開発者メニュー「基準画像の並び」：全キャラの 正面・待機・星臨 を同じ縮尺で並べ、足元の線をそろえて確認する
 素材制作の手順は docs/PIPELINE.md、データ形式は docs/ASSETS.md */
const V30=(()=>{
const VER30='ver0.30';
const NEWS30=`<div class="nt"><b>${VER30}</b>　図鑑と${SEIRIN.n}の見た目を整えました。<br><small>・図鑑：キャラクターの絵を「正面・待機・${SEIRIN.n}」の 3 種にしぼり、どれも同じ大きさ・同じ足元で表示します。<br>・${SEIRIN.n}の姿が通常より大きく描かれていた仲間（セレス・シオン・バルザ・ハクア・エルナ）を、通常の姿と同じ体格に直しました（戦闘でも同じ）。<br>・図鑑の一覧で黒炎竜ヴォルガノンが小さく表示されていたのを直しました。</small></div>`;
document.addEventListener('click',e=>{const t=e.target.closest('[data-h22="news"]');if(!t||scene!=='town')return;
 setTimeout(()=>{try{const o=document.querySelector('.nw22');if(o&&!o.querySelector('.n30')){const d=document.createElement('div');d.className='n30';d.innerHTML=NEWS30;const h=o.querySelector('.nh');h?h.after(d):o.prepend(d);}}catch(e){}},0);},true);

/* ---------- 基準画像の並び（ゲーム内の品質確認） ----------
 素材サイズ sk を全員そろえ、1 ドット＝端末の z 画素で描く。赤い線＝足元（ay）。
 確認する所：通常と星臨の体格（頭の大きさ・肩の高さ）、足元の線、向き、配色の差 */
function lineup(sk='b60',cssW=360){const D=SPX.D,ids=Object.keys(D).filter(k=>D[k].kind==='hum'&&!k.endsWith('_K')&&D[k].sizes[sk]);
 const dpr=Math.max(1,Math.round(devicePixelRatio||1)),pad=6;
 const rows=ids.map(id=>{const t=[['正面',id,'front'],['待機',id,'stance']];if(D[id+'_K']&&D[id+'_K'].sizes[sk])t.push([SEIRIN.n,id+'_K','awk']);
  return{id,t:t.map(([n,cid,nm])=>{const f=SPX.cut(cid,sk,'',nm,false,0,0);return f?{n,f}:null;}).filter(Boolean)};});
 const W=Math.max(...rows.map(r=>r.t.reduce((a,x)=>a+x.f.w+pad,0)))+40,rowH=rows.map(r=>Math.max(...r.t.map(x=>x.f.ay+1))+14);
 /* 倍率：表示幅に収まる最大の整数倍（1 ドット＝z 画素。拡大は整数倍だけなのでドットが崩れない） */
 const z=Math.max(1,Math.floor(cssW*dpr/W));
 const c=document.createElement('canvas');c.width=W*z;c.height=rowH.reduce((a,b)=>a+b,0)*z;c.style.width=(c.width/dpr)+'px';c.style.maxWidth='none';
 const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#14182e';g.fillRect(0,0,c.width,c.height);g.font=`${Math.round(Math.min(9*z,10*dpr))}px sans-serif`;
 let y=0;rows.forEach((r,i)=>{const base=y+rowH[i]-4;g.fillStyle='#ffe9a0';g.fillText((HB[r.id]||{}).name||r.id,2*z,(y+9)*z);let x=40;
  for(const{n,f}of r.t){g.drawImage(f.cv,(x)*z,(base-f.ay-1)*z,f.w*z,f.h*z);g.fillStyle='rgba(255,80,80,.9)';g.fillRect(x*z,base*z,f.w*z,Math.max(1,z>>1));g.fillStyle='#9aa4d8';g.fillText(n,x*z,(y+9)*z);x+=f.w+pad;}
  y+=rowH[i];});
 return c;}
function showLineup(sk){if(typeof SPX==='undefined'||!SPX.ready){dev30('素材の読み込み中');return;}
 log(`<b>基準画像の並び</b>　素材 ${sk}・全員同じ縮尺（赤線＝足元）`);
 const sizes=['b42','b48','b54','b60','b66','B84'];
 panel(`<div class="zm z29m" style="grid-template-columns:repeat(${sizes.length},1fr)">${sizes.map(s=>`<button class="${s===sk?'on':''}" data-a="sz" data-v="${s}">${s}</button>`).join('')}</div><div class="ln30" style="overflow:auto;max-height:62vh;margin:6px 0;border-radius:8px"></div><button class="tbtn back wide" data-a="back">戻る</button>`,
  {sz:v=>showLineup(v),back:()=>dev30()});
 try{const box=$('#cmd .ln30');box.appendChild(lineup(sk,Math.max(200,box.clientWidth-4)));}catch(e){console.error(e);}}
function dev30(m){log(m||`<b>${VER30}</b>　図鑑の基準画像・${SEIRIN.n}の縮尺の確認`);
 menu([{l:'図鑑を開く',s:'正面・待機・星臨（全員解放）',cls:'ready',f:()=>{try{G.zk=G.zk||{e:{},i:{}};zkEnemies().forEach(k=>G.zk.e[k]=G.zk.e[k]||1);}catch(e){}zkMenu();}},
  {l:'基準画像の並び',s:'全員の 正面・待機・星臨 を同じ縮尺で',f:()=>showLineup('b60')},
  {l:`${SEIRIN.n}の縮尺を戦闘で確認`,s:'セレス・シオン・バルザ・ハクア（開発者モードは即星臨できる）',f:()=>{const ids=['celes','shion','balza','hakua'].filter(id=>G.h[id]);for(const id of ids)if(!G.members.includes(id))G.members.push(id);if(ids.length)G.party=ids.slice(0,4);devBattle([{kind:'slime',lv:5},{kind:'boss9',lv:68}],'ryuu',{theme:'lava'});}},
  {l:'黒炎竜ヴォルガノン戦',s:'大型の敵の表示',f:()=>devBattle([{kind:'boss9',lv:68}],'ryuu',{theme:'lava'})},
  {l:'戻る',cls:'back',f:()=>dvMenu()}],true);}
{const _dv=dvMenu;dvMenu=function(m){_dv(m);try{addCmd(VER30+' 図鑑・縮尺','基準画像（正面・待機・星臨）・星臨の縮尺・ヴォルガノン',dev30,0,'ready');}catch(e){}};}
{const _t=title;title=function(){_t();const v=$('#verL');if(v)v.textContent=VER30;};const v=$('#verL');if(v)v.textContent=VER30;}
try{document.title='アストラル・ブレイカー '+VER30;}catch(e){}
return{VER30,NEWS30,dev30,lineup,showLineup};})();
