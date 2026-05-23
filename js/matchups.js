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
// Knight is currently excluded from the balance harness (see boxedshard.js EXCLUDE_IDS) —
// the redesign is unresolved and we don't want stale win rates leaking into the
// upset-hunt picker. matchupOdds falls back to 50 for missing pairs, so Knight
// fights register as "unknown" instead of a misleading data point.
// ============================================================================
const MATCHUPS = {
  'priest_berserker':0, 'priest_wizard':98, 'priest_sapper':89, 'priest_archer':95, 'priest_jester':4,
  'priest_cannoneer':35, 'priest_duelist':22, 'priest_necromancer':25, 'priest_reaper':67, 'priest_ronin':10,
  'priest_witch':75, 'priest_hunter':38, 'priest_warlock':88, 'priest_gambler':85, 'berserker_wizard':59,
  'berserker_sapper':32, 'berserker_archer':34, 'berserker_jester':91, 'berserker_cannoneer':30, 'berserker_duelist':2,
  'berserker_necromancer':34, 'berserker_reaper':26, 'berserker_ronin':83, 'berserker_witch':24, 'berserker_hunter':58,
  'berserker_warlock':87, 'berserker_gambler':64, 'wizard_sapper':91, 'wizard_archer':2, 'wizard_jester':55,
  'wizard_cannoneer':71, 'wizard_duelist':17, 'wizard_necromancer':30, 'wizard_reaper':70, 'wizard_ronin':35,
  'wizard_witch':83, 'wizard_hunter':45, 'wizard_warlock':50, 'wizard_gambler':39, 'sapper_archer':53,
  'sapper_jester':46, 'sapper_cannoneer':51, 'sapper_duelist':81, 'sapper_necromancer':86, 'sapper_reaper':54,
  'sapper_ronin':54, 'sapper_witch':48, 'sapper_hunter':41, 'sapper_warlock':47, 'sapper_gambler':56,
  'archer_jester':16, 'archer_cannoneer':50, 'archer_duelist':80, 'archer_necromancer':56, 'archer_reaper':54,
  'archer_ronin':55, 'archer_witch':45, 'archer_hunter':89, 'archer_warlock':46, 'archer_gambler':49,
  'jester_cannoneer':34, 'jester_duelist':0, 'jester_necromancer':76, 'jester_reaper':62, 'jester_ronin':35,
  'jester_witch':87, 'jester_hunter':47, 'jester_warlock':10, 'jester_gambler':73, 'cannoneer_duelist':44,
  'cannoneer_necromancer':37, 'cannoneer_reaper':61, 'cannoneer_ronin':27, 'cannoneer_witch':55, 'cannoneer_hunter':37,
  'cannoneer_warlock':88, 'cannoneer_gambler':51, 'duelist_necromancer':34, 'duelist_reaper':32, 'duelist_ronin':99,
  'duelist_witch':60, 'duelist_hunter':80, 'duelist_warlock':18, 'duelist_gambler':45, 'necromancer_reaper':54,
  'necromancer_ronin':58, 'necromancer_witch':54, 'necromancer_hunter':39, 'necromancer_warlock':75, 'necromancer_gambler':68,
  'reaper_ronin':49, 'reaper_witch':35, 'reaper_hunter':54, 'reaper_warlock':66, 'reaper_gambler':42,
  'ronin_witch':63, 'ronin_hunter':62, 'ronin_warlock':53, 'ronin_gambler':70, 'witch_hunter':49,
  'witch_warlock':70, 'witch_gambler':50, 'hunter_warlock':76, 'hunter_gambler':45, 'warlock_gambler':46,
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
