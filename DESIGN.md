# BOXED — design principles & roster

## Design principles

1. Fights finish naturally — fighters win by killing the other, not on a
   timer. The old closing-ring / fog mechanic was removed because it pressured
   fights toward an artificial KO; with the post-shrink connection rate, fights
   wrap in ~11–15s on their own. The headless sim has a 4000-tick guard
   (~67s) only as a stalemate safety net.
2. Tune per-fighter, not with global multipliers.
3. Character identity beats pure balance — hard counters are good content,
   not bugs. A fighter that wins most matchups and loses a few badly, landing
   ~50% overall, is working as intended.
4. ACT/PASSIVE card text describes behavior — no raw damage numbers. Heal
   fractions/percentages and cooldown seconds are fine.
5. Minimize on-screen noise; sound conveys information.
6. Sprites: faceted/straight-line shapes read crisp at 64px. Judge them
   in-fight, not just in the gallery. Lead with the shape that says the
   fighter's identity instantly.
7. The arena is a fixed **300×300 reference space**. Shrunk from 360 once the
   ability redesigns landed so melee dashes reliably connect under autonomous
   DVD movement — see GOTCHAS.md. The camera holds STATIC at the arena
   centre at zoom 1.0 during play (full arena visible) and pushes in on the
   loser on the K.O. (the kill-cam). Render-only — the sim never reads camera
   state, so framing can't affect balance. (Tunables in `engine.js`.)

## Roster

16 active fighters: priest, berserker, wizard, geomancer, sapper, archer,
jester, cannoneer, duelist, necromancer, reaper, ronin, witch, hunter,
warlock, gambler. **Geomancer replaced Knight** — Knight's melee-tank niche
was a hard design corner under autonomous DVD movement (see REDESIGN-PROPOSAL.md
for the failed prototypes), and the wall-bouncing identity finally found its
home in Geomancer (STANDING STONES plant on each wall hit, SIGIL fires
ley-lines between all stones). The kit *uses* the bounce as its core mechanic
instead of fighting against it.

Current healthy band is **~12 points wide** (Cannoneer 57% top, Jester 44%
bottom) after the arena shrink + Geomancer add. Geomancer lands at ~52%.
