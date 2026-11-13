/* ===== ver0.19 敵キャラクターのドット絵定義 =====
 種族ごとに専用のリグ（体の作り・ポーズ値・描き方）を持つ。人型の敵は味方のリグを流用する。
 色替えの敵は既存の配色表（1文字キー）をそのまま受け取り、
 一部の敵は「派生形」（妖狐の九尾、火竜の翼、海月の触手、精霊の炎体など）で形そのものを変える */
{const{chain,dir}=HUM;
const GL=c=>{const a=[PX.tint(c,.5),PX.tint(c,.7),PX.tint(c,.85),c,PX.mix(c,'#ffffff',.5),'#ffffff'];a.glow=1;return a;};
function defMon(name,spec){const c=Object.assign({W:96,H:80,AX:48,AY:74,type:'mon',pose:{}},spec);
 c.paint=function(g,pose,over,extra){const P=Object.assign({},PAL,this.pal0,over),m=this.matsOf(P,extra);
  for(const k in m){const v=m[k];if(Array.isArray(v)){if(v.length===6)g.def(k,v,null,v.glow);else g.def(k,v[0],v[1],v[2]);}else g.def(k,v);}
  this.draw(g,Object.assign({},this.pose,pose),extra||'',P);};RIG[name]=c;SPRX.reg(name);return c;}

/* ---------- スライム：半透明のゼリー。つぶれ・伸び・表面のうねり ----------
 sq=つぶれ(-1伸び〜+1つぶれ) lx=上部の傾き y=跳ね bl=まばたき mo=口 wb=うねり位相 bb=泡 */
defMon('slime',{W:72,H:64,AX:36,AY:58,pose:{sq:0,lx:0,x:0,y:0,bl:0,mo:0,wb:0,bb:0},
 matsOf:P=>({v:[P.v,P.V],core:[P.p,P.v],k:[P.k||'#f4f0ff','#b8b0d8'],e:P.V,hi:GL('#ffffff')}),
 draw(g,p){const s=p.sq,w=12.5*(1+s*.28),h=8.5*(1-s*.34),cx=p.x,by=p.y,ty=by-h*1.2-7.5*(1-s*.5),lx=p.lx,wb=p.wb;
  /* 足元のたれ */
  g.ell(cx-w+1.5+(wb%2),by-1.2,3,1.6,'v',{bias:-.2});g.ell(cx+w-2-(wb%3)*.5,by-1.4,3.4,1.8,'v',{bias:-.3});g.ell(cx-2+wb*.3,by-.9,3,1.3,'v',{bias:-.2});
  /* 本体：下ぶくれ＋上のドーム＋先のとがり */
  g.ell(cx,by-h,w,h,'v',{spec:1});g.ell(cx+lx*.5,by-h*1.25-2.2*(1-s*.4),w*.74,h*.95,'v',{spec:1});g.ell(cx+lx,ty+3,w*.42,4.2*(1-s*.4),'v',{spec:1});
  g.limb(cx+lx,ty+1.5,cx+lx*1.6+(wb%2?-1.2:1.2),ty-2.2+s*1.5,1.7,.5,'v',{bias:.25});
  /* 内側の明るい芯と泡 */
  g.ell(cx+2.5,by-h*.95,w*.5,h*.55,'core',{bias:-.25,max:3});g.px(cx+5-p.bb,by-h*1.2-p.bb*2.5,'core',5);g.px(cx-1+p.bb*.5,by-h*.6-p.bb*1.5,'core',4);
  /* つや */
  g.ell(cx-w*.48+lx*.3,by-h*1.45,2.6,1.6,'hi',{lv:5,rot:-.5});g.px(cx-w*.62+lx*.2,by-h*.95,'hi',5);
  /* 目と口 */
  const ey=Math.round(by-h*1.12),ex=Math.round(cx-w*.36);
  for(const[dx,far]of[[0,1],[6.5,0]]){const x=ex+dx;if(p.bl){g.rect(x-1,ey+1,3-far,1,'e',1);continue;}g.ell(x+.5-far*.5,ey+.5,1.9-far*.4,2.4,'k',{lv:5});g.rect(x-1+(far?0:0),ey,1.6,2.2,'e',1);g.px(x-1,ey-1,'e',1);}
  if(p.mo){g.ell(cx-w*.1,by-h*.52,2.6,1.8*p.mo,'e',{lv:1});g.px(cx-w*.1-1.5,by-h*.52-1,'k',5);g.px(cx-w*.1+1,by-h*.52-1,'k',5);}else g.rect(cx-w*.3,by-h*.55,4.5,1,'e',1);}
});

/* ---------- 狼（四足獣）：呼吸・首・耳・尾。派生＝fox（妖狐：多尾）／drake（火竜の仔：翼と角）／dragon（大型竜） ----------
 fa,fb=前脚(手前,奥) ha,hb=後脚 の足先 [x,持ち上げ] / hx,hy=頭 jw=あご er=耳 tl=尾 pt=前傾 br=呼吸 hk=毛の逆立ち wg=翼 */
defMon('wolf',{W:112,H:88,AX:58,AY:80,pose:{x:0,y:0,pt:0,hx:0,hy:0,jw:0,er:0,tl:0,br:0,hk:0,wg:0,bl:0,fa:[-9,0],fb:[-5.5,0],ha:[10.5,0],hb:[14,0]},
 matsOf:(P,ex)=>({fur:[P.g,P.G],dk:[PX.tint(P.G,1.15),PX.tint(P.G,.55)],w:[P.w,PX.mix(P.w,P.G,.45)],x:GL(P.x),e:'#140c18',horn:[P.w,PX.mix(P.w,P.G,.6)],mem:[PX.mix(P.g,P.w,.35),P.G],fire:GL(P.x)}),
 draw(g,p,ex){const fox=ex==='fox',dr=ex==='drake'||ex==='dragon',X=p.x,Y=p.y,pt=p.pt,br=p.br,
   sh=[X-7,Y-14.5+pt*1.2-br*.4],hp=[X+9,Y-14-pt*.6],hd=[X-15.5+p.hx,Y-19.5+p.hy+pt*1.6];
  const legF=(s,f,far)=>{const a=[X+f[0],Y-f[1]-1],k=PX.ik(s[0],s[1],a[0],a[1],5.4,5.6,-1),o={bias:far?-.32:0};g.limb(s[0],s[1],k[0],k[1],2.3,1.7,far?'dk':'fur',o);g.limb(k[0],k[1],a[0],a[1],1.6,1.3,far?'dk':'fur',o);g.ell(a[0]-1,a[1]+.2,2.4,1.5,far?'dk':'fur',o);if(!far){g.px(a[0]-3.3,a[1]+.6,'w',4);g.px(a[0]-2,a[1]+1,'w',3);}};
  const legH=(s,f,far)=>{const a=[X+f[0],Y-f[1]-1],k=PX.ik(s[0],s[1],a[0],a[1]-3,5.6,4.6,1),o={bias:far?-.32:0};g.ell(s[0]+.4,s[1]+1,3.6,4.4,far?'dk':'fur',o);g.limb(s[0],s[1]+1,k[0]+2.2,k[1]+.6,2.4,1.5,far?'dk':'fur',o);g.limb(k[0]+2.2,k[1]+.6,a[0],a[1]-1,1.4,1.2,far?'dk':'fur',o);g.ell(a[0]-1,a[1]+.2,2.5,1.5,far?'dk':'fur',o);};
  /* 尾 */
  if(fox){for(let i=0;i<5;i++){g.part();const a=-1.25+i*.42+p.tl*.14*(i%2?1:-.7),e=chain(g,hp[0]+3,hp[1]-1,a,5,3.6,2.6,3.4,'fur',-.2+i*.02+p.tl*.03,{bias:i%2?-.12:.05});g.ell(e[0],e[1],3,3,'w',{bias:.1});}}
  else if(dr){g.part();const e=chain(g,hp[0]+3.5,hp[1]+.5,.25+p.tl*.1,6,3.4,3,.9,'fur',.12-p.tl*.06);g.poly([[e[0]-1,e[1]-2.5],[e[0]+4,e[1]],[e[0]-1,e[1]+2.5]],'dk',{lv:3});}
  else{g.part();chain(g,hp[0]+4,hp[1]-1.5,.9+p.tl*.22,5,2.8,2.5,1.2,'fur',-.1+p.tl*.08,{bias:-.05});chain(g,hp[0]+4.6,hp[1]-.5,1+p.tl*.22,4,2.6,1.4,.6,'w',-.08+p.tl*.08,{bias:-.2});}
  /* 奥の翼（竜） */
  if(dr){g.part();this.wing(g,sh[0]+5,sh[1]-3,p.wg,.82,-.3);}
  g.part();legF([sh[0]+2,sh[1]+4.5],p.fb,1);legH([hp[0]+1.5,hp[1]+2.5],p.hb,1);
  /* 胴 */
  g.part();g.ell(X+2.5,Y-13.2+pt*.3,8.6,5.3+br*.3,'fur');g.ell(hp[0],hp[1]+.3,5.6,5.3,'fur');g.ell(sh[0],sh[1]+.6-br*.2,6.6,6.3+br*.35,'fur');
  g.ell(X+1,Y-9.6,7,2.3,dr?'mem':'w',{bias:-.15,max:3});g.ell(sh[0]-2.5,sh[1]+4.8,3,2.6,dr?'mem':'w',{bias:-.05,max:4});
  if(dr)for(let i=0;i<5;i++)g.poly([[X-5+i*4,Y-19.2+pt*.5],[X-3.4+i*4,Y-22.6+pt*.5-(i%2)],[X-1.8+i*4,Y-18.8+pt*.3]],'dk',{lv:3});
  else for(let i=0;i<4;i++)g.poly([[sh[0]-3+i*3.4,sh[1]-5.2+i*.3],[sh[0]+.5+i*3.4,sh[1]-8.2-p.hk*1.6+i*.5],[sh[0]+2.4+i*3.4,sh[1]-4.6+i*.4]],'dk',{lv:i%2?2:3});
  g.part();legH([hp[0],hp[1]+2.5],p.ha,0);legF([sh[0],sh[1]+4.5],p.fa,0);
  /* 首と頭 */
  g.part();g.limb(sh[0]-1.5,sh[1]-1.5,hd[0]+2,hd[1]+1.5,4.6,3.4,'fur');if(!dr){g.poly([[sh[0]-4,sh[1]+1],[hd[0]+1,hd[1]+5],[sh[0]-5.5,sh[1]+5.5]],'w',{lv:3});}
  g.part();const sn=fox?7.2:dr?7.6:6.4;
  g.poly([[hd[0]+.5,hd[1]-3],[hd[0]+2.2+p.er*.8,hd[1]-8.6-p.er],[hd[0]+3.6,hd[1]-2.2]],'dk',{lv:2});/* 奥の耳 */
  g.limb(hd[0]-1,hd[1]+2.2,hd[0]-sn+1,hd[1]+3+p.jw*2.6,1.9,1.1,'fur',{bias:-.25});/* 下あご */
  if(p.jw>.25){g.rect(hd[0]-sn+2,hd[1]+2.2,sn-3.5,Math.max(1,p.jw*2),'e',1);for(let i=0;i<3;i++){g.px(hd[0]-sn+2.5+i*1.6,hd[1]+2,'w',5);g.px(hd[0]-sn+3+i*1.6,hd[1]+1.6+p.jw*2.3,'w',4);}}
  g.ell(hd[0],hd[1],4.7,4.2,'fur');g.limb(hd[0]-2,hd[1]+.6,hd[0]-sn,hd[1]+1.5,2.6,1.6,'fur',{bias:.05});
  g.px(hd[0]-sn-1.5,hd[1]+.6,'e',1);g.px(hd[0]-sn-.6,hd[1]+.2,'e',1);/* 鼻 */
  if(!dr){g.ell(hd[0]-1,hd[1]+3,3,1.7,'w',{bias:-.1,max:4});g.px(hd[0]-sn+1.5,hd[1]+2.8,'w',5);}
  if(p.bl)g.rect(hd[0]-4,hd[1]-1,2,1,'e',1);else{g.px(hd[0]-3.6,hd[1]-1.6,'e',1);g.px(hd[0]-2.6,hd[1]-2,'e',1);g.px(hd[0]-3.4,hd[1]-.9,'x',4);g.px(hd[0]-2.5,hd[1]-1.1,'x',5);}
  if(dr){g.limb(hd[0]+1.5,hd[1]-3,hd[0]+7,hd[1]-7.5,1.4,.4,'horn',{bias:.2});g.limb(hd[0]+3,hd[1]-1.5,hd[0]+8,hd[1]-3.5,1.1,.4,'horn',{bias:-.1});}
  else g.poly([[hd[0]-1.6,hd[1]-3.2],[hd[0]-.6+p.er*.8,hd[1]-(fox?10.5:9)-p.er],[hd[0]+2.4,hd[1]-3.2]],'fur',{f:(x,y)=>.5-(x-hd[0])*.2});/* 手前の耳 */
  if(dr){g.part();this.wing(g,sh[0]+2.5,sh[1]-3.5,p.wg,1,0);if(p.fx){for(let i=0;i<4;i++)g.px(hd[0]-sn-2.5-i*1.4,hd[1]+2+((i+p.fx)%3)-1,'fire',5-(i>>1));}}},
 wing(g,bx,by,w,sc,lv){const tx=bx+(7-w*3)*sc,ty=by-(13+w*5)*sc,ex=bx+(19-w*4)*sc,ey=by-(6+w*10)*sc;
  g.poly([[bx,by],[tx,ty],[ex,ey],[ex-2*sc,ey+9*sc],[bx+11*sc,by+2*sc+w*2],[bx+5*sc,by+3]],'mem',{f:(x,y)=>.25+lv-(x-bx)*.03+((Math.round((x-bx)*.5+(y-by)*.3)%3)?0:-.3)});
  g.limb(bx,by,tx,ty,1.5,1,'dk',{bias:lv});g.limb(tx,ty,ex,ey,1,.5,'dk',{bias:lv});g.limb(tx,ty,ex-2*sc,ey+9*sc,.8,.4,'dk',{bias:lv});g.limb(tx,ty,bx+11*sc,by+2*sc,.8,.4,'dk',{bias:lv});g.px(tx-.5,ty-1.6,'horn',4);}
});

/* ---------- ゴーレム：岩の巨体。重い呼吸、腕の揺れ、核の明滅 ----------
 by=胴の沈み ln=傾き hF,hN=拳の位置(肩から) hy=頭 gl=核の光 fF,fN=足 cr=ひび */
defMon('golem',{W:104,H:92,AX:52,AY:84,pose:{x:0,y:0,by:0,ln:0,hy:0,gl:0,hF:[-6,17],hN:[5,17],fF:[-7,0],fN:[8,0],dz:0},
 matsOf:P=>({a:[P.a,P.A],dk:[PX.tint(P.A,1.1),PX.tint(P.A,.5)],o:GL(P.o),core:GL(P.u),y:[P.y,PX.tint(P.y,.55)],moss:PX.mix(P.A,'#4a7a3a',.35)}),
 draw(g,p){const X=p.x,Y=p.y,hip=[X,Y-17+p.by],ch=[X-p.ln,Y-37+p.by*1.6],sF=[ch[0]-12,ch[1]+3],sN=[ch[0]+12.5,ch[1]+3.5];
  const rock=(cx,cy,w,h,lv=0)=>(x,y)=>.3+lv-(x-cx)/w*.55-(y-cy)/h*.5+((Math.round(x*.7+y*.45+60)%5===0)?-.3:0);
  const armG=(s,h,far)=>{const hx=s[0]+h[0],hy=s[1]+h[1],e=PX.ik(s[0],s[1],hx,hy,10.5,10.5,-1),o={bias:far?-.3:0};g.limb(s[0],s[1],e[0],e[1],4.4,3.8,far?'dk':'a',o);g.limb(e[0],e[1],hx,hy,3.9,4.6,far?'dk':'a',o);
   g.poly([[hx-6.2,hy-4.4],[hx+5.2,hy-5],[hx+6.4,hy+3.2],[hx-.5,hy+5.8],[hx-6.6,hy+3.6]],far?'dk':'a',{f:rock(hx,hy,7,6,far?-.3:0)});if(!far)for(const i of[-3.5,-.5,2.5])g.tone(hx+i,hy+3,-1);};
  const legG=(hx,f,far)=>{const fx=X+f[0],fy=Y-f[1];g.poly([[hx-4.5,hip[1]-2],[hx+4.5,hip[1]-2],[fx+5.5,fy-4],[fx-5.5,fy-4]],far?'dk':'a',{f:rock(hx,hip[1]+6,6,10,far?-.3:0)});g.poly([[fx-7.5,fy-5],[fx+6,fy-5.5],[fx+6.8,fy],[fx-8.2,fy]],far?'dk':'a',{f:rock(fx,fy-3,8,4,far?-.25:.1)});};
  g.part();armG(sF,p.hF,1);g.part();legG(hip[0]-6.5,p.fF,1);g.part();legG(hip[0]+6,p.fN,0);
  /* 胴：逆台形の岩塊 */
  g.part();g.poly([[ch[0]-15,ch[1]+1],[ch[0]-9,ch[1]-6],[ch[0]+9.5,ch[1]-6.5],[ch[0]+15.5,ch[1]+1.5],[hip[0]+10,hip[1]+1],[hip[0]-9.5,hip[1]+1.5]],'a',{f:rock(ch[0],ch[1]+8,16,14,.05),spec:1});
  g.poly([[hip[0]-8,hip[1]-3],[hip[0]+8.5,hip[1]-3.5],[hip[0]+7,hip[1]+3.5],[hip[0]-7,hip[1]+4]],'dk',{f:rock(hip[0],hip[1],8,4,.2)});
  for(const[a,b,c,d]of[[-9,3,-5,9],[-5,9,-7,14],[6,2,9,8],[9,8,6,13],[2,-3,4,1]])g.line(ch[0]+a,ch[1]+b,ch[0]+c,ch[1]+d,'a',1);/* ひび割れ */
  g.px(ch[0]-11,ch[1]-1,'moss',3);g.px(ch[0]-10,ch[1]-2,'moss',4);g.px(ch[0]+9,ch[1]-3,'moss',3);g.px(ch[0]+10,ch[1]-2.4,'moss',3);
  /* 胸の核 */
  g.ell(ch[0]-1.5,ch[1]+7.5,4.4,4.4,'y',{spec:1,bias:.1});g.ell(ch[0]-1.5,ch[1]+7.5,2.8,2.8,'core',{lv:3+Math.round(p.gl)});g.px(ch[0]-2.5,ch[1]+6.5,'core',5);
  if(p.gl>1.4)for(const[a,b]of[[-7,7],[4,7],[-1.5,1.5],[-1.5,13.5]])g.px(ch[0]+a,ch[1]+b,'core',5);
  /* 頭：肩に埋まった小さな岩 */
  g.part();const hd=[ch[0]-2.5,ch[1]-8.5+p.hy];g.poly([[hd[0]-6,hd[1]+5],[hd[0]-6.5,hd[1]-2],[hd[0]-3,hd[1]-5.5],[hd[0]+4,hd[1]-5.5],[hd[0]+6.5,hd[1]-1.5],[hd[0]+6,hd[1]+5]],'a',{f:rock(hd[0],hd[1],7,6,.1),spec:1});
  g.rect(hd[0]-5,hd[1]-1,8.5,2.6,'dk',1);g.rect(hd[0]-4.4,hd[1]-.4,2.2,1.4,'o',p.gl>1?5:4);g.rect(hd[0]+.2,hd[1]-.4,2.2,1.4,'o',p.gl>1?5:4);g.rect(hd[0]-4,hd[1]+3,6.5,1,'dk',1);
  /* 肩の岩と手前の腕 */
  g.part();g.ell(sF[0]+1,sF[1]-1.5,5,4.2,'dk',{bias:-.1});g.part();armG(sN,p.hN,0);g.ell(sN[0]-.5,sN[1]-1.5,5.8,4.8,'a',{spec:1,bias:.1});g.tone(sN[0]-2,sN[1]-3,-1);g.tone(sN[0]+1,sN[1]-1,-1);
  if(p.dz){g.px(X-14+p.dz*2,Y-3-p.dz*2,'a',4);g.px(X+13-p.dz,Y-2-p.dz*3,'a',3);}}
});

/* ---------- 茸：大きな傘と小さな体。傘の揺れと胞子。派生＝jelly（大海月：傘＋触手で漂う） ----------
 sq=傘のつぶれ ln=傾き y=浮き bl,mo sp=胞子位相 hF,hN=小さな腕 tn=触手の揺れ */
defMon('shroom',{W:80,H:76,AX:40,AY:70,pose:{x:0,y:0,sq:0,ln:0,bl:0,mo:0,sp:0,tn:0,ar:0,st:0},
 matsOf:(P,ex)=>({cap:[P.r,P.R],w:[P.w,PX.mix(P.w,P.R,.35)],e:P.e,gill:[PX.mix(P.w,P.R,.3),PX.mix(P.w,P.R,.65)],spore:GL(PX.mix(P.r,'#ffffff',.4)),glow:GL(P.w)}),
 draw(g,p,ex){const X=p.x,Y=p.y,s=p.sq,ln=p.ln;
  if(ex==='jelly'){const cy=Y-30+s*2,cx=X-ln;/* 海月：触手 → 傘 → 顔 */
   for(let i=0;i<6;i++){g.part();const tx=cx-9+i*3.7,ph=p.tn+i*1.3;chain(g,tx,cy+3,1.57+Math.sin(ph)*.28,6,3.2-(i%2)*.4,i%2?1.2:1.6,.5,i%2?'gill':'w',Math.cos(ph)*.2,{bias:i%2?-.2:0});}
   g.part();g.ell(cx,cy+2.5,11.5,3.6,'gill',{bias:-.1});for(let i=0;i<7;i++)g.ell(cx-10.5+i*3.5,cy+4.6+(i%2)*.6,1.9,1.7,'cap',{bias:-.15});
   g.part();g.ell(cx,cy-3-s*1.5,14*(1+s*.1),10.5*(1-s*.22),'cap',{spec:1,clip:(x,y)=>y<cy+3});g.ell(cx+3,cy-4,7,5,'gill',{bias:.1,max:4,clip:(x,y)=>y<cy+1});
   g.ell(cx-6,cy-8.5,3.2,2,'glow',{lv:5,rot:-.5});for(const[a,b]of[[4,-9],[9,-3],[-2,-11.5]])g.ell(cx+a,cy+b,1.6,1.2,'w',{lv:4});
   const ex2=Math.round(cx-6),ey=Math.round(cy-2);if(p.bl){g.rect(ex2-1,ey+1,2,1,'e',2);g.rect(ex2+5,ey+1,2,1,'e',2);}else{g.rect(ex2-1,ey,2,2.4,'e',2);g.rect(ex2+5,ey,2,2.4,'e',2);g.px(ex2-1,ey,'glow',5);g.px(ex2+5,ey,'glow',5);}return;}
  const by=Y-1,st=[X-ln*.4,by-9],cy=by-19+s*2.2,cx=X-ln;
  /* 小さな足 */
  g.part();g.ell(X-4.5+p.st,by-.8,3,1.8,'w',{bias:-.3});g.ell(X+4.5-p.st*.5,by-.8,3,1.8,'w',{bias:-.3});
  /* 柄（体） */
  g.part();g.limb(X,by-2.5,st[0],st[1]-6,6.8,5.6,'w');g.ell(X,by-4,7.4,4.6,'w',{bias:-.05});
  /* 腕 */
  g.limb(st[0]-6,st[1]-2,st[0]-10.5,st[1]+1.5-p.ar*5,1.5,1.1,'w',{bias:-.1});g.limb(st[0]+6,st[1]-2,st[0]+10,st[1]+2-p.ar*3,1.5,1.1,'w',{bias:-.25});
  /* 顔 */
  const ex2=Math.round(st[0]-4.5),ey=Math.round(st[1]-3);
  if(p.bl){g.rect(ex2-1,ey+1,3,1,'e',3);g.rect(ex2+5,ey+1,2,1,'e',3);}else{g.rect(ex2-1,ey-1,2.4,3.4,'e',3);g.rect(ex2+5,ey-1,2,3.4,'e',3);g.px(ex2-1,ey-1,'glow',5);g.px(ex2+5,ey-1,'glow',5);g.rect(ex2-2,ey-3,4,1,'e',3);g.rect(ex2+4.5,ey-3,3,1,'e',3);}
  if(p.mo)g.ell(ex2+3,ey+5,2.2,1.6*p.mo,'e',{lv:2});else g.rect(ex2+1,ey+5,4,1,'e',3);
  /* 傘：ひだ → ドーム → 水玉 */
  g.part();g.ell(cx,cy+3.2,15*(1+s*.1),3.6,'gill',{bias:-.15});for(let i=-4;i<=4;i++)g.tone(cx+i*3.2,cy+4.2,-1,'gill');
  g.part();g.ell(cx,cy-2.5-s,17*(1+s*.12),11*(1-s*.25),'cap',{spec:1,clip:(x,y)=>y<cy+3.4});
  for(const[a,b,r]of[[-9,-5,3],[1,-9,3.4],[9,-3.5,2.6],[-2,-1.5,2],[-14,0,1.6],[13,1.5,1.5]])g.ell(cx+a*(1+s*.1),cy+b*(1-s*.25)-s,r,r*.78,'w',{bias:.1,clip:(x,y)=>y<cy+3});
  if(p.sp)for(let i=0;i<5;i++){const a=p.sp*.8+i*1.9;g.px(cx-14+i*7+Math.cos(a)*2,cy-10-((p.sp*2+i*3)%9),'spore',i%2?5:4);}}
});

/* ---------- 魔導書の亡霊：宙に浮く開いた書と、頁から立ちのぼる霊体。派生＝spirit（影法師・雪霊・残り火：炎のような霊体のみ） ----------
 y=浮き fl=頁のめくれ op=開き ws=霊体の揺れ ey=目の光 ar=腕 */
defMon('bookghost',{W:80,H:80,AX:40,AY:74,pose:{x:0,y:-8,fl:0,op:0,ws:0,ey:0,ar:0,tl:0,mo:0},
 matsOf:(P,ex)=>({cov:[P.V,PX.tint(P.V,.5)],page:[P.w,PX.mix(P.w,P.q,.55)],ink:P.q,gem:GL(P.o),wisp:[P.p,PX.mix(P.p,P.V,.6)],ws2:[PX.mix(P.p,P.w,.5),P.p],e:P.V,gold:[P.p,PX.tint(P.p,.55)],glow:GL(P.w)}),
 draw(g,p,ex){const X=p.x,Y=p.y,ws=p.ws;
  if(ex){const cx=X,cy=Y-16,sh=ex==='shade',yu=ex==='yuki';/* 精霊：残り火＝炎の体／影法師＝背の高い影と長い爪／雪霊＝氷の冠と結晶 */
   g.part();chain(g,cx+2,cy+9,1.4+Math.sin(ws)*.3,sh?6:4,3.2,3.4,.6,'wisp',.25*Math.cos(ws),{bias:-.2});
   g.part();const ay=sh?13:5,ax=sh?15:13;g.limb(cx-7,cy+1,cx-ax,cy+ay-p.ar*(sh?12:8),2,1,'wisp',{bias:-.1});g.limb(cx+7,cy+1,cx+ax-.5,cy+ay+1-p.ar*(sh?8:5),2,1,'wisp',{bias:-.3});
   if(sh)for(const[hx2,hy2]of[[cx-ax,cy+ay-p.ar*12],[cx+ax-.5,cy+ay+1-p.ar*8]])for(const d of[-1.6,0,1.6])g.line(hx2+d*.5,hy2,hx2+d*1.4,hy2+4.5,'ws2',4);
   g.part();g.ell(cx,cy+2,sh?7.5:9,sh?11.5:9.5,'wisp');g.ell(cx-.5,cy-(sh?7:4),sh?6.6:7.6,sh?8.4:7.8,'wisp',{spec:1});
   if(sh){g.poly([[cx-6,cy-11],[cx-1+Math.sin(ws)*1.2,cy-21],[cx+5,cy-12]],'wisp',{f:(x,y)=>.3-(x-cx)*.08});}
   else if(yu){for(const[dx,h,w]of[[-5,7,2.2],[0,10,2.8],[5,6.5,2]])g.poly([[cx+dx-w,cy-9.5],[cx+dx,cy-10.5-h],[cx+dx+w,cy-9.5],[cx+dx,cy-7.5]],'ws2',{f:(x,y)=>.6-(x-cx-dx)*.3,spec:1});
    for(let i=0;i<3;i++){const a=ws*.6+i*2.1;g.px(cx+Math.cos(a)*13,cy-2+Math.sin(a)*8,'glow',5);}}
   else for(let i=0;i<4;i++){const a=ws+i*1.7,fx=cx-6+i*4+Math.sin(a)*1.2;g.limb(fx,cy-8,fx+Math.sin(a*1.3)*2.2,cy-15-((i*5+Math.round(ws*2))%4)*1.4,2.2,.5,i%2?'ws2':'wisp',{bias:.15});}
   if(!sh)g.ell(cx-1,cy+2.5,5.5,5.5,'ws2',{bias:-.1,max:4});
   const ey=Math.round(cy-(sh?7:3)),ex2=Math.round(cx-5);g.poly([[ex2-2,ey-1],[ex2+2,ey+.4],[ex2+1,ey+3],[ex2-2,ey+2.4]],'e',{lv:1});g.poly([[ex2+5,ey+.4],[ex2+9,ey-1],[ex2+9,ey+2.4],[ex2+6,ey+3]],'e',{lv:1});
   g.px(ex2-1,ey+.6,'gem',p.ey?5:4);g.px(ex2+7,ey+.6,'gem',p.ey?5:4);if(p.mo)g.ell(cx-1.5,cy+(sh?1:5),2.6,2*p.mo,'e',{lv:1});return;}
  const by=Y-14,op=p.op;
  /* 霊体の尾 */
  g.part();chain(g,X+1,by+5,1.5+Math.sin(ws)*.35,5,3,2.6,.5,'wisp',.3*Math.cos(ws*.8),{bias:-.15});
  /* 頁から立つ霊体（頭と腕） */
  g.part();const hx=X-.5+Math.sin(ws*.7)*1.2,hy=by-15-op*2;
  g.limb(X-1,by-4,hx,hy+3,5,5.5,'wisp',{bias:-.1});g.limb(hx-5,hy+5,hx-12,hy+8-p.ar*9,1.8,1,'wisp');g.limb(hx+5,hy+5,hx+11.5,hy+9-p.ar*6,1.8,1,'wisp',{bias:-.25});
  g.ell(hx,hy,6.4,6.6,'wisp',{spec:1});for(let i=0;i<3;i++){const a=ws*1.2+i*2;g.limb(hx-4+i*4,hy-5,hx-4+i*4+Math.sin(a)*2,hy-10-(i%2)*2,1.8,.4,'ws2',{bias:.1});}
  const ey=Math.round(hy-1),ex2=Math.round(hx-4.5);g.ell(ex2+.5,ey+1,1.9,2.3,'e',{lv:1});g.ell(ex2+6,ey+1,1.6,2.3,'e',{lv:1});g.px(ex2,ey+1,'gem',p.ey?5:4);g.px(ex2+6,ey+1,'gem',p.ey?5:4);
  if(p.mo)g.ell(hx-1.5,hy+4,2,1.8*p.mo,'e',{lv:1});
  /* 開いた書：表紙 → 左右の頁 → 文字 → 背の宝石 */
  g.part();g.poly([[X-17,by-6-op],[X,by-1],[X+17,by-6.5-op],[X+17,by+1-op],[X,by+6.5],[X-17,by+1.5-op]],'cov',{f:(x,y)=>.2-(x-X)*.02});
  g.part();const fl=p.fl;
  g.poly([[X-15.5,by-8.5-op],[X-.6,by-3.4],[X-.6,by+3.6],[X-15.5,by-1-op]],'page',{f:(x,y)=>.55+(x-X)*.035});
  g.poly([[X+.6,by-3.4],[X+15.5,by-9-op],[X+15.5,by-1.5-op],[X+.6,by+3.6]],'page',{f:(x,y)=>.3-(x-X)*.03});
  for(let i=0;i<3;i++){g.line(X-13,by-5.2-op*.8+i*2.1,X-3.5,by-1.9+i*2.1,'ink',3);g.line(X+3.5,by-1.9+i*2.1,X+12.5,by-5.4-op*.8+i*2.1,'ink',2);}
  if(fl){g.part();const fx=X+12-fl*8;g.poly([[X+.5,by-3.6],[fx,by-10.5-op-(4-Math.abs(fl-2))*1.2],[fx+.8,by-3.5-op-(4-Math.abs(fl-2))*.8],[X+.5,by+3.4]],'page',{lv:5});}
  g.part();g.ell(X,by+3.6,1.9,1.9,'gem',{lv:p.ey?5:4});g.px(X-16.5,by-5-op,'gold',4);g.px(X+16,by-5.6-op,'gold',4);g.px(X-16.5,by+.5-op,'gold',3);g.px(X+16,by-op,'gold',3);
  chain(g,X+2,by+6,1.3+p.tl*.3,3,2.4,.7,.5,'gold',.25);}
});

/* ---------- 虚ろの番人：宙に浮く空洞の鎧。冠・目深な兜・長い腕・裂けた外套。派生＝priest（司祭帽と鐘の杖） ----------
 y=浮き ln=傾き hF,hN=手 cl=外套の揺れ ey=目の光 hy=頭 gp=胸の光 */
defMon('boss',{W:104,H:96,AX:52,AY:88,pose:{x:0,y:-5,ln:0,hy:0,cl:0,ey:0,gp:0,hF:[-7,15],hN:[6,15],wa:1.3,br:0},
 matsOf:(P,ex)=>({v:[P.v,P.V],dk:[PX.tint(P.V,1.25),PX.tint(P.V,.5)],y:[P.y,PX.tint(P.y,.55,1.1,-12)],o:GL(P.o),p:[P.p,P.v],gp:GL(P.p),void:['#05020a','#080410','#0c0618','#100820','#180c30','#241040']}),
 draw(g,p,ex){const X=p.x,Y=p.y,ch=[X-p.ln,Y-36-p.br*.6],hip=[X,Y-17],cl=p.cl,sF=[ch[0]-11,ch[1]+2],sN=[ch[0]+11.5,ch[1]+2.5],pr=ex==='priest';
  const armB=(s,h,far)=>{const hx=s[0]+h[0],hy=s[1]+h[1],e=PX.ik(s[0],s[1],hx,hy,9.5,9.5,-1),o={bias:far?-.3:0},m=far?'dk':'v';g.limb(s[0],s[1],e[0],e[1],3.2,2.6,m,o);g.limb(e[0],e[1],hx,hy,2.6,3.2,m,o);
   g.ell(hx,hy,3.6,3.4,'p',{bias:far?-.3:.05});for(const a of[-.9,-.3,.3])g.limb(hx+Math.sin(a)*2.5,hy+2,hx+Math.sin(a)*5.5-1.5,hy+7.5,1,.4,'p',{bias:far?-.3:.1});return[hx,hy];};
  /* 外套の裾（脚はなく、裂けて漂う） */
  g.part();g.poly([[hip[0]-9,hip[1]-6],[hip[0]+9.5,hip[1]-6],[hip[0]+13+cl,Y-6],[hip[0]+9+cl*1.3,Y+3],[hip[0]+6+cl,Y-3],[hip[0]+2.5+cl*1.2,Y+5],[hip[0]-1+cl*.8,Y-2],[hip[0]-5+cl*1.1,Y+4],[hip[0]-8+cl*.6,Y-2.5],[hip[0]-12+cl*.5,Y+1],[hip[0]-12.5,Y-8]],'dk',{f:(x,y)=>.35-(x-X)*.03+((Math.round((x-X-cl*(y-hip[1])/18)*.5+40)%3)?0:-.35)});
  g.part();const hf=armB(sF,p.hF,1);
  if(pr){g.part();const[dx,dy]=dir(p.wa),tx=hf[0]+dx*20,ty=hf[1]+dy*20;g.limb(hf[0]-dx*10,hf[1]-dy*10,tx,ty,1,1,'y',{bias:.1});g.poly([[tx-4,ty+1],[tx-2.5,ty-5],[tx+2.5,ty-5],[tx+4,ty+1]],'y',{f:(x,y)=>.5-(x-tx)*.12,spec:1});g.px(tx,ty+2.5,'o',5);g.rect(tx-4.5,ty+1,9,1,'y',2);}
  /* 胴：肋骨のような胸甲と空洞 */
  g.part();g.poly([[ch[0]-11,ch[1]+2],[ch[0]-6,ch[1]-3],[ch[0]+6.5,ch[1]-3],[ch[0]+11.5,ch[1]+2.5],[hip[0]+7,hip[1]-3],[hip[0]-6.5,hip[1]-3]],'v',{f:(x,y)=>.4-(x-ch[0])*.05-(y-ch[1]-8)*.03,spec:1});
  g.ell(ch[0]-1,ch[1]+9,5.4,6,'void',{lv:2});for(let i=0;i<3;i++){g.line(ch[0]-6,ch[1]+5+i*3.2,ch[0]-1.5,ch[1]+6.5+i*3.2,'v',4);g.line(ch[0]-.5,ch[1]+6.5+i*3.2,ch[0]+4,ch[1]+5+i*3.2,'v',2);}
  g.ell(ch[0]-1,ch[1]+9,2.2,2.2,'gp',{lv:3+Math.round(p.gp)});if(p.gp>1){g.px(ch[0]-1.5,ch[1]+5.2,'gp',5);g.px(ch[0]-4.5,ch[1]+9,'gp',5);g.px(ch[0]+2,ch[1]+9,'gp',5);}
  g.rect(hip[0]-7,hip[1]-4,14,1.6,'y',3);
  /* 頭：兜の空洞に光る目＋冠 */
  g.part();const hd=[ch[0]-1.5,ch[1]-8+p.hy];
  g.poly([[hd[0]+2,hd[1]-7],[hd[0]+10,hd[1]-1],[hd[0]+8,hd[1]+6],[hd[0]+3,hd[1]+7]],'dk',{lv:2});
  g.ell(hd[0],hd[1],7.6,7.8,'v',{spec:1});g.ell(hd[0]-2,hd[1]+1.5,5,5.2,'void',{lv:1});
  g.poly([[hd[0]-7.6,hd[1]],[hd[0]-4,hd[1]-7.5],[hd[0]+2,hd[1]-8],[hd[0]-2,hd[1]-3],[hd[0]-6.5,hd[1]+2]],'v',{f:(x,y)=>.6-(x-hd[0])*.05-(y-hd[1])*.08});
  g.rect(Math.round(hd[0]-5),Math.round(hd[1]),2,2,'o',p.ey?5:4);g.rect(Math.round(hd[0]-1),Math.round(hd[1]),2,2,'o',p.ey?5:4);if(p.ey>1){g.px(hd[0]-6,hd[1]+1,'o',4);g.px(hd[0]+1.5,hd[1]+1,'o',4);}
  if(pr){g.poly([[hd[0]-6,hd[1]-6],[hd[0]-1,hd[1]-17],[hd[0]+5.5,hd[1]-6.5]],'y',{f:(x,y)=>.5-(x-hd[0])*.1,spec:1});g.rect(hd[0]-1.5,hd[1]-14,1,7,'v',2);g.rect(hd[0]-3.5,hd[1]-11,5,1,'v',2);}
  else{g.rect(hd[0]-6.5,hd[1]-7.6,13,2,'y',3);for(const i of[-6,-2,2,5.5])g.poly([[hd[0]+i-1.3,hd[1]-7.4],[hd[0]+i,hd[1]-12.5-(i===-2?1.5:0)],[hd[0]+i+1.3,hd[1]-7.4]],'y',{lv:i<0?4:3});g.px(hd[0]-2.5,hd[1]-6.8,'o',5);}
  /* 肩当てと手前の腕 */
  g.part();g.ell(sF[0]+1,sF[1]-1,5,4,'dk',{bias:0});g.part();armB(sN,p.hN,0);g.ell(sN[0]-.5,sN[1]-1.5,6,4.8,'v',{spec:1,bias:.1});g.poly([[sN[0]-3,sN[1]-5.5],[sN[0]+1,sN[1]-10.5],[sN[0]+3,sN[1]-5]],'y',{lv:3});g.poly([[sF[0]-1.5,sF[1]-4.5],[sF[0],sF[1]-9],[sF[0]+2.5,sF[1]-4.5]],'y',{lv:2});}
});
}
