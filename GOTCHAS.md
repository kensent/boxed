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
