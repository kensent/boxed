# BOXED — tuning levers & reference

Balance-tuning lore split out of GOTCHAS.md (which is the don't-break-this
trap list). These are the *how to move a win-rate* notes plus the card-name
bridge. None are mechanical rules — confirm every change via `./balance.sh`.

## Tuning lever notes

Patterns learned across the redesign + rebalance passes. None of these are
mechanical rules; they're shapes to watch for when reaching for a tuning
knob. Confirm via `./balance.sh` regardless.

- **Recursive multi-hit abilities have a multiplier damage lever, not a
  sum.** Berserker RAMPAGE (per-pass dmg × ~4 passes), Archer VOLLEY
  (per-arrow dmg × ~6 arrows, of which 1-2 land and the rest become
  STAKES — both rain hits and stake chip use `f.dmg`), Geomancer SIGIL
  (per-line dmg × ~4 crossings) all scale ~1 wr per 1 dmg, because each
  point applies several times per cast. Reach for HP / cd to bring them
  into band; damage moves the matchup faster than it looks (and going
  too low collapses the kit — Gambler dmg 50 → 42 over-corrected by
  ~12 wr).
- **Standstill windows are stealth buffs.** Adding or extending a
  planted phase makes the launch geometry more predictable: enemies eat
  cleaner cuts when the fighter is rooted (Ronin's FOCUS-plant lifted
  him 56% → 64.6% silently; Berserker's coil makes his ramming direction
  trivially predictable). Expect to compensate via a *different* lever
  when adding/extending a standstill — usually HP or per-hit damage.
- **Floor-hazard residue self-paces via lifetime, not stack caps.**
  Archer's STAKES use a per-stake `stakeDur` (2.5s); the floor field
  can't grow unboundedly because old stakes expire as new VOLLEY casts
  land. Don't bolt on an extra "max stakes alive" cap — the lifetime
  does that job. (The current cap-and-evict patterns we DO use, like
  Necromancer's `skelCap` and Geomancer's `maxStones`, exist because
  those entities have NO natural decay. Stakes have decay, so a cap
  would be redundant and add brittle code.)
- **Per-fighter sensitivity is not uniform across the roster.** Pick the
  lever that's *gentle* for the fighter, not the gentle lever
  globally:
  - **cd**: very sharp at Ronin (~1 wr per ~1% cd change) and Jester
    (~1 wr per ~1% cd) — each blink/iai IS the damage event, so cadence
    dominates. Tap 0.05s at a time.
  - **speed**: sharp at Duelist (~0.6 wr per 1 speed — cast cadence
    dominates output, idle movement is closing pressure between casts).
  - **HP**: typically the gentle lever (~1 wr per ~40 HP at the 10× scale)
    but *much* sharper for low-damage fighters: Gambler is ~1 wr per
    ~11 HP, Priest is ~0.06 wr per HP (≈1 per 16). Use small HP
    increments at the bottom of the damage range.
- **Homing strength has a plateau-then-cliff curve.** Small changes do
  nothing for a long way, then the projectile suddenly starts curving
  hard enough to redirect mid-flight and the matchup spikes. Sweep
  values; don't tap. Relevant for Wizard orbs, Reaper crescent,
  Gambler coin nova, hex bolt, hook.
- **Predictive aim breaks across velocity discontinuities.** Priest's
  JUDGMENT locks at `enemy.x + enemy.vx * windupTime` at cast time.
  Fighters whose velocity dramatically changes *during* the windup
  (Berserker idle → rampage, blinked Jester) escape the pillar
  geometrically — no amount of damage tuning closes this gap. Hard
  counters here are content, not a bug to fix.

## HP-scale tuning notes

The HP scale was doubled from the original "punchy 13s avg" tuning to
land the current 23–32s fight durations. Numbers below are about how
balance behaves *under this scale*, not about the historical transition.

- **HP scaling buffs sustain kits and nerfs burst kits — not symmetric.**
  Doubling HP doesn't preserve matchup ratios. Kits whose value
  *compounds over time* (Necromancer's bone burst chain, Geomancer's
  stone network, Hunter's BARBED LINE chip, Wizard's mana shield
  economy) are structurally stronger at longer durations. Kits whose
  effect is *fixed-duration* (Jester's 3s decoys, Reaper's WAKE
  crescent, Witch's mark window) are diluted. If you change HP scale
  again, expect non-uniform rebalance — not a global multiplier on
  damage. (Empirically: a naive HP × 2 landed Necromancer at 71% and
  Jester at 37%; closing the 34pt spread to 4.3pt took dozens of
  per-fighter tunings.)
- **Most flat damage/HP literals are NOT proportional to fighter HP.**
  Bone burst dmg (140), `SKEL_HP` (180), Priest `healOnHit` (18),
  Hunter `reelStepDmg` (3) — these are absolute values, not relative.
  Each one is a tunable in its own right: bone burst at 140 deals
  ~9% of fighter HP under the current scale. Tune these per-fighter
  for balance; don't scale them as a group. We tried scaling them all
  × 2 once and it over-buffed Necromancer to 88% (skeletons twice as
  durable + kills did twice as much).
- **Sharp-threshold levers — tap, don't sweep.**
  - Hunter hook **life**: 0.54 → 0.55 = +4 win-rate points. 0.01s of
    range crosses a "barely-connects-vs-barely-misses" threshold.
  - Ronin **cd**: 2.5 → 3.0 = −17 win-rate points (matches the
    pre-existing 1 wr / 1% cd sensitivity rule).
  - Bone burst **flat dmg**: 50 dmg = 14 win-rate points on Necromancer.
    Mid-range tuning required (170 too strong, 120 too weak; 140 lands).
  Use 1-step changes when tuning these.

## Tunable patterns: cap-and-evict, template-prop thresholds

- **`rageThreshold` on Berserker** — pattern note: when a "magic
  constant" is tied to a single fighter's mechanic, prefer a template
  prop in `fighters.js` over a hardcoded literal in `engine.js`. The
  kit's stats stay in one place and the card text can render the live
  value via getter. (Current: `rageThreshold: 0.4` for BLOODRAGE.)
- **`skelCap` on Necromancer** — cap-and-evict pattern for army-builder
  kits. Caps own-team skeleton count (current: 8). At cap, the oldest
  own-team skeleton is evicted before the new spawn — mirrors
  Geomancer's `maxStones` cap-eviction in `plantStone()`. Pattern fits
  any future army-builder kit (or, equivalently, any kit that produces
  a renewable resource that should have a ceiling).

## Card name vs internal name

Some ability card names were refreshed for viewer-readability without
renaming the matching substrates/mechanics in code. Comments throughout
the codebase still use the old names as *concept labels* (e.g.,
"DOPPELGANGER substrate" names the decoy-aware targeting rule; "FOCUS
chain" names the clean-cut chain mechanic). Those internal names are
intentionally preserved — they describe the mechanism, not the marketing
label. This table is the canonical bridge between the two namespaces.

| Card (user-facing) | Internal name (in comments / identifiers) |
|---|---|
| MANA ORBS (Wizard active) | CAST ORBS |
| RIPOSTE (Duelist active) | RIPOSTE THRUST |
| EN GARDE (Duelist passive) | COUNTER |
| ANIMATE BONE (Necro active) | RAISE SKELETON |
| SHOCKWAVE (Sapper passive) | BLAST RADIUS |
| PUNCHLINE (Jester active) | BLINK DAGGER (ability id `blink`) |
| DECOY (Jester passive) | DOPPELGANGER — appears across abilities.js, engine.js, combat.js, ANIMATION.md, AUDIO.md as the **substrate name** for the decoy-aware targeting rule |
| DRAW BLADE (Ronin active) | IAI (ability id `iai`) |
| CLEAN CUT (Ronin passive) | FOCUS (tunable `focusRefund`) |
| HEX (Witch active) | HEX BOLT |
| THE HOOK (Hunter active) | GRAPPLING HOOK |
| WITHER (Warlock passive) | ENERVATE |
| WAGER (Gambler active) | WILDCARD (ability id `wildcard`) |

When grepping for an ability's logic, search the **internal name**
(it's what's in code and comments). When updating the card description
in `fighters.js`, use the **card name**. If you rename an ability
again, update this table — and only update internal comments/
identifiers if the underlying *mechanism* changed, not just the label.
