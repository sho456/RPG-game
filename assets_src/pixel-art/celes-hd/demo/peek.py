# 要所のコマだけ描いて並べる（確認用）：python3 peek.py <技> τ1 τ2 ...
import sys
from PIL import Image
import skills as K, fxcore as X
sk = K.SK[sys.argv[1]]()
ts = [float(v) for v in sys.argv[2:]]
ims = [Image.fromarray(sk.frame(sk.tl.fi_of(t))).resize((480, 270)) for t in ts]
cols = 3
sh = Image.new('RGB', (480 * cols, 270 * ((len(ims) + cols - 1) // cols)))
for i, im in enumerate(ims):
    sh.paste(im, ((i % cols) * 480, (i // cols) * 270))
sh.save(f'out/peek_{sys.argv[1]}.png')
