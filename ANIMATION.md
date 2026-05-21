# BOXED — animation principles

## What's in scope
Everything drawn or computed per frame: melee attack arcs, anticipation/recovery
poses, ability charge effects, hit feedback, particles, screen effects, death
ceremonies, status visuals. Static sprites (fighters, projectiles, minions) are
out of scope — their shapes are identity, not animation.

## Principles

1. **Juice over realism.** Exaggerate impact, not physics. A hit should feel
   like a punch, not a simulation.

2. **Readability is sacred.** No animation obscures fighter position, health
   state, or active ability. When in doubt, make it smaller.

3. **Attack animations telegraph intent.** Melee swings should have a visible
   arc or squash/stretch so the player can read what just happened — especially
   important at mobile size.

4. **Transient over looping.** Animations are punchy flashes, arcs, and smears
   — not idle cycles. Every animation ends quickly.

5. **Damage magnitude drives visual weight.** A big hit looks and feels bigger
   regardless of whether it's melee or projectile. Death is always the ceiling.

6. **Mobile GPU budget.** No large alpha-blended overlapping areas. Keep
   particle counts bounded. Prefer shape/line drawing over texture fills.

7. **Never touch RNG in draw().** The render path must not call `rng()` or
   `vrng()`. Derive all visual randomness from positions, time, or pre-rolled
   values stored on the entity.

8. **Melee has three beats: anticipation → strike → recovery.** "Anticipation"
   means a brief visual lean/squash toward the target (1–3 frames) — not a
   gameplay windup mechanic like Ronin's iai or Cannoneer's cannon shot, which
   are already their own thing.

9. **Consistent grammar, unique voice.** Every fighter follows the same
   structural beats (anticipation → strike → recovery for melee, charge →
   release for projectiles), but the execution is fighter-specific — color, arc
   shape, particle style, timing personality. No two fighters should animate
   identically.

10. **Animation and audio are designed as one system.** Visual beats define a
    clear contract for corresponding audio moments. When we revamp audio later,
    the animation timing and intensity are already the spec — no retrofitting
    needed.

11. **Particles punctuate a beat — they are never ambient.** Every burst is tied
    to a specific moment: charge motes on the windup, debris on the strike, a
    settling puff on recovery. No constant sprinkle, no idle emitters (that would
    break "transient over looping"). Spawn particles in the sim/ability path
    (where RNG is allowed) — never in `draw()`. Keep counts bounded and shape-based
    per the GPU budget, and let style and color carry the fighter's voice: the
    same impact reads as crimson shards for one fighter and silver sparks for
    another. A burst that doesn't mark a beat shouldn't exist.

---

## Grammars — the built vocabulary

The principles above are the WHY. These are the concrete grammars the system is
built from — each a *shared structure* with a *per-fighter voice* (principle 9).
Built from a deliberate blank-canvas teardown (the old animation + particle system
was deleted first); everything below is line/shape-drawn, no particle pool.

### Attack categories — "the fighter IS the weapon"
Every fighter delivers its attack in one of four ways. The body itself reacts; we
never float a separate weapon-effect around a static sprite.

- **Melee (6)** — berserker, knight, duelist, reaper, jester, ronin. Three beats:
  *anticipation → strike → recovery*, expressed by deforming the BODY
  (squash/stretch/lunge/spin), plus a bespoke impact **force-shape**. Dashers use a
  shared hold-and-whip anticipation (`meleeWindupHold`): the body holds at its
  launch point, then whips forward (the sim launches instantly; this *reads* the
  wind-up). Jester is the exception (teleports, so the mask-snap is the strike).
- **Ranged (9)** — a release **kick** along the firing axis + a bespoke launch
  flash. **Recoil** (back) for a projectile discharged from an implement —
  cannoneer, priest (staff-bolt), archer (bow). **Thrust** (forward) for a cast or
  throw — wizard, necromancer, witch, gambler, hunter. (`fireKick`/`fireDir`.)
- **Set-down (1)** — sapper places a mine and steps back (no launch).
- **Channel (1)** — warlock: a **lock-on reach** when the drain latches + a
  sustained **channel pulse** synced to the drain ticks. Generic grammar, reusable
  by any future channeler.

### Force-shapes — the shape of the force at the point of contact
One primitive per source (mirror of melee for projectiles/traps/minions, via the
`game.impacts` list + `drawImpact`):
circle (Berserker punch · cannonball) · flat bar (Knight bash) · line/lance
(Duelist thrust + COUNTER) · arc/crescent (Reaper sweep — bleeds) · converging pair
(Jester pinch) · long slash (Ronin iai) · arrow puncture · lightning zap · orb
rune-pop · hex splat · coin ding · hook clink · bone shards · mine explosion.
Every hit also drives a **damage-scaled victim recoil** (`recoilMag`): a heavy hit
knocks the body back, a chip hit barely nudges (principle 5).

### Charge telegraph — windup fighters (cannoneer, priest, ronin)
A **charge ring** that fills like a clock, tightens inward, brightens, and flashes
full at release. Per-fighter accent: cannoneer's aim-line, priest's orbiting
gleams, ronin's coil + tremor. The kick + launch flash are the *release* of the ring.

### State indicators — on the fighter, never a HUD badge
Every status reads on the fighter itself; the **form** tells buff from debuff:
- **Buff / ready / active = rings** (at most one per fighter, by ability): armed
  glow (dodge) + the Wizard's 4-segment mana-shield gauge, active windows (parry,
  invuln), bloodrage pulse, FOCUS gold aura, the negate-flash.
- **Debuff / affliction = distinct non-ring forms** (so they never collide with the
  rings): stun **stars** (overhead), Witch's-mark **sigil** (on the body), slow
  **drag-trail** (ghosts lagging behind), fog **licks** (encroaching from outside).
  LOADED is a momentary **"lucky" pop** (a trigger marker, not a state).

### Death ceremony
**Shared frame** (always): slow-mo finish (sim) + white **camera-snap** + **K.O.** punch-in.
Death is the ceiling (principle 5) — each fighter dies in a way no other does.

**Three-layer grammar** — every bespoke death has exactly these layers in order:
1. **Sprite transform** — the body makes one last move before vanishing (convulse, tumble,
   droop, sink, spring…). `drawFighter` skips dead fighters, so this is drawn here, keyed
   on `game.koTimer`. Mirrors left/right via `ctx.scale(-1,1)` at the top of `drawDeath`.
2. **Voice effect** — the energy of that fighter's identity releasing (shockwave, muzzle
   blast, orb collapse, blood spray, slash mark…). No two fighters share the same shape,
   color, or direction.
3. **Settling residue** — what's left on the ground after the smoke clears (smears, shards,
   pip dots, bone pile, blood pool, arrows lying flat…). Fades last.

**Archetypes and voices:**
- **BURST** — Berserker (bloodrage convulse → shockwave ring + 5 blunt bars → crimson
  smears), Cannoneer (rig pitches on wheel → directional muzzle cone + fracture cracks →
  wheel/barrel ring fragments), Sapper (bomb swells → dark casing breach + shrapnel →
  angular casing shards + fuse scrap)
- **SHATTER** — Knight (heavy tumble → cross fracture lines + blue boss burst → 4 kite-
  shard parallelograms), Duelist (parry spin → blade snaps linearly, segments along axis →
  3 thin shard lines + cup guard arc), Jester (halves drawn independently, spin apart →
  crack flash + red/blue diamond motes → 3+3 shard diamonds), Hunter (whips backward →
  fracture arc at bend + steel shards + copper barb flies → shank stub + barb shard),
  Gambler (accelerating tumble → gold edge flash + 4 corner shards → pip-dot residue)
- **DISSOLVE** — Priest (rises UP → gold ring expands + 7 motes ascend → warm glow pool;
  only death that goes up), Wizard (flickers then implodes inward → 4 orbs wink out in
  sequence → hexagram sigil), Witch (hat melts DOWN → toxic green cloud → puddle + brim
  line), Warlock (void consumes itself → eye flares then snaps shut → near-black void
  stain; darkest residue in the roster)
- **COLLAPSE** — Necromancer (skull rattles then falls → bone fragments + eye-wisps escape
  → bone pile + purple glow), Reaper (rotor decelerates ease-out, sinks → blood arcs in
  crescent shape → growing blood pool ellipse; only death with a spreading ground mark)
- **CUT** — Ronin (slow ease-in swing → single clean gold slash, held then fading →
  blade at rest angle + gold tip)
- **SCATTER** — Archer (bow springs then fades → bowstring snap flash + 6 arrows with
  fletching fly 360° → 4 arrows lying flat + green bow-arc fragment)

### Two rules under all of it
1. **Visual-only & balance-safe.** These read fields set in the sim path, but the
   sim/balance never reads them back; spawners (`spawnImpact`, etc.) are
   headless-guarded. After any change, confirm `./balance.sh` output is bit-identical
   to the `MATCHUPS` block.
2. **Render discipline.** Line/shape-drawn, bounded, no large alpha fills (principle
   6). Never call `rng()`/`vrng()` in `draw()` (principle 7, GOTCHAS) — derive all
   motion from time, positions, or pre-rolled values.
