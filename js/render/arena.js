// drawHunterHook(hx,hy, ex,ey) — the Hunter's steel cable + hook, always drawn from
// the Hunter (hx,hy) outward to the far end (ex,ey): +x points Hunter→end, so a taut
// trembling steel line, copper barbs pointing BACK toward the Hunter, and a copper
// barbed hook biting forward at the far end. Shared by the in-flight hook and the
// reel-in tether so they render identically — no mirroring between the two phases.
function drawHunterHook(hx, hy, ex, ey) {
  const d = Math.hypot(ex - hx, ey - hy);
  const start = FIGHTER_SIZE;                          // begin at the Hunter's EDGE, not inside its circle
  if (d <= start + 4) return;                          // far end on top of the Hunter — nothing to draw
  const ang = Math.atan2(ey - hy, ex - hx);            // +x: Hunter → far end
  const tremor = 0.7 + Math.sin(performance.now() / 26) * 0.3;
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(ang);
  ctx.lineCap = 'round';
  ctx.strokeStyle = `rgba(184,188,196,${tremor.toFixed(3)})`;   // taut steel, trembling
  ctx.lineWidth = 1 + tremor * 1.3;
  ctx.beginPath(); ctx.moveTo(start, 0); ctx.lineTo(d - 3, 0); ctx.stroke();
  ctx.strokeStyle = `rgba(200,144,96,${(0.5 + tremor * 0.4).toFixed(3)})`; // copper barbs
  ctx.lineWidth = 1.5;
  const span = (d - 3) - start;                        // barbs only across the visible gap
  const barbs = Math.max(1, Math.floor(span / 18));
  for (let i = 1; i <= barbs; i++) {
    const px = start + (i / (barbs + 1)) * span;
    ctx.beginPath();
    ctx.moveTo(px + 4, -4); ctx.lineTo(px - 1, 0); ctx.lineTo(px + 4, 4); // chevron back toward Hunter
    ctx.stroke();
  }
  ctx.strokeStyle = '#c89060';                        // barbed hook biting forward at the far end
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(d - 6, 0); ctx.lineTo(d, 0); ctx.quadraticCurveTo(d + 4, 0, d + 2, -5);
  ctx.stroke();
  ctx.fillStyle = '#e8e0d0';
  ctx.beginPath(); ctx.arc(d + 2, -5, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// drawImpact(im) — a transient impact burst, bespoke per projectile/explosion kind
// (the contact-point equivalent of the melee force-shapes). `a` fades 1→0, `prog`
// expands 0→1, `im.mag` (0..1) scales the size with damage. Line-drawn, no rng.
function drawImpact(im) {
  const a = im.life / im.maxLife;                  // 1 → 0
  const prog = 1 - a;                               // 0 → 1
  const m = im.mag;
  ctx.save();
  ctx.translate(im.x, im.y);
  ctx.lineCap = 'round';
  switch (im.kind) {
    case 'cannon': {                                // heavy orange blast
      const r = 6 + prog * (18 + m * 16);
      ctx.strokeStyle = `rgba(255,140,26,${(a * 0.9).toFixed(3)})`;
      ctx.lineWidth = 3 * a + 0.5;
      for (let i = 0; i < 8; i++) { const g = (i / 8) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(g) * 4, Math.sin(g) * 4); ctx.lineTo(Math.cos(g) * r, Math.sin(g) * r); ctx.stroke(); }
      ctx.strokeStyle = `rgba(255,200,80,${(a * 0.7).toFixed(3)})`;
      ctx.lineWidth = 2 * a + 0.5;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = `rgba(255,255,220,${a.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(0, 0, 3 * a + 1, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'mine': {                                  // the biggest explosion
      const r = 8 + prog * 34;
      ctx.strokeStyle = `rgba(255,120,20,${(a * 0.95).toFixed(3)})`;
      ctx.lineWidth = 3.5 * a + 0.6;
      for (let i = 0; i < 10; i++) { const g = (i / 10) * Math.PI * 2; const rr = r * (0.7 + (i % 2) * 0.3); ctx.beginPath(); ctx.moveTo(Math.cos(g) * 5, Math.sin(g) * 5); ctx.lineTo(Math.cos(g) * rr, Math.sin(g) * rr); ctx.stroke(); }
      ctx.strokeStyle = `rgba(255,90,20,${(a * 0.8).toFixed(3)})`;
      ctx.lineWidth = 3 * a + 0.5;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = `rgba(255,240,200,${a.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(0, 0, 4 * a + 1, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'bone': {                                  // bone shards erupt
      const r = 4 + prog * (10 + m * 10);
      ctx.strokeStyle = `rgba(232,224,208,${a.toFixed(3)})`;
      ctx.lineWidth = 2 * a + 0.5;
      for (let i = 0; i < 7; i++) { const g = (i / 7) * Math.PI * 2 + i * 0.5; ctx.beginPath(); ctx.moveTo(Math.cos(g) * 3, Math.sin(g) * 3); ctx.lineTo(Math.cos(g) * r, Math.sin(g) * r); ctx.stroke(); }
      break;
    }
    case 'orb': {                                   // purple rune pop
      ctx.strokeStyle = `rgba(199,125,255,${a.toFixed(3)})`;
      ctx.lineWidth = 2 * a + 0.4;
      ctx.beginPath(); ctx.arc(0, 0, 3 + prog * 10, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = `rgba(255,232,61,${a.toFixed(3)})`;
      drawStar(ctx, 0, 0, 4, 3 + prog * 4, 1.5); ctx.fill();
      break;
    }
    case 'hex': {                                   // green splat
      const r = 3 + prog * 10;
      ctx.strokeStyle = `rgba(125,255,61,${a.toFixed(3)})`;
      ctx.lineWidth = 2 * a + 0.4;
      for (let i = 0; i < 6; i++) { const g = (i / 6) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(g) * 2, Math.sin(g) * 2); ctx.lineTo(Math.cos(g) * r, Math.sin(g) * r); ctx.stroke(); }
      ctx.strokeStyle = `rgba(125,255,61,${(a * 0.6).toFixed(3)})`;
      ctx.lineWidth = 1.5 * a + 0.3;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case 'coin': {                                  // gold ding
      ctx.strokeStyle = `rgba(255,210,61,${a.toFixed(3)})`;
      ctx.lineWidth = 1.5 * a + 0.4;
      ctx.beginPath(); ctx.arc(0, 0, 3 + prog * 9, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = `rgba(255,240,180,${a.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(0, 0, 1.5 * a + 0.5, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'hook': {                                  // small steel clink
      const r = 3 + prog * 7;
      ctx.strokeStyle = `rgba(220,224,232,${a.toFixed(3)})`;
      ctx.lineWidth = 1.5 * a + 0.4;
      for (let i = 0; i < 3; i++) { const g = (i / 3) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(g) * r, Math.sin(g) * r); ctx.stroke(); }
      break;
    }
    case 'puncture': {                              // Duelist COUNTER — same lance as the riposte, smaller
      ctx.rotate(im.dir);
      const x1 = 6 + prog * 8;
      ctx.strokeStyle = `rgba(220,220,245,${a.toFixed(3)})`;
      ctx.lineWidth = 1.6 * a + 0.4;
      ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(x1, 0); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${a.toFixed(3)})`;     // tip glint
      ctx.lineWidth = 0.8;
      const g = 3 * a + 1;
      ctx.beginPath();
      ctx.moveTo(x1 - g, 0); ctx.lineTo(x1 + g, 0); ctx.moveTo(x1, -g); ctx.lineTo(x1, g);
      ctx.stroke();
      break;
    }
    case 'arrow': {                                 // sharp puncture along the shot + green splinters
      ctx.rotate(im.dir);
      ctx.strokeStyle = `rgba(220,255,230,${a.toFixed(3)})`;
      ctx.lineWidth = 1.6 * a + 0.4;
      ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(4 + prog * 6, 0); ctx.stroke();   // puncture line
      ctx.strokeStyle = `rgba(61,255,138,${a.toFixed(3)})`;
      const sp = 3 + prog * 6;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(-sp, -sp * 0.6);                                     // splinters fanning back
      ctx.moveTo(0, 0); ctx.lineTo(-sp, sp * 0.6);
      ctx.stroke();
      break;
    }
    case 'judgment': {                              // Priest JUDGMENT — holy light shaft + gold ground-ring
      const sh = 64 + m * 28;                       // shaft height (light from above)
      ctx.strokeStyle = `rgba(255,255,255,${(a * 0.9).toFixed(3)})`;
      ctx.lineWidth = 2 * a + 0.6;
      ctx.beginPath(); ctx.moveTo(0, -sh); ctx.lineTo(0, 0); ctx.stroke();           // bright core ray
      ctx.strokeStyle = `rgba(255,232,61,${(a * 0.7).toFixed(3)})`;
      ctx.lineWidth = 1.5 * a + 0.4;
      const fan = 5 + prog * 5;
      ctx.beginPath();
      ctx.moveTo(-fan, -sh); ctx.lineTo(0, 0); ctx.moveTo(fan, -sh); ctx.lineTo(0, 0); // flanking rays converge
      ctx.stroke();
      const r = 5 + prog * (22 + m * 16);           // gold ground-ring expands
      ctx.strokeStyle = `rgba(255,232,61,${(a * 0.9).toFixed(3)})`;
      ctx.lineWidth = 2.5 * a + 0.5;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = `rgba(255,255,240,${a.toFixed(3)})`;                            // white-hot point
      ctx.beginPath(); ctx.arc(0, 0, 3 * a + 1, 0, Math.PI * 2); ctx.fill();
      break;
    }
    default: {                                      // generic flash
      ctx.fillStyle = `rgba(255,255,255,${(a * 0.7).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(0, 0, 3 + prog * 6, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

// drawDeath(f, prog) — the per-fighter death "undoing": the loser's form comes apart
// in its own voice over the K.O. window (prog 0→1). Three layers: (1) the sprite
// transforms one last time (drawFighter skips dead fighters, so we draw it here),
// (2) a bespoke voice effect, (3) a settling residue. Line-drawn, deterministic.
// Fighters without a bespoke death fall through to the generic shatter.
function drawDeath(f, prog) {
  const a = 1 - prog;
  const lc = f.team === 'red' ? '255,46,46' : '46,158,255';
  ctx.save();
  ctx.translate(f.x, f.y);
  if (Math.cos(f.lastFacing || 0) < 0) ctx.scale(-1, 1);  // mirror for left-facing
  const fc = 0;  // always draw right-facing; scale above handles left
  switch (f.ability) {
    case 'tackle': {  // Berserker — final BLOODRAGE: convulse, shred, concussive shockwave
      ctx.lineCap = 'round';
      // 1) sprite convulses (bloodrage peaks) then shreds along facing axis — gone by 0.4
      if (prog < 0.4) {
        const sp = prog / 0.4;
        // convulse: squash perpendicular, stretch along facing, rapid oscillation
        const osc = Math.sin(sp * Math.PI * 5) * (1 - sp);
        const sx = 1 + osc * 0.35 + sp * 0.5;   // stretch along facing peaks then tears
        const sy = 1 - osc * 0.25 - sp * 0.3;   // squash perpendicular
        ctx.save();
        ctx.globalAlpha = 1 - sp * sp;
        ctx.rotate(fc);
        ctx.scale(sx, sy);
        drawShape(ctx, f);
        ctx.restore();
      }
      // 2) concussive shockwave — one thick fast ring + 5 blunt radial bars (punch pressure wave)
      const wp = Math.min(1, prog / 0.45), wa = 1 - wp;
      const wr = 6 + wp * 58;
      ctx.lineWidth = (6 - wp * 4) * wa + 0.5;
      ctx.strokeStyle = `rgba(220,20,20,${(wa * 0.95).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(0, 0, wr, 0, Math.PI * 2); ctx.stroke();
      // blunt bars — thick, short relative to ring radius (shockwave bars, not spikes)
      ctx.lineWidth = (5 - wp * 3) * wa + 0.5;
      ctx.strokeStyle = `rgba(255,80,40,${(wa * 0.7).toFixed(3)})`;
      for (let i = 0; i < 5; i++) {
        const g = (i / 5) * Math.PI * 2 + Math.PI / 10;
        const r0 = wr * 0.55, r1 = wr * 0.88;
        ctx.beginPath(); ctx.moveTo(Math.cos(g) * r0, Math.sin(g) * r0); ctx.lineTo(Math.cos(g) * r1, Math.sin(g) * r1); ctx.stroke();
      }
      // 3) residue — 4 crimson smear marks at cardinal points, stretched along impact axis
      const ra = (a * 0.55);
      ctx.fillStyle = `rgba(160,0,0,${ra.toFixed(3)})`;
      for (let i = 0; i < 4; i++) {
        const g = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const rr = 18 + Math.min(1, prog / 0.4) * 20;
        ctx.save(); ctx.translate(Math.cos(g) * rr, Math.sin(g) * rr); ctx.rotate(g);
        ctx.fillRect(-8, -1.5, 16, 3); ctx.restore();
      }
      break;
    }
    case 'blink': {  // Jester — mask cracks down the centre: two halves split and spin apart
      ctx.lineCap = 'round';
      // 1) each half drawn independently — translate + rotate per half, no clipping (gone by 0.44)
      if (prog < 0.44) {
        const sp   = prog / 0.44;
        const hinge = sp * sp * FIGHTER_SIZE * 1.8;  // accelerating split
        const spin  = sp * Math.PI * 0.75;
        const m    = FIGHTER_SIZE * 0.9;
        const alp  = 1 - sp;
        // Red left half — slides left, spins CCW
        ctx.save();
        ctx.globalAlpha = alp;
        ctx.translate(-hinge, 0); ctx.rotate(-spin);
        ctx.fillStyle = '#ff2e2e';
        ctx.beginPath(); ctx.moveTo(0,-m); ctx.lineTo(-m,0); ctx.lineTo(0,m); ctx.closePath(); ctx.fill();
        ctx.fillStyle = f.color;
        ctx.fillRect(-FIGHTER_SIZE*0.5,-FIGHTER_SIZE*0.15,FIGHTER_SIZE*0.22,2.5);
        ctx.fillStyle = '#ff2e2e';
        ctx.beginPath(); ctx.moveTo(-FIGHTER_SIZE*0.32,-FIGHTER_SIZE*0.62); ctx.lineTo(-FIGHTER_SIZE*0.46,-FIGHTER_SIZE*1.08); ctx.lineTo(-FIGHTER_SIZE*0.12,-FIGHTER_SIZE*0.74); ctx.closePath(); ctx.fill();
        ctx.restore();
        // Blue right half — slides right, spins CW
        ctx.save();
        ctx.globalAlpha = alp;
        ctx.translate(hinge, 0); ctx.rotate(spin);
        ctx.fillStyle = '#2e9eff';
        ctx.beginPath(); ctx.moveTo(0,-m); ctx.lineTo(m,0); ctx.lineTo(0,m); ctx.closePath(); ctx.fill();
        ctx.fillStyle = f.color;
        ctx.fillRect(FIGHTER_SIZE*0.28,-FIGHTER_SIZE*0.15,FIGHTER_SIZE*0.22,2.5);
        ctx.fillStyle = '#2e9eff';
        ctx.beginPath(); ctx.moveTo(FIGHTER_SIZE*0.12,-FIGHTER_SIZE*0.74); ctx.lineTo(FIGHTER_SIZE*0.46,-FIGHTER_SIZE*1.08); ctx.lineTo(FIGHTER_SIZE*0.32,-FIGHTER_SIZE*0.62); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      // 2) crack flash — a bright vertical slash at x=0, fast (the moment of split)
      const cp = Math.min(1, prog / 0.22), ca = 1 - cp;
      ctx.strokeStyle = `rgba(240,220,180,${(ca * 0.95).toFixed(3)})`;
      ctx.lineWidth = (3 - cp * 2) * ca + 0.3;
      ctx.beginPath(); ctx.moveTo(0, -FIGHTER_SIZE); ctx.lineTo(0, FIGHTER_SIZE); ctx.stroke();
      // diamond motes — red left, blue right, flying off from the split
      const dp = Math.min(1, prog / 0.5), da = 1 - dp;
      for (let i = 0; i < 4; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const yOff = ((i >> 1) - 0.5) * 14;
        const xPos = side * (6 + dp * (12 + i * 5));
        const yPos = yOff * (1 + dp * 0.6);
        const sz = (2.5 - i * 0.3) * da;
        ctx.fillStyle = side < 0 ? `rgba(255,46,46,${da.toFixed(3)})` : `rgba(46,158,255,${da.toFixed(3)})`;
        ctx.save(); ctx.translate(xPos, yPos); ctx.rotate(Math.PI / 4);
        ctx.fillRect(-sz, -sz, sz * 2, sz * 2); ctx.restore();
      }
      // 3) residue — 3 red shards left, 3 blue shards right, slow fade
      for (let i = 0; i < 6; i++) {
        const side = i < 3 ? -1 : 1;
        const ii   = i % 3;
        const rr   = 12 + Math.min(1, prog / 0.4) * 14 + ii * 5;
        const g    = side < 0 ? (Math.PI * 0.6 + ii * 0.55) : (Math.PI * 2.4 - ii * 0.55);
        const sz   = (2 - ii * 0.3) * a * 0.7;
        ctx.fillStyle = side < 0 ? `rgba(255,46,46,${(a * 0.5).toFixed(3)})` : `rgba(46,158,255,${(a * 0.5).toFixed(3)})`;
        ctx.save(); ctx.translate(Math.cos(g) * rr, Math.sin(g) * rr); ctx.rotate(Math.PI / 4);
        ctx.fillRect(-sz, -sz, sz * 2, sz * 2); ctx.restore();
      }
      break;
    }
    case 'riposte': {  // Duelist — rapier snaps: final parry spin then blade segments fly along the axis
      ctx.lineCap = 'round';
      // 1) final parry — body makes one sharp spin (the last defensive reflex), then gone (by 0.32)
      if (prog < 0.32) {
        const sp = prog / 0.32;
        ctx.save();
        ctx.globalAlpha = 1 - sp;
        ctx.rotate(fc + sp * Math.PI * 1.6);  // fast full spin+
        drawShape(ctx, f);
        ctx.restore();
      }
      // 2) blade snap — 4 segments of the blade flying outward along the forward axis
      const bp = Math.min(1, prog / 0.5), ba = 1 - bp;
      ctx.strokeStyle = `rgba(192,192,232,${(ba * 0.9).toFixed(3)})`;
      ctx.lineWidth = (2.5 - bp) * ba + 0.4;
      const segLen = [14, 10, 8, 6];  // decreasing segment lengths (tip fragments smallest)
      for (let i = 0; i < 4; i++) {
        // segments fan out from the blade axis: alternating above/below the line
        const lateral = (i % 2 === 0 ? 1 : -1) * (1 + Math.floor(i / 2)) * bp * 12;
        const along = (i * 0.3 + bp * (8 + i * 6));
        const px = Math.cos(fc) * along - Math.sin(fc) * lateral;
        const py = Math.sin(fc) * along + Math.cos(fc) * lateral;
        const ex = px + Math.cos(fc + (i % 2 === 0 ? 0.3 : -0.3)) * segLen[i];
        const ey = py + Math.sin(fc + (i % 2 === 0 ? 0.3 : -0.3)) * segLen[i];
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ex, ey); ctx.stroke();
      }
      // cup guard — breaks off and tumbles separately (a small arc, accent color)
      const gp = Math.min(1, prog / 0.55), ga = 1 - gp;
      const gx = Math.cos(fc + Math.PI) * (4 + gp * 18), gy = Math.sin(fc + Math.PI) * (4 + gp * 18);
      ctx.strokeStyle = `rgba(192,192,232,${(ga * 0.7).toFixed(3)})`;
      ctx.lineWidth = 2 * ga + 0.3;
      ctx.beginPath(); ctx.arc(gx, gy, 5 + gp * 3, -Math.PI * 0.8, Math.PI * 0.8); ctx.stroke();
      // 3) residue — 3 thin silver blade-shard lines along the forward axis, slowly fading
      ctx.strokeStyle = `rgba(160,160,200,${(a * 0.55).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const off = (i - 1) * 6;
        const base = 16 + i * 8;
        const px = Math.cos(fc) * base + Math.sin(fc) * off, py = Math.sin(fc) * base - Math.cos(fc) * off;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(fc) * 8, py + Math.sin(fc) * 8); ctx.stroke();
      }
      break;
    }
    case 'sword': {  // Knight — kite shield shatters: fractures along the cross into four quadrant shards
      ctx.lineCap = 'round';
      // 1) shield reels backward then tumbles — heavy plate, slow start then fast spin (gone by 0.42)
      if (prog < 0.42) {
        const sp = prog / 0.42;
        const tumble = sp * sp * Math.PI * 1.4;   // slow then fast (quadratic — heavy object)
        ctx.save();
        ctx.globalAlpha = 1 - sp * sp;
        ctx.rotate(fc + tumble);
        ctx.scale(1 - sp * 0.2, 1 - sp * 0.2);
        drawShape(ctx, f);
        ctx.restore();
      }
      // 2a) cross fracture — thick silver cracks erupting from center along shield axes
      const fp = Math.min(1, prog / 0.38), fa = 1 - fp;
      ctx.lineWidth = (4 - fp * 2.5) * fa + 0.4;
      ctx.strokeStyle = `rgba(220,220,220,${(fa * 0.9).toFixed(3)})`;
      for (let i = 0; i < 4; i++) {
        const g = fc + (i / 4) * Math.PI * 2;    // four cardinal axes of the cross
        const r0 = 3, r1 = 3 + fp * 32;
        ctx.beginPath(); ctx.moveTo(Math.cos(g) * r0, Math.sin(g) * r0); ctx.lineTo(Math.cos(g) * r1, Math.sin(g) * r1); ctx.stroke();
      }
      // 2b) blue cross shatters — accent burst at the boss/rivet point
      const bp = Math.min(1, prog / 0.28), ba = 1 - bp;
      ctx.strokeStyle = `rgba(46,158,255,${(ba * 0.85).toFixed(3)})`;
      ctx.lineWidth = (3 - bp * 2) * ba + 0.3;
      for (let i = 0; i < 8; i++) {
        const g = fc + (i / 8) * Math.PI * 2 + Math.PI / 8;
        ctx.beginPath(); ctx.moveTo(Math.cos(g) * 2, Math.sin(g) * 2); ctx.lineTo(Math.cos(g) * (4 + bp * 14), Math.sin(g) * (4 + bp * 14)); ctx.stroke();
      }
      // 3) residue — four silver kite-quadrant shards at cardinal positions, slowly fading
      const ra = a * 0.7;
      ctx.fillStyle = `rgba(192,192,192,${ra.toFixed(3)})`;
      for (let i = 0; i < 4; i++) {
        const g = fc + (i / 4) * Math.PI * 2 + Math.PI / 4;
        const rr = 12 + Math.min(1, prog / 0.4) * 20;
        ctx.save(); ctx.translate(Math.cos(g) * rr, Math.sin(g) * rr); ctx.rotate(g);
        // parallelogram shard — tapers to a point, reads as a shield fragment
        ctx.beginPath(); ctx.moveTo(-4, -7); ctx.lineTo(4, -7); ctx.lineTo(2, 7); ctx.lineTo(-2, 7); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      // blue rivet fragment — the boss sits near center, fading last
      ctx.fillStyle = `rgba(46,158,255,${(a * 0.5).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(0, 0, 3 * a + 0.5, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'mine': {  // Sapper — bomb swells then detonates: dark casing breach + red shrapnel, not flame
      ctx.lineCap = 'round';
      // 1) bomb body swells — pressure building from within, then gone (by 0.28)
      if (prog < 0.28) {
        const sp = prog / 0.28;
        const swell = 1 + sp * 0.55;
        ctx.save();
        ctx.globalAlpha = sp < 0.75 ? 1 : 1 - (sp - 0.75) / 0.25;
        ctx.scale(swell, swell);
        drawShape(ctx, f);
        ctx.restore();
      }
      // 2a) casing breach — near-black ring (the bomb shell splitting), fast and tight
      const rp = Math.min(1, prog / 0.3), ra2 = 1 - rp;
      ctx.strokeStyle = `rgba(30,20,20,${(ra2 * 0.9).toFixed(3)})`;
      ctx.lineWidth = (5 - rp * 3) * ra2 + 0.5;
      ctx.beginPath(); ctx.arc(0, 0, 4 + rp * 28, 0, Math.PI * 2); ctx.stroke();
      // 2b) shrapnel — 8 red casing fragments flying outward
      const sp2 = Math.min(1, prog / 0.55), sa = 1 - sp2;
      ctx.strokeStyle = `rgba(220,30,30,${(sa * 0.85).toFixed(3)})`;
      for (let i = 0; i < 8; i++) {
        const g = (i / 8) * Math.PI * 2 + i * 0.4;
        const r0 = 6 + sp2 * 10, r1 = r0 + 8 + sp2 * (18 + (i % 3) * 6);
        ctx.lineWidth = (2.5 - i * 0.15) * sa + 0.3;
        ctx.beginPath(); ctx.moveTo(Math.cos(g) * r0, Math.sin(g) * r0); ctx.lineTo(Math.cos(g) * r1, Math.sin(g) * r1); ctx.stroke();
      }
      // 3) residue — dark casing shards: angular polygons at radial positions + fuse scrap
      const shardA = (a * 0.65);
      ctx.fillStyle = `rgba(40,24,24,${shardA.toFixed(3)})`;
      for (let i = 0; i < 5; i++) {
        const g = (i / 5) * Math.PI * 2 + 0.3;
        const rr = 14 + Math.min(1, prog / 0.35) * 18 + (i % 2) * 5;
        ctx.save(); ctx.translate(Math.cos(g) * rr, Math.sin(g) * rr); ctx.rotate(g);
        // angular shard — asymmetric triangle reads as broken metal, not a stave
        ctx.beginPath(); ctx.moveTo(-4, -3); ctx.lineTo(4, -1); ctx.lineTo(2, 4); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      // fuse scrap — the collar and a short grey curl near top
      ctx.strokeStyle = `rgba(160,160,160,${(a * 0.5).toFixed(3)})`;
      ctx.lineWidth = 1.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(2, -8); ctx.quadraticCurveTo(8, -14, 4, -20); ctx.stroke();
      break;
    }
    case 'cannon': {  // Cannoneer — catastrophic overload: rig pitches, muzzle blast + structural cracks
      ctx.lineCap = 'round';
      // 1) sprite pitches forward on the wheel — barrel swings up and over as recoil finally wins
      if (prog < 0.38) {
        const sp = prog / 0.38;
        ctx.save();
        ctx.globalAlpha = 1 - sp * sp * sp;
        ctx.rotate(fc);
        ctx.rotate(sp * Math.PI * 0.9);     // barrel pitches forward ~162°
        ctx.scale(1, 1 - sp * 0.3);         // squash slightly as it tumbles
        drawShape(ctx, f);
        ctx.restore();
      }
      // 2a) muzzle blast — directional, forward-heavy, orange-white cone at barrel end
      const mp = Math.min(1, prog / 0.35), ma = 1 - mp;
      const muzzleX = Math.cos(fc) * 22, muzzleY = Math.sin(fc) * 22;
      ctx.save(); ctx.translate(muzzleX, muzzleY);
      for (let i = 0; i < 6; i++) {
        const spread = (i / 6 - 0.5) * 1.1;          // cone ±55° around barrel axis
        const g = fc + spread;
        const r = 6 + mp * (28 + i * 3);
        ctx.strokeStyle = i < 2
          ? `rgba(255,240,180,${(ma * 0.9).toFixed(3)})`  // white-hot center rays
          : `rgba(255,140,26,${(ma * 0.7).toFixed(3)})`; // orange outer cone
        ctx.lineWidth = (4 - i * 0.4) * ma + 0.4;
        ctx.beginPath(); ctx.moveTo(Math.cos(g) * 3, Math.sin(g) * 3); ctx.lineTo(Math.cos(g) * r, Math.sin(g) * r); ctx.stroke();
      }
      ctx.restore();
      // 2b) structural fracture — 4 cracks radiating from breech (rear half), iron-gray
      const cp = Math.min(1, prog / 0.5), ca = 1 - cp;
      ctx.strokeStyle = `rgba(100,100,100,${(ca * 0.85).toFixed(3)})`;
      ctx.lineWidth = 2 * ca + 0.4;
      for (let i = 0; i < 4; i++) {
        const g = fc + Math.PI + (i / 4 - 0.5) * Math.PI * 0.9;  // rear half spread
        const r0 = 4, r1 = 4 + cp * 22;
        ctx.beginPath(); ctx.moveTo(Math.cos(g) * r0, Math.sin(g) * r0); ctx.lineTo(Math.cos(g) * r1, Math.sin(g) * r1); ctx.stroke();
      }
      // 3) residue — wheel arc fragment + 2 barrel ring arcs, flat mechanical debris
      const ra = a * 0.6;
      ctx.strokeStyle = `rgba(74,74,74,${ra.toFixed(3)})`;
      ctx.lineWidth = 2.5;
      // wheel arc fragment rolling out below-left
      const wx = -16 - Math.min(1, prog / 0.5) * 10, wy = 14 + Math.min(1, prog / 0.5) * 8;
      ctx.beginPath(); ctx.arc(wx, wy, 8, Math.PI * 0.4, Math.PI * 1.3); ctx.stroke();
      // barrel band rings — two arcs at scatter positions
      ctx.strokeStyle = `rgba(255,140,26,${(ra * 0.7).toFixed(3)})`;
      ctx.lineWidth = 2;
      const b1x = Math.cos(fc + 0.6) * (14 + Math.min(1, prog / 0.5) * 16);
      const b1y = Math.sin(fc + 0.6) * (14 + Math.min(1, prog / 0.5) * 16);
      ctx.beginPath(); ctx.arc(b1x, b1y, 5, 0, Math.PI * 1.4); ctx.stroke();
      const b2x = Math.cos(fc - 0.8) * (10 + Math.min(1, prog / 0.5) * 12);
      const b2y = Math.sin(fc - 0.8) * (10 + Math.min(1, prog / 0.5) * 12);
      ctx.beginPath(); ctx.arc(b2x, b2y, 3.5, 0, Math.PI); ctx.stroke();
      break;
    }
    case 'arrow': {  // Archer — bow snaps, arrows scatter in all directions (quiver spills)
      ctx.lineCap = 'round';
      // 1) bow springs outward — bent wood releasing tension, then fades (gone by 0.38)
      if (prog < 0.38) {
        const sp = prog / 0.38;
        const spring = 1 + Math.sin(sp * Math.PI) * 0.35;   // pop out then settle
        ctx.save();
        ctx.globalAlpha = 1 - sp;
        ctx.scale(spring, spring);
        drawShape(ctx, f);
        ctx.restore();
      }
      // 2a) bowstring snap — cream flash along the string path, very fast
      const ssp = Math.min(1, prog / 0.18), ssa = 1 - ssp;
      if (ssa > 0) {
        ctx.strokeStyle = `rgba(224,208,160,${(ssa * 0.9).toFixed(3)})`;
        ctx.lineWidth = (2.5 - ssp) * ssa + 0.3;
        const topX = Math.cos(-Math.PI*0.45)*FIGHTER_SIZE*0.85, topY = Math.sin(-Math.PI*0.45)*FIGHTER_SIZE*0.85;
        const botX = Math.cos( Math.PI*0.45)*FIGHTER_SIZE*0.85, botY = Math.sin( Math.PI*0.45)*FIGHTER_SIZE*0.85;
        ctx.save(); ctx.rotate(fc);
        ctx.beginPath(); ctx.moveTo(topX,topY); ctx.lineTo(-FIGHTER_SIZE*0.6,0); ctx.lineTo(botX,botY); ctx.stroke();
        ctx.restore();
      }
      // 2b) arrows scatter — 6 arrow silhouettes flying outward at varied angles
      const asp = Math.min(1, prog / 0.6), asa = 1 - asp;
      ctx.strokeStyle = `rgba(90,74,42,${(asa * 0.85).toFixed(3)})`;
      for (let i = 0; i < 6; i++) {
        const g    = fc + (i / 6) * Math.PI * 2 + i * 0.4;  // spread 360°
        const dist = 8 + asp * (16 + i * 5);
        const shaftLen = 14 + (i % 3) * 2;
        const tipX = Math.cos(g) * (dist + shaftLen), tipY = Math.sin(g) * (dist + shaftLen);
        const nockX = Math.cos(g) * dist,              nockY = Math.sin(g) * dist;
        ctx.lineWidth = (1.8 - i * 0.1) * asa + 0.3;
        ctx.beginPath(); ctx.moveTo(nockX, nockY); ctx.lineTo(tipX, tipY); ctx.stroke();
        // fletching — two small angled lines at nock end
        const perp = g + Math.PI / 2;
        ctx.lineWidth = 1 * asa + 0.2;
        ctx.beginPath(); ctx.moveTo(nockX, nockY); ctx.lineTo(nockX + Math.cos(perp)*3 + Math.cos(g+Math.PI)*4, nockY + Math.sin(perp)*3 + Math.sin(g+Math.PI)*4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(nockX, nockY); ctx.lineTo(nockX - Math.cos(perp)*3 + Math.cos(g+Math.PI)*4, nockY - Math.sin(perp)*3 + Math.sin(g+Math.PI)*4); ctx.stroke();
      }
      // 3) residue — 4 arrows lying flat at scattered positions + green bow-arc fragment
      const ra = a * 0.6;
      ctx.strokeStyle = `rgba(70,60,32,${ra.toFixed(3)})`;
      ctx.lineWidth = 1.5;
      const restArrows = [[14,6,0.4],[-8,16,-0.3],[20,-4,0.8],[-16,8,-0.6]];
      restArrows.forEach(([rx, ry, rg]) => {
        ctx.save(); ctx.translate(rx, ry); ctx.rotate(rg);
        ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(-11,-2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(-11, 2); ctx.stroke();
        ctx.restore();
      });
      ctx.strokeStyle = `rgba(61,255,138,${(ra * 0.45).toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(10, 10, FIGHTER_SIZE * 0.6, fc - 0.8, fc + 0.8); ctx.stroke();
      break;
    }
    case 'iai': {  // Ronin — one final deliberate swing, single clean gold slash, blade comes to rest
      ctx.lineCap = 'round';
      // 1) final overhead swing — slow, deliberate arc (not a chaotic tumble); (gone by 0.46)
      if (prog < 0.46) {
        const sp = prog / 0.46;
        const eIn = sp * sp;  // ease-in: starts slow, finishes with conviction
        ctx.save();
        ctx.globalAlpha = 1 - sp;
        ctx.rotate(fc + eIn * Math.PI * 0.85);  // overhead arc ~153°, disciplined
        drawShape(ctx, f);
        ctx.restore();
      }
      // 2) the cut — a single gold bisecting slash, drawn fast then held and faded
      // Slash appears early (prog 0→0.12) and fades slowly (the mark of the strike)
      const cp = Math.min(1, prog / 0.12);        // draw-in speed
      const ca = Math.max(0, 1 - (prog - 0.08) / 0.55); // hold then fade
      if (ca > 0) {
        const slashLen = FIGHTER_SIZE * 2.2;
        const perpX = Math.sin(fc), perpY = -Math.cos(fc);  // perpendicular to facing
        // slash cuts ACROSS the body, perpendicular to the blade's forward direction
        const sx = -perpX * slashLen * cp, sy = -perpY * slashLen * cp;
        const ex =  perpX * slashLen,      ey =  perpY * slashLen;
        ctx.strokeStyle = `rgba(232,192,32,${(ca * 0.9).toFixed(3)})`;
        ctx.lineWidth = (3 - prog * 2) * ca + 0.4;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
        // thin afterglow — the brightness of a clean edge
        ctx.strokeStyle = `rgba(255,240,180,${(ca * 0.4).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      }
      // 3) residue — blade lying at rest angle, gold tip last to fade
      const bladeFc = fc + Math.PI * 0.85;  // final resting angle after the swing
      ctx.strokeStyle = `rgba(228,236,244,${(a * 0.55).toFixed(3)})`;
      ctx.lineWidth = 2.5 * a + 0.3;
      const blen = FIGHTER_SIZE * 1.35;
      ctx.beginPath();
      ctx.moveTo(Math.cos(bladeFc + Math.PI) * FIGHTER_SIZE * 0.4, Math.sin(bladeFc + Math.PI) * FIGHTER_SIZE * 0.4);
      ctx.lineTo(Math.cos(bladeFc) * blen, Math.sin(bladeFc) * blen);
      ctx.stroke();
      // gold tip glints last
      ctx.fillStyle = `rgba(232,192,32,${(a * 0.7).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(Math.cos(bladeFc)*blen, Math.sin(bladeFc)*blen, 2.5*a+0.3, 0, Math.PI*2); ctx.fill();
      break;
    }
    case 'sweep': {  // Reaper — rotor decelerates and sinks, blood pool spreads beneath
      ctx.lineCap = 'round';
      // 1) rotor decelerates (ease-out) and sinks — power leaving the blade (gone by 0.44)
      if (prog < 0.44) {
        const sp  = prog / 0.44;
        const eOut = 1 - (1 - sp) * (1 - sp);     // quadratic ease-out: fast then slows
        ctx.save();
        ctx.globalAlpha = 1 - sp;
        ctx.translate(0, sp * sp * 18);            // sinks as it slows
        ctx.rotate(eOut * Math.PI * 3.5);          // ~1¾ rotations, decelerating
        drawShape(ctx, f);
        ctx.restore();
      }
      // 2) blood spray — 5 dark-red arcs flung centrifugally at death moment
      const sp2 = Math.min(1, prog / 0.45), sa = 1 - sp2;
      ctx.strokeStyle = `rgba(160,0,0,${(sa * 0.8).toFixed(3)})`;
      ctx.lineWidth = (3 - sp2 * 2) * sa + 0.4;
      for (let i = 0; i < 5; i++) {
        const g = (i / 5) * Math.PI * 2 + i * 0.6;
        const r = 8 + sp2 * (20 + i * 6);
        // arc — follows the curve of the spinning blade (the crescent, his force-shape)
        ctx.beginPath(); ctx.arc(Math.cos(g)*r, Math.sin(g)*r, r * 0.35, g - 0.7, g + 0.7); ctx.stroke();
      }
      // 3) blood pool — grows outward from nothing, fades as it spreads
      const poolR = 6 + prog * 32;
      const poolA = a * 0.65;
      ctx.fillStyle = `rgba(90,0,0,${poolA.toFixed(3)})`;
      ctx.beginPath(); ctx.ellipse(0, 8, poolR, poolR * 0.45, 0, 0, Math.PI * 2); ctx.fill();
      // pool rim — slightly brighter edge so the pool reads against dark arena floor
      ctx.strokeStyle = `rgba(140,0,0,${(poolA * 0.6).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(0, 8, poolR, poolR * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case 'raise': {  // Necromancer — skull rattles then collapses: bone burst + eye-glow wisps escape
      const s = FIGHTER_SIZE;
      ctx.lineCap = 'round';
      // 1) skull rattles (jitter) then falls forward and sinks (gone by 0.44)
      if (prog < 0.44) {
        const sp = prog / 0.44;
        const rattle = sp < 0.35 ? Math.sin(sp * Math.PI * 14) * (1 - sp / 0.35) * 5 : 0;
        ctx.save();
        ctx.globalAlpha = 1 - sp;
        ctx.translate(rattle, sp * sp * 20);   // jitter then falls
        ctx.rotate(sp * 0.5);                  // tips forward
        drawShape(ctx, f);
        ctx.restore();
      }
      // 2a) bone burst — pale cranium fragments radiating outward
      const bp = Math.min(1, prog / 0.5), ba = 1 - bp;
      ctx.strokeStyle = `rgba(232,224,208,${(ba * 0.85).toFixed(3)})`;
      ctx.lineWidth = (2.5 - bp) * ba + 0.4;
      for (let i = 0; i < 8; i++) {
        const g = (i / 8) * Math.PI * 2 + i * 0.3;
        const r0 = 4 + bp * 8, r1 = r0 + 6 + bp * (14 + (i % 3) * 4);
        ctx.beginPath(); ctx.moveTo(Math.cos(g)*r0, Math.sin(g)*r0); ctx.lineTo(Math.cos(g)*r1, Math.sin(g)*r1); ctx.stroke();
      }
      // 2b) eye-glow wisps — purple escape from the two eye-socket positions as the skull cracks
      const ep = Math.min(1, prog / 0.6), ea = 1 - ep;
      const eyes = [{x: -s*0.22, y: -s*0.14}, {x: s*0.22, y: -s*0.14}];
      eyes.forEach(eye => {
        ctx.fillStyle = `rgba(199,125,255,${(ea * 0.7).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(eye.x, eye.y - ep * 16, (3 - ep * 2) * ea + 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(157,78,221,${(ea * 0.45).toFixed(3)})`;
        ctx.lineWidth = 1.2 * ea;
        ctx.beginPath(); ctx.moveTo(eye.x, eye.y); ctx.lineTo(eye.x + (eye.x > 0 ? 4 : -4), eye.y - ep * 22); ctx.stroke();
      });
      // 3) residue — bone pile: 6 small pale rectangles at base, scattered loosely
      ctx.fillStyle = `rgba(200,190,168,${(a * 0.6).toFixed(3)})`;
      const bones = [[-10,8,14,3,0.3],[5,12,10,3,-0.5],[-4,16,8,2.5,0.8],[12,10,6,2.5,-0.2],[-14,14,8,3,-0.9],[2,20,12,2,0.4]];
      bones.forEach(([bx,by,bw,bh,br]) => {
        ctx.save(); ctx.translate(bx,by); ctx.rotate(br); ctx.fillRect(-bw/2,-bh/2,bw,bh); ctx.restore();
      });
      // faint purple glow where the eyes were
      ctx.fillStyle = `rgba(120,40,180,${(a * 0.2).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(0, -s*0.14, 8 * a + 2, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'drain': {  // Warlock — void consumes itself: eye flares then snaps shut, cowl implodes
      ctx.lineCap = 'round';
      const eyeX = Math.cos(fc) * FIGHTER_SIZE * 0.42, eyeY = Math.sin(fc) * FIGHTER_SIZE * 0.42;
      // 1) cowl implodes toward the eye — pulled into the void (gone by 0.45)
      if (prog < 0.45) {
        const sp = prog / 0.45;
        ctx.save();
        ctx.globalAlpha = 1 - sp;
        ctx.translate(eyeX * sp * 0.5, eyeY * sp * 0.5);  // drifts toward eye
        ctx.scale(1 - sp * 0.8, 1 - sp * 0.8);
        drawShape(ctx, f);
        ctx.restore();
      }
      // 2a) void eye flare-then-snap: expands briefly, then contracts and vanishes
      const vp = prog / 0.5;
      const vPhase = vp < 0.3 ? vp / 0.3 : 1 - (vp - 0.3) / 0.7;  // 0→1 fast, 1→0 slow
      const vAlpha = Math.max(0, vPhase);
      if (vAlpha > 0) {
        const vr = 2 + vPhase * 22;
        ctx.fillStyle = `rgba(192,80,255,${(vAlpha * 0.7).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(eyeX, eyeY, vr, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,${(vAlpha * 0.5).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(eyeX, eyeY, vr * 0.35, 0, Math.PI * 2); ctx.fill();
      }
      // 2b) tendrils retract inward — 3 purple arcs shrinking back toward the cowl (inverse of drain reach)
      const tp = Math.min(1, prog / 0.4), ta = 1 - tp;
      ctx.strokeStyle = `rgba(192,80,255,${(ta * 0.65).toFixed(3)})`;
      ctx.lineWidth = (2 - tp) * ta + 0.3;
      for (let i = 0; i < 3; i++) {
        const g = Math.PI * 0.9 + i * 0.42;
        const bx = Math.cos(g) * FIGHTER_SIZE * 0.7 * (1 - tp);
        const by = Math.sin(g) * FIGHTER_SIZE * 0.7 * (1 - tp);
        ctx.beginPath(); ctx.arc(bx, by, FIGHTER_SIZE * 0.3 * (1 - tp), g - 0.4, g + 1.0); ctx.stroke();
      }
      // 3) residue — dark void stain at the eye's last position; darker than everything else
      ctx.fillStyle = `rgba(10,0,16,${(a * 0.55).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(eyeX, eyeY, (6 + a * 4) * a + 1, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(130,40,180,${(a * 0.3).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(eyeX, eyeY, (10 + a * 6) * a + 1, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case 'hex': {  // Witch — hat melts downward, toxic hex cloud spreads at the base
      ctx.lineCap = 'round';
      // 1) hat droops and sinks — tip extends back-down, body squashes, fades (gone by 0.48)
      if (prog < 0.48) {
        const sp = prog / 0.48;
        ctx.save();
        ctx.globalAlpha = 1 - sp * sp;
        ctx.translate(0, sp * 16);          // sinks down
        ctx.transform(1, 0, -sp * 0.3, 1 - sp * 0.25, 0, 0);  // tip droops further back, body flattens
        drawShape(ctx, f);
        ctx.restore();
      }
      // 2a) hex cloud — neon-green ring expanding from the brim (the curse dispersing outward)
      const hp = Math.min(1, prog / 0.55), ha = 1 - hp;
      ctx.strokeStyle = `rgba(125,255,61,${(ha * 0.75).toFixed(3)})`;
      ctx.lineWidth = (3 - hp * 2) * ha + 0.3;
      ctx.beginPath(); ctx.arc(0, 0, 6 + hp * 38, 0, Math.PI * 2); ctx.stroke();
      // 2b) hex motes — 6 small curse-mark dots scattering from the ring as it expands
      const mp = Math.min(1, prog / 0.6), ma = 1 - mp;
      ctx.fillStyle = `rgba(80,220,30,${(ma * 0.7).toFixed(3)})`;
      for (let i = 0; i < 6; i++) {
        const g = (i / 6) * Math.PI * 2 + i * 0.5;
        const r = 8 + mp * (22 + (i % 3) * 6);
        ctx.beginPath(); ctx.arc(Math.cos(g) * r, Math.sin(g) * r, (2.5 - mp * 1.5) * ma + 0.3, 0, Math.PI * 2); ctx.fill();
      }
      // 3) residue — neon-green toxic puddle at base + faint brim line lying flat
      ctx.fillStyle = `rgba(100,210,40,${(a * 0.22).toFixed(3)})`;
      ctx.beginPath(); ctx.ellipse(0, 8, 18 * a + 4, 6 * a + 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(45,74,42,${(a * 0.45).toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-FIGHTER_SIZE * 0.9, 10 + a * 4); ctx.lineTo(FIGHTER_SIZE * 0.9, 10 + a * 4); ctx.stroke();
      break;
    }
    case 'cast': {  // Wizard — arcane collapse: orbs wink out, book flickers then implodes
      ctx.lineCap = 'round';
      // 1) book flickers like a guttering flame then implodes (scale to zero) — gone by 0.48
      if (prog < 0.48) {
        const sp = prog / 0.48;
        const flicker = 1 - Math.abs(Math.sin(sp * Math.PI * 7)) * 0.35 * (1 - sp);
        ctx.save();
        ctx.globalAlpha = (1 - sp * sp) * flicker;
        const s2 = 1 - sp * 0.7;
        ctx.scale(s2, s2);
        drawShape(ctx, f);
        ctx.restore();
      }
      // 2a) 4 mana orbs wink out — each orb pops and collapses with a staggered offset
      for (let i = 0; i < 4; i++) {
        const g    = (i / 4) * Math.PI * 2;
        const delay = i * 0.12;
        const op   = Math.max(0, Math.min(1, (prog - delay) / 0.3));
        if (op <= 0) continue;
        const oa   = op < 0.5 ? op * 2 : 2 - op * 2;   // pop in, collapse out
        const r    = FIGHTER_SIZE * 0.55;
        const ox   = Math.cos(g) * r, oy = Math.sin(g) * r;
        const sz   = (3 + op * (op < 0.5 ? 4 : -3)) * oa;
        ctx.fillStyle = `rgba(157,78,221,${(oa * 0.85).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(ox, oy, Math.max(0.3, sz), 0, Math.PI * 2); ctx.fill();
        // brief gold spark at each pop peak
        if (op > 0.4 && op < 0.6) {
          const spark = 1 - Math.abs(op - 0.5) * 10;
          ctx.fillStyle = `rgba(255,232,61,${(spark * 0.7).toFixed(3)})`;
          ctx.beginPath(); ctx.arc(ox, oy, 2 * spark, 0, Math.PI * 2); ctx.fill();
        }
      }
      // 2b) arcane implosion flash — gold burst at the book center as the last sigil releases
      const ip = Math.min(1, prog / 0.22), ia = 1 - ip;
      ctx.strokeStyle = `rgba(200,100,255,${(ia * 0.85).toFixed(3)})`;
      ctx.lineWidth = (3 - ip * 2) * ia + 0.3;
      ctx.beginPath(); ctx.arc(0, 0, 4 + ip * 20, 0, Math.PI * 2); ctx.stroke();
      // 3) residue — faint hexagram sigil at origin (the arcane mark, slowly dimming)
      ctx.strokeStyle = `rgba(120,50,180,${(a * 0.35).toFixed(3)})`;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 6; i++) {
        const g1 = (i / 6) * Math.PI * 2, g2 = g1 + Math.PI * 2 / 3;
        const r2 = 12 * a + 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(g1)*r2, Math.sin(g1)*r2);
        ctx.lineTo(Math.cos(g2)*r2, Math.sin(g2)*r2); ctx.stroke();
      }
      break;
    }
    case 'lightning': {  // Priest — divine light departs: orb expands and fades, golden motes rise
      ctx.lineCap = 'round';
      const orbX = Math.cos(fc) * FIGHTER_SIZE * 0.75, orbY = Math.sin(fc) * FIGHTER_SIZE * 0.75;
      // 1) body rises and dissolves — peaceful ascent, slower than violent deaths (gone by 0.55)
      if (prog < 0.55) {
        const sp = prog / 0.55;
        ctx.save();
        ctx.globalAlpha = 1 - sp * sp;
        ctx.translate(0, -sp * 18);   // rises upward
        drawShape(ctx, f);
        ctx.restore();
      }
      // 2a) orb expands into a gold ring — the divine power releasing outward
      const op = Math.min(1, prog / 0.5), oa = 1 - op;
      ctx.strokeStyle = `rgba(255,232,61,${(oa * 0.9).toFixed(3)})`;
      ctx.lineWidth = (4 - op * 3) * oa + 0.3;
      ctx.beginPath(); ctx.arc(orbX, orbY, FIGHTER_SIZE * 0.3 + op * 28, 0, Math.PI * 2); ctx.stroke();
      // soft white radiance at crossguard — the holy light spreading
      const rp = Math.min(1, prog / 0.35), ra = 1 - rp;
      ctx.strokeStyle = `rgba(255,255,255,${(ra * 0.5).toFixed(3)})`;
      ctx.lineWidth = (3 - rp * 2) * ra + 0.3;
      const cxX = Math.cos(fc) * FIGHTER_SIZE * 0.3, cxY = Math.sin(fc) * FIGHTER_SIZE * 0.3;
      ctx.beginPath(); ctx.moveTo(cxX + Math.sin(fc)*(-8-rp*10), cxY - Math.cos(fc)*(-8-rp*10));
      ctx.lineTo(cxX - Math.sin(fc)*(-8-rp*10), cxY + Math.cos(fc)*(-8-rp*10)); ctx.stroke();
      // 2b) golden motes rising — deterministic, each keyed on index for position variety
      const mp = Math.min(1, prog / 0.7);
      for (let i = 0; i < 7; i++) {
        const phase = (i / 7);                          // 0..1 stagger across the window
        const mt = Math.max(0, Math.min(1, (mp - phase * 0.3) / 0.7));
        if (mt <= 0) continue;
        const xOff = (i - 3) * 6 + Math.sin(i * 1.7) * 4;
        const yOff = -(mt * (20 + i * 4));              // rises upward (negative y)
        const mAlpha = mt < 0.5 ? mt * 2 : 2 - mt * 2; // fade in then out
        ctx.fillStyle = `rgba(255,220,60,${(mAlpha * 0.8).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(orbX + xOff, orbY + yOff, 2.5 - mt * 1.5, 0, Math.PI * 2); ctx.fill();
      }
      // 3) residue — a faint warm glow pooled at the orb's last position, fading slowly
      ctx.fillStyle = `rgba(255,200,40,${(a * 0.25).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(orbX, orbY, 8 + a * 6, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'wildcard': {  // Gambler — die tumbles its last then shatters: corner shards + pip residue
      ctx.lineCap = 'round';
      // 1) wild tumble — uncontrolled spin accelerating off the table edge (gone by 0.35)
      if (prog < 0.35) {
        const sp = prog / 0.35;
        ctx.save();
        ctx.globalAlpha = 1 - sp;
        ctx.rotate(sp * sp * Math.PI * 2.2);   // accelerates (sp² = slow then fast)
        ctx.scale(1 - sp * 0.25, 1 - sp * 0.25);
        drawShape(ctx, f);
        ctx.restore();
      }
      // 2a) gold leading-edge flash — the face that cracked first
      const gp = Math.min(1, prog / 0.25), ga = 1 - gp;
      const s = FIGHTER_SIZE * 0.82;
      ctx.strokeStyle = `rgba(255,210,61,${(ga * 0.95).toFixed(3)})`;
      ctx.lineWidth = (4 - gp * 3) * ga + 0.4;
      ctx.beginPath(); ctx.moveTo(s*0.6, -s); ctx.lineTo(s, s*0.7); ctx.stroke();
      // 2b) corner shards — 4 cream fragments from the die's vertices
      const cp = Math.min(1, prog / 0.5), ca = 1 - cp;
      const corners = [{x:-s,y:-s*0.7},{x:s*0.6,y:-s},{x:s,y:s*0.7},{x:-s*0.6,y:s}];
      ctx.fillStyle = `rgba(245,240,224,${(ca * 0.85).toFixed(3)})`;
      corners.forEach((c2, i) => {
        const fly = 1 + cp * (0.6 + i * 0.15);
        ctx.save(); ctx.translate(c2.x * fly, c2.y * fly); ctx.rotate(cp * Math.PI * (i % 2 === 0 ? 0.8 : -0.6));
        ctx.beginPath(); ctx.moveTo(-3,-2); ctx.lineTo(3,-2); ctx.lineTo(0,4); ctx.closePath(); ctx.fill();
        ctx.restore();
      });
      // 3) residue — 5 pip dots in a loose 5-face layout, slowly fading (the luck, scattered)
      ctx.fillStyle = `rgba(200,190,160,${(a * 0.6).toFixed(3)})`;
      const pipPos = [[-12,-8],[12,-8],[0,0],[-12,8],[12,8]];
      pipPos.forEach(([px,py]) => {
        ctx.beginPath(); ctx.arc(px, py, 2.5 * a + 0.3, 0, Math.PI * 2); ctx.fill();
      });
      // lone gold pip — the winning face pip that didn't save him
      ctx.fillStyle = `rgba(255,210,61,${(a * 0.4).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(0, 0, 2 * a + 0.3, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'grapple': {  // Hunter — steel hook snaps: whips back, fractures at the bend, barb flies forward
      ctx.lineCap = 'round';
      // 1) hook whips backward — fast spin as if the line snapped (gone by 0.36)
      if (prog < 0.36) {
        const sp = prog / 0.36;
        ctx.save();
        ctx.globalAlpha = 1 - sp;
        ctx.rotate(fc - sp * Math.PI * 1.8);   // whips back ~324°
        drawShape(ctx, f);
        ctx.restore();
      }
      // 2a) fracture flash — bright silver arc at the bend point (where a curved hook breaks)
      const fp = Math.min(1, prog / 0.28), fa = 1 - fp;
      const bendX = Math.cos(fc) * 8, bendY = Math.sin(fc) * 8;
      ctx.strokeStyle = `rgba(220,224,232,${(fa * 0.95).toFixed(3)})`;
      ctx.lineWidth = (4 - fp * 3) * fa + 0.4;
      // arc sweep at the bend — follows the curve of the hook geometry
      ctx.beginPath(); ctx.arc(bendX, bendY, 6 + fp * 10, fc - Math.PI * 0.6, fc + Math.PI * 0.4); ctx.stroke();
      // 2b) steel shards — 4 fragments flying outward from the fracture point
      const sp2 = Math.min(1, prog / 0.5), sa = 1 - sp2;
      ctx.strokeStyle = `rgba(184,188,196,${(sa * 0.8).toFixed(3)})`;
      ctx.lineWidth = (2 - sp2) * sa + 0.3;
      for (let i = 0; i < 4; i++) {
        const g = fc + (i / 4) * Math.PI * 1.6 - Math.PI * 0.8;  // forward arc spread
        const r0 = 4 + sp2 * 6, r1 = r0 + 6 + sp2 * (10 + i * 4);
        ctx.beginPath(); ctx.moveTo(bendX + Math.cos(g)*r0, bendY + Math.sin(g)*r0);
        ctx.lineTo(bendX + Math.cos(g)*r1, bendY + Math.sin(g)*r1); ctx.stroke();
      }
      // 2c) copper barb tip snaps off forward — flies past the fracture point
      const bp = Math.min(1, prog / 0.55), ba = 1 - bp;
      const tipX = Math.cos(fc) * (14 + bp * 22), tipY = Math.sin(fc) * (14 + bp * 22);
      ctx.strokeStyle = `rgba(200,144,96,${(ba * 0.85).toFixed(3)})`;
      ctx.lineWidth = 2.5 * ba + 0.3;
      ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(tipX + Math.cos(fc)*8, tipY + Math.sin(fc)*8); ctx.stroke();
      // 3) residue — shank stub at origin + copper barb shard forward
      ctx.strokeStyle = `rgba(90,90,96,${(a * 0.6).toFixed(3)})`;
      ctx.lineWidth = 3.5 * a + 0.3;
      ctx.beginPath(); ctx.moveTo(Math.cos(fc+Math.PI)*4, Math.sin(fc+Math.PI)*4);
      ctx.lineTo(Math.cos(fc+Math.PI)*16, Math.sin(fc+Math.PI)*16); ctx.stroke();
      ctx.fillStyle = `rgba(200,144,96,${(a * 0.5).toFixed(3)})`;
      const rx = Math.cos(fc)*28, ry = Math.sin(fc)*28;
      ctx.save(); ctx.translate(rx, ry); ctx.rotate(fc);
      ctx.beginPath(); ctx.moveTo(-3,-2); ctx.lineTo(4,0); ctx.lineTo(-3,2); ctx.closePath(); ctx.fill();
      ctx.restore();
      break;
    }
    default: {  // generic shatter — fighters not yet given a bespoke death
      if (prog < 0.55) {
        const bp = prog / 0.55, da = 1 - bp;
        ctx.strokeStyle = `rgba(255,255,255,${(da * 0.9).toFixed(3)})`;
        ctx.lineWidth = 3 * da + 1;
        ctx.beginPath(); ctx.arc(0, 0, 6 + bp * 46, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = `rgba(${lc},${da.toFixed(3)})`;
        ctx.lineWidth = 2 * da + 0.5;
        ctx.lineCap = 'round';
        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * Math.PI * 2 + i * 0.6;
          const r0 = 4 + bp * 18, r1 = r0 + 10 + bp * 24;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0);
          ctx.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
          ctx.stroke();
        }
      }
    }
  }
  ctx.restore();
}

// Arena floor, grid, and border — drawn in-world (reference coords) so they
// scroll and scale with the follow-camera. (Previously CSS on the canvas
// element, which would have sat static under the moving camera.)
function drawArenaBackdrop() {
  ctx.fillStyle = '#060606';
  ctx.fillRect(0, 0, game.w, game.h);
  const lw = window.devicePixelRatio / (pxPerRef * camera.zoom);  // ~1 css px at any zoom
  ctx.strokeStyle = 'rgba(245,245,240,0.05)';
  ctx.lineWidth = lw;
  ctx.beginPath();
  for (let x = 20; x < game.w; x += 20) { ctx.moveTo(x, 0); ctx.lineTo(x, game.h); }
  for (let y = 20; y < game.h; y += 20) { ctx.moveTo(0, y); ctx.lineTo(game.w, y); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(245,245,240,0.85)';
  ctx.lineWidth = lw * 2;
  ctx.strokeRect(0, 0, game.w, game.h);
}

function draw() {
  // Camera: ease toward framing both fighters, then enter camera space. Clear
  // in device space first so a zoomed-in view never leaves stale pixels.
  updateCamera();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  applyCamera();
  drawArenaBackdrop();

  // Screen-shake — offset the whole frame by a decaying random jitter.
  let shaken = false;
  if (game.shakeTime > 0 && game.shakeMag > 0) {
    const decay = Math.min(1, game.shakeTime / 0.18);
    const m = game.shakeMag * decay;
    ctx.save();
    ctx.translate((Math.random() * 2 - 1) * m, (Math.random() * 2 - 1) * m);
    shaken = true;
  }

  // Reaper WAKE hazard segments — dim crimson scar along the boomerang's arc. Many
  // overlapping segments form a visible damaging trail. Soft fill + outline (small
  // radius keeps the alpha-fill cheap on mobile). Only hazard kind currently in use
  // (Cannoneer's fire pool was retired when EPICENTER became the passive).
  (game.hazards || []).forEach(h => {
    const fade = h.timer / h.maxTimer;               // 1 → 0
    ctx.fillStyle = `rgba(170,0,0,${(fade * 0.32).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(200,20,20,${(fade * 0.7).toFixed(3)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2); ctx.stroke();
  });

  // Priest JUDGMENT — windup target reticle at the locked predicted spot (world
  // space, behind the fighters). Tightens + brightens as the strike nears.
  // Deterministic: driven by windup progress + time, never rng (GOTCHAS).
  [game.red, game.blue].forEach(f => {
    if (f.aimAbility !== 'lightning' || f.aimTimer <= 0 || f.dead) return;
    const prog = 1 - f.aimTimer / f.windupTime;
    const pr = f.pillarRadius || 34;               // THE damage zone: a body touching this ring is struck
    const al = 0.3 + prog * 0.6;
    ctx.save();
    ctx.translate(f.judgeX, f.judgeY);
    // converging telegraph — a light ring tightening onto the zone (incoming)
    const conv = pr * (2.1 - prog * 1.1);          // ~2.1·pr → pr as the strike nears
    ctx.strokeStyle = `rgba(255,255,255,${(0.12 + prog * 0.28).toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, conv, 0, Math.PI * 2); ctx.stroke();
    // the damage zone — bold gold, the ring a body must not touch
    ctx.strokeStyle = `rgba(255,232,61,${al.toFixed(3)})`;
    ctx.lineWidth = 1.5 + prog * 1.5;
    ctx.beginPath(); ctx.arc(0, 0, pr, 0, Math.PI * 2); ctx.stroke();
    // crosshair ticks across the zone ring
    ctx.lineWidth = 1 + prog;
    const tk = 4 + prog * 4;
    for (let i = 0; i < 4; i++) {
      const ga = i * Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ga) * (pr - tk), Math.sin(ga) * (pr - tk));
      ctx.lineTo(Math.cos(ga) * (pr + tk), Math.sin(ga) * (pr + tk));
      ctx.stroke();
    }
    ctx.restore();
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

  // Skeletons (Necromancer minions) — small bone-white humanoid silhouettes with team-colored ring
  game.skeletons.forEach(sk => {
    const teamCol = sk.team === 'red' ? '#ff2e2e' : '#2e9eff';
    // Team ring beneath
    ctx.strokeStyle = teamCol;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(sk.x, sk.y, sk.size + 2, 0, Math.PI * 2);
    ctx.stroke();
    // Bone body — skull + cross-bones, rotated to face enemy (velocity during charge).
    const target = sk.team === 'red' ? game.blue : game.red;
    let skFacing;
    if (sk.chargeTimer > 0) {
      const sp = Math.hypot(sk.vx, sk.vy);
      skFacing = sp > 5 ? Math.atan2(sk.vy, sk.vx) : 0;
    } else {
      skFacing = (target && !target.dead)
        ? Math.atan2(target.y - sk.y, target.x - sk.x)
        : 0;
    }
    const boneCol = (sk.flash > 0) ? '#ffffff' : '#e8e0d0';
    ctx.save();
    ctx.translate(sk.x, sk.y);
    ctx.rotate(skFacing);
    ctx.fillStyle = boneCol;
    // Skull (head) — forward (+x) direction
    ctx.beginPath();
    ctx.arc(sk.size * 0.3, 0, sk.size * 0.45, 0, Math.PI * 2);
    ctx.fill();
    // Eye sockets
    ctx.fillStyle = '#1a0a1a';
    ctx.beginPath();
    ctx.arc(sk.size * 0.3, -sk.size * 0.15, sk.size * 0.1, 0, Math.PI * 2);
    ctx.arc(sk.size * 0.3,  sk.size * 0.15, sk.size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    // Cross-bones body — trailing behind skull
    ctx.strokeStyle = boneCol;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-sk.size * 0.1, -sk.size * 0.5);
    ctx.lineTo(-sk.size * 0.5,  sk.size * 0.5);
    ctx.moveTo(-sk.size * 0.1,  sk.size * 0.5);
    ctx.lineTo(-sk.size * 0.5, -sk.size * 0.5);
    ctx.stroke();
    ctx.restore();
  });

  game.projectiles.forEach(p => {
    if (p.kind === 'arrow') {
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
      // Hunter hook in flight — the shared cable+hook helper (far end = the hook),
      // identical to the reel-in so the weapon reads continuously across phases.
      if (p.hookSrc && !p.hookSrc.dead) {
        drawHunterHook(p.hookSrc.x, p.hookSrc.y, p.x, p.y);
      } else {
        // source gone mid-flight — just the hook tip at the projectile
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.vy, p.vx));
        ctx.strokeStyle = '#c89060';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-6, 0); ctx.lineTo(0, 0); ctx.quadraticCurveTo(4, 0, 2, -5);
        ctx.stroke();
        ctx.fillStyle = '#e8e0d0';
        ctx.beginPath(); ctx.arc(2, -5, 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
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
    } else if (p.kind === 'crescent') {
      // Reaper thrown scythe — a spinning crescent (template visual, not the final art).
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin || 0);
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#aa0000';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, p.size, Math.PI * 0.3, Math.PI * 1.7); ctx.stroke();
      ctx.strokeStyle = '#1a0e0e';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, p.size - 2, Math.PI * 0.3, Math.PI * 1.7); ctx.stroke();
      ctx.restore();
    } else if (p.kind === 'charge') {
      // Sapper thrown charge — dark casing with a blinking red fuse-tip. p.angle is
      // the stick world-angle while stuck (point on the body edge → outward) or the
      // velocity angle in flight; we rotate so the fuse-tip always points along it.
      // Template visual; bespoke art deferred to the polish pass.
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.angle || 0) + Math.PI / 2);   // local -y becomes p.angle direction
      ctx.fillStyle = '#3a2614';
      ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.20)';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(0, 0, p.size * 0.62, Math.PI * 1.05, Math.PI * 1.5); ctx.stroke();
      // blinking red fuse — fast pulse while stuck (warning), steady glow in flight
      const pulse = p.stuck ? (0.5 + Math.sin(performance.now() / 60) * 0.5) : 0.7;
      ctx.fillStyle = `rgba(255,46,46,${pulse.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(0, -p.size * 0.5, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  });

  // Status visuals — two source→target connections, deliberately different in KIND
  // so a tether never reads like a drain. Drawn behind both fighters.

  // Hunter CRIPPLING HOOK — the reel-in. NOTE: the tether lives on the REELED enemy
  // (f), and f.tetherTarget is the HUNTER (the anchor it's hauled toward). So the
  // Hunter is f.tetherTarget — pass it as the origin and the enemy (f) as the far
  // end, matching the in-flight call's (hunter, hooked-thing) order so the cable,
  // studs, and hook read identically across both phases.
  [game.red, game.blue].forEach(f => {
    if (f.tetherTimer > 0 && f.tetherTarget && !f.tetherTarget.dead && !f.dead) {
      drawHunterHook(f.tetherTarget.x, f.tetherTarget.y, f.x, f.y);
    }
  });

  // Warlock DRAIN — no beam. The victim's life ESSENCE peels off and streams back
  // into the Warlock, its colour shifting from the victim's team-colour to the
  // Warlock's purple as it's consumed. Organic theft, not a laser.
  [game.red, game.blue].forEach(f => {
    if (f.drainTimer > 0 && f.drainTarget && !f.drainTarget.dead && !f.dead) {
      const t = f.drainTarget;
      const d = Math.hypot(t.x - f.x, t.y - f.y);
      const ang = Math.atan2(t.y - f.y, t.x - f.x);   // +x: Warlock → victim
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(ang);
      ctx.strokeStyle = 'rgba(192,80,255,0.16)';       // faint thread so the link reads
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(d, 0); ctx.stroke();
      const vc = t.team === 'red' ? [255, 46, 46] : [46, 158, 255];
      const pc = [192, 80, 255];
      const flow = (performance.now() / 360) % 1;
      const N = 6;
      for (let i = 0; i < N; i++) {
        const fr = 1 - (((i / N) + flow) % 1);          // travels victim(1) → Warlock(0)
        const m = fr;                                   // colour: victim at 1, purple at 0
        const r = Math.round(vc[0] * m + pc[0] * (1 - m));
        const g = Math.round(vc[1] * m + pc[1] * (1 - m));
        const b = Math.round(vc[2] * m + pc[2] * (1 - m));
        const a = 0.9 * Math.min(1, fr * 2.5);          // fades as it's absorbed at the Warlock
        const wob = Math.sin(fr * 11 + flow * 6) * 2.2; // organic wisp wobble
        ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(fr * d, wob, 1.6 + fr * 1.2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  });

  drawFighter(game.red);
  drawFighter(game.blue);

  // Archer PINCUSHION — render the cushion: optional saturation halo at high
  // stack counts, then each stuck arrow (shaft + white head triangle + green
  // V-fletching) anchored at the body edge in its stored world angle. All
  // angles are pre-rolled in the sim (no RNG in draw). Per-arrow landing burst
  // pops outward when an arrow first sticks; the whole cluster brightens +
  // thickens briefly each time a new stack lands (pincushionFlash). Skipped
  // for dead fighters (the death ceremony owns the body at that point).
  [game.red, game.blue].forEach(f => {
    if (f.dead || !f.pincushion || !f.pincushion.length) return;
    // Saturation halo — only when the cushion is dangerous (3+ stacks). Brighter
    // and broader as it climbs to cap. A thin pulsing ring just outside the body,
    // never a filled alpha disk (mobile GPU budget).
    if (f.pincushion.length >= 3) {
      const stacks = f.pincushion.length;
      const base = 0.16 + (stacks - 3) * 0.06;          // 3=0.16, 4=0.22, 5=0.28
      const pulse = 0.75 + 0.25 * Math.sin(performance.now() / 110);
      ctx.strokeStyle = `rgba(60,255,138,${(base * pulse).toFixed(3)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(f.x, f.y, FIGHTER_SIZE + 7, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Cluster pulse (0..1) — fades to 0 as pincushionFlash drains. Drives the
    // brief shaft-thicken + brighten across every arrow on a new stack landing.
    const cluster = f.pincushionFlash > 0 ? f.pincushionFlash / 0.15 : 0;
    f.pincushion.forEach(s => {
      const fade = Math.min(1, s.timer / 0.3);
      const c = Math.cos(s.angle), si = Math.sin(s.angle);
      const px = -si, py = c;
      const headR = FIGHTER_SIZE * 0.92;                // arrowhead at body edge
      const tailR = FIGHTER_SIZE + 12;                  // shaft tail outside
      const hx = f.x + c * headR, hy = f.y + si * headR;
      const tx = f.x + c * tailR, ty = f.y + si * tailR;
      // Shaft — thicker + brighter during cluster pulse
      const shaftA = (0.92 * fade) * (1 + cluster * 0.3);
      ctx.strokeStyle = `rgba(232,222,184,${Math.min(1, shaftA).toFixed(3)})`;
      ctx.lineWidth = 1.5 + cluster * 0.8;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty); ctx.stroke();
      // Arrowhead — small white triangle pointing INTO the body
      const baseX = hx - c * 2.4, baseY = hy - si * 2.4;
      ctx.fillStyle = `rgba(255,255,255,${(0.85 * fade).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(hx + c * 2.2, hy + si * 2.2);
      ctx.lineTo(baseX + px * 2.0, baseY + py * 2.0);
      ctx.lineTo(baseX - px * 2.0, baseY - py * 2.0);
      ctx.closePath(); ctx.fill();
      // Fletching — green V at the tail
      const fA = (0.92 * fade) * (1 + cluster * 0.3);
      ctx.strokeStyle = `rgba(60,255,138,${Math.min(1, fA).toFixed(3)})`;
      ctx.lineWidth = 1.6 + cluster * 0.6;
      ctx.beginPath();
      ctx.moveTo(tx + px * 2.8, ty + py * 2.8);
      ctx.lineTo(tx - c * 2.6, ty - si * 2.6);
      ctx.lineTo(tx - px * 2.8, ty - py * 2.8);
      ctx.stroke();
      // Landing burst — a green ring expanding from the arrowhead, fading out
      // over the first 0.18s of this arrow's life.
      if (s.born > 0) {
        const t = s.born / 0.18;                        // 1 at birth, 0 at end
        const r = (1 - t) * 14 + 5;
        ctx.strokeStyle = `rgba(60,255,138,${(t * 0.6).toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(hx, hy, r, 0, Math.PI * 2); ctx.stroke();
      }
    });
  });

  // SHATTER burst — the moment of release. A bright green ring expands outward
  // from the target's body; the previously embedded arrows fly out as residue
  // in their stuck-in directions, fading. Both layers share the same set of
  // per-fighter fields and live for 0.3s / 0.4s respectively (set in engine
  // when the cushion crosses shatterAt).
  [game.red, game.blue].forEach(f => {
    if (f.dead) return;
    // Expanding ring — peaks at burst, fades to nothing.
    if (f.shatterFlash > 0) {
      const t = 1 - f.shatterFlash / 0.3;               // 0 at burst, 1 at end
      const r = FIGHTER_SIZE + t * 42;
      const a = (1 - t) * 0.85;
      ctx.strokeStyle = `rgba(60,255,138,${a.toFixed(3)})`;
      ctx.lineWidth = 2.5 + (1 - t) * 1.5;
      ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, Math.PI * 2); ctx.stroke();
      // Secondary inner ring — adds weight without an alpha-fill (mobile budget).
      ctx.strokeStyle = `rgba(220,255,200,${(a * 0.6).toFixed(3)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(f.x, f.y, r * 0.72, 0, Math.PI * 2); ctx.stroke();
    }
    // Scattering arrows — fly outward from the body in their stuck-in angles.
    if (f.shattering && f.shattering.length) {
      f.shattering.forEach(s => {
        const t = 1 - s.timer / 0.4;                    // 0 at burst, 1 at end
        const fade = 1 - t;
        const c = Math.cos(s.angle), si = Math.sin(s.angle);
        const px = -si, py = c;
        const r0 = FIGHTER_SIZE * 0.92 + t * 38;        // arrowhead flies out
        const r1 = FIGHTER_SIZE + 12 + t * 38;          // tail too
        const hx = f.x + c * r0, hy = f.y + si * r0;
        const tx = f.x + c * r1, ty = f.y + si * r1;
        ctx.strokeStyle = `rgba(232,222,184,${(0.9 * fade).toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.strokeStyle = `rgba(60,255,138,${(0.9 * fade).toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(tx + px * 2.5, ty + py * 2.5);
        ctx.lineTo(tx - c * 2.4, ty - si * 2.4);
        ctx.lineTo(tx - px * 2.5, ty - py * 2.5);
        ctx.stroke();
      });
    }
  });

  // Impact bursts — at the contact point, on top of the fighters they struck.
  game.impacts.forEach(drawImpact);

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

  // End screen-shake transform before any full-screen overlay.
  if (shaken) ctx.restore();

  // ===== HIT FEEDBACK — the death ceremony ==================================
  // Death is the ceiling (ANIMATION.md #5). Three beats over the K.O. window:
  // the loser SHATTERS in a big radial burst, a "K.O." punches in, and a white
  // camera-snap frame caps the kill instant. Line-drawn, deterministic.
  if (game.koTimer > 0 && game.winner) {
    const loser = game.winner === game.red ? game.blue : game.red;
    // Hold the body FROZEN (death at frame 0) until the kill-cam has arrived on
    // it — then the death "undoing" + K.O. play over the remaining window. So
    // every kill reads: flash → push-in on the frozen body → it shatters. The
    // `koTimer < 0.6` clause is a safety net so the death always plays even if the
    // camera somehow never registers as arrived. `koArriveAt` = the koTimer value
    // captured at arrival (fresh each fight; undefined on a new game object).
    if (game.koArriveAt == null) {
      const centered = Math.hypot(camera.x - loser.x, camera.y - loser.y) < 12
                    && (CAM_KILL - camera.zoom) < 0.07;
      const elapsed = FINISH_WINDOW - game.koTimer;   // real time since the kill
      if (centered || elapsed > KILLCAM_MAX_PUSH) {
        game.koArriveAt = game.koTimer;
        game.flashFrame = 0.12;                 // camera-snap flash, on the shatter
        sfx('death', loser.ability, loser.x);   // death voice, synced to the shatter
        sfx('koHit');                            // K.O. boom lands with the graphic
      }
    }
    const started = game.koArriveAt != null;
    // Death plays over a fixed DEATH_DUR measured from arrival — full beat every
    // kill, not compressed into whatever's left of the window.
    const prog = started ? Math.min(1, (game.koArriveAt - game.koTimer) / DEATH_DUR) : 0;

    drawDeath(loser, prog);   // prog 0 = the body frozen at the kill instant

    // "K.O." — punches in once the death STARTS (on arrival), not at the kill, so
    // it accompanies the shatter. Screen-space upper-banner (CSS-px), kept clear
    // of the kill-cam-centred death below it.
    if (started) {
      const age = game.koArriveAt - game.koTimer;     // 0 at arrival, grows
      let scale;
      if (age < 0.16) scale = 2.6 - (age / 0.16) * 1.7;            // 2.6 → 0.9
      else if (age < 0.28) scale = 0.9 + ((age - 0.16) / 0.12) * 0.1; // settle to 1
      else scale = 1;
      const alpha = game.finishTimer < 0.3 ? game.finishTimer / 0.3 : 1;
      const wc = game.winner.team === 'red' ? '#ff2e2e' : '#2e9eff';
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);          // leave camera space → screen space
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(canvas.width / (2 * dpr), canvas.height * 0.22 / dpr);
      ctx.scale(scale, scale);
      ctx.font = '900 52px Bungee, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.lineJoin = 'round';
      ctx.strokeText('K.O.', 0, 0);
      ctx.shadowColor = wc;
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#fff';
      ctx.fillText('K.O.', 0, 0);
      ctx.shadowBlur = 0;
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  // White camera-snap frame at the kill instant — fills the whole viewport in
  // screen space, independent of the camera transform.
  if (game.flashFrame > 0) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.8, game.flashFrame * 6).toFixed(2)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

