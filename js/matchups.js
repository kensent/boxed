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
  'priest_berserker':0, 'priest_wizard':84, 'priest_geomancer':78, 'priest_sapper':78, 'priest_archer':81,
  'priest_jester':7, 'priest_cannoneer':15, 'priest_duelist':44, 'priest_necromancer':59, 'priest_reaper':62,
  'priest_ronin':2, 'priest_witch':71, 'priest_hunter':28, 'priest_warlock':73, 'priest_gambler':76,
  'berserker_wizard':54, 'berserker_geomancer':28, 'berserker_sapper':27, 'berserker_archer':37, 'berserker_jester':63,
  'berserker_cannoneer':28, 'berserker_duelist':57, 'berserker_necromancer':32, 'berserker_reaper':42, 'berserker_ronin':53,
  'berserker_witch':20, 'berserker_hunter':54, 'berserker_warlock':84, 'berserker_gambler':36, 'wizard_geomancer':97,
  'wizard_sapper':92, 'wizard_archer':1, 'wizard_jester':79, 'wizard_cannoneer':66, 'wizard_duelist':34,
  'wizard_necromancer':22, 'wizard_reaper':59, 'wizard_ronin':31, 'wizard_witch':77, 'wizard_hunter':44,
  'wizard_warlock':26, 'wizard_gambler':49, 'geomancer_sapper':59, 'geomancer_archer':72, 'geomancer_jester':99,
  'geomancer_cannoneer':36, 'geomancer_duelist':86, 'geomancer_necromancer':51, 'geomancer_reaper':59, 'geomancer_ronin':25,
  'geomancer_witch':41, 'geomancer_hunter':43, 'geomancer_warlock':35, 'geomancer_gambler':62, 'sapper_archer':58,
  'sapper_jester':27, 'sapper_cannoneer':52, 'sapper_duelist':72, 'sapper_necromancer':91, 'sapper_reaper':52,
  'sapper_ronin':35, 'sapper_witch':60, 'sapper_hunter':53, 'sapper_warlock':51, 'sapper_gambler':68,
  'archer_jester':12, 'archer_cannoneer':48, 'archer_duelist':68, 'archer_necromancer':63, 'archer_reaper':53,
  'archer_ronin':52, 'archer_witch':46, 'archer_hunter':71, 'archer_warlock':30, 'archer_gambler':48,
  'jester_cannoneer':34, 'jester_duelist':3, 'jester_necromancer':65, 'jester_reaper':45, 'jester_ronin':33,
  'jester_witch':76, 'jester_hunter':28, 'jester_warlock':8, 'jester_gambler':61, 'cannoneer_duelist':49,
  'cannoneer_necromancer':45, 'cannoneer_reaper':43, 'cannoneer_ronin':62, 'cannoneer_witch':56, 'cannoneer_hunter':44,
  'cannoneer_warlock':80, 'cannoneer_gambler':44, 'duelist_necromancer':23, 'duelist_reaper':31, 'duelist_ronin':82,
  'duelist_witch':62, 'duelist_hunter':87, 'duelist_warlock':17, 'duelist_gambler':45, 'necromancer_reaper':44,
  'necromancer_ronin':61, 'necromancer_witch':47, 'necromancer_hunter':30, 'necromancer_warlock':46, 'necromancer_gambler':68,
  'reaper_ronin':58, 'reaper_witch':44, 'reaper_hunter':68, 'reaper_warlock':54, 'reaper_gambler':44,
  'ronin_witch':58, 'ronin_hunter':77, 'ronin_warlock':54, 'ronin_gambler':53, 'witch_hunter':41,
  'witch_warlock':62, 'witch_gambler':56, 'hunter_warlock':73, 'hunter_gambler':55, 'warlock_gambler':57,
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
