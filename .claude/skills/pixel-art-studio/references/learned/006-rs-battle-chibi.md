# Study: RS-style battle chibi (21-pose sheet)

- source: user-provided reference sheets (2 characters, 240×240 sheets at 2× = 48×48 cells, 5×5 grid) and two 32×32 grid drawings
- true size: cell 48×48; body 17–21 px wide, **28–31 px tall**; mages with hat/aura up to 38 px | colors: 22 (plain) – 40 (with aura/glow)
- ramps: hair 4 steps (pale top highlight → mid → dark → near-outline), skin 3, cloth 3, metal 3; hue shifts warm in light, cool/purple in shadow
- outline: **continuous 1 px near-black (#202020-ish, slightly cool)** around the silhouette AND between overlapping parts (arm over torso, hair over face, sleeve over hand) — not selout
- dithering: none on characters (≈1–2% only where a glow is anti-aliased)
- shading: light from upper-left; a single bright hair cluster on the top-left of the head; cloth shadow on the right/back side; faces almost flat (2 tones + 1 shadow column under the hair)

## Rules to apply
- Head ≈ 40% of height (12–13 px tall, 13–14 px wide on a 30 px body). Eyes sit in the lower half of the head: 2 px tall (dark top row, colored bottom row) with a 1 px white glint; far eye on the left edge in a left-facing 3/4 view.
- Side view = **3/4 facing left** (toward the enemy). Front/back views exist only for field/menus.
- Every part gets its own outline before stacking → internal dark lines separate arm/torso/legs. Hands are 2×2 blobs, feet 3–4 px long pointing forward.
- Legs are short (7–9 px). Stance is wide and grounded; feet always on the same baseline across frames.
- Attack frames swing the whole body: wind-up leans back 2–3 px, the strike frame lunges 4–6 px forward with the front foot planted far forward; a light smear arc (1 frame, 2-tone pale blue/white) shows the weapon path.
- Hurt: head and shoulders thrown back 3–4 px, arms open. Dying: one knee down, head lowered, weapon planted. KO: flat on the ground, about 20 px tall cell content.
- Keep each character within ~22 colors; reuse one outline color for everything.

## Do NOT copy
- The specific characters, costumes or poses of the reference sheets (they are from a commercial game). Copy only the proportions, outline rule, ramp structure and pose vocabulary.
- Glow auras baked into the sprite: in this project glows are drawn by the effect layer (js/battle).
