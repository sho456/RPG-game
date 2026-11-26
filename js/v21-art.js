/* ===== ver0.21 装備・アイテムのデザイン定義 =====
 武器（m:'d'）：行＝幅のレーン（上ほど光の当たる側）、列＝柄頭(左)→切っ先(右)。45°の斜めに写して描く
 対称（m:'m'）：左半分12列だけ描く。右半分は反転し、明色は暗色になる
 平面（m:'f'）：そのまま／dr：図形で描く関数
 色：スロット0〜5の「明・中・暗」＝ abc def ghi jkl mno pqr ／ A〜F＝最暗 ／ w 白 s 淡白 x 黒 */
'use strict';
{const D=IC21.def;
/* ===================== 剣（リオ） ===================== */
/* 銅：短く幅広い木の葉形の刃。革巻きの柄、真鍮の丸い柄頭 */
D('sword_銅',['#d48a4e','#7a4a2a','#c89a3a'],'d',[
'....g............',
'....g............',
'....h.....aaa....',
'gg..h.aaaaaaaa...',
'hdedhbbbbbbbbbbba',
'hh..h.bbbbbbbbbb.',
'....h.....ccc....',
'....i............',
'....i............']);
/* 鉄：まっすぐな両刃。横一文字の鍔、針金巻きの柄 */
D('sword_鉄',['#b8c0cc','#5a3a26','#8a8a96'],'d',[
'.....g...........',
'.....g...........',
'.....h...........',
'gg...h.aaaaaaaaa.',
'hdeddhbbbbbbbbbbw',
'hh...h.ccccccccc.',
'.....h...........',
'.....i...........',
'.....i...........']);
/* 鋼：長い刃に血溝。刃先へ反る鍔、青い宝玉の柄頭 */
D('sword_鋼',['#e6eefa','#2a2a50','#c8a040','#3a8ae8'],'d',[
'.......g.........',
'......g..........',
'.....h...........',
'jj...h.aaaaaaaaa.',
'kdedehbbcccccccbw',
'kk...h.bbbbbbbbb.',
'.....h...........',
'......i..........',
'.......i.........']);
/* 星鋼：水晶のように透ける刃（光側は金、影側は空色）。星形の鍔と桃色の宝玉 */
D('sword_星鋼',['#fff4c8','#4a2a6a','#ffd040','#ff5a8a','#9fe0ff'],'d',[
'.....g.g.........',
'......g..........',
'....g.h.g..m.....',
'jj...hh.aaaaaaaa.',
'kdedehhwbbbbbbbbw',
'kk...hh.nnnnnnnn.',
'....i.h.i..n.....',
'......i..........',
'.....i.i.........'],{glow:'#ffe27a',ga:70,sp:1,spc:'#ffe27a'});
/* レジェンド「処刑人の刃」：先が四角い肉厚の大包丁。骨の柄、紅の血溝 */
D('L_shokei',['#6a6878','#e8dcc0','#4a4250','#c02838'],'d',[
'......g..........',
'......g.aaaaaaaaa',
'......h.bbbbbbbbb',
'jj....h.bjjjjjjbb',
'kdededhbbbbbbbbbb',
'kk....h.bbbbbbbbb',
'......h.ccccccccc',
'......i..........',
'......i..........']);
/* 専用「灯継ぎの剣」：琥珀に灯る刃。翼の鍔、刃の影側に炎がゆらめく */
D('L_uq_rio',['#ffe9a8','#3a5ab0','#e8a830','#ff7a30'],'d',[
'......g.g........',
'.....g.g.........',
'......hh..j..j...',
'dd....hh.aaaaaaa.',
'edeeehhwwbbbbbbbw',
'ee....hh.kkkkkkk.',
'......hh..k..k...',
'.....i.i.........',
'......i.i........'],{glow:'#ffb040',ga:90});
/* ===================== 大剣（ガルド） ===================== */
/* 銅：分厚く短い幅広の刃。素朴な横鍔 */
D('gsword_銅',['#c88048','#6a4428','#a8783a'],'d',[
'.....g..........',
'.....g..........',
'.....h..........',
'.....h.aaaaaa...',
'gg...hbaaaaaaaa.',
'hdedehbbbbbbbbbb',
'hh...hbbbbbbbbb.',
'.....hcccccccc..',
'.....h..........',
'.....i..........',
'.....i..........']);
/* 鉄：根元の細い刃元（リカッソ）から広がるクレイモア。刃先へ傾く鍔 */
D('gsword_鉄',['#b0b8c6','#4a3a30','#7a7c88'],'d',[
'......g.........',
'......g.........',
'.....h..........',
'.....h...aaaaaa.',
'gg...hbbaaaaaaa.',
'hdeddhbbbbbbbbbw',
'hh...hbbbbbbbbb.',
'.....h...cccccc.',
'.....h..........',
'......i.........',
'......i.........']);
/* 鋼：さらに巨大な刃に青く光る溝。棘のある鍔 */
D('gsword_鋼',['#dce6f4','#2a3050','#9aa0b0','#4aa0ff'],'d',[
'.....g.g.......',
'......g........',
'.....hh..aaaa..',
'.....h.aaaaaaa.',
'jj...hbaaaaaaaa',
'kdedehbkkkkkkbw',
'kk...hbbbbbbbb.',
'.....h.ccccccc.',
'.....hh..cccc..',
'......i........',
'.....i.i.......']);
/* 星鋼：波打つ炎の刃（フランベルジュ）。金と白、鍔に星の宝玉 */
D('gsword_星鋼',['#fff8dc','#5a2a5a','#ffcc40','#ff5a8a','#ffe9a0'],'d',[
'.....g.........',
'....g.g........',
'.....h...a..a..',
'.....h..aaaaaa.',
'jj...hbaaaaaaaa',
'kdedehjbbbbbbbw',
'kk...hbbbbbbbb.',
'.....h..nnnnnn.',
'.....h....n..n.',
'....i.i........',
'.....i.........'],{glow:'#ffe27a',ga:70,sp:1,spc:'#ffe27a'});
/* 専用「誓約の大剣」：誓いの十字を刻んだ幅広の刃。柄に赤い布を結ぶ */
D('L_uq_gald',['#d8e0ec','#c8343c','#e8c040','#3a6ac8'],'d',[
'.....gg........',
'....gh.........',
'....h...aaaaa..',
'....h..aaaaaaa.',
'gg..h.baaakaaaa',
'hdedhhbbbkkkbbw',
'hd..h.bbbbkbbbb',
'.e..h..ccccccc.',
'.d..h...ccccc..',
'....hi.........',
'.....ii........'],{glow:'#9fc0ff',ga:70});
/* ===================== 双剣（シオン） ===================== */
/* 双剣は2本を交差させて平面で描く */
const X2=(a,b,o)=>(t,M)=>{a(t,M);b(t,M);if(o)o(t,M);};
const dag=(x0,y0,dir,len,bl,gr,gd,ex)=>(t,M)=>{/* dir=1:右上へ / -1:左上へ */const s=dir;
 for(let i=0;i<4;i++){t.px(x0+s*i,y0-i,M[gr[i%gr.length]]);}
 const gx=x0+s*4,gy=y0-4;for(const[u,v]of[[-1,-1],[1,1],[-2,-2],[2,2]])t.px(gx+(s>0?u:-u),gy+(s>0?-v:v)*-1,M[gd]);t.px(gx,gy,M[gd]);
 for(let i=1;i<=len;i++){const x=gx+s*i,y=gy-i;t.px(x,y,M[bl[1]]);t.px(x+(s>0?0:0),y-1,M[bl[0]]);if(i<len)t.px(x+s,y,M[bl[2]]);}
 t.px(gx+s*(len+1),gy-len-1,M.w);if(ex)ex(t,M,gx,gy,s);};
/* 銅：短い2本の小刀。紐巻きの柄 */
D('dual_銅',['#d48a4e','#8a5a3a','#b08a3a'],'f',[],{dr:X2(dag(4,20,1,9,'abc','de','g'),dag(19,20,-1,9,'abc','de','g'))});
/* 鉄：内側に反ったククリ形 */
D('dual_鉄',['#b8c0cc','#4a3428','#7a7c88'],'f',[
'.......................',
'..a...............a....',
'..ab.............ba....',
'...bb...........bb.....',
'...bbb.........bbb.....',
'....bbc.......cbb......',
'.....bbc.....cbb.......',
'......bbc...cbb........',
'.......bbcwcbb.........',
'........bcxcb..........',
'.........gxg...........',
'........gg.gg..........',
'.......de...ed.........',
'......de.....ed........',
'.....de.......ed.......',
'....ee.........ee......',
'...gg...........gg.....']);
/* 鋼：細身の刺突短剣。輪の鍔、青い房 */
D('dual_鋼',['#e6eefa','#2a2a50','#c8a040','#3a8ae8'],'f',[
'..w.................w..',
'...a...............a...',
'....a.............a....',
'.....b...........b.....',
'......b.........b......',
'.......b.......b.......',
'........b.....b........',
'.........b...b.........',
'.......ggghxhggg.......',
'.......g..hxh..g.......',
'.......gggdxdggg.......',
'.........e...e.........',
'........e.....e........',
'.......d.......d.......',
'......jj.......jj......',
'.....kk.........kk.....',
'....k.k.........k.k....']);
/* 星鋼：風を切る三日月の刃。緑のリボン */
D('dual_星鋼',['#f4fff8','#2a4a3a','#ffd040','#3ad08a','#9fe0ff'],'f',[
'.aa.................aa.',
'..aab.............baa..',
'...abb...........bba...',
'....bbn.........nbb....',
'.....bbn.......nbb.....',
'......bnn.....nnb......',
'.......bnn...nnb.......',
'........gnn.nng........',
'.......gg.whw.gg.......',
'........gghxhgg........',
'..........dxd..........',
'.........k...k.........',
'........kkd.dkk........',
'.......kk.d.d.kk.......',
'......k...d.d...k......',
'.........d...d.........',
'........gg...gg........'],{glow:'#7af0c0',ga:70,sp:1,spc:'#9fffd0'});
/* 専用「家族の双剣」：大小ちぐはぐの2本。小さい方に子どもたちのお守りの紐 */
D('L_uq_shion',['#e8f0f8','#3aa868','#e8c040','#ff8a9a','#6a4a3a'],'f',[
'....................w..',
'...................a...',
'..w...............a....',
'...a.............ab....',
'....a...........abb....',
'.....b.........abb.....',
'......b.......bbc......',
'.......b.....bbc.......',
'........g...bbc........',
'.......ghg.bbc.........',
'........ehggcg.........',
'.......e..gxhg.........',
'......jj..eg.g.........',
'.....jkj.ee............',
'......j.ee.............',
'.......dd..............',
'......gg...............'],{glow:'#9fffc0',ga:70});
/* ===================== 魔導書（ミレイユ） ===================== */
/* 本の共通形：表紙(色0)・頁(色1)・飾り(色2)・紋(色3) */
const book=(o)=>(t,M)=>{const L=3,T=2+(o.t||0),R=19,Bm=20;
 t.rect(L,T,R-L+1,Bm-T+1,M.b);t.rect(L,T,R-L+1,1,M.a);t.rect(L,T,2,Bm-T+1,M.c);/* 背 */
 t.rect(R+1,T+1,2,Bm-T,M.e);t.rect(R+1,T+1,1,Bm-T,M.d);for(let y=T+2;y<Bm;y+=2)t.px(R+2,y,M.f);t.rect(L+2,Bm+1,R-L+1,1,M.e);t.rect(L+2,Bm+2,R-L+1,1,M.f);
 if(o.dr)o.dr(t,M,L,T,R,Bm);};
/* 銅：茶色の革表紙、銅の角金具と留め帯 */
D('tome_銅',['#8a5a34','#f0e6c8','#d48a4e','#5a3a22'],'f',[],{dr:book({dr:(t,M,L,T,R,B)=>{for(const[x,y]of[[L+2,T],[R-2,T],[L+2,B-2],[R-2,B-2]])t.rect(x,y,3,3,M.h);t.px(L+2,T,M.g);t.px(R-2,T,M.g);
 t.rect(R-3,10,5,3,M.k);t.rect(R-2,11,2,1,M.g);t.rect(L+6,6,6,6,M.c);t.rect(L+7,7,4,4,M.a);t.px(L+8,8,M.b);}})});
/* 鉄：分厚い鉄色の書。鉄の帯2本と鋲 */
D('tome_鉄',['#5a6a8a','#e8e4d8','#9aa4b4','#3a4058'],'f',[],{dr:book({t:-1,dr:(t,M,L,T,R,B)=>{for(const y of[T+4,B-5]){t.rect(L,y,R-L+1,2,M.h);t.rect(L,y,R-L+1,1,M.g);for(let x=L+3;x<R;x+=4)t.px(x,y+1,M.i);}
 t.rect(L+6,T+8,8,5,M.k);t.rect(L+7,T+9,6,3,M.j);t.px(L+9,T+10,M.l);t.px(L+10,T+10,M.l);}})});
/* 鋼：紺の表紙に銀の枠と魔法陣 */
D('tome_鋼',['#2a3a8a','#eef2ff','#d8e0f0','#7ac0ff'],'f',[],{dr:book({dr:(t,M,L,T,R,B)=>{t.rect(L+3,T+2,R-L-4,1,M.h);t.rect(L+3,B-2,R-L-4,1,M.i);t.rect(L+3,T+2,1,B-T-3,M.g);t.rect(R-1,T+2,1,B-T-3,M.i);
 const cx=11.5,cy=(T+B)/2;t.ell(cx,cy,4.6,4.6,M.k);t.ell(cx,cy,3.5,3.5,M.b);t.ell(cx,cy,1.6,1.6,M.j);for(const[x,y]of[[0,-4],[0,4],[-4,0],[4,0]])t.px(Math.round(cx+x-.5),Math.round(cy+y-.5),M.w);}})});
/* 星鋼：菫色の表紙に金の唐草と大きな星。頁が淡く光る */
D('tome_星鋼',['#7a3ab0','#fff6dc','#ffd040','#ff8ad0'],'f',[],{glow:'#d0a0ff',ga:80,sp:1,spc:'#ffe27a',dr:book({dr:(t,M,L,T,R,B)=>{for(const[x,y]of[[L+2,T+1],[R-3,T+1],[L+2,B-3],[R-3,B-3]]){t.rect(x,y,3,1,M.g);t.rect(x,y,1,3,M.g);}
 const cx=11.5,cy=(T+B)/2;t.poly([[cx,cy-6],[cx+1.6,cy-1.8],[cx+6,cy-1.6],[cx+2.4,cy+1.2],[cx+3.8,cy+5.6],[cx,cy+3],[cx-3.8,cy+5.6],[cx-2.4,cy+1.2],[cx-6,cy-1.6],[cx-1.6,cy-1.8]],M.h);t.poly([[cx,cy-6],[cx-1.6,cy-1.8],[cx-6,cy-1.6],[cx,cy+1]],M.g);t.px(Math.round(cx-1),Math.round(cy-1),M.w);t.px(Math.round(cx),Math.round(cy),M.k);}})});
/* レジェンド「太陽の魔導書」：緋色の表紙に燃える日輪。頁の縁が炎色 */
D('L_taiyou',['#c8302a','#ffd890','#ffc030','#ff7a20'],'f',[],{glow:'#ff9a30',ga:110,dr:book({dr:(t,M,L,T,R,B)=>{const cx=11.5,cy=(T+B)/2;
 for(let a=0;a<12;a++){const an=a/12*6.283,r1=4.5,r2=a%2?6.5:7.5;t.line(cx+Math.cos(an)*r1,cy+Math.sin(an)*r1,cx+Math.cos(an)*r2,cy+Math.sin(an)*r2,a%2?M.k:M.h,1);}
 t.ell(cx,cy,4,4,M.h);t.ell(cx-.6,cy-.6,2.6,2.6,M.g);t.px(Math.round(cx-2),Math.round(cy-2),M.w);t.rect(R+1,T+2,1,B-T-2,M.k);}})});
/* 専用「双星の魔導書」：開いた書。左頁に炎、右頁に氷の結晶、上に双子の星 */
D('L_uq_mire',['#f4ecd8','#d84a3a','#4a9ae8','#ffd040','#6a3a8a'],'f',[],{glow:'#ffb0e0',ga:90,dr:(t,M)=>{
 t.poly([[1,9],[11,11],[11,22],[1,20]],M.b);t.poly([[22,9],[12,11],[12,22],[22,20]],M.b);t.poly([[1,9],[11,11],[11,12],[1,10]],M.a);t.rect(11,11,2,12,M.c);
 t.poly([[1,20],[11,22.5],[11,23.5],[1,21.5]],M.n);t.poly([[22,20],[12,22.5],[12,23.5],[22,21.5]],M.o);
 /* 炎 */t.poly([[6,12],[8.5,15.5],[8,19],[4,19],[3.5,16]],M.e);t.poly([[6,14],[7.5,16.5],[7,18.5],[5,18.5],[4.6,16.6]],M.d);t.px(6,17,M.w);
 /* 氷 */t.line(17,12,17,19,M.h,1);t.line(14,14,20,18,M.h,1);t.line(14,18,20,14,M.h,1);t.px(17,15,M.g);t.px(17,16,M.w);
 /* 双子星 */for(const[x,y]of[[7,3],[16,4]]){t.rect(x-2,y,5,1,M.k);t.rect(x,y-2,1,5,M.k);t.px(x,y,M.w);t.px(x-1,y-1,M.j);t.px(x+1,y+1,M.l);}}});
/* ===================== 杖（ノア） ===================== */
/* 銅：素朴な木の杖。先に銅の金具と小さな玉 */
D('staff_銅',['#9a6a3a','#d48a4e','#7fd6ff'],'d',[
'..............g...',
'.............dg...',
'aaaaaaaaaaaaadhj..',
'bbbbbbbbbbbbbdhkk.',
'cccccccccccccdekk.',
'.............de...',
'..............e...']);
/* 鉄：鉄の石突と輪の頭。輪に小さな鈴 */
D('staff_鉄',['#7a5a3a','#a8b0c0','#e8c040'],'d',[
'.............ddd..',
'............d...d.',
'aaaaaaaaaaadd...dd',
'bbbbbbbbbbbee.g.ee',
'cccccccccccee...ee',
'dd..........e...e.',
'ee...........eee..']);
/* 鋼：十字の頭に青い宝玉。銀の装飾 */
D('staff_鋼',['#5a4a6a','#e0e8f4','#3a8ae8','#e8c040'],'d',[
'..............d....',
'..............d....',
'.............ddd...',
'aaaaaaaaaajaddgddd.',
'bbbbbbbbbbkbeehhhee',
'cccccccccclceeeiee.',
'.............eee...',
'..............e....',
'..............e....']);
/* 星鋼：翼の光輪を戴く杖。宙に浮かぶ金の宝珠 */
D('staff_星鋼',['#f4f0ff','#ffd040','#ff8ad0','#9fe0ff'],'d',[
'............d.d.d....',
'...........d..d..d...',
'..........dd.....dd..',
'aaaaaaaaadd..jjj..d..',
'bbbbbbbbbbdd.jgkj.ee.',
'cccccccccce..kkkk.e..',
'..........ee.....ee..',
'...........e..e..e...',
'............e.e.e....'],{glow:'#ffe27a',ga:70,sp:1,spc:'#ffe27a'});
/* 専用「心灯の杖」：小さな灯籠を吊るした杖。中で桃色の心の灯が燃える */
D('L_uq_noah',['#f0ece0','#e8c040','#ff6a9a','#6a4a3a'],'d',[
'.............dd......',
'............d..d.....',
'............d.ddd....',
'aaaaaaaaaaaadd..ddd..',
'bbbbbbbbbbbbe.dghhd..',
'cccccccccccce.dhwhe..',
'............e.dhhie..',
'.............e.eee...',
'.................e...'],{glow:'#ff9ac8',ga:100});
/* ===================== 弓（エルナ） ===================== */
const bow=(o)=>(t,M)=>{const x0=o.x||5,cx=o.cx||16,H=o.h||10;for(let y=-H;y<=H;y++){const k=y/H,x=Math.round(x0+(cx-x0)*(1-k*k)*(o.curve||1)+(o.re&&Math.abs(y)>H-3?-(Math.abs(y)-(H-3))*1.2:0));
  t.px(x,12+y,M[Math.abs(y)<2?o.grip||'d':y<0?'a':'b']);t.px(x+1,12+y,M[Math.abs(y)<2?o.grip2||'e':y<0?'b':'c']);if(o.thick&&Math.abs(y)<H-2)t.px(x+2,12+y,M.c);}
 const sx=x0+(o.re?-2:0);t.line(sx+1,12-H+(o.re?1:0),sx+1,12+H-(o.re?1:0),M[o.str||'w'],1);if(o.dr)o.dr(t,M,x0,cx,H);};
/* 銅：短い木の弓。麻の弦 */
D('bow_銅',['#a87040','#e8dcc0','#c8a060'],'f',[],{dr:bow({x:7,cx:16,h:9,str:'d',grip:'g',grip2:'h'})});
/* 鉄：反りのある複合弓。両端に鉄の弭（ゆはず） */
D('bow_鉄',['#7a4a2a','#b8c0cc','#3a3a48'],'f',[],{dr:bow({x:6,cx:16,h:9,re:1,grip:'g',grip2:'h',str:'w',dr:(t,M,x0,cx,H)=>{t.rect(x0-1,12-H-1,2,2,M.e);t.rect(x0-1,12+H,2,2,M.f);}})});
/* 鋼：鋼の板バネの弓。握りに青い革、矢をつがえた姿 */
D('bow_鋼',['#dce6f4','#2a60c0','#e8c040','#7a4a2a'],'f',[],{dr:bow({x:6,cx:16,h:10,re:1,thick:1,grip:'d',grip2:'e',str:'w',dr:(t,M,x0,cx,H)=>{t.line(3,12,21,12,M.k,1);t.rect(20,11,2,3,M.a);t.px(22,12,M.a);t.rect(3,11,2,1,M.g);t.rect(3,13,2,1,M.g);}})});
/* 星鋼：両端に星を飾った長弓。光の弦 */
D('bow_星鋼',['#fff4c8','#ffd040','#9fe0ff','#ff8ad0'],'f',[],{glow:'#9fe0ff',ga:80,sp:1,spc:'#ffe27a',dr:bow({x:6,cx:16,h:8,re:1,thick:1,grip:'j',grip2:'k',str:'g',dr:(t,M,x0,cx,H)=>{for(const y of[12-H,12+H]){t.rect(x0-3,y,5,1,M.d);t.rect(x0-1,y-2,1,5,M.d);t.px(x0-1,y,M.w);}}})});
/* レジェンド「天弓アステリア」：三日月形の巨大な天弓。雷の弦と星の矢 */
D('L_tenkyuu',['#ffffff','#ffe14a','#4ab0ff','#c8a040'],'f',[],{glow:'#ffe14a',ga:110,dr:(t,M)=>{for(let y=-10;y<=10;y++){const k=y/10,x=Math.round(4+13*(1-k*k));t.px(x,12+y,M[y<0?'a':'b']);t.px(x+1,12+y,M.b);t.px(x+2,12+y,M[Math.abs(y)<9?'c':'b']);if(Math.abs(y)<6)t.px(x+3,12+y,M.k);}
 t.rect(15,10,3,5,M.j);t.px(16,11,M.w);for(let y=-10;y<=10;y++)t.px(5+((y&3)===1?1:(y&3)===3?-1:0),12+y,M.h);t.line(2,12,21,12,M.g,1);t.rect(20,11,1,3,M.d);t.px(22,12,M.w);t.px(21,12,M.d);}});
/* 専用「落ちぬ星の弓」：握りに留めた一つ星。流れ星の尾が弧に沿って伸びる */
D('L_uq_erna',['#3a4aa0','#ffe27a','#9fe0ff','#ffffff'],'f',[],{glow:'#9fc8ff',ga:100,dr:bow({x:6,cx:16,h:10,re:1,thick:1,grip:'d',grip2:'e',str:'h',dr:(t,M,x0,cx,H)=>{const x=cx+1;t.poly([[x,7],[x+1.5,10.5],[x+5,11],[x+2,13],[x+3,17],[x,14.6],[x-3,17],[x-2,13],[x-5,11],[x-1.5,10.5]],M.e);t.px(x,11,M.w);t.px(x-1,10,M.d);
 for(let i=0;i<6;i++)t.px(cx-2-i,4-Math.round(i*.4),M[i<2?'g':'h']);}})});
/* ===================== 斧（バルザ） ===================== */
/* 斧は柄を縦に立て、刃の形で見分ける */
/* 銅：片刃の手斧。短い木の柄に銅の刃 */
D('axe_銅',['#d48a4e','#8a5a34','#6a6a78'],'f',[
'.......gg.aa....',
'......gghbaaa...',
'......ghhbbbaa..',
'......ghhbbbbba.',
'......ghhbbbbba.',
'......gghbbbbc..',
'.......dhbccc...',
'.......de.......',
'......de........',
'......de........',
'.....de.........',
'.....de.........',
'....de..........',
'....de..........',
'...de...........',
'...ef...........',
'..ff............']);
/* 鉄：下へ長く垂れた髭（ひげ）の刃 */
D('axe_鉄',['#b0b8c6','#6a4428','#5a5a68'],'f',[
'......gg.........',
'.....gghaaaa.....',
'.....ghhbbbaa....',
'.....ghhbbbbaa...',
'.....ghhbbbbbaa..',
'.....ghhbbbbbba..',
'.....ghh.bbbbba..',
'.....ghh..bbbbb..',
'.....de....bbbc..',
'.....de.....bcc..',
'....de.......c...',
'....de...........',
'...de............',
'...de............',
'..de.............',
'..ef.............',
'..ff.............']);
/* 鋼：左右に刃を持つ両刃の戦斧（ラブリュス） */
D('axe_鋼',['#e6eefa','#3a2a20','#e8c040'],'m',[
'...........w',
'..........gg',
'...aa.....gh',
'..aabb....gh',
'.aabbbb..ggh',
'.abbbbbbbggh',
'aabbbbbbbghh',
'aabbbbbbbghh',
'.abbbbbbbggh',
'.abbbb...ggh',
'..cbb.....gh',
'...cc.....gh',
'...........e',
'...........e',
'...........d',
'...........e',
'...........e',
'...........e',
'..........gh',
'..........gg']);
/* 星鋼：三日月の大刃と槍の穂先。金の鋲と星の飾り */
D('axe_星鋼',['#fff8dc','#5a3a6a','#ffd040','#ff5a8a'],'f',[],{glow:'#ffe27a',ga:70,sp:1,spc:'#ffe27a',dr:(t,M)=>{
 t.ell(12,10,10,8.5,M.b);for(let y=0;y<24;y++)for(let x=0;x<=12;x++)t.px(x,y,0);t.ell(9.5,10,7,6.5,0);
 for(let y=2;y<19;y++){const dx=Math.sqrt(Math.max(0,1-((y+.5-10)/8.5)**2))*10;const x=Math.round(12+dx)-1;if(x>12){t.px(x,y,M.a);}}
 t.rect(10,2,2,21,M.e);t.rect(10,2,1,21,M.d);t.poly([[9.5,2],[11,0],[12.5,2]],M.a);t.rect(9,6,4,6,M.h);t.rect(9,6,4,1,M.g);t.px(10,8,M.k);t.px(11,10,M.k);t.rect(9,16,4,1,M.h);t.px(10,19,M.k);t.rect(9,21,4,2,M.h);}});
/* 専用「炉心の斧」：溶けた炉心がひび割れて光る大刃。背は鍛冶の槌 */
D('L_uq_balza',['#5a5058','#4a3020','#ff8a30','#ffe060'],'f',[],{glow:'#ff7a20',ga:110,dr:(t,M)=>{
 t.rect(9,1,3,22,M.e);t.rect(9,1,1,22,M.d);t.rect(11,1,1,22,M.f);
 t.rect(3,4,6,7,M.b);t.rect(3,4,6,1,M.a);t.rect(3,4,1,7,M.a);t.rect(8,4,1,7,M.c);
 t.poly([[12,3],[17,1],[22,2],[22,13],[17,14],[12,12]],M.b);t.poly([[17,1],[22,2],[22,4],[17,3]],M.a);t.rect(21,3,1,10,M.a);
 for(const[x,y]of[[14,5],[15,6],[16,6],[17,7],[18,8],[18,9],[19,10],[16,8],[15,9],[14,10],[17,4],[18,5]])t.px(x,y,M.h);t.px(17,7,M.j);t.px(16,6,M.k);t.px(18,9,M.k);
 t.rect(8,12,5,2,M.h);t.rect(8,12,5,1,M.g);t.rect(8,20,5,2,M.h);}});
/* ===================== 大鎌（クロウ） ===================== */
const scy=(o)=>(t,M)=>{t.line(o.x0||5,22,o.x1||16,2,M.d,1);t.line((o.x0||5)+1,22,(o.x1||16)+1,2,M.e,1);if(o.wrap)for(let i=0;i<4;i++)t.px((o.x0||5)+3+i*0+Math.round(i*.55)+2,17-i*1,M.k);
 const pts=o.blade;t.poly(pts,M.b);if(o.lit)t.poly(o.lit,M.a);if(o.edge)o.edge.forEach(([x,y])=>t.px(x,y,M.c));if(o.dr)o.dr(t,M);};
/* 銅：農具の名残がある木柄の鎌 */
D('scythe_銅',['#c8885a','#8a5a34'],'f',[],{dr:scy({x0:6,x1:15,blade:[[15,2],[17,3],[12,5],[6,9],[3,10],[7,6],[11,3.5]],lit:[[15,2],[11,3.5],[7,6],[3,10],[8,5.2],[12,3]]})});
/* 鉄：細く長い戦鎌。柄に鉄の環 */
D('scythe_鉄',['#b8c0cc','#4a3a40','#7a7c88'],'f',[],{dr:scy({x0:6,x1:16,blade:[[16,2],[18,3],[12,4.5],[5,7.5],[1,9],[5,5.5],[11,3]],lit:[[16,2],[11,3],[5,5.5],[1,9],[6,5]],dr:(t,M)=>{t.rect(13,7,3,2,M.h);t.rect(9,15,3,2,M.h);t.px(13,7,M.g);t.px(9,15,M.g);}})});
/* 鋼：髑髏の口金と、刃の付け根の棘 */
D('scythe_鋼',['#e0e8f4','#2a2438','#e8e0c8','#c8343c'],'f',[],{dr:scy({x0:5,x1:16,blade:[[16,1],[19,2],[13,4],[6,6.5],[1,9.5],[5,4.5],[11,2]],lit:[[16,1],[11,2],[5,4.5],[1,9.5],[6,4]],dr:(t,M)=>{t.rect(14,3,4,4,M.h);t.rect(14,3,4,1,M.g);t.px(15,5,M.x);t.px(17,5,M.x);t.px(16,6,M.i);t.poly([[18,3],[22,1],[19,5]],M.b);t.px(11,13,M.k);t.px(10,14,M.k);}})});
/* 星鋼：上下に刃を持つ双月の鎌 */
D('scythe_星鋼',['#fff4e0','#4a2a6a','#ffd040','#b07cff'],'f',[],{glow:'#c8a0ff',ga:80,sp:1,spc:'#ffe27a',dr:scy({x0:7,x1:15,blade:[[15,3],[18,4],[12,5.5],[6,9],[2,10],[6,6.5],[11,4]],lit:[[15,3],[11,4],[6,6.5],[2,10],[7,6]],dr:(t,M)=>{t.poly([[7,21],[5,22.5],[10,21],[16,18],[21,17.5],[16,16.5]],M.b);t.poly([[16,16.5],[10,19.5],[7,21],[13,17.5]],M.a);t.rect(13,4,3,3,M.h);t.px(14,5,M.k);t.px(11,11,M.k);}})});
/* レジェンド「冥界の大鎌」：黒紫の刃に亡者の炎。骨の柄 */
D('L_meikai',['#3a2a5a','#e8dcc0','#b07cff','#7affc8'],'f',[],{glow:'#b07cff',ga:120,dr:scy({x0:5,x1:16,blade:[[16,1],[20,2],[14,4.5],[7,7],[1,11],[4,6],[11,2.5]],lit:[[16,1],[11,2.5],[4,6],[1,11],[6,5]],dr:(t,M)=>{for(const[x,y]of[[5,8],[9,6],[13,4]]){t.px(x,y-1,M.h);t.px(x,y-2,M.g);t.px(x+1,y-3,M.k);}for(let i=0;i<5;i++)t.px(9+Math.round(i*1.1)+1,13-i*2,M.f);t.rect(15,2,3,3,M.h);t.px(16,3,M.j);}})});
/* 専用「名を刻む大鎌」：刃に刻んだ名が赤く灯る。柄に赤い飾り紐 */
D('L_uq_crow',['#5a5470','#3a2a3a','#ff4060','#e8c040'],'f',[],{glow:'#ff5a7a',ga:100,dr:scy({x0:5,x1:16,blade:[[16,1],[20,2],[13,4],[6,6.5],[1,10],[5,5],[11,2]],lit:[[16,1],[11,2],[5,5],[1,10],[6,4.5]],dr:(t,M)=>{for(const[x,y]of[[6,7],[8,6],[10,5],[12,4],[14,3]])t.px(x,y,M.h);t.px(7,7,M.g);t.px(11,5,M.g);t.rect(14,2,3,3,M.k);t.line(11,12,9,17,M.h,1);t.line(12,12,13,16,M.i,1);t.px(9,18,M.g);t.px(13,17,M.g);}})});
/* ===================== 手甲（ハクア） ===================== */
/* 拳を正面から：指の関節(色0)、甲(色0)、手首(色1) */
const fist=(o)=>(t,M)=>{t.rect(5,6,14,9,M.b);t.rect(5,6,14,2,M.a);t.rect(17,6,2,9,M.c);for(const x of[8,11,14])t.rect(x,7,1,5,M.c);t.rect(3,10,3,5,M.b);t.rect(3,10,3,1,M.a);/* 親指 */
 t.rect(6,15,12,6,M.e);t.rect(6,15,12,1,M.d);t.rect(16,15,2,6,M.f);if(o.dr)o.dr(t,M);};
/* 銅：拳に巻いた布と銅の帯 */
D('fist_銅',['#e8dcc0','#d48a4e','#a85a3a'],'f',[],{dr:fist({dr:(t,M)=>{for(const y of[8,11])t.rect(5,y,14,1,M.e);t.rect(6,17,12,2,M.h);t.rect(6,17,12,1,M.g);}})});
/* 鉄：鉄板を重ねた籠手 */
D('fist_鉄',['#a8b0c0','#5a3a2a','#6a6a78'],'f',[],{dr:fist({dr:(t,M)=>{for(const x of[6,9,12,15])t.rect(x,6,2,2,M.a);t.rect(5,12,14,1,M.c);t.rect(6,16,12,1,M.h);t.rect(6,19,12,1,M.h);for(const x of[7,11,15])t.px(x,17,M.g);}})});
/* 鋼：関節に棘、手首に青い宝玉 */
D('fist_鋼',['#e6eefa','#2a3050','#c8a040','#3a8ae8'],'f',[],{dr:fist({dr:(t,M)=>{for(const x of[6,9,12,15]){t.px(x,4,M.a);t.rect(x,5,2,1,M.b);}t.rect(6,17,12,2,M.h);t.rect(10,16,4,4,M.k);t.rect(10,16,2,2,M.j);}})});
/* 星鋼：拳に水晶の突起。金の縁取り */
D('fist_星鋼',['#fff6e0','#5a3a8a','#ffd040','#9fe0ff'],'f',[],{glow:'#9fe0ff',ga:70,sp:1,spc:'#ffe27a',dr:fist({dr:(t,M)=>{for(const x of[6,9,12,15]){t.poly([[x,6],[x+1,2],[x+2,6]],M.k);t.px(x+1,3,M.j);}t.rect(5,14,14,1,M.h);t.rect(6,17,12,1,M.h);t.px(12,18,M.k);}})});
/* レジェンド「氷河の手甲」：氷塊でできた籠手。鋭い氷柱が伸びる */
D('L_hyouga',['#bff4ff','#4a7ab0','#ffffff','#2a5a9a'],'f',[],{glow:'#7fe0ff',ga:120,dr:fist({dr:(t,M)=>{for(const[x,h]of[[5,5],[8,7],[11,6],[14,8],[17,5]]){t.poly([[x,7],[x+1,7-h],[x+2,7]],M.a);t.px(x+1,7-h+1,M.g);}t.px(9,9,M.g);t.px(13,10,M.g);t.rect(6,16,12,1,M.a);t.rect(6,18,12,1,M.k);}})});
/* 専用「雪華の手甲」：白い籠手に雪の結晶の紋、巫女の赤い組紐 */
D('L_uq_hakua',['#f4f8ff','#c8343c','#7ac8ff','#e8c040'],'f',[],{glow:'#bfe8ff',ga:100,dr:fist({dr:(t,M)=>{const cx=12,cy=10;t.line(cx-3,cy,cx+3,cy,M.h,1);t.line(cx,cy-3,cx,cy+3,M.h,1);t.line(cx-2,cy-2,cx+2,cy+2,M.h,1);t.line(cx-2,cy+2,cx+2,cy-2,M.h,1);t.px(cx,cy,M.w);
 t.rect(6,17,12,1,M.k);t.line(17,18,21,22,M.e,1);t.line(18,18,22,21,M.d,1);t.px(21,23,M.j);}})});
/* ===================== 爪（ジン） ===================== */
const claw=(o)=>(t,M)=>{t.rect(6,14,12,7,M.e);t.rect(6,14,12,1,M.d);t.rect(16,14,2,7,M.f);if(o.fur)for(let x=6;x<18;x+=2)t.px(x,21,M.k);for(const c of o.c){const[x,len,bend]=c;for(let i=0;i<len;i++){const xx=x+Math.round(bend*i*i/len/len*3),y=13-i;t.px(xx,y,M.b);t.px(xx+1,y,M.c);if(i>len-3)t.px(xx-1,y,M.a);}t.px(x+Math.round(bend*3),13-len,M.a);}if(o.dr)o.dr(t,M);};
/* 銅：革帯に3本の短い銅爪 */
D('claw_銅',['#e0a070','#7a4a2a'],'f',[],{dr:claw({c:[[7,6,0],[11,7,0],[15,6,0]]})});
/* 鉄：鉤のように曲がった鉄爪 */
D('claw_鉄',['#b8c0cc','#4a3428'],'f',[],{dr:claw({c:[[6,8,1],[10,10,1],[14,8,1]],dr:(t,M)=>{t.rect(6,17,12,1,M.f);}})});
/* 鋼：刀のように長い3本の刃爪 */
D('claw_鋼',['#e6eefa','#2a3050','#3a8ae8'],'f',[],{dr:claw({c:[[6,11,.6],[10,13,.6],[14,11,.6]],dr:(t,M)=>{t.rect(10,16,4,3,M.h);t.px(10,16,M.g);}})});
/* 星鋼：毛皮で縁取った4本の金爪 */
D('claw_星鋼',['#fff4c8','#8a5a3a','#ffd040','#e8dcc0'],'f',[],{glow:'#ffe27a',ga:70,sp:1,spc:'#ffe27a',dr:claw({fur:1,c:[[5,9,.8],[9,11,.8],[13,11,.8],[17,8,.8]],dr:(t,M)=>{t.rect(6,15,12,1,M.h);}})});
/* 専用「二人の爪」：大小2つの爪。小さい方にポポの肉球の印 */
D('L_uq_jin',['#f0e8d0','#8a5a34','#ff9a6a','#d08030'],'f',[],{glow:'#ffc890',ga:100,dr:(t,M)=>{
 const cl=(x0,y0,w,h,ls)=>{t.rect(x0,y0,w,h,M.e);t.rect(x0,y0,w,1,M.d);t.rect(x0+w-2,y0,2,h,M.f);ls.forEach(([x,l])=>{for(let i=0;i<l;i++){const xx=x+Math.round(i*i/l/l*2);t.px(xx,y0-1-i,M.b);t.px(xx+1,y0-1-i,M.c);}t.px(x+2,y0-l,M.a);});};
 cl(2,13,11,7,[[3,8],[6,10],[9,8]]);cl(14,16,8,5,[[15,5],[18,6]]);t.ell(18,18.5,1.4,1.1,M.h);t.px(16,16,M.g);t.px(18,16,M.g);t.px(20,16,M.g);}});
/* ===================== 砂時計（セレス） ===================== */
const glass=(o)=>(t,M)=>{const top=o.t||3,bot=o.b||20,mid=(top+bot)/2;
 t.rect(4,top-2,16,2,M.e);t.rect(4,top-2,16,1,M.d);t.rect(4,bot+1,16,2,M.e);t.rect(4,bot+2,16,1,M.f);
 for(const x of[5,18])t.rect(x,top,1,bot-top+1,M[x<10?'d':'f']);
 for(let y=top;y<=bot;y++){const k=Math.abs(y-mid)/(mid-top),w=Math.max(.6,k*5.6);t.rect(Math.round(12-w),y,Math.round(w*2),1,M.a);
  if(y>mid+1&&y<bot){t.rect(Math.round(12-w)+1,y,Math.max(1,Math.round(w*2)-2),1,y>mid+(mid-top)*.45?M.h:M.a);}if(y<mid-1&&y>top+(mid-top)*.55){t.rect(Math.round(12-w)+1,y,Math.max(1,Math.round(w*2)-2),1,M.h);}}
 t.px(12,Math.round(mid),M.h);t.px(12,Math.round(mid)+1,M.g);t.px(9,top+1,M.w);if(o.dr)o.dr(t,M,top,bot,mid);};
/* 銅：木枠の砂時計、銅の留め具 */
D('glass_銅',['#e8f4ff','#8a5a34','#e8c890','#d48a4e'],'f',[],{dr:glass({dr:(t,M,T,B)=>{t.px(5,T,M.k);t.px(18,T,M.k);t.px(5,B,M.k);t.px(18,B,M.k);}})});
/* 鉄：鉄の四柱で囲う重い砂時計 */
D('glass_鉄',['#e0ecf8','#7a8494','#d8c8a0'],'f',[],{dr:glass({t:4,b:19,dr:(t,M,T,B)=>{for(const x of[3,20])t.rect(x,T-2,1,B-T+5,M.e);t.rect(2,T-3,20,1,M.d);t.rect(2,B+3,20,1,M.f);}})});
/* 鋼：銀の飾り枠、青い星砂 */
D('glass_鋼',['#eef6ff','#d8e0f0','#5ab0ff','#3a4a7a'],'f',[],{dr:glass({t:4,b:19,dr:(t,M,T,B,mid)=>{t.rect(10,T-3,4,1,M.e);t.px(11,T-3,M.d);t.rect(10,B+3,4,1,M.f);for(const x of[5,18]){t.px(x,Math.round(mid),M.k);t.px(x,Math.round(mid)-1,M.k);}}})});
/* 星鋼：金枠、光る星砂。周りを輪が巡る */
D('glass_星鋼',['#fff8e8','#ffd040','#ff9ad6','#9fe0ff'],'f',[],{glow:'#ffd6f0',ga:80,sp:1,spc:'#ffe27a',dr:glass({t:4,b:19,dr:(t,M,T,B,mid)=>{for(let a=0;a<28;a++){const an=a/28*6.283,x=12+Math.cos(an)*10.5,y=mid+Math.sin(an)*3.2;if(Math.sin(an)>0||Math.abs(Math.cos(an))>.8)t.px(Math.round(x-.5),Math.round(y),M.k);}t.px(12,T+2,M.w);}})});
/* 専用「千年目の砂時計」：背に古い時計の歯車。紫の刻の砂 */
D('L_uq_celes',['#f4ecff','#a8803a','#9a5ae8','#6a6a88'],'f',[],{glow:'#c8a0ff',ga:100,dr:(t,M)=>{
 for(let a=0;a<10;a++){const an=a/10*6.283;t.rect(Math.round(12+Math.cos(an)*10)-1,Math.round(12+Math.sin(an)*10)-1,2,2,M.k);}t.ell(12,12,9.5,9.5,M.k);t.ell(12,12,8,8,M.l);t.ell(12,12,7,7,0);
 glass({t:5,b:18,dr:(t2,M2,T,B)=>{t2.px(12,T+1,M2.w);}})(t,M);for(const[x,y]of[[12,1],[22,12],[12,22],[1,12]])t.px(x,y,M.j);}});
/* ===================== 竜剣（ヴァルク） ===================== */
/* 銅：鱗模様の柄の片刃の曲刀（ファルシオン） */
D('dsword_銅',['#d48a4e','#3a6a4a','#a85a3a'],'d',[
'.....g..........',
'.....g...aaaa...',
'.....h.aaaaaaa..',
'dd...hbaaaaaaaa.',
'edede.bbbbbbbbbb',
'ee...hbbbbbbb...',
'.....h.ccccc....',
'.....i..........',
'.....i..........']);
/* 鉄：峰に鋸の歯を刻んだ竜狩りの剣 */
D('dsword_鉄',['#b0b8c6','#5a2a2a','#6a6a78'],'d',[
'.......a.a.a.a..',
'.....g.aaaaaaa..',
'.....h.aaaaaaaa.',
'dd...hbbbbbbbbbw',
'edeedhbbbbbbbbb.',
'ee...h.ccccccc..',
'.....h..........',
'.....i..........',
'.....i..........']);
/* 鋼：竜頭の鍔。竜が刃を咥えている */
D('dsword_鋼',['#e6eefa','#3a2a3a','#7a8a6a','#ff4040'],'d',[
'.....gg..........',
'....gghh.........',
'....hjhh.aaaaaa..',
'dd..hhhhaaaaaaaa.',
'edeeehhhbbbbbbbbw',
'ee..hhhhbbbbbbbb.',
'....ihh..cccccc..',
'.....i...........',
'.....ii..........']);
/* 星鋼：竜の翼を広げた鍔と、波打つ紅白の刃 */
D('dsword_星鋼',['#fff4e8','#5a1a2a','#ffd040','#ff5a5a','#ffb0a0'],'d',[
'....g.g..........',
'...g.g...........',
'....g.h..a..a....',
'dd...hh.aaaaaaa..',
'edeeehhjbbbbbbbbw',
'ee...hh.nnnnnnnn.',
'....i.h..n..n....',
'...i.i...........',
'....i.i..........'],{glow:'#ffa070',ga:70,sp:1,spc:'#ffe27a'});
/* 専用「誓鱗の竜剣」：赤黒い刃に鱗の文様、鍔に竜の瞳の宝玉 */
D('L_uq_valk',['#d03a3a','#2a1a24','#e8c040','#ffe040'],'d',[
'.....g............',
'....g.h...........',
'....h.h..aaaaaaa..',
'dd..hhh.abababab..',
'edeehjkhbcbcbcbcbw',
'ee..hhh.cbcbcbcbc.',
'....h.h..ccccccc..',
'....i.h...........',
'.....i............'],{glow:'#ff5a3a',ga:110});
}
/* ==================================================================
   防具・装飾品・道具・素材・宝石
   ================================================================== */
{const D=IC21.def;
/* ===================== 頭：兜 ===================== */
/* 銅：銅の丸い椀形の帽子兜。鋲を打った縁と革の頬当て */
D('helm_銅',['#d48a4e','#7a4a2a','#c89a3a'],'m',[
'......aaaaaa',
'....aabbbbbb',
'...abbbbbbbb',
'..abbbbbbbbb',
'..abbbbbbbbb',
'.abbbbbbbbbb',
'.abbbbbbbbbb',
'.ggggggggggg',
'.ghgggghgggg',
'.ddd........',
'.dee........',
'.dee........',
'.dee........',
'..ee........']);
/* 鉄：円錐形の兜に鼻当て。頬当てで顔の両側を守る */
D('helm_鉄',['#b0b8c6','#6a4428','#7a7c88'],'m',[
'...........a',
'..........ab',
'.........abb',
'........abbb',
'.......abbbb',
'......abbbbb',
'.....abbbbbb',
'....abbbbbbb',
'...abbbbbbbb',
'..gggggggggg',
'..ghghghghgg',
'..bbb......b',
'..bbb......b',
'..bbb......b',
'..bbb......b',
'...bb.......']);
/* 鋼：面頬つきの重兜。覗き穴と呼吸孔、赤い羽根飾り */
D('helm_鋼',['#e0e8f4','#d83a3a','#c8a040','#1a1a2a'],'m',[
'..........dd',
'.........dde',
'.........dee',
'......aaadee',
'....aabbbbee',
'...abbbbbbbb',
'..abbbbbbbbb',
'..abbbbbbbbb',
'..abbbbbbbbb',
'..akkkkkkk..',
'..abbbbbbbbg',
'..abbb.b.b.g',
'..abbbbbbbbg',
'..abbbbbbbbg',
'...abbbbbbbg',
'....ggggggg.']);
/* 星鋼：白金の兜に天使の翼、額に紅い宝玉 */
D('helm_星鋼',['#fff4dc','#f4f8ff','#ffd040','#ff4a6a'],'m',[
'd...........',
'dd..........',
'.dd.........',
'.ddd...aaaaa',
'..ddd.abbbbb',
'..dddabbbbbb',
'...ddabbbbbb',
'....abbbbbbb',
'....abbbbbbb',
'....ggggggjj',
'....ghgggggk',
'....abb.....',
'....abb.....',
'....abb.....',
'.....bb.....'],{glow:'#ffe27a',ga:70,sp:1,spc:'#ffe27a'});
/* レジェンド「陽炎の兜」：燃え立つ炎の前立て。熱で揺らぐ赤銅の兜 */
D('L_kagerou',['#c84a2a','#ff7a30','#ffc040','#ffe080'],'m',[
'.....j....j.',
'....jj...jj.',
'....jk..jkk.',
'...jkk.jkkkj',
'...jkkjkkkkk',
'....kkkkaaaa',
'....aaabbbbb',
'...abbbbbbbb',
'..abbbbbbbbb',
'..abbbbbbbbb',
'..aggggggggg',
'..abbx.xxxxx',
'..abbbbbbbbb',
'..abbbbbbbbb',
'...bbbbbbbbb',
'...ddd...ddd'],{glow:'#ff9a30',ga:110});
/* ===================== 頭：額当て ===================== */
/* 額当ては頭に巻く輪（楕円）を斜め前から見た形。正面の飾りで見分ける */
const loop=(o)=>(t,M)=>{const cy=o.cy||13,rx=o.rx||10,ry=o.ry||5.5,th=o.th||2;t.ell(12,cy,rx,ry,M[o.c||'b']);t.ell(12,cy-th*.35,rx-th,ry-th*.8,0);
 for(let y=0;y<24;y++)for(let x=0;x<24;x++){const c=t.get(x,y);if(!c)continue;if(y<cy-ry*.35)t.px(x,y,M[o.back||'c']);else if(x<8)t.px(x,y,M[o.lit||'a']);}if(o.dr)o.dr(t,M,cy,rx,ry);};
/* 銅：赤い布の鉢巻きに銅の板。結び目の端が後ろへなびく */
D('band_銅',['#c8443a','#d48a4e'],'f',[],{dr:loop({th:2.2,dr:(t,M,cy)=>{t.rect(8,cy+2,8,5,M.e);t.rect(8,cy+2,8,1,M.d);t.rect(15,cy+2,1,5,M.f);t.px(10,cy+4,M.d);t.px(13,cy+4,M.f);
 t.poly([[19,cy-3],[23,cy+2],[21,cy+3],[19,cy]],M.b);t.poly([[20,cy-2],[22,cy+6],[20,cy+6]],M.c);}})});
/* 鉄：太い革帯に、額を広く覆う鉄の板と鋲 */
D('band_鉄',['#6a4428','#b0b8c6'],'f',[],{dr:loop({th:2.6,ry:5,dr:(t,M,cy)=>{t.poly([[6,cy+1],[18,cy+1],[17,cy+8],[7,cy+8]],M.e);t.rect(7,cy+1,10,1,M.d);t.rect(6,cy+2,2,6,M.d);t.rect(16,cy+2,2,6,M.f);
 for(const x of[8,15])t.px(x,cy+4,M.d);t.px(8,cy+4,M.w);t.rect(9,cy+5,6,1,M.f);}})});
/* 鋼：細い鋼の輪。正面はV字に尖り、蒼い宝玉が嵌まる */
D('band_鋼',['#c8d0e0','#e6eefa','#3a8ae8'],'f',[],{dr:loop({th:1.6,dr:(t,M,cy)=>{t.poly([[6,cy+2],[18,cy+2],[12,cy+10]],M.e);t.poly([[6,cy+2],[12,cy+2],[12,cy+10]],M.d);t.poly([[12,cy+2],[18,cy+2],[12,cy+10]],M.e);
 t.ell(12,cy+4.5,2.2,2.2,M.h);t.px(11,cy+3,M.g);t.px(11,cy+4,M.w);t.px(13,cy+6,M.i);}})});
/* 星鋼：金の細い輪の正面に大きな星。両脇に小さな宝石が連なる */
D('band_星鋼',['#ffd040','#9fe0ff','#ff6aa0'],'f',[],{glow:'#ffe27a',ga:80,sp:1,spc:'#ffe27a',dr:loop({th:1.4,cy:14,dr:(t,M,cy)=>{const cx=12,y=cy+2;t.poly([[cx,y-7],[cx+1.8,y-2],[cx+6.4,y-2],[cx+2.6,y+1],[cx+4,y+6],[cx,y+3],[cx-4,y+6],[cx-2.6,y+1],[cx-6.4,y-2],[cx-1.8,y-2]],M.b);
 t.poly([[cx,y-7],[cx-1.8,y-2],[cx-6.4,y-2],[cx,y+1]],M.a);t.px(cx,y-1,M.e);t.px(cx-1,y-2,M.w);for(const x of[4,20])t.px(x,cy+1,M.h);for(const x of[6,18])t.px(x,cy+3,M.e);}})});
/* 王家の冠：金の冠に紅玉と蒼玉、内側に青い天鵞絨 */
D('S_royal_head',['#3a4ab0','#ffffff','#ffd040','#e0304a','#3a8ae8'],'m',[
'..k........k',
'..g....k...g',
'..gg...g..gg',
'..gg..ggg.gg',
'..ggg.ggg.gg',
'..ggggggggbb',
'..gggggggbbb',
'..hhhhhhhhhh',
'..gkgggmgggk',
'..gggggggggg',
'..iiiiiiiiii'],{glow:'#ffe27a',ga:70});
/* ===================== 体 ===================== */
/* 銅：鋲を打った革の胴着。胸元は紐で編み上げ */
D('armor_銅',['#8a5a34','#d48a4e','#e8dcc0'],'m',[
'..aaa.......',
'.abbbaa.....',
'.abbbbbaa...',
'.abbbbbbba..',
'..abbebbbbg.',
'...abbbbbbbg',
'...abebbbebg',
'...abbbbbbbg',
'...abbebbbbg',
'...abbbbbbbb',
'...ddddddddd',
'...ddedddddd',
'...abbbbbbbb',
'...abbbbbbbb',
'....bbbbbbbb']);
/* 鉄：細かな鎖を編んだ鎖帷子。肩に鉄の板 */
D('armor_鉄',['#9aa2b0','#5a3a26','#c8ccd8'],'m',[
'.ggg........',
'gghhgg......',
'ghhhhhgg....',
'.ghhhhh.ba..',
'..abababab..',
'..babababab.',
'..abababab.b',
'..bababababa',
'..abababababa',
'..bababababa',
'..dddddddddd',
'..ddedddddde',
'..abababababa',
'..bababababa',
'...ababababa']);
/* 鋼：磨いた板金の胸甲。中央の稜線、重ねた肩当て、金の縁 */
D('armor_鋼',['#e6eefa','#c8a040','#2a3a70'],'m',[
'.aaa........',
'abbbaa......',
'abbbbbaa....',
'.cccbbbb.dd.',
'.ddddabbbbea',
'..ddabbbbbea',
'...abbbbbbea',
'...abbbbbbea',
'...abbbbbbea',
'...abbbbbbea',
'...ddddddddd',
'...abbbbbbbb',
'...abbbbbbbb',
'....abbbbbbb',
'.....ccccccc']);
/* 星鋼：白金の鎧に胸の星章、背に蒼い外套 */
D('armor_星鋼',['#fff4dc','#ffd040','#3a5ac8','#ff6aa0'],'m',[
'.aaa........',
'abbbaa......',
'abbbbbaa....',
'gdddbbbb.dd.',
'ghaabbbbbbdd',
'ghhabbbbbbdj',
'ghhabbbbbddj',
'ghhabbbbbbdd',
'ghhabbbbbbbd',
'ghhabbbbbbbb',
'ghhddddddddd',
'ghhabbbbbbbb',
'ghhabbbbbbbb',
'.hhhabbbbbbb',
'..ii.ccccccc'],{glow:'#ffe27a',ga:70,sp:1,spc:'#ffe27a'});
/* 王家の鎧：深い蒼の板金、金の縁取りと王冠の紋、紅の飾り帯 */
D('S_royal_body',['#2a4ab0','#ffd040','#d0304a','#ffffff'],'m',[
'.ddd........',
'dddddd......',
'deeeeedd....',
'.dddbbbb.ee.',
'..abbbbbbbee',
'..abbbbbbbee',
'..abbbbbbbdd',
'..abbbbbbbed',
'..aghhbbbbbe',
'..abghhbbbbb',
'..abbbghhbbb',
'..ddddddghhd',
'..abbbbbbbgg',
'...abbbbbbbb',
'....eeeeeeee'],{glow:'#ffe27a',ga:70,o:[[11,6,'k'],[12,6,'k'],[11,5,'k'],[12,5,'k'],[10,4,'w'],[13,4,'w']]});
/* レジェンド「星屑の外套」：夜空色の頭巾つき外套。星屑がきらめく */
D('L_hoshikuzu',['#2a2a7a','#ffe27a','#9fe0ff','#c8b0ff'],'m',[
'........aaaa',
'.......abbbb',
'......abbbbb',
'......abbxxx',
'......abbxxx',
'.....abbbbxx',
'....abbbbbbb',
'...abbbbbbbb',
'...abbbbbbbb',
'..abbbbbbbbb',
'..abbbbbbbbb',
'.abbbbbbbbbb',
'.abbbbbbbbbb',
'abbbbbbbbbbb',
'abbbbbbbbbbb',
'cbcbcbcbcbcb'],{glow:'#9fb0ff',ga:110,o:[[5,10,'e'],[8,7,'w'],[16,9,'e'],[13,13,'h'],[4,14,'k'],[18,13,'w'],[10,11,'e'],[19,6,'h'],[7,13,'w'],[15,4,'e']]});
/* ===================== 副装備：盾 ===================== */
/* 銅：木の丸盾（バックラー）に銅の縁と中央の突起 */
D('shield_銅',['#8a5a34','#d48a4e'],'f',[],{dr:(t,M)=>{t.ell(12,12,10,10,M.e);t.ell(12,12,8.6,8.6,M.b);for(let x=5;x<20;x+=3)t.rect(x,5,1,15,M.c);t.ell(12,12,8.6,8.6,0);t.ell(12,12,8.6,8.6,M.b);for(const x of[6,9,12,15,18])for(let y=4;y<21;y++)if(Math.hypot(x+.5-12,y+.5-12)<8.4)t.px(x,y,M.c);
 t.ell(12,12,3.4,3.4,M.e);t.ell(11.3,11.3,1.6,1.6,M.d);t.px(10,10,M.w);for(let a=0;a<8;a++)t.px(Math.round(12+Math.cos(a*.785)*9.3-.5),Math.round(12+Math.sin(a*.785)*9.3-.5),M.d);}});
/* 鉄：上が平らで下が尖った鉄の盾（ヒーター）。鋲と補強の帯 */
D('shield_鉄',['#a8b0c0','#5a3a26'],'m',[
'.aaaaaaaaaaa',
'.abbbbbbbbbb',
'.abebbbbbbbb',
'.abbbbbbbbbb',
'.abbbbbbbddd',
'.abbbbbbbddd',
'.abbbbbbbbbb',
'..abbbbbbbbb',
'..abebbbbbbb',
'...abbbbbbbb',
'....abbbbbbb',
'.....abbbbbb',
'.......abbbb',
'.........abb']);
/* 鋼：縦長の凧形盾（カイト）。蒼の地に銀の十字 */
D('shield_鋼',['#e6eefa','#2a5ac0','#c8a040'],'m',[
'..aaaaaaaaaa',
'.abbbbbbbbbb',
'.abeeeeeeabb',
'.abeeeeeeabb',
'.abaaaaaaabb',
'.abbbbbbbbbb',
'.abeeeeeeabb',
'..abeeeeeabb',
'..abeeeeeabb',
'...abeeeeabb',
'...abeeeeabb',
'....abeeeabb',
'.....abeeabb',
'......abeabb',
'.......abbbb',
'.........abb']);
/* 星鋼：白金の盾に金の星章、両肩に小さな翼 */
D('shield_星鋼',['#fff4dc','#ffd040','#4a6ad0','#ffffff'],'m',[
'j...........',
'jj..........',
'.jjaaaaaaaaa',
'..abbbbbbbbb',
'..abhhhhhhhd',
'..abhhhhhhed',
'..abhhhhheed',
'..abhhhdeeed',
'..abhhhhdeed',
'..abhhhhhded',
'...abhhhhhhd',
'....abhhhhhd',
'.....abhhhhd',
'......abhhhd',
'........abbb',
'..........ab'],{glow:'#ffe27a',ga:70,sp:1,spc:'#ffe27a'});
/* 灯の護符：灯火の印を書いた札。朱の判と房飾り */
D('charm',['#f4ecd8','#c8343c','#ffb030','#e8c040'],'f',[],{dr:(t,M)=>{t.rect(7,1,10,19,M.b);t.rect(7,1,10,1,M.a);t.rect(7,1,1,19,M.a);t.rect(16,1,1,19,M.c);
 t.poly([[12,4],[14.5,8],[13.5,11],[10.5,11],[9.5,8]],M.h);t.poly([[12,6],[13.4,8.5],[12.8,10.4],[11.2,10.4],[10.6,8.5]],M.g);t.px(12,9,M.w);t.rect(10,12,4,1,M.k);
 t.rect(10,14,4,4,M.e);t.rect(10,14,4,1,M.d);t.px(11,15,M.a);t.px(12,16,M.a);t.rect(11,20,2,1,M.k);t.rect(10,21,4,1,M.e);t.px(10,22,M.f);t.px(12,22,M.f);t.px(13,22,M.e);}});
/* 王家の盾：蒼い盾に金の王冠の紋 */
D('S_royal_sub',['#2a4ab0','#ffd040','#d0304a'],'m',[
'.ddddddddddd',
'.deeeeeeeeee',
'.debbbbbbbbb',
'.debbbbbdbbd',
'.debbbbbdbdd',
'.debbbbdddde',
'.debbbbeeeee',
'.debbbbhhhhh',
'..debbbbbbbb',
'..debbbbbbbb',
'...debbbbbbb',
'....debbbbbb',
'.....debbbbb',
'......debbbb',
'........deee',
'..........dd'],{glow:'#ffe27a',ga:70});
/* レジェンド「玉座の盾」：玉座を象った巨大な塔盾。紫の天鵞絨と金 */
D('L_gyokuza',['#6a2a9a','#ffd040','#d0304a','#fff0c0'],'m',[
'..d.......dd',
'.ddd.....ddd',
'.dedddddddee',
'.deaaaaaaaaa',
'.deabbbbbbbb',
'.deabjjjjjjj',
'.deabjkkkkkk',
'.deabjkbbbbb',
'.deabjkbbbbb',
'.deabbbbbbbb',
'.deeeeeeeeee',
'.deabbbbbbbb',
'.deabbbbbbbb',
'.deabbbbbbbb',
'.deabbbbbbbb',
'.ddeeeeeeeee',
'.ff.......ff'],{glow:'#d0a0ff',ga:110});
/* ===================== 装飾品 ===================== */
const ring=(o)=>(t,M)=>{const cy=o.cy||15;t.ell(12,cy,7,6.2,M[o.band||'b']);t.ell(12,cy,4.6,4,0);for(let x=5;x<20;x++)for(let y=cy-6;y<=cy;y++)if(t.get(x,y)&&x<11)t.px(x,y,M[o.lit||'a']);for(let x=13;x<20;x++)for(let y=cy;y<cy+7;y++)if(t.get(x,y))t.px(x,y,M[o.dk||'c']);if(o.dr)o.dr(t,M,cy);};
/* 生命の指輪：金の指輪に紅いハートの宝石 */
D('ring_life',['#ffd040','#e83a4a','#7adc8a'],'f',[],{dr:ring({dr:(t,M,cy)=>{t.ell(9.6,6.5,2.6,2.6,M.e);t.ell(14.4,6.5,2.6,2.6,M.e);t.poly([[7,7.4],[17,7.4],[12,13]],M.e);t.px(9,5,M.w);t.px(9,6,M.d);t.px(15,9,M.f);t.px(6,9,M.h);t.px(18,9,M.h);t.px(5,8,M.g);t.px(19,8,M.g);}})});
/* 疾風の指輪：銀の指輪に風の翼、碧の宝石 */
D('ring_wind',['#dce6f4','#3ad0b0','#ffffff'],'f',[],{dr:ring({dr:(t,M,cy)=>{t.poly([[3,4],[10,8],[10,11],[5,9]],M.g);t.poly([[21,4],[14,8],[14,11],[19,9]],M.h);for(const x of[5,7])t.px(x,6+(x-5)/2,M.i);for(const x of[17,19])t.px(x,7-(x-17)/2,M.i);t.ell(12,8.5,2.6,2.6,M.e);t.px(11,7,M.d);t.px(11,8,M.w);}})});
/* 魔石の首飾り：鎖に吊るした紫の魔石。中で魔法の紋が光る */
const chain=(t,M,y1,c)=>{for(let i=0;i<8;i++){t.px(4+i,2+Math.round(i*y1/8),M[c||(i%2?'d':'e')]);t.px(19-i,2+Math.round(i*y1/8),M[c||(i%2?'e':'f')]);}};
D('neck_mag',['#9a4ae8','#c8a040','#ffd0ff'],'f',[],{dr:(t,M)=>{chain(t,M,7);t.rect(11,9,2,2,M.e);t.poly([[12,10],[17,14],[15,21],[9,21],[7,14]],M.b);t.poly([[12,10],[7,14],[9,21],[11,16]],M.a);t.poly([[17,14],[15,21],[13,17]],M.c);t.px(12,15,M.h);t.px(12,16,M.g);t.px(11,16,M.h);t.px(13,16,M.h);t.px(12,17,M.h);t.px(10,13,M.w);}});
/* 星砂の首飾り：星砂を詰めた硝子の小瓶 */
D('neck_sand',['#d8f0ff','#c8a040','#ffe27a','#6a8ae8'],'f',[],{dr:(t,M)=>{chain(t,M,6);t.rect(11,8,2,2,M.e);t.rect(10,10,4,2,M.d);t.rect(10,10,4,1,M.e);t.ell(12,16.5,4.6,5,M.b);t.ell(12,18,3.6,3.2,M.k);t.ell(12,18.6,3,2.4,M.j);for(const[x,y]of[[11,17],[13,19],[12,20],[10,19]])t.px(x,y,M.g);t.px(9,14,M.w);t.px(10,13,M.a);}});
/* 王家の指輪：王冠を刻んだ印章指輪 */
D('S_royal_acc',['#ffd040','#2a4ab0','#d0304a'],'f',[],{glow:'#ffe27a',ga:70,dr:ring({cy:16,dr:(t,M,cy)=>{t.rect(7,5,10,6,M.b);t.rect(7,5,10,1,M.a);t.rect(16,5,1,6,M.c);t.rect(8,6,8,4,M.e);t.px(9,7,M.g);t.px(12,7,M.g);t.px(14,7,M.g);t.rect(9,8,6,1,M.g);t.px(12,6,M.h);}})});
/* レジェンド「流星の後篝」：尾を引く流れ星の留め具 */
D('L_koukagari',['#ffe27a','#7fd6ff','#ffffff','#ff9ad6'],'f',[],{glow:'#9fe0ff',ga:110,dr:(t,M)=>{for(let i=0;i<12;i++){const x=4+i,y=19-Math.round(i*.9);t.px(x,y,M[i<4?'f':i<8?'e':'d']);t.px(x,y+1,M[i<6?'f':'e']);if(i>5)t.px(x,y-1,M.d);}
 const cx=17,cy=7;t.poly([[cx,cy-6],[cx+1.6,cy-1.6],[cx+6,cy-1.6],[cx+2.4,cy+1.2],[cx+3.6,cy+5.6],[cx,cy+3],[cx-3.6,cy+5.6],[cx-2.4,cy+1.2],[cx-6,cy-1.6],[cx-1.6,cy-1.6]],M.b);t.poly([[cx,cy-6],[cx-1.6,cy-1.6],[cx-6,cy-1.6],[cx,cy+1]],M.a);t.px(cx,cy,M.w);t.px(cx-1,cy-1,M.w);t.px(cx+1,cy+1,M.k);}});
/* レジェンド「双子星の首飾り」：金と銀の二つの星が重なり合う */
D('L_futago',['#ffd040','#e0e8f8','#c8a040','#ff6aa0'],'f',[],{glow:'#ffe8a0',ga:110,dr:(t,M)=>{chain(t,M,5,'h');const st=(cx,cy,r,c)=>{t.poly([[cx,cy-r],[cx+r*.3,cy-r*.3],[cx+r,cy-r*.3],[cx+r*.4,cy+r*.2],[cx+r*.6,cy+r],[cx,cy+r*.5],[cx-r*.6,cy+r],[cx-r*.4,cy+r*.2],[cx-r,cy-r*.3],[cx-r*.3,cy-r*.3]],M[c]);};
 st(9.5,15,6,'b');st(15,17,5,'e');t.px(9,13,M.w);t.px(15,16,M.w);t.px(12,16,M.k);t.rect(11,7,2,3,M.h);}});
/* レジェンド「奇跡の指輪」：天使の翼に抱かれた白く輝く宝石 */
D('L_kiseki',['#ffd040','#ffffff','#bfe8ff'],'f',[],{glow:'#ffffff',ga:120,dr:ring({cy:16,dr:(t,M,cy)=>{t.poly([[1,3],[9,8],[9,12],[3,9],[2,7]],M.e);t.poly([[23,3],[15,8],[15,12],[21,9],[22,7]],M.f);for(const[x,y]of[[4,6],[6,7],[3,8],[20,6],[18,7],[21,8]])t.px(x,y,M.h);t.ell(12,9,3.2,3.2,M.h);t.ell(11.4,8.4,1.6,1.6,M.w);}})});
/* レジェンド「閃光の首飾り」：稲妻をかたどった黄金の飾り */
D('L_senkou',['#ffe14a','#c8a040','#ffffff'],'f',[],{glow:'#ffe14a',ga:120,dr:(t,M)=>{chain(t,M,5,'e');t.poly([[14,8],[8,16],[12,16],[9,23],[17,13],[13,13],[16,8]],M.b);t.poly([[14,8],[8,16],[10,16],[15,9]],M.a);t.px(12,14,M.w);for(const[x,y]of[[5,12],[19,11],[6,20],[18,19]])t.px(x,y,M.g);}});
/* ===================== 道具 ===================== */
const flask=(o)=>(t,M)=>{const cx=12,cy=o.cy||15,r=o.r||6;t.rect(cx-1,cy-r-5,3,2,M.j);t.rect(cx-1,cy-r-5,3,1,M.k);/* 栓 */t.rect(cx-2,cy-r-3,5,4,M.g);t.rect(cx-2,cy-r-3,1,4,M.w);
 t.ell(cx+.5,cy,r,r,M.g);t.ell(cx+.5,cy+1,r-1,r-1.4,M.b);t.rect(cx-r+1,cy-1,2*r-1,1,M.a);t.ell(cx-2,cy+1,1.4,2,M.a);t.px(cx-3,cy-2,M.w);t.px(cx-3,cy-1,M.w);t.rect(cx+2,cy+3,2,2,M.c);if(o.dr)o.dr(t,M,cx,cy,r);};
/* ポーション：赤い丸瓶にコルク栓 */
D('potion',['#e83a4a','','#d8eef8','#a87038'],'f',[],{dr:flask({})});
/* ハイポーション：大きな瓶に金の首飾り、薄紅の薬がきらめく */
D('hipotion',['#ff7a5a','#ffd040','#e0f0ff','#a87038'],'f',[],{sp:1,spc:'#ffe27a',dr:flask({r:7,cy:15,dr:(t,M,cx,cy,r)=>{t.rect(cx-3,cy-r-1,7,1,M.e);t.px(cx,cy-r-1,M.d);t.px(cx+3,cy+1,M.w);}})});
/* エーテル：細長い青い瓶に封蝋 */
D('ether',['#3a8ae8','#c8343c','#e0f0ff','#5a4a6a'],'f',[],{dr:(t,M)=>{t.rect(10,1,5,3,M.e);t.rect(10,1,5,1,M.d);t.rect(11,4,3,4,M.g);t.rect(11,4,1,4,M.w);t.poly([[11,8],[14,8],[17,12],[17,21],[8,21],[8,12]],M.g);t.poly([[11.5,10],[13.5,10],[16,13],[16,20],[9,20],[9,13]],M.b);
 t.rect(9,13,7,1,M.a);t.rect(9,14,2,5,M.a);t.rect(14,15,2,5,M.c);t.px(10,15,M.w);t.px(12,17,M.w);t.px(13,15,M.a);}});
/* 星の雫：金色の雫の中に星 */
D('drop',['#ffd84a','#ffffff'],'f',[],{dr:(t,M)=>{t.poly([[12,2],[17,11],[7,11]],M.b);t.ell(12,14,6,6,M.b);t.poly([[12,2],[7,11],[9,11]],M.a);t.ell(10,13,2,3,M.a);t.rect(13,17,3,2,M.c);
 t.rect(11,14,3,1,M.d);t.rect(12,13,1,3,M.d);t.px(9,10,M.d);}});
/* 星の大雫：大きな空色の雫。星屑の輪がまわる */
D('drop2',['#9fe8ff','#ffffff','#ffe27a'],'f',[],{sp:2,spc:'#bff4ff',dr:(t,M)=>{t.poly([[12,1],[18,11],[6,11]],M.b);t.ell(12,14.5,7,7,M.b);t.poly([[12,1],[6,11],[8.5,11]],M.a);t.ell(9.5,13,2.4,3.4,M.a);t.rect(14,18,3,2,M.c);
 for(const[x,y]of[[12,13],[11,14],[13,14],[12,15]])t.px(x,y,M.g);t.px(12,14,M.d);t.px(8,9,M.d);t.px(16,16,M.h);}});
/* 不死鳥の羽：炎の色の一枚羽根 */
const feath=(t,M,x0,y0,x1,y1,w,cols)=>{const L=Math.hypot(x1-x0,y1-y0),ux=(x1-x0)/L,uy=(y1-y0)/L;for(let i=0;i<=L;i+=.5){const k=i/L,ww=w*Math.sin(Math.min(1,k*1.15)*Math.PI)*(1-k*.25);for(let j=-ww;j<=ww;j+=.5){const x=x0+ux*i-uy*j,y=y0+uy*i+ux*j;t.px(Math.round(x),Math.round(y),M[j<-ww*.4?cols[0]:j>ww*.4?cols[2]:cols[1]]);}}
 for(let i=0;i<=L;i+=.5)t.px(Math.round(x0+ux*i),Math.round(y0+uy*i),M[cols[3]||'w']);};
D('feather',['#ff8a30','#ffd84a','#fff6e0'],'f',[],{dr:(t,M)=>{feath(t,M,4,21,19,3,4.2,['e','b','c','g']);for(const[x,y]of[[9,13],[12,10],[14,8]])t.px(x,y,M.f);t.px(17,3,M.d);}});
/* 不死鳥の尾：扇に広がる三本の尾羽。先に紅い目玉の模様 */
D('tail',['#e83a3a','#ffb030','#fff6e0','#ffe060'],'f',[],{sp:1,spc:'#ffe27a',dr:(t,M)=>{feath(t,M,12,22,4,4,3.2,['d','e','f','g']);feath(t,M,12,22,20,4,3.2,['d','e','f','g']);feath(t,M,12,22,12,2,3.8,['a','b','c','g']);
 for(const[x,y]of[[6,6],[18,6],[12,4]]){t.ell(x,y+1,1.6,1.6,M.j);t.px(x,y+1,M.b);}}});
/* ===================== 素材 ===================== */
/* 灰石：虚蝕で色を失った灰色の岩。ひび割れ */
D('haiseki',['#8e909c','#5a5a68'],'f',[],{dr:(t,M)=>{t.poly([[3,14],[6,7],[12,4],[18,6],[21,12],[19,19],[11,21],[5,19]],M.b);t.poly([[3,14],[6,7],[12,4],[10,10],[6,15]],M.a);t.poly([[21,12],[19,19],[11,21],[15,15]],M.c);
 t.line(12,8,14,13,M.f,1);t.line(14,13,18,15,M.f,1);t.line(14,13,12,17,M.f,1);t.px(8,8,M.w);t.px(16,9,M.a);}});
/* 獣の牙：根元に血のにじんだ、弧を描く白い牙 */
D('kiba',['#f0ecd8','#c87a6a'],'f',[],{dr:(t,M)=>{for(let i=0;i<17;i++){const k=i/16,x=6+i*.85,y=4+Math.round(Math.sin(k*2.4)*10),w=Math.max(.6,3.2*(1-k));t.ell(x,y,w,w,M.b);}
 for(let i=0;i<14;i++){const k=i/16,x=6+i*.85-1,y=4+Math.round(Math.sin(k*2.4)*10)-1;t.px(Math.round(x),y,M.a);}t.rect(4,2,4,3,M.e);t.rect(4,2,4,1,M.d);t.px(9,3,M.f);t.px(19,15,M.c);}});
/* 虚の欠片：闇に染まった紫の結晶片。内側で虚ろな光が渦巻く */
D('kakera',['#8a5ad8','#2a1a4a','#ffffff'],'f',[],{glow:'#b07cff',ga:80,dr:(t,M)=>{t.poly([[11,1],[16,8],[15,19],[10,23],[6,15],[7,6]],M.b);t.poly([[11,1],[7,6],[6,15],[10,10]],M.a);t.poly([[16,8],[15,19],[10,23],[12,14]],M.c);
 t.poly([[18,10],[21,14],[19,20],[16,17]],M.b);t.poly([[18,10],[16,17],[17,13]],M.a);t.ell(11,13,1.8,2.4,M.e);t.px(11,13,M.d);t.px(9,5,M.w);t.px(19,12,M.w);}});
/* ===================== 宝石（ソケット） ===================== */
/* 紅玉：楕円のカボション */
D('st_ruby',['#ff4a5a'],'f',[],{dr:(t,M)=>{t.ell(12,12,7,8.5,M.b);t.ell(10.4,9.6,3.6,4.6,M.a);t.ell(13.6,15,3.6,3.6,M.c);t.ell(12,12,4.4,5.6,M.b);t.ell(10,8.6,1.4,2,M.w);t.px(15,16,M.a);}});
/* 蒼玉：角を落とした長方形のエメラルドカット */
D('st_sapph',['#4a7aff'],'f',[],{dr:(t,M)=>{t.poly([[7,4],[17,4],[20,7],[20,17],[17,20],[7,20],[4,17],[4,7]],M.c);t.poly([[8,7],[16,7],[17,8],[17,16],[16,17],[8,17],[7,16],[7,8]],M.b);t.poly([[7,4],[17,4],[16,7],[8,7]],M.a);t.poly([[4,7],[7,8],[7,16],[4,17]],M.a);
 t.rect(9,9,6,6,M.b);t.rect(9,9,6,1,M.a);t.px(9,10,M.w);t.px(10,9,M.w);}});
/* 翠玉：六角柱の結晶 */
D('st_emer',['#3ad078'],'f',[],{dr:(t,M)=>{t.poly([[12,2],[19,6],[19,18],[12,22],[5,18],[5,6]],M.b);t.poly([[12,2],[5,6],[5,18],[9,16],[9,8]],M.a);t.poly([[19,6],[19,18],[12,22],[15,16],[15,8]],M.c);t.rect(9,8,6,8,M.b);t.px(7,7,M.w);t.px(10,9,M.a);}});
/* 紫水晶：束になって伸びる結晶の群れ */
D('st_ame',['#b07aff'],'f',[],{dr:(t,M)=>{for(const[x,h,w]of[[7,12,3],[12,17,4],[17,11,3]]){t.poly([[x-w,22],[x-w,22-h+w],[x,22-h],[x+w,22-h+w],[x+w,22]],M.b);t.poly([[x-w,22],[x-w,22-h+w],[x,22-h],[x,22]],M.a);t.line(x+w,22-h+w,x+w,21,M.c,1);}t.rect(3,21,18,2,M.c);t.px(11,7,M.w);t.px(6,12,M.w);}});
/* 月長石：乳白の丸石。青い光の筋がゆらぐ */
D('st_moon',['#e8eeff','#7aa8ff'],'f',[],{dr:(t,M)=>{t.ell(12,12,8,8,M.b);t.ell(10.5,10.5,5,5,M.a);t.ell(14,14,4,4,M.c);t.ell(12,12,5.6,5.6,M.b);for(let i=0;i<9;i++)t.px(7+i,15-Math.round(Math.sin(i/2)*2),M.e);t.px(9,8,M.w);t.px(10,8,M.w);}});
/* 雷石：稲妻の形に割れた黄の石 */
D('st_thun',['#ffe14a','#8a6a20'],'f',[],{dr:(t,M)=>{t.poly([[14,2],[6,13],[11,13],[8,22],[18,10],[13,10],[17,2]],M.b);t.poly([[14,2],[6,13],[9,13],[15,4]],M.a);t.poly([[18,10],[8,22],[13,12]],M.c);t.px(12,7,M.w);t.px(4,6,M.e);t.px(20,16,M.e);t.px(19,5,M.d);}});
/* 金剛石：上から見たブリリアントカット */
D('st_dia',['#f0fbff','#9fd8ff'],'f',[],{dr:(t,M)=>{t.poly([[8,3],[16,3],[21,8],[21,16],[16,21],[8,21],[3,16],[3,8]],M.e);t.poly([[9,7],[15,7],[17,9],[17,15],[15,17],[9,17],[7,15],[7,9]],M.b);
 for(const[a,b,c,d]of[[8,3,9,7],[16,3,15,7],[21,8,17,9],[21,16,17,15],[16,21,15,17],[8,21,9,17],[3,16,7,15],[3,8,7,9]])t.line(a,b,c,d,M.f,1);t.poly([[8,3],[16,3],[15,7],[9,7]],M.a);t.rect(10,10,4,4,M.a);t.px(10,9,M.w);t.px(11,10,M.w);t.px(19,9,M.w);}});
}
/* ===================== 追加のレジェンド ===================== */
{const D=IC21.def;
/* レジェンド「竜王の大剣」：黒鋼の巨大な刃に紅の刃縁。金の竜翼の鍔と竜眼の紅玉 */
D('L_ryuuou',['#3a3448','#5a1a1a','#ffc040','#ff3a3a','#ff8a5a'],'d',[
'....g.g........',
'...g.g.........',
'....gh..aaaaa..',
'.....h.abbbbbn.',
'dd..hhabbbbbbbn',
'edeehjkbbbbbbbw',
'ee..hhbbbbbbbbn',
'.....h.cccccccn',
'....ih..ccccc..',
'...i.i.........',
'....i.i........'],{glow:'#ff5a3a',ga:120});
/* レジェンド「刻詠みの砂時計」：刻の円環が巡る銀の砂時計。蒼い刻の砂と時計の針 */
D('L_kokuyomi',['#eef6ff','#9aa8c8','#4ad0ff','#ffe27a'],'f',[],{glow:'#7fd6ff',ga:120,dr:(t,M)=>{
 for(let a=0;a<36;a++){const an=a/36*6.283,x=12+Math.cos(an)*10.6,y=12+Math.sin(an)*10.6;t.px(Math.round(x-.5),Math.round(y-.5),M[a%3===0?'k':'h']);}
 for(let a=0;a<12;a++){const an=a/12*6.283;t.px(Math.round(12+Math.cos(an)*9-.5),Math.round(12+Math.sin(an)*9-.5),M.j);}
 const top=4,bot=19,mid=11.5;t.rect(6,top-2,12,2,M.e);t.rect(6,top-2,12,1,M.d);t.rect(6,bot+1,12,2,M.e);t.rect(6,bot+2,12,1,M.f);t.rect(7,top,1,bot-top+1,M.d);t.rect(16,top,1,bot-top+1,M.f);
 for(let y=top;y<=bot;y++){const k=Math.abs(y-mid)/(mid-top),w=Math.max(.6,k*4);t.rect(Math.round(12-w),y,Math.round(w*2),1,M.a);if(y>mid+1&&y<bot)t.rect(Math.round(12-w)+1,y,Math.max(1,Math.round(w*2)-2),1,M.h);if(y<mid-1&&y>top+3)t.rect(Math.round(12-w)+1,y,Math.max(1,Math.round(w*2)-2),1,M.h);}
 t.px(12,12,M.g);t.px(11,11,M.k);t.line(12,12,12,8,M.l,1);t.line(12,12,15,12,M.l,1);t.px(9,top+1,M.w);}});
}
/* ===================== ゲームへの組み込み ===================== */
{const _ii=itemIcon;
 itemIcon=function(it){try{return IC21.icon(it);}catch(e){console.error(e);return _ii(it);}};
 for(const k of['potion','hipotion','ether','drop','drop2','feather','tail','haiseki','kiba','kakera'])if(IC21.DES[k])ICON[k]=IC21.render(k,0);
 if(typeof STONES!=='undefined')for(const k in STONES)if(IC21.DES['st_'+k])ICON['st_'+k]=IC21.render('st_'+k,0);
 /* 戦闘中の武器の刃の色を、新しいアイコンの主色に合わせる（レジェンド・専用） */
 if(typeof LEGCOL!=='undefined')Object.assign(LEGCOL,{shokei:'#8a8898',uq_rio:'#ffe9a8',uq_gald:'#d8e0ec',uq_mire:'#ffd8a0',uq_shion:'#e8f0f8',uq_noah:'#ffb0d0',uq_balza:'#ff9a40',uq_erna:'#9fc0ff',uq_crow:'#9a90b0',uq_hakua:'#e8f8ff',uq_jin:'#f0e8d0',uq_celes:'#c8a0ff',uq_valk:'#e04a4a',ryuuou:'#5a5068',kokuyomi:'#9fe0ff'});}
