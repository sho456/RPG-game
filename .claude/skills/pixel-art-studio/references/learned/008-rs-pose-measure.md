# Study: RS in-game battle sprites, measured per pose (front / stand / ready / near-death / knocked out)

- source: 11 user-provided RS in-game sprites (384×384 WebP, 8× upscale of 48×48 cells, white background), different characters; converted with `.claude/skills/rs-style-sprite/scripts/rs_ref.py`, measured with `rs_check.py`. Full numbers: `.claude/skills/rs-style-sprite/references/measure-v2.md`
- true size: stand 30 h × 16–17 w (front 18 w); ready 28–29 h × 24–25 w; near-death 24–26 h × 20–24 w; knocked out 14–15 h × 32 w | colors: 17–22 plain, 28–36 ornate
- outline: **#000000 on 98–100% of the silhouette edge**; inner black only 7–13% of all pixels (eyes, lids, arm/torso overlap, under bangs, between legs, belt); other inner boundaries use the material's darkest step
- dithering: none

## What differs from 006/007 (fan grids)
- cloth is 3–6 hue-shifted steps, not 2 flat tones; hair 5 steps ending in white (halo band); skin 4 steps shading toward red
- eye = 3 rows: black lid → black pupil top (merges with lid) → saturated iris; 1 skin px between eyes (front: 2); sclera 2 rows tall behind the near eye
- near-white highlights cover 1–9% of pixels; grey shadows almost absent (0–5%, armour up to 14%)

## Pose numbers (relative to stand height Hs)
- stand: head centroid 2.5–3 px ahead (toward the enemy) of the feet; one ground contact
- ready: 0.93–0.97 Hs, feet apart (24–25 wide), lead hand 3–6 px ahead of the face, hair/ribbons streaming 3–6 px back
- near-death: 0.80–0.87 Hs, kneeling, head down 3–4 px and tilted forward, ground 1–2 px above the stand ground
- knocked out: 0.47–0.50 Hs, width Hs+2, lying on the side, ground 4 px above the stand ground

## Do NOT copy
- The characters, costumes and palettes (commercial game art). Only the construction rules and measurements.
