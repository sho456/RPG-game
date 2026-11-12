/* ===== 戦闘表示（ver0.10） ===== */
function stTags(u){const t=[];if(u.side===0){if(u.aw)t.push(['星臨','aw']);if(u.ag>=100&&!u.aw)t.push(['AG MAX','ag']);if(u.taunt>0)t.push(['挑発'+u.taunt,'tn']);if(u.guard)t.push(['防御','gd']);
 if(B.domain)t.push(['聖域','dm']);if(B.barrier>0)t.push(['障壁','dm']);if(u.charged)t.push(['充填','ch']);
 if(u.aw){if(u.id==='gald')t.push(['蓄'+Math.round(u.store),'ch']);else if(u.id==='mire')t.push(['対消滅'+(u.stk||0),'ch']);else if(u.id==='balza')t.push(['熱'+u.awT,'ch']);else if(!GAUGE.includes(u.id))t.push(['残'+(awN(u)-u.awT),'ch']);}}
 else{if(u.charging)t.push(['溜め','cg']);if(u.stolen)t.push(['盗済','st']);}return t;}
const tagH=u=>stTags(u).map(([l,c])=>`<span class="tg ${c}">${l}</span>`).join('');
function refresh(){if(!B)return;const P=$('#party'),key=B.heroes.map(h=>h.id).join();
 if(P.dataset.k!==key||P.className!=='bt'){P.className='bt';P.dataset.k=key;P.innerHTML=B.heroes.map(()=>`<div class="pc"><img class="fc"><div class="nm"><span class="n"></span><div class="tgs"></div></div><div class="bars"><div class="bar hp"><i class="gh"></i><i class="fg"></i><span></span></div><div class="bar sp"><i class="fg"></i><span></span></div><div class="bar ag"><i class="fg"></i><span></span></div></div></div>`).join('');}
 B.heroes.forEach((h,i)=>{const r=P.children[i];if(!r)return;r.className=`pc ${B.cur===h?'cur':''} ${h.alive?'':'down'} ${h.aw?'awk':''}`;const f=face(h.id,h.aw),im=r.querySelector('.fc');if(im.getAttribute('src')!==f)im.src=f;
  r.querySelector('.n').textContent=h.name;r.querySelector('.tgs').innerHTML=tagH(h);const[hp,sp,ag]=r.querySelectorAll('.bar'),pc=Math.max(0,h.hp/h.mhp*100);
  hp.querySelector('.fg').style.width=pc+'%';hp.querySelector('.gh').style.width=pc+'%';hp.classList.toggle('low',pc<30&&h.alive);hp.querySelector('span').textContent=`HP ${h.hp}`;
  sp.querySelector('.fg').style.width=h.sp+'%';sp.querySelector('span').textContent=`SP ${h.sp}`;ag.querySelector('.fg').style.width=Math.min(100,h.ag)+'%';ag.classList.toggle('full',h.ag>=100&&!h.aw);
  ag.querySelector('span').textContent=h.aw?(GAUGE.includes(h.id)?'ゲージ'+Math.round(h.ag):'星臨中'):h.ag>=100?'星臨OK':`AG ${Math.floor(h.ag)}`;});
 const L=$('#labels');[...L.children].forEach(el=>{if(!el._e||!B.enemies.includes(el._e)||!el._e.alive)el.remove();});
 aliveE().forEach(e=>{let el=e._el;if(!el||!el.isConnected){el=document.createElement('div');el.className='lab';el.innerHTML='<div class="n"></div><div class="hp"><b></b><i></i></div><div class="cs"></div>';el._e=e;e._el=el;L.appendChild(el);}
  el.style.left=Math.max(0,e.x*SC)+'px';el.style.top=Math.max(0,(e.y+(e.boss?-3:6))*SC-32)+'px';el.querySelector('.n').innerHTML=`${e.name} <small>Lv${e.lv}</small>`;
  const pc=e.hp/e.mhp*100;el.querySelector('.hp i').style.width=pc+'%';el.querySelector('.hp b').style.width=pc+'%';const unk=e.weak.length-e.known.size;
  el.querySelector('.cs').innerHTML=[...e.known].map(k=>`<span class="ch el" style="background:${ELC[k]};border-color:${ELC[k]}">${k}</span>`).join('')+'<span class="ch">?</span>'.repeat(unk)+tagH(e);});
 const o=$('#order');o.innerHTML='';preview().slice(0,7).forEach((u,i)=>{const d=document.createElement('div');d.className='o'+(u.side?' e':'')+(u.aw?' aw':'');const c=document.createElement('canvas');c.width=c.height=18;
  const b=bbox(u.spr);c.getContext('2d').drawImage(IMG[sprKey(u)],b.x,b.y,b.w,b.h,(18-b.w)>>1,(18-b.h)>>1,b.w,b.h);d.appendChild(c);
  const hb=document.createElement('i');hb.className='ob';hb.style.width=`calc(${Math.max(0,u.hp/u.mhp*100)}% - 4px)`;d.appendChild(hb);
  const sf=u.side&&/[ABC]$/.test(u.name)?u.name.slice(-1):'';if(sf){const t=document.createElement('b');t.textContent=sf;d.appendChild(t);}if(!i){const n=document.createElement('em');n.textContent='NEXT';d.appendChild(n);}o.appendChild(d);});}
function pop(u,txt,col='#fff',small,kind='',el){const d=document.createElement('div');const tx=String(txt),dg=!small&&/^[+\-]?\d+$/.test(tx);d.className='pop'+(small?' s':'')+(dg?' dg':'')+(kind?' '+kind:'');
 if(dg){d.style.setProperty('--c',col);d.style.setProperty('--c2',shadeHex(col.length===7?col:'#ffffff',.55));if(el&&ELC[el]){const b=document.createElement('i');b.className='pe';b.textContent=el;b.style.background=ELC[el];d.appendChild(b);}
  [...tx].forEach((ch,i)=>{const e=document.createElement('span');e.textContent=ch;e.style.animationDelay=i*.035+'s';d.appendChild(e);});}else{d.textContent=tx;d.style.color=col;}
 const n=(u._pn=(u._pn||0)+1);setTimeout(()=>{u._pn=Math.max(0,(u._pn||1)-1);},650);const ox=dg?((n-1)%3-1)*15:0,oy=dg?-((n-1)%4)*7:0;
 d.style.left=(u.x+8*u.sc)*SC+ox+'px';d.style.top=(u.y+(u.side?6:2)*u.sc/2)*SC+oy+'px';$('#pops').appendChild(d);setTimeout(()=>d.remove(),1500);}
function comboAdd(d){if(!B.combo)return;B.combo.n++;B.combo.tot+=d;if(B.combo.n<2)return;let c=$('#combo');if(!c){c=document.createElement('div');c.id='combo';$('#stage').appendChild(c);}
 c.innerHTML=`<b>${B.combo.n}</b>HITS<span>${B.combo.tot}</span>`;c.style.display='block';c.classList.remove('bump');void c.offsetWidth;c.classList.add('bump');}
function comboEnd(){B.combo=null;const c=$('#combo');if(c)setTimeout(()=>{if(!B||!B.combo)c.style.display='none';},900);}
/* ===== 第5章：沈んだ王都 ===== */
const SETS={royal:{n:'王家の遺品',b2:{mhpP:10,defP:10},b4:{awDmg:25,startAG:20},d2:'最大HP+10%・防御+10%',d4:'星臨中与ダメ+25%・開始時AG+20'}};
const ROYAL={head:'王家の冠',body:'王家の鎧',sub:'王家の盾',acc:'王家の指輪'};ITYPE.unshift(['冠','circ'],['盾','shield']);
function royalItem(slot,ilv){const it=genItem(ilv,0,0,slot,3);if(slot==='sub'){it.base={def:Math.round(5+ilv*1.3)};}it.set='royal';it.name=ROYAL[slot];return it;}
const royalRand=ilv=>royalItem(['head','body','sub','acc'][Math.random()*4|0],ilv);
for(const[k,b,pal]of[['drowned','gald',{a:'#3a6a6a',A:'#1a3a3a',r:'#2a5a7a',R:'#103040',s:'#7a9a9a',d:'#1a3a3a',y:'#6ac0c0',e:'#40ffff'}],['jelly','shroom',{r:'#e070c0',R:'#8a3070',w:'#c0e0ff',e:'#203060'}],
 ['waterslime','slime',{v:'#3a8ad0',V:'#1a4a7a',p:'#8ad0ff'}],['boss6','noah',{w:'#2a4a7a',k:'#a0d0ff',y:'#40e0ff',s:'#a0b8d0',q:'#1a2a4a',e:'#40ffff'}]]){SPR[k]=SPR[b];IMG[k]=mk(SPR[b],pal);IMG[k+'_w']=mk(SPR[b],null,'#ffffff');}
Object.assign(EA,{deluge:{n:'大海嘯',el:'氷',k:'mag',pow:2.5,t:'all'},tide:{n:'潮の刃',el:'氷',k:'mag',pow:1.2,t:'one'}});
Object.assign(ED,{
 drowned:{name:'溺れた近衛',mhp:260,atk:80,def:30,mag:20,res:18,spd:11,weak:['雷','光'],xp:40,gold:30,drop:[['kiba',.3],['kakera',.2]],acts:[['slash2',.6],['claw',.4]],flip:1},
 jelly:{name:'大海月',mhp:200,atk:40,def:18,mag:84,res:16,spd:12,weak:['雷','斬'],xp:38,gold:28,drop:[['kakera',.3]],acts:[['tide',.6],['spore',.4]]},
 waterslime:{name:'水精スライム',mhp:210,atk:66,def:26,mag:60,res:22,spd:9,weak:['雷','地'],xp:36,gold:26,drop:[['haiseki',.5]],acts:[['claw',.5],['tide',.5]]},
 boss6:{name:'沈みし女王',mhp:14000,atk:300,def:80,mag:340,res:80,spd:16,weak:['雷','光'],sc:3,boss:true,xp:5200,gold:6000,drop:[['kakera',1],['kakera',1],['kakera',1],['kakera',1],['kakera',1]],
  ai:{every:3,charge:'deluge',acts:[['curse',.35],['tide',.35],['icewave',.3]],summon:'drowned',sumLv:36},ilv:37,flip:1}});
const MAP6=["####################","#ooooooo#oBo#ooooCo#","#ooooooo#ooo#oooooo#","#oooCooo##o##oooooo#","#oooooooooooooooooo#","#wwwwww#wwwwww#wwww#","#wwwwww#wwwwww#wwww#","#ooooooooooooooooLo#","#oo~~~oooooooo~~~oo#","#oo~~~oo####oo~~~oo#","#oooooooo#Go#oooooo#","#ooooCooo#oo#oooooo#","#oooooooooooooooooo#","#~~~~~~~~xx~~~~~~~~#","#~~~~~~~~xx~~~~~~~~#","#ooooooooooooooooCo#","#oLoooooooooooooooo#","#oooooo##oo##oooooo#","#######oooooo#######","TTTTTT#oooooo#TTTTTT","TTTTTT#ooSooo#TTTTTT","TTTTTTTTTTTTTTTTTTTT"].map(r=>r.padEnd(20,'T').slice(0,20));
AREAS.ouito={name:'沈んだ王都',map:MAP6,lv:[31,37],groups:[['waterslime'],['waterslime','jelly'],['drowned'],['jelly','jelly'],['drowned','waterslime'],['drowned','jelly','waterslime']],
 crew:[{royal:'head'},{gold:8000},{royal:'acc'},{loot:[36,3]}],boss:{kind:'boss6',lv:37},bflag:'boss6',theme:'ruin',rec:'推奨Lv31〜37',
 intro:'<b>第5章　沈んだ王都</b>――1000年前、星核を砕いた王の都。<b>レバーで水位が変わる</b>。水位が高いと橋が浮かび、低いと水路が歩ける。'};
const Q5=[{id:'q8',n:'王都の女王',d:'沈みし女王を倒す',ok:()=>!!G.flags.boss6,pg:()=>G.flags.boss6?'達成':'未達成',rw:'15000G・不死鳥の尾×2',give:()=>{G.gold+=15000;addItem('tail',2);}}];
/* ===== ジン ===== */
Object.assign(PAL,{});
SPR.jin=["................",".....dddd.......","....dddddd......","....dssdddd.....","....desdddd.....","....sssddd......",".....ssjjj......","...M.jjjjjj.....","..MM.jJjjjJs....","...M.jJjjjJ.....",".....bbbbbb.....",".....jjJjjj.....",".oo..jj..jj.....","oooo.bb..bb.....","owoo.bb..bb.....",".o.o.bbb.bbb...."];
IMG.jin=mk(SPR.jin,{j:'#6a8a4a',J:'#3a5a2a'});IMG.jin_w=mk(SPR.jin,null,'#ffffff');IMG.jin_aw=mk(SPR.jin,{j:'#d08030',J:'#8a4a10',d:'#ffb040',o:'#ffe040'});
HB.jin={name:'ジン',mhp:280,atk:40,def:26,mag:30,res:24,spd:13,g:{mhp:'A',atk:'B',def:'B',mag:'B',res:'B',spd:'B'},skills:['tsume','popo','kazekiri']};
Object.assign(SK,{tsume:{n:'爪撃',sp:15,el:'斬',k:'phys',pow:1.3,t:'one',d:'斬撃・単体'},popo:{n:'ポポ突進',sp:20,el:'打',k:'phys',pow:1.5,t:'one',d:'相棒の体当たり'},kazekiri:{n:'風切り',sp:30,el:'風',k:'phys',pow:.9,t:'all',d:'風・敵全体'},
 goga:{n:'剛牙',sp:35,el:'斬',k:'phys',pow:2.2,t:'one',d:'斬撃・単体の大技'},tatsumaki:{n:'竜巻',sp:35,el:'風',k:'phys',pow:1.1,t:'all',d:'風・敵全体'},
 juuou:{n:'獣王撃',el:'地',k:'phys',pow:1.8,t:'one',auto:['風','地'],d:'敵の弱点に合わせて地か風に変わる'},shippuuga:{n:'疾風牙',el:'風',k:'phys',pow:1,t:'all',d:'風・敵全体'},
 houkou:{n:'咆哮',k:'roar',t:'all',d:'敵全体の行動を遅らせ、味方のAG+15'}});
AW.jin={name:'獣魂合一',type:'ターン制',turns:4,cmds:['juuou','shippuuga','houkou']};AWD.jin='相棒ポポと合体。攻撃と素早さ+30%、獣王撃は敵の弱点に合わせて属性が変わる';
BDEF.jin=mkB('獣王座',[['atkP'],['mhpP'],['spd'],['defP'],['crit'],['resP']],['3,-2','-2,-1','-2,3','2,1'],'goga','tatsumaki',[[{atkP:12},'猛獣：攻撃+12%'],[{mhpP:15},'巨躯：最大HP+15%'],[{awDmg:20},'野生：星臨中与ダメ+20%'],[{spd:2},'俊足：素早さ+2']]);
BOARD.jin=buildBoard('jin');IIS.claw=["","..m...m...m.","..m...m...m.","..mm..mm..mm","...mM..mM..M","....MMMMMMM.","....MbbbbbM.",".....bbbbb..",".....bbbbb.."];ITYPE.unshift(['爪','claw']);
Object.assign(RESO,{'jin,rio':'獣灯の咆哮','gald,jin':'大地の守護獣','jin,shion':'疾風双牙'});
function jinEvent(){F.pause=true;banner('ジン','#d08030');
 log('月明かりの下、怪我をした小さな獣を抱えた男がいた。<br><b>ジン</b>「おっと、驚かせたか。こいつはポポ、俺の相棒さ。……あんたら、虚蝕を追ってるんだろ？ 夜の森で助けてもらった礼だ、ついて行くよ」');
 menu([{l:'仲間にする',cls:'ready',f:()=>{G.flags.jinMet=1;newMember('jin');SFX.aw();save();fieldMenu('<b>ジンが仲間になった！</b>'+(G.party.includes('jin')?'':'（控えに入った）'));renderPartyStatic();}},
  {l:'今はやめる',f:()=>{G.flags.jinMet=1;G.declined=[...(G.declined||[]),'jin'];save();fieldMenu('ジン「そうか。酒場で待ってるぜ」');}}]);}

MAP2[19]=MAP2[19].slice(0,18)+'n'+MAP2[19].slice(19);MAP2[20]=MAP2[20].slice(0,17)+'TJ'+MAP2[20].slice(19);
AREAS.midori.intro+='<br><small>夜になると、月明かりの小道が現れるらしい……</small>';
