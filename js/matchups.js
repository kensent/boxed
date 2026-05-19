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
  'priest_berserker':92, 'priest_wizard':5, 'priest_knight':79, 'priest_sapper':77, 'priest_archer':41,
  'priest_jester':23, 'priest_cannoneer':63, 'priest_duelist':44, 'priest_necromancer':66, 'priest_reaper':57,
  'priest_ronin':67, 'priest_witch':29, 'priest_hunter':17, 'priest_warlock':57, 'priest_gambler':28,
  'berserker_wizard':78, 'berserker_knight':93, 'berserker_sapper':41, 'berserker_archer':45, 'berserker_jester':57,
  'berserker_cannoneer':19, 'berserker_duelist':51, 'berserker_necromancer':83, 'berserker_reaper':77, 'berserker_ronin':21,
  'berserker_witch':36, 'berserker_hunter':11, 'berserker_warlock':69, 'berserker_gambler':39, 'wizard_knight':2,
  'wizard_sapper':96, 'wizard_archer':96, 'wizard_jester':9, 'wizard_cannoneer':72, 'wizard_duelist':14,
  'wizard_necromancer':4, 'wizard_reaper':0, 'wizard_ronin':61, 'wizard_witch':88, 'wizard_hunter':72,
  'wizard_warlock':41, 'wizard_gambler':88, 'knight_sapper':15, 'knight_archer':21, 'knight_jester':78,
  'knight_cannoneer':13, 'knight_duelist':10, 'knight_necromancer':100, 'knight_reaper':92, 'knight_ronin':32,
  'knight_witch':81, 'knight_hunter':61, 'knight_warlock':62, 'knight_gambler':80, 'sapper_archer':59,
  'sapper_jester':99, 'sapper_cannoneer':9, 'sapper_duelist':90, 'sapper_necromancer':48, 'sapper_reaper':96,
  'sapper_ronin':46, 'sapper_witch':26, 'sapper_hunter':34, 'sapper_warlock':24, 'sapper_gambler':23,
  'archer_jester':17, 'archer_cannoneer':86, 'archer_duelist':83, 'archer_necromancer':27, 'archer_reaper':97,
  'archer_ronin':46, 'archer_witch':30, 'archer_hunter':68, 'archer_warlock':25, 'archer_gambler':27,
  'jester_cannoneer':80, 'jester_duelist':4, 'jester_necromancer':51, 'jester_reaper':7, 'jester_ronin':98,
  'jester_witch':76, 'jester_hunter':83, 'jester_warlock':1, 'jester_gambler':80, 'cannoneer_duelist':57,
  'cannoneer_necromancer':53, 'cannoneer_reaper':51, 'cannoneer_ronin':86, 'cannoneer_witch':29, 'cannoneer_hunter':29,
  'cannoneer_warlock':77, 'cannoneer_gambler':29, 'duelist_necromancer':51, 'duelist_reaper':55, 'duelist_ronin':21,
  'duelist_witch':56, 'duelist_hunter':75, 'duelist_warlock':17, 'duelist_gambler':39, 'necromancer_reaper':0,
  'necromancer_ronin':39, 'necromancer_witch':70, 'necromancer_hunter':29, 'necromancer_warlock':93, 'necromancer_gambler':68,
  'reaper_ronin':36, 'reaper_witch':85, 'reaper_hunter':93, 'reaper_warlock':19, 'reaper_gambler':55,
  'ronin_witch':41, 'ronin_hunter':48, 'ronin_warlock':55, 'ronin_gambler':60, 'witch_hunter':48,
  'witch_warlock':69, 'witch_gambler':47, 'hunter_warlock':74, 'hunter_gambler':32, 'warlock_gambler':41,
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
