/* ===== 装備品の詳細（EQINFO：装備アイコンのタップで出るポップアップの正本。新規） ===== */
/* 開き方：EQINFO.open(it,{onClose})。アイコン（[data-eqi=uid]）のタップは下の委譲で全画面から拾う（装備枠・選択一覧・持ち物・道具カード）。
   データ：基本性能=itemBase(it)＋it.ops／属性耐性=it.elres（無ければ 0）／能力影響=基本値を 7 能力に当てはめ（rs/core の s7 と同じ対応）＋素早さ op
   アビリティ=V20.wpOf（武器パッシブ）・LEG（レジェンド）・SETS（セット）・ops の atkEl・ソケット石 */
const EQINFO=(()=>{
const ELS=['斬','打','突','熱','冷','雷','陽','陰'],ELC={斬:'#c9d2e8',打:'#e0a060',突:'#8fd0ff',熱:'#ff6a4a',冷:'#6ad8ff',雷:'#ffe04a',陽:'#ffd98a',陰:'#b080ff'};
const S7=[['str','腕力'],['vit','体力'],['dex','器用さ'],['agi','素早さ'],['int','知力'],['wil','精神'],['cha','魅力']];
const TAG={w:'武器',main:'主防具',sub:'副防具',head:'頭',body:'体',acc:'装飾品',acc1:'装飾品',acc2:'装飾品'};
const BNM={atk:'攻撃力',def:'防御力',mag:'魔力',res:'精神',mhp:'最大HP',spd:'素早さ'};
const sg=v=>v>0?'p':v<0?'n':'z',fm=v=>v>0?'+'+v:''+v;
let prev=null;
function s7Of(it){const b=itemBase(it),o={str:b.atk||0,vit:b.def||0,dex:0,agi:Math.round((b.spd||0)*3),int:b.mag||0,wil:b.res||0,cha:0};
 for(const op of it.ops||[])if(op.k==='spd')o.agi+=Math.round(op.v*3);return o;}
function abilities(it){const a=[];if(it.unid)return a;let w=null;try{w=V20.wpOf(it);}catch(e){}
 if(w)a.push({n:w.n,d:w.d,t:'武器'});
 if(it.leg&&LEG[it.leg])a.push({n:LEG[it.leg].n,d:LEG[it.leg].d,t:'レジェンド'});
 if(it.set&&SETS[it.set])a.push({n:SETS[it.set].n,d:'2部位：'+SETS[it.set].d2+'／4部位：'+SETS[it.set].d4,t:'セット'});
 for(const op of it.ops||[])if(op.k==='atkEl')a.push({n:op.v+'属性付与',d:'通常攻撃が'+op.v+'属性になる',t:'特殊'});
 (it.sock||[]).forEach(k=>{if(k&&STONES[k])a.push({n:STONES[k].n,d:Object.entries(STONES[k].v).map(([x,v])=>OPS[x][0]+'+'+v+'%').join('・'),t:'石'});});
 return a;}
function html(it){const rc=RAR[it.rar].c,unid=it.unid,b=unid?{}:itemBase(it),s7=s7Of(it),el=it.elres||{};
 const ops=unid?[]:(it.ops||[]).filter(o=>o.k!=='atkEl').map(opTxt),ab=abilities(it);
 const base=Object.entries(b).map(([k,v])=>`<div class="ei-c"><span>${BNM[k]||BN[k]}</span><b>${v}</b></div>`).join('');
 return`<div class="eqi r${it.rar}" style="--rc:${rc}">
 <div class="ei-hd"><span class="ei-tag">${TAG[it.slot]||'装備'}</span><span class="ei-nm">${iname(it)}</span></div>
 <div class="ei-ic"><img src="${itemIcon(it)}"><em>${RAR[it.rar].n}${unid?'':'　Lv'+it.ilv}</em></div>
 ${unid?'<div class="ei-note">未鑑定です。街の鑑定屋で鑑定すると効果が分かります</div>':`
 <div class="ei-sec">基本性能</div><div class="ei-g2">${base||'<div class="ei-c"><span>なし</span></div>'}</div>
 ${ops.length?`<div class="ei-ops">${ops.map(x=>`<span>${x}</span>`).join('')}</div>`:''}
 <div class="ei-sec">属性耐性</div><div class="ei-g4">${ELS.map(e=>{const v=el[e]||0;return`<div class="ei-e"><i class="hx" style="--c:${ELC[e]}">${e}</i><b class="${sg(v)}">${fm(v)}</b></div>`;}).join('')}</div>
 <div class="ei-sec">能力影響</div><div class="ei-g2">${S7.map(([k,n])=>`<div class="ei-c"><span>${n}</span><b class="${sg(s7[k])}">${fm(s7[k])}</b></div>`).join('')}</div>
 <div class="ei-sec">アビリティ</div>${ab.length?ab.map(a=>`<div class="ei-ab"><span class="ei-ai">${a.t}</span><div><b>${a.n}</b><small>${a.d}</small></div></div>`).join(''):'<div class="ei-none">なし</div>'}`}
 <button class="tbtn back wide" data-a="eqiClose">閉じる</button></div>`;}
function close(cb){const sh=$('#sheet');if(prev){sh.innerHTML=prev.h;SACT=prev.a;sh.style.display='flex';}else ovClose();prev=null;if(cb)cb();}
function open(it,o){o=o||{};if(!it)return;const sh=$('#sheet');
 if(!prev&&sh.style.display==='flex'&&!sh.querySelector('.eqi'))prev={h:sh.innerHTML,a:SACT};
 ovOpen(html(it),{eqiClose:()=>close(o.onClose)});}
/* アイコン（[data-eqi]）のタップを、各画面の行・枠のタップより先に拾う（持ち主の無い見本は拾わず元の動きに任せる） */
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('[data-eqi]');if(!t)return;const it=findItem(+t.dataset.eqi);if(!it)return;
 e.stopPropagation();e.preventDefault();SFX.sel();open(it);},true);
return{open,html};})();
