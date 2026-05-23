// ============================================================================
// === FIGHTERS ===============================================================
// Roster definitions. Each fighter has stats, visual identity, ability id,
// and card metadata. Edit here to tune balance numbers.
//
// Ability parameters (windupTime, healOnCast, etc.) are defined as named
// properties on the fighter object — the single source of truth. Description
// strings are getters that read those properties, so they can never drift.
// Ability code reads f.propertyName instead of hardcoded literals.
// ============================================================================

const FIGHTER_SIZE = 16;

const FIGHTERS = [
  { id:'priest',  name:'PRIEST',    hp:800,  speed:110, color:'#f5f5f0', accent:'#ffe83d', shape:'cross',
    // Internal ability id stays 'lightning' — it keys Priest's DISSOLVE death,
    // charge telegraph, fire-recoil, and audio. The ability itself is now JUDGMENT.
    ability:'lightning', cd:1.6, dmg:112,
    windupTime: 0.45, healOnHit: 18, pillarRadius: 34,
    get active() { return `JUDGMENT — light pillar strikes the enemy's predicted spot, ${this.windupTime}s windup`; },
    get passive() { return `DIVINE GRACE — landing judgment heals ${this.healOnHit} hp`; },
  },
  { id:'berserker',name:'BERSERKER', hp:920, speed:145, color:'#a83232', accent:'#f5f5f0', shape:'axe',
    // dmg is PER PASS (RAMPAGE multi-hits — see rampageHitGap below). Tuned for
    // ~3-5 hits per rampage at the small-arena geometry; whole-rampage payoff
    // is dmg × ~4, so this lever moves the matchup faster than it looks (~1 win
    // point per 1 dmg). Iteration: 100 (pre-shrink) -> 84 (post-shrink) -> 76
    // (further trim) -> 82 (compensate for 0.5s windup vulnerability).
    ability:'tackle', cd:1.7, dmg:82,
    windupTime: 0.5,
    rageBoost: 0.33,
    rampageDur: 1.1, rampageSpeedMult: 4, rampageHitGap: 0.22,
    get active() { return `RAMPAGE — ${this.windupTime}s coil, then charges and ricochets off walls, hitting on each pass`; },
    get passive() { return `BLOODRAGE — +${Math.round(this.rageBoost * 100)}% speed under 50% hp`; },
  },
  { id:'wizard',  name:'WIZARD',    hp:850,  speed:95,  color:'#9d4edd', accent:'#ffe83d', shape:'spellbook',
    ability:'cast', cd:2.0, dmg:100,
    orbsPerCast: 2, orbCap: 4, shieldReduction: 0.20,
    get active() { return `CAST ORBS — ${this.orbsPerCast} homing orbs per cast, max ${this.orbCap}`; },
    get passive() { return `MANA SHIELD — ${Math.round(this.shieldReduction * 100)}% dmg reduction per orb (up to ${Math.round(this.orbCap * this.shieldReduction * 100)}%), spends one orb per hit`; },
  },
  { id:'geomancer',name:'GEOMANCER', hp:1100, speed:120, color:'#7a6852', accent:'#e8a020', shape:'menhir',
    // STANDING STONES (passive) — every wall-bounce drives a runestone into
    // the wall at the contact point. Stones are inert markers, glowing
    // amber; they persist at full alpha (no time decay) and are evicted at
    // `maxStones` (oldest first). The arena gradually accumulates a network
    // of standing stones along its perimeter.
    // SIGIL (active) — Geomancer slams his staff and for `sigilFlashDur`
    // amber ley-lines are drawn between every pair of NODES, where the
    // node set is (himself + every planted stone) — the kit's identity
    // ("fighter IS one of his own stones") made mechanically true. Any line
    // the enemy (or a decoy) intersects at the cast frame deals `dmg` per
    // crossing. dmg is per-line; a single cast can stack 0..many.
    // Speed 120 (above the median 100) — the kit's input is wall bounces,
    // so faster movement = faster network buildup. No corner pre-seed.
    ability:'sigil', cd:2.5, dmg:80,
    maxStones: 8, linksPerStone: 2,
    sigilFlashDur: 0.6, lineWidth: 4,
    get active() { return `SIGIL — slams the staff; amber ley-lines fire between him and every planted stone, burning anyone on the lines`; },
    get passive() { return `STANDING STONES — each wall-bounce drives a runestone into the wall (max ${this.maxStones}); SIGIL connects them all to him`; },
  },
  { id:'sapper', name:'SAPPER',    hp:780,  speed:120, color:'#5a3a1f', accent:'#ff2e2e', shape:'keg',
    // Internal ability id stays 'mine' — keys Sapper's BURST death + casing material.
    ability:'mine', cd:1.4, dmg:200,
    throwSpeed: 300, fuseTime: 1.5,
    get active() { return `STICK CHARGE — hurl a fused bomb that sticks on contact; detonates after ${this.fuseTime}s`; },
    passive: 'BLAST RADIUS — the detonation knocks the enemy back',
  },
  { id:'archer',  name:'ARCHER',    hp:730,  speed:125, color:'#3dff8a', accent:'#f5f5f0', shape:'bow',
    // VOLLEY fan per cast + SHATTER: arrows embed visibly; the shatterAt-th arrow
    // bursts the whole cushion for stacks × shatterPerStack damage in one number
    // (the trigger arrow's chip is folded into the burst). Individual stacks
    // decay slowly so a quiet archer doesn't carry a phantom cushion forever.
    ability:'arrow', cd:0.7, dmg:30,
    volleyArrows: 3, volleySpread: 0.18,
    shatterAt: 5, shatterPerStack: 18, embedDur: 2.0,
    active: 'VOLLEY — a fan of arrows on every cast, fired while moving',
    get passive() { return `SHATTER — each landed arrow embeds in the enemy; the ${this.shatterAt}th bursts the whole cushion for ${this.shatterPerStack} damage per arrow`; },
  },
  { id:'jester',  name:'JESTER',    hp:820,  speed:120, color:'#e8d8b8', accent:'#ff2e2e', shape:'mask',
    // cd 2.5 -> 2.0 -> 2.1 + dmg 130 -> 110 (across two passes). Identity
    // is harassment, not assassination, so more frequent blinks + lower
    // per-stab damage fits the kit shape. The 2.0 cd lifted Jester from
    // 44.7% to 53.9% (top of band after Cannoneer trim); 2.1 pulls back
    // slightly — Jester is very cd-sensitive (~1 wr per ~1.5% cd change;
    // 2.0 → 2.2 over-corrected to 40%). 2.1 targets ~50%.
    ability:'blink', cd:2.1, dmg:110,
    // DOPPELGANGER replaces UNCANNY DODGE: every hit Jester takes spawns a
    // stationary phantom decoy at her current position. Decoys are valid
    // targets for every enemy ability (uniform "aim nearest" targeting); a
    // decoy absorbs one incoming hit then dies. Cap of decoyCap simultaneously
    // (oldest replaced on overflow). Decoy lifetime is decoyLife seconds.
    decoyCap: 2, decoyLife: 3.0,
    active: 'BLINK DAGGER — teleports behind enemy and stabs',
    get passive() { return `DOPPELGANGER — every hit spawns a phantom decoy; enemies aim at the nearest target. Max ${this.decoyCap}, ${this.decoyLife}s each`; },
  },
  { id:'cannoneer',name:'CANNONEER',hp:1030, speed:85,  color:'#4a4a4a', accent:'#ff8c1a', shape:'cannon',
    // dmg 360 -> 340 (keeping splashMinFrac 0.4). The 400 dmg + 0 floor
    // ran Cannoneer at 56.3%; switching to 360 + 0.4 floor (added edge
    // rewards) landed him at 54.3%, still slightly top-heavy. This trim
    // pulls center damage further down while keeping the near-miss floor.
    // History: 400 + 0 = 56.3%, 360 + 0.4 = 54.3%, 340 + 0.4 targets ~50%.
    // (Earlier 340 + 0.3 floor over-corrected to 47%; the higher floor
    // is what keeps near-misses meaningful here.)
    ability:'cannon', cd:3.0, dmg:340,
    windupTime: 1.0, splashRadius: 55, splashMinFrac: 0.4,
    get active() { return `BOMBARD — ${this.windupTime}s windup, then a heavy shell that splashes on landing`; },
    get passive() { return `EPICENTER — damage peaks at the blast center, falling off to ${Math.round(this.splashMinFrac * 100)}% at the splash edge`; },
  },
  { id:'duelist', name:'DUELIST',   hp:950,  speed:115, color:'#1a1a2e', accent:'#c0c0e8', shape:'rapier',
    ability:'riposte', cd:1.7, dmg:250, strikeReach:10,
    active: 'RIPOSTE THRUST — dash in and thrust on reach',
    passive: 'COUNTER — the thrust parries melee hits and reflects projectiles',
  },
  { id:'necromancer',name:'NECROMANCER',hp:950, speed:100, color:'#3a2a4a', accent:'#e8e0d0', shape:'scythe',
    ability:'raise', cd:2.9, dmg:60,
    active: 'RAISE SKELETON — summons a slow skeleton, no cap',
    passive: 'BONE BURST — skeletons explode on death, damaging nearby foes',
  },
  { id:'reaper',  name:'REAPER',    hp:750, speed:100, color:'#1a0e0e', accent:'#aa0000', shape:'sickles',
    // HP is the balance lever; dmg/cd tuned for pace. cd is the post-catch RECOVERY
    // (one crescent in flight at a time — the flight round-trip dominates the throw
    // cycle; see abilities.js). dmg 180 -> 135 to compensate for HARVEST's
    // overshoot mechanic — the scythe now keeps flying past the enemy on hit
    // (only turning at max travel or a wall), so a single cast can land BOTH
    // an outbound and a return pass on the enemy. Pre-overshoot baseline ran
    // at 54.6%; raw overshoot with dmg 180 went to 68.3% (multi-hit per cast).
    ability:'sweep', cd:1.0, dmg:142,
    crescentSpeed: 360, crescentHoming: 40, crescentMaxTravel: 240,
    // WAKE passive — the crescent drops a small damaging hazard ("wake segment") along
    // its flight path every wakeRate seconds. Segments overlap into a visible arc-trail
    // and damage the enemy if they bounce through it; per-target wakeHitCd (in engine.js)
    // caps the tick rate so dense overlap can't double-dip.
    wakeRate: 0.04, wakeRadius: 14, wakeLife: 0.8, wakeDmg: 15,
    active: 'HARVEST — hurls a returning scythe; strikes coming and going',
    passive: 'WAKE — the scythe leaves a damaging arc along its flight path',
  },
  { id:'ronin',   name:'RONIN',     hp:920,  speed:100, color:'#2a1a1a', accent:'#e8c020', shape:'katana',
    // dmg 130 -> 118 -> 112 -> 106 -> 110 (across passes); cd unchanged 2.5.
    // The trim-and-bump dance: 112 ran 53.7% (top of band), so trimmed
    // to 106 (overshot to 48.1%); then bumped back to 110. cd is sharply
    // sensitive at Ronin (~1 wr per 1% cd change — earlier 2.5→2.7
    // experiments over-corrected by ~10 wr), so kept at 2.5.
    ability:'iai', cd:2.5, dmg:110,
    windupTime: 0.5,
    // strikeDist tuned for the arena shrink to 300 — 200 (pre-shrink) gave 67%
    // coverage and pushed Ronin to 76%; 150 over-corrected to 29%; 175 (~58%
    // coverage) lands him back in the band. Slightly above the old ratio is OK
    // because the smaller arena also means the windup-locked direction is more
    // likely to predict where the enemy actually ends up.
    strikeDist: 175, slashReach: 26, focusRefund: 0.4,
    get active() { return `IAI — ${this.windupTime}s windup, then a heavy line-cut through the enemy and beyond`; },
    passive: 'FOCUS — landing a cut skips the next windup AND refunds the cooldown — chained cuts strike instantly',
  },
  { id:'witch',   name:'WITCH',     hp:780,  speed:100, color:'#2d4a2a', accent:'#7dff3d', shape:'hat',
    ability:'hex', cd:1.5, dmg:110,
    maxBounces: 5, markBonus: 0.5, markDuration: 3.0,
    get active() { return `HEX BOLT — bouncing projectile, up to ${this.maxBounces} wall bounces`; },
    get passive() { return `WITCH'S MARK — marked enemies take +${Math.round(this.markBonus * 100)}% damage for ${this.markDuration}s`; },
  },
  { id:'hunter',  name:'HUNTER',    hp:810,  speed:110, color:'#3a2818', accent:'#c89060', shape:'hook',
    ability:'grapple', cd:1.5, dmg:180,
    active: 'GRAPPLING HOOK — fires a hook that wounds and reels the enemy in',
    passive: 'CRIPPLING HOOK — a hooked enemy is briefly stunned',
  },
  { id:'warlock', name:'WARLOCK',   hp:570,  speed:100, color:'#2a0e2e', accent:'#c050ff', shape:'cowl',
    ability:'drain', cd:2.2, dmg:40,
    slowRate: 0.6, drainHealRate: 0.35,
    active: 'SIPHON — channels, leeching the enemy\'s life',
    get passive() { return `ENERVATE — tethered enemies move at ${Math.round(this.slowRate * 100)}% speed, drain heals ${Math.round(this.drainHealRate * 100)}%`; },
  },
  { id:'gambler', name:'GAMBLER',   hp:900, speed:110, color:'#1a3a2a', accent:'#ffd23d', shape:'dice',
    // HP 1000 -> 900 + speed 100 -> 110 after the DOUBLES rework. dmg is
    // restored to 50 (original). HP is the squishier lever at Gambler's low
    // base (~1 wr per ~11 HP, vs the roster-average ~1 wr per 40 HP); speed
    // compensates with mobility — faster bouncing makes him harder to predict
    // (Priest's JUDGMENT lead, Cannoneer's BOMBARD straight shot), helping
    // his survival ratio. Target: ~50% with a "fast glass cannon" profile
    // instead of "average tanky chaos."
    ability:'wildcard', cd:1.5, dmg:50,
    active: 'WILDCARD — roll a die; higher pips, bigger coin attack',
    // DOUBLES (replaces LOADED DICE) — when consecutive WILDCARD rolls
    // match the same face, the rolled pattern fires TWICE in the same
    // cast (Dealer's Blessing). The second copy is fired with a small
    // angular offset / phase shift so the coins diverge visually instead
    // of stacking on the same trajectories.
    passive: "DOUBLES — when two rolls in a row match the same face, the cast fires its coin pattern twice",
  },
];
