/* ===== ver0.18 拠点：ホーム画面（灯都ルミナスの街並み）・酒場・依頼掲示板・道具屋・各施設の店内 ===== */
'use strict';
let TSC='home',RSHOW=0;                 /* 街の画面：home／bar／shop／smith／eye／other */
const HOME_H=176;
const homeH=()=>innerHeight<600?128:innerHeight<680?152:HOME_H;
const BYM=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
function gradB(b,y0,y1,cols,x0=0,x1=b.w){const cs=cols.map(C);for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const t=(y-y0)/(y1-y0)*(cs.length-1),i=Math.min(cs.length-2,Math.floor(t));b.px(x,y,(t-i)*16>BYM[(y%4)*4+x%4]?cs[i+1]:cs[i]);}}
function stampIcon(b,k,x,y,col){const t=new Buf(16,16);(ICD[k]||ICD.shop)(t,{blade:ramp(col||'#c8d0e0'),leather:ramp('#7a4a30'),guard:ramp('#e8c040'),trim:ramp('#e8c040'),metal:ramp('#b8c0d0'),white:ramp('#f4f0e6'),glow:ramp('#ffe27a')});t.outline();b.blit(t,x,y);}
function signB(b,x,y,k){const w=ramp('#6a4628'),g=ramp('#e8c040');b.rect(x+8,y-4,1,4,C('#2a2030'));part(b,q=>{q.rect(x,y,18,17,w[1]);q.rect(x,y,18,1,w[0]);q.rect(x,y+16,18,1,w[2]);q.rect(x,y,1,17,g[1]);q.rect(x+17,y,1,17,g[2]);});stampIcon(b,k,x+1,y+1);}
function house(b,x,y,w,h,o){const Wc=ramp(o.wall),Rc=ramp(o.roof),T=ramp(o.trim||'#5a3a26'),rh=o.rh||10,St=ramp('#6e6e84'),lit=C('#ffd36a'),lit2=C('#fff3b0');
 part(b,q=>{q.rect(x,y-h,w,h,Wc[1]);q.rect(x,y-h,2,h,Wc[0]);q.rect(x+w-3,y-h,3,h,Wc[2]);
  if(o.brick)for(let r=0;r<h;r+=4){q.rect(x,y-h+r+3,w,1,Wc[2]);for(let c=(r%8?3:0);c<w;c+=7)q.rect(x+c,y-h+r,1,3,Wc[2]);}
  if(o.timber){q.rect(x,y-h,w,1,T[1]);for(let i=0;i<w;i+=o.timber)q.rect(x+i,y-h,1,h,T[1]);q.rect(x+w-1,y-h,1,h,T[2]);q.rect(x,y-h+((h/2)|0),w,1,T[1]);}
  q.rect(x,y-3,w,3,St[1]);q.rect(x,y-3,w,1,St[0]);
  (o.win||[]).forEach(([wx,wy,ww=5,wh=6,c])=>{q.rect(x+wx-1,y-h+wy-1,ww+2,wh+2,T[2]);q.rect(x+wx,y-h+wy,ww,wh,c?C(c):lit);q.rect(x+wx,y-h+wy,ww,2,c?C(c):lit2);q.rect(x+wx+(ww>>1),y-h+wy,1,wh,T[2]);q.rect(x+wx-1,y-h+wy+wh,ww+2,1,T[0]);});
  if(o.door!=null){const dx=x+o.door,D=ramp(o.doorC||'#7a4a2c');q.rect(dx-1,y-13,9,13,T[2]);q.rect(dx,y-12,7,12,D[1]);q.rect(dx,y-12,2,12,D[0]);q.rect(dx+3,y-12,1,12,D[2]);q.px(dx+5,y-6,C('#ffd84a'));q.rect(dx,y-12,7,1,D[0]);}});
 part(b,q=>{q.poly([[x-3,y-h+1],[x+w+3,y-h+1],[x+w-4,y-h-rh],[x+4,y-h-rh]],Rc[1]);for(let r=2;r<rh;r+=3){const k=r/rh*7;q.rect(Math.round(x-3+k)+1,y-h-r,Math.round(w+6-k*2)-2,1,Rc[2]);}
  for(let c=x;c<x+w;c+=5)q.px(c,y-h-1,Rc[0]);q.rect(x+4,y-h-rh,w-8,1,Rc[0]);q.rect(x-3,y-h,w+6,1,Rc[3]);});
 if(o.chim!=null)part(b,q=>{const cx=x+o.chim,K=ramp('#7a6a6c');q.rect(cx,y-h-rh-7,6,10,K[1]);q.rect(cx,y-h-rh-7,2,10,K[0]);q.rect(cx-1,y-h-rh-8,8,2,K[2]);});
 if(o.awn){const A1=C(o.awn),A2=C('#f4f0e6');for(let i=0;i<w+4;i++){const c=((i/4)|0)%2?A1:A2;b.rect(x-2+i,y-h+5,1,5,c);b.px(x-2+i,y-h+10+((i%4)===1||(i%4)===2?0:-1),c);}b.rect(x-2,y-h+4,w+4,1,C('#3a2a30'));}}
/* 灯都の街並み */
function paintTown18(p){const b=new Buf(W,HOME_H),R=rng(18),St=ramp('#8e8aa8');
 gradB(b,0,98,['#060822','#0c1440','#1a2866','#343e82','#5c5294','#8c6a96']);
 for(let i=0;i<70;i++)b.px(R()*W|0,R()*70|0,C(['#ffffff','#c8d0ff','#ffe9a0','#8890c0'][R()*4|0]));
 b.ell(150,17,7,7,C('#fff6d8'));b.ell(152,15,6,6,C('#efe2b0'));b.ell(150,17,7,7,C('#fff6d8'));b.px(147,15,C('#e8d8a0'));b.rect(151,19,2,2,C('#e8d8a0'));b.px(153,14,C('#e8d8a0'));
 /* 遠くの山と奥の家並み */
 for(let x=0;x<W;x++){const h=14+Math.sin(x*.05)*7+Math.sin(x*.13+1)*4;b.rect(x,98-h-10,1,h+10,C('#252a5a'));}
 for(let x=0;x<W;x++){const h=8+Math.sin(x*.09+2)*4+Math.sin(x*.23)*2;b.rect(x,98-h-4,1,h+4,C('#1b1f46'));}
 let x=0;while(x<W){const w=9+R()*9|0,h=12+R()*16|0;if(x+w>74&&x<106){x=106;continue;}const col=C(R()<.5?'#171a36':'#1f2346');b.rect(x,98-h,w,h,col);for(let i=0;i<=w/2;i++)b.rect(x+i,98-h-Math.round(i*.7),w-i*2,1,col);
  for(let wy=98-h+3;wy<94;wy+=5)for(let wx=x+2;wx<x+w-2;wx+=4)if(R()<.2+.45*p){b.rect(wx,wy,2,2,C(R()<.8?'#ffd36a':'#ffa040'));}x+=w+1;}
 /* 星詠みの塔（右奥） */
 part(b,q=>{const T=ramp('#9aa0d0'),Rf=ramp('#3a4aa8');q.rect(152,46,12,54,T[1]);q.rect(152,46,3,54,T[0]);q.rect(161,46,3,54,T[2]);for(let y=54;y<98;y+=9)q.rect(152,y,12,1,T[2]);q.rect(156,58,4,6,C('#ffe9a0'));q.rect(156,76,4,6,C('#9fd8ff'));
  q.poly([[149,47],[167,47],[158,30]],Rf[1]);q.line(150,46,158,31,Rf[0],1);q.rect(149,46,18,2,Rf[2]);});
 part(b,q=>{const Y=ramp('#ffd84a');q.poly([[158,19],[159.5,23],[163.5,23],[160.3,25.5],[161.5,29.5],[158,27],[154.5,29.5],[155.7,25.5],[152.5,23],[156.5,23]],Y[1]);q.px(157,22,C('#ffffff'));});
 /* 大灯（おおあかり） */
 part(b,q=>{for(let y=36;y<100;y++){const w=7+(y-36)*.085;q.rect(Math.round(90-w),y,Math.round(w*2),1,St[(y>>3)%2?1:1]);}for(let y=36;y<100;y++){const w=7+(y-36)*.085;q.rect(Math.round(90-w),y,3,1,St[0]);q.rect(Math.round(90+w)-4,y,4,1,St[2]);if(y%9===0)q.rect(Math.round(90-w),y,Math.round(w*2),1,St[2]);}
  for(const y of[48,62,78])q.rect(88,y,4,6,C('#ffe9a0'));q.rect(86,88,9,12,C('#3a2a3a'));q.rect(87,89,7,11,ramp('#8a5a34')[1]);q.rect(90,89,1,11,ramp('#8a5a34')[2]);
  q.rect(80,33,20,3,St[1]);q.rect(80,33,20,1,St[0]);q.rect(78,31,24,2,St[2]);});
 part(b,q=>{const G2=ramp('#e8c040'),D=ramp('#3a3a5a');q.rect(83,18,14,13,C('#fff3b0'));q.rect(85,20,10,9,C('#ffffff'));for(const xx of[83,87,92,96])q.rect(xx,18,1,13,D[1]);q.rect(82,17,16,1,D[1]);q.poly([[80,18],[100,18],[90,7]],D[1]);q.line(81,17,90,8,D[0],1);q.rect(89,3,2,5,G2[1]);q.px(89,2,G2[0]);q.px(90,2,G2[0]);});
 /* 広場の石畳 */
 gradB(b,98,HOME_H,['#4a4868','#42405e','#3a3854','#33314a']);
 for(let y=99;y<HOME_H;y+=5){const off=((y/5)|0)%2?4:0;for(let xx=-off;xx<W;xx+=9){b.rect(xx,y+4,8,1,C('#2a2840'));b.rect(xx+8,y,1,5,C('#2a2840'));if(R()<.25)b.rect(xx+1,y,6,1,C('#5a5878'));if(R()<.12)b.rect(xx+2,y+1,4,2,C('#4e4c6c'));}}
 /* 赤い絨毯と広場の紋 */
 const Rd=ramp('#b0323c'),Gd=ramp('#e8c040');for(let y=100;y<HOME_H;y++){const w=5+(y-100)*.07;b.rect(Math.round(90-w),y,Math.round(w*2),1,Rd[(y%6)<1?2:1]);b.px(Math.round(90-w),y,Gd[1]);b.px(Math.round(90+w)-1,y,Gd[2]);}
 {const t=new Buf(W,HOME_H);t.ell(90,142,30,13,Rd[1]);t.ell(90,142,27,11.4,Gd[1]);t.ell(90,142,25.6,10.6,Rd[1]);for(let y=129;y<156;y++)for(let xx=62;xx<120;xx++)if(t.get(xx,y)===Rd[1]&&((xx>>2)+(y>>1))%2&&Math.hypot((xx-90)/25,(y-142)/10.6)<.94)t.px(xx,y,Rd[2]);b.blit(t,0,0);}
 /* 中央の灯の像 */
 part(b,q=>{const S2=ramp('#9a98b4');q.ell(90,145,9,4,S2[2]);q.ell(90,143,8,3.4,S2[1]);q.rect(86,131,8,12,S2[1]);q.rect(86,131,2,12,S2[0]);q.rect(92,131,2,12,S2[2]);q.rect(84,129,12,2,S2[0]);});
 part(b,q=>{const Y=ramp('#ffd84a');q.poly([[90,112],[92.4,119],[99,119],[93.6,123],[95.6,129.5],[90,125.6],[84.4,129.5],[86.4,123],[81,119],[87.6,119]],Y[1]);q.poly([[90,112],[87.6,119],[90,121]],Y[0]);q.px(88,117,C('#ffffff'));});
 /* 施設 */
 house(b,6,122,44,24,{wall:'#c8a078',roof:'#a8423a',timber:11,win:[[5,6],[31,6],[5,15,5,5]],door:18,rh:11,chim:30});signB(b,34,104,'bar');
 house(b,130,122,44,22,{wall:'#8a8a9c',roof:'#4a4a68',brick:1,win:[[30,6]],door:6,rh:9,chim:28,trim:'#3a3448'});
 b.rect(149,107,11,12,C('#2a1c1c'));b.rect(150,110,9,9,C('#ff7a28'));b.rect(152,113,5,6,C('#ffd050'));b.rect(153,116,3,3,C('#fff6c0'));signB(b,131,84,'smith');
 house(b,2,162,38,20,{wall:'#e4d8bc',roof:'#3a8a5a',win:[[26,9,6,6]],door:6,rh:6,awn:'#3aa868',trim:'#5a4a3a'});signB(b,24,138,'potion');
 part(b,q=>{const K=ramp('#9a6a3a');q.rect(41,154,7,7,K[1]);q.rect(41,154,7,1,K[0]);q.rect(44,154,1,7,K[2]);q.rect(43,148,6,6,K[1]);q.rect(43,148,6,1,K[0]);});
 house(b,140,162,38,20,{wall:'#7a6aa8',roof:'#5a3a9a',win:[[6,8,6,7,'#9fe0ff']],door:24,rh:8,trim:'#3a2a5c',doorC:'#4a3a7a'});signB(b,160,136,'eye');
 /* 街灯・花壇・旗 */
 for(const lx of[62,117]){part(b,q=>{const M=ramp('#4a4a66');q.rect(lx,112,2,16,M[1]);q.rect(lx,112,1,16,M[0]);q.rect(lx-2,127,6,2,M[2]);q.rect(lx-2,107,6,5,C('#ffd36a'));q.rect(lx-1,108,2,2,C('#ffffff'));q.rect(lx-3,106,8,1,M[1]);q.rect(lx-3,112,8,1,M[1]);});}
 for(const[fx,fy]of[[52,160],[122,160],[56,104],[118,104]]){part(b,q=>{const P2=ramp('#7a6a5a'),Gn=ramp('#4a9a4a');q.rect(fx,fy,10,4,P2[1]);q.rect(fx,fy,10,1,P2[0]);q.ell(fx+5,fy-1,5,2.6,Gn[1]);for(let k=0;k<4;k++)q.px(fx+1+k*2+(k&1),fy-2-(k&1),C(['#ff8aa0','#ffe27a','#ffffff','#ff9a40'][k]));});}
 for(const bx of[70,108]){part(b,q=>{q.rect(bx,96,1,14,C('#c8c8d8'));q.poly([[bx+1,97],[bx+7,98],[bx+7,104],[bx+4,103],[bx+1,105]],Rd[1]);q.px(bx+3,100,Gd[1]);});}
 /* 発展していない街は色がくすむ */
 const t=(1-p)*.72,s=b.d;if(t>.02)for(let i=0;i<s.length;i++){const c=s[i];if(!c)continue;const l=cR(c)*.3+cG(c)*.59+cB(c)*.11,warm=cR(c)>220&&cG(c)>180&&cB(c)<200?.35:1;s[i]=cMix(c,cRGB(l*.92,l*.92,l*1.04),t*warm);}
 return b.canvas();}
/* 店内 */
function paintRoom(kind,h){const b=new Buf(W,h),R=rng(kind.length*13+5),wy=Math.round(h*.58),P=({bar:['#6a4630','#8a5e3e'],shop:['#7a6a4a','#9a7a52'],smith:['#5a5a6c','#5a4a40'],eye:['#3a2a5c','#5a4a6a']})[kind],Wl=ramp(P[0]),Fl=ramp(P[1]),Wd=ramp('#7a5234');
 /* 奥の壁 */
 b.rect(0,0,W,wy,Wl[1]);if(kind==='smith'){for(let y=0;y<wy;y+=6){b.rect(0,y+5,W,1,Wl[2]);for(let x=(y%12?5:0);x<W;x+=11)b.rect(x,y,1,5,Wl[2]);}}else for(let x=0;x<W;x+=9){b.rect(x,0,1,wy,Wl[2]);b.rect(x+1,0,1,wy,Wl[0]);}
 b.rect(0,0,W,3,Wl[3]);b.rect(0,wy-3,W,3,Wl[2]);
 /* 床 */
 gradB(b,wy,h,[cHex(Fl[1]),cHex(Fl[2])]);for(let y=wy+4;y<h;y+=6){b.rect(0,y,W,1,Fl[3]);for(let x=((y*7)%23);x<W;x+=23)b.rect(x,y-5,1,5,Fl[3]);}
 const shelf=(x,y,w,rows,items)=>{part(b,q=>{q.rect(x,y,w,rows*9+2,Wd[2]);q.rect(x,y,w,1,Wd[0]);for(let r=0;r<rows;r++){q.rect(x+1,y+1+r*9,w-2,8,C('#2a1c18'));q.rect(x,y+9+r*9,w,1,Wd[1]);for(let i=x+2;i<x+w-3;i+=3+(R()*2|0)){items(q,i,y+9+r*9,R);}}});};
 const bottle=(q,x,y,R2)=>{const c=ramp(['#e04858','#4a8ae8','#ffd84a','#5adc7a','#c07aff','#f0f0f8'][R2()*6|0]),hh=3+(R2()*3|0);q.rect(x,y-hh,2,hh,c[1]);q.px(x,y-hh,c[0]);q.px(x,y-hh-1,C('#d8e8f4'));};
 const lantern=x=>{b.rect(x+2,3,1,6,C('#2a2030'));part(b,q=>{q.rect(x,9,5,6,C('#ffd36a'));q.rect(x+1,10,2,2,C('#ffffff'));q.rect(x-1,8,7,1,C('#3a3048'));q.rect(x-1,15,7,1,C('#3a3048'));});};
 if(kind==='bar'){shelf(60,8,62,2,bottle);lantern(28);lantern(146);
  /* 依頼掲示板 */
  part(b,q=>{q.rect(134,14,36,26,Wd[1]);q.rect(134,14,36,2,Wd[0]);q.rect(136,17,32,21,C('#c8a878'));for(const[px,py,c]of[[138,19,'#f4f0e6'],[149,20,'#efe6cc'],[159,19,'#f4f0e6'],[142,29,'#efe6cc'],[154,29,'#f4f0e6']]){q.rect(px,py,8,8,C(c));q.rect(px+1,py+2,6,1,C('#8a7a60'));q.rect(px+1,py+4,5,1,C('#8a7a60'));q.px(px+4,py,C('#c8343c'));}});
  /* 樽 */
  for(const[bx,by]of[[6,wy-14],[22,wy-10]])part(b,q=>{const K=ramp('#9a6a3a'),M=ramp('#8a8a9c');q.ell(bx+7,by+9,7,9.5,K[1]);q.rect(bx+2,by+2,2,14,K[0]);q.rect(bx+10,by+2,2,14,K[2]);q.rect(bx,by+4,14,1,M[1]);q.rect(bx,by+13,14,1,M[1]);q.rect(bx+6,by+8,2,2,M[2]);});}
 if(kind==='shop'){shelf(8,6,58,2,bottle);shelf(114,6,58,2,(q,x,y,R2)=>{const c=ramp(['#b07840','#8a94a8','#c8343c','#3a8a5a'][R2()*4|0]);q.rect(x,y-4,3,4,c[1]);q.rect(x,y-4,3,1,c[0]);});lantern(88);
  for(const hx of[72,80,100,106])part(b,q=>{const Gn=ramp('#5a9a4a');q.rect(hx,3,1,5,C('#6a4a30'));q.ell(hx+.5,11,2.4,3.6,Gn[1]);q.px(hx,9,Gn[0]);});
  part(b,q=>{const K=ramp('#9a6a3a');q.rect(6,h-18,16,14,K[1]);q.rect(6,h-18,16,2,K[0]);q.rect(13,h-18,2,14,K[2]);q.rect(24,h-12,12,8,K[1]);q.rect(24,h-12,12,1,K[0]);});
  part(b,q=>{const S=ramp('#c8b890');q.ell(160,h-9,9,7,S[1]);q.ell(157,h-12,4,3,S[0]);q.rect(157,h-17,6,3,S[2]);});}
 if(kind==='smith'){/* 炉 */part(b,q=>{const K=ramp('#4a444e');q.rect(8,10,40,wy-10,K[1]);q.rect(8,10,40,2,K[0]);q.rect(14,2,14,8,K[2]);q.rect(15,wy-22,26,20,C('#1a1010'));});
  b.rect(17,wy-16,22,14,C('#d8401a'));b.rect(20,wy-12,16,10,C('#ff8a28'));b.rect(24,wy-8,8,6,C('#ffd050'));
  part(b,q=>{q.rect(112,10,56,3,Wd[1]);});for(let k=0;k<5;k++){const t=new Buf(W,h);drawWeapon(t,['sword','axe','gsword','spear','sword'][k],118+k*11,34,90,{blade:ramp(['#d09060','#b8c0d0','#e4ecfa','#b8c0d0','#ffe89a'][k]),leather:ramp('#7a4a30'),hilt:ramp('#7a4a30'),guard:ramp('#e8c040'),trim:ramp('#e8c040')});t.outline();b.blit(t,0,0);}
  part(b,q=>{const M=ramp('#8a94a8');q.rect(70,h-16,22,5,M[1]);q.rect(70,h-16,22,1,M[0]);q.poly([[92,h-16],[98,h-14],[92,h-12]],M[1]);q.rect(76,h-11,10,4,M[2]);q.rect(72,h-7,18,4,M[1]);});}
 if(kind==='eye'){for(let x=0;x<W;x+=30){const D=ramp('#7a3a8a');part(b,q=>{q.poly([[x,3],[x+30,3],[x+26,20],[x+15,26],[x+4,20]],D[1]);q.line(x+8,4,x+10,20,D[2],1);q.line(x+22,4,x+20,20,D[2],1);q.rect(x,3,30,2,ramp('#e8c040')[1]);});}
  for(let i=0;i<24;i++)b.px(R()*W|0,28+R()*(wy-34)|0,C(i%3?'#ffe27a':'#ffffff'));shelf(126,26,46,1,(q,x,y,R2)=>{GEMC(['#ff5a5a','#5a8aff','#5adc7a','#c07aff','#ffe14a'][R2()*5|0])(q,x+1,y-3,2);});}
 /* カウンター */
 const cy=wy+Math.round((h-wy)*.18);b._cy=cy;
 return{b,cy,wy};}
function counterB(b,cy,h){const Wd=ramp('#8a5e36');part(b,q=>{q.rect(40,cy,100,3,Wd[0]);q.rect(40,cy+3,100,Math.min(18,h-cy-8),Wd[1]);q.rect(40,cy+3,100,1,Wd[3]);for(let x=44;x<140;x+=12)q.rect(x,cy+4,1,Math.min(17,h-cy-9),Wd[2]);q.rect(40,cy+3,2,Math.min(18,h-cy-8),Wd[0]);});}
const ROOMC={},ROOMH={bar:104,shop:104,smith:84,eye:84},ROOMNPC={bar:'barkeep',shop:'shopgirl',smith:'smithy',eye:'seer'};
function roomImg(kind,h){const k=kind+h;if(ROOMC[k])return ROOMC[k];const{b,cy}=paintRoom(kind,h);const bg=b.canvas(),f=new Buf(W,h);counterB(f,cy,h);
 if(kind==='shop'){const t=new Buf(W,h);for(const[k2,x]of[['potion',48],['ether',64],['drop',116]]){stampIcon(t,k2,x,cy-14);}f.blit(t,0,0);}
 if(kind==='eye'){f.ell(112,cy-6,6,6,C('#9fe0ff'));f.ell(110,cy-8,2.4,2.4,C('#ffffff'));f.rect(107,cy-1,10,2,ramp('#e8c040')[1]);}
 if(kind==='bar'){const M=ramp('#f0b030');for(const x of[52,122]){f.rect(x,cy-7,6,7,ramp('#a87038')[1]);f.rect(x+1,cy-6,4,5,M[1]);f.rect(x,cy-9,6,2,C('#fff6e0'));}}
 return ROOMC[k]={bg,fg:f.canvas(),cy};}
/* ---------- 街の描画 ---------- */
let TOWN18=null,TOWNP=-1;const WALK=[];
function townImg(){const p=townP();if(!TOWN18||Math.abs(p-TOWNP)>.001){TOWN18=paintTown18(p);TOWNP=p;}return TOWN18;}
makeTown=function(p=1){const c=document.createElement('canvas');c.width=W;c.height=128;c.getContext('2d').drawImage(paintTown18(p),0,0);return c;};
TOWN=makeTown(townP());TBG=null;
function lampGlow(cx,cy,r,a){for(let k=4;k>0;k--){ctx.fillStyle=`rgba(255,226,140,${a*.2})`;const rr=Math.round(r*k/4);ctx.fillRect(cx-rr,cy-Math.round(rr*.5),rr*2,rr);ctx.fillRect(cx-Math.round(rr*.6),cy-rr,Math.round(rr*1.2),rr*2);}}
function drawSprite(key,anim,i,opt,x,y,flip){const f=frameOf(key,anim,i,opt||'');if(!f)return;ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(x-6,y-1,12,2);ctx.fillRect(x-5,y-2,10,1);ctx.fillRect(x-5,y+1,10,1);const dx=flip?x-(f.W-f.ax):x-f.ax,dy=y-f.ay+1;if(flip){ctx.save();ctx.translate(dx+f.W,dy);ctx.scale(-1,1);ctx.drawImage(f.c,0,0);ctx.restore();}else ctx.drawImage(f.c,dx,dy);}
function drawHome(){const off=H-HOME_H;ctx.drawImage(townImg(),0,off);
 const a=.5+.2*Math.sin(tick/25);lampGlow(90,24+off,34,a);
 const ang=tick/110,dx=Math.cos(ang),al=.16*Math.abs(dx);if(al>.01){ctx.fillStyle=`rgba(255,240,180,${al})`;const dir=dx>0?1:-1;for(let i=0;i<60;i++){const x=90+dir*i*2,hh=2+i*.34;ctx.fillRect(dir>0?x:x-2,Math.round(24+off-hh/2),2,Math.round(hh));}}
 /* 煙・炉の火・像のきらめき */
 for(let k=0;k<4;k++){const t=(tick+k*22)%88;ctx.fillStyle=`rgba(200,200,220,${.45*(1-t/88)})`;ctx.fillRect(Math.round(160+Math.sin((t+k*9)*.08)*3),off+81-Math.round(t*.32),3+(t>40?1:0),3);}
 if(G&&G.members&&G.members.includes('balza')||1){ctx.fillStyle=(tick>>3)%2?'#ffe9a0':'#ffb040';ctx.fillRect(153,off+116,3,2);}
 if((tick>>4)%4===0){ctx.fillStyle='#ffffff';ctx.fillRect(86+((tick>>4)*3)%9,off+113+((tick>>4)*5)%12,1,1);}
 /* 空中庭園 */
 if(G&&G.fac&&G.fac.garden){const gy=off+40+Math.round(Math.sin(tick/40)*2);ctx.drawImage(gardenIsle(),18,gy);}
 /* 広場を歩く仲間 */
 if(G&&G.party){while(WALK.length<G.party.length)WALK.push({x:60+WALK.length*20,y:150+WALK.length*5,tx:0,ty:0,w:20+WALK.length*30,d:-1,mv:0});WALK.length=G.party.length;
  WALK.forEach((w,i)=>{if(w.w>0){w.w--;w.mv=0;if(!w.w){for(let t=0;t<8;t++){w.tx=46+Math.random()*88;w.ty=126+Math.random()*44;if(Math.hypot((w.tx-90)/14,(w.ty-140)/9)>1.25)break;}}}
   else{const ddx=w.tx-w.x,ddy=w.ty-w.y,d=Math.hypot(ddx,ddy);if(d<.6){w.w=60+Math.random()*160|0;w.mv=0;}else{w.x+=ddx/d*.3;w.y+=ddy/d*.22;w.mv=1;if(Math.abs(ddx)>.3)w.d=ddx>0?1:-1;}}});
  WALK.map((w,i)=>[w,G.party[i]]).sort((p,q)=>p[0].y-q[0].y).forEach(([w,id],i)=>drawSprite(SPDEF[id]?id:'rio',w.mv?'walk':'idle',w.mv?(tick>>3):(tick>>4)+i,FOPT,Math.round(w.x),Math.round(w.y)+off,w.d>0));}}
let ISLE18=null;function gardenIsle(){if(ISLE18)return ISLE18;const b=new Buf(40,26),Rk=ramp('#7a6a5a'),Gn=ramp('#5aa84a');part(b,q=>{q.poly([[3,10],[37,10],[30,18],[22,24],[14,19],[8,16]],Rk[1]);q.poly([[3,10],[20,10],[14,19],[8,16]],Rk[0]);q.ell(20,9,18,4,Gn[1]);q.ell(14,8,8,2,Gn[0]);});part(b,q=>{const T=ramp('#3a8a3c');q.rect(26,3,2,6,ramp('#6a4a30')[1]);q.ell(27,3,4,3.4,T[1]);q.ell(26,2,2,1.6,T[0]);});for(const[x,c]of[[9,'#ff8aa0'],[14,'#ffe27a'],[19,'#ffffff']])b.px(x,7,C(c));return ISLE18=b.canvas();}
function drawRoom(){const kind=TSC,r=roomImg(kind,H),npc=ROOMNPC[kind];ctx.drawImage(r.bg,0,0);
 if(kind==='smith'){ctx.fillStyle=`rgba(255,150,60,${.10+.05*Math.sin(tick/7)})`;ctx.fillRect(0,0,74,H);ctx.fillStyle=(tick>>3)%2?'#fff6c0':'#ffd050';ctx.fillRect(25+((tick>>3)%3)*2,Math.round(H*.58)-9,3,3);}
 if(kind==='eye'){ctx.fillStyle=`rgba(159,224,255,${.08+.05*Math.sin(tick/11)})`;ctx.fillRect(84,r.cy-24,56,34);}
 for(const lx of(kind==='bar'?[30,148]:kind==='shop'?[90]:[]))lampGlow(lx,12,16,.5+.15*Math.sin(tick/13+lx));
 drawSprite(npc,'idle',tick>>4,FOPT,90,r.cy+5,kind==='smith');ctx.drawImage(r.fg,0,0);
 /* 店内の仲間たち */
 if(G&&G.party){const ids=kind==='bar'?[...G.party,...G.members.filter(i=>!G.party.includes(i))].slice(0,7):G.party.slice(0,2),n=ids.length,by=H-4;ids.forEach((id,i)=>{const sp=kind==='bar'?[22,46,134,158,70,110,90]:[30,152],x=sp[i%sp.length],y=by-(kind==='bar'&&i>3?-2:((i%2)*5));drawSprite(SPDEF[id]?id:'rio','idle',(tick>>4)+i*2,FOPT,x,y,x<90);});}
 if(kind==='bar'&&(tick>>5)%2){ctx.fillStyle='#ffffff';ctx.fillRect(54,r.cy-11,1,1);ctx.fillRect(125,r.cy-12,1,1);}}
drawTown=function(){if(TSC==='home')drawHome();else if(ROOMH[TSC])drawRoom();else{ctx.drawImage(townImg(),0,H-HOME_H);}};
/* ワールドマップのプレビュー（新しいドット絵で） */
drawWM=function(){const x0=WMS.cur;if(!x0||!WMS.bg)return;ctx.drawImage(WMS.bg,0,0);if(x0.vd){ctx.fillStyle='rgba(120,60,200,.24)';ctx.fillRect(0,0,W,H);}
 const bk=x0.bk;if(bk){const key=resolveSpr(bk),d=SPDEF[key],known=x0.clear||(G.zk&&G.zk.e&&G.zk.e[bk]),f=frameOf(key,'idle',tick>>4,''),x=44,y=96,flip=!!d.human,dx=flip?x-(f.W-f.ax):x-f.ax,img=known?f.c:tintFrame(f,'#05060f','sil');
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(x-16,y-1,32,3);if(flip){ctx.save();ctx.translate(dx+f.W,y-f.ay);ctx.scale(-1,1);ctx.drawImage(img,0,0);ctx.restore();}else ctx.drawImage(img,dx,y-f.ay);}
 [[112,62],[146,70],[124,86],[158,94]].slice(0,G.party.length).map((p,i)=>[p,G.party[i]]).sort((a,b)=>a[0][1]-b[0][1]).forEach(([[x,y],id],i)=>drawSprite(SPDEF[id]?id:'rio','idle',(tick>>4)+i,heroOpt(id),x,y,false));
 const g=ctx.createLinearGradient(0,96,0,H);g.addColorStop(0,'rgba(5,6,15,0)');g.addColorStop(1,'rgba(5,6,15,.9)');ctx.fillStyle=g;ctx.fillRect(0,96,W,H-96);};
{const _wm=worldMap;worldMap=function(m){TSC='other';if(H!==128)setH(128);_wm(m);};}

/* ---------- ホーム画面 ---------- */
const HSPOT=[['bar','酒場',4,86,50,38,'tavern'],['smith','鍛冶屋',128,88,48,36,'smith'],['shop','道具屋',0,132,46,34,'shop'],['eye','鑑定屋',136,132,44,34,'appraise'],['star','星詠みの塔',144,18,34,60,'star'],['door','空中庭園',14,36,48,30,'dev']];
function goFac(k){({tavern:()=>tavern(),smith:()=>smith(),shop:()=>shop(),appraise:()=>appraise(),star:()=>openBoard(G.party[0]),dev:()=>devMenu(),party:()=>partyScreen(),rec:()=>saveMenu(),go:()=>worldMap()})[k]();}
townMenu=function(m){WMS.on=false;TSC='home';if(scene!=='town')show('town');const hh=homeH();if(H!==hh)setH(hh);devBtn(!!G.dev);hud('');$('#stage').style.display='';
 const un=G.inv.filter(i=>i.unid).length,pts=G.members.some(i=>ptsLeft(i)>0),bn=typeof bondReadyN==='function'?bondReadyN():0,qn=QS.filter(q=>!G.q.done[q.id]&&q.ok()).length,gd=G.fac.garden&&G.garden.n,off=H-HOME_H;
 log((m||'大灯（おおあかり）に守られた最後の街。準備を整えよう。')+(!G.dev&&G.sorties-(G.lastExp??0)>=8?'<br><small style="color:#ffb030">⚠ しばらく記録の控えを取っていません。「記録・設定→書き出す」で控えを</small>':''));
 if(G.flags.boss8)$('#msg').insertAdjacentHTML('beforeend',voidNews());
 const bad={tavern:bn+qn,appraise:un,dev:gd?1:0,star:pts?1:0};
 $('#labels').innerHTML=`<div class="htop"><span class="ch">灯都ルミナス<b>${chapter()}</b></span><span class="g"><img src="${ICON.coin}">${fmt(G.gold)}</span><span class="t"><img src="${ICON.tou}">${fmt(G.tou||0)}</span></div>`+
  HSPOT.filter(s=>s[6]!=='dev'||G.fac.garden).map(([ic,nm,x,y,w,h2,go])=>`<button class="hsp" data-go="${go}" style="left:${x*SC}px;top:${(y+off)*SC}px;width:${w*SC}px;height:${h2*SC}px"><span>${nm}${bad[go]?`<i>${bad[go]>1?bad[go]:'!'}</i>`:''}</span></button>`).join('');
 const tile=(go,ic,l,s,b)=>`<button class="hn${b?' on':''}" data-go="${go}"><img src="${ICON[ic]}"><b>${l}</b><small>${s}</small>${b?`<i>${b===true?'!':b}</i>`:''}</button>`;
 const c=$('#cmd');c.className='home';c.innerHTML=`<button class="hgo" data-go="go"><img src="${ICON.go}"><span><b>出 撃</b><small>ワールドマップへ　出撃${G.sorties}回</small></span><em>戦闘力<b>${fmt(G.party.reduce((s,id)=>s+power(id),0))}</b></em><div class="hgf">${G.party.map(id=>`<img src="${face(id)}">`).join('')}</div></button>
  <div class="hgrid">${tile('party','eq','編成','装備・星盤',pts)}${tile('tavern','bar','酒場','依頼・絆・図鑑',bn+qn||0)}${tile('smith','smith','鍛冶屋','強化・売買',0)}${tile('shop','shop','道具屋','回復薬・素材',0)}
  ${tile('appraise','eye','鑑定屋',un?`未鑑定 ${un}`:'未鑑定品を鑑定',un||0)}${tile('star','star','星詠みの塔','星盤・ジョブ・試練',pts)}${tile('dev','door','街の発展',`施設を育てる`,gd?true:0)}${tile('rec','rec','記録・設定','セーブ・書き出し',0)}</div>`;
 tip('town');};
document.addEventListener('click',e=>{const t=e.target.closest('[data-go]');if(!t||scene!=='town'||TSC!=='home'||t.disabled)return;if(!t.closest('#cmd.home')&&!t.closest('#labels'))return;SFX.sel();goFac(t.dataset.go);});
{const _sh=show;show=function(m){_sh(m);if(m!=='town')TSC='other';};}
{const _pn=panel;panel=function(html,acts){if(scene==='town'&&TSC==='home')TSC='other';_pn(html,acts);if(scene==='town'){if(RSHOW&&ROOMH[TSC]){$('#stage').style.display='';RSHOW=0;}else if(!ROOMH[TSC])$('#labels').innerHTML='';}};}
{const _mn=menu;menu=function(items,list,xc){if(scene==='town'){if(TSC==='home')TSC='other';$('#labels').innerHTML='';}_mn(items,list,xc);};}
/* 店内を表示する共通処理 */
function roomOpen(kind,ttl,sub){TSC=kind;if(scene!=='town')show('town'),TSC=kind;const h=innerHeight<600?Math.min(84,ROOMH[kind]):ROOMH[kind];if(H!==h)setH(h);$('#stage').style.display='';RSHOW=1;hud('');devBtn(false);
 $('#labels').innerHTML=`<div class="rttl"><b>${ttl}</b><small>${sub||''}</small></div><div class="htop r"><span class="g"><img src="${ICON.coin}">${fmt(G.gold)}</span><span class="t"><img src="${ICON.tou}">${fmt(G.tou||0)}</span></div>`;}
const backBtn=(l='◀ 灯都へ戻る')=>`<button class="tbtn back wide" data-a="back">${l}</button>`;

/* ---------- 酒場「星降り亭」 ---------- */
tavern=function(m){roomOpen('bar','酒場「星降り亭」',`酒場Lv${G.fac.bar}　戦闘の経験値+${(G.fac.bar-1)*5}%`);const dec=G.declined||[],bn=typeof bondReadyN==='function'?bondReadyN():0,qr=QS.filter(q=>!G.q.done[q.id]&&q.ok()).length,qo=QS.filter(q=>!G.q.done[q.id]).length;
 log(m||'<b>主人</b>「おかえり、灯守さん。仲間はみんな揃ってるよ。今日はどうする？」');
 const mem=id=>{const s=stats(id),h=G.h[id],hp=h.hp??s.mhp,on=G.party.includes(id);return`<div class="tvm${on?' on':''}" data-a="sheet" data-v="${id}"><img src="${face(id)}"><b>${HB[id].name}</b><small>Lv${h.lv}</small><div class="hb"><i style="width:${Math.max(0,hp/s.mhp*100)}%"></i></div><em>${on?'前衛'+(G.party.indexOf(id)+1):'控え'}</em></div>`;};
 const tl=(a,ic,l,s,b)=>`<button class="ftile${b?' on':''}" data-a="${a}"><img src="${ICON[ic]}"><span><b>${l}</b><small>${s}</small></span>${b?`<i>${b}</i>`:''}</button>`;
 panel(`<div class="ttl2">仲間（${G.members.length}人）<small>タップで詳細</small></div><div class="tvms">${[...G.party,...G.members.filter(i=>!G.party.includes(i))].map(mem).join('')}</div>
  <div class="ftiles">${tl('form','eq','編成','前衛4人・装備・星盤',0)}${tl('board','quest','依頼掲示板',qo?`受注中 ${qo}件`:'すべて報告済み',qr?'報告'+qr:0)}${tl('bond','bond','絆の語らい',bn?`新しい話が${bn}件ある`:'仲間と語り合う',bn?'♥'+bn:0)}${tl('zk','book','図鑑','敵・装備・仲間の記録',0)}</div>
  ${dec.length?`<div class="ttl2">声をかけられる仲間</div>`+dec.map(id=>`<div class="icard r2"><img class="iic" src="${face(id)}"><div class="ibody"><div class="inm">${HB[id].name}</div><div class="isub">${typeof PROF!=='undefined'&&PROF[id]?PROF[id][1]:'酒場で待っている'}</div></div><div class="iright"><button class="tbtn gold" style="width:76px;height:40px" data-a="join" data-v="${id}">誘う</button></div></div>`).join(''):''}${backBtn()}`,
  {form:()=>partyScreen(),board:()=>board(),bond:()=>bondMenu(),zk:()=>zkMenu(),sheet:id=>openSheet(id),join:id=>{G.declined=dec.filter(x=>x!==id);newMember(id);SFX.aw();save();tavern(`<b>${HB[id].name}が仲間になった！</b>`);},back:()=>townMenu()});};
/* 依頼掲示板 */
board=function(m){roomOpen('bar','依頼掲示板','達成した依頼は報告で報酬を受け取れる');log(m||'<b>依頼掲示板</b>　貼り紙が並んでいる。達成したものは<b>報告</b>しよう');
 const row=q=>{const done=!!G.q.done[q.id],ok=!done&&q.ok(),pg=String(q.pg()),mt=/^(\d+)\/(\d+)$/.exec(pg),pc=done||ok?100:mt?Math.min(100,+mt[1]/+mt[2]*100):0;
  return`<div class="qcard${done?' done':ok?' ok':''}"><div class="qh"><b>${q.n}</b><span>${done?'報告済み ✓':ok?'達成！':pg}</span></div><div class="qd">${q.d}</div><div class="qb"><i style="width:${pc}%"></i></div><div class="qr"><em>報酬</em>${q.rw}${ok?`<button class="tbtn gold" data-a="rep" data-v="${q.id}">報告する</button>`:''}</div></div>`;};
 const ls=[...QS].sort((a,b)=>(G.q.done[a.id]?2:a.ok()?0:1)-(G.q.done[b.id]?2:b.ok()?0:1));
 panel(`<div class="ttl2">依頼（${QS.filter(q=>G.q.done[q.id]).length}/${QS.length} 報告済み）</div>${ls.map(row).join('')}${backBtn('◀ 酒場へ戻る')}`,{rep:id=>{const q=QS.find(x=>x.id===id);if(!q||G.q.done[id]||!q.ok())return;q.give();G.q.done[id]=1;SFX.aw();save();board(`「${q.n}」を報告した！　報酬：<b>${q.rw}</b>`);if(G.members&&typeof renderPartyStatic==='function'){}},back:()=>tavern()});};
/* ---------- 道具屋 ---------- */
let SHT='buy';const SHQ={};
shop=function(m,tab){if(tab)SHT=tab;roomOpen('shop','道具屋',`道具屋Lv${G.fac.shop}　持ち込みは各9個まで`);log(m||'<b>店番</b>「いらっしゃい！ 出撃の前に、回復薬の数は確かめた？」');
 const its=Object.keys(ITEMS).filter(k=>(ITEMS[k].lv||1)<=G.fac.shop),sell=Object.keys(MATS).reduce((a,k)=>a+(G.mats[k]||0)*MATS[k].p,0);
 const buyRow=k=>{const it=ITEMS[k],have=G.items[k]||0,max=Math.max(0,Math.min(9-have,Math.floor(G.gold/it.p))),q=Math.max(1,Math.min(max||1,SHQ[k]||1)),ok=max>0;SHQ[k]=q;
  return`<div class="scard${ok?'':' off2'}"><img class="sic" src="${ICON[k]||ICON.potion}"><div class="sb"><b>${it.n}</b><small>${it.d}</small><div class="sm"><span class="hv${have>=9?' mx':''}">所持 ${have}/9</span><span class="pr"><img src="${ICON.coin}">${fmt(it.p)}</span></div></div>
   <div class="sq"><div class="stp"><button data-a="dec" data-v="${k}" ${q<=1?'disabled':''}>−</button><b>${q}</b><button data-a="inc" data-v="${k}" ${q>=max?'disabled':''}>＋</button></div><button class="tbtn gold sbuy" data-a="buy" data-v="${k}" ${ok?'':'disabled'}>${have>=9?'満杯':ok?`購入<small>${fmt(it.p*q)}G</small>`:'お金不足'}</button></div></div>`;};
 const sellRow=k=>{const n=G.mats[k]||0;return`<div class="scard${n?'':' off2'}"><img class="sic" src="${ICON[k]||ICON.haiseki}"><div class="sb"><b>${MATS[k].n}</b><small>鍛冶屋の強化や街の発展に使う素材</small><div class="sm"><span class="hv">所持 ${n}</span><span class="pr"><img src="${ICON.coin}">${MATS[k].p}／個</span></div></div>
   <div class="sq"><button class="tbtn sbuy" data-a="s1" data-v="${k}" ${n?'':'disabled'}>1個売る<small>+${MATS[k].p}G</small></button><button class="tbtn sbuy" data-a="sa" data-v="${k}" ${n?'':'disabled'}>全部売る<small>+${fmt(n*MATS[k].p)}G</small></button></div></div>`;};
 panel(`<div class="stabs"><button class="${SHT==='buy'?'on':''}" data-a="tab" data-v="buy">買う</button><button class="${SHT==='sell'?'on':''}" data-a="tab" data-v="sell">売る</button></div>
  ${SHT==='buy'?its.map(buyRow).join('')+(its.length<Object.keys(ITEMS).length?`<div class="snote">道具屋を発展させると品揃えが増える（街の発展）</div>`:''):Object.keys(MATS).map(sellRow).join('')+`<button class="tbtn wide${sell?' gold':''}" data-a="sall" ${sell?'':'disabled'}>素材をすべて売る<small>${sell?`合計 ${fmt(sell)}G`:'売れる素材がない'}</small></button><div class="snote">素材は鍛冶屋の強化・街の発展にも使う。売りすぎに注意</div>`}${backBtn()}`,
  {tab:t=>shop(null,t),dec:k=>{SHQ[k]=Math.max(1,(SHQ[k]||1)-1);shop(' ');},inc:k=>{SHQ[k]=(SHQ[k]||1)+1;shop(' ');},
   buy:k=>{const it=ITEMS[k],have=G.items[k]||0,q=Math.min(SHQ[k]||1,9-have,Math.floor(G.gold/it.p));if(q<=0)return;G.gold-=it.p*q;addItem(k,q);SHQ[k]=1;SFX.heal();save();shop(`<b>${it.n}</b>を${q}個買った（所持 ${G.items[k]}/9）`);},
   s1:k=>{if(!(G.mats[k]>0))return;G.mats[k]--;G.gold+=MATS[k].p;SFX.sel();save();shop(`${MATS[k].n}を1個売った（+${MATS[k].p}G）`);},
   sa:k=>{const n=G.mats[k]||0;if(!n)return;G.mats[k]=0;G.gold+=n*MATS[k].p;SFX.heal();save();shop(`${MATS[k].n}を${n}個売って<b>${fmt(n*MATS[k].p)}G</b>を得た`);},
   sall:()=>{if(!sell)return;G.gold+=sell;for(const k in MATS)G.mats[k]=0;SFX.heal();save();shop(`素材をすべて売って<b>${fmt(sell)}G</b>を得た`);},back:()=>townMenu()});
 if(m===' ')log('<b>店番</b>「個数を選んで、購入を押してね」');};
/* 鍛冶屋・鑑定屋：店内を見せる */
{const _sm=smith;smith=function(m){_sm(m);roomOpen('smith','鍛冶屋',`鍛冶屋Lv${G.fac.smith}　強化上限+${ecap()}`);RSHOW=0;};}
{const _ap=appraise;appraise=function(m){_ap(m);roomOpen('eye','鑑定屋',`鑑定屋Lv${G.fac.eye}`);RSHOW=0;};}
{const _et=enterTown;enterTown=function(m){TSC='home';_et(m);};}
addEventListener('resize',()=>{if(scene==='town'&&TSC==='home'&&G&&homeH()!==H)townMenu();});
/* タイトル */
{const _t=title;title=function(){TSC='other';_t();const v=$('#verL');if(v)v.textContent=VER18;};}
{const v=$('#verL');if(v)v.textContent=VER18;}
