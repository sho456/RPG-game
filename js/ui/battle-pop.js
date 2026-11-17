/* ===== 戦闘中の表示（見出し・状態・数字）の正本（BPOP。ver0.46 新規。決まりは docs/BATTLE-FLOW.md） =====
 キャラごとに 1 つの「表示の枠」を固定の場所に置き、3 段で出す（敵・味方とも同じ）：
  1 段目：Critical・Weak（Resist）・属性の漢字（Weak と漢字は同時）／Guard
  2 段目：強化・弱体・状態異常（横並びで 1 行・3 つまで）。アビリティの発動名（固有の強化）は同時に出たら 2 行目
  3 段目：ダメージ・回復の数字（連続ヒットはヒットごとの数字に置き換わる。合計は出さない）
 置き場所：敵・味方とも体の中心が基準（中央揃え。数字の行の中心＝体の中心、上の段は上へ積む）。枠どうしが重なるときだけ後のものを下げる。
 表示は最後の更新から約 0.85 秒で消える（LIFE）。区切り（キャラの行動の始め・ターンの始めの効果の前・ターンの終わり）でも全員分まとめて消す（cut）。
 置き換えたもの：js/v24.js dmgPop・wordPop・tagPop、js/v25.js fxPop（V24.HK24.pop をここで差し替える。古い関数は残っているが呼ばれない） */
'use strict';
const BPOP=(()=>{
const inB=()=>typeof scene!=='undefined'&&scene==='battle'&&!!B;
const now=()=>performance.now();
const spdK=()=>speed>=4?.7:speed>=2?.85:1;
const KJ=/[぀-ヿ一-鿿]/;
const P=new Map();
const aid=()=>{try{return BFLOW.aid();}catch(e){return 0;}};
const busy=()=>{try{return BFLOW.busy();}catch(e){return false;}};
function layer(){let L=$('#bp46');if(!L||!L.isConnected){L=document.createElement('div');L.id='bp46';$('#stage').appendChild(L);}return L;}
/* 大きさ（画面px）。状態の文字は数字よりやや小さく（ver0.46b） */
const fsNum=u=>Math.round(Math.max(18,Math.min(27,SC*9.4))*(u.side===0?.86:1));
const fsSt=u=>Math.max(10,Math.round(fsNum(u)*.58));
/* 文字の絵（TX24）の余白（縁・発光のぶん）を負の余白で打ち消し、文字どうしを重ならない程度に詰める */
function tight(c,size,h=.6){const m=c._m;if(!m)return c;const p=m.pad;c.style.margin=`${-Math.round(p+size*.03)}px ${-Math.round(p*h)}px ${-Math.round(p+size*.2)}px`;return c;}
function panel(u){let p=P.get(u);if(p&&p.el.isConnected)return p;
 const el=document.createElement('div');el.className='bp46 '+(u.side===0?'h':'e');
 el.innerHTML='<div class="r0"></div><div class="r1"></div><div class="r2"></div><div class="r2b"></div><div class="r3"></div>';layer().appendChild(el);
 p={u,el,r0:el.children[0],r1:el.children[1],r2:el.children[2],r2b:el.children[3],r3:el.children[4],key:null,tl:0,fade:0};P.set(u,p);return p;}
function clear(p){p.r0.innerHTML='';p.r1.innerHTML='';p.r2.innerHTML='';p.r2b.innerHTML='';p.r3.innerHTML='';p.el.classList.remove('out','on');p.crit=p.weak=p.res=p.grd=0;}
/* 表示のまとまり（ver0.46d）：区切り（cut）から次の区切りまでを 1 つのまとまりにする。
   区切り＝キャラの行動の始め（js/rs/battle.js heroExec・enemyExec）・ターンの始めの効果の前・ターンの終わり・戦闘開始の表示のあと。
   まとまりの表示は次の区切りまで残し、区切りで全員分まとめて消える（次の行動の表示と被らない） */
let SEG=1;
/* ver0.46e：表示は残さずすぐ消す（ロマサガRS の録画：最後の表示から約 0.8 秒）。区切り（cut）でも消す */
const LIFE=850;
function begin(u){const p=panel(u),t=now();
 if(p.seg!==SEG||p.el.classList.contains('out')){clearTimeout(p.to);clear(p);p.seg=SEG;p.el.classList.remove('in');void p.el.offsetWidth;p.el.classList.add('in');}
 p.key='s'+SEG;p.tl=t;p.fade=t+Math.round(LIFE*spdK());p.el.classList.add('on');return p;}
/* 区切り：出ている表示を全部、消える動き（上へ少し浮いて薄くなる）で消す */
function cut(){SEG++;for(const p of P.values()){if(!p.el.classList.contains('on')||p.el.classList.contains('out'))continue;p.el.classList.add('out');clearTimeout(p.to);p.to=setTimeout(()=>{if(p.el.classList.contains('out')){clear(p);p.key=null;}},230);}}
/* 1 段目：見出し。Critical は Weak・Resist の上の行（r0）、Weak・Resist・Guard と属性の漢字は r1 */
function label(p,cls,txt,sk,fs,el){const row=cls==='cr'||cls==='xf'?p.r0:p.r1;if(row.querySelector('.'+cls))return;const d=document.createElement('span');d.className='lb '+cls;d.appendChild(tight(TX24.el(txt,sk,fs),fs,.8));
 if(el&&ELC[el]){const ks=Math.round(fs*1.25),k=tight(TX24.el(el,'elm',ks),ks,.8);k.classList.add('kj');d.appendChild(k);}
 row.appendChild(d);}
/* 3 段目：数字（前の数字は素早く消え、新しい数字が 1 桁ずつ右から落ちる） */
function number(p,txt,sk,fs,drop){const old=p.r3.querySelector('.nm:not(.old)');if(old){old.classList.add('old');setTimeout(()=>old.remove(),160);}
 const nm=document.createElement('span');nm.className='nm';
 if(drop&&/^[\d,]+$/.test(txt)){[...txt].forEach((ch,i)=>{const c=tight(TX24.el(ch,sk,fs),fs,1);c.style.marginLeft=c.style.marginRight=-(c._m.pad-fs*.015).toFixed(1)+'px';/* 字の送り幅どおり（重ならない）＋わずかな隙間 */c.style.animationDelay=Math.round((txt.length-1-i)*38*spdK())+'ms';nm.appendChild(c);});nm.classList.add('dg');}
 else nm.appendChild(tight(TX24.el(txt,sk,fs),fs,.8));
 p.r3.appendChild(nm);p.numT=now();p.r3.classList.remove('hit');void p.r3.offsetWidth;p.r3.classList.add('hit');}
const fmt=n=>{n=Math.abs(n|0);return n>=10000000?Math.floor(n/10000)+'万':String(n);};
function dmg(u,s,kind,el){const v=parseInt(s,10),heal=s[0]==='+',crit=/crit/.test(kind),weak=/weak/.test(kind),res=/resist/.test(kind),psn=/psn/.test(kind),grd=u.side===0&&!heal&&!!u.guard;
 const p=begin(u),fs=fsNum(u),lf=Math.round(fs*1.02);
 if(crit)label(p,'cr','Critical','crit',lf);
 /* ver0.49：エクストラフォースが乗った一撃（js/rs/battle.js calc が対象に印 _xf を付ける） */
 if(!heal&&u._xf>0){u._xf=0;label(p,'xf','Extra Force','xf',Math.round(lf*.82));}
 if(weak)label(p,'wk','Weak','weak',lf,el);else if(res&&!p.r1.querySelector('.wk'))label(p,'rs','Resist','resist',lf,el);
 if(grd)label(p,'gd','Guard','guard',lf);
 number(p,(heal?'+':'')+fmt(v),heal?'heal':psn?'psn':u.side===0?'dmgH':'dmg',heal?Math.round(fs*.92):fs,!heal);
 if(!heal)try{BFLOW.close();}catch(e){}/* 吹き出しは数字が出る前に消す */
 place();}
/* LP の減少（ver0.46f）：回復と同じ 3 段目に赤い文字。直前に数字が出ていたら、読める間（約 0.6 秒）をおいてから出す */
try{TX24.STYLE.lpd={font:'num',fill:[[0,'#ffe0e0'],[.45,'#ff5a5a'],[.55,'#d8141e'],[1,'#a00010']],ow:.12,oc:'#2a0004',sh:[.035,.065,'rgba(0,0,0,.6)']};}catch(e){}
function lp(u,txt){const p0=P.get(u),t=now(),gap=Math.round(600*spdK()),last=p0&&p0.numT&&p0.r3.children.length?p0.numT:0,w=last?Math.max(0,last+gap-t):0;
 const show=()=>{if(!inB())return;const p=begin(u);number(p,txt,'lpd',Math.round(fsNum(u)*.9),false);p.numT=now();place();};
 if(w>0){if(p0){p0.fade=Math.max(p0.fade,t+w+100);}setTimeout(show,w);}else show();}
function word(u,s){const p=begin(u);number(p,'Miss','miss',Math.round(fsNum(u)*.82),false);place();}
/* 2 段目：状態。kind に ab＝アビリティ名（2 行目） */
function stKind(s,col,kind){const c=String(col||'').toLowerCase(),k=kind||'';
 if(/\bab\b/.test(k))return'ab';
 if(/^(SP|AG|BP|HP)\s*[+＋]/.test(s)||/ゲージ/.test(s)||/^技Lv/.test(s))return'res';
 if(/[↑▲]|UP\b/.test(s))return'buff';
 if(/[↓▼]|DOWN\b|解除|弱点/.test(s))return'debuff';
 if(/\bup\b/.test(k))return'buff';
 if(/毒|スタン|マヒ|麻痺|眠|混乱|暗闇|石化|挑発|凍結/.test(s)||/\bdn\b/.test(k))return'ail';
 return'info';}
function status(u,s,col,kind){const k=stKind(s,col,kind),p=begin(u),fs=fsSt(u);let txt=String(s).replace(/▲/g,'↑').replace(/▼/g,'↓').trim();
 const sk=k==='ab'?'fx25ab':k==='res'?'fx25res':k==='info'?(KJ.test(txt)?'fx25infoJ':'fx25info'):'fx25'+k;
 const row=k==='ab'?p.r2b:p.r2,max=k==='ab'?2:3;
 /* 同じ文字が同じ行にあれば出し直さない */
 if([...row.children].some(x=>x._t===txt))return;
 const z=k==='ab'?Math.round(fs*.95):fs,c=tight(TX24.el(txt,sk,z),z,.85);c._t=txt;c.classList.add('st',k);c.style.animationDelay=(row.children.length*55)+'ms';row.appendChild(c);while(row.children.length>max)row.firstChild.remove();
 place();}
/* 置き場所（毎フレーム）：体の位置は動いていない「元の場所」で測る（攻撃で前へ出ても枠は動かない） */
function place(){if(!inB())return;const st=$('#stage');if(!st)return;const W0=st.offsetWidth;let bd;try{bd=V24.bounds();}catch(e){bd={l:3,t:60,r:W0-3,b:st.offsetHeight-50};}
 const rs=[];
 for(const[u,p]of P){if(!p.el.isConnected||!p.el.classList.contains('on'))continue;let b;try{b=V24.boxOf(u,true);}catch(e){continue;}
  const w=p.el.offsetWidth,h=p.el.offsetHeight;let x,y;
  /* キャラの範囲の中に収める（ロマサガRS の録画）：敵は体の左下寄り、味方は体の真ん中に重ねる。体より大きいときだけはみ出す */
  /* ver0.46c：敵・味方とも体の中心を基準に、中央揃え。数字の行（3 段目）の中心を体の中心に合わせ、上の段は上へ積む（数字がない間は枠の中心を体の中心に） */
  const nh=p.r3.offsetHeight;x=b.cx-w/2;y=nh?b.cy+nh/2-h:b.cy-h/2;
  /* 味方の HP・BP が見えている間（数字の無い枠のとき）は、その上に置く */
  if(u.side===0&&!p.r3.children.length){try{const i=B.heroes.indexOf(u),c=$('#hl24').children[i],app=$('#app');if(c&&app.classList.contains('hl39')){const sr=st.getBoundingClientRect(),cr=c.getBoundingClientRect(),k=sr.width/W0;if(cr.height){const ct=(cr.top-sr.top)/k;y=Math.min(y,ct-h-2);}}}catch(e){}}
  x=Math.max(bd.l,Math.min(bd.r-w,x));y=Math.max(bd.t,Math.min(bd.b-h,y));
  /* 前に置いた枠と重なるなら下げる（入らなければ上げる） */
  for(let n=0;n<6;n++){const o=rs.find(r=>x<r.r&&x+w>r.l&&y<r.b&&y+h>r.t);if(!o)break;const dn=o.b+2;y=dn+h<=bd.b?dn:Math.max(bd.t,o.t-h-2);}
  rs.push({l:x,t:y,r:x+w,b:y+h});const tf=`translate(${Math.round(x)}px,${Math.round(y)}px)`;if(p._tf!==tf){p._tf=tf;p.el.style.transform=tf;}}}
/* 行動の終わり：表示は次の区切りまで残す（ver0.46d。以前は 1 秒で消していた） */
function actEnd(){}
function tick(){if(!inB())return;const t=now();for(const[u,p]of P){if(!p.el.isConnected){P.delete(u);continue;}
  if(p.el.classList.contains('on')&&t>p.fade&&!p.el.classList.contains('out')){p.el.classList.add('out');clearTimeout(p.to);p.to=setTimeout(()=>{if(p.el.classList.contains('out')){clear(p);p.key=null;}},200);}}
 place();
 /* 数字の枠が出ている味方は、HP・BP の表示を隠す（重ならないように） */
 try{const L=$('#hl24');if(L&&B)B.heroes.forEach((h,i)=>{const c=L.children[i],p=P.get(h),on=!!(p&&p.el.classList.contains('on')&&!p.el.classList.contains('out')&&p.r3.children.length);if(c&&c.classList.contains('p46')!==on)c.classList.toggle('p46',on);});}catch(e){}}
/* 行動を始めるキャラの枠は消す（動いて元の場所から離れるため） */
function clearUnit(){cut();}
function reset(){for(const p of P.values())p.el.remove();P.clear();const L=$('#bp46');if(L)L.innerHTML='';}
/* 差し替え：文字の表示はすべてここへ（技名の吹き出しは js/battle/flow.js） */
V24.HK24.pop=(u,s,col,small,kind,el)=>{if(!inB()||!u||u.x==null)return false;s=String(s);
 try{if(s==='MISS'){word(u,s);return true;}
  if(/^[+\-]?\d+$/.test(s)&&(!small||/^\+/.test(s))){dmg(u,s.replace(/^-/,''),kind||'',el);return true;}
  status(u,s,col,kind);return true;}catch(e){console.error(e);return false;}};
{const _d=draw;draw=function(){_d();try{tick();}catch(e){if(!draw._e46){draw._e46=1;console.error(e);}}};}
{const _sb=startBattle;startBattle=function(){reset();return _sb.apply(this,arguments);};}
return{dmg,status,word,lp,actEnd,reset,clearUnit,cut,P};})();
