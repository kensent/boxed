// ============================================================================
// === RECORD =================================================================
// In-app fight recorder. The fight canvas is the sole renderer of the whole
// 9:16 screen (HP band + arena + VS intro — see render/arena.js), so capturing
// the canvas yields an upload-ready vertical video that is pixel-for-pixel what
// you see on screen. No offscreen compositing needed: we just grab a stream off
// the live canvas + the game audio and mux them into a .webm.
//
// Workflow: arm the REC button, then every fight you start is captured from the
// VS intro through the finish window and downloaded as a .webm. Tapping out of a
// fight early discards that take. While armed, resizeCanvas (engine.js) renders
// the canvas at >= REC_W backing px so the capture is crisp on any display.
//
// Balance-safe: never touches rng/vrng or the sim, and it's browser-only — not
// in SIM_FILES, so the headless harness never loads it. engine.js calls in
// through `typeof Recorder !== 'undefined'` guards.
// ============================================================================
const Recorder = (() => {
  // Capture quality. Two things fight YouTube Shorts blur:
  //  1. Upload resolution. YouTube re-encodes everything; a 1080p upload gets a
  //     softer AVC transcode, while >= 1440p uploads get the better VP9 tier —
  //     so even the 1080p playback stream comes out crisper. We capture at 2160
  //     wide (4K vertical, 2160×3840), resizeCanvas boosts the canvas backing
  //     to at least REC_W.
  //  2. Source bitrate. The arena grid + faceted sprites are detail-heavy and
  //     smear at low bitrate, so we hand the encoder plenty (40 Mbps for 4K).
  // NOTE: 4K60 VP9 is encoded in-browser (mostly software) — a weaker machine
  // may drop frames (stutter). If so, drop REC_FPS to 30 to free encode
  // headroom, or step REC_W back to 1440.
  const REC_W = 2160;          // capture width (px); canvas height follows 9:16
  const REC_FPS = 60;
  const REC_BITRATE = 40e6;    // video bits/sec
  let armed = false;
  let recording = false;
  let recorder = null;
  let chunks = [];
  let mime = '';
  let meta = null;

  function supported() {
    return typeof window !== 'undefined'
      && typeof window.MediaRecorder !== 'undefined'
      && typeof HTMLCanvasElement !== 'undefined'
      && !!HTMLCanvasElement.prototype.captureStream;
  }

  function pickMime() {
    const cands = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    for (const m of cands) { try { if (MediaRecorder.isTypeSupported(m)) return m; } catch (e) {} }
    return '';
  }

  function setArmed(on) {
    armed = on;
    const btn = document.getElementById('rec-btn');
    if (btn) {
      btn.classList.toggle('armed', armed);
      btn.title = armed
        ? 'recorder ARMED — each fight downloads a .webm (click to disarm)'
        : 'arm fight recorder — captures each fight to a .webm download';
    }
  }

  // Called from startFight() just before the intro, so the reveal is captured.
  // Sets up a MediaRecorder over the live fight canvas + game audio and starts.
  function begin(redT, blueT) {
    if (!armed || recording) return;
    if (!supported()) {
      alert('In-app recording is not supported in this browser. Use desktop Chrome/Edge, or screen-record instead.');
      return;
    }
    let stream;
    try { stream = canvas.captureStream(REC_FPS); } catch (e) { return; }
    // Mux in the game audio (a tap off the master limiter — see audio.js).
    const audio = (typeof Audio !== 'undefined' && Audio.recStream) ? Audio.recStream() : null;
    if (audio) { try { audio.getAudioTracks().forEach(t => stream.addTrack(t)); } catch (e) {} }
    mime = pickMime();
    chunks = [];
    try {
      recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: REC_BITRATE } : undefined);
    } catch (e) { recorder = null; return; }
    recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    recorder.onstop = () => { save(); };
    meta = {
      red: redT.name, blue: blueT.name,
      seed: (typeof currentSeed !== 'undefined') ? currentSeed : 0,
    };
    try { recorder.start(); } catch (e) { recorder = null; return; }
    recording = true;
  }

  // Natural end of fight (loop hands off to returnToSelect) — stop + download.
  function finish() {
    if (!recording) return;
    recording = false;
    try { if (recorder && recorder.state !== 'inactive') recorder.stop(); } catch (e) {}
    // recorder.onstop → save()
  }

  // Manual exit mid-fight (tap outside the arena) — stop + discard the take.
  function abort() {
    if (!recording) return;
    recording = false;
    if (recorder) {
      recorder.onstop = null;   // suppress the download
      try { if (recorder.state !== 'inactive') recorder.stop(); } catch (e) {}
    }
    recorder = null;
    chunks = [];
  }

  function save() {
    const data = chunks;
    chunks = [];
    recorder = null;
    if (!data.length) return;
    const blob = new Blob(data, { type: mime || 'video/webm' });
    const url = URL.createObjectURL(blob);
    const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const a = document.createElement('a');
    a.href = url;
    a.download = `boxed_${slug(meta.red)}_vs_${slug(meta.blue)}_seed${meta.seed}.webm`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
  }

  const recBtn = document.getElementById('rec-btn');
  if (recBtn) recBtn.addEventListener('click', () => setArmed(!armed));

  return {
    REC_W,
    armed: () => armed,
    begin, finish, abort,
  };
})();
