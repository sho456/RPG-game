# Study: RS battle presentation from two 60fps screen recordings + command-select poses

- source: two user-provided recordings (sword multi-hit skill; water spell with summon), split with `.claude/skills/rs-battle-fx/scripts/vref.py`; three command-select sprites via `rs_ref.py`. Numbers: `.claude/skills/rs-battle-fx/references/video-2026-11.md` (the RS sprite-style notes were removed in 2026-11)
- recordings are not kept in the repo; only timings, structure and colour logic

## Timing (speed ×1)
- name bubble 0.45–0.6 s → darken in 0.17–0.2 s (sword to 41%, spell to 64%) → wind-up → release → impacts → un-darken over 0.45 s (2–3× slower than the fade-in)
- sword swing cycle ≈ 0.62 s: low guard 70 ms → raise 70 ms → **hold behind the back 130 ms** (glint on the tip) → **white crescent smear 70 ms** → hold follow-through 200 ms; flying slash lands 0.37 s after the smear
- spell: omen ellipse on the ground under the enemy (2–2.5× its width) → caster hops → background to black + white orb (0.05–0.1 s) → star flash → pillar/summon coiling around it (≈1.1 s) → dissolve into particles → background returns → enemy tinted in the spell colour → Weak → count-up number → red → checkerboard dissolve (0.25 s)

## Effects & sound
- one element = main colour + neighbouring support colour + white core; order core → rays → ring → drifting particles; expand fast (4–6 frames), fade slow (10–20)
- big screen FX are hi-res additive light; small character-attached FX (glints, smears, foot pillars) are crisp shapes
- SFX = noise bed for the whole skill + per-impact metal ring triplet 4.0k → 7.5k (on the flash frame) → 4.0 kHz at 0.12 s spacing + low thump + descending bell for results (8.3 → 5.7 kHz)

## Command-select pose
- 29–30 h, 22–23 w, hop forward: back leg bent up, the other leg touching the ground with the toe only (or front leg kicked out horizontally), lead arm forward

## Do NOT copy
- Skill names, summons, character/enemy designs, exact effect shapes. Re-compose along ≥2 axes (path, colour pair, rhythm, body shape, ending) and add the game's star motif (rs-battle-fx §7).
