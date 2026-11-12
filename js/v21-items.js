/* ===== ver0.21 装備・アイテムのドット絵（24×24）を全面刷新 =====
 ・すべての装備・道具・素材・宝石に、個別に設計した手描きグリッドを持たせる（色違いの使い回しをしない）
 ・武器は「刃の長さ方向×幅のレーン」で描いた横長グリッドを 45°の斜めに写す（ドットが崩れない）
 ・左右対称の防具・道具は左半分だけ描き、右半分は自動で反転（右側は影色に置き換えて立体感を出す）
 ・輪郭線は隣の色の最暗部（ver0.18 のドット絵エンジン準拠）。レアリティが高いほど光の縁取りときらめきが増える
 ・アイテムの判定は「レジェンド／専用（leg）→セット（set）→名前の種類＋素材（銅・鉄・鋼・星鋼）」の順。
   データ（名前・ID・性能）は一切書き換えない */
'use strict';
const IC21=(()=>{
const N=24;
/* 色の指定：スロットk（0〜5）ごとに 明・中・暗 の3文字。大文字A〜Fは最暗。w=白 s=淡い白 x=黒 */
const SL='abcdefghijklmnopqr';
const MC=new Map();
function cmap(S){const ck=S.join(',');let m=MC.get(ck);if(m)return m;m={};S.forEach((h,k)=>{if(!h)return;const r=ramp(h);m[SL[3*k]]=r[0];m[SL[3*k+1]]=r[1];m[SL[3*k+2]]=r[2];m['ABCDEF'[k]]=r[3];});
 m.w=C('#ffffff');m.s=C('#fff4d0');m.x=C('#120e1a');MC.set(ck,m);return m;}
const MIR={};for(let k=0;k<6;k++){MIR[SL[3*k]]=SL[3*k+2];}
const lane=j=>[Math.ceil(j/2),Math.floor(j/2)];
/* グリッドを大きめの作業用 Buf（40×40、原点+8）に描き、あとで24×24の中央へ寄せる */
const WB=40,OF=8;
function paint(b,d){const M=cmap(d.S),g=d.g||[],P=(x,y,c)=>b.px(x+OF,y+OF,c);
 if(d.dr){const t=new Buf(N,N);d.dr(t,M);b.blit(t,OF,OF);}
 if(d.m==='d'){const h=g.length,c0=(h-1)>>1;g.forEach((r,row)=>{const j=row-c0,[dx,dy]=lane(j);for(let i=0;i<r.length;i++){const c=M[r[i]];if(c)P(2+i+dx,21-i+dy,c);}});}
 else if(d.m==='m'){/* 24列いっぱいだと輪郭が切れるので、最左列を使う図は1列詰める */const x0=g.some(r=>r[0]&&r[0]!=='.')?1:0;g.forEach((r,y)=>{r=r.padEnd(12,'.');for(let x=x0;x<12;x++){const ch=r[x];if(ch==='.')continue;const c=M[ch];if(c)P(x,y,c);const c2=M[MIR[ch]||ch];if(c2)P(23-x,y,c2);}});}
 else g.forEach((r,y)=>{for(let x=0;x<r.length;x++){const c=M[r[x]];if(c)P(x,y,c);}});
 if(d.o)d.o.forEach(([x,y,ch])=>{const c=M[ch];if(c)P(x,y,c);});}
function bounds(b){let x0=b.w,y0=b.h,x1=-1,y1=-1;for(let y=0;y<b.h;y++)for(let x=0;x<b.w;x++)if(b.d[y*b.w+x]){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}return[x0,y0,x1,y1];}
/* 中央寄せ（d.ax/d.ay で微調整） */
function center(w,d){const[x0,y0,x1,y1]=bounds(w),o=new Buf(N,N);if(x1<0)return o;const dx=Math.floor((N-(x1-x0+1))/2)-x0+(d.ax||0),dy=Math.floor((N-(y1-y0+1))/2)-y0+(d.ay||0);o.blit(w,dx,dy);return o;}
const A8=(hex,a)=>{const c=C(hex);return((c&0x00ffffff)|((a&255)<<24))>>>0;};
/* 光の縁取り：輪郭のさらに外側に半透明の色 */
function aura(b,hex,a=110){const s=b.d,o=new Uint32Array(s),c=A8(hex,a);for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(s[y*N+x])continue;const n=b.get(x+1,y)||b.get(x-1,y)||b.get(x,y+1)||b.get(x,y-1);if(n)o[y*N+x]=c;}b.d=o;return b;}
/* きらめき（空いている場所にだけ置く） */
function spark(b,x,y,hex,big){const free=(u,v)=>u>=0&&v>=0&&u<N&&v<N&&!b.get(u,v);const pts=big?[[0,0],[1,0],[-1,0],[0,1],[0,-1],[2,0],[-2,0],[0,2],[0,-2]]:[[0,0],[1,0],[-1,0],[0,1],[0,-1]];
 if(!pts.every(([u,v])=>free(x+u,y+v)))return false;const c=C(hex),w=C('#ffffff');pts.forEach(([u,v])=>b.px(x+u,y+v,u||v?c:w));return true;}
const SPOTS=[[2,2],[21,21],[3,20],[20,3],[2,11],[21,12],[11,1],[12,22]];
function sparks(b,n,hex,big){let k=0;for(const[x,y]of SPOTS){if(k>=n)break;if(spark(b,x,y,hex,big&&k===0))k++;}}
const RARC=['#d8d8d8','#6fdc7f','#6fb2ff','#c08cff','#ffa040'];
const CACHE=new Map();
function render(key,rar=0){const ck=key+'|'+rar;let u=CACHE.get(ck);if(u)return u;const d=DES[key]||DES['armor_鉄'];const w=new Buf(WB,WB);paint(w,d);let b=center(w,d);b.outline();
 if(d.fx)d.fx(b,cmap(d.S));
 if(d.glow)aura(b,d.glow,d.ga||120);else if(rar>=3)aura(b,RARC[rar],rar>=4?120:85);
 const ns=Math.max(d.sp||0,rar>=4?2:rar>=3?2:rar>=2?1:0);if(ns)sparks(b,ns,d.spc||RARC[Math.max(2,rar)]||'#ffe27a',rar>=4||d.sp>=2);
 u=b.canvas().toDataURL();CACHE.set(ck,u);return u;}
/* ---------- 名前 → デザインの対応 ---------- */
const TIERS=['銅','鉄','鋼','星鋼'];
const tierOf=it=>{const n=it.name||'';for(const t of['星鋼','銅','鉄','鋼'])if(n.startsWith(t+'の'))return t;return MATL(it.ilv||1);};
const WT=[['竜剣','dsword'],['大剣','gsword'],['双剣','dual'],['魔導書','tome'],['大鎌','scythe'],['砂時計','glass'],['手甲','fist'],['爪','claw'],['剣','sword'],['杖','staff'],['弓','bow'],['斧','axe']];
const NAMED={'灯の護符':'charm','生命の指輪':'ring_life','疾風の指輪':'ring_wind','魔石の首飾り':'neck_mag','星砂の首飾り':'neck_sand'};
function keyOf(it){if(!it)return'armor_鉄';if(it.leg&&DES['L_'+it.leg])return'L_'+it.leg;if(it.set&&DES['S_'+it.set+'_'+it.slot])return'S_'+it.set+'_'+it.slot;
 const n=it.name||'';if(NAMED[n])return NAMED[n];const t=tierOf(it);
 if(it.slot==='w'){const w=WT.find(([s])=>n.includes(s));if(w)return w[1]+'_'+t;}
 if(it.slot==='sub')return n.includes('護符')?'charm':'shield_'+t;
 if(it.slot==='head')return(n.includes('額当て')?'band_':'helm_')+t;
 if(it.slot==='body')return'armor_'+t;
 if(it.slot==='acc')return n.includes('首飾り')?'neck_mag':'ring_life';
 const w=WT.find(([s])=>n.includes(s));return w?w[1]+'_'+t:'armor_'+t;}
const DES={};
const bbox=k=>{const b=new Buf(WB,WB);paint(b,DES[k]);const[x0,y0,x1,y1]=bounds(b);return[x1-x0+1,y1-y0+1];};
const def=(k,S,m,g,x)=>{DES[k]=Object.assign({S,m,g},x||{});};
/* 未発見用の影絵 */
function shadow(key){const ck='sh|'+key;let u=CACHE.get(ck);if(u)return u;const d=DES[key]||DES['armor_鉄'];const w=new Buf(WB,WB);paint(w,d);const b=center(w,d),c=C('#2a2e52');for(let i=0;i<b.d.length;i++)if(b.d[i])b.d[i]=c;b.outline(C('#0a0c1e'));u=b.canvas().toDataURL();CACHE.set(ck,u);return u;}
return{DES,bbox,def,shadow,render,keyOf,cmap,spark,sparks,aura,N,icon:it=>render(keyOf(it),it&&!it.unid?(it.rar||0):Math.min(2,(it&&it.rar)||0))};})();
