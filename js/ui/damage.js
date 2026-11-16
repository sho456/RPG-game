/* ===== 戦闘のダメージ表示の書体（TX24 の書式の最終定義。ロマサガRS の録画に合わせた） =====
 正本：数字・見出しの書式＝ここ／出し方（まとまり・大きさの比 LBK）＝js/v24.js dmgPop・addLabels／動き＝css/ui/damage.css。
 v25.js・v29.js が書き換えていた数字・Critical・Weak・Resist・Guard・属性の書式は、ここで最終的に置き換える（読み込みは最後）。
 ・数字：Barlow Semi Condensed の斜体（太字・細身）。白＋濃い縁（ver0.47）
 ・Critical＝金／Weak＝赤みの金属／Resist＝青い鋼／Guard＝銀青：上下の明暗が強いクロム調（水平線で暗帯に切り替え）＋白いハイライト線＋濃い縁
 ・属性の漢字：毛筆の書体 Yuji Boku（太く迫力がある）。別の書体にするなら FONT.brush を差し替える */
'use strict';
(()=>{
const T=TX24,F=T.FONT,S=T.STYLE;
/* ver0.47：数字は細身で詰めやすい斜体（Barlow Semi Condensed の Italic）。桁どうしは重ならない（battle-pop が字の送り幅どおりに並べる） */
Object.assign(F.num,{f:'"Barlow Semi Condensed","Arial Narrow","Roboto Condensed",sans-serif',w:800,it:'italic',cap:.72,skew:0});
Object.assign(F.lat,F.num);
const sh=[.04,.075,'rgba(0,0,0,.65)'];
/* 数字 */
const W={font:'num',fill:[[0,'#ffffff'],[.5,'#ffffff'],[.58,'#e9edf8'],[1,'#b8c2da']],ow:.12,oc:'#0a0d18',sh};
for(const k of['dmg','dmgH','dmgG','dmgW','dmgT','dmgWT'])S[k]=Object.assign({},W);
S.dmgT.glow=S.dmgWT.glow='rgba(255,230,160,.7)';
S.heal=Object.assign({},S.heal,{font:'num',ow:.11});S.psn=Object.assign({},S.psn,{font:'num',ow:.11});
/* 金属の見出し：[0,明るい空][.4,中間][.5,水平線の手前][.53,暗帯][.72,反射][.92,下の照り返し] */
const metal=(c,o={})=>Object.assign({font:'num',fill:c,ow:.1,oc:'#120a02',rw:.035,rc:'#fff8dc',sh,gl:.3,ln:[.2,.85]},o);
S.crit=metal([[0,'#fffbe0'],[.3,'#ffe27a'],[.47,'#e0a41c'],[.5,'#8a5200'],[.54,'#4e2c00'],[.72,'#c4821a'],[.9,'#ffe48a'],[1,'#e8b030']],{oc:'#241200',glow:'rgba(255,190,60,.5)'});
S.weak=metal([[0,'#ffe4dc'],[.3,'#ff8a72'],[.47,'#d8281e'],[.5,'#7a0a0a'],[.54,'#3e0000'],[.72,'#b01818'],[.9,'#ff9078'],[1,'#d83028']],{oc:'#2a0206',rc:'#ffeee8',glow:'rgba(255,70,50,.45)'});
S.resist=metal([[0,'#ffffff'],[.3,'#c4deff'],[.47,'#6aa0ee'],[.5,'#2a54a8'],[.54,'#1c3c82'],[.72,'#5a94e4'],[.9,'#cce4ff'],[1,'#78acf0']],{oc:'#0a1640',rc:'#f4faff',glow:'rgba(90,150,255,.5)'});
S.guard=metal([[0,'#f4feff'],[.3,'#b4eaf8'],[.47,'#5ab8dc'],[.5,'#1a4a68'],[.54,'#0c2a40'],[.72,'#3a8cb8'],[.9,'#c0f0ff'],[1,'#5cb4d8']],{oc:'#04141e',rc:'#f4ffff'});
S.miss=metal([[0,'#ffffff'],[.3,'#e6eaf2'],[.47,'#a8b0c0'],[.5,'#4c5468'],[.54,'#2c3242'],[.72,'#8a92a6'],[.9,'#e4e8f2'],[1,'#a0a8bc']],{oc:'#101218',rc:'#fff'});
/* 属性の漢字：毛筆。明るい金白の塗り＋太い濃い縁（筆のかすれが縁に埋もれないよう縁は細め） */
F.brush=Object.assign({},F.brush,{f:'"Yuji Boku","Yuji Syuku","Yuji Mai","Hiragino Mincho ProN","Yu Mincho",serif',w:400,it:'normal',cap:.84,skew:0});
S.elm={font:'brush',fill:[[0,'#ffffff'],[.5,'#fff4d0'],[.62,'#ffd070'],[1,'#e8902c']],ow:.09,oc:'#1a0a10',rw:.02,rc:'#fff',sh:[.04,.07,'rgba(0,0,0,.7)'],glow:'rgba(255,120,60,.5)',gl:.2};
T.clear();T.preload();
})();
