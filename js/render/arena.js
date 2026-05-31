// drawHunterHook(hx,hy, ex,ey) — the Hunter's steel cable + hook, always drawn from
// the Hunter (hx,hy) outward to the far end (ex,ey): +x points Hunter→end, so a taut
// trembling steel line, bright-steel X-barbs along the line (sharp crossed catches —
// the cable's biting hardware), and a steel barbed hook biting forward at the far end.
// Everything is steel-toned because the carried sprite is explicitly single-material
// steel ("Filled STEEL grey — a grappling hook is metal." in sprites.js); the earlier
// copper accents on barbs + hook tip were off-identity. Shared by the in-flight hook
// and the reel-in tether so they render identically — no mirroring between phases.
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
  // X-barbs along the cable — two crossed diagonals per barb, bright-steel
  // highlight so they read against the slightly darker cable line. Symmetric
  // (no directionality), more obviously a "spike/hazard" silhouette than
  // the earlier chevrons that read as decorative tick marks.
  ctx.strokeStyle = `rgba(220,224,232,${(0.5 + tremor * 0.4).toFixed(3)})`;
  ctx.lineWidth = 1.5;
  const span = (d - 3) - start;                        // barbs only across the visible gap
  const barbs = Math.max(1, Math.floor(span / 18));
  for (let i = 1; i <= barbs; i++) {
    const px = start + (i / (barbs + 1)) * span;
    ctx.beginPath();
    ctx.moveTo(px - 3, -3); ctx.lineTo(px + 3,  3);
    ctx.moveTo(px - 3,  3); ctx.lineTo(px + 3, -3);
    ctx.stroke();
  }
  ctx.strokeStyle = '#b8bcc4';                        // steel barbed hook biting forward at the far end
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
    case 'cannon': {
      // Cannoneer BOMBARD — EPICENTER passive: max damage at center, falls off
      // to zero at splashRadius. The explosion visualizes that gradient so the
      // viewer can SEE the lethal zone:
      //   1. A persistent FAINT outer ring at splashRadius — the "edge" beyond
      //      which damage is zero. Marks the splash boundary.
      //   2. A bright SHOCKWAVE ring expanding outward — the concussion wave,
      //      reads as "pressure released" rather than "shrapnel scattered."
      //   3. A bright white-yellow CORE at the impact point — the epicenter.
      //   4. Four short directional SMOKE PUFFS — gunpowder venting, NOT the
      //      radial spokes of a mine (which read as shrapnel-everywhere).
      // Distinct grammar from Sapper's 'mine' (radial spokes + thick ring).
      const splashR = im.radius || 32;  // fallback for any cannon impact without a radius
      // 1) Splash-edge ring — faint, sits at the splashRadius for the impact's
      //    full life (slightly brightens then fades). Marks the falloff edge.
      const edgeA = a * 0.45;
      ctx.strokeStyle = `rgba(255,140,26,${edgeA.toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.arc(0, 0, splashR, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      // 2) Concussion shockwave — bright ring expanding from center to splashR.
      const shockR = prog * splashR;
      const shockA = a * (1 - prog * 0.4);   // brightest at start, dims as it expands
      ctx.strokeStyle = `rgba(255,180,60,${shockA.toFixed(3)})`;
      ctx.lineWidth = 3.5 * a + 0.8;
      ctx.beginPath(); ctx.arc(0, 0, shockR, 0, Math.PI * 2); ctx.stroke();
      // Inner secondary shock — half-radius, slightly delayed, brighter color.
      const innerR = Math.max(0, (prog - 0.15)) * splashR * 0.6;
      ctx.strokeStyle = `rgba(255,220,120,${(shockA * 0.7).toFixed(3)})`;
      ctx.lineWidth = 2 * a + 0.4;
      ctx.beginPath(); ctx.arc(0, 0, innerR, 0, Math.PI * 2); ctx.stroke();
      // 3) Epicenter core — bright flash at the impact point. Fades faster
      //    than the shockwave so the center reads as the brief peak.
      const coreA = a * (1 - prog) * (1 - prog);  // ease-out quadratic
      ctx.fillStyle = `rgba(255,255,220,${coreA.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(0, 0, 5 * coreA + 1, 0, Math.PI * 2); ctx.fill();
      // 4) Directional smoke puffs — short dark lines fanning outward at fixed
      //    cardinal-ish angles (NOT radial like a mine's spokes). 4 puffs,
      //    each a thick short stroke; they read as gunpowder venting.
      ctx.strokeStyle = `rgba(60,40,28,${(a * 0.7).toFixed(3)})`;
      ctx.lineWidth = 3 * a + 0.6;
      for (let i = 0; i < 4; i++) {
        const g = (i / 4) * Math.PI * 2 + Math.PI / 4;   // offset 45° so they don't align with axes
        const r0 = splashR * 0.18 + prog * 4;
        const r1 = splashR * 0.42 + prog * 8;
        ctx.beginPath();
        ctx.moveTo(Math.cos(g) * r0, Math.sin(g) * r0);
        ctx.lineTo(Math.cos(g) * r1, Math.sin(g) * r1);
        ctx.stroke();
      }
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
    case 'decoyShatter': {                          // Jester decoy consumed
      // 6 small diamond motes scatter outward, alternating red/blue (mirrors
      // Jester's SHATTER death in miniature). Slight gravity sag — reads
      // as a phantom breaking apart, not exploding. Silent (audio side
      // is intentionally muted; visual is the only cue).
      const N = 6;
      for (let i = 0; i < N; i++) {
        const ang = (i / N) * Math.PI * 2 + i * 0.31;
        const dist = prog * (9 + (i % 3) * 3);
        const dx = Math.cos(ang) * dist;
        const dy = Math.sin(ang) * dist + prog * prog * 3;
        const c = i % 2 === 0 ? '#ff2e2e' : '#2e9eff';
        ctx.globalAlpha = a;
        ctx.fillStyle = c;
        ctx.save();
        ctx.translate(dx, dy);
        ctx.rotate(Math.PI / 4 + prog * 1.2);
        ctx.fillRect(-1.6, -1.6, 3.2, 3.2);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
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
      // (No residue layer — the snap + cup guard fly-off carry the death;
      // a settling shard set was redundant and read as floating orphan lines.)
      break;
    }
    case 'sigil': {  // Geomancer — menhir tips, cracks, crumbles; ley-lines retract; rune-mark fades
      ctx.lineCap = 'round';
      // 1) Stone tips forward and crumbles — gravity wins. Same slump+sink as
      // a body folding, but it reads here as a tall standing stone toppling.
      // (Gone by prog 0.4.)
      if (prog < 0.4) {
        const sp = prog / 0.4;
        const eOut = 1 - (1 - sp) * (1 - sp);
        ctx.save();
        ctx.globalAlpha = 1 - sp;
        ctx.translate(0, eOut * 6);              // sinks into the floor
        ctx.rotate(eOut * 0.32);                 // tips forward
        drawShape(ctx, f);
        ctx.restore();
      }
      // 2a) Gravel burst — 8 small angular granite shards spraying out at the base.
      const gp = Math.min(1, prog / 0.5), ga = 1 - gp;
      ctx.fillStyle = `rgba(120,104,84,${(ga * 0.85).toFixed(3)})`;
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2 + i * 0.3;
        const r = 4 + gp * (14 + (i % 3) * 4);
        const sx = Math.cos(ang) * r, sy = Math.sin(ang) * r * 0.6 + 4;
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(ang);
        ctx.beginPath();
        ctx.moveTo(-2, -1.5); ctx.lineTo(2, -2); ctx.lineTo(2.5, 1); ctx.lineTo(-1.5, 1.5);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      // 2b) Amber rune-flash — the stone's carved rune flares one last time at
      // its position on the front face (centre, slightly forward), then dies.
      const rp = Math.min(1, prog / 0.3), ra2 = 1 - rp;
      const runeX = FIGHTER_SIZE * 0.28, runeY = 0;
      ctx.fillStyle = `rgba(255,180,60,${(ra2 * 0.85).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(runeX, runeY, 5 + rp * 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,240,200,${(ra2 * 0.7).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(runeX, runeY, 2 + rp * 5, 0, Math.PI * 2);
      ctx.fill();
      // 2c) Ley-line retraction — 4 amber lines snap inward to the body from
      // the four cardinal directions (his stones' connections collapsing). The
      // unique death voice: motion goes INWARD, not outward. Distinct from
      // every other death's "things flying outward" grammar.
      const lp = Math.min(1, prog / 0.55), la = 1 - lp;
      ctx.strokeStyle = `rgba(232,170,60,${(la * 0.75).toFixed(3)})`;
      ctx.lineWidth = (2 - lp) * la + 0.3;
      for (let i = 0; i < 4; i++) {
        const g = (i / 4) * Math.PI * 2 + Math.PI / 8;
        const r0 = (1 - lp) * (32 + i * 6);
        const r1 = r0 + 14 * la;
        ctx.beginPath();
        ctx.moveTo(Math.cos(g) * r0, Math.sin(g) * r0);
        ctx.lineTo(Math.cos(g) * r1, Math.sin(g) * r1);
        ctx.stroke();
      }
      // 3) Residue — granite chunks scattered around a dim rune-mark on the
      // ground (the spot the stone stood). Replaces the old "staff lying flat"
      // residue, which made no sense for a single-stone sprite.
      // Ground darkening pool — the granite dust/staining left behind.
      ctx.fillStyle = `rgba(56,48,38,${(a * 0.55).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(0, 4, 14 * a + 5, 5 * a + 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Five angular granite chunks at scattered positions.
      ctx.fillStyle = `rgba(140,120,92,${(a * 0.7).toFixed(3)})`;
      const chunks = [[-8, 5, 0.4], [4, 7, -0.5], [-2, 3, 0.8], [9, 6, -0.2], [-6, 8, 1.1]];
      chunks.forEach(([cx, cy, cr]) => {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(cr);
        ctx.beginPath();
        ctx.moveTo(-3, -1.5); ctx.lineTo(2, -2); ctx.lineTo(3, 1); ctx.lineTo(-2, 1.5);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      });
      // Dim amber rune-mark scorched into the ground at the stone's centre —
      // the last trace of the kit, fading slowest.
      ctx.fillStyle = `rgba(180,130,40,${(a * 0.4).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(0, 4, 4 * a + 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(180,130,40,${(a * 0.5).toFixed(3)})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-3, 4); ctx.lineTo(3, 4);
      ctx.stroke();
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
      // 3) residue — dark casing shards: angular polygons at radial positions.
      // (No fuse-scrap residue: the fuse goes up with the bomb, leaving it
      // hanging in place after the explosion looks like the casing breached
      // around an intact fuse.)
      const shardA = (a * 0.65);
      ctx.fillStyle = `rgba(40,24,24,${shardA.toFixed(3)})`;
      for (let i = 0; i < 5; i++) {
        const g = (i / 5) * Math.PI * 2 + 0.3;
        const rr = 14 + Math.min(1, prog / 0.35) * 18 + (i % 2) * 5;
        ctx.save(); ctx.translate(Math.cos(g) * rr, Math.sin(g) * rr); ctx.rotate(g);
        ctx.beginPath(); ctx.moveTo(-4, -3); ctx.lineTo(4, -1); ctx.lineTo(2, 4); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
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
      // (No residue layer — Ronin's body IS the katana; once it shatters
      // there's nothing left to lie on the ground. The slash mark above
      // carries the entire death — "the stillness after the blade IS
      // the point" per the CUT archetype.)
      break;
    }
    case 'sweep': {  // Reaper — hooded body slumps and sinks, blood pool spreads beneath
      ctx.lineCap = 'round';
      // 1) body slumps (small forward lean) and sinks — power leaving the
      // figure. Replaces the old "rotor decelerates" 1.75-turn spin that fit
      // the dead three-bladed-glaive sprite; the hooded scythe-wielder reads
      // wrong as a buzzsaw winding down. (Gone by prog 0.44.)
      if (prog < 0.44) {
        const sp  = prog / 0.44;
        const eOut = 1 - (1 - sp) * (1 - sp);     // quadratic ease-out: fast then slows
        ctx.save();
        ctx.globalAlpha = 1 - sp;
        ctx.translate(0, sp * sp * 18);            // sinks as it slows
        ctx.rotate(eOut * 0.5);                    // small forward tilt (~28°), the slump
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
      // 2c) steel barb tip snaps off forward — flies past the fracture point.
      // Matches the single-material steel identity (see the sprite + the in-flight
      // hook); the earlier copper-tone was the same off-identity inconsistency
      // the residue block below already calls out.
      const bp = Math.min(1, prog / 0.55), ba = 1 - bp;
      const tipX = Math.cos(fc) * (14 + bp * 22), tipY = Math.sin(fc) * (14 + bp * 22);
      ctx.strokeStyle = `rgba(184,188,196,${(ba * 0.85).toFixed(3)})`;
      ctx.lineWidth = 2.5 * ba + 0.3;
      ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(tipX + Math.cos(fc)*8, tipY + Math.sin(fc)*8); ctx.stroke();
      // 3) residue — steel claw fragments scattered around the bend (the
      // claw broke into a few thick pieces). All steel-grey to match the
      // sprite's single-material claw — no copper barb, no shank handle
      // (neither was in the sprite; the original residue was inventing parts).
      ctx.fillStyle = `rgba(120,124,134,${(a * 0.7).toFixed(3)})`;
      const fragAngles = [-0.6, 0.3, 1.4];   // 3 chunks fanned around the bend
      for (let i = 0; i < fragAngles.length; i++) {
        const ang = fc + fragAngles[i];
        const r = 10 + (i % 2) * 5;
        const fx = bendX + Math.cos(ang) * r, fy = bendY + Math.sin(ang) * r;
        ctx.save(); ctx.translate(fx, fy); ctx.rotate(ang + 0.4);
        // Thick chunk: a curved trapezoid scrap (the claw's belly broke off)
        ctx.beginPath();
        ctx.moveTo(-3, -2); ctx.lineTo(3, -1); ctx.lineTo(4, 2); ctx.lineTo(-2, 3); ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      // A thin steel sliver along the original bend axis (the shank fragment)
      ctx.strokeStyle = `rgba(140,144,154,${(a * 0.55).toFixed(3)})`;
      ctx.lineWidth = 2 * a + 0.3;
      ctx.beginPath();
      ctx.moveTo(bendX + Math.cos(fc + Math.PI) * 2, bendY + Math.sin(fc + Math.PI) * 2);
      ctx.lineTo(bendX + Math.cos(fc + Math.PI) * 10, bendY + Math.sin(fc + Math.PI) * 10);
      ctx.stroke();
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
  const lw = layout.dpr / (pxPerRef * camera.zoom);  // ~1 css px at any zoom (uses the effective backing dpr, boosted while recording)
  ctx.strokeStyle = 'rgba(245,245,240,0.05)';
  ctx.lineWidth = lw;
  ctx.beginPath();
  for (let x = 20; x < game.w; x += 20) { ctx.moveTo(x, 0); ctx.lineTo(x, game.h); }
  for (let y = 20; y < game.h; y += 20) { ctx.moveTo(0, y); ctx.lineTo(game.w, y); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(245,245,240,0.85)';
  ctx.lineWidth = lw * 2;
  ctx.strokeRect(0, 0, game.w, game.h);
  // Channel watermark — drawn in-world as a faded arena-floor decal (like
  // a centre-court logo). Low alpha so sprites/projectiles/death FX read
  // unambiguously above it; drawn here at the end of the backdrop so the
  // entire fighter layer naturally renders on top. Lives in reference
  // coords so if a future camera move zooms in, it scales with the frame.
  ctx.save();
  ctx.fillStyle = 'rgba(245,245,240,0.13)';
  ctx.font = '22px Bungee, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('@zeamayslab', game.w / 2, game.h / 2);
  ctx.restore();
}

// --- Canvas HUD + intro -----------------------------------------------------
// The HP band and the VS-intro reveal are drawn INTO the fight canvas (they
// used to be DOM/CSS overlaid on a small arena canvas). Drawing them here makes
// the canvas the sole source of the fight image, so the in-app recorder
// (record.js) captures pixel-for-pixel what's on screen. All sizes derive from
// `layout` (device px, set in resizeCanvas); all motion is time-derived, never
// rng (GOTCHAS: never rng/vrng in draw()).

function _clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
function _easeOutBack(x) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }

// HP band — two bordered bars that drain toward the arena centre, team-coloured
// name + numeric HP per side. The displayed fill eases toward the live value
// (the old CSS had a 0.2s width transition); the ease is real-time-derived and
// stored on the fighter (render-only — the sim never reads `_hpShown`).
let _hpLastT = 0;
function drawHpBars() {
  if (!game) return;
  const now = performance.now();
  const dt = _hpLastT ? Math.min(0.05, (now - _hpLastT) / 1000) : 0;
  _hpLastT = now;
  const ease = dt > 0 ? 1 - Math.exp(-dt / 0.06) : 1;   // ~0.2s settle
  drawHpSide(game.red, 'red', '#ff2e2e', ease);
  drawHpSide(game.blue, 'blue', '#2e9eff', ease);
}
function drawHpSide(f, side, color, ease) {
  const k = layout.k;
  // HP columns share the arena's SAFE_X inset so the names/numbers survive the
  // tall-phone side-crop (they used to run to the frame edge and get cut).
  const colW = ((REF_W - 2 * SAFE_X - 8) / 2) * k;     // (safe width - 8 gap) / 2, design → device
  const x = side === 'red' ? SAFE_X * k : (REF_W - SAFE_X) * k - colW;
  const y = layout.hpY;
  const target = Math.max(0, Math.min(1, f.hp / f.maxHp));
  if (f._hpShown == null) f._hpShown = target;
  f._hpShown += (target - f._hpShown) * ease;
  const frac = f._hpShown;
  // Name (Bungee, team colour)
  ctx.fillStyle = color;
  ctx.font = `${Math.round(11 * k)}px Bungee, sans-serif`;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = side === 'red' ? 'left' : 'right';
  ctx.fillText(f.name, side === 'red' ? x : x + colW, y + 12 * k);
  // Bar — bordered box; fill depletes from the centre-facing edge.
  const barY = y + 17 * k, barH = 12 * k, bw = 2 * k;
  ctx.fillStyle = '#222';
  ctx.fillRect(x, barY, colW, barH);
  ctx.strokeStyle = '#f5f5f0';
  ctx.lineWidth = bw;
  ctx.strokeRect(x + bw / 2, barY + bw / 2, colW - bw, barH - bw);
  const innerW = colW - 2 * bw, innerH = barH - 2 * bw, fillW = innerW * frac;
  ctx.fillStyle = color;
  const fx = side === 'red' ? x + bw : x + colW - bw - fillW;   // red drains rightward, blue leftward
  ctx.fillRect(fx, barY + bw, fillW, innerH);
  // Numeric HP
  ctx.fillStyle = 'rgba(245,245,240,0.7)';
  ctx.font = `${Math.round(9 * k)}px 'JetBrains Mono', monospace`;
  ctx.textAlign = side === 'red' ? 'left' : 'right';
  ctx.fillText(`${Math.max(0, Math.round(f.hp))} / ${f.maxHp}`, side === 'red' ? x : x + colW, barY + barH + 11 * k);
}

// VS-intro reveal — labels fade+rise in over the arena (0.10-0.50s), the VS
// badge clashes in at 0.85s, the whole overlay fades 1.50-1.70s. Timed off
// game.introT0 (real time). Clipped to the arena rect (mirrors the old CSS
// overflow:hidden). Drawn only while game.introPlaying.
function drawVsIntro() {
  const t = (performance.now() - (game.introT0 || performance.now())) / 1000;
  const overlay = t >= 1.5 ? Math.max(0, 1 - (t - 1.5) / 0.2) : 1;
  if (overlay <= 0) return;
  const k = layout.k, ax = layout.arenaX, ay = layout.arenaY, ap = layout.arenaPx;
  ctx.save();
  ctx.beginPath(); ctx.rect(ax, ay, ap, ap); ctx.clip();
  const lp = _clamp01((t - 0.10) / 0.40);
  const rise = (1 - _easeOutBack(lp)) * 14 * k;
  const labelY = ay + 0.22 * ap;
  drawVsLabel(game.red, '#ff2e2e', ax + 0.20 * ap, labelY + rise, lp * overlay, k);
  drawVsLabel(game.blue, '#2e9eff', ax + 0.80 * ap, labelY + rise, lp * overlay, k);
  if (t >= 0.85) {
    const bp = _clamp01((t - 0.85) / 0.45);
    // CSS vsClash keyframes: scale 3.8 → 0.82 (at 55%) → 1.0; rotate -14° → 5° → 0°.
    const sc = bp < 0.55 ? 3.8 + (0.82 - 3.8) * (bp / 0.55) : 0.82 + (1 - 0.82) * ((bp - 0.55) / 0.45);
    const deg = bp < 0.55 ? -14 + 19 * (bp / 0.55) : 5 + (0 - 5) * ((bp - 0.55) / 0.45);
    ctx.save();
    ctx.globalAlpha = _clamp01(bp / 0.55) * overlay;
    ctx.translate(ax + 0.5 * ap, ay + 0.5 * ap);
    ctx.rotate(deg * Math.PI / 180);
    ctx.scale(sc, sc);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(255,255,255,0.6)';
    ctx.shadowBlur = 14 * k;
    ctx.font = `${Math.round(56 * k)}px Bungee, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VS', 0, 0);
    ctx.restore();
  }
  ctx.restore();
}
function drawVsLabel(f, color, cx, y, alpha, k) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(0,0,0,0.95)';
  ctx.shadowBlur = 6 * k;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = `${Math.round(16 * k)}px Bungee, sans-serif`;
  ctx.fillText(f.name, cx, y);
  ctx.fillStyle = '#f5f5f0';
  ctx.font = `${Math.round(8 * k)}px Bungee, sans-serif`;
  ctx.globalAlpha = alpha * 0.95;
  ctx.fillText((f.active || '').split('—')[0].trim(), cx, y + 13 * k);
  ctx.globalAlpha = alpha * 0.75;
  ctx.fillText((f.passive || '').split('—')[0].trim(), cx, y + 23 * k);
  ctx.restore();
}

function draw() {
  // Camera: ease toward framing both fighters, then enter camera space. Clear
  // in device space first so a zoomed-in view never leaves stale pixels.
  updateCamera();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Page background fills the HP band + letterbox margins around the arena.
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // HP band — drawn in device/screen space above the arena (was DOM .hp-bars).
  drawHpBars();
  // Arena content — clipped to its sub-region so wall-edge spillover (recoil,
  // particles, the death burst) can't bleed into the HP band or letterbox.
  applyCamera();
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, game.w, game.h);   // arena ref rect, evaluated in camera space
  ctx.clip();
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

  // Hazards layer — dispatch by kind. Drawn before fighters so the floor
  // layer reads as ground decoration (fighters render over the top).
  const now = performance.now();
  (game.hazards || []).forEach(h => {
    if (h.kind === 'stake') {
      // Archer STAKES — upright arrow embedded point-first in the floor.
      // Fades over the last 0.4s of its life. Slight per-stake lean is
      // pre-rolled in the sim (h.leanRad). Tip pulse is time-derived
      // (never rng in draw — see GOTCHAS).
      const fade = Math.min(1, h.timer / 0.4);
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.globalAlpha = fade;
      // Wooden shaft + arrowhead at bottom (point into floor) + feathers
      // at top, tilted by per-stake lean. The arrowhead at the BOTTOM is
      // critical for the silhouette to read as "arrow stuck point-down in
      // floor" rather than "stick with chevron on top" (which viewers
      // misread as an arrow pointing up).
      ctx.save();
      ctx.rotate(h.leanRad || 0);
      // Shaft, arrowhead, and fletching colors match Archer's bow sprite
      // (sprites.js bow case): dark brown shaft, WHITE arrowhead, RED
      // fletching. One arrow vocabulary across the whole kit.
      ctx.strokeStyle = '#5a4a2a';
      ctx.lineWidth = 1.3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -1);
      ctx.lineTo(0, -14);
      ctx.stroke();
      // Arrowhead — small filled triangle at the bottom, apex pointing
      // DOWN (into the floor). Half-embedded so the base is just above
      // the floor and the apex pokes slightly past it.
      ctx.fillStyle = '#f5f5f0';
      ctx.beginPath();
      ctx.moveTo(0, 1);
      ctx.lineTo(-2, -3);
      ctx.lineTo(2, -3);
      ctx.closePath();
      ctx.fill();
      // Fletching — two thin feather-lines fanning UP and OUTWARD from
      // the shaft top (away from the tip). Vertex at the shaft top, arms
      // extending above it: clearly "feathers" rather than "arrowhead."
      ctx.strokeStyle = '#c44';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(-3, -18);
      ctx.moveTo(0, -14);
      ctx.lineTo(3, -18);
      ctx.stroke();
      ctx.restore();
      // (Tip glow removed — the white arrowhead at the bottom is now
      // the explicit "tip embedded in floor" tell; a pulsing green dot
      // is both redundant and off-palette with the new arrow vocabulary.)
      ctx.restore();
      return;
    }
    // Reaper WAKE hazard segments — clean crimson damage-zone markers.
    // Just an outlined ring + small inner dot per segment; overlapping
    // segments along the scythe's trajectory compose into the trail.
    const fade = h.timer / h.maxTimer;               // 1 → 0
    ctx.strokeStyle = `rgba(180,20,20,${(fade * 0.7).toFixed(3)})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(150,0,0,${(fade * 0.45).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
  });

  // Archer VOLLEY mid-flight — one continuous parabolic arc per arrow:
  // the SAME arrow renders along its full path from Archer's position UP
  // through the top of the arena and back DOWN to the landing spot. So:
  //   t=0 to ~0.3 — arrow visible climbing up, exits arena top
  //   t=~0.3 to ~0.7 — arrow off-screen (above arena, no draw)
  //   t=~0.7 to 1 — arrow visible falling from off-screen back to landing
  // The landing marker on the floor fades in then out as the arrow nears.
  // At landing, the rain projectile is consumed (engine.js) and either
  // spawns a stake or damages the enemy directly.
  (game.projectiles || []).forEach(p => {
    if (p.kind !== 'rain') return;
    const t = 1 - (p.life / (p.maxLife || 0.6));     // 0 at fire, 1 at landing

    // --- Parabolic arc from launch to landing ---
    // Linear blend from launch to landing, plus an upward arc offset that
    // peaks at t=0.5. ARC_HEIGHT controls peak height above the linear
    // path; with launch+landing near the arena floor and ARC_HEIGHT=260,
    // the apex is well above the arena top (so the arrow visibly exits
    // the frame around t≈0.3 and re-enters around t≈0.7).
    const ARC_HEIGHT = 260;
    const arcOffset = -ARC_HEIGHT * 4 * t * (1 - t);  // 0 at t=0/1, -260 at t=0.5
    const ax = p.launchX + (p.landX - p.launchX) * t;
    const ay = p.launchY + (p.landY - p.launchY) * t + arcOffset;

    // Tangent angle — sample the arc 0.01 step ahead and atan2 the delta.
    const tN = Math.min(1, t + 0.01);
    const arcOffsetN = -ARC_HEIGHT * 4 * tN * (1 - tN);
    const axN = p.launchX + (p.landX - p.launchX) * tN;
    const ayN = p.launchY + (p.landY - p.launchY) * tN + arcOffsetN;
    const flightAngle = Math.atan2(ayN - ay, axN - ax);

    // Don't bother drawing while the arrow is above the visible arena
    // (saves work; canvas would clip naturally otherwise but skipping
    // also skips the marker overdraw downstream).
    const arrowVisible = ay >= -20;

    // --- Arrow sprite, drawn only while inside the visible arena ---
    if (arrowVisible) {
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(flightAngle);
      // Shaft, arrowhead, fletching match Archer's bow sprite — dark brown
      // shaft, WHITE arrowhead, RED fletching. Local +x is flight direction.
      ctx.strokeStyle = 'rgba(90,74,42,0.92)';
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(7, 0);
      ctx.stroke();
      // Arrowhead — small filled triangle at the TIP end (+x).
      ctx.fillStyle = '#f5f5f0';
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(3, -2);
      ctx.lineTo(3, 2);
      ctx.closePath();
      ctx.fill();
      // Fletching — two thin angled lines fanning outward at the tail (-x).
      ctx.strokeStyle = '#c44';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(-13, -3);
      ctx.moveTo(-9, 0);
      ctx.lineTo(-13, 3);
      ctx.stroke();
      // Speed trail — faint cream streak fading backward from the tail.
      // Stronger during the descent phase (faster arrow = bigger trail).
      const trailA = 0.20 + t * 0.35;
      ctx.strokeStyle = `rgba(245,245,240,${trailA.toFixed(2)})`;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(-22, 0);
      ctx.stroke();
      ctx.restore();
    }

    // --- Landing marker on floor ---
    // Holds steady through the "in sky" phase (when the arrow is off-
    // screen above the arena), so the viewer always knows where the kill
    // zone is. Brightens slightly as landing nears. Fades out the last
    // 15% so it doesn't compete with the arrow at impact.
    const markerAlpha = (t < 0.85)
      ? 0.35 + t * 0.4
      : 0.35 + 0.85 * 0.4 * (1 - (t - 0.85) / 0.15);
    if (markerAlpha > 0.04) {
      const r = 12 - t * 6;                             // 12px → 6px tightening
      ctx.strokeStyle = `rgba(125,255,138,${markerAlpha.toFixed(2)})`;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(p.landX, p.landY, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = `rgba(245,245,240,${(markerAlpha * 0.6).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(p.landX, p.landY, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Geomancer SIGIL flash — amber ley-lines drawn between linked stones for
  // sigilFlashDur after a cast. Drawn UNDER stones so the line endpoints look
  // like they "emit from" each stone. Lines that actually crossed the enemy
  // body are bolder + brighter (link.hit set at cast time); lines that missed
  // are dim. The whole flash fades quadratically to nothing.
  [game.red, game.blue].forEach(f => {
    if (f.ability !== 'sigil' || f.sigilFlash <= 0 || !f.sigilLines || !f.sigilLines.length) return;
    // Death fade — sigilFlash itself decays in sim-time (slow-mo 0.18x),
    // so the natural fade is stretched to ~3.3 real seconds during the
    // finish window. Overlay a real-time death fade so the lines linger
    // briefly (so a SIGIL → BONE BURST kill reads), then disappear
    // before the finish window ends. Same curve as the stones below.
    let deathAlpha = 1;
    if (f.dead) {
      const since = FINISH_WINDOW - (game.koTimer || 0);
      if (since >= 1.2) return;
      if (since > 0.5) deathAlpha = 1 - (since - 0.5) / 0.7;
    }
    const t = f.sigilFlash / f.sigilFlashDur;
    const fade = t * t * deathAlpha;
    ctx.save();
    ctx.lineCap = 'round';
    for (const link of f.sigilLines) {
      const baseA = (link.hit ? 0.95 : 0.55) * fade;
      const baseW = (link.hit ? 3.0 : 1.6) * fade + 0.4;
      // Outer glow — amber halo.
      ctx.strokeStyle = `rgba(255,180,60,${baseA.toFixed(3)})`;
      ctx.lineWidth = baseW + 1.6;
      ctx.beginPath(); ctx.moveTo(link.x1, link.y1); ctx.lineTo(link.x2, link.y2); ctx.stroke();
      // Bright core — white-hot through amber.
      ctx.strokeStyle = `rgba(255,240,180,${(baseA * 0.85).toFixed(3)})`;
      ctx.lineWidth = baseW * 0.45;
      ctx.beginPath(); ctx.moveTo(link.x1, link.y1); ctx.lineTo(link.x2, link.y2); ctx.stroke();
    }
    ctx.restore();
  });

  // Geomancer STANDING STONES — wall-embedded runestones from any geomancer's
  // bounce-chain. Each stone juts INTO the arena from the wall surface; the
  // (nx, ny) normal points inward. Pulse rate is time- + position-derived
  // (deterministic, never rng — GOTCHAS) so each stone glimmers on its own
  // schedule. Stones don't fade — they persist at full alpha until evicted
  // by cap overflow.
  [game.red, game.blue].forEach(f => {
    if (f.ability !== 'sigil' || !f.stones || !f.stones.length) return;
    // Death fade — stones linger briefly so the network identity reads at
    // the moment of Geomancer's death, then fade out. Important for the
    // SIGIL → BONE BURST chain where the SIGIL itself causes the kill;
    // we want the network visible when the kill lands. 0–0.5s post-death
    // = full alpha, 0.5–1.2s = linear fade to 0, 1.2s+ = gone.
    let deathAlpha = 1;
    if (f.dead) {
      const since = FINISH_WINDOW - (game.koTimer || 0);
      if (since >= 1.2) return;
      if (since > 0.5) deathAlpha = 1 - (since - 0.5) / 0.7;
    }
    ctx.save();
    ctx.globalAlpha = deathAlpha;
    f.stones.forEach(st => {
      const ang = Math.atan2(-st.ny, -st.nx);             // local +x = into-arena
      ctx.save();
      ctx.translate(st.x, st.y);
      ctx.rotate(ang);
      // Stone body — angular granite chunk, flat against wall (-x side) and
      // jutting forward (+x = into the arena).
      ctx.fillStyle = 'rgba(116,104,86,1)';
      ctx.beginPath();
      ctx.moveTo(-3, -3);
      ctx.lineTo(2, -4);
      ctx.lineTo(6, -1);
      ctx.lineTo(5, 3);
      ctx.lineTo(-1, 4);
      ctx.lineTo(-4, 1);
      ctx.closePath();
      ctx.fill();
      // Dark edge.
      ctx.strokeStyle = 'rgba(56,46,36,0.85)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      // Carved rune line.
      ctx.strokeStyle = 'rgba(70,58,46,0.7)';
      ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(3, 0); ctx.stroke();
      // Amber rune-dot, time-pulsing.
      const pulse = 0.55 + Math.sin(performance.now() / 580 + st.x * 0.07 + st.y * 0.07) * 0.30;
      ctx.fillStyle = `rgba(232,160,40,${pulse.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(1, 0, 1.6, 0, Math.PI * 2);
      ctx.fill();
      // Born burst — small amber ring expanding outward on plant (0..0.25s).
      if (st.born > 0) {
        const bt = 1 - st.born / 0.25;
        ctx.strokeStyle = `rgba(232,180,90,${((1 - bt) * 0.7).toFixed(3)})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, 0, 4 + bt * 9, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    });
    ctx.restore();   // pairs the outer save() that applied deathAlpha
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

  // Skeletons (Necromancer minions) — small bone-white humanoid silhouettes.
  // (No team-colour ring — dropped in lockstep with the fighter body ring.)
  game.skeletons.forEach(sk => {
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
      // Reaper HARVEST — a thrown scythe in flight. Draws via the shared
      // drawScythe helper (sprites.js) so the projectile renders the exact
      // same silhouette as the carried weapon, just spinning in space. The
      // scale matches the carried sprite (FIGHTER_SIZE * 1.1) so the
      // thrown form reads as the same size — viewer recognises it as
      // "the Reaper's scythe came off in flight," not "a different blade."
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin || 0);
      drawScythe(ctx, FIGHTER_SIZE * 1.1, '#aa0000');
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

  // Hunter BARBED LINE reel-in cable. NOTE: the tether lives on the REELED enemy
  // (f), and f.tetherTarget is the HUNTER (the anchor it's hauled toward). So the
  // Hunter is f.tetherTarget — pass it as the origin and the enemy (f) as the far
  // end, matching the in-flight call's (hunter, hooked-thing) order so the cable,
  // studs, and hook read identically across both phases. (The wound indicator
  // is drawn AFTER drawFighter so the sprite doesn't cover it — see the
  // separate block below.)
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

  // Jester DOPPELGANGER decoys — render BEFORE the real fighter so the real
  // Jester paints on top of any overlapping phantom (clears the moment-of-spawn
  // overlap). Use drawShape (the pure-identity sprite path, no animation state)
  // at the decoy's position, facing the enemy, with a ghost-tint alpha that
  // fades over the last 0.5s of life. Decoys mirror left/right like real
  // fighters do (cos(facing) < 0 -> scale -1).
  [game.red, game.blue].forEach(f => {
    if (!f.decoys || !f.decoys.length) return;
    const enemy = f === game.red ? game.blue : game.red;
    f.decoys.forEach(d => {
      const fade = Math.min(1, d.life / 0.5);
      const alpha = 0.42 * fade;
      const facing = enemy && !enemy.dead
        ? Math.atan2(enemy.y - d.y, enemy.x - d.x)
        : 0;
      ctx.save();
      ctx.translate(d.x, d.y);
      if (Math.cos(facing) < 0) {
        ctx.scale(-1, 1);
        ctx.rotate(Math.PI - facing);
      } else {
        ctx.rotate(facing);
      }
      ctx.globalAlpha = alpha;
      drawShape(ctx, d);
      // (No phantom halo — the 42% alpha vs real Jester's 100% is enough
      // contrast to read as a phantom, and a faint cream ring conflicts
      // tonally with the team-ring teardown on real fighters.)
      ctx.globalAlpha = 1.0;
      ctx.restore();
    });
  });

  drawFighter(game.red);
  drawFighter(game.blue);

  // Hunter BARBED LINE blood trail — during reel, drop a red droplet at the
  // body's current position each frame. Droplets persist + fade over ~1.2s,
  // leaving a visible bloody trail along the yanked body's trajectory. Trail
  // is render-only (game.bloodTrail is initialized in buildGame, mutated only
  // in draw() — headless never runs draw, so the list stays empty in the
  // balance harness). Use performance.now() for time, no RNG (per gotcha).
  const trailNow = performance.now();
  const SPAWN_EVERY_MS = 35;   // every ~2 frames at 60Hz; each spawn is a 5-drop spatter cluster
  [game.red, game.blue].forEach(f => {
    if (f.tetherTimer <= 0 || !f.tetherTarget || f.tetherTarget.dead || f.dead) return;
    const rate = f.tetherTarget.reelStepDmg || 0;
    if (rate <= 0) return;
    // Throttle spawns — each "spawn" is a spatter cluster, not a single dot,
    // so spawning every frame would put 240 drops/sec on screen.
    f.bloodSpawnAt = f.bloodSpawnAt || 0;
    if (trailNow - f.bloodSpawnAt < SPAWN_EVERY_MS) return;
    f.bloodSpawnAt = trailNow;
    const jitter = Math.sin(trailNow / 18) * 2.5;
    game.bloodTrail.push({
      x: f.x + jitter,
      y: f.y + jitter * 0.5,
      bornAt: trailNow,
    });
  });
  // Tick + render trail spatters. Each entry is a CLUSTER drawn as 1 main
  // blob + 3 satellite drops. Satellite positions/sizes are derived from
  // bornAt (no RNG in draw — gotcha) so each spatter has unique shape.
  // The whole cluster fades + sags together over LIFE_MS.
  const LIFE_MS = 1200;
  game.bloodTrail = game.bloodTrail.filter(d => (trailNow - d.bornAt) < LIFE_MS);
  for (const d of game.bloodTrail) {
    const age = (trailNow - d.bornAt) / LIFE_MS;   // 0..1
    const a = 1 - age;
    const sag = age * age * 4;                      // gravity sag
    // Main splash blob — bright vivid red, big enough to read clearly.
    ctx.fillStyle = `rgba(200,20,20,${(a * 0.95).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(d.x, d.y + sag, 5 - age * 2, 0, Math.PI * 2);
    ctx.fill();
    // Darker core for the wet/depth read.
    ctx.fillStyle = `rgba(130,8,8,${(a * 0.9).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(d.x, d.y + sag, 2.5 - age * 1, 0, Math.PI * 2);
    ctx.fill();
    // Deterministic seed for the satellite spread (uses bornAt bits).
    const seed = (d.bornAt * 0.0173) % 1;           // 0..1
    // 5 satellite drops scattered in a flattened ellipse — wider spread
    // for a real splatter pattern (reads as violent impact, not droplet).
    ctx.fillStyle = `rgba(170,15,15,${(a * 0.85).toFixed(3)})`;
    for (let i = 0; i < 5; i++) {
      const ang = seed * Math.PI * 2 + i * 1.257;   // 72° apart
      const dist = 4 + ((seed * 11 + i * 1.7) % 5);  // 4-9 px out
      const sx = d.x + Math.cos(ang) * dist;
      const sy = d.y + sag + Math.sin(ang) * dist * 0.55;
      const sr = 1.8 - age * 0.9 + ((seed * 13 + i) % 1.0);  // 1.8-2.8 px
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(0.4, sr), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // (Archer SHATTER cushion-on-enemy + burst render was retired with the
  // VOLLEY redesign. STAKES floor hazards render in the hazards forEach
  // above; in-flight rain projectiles render as landing markers there.)

  // Impact bursts — at the contact point, on top of the fighters they struck.
  game.impacts.forEach(drawImpact);

  game.floatTexts.forEach(ft => {
    // Alpha is fully opaque while alive; fades only in the final ~0.25s of
    // life. Decouples "how long the float is visible" from "alpha at
    // spawn" — important because endGame() clamps life on the killing
    // blow to 0.25s, which under the old life-proportional alpha would
    // draw the killing-blow float semi-transparent from frame 1. Fade
    // threshold matches the endGame clamp so a clamped float renders
    // fully opaque at spawn and then decays cleanly.
    ctx.globalAlpha = ft.life >= 0.25 ? 1 : Math.max(0, ft.life / 0.25);
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
  // Death is the ceiling (ANIMATION.md #5). Loser SHATTERS in a big radial
  // burst, with a white camera-snap frame at the kill instant. Line-drawn,
  // deterministic. The kill-cam push-in + K.O. text were removed — the
  // shatter + flash + death voice + koHit boom are the kill stamp on their
  // own, and the static camera keeps winner + loser + lingering items all
  // framed at the climax.
  if (game.koTimer > 0 && game.winner) {
    const loser = game.winner === game.red ? game.blue : game.red;
    // Fire the kill stamp on the first frame of the finish window — no
    // kill-cam to wait for. `koArriveAt` still tracks when the death
    // ceremony began (used as the prog anchor below).
    if (game.koArriveAt == null) {
      game.koArriveAt = game.koTimer;
      game.flashFrame = 0.12;                 // camera-snap flash
      sfx('death', loser.ability, loser.x);   // death voice
      sfx('koHit');                            // K.O. boom
    }
    const prog = Math.min(1, (game.koArriveAt - game.koTimer) / DEATH_DUR);
    drawDeath(loser, prog);
  }

  ctx.restore();   // end arena clip (matches the save before drawArenaBackdrop)

  // Overlays from here on are positioned in DEVICE pixels (layout.*), so leave
  // camera space — the clip restore left the camera transform active.
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // VS-intro reveal — canvas-drawn, over the arena region (was DOM/CSS).
  if (game.introPlaying) drawVsIntro();

  // White camera-snap frame at the kill instant — fills the ARENA rect in
  // device space (the arena "snaps", not the surrounding HUD), independent of
  // the camera transform.
  if (game.flashFrame > 0) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.8, game.flashFrame * 6).toFixed(2)})`;
    ctx.fillRect(layout.arenaX, layout.arenaY, layout.arenaPx, layout.arenaPx);
  }
}

