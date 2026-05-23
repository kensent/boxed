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
  'priest_berserker':0, 'priest_wizard':94, 'priest_sapper':78, 'priest_archer':81, 'priest_jester':6,
  'priest_cannoneer':18, 'priest_duelist':33, 'priest_necromancer':13, 'priest_reaper':40, 'priest_ronin':0,
  'priest_witch':53, 'priest_hunter':27, 'priest_warlock':61, 'priest_gambler':79, 'berserker_wizard':88,
  'berserker_sapper':56, 'berserker_archer':62, 'berserker_jester':98, 'berserker_cannoneer':38, 'berserker_duelist':14,
  'berserker_necromancer':50, 'berserker_reaper':39, 'berserker_ronin':46, 'berserker_witch':29, 'berserker_hunter':71,
  'berserker_warlock':90, 'berserker_gambler':78, 'wizard_sapper':80, 'wizard_archer':0, 'wizard_jester':57,
  'wizard_cannoneer':48, 'wizard_duelist':17, 'wizard_necromancer':17, 'wizard_reaper':51, 'wizard_ronin':7,
  'wizard_witch':60, 'wizard_hunter':33, 'wizard_warlock':20, 'wizard_gambler':33, 'sapper_archer':47,
  'sapper_jester':54, 'sapper_cannoneer':48, 'sapper_duelist':65, 'sapper_necromancer':87, 'sapper_reaper':42,
  'sapper_ronin':20, 'sapper_witch':48, 'sapper_hunter':25, 'sapper_warlock':35, 'sapper_gambler':65,
  'archer_jester':26, 'archer_cannoneer':51, 'archer_duelist':67, 'archer_necromancer':55, 'archer_reaper':44,
  'archer_ronin':19, 'archer_witch':45, 'archer_hunter':70, 'archer_warlock':31, 'archer_gambler':59,
  'jester_cannoneer':24, 'jester_duelist':0, 'jester_necromancer':60, 'jester_reaper':44, 'jester_ronin':28,
  'jester_witch':73, 'jester_hunter':25, 'jester_warlock':6, 'jester_gambler':65, 'cannoneer_duelist':49,
  'cannoneer_necromancer':44, 'cannoneer_reaper':51, 'cannoneer_ronin':31, 'cannoneer_witch':57, 'cannoneer_hunter':38,
  'cannoneer_warlock':77, 'cannoneer_gambler':59, 'duelist_necromancer':24, 'duelist_reaper':30, 'duelist_ronin':52,
  'duelist_witch':59, 'duelist_hunter':83, 'duelist_warlock':17, 'duelist_gambler':48, 'necromancer_reaper':39,
  'necromancer_ronin':32, 'necromancer_witch':42, 'necromancer_hunter':31, 'necromancer_warlock':48, 'necromancer_gambler':72,
  'reaper_ronin':27, 'reaper_witch':45, 'reaper_hunter':59, 'reaper_warlock':61, 'reaper_gambler':54,
  'ronin_witch':83, 'ronin_hunter':87, 'ronin_warlock':72, 'ronin_gambler':89, 'witch_hunter':40,
  'witch_warlock':62, 'witch_gambler':64, 'hunter_warlock':73, 'hunter_gambler':55, 'warlock_gambler':65,
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
