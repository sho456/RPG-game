# Study: RS-style battle sprite anatomy (pixel-exact, 32×32 grids)

- source: four user-provided 32×32 grid drawings in the RS (Romancing SaGa) style — two characters × (stand, flying kick) — converted 1:1 with `.claude/skills/rs-style-sprite/scripts/grid2png.py`; site rules summarized from dotartplay.com search results (the page itself is behind a bot check)
- true size: canvas 32×32. Stand: **boy 14 w × 31 h, girl 15 w × 27 h**; kick: 25–26 w × 24–31 h | colors: 21–27
- outline: **#202020, one color for everything**, 36–37% of all pixels are outline (silhouette + every part boundary + cloth folds)
- dithering: none

## Measured anatomy (boy, 31 h)
- head rows 1–15 (≈ half the height); hair 13–14 wide including outline, single-pixel spikes poke out of the silhouette on the top and the back
- face visible area 5 px wide; **eyes are 1 px wide × 2 px tall** (dark top, bright bottom), far eye at the face's front edge, one skin pixel between, near eye followed by **1 white pixel (sclera)**; **upper lids = 2 outline pixels above each eye**; no mouth, no nose; chin 3–4 px of skin
- bangs: 2–3 hair strands hang into the forehead with skin showing between them; darkest hair step sits under the bangs and at the nape
- torso 8 rows, 10 px wide incl. outline; collar/tie gives the only accent color (3 px)
- cloth = **2 tones** (light front panel, dark back) + outline-colored fold lines inside
- far hand visible at the back (2×2 skin, 3 tones), near arm mostly hidden in the torso
- legs: 2 px per leg + outline between; boots 2 tones, toes point forward (left)
- girl: same eye and lid construction; hair reaches mid-back and is the largest mass; shorter (27)

## Rules to apply
- Stand fits 32×32 with feet on the bottom row; male 30–31, female 27–29 tall, 14–16 wide (without weapon).
- Draw order (site): outline → flat colors → highlight & shadow → details.
- Near = bright, far = dark: the far arm/leg/hair side uses the darker steps.
- Palette budget: outline 1, skin 3, hair 3–5, each cloth 2, metal 3, boots 2, accent 1–2; ~20–26 total.
- Attack poses may use the full 32 width (a kick or a swing); keep the foot pivot fixed.

## Do NOT copy
- The referenced characters (they are fan art of commercial characters); take only the construction rules.
