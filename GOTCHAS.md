# BOXED — gotchas (learned the hard way)

- **The render path (`draw()`) must NEVER call either RNG stream** (`rng()` =
  gameplay, `vrng()` = visuals). Both are seeded and deterministic; drawing
  from them desyncs a fight from its seed. Any wobble/jitter in `draw()` must
  be derived from positions or time, not RNG.
- **Card STATS (HP/SPD/DMG/CD) render live from the roster object** so they
  can't drift. But hand-typed DESCRIPTION strings and code comments CAN go
  stale when a mechanic changes — check them whenever you retune something.
- **HP is the gentle balance lever** — roughly 0.5–1 win-rate point per ~4 HP,
  predictable and linear, no resonance risk. Damage and cooldowns are sharper.
  HP does NOT need to be a multiple of 5; tune to whatever integer the sim
  says (the Duelist's 92 is a deliberately tuned value).
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
- **The follow-camera (`engine.js`) is render-only — never feed it back into the
  sim.** `draw()` applies a camera transform (`updateCamera`/`applyCamera`) that
  pans/zooms to frame both fighters in the fixed 360×360 reference space. It READS
  fighter positions but the sim must never read `camera.*`, so it can't affect
  balance. Two consequences worth knowing: (1) the arena grid + border are drawn
  in-world by `drawArenaBackdrop` (NOT CSS) so they scroll/scale with the camera —
  don't move them back to CSS. (2) Under the camera transform, world coords ≠ screen
  coords.
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
