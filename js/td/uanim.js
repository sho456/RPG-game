/* ===== TD：味方の状態ごとのコマ送り（TDA。素材パック assets_src/chars の anims を引く） =====
 状態→アニメ名：待機 idle・歩き walk・通常攻撃 atk・技 cast・被弾 hurt・倒れ down・星臨に入る aw_in。
 星臨中は aw_idle/aw_walk/aw_atk/aw_cast があればそれ、無ければ通常のアニメを 'aw' の色（palAw があれば）で。
 アニメが無い仲間は drawUnit が従来の 1 枚絵（TDA.draw が false を返す）。
 ドットはにじませない：補間なし・1 ドット＝画面上の整数画素（S*DPR を見て、使うサイズと整数倍 n を選ぶ）。
 本番コマ（walk/atk/cast/hurt/down）：assets_src/pixel-art/celes-hd/import_pl.py。待機・aw_in は仮。差し替えは assets_src/chars/<id>/anim/<名>/ と character.json の ms・hit。 */
const TDA=(()=>{
const AN={celes:'celes_hd'};/* 仲間 id → 素材パックの id */
const HGT={celes:72};/* 表示の背丈（論理 px。敵は雑魚 40・ボス 76、既定の仲間 60） */
const D=()=>SPX.D;
const A=(id,n)=>{const d=D()[id];return d&&d.anims&&d.anims[n];};
const tot=a=>a.tot||(a.tot=a.ms.reduce((x,y)=>x+y,0)||1);
const has=u=>!!AN[u]&&SPX.ready&&!!D()[AN[u]];
function state(u,id,T){const aw=u.awT>0,pick=n=>{if(aw&&A(id,'aw_'+n))return{n:'aw_'+n,v:''};return A(id,n)?{n,v:aw?'aw':''}:null;};
 if(u.actK==='aw'){const a=A(id,'aw_in');if(a&&T-u.actT<tot(a)/1000)return{n:'aw_in',v:'aw',t0:u.actT};}
 {const a=A(id,'hurt');if(a&&T-(u.hitT||-9)<tot(a)/1000)return{n:'hurt',v:aw?'aw':'',t0:u.hitT};}
 if(u.actK==='atk'||u.actK==='cast'){const p=pick(u.actK);if(p&&T-u.actT<tot(A(id,p.n))/1000)return Object.assign(p,{t0:u.actT});}
 return Object.assign(pick(u.mv?'walk':'idle')||pick('idle')||{n:'idle',v:''},{loop:1});}
function frame(id,s,T,uid){const a=A(id,s.n);if(!a)return null;const t=tot(a);let ms=s.loop?(T*1000+uid*137)%t:Math.max(0,(T-s.t0)*1000);let acc=0;
 for(let i=0;i<a.f.length;i++){acc+=a.ms[i]||0;if(ms<acc)return a.f[i];}return a.f[a.f.length-1];}
/* 整数倍で描く：目標の高さ（画面の画素）にいちばん近い「サイズ × 整数倍」を選ぶ */
function size(id,Ht){let best=null,be=9;const S=D()[id].sizes;for(const sk in S){if(sk[0]!=='b')continue;const d=S[sk].dots,n=Math.max(1,Math.round(Ht/d)),e=Math.abs(n*d-Ht)/Ht-d*1e-5;if(e<be){be=e;best={sk,n};}}return best;}
function put(g,id,v,name,face,x,y,hgt,fl,alpha){const m=g.getTransform(),k=m.a,z=size(id,hgt*k);if(!z)return false;
 const c=D()[id],f=SPX.cut(id,z.sk,v,name,(face>0)!==(c.face==='R'),0,0);if(!f)return false;
 g.save();g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;g.globalAlpha=alpha;if(fl&&'filter'in g)g.filter='brightness(2.4)';
 g.drawImage(f.cv,Math.round(m.e+x*k-(f.ax+.5)*z.n),Math.round(m.f+y*k-(f.ay+1)*z.n),f.w*z.n,f.h*z.n);g.restore();return true;}
const ghosts=[];
return{has,hgt:(u,d)=>HGT[u]||d,
 draw(g,u,x,y,fl,alpha,st){if(!has(u.id))return false;const id=AN[u.id],s=state(u,id,st.t),n=frame(id,s,st.t,u.uid);return n?put(g,id,s.v,n,u.face,x,y,HGT[u.id],fl,alpha):false;},
 fall(u,st){if(has(u.id)&&A(AN[u.id],'down'))ghosts.push({id:u.id,x:u.x+(u.ox||0),y:u.y,face:u.face,t0:st.t});},
 drawGhosts(g,st){for(let i=ghosts.length-1;i>=0;i--){const o=ghosts[i],T=st.t-o.t0;if(T<0||T>1.8){ghosts.splice(i,1);continue;}
  const id=AN[o.id];put(g,id,'',frame(id,{n:'down',t0:o.t0},st.t,0),o.face,o.x,o.y,HGT[o.id],0,Math.min(1,(1.8-T)/.6));}},
 clear(){ghosts.length=0;}};})();
