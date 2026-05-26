// === END GAME ===============================================================
// Triggered from damage() when an HP hits 0. Shows winner overlay after a
// brief delay so the death VFX can play out.
// ============================================================================

function endGame() {
  if (game.winner) return;
  game.winner = game.red.dead ? game.blue : game.red;
  // The outcome is decided — drop every LOSER-owned hazard so a stray
  // projectile, mine, skeleton, hazard, or minion can't kill the victor
  // during the finish window. WINNER-owned items persist for visual
  // celebration ("Necromancer's skeletons march on after his victory,"
  // "Wizard's orbs keep bouncing") — and damage on the dead loser is a
  // no-op in damage() (combat.js), so a winner-owned hit on the corpse
  // during the shatter is harmless.
  const winnerTeam = game.winner.team;
  game.projectiles = game.projectiles.filter(p => p.team === winnerTeam);
  game.skeletons = game.skeletons.filter(sk => sk.team === winnerTeam);
  game.hazards = game.hazards.filter(h => h.team === winnerTeam);
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
  // Cancel any in-progress channel/strike on either fighter — but leave
  // iaiStrike alone: it's purely a render-window flag (0.15s gold-slash
  // trail in render/sprites.js). Zeroing it nukes the slash visual on a
  // killing Ronin cut, so the kill lands without the flash. Let it tick
  // down naturally in the engine.js strike block. iaiWindup is gameplay
  // (holds the plant) but the windup phase is already over at the
  // moment a strike connects, so it's harmlessly 0 by the time we get
  // here on a kill — no need to zero it either.
  [game.red, game.blue].forEach(f => {
    f.drainTimer = 0; f.drainTarget = null;
    f.tetherTimer = 0; f.tetherTarget = null;
  });
  // Finish: slow-mo ramp + the shatter. Camera stays static at the arena
  // centre — the old kill-cam push-in was retired. The death ceremony, the
  // camera-snap flash, and the death + koHit sfx all fire together on the
  // first frame of the finish block in draw(), so the kill lands as one beat.
  game.finishTimer = FINISH_WINDOW;
  game.timeScale = 0.18;        // drops to near-frozen, ramps back up over the window
  shake(14);                    // the heaviest shake in the game — it's the kill
  game.koTimer = FINISH_WINDOW; // death-block lifetime; finishTimer ends the finish
  // (flashFrame, the koHit boom, and the death voice are all triggered at the
  //  shatter in draw(), not here at the kill instant.)
}

