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
  'priest_berserker':0, 'priest_wizard':86, 'priest_geomancer':80, 'priest_sapper':75, 'priest_archer':100,
  'priest_jester':19, 'priest_cannoneer':30, 'priest_duelist':19, 'priest_necromancer':70, 'priest_reaper':67,
  'priest_ronin':4, 'priest_witch':68, 'priest_hunter':16, 'priest_warlock':70, 'priest_gambler':78,
  'berserker_wizard':56, 'berserker_geomancer':34, 'berserker_sapper':48, 'berserker_archer':89, 'berserker_jester':47,
  'berserker_cannoneer':36, 'berserker_duelist':31, 'berserker_necromancer':34, 'berserker_reaper':48, 'berserker_ronin':71,
  'berserker_witch':28, 'berserker_hunter':74, 'berserker_warlock':90, 'berserker_gambler':48, 'wizard_geomancer':81,
  'wizard_sapper':91, 'wizard_archer':0, 'wizard_jester':72, 'wizard_cannoneer':83, 'wizard_duelist':32,
  'wizard_necromancer':31, 'wizard_reaper':67, 'wizard_ronin':35, 'wizard_witch':74, 'wizard_hunter':54,
  'wizard_warlock':30, 'wizard_gambler':48, 'geomancer_sapper':59, 'geomancer_archer':39, 'geomancer_jester':99,
  'geomancer_cannoneer':42, 'geomancer_duelist':90, 'geomancer_necromancer':53, 'geomancer_reaper':61, 'geomancer_ronin':27,
  'geomancer_witch':42, 'geomancer_hunter':32, 'geomancer_warlock':41, 'geomancer_gambler':58, 'sapper_archer':38,
  'sapper_jester':35, 'sapper_cannoneer':58, 'sapper_duelist':80, 'sapper_necromancer':62, 'sapper_reaper':50,
  'sapper_ronin':49, 'sapper_witch':60, 'sapper_hunter':59, 'sapper_warlock':49, 'sapper_gambler':55,
  'archer_jester':0, 'archer_cannoneer':27, 'archer_duelist':73, 'archer_necromancer':84, 'archer_reaper':65,
  'archer_ronin':17, 'archer_witch':55, 'archer_hunter':52, 'archer_warlock':37, 'archer_gambler':63,
  'jester_cannoneer':39, 'jester_duelist':6, 'jester_necromancer':76, 'jester_reaper':76, 'jester_ronin':31,
  'jester_witch':63, 'jester_hunter':32, 'jester_warlock':29, 'jester_gambler':76, 'cannoneer_duelist':31,
  'cannoneer_necromancer':60, 'cannoneer_reaper':27, 'cannoneer_ronin':61, 'cannoneer_witch':49, 'cannoneer_hunter':44,
  'cannoneer_warlock':80, 'cannoneer_gambler':37, 'duelist_necromancer':13, 'duelist_reaper':10, 'duelist_ronin':93,
  'duelist_witch':62, 'duelist_hunter':82, 'duelist_warlock':18, 'duelist_gambler':29, 'necromancer_reaper':48,
  'necromancer_ronin':48, 'necromancer_witch':40, 'necromancer_hunter':39, 'necromancer_warlock':51, 'necromancer_gambler':60,
  'reaper_ronin':60, 'reaper_witch':40, 'reaper_hunter':66, 'reaper_warlock':41, 'reaper_gambler':43,
  'ronin_witch':50, 'ronin_hunter':37, 'ronin_warlock':41, 'ronin_gambler':53, 'witch_hunter':49,
  'witch_warlock':56, 'witch_gambler':55, 'hunter_warlock':77, 'hunter_gambler':40, 'warlock_gambler':54,
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
