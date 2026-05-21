# BOXED — design principles & roster

## Design principles

1. Timed ring closer keeps fights under 30s; there are no draws.
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
7. Frame for the vertical Shorts format. A static full-arena view leaves the
   fighters too small to read on a fast scroll, so a follow-camera keeps both
   fighters framed at a comfortable zoom — holding still while they're close (a
   pan deadzone) and only panning/zooming out when they spread apart. It's purely
   a render concern — the camera reads positions but never feeds the simulation,
   so framing changes can't affect balance. (Mechanics in GOTCHAS.md; tunables in
   `engine.js`.)

## Roster

16 fighters: priest, berserker, wizard, knight, sapper, archer, jester,
cannoneer, duelist, necromancer, reaper, ronin, witch, hunter, warlock,
gambler. Healthy balance is the whole roster within roughly a 46–53% band
with no true outliers.
