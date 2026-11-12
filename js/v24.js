/* ===== ver0.24 戦闘演出の品質向上（大規模ドット絵アップデートの下準備） =====
 1. ダメージ表示の配置マネージャ：数値・Critical・Weak・Guard・Miss・BREAK・状態表示を「表示中の枠」として一元管理し、
    互いに重ならない位置を候補の中から選ぶ。キャラ・HP表示・上下の固定帯も避ける。
    優先順位（BREAK＞Critical＞ダメージ／Guard／Miss＞回復＞状態）で、重なるときは低い方を早めに消す／少し待たせる
 2. 演出文字は Canvas（v24-text.js の TX24）で描く：外側の太い縁・内側の明るい縁・上下グラデーション・光沢・落ち影。
    Critical＝金、Weak＝桃紅＋属性の漢字、Guard＝水色、Miss＝銀、BREAK＝赤橙、数字は1桁ずつ弾む
 3. HP表示：画面下に「行動中キャラのパネル」（名前帯・立ち絵・星臨ゲージ・HP／SP／状態の3つの枠）、戦場の各キャラの横に HP と SP の数字
 4. 行動順の表示は廃止（DOM も作らない）。照準は画面幅の約13%の大きさの輪に
 既存の処理は V17F.pop の差し替えと refresh／startBattle の包みだけで、セーブデータの形は変えない */
'use strict';
const VER24='ver0.24';
const V24=(()=>{
const{clamp,esc,DEV}=V23,LY=V23.LY;
const app=$('#app');app.classList.add('v24');
const now=()=>performance.now();
const stage=()=>$('#stage');
const KANJI=/[぀-ヿ一-鿿]/;
const RM=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)');}catch(e){return{matches:false};}})();
const spdK=()=>speed>=4?.7:speed>=2?.85:1;
const inBattle=()=>scene==='battle'&&!!B;

/* ==================== 共通：キャラの絵の範囲（ステージ上の画面px） ==================== */
function boxOf(u,home){let fx,fy,D;try{[fx,fy]=V19.foot(u);D=V19.dims(u);}catch(e){fx=u.x+8*u.sc;fy=u.y+16*u.sc;D={w:16*u.sc,h:16*u.sc};}
 if(!home&&u.A){fx+=(u.A.wx||0)+(u.A.kb||0);fy+=(u.A.wy||0);}
 return{l:(fx-D.w/2)*SC,r:(fx+D.w/2)*SC,t:(fy-D.h)*SC,b:fy*SC,w:D.w*SC,h:D.h*SC,cx:fx*SC,cy:(fy-D.h*.5)*SC};}
const ov=(a,b)=>Math.max(0,Math.min(a.r,b.r)-Math.max(a.l,b.l))*Math.max(0,Math.min(a.b,b.b)-Math.max(a.t,b.t));
const rect=(x,y,w,h,ins=0)=>({l:x+ins,t:y+ins,r:x+w-ins,b:y+h-ins});
const relRect=el=>{if(!el||!el.isConnected||!el.offsetParent||+getComputedStyle(el).opacity<.05)return null;const s=stage().getBoundingClientRect(),r=el.getBoundingClientRect();if(!r.width||!r.height)return null;return{l:r.left-s.left,t:r.top-s.top,r:r.right-s.left,b:r.bottom-s.top};};
/* 表示してよい範囲：上の固定帯（敵の名前・HP）と下の帯（星臨ボタン）の間 */
function bounds(){const st=stage(),SW=st.offsetWidth,SH=st.offsetHeight;return{l:3,t:(LY.hudPx||58)+2,r:SW-3,b:SH-(LY.botPx||46)-2,SW,SH};}

/* ==================== 1. 配置マネージャ ==================== */
const PRI={brk:5,crit:4,dmg:3,word:3,heal:2,tag:1};
const PM={live:[]};
function layer(){let L=$('#pp24');if(!L||!L.isConnected){L=document.createElement('div');L.id='pp24';stage().appendChild(L);}return L;}
function alive(){const t=now();PM.live=PM.live.filter(p=>!p.gone&&p.el.isConnected&&p.end>t);return PM.live;}
function dismiss(p,ms=170){if(p.gone)return;p.gone=1;clearTimeout(p.to1);clearTimeout(p.to2);p.el.classList.add('out');p.el.style.setProperty('--out',ms+'ms');setTimeout(()=>p.el.remove(),ms+20);}
function clearPops(){PM.live.forEach(p=>{clearTimeout(p.to1);clearTimeout(p.to2);});PM.live=[];const L=$('#pp24');if(L)L.innerHTML='';}
/* 障害物（重ねたくないもの）と重み */
function obstacles(u){const o=[];if(!B)return o;
 B.heroes.forEach(h=>{const b=boxOf(h,true);o.push({r:{l:b.l+b.w*.18,t:b.t+b.h*.12,r:b.r-b.w*.18,b:b.b-b.h*.04},w:40});});
 HL.rects.forEach(r=>o.push({r,w:50}));
 /* 敵の体：自分はわずかに、他の敵はやや強く避ける（頭上や脇に空きがあればそちらへ） */
 if(u.side===1)B.enemies.forEach(e=>{if(e.alive){const b=boxOf(e,true);o.push({r:{l:b.l+b.w*.2,t:b.t+b.h*.25,r:b.r-b.w*.2,b:b.b-b.h*.1},w:e===u?.12:1});}});
 const sk=relRect($('#skn20'));if(sk)o.push({r:sk,w:40});
 /* 連撃数：多段攻撃の間は、まだ出ていなくても場所を予約しておく（後から出て数字に被らないように） */
 if(B.combo||relRect($('#combo')))o.push({r:comboRect(),w:60});
 return o;}
/* 候補の位置を順に評価して、重なりの最も少ない場所を選ぶ。
 費用：優先度の高い表示との重なり（200）≫ HP表示・味方の絵（40〜50）≫ 同じ優先度の古い表示（20：新しい方を優先して古い方を下げる）≫ 低い優先度（4）＋候補の順番 */
function choose(u,w,h,pri,self){if(HK24.choose){const r=HK24.choose(u,w,h,pri,self);if(r)return r;}const bd=bounds(),b=boxOf(u),hero=u.side===0,obs=obstacles(u),live=alive().filter(q=>q!==self),cand=[];
 const xmax=hero?bd.r-w:Math.max(bd.l,Math.min(bd.r,(LY.heroL||W*.62)*SC-4)-w);
 if(hero){const x0=b.l-4-w,y0=b.cy-h*.5,sy=h*.55+3,sx=w*.55;
  for(const dy of[0,-1,1,-2,2,-3,3,-4,4])for(const dx of[0,-1,-2,-3,-4])cand.push([x0+dx*sx,y0+dy*sy]);}
 else{const x0=b.cx-w/2,y0=b.t+Math.min(b.h*.3,h*.45)-h,sy=h*.55+3,sx=w*.6;
  for(const dy of[0,-1,1,-2,2,-3,3,-4,4,-5])for(const dx of[0,-1,1,-2,2,-3,3])cand.push([x0+dx*sx,y0+dy*sy]);}
 let best=null;cand.forEach(([x,y],i)=>{x=clamp(x,bd.l,Math.max(bd.l,xmax));y=clamp(y,bd.t,Math.max(bd.t,bd.b-h));const R=rect(x,y,w,h,3);let c=0,hard=0;
  for(const p of live){if(p.R===undefined)continue;const a=ov(R,p.R);if(a>0){if(p.pri>pri){c+=a*200;hard+=a;}else c+=a*(p.pri===pri?20:4);}}
  for(const q of obs){const a=ov(R,q.r);c+=a*q.w;if(q.w>=40)hard+=a;}c+=i*6;
  if(!best||c<best.c)best={x,y,R,c,hard};});
 /* 近くに空きがなければ、表示してよい範囲全体を格子状に調べて、最寄りの空いた位置を使う */
 if(best.hard>0){const[ax,ay]=cand[0],xm=Math.max(bd.l,xmax),ym=Math.max(bd.t,bd.b-h);let g=null;
  for(let y=bd.t;y<=ym+.1;y+=8)for(let x=bd.l;x<=xm+.1;x+=8){const R=rect(x,y,w,h,3);let hard=0,c=0;
   for(const q of obs){const a=ov(R,q.r);if(q.w>=40){hard+=a;if(hard)break;}else c+=a*q.w;}if(hard)continue;
   for(const p of live){const a=ov(R,p.R);if(a>0){if(p.pri>pri){hard=1;break;}c+=a*(p.pri===pri?20:4);}}if(hard)continue;
   c+=Math.hypot(x-ax,(y-ay)*1.3)*8;if(!g||c<g.c)g={x,y,R,c,hard:0};}
  if(g)best=g;}
 return best;}
/* 要素を測って置く。優先度の低い表示とぶつかるなら低い方を早めに消す。状態表示は少し待って空きを探す */
function place(p,tries=0){const el=p.el,w=el.offsetWidth,h=el.offsetHeight,best=choose(p.u,w,h,p.pri);
 /* 優先度の高い表示が空くまで少し待つ（状態表示は長め、ダメージは短め） */
 if(best.hard>0&&tries<(p.pri<=PRI.tag?6:3)){el.style.visibility='hidden';setTimeout(()=>{if(!el.isConnected||!inBattle()){el.remove();return;}place(p,tries+1);},120);return false;}
 /* 待っても空かないとき：状態表示は見送る（内容はメッセージ欄に残る）。ダメージなどは重なるHP表示を一時的に薄くする */
 if(best.hard>0){if(p.pri<=PRI.tag){el.remove();return false;}dimHL(best.R,p.life);}
 /* 重なる表示は下げる（新しい表示を優先。待っても空かなかった場合は高い優先度のものも） */
 bump(p,best.R);
 p.x=best.x;p.y=best.y;p.R=best.R;p.w=w;p.h=h;el.style.transform=`translate(${Math.round(best.x)}px,${Math.round(best.y)}px)`;
 if(el.style.visibility==='hidden'){el.style.visibility='';el.classList.remove('wait');}
 if(!p.live){p.live=1;p.t=now();p.end=p.t+p.life;PM.live.push(p);arm(p);}
 return true;}
function arm(p){clearTimeout(p.to1);clearTimeout(p.to2);const left=Math.max(0,p.end-now());p.to1=setTimeout(()=>{if(!p.gone){p.gone=1;p.el.classList.add('out');}},Math.max(0,left-220));p.to2=setTimeout(()=>p.el.remove(),left+40);}
/* 行が増えて大きくなった表示を置き直す */
function reflow(p){const w=p.el.offsetWidth,h=p.el.offsetHeight,best=choose(p.u,w,h,p.pri,p);if(best.hard>0)dimHL(best.R,Math.max(200,p.end-now()));p.x=best.x;p.y=best.y;p.R=best.R;p.el.style.transform=`translate(${Math.round(best.x)}px,${Math.round(best.y)}px)`;bump(p,best.R);}
function bump(p,R){if(HK24.bump)return HK24.bump(p,R);alive().forEach(q=>{if(q!==p&&q.R&&ov(R,q.R)>0)dismiss(q,140);});}
/* 同じ相手の表示が多すぎるとき（多段攻撃）は古いものから下げる */
function capUnit(u,max=3){const L=alive().filter(p=>p.u===u&&p.num);if(L.length<max)return;
 /* 優先度の低いもの（Critical 以外）の古い順に下げる */
 L.sort((a,b)=>(a.pri-b.pri)||(a.t-b.t)).slice(0,L.length-max+1).forEach(p=>dismiss(p,140));}
/* 表示の要素を作る：.p24（位置）＞.ot（消える動き）＞.in（出る動き） */
function make(u,cls,pri,life){const L=layer(),el=document.createElement('div');el.className=`p24 ${u.side===0?'h':'e'} ${cls}`;el.style.visibility='hidden';
 el.innerHTML='<div class="ot"><div class="in"></div></div>';L.appendChild(el);return{el,in:el.querySelector('.in'),u,pri,life:Math.round(life*spdK())};}
/* 大きさ（画面px）。戦場の倍率に比例し、上限・下限を設ける */
/* 演技エリアが低い画面（iPhone SE など）では、エリアの高さに合わせて全体を縮める */
const fitK=()=>{const bd=bounds();return clamp((bd.b-bd.t)/230,.68,1);};
/* 文字の大きさ（倍率・最小・最大）。ver0.25 で参考資料に合わせて調整できるよう外へ出す */
const FS24={h:[9,19,25],e:[12,24,34],hl:[7.6,15,21],cb:[13,24,34],lb:.56};
const fsOf=k=>clamp(SC*FS24[k][0],FS24[k][1],FS24[k][2]);
const numFs=u=>Math.round(fsOf(u.side===0?'h':'e')*fitK());
const TIER=[1,1.12,1.28,1.45];
const tierOf=(u,d)=>{const r=d/Math.max(1,u.mhp||1);return r>=.35?3:r>=.15?2:r>=.05?1:0;};
const fmt=n=>{n=Math.abs(n|0);return n>=100000?Math.floor(n/10000)+'万':String(n);};
function lbRow(cls,...cs){const d=document.createElement('div');d.className='lb '+cls;cs.forEach(c=>d.appendChild(c));return d;}

function dmgPop(u,s,kind,el){const v=parseInt(s,10),heal=s[0]==='+',crit=/crit/.test(kind),weak=/weak/.test(kind),psn=/psn/.test(kind),grd=u.side===0&&!heal&&!!u.guard;
 const t=heal?0:tierOf(u,Math.abs(v)),fs=Math.round(numFs(u)*TIER[t]*(crit?(FS24.cr||1.15):1)*(heal?.92:1));
 const sk=heal?'heal':psn?'psn':crit?'dmgC':weak?(t>=3?'dmgWT':'dmgW'):grd?'dmgG':u.side===0?'dmgH':t>=3?'dmgT':'dmg';
 const pri=crit?PRI.crit:heal?PRI.heal:PRI.dmg;capUnit(u);
 const p=make(u,`dmg t${t}${crit?' crit':''}${weak?' weak':''}${heal?' heal':''}${grd?' grd':''}`,pri,(crit||t>=2?1400:1150));
 const lf=Math.round(fs*(FS24.lb||.56));
 if(crit)p.in.appendChild(lbRow('cr',TX24.el('Critical','crit',Math.round(fs*.62))));
 if(weak){const r=lbRow('wk',TX24.el('Weak','weak',lf));if(el&&ELC[el])r.appendChild(TX24.el(el,'elm',Math.round(lf*1.06)));p.in.appendChild(r);}
 if(grd)p.in.appendChild(lbRow('gd',TX24.el('Guard','guard',Math.round(fs*.66))));
 const nm=document.createElement('div');nm.className='nm';nm.appendChild(TX24.row((heal?'+':'')+fmt(v),sk,fs,/万/));p.in.appendChild(nm);
 if(crit&&!RM.matches){const ec=nm.cloneNode(false);ec.className='nm ec';ec.appendChild(TX24.row(fmt(v),sk,fs,/万/));nm.appendChild(ec);p.in.prepend(TX24.burst(fs*3.2));}
 p.num=1;place(p);u._dm24=p;return p;}
function wordPop(u,s,kind){const miss=s==='MISS',fs=numFs(u);
 const p=make(u,miss?'word miss':'word xbrk',miss?PRI.word:PRI.brk,miss?950:1350);
 p.in.appendChild(miss?TX24.el('Miss','miss',Math.round(fs*.82)):TX24.el('BREAK!!','brk',Math.round(fs*1.02)));place(p);return p;}
/* 小さな表示（状態・AG+・DELAY など）。直前のダメージ表示があれば、その見出しの列に加える（Guard／スタン／430 の形） */
function tagPop(u,s,col,kind){const t=now(),jp=KANJI.test(s),fs=Math.round(jp?clamp(numFs(u)*.5,12,15):clamp(numFs(u)*.6,13,18)),c0=/^#/.test(col||'')?col:'#ffffff';
 const D=u._dm24;if(D&&!D.gone&&t-D.t<450&&D.el.isConnected&&!/fu/.test(kind||'')){const n=D.in.querySelectorAll('.lb.st').length;if(n<2){
   const r=lbRow('st',TX24.el(s,jp?'stat':TX24.tint(c0,'num'),fs)),oh=D.el.offsetHeight;D.in.insertBefore(r,D.in.querySelector('.nm'));
   reflow(D);
   D.end=Math.max(D.end,t+Math.round(700*spdK()));arm(D);return;}}
 /* 同じ相手へほぼ同時に出る状態表示（攻撃↑・魔力↑…）は1行にまとめる */
 const T0=u._tg24;if(T0&&!T0.gone&&t-T0.t<380&&T0.el.isConnected&&T0.n<3){T0.n++;T0.in.appendChild(TX24.el(s,jp?TX24.tint(c0,'jp'):TX24.tint(c0,'num'),fs));
  if(T0.live)reflow(T0);return;}
 const up=/\bup\b/.test(kind||''),dn=/\bdn\b/.test(kind||'');
 const p=make(u,'tag'+(up?' up':dn?' dn':''),PRI.tag,1000);p.n=1;p.t=t;p.in.appendChild(TX24.el(s,jp?TX24.tint(c0,'jp'):TX24.tint(c0,'num'),fs));u._tg24=p;
 /* まとめ待ちのため、置くのはわずかに遅らせる */
 setTimeout(()=>{if(p.el.isConnected&&inBattle())place(p);else p.el.remove();},40);}
const _pop0=V17F.pop;
function pop24(u,txt,col,small,kind,el){kind=kind||'';if(!inBattle()||!u||u.x==null)return _pop0(u,txt,col,small,kind,el);
 try{const s=String(txt);
  if(/fu/.test(kind)&&small){skBanner(s,u.side);return;}
  if(HK24.pop&&HK24.pop(u,s,col,small,kind,el))return;
  if(!small&&/^[+\-]?\d+$/.test(s))return void dmgPop(u,s,kind,el);
  if(s==='MISS'||/brk/.test(kind)||/^BREAK/.test(s))return void wordPop(u,s,kind);
  tagPop(u,s,col,kind);}catch(e){console.error(e);}}
V17F.pop=pop24;
/* 連撃数（○HITS と合計）：上の固定帯のすぐ下・左端に固定。参考資料の数字と同じ質感で */
function comboRect(){const c=$('#combo'),bd=bounds(),r=relRect(c);return r?{l:r.l-4,t:r.t-2,r:Math.max(r.r,bd.l+118)+4,b:Math.max(r.b,bd.t+60)+2}:{l:0,t:bd.t-2,r:bd.l+122,b:bd.t+62};}
comboAdd=function(d){if(!B||!B.combo)return;B.combo.n++;B.combo.tot+=d;if(B.combo.n<2)return;let c=$('#combo');if(!c){c=document.createElement('div');c.id='combo';stage().appendChild(c);}
 const fs=Math.round(fsOf('cb')*fitK());c.innerHTML='';const r1=document.createElement('div');r1.className='c1';r1.appendChild(TX24.row(String(B.combo.n),'dmgC',fs));r1.appendChild(TX24.el('HITS','crit',Math.round(fs*.5)));
 const r2=document.createElement('div');r2.className='c2';r2.appendChild(TX24.el(fmt(B.combo.tot),'dmg',Math.round(fs*.56)));c.appendChild(r1);c.appendChild(r2);
 c.style.display='block';c.classList.remove('bump');void c.offsetWidth;c.classList.add('bump');};
/* 技名：上の固定帯のすぐ下、中央に出す（キャラに被らない） */
function skBanner(n,side){let k=$('#skn20');if(!k){k=document.createElement('div');k.id='skn20';stage().appendChild(k);}k.className=side?'e':'';k.innerHTML=`<b>${esc(n)}</b>`;k.classList.remove('show');void k.offsetWidth;k.classList.add('show');}

/* ==================== 2. 戦場のHP表示（参考：キャラの横に大きなHPと小さなSP） ==================== */
const HL={rects:[],sig:''};
function hlLayer(){let L=$('#hl24');if(!L||!L.isConnected){L=document.createElement('div');L.id='hl24';stage().appendChild(L);
  L.addEventListener('click',e=>{const c=e.target.closest('.hl');if(!c||!B)return;const h=B.heroes[+c.dataset.i];if(h){SFX.sel();heroSheet(h);}});}return L;}
function dimHL(R,life){const L=$('#hl24');if(!L)return;HL.rects.forEach((r,i)=>{const c=L.children[i];if(!c||ov(R,r)<=0)return;c.classList.add('dim');clearTimeout(c._dt);c._dt=setTimeout(()=>c.classList.remove('dim'),life);});}
const hpStyle=h=>!h.alive?'hpD':h.hp<h.mhp*.25?'hpR':h.hp<h.mhp*.5?'hpY':'hp';
function renderHL(){const L=hlLayer();if(!B)return;const fs=Math.round(fsOf('hl')*clamp(fitK()+.1,.82,1)),ss=Math.round(fs*.62);
 if(L.children.length!==B.heroes.length||L._ids!==B.heroes.map(h=>h.id).join()){L._ids=B.heroes.map(h=>h.id).join();L.innerHTML=B.heroes.map((h,i)=>`<div class="hl" data-i="${i}"><span class="v"></span><span class="s"></span></div>`).join('');}
 B.heroes.forEach((h,i)=>{const c=L.children[i],hp=Math.max(0,h.hp|0),sp=DEV()?'∞':String(h.sp|0),st=hpStyle(h),k=hp+'|'+st+'|'+fs;
  if(c._k!==k){c._k=k;const v=c.querySelector('.v');v.innerHTML='';v.appendChild(TX24.el(String(hp),st,fs));}
  const k2=sp+'|'+ss;if(c._s!==k2){c._s=k2;const s=c.querySelector('.s');s.innerHTML='';s.appendChild(TX24.el('SP','sp',Math.round(ss*.78),'sl'));s.appendChild(TX24.el(sp,'sp',ss));}
  const cls=`hl${h.alive?'':' down'}${B.cur===h?' cur':''}${h.aw?' awk':''}${h.guard?' gd':''}`;if(c.className!==cls)c.className=cls;});
 placeHL();}
/* 位置：体の左下（少しだけ絵に掛かる）を第一候補に、他のキャラ・他のHP表示と重ならない場所を選ぶ */
const HK24={};
function placeHL(){const L=$('#hl24');if(!L||!B)return;if(HK24.placeHL){HL.rects=HK24.placeHL(L)||[];return;}const bd=bounds(),boxes=B.heroes.map(h=>boxOf(h,true)),rs=[],aw=relRect($('#bt22 .b22aw'));
 B.heroes.forEach((h,i)=>{const c=L.children[i];if(!c)return;const w=c.offsetWidth,hh=c.offsetHeight,b=boxes[i];
  const cand=[[b.l+b.w*.18-w,b.b-hh+2],[b.l+b.w*.18-w,b.cy-hh*.2],[b.l+b.w*.18-w,b.t],[b.cx-w/2,b.b-4],[b.l-w-2,b.t+b.h*.3],[b.r-b.w*.1,b.b-hh+2],[b.cx-w/2,b.t-hh+6],[b.l-w-2,b.b-hh]];let best=null;
  cand.forEach(([x,y],j)=>{x=clamp(x,bd.l,bd.r-w);y=clamp(y,bd.t,Math.max(bd.t,bd.b-hh));const R=rect(x,y,w,hh,2);let s=j*40+(aw?ov(R,aw)*20:0);
   boxes.forEach((o,k)=>{if(k!==i)s+=ov(R,{l:o.l+o.w*.15,t:o.t+o.h*.1,r:o.r-o.w*.15,b:o.b})*3;});rs.forEach(o=>s+=ov(R,o)*6);if(!best||s<best.s)best={x,y,R,s};});
  rs.push(best.R);const tf=`translate(${Math.round(best.x)}px,${Math.round(best.y)}px)`;if(c._tf!==tf){c._tf=tf;c.style.transform=tf;}});
 HL.rects=rs;}

/* ==================== 3. 行動中キャラのパネル（参考：名前帯・立ち絵・ゲージ・HP／LP／BP の3つの枠） ==================== */
const STN=s=>{try{return s.k==='weak'?s.el:(V20.STN[s.k]||['',''])[1];}catch(e){return s.k;}};
const isBuff=s=>{try{return V20.isBuff(s);}catch(e){return false;}};
const STAT6=['atk','def','mag','res','spd','crit'];
function stHTML(h,max=4){const L=(h.sts||[]);return L.slice(0,max).map(s=>`<i class="${isBuff(s)?'bu':'de'}">${esc(STN(s))}${STAT6.includes(s.k)?(s.v>0?'▲':'▼'):''}</i>`).join('')+(L.length>max?`<i class="mo">+${L.length-max}</i>`:'')+(h.guard?'<i class="gd">防御</i>':'');}
function ensureBP(){let el=$('#bp24');if(!el){el=document.createElement('div');el.id='bp24';$('#party').after(el);
  el.innerHTML=`<div class="hd"><div class="np"><i class="ec"></i><b class="nm"></b><small class="lv"></small><span class="rk"></span></div>
   <div class="od"><em></em><div class="g"><i></i></div><span></span></div><div class="pf"><img alt=""></div></div>
   <div class="bx3"><div class="bx hp"><em>HP</em><b class="v"></b><small></small><s><i></i></s></div><div class="bx sp"><em>SP</em><b class="v"></b><small>/100</small></div><div class="bx st"><span></span></div></div>`;
  el.addEventListener('click',()=>{if(!B||!el._h)return;SFX.sel();heroSheet(el._h);});}return el;}
function setT(el,v){if(el&&el.textContent!==v)el.textContent=v;}
function renderBP(){const el=ensureBP();if(!B)return;const a=B.cur&&B.cur.side===0?B.cur:(B.lastH&&B.heroes.includes(B.lastH)?B.lastH:B.heroes[0]);if(!a)return;el._h=a;
 const my=B.cur===a,dev=DEV(),G2=typeof GAUGE!=='undefined'&&GAUGE.includes(a.id),hp=Math.max(0,a.hp|0),pc=a.mhp?hp/a.mhp:0;
 const cls=`${my?'':'off'}${a.aw?' awk':''}${!a.aw&&a.ag>=100?' full':''}${!a.alive?' down':pc<.25?' lowR':pc<.5?' lowY':''}`;if(el.className!==cls)el.className=cls;
 el.style.setProperty('--ec',elCol(a.id));
 setT(el.querySelector('.nm'),a.name);setT(el.querySelector('.lv'),'Lv'+((G.h[a.id]&&G.h[a.id].lv)||1));
 const lv=(G.h[a.id]&&G.h[a.id].awLv)||1,rk=el.querySelector('.rk'),rh='<i class="on"></i>'.repeat(lv)+'<i></i>'.repeat(3-lv);if(rk._h!==rh){rk._h=rh;rk.innerHTML=rh;}
 const e=elOf(a.id),ec=el.querySelector('.ec');setT(ec,e||'');
 const img=el.querySelector('.pf img'),src=art(a.id,a.aw);if(img._s!==src){img._s=src;img.src=src;}
 let gw,gt;if(a.aw){gw=G2?a.ag:clamp((1-a.awT/Math.max(1,awN(a)))*100,0,100);gt=G2?Math.round(a.ag)+'':'残'+Math.max(0,awN(a)-a.awT);}else{gw=Math.min(100,a.ag);gt=a.ag>=100?'MAX':Math.floor(a.ag)+'%';}
 setT(el.querySelector('.od em'),a.aw?AW[a.id].name:SEIRIN.ge);const gi=el.querySelector('.od .g i'),gs=gw.toFixed(1)+'%';if(gi.style.width!==gs)gi.style.width=gs;setT(el.querySelector('.od span'),gt);
 setT(el.querySelector('.bx.hp .v'),String(hp));setT(el.querySelector('.bx.hp small'),'/'+a.mhp);const hi=el.querySelector('.bx.hp s i'),hs=(pc*100).toFixed(1)+'%';if(hi.style.width!==hs)hi.style.width=hs;
 setT(el.querySelector('.bx.sp .v'),dev?'∞':String(a.sp|0));
 const sh=stHTML(a)||'<small class="nst">状態異常なし</small>',se=el.querySelector('.bx.st span');if(se._h!==sh){se._h=sh;se.innerHTML=sh;}}
function heroSheet(h){const sts=(h.sts||[]).map(s=>`<li class="${isBuff(s)?'bu':'de'}"><b>${esc(STN(s))}${STAT6.includes(s.k)?(s.v>0?'▲':'▼'):''}</b><span>${s.t<50?'残り'+s.t+'ターン':'戦闘中ずっと'}</span></li>`).join('');
 ovOpen(`<div class="hs23" style="--ec:${elCol(h.id)}"><div class="hh"><img src="${art(h.id,h.aw)}" alt=""><div><b>${esc(h.name)}</b><small>Lv${G.h[h.id].lv}　${esc(clsOf(h.id))}</small></div></div>
  <dl class="dl22"><dt>HP</dt><dd>${Math.max(0,h.hp)} / ${h.mhp}</dd><dt>SP</dt><dd>${DEV()?'∞':h.sp} / 100</dd><dt>${SEIRIN.g}</dt><dd>${h.aw?SEIRIN.n+'中（'+esc(AW[h.id].name)+'）':Math.floor(h.ag)+'%'}</dd><dt>状態</dt><dd>${h.alive?(h.guard?'防御中':'通常'):'戦闘不能'}</dd></dl>
  ${sts?`<ul class="sl23">${sts}</ul>`:'<div class="nn">強化・弱体はかかっていない</div>'}</div><button class="tbtn back wide" data-a="close">閉じる</button>`,{close:ovClose});}

/* ==================== 4. 照準（参考：細い輪＋四方の矢印。弱点を突く技を選ぶと赤くなり Weak） ==================== */
function reticleWord(){const b=$('#rt22 b');if(b&&!b._tx){b._tx=1;b.textContent='';b.appendChild(TX24.el('Weak','weak',14));}}

/* ==================== 組み込み ==================== */
ensureBP();
{const _rf=refresh;refresh=function(){_rf();if(!inBattle())return;try{renderBP();renderHL();}catch(e){console.error(e);}};}
{const _sb=startBattle;startBattle=function(list,opts){clearPops();const r=_sb(list,opts);try{reticleWord();renderBP();renderHL();}catch(e){console.error(e);}return r;};}
{const _sh=show;show=function(m){_sh(m);if(m!=='battle'){clearPops();const L=$('#hl24');if(L){L.innerHTML='';L._ids='';}HL.rects=[];}};}
/* 画面の大きさが変わったら、HP表示の位置を測り直す（v23 の layout の後） */
addEventListener('resize',()=>{if(scene==='battle')requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{try{renderHL();}catch(e){}})));});
/* 書体の読み込みが終わったら、HP表示を正しい書体で描き直す */
try{document.fonts&&document.fonts.ready.then(()=>{TX24.clear();const L=$('#hl24');if(L)[...L.children].forEach(c=>{c._k=c._s='';});if(inBattle())renderHL();});}catch(e){}

/* ==================== お知らせ・開発者メニュー ==================== */
const NEWS24=`<div class="nt"><b>${VER24}</b>　戦闘演出を改良しました。<br><small>・ダメージ／Critical／Weak／Guard／Miss／BREAK の表示を新しいデザインに。同時に出ても重ならないように自動で配置します。<br>・HPは各キャラの横に、行動中のキャラは画面下のパネルに（タップで状態の詳細）。<br>・行動順の表示を廃止し、戦場を広く使えるようにしました。</small></div>`;
document.addEventListener('click',e=>{const t=e.target.closest('[data-h22="news"]');if(!t||scene!=='town')return;e.stopPropagation();e.preventDefault();SFX.sel();
 const vn=V22.HM.news||'';ovOpen(`<div class="nw22"><div class="nh"><b>お知らせ</b></div>${vn||''}${NEWS24}${V23.NEWS23||''}</div><button class="tbtn back wide" data-a="close">閉じる</button>`,{close:ovClose});},true);
/* 同時に大量の表示を出す確認用 */
function stress(){if(!inBattle())return;const E=aliveE(),Hs=B.heroes;let k=0;
 const one=()=>{if(!inBattle())return;E.forEach((e,i)=>{pop(e,Math.round(200+Math.random()*9000),'#fff',false,['','weak','crit weak','crit'][(k+i)%4],['斬','炎','雷','光'][(k+i)%4]);if((k+i)%3===0)pop(e,'MISS','#fff',true);});
  Hs.forEach((h,i)=>{h.guard=(k+i)%2===0;pop(h,Math.round(80+Math.random()*600),'#f88',false,'hurt');if(i%2)setTimeout(()=>pop(h,'スタン','#ffe14a',true,'st20 dn'),30);});
  if(E[0]&&k%2)pop(E[0],'BREAK!!','#fff',false,'brk');pop(Hs[0],'+'+(300+k*10),'#7dffa8');k++;};
 one();const iv=setInterval(()=>{if(k>=6||!inBattle()){clearInterval(iv);B&&B.heroes.forEach(h=>h.guard=false);return;}one();},260);}
function dev24(m){log(m||`<b>${VER24}</b>　ダメージ表示・HP表示・照準の確認`);
 menu([{l:'ダメージ同時表示の負荷試験',s:'敵3体＋味方4人へ連続で表示',cls:'ready',f:()=>{devBattle([{kind:'slime',lv:5},{kind:'wolf',lv:5},{kind:'shroom',lv:5}],'haido',{boss:false});setTimeout(stress,1300);}},
  {l:'ボス＋手下で確認',s:'Critical／Weak／Guard／Miss／BREAK',f:()=>{devBattle([{kind:'boss2',lv:10},{kind:'moss',lv:8},{kind:'jadewolf',lv:8}],'midori',{theme:'forest'});setTimeout(stress,1300);}},
  {l:'大型ボス',s:'照準の大きさ・表示の位置',f:()=>devBattle([{kind:'boss9',lv:60}],'ryuu',{theme:'lava'})},
  {l:'戻る',cls:'back',f:()=>dvMenu()}],true);}
{const _dv=dvMenu;dvMenu=function(m){_dv(m);try{addCmd(VER24+' 戦闘演出','ダメージ表示・HP表示・照準',dev24,0,'ready');}catch(e){}};}
/* 版表示 */
{const _t=title;title=function(){_t();const v=$('#verL');if(v)v.textContent=VER24;};const v=$('#verL');if(v)v.textContent=VER24;}
try{document.title='アストラル・ブレイカー '+VER24;}catch(e){}
return{TIER,HK24,FS24,placeHL,renderHL0:()=>renderHL(),pop24,dmgPop,wordPop,tagPop,PM,PRI,clearPops,renderHL,renderBP,heroSheet,boxOf,bounds,stress,dev24,HL};})();
