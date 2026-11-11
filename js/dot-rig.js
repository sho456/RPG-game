/* ===== ver0.19 キャラクター・リグ（人型） =====
 関節位置（腰・胸・頭・手・足）をポーズ値から求め、PX のプリミティブで 1 ドットずつ描く。
 キャラクターごとに体格（B）・配色（mats）・髪／衣装／武器の描き方（関数）を持ち、
 同じ骨格でも別々のシルエットになる。向きは「左向き」が基準（敵側は左右反転して描く） */
const RIG={};
const HUM=(()=>{
const D0={x:0,y:0,cr:0,ln:0,ta:0,hx:0,hy:0,fF:[-3.5,0],fN:[3,0],hF:[-3,6],hN:[1.5,7.5],wa:1.1,wb:0,sw:0,bl:0,mo:0,ex:0,br:0,q:0,q2:0};
const B0={leg:12,tor:10,hr:6,sh:2.6,hip:1.6,arm:9.6,legR:1.9,armR:1.45,torR:3.9};
const dir=a=>[-Math.cos(a),-Math.sin(a)];
function joints(c,p){const B=c.B,ta=p.ta||0,st=Math.sin(ta),ct=Math.cos(ta),hipX=p.x,hipY=p.y-B.leg+p.cr,chX=hipX-p.ln-st*B.tor,chY=hipY-ct*B.tor+Math.abs(p.ln)*.12-p.br*.5,
  hdX=chX-1-p.ln*.3+p.hx-st*(B.hr-2),hdY=chY-ct*(B.hr-2)+p.hy,sF=[chX-B.sh,chY+2.2],sN=[chX+B.sh-.4,chY+2.4],
  aF=[p.x+p.fF[0],p.y-p.fF[1]-1.2],aN=[p.x+p.fN[0],p.y-p.fN[1]-1.2],l=B.leg/2+.25,
  kF=PX.ik(hipX-B.hip,hipY,aF[0],aF[1],l,l,1),kN=PX.ik(hipX+B.hip,hipY,aN[0],aN[1],l,l,1),a2=B.arm/2,
  eF=PX.ik(sF[0],sF[1],sF[0]+p.hF[0],sF[1]+p.hF[1],a2,a2,-1),eN=PX.ik(sN[0],sN[1],sN[0]+p.hN[0],sN[1]+p.hN[1],a2,a2,-1);
 return{hip:[hipX,hipY],ch:[chX,chY],hd:[hdX,hdY],sF,sN,kF:[kF[0],kF[1]],kN:[kN[0],kN[1]],aF:[kF[2],kF[3]],aN:[kN[2],kN[3]],eF:[eF[0],eF[1]],eN:[eN[0],eN[1]],hF:[eF[2],eF[3]],hN:[eN[2],eN[3]]};}
/* ---- 共通パーツ ---- */
function leg(g,c,hx,hy,k,a,o={}){const B=c.B,m=o.m||c.legM||'pants';g.limb(hx,hy,k[0],k[1],B.legR+.1,B.legR-.1,m);g.limb(k[0],k[1],a[0],a[1],B.legR-.2,B.legR-.5,o.shin||c.shinM||m);
 const bt=o.boot||c.bootM||'b';if(c.bootH){const t=1-c.bootH;g.limb(k[0]+(a[0]-k[0])*t,k[1]+(a[1]-k[1])*t,a[0],a[1],B.legR-.1,B.legR-.3,bt);}
 g.ell(a[0]-1.1,a[1]+.1,B.legR+.9,1.5,bt,{bias:.1});}
function arm(g,c,s,e,h,o={}){const B=c.B,m=o.m||c.armM||'coat';g.limb(s[0],s[1],e[0],e[1],B.armR+.15,B.armR,o.up||c.armUp||m);g.limb(e[0],e[1],h[0],h[1],B.armR,B.armR-.15,o.lo||c.armLo||m);
 g.ell(h[0],h[1],1.6,1.6,o.hand||c.handM||'s',{bias:.05});}
function torso(g,c,J,o={}){const B=c.B;g.limb(J.hip[0],J.hip[1]-.5,J.ch[0],J.ch[1]+2.6,B.torR-.4,B.torR+.3,o.m||c.torM||'coat');}
/* 顔：左向き3/4。目は縦2ドット、奥の目は1ドット幅 */
function face(g,c,hx,hy,p,o={}){const r=c.B.hr,sk=o.skin||'s';g.ell(hx,hy,r-.7,r-.5,sk,{bias:.12});
 const ex=Math.round(hx-1.7),ey=Math.round(hy+.4)+(o.eyeY||0),ec=o.eye||'e';
 if(p.bl||p.ex===1){g.px(ex,ey+1,ec,2);g.px(ex-3,ey+1,ec,2);if(p.ex===1){g.px(ex-1,ey,ec,2);g.px(ex-2,ey+1,ec,2);}}
 else{g.px(ex,ey,ec,3);g.px(ex,ey+1,ec,o.iris?4:3);g.px(ex-3,ey,ec,3);g.px(ex-3,ey+1,ec,o.iris?4:3);if(o.lash){g.px(ex+1,ey,ec,3);}g.tone(ex+1,ey+1,1);}
 if(p.mo||p.ex===2){g.px(ex-2,ey+4,'mouth',3);if(p.ex===2)g.px(ex-1,ey+4,'mouth',3);}
 if(o.blush){g.px(ex+1,ey+3,'blush',3);}
 g.tone(ex+3,ey+2,-1);g.tone(ex+3,ey+3,-1);}
/* 髪：頭を覆うキャップ。顔の窓（楕円）だけ空ける */
function cap(g,hx,hy,mat,o={}){const fx=hx+(o.fx==null?-2.6:o.fx),fy=hy+(o.fy==null?2.3:o.fy),frx=o.frx||4.6,fry=o.fry||4.2;
 g.ell(hx+(o.ox==null?.8:o.ox),hy+(o.oy==null?-1:o.oy),o.rx||6.4,o.ry||6,mat,{clip:(x,y)=>{const u=(x-fx)/frx,v=(y-fy)/fry;return u*u+v*v>1;},bias:o.bias||0,spec:o.spec});}
/* 武器 */
function blade(g,x,y,a,len,o={}){const[dx,dy]=dir(a),nx=-dy,ny=dx,w=o.w||1,m=o.m||'m',gd=o.guard==null?2.5:o.guard,gr=o.grip||3;
 g.limb(x-dx*gr,y-dy*gr,x+dx*1,y+dy*1,.8,.8,o.gripM||'b',{lv:2});g.ell(x-dx*(gr+.6),y-dy*(gr+.6),1.1,1.1,o.gm||'y',{lv:4});
 const bx=x+dx*1.6,by=y+dy*1.6,ex=bx+dx*len,ey=by+dy*len;
 g.poly([[bx+nx*w,by+ny*w],[ex-dx*2.4+nx*w,ey-dy*2.4+ny*w],[ex,ey],[ex-dx*2.4-nx*w,ey-dy*2.4-ny*w],[bx-nx*w,by-ny*w]],m,{f:(px,py)=>{const s=(px-bx)*nx+(py-by)*ny;return s*(nx*-.55+ny*-.66)>0?.75:.25;}});
 g.line(bx+dx,by+dy,ex-dx*2,ey-dy*2,m,5);
 if(gd)g.limb(bx-nx*gd,by-ny*gd,bx+nx*gd,by+ny*gd,.9,.9,o.gm||'y',{bias:.2});return[ex,ey];}
function staff(g,x,y,a,up,dn,m='wood'){const[dx,dy]=dir(a);g.limb(x-dx*dn,y-dy*dn,x+dx*up,y+dy*up,.75,.75,m,{bias:.1});return[x+dx*up,y+dy*up];}

/* 連なった房（ポニーテール・尾・布の端など）。a=向き（画面座標のラジアン）, curl=1節ごとの曲がり */
function chain(g,x,y,a,n,seg,r0,r1,mat,curl=0,o){let px=x,py=y;for(let i=0;i<n;i++){const aa=a+curl*i,nx=px+Math.cos(aa)*seg,ny=py+Math.sin(aa)*seg;g.limb(px,py,nx,ny,r0+(r1-r0)*i/n,r0+(r1-r0)*(i+1)/n,mat,o);px=nx;py=ny;}return[px,py];}
/* 裾の長い衣（ローブ・スカート・袴）。足の開きと揺れに追従し、縦のひだを入れる */
function robe(g,J,p,mat,o={}){const[hx,hy]=J.hip,top=o.top||3.6,hem=o.hem||6,y1=p.y-(o.clear==null?1.2:o.clear),s=p.sw*(o.sway==null?1:o.sway),L=y1-hy,xl=hx-hem+Math.min(0,J.aF[0]-p.x+3.5)*.7+s*.4,xr=hx+hem+Math.max(0,J.aN[0]-p.x-3)*.7+s;
 g.poly([[hx-top,hy-2],[hx+top,hy-2],[xr,y1],[(xl+xr)/2,y1+(o.dip||0)],[xl,y1]],mat,{f:(x,y)=>{const t=(y-hy)/L,xx=x-hx-s*t;return .42-xx*.1+((Math.round(xx*(o.fold||.55)+60)%2)?0:-.3*t)+(o.b||0);},max:o.max||4});
 if(o.trim)for(let x=Math.ceil(xl);x<xr;x++)g.tone(x,y1-1,o.trimD||1,mat);}
function draw(g,pose,c){const p=Object.assign({},D0,c.pose,pose),J=joints(c,p);J.p=p;
 for(const k in c.mats){const v=c.mats[k];if(Array.isArray(v)){if(v.length===6)g.def(k,v,null,v.glow);else g.def(k,v[0],v[1],v[2]);}else g.def(k,v);}
 if(c.back){g.part();c.back(g,J,p,c);}
 g.part();if(c.armF)c.armF(g,J,p,c);else arm(g,c,J.sF,J.eF,J.hF,c.armFo);
 if(c.itemF&&!c.itemFront){g.part();c.itemF(g,J,p,c);}
 if(!c.noLegs){g.part();leg(g,c,J.hip[0]-c.B.hip,J.hip[1],J.kF,J.aF);g.part();leg(g,c,J.hip[0]+c.B.hip,J.hip[1],J.kN,J.aN);}
 g.part();if(c.torso)c.torso(g,J,p,c);else torso(g,c,J);
 if(c.skirt){g.part();c.skirt(g,J,p,c);}
 if(c.over){c.over(g,J,p,c);}
 g.part();c.head(g,J,p,c);
 if(c.itemN&&c.itemNBack){g.part();c.itemN(g,J,p,c);}
 g.part();if(c.armN)c.armN(g,J,p,c);else arm(g,c,J.sN,J.eN,J.hN,c.armNo);
 if(c.itemN&&!c.itemNBack){g.part();c.itemN(g,J,p,c);}
 if(c.itemF&&c.itemFront){g.part();c.itemF(g,J,p,c);}
 if(c.front){g.part(1);c.front(g,J,p,c);}
 return J;}
return{D0,B0,dir,joints,leg,arm,torso,face,cap,blade,staff,chain,robe,draw};})();

/* ---- フレーム生成とキャッシュ ----
 SPRX.frame(リグ名, ポーズ, 配色キー, 配色, 反転, 倍率) → {cv,w,h,ax,ay}
 ポーズ値は描画前に丸め、同じ見た目は必ず同じキャッシュを引く（毎フレーム描き直さない） */
const SPRX=(()=>{
const cache=new Map(),bufs={};let made=0;const MAX=1400;
const q=v=>Math.round(v*2)/2;
function keyOf(p){let s='';for(const k in p){const v=p[k];s+=k+(Array.isArray(v)?q(v[0])+','+q(v[1]):typeof v==='number'?(k==='wa'||k==='wb'||k[0]==='r'?Math.round(v*12)/12:q(v)):v)+';';}return s;}
function norm(p){const o={};for(const k in p){const v=p[k];o[k]=Array.isArray(v)?[q(v[0]),q(v[1])]:typeof v==='number'?(k==='wa'||k==='wb'||k[0]==='r'?Math.round(v*12)/12:q(v)):v;}return o;}
function frame(name,pose,palKey,pal,flip,sc=1,extra=''){const R=RIG[name];if(!R)return null;const key=name+'|'+palKey+'|'+(flip?1:0)+'|'+sc+'|'+extra+'|'+keyOf(pose);let f=cache.get(key);if(f){f.use=made;return f;}
 const w=Math.ceil(R.W*sc),h=Math.ceil(R.H*sc),bk=w+'x'+h,b=bufs[bk]||(bufs[bk]=new PX.Buf(w,h)),ax=Math.round((flip?R.W-R.AX:R.AX)*sc),ay=Math.round(R.AY*sc);
 b.reset(ax,ay,sc,flip?-1:1);b.dith=R.dith?1:0;R.paint(b,norm(pose),pal||{},extra);
 f={cv:b.render(),w,h,ax,ay,use:++made};cache.set(key,f);
 if(cache.size>MAX){const arr=[...cache.entries()].sort((a,b)=>a[1].use-b[1].use);for(let i=0;i<MAX*.3;i++)cache.delete(arr[i][0]);}
 return f;}
const white=f=>f.wh||(f.wh=PX.whiteOf(f.cv));
/* スプライトのキー（敵の種類・仲間のid＋_aw）から、対応するリグと配色を引く */
const BASE=new Map();
function info(key){let d=DOT.info[key];if(!d){DOT.snap(key);d=DOT.info[key];}if(!d&&/^vo_/.test(key)&&SPR[key]&&typeof greyPal==='function')d=DOT.info[key]={rows:SPR[key],pal:greyPal(SPR[key])};if(!d)return null;const base=BASE.get(d.rows);return base?{rig:base,pal:d.pal}:null;}
function reg(name){if(SPR[name])BASE.set(SPR[name],name);}
return{frame,white,info,reg,BASE,cache,stat:()=>({frames:cache.size,made})};})();
/* 人型リグを登録する */
function defHum(name,spec){const c=Object.assign({W:72,H:64,AX:40,AY:59,type:'hum'},spec);c.B=Object.assign({},HUM.B0,spec.B);
 c.paint=function(g,pose,over,extra){const P=Object.assign({},PAL,this.pal0,over);const cc=Object.create(this);cc.mats=this.matsOf(P);cc.P=P;cc.extra=extra||'';HUM.draw(g,pose,cc);};RIG[name]=c;SPRX.reg(name);return c;}
