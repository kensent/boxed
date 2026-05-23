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
  is balance-neutral; it just keeps the on-screen numbers honest to the sim. Two
  things this requires: (1) any NEW hardcoded damage literal must be in 10× units
  (e.g. the bone burst is `170`, counter `80`); `f.dmg`-driven damage scales for
  free. (2) The hitStop feedback (`feedbackDmg`/`big` in combat.js) must read the
  RAW damage (`dmgFloat.rawTotal`), never the `Math.ceil`'d display total — `ceil`
  is display-only. Putting `ceil` back in that path reintroduces a rounding
  non-linearity that would make any rescale drift.
- **HP is the gentle balance lever** — roughly 0.5–1 win-rate point per ~40 HP
  (at the 10× scale), predictable and linear, no resonance risk. Damage and
  cooldowns are sharper. HP does NOT need to be a round number; tune to whatever
  integer the sim says (the Duelist's 950 is a deliberately tuned value).
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
  or control flow. Two traps we hit: removing particle spawns was safe (they only
  touch `vrng`, a separate stream from the `rng` that decides outcomes), but
  `hitStop()` looks like pure "feel" yet is replicated in the headless runner for
  deterministic replay — disabling it SHIFTED matchups. Screen-shake is safe
  (headless-skipped); new effect spawners (e.g. `spawnImpact`) are headless-guarded
  for the same reason. After touching anything in the sim path, confirm
  `./balance.sh` output is bit-identical to the `MATCHUPS` block.
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
  the sim path.** On the kill the body holds frozen (death at frame 0) until the
  kill-cam has pushed in on the loser (`game.koArriveAt` captured at arrival); only
  then does it shatter, and the camera-snap `flashFrame` + the `death`/`koHit` sfx are
  all triggered *there* (in the finish block of `draw()`) so the snap/audio land with
  the shatter instead of leading it during the push-in. Don't "tidy" the flash or
  those sfx back into `combat.js`/`endGame` — that reintroduces the desync. Safe
  because `draw()` never runs headless and `sfx` is headless-guarded regardless.
  Death progress is a fixed `DEATH_DUR` measured from arrival (not the leftover
  window), so every kill gets its full beat; `FINISH_WINDOW` is the total.
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
- **Knight is shelved (excluded from balance), not removed.** Knight is still
  in the `FIGHTERS` array and is selectable in the picker, but
  `boxedshard.js`'s `EXCLUDE_IDS = new Set(['knight'])` keeps it out of the
  balance harness (its UNRESOLVED redesign would just produce misleading win
  rates). Keep `EXCLUDE_IDS` in sync between `boxedshard.js` and
  `boxedmerge.js`; both files filter the same way. `matchupOdds` in
  `matchups.js` falls back to 50 for missing pairs so the upset-hunt picker
  treats Knight fights as "unknown odds." To re-include Knight: drop the id
  from both `EXCLUDE_IDS` sets AND bump `balance.sh` back to 8 shards × 15
  matchups = 120 (it's at 7 × 15 = 105 now).
