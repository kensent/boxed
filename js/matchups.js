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
  'priest_berserker':0, 'priest_wizard':98, 'priest_knight':0, 'priest_sapper':90, 'priest_archer':94,
  'priest_jester':1, 'priest_cannoneer':35, 'priest_duelist':22, 'priest_necromancer':25, 'priest_reaper':65,
  'priest_ronin':10, 'priest_witch':77, 'priest_hunter':35, 'priest_warlock':89, 'priest_gambler':81,
  'berserker_wizard':90, 'berserker_knight':58, 'berserker_sapper':78, 'berserker_archer':74, 'berserker_jester':100,
  'berserker_cannoneer':49, 'berserker_duelist':9, 'berserker_necromancer':82, 'berserker_reaper':56, 'berserker_ronin':89,
  'berserker_witch':78, 'berserker_hunter':66, 'berserker_warlock':100, 'berserker_gambler':79, 'wizard_knight':6,
  'wizard_sapper':90, 'wizard_archer':1, 'wizard_jester':43, 'wizard_cannoneer':69, 'wizard_duelist':21,
  'wizard_necromancer':28, 'wizard_reaper':74, 'wizard_ronin':33, 'wizard_witch':74, 'wizard_hunter':49,
  'wizard_warlock':50, 'wizard_gambler':38, 'knight_sapper':1, 'knight_archer':28, 'knight_jester':78,
  'knight_cannoneer':6, 'knight_duelist':12, 'knight_necromancer':94, 'knight_reaper':10, 'knight_ronin':32,
  'knight_witch':80, 'knight_hunter':60, 'knight_warlock':55, 'knight_gambler':90, 'sapper_archer':51,
  'sapper_jester':17, 'sapper_cannoneer':52, 'sapper_duelist':80, 'sapper_necromancer':86, 'sapper_reaper':57,
  'sapper_ronin':57, 'sapper_witch':55, 'sapper_hunter':47, 'sapper_warlock':48, 'sapper_gambler':61,
  'archer_jester':21, 'archer_cannoneer':47, 'archer_duelist':76, 'archer_necromancer':59, 'archer_reaper':57,
  'archer_ronin':53, 'archer_witch':43, 'archer_hunter':88, 'archer_warlock':45, 'archer_gambler':48,
  'jester_cannoneer':76, 'jester_duelist':3, 'jester_necromancer':74, 'jester_reaper':73, 'jester_ronin':30,
  'jester_witch':76, 'jester_hunter':83, 'jester_warlock':1, 'jester_gambler':78, 'cannoneer_duelist':48,
  'cannoneer_necromancer':35, 'cannoneer_reaper':56, 'cannoneer_ronin':29, 'cannoneer_witch':57, 'cannoneer_hunter':40,
  'cannoneer_warlock':89, 'cannoneer_gambler':45, 'duelist_necromancer':29, 'duelist_reaper':36, 'duelist_ronin':99,
  'duelist_witch':55, 'duelist_hunter':77, 'duelist_warlock':18, 'duelist_gambler':50, 'necromancer_reaper':51,
  'necromancer_ronin':55, 'necromancer_witch':57, 'necromancer_hunter':37, 'necromancer_warlock':75, 'necromancer_gambler':70,
  'reaper_ronin':49, 'reaper_witch':38, 'reaper_hunter':48, 'reaper_warlock':70, 'reaper_gambler':38,
  'ronin_witch':61, 'ronin_hunter':59, 'ronin_warlock':57, 'ronin_gambler':65, 'witch_hunter':46,
  'witch_warlock':71, 'witch_gambler':49, 'hunter_warlock':78, 'hunter_gambler':45, 'warlock_gambler':39,
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
