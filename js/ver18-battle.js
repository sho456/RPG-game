/* ===== ver0.18 戦闘（ver0.32 で整理） =====
 ver0.18 は「新ドット絵の描画・キャラ別モーション・属性エフェクト」を、hit / doAction / enemyTurn / pop / kill / awaken / end と
 戦闘の draw を包んで入れていた。ver0.19 からは
  ・戦闘の描画：ver19.js の drawBattle が draw を丸ごと置き換える（ver0.18 の描画は呼ばれない）
  ・演出：ver19-pre.js が ver0.18 より前の関数（V17F）を控え、ver19.js はその上に組み立てる（ver0.18 の包みは呼ばれない）
 ため、ver0.18 の演出・描画・エフェクト（B.fx2）は使われていなかった。ver0.32 でそれらを外し、今も使われる部分だけを残す：
  ・ボス戦の導入（名乗りの帯・画面の揺れ）／多段階ボスの次の形態の導入
  ・装備の見た目（heroOpt。街・探索の立ち絵が使う）と、位置の補助（uMid・feet・aSp。ver18-art.js が使う）
  ・FX：旧エフェクトの受け口（何もしない。ver18-art.js などの古い呼び出しのため）
 戦闘の演出（モーション・エフェクト）の入口は docs/BATTLE.md を参照 */

const LEGCOL={tenkyuu:'#ffe14a',meikai:'#b07cff',hyouga:'#bff4ff',taiyou:'#ff9a40'};
/* ユニット→スプライト。装備している武器の素材（銅・鉄・鋼・星鋼）とレジェンドで見た目が変わる */

/* 旧エフェクトの受け口（ver0.19 以降の戦闘では描かれないので何もしない。エフェクトは js/motion/fx19.js の FX19） */

/* ボス戦の導入：暗転→ボスが姿を現す→名乗り */

{const _hero=hero;hero=function(id){const h=_hero(id);h.an={k:'idle',t0:(id.length*17)|0};return h;};}
