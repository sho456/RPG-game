/* ===== ver0.24 演出文字レンダラー（TX24） =====
 ダメージ数値・Critical・Weak・Guard・Miss・BREAK・HP表示などの「飾り文字」を Canvas に描いて返す。
 CSS の background-clip:text（文字の形でグラデーションを切り抜く方法）は、親要素に不透明度や変形のアニメーションが
 かかると Chromium で切り抜きが外れ、グラデーションの四角がそのまま見える不具合があった（ver0.23 の BREAK 表示の赤い四角）。
 Canvas で「落ち影 → 外側の太い縁 → 内側の明るい縁 → グラデーション塗り → 上半分の光沢」の順に描けば、どの環境でも同じ見た目になる。
 ・同じ文字・書式・大きさの組み合わせはキャッシュし、表示するたびに小さな canvas へ複製するだけにする
 ・書体の読み込みが終わる前に描いたものはキャッシュしない（読み込み後に正しい書体で描き直される）
 ・今後のドット絵・演出の追加でも STYLE に書式を足すだけで同じ質感の文字を使える */
'use strict';
const TX24=(()=>{
const FONT={
 num:{f:'"Barlow Condensed","Arial Narrow","Helvetica Neue",Arial,sans-serif',w:700,it:'italic',cap:.72,skew:0},
 lat:{f:'"Nunito","Arial Rounded MT Bold","Helvetica Neue",Arial,sans-serif',w:900,it:'italic',cap:.72,skew:0},
 jp:{f:'"M PLUS Rounded 1c","Hiragino Maru Gothic ProN","Hiragino Sans","Noto Sans JP","Yu Gothic",sans-serif',w:800,it:'normal',cap:.86,skew:.2}};
/* 書式：fill=上→下のグラデーション（位置は文字の高さに対する割合）、ow=外側の縁の太さ（文字サイズ比）、oc=外側の縁の色、
 rw/rc=内側の明るい縁、sh=落ち影、gl=上半分の光沢の強さ、glow=外側の発光 */
const STYLE={
 dmg:{font:'num',fill:[[0,'#ffffff'],[.46,'#ffffff'],[.56,'#e2e8f8'],[1,'#aab6d6']],ow:.13,oc:'#10141f',sh:[.04,.07,'rgba(0,0,0,.55)']},
 dmgH:{font:'num',fill:[[0,'#ffffff'],[.46,'#ffffff'],[.56,'#ffe6e2'],[1,'#f0a8a0']],ow:.13,oc:'#1c1014',sh:[.04,.07,'rgba(0,0,0,.55)']},
 dmgW:{font:'num',fill:[[0,'#fffef2'],[.42,'#fff3c4'],[.56,'#ffd078'],[1,'#ff9440']],ow:.13,oc:'#2a1000',sh:[.04,.07,'rgba(0,0,0,.55)'],gl:.25},
 dmgC:{font:'num',fill:[[0,'#fffbe2'],[.28,'#ffeb8c'],[.5,'#ffd030'],[.62,'#ffb418'],[1,'#e27206']],ow:.14,oc:'#341600',rw:.04,rc:'#fff0b0',sh:[.05,.08,'rgba(0,0,0,.6)'],gl:.4,glow:'rgba(255,190,60,.55)'},
 dmgG:{font:'num',fill:[[0,'#ffffff'],[.46,'#ffffff'],[.56,'#e0f6ff'],[1,'#8ccbf2']],ow:.13,oc:'#081828',sh:[.04,.07,'rgba(0,0,0,.55)']},
 heal:{font:'num',fill:[[0,'#f2fff4'],[.44,'#c6ffd2'],[.56,'#6ae88c'],[1,'#1ca84a']],ow:.13,oc:'#05240f',sh:[.04,.07,'rgba(0,0,0,.5)'],gl:.25},
 psn:{font:'num',fill:[[0,'#fbf0ff'],[.44,'#e6c8ff'],[.56,'#bb86ff'],[1,'#7a34d0']],ow:.13,oc:'#1a0630',sh:[.04,.07,'rgba(0,0,0,.5)']},
 crit:{font:'lat',fill:[[0,'#fffde2'],[.42,'#ffe85c'],[.56,'#ffc21c'],[1,'#ff8400']],ow:.12,oc:'#2e1200',rw:.035,rc:'#fff6c8',sh:[.03,.06,'rgba(0,0,0,.55)'],gl:.35},
 weak:{font:'lat',fill:[[0,'#ffe0ee'],[.42,'#ff86b2'],[.56,'#f2306e'],[1,'#b00c48']],ow:.12,oc:'#3a0018',rw:.045,rc:'#ffffff',sh:[.03,.06,'rgba(0,0,0,.55)'],gl:.3},
 guard:{font:'lat',fill:[[0,'#f2feff'],[.42,'#a6f0ff'],[.56,'#40c2f2'],[1,'#1464bc']],ow:.12,oc:'#05203a',rw:.04,rc:'#ffffff',sh:[.03,.06,'rgba(0,0,0,.55)'],gl:.35},
 miss:{font:'lat',fill:[[0,'#ffffff'],[.44,'#f2f4f8'],[.56,'#c2c8d4'],[1,'#7a8294']],ow:.12,oc:'#15171e',rw:.03,rc:'#ffffff',sh:[.03,.06,'rgba(0,0,0,.55)'],gl:.3},
 brk:{font:'lat',fill:[[0,'#fff6d4'],[.38,'#ffcc44'],[.58,'#ff5a1c'],[1,'#bc0e0a']],ow:.12,oc:'#2a0400',rw:.04,rc:'#fff2c4',sh:[.04,.07,'rgba(0,0,0,.6)'],gl:.35,glow:'rgba(255,90,40,.55)'},
 elm:{font:'jp',fill:[[0,'#ffffff'],[.6,'#ffffff'],[1,'#d8dcef']],ow:.14,oc:'#1a1024',sh:[.03,.06,'rgba(0,0,0,.55)']},
 stat:{font:'jp',fill:[[0,'#ffffff'],[.6,'#ffffff'],[1,'#e2e4f2']],ow:.15,oc:'#12131c',sh:[.03,.06,'rgba(0,0,0,.5)']},
 /* 戦場のHP表示（参考：白〜淡い水色の斜体数字、濃紺の縁） */
 hp:{font:'num',fill:[[0,'#ffffff'],[.48,'#f2f8ff'],[.56,'#cfe4ff'],[1,'#94bfee']],ow:.15,oc:'#081226',sh:[.03,.06,'rgba(0,0,0,.5)']},
 hpY:{font:'num',fill:[[0,'#fffde6'],[.46,'#fff3a0'],[.56,'#ffd84a'],[1,'#f0a018']],ow:.15,oc:'#261400',sh:[.03,.06,'rgba(0,0,0,.5)']},
 hpR:{font:'num',fill:[[0,'#fff0ee'],[.46,'#ffb4a8'],[.56,'#ff6a56'],[1,'#d02418']],ow:.15,oc:'#2a0604',sh:[.03,.06,'rgba(0,0,0,.5)']},
 hpD:{font:'num',fill:[[0,'#c8ccd6'],[1,'#7a8090']],ow:.15,oc:'#101218',sh:[.03,.06,'rgba(0,0,0,.4)']},
 sp:{font:'num',fill:[[0,'#f0fbff'],[.5,'#bfeeff'],[1,'#58bff0']],ow:.16,oc:'#04162a',sh:[.03,.06,'rgba(0,0,0,.45)']}};
/* 任意の色からタグ用（攻撃↑・AG+ など）の書式を作る */
const hex=c=>{const m=/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c||'');if(!m)return null;let s=m[1];if(s.length===3)s=s.split('').map(x=>x+x).join('');return[0,2,4].map(i=>parseInt(s.slice(i,i+2),16));};
const mix=(a,b,t)=>'#'+a.map((v,i)=>Math.round(v+(b[i]-v)*t).toString(16).padStart(2,'0')).join('');
function tint(col,font){const k='t:'+col+':'+font;if(STYLE[k])return k;const c=hex(col)||[255,255,255];
 STYLE[k]={font,fill:[[0,mix(c,[255,255,255],.75)],[.46,mix(c,[255,255,255],.35)],[.56,mix(c,[255,255,255],.05)],[1,mix(c,[0,0,0],.32)]],ow:font==='jp'?.15:.13,oc:mix(c,[0,0,0],.88),sh:[.03,.06,'rgba(0,0,0,.5)']};return k;}
const DPR=()=>Math.min(3,Math.max(1,window.devicePixelRatio||1));
const CACHE=new Map();let CN=0;
const fontStr=(F,size)=>`${F.it} ${F.w} ${size}px ${F.f}`;
const ready=(F,size)=>{try{return document.fonts?document.fonts.check(fontStr(F,size)):true;}catch(e){return true;}};
/* 1つの文字列を描いた原本（キャッシュ）を返す */
function master(text,sk,size){const dpr=DPR(),key=sk+'|'+size+'|'+dpr+'|'+text;let m=CACHE.get(key);if(m)return m;
 const S=STYLE[sk]||STYLE.dmg,F=FONT[S.font]||FONT.num,px=size*dpr,c=document.createElement('canvas'),g=c.getContext('2d');g.font=fontStr(F,px);
 const tw=g.measureText(text).width,ow=S.ow*px,rw=(S.rw||0)*px,sx=S.sh?S.sh[0]*px:0,sy=S.sh?S.sh[1]*px:0,glow=S.glow?px*.18:0,sk2=F.skew*px*F.cap;
 const pad=Math.ceil(ow+glow+2),W=Math.ceil(tw+pad*2+sx+sk2),Hh=Math.ceil(px*(F.cap+.36)+pad*2+sy);c.width=W;c.height=Hh;
 const base=pad+px*(F.cap+.06),x0=pad+(F.skew?px*.04:0),top=base-px*F.cap,bot=base+px*.04;
 const tf=(gg)=>{gg.font=fontStr(F,px);gg.textBaseline='alphabetic';gg.lineJoin='round';gg.miterLimit=2;if(F.skew)gg.setTransform(1,0,-F.skew,1,F.skew*base,0);};
 tf(g);
 /* 1. 落ち影 */
 if(S.sh){g.fillStyle=g.strokeStyle=S.sh[2];g.lineWidth=ow*2;g.strokeText(text,x0+sx,base+sy);g.fillText(text,x0+sx,base+sy);}
 /* 2. 外側の太い縁（発光つき） */
 if(S.glow){g.save();g.shadowColor=S.glow;g.shadowBlur=glow;g.strokeStyle=S.oc;g.lineWidth=ow*2;g.strokeText(text,x0,base);g.restore();}
 g.strokeStyle=S.oc;g.lineWidth=ow*2;g.strokeText(text,x0,base);
 /* 3. 内側の明るい縁 */
 if(rw){g.strokeStyle=S.rc;g.lineWidth=rw*2;g.strokeText(text,x0,base);}
 /* 4. グラデーション塗り＋5. 光沢（塗りの形だけに重ねる） */
 const f=document.createElement('canvas');f.width=W;f.height=Hh;const fg=f.getContext('2d');tf(fg);
 const gr=fg.createLinearGradient(0,top,0,bot);S.fill.forEach(([p,col])=>gr.addColorStop(p,col));fg.fillStyle=gr;fg.fillText(text,x0,base);
 if(S.gl){fg.setTransform(1,0,0,1,0,0);fg.globalCompositeOperation='source-atop';const gg=fg.createLinearGradient(0,top,0,top+(bot-top)*.5);
  gg.addColorStop(0,`rgba(255,255,255,${S.gl})`);gg.addColorStop(1,'rgba(255,255,255,0)');fg.fillStyle=gg;fg.fillRect(0,top-2,W,(bot-top)*.5+2);}
 g.setTransform(1,0,0,1,0,0);g.drawImage(f,0,0);
 m={c,w:W/dpr,h:Hh/dpr,pad:pad/dpr,adv:tw/dpr,base:base/dpr,dpr};
 if(ready(F,px)){if(++CN>600){CACHE.clear();CN=0;}CACHE.set(key,m);}
 return m;}
/* 表示用の canvas（原本の複製）。CSS の大きさは原本の論理サイズ */
function el(text,sk,size,cls){const m=master(String(text),sk,Math.round(size)),c=document.createElement('canvas');c.width=m.c.width;c.height=m.c.height;
 c.getContext('2d').drawImage(m.c,0,0);c.style.width=m.w+'px';c.style.height=m.h+'px';c.className='tx24'+(cls?' '+cls:'');c._m=m;return c;}
/* 1文字ずつ別の canvas にした列（数字を1桁ずつ弾ませる用）。縁取りの余白ぶん左へ詰める */
function row(text,sk,size,small){const r=document.createElement('span');r.className='tr24';let i=0;const ref=master('0',sk,Math.round(size)),gap=ref.h-ref.base;
 for(const ch of String(text)){const sm=small&&small.test(ch),c=el(ch,sk,sm?size*.6:size,'d'+(sm?' sm':''));if(i)c.style.marginLeft=(-c._m.pad*2+size*.02)+'px';
  if(sm)c.style.marginBottom=Math.round(gap-(c._m.h-c._m.base))+'px';c.style.setProperty('--i',i);r.appendChild(c);i++;}
 return r;}
/* 書体を先に読み込む（読み込み後は自動的に正しい書体で描かれる） */
function preload(){try{if(!document.fonts)return;for(const k in FONT){const F=FONT[k];document.fonts.load(fontStr(F,32),k==='jp'?'スタン斬打突炎氷雷風地光闇毒':'0123456789CriticalWeakGuardMissBREAK!+').catch(()=>{});}}catch(e){}}
preload();
return{el,row,master,tint,STYLE,FONT,preload,clear:()=>{CACHE.clear();CN=0;}};})();
