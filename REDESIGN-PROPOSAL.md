# BOXED — ability redesign proposal

**Status:** sketch / for discussion. Mechanics only — **numbers are deliberately
omitted**; balance is a separate tuning pass once verbs are locked.

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
| **Priest** | redesign | `JUDGMENT` — predictive light pillar; landing it heals |
| **Berserker** | redesign | `RAMPAGE` — becomes a wall-ricocheting charge |
| **Knight** | **UNRESOLVED** | hard design corner (melee tank under DVD) — maybe cut & replace; see status note |
| **Reaper** | shipped | `CRESCENT THROW` — returning boomerang (semi-ranged) + WAKE: the arc leaves a damaging trail |
| **Archer** | shipped | `VOLLEY` — fan of arrows per cast + SHATTER (cushion of embedded arrows bursts at 5 stacks for stacks×N damage) |
| **Ronin** | shipped | `IAI` — overshoot line-cut + FOCUS chain skips the windup for instant follow-ups |
| **Cannoneer** | shipped | `BOMBARD` — dumb heavy shell + EPICENTER falloff (max at center, scales to 0 at edge) |
| **Sapper** | shipped | `STICK CHARGE` — thrown fused limpet bomb; sticks on contact, detonates after a fuse, BLAST RADIUS knockback |
| Wizard | keep | orbs are offense **and** shield |
| Jester | keep | teleport-behind + phase-dodge |
| Duelist | keep | reflect projectiles + auto-counter |
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

## BERSERKER → `RAMPAGE`
*Material: raw flesh + blood, wet thuds, primal low-end (unchanged).*

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

## KNIGHT → `BULWARK` *(UNRESOLVED — prototyping shelved; see status)*
*Material: heavy plate steel, deep clang, resonant ring (unchanged).*

> **STATUS (2026-05-23): Knight is the hard corner of this whole effort.** Every
> direction we tried hit a wall, because a **melee tank under autonomous DVD movement**
> is a genuinely tight design box. What we explored and why each failed:
> - **BULWARK (reactive absorb → counter-return):** *impossible to balance.* Its output
>   depends on the enemy attacking during an un-timable stance window; with no agency to
>   time the guard, the result is RNG coincidence, not a tunable function. (This is the
>   general no-reactive-timing lesson — see the note in GOTCHAS / memory.)
> - **JUGGERNAUT (continuous homing pursuit + bash):** tuned and paced great, but **broke
>   the DVD-bounce identity** — Knight cutting straight at the enemy looked wrong.
> - **SHIELD THROW (boomerang projectile):** keeps DVD and tunes cleanly, but **turns the
>   frontline tank into a ranged fighter** — off-brand.
> - **SHIELD CHARGE (brief dash-charge + tank twist):** keeps DVD and is melee, but the
>   locomotion is "a dash," so it's only a modest twist on the generic dash we're trying
>   to move the cluster *away* from.
>
> **The trilemma:** a melee tank under DVD can only land reliable damage by (a) dashing
> to close — on-brand but "just a dash"; (b) reaching out — ranged, off-brand; or
> (c) random body-contact — pure DVD but unreliable/slow. There's no clean fourth path.
>
> **Decision pending:** either accept a modest **Shield Charge** as Knight's redesign, or
> **cut Knight from the roster and design a new 16th fighter with a genuinely distinct,
> DVD-friendly verb** to take his slot. Leaning toward the latter — it's better to add a
> fighter that *wants* to exist in this design space than to force one that doesn't.
> Prototyping is skipped for now; Knight stays on the original SHIELD BASH in code until
> this is decided.
>
> *The BULWARK write-up below is the original sketch, kept for reference — it is
> superseded by this status.*

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

## REAPER → `CRESCENT THROW` *(shipped — semi-ranged, not the orbiting field)*
*Material: hollow bone scythe, dry crack + crescent hiss (unchanged).*

> **IMPLEMENTED & VALIDATED (2026-05-23).** Reaper went **semi-ranged** with a
> returning crescent, **not** the orbiting field sketched below. Why the pivot:
> - A body-attached field on a *non-pursuing* Reaper hits the same **DVD
>   slow-connection trap** that sank Knight — under autonomous RNG, a proximity
>   effect only connects when the enemy randomly drifts close, which paces slowly.
>   This confirmed a structural truth: **melee delivery under DVD is a tight design
>   space** (reliable damage wants a projectile or a dash), so distinct *melee* verbs
>   are scarce. A thrown projectile reaches reliably → fast fights. Reaper isn't a
>   tank, so going semi-ranged is fine (unlike Knight).
> - **Active — CRESCENT THROW:** one crescent in flight at a time — it homes *mildly*
>   at the enemy (a thrown blade, so a juke/wall-bounce can make it miss — that's the
>   counterplay), **turns back on hit, wall, or max travel**, beelines home to Reaper,
>   and is "caught"; a short recovery cd, then re-throw. Hits on both legs (a 0.2s
>   hit-cd prevents an instant double at the turn). The crescent also clears skeletons
>   (pierces them via the projectile path).
> - **Passive — WAKE** *(replaced HARVEST execute after playtest — see below).* While
>   in flight, the crescent drops a small damaging hazard segment along its path every
>   `wakeRate` seconds; segments overlap into a visible **crimson arc trail** that
>   damages the enemy when they bounce through it. A per-target hit-cooldown
>   (`WAKE_HIT_GAP = 0.18s`) caps the chip rate so dense overlap can't double-dip.
> - **Why WAKE not HARVEST execute (the original sketch):** the execute was an
>   *invisible* damage multiplier — each hit just slightly bigger as the enemy
>   weakened, with no visible "now we're harvesting" beat. Under the no-new-animation
>   directive, flash has to come from the *mechanic*. The boomerang's defining trait
>   is its **visible arcing path through space**, and WAKE weaponizes exactly that —
>   the path becomes a damage trail the arena fills with as Reaper plays. Distinct in
>   the roster (Sapper places point-traps at his own spot, Cannoneer drops point fire
>   pools, Witch shoots a bouncing point — no one else has a *projectile-path-as-hazard*).
>   And it's "exclusively right" for the boomerang shape: a point-projectile fighter
>   couldn't have this mechanic.
> - **Glass-ish HP** kept (lowered from the original 1100). Rough balance vs the
>   current (mostly un-redesigned) roster: **HP 750, dmg 180, cd 1.0, wakeDmg 15,
>   wakeRadius 14, wakeLife 0.8s, wakeRate 0.04s, crescent speed 360 / homing 40 /
>   max-travel 240 → ~49% overall, ~13.0s avg, ~10% fog.** Authoritative tune is a
>   later `./balance.sh` pass.
> - *Lever notes from the sweep:* **homing** is the hit/miss lever (not speed — a
>   faster crescent actually hits *more*); **HP** + **crescent dmg** are the
>   win-rate levers (wakeDmg barely moves it — a chip mechanic, not a primary lever);
>   **cd** is the throw-cadence/pace lever. Crescent and wake currently use **template
>   visuals** (small spinning crescent + filled-circle hazard segments); the bespoke
>   render + audio are deferred to the polish pass.
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

> **IMPLEMENTED & VALIDATED (2026-05-23).** Built the proposal's "overshoot line-cut +
> FOCUS chain" with two key refinements during playtest:
> - **Opener:** Ronin plants for a 0.5s windup with the dash direction **locked at
>   cast** (enemy's random bounce during the windup is the counterplay — Priest-JUDGMENT-
>   style dodge). At windup end, teleport-overshoot a fixed `strikeDist` (200px) along
>   the locked direction; cleave skeletons + mines + enemy on the line. Clamped to the
>   arena so the overshoot can't slide off-screen.
> - **FOCUS** now **skips the windup *and* refunds the cooldown** — landing a cut puts
>   Ronin in flow, where the next iai fires *instantly* (re-aimed at the enemy's then-
>   current position). The chain breaks on a whiff: focus clears, next iai is a full
>   windup again. The counterplay during a chain is the cd-between-strikes (~1s of
>   enemy bouncing); during an opener it's the 0.5s windup itself.
> - **Hidden slow-recovery dropped.** Originally the proposal called for a vulnerable
>   re-sheathe with reduced movement speed. Under the no-new-animation directive that
>   slow had no visible indicator → a hidden mechanic. The cooldown IS the visible
>   recovery (chain = ~1s gap; whiff = full 2.5s wait), so the speed-slow was redundant
>   and got cut. FOCUS still "skips the recovery" — that recovery is just the cd now.
> - **Unified gold ring.** The pre-existing FOCUS aura and the windup charge ring were
>   two similar gold rings. Merged into ONE: fill level conveys state. *Empty* = idle.
>   *Filling 0→1* = opener winding up. *Held full* (no flash) = FOCUS, next strike pre-
>   charged. *Hidden during the strike window* — the slash trail does that beat. Cleaner
>   visual vocabulary aligned with the charge-telegraph grammar ("the focus state IS the
>   maintained charge"). `drawChargeRing` gained a `held` flag to suppress the release
>   flash for the held-full case.
> - **Numbers:** hp 920, dmg 130, cd 2.5, windupTime 0.5, strikeDist 200, slashReach 26,
>   focusRefund 0.4 → **~50% overall, ~11.6s avg, ~1% fog.** Reuses existing iai visuals
>   (gold ring + slash trail). No new audio.
> - *Matchup notes:* Duelist 1% is a real hard counter — Duelist's COUNTER procs on
>   every melee hit, and FOCUS chains stack the counter procs. Berserker (rampage) and
>   Sapper (mines on the line) also counter cleanly. Thematic; intended content.
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
> - **Numbers:** hp 1030, dmg 400, cd 3.0, windupTime 1.0, splashRadius 55 → **~50%
>   overall, ~13.2s avg, ~6% fog.** Authoritative tune is a later `./balance.sh` pass.
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

# Keep — already distinct, no change

These eight each own a unique verb. Brief rationale so the judgment is on record:

- **Wizard** — orbs are *simultaneously* offense and shield: each orb out attacking is
  one not mitigating. (It's automatic double-duty, not a player decision — but the
  mechanic of one resource serving both roles is the strongest in the game.)
- **Jester** — teleport-behind repositioning + a phase-dodge defensive cooldown. The
  only blink.
- **Duelist** — reflect projectiles + auto-counter on melee. The reactive punisher;
  mechanically the richest melee.
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
