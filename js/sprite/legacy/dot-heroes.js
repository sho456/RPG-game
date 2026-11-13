/* ===== ver0.19 味方キャラクターのドット絵定義 =====
 12人それぞれに、体格・髪型・衣装・武器・構えを個別に定義する。
 配色は既存パレット（PAL の1文字キー）から引くので、星臨配色や色替えはそのまま反映される */
{const{face,cap,blade,staff,dir,arm,leg,torso,chain,robe}=HUM;
const SKIN=P=>({s:[P.s,PX.mix(PX.tint(P.s,.7),'#8a4a4a',.3)],e:P.e||'#1a1420',mouth:PX.tint(P.s,.5,1.3,-10),blush:PX.mix(P.s,'#e06a6a',.45)});
const grad=(hx,hy,a=.07,b=.09,c=.3)=>(x,y)=>c-(x-hx)*a-(y-hy)*b;
const GL=c=>{const a=[PX.tint(c,.5),PX.tint(c,.7),PX.tint(c,.85),c,PX.mix(c,'#ffffff',.5),'#ffffff'];a.glow=1;return a;};

/* ---------- リオ：灯守見習いの剣士。跳ねたオレンジの髪、青い上着、白い襟巻き ---------- */
defHum('rio',{
 matsOf:P=>Object.assign(SKIN(P),{hair:[P.h,P.H],coat:[P.c,P.C],w:[P.w,PX.tint(P.w,.72,1.6,-20)],pants:PX.tint(P.C,.78),b:P.b,m:[P.m,P.M],y:P.y}),
 legM:'pants',bootH:.55,armM:'coat',handM:'b',wp:'sword',
 pose:{fF:[-4,0],fN:[3.5,0],hF:[-4.5,4],hN:[2,6.5],wa:1.15,cr:.5,ln:.5},
 back(g,J,p){const[cx,cy]=J.ch,s=p.sw;/* 襟巻きの尾 */
  g.poly([[cx+2,cy-.5],[cx+7+s,cy+1.5+p.q],[cx+10.5+s*1.6,cy+4.5+p.q],[cx+8.5+s*1.4,cy+6],[cx+5+s*.6,cy+3.5],[cx+2,cy+2]],'w',{f:(x,y)=>.35-(x-cx)*.05});},
 itemF(g,J,p){blade(g,J.hF[0],J.hF[1],p.wa,13,{w:1.05});},
 torso(g,J,p,c){torso(g,c,J);const[cx,cy]=J.ch,[hx,hy]=J.hip;
  g.limb(cx-2.4,cy+2.5,hx-2.3,hy-1.5,1.2,1.1,'w',{bias:.15});/* 白いシャツの前身頃 */
  g.rect(hx-4.5,hy-1.6,8.5,1.2,'b',2);g.px(hx-3,hy-1.6,'y',4);/* ベルトと星片のバックル */
  g.poly([[hx+1.5,hy-.5],[hx+5.5+p.sw*.5,hy+3.5],[hx+3.5+p.sw*.4,hy+4.5],[hx+.5,hy+1.5]],'coat',{lv:2});/* 上着の裾 */
  g.limb(cx-3.5,cy+1,cx+3.2,cy+.6,1.5,1.5,'w',{bias:.2});},/* 襟巻き */
 head(g,J,p,c){const[hx,hy]=J.hd,s=p.sw,f=grad(hx,hy);
  g.poly([[hx+3,hy-5],[hx+9.5+s,hy-6.5],[hx+5.5,hy-1.5]],'hair',{f});g.poly([[hx+4,hy-2.5],[hx+10+s,hy-.5],[hx+5,hy+2]],'hair',{f});g.poly([[hx+3.5,hy+.5],[hx+8+s*.6,hy+4.5],[hx+3,hy+4.2]],'hair',{f});
  g.part();face(g,c,hx,hy,p);cap(g,hx,hy,'hair',{rx:6.5,ry:6.1});
  g.part();g.poly([[hx-3,hy-5],[hx-2.5+s*.5,hy-10],[hx+1.5,hy-5.5]],'hair',{f});g.poly([[hx+.5,hy-5.5],[hx+4.5+s*.7,hy-9.5],[hx+5,hy-4]],'hair',{f});
  g.part();g.poly([[hx-6,hy-3.5],[hx-6.5,hy+.2],[hx-3.8,hy-3]],'hair',{f});g.poly([[hx-4.2,hy-4],[hx-3.4,hy-.2],[hx-1,hy-3.5]],'hair',{f});g.poly([[hx-1.5,hy-4],[hx+.2,hy-.2],[hx+2,hy-3.5]],'hair',{f});}
});

/* ---------- ガルド：元騎士団長。全身鎧に赤い羽根飾りと外套、大盾と大剣。肩幅が広く重心が低い ---------- */
defHum('gald',{
 B:{leg:12,tor:11.5,hr:5.7,sh:3.5,hip:2.1,arm:10.5,legR:2.4,armR:2,torR:4.9},
 matsOf:P=>Object.assign(SKIN(P),{armor:[P.a,P.A],cape:[P.r,P.R],y:[P.y,PX.tint(P.y,.6,1.1,-12)],beard:P.d,m:[P.m,P.M],b:PX.tint(P.A,.7)}),
 legM:'armor',bootM:'armor',armM:'armor',handM:'armor',torM:'armor',wp:'great',
 pose:{fF:[-4.5,0],fN:[4.5,0],hF:[-4.5,4.5],hN:[3.5,5.5],wa:-2.42,cr:1,ln:.5},wh:'N',
 back(g,J,p){const[cx,cy]=J.ch,s=p.sw,y1=p.y-3;/* 外套 */
  g.poly([[cx-1,cy+1],[cx+5.5,cy+1],[cx+9+s,y1-5],[cx+10.5+s*1.5,y1],[cx+3+s,y1+.5],[cx+.5,cy+8]],'cape',{f:(x,y)=>.3-(x-cx)*.07+((Math.round(x-cx-s*(y-cy)/20)%3)?0:-.35)});},
 itemN(g,J,p){blade(g,J.hN[0],J.hN[1],p.wa,18,{w:1.7,guard:3.4,grip:4.5});},
 torso(g,J,p,c){torso(g,c,J);const[cx,cy]=J.ch,[hx,hy]=J.hip;
  g.ell(cx-.8,cy+4.3,4.6,3.6,'armor',{spec:1,bias:.12});/* 胸甲 */
  g.rect(hx-5,hy-2,10,1.2,'y',3);g.poly([[hx-4.5,hy-.8],[hx+4.5,hy-.8],[hx+5.5,hy+3.5],[hx-5.5,hy+3.5]],'armor',{f:(x,y)=>.3-(x-hx)*.09});/* 腰当て */
  g.ell(J.sF[0]-.6,J.sF[1]-.8,2.7,2.4,'armor',{spec:1,bias:.2});},
 head(g,J,p,c){const[hx,hy]=J.hd,s=p.sw;
  g.poly([[hx-1,hy-6],[hx+2.5,hy-11],[hx+8+s*1.6,hy-10.5],[hx+10.5+s*2,hy-6+p.q],[hx+7+s,hy-6],[hx+4,hy-5]],'cape',{f:grad(hx,hy-6,.06,.12,.45)});/* 羽根飾り */
  g.part();face(g,c,hx,hy,p,{eyeY:0});
  for(let i=0;i<5;i++){g.px(hx-5+i,hy+4,'beard',i%2?3:2);if(i<4)g.px(hx-4.5+i,hy+5,'beard',2);}g.px(hx-5.5,hy+3,'beard',3);g.px(hx,hy+3.2,'beard',2);/* あごひげ */
  cap(g,hx,hy,'armor',{rx:6.5,ry:6.3,fx:-3,fy:2.6,frx:4.3,fry:3.9,spec:1,bias:.1});
  g.rect(hx-5.5,hy-2.4,9,1,'y',4);g.rect(hx-3.2,hy-2,1,3,'armor',2);/* 額金と鼻当て */
  g.ell(hx+3.5,hy+2.5,1.6,2.6,'armor',{bias:-.1});},
 armN(g,J,p,c){arm(g,c,J.sN,J.eN,J.hN);g.ell(J.sN[0]+.3,J.sN[1]-.8,3,2.6,'armor',{spec:1,bias:.2});},
 itemFront:1,
 itemF(g,J,p){const[x,y]=J.hF,sx=x-1,sy=y-1.5;/* 大盾（凧型） */
  g.poly([[sx-5,sy-7],[sx+4.5,sy-7.5],[sx+5.5,sy+1],[sx+.5,sy+9],[sx-5.5,sy+1.5]],'y',{f:(px,py)=>.5-(px-sx)*.1-(py-sy)*.05,spec:1});
  g.poly([[sx-3.2,sy-5.2],[sx+2.8,sy-5.6],[sx+3.5,sy+.5],[sx+.3,sy+6],[sx-3.6,sy+.8]],'armor',{f:(px,py)=>.45-(px-sx)*.12-(py-sy)*.06,spec:1});
  g.rect(sx-.5,sy-4.5,1,8,'cape',3);g.rect(sx-2.8,sy-2,5.8,1,'cape',3);}
});

/* ---------- ミレイユ：図書遺跡の司書。長い紫の髪、紅のローブ、開いた魔導書 ---------- */
defHum('mire',{
 B:{leg:12,tor:9.5,hr:5.9,sh:2.2,hip:1.3,arm:9,legR:1.5,armR:1.25,torR:3.3},
 matsOf:P=>Object.assign(SKIN(P),{hair:[P.P,P.Q],dress:[P.n,P.N],w:[PAL.w,'#b9a6c8'],book:[P.y,PX.tint(P.y,.55,1.1,-14)],page:['#fff8e0','#c9b98a'],gem:P.u,b:P.b,mote:GL(P.u)}),
 legM:'dress',bootM:'b',armM:'dress',handM:'s',torM:'dress',wp:'book',
 pose:{fF:[-2.5,0],fN:[2,0],hF:[-4.5,3.5],hN:[-3.5,2.5],wa:.2,ln:0},
 back(g,J,p){const[hx,hy]=J.hd,s=p.sw;/* 背中へ流れる長い髪 */
  g.poly([[hx+1,hy-4],[hx+6.5,hy-2],[hx+8+s*.6,hy+6],[hx+9+s*1.5,hy+14+p.q],[hx+6+s*1.4,hy+17],[hx+3.5+s*.8,hy+13],[hx+1.5,hy+6]],'hair',{f:(x,y)=>.35-(x-hx)*.09+((Math.round(x-hx-s*(y-hy)/16)%3)?0:-.3)});},
 torso(g,J,p,c){torso(g,c,J);const[cx,cy]=J.ch;g.limb(cx-3,cy+1.2,cx+2.6,cy+1,1.3,1.3,'w',{bias:.2});g.px(cx-2.5,cy+2.6,'book',4);},
 skirt(g,J,p){robe(g,J,p,'dress',{top:3.2,hem:5.8,clear:2.2,trim:1,trimD:-1});},
 head(g,J,p,c){const[hx,hy]=J.hd,s=p.sw;face(g,c,hx,hy,p,{blush:1,lash:1});cap(g,hx,hy,'hair',{rx:6.5,ry:6.2,fx:-2.8,fy:2.6,frx:4.4,fry:4.4});
  g.part();g.poly([[hx-6,hy-3],[hx-6.3,hy+.2],[hx-3.5,hy-3.5]],'hair',{f:grad(hx,hy)});g.poly([[hx-4,hy-4.2],[hx-.5,hy-.2],[hx+2.5,hy-3.5]],'hair',{f:grad(hx,hy)});
  g.limb(hx+2.2,hy-1,hx+1.6+s*.3,hy+6.5,1.3,.8,'hair');/* 顔の横の房 */
  g.px(hx+3,hy-4,'book',4);g.px(hx+4,hy-3.2,'book',4);},
 itemF(g,J,p){const[x,y]=J.hF,o=p.q2;/* 開いた魔導書（表紙＋頁） */
  g.poly([[x-5,y-2.2-o],[x,y-.2],[x+4.6,y-2.8-o],[x+4.6,y-.6-o],[x,y+2],[x-5,y-o]],'book',{lv:3});
  g.poly([[x-4.4,y-3.2-o],[x-.2,y-1.4],[x-.2,y+.6],[x-4.4,y-1.2-o]],'page',{lv:4});g.poly([[x+.3,y-1.4],[x+4,y-3.8-o],[x+4,y-1.8-o],[x+.3,y+.6]],'page',{lv:3});
  g.px(x-3,y-2-o,'page',2);g.px(x-2,y-1.4-o*.5,'page',2);g.px(x+2,y-2.2-o,'page',2);},
 itemFront:1,
 front(g,J,p){if(p.fx){const[x,y]=J.hF;for(let i=0;i<3;i++){const a=p.fx*.9+i*2.1;g.px(x-1+Math.cos(a)*5,y-6-i*2+Math.sin(a)*1.5,'mote',i?4:5);}}}
});

/* ---------- シオン：街の盗賊。小柄で低い構え、緑のバンダナ、逆手の双剣 ---------- */
defHum('shion',{
 B:{leg:10.5,tor:8.8,hr:6,sh:2.4,hip:1.6,arm:9,legR:1.7,armR:1.3,torR:3.5},
 matsOf:P=>Object.assign(SKIN(P),{hair:[P.g,P.G],band:[P.j,P.J],tunic:[P.j,P.J],b:P.b,m:[P.m,P.M],y:PAL.y,pants:PX.tint(P.J,.7)}),
 legM:'pants',bootH:.5,armM:'tunic',armLo:'s',handM:'b',torM:'tunic',wp:'dual',
 pose:{fF:[-5,0],fN:[4.5,0],hF:[-5,3],hN:[3.5,3.5],wa:-.5,wb:2.6,cr:2.2,ln:2},
 back(g,J,p){const[hx,hy]=J.hd,s=p.sw;/* バンダナの尾 */
  chain(g,hx+5.5,hy-2,.25+s*.12,3,3,1.1,.6,'band',.22+s*.1);chain(g,hx+5.5,hy-1,.75+s*.14,3,2.6,1,.5,'band',.15+s*.08);},
 itemF(g,J,p){blade(g,J.hF[0],J.hF[1],p.wa,7,{w:.9,guard:1.6,grip:2});},
 torso(g,J,p,c){torso(g,c,J);const[cx,cy]=J.ch,[hx,hy]=J.hip;g.rect(hx-4,hy-2,8,1.3,'b',3);g.px(hx-3.5,hy-2,'y',4);
  g.limb(cx-2.8,cy+1,cx+2.8,cy+.8,1.4,1.4,'band',{bias:-.15});/* 口元まで上げられる襟布 */
  g.limb(cx-3,cy+3,hx+3,hy-2.5,.6,.6,'b',{lv:2});},
 head(g,J,p,c){const[hx,hy]=J.hd,s=p.sw,f=grad(hx,hy);
  g.poly([[hx+3,hy-4],[hx+8.5+s*.5,hy-4.5],[hx+5,hy]],'hair',{f});g.poly([[hx+3.5,hy],[hx+8+s*.5,hy+3.5],[hx+3,hy+4]],'hair',{f});
  g.part();face(g,c,hx,hy,p);cap(g,hx,hy,'hair',{rx:6.4,ry:6});
  g.part();g.poly([[hx-6,hy-2.5],[hx-6.8,hy+1.5],[hx-4,hy-1.5]],'hair',{f});g.poly([[hx-4.5,hy-2.5],[hx-3.2,hy+.3],[hx-1.5,hy-2.2]],'hair',{f});g.poly([[hx-.5,hy-2.5],[hx+1.5,hy+1],[hx+3,hy-2.2]],'hair',{f});
  g.poly([[hx-4,hy-5.4],[hx-4.5+s*.3,hy-8],[hx-1.5,hy-6.2]],'hair',{f});g.poly([[hx-1.5,hy-6.2],[hx+.5+s*.4,hy-8.6],[hx+2,hy-6]],'hair',{f});g.poly([[hx+1.5,hy-6],[hx+5+s*.5,hy-8],[hx+5,hy-4.5]],'hair',{f});
  g.part();g.limb(hx-5.5,hy-3,hx+5.8,hy-3.6,1.25,1.25,'band',{bias:.1});},
 itemN(g,J,p){blade(g,J.hN[0],J.hN[1],p.wb,7,{w:.9,guard:1.6,grip:2});}
});

/* ---------- ノア：人形の神官。白い髪と金の輪、裾の長い白衣、環のついた杖。姿勢は直立 ---------- */
defHum('noah',{
 B:{leg:10.5,tor:9.5,hr:6,sh:2.2,hip:1.3,arm:8.6,legR:1.5,armR:1.3,torR:3.3},
 matsOf:P=>Object.assign(SKIN(P),{hair:[P.k,PX.mix(P.k,P.q,.6)],robe:[P.w,PX.mix(P.w,P.q,.62)],y:[P.y,PX.tint(P.y,.58,1.15,-14)],b:P.q,halo:GL(P.y),wood:[P.y,PX.tint(P.y,.58,1.15,-14)]}),
 legM:'robe',bootM:'b',armM:'robe',handM:'s',torM:'robe',wp:'staff',
 pose:{fF:[-1.8,0],fN:[1.8,0],hF:[-4,5],hN:[.5,6.5],wa:1.5,ln:0},
 /* 派生：沈みし女王（背に流れる長い髪と冠） */
 back(g,J,p,c){if(c.extra!=='queen')return;const[hx,hy]=J.hd,s=p.sw;g.poly([[hx+1,hy-3],[hx+7,hy-1],[hx+9+s*.7,hy+8],[hx+11+s*1.6,hy+17],[hx+7+s*1.4,hy+20],[hx+4+s*.8,hy+13],[hx+1.5,hy+6]],'hair',{f:(x,y)=>.35-(x-hx)*.08+((Math.round(x-hx-s*(y-hy)/16)%3)?0:-.3)});},
 itemF(g,J,p){const[x,y]=J.hF,[tx,ty]=staff(g,x,y,p.wa,13,9,'wood'),[dx,dy]=dir(p.wa);/* 環のついた祭杖 */
  const cx=tx+dx*4,cy=ty+dy*4;g.ell(cx,cy,4.2,4.2,'y',{spec:1,bias:.15,clip:(px,py)=>(px-cx)**2+(py-cy)**2>6.2});g.px(cx-.5,cy-.5,'halo',p.fx?5:4);g.px(cx-.5,cy-5.5,'halo',5);},
 torso(g,J,p,c){torso(g,c,J);const[cx,cy]=J.ch,[hx,hy]=J.hip;g.limb(cx-3,cy+1.4,cx+2.6,cy+1.2,1.3,1.3,'y',{bias:.1});g.rect(cx-1.4,cy+2.6,1,hy-cy-2,'y',3);},
 skirt(g,J,p){robe(g,J,p,'robe',{top:3.3,hem:5.6,clear:.6,sway:.6,trim:1,trimD:-1});const[hx,hy]=J.hip;for(let y=hy;y<p.y-2;y+=1)g.px(hx-1.4+p.sw*.6*(y-hy)/10,y,'y',y%2?3:4);},
 head(g,J,p,c){const[hx,hy]=J.hd,s=p.sw;
  g.ell(hx+1.5,hy+2.5,5.6,5.2,'hair',{bias:-.1});g.poly([[hx+2,hy+5],[hx+7+s*.4,hy+7.5],[hx+2,hy+8]],'hair',{lv:2});
  g.part();face(g,c,hx,hy,p,{iris:0});cap(g,hx,hy,'hair',{rx:6.5,ry:6.2,fx:-2.9,fy:2.8,frx:4.2,fry:4});
  g.part();g.poly([[hx-6.2,hy-2.5],[hx-6.2,hy+1],[hx-5,hy+1],[hx-4.8,hy-2.5]],'hair',{lv:3});g.rect(hx-4.6,hy-3,6,2.6,'hair',3);g.tone(hx-3,hy-1,-1);g.tone(hx-1,hy-1,-1);/* 切りそろえた前髪 */
  g.part();g.limb(hx-5.6,hy-4,hx+5.6,hy-4.6,.7,.7,'y',{lv:4});g.px(hx-3,hy-4.8,'halo',5);
  if(c.extra==='queen')for(const[dx,h]of[[-4.5,3.5],[-1.5,5.5],[1.5,4.5],[4.5,3]])g.poly([[hx+dx-1.4,hy-4.6],[hx+dx,hy-5-h],[hx+dx+1.4,hy-4.8]],'y',{lv:dx<0?4:3});},
 front(g,J,p){const[hx,hy]=J.hd,a=p.q2||0;/* 頭上の光輪（機巧の印） */
  for(let i=0;i<10;i++){const t=i/10*6.283+a;g.px(hx+.5+Math.cos(t)*5,hy-9.5+Math.sin(t)*1.4,'halo',Math.sin(t)>0?5:4);}}
});

/* ---------- エルナ：流れの狙撃手。長身で細身、金の長いポニーテール、大弓と矢筒 ---------- */
defHum('erna',{
 B:{leg:13.5,tor:10.2,hr:5.6,sh:2.3,hip:1.4,arm:10,legR:1.55,armR:1.25,torR:3.3},
 matsOf:P=>Object.assign(SKIN(P),{hair:[P.y,PX.tint(P.y,.6,1.15,-16)],coat:[P.c,P.C],w:[P.w,PX.tint(P.w,.72,1.4,-20)],b:P.b,bow:[P.M,PX.tint(P.M,.55)],str:GL('#e8f0ff'),pants:PX.tint(P.b,1.15),m:[PAL.m,PAL.M],fea:P.c}),
 legM:'pants',bootH:.62,armM:'coat',handM:'b',torM:'coat',wp:'bow',
 pose:{fF:[-3.5,0],fN:[3,0],hF:[-4,6],hN:[2.5,6.5],wa:1.2,ln:-.3},
 back(g,J,p){const[cx,cy]=J.ch,[hx,hy]=J.hd,s=p.sw;/* 矢筒と長いポニーテール */
  g.limb(cx+2,cy+7,cx+6.5,cy-.5,1.5,1.5,'b');g.px(cx+6.5,cy-2.5,'fea',4);g.px(cx+7.5,cy-2,'fea',3);g.px(cx+5.5,cy-2.6,'w',4);
  chain(g,hx+5.5,hy-3,1.05+s*.1,5,3.2,1.7,.7,'hair',.12+s*.07);},
 itemF(g,J,p){const[x,y]=J.hF,[dx,dy]=dir(p.wa),nx=-dy,ny=dx,d=p.dr||0;/* 大弓。dr=引き絞り量 */
  const t=[x-nx*10+dx*-3.5,y-ny*10+dy*-3.5],b=[x+nx*10+dx*-3.5,y+ny*10+dy*-3.5],m1=[x-nx*5.5+dx*.8,y-ny*5.5+dy*.8],m2=[x+nx*5.5+dx*.8,y+ny*5.5+dy*.8];
  const sx=x-dx*(3.5+d),sy=y-dy*(3.5+d);g.line(t[0],t[1],sx,sy,'str',3);g.line(sx,sy,b[0],b[1],'str',3);
  g.limb(t[0],t[1],m1[0],m1[1],.6,1,'bow');g.limb(m1[0],m1[1],x,y,1,1.2,'bow');g.limb(x,y,m2[0],m2[1],1.2,1,'bow');g.limb(m2[0],m2[1],b[0],b[1],1,.6,'bow');
  if(p.ar){g.line(sx,sy,x+dx*7,y+dy*7,'w',4);g.px(x+dx*8,y+dy*8,'m',5);g.px(sx-dx,sy-dy-1,'fea',4);}},
 itemFront:1,
 torso(g,J,p,c){torso(g,c,J);const[cx,cy]=J.ch,[hx,hy]=J.hip;g.limb(cx-2.3,cy+2.4,hx-2.2,hy-2,1,.9,'w',{bias:.1});g.rect(hx-3.8,hy-2,7.5,1.2,'b',2);g.limb(cx+2.5,cy+1.5,hx-3,hy-2.2,.55,.55,'b',{lv:3});
  g.poly([[hx+1,hy-1],[hx+4.5+p.sw*.5,hy+3.8],[hx+2.5+p.sw*.4,hy+4.5],[hx,hy+1.5]],'coat',{lv:2});},
 head(g,J,p,c){const[hx,hy]=J.hd,s=p.sw,f=grad(hx,hy);face(g,c,hx,hy,p,{lash:1});cap(g,hx,hy,'hair',{rx:6.1,ry:5.8,fx:-2.6,fy:2.4,frx:4.2,fry:4.1});
  g.part();g.poly([[hx-5.6,hy-3.2],[hx-6,hy+.3],[hx-3.2,hy-3.2]],'hair',{f});g.poly([[hx-3.8,hy-4],[hx-1,hy-.3],[hx+2.5,hy-3.6]],'hair',{f});
  g.limb(hx+2,hy-1,hx+1.6,hy+5,1.1,.6,'hair');g.ell(hx+5.3,hy-3.2,1.5,1.5,'coat',{lv:3});}
});

/* ---------- バルザ：ドワーフの鍛冶師。ずんぐりした体、大きなひげ、鉄兜、両刃の大斧 ---------- */
defHum('balza',{
 B:{leg:7,tor:9.5,hr:6.2,sh:3.9,hip:2.4,arm:9.4,legR:2.5,armR:2.2,torR:5.4},H:60,
 matsOf:P=>Object.assign(SKIN(P),{helm:[P.a,P.A],beard:[P.d,PX.tint(P.d,.55,1.1,-10)],tunic:[P.r,P.R],m:[P.m,P.M],b:P.b,wood:[P.b,PX.tint(P.b,.6)],y:PAL.y,apron:PX.tint(P.b,.8),ember:GL('#ffb040')}),
 legM:'apron',bootM:'b',bootH:.5,armM:'tunic',armLo:'s',handM:'b',torM:'tunic',wp:'axe',
 pose:{fF:[-4,0],fN:[4,0],hF:[1.5,3.5],hN:[-2,6.5],wa:2.5,cr:0,ln:.5},
 itemF(g,J,p){const[x,y]=J.hF,[dx,dy]=dir(p.wa),nx=-dy,ny=dx,[tx,ty]=staff(g,x,y,p.wa,11,7,'wood');/* 両刃の大斧 */
  const ax=tx-dx*1.5,ay=ty-dy*1.5,f=(px,py)=>.55-(px-ax)*.08-(py-ay)*.09;
  g.poly([[ax-dx*2,ay-dy*2],[ax+nx*6.5-dx*4.5,ay+ny*6.5-dy*4.5],[ax+nx*8,ay+ny*8],[ax+nx*6.5+dx*4.5,ay+ny*6.5+dy*4.5],[ax+dx*2,ay+dy*2]],'m',{f,spec:1});
  g.poly([[ax-dx*2,ay-dy*2],[ax-nx*6.5-dx*4.5,ay-ny*6.5-dy*4.5],[ax-nx*8,ay-ny*8],[ax-nx*6.5+dx*4.5,ay-ny*6.5+dy*4.5],[ax+dx*2,ay+dy*2]],'m',{f,spec:1});
  g.ell(ax,ay,1.6,1.6,'y',{lv:4});if(p.fx){g.px(ax+nx*7,ay+ny*7-2,'ember',5);g.px(ax-nx*6,ay-ny*6-3,'ember',4);}},
 torso(g,J,p,c){torso(g,c,J);const[cx,cy]=J.ch,[hx,hy]=J.hip;g.poly([[cx-3.5,cy+5],[cx+2,cy+5],[hx+3,hy+2.5],[hx-5,hy+2.5]],'apron',{f:(x,y)=>.3-(x-hx)*.08});g.rect(hx-6,hy-2.2,12,1.3,'b',2);g.px(hx-3,hy-2.2,'y',4);},
 head(g,J,p,c){const[hx,hy]=J.hd,s=p.sw;face(g,c,hx,hy,p);
  /* 胸まで届く大きなひげ */
  g.part();g.poly([[hx-6.5,hy+2],[hx+3.5,hy+2.2],[hx+4,hy+6],[hx+1+s*.5,hy+11+p.br],[hx-3.5+s*.6,hy+12.5+p.br],[hx-7,hy+7]],'beard',{f:(x,y)=>.35-(x-hx)*.07-(y-hy-6)*.06+((Math.round(x-hx)%2)?0:-.28)});
  g.px(hx-4,hy+2.2,'s',4);g.px(hx-3,hy+2.4,'s',3);g.rect(hx-6,hy+2.6,5,1,'beard',4);/* 鼻と口ひげ */
  g.part();cap(g,hx,hy,'helm',{rx:6.9,ry:6.6,fx:-2.6,fy:3.6,frx:5,fry:4.2,spec:1,bias:.1});g.rect(hx-6.4,hy-1.6,11.5,1.1,'y',3);
  g.limb(hx-5,hy-4,hx-8,hy-8,1.3,.4,'beard',{bias:.3});g.limb(hx+4.5,hy-4.5,hx+7.5,hy-8.5,1.3,.4,'beard',{bias:.3});/* 角飾り */}
});

/* ---------- クロウ：呪言使い。痩せた長身、目深なフード、大鎌を肩に担ぐ猫背 ---------- */
defHum('crow',{
 B:{leg:13,tor:10.8,hr:5.6,sh:2.4,hip:1.4,arm:10.4,legR:1.5,armR:1.25,torR:3.4},
 matsOf:P=>Object.assign(SKIN(P),{hood:[P.V,PX.tint(P.V,.55)],robe:[P.v,P.V],shaft:[P.q,PX.tint(P.q,.55)],m:[P.M,PX.tint(P.M,.5)],x:[P.x,PX.tint(P.x,.55)],b:PX.tint(P.V,.7),wisp:GL(P.x)}),
 legM:'b',bootM:'b',armM:'robe',handM:'s',torM:'robe',wp:'scythe',
 pose:{fF:[-3,0],fN:[3,0],hF:[-1,6],hN:[1,4],wa:2.2,ln:1.5,hx:-.5,hy:1},itemFront:1,
 itemF(g,J,p){const[x,y]=J.hF,[dx,dy]=dir(p.wa),nx=dy,ny=-dx,[tx,ty]=staff(g,x,y,p.wa,15,9,'shaft');/* 大鎌：刃は頭上を越えて前へ */
  const f=(px,py)=>.55-(px-tx)*.05-(py-ty)*.1;
  g.poly([[tx,ty],[tx+dx*1.5+nx*4,ty+dy*1.5+ny*4],[tx-dx*1.5+nx*10,ty-dy*1.5+ny*10],[tx-dx*6+nx*14,ty-dy*6+ny*14],[tx-dx*3.2+nx*9.5,ty-dy*3.2+ny*9.5],[tx-dx*2+nx*4,ty-dy*2+ny*4],[tx-dx*2.5,ty-dy*2.5]],'m',{f,spec:1});
  g.ell(tx-dx,ty-dy,1.3,1.3,'x',{lv:4});},
 torso(g,J,p,c){torso(g,c,J);const[cx,cy]=J.ch,[hx,hy]=J.hip;g.px(cx-2.5,cy+4,'x',4);g.px(cx-2.5,cy+5,'x',3);g.limb(cx-3.4,cy+1.4,cx+3.2,cy+1,1.7,1.7,'hood',{bias:.05});},
 skirt(g,J,p){const[hx,hy]=J.hip,s=p.sw,y1=p.y-1.5;/* 裂けた裾 */
  g.poly([[hx-3.4,hy-2],[hx+3.4,hy-2],[hx+5.5+s,y1-4],[hx+7+s*1.5,y1],[hx+4+s,y1-2.5],[hx+2.5+s*.8,y1+.5],[hx+.5+s*.6,y1-3],[hx-2+s*.5,y1],[hx-3.5+s*.3,y1-3.5],[hx-5.5+s*.3,y1-.5],[hx-4.6,y1-7]],'robe',{f:(x,y)=>.4-(x-hx)*.1+((Math.round(x-hx-s*(y-hy)/12)%3)?0:-.3)});},
 head(g,J,p,c){const[hx,hy]=J.hd,s=p.sw;
  g.poly([[hx+2,hy-5.5],[hx+8.5+s*.4,hy-3],[hx+7,hy+3],[hx+3,hy+5]],'hood',{f:grad(hx,hy,.09,.06,.2)});/* フードの後ろの尖り */
  g.part();face(g,c,hx,hy,p,{eyeY:0});for(let y=-3;y<=0;y++)for(let x=-6;x<=2;x++)g.tone(hx+x,hy+y,-1,'s');
  cap(g,hx,hy,'hood',{rx:6.7,ry:6.5,ox:.6,oy:-.6,fx:-3.4,fy:2.4,frx:3.6,fry:3.6});
  g.part();g.poly([[hx-6.8,hy-1],[hx-4,hy-6.5],[hx+1,hy-7],[hx-2.5,hy-2.8],[hx-6,hy+1]],'hood',{f:grad(hx,hy-3,.1,.12,.45)});/* 目深なひさし */},
 front(g,J,p){if(p.fx){const[x,y]=J.hN;for(let i=0;i<3;i++){const a=p.fx+i*2.1;g.px(x+Math.cos(a)*3,y-2-i*2.5,'wisp',i?4:5);}}}
});

/* ---------- ハクア：東方の氷拳巫女。黒髪の長い結い髪と紅い紐、白い上衣に緋袴、拳法の構え ---------- */
defHum('hakua',{
 B:{leg:11.5,tor:9,hr:5.9,sh:2.4,hip:1.6,arm:9.2,legR:1.7,armR:1.35,torR:3.4},
 matsOf:P=>Object.assign(SKIN(P),{hair:[P.G,PX.tint(P.G,.5)],haka:[P.r,P.R],w:[P.w,PX.tint(P.w,.72,1.6,-25)],rib:[P.r,P.R],b:P.b,ice:GL(P.u),wrap:[P.w,PX.tint(P.w,.7,1.5,-25)]}),
 legM:'haka',bootM:'b',armM:'w',armLo:'s',handM:'wrap',torM:'w',wp:'fist',
 pose:{fF:[-5,0],fN:[4,0],hF:[-5.5,-.5],hN:[-1.5,2.5],cr:2,ln:1},
 back(g,J,p){const[hx,hy]=J.hd,s=p.sw;chain(g,hx+5.2,hy-4,.95+s*.12,5,3.3,1.9,.6,'hair',.14+s*.08);g.ell(hx+5.4,hy-4,1.7,1.7,'rib',{lv:3});
  chain(g,hx+6,hy-3.5,.3+s*.15,2,2.6,.8,.5,'rib',.3);},
 torso(g,J,p,c){torso(g,c,J);const[cx,cy]=J.ch,[hx,hy]=J.hip;g.line(cx-2.5,cy+1.5,cx+.5,cy+6,'rib',3);g.line(cx+2,cy+1.5,cx-.5,cy+5,'w',2);},
 skirt(g,J,p){const[hx,hy]=J.hip,s=p.sw;/* 袴：両脚に沿って広がる */
  for(const[k,a,sg]of[[J.kF,J.aF,-1],[J.kN,J.aN,1]]){g.part();g.poly([[hx+sg*.2-2.6,hy-2.5],[hx+sg*.2+2.6,hy-2.5],[a[0]+3.6+s*.5,a[1]-1.2],[a[0]-3.4+s*.3,a[1]-1.2]],'haka',{f:(x,y)=>.42-(x-(hx+a[0])/2)*.11+((Math.round(x-hx)%2)?0:-.26)});}
  g.rect(hx-4,hy-3.2,8,1.5,'haka',4);g.px(hx-3,hy-1.8,'w',4);},
 head(g,J,p,c){const[hx,hy]=J.hd,s=p.sw,f=grad(hx,hy);face(g,c,hx,hy,p,{blush:1,lash:1});cap(g,hx,hy,'hair',{rx:6.3,ry:6,fx:-2.7,fy:2.5,frx:4.3,fry:4.2,bias:-.12});
  g.part();g.rect(hx-5.4,hy-3.2,6.4,2.4,'hair',3);g.tone(hx-4,hy-1.2,1);g.tone(hx-1,hy-1.2,1);g.limb(hx+2.3,hy-1,hx+2+s*.3,hy+6,1.1,.6,'hair');g.limb(hx-5.6,hy-1,hx-5.8,hy+3,.8,.5,'hair');},
 front(g,J,p){if(p.fx){for(const h of[J.hF,J.hN]){const a=p.fx;g.px(h[0]-2+Math.cos(a)*1.5,h[1]-2.5,'ice',5);g.px(h[0]+1.5,h[1]-3+Math.sin(a),'ice',4);g.px(h[0]-1,h[1]+2,'ice',4);}}}
});

/* ---------- ジン：獣使い。ゆったり立つ長身、ぼさぼさの茶髪、緑の胴着、両手の鉤爪。足元に相棒ポポ ---------- */
defHum('jin',{
 B:{leg:13,tor:10.5,hr:5.7,sh:2.9,hip:1.8,arm:10.4,legR:1.9,armR:1.6,torR:4.1},W:80,AX:46,
 matsOf:P=>Object.assign(SKIN(P),{hair:[P.d,PX.tint(P.d,.55,1.1,-10)],vest:[P.j,P.J],m:[P.M,PX.tint(P.M,.5)],b:P.b,pants:PX.tint(P.b,1.25),fur:[P.o,PX.tint(P.o,.6,1.1,-14)],belly:[P.w,PX.tint(P.w,.75,1.5,-20)],y:PAL.y}),
 legM:'pants',bootH:.45,armM:'s',handM:'b',torM:'vest',wp:'claw',
 pose:{fF:[-3.5,0],fN:[3.5,0],hF:[-2.5,7.5],hN:[2.5,7.5],ln:-.4},
 claws(g,h,a){const[dx,dy]=dir(a),nx=-dy,ny=dx;for(const o of[-1.3,0,1.3])g.line(h[0]+nx*o,h[1]+ny*o,h[0]+nx*o*1.5+dx*4.5,h[1]+ny*o*1.5+dy*4.5,'m',o?4:5);},
 itemF(g,J,p,c){c.claws(g,J.hF,p.wa);},
 torso(g,J,p,c){const[cx,cy]=J.ch,[hx,hy]=J.hip;g.limb(hx,hy-.5,cx,cy+2.6,c.B.torR-.4,c.B.torR+.3,'s');
  g.limb(hx+1.2,hy-.5,cx+1.3,cy+2.6,c.B.torR-1,c.B.torR-.5,'vest');g.limb(hx-3,hy-1,cx-3.2,cy+2.5,.9,1,'vest');/* 前を開けた胴着 */
  g.rect(hx-4.6,hy-2,9.2,1.3,'b',2);g.px(hx-2.5,hy-2,'y',4);g.px(cx-1,cy+2,'m',5);},
 head(g,J,p,c){const[hx,hy]=J.hd,s=p.sw,f=grad(hx,hy);
  g.poly([[hx+2.5,hy-4],[hx+8+s*.5,hy-2.5],[hx+5,hy+1]],'hair',{f});g.poly([[hx+3.5,hy],[hx+8+s*.6,hy+4],[hx+6.5+s*.4,hy+7],[hx+2.5,hy+5]],'hair',{f});
  g.part();face(g,c,hx,hy,p);g.px(hx-4,hy+4.2,'hair',2);g.px(hx-2.5,hy+4.6,'hair',2);g.px(hx-1,hy+4.4,'hair',2);/* 無精ひげ */
  cap(g,hx,hy,'hair',{rx:6.5,ry:6});g.part();g.poly([[hx-6.2,hy-3],[hx-7,hy+.8],[hx-4,hy-2.5]],'hair',{f});g.poly([[hx-4,hy-4],[hx-2.2,hy-.2],[hx-.2,hy-3.4]],'hair',{f});g.poly([[hx-.5,hy-4],[hx+2,hy+.6],[hx+3,hy-3.4]],'hair',{f});
  g.poly([[hx-2.5,hy-5.5],[hx-1+s*.5,hy-8.8],[hx+1.5,hy-5.6]],'hair',{f});g.poly([[hx+1,hy-5.8],[hx+5+s*.6,hy-8],[hx+4.8,hy-4]],'hair',{f});},
 itemN(g,J,p,c){c.claws(g,J.hN,p.wb==null?p.wa:p.wb);},
 /* 相棒ポポ：丸い体に大きな耳と尾。独立して動く（pp=跳ね, pe=耳, pt=尾, px=位置） */
 front(g,J,p){const bx=p.x-15+(p.ppx||0),by=p.y-(p.pp||0),t=p.pt||0,e=p.pe||0;g.flag=0;
  chain(g,bx+3.5,by-3.5,-.5+t*.25,4,2.2,1.9,1,'fur',-.38+t*.08);g.ell(bx+6.2+t*.6,by-9.2,1.5,1.5,'belly',{lv:4});
  g.part();g.ell(bx,by-3.6,4.2,3.6,'fur',{bias:.1});g.ell(bx-1,by-2.4,2.6,2.2,'belly',{bias:.2});g.ell(bx-2.6,by-.7,1.4,.9,'fur',{lv:2});g.ell(bx+2.2,by-.7,1.5,.9,'fur',{lv:2});
  g.part();g.poly([[bx-5,by-9],[bx-6.2-e,by-13.5],[bx-2.6,by-10.5]],'fur',{lv:3});g.poly([[bx-1,by-10.5],[bx+1.5+e,by-14],[bx+1.5,by-9]],'fur',{lv:2});
  g.ell(bx-2,by-8,3.9,3.3,'fur',{bias:.1});g.ell(bx-3.6,by-6.8,2,1.5,'belly',{bias:.2});g.px(bx-4,by-8.8,'e',3);g.px(bx-1,by-8.8,'e',3);g.px(bx-5.6,by-7.4,'e',2);}
});

/* ---------- セレス：時の魔女。つばの広いとんがり帽子、長い白髪、紫のローブ、砂時計の杖。少し浮いている ---------- */
defHum('celes',{
 B:{leg:11.5,tor:9.6,hr:5.8,sh:2.2,hip:1.3,arm:9,legR:1.5,armR:1.25,torR:3.3},H:68,AY:63,
 matsOf:P=>Object.assign(SKIN(P),{hat:[P.v,P.V],robe:[P.v,P.V],hair:[P.k,PX.mix(P.k,PAL.q,.55)],y:[P.y,PX.tint(P.y,.58,1.15,-14)],wood:[P.b,PX.tint(P.b,.6)],sand:GL(P.u),glass:['#5a7aa0','#7a9ac0','#a8c8e8','#d8ecff','#f0f8ff','#ffffff'],b:PX.tint(P.V,.7)}),
 legM:'robe',bootM:'b',armM:'robe',handM:'s',torM:'robe',wp:'staff',
 pose:{fF:[-1.5,0],fN:[2,0],hF:[-5,4],hN:[2,5.5],wa:1.42,y:-2.5,ln:-.3},
 back(g,J,p){const[hx,hy]=J.hd,s=p.sw;g.poly([[hx+1,hy-3],[hx+6.5,hy-1],[hx+8.5+s*.7,hy+7],[hx+10+s*1.6,hy+15+p.q],[hx+6.5+s*1.4,hy+18],[hx+4+s*.8,hy+12],[hx+1.5,hy+6]],'hair',{f:(x,y)=>.4-(x-hx)*.08+((Math.round(x-hx-s*(y-hy)/16)%3)?0:-.3)});},
 itemF(g,J,p){const[x,y]=J.hF,[tx,ty]=staff(g,x,y,p.wa,11,10,'wood'),[dx,dy]=dir(p.wa),cx=tx+dx*4,cy=ty+dy*4,k=p.q2||0;/* 砂時計の杖 */
  g.rect(cx-3,cy-4.6,6,1.2,'y',4);g.rect(cx-3,cy+3.4,6,1.2,'y',3);g.poly([[cx-2.5,cy-3.4],[cx+2.5,cy-3.4],[cx+.5,cy],[cx+2.5,cy+3.4],[cx-2.5,cy+3.4],[cx-.5,cy]],'glass',{f:(px,py)=>.5-(px-cx)*.2});
  g.px(cx-1,cy-2.6+k,'sand',4);g.px(cx,cy-2.6+k,'sand',3);g.px(cx-.5,cy+(k?1:0),'sand',5);g.rect(cx-1.5,cy+2.4-k,3,1,'sand',4);},
 torso(g,J,p,c){torso(g,c,J);const[cx,cy]=J.ch,[hx,hy]=J.hip;g.limb(cx-3,cy+1.4,cx+2.6,cy+1.2,1.4,1.4,'hat',{bias:-.1});g.px(cx-2.4,cy+3,'y',4);g.rect(hx-3.6,hy-2.4,7.2,1.1,'y',3);},
 skirt(g,J,p){robe(g,J,p,'robe',{top:3.2,hem:6.2,clear:-1.5,dip:1.5,trim:1,trimD:-1,sway:1.2});},
 head(g,J,p,c){const[hx,hy]=J.hd,s=p.sw;face(g,c,hx,hy,p,{lash:1});cap(g,hx,hy,'hair',{rx:6.2,ry:5.9,fx:-2.7,fy:2.5,frx:4.3,fry:4.2});
  g.limb(hx+2.2,hy-1,hx+1.8+s*.3,hy+7,1.2,.6,'hair');g.poly([[hx-5.6,hy-3],[hx-6,hy+.4],[hx-3.4,hy-3]],'hair',{lv:3});g.poly([[hx-3.6,hy-3.6],[hx-1,hy-.2],[hx+2,hy-3.2]],'hair',{lv:4});
  /* とんがり帽子：広いつば＋折れた先端 */
  g.part();g.ell(hx+.3,hy-4.2,9.6,2.5,'hat',{bias:.05});
  g.part();g.poly([[hx-5.2,hy-4.6],[hx-2.5,hy-10],[hx+1+s*.5,hy-14.5],[hx+6.5+s*1.3,hy-16+p.q],[hx+9+s*1.6,hy-13.5+p.q],[hx+5+s*.6,hy-12],[hx+5.6,hy-5]],'hat',{f:grad(hx,hy-9,.11,.05,.35)});
  g.limb(hx-5,hy-5.4,hx+5.4,hy-5.8,.8,.8,'y',{lv:4});g.px(hx-2,hy-6.2,'sand',5);}
});

/* ---------- ヴァルク：竜人の剣士。金の角、赤髪、鱗鎧、畳んだ翼と尾、片手で担ぐ大剣 ---------- */
defHum('valk',{
 B:{leg:13,tor:11.8,hr:5.7,sh:3.3,hip:2,arm:10.8,legR:2.2,armR:1.85,torR:4.6},W:84,AX:44,H:68,AY:63,
 matsOf:P=>Object.assign(SKIN(P),{hair:[P.r,P.R],scale:[P.R,PX.tint(P.R,.5,1.1,-10)],wing:[P.R,PX.tint(P.R,.45)],mem:[PX.tint(P.r,.8),PX.tint(P.R,.7)],dark:[P.G,PX.tint(P.G,.5)],horn:[P.y,PX.tint(P.y,.55,1.1,-14)],m:[P.m,P.M],g:P.g,o:P.o,y:P.y,smoke:GL(P.o)}),
 legM:'scale',bootM:'dark',bootH:.5,armM:'scale',handM:'dark',torM:'scale',wp:'great',
 pose:{fF:[-4.5,0],fN:[4.5,0],hF:[-4.5,5],hN:[2,7],wa:-.72,cr:.5,ln:.3},itemFront:1,
 back(g,J,p){const[cx,cy]=J.ch,[hx,hy]=J.hip,w=p.wg||0,s=p.sw;
  chain(g,hx+2,hy+1,.75-s*.06,6,3.2,2.3,.5,'scale',-.16+s*.05);/* 尾 */
  for(const[ox,oy,sc,lv]of[[2.5,-1,1,0],[.5,.5,.8,-.25]]){g.part();const bx=cx+ox,by=cy+oy+2,tx=bx+(9+w*4)*sc,ty=by-(13-w*3)*sc;/* 翼：骨＋膜 */
   g.poly([[bx,by],[tx,ty],[tx+(5+w*3)*sc,ty+7*sc],[tx+(3+w*4)*sc,ty+15*sc],[tx-1*sc,ty+12*sc],[bx+5*sc,by+15*sc-w*2],[bx+1.5,by+7]],'mem',{f:(x,y)=>.2+lv-(x-bx)*.04+((Math.round((x-bx)*.6+(y-by)*.25)%3)?0:-.3)});
   g.limb(bx,by,tx,ty,1.3,.8,'wing',{bias:lv});g.limb(tx,ty,tx+(5+w*3)*sc,ty+7*sc,.8,.5,'wing',{bias:lv});g.limb(tx,ty,tx-1*sc,ty+12*sc,.7,.4,'wing',{bias:lv});g.px(tx,ty-1.5,'horn',4);}},
 itemF(g,J,p){blade(g,J.hF[0],J.hF[1],p.wa,20,{w:2.1,guard:3.6,grip:5,gm:'dark'});},
 torso(g,J,p,c){torso(g,c,J);const[cx,cy]=J.ch,[hx,hy]=J.hip;g.ell(cx-.6,cy+4.2,4.3,3.4,'scale',{spec:1,bias:.1});g.px(cx-2.5,cy+4.5,'o',4);g.px(cx-1.5,cy+4.5,'o',5);
  for(let y=0;y<4;y++)for(let x=-3;x<4;x++)if((x+y)%2===0)g.tone(hx+x,hy-6+y,-1,'scale');g.rect(hx-4.8,hy-2.2,9.6,1.4,'g',3);
  g.ell(J.sF[0]-.5,J.sF[1]-.8,2.6,2.3,'dark',{spec:1,bias:.2});},
 armN(g,J,p,c){arm(g,c,J.sN,J.eN,J.hN);g.ell(J.sN[0]+.3,J.sN[1]-.8,2.9,2.5,'dark',{spec:1,bias:.2});g.px(J.sN[0]+1,J.sN[1]-3.4,'horn',4);},
 head(g,J,p,c){const[hx,hy]=J.hd,s=p.sw,f=grad(hx,hy);
  g.limb(hx+3.5,hy-4.5,hx+8.5,hy-9.5,1.5,.4,'horn',{bias:.15});/* 奥の角 */
  g.poly([[hx+3,hy-4],[hx+9+s*.6,hy-3],[hx+5,hy+1]],'hair',{f});g.poly([[hx+3.5,hy],[hx+9+s*.8,hy+4],[hx+7+s*.6,hy+8.5],[hx+2.5,hy+5]],'hair',{f});
  g.part();face(g,c,hx,hy,p,{iris:0});g.px(hx+1,hy+2.6,'scale',3);g.px(hx+2,hy+1.6,'scale',3);g.px(hx+1,hy+3.6,'scale',2);/* 頬の鱗 */
  cap(g,hx,hy,'hair',{rx:6.4,ry:6});g.part();g.poly([[hx-6.2,hy-3.2],[hx-6.6,hy+.4],[hx-4,hy-2.8]],'hair',{f});g.poly([[hx-4.2,hy-4],[hx-2.6,hy-.3],[hx-.6,hy-3.5]],'hair',{f});g.poly([[hx-1,hy-4],[hx+1,hy+.2],[hx+2.8,hy-3.5]],'hair',{f});
  g.part();g.limb(hx-3.5,hy-5,hx-8,hy-10.5,1.6,.4,'horn',{bias:.2,spec:1});/* 手前の角 */},
 front(g,J,p){if(p.fx){const[hx,hy]=J.hd;for(let i=0;i<3;i++)g.px(hx-7-i*1.5,hy+3-i*1.6-p.fx,'smoke',5-i);}}
});
}
