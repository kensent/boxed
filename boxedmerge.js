// boxedmerge.js — assembles the shard result file(s) (one 'a_b':rate line
// each) into a paste-ready MATCHUPS block + per-fighter average win-rate
// summary. Identical output format to boxedsim.js's tail.
//
// Usage:  node boxedmerge.js <resultsfile> [<resultsfile> ...]
//   Accepts multiple files so parallel shards can each write their own
//   (avoids concurrent-append corruption from a shared file).
const fs = require('fs');

function loadIds() {
  const candidates = [__dirname + '/boxed.html'];
  let html = null;
  for (const p of candidates) { try { html = fs.readFileSync(p, 'utf8'); break; } catch (e) {} }
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  // FIGHTERS ids appear as  id:'xxx'  — pull them in declaration order.
  const m = [...script.matchAll(/\{\s*id:'([a-z]+)'/g)];
  return m.map(x => x[1]);
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
const tbl = {};
const seen = {};
lines.forEach(l => { const [k, v] = l.split(':'); seen[k.replace(/'/g,'')] = +v; });
Object.assign(tbl, seen);

// Re-emit in canonical boxedsim.js order so the block is stable/diffable.
const ordered = [];
for (let i = 0; i < ids.length; i++)
  for (let j = i + 1; j < ids.length; j++) {
    const key = ids[i] + '_' + ids[j];
    if (tbl[key] == null) { console.error('MISSING: ' + key); continue; }
    ordered.push(`'${key}':${tbl[key]}`);
  }

let block = 'const MATCHUPS = {\n';
for (let i = 0; i < ordered.length; i += 5)
  block += '  ' + ordered.slice(i, i + 5).join(', ') + ',\n';
block += '};';
console.log(block);

// Per-fighter average win rate.
function odds(a, b) {
  if (tbl[a + '_' + b] != null) return tbl[a + '_' + b];
  if (tbl[b + '_' + a] != null) return 100 - tbl[b + '_' + a];
  return 50;
}
const avg = {};
ids.forEach(id => avg[id] = []);
for (let i = 0; i < ids.length; i++)
  for (let j = 0; j < ids.length; j++)
    if (i !== j) avg[ids[i]].push(odds(ids[i], ids[j]));
const summary = ids.map(id => ({ id, wr: Math.round(avg[id].reduce((s,x)=>s+x,0)/avg[id].length*10)/10 }))
                   .sort((a,b) => b.wr - a.wr);
console.error('\n--- per-fighter average win rate ---');
summary.forEach(s => console.error(`  ${s.id.padEnd(12)} ${s.wr}%`));
