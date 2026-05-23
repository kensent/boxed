# BOXED — ability redesign proposal

**Status (2026-05-23):** the redesign has been *executed*. Every fighter
listed below has shipped. **Knight was retired and replaced by Geomancer**
(see the GEOMANCER section near the end) — the wall-bouncing identity
finally landed in a kit that *uses* the bounce as its core mechanic instead
of fighting against it. The at-a-glance table tracks current state; each
section's `IMPLEMENTED & VALIDATED` block captures the final tunables and
matchup texture.

## Project-level changes that shipped alongside the redesigns

These aren't fighter redesigns but they're load-bearing on everything:

- **Arena shrunk 360 → 300.** Once the melee redesigns landed (Berserker
  rampage, Ronin overshoot, etc.) the original 360 arena couldn't reliably
  put two random-bouncing fighters in contact. ARENA dropped to 300
  (~45% denser); every fighter was re-tuned around the new connection
  rate, landing the roster in a ~10–12 point band.
- **Closing-ring fog removed.** Shorts viewers want fights resolved on
  the fighters' merits, not by an arena hazard at 20s. Post-shrink fights
  resolve in 11-15s on their own, so fog was rarely doing real work. The
  headless 4000-tick guard remains as a stalemate safety net.
- **Camera simplified.** The dynamic follow-cam (pan deadzone + comfort
  zoom) was disabled — the smaller arena already frames both fighters
  statically at zoom 1.0. The kill-cam push-in on the loser is preserved,
  and now holds the loser's INTACT sprite during the push-in (death
  animation begins fresh from frame 0 the moment the cam arrives, instead
  of starting voice-effect layers during the push-in).
- **DOPPELGANGER substrate.** Jester's UNCANNY DODGE was replaced with
  decoys (see Jester's section). The supporting change is a *universal*
  "aim at nearest of {real, decoys}" rule routed through one helper
  (`pickTarget` in engine.js) that every fighter's aim path uses. For the
  14 non-Jester fighters this collapses to "aim at the real enemy" and
  behaviour is unchanged; for Jester it's the whole counter-texture.
- **Duelist COUNTER simplified.** Used to be "free auto-thrust on every
  melee hit Duelist takes" — a 80-dmg tax on anyone who touched him.
  Now `COUNTER` is purely defensive: the RIPOSTE thrust window parries
  melee hits (absorbed, no damage) and reflects projectiles. No proc.
- **hitStop frame-freeze removed.** A few-ms sim pause on hits ≥120 dmg
  was a "feel" mechanic that ran deterministically in the sim loop —
  removed entirely (function, callsites, advance() handling). The visual
  punch lives in the damage float + recoil + flash now.
- **New balance tooling.** Per-matchup "tight fight" stats added (`balance.sh`
  output now includes a per-matchup `tight#` and `tight avg time` table,
  counting fights where the winner finished < 30% HP — drama indicator).
  Picker UI gained a **HUNT A CLOSE FINISH** button alongside HUNT THE
  UPSET and HUNT A TIGHT FIGHT.
- **Knight retired, Geomancer added.** Knight's melee-tank-under-DVD niche
  was the hard design corner of the redesign (every prototype hit one of:
  un-tunable reactive timing, off-brand ranged, off-brand homing, or
  "just a dash"). Geomancer ships in the same roster slot with a new
  "Field" attack grammar: STANDING STONES plant on each wall bounce, SIGIL
  fires amber ley-lines between every stone — the DVD bounce IS the
  ability-input rather than something to fight against. EXCLUDE_IDS is
  now empty in both `boxedshard.js` and `boxedmerge.js`; `balance.sh` is
  at 8 shards × 15 = 120 matchups (all 16 active fighters in balance).
  Knight's sprite (kite shield), death (4-quadrant SHATTER), and audio
  (sword crack + armor clank) were removed from the codebase.

---

## Original framing (kept for the design intent record)

**Original status:** sketch / for discussion. Mechanics only — **numbers
are deliberately omitted**; balance is a separate tuning pass once verbs
are locked.

## The problem this fixes

A pass over the roster (see `fighters.js` / `abilities.js`) found that the
*active* ability — the thing the card leads with — carries no identity for a
chunk of the roster:

- **Five of six melee fighters run one verb:** "set velocity at the enemy, deal
  damage on reach." Berserker `tackle`, Knight `sword`, Reaper `sweep`, Duelist
  `riposte`, Ronin `iai` are the *same interaction*; the "slam," "spin," "charge"
  are cosmetic labels. All the differentiation lives in the **passive and stat
  block**, not the active. (Duelist escapes — reflect-projectiles + auto-counter is a
  genuinely different layer. Ronin *almost* escapes via its windup + line-cleave +
  FOCUS loop, so the redesign below *elevates* its existing line-cut rather than
  replacing the fighter; the other three need new verbs outright.)
- **Priest** is the weakest design in the game on *both* axes: a plain homing bolt
  (the single most generic attack) plus a flat heal-on-cast that just ticks with no
  decision or synergy.
- **Archer** is generic-but-clear: "shoot fast, fan every 4th." Functional, low
  identity.

Three more are reworked for reasons *other* than a generic verb: **Cannoneer** and
**Ronin** to deepen already-decent identities, and **Sapper** because its trap is
near-unusable under autonomous RNG movement (it drops at Sapper's own random spot and
waits for the enemy to wander over it). The remaining eight have a distinct verb that
holds up under RNG and are left alone (see *Keep*, below).

## Design philosophy for the redesign

1. **One unique verb per fighter.** Every redesign below is checked against the
   whole roster — no two fighters share a mechanic. The goal is that you can name
   the fighter from its *behavior* with the art stripped off.
2. **Weaponize the arena.** BOXED's defining feature is DVD-style wall bouncing.
   Almost nothing in the current roster *uses* it. Several redesigns turn the
   bounce, the open space, and ballistic enemy movement into the mechanic.
3. **Active/passive synergy.** Where a fighter's passive is just a stat, re-tie it
   to the active so landing the ability *means* something.
4. **Emergent, not authored.** This is an auto-battler — fighters move on their own,
   nobody clicks. "A good verb" means the *outcome* varies with positioning,
   timing, and the opponent's trajectory, producing real matchup texture
   (DESIGN principle 3: win most, lose a few badly).
5. **Death ceremonies are untouched.** The 16 bespoke deaths (ANIMATION.md /
   AUDIO.md) are already identity-locked and excellent. Redesigns change the
   *ability*, never the death. Material identities (AUDIO.md) are also preserved —
   a redesigned Priest still sounds like a bell, a redesigned Berserker still
   sounds like flesh.

## At a glance

| Fighter | Verdict | New verb |
|---|---|---|
| **Priest** | shipped | `JUDGMENT` — predictive light pillar; landing it heals (re-tuned dmg/cd/heal after the arena shrink) |
| **Berserker** | shipped | `RAMPAGE` — wall-ricocheting charge, hits per pass |
| **Knight → Geomancer** | **REPLACED** | Knight retired; **`SIGIL`** — runestones plant on each wall bounce, the cast fires amber ley-lines between every stone and burns whatever crosses them |
| **Reaper** | shipped | `HARVEST` — returning scythe (semi-ranged boomerang) + WAKE: the arc leaves a damaging trail |
| **Archer** | shipped | `VOLLEY` — fan of arrows per cast + SHATTER (cushion of embedded arrows bursts at 5 stacks for stacks×N damage) |
| **Ronin** | shipped | `IAI` — overshoot line-cut + FOCUS chain skips the windup for instant follow-ups |
| **Cannoneer** | shipped | `BOMBARD` — dumb heavy shell + EPICENTER falloff (max at center, scales to 0 at edge) |
| **Sapper** | shipped | `STICK CHARGE` — thrown fused limpet bomb; sticks on contact, detonates after a fuse, BLAST RADIUS knockback |
| Wizard | keep | orbs are offense **and** shield |
| **Jester** | shipped | `BLINK DAGGER` (unchanged) + `DOPPELGANGER` — every hit spawns a phantom decoy, uniform "aim nearest" routes enemy abilities into the decoy first |
| **Duelist** | shipped | `RIPOSTE THRUST` (active, offense only) + `COUNTER` (passive: the thrust window parries melee hits and reflects projectiles — no auto-counter-thrust proc) |
| Necromancer | keep | summon + explode-on-death |
| Witch | keep | wall-bouncing bolt + damage-amp mark |
| Hunter | keep | reel the **enemy** in + stun |
| Warlock | keep | channel tether: slow + leech |
| Gambler | keep | six distinct dice patterns |

---

# Redesigns

## PRIEST → `JUDGMENT`
*Material: holy resonance, bell tone, warm gold (unchanged).*

**Active — JUDGMENT.** Priest marks the enemy's *predicted* position (leading their
current velocity) and, after a short windup, a vertical pillar of light slams down
on that spot.

**Passive — DIVINE GRACE (re-tied).** Landing a judgment restores HP. Whiff it and
you get nothing.

**Why it's distinct.** It's the only attack that plays *against* ballistic movement:
it leads the enemy's current velocity, so a fighter moving in a straight line gets
struck, but a genuine *vector change* during the windup (or Jester's teleport) dodges
it. No one else has a delayed ground-target that leads the enemy (Sapper's mine sits
at Priest's own position and waits for contact; this hunts a future point).

**The real fix.** Today the heal ticks regardless of anything Priest does — zero
synergy. Tying sustain to *landing* judgment creates the loop Priest has never had:
hit → live; miss → starve.

**Reads as.** A reticle blooms at the target spot, the existing priest charge gleams
orbit and tighten, then a gold column drops with a ground-ring force-shape — a
satisfying inversion of Priest's DISSOLVE death (judgment comes *down*; the soul
rises *up*).

**Sounds as.** Windup = rising bell harmonic; the pillar = a bright bell-strike with
a warm gold resonance tail; a soft ascending chime confirms the heal on a hit.

**Implemented & validated** (`abilities.js`/`arena.js`/`fighters.js`; internal id
stays `lightning` to keep the DISSOLVE death + telegraph + audio). Refinements made
during the prototype:
- **Aim is clamped inside the arena**, not a raw straight-line lead. A pillar in the
  void past a wall looked like a misfire and made Priest dead weight whenever the
  enemy was near an edge — so the strike always targets a spot a fighter could
  occupy. Net: *wall-hugging no longer auto-dodges*; the counterplay is genuine
  mid-arena vector changes + Jester. (This walks back the original "wall bounce is
  THE counterplay" framing.)
- **Hit = body overlaps the gold zone** (`dist < pillarRadius + FIGHTER_SIZE`), so
  the reticle and the hit boundary are the same circle — no whiff on a fighter
  visibly inside the ring.
- **DIVINE GRACE heals only on a connecting hit** — a judgment phased by Jester's
  dodge still strikes (pillar + sound) but grants no heal; a reduced (armor/shield)
  hit still counts.
- Tunables: `windupTime 0.45`, `pillarRadius 34`, `healOnHit 18`, `dmg 105`,
  `cd 1.6`. Tuned down from the post-prototype defaults (`dmg 180`, `cd 1.4`,
  `healOnHit 28`) which had Priest at **~86% overall** — the predictive aim
  plus 128 dps plus 28-hp sustain blew everyone out. Current numbers land at
  **48.1% overall**, ~13.5s avg, ~2% fog. Clean matchup texture: wins
  attrition fights (Wizard 98, Archer 94, Sapper 90, Warlock 89), gets
  hard-countered exactly as designed (Berserker 0, Knight 0, Jester 1,
  Ronin 10 — vector-change punishers, the dodge phase, and the armor wall
  that the math can't break through). The 0% vs Knight is geometric: 105
  dmg − PLATE ARMOR's flat −20 = 85/hit vs 1110 HP = ~13 casts at ~2 s
  each = 26 s to kill, longer than the fight allows.

---

## BERSERKER → `RAMPAGE` *(shipped — wall-ricochet charge)*
*Material: raw flesh + blood, wet thuds, primal low-end (unchanged).*

> **IMPLEMENTED & VALIDATED.** Built as proposed, plus a windup added later.
> Current tunables: `hp 920, speed 145, dmg 82, cd 1.7, windupTime 0.5,
> rageBoost 0.33, rampageDur 1.1, rampageSpeedMult 4, rampageHitGap 0.22`
> → **~49% overall, ~14.4s avg**.
> - **The big lesson — dmg × hits-per-rampage is a multiplier, not a sum.**
>   Each rampage lands ~3-5 passes through the enemy at the small-arena
>   geometry, so per-pass dmg moves the matchup at roughly **~1 win-rate
>   point per 1 dmg** (much sharper than HP's ~1 pt per 40 hp rule of
>   thumb).
> - **Windup added (the user wanted a coil-then-explode beat).** RAMPAGE was
>   the only heavy attack in the roster with no telegraph; everyone else with
>   big payoff (Priest pillar, Ronin iai, Cannoneer BOMBARD) has a visible
>   coil. Added a 0.5s mechanical windup: body slows to 40% speed (NOT a
>   full plant — still bounces, just visibly strains), crimson charge ring
>   fills, body trembles in place, four radial coil-lines pulse inward.
>   **Aim picks at RELEASE, not at cast** (Berserker's exception to the
>   lock-at-cast convention — fits the "wild bruiser uncoils toward
>   wherever the enemy is" identity, vs. Ronin's meditative cast-lock).
> - **Custom windup audio: `rampageCoil`.** Originally reused Priest's
>   `chargeUp` (holy bell rising tones) — material-identity collision per
>   AUDIO.md principle 1. New: primal sawtooth growl 70→160Hz under a
>   lowpass-noise body rumble. Distinct material from Priest.
> - **Don't let the bruiser win by timeout.** First post-prototype defaults
>   (`hp 1050, dmg 100`) put Berserker at ~74% — clean smasher, too strong.
>   Cutting dmg to 75 dropped to 49.7% but pushed fog to 25% — Berserker
>   winning via attrition, character-wrong. Trimming hp to 920 + dmg 82
>   landed it at ~49%. The 0.5s windup vulnerability is paid for by the +6
>   dmg (76 → 82 after the windup was added).
> - **Matchup texture.** Smashes squishy/slow enemies (Priest 100, Jester ~37,
>   Warlock 83, Ronin 55) and crashes into mitigation (Sapper 27, Witch 21).
>   Duelist matchup flipped from 2% to 63% when COUNTER stopped auto-thrusting
>   on every melee hit (Berserker no longer eats free counter damage per
>   rampage pass).

**Active — RAMPAGE.** The charge no longer stops at the target. Berserker becomes a
high-speed body that **ricochets off the walls** for a short window, dealing damage
on every pass through the enemy.

**Passive — BLOODRAGE (unchanged, now synergistic).** Under 50% HP the speed buff
means *more bounces per rampage* — the comeback mechanic feeds the new active for
free.

**Why it's distinct.** It weaponizes the single defining mechanic of the game — the
DVD bounce — which nothing else does. Berserker turns the arena into his weapon.
It's a temporary *state*, not a point-and-dash, and it reads instantly: a red blur
pinballing off the walls.

**Matchup texture.** High-variance burst: a single ricocheting body firing off several
random passes is a cluster of *chances* to connect, not a guaranteed hit. It pays off
big when the bounce geometry happens to thread the enemy and whiffs when it doesn't —
swingy by nature, which suits spectator content. (The arena walls never move and the
fog doesn't herd anything — random-bouncing bodies still use the whole arena — so
there's no reliable late-game "they cluster in the centre" scaling; it's chance.)
Tuning levers: pass count, ricochet speed, hit radius.

**Reads as.** The shared `meleeWindupHold` hold-and-whip launches it; the body
stretches into a smear, squashes against each wall and whips off with a small
shockwave, and drives the usual damage-scaled victim recoil on each connect.

**Sounds as.** Primal growl-lean on windup; a wet flesh thud on each enemy pass; a
heavy meaty slam on each wall ricochet; low primal rumble tail.

---

## KNIGHT → RETIRED, replaced by GEOMANCER
*Material: heavy plate steel, deep clang, resonant ring (removed from roster).*

> **STATUS (2026-05-23): RESOLVED by replacement.** Every Knight direction we
> tried hit a wall, because a **melee tank under autonomous DVD movement** is a
> genuinely tight design box. What we explored and why each failed (kept here
> as the design-journal record of what doesn't work, so we don't relitigate):
> - **BULWARK (reactive absorb → counter-return):** *impossible to balance.* Its
>   output depends on the enemy attacking during an un-timable stance window;
>   with no agency to time the guard, the result is RNG coincidence, not a
>   tunable function. (The general no-reactive-timing lesson — see GOTCHAS.)
> - **JUGGERNAUT (continuous homing pursuit + bash):** tuned and paced great,
>   but **broke the DVD-bounce identity** — Knight cutting straight at the
>   enemy looked wrong.
> - **SHIELD THROW (boomerang projectile):** keeps DVD and tunes cleanly, but
>   **turns the frontline tank into a ranged fighter** — off-brand.
> - **SHIELD CHARGE (brief dash-charge + tank twist):** keeps DVD and is melee,
>   but the locomotion is "a dash," so it's only a modest twist on the generic
>   dash we're trying to move the cluster *away* from.
>
> **The trilemma:** a melee tank under DVD can only land reliable damage by
> (a) dashing to close — on-brand but "just a dash"; (b) reaching out — ranged,
> off-brand; or (c) random body-contact — pure DVD but unreliable/slow. There's
> no clean fourth path *for a melee tank*.
>
> **The resolution: a fighter that *uses* the DVD bounce as its core mechanic
> instead of fighting against it.** Geomancer (next section) plants a runestone
> on each wall hit, then the SIGIL cast fires amber ley-lines between every
> stone — damage emerges from the planted geometry, not from a body that has
> to close to land it. The bounce-rich autonomous movement *is* the
> ability-input. The Knight slot is now Geomancer's. Knight's SHIELD/SHIELD BASH
> code, sword/armor sounds, and shield-shape sprite were removed from the
> roster; the BULWARK sketch below is preserved as a record of what didn't work.

**Active — BULWARK.** The opposite of a dash. Knight **plants** and raises guard for a
brief stance. Damage taken during the stance is reduced *and* **banked**; when the
stance ends, the banked total is hurled back at the enemy as a **guaranteed homing
return** — a steel shockwave that travels to wherever the enemy is. (A single
proximity pulse would mostly whiff: Knight is stationary in the stance and movement is
RNG, so the enemy is rarely adjacent at the release instant. Guaranteed delivery is
what makes the payoff real under autonomous motion.)

**Passive — PLATE ARMOR (unchanged).** Flat per-hit reduction still defines the
"tanky vs chip, weak to one big hit" identity — and now the active expresses that
same wall-that-punishes fantasy instead of contradicting it with a lunge.

**Why it's distinct.** A tank shouldn't charge. The *active* is a fortress that
converts incoming damage into a return strike. Distinct from Duelist (whose riposte
*reflects projectiles* back along their path and counters melee on contact): Knight
banks a fraction of **all** damage taken — projectiles and melee alike — and returns
it as one guaranteed bolt on its own clock, no contact required.

**Matchup texture.** Its bank is fed by whatever damage Knight happens to absorb, so
it's strongest against high-DPS attackers (more to soak, bigger return) and feeble
against intermittent or low-damage chip — the return is only ever as big as what went
in. An empty stance (nothing hit Knight during the window) returns nothing.

**Reads as.** Knight plants; a guard-glow ring forms (buff = ring, per the state
grammar) with a fill-meter rising as damage is banked; release sends the Knight's
**flat-bar** force-shape arcing out to the enemy.

**Sounds as.** Deep clang as it plants; a dull armored clank on each absorbed hit
(reuse `armor`); a big resonant steel *bong* with a long ring-down on release.

---

## GEOMANCER → `SIGIL` *(shipped — Knight's slot; wall-bouncing field caster)*
*Material: granite + ley-light. Heavy stone-thump on plant, earthen crack on cast, metallic chord chime on each line.*

> **IMPLEMENTED & VALIDATED (2026-05-23).** Geomancer ships in the Knight slot
> as the resolution of the melee-tank-under-DVD trilemma. Instead of trying to
> *bypass* the autonomous bounce, this kit *uses* it: every wall-bounce plants
> a runestone, and the cast fires amber ley-lines between every stone. The
> DVD movement IS the ability-input.
>
> **Identity (sprite v2).** A standing stone (menhir) — a faceted granite
> block with a carved amber rune glowing on the forward face. The fighter
> IS one of his own runestones, wandering the arena (the kit's wall-stones
> are smaller copies of himself; the SIGIL connects them all — including
> the fighter — into the network). One object, matching the roster's
> "Necromancer = skull, Witch = hat, Wizard = book" single-icon pattern.
> Forward = +x (the carved face). Sprite v1 was a multi-piece pilgrim
> (cloak + brimmed hat + staff with rune-disc + brim-stones) — replaced
> because it was visually too busy and didn't read as a coherent object.
> Color palette: granite gray-brown body, dark-brown rear-edge shadow,
> recessed front-face panel, amber rune-glow.
>
> **PASSIVE — STANDING STONES.** Each wall-bounce drives a granite runestone
> into the wall at the contact point (deterministic; no rng — the bounce IS
> the input). Stones are inert markers, glowing amber; they persist at full
> alpha (no time decay) and are evicted only when the `maxStones` cap is hit
> (oldest first). The arena gradually accumulates a perimeter network.
> Speed bumped to 120 (above the 100 median) so the bounce cadence stays
> brisk — the kit's input is wall hits, so faster movement = faster ramp-up.
>
> **ACT — SIGIL.** Instant cast (no windup): Geo slams the staff and, for
> `sigilFlashDur`, amber ley-lines are drawn between **every pair of nodes**
> in the network, where the node set is `[self, ...stones]`. The fighter
> himself is a node — the kit's "fighter IS one of his own stones" identity,
> mechanically true. So the first wall-bounce already creates a damaging
> `self → stone` line; the network grows organically as more stones plant.
> Any line crossed by the enemy body (or a decoy) at the cast frame deals
> `f.dmg` per crossing. Decoys hit by lines are consumed. The topology is
> **all-pairs**, not nearest-neighbour — see the topology note below.
>
> **Topology — all-pairs, not nearest-neighbour.** The first prototype linked
> each stone to its 2 nearest. Sounded clean, but stones plant on walls — the
> nearest stones are ADJACENT along the same wall, so links hugged the perimeter
> and **never crossed the arena interior** where the enemy lives. Geo ran at
> **0% win rate**. Switching to ALL-PAIRS (every stone links to every other)
> produces ~28 lines at the 8-stone cap, of which ~4 typically cross the enemy
> body — the per-line `dmg` is tuned around that count. The `linksPerStone`
> field survives unused on the fighter object in case a future topology wants
> to clamp the network density. See `computeSigilLinks()` in `abilities.js`.
>
> **Decoy interaction (DOPPELGANGER substrate).** Decoys are valid line-cross
> targets — a sigil line crossing a phantom Jester consumes it (same shape as
> projectile/melee decoy intercept). Counter-intuitively, this makes Geomancer
> **the hardest counter to Jester in the roster** (~99% vs Jester): every hit
> Jester takes spawns a fresh decoy near her current position, and the next
> sigil's lines tend to cross BOTH Jester AND the decoy. Decoys get vaporised
> and stop providing real interference because the sigil rebuilds the line set
> every cast. The standard DOPPELGANGER counter-shape (decoys absorb single
> attacks) doesn't apply when the ATTACK is many simultaneous lines.
>
> **Audio (Field grammar — new sub-category).** A staff-slam `sigilCrack`
> (earthen crack + sawtooth thud) on cast; a single `sigilLines({count: n})`
> sfx fires `n` slightly-detuned metallic chimes in a staggered chord (one per
> line), with the setTimeout fan-out gated by the headless-guarded `sfx`
> boundary so it can't leak timers into the sim path. Per-bounce `stoneThump`
> (lowpass noise + earthen fundamental) on each new stone planting. AUDIO.md
> updated with the Field grammar entry.
>
> **Death (COLLAPSE).** Stone tips forward + sinks; gravel burst at the base
> + amber rune flares one last time on the carved face + 4 ley-lines retract
> inward to the body (the only "things flying INTO the corpse" death voice —
> every other death's voice radiates outward). Residue: granite chunks
> scattered around a dim amber rune-mark scorched into the ground at the
> stone's centre, fading last.
>
> **Numbers (current):** hp 1100, dmg 85 (per line crossing), cd 2.5,
> speed 120, maxStones 8, sigilFlashDur 0.6, lineWidth 4, linksPerStone 2
> (unused; reserved). **~51% overall.** Spread 12 points (Ronin 56.5% top →
> Jester 44.4% bottom).
>
> **Matchup texture (sim-validated, after the self-node + speed-bump pass).**
> STRONG: Jester 99% (decoys are absorbed as line crossings), Duelist 86%
> (no parry against a field cast — even sharper than before; the self-lines
> emanating from Geo's body cross the dueling lunge path), Archer 72%,
> Geomancer leads several middle-tier matchups. EVEN: Necromancer 51%,
> Witch 41% (the witch's mark + chip-by-chip wins close fights). WEAK:
> Ronin 25% (line-cut overshoots Geo cleanly; FOCUS chains end the fight),
> Warlock 35% (sustained drain outlasts the network), Cannoneer 36%
> (one-shot windup KOs before the network matures), Wizard 3% (mana shield
> + orb chip dominates the early game — Wizard is now Geo's hardest
> counter, replacing Hunter from the previous pass).
>
> **Implementation files touched:**
> - `js/fighters.js` — entry replaces Knight's slot; props expose tunables.
> - `js/engine.js` — `bounce()` extended to plant stones on each wall hit
>   per fighter; `plantStone()` handles cap-eviction; `makeFighter()`
>   initialises the live arrays (empty — no corner pre-seed); `step()`
>   ticks the born-burst + sigilFlash (no lifetime decay).
> - `js/abilities.js` — `case 'sigil'`: builds nodes = `[self, ...stones]`,
>   computes all-pairs link set, segment-circle test against enemy + decoys,
>   damage applied as one summed call. Helpers: `segIntersectsCircle()`,
>   `computeSigilLinks()`.
> - `js/render/sprites.js` — `case 'menhir'` body sprite (single granite
>   stone with carved amber rune; rear-edge shadow for 3D form; subtle
>   weathering crack). Replaced the original multi-piece `case 'pilgrim'`.
> - `js/render/arena.js` — stones-in-walls render pass + sigil-flash render
>   pass + `case 'sigil'` in `drawDeath` for the COLLAPSE-with-retraction.
> - `js/audio.js` — `stoneThump`, `sigilCrack`, `sigilLines` (new SOUNDS
>   entries); `case 'sigil'` added to the COLLAPSE branch of `death()`.

---

## REAPER → `HARVEST` *(shipped — semi-ranged returning scythe; originally pitched as CRESCENT THROW)*
*Material: hollow bone scythe, dry crack + crescent hiss (unchanged).*

> **IMPLEMENTED & VALIDATED.** Reaper went **semi-ranged** with a returning
> scythe, **not** the orbiting field sketched below. Why the pivot:
> - A body-attached field on a *non-pursuing* Reaper hits the same **DVD
>   slow-connection trap** that sank Knight — under autonomous RNG, a proximity
>   effect only connects when the enemy randomly drifts close, which paces slowly.
>   This confirmed a structural truth: **melee delivery under DVD is a tight design
>   space** (reliable damage wants a projectile or a dash), so distinct *melee* verbs
>   are scarce. A thrown projectile reaches reliably → fast fights. Reaper isn't a
>   tank, so going semi-ranged is fine (unlike Knight).
> - **Active — HARVEST** *(originally pitched as CRESCENT THROW; renamed so the
>   name evokes Reaper's identity — death harvesting souls — rather than the
>   blade's lunar profile)*: one scythe in flight at a time. The scythe homes
>   *mildly* at the enemy (a thrown blade, so a juke/wall-bounce can make the
>   initial pass miss — that's the counterplay). It **OVERSHOOTS through hits**
>   — landing damage doesn't end the throw; the scythe only turns back when it
>   reaches `crescentMaxTravel` OR hits a wall. Then it beelines back to Reaper
>   to be "caught"; a short recovery cd, then re-throw. Both legs can connect
>   (a 0.2s hit-cd gates double-tap on a single overshoot). Cleaves skeletons
>   via the projectile path.
> - **DOPPELGANGER interaction:** the scythe **overshoots through decoys** too —
>   one decoy absorbs one hit attempt (the decoy dies, hitCd guards the next
>   frame), and the scythe continues its arc. Consistent shape with the enemy
>   overshoot. Decoys no longer give Reaper a free early reset.
> - **Passive — WAKE** *(replaced HARVEST execute after playtest).* While in
>   flight, the scythe drops a small damaging hazard segment along its path
>   every `wakeRate` seconds; segments overlap into a visible **crimson trail**
>   that damages anything in range — enemy fighter AND enemy skeletons (added
>   later — the wake didn't initially hit skeletons, which was a real
>   Reaper-vs-Necromancer gap). A per-target hit-cooldown (`WAKE_HIT_GAP =
>   0.18s`) caps the chip rate so dense overlap can't double-dip. Per damage
>   tick, a soft `wakeTick` audio cue fires (same "sizzle, not crack"
>   exception as Cannoneer's `burn`).
> - **Why WAKE not HARVEST execute (the original sketch):** the execute was an
>   *invisible* damage multiplier — each hit just slightly bigger as the enemy
>   weakened, with no visible "now we're harvesting" beat. The boomerang's
>   defining trait is its **visible arcing path through space**, and WAKE
>   weaponizes exactly that. Distinct in the roster (Sapper places point-traps,
>   Cannoneer drops point splash, Witch shoots a bouncing point — no one else
>   has a *projectile-path-as-hazard*).
> - **Visual shipped (bespoke, not template anymore):**
>   - *Sprite:* hooded Grim-Reaper figure clutching a scythe diagonally across
>     the body — dark cloak silhouette + hollow hood-void + dark-wood shaft
>     + bone J-curve blade hooked FORWARD over the hood (cutting edge points
>     toward the enemy) + crimson back-edge accent. Replaced the old
>     "three-bladed glaive rotor" that fit the dead SWEEP melee-spin.
>   - *Projectile:* long dark shaft along the rotation axis + bone J-curve
>     blade hooked at the FORWARD end (sprite-matching). Tip extends past
>     the shaft front; the elongated shape makes the spin read as a scythe
>     whirling, not a small disc.
>   - *Wake:* clean crimson outlined ring + small inner dot per segment.
>     Overlapping segments along the trajectory compose into the trail by
>     themselves. (Previous attempts — solid blob, then paired curved
>     slashes with per-segment rotation — both played as either featureless
>     or visually noisy.)
> - **Numbers:** hp 750, dmg 142, cd 1.0, crescentSpeed 360, crescentHoming 40,
>   crescentMaxTravel 240, wakeRate 0.04, wakeRadius 14, wakeLife 0.8, wakeDmg
>   15 → **~51% overall, ~11.4s avg.** The overshoot mechanic + WAKE-hits-
>   skeletons combo had pushed Reaper to 68% at the pre-overshoot dmg of 180;
>   trimmed to 142 to absorb the buff (closer-to-2-hits-per-cast average makes
>   per-hit dmg come down).
> - *Lever notes:* **homing** is the hit/miss lever (not speed — a faster
>   crescent actually hits *more*); **HP** + **crescent dmg** are the win-rate
>   levers (wakeDmg barely moves it — a chip mechanic, not a primary lever);
>   **cd** is the throw-cadence/pace lever.
>
> *The orbiting-field write-up below is the original sketch, superseded by this.*

**No lifesteal — that was the Warlock overlap.** Orbiting field + heal-from-damage is
Warlock's drain-and-sustain fantasy with different leverage; *any* heal-from-damage
keeps the overlap. So Reaper drops sustain entirely and becomes the opposite role: a
glass **executioner**, not a sustain-bruiser.

**Active — REAP.** Drop the dash. The blades detach into an **orbiting ring around
Reaper's body** for a window — anything inside the ring takes repeated ticks. The
*field* is the new verb (no one else has a body-attached AOE).

**Passive — HARVEST (execute).** Reaper's damage **scales up as the enemy's HP-fraction
drops** — almost nothing against a healthy foe, brutal against a dying one. No heal, no
slow, no tether: a pure damage curve. Warlock sustains and controls at range; Reaper is
a fragile finisher that does little until the enemy is already hurt, then deletes them.
Different role, not different numbers.

*Scale off HP **percentage**, not raw HP* (`dmg ×= 1 + k·(1 − hp/maxHp)`). A raw
threshold would trigger at different health fractions across the roster's ~2× maxHP
spread (570–1110) and would break the 10× rescale property (GOTCHAS.md) — a percentage
curve is consistent across all targets and scale-invariant.

**Why it's distinct.** A body-attached damage field is unique on its own, and the
execute curve makes Reaper a true *closer* — the only fighter whose threat ramps with
the enemy's missing health. Big, dramatic finishes (good for Shorts).

**Matchup texture.** Whoever happens to share space with Reaper while low gets erased;
fragile fighters (Warlock at 570 HP, Wizard, Archer) are in execute range fast. Weak
where it can't bring the enemy low — high-HP/armor walls (Knight) outlast the early,
feeble part of the curve. The field's uptime is itself RNG (whether the enemy drifts
into the ring is chance) — acceptable here because the field is a *sustained window*
of many frames, unlike a single-instant pulse; the variance reads as drama.

**Reads as.** Blades spin off the body into an orbiting crescent ring (reusing
Reaper's crescent force-shape, swept continuously); ticks on a low-HP enemy land
heavier and brighter (the execute made legible).

**Sounds as.** Dry bone rattle as the blades spin up; per-tick = a *soft* crescent
hiss, **not** a sharp crack (per AUDIO.md's no-machine-gun rule for continuous
damage — the same treatment as the incendiary burn), rising in weight as the execute
bonus climbs; a bone settle when the ring collapses back.

---

## ARCHER → `VOLLEY` + `SHATTER` *(shipped — fan + cushion-burst)*
*Material: wood + taut string, snap + thin whistle (unchanged).*

> **IMPLEMENTED & VALIDATED (2026-05-23).** Active VOLLEY as in the original
> sketch (3-arrow fan per cast, no windup, fires while moving). PINCUSHION was
> shipped first as a per-stack ramp but it played as a slow stat creep with no
> moment — replaced with **SHATTER** to make the passive a *spectacle*, not a
> ramp.
> - **Passive — SHATTER.** Every arrow that lands still EMBEDS in the enemy (the
>   literal pincushion visual is the whole point), and each arrow still does its
>   small chip damage in flight. There is no per-stack ramp — arrows are
>   accumulating *tension*, not bonus damage. The instant a 5th arrow lands the
>   cushion **bursts**: the trigger arrow's chip is folded into a single
>   `stacks × shatterPerStack` damage number (5 × 18 = **90** in one float), the
>   embedded arrows fly outward as residue, a green ring expands from the body,
>   and the cushion resets to 0. Cycle repeats.
> - **Why SHATTER over a ramp.** The ramp had no event — every arrow felt
>   identical, the +7% per stack was math the eye couldn't see, and the payoff
>   was diffuse. SHATTER converts the same accumulation into a clear *moment*:
>   you watch the porcupine grow (4 arrows stuck, halo glowing, near-trigger),
>   the next hit BURSTS, big number, big visual. The literal storytelling
>   matches the mechanic.
> - **Visual storytelling.** Each landed arrow keeps its shaft + white head +
>   green V-fletching anchored at the body edge in world space. New stacks pop
>   a landing burst (per-arrow `born` ring) and shudder the whole cluster
>   (`embedFlash`). At 3+ stacks a green saturation halo pulses around the
>   body — the "about to shatter" tell. On burst: an expanding double-ring
>   (`shatterFlash`) over 0.3s and the embedded arrows scatter outward over
>   0.4s as the cushion clears. All animations are pre-rolled in the sim —
>   draw is RNG-free per principle 7.
> - **Stacks decay individually (slow).** A quiet archer doesn't carry a
>   phantom cushion forever — each stack expires after `embedDur` (2.0s) so
>   long droughts melt the cushion before it can chain. Connect-pressure-driven
>   shatter rate.
> - **Numbers:** hp 730, speed 125, dmg 30 base per arrow, cd 0.7, volleyArrows 3,
>   volleySpread 0.18, shatterAt 5, shatterPerStack 18, embedDur 2.0
>   → **~52.2% overall, ~14.2s avg, ~9% fog.**
> - **Matchup texture.** Wins on the burst breaking through tank mitigation:
>   Wizard 99, Hunter 88, Duelist 76, Knight 72 (one SHATTER cuts past PLATE
>   ARMOR's flat -20 in a way that 5 small chip arrows can't — 90 dmg burst
>   becomes 70, still huge), Necromancer 59, Reaper 57. Hard-countered as
>   designed: Priest 0, Berserker 26 (rampage shreds ranged in the tight
>   arena), Jester 21 (the dodge eats the trigger arrow → no shatter that
>   cycle).
> - **Tuning history.** First SHATTER prototype (`shatterPerStack 22`) ran
>   at 56.3% — slightly hot. Dropping to 18 (90 burst at cap) landed in the
>   band on iteration two. Earlier PINCUSHION ramp attempts are documented in
>   git history; SHATTER replaces them outright.
>
> *The original sketch below is preserved for reference — superseded by this.*

**Constraint that shapes this.** Movement is autonomous RNG — Archer can't keep
distance, kite, or "play the far corner." Anything keyed to spacing is dead on
arrival. So the redesign is built on Archer's one trait that needs *no* positioning:
it fires **while moving, with no windup** (everyone else stops or commits). That makes
it the *volume-of-fire* fighter — it just keeps shooting as it bounces.

**Note — no pierce.** Piercing minions isn't a distinguishing trait either: the sim's
projectile→skeleton code (engine.js:1466) only removes the *skeleton*, never the
projectile, so every projectile already passes through minions.

**Active — VOLLEY.** Each cast looses a rapid **spread of arrows** in a fan rather
than one shot. Since Archer can't aim by positioning, it compensates with *coverage* —
a wider fan threads more of the random geometry, so connect-chance comes from volume
and angles, not from a clean line. High rate of fire, no windup, all while drifting.

**Passive — PINCUSHION.** Every arrow that lands **stacks** on the target — each
sticks, and each one already in raises the damage of the next. Reward for sheer volume
of fire, requiring no positioning at all. **Stacks decay** — each one expires on its
own short timer, refreshed by landing more arrows — so it's a *tempo* mechanic, not a
clock: sustained fire keeps the pincushion fat, but any break in the hit-stream lets it
fall off. Per-stack duration self-caps it (fire-rate × duration), so no runaway. (It
must NOT be permanent/unbounded — that would make Archer a time-based auto-win that
ignores the matchup.) Distinct from Witch's mark, which is a single binary +damage
toggle; PINCUSHION is a decaying stack fed by hit count.

**Why it's distinct.** The only fighter that attacks *continuously without
interrupting its motion*, and the only on-target *stacking* ramp (vs Witch's on/off
mark). Identity: a drifting hail of arrows that compounds the longer it connects —
nothing about it assumes control of position.

**Matchup texture.** Thrives by attrition — many cheap arrows, many attempts, an
accelerating stack. Hard-countered by anything that blunts small hits: **Knight's flat
PLATE ARMOR savages low-damage arrows** (a flat cut is brutal against many small
shots), and per-hit mitigation (Jester's dodge, Wizard's shield orbs) eats individual
arrows before the stack builds. Strong against fragile bodies with no mitigation
(Warlock, Wizard once orbs are spent).

**Reads as.** A rapid fan of arrows from a moving body; PINCUSHION shown literally —
arrows visibly accumulating stuck in the target, the cluster growing as the stack
climbs.

**Sounds as.** Rapid string snaps + thin whistles (the existing material); a small
rising tick as each stack lands, climbing in pitch as the pincushion grows.

---

## RONIN → `IAI` *(shipped — overshoot line-cut + FOCUS-skips-windup chain)*
*Material: fine drawn steel, whisper-crack, single clean note (unchanged).*

> **IMPLEMENTED & VALIDATED.** Built the proposal's "overshoot line-cut +
> FOCUS chain" with several iterations of refinement during playtest:
> - **Opener:** Ronin plants for a 0.5s windup with the dash direction **locked
>   at cast** (enemy's random bounce during the windup is the counterplay —
>   Priest-JUDGMENT-style dodge). At windup end, teleport-overshoot a fixed
>   `strikeDist` along the locked direction; cleave skeletons + mines + enemy
>   on the line. Decoys on the line are cleaved too, but FOCUS only chains on
>   a REAL hit (slicing a phantom doesn't grant the refund). Clamped to the
>   arena so the overshoot can't slide off-screen.
> - **FOCUS** **skips the windup AND refunds the cooldown** — landing a cut
>   puts Ronin in flow, where the next iai fires *instantly* (re-aimed at the
>   enemy's then-current position). The chain breaks on a whiff: focus
>   clears, next iai is a full windup again. The counterplay during a chain
>   is the cd-between-strikes (~1s of enemy bouncing); during an opener it's
>   the 0.5s windup itself.
> - **FOCUS plant (added later).** While focused — between landing one iai
>   and casting the next chained one — Ronin now stops moving entirely
>   (vx = vy = 0). The gold FOCUS ring + still body reads as the samurai's
>   iai stance, not "wandering away from the enemy waiting for the cd." This
>   was mechanically a stealth BUFF (lifted Ronin from 56% to 64.6% because
>   the next iai's launch geometry became predictable from a fixed stance
>   instead of drifty), absorbed by trimming dmg 130 → 118.
> - **Hidden slow-recovery dropped.** Originally the proposal called for a
>   vulnerable re-sheathe with reduced movement speed. Under the no-new-
>   animation directive that slow had no visible indicator → a hidden
>   mechanic. The cooldown IS the visible recovery (chain = ~1s gap; whiff =
>   full 2.5s wait).
> - **Unified gold ring.** The pre-existing FOCUS aura and the windup charge
>   ring were two similar gold rings. Merged into ONE: fill level conveys
>   state. *Empty* = idle. *Filling 0→1* = opener winding up. *Held full*
>   (no flash) = FOCUS, next strike pre-charged. *Hidden during the strike
>   window* — the slash trail does that beat. `drawChargeRing` gained a
>   `held` flag to suppress the release flash for the held-full case.
> - **Hit sound added.** Originally Ronin/Jester were going to "fold the
>   crack into the strike sound" (one sound only). Playtest showed kill
>   hits felt silent under the K.O. cinematic; added a `mat='iai'` case to
>   the melee-hit dispatcher (steel whisper-crack + clean ring) so the
>   iai cleave has a per-hit audio crack. AUDIO.md updated accordingly.
> - **Numbers:** hp 920, dmg 118, cd 2.5, windupTime 0.5, strikeDist 175
>   (trimmed from 200 after arena shrunk to 300 — 200 covered 67% of the
>   smaller arena), slashReach 26, focusRefund 0.4 → **~55% overall**.
> - *Matchup notes:* Duelist used to be a 1% hard counter because COUNTER
>   auto-thrust on every melee hit, but COUNTER was simplified to a pure
>   defensive passive (no return tax) — the Duelist matchup is now
>   ~20-25%, still bad but not annihilating.
>
> *The original sketch below is preserved for reference — superseded by this.*

The current iai is already better than the other dashers — it cleaves a *line*
(engine.js:1047 cuts skeletons + mines along the dash path) and FOCUS halves the
cooldown on a clean hit. The redesign makes the line-cut the *defining* mechanic
instead of an incidental one.

**Active — IAI.** After the windup, Ronin teleport-dashes in a straight line and
passes **clean through** the enemy and out the other side (every other dasher stops
*at* the target — Ronin overshoots), cutting everything on the path for one heavy
hit. The catch: after the cut Ronin must **re-sheathe** — a brief recovery where it's
slow and exposed.

**Passive — FOCUS (kept, now the core loop).** A clean cut **skips the re-sheathe
recovery and refunds cooldown** — so a Ronin landing perfect cuts chains them in a
lethal rhythm; a whiff leaves it standing in the open, vulnerable, mid-sheathe.

**Why it's distinct.** It's the only *overshoot* strike (commits past the target, can
catch a whole line — skeletons + the necro behind them in one pass) and the only one
with a real *recovery downside.* It stays purely offensive, so it doesn't collide
with the new defensive cluster (Knight absorbs, Reaper fields, Duelist counters) —
Ronin is all-in aggression with a punish window. Honors "iai = one perfect cut."

**Matchup texture.** Devastating against anything it can line up and one-shot, and a
hard counter to Necromancer (one pass clears a line of skeletons *and* tags the body).
Punished by anything that can act during the re-sheathe — Hunter's stun mid-recovery,
a Reaper field it lands in, a Berserker pass — and by evasion that beats the windup
(Jester's blink, a wall-bounce dodge).

**Reads as.** The existing ronin charge-ring + coil tremor windup; the strike is a
single clean gold slash-line straight through the enemy to a point beyond (its CUT
death's slash, in motion); the re-sheathe is a visible slow, blade-lowering beat.

**Sounds as.** Rising tension hum on the windup; a single clean whisper-crack on the
cut (no scatter, per its material); a soft steel *click* on the re-sheathe — and on a
FOCUS chain, that click snaps straight into the next hum.

---

## CANNONEER → `BOMBARD` + `EPICENTER` *(shipped — dumb heavy lob, not predictive)*
*Material: iron + gunpowder, percussive concussion, hard boom (unchanged).*

> **IMPLEMENTED & VALIDATED (2026-05-23).** Built BOMBARD as a heavy splash shell as
> the proposal sketched, with three meaningful course-corrections during playtest:
> - **No predictive aim.** The original sketch had Cannoneer share Priest's "delayed
>   strike at a predicted spot" grammar with opposite philosophy (forgiving splash vs
>   surgical pillar). That made the two too structurally similar. Pivoted: **Cannoneer
>   fires the shell STRAIGHT at the enemy's current position — no lead, no smart
>   math.** The enemy's own movement during the ~1s flight is the dodge. This is a
>   sharper contrast with Priest (smart aim vs dumb lob) and on-brand for "heavy
>   artillery" (he doesn't predict, he just lobs heavy).
> - **EPICENTER passive (replaced INCENDIARY ROUND).** The original passive was a
>   lingering fire pool on impact — area denial. Playtest revealed the fire pool was
>   tacked-on and the falloff curve on the splash explosion was the much more
>   distinctive trait, so the passive shifted to **"damage peaks at the blast center,
>   scaling to nothing at the splash edge."** The fire pool was retired entirely (no
>   hazard zone lingers; the explosion is a single transient burst). Pairs perfectly
>   with the dumb lob: stationary/predictable targets eat full damage, fast/erratic
>   ones bounce off the line during flight and get chip damage.
> - **Direct hit = full damage convention.** A shell that physically contacts the
>   enemy mid-flight deals the full `f.dmg` (the card stat). Only LANDINGS (life-expire
>   at the aim point, no contact) use the falloff curve. This means the card "DMG"
>   matches what you see on direct contacts and rewards predictable targets cleanly.
> - **Why no knockback (unchanged from the sketch):** that's Sapper's BLAST RADIUS.
>   Cannoneer denies via explosion damage gradient; Sapper displaces.
> - **Bespoke explosion visual (added later).** The old explosion shape was
>   indistinguishable from Sapper's mine — both used radial spokes + outer
>   ring. Replaced with concussion-wave grammar: a faint dashed edge ring at
>   `splashRadius` (visualizes the EPICENTER falloff boundary — viewer can see
>   the lethal zone), a bright shockwave ring expanding outward from center to
>   edge, an inner secondary shock, a white-yellow core flash at the
>   epicenter (ease-out fade), and four directional dark smoke puffs at 45°
>   offsets (gunpowder venting, NOT radial spokes). Sapper's mine visual is
>   unchanged. `spawnImpact` extended with an optional `radius` arg so the
>   shell carries `splashRadius` through to the impact's edge-ring render.
> - **Numbers:** hp 1030, dmg 400, cd 3.0, windupTime 1.0, splashRadius 55
>   → **~55% overall**. Top-of-band; if it needs trimming, dmg or splashRadius
>   are the levers.
> - *Matchup notes:* Knight 95% (slow → easy direct hit), Sapper 96%, Warlock 87%
>   (low DPS, planted Cannoneer can land hits). Hard-countered by Priest 1% (the
>   predictive pillar deletes the planted Cannoneer during the long windup),
>   Berserker/Ronin/Jester (all dodge or shred). Wizard 29% (orbs + shield).
>
> *The original sketch below is preserved for reference — superseded by this.*

The current cannon (1s windup, fast straight non-homing shot + incendiary zone) is
*fine* — it already demands prediction. But it's a thinner version of the same
"single precise projectile" space the new Priest now occupies far better. So push
Cannoneer the opposite way: from **precision to area.**

**Active — BOMBARD.** Keep the heavy windup, but instead of a flat straight shot,
Cannoneer **lobs an arcing shell** that lands in an **area**: a splash explosion + the
incendiary **fire pool** left on the ground. It doesn't need to hit precisely — the
splash and the lingering zone forgive the aim (which matters under RNG movement: a
straight non-homing shot at a randomly-moving target whiffs a lot; splash doesn't).
**No knockback** — that's Sapper's BLAST RADIUS, and giving both displacement would
blur them. Cannoneer denies *area*; Sapper *displaces*.

**Passive — INCENDIARY (kept, now load-bearing).** The fire pool on impact becomes
real area denial rather than a footnote — BOMBARD is about controlling *space*, not
landing a clean hit.

**Why it's distinct — and a deliberate contrast with Priest.** Priest's JUDGMENT and
Cannoneer's BOMBARD are intentionally the same *family* (a delayed strike at a
predicted spot) with **opposite philosophies**: Priest is surgical — a precise single
pillar that *heals on a clean hit* (reward for accuracy); Cannoneer is dumb and
heavy — a splash blast that *denies area* (forgives accuracy). That contrast is
content, not collision.

**Honest caveat — this is the lightest redesign.** Without knockback, BOMBARD is
"current cannon, but splash-area instead of a precise line, with the fire pool
promoted to the point." That's a real mechanical shift (forgives aim, controls space)
and the Priest contrast gives it identity, but it changes the fighter less than the
others. If that's too thin, the bigger swing is to make Cannoneer a *multi-shell
bombardment* (a short barrage of arcing blasts during one rooted windup) — siege-mode
saturation — but that's a heftier build.

**Matchup texture.** Strong at punishing clustering — a hard answer to Necromancer
(splash + fire hits the skeleton screen *and* the area the necro sits in). Slow
(speed 85) and windup-committed, so the splash landing on a fast erratic body is still
chance; its reliability is the lingering fire pool, not the direct hit.

**Sounds as.** Rising tightening charge tone; a hard concussive *boom* on impact (its
material); a low rumble tail under the crackle of the fire pool igniting.

---

## SAPPER → `STICK CHARGE` *(shipped — fused limpet bomb)*
*Material: dark metal casing, sharp metallic crack + pressure (unchanged).*

> **IMPLEMENTED & VALIDATED (2026-05-23).** Built the proposal's STICK CHARGE as
> sketched — the reliability shift from "drop a mine at Sapper's random position and
> hope the enemy wanders by" to "throw a charge that connects, sticks, fuses, and
> detonates with a guaranteed payoff" played out exactly as predicted.
> - **Active — STICK CHARGE:** Sapper throws a charge as a normal projectile (speed
>   300, no homing). On contact with the enemy it **sticks to their body** and the
>   fuse starts ticking (1.5s). On detonation: damage + **BLAST RADIUS knockback**.
>   On miss (edge, life-expire) the charge despawns. Variance lives in the **throw**
>   (a fair projectile connect) rather than in random enemy wandering.
> - **Skeletons still die to the in-flight charge** (the projectile-skeleton loop
>   handles it), so Sapper still has answers against Necromancer's screen — and the
>   charge then sticks to the necro behind them.
> - **Duelist parry** works as expected: the charge gets reflected back at Sapper
>   and, if it now sticks to him, he eats his own bomb. Good content; rare enough not
>   to dominate the matchup.
> - **Numbers:** hp 720, dmg 200, cd 1.4, throwSpeed 300, fuseTime 1.5 → **~52%
>   overall, ~13.7s avg, ~9% fog.** Crushes Knight 100% (slow, easy stick) and
>   Necromancer 90% (charge clears the screen). Hard-countered by Priest 0%, Wizard 9%,
>   Jester 17%, Berserker 24%.
> - **Visuals are template** — dark casing with a pulsing red fuse (pulses faster
>   when stuck). Bespoke art deferred to the polish pass.
> - **Cleanup along the way:** the old `game.mines` array stays as infrastructure
>   (no fighter spawns mines anymore; the loop is a no-op). The kill-cam-silent bug
>   where lethal projectile detonations skipped the impact visual + sound was found
>   and fixed PROJECT-WIDE in the same pass (hook, hex, orb, coin, arrow, crescent,
>   charge) — impact/sfx now always fire on a hit; only the victim's recoil-shake
>   is gated on a live target.
>
> *The original sketch below is preserved for reference — superseded by this.*

**The problem with the current mine.** It drops at Sapper's *own (random) position*
(`game.mines.push({x:f.x, y:f.y})`) and waits for the enemy to wander onto it. Under
autonomous RNG movement nothing draws the enemy there, and the fog ring does **not**
shrink the arena or herd anyone (it's only a damage threshold) — so the trigger odds
are near-zero. It's the least reliable design in the roster.

**Active — STICK CHARGE.** Sapper *throws* a fused charge that **sticks to the enemy on
contact**; after a short fuse (~1.5s) it detonates for a burst + knockback. This
relocates the luck to a *fair* place: the variance is now "did the thrown charge
connect" (a normal dodgeable projectile, decent odds) instead of "did the enemy
randomly stroll onto a spot Sapper happened to stand on" (almost never). Once it
sticks, the payoff is **guaranteed** — which is what makes a deploy-an-explosive
fighter actually work under RNG motion.

**Passive — BLAST RADIUS (kept).** The detonation knocks the enemy back. Minor true
synergy: knockback displaces them *outward*, and late-game the safe radius is small,
so a knock outward can shove them past the fog threshold into fog damage. (The arena
itself doesn't shrink — only the damage threshold does — so this is displacement
across a line, not herding.)

**Why it's distinct.** The only **guaranteed-delivery delayed burst attached to the
body** — a tick-tick-BOOM on the enemy themselves. Distinct from Witch's mark (a
damage *amp*, not damage), Warlock's drain (a channel), and Cannoneer's BOMBARD
(a *location* AOE — Sapper's charge rides the target, so position is moot). Adjacent to
Hunter's hook (also a thrown attach), but the payoff is opposite: Hunter reels +
stuns *now*; Sapper plants a *delayed* detonation. Multiple charges stacked = an
escalating countdown.

**Matchup texture.** Reliable chip-to-burst against anyone a thrown charge can tag, and
the fuse is the counterplay window — kill Sapper (570-ish HP class) before it pays off,
or out-burst it. The fuse delay makes it weakest against fast lethal fighters who end
the exchange before detonation (Ronin's cut, Cannoneer's shell) and strong in drawn-out
fights where charges accumulate.

**Reads as.** Sapper lobs a keg/limpet that clamps onto the enemy with a blinking fuse
light counting down; detonation is the existing casing-breach **mine** burst + the
enemy flung back along the blast normal.

**Sounds as.** A metallic *clink* as the charge clamps on; a rising fuse tick (the
windup texture, on the enemy's position so it pans to them); then the sharp metallic
casing-crack + pressure boom (its existing `mine` impact) on detonation.

**Alternatives if you'd rather keep the ground-trap flavor:**
- *Creeping mine* — the dropped mine arms, then slowly crawls toward the enemy and
  explodes on contact. Keeps "deploy a device," gains reliability. Risk: adjacent to
  Necromancer's slow-pathing unit (differentiate as a one-shot rolling keg, not a
  combatant).
- *Embrace the variance* — leave static mines and accept Sapper as the chaos/luck
  fighter; swingy outcomes are arguably fine for Shorts. (The do-nothing option.)

---

## JESTER → `BLINK DAGGER` + `DOPPELGANGER` *(shipped — universal aim-nearest decoy mechanic)*
*Material: ceramic mask, hollow pop, brittle (unchanged).*

> **IMPLEMENTED & VALIDATED (2026-05-23).** Jester was in the original "keep"
> list — BLINK DAGGER + UNCANNY DODGE were considered distinct enough. But the
> roster shift (Knight excluded, Reaper now semi-ranged) quietly buffed her:
> UNCANNY DODGE (one full-phase per ~6s) was eating more critical hits each
> matchup as the new roster grew "big single hit" attacks (SHATTER trigger,
> STICK CHARGE detonation, BOMBARD shell, JUDGMENT pillar, CRESCENT throw).
> She climbed to **57.9% overall**, with very few real losses outside
> Duelist's COUNTER cascade.
>
> Replaced UNCANNY DODGE with **DOPPELGANGER** — bigger design lift, deeper
> matchup texture.
> - **Active — BLINK DAGGER (unchanged):** teleport behind enemy heading + stab.
> - **Passive — DOPPELGANGER:** every hit Jester takes spawns a phantom decoy
>   at her current position. Decoys are stationary, no physics; each absorbs
>   exactly one incoming attack of any kind (projectile, melee dash strike,
>   judgment pillar AOE, drain channel) then dies. Cap of `decoyCap` (2)
>   simultaneously — oldest fades to make room (continuous rotation under
>   pressure). Decoy lifetime `decoyLife` (3s).
> - **The core mechanical change — uniform "aim at nearest target."** Every
>   fighter's aim path (cast-time picks, continuous homing, skeleton seek,
>   drain lock-on) now routes through one helper `pickTarget(attacker, defender)`
>   that returns the nearest of {real defender, ...decoys}. For 14 of 15
>   fighters this collapses to the pre-DOPPELGANGER behaviour (Jester is the
>   only one with decoys). For attacks vs Jester, this is the entire matchup
>   shift: the geometry of WHEN each ability picks its target determines
>   whether it gets fooled by a decoy or hits the real body.
>   - *Cast-time pickers* (Priest JUDGMENT predict, Cannoneer BOMBARD, dashers'
>     anchors, Warlock drain lock, Ronin iai line, Reaper crescent throw) — pick
>     once, commit. If a decoy was nearest at cast, the whole ability resolves
>     against the decoy.
>   - *Per-frame homing* (Wizard orbs, coin homing, hex steering) — re-pick
>     every frame, so the projectile switches targets if a fresh decoy spawns
>     mid-flight closer than the old aim.
>   - *Skeleton seek* — per-frame pick. Skeleton waves get pulled toward
>     whichever target's closer; decoys can drag whole skeleton waves off the
>     real Jester.
> - **Damage routing.** Projectile and dash-hit collision loops check
>   `tryHitDecoy(pos, defender, range)` first. A decoy in range and closer
>   than the real defender absorbs the hit (decoy.dead = true, projectile
>   despawns, dash records the hit-frame). Real Jester is never touched in
>   that frame; she takes the hit ONLY if no decoy intercepted.
> - **JUDGMENT AOE quirk.** Priest's pillar is the one ability that doesn't
>   pick a single target — it lands at the cast-locked spot and damages
>   everything in range. So a JUDGMENT can hit BOTH a decoy AND real Jester
>   if both happen to overlap the footprint. Decoys in the pillar are
>   consumed, and the heal-on-hit only fires if real Jester took damage
>   (not on a decoy-only kill — the phantom shattered, not the body).
> - **DRAIN edge case.** Drain locks at cast (the channel is a maintained
>   target). If it locks onto a decoy, the first tick consumes the phantom
>   and the channel breaks with no further damage. Warlock burnt the cast
>   on a ghost. Intended counter-texture.
> - **Numbers:** hp 750, speed 120, dmg 130, cd 2.5, decoyCap 2, decoyLife 3.0
>   → **~50.9% overall, ~15.0s avg, ~4% fog.**
> - **Matchup texture (predictions vs reality).** Strong Jester (decoys absorb
>   the killing move):
>   - Priest 96 (predictive aim locks onto stationary decoy = guaranteed hit
>     on phantom, real Jester safe)
>   - Berserker 91 (decoys eat rampage passes; rampage ricochets off the
>     phantom and pinballs away)
>   - Witch 87 (hex projectiles eaten by decoys before they bounce in)
>   - Archer 84 (the 5-arrow VOLLEY usually loses 1-2 to a decoy, breaking
>     the SHATTER cycle)
>   - Necromancer 76 (skeleton seek pulled off-target by decoys; whole waves
>     waste themselves on phantoms)
>   - Reaper 62 (crescent absorbed by decoy ends Reaper's throw cycle early)
>
>   Hard losses where decoys can't save her:
>   - Duelist 0 (Jester's blink-stab still procs Duelist's COUNTER on the
>     real-hit, and Duelist's RIPOSTE projectiles aren't reflected by Jester
>     decoys cleanly. Pending Duelist COUNTER redesign should soften this.)
>   - Warlock 10 (drain locks at cast; if no decoys yet, locks on real Jester
>     and runs the full channel)
>   - Cannoneer 34 (EPICENTER splash partial-hits real Jester even when the
>     direct hit lands on the decoy)
>   - Ronin 35 (iai line cuts CLEAVE — decoys on the line die but real Jester
>     on the line also gets hit; phantoms don't help)
>
> - **Visual.** Decoys render in WORLD space as ghosted-Jester sprites at
>   42% alpha plus a faint outer halo ring, drawn BEFORE the real fighter so
>   the real Jester paints on top of any overlap (resolves the moment-of-spawn
>   coincidence). Decoys face the nearest enemy each frame so they read as
>   "looking at the threat" — alive-seeming phantoms, not props.
> - **UNCANNY DODGE removed cleanly.** All `dodgeReady/Timer/Invuln/Cd` fields,
>   the armed-ring render, the invuln-window render, the dodge-recharge tick,
>   and the dodge-intercept in damage() are gone. armedRing() helper deleted
>   (was Jester-only).
> - **Follow-up — Duelist COUNTER redesigned (done).** Duelist's COUNTER moved
>   from "free thrust on every melee hit taken" to "the thrust window parries
>   melee hits and reflects projectiles" — purely defensive, no auto-counter
>   damage. Jester-Duelist matchup barely moved (0 -> 1%) because Duelist's
>   own RIPOSTE offense + 950 HP still outpace Jester's 130-dmg blink-stab
>   cycle; the cascade wasn't the only thing winning that fight. The bigger
>   benefit was structural — Duelist's "every melee hit pays a tax" inflation
>   is gone.

---

# Keep — already distinct, no change

These eight each own a unique verb. Brief rationale so the judgment is on record:

- **Wizard** — orbs are *simultaneously* offense and shield: each orb out attacking is
  one not mitigating. (It's automatic double-duty, not a player decision — but the
  mechanic of one resource serving both roles is the strongest in the game.)
- ~~**Jester** — teleport-behind repositioning + a phase-dodge defensive cooldown.~~
  *(moved out of the keep list — UNCANNY DODGE was eating too much value from the
  redesigned roster's big single-hit moves; replaced with DOPPELGANGER, see the
  dedicated section above.)*
- **Duelist** — `RIPOSTE THRUST` (active) + `COUNTER` (passive). *(Redesigned
  2026-05-23: COUNTER moved from "free auto-thrust on every melee hit taken" to a
  purely defensive passive describing what the thrust window does — melee hits
  during the window are parried (absorbed, no damage), projectiles reflected.
  No separate counter-thrust proc; the thrust itself is the response. Cleaner
  narrative — RIPOSTE = offense, COUNTER = defense, one move does both. Removed
  the "every melee touch pays a 80-dmg tax" cascade that was inflating Duelist
  to 58.7%; new equilibrium ~55%.)*
- **Necromancer** — the only summoner; board presence + explode-on-death adds a
  second layer.
- **Witch** — wall-bouncing bolt (unpredictable angles) + a setup→payoff damage mark.
- **Hunter** — the only fighter that moves the *opponent* (reel-in) + a stun.
- **Warlock** — the only channel; tether-slow + leech glass cannon.
- **Gambler** — six genuinely distinct attack patterns off one roll, with loaded-dice
  mitigation of bad luck. Novel by construction.

---

# New grammars this introduces

The redesigns add several mechanical sub-grammars beyond the current
melee / ranged / set-down / channel set (ANIMATION.md). Worth naming so they're
reusable, not one-offs:

- **Ricochet-state** (Berserker) — the fighter *becomes* a temporary bouncing
  hazard. Reusable by any future "weaponize the arena" fighter.
- **Absorb-stance → guaranteed return** (Knight) — plant, bank incoming, hurl it back
  as a homing return. A defensive-tempo grammar distinct from Duelist's instant reflect;
  guaranteed delivery is what makes it work under RNG motion.
- **Orbiting field / aura** (Reaper) — body-attached, proximity-based, continuous-tick
  damage. The continuous-damage *audio* rule already exists for it.
- **Execute curve** (Reaper) — damage scales with the enemy's missing HP; the only
  "ramps with the kill" mechanic. Reusable by any future finisher.
- **Predictive zone-strike** (Priest precise / Cannoneer area) — a delayed strike at a
  predicted spot. One grammar, two philosophies: surgical-point (heals on hit) vs
  area-splash (denies space). Wall bounces are the built-in counterplay to both.
- **Overshoot line-dash + recovery** (Ronin) — commits *through* the target, cleaves a
  line, then pays a vulnerable re-sheathe unless FOCUS chains it.
- **On-target stacking ramp** (Archer) — hit count builds a *decaying* effect on the
  enemy (self-capped by per-stack duration); rewards sustained volume, needs no positioning.
- **Sticky delayed burst** (Sapper) — a thrown charge attaches to the body, then
  detonates after a fuse. Guaranteed payoff once it connects; the throw is the variance,
  the boom is not.

# Open questions / next steps

1. **Eight redesigns and ~seven new grammars is a lot to land in one pass.** Recommend
   staging the rollout. Suggested order:
   - *Wave 1 — the melee cluster* (Berserker, Knight, Reaper, Ronin). They're the
     core problem (one shared verb) and they interlock — judge the new
     ricochet/absorb/field/overshoot quartet together so collisions surface early.
   - *Wave 2 — the deploy/ranged group* (Priest, Cannoneer as its deliberate contrast,
     and Sapper — all "delayed/placed delivery," so they pressure-test each other).
   - *Wave 3 — Archer*, last (its own pattern — on-target stacking + volume fire).
2. **Pick one to prototype end-to-end first** (mechanic + animation + audio), before
   committing to a wave. Best single proof-of-concept: **Priest JUDGMENT** (biggest
   design upgrade, and validates the predictive-strike grammar that Cannoneer reuses)
   or **Berserker RAMPAGE** (flashiest, validates the arena-bounce idea).
3. **Two redesigns now share a grammar by design** — Priest (precise) and Cannoneer
   (area) are the same predictive-strike family. Confirm that reads as intentional
   contrast and not repetition before building both.
4. **Connection rate — arena/fighter size ratio.** Under autonomous RNG movement, the
   thing that governs how often *anything* lands is the ratio of (fighter size +
   ability ranges) to arena size, plus the speeds — that's the real "connection rate"
   for two random-bouncing bodies. Today a 32px-diameter fighter sits in a 360 arena
   (~9% of the width) with a lot of empty space. That's fine for the current
   mostly-homing/auto-aim roster, but several redesigns lean hard on raw geometry
   actually intersecting (Berserker's ricochet passes, Reaper's field uptime, Sapper's
   thrown stick, the predictive strikes) and will feel whiffy if connection stays this
   sparse.
   - **Decide it empirically, while prototyping** the most connection-hungry redesign
     (Berserker RAMPAGE or Reaper REAP): build it, watch ~20 fights, see if it connects
     enough. The redesigns themselves are what reveal whether the arena needs to be denser.
   - **Lean: shrink the arena slightly, not grow the fighters.** Readability is already
     solved by the follow-camera (so there's no readability gain to chase from bigger
     sprites); a smaller arena *also* raises wall-bounce frequency, which strengthens
     the core DVD identity and directly feeds Berserker + Witch; and `FIGHTER_SIZE` is
     baked into every melee reach (`FIGHTER_SIZE*2 + strikeReach`), so growing it
     silently inflates all five melee ranges. The arena's only real entanglement is the
     camera (its zoom formula uses `ARENA`) — a cheap, isolated render-only re-tune.
   - **Caveats:** shrinking the arena at fixed speeds is a *speed* change in disguise
     (same speeds cross a smaller box faster — more frantic), so co-tune speeds; and
     don't overshoot, or the camera framing flattens (fighters always touching kills the
     spread/close drama).
5. **Balance is explicitly deferred.** Every verb here changes behavior and will
   need its own `./balance.sh` pass; HP is the gentle lever (GOTCHAS.md), so most
   of these can be brought back into the 46–53% band without touching the mechanic.
6. **Audio + animation revamp — deferred to after the mechanic revamp.** Once all
   fighters' mechanics are locked, do a dedicated audio + animation pass over the new
   verbs. No detail yet.
