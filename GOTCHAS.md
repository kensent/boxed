# BOXED — gotchas (learned the hard way)

- **The render path (`draw()`) must NEVER call either RNG stream** (`rng()` =
  gameplay, `vrng()` = visuals). Both are seeded and deterministic; drawing
  from them desyncs a fight from its seed. Any wobble/jitter in `draw()` must
  be derived from positions or time, not RNG.
- **Card STATS (HP/SPD/DMG/CD) render live from the roster object** so they
  can't drift. But hand-typed DESCRIPTION strings and code comments CAN go
  stale when a mechanic changes — check them whenever you retune something.
- **HP/damage run at a 10× display scale** (HP ~570–1110, DMG ~40–350). It's a
  pure linear rescale of the float sim — win rates are dimensionless, so the scale
  is balance-neutral; it just keeps the on-screen numbers honest to the sim. Any
  NEW hardcoded damage literal must be in 10× units (e.g. the bone burst is `170`,
  counter `80`); `f.dmg`-driven damage scales for free. (The earlier hitStop
  feedback rule about reading raw vs ceil'd damage no longer applies — hitStop
  was removed; see the entry below.)
- **HP is the gentle balance lever** — roughly 0.5–1 win-rate point per ~40 HP
  (at the 10× scale), predictable and linear, no resonance risk. Damage and
  cooldowns are sharper. HP does NOT need to be a round number; tune to whatever
  integer the sim says (the Duelist's 950 is a deliberately tuned value).
  **Sensitivity is non-uniform across the roster, though.** At low-damage
  fighters like Gambler (per-coin dmg ~50), HP is much sharper — measured
  ~1 wr per ~11 HP in the recent rebalance, vs the roster-average ~1 wr per
  40 HP. Rule of thumb: the lower the fighter's per-hit damage, the more
  each HP point matters in their fight duration. For fighters in that regime
  (~50-80 base dmg) start with smaller HP increments and confirm via the
  harness before committing big swings.
- **Watch for cooldown resonance**: if a defensive recharge timer exactly
  matches an attacker's ability cadence, it creates a lockstep (e.g. a shield
  that's always up against one specific enemy). Keep defensive timers off
  round numbers that collide with common cooldowns.
- **Homing strength is a sharp lever with a plateau then a cliff** — small
  changes in the low range do little, then it suddenly spikes. Sweep it.
- Sim numbers have a noise floor (~1-2 points run to run) at N=300/matchup.
  Meaningful tuning resolution is ~±2-3, not ±1. Land in the right
  neighborhood and confirm with a full run.
- **`drawFighter` early-returns for dead fighters** (`if (f.dead) return`), so a
  dead fighter's sprite vanishes instantly. Death / post-death visuals must render
  in the death-ceremony block of `draw()` (gated on `game.koTimer`), using the
  loser's frozen position (`loser = game.winner === game.red ? game.blue : game.red`).
  Note `koTimer`/`flashFrame` decrement by REAL time, not the slow-mo `timeScale` —
  so anything keyed off them plays at real speed during the slow-mo finish.
- **"Visual-only" is not automatically balance-safe.** A field set in the sim path
  is safe only if gameplay never reads it back AND you don't change rng/vrng usage
  or control flow. Removing particle spawns was safe (they only touch `vrng`, a
  separate stream from the `rng` that decides outcomes). Screen-shake is safe
  (headless-skipped); effect spawners (`spawnImpact`, etc.) are headless-guarded
  for the same reason. **Historical trap**: `hitStop()` looked like pure "feel"
  but was replicated in the headless runner (set simDt = 0 for a few ms on
  ≥120-dmg hits) — disabling it had shifted matchups. It has since been removed
  outright, so this trap is closed; but the lesson stands for any future "feel"
  mechanic that's tempted to live in the sim loop. After touching anything in
  the sim path, confirm `./balance.sh` output is bit-identical to the `MATCHUPS`
  block.
- **The arena is 300×300, not 360×360.** Shrunk from 360 once the ability
  redesigns landed. The constant lives at `engine.js:17` (`ARENA = 300`); the
  reduce-then-rebalance pass tuned every fighter back into band around the
  new geometry. Any new ability-range stat (Warlock drain 140, Cannoneer
  splashRadius 55, Ronin strikeDist 175) should be evaluated as a *fraction
  of the arena* — at 300, a 150-px reach covers half the arena, which is a
  lot more than the same number meant at 360. Re-running balance after
  touching range values is non-optional.
- **The camera (`engine.js`) is render-only — never feed it back into the
  sim.** During play it holds STATIC at the arena centre at zoom 1.0 (the
  whole 300×300 is framed). On the K.O. it becomes a kill-cam pushing in on
  the loser. The dynamic follow-cam (pan deadzone + comfort/min zoom) was
  disabled after the arena shrunk — the smaller arena already fits both
  fighters in a static frame, so the pan/zoom was over-engineering. It
  READS fighter positions (for the kill-cam target) but the sim must never
  read `camera.*`. Two consequences worth knowing: (1) the arena grid +
  border are drawn in-world by `drawArenaBackdrop` (NOT CSS) so they scale
  with the kill-cam zoom — don't move them back to CSS. (2) Under the
  camera transform, world coords ≠ screen coords (matters for screen-space
  overlays — see next bullet).
- **Screen-space overlays must reset the transform under the camera.** Anything that
  should sit at a fixed screen position — the "K.O." graphic, the white camera-snap
  flash — must `ctx.setTransform(...)` out of camera space first (CSS-px space for
  the K.O., device space for the full-viewport flash), or it renders at *world*
  coords (e.g. the arena centre) and drifts off-screen as the camera pans. The death
  ceremony is the opposite: it's world-anchored at the loser's position, so it stays
  in camera space. We shipped the K.O. at world centre once and it floated off — hence
  this note.
- **The finish is a sequence, and the death voice + K.O. boom fire from `draw()`, not
  the sim path.** On the kill the loser's ORIGINAL sprite is drawn (intact, NO death
  animation layers yet) until the kill-cam has pushed in on it (`game.koArriveAt`
  captured at arrival); only then does `drawDeath` take over and the per-fighter
  death sequence begin from frame 0, and the camera-snap `flashFrame` + the
  `death`/`koHit` sfx are all triggered *there* (in the finish block of `draw()`)
  so the snap/audio land with the shatter instead of leading it during the push-in.
  An earlier version called `drawDeath(loser, 0)` every frame pre-arrival, but
  `prog=0` already started each fighter's voice-effect layer at small radius —
  the "hold" wasn't actually holding. The intact-sprite hold is drawn manually
  in the death-ceremony block (drawFighter early-returns on dead). Don't "tidy"
  the flash or those sfx back into `combat.js`/`endGame` — that reintroduces the
  desync. Safe because `draw()` never runs headless and `sfx` is headless-guarded
  regardless. Death progress is a fixed `DEATH_DUR` measured from arrival (not the
  leftover window), so every kill gets its full beat; `FINISH_WINDOW` is the total.
- **Uniform "aim at nearest" targeting (DOPPELGANGER substrate).** Every fighter
  that aims at an enemy must route through `pickTarget(attacker, defender)` in
  `engine.js`, which returns the nearest of `{real defender, ...defender.decoys}`.
  For 14 of the 15 active fighters this collapses to returning the real defender
  (only Jester spawns decoys), so behaviour is unchanged. But any NEW ability that
  reads `enemy.x/y/vx/vy` directly will silently bypass DOPPELGANGER and aim
  through decoys — use `aim.x/y` (the `pickTarget` result already declared at
  the top of `fireAbility`) instead. Same goes for collision: projectile/melee
  hits should call `tryHitDecoy(pos, defender, range)` first so a closer decoy
  intercepts the attack before it reaches the real fighter. Predictive aim
  (Priest JUDGMENT) is the one place that reads `aim.vx/vy` — decoys are
  stationary, so `(target.vx || 0)` defaults to 0 and the pillar lands on the
  decoy's current position. That's the intended texture: predictive abilities
  get fooled hardest by decoys.
- **Windup abilities that set their own launch velocity must early-return from
  `resolveAim`.** The tail of `resolveAim` (in `abilities.js`) does a generic
  velocity renormalization back to `f.speed` — useful for Priest/Cannoneer who
  stand still during windup. Berserker's RAMPAGE sets `f.vx/vy` to ramming
  speed (`f.speed * f.rampageSpeedMult`) at resolve, and that normalization
  would crush it back to 1× speed — Berserker would barely move and the
  rampage would fail to ricochet. The fix is a `wasTackle` early-return before
  the renormalization. Any future windup ability with a custom launch velocity
  needs the same exclusion.
- **Berserker's RAMPAGE picks aim at RELEASE, not at cast.** Most windup
  abilities (Priest, Ronin) lock their target/direction at cast — the enemy's
  drift during the windup IS the counterplay. Berserker is the exception: he
  picks the aim angle in `resolveAim` from the current enemy position (via
  `pickTarget`) at the moment the coil snaps. That fits the "wild bruiser"
  identity (he uncoils toward wherever the enemy actually is) and avoids a
  0.5s lead-the-enemy gap. The counterplay is still there in the form of the
  vulnerable 0.5s coil where Berserker drifts at 40% speed; enemies attack
  freely during it.
- **The closing-ring fog mechanic is gone.** Don't add code that reads
  `game.ringRadius`/`game.ringWarned`/`RING_START`/`RING_FULL` — they no longer
  exist. Fights resolve naturally; the headless `simulateFightDetailed` 4000-tick
  guard (~67s) is the only stalemate backstop. The balance harness tracks
  `long%` (fights past 30s) as a stalemate-prone-matchup detector — see
  `boxedshard.js`'s `LONG_FIGHT_THRESHOLD`.
- **Knight was retired and replaced by Geomancer.** Knight's melee-tank niche
  was a hard design corner under autonomous DVD movement — every prototype
  hit one of: un-tunable reactive timing, off-brand ranged, off-brand
  homing, or "just a dash." Geomancer ships in the same roster slot and
  *uses* the wall-bounce as its core mechanic (STANDING STONES plant on each
  hit, SIGIL fires ley-lines between every stone). `EXCLUDE_IDS` is now empty
  in both `boxedshard.js` and `boxedmerge.js`; `balance.sh` is at 8 shards × 15
  = 120 matchups (all 16 active fighters participate). If a future fighter
  goes shelved, sync `EXCLUDE_IDS` across both files AND drop the shard count
  in `balance.sh` in lockstep.
- **Geomancer's SIGIL is all-pairs, not nearest-neighbour.** The first
  topology shipped was "each stone links to its 2 nearest" — sounded clean
  but the nearest stones are ADJACENT along the same wall, so links hugged
  the perimeter and never crossed the arena interior where the enemy lives.
  Geo ran at 0% win rate. Switching to ALL-PAIRS (every stone links to every
  other) produces ~28 lines at the 8-stone cap, of which ~4 typically cross
  the enemy body — the per-line dmg (`f.dmg`) is tuned around that count.
  The `linksPerStone` template prop survives unused; it's there if a future
  topology wants to clamp the network density.
- **Geomancer is a node in his own SIGIL network.** The kit's identity ("the
  fighter IS one of his own stones") is mechanically true — the SIGIL link
  set is built from `[self, ...wall-stones]`, so once the FIRST wall-stone
  is planted, there's already a `self → stone` line. This is the reason
  the kit boots up viably without a corner-stones pre-seed (the earlier
  shipped version had 4 corner stones pre-planted; that's gone — speed bumped
  to 120 instead, so first bounces arrive ~1s into the fight).
- **Geomancer stones don't expire on a timer.** `maxStones` cap-eviction
  (oldest first, in `plantStone()`) is the only removal mechanism. Stones
  render at full alpha; no fade-out. An earlier version had a 13s
  `stoneLifetime` decay — removed because the cap was always hit first in
  practice, and the decay's fade-out was visual noise rather than mechanical
  signal.

## Tuning lever notes

Patterns learned across the redesign + rebalance passes. None of these are
mechanical rules; they're shapes to watch for when reaching for a tuning
knob. Confirm via `./balance.sh` regardless.

- **Recursive multi-hit abilities have a multiplier damage lever, not a
  sum.** Berserker RAMPAGE (per-pass dmg × ~4 passes), Archer VOLLEY
  (per-arrow dmg × 3-fan + SHATTER stacks), Geomancer SIGIL (per-line dmg
  × ~4 crossings) all scale ~1 wr per 1 dmg, because each point applies
  several times per cast. Reach for HP / cd to bring them into band;
  damage moves the matchup faster than it looks (and going too low
  collapses the kit — Gambler dmg 50 → 42 over-corrected by ~12 wr).
- **Standstill windows are stealth buffs.** Adding or extending a
  planted phase makes the launch geometry more predictable: enemies eat
  cleaner cuts when the fighter is rooted (Ronin's FOCUS-plant lifted
  him 56% → 64.6% silently; Berserker's coil makes his ramming direction
  trivially predictable). Expect to compensate via a *different* lever
  when adding/extending a standstill — usually HP or per-hit damage.
- **Stacking-with-decay self-paces; don't add caps.** Archer's SHATTER
  cushion has per-arrow decay (`embedDur`); the cushion can't build
  forever because old arrows fall off as new ones land. Don't bolt on
  an extra max-stack count or per-fight cap — the decay does that job.
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
