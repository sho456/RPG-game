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
 条件 c：phys mag basic skill weak weakmag single aoe multi el:熱|陰 hpfull hplow hphigh tlow tfull boss debuffed allyaw altel crit r1 any */
'use strict';
(()=>{const D=RSD;
D.ABL.splice(0,3,1,25,50);/* 解放Lv。そこから +20Lv ごとに 1 段階（最大Ⅲ）。星盤・天星盤で +1 ずつ */
Object.assign(D.AB,{
 rio:[
  {n:'灯火の導き',fx:[{t:'start',on:'allies',k:'atk',r:[8,12,18],d:3},{t:'start',on:'allies',k:'mag',r:[8,12,18],d:3},{t:'crit',r:[0,5,10]},{t:'bp0',r:[0,1,2]},{t:'dmg',c:'skill',r:[0,0,10]}],
   sp:{n:'導きの灯',d:'毎ターンの始めに、味方全体の攻撃+8%（そのターンだけ）',fx:[{t:'tstart',on:'allies',k:'atk',v:8}]}},
  {n:'空白の灯',fx:[{t:'dmg',c:'allyaw',r:[20,25,32]},{t:'ag',r:[10,20,30]},{t:'cut',r:[0,8,12]},{t:'awturn',r:[0,0,1]}],
   sp:{n:'継ぎ火',d:'仲間が星臨すると、自分の星臨ゲージ+30%',fx:[{t:'agshare',v:30}]}},
  {n:'星継ぐ者',fx:[{t:'dmg',r:[10,16,25]},{t:'dmg',c:'aw',r:[10,20,30]},{t:'bpr',r:[0,1,1]}],
   sp:{n:'星継ぎの一閃',d:'技・術のあと、30%で陽属性の追撃（威力1.0）',fx:[{t:'fu',c:'skill',v:.3,pw:1,el:'陽',nm:'星継ぎの一閃'}]}}],
 gald:[
  {n:'鉄壁の誓い',fx:[{t:'cut',c:'hphigh',r:[15,20,25]},{t:'taunt',r:[1,2,3]},{t:'regen',on:'self',r:[0,3,5]},{t:'bp0',r:[0,1,2]}],
   sp:{n:'仁王立ち',d:'HPが半分以下の味方が単体攻撃を受けるとき、60%でかばう',fx:[{t:'cover',v:.6}]}},
  {n:'報復の盾',fx:[{t:'counter',r:[.3,.4,.5],pw:[.8,1,1.4]},{t:'start',on:'self',k:'def',r:[0,15,25],d:3},{t:'cut',r:[0,5,10]}],
   sp:{n:'盾返し',d:'反撃が当たると、50%で敵をスタン',fx:[{t:'ctst',k:'stun',v:.5}]}},
  {n:'城塞の主',fx:[{t:'start',on:'allies',k:'shield',r:[10,15,20],d:99},{t:'cut',r:[10,15,25]},{t:'guts',r:[0,1,1]}],
   sp:{n:'城塞の加護',d:'毎ターンの始めに、自分に最大HP8%の障壁を張る',fx:[{t:'tstart',on:'self',k:'shield',v:8}]}}],
 mire:[
  {n:'双極循環',fx:[{t:'dmg',c:'altel',r:[15,20,30]},{t:'dmg',c:'mag',r:[0,8,15]},{t:'ag',r:[0,10,15]}],
   sp:{n:'双極の連鎖',d:'直前と違う属性の術を使うと、行動のあとBP+2',fx:[{t:'actbp',c:'altel',v:2}]}},
  {n:'魔力暴走',fx:[{t:'onhit',c:'crit',k:'res',r:[-15,-20,-25],d:2},{t:'critd',r:[0,15,25]},{t:'crit',r:[5,8,12]},{t:'kill',bp:[0,1,2]}],
   sp:{n:'臨界',d:'会心が出ると、行動のあとBP+2',fx:[{t:'actbp',c:'crit',v:2}]}},
  {n:'魔導の深淵',fx:[{t:'dmg',c:'mag',r:[15,25,35]},{t:'dmg',c:'weakmag',r:[0,15,25]},{t:'bpr',r:[0,1,1]}],
   sp:{n:'深淵の詠唱',d:'1ターン目の与ダメ+30%・術の消費BP-1',fx:[{t:'dmg',c:'r1',v:30},{t:'bpcut',c:'mag',v:1}]}}],
 shion:[
  {n:'影走り',fx:[{t:'start',on:'self',k:'spd',r:[20,30,40],d:3},{t:'prio',r:[10,20,30]},{t:'dodge',r:[0,8,12]}],
   sp:{n:'先手必勝',d:'1ターン目は必ず最初に動き、与ダメ+20%',fx:[{t:'prio1',v:1},{t:'dmg',c:'r1',v:20}]}},
  {n:'追い打ち',fx:[{t:'fu',c:'weak',r:[.3,.4,.5],pw:[.5,.7,1],el:'斬'},{t:'crit',r:[0,8,12]},{t:'dmg',c:'skill',r:[0,5,15]}],
   sp:{n:'影追い',d:'弱点を突けなかったときも、25%で追撃（突・威力0.8）',fx:[{t:'fu',c:'any',v:.25,pw:.8,el:'突',nm:'影追い'}]}},
  {n:'千影',fx:[{t:'fu',c:'single',r:[.25,.35,.45],pw:.8,el:'斬'},{t:'stat',k:'spd',r:[10,15,25]},{t:'kill',bp:[0,1,2]}],
   sp:{n:'千影の幻',d:'15%で攻撃を回避し、回避したら必ず反撃（威力0.8）',fx:[{t:'dodge',v:15},{t:'evct',v:.8}]}}],
 noah:[
  {n:'慈愛の機構',fx:[{t:'regen',on:'lowest',r:[6,8,10]},{t:'heal',r:[0,15,25]},{t:'cleanse',r:[0,.2,.4]}],
   sp:{n:'機巧の祈り',d:'戦闘中1度だけ、ターンの始めに気絶した味方をHP20%で起こす',fx:[{t:'autorev',v:20}]}},
  {n:'聖印の加護',fx:[{t:'healprot',r:[15,20,25]},{t:'bpr',r:[0,1,1]},{t:'cut',r:[0,8,12]}],
   sp:{n:'聖印',d:'回復した味方の弱体を1つ解除する',fx:[{t:'healcl',v:1}]}},
  {n:'聖域の守り',fx:[{t:'start',on:'allies',k:'prot',r:[15,20,25],d:3},{t:'regen',on:'allies',r:[3,4,5]},{t:'ag',r:[0,15,25]}],
   sp:{n:'聖域',d:'ノアが立っている間、味方全体の被ダメ-8%',fx:[{t:'allycut',v:8}]}}],
 erna:[
  {n:'鷹の目',fx:[{t:'crit',c:'weak',r:[20,25,30]},{t:'dmg',c:'weak',r:[0,10,15]},{t:'prio',r:[0,10,15]}],
   sp:{n:'鷹の眼光',d:'弱点を突くと、行動のあとBP+1',fx:[{t:'actbp',c:'weak',v:1}]}},
  {n:'狙撃態勢',fx:[{t:'dmg',c:'tfull',r:[25,35,45]},{t:'critd',r:[0,15,30]},{t:'pierce',r:[0,10,20]}],
   sp:{n:'一射入魂',d:'HP満タンの敵への攻撃は必ず会心になる',fx:[{t:'crit',c:'tfull',v:100}]}},
  {n:'天穿つ雷',fx:[{t:'dmg',c:'el:雷',r:[20,30,40]},{t:'crit',r:[5,10,15]},{t:'bp0',r:[0,1,2]}],
   sp:{n:'迅雷',d:'雷属性の攻撃が当たると、30%でマヒ（2T）',fx:[{t:'onhit',c:'el:雷',k:'para',v:1,p:.3,d:2}]}}],
 balza:[
  {n:'炉の熱',fx:[{t:'stack',r:[5,6,8],max:5},{t:'cut',c:'hplow',r:[0,15,25]}],
   sp:{n:'灼熱の打鉄',d:'熱属性の攻撃を当てた敵の防御-15%（3T）',fx:[{t:'onhit',c:'el:熱',k:'def',v:-15,d:3}]}},
  {n:'不屈',fx:[{t:'dmg',c:'hplow',r:[20,25,30]},{t:'cut',c:'hplow',r:[15,20,25]},{t:'guts',r:[0,1,1]}],
   sp:{n:'不屈の闘志',d:'倒れるダメージをこらえたとき、攻撃+30%（3T）',fx:[{t:'gutsbuff',k:'atk',v:30}]}},
  {n:'灼熱の炉心',fx:[{t:'dmg',c:'el:熱',r:[20,30,40]},{t:'stat',k:'def',r:[5,10,15]},{t:'regen',on:'self',r:[0,3,5]}],
   sp:{n:'炉心の鎧',d:'攻撃を受けるたび与ダメ+6%（最大5回）',fx:[{t:'rage',v:6,max:5}]}}],
 crow:[
  {n:'呪詛の残り香',fx:[{t:'onhit',c:'el:陰',k:'poison',v:.04,d:3,r:[.3,.4,.5]},{t:'dmg',c:'debuffed',r:[0,10,15]}],
   sp:{n:'呪縛',d:'陰属性の攻撃が当たると、25%で暗闇（3T）',fx:[{t:'onhit',c:'el:陰',k:'blind',v:1,p:.25,d:3}]}},
  {n:'血の契約',fx:[{t:'kill',r:[10,12,15],bp:[1,2,3]},{t:'drain',r:[0,5,8]}],
   sp:{n:'血の盟約',d:'自分のHPが半分以下のとき、与ダメ+15%・与ダメの10%を吸収',fx:[{t:'dmg',c:'hplow',v:15},{t:'drain',c:'hplow',v:10}]}},
  {n:'死神の加護',fx:[{t:'dmg',c:'tlow',r:[30,45,60]},{t:'ag',r:[0,15,25]},{t:'crit',r:[0,5,10]}],
   sp:{n:'死神の鎌',d:'HP30%以下の敵を攻撃したあと、20%でとどめを刺す（ボスには効かない）',fx:[{t:'execute',c:'tlow',v:.2}]}}],
 hakua:[
  {n:'連撃の型',fx:[{t:'stack',c:'same',r:[6,7,8],max:5},{t:'hits',r:[0,0,1]}],
   sp:{n:'無拍子',d:'連撃の技のあと、50%で打属性の追撃（威力0.8）',fx:[{t:'fu',c:'multi',v:.5,pw:.8,el:'打',nm:'無拍子'}]}},
  {n:'氷華の気',fx:[{t:'onhit',c:'el:冷',k:'spd',r:[-15,-20,-25],d:2},{t:'dmg',c:'el:冷',r:[0,15,25]}],
   sp:{n:'凍て刺し',d:'冷属性の攻撃が当たると、20%でスタン',fx:[{t:'onhit',c:'el:冷',k:'stun',v:1,p:.2,d:1}]}},
  {n:'氷華絢爛',fx:[{t:'dmg',c:'multi',r:[15,22,30]},{t:'crit',r:[0,8,12]},{t:'dmg',c:'skill',r:[0,8,15]}],
   sp:{n:'絢爛',d:'連撃の技・術の回数+1',fx:[{t:'hits',v:1}]}}],
 jin:[
  {n:'ポポの援護',fx:[{t:'fu',c:'any',r:[.25,.35,.5],pw:[.6,.8,1.2],el:'打',nm:'ポポの援護'},{t:'ag',r:[0,10,20]}],
   sp:{n:'ポポの盾',d:'HPが半分以下の味方が単体攻撃を受けるとき、40%でかばう',fx:[{t:'cover',v:.4}]}},
  {n:'野生の勘',fx:[{t:'dodge',c:'hplow',r:[20,25,30]},{t:'stat',k:'atk',r:[0,8,12]}],
   sp:{n:'獣の嗅覚',d:'弱点を突くとき、与ダメ+15%・会心率+15%',fx:[{t:'dmg',c:'weak',v:15},{t:'crit',c:'weak',v:15}]}},
  {n:'獣王の血',fx:[{t:'dmg',r:[10,15,20]},{t:'cut',r:[8,12,15]},{t:'regen',on:'self',r:[0,3,5]}],
   sp:{n:'獣王の咆哮',d:'戦闘開始時、敵全体の攻撃-15%（3T）',fx:[{t:'start',on:'enemies',k:'atk',v:-15,d:3}]}}],
 celes:[
  {n:'刻読み',fx:[{t:'start',on:'allies',k:'spd',r:[10,15,20],d:3},{t:'prio',r:[0,10,20]}],
   sp:{n:'刻の先触れ',d:'1ターン目、味方全体の与ダメ+15%',fx:[{t:'allydmg',c:'r1',v:15}]}},
  {n:'時の歪み',fx:[{t:'delay',c:'mag',r:[.25,.35,.45]},{t:'dmg',c:'mag',r:[0,10,15]}],
   sp:{n:'時縛り',d:'術が当たると、15%でマヒ（2T）',fx:[{t:'onhit',c:'mag',k:'para',v:1,p:.15,d:2}]}},
  {n:'刻の支配者',fx:[{t:'allybp0',r:[1,1,2]},{t:'dmg',c:'mag',r:[15,20,30]},{t:'ag',r:[0,15,25]}],
   sp:{n:'円環の加護',d:'味方全体の毎ターンのBP回復+1',fx:[{t:'allybpr',v:1}]}}],
 valk:[
  {n:'竜鱗',fx:[{t:'cut',c:'el:熱|陰',r:[30,36,45]},{t:'cut',r:[0,8,12]},{t:'stat',k:'mhp',r:[0,8,12]}],
   sp:{n:'逆鱗',d:'HPが半分を切ると、攻撃・防御+25%（3T・戦闘中1度）',fx:[{t:'hpbuff',v:25}]}},
  {n:'竜の闘志',fx:[{t:'rage',r:[4,5,6],max:5},{t:'counter',r:[0,.2,.3],pw:1}],
   sp:{n:'竜の報復',d:'反撃の威力が1.5になる',fx:[{t:'ctpow',v:1.5}]}},
  {n:'竜王の威厳',fx:[{t:'dmg',c:'el:熱|陰',r:[20,30,40]},{t:'regen',on:'self',r:[5,6,8]}],
   sp:{n:'竜王の覇気',d:'戦闘開始時、敵全体の攻撃・魔力-10%（3T）',fx:[{t:'start',on:'enemies',k:'atk',v:-10,d:3},{t:'start',on:'enemies',k:'mag',v:-10,d:3}]}}]});
})();
