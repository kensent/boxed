# BOXED — audio principles

## What's in scope
Every synthesized sound event: ability casts (windup telegraphs + release impacts),
hit reactions, defensive responses, arena interactions (wall, collision, death), and
lifecycle sounds (K.O., win fanfare, UI). Ambient loops, idle textures, and
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
   effect on balance or replay. Sounds that need exact pitch (win fanfare) use
   `opts.exact`.

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

### Material identities — "the fighter IS the sound"
Each fighter has one material. Every sound they make — cast, hit reaction, death —
draws from it.

| Fighter     | Ability key  | Material identity                                     |
|-------------|--------------|-------------------------------------------------------|
| Berserker   | `tackle`     | Raw flesh + blood — wet thuds, primal low-end         |
| Knight      | `sword`      | Heavy plate steel — deep clang, resonant ring         |
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
  noise burst or low fundamental gliding up). Ranged-charge (Cannoneer/Priest/
  Ronin): a rising tone that tightens, matching the visual charge ring. Instant
  casts/throws: a brief pre-release flutter or shimmer, 50–100 ms.
- **Impact crack** — the moment of contact. This is the loudest, shortest element:
  a sharp transient whose character matches the material. Steel cracks bright;
  bone cracks hollow; flesh cracks wet and low; void makes no crack — it absorbs
  (a reverse-envelope silence-notch).
- **Resonance tail** — what the material does after impact. Steel rings down with
  a decaying harmonic. Bone settles with a short rattle. Arcane energy shimmers
  up then fades. Void closes with a sub-bass thud. The tail is where material
  identity is most audible — a hit that cuts off instantly has no identity.

### Arena sounds
Arena interactions are universal (not fighter-specific) and stay in the
background:

- **Wall bounce** — a stone thud: short lowpass noise + heavy sub-fundamental tone,
  fast decay (~120–140 ms). Quiet enough to never override ability sounds.
  Applies regardless of which fighter hits.
- **Fighter collision** — nearly inaudible: a dry click (~50–70 ms, lowpass noise),
  very low volume. Present so the contact is registered, absent as a sonic event.
  Never the loudest thing happening in a frame.

### Death archetype voices
Death is the ceiling (principle 5). Six archetypes matching `drawDeath()`'s
animation archetypes — each archetype has a sonic identity beyond the fighter's
own material, because death is bigger than the fighter:

- **BURST** (Berserker, Cannoneer, Sapper) — a low concussive boom + shockwave
  sub-bass pressure release. The body energy discharges outward all at once.
  Lowpass noise sweep from mid down to rumble, plus a heavy sub-fundamental.
- **SHATTER** (Knight, Duelist, Jester, Hunter, Gambler) — a high-pitched crack
  leading into cascading fragment noise. The body breaks into pieces. Bandpass
  noise with a falling filter sweep; multiple short bright tones staggered to
  simulate shard scatter.
- **DISSOLVE** (Priest, Wizard, Witch, Warlock) — the body's energy releases
  upward (or inward for Warlock). A soft ascending swell: rising sine harmonics
  or, for Warlock, a deep void absorption (inverted — the energy implodes rather
  than releases). No hard transient; the death fades in and out.
- **COLLAPSE** (Necromancer, Reaper) — a heavy thud + hollow settling. The body
  falls and comes to rest. Low impact noise + a bone/liquid residue sound that
  decays slowly. Reaper adds a wet resonance matching the blood-pool spread.
- **CUT** (Ronin) — a single clean whisper-crack, held for ~0.5 s then fading to
  silence. No scatter, no boom. The quietest death — the stillness after the
  blade is the point.
- **SCATTER** (Archer) — a bowstring snap (bandpass crack) followed by 6 small
  staggered impact tones, simulating arrows raining down. Light, bright, many-
  bodied. The only death sound with a distinct multi-event tail.

### Two rules under all of it
1. **Balance-safe.** `sfx()` is headless-guarded — it returns immediately when
   `headless` is true. Audio never affects `rng()` / `vrng()` or game state.
   After any audio change, `./balance.sh` output must remain bit-identical to the
   `MATCHUPS` block.
2. **Pitch variation uses `Math.random()`, not the seeded streams.** The per-
   instance detune in `tone()` and `noise()` is cosmetic. Never wire a sound
   parameter to `rng()` or `vrng()` — that would corrupt the deterministic sim.
