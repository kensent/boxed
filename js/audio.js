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
  const SOUNDS = {};

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
