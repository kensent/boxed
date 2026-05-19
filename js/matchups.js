// ============================================================================
// === MATCHUP DATA ===========================================================
// Win-rate snapshot from the headless balance harness. Keyed
// 'a_b' = fighter A's win % vs B; the reverse is 100 minus the value. Used by
// the select-screen picker modes and the odds readout.
// IMPORTANT: the balance harness drives the engine (via simulateFight) at
// N=300/matchup — it is the balance authority. The old sim.js was a separate,
// simplified model that drifted from the real game; do not trust it.
// REGENERATE after any balance change: run `./balance.sh` and paste the
// printed MATCHUPS block here — otherwise it silently drifts from reality.
// ============================================================================
const MATCHUPS = {
  'priest_berserker':92, 'priest_wizard':5, 'priest_knight':79, 'priest_sapper':82, 'priest_archer':41,
  'priest_jester':26, 'priest_cannoneer':63, 'priest_duelist':42, 'priest_necromancer':68, 'priest_reaper':59,
  'priest_ronin':72, 'priest_witch':24, 'priest_hunter':17, 'priest_warlock':52, 'priest_gambler':40,
  'berserker_wizard':77, 'berserker_knight':93, 'berserker_sapper':30, 'berserker_archer':45, 'berserker_jester':55,
  'berserker_cannoneer':19, 'berserker_duelist':51, 'berserker_necromancer':82, 'berserker_reaper':78, 'berserker_ronin':32,
  'berserker_witch':40, 'berserker_hunter':11, 'berserker_warlock':77, 'berserker_gambler':57, 'wizard_knight':4,
  'wizard_sapper':93, 'wizard_archer':98, 'wizard_jester':11, 'wizard_cannoneer':75, 'wizard_duelist':15,
  'wizard_necromancer':0, 'wizard_reaper':0, 'wizard_ronin':56, 'wizard_witch':95, 'wizard_hunter':72,
  'wizard_warlock':37, 'wizard_gambler':89, 'knight_sapper':14, 'knight_archer':15, 'knight_jester':69,
  'knight_cannoneer':13, 'knight_duelist':10, 'knight_necromancer':100, 'knight_reaper':94, 'knight_ronin':10,
  'knight_witch':53, 'knight_hunter':61, 'knight_warlock':99, 'knight_gambler':75, 'sapper_archer':54,
  'sapper_jester':100, 'sapper_cannoneer':9, 'sapper_duelist':89, 'sapper_necromancer':24, 'sapper_reaper':93,
  'sapper_ronin':47, 'sapper_witch':24, 'sapper_hunter':40, 'sapper_warlock':19, 'sapper_gambler':27,
  'archer_jester':12, 'archer_cannoneer':86, 'archer_duelist':78, 'archer_necromancer':37, 'archer_reaper':97,
  'archer_ronin':49, 'archer_witch':27, 'archer_hunter':68, 'archer_warlock':14, 'archer_gambler':28,
  'jester_cannoneer':79, 'jester_duelist':57, 'jester_necromancer':24, 'jester_reaper':14, 'jester_ronin':53,
  'jester_witch':73, 'jester_hunter':81, 'jester_warlock':1, 'jester_gambler':71, 'cannoneer_duelist':57,
  'cannoneer_necromancer':52, 'cannoneer_reaper':52, 'cannoneer_ronin':82, 'cannoneer_witch':29, 'cannoneer_hunter':29,
  'cannoneer_warlock':70, 'cannoneer_gambler':29, 'duelist_necromancer':61, 'duelist_reaper':64, 'duelist_ronin':18,
  'duelist_witch':56, 'duelist_hunter':75, 'duelist_warlock':6, 'duelist_gambler':42, 'necromancer_reaper':0,
  'necromancer_ronin':43, 'necromancer_witch':73, 'necromancer_hunter':24, 'necromancer_warlock':98, 'necromancer_gambler':65,
  'reaper_ronin':24, 'reaper_witch':64, 'reaper_hunter':92, 'reaper_warlock':80, 'reaper_gambler':53,
  'ronin_witch':39, 'ronin_hunter':40, 'ronin_warlock':46, 'ronin_gambler':53, 'witch_hunter':58,
  'witch_warlock':55, 'witch_gambler':43, 'hunter_warlock':53, 'hunter_gambler':47, 'warlock_gambler':51,
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
