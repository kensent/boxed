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

@DESIGN.md
@GOTCHAS.md
