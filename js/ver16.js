/* ===== ver0.16 音と絵：エリア別BGM・星臨BGM切替・戦闘キャラ48×48ドット・ボスの部位破壊演出 ===== */

/* ---------- 1. 戦闘キャラの高解像度ドット（48×48／ボスは64×64） ----------
 元の16×16ドットをScale3x（ボスはScale2x×2）で描き起こし、
 輪郭線・陰影（右下に影／左上にハイライト）・上下グラデーションを付けて描き直す */
const HI=new WeakMap();
function sc3(a,w){const W3=w*3,o=new Uint32Array(W3*W3),P=(x,y)=>a[Math.min(w-1,Math.max(0,y))*w+Math.min(w-1,Math.max(0,x))];
 for(let y=0;y<w;y++)for(let x=0;x<w;x++){const A=P(x-1,y-1),B=P(x,y-1),C=P(x+1,y-1),D=P(x-1,y),E=P(x,y),F=P(x+1,y),G=P(x-1,y+1),H=P(x,y+1),I=P(x+1,y+1);
  let e=[E,E,E,E,E,E,E,E,E];
  if(B!==H&&D!==F)e=[D===B?D:E,(D===B&&E!==C)||(B===F&&E!==A)?B:E,B===F?F:E,(D===B&&E!==G)||(D===H&&E!==A)?D:E,E,(B===F&&E!==I)||(H===F&&E!==C)?F:E,D===H?D:E,(D===H&&E!==I)||(H===F&&E!==G)?H:E,H===F?F:E];
  for(let j=0;j<3;j++)for(let i=0;i<3;i++)o[(y*3+j)*W3+x*3+i]=e[j*3+i];}return o;}
function sc2(a,w){const W2=w*2,o=new Uint32Array(W2*W2),P=(x,y)=>a[Math.min(w-1,Math.max(0,y))*w+Math.min(w-1,Math.max(0,x))];
 for(let y=0;y<w;y++)for(let x=0;x<w;x++){const B=P(x,y-1),D=P(x-1,y),E=P(x,y),F=P(x+1,y),H=P(x,y+1);let e=[E,E,E,E];
  if(B!==H&&D!==F)e=[D===B?D:E,B===F?F:E,D===H?D:E,H===F?F:E];o[y*2*W2+x*2]=e[0];o[y*2*W2+x*2+1]=e[1];o[(y*2+1)*W2+x*2]=e[2];o[(y*2+1)*W2+x*2+1]=e[3];}return o;}
function shadeHi(p,w){const q=new Uint32Array(p.buffer.slice(0)),op=(x,y)=>x>=0&&y>=0&&x<w&&y<w&&(q[y*w+x]>>>24)>20,cl=(x,y)=>op(x,y)?q[y*w+x]:0;
 const put=(k,src,f)=>{const s=k*4;p[s]=Math.min(255,((src)&255)*f);p[s+1]=Math.min(255,((src>>>8)&255)*f);p[s+2]=Math.min(255,((src>>>16)&255)*f);p[s+3]=255;};
 for(let y=0;y<w;y++)for(let x=0;x<w;x++){const k=y*w+x,c=q[k];
  if(!op(x,y)){let nb=0;for(const[dx,dy]of[[0,1],[1,0],[0,-1],[-1,0]])if(op(x+dx,y+dy)){nb=q[(y+dy)*w+x+dx];break;}if(nb)put(k,nb,.26);continue;}
  const dn=cl(x,y+1),rt=cl(x+1,y),up=cl(x,y-1),lf=cl(x-1,y);let f=1;
  if(!dn||!rt)f=.68;else if(dn!==c||rt!==c)f=.84;else if(!up||!lf)f=1.28;else if(up!==c||lf!==c)f=1.13;
  put(k,c,f*(1.1-.2*y/w));}}
function hiImg(src,N,shade){if(!src||!src.getContext||src.width!==16)return src;let m=HI.get(src);if(!m){m={};HI.set(src,m);}const key=N+(shade?'s':'');if(m[key])return m[key];
 const id=src.getContext('2d').getImageData(0,0,16,16);let a=new Uint32Array(id.data.buffer.slice(0)),w=16;
 if(N===48){a=sc3(a,16);w=48;}else{a=sc2(sc2(a,16),32);w=64;}
 const c=document.createElement('canvas');c.width=c.height=w;const g=c.getContext('2d'),out=g.createImageData(w,w);new Uint32Array(out.data.buffer).set(a);if(shade)shadeHi(out.data,w);g.putImageData(out,0,0);return m[key]=c;}
const hiN=u=>u.side===1&&u.boss?64:48;
function whiteOf(src){const c=document.createElement('canvas');c.width=src.width;c.height=src.height;const g=c.getContext('2d');g.drawImage(src,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#ffffff';g.fillRect(0,0,c.width,c.height);return c;}
drawUnit=function(u){
 if(!u.alive&&u.side===1){if(u.fade<=0)return;u.fade--;ctx.globalAlpha=u.fade/24;}
 const fl=u.flash>0,src=IMG[fl?u.spr+'_w':sprKey(u)];if(u.flash>0)u.flash--;
 let img=u._hi?(fl?u._hiW:u._hi):hiImg(src,hiN(u),!fl);
 u.ox+=(u.tox-u.ox)*.18;const s=16*u.sc;let x=u.x+Math.round(u.ox),y=u.y;
 if(u.side===1&&u.alive)y+=Math.round(Math.sin(tick/20+u.x)*1);
 if(u.side===1&&u.broken){x+=Math.sin(tick/3)>0?1:0;}
 ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(x+s*.2,y+s-2,s*.6,2);
 if(u.side===0&&!u.alive){ctx.globalAlpha=.55;ctx.save();ctx.translate(x+s/2,y+s-4);ctx.rotate(-Math.PI/2);ctx.drawImage(img,-s/2,-s/2+4,s,s);ctx.restore();ctx.globalAlpha=1;return;}
 if(u.side&&ED[u.kind]&&ED[u.kind].flip){ctx.save();ctx.translate(x+s,y);ctx.scale(-1,1);ctx.drawImage(img,0,0,s,s);ctx.restore();}else ctx.drawImage(img,x,y,s,s);ctx.globalAlpha=1;
 if(u.aw&&Math.random()<.25+.2*(u.awLv||1))B.parts.push({x:x+4+Math.random()*(s-8),y:y+s-4,vy:-.4-Math.random()*.5*(u.awLv||1),l:30,c:(u.awLv||1)>=3&&Math.random()<.4?'#ffffff':(u.awLv||1)>=2&&Math.random()<.3?'#7fd6ff':'#ffe27a'});
 if(B.cur===u&&u.side===0){ctx.fillStyle='#f3c64b';const ax=x+s/2,ay=y-4+(tick>>4)%2;ctx.fillRect(ax-2,ay,5,1);ctx.fillRect(ax-1,ay+1,3,1);ctx.fillRect(ax,ay+2,1,1);}};
/* 戦闘中だけキャンバスを端末の実解像度で描く（48ドットを潰さないため） */
const bK=()=>Math.max(2,Math.min(6,Math.round(SC*(window.devicePixelRatio||1))));
{const _draw=draw;draw=function(){const k=scene==='battle'?bK():1;if(cv.width!==W*k||cv.height!==H*k){cv.width=W*k;cv.height=H*k;}
 ctx.setTransform(k,0,0,k,0,0);ctx.imageSmoothingEnabled=false;_draw();if(scene==='battle'&&B&&B.deb&&B.deb.length)drawDeb();};}

/* ---------- 2. ボスの部位破壊演出 ----------
 ボスをブレイクするたびに部位（頭部→右腕→左腕）が1つずつ砕ける。
 砕けた部位はドットが欠け、破片が飛び散る。部位1つにつき攻撃・魔力-10% */
const PARTS=[['頭部',[.22,0,.78,.36]],['右腕',[0,.3,.34,.78]],['左腕',[.66,.3,1,.78]]];
function drawDeb(){ctx.save();B.deb=B.deb.filter(d=>{d.x+=d.vx;d.y+=d.vy;d.vy+=.11;d.l--;if(d.y>d.fy&&d.vy>0){d.y=d.fy;d.vy*=-.3;d.vx*=.55;}
 ctx.globalAlpha=Math.min(1,d.l/18);ctx.fillStyle=d.c;ctx.fillRect(d.x,d.y,d.z,d.z);return d.l>0;});ctx.restore();}
function sfxPart(){if(!AC)return;tone(90,.4,'sawtooth',.09,30);setTimeout(()=>tone(1500,.08,'square',.04,300),40);setTimeout(()=>tone(700,.12,'square',.04,120),140);noiseHit(.25,.12,600);}
function noiseHit(d,v,hp){if(!AC)return;const t=AC.currentTime,s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=noiseBuf();f.type='highpass';f.frequency.value=hp;
 g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0008,t+d);s.connect(f).connect(g).connect(AC.destination);s.start(t);s.stop(t+d+.02);}
async function partBreak(e){const i=e.pb||0;if(i>=PARTS.length)return;e.pb=i+1;const N=hiN(e),[pn,fr]=PARTS[i];
 if(!e._hi){const c=document.createElement('canvas');c.width=c.height=N;c.getContext('2d').drawImage(hiImg(IMG[sprKey(e)],N,true),0,0);e._hi=c;}
 const bb=bbox(e.spr),f=N/16,bx=bb.x*f,by=bb.y*f,bw=bb.w*f,bh=bb.h*f,x0=Math.round(bx+fr[0]*bw),y0=Math.round(by+fr[1]*bh),x1=Math.round(bx+fr[2]*bw),y1=Math.round(by+fr[3]*bh);
 const g=e._hi.getContext('2d'),id=g.getImageData(0,0,N,N),p=id.data,R=rng(e.kind.length*31+i*7+e.lv),cx=(x0+x1)/2,cy=(y0+y1)/2,rad=Math.max(1,Math.max(x1-x0,y1-y0)/2);
 const s=16*e.sc,ds=s/N,flip=ED[e.kind]&&ED[e.kind].flip,deb=B.deb||(B.deb=[]),gone=new Uint8Array(N*N);
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const k=(y*N+x)*4;if(p[k+3]<20)continue;const dd=Math.hypot(x-cx,y-cy)/rad+R()*.45-Math.abs(Math.sin(x*1.7+y*.9))*.25;
  if(dd<.85){if(R()<.3&&deb.length<160){const sx=e.x+(flip?N-1-x:x)*ds,sy=e.y+y*ds;deb.push({x:sx,y:sy,vx:(sx-(e.x+s/2))*.035+(R()-.5)*1.4,vy:-1.1-R()*1.8,l:55+R()*35|0,fy:e.y+s-3+R()*12,c:`rgb(${p[k]},${p[k+1]},${p[k+2]})`,z:ds*(R()<.4?3:2)});}
   p[k+3]=0;gone[y*N+x]=1;}}
 for(let y=Math.max(0,y0-2);y<Math.min(N,y1+2);y++)for(let x=Math.max(0,x0-2);x<Math.min(N,x1+2);x++){const k=(y*N+x)*4;if(p[k+3]<20)continue;
  let near=false;for(let dy=-2;dy<=2&&!near;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<N&&yy<N&&gone[yy*N+xx]){near=true;break;}}
  if(near){const hot=R()<.25;p[k]=hot?255:p[k]*.42;p[k+1]=hot?150:p[k+1]*.38;p[k+2]=hot?60:p[k+2]*.42;}}
 g.putImageData(id,0,0);e._hiW=whiteOf(e._hi);
 e.atk=Math.round(e.atk*.9);e.mag=Math.round(e.mag*.9);
 const pcx=e.x+(flip?N-cx:cx)*ds,pcy=e.y+cy*ds;for(let r=0;r<3;r++)B.fx.push({x:pcx,y:pcy,t:-r*3,m:true,c:r?'#ffd080':'#ff7a30'});
 B.shake=20;B.flashBg=12;B.flashCol='#ffb070';sfxPart();
 const el=document.createElement('div');el.className='pbrk';el.innerHTML=`部位破壊！<small>${e.name}の${pn}が砕けた　攻撃・魔力-10%</small>`;$('#stage').appendChild(el);setTimeout(()=>el.remove(),1500);
 pop(e,pn+'破壊','#ffb070',true);log(`<b>部位破壊！</b> ${e.name}の${pn}が砕け散った（攻撃・魔力-10%　${e.pb}/${PARTS.length}）`);await wait(650);}
{const _db=doBreak;doBreak=async function(t,a){const go=t&&t.side===1&&t.boss&&(t.pb||0)<PARTS.length;await _db(t,a);if(go&&t.alive&&B&&!B.over)await partBreak(t);};}
{const _st=stTags;stTags=function(u){const t=_st(u);if(u.side===1&&u.boss&&u.pb)t.push(['破壊'+u.pb+'/'+PARTS.length,'bk']);return t;};}

/* ---------- 3. BGM（Web Audioで即時生成するチップチューン） ----------
 拠点／フィールド（エリア別・虚蝕化は変調）／通常戦闘／ボス戦／ラスボス／星臨中／勝利 */
let NB=null;function noiseBuf(){if(NB)return NB;NB=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return NB;}
const PWV={};function pulseW(d){if(PWV[d])return PWV[d];const n=40,re=new Float32Array(n),im=new Float32Array(n);for(let i=1;i<n;i++)re[i]=2/(i*Math.PI)*Math.sin(i*Math.PI*d);return PWV[d]=AC.createPeriodicWave(re,im);}
const SCL={maj:[0,2,4,5,7,9,11],min:[0,2,3,5,7,8,10],dor:[0,2,3,5,7,9,10],phr:[0,1,3,5,7,8,10],hm:[0,2,3,5,7,8,11],lyd:[0,2,4,6,7,9,11]};
const STY={
 calm:{K:'',S:'',Hh:'',bass:'half',arp:'up8',lw:.25,ld:[.5,.25,0]},
 town:{K:'x.......x.......',S:'',Hh:'....x.......x...',bass:'quarter',arp:'up8',lw:.25,ld:[.6,.35,.05]},
 field:{K:'x.......x.......',S:'........x.......',Hh:'x.x.x.x.x.x.x.x.',bass:'rf8',arp:'up8',lw:.25,ld:[.7,.4,.08]},
 dungeon:{K:'x...........x...',S:'',Hh:'........x.......',bass:'whole',arp:'broken',lw:.125,ld:[.45,.15,0]},
 battle:{K:'x.....x.x.......',S:'....x.......x...',Hh:'x.x.x.x.x.x.x.x.',bass:'oct8',arp:'a16',lw:.5,ld:[.8,.5,.15]},
 boss:{K:'x..x..x.x..x..x.',S:'....x.......x..x',Hh:'x.xxx.xxx.xxx.xx',bass:'oct16',arp:'a16',lw:.25,ld:[.7,.3,.05],dbl:1},
 awaken:{K:'x...x...x...x...',S:'....x.......x.x.',Hh:'xxxxxxxxxxxxxxxx',bass:'oct8',arp:'a16',lw:.5,ld:[.85,.55,.2],dbl:1},
 win:{K:'x.......x.......',S:'....x.......x...',Hh:'x.x.x.x.x.x.x.x.',bass:'rf8',arp:'up8',lw:.5,ld:[.8,.5,.1]}};
const SONGS={title:['calm',78,57,'min',[0,5,3,4],[5,3,0,4]],town:['town',100,60,'maj',[0,3,4,0],[5,3,1,4]],win:['win',132,60,'maj',[0,3,4,0],[3,4,0,0]],
 battle:['battle',152,64,'min',[0,5,3,4],[0,6,5,4]],boss:['boss',140,62,'hm',[0,1,0,4],[5,1,4,4]],lastboss:['boss',156,57,'hm',[0,5,1,4],[0,1,5,4]],awaken:['awaken',166,64,'maj',[3,4,0,5],[3,4,0,0]],
 'f:haido':['field',112,62,'dor',[0,3,6,0],[2,3,4,4]],'f:midori':['field',98,65,'maj',[0,4,5,3],[3,4,0,0]],'f:seido':['dungeon',76,62,'hm',[0,5,3,4],[0,3,4,4]],
 'f:raimei':['field',126,64,'min',[0,5,6,4],[3,4,5,6]],'f:kouka':['calm',92,61,'min',[0,3,5,4],[5,6,0,0]],'f:ouito':['dungeon',84,63,'dor',[0,1,3,0],[5,3,4,4]],
 'f:tower':['field',110,67,'lyd',[0,1,0,4],[5,3,1,4]],'f:zankyo':['dungeon',72,58,'phr',[0,1,0,6],[5,6,1,0]],'f:kairou':['dungeon',92,57,'hm',[0,5,1,4],[0,3,5,4]],'f:ryuu':['field',118,59,'phr',[0,1,6,0],[5,6,0,1]]};
const BGMN={title:'タイトル',town:'灯都（拠点）',battle:'通常戦闘',boss:'ボス戦',lastboss:'ラストボス',awaken:'星臨中',win:'勝利','f:haido':'灰の街道','f:midori':'翠の森','f:seido':'祈りの廃聖堂',
 'f:raimei':'雷鳴高原','f:kouka':'東方の島','f:ouito':'沈んだ王都','f:tower':'天への塔','f:zankyo':'星核の残響','f:kairou':'虚の回廊','f:ryuu':'竜の巣','v:haido':'虚蝕化エリア（灰の街道）'};
const BP={whole:()=>[[0,0,16,0]],half:()=>[[0,0,8,0],[8,4,8,0]],quarter:()=>[[0,0,4,0],[4,0,4,0],[8,4,4,0],[12,0,4,0]],
 rf8:()=>[...Array(8)].map((_,i)=>[i*2,i%2?4:0,2,0]),oct8:()=>[...Array(8)].map((_,i)=>[i*2,0,2,i%2]),oct16:()=>[...Array(16)].map((_,i)=>[i,0,1,i%2])};
const AP={up8:()=>[...Array(8)].map((_,i)=>[i*2,i%4,2]),a16:()=>[...Array(16)].map((_,i)=>[i,[0,1,2,3,2,1][i%6],1]),broken:()=>[0,1,2,3].map(i=>[i*4,[0,2,1,2][i],4])};
const hs=s=>[...s].reduce((a,c)=>Math.imul(a^c.charCodeAt(0),16777619)>>>0,2166136261);
const SONGC={};
function compose(key){if(SONGC[key])return SONGC[key];const v=key.startsWith('v:'),fk=v?'f:'+key.slice(2):key,b=SONGS[fk]||SONGS[fk.startsWith('f:')?'f:haido':'town'];
 let[sty,bpm,root,mode,PA,PB]=b;if(v){bpm=Math.round(bpm*.82);root-=1;mode='phr';}
 const S=STY[sty],sc=SCL[mode],R=rng(hs(fk)),mi=(dg,o=0)=>root+12*(Math.floor(dg/7)+o)+sc[((dg%7)+7)%7],near=(x,a)=>a.reduce((p,q)=>Math.abs(q-x)<Math.abs(p-x)?q:p);
 const sec=prog=>{const o=Array.from({length:prog.length*16},()=>[]);let cur=7;
  prog.forEach((c,bi)=>{const b0=bi*16,last=bi===prog.length-1,bo=root>=60?-2:-1,ch=[c,c+2,c+4,c+7];
   BP[S.bass]().forEach(([s,dg,l,oc])=>o[b0+s].push([0,mi(c+dg,bo+oc),l]));
   AP[S.arp]().forEach(([s,i,l])=>o[b0+s].push([1,mi(ch[i],0),l]));
   for(let s=0;s<16;s++){if(S.K[s]==='x')o[b0+s].push([3]);if(S.S[s]==='x')o[b0+s].push([4]);if(S.Hh[s]==='x')o[b0+s].push([5]);}
   const on=[];for(let s=0;s<16;s++){const p=last?(s===0||s===4||s===8?1:0):s%8===0?.95:s%4===0?S.ld[0]:s%2===0?S.ld[1]:S.ld[2];if(R()<p)on.push(s);}
   on.forEach((s,j)=>{const end=last&&j===on.length-1,nx=j+1<on.length?on[j+1]:16,l=Math.min(end?8:6,nx-s);
    if(end)cur=near(cur,[c,c+7,c-7]);else if(s%4===0)cur=near(cur+(R()<.5?-1:1)*(R()<.3?2:0),[c,c+2,c+4,c+7,c+9,c+11,c-3,c-5]);else cur+=[-1,1,-1,1,-2,2,0][R()*7|0];
    cur=Math.max(3,Math.min(12,cur));o[b0+s].push([2,mi(cur,0),l]);});});return o;};
 const A=sec(PA),Bs=sec(PB);return SONGC[key]={key,bpm,S,ev:[...A,...A,...Bs,...A]};}
const BGM={on:true,key:null,s:null,force:null};try{BGM.on=localStorage.getItem('astral_bgm')!=='0';}catch(e){}
const BGV=.32,mf=m=>440*Math.pow(2,(m-69)/12);
function bv(t,m,dur,wv,v,g){const o=AC.createOscillator(),e=AC.createGain();if(typeof wv==='number')o.setPeriodicWave(pulseW(wv));else o.type=wv;o.frequency.value=mf(m);
 e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(v,t+.006);e.gain.setValueAtTime(v,t+dur*.7);e.gain.linearRampToValueAtTime(0,t+dur*.98);o.connect(e).connect(g);o.start(t);o.stop(t+dur+.03);}
function bd(t,k,g){if(k===3){const o=AC.createOscillator(),e=AC.createGain();o.type='sine';o.frequency.setValueAtTime(160,t);o.frequency.exponentialRampToValueAtTime(42,t+.11);e.gain.setValueAtTime(.42,t);e.gain.exponentialRampToValueAtTime(.001,t+.15);o.connect(e).connect(g);o.start(t);o.stop(t+.17);return;}
 const s=AC.createBufferSource(),f=AC.createBiquadFilter(),e=AC.createGain(),d=k===4?.12:.035;s.buffer=noiseBuf();f.type='highpass';f.frequency.value=k===4?1400:7000;
 e.gain.setValueAtTime(k===4?.14:.05,t);e.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(f).connect(e).connect(g);s.start(t,Math.random()*.5);s.stop(t+d+.02);}
function bgmStep(s,i,t){const so=s.song,S=so.S,dt=60/so.bpm/4;for(const e of so.ev[i]){const k=e[0];
 if(k===0)bv(t,e[1],e[2]*dt,'triangle',.18,s.g);else if(k===1)bv(t,e[1],e[2]*dt,.125,.04,s.g);else if(k===2){bv(t,e[1],e[2]*dt,S.lw,.1,s.g);if(S.dbl)bv(t,e[1]-12,e[2]*dt,.125,.045,s.g);}else bd(t,k,s.g);}}
function bgmPlay(key){if(BGM.key===key&&(BGM.s||!key))return;if(!AC)return;BGM.key=key;const now=AC.currentTime;
 if(BGM.s){const o=BGM.s;o.g.gain.cancelScheduledValues(now);o.g.gain.setValueAtTime(o.g.gain.value,now);o.g.gain.linearRampToValueAtTime(0,now+.35);setTimeout(()=>{try{o.g.disconnect();}catch(e){}},1200);}BGM.s=null;
 if(!key||!BGM.on)return;const g=AC.createGain();g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(BGV,now+.5);g.connect(AC.destination);BGM.s={song:compose(key),g,step:0,t:now+.06};}
function bgmWant(){if(BGM.force)return BGM.force;if(scene==='title')return'title';
 if(scene==='battle'&&B){if(B.over)return aliveE().length?null:'win';if(B.heroes.some(h=>h.aw))return'awaken';if(B.opts.stages)return'lastboss';if(B.enemies.some(e=>e.boss))return'boss';return'battle';}
 if(scene==='field'&&typeof AREA==='string')return(typeof VOIDED!=='undefined'&&VOIDED?'v:':'f:')+AREA;return'town';}
function bgmTick(){if(!AC||AC.state!=='running')return;const w=BGM.on?bgmWant():null;if(w!==BGM.key)bgmPlay(w);const s=BGM.s;if(!s)return;const dt=60/s.song.bpm/4;
 if(s.t<AC.currentTime-.3)s.t=AC.currentTime+.05;while(s.t<AC.currentTime+.22){bgmStep(s,s.step,s.t);s.step=(s.step+1)%s.song.ev.length;s.t+=dt;}}
setInterval(()=>{try{bgmTick();}catch(e){}},50);
addEventListener('pointerdown',()=>au(),true);
function bgmToggle(){BGM.on=!BGM.on;try{localStorage.setItem('astral_bgm',BGM.on?'1':'0');}catch(e){}if(!BGM.on)bgmPlay(null);else BGM.key=undefined;bgmLab();}
function bgmLab(){document.querySelectorAll('.bgmB').forEach(b=>{b.textContent=BGM.on?'♪ON':'♪OFF';b.classList.toggle('on',BGM.on);});}
{const t=$('#top'),b=document.createElement('button');b.className='tb bgmB';b.onclick=()=>{SFX.sel();bgmToggle();};t.insertBefore(b,$('#spd'));bgmLab();}
/* タイトル：TAP TO START（iOSは最初のタップまで音が出ない）＋BGM切替 */
function deco16(){const f=document.querySelector('#ov .tfoot');if(!f||f.querySelector('.bgmB'))return;const b=document.createElement('button');b.className='bgmB';b.onclick=()=>{bgmToggle();};f.insertBefore(b,f.firstChild);
 const tp=document.createElement('div');tp.id='ttap';tp.textContent='TAP TO START';$('#ov').appendChild(tp);bgmLab();const v=$('#verL');if(v)v.textContent='ver0.16';}
{const _t=title;title=function(){_t();deco16();};}
if(scene==='title')deco16();
setInterval(()=>{const t=$('#ttap');if(t)t.style.display=AC&&AC.state==='running'?'none':'';},300);

/* ---------- 開発者メニュー ---------- */
function dev16(m){BGM.force=null;log((m||'<b>ver0.16 音と絵</b>')+`<br><small>BGM：${BGM.on?'ON':'OFF'}　再生中：${BGMN[BGM.key]||BGM.key||'なし'}</small>`);
 menu([{l:'BGMを試聴する',cls:'ready',s:'エリア別・戦闘・星臨など全'+Object.keys(BGMN).length+'曲',f:()=>bgmList()},
  {l:'ボス戦で部位破壊を見る',s:'氷華の妖狐（ブレイクで部位が砕ける）',f:()=>devBattle([{kind:'boss5',lv:30}],'kouka')},
  {l:'ラスボス戦BGMを聴く',s:'多段階戦の形式で沈みし女王と戦う',f:()=>devBattle([{kind:'boss6',lv:37}],'ouito',{stages:['boss6']})},
  {l:'48×48ドット一覧',s:'仲間の描き直したドット',f:()=>sprGal()},{l:'BGM　'+(BGM.on?'ON → OFF':'OFF → ON'),f:()=>{bgmToggle();dev16();}},{l:'戻る',cls:'back',f:()=>dvMenu()}],true);}
function bgmList(){log('<b>BGM試聴</b>　選ぶと再生（戻ると通常に戻る）'+(BGM.force?`<br>♪ ${BGMN[BGM.force]}`:''));
 menu([...Object.keys(BGMN).map(k=>({l:BGMN[k],cls:BGM.force===k?'ready':'',f:()=>{BGM.force=k;if(!BGM.on)bgmToggle();bgmList();}})),{l:'戻る',cls:'back',f:()=>dev16()}],true);}
function sprGal(){const ids=Object.keys(HB).filter(id=>IMG[id]);
 const im=(k,n)=>{const c=hiImg(IMG[k],n,true);return c?`<img src="${c.toDataURL()}" style="width:${n*1.5}px;height:${n*1.5}px;image-rendering:pixelated">`:'';};
 panel(`<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">${ids.map(id=>`<div style="text-align:center;font-size:11px">${im(id,48)}${IMG[id+'_aw']?im(id+'_aw',48):''}<br>${HB[id].name}</div>`).join('')}</div><button class="tbtn back wide" data-a="back">戻る</button>`,{back:()=>dev16()});
 log('<b>48×48ドット</b>　左：通常／右：星臨');}
{const _dv=dvMenu;dvMenu=function(m){BGM.force=null;_dv(m);const c=$('#cmd'),b=document.createElement('button');b.className='c ready';b.innerHTML='ver0.16 音と絵<small>エリア別BGM・星臨BGM・48×48ドット・部位破壊</small>';b.onclick=()=>{SFX.sel();dev16();};c.insertBefore(b,c.firstChild);if(c.children[1])c.children[1].classList.remove('ready');};}
