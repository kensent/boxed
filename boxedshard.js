// boxedshard.js — sharded version of boxedsim.js. Runs a SLICE of the 120
// matchups so each invocation fits inside the tool time limit, instead of one
// ~280s monolithic run that overruns / gets reaped.
//
// Usage:  node boxedshard.js <startIdx> <endIdx> <outfile>
//   Runs matchups with global index in [startIdx, endIdx) and APPENDS each
//   result line to <outfile>. Matchup ordering + per-matchup salt are IDENTICAL
//   to boxedsim.js, so sharded results == monolithic results, exactly.
//
// After all shards finish, boxedmerge.js assembles outfile into the MATCHUPS
// block + per-fighter summary.
const fs = require('fs');

function loadEngine() {
  const SIM_FILES = [
    'js/rng.js', 'js/fighters.js', 'js/matchups.js',
    'js/audio.js', 'js/combat.js', 'js/particles.js', 'js/abilities.js', 'js/engine.js',
    'js/main.js',  // endGame() is called by damage() in combat.js
  ];
  const script = SIM_FILES.map(f => fs.readFileSync(__dirname + '/' + f, 'utf8')).join('\n');
  const ctxStub = {
    setTransform:()=>0, clearRect:()=>0, save:()=>0, restore:()=>0,
    beginPath:()=>0, fill:()=>0, stroke:()=>0, arc:()=>0, ellipse:()=>0,
    moveTo:()=>0, lineTo:()=>0, closePath:()=>0, fillRect:()=>0, fillText:()=>0,
    translate:()=>0, rotate:()=>0, scale:()=>0, quadraticCurveTo:()=>0,
    createRadialGradient:()=>({addColorStop:()=>0}), setLineDash:()=>0,
    measureText:()=>({width:10}), strokeRect:()=>0,
  };
  const el = () => ({
    classList:{add:()=>0,remove:()=>0,contains:()=>0,toggle:()=>0},
    addEventListener:()=>0, style:{}, textContent:'', innerHTML:'', value:'',
    dataset:{}, appendChild:()=>0,
    getBoundingClientRect:()=>({width:360,height:360}),
    getContext:()=>ctxStub, offsetWidth:0, width:360, height:360, focus:()=>0,
  });
  const sandbox = {
    document:{ getElementById:el, createElement:el, querySelectorAll:()=>[], querySelector:el, addEventListener:()=>0 },
    window:{ devicePixelRatio:1, addEventListener:()=>0,
             AudioContext:function(){ return { createGain:()=>({connect:()=>0,gain:{value:0,setValueAtTime:()=>0}}), createOscillator:()=>({}), destination:{}, currentTime:0 }; } },
    performance:{ now:()=>Date.now() },
    requestAnimationFrame:()=>0, navigator:{}, Math, Date, JSON, console,
  };
  const out = {};
  const wrapped = script + '\n;__exports.simulateFight=simulateFight;__exports.simulateFightDetailed=simulateFightDetailed;__exports.FIGHTERS=FIGHTERS;';
  const fn = new Function(...Object.keys(sandbox), '__exports', wrapped);
  fn(...Object.values(sandbox), out);
  return out;
}

const engine = loadEngine();
// Fighters excluded from the balance harness — currently empty (all 15
// active roster members participate). Keep in sync with boxedmerge.js.
const EXCLUDE_IDS = new Set();
const ids = engine.FIGHTERS.map(f => f.id).filter(id => !EXCLUDE_IDS.has(id));
const N = 500;
// Fights that took longer than this (seconds) get counted as "long" — useful for
// spotting stalemate-prone matchups now that the fog mechanic was removed and
// nothing artificially shortens fights.
const LONG_FIGHT_THRESHOLD = 60;
// A "tight" fight is one where the winner barely survived — finished below this
// fraction of their max HP. Captures the dramatic close-finish profile of a
// matchup (per-fight, not the matchup's overall win rate). Must match the
// threshold used in engine.js huntTight() so the picker and the offline sim
// agree on what counts as tight.
const TIGHT_HP_FRACTION = 0.3;

// Cache fighter templates by id once so the inner loop just looks up max HP.
const FBYID = {};
engine.FIGHTERS.forEach(f => { FBYID[f.id] = f; });

function matchupStats(a, b, salt) {
  let wins = 0, totalElapsed = 0, longCount = 0;
  let tightCount = 0, tightElapsedTotal = 0;
  const aMax = FBYID[a].hp, bMax = FBYID[b].hp;
  for (let k = 0; k < N; k++) {
    const seed = (salt * 2654435761 + k * 40503) >>> 0;  // same formula as boxedsim.js
    const r = engine.simulateFightDetailed(a, b, seed);
    if (r.winId === a) wins++;
    totalElapsed += r.elapsed || 0;
    if ((r.elapsed || 0) > LONG_FIGHT_THRESHOLD) longCount++;
    // Tight = winner ended on < TIGHT_HP_FRACTION of their max HP (regardless of
    // who won). Stalemates without a winner don't count as tight (no margin).
    if (r.winId) {
      const winMax = r.winId === a ? aMax : bMax;
      if (r.winnerHp / winMax < TIGHT_HP_FRACTION) {
        tightCount++;
        tightElapsedTotal += r.elapsed || 0;
      }
    }
  }
  return {
    wr: Math.round(wins / N * 100),
    avgElapsed: Math.round(totalElapsed / N * 10) / 10,
    longPct: Math.round(longCount / N * 100),
    // Total tight elapsed + count are emitted as raw sums (not averages); the
    // merge step computes per-matchup AND per-fighter averages from them, so
    // rounding only happens once at display time.
    tightCount,
    tightElapsedTotal: Math.round(tightElapsedTotal * 10) / 10,
  };
}

// Build the full ordered matchup list (same nested-loop order as boxedsim.js).
// salt starts at 1 and increments per matchup — index 0 has salt 1, etc.
const matchups = [];
let salt = 1;
for (let i = 0; i < ids.length; i++)
  for (let j = i + 1; j < ids.length; j++)
    matchups.push({ a: ids[i], b: ids[j], salt: salt++ });

const start = parseInt(process.argv[2], 10);
const end   = parseInt(process.argv[3], 10);
const outfile = process.argv[4];
if (isNaN(start) || isNaN(end) || !outfile) {
  console.error('usage: node boxedshard.js <startIdx> <endIdx> <outfile>');
  process.exit(1);
}

const t0 = Date.now();
const out = [];
for (let m = start; m < end && m < matchups.length; m++) {
  const { a, b, salt } = matchups[m];
  const s = matchupStats(a, b, salt);
  out.push(`'${a}_${b}':${s.wr}:${s.avgElapsed}:${s.longPct}:${s.tightCount}:${s.tightElapsedTotal}`);
}
fs.appendFileSync(outfile, out.join('\n') + '\n');
console.error(`shard [${start},${end}) done: ${out.length} matchups in ${((Date.now()-t0)/1000).toFixed(1)}s`);
