// === FIGHTER VOICE BRIEFS =====================================================
// One-line character identity for each fighter. Use these as the filter when
// writing or reviewing victory quotes — every quote should sound like its speaker.
//
// PRIEST      Divine authority. God is on my side and I speak for God. Calm,
//             slightly condescending, theological reframing of everything.
// BERSERKER   Pure instinct. Zero words wasted. Doesn't explain or justify.
//             Quotes are grunts with punctuation.
// WIZARD      Intellectual arrogance. Opponents are solved problems. Academic
//             framing, maximum smugness, never raises his voice.
// KNIGHT      Stoic and direct. No flourish, no ceremony. Just armor, reach,
//             and result.
// SAPPER      Deadpan and patient. Everything was a trap from the start.
//             Dark humor, zero urgency.
// ARCHER      Light and quick. Distance is home. Confident without being
//             cruel — more amused than arrogant.
// JESTER      Chaotic and playful. Never serious. Trickster who thinks death
//             is a punchline.
// CANNONEER   One-shot mentality. Slow, heavy, inevitable. Quietly confident
//             in the big play.
// DUELIST     Elegant and formal. Combat as art. Slightly theatrical, never
//             crude.
// NECROMANCER Cold and strategic. Death is a resource. Army-minded, clinical,
//             nothing personal.
// REAPER      Patient and inevitable. Everything feeds the harvest eventually.
//             Unhurried.
// RONIN       Minimal and decisive. One opening, one strike. Fewer words than
//             anyone.
// WITCH       Cunning and patient. The curse was already working before you
//             noticed. Quietly sinister.
// HUNTER      Practical and methodical. The prey always gets reeled in.
//             Matter-of-fact, no gloating.
// WARLOCK     Long-game confidence. Slow corruption, total patience. You were
//             already losing before it started.
// GAMBLER     Self-aware chaos. Knows the odds were bad and did it anyway.
//             Breezy, never takes themselves seriously.
// =============================================================================

// === VICTORY QUOTES ==========================================================
// Cheesy one-liners keyed 'winner_loser'. showWinnerOverlay() picks the entry
// matching the actual outcome; falls back to '_default_' if missing.
// ============================================================================
const VICTORY_QUOTES = {

  // PRIEST wins
  'priest_berserker':   "Rage is a prayer too. Just not the answered kind.",
  'priest_wizard':      "The spellbook had no chapter on this.",
  'priest_knight':      "All that armor. Still no shelter.",
  'priest_sapper':      "The Lord works in mysterious ways. Mostly explosions.",
  'priest_archer':      "God's aim is better.",
  'priest_jester':      "God has seen every trick. This included.",
  'priest_cannoneer':   "The heavens have better artillery.",
  'priest_duelist':     "You've spent a lifetime perfecting your form. There's only one perfect being. God.",
  'priest_necromancer': "Rest. I insist.",
  'priest_reaper':      "Even death has a god.",
  'priest_ronin':       "A code of honor is admirable. A code of honor from God is binding.",
  'priest_witch':       "A curse is just a prayer that went wrong.",
  'priest_hunter':      "Patient, precise, lethal. So is divine judgment.",
  'priest_warlock':     "You've been taking life for so long you forgot someone gives it.",
  'priest_gambler':     "God doesn't gamble. You should've known.",

  // BERSERKER wins
  'berserker_priest':      "Pray faster next time.",
  'berserker_wizard':      "Big brain. Bigger axe.",
  'berserker_knight':      "You brought a fortress to a footrace.",
  'berserker_sapper':      "Your traps needed time. I didn't.",
  'berserker_archer':      "You ran out of arena before I ran out of rage.",
  'berserker_jester':      "Blink all you want. I'm everywhere.",
  'berserker_cannoneer':   "No windup. Just up.",
  'berserker_duelist':     "Counter this.",
  'berserker_necromancer': "I've hit harder things than bones.",
  'berserker_reaper':      "Inevitable. Until it wasn't.",
  'berserker_ronin':       "Preparation is for people who have time.",
  'berserker_witch':       "You hexed me. I didn't notice.",
  'berserker_hunter':      "The hook was still flying when I arrived.",
  'berserker_warlock':     "Attrition only works if I slow down.",
  'berserker_gambler':     "The dice never hit the floor.",

  // WIZARD wins
  'wizard_priest':      "Faith is a hypothesis without a control group.",
  'wizard_berserker':   "Rage is a pattern. Patterns are solved problems.",
  'wizard_knight':      "That armor was the problem, not the solution.",
  'wizard_sapper':      "You set traps. I set outcomes.",
  'wizard_archer':      "Speed and range. Both solvable.",
  'wizard_jester':      "I wasn't aiming where you were. I was aiming where you'd be.",
  'wizard_cannoneer':   "One very slow problem.",
  'wizard_duelist':     "Everything you sent back, I sent on purpose.",
  'wizard_necromancer': "An army of the dead. Still outnumbered.",
  'wizard_reaper':      "Even inevitability has blind spots. I found one.",
  'wizard_ronin':       "You committed to a moment I had already left.",
  'wizard_witch':       "You learned one spell. I learned everything.",
  'wizard_hunter':      "You needed a target. I was a variable.",
  'wizard_warlock':     "The drain requires commitment. I'm not known for that.",
  'wizard_gambler':     "I planned for every outcome. Including that roll.",

  // KNIGHT wins
  'knight_priest':      "God's on your side? I'm on your doorstep.",
  'knight_berserker':   "Speed's impressive until it runs into a wall.",
  'knight_wizard':      "Plate armor: orb repellent certified.",
  'knight_sapper':      "The patience of a saint. The pace of a charge.",
  'knight_archer':      "You ran out of arena.",
  'knight_jester':      "Blink behind me. I'll turn around.",
  'knight_cannoneer':   "The biggest gun in the room needs time. I didn't give it.",
  'knight_duelist':     "You were a hair faster. I was a lunge ahead.",
  'knight_necromancer': "I've faced worse. Much worse. This wasn't worse.",
  'knight_reaper':      "The harvest found no crop.",
  'knight_ronin':       "One stride. One lunge. One winner.",
  'knight_witch':       "I wore your curse like it was the armor.",
  'knight_hunter':      "The hook needs a soft target.",
  'knight_warlock':     "A siege without a gate.",
  'knight_gambler':     "Your dice said no.",

  // SAPPER wins
  'sapper_priest':      "Some blessings arrive too late.",
  'sapper_berserker':   "Speed gets you nowhere in a minefield.",
  'sapper_wizard':      "You were very smart. Right up until you weren't.",
  'sapper_knight':      "Classic. Charging into a minefield.",
  'sapper_archer':      "The trail was always the trap.",
  'sapper_jester':      "You blinked. Right onto it.",
  'sapper_cannoneer':   "Neither of us rush. I just rush better.",
  'sapper_duelist':     "Thrust into a mine. Elegant to the end.",
  'sapper_necromancer': "Your siege ran into mine.",
  'sapper_reaper':      "Your harvest stepped on my field.",
  'sapper_ronin':       "The soot was the first trap. The mine was the last.",
  'sapper_witch':       "You slowed me down. I was heading for you anyway.",
  'sapper_hunter':      "You reeled me in. Right over it.",
  'sapper_warlock':     "You stood in the soot long enough.",
  'sapper_gambler':     "Bad roll. Wrong step.",

  // ARCHER wins
  'archer_priest':      "Lightning needs a target that stays still.",
  'archer_berserker':   "You charged through twenty arrows.",
  'archer_wizard':      "You'd have to catch me first.",
  'archer_knight':      "I didn't need to go through the armor.",
  'archer_sapper':      "I ran circles around your minefield.",
  'archer_jester':      "You blinked to my back. I was already shooting.",
  'archer_cannoneer':   "One-second windup. I fired twelve.",
  'archer_duelist':     "Every deflection was the wrong one.",
  'archer_necromancer': "Skeletons are slow. Arrows aren't.",
  'archer_reaper':      "Can't harvest what you can never reach.",
  'archer_ronin':       "The windup was my warmup.",
  'archer_witch':       "No bouncing. Just shooting.",
  'archer_hunter':      "Two can play the range game. I play it better.",
  'archer_warlock':     "Your beam needs line of sight. I denied it.",
  'archer_gambler':     "No coin beats a full quiver.",

  // JESTER wins
  'jester_priest':      "God was watching. Just not fast enough.",
  'jester_berserker':   "Can't tackle what isn't there.",
  'jester_wizard':      "Behind you. Behind you. Behind you.",
  'jester_knight':      "Lunge at empty air. I'll be back.",
  'jester_sapper':      "The mine couldn't arm. I was already gone.",
  'jester_archer':      "Every arrow landed where I used to be.",
  'jester_cannoneer':   "One shot. Missed. I had twelve blinks.",
  'jester_duelist':     "Counter-thrust into nothing.",
  'jester_necromancer': "Even skeletons can't follow a blink.",
  'jester_reaper':      "Turns out jokes can kill. Who knew.",
  'jester_ronin':       "A ghost image is not a body.",
  'jester_witch':       "Marked me. Still couldn't hit me.",
  'jester_hunter':      "Hook landed. On air.",
  'jester_warlock':     "Line of sight. I don't believe in it.",
  'jester_gambler':     "Your dice said no. My dodge said yes.",

  // CANNONEER wins
  'cannoneer_priest':      "Lightning stings. Cannonballs conclude.",
  'cannoneer_berserker':   "Fast enough to dodge? No.",
  'cannoneer_wizard':      "Your plan was good. Mine was bigger.",
  'cannoneer_knight':      "Impressive armor. Shame about physics.",
  'cannoneer_sapper':      "Small traps. Big gun.",
  'cannoneer_archer':      "You fired many. I fired once.",
  'cannoneer_jester':      "Blink into the impact zone. That's on you.",
  'cannoneer_duelist':     "Redirect this one too.",
  'cannoneer_necromancer': "Your army marched in single file.",
  'cannoneer_reaper':      "Nothing left to harvest.",
  'cannoneer_ronin':       "We both took our time. Mine mattered more.",
  'cannoneer_witch':       "One curse vs. one cannonball. Guess.",
  'cannoneer_hunter':      "You reeled yourself in.",
  'cannoneer_warlock':     "You needed time to ramp. I had one shot.",
  'cannoneer_gambler':     "Your dice said snake eyes. Mine said loaded.",

  // DUELIST wins
  'duelist_priest':      "Your own blessing, returned with interest.",
  'duelist_berserker':   "Counter-thrust on the tackle. Textbook.",
  'duelist_wizard':      "Every spell returned. With a bow.",
  'duelist_knight':      "You had armor. I had timing.",
  'duelist_sapper':      "The trail was a minor inconvenience.",
  'duelist_archer':      "Everything you threw came back.",
  'duelist_jester':      "The blink put you right in thrust range.",
  'duelist_cannoneer':   "That's one way to use a cannonball.",
  'duelist_necromancer': "I fought your army. You fought my riposte.",
  'duelist_reaper':      "You spun. I thrust. Mathematics.",
  'duelist_ronin':       "All that buildup. Less reach.",
  'duelist_witch':       "The curse landed second.",
  'duelist_hunter':      "You reeled me in. I thanked you.",
  'duelist_warlock':     "A lunge doesn't negotiate.",
  'duelist_gambler':     "Whatever you rolled, this was the outcome.",

  // NECROMANCER wins
  'necromancer_priest':      "Every blessing has a counter-blessing.",
  'necromancer_berserker':   "One skeleton is a distraction. Three is a siege.",
  'necromancer_wizard':      "You solved the wrong problem.",
  'necromancer_knight':      "The dead don't care about armor.",
  'necromancer_sapper':      "My traps have legs.",
  'necromancer_archer':      "Kill enough of them, and the rest come back.",
  'necromancer_jester':      "You blinked into the skeleton. Then it burst.",
  'necromancer_cannoneer':   "Two for the price of one.",
  'necromancer_duelist':     "The counter found the wrong target.",
  'necromancer_reaper':      "Even the reaper can be outnumbered.",
  'necromancer_ronin':       "The slash felt decisive. The army disagreed.",
  'necromancer_witch':       "The mark made the burst hit harder. Ironic.",
  'necromancer_hunter':      "The hook pulled a skeleton in. Then it burst.",
  'necromancer_warlock':     "You picked the wrong target.",
  'necromancer_gambler':     "Odds were against you. Also skeletons.",

  // REAPER wins
  'reaper_priest':      "You healed. I healed more.",
  'reaper_berserker':   "Every blow sharpened the harvest.",
  'reaper_wizard':      "Your shield made me cautious. Briefly.",
  'reaper_knight':      "The armor was thorough. The time was not.",
  'reaper_sapper':      "The mine healed me. Technically.",
  'reaper_archer':      "A quiver full of gifts.",
  'reaper_jester':      "The trick only works so many times.",
  'reaper_cannoneer':   "Thank you for the donation.",
  'reaper_duelist':     "Every counter fed the harvest.",
  'reaper_necromancer': "A generous army.",
  'reaper_ronin':       "The big swing. Half returned.",
  'reaper_witch':       "You cursed me stronger. I appreciated it.",
  'reaper_hunter':      "The wound was a gift.",
  'reaper_warlock':     "Two leeches. One winner.",
  'reaper_gambler':     "Luck runs out. Blood harvest doesn't.",

  // RONIN wins
  'ronin_priest':      "The lightning was fast. The iai was faster.",
  'ronin_berserker':   "You charged into the swing.",
  'ronin_wizard':      "The shield held. Once.",
  'ronin_knight':      "Reach matters.",
  'ronin_sapper':      "A clean cut ignores the mess.",
  'ronin_archer':      "Arrows lost to a single stroke.",
  'ronin_jester':      "You chose the worst moment.",
  'ronin_cannoneer':   "Half a second. All the difference.",
  'ronin_duelist':     "More reach. More weight. Better outcome.",
  'ronin_necromancer': "One cut. Cleared the room.",
  'ronin_reaper':      "No harvest if the fight ends in one blow.",
  'ronin_witch':       "The curse was noted. Briefly.",
  'ronin_hunter':      "You pulled me closer. Bad idea.",
  'ronin_warlock':     "Patient. Then decisive.",
  'ronin_gambler':     "You needed luck. I only needed one opening.",

  // WITCH wins
  'witch_priest':      "Even holy men have their curses.",
  'witch_berserker':   "You hit harder. I thanked you for it.",
  'witch_wizard':      "A patient curse finds every gap.",
  'witch_knight':      "The armor was impressive. The mark didn't care.",
  'witch_sapper':      "Your own trap, amplified.",
  'witch_archer':      "It would've found you on the first try.",
  'witch_jester':      "You dodged the bolt. Ran into the bounce.",
  'witch_cannoneer':   "The curse arrived before the cannonball.",
  'witch_duelist':     "Whatever you sent back came back cursed.",
  'witch_necromancer': "Your own army wore my curse.",
  'witch_reaper':      "You harvest the living. I cursed you first.",
  'witch_ronin':       "The big strike. Plus fifty percent.",
  'witch_hunter':      "You reeled yourself into a curse.",
  'witch_warlock':     "Two curses. Mine arrived first.",
  'witch_gambler':     "The roll was fine. The hex was not.",

  // HUNTER wins
  'hunter_priest':      "Hooked. Stunned. Finished.",
  'hunter_berserker':   "You charged. I hooked. You stopped.",
  'hunter_wizard':      "Hard to aim when you're being pulled.",
  'hunter_knight':      "Every armor has a gap.",
  'hunter_sapper':      "Your field. My fish.",
  'hunter_archer':      "Running is fine. Until someone reels you in.",
  'hunter_jester':      "Hooked mid-blink. Clean catch.",
  'hunter_cannoneer':   "Clean pull. Before the shot.",
  'hunter_duelist':     "No range. No riposte.",
  'hunter_necromancer': "Hooked right through the skeleton wall.",
  'hunter_reaper':      "No time to harvest.",
  'hunter_ronin':       "Hooked during the windup. Perfect timing.",
  'hunter_witch':       "The hex marked me. The hook found you.",
  'hunter_warlock':     "The stun came first.",
  'hunter_gambler':     "You rolled the dice. I threw the hook.",

  // WARLOCK wins
  'warlock_priest':      "You healed steadily. I drained faster.",
  'warlock_berserker':   "The faster you moved, the more I took.",
  'warlock_wizard':      "A scholar's mistake.",
  'warlock_knight':      "The armor was thorough. So was I.",
  'warlock_sapper':      "Your own trail held you in place.",
  'warlock_archer':      "Distance was never your friend here.",
  'warlock_jester':      "Patience outlasts tricks.",
  'warlock_cannoneer':   "Your patience gave me mine.",
  'warlock_duelist':     "Interruptions are temporary.",
  'warlock_necromancer': "Your shield worked once.",
  'warlock_reaper':      "Two different philosophies. Mine won.",
  'warlock_ronin':       "A long wind-up is a long gift.",
  'warlock_witch':       "Two curses walked in. One walked out.",
  'warlock_hunter':      "I waited through the stun.",
  'warlock_gambler':     "The drain doesn't care what you rolled.",

  // GAMBLER wins
  'gambler_priest':      "God may not gamble. But today luck worked out.",
  'gambler_berserker':   "Rolled max pips. Didn't see that coming.",
  'gambler_wizard':      "Every bet pays if you make enough of them.",
  'gambler_knight':      "The odds were long. Isn't that the point?",
  'gambler_sapper':      "One bad roll before the good one.",
  'gambler_archer':      "Today the house won.",
  'gambler_jester':      "Tricks run out. Coins don't.",
  'gambler_cannoneer':   "We both waited. One of us was luckier.",
  'gambler_duelist':     "One deflection. Six more coming.",
  'gambler_necromancer': "Even the skeleton was a roll.",
  'gambler_reaper':      "Even the reaper can't harvest a coin.",
  'gambler_ronin':       "A long wind-up is three rolls worth of coins.",
  'gambler_witch':       "The curse improved my odds.",
  'gambler_hunter':      "The hook needed time. The coins didn't ask.",
  'gambler_warlock':     "Instant luck beats slow corruption.",

  '_default_': "Another day, another fight.",
};
