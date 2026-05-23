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
  game.mines = [];
  game.skeletons = [];
  game.hazards = [];
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

// End-of-fight handoff. The visual outro lives entirely in the arena
// (kill-cam → death ceremony → camera pull-back + winner celebration with
// the 'win' arpeggio). After that climax there's no winner-name card or
// overlay element — the arena's final tableau (loser residue + winner
// standing in the wide frame) is the closing image. We just hold for a
// short beat and auto-return to the character-select screen.
//
// Token-guarded: if the player taps RESTART (which starts a new fight and
// bumps the token) before the timer fires, this stale timer no-ops so it
// can't yank them out of the new fight.
function showWinnerOverlay() {
  if (!game || !game.winner) return;
  const overlayToken = fightToken;
  setTimeout(() => {
    if (fightToken === overlayToken) returnToSelect();
  }, 1200);
}

