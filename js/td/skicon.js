/* ===== 戦闘の技ボタンの絵（TDI）：SKICON の白いシルエットから、技ごとのドット絵のアイコンを作る（ver0.58） =====
 セレスの TD デモ（ver0.60 で削除）の技ボタンの考え方を、全員の技 60 個へ自動で広げたもの：
 低い解像度（30px の枠に 24px）でシルエットを描き → 属性の色の 3 段（光・中・影。左上が光・右下が影）→ 墨の縁取り → 右下に属性の印（5×5）→
 暗い星空の枠（上の縁に属性の色の線・技ごとに違う星の点）→ ×2 で拡大（にじませない）。奥義は金の縁で星が多い。
 使い方：TDI.img(技のキー, 属性, 奥義か) → <img> の HTML。SVG の読み込みは非同期なので、できたら同じ data-ic の img に入れる */
'use strict';
const TDI=(()=>{
const C={},wait={},N=30,G=24;
const PAL={'斬':['#ffffff','#c8d4ec','#5e6e9e'],'打':['#fff0d8','#e0a060','#844e24'],'突':['#eaffe8','#9fd36a','#3a7230'],'熱':['#fff3b0','#ff8a3c','#b0341a'],
 '冷':['#f0fdff','#7fd0ff','#2f60b8'],'雷':['#fffbd0','#ffe14a','#a87c0c'],'陽':['#fffbe8','#f6c85a','#a86c20'],'陰':['#f4e4ff','#b884ff','#56369e']};
const INK=[18,10,38];
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const mix=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t));
/* 属性の印（5×5） */
const MARK={'熱':['..#..','.##..','.###.','#####','.###.'],'冷':['#.#.#','.###.','##.##','.###.','#.#.#'],'雷':['..##.','.##..','####.','..##.','.##..'],
 '陽':['..#..','.###.','#####','.###.','..#..'],'陰':['.###.','##...','##...','##...','.###.'],'打':['.###.','#####','#####','.###.','..#..'],
 '斬':['....#','...#.','..#..','.#...','#....'],'突':['..#..','.###.','..#..','..#..','..#..']};
const STAR='<svg viewBox="0 0 32 32"><path d="M16 2l4.2 9.2 10 1.1-7.5 6.8 2.1 9.9L16 24l-8.8 5 2.1-9.9-7.5-6.8 10-1.1z" fill="#fff"/></svg>';
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return()=>((h=Math.imul(h^h>>>13,1274126177))>>>0)/4294967296;};
function svgOf(id){if(id==='_aw')return STAR;try{return SKICON.html(SK[id]||{});}catch(e){return STAR;}}
function render(img,el,big,id){const P=(PAL[el]||PAL['陽']).map(rgb),R=hash(id);
 /* シルエットを 22px に描いて、濃いところだけを点にする */
 const m=document.createElement('canvas');m.width=m.height=G;const mg=m.getContext('2d');mg.drawImage(img,0,0,G,G);const A=mg.getImageData(0,0,G,G).data,on=(x,y)=>x>=0&&y>=0&&x<G&&y<G&&A[(y*G+x)*4+3]>110;
 const c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d'),D=g.createImageData(N,N),d=D.data,put=(x,y,col,a=255)=>{if(x<0||y<0||x>=N||y>=N)return;const i=(y*N+x)*4;d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2];d[i+3]=a;};
 /* 枠：墨の縁・暗い星空（上は属性の色を少し混ぜ、下へ暗く）・上の縁の線 */
 const top=mix(P[2],[40,24,84],.55),bot=[16,11,40],gold=[255,200,90];
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const edge=x===0||y===0||x===N-1||y===N-1;put(x,y,edge?INK:mix(top,bot,y/N));}
 for(let x=1;x<N-1;x++){put(x,1,big?gold:P[1]);if(big)put(x,2,mix(gold,top,.5));}
 for(let k=0;k<(big?8:4);k++)put(2+Math.floor(R()*(N-4)),3+Math.floor(R()*(N-6)),[220,210,255]);
 /* シルエット：墨の縁取り → 光・中・影 */
 const ox=3,oy=3;
 for(let y=-1;y<=G;y++)for(let x=-1;x<=G;x++)if(!on(x,y)&&(on(x-1,y)||on(x+1,y)||on(x,y-1)||on(x,y+1)||on(x+1,y+1)))put(ox+x,oy+y,INK);
 for(let y=0;y<G;y++)for(let x=0;x<G;x++){if(!on(x,y))continue;let col=P[1];
  if(!on(x,y-1)||!on(x-1,y))col=P[0];else if(!on(x,y+1)||!on(x+1,y))col=P[2];else if(x+y>G*1.15)col=mix(P[1],P[2],.45);else if(x+y<G*.55)col=mix(P[1],P[0],.35);put(ox+x,oy+y,col);}
 /* 属性の印（右下）：墨の縁つき */
 const M=MARK[el];if(M){const mx=N-8,my=N-8;for(let y=-1;y<=5;y++)for(let x=-1;x<=5;x++){const v=(xx,yy)=>xx>=0&&yy>=0&&xx<5&&yy<5&&M[yy][xx]==='#';if(v(x,y))put(mx+x,my+y,y<2?P[0]:P[1]);else if(v(x-1,y)||v(x+1,y)||v(x,y-1)||v(x,y+1))put(mx+x,my+y,INK);}}
 g.putImageData(D,0,0);const o=document.createElement('canvas');o.width=o.height=N*2;const og=o.getContext('2d');og.imageSmoothingEnabled=false;og.drawImage(c,0,0,N*2,N*2);return o.toDataURL();}
function build(id,el,big,k){const img=new Image();img.onload=()=>{try{C[k]=render(img,el,big,id);}catch(e){console.error(e);return;}
  document.querySelectorAll('img[data-ic]').forEach(e=>{if(e.dataset.ic===k)e.src=C[k];});};
 img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgOf(id).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" '));}
function src(id,el,big){const k=id+'|'+el+'|'+(big?1:0);if(C[k])return{k,s:C[k]};if(!wait[k]){wait[k]=1;build(id,el,big,k);}return{k,s:''};}
const TRANSPARENT='data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
function img(id,el,big){const r=src(id,el,big);return`<img class="tdi" data-ic="${r.k}" src="${r.s||TRANSPARENT}" alt="">`;}
return{img,src};})();
