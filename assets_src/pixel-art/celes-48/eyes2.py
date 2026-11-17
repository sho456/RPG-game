# 詠唱：正面と同じ形の白目（外側）。気絶：閉じた目を 2 ドットの線に・口
import numpy as np
Q=dict(np.load('c2.npz'))
W,WS,L,SK=7,11,9,26
for y,x,c in [(20,26,SK),(20,28,L),(21,20,WS),(22,20,W),(21,28,WS),(22,28,W),(46,16,-1),(46,35,-1)]: Q['cast'][y,x]=c
for y,x,c in [(32,21,L),(36,22,31)]: Q['faint'][y,x]=c
np.savez('e2.npz',**Q)
