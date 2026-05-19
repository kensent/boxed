// === END GAME ===============================================================
// Triggered from damage() when an HP hits 0. Shows winner overlay after a
// brief delay so the death VFX can play out.
// ============================================================================

function endGame() {
  if (game.winner) return;
  game.winner = game.red.dead ? game.blue : game.red;
  // The outcome is decided — clear every hazard still in play so a stray
  // projectile, mine, skeleton, or minion can't kill the victor during the
  // slow-mo finish window. (Particles/wakes are cosmetic and stay.)
  game.projectiles = [];
  game.mines = [];
  game.skeletons = [];
  // Resolve any still-"open" debounced damage float (e.g. the killing blow's)
  // so it punches and floats off normally instead of freezing mid-burst.
  game.floatTexts.forEach(ft => { if (ft.open) { ft.open = false; ft.age = 0; } });
  // Cancel any in-progress channel/strike on either fighter for the same reason.
  [game.red, game.blue].forEach(f => {
    f.drainTimer = 0; f.drainTarget = null;
    f.iaiStrike = 0; f.iaiWindup = 0;
    f.tetherTimer = 0; f.tetherTarget = null;
  });
  // Cinematic finish: slow-mo ramp + a "K.O." punch, then the overlay.
  game.finishTimer = 1.6;     // longer window so the slow-mo beat can breathe
  game.timeScale = 0.18;      // drops to near-frozen, ramps back up over the window
  game.flashFrame = 0.12;     // white camera-snap frame at the kill
  shake(14);                  // the heaviest shake in the game — it's the K.O.
  game.koTimer = 1.2;         // "K.O." graphic lifetime
  sfx('koHit');
}

function showWinnerOverlay() {
  const ov = document.getElementById('winner-overlay');
  const w = game.winner;
  if (!ov || !w) return;
  // Eyebrow + name use a CSS-var color (HTML); the canvas ring needs a real hex.
  const teamColor = w.team === 'red' ? 'var(--red)' : 'var(--blue)';
  const teamHex = w.team === 'red' ? '#ff2e2e' : '#2e9eff';
  const name = document.getElementById('winner-name');
  if (name) { name.textContent = w.name; name.style.color = teamColor; }
  const loser = game.winner === game.red ? game.blue : game.red;
  // const quoteEl = document.getElementById('winner-quote');
  // if (quoteEl) {
  //   const key = w.id + '_' + loser.id;
  //   quoteEl.textContent = VICTORY_QUOTES[key] || VICTORY_QUOTES['_default_'] || '';
  // }
  const eyebrow = document.getElementById('winner-eyebrow');
  if (eyebrow) eyebrow.style.color = teamColor;
  // Draw the victor's actual sprite into the overlay canvas
  const cnv = document.getElementById('winner-sprite');
  if (cnv) {
    const c = cnv.getContext('2d');
    const W = cnv.width, H = cnv.height;
    c.clearRect(0, 0, W, H);
    // Team-colored ring — matches the in-fight and intro sprite borders.
    c.strokeStyle = teamHex;
    c.lineWidth = 4;
    c.globalAlpha = 0.7;
    c.beginPath();
    c.arc(W / 2, H / 2, W * 0.42, 0, Math.PI * 2);
    c.stroke();
    c.globalAlpha = 1;
    // Real sprite via the shared drawShape — sized for the overlay
    const spriteF = { size: W * 0.3, color: w.color, accent: w.accent, shape: w.shape };
    c.save();
    c.translate(W / 2, H / 2);
    c.fillStyle = spriteF.color;
    drawShape(c, spriteF);
    c.restore();
  }
  // Replay the staggered slam-in animations every time the overlay opens
  ov.classList.remove('show');
  void ov.offsetWidth;
  ov.classList.add('show');
  sfx('win');
  // Auto-return to the character-select screen 3s after the overlay appears.
  // Guarded by the fight token: if the player taps RESTART (which starts a new
  // fight and bumps the token) before the timer fires, this stale timer no-ops
  // so it can't yank them out of the new fight.
  const overlayToken = fightToken;
  setTimeout(() => {
    if (fightToken === overlayToken) returnToSelect();
  }, 3000);
}

