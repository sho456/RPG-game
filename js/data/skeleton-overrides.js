/* ===== ver0.29 骨格の手動修正（SKEL_OVR） =====
 自動推定（js/motion/skeleton.js）で関節がずれるポーズだけをここで直す。書いた関節だけが上書きされ、残りは自動のまま。
 形式：SKEL_OVR[キャラid][ポーズ名 または '*'（全ポーズ共通）][関節名]＝[x, y]
   ・x, y はフレームの左上＝0、右下＝1 の比率（素材の向きのまま。表示で左右反転しても自動で追従する）
   ・同じポーズのすべてのサイズ（戦闘・探索・図鑑）に効く
   ・type：骨格の型を指定したいとき（'hum' 人型／'beast' 四足・竜／'blob' 不定形／'float' 浮遊体）
 関節名（人型）：root pelvis chest neck head shoulderL elbowL handL shoulderR elbowR handR hipL kneeL footL hipR kneeR footR
 作り方：開発者モードで図鑑を開き、キャラの「骨格」を表示 → 関節をドラッグ → 「骨格を書き出す」の内容をここへ貼る */
const SKEL_OVR={
 /* ジン：1 枚絵の左下に柴犬（ポポ）がいるため、足元と腰を本人の位置に合わせる */
 jin:{'*':{footL:[.46,1],footR:[.66,1],pelvis:[.56,.66],root:[.56,1]}},
 jin_K:{type:'hum'}
};
