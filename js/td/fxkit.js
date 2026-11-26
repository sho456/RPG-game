/* ===== TD の演出の共通部品（FXK）：光のスプライト・ドットの格子にそろえた形・粒のプール・緩急・命中の手応え =====
 方針（HD-2D 寄り）：ドット絵に合う「太さのある形」（1 ドット単位）に、放射グラデーションを一度だけ描いて使い回す「なめらかな光」を重ねる。
 ctx.filter の blur は使わない（iOS Safari で不安定）。光は加算（lighter）。白は芯だけ、色は主の色。座標は戦場の論理 px（1 ドット＝論理 1px）。
 使い方：FXK.fx({d,dl,layer:'back'|'front',draw(g,p,t),upd(dt,t)}) で時間つきの演出を登録 → TDFX.step/back/front が FXK.step/draw を呼ぶ。 */
'use strict';
const FXK=(()=>{
const TAU=Math.PI*2;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
/* 緩急：広がりは速く（eo＝easeOutExpo）、消えはゆっくり。lerp 補助つき */
const eo=p=>p>=1?1:1-Math.pow(2,-10*p),eoc=p=>1-Math.pow(1-clamp(p),3),ei=p=>p*p,sm=p=>p*p*(3-2*p);
const rnd=(a,b)=>a+Math.random()*(b-a);
const rgb=c=>{const n=parseInt(c.slice(1),16);return[n>>16,n>>8&255,n&255];};
const snap=v=>Math.round(v);
/* ---- 光のスプライト（色×半径ごとに 1 回だけ描く。縮小して使うので高解像度で作る） ---- */
const GL=new Map(),Q=4;
function sprite(col,r){r=Math.max(2,Math.round(r/2)*2);const k=col+'|'+r;let c=GL.get(k);if(c)return c;
 c=document.createElement('canvas');c.width=c.height=Math.ceil(r*2*Q);const x=c.getContext('2d'),[R,G,B]=rgb(col),m=c.width/2,gr=x.createRadialGradient(m,m,0,m,m,m);
 gr.addColorStop(0,`rgba(${R},${G},${B},1)`);gr.addColorStop(.3,`rgba(${R},${G},${B},.5)`);gr.addColorStop(.65,`rgba(${R},${G},${B},.14)`);gr.addColorStop(1,`rgba(${R},${G},${B},0)`);
 x.fillStyle=gr;x.fillRect(0,0,c.width,c.height);if(GL.size>160)GL.clear();GL.set(k,c);return c;}
/* 光（加算）：中心 (x,y)・半径 r・色・強さ a */
function glow(g,x,y,r,col,a=1){if(a<=0.01)return;const c=sprite(col,r),o=g.globalCompositeOperation,s=g.imageSmoothingEnabled,al=g.globalAlpha;
 g.globalCompositeOperation='lighter';g.imageSmoothingEnabled=true;g.globalAlpha=clamp(a);g.drawImage(c,x-r,y-r,r*2,r*2);g.globalCompositeOperation=o;g.imageSmoothingEnabled=s;g.globalAlpha=al;}
/* にじみ 2 段（大＝広く薄く・小＝芯の周り）＋白い芯。core＝芯の大きさ（0 なら無し） */
function bloom(g,x,y,r,col,a=1,core=.28){glow(g,x,y,r*2.3,col,a*.34);glow(g,x,y,r,col,a*.8);if(core){const s=Math.max(1,snap(r*core));glow(g,x,y,s*2.2,'#ffffff',a*.55);dot(g,x,y,s,'#ffffff',a);}}
/* ---- ドットの格子にそろえた形 ---- */
function dot(g,x,y,s,col,a=1){s=Math.max(1,snap(s));const al=g.globalAlpha;g.globalAlpha=al*a;g.fillStyle=col;g.fillRect(snap(x-s/2),snap(y-s/2),s,s);g.globalAlpha=al;}
/* 4 方向の星：十字の光（先へ向かって細く）・中心が白。r＝腕の長さ */
function star4(g,x,y,r,col,a=1,core='#ffffff'){r=Math.max(2,snap(r));x=snap(x);y=snap(y);const al=g.globalAlpha;g.globalAlpha=al*a;g.fillStyle=col;
 for(let i=0;i<=r;i++){const h=i<r*.3?3:i<r*.7?2:1,o=snap(h/2-.01);g.fillRect(x+i,y-o,1,h);g.fillRect(x-i-1,y-o,1,h);g.fillRect(x-o,y+i,h,1);g.fillRect(x-o,y-i-1,h,1);}
 g.fillStyle=core;g.fillRect(x-1,y-1,2,2);g.fillRect(x-2,y,4,1);g.fillRect(x,y-2,1,4);g.globalAlpha=al;}
/* 菱形（粒）：r＝半対角 */
function diamond(g,x,y,r,col,a=1){r=Math.max(1,snap(r));x=snap(x);y=snap(y);const al=g.globalAlpha;g.globalAlpha=al*a;g.fillStyle=col;for(let i=-r;i<=r;i++){const w=r-Math.abs(i);g.fillRect(x-w,y+i,w*2+1,1);}g.globalAlpha=al;}
/* 輪（地面の楕円・加算）：太さ w（1 ドット単位）。下に薄い光の輪を重ねる */
function ring(g,x,y,rx,ry,w,col,a=1,core){if(rx<1||a<=.01)return;const o=g.globalCompositeOperation,al=g.globalAlpha,lw=g.lineWidth;g.globalCompositeOperation='lighter';
 g.strokeStyle=col;g.globalAlpha=al*a*.22;g.lineWidth=Math.max(1,snap(w))+3;g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);g.stroke();
 g.globalAlpha=al*a;g.lineWidth=Math.max(1,snap(w));g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);g.stroke();
 if(core){g.strokeStyle=core;g.globalAlpha=al*a*.85;g.lineWidth=1;g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);g.stroke();}
 g.globalCompositeOperation=o;g.globalAlpha=al;g.lineWidth=lw;}
/* 太さのある三日月（3 段：外の色・内の色・芯の白）。r＝半径・w＝最大の太さ・a0〜a1＝角度 */
function crescent(g,x,y,r,a0,a1,w,c1,c2,a=1){const al=g.globalAlpha,o=g.globalCompositeOperation,m=(a0+a1)/2;g.globalCompositeOperation='lighter';
 for(const[k,c]of[[1,c1],[.6,c2],[.22,'#ffffff']]){const ww=w*k;g.globalAlpha=al*a*(k<1?1:.9);g.fillStyle=c;g.beginPath();g.arc(x,y,r,a0,a1);g.arc(x+Math.cos(m)*ww*.6,y+Math.sin(m)*ww*.6,Math.max(1,r-ww*.3),a1,a0,true);g.closePath();g.fill();}
 g.globalCompositeOperation=o;g.globalAlpha=al;}
/* ---- 粒のプール（上限つき）。spark＝速い・尾・重力・すぐ消える／ember＝遅い四角・昇る・ちらつく／star＝十字がまたたく／sand＝金の粒 ---- */
let P=[],E=[];const CAP=300,ECAP=90;
function p(o){if(P.length>=CAP)P.shift();o.t=-(o.dl||0);o.gr=o.gr||0;o.vx=o.vx||0;o.vy=o.vy||0;o.s=o.s||1;P.push(o);return o;}
function sparks(x,y,n,col,o={}){for(let i=0;i<n;i++){const a=(o.a??-Math.PI/2)+(Math.random()-.5)*(o.w??TAU),v=(o.sp||100)*rnd(.4,1.2);
 p({k:'spark',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.8,gr:o.gr??150,d:(o.d||.3)*rnd(.6,1.2),c:Math.random()<.25?'#ffffff':col,dl:o.dl});}}
function embers(x,y,n,col,o={}){for(let i=0;i<n;i++)p({k:'ember',x:x+rnd(-(o.w||10),o.w||10),y:y+rnd(-3,3),vx:rnd(-8,8),vy:-rnd(14,34),d:(o.d||.7)*rnd(.7,1.3),c:col,dl:o.dl,ph:Math.random()*9});}
function stars(x,y,n,col,o={}){for(let i=0;i<n;i++)p({k:'star',x:x+rnd(-(o.w||8),o.w||8),y:y+rnd(-(o.h||6),o.h||6),vx:rnd(-12,12)*(o.v||1),vy:-rnd(o.up??10,(o.up??10)+24),gr:o.gr||0,d:(o.d||.7)*rnd(.7,1.3),c:Math.random()<.3?'#ffffff':col,s:o.s||1,dl:o.dl,ph:Math.random()*9});}
/* ---- 時間つきの演出 ---- */
function fx(o){if(E.length>=ECAP)E.shift();o.t=-(o.dl||0);E.push(o);return o;}
function step(dt){for(const e of E){e.t+=dt;if(e.t>=0&&e.upd)try{e.upd(dt,e.t);}catch(x){e.t=e.d;}}E=E.filter(e=>e.t<e.d);
 for(const q of P){q.t+=dt;if(q.t<0)continue;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=q.gr*dt;q.vx*=.985;}P=P.filter(q=>q.t<q.d);}
/* 描く：layer='back'（地面・キャラの後ろ）か 'front'（キャラの前。粒もここ） */
function draw(g,layer){g.save();for(const e of E)if(e.t>=0&&(e.layer||'front')===layer){g.globalAlpha=1;g.globalCompositeOperation='source-over';try{e.draw(g,clamp(e.t/e.d),e.t,e);}catch(x){e.t=e.d;if(!FXK._err){FXK._err=1;console.warn('FXK',x);}}}g.globalAlpha=1;
 if(layer==='front'){g.globalCompositeOperation='lighter';for(const q of P){if(q.t<0)continue;const r=q.t/q.d,fa=1-r*r;
  if(q.k==='spark'){g.globalAlpha=fa;g.strokeStyle=q.c;g.lineWidth=1;g.beginPath();g.moveTo(snap(q.x),snap(q.y));g.lineTo(snap(q.x-q.vx*.05),snap(q.y-q.vy*.05));g.stroke();}
  else if(q.k==='ember'){g.globalAlpha=fa*(.55+.45*Math.sin(q.t*30+q.ph));dot(g,q.x,q.y,1+(r<.3?1:0),q.c);}
  else if(q.k==='star'){const tw=.5+.5*Math.sin(q.t*22+q.ph),s=q.s*(1+tw*.5)*(1-r*.5);g.globalAlpha=fa;if(s>1.6)star4(g,q.x,q.y,s*2.4,q.c,1,'#ffffff');else dot(g,q.x,q.y,1,q.c);}
  else{g.globalAlpha=fa;dot(g,q.x,q.y,q.s>1?2:1,q.c);}}}
 g.restore();g.globalAlpha=1;}
function reset(){P=[];E=[];}
/* ---- 命中の手応え：当たった敵（f）を一瞬止めて白く光らせ、属性の色に染め、小さく押し戻す。描くだけ（ロジックの位置は変えない）。
 hit(f,st,{dl,c,stop,pw})：dl 秒後に命中。react(f,st)：pose が読む。tintDraw：view.js の sprite が色の重ねに使う */
function hit(f,st,o={}){const L=f._im||(f._im=[]);L.push({t:st.t+(o.dl||0),c:o.c||'#ffffff',stop:o.stop??.06,pw:o.pw||1});if(L.length>6)L.shift();}
function react(f,st){const L=f._im;if(!L||!L.length)return null;let cur=null;for(const h of L)if(h.t<=st.t&&(!cur||h.t>cur.t))cur=h;
 const pend=L.some(h=>h.t>=f.hitT-.001);if(!pend){f._im=null;return null;}if(!cur)return{wait:true};
 const k=st.t-cur.t;if(k>.5)return{wait:false,none:true};
 const hold=k<cur.stop,ta=hold?0:clamp(1-(k-cur.stop)/.18)*.62;
 return{fl:hold,tint:cur.c,ta,hold,t0:cur.t+cur.stop,pw:cur.pw};}
const TC=document.createElement('canvas'),TX=TC.getContext('2d');
function tintDraw(g,F,x,y,w,h,col,a){TC.width=Math.max(1,Math.ceil(F.w));TC.height=Math.max(1,Math.ceil(F.h));TX.clearRect(0,0,TC.width,TC.height);TX.globalCompositeOperation='source-over';TX.drawImage(F.cv,0,0);
 TX.globalCompositeOperation='source-atop';TX.fillStyle=col;TX.fillRect(0,0,TC.width,TC.height);const o=g.globalCompositeOperation,al=g.globalAlpha;g.globalCompositeOperation='lighter';g.globalAlpha=al*a;g.drawImage(TC,x,y,w,h);g.globalCompositeOperation=o;g.globalAlpha=al;}
return{TAU,clamp,eo,eoc,ei,sm,rnd,glow,bloom,dot,star4,diamond,ring,crescent,p,sparks,embers,stars,fx,step,draw,reset,hit,react,tintDraw};})();
