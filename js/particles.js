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

// ============================================================================
// === HIT FEEDBACK HELPERS ===================================================
// Visual-only setters that bundle the multi-field state changes a single hit
// or cast triggers. Each one previously had 4-12 inline copies across
// abilities.js / engine.js / combat.js; centralizing them keeps the visual
// vocabulary consistent and prevents drift (a future tweak of the recoil
// magnitude, kick decay, etc. lands in one place instead of N).
// All helpers are sim-safe: the sim never reads back any of these fields.
// ============================================================================

// setFireKick(f, dur, dir) — ranged ability discharge gesture: the implement
// kicks back along the firing axis. Decays from `dur` to 0 over `dur` seconds.
// Read by drawFighter (sprites.js) to displace the body or weapon.
function setFireKick(f, dur, dir) {
  f.fireKick = dur;
  f.fireKickMax = dur;
  f.fireDir = dir;
}

// setMeleeImpact(f, dur) — melee strike/contact body squash. Decays from
// `dur` to 0 over `dur` seconds. Read by drawFighter for the squash/stretch.
function setMeleeImpact(f, dur) {
  f.meleeImpact = dur;
  f.meleeImpactMax = dur;
}

// applyRecoil(target, dir, big) — victim knockback after a non-melee hit
// (projectile, hazard, skeleton contact). The dead-guard is folded in so
// callers never recoil a corpse. `big` (0..1) scales magnitude per
// principle 5 (damage-weight). Melee body-contact recoil is set inside
// damage() — keep that path separate so the melee crack stays kind-aware.
function applyRecoil(target, dir, big) {
  if (target.dead) return;
  target.recoilTimer = 0.16;
  target.recoilDir = dir;
  target.recoilMag = big * 13;
}

// hitFx(x, y, kind, dir, big, radius?, sfxName?) — the visual+audio twin
// every projectile/hazard/AOE impact fires. The pair always co-occurs per
// the AUDIO.md force-shape mirror grammar; one helper keeps them linked.
// `radius` is optional, only used by impacts with a falloff edge
// (Cannoneer EPICENTER passes splashRadius).
// `sfxName` is optional. When omitted, plays the generic per-kind impact
// family sfx (`sfx('impact', { kind, big }, x)`) — the default for the
// projectile/melee hit grammar. When provided, plays that bespoke cue
// instead (e.g. Priest JUDGMENT's `lightning` holy bell, Necromancer
// skeleton death's `boneBurst`/`boneCrumble` one-shot transition cues).
// Visual side (spawnImpact) is the same in both cases — only the audio
// grammar differs. Headless-guarded inside spawnImpact and sfx.
function hitFx(x, y, kind, dir, big, radius, sfxName) {
  spawnImpact(x, y, kind, dir, big, radius);
  if (sfxName) sfx(sfxName, null, x);
  else sfx('impact', { kind, big }, x);
}
