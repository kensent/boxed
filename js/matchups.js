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
// matchupOdds falls back to 50 for missing pairs (a new fighter shipped without
// a fresh harness run shows as "unknown odds" instead of a misleading default).
// ============================================================================
const MATCHUPS = {
  'priest_berserker':0, 'priest_wizard':82, 'priest_geomancer':83, 'priest_sapper':79, 'priest_archer':86,
  'priest_jester':16, 'priest_cannoneer':21, 'priest_duelist':26, 'priest_necromancer':64, 'priest_reaper':61,
  'priest_ronin':4, 'priest_witch':73, 'priest_hunter':14, 'priest_warlock':64, 'priest_gambler':69,
  'berserker_wizard':57, 'berserker_geomancer':34, 'berserker_sapper':27, 'berserker_archer':33, 'berserker_jester':55,
  'berserker_cannoneer':39, 'berserker_duelist':34, 'berserker_necromancer':49, 'berserker_reaper':45, 'berserker_ronin':77,
  'berserker_witch':28, 'berserker_hunter':72, 'berserker_warlock':91, 'berserker_gambler':38, 'wizard_geomancer':81,
  'wizard_sapper':89, 'wizard_archer':7, 'wizard_jester':72, 'wizard_cannoneer':83, 'wizard_duelist':32,
  'wizard_necromancer':26, 'wizard_reaper':72, 'wizard_ronin':42, 'wizard_witch':74, 'wizard_hunter':53,
  'wizard_warlock':30, 'wizard_gambler':48, 'geomancer_sapper':59, 'geomancer_archer':68, 'geomancer_jester':99,
  'geomancer_cannoneer':42, 'geomancer_duelist':90, 'geomancer_necromancer':50, 'geomancer_reaper':58, 'geomancer_ronin':25,
  'geomancer_witch':42, 'geomancer_hunter':32, 'geomancer_warlock':41, 'geomancer_gambler':54, 'sapper_archer':58,
  'sapper_jester':35, 'sapper_cannoneer':58, 'sapper_duelist':80, 'sapper_necromancer':71, 'sapper_reaper':48,
  'sapper_ronin':49, 'sapper_witch':60, 'sapper_hunter':59, 'sapper_warlock':52, 'sapper_gambler':55,
  'archer_jester':10, 'archer_cannoneer':54, 'archer_duelist':73, 'archer_necromancer':63, 'archer_reaper':56,
  'archer_ronin':52, 'archer_witch':46, 'archer_hunter':72, 'archer_warlock':24, 'archer_gambler':32,
  'jester_cannoneer':39, 'jester_duelist':6, 'jester_necromancer':76, 'jester_reaper':66, 'jester_ronin':31,
  'jester_witch':63, 'jester_hunter':32, 'jester_warlock':29, 'jester_gambler':63, 'cannoneer_duelist':31,
  'cannoneer_necromancer':45, 'cannoneer_reaper':29, 'cannoneer_ronin':61, 'cannoneer_witch':49, 'cannoneer_hunter':42,
  'cannoneer_warlock':80, 'cannoneer_gambler':36, 'duelist_necromancer':22, 'duelist_reaper':21, 'duelist_ronin':84,
  'duelist_witch':62, 'duelist_hunter':81, 'duelist_warlock':18, 'duelist_gambler':29, 'necromancer_reaper':57,
  'necromancer_ronin':61, 'necromancer_witch':47, 'necromancer_hunter':43, 'necromancer_warlock':47, 'necromancer_gambler':56,
  'reaper_ronin':69, 'reaper_witch':45, 'reaper_hunter':65, 'reaper_warlock':42, 'reaper_gambler':43,
  'ronin_witch':35, 'ronin_hunter':30, 'ronin_warlock':47, 'ronin_gambler':53, 'witch_hunter':49,
  'witch_warlock':56, 'witch_gambler':49, 'hunter_warlock':78, 'hunter_gambler':37, 'warlock_gambler':52,
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
