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
  'priest_berserker':92, 'priest_wizard':4, 'priest_knight':80, 'priest_sapper':80, 'priest_archer':38,
  'priest_jester':23, 'priest_cannoneer':64, 'priest_duelist':44, 'priest_necromancer':85, 'priest_reaper':62,
  'priest_ronin':73, 'priest_witch':22, 'priest_hunter':19, 'priest_warlock':50, 'priest_gambler':38,
  'berserker_wizard':77, 'berserker_knight':93, 'berserker_sapper':29, 'berserker_archer':43, 'berserker_jester':55,
  'berserker_cannoneer':16, 'berserker_duelist':52, 'berserker_necromancer':100, 'berserker_reaper':78, 'berserker_ronin':31,
  'berserker_witch':39, 'berserker_hunter':12, 'berserker_warlock':76, 'berserker_gambler':58, 'wizard_knight':3,
  'wizard_sapper':92, 'wizard_archer':97, 'wizard_jester':11, 'wizard_cannoneer':75, 'wizard_duelist':13,
  'wizard_necromancer':1, 'wizard_reaper':0, 'wizard_ronin':53, 'wizard_witch':94, 'wizard_hunter':72,
  'wizard_warlock':36, 'wizard_gambler':91, 'knight_sapper':14, 'knight_archer':13, 'knight_jester':69,
  'knight_cannoneer':10, 'knight_duelist':10, 'knight_necromancer':100, 'knight_reaper':94, 'knight_ronin':11,
  'knight_witch':56, 'knight_hunter':62, 'knight_warlock':98, 'knight_gambler':72, 'sapper_archer':56,
  'sapper_jester':100, 'sapper_cannoneer':10, 'sapper_duelist':88, 'sapper_necromancer':26, 'sapper_reaper':93,
  'sapper_ronin':45, 'sapper_witch':25, 'sapper_hunter':40, 'sapper_warlock':19, 'sapper_gambler':27,
  'archer_jester':14, 'archer_cannoneer':85, 'archer_duelist':81, 'archer_necromancer':32, 'archer_reaper':97,
  'archer_ronin':49, 'archer_witch':27, 'archer_hunter':70, 'archer_warlock':15, 'archer_gambler':29,
  'jester_cannoneer':79, 'jester_duelist':57, 'jester_necromancer':8, 'jester_reaper':14, 'jester_ronin':53,
  'jester_witch':72, 'jester_hunter':80, 'jester_warlock':1, 'jester_gambler':70, 'cannoneer_duelist':56,
  'cannoneer_necromancer':60, 'cannoneer_reaper':55, 'cannoneer_ronin':82, 'cannoneer_witch':31, 'cannoneer_hunter':26,
  'cannoneer_warlock':70, 'cannoneer_gambler':29, 'duelist_necromancer':97, 'duelist_reaper':64, 'duelist_ronin':19,
  'duelist_witch':56, 'duelist_hunter':75, 'duelist_warlock':6, 'duelist_gambler':41, 'necromancer_reaper':0,
  'necromancer_ronin':62, 'necromancer_witch':76, 'necromancer_hunter':20, 'necromancer_warlock':100, 'necromancer_gambler':86,
  'reaper_ronin':23, 'reaper_witch':63, 'reaper_hunter':91, 'reaper_warlock':83, 'reaper_gambler':51,
  'ronin_witch':39, 'ronin_hunter':38, 'ronin_warlock':43, 'ronin_gambler':51, 'witch_hunter':59,
  'witch_warlock':55, 'witch_gambler':44, 'hunter_warlock':56, 'hunter_gambler':48, 'warlock_gambler':51,
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
