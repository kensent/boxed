// ============================================================================
// === PARTICLES ==============================================================
// spawnFloat() — floating damage / status text (e.g. "-12", "DODGE").
// spawnParticles() — multi-style particle bursts: cross, shard, rune, spark,
//   smoke, streak, square. Style maps to character identity.
// ============================================================================

function spawnFloat(x, y, text, color) { game.floatTexts.push({ x, y, vy:-40, life:0.8, text, color }); }
// Heal floats ("+N") are tinted to the healed fighter's team so you can tell
// WHO healed — but lightened, so they read distinct from that team's
// (saturated) damage numbers. Used by every heal float for consistency.
function healColor(f) { return f.team === 'red' ? '#ff8888' : '#88c8ff'; }
function spawnParticles(x, y, n, color, style) {
  style = style || 'square';
  for (let i = 0; i < n; i++) {
    const a = vrng() * Math.PI * 2;
    let s = 60 + vrng() * 120;
    let p = {
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 0.4 + vrng() * 0.3,
      color, style,
      size: 2 + vrng() * 3,
      rot: vrng() * Math.PI * 2,
      vrot: (vrng() - 0.5) * 6,
    };
    if (style === 'cross') {
      // Drift upward, slow horizontal
      p.vx *= 0.4;
      p.vy = -30 - vrng() * 60;
      p.life = 0.7 + vrng() * 0.3;
      p.size = 3 + vrng() * 3;
    } else if (style === 'shard') {
      // Triangular blood shards, faster outward
      p.vx = Math.cos(a) * (140 + vrng() * 80);
      p.vy = Math.sin(a) * (140 + vrng() * 80);
      p.life = 0.5 + vrng() * 0.3;
      p.size = 3 + vrng() * 4;
    } else if (style === 'rune') {
      // Slow swirling, spawn in a tight ring
      const r = 4 + vrng() * 6;
      p.x = x + Math.cos(a) * r;
      p.y = y + Math.sin(a) * r;
      p.vx = Math.cos(a) * 40;
      p.vy = Math.sin(a) * 40 - 20;
      p.life = 0.8 + vrng() * 0.4;
      p.size = 4 + vrng() * 2;
    } else if (style === 'spark') {
      // Thin metal slashes, fast and short-lived
      p.vx = Math.cos(a) * (180 + vrng() * 120);
      p.vy = Math.sin(a) * (180 + vrng() * 120);
      p.life = 0.2 + vrng() * 0.2;
      p.size = 1.5 + vrng() * 1.5;
      p.len = 6 + vrng() * 6;
    } else if (style === 'smoke') {
      // Slow, expanding, fading
      p.vx = Math.cos(a) * 30;
      p.vy = Math.sin(a) * 30 - 20;
      p.life = 0.9 + vrng() * 0.4;
      p.size = 4 + vrng() * 4;
      p.grow = 18 + vrng() * 10;
    } else if (style === 'streak') {
      // Aerodynamic green lines, narrow spread
      const baseAngle = a;
      p.vx = Math.cos(baseAngle) * (120 + vrng() * 60);
      p.vy = Math.sin(baseAngle) * (120 + vrng() * 60);
      p.life = 0.3 + vrng() * 0.2;
      p.size = 1.5;
      p.len = 8 + vrng() * 4;
    }
    game.particles.push(p);
  }
}
