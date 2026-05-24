// ============================================================================
// === ABILITIES ==============================================================
// fireAbility() — what each fighter does when their cooldown fires.
// resolveAim() — fires the actual projectile after windup completes
//   (Priest lightning, Cannoneer cannon shot).
// ============================================================================

// --- Geomancer helpers ------------------------------------------------------
// segIntersectsCircle(): point-on-segment closest to a circle, then radius test.
// Used by SIGIL to check which ley-lines actually cross the enemy body / decoys
// at the cast frame. r = enemy body radius + half line thickness.
function segIntersectsCircle(x1, y1, x2, y2, cx, cy, r) {
  const vx = x2 - x1, vy = y2 - y1;
  const len2 = vx * vx + vy * vy || 1;
  const t = Math.max(0, Math.min(1, ((cx - x1) * vx + (cy - y1) * vy) / len2));
  const qx = x1 + t * vx, qy = y1 + t * vy;
  return Math.hypot(qx - cx, qy - cy) < r;
}

// computeSigilLinks(): all-pairs network across the node set. Nodes are the
// fighter himself (index 0) + every planted wall-stone. Nearest-neighbour
// topology fails here because stones plant on walls, so a stone's nearest
// neighbours are ADJACENT along the same wall — those links hug the perimeter
// and never cross the arena interior where the enemy lives. All-pairs
// guarantees cross-arena lines; the fighter-as-node contributes radial lines
// FROM his position to each wall-stone (high-crossing-probability paths).
// linksPerStone is unused in this topology; kept on the fighter object in
// case future tunings want to clamp network density. Returns
// [{x1,y1,x2,y2}, …].
function computeSigilLinks(nodes, _linksPerStone) {
  const out = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      out.push({ x1: nodes[i].x, y1: nodes[i].y, x2: nodes[j].x, y2: nodes[j].y });
    }
  }
  return out;
}

function fireAbility(f, enemy) {
  // Uniform DOPPELGANGER rule: every fighter aims at the NEAREST of {real
  // enemy, ...enemy's decoys}. pickTarget() handles the choice; for fighters
  // that don't spawn decoys (everyone except Jester) the call collapses to
  // returning the real enemy and behaviour matches pre-DOPPELGANGER code.
  // Decoys have no velocity, so any predictive aim that reads .vx/.vy will
  // see 0 — predictions land on the decoy's current (stationary) position.
  const aim = pickTarget(f, enemy);
  const aimVX = aim.vx || 0, aimVY = aim.vy || 0;
  // Cast sound — keyed off ability id. Abilities that own their sound elsewhere
  // are excluded here: windup abilities (lightning, cannon, iai) play at their
  // resolution point so the sound lands on the actual shot/strike; cast/drain
  // play inside their switch cases; wildcard plays when the die starts tumbling.
  if (f.ability !== 'lightning' && f.ability !== 'cannon' && f.ability !== 'iai'
      && f.ability !== 'tackle' && f.ability !== 'drain' && f.ability !== 'cast'
      && f.ability !== 'sweep' && f.ability !== 'wildcard' && f.ability !== 'sigil') {
    sfx(f.ability, null, f.x);
  } else if (f.ability === 'iai') {
    sfx('iai', null, f.x); // rising tension hum during the windup
  }
  // Reaper sweep: sfx fires INSIDE the case only when a crescent actually
  // throws — the whiff branch (a crescent already in flight) retries every
  // 0.1s and would loop the cast sound. Same pattern as drain/cast.
  // Wizard's cast sound is played inside the 'cast' case instead, so it only
  // sounds when orbs actually spawn (not when the 3-orb cap blocks the cast).
  // Geomancer 'sigil' plays its sfx inside its case too — a no-stones whiff
  // still slams the staff (gesture is the gesture) but flags a cd refund.
  switch (f.ability) {
    case 'lightning': {
      // JUDGMENT — predictive light pillar. Lock the strike on the enemy's
      // PREDICTED position by leading their current velocity over the windup: it
      // lands on a straight-mover, but a wall-bounce mid-windup changes their
      // vector and dodges it (the counterplay). Heal moved to the hit (resolveAim).
      f.aimTimer = f.windupTime;
      f.aimAbility = 'lightning';
      // Lead the enemy's velocity, but CLAMP the strike inside the arena so the
      // pillar never lands in the void past a wall — it always targets a spot a
      // fighter could actually occupy. The bounce still dodges via genuine
      // mid-arena vector changes; hugging a wall no longer auto-escapes.
      f.judgeX = Math.max(FIGHTER_SIZE, Math.min(game.w - FIGHTER_SIZE, aim.x + aimVX * f.windupTime));
      f.judgeY = Math.max(FIGHTER_SIZE, Math.min(game.h - FIGHTER_SIZE, aim.y + aimVY * f.windupTime));
      sfx('chargeUp', null, f.x);
      // slow the priest during wind-up
      f.vx *= 0.3; f.vy *= 0.3;
      break;
    }
    case 'arrow': {
      // VOLLEY — no windup, fan f.volleyArrows arrows in a narrow spread.
      // SHATTER params ride on the projectile so a Duelist-parried arrow still
      // contributes to (and triggers) the same shatter cycle on its new target.
      const ang = Math.atan2(aim.y - f.y, aim.x - f.x);
      const spread = f.volleySpread;
      for (let i = 0; i < f.volleyArrows; i++) {
        const a2 = ang + (i - (f.volleyArrows - 1) / 2) * spread;
        game.projectiles.push({
          x: f.x, y: f.y, vx: Math.cos(a2) * 290, vy: Math.sin(a2) * 290,
          team: f.team, dmg: f.dmg, life: 2.2,
          kind: 'arrow', size: 3, homing: 0, angle: a2,
          shatterAt: f.shatterAt,
          shatterPerStack: f.shatterPerStack,
          embedDur: f.embedDur,
        });
      }
      f.fireKick = 0.12; f.fireKickMax = 0.12; f.fireDir = ang; // light bowstring snap-back
      break;
    }
    case 'tackle': {
      // RAMPAGE — windup, then launch at ramming speed and ricochet off the walls
      // for the rampage window. Aim is picked at RELEASE (in resolveAim), not at
      // cast: the windup is a coil-telegraph but the launch goes wherever the
      // enemy actually is when Berserker uncoils. That fits the "wild bruiser"
      // identity (the explosive moment of release is the aim event) and avoids
      // a 0.5s lead-the-enemy gap. Body keeps moving during the windup, just
      // slowed to 40% (see the speed-renormalize branch in step()'s Berserker
      // block) — bouncing still happens; the strain reads as tremble + charge
      // ring rather than a dead stop.
      f.aimTimer = f.windupTime;
      f.aimAbility = 'tackle';
      f.dashStartX = f.x; f.dashStartY = f.y;              // launch anchor (visual)
      sfx('rampageCoil', null, f.x);                       // primal growl inhaling for the launch
      break;
    }
    case 'mine': {
      // SAPPER STICK CHARGE — hurl a fused bomb at the enemy. It flies as a normal
      // projectile until it CONTACTS the enemy, at which point it sticks and the
      // fuse starts ticking; on fuse expire (step()): damage + BLAST RADIUS knockback.
      // Misses (edge, wall, life-expire) despawn the charge — variance lives in the
      // throw connect, not in random enemy wandering onto a placed mine.
      const ang = Math.atan2(aim.y - f.y, aim.x - f.x);
      game.projectiles.push({
        x: f.x, y: f.y,
        vx: Math.cos(ang) * f.throwSpeed, vy: Math.sin(ang) * f.throwSpeed,
        team: f.team, dmg: f.dmg, life: 2.0,
        kind: 'charge', size: 7, homing: 0, angle: ang,
        stuck: false, fuse: f.fuseTime, fuseTotal: f.fuseTime,
      });
      f.fireKick = 0.16; f.fireKickMax = 0.16; f.fireDir = ang; // throw gesture
      break;
    }
    case 'cast': {
      // Spawn f.orbsPerCast orb projectiles. They home toward enemy, don't despawn at edges,
      // and can be parried/reflected by Duelist. Max f.orbCap alive per team.
      // More orbs = stronger Mana Shield (f.shieldReduction each, up to orbCap*shieldReduction).
      const existing = game.projectiles.filter(p => p.team === f.team && p.kind === 'orb').length;
      const toSpawn = Math.min(f.orbsPerCast, f.orbCap - existing);
      // At the orbCap nothing spawns — flag it so the cooldown is refunded
      // (a short retry) instead of burning the full cast on a no-op, and skip
      // the sound so a capped cast has no misleading feedback.
      f.castCapped = (toSpawn <= 0);
      for (let i = 0; i < toSpawn; i++) {
        const a = rng() * Math.PI * 2;
        game.projectiles.push({
          x: f.x, y: f.y,
          vx: Math.cos(a) * f.orbSpeed, vy: Math.sin(a) * f.orbSpeed,
          team: f.team, dmg: f.dmg, life: 9,
          kind: 'orb', size: 6, homing: 480,
          noEdgeDespawn: true,
          spin: 0,
          cruise: f.orbSpeed,   // step()'s generic re-normaliser uses this
        });
      }
      if (toSpawn > 0) {
        sfx('cast', null, f.x);
        // visual: thrust the spellbook forward + a rune flare as the orbs release
        f.fireKick = 0.18; f.fireKickMax = 0.18; f.fireDir = Math.atan2(aim.y - f.y, aim.x - f.x);
      }
      break;
    }
    case 'blink': {
      // Teleport behind enemy's heading. Brief invuln during the blink itself.
      f.blinkFromX = f.x; f.blinkFromY = f.y; f.blinkFx = 0.3; // depart anchor + streak timer
      const enemyHeading = Math.atan2(enemy.vy, enemy.vx);
      const behindAng = enemyHeading + Math.PI;
      const tx = enemy.x + Math.cos(behindAng) * 25;
      const ty = enemy.y + Math.sin(behindAng) * 25;
      // Clamp to arena
      f.x = Math.max(FIGHTER_SIZE, Math.min(game.w - FIGHTER_SIZE, tx));
      f.y = Math.max(FIGHTER_SIZE, Math.min(game.h - FIGHTER_SIZE, ty));
      f.meleeImpact = 0.26; f.meleeImpactMax = 0.26; // mask gape-then-snap + pinch effect
      // Stab — f.dmg if in range after blink
      if (dist(f, enemy) < FIGHTER_SIZE + FIGHTER_SIZE + 4) {
        damage(enemy, f.dmg, undefined, f);
      }
      // After blink, face away from enemy so jester drifts off
      const ang = Math.atan2(f.y - enemy.y, f.x - enemy.x);
      f.vx = Math.cos(ang) * f.speed;
      f.vy = Math.sin(ang) * f.speed;
      break;
    }
    case 'cannon': {
      // f.windupTime windup, then fires a fast straight-line cannonball
      f.aimTimer = f.windupTime;
      f.aimAbility = 'cannon';
      sfx('chargeBig', null, f.x);
      // Stop in place during windup
      f.vx = 0; f.vy = 0;
      break;
    }
    case 'riposte': {
      // Short forward lunge: f.dmg on contact, plus 0.25s parry window at the start
      const ang = Math.atan2(aim.y - f.y, aim.x - f.x);
      f.vx = Math.cos(ang) * f.speed * 2.2;
      f.vy = Math.sin(ang) * f.speed * 2.2;
      f.dashTimer = 0.3;
      f.parryTimer = 0.25;
      f.swingTimer = 0.3;
      f.dashHit = false;
      f.dashStartX = f.x; f.dashStartY = f.y; // visual anchor for the wind-up hold
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
        attackCd: 0.5, spin: 0, hitCd: 0, wakeHitCd: 0, flash: 0,
        chargeTimer: 0, chargeHit: false,
      });
      f.fireKick = 0.18; f.fireKickMax = 0.18; f.fireDir = Math.atan2(aim.y - f.y, aim.x - f.x); // raise gesture (thrust)
      break;
    }
    case 'sweep': {
      // Reaper HARVEST — hurl a returning scythe (boomerang). One in flight
      // at a time: while one is out, flag a quick retry instead of throwing a second.
      // Outbound homes mildly to the enemy (a thrown blade); it turns at max travel
      // and homes back to Reaper, getting "caught". Hits once per leg, execute-scaled
      // (see the crescent handler in step()).
      if (f.crescentOut) { f.sweepWhiff = true; break; }
      const ang = Math.atan2(aim.y - f.y, aim.x - f.x);
      game.projectiles.push({
        x: f.x, y: f.y,
        vx: Math.cos(ang) * f.crescentSpeed, vy: Math.sin(ang) * f.crescentSpeed,
        team: f.team, dmg: f.dmg, life: 4,
        kind: 'crescent', size: 7, homing: f.crescentHoming, cruise: f.crescentSpeed,
        phase: 'out', traveled: 0, maxTravel: f.crescentMaxTravel,
        hitCd: 0, wakeTick: 0, spin: 0, angle: ang,
      });
      f.crescentOut = true;
      f.sweepWhiff = false;
      sfx('sweep', null, f.x);   // only on a real throw (whiff retries are silent)
      f.fireKick = 0.16; f.fireKickMax = 0.16; f.fireDir = ang; // throw gesture (thrust)
      break;
    }
    case 'iai': {
      // RONIN IAI — opener: plant during the windup, LOCK the dash direction at cast
      // (the enemy's random bounce during the windup is the counterplay). FOCUS chain:
      // skip the windup entirely — direction re-aims at the enemy now, the strike
      // fires on the very next tick. The chain breaks when a strike whiffs (focused
      // clears in the iaiStrike-end branch of step()).
      f.iaiAngle = Math.atan2(aim.y - f.y, aim.x - f.x);
      f.iaiHit = false;
      if (f.focused) {
        f.iaiWindup = 0.001;   // effectively zero — windup-end branch fires the strike next frame
      } else {
        f.iaiWindup = f.windupTime;
        f.vx = 0; f.vy = 0;   // plant
      }
      break;
    }
    case 'hex': {
      // Witch: fires a fast bouncing projectile. Up to f.maxBounces wall bounces.
      const ang = Math.atan2(aim.y - f.y, aim.x - f.x);
      game.projectiles.push({
        x: f.x, y: f.y,
        vx: Math.cos(ang) * 280, vy: Math.sin(ang) * 280,
        team: f.team, dmg: f.dmg, life: 4.5,
        kind: 'hex', size: 5, homing: 60,
        bounces: f.maxBounces,
        markBonus: f.markBonus,
        markDuration: f.markDuration,
        spin: 0,
      });
      f.fireKick = 0.16; f.fireKickMax = 0.16; f.fireDir = ang; // hex conjure (thrust)
      break;
    }
    case 'grapple': {
      // Hunter: fires a hook projectile. On hit it deals damage AND tethers the
      // enemy, reeling them in. CRIPPLING HOOK (passive) slows the hooked enemy
      // — applied in the projectile-hit code.
      const ang = Math.atan2(aim.y - f.y, aim.x - f.x);
      game.projectiles.push({
        x: f.x, y: f.y,
        vx: Math.cos(ang) * 420, vy: Math.sin(ang) * 420,
        team: f.team, dmg: f.dmg, life: 0.55,
        kind: 'hook', size: 5, homing: 0,
        hookSrc: f,
      });
      f.fireKick = 0.16; f.fireKickMax = 0.16; f.fireDir = ang; // throw the hook (thrust)
      break;
    }
    case 'drain': {
      // Warlock: open a drain channel onto the picked target if within close range.
      // Channels for 1.2s, ticking f.dmg every 0.2s and healing the Warlock (Leech
      // passive). If the target is out of range the cast whiffs — we flag it so
      // the cooldown block can retry quickly instead of burning the full 2.2s on
      // a no-op. NOTE under DOPPELGANGER: drainTarget can be a phantom decoy; the
      // first tick consumes it and the channel breaks via the engine drain tick
      // logic (decoy.dead -> drainTimer cleared). That's intended counter-texture.
      const d = Math.hypot(aim.x - f.x, aim.y - f.y);
      if (d < 140) {
        f.drainTimer = 1.2;
        f.drainTickTimer = 0;
        f.drainTarget = aim;
        f.drainElapsed = 0;
        sfx('drain', null, f.x); // sustained beam drone — only on a real connect
        f.drainWhiffed = false;
        f.fireKick = 0.18; f.fireKickMax = 0.18; f.fireDir = Math.atan2(aim.y - f.y, aim.x - f.x); // channel lock-on reach
      } else {
        f.drainWhiffed = true;
      }
      break;
    }
    case 'wildcard': {
      // Gambler: start the die roll. The sprite becomes a tumbling die during
      // the windup; the face it lands on (resolveAim) picks the attack pattern.
      // High rolls (5-6) get a longer, more dramatic settle.
      // DOUBLES (passive): if the new roll matches the previous cast's face,
      // set isDoubles so resolveAim fires the pattern TWICE (Dealer's
      // Blessing). lastRoll updates after the check so each new cast compares
      // against the most-recent prior face. First-cast-of-fight check guards
      // against the initial lastRoll=0 default counting as a "match" with a 0.
      const newRoll = 1 + Math.floor(rng() * 6);
      f.isDoubles = (f.lastRoll > 0 && f.lastRoll === newRoll);
      f.gamblerRoll = newRoll;
      f.lastRoll = newRoll;
      const dramatic = newRoll >= 5;
      f.aimTimer = dramatic ? 1.1 : 0.8;                    // tumble + settle
      f.aimAbility = 'wildcard';
      sfx('wildcard', null, f.x);
      break;
    }
    case 'sigil': {
      // Geomancer SIGIL — instant cast. The fighter himself is a NODE in the
      // network alongside the planted wall-stones (the kit's "fighter IS one
      // of his own stones" identity, made mechanically true). All-pairs links
      // are built between every node; any line that crosses the enemy body
      // (or a decoy) at the cast frame deals f.dmg per crossing. The flash
      // window (sigilFlashDur) is purely visual — damage is single-frame,
      // deterministic. No windup: the staff slam IS the cast.
      f.fireKick = 0.18; f.fireKickMax = 0.18; f.fireDir = 0;
      sfx('sigilCrack', null, f.x);
      f.sigilLines = [];
      f.sigilFlash = f.sigilFlashDur;
      const stones = f.stones || [];
      // Self is node 0; wall-stones follow. Self-lines emanate from the
      // fighter's CURRENT position at cast time (captured in the link
      // endpoints — they don't track him during the flash).
      const nodes = [{ x: f.x, y: f.y }].concat(stones);
      if (nodes.length < 2) {
        // Safety net — engine skips the cast when stones is empty, so this
        // path is only reachable if stones somehow empties mid-cast.
        f.sigilWhiff = true;
        break;
      }
      const links = computeSigilLinks(nodes, f.linksPerStone);
      if (links.length === 0) { f.sigilWhiff = true; break; }
      // Hit detection — enemy body radius + half line thickness defines the
      // crossing zone. Each line is independently tested against the enemy
      // and every decoy; lines that hit fire their own damage() call (NOT
      // a summed call) so the shield/parry/mark economy drains correctly
      // per-line — Wizard's MANA SHIELD consumes one orb per line, Duelist
      // RIPOSTE parries each line as a separate hit, etc. Decoys hit by a
      // line are consumed (DOPPELGANGER substrate). BATCH_GAP merging
      // still aggregates the float text into a single readable number.
      const hitR = FIGHTER_SIZE + (f.lineWidth || 4) * 0.5;
      for (const link of links) {
        let hit = false;
        if (!enemy.dead && segIntersectsCircle(link.x1, link.y1, link.x2, link.y2,
                                                enemy.x, enemy.y, hitR)) {
          damage(enemy, f.dmg, 'projectile');
          hit = true;
        }
        if (enemy.decoys && enemy.decoys.length) {
          for (const d of enemy.decoys) {
            if (d.dead) continue;
            if (segIntersectsCircle(link.x1, link.y1, link.x2, link.y2, d.x, d.y, hitR)) {
              d.dead = true; hit = true;
            }
          }
        }
        link.hit = hit;
      }
      f.sigilLines = links;
      f.sigilWhiff = false;
      // Per-line chord chime — light staggered metallic chimes paint the
      // network in audio (more lines = denser chord). Routed through a single
      // sfx call so the headless guard stops the timer fan-out at the audio
      // boundary (instead of leaking N timers into the sim path).
      sfx('sigilLines', { count: links.length }, f.x);
      break;
    }
  }
}

function resolveAim(f) {
  // Called when aimTimer hits 0
  const target = f === game.red ? game.blue : game.red;
  if (target.dead) { f.aimAbility = null; return; }
  // DOPPELGANGER pick for resolve-time aimers (cannon, wildcard). Lightning's
  // aim was locked at cast (f.judgeX/judgeY); here we just need to know if any
  // decoy gets caught in the pillar footprint at resolve time.
  const aim = pickTarget(f, target);
  if (f.aimAbility === 'lightning') {
    // JUDGMENT lands at the locked predicted spot. The pillar + ground-ring is a
    // headless-guarded spawn; the strike sound is the Priest's holy bell ('lightning').
    const tx = f.judgeX, ty = f.judgeY;
    spawnImpact(tx, ty, 'judgment', 0, 0.9);
    sfx('lightning', null, tx);
    // Decoys caught in the pillar footprint are consumed first (the pillar is
    // AOE — it strikes everything in range). Real-Jester hit still happens
    // independently below.
    if (target.decoys && target.decoys.length) {
      for (const d of target.decoys) {
        if (Math.hypot(d.x - tx, d.y - ty) < f.pillarRadius + FIGHTER_SIZE) {
          d.dead = true;
        }
      }
    }
    // Hit = the enemy's BODY overlaps the pillar footprint — matches what the
    // reticle shows (body touching the gold zone ring = struck), not a center
    // point test, so a fighter visibly inside the ring can't whiff.
    if (Math.hypot(target.x - tx, target.y - ty) < f.pillarRadius + FIGHTER_SIZE) {
      // DIVINE GRACE heals only on a hit that actually CONNECTS — damage() returns
      // the dealt amount, or nothing if the hit was negated. So a phased judgment
      // still strikes (pillar + sound) but grants no heal. A judgment that ONLY
      // catches decoys (no real-target damage) likewise grants no heal — the
      // phantom shattered, not the body.
      const dealt = damage(target, f.dmg, 'judgment');
      if (dealt > 0) {
        const healed = Math.min(f.maxHp, f.hp + f.healOnHit) - f.hp;
        if (healed > 0) {
          f.hp += healed;
          spawnFloat(f.x, f.y - FIGHTER_SIZE, '+' + healed, healColor(f));
          sfx('heal', null, f.x);
        }
      }
    }
    // AOE side-effect — skeletons in the pillar footprint take damage.
    // The aim itself is still predicted at the ENEMY FIGHTER's position
    // (locked at cast time, line 79-80); skeletons just happen to share
    // the footprint. Makes JUDGMENT a real anti-swarm play vs Necromancer.
    // DIVINE GRACE does NOT grant heal on skeleton hits — only the fighter-
    // hit branch above heals. Skeletons aren't "souls saved," just bone
    // that happens to be in the way of holy light.
    game.skeletons = game.skeletons.filter(sk => {
      if (sk.team === f.team) return true;   // own skeletons untouched
      if (Math.hypot(sk.x - tx, sk.y - ty) >= f.pillarRadius + sk.size) return true;
      return !damageSkeleton(sk, f.dmg);
    });
  } else if (f.aimAbility === 'tackle') {
    // RAMPAGE — windup over: pick the aim NOW (release time) and launch at
    // ramming speed. Berserker uncoils toward wherever the enemy actually is,
    // so the windup is pure telegraph (no lead-the-enemy gap). The dashTimer
    // holds step()'s speed-management code off so the velocity persists; bounce()
    // pinballs it off walls; step()'s rampage branch handles per-pass damage +
    // carom. Uses pickTarget so DOPPELGANGER decoys count for the aim choice.
    const launchAim = pickTarget(f, target);
    const ang = Math.atan2(launchAim.y - f.y, launchAim.x - f.x);
    f.vx = Math.cos(ang) * f.speed * f.rampageSpeedMult;
    f.vy = Math.sin(ang) * f.speed * f.rampageSpeedMult;
    f.dashTimer = f.rampageDur;
    f.rampageHitCd = 0;
    sfx('tackle', null, f.x);     // primal launch
  } else if (f.aimAbility === 'cannon') {
    // BOMBARD — fire a heavy shell STRAIGHT at the picked target's CURRENT position
    // (no lead, no smart math: dumb heavy artillery, unlike Priest's predictive
    // pillar). Shell expires at the aim point; if the target moved off it during
    // flight, splash with DIRECT HIT falloff catches near-misses. A decoy can be
    // the picked target — shell flies at the decoy, decoy gets the direct hit.
    const speed = 340;
    const dx = aim.x - f.x, dy = aim.y - f.y;
    const dist = Math.hypot(dx, dy) || 1;
    const ang = Math.atan2(dy, dx);
    game.projectiles.push({
      x: f.x, y: f.y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
      team: f.team, dmg: f.dmg, life: Math.max(0.1, dist / speed),  // expire AT the aim point
      kind: 'cannon', size: 7, homing: 0, angle: ang,
      splashRadius: f.splashRadius,   // passed through for the EPICENTER explosion visual
    });
    sfx('cannon', null, f.x);
    shake(7); // muzzle kick
    f.fireKick = 0.2; f.fireKickMax = 0.2; f.fireDir = ang; // visual: heavy recoil + muzzle blast
  } else if (f.aimAbility === 'wildcard') {
    // The die has settled — the face (gamblerRoll, 1-6) picks the attack
    // pattern. Every face throws spinning gold COINS; higher faces are worth
    // more on average (verified monotonic in the sim).
    // DOUBLES (passive): when isDoubles is set (consecutive rolls matched
    // the same face), firePattern is called TWICE — once at angOffset=0,
    // once at a small angular offset so the doubled coins diverge instead
    // of stacking on identical trajectories. Face 5 (Coin Nova) handles
    // doubling by phase-shifting the second ring's angles by π/N so the
    // 20 doubled coins interleave evenly around the circle.
    const ang = Math.atan2(aim.y - f.y, aim.x - f.x);
    f.fireKick = 0.18; f.fireKickMax = 0.18; f.fireDir = ang; // coin throw (thrust)
    // The die has just settled on its face — a hard clack, brighter on a
    // high roll (5-6) to signal the lucky result before the coins fly.
    sfx(f.gamblerRoll >= 5 ? 'diceLandBig' : 'diceLand', null, f.x);
    // shoot a coin at a given heading offset (radians) from the aim line
    const coin = (offset, speed, homing) => {
      const a = ang + offset;
      game.projectiles.push({
        x: f.x, y: f.y,
        vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
        team: f.team, dmg: f.dmg, life: 2.4,
        kind: 'coin', size: 5, homing: homing || 0, spin: 0,
        cruise: speed,   // re-normalised to each frame so homing can't stall it
      });
      sfx('coinThrow', null, f.x);
    };
    const roll = f.gamblerRoll;
    // firePattern(angOffset) — emits one copy of the rolled face's pattern.
    // For doubles, called twice with different angOffsets so the second
    // copy of the coins diverges from the first instead of overlapping.
    const firePattern = (angOffset) => {
      if (roll === 1) {
        // Lone Coin — one fast straight coin.
        coin(angOffset, 320, 0);
      } else if (roll === 2) {
        // Twin Toss — two coins, the second fired a beat after the first.
        coin(angOffset, 300, 0);
        f.gamblerShots.push({ delay: 0.14, offset: angOffset, speed: 300, homing: 0 });
      } else if (roll === 3) {
        // Coin Spread — three coins in a simultaneous fan.
        coin(-0.26 + angOffset, 290, 0); coin(angOffset, 290, 0); coin(0.26 + angOffset, 290, 0);
      } else if (roll === 4) {
        // Seeking Coins — three homing coins in a tight spread, all hunting
        // the enemy. The "inevitable" roll: slower coins, but they curve.
        coin(-0.12 + angOffset, 240, 150);
        coin(angOffset, 240, 150);
        coin(0.12 + angOffset, 240, 150);
      } else if (roll === 5) {
        // Coin Nova — a full ring of coins bursts out, then each curves back
        // and converges on the enemy (homing). On doubles the second call's
        // angOffset is non-zero, so the ring rotates by that much (we pick
        // π/N below at the call site so two doubled rings interleave).
        const N = 10;
        for (let i = 0; i < N; i++) {
          const a = (i / N) * Math.PI * 2 + angOffset;
          game.projectiles.push({
            x: f.x, y: f.y,
            vx: Math.cos(a) * 200, vy: Math.sin(a) * 200,
            team: f.team, dmg: f.dmg, life: 2.6,
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
        coin(angOffset, 330, 30);
        for (let i = 1; i < 8; i++) {
          f.gamblerShots.push({
            delay: i * 0.07,
            offset: (rng() - 0.5) * 0.3 + angOffset,
            speed: 320 + rng() * 40,
            homing: 30,
          });
        }
        shake(8);
      }
    };
    firePattern(0);
    if (f.isDoubles) {
      // Second copy of the pattern, offset so the doubled coins diverge.
      // Face 5 uses π/10 so the two 10-coin rings interleave to 20 evenly;
      // other faces just need a small angular spread to avoid stacking.
      const dblOffset = (roll === 5) ? Math.PI / 10 : 0.10;
      firePattern(dblOffset);
      f.doublesFx = 0.45;   // brief gold-pop visual marking DOUBLES firing
    }
    f.isDoubles = false;
  }
  // RAMPAGE owns its own launch velocity (f.speed * rampageSpeedMult) — the
  // generic post-resolve normalization below would crush it back to base speed
  // and there'd be no ricochet. Skip it for tackle; the rampage's dashTimer
  // also gates step()'s own re-normalization until the dash ends.
  const wasTackle = f.aimAbility === 'tackle';
  f.aimAbility = null;
  if (wasTackle) return;
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
