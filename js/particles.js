// ============================================================================
// === FLOATS =================================================================
// spawnFloat() — floating damage / status text (e.g. "-12", "DODGE").
//
// The particle system (spawnParticles / spawnBoneBurst, the cross/shard/rune/
// spark/smoke/streak style menu, and the game.particles pool) was removed in the
// animation-system teardown. It will be rebuilt from scratch — do not resurrect
// the old implementation.
// ============================================================================

function spawnFloat(x, y, text, color) { game.floatTexts.push({ x, y, vy:-40, life:0.8, text, color }); }
// spawnImpact() — a transient impact burst at a hit/explosion point. Rendered as a
// bespoke shape per `kind` (drawImpact in arena.js), animating over its short life.
// `dir` is the impact direction (e.g. a projectile's travel), `mag` 0..1 scales the
// size. Visual only and headless-guarded, so it never touches the sim/balance.
function spawnImpact(x, y, kind, dir, mag, radius) {
  if (headless || !game) return;
  // `radius` (optional) — for impacts that have a meaningful FALLOFF zone, the
  // outer edge in world-units. Cannoneer EPICENTER passes splashRadius here so
  // the explosion can draw a fading edge ring showing where damage goes to zero.
  // Defaults to 0 (no falloff visualization needed).
  game.impacts.push({ x, y, kind, dir: dir || 0, mag: mag == null ? 0.5 : mag, radius: radius || 0, life: 0.22, maxLife: 0.22 });
}
// Heal floats ("+N") are tinted to the healed fighter's team so you can tell
// WHO healed — but lightened, so they read distinct from that team's
// (saturated) damage numbers. Used by every heal float for consistency.
function healColor(f) { return f.team === 'red' ? '#ff8888' : '#88c8ff'; }
