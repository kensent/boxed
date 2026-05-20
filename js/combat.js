// ============================================================================
// === COMBAT =================================================================
// damage() — applies defensive passives (Jester dodge, Knight plate armor,
//   Wizard mana shield, Duelist counter) and handles death.
// ============================================================================

// --- Impact juice -----------------------------------------------------------
// shake(mag): kick the screen-shake. mag is roughly "pixels of displacement".
// Bigger hits call this with a bigger mag, so impact scales with damage.
function shake(mag) {
  if (headless || !game) return;
  // Don't let a small hit cut short a big shake already in progress.
  game.shakeMag = Math.max(game.shakeMag, mag);
  game.shakeTime = Math.max(game.shakeTime, 0.18 + mag * 0.012);
}
// hitStop(dur): freeze the sim for a few ms. The micro-pause makes a hit land
// hard — it's the core trick behind "punchy" game feel. NOTE: not guarded by
// `headless` — the headless runner replicates the loop's hitstop handling so
// a hunted seed reproduces the exact same fight when watched live.
function hitStop(dur) {
  if (!game) return;
  game.hitStop = Math.max(game.hitStop, dur);
}

function damage(target, dmg, srcKind, src) {
  if (target.dead) return;
  // Fog (closing-ring) damage is environmental — bypasses every dodge, shield,
  // parry, and reduction. It also doesn't spawn a damage float (the ring visual
  // and the draining HP bar already make it obvious).
  if (srcKind === 'fog') {
    target.hp -= dmg;
    target.flash = 0.12;
    if (target.hp <= 0) {
      target.hp = 0;
      target.dead = true;
      sfx('death', null, target.x);
      spawnParticles(target.x, target.y, 24, '#ffe83d', 'shard');
      endGame();
    }
    return;
  }
  // Jester: Uncanny Dodge — phases through next hit, plus 0.3s follow-up invuln window
  if (target.ability === 'blink' && target.dodgeInvuln > 0) {
    return;
  }
  if (target.ability === 'blink' && target.dodgeReady) {
    target.dodgeReady = false;
    target.dodgeTimer = 6.0;
    target.dodgeInvuln = 0.3;
    target.negateFlash = 0.25;
    spawnParticles(target.x, target.y, 8, '#e8d8b8', 'spark');
    sfx('negate', null, target.x);
    return;
  }
  // (Cannoneer's old Powder Store invuln-on-windup was removed — its passive
  // is now SIEGE ROUNDS, an offensive armor-piercing trait handled below.)
  // Duelist: parry window fully absorbs PROJECTILES (reflection handled in the
  // projectile loop). Melee hits fall through to COUNTER instead.
  if (target.ability === 'riposte' && target.parryTimer > 0 && srcKind === 'projectile') {
    target.negateFlash = 0.25;
    spawnParticles(target.x, target.y, 10, '#c0c0e8', 'spark');
    sfx('parry', null, target.x);
    return;
  }
  // Knight: Plate Armor — flat −2 dmg per hit (min 1).
  if (target.ability === 'sword') {
    dmg = Math.max(1, dmg - 2);
  }
  // Wizard: Mana Shield — 20% dmg reduction per live orb (1 orb=20%, 4 orbs=80%).
  // Each hit spends one orb. Out of orbs = no shield. More orbs = stronger shield,
  // so the Wizard trades offense (orbs hitting the enemy) against defense.
  let shielded = false;
  if (target.ability === 'cast') {
    const orbIdx = game.projectiles.findIndex(p => p.kind === 'orb' && p.team === target.team && !p.spent);
    if (orbIdx !== -1) {
      const orbCount = game.projectiles.filter(p => p.kind === 'orb' && p.team === target.team && !p.spent).length;
      dmg = dmg * (1 - orbCount * 0.2); // 20% reduction per orb (1=20%, 4=80%)
      game.projectiles[orbIdx].spent = true; // marked; filter removes it cleanly next pass
      shielded = true;
    }
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
  // Drain is the exception: a long gap so its slow ticks stay one calm number.
  const gap = (srcKind === 'drain' || srcKind === 'hazard') ? 1100 : BATCH_GAP;
  const burstMerge = target.dmgFloat && target.dmgFloat.open
    && (nowT - target.dmgFloat.lastHit) < gap;
  const feedbackDmg = burstMerge ? (target.dmgFloat.total + Math.ceil(dmg)) : dmg;
  // Impact feedback scales with damage magnitude — a chip barely registers,
  // a big hit rocks the screen, flashes hard, and briefly freezes the sim.
  // Fog/drain are environmental/continuous — they skip the punchy feedback.
  const big = Math.min(1, feedbackDmg / 26); // 0..1, ~1 at the heaviest hits
  if (srcKind !== 'fog' && srcKind !== 'drain') {
    target.flash = 0.14 + big * 0.20;
    shake(2 + big * 9);
    if (feedbackDmg >= 12) hitStop(0.03 + big * 0.05);
    spawnParticles(target.x, target.y, 3 + Math.round(big * 9),
                   target.team === 'red' ? '#ff6b6b' : '#6bb6ff', 'spark');
  } else {
    target.flash = 0.12;
  }
  // Sound: drain ticks are silent — the sustained `drain` beam drone (played
  // once when the channel starts) covers the whole leech. Other hits play a
  // punchier sound, pitch-scaled to damage magnitude.
  if (srcKind !== 'drain' && srcKind !== 'hazard') sfx('hit', dmg, target.x);
  // Damage float — debounced (see BATCH_GAP above). An "open" float sits frozen
  // in place accumulating hits; the float update loop resolves it once a gap
  // passes with no new hit, at which point it punches once and floats off.
  {
    if (burstMerge) {
      // Still in the burst — fold this hit into the open float.
      target.dmgFloat.total += Math.ceil(dmg);
      target.dmgFloat.text = '-' + target.dmgFloat.total;
      target.dmgFloat.lastHit = nowT;        // reset the debounce timer
      target.dmgFloat.big = (srcKind === 'drain') ? 0.15 : big;
      // Re-punch on every hit (drain excepted — its slow ticks stay calm).
      if (srcKind !== 'drain') target.dmgFloat.age = 0;
    } else {
      // Burst ended (or first hit) — start a fresh float. If a previous float
      // is still on screen, spawn ABOVE it so successive bursts stack into a
      // readable column instead of overlapping.
      let spawnY = target.y - FIGHTER_SIZE;
      if (target.dmgFloat && target.dmgFloat.life > 0) {
        spawnY = Math.min(spawnY, target.dmgFloat.y - 16);
      }
      const f = { x: target.x, y: spawnY, vy: -40, life: 0.8,
                  text: '-' + Math.ceil(dmg), color: target.team === 'red' ? '#ff2e2e' : '#2e9eff',
                  total: Math.ceil(dmg), big: (srcKind === 'drain') ? 0.15 : big,
                  age: 0, open: true, lastHit: nowT, gap: gap,
                  // Drain floats live for the whole channel (~1.2s) — long
                  // enough for the target to wander away from a fixed number.
                  // Tag the target so the update loop tracks it while open.
                  follow: (srcKind === 'drain') ? target : null };
      game.floatTexts.push(f);
      target.dmgFloat = f;
    }
  }
  if (shielded) {
    spawnParticles(target.x, target.y, 10, '#c77dff', 'rune');
  }
  spawnParticles(target.x, target.y, 6, target.team === 'red' ? '#ff2e2e' : '#2e9eff', 'shard');
  if (target.hp <= 0) {
    target.dead = true;
    sfx('death', null, target.x);
    spawnParticles(target.x, target.y, 24, '#ffe83d', 'shard');
    endGame();
  }
  // Duelist: COUNTER — melee hits trigger an automatic counter-thrust back at the attacker.
  // srcKind='counter' on the reply prevents infinite loops (Duelist vs Duelist).
  if (!target.dead && target.ability === 'riposte' && !srcKind && src && !src.dead) {
    target.counterAnim = 0.16;
    target.counterDir = Math.atan2(src.y - target.y, src.x - target.x);
    sfx('counter', null, target.x);
    spawnParticles(src.x, src.y, 5, '#c0c0e8', 'spark');
    damage(src, 8, 'counter');
  }
  return dmg;
}
