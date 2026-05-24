// === END GAME ===============================================================
// Triggered from damage() when an HP hits 0. Shows winner overlay after a
// brief delay so the death VFX can play out.
// ============================================================================

function endGame() {
  if (game.winner) return;
  game.winner = game.red.dead ? game.blue : game.red;
  // The outcome is decided — clear every hazard still in play so a stray
  // projectile, mine, skeleton, hazard, or minion can't kill the victor
  // during the (now wider) finish window. The new winner overlay is a
  // transparent vignette over the arena, so a vanished-winner sprite
  // (from drawFighter's dead-fighter early-return) would be visible and
  // wreck the celebration — keep all post-mortem damage off.
  game.projectiles = [];
  game.skeletons = [];
  game.hazards = [];
  // Jester DOPPELGANGER — when Jester dies, her remaining phantom decoys
  // shatter (mirrors the on-consume visual). Without this they'd silently
  // sit in the arena during the finish window, confusing the closing
  // tableau. Only the LOSER's decoys shatter — if Jester won, her decoys
  // continue to live out their natural lifetime (still part of her kit).
  const loser = game.red.dead ? game.red : game.blue;
  if (loser.decoys && loser.decoys.length) {
    loser.decoys.forEach(d => {
      if (!d.dead && !headless && game.impacts) {
        game.impacts.push({
          x: d.x, y: d.y,
          kind: 'decoyShatter',
          dir: 0, mag: 0.5, radius: 0,
          life: 0.30, maxLife: 0.30,
        });
      }
    });
    loser.decoys = [];
  }
  // Resolve any still-"open" debounced damage float (e.g. the killing blow's)
  // so it punches and floats off normally instead of freezing mid-burst.
  // Resolve open floats and clamp life so they expire before the loop stops.
  // floatTexts use sim time; with timeScale=0.18 a 0.8s float needs ~4.4s real
  // time to expire, but the finish window is ~2s — so clamp to 0.25 sim-seconds
  // (~1.4s real at 0.18x), comfortably within the finish window.
  game.floatTexts.forEach(ft => {
    if (ft.open) { ft.open = false; ft.age = 0; }
    ft.life = Math.min(ft.life, 0.25);
  });
  // Cancel any in-progress channel/strike on either fighter for the same reason.
  [game.red, game.blue].forEach(f => {
    f.drainTimer = 0; f.drainTarget = null;
    f.iaiStrike = 0; f.iaiWindup = 0;
    f.tetherTimer = 0; f.tetherTarget = null;
  });
  // Cinematic finish: slow-mo ramp, kill-cam push-in, then the shatter. The body
  // holds frozen until the kill-cam arrives; then the death + "K.O." + camera-snap
  // flash + sound all fire together (see the finish block in draw()) — nothing
  // leads the visual.
  game.finishTimer = FINISH_WINDOW;
  game.timeScale = 0.18;        // drops to near-frozen, ramps back up over the window
  shake(14);                    // the heaviest shake in the game — it's the K.O.
  game.koTimer = FINISH_WINDOW; // death-block lifetime; finishTimer ends the finish
  // (flashFrame, the koHit boom, and the death voice are all triggered at the
  //  shatter in draw(), not here at the kill instant.)
}

