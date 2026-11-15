/* ===== 装備品の詳細（EQINFO：装備アイコンのタップで出るポップアップの正本。新規） ===== */
/* 開き方：EQINFO.open(it,{onClose})。アイコン（[data-eqi=uid]）のタップは下の委譲で全画面から拾う（装備枠・選択一覧・持ち物・道具カード）。
   データ：属性耐性=ELR.of(it)（js/data/resist.js）／能力影響=EQ7.of(it)（基礎ステータス 8 つ。ver0.45）
   アビリティ=V20.wpOf（武器パッシブ）・LEG（レジェンド）・SETS（セット）・ops の atkEl・ソケット石 を 1 つの枠に「印＋名前＋効果」の行で並べる */
const EQINFO=(()=>{
const ELS=ELR.ELS;
const TAG={w:'武器',main:'主防具',sub:'副防具',head:'頭',body:'体',acc:'装飾品',acc1:'装飾品',acc2:'装飾品'};
/* アビリティ欄の種類ごとの印（小さな丸い印の文字と色） */
const AI={武器:['武','#ff9a5a'],レジェンド:['★','#ffc84a'],セット:['組','#7fe0a8'],属性:['付','#c79bff'],石:['◇','#7fb8ff']};
const sg=v=>v>0?'p':v<0?'n':'z',fm=v=>v>0?'+'+v:''+v;
let prev=null;
/* 能力影響（ver0.45：基礎ステータスだけ）：最大HP・腕力・体力・器用さ・素早さ・知力・精神・魅力の 8 つ（EQ7.of＝基本値＋付加能力）。0 は薄く */
function effects(it){const v=EQ7.of(it),op=new Set((it.ops||[]).map(o=>o.k));return EQ7.K8.map(k=>({n:EQ7.N8[k],t:fm(v[k]),c:sg(v[k]),op:op.has(k)}));}
function abilities(it){const a=[];if(it.unid)return a;let w=null;try{w=V20.wpOf(it);}catch(e){}
 if(w)a.push({n:w.n,d:w.d,t:'武器'});
 if(it.leg&&LEG[it.leg])a.push({n:LEG[it.leg].n,d:LEG[it.leg].d,t:'レジェンド'});
 if(it.set&&SETS[it.set])a.push({n:SETS[it.set].n,d:'2部位：'+SETS[it.set].d2+'／4部位：'+SETS[it.set].d4,t:'セット'});
 for(const op of it.ops||[])if(op.k==='atkEl')a.push({n:op.v+'属性付与',d:'通常攻撃が'+op.v+'属性になる',t:'属性'});
 (it.sock||[]).forEach(k=>{if(k&&STONES[k])a.push({n:STONES[k].n,d:Object.entries(STONES[k].v).map(([x,v])=>OPS[x][0]+'+'+v+'%').join('・'),t:'石'});});
 return a;}
function html(it){const rc=RAR[it.rar].c,unid=it.unid,el=unid?{}:ELR.of(it),ab=abilities(it);
 return`<div class="eqi r${it.rar}" style="--rc:${rc}">
 <div class="ei-hd"><span class="ei-tag">${TAG[it.slot]||'装備'}</span><span class="ei-nm">${iname(it)}</span></div>
 <div class="ei-ic"><img src="${itemIcon(it)}"><em>${RAR[it.rar].n}${unid?'':'　Lv'+it.ilv}</em></div>
 ${unid?'<div class="ei-note">未鑑定です。街の鑑定屋で鑑定すると効果が分かります</div>':`
 <div class="ei-sec">属性耐性</div><div class="ei-g4">${ELS.map(e=>ELR.chip(e,null,el[e]||0)).join('')}</div>
 <div class="ei-sec">能力影響</div><div class="ei-g2">${effects(it).map(x=>`<div class="ei-c${x.op?' op':''}"><span>${x.n}</span><b class="${x.c}">${x.t}</b></div>`).join('')}</div>
 <div class="ei-sec">アビリティ</div>${ab.length?`<div class="ei-abs">${ab.map(a=>{const m=AI[a.t];return`<div class="ei-ab"><i class="ei-ai" style="--c:${m[1]}">${m[0]}</i><div><b>${a.n}</b><small>${KW.markT(a.d)}</small></div></div>`;}).join('')}</div>`:'<div class="ei-none">なし</div>'}`}
 <button class="tbtn back wide" data-a="eqiClose">閉じる</button></div>`;}
function close(cb){const sh=$('#sheet');if(prev){sh.innerHTML=prev.h;SACT=prev.a;sh.style.display='flex';}else ovClose();prev=null;if(cb)cb();}
function open(it,o){o=o||{};if(!it)return;const sh=$('#sheet');
 if(!prev&&sh.style.display==='flex'&&!sh.querySelector('.eqi'))prev={h:sh.innerHTML,a:SACT};
 ovOpen(html(it),{eqiClose:()=>close(o.onClose)});}
/* アイコン（[data-eqi]）のタップを、各画面の行・枠のタップより先に拾う（持ち主の無い見本は拾わず元の動きに任せる） */
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('[data-eqi]');if(!t)return;const it=findItem(+t.dataset.eqi);if(!it)return;
 e.stopPropagation();e.preventDefault();SFX.sel();open(it);},true);
return{open,html};})();
