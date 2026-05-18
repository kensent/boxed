# BOXED — project guide for Claude Code

BOXED is a YouTube-Shorts-style bouncing-arena fight simulator. Two fighters
bounce DVD-style around a closed arena, use abilities on cooldowns, and the
last one alive wins. Target fight length is under 30 seconds. Mobile-targeted.

## Files

- `boxed.html` — the entire game. Single self-contained file: HTML + CSS + a
  large inline `<script>`, vanilla JS + Canvas, no build step, no dependencies.
  Open it directly in a browser to play/test.
- `boxedshard.js` — runs a slice of the 120-matchup balance simulation.
  `node boxedshard.js <startIdx> <endIdx> <outfile>` runs matchups in
  `[startIdx, endIdx)` and writes results to `<outfile>`.
- `boxedmerge.js` — assembles shard result files into the `MATCHUPS` block
  (paste-ready for boxed.html) plus a per-fighter win-rate summary.
  `node boxedmerge.js <file> [<file> ...]`.
- `balance.sh` — runs all 8 shards in parallel and merges. This is the
  normal way to do a full balance run. Just `./balance.sh`.

## Workflow

After ANY edit to `boxed.html`, syntax-check the script before anything else:

```
sed -n '/<script>/,/<\/script>/p' boxed.html | sed '1d;$d' > /tmp/bs.js && node --check /tmp/bs.js
```

For balance changes: run `./balance.sh`, read the per-fighter summary, then
embed the new `MATCHUPS` block into boxed.html (replace the existing
`const MATCHUPS = {...}` block — it is the only thing boxedmerge prints that
goes into the file).

The simulation is fully deterministic: each matchup runs from a fixed salt,
so sharded results are bit-identical to a single monolithic run. Re-running
gives the same numbers.

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

## Gotchas (learned the hard way)

- **The render path (`draw()`) must NEVER call the sim RNG** (`rng()` /
  `vrng()`). Those are the simulation's deterministic streams; drawing from
  them desyncs a live fight from its seed. Any wobble/jitter in `draw()` must
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
- Sim numbers have a noise floor (~1-2 points run to run on the fast harness).
  Meaningful tuning resolution is ~±2-3, not ±1. Land in the right
  neighborhood and confirm with a full run.

## Roster

16 fighters: priest, berserker, wizard, knight, sapper, archer, jester,
cannoneer, duelist, necromancer, reaper, ronin, witch, hunter, warlock,
gambler. Healthy balance is the whole roster within roughly a 46–53% band
with no true outliers.
