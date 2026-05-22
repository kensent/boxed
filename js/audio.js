// ============================================================================
// === AUDIO ==================================================================
// Self-contained Web Audio synth. No files — every sound is generated from
// oscillators + noise + envelopes. sfx(name) plays a sound; muted by default.
// ============================================================================
const Audio = (() => {
  let ctx = null;
  let muted = false; // default ON — flip via the speaker toggle on the select screen

  // Lazily create the AudioContext on first use (browsers require a user
  // gesture before audio can start; the select-screen taps satisfy that).
  function ac() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // --- low-level voices -----------------------------------------------------

  // A pitched tone with an ADSR-ish envelope.
  function tone(freq, dur, type, vol, opts) {
    const c = ac(); if (!c) return;
    opts = opts || {};
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    // Per-instance pitch variation — a few % of random detune so repeated
    // sounds (every hit, every cast) are never byte-identical. `exact` opts
    // out for sounds that need a precise pitch (e.g. the win fanfare).
    const vary = opts.exact ? 1 : (0.97 + Math.random() * 0.06);
    osc.frequency.setValueAtTime(freq * vary, t0);
    if (opts.glideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.glideTo * vary), t0 + dur);
    }
    const peak = (vol == null ? 0.3 : vol);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + (opts.attack || 0.005));
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(panNode(c, opts.pan));
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  // Returns a node to connect into: a StereoPanner (fed to master) when a pan
  // position is given, otherwise the master bus directly. pan is -1..1.
  // Falls back to _curPan — the pan set by the current sfx() call's x-position.
  let _curPan = null;
  let _arenaW = 0;
  function panNode(c, pan) {
    const master = masterGain();
    const p2 = (pan == null ? _curPan : pan);
    if (p2 == null || !c.createStereoPanner) return master;
    const p = c.createStereoPanner();
    p.pan.setValueAtTime(Math.max(-1, Math.min(1, p2)), c.currentTime);
    p.connect(master);
    return p;
  }

  // A burst of filtered white noise — used for impacts, whooshes, explosions.
  function noise(dur, vol, filterType, filterFreq, opts) {
    const c = ac(); if (!c) return;
    opts = opts || {};
    const t0 = c.currentTime;
    const frames = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, frames, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = filterType || 'lowpass';
    // Per-instance variation — jitter the filter cutoff so repeated noise
    // bursts (hits, whooshes) have subtly different timbre each time.
    const vary = opts.exact ? 1 : (0.9 + Math.random() * 0.2);
    filter.frequency.setValueAtTime((filterFreq || 1000) * vary, t0);
    if (opts.filterGlideTo) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(40, opts.filterGlideTo * vary), t0 + dur);
    }
    const gain = c.createGain();
    const peak = (vol == null ? 0.3 : vol);
    gain.gain.setValueAtTime(peak, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(panNode(c, opts.pan));
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  let _master = null;
  function masterGain() {
    const c = ac(); if (!c) return null;
    if (!_master) {
      _master = c.createGain();
      _master.gain.value = 0.55;
      // Limiter on the master bus — catches the peaks when several voices
      // stack in a chaotic frame so the mix never hard-clips into distortion.
      const limiter = c.createDynamicsCompressor();
      limiter.threshold.setValueAtTime(-3, c.currentTime);
      limiter.knee.setValueAtTime(0, c.currentTime);
      limiter.ratio.setValueAtTime(20, c.currentTime);
      limiter.attack.setValueAtTime(0.001, c.currentTime);
      limiter.release.setValueAtTime(0.08, c.currentTime);
      _master.connect(limiter);
      limiter.connect(c.destination);
    }
    return _master;
  }

  // --- sound definitions ----------------------------------------------------
  // Rebuilt from scratch per AUDIO.md: every fighter's sounds draw from one
  // material identity, and abilities follow the windup -> crack -> tail grammar.
  let _lastContactT = -1;
  let _lastWallT = -1;
  const SOUNDS = {
    // ===== Ability casts / releases — "the fighter IS the sound" ===========

    // Berserker — raw flesh + blood. Launch whoosh: meaty lean + low body grunt.
    tackle() {
      noise(0.18, 0.22, 'lowpass', 520, { filterGlideTo: 150 });
      tone(125, 0.18, 'sawtooth', 0.16, { glideTo: 64 });
    },
    // Knight — heavy plate steel. Deep clang with a resonant ring-down tail.
    sword() {
      noise(0.05, 0.20, 'bandpass', 1800);
      tone(330, 0.30, 'triangle', 0.18, { glideTo: 235 });
      tone(660, 0.42, 'sine', 0.07);
    },
    // Duelist — sharp drawn steel. Thin, bright, precise ring.
    riposte() {
      noise(0.04, 0.14, 'bandpass', 4200);
      tone(2200, 0.18, 'triangle', 0.13, { glideTo: 1500 });
      tone(3000, 0.20, 'sine', 0.05);
    },
    // Reaper — hollow bone scythe. Crescent hiss sweep + a dry bone crack.
    sweep() {
      noise(0.24, 0.18, 'bandpass', 1300, { filterGlideTo: 700 });
      tone(280, 0.16, 'triangle', 0.12, { glideTo: 150 });
    },
    // Jester — ceramic mask. Hollow brittle pop on a dissonant interval.
    blink() {
      tone(900, 0.11, 'sine', 0.11, { glideTo: 1400 });
      tone(1320, 0.11, 'sine', 0.07, { glideTo: 620 });
      noise(0.04, 0.10, 'bandpass', 3000);
    },
    // Necromancer — dried bone. Hollow rattle + a dead, ring-less thunk.
    raise() {
      noise(0.16, 0.16, 'bandpass', 1600, { filterGlideTo: 600 });
      tone(180, 0.18, 'triangle', 0.11, { glideTo: 88 });
    },
    // Witch — toxic organic. Wet dissonant hiss with an unstable rising pitch.
    hex() {
      noise(0.20, 0.13, 'bandpass', 900, { filterGlideTo: 1700 });
      tone(420, 0.24, 'sawtooth', 0.10, { glideTo: 360 });
      tone(610, 0.24, 'sawtooth', 0.06, { glideTo: 690 });
    },
    // Archer — wood + taut string. Bowstring snap + a thin rising whistle.
    arrow() {
      noise(0.05, 0.16, 'bandpass', 2800);
      tone(1200, 0.12, 'triangle', 0.08, { glideTo: 2000 });
    },
    // Hunter — steel cable. Coiled whir + rising metallic tension on the throw.
    grapple() {
      noise(0.10, 0.14, 'bandpass', 1600);
      tone(260, 0.14, 'square', 0.10, { glideTo: 520 });
    },
    // Wizard — arcane crystal. Glassy ascending shimmer + a crystalline tick.
    cast() {
      tone(660, 0.24, 'sine', 0.12, { glideTo: 1320 });
      tone(990, 0.24, 'sine', 0.07, { glideTo: 1980 });
      noise(0.03, 0.05, 'highpass', 6000);
    },
    // Sapper — dark metal casing. The set-down: a small mechanical arming click.
    mine() {
      noise(0.05, 0.10, 'bandpass', 2000);
      tone(400, 0.06, 'square', 0.08, { glideTo: 300 });
    },
    // Gambler — ivory dice. The roll starts: a bright tumbling clatter.
    wildcard() {
      tone(520, 0.10, 'square', 0.10, { glideTo: 820 });
      noise(0.06, 0.10, 'bandpass', 2500);
    },

    // ----- windup textures (charged abilities) -----------------------------

    // Priest — holy resonance. Warm rising charge toward the bell release.
    chargeUp() {
      tone(440, 0.42, 'sine', 0.09, { glideTo: 1320, attack: 0.25 });
      tone(880, 0.42, 'sine', 0.04, { glideTo: 2640, attack: 0.25 });
    },
    // Cannoneer — iron + gunpowder. Low rising rumble that tightens to the boom.
    chargeBig() {
      tone(60, 0.90, 'sawtooth', 0.10, { glideTo: 200, attack: 0.5 });
      noise(0.90, 0.05, 'lowpass', 200, { filterGlideTo: 520 });
    },
    // Ronin — fine drawn steel. A single rising tension hum, clean and quiet.
    iai() {
      tone(1200, 0.50, 'sine', 0.08, { glideTo: 2400, attack: 0.30 });
    },

    // ----- release / strike beats for charged + channel abilities ----------

    // Priest lightning bolt — a warm golden bell with a bright leading crack.
    lightning() {
      noise(0.07, 0.12, 'highpass', 3000);
      tone(1320, 0.30, 'sine', 0.14, { glideTo: 660 });
      tone(1980, 0.30, 'sine', 0.06, { glideTo: 990 });
    },
    // Cannoneer shot — a massive concussive boom: hard crack + deep sub.
    cannon() {
      noise(0.05, 0.32, 'highpass', 2000);
      noise(0.40, 0.50, 'lowpass', 800, { filterGlideTo: 70 });
      tone(90, 0.45, 'square', 0.35, { glideTo: 36 });
    },
    // Ronin iai cut — a thin whisper-crack and a single clean note.
    iaiStrike() {
      noise(0.06, 0.22, 'highpass', 5000, { filterGlideTo: 2000 });
      tone(2600, 0.14, 'sine', 0.11, { glideTo: 1800 });
    },
    // Warlock drain beam — void absorption: low sub-bass, no bright content.
    // Sustained across the 1.2s channel (the one held sound, by design).
    drain() {
      tone(70, 1.2, 'sine', 0.10, { glideTo: 110, attack: 0.10 });
      tone(160, 1.2, 'sawtooth', 0.05, { glideTo: 130 });
      noise(1.2, 0.03, 'lowpass', 400);
    },

    // ----- Gambler sub-sounds ----------------------------------------------

    // Die settles on its face — a hard ivory clack.
    diceLand() {
      noise(0.06, 0.16, 'bandpass', 2200);
      tone(200, 0.07, 'square', 0.14, { glideTo: 110 });
    },
    // High roll (5-6) — the clack plus a bright rising sparkle (lucky).
    diceLandBig() {
      noise(0.06, 0.16, 'bandpass', 2400);
      tone(200, 0.08, 'square', 0.16, { glideTo: 110 });
      tone(900, 0.22, 'triangle', 0.12, { glideTo: 1800 });
    },
    // A thrown coin — bright metallic ting with a quick upward flip.
    coinThrow() {
      tone(1600, 0.10, 'triangle', 0.09, { glideTo: 2200 });
      tone(2400, 0.06, 'sine', 0.04);
    },

    // ----- Hunter reel ------------------------------------------------------

    // The hook lands and reels — a hard cable clink with a low pulling tug.
    yank() {
      tone(200, 0.16, 'square', 0.16, { glideTo: 480 });
      noise(0.08, 0.16, 'bandpass', 2400);
    },

    // ===== Reactions ========================================================

    // Duelist parry — the brightest, cleanest steel deflection in the game.
    parry() {
      tone(2800, 0.16, 'triangle', 0.20, { glideTo: 1700 });
      tone(3600, 0.10, 'sine', 0.10);
    },
    // Duelist counter-thrust — a sharp steel reply, smaller than the parry.
    counter() {
      tone(2000, 0.10, 'triangle', 0.14, { glideTo: 1200 });
      noise(0.06, 0.10, 'bandpass', 3000);
    },
    // Jester dodge — a hollow ceramic whiff as the hit phases through.
    negate() {
      noise(0.14, 0.14, 'highpass', 2000, { filterGlideTo: 5000 });
      tone(1400, 0.08, 'sine', 0.05, { glideTo: 2200 });
    },
    // Heal cue — a warm, faintly wet restorative pulse (Priest DIVINE GRACE,
    // Warlock leech). Reaper no longer heals (HARVEST is now an execute, not lifesteal).
    heal() {
      tone(440, 0.20, 'sine', 0.10, { glideTo: 660 });
      noise(0.10, 0.05, 'lowpass', 800);
    },
    // Knight Plate Armor — a dull heavy steel deflect as plate eats the blow.
    // Ring-less (a clank, not a clean tone); sits under the attacker's crack.
    armor() {
      noise(0.05, 0.16, 'bandpass', 1200);
      tone(220, 0.12, 'triangle', 0.12, { glideTo: 150 });
    },
    // Wizard Mana Shield — a glassy arcane absorb as an orb spends itself out.
    shield() {
      tone(1400, 0.16, 'sine', 0.12, { glideTo: 700 });
      tone(2100, 0.16, 'sine', 0.06, { glideTo: 1000 });
      noise(0.03, 0.05, 'highpass', 5000);
    },
    // Berserker Bloodrage kicking in (drops below 50% hp) — a rising primal
    // growl. Fires once on the inactive->active transition, not per frame.
    bloodrage() {
      tone(80, 0.50, 'sawtooth', 0.16, { glideTo: 165, attack: 0.15 });
      tone(120, 0.50, 'square', 0.08, { glideTo: 90 });
      noise(0.40, 0.10, 'lowpass', 400, { filterGlideTo: 900 });
    },

    // ===== Impacts ==========================================================

    // Melee body-contact crack — routed by the attacker's material. Only the
    // dashers (Berserker/Knight/Duelist/Reaper) land a crack here: they swing
    // at launch and connect a beat later, so the crack is the second beat.
    // Jester (mask-snap) and Ronin (iai cut) already sound their own contact,
    // so they no-op here. The crack is the short, loud beat; volume tracks dmg.
    hit(arg) {
      const obj = (arg && typeof arg === 'object');
      const mag = obj ? arg.mag : arg;
      const mat = obj ? arg.mat : null;
      const v = 0.18 + Math.min(1, (mag || 10) / 26) * 0.18;
      if (mat === 'tackle') {            // Berserker — wet flesh thud
        noise(0.06, v, 'lowpass', 520);
        tone(95, 0.10, 'triangle', v, { glideTo: 46 });
      } else if (mat === 'sword') {      // Knight — flat heavy steel bash
        noise(0.05, v, 'bandpass', 1400);
        tone(280, 0.13, 'triangle', v * 0.9, { glideTo: 200 });
      } else if (mat === 'riposte') {    // Duelist — thin sharp puncture
        noise(0.04, v, 'bandpass', 3800);
        tone(1800, 0.08, 'triangle', v * 0.8, { glideTo: 1100 });
      } else if (mat === 'sweep') {      // Reaper — dry bone arc crack
        noise(0.08, v, 'bandpass', 1200, { filterGlideTo: 600 });
        tone(240, 0.10, 'triangle', v * 0.85, { glideTo: 120 });
      }
    },
    // Projectile / trap / minion impact crack — the audio mirror of the visual
    // force-shape (spawnImpact). One primitive per kind; volume scales with the
    // `big` (0..1 magnitude) the impact was spawned with.
    impact(arg) {
      const kind = arg && arg.kind;
      const big = arg ? (arg.big == null ? 0.5 : arg.big) : 0.5;
      const v = 0.14 + big * 0.22;
      switch (kind) {
        case 'arrow':       // wood puncture — thin sharp thunk
          noise(0.05, v, 'bandpass', 2600);
          tone(700, 0.08, 'triangle', v * 0.7, { glideTo: 400 });
          break;
        case 'cannon':      // iron cannonball — heavy concussion
          noise(0.12, v, 'lowpass', 900, { filterGlideTo: 120 });
          tone(110, 0.16, 'square', v, { glideTo: 45 });
          break;
        case 'hex':         // toxic splat — wet dissonant
          noise(0.10, v, 'lowpass', 1200);
          tone(380, 0.12, 'sawtooth', v * 0.8, { glideTo: 220 });
          break;
        case 'coin':        // gold ding — bright and tiny
          tone(2000, 0.10, 'sine', v, { glideTo: 1300 });
          noise(0.03, v * 0.5, 'bandpass', 3500);
          break;
        case 'orb':         // arcane rune-pop — glassy
          tone(1100, 0.10, 'sine', v, { glideTo: 1800 });
          noise(0.03, v * 0.4, 'highpass', 5000);
          break;
        case 'lightning':   // holy zap — electric crackle
          noise(0.06, v, 'highpass', 4000);
          tone(900, 0.10, 'sawtooth', v * 0.8, { glideTo: 300 });
          break;
        case 'hook':        // steel cable — metallic bite clink
          noise(0.05, v, 'bandpass', 2200);
          tone(320, 0.08, 'square', v, { glideTo: 180 });
          break;
        case 'bone':        // bone shards — dry clack
          noise(0.08, v, 'bandpass', 1800, { filterGlideTo: 400 });
          tone(200, 0.10, 'triangle', v * 0.85, { glideTo: 90 });
          break;
        case 'mine':        // dark metal casing — sharp crack + pressure
          noise(0.30, v, 'lowpass', 1200, { filterGlideTo: 90 });
          tone(110, 0.30, 'square', v, { glideTo: 40 });
          noise(0.08, v * 0.8, 'bandpass', 3500);
          break;
      }
    },
    // Cannoneer INCENDIARY burn tick — a soft fire crackle each 0.2s tick. Low
    // and short on purpose: the ~5-tick burst should read as a sizzle, never a
    // sharp crack machine-gunning (that's why DoT ticks normally stay quiet).
    burn() {
      noise(0.08, 0.09, 'highpass', 2400, { filterGlideTo: 3600 });
      noise(0.05, 0.05, 'bandpass', 1200);
    },

    // ===== Arena ============================================================

    // Wall bounce — a universal stone thud. Short, recedes under everything.
    // Self-throttled so corner jitter (rapid x/y re-bounces) can't stutter it.
    wall() {
      const c = ac(); if (!c) return;
      if (c.currentTime - _lastWallT < 0.08) return;
      _lastWallT = c.currentTime;
      noise(0.13, 0.24, 'lowpass', 500, { filterGlideTo: 90 });
      tone(90, 0.12, 'square', 0.15, { glideTo: 44 });
    },
    // Fighter collision — a nearly inaudible dry click. Self-throttled so an
    // overlap that spans several frames can't machine-gun into a buzz.
    contact() {
      const c = ac(); if (!c) return;
      if (c.currentTime - _lastContactT < 0.08) return;
      _lastContactT = c.currentTime;
      noise(0.05, 0.06, 'lowpass', 420);
    },

    // ===== Lifecycle ========================================================

    // Skeleton death burst — dry Necromancer bone shatter (caught an enemy).
    boneBurst() {
      noise(0.18, 0.36, 'bandpass', 2000, { filterGlideTo: 280 });
      tone(130, 0.22, 'sawtooth', 0.14, { glideTo: 48 });
    },
    // Skeleton dying with no one nearby — a softer, dry bone collapse.
    boneCrumble() {
      noise(0.14, 0.18, 'bandpass', 1500, { filterGlideTo: 400 });
      tone(150, 0.16, 'triangle', 0.08, { glideTo: 60 });
    },
    // The closing ring begins — a single low ominous swell as the fog moves in.
    // One-shot event marker (fires once at RING_START), not an ambient bed.
    ringClose() {
      tone(120, 0.70, 'sawtooth', 0.16, { glideTo: 90, attack: 0.25 });
      tone(60, 0.70, 'sine', 0.10, { glideTo: 50 });
      noise(0.70, 0.05, 'lowpass', 300, { filterGlideTo: 650 });
    },

    // Per-fighter death voice — routed by archetype (AUDIO.md). Death is the
    // ceiling: the archetype voice is bigger than the fighter's own material.
    death(ability) {
      if (ability === 'tackle' || ability === 'cannon' || ability === 'mine') {
        // BURST — low concussive boom + shockwave sub-bass pressure release.
        noise(0.50, 0.40, 'lowpass', 1400, { filterGlideTo: 70 });
        tone(120, 0.50, 'sawtooth', 0.28, { glideTo: 40 });
        tone(55, 0.55, 'sine', 0.22, { glideTo: 30 });
      } else if (ability === 'sword' || ability === 'riposte' || ability === 'blink'
              || ability === 'grapple' || ability === 'wildcard') {
        // SHATTER — high crack into cascading bright fragments.
        noise(0.06, 0.30, 'bandpass', 4000);
        noise(0.40, 0.20, 'bandpass', 3000, { filterGlideTo: 600 });
        [1600, 2100, 1300].forEach((fr, i) =>
          setTimeout(() => tone(fr, 0.12, 'triangle', 0.08, { glideTo: fr * 0.7 }), i * 55));
      } else if (ability === 'lightning' || ability === 'cast' || ability === 'hex'
              || ability === 'drain') {
        if (ability === 'drain') {
          // DISSOLVE (Warlock) — void implodes inward, descending into sub-bass.
          tone(200, 0.70, 'sine', 0.18, { glideTo: 40, attack: 0.20 });
          tone(120, 0.70, 'sawtooth', 0.08, { glideTo: 30, attack: 0.20 });
        } else {
          // DISSOLVE — soft ascending swell, no hard transient.
          tone(440, 0.60, 'sine', 0.16, { glideTo: 1320, attack: 0.30 });
          tone(660, 0.60, 'sine', 0.10, { glideTo: 1980, attack: 0.30 });
        }
      } else if (ability === 'raise' || ability === 'sweep') {
        // COLLAPSE — heavy thud + hollow settling. Reaper adds a wet resonance.
        noise(0.30, 0.32, 'lowpass', 900, { filterGlideTo: 100 });
        tone(150, 0.40, 'triangle', 0.18, { glideTo: 50 });
        noise(0.30, 0.12, 'bandpass', 1400, { filterGlideTo: 500 });
        if (ability === 'sweep') tone(300, 0.40, 'sine', 0.08, { glideTo: 120 });
      } else if (ability === 'iai') {
        // CUT — a single clean whisper-crack, held then fading to silence.
        noise(0.50, 0.20, 'highpass', 4000, { filterGlideTo: 2500 });
        tone(2400, 0.50, 'sine', 0.10, { glideTo: 1600 });
      } else if (ability === 'arrow') {
        // SCATTER — bowstring snap + 6 staggered light impacts raining down.
        noise(0.06, 0.26, 'bandpass', 3000);
        [1400, 1100, 1600, 900, 1300, 1000].forEach((fr, i) =>
          setTimeout(() => { tone(fr, 0.10, 'triangle', 0.08); noise(0.05, 0.07, 'bandpass', 2500); }, i * 70));
      } else {
        // Fallback — generic heavy death.
        noise(0.50, 0.40, 'lowpass', 1200, { filterGlideTo: 80 });
        tone(300, 0.50, 'sawtooth', 0.20, { glideTo: 50 });
      }
    },

    // K.O. boom — the ceiling. Still the loudest single sound, but trimmed so it
    // doesn't pin the limiter when it stacks with the killing blow + death voice
    // (every KO fires all three on one frame). See the mix analysis.
    koHit() {
      noise(0.40, 0.40, 'lowpass', 1600, { filterGlideTo: 55 });
      tone(140, 0.50, 'square', 0.30, { glideTo: 34 });
      tone(65, 0.55, 'sine', 0.24, { glideTo: 28 });
    },

    // ===== UI ===============================================================
    select() { tone(700, 0.08, 'sine', 0.16, { glideTo: 1000 }); },
    start() {
      tone(440, 0.14, 'square', 0.16, { glideTo: 660, exact: true });
      setTimeout(() => tone(880, 0.18, 'square', 0.16, { exact: true }), 130);
    },
    win() {
      [523, 659, 784, 1046].forEach((f, i) =>
        setTimeout(() => tone(f, 0.30, 'triangle', 0.20, { exact: true }), i * 110));
    },
  };

  return {
    // play(name, arg, x) — optional x is an arena x-coordinate (0..arenaW);
    // it's converted to a stereo pan so the sound comes from where it happened.
    play(name, arg, x) {
      if (muted) return;
      const fn = SOUNDS[name];
      if (!fn) return;
      _curPan = (x == null || !_arenaW) ? null
              : Math.max(-1, Math.min(1, (x / _arenaW) * 2 - 1)) * 0.7;
      try { fn(arg); } catch (e) {}
      _curPan = null;
    },
    setArenaWidth(w) { _arenaW = w; },
    isMuted() { return muted; },
    toggle() {
      muted = !muted;
      if (!muted) ac(); // unlock context on un-mute
      return muted;
    },
  };
})();
function sfx(name, arg, x) { if (headless) return; Audio.play(name, arg, x); }
