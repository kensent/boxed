# BOXED — project guide for Claude Code

BOXED is a YouTube-Shorts-style bouncing-arena fight simulator. Two fighters
bounce DVD-style around a closed arena, use abilities on cooldowns, and the
last one alive wins. Fights typically finish in 11-15s and there is no longer
any artificial timeout (no closing ring / fog); a fighter wins by killing the
other on its own merits. Mobile-targeted.

## Files

- `boxed.html` — HTML + CSS only, plus `<script src>` tags in load order.
  Open directly in a browser (no build step, no dependencies, works from `file://`).
- `js/` — all gameplay JavaScript, one concern per file:
  - `rng.js` · `fighters.js` · `matchups.js` · `quotes.js` · `audio.js`
  - `combat.js` · `particles.js` · `abilities.js` · `engine.js`
    (`engine.js` owns the static-during-play / kill-cam-on-K.O. camera in the
    fixed **300×300 reference space**; render-only, never feeds the sim. The old
    dynamic follow-cam was disabled after the arena shrink — see GOTCHAS.md.)
  - `render/sprites.js` · `render/arena.js`
    (`arena.js` `drawArenaBackdrop` draws the grid + border in-world so they
    scale with the kill-cam zoom — deliberately not CSS)
  - `ui.js` (selection screen) · `main.js` (end-game lifecycle)
- `boxedshard.js` — runs a slice of the balance simulation (currently 105
  matchups — Knight is excluded via `EXCLUDE_IDS`; see GOTCHAS.md and
  REDESIGN-PROPOSAL.md). `node boxedshard.js <startIdx> <endIdx> <outfile>`
  runs matchups in `[startIdx, endIdx)` and writes results to `<outfile>`.
- `boxedmerge.js` — assembles shard result files into the `MATCHUPS` block
  (paste-ready for `js/matchups.js`) plus a per-fighter win-rate summary
  including `long%` (the fraction of fights past `LONG_FIGHT_THRESHOLD`,
  currently 30s — stalemate-prone matchup detector).
  `node boxedmerge.js <file> [<file> ...]`.
- `balance.sh` — runs all 7 shards (15 matchups each, 105 total) in parallel
  and merges. The shard count is hardcoded to the active roster size; the
  header has a re-include note for putting Knight back. Just `./balance.sh`.
- `REDESIGN-PROPOSAL.md` — the design + rebalance journal. Each shipped fighter
  has an `IMPLEMENTED & VALIDATED` block with the final tunables and matchup
  texture; the original sketches below are preserved for history.

## Workflow

After ANY edit to a `js/` file, syntax-check it with `node --check <file>`.

For balance changes: run `./balance.sh`, read the per-fighter summary, then
embed the new `MATCHUPS` block into `js/matchups.js` (replace the existing
`const MATCHUPS = {...}` block — it is the only thing boxedmerge prints that
goes into the file).

The simulation is fully deterministic: each matchup runs from a fixed salt,
so sharded results are bit-identical to a single monolithic run. Re-running
gives the same numbers.

@DESIGN.md
@ANIMATION.md
@AUDIO.md
@GOTCHAS.md