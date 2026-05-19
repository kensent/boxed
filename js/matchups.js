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
// ============================================================================
const MATCHUPS = {
  'priest_berserker':92, 'priest_wizard':5, 'priest_knight':79, 'priest_sapper':82, 'priest_archer':41,
  'priest_jester':21, 'priest_cannoneer':63, 'priest_duelist':42, 'priest_necromancer':66, 'priest_reaper':59,
  'priest_ronin':72, 'priest_witch':29, 'priest_hunter':17, 'priest_warlock':52, 'priest_gambler':40,
  'berserker_wizard':78, 'berserker_knight':93, 'berserker_sapper':30, 'berserker_archer':45, 'berserker_jester':55,
  'berserker_cannoneer':19, 'berserker_duelist':51, 'berserker_necromancer':83, 'berserker_reaper':78, 'berserker_ronin':32,
  'berserker_witch':36, 'berserker_hunter':11, 'berserker_warlock':77, 'berserker_gambler':57, 'wizard_knight':4,
  'wizard_sapper':93, 'wizard_archer':96, 'wizard_jester':10, 'wizard_cannoneer':72, 'wizard_duelist':14,
  'wizard_necromancer':4, 'wizard_reaper':0, 'wizard_ronin':60, 'wizard_witch':88, 'wizard_hunter':72,
  'wizard_warlock':35, 'wizard_gambler':88, 'knight_sapper':14, 'knight_archer':15, 'knight_jester':67,
  'knight_cannoneer':13, 'knight_duelist':10, 'knight_necromancer':100, 'knight_reaper':94, 'knight_ronin':10,
  'knight_witch':60, 'knight_hunter':61, 'knight_warlock':99, 'knight_gambler':75, 'sapper_archer':54,
  'sapper_jester':100, 'sapper_cannoneer':9, 'sapper_duelist':89, 'sapper_necromancer':39, 'sapper_reaper':94,
  'sapper_ronin':57, 'sapper_witch':24, 'sapper_hunter':40, 'sapper_warlock':19, 'sapper_gambler':27,
  'archer_jester':14, 'archer_cannoneer':86, 'archer_duelist':78, 'archer_necromancer':27, 'archer_reaper':98,
  'archer_ronin':54, 'archer_witch':30, 'archer_hunter':68, 'archer_warlock':14, 'archer_gambler':28,
  'jester_cannoneer':59, 'jester_duelist':5, 'jester_necromancer':52, 'jester_reaper':10, 'jester_ronin':65,
  'jester_witch':78, 'jester_hunter':85, 'jester_warlock':2, 'jester_gambler':81, 'cannoneer_duelist':57,
  'cannoneer_necromancer':54, 'cannoneer_reaper':52, 'cannoneer_ronin':82, 'cannoneer_witch':32, 'cannoneer_hunter':29,
  'cannoneer_warlock':70, 'cannoneer_gambler':29, 'duelist_necromancer':51, 'duelist_reaper':64, 'duelist_ronin':18,
  'duelist_witch':60, 'duelist_hunter':75, 'duelist_warlock':6, 'duelist_gambler':42, 'necromancer_reaper':0,
  'necromancer_ronin':48, 'necromancer_witch':70, 'necromancer_hunter':29, 'necromancer_warlock':96, 'necromancer_gambler':68,
  'reaper_ronin':10, 'reaper_witch':75, 'reaper_hunter':92, 'reaper_warlock':77, 'reaper_gambler':50,
  'ronin_witch':32, 'ronin_hunter':40, 'ronin_warlock':40, 'ronin_gambler':49, 'witch_hunter':48,
  'witch_warlock':55, 'witch_gambler':47, 'hunter_warlock':53, 'hunter_gambler':47, 'warlock_gambler':51,
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
