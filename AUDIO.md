# BOXED — audio principles

## What's in scope
Every synthesized sound event: ability casts (windup telegraphs + release impacts),
hit reactions, defensive responses, arena interactions (wall, collision, death), and
lifecycle sounds (intro reveal, K.O., UI). Ambient loops, idle textures, and
background music are out of scope — this is a purely event-driven sound system.

## Principles

1. **Fighter IS the sound.** Each fighter has a material identity — the physical
   character of the object doing the fighting. Berserker sounds like flesh and
   bone; Ronin sounds like fine drawn steel; Warlock sounds like void. Every
   sound that fighter makes (cast, hit, death) should be unmistakably *theirs*.

2. **Three-beat audio grammar mirrors animation.** Every ability has exactly three
   sonic beats: *windup texture → impact crack → resonance tail*. The windup
   builds tension; the crack is the blow landing; the tail tells the material
   what it's made of. A bone cracks differently than steel rings differently than
   void absorbs. This contract means when animation is revised, audio revision is
   already specified — no retrofitting.

3. **Juice over realism.** Exaggerate the sonic character, not the physics. A
   cannonball shouldn't sound realistic — it should sound *massive*. Synthesized
   means unconstrained: push the material to its expressive extreme.

4. **Event-driven only — no ambient sound.** Sounds are punchy flashes, not
   sustained textures. No idle drones, no looping ambience. The one exception is
   Warlock's drain beam (which channels for 1.2 s by design — a sustained hold,
   not an ambient loop). Every other sound begins and ends within the duration of
   the action that triggered it.

5. **Death is the ceiling.** Death sounds are the loudest, most complex, and most
   unmistakable sounds in the game. A heavy hit should feel big; death should feel
   bigger — the same principle as animation (principle 5 there). The K.O. boom
   sits above every other sound in the mix.

6. **Spatial audio tracks the fighter.** Every in-fight sound pans to the fighter's
   arena x-coordinate (±0.7 range). The player hears *where* the action is
   happening, which reinforces readability at mobile size where fighters are small.

7. **Arena sounds stay minimal.** Wall bounces and fighter collisions are present
   but recede. The wall thud is a universal stone stone impact — short, quiet
   enough to never dominate. Fighter collision is nearly inaudible (a click, not a
   crunch). Fights are about fighters, not the arena.

8. **Pitch variation is cosmetic, not deterministic.** Repeated sounds get a few
   percent of random detune so no two hits are byte-identical. This uses
   `Math.random()` — *not* the seeded `rng()` or `vrng()` streams — so it has no
   effect on balance or replay. Sounds that need exact pitch (intro reveal —
   `introRiser` / `vsClash`) use `opts.exact`.

9. **Audio and animation are designed as one system.** The visual beats (from
   ANIMATION.md) define the timing contract for corresponding audio moments.
   Attack animation anticipation = windup sound onset. Strike frame = crack.
   Recovery = tail decay. Never add an audio beat without a visual anchor.

10. **Consistent grammar, unique voice.** Every fighter follows the same three-beat
    structure (windup → crack → tail), but the execution is material-specific.
    Bone doesn't ring; steel doesn't rattle; void doesn't crack. Two fighters
    should never sound interchangeable.

---

## Grammars — the built vocabulary

The principles above are the WHY. These are the concrete grammars the system is
built from — each a *shared structure* with a *per-fighter voice* (principle 10).
Infrastructure that stays: `tone()` + `noise()` primitives, `panNode()`,
`masterGain()` + limiter, `sfx()` interface. What gets rebuilt: the `SOUNDS`
object, designed from scratch around material identity and the three-beat grammar.

### Intro reveal
Two-beat audio twin of the arena-as-reveal visuals (ANIMATION.md "Intro
reveal"). Lifecycle sounds, not fighter-specific. Both use `opts.exact` so
their pitch is reproducible — this is a UI beat, not a per-instance hit,
and cosmetic detune would feel inconsistent across replays.

- **`introRiser`** (T = 0, 0.85 s) — saw 110→520 Hz + triangle 220→1040 +
  bandpass noise sweep 240→2200. Climbs across the label-fade-in, building
  tension toward the clash.
- **`vsClash`** (T = 0.85 s) — bandpass noise crack 1400→280 + falling
  square 220→110 + triangle/sine chord at 660 / 990. Marks the VS-badge
  punch-in: "fight is starting, attention here."

Headless never calls `playVsIntro()`, so the balance harness is unaffected.
A pending `vsClash` is guarded by a game-token check so a quick restart
can't fire a stale beat into the new fight.

### Material identities — "the fighter IS the sound"
Each fighter has one material. Every sound they make — cast, hit reaction, death —
draws from it.

| Fighter     | Ability key  | Material identity                                     |
|-------------|--------------|-------------------------------------------------------|
| Berserker   | `tackle`     | Raw flesh + blood — wet thuds, primal low-end         |
| Geomancer   | `sigil`      | Granite + ley-light — heavy stone-thump, earthen crack, metallic chord chime |
| Duelist     | `riposte`    | Sharp drawn steel — precise ring, thin and bright     |
| Reaper      | `sweep`      | Hollow bone scythe — dry crack + crescent hiss        |
| Jester      | `blink`      | Ceramic mask — hollow pop, brittle, dissonant         |
| Ronin       | `iai`        | Fine drawn steel — whisper-crack, single clean note   |
| Priest      | `lightning`  | Holy resonance — bell tone, warm gold harmonic        |
| Wizard      | `cast`       | Arcane crystal — glassy harmonic, ascending shimmer   |
| Witch       | `hex`        | Toxic organic — wet dissonant hiss, unstable pitch    |
| Warlock     | `drain`      | Void — low sub-bass absorption, no bright content     |
| Necromancer | `raise`      | Dried bone — hollow rattle, dead resonance            |
| Cannoneer   | `cannon`     | Iron + gunpowder — percussive concussion, hard boom   |
| Sapper      | `mine`       | Dark metal casing — sharp metallic crack + pressure   |
| Archer      | `arrow`      | Wood + taut string — snap + thin whistle              |
| Hunter      | `grapple`    | Steel cable — hard metallic clink, coiled tension     |
| Gambler     | `wildcard`   | Ivory dice + gold coin — bright ivory click, bright   |

### Audio grammar beats — windup → crack → tail
The three beats apply to all ability-driven sounds. Ranged and melee differ in the
windup character; the crack and tail are universal.

- **Windup texture** — builds before the hit. Melee: a body-sound lean (short
  noise burst or low fundamental gliding up). Charged abilities (Cannoneer
  `chargeBig`, Priest `chargeUp`, Ronin `iai`, Berserker `rampageCoil`):
  a rising tone that tightens, matching the visual charge ring. Each is its own
  material (gunpowder rumble, holy bell, drawn-steel hum, primal flesh growl —
  never share a sound, principle 1). Instant casts/throws: a brief pre-release
  flutter or shimmer, 50–100 ms.
- **Impact crack** — the moment of contact. This is the loudest, shortest element:
  a sharp transient whose character matches the material. Steel cracks bright;
  bone cracks hollow; flesh cracks wet and low; void makes no crack — it absorbs
  (a reverse-envelope silence-notch). For melee, the windup (swing) and the crack
  (contact) are *two triggers* a beat apart: the dashers (Berserker/Duelist)
  swing at launch and crack on connect — so a whiff sounds the swing with no
  crack. Jester (teleport) and Ronin (iai) ALSO crack on connect — their
  per-hit impact sound layers on top of the strike sound for a clearer "hit
  landed" beat, even though the strike sound already telegraphs the cut. (This
  walks back the original "they don't double up" rule — playtesting showed the
  strike sound alone was thin enough that the kill hit could feel silent under
  the K.O. cinematic.) See the force-shape mirror below.
- **Resonance tail** — what the material does after impact. Steel rings down with
  a decaying harmonic. Bone settles with a short rattle. Arcane energy shimmers
  up then fades. Void closes with a sub-bass thud. The tail is where material
  identity is most audible — a hit that cuts off instantly has no identity.

### Impact cracks — the force-shape mirror
The crack is the audio twin of the visual force-shape (ANIMATION.md). Melee cracks
(`hit`, routed by the attacker's ability) carry the fighter's material; projectile,
trap, and minion impacts route through one `impact({kind, big})` dispatcher — one
primitive per kind, mirroring `spawnImpact`/`drawImpact`. Volume scales with the
hit's magnitude (`big`, 0..1):

- **Melee** — flesh thud (Berserker) · thin puncture (Duelist) · steel
  whisper-crack (Ronin) · ceramic puncture (Jester). Reaper is no longer melee
  (HARVEST is a returning projectile — its crack lives in the projectile mirror
  below as "bone arc").
- **Projectile / trap / minion** — arrow puncture · cannon concussion · hex wet
  splat · coin ding · orb rune-pop · lightning zap · hook clink · bone clack
  (Reaper crescent + Necromancer skeleton burst) · mine casing-crack + pressure.
  Each plays at its `spawnImpact` site so kind is known.
- **Field** — Geomancer's SIGIL is its own sub-grammar: a single `sigilCrack`
  on the staff slam (earthen crack + sawtooth thud, the gesture's audio twin)
  followed by `sigilLines({count})` — a staggered chord of metallic chimes,
  one per drawn ley-line, slightly detuned per chime so the chord feels
  harmonic. Headless-guarded as a single sfx call so the timer fan-out
  never leaks into the sim path. No per-line "impact crack" — the chord IS
  the impact mirror. Per-bounce, a heavy `stoneThump` (lowpass noise +
  earthen fundamental) marks each new runestone planting in the wall.

The **SHATTER burst** (Archer's cushion releasing at 5 stacks) gets a *dedicated*
sound (`shatterBurst`) — a wider crack + falling whoosh, not just a louder per-
arrow impact. It's the climax of the cycle, so it gets its own voice.

The **WAKE step-in** (Reaper crescent trail biting an enemy) gets a soft `wakeTick`
hiss per damage tick, same exception as Cannoneer's incendiary `burn` — continuous
damage gated to a sizzle, never a sharp crack. Per-target `wakeHitCd` caps the
rate so it never machine-guns.

Continuous damage never ticks a *sharp* crack — that would machine-gun. Fog and
drain stay crack-less (the drain beam drone covers its own channel; fog rides its
visual). The incendiary burn is the one exception: each 0.2s tick plays a soft, low
fire crackle (`burn`) tuned to read as a sizzle, not an impact — the sustained
hiss of standing in fire, not five little explosions.

### Arena sounds
Arena interactions are universal (not fighter-specific) and stay in the
background. Both are **self-throttled inside `audio.js`** (an ~80 ms gate keyed on
`AudioContext.currentTime`, never sim state) so corner jitter or a multi-frame body
overlap can't stutter them into a buzz:

- **Wall bounce** — a stone thud: short lowpass noise + heavy sub-fundamental tone,
  fast decay (~120–140 ms). Quiet enough to never override ability sounds.
  Applies regardless of which fighter hits.
- **Fighter collision** — nearly inaudible: a dry click (~50–70 ms, lowpass noise),
  very low volume. Present so the contact is registered, absent as a sonic event.
  Never the loudest thing happening in a frame.

### Death voices — per-fighter, material-identity driven
Death is the ceiling (principle 5) — the loudest moment each fighter has, so
the place their material identity should read MOST clearly. Each fighter's
death voice is unique, drawing from their material identity (table above)
while still sitting in the tonal shape of the animation archetype
(`drawDeath()`'s BURST/SHATTER/DISSOLVE/COLLAPSE/CUT/SCATTER). Two fighters
should never sound interchangeable at the moment of death.

- **BURST archetype** (low concussive boom + shockwave):
  - **Berserker** — wet meaty primal BOOM (flesh + blood), low oscillating
    sub-bass body, wet aftershock.
  - **Cannoneer** — sharp percussive iron detonation + gunpowder fizzle
    tail (the hard mechanical bang).
  - **Sapper** — metallic casing-crack onset + hot-metal boom + three
    shrapnel pings as the casing scatters.
- **SHATTER archetype** (high crack into bright shard scatter):
  - **Duelist** — clean steel snap + thin bright ring + 3 staggered
    sword-shard pings (pure, no noise residue).
  - **Jester** — hollow brittle pop (ceramic) + dissonant overtone +
    4 ceramic-shard clatters (pottery breaking).
  - **Hunter** — tensioned coil-release rising tone + hard cable-crack +
    cable-hum + 3 metallic shard scatters.
  - **Gambler** — bright ivory click + ivory clatter + cascading 6-coin
    gold chime descent (the jackpot scatter).
- **DISSOLVE archetype** (swell — ascending or inverted):
  - **Priest** — warm gold bell tone ascending through 3 harmonics (440 →
    1760 Hz). The death rises.
  - **Wizard** — glassy crystal shimmer ascending + bright sparkle noise +
    a delayed upper-octave wisp.
  - **Witch** — unstable wet warble (sawtooth + square detuned) + wet
    lowpass hiss + bubbling cauldron tail.
  - **Warlock** — void absorption: pure sine descending into sub-bass
    (200 → 28 Hz). Inverted — the energy implodes rather than releases.
- **COLLAPSE archetype** (thud + material-specific settle):
  - **Necromancer** — heavy thud + hollow bandpass rattle + 3 bone-clatter
    pings settling (dried bones falling).
  - **Reaper** — body-fall thud + dry bone-crack + delayed wet blood-pool
    spread (the wet resonance is the bloody slump).
  - **Geomancer** — deep stone-fall + earthen sub-fundamental rumble +
    gravel hiss tail + 3 dim ley-line chord chimes snapping (the network
    dying).
- **CUT archetype** (single sustained):
  - **Ronin** — clean whisper-crack + pure sine + triangle chime sustained
    over 0.7 s, no scatter. The quietest death — stillness after the blade.
- **SCATTER archetype** (multi-event):
  - **Archer** — bowstring twang + 6 staggered arrow-whistles with lowpass
    thuds (arrows raining down). The only death with a true multi-event tail.

Routed by `death(ability)` in `audio.js` — one switch case per fighter,
fallback to a generic heavy death for any new fighter without a bespoke voice.

### Defensive responses & state cues
The audio twin of the on-fighter state indicators (ANIMATION.md). An *active
defensive response* — the moment a hit is mitigated — always sounds, in the
defender's material; a *passive ongoing state* generally doesn't (its visual
carries it), with key transitions getting a one-shot cue:

- **Defensive responses (audible).** Duelist parry = bright steel deflect
  (`parry`, fires for both projectile-reflect AND melee-parry-absorb during
  the RIPOSTE thrust window) ·
  Wizard Mana Shield = glassy arcane absorb as an orb spends out (`shield`).
  The shield is gated off drain DoT so a continuous tick can't machine-gun it.
  Jester's old UNCANNY DODGE `negate` whiff is gone — DOPPELGANGER replaced
  the dodge mechanic entirely, and decoy-intercepted hits resolve silently
  in the projectile/melee hit loops (the decoy absorbs the attack; the
  phantom dies without an audible cue, since it was never a real fighter).
- **State transitions (one-shot cue).** Berserker Bloodrage = a rising primal
  growl the instant HP crosses below 50% (`bloodrage`, fires once on activation).
  Skeleton dying alone = a soft bone crumble (`boneCrumble`); when its
  death-burst catches an enemy it escalates to `boneBurst`. The closing-ring
  `ringClose` swell is gone with the fog mechanic itself (no longer triggered).
- **Silent states.** Stun, Witch's-mark, slow, FOCUS, DOUBLES (formerly
  LOADED) — their visual forms carry them; no standing audio. The
  one-shot flag driving the cue above (`f.rageWasActive`) is audio-only —
  gameplay never reads it.

### Two rules under all of it
1. **Balance-safe.** `sfx()` is headless-guarded — it returns immediately when
   `headless` is true. Audio never affects `rng()` / `vrng()` or game state.
   After any audio change, `./balance.sh` output must remain bit-identical to the
   `MATCHUPS` block.
2. **Pitch variation uses `Math.random()`, not the seeded streams.** The per-
   instance detune in `tone()` and `noise()` is cosmetic. Never wire a sound
   parameter to `rng()` or `vrng()` — that would corrupt the deterministic sim.
