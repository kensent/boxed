// boxedmerge.js — assembles the shard result file(s) (one 'a_b':rate line
// each) into a paste-ready MATCHUPS block + per-fighter average win-rate
// summary. Identical output format to boxedsim.js's tail.
//
// Usage:  node boxedmerge.js <resultsfile> [<resultsfile> ...]
//   Accepts multiple files so parallel shards can each write their own
//   (avoids concurrent-append corruption from a shared file).
const fs = require('fs');

// Fighters excluded from the balance harness — keep in sync with boxedshard.js.
const EXCLUDE_IDS = new Set(['knight']);
function loadIds() {
  const src = fs.readFileSync(__dirname + '/js/fighters.js', 'utf8');
  const m = [...src.matchAll(/\{\s*id:'([a-z]+)'/g)];
  return m.map(x => x[1]).filter(id => !EXCLUDE_IDS.has(id));
}

const files = process.argv.slice(2);
if (!files.length) { console.error('usage: node boxedmerge.js <resultsfile> [<resultsfile> ...]'); process.exit(1); }

const lines = [];
for (const f of files) {
  lines.push(...fs.readFileSync(f, 'utf8').split('\n').map(s => s.trim()).filter(Boolean));
}
const ids = loadIds();
const expected = ids.length * (ids.length - 1) / 2;
if (lines.length !== expected) {
  console.error(`WARNING: ${lines.length} result lines, expected ${expected} — shards may be incomplete or duplicated.`);
}

// De-dupe (in case a shard ran twice), keep last occurrence.
// Format: 'a_b':wr:avgElapsed:longPct:tightCount:tightElapsedTotal
//   - long%   = fraction of fights past LONG_FIGHT_THRESHOLD (stalemate detector)
//   - tight   = winner finished below TIGHT_HP_FRACTION of max HP (close finish);
//               TOTAL elapsed of those fights + COUNT are emitted raw so the
//               average is computed once here at display time.
const tbl = {};
lines.forEach(l => {
  const parts = l.split(':');
  const key = parts[0].replace(/'/g, '');
  tbl[key] = {
    wr: +parts[1],
    elapsed: parts.length > 2 ? +parts[2] : null,
    longPct: parts.length > 3 ? +parts[3] : null,
    tightCount: parts.length > 4 ? +parts[4] : null,
    tightElapsedTotal: parts.length > 5 ? +parts[5] : null,
  };
});

// Re-emit in canonical boxedsim.js order so the block is stable/diffable.
const ordered = [];
for (let i = 0; i < ids.length; i++)
  for (let j = i + 1; j < ids.length; j++) {
    const key = ids[i] + '_' + ids[j];
    if (tbl[key] == null) { console.error('MISSING: ' + key); continue; }
    ordered.push(`'${key}':${tbl[key].wr}`);
  }

let block = 'const MATCHUPS = {\n';
for (let i = 0; i < ordered.length; i += 5)
  block += '  ' + ordered.slice(i, i + 5).join(', ') + ',\n';
block += '};';
console.log(block);

// Per-fighter stats: win rate, avg time, long% (stalemate-prone matchups), and
// average tight-fight time (winner < 30% HP at finish). Tight time is weighted
// by the per-matchup count so matchups that produce more close finishes have
// more pull on the per-fighter average. Per-matchup tight time is then printed
// in a separate section below.
function odds(a, b) {
  if (tbl[a + '_' + b] != null) return tbl[a + '_' + b].wr;
  if (tbl[b + '_' + a] != null) return 100 - tbl[b + '_' + a].wr;
  return 50;
}
const avg = {}, elapsedBuf = {}, longBuf = {};
const tightSum = {}, tightTotal = {};   // sum-of-elapsed and count, per fighter
ids.forEach(id => {
  avg[id] = []; elapsedBuf[id] = []; longBuf[id] = [];
  tightSum[id] = 0; tightTotal[id] = 0;
});
for (let i = 0; i < ids.length; i++) {
  for (let j = 0; j < ids.length; j++) {
    if (i === j) continue;
    avg[ids[i]].push(odds(ids[i], ids[j]));
  }
}
for (let i = 0; i < ids.length; i++) {
  for (let j = i + 1; j < ids.length; j++) {
    const key = ids[i] + '_' + ids[j];
    const row = tbl[key];
    if (!row) continue;
    if (row.elapsed != null) { elapsedBuf[ids[i]].push(row.elapsed); elapsedBuf[ids[j]].push(row.elapsed); }
    if (row.longPct != null) { longBuf[ids[i]].push(row.longPct); longBuf[ids[j]].push(row.longPct); }
    if (row.tightCount != null && row.tightElapsedTotal != null) {
      // Tight fights show up on BOTH fighters' rows (the matchup produced them).
      tightSum[ids[i]] += row.tightElapsedTotal; tightTotal[ids[i]] += row.tightCount;
      tightSum[ids[j]] += row.tightElapsedTotal; tightTotal[ids[j]] += row.tightCount;
    }
  }
}
const mean = arr => arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null;
const summary = ids.map(id => ({
  id,
  wr:        Math.round(mean(avg[id]) * 10) / 10,
  elapsed:   elapsedBuf[id].length ? Math.round(mean(elapsedBuf[id]) * 10) / 10 : null,
  longP:     longBuf[id].length    ? Math.round(mean(longBuf[id]))             : null,
  tightTime: tightTotal[id] > 0    ? Math.round(tightSum[id] / tightTotal[id] * 10) / 10 : null,
  tightN:    tightTotal[id],
})).sort((a, b) => b.wr - a.wr);

console.error('\n--- per-fighter stats ---');
console.error('  ' + 'fighter'.padEnd(14) + 'win%'.padEnd(8) + 'avg time'.padEnd(11) + 'long%'.padEnd(8) + 'tight avg'.padEnd(11) + '(n)');
summary.forEach(s => {
  const elapsed   = s.elapsed   != null ? s.elapsed.toFixed(1) + 's' : '?';
  const longP     = s.longP     != null ? s.longP + '%'              : '?';
  const tightTime = s.tightTime != null ? s.tightTime.toFixed(1) + 's' : '—';
  const tightN    = '(' + s.tightN + ')';
  console.error(`  ${s.id.padEnd(14)}${String(s.wr + '%').padEnd(8)}${elapsed.padEnd(11)}${longP.padEnd(8)}${tightTime.padEnd(11)}${tightN}`);
});

// Per-matchup tight-fight stats. Every matchup gets a row even if zero tight
// fights happened (so the table covers all 105 pairings). Sorted by tight count
// DESC so the most dramatically close matchups float to the top.
console.error('\n--- per-matchup tight fights (winner finished < 30% HP) ---');
console.error('  ' + 'matchup'.padEnd(28) + 'tight#'.padEnd(8) + 'tight avg time');
const matchupRows = [];
for (let i = 0; i < ids.length; i++) {
  for (let j = i + 1; j < ids.length; j++) {
    const key = ids[i] + '_' + ids[j];
    const row = tbl[key];
    if (!row) continue;
    const n = row.tightCount || 0;
    const avgT = n > 0 ? Math.round(row.tightElapsedTotal / n * 10) / 10 : null;
    matchupRows.push({ key, n, avgT });
  }
}
matchupRows.sort((a, b) => b.n - a.n || (a.key < b.key ? -1 : 1));
matchupRows.forEach(r => {
  const avgT = r.avgT != null ? r.avgT.toFixed(1) + 's' : '—';
  console.error(`  ${r.key.padEnd(28)}${String(r.n).padEnd(8)}${avgT}`);
});
