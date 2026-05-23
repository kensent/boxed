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
  'priest_berserker':0, 'priest_wizard':68, 'priest_geomancer':81, 'priest_sapper':78, 'priest_archer':81,
  'priest_jester':13, 'priest_cannoneer':17, 'priest_duelist':44, 'priest_necromancer':59, 'priest_reaper':62,
  'priest_ronin':4, 'priest_witch':71, 'priest_hunter':28, 'priest_warlock':60, 'priest_gambler':66,
  'berserker_wizard':64, 'berserker_geomancer':32, 'berserker_sapper':27, 'berserker_archer':37, 'berserker_jester':51,
  'berserker_cannoneer':36, 'berserker_duelist':57, 'berserker_necromancer':32, 'berserker_reaper':42, 'berserker_ronin':66,
  'berserker_witch':20, 'berserker_hunter':54, 'berserker_warlock':89, 'berserker_gambler':44, 'wizard_geomancer':85,
  'wizard_sapper':88, 'wizard_archer':10, 'wizard_jester':29, 'wizard_cannoneer':72, 'wizard_duelist':46,
  'wizard_necromancer':33, 'wizard_reaper':61, 'wizard_ronin':34, 'wizard_witch':80, 'wizard_hunter':51,
  'wizard_warlock':33, 'wizard_gambler':55, 'geomancer_sapper':59, 'geomancer_archer':65, 'geomancer_jester':100,
  'geomancer_cannoneer':41, 'geomancer_duelist':86, 'geomancer_necromancer':51, 'geomancer_reaper':53, 'geomancer_ronin':23,
  'geomancer_witch':41, 'geomancer_hunter':39, 'geomancer_warlock':38, 'geomancer_gambler':54, 'sapper_archer':58,
  'sapper_jester':35, 'sapper_cannoneer':58, 'sapper_duelist':72, 'sapper_necromancer':71, 'sapper_reaper':52,
  'sapper_ronin':49, 'sapper_witch':60, 'sapper_hunter':53, 'sapper_warlock':52, 'sapper_gambler':55,
  'archer_jester':10, 'archer_cannoneer':54, 'archer_duelist':68, 'archer_necromancer':63, 'archer_reaper':53,
  'archer_ronin':52, 'archer_witch':46, 'archer_hunter':71, 'archer_warlock':24, 'archer_gambler':32,
  'jester_cannoneer':39, 'jester_duelist':13, 'jester_necromancer':76, 'jester_reaper':78, 'jester_ronin':31,
  'jester_witch':63, 'jester_hunter':31, 'jester_warlock':29, 'jester_gambler':63, 'cannoneer_duelist':44,
  'cannoneer_necromancer':45, 'cannoneer_reaper':31, 'cannoneer_ronin':61, 'cannoneer_witch':49, 'cannoneer_hunter':43,
  'cannoneer_warlock':80, 'cannoneer_gambler':36, 'duelist_necromancer':23, 'duelist_reaper':31, 'duelist_ronin':82,
  'duelist_witch':62, 'duelist_hunter':87, 'duelist_warlock':20, 'duelist_gambler':39, 'necromancer_reaper':44,
  'necromancer_ronin':61, 'necromancer_witch':47, 'necromancer_hunter':30, 'necromancer_warlock':47, 'necromancer_gambler':56,
  'reaper_ronin':58, 'reaper_witch':44, 'reaper_hunter':68, 'reaper_warlock':54, 'reaper_gambler':43,
  'ronin_witch':35, 'ronin_hunter':56, 'ronin_warlock':47, 'ronin_gambler':53, 'witch_hunter':41,
  'witch_warlock':56, 'witch_gambler':49, 'hunter_warlock':77, 'hunter_gambler':53, 'warlock_gambler':52,
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
