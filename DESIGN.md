# BOXED — design principles & roster

## Design principles

1. Fights finish naturally — fighters win by killing the other, not on a
   timer. The old closing-ring / fog mechanic was removed because it
   pressured fights toward an artificial KO; with the post-shrink
   connection rate and the current HP scale, fights wrap in ~23–32s on
   their own. The headless sim has a 6000-tick guard (~100s) only as a
   stalemate safety net.
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
   centre at zoom 1.0 — always (the full 300×300 stays framed through the
   kill and the finish window). The old kill-cam push-in on the loser was
   retired: the death ceremony + camera-snap flash + death voice + koHit
   boom stamp the kill at full-arena view, and the static frame keeps the
   winner and lingering winner-owned items in shot at the climax. Render-
   only — the sim never reads camera state, so framing can't affect balance.
   (Tunables in `engine.js`.)

## Roster

16 active fighters: priest, berserker, wizard, geomancer, sapper, archer,
jester, cannoneer, duelist, necromancer, reaper, ronin, witch, hunter,
warlock, gambler. **Geomancer replaced Knight** — Knight's melee-tank
niche was a hard design corner under autonomous DVD movement (every
prototype hit one of: un-tunable reactive timing, off-brand ranged,
off-brand homing, or "just a dash"). The wall-bouncing identity finally
landed in Geomancer (STANDING STONES plant on each wall hit, SIGIL fires
ley-lines between all stones); the kit *uses* the bounce as its core
mechanic instead of fighting against it.

Healthy band lands ~4–10 points wide after a tune pass — every fighter
within ±3–5 of 50% in the current balance. Tightening below ~4 points
tends to be noise-floor luck rather than a real signal at N=500/matchup.

## Design philosophy for the redesigns

The redesign pass that produced the current roster ran on four framing
principles in addition to the design principles above:

1. **One load-bearing verb per fighter.** Each fighter's ACT names a
   single distinctive mechanic — not a generic dash + stat block. The
   verb carries the kit's identity (RAMPAGE, JUDGMENT, SIGIL, HARVEST).
   If two fighters share verb-shape, one of them is wrong.
2. **Weaponize the arena.** DVD bouncing is the defining input, not a
   constraint to fight against. Kits that *use* the bounce (Geomancer
   plants on each wall hit, Witch's hex ricochets, Berserker rampage
   caroms off walls) feel grounded; kits that ignore it read generic.
3. **Active/passive synergy.** The PASSIVE is not flavour text — it
   shapes how the ACT lands. Berserker's BLOODRAGE accelerates the
   rampage at low HP; Priest's DIVINE GRACE heals on landed pillars;
   Geomancer's STANDING STONES are the network SIGIL fires through.
   If the passive can be removed without changing the kit's character,
   the passive isn't doing its job.
4. **Outcomes are emergent, not authored.** No fighter is hand-tuned to
   beat a specific opponent. The matchup table emerges from kit
   interactions; the balance harness reads the table; tuning is gentle
   (single stat, named tunable) not surgical (rewriting matchup logic).
   Hard counters are part of the content — see principle 3 of the
   Design principles above.

## Mechanical grammars

Reusable mechanic patterns that emerged across the roster. Each is named
so a future fighter can be designed against one explicitly ("this kit
uses the ricochet-state grammar"). Animation-side grammars (Melee /
Ranged / Channel / Field — the body-language categories) live in
ANIMATION.md; these are the *mechanical* grammars (what the ability
DOES, not how it ANIMATES). Canonical fighters in parentheses.

- **Ricochet-state** — the fighter becomes a temporary bouncing
  projectile, dealing damage on each pass; the chaos of the wall-bounce
  IS the attack. (Berserker RAMPAGE.)
- **Predictive zone-strike** — a delayed AOE locks at the predicted
  enemy position over a windup; the enemy's mid-windup velocity change
  is the counterplay. (Priest JUDGMENT — predictive; Cannoneer BOMBARD
  is the contrasting "dumb lob" variant, direct at current position.)
- **Overshoot line-dash + chain-on-hit** — teleport-dash through the
  enemy along a locked direction; landing a clean hit refunds the
  cooldown for an instant follow-up. (Ronin IAI / FOCUS.)
- **Returning boomerang + damaging trail** — a thrown projectile loops
  back to the caster, leaving a damaging zone along its flight path.
  (Reaper HARVEST + WAKE.)
- **Predictive saturation rain + miss-becomes-stake** — the ACT scatters
  multiple delayed AOE landings in a disk pattern around the enemy's
  predicted position; arrows that miss embed in the arena floor as
  persistent damaging hazards (the passive). Synergy emerges from the
  spread: hits and misses both have value, the kit rewards area saturation
  over precision. (Archer VOLLEY + STAKES — the predictive-but-spread
  variant of the predictive zone-strike grammar above, paired with a
  residue-as-passive payoff that no other kit has.)
- **Sticky delayed burst** — a thrown projectile sticks on contact, a
  fuse ticks down, the detonation deals damage + knockback in a splash
  radius. (Sapper STICK CHARGE.)
- **Wall-bounce-driven field network** — wall bounces plant nodes; the
  ACT fires lines or effects between every pair of nodes (including
  the fighter himself, if the kit's identity says so). (Geomancer SIGIL.)
- **Roll-table chaos** — the ACT rolls a die; each face is a genuinely
  different attack pattern; the passive twists the distribution.
  (Gambler WILDCARD + DOUBLES.)
- **Decoy substrate** — a passive spawns phantom copies of the fighter
  that intercept incoming attacks. Every other fighter's aim and
  projectile path routes through a uniform `pickTarget` rule that aims
  at the nearest of `{real, ...decoys}`, so DOPPELGANGER counters
  every kit symmetrically. (Jester DOPPELGANGER — substrate; only one
  fighter uses it offensively but every other kit's targeting code
  supports it.)
