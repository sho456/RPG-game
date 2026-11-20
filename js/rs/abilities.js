/* ===== アビリティ（AB・ABL の正本。ver0.45：3 段階＋段階Ⅲの固有名の特殊効果） =====
 1 人 3 つ。Lv で解放され（Ⅰ）、Lv と星盤・天星盤で強化される（最大Ⅲ）。配列［Ⅰ,Ⅱ,Ⅲ］の 0 はその段階ではまだ無い効果。
 段階Ⅲになると「固有名の特殊効果」（sp：【名前】）が付く。sp.d は画面に出す説明、sp.fx は処理（js/rs/battle.js）。
 ver0.44 までの 5 段階（Ⅰ〜Ⅴ）は、Ⅰ・Ⅲ・Ⅴ の数値を新しいⅠ・Ⅱ・Ⅲに引き継いだ。
 効果の種類（処理は battle.js。説明文は core.js effTxt）
  dmg 与ダメ+% ／ cut 被ダメ-% ／ crit 会心率+ ／ critd 会心ダメ+% ／ stat 能力+% ／ bp0 初期BP ／ bpr 毎ターンのBP回復 ／ bpcut 消費BP-
  ag 星臨ゲージ上昇+% ／ heal 回復量+% ／ regen 毎ターン回復 ／ start 戦闘開始時の強化（on：self allies enemies）
  onhit 攻撃が当たると状態付与（stun para blind poison／能力の増減） ／ fu 追撃 ／ counter 反撃 ／ dodge 回避 ／ drain 吸収 ／ kill 撃破時
  guts 致死ダメージを1度だけHP1で耐える ／ prio 行動順+% ／ cleanse 毎ターン弱体を解除 ／ taunt 狙われやすさ ／ hits 連撃+ ／ pierce 防御無視%
  stack 行動ごとに与ダメが積み上がる ／ rage 被弾ごとに与ダメが積み上がる ／ healprot 回復した味方に被ダメ軽減 ／ delay 当てた敵を遅らせる
  allybp0 味方全体の初期BP ／ allybpr 味方全体のBP回復 ／ allydmg 味方全体の与ダメ ／ allycut 味方全体の被ダメ-%
  （ver0.45 で追加）tstart 毎ターンの始めの強化 ／ cover かばう ／ actbp 行動後にBP回復 ／ prio1 1ターン目は最初に動く ／ evct 回避したら反撃
  autorev 戦闘中1度だけ気絶した味方を起こす ／ healcl 回復した味方の弱体を解除 ／ agshare 仲間の星臨で星臨ゲージ ／ ctst 反撃で状態付与
  gutsbuff こらえたときに強化 ／ execute 一定の確率でとどめ ／ hpbuff HPが半分を切ったら強化（1度）
 （ver0.49 で追加）xf エクストラフォース+%（【補助効果】最終ダメージに掛かる別枠。同じ条件は最大値・違う条件は加算） ／ allyxf 味方全体のエクストラフォース
 条件 c：phys mag basic skill weak weakmag single aoe multi el:熱|陰 hpfull hplow hphigh tlow tfull boss debuffed allyaw altel crit r1 any */

(()=>{
/* 解放Lv。そこから +20Lv ごとに 1 段階（最大Ⅲ）。星盤・天星盤で +1 ずつ */

})();
