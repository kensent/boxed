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
