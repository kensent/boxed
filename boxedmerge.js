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
// Format: 'a_b':winRate[:avgElapsed[:fogPct]  (old format: 2 fields; new: 4)
const tbl = {};
lines.forEach(l => {
  const parts = l.split(':');
  const key = parts[0].replace(/'/g, '');
  tbl[key] = {
    wr: +parts[1],
    elapsed: parts.length > 2 ? +parts[2] : null,
    fogPct: parts.length > 3 ? +parts[3] : null,
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

// Per-fighter stats: average win rate, average fight time, fog engagement %.
function odds(a, b) {
  if (tbl[a + '_' + b] != null) return tbl[a + '_' + b].wr;
  if (tbl[b + '_' + a] != null) return 100 - tbl[b + '_' + a].wr;
  return 50;
}
const avg = {}, elapsedBuf = {}, fogBuf = {};
ids.forEach(id => { avg[id] = []; elapsedBuf[id] = []; fogBuf[id] = []; });
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
    if (row.fogPct  != null) { fogBuf[ids[i]].push(row.fogPct);  fogBuf[ids[j]].push(row.fogPct);  }
  }
}
const mean = arr => arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null;
const summary = ids.map(id => ({
  id,
  wr:      Math.round(mean(avg[id]) * 10) / 10,
  elapsed: elapsedBuf[id].length ? Math.round(mean(elapsedBuf[id]) * 10) / 10 : null,
  fog:     fogBuf[id].length     ? Math.round(mean(fogBuf[id]))             : null,
})).sort((a, b) => b.wr - a.wr);

console.error('\n--- per-fighter stats ---');
console.error('  ' + 'fighter'.padEnd(14) + 'win%'.padEnd(8) + 'avg time'.padEnd(12) + 'fog%');
summary.forEach(s => {
  const elapsed = s.elapsed != null ? s.elapsed.toFixed(1) + 's' : '?';
  const fog = s.fog != null ? s.fog + '%' : '?';
  console.error(`  ${s.id.padEnd(14)}${String(s.wr + '%').padEnd(8)}${elapsed.padEnd(12)}${fog}`);
});
