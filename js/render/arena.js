function draw() {
  ctx.clearRect(0, 0, game.w, game.h);

  // Screen-shake — offset the whole frame by a decaying random jitter.
  let shaken = false;
  if (game.shakeTime > 0 && game.shakeMag > 0) {
    const decay = Math.min(1, game.shakeTime / 0.18);
    const m = game.shakeMag * decay;
    ctx.save();
    ctx.translate((Math.random() * 2 - 1) * m, (Math.random() * 2 - 1) * m);
    shaken = true;
  }

  // Sapper wake patches (drawn first, beneath everything)
  (game.wakes || []).forEach(wk => {
    const a = Math.max(0, wk.life / 2.5);
    ctx.fillStyle = `rgba(60,40,20,${a * 0.55})`;
    ctx.beginPath();
    ctx.arc(wk.x, wk.y, wk.size, 0, Math.PI * 2);
    ctx.fill();
    // Dark center
    ctx.fillStyle = `rgba(30,20,10,${a * 0.6})`;
    ctx.beginPath();
    ctx.arc(wk.x, wk.y, wk.size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  });

  (game.hazards || []).forEach(h => {
    const fade = h.timer / h.maxTimer; // 1 → 0
    const innerA = fade * 0.35;
    const outerA = fade * 0.18;
    const grad = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.radius);
    grad.addColorStop(0,   `rgba(255,140,26,${innerA})`);
    grad.addColorStop(0.5, `rgba(220,80,10,${outerA})`);
    grad.addColorStop(1,   `rgba(180,40,0,0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
    ctx.fill();
    // Crisp hot rim
    ctx.strokeStyle = `rgba(255,160,40,${fade * 0.5})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
    ctx.stroke();
  });

  game.mines.forEach(m => {
    const pulse = Math.sin(m.life * 8) * 0.5 + 0.5;
    const armed = m.armed <= 0;
    // Mine = a small round bomb (matches the Sapper's own bomb identity). The
    // old barrel/hexagon with grey bands read as a suitcase. Round body + fuse.
    const r = m.size * 0.82;
    // Team ring on the ground underneath.
    ctx.strokeStyle = m.team === 'red' ? '#ff2e2e' : '#2e9eff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.size + 2, 0, Math.PI * 2);
    ctx.stroke();
    // Bomb body — dark sphere.
    ctx.fillStyle = '#3a2614';
    ctx.beginPath();
    ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
    ctx.fill();
    // Soft highlight (upper-left) for the rounded 3D read.
    ctx.strokeStyle = 'rgba(255,255,255,0.20)';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(m.x, m.y, r * 0.62, Math.PI * 1.05, Math.PI * 1.5);
    ctx.stroke();
    // Fuse collar + short fuse rising from the top.
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(m.x - r * 0.22, m.y - r - r * 0.28, r * 0.44, r * 0.34);
    ctx.strokeStyle = armed ? `rgba(255,46,46,${0.55 + pulse * 0.45})` : '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(m.x, m.y - r - r * 0.2);
    ctx.lineTo(m.x + 3, m.y - r - r * 0.2 - 5);
    ctx.stroke();
    // Glowing ember at the fuse tip — only when armed.
    if (armed) {
      ctx.fillStyle = `rgba(255,140,26,${0.7 + pulse * 0.3})`;
      ctx.beginPath();
      ctx.arc(m.x + 3, m.y - r - r * 0.2 - 5, 1.6 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,240,200,${pulse * 0.9})`;
      ctx.beginPath();
      ctx.arc(m.x + 3, m.y - r - r * 0.2 - 5, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // (game.minions is legacy — Wizard orbs are now projectiles. Skeletons render next.)

  // Skeletons (Necromancer minions) — small bone-white humanoid silhouettes with team-colored ring
  game.skeletons.forEach(sk => {
    const teamCol = sk.team === 'red' ? '#ff2e2e' : '#2e9eff';
    // Team ring beneath
    ctx.strokeStyle = teamCol;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(sk.x, sk.y, sk.size + 2, 0, Math.PI * 2);
    ctx.stroke();
    // Bone body — small skull + cross-bones. Flashes white briefly when hit.
    const boneCol = (sk.flash > 0) ? '#ffffff' : '#e8e0d0';
    ctx.fillStyle = boneCol;
    // Skull (head)
    ctx.beginPath();
    ctx.arc(sk.x, sk.y - sk.size * 0.3, sk.size * 0.45, 0, Math.PI * 2);
    ctx.fill();
    // Eye sockets
    ctx.fillStyle = '#1a0a1a';
    ctx.beginPath();
    ctx.arc(sk.x - sk.size * 0.15, sk.y - sk.size * 0.3, sk.size * 0.1, 0, Math.PI * 2);
    ctx.arc(sk.x + sk.size * 0.15, sk.y - sk.size * 0.3, sk.size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    // Cross-bones body
    ctx.strokeStyle = boneCol;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sk.x - sk.size * 0.5, sk.y + sk.size * 0.1);
    ctx.lineTo(sk.x + sk.size * 0.5, sk.y + sk.size * 0.5);
    ctx.moveTo(sk.x + sk.size * 0.5, sk.y + sk.size * 0.1);
    ctx.lineTo(sk.x - sk.size * 0.5, sk.y + sk.size * 0.5);
    ctx.stroke();
  });

  game.projectiles.forEach(p => {
    if (p.kind === 'lightning') {
      // Jagged lightning dart trailing behind the lead point. Irregular segment
      // lengths + wandering off-axis path + uneven forks make it read as
      // ELECTRICITY, not an even zigzag. Every value is deterministic (layered
      // sin seeded by segment index + a per-bolt phase) — NEVER vrng(): the
      // renderer must not touch the sim RNG stream or live fights desync.
      const ang = Math.atan2(p.vy, p.vx);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      // A phase unique-ish per bolt so two bolts don't draw identically, but
      // STABLE for a given bolt (its life counts down, giving a slow flicker).
      const ph = (p.life || 0) * 9.0;
      const segs = 7;
      // Build the bolt path: points march back from the tip (0,0) along -x,
      // with irregular step lengths and a wandering perpendicular offset.
      const pts = [{ x: 0, y: 0 }];
      let bx = 0;
      for (let i = 1; i <= segs; i++) {
        // Uneven segment length: 2..5px, varied per segment.
        const stepLen = 2.4 + Math.abs(Math.sin(i * 2.7 + ph)) * 2.6;
        bx -= stepLen;
        // Wandering offset — mix two frequencies so it veers rather than
        // politely alternating; amplitude grows slightly toward the tail.
        const wob = (Math.sin(i * 1.9 + ph) + Math.sin(i * 4.3 + ph * 1.7) * 0.5);
        const off = wob * (1.6 + i * 0.45);
        pts.push({ x: bx, y: off });
      }
      // Outer glow stroke — soft, wide, low alpha.
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(255,232,61,0.35)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      // Main yellow bolt — width tapers from tail (thin) to tip (thick).
      for (let i = 1; i < pts.length; i++) {
        const t = 1 - i / pts.length;            // 1 at tip, → 0 at tail
        ctx.strokeStyle = '#ffe83d';
        ctx.lineWidth = 1.2 + t * 1.8;
        ctx.beginPath();
        ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
        ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
      }
      // White-hot core down the centre — thin, bright, electric.
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      // Two forks of different sizes, branching at sharp angles from irregular
      // points along the bolt.
      const forkAt = [2, 5];
      for (let k = 0; k < forkAt.length; k++) {
        const a = pts[forkAt[k]];
        const fl = 4 + k * 3;                    // different lengths
        const fdir = (k === 0 ? 1 : -1);
        const fang = (0.7 + Math.abs(Math.sin(ph + k * 3.1)) * 0.6) * fdir;
        ctx.strokeStyle = '#ffe83d';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(a.x - Math.cos(fang) * fl, a.y + Math.sin(fang) * fl);
        ctx.stroke();
      }
      // Bright tip — tight white core + small yellow glow (no big blobby orb).
      ctx.fillStyle = 'rgba(255,232,61,0.45)';
      ctx.beginPath();
      ctx.arc(0, 0, p.size + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, p.size - 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (p.kind === 'arrow') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      // Wooden shaft
      ctx.strokeStyle = '#8b6332';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(6, 0);
      ctx.stroke();
      // Metal arrowhead
      ctx.fillStyle = '#cfd8e3';
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(5, -3);
      ctx.lineTo(7, 0);
      ctx.lineTo(5, 3);
      ctx.closePath();
      ctx.fill();
      // Feather fletching (green)
      ctx.fillStyle = '#3dff8a';
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(-12, -2.5);
      ctx.lineTo(-7, -1);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(-12, 2.5);
      ctx.lineTo(-7, 1);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (p.kind === 'cannon') {
      // Heavy iron cannonball with smoke trail
      ctx.save();
      ctx.translate(p.x, p.y);
      // Smoke trail behind the ball
      const back = Math.atan2(-p.vy, -p.vx);
      for (let i = 1; i <= 3; i++) {
        const tx = Math.cos(back) * i * 5;
        const ty = Math.sin(back) * i * 5;
        ctx.fillStyle = `rgba(120,110,100,${0.35 - i * 0.08})`;
        ctx.beginPath();
        ctx.arc(tx, ty, p.size - i * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      // The ball itself — dark iron core with highlight
      ctx.fillStyle = '#2a2a2a';
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.arc(-p.size * 0.3, -p.size * 0.3, p.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      // Hot ember glow at center
      ctx.fillStyle = 'rgba(255,140,26,0.5)';
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (p.kind === 'orb') {
      // Wizard rune-orb — rotating sigil with counter-spinning star and glowing core
      const spin = p.spin || 0;
      ctx.save();
      ctx.translate(p.x, p.y);
      // Outer runic ring
      ctx.rotate(spin);
      ctx.strokeStyle = '#c77dff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, p.size + 1, 0, Math.PI * 2);
      ctx.stroke();
      // Three dashes around the ring
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (p.size - 1), Math.sin(a) * (p.size - 1));
        ctx.lineTo(Math.cos(a) * (p.size + 3), Math.sin(a) * (p.size + 3));
        ctx.stroke();
      }
      // Inner counter-rotating star
      ctx.rotate(-spin * 2.5);
      ctx.fillStyle = '#9d4edd';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a1 = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const a2 = a1 + Math.PI / 5;
        ctx.lineTo(Math.cos(a1) * p.size * 0.7, Math.sin(a1) * p.size * 0.7);
        ctx.lineTo(Math.cos(a2) * p.size * 0.3, Math.sin(a2) * p.size * 0.3);
      }
      ctx.closePath();
      ctx.fill();
      // Bright yellow center
      ctx.fillStyle = '#ffe83d';
      ctx.beginPath();
      ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // Team color ring outside (subtle)
      ctx.strokeStyle = p.team === 'red' ? 'rgba(255,46,46,0.4)' : 'rgba(46,158,255,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size + 5, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.kind === 'hex') {
      // Witch hex bolt — sickly green spinning orb with wispy trail
      const spin = p.spin || 0;
      // Trail (3 fading dots behind, in opposite direction of velocity)
      const sp = Math.hypot(p.vx, p.vy) || 1;
      const nx = -p.vx / sp;
      const ny = -p.vy / sp;
      for (let i = 1; i <= 3; i++) {
        ctx.fillStyle = `rgba(125,255,61,${0.4 - i * 0.1})`;
        ctx.beginPath();
        ctx.arc(p.x + nx * i * 5, p.y + ny * i * 5, p.size * (1 - i * 0.2), 0, Math.PI * 2);
        ctx.fill();
      }
      // Main hex bolt body
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(spin);
      // Outer glow ring
      ctx.fillStyle = 'rgba(125,255,61,0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, p.size + 3, 0, Math.PI * 2);
      ctx.fill();
      // Core orb (bright green)
      ctx.fillStyle = '#7dff3d';
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
      // Dark inner sigil (rotating cross)
      ctx.strokeStyle = '#2d4a2a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-p.size * 0.6, 0);
      ctx.lineTo(p.size * 0.6, 0);
      ctx.moveTo(0, -p.size * 0.6);
      ctx.lineTo(0, p.size * 0.6);
      ctx.stroke();
      // White-hot center
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (p.kind === 'hook') {
      // Hunter hook in flight — small dark metal hook with rope trail
      const sp = Math.hypot(p.vx, p.vy) || 1;
      const ang = Math.atan2(p.vy, p.vx);
      // Rope trail (from hook source back to projectile)
      if (p.hookSrc && !p.hookSrc.dead) {
        ctx.strokeStyle = '#c89060';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.moveTo(p.hookSrc.x, p.hookSrc.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      // Hook tip (small curved barb) — steel grey to match the Hunter's hook
      // sprite (brown read as wood). The rope trail above stays brown — rope
      // is fibrous, brown reads correctly there.
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      ctx.strokeStyle = '#b8bcc4';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(3, 0);
      ctx.quadraticCurveTo(5, 0, 4, -4);
      ctx.stroke();
      // Bright barb tip
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(4, -4, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (p.kind === 'coin') {
      // Gambler — a spinning gold coin. The spin squashes its width so it
      // reads as a coin tumbling edge-over-edge in flight.
      const sp = p.spin || 0;
      const squash = Math.abs(Math.cos(sp));        // 1 = face-on, 0 = edge-on
      const w = p.size * Math.max(0.12, squash);
      ctx.save();
      ctx.translate(p.x, p.y);
      // Soft glow
      ctx.fillStyle = 'rgba(255,210,61,0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 0, w + 3, p.size + 3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Coin body — gold, edge slightly darker
      ctx.fillStyle = '#d9a521';
      ctx.beginPath();
      ctx.ellipse(0, 0, w, p.size, 0, 0, Math.PI * 2);
      ctx.fill();
      // Bright face — only visible when near face-on
      if (squash > 0.35) {
        ctx.globalAlpha = (squash - 0.35) / 0.65;
        ctx.fillStyle = '#ffd23d';
        ctx.beginPath();
        ctx.ellipse(0, 0, w * 0.7, p.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        // Stamped mark
        ctx.fillStyle = '#b9851a';
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }
  });

  game.particles.forEach(pt => {
    const alpha = Math.max(0, pt.life * 2);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = pt.color;
    ctx.strokeStyle = pt.color;
    if (pt.style === 'cross') {
      // Tiny plus/cross
      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.rotate(pt.rot);
      ctx.fillRect(-1, -pt.size, 2, pt.size * 2);
      ctx.fillRect(-pt.size, -1, pt.size * 2, 2);
      ctx.restore();
    } else if (pt.style === 'shard') {
      // Triangle blood shard, rotated by velocity
      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.rotate(Math.atan2(pt.vy, pt.vx));
      ctx.beginPath();
      ctx.moveTo(pt.size, 0);
      ctx.lineTo(-pt.size * 0.6, -pt.size * 0.5);
      ctx.lineTo(-pt.size * 0.6, pt.size * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (pt.style === 'rune') {
      // Rotating tiny star/diamond
      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.rotate(pt.rot);
      ctx.beginPath();
      ctx.moveTo(0, -pt.size);
      ctx.lineTo(pt.size * 0.5, 0);
      ctx.lineTo(0, pt.size);
      ctx.lineTo(-pt.size * 0.5, 0);
      ctx.closePath();
      ctx.fill();
      // glow center
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle = '#ffe83d';
      ctx.beginPath();
      ctx.arc(0, 0, pt.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (pt.style === 'spark') {
      // Thin slash line
      const vlen = Math.hypot(pt.vx, pt.vy) || 1;
      const dx = pt.vx / vlen * pt.len;
      const dy = pt.vy / vlen * pt.len;
      ctx.lineWidth = pt.size;
      ctx.beginPath();
      ctx.moveTo(pt.x - dx * 0.5, pt.y - dy * 0.5);
      ctx.lineTo(pt.x + dx * 0.5, pt.y + dy * 0.5);
      ctx.stroke();
    } else if (pt.style === 'smoke') {
      // Soft expanding circle
      ctx.globalAlpha = alpha * 0.5;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (pt.style === 'streak') {
      // Aerodynamic wind line
      const vlen = Math.hypot(pt.vx, pt.vy) || 1;
      const dx = pt.vx / vlen * pt.len;
      const dy = pt.vy / vlen * pt.len;
      ctx.lineWidth = pt.size;
      ctx.beginPath();
      ctx.moveTo(pt.x - dx, pt.y - dy);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    } else {
      // Default: square
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    }
  });
  ctx.globalAlpha = 1;

  // Archer trail (drawn behind fighters)
  [game.red, game.blue].forEach(f => {
    if (f.ability !== 'arrow' || f.dead || !f.trail || f.trail.length < 2) return;
    for (let i = 1; i < f.trail.length; i++) {
      const prev = f.trail[i - 1];
      const curr = f.trail[i];
      const alpha = Math.max(0, curr.life * 2.5);
      ctx.strokeStyle = `rgba(61,255,138,${alpha * 0.6})`;
      ctx.lineWidth = 2 + curr.life * 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
    }
  });

  // Jester blink streak — connects depart and arrive points briefly after a blink
  [game.red, game.blue].forEach(f => {
    if (f.ability !== 'blink' || f.dead || f.blinkFx <= 0) return;
    const a = f.blinkFx / 0.35;
    ctx.strokeStyle = `rgba(255,255,255,${a * 0.7})`;
    ctx.lineWidth = 2 + a * 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(f.blinkFromX, f.blinkFromY);
    ctx.lineTo(f.x, f.y);
    ctx.stroke();
    // Soft glow bookends
    ctx.fillStyle = `rgba(232,216,184,${a * 0.6})`;
    ctx.beginPath();
    ctx.arc(f.blinkFromX, f.blinkFromY, 4 + a * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(f.x, f.y, 4 + a * 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Hunter tether: draw chain line from puller to target during tether
  [game.red, game.blue].forEach(f => {
    if (f.tetherTimer > 0 && f.tetherTarget && !f.tetherTarget.dead) {
      const t = f.tetherTarget;
      const dx = f.x - t.x;
      const dy = f.y - t.y;
      const d = Math.hypot(dx, dy);
      if (d > 0) {
        const ang = Math.atan2(dy, dx);
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(ang);
        // Chain line (segmented dashes)
        ctx.strokeStyle = '#c89060';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(d, 0);
        ctx.stroke();
        ctx.setLineDash([]);
        // Hook embedded in target (small triangle)
        ctx.fillStyle = '#3a2818';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-5, -3);
        ctx.lineTo(-5, 3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
  });

  // Warlock drain beam: draw a pulsing energy beam from the Warlock to its target
  [game.red, game.blue].forEach(f => {
    if (f.drainTimer > 0 && f.drainTarget && !f.drainTarget.dead) {
      const t = f.drainTarget;
      const dx = t.x - f.x;
      const dy = t.y - f.y;
      const d = Math.hypot(dx, dy);
      if (d > 0) {
        const ang = Math.atan2(dy, dx);
        const pulse = 0.6 + Math.sin(performance.now() / 70) * 0.4;
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(ang);
        // Outer glow beam
        ctx.strokeStyle = 'rgba(192,80,255,' + (0.25 * pulse).toFixed(2) + ')';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(d, 0);
        ctx.stroke();
        // Core beam
        ctx.strokeStyle = 'rgba(192,80,255,' + (0.85 * pulse).toFixed(2) + ')';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(d, 0);
        ctx.stroke();
        // Travelling energy beads flowing back toward the Warlock (the drain direction)
        ctx.fillStyle = '#e0b0ff';
        const flow = (performance.now() / 300) % 1;
        for (let i = 0; i < 4; i++) {
          const bp = ((i / 4) + (1 - flow)) % 1;
          ctx.beginPath();
          ctx.arc(d * bp, 0, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
  });

  drawFighter(game.red);
  drawFighter(game.blue);

  // Closing ring — once active, draw the encroaching fog beyond the safe circle
  // plus a bright pulsing boundary line. Sits above fighters so the danger reads.
  if (game.elapsed > 20 && game.ringRadius < Math.hypot(game.w, game.h) / 2) {
    const cx = game.w / 2, cy = game.h / 2;
    const r = Math.max(0, game.ringRadius);
    // Fog fill: everything OUTSIDE the safe circle. Use even-odd fill so the
    // safe zone is punched out.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, game.w, game.h);
    ctx.arc(cx, cy, r, 0, Math.PI * 2, true); // reverse winding = hole
    const pulse = 0.5 + Math.sin(performance.now() / 200) * 0.12;
    ctx.fillStyle = `rgba(150,40,200,${(0.22 * pulse + 0.12).toFixed(3)})`;
    ctx.fill('evenodd');
    ctx.restore();
    // Boundary ring — bright pulsing circle
    ctx.strokeStyle = `rgba(210,90,255,${(0.6 + Math.sin(performance.now() / 150) * 0.3).toFixed(2)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    // Inner faint guide ring
    ctx.strokeStyle = 'rgba(210,90,255,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(0, r - 4), 0, Math.PI * 2);
    ctx.stroke();
  }

  game.floatTexts.forEach(ft => {
    ctx.globalAlpha = Math.min(1, ft.life * 1.5);
    ctx.textAlign = 'center';
    if (ft.big != null) {
      // Damage number — an event. Size scales with the hit's weight, and it
      // punches in oversized then settles (the KO-graphic trick, scaled down).
      const base = 13 + ft.big * 17;            // 13px chip .. 30px heaviest
      // Punch-in: overshoot to 1.8x in the first 0.10s, then hold at 1.0x.
      // age resets on every hit, so each hit in a burst re-punches.
      const a = ft.age || 0;
      const scale = a < 0.10 ? 1.8 - (a / 0.10) * 0.8 : 1;
      const size = base * scale;
      ctx.font = '900 ' + size.toFixed(1) + 'px Bungee, monospace';
      // Clamp y into the arena so hits near the top/bottom edge stay visible
      // (the canvas IS the arena — text drawn past an edge is simply lost).
      const pad = size * 0.85;
      const dy = Math.max(pad, Math.min(game.h - pad * 0.4, ft.y));
      // Same for x — text is centre-aligned, so a wide number at a side edge
      // would spill half its width off-canvas. Clamp by the measured half-width.
      const halfW = ctx.measureText(ft.text).width / 2 + 2;
      const dx = Math.max(halfW, Math.min(game.w - halfW, ft.x));
      // Dark outline for weight + legibility on any background.
      ctx.lineWidth = 2 + ft.big * 2.5;
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.lineJoin = 'round';
      ctx.strokeText(ft.text, dx, dy);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, dx, dy);
    } else {
      // Status text ("DODGE", heal numbers) — flat, unchanged.
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 14px Bungee, monospace';
      // Same edge clamp so heal/status text near a border stays on screen.
      const halfW = ctx.measureText(ft.text).width / 2 + 2;
      const dx = Math.max(halfW, Math.min(game.w - halfW, ft.x));
      const dy = Math.max(13, Math.min(game.h - 5, ft.y));
      ctx.fillText(ft.text, dx, dy);
    }
  });
  ctx.globalAlpha = 1;

  // K.O. graphic — punches in big at the kill, holds, then fades.
  if (game.koTimer > 0) {
    const total = 1.2;
    const age = total - game.koTimer;        // 0 -> 1.2
    const cx = game.w / 2, cy = game.h / 2;
    // Scale: overshoot punch in the first 0.18s, then settle.
    let scale;
    if (age < 0.18) {
      const p = age / 0.18;
      scale = 3.2 - 2.4 * p;                 // 3.2x -> 0.8x
    } else if (age < 0.32) {
      const p = (age - 0.18) / 0.14;
      scale = 0.8 + 0.2 * p;                 // 0.8x -> 1.0x settle
    } else {
      scale = 1;
    }
    // Fade out over the last 0.35s
    const alpha = game.koTimer < 0.35 ? game.koTimer / 0.35 : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    // Slight tilt for energy
    ctx.rotate(-0.08);
    // Dark slab behind the text
    ctx.fillStyle = 'rgba(10,10,12,0.82)';
    ctx.fillRect(-game.w * 0.5, -26, game.w, 52);
    // "K.O." text — winner-colored
    const wc = game.winner && game.winner.team === 'red' ? '#ff2e2e' : '#2e9eff';
    ctx.font = '900 46px Bungee, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Glow
    ctx.shadowColor = wc;
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#fff';
    ctx.fillText('K.O.', 0, 2);
    ctx.shadowBlur = 0;
    // Colored underline accent
    ctx.fillStyle = wc;
    ctx.fillRect(-44, 22, 88, 4);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // End screen-shake transform before any full-screen overlay.
  if (shaken) ctx.restore();

  // K.O. flash-frame — a single bright white frame at the kill, like a camera
  // snap, before the slow-mo settles in. Fades over its short lifetime.
  if (game.flashFrame > 0) {
    ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.85, game.flashFrame * 7).toFixed(2) + ')';
    ctx.fillRect(0, 0, game.w, game.h);
  }
}

