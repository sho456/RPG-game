/* ===== 旧画面の入口 → 仲間画面（UNIT）へ（ver0.53。旧「編成画面と陣形」の正本はコマンド戦闘と一緒に削除した） =====
 強化メニュー（js/ui/growth.js）が呼ぶ partyScreen / openSheet / board / bondMenu を、仲間画面に向ける。 */
'use strict';
partyScreen=function(){UNIT.open();};
openSheet=function(id){UNIT.open(id);};
board=function(){UNIT.open();};
bondMenu=function(){UNIT.open();};
function trialMenu(){UNIT.open();}
