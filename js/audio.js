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
      limiter.attack.setValueAtTime(0.003, c.currentTime);
      limiter.release.setValueAtTime(0.12, c.currentTime);
      _master.connect(limiter);
      limiter.connect(c.destination);
    }
    return _master;
  }

  // --- sound definitions ----------------------------------------------------
  // Each entry is a function that builds one sound effect.
  const SOUNDS = {
    // Generic body-contact tick — soft and low so it doesn't dominate.
    contact() { noise(0.07, 0.12, 'lowpass', 380); },
    // A damaging hit. Punchier; pitch nudges up with bigger hits.
    hit(mag) {
      const m = mag || 10;
      noise(0.10, 0.30, 'lowpass', 600 + m * 14);
      tone(90 + m * 2, 0.12, 'triangle', 0.22, { glideTo: 50 });
    },
    // --- ability casts (one per archetype) ---
    lightning() { tone(1400, 0.18, 'sawtooth', 0.18, { glideTo: 320 }); noise(0.12, 0.12, 'highpass', 2000); },
    tackle()    { noise(0.22, 0.30, 'lowpass', 900, { filterGlideTo: 200 }); tone(160, 0.2, 'square', 0.16, { glideTo: 70 }); },
    cast()      { tone(520, 0.22, 'sine', 0.16, { glideTo: 880 }); tone(780, 0.22, 'sine', 0.10, { glideTo: 1320 }); },
    sword()     { noise(0.16, 0.26, 'bandpass', 2600); tone(420, 0.12, 'triangle', 0.12, { glideTo: 220 }); },
    mine()      { tone(880, 0.08, 'square', 0.16); tone(1240, 0.06, 'square', 0.10, { attack: 0.04 }); },
    arrow()     { noise(0.09, 0.16, 'bandpass', 3200); tone(900, 0.07, 'triangle', 0.10, { glideTo: 1500 }); },
    blink()     { tone(1600, 0.14, 'sine', 0.14, { glideTo: 400 }); tone(400, 0.14, 'sine', 0.10, { glideTo: 1600 }); },
    cannon()    { noise(0.4, 0.5, 'lowpass', 700, { filterGlideTo: 90 }); tone(120, 0.4, 'square', 0.3, { glideTo: 40 }); },
    riposte()   { tone(1800, 0.1, 'triangle', 0.12, { glideTo: 900 }); noise(0.1, 0.18, 'bandpass', 4000); },
    scythe()    { tone(300, 0.3, 'sawtooth', 0.13, { glideTo: 120 }); noise(0.18, 0.12, 'lowpass', 500); },
    sweep()     { noise(0.26, 0.28, 'bandpass', 1800, { filterGlideTo: 600 }); tone(360, 0.22, 'triangle', 0.12, { glideTo: 180 }); },
    iai()       { tone(1500, 0.5, 'sine', 0.10, { glideTo: 3000, attack: 0.3 }); }, // rising tension hum
    // Wind-up telegraphs — a rising charge that builds into the release sound.
    chargeUp()  { tone(400, 0.42, 'triangle', 0.09, { glideTo: 1500, attack: 0.2 }); }, // Priest lightning charge
    chargeBig() { tone(70, 0.95, 'sawtooth', 0.10, { glideTo: 240, attack: 0.5 }); noise(0.95, 0.06, 'lowpass', 200, { filterGlideTo: 600 }); }, // Cannoneer cannon charge
    iaiStrike() { noise(0.14, 0.36, 'bandpass', 3400); tone(700, 0.14, 'triangle', 0.18, { glideTo: 200 }); },
    hex()       { tone(620, 0.26, 'sawtooth', 0.13, { glideTo: 380 }); tone(930, 0.26, 'sine', 0.07, { glideTo: 570 }); },
    grapple()   { noise(0.16, 0.2, 'bandpass', 1400); tone(240, 0.16, 'square', 0.12, { glideTo: 520 }); },
    yank()      { tone(200, 0.18, 'square', 0.18, { glideTo: 520 }); noise(0.14, 0.18, 'lowpass', 900); },
    drain()     { tone(180, 1.2, 'sawtooth', 0.09, { glideTo: 300, attack: 0.08 }); tone(540, 1.2, 'sine', 0.05, { glideTo: 700 }); noise(1.2, 0.04, 'bandpass', 1200); }, // sustained leech beam, spans the 1.2s channel
    wildcard()  { tone(330, 0.12, 'square', 0.12, { glideTo: 660 }); tone(495, 0.14, 'square', 0.10, { glideTo: 990 }); },
    // Gambler die settling on its face — a short hard clack (dice on a table).
    diceLand()  { noise(0.07, 0.16, 'bandpass', 2200); tone(180, 0.08, 'square', 0.16, { glideTo: 90 }); },
    // High roll (5-6) — the clack plus a bright rising sparkle to signal luck.
    diceLandBig(){ noise(0.08, 0.18, 'bandpass', 2400); tone(200, 0.09, 'square', 0.18, { glideTo: 100 }); tone(900, 0.22, 'triangle', 0.12, { glideTo: 1700 }); },
    // A thrown coin — a light, bright metallic ting with a quick upward flip.
    coinThrow() { tone(1300, 0.1, 'triangle', 0.09, { glideTo: 1900 }); tone(2000, 0.07, 'sine', 0.05); },
    // --- reactions ---
    parry()     { tone(2600, 0.16, 'triangle', 0.22, { glideTo: 1600 }); tone(3300, 0.12, 'sine', 0.12); },
    counter()   { tone(1900, 0.09, 'triangle', 0.16, { glideTo: 1100 }); noise(0.07, 0.10, 'bandpass', 2800); },
    negate()    { noise(0.14, 0.16, 'highpass', 1800, { filterGlideTo: 5000 }); }, // soft whiff
    heal()      { tone(560, 0.22, 'sine', 0.12, { glideTo: 840 }); },
    // --- lifecycle ---
    boneBurst() { noise(0.18, 0.38, 'bandpass', 2000, { filterGlideTo: 280 }); tone(130, 0.22, 'sawtooth', 0.14, { glideTo: 48 }); },
    death()     { noise(0.5, 0.4, 'lowpass', 1200, { filterGlideTo: 80 }); tone(300, 0.5, 'sawtooth', 0.2, { glideTo: 50 }); },
    koHit()     { noise(0.35, 0.55, 'lowpass', 1600, { filterGlideTo: 60 }); tone(150, 0.45, 'square', 0.4, { glideTo: 38 }); tone(70, 0.5, 'sine', 0.3, { glideTo: 30 }); },
    select()    { tone(700, 0.08, 'sine', 0.18, { glideTo: 1000 }); },
    start()     { tone(440, 0.14, 'square', 0.16, { glideTo: 660, exact: true }); setTimeout(() => tone(880, 0.18, 'square', 0.16, { exact: true }), 130); },
    win()       {
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.2, { exact: true }), i * 110));
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
