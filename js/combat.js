// ============================================================================
// === COMBAT =================================================================
// damage() — applies defensive passives (Jester dodge, Wizard mana shield,
//   Duelist counter) and handles death.
// ============================================================================

// --- Impact juice -----------------------------------------------------------
// shake(mag): kick the screen-shake. mag is roughly "pixels of displacement".
// Bigger hits call this with a bigger mag, so impact scales with damage.
function shake(mag) {
  // Disabled for the animation-system teardown (blank canvas). The setters are
  // gone so the draw() shake transform stays inert. Rebuild with the new system.
  return;
}
// (hitStop / frame-freeze on high-dmg hits removed — see commit history.
//  Was a deterministic sim pause for "feel" but it stuttered the fight tempo;
//  the visual punch lives in the damage float + recoil + flash now.)

function damage(target, dmg, srcKind, src) {
  if (target.dead) return;
  // Hunter BARBED LINE reel-tick is PURE — bypasses every defensive layer
  // (no Jester decoy spawn, no Duelist parry absorb, no Wizard Mana
  // Shield reduction / orb consumption). The line is in the flesh already,
  // there's no intermediate projectile to absorb. Stays fractional too:
  // per-frame sub-1.0 ticks would round to 0 (or worse, get doubled by
  // 0.5→1 rounding). Float text rounds the running total below.
  const isPure = srcKind === 'reel';
  if (!isPure) {
    // Jester DOPPELGANGER: every hit Jester actually takes spawns a phantom
    // decoy at her current position. Decoys are stationary targets that absorb
    // the NEXT incoming attack on Jester (decoys are added to defender.decoys
    // and resolved as targets by pickTarget; hits that land on a decoy never
    // reach this damage() call — the projectile/melee hit loops route them).
    // So if we got HERE on a Jester hit, no decoy intercepted it; spawn a
    // fresh one for the NEXT incoming attack.
    if (target.ability === 'blink') {
      target.decoys = target.decoys || [];
      if (target.decoys.length >= target.decoyCap) {
        target.decoys.shift();   // oldest fades to make room (continuous rotation)
      }
      target.decoys.push({
        x: target.x, y: target.y,
        life: target.decoyLife,
        decoy: true, dead: false,
        // Visual fields so drawShape can render the phantom Jester.
        shape: target.shape, color: target.color, accent: target.accent,
        team: target.team,
      });
    }
    // Duelist COUNTER — the RIPOSTE thrust's active window IS the parry. During
    // it: melee hits are absorbed (no damage, no return tax) and projectiles are
    // reflected back at their shooter (existing in-flight reflect in the
    // projectile loop). There is NO separate counter-thrust proc — the thrust
    // itself is Duelist's response, and its damage comes from the offensive
    // contact during the dash, not a reactive thrust on incoming hits.
    if (target.ability === 'riposte' && target.parryTimer > 0
        && (srcKind === 'projectile' || (!srcKind && src && !src.dead))) {
      target.negateFlash = 0.25;
      sfx('parry', null, target.x);
      return;
    }
    // Wizard: Mana Shield — shieldReduction dmg reduction per live orb, up to orbCap*shieldReduction.
    // Each hit spends one orb. Out of orbs = no shield. More orbs = stronger shield,
    // so the Wizard trades offense (orbs hitting the enemy) against defense.
    if (target.ability === 'cast') {
      const orbIdx = game.projectiles.findIndex(p => p.kind === 'orb' && p.team === target.team && !p.spent);
      if (orbIdx !== -1) {
        const orbCount = game.projectiles.filter(p => p.kind === 'orb' && p.team === target.team && !p.spent).length;
        dmg = dmg * (1 - orbCount * target.shieldReduction);
        game.projectiles[orbIdx].spent = true; // marked; filter removes it cleanly next pass
        // Absorb shimmer — discrete hits only (a drain/hazard DoT would stutter it).
        if (srcKind !== 'drain' && srcKind !== 'hazard') sfx('shield', null, target.x);
      }
    }
    // Round to an honest integer before applying — what hits HP is exactly what
    // the floating number shows (after all reductions). Fog uses the early-return
    // path above and stays fractional (per-frame DoT would round to 0).
    dmg = Math.round(dmg);
  }
  target.hp -= dmg;
  // Cumulative damage for feedback: a multi-hit burst (e.g. the Archer's
  // 4-arrow volley = four 7-dmg calls) should FEEL like its total, not like
  // one arrow. If this hit will merge into a recent float, the juice scales
  // off the running total; otherwise it's just this hit.
  const nowT = performance.now();
  // Damage floats DEBOUNCE: a float stays "open" and keeps absorbing hits as
  // long as the next hit arrives within BATCH_GAP of the last one. The window
  // RESETS on every hit, so a burst defines its own size — a tight 8-coin
  // barrage becomes one number; two attacks with a real pause become two.
  // While open the number updates quietly (no re-punch, doesn't rise yet);
  // once a gap passes with no new hit it RESOLVES — one punch, then floats off.
  // Drain / hazard / reel are the exceptions: long gap so their per-tick
  // damage merges into one calm accumulating float instead of N tiny ones.
  const gap = (srcKind === 'drain' || srcKind === 'hazard' || srcKind === 'reel') ? 1100 : BATCH_GAP;
  const burstMerge = target.dmgFloat && target.dmgFloat.open
    && (nowT - target.dmgFloat.lastHit) < gap;
  // RAW running total (not the ceil'd display total) drives the balance-relevant
  // feedback (big + hitStop), so the display rounding never leaks into the sim —
  // and an HP/damage rescale stays a clean linear transform of this value.
  const feedbackDmg = burstMerge ? (target.dmgFloat.rawTotal + dmg) : dmg;
  // Impact feedback scales with damage magnitude — a chip barely registers,
  // a big hit rocks the screen and flashes hard. Drain (the continuous channel
  // tick) skips the punchy feedback so a sustained beam doesn't machine-gun
  // the shake. (The old high-dmg hitStop frame-freeze was removed.)
  const big = Math.min(1, feedbackDmg / 260); // 0..1, ~1 at the heaviest hits
  if (srcKind === 'drain') {
    target.flash = 0.12;
  } else if (srcKind !== 'reel') {
    // Reel ticks per-frame for the 0.3s tether — flash/shake would
    // machine-gun. The accumulating float carries the feedback.
    target.flash = 0.14 + big * 0.20;
    shake(2 + big * 9);
  }
  // Victim recoil — a melee body-contact hit (src present, no srcKind) knocks the
  // target's body back along the hit direction. Visual only: the sim reads neither
  // recoilTimer nor recoilDir, and the fighter's true x/y is untouched.
  if (src && !srcKind) {
    target.recoilDir = Math.atan2(target.y - src.y, target.x - src.x);
    target.recoilTimer = 0.16;
    target.recoilMag = 13;
  }
  // Sound: drain ticks are silent — the sustained `drain` beam drone (played
  // once when the channel starts) covers the whole leech. Other hits play a
  // punchier sound, pitch-scaled to damage magnitude.
  // Melee body-contact crack only (src present, no srcKind). Projectiles, mines,
  // hooks, and bone bursts sound their own per-kind impact at their spawn sites.
  if (src && !srcKind) sfx('hit', { mag: dmg, mat: src.ability }, target.x);
  // Damage float — debounced (see BATCH_GAP above). An "open" float sits frozen
  // in place accumulating hits; the float update loop resolves it once a gap
  // passes with no new hit, at which point it punches once and floats off.
  {
    if (burstMerge) {
      // Still in the burst — fold this hit into the open float. Bleed/reel
      // dmg stays fractional, so the display rounds the running total.
      target.dmgFloat.total += dmg;
      target.dmgFloat.rawTotal += dmg;       // running sum for sim feedback
      target.dmgFloat.text = '-' + Math.round(target.dmgFloat.total);
      target.dmgFloat.lastHit = nowT;        // reset the debounce timer
      target.dmgFloat.big = (srcKind === 'drain' || srcKind === 'reel') ? 0.15 : big;
      // Re-punch on every hit (drain/reel excepted — their slow ticks stay calm).
      if (srcKind !== 'drain' && srcKind !== 'reel') target.dmgFloat.age = 0;
    } else {
      // Burst ended (or first hit) — start a fresh float. If a previous float
      // is still on screen, spawn ABOVE it so successive bursts stack into a
      // readable column instead of overlapping.
      let spawnY = target.y - FIGHTER_SIZE;
      const prevFloat = target.dmgFloat;
      if (prevFloat && prevFloat.life > 0 && prevFloat.y > target.y - FIGHTER_SIZE - 52) {
        spawnY = Math.min(spawnY, prevFloat.y - 16);
      }
      const f = { x: target.x, y: spawnY, vy: -40, life: 0.8,
                  text: '-' + Math.round(dmg), color: target.team === 'red' ? '#ff2e2e' : '#2e9eff',
                  total: dmg, rawTotal: dmg, big: (srcKind === 'drain' || srcKind === 'reel') ? 0.15 : big,
                  age: 0, open: true, lastHit: nowT, gap: gap,
                  // Drain floats live for the whole channel (~1.2s) — long
                  // enough for the target to wander away from a fixed number.
                  // Tag the target so the update loop tracks it while open.
                  follow: (srcKind === 'drain') ? target : null };
      game.floatTexts.push(f);
      target.dmgFloat = f;
    }
  }
  if (target.hp <= 0) {
    target.dead = true;
    endGame();  // death sound fires when the kill-cam arrives + body shatters (draw)
  }
  // (Duelist's COUNTER auto-thrust is now gated on the parry window — see the
  // melee-parry block at the top of this function. Outside the parry window,
  // melee hits land clean with no counter response.)
  return dmg;
}
