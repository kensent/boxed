// ============================================================================
// === MATCHUP DATA ===========================================================
// Win-rate snapshot from the headless balance harness. Keyed
// 'a_b' = fighter A's win % vs B; the reverse is 100 minus the value. Used by
// the select-screen picker modes and the odds readout.
// IMPORTANT: the balance harness drives the engine (via simulateFight) at
// N=500/matchup — it is the balance authority. The old sim.js was a separate,
// simplified model that drifted from the real game; do not trust it.
// REGENERATE after any balance change: run `./balance.sh` and paste the
// printed MATCHUPS block here — otherwise it silently drifts from reality.
//
// Knight is currently excluded from the balance harness (see boxedshard.js EXCLUDE_IDS) —
// the redesign is unresolved and we don't want stale win rates leaking into the
// upset-hunt picker. matchupOdds falls back to 50 for missing pairs, so Knight
// fights register as "unknown" instead of a misleading data point.
// ============================================================================
const MATCHUPS = {
  'priest_berserker':0, 'priest_wizard':84, 'priest_sapper':78, 'priest_archer':81, 'priest_jester':6,
  'priest_cannoneer':18, 'priest_duelist':42, 'priest_necromancer':56, 'priest_reaper':52, 'priest_ronin':11,
  'priest_witch':69, 'priest_hunter':27, 'priest_warlock':69, 'priest_gambler':79, 'berserker_wizard':49,
  'berserker_sapper':29, 'berserker_archer':42, 'berserker_jester':76, 'berserker_cannoneer':30, 'berserker_duelist':13,
  'berserker_necromancer':32, 'berserker_reaper':30, 'berserker_ronin':59, 'berserker_witch':15, 'berserker_hunter':61,
  'berserker_warlock':79, 'berserker_gambler':47, 'wizard_sapper':90, 'wizard_archer':2, 'wizard_jester':77,
  'wizard_cannoneer':68, 'wizard_duelist':28, 'wizard_necromancer':22, 'wizard_reaper':65, 'wizard_ronin':34,
  'wizard_witch':78, 'wizard_hunter':43, 'wizard_warlock':26, 'wizard_gambler':45, 'sapper_archer':57,
  'sapper_jester':25, 'sapper_cannoneer':51, 'sapper_duelist':72, 'sapper_necromancer':89, 'sapper_reaper':49,
  'sapper_ronin':50, 'sapper_witch':56, 'sapper_hunter':51, 'sapper_warlock':52, 'sapper_gambler':72,
  'archer_jester':16, 'archer_cannoneer':51, 'archer_duelist':67, 'archer_necromancer':55, 'archer_reaper':44,
  'archer_ronin':49, 'archer_witch':45, 'archer_hunter':70, 'archer_warlock':31, 'archer_gambler':49,
  'jester_cannoneer':36, 'jester_duelist':2, 'jester_necromancer':67, 'jester_reaper':59, 'jester_ronin':51,
  'jester_witch':76, 'jester_hunter':25, 'jester_warlock':9, 'jester_gambler':63, 'cannoneer_duelist':49,
  'cannoneer_necromancer':44, 'cannoneer_reaper':51, 'cannoneer_ronin':36, 'cannoneer_witch':57, 'cannoneer_hunter':38,
  'cannoneer_warlock':77, 'cannoneer_gambler':49, 'duelist_necromancer':24, 'duelist_reaper':30, 'duelist_ronin':73,
  'duelist_witch':59, 'duelist_hunter':83, 'duelist_warlock':17, 'duelist_gambler':44, 'necromancer_reaper':39,
  'necromancer_ronin':57, 'necromancer_witch':42, 'necromancer_hunter':31, 'necromancer_warlock':48, 'necromancer_gambler':68,
  'reaper_ronin':52, 'reaper_witch':45, 'reaper_hunter':59, 'reaper_warlock':61, 'reaper_gambler':46,
  'ronin_witch':63, 'ronin_hunter':70, 'ronin_warlock':54, 'ronin_gambler':64, 'witch_hunter':40,
  'witch_warlock':62, 'witch_gambler':55, 'hunter_warlock':73, 'hunter_gambler':54, 'warlock_gambler':57,
};

// matchupOdds(a, b) — fighter A's win % vs B, in either stored direction.
function matchupOdds(a, b) {
  if (a === b) return 50;
  if (MATCHUPS[a + '_' + b] != null) return MATCHUPS[a + '_' + b];
  if (MATCHUPS[b + '_' + a] != null) return 100 - MATCHUPS[b + '_' + a];
  return 50;
}

// allMatchups() — every unordered pair with its odds, as {a, b, odds, spread}.
// `spread` is how lopsided the fight is (0 = perfect 50/50, 50 = total stomp).
function allMatchups() {
  const ids = FIGHTERS.map(f => f.id), out = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const odds = matchupOdds(ids[i], ids[j]);
      out.push({ a: ids[i], b: ids[j], odds, spread: Math.abs(odds - 50) });
    }
  }
  return out;
}
