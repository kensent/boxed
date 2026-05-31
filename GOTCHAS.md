# BOXED — gotchas (learned the hard way)

- **The render path (`draw()`) must NEVER call either RNG stream** (`rng()` =
  gameplay, `vrng()` = visuals). Both are seeded and deterministic; drawing
  from them desyncs a fight from its seed. Any wobble/jitter in `draw()` must
  be derived from positions or time, not RNG.
- **Card STATS (HP/SPD/DMG/CD) render live from the roster object** so they
  can't drift. But hand-typed DESCRIPTION strings and code comments CAN go
  stale when a mechanic changes — check them whenever you retune something.
- **HP/damage run at a 10× display scale** (HP ~570–1110, DMG ~40–350). It's a
  pure linear rescale of the float sim — win rates are dimensionless, so the scale
  is balance-neutral; it just keeps the on-screen numbers honest to the sim. Any
  NEW hardcoded damage literal must be in 10× units (e.g. the bone burst is `170`,
  counter `80`); `f.dmg`-driven damage scales for free. (The earlier hitStop
  feedback rule about reading raw vs ceil'd damage no longer applies — hitStop
  was removed; see the entry below.)
- **HP is the gentle balance lever** — roughly 0.5–1 win-rate point per ~40 HP
  (at the 10× scale), predictable and linear, no resonance risk. Damage and
  cooldowns are sharper. HP does NOT need to be a round number; tune to whatever
  integer the sim says (the Duelist's 950 is a deliberately tuned value).
  **Sensitivity is non-uniform across the roster, though.** At low-damage
  fighters like Gambler (per-coin dmg ~50), HP is much sharper — measured
  ~1 wr per ~11 HP in the recent rebalance, vs the roster-average ~1 wr per
  40 HP. Rule of thumb: the lower the fighter's per-hit damage, the more
  each HP point matters in their fight duration. For fighters in that regime
  (~50-80 base dmg) start with smaller HP increments and confirm via the
  harness before committing big swings.
- **Watch for cooldown resonance**: if a defensive recharge timer exactly
  matches an attacker's ability cadence, it creates a lockstep (e.g. a shield
  that's always up against one specific enemy). Keep defensive timers off
  round numbers that collide with common cooldowns.
- **Homing strength is a sharp lever with a plateau then a cliff** — small
  changes in the low range do little, then it suddenly spikes. Sweep it.
- Sim numbers have a noise floor (~1-2 points run to run) at N=300/matchup.
  Meaningful tuning resolution is ~±2-3, not ±1. Land in the right
  neighborhood and confirm with a full run.
- **`drawFighter` early-returns for dead fighters** (`if (f.dead) return`), so a
  dead fighter's sprite vanishes instantly. Death / post-death visuals must render
  in the death-ceremony block of `draw()` (gated on `game.koTimer`), using the
  loser's frozen position (`loser = game.winner === game.red ? game.blue : game.red`).
  Note `koTimer`/`flashFrame` decrement by REAL time, not the slow-mo `timeScale` —
  so anything keyed off them plays at real speed during the slow-mo finish.
- **"Visual-only" is not automatically balance-safe.** A field set in the sim path
  is safe only if gameplay never reads it back AND you don't change rng/vrng usage
  or control flow. Removing particle spawns was safe (they only touch `vrng`, a
  separate stream from the `rng` that decides outcomes). Screen-shake is safe
  (headless-skipped); effect spawners (`spawnImpact`, etc.) are headless-guarded
  for the same reason. **Historical trap**: `hitStop()` looked like pure "feel"
  but was replicated in the headless runner (set simDt = 0 for a few ms on
  ≥120-dmg hits) — disabling it had shifted matchups. It has since been removed
  outright, so this trap is closed; but the lesson stands for any future "feel"
  mechanic that's tempted to live in the sim loop. After touching anything in
  the sim path, confirm `./balance.sh` output is bit-identical to the `MATCHUPS`
  block.
- **The arena is 300×300, not 360×360.** Shrunk from 360 once the ability
  redesigns landed. The constant lives at `engine.js:17` (`ARENA = 300`); the
  reduce-then-rebalance pass tuned every fighter back into band around the
  new geometry. Any new ability-range stat (Warlock drain 140, Cannoneer
  splashRadius 55, Ronin strikeDist 175) should be evaluated as a *fraction
  of the arena* — at 300, a 150-px reach covers half the arena, which is a
  lot more than the same number meant at 360. Re-running balance after
  touching range values is non-optional.
- **The camera (`engine.js`) is render-only — never feed it back into the
  sim.** It holds STATIC at the arena centre at zoom 1.0 — always. Both
  prior camera behaviours have been retired: the dynamic follow-cam
  (disabled after the arena shrink — the smaller arena already framed
  both fighters fine) and the kill-cam push-in on the loser (retired
  because the death ceremony + camera-snap flash + audio stamp the kill
  on their own, and the static frame keeps winner + loser + lingering
  winner-owned items all visible at the climax). The sim must never read
  `camera.*`. Two consequences worth knowing: (1) the arena grid + border
  are drawn in-world by `drawArenaBackdrop` (NOT CSS) so they stay
  aligned with sprites under the camera transform — don't move them back
  to CSS. (2) Under the camera transform, world coords ≠ screen coords
  (matters for screen-space overlays — see next bullet).
- **Screen-space overlays must reset the transform under the camera.** The
  HP band (`drawHpBars`, drawn *before* `applyCamera`), the VS-intro
  (`drawVsIntro`) and the white camera-snap flash all live in *device*
  space and must run with an identity transform — `draw()` does
  `ctx.setTransform(1,0,0,1,0,0)` before each. The flash fills the **arena
  rect** (`layout.arenaX/arenaY/arenaPx`), not the whole canvas, so the
  arena "snaps" while the HUD doesn't. The death ceremony is the opposite:
  it's world-anchored at the loser's position, so it stays in camera space
  (inside the arena clip). After the clip is released the transform is back
  in camera space, so the overlays that follow MUST reset to device space
  first — `drawVsIntro` positioned in device px while a camera transform was
  active would scale by `pxPerRef` and land in the wrong place. We shipped a
  finish-window graphic at world centre once and it floated off — hence
  this note.
- **The canvas is the sole renderer of the fight screen — don't reintroduce
  DOM HUD.** The HP bars and the VS-intro reveal used to be DOM/CSS overlaid
  on a small (360×360) arena canvas. They are now drawn INTO the canvas
  (`drawHpBars` / `drawVsIntro` in `render/arena.js`), which fills the whole
  9:16 fight area. This was done so the in-app recorder (`record.js`) captures
  the canvas and gets **pixel-for-pixel what's on screen** (preview ==
  export). Consequences:
  - The arena is a centred square **sub-region**, not the whole canvas.
    `resizeCanvas` (engine.js) computes `layout` (arenaX/arenaY/arenaPx + the
    HP band) in device px; `applyCamera` centres the 300×300 ref space on the
    arena sub-rect (not `canvas.width/2`). Arena content is wrapped in a
    `ctx.clip()` to the arena rect so wall-edge spillover can't bleed into the
    HP band or letterbox.
  - **Content is inset by `SAFE_X` (~11% each side) — a Shorts safe zone, not
    decorative margin.** Even an exact-9:16 Short is SIDE-CROPPED on tall (~20:9)
    phones: the player fills the video to screen height and trims ~10% off each
    side (expected YouTube behaviour). With the old 15px (3.8%) margin the HP
    labels ("PRIEST"→"RIEST") and arena edges got cut. The arena square and the
    HP columns both inset by `SAFE_X` so they survive the crop, and the inset
    doubles as clearance for the right-side Like/Share button overlay. The arena
    is therefore 306-wide (was 360); `pxPerRef = arenaPx/ARENA` so the sim still
    runs in the 300×300 ref space (render-only, balance bit-identical). Don't
    shrink `SAFE_X` back toward the frame edge to "use more space" — the black
    side-bars on an un-cropped view are the deliberate cost of never cropping.
  - **Anything new on the fight screen must be canvas-drawn to show up in
    recordings.** Adding a DOM element over the canvas would be invisible in
    the webm AND would double-render / diverge from the capture. There is no
    DOM `#hp-bars` / `#vs-intro` anymore — don't add them back. (HP is read
    live in `drawHpBars`; `updateHp()` is gone. `f._hpShown` is a render-only
    eased bar value — the sim never reads it.)
  - The recorder is **render-only, browser-only, balance-safe**: `record.js`
    isn't in `boxedshard.js`'s `SIM_FILES`, `draw()` never runs headless, and
    audio is muxed via `Audio.recStream()` — a parallel `MediaStreamDestination`
    tap off the master limiter (`audio.js`) that never touches the speaker
    path or rng/vrng. When the REC button is armed, `resizeCanvas` boosts the
    canvas backing to ≥`Recorder.REC_W` (1440px) wide so the capture is crisp;
    this also sharpens the live view and is balance-neutral. Capturing above
    1080p matters: YouTube re-encodes a 1080p upload with a softer tier, while
    >=1440p uploads get the better VP9 transcode (crisper even at 1080p
    playback) — so `REC_W`/`REC_BITRATE`/`REC_FPS` in `record.js` are the
    quality knobs. 1440p60 is the balance point: 4K (`REC_W` 2160) can't hold a
    smooth 60fps under in-browser software VP9 (the 4K canvas is rendered,
    captured, downscaled for preview AND encoded every frame) — going 4K needs
    `REC_FPS` 30 or an MP4/H.264 hardware-encode path.
  - **The armed backing store MUST be an EXACT 9:16 with EVEN width AND
    height** (1440×2560). The `#app` box is 390×693 = 0.5628, a hair off true
    9:16 (0.5625), and a plain `round(rect × dpr)` gave an ODD height
    (1440×2559). That cropped the video on some devices: YouTube Shorts
    re-encodes to 4:2:0 H.264 (needs even dims) and letterboxes/crops anything
    not exactly 9:16, and different players resolve the mismatch differently.
    `resizeCanvas` forces `cw` even and `ch = even(cw*16/9)` while armed, and
    centres content with `topY = (ch - blockH)/2` off the ACTUAL canvas height
    (not `REF_H*k`). The on-screen CSS box stays 390×693 — the ~0.05% backing-
    vs-box stretch is sub-pixel/invisible. Don't revert to `round(rect.height)`
    for the armed path. After touching any of
    this, confirm
    `./balance.sh` is still bit-identical to the `MATCHUPS` block (it is —
    nothing here is in the sim path).
- **The finish is a sequence, and the death voice + koHit boom fire from
  `draw()`, not the sim path.** On the kill, the death ceremony begins
  immediately (`game.koArriveAt` is set on the first frame of the finish
  window) and the camera-snap `flashFrame` + the `death`/`koHit` sfx are
  all triggered *there* (in the finish block of `draw()`) so the snap and
  audio land with the shatter. Don't "tidy" the flash or those sfx back
  into `combat.js`/`endGame` — that loses the co-location and
  reintroduces the old kill-instant-vs-shatter desync risk. Safe because
  `draw()` never runs headless and `sfx` is headless-guarded regardless.
  Death progress is a fixed `DEATH_DUR` measured from `koArriveAt` (not
  the leftover window), so every kill gets its full beat; `FINISH_WINDOW`
  is the total. The pre-arrival "hold the intact sprite while the
  kill-cam pushes in" branch is gone with the kill-cam itself — the
  shatter starts at frame 0 the moment the finish window opens.
- **Screen shake is render-only and deliberately sparse.** `shake(mag)`
  (in `combat.js`) writes `game.shakeMag` / `game.shakeTime`; the sim
  never reads them back, only the render path (`draw()` in
  `render/arena.js`) and the decay tick in `advance()`. Balance-safe.
  **Max-combining** is critical: a new smaller shake never overrides a
  bigger ongoing one, so rapid sequential hits (Berserker rampage passes,
  multi-orb wizard volleys, Archer arrows) don't compound into jitter —
  the heaviest event in any 0.18s window wins. The shake hierarchy is:
  - K.O. = 14, the **ceiling** (always; `main.js endGame`)
  - Heaviest character moments = 7–9: Cannoneer BOMBARD impact (9, both
    code paths — life-expire splash AND direct-contact), Sapper STICK
    CHARGE detonation (9), Berserker RAMPAGE launch (7), Priest JUDGMENT
    pillar landing (7), Geomancer SIGIL slam (3.75 → 9, scales with
    active stone count `3 + stones * 0.75`)
  - Cannoneer cannon muzzle = 6 (telegraph beat, deliberately lighter
    than the impact — the firing IS its own moment but it shouldn't
    rival the shell landing)
  - Per-hit shake in `damage()` = `big * 9`, **gated at `big >= 0.15`**
    (~40 dmg) so chip hits (arrows, hex bolts, coins, low-dmg fighter
    casts) stay silent. The +2 baseline that the old shake had is gone
    on purpose — every hit shaking is what made shake feel like ambient
    noise instead of weight. Don't restore it; if a specific hit feels
    under-weighted, fix that hit's dmg / recoilMag / spawnImpact instead.
  - Drain and reel ticks (continuous DoT) explicitly **don't** shake —
    they'd machine-gun otherwise. Same as the existing flash / impact
    rule in `damage()`.
  Spawn-shakes on multi-projectile abilities (Gambler's old Coin Nova /
  Fortune's Barrage spawn shakes) were removed — a SPAWN isn't an impact
  event; each projectile shakes via per-hit when it actually connects.
  Same logic for any future multi-projectile kit: shake on hits, not on
  fire. The character-signature shake on a charged release (Cannoneer
  muzzle, Berserker rampage launch, Sapper detonation, etc.) is the
  exception — those are the kit's *defining* beat, not a multi-spawn.
- **Hit-feedback funnels live in `particles.js` — don't inline.** Four
  helpers consolidate the visual+state mutations every hit / cast fires.
  Use them instead of re-typing the underlying field-sets:
  - `hitFx(x, y, kind, dir, big, radius?, sfxName?)` — spawns the impact
    visual + plays the audio twin. Default audio is `sfx('impact', { kind,
    big }, x)` (the generic per-kind impact family); pass `sfxName` to
    override with a bespoke cue (Priest JUDGMENT uses `'lightning'`,
    skeleton death uses `'boneBurst'`/`'boneCrumble'`). `radius` is only
    for impacts with a falloff edge (Cannoneer EPICENTER). Every
    `spawnImpact` call goes through this — `grep -c spawnImpact
    js/engine.js js/abilities.js` should stay 0.
  - `setFireKick(f, dur, dir)` — ranged discharge gesture (was `f.fireKick
    = N; f.fireKickMax = N; f.fireDir = ang;` triplet, 11 sites).
  - `setMeleeImpact(f, dur)` — melee body squash (was `f.meleeImpact = N;
    f.meleeImpactMax = N;` pair, 6 sites).
  - `applyRecoil(target, dir, big)` — non-melee victim knockback (was
    `if (!target.dead) { target.recoilTimer = 0.16; target.recoilDir = D;
    target.recoilMag = big * 13; }` block, 4 sites). The dead-guard is
    folded in. The MELEE body-contact recoil set inside `damage()`
    stays separate on purpose — it's kind-aware (`!srcKind` gate).
  These are all visual-only / headless-guarded; `./balance.sh` must
  remain bit-identical after touching any of them.
- **Universal-state timer decay goes through `decayTimers(obj, dt,
  fields)` — only timers WITHOUT a zero-trigger belong in the lists.**
  Two named arrays in `engine.js` drive this: `FIGHTER_DECAY` (flash,
  negateFlash, meleeImpact, recoilTimer, fireKick, blastTimer,
  slowTimer, wakeHitCd) and `SKELETON_DECAY` (hitCd, wakeHitCd,
  flash). Every entry's contract is "be > 0 → effect active; hit zero
  → effect over." Timers that need to FIRE LOGIC at zero (dashTimer's
  velocity reset, parryTimer's window close, aim/drain cadences,
  iaiStrike's chain check) still tick inline at the site that owns
  the trigger — DO NOT add them to the FIGHTER_DECAY list or the
  zero-trigger silently never runs. Same warning if a current list
  member gains a zero-trigger later: move it out of the batch.
- **Multi-hit damage floats on skeletons merge via BATCH_GAP, same as
  fighters.** Every `damageSkeleton` call goes through the burst-merge
  in `engine.js` — if a previous float is still "open" (within
  BATCH_GAP ms of the last hit), the new dmg folds into the running
  total instead of spawning a fresh `-N` text at the same screen
  position. Skeletons carry a `dmgFloat` handle (mirrors
  `target.dmgFloat` on fighters); the engine's `floatTexts` update
  loop resolves both kinds the same way. The bug this fixes: SIGIL's
  all-pairs network can drop 3 ley-lines onto one skeleton in the
  same cast — without the merge, all 3 floats spawned at the same
  `(sk.x, sk.y - sk.size - 4)` point and stacked into a single visible
  "-80" while HP took the full 240. Skeleton was the only entity
  type with this gap (projectile/MELEE_CLEAVE paths gate via
  `sk.hitCd = MELEE_SKEL_IFRAME` so they can't multi-hit in one frame;
  SIGIL is the outlier because it fires all lines simultaneously).
  Future entity types with their own damage path should follow the
  same `dmgFloat` + BATCH_GAP pattern.
- **Uniform "aim at nearest" targeting (DOPPELGANGER substrate).** Every fighter
  that aims at an enemy must route through `pickTarget(attacker, defender)` in
  `engine.js`, which returns the nearest of `{real defender, ...defender.decoys}`.
  For 14 of the 15 active fighters this collapses to returning the real defender
  (only Jester spawns decoys), so behaviour is unchanged. But any NEW ability that
  reads `enemy.x/y/vx/vy` directly will silently bypass DOPPELGANGER and aim
  through decoys — use `aim.x/y` (the `pickTarget` result already declared at
  the top of `fireAbility`) instead. Same goes for collision: projectile/melee
  hits should call `tryHitDecoy(pos, defender, range)` first so a closer decoy
  intercepts the attack before it reaches the real fighter. Predictive aim
  (Priest JUDGMENT) is the one place that reads `aim.vx/vy` — decoys are
  stationary, so `(target.vx || 0)` defaults to 0 and the pillar lands on the
  decoy's current position. That's the intended texture: predictive abilities
  get fooled hardest by decoys.
  - **The render path mirrors this rule too.** `drawFighter` (`render/sprites.js`)
    computes `faceTarget = pickTarget(f, enemy)` once and uses it for the body
    facing AND every aim telegraph (cannon aim-line, dasher windup lean, slow-
    drag ghosts) — otherwise the body would point at the real fighter while the
    attack flies at a closer decoy (the bug that prompted this: cannoneer's
    windup aim-line faced the faraway real Jester but fired at the near decoy).
    `pickTarget` is a pure position read (no rng), safe in `draw()`. Ronin's cut
    (`f.iaiAngle`) and Priest's reticle (`f.judgeX/Y`) were already decoy-aware
    because they snapshot the `pickTarget` `aim` at cast. Any NEW render-side
    "point at the enemy" must use `faceTarget`, not the raw `enemy`.
- **Windup abilities that set their own launch velocity must early-return from
  `resolveAim`.** The tail of `resolveAim` (in `abilities.js`) does a generic
  velocity renormalization back to `f.speed` — useful for Priest/Cannoneer who
  stand still during windup. Berserker's RAMPAGE sets `f.vx/vy` to ramming
  speed (`f.speed * f.rampageSpeedMult`) at resolve, and that normalization
  would crush it back to 1× speed — Berserker would barely move and the
  rampage would fail to ricochet. The fix is a `wasTackle` early-return before
  the renormalization. Any future windup ability with a custom launch velocity
  needs the same exclusion.
- **Berserker's RAMPAGE picks aim at RELEASE, not at cast.** Most windup
  abilities (Priest, Ronin) lock their target/direction at cast — the enemy's
  drift during the windup IS the counterplay. Berserker is the exception: he
  picks the aim angle in `resolveAim` from the current enemy position (via
  `pickTarget`) at the moment the coil snaps. That fits the "wild bruiser"
  identity (he uncoils toward wherever the enemy actually is) and avoids a
  0.5s lead-the-enemy gap. The counterplay is still there in the form of the
  vulnerable 0.5s coil where Berserker drifts at 40% speed; enemies attack
  freely during it.
- **Ronin's body must face `iaiAngle` during BOTH windup and strike.** The
  strike direction is locked at cast (the enemy's drift during the windup
  IS the counterplay — see the Berserker bullet above). So the body has to
  face that locked direction during the windup (the telegraph) and the
  strike (the cut animation), not the live `atan2(enemy.y - f.y, enemy.x - f.x)`.
  The facing branch in `drawFighter` (`sprites.js`) is:
  `inIaiCut = f.ability === 'iai' && (f.iaiWindup > 0 || f.iaiStrike > 0)`
  → use `f.iaiAngle`; otherwise the standard atan2-to-enemy. The FOCUS chain
  is covered for free — its windup is effectively a single frame
  (`iaiWindup = 0.001`), but the visible 0.15s `iaiStrike` window keeps the
  body pointed at the cut direction for the chain too. If you ever add a
  new `iaiAngle`-driven phase (e.g. a recovery beat), extend the condition
  to cover it or the body will visibly contradict the cut.
- **Ronin's FOCUS chain is capped at `chainCap` consecutive cuts.** The
  teleport-overshoot puts Ronin adjacent to the enemy, and body-vs-body
  collision bounces the enemy back into `slashReach` on the same frame,
  so the chain self-perpetuates on physics alone — without the cap, 6–8
  identical cuts would routinely chain off a single opener. The cap
  (`chainCap: 4`, named template prop on Ronin) interrupts the loop by
  forcing the next cast to play the full windup. Mechanically: the IAI
  strike's hit branch increments `f.iaiChainCount`; at the cap it sets
  `f.focused = false` AND resets the counter AND skips the cd refund, so
  the next cast hits the standard `cdTimer` decrement path and runs the
  full `windupTime` plant. The whiff path (`f.iaiStrike <= 0` + `!iaiHit`)
  also resets the counter — a re-engagement starts fresh from the opener.
  The cap roughly halves Ronin's max-chain damage burst (was 6–8 × dmg,
  now ≤4 × dmg), so it's compensated via the named damage lever: `f.dmg`
  bumped from 95 → 140 to recover the missing burst capacity. If you
  raise/lower the cap, expect to re-tune `f.dmg` in lockstep (recursive
  multi-hit damage rule applies — see the Tuning lever notes section).
- **Wizard's MANA SHIELD consume-feedback fires on EVERY srcKind that
  reaches the orb-consume branch.** The visual+audio twin
  (`hitFx(orb.x, orb.y, 'orb', 0, 0.4, 0, 'shield')` + `target.shieldConsumeFx
  = 0.2`) is unconditional inside the branch — there's no per-srcKind gate.
  This is safe because every path that lands here is naturally paced:
  projectile / melee / bone hits are discrete; `'hazard'` covers Archer
  STAKES (one-shot) and Reaper WAKE (0.2s-gated via `wakeHitCd`); `'drain'`
  is 0.2s-gated via `f.drainTickTimer`; `'reel'` bypasses the shield
  entirely (pure dmg). The 0.2s flash window matches the slowest tick rate,
  so a sustained DoT keeps the gauge segment continuously bright — reads
  as "the shield is melting under pressure," which IS the right story.
  Older code gated against `'drain'` and `'hazard'` for stutter concerns;
  the gate was over-conservative and is gone — don't add it back. If you
  introduce a NEW srcKind that ticks faster than 0.2s, gate THAT one
  explicitly (don't lump it into a generic exclusion list).
- **Reaper's carried scythe and the in-flight crescent share `drawScythe(c,
  s, accent)`** in `render/sprites.js`. The carried sprite (`drawShape`
  `'sickles'` case) calls it with `(c, FIGHTER_SIZE * 1.1, f.accent)`. The
  in-flight crescent (`render/arena.js`, `p.kind === 'crescent'`) calls it
  with `(ctx, FIGHTER_SIZE * 1.1, '#aa0000')` inside a `translate(p.x, p.y)
  + rotate(p.spin)` save block. Both forms render the IDENTICAL silhouette
  by design — the thrown weapon must read as the same scythe the Reaper
  carries, just spinning. Prior in-flight versions tried bespoke shapes
  (straight shaft + small hook = boomerang L-silhouette; thicker blade +
  deeper J = still unbalanced); the only thing that landed the "scythe"
  read was sharing the carried-sprite shape. Don't diverge the two. If
  the carried scythe is restyled, edit `drawScythe` and both forms update
  in lockstep.
- **The closing-ring fog mechanic is gone.** Don't add code that reads
  `game.ringRadius`/`game.ringWarned`/`RING_START`/`RING_FULL` — they no
  longer exist. Fights resolve naturally; the headless
  `simulateFightDetailed` 6000-tick guard (~100s) is the only stalemate
  backstop. The balance harness tracks `long%` (fights past 60s) as a
  stalemate-prone-matchup detector — see `boxedshard.js`'s
  `LONG_FIGHT_THRESHOLD`. The HUD fight-clock was the last visual
  artifact of this mechanic and is also gone (no `#fight-clock` element,
  no `.fight-clock` CSS, no `@keyframes clockpulse`). `game.elapsed`
  itself stays — read by the balance harness (per-matchup avg time) and
  the upset-hunt result text on the select screen.
- **Vestigial fighter fields culled — don't reintroduce.** The following
  were initialized in `makeFighter` but never set > 0 or never read,
  and have been removed: `stunTimer` (CRIPPLING HOOK retired),
  `counterAnim` / `counterDir` (Duelist reactive-jab visual retired —
  the parry window IS the response), `sweepHit` (set-to-false twice
  but never set true or read), `lastX` / `lastY` (initialized to x,y
  then never touched), `shotCount` (always 0), `sigilWhiff` (no
  read-side anywhere — the cdTimer-frozen-until-first-stone gate at
  `engine.js`'s ability-fire branch prevents the cases it was guarding),
  `linksPerStone` (set as a stat but `computeSigilLinks` takes it as
  `_linksPerStone` — explicitly unused). If a future kit needs any of
  these names back, prefer a fresh name so old grep hits don't mislead.
- **Knight was retired and replaced by Geomancer.** Knight's melee-tank niche
  was a hard design corner under autonomous DVD movement — every prototype
  hit one of: un-tunable reactive timing, off-brand ranged, off-brand
  homing, or "just a dash." Geomancer ships in the same roster slot and
  *uses* the wall-bounce as its core mechanic (STANDING STONES plant on each
  hit, SIGIL fires ley-lines between every stone). `EXCLUDE_IDS` is now empty
  in both `boxedshard.js` and `boxedmerge.js`; `balance.sh` is at 8 shards × 15
  = 120 matchups (all 16 active fighters participate). If a future fighter
  goes shelved, sync `EXCLUDE_IDS` across both files AND drop the shard count
  in `balance.sh` in lockstep.
- **Geomancer's SIGIL is all-pairs, not nearest-neighbour.** The first
  topology shipped was "each stone links to its 2 nearest" — sounded clean
  but the nearest stones are ADJACENT along the same wall, so links hugged
  the perimeter and never crossed the arena interior where the enemy lives.
  Geo ran at 0% win rate. Switching to ALL-PAIRS (every stone links to every
  other) produces ~28 lines at the 8-stone cap, of which ~4 typically cross
  the enemy body — the per-line dmg (`f.dmg`) is tuned around that count.
  The `linksPerStone` template prop survives unused; it's there if a future
  topology wants to clamp the network density.
- **Geomancer is a node in his own SIGIL network.** The kit's identity ("the
  fighter IS one of his own stones") is mechanically true — the SIGIL link
  set is built from `[self, ...wall-stones]`, so once the FIRST wall-stone
  is planted, there's already a `self → stone` line. This is the reason
  the kit boots up viably without a corner-stones pre-seed (the earlier
  shipped version had 4 corner stones pre-planted; that's gone — speed bumped
  to 120 instead, so first bounces arrive ~1s into the fight).
- **Geomancer stones don't expire on a timer.** `maxStones` cap-eviction
  (oldest first, in `plantStone()`) is the only removal mechanism. Stones
  render at full alpha during play; no fade-out. An earlier version had a
  13s `stoneLifetime` decay — removed because the cap was always hit first
  in practice, and the decay's fade-out was visual noise rather than
  mechanical signal. **Exception: on Geomancer's death**, both the stones
  and any active `sigilFlash` linger with a render-side fade — full alpha
  for 0.5s post-death (so a SIGIL → BONE BURST kill stays readable at the
  kill moment), linear fade over the next 0.7s, gone by 1.2s. The natural
  `sigilFlash` decay (`sigilFlashDur` ~0.6s) is in sim-time, so under the
  finish-window slow-mo (0.18×) it stretches to ~3.3 real seconds; the
  death fade is in real-time and rides on top of the natural decay,
  multiplied in via `deathAlpha`. Visual only — `f.sigilFlash` /
  `f.stones` are never read by sim logic.
- **Archer VOLLEY is one continuous parabolic arc per arrow, NOT
  separate launch/sky/land visuals.** Each `rain` projectile renders
  along its full flight from `(launchX, launchY)` (Archer's position at
  cast time, captured at spawn) through the apex above the arena top
  back down to `(landX, landY)`. The arrow is drawn only while
  `ay >= -20` (inside the visible arena); above that it's naturally
  off-screen. Don't refactor this into separate "launch flash" + "fall
  visual" code paths — the unified arc keeps the visual story coherent
  ("same arrow goes up, comes down here") and avoids the previous bug
  where landing arrows looked summoned in place.
- **Archer's body always faces world-up, not the enemy.** Override in
  `render/sprites.js` drawFighter facing logic: when
  `f.ability === 'arrow'`, facing = `-Math.PI / 2`. The kit's whole
  identity is "shoots arc volleys at the sky," and tracking the enemy
  with the bow created a visual disconnect (bow points at enemy, arrows
  go up). Sky-up facing is consistent with the firing direction.
- **VOLLEY's disk-center is wall-margin-clamped, not per-arrow.** The
  phyllotaxis disk center is clamped to
  `[volleySpread + FIGHTER_SIZE, game.w - volleySpread - FIGHTER_SIZE]`
  before the per-arrow positions are computed. Per-arrow clamping (a
  previous version) collapsed the pattern into a vertical line when the
  enemy hugged a wall, because arrows that would have landed off-arena
  got pinned to the wall edge. Center-clamping preserves the disk
  shape (just shifts it inward when needed).
- **Ronin's IAI cleaves Archer STAKES on the dash line.** Ronin's
  teleport-overshoot skips intermediate body positions, so stakes
  exactly on the dash line would never trigger via standard body-vs-
  hazard overlap. The IAI strike block in `engine.js` explicitly
  filters `game.hazards` for `kind === 'stake'` on the segment path,
  consumes each, and chips Ronin for the stake's dmg. Visual + balance
  fix: the stake field clears as Ronin dashes, AND he pays a toll per
  cleaved stake. Softens the Archer-vs-Ronin matchup (1% → 17%)
  without removing the hard-counter feel.
- **Geomancer's SIGIL damages enemy skeletons on lines.** Each ley-line is
  segment-tested against every enemy-team skeleton; a crossing routes
  through `damageSkeleton(sk, f.dmg)`. Symmetric with Priest JUDGMENT's
  pillar (AOE) and Ronin DRAW BLADE's segment cleave — both also hit
  skeletons. Card text "burning anyone on the lines" reads literally.
  Skipped own-team skeletons (`sk.team === f.team`) for symmetry even
  though Geomancer doesn't summon today, plus already-dead ones (so a
  skeleton killed by line N can't be re-damaged by line N+1; BONE BURST
  fires exactly once). Cleanup filter `game.skeletons.filter(sk => sk.hp > 0)`
  runs once after all lines resolve. Practically rarely changes a fight
  outcome — line geometry vs skeleton positions only aligns sometimes
  and Geomancer's `dmg` (80) takes 3 crossings to kill a skeleton
  (`SKEL_HP` 180) — but the *card text* now matches the *behavior*.
- **`srcKind === 'reel'` is PURE damage** — bypasses every defensive layer
  in `damage()`: no Jester decoy spawn, no Duelist parry absorb, no Wizard
  Mana Shield reduction or orb consumption. Used by Hunter's BARBED LINE
  passive: as the tether drags the enemy in, the engine accumulates drag
  distance on `target.reelDragAccum`; every `reelStepPx` (10) it fires
  `reelStepDmg` (3) via `damage(target, dmg, 'reel')`. **Integer ticks by
  design** — an earlier fractional-per-frame version (0.3 dmg/px) had to
  skip `Math.round` to avoid 0.5→1 doubling and sub-1.0 rounding to 0.
  Step-based accumulation sidesteps both: dmg is always an integer (3),
  no rounding needed, float display is naturally clean. Template props
  (`reelStepPx`, `reelStepDmg`) live on the HOOKER and are read at tick
  time via `tetherTarget.reelStepPx/reelStepDmg` — do NOT add those props
  to the `makeFighter` runtime defaults: the spread order (`...t` first,
  defaults after) would silently override the template values to 0 and
  the passive would do nothing. Future "pure" mechanics should reuse
  this srcKind and the same template-only pattern.
- **`game.bloodTrail` is render-only.** Initialized to `[]` in `buildGame`
  but mutated (push + filter) exclusively inside `draw()` — never touched
  by `step()` or the headless harness. Drops have `bornAt: performance.now()`
  and fade over 1.2 s; they leave a visible bloody streak along the path
  of the Hunter's reel-in. Balance-safe because `draw()` never runs in
  headless; if you ever add a sim-path read of `bloodTrail`, you'll break
  determinism.

## Tuning lever notes

Patterns learned across the redesign + rebalance passes. None of these are
mechanical rules; they're shapes to watch for when reaching for a tuning
knob. Confirm via `./balance.sh` regardless.

- **Recursive multi-hit abilities have a multiplier damage lever, not a
  sum.** Berserker RAMPAGE (per-pass dmg × ~4 passes), Archer VOLLEY
  (per-arrow dmg × ~6 arrows, of which 1-2 land and the rest become
  STAKES — both rain hits and stake chip use `f.dmg`), Geomancer SIGIL
  (per-line dmg × ~4 crossings) all scale ~1 wr per 1 dmg, because each
  point applies several times per cast. Reach for HP / cd to bring them
  into band; damage moves the matchup faster than it looks (and going
  too low collapses the kit — Gambler dmg 50 → 42 over-corrected by
  ~12 wr).
- **Standstill windows are stealth buffs.** Adding or extending a
  planted phase makes the launch geometry more predictable: enemies eat
  cleaner cuts when the fighter is rooted (Ronin's FOCUS-plant lifted
  him 56% → 64.6% silently; Berserker's coil makes his ramming direction
  trivially predictable). Expect to compensate via a *different* lever
  when adding/extending a standstill — usually HP or per-hit damage.
- **Floor-hazard residue self-paces via lifetime, not stack caps.**
  Archer's STAKES use a per-stake `stakeDur` (2.5s); the floor field
  can't grow unboundedly because old stakes expire as new VOLLEY casts
  land. Don't bolt on an extra "max stakes alive" cap — the lifetime
  does that job. (The current cap-and-evict patterns we DO use, like
  Necromancer's `skelCap` and Geomancer's `maxStones`, exist because
  those entities have NO natural decay. Stakes have decay, so a cap
  would be redundant and add brittle code.)
- **Per-fighter sensitivity is not uniform across the roster.** Pick the
  lever that's *gentle* for the fighter, not the gentle lever
  globally:
  - **cd**: very sharp at Ronin (~1 wr per ~1% cd change) and Jester
    (~1 wr per ~1% cd) — each blink/iai IS the damage event, so cadence
    dominates. Tap 0.05s at a time.
  - **speed**: sharp at Duelist (~0.6 wr per 1 speed — cast cadence
    dominates output, idle movement is closing pressure between casts).
  - **HP**: typically the gentle lever (~1 wr per ~40 HP at the 10× scale)
    but *much* sharper for low-damage fighters: Gambler is ~1 wr per
    ~11 HP, Priest is ~0.06 wr per HP (≈1 per 16). Use small HP
    increments at the bottom of the damage range.
- **Homing strength has a plateau-then-cliff curve.** Small changes do
  nothing for a long way, then the projectile suddenly starts curving
  hard enough to redirect mid-flight and the matchup spikes. Sweep
  values; don't tap. Relevant for Wizard orbs, Reaper crescent,
  Gambler coin nova, hex bolt, hook.
- **Predictive aim breaks across velocity discontinuities.** Priest's
  JUDGMENT locks at `enemy.x + enemy.vx * windupTime` at cast time.
  Fighters whose velocity dramatically changes *during* the windup
  (Berserker idle → rampage, blinked Jester) escape the pillar
  geometrically — no amount of damage tuning closes this gap. Hard
  counters here are content, not a bug to fix.

## HP-scale tuning notes

The HP scale was doubled from the original "punchy 13s avg" tuning to
land the current 23–32s fight durations. Numbers below are about how
balance behaves *under this scale*, not about the historical transition.

- **HP scaling buffs sustain kits and nerfs burst kits — not symmetric.**
  Doubling HP doesn't preserve matchup ratios. Kits whose value
  *compounds over time* (Necromancer's bone burst chain, Geomancer's
  stone network, Hunter's BARBED LINE chip, Wizard's mana shield
  economy) are structurally stronger at longer durations. Kits whose
  effect is *fixed-duration* (Jester's 3s decoys, Reaper's WAKE
  crescent, Witch's mark window) are diluted. If you change HP scale
  again, expect non-uniform rebalance — not a global multiplier on
  damage. (Empirically: a naive HP × 2 landed Necromancer at 71% and
  Jester at 37%; closing the 34pt spread to 4.3pt took dozens of
  per-fighter tunings.)
- **Most flat damage/HP literals are NOT proportional to fighter HP.**
  Bone burst dmg (140), `SKEL_HP` (180), Priest `healOnHit` (18),
  Hunter `reelStepDmg` (3) — these are absolute values, not relative.
  Each one is a tunable in its own right: bone burst at 140 deals
  ~9% of fighter HP under the current scale. Tune these per-fighter
  for balance; don't scale them as a group. We tried scaling them all
  × 2 once and it over-buffed Necromancer to 88% (skeletons twice as
  durable + kills did twice as much).
- **Sharp-threshold levers — tap, don't sweep.**
  - Hunter hook **life**: 0.54 → 0.55 = +4 win-rate points. 0.01s of
    range crosses a "barely-connects-vs-barely-misses" threshold.
  - Ronin **cd**: 2.5 → 3.0 = −17 win-rate points (matches the
    pre-existing 1 wr / 1% cd sensitivity rule).
  - Bone burst **flat dmg**: 50 dmg = 14 win-rate points on Necromancer.
    Mid-range tuning required (170 too strong, 120 too weak; 140 lands).
  Use 1-step changes when tuning these.

## Tunable patterns: cap-and-evict, template-prop thresholds

- **`rageThreshold` on Berserker** — pattern note: when a "magic
  constant" is tied to a single fighter's mechanic, prefer a template
  prop in `fighters.js` over a hardcoded literal in `engine.js`. The
  kit's stats stay in one place and the card text can render the live
  value via getter. (Current: `rageThreshold: 0.4` for BLOODRAGE.)
- **`skelCap` on Necromancer** — cap-and-evict pattern for army-builder
  kits. Caps own-team skeleton count (current: 8). At cap, the oldest
  own-team skeleton is evicted before the new spawn — mirrors
  Geomancer's `maxStones` cap-eviction in `plantStone()`. Pattern fits
  any future army-builder kit (or, equivalently, any kit that produces
  a renewable resource that should have a ceiling).

## Card name vs internal name

Some ability card names were refreshed for viewer-readability without
renaming the matching substrates/mechanics in code. Comments throughout
the codebase still use the old names as *concept labels* (e.g.,
"DOPPELGANGER substrate" names the decoy-aware targeting rule; "FOCUS
chain" names the clean-cut chain mechanic). Those internal names are
intentionally preserved — they describe the mechanism, not the marketing
label. This table is the canonical bridge between the two namespaces.

| Card (user-facing) | Internal name (in comments / identifiers) |
|---|---|
| MANA ORBS (Wizard active) | CAST ORBS |
| RIPOSTE (Duelist active) | RIPOSTE THRUST |
| EN GARDE (Duelist passive) | COUNTER |
| ANIMATE BONE (Necro active) | RAISE SKELETON |
| SHOCKWAVE (Sapper passive) | BLAST RADIUS |
| PUNCHLINE (Jester active) | BLINK DAGGER (ability id `blink`) |
| DECOY (Jester passive) | DOPPELGANGER — appears across abilities.js, engine.js, combat.js, ANIMATION.md, AUDIO.md as the **substrate name** for the decoy-aware targeting rule |
| DRAW BLADE (Ronin active) | IAI (ability id `iai`) |
| CLEAN CUT (Ronin passive) | FOCUS (tunable `focusRefund`) |
| HEX (Witch active) | HEX BOLT |
| THE HOOK (Hunter active) | GRAPPLING HOOK |
| WITHER (Warlock passive) | ENERVATE |
| WAGER (Gambler active) | WILDCARD (ability id `wildcard`) |

When grepping for an ability's logic, search the **internal name**
(it's what's in code and comments). When updating the card description
in `fighters.js`, use the **card name**. If you rename an ability
again, update this table — and only update internal comments/
identifiers if the underlying *mechanism* changed, not just the label.
