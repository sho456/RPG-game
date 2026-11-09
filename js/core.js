'use strict';
const $=s=>document.querySelector(s);
const W=180;let H=128,SC=2,scene='title';
const cv=$('#cv'),ctx=cv.getContext('2d');
cv.width=W;cv.height=H;ctx.imageSmoothingEnabled=false;
function fit(){SC=Math.max(1,Math.floor(Math.min(innerWidth,480)/W));const st=$('#stage');cv.style.width=W*SC+'px';cv.style.height=H*SC+'px';st.style.width=W*SC+'px';st.style.height=H*SC+'px';if(scene==='battle'&&B)refresh();if(scene==='board')sizeBoard();if(scene==='field'&&F)fitField();}
function setH(h){H=h;cv.width=W;cv.height=h;ctx.imageSmoothingEnabled=false;fit();}
function show(m){scene=m;$('#stage').style.display='';$('#msg').className=m==='field'?'fld':'';$('#sheet').style.display='none';$('#top').style.display=m==='battle'?'flex':'none';$('#party').style.display=(m==='battle'||m==='field')?'flex':'none';$('#labels').innerHTML='';$('#cmd').innerHTML='';$('#bcv').style.display=m==='board'?'block':'none';$('#hud').style.display='none';$('#ov').classList.remove('ttl');devBtn(false);}
function devBtn(on){let b=$('#devB');if(!b){b=document.createElement('button');b.id='devB';b.textContent='DEV';b.onclick=()=>{SFX.sel();dvMenu();};$('#stage').appendChild(b);}b.style.display=on?'block':'none';}
addEventListener('resize',fit);
