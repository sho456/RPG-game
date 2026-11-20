/* ===== ver0.24 演出文字レンダラー（TX24） =====
 ダメージ数値・Critical・Weak・Guard・Miss・BREAK・HP表示などの「飾り文字」を Canvas に描いて返す。
 CSS の background-clip:text（文字の形でグラデーションを切り抜く方法）は、親要素に不透明度や変形のアニメーションが
 かかると Chromium で切り抜きが外れ、グラデーションの四角がそのまま見える不具合があった（ver0.23 の BREAK 表示の赤い四角）。
 Canvas で「落ち影 → 外側の太い縁 → 内側の明るい縁 → グラデーション塗り → 上半分の光沢」の順に描けば、どの環境でも同じ見た目になる。
 ・同じ文字・書式・大きさの組み合わせはキャッシュし、表示するたびに小さな canvas へ複製するだけにする
 ・書体の読み込みが終わる前に描いたものはキャッシュしない（読み込み後に正しい書体で描き直される）
 ・今後のドット絵・演出の追加でも STYLE に書式を足すだけで同じ質感の文字を使える */

const TX24=(()=>{
const FONT={/* ver0.42：ロマサガRS の戦闘の数字（斜体のセリフ体）・英字（斜体）・日本語（角ゴシック）に合わせる */
 num:{f:'"Noto Serif","Times New Roman",Georgia,serif',w:900,it:'italic',cap:.72,skew:0},
 lat:{f:'"Jost","Helvetica Neue",Arial,sans-serif',w:700,it:'italic',cap:.72,skew:0},
 brush:{f:'"Yuji Boku","Yuji Syuku","Hiragino Mincho ProN","Yu Mincho",serif',w:400,it:'normal',cap:.84,skew:0},/* 属性の漢字（毛筆）。Yuji Boku は太く迫力のある書体 */
 jp:{f:'"M PLUS 1p","Hiragino Kaku Gothic ProN","Hiragino Sans","Noto Sans JP","Yu Gothic",sans-serif',w:800,it:'normal',cap:.86,skew:.2}};
/* 書式：fill=上→下のグラデーション（位置は文字の高さに対する割合）、ow=外側の縁の太さ（文字サイズ比）、oc=外側の縁の色、
 rw/rc=内側の明るい縁、sh=落ち影、gl=上半分の光沢の強さ、glow=外側の発光 */

/* 任意の色からタグ用（攻撃↑・AG+ など）の書式を作る */

const fontStr=(F,size)=>`${F.it} ${F.w} ${size}px ${F.f}`;

/* 1つの文字列を描いた原本（キャッシュ）を返す */

/* 表示用の canvas（原本の複製）。CSS の大きさは原本の論理サイズ */

/* 数字の列：1文字ずつの原本（キャッシュ）を詰めて並べ、1枚の canvas に合成する。
 1桁ごとに別の canvas にすると合成レイヤーが増えて描画が重くなるため（ver0.24 の計測で約1.7倍）、1枚にまとめる。
 small に当てはまる文字（「万」など）は小さく描き、基準線をそろえる */

/* Critical の輝き（放射状の光条＋中心の光）。一度だけ描いてキャッシュし、表示側は transform と opacity だけで動かす */

/* 書体を先に読み込む（読み込み後は自動的に正しい書体で描かれる） */
function preload(){try{if(!document.fonts)return;for(const k in FONT){const F=FONT[k];document.fonts.load(fontStr(F,32),(k==='jp'||k==='brush')?'スタン斬打突炎氷雷風地光闇毒熱冷電聖魔':'0123456789CriticalWeakResistGuardMissBREAK!+').catch(()=>{});}}catch(e){}}
preload();
return{};})();
