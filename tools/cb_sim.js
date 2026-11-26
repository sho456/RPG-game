/* ===== コマンド戦闘の難易度の計測と調整（CBE.run を AUTO で何十回も） =====
 node tools/cb_sim.js            … 全ステージを推奨 Lv で（仲間は加入の順で最大 4 人）。勝率・ターン・残り HP・倒れた数
 node tools/cb_sim.js --tune     … ステージごとの [HP の倍率, 攻撃の倍率] を探して js/cb/tune.js（CBT）に書く
   目安：通常のステージ＝全 WAVE で 4〜5 ターン・残り HP 55〜65%／ボスのステージ＝9〜11 ターン・勝率 80% 前後
 環境変数：URL（既定 http://localhost:8790/index.html）・N（1 ステージの回数）・DL（推奨 Lv からのずれ） */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const TUNE=process.argv.includes('--tune'),URL=process.env.URL||'http://localhost:8790/index.html',N=+(process.env.N||(TUNE?10:12)),DL=+(process.env.DL||0);
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(URL);await p.waitForFunction(()=>typeof SPX!=='undefined'&&SPX.ready&&typeof CBE!=='undefined',{timeout:60000});
 await p.evaluate(()=>{try{titleTap();}catch(e){}});await p.waitForTimeout(400);
 const r=await p.evaluate(([TUNE,N,DL])=>{G=migrate(newGame());const ORD=['rio','gald','celes','shion','mire','jin','noah','erna','balza','crow','hakua','valk'];
  for(const id of ORD)if(!G.members.includes(id))newMember(id);const out=[],tab={};
  const party=sid=>{const i=TDD.ORDER.indexOf(sid),J=new Set(['rio','gald','celes']);for(const s of TDD.ORDER.slice(0,i)){const j=TDD.STAGE[s].join;if(j)J.add(j);}return ORD.filter(x=>J.has(x)).slice(0,4);};
  const meas=(sid,P,o)=>{let w=0,t=0,hp=0,f=0;for(let k=0;k<N;k++){const R=CBE.run(sid,P,k*7919+13,o);w+=R.win;t+=R.turn;hp+=R.hp;f+=R.fell;}return{w:w/N,t:t/N,hp:hp/N,f:f/N};};
  for(const sid of TDD.ORDER){const S=TDD.STAGE[sid];if(S.inf)continue;const lv=Math.max(1,S.lv+DL),P=party(sid);for(const id of P){G.h[id].lv=lv;G.h[id].hp=null;}
   if(TUNE){const boss=!!(S.boss||CBE.wavesOf(S).some(w=>w.some(k=>ED[k]&&ED[k].boss))),T=boss?10:4.5;
    let h=1,lo=.1,hi=4,a=1,best=null;const fitH=a=>{for(let i=0;i<3;i++){const m=meas(sid,P,{hk:h,ak:a});h=Math.max(.15,Math.min(6,h*Math.pow(T/Math.max(1,m.t),.85)));}return meas(sid,P,{hk:h,ak:a});};
    fitH(.02);for(let i=0;i<8;i++){a=(lo+hi)/2;const m=fitH(a);const ok=boss?m.w>=.8:m.hp>=.6&&m.w>=1;if(ok){lo=a;best=[h,a];}else hi=a;}
    if(best)[h,a]=best;else{a=lo;fitH(a);}
    tab[sid]=[+h.toFixed(2),+a.toFixed(2)];const m=meas(sid,P,{hk:h,ak:a});out.push([sid,S.name,lv,P.length,'h'+h.toFixed(2),'a'+a.toFixed(2),(m.w*100|0)+'%',m.t.toFixed(1),m.hp.toFixed(2),m.f.toFixed(1)]);}
   else{const m=meas(sid,P,{});out.push([sid,S.name,lv,P.length,(m.w*100|0)+'%',m.t.toFixed(1),m.hp.toFixed(2),m.f.toFixed(1)]);}}
  return{out,tab};},[TUNE,N,DL]);
 for(const x of r.out)console.log(x.join('\t'));
 if(TUNE){const f=path.join(__dirname,'../js/cb/tune.js');fs.writeFileSync(f,`/* ===== コマンド戦闘：ステージごとの敵の補正（CBT）。tools/cb_sim.js --tune が書く。[HP の倍率, 攻撃の倍率] ===== */\nconst CBT=${JSON.stringify(r.tab).replace(/\],/g,'],\n ')};\n`);console.log('書いた: js/cb/tune.js');}
 if(errs.length)console.log('エラー',errs.slice(0,3));await b.close();})();
