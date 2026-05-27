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
  'priest_berserker':0, 'priest_wizard':92, 'priest_geomancer':82, 'priest_sapper':75, 'priest_archer':100,
  'priest_jester':19, 'priest_cannoneer':24, 'priest_duelist':28, 'priest_necromancer':2, 'priest_reaper':69,
  'priest_ronin':0, 'priest_witch':73, 'priest_hunter':11, 'priest_warlock':80, 'priest_gambler':72,
  'berserker_wizard':54, 'berserker_geomancer':27, 'berserker_sapper':24, 'berserker_archer':73, 'berserker_jester':26,
  'berserker_cannoneer':33, 'berserker_duelist':25, 'berserker_necromancer':66, 'berserker_reaper':45, 'berserker_ronin':92,
  'berserker_witch':18, 'berserker_hunter':44, 'berserker_warlock':90, 'berserker_gambler':35, 'wizard_geomancer':84,
  'wizard_sapper':96, 'wizard_archer':0, 'wizard_jester':50, 'wizard_cannoneer':92, 'wizard_duelist':33,
  'wizard_necromancer':17, 'wizard_reaper':78, 'wizard_ronin':37, 'wizard_witch':84, 'wizard_hunter':50,
  'wizard_warlock':26, 'wizard_gambler':45, 'geomancer_sapper':58, 'geomancer_archer':38, 'geomancer_jester':100,
  'geomancer_cannoneer':42, 'geomancer_duelist':94, 'geomancer_necromancer':70, 'geomancer_reaper':62, 'geomancer_ronin':29,
  'geomancer_witch':38, 'geomancer_hunter':32, 'geomancer_warlock':36, 'geomancer_gambler':56, 'sapper_archer':35,
  'sapper_jester':22, 'sapper_cannoneer':73, 'sapper_duelist':91, 'sapper_necromancer':54, 'sapper_reaper':60,
  'sapper_ronin':51, 'sapper_witch':54, 'sapper_hunter':71, 'sapper_warlock':43, 'sapper_gambler':49,
  'archer_jester':0, 'archer_cannoneer':24, 'archer_duelist':80, 'archer_necromancer':63, 'archer_reaper':75,
  'archer_ronin':17, 'archer_witch':55, 'archer_hunter':50, 'archer_warlock':37, 'archer_gambler':65,
  'jester_cannoneer':7, 'jester_duelist':2, 'jester_necromancer':38, 'jester_reaper':75, 'jester_ronin':19,
  'jester_witch':95, 'jester_hunter':47, 'jester_warlock':32, 'jester_gambler':75, 'cannoneer_duelist':28,
  'cannoneer_necromancer':85, 'cannoneer_reaper':18, 'cannoneer_ronin':46, 'cannoneer_witch':37, 'cannoneer_hunter':52,
  'cannoneer_warlock':75, 'cannoneer_gambler':32, 'duelist_necromancer':50, 'duelist_reaper':2, 'duelist_ronin':98,
  'duelist_witch':59, 'duelist_hunter':81, 'duelist_warlock':3, 'duelist_gambler':24, 'necromancer_reaper':40,
  'necromancer_ronin':27, 'necromancer_witch':39, 'necromancer_hunter':56, 'necromancer_warlock':94, 'necromancer_gambler':55,
  'reaper_ronin':70, 'reaper_witch':34, 'reaper_hunter':85, 'reaper_warlock':31, 'reaper_gambler':34,
  'ronin_witch':34, 'ronin_hunter':18, 'ronin_warlock':15, 'ronin_gambler':48, 'witch_hunter':46,
  'witch_warlock':53, 'witch_gambler':57, 'hunter_warlock':62, 'hunter_gambler':26, 'warlock_gambler':62,
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
