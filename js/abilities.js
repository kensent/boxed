// ============================================================================
// === ABILITIES ==============================================================
// fireAbility() — what each fighter does when their cooldown fires.
// resolveAim() — fires the actual projectile after windup completes
//   (Priest lightning, Cannoneer cannon shot).
// ============================================================================

function fireAbility(f, enemy) {
  // Cast sound — keyed off ability id. Windup abilities (lightning, cannon, iai)
  // are handled at their resolution point instead, so the sound lands on the
  // actual shot/strike rather than the start of the charge.
  if (f.ability !== 'lightning' && f.ability !== 'cannon' && f.ability !== 'iai'
      && f.ability !== 'drain' && f.ability !== 'cast') {
    sfx(f.ability === 'raise' ? 'scythe' : f.ability, null, f.x);
  } else if (f.ability === 'iai') {
    sfx('iai', null, f.x); // rising tension hum during the windup
  }
  // Wizard's cast sound is played inside the 'cast' case instead, so it only
  // sounds when orbs actually spawn (not when the 3-orb cap blocks the cast).
  switch (f.ability) {
    case 'lightning': {
      // Wind-up: charge, then aim and fire at the moment of release
      f.aimTimer = 0.45;
      f.aimAbility = 'lightning';
      sfx('chargeUp', null, f.x);
      // slow the priest during wind-up
      f.vx *= 0.3; f.vy *= 0.3;
      break;
    }
    case 'arrow': {
      // No wind-up: fire immediately while moving
      const ang = Math.atan2(enemy.y - f.y, enemy.x - f.x);
      f.shotCount = (f.shotCount || 0) + 1;
      const isVolley = (f.shotCount % 4 === 0);
      if (isVolley) {
        // 4-arrow fan — same 7 dmg per arrow, just more of them
        const spread = 0.10;
        for (let i = 0; i < 4; i++) {
          const a2 = ang + (i - 1.5) * spread;
          game.projectiles.push({ x:f.x, y:f.y, vx:Math.cos(a2)*280, vy:Math.sin(a2)*280, team:f.team, dmg:7, life:2.2, kind:'arrow', size:3, homing:0, angle:a2 });
        }
        // visual cue: green particle burst at the archer
        spawnParticles(f.x, f.y, 8, '#3dff8a', 'streak');
      } else {
        game.projectiles.push({ x:f.x, y:f.y, vx:Math.cos(ang)*280, vy:Math.sin(ang)*280, team:f.team, dmg:7, life:2.2, kind:'arrow', size:3, homing:0, angle:ang });
      }
      break;
    }
    case 'tackle': {
      const ang = Math.atan2(enemy.y - f.y, enemy.x - f.x);
      f.vx = Math.cos(ang) * f.speed * 3;
      f.vy = Math.sin(ang) * f.speed * 3;
      f.dashTimer = 0.4;
      spawnParticles(f.x, f.y, 8, '#ff5555', 'shard');
      break;
    }
    case 'sword': {
      // Lunge toward enemy as part of the swing
      const ang = Math.atan2(enemy.y - f.y, enemy.x - f.x);
      f.vx = Math.cos(ang) * f.speed * 2.5;
      f.vy = Math.sin(ang) * f.speed * 2.5;
      f.dashTimer = 0.25;
      f.swingTimer = 0.3;
      f.dashHit = false;
      spawnParticles(f.x, f.y, 6, '#dfefff', 'spark');
      break;
    }
    case 'mine': {
      game.mines.push({ x:f.x, y:f.y, team:f.team, dmg:f.dmg, life:6, armed:0.5, size:10 });
      spawnParticles(f.x, f.y, 4, '#3a2a1a', 'smoke');
      break;
    }
    case 'cast': {
      // Spawn 2 orb projectiles. They home toward enemy, don't despawn at edges,
      // and can be parried/reflected by Duelist. Max 4 alive per team.
      const existing = game.projectiles.filter(p => p.team === f.team && p.kind === 'orb').length;
      const toSpawn = Math.min(2, 4 - existing);
      // At the 4-orb cap nothing spawns — flag it so the cooldown is refunded
      // (a short retry) instead of burning the full cast on a no-op, and skip
      // the sound + particles so a capped cast has no misleading feedback.
      f.castCapped = (toSpawn <= 0);
      for (let i = 0; i < toSpawn; i++) {
        const a = rng() * Math.PI * 2;
        game.projectiles.push({
          x: f.x, y: f.y,
          vx: Math.cos(a) * 120, vy: Math.sin(a) * 120,
          team: f.team, dmg: 11, life: 9,
          kind: 'orb', size: 6, homing: 480,
          noEdgeDespawn: true,
          spin: 0,
        });
      }
      if (toSpawn > 0) {
        sfx('cast', null, f.x);
        spawnParticles(f.x, f.y, 12, '#c77dff', 'rune');
      }
      break;
    }
    case 'blink': {
      // Teleport behind enemy's heading. Brief invuln during the blink itself.
      const enemyHeading = Math.atan2(enemy.vy, enemy.vx);
      const behindAng = enemyHeading + Math.PI;
      const tx = enemy.x + Math.cos(behindAng) * 25;
      const ty = enemy.y + Math.sin(behindAng) * 25;
      // Save starting position for the blink trail VFX
      f.blinkFromX = f.x;
      f.blinkFromY = f.y;
      f.blinkFx = 0.35;
      // Sparkle at the depart point
      spawnParticles(f.x, f.y, 14, '#e8d8b8', 'spark');
      // Clamp to arena
      f.x = Math.max(f.size, Math.min(game.w - f.size, tx));
      f.y = Math.max(f.size, Math.min(game.h - f.size, ty));
      // Sparkle at the arrive point
      spawnParticles(f.x, f.y, 14, '#fff', 'spark');
      // Stab — f.dmg if in range after blink
      if (dist(f, enemy) < f.size + enemy.size + 4) {
        damage(enemy, f.dmg, undefined, f);
      }
      // After blink, face away from enemy so jester drifts off
      const ang = Math.atan2(f.y - enemy.y, f.x - enemy.x);
      f.vx = Math.cos(ang) * f.speed;
      f.vy = Math.sin(ang) * f.speed;
      break;
    }
    case 'cannon': {
      // 1.0s windup, then fires a fast straight-line cannonball
      f.aimTimer = 1.0;
      f.aimAbility = 'cannon';
      sfx('chargeBig', null, f.x);
      // Stop in place during windup
      f.vx = 0; f.vy = 0;
      break;
    }
    case 'riposte': {
      // Short forward lunge: f.dmg on contact, plus 0.25s parry window at the start
      const ang = Math.atan2(enemy.y - f.y, enemy.x - f.x);
      f.vx = Math.cos(ang) * f.speed * 2.2;
      f.vy = Math.sin(ang) * f.speed * 2.2;
      f.dashTimer = 0.3;
      f.parryTimer = 0.25;
      f.swingTimer = 0.3;
      f.dashHit = false;
      spawnParticles(f.x, f.y, 6, '#c0c0e8', 'spark');
      break;
    }
    case 'raise': {
      // Spawn a skeleton at current position — slow ground unit, persists until killed
      const a = rng() * Math.PI * 2;
      game.skeletons.push({
        x: f.x + Math.cos(a) * 10,
        y: f.y + Math.sin(a) * 10,
        vx: 0, vy: 0,
        // Real HP: damage now goes through damageSkeleton() with each
        // attacker's true dmg, so this is a meaningful pool. Tune via SKEL_HP.
        team: f.team, hp: SKEL_HP, maxHp: SKEL_HP, dmg: f.dmg, size: 8,
        attackCd: 0.5, spin: 0, hitCd: 0, flash: 0,
        chargeTimer: 0, chargeHit: false,
      });
      break;
    }
    case 'sweep': {
      // Reaper: dash + 360° scythe spin. Damage applied during sweep window (see step()).
      const enemy = f === game.red ? game.blue : game.red;
      const ang = Math.atan2(enemy.y - f.y, enemy.x - f.x);
      f.vx = Math.cos(ang) * f.speed * 1.8;
      f.vy = Math.sin(ang) * f.speed * 1.8;
      f.dashTimer = 0.25;
      f.sweepTimer = 0.3;
      f.sweepHit = false;
      f.dashHit = false;
      spawnParticles(f.x, f.y, 5, '#aa0000', 'shard');
      break;
    }
    case 'iai': {
      // Ronin: 0.7s windup, then teleport-step strike. Resolve passive reduces dmg during windup.
      f.iaiWindup = 0.7;
      f.iaiHit = false;
      spawnParticles(f.x, f.y, 8, '#e8c020', 'rune');
      break;
    }
    case 'hex': {
      // Witch: fires a fast bouncing projectile. Up to 5 wall bounces.
      const enemy = f === game.red ? game.blue : game.red;
      const ang = Math.atan2(enemy.y - f.y, enemy.x - f.x);
      game.projectiles.push({
        x: f.x, y: f.y,
        vx: Math.cos(ang) * 280, vy: Math.sin(ang) * 280,
        team: f.team, dmg: 11, life: 4.5,
        kind: 'hex', size: 5, homing: 60,
        bounces: 5,
        spin: 0,
      });
      spawnParticles(f.x, f.y, 3, '#7dff3d', 'rune');
      break;
    }
    case 'grapple': {
      // Hunter: fires a hook projectile. On hit it deals damage AND tethers the
      // enemy, reeling them in. CRIPPLING HOOK (passive) slows the hooked enemy
      // — applied in the projectile-hit code.
      const enemy = f === game.red ? game.blue : game.red;
      const ang = Math.atan2(enemy.y - f.y, enemy.x - f.x);
      game.projectiles.push({
        x: f.x, y: f.y,
        vx: Math.cos(ang) * 420, vy: Math.sin(ang) * 420,
        team: f.team, dmg: f.dmg, life: 0.55,
        kind: 'hook', size: 5, homing: 0,
        hookSrc: f,
      });
      spawnParticles(f.x, f.y, 6, '#c89060', 'spark');
      break;
    }
    case 'drain': {
      // Warlock: lock a drain beam onto the enemy if within close range. Channels
      // for 1.2s, ticking f.dmg every 0.2s and healing the Warlock (Leech passive).
      // If the enemy is out of range the cast whiffs — we flag it so the cooldown
      // block can retry quickly instead of burning the full 2.2s on a no-op.
      const enemy = f === game.red ? game.blue : game.red;
      const d = Math.hypot(enemy.x - f.x, enemy.y - f.y);
      if (d < 140) {
        f.drainTimer = 1.2;
        f.drainTickTimer = 0;
        f.drainTarget = enemy;
        f.drainElapsed = 0;
        sfx('drain', null, f.x); // sustained beam drone — only on a real connect
        f.drainWhiffed = false;
      } else {
        f.drainWhiffed = true;
      }
      break;
    }
    case 'wildcard': {
      // Gambler: start the die roll. The sprite becomes a tumbling die during
      // the windup; the face it lands on (resolveAim) picks the attack pattern.
      // High rolls (5-6) get a longer, more dramatic settle.
      f.gamblerRoll = 1 + Math.floor(rng() * 6);            // the face (1-6)
      const dramatic = f.gamblerRoll >= 5;
      f.aimTimer = dramatic ? 1.1 : 0.8;                    // tumble + settle
      f.aimAbility = 'wildcard';
      sfx('wildcard', null, f.x);
      break;
    }
  }
}

function resolveAim(f) {
  // Called when aimTimer hits 0
  const target = f === game.red ? game.blue : game.red;
  if (target.dead) { f.aimAbility = null; return; }
  if (f.aimAbility === 'lightning') {
    // Aim is taken at the moment of release, not at the start of the windup
    const ang = Math.atan2(target.y - f.y, target.x - f.x);
    game.projectiles.push({ x:f.x, y:f.y, vx:Math.cos(ang)*200, vy:Math.sin(ang)*200, team:f.team, dmg:18, life:2.2, kind:'lightning', size:5, homing:70, cruise:200 });
    spawnParticles(f.x, f.y, 8, '#ffe83d', 'cross');
    sfx('lightning', null, f.x);
  } else if (f.aimAbility === 'cannon') {
    // Straight line, fast, big, no homing. Muzzle flash + smoke.
    const ang = Math.atan2(target.y - f.y, target.x - f.x);
    game.projectiles.push({ x:f.x, y:f.y, vx:Math.cos(ang)*340, vy:Math.sin(ang)*340, team:f.team, dmg:31, life:1.8, kind:'cannon', size:7, homing:0, angle:ang });
    spawnParticles(f.x + Math.cos(ang) * f.size, f.y + Math.sin(ang) * f.size, 16, '#ff8c1a', 'shard');
    spawnParticles(f.x + Math.cos(ang) * f.size, f.y + Math.sin(ang) * f.size, 14, '#666', 'smoke');
    sfx('cannon', null, f.x);
    shake(7); // muzzle kick
  } else if (f.aimAbility === 'wildcard') {
    // The die has settled — the face (gamblerRoll, 1-6) picks the attack
    // pattern. Every face throws spinning gold COINS; higher faces are worth
    // more on average (verified monotonic in the sim). COIN_DMG (top-level)
    // is the single balance lever — per-coin damage.
    const ang = Math.atan2(target.y - f.y, target.x - f.x);
    // The die has just settled on its face — a hard clack, brighter on a
    // high roll (5-6) to signal the lucky result before the coins fly.
    sfx(f.gamblerRoll >= 5 ? 'diceLandBig' : 'diceLand', null, f.x);
    // shoot a coin at a given heading offset (radians) from the aim line
    const coin = (offset, speed, homing) => {
      const a = ang + offset;
      game.projectiles.push({
        x: f.x, y: f.y,
        vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
        team: f.team, dmg: COIN_DMG, life: 2.4,
        kind: 'coin', size: 5, homing: homing || 0, spin: 0,
        cruise: speed,   // re-normalised to each frame so homing can't stall it
      });
      sfx('coinThrow', null, f.x);
    };
    const roll = f.gamblerRoll;
    if (roll === 1) {
      // Lone Coin — one fast straight coin.
      coin(0, 320, 0);
    } else if (roll === 2) {
      // Twin Toss — two coins, the second fired a beat after the first.
      coin(0, 300, 0);
      f.gamblerShots.push({ delay: 0.14, offset: 0, speed: 300, homing: 0 });
    } else if (roll === 3) {
      // Coin Spread — three coins in a simultaneous fan.
      coin(-0.26, 290, 0); coin(0, 290, 0); coin(0.26, 290, 0);
    } else if (roll === 4) {
      // Seeking Coins — three homing coins in a tight spread, all hunting the
      // enemy. The "inevitable" roll: slower coins, but they curve and chase.
      coin(-0.12, 240, 150);
      coin(0, 240, 150);
      coin(0.12, 240, 150);
    } else if (roll === 5) {
      // Coin Nova — a full ring of coins bursts out, then each curves back
      // and converges on the enemy (homing). Spectacle + guaranteed damage.
      const N = 10;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        game.projectiles.push({
          x: f.x, y: f.y,
          vx: Math.cos(a) * 200, vy: Math.sin(a) * 200,
          team: f.team, dmg: COIN_DMG, life: 2.6,
          kind: 'coin', size: 5, homing: 0, spin: 0,
          cruise: 200,   // re-normalised each frame so the converge can't stall
          // delayed homing — flies out free, then hunts after novaArm
          novaArm: 0.32,
        });
      }
      // One throw sound for the whole ring burst — ten would be a noise wall.
      sfx('coinThrow', null, f.x);
      shake(5);
    } else {
      // Fortune's Barrage — a sustained storm of coins toward the enemy.
      // 8 coins total (1 immediate + 7 queued): face 6 is the jackpot, but a
      // 9-coin barrage made rolling 6 a near-auto-win, pulling the Gambler's
      // overall rate too high. 8 keeps it the clear best roll without that.
      coin(0, 330, 30);
      for (let i = 1; i < 8; i++) {
        f.gamblerShots.push({
          delay: i * 0.07,
          offset: (rng() - 0.5) * 0.3,
          speed: 320 + rng() * 40,
          homing: 30,
        });
      }
      shake(8);
      hitStop(0.05);
    }
    // Low roll (1-2) — LOADED DICE: halve the remaining cooldown so an
    // unlucky roll comes back around faster. Applied here, at resolve, since
    // the roll settles ~1s after the ability fired (cdTimer was already set).
    if (roll <= 2) {
      f.cdTimer = Math.min(f.cdTimer, f.cd * 0.5);
      f.loadedTimer = f.cdTimer;   // LOADED badge shows during the rushed cooldown
    }
    f.gamblerRefund = false;
    spawnParticles(f.x, f.y, 8 + roll * 2, '#ffd23d', 'spark');
  }
  f.aimAbility = null;
  // restore speed
  const sp = Math.hypot(f.vx, f.vy) || 1;
  f.vx = f.vx / sp * f.speed;
  f.vy = f.vy / sp * f.speed;
  // If we were standing still during cannon windup, kick to a random heading
  if (Math.hypot(f.vx, f.vy) < 1) {
    const a = rng() * Math.PI * 2;
    f.vx = Math.cos(a) * f.speed;
    f.vy = Math.sin(a) * f.speed;
  }
}
