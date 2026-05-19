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
  'priest_berserker':85, 'priest_wizard':5, 'priest_knight':80, 'priest_sapper':77, 'priest_archer':41,
  'priest_jester':33, 'priest_cannoneer':62, 'priest_duelist':44, 'priest_necromancer':52, 'priest_reaper':57,
  'priest_ronin':67, 'priest_witch':29, 'priest_hunter':17, 'priest_warlock':60, 'priest_gambler':28,
  'berserker_wizard':77, 'berserker_knight':95, 'berserker_sapper':36, 'berserker_archer':53, 'berserker_jester':87,
  'berserker_cannoneer':21, 'berserker_duelist':52, 'berserker_necromancer':61, 'berserker_reaper':77, 'berserker_ronin':21,
  'berserker_witch':41, 'berserker_hunter':15, 'berserker_warlock':76, 'berserker_gambler':44, 'wizard_knight':3,
  'wizard_sapper':96, 'wizard_archer':96, 'wizard_jester':10, 'wizard_cannoneer':77, 'wizard_duelist':14,
  'wizard_necromancer':7, 'wizard_reaper':0, 'wizard_ronin':61, 'wizard_witch':80, 'wizard_hunter':72,
  'wizard_warlock':43, 'wizard_gambler':88, 'knight_sapper':14, 'knight_archer':22, 'knight_jester':79,
  'knight_cannoneer':12, 'knight_duelist':12, 'knight_necromancer':94, 'knight_reaper':91, 'knight_ronin':34,
  'knight_witch':80, 'knight_hunter':57, 'knight_warlock':56, 'knight_gambler':78, 'sapper_archer':59,
  'sapper_jester':99, 'sapper_cannoneer':9, 'sapper_duelist':90, 'sapper_necromancer':46, 'sapper_reaper':96,
  'sapper_ronin':46, 'sapper_witch':26, 'sapper_hunter':34, 'sapper_warlock':30, 'sapper_gambler':23,
  'archer_jester':16, 'archer_cannoneer':80, 'archer_duelist':78, 'archer_necromancer':42, 'archer_reaper':97,
  'archer_ronin':46, 'archer_witch':22, 'archer_hunter':68, 'archer_warlock':26, 'archer_gambler':27,
  'jester_cannoneer':83, 'jester_duelist':3, 'jester_necromancer':66, 'jester_reaper':15, 'jester_ronin':98,
  'jester_witch':76, 'jester_hunter':63, 'jester_warlock':0, 'jester_gambler':80, 'cannoneer_duelist':47,
  'cannoneer_necromancer':20, 'cannoneer_reaper':43, 'cannoneer_ronin':87, 'cannoneer_witch':34, 'cannoneer_hunter':33,
  'cannoneer_warlock':78, 'cannoneer_gambler':31, 'duelist_necromancer':29, 'duelist_reaper':55, 'duelist_ronin':21,
  'duelist_witch':55, 'duelist_hunter':75, 'duelist_warlock':23, 'duelist_gambler':39, 'necromancer_reaper':1,
  'necromancer_ronin':51, 'necromancer_witch':57, 'necromancer_hunter':31, 'necromancer_warlock':76, 'necromancer_gambler':59,
  'reaper_ronin':36, 'reaper_witch':85, 'reaper_hunter':93, 'reaper_warlock':21, 'reaper_gambler':55,
  'ronin_witch':41, 'ronin_hunter':48, 'ronin_warlock':57, 'ronin_gambler':60, 'witch_hunter':48,
  'witch_warlock':72, 'witch_gambler':52, 'hunter_warlock':80, 'hunter_gambler':32, 'warlock_gambler':39,
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
