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
// Heal floats ("+N") are tinted to the healed fighter's team so you can tell
// WHO healed — but lightened, so they read distinct from that team's
// (saturated) damage numbers. Used by every heal float for consistency.
function healColor(f) { return f.team === 'red' ? '#ff8888' : '#88c8ff'; }
