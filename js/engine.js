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

// The simulation always runs in a fixed 360x360 reference space, so a fight
// is device-independent (and the headless hunt reproduces exactly). The
// renderer scales this reference space to whatever the actual canvas size is.
const ARENA = 360;
function resizeCanvas() {
  const r = canvas.getBoundingClientRect();
  canvas.width = r.width * window.devicePixelRatio;
  canvas.height = r.height * window.devicePixelRatio;
  // Map 360 reference units onto the canvas's CSS pixels, then DPR on top.
  const scale = (r.width / ARENA) * window.devicePixelRatio;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
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
// Arena is the fixed 360x360 square (the live canvas is always this arena).
function buildGame(redT, blueT) {
  const w = 360, h = 360;
  fightToken++;
  return {
    w, h,
    token: fightToken,
    red: makeFighter(redT, 'red', w * 0.2, h * 0.5),
    blue: makeFighter(blueT, 'blue', w * 0.8, h * 0.5),
    projectiles: [], mines: [], hazards: [], skeletons: [], particles: [], floatTexts: [],
    over: false, finishTimer: 0, winner: null, elapsed: 0, ringRadius: 999, lastT: performance.now(),
    timeScale: 1, koTimer: 0, acc: 0,
    shakeTime: 0, shakeMag: 0, hitStop: 0, flashFrame: 0,
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

function makeFighter(t, team, x, y) {
  const a = rng() * Math.PI * 2;
  return {
    ...t, team, maxHp: t.hp, x, y,
    baseSpeed: t.speed,
    vx: Math.cos(a) * t.speed,
    vy: Math.sin(a) * t.speed,
    cdTimer: t.cd * 0.5 + rng() * 0.5,
    swingTimer: 0, dashTimer: 0, dashHit: false, blastTimer: 0, flash: 0, negateFlash: 0, dead: false,
    aimTimer: 0, aimAngle: 0, aimAbility: null,
    shotCount: 0, trail: [],
    slowTimer: 0, stunTimer: 0,
    // Jester
    dodgeReady: true, dodgeTimer: 0, dodgeInvuln: 0, blinkFx: 0,
    blinkFromX: 0, blinkFromY: 0,
    // Duelist
    lastX: x, lastY: y,
    parryTimer: 0, counterAnim: 0, counterDir: 0,
    // Reaper
    sweepTimer: 0, sweepHit: false,
    // Ronin
    iaiWindup: 0, iaiStrike: 0, iaiHit: false, iaiTrail: null,
    // Witch mark target timer (any fighter can carry the mark)
    witchMarkTimer: 0,
    // Hunter tether state — the 0.3s reel-in tween after a hook connects.
    tetherTimer: 0, tetherTarget: null, tetherStartX: 0, tetherStartY: 0,
    // Warlock drain beam channel state
    drainTimer: 0, drainTickTimer: 0, drainTarget: null, drainElapsed: 0, drainWhiffed: false,
    // Gambler — WILDCARD die roll. gamblerRoll is the face shown (1-6) while
    // the die tumbles + after it settles; gamblerShots is a queue of timed
    // coin shots (for the faces that fire over time); gamblerRefund flags a
    // low roll (1-2) that halves the next cooldown.
    gamblerRoll: 0, gamblerShots: [], gamblerRefund: false, gamblerSpeedTimer: 0, loadedTimer: 0,
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
  const spriteF = { size: W * 0.26, color: t.color, accent: t.accent, shape: t.shape };
  c.save();
  c.translate(cx, cy);
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
  document.getElementById('hp-text-red').textContent = `${Math.max(0,Math.ceil(game.red.hp))} / ${game.red.maxHp}`;
  document.getElementById('hp-text-blue').textContent = `${Math.max(0,Math.ceil(game.blue.hp))} / ${game.blue.maxHp}`;
  // Fight clock — counts down to the closing ring (0:20), then shows FOG while
  // the ring is active. Turns red and pulses once the fog is closing in.
  const clock = document.getElementById('fight-clock');
  if (clock) {
    const elapsed = game.elapsed || 0;
    if (elapsed < 20) {
      const secs = Math.ceil(20 - elapsed);
      clock.textContent = '0:' + (secs < 10 ? '0' : '') + secs;
      clock.classList.remove('urgent');
    } else {
      clock.textContent = 'FOG';
      clock.classList.add('urgent');
    }
  }
  updateStatuses();
}

// Collect the active status badges for a fighter. Each badge is {label, color}.
function fighterStatuses(f) {
  const out = [];
  // Berserker — Bloodrage active below 50% HP
  if (f.ability === 'tackle' && f.hp < f.maxHp * 0.5 && !f.dead) {
    out.push({ label: 'RAGE', color: '#ff2e2e' });
  }
  // Gambler — LOADED DICE: a low roll has rushed the next cooldown
  if (f.ability === 'wildcard' && f.loadedTimer > 0 && !f.dead) {
    out.push({ label: 'LOADED', color: '#ffd23d' });
  }
  // Archer — VOLLEY: the next shot will fan 4 arrows (every 4th shot)
  if (f.ability === 'arrow' && (f.shotCount % 4 === 3) && !f.dead) {
    out.push({ label: 'VOLLEY', color: '#3dff8a' });
  }
  // Ronin — Iai windup in progress
  if (f.iaiWindup > 0) {
    out.push({ label: 'WINDUP', color: '#e8c020' });
  }
  // Warlock — drain beam actively channeling
  if (f.drainTimer > 0) {
    out.push({ label: 'DRAINING', color: '#c050ff' });
  }
  // Witch's Mark — this fighter is marked, takes +50% damage
  if (f.witchMarkTimer > 0) {
    out.push({ label: 'MARKED', color: '#7dff3d' });
  }
  // Slowed — Hunter's CRIPPLING HOOK wound. 40% slower.
  if (f.slowTimer > 0 && !f.dead) {
    out.push({ label: 'SLOWED', color: '#c89060' });
  }
  // Stunned — frozen by the Hunter's CRIPPLING HOOK, can't move or act
  if (f.stunTimer > 0 && !f.dead) {
    out.push({ label: 'STUNNED', color: '#ffd23d' });
  }
  // NOTE: Wizard/Jester/Duelist defensive passives no longer get a "DOWN"
  // badge — their ready-state is shown by the solid ring around the fighter
  // (present = armed, absent = down), so a badge would just double-report.
  // Caught in the closing-ring fog
  if (game.elapsed > 20 && !f.dead) {
    const dc = Math.hypot(f.x - game.w / 2, f.y - game.h / 2);
    if (dc > (game.ringRadius || 999)) {
      out.push({ label: 'FOG', color: '#d25aff' });
    }
  }
  return out;
}

function renderStatusRow(elId, statuses) {
  const el = document.getElementById(elId);
  if (!el) return;
  // Rebuild only when the set of labels changed — avoids thrashing the DOM each frame.
  const key = statuses.map(s => s.label).join(',');
  if (el.dataset.key === key) return;
  el.dataset.key = key;
  el.innerHTML = '';
  statuses.forEach(s => {
    const b = document.createElement('div');
    b.className = 'status-badge';
    b.textContent = s.label;
    b.style.color = s.color;
    b.style.border = '1px solid ' + s.color;
    el.appendChild(b);
  });
}

function updateStatuses() {
  if (!game) return;
  renderStatusRow('status-red', fighterStatuses(game.red));
  renderStatusRow('status-blue', fighterStatuses(game.blue));
}

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
const SKEL_HP = 18;
const MELEE_SKEL_IFRAME = 0.35;

// Hunter CRIPPLING HOOK: when a hook connects, the wounded enemy is STUNNED
// for this long — frozen, unable to use their ability. This is the Hunter's
// answer to single-hit counters: a stunned Reaper can't spin, a stunned Jester
// can't blink, a stunned Duelist can't riposte. Must stay well under the hook
// cooldown (1.5s) or it becomes a perma-lock. Balance lever.
const CRIPPLE_STUN = 0.4;

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
  let simDt = realDt * game.timeScale;
  if (game.hitStop > 0) {
    game.hitStop -= realDt;
    simDt = 0;
  }
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
}
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }


// ============================================================================
// === STEP (per-frame simulation) ============================================
// Runs every frame at variable dt. Handles fighter movement, passive ticks
// (regen, bloodrage, wakes, shield/dodge recharge), dash & swing windows,
// body collisions, ability cooldowns, projectiles, mines, particles.
// This is the heart of the game loop.
// ============================================================================

function step(dt) {
  const { w, h, red, blue } = game;

  // Closing ring: after RING_START the safe zone shrinks toward arena center.
  // Fighters outside it take escalating "fog" damage. Forces a KO finish —
  // the 30s cap is now just an unreachable backstop.
  if (!game.winner) {
    game.elapsed += dt;
    const RING_START = 20, RING_FULL = 28;
    const arenaR = Math.hypot(w, h) / 2;
    if (game.elapsed > RING_START) {
      const prog = Math.min(1, (game.elapsed - RING_START) / (RING_FULL - RING_START));
      game.ringRadius = arenaR * (1 - prog);
      let fogDps = 3 + prog * 9;
      if (game.elapsed > RING_FULL) fogDps += (game.elapsed - RING_FULL) * 20;
      [red, blue].forEach(f => {
        if (f.dead) return;
        const dc = Math.hypot(f.x - w / 2, f.y - h / 2);
        if (dc > game.ringRadius) damage(f, fogDps * dt, 'fog');
      });
    } else {
      game.ringRadius = arenaR;
    }
  }

  [red, blue].forEach(f => {
    if (f.dead) return;
    // Stunned fighters (Hunter's CRIPPLING HOOK) are frozen — no self-movement.
    // The hook's tether reel still repositions them (it sets x/y directly).
    // NOTE: only movement is frozen — passives below still tick (a stunned
    // Priest keeps regenerating, a stunned Berserker keeps Bloodrage).
    if (f.stunTimer <= 0) {
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      bounce(f, w, h);
    }

    // ---- PASSIVES ----
    // Priest: Divine Grace — regen 1.0 hp/s
    if (f.ability === 'lightning' && f.hp < f.maxHp) {
      f.hp = Math.min(f.maxHp, f.hp + 1.0 * dt);
    }
    // Berserker: Bloodrage — +30% speed when below 50% hp.
    // Apply via an effective speed multiplier (we adjust .speed at runtime; revert after).
    if (f.ability === 'tackle') {
      const rageActive = f.hp < f.maxHp * 0.5;
      const targetSpeed = rageActive ? f.baseSpeed * 1.3 : f.baseSpeed;
      // Renormalize current velocity to new speed when not dashing
      if (f.dashTimer <= 0) {
        const sp = Math.hypot(f.vx, f.vy) || 1;
        f.vx = f.vx / sp * targetSpeed;
        f.vy = f.vy / sp * targetSpeed;
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
    // Jester: Uncanny Dodge recharge + invuln tick
    if (f.ability === 'blink') {
      if (!f.dodgeReady) {
        f.dodgeTimer -= dt;
        if (f.dodgeTimer <= 0) f.dodgeReady = true;
      }
      if (f.dodgeInvuln > 0) f.dodgeInvuln -= dt;
      if (f.blinkFx > 0) f.blinkFx -= dt;
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
        // Berserker: the tackle is a pure collision charge — crashing in IS the hit.
        if (!enemy.dead && dist(f, enemy) < FIGHTER_SIZE + FIGHTER_SIZE) {
          damage(enemy, f.dmg, undefined, f);
          f.dashTimer = 0;
          const a = Math.atan2(f.vy, f.vx);
          f.vx = Math.cos(a) * f.speed;
          f.vy = Math.sin(a) * f.speed;
        }
      } else {
        // Knight / Duelist / Reaper: the dash only closes distance. The strike is
        // LIVE for the whole dash — the first frame the enemy is within this
        // fighter's strike range, the single hit lands (once per dash).
        if (!f.dashHit && !enemy.dead && dist(f, enemy) < FIGHTER_SIZE + FIGHTER_SIZE + f.strikeReach) {
          const dealtDmg = damage(enemy, f.dmg, undefined, f);
          // Reaper: Blood Harvest — heal 50% of the damage dealt.
          // Guard !f.dead: the counter inside damage() can kill the Reaper before we get here.
          if (f.ability === 'sweep' && !f.dead) {
            const healAmt = Math.round((dealtDmg || 0) * 0.5);
            f.hp = Math.min(f.maxHp, f.hp + healAmt);
            sfx('heal', null, f.x);
            spawnFloat(f.x, f.y - FIGHTER_SIZE - 12, '+' + healAmt, healColor(f));
            spawnParticles(f.x, f.y, 5, '#aa0000', 'shard');
          }
          f.dashHit = true;
          f.dashTimer = 0;
          const a = Math.atan2(f.vy, f.vx);
          f.vx = Math.cos(a) * f.speed;
          f.vy = Math.sin(a) * f.speed;
        }
      }
    }

    if (f.swingTimer > 0) {
      // Swing/lunge follow-through — VFX timing only; damage is the single
      // in-range hit landed during the dash.
      f.swingTimer -= dt;
      if (f.swingTimer <= 0) f.swingHit = false;
    }

    // Reaper: scythe sweep — visual spin only; damage + Blood Harvest happen on
    // the single in-range hit landed during the dash.
    if (f.ability === 'sweep' && f.sweepTimer > 0) {
      f.sweepTimer -= dt;
      // Trail blood-mist particles while spinning
      if (vrng() < 0.2) {
        const ra = vrng() * Math.PI * 2;
        const rr = FIGHTER_SIZE + 10 + vrng() * 6;
        spawnParticles(f.x + Math.cos(ra) * rr, f.y + Math.sin(ra) * rr, 1, '#aa0000', 'streak');
      }
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
          spawnParticles(f.x, f.y, 16, '#c89060', 'shard');
          f.tetherTarget = null;
        }
      } else {
        f.tetherTimer = 0;
        f.tetherTarget = null;
      }
    }

    // Witch mark timer decay
    if (f.witchMarkTimer > 0) f.witchMarkTimer -= dt;

    // Warlock: drain beam channel. Ticks f.dmg every 0.2s while the enemy stays in
    // range, slowing them (ENERVATE passive) and healing f.dmg * 0.35 per tick.
    if (f.drainTimer > 0) {
      f.drainTimer -= dt;
      f.drainElapsed += dt;
      const t = f.drainTarget;
      if (t && !t.dead) {
        const d = Math.hypot(t.x - f.x, t.y - f.y);
        if (d > 165) {
          f.drainTimer = 0;
          f.drainTarget = null;
        } else {
          t.slowTimer = Math.max(t.slowTimer, 0.3); // tethered targets are slowed
          f.drainTickTimer -= dt;
          if (f.drainTickTimer <= 0) {
            f.drainTickTimer = 0.2;
            damage(t, f.dmg, 'drain');
            f.hp = Math.min(f.maxHp, f.hp + f.dmg * 0.35);
            spawnParticles(t.x, t.y, 4, '#c050ff', 'spark');
          }
        }
      } else {
        f.drainTimer = 0;
        f.drainTarget = null;
      }
    }

    // Gambler: LOADED DICE — counts down the rushed-cooldown window after a
    // low roll, purely so the LOADED status badge knows when to show.
    if (f.loadedTimer > 0) f.loadedTimer -= dt;

    // Ronin: iai windup + teleport-strike
    if (f.ability === 'iai') {
      const enemy = f === red ? blue : red;
      if (f.iaiWindup > 0) {
        f.iaiWindup -= dt;
        if (f.iaiWindup <= 0) {
          f.iaiStrike = 0.15;
          sfx('iaiStrike');
          // Capture origin for the visual trail
          const startX = f.x;
          const startY = f.y;
          // Teleport-step toward enemy (capped at 120 units) for the strike
          const dx = enemy.x - f.x;
          const dy = enemy.y - f.y;
          const d = Math.hypot(dx, dy);
          const strikeReach = FIGHTER_SIZE + FIGHTER_SIZE + 22;
          const maxStep = 120;
          if (d > strikeReach) {
            const stepDist = Math.min(d - strikeReach, maxStep);
            f.x += dx / d * stepDist;
            f.y += dy / d * stepDist;
          }
          const ang = Math.atan2(dy, dx);
          f.vx = Math.cos(ang) * f.speed;
          f.vy = Math.sin(ang) * f.speed;
          // Store dash trail for the renderer (fades over the strike window)
          f.iaiTrail = { x1: startX, y1: startY, x2: f.x, y2: f.y };
          spawnParticles(f.x, f.y, 20, '#e8c020', 'streak');
          spawnParticles(startX, startY, 12, '#e8c020', 'streak');
          // Cleave everything along the dash line — skeletons and the enemy
          // fighter if they fall within the slash width of the path segment.
          const sdx = f.x - startX, sdy = f.y - startY;
          const sLen2 = sdx*sdx + sdy*sdy;
          const segDist = (px, py) => {
            if (sLen2 === 0) return Math.hypot(px - startX, py - startY);
            const t = Math.max(0, Math.min(1, ((px-startX)*sdx + (py-startY)*sdy) / sLen2));
            return Math.hypot(px - (startX + t*sdx), py - (startY + t*sdy));
          };
          const slashReach = FIGHTER_SIZE + 10;
          game.skeletons = game.skeletons.filter(sk => {
            if (sk.team === f.team) return true;
            if (segDist(sk.x, sk.y) < slashReach + sk.size) {
              // forceBurst=true: Ronin passed through the skeleton so burst always fires
              if (damageSkeleton(sk, f.dmg, true)) return false;
            }
            return true;
          });
          // Mines along the dash path detonate on the Ronin
          game.mines = game.mines.filter(m => {
            if (m.team === f.team || m.armed > 0) return true;
            if (segDist(m.x, m.y) < FIGHTER_SIZE + m.size + 6) {
              damage(f, m.dmg);
              spawnParticles(m.x, m.y, 12, '#3a2a1a', 'smoke');
              spawnParticles(m.x, m.y, 10, '#ff8c1a', 'shard');
              return false;
            }
            return true;
          });
          if (!enemy.dead && segDist(enemy.x, enemy.y) < slashReach + FIGHTER_SIZE) {
            damage(enemy, f.dmg, undefined, f);
            f.iaiHit = true;
            f.cdTimer = f.cd * 0.5;
          }
        }
      } else if (f.iaiStrike > 0) {
        f.iaiStrike -= dt;
        if (!f.iaiHit && !enemy.dead && dist(f, enemy) < FIGHTER_SIZE + FIGHTER_SIZE + 25) {
          damage(enemy, f.dmg, undefined, f);
          f.iaiHit = true;
          f.cdTimer = f.cd * 0.5; // IAIJUTSU — clean strike halves the cooldown
        }
        if (f.iaiStrike <= 0) { f.iaiHit = false; f.iaiTrail = null; }
      }
    }

    if (f === red) {
      const enemy = blue;
      if (!enemy.dead && dist(f, enemy) < FIGHTER_SIZE + FIGHTER_SIZE) {
        const ang = Math.atan2(f.y - enemy.y, f.x - enemy.x);
        f.vx = Math.cos(ang) * f.speed;
        f.vy = Math.sin(ang) * f.speed;
        enemy.vx = -Math.cos(ang) * enemy.speed;
        enemy.vy = -Math.sin(ang) * enemy.speed;
        // Contact damage removed — bodies bounce apart but deal no chip.
        // All damage now comes from abilities and the closing ring.
      }
    }

    f.cdTimer -= dt;
    // Warlock can't recast while a drain beam is still channeling.
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
    if (f.blastTimer > 0) f.blastTimer -= dt;
    // Tick slow timer
    if (f.slowTimer > 0) f.slowTimer -= dt;
    // Tick stun timer (Hunter's CRIPPLING HOOK)
    if (f.stunTimer > 0) f.stunTimer -= dt;
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
    const targetSpeed = f.slowTimer > 0 ? f.speed * 0.6 : f.speed;
    const sp = Math.hypot(f.vx, f.vy);
    if (sp > 0.01) {
      f.vx = f.vx / sp * targetSpeed;
      f.vy = f.vy / sp * targetSpeed;
    }
  });

  game.projectiles = game.projectiles.filter(p => {
    p.life -= dt;
    if (p.life <= 0) return false;
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
      const target = p.team === 'red' ? blue : red;
      if (!target.dead) {
        const ang = Math.atan2(target.y - p.y, target.x - p.x);
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
        spawnParticles(p.x, p.y, 2, '#7dff3d', 'spark');
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
    if (!target.dead && dist(p, target) < FIGHTER_SIZE + p.size) {
      // Duelist parry: flip the projectile back at the attacker
      if (target.ability === 'riposte' && target.parryTimer > 0) {
        p.team = target.team;
        p.vx = -p.vx;
        p.vy = -p.vy;
        p.life = Math.max(p.life, 1.5);
        if (p.homing <= 0) { p.homing = 25; p.cruise = Math.hypot(p.vx, p.vy); }
        spawnParticles(target.x, target.y, 14, '#c0c0e8', 'spark');
        return true; // keep alive, flipped — angle re-syncs to velocity next frame
      }
      // Hook (Hunter): deals damage, tethers + reels the target, and triggers
      // CRIPPLING HOOK — each hook that connects slows the wounded enemy, so
      // they can't escape the next one. A flat per-hook debuff (no snowball).
      if (p.kind === 'hook') {
        target.tetherTimer = 0.3;
        target.tetherTarget = p.hookSrc;
        target.tetherStartX = target.x;
        target.tetherStartY = target.y;
        spawnParticles(p.x, p.y, 10, '#c89060', 'spark');
        damage(target, p.dmg, 'projectile');
        target.stunTimer = Math.max(target.stunTimer, CRIPPLE_STUN);
        return false;
      }
      // Witch hex: bonus damage if marked, then apply/refresh mark
      let dmgOut = p.dmg;
      if (p.kind === 'hex') {
        if (target.witchMarkTimer > 0) {
          dmgOut = dmgOut * 1.5;
        }
        target.witchMarkTimer = 3.0;
      }
      damage(target, dmgOut, 'projectile');
      const pColor = p.kind === 'lightning' ? '#ffe83d' : p.kind === 'cannon' ? '#ff8c1a' : (p.kind === 'hex' ? '#7dff3d' : '#3dff8a');
      const pStyle = p.kind === 'lightning' ? 'cross' : 'streak';
      spawnParticles(p.x, p.y, 5, pColor, pStyle);
      // Cannoneer: INCENDIARY ROUND — cannon hits leave a burning impact zone.
      if (p.kind === 'cannon') {
        game.hazards.push({ x: p.x, y: p.y, radius: 40, timer: 1.5, maxTimer: 1.5, tickCd: 0, team: p.team, dps: 2 });
        // A tight cluster of hot embers at the center — the zone glow in arena.js
        // shows the area; these just mark where the round landed.
        spawnParticles(p.x, p.y, 6, '#ff6010', 'streak');
        spawnParticles(p.x, p.y, 3, '#ffb040', 'streak');
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
        // Blast RADIUS passive: knock the target away from the mine
        const bx = target.x - m.x, by = target.y - m.y;
        const bd = Math.hypot(bx, by) || 1;
        target.vx = bx / bd * 400;
        target.vy = by / bd * 400;
        target.blastTimer = 0.22;
        spawnParticles(m.x, m.y, 12, '#3a2a1a', 'smoke');
        spawnParticles(m.x, m.y, 10, '#ff8c1a', 'shard');
        return false;
      }
    }
    return true;
  });

  game.hazards = game.hazards.filter(h => {
    h.timer -= dt;
    if (h.timer <= 0) return false;
    // Tick every 0.5s rather than every frame — keeps damage() call count low in the sim.
    h.tickCd -= dt;
    if (h.tickCd <= 0) {
      h.tickCd = 0.5;
      const target = h.team === 'red' ? blue : red;
      if (!target.dead && dist(h, target) < h.radius) {
        damage(target, h.dps * 0.5, 'hazard'); // 0.5s × 4 dps = 2.0 dmg per tick
      }
      // Scatter embers across the zone — Math.random() so it doesn't touch the seeded RNG streams.
      for (let i = 0; i < 4; i++) {
        const ang = Math.random() * Math.PI * 2;
        const r   = Math.random() * h.radius * 0.85;
        spawnParticles(h.x + Math.cos(ang) * r, h.y + Math.sin(ang) * r, 1, i < 2 ? '#ff6010' : '#ffb040', 'streak');
      }
    }
    return true;
  });



  // Skeletons (Necromancer minions) — slow persistent melee.
  // damageSkeleton(): the ONE path all damage to a skeleton goes through. Real
  // damage numbers, a damage float, death + Bone Ward. Returns true if killed.
  function damageSkeleton(sk, dmg, forceBurst) {
    sk.hp -= dmg;
    sk.flash = 0.12;
    // Damage float over the skeleton, same style as fighter hits.
    spawnFloat(sk.x, sk.y - sk.size - 4, '-' + Math.ceil(dmg),
               sk.team === 'red' ? '#ff2e2e' : '#2e9eff');
    spawnParticles(sk.x, sk.y, 4, sk.team === 'red' ? '#ff6b6b' : '#6bb6ff', 'spark');
    if (sk.hp <= 0) {
      // Bone Burst: shards erupt on death — any enemy within 55px takes dmg.
      // Punishes melee fighters rushing in to kill skeletons; ranged killers are safe.
      const enemy = sk.team === 'red' ? blue : red;
      if (!enemy.dead && (forceBurst || dist(sk, enemy) < 55)) {
        damage(enemy, 17, 'bone');
        spawnBoneBurst(sk.x, sk.y);
        sfx('boneBurst', null, sk.x);
      }
      spawnParticles(sk.x, sk.y, 4, '#e8e0d0', 'shard');
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
      // Charging — locked velocity, check for contact
      sk.chargeTimer -= dt;
      if (!sk.chargeHit && !target.dead && dist(sk, target) < FIGHTER_SIZE + sk.size) {
        damage(target, sk.dmg);
        sk.chargeHit = true;
        sk.attackCd = SKEL_CHARGE_CD;
        sk.chargeTimer = 0;
        // Bounce back off the target
        const ba = Math.atan2(sk.y - target.y, sk.x - target.x);
        sk.vx = Math.cos(ba) * SKEL_IDLE_SPEED;
        sk.vy = Math.sin(ba) * SKEL_IDLE_SPEED;
      } else if (sk.chargeTimer <= 0) {
        sk.attackCd = SKEL_CHARGE_CD;
      }
    } else if (sk.attackCd > 0) {
      // Idle — slow drift toward enemy
      sk.attackCd -= dt;
      if (!target.dead) {
        const ang = Math.atan2(target.y - sk.y, target.x - sk.x);
        sk.vx = Math.cos(ang) * SKEL_IDLE_SPEED;
        sk.vy = Math.sin(ang) * SKEL_IDLE_SPEED;
      }
    } else {
      // Launch charge — lock aim at current target position
      if (!target.dead) {
        const ang = Math.atan2(target.y - sk.y, target.x - sk.x);
        sk.vx = Math.cos(ang) * SKEL_CHARGE_SPEED;
        sk.vy = Math.sin(ang) * SKEL_CHARGE_SPEED;
        sk.chargeTimer = 0.65;
        sk.chargeHit = false;
        spawnParticles(sk.x, sk.y, 3, '#e8e0d0', 'streak');
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

  game.particles = game.particles.filter(pt => {
    pt.life -= dt;
    if (pt.life <= 0) return false;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    if (pt.style === 'smoke') {
      pt.vx *= 0.9; pt.vy *= 0.9;
      pt.size += pt.grow * dt;
    } else if (pt.style === 'rune') {
      pt.vx *= 0.92; pt.vy *= 0.92;
      pt.rot += pt.vrot * dt;
    } else if (pt.style === 'cross') {
      pt.vx *= 0.96;
      // gentle upward float
    } else {
      pt.vx *= 0.94;
      pt.vy *= 0.94;
      if (pt.vrot) pt.rot += pt.vrot * dt;
    }
    return true;
  });

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
