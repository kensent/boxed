// ============================================================================
// === SEEDED RNG =============================================================
// Every fight runs on a seed, so any fight is reproducible — note a seed and
// replay it exactly (great for recording, and for hunting rare upsets).
// Two streams off the master seed: `rng` drives GAMEPLAY (spawn angles,
// ability rolls, the Gambler's wildcard) — this determines the outcome;
// `vrng` drives cosmetic VISUALS (particles). Keeping them separate means a
// rendering tweak can't desync the fight. Audio jitter stays unseeded — it's
// irrelevant to outcome and replay.
// mulberry32 — small, fast, well-distributed 32-bit PRNG.
function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let currentSeed = 0;       // the seed the active/most-recent fight used
let pendingSeed = null;    // if set, the next fight uses this seed (pinned)
let huntActive = false;    // true while an upset-hunt search is running
let headless = false;      // true during an upset-hunt: suppress all audio/
                           // visual side effects so step() runs as fast pure
                           // logic. The fight outcome is unaffected.
let rng = Math.random;     // gameplay stream — replaced per fight
let vrng = Math.random;    // visual stream — replaced per fight
// initSeededRng(seed): point both streams at a fresh PRNG built from `seed`.
// vrng is offset so the two streams don't march in lockstep.
function initSeededRng(seed) {
  currentSeed = seed >>> 0;
  rng = mulberry32(currentSeed);
  vrng = mulberry32((currentSeed ^ 0x9E3779B9) >>> 0);
}
// A fresh random seed (used when the player hasn't pinned one).
function randomSeed() { return (Math.random() * 0xFFFFFFFF) >>> 0; }
