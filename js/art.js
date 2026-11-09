/* ===== ドット絵（1文字＝1ドット） ===== */
const PAL={h:'#d9772b',H:'#8a4316',s:'#f2c79b',e:'#1a1420',c:'#2f5fb3',C:'#1d3a73',w:'#e8e4d8',b:'#5a3a22',m:'#d6dde8',M:'#7a8494',y:'#e8c040',
a:'#9aa6b8',A:'#5b6577',r:'#b8323a',R:'#7a1f26',d:'#6b4a2e',v:'#6a4c9c',V:'#3b2a5c',p:'#a98ad6',k:'#f4f0ff',o:'#ffb030',g:'#8d8f99',G:'#4d4f5a',x:'#e04040'};
const SPR={
rio:["......HhhhH.....",".....Hhhhhhhh...","....Hhhhhhhhhh..","....hhsshhhhhH..","....hesshhhhH...","....sssshhhH....","m....sssCc......",".m..cCwwwcC.....","..m.cwwywwcC....","...yscwwwwcC....","....CcwwwwcC....",".....cwwwwcC....",".....Cwwwwc.....",".....bb..bb.....",".....bb..bb.....","....bbb..bbb...."],
gald:[".......rr.......","......rrR.......",".....aaaaaA.....","....aaaaaaaA....","....aesaaaaA....","....dddsaaaA....","...yyddaaaRR....","..yaayaaaaRRR...","..yaayaAaaaRR...","..yayyaAaaaRR...","..yaayaaAaaRR...","..yaayaaaaAR....","...yy.aaaaA.....","......AA.AA.....",".....aAA.aAA....",".....AAA.AAA...."],
slime:["................","................","................","................","......VVVV......","....VVvvvvVV....","...VvvppvvvvV...","..VvvpvvvvvvvV..","..VvvvvvvvvvvvV.",".VvvkkvvvkkvvvV.",".VvvkVvvvkVvvvV.",".VvvvvvvvvvvvvV.",".VvvvvvVVvvvvvV.","..VvvvvvvvvvV...","...VVVVVVVVVV...","................"],
wolf:["................","................","................","..........G..G..","..........GggG..",".........GgggxG.","G.......GggggggG","Gg....GGgggggwww",".GgGGgggggggg...","..GgggggggggG...","..GgggggggggG...","..GgwwwwwwggG...","..Gg.G...Gg.G...","..Gg.G...Gg.G...",".GG.GG..GG.GG...","................"],
boss:["......yyyy......",".....yVVVVy.....","....VVvvvvVV....","...VvvvvvvvvV...","...VvVVVVVVvV...","...VvVoVVoVvV...","...VvVVVVVVvV...","..VvvVVppVVvvV..",".VvvvvVVVVvvvvV.","VvpvVvvvvvvVvpvV","Vv.VvvvvvvvvV.vV","V..VvvvvvvvvV..V","...VvvvvvvvvV...","...VvVvvVvvVvV..","...V.V.VV.V.V...","................"]};
const AWP={rio:{h:'#ffe27a',H:'#d9a020',c:'#f4f4ff',C:'#8fa8ff',w:'#fffbe6'},gald:{a:'#f0d070',A:'#a8801e',r:'#ffffff',R:'#bcc6ff'}};
const IMG={};
function mk(rows,over,solid){const c=document.createElement('canvas');c.width=16;c.height=16;const g=c.getContext('2d');
 rows.forEach((r,y)=>{for(let x=0;x<16;x++){const ch=r[x];if(!ch||ch==='.')continue;g.fillStyle=solid||(over&&over[ch])||PAL[ch]||'#f0f';g.fillRect(x,y,1,1);}});return c;}
for(const k in SPR){IMG[k]=mk(SPR[k]);IMG[k+'_w']=mk(SPR[k],null,'#ffffff');if(AWP[k])IMG[k+'_aw']=mk(SPR[k],AWP[k]);}
const sprKey=u=>u.spr+(u.aw?'_aw':'');
