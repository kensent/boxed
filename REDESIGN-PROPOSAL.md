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
| **Knight** | redesign | `BULWARK` — plant, absorb incoming, discharge as a slam |
| **Reaper** | redesign | `REAP` — orbiting scythe field + EXECUTE: hits scale up as the enemy weakens |
| **Archer** | redesign | `VOLLEY` — burst-spread fire while moving + PINCUSHION stacks on the target |
| **Ronin** | redesign | `IAI` — committed line-dash *through* the enemy + recovery |
| **Cannoneer** | redesign | `BOMBARD` — lobbed area shell: splash + lingering fire pool |
| **Sapper** | redesign | `STICK CHARGE` — thrown fused limpet bomb; guaranteed delayed burst + knockback |
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

**Why it's distinct.** It's the only attack that plays *against* ballistic
movement. Between wall bounces, fighters travel in straight lines — so a led strike
is reliable, *unless the target clips a wall during the windup and changes vector.*
Wall geometry becomes the counterplay. No one else has a delayed ground-target that
leads the enemy (Sapper's mine sits at Priest's own position and waits for contact;
this hunts a future point).

**The real fix.** Today the heal ticks regardless of anything Priest does — zero
synergy. Tying sustain to *landing* judgment creates the loop Priest has never had:
hit → live; miss → starve.

**Matchup texture.** Crushes slow/large movers who can't escape the lead (Cannoneer,
Knight, Necromancer). Folds against erratic bouncers and hard against Jester, whose
teleport breaks the prediction outright.

**Reads as.** A reticle/cross blooms at the target spot, the existing priest charge
gleams orbit and tighten, then a gold column drops with a ground-ring force-shape —
a satisfying inversion of Priest's DISSOLVE death (judgment comes *down*; the soul
rises *up*).

**Sounds as.** Windup = rising bell harmonic; the pillar = a bright bell-strike with
a warm gold resonance tail; a soft ascending chime confirms the heal on a hit.

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

## KNIGHT → `BULWARK`
*Material: heavy plate steel, deep clang, resonant ring (unchanged).*

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

## REAPER → `REAP`
*Material: hollow bone scythe, dry crack + crescent hiss (unchanged).*

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

## ARCHER → `VOLLEY` + `PINCUSHION`
*Material: wood + taut string, snap + thin whistle (unchanged).*

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

## RONIN → `IAI` (committed line-dash *through* the enemy)
*Material: fine drawn steel, whisper-crack, single clean note (unchanged).*

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

## CANNONEER → `BOMBARD` (lobbed area shell)
*Material: iron + gunpowder, percussive concussion, hard boom (unchanged).*

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

## SAPPER → `STICK CHARGE` (fused limpet bomb)
*Material: dark metal casing, sharp metallic crack + pressure (unchanged).*

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
4. **Balance is explicitly deferred.** Every verb here changes behavior and will
   need its own `./balance.sh` pass; HP is the gentle lever (GOTCHAS.md), so most
   of these can be brought back into the 46–53% band without touching the mechanic.
