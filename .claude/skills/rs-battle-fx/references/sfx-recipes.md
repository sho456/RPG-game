# 効果音のレシピ（WebAudio で合成する。参考動画の音の性質から逆算）

今のゲームの効果音は `js/engine.js` の `tone()`（発振器 1 つ）と `SFX` だけで、ノイズの層が無い。
RS の技の音は「**層（ノイズ・長い）＋ 打（短い・高い／低い）＋ 合図（鈴）**」の重ね。次の部品を足せば作れる。
音は絵と同じく、そのまま真似ず、属性・キャラごとに 7 章の「応用と進化」で変える。

```js
/* ノイズの源（1 秒分を 1 度だけ作って使い回す） */
let NB=null;function noiseBuf(){if(NB)return NB;NB=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return NB;}
/* 層：帯域を動かすノイズ（風・水流・炎）。f0→f1 へ中心周波数を動かし、dur 秒で消える */
function swoosh(f0,f1,dur,v=.05,q=1.2){if(!AC)return;const t=AC.currentTime,s=AC.createBufferSource(),b=AC.createBiquadFilter(),g=AC.createGain();
 s.buffer=noiseBuf();s.loop=true;b.type='bandpass';b.Q.value=q;b.frequency.setValueAtTime(f0,t);b.frequency.exponentialRampToValueAtTime(f1,t+dur);
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+Math.min(.08,dur/4));g.gain.exponentialRampToValueAtTime(.0001,t+dur);
 s.connect(b).connect(g).connect(AC.destination);s.start(t);s.stop(t+dur+.05);}
/* 打（高い）：金属音。整数倍でない倍音を 3 つ重ねる（4.0k・7.5k は参考の実測） */
function ring(f=4000,dur=.18,v=.03){[1,1.87,2.71].forEach((m,i)=>tone(f*m,dur*(1-i*.2),'sine',v/(i+1)));}
/* 打（低い）：着弾の「ドン」 */
function thump(v=.09){tone(130,.14,'sine',v,45);}
/* 合図：下がっていく鈴（結果・回復・BP+） */
function chime(fs=[8300,6500,6100,5700],gap=120,v=.025){fs.forEach((f,i)=>setTimeout(()=>tone(f,.25,'sine',v),i*gap));}
```

| 場面 | 組み合わせ（参考の時間） | 進化の例（この作品らしく） |
|---|---|---|
| 剣の技の間 | `swoosh(900,2400,技の長さ,.04)` | 星の技は 2 本目の `swoosh` を 1 オクターブ上で薄く重ね、きらめく層に |
| 剣の着弾 | `ring(4000)` → 0.12s 後 `ring(7500)`＋`thump()` → 0.12s 後 `ring(4000)` | 連撃の最後だけ `ring` を 5 連・間隔を 0.08s に縮めて締める |
| 水の渦 | `swoosh(400,1200,1.0,.05,3)` を 2 本、0.13s ずつずらす＋0.13s ごとに `ring(4400,.08,.012)` | 氷なら `ring` を 6k〜9k に上げて間隔を不規則に |
| 大きな着弾（術） | `thump(.12)`＋`swoosh(3000,300,.6,.07)`（上から下へ落ちる）＋`ring(7900,.25)` | 闇は `thump` を 2 回（0.1s ずらし）、光は `chime` を上がる向きに |
| 結果・BP+ | `chime()` | 星臨中は 5 音にして最後を 1 オクターブ上 |

- 音量の目安：層 0.04〜0.07、打 0.02〜0.04（倍音は割る）、低い打 0.09〜0.12。終わりは 0.3〜0.5 秒かけて消す。
- 絵の閃光と**同じコマ**で「真ん中の打」を鳴らす（A では 7.5kHz が閃光と同時、前後に 4kHz）。
- 鳴らす場所：技の台帳の `['sfx','<名前>']`（`js/battle/seq.js`）。部品は `SFX` に足す（`SFX.ring` など）。
