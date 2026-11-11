/* ===== ver0.18 戦闘：新ドット絵の描画・キャラ別モーション・属性エフェクト・ボス演出 ===== */
'use strict';
const VER18='ver0.18';
const LEGCOL={tenkyuu:'#ffe14a',meikai:'#b07cff',hyouga:'#bff4ff',taiyou:'#ff9a40'};
/* ユニット→スプライト。装備している武器の素材（銅・鉄・鋼・星鋼）とレジェンドで見た目が変わる */
function heroOpt(id,aw){const o={};if(aw)o.aw=1;try{const h=G&&G.h[id],it=h&&h.eq&&h.eq.w&&findItem(h.eq.w);if(it){if(it.leg&&LEGCOL[it.leg])o.wl=LEGCOL[it.leg];else o.wt=it.rar===4||it.set?'星鋼':MATL(it.ilv);}const bd=h&&h.eq&&h.eq.body&&findItem(h.eq.body);if(bd)o.at=bd.rar===4||bd.set?'星鋼':MATL(bd.ilv);}catch(e){}return Object.keys(o).length?JSON.stringify(o):'';}
function uKey(u){if(u._k)return u._k;return u._k=u.side===0?(SPDEF[u.id]?u.id:'rio'):resolveSpr(u.kind);}
function uOpt(u){if(u.side!==0)return'';const s=(u.aw?1:0);if(u._os!==s){u._os=s;u._o=heroOpt(u.id,u.aw);}return u._o;}
const aSp=b=>Math.max(1,b*SPD[speed]/1.7);
const feet=u=>[u.x+8*u.sc,u.y+16*u.sc];
const uMid=u=>{const d=SPDEF[uKey(u)],f=feet(u);return[f[0],f[1]-Math.min(40,(d?d.ay:30)*.5)];};

/* ---------- エフェクト ---------- */
const FX=(k,x,y,o)=>{if(B){(B.fx2=B.fx2||[]).push(Object.assign({k,x,y,t:0},o||{}));}};
const fr=(x,y,w,h,c,a)=>{if(a!=null)ctx.globalAlpha=Math.max(0,Math.min(1,a));ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);};
const ELFX={'斬':'slash','打':'smash','突':'pierce','炎':'fire','氷':'ice','雷':'thunder','風':'wind','地':'earth','光':'light','闇':'dark'};
const FXD={
 slash(f){const n=14,p=Math.min(1,f.t/4),a0=f.dir>0?-2.4:-.75,sw=f.dir>0?2.6:-2.6,al=f.t<6?1:1-(f.t-6)/6;for(let j=0;j<=n*p;j++){const an=a0+sw*j/n,r=15,th=j<3||j>n-3?1:2;fr(f.x+Math.cos(an)*r,f.y+Math.sin(an)*r*.8,th,th,f.t<5?'#ffffff':f.c,al);fr(f.x+Math.cos(an)*(r-2),f.y+Math.sin(an)*(r-2)*.8,1,1,f.c,al*.7);}
  if(f.t<4)for(let j=0;j<4;j++)fr(f.x-6+j*4,f.y-6+j*4,2,1,'#ffffff',.8);return 12;},
 smash(f){const al=1-f.t/12,r=f.t*1.8;for(let a=0;a<8;a++){const an=a/8*6.283+.4;for(let k=0;k<3;k++)fr(f.x+Math.cos(an)*(r+k*2),f.y+Math.sin(an)*(r+k*2),2,2,k?f.c:'#ffffff',al);}
  if(f.t<5){fr(f.x-1,f.y-5,3,11,'#ffffff',1);fr(f.x-5,f.y-1,11,3,'#ffffff',1);fr(f.x-3,f.y-3,7,7,f.c,.9);}return 12;},
 pierce(f){const al=1-f.t/10,L=Math.min(30,f.t*8),d=f.dir||-1;fr(f.x-d*14+(d<0?-L:0),f.y,L,1,'#ffffff',al);fr(f.x-d*10+(d<0?-L*.6:0),f.y-1,L*.6,3,f.c,al*.6);const r=f.t*1.4;for(let a=0;a<8;a++)fr(f.x+Math.cos(a*.785)*r*.5,f.y+Math.sin(a*.785)*r,1,1,'#ffffff',al);return 10;},
 fire(f){const C3=['#fff6c0','#ffd050','#ff8a28','#d8401a'];for(let k=0;k<7;k++){const px=f.x-12+k*4+Math.sin(f.t*.7+k)*2,h=Math.max(0,(10+((k*7)%9))*Math.sin(Math.min(1,f.t/18)*3.14)),by=f.y+10;
   for(let j=0;j<h;j+=2){const t=j/h;fr(px+Math.sin(j*.5+f.t*.5)*1.5,by-j,t>.7?1:3,2,C3[t<.25?0:t<.5?1:t<.8?2:3],1);}}
  for(let k=0;k<5;k++)fr(f.x-10+((k*9+f.t*3)%22),f.y+6-((f.t*2+k*7)%26),1,1,C3[1],.9);return 18;},
 ice(f){const C3=['#ffffff','#bff4ff','#7fd6ff','#3a90d8'],g=Math.min(1,f.t/5);if(f.t<11){for(const[ox,h]of[[-8,14],[0,20],[8,12]]){const hh=h*g,bx=f.x+ox,by=f.y+10;for(let j=0;j<hh;j++){const w=Math.max(1,Math.round((1-j/hh)*5));fr(bx-w/2,by-j,w,1,C3[j%5===0?0:j<hh*.5?2:1],1);}fr(bx-1,by-hh*.6,1,hh*.4,C3[0],.9);}}
  else{for(let k=0;k<14;k++){const an=k*.45,r=(f.t-10)*2.2;fr(f.x+Math.cos(an)*r*1.2+(k%3)*3-3,f.y+Math.sin(an)*r-((k*5)%10),k%2?2:1,k%2?2:1,C3[k%4],1-(f.t-10)/9);}}return 19;},
 thunder(f){const al=f.t<8?1:1-(f.t-8)/6;if((f.t>>1)%2===0||f.t<4){let x=f.x+((f.t*7)%5)-2,y=0;ctx.globalAlpha=al;while(y<f.y+8){const nx=x+(((y*13+f.t*5)%9)-4),ny=y+5;ctx.fillStyle='#fff8a0';for(let k=0;k<5;k++)ctx.fillRect(Math.round(x+(nx-x)*k/5)-1,y+k,3,1);ctx.fillStyle='#ffffff';for(let k=0;k<5;k++)ctx.fillRect(Math.round(x+(nx-x)*k/5),y+k,1,1);x=nx;y=ny;}}
  for(let a=0;a<6;a++)fr(f.x+Math.cos(a+f.t)*(4+f.t),f.y+6+Math.sin(a+f.t)*3,2,1,'#ffe14a',al);return 14;},
 wind(f){const al=1-f.t/16;for(let k=0;k<3;k++){const a0=f.t*.5+k*2.1;for(let j=0;j<9;j++){const an=a0+j*.2,r=7+k*4;fr(f.x+Math.cos(an)*r*1.3,f.y+Math.sin(an)*r*.6-k*3+3,j>2&&j<7?2:1,1,j%3?'#8ff0a8':'#e8fff0',al);}}return 16;},
 earth(f){const C3=['#e8c890','#b08850','#6a4a2a'],g=Math.sin(Math.min(1,f.t/14)*3.14);for(const[ox,h]of[[-9,12],[-2,18],[6,14]]){const hh=h*g,bx=f.x+ox,by=f.y+12;for(let j=0;j<hh;j++){const w=Math.max(1,Math.round((1-j/hh)*7));fr(bx-w/2,by-j,w,1,C3[1],1);fr(bx-w/2,by-j,1,1,C3[0],1);fr(bx+w/2-1,by-j,1,1,C3[2],1);}}
  for(let k=0;k<6;k++)fr(f.x-14+k*5,f.y+12-((f.t*(1+k%3))%12),2,2,C3[k%3],1-f.t/16);return 16;},
 light(f){const al=f.t<8?1:1-(f.t-8)/8,w=Math.max(1,8-Math.abs(f.t-5)*1.4);fr(f.x-w/2,0,w,f.y+12,'#fff3a6',al*.8);fr(f.x-w/4,0,Math.max(1,w/2),f.y+12,'#ffffff',al);const r=f.t*1.6;for(let a=0;a<12;a++)fr(f.x+Math.cos(a*.524)*r*1.3,f.y+8+Math.sin(a*.524)*r*.4,2,1,'#ffe27a',al);
  fr(f.x-7,f.y-1,15,1,'#ffffff',al);fr(f.x,f.y-8,1,15,'#ffffff',al);return 16;},
 dark(f){const C3=['#e0c8ff','#b07cff','#5a2aa0','#1a0a30'];if(f.t<9){const r=(9-f.t)*2.4;for(let a=0;a<8;a++){const an=a*.785+f.t*.4;fr(f.x+Math.cos(an)*r,f.y+Math.sin(an)*r,2,2,C3[a%2?1:2],1);}fr(f.x-2,f.y-2,5,5,C3[3],.8);}
  else{const r=(f.t-8)*2.2,al=1-(f.t-9)/9;for(let a=0;a<14;a++){const an=a*.45;fr(f.x+Math.cos(an)*r,f.y+Math.sin(an)*r,a%2?2:1,a%2?2:1,C3[a%3],al);}fr(f.x-r/3,f.y-r/3,r*.66,r*.66,C3[3],al*.6);}return 18;},
 none(f){const al=1-f.t/12,r=f.t*1.7;for(let a=0;a<12;a++)fr(f.x+Math.cos(a*.524)*r,f.y+Math.sin(a*.524)*r,2,2,a%2?'#ffffff':(f.c||'#c8b0ff'),al);if(f.t<4)fr(f.x-3,f.y-3,7,7,'#ffffff',.9);return 12;},
 crit(f){const al=1-f.t/10,r=4+f.t*2;for(let a=0;a<4;a++){const an=a*1.571+.785;for(let k=0;k<r;k+=2)fr(f.x+Math.cos(an)*k,f.y+Math.sin(an)*k,2,2,'#ffe14a',al);}fr(f.x-1,f.y-r,3,r*2,'#ffffff',al);fr(f.x-r,f.y-1,r*2,3,'#ffffff',al);return 10;},
 guard(f){const al=1-f.t/12;for(let j=-8;j<=8;j++){const px=f.x-10-Math.round((64-j*j)/14)+f.t*.3;fr(px,f.y+j,2,1,j%4?'#7fd6ff':'#ffffff',al);}for(let k=0;k<4;k++)fr(f.x-14-f.t-k*2,f.y-6+k*4,2,1,'#ffffff',al);return 12;},
 heal(f){const al=1-f.t/22;for(let k=0;k<7;k++){const px=f.x-9+((k*7)%19),py=f.y+10-((f.t*1.3+k*6)%26);fr(px,py,1,3,'#7dffa8',al);fr(px-1,py+1,3,1,'#7dffa8',al);}for(let a=0;a<10;a++)fr(f.x+Math.cos(a*.63+f.t*.2)*11,f.y+8+Math.sin(a*.63+f.t*.2)*3-f.t*.5,1,1,'#e8fff0',al);return 22;},
 buff(f){const al=1-f.t/18,c=f.c||'#ffe27a';for(let k=0;k<4;k++){const px=f.x-8+k*5,py=f.y+8-((f.t*1.6+k*5)%22);fr(px,py,1,4,c,al);fr(px-1,py+1,3,1,c,al);fr(px-2,py+2,5,1,c,al*.6);}return 18;},
 revive(f){const al=1-f.t/24;fr(f.x-5,0,10,f.y+12,'#fff3a6',al*.35);fr(f.x-2,0,4,f.y+12,'#ffffff',al*.5);for(let k=0;k<8;k++){const an=k*.785+f.t*.15;fr(f.x+Math.cos(an)*(10-f.t*.3),f.y+12-f.t*1.2+Math.sin(an)*3,2,1,k%2?'#ffb030':'#ffe27a',al);}return 24;},
 brk(f){const al=1-f.t/18;for(let k=0;k<12;k++){const an=k*.524,v=2.2+(k%3);fr(f.x+Math.cos(an)*f.t*v,f.y+Math.sin(an)*f.t*v+f.t*f.t*.06,k%2?3:2,k%2?2:3,k%3?'#cfe3ff':'#ffffff',al);}if(f.t<5){fr(f.x-12,f.y-1,25,2,'#ffffff',1);fr(f.x-1,f.y-12,2,25,'#ffffff',1);}return 18;},
 ko(f){const al=1-f.t/20;for(let k=0;k<10;k++){const px=f.x-10+((k*11)%21),py=f.y+6-f.t*(.6+(k%4)*.3)-(k%5)*3;fr(px,py,k%3?2:1,k%3?2:1,k%2?(f.c||'#b07cff'):'#ffffff',al);}return 20;},
 delay(f){const al=1-f.t/14,r=4+f.t;for(let a=0;a<10;a++)fr(f.x+Math.cos(a*.63)*r,f.y+Math.sin(a*.63)*r,1,1,'#7fd6ff',al);fr(f.x,f.y-4,1,5,'#bff4ff',al);fr(f.x,f.y,4,1,'#bff4ff',al);return 14;},
 awaken(f){const al=f.t<20?1:1-(f.t-20)/16,c=f.c||'#ffe27a',w=Math.min(18,f.t*2);fr(f.x-w/2,0,w,f.y+2,c,al*.4);fr(f.x-w/4,0,w/2,f.y+2,'#ffffff',al*.5);const r=f.t*2.4;for(let a=0;a<20;a++)fr(f.x+Math.cos(a*.314)*r*1.4,f.y+Math.sin(a*.314)*r*.45,2,2,a%2?'#ffffff':c,al);
  for(let k=0;k<10;k++)fr(f.x-12+((k*9)%25),f.y-((f.t*(2+k%3)+k*9)%50),1,3,c,al);return 36;},
 lvup(f){const al=1-f.t/40;for(let k=0;k<6;k++){const px=f.x-10+k*4,py=f.y+10-((f.t*1.2+k*7)%36);fr(px,py,1,4,'#ffe27a',al);fr(px-1,py+1,3,1,'#ffe27a',al);}const r=f.t*.9;for(let a=0;a<12;a++)fr(f.x+Math.cos(a*.524)*r,f.y+12+Math.sin(a*.524)*r*.3,2,1,'#ffffff',al);return 40;},
 shot(f){const p=Math.min(1,f.t/f.dur),x=f.x+(f.x1-f.x)*p,y=f.y+(f.y1-f.y)*p-Math.sin(p*3.14)*(f.arc||0),d=f.x1<f.x?-1:1;
  if(f.kind==='arrow'){fr(x-(d<0?0:7),y,8,1,'#e8dcc0',1);fr(x+(d<0?-1:7),y-1,2,3,f.c||'#ffffff',1);for(let k=1;k<5;k++)fr(x-d*(8+k*3),y,2,1,f.c||'#ffffff',.6-k*.12);}
  else{fr(x-2,y-2,5,5,f.c||'#c8b0ff',1);fr(x-1,y-1,3,3,'#ffffff',1);for(let k=1;k<6;k++)fr(x-d*k*3+Math.sin(k+f.t)*1.5,y+Math.cos(k+f.t)*1.5,Math.max(1,3-k*.4),Math.max(1,3-k*.4),f.c||'#c8b0ff',.8-k*.13);}return f.dur;},
 quake(f){const al=1-f.t/14;for(let k=0;k<9;k++){const d=(k-4)*4;fr(f.x+d+Math.sign(d)*f.t*1.2,f.y+10-Math.abs(Math.sin(f.t*.4))*((k*5)%7+3),2,2,k%2?'#b08850':'#e8c890',al);}fr(f.x-f.t*2.2,f.y+11,f.t*4.4,1,'#ffffff',al*.7);return 14;},
 boom(f){const al=1-f.t/20,r=f.t*2.6,C3=['#ffffff','#ffe9a0','#ff9a40','#b07cff'];for(let a=0;a<16;a++){const an=a*.393+(a%2)*.2;fr(f.x+Math.cos(an)*r,f.y+Math.sin(an)*r*.8,a%2?3:2,a%2?3:2,C3[(a+f.t)%4],al);}if(f.t<6)fr(f.x-f.t*2,f.y-f.t*2,f.t*4,f.t*4,'#ffffff',.5);return 20;}};
function drawFx(){if(!B.fx2)return;B.fx2=B.fx2.filter(f=>{if(f.wait>0){f.wait--;return true;}f.t++;const d=FXD[f.k]||FXD.none,life=d(f);ctx.globalAlpha=1;return f.t<life;});}

/* ---------- ユニット描画 ---------- */
drawUnit=function(u){const key=uKey(u),def=SPDEF[key];if(!def)return;const[fx0,fy0]=feet(u),now=tick;
 if(!u.alive&&u.side===1){if(u.fade<=0)return;u.fade--;}
 /* 位置：踏み込み・ノックバック */
 const tgt=u.side===0?(u.dash||0):(u.tox>0?(u._lunge||14):0);u.ox+=(tgt-u.ox)*.24;if(Math.abs(tgt-u.ox)<.4)u.ox=tgt;u.oy=(u.oy||0)+(((u.dashY||0))-(u.oy||0))*.24;u.kb=(u.kb||0)*.78;
 let an,i;if(u.side===0&&!u.alive){an='down';i=0;}else{[an,i]=aniFrame(u,def,now);if(an==='idle'&&u.side===0&&u.guard){an='guard';i=0;}if(an==='idle'&&u.side===1&&u.charging){an='charge';i=(now>>3)%2;}}
 const f=frameOf(key,an,i,uOpt(u)),flip=def.human?u.side===1:false;
 let x=Math.round(fx0+u.ox+(u.side===0?u.kb:-u.kb)),y=Math.round(fy0+(u.oy||0));
 if(u.side===1&&u.broken&&u.alive)x+=Math.sin(now/2)>0?1:0;
 if(B.intro>0&&u.side===1&&u.boss){const p=B.intro/90;x-=Math.round(p*p*70);}
 /* 影 */
 const sw=Math.min(40,def.human?16:Math.round(def.w*.42));ctx.fillStyle='rgba(0,0,0,.32)';ctx.fillRect(x-sw/2,y-2,sw,3);ctx.fillRect(x-sw/2+2,y-3,sw-4,1);ctx.fillRect(x-sw/2+2,y+1,sw-4,1);
 const dx=flip?x-(f.W-f.ax):x-f.ax,dy=y-f.ay;
 const put=(img,ox2,oy2)=>{if(flip){ctx.save();ctx.translate(dx+f.W+(ox2||0),dy+(oy2||0));ctx.scale(-1,1);ctx.drawImage(img,0,0);ctx.restore();}else ctx.drawImage(img,dx+(ox2||0),dy+(oy2||0));};
 /* オーラ：覚醒（段階で濃くなる）／敵の溜め／虚蝕 */
 let aura=null;if(u.side===0&&u.aw&&u.alive)aura=[def.aw&&def.aw.glow||'#ffe27a',.35+.2*Math.sin(now/6)+.08*(u.awLv||1)];else if(u.side===1&&u.charging)aura=['#ff5030',.45+.35*Math.sin(now/3)];
 if(aura){const t=tintFrame(f,aura[0],'a'+aura[0]);ctx.globalAlpha=Math.max(0,Math.min(1,aura[1]));for(const[ax2,ay2]of[[-1,0],[1,0],[0,-1],[0,1],[-2,0],[2,0],[0,-2]])put(t,ax2,ay2);ctx.globalAlpha=1;}
 if(!u.alive&&u.side===1){const p=u.fade/(u.fadeMax||24);ctx.globalAlpha=Math.max(0,p);put(p>.7?whiteFrame(f):f.c,0,Math.round((1-p)*-6));ctx.globalAlpha=1;if(u.fade%2===0)B.parts.push({x:x-12+Math.random()*24,y:y-4-Math.random()*(def.ay*.7),vy:-.5-Math.random()*.6,l:26,c:u.boss?'#ffb070':'#c8b0ff'});return;}
 const fl=u.flash>0;if(fl)u.flash--;
 if(u.side===1&&u.boss&&u.pb){put(dmgFrame(u,f,key+an+i));}else put(fl&&(u.flash&2)===0?whiteFrame(f):f.c);
 if(fl&&u.flash>4)put(whiteFrame(f));
 /* 覚醒の粒子 */
 if(u.aw&&u.alive&&Math.random()<.22+.18*(u.awLv||1))B.parts.push({x:x-9+Math.random()*18,y:y-3,vy:-.4-Math.random()*.5*(u.awLv||1),l:30,c:(u.awLv||1)>=3&&Math.random()<.4?'#ffffff':(u.awLv||1)>=2&&Math.random()<.3?'#7fd6ff':(def.aw&&def.aw.glow)||'#ffe27a'});
 if(u.side===1&&u.broken&&u.alive){for(let k=0;k<3;k++){const a=now/9+k*2.094;ctx.fillStyle=k?'#ffe27a':'#ffffff';ctx.fillRect(Math.round(x+Math.cos(a)*9),Math.round(y-def.ay+10+Math.sin(a)*3),2,2);}}
 if(u.side===1&&u.charging&&(now>>3)%2){ctx.fillStyle='#ffb030';ctx.fillRect(x-1,y-def.ay+2,3,6);ctx.fillRect(x-1,y-def.ay+10,3,2);}
 if(B.cur===u&&u.side===0){ctx.fillStyle='#17131f';const ax=x,ay=y-36+((now>>4)%2);ctx.fillRect(ax-4,ay-1,9,3);ctx.fillRect(ax-3,ay+2,7,1);ctx.fillRect(ax-2,ay+3,5,1);ctx.fillRect(ax-1,ay+4,3,1);ctx.fillStyle='#ffd65a';ctx.fillRect(ax-3,ay,7,1);ctx.fillRect(ax-2,ay+1,5,1);ctx.fillRect(ax-1,ay+2,3,1);ctx.fillRect(ax,ay+3,1,1);}
 /* 狙っている敵 */
 if(B.tgt===u&&u.alive&&u.side===1&&aliveE().length>1){const p=(now>>4)%2,hw=Math.min(26,Math.round(def.w*.34)),top=y-Math.min(def.ay,60)+4;ctx.fillStyle='#ffd65a';for(const sx of[-1,1]){const cx=x+sx*(hw+p);ctx.fillRect(sx<0?cx:cx-4,top-p,5,1);ctx.fillRect(sx<0?cx:cx,top-p,1,5);ctx.fillRect(sx<0?cx:cx-4,y+p+1,5,1);ctx.fillRect(sx<0?cx:cx,y+p-3,1,5);}}};
/* 部位破壊の跡：壊れた部位に亀裂と焦げを重ねる */
const PART_RECT=[[.3,0,.75,.34],[.55,.3,1,.75],[0,.3,.42,.75]];
function dmgFrame(u,f,ck){u._dc=u._dc||{};const key=ck+'|'+u.pb;if(u._dc[key])return u._dc[key];const c=document.createElement('canvas');c.width=f.W;c.height=f.H;const g=c.getContext('2d');g.drawImage(f.c,0,0);g.globalCompositeOperation='source-atop';const R=rng(u.kind.length*31+7);
 for(let p=0;p<u.pb&&p<PART_RECT.length;p++){const[x0,y0,x1,y1]=PART_RECT[p],X0=x0*f.W,Y0=y0*f.H,w=(x1-x0)*f.W,h=(y1-y0)*f.H;
  for(let k=0;k<Math.round(w*h/26);k++){const px=X0+R()*w|0,py=Y0+R()*h|0,hot=R()<.22;g.fillStyle=hot?'#ff9a40':'rgba(18,8,26,.8)';g.fillRect(px,py,hot?1:1+(R()*3|0),hot?1:1+(R()*2|0));}
  let cx=X0+w*.5,cy=Y0;g.fillStyle='#120818';for(let k=0;k<h;k++){cx+=(R()*3|0)-1;g.fillRect(cx|0,(cy+k)|0,1,1);if(R()<.3)g.fillRect((cx+1)|0,(cy+k)|0,2,1);}}
 const ks=Object.keys(u._dc);if(ks.length>40)u._dc={};return u._dc[key]=c;}
partBreak=async function(e){const i=e.pb||0;if(i>=PARTS.length)return;e.pb=i+1;const[pn]=PARTS[i],def=SPDEF[uKey(e)],[fx0,fy0]=feet(e),r=PART_RECT[i],pcx=fx0-def.ax+(r[0]+r[2])/2*def.w,pcy=fy0-def.ay+(r[1]+r[3])/2*def.h,deb=B.deb||(B.deb=[]),R=rng(e.kind.length*31+i*7+e.lv);
 for(let k=0;k<46&&deb.length<160;k++){const sx=pcx+(R()-.5)*def.w*.4,sy=pcy+(R()-.5)*def.h*.3;deb.push({x:sx,y:sy,vx:(sx-fx0)*.05+(R()-.5)*1.6,vy:-1.2-R()*2,l:50+R()*35|0,fy:fy0-2+R()*10,c:R()<.25?'#ff9a40':cHex(ramp(def.col||'#8a8aa0')[R()<.5?1:2]),z:R()<.4?3:2});}
 e.atk=Math.round(e.atk*.9);e.mag=Math.round(e.mag*.9);FX('boom',pcx,pcy);FX('brk',pcx,pcy);setAni(e,'hurt',{sp:aSp(12)});e.kb=8;
 B.shake=20;B.flashBg=12;B.flashCol='#ffb070';sfxPart();
 const el=document.createElement('div');el.className='pbrk';el.innerHTML=`部位破壊！<small>${e.name}の${pn}が砕けた　攻撃・魔力-10%</small>`;$('#stage').appendChild(el);setTimeout(()=>el.remove(),1500);
 pop(e,pn+'破壊','#ffb070',true);log(`<b>部位破壊！</b> ${e.name}の${pn}が砕け散った（攻撃・魔力-10%　${e.pb}/${PARTS.length}）`);await wait(650);};

/* ---------- 戦闘画面の描画 ---------- */
function drawBattle18(){ctx.save();if(B&&B.shake>0){ctx.translate((Math.random()*4-2)|0,(Math.random()*4-2)|0);B.shake--;}
 ctx.drawImage(BG,0,0);
 if(B){if(B.intro>0)B.intro--;if(B.heroes.some(h=>h.aw)){ctx.fillStyle='rgba(255,210,110,.07)';ctx.fillRect(0,0,W,H);}
  [...B.enemies,...B.heroes].sort((a,b)=>(a.y+16*a.sc+(a.oy||0))-(b.y+16*b.sc+(b.oy||0))).forEach(drawUnit);B.fx.length=0;
  drawFx();
  if(B.domain){ctx.fillStyle='rgba(255,220,120,.10)';ctx.fillRect(0,0,W,H);for(const[gx,gy,gr,sp]of[[28,22,14,1],[150,30,10,-1.4],[96,10,7,2]]){const a0=tick/60*sp;for(let i=0;i<16;i++){const an=i/16*6.283;ctx.fillStyle='rgba(255,230,150,.4)';ctx.fillRect(Math.round(gx+Math.cos(an)*gr),Math.round(gy+Math.sin(an)*gr),1,1);}for(let i=0;i<8;i++){const an=a0+i/8*6.283;ctx.fillStyle='rgba(255,230,150,.45)';ctx.fillRect(Math.round(gx+Math.cos(an)*(gr+2))-1,Math.round(gy+Math.sin(an)*(gr+2))-1,3,3);}}}
  if(B.barrier>0){ctx.fillStyle='rgba(127,214,255,.5)';for(let j=0;j<H;j+=2)ctx.fillRect(100+Math.round(Math.sin(j*.11+tick/14)*2),j,1,1);}
  B.parts=B.parts.filter(p=>{p.y+=p.vy;p.l--;ctx.fillStyle=p.c;ctx.globalAlpha=Math.max(0,p.l/30);ctx.fillRect(p.x|0,p.y|0,1,1);return p.l>0;});ctx.globalAlpha=1;
  if(B.flashBg>0){ctx.globalAlpha=Math.min(1,B.flashBg/40);ctx.fillStyle=B.flashCol||'#fff4c8';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;B.flashBg--;if(!B.flashBg)B.flashCol=null;}
  if(B.intro>0){const p=Math.min(1,B.intro/20);ctx.fillStyle='#05020e';ctx.fillRect(0,0,W,Math.round(14*p));ctx.fillRect(0,H-Math.round(14*p),W,Math.round(14*p));if(B.intro>70){ctx.fillStyle=`rgba(5,2,14,${(B.intro-70)/20})`;ctx.fillRect(0,0,W,H);}}}
 ctx.restore();if(B&&B.deb&&B.deb.length)drawDeb();}
{const _d=draw;draw=function(){if(scene==='battle'){tick++;const k=bK();if(cv.width!==W*k||cv.height!==H*k){cv.width=W*k;cv.height=H*k;}ctx.setTransform(k,0,0,k,0,0);ctx.imageSmoothingEnabled=false;drawBattle18();requestAnimationFrame(draw);return;}_d();};}

/* ---------- モーションの連動 ---------- */
const atkStyle=u=>{const d=SPDEF[uKey(u)];return d&&d.human?((d.style||{}).atk||'slash'):'beast';};
const RANGED=['shoot','magic'];
const impactF=u=>{const s=atkStyle(u);return s==='heavy'?3:s==='shoot'?4:s==='magic'?3:s==='claw'?3:s==='reap'?3:s==='beast'?3:2;};
function fxHit(a,t,sk,first){const[mx,my]=uMid(t),el=sk.el,k=sk.k==='mag'?(ELFX[el]||'none'):(ELFX[el]||'smash'),dir=a.side===0?-1:1,c=ELC[el]||'#ffffff';
 FX(k,mx,my,{c,dir});if(sk.k!=='mag'&&ELFX[el]&&!['斬','打','突'].includes(el))FX(a.side===0&&['slash','reap','heavy','claw'].includes(atkStyle(a))?'slash':'smash',mx,my,{c:'#ffffff',dir});
 if(first&&(atkStyle(a)==='heavy'||(a.side===1&&a.boss)))FX('quake',mx,feet(t)[1]-10);}
{const _hit=hit;hit=async function(a,t,sk){const now=tick,hum=a.side===0||SPDEF[uKey(a)].human,mag=sk.k==='mag',st=atkStyle(a);
  const recent=a.an&&(a.an.k==='atk'||a.an.k==='mag')&&now-a.an.t0<46,same=a._ht===t&&recent,first=!recent;
  /* 攻撃側：構え→踏み込み→振り抜き。連撃は振りを速める */
  if(a.alive!==false){const ank=hum&&mag?'mag':'atk',F=mag&&hum?3:impactF(a);
   if(first){setAni(a,ank,{sp:aSp(5)});const[ax,ay]=uMid(a),[tx,ty]=uMid(t);
    if(mag||RANGED.includes(st)){FX('shot',ax+(a.side===0?-10:10),ay-2,{x1:tx,y1:ty,dur:Math.max(4,Math.round(aSp(5)*1.6)),wait:Math.round(aSp(5)*(F-1.4)),c:ELC[sk.el]||'#e0d0ff',kind:st==='shoot'&&!mag?'arrow':'orb'});}
    await wait(F*50);}
   else if(same||a._ht!==t){if(same){setAni(a,ank,{sp:aSp(4),t0:tick-Math.round(aSp(4)*(F-1))});await wait(34);}else if(!mag&&!RANGED.includes(st)&&now-a.an.t0>18){setAni(a,ank,{sp:aSp(4),t0:tick-Math.round(aSp(4)*(F-1))});await wait(34);}}
   a._ht=t;}
  /* 受ける側 */
  const guard=t.side===0&&t.guard;fxHit(a,t,sk,first);if(guard){const[mx,my]=uMid(t);FX('guard',mx,my);}else if(t.alive){setAni(t,'hurt',{sp:aSp(9)});t.kb=t.side===1&&t.boss?3:7;}
  const hp0=t.hp,d=await _hit(a,t,sk);
  if(d===0&&t.alive&&hp0===t.hp){setAni(t,'dodge',{sp:aSp(8)});t.kb=0;}
  return d;};}
{const _da=doAction;doAction=async function(u,sk,t){let dashed=false;
  if(u.side===0&&sk&&u.alive){const k=sk.k,st=atkStyle(u),phys=['phys','rhythm','release','release2','zen','reso'].includes(k);
   if(k==='guard'||k==='kenshu'||k==='guardRegen'){const[mx,my]=uMid(u);FX('guard',mx,my);}
   else if(phys&&!RANGED.includes(st)&&k!=='reso'&&k!=='zen'){const tg=sk.t==='one'&&t&&t.alive?t:null,[fx0,fy0]=feet(u);let gx,gy;if(tg){const[ex,ey]=feet(tg),d=SPDEF[uKey(tg)];gx=ex+Math.min(34,Math.round((d.w-d.ax)*.55))+14;gy=ey+2;}else{gx=96;gy=fy0*.5+38;}
    u.dash=Math.min(0,gx-fx0);u.dashY=(gy-fy0)*.75;setAni(u,'walk',{sp:aSp(4)});dashed=true;await wait(150);setAni(u,'idle');}
   else if(['heal','healAll','revive','reviveAll','barrier','taunt','haste','cheer','grace','scan','roar','charge','pct'].includes(k)){setAni(u,'cast',{sp:aSp(8)});}
   else if(k==='item'){setAni(u,'item',{sp:aSp(12)});}}
  try{await _da(u,sk,t);}finally{if(dashed){u.dash=0;u.dashY=0;if(u.alive){setAni(u,'dodge',{sp:aSp(7)});}await wait(120);}u._ht=null;}};}
{const _et=enemyTurn;enemyTurn=async function(e){const d=SPDEF[uKey(e)];e._lunge=d&&d.human?30:e.boss?10:18;e._ht=null;await _et(e);};}
/* 回復・復活・ブレイクなどの文字ポップに合わせてエフェクトを出す */
{const _pop=pop;pop=function(u,txt,col,small,kind,el){_pop(u,txt,col,small,kind,el);if(!B||!u||u.x==null)return;const s=String(txt),[mx,my]=uMid(u);
  if(/^\+\d+$/.test(s))FX('heal',mx,my);else if(s==='REVIVE'||s==='奇跡！'){FX('revive',mx,my);setAni(u,'awaken',{sp:aSp(7)});}else if(/^AG\+|^SP\+|HASTE|充填/.test(s))FX('buff',mx,my,{c:/SP/.test(s)?'#6fb2ff':/HASTE/.test(s)?'#8ff0a8':'#ffe27a'});
  else if(s==='DELAY'||s==='凍結')FX('delay',mx,my);else if(s==='BREAK!!'){FX('brk',mx,my);u.kb=10;}else if(s==='MISS')FX('wind',mx,my);else if(s==='SCAN')FX('light',mx,my);
  if(kind&&/crit/.test(kind))FX('crit',mx,my);};}
{const _kill=kill;kill=async function(t){const boss=t.side===1&&t.boss,[mx,my]=uMid(t);await _kill(t);if(t.alive)return;
  if(t.side===1){FX('ko',mx,my,{c:boss?'#ffb070':'#c8b0ff'});if(boss&&!(B.opts.stages&&(B.stage||0)<B.opts.stages.length-1&&0)){t.fade=t.fadeMax=96;B.shake=30;const d=SPDEF[uKey(t)];
    for(let k=0;k<7;k++)FX('boom',mx-d.w*.3+Math.random()*d.w*.6,my-d.h*.25+Math.random()*d.h*.5,{wait:k*9});B.flashBg=30;B.flashCol='#ffffff';SFX.brk();setTimeout(()=>{try{SFX.brk();}catch(e){}},260*SPD[speed]);await wait(900);}}
  else{t.dash=0;t.dashY=0;}};}
{const _aw=awaken;awaken=async function(u){const p=_aw(u);/* カットインを新しい顔ドットに差し替える */
  try{const c=$('#cut canvas'),f=frameOf(u.id,'idle',0,heroOpt(u.id,true)),d=SPDEF[u.id];if(c&&f&&d){c.width=c.height=24;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,24,24);g.drawImage(f.c,d.face[0]-3,d.face[1]-3,24,24,0,0,24,24);}}catch(e){}
  const[mx]=uMid(u);FX('awaken',mx,feet(u)[1],{c:(SPDEF[u.id].aw||{}).glow||'#ffe27a'});setAni(u,'awaken',{sp:aSp(9),hold:1});B.shake=10;await p;if(u.alive)setAni(u,'idle');u._os=-1;};}
{const _ea=endAw;endAw=function(u,silent){_ea(u,silent);u._os=-1;};}
{const _end=end;end=async function(win){if(win&&B)B.heroes.forEach((h,i)=>{if(h.alive){h.dash=0;h.dashY=0;setAni(h,'win',{t0:tick+i*3});}});await _end(win);
  if(win&&B&&/レベルアップ/.test($('#ov').innerHTML))B.heroes.forEach(h=>{if(h.alive){const[mx,my]=uMid(h);FX('lvup',mx,my);}});};}
/* ボス戦の導入：暗転→ボスが姿を現す→名乗り */
{const _sb=startBattle;startBattle=function(list,opts={}){_sb(list,opts);if(!B)return;B.fx2=[];const boss=B.enemies.find(e=>e.boss);
  if(boss&&(opts.boss||opts.trial||opts.stages)){B.intro=90;B.shake=0;setTimeout(()=>{if(B&&!B.over){B.shake=14;try{SFX.brk();}catch(e){}}},1150);
   const el=document.createElement('div');el.className='bossin';el.innerHTML=`<small>${opts.trial?'覚醒の試練':'BOSS'}</small><b>${boss.name}</b>`;$('#stage').appendChild(el);setTimeout(()=>el.remove(),2300);}};}
if(typeof nextStage==='function'){const _ns=nextStage;nextStage=async function(){await _ns();if(B){B.intro=60;B.enemies.forEach(e=>{e._k=null;});const boss=B.enemies.find(e=>e.boss&&e.alive);if(boss){const el=document.createElement('div');el.className='bossin';el.innerHTML=`<small>BOSS</small><b>${boss.name}</b>`;$('#stage').appendChild(el);setTimeout(()=>el.remove(),2300);}}};}
/* 交代で入った仲間は駆け込んでくる */
{const _hero=hero;hero=function(id){const h=_hero(id);h.an={k:'idle',t0:(id.length*17)|0};return h;};}
