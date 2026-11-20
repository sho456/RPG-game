/* ===== ver0.18 探索の名残：マップの差し替え・宝箱の移し替え・塔と回廊の番人の広間（探索の描画・敵の配置・ミニマップは探索マップの廃止で削除） ===== */

/* ---------- マップの差し替えと宝箱の移し替え ---------- */
for(const k in MAPS18)if(AREAS[k])AREAS[k].map=MAPS18[k];
const chestsOf=m=>{const o=[];m.forEach((r,y)=>[...r].forEach((t,x)=>{if(t==='C')o.push([x,y]);}));return o;};
{const _mg=migrate;migrate=function(g){const r=_mg(g);try{if(G&&(G.mapv||0)<18){const fl=G.flags.chest=G.flags.chest||{};for(const k in OLDCH){const key=p=>k==='haido'?p[0]+','+p[1]:k+':'+p[0]+','+p[1],o=OLDCH[k],n=chestsOf(MAPS18[k]),st=o.map(p=>!!fl[key(p)]);o.forEach(p=>{delete fl[key(p)];});n.forEach((p,i)=>{if(st[i])fl[key(p)]=1;});}G.mapv=18;}}catch(e){}return r;};}
/* 自動生成の階（塔・回廊）：番人の周りを広間にする */
function carveBoss(map,fl){const g=map.map(r=>[...r]),H2=g.length,W2=g[0].length;let bx=-1,by=-1;g.forEach((r,y)=>r.forEach((t,x)=>{if(t==='B'){bx=x;by=y;}}));if(bx<0)return map;
 for(let y=Math.max(1,by-4);y<=Math.min(H2-2,by+1);y++)for(let x=Math.max(1,bx-3);x<=Math.min(W2-2,bx+3);x++)if(g[y][x]==='#'||g[y][x]==='q')g[y][x]=fl;return g.map(r=>r.join(''));}
{const _mt=makeTowerArea;makeTowerArea=function(f){const a=_mt(f);a.map=carveBoss(a.map,'t');return a;};}
{const _mk=makeKairouArea;makeKairouArea=function(f){const a=_mk(f);a.map=carveBoss(a.map,'v');return a;};}

/* 町の画面（ver18-town.js）がキャラの絵を取るときの指定 */
const FOPT='{"noW":1}';
