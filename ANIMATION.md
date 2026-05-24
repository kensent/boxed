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

### Intro reveal
Arena-as-reveal Shorts cut, 1.7 s total. Lifecycle ceremony, not fighter-
specific. The arena keeps its static play framing (zoom 1.0, full 300×300
visible) under a soft dark vignette; two floating labels per side (name +
ability summary "ACT · PASSIVE") fade in from 0.10s at CSS-screen positions
`left:20%/80%, top:22%`, and the VS badge clashes in at 0.85s. The labels
live in CSS-screen space (independent of the camera transform), so they
don't track arena-internal coords.

**Idle bob** — both fighters bob in place during the reveal. Sine-wave
motion on (x,y) derived from `performance.now()`, ±1.5px × ±3px, anchored
to the seeded start positions; velocity is never touched. `(x,y)` is
snapshotted at intro start (`game.introSnap`) and restored exactly at
intro end so the fight begins from the seed-determined opening state.
The snap-back is sub-pixel because the bob amplitude is small. Drawn by
`cosmeticIntroLoop` on its own RAF, gated by `introCosmeticOn` + a game
token so a quick restart can't race a stale loop into the new fight.

**Determinism contract**: `introPlaying` blocks `loop()` until the intro
ends, so the sim never ticks during the reveal. Headless never calls
`playVsIntro()` — the balance harness runs from frame 0 of the fight.
Don't add anything to the intro that reads sim state, and don't move the
bob to operate on velocity (that would corrupt the launch angle).

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

### Celebration
The winner's half of the finish — runs in parallel with the loser's death
ceremony during the final `CAM_PULLBACK` seconds of `FINISH_WINDOW`. While
the loser shatters at kill-cam arrival, the winner stays alive in the
arena and gets a brief celebratory beat as the camera eases back to
centre.

**Shared contract** (structural — survives into Phase 2 unchanged, the way
the death ceremony's camera/snap/K.O. frame survives across every bespoke
death):
- **Winner freezes at celebration start.** `step()` gates the winner's
  position update for the final `CAM_PULLBACK` seconds of the finish window
  (`inCeleb = game.winner === f && game.finishTimer < CAM_PULLBACK`). Safe
  to skip from the sim path because the fight is already over (balance
  harness has long returned) — without the freeze the camera would chase a
  bouncing body and the bespoke celebration effects would smear across the
  arena instead of radiating cleanly from a stable origin.
- **Celeb-cam** — mirrors the kill-cam. Camera pushes in on the winner at
  zoom `CAM_CELEB` (1.4, slightly looser than `CAM_KILL` 1.7 so effects
  reaching out from the body have room to read). Transition loser→winner
  is smooth (`CAM_PAN_TAU`); attention transfers naturally.
- **Anchored to winner position** (`winner.x, winner.y`) in world/camera
  space — frozen for the celebration window per above.
- **Team color** — `#ff2e2e` red / `#2e9eff` blue. Every shape inherits
  the winner's banner color so the celebration reads as theirs.
- **`prog` 0→1 over `CAM_PULLBACK`** (currently 1.2 s). Per-fighter
  bespoke celebrations key all beats on this same prog scale so camera
  and audio stay in sync.
- **Render contract**: the K.O. text block sits in screen space
  (`ctx.setTransform`), so the celebration block must call `applyCamera()`
  first to return to world/camera space before drawing. K.O. text fades
  to clear over `(finishTimer - 0.3) / (CAM_PULLBACK - 0.3)` so the
  celebration has the screen to itself when it lands. `drawCelebration`
  runs only in `draw()` (headless-skipped).
- **Finish-window hooks**: `endGame()` clears `game.hazards` (alongside
  projectiles/mines/skeletons) so a lingering WAKE or burn can't kill the
  winner during the wider `FINISH_WINDOW` (2.6 s vs the older 2.0 s).
  `showWinnerOverlay()` is gutted to a 1.2 s `setTimeout` auto-return —
  no overlay DOM. The kill-cam push-in + celebration carry the win
  emotionally; the giant slamming winner-name was over-engineered.

**Sprite handoff**: `drawFighter` early-returns for the celebrating winner
(mirror of how it early-returns for dead fighters and lets `drawDeath` own
the loser's sprite), so each per-fighter case in `drawCelebration` OWNS the
body draw — translates, mirrors per facing, applies its bespoke transform,
calls `drawShape`. The team-color outline ring and live state indicators
(parry rings, buff rings, etc.) drop during celebration because the fight
is over and the celebration effects carry team identity.

**Phase 1 placeholder visual** (`drawCelebration` default case) —
temporary, replaced wholesale by per-fighter bespoke celebrations in
Phase 2 (the same way you don't see a generic pulse on top of Berserker's
bloodrage convulse in death). Currently: untransformed body draw + inner
team-colour pulse ring + offset second pulse for double-tap rhythm + 8-mote
radial burst. The job is "stop the outro feeling empty until bespoke land,"
nothing more — don't preserve any of these shapes when authoring a
per-fighter celebration unless they happen to be that fighter's identity.

**Timing.** `CAM_PULLBACK` is currently 1.2 s (grew from 0.6 s in lockstep
with the first bespoke celebration); `FINISH_WINDOW` is 3.2 s
(~0.8 s push-in + 1.2 s death + 1.2 s celebration). Re-tune in lockstep
if a future bespoke celebration needs more breathing room — but keep the
total inside Shorts-friendly territory.

**Phase 2 — per-fighter celebrations.** Three-layer grammar (parallel to
death's three-layer grammar):
1. **Sprite transform** — the body itself does something distinctly
   *theirs* (Berserker swells with per-thump scale spikes and rage-tremor;
   Ronin straightens into a still sheathe; Wizard lifts/orbits…). Drawn
   inside the per-fighter case in `drawCelebration` after `drawFighter`'s
   handoff; this IS the visible focal element, not adornment around it.
2. **Voice effect** — the energy of victory in the fighter's identity
   language (Berserker's crimson aura + escalating chest-thump shockwaves;
   per-fighter equivalents follow the material identity in AUDIO.md).
3. **Settling residue** — what's left as the camera pulls back (Berserker's
   radial crimson smear bars on the final thump).

The shared contract above is the container; this is the content. Principle
11 applies — every beat marks a moment, none run as ambient texture.

**Camera budget.** Effects render inside the celeb-cam push-in (zoom
`CAM_CELEB` 1.4, ~107 px from frozen-winner center to frame edge). All
celebrations are body-anchored — nothing depends on visible perimeter or
gameplay-anchored content. Burst/scatter effects clamp outward extent to
~50–60 px. If a winner freezes very close to a wall, effects extending
past the arena edge render against the dark border — reads as "energy
overflowing," not broken.

**Archetypes and voices** — grouped by death archetype for tonal continuity
(the fighter's identity is consistent across both moments). Format:
*sprite transform → voice effect → settling residue*. Berserker is the
authored POC; the other 15 are designed-and-pending.

- **BURST** — Berserker (chest-thump swell + rage tremor → crimson aura
  + escalating boom·boom·BOOM shockwaves → radial crimson smear bars),
  Cannoneer (rig recoils hard then cooling tremble → big muzzle BOOM +
  gunpowder ring + pop·pop salute → 3 wheel/barrel ring fragments +
  smoke wisp), Sapper (body swells + white-hot inner glow → contained
  sparking burst → 5 sparkler-arc rays + fuse-scrap embers)
- **SHATTER** — Duelist (blade stretches forward 1.0×→1.5× and holds the
  thrust → thin horizontal slash flash + tip gleam → two thin steel-line
  trails along the slash), Jester (mask halves snap apart-and-back ×3 via
  hinge → red+blue diamond confetti burst → 4 diamond motes drifting in
  slow scatter), Hunter (body coils backward then springs forward + holds
  → cable-whip arc traces outward + copper barb spins free → shank stub +
  barb shard), Gambler (body spins, settling on a winning tilt → 6 gold
  coin motes spiral outward with edge-flash trails → 6 pip-dots arranged
  in the winning sixes pattern)
- **DISSOLVE** — Priest (lifts upward + grows slightly → gold halo
  expands above + 7 motes rise in sequence → warm gold pool below body),
  Wizard (lifts slightly + 4 orbs orbit faster and brighter → hexagram
  sigil materializes above → fading hexagram lines), Witch (body
  bobs/sways + hat tips → green vapor swirl rising → green puddle
  settling at base), Warlock (contracts 1.0×→0.85× then expands once
  1.10× and holds → void eye opens above + ripple radiates inward then
  outward → dark void stain at base)
- **COLLAPSE** — Necromancer (body stretches upward, skull glows → 3
  small skeleton silhouettes briefly rise around body in salute then
  fade → bone fragments + lingering purple glow), Reaper (rotates
  slightly upward, hood pulls back → bone-arc crescent traces upward
  trailing blood-red → blood arc settling into a small pool), Geomancer
  (body stretches vertically becoming a standing stone → amber rune
  circle materializes on the ground around body + 4 short ley-line rays
  pulse outward → amber rune-mark scorched into the ground; the kit's
  full-network identity is implied by the outward rays, not shown, since
  wall-stones are outside the celeb-cam frame)
- **CUT** — Ronin (holds absolutely still, slight upright sheathing
  pose — the stillness IS the celebration, paralleling the death's
  stillness → single gold gleam across the body, held → blade-tip glint
  fading slowly)
- **SCATTER** — Archer (body draws back briefly then thrusts forward and
  holds → 5 arrow motes fire outward 360° → 3 arrows planted in ground
  around body, fletching upright)

### Two rules under all of it
1. **Visual-only & balance-safe.** These read fields set in the sim path, but the
   sim/balance never reads them back; spawners (`spawnImpact`, etc.) are
   headless-guarded. After any change, confirm `./balance.sh` output is bit-identical
   to the `MATCHUPS` block.
2. **Render discipline.** Line/shape-drawn, bounded, no large alpha fills (principle
   6). Never call `rng()`/`vrng()` in `draw()` (principle 7, GOTCHAS) — derive all
   motion from time, positions, or pre-rolled values.
