/* ===== 星臨と奥義の見せ場のカットイン（SHOW。ver0.65 の正本） =====
 星臨：画面を暗く → 青白い星の帯が斜めに走り、大きな立ち絵が滑り込む → 星臨の名前。そのあと旧戦闘の光の柱（ver19 AWK）。
 奥義：白い閃光 → 金の帯 2 本・立ち絵・筆文字の大きな技名 → 明けてから技の演出（セレスは FXU）。
 速さ：×1 はたっぷり、×2・×4 は短く（それでも読める長さ）。旧戦闘の awaken / doAction を包むだけ。 */
'use strict';
const SHOW=(()=>{
const IMG={},esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function art(id,h){const k=id+h;if(IMG[k]!=null)return IMG[k];let s='';try{const f=SPX.unitCv(id,id,0,h);if(f){const c=document.createElement('canvas');c.width=f.w;c.height=f.h;c.getContext('2d').drawImage(f.cv,0,0);s=c.toDataURL();}}catch(e){}return IMG[k]=s;}
const K=()=>({1:1,2:.72,4:.5})[typeof speed!=='undefined'?speed:1]||1;
let el=null;
function cut(kind,u,title,label,ms){return new Promise(res=>{try{
 if(!el){el=document.createElement('div');el.id='show';document.body.appendChild(el);}
 const d=Math.round(ms*K());el.style.setProperty('--d',d+'ms');el.className='';void el.offsetWidth;
 el.innerHTML=`<i class="sh-dim"></i><i class="sh-flash"></i><div class="sh-band b1"></div><div class="sh-band b2"></div><i class="sh-stars"></i>
  <img class="sh-art" src="${art(u.id,220)}" alt=""><div class="sh-tt"><small>${esc(label)}</small><b>${esc(title)}</b><em>${esc(u.name)}</em></div>`;
 el.className=kind+' on';try{SFX.aw();}catch(e){}
 setTimeout(()=>{el.className=kind;res();},d);}catch(e){res();}});}
/* 星臨 */
{const _aw=awaken;awaken=async function(u){if(u&&u.side===0&&B&&!B.over){let nm='';try{nm=(RSD.AWX[u.id]||AW[u.id]||{}).n||AW[u.id].name||'';}catch(e){}await cut('aw',u,nm||'星臨','星臨',1500);}return _aw(u);};}
/* 奥義：js/rs/battle.js の heroExec が SHOW.cut('ou',…) を呼ぶ */
return{cut};})();
