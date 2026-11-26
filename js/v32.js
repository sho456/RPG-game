/* ===== ver0.32 図鑑の絞り込み・敵の大きさ・向き・クエスト情報 =====
 1. 図鑑：敵の一覧を「区分（通常敵／ボス）」と「系統（スライム・獣・竜…）」で絞り込める（js/zukan/zukan.js の famOf・FAMS）
 2. 戦闘：通常敵の見た目の大きさを、極端に変わらないようにそろえる（ボス・中ボスは除く）。
    見た目の大きさ＝絵の不透明な範囲の面積の平方根。基準 S0 からの差を EXP 乗に縮める（小さい敵は少し大きく、大きい敵は少し小さく）
 3. 向き：出撃前の画面（クエストの上の場面）も戦闘と同じ原画・同じ向き（FACING）。戦闘の見た目のキー（tr_○○）でも図鑑の向きが効く
 4. 対峙：味方は左・敵は右を向き、必ず向かい合う。原画の差し替えで古くなった「戦闘の向き」の設定は一度だけ消す（G.zdirV）
 5. クエスト：選ぶと専用の「クエスト情報」タブに移る（js/v31/quests.js の renderInfo） */
'use strict';
const V32=(()=>{
const VER='ver0.32';
/* ---------- 2. 通常敵の大きさ ---------- */
const S0=50,EXP=.4;
const SIZE=new Map();/* 見た目のキー → 倍率 */
function visSize(u){const A=ANIM.setup(u);const f=SPRX.frame(A.name,ANIM.base(A),A.palKey,A.pal,A.flip,1,A.extra);if(!f||!f.cv)return 0;
 const c=f.cv,d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let x0=1e9,x1=-1,y0=1e9,y1=-1;
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>8){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
 return x1<0?0:Math.sqrt((x1-x0+1)*(y1-y0+1));}
function sizeK(e){const key=e.spr||e.kind;if(SIZE.has(key))return SIZE.get(key);if(typeof SPX==='undefined'||!SPX.ready)return 1;let k=1;
 try{const r=SPX.parse(key);/* 味方と同じ絵の人型の敵（決闘のエルナなど）は、味方と同じ大きさの規格のまま */
  if(!(r&&SPX.D[r.id].kind==='hum')){const u={kind:e.kind,side:1,spr:key,name:'',x:0,y:0,sc:1,alive:true,hp:1,mhp:1,boss:false,sts:[]};const s=visSize(u);if(s>0)k=S0*Math.pow(s/S0,EXP)/s;}}catch(x){console.error(x);}
 k=Math.max(.75,Math.min(1.35,k));SIZE.set(key,k);return k;}
{const _en=enemy;enemy=function(kind,lv,x,y,suf=''){const e=_en(kind,lv,x,y,suf);try{if(!e.boss&&!(ED[kind]&&ED[kind].boss))e.sc=+(e.sc*sizeK(e)).toFixed(3);}catch(x){console.error(x);}return e;};}
/* ---------- 3・4. 向き ---------- */
try{FACING.resetAlias();}catch(e){}
{const _mg=migrate;migrate=function(g){const r=_mg(g);try{const t=r||g;if((t.zdirV||0)<32){t.zdir={};t.zdirV=32;}}catch(e){console.error(e);}return r;};}
/* ---------- 版表示・お知らせ ---------- */
const NEWS=`<div class="nt"><b>${VER}</b><br><small>・<b>原画</b>：${TERMS.CHAR.playable}12人と狼の系統を新しい原画に。全員の大きさを「足元から目までの高さ×体格」の規格にそろえた<br>`+
 `・<b>図鑑</b>：絵を枠の中央に。敵は「通常敵／ボス」と系統で絞り込める<br>・<b>戦闘</b>：通常敵の大きさが極端に違わないように<br>`+
 `・<b>出撃前</b>：クエストを選ぶと「クエスト情報」タブへ。出現する敵とパーティが向かい合う（図鑑で設定した向きも反映）</small></div>`;
document.addEventListener('click',()=>{setTimeout(()=>{try{const o=document.querySelector('.nw22');if(o&&!o.querySelector('.n32')){const d=document.createElement('div');d.className='n32';d.innerHTML=NEWS;const h=o.querySelector('.nh');h?h.after(d):o.prepend(d);}}catch(e){}},0);},true);
{const _t=title;title=function(){_t();const v=$('#verL');if(v)v.textContent=VER;};const v=$('#verL');if(v)v.textContent=VER;}
try{document.title='アストラル・ブレイカー '+VER;}catch(e){}
return{VER,S0,EXP,sizeK,SIZE};})();
