# BOXED — project guide for Claude Code

BOXED is a YouTube-Shorts-style bouncing-arena fight simulator. Two fighters
bounce DVD-style around a closed arena, use abilities on cooldowns, and the
last one alive wins. Fights typically finish in 23-32s and there is no longer
any artificial timeout (no closing ring / fog); a fighter wins by killing the
other on its own merits. Mobile-targeted.

## Files

- `boxed.html` — HTML + CSS only, plus `<script src>` tags in load order.
  Open directly in a browser (no build step, no dependencies, works from `file://`).
- `js/` — all gameplay JavaScript, one concern per file:
  - `rng.js` · `fighters.js` · `matchups.js` · `quotes.js` · `audio.js`
  - `combat.js` · `particles.js` · `abilities.js` · `engine.js`
    (`engine.js` owns the camera in the fixed **300×300 reference space**;
    it holds STATIC at arena centre, zoom 1.0 — always. Render-only, never
    feeds the sim. The old dynamic follow-cam and the kill-cam push-in
    were both retired — see GOTCHAS.md. It also computes the fight-screen
    `layout` — the canvas now fills the whole 9:16 area and the arena is a
    centred square sub-region with the HP band above it.)
  - `render/sprites.js` · `render/arena.js`
    (`arena.js` `drawArenaBackdrop` draws the grid + border in-world so
    they stay aligned with sprites — deliberately not CSS. **The canvas is
    the sole renderer of the fight screen**: `drawHpBars` + `drawVsIntro`
    draw the HP band and the VS-intro reveal into the canvas — they used to
    be DOM/CSS. See GOTCHAS.md.)
  - `ui.js` (selection screen) · `main.js` (end-game lifecycle)
  - `record.js` — in-app fight **recorder**. Arm the REC button (footer) and
    each fight is captured (canvas video + game audio) and downloaded as a
    `.webm`. Because the canvas is the sole renderer, the recording is
    pixel-for-pixel what's on screen (preview == export). Render-only,
    browser-only (not in `boxedshard.js`'s `SIM_FILES`), balance-safe.
- `boxedshard.js` — runs a slice of the balance simulation (currently 120
  matchups; `EXCLUDE_IDS` is empty — all 16 active fighters participate after
  Knight was replaced by Geomancer). `node boxedshard.js <startIdx> <endIdx> <outfile>`
  runs matchups in `[startIdx, endIdx)` and writes results to `<outfile>`.
- `boxedmerge.js` — assembles shard result files into the `MATCHUPS` block
  (paste-ready for `js/matchups.js`) plus a per-fighter win-rate summary
  including `long%` (the fraction of fights past `LONG_FIGHT_THRESHOLD`,
  currently 30s — stalemate-prone matchup detector).
  `node boxedmerge.js <file> [<file> ...]`.
- `balance.sh` — runs all 8 shards (15 matchups each, 120 total) in parallel
  and merges. The shard count is hardcoded to the active roster size; update
  the loop in lockstep with `FIGHTERS` if a fighter is added or shelved.
  Just `./balance.sh`.

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
@TUNING.md