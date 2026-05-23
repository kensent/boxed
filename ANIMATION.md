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
Every fighter delivers its attack in one of three ways. The body itself reacts;
we never float a separate weapon-effect around a static sprite.

- **Melee (4)** — berserker, duelist, jester, ronin. Three beats:
  *anticipation → strike → recovery*, expressed by deforming the BODY
  (squash/stretch/lunge/spin), plus a bespoke impact **force-shape**. Dashers use
  a shared hold-and-whip anticipation (`meleeWindupHold`): the body holds at its
  launch point, then whips forward (the sim launches instantly; this *reads* the
  wind-up). Jester is the exception (teleports, so the mask-snap is the strike).
  Berserker is now a *charged* melee: the rampage has a real mechanical windup
  with charge ring + body tremble + radial coil-lines, then a wall-ricocheting
  multi-pass strike. (Knight was retired and replaced by Geomancer — see
  the Knight bullet in GOTCHAS.md.)
- **Ranged (10)** — a release **kick** along the firing axis + a bespoke launch
  flash (`fireKick`/`fireDir`). Three sub-shapes by gesture:
  - *Recoil* (3) — cannoneer, priest (staff-bolt), archer (bow): projectile
    discharges from an implement, body recoils BACKWARD.
  - *Thrust* (6) — wizard, necromancer, witch, gambler, hunter, **sapper**: cast
    or throw, body thrusts FORWARD. Sapper joined this group when STICK CHARGE
    replaced the old drop-a-mine (it's now a thrown fused limpet).
  - *Boomerang* (1) — **reaper**: the crescent is a returning projectile,
    thrust on launch + the existing throw-gesture for the catch when it loops
    back. Reaper moved out of melee when HARVEST replaced sweep.
- **Channel (1)** — warlock: a **lock-on reach** when the drain latches + a
  sustained **channel pulse** synced to the drain ticks. Generic grammar,
  reusable by any future channeler. (Set-down — Sapper's old mine-drop grammar —
  is empty after Sapper moved to thrust; kept here as a note for any future
  trap-style ability.)
- **Field (1)** — geomancer: a **staff-slam** gesture + a brief amber
  **SIGIL flash** that draws ley-lines between every wall-embedded runestone
  for `sigilFlashDur`. Damage comes from the stones via the lines, not from
  a projectile or body contact — the fighter never moves to deliver the hit,
  the arena itself does. Generic grammar, reusable by any future
  field-caster whose attack emerges from waypoints they've planted.

### Force-shapes — the shape of the force at the point of contact
One primitive per source (mirror of melee for projectiles/traps/minions, via the
`game.impacts` list + `drawImpact`):
circle (Berserker punch) · line/lance (Duelist thrust)
· arc/crescent (Reaper bone-arc — used by the HARVEST scythe and BONE BURST)
· converging pair (Jester pinch) · long slash (Ronin iai) · arrow puncture
· concussion shockwave with falloff-edge ring (Cannoneer EPICENTER — visualizes
the splashRadius boundary so the viewer can SEE the lethal zone, distinct grammar
from Sapper's radial mine-spokes) · lightning zap · orb rune-pop · hex splat
· coin ding · hook clink · bone shards · mine explosion (radial spokes + ring)
· straight amber chord (Geomancer SIGIL — drawn between two wall-stones; the
line *is* the impact primitive, geometrically distinct from anything else
in the roster).
The **SHATTER burst** (Archer's cushion releasing at 5 stacks) has its own
expanding double-ring + arrow scatter, distinct from a per-arrow puncture.
Every hit also drives a **damage-scaled victim recoil** (`recoilMag`): a heavy
hit knocks the body back, a chip hit barely nudges (principle 5).

### Charge telegraph — windup fighters (cannoneer, priest, ronin, berserker)
A **charge ring** that fills like a clock, tightens inward, brightens, and flashes
full at release. Per-fighter accent: cannoneer's aim-line, priest's orbiting
gleams, ronin's coil + tremor, **berserker's body tremble + radial coil-lines**.
The kick + launch flash are the *release* of the ring. Berserker is the only
melee fighter with a charge telegraph (the rampage windup); the other three are
ranged delayed-strike abilities.

### State indicators — on the fighter, never a HUD badge
Every status reads on the fighter itself; the **form** tells buff from debuff:
- **Buff / ready / active = rings** (at most one per fighter, by ability): the
  Wizard's 4-segment mana-shield gauge, the Duelist parry window (cyan tight
  ring, used as both projectile-parry and melee-parry-absorb in the same
  COUNTER thrust window), the Berserker rampage-windup charge ring
  (crimson, with body tremble + radial coil-lines), the bloodrage pulse, the
  Ronin FOCUS gold aura, the negate-flash.
- **Decoys (Jester DOPPELGANGER)** — phantom Jester sprites at 42% alpha with a
  faint outer halo, drawn in world space at the decoy positions. Not a ring on
  the real Jester: they're separate bodies enemies can target. (See the
  DOPPELGANGER substrate bullet in GOTCHAS.md for the universal "aim nearest"
  targeting rule that makes decoys load-bearing across every ability path.)
- **Embedded arrows (Archer SHATTER)** — literal arrow shafts stuck in the
  enemy's body, accumulating until the cushion bursts at 5 stacks. Each
  stuck arrow has its own decay timer; a green halo pulses around the
  enemy at 3+ stacks (the "about to shatter" tell).
- **Debuff / affliction = distinct non-ring forms** (so they never collide with
  the rings): stun **stars** (overhead), Witch's-mark **sigil** (on the body),
  slow **drag-trail** (ghosts lagging behind). DOUBLES (Gambler — formerly
  LOADED DICE) is a momentary **"lucky" pop** above the head (a trigger
  marker, not a state), reused for the new passive: the pop fires the
  instant consecutive matched WILDCARD rolls trigger DOUBLES (Dealer's
  Blessing — the rolled pattern fires twice). The closing-ring fog-licks
  indicator was removed with the fog mechanic itself.

### Death ceremony
**Shared frame** (always), as a sequence: on the kill the body **freezes** intact
while the kill-cam pushes in on it (the camera holds static at the arena centre
during play; the K.O. is the only time it moves); once the camera arrives the body
**shatters** (the per-fighter undoing below, over a fixed beat) as the white
**camera-snap**, the **K.O.** punch-in, the death voice and the boom all land
together — so the hit reads as one beat instead of leading the visual during the
push-in. Slow-mo (sim `timeScale`) runs under all of it. Death is the ceiling
(principle 5) — each fighter dies in a way no other does.

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
- **SHATTER** — Duelist (parry spin → blade snaps linearly, segments along axis →
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
  → bone pile + purple glow), Reaper (hooded body slumps ease-out, sinks → blood arcs in
  crescent shape → growing blood pool ellipse; only death with a spreading ground mark.
  Updated when the sprite went from a rotor-blade glaive to a hooded-figure scythe-
  wielder — the slump replaces the old "rotor decelerates" beat.), Geomancer
  (stone tips forward + sinks → gravel burst at base + amber rune flare on the
  carved face + ley-lines retract inward to the body → granite chunks scattered
  + dim amber rune-mark scorched into the ground; only death with a "lines
  retracting" voice rather than "things flying outward.")
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
