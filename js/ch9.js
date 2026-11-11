/* ===== ver0.15 絆と会話：絆イベント・会話ウィンドウ（表情5種）・専用ユニーク装備・図鑑 ===== */
/* --- 会話ウィンドウと顔グラの表情（n通常 h笑顔 a怒り s悲しみ o驚き） --- */
const EXN={n:'通常',h:'笑顔',a:'怒り',s:'悲しみ',o:'驚き'},EXBG={n:'#1a2048',h:'#3a3012',a:'#44141c',s:'#10224a',o:'#2e3a12'};
const EXC={};
function eyeOf(id){const r=SPR[id]||[];for(let y=0;y<r.length;y++){const x=r[y].indexOf('e');if(x>=0)return[x,y];}return null;}
function exprFace(id,ex='n'){const key=id+':'+ex;if(EXC[key])return EXC[key];const S=4,b=bbox(id),w=Math.min(16,b.w),h=Math.min(12,b.h),ox=(16-w)>>1,oy=2;
 const c=document.createElement('canvas');c.width=c.height=16*S;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 g.fillStyle=EXBG[ex]||EXBG.n;g.fillRect(0,0,c.width,c.height);g.drawImage(IMG[id],b.x,b.y,w,h,ox*S,oy*S,w*S,h*S);
 const e=eyeOf(id),P=(x,y,ww,hh,col)=>{g.fillStyle=col;g.fillRect(x,y,ww,hh);};
 if(e){const X=(e[0]-b.x+ox)*S,Y=(e[1]-b.y+oy)*S,sk=(()=>{const d=g.getImageData(X+S+1,Y+1,1,1).data;return`rgb(${d[0]},${d[1]},${d[2]})`;})(),D='#1a1420';
  if(ex==='h'){P(X,Y,S,S,sk);P(X,Y+2,1,2,D);P(X+1,Y+1,2,1,D);P(X+3,Y+2,1,2,D);P(X-2,Y+S+1,6,3,'#ff8aa0');P(c.width-12,5,6,6,'#ffe27a');P(c.width-10,3,2,10,'#ffe27a');P(c.width-14,7,10,2,'#ffe27a');}
  if(ex==='a'){P(X-1,Y-2,2,1,D);P(X+1,Y-1,2,1,D);P(X+3,Y,1,1,D);P(c.width-14,4,3,9,'#ff4050');P(c.width-17,7,9,3,'#ff4050');}
  if(ex==='s'){P(X,Y,S,S,sk);P(X,Y+2,S,2,D);P(X-1,Y-2,2,1,D);P(X+1,Y-3,2,1,D);P(X,Y+S,3,5,'#7fd6ff');P(X,Y+S+5,3,4,'#bff4ff');}
  if(ex==='o'){P(X-1,Y-1,S+2,S+2,'#ffffff');P(X+1,Y+1,2,2,D);P(c.width-10,3,4,12,'#ffe27a');P(c.width-10,18,4,4,'#ffe27a');}}
 else{if(ex==='a')P(c.width-14,4,3,9,'#ff4050');if(ex==='o')P(c.width-10,3,4,12,'#ffe27a');if(ex==='s')P(8,c.height-14,3,6,'#7fd6ff');}
 return EXC[key]=c.toDataURL();}
/* lines: [[話者id|null, 表情, 本文], ...] */
function talk(lines,done){const d=document.createElement('div');d.id='talk';
 d.innerHTML='<div class="tkw"><div class="tkp"><img></div><div class="tkb"><div class="tkn"></div><div class="tkt"></div><div class="tkx">▼</div></div></div><button class="tksk">スキップ ▶▶</button>';
 $('#app').appendChild(d);let i=-1,tm=null,full='';const im=d.querySelector('.tkp img'),pp=d.querySelector('.tkp'),nm=d.querySelector('.tkn'),tx=d.querySelector('.tkt');
 const fin=()=>{clearInterval(tm);tm=null;tx.innerHTML=full;};
 const next=()=>{i++;if(i>=lines.length){d.remove();if(done)done();return;}const[sp,ex,t]=lines[i];full=t;
  if(sp&&HB[sp]){pp.style.display='';im.src=exprFace(sp,ex);nm.textContent=HB[sp].name;nm.style.display='';d.classList.remove('nar');}else{pp.style.display='none';nm.style.display='none';d.classList.add('nar');}
  tx.textContent='';let n=0;const cs=[...t];clearInterval(tm);tm=setInterval(()=>{n++;tx.textContent=cs.slice(0,n).join('');if(n>=cs.length)fin();},28);};
 d.onclick=e=>{if(e.target.closest('.tksk')){SFX.sel();i=lines.length-1;fin();next();return;}if(tm)fin();else{SFX.sel();next();}};next();}
/* 1行＝「話者.表情 本文」 話者：R=リオ C=相手 N=語り */
const parseEp=(id,s)=>s.split('|').map(l=>{const sp=l[0]==='R'?'rio':l[0]==='C'?id:null;return[sp,sp?l[2]:'n',l.slice(4)];});

/* --- 絆イベント（各キャラ5話） --- */
const BOND_REQ=[0,10,25,45,70];
const BSTORY={
 gald:[['剣の握り方','N.n 夜明け前の訓練場。ガルドが黙って木剣を投げてよこした。|C.n 握りが浅い。それでは三合で落とす。|R.o えっ、毎朝見てたの？|C.n ……見ていない。たまたま通っただけだ。|R.h じゃあ明日も、たまたま通ってよ。|C.h ……ふん。日の出の鐘が鳴る前だぞ。'],
  ['名のない墓','N.n 灯都の外れ、名前の刻まれていない石が七つ並んでいる。|C.n 俺の部下たちだ。名を刻むと、俺が立ち止まってしまう気がしてな。|R.s ガルド……。|C.n 気にするな。お前を連れてきたのは、ただの気まぐれだ。|R.n でも、いつか名前を刻もうよ。立ち止まっても、俺が引っ張るから。|C.h ……生意気を言うようになった。'],
  ['団長の盾','N.n ガルドが古びた盾を磨いている。中央に深い亀裂が走っていた。|R.o その傷、すごいな。|C.n 最後の戦いでついた傷だ。この盾は部下を守れなかった。|C.s 俺の背中で、七人が倒れた。盾ひとつでは足りなかったんだ。|R.n だから今はひとりで全部受けようとするんだね。|C.o ……見透かすな。|R.h 半分は俺が持つよ。二枚あれば、きっと足りる。'],
  ['恐れ','N.n 夜営の火の前で、ガルドが珍しく先に口を開いた。|C.s リオ。俺は怖い。お前たちを、またあの石の列に並べることが。|R.s ……うん。|C.a だが、怖いから下がれとは言わん。それはお前の誇りを奪うことだ。|R.n 俺も怖いよ。ガルドが無茶して倒れるのが。|C.o ……。|C.h 互いに怖がりか。なら、互いに生き残るしかないな。'],
  ['誓約','N.n 七つの石に、ひとつずつ名前が刻まれていた。|R.o ガルド、これ……。|C.n 刻んだ。もう立ち止まらんと決めたからな。|C.n これを受け取れ。……いや、俺が持つ。お前の隣で振るうための剣だ。|R.h 誓いの剣ってこと？|C.h ああ。この身が城壁である限り、お前の灯は消させん。それが俺の誓約だ。']],
 mire:[['司書の講義','C.n いい？ 星片の共鳴は位相差で説明できるの。まず前提として――|R.o ま、待って、もう三刻目だよ!?|C.a 途中で止めたら理論が死ぬじゃない！|R.s お腹すいた……。|C.o え、もうそんな時間？ ……ご、ごめんなさい。|C.h じゃあ食べながら続きを話しましょう。逃がさないわよ。'],
  ['本しか友達がいなかった','C.n 図書遺跡にいた頃、話し相手は本だけだったの。|C.n 本は裏切らない。でも、本は「おはよう」って返してくれない。|R.n ……おはよう、ミレイユ。|C.o な、なによ急に。今、夕方よ。|R.h 明日の分の前払い。|C.h ……理屈が通ってないわ。でも、悪くない。'],
  ['消えた師','N.n ミレイユが一冊の手記を抱えている。表紙が焦げていた。|C.s 師匠の手記よ。虚蝕を調べに出て、戻らなかった。|C.n 最後の頁に「炎と氷は相容れぬ。ゆえに美しい」って。|R.n ミレイユの魔法そのものだね。|C.s 私、師匠の答えを確かめたくて旅に出たの。……一人じゃ怖くて、言えなかったけど。|R.h 今は一人じゃないよ。'],
  ['矛盾の証明','C.a どうしても計算が合わない！ 炎と氷を同時に制御すると、必ず暴走するの！|R.n じゃあ二人で一冊ずつ持ったら？|C.o ……は？|R.n 俺が片方の頁を支える。ミレイユがもう片方を読む。|C.o 共鳴の位相を、他者の星片で補正……！ 理論上は可能……いえ、可能だわ！|C.h リオ、あなた時々すごいこと言うわね。'],
  ['双星の書','N.n ミレイユが新しい魔導書を差し出した。表紙には二つの星が寄り添って描かれている。|C.n 師匠の手記と私の研究をまとめた本。最後の頁は空けてあるの。|R.o どうして？|C.h 友達と書く頁だから。……理屈じゃないわよ。結論よ。|C.n これは私の切り札。あなたの隣で開くために作ったの。']],
 shion:[['リンゴ泥棒','N.n 市場で、果物屋の親父の怒鳴り声が響いた。|C.o げっ、リオ!? 見てたのかよ。|R.n それ、孤児院の子たちの分？|C.a ……だったら何だよ。説教なら聞かねえぞ。|R.h 説教はしない。代わりに、一緒に払いに行こう。|C.s ……ちっ。お前ってほんと、調子狂うやつ。'],
  ['兄貴の顔','N.n 孤児院の庭で、子どもたちがシオンにしがみついている。|C.h こら、重いって！ 順番だ順番！|R.h すっかり兄貴だね。|C.n 俺がいなきゃ、こいつらの晩飯は誰が取ってくるんだよ。|C.s ……ほんとは、盗まなくても食わせてやりてえんだけどな。|R.n それ、一緒に考えよう。'],
  ['虚蝕の影','C.s 孤児院の裏の森が、灰色になってた。|C.a 虚蝕がここまで来たら、あいつらの居場所がなくなる。|R.n だから旅についてきたんだね。|C.n 違えよ。……いや、違わねえ。|C.s 俺がいない間に、あいつらに何かあったらって思うと……。|R.n 大灯を守ろう。孤児院ごと、全部。'],
  ['かばう背中','N.n 戦いのあと、シオンが不機嫌そうに腕を組んでいる。|C.a お前、なんでさっき俺をかばった！ 盗賊は自分の身くらい自分で守れんだよ！|R.n 家族ならかばうだろ。|C.o か、家族って……。|C.s ……俺、兄貴でいるのは慣れてるけど、守られるのは慣れてねえんだよ。|R.h じゃあ慣れて。'],
  ['家族の双剣','N.n 子どもたちが、小遣いを集めて鍛冶屋に頼んだという双剣を持ってきた。|C.o お前ら……これ、どうしたんだよ。|N.n 「シオンにいちゃんと、リオにいちゃんのぶん！」|C.s ……ばかやろ。泣かせんなよ。|C.h リオ。こいつは俺の宝だ。この剣で、帰る場所ごと守ってやる。']],
 noah:[['笑顔の定義','C.n リオ様。「笑顔」とは、口角を何度上げることを指すのでしょうか。|R.o えっ、角度？|C.n 観測では十五度前後が多いのですが、同じ角度でも意味が違うようです。|R.h 嬉しいときに自然に出るのが笑顔だよ。|C.n 自然に……。わたしには、まだ「自然」がありません。|C.n 引き続き、観測を続けます。'],
  ['練習','N.n ノアが水面に映る自分の顔とにらめっこしている。|C.n 練習中です。……これで、どうでしょう。|R.o うわっ、ちょっと怖いかも。|C.s ……そうですか。|R.h でも、さっき子どもに花をもらったとき、少しだけ笑ってたよ。|C.o わたしが？ ……記録しておきます。花、は、効果あり。'],
  ['造り手','C.n わたしを造ったのは、廃聖堂の最後の神官でした。|C.n 彼は毎晩、わたしに祈りを教えました。誰もいない聖堂で、ひとりで。|C.s 彼が動かなくなった日、わたしは祈りの意味がわからなくなりました。|R.n その人は、ノアにひとりじゃないって言いたかったんじゃないかな。|C.o ……祈りは、言葉ではなく……。|C.n もう少し、考えさせてください。'],
  ['胸の痛み','N.n 仲間が倒れた戦いのあと、ノアがじっと胸を押さえていた。|C.s リオ様。ここが、軋みます。故障でしょうか。|R.s それは……「悲しい」っていうんだよ。|C.s かなしい。……これが。|C.n では、故障ではないのですね。|C.s わたしは、悲しいことができるようになったのですね。'],
  ['心灯','N.n 聖堂の祭壇に、ノアが新しい杖を捧げていた。先端に小さな灯が揺れている。|C.n 造り手の祈りと、わたしの祈りを込めました。|C.n リオ様。心がないのなら、この祈りはどこから来るのでしょう。|R.h ここにあるんだよ、きっと。|C.h ……はい。今、わかりました。|N.n ノアは、確かに笑っていた。十五度よりも、ずっとやわらかく。']],
 balza:[['なまくら','C.a なんじゃこの剣は！ 刃こぼれだらけのなまくらを振り回しおって！|R.s ご、ごめん……。|C.n 謝るのは剣にじゃ。貸せ、研いでやる。|R.o いいの？|C.n 職人の前でなまくらを持たれちゃ、わしの寝つきが悪くなるわい。|C.h ほれ、明日の朝には別物にしてやる。'],
  ['一杯だけ','N.n 星降り亭の祝杯。バルザが一杯目を飲み干した。|C.h うむ、うまい！ わしはドワーフじゃぞ、樽ごと持ってこい！|N.n ――その三秒後。|C.s ……リオ……炉が……回っとる……天井が回っとる……。|R.o 一杯で!?|C.s 内緒じゃぞ……ドワーフの名折れじゃ……。'],
  ['冷えた炉','C.n わしの師匠の炉はな、虚蝕に呑まれて火が消えた。|C.s 師匠も、炉と一緒に冷たくなった。わしは間に合わんかった。|R.s ……。|C.n それから、わしは炉の火だけは絶やさんと決めた。|C.a 火が消えたら、師匠の技まで消えちまう気がしてな。|R.n その火、俺たちにも分けてよ。'],
  ['相槌','C.n リオ、槌を持て。相槌を打ってもらう。|R.o 俺、鍛冶なんてしたことないよ。|C.a 拍子を合わせるだけじゃ！ わしが打ったら、お前が打つ！|N.n カン、カン、と火花が散る。ずれていた音が、少しずつ重なっていく。|C.h ……ほう。悪くない。お前、仲間に合わせるのがうまいのう。|R.h バルザに合わせてるだけだよ。'],
  ['炉心の斧','N.n 夜通し鳴っていた槌の音が、夜明けとともに止んだ。|C.n できたぞ。師匠の炉の灰を混ぜて打った斧じゃ。|C.n 相槌はお前じゃ。半分はお前の斧みたいなもんじゃな。|R.h じゃあ、バルザが振るって。俺の分まで。|C.h がっはっは！ 任せとけ！ 火は消えとらん、わしが打つ限りな！']],
 erna:[['的当て勝負','C.n 勝負しない？ あの枝の木の実、先に落とした方の勝ち。|R.o 俺、剣だよ!?|C.h ハンデはあげる。三本先に撃っていい。|N.n ――結果、エルナは目を閉じたまま一射で落とした。|C.n ふふ。勝負は勝負。今日の夕飯当番、よろしく。|R.s ずるい……。'],
  ['負けず嫌い','N.n 星降り亭のカード遊び。リオが三連勝している。|C.a ……もう一回。|R.n エルナ、そろそろ寝ない？|C.a もう一回！ 勝つまでやる！|R.h 意外と熱いんだね。|C.o ……っ！ 今のは見なかったことにして。'],
  ['外した一矢','C.s 昔、護衛の仕事で一矢を外したことがあるの。|C.n 風を読み違えた。その一矢で、守るはずだった人が倒れた。|C.s それから私は、外さないために誰とも組まなくなった。|R.n 一人なら、外しても自分のせいだけで済むから？|C.o ……そう。見抜かれるの、嫌いなんだけど。|R.n 俺たちと組んで、外したら一緒に謝ろう。'],
  ['風の読み方','C.n 教えてあげる。風は目じゃなくて、頬で読むの。|R.n 頬で？|C.h そう。目を閉じて。……今、左から来てる。|R.o ほんとだ！|C.n 一人で読む風より、二人で読む風の方が正確ね。|C.h 次の勝負は、ちょっとだけ手加減してあげる。ちょっとだけ。'],
  ['落ちぬ星','N.n エルナが新しい弓の弦を張っていた。弓の背に、小さな星が刻まれている。|C.n 流れ星は落ちるでしょう。でもこの弓の星は落ちない。|C.n 外した一矢も、仲間の分も、全部背負って構え続けるための弓。|R.h 似合ってるよ。|C.h ……ありがと。次は外さない。だから、あなたは前だけ見てて。']],
 crow:[['皮肉','C.n おや、灯守見習い殿。今日も世界を救う予定でお忙しいことで。|R.n クロウも一緒に救うんだよ。|C.a ……皮肉が通じないのか、お前は。|R.h 通じてるよ。でも返事はこれでいいと思って。|C.n ふん。調子が狂う。|C.h ……まあ、嫌いじゃない調子だが。'],
  ['家族の名前','N.n クロウが鎌の柄に彫られた文字を指でなぞっている。|C.n 妹のリナ、弟のテオ、母のエレナ。虚蝕に喰われた。|C.s 名前を彫っておかないと、俺の呪いが記憶まで喰っちまう。|R.s ……覚えておくよ。リナ、テオ、エレナ。|C.o なぜお前が覚える。|R.n 一人で覚えるより、忘れにくいだろ。'],
  ['呪いの代価','C.s 呪言は代価を取る。使うたびに、俺の中の何かが削れる。|R.n 何が削れるの？|C.s 最初は痛みだった。次に眠り。……最近は、笑い方を忘れた。|R.o それって……。|C.n 気にするな。復讐の道具に、笑顔は要らん。|R.a 要るよ。少なくとも、俺は見たい。'],
  ['最初の笑い','N.n ハクアがクロウの皿から肉を盗み、ジンのポポがそれをさらに盗んだ。|C.o おい、待て、それは俺の――|N.n 三人と一匹がもつれて、テーブルごとひっくり返る。|C.h ……っく、くくっ……ははっ！|R.o クロウが笑った!?|C.a 見るな！ 今のは呪いの副作用だ！'],
  ['名を刻む鎌','N.n クロウの新しい鎌には、家族の名前の隣に、仲間たちの名前が彫られていた。|R.o これ、俺たちの……。|C.n 呪いが喰いたがる名前を、全部ここに刻んだ。忘れないためにな。|C.n 呪いで救えるものがあるなら、俺が引き受ける。それは変わらん。|C.h ただ……救った先で、こうして笑ってる連中の顔を見るのも、悪くない。']],
 hakua:[['屋台めぐり','C.h リオ！ あっちの串焼きと、こっちの団子と、そっちの汁粉！ 全部！|R.o 全部!?|C.n 巫女は体が資本なの。……あと、ちょっとだけ食いしん坊。|R.h ちょっと？|C.a ちょっとだよ！ ……たぶん！|C.h ほら、半分あげる。一緒に食べた方がおいしいんだって。'],
  ['巫女の使命','C.n 氷華の社の巫女はね、代々、空の穴を閉じるために生まれてくるの。|C.s 生まれたときから決まってたんだ。私の行き先。|R.n ハクアは、それでいいの？|C.o ……え？|C.s そんなこと聞かれたの、初めて。|C.n ……ちょっと、考えさせて。'],
  ['母の手甲','N.n ハクアが古い手甲を胸に抱いていた。|C.n お母さんの形見。先代の巫女だったの。|C.s お母さんは使命を果たして、帰ってこなかった。|R.s ……。|C.s 私も同じ道を行くんだって、ずっと思ってた。怖いって言っちゃいけないって。|R.n 怖いって言っていいよ。俺も怖いから。'],
  ['自分で決める','C.a リオ！ 決めた！|R.o 何を!?|C.n 私、使命だから行くんじゃない。みんなと一緒に行きたいから行く。|C.h それでね、全部終わったら、みんなで社に帰って、ご飯いっぱい作るの！|R.h それ、すごくいい。|C.h でしょ！ だから絶対、生きて帰るんだから！'],
  ['雪華の手甲','N.n 母の手甲を打ち直した新しい手甲。雪の結晶の紋が光っている。|C.n お母さんの手甲に、私の願いを足してもらったの。|C.h 使命の鎖じゃなくて、私の約束のための拳！|R.h ハクアらしいね。|C.h 使命だからじゃない。私が、行きたいから行くんだ！']],
 jin:[['昼寝日和','N.n 草原の真ん中で、ジンとポポが並んで寝ている。|C.n お、リオか。いい風だろ。座れよ。|R.n 出発の時間、とっくに過ぎてるよ。|C.h 風が「もう少しここにいろ」って言ってるんだよ。ポポもそう言ってる。|N.n ポポ「キュイ」|R.h ……五分だけね。'],
  ['ポポ通訳','C.n ポポがお前に言いたいことがあるってさ。|R.o えっ、なんて？|N.n ポポ「キュキュ、キュイッ」|C.h 「おまえ、いつも がんばりすぎ。たまには なでさせろ」だとさ。|R.o 撫でさせろって、俺が撫でられる側!?|C.h ポポなりの気遣いさ。ほら、頭下げろ。'],
  ['出会った夜','C.n ポポと会ったのは、俺がまだ口のきけない子どもだった頃だ。|C.s 親もなく、森で迷って、獣の声ばかり聞いてた。人の言葉より先に、獣の言葉を覚えちまった。|C.n そんな俺を見つけたのが、ちっこいポポだった。|R.n ジンにとって、ポポは家族なんだね。|C.h 家族で、親友で、相棒さ。どっちが欠けても俺じゃない。'],
  ['ポポの熱','N.n 野営地。ポポが丸まって震えている。|C.s 熱がある。虚蝕の瘴気を吸いすぎたんだ。|C.a ……俺のせいだ。こいつを危ない場所に連れてきた。|R.n ノアとミレイユに薬草のことを聞いてくる！|N.n 夜明け、ポポの熱が下がった。|C.h ありがとな、リオ。……ポポが、お前も家族だってさ。'],
  ['二人の爪','N.n ジンが、ポポの抜けた爪と自分の爪を模した、二本並びの爪を見せた。|C.n ポポの古い爪を芯にして打ってもらったんだ。|C.h これでいつでも二人一緒さ。……三人か。お前もいるからな。|N.n ポポ「キュイ！」|C.h 俺たちは二人で一つ。どっちが欠けても王じゃない。']],
 celes:[['茶会の命令','C.n そこの灯守。わらわの茶を淹れよ。湯は八十度、蒸らしは百二十秒じゃ。|R.o 細かい！|C.a 千年かけて辿り着いた黄金律じゃぞ。|N.n ――リオの淹れた茶を、セレスは無言で飲み干した。|C.n ……七十八度じゃな。|C.h まあ、よい。明日も淹れよ。'],
  ['数える癖','N.n セレスが指を折って何かを数えている。|R.n 何を数えてるの？|C.n 日じゃ。あの回廊で、ひとりで過ごした日を数える癖が抜けぬ。|C.s 三十六万五千と……ええい、もう数えるのも面倒じゃ。|R.n じゃあ、今日からは数えなくていいよ。|C.o ……なに？'],
  ['千年の孤独','C.n わらわは時を止める魔女じゃ。止めた時の中では、誰も話しかけてこぬ。|C.s 千年、誰にも名を呼ばれなかった。名前の発音を、忘れかけておった。|R.n セレス。|C.o ……。|R.h セレス、セレス、セレス。忘れないように。|C.a や、やかましい！ ……ばか者。'],
  ['先に逝く者','C.s 灯守。おぬしらは、わらわより先に逝く。|C.s 千年の先で、わらわはまたひとりで時を数えるのじゃろう。|R.s ……。|R.n でも、そのとき思い出す日があるよ。茶を淹れた日とか、名前を呼んだ日とか。|C.o 思い出を、数えるのか。|C.h ……それは、悪くない数え方じゃな。'],
  ['千年目の砂時計','N.n セレスが新しい砂時計の杖を見せた。砂は、上にも下にも落ちていく。|C.n わらわの千年を詰めた砂時計じゃ。これからの時間も、ここに積もる。|C.h 灯守。おぬしと過ごす時を、わらわは止めぬ。|R.h 止めなくていいの？|C.h 止めたら、次の茶が飲めぬではないか。……もう、数えなくてよいのじゃな。']],
 valk:[['手合わせ','C.a 灯守！ 剣を抜け！ 今日の手合わせだ！|R.o 昨日も一昨日もやったよ!?|C.h 昨日のお前より、今日のお前の方が強い。だから今日も戦う価値がある！|R.s 理屈がおかしい……。|C.h 来い！ 俺の血が騒ぐ！|N.n ――夕暮れまで続いた手合わせは、引き分けに終わった。'],
  ['竜の血','N.n 戦いのあと、ヴァルクが自分の手をじっと見つめていた。|C.s 覚醒のたびに、竜の血が叫ぶ。仲間ごと焼き尽くせ、と。|C.a 俺は戦いが好きだ。だが、喰らうための戦いは好かん。|R.n だから、俺とだけ共鳴できるのかな。|C.o ……お前の灯は、竜の炎でも消えなかった。|C.h だから組める。それだけだ。'],
  ['竜の巣の記憶','C.n 竜の巣はな、俺の生まれた場所だ。|C.s 一族は虚蝕に呑まれて、黒い炎の竜になった。ヴォルガノンも、元は俺の兄貴分だ。|R.s ……知らなかった。|C.a 同情はいらん！ ……兄貴は最後まで強かった。それを誇りに思ってる。|R.n じゃあ、俺もその強さを覚えておくよ。|C.n ……ああ。頼む。'],
  ['並んで燃やす','C.n 灯守。俺はずっと、強いやつと戦うために生きてきた。|C.n だが最近、強いやつと並んで戦う方が、血が騒ぐ。|R.h それ、仲間っていうんだよ。|C.o 仲間……。竜の言葉にはない響きだ。|C.h 覚えた。仲間。……悪くない。'],
  ['誓鱗の竜剣','N.n ヴァルクが、自らの逆鱗を剥がして打たせた竜剣を掲げた。|R.o 逆鱗って、竜の一番大事な鱗じゃ……！|C.n だからだ。一番大事なものを、一番大事な戦いに使う。|C.h この炎は喰うためじゃない。並んで燃やすためのものだ。|C.a さあ灯守！ 祝いに一戦やるぞ！|R.h ……やっぱりそうなるのか！']]};

/* --- 専用ユニーク装備（絆5話の報酬） --- */
const UQ={rio:['灯継ぎの剣','覚醒中の与ダメ+30%'],gald:['誓約の大剣','受けるダメージ-15%'],mire:['双星の魔導書','弱点を突いた魔法の与ダメ+30%'],shion:['家族の双剣','HPが満タンの敵への与ダメ+40%'],
 noah:['心灯の杖','ノアが生存中、味方全員の被ダメ-8%'],balza:['炉心の斧','炎属性の与ダメ+25%'],erna:['落ちぬ星の弓','単体攻撃の与ダメ+25%'],crow:['名を刻む大鎌','自分のHP50%以下で与ダメ+40%'],
 hakua:['雪華の手甲','連撃技の与ダメ+25%'],jin:['二人の爪','与ダメ+15%・被ダメ-10%'],celes:['千年目の砂時計','無属性魔法の与ダメ+30%'],valk:['誓鱗の竜剣','ブレイク中の敵への与ダメ+50%']};
for(const id in UQ)LEG['uq_'+id]={n:UQ[id][0],slot:'w',who:id,uq:1,d:'絆の専用装備：'+UQ[id][1]};
function uqItem(id){const ilv=Math.max(30,G.h[id]?G.h[id].lv:30),it=genItem(ilv,0,0,'w',4);it.leg='uq_'+id;it.who=id;wbase(it,ilv,'星鋼');
 for(const k in it.base)it.base[k]=Math.round(it.base[k]*1.25);it.name=UQ[id][0];it.unid=false;it.uq=1;return it;}
{const _ca=calc;calc=function(a,t,sk){const r=_ca(a,t,sk),al=a.legs||[],tl=t.legs||[];let m=1;
 if(al.length){if(al.includes('uq_rio')&&a.aw)m*=1.3;if(al.includes('uq_mire')&&r.weak&&sk.k==='mag')m*=1.3;if(al.includes('uq_shion')&&t.hp>=t.mhp)m*=1.4;
  if(al.includes('uq_balza')&&sk.el==='炎')m*=1.25;if(al.includes('uq_erna')&&sk.t==='one')m*=1.25;if(al.includes('uq_crow')&&a.hp<=a.mhp/2)m*=1.4;
  if(al.includes('uq_hakua')&&(sk.hits>1||sk.k==='rhythm'))m*=1.25;if(al.includes('uq_jin'))m*=1.15;if(al.includes('uq_celes')&&!sk.el&&sk.k==='mag')m*=1.3;if(al.includes('uq_valk')&&t.broken)m*=1.5;}
 if(t.side===0){if(tl.includes('uq_gald'))m*=.85;if(tl.includes('uq_jin'))m*=.9;if(B&&B.heroes.some(h=>h.alive&&h.legs&&h.legs.includes('uq_noah')))m*=.92;}
 if(m!==1)r.d=Math.max(1,Math.round(r.d*m));return r;};}

/* --- 絆データ --- */
const bondOf=id=>{G.bond=G.bond||{};return G.bond[id]=G.bond[id]||{p:0,ep:0};};
const bondIds=()=>G.members.filter(id=>BSTORY[id]);
const bondNext=id=>{const b=bondOf(id);return b.ep<5&&b.p>=BOND_REQ[b.ep];};
const bondReadyN=()=>bondIds().filter(bondNext).length;
const epTotal=()=>bondIds().reduce((a,id)=>a+bondOf(id).ep,0);
{const _bo=bonus;bonus=function(id){const o=_bo(id),ep=(G.bond&&G.bond[id]&&G.bond[id].ep)||0;if(ep)for(const k of['atkP','magP','defP','resP','mhpP'])o[k]=(o[k]||0)+ep;return o;};}
{const _rw=rewards;rewards=function(es){const r=_rw(es),boss=es.some(e=>ED[e.kind]&&ED[e.kind].boss);
 G.zk=G.zk||{e:{},i:{}};es.forEach(e=>{const k=e.kind.replace(/^vo_/,'');G.zk.e[k]=(G.zk.e[k]||0)+1;});
 const up=[];G.party.filter(id=>BSTORY[id]).forEach(id=>{const was=bondNext(id);bondOf(id).p+=boss?3:1;if(!was&&bondNext(id))up.push(HB[id].name);});
 if(up.length)r.ups.push(`♥ ${up.join('・')}との絆が深まった（酒場で語らえる）`);return r;};}
{const _al=addLoot;addLoot=function(it){zkItem(it);return _al(it);};}
function zkItem(it){G.zk=G.zk||{e:{},i:{}};if(it.leg)G.zk.i[it.leg]=1;if(it.set)G.zk.i['set:'+it.set+':'+it.slot]=1;}
{const _mg=migrate;migrate=function(g){_mg(g);g.bond=g.bond||{};if(!g.zk){g.zk={e:{},i:{}};const bk={boss1:'boss',boss2:'boss2',boss3:'boss3',boss4:'boss4',boss5:'boss5',boss6:'boss6',boss7:'boss7',boss9:'boss9'};for(const f in bk)if(g.flags&&g.flags[f]&&ED[bk[f]])g.zk.e[bk[f]]=1;}
 (g.inv||[]).forEach(zkItem);return g;};}

/* --- 絆の語らい（酒場） --- */
function bondMenu(m){const ids=bondIds();log((m||'<b>絆の語らい</b>　一緒に戦うと絆が深まる（ボス戦は3倍）。1話ごとに全能力+1%、5話目で専用装備')+goldTxt());
 panel(ids.map(id=>{const b=bondOf(id),ok=bondNext(id),nx=BOND_REQ[b.ep],pc=b.ep>=5?100:Math.min(100,b.p/nx*100||100);
  return`<div class="icard r${b.ep>=5?4:b.ep>=3?2:0}"><img class="iic" src="${exprFace(id,ok?'h':'n')}"><div class="ibody"><div class="inm">${HB[id].name}　<span style="color:#ff8ab0">${'♥'.repeat(b.ep)}${'♡'.repeat(5-b.ep)}</span></div>
  <div class="isub">${b.ep>=5?'絆MAX：専用装備「'+UQ[id][0]+'」':ok?'第'+(b.ep+1)+'話「'+BSTORY[id][b.ep][0]+'」':'次の話まで 絆'+b.p+'/'+nx}</div><div class="bar sp" style="margin-top:3px"><i style="width:${pc}%"></i><span>絆 ${b.p}</span></div></div>
  <div class="iright">${b.ep>=5?`<button class="tbtn" style="width:62px;height:40px" data-a="re" data-v="${id}">回想</button>`:`<button class="tbtn ${ok?'gold':''}" style="width:62px;height:40px" data-a="go" data-v="${id}" ${ok?'':'disabled'}>語らう</button>`}</div></div>`;}).join('')+
 (bondIds().length?'':'<div class="emp">まだ仲間がいない</div>')+'<button class="tbtn back wide" data-a="back">戻る</button>',
 {go:id=>bondPlay(id),re:id=>recall(id),back:()=>tavern()});}
function bondPlay(id){const b=bondOf(id),n=b.ep,[tt,s]=BSTORY[id][n];log(`<b>${HB[id].name}　第${n+1}話「${tt}」</b>`);
 talk(parseEp(id,s),()=>{b.ep=n+1;let msg=`<b>${HB[id].name}との絆が深まった！</b>（♥${b.ep}　全能力+${b.ep}%）`;SFX.aw();
  if(b.ep===5){const it=uqItem(id);G.inv.push(it);zkItem(it);msg+=`<br>専用装備 ${ihtml(it)} を手に入れた！`;}
  if(epTotal()>=25&&!(G.flags&&G.flags.uqRio)){G.flags.uqRio=1;const it=uqItem('rio');G.inv.push(it);zkItem(it);msg+=`<br>仲間たちとの絆が、リオの剣に灯った――${ihtml(it)}`;}
  save();bondMenu(msg);});}
function recall(id){const b=bondOf(id);log(`<b>${HB[id].name}の回想</b>`);
 menu([...BSTORY[id].slice(0,b.ep).map(([tt,s],i)=>({l:`第${i+1}話「${tt}」`,f:()=>talk(parseEp(id,s),()=>recall(id))})),{l:'戻る',cls:'back',f:()=>bondMenu()}],true);}

/* --- 図鑑（敵・装備・仲間） --- */
const PROF={rio:['17・灯守見習い','星継ぎ／剣／光','まっすぐだが自分の力のなさに悩む','主人公'],gald:['34・元騎士団長','守護騎士／大剣＋盾／地','寡黙で面倒見がいい。過去に部下を失った','序章で加入'],
 mire:['19・図書遺跡の司書','双極魔導師／書／炎・氷','理屈っぽいが友情に厚い','第1章・図書遺跡の最奥'],shion:['16・街の盗賊','影走り／双剣／風','生意気。孤児たちの兄貴分','酒場の依頼「盗まれた鍵」'],
 noah:['不明・人形の神官','機織神官／杖／光','無表情で丁寧。人の感情を学んでいる','第2章・廃聖堂で目覚めさせる'],balza:['45・ドワーフの鍛冶師','炉匠／斧／炎','頑固で職人気質。酒に弱い','鍛冶屋Lv3＋黒鉄鉱山'],
 erna:['22・流れの狙撃手','天弓手／弓／雷','クールで負けず嫌い','雷鳴高原の塔で一騎打ち'],crow:['28・呪術師','呪言使い／鎌／闇','皮肉屋。虚蝕に家族を奪われた','第3章ボス戦後に「救う」'],
 hakua:['18・東方の巫女','氷拳巫女／拳／氷','元気で大食い。巫女の使命に縛られている','第4章・氷華の社'],jin:['31・獣使い＋相棒ポポ','共生士／爪／地・風','のんびり屋。獣の言葉がわかる','翠の森の夜（隠し）'],
 celes:['不明・時の魔女','刻術師／砂時計／無','尊大だが寂しがり','虚の回廊30層を踏破'],valk:['不明・竜人','竜剣士／大剣／炎・闇','野性的。戦いを好む','竜の巣で決闘に勝利']};
const ZIMG={};const zimg=(k,sil)=>{const key=k+(sil?'_w':'');if(ZIMG[key])return ZIMG[key];const c=IMG[key]||IMG[k];return ZIMG[key]=c?c.toDataURL():'';};
const zkEnemies=()=>Object.keys(ED).filter(k=>!/^(tr_|vo_)/.test(k)&&k!=='valkE'&&IMG[k]);
const zkEquip=()=>[...Object.keys(LEG).map(k=>({k,n:LEG[k].n,d:LEG[k].d,t:LEG[k].uq?'ユニーク':'レジェンド'})),...Object.keys(ROYAL).map(s=>({k:'set:royal:'+s,n:ROYAL[s],d:SETS.royal.d2+'／'+SETS.royal.d4,t:'セット'}))];
let ZKT='e';
function zkMenu(m){G.zk=G.zk||{e:{},i:{}};G.inv.forEach(zkItem);const Z=G.zk,es=zkEnemies(),eq=zkEquip(),hs=Object.keys(PROF);
 const ne=es.filter(k=>Z.e[k]).length,ni=eq.filter(x=>Z.i[x.k]).length,nh=hs.filter(id=>G.members.includes(id)).length;
 log((m||'<b>図鑑</b>　タップで詳細')+`<br><small>敵 ${ne}/${es.length}　装備 ${ni}/${eq.length}　仲間 ${nh}/${hs.length}</small>`);
 let body='';
 if(ZKT==='e')body='<div class="zgrid">'+es.map(k=>{const s=!!Z.e[k];return`<div class="ztile${s?'':' un'}${ED[k].boss?' bs':''}" data-a="e" data-v="${k}"><img src="${zimg(k,!s)}"><span>${s?ED[k].name:'？？？'}</span></div>`;}).join('')+'</div>';
 if(ZKT==='i')body=eq.map(x=>{const s=!!Z.i[x.k];return`<div class="icard r4${s?'':' off'}"><div class="ibody"><div class="inm">${s?x.n:'？？？'}</div><div class="isub"><span class="rb">${x.t}</span></div><div>${s?chips([x.d],'lg'):chips(['未入手'])}</div></div></div>`;}).join('');
 if(ZKT==='h')body=hs.map(id=>{const j=G.members.includes(id),P=PROF[id],b=G.bond&&G.bond[id];return`<div class="icard r${j?2:0}${j?'':' off'}" data-a="h" data-v="${id}"><img class="iic" src="${j?exprFace(id,'n'):zimg(id,1)}"><div class="ibody"><div class="inm">${j?HB[id].name:'？？？'}${j&&BSTORY[id]?`　<span style="color:#ff8ab0">${'♥'.repeat(b?b.ep:0)}</span>`:''}</div><div class="isub">${j?P[0]+'　'+P[1]:'加入条件：'+P[3]}</div><div>${j?chips([P[2]]):''}</div></div></div>`;}).join('');
 panel(`<div class="ftabs" style="grid-template-columns:repeat(3,1fr)">${[['e','敵'],['i','装備'],['h','仲間']].map(([k,n])=>`<button class="${ZKT===k?'on':''}" data-a="tab" data-v="${k}">${n}</button>`).join('')}</div>${body}<button class="tbtn back wide" data-a="back">戻る</button>`,
 {tab:k=>{ZKT=k;zkMenu();},e:k=>zkEnemy(k),h:id=>zkHero(id),back:()=>tavern()});}
function zkEnemy(k){const d=ED[k],n=G.zk.e[k];if(!n){log('<b>？？？</b>　まだ倒したことがない敵');return;}
 log(`<b>${d.name}</b>${d.boss?' <span style="color:#ff7a7a">BOSS</span>':''}　撃破 ${n}体<br><small>HP${d.mhp} 攻${d.atk} 防${d.def} 魔${d.mag} 精${d.res} 速${d.spd}　シールド${d.brk}</small><br>弱点：${d.weak.map(e=>`<span style="color:${ELC[e]}">${e}</span>`).join(' ')}　落とす物：${(d.drop||[]).map(([m])=>MATS[m]?MATS[m].n:m).filter((v,i,a)=>a.indexOf(v)===i).join('・')||'なし'}`);}
function zkHero(id){if(!G.members.includes(id)){log('<b>？？？</b>　加入条件：'+PROF[id][3]);return;}const P=PROF[id];
 talk([[id,'n',`${HB[id].name}。${P[0]}。${P[1]}。`],[id,'h',P[2]+'――そんなふうに見えているなら、それでいい。']],()=>zkMenu());}

/* --- 酒場・街への組み込み --- */
tavern=function(){const dec=G.declined||[],n=bondReadyN();
 log('<b>酒場「星降り亭」</b>'+goldTxt()+'<br>'+G.members.map(id=>statLine(id)+(G.party.includes(id)?'':' <small style="color:#aab">（控え）</small>')).join('<br>'));
 menu([{l:'編成',s:'前衛は4人まで',f:formation},{l:'絆の語らい',s:n?`♥ 新しい話 ${n}件`:'仲間との会話',cls:n?'ready':'',f:()=>bondMenu()},{l:'図鑑',s:'敵・装備・仲間',f:()=>zkMenu()},{l:'依頼掲示板',f:board},
  ...dec.map(id=>({l:HB[id].name+'を誘う',cls:'ready',f:()=>{G.declined=dec.filter(x=>x!==id);newMember(id);SFX.aw();save();tavern();}})),{l:'戻る',cls:'back',f:()=>townMenu()}],true);};
{const _tm=townMenu;townMenu=function(m){_tm(m);const n=bondReadyN(),b=$('#cmd').children[2];if(n&&b){b.classList.add('ready');b.insertAdjacentHTML('beforeend','<small>♥絆'+n+'</small>');}};}

/* --- 開発者モード --- */
function dev15(m){log((m||'<b>ver0.15 絆と会話</b>')+`<br><small>語らった話 ${epTotal()}/${bondIds().length*5}　図鑑：敵${Object.keys((G.zk||{e:{}}).e).length}種</small>`);
 menu([{l:'絆の語らいを開く',cls:'ready',f:()=>bondMenu()},{l:'図鑑を開く',f:()=>zkMenu()},
  {l:'表情5種の会話テスト',f:()=>talk(['rio','gald','mire','noah','hakua'].filter(i=>HB[i]).flatMap(i=>'nhaso'.split('').map(e=>[i,e,`${HB[i].name}：表情「${EXN[e]}」`])),()=>dev15())},
  {l:'全員の絆ポイントMAX',f:()=>{bondIds().forEach(id=>bondOf(id).p=99);save();dev15('全員の絆を99にした（全話解放）');}},
  {l:'絆をリセット',f:()=>{G.bond={};G.flags.uqRio=0;save();dev15('絆を0に戻した');}},
  {l:'専用装備を全種受け取る',f:()=>{Object.keys(UQ).forEach(id=>{const it=uqItem(id);G.inv.push(it);zkItem(it);});save();dev15('専用ユニーク装備12種を受け取った');}},
  {l:'図鑑の敵を全登録',f:()=>{zkEnemies().forEach(k=>G.zk.e[k]=G.zk.e[k]||1);save();dev15('敵図鑑を全登録した');}},{l:'戻る',cls:'back',f:()=>dvMenu()}],true);}
{const _dv=dvMenu;dvMenu=function(m){_dv(m);const c=$('#cmd'),b=document.createElement('button');b.className='c ready';b.innerHTML='ver0.15 絆と会話<small>絆イベント・表情・専用装備・図鑑</small>';b.onclick=()=>{SFX.sel();dev15();};c.insertBefore(b,c.firstChild);c.children[1].classList.remove('ready');};}
