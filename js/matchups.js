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
  'priest_berserker':0, 'priest_wizard':95, 'priest_geomancer':86, 'priest_sapper':66, 'priest_archer':100,
  'priest_jester':16, 'priest_cannoneer':26, 'priest_duelist':34, 'priest_necromancer':4, 'priest_reaper':71,
  'priest_ronin':1, 'priest_witch':76, 'priest_hunter':10, 'priest_warlock':80, 'priest_gambler':73,
  'berserker_wizard':54, 'berserker_geomancer':32, 'berserker_sapper':24, 'berserker_archer':73, 'berserker_jester':26,
  'berserker_cannoneer':34, 'berserker_duelist':25, 'berserker_necromancer':66, 'berserker_reaper':45, 'berserker_ronin':83,
  'berserker_witch':18, 'berserker_hunter':44, 'berserker_warlock':90, 'berserker_gambler':35, 'wizard_geomancer':86,
  'wizard_sapper':96, 'wizard_archer':0, 'wizard_jester':50, 'wizard_cannoneer':90, 'wizard_duelist':33,
  'wizard_necromancer':17, 'wizard_reaper':78, 'wizard_ronin':37, 'wizard_witch':78, 'wizard_hunter':50,
  'wizard_warlock':29, 'wizard_gambler':45, 'geomancer_sapper':47, 'geomancer_archer':32, 'geomancer_jester':100,
  'geomancer_cannoneer':31, 'geomancer_duelist':90, 'geomancer_necromancer':67, 'geomancer_reaper':58, 'geomancer_ronin':54,
  'geomancer_witch':36, 'geomancer_hunter':30, 'geomancer_warlock':32, 'geomancer_gambler':52, 'sapper_archer':35,
  'sapper_jester':22, 'sapper_cannoneer':81, 'sapper_duelist':91, 'sapper_necromancer':54, 'sapper_reaper':60,
  'sapper_ronin':65, 'sapper_witch':38, 'sapper_hunter':71, 'sapper_warlock':43, 'sapper_gambler':49,
  'archer_jester':0, 'archer_cannoneer':23, 'archer_duelist':80, 'archer_necromancer':37, 'archer_reaper':75,
  'archer_ronin':31, 'archer_witch':54, 'archer_hunter':52, 'archer_warlock':37, 'archer_gambler':68,
  'jester_cannoneer':9, 'jester_duelist':2, 'jester_necromancer':38, 'jester_reaper':75, 'jester_ronin':17,
  'jester_witch':83, 'jester_hunter':47, 'jester_warlock':32, 'jester_gambler':75, 'cannoneer_duelist':31,
  'cannoneer_necromancer':87, 'cannoneer_reaper':19, 'cannoneer_ronin':61, 'cannoneer_witch':37, 'cannoneer_hunter':67,
  'cannoneer_warlock':76, 'cannoneer_gambler':36, 'duelist_necromancer':50, 'duelist_reaper':2, 'duelist_ronin':81,
  'duelist_witch':56, 'duelist_hunter':81, 'duelist_warlock':3, 'duelist_gambler':24, 'necromancer_reaper':40,
  'necromancer_ronin':12, 'necromancer_witch':37, 'necromancer_hunter':56, 'necromancer_warlock':94, 'necromancer_gambler':55,
  'reaper_ronin':76, 'reaper_witch':30, 'reaper_hunter':85, 'reaper_warlock':31, 'reaper_gambler':34,
  'ronin_witch':65, 'ronin_hunter':39, 'ronin_warlock':21, 'ronin_gambler':47, 'witch_hunter':50,
  'witch_warlock':54, 'witch_gambler':57, 'hunter_warlock':62, 'hunter_gambler':26, 'warlock_gambler':62,
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
