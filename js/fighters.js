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
  { id:'knight',  name:'KNIGHT',    hp:1110, speed:90,  color:'#c0c0c0', accent:'#2e9eff', shape:'shield',
    ability:'sword', cd:1.2, dmg:200, strikeReach:12,
    armorFlat: 20,
    active: 'SHIELD BASH — dash in and slam on reach',
    get passive() { return `PLATE ARMOR — −${this.armorFlat} dmg per hit (min 10)`; },
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
    ability:'blink', cd:2.5, dmg:130,
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
    ability:'cannon', cd:3.0, dmg:400,
    windupTime: 1.0, splashRadius: 55,
    get active() { return `BOMBARD — ${this.windupTime}s windup, then a heavy shell that splashes on landing`; },
    passive: 'EPICENTER — damage peaks at the blast center, scaling to nothing at the splash edge',
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
    // cycle; see abilities.js).
    ability:'sweep', cd:1.0, dmg:180,
    crescentSpeed: 360, crescentHoming: 40, crescentMaxTravel: 240,
    // WAKE passive — the crescent drops a small damaging hazard ("wake segment") along
    // its flight path every wakeRate seconds. Segments overlap into a visible arc-trail
    // and damage the enemy if they bounce through it; per-target wakeHitCd (in engine.js)
    // caps the tick rate so dense overlap can't double-dip.
    wakeRate: 0.04, wakeRadius: 14, wakeLife: 0.8, wakeDmg: 15,
    active: 'CRESCENT THROW — hurls a returning scythe; strikes coming and going',
    passive: 'WAKE — the scythe leaves a damaging arc along its flight path',
  },
  { id:'ronin',   name:'RONIN',     hp:920,  speed:100, color:'#2a1a1a', accent:'#e8c020', shape:'katana',
    ability:'iai', cd:2.5, dmg:130,
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
  { id:'gambler', name:'GAMBLER',   hp:1000, speed:100, color:'#1a3a2a', accent:'#ffd23d', shape:'dice',
    ability:'wildcard', cd:1.5, dmg:50,
    active: 'WILDCARD — roll a die; higher pips, bigger coin attack',
    passive: 'LOADED DICE — a low roll halves the next cooldown',
  },
];
