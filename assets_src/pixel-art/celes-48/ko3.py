# 戦闘不能：後ろへ吹き飛ばされて仰向けに倒れる（足が敵側＝左、頭が右・顔は上・目を閉じる）
import numpy as np
from PIL import Image
C=np.load('pal.npy')
M={'K':9,'D':0,'d':15,'s':29,'m':2,'n':23,'l':4,'G':3,'Y':22,'g':19,'t':1,'b':5,
   'W':7,'h':11,'H':13,'j':10,'J':25,'S':26,'k':8,'q':17,'B':16,'o':24,'e':20,'E':12,'F':27,'r':14,'u':21,'p':31}
cv=np.full((48,48),-1)
def put(txt,x0,y0):
    for dy,row in enumerate(txt.strip('\n').split('\n')):
        for dx,ch in enumerate(row):
            if ch not in ' .' and 0<=x0+dx<48 and 0<=y0+dy<48: cv[y0+dy,x0+dx]=M[ch]
L={}
L['hat']=('''
...KKK............
..KsmsK...........
..KdKlmK..........
...K.KlmKK........
.....KlmmsK.......
.....KlmmmsK......
....KllmmmssK.....
....KlmmmmmsdK....
...KlmmmmmmssdK...
...KYGGGGGggggbK..
..KgYYYGGGgggbbK..
.KmKKKggggggbbKKK.
KmmmmsKKKKKKKKsssK
KlmmmmmmssssssssdK
.KKdddddddddddddK.
''',2,22)
L['hair']=('''
..........KKKK.......
........KKhhhhKKK....
......KKhhWWhhhhhKK..
.....KhhhWhhhhjjhhhK.
....KhhWhhhjjhhhhjjhK
...KhhhhhjjhhhJjjhhjK
..KjhhhjjhhhJJjjhhjJK
..KjhjjhhJJjjjhhjJJK.
.KjjhhJjjjhhjJJjjJK..
.KJjjjjJJhhjJJJjJJjKK
KJjjJJjjjjJJjJJjJJJJK
KJJKJJJJKJJJKJJJKKKK.
.KK.KKKK.KKK.KKK.....
''',28,35)
L['body']=('''
..........KKKKKKKK....
........KKmmlllllmKK..
....KKKKmmlllllllmlmK.
..KKmmmmlllllllllmllK.
.KgmGGGGGGGGGGeGGGmmsK
KgYmmmmmmmmmmmgmmmmssK
KgYmmmmmmmmmmsgsmmmssK
KgYsmmmmssssssgssssddK
KgYssssssddddddgdddK..
KKgdddddddddddddgddK..
.KKKKKKKKKKKKKKKKKK...
''',4,35)
L['boot']=('''
.KK...
KoBK..
KoBBK.
KoBBBK
KoBBBK
KKBBK.
.KKK..
''',0,36)
L['head']=('''
....KK...KKKKK...
...KSSK.KhWWhhKK.
..KSSSSKhWhhhjhhK
.KqSSKKKhhhjhhJjK
KqSSSSkKhjhhjJjjK
KqSSSkSqhhjhJjjJK
.KqqSSqhjhjJjjJJK
..KKqqhjjJjjJjJK.
....KKjjJjJjJJK..
.....KJjJJjJJK...
......KKKKKKK....
''',24,32)
L['arm']=('''
........KKKKKK
......KKllllmK
....KKGlllmmsK
..KKkKGmmmssdK
.KSSkKKKKKKKK.
..KKK.........
''',9,41)
L['staff']=('''
.KKKK.................................
KgYYgK................................
KYFEbKKKKKKKKKKKKKKKKKKKKKKKKKKKKK....
KYEFbtttttttttttttttttttttttttttbK....
KgbbgKKKKKKKKKKKKKKKKKKKKKKKKKKKK.....
.KKKK.................................
''',4,42)
ORDER=['hat','hair','body','boot','head','staff','arm']
for k in ORDER: put(L[k][0],L[k][1],L[k][2])
np.save('ko.npy',cv)
def img(q,z):
    im=np.zeros((48,48,4),np.uint8);m=q>=0;im[m,:3]=C[q[m]].astype(np.uint8);im[m,3]=255
    return Image.fromarray(im,'RGBA').resize((48*z,48*z),Image.NEAREST)
bg=Image.new('RGBA',(480+48*3+20,480),(60,64,84,255));bg.alpha_composite(img(cv,10));bg.alpha_composite(img(cv,3),(490,300));bg.save('ko_z.png')
# ---- 仕上げ：頭の下の線を髪に戻す・襟の金・戦いの汚れ（瀕死と同じ茶色）
for x,c in zip(range(30,37),[10,25,10,11,10,25,10]): cv[42,x]=c
for y,x,c in [(37,22,3),(38,23,22),(39,23,19),(37,28,21),(37,33,25),(38,31,7)]: cv[y,x]=c
PUR={2,4,29,15,23}
for y,x,c in [(36,20,21),(40,21,14),(41,24,14),(38,12,21),(28,9,14),(31,12,21),(33,6,14),(26,8,21)]:
    if cv[y,x] in PUR: cv[y,x]=c
np.save('ko.npy',cv)
bg=Image.new('RGBA',(480+48*3+20,480),(60,64,84,255));bg.alpha_composite(img(cv,10));bg.alpha_composite(img(cv,3),(490,300));bg.save('ko_z.png')
