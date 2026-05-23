// ============================================================================
// === GAME: STATE & LIFECYCLE ================================================
// Canvas setup, game object, fighter instantiation, HP UI sync, main loop,
// arena bounce, distance helper. The game loop calls step() then draw().
// ============================================================================

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let game = null;
// Generation counter — each startFight bumps it. loop() captures its game's
// token and stops the moment a newer fight has begun, killing stale RAF chains.
let fightToken = 0;

// The simulation runs in a fixed ARENA×ARENA reference space, so a fight is
// device-independent (and the headless hunt reproduces exactly). The renderer
// scales this reference space to whatever the actual canvas size is.
// Shrunk from 360 to 300 (2026-05-23) to raise the connection rate for melee
// abilities under autonomous DVD movement — fighters meet ~45% more often per
// unit time, which lets dash/strike abilities reliably express their identity
// without giving them homing pursuit (which would break the bounce). Also feeds
// Berserker's ricochet count and Witch's hex bounce-relevance as side effects.
// Re-introduces the Knight design space (a melee tank can now actually connect).
const ARENA = 300;

// --- Camera ----------------------------------------------------------------
// During play the camera holds STATIC at the arena centre at zoom 1.0 — the
// whole 300x300 arena is always framed. Disabled the dynamic follow-cam after
// the arena shrink: a smaller arena already keeps both fighters comfortably
// inside a static frame, and the dynamic pan/zoom that mattered for the old
// 360 arena was now over-engineering. On the kill it becomes a KILL-CAM —
// pushing in on the loser's death position (CAM_KILL, tighter than 1.0) so
// the "K.O." frames the actual kill. The kill-cam smoothing time constants
// (CAM_PAN_TAU/CAM_ZOOM_TAU) drive the push-in animation when the winner
// resolves. Render-only — it reads fighter positions, but the sim never
// reads camera state back, so balance is untouched. Grid + border are drawn
// in-world (see drawArenaBackdrop) so they zoom with the camera on the kill.
const CAM_PAN_TAU = 0.06, CAM_ZOOM_TAU = 0.25, CAM_KILL = 1.7;
// Finish/kill-cam timing (real seconds): the body holds frozen until the kill-cam
// arrives (or KILLCAM_MAX_PUSH elapses, a fallback), then the death plays over a
// fixed DEATH_DUR — so every kill, melee or ranged, gets its full beat instead of
// racing the clock. FINISH_WINDOW is the total before the winner overlay.
const FINISH_WINDOW = 2.0, DEATH_DUR = 1.2, KILLCAM_MAX_PUSH = 0.8;
const camera = { x: ARENA / 2, y: ARENA / 2, zoom: 1, ready: false };
let pxPerRef = 1;          // device px per reference unit at zoom 1 (set in resizeCanvas)
let _camLastT = 0;

function resizeCanvas() {
  const r = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio;
  canvas.width = r.width * dpr;
  canvas.height = r.height * dpr;
  pxPerRef = (r.width / ARENA) * dpr;
  // draw() sets the live (camera) transform every frame; this is a sane default.
  ctx.setTransform(pxPerRef, 0, 0, pxPerRef, 0, 0);
}

// Update the camera target each drawn frame. During play the target is static
// (centre, zoom 1) so this is a no-op after the first frame; on the kill it
// becomes a smooth push-in onto the loser.
function updateCamera() {
  if (!game) return;
  const r = game.red, b = game.blue;
  let tx, ty, tz;
  if (game.winner) {
    // Kill-cam: push in on the loser's (frozen) death position so the K.O. frames
    // the actual kill regardless of where the winner ended up.
    const loser = game.winner === r ? b : r;
    tx = loser.x; ty = loser.y; tz = CAM_KILL;
  } else {
    // Live play: static at arena centre, zoom 1 (full 300x300 visible).
    tx = ARENA / 2; ty = ARENA / 2; tz = 1;
  }
  const now = performance.now();
  const dt = _camLastT ? Math.min(0.05, (now - _camLastT) / 1000) : 0;
  _camLastT = now;
  // Frame-rate independent smoothing via time constants; first frame snaps.
  const smooth = tau => (camera.ready ? 1 - Math.exp(-dt / tau) : 1);
  const panK = smooth(CAM_PAN_TAU), zoomK = smooth(CAM_ZOOM_TAU);
  camera.x += (tx - camera.x) * panK;
  camera.y += (ty - camera.y) * panK;
  camera.zoom += (tz - camera.zoom) * zoomK;
  camera.ready = true;
}

// Set ctx to camera space: ref units, zoomed, centred on (camera.x, camera.y).
function applyCamera() {
  const s = pxPerRef * camera.zoom;
  ctx.setTransform(s, 0, 0, s,
    canvas.width / 2 - s * camera.x,
    canvas.height / 2 - s * camera.y);
}
window.addEventListener('resize', resizeCanvas);

document.getElementById('fight-btn').addEventListener('click', startFight);
document.getElementById('restart-btn').addEventListener('click', startFight);

// --- Auto matchup picker --------------------------------------------------
// Picks a matchup of a chosen type from the embedded sim data and selects the
// two fighters — but does NOT start the fight. You see the odds, can re-roll,
// and hit FIGHT when ready.
//   coinflip — near 50/50 (spread <= 8): genuine nail-biters
//   stomp    — lopsided (spread >= 25): underdog / "can they survive" content
//   random   — any matchup at all
function autoPick(mode) {
  huntActive = false; // cancel any running upset-hunt
  let pool = allMatchups();
  if (mode === 'coinflip') pool = pool.filter(m => m.spread <= 8);
  else if (mode === 'stomp') pool = pool.filter(m => m.spread >= 25);
  // random uses the full pool. Guard: if a filter somehow empties, fall back.
  if (!pool.length) pool = allMatchups();
  const m = pool[Math.floor(Math.random() * pool.length)];
  // Randomize which side (red/blue) each fighter takes so it's not always
  // "stored-A on red". Visual variety only — sides don't affect balance.
  if (Math.random() < 0.5) { pickRed = m.a; pickBlue = m.b; }
  else { pickRed = m.b; pickBlue = m.a; }
  turn = 'red';
  sfx('select');
  updateUI();
}
document.querySelectorAll('.ap-btn[data-mode]').forEach(btn => {
  btn.addEventListener('click', () => autoPick(btn.dataset.mode));
});

// --- Matchup table overlay ------------------------------------------------
// A 16x16 grid of every matchup's win rate, from the embedded MATCHUPS data.
// Each cell shows the ROW fighter's win % vs the COLUMN fighter; tapping a
// cell selects that matchup and closes the overlay. Built once, lazily.
const mtableOverlay = document.getElementById('mtable-overlay');
let mtableBuilt = false;
function mtableCellColor(v) {
  // Green (row wins) -> dark grey (even) -> red (row loses).
  if (v >= 50) {
    const t = (v - 50) / 50;            // 0..1
    return 'rgb(' + Math.round(58 - t * 27) + ',' + Math.round(58 + t * 64) + ',' + Math.round(58 - t * 19) + ')';
  }
  const t = (50 - v) / 50;
  return 'rgb(' + Math.round(58 + t * 110) + ',' + Math.round(58 - t * 8) + ',' + Math.round(58 - t * 8) + ')';
}
function buildMatchupTable() {
  const ids = FIGHTERS.map(f => f.id);
  const abbr = id => id.slice(0, 3).toUpperCase();
  const grid = document.getElementById('mtable-grid');
  let html = '<thead><tr><th class="rowhead"></th>';
  ids.forEach(c => { html += '<th>' + abbr(c) + '</th>'; });
  html += '</tr></thead><tbody>';
  ids.forEach(r => {
    html += '<tr><th class="rowhead">' + abbr(r) + '</th>';
    ids.forEach(c => {
      if (r === c) { html += '<td class="diag">·</td>'; return; }
      const v = matchupOdds(r, c);
      html += '<td class="cell" data-r="' + r + '" data-c="' + c + '" '
            + 'style="background:' + mtableCellColor(v) + '">' + v + '</td>';
    });
    html += '</tr>';
  });
  html += '</tbody>';
  grid.innerHTML = html;
  // Ranked list — each fighter's average win rate across all 15 opponents.
  const ranked = ids.map(id => {
    let sum = 0;
    ids.forEach(o => { if (o !== id) sum += matchupOdds(id, o); });
    return { id, wr: Math.round(sum / (ids.length - 1) * 10) / 10 };
  }).sort((a, b) => b.wr - a.wr);
  // Bars are rescaled to the ACTUAL spread: every fighter sits near 50%, so a
  // raw 0-100% bar would make all 16 look identical. Instead the weakest maps
  // to a short bar and the strongest to a full bar — the real spread fills the
  // width. Colour is a bright green->red ramp across that same range so the
  // bars are readable (the grid's cell scale is near-grey at 50% — wrong here).
  const wrs = ranked.map(r => r.wr);
  const lo = Math.min(...wrs), hi = Math.max(...wrs);
  const span = (hi - lo) || 1;
  const rankBar = wr => {
    const t = (wr - lo) / span;                 // 0 (weakest) .. 1 (strongest)
    const width = 12 + t * 88;                  // 12%..100% — weakest still visible
    const r = Math.round(210 - t * 150);        // bright red -> bright green
    const g = Math.round(70 + t * 130);
    const b = 70;
    return { width, color: 'rgb(' + r + ',' + g + ',' + b + ')' };
  };
  const rankEl = document.getElementById('mrank-list');
  rankEl.innerHTML = ranked.map((r, i) => {
    const fr = FIGHTERS.find(f => f.id === r.id);
    const bar = rankBar(r.wr);
    return '<div class="mrank-row">'
      + '<span class="mrank-rank">' + (i + 1) + '</span>'
      + '<span class="mrank-name">' + fr.name + '</span>'
      + '<span class="mrank-bar"><span class="mrank-fill" style="width:'
        + bar.width.toFixed(1) + '%;background:' + bar.color + '"></span></span>'
      + '<span class="mrank-pct">' + r.wr.toFixed(1) + '%</span>'
      + '</div>';
  }).join('');
  // One delegated listener — tap a cell to pick that matchup.
  grid.addEventListener('click', e => {
    const td = e.target.closest('td.cell');
    if (!td) return;
    pickRed = td.dataset.r;
    pickBlue = td.dataset.c;
    turn = 'red';
    mtableOverlay.classList.remove('show');
    sfx('select');
    updateUI();
  });
  mtableBuilt = true;
}
document.getElementById('ap-table').addEventListener('click', () => {
  if (!mtableBuilt) buildMatchupTable();
  mtableOverlay.classList.add('show');
});
document.getElementById('mtable-close').addEventListener('click', () => {
  mtableOverlay.classList.remove('show');
});

// --- Sprite gallery -------------------------------------------------------
// A 4x4 grid of every fighter's sprite, drawn through the real drawShape path
// (same as the VS intro) so the audit shows exactly what the game renders.
// Tap a cell to spin that sprite — rotation exposes the "no real forward axis"
// sprites (flask, hat) that look fine upright but tip when aiming.
const spriteOverlay = document.getElementById('sprite-overlay');
let spriteAnimRunning = false;
const spinningSprites = new Set();   // ids currently rotating

function drawGallerySprite(canvas, t, angle) {
  const c = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== 64 * dpr) { canvas.width = 64 * dpr; canvas.height = 64 * dpr; }
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, 64, 64);
  const spriteF = { size: 16, color: t.color, accent: t.accent, shape: t.shape,
                    facing: angle, team: 'red' };
  c.save();
  c.translate(32, 32);
  if (angle) c.rotate(angle);
  c.fillStyle = spriteF.color;
  drawShape(c, spriteF);
  c.restore();
}

function spriteGalleryLoop() {
  if (!spriteOverlay.classList.contains('show')) { spriteAnimRunning = false; return; }
  if (spinningSprites.size > 0) {
    const angle = (performance.now() / 1000) % (Math.PI * 2);
    spinningSprites.forEach(id => {
      const cv = document.querySelector('.sprite-cell[data-id="' + id + '"] canvas');
      if (cv) drawGallerySprite(cv, FIGHTERS.find(f => f.id === id), angle);
    });
  }
  requestAnimationFrame(spriteGalleryLoop);
}

function buildSpriteGallery() {
  const grid = document.getElementById('sprite-grid');
  grid.innerHTML = '';
  FIGHTERS.forEach(t => {
    const cell = document.createElement('div');
    cell.className = 'sprite-cell';
    cell.dataset.id = t.id;
    const cv = document.createElement('canvas');
    const label = document.createElement('span');
    label.textContent = t.name;
    cell.appendChild(cv);
    cell.appendChild(label);
    grid.appendChild(cell);
    drawGallerySprite(cv, t, 0);
    // Tap toggles rotation for this sprite (audit its behavior when aiming).
    cell.addEventListener('click', () => {
      if (spinningSprites.has(t.id)) {
        spinningSprites.delete(t.id);
        cell.classList.remove('spinning');
        drawGallerySprite(cv, t, 0);   // snap back to upright
      } else {
        spinningSprites.add(t.id);
        cell.classList.add('spinning');
        if (!spriteAnimRunning) { spriteAnimRunning = true; spriteGalleryLoop(); }
      }
    });
  });
}

document.getElementById('ap-sprites').addEventListener('click', () => {
  // Rebuild every open — cheap (16 small canvases) and ensures the gallery
  // always reflects the current sprite code. As an audit tool it must never
  // show a stale render.
  buildSpriteGallery();
  spriteOverlay.classList.add('show');
});
document.getElementById('sprite-close').addEventListener('click', () => {
  spriteOverlay.classList.remove('show');
  spinningSprites.clear();
  // Reset every cell to upright so reopening starts clean.
  document.querySelectorAll('.sprite-cell').forEach(cell => {
    cell.classList.remove('spinning');
    const cv = cell.querySelector('canvas');
    if (cv) drawGallerySprite(cv, FIGHTERS.find(f => f.id === cell.dataset.id), 0);
  });
});


// --- Seed control ---------------------------------------------------------
// Typing a number pins that seed for the next fight; empty = fresh random
// each fight. After a fight starts, the input shows the seed actually used
// (so you can note a good one) — and that pins it, so RESTART replays the
// exact same fight. The ↻ button clears the pin back to random.
const seedInput = document.getElementById('seed-input');
seedInput.addEventListener('input', () => {
  const v = seedInput.value.replace(/[^0-9]/g, '');
  if (v !== seedInput.value) seedInput.value = v; // digits only
  pendingSeed = v === '' ? null : (parseInt(v, 10) >>> 0);
});
document.getElementById('seed-clear').addEventListener('click', () => {
  seedInput.value = '';
  pendingSeed = null;
  seedInput.focus();
});
// syncSeedDisplay() — after a fight is seeded, reflect it in the input.
function syncSeedDisplay() {
  seedInput.value = String(currentSeed);
  pendingSeed = currentSeed; // pin it so RESTART reproduces this fight
}

// --- Upset hunt -----------------------------------------------------------
// Searches random seeds (running the fight headless) until it finds one where
// the underdog wins, then pins that seed. Hit FIGHT to watch the upset.
// The search runs in small chunks, yielding to the browser between each so
// the page stays responsive and shows progress. Tapping again cancels.
const huntBtn = document.getElementById('hunt-btn');
const HUNT_CHUNK = 150;   // fights per chunk before yielding (~0.5s of work)
const HUNT_MAX = 8000;    // overall search budget — generous; chunked yielding
                          // means a long/hopeless hunt no longer freezes the
                          // page, so the cap can be high without a freeze tax.

huntBtn.addEventListener('click', async () => {
  // Second tap while hunting = cancel.
  if (huntActive) { huntActive = false; return; }
  const wantId = huntBtn.dataset.underdog;
  if (!wantId || !pickRed || !pickBlue) return;
  const under = FIGHTERS.find(f => f.id === wantId);
  huntActive = true;
  let found = null, total = 0;
  while (huntActive && !found && total < HUNT_MAX) {
    found = huntUpset(pickRed, pickBlue, wantId, HUNT_CHUNK);
    total += HUNT_CHUNK;
    if (found) break;
    // Show progress, then yield a frame so the label paints and taps register.
    huntBtn.textContent = 'HUNTING… ' + total + '  (tap to cancel)';
    await new Promise(r => requestAnimationFrame(r));
  }
  const wasCancelled = !huntActive && !found;
  huntActive = false;
  if (found) {
    seedInput.value = String(found.seed);
    pendingSeed = found.seed;
    huntBtn.textContent = 'FOUND — ' + under.name + ' WINS · TAP FIGHT';
  } else if (wasCancelled) {
    huntBtn.textContent = 'HUNT CANCELLED';
    setTimeout(updateUI, 1500); // restore the normal label
  } else {
    huntBtn.textContent = 'NO UPSET IN ' + HUNT_MAX + ' TRIES';
    setTimeout(updateUI, 2500);
  }
});

const huntTightBtn = document.getElementById('hunt-tight-btn');
huntTightBtn.addEventListener('click', async () => {
  // Second tap while hunting = cancel.
  if (huntActive) { huntActive = false; return; }
  if (!pickRed || !pickBlue) return;
  huntActive = true;
  let result = { found: false, best: null }, total = 0;
  while (huntActive && !result.found && total < HUNT_MAX) {
    result = huntTight(pickRed, pickBlue, HUNT_CHUNK, result.best);
    total += HUNT_CHUNK;
    if (result.found) break;
    huntTightBtn.textContent = 'HUNTING… ' + total + '  (tap to cancel)';
    await new Promise(r => requestAnimationFrame(r));
  }
  const wasCancelled = !huntActive && !result.found;
  huntActive = false;
  // result.best is always the closest fight seen — and when found, it IS the
  // tight one. Use it directly.
  const pick = (result.best && !wasCancelled) ? result.best : null;
  if (pick) {
    seedInput.value = String(pick.seed);
    pendingSeed = pick.seed;
    const wf = FIGHTERS.find(f => f.id === pick.winId);
    const tag = result.found ? 'TIGHT' : 'CLOSEST';
    // e.g. "TIGHT — KNIGHT WINS ON 14 HP (vs 25 dmg) · TAP FIGHT"
    huntTightBtn.textContent = tag + ' — ' + wf.name + ' WINS ON '
      + Math.round(pick.winnerHp) + ' HP (vs ' + pick.loserDmg + ' DMG) · TAP FIGHT';
  } else if (wasCancelled) {
    huntTightBtn.textContent = 'HUNT CANCELLED';
    setTimeout(updateUI, 1500);
  } else {
    huntTightBtn.textContent = 'NO TIGHT FIGHT FOUND';
    setTimeout(updateUI, 2500);
  }
});

const huntLowHpBtn = document.getElementById('hunt-low-hp-btn');
huntLowHpBtn.addEventListener('click', async () => {
  // Second tap while hunting = cancel.
  if (huntActive) { huntActive = false; return; }
  if (!pickRed || !pickBlue) return;
  huntActive = true;
  let result = { found: false, best: null }, total = 0;
  while (huntActive && !result.found && total < HUNT_MAX) {
    result = huntCloseFinish(pickRed, pickBlue, HUNT_CHUNK, result.best);
    total += HUNT_CHUNK;
    if (result.found) break;
    huntLowHpBtn.textContent = 'HUNTING… ' + total + '  (tap to cancel)';
    await new Promise(r => requestAnimationFrame(r));
  }
  const wasCancelled = !huntActive && !result.found;
  huntActive = false;
  // result.best is always the lowest-HP-% fight seen — and when found, it IS
  // the < CLOSE_FINISH_HP_FRAC one. Use it directly.
  const pick = (result.best && !wasCancelled) ? result.best : null;
  if (pick) {
    seedInput.value = String(pick.seed);
    pendingSeed = pick.seed;
    const wf = FIGHTERS.find(f => f.id === pick.winId);
    const tag = result.found ? 'CLOSE' : 'CLOSEST';
    const pctTxt = Math.round(pick.pct * 100);
    // e.g. "CLOSE — JESTER WINS ON 18% HP (140/750) · TAP FIGHT"
    huntLowHpBtn.textContent = tag + ' — ' + wf.name + ' WINS ON '
      + pctTxt + '% HP (' + Math.round(pick.winnerHp) + '/' + pick.winnerMax + ') · TAP FIGHT';
  } else if (wasCancelled) {
    huntLowHpBtn.textContent = 'HUNT CANCELLED';
    setTimeout(updateUI, 1500);
  } else {
    huntLowHpBtn.textContent = 'NO CLOSE FINISH FOUND';
    setTimeout(updateUI, 2500);
  }
});

const muteBtn = document.getElementById('mute-btn');
muteBtn.addEventListener('click', () => {
  const nowMuted = Audio.toggle();
  muteBtn.textContent = nowMuted ? 'SOUND: OFF' : 'SOUND: ON';
  muteBtn.classList.toggle('on', !nowMuted);
  if (!nowMuted) sfx('select'); // brief blip to confirm sound is live
});
// returnToSelect() — tear down the fight and show the character-select screen.
// Used by the BACK button and by the auto-return timer after a victory.
function returnToSelect() {
  stopGame();
  document.getElementById('vs-intro').classList.remove('show');
  document.getElementById('winner-overlay').classList.remove('show');
  document.getElementById('fight-screen').classList.remove('active');
  document.getElementById('select-screen').classList.add('active');
  document.getElementById('app-footer').classList.add('show');
}
document.getElementById('back-btn').addEventListener('click', returnToSelect);

// buildGame(redT, blueT) — construct a fresh fight state. Used by both the
// live startFight and the headless upset-hunt so they build identical games.
// Arena is the fixed ARENA×ARENA square (the live canvas is always this arena).
function buildGame(redT, blueT) {
  const w = ARENA, h = ARENA;
  fightToken++;
  return {
    w, h,
    token: fightToken,
    red: makeFighter(redT, 'red', w * 0.2, h * 0.5),
    blue: makeFighter(blueT, 'blue', w * 0.8, h * 0.5),
    projectiles: [], mines: [], hazards: [], skeletons: [], floatTexts: [], impacts: [],
    over: false, finishTimer: 0, winner: null, elapsed: 0, lastT: performance.now(),
    timeScale: 1, koTimer: 0, acc: 0,
    shakeTime: 0, shakeMag: 0, flashFrame: 0,
    introPlaying: true,
  };
}

// simulateFight(redId, blueId, seed) — run a whole fight headless (no render,
// no audio) and return the winning fighter's id. Fully deterministic: the
// same seed always yields the same winner, and watching that seed live
// reproduces this exact fight.
function simulateFight(redId, blueId, seed) {
  return simulateFightDetailed(redId, blueId, seed).winId;
}

// simulateFightDetailed(redId, blueId, seed) — same headless run, but returns
// { winId, loseId, winnerHp, elapsed }. winnerHp is the WINNER's remaining HP
// (absolute) when the fight ended; loseId is the loser. Together they let a
// caller judge closeness against the loser's hit damage. elapsed = seconds.
function simulateFightDetailed(redId, blueId, seed) {
  const redT = FIGHTERS.find(g => g.id === redId);
  const blueT = FIGHTERS.find(g => g.id === blueId);
  const prevGame = game, prevHeadless = headless;
  headless = true;
  initSeededRng(seed);
  game = buildGame(redT, blueT);
  game.introPlaying = false; // no intro in a headless run
  let guard = 0;
  // ~30s fight cap at 60fps = 1800 ticks; +finish window. 4000 is safe headroom.
  while (!game.over && guard < 4000) { advance(); guard++; }
  const winner = game.winner;
  const winId = winner ? winner.id : null;
  const loser = winner ? (winner === game.red ? game.blue : game.red) : null;
  const loseId = loser ? loser.id : null;
  const winnerHp = winner ? Math.max(0, winner.hp) : 0;
  const elapsed = game.elapsed || 0;
  // Restore live state — the hunt must not disturb the real game.
  game = prevGame;
  headless = prevHeadless;
  return { winId, loseId, winnerHp, elapsed };
}

// huntUpset(redId, blueId, wantId, maxTries) — search random seeds until one
// produces a win for `wantId`. Returns { seed, tries } or null if not found.
function huntUpset(redId, blueId, wantId, maxTries) {
  for (let i = 1; i <= maxTries; i++) {
    const seed = randomSeed();
    if (simulateFight(redId, blueId, seed) === wantId) return { seed, tries: i };
  }
  return null;
}

// huntTight(redId, blueId, maxTries, best) — search random seeds for a
// nail-biter: a fight where the WINNER finished on HP at or below the LOSER's
// hit damage, i.e. one more clean hit from the loser would have killed them.
// `best` carries the closest fight across chunked calls (closeness = winnerHp
// minus loserDmg; <= 0 means tight). Returns { seed, found, best }; best is
// shaped { seed, winnerHp, loserDmg, margin, elapsed, winId }.
function huntTight(redId, blueId, maxTries, best) {
  for (let i = 1; i <= maxTries; i++) {
    const seed = randomSeed();
    const r = simulateFightDetailed(redId, blueId, seed);
    if (r.winId == null || r.loseId == null) continue; // skip any non-result
    const loser = FIGHTERS.find(g => g.id === r.loseId);
    const loserDmg = loser.dmg;
    const margin = r.winnerHp - loserDmg; // <= 0 means one hit would have killed
    if (!best || margin < best.margin) {
      best = { seed, winnerHp: r.winnerHp, loserDmg, margin, elapsed: r.elapsed, winId: r.winId };
    }
    if (margin <= 0) {
      return { seed, found: true, best };
    }
  }
  return { seed: null, found: false, best };
}

// huntCloseFinish(redId, blueId, maxTries, best) — sibling to huntTight using a
// different "close" metric: the WINNER finished below CLOSE_FINISH_HP_FRAC of
// their max HP (currently 0.3 = 30%). Matches the TIGHT_HP_FRACTION used in
// boxedshard.js so the offline balance harness and the in-game picker agree on
// what counts as a close finish. `best` carries the lowest-HP-percent fight
// seen across chunked calls. Returns { seed, found, best }; best is shaped
// { seed, winnerHp, winnerMax, pct, elapsed, winId }.
const CLOSE_FINISH_HP_FRAC = 0.3;
function huntCloseFinish(redId, blueId, maxTries, best) {
  for (let i = 1; i <= maxTries; i++) {
    const seed = randomSeed();
    const r = simulateFightDetailed(redId, blueId, seed);
    if (r.winId == null || r.loseId == null) continue; // skip any non-result
    const winner = FIGHTERS.find(g => g.id === r.winId);
    const winnerMax = winner.hp;
    const pct = r.winnerHp / winnerMax;        // 0..1 of max — lower is closer
    if (!best || pct < best.pct) {
      best = { seed, winnerHp: r.winnerHp, winnerMax, pct, elapsed: r.elapsed, winId: r.winId };
    }
    if (pct < CLOSE_FINISH_HP_FRAC) {
      return { seed, found: true, best };
    }
  }
  return { seed: null, found: false, best };
}

function makeFighter(t, team, x, y) {
  const a = rng() * Math.PI * 2;
  return {
    ...t, team, maxHp: t.hp, x, y,
    baseSpeed: t.speed,
    vx: Math.cos(a) * t.speed,
    vy: Math.sin(a) * t.speed,
    cdTimer: t.cd * 0.5 + rng() * 0.5,
    swingTimer: 0, dashTimer: 0, dashHit: false, rampageHitCd: 0, blastTimer: 0, flash: 0, negateFlash: 0, dead: false,
    // Melee body-language (visual only — never read by the sim/balance):
    //   dashStartX/Y — launch anchor for the anticipation hold
    //   meleeImpact / meleeImpactMax — countdown (and its start value) driving the
    //     impact squash + each fighter's bespoke impact effect
    //   recoilTimer/recoilDir/recoilMag — the struck fighter's knockback (mag scales with damage)
    dashStartX: 0, dashStartY: 0, meleeImpact: 0, meleeImpactMax: 0.18, recoilTimer: 0, recoilDir: 0, recoilMag: 0,
    // Ranged fire reaction (visual only): fireKick countdown + fireDir (firing
    // angle) drive the body recoil/thrust at release and each fighter's muzzle flash.
    fireKick: 0, fireKickMax: 0.2, fireDir: 0,
    aimTimer: 0, aimAngle: 0, aimAbility: null,
    shotCount: 0, trail: [],
    slowTimer: 0, stunTimer: 0,
    // Jester DOPPELGANGER state — decoys is the live phantom roster (each
    // entry { x, y, life, dead, decoy:true, shape, color, accent } so pickTarget
    // + drawShape can treat them uniformly). Decoy spawn happens in combat.js
    // damage(), decay + consumed-cleanup in step() below.
    blinkFx: 0, blinkFromX: 0, blinkFromY: 0,
    decoys: [],
    // Duelist
    lastX: x, lastY: y,
    parryTimer: 0, counterAnim: 0, counterDir: 0,
    // Reaper
    sweepTimer: 0, sweepHit: false, crescentOut: false, wakeHitCd: 0,
    // Ronin
    iaiWindup: 0, iaiStrike: 0, iaiHit: false, iaiTrail: null, focused: false,
    iaiAngle: 0,
    // Witch mark target timer (any fighter can carry the mark)
    witchMarkTimer: 0,
    // Archer SHATTER state — embedded is the live cushion (each entry has a
    // timer, world angle, and landing-burst `born`); embedFlash is the
    // brief cluster shudder on a new landing. shattering is the post-burst
    // residue: arrows flying outward over 0.4s after a SHATTER trigger.
    // shatterFlash is the expanding ring at the moment of burst.
    // Everything here is visual or sim-state; never read by balance code.
    embedded: [], embedFlash: 0,
    shattering: [], shatterFlash: 0,
    // Hunter tether state — the 0.3s reel-in tween after a hook connects.
    tetherTimer: 0, tetherTarget: null, tetherStartX: 0, tetherStartY: 0,
    // Warlock drain channel state
    drainTimer: 0, drainTickTimer: 0, drainTarget: null, drainElapsed: 0, drainWhiffed: false,
    // Gambler — WILDCARD die roll. gamblerRoll is the face shown (1-6) while
    // the die tumbles + after it settles; gamblerShots is a queue of timed
    // coin shots (for the faces that fire over time); gamblerRefund flags a
    // low roll (1-2) that halves the next cooldown.
    gamblerRoll: 0, gamblerShots: [], gamblerRefund: false, gamblerSpeedTimer: 0, loadedFx: 0,
  };
}

function startFight() {
  huntActive = false; // cancel any running upset-hunt
  // Seed: use a pinned seed if the player set one, else roll a fresh seed.
  // Either way the fight is now fully reproducible from `currentSeed`.
  initSeededRng(pendingSeed != null ? pendingSeed : randomSeed());
  syncSeedDisplay(); // reflect the seed used; pins it so RESTART replays it
  document.getElementById('select-screen').classList.remove('active');
  document.getElementById('fight-screen').classList.add('active');
  document.getElementById('winner-overlay').classList.remove('show');
  document.getElementById('app-footer').classList.remove('show');
  resizeCanvas();
  camera.ready = false; // snap the follow-cam to the opening framing, don't ease from the last fight
  const redT = FIGHTERS.find(g => g.id === pickRed);
  const blueT = FIGHTERS.find(g => g.id === pickBlue);
  // Stop any previous fight's loop dead — bump the generation token so a stale
  // requestAnimationFrame callback from the old fight bails immediately.
  game = buildGame(redT, blueT);
  const w = game.w, h = game.h;
  Audio.setArenaWidth(w); // so positional sounds pan correctly
  document.getElementById('fight-name-red').textContent = redT.name;
  document.getElementById('fight-name-blue').textContent = blueT.name;
  // Clear any status badges left over from a previous fight
  ['status-red', 'status-blue'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.innerHTML = ''; el.dataset.key = ''; }
  });
  updateHp();
  draw(); // paint the opening arena state under the intro overlay
  playVsIntro(redT, blueT);
}

// VS intro — slides both fighters in, slams a "VS", holds, then starts the fight.
function playVsIntro(redT, blueT) {
  const intro = document.getElementById('vs-intro');
  const myGame = game; // capture — if a new fight starts, this won't match
  // Fill each side
  const fillSide = (side, t) => {
    document.getElementById('vs-name-' + side).textContent = t.name;
    // Ability line = active name · passive name (the part of each string
    // before the "—"). E.g. "RIPOSTE THRUST · EN GARDE".
    const actName = t.active.split('—')[0].trim();
    const pasName = t.passive.split('—')[0].trim();
    document.getElementById('vs-ability-' + side).textContent =
      actName + ' · ' + pasName;
    document.getElementById('vs-stats-' + side).innerHTML =
      'HP ' + t.hp + ' &nbsp; SPD ' + t.speed + '<br>DMG ' + t.dmg + ' &nbsp; CD ' + t.cd + 's';
    drawVsEmblem(document.getElementById('vs-sprite-' + side), { ...t, side });
  };
  fillSide('red', redT);
  fillSide('blue', blueT);
  // Restart the slide/clash animations by re-adding the class
  intro.classList.remove('show');
  void intro.offsetWidth; // force reflow so the animation replays
  intro.classList.add('show');
  sfx('select'); // whoosh-ish blip as the panels slam in
  setTimeout(() => { if (game === myGame) sfx('start'); }, 420);
  // Hold the intro ~2.4s total, then clear it and begin the fight.
  setTimeout(() => {
    // Bail if the player restarted / went back during the intro.
    if (game !== myGame) return;
    intro.classList.remove('show');
    game.introPlaying = false;
    game.lastT = performance.now(); // reset so elapsed doesn't jump
    loop();
  }, 2400);
}

// Draws the actual fighter sprite onto an intro canvas, with a soft accent-ring
// backing so it reads well at intro scale.
function drawVsEmblem(cnv, t) {
  const c = cnv.getContext('2d');
  const W = cnv.width, H = cnv.height, cx = W / 2, cy = H / 2;
  c.clearRect(0, 0, W, H);
  // Team-colored ring (red / blue) — the border always means "which side",
  // matching the in-fight sprite borders. The fighter's own accent still
  // shows inside the sprite (stars, emblems), just not as the ring.
  const teamColor = t.side === 'blue' ? '#2e9eff' : '#ff2e2e';
  // Soft backing disc
  const R = W * 0.42;
  c.fillStyle = 'rgba(255,255,255,0.04)';
  c.beginPath();
  c.arc(cx, cy, R, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = teamColor;
  c.lineWidth = 3;
  c.globalAlpha = 0.6;
  c.beginPath();
  c.arc(cx, cy, R, 0, Math.PI * 2);
  c.stroke();
  c.globalAlpha = 1;
  // Real sprite — drawShape draws in local space, so translate to center.
  // Build a minimal fighter-like object: drawShape only reads size/color/accent/shape.
  const spriteF = { color: t.color, accent: t.accent, shape: t.shape };
  const spriteScale = (W * 0.28) / FIGHTER_SIZE;
  c.save();
  c.translate(cx, cy);
  c.scale(spriteScale, spriteScale);
  // Blue sits on the right of the VS — flip it so its forward edge faces inward.
  if (t.side === 'blue') c.scale(-1, 1);
  c.fillStyle = spriteF.color;
  drawShape(c, spriteF);
  c.restore();
}
function stopGame() { if (game) game.over = true; }

function updateHp() {
  document.getElementById('hp-red').style.width = Math.max(0, (game.red.hp/game.red.maxHp)*100) + '%';
  document.getElementById('hp-blue').style.width = Math.max(0, (game.blue.hp/game.blue.maxHp)*100) + '%';
  document.getElementById('hp-text-red').textContent = `${Math.max(0,Math.round(game.red.hp))} / ${game.red.maxHp}`;
  document.getElementById('hp-text-blue').textContent = `${Math.max(0,Math.round(game.blue.hp))} / ${game.blue.maxHp}`;
  // Fight clock — counts UP from 0:00 since the fog mechanic was removed. Pure
  // informational display (how long the fight has been going), no urgent state.
  const clock = document.getElementById('fight-clock');
  if (clock) {
    const elapsed = game.elapsed || 0;
    const total = Math.floor(elapsed);
    const mins = Math.floor(total / 60), secs = total % 60;
    clock.textContent = mins + ':' + (secs < 10 ? '0' : '') + secs;
    clock.classList.remove('urgent');
  }
}

// (The DOM status-badge system was removed: every status now reads on the fighter
// itself — armed/rage/focus rings, stun stars, mark sigil, slow drag-trail, the
// loaded pop — so a HUD badge row would just double-report.)

// Fixed simulation timestep. The loop accumulates real time and advances the
// sim in exact FIXED_DT chunks — so the fight is fully deterministic from its
// seed (frame drops or machine speed can't change the outcome). The headless
// upset-hunt calls the same advance() so a hunted seed reproduces exactly.
const FIXED_DT = 1 / 60;

// Skeleton (Necromancer minion) tuning. Skeletons now take REAL damage routed
// through damageSkeleton() — each attacker's true dmg stat applies — so HP is a
// meaningful pool. SKEL_HP is the balance lever. MELEE_SKEL_IFRAME: after a
// melee strike hits a skeleton it can't be hit again for this long (longer than
// any 0.3s strike window), so one strike lands once, not once per frame.
const SKEL_HP = 180;
const MELEE_SKEL_IFRAME = 0.35;

// Hunter CRIPPLING HOOK: when a hook connects, the wounded enemy is STUNNED
// for this long — frozen, unable to use their ability. This is the Hunter's
// answer to single-hit counters: a stunned Reaper can't spin, a stunned Jester
// can't blink, a stunned Duelist can't riposte. Must stay well under the hook
// cooldown (1.5s) or it becomes a perma-lock. Balance lever.
const CRIPPLE_STUN = 0.4;

// Reaper WAKE: per-target cooldown between wake-trail damage ticks. Caps the chip
// from overlapping wake segments — without this, a fighter standing in a dense arc
// would be ticked once per segment per frame. Tunable.
const WAKE_HIT_GAP = 0.18;

// Damage-float debounce: a multi-hit burst keeps merging into one float as long
// as hits arrive within this many ms of each other; once a gap this long passes
// with no new hit, the float resolves (punches once, then floats off). Shared
// by damage() and the float update loop so merge timing == resolve timing.
const BATCH_GAP = 240;

// advance() — step the sim forward by exactly one fixed tick, applying the
// slow-mo, hit-stop and timer logic. Returns true if the fight is fully over
// (finish window elapsed). Drives both the live loop and the headless hunt.
function advance() {
  const realDt = FIXED_DT;
  if (game.winner) {
    game.timeScale = Math.min(1, game.timeScale + realDt * 0.9);
  }
  if (game.koTimer > 0) game.koTimer -= realDt;
  if (game.flashFrame > 0) game.flashFrame -= realDt;
  const simDt = realDt * game.timeScale;
  if (game.shakeTime > 0) {
    game.shakeTime -= realDt;
    if (game.shakeTime <= 0) game.shakeMag = 0;
  }
  step(simDt);
  if (game.winner && game.finishTimer > 0) {
    game.finishTimer -= realDt;
    if (game.finishTimer <= 0) { game.over = true; return true; }
  }
  return false;
}

function loop() {
  // Bail if the game was replaced (restart/back) or finished, or the intro is
  // still playing — a stale RAF callback from a previous fight ends here.
  if (!game || game.over || game.token !== fightToken || game.introPlaying) return;
  const now = performance.now();
  let frameTime = (now - game.lastT) / 1000;
  game.lastT = now;
  if (frameTime > 0.25) frameTime = 0.25; // clamp huge stalls (tab switch)
  // Fixed-timestep accumulator: bank real time, spend it in exact ticks.
  game.acc = (game.acc || 0) + frameTime;
  let finished = false;
  while (game.acc >= FIXED_DT && !finished) {
    finished = advance();
    game.acc -= FIXED_DT;
  }
  draw();
  if (finished) { showWinnerOverlay(); return; }
  requestAnimationFrame(loop);
}

function bounce(f, w, h) {
  let hit = false;
  if (f.x - FIGHTER_SIZE < 0) { f.x = FIGHTER_SIZE; f.vx = Math.abs(f.vx); hit = true; }
  if (f.x + FIGHTER_SIZE > w) { f.x = w - FIGHTER_SIZE; f.vx = -Math.abs(f.vx); hit = true; }
  if (f.y - FIGHTER_SIZE < 0) { f.y = FIGHTER_SIZE; f.vy = Math.abs(f.vy); hit = true; }
  if (f.y + FIGHTER_SIZE > h) { f.y = h - FIGHTER_SIZE; f.vy = -Math.abs(f.vy); hit = true; }
  if (hit) sfx('wall', null, f.x);
  return hit;
}
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

// pickTarget(attacker, defender) — returns the nearest of {defender, ...defender's decoys}
// from the attacker's perspective. Used UNIFORMLY by every fighter's aim call so any
// fighter that spawns decoys (currently only Jester via DOPPELGANGER) is "fooled" the
// same way by every ability. Tiebreaker: real fighter wins ties (strict-less for decoys),
// which keeps behaviour identical to the pre-decoy code when no decoys exist.
// Return value has at least {x, y, dead}; decoys also have a `decoy:true` flag and `life`;
// real fighters have all the fighter fields (vx, vy, etc).
function pickTarget(attacker, defender) {
  if (!defender.decoys || defender.decoys.length === 0) return defender;
  let best = defender, bestD = dist(attacker, defender);
  for (const d of defender.decoys) {
    const dd = dist(attacker, d);
    if (dd < bestD) { best = d; bestD = dd; }
  }
  return best;
}

// tryHitDecoy(pos, defender, hitRange) — if a decoy is in hit range AND closer
// to `pos` than the real defender, mark that decoy dead and return it. The
// caller should treat this as the projectile/strike being absorbed (despawn,
// no damage to real defender). Returns null when no decoy intercepts.
function tryHitDecoy(pos, defender, hitRange) {
  if (!defender.decoys || !defender.decoys.length) return null;
  const realD = defender.dead ? Infinity : dist(pos, defender);
  let best = null, bestD = Math.min(hitRange, realD);
  for (const d of defender.decoys) {
    const dd = dist(pos, d);
    if (dd < bestD) { best = d; bestD = dd; }
  }
  if (best) best.dead = true;
  return best;
}


// ============================================================================
// === STEP (per-frame simulation) ============================================
// Runs every frame at variable dt. Handles fighter movement, passive ticks
// (regen, bloodrage, wakes, shield/dodge recharge), dash & swing windows,
// body collisions, ability cooldowns, projectiles, mines.
// This is the heart of the game loop.
// ============================================================================

function step(dt) {
  const { w, h, red, blue } = game;

  // Fight clock — just tracks elapsed time. The old closing-ring / fog mechanic
  // was removed: Shorts viewers want to see fights finished naturally on the
  // fighters' own merits, not pressured by an external arena hazard. The
  // headless harness's 4000-tick guard (simulateFightDetailed) still catches
  // any truly infinite stalemate so balance runs always terminate.
  if (!game.winner) game.elapsed += dt;

  [red, blue].forEach(f => {
    if (f.dead) return;
    // Stunned fighters (Hunter's CRIPPLING HOOK) are frozen — no self-movement.
    // The hook's tether reel still repositions them (it sets x/y directly).
    // NOTE: only movement is frozen — passives below still tick (a stunned
    // Priest keeps regenerating, a stunned Berserker keeps Bloodrage).
    if (f.stunTimer <= 0) {
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      const bounced = bounce(f, w, h);
      // RAMPAGE — each wall ricochet mid-rampage squashes the body so the bounce
      // reads as a slam (visual only; the sim never reads meleeImpact back).
      if (bounced && f.ability === 'tackle' && f.dashTimer > 0) {
        f.meleeImpact = 0.14; f.meleeImpactMax = 0.14;
      }
    }

    // ---- PASSIVES ----
    // Priest: Divine Grace — heals only when JUDGMENT lands (see resolveAim),
    // not a continuous regen or per-cast heal.
    // Berserker: Bloodrage — +rageBoost% speed when below 50% hp.
    // Apply via an effective speed multiplier (we adjust .speed at runtime; revert after).
    if (f.ability === 'tackle') {
      const rageActive = f.hp < f.maxHp * 0.5;
      if (rageActive && !f.rageWasActive) sfx('bloodrage', null, f.x); // fires once on activation
      f.rageWasActive = rageActive;
      const targetSpeed = rageActive ? f.baseSpeed * (1 + f.rageBoost) : f.baseSpeed;
      // Renormalize current velocity to target speed when not dashing. During the
      // RAMPAGE windup, scale to 0.4x so the body still bounces (DVD identity
      // preserved) but visibly strains — the coil reads as slowed motion + tremble
      // + charge ring, not a planted halt.
      if (f.dashTimer <= 0) {
        const windupScale = (f.aimTimer > 0 && f.aimAbility === 'tackle') ? 0.4 : 1;
        const sp = Math.hypot(f.vx, f.vy) || 1;
        f.vx = f.vx / sp * targetSpeed * windupScale;
        f.vy = f.vy / sp * targetSpeed * windupScale;
      }
      f.speed = targetSpeed;
    }
    // Gambler: Wild Card speed-burst roll — +50% speed while the timer is active.
    if (f.ability === 'wildcard') {
      const targetSpeed = f.gamblerSpeedTimer > 0 ? f.baseSpeed * 1.5 : f.baseSpeed;
      const sp = Math.hypot(f.vx, f.vy) || 1;
      f.vx = f.vx / sp * targetSpeed;
      f.vy = f.vy / sp * targetSpeed;
      f.speed = targetSpeed;
    }
    // Jester DOPPELGANGER: decoy lifecycle. Decay each decoy's life; cull on
    // timeout or `dead` flag (set by the projectile/melee hit loops when a
    // decoy absorbs an attack). Iterate back-to-front for safe splice.
    if (f.ability === 'blink') {
      if (f.blinkFx > 0) f.blinkFx -= dt;
      if (f.decoys && f.decoys.length) {
        for (let i = f.decoys.length - 1; i >= 0; i--) {
          f.decoys[i].life -= dt;
          if (f.decoys[i].life <= 0 || f.decoys[i].dead) f.decoys.splice(i, 1);
        }
      }
    }
    if (f.ability === 'riposte') {
      if (f.parryTimer > 0) f.parryTimer -= dt;
      if (f.counterAnim > 0) f.counterAnim -= dt;
    }
    // Archer leaves a fading motion trail
    if (f.ability === 'arrow') {
      f.trail.push({ x: f.x, y: f.y, life: 0.35 });
      // age & trim
      for (const t of f.trail) t.life -= dt;
      while (f.trail.length && f.trail[0].life <= 0) f.trail.shift();
      if (f.trail.length > 24) f.trail.shift();
    }
    // -------------------

    if (f.dashTimer > 0) {
      f.dashTimer -= dt;
      if (f.dashTimer <= 0) {
        const a = Math.atan2(f.vy, f.vx);
        f.vx = Math.cos(a) * f.speed;
        f.vy = Math.sin(a) * f.speed;
      }
      const enemy = f === red ? blue : red;
      if (f.ability === 'tackle') {
        // Berserker RAMPAGE — keep ricocheting for the whole window; deal damage on
        // each PASS through the enemy, gated by a per-pass i-frame so one pass = one
        // hit (not one per frame). Do NOT end the dash or kill the speed on contact —
        // pass clean through and bounce on. The dashTimer countdown above ends it.
        // DOPPELGANGER: a decoy can absorb a single pass — consumes one i-frame
        // cycle (rampageHitCd resets, no damage to real Jester, body ricochets off
        // the decoy position). Subsequent passes can still hit the real enemy.
        if (f.rampageHitCd > 0) f.rampageHitCd -= dt;
        if (f.rampageHitCd <= 0) {
          const decoyHit = tryHitDecoy(f, enemy, FIGHTER_SIZE + FIGHTER_SIZE);
          if (decoyHit) {
            f.meleeImpact = 0.18; f.meleeImpactMax = 0.18;
            f.rampageHitCd = f.rampageHitGap;
            // Ricochet off the decoy's position like a wall bumper.
            const nl = Math.hypot(f.x - decoyHit.x, f.y - decoyHit.y) || 1;
            const ux = (f.x - decoyHit.x) / nl, uy = (f.y - decoyHit.y) / nl;
            const vdot = f.vx * ux + f.vy * uy;
            if (vdot < 0) { f.vx -= 2 * vdot * ux; f.vy -= 2 * vdot * uy; }
          } else if (!enemy.dead && dist(f, enemy) < FIGHTER_SIZE + FIGHTER_SIZE) {
            damage(enemy, f.dmg, undefined, f);
            f.meleeImpact = 0.18; f.meleeImpactMax = 0.18; // impact squash on each pass
            f.rampageHitCd = f.rampageHitGap;
            // Carom off the enemy like a round bumper — reflect the ramming velocity
            // about the center-to-center normal (speed preserved). Gated by the i-frame
            // above, so it reflects once per contact (no per-frame jitter).
            const nl = Math.hypot(f.x - enemy.x, f.y - enemy.y) || 1;
            const ux = (f.x - enemy.x) / nl, uy = (f.y - enemy.y) / nl;
            const vdot = f.vx * ux + f.vy * uy;
            if (vdot < 0) {                   // only when charging INTO the enemy
              f.vx -= 2 * vdot * ux;
              f.vy -= 2 * vdot * uy;
            }
          }
        }
      } else {
        // Knight / Duelist / Reaper: the dash only closes distance. The strike is
        // LIVE for the whole dash — the first frame the enemy is within this
        // fighter's strike range, the single hit lands (once per dash).
        // DOPPELGANGER: a decoy in range consumes the single strike (one-shot
        // melee abilities don't get to chain through a decoy to the real body).
        if (!f.dashHit) {
          const decoyHit = tryHitDecoy(f, enemy, FIGHTER_SIZE + FIGHTER_SIZE + f.strikeReach);
          if (decoyHit) {
            f.dashHit = true;
            f.meleeImpact = 0.18; f.meleeImpactMax = 0.18;
            f.dashTimer = 0;
            const a = Math.atan2(f.vy, f.vx);
            f.vx = Math.cos(a) * f.speed;
            f.vy = Math.sin(a) * f.speed;
          } else if (!enemy.dead && dist(f, enemy) < FIGHTER_SIZE + FIGHTER_SIZE + f.strikeReach) {
            damage(enemy, f.dmg, undefined, f);
            f.dashHit = true;
            f.meleeImpact = 0.18; f.meleeImpactMax = 0.18; // impact squash + bespoke effect
            f.dashTimer = 0;
            const a = Math.atan2(f.vy, f.vx);
            f.vx = Math.cos(a) * f.speed;
            f.vy = Math.sin(a) * f.speed;
          }
        }
      }
    }

    if (f.swingTimer > 0) {
      // Swing/lunge follow-through — VFX timing only; damage is the single
      // in-range hit landed during the dash.
      f.swingTimer -= dt;
      if (f.swingTimer <= 0) f.swingHit = false;
    }

    // Reaper: scythe sweep — visual spin only; the execute-scaled hit lands on the
    // single in-range frame during the dash (see the dash branch above).
    if (f.ability === 'sweep' && f.sweepTimer > 0) {
      f.sweepTimer -= dt;
      if (f.sweepTimer <= 0) f.sweepHit = false;
    }

    // Hunter tether: if this fighter is being reeled, tween toward the Hunter.
    // The hook already dealt its damage on impact — this is just the reel-in
    // motion that drags the enemy into close range.
    if (f.tetherTimer > 0) {
      f.tetherTimer -= dt;
      const t = f.tetherTarget;
      if (t && !t.dead) {
        const progress = 1 - (f.tetherTimer / 0.3);
        // End position: pulled to just in front of the Hunter, stopping a
        // little outside body contact.
        const dxh = f.tetherStartX - t.x;
        const dyh = f.tetherStartY - t.y;
        const dh = Math.hypot(dxh, dyh) || 1;
        const standoff = FIGHTER_SIZE + FIGHTER_SIZE + 6;
        const endX = t.x + dxh / dh * standoff;
        const endY = t.y + dyh / dh * standoff;
        f.x = f.tetherStartX + (endX - f.tetherStartX) * progress;
        f.y = f.tetherStartY + (endY - f.tetherStartY) * progress;
        if (f.tetherTimer <= 0) {
          sfx('yank');
          f.tetherTarget = null;
        }
      } else {
        f.tetherTimer = 0;
        f.tetherTarget = null;
      }
    }

    // Witch mark timer decay
    if (f.witchMarkTimer > 0) f.witchMarkTimer -= dt;

    // SHATTER stacks decay (each on its own timer; iterate back-to-front so
    // splices don't reshuffle the upcoming reads). `born` is the landing-burst
    // countdown (visual only — never read by the sim).
    if (f.embedded && f.embedded.length) {
      for (let i = f.embedded.length - 1; i >= 0; i--) {
        f.embedded[i].timer -= dt;
        if (f.embedded[i].born > 0) f.embedded[i].born -= dt;
        if (f.embedded[i].timer <= 0) f.embedded.splice(i, 1);
      }
    }
    if (f.embedFlash > 0) f.embedFlash -= dt;
    // SHATTER residue — scattered arrows fly outward over 0.4s after a burst.
    if (f.shattering && f.shattering.length) {
      for (let i = f.shattering.length - 1; i >= 0; i--) {
        f.shattering[i].timer -= dt;
        if (f.shattering[i].timer <= 0) f.shattering.splice(i, 1);
      }
    }
    if (f.shatterFlash > 0) f.shatterFlash -= dt;

    // Warlock: drain channel. Ticks f.dmg every 0.2s while the enemy stays in
    // range, slowing them to f.slowRate (ENERVATE passive) and healing f.dmg * f.drainHealRate per tick.
    if (f.drainTimer > 0) {
      f.drainTimer -= dt;
      f.drainElapsed += dt;
      const t = f.drainTarget;
      // DOPPELGANGER: if the drain locked onto a phantom decoy, the first
      // tick's worth of channel pulls "real" essence out of the phantom — it
      // collapses (decoy.dead = true) and the channel breaks. Warlock just
      // burnt the cast on a ghost; that's the counter-texture (a Jester
      // decoy in range fools the lock-on).
      if (t && t.decoy) {
        t.dead = true;
        f.drainTimer = 0;
        f.drainTarget = null;
      } else if (t && !t.dead) {
        const d = Math.hypot(t.x - f.x, t.y - f.y);
        if (d > 165) {
          f.drainTimer = 0;
          f.drainTarget = null;
        } else {
          t.slowTimer = Math.max(t.slowTimer, 0.3); // tethered targets are slowed
          t.activeSlowRate = f.slowRate;
          f.drainTickTimer -= dt;
          if (f.drainTickTimer <= 0) {
            f.drainTickTimer = 0.2;
            damage(t, f.dmg, 'drain');
            const before = f.hp;
            f.hp = Math.min(f.maxHp, f.hp + Math.round(f.dmg * f.drainHealRate));
            const gained = f.hp - before;
            // Debounced, accumulating heal float on the Warlock — ticks up over the
            // channel and follows him, mirroring his drain DAMAGE float. Visual only.
            if (gained > 0) {
              const nowT = performance.now();
              if (f.healFloat && f.healFloat.open && (nowT - f.healFloat.lastHit) < 1100) {
                f.healFloat.total += gained;
                f.healFloat.text = '+' + Math.round(f.healFloat.total);
                f.healFloat.lastHit = nowT;
                f.healFloat.age = 0;
              } else {
                const hf = { x: f.x, y: f.y - FIGHTER_SIZE, vy: -40, life: 0.8,
                             text: '+' + gained, total: gained, color: healColor(f),
                             age: 0, open: true, lastHit: nowT, gap: 1100, follow: f };
                game.floatTexts.push(hf);
                f.healFloat = hf;
              }
            }
          }
        }
      } else {
        f.drainTimer = 0;
        f.drainTarget = null;
      }
    }

    // Gambler: LOADED DICE — counts down the rushed-cooldown window after a
    // low roll, purely so the LOADED status badge knows when to show.
    if (f.loadedFx > 0) f.loadedFx -= dt;

    // Ronin: IAI — windup (planted) → teleport-OVERSHOOT along the LOCKED direction
    // → line-cleave everything on the dash path. Clean cut: FOCUS refunds cd, skips
    // recovery. Whiff: drop into a slow RECOVERY beat (vulnerable). Direction is
    // locked at cast, so the enemy bouncing off the line during the windup is real
    // counterplay — no homing correction.
    if (f.ability === 'iai') {
      const enemy = f === red ? blue : red;
      if (f.iaiWindup > 0) {
        f.iaiWindup -= dt;
        f.vx = 0; f.vy = 0;   // hold the plant
        if (f.iaiWindup <= 0) {
          f.iaiStrike = 0.15;
          sfx('iaiStrike');
          const startX = f.x, startY = f.y;
          // Teleport-OVERSHOOT a fixed distance along the locked direction (clamped
          // to inside the arena so it doesn't slide off-screen against a wall).
          const cosA = Math.cos(f.iaiAngle), sinA = Math.sin(f.iaiAngle);
          f.x = Math.max(FIGHTER_SIZE, Math.min(w - FIGHTER_SIZE, f.x + cosA * f.strikeDist));
          f.y = Math.max(FIGHTER_SIZE, Math.min(h - FIGHTER_SIZE, f.y + sinA * f.strikeDist));
          f.vx = cosA * f.speed; f.vy = sinA * f.speed;
          // Visual trail (existing renderer reads x1/y1 → x2/y2).
          f.iaiTrail = { x1: startX, y1: startY, x2: f.x, y2: f.y };
          // Line cleave — perpendicular distance helper from the dash segment.
          const sdx = f.x - startX, sdy = f.y - startY;
          const sLen2 = sdx*sdx + sdy*sdy;
          const segDist = (px, py) => {
            if (sLen2 === 0) return Math.hypot(px - startX, py - startY);
            const t = Math.max(0, Math.min(1, ((px-startX)*sdx + (py-startY)*sdy) / sLen2));
            return Math.hypot(px - (startX + t*sdx), py - (startY + t*sdy));
          };
          // Cleave skeletons on the path (force-burst since Ronin passed through them).
          game.skeletons = game.skeletons.filter(sk => {
            if (sk.team === f.team) return true;
            if (segDist(sk.x, sk.y) < f.slashReach + sk.size) {
              if (damageSkeleton(sk, f.dmg, true)) return false;
            }
            return true;
          });
          // Mines on the path detonate ON Ronin.
          game.mines = game.mines.filter(m => {
            if (m.team === f.team || m.armed > 0) return true;
            if (segDist(m.x, m.y) < FIGHTER_SIZE + m.size + 6) {
              damage(f, m.dmg);
              spawnImpact(m.x, m.y, 'mine', 0, 1);
              sfx('impact', { kind: 'mine', big: 1 }, m.x);
              return false;
            }
            return true;
          });
          // Decoys on the line are cleaved too (each one ON the iai segment dies).
          // FOCUS only chains on a REAL hit — slicing a phantom doesn't grant the
          // refund (the cut connected with nothing of substance).
          if (enemy.decoys && enemy.decoys.length) {
            for (const d of enemy.decoys) {
              if (segDist(d.x, d.y) < f.slashReach + FIGHTER_SIZE) d.dead = true;
            }
          }
          // Hit enemy on the line.
          if (!enemy.dead && segDist(enemy.x, enemy.y) < f.slashReach + FIGHTER_SIZE) {
            damage(enemy, f.dmg, undefined, f);
            f.iaiHit = true;
            f.cdTimer = f.cd * f.focusRefund;   // FOCUS — clean cut refunds cooldown (chain)
            f.focused = true;
          }
        }
      } else if (f.iaiStrike > 0) {
        f.iaiStrike -= dt;
        // Strike window over: trail fades. A whiff breaks FOCUS so the next cast is
        // on the full cd (which IS the visible "recovery" beat — no hidden slow).
        if (f.iaiStrike <= 0) {
          f.iaiTrail = null;
          if (!f.iaiHit) f.focused = false;
          f.iaiHit = false;
        }
      } else if (f.focused) {
        // FOCUS hold: planted between chained cuts while the refunded cd rolls
        // over to the next iai. The gold ring + still body reads as "in flow,"
        // not "wandering away from the enemy." Direction will re-aim at the
        // current enemy position when the chained iai fires.
        f.vx = 0; f.vy = 0;
      }
    }

    if (f === red) {
      const enemy = blue;
      // A rampaging Berserker handles its own enemy collision (caroms at ramming
      // speed in the dash branch above), so skip the generic base-speed push-apart.
      const rampaging = (f.ability === 'tackle' && f.dashTimer > 0) ||
                        (enemy.ability === 'tackle' && enemy.dashTimer > 0);
      if (!rampaging && !enemy.dead && dist(f, enemy) < FIGHTER_SIZE + FIGHTER_SIZE) {
        const ang = Math.atan2(f.y - enemy.y, f.x - enemy.x);
        f.vx = Math.cos(ang) * f.speed;
        f.vy = Math.sin(ang) * f.speed;
        enemy.vx = -Math.cos(ang) * enemy.speed;
        enemy.vy = -Math.sin(ang) * enemy.speed;
        sfx('contact', null, f.x); // near-inaudible click; self-throttled in audio
        // Contact damage removed — bodies bounce apart but deal no chip.
        // All damage now comes from abilities and the closing ring.
      }
    }

    f.cdTimer -= dt;
    // Warlock can't recast while a drain channel is still active.
    // A stunned fighter (Hunter's CRIPPLING HOOK) can't act — the cdTimer stays
    // ready, so they fire the instant the stun ends (cooldown isn't wasted).
    if (f.cdTimer <= 0 && !f.dead && f.aimTimer <= 0 && f.drainTimer <= 0 && f.stunTimer <= 0) {
      const target = f === red ? blue : red;
      if (!target.dead) fireAbility(f, target);
      // Gambler's Loaded Dice: a dud refunds half the cooldown.
      // Warlock: a whiffed drain (enemy out of range) only costs a short retry
      // delay, so the beam grabs on as soon as the enemy is close enough.
      // Gambler LOADED DICE refund is applied in resolveAim (the roll settles
      // ~1s after fire, so cdTimer is adjusted there once the face is known).
      if (f.ability === 'drain' && f.drainWhiffed) f.cdTimer = 0.25;
      else if (f.ability === 'cast' && f.castCapped) f.cdTimer = 0.4;
      // Reaper: a crescent is still in flight — retry soon instead of throwing a second.
      else if (f.ability === 'sweep' && f.sweepWhiff) f.cdTimer = 0.1;
      else f.cdTimer = f.cd;
    }
    if (f.aimTimer > 0) {
      f.aimTimer -= dt;
      if (f.aimTimer <= 0) resolveAim(f);
    }
    // Gambler timed coin shots — Twin Toss / Fortune's Barrage fire coins over
    // time. Each queued shot counts down its delay, then fires toward the enemy.
    if (f.gamblerShots.length > 0) {
      const enemy = f === red ? blue : red;
      f.gamblerShots = f.gamblerShots.filter(s => {
        s.delay -= dt;
        if (s.delay > 0) return true;
        if (!enemy.dead && !f.dead) {
          const a = Math.atan2(enemy.y - f.y, enemy.x - f.x) + s.offset;
          game.projectiles.push({
            x: f.x, y: f.y,
            vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed,
            team: f.team, dmg: f.dmg, life: 2.4,
            kind: 'coin', size: 5, homing: s.homing || 0, spin: 0,
            cruise: s.speed,   // re-normalised each frame so homing can't stall it
          });
          sfx('coinThrow', null, f.x);
        }
        return false;
      });
    }
    if (f.flash > 0) f.flash -= dt;
    if (f.negateFlash > 0) f.negateFlash -= dt;
    if (f.meleeImpact > 0) f.meleeImpact -= dt;
    if (f.recoilTimer > 0) f.recoilTimer -= dt;
    if (f.fireKick > 0) f.fireKick -= dt;
    if (f.blastTimer > 0) f.blastTimer -= dt;
    // Tick slow timer
    if (f.slowTimer > 0) f.slowTimer -= dt;
    // Tick stun timer (Hunter's CRIPPLING HOOK)
    if (f.stunTimer > 0) f.stunTimer -= dt;
    // Reaper WAKE per-target damage cooldown
    if (f.wakeHitCd > 0) f.wakeHitCd -= dt;
  });

  // Apply (and release) the slow effect. A slowed fighter's velocity is
  // renormalised to 60% of their current speed; once slowTimer expires it must
  // be renormalised back to 100% — otherwise the velocity stays scaled down
  // forever (the slow looked permanent even after the label vanished).
  // Uses f.speed (the EFFECTIVE speed — already reflects BLOODRAGE / buffs),
  // not baseSpeed, so a slowed Berserker still gets its rage bonus.
  [red, blue].forEach(f => {
    if (f.dead) return;
    if (f.dashTimer > 0 || f.aimTimer > 0 || f.blastTimer > 0) return; // dashes/aims/blasts set their own speed
    const targetSpeed = f.slowTimer > 0 ? f.speed * (f.activeSlowRate ?? 0.6) : f.speed;
    const sp = Math.hypot(f.vx, f.vy);
    if (sp > 0.01) {
      f.vx = f.vx / sp * targetSpeed;
      f.vy = f.vy / sp * targetSpeed;
    }
  });

  game.projectiles = game.projectiles.filter(p => {
    if (p.spent) return false;
    if (p.kind === 'charge') {
      // SAPPER STICK CHARGE — flies until it contacts the enemy, then STICKS to them
      // and a fuse ticks down to a detonation (damage + BLAST RADIUS knockback). A
      // miss (edge, life-expire) despawns the charge. Duelist can parry it back to
      // the thrower — and yes, the thrower then eats their own bomb.
      const owner = p.team === 'red' ? red : blue;
      if (owner.dead) return false;
      if (p.stuck) {
        const stuckTo = p.stuckTo;
        if (!stuckTo || stuckTo.dead) return false;
        // Charge rides the body in the enemy's LOCAL frame — when the enemy turns to
        // face the thrower from a new side, the limpet rotates around with them
        // (stuck-spot stays the same relative to the body). Facing is recomputed from
        // world positions every frame so it's deterministic in headless replay.
        const enemyFacing = Math.atan2(owner.y - stuckTo.y, owner.x - stuckTo.x);
        const worldAng = enemyFacing + p.stickLocalAng;
        p.x = stuckTo.x + Math.cos(worldAng) * FIGHTER_SIZE;
        p.y = stuckTo.y + Math.sin(worldAng) * FIGHTER_SIZE;
        p.angle = worldAng;
        p.fuse -= dt;
        if (p.fuse <= 0) {
          damage(stuckTo, p.dmg, 'projectile');
          // The explosion's visual + sound ALWAYS fire — even on a lethal detonation
          // (a kill should still BOOM, with the impact landing before the kill-cam
          // pushes in). Only the knockback is gated on a live target.
          spawnImpact(p.x, p.y, 'mine', 0, 1);
          sfx('impact', { kind: 'mine', big: 1 }, p.x);
          if (!stuckTo.dead) {
            // BLAST RADIUS — the explosion shoves the body AWAY FROM the stick point
            // (so a charge on the back blasts them forward; on the chest blasts them
            // back). Direction = opposite of the stick world angle.
            stuckTo.vx = -Math.cos(worldAng) * 400;
            stuckTo.vy = -Math.sin(worldAng) * 400;
            stuckTo.blastTimer = 0.22;
          }
          return false;
        }
        return true;
      }
      // In-flight phase — straight throw, no homing.
      p.life -= dt;
      if (p.life <= 0) return false;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < 0 || p.x > w || p.y < 0 || p.y > h) return false;
      const tgt = p.team === 'red' ? blue : red;
      // DOPPELGANGER: a closer decoy intercepts the charge, sticks to nothing
      // (decoy is consumed), and the charge despawns. Real Jester isn't touched.
      if (tryHitDecoy(p, tgt, FIGHTER_SIZE + p.size)) return false;
      if (!tgt.dead && dist(p, tgt) < FIGHTER_SIZE + p.size) {
        if (tgt.ability === 'riposte' && tgt.parryTimer > 0) {
          // Duelist parry — flip the charge back at the thrower.
          p.team = tgt.team;
          p.vx = -p.vx; p.vy = -p.vy;
          p.angle = Math.atan2(p.vy, p.vx);
          sfx('parry', null, tgt.x);
          tgt.negateFlash = 0.25;
          return true;
        }
        // Stick! The charge clamps to the target's body and the fuse starts.
        // Lock the stick orientation in the ENEMY'S LOCAL FRAME so it rotates with
        // the body as their facing changes (enemy always faces the owner).
        const impactWorldAng = Math.atan2(p.y - tgt.y, p.x - tgt.x);
        const enemyFacing = Math.atan2(owner.y - tgt.y, owner.x - tgt.x);
        p.stickLocalAng = impactWorldAng - enemyFacing;
        p.stuck = true;
        p.stuckTo = tgt;
        p.vx = 0; p.vy = 0;
        sfx('mine', null, tgt.x);   // clamp sound (reuses the mine cast sound)
      }
      return true;
    }
    if (p.kind === 'crescent') {
      // Reaper HARVEST — returning scythe boomerang. The scythe OVERSHOOTS the
      // enemy: it keeps flying through after a hit, only turning back when it
      // reaches max travel or hits a wall. The return leg homes straight back
      // to Reaper and can clip the enemy again on the way through (gated by
      // hitCd so it never double-hits in a single frame). Bypasses the generic
      // projectile logic below.
      const owner = p.team === 'red' ? red : blue;
      const target = p.team === 'red' ? blue : red;
      p.life -= dt;
      if (owner.dead || p.life <= 0) { owner.crescentOut = false; return false; }
      if (p.hitCd > 0) p.hitCd -= dt;
      const steer = (tx, ty, k) => {
        const ang = Math.atan2(ty - p.y, tx - p.x), sp = Math.hypot(p.vx, p.vy);
        p.vx += (Math.cos(ang) * sp - p.vx) * Math.min(1, k * dt / 100);
        p.vy += (Math.sin(ang) * sp - p.vy) * Math.min(1, k * dt / 100);
      };
      if (p.phase === 'out') {
        // DOPPELGANGER: outbound steers toward the nearest of {target, decoys}.
        // Decoys don't move, so a decoy-locked crescent will fly straight at
        // it; on contact the hit-branch below consumes the decoy and the
        // scythe overshoots through (same as enemy-overshoot behavior).
        const aim = pickTarget(p, target);
        if (aim === target ? !target.dead : true) steer(aim.x, aim.y, p.homing);
      }
      else {
        // Return = retrieval: beeline straight at Reaper so it always gets caught
        // (a lerp-homing turn radius is too wide at this speed — it would orbit).
        const ang = Math.atan2(owner.y - p.y, owner.x - p.x);
        p.vx = Math.cos(ang) * p.cruise; p.vy = Math.sin(ang) * p.cruise;
      }
      const sp2 = Math.hypot(p.vx, p.vy) || 0.001;          // hold constant cruise speed
      p.vx = p.vx / sp2 * p.cruise; p.vy = p.vy / sp2 * p.cruise;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.spin = (p.spin || 0) + dt * 14;
      p.angle = Math.atan2(p.vy, p.vx);
      // Wall hit → return: clamp inside the arena and turn back (the blade can't fly
      // past a wall). Return-leg homing is a beeline owner-to-owner, so it stays
      // inside the arena naturally — only outbound needs this guard.
      if (p.phase === 'out') {
        if (p.x - p.size < 0)     { p.x = p.size;       p.phase = 'back'; }
        else if (p.x + p.size > w) { p.x = w - p.size;   p.phase = 'back'; }
        if (p.y - p.size < 0)     { p.y = p.size;       p.phase = 'back'; }
        else if (p.y + p.size > h) { p.y = h - p.size;   p.phase = 'back'; }
      }
      // WAKE passive — drop a small hazard segment along the flight path every
      // owner.wakeRate seconds (BOTH legs paint the arc). Gated against double-tick
      // by the per-target wakeHitCd, not per-segment timing.
      p.wakeTick = (p.wakeTick || 0) + dt;
      if (p.wakeTick >= owner.wakeRate) {
        p.wakeTick = 0;
        game.hazards.push({
          x: p.x, y: p.y,
          radius: owner.wakeRadius,
          timer: owner.wakeLife, maxTimer: owner.wakeLife,
          dmg: owner.wakeDmg, kind: 'wake',
          team: p.team,
        });
      }
      // Hit (gated by hitCd so it can't double-hit on a single overshoot/return
      // pass). The hit doesn't terminate the scythe's flight — it overshoots
      // and can connect again on the return leg.
      // DOPPELGANGER: a closer decoy absorbs ONE hit attempt and is consumed,
      // but the scythe overshoots through (same shape as the enemy-overshoot
      // behavior — landing a hit shouldn't end the throw). hitCd guards the
      // next frame from retriggering on the same decoy / chaining decoys.
      if (p.hitCd <= 0 && tryHitDecoy(p, target, FIGHTER_SIZE + p.size)) {
        p.hitCd = 0.2;
      }
      if (!target.dead && p.hitCd <= 0 && dist(p, target) < FIGHTER_SIZE + p.size) {
        damage(target, p.dmg, 'projectile');
        // Impact + sfx ALWAYS fire — even on a lethal hit (the kill-cam jumps in
        // silent otherwise). Only the victim's recoil-shake needs the alive gate.
        const big = Math.min(1, p.dmg / 260), ha = Math.atan2(p.vy, p.vx);
        spawnImpact(p.x, p.y, 'bone', ha, big);            // reuse bone-shard impact (reaper material)
        sfx('impact', { kind: 'bone', big: big }, p.x);
        if (!target.dead) {
          target.recoilTimer = 0.16; target.recoilDir = ha; target.recoilMag = big * 13;
        }
        p.hitCd = 0.2;
      }
      if (p.phase === 'out') {
        p.traveled += p.cruise * dt;
        // Overshoot: enemy contact no longer flips to 'back' — the scythe keeps
        // going past the hit until max travel (or a wall hit, handled in the
        // wall-clamp block above). Whiff and connect both follow the same arc.
        if (p.traveled >= p.maxTravel) p.phase = 'back';
      } else if (dist(p, owner) < FIGHTER_SIZE + p.size) {
        owner.crescentOut = false;
        owner.cdTimer = owner.cd;                            // post-catch recovery before the next throw
        return false;                                        // caught
      }
      return true;
    }
    p.life -= dt;
    if (p.life <= 0) {
      // BOMBARD landing — a cannon shell that didn't directly contact the enemy
      // EXPLODES at its predicted landing point with DIRECT HIT falloff (max at
      // center, scaling to 0 at splashRadius). Same logic as the contact branch.
      if (p.kind === 'cannon') {
        const ownerC = p.team === 'red' ? red : blue;
        const tgtC = p.team === 'red' ? blue : red;
        if (!ownerC.dead && !tgtC.dead) {
          const d = Math.hypot(tgtC.x - p.x, tgtC.y - p.y);
          if (d < ownerC.splashRadius) damage(tgtC, p.dmg * (1 - d / ownerC.splashRadius), 'projectile');
        }
        spawnImpact(p.x, p.y, 'cannon', 0, 1, p.splashRadius);
        sfx('impact', { kind: 'cannon', big: 1 }, p.x);
      }
      return false;
    }
    // A projectile must not outlive its caster — if the owning fighter is
    // dead, the projectile is orphaned and despawns. (endGame() also clears
    // projectiles, but enforcing it here makes it true every frame regardless
    // of ordering, so e.g. a Wizard's orbs can't linger past its death.)
    const owner = p.team === 'red' ? red : blue;
    if (owner.dead) return false;
    // Coin Nova: a coin bursts outward free-flying, then after novaArm elapses
    // it gains strong homing and curves back to converge on the enemy.
    if (p.novaArm > 0) {
      p.novaArm -= dt;
      if (p.novaArm <= 0) p.homing = 220;
    }
    if (p.homing > 0) {
      const defender = p.team === 'red' ? blue : red;
      // DOPPELGANGER: home toward the NEAREST of {real, decoys} this frame. So
      // a homing projectile (orb/coin/hex/reflected-charge) can switch from
      // tracking real Jester to tracking a fresh decoy if the decoy is closer.
      // Real-defender-dead path keeps the prior behaviour (stop homing).
      const aim = pickTarget(p, defender);
      const aimAlive = aim === defender ? !defender.dead : true;
      if (aimAlive) {
        const ang = Math.atan2(aim.y - p.y, aim.x - p.x);
        const sp = Math.hypot(p.vx, p.vy);
        const tvx = Math.cos(ang) * sp;
        const tvy = Math.sin(ang) * sp;
        p.vx += (tvx - p.vx) * Math.min(1, p.homing * dt / 100);
        p.vy += (tvy - p.vy) * Math.min(1, p.homing * dt / 100);
      }
    }
    // Keep the render angle synced to actual travel direction (arrows store an angle
    // for sprite rotation; homing and reflection both change velocity over time).
    if (p.angle !== undefined) p.angle = Math.atan2(p.vy, p.vx);
    // Orbs maintain constant 120 speed (homing only steers, doesn't accelerate)
    if (p.kind === 'orb') {
      const sp = Math.hypot(p.vx, p.vy) || 0.001;
      p.vx = p.vx / sp * 120;
      p.vy = p.vy / sp * 120;
      p.spin = (p.spin || 0) + dt * 6;
    }
    // Hex: fast bouncing bolt, constant 280 speed, ticks spin for trail effect
    if (p.kind === 'hex') {
      const sp = Math.hypot(p.vx, p.vy) || 0.001;
      p.vx = p.vx / sp * 280;
      p.vy = p.vy / sp * 280;
      p.spin = (p.spin || 0) + dt * 12;
    }
    // Any homing projectile with a cruise speed recorded (lightning, parried
    // projectiles) — re-normalise so homing can never stall them on a hard turn.
    if (p.cruise && p.kind !== 'coin') {
      const sp = Math.hypot(p.vx, p.vy) || 0.001;
      p.vx = p.vx / sp * p.cruise;
      p.vy = p.vy / sp * p.cruise;
    }
    // Coins (Gambler) — hold a constant cruise speed. Homing steers the
    // velocity, and during a hard turn (e.g. a Nova coin reversing to
    // converge) the blend would otherwise pass through near-zero and the coin
    // would visibly stall. Re-normalising to `cruise` keeps it always moving.
    if (p.kind === 'coin') {
      const sp = Math.hypot(p.vx, p.vy) || 0.001;
      const cruise = p.cruise || sp;
      p.vx = p.vx / sp * cruise;
      p.vy = p.vy / sp * cruise;
      p.spin = (p.spin || 0) + dt * 9;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === 'hex') {
      // Bounce off walls, decrement bounce count, despawn when out of bounces
      let bounced = false;
      if (p.x < p.size) { p.x = p.size; p.vx = -p.vx; bounced = true; }
      if (p.x > w - p.size) { p.x = w - p.size; p.vx = -p.vx; bounced = true; }
      if (p.y < p.size) { p.y = p.size; p.vy = -p.vy; bounced = true; }
      if (p.y > h - p.size) { p.y = h - p.size; p.vy = -p.vy; bounced = true; }
      if (bounced) {
        p.bounces -= 1;
        if (p.bounces < 0) return false;
      }
    } else if (!p.noEdgeDespawn) {
      if (p.x < 0 || p.x > w || p.y < 0 || p.y > h) return false;
    } else {
      // Orbs clamp to arena (homing pulls them back inside)
      if (p.x < p.size) p.x = p.size;
      if (p.x > w - p.size) p.x = w - p.size;
      if (p.y < p.size) p.y = p.size;
      if (p.y > h - p.size) p.y = h - p.size;
    }
    const target = p.team === 'red' ? blue : red;
    // DOPPELGANGER: a closer decoy intercepts the projectile (any kind) before
    // it reaches the real fighter — decoy is consumed, projectile despawns,
    // parry is never offered. The phantom "swallowed" the shot.
    if (tryHitDecoy(p, target, FIGHTER_SIZE + p.size)) return false;
    if (!target.dead && dist(p, target) < FIGHTER_SIZE + p.size) {
      // Duelist parry: flip the projectile back at the attacker
      if (target.ability === 'riposte' && target.parryTimer > 0) {
        p.team = target.team;
        p.vx = -p.vx;
        p.vy = -p.vy;
        p.life = Math.max(p.life, 1.5);
        if (p.homing <= 0) { p.homing = 25; p.cruise = Math.hypot(p.vx, p.vy); }
        return true; // keep alive, flipped — angle re-syncs to velocity next frame
      }
      // Cannoneer BOMBARD — explode on contact. A direct hit IS the max damage (so the
      // card stat matches what lands); falloff is the splash mechanic and only applies
      // to LANDINGS (the life-expire path below), where the enemy can be near-but-not-
      // touched by the blast.
      if (p.kind === 'cannon') {
        damage(target, p.dmg, 'projectile');
        spawnImpact(p.x, p.y, 'cannon', 0, 1, p.splashRadius);
        sfx('impact', { kind: 'cannon', big: 1 }, p.x);
        return false;
      }
      // Hook (Hunter): deals damage, tethers + reels the target, and triggers
      // CRIPPLING HOOK — each hook that connects slows the wounded enemy, so
      // they can't escape the next one. A flat per-hook debuff (no snowball).
      if (p.kind === 'hook') {
        target.tetherTimer = 0.3;
        target.tetherTarget = p.hookSrc;
        target.tetherStartX = target.x;
        target.tetherStartY = target.y;
        damage(target, p.dmg, 'projectile');
        // Bite clink ALWAYS fires — even on a lethal hook (otherwise the kill-cam
        // pushes in silent). No recoil here (the hook reels the target IN).
        spawnImpact(p.x, p.y, 'hook', Math.atan2(p.vy, p.vx), 0.5);
        sfx('impact', { kind: 'hook', big: 0.5 }, p.x);
        target.stunTimer = Math.max(target.stunTimer, CRIPPLE_STUN);
        return false;
      }
      // Witch hex: bonus damage if marked, then apply/refresh mark
      let dmgOut = p.dmg;
      if (p.kind === 'hex') {
        if (target.witchMarkTimer > 0) {
          dmgOut = dmgOut * (1 + p.markBonus);
        }
        target.witchMarkTimer = p.markDuration;
      }
      // Archer SHATTER — each arrow embeds first; if that pushes the cushion to
      // p.shatterAt, the whole cushion BURSTS. The trigger arrow's chip damage
      // is folded into the burst (one big damage number rather than two stacked
      // floats); the embedded arrows move to the `shattering` residue array for
      // the fly-outward scatter visual; the cushion resets.
      let shattered = false;
      if (p.kind === 'arrow' && !target.dead) {
        if (!target.embedded) target.embedded = [];
        target.embedded.push({
          timer: p.embedDur,
          angle: Math.atan2(-p.vy, -p.vx),
          born: 0.18,
        });
        target.embedFlash = 0.15;
        if (target.embedded.length >= p.shatterAt) {
          const stacks = target.embedded.length;
          dmgOut = stacks * p.shatterPerStack;
          target.shattering = target.embedded.map(s => ({
            angle: s.angle,
            timer: 0.4,
          }));
          target.embedded = [];
          target.shatterFlash = 0.3;
          shattered = true;
        }
      }
      damage(target, dmgOut, 'projectile');
      // Impact feedback (Principle 5: weight scales with damage). A per-kind burst
      // + sfx ALWAYS fire so the boom lands before the kill-cam push-in even on a
      // lethal hit; only the victim's recoil-shake needs the alive gate. On
      // SHATTER the burst centres on the body (the cushion releases at once)
      // rather than at the arrow's strike point.
      const hitAng = Math.atan2(p.vy, p.vx);
      if (shattered) {
        // Dedicated burst voice — wider crack + falling whoosh, distinct from
        // a single arrow impact. Marks the climax of the SHATTER cycle.
        spawnImpact(target.x, target.y, 'arrow', 0, 1);
        sfx('shatterBurst', null, target.x);
      } else {
        const big = Math.min(1, dmgOut / 260);
        spawnImpact(p.x, p.y, p.kind, hitAng, big);
        sfx('impact', { kind: p.kind, big: big }, p.x);
      }
      if (!target.dead) {
        const recoilBig = shattered ? 1 : Math.min(1, dmgOut / 260);
        target.recoilTimer = 0.16; target.recoilDir = hitAng; target.recoilMag = recoilBig * 13;
      }
      return false;
    }
    return true;
  });

  game.mines = game.mines.filter(m => {
    m.life -= dt;
    if (m.armed > 0) m.armed -= dt;
    if (m.life <= 0) return false;
    if (m.armed <= 0) {
      const target = m.team === 'red' ? blue : red;
      // Trigger radius extends 6px beyond contact — mines threaten passage, not just collision
      if (!target.dead && dist(m, target) < FIGHTER_SIZE + m.size + 6) {
        damage(target, m.dmg);
        spawnImpact(m.x, m.y, 'mine', 0, 1); // big explosion burst
        sfx('impact', { kind: 'mine', big: 1 }, m.x);
        // Blast RADIUS passive: knock the target away from the mine
        const bx = target.x - m.x, by = target.y - m.y;
        const bd = Math.hypot(bx, by) || 1;
        target.vx = bx / bd * 400;
        target.vy = by / bd * 400;
        target.blastTimer = 0.22;
        return false;
      }
    }
    return true;
  });

  game.hazards = game.hazards.filter(h => {
    h.timer -= dt;
    if (h.timer <= 0) return false;
    // Reaper WAKE — the only hazard kind currently in use (Cannoneer's fire pool
    // was retired when EPICENTER became the passive). Dense overlapping segments
    // gate damage on each TARGET's wakeHitCd (per-fighter, per-skeleton), not
    // a per-segment cooldown.
    const target = h.team === 'red' ? blue : red;
    if (!target.dead && target.wakeHitCd <= 0 && dist(h, target) < h.radius) {
      damage(target, h.dmg, 'hazard');
      // Soft per-tick bone hiss — same exception as `burn`: continuous damage
      // gets a sizzle cue, not a sharp crack. The wakeHitCd gate caps the rate.
      sfx('wakeTick', null, target.x);
      target.wakeHitCd = WAKE_HIT_GAP;
    }
    // WAKE also chips ENEMY skeletons in range — same WAKE_HIT_GAP rate per
    // skeleton so a dense wake patch can't double-dip per frame.
    game.skeletons = game.skeletons.filter(sk => {
      if (sk.team === h.team) return true;             // wake belongs to h.team; harm only the OTHER team's skeletons
      if (sk.wakeHitCd > 0) return true;
      if (dist(h, sk) >= h.radius + sk.size) return true;
      sk.wakeHitCd = WAKE_HIT_GAP;
      return !damageSkeleton(sk, h.dmg);                // damageSkeleton returns true on kill → remove
    });
    return true;
  });



  // Skeletons (Necromancer minions) — slow persistent melee.
  // damageSkeleton(): the ONE path all damage to a skeleton goes through. Real
  // damage numbers, a damage float, death + Bone Ward. Returns true if killed.
  function damageSkeleton(sk, dmg, forceBurst) {
    dmg = Math.round(dmg);   // honest integer — display == actual
    sk.hp -= dmg;
    sk.flash = 0.12;
    // Damage float over the skeleton, same style as fighter hits.
    spawnFloat(sk.x, sk.y - sk.size - 4, '-' + dmg,
               sk.team === 'red' ? '#ff2e2e' : '#2e9eff');
    if (sk.hp <= 0) {
      // Bone Burst: shards erupt on death — any enemy within 55px takes dmg.
      // Punishes melee fighters rushing in to kill skeletons; ranged killers are safe.
      const enemy = sk.team === 'red' ? blue : red;
      if (!enemy.dead && (forceBurst || dist(sk, enemy) < 55)) {
        damage(enemy, 170, 'bone');
        sfx('boneBurst', null, sk.x);
      } else {
        sfx('boneCrumble', null, sk.x); // dies with no one in burst range
      }
      spawnImpact(sk.x, sk.y, 'bone', 0, 0.7); // bone shards erupt on death
      return true;
    }
    return false;
  }

  game.skeletons = game.skeletons.filter(sk => {
    if (sk.hp <= 0) { return false; } // already handled by damageSkeleton
    const SKEL_IDLE_SPEED   = 55;
    const SKEL_CHARGE_SPEED = 210;
    const SKEL_CHARGE_CD    = 1.7;
    const target = sk.team === 'red' ? blue : red;

    if (sk.chargeTimer > 0) {
      // Charging — locked velocity, check for contact (incl. decoys: a
      // charging skeleton ramming into a phantom dies on impact like it would
      // against the real body, AND consumes the decoy).
      sk.chargeTimer -= dt;
      if (!sk.chargeHit) {
        const decoyHit = tryHitDecoy(sk, target, FIGHTER_SIZE + sk.size);
        if (decoyHit) {
          sk.chargeHit = true;
          sk.attackCd = SKEL_CHARGE_CD;
          sk.chargeTimer = 0;
          const ba = Math.atan2(sk.y - decoyHit.y, sk.x - decoyHit.x);
          sk.vx = Math.cos(ba) * SKEL_IDLE_SPEED;
          sk.vy = Math.sin(ba) * SKEL_IDLE_SPEED;
        } else if (!target.dead && dist(sk, target) < FIGHTER_SIZE + sk.size) {
          damage(target, sk.dmg);
          // Bone clash on the dash-attack connect + a light (chip-scaled) knockback.
          const ha = Math.atan2(target.y - sk.y, target.x - sk.x);
          spawnImpact(target.x, target.y, 'bone', ha, 0.35);
          sfx('impact', { kind: 'bone', big: 0.35 }, target.x);
          target.recoilTimer = 0.16; target.recoilDir = ha; target.recoilMag = Math.min(1, sk.dmg / 260) * 13;
          sk.chargeHit = true;
          sk.attackCd = SKEL_CHARGE_CD;
          sk.chargeTimer = 0;
          // Bounce back off the target
          const ba = Math.atan2(sk.y - target.y, sk.x - target.x);
          sk.vx = Math.cos(ba) * SKEL_IDLE_SPEED;
          sk.vy = Math.sin(ba) * SKEL_IDLE_SPEED;
        }
      }
      if (sk.chargeTimer <= 0) sk.attackCd = SKEL_CHARGE_CD;
    } else if (sk.attackCd > 0) {
      // Idle — slow drift toward NEAREST of {target, decoys}. Decoys can pull
      // a skeleton wave off the real body (a Jester counter texture).
      sk.attackCd -= dt;
      const aim = pickTarget(sk, target);
      if (aim === target ? !target.dead : true) {
        const ang = Math.atan2(aim.y - sk.y, aim.x - sk.x);
        sk.vx = Math.cos(ang) * SKEL_IDLE_SPEED;
        sk.vy = Math.sin(ang) * SKEL_IDLE_SPEED;
      }
    } else {
      // Launch charge — lock aim at the picked target (real or decoy).
      const aim = pickTarget(sk, target);
      if (aim === target ? !target.dead : true) {
        const ang = Math.atan2(aim.y - sk.y, aim.x - sk.x);
        sk.vx = Math.cos(ang) * SKEL_CHARGE_SPEED;
        sk.vy = Math.sin(ang) * SKEL_CHARGE_SPEED;
        sk.chargeTimer = 0.65;
        sk.chargeHit = false;
      }
    }

    sk.x += sk.vx * dt;
    sk.y += sk.vy * dt;
    sk.spin = (sk.spin || 0) + dt * (sk.chargeTimer > 0 ? 14 : 3);
    if (sk.x < sk.size) { sk.x = sk.size; sk.vx = Math.abs(sk.vx); }
    if (sk.x > w - sk.size) { sk.x = w - sk.size; sk.vx = -Math.abs(sk.vx); }
    if (sk.y < sk.size) { sk.y = sk.size; sk.vy = Math.abs(sk.vy); }
    if (sk.y > h - sk.size) { sk.y = h - sk.size; sk.vy = -Math.abs(sk.vy); }
    if (sk.hitCd > 0) sk.hitCd -= dt;
    if (sk.wakeHitCd > 0) sk.wakeHitCd -= dt;
    if (sk.flash > 0) sk.flash -= dt;
    return true;
  });

  // --- Damage TO skeletons. All routed through damageSkeleton() — no per-
  // ability special-casing, and each attacker deals its REAL damage. ---

  // Melee strikes — one table covers every dash-in-and-strike ability. Each
  // entry: the ability id, the timer that marks its active strike window, and
  // the bonus reach past the fighter+skeleton radii. The fighter's own `dmg`
  // stat is the damage. A per-skeleton i-frame makes one strike land once.
  const MELEE_CLEAVE = [
    { ability: 'sword',   timer: 'swingTimer', reach: 12 }, // Knight
    { ability: 'riposte', timer: 'swingTimer', reach: 10 }, // Duelist
    { ability: 'tackle',  timer: 'dashTimer',  reach: 0  }, // Berserker
    { ability: 'sweep',   timer: 'sweepTimer', reach: 14 }, // Reaper
  ];
  [red, blue].forEach(f => {
    if (f.dead) return;
    const m = MELEE_CLEAVE.find(e => e.ability === f.ability);
    if (!m || (f[m.timer] || 0) <= 0) return;
    game.skeletons = game.skeletons.filter(sk => {
      if (sk.team === f.team || sk.hitCd > 0) return true;
      if (dist(f, sk) < FIGHTER_SIZE + sk.size + m.reach) {
        sk.hitCd = MELEE_SKEL_IFRAME;
        if (damageSkeleton(sk, f.dmg)) return false;
      }
      return true;
    });
  });

  // Projectiles — each carries its own real dmg. Orbs hover in place so they
  // need the full MELEE_SKEL_IFRAME to avoid draining every frame; fast
  // pass-through projectiles (coins, arrows, etc.) use a minimal 1-frame
  // guard so rapid volleys (e.g. Fortune's Barrage) can each land.
  game.projectiles.forEach(p => {
    game.skeletons = game.skeletons.filter(sk => {
      if (sk.team === p.team || sk.hitCd > 0) return true;
      if (dist(p, sk) < sk.size + p.size) {
        sk.hitCd = p.kind === 'orb' ? MELEE_SKEL_IFRAME : 0.05;
        if (damageSkeleton(sk, p.dmg)) return false;
      }
      return true;
    });
  });

  // Mines — full mine damage on detonation contact.
  game.mines.forEach(m => {
    if (m.armed > 0) return;
    game.skeletons = game.skeletons.filter(sk => {
      if (sk.team === m.team || sk.hitCd > 0) return true;
      if (dist(m, sk) < sk.size + m.size + 4) {
        sk.hitCd = MELEE_SKEL_IFRAME;
        if (damageSkeleton(sk, m.dmg)) return false;
      }
      return true;
    });
  });


  // Age transient impact bursts (visual only; empty in headless).
  game.impacts = game.impacts.filter(im => { im.life -= dt; return im.life > 0; });

  game.floatTexts = game.floatTexts.filter(ft => {
    // Debounced damage floats: while "open" the float holds position (doesn't
    // rise or decay) but its `age` advances so each hit's punch animation
    // plays. Once BATCH_GAP ms pass with no new hit the burst is over and the
    // float is released to decay + float off (it does NOT re-punch on release
    // — the last hit's punch already fired).
    if (ft.open) {
      if (ft.age != null) ft.age += dt;
      // Drain floats track the target — the channel lasts long enough that a
      // fixed number would visibly detach as the target bounces around.
      if (ft.follow) {
        ft.x = ft.follow.x;
        ft.y = ft.follow.y - FIGHTER_SIZE;
      }
      if (performance.now() - ft.lastHit > (ft.gap || BATCH_GAP)) {
        ft.open = false;
      }
      return true; // held in place, alive, until released
    }
    ft.life -= dt;
    if (ft.life <= 0) return false;
    ft.y += ft.vy * dt;
    if (ft.age != null) ft.age += dt;
    return true;
  });

  updateHp();
}
