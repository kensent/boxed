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
// GEOMANCER   Calm geometer. Sees the arena as a sigil-in-progress. Every fight
//             is patterns aligning; opponents don't dodge the lines, they miss
//             them. Patient, slightly mystical, never raises his voice.
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
// Cheesy one-liners keyed 'winner_loser'. Currently unused — the winner-name
// overlay that consumed them was retired alongside the celebration phase.
// Kept as a data archive in case the outro grammar gains a quote slot later;
// falls back to '_default_' if missing.
//
// Every quote must do two things at once: be cheesy/witty AND sound like the
// character who says it. A quote that's only clever is wrong. A quote that's
// only in-voice is wrong. Both, always.
//
// Don't pull punches. These are victory quotes — the winner just ended
// someone. The lines should be unhinged enough to match that energy.
// ============================================================================
const VICTORY_QUOTES = {

  // PRIEST wins
  'priest_berserker':   "Rage is a prayer too. Just not the answered kind.",
  'priest_wizard':      "You studied the work. I know the author.",
  'priest_geomancer':   "Stones are silent. God speaks.",
  'priest_sapper':      "The Lord works in mysterious ways. Mostly explosions.",
  'priest_archer':      "God's aim is better.",
  'priest_jester':      "God has seen every trick. This included.",
  'priest_cannoneer':   "The heavens have better artillery.",
  'priest_duelist':     "You've spent a lifetime perfecting your form. There's only one perfect being. God.",
  'priest_necromancer': "Rest. I insist.",
  'priest_reaper':      "Even death has a god.",
  'priest_ronin':       "A code of honor is admirable. A code of honor from God is binding.",
  'priest_witch':       "A curse is just a prayer that went wrong.",
  'priest_hunter':      "You found your prey. God found you.",
  'priest_warlock':     "You've been taking life for so long you forgot someone gives it.",
  'priest_gambler':     "God doesn't gamble. You should've known.",

  // BERSERKER wins
  'berserker_priest':      "Pray faster next time.",
  'berserker_wizard':      "Big brain. Bigger fists.",
  'berserker_geomancer':   "Your lines. My fist.",
  'berserker_sapper':      "Your traps needed time. I didn't.",
  'berserker_archer':      "Arrows slow me down. Briefly.",
  'berserker_jester':      "Blink all you want. I'm everywhere.",
  'berserker_cannoneer':   "No windup. Just up.",
  'berserker_duelist':     "Counter this.",
  'berserker_necromancer': "I've hit harder things than bones.",
  'berserker_reaper':      "Inevitable. Until it wasn't.",
  'berserker_ronin':       "Preparation is for people who have time.",
  'berserker_witch':       "You hexed me. I didn't notice.",
  'berserker_hunter':      "The hook was still flying when I arrived.",
  'berserker_warlock':     "Slow poison. I wasn't.",
  'berserker_gambler':     "The dice never hit the floor.",

  // WIZARD wins
  'wizard_priest':      "Faith is a hypothesis without a control group.",
  'wizard_berserker':   "Rage is a pattern. Patterns are solved problems.",
  'wizard_geomancer':   "Geometry is a special case of magic. I do the general case.",
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

  // GEOMANCER wins
  'geomancer_priest':      "Your lightning followed one line. Mine followed seven.",
  'geomancer_berserker':   "You ran the perimeter. I drew it.",
  'geomancer_wizard':      "All your shields broke on geometry.",
  'geomancer_sapper':      "Your traps were laid. Mine were inscribed.",
  'geomancer_archer':      "Arrows are lines. Mine were already there.",
  'geomancer_jester':      "Decoys cross lines too. Eventually.",
  'geomancer_cannoneer':   "You held still. The sigil knew.",
  'geomancer_duelist':     "A blade is one edge. A sigil is many.",
  'geomancer_necromancer': "Your army wandered through the network.",
  'geomancer_reaper':      "Your harvest crossed three lines.",
  'geomancer_ronin':       "Your one cut. My many.",
  'geomancer_witch':       "A curse is a hex of words. A sigil is a hex of place.",
  'geomancer_hunter':      "You hooked nothing. The stones held.",
  'geomancer_warlock':     "Your channel needed time. I had geometry.",
  'geomancer_gambler':     "Lines don't roll.",

  // SAPPER wins
  'sapper_priest':      "Some blessings arrive too late.",
  'sapper_berserker':   "Speed gets you nowhere in a minefield.",
  'sapper_wizard':      "You were very smart. Right up until you weren't.",
  'sapper_geomancer':   "Your stones drew lines. Mine drew a crater.",
  'sapper_archer':      "The trail was always the trap.",
  'sapper_jester':      "You blinked. Right onto it.",
  'sapper_cannoneer':   "We both took our time. Mine was underground.",
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
  'archer_geomancer':   "Lines pass through arrows too.",
  'archer_sapper':      "I ran circles around your minefield.",
  'archer_jester':      "You blinked to my back. I was already shooting.",
  'archer_cannoneer':   "One-second windup. I fired twelve.",
  'archer_duelist':     "You deflected three. I fired fifteen.",
  'archer_necromancer': "Skeletons are slow. Arrows aren't.",
  'archer_reaper':      "Can't harvest what you can never reach.",
  'archer_ronin':       "The windup was my warmup.",
  'archer_witch':       "All that bounce and it still missed.",
  'archer_hunter':      "Two can play the range game. I play it better.",
  'archer_warlock':     "You need me to stand still. I find that funny.",
  'archer_gambler':     "No coin beats a full quiver.",

  // JESTER wins
  'jester_priest':      "God was watching. Just not fast enough.",
  'jester_berserker':   "You blinked. Wait, no. That was me.",
  'jester_wizard':      "Behind you. Behind you. Behind you.",
  'jester_geomancer':   "You drew a perfect web. I wasn't in it.",
  'jester_sapper':      "Blink. Blink. Boom? No. Blink.",
  'jester_archer':      "Every arrow landed where I used to be.",
  'jester_cannoneer':   "One shot. Twelve places I wasn't.",
  'jester_duelist':     "Great form. I wasn't there to see it.",
  'jester_necromancer': "I blinked into the skeleton. Out the other side. Hi.",
  'jester_reaper':      "Turns out jokes can kill. Who knew.",
  'jester_ronin':       "Good swing. Wrong jester.",
  'jester_witch':       "You cursed the air where I was. Rude.",
  'jester_hunter':      "Hook landed. On air.",
  'jester_warlock':     "Line of sight. I don't believe in it.",
  'jester_gambler':     "Rolled a six. Still missed.",

  // CANNONEER wins
  'cannoneer_priest':      "Lightning stings. Cannonballs conclude.",
  'cannoneer_berserker':   "Fast enough to dodge? No.",
  'cannoneer_wizard':      "Your plan was good. Mine was bigger.",
  'cannoneer_geomancer':   "All those lines. None thicker than my shell.",
  'cannoneer_sapper':      "Small traps. Big gun.",
  'cannoneer_archer':      "You fired many. I fired once.",
  'cannoneer_jester':      "Blink into the impact zone. That's on you.",
  'cannoneer_duelist':     "Redirect this one too.",
  'cannoneer_necromancer': "Your army marched in single file.",
  'cannoneer_reaper':      "Nothing left to harvest.",
  'cannoneer_ronin':       "We both took our time. Mine mattered more.",
  'cannoneer_witch':       "One curse vs. one cannonball. Guess.",
  'cannoneer_hunter':      "You reeled yourself in.",
  'cannoneer_warlock':     "You needed time. I needed one moment.",
  'cannoneer_gambler':     "Your dice said snake eyes. Mine said loaded.",

  // DUELIST wins
  'duelist_priest':      "Your own blessing, returned with interest.",
  'duelist_berserker':   "You ran into the blade. I barely moved.",
  'duelist_wizard':      "Every spell returned. With a bow.",
  'duelist_geomancer':   "Geometry is theory. The thrust is practice.",
  'duelist_sapper':      "The trail was a minor inconvenience.",
  'duelist_archer':      "Everything you threw came back.",
  'duelist_jester':      "You blinked to safety. It wasn't.",
  'duelist_cannoneer':   "That's one way to use a cannonball.",
  'duelist_necromancer': "An army is just a lot of the same mistake.",
  'duelist_reaper':      "Every swing feeds you. Mine ended the conversation.",
  'duelist_ronin':       "All that buildup. Less reach.",
  'duelist_witch':       "The curse landed second.",
  'duelist_hunter':      "You reeled me in. I thanked you.",
  'duelist_warlock':     "Slow corruption assumes a slow opponent.",
  'duelist_gambler':     "Whatever you rolled, this was the outcome.",

  // NECROMANCER wins
  'necromancer_priest':      "One prayer. Three skeletons. The math was clear.",
  'necromancer_berserker':   "One skeleton is a distraction. Three is a siege.",
  'necromancer_wizard':      "You solved the wrong problem.",
  'necromancer_geomancer':   "Your network was clever. The army crossed it anyway.",
  'necromancer_sapper':      "My traps have legs.",
  'necromancer_archer':      "Kill enough of them, and the rest come back.",
  'necromancer_jester':      "You blinked into the skeleton. That was a mistake.",
  'necromancer_cannoneer':   "Two for the price of one.",
  'necromancer_duelist':     "Your blade found every opening. The army had more.",
  'necromancer_reaper':      "Even the reaper can be outnumbered.",
  'necromancer_ronin':       "The slash felt decisive. The army disagreed.",
  'necromancer_witch':       "You cursed the dead. The dead returned the favor.",
  'necromancer_hunter':      "You're built for one prey. I sent an army.",
  'necromancer_warlock':     "You focused on the general. The army wasn't watching.",
  'necromancer_gambler':     "Odds were against you. Also skeletons.",

  // REAPER wins
  'reaper_priest':      "You healed. I healed more.",
  'reaper_berserker':   "Every blow sharpened the harvest.",
  'reaper_wizard':      "Your shield made me cautious. Briefly.",
  'reaper_geomancer':   "Your stones marked the field. I harvested it.",
  'reaper_sapper':      "The mine healed me. Technically.",
  'reaper_archer':      "A quiver full of gifts.",
  'reaper_jester':      "You can only blink so far from inevitable.",
  'reaper_cannoneer':   "Thank you for the donation.",
  'reaper_duelist':     "Every blow you returned still landed. I appreciated both.",
  'reaper_necromancer': "A generous army.",
  'reaper_ronin':       "The big swing. Half returned.",
  'reaper_witch':       "You cursed me stronger. I appreciated it.",
  'reaper_hunter':      "The wound was a gift.",
  'reaper_warlock':     "Two leeches. One winner.",
  'reaper_gambler':     "The house always wins. So does the harvest.",

  // RONIN wins
  'ronin_priest':      "The lightning was fast. I was faster.",
  'ronin_berserker':   "You charged into the swing.",
  'ronin_wizard':      "The shield held. Once.",
  'ronin_geomancer':   "One cut bisects every line.",
  'ronin_sapper':      "A clean cut ignores the mess.",
  'ronin_archer':      "Arrows lost to a single stroke.",
  'ronin_jester':      "You chose the worst moment.",
  'ronin_cannoneer':   "Half a second. All the difference.",
  'ronin_duelist':     "Longer blade. Shorter fight.",
  'ronin_necromancer': "One cut. Cleared the room.",
  'ronin_reaper':      "Ended before the harvest began.",
  'ronin_witch':       "The curse was noted. Briefly.",
  'ronin_hunter':      "You pulled me closer. Bad idea.",
  'ronin_warlock':     "Patient. Then decisive.",
  'ronin_gambler':     "You needed luck. I only needed one opening.",

  // WITCH wins
  'witch_priest':      "Even holy men have their curses.",
  'witch_berserker':   "Rage makes you predictable. Predictable is cursable.",
  'witch_wizard':      "Every spell you knew. I only needed one.",
  'witch_geomancer':   "Stones don't dodge.",
  'witch_sapper':      "You waited patiently. So did my curse.",
  'witch_archer':      "It would've found you on the first try.",
  'witch_jester':      "The curse follows. Blinking doesn't help.",
  'witch_cannoneer':   "The curse arrived before the cannonball.",
  'witch_duelist':     "The curse doesn't deflect. It follows.",
  'witch_necromancer': "Your own army wore my curse.",
  'witch_reaper':      "A cursed harvest is a poor harvest.",
  'witch_ronin':       "You hit hard. I made sure it cost you.",
  'witch_hunter':      "You came to me. That was always the plan.",
  'witch_warlock':     "Two curses. Mine arrived first.",
  'witch_gambler':     "The roll was fine. The hex was not.",

  // HUNTER wins
  'hunter_priest':      "Hooked. Stunned. Finished.",
  'hunter_berserker':   "You charged. I hooked. You stopped.",
  'hunter_wizard':      "Hard to aim when you're being pulled.",
  'hunter_geomancer':   "Reeled past the network.",
  'hunter_sapper':      "Traps wait for prey. I go get mine.",
  'hunter_archer':      "Running is fine. Until someone reels you in.",
  'hunter_jester':      "Hooked mid-blink. Clean catch.",
  'hunter_cannoneer':   "Clean pull. Before the shot.",
  'hunter_duelist':     "You can't deflect a hook.",
  'hunter_necromancer': "Hooked right through the skeleton wall.",
  'hunter_reaper':      "No time to harvest.",
  'hunter_ronin':       "The opening was for me, not you.",
  'hunter_witch':       "You had time to curse me. Not to dodge.",
  'hunter_warlock':     "My tether has a barb.",
  'hunter_gambler':     "The hook doesn't care about odds.",

  // WARLOCK wins
  'warlock_priest':      "You healed steadily. I drained faster.",
  'warlock_berserker':   "The faster you moved, the more I took.",
  'warlock_wizard':      "You calculated everything except how long you could last.",
  'warlock_geomancer':   "Your stones can't refill. I can.",
  'warlock_sapper':      "The field was ready. So was I.",
  'warlock_archer':      "Distance was never your friend here.",
  'warlock_jester':      "Patience outlasts tricks.",
  'warlock_cannoneer':   "You timed the shot. I timed the whole fight.",
  'warlock_duelist':     "There's no edge to deflect. Just absence.",
  'warlock_necromancer': "Your army kept me busy. You kept me fed.",
  'warlock_reaper':      "The harvest went straight to me.",
  'warlock_ronin':       "A long wind-up is a long gift.",
  'warlock_witch':       "Two curses walked in. One walked out.",
  'warlock_hunter':      "You reeled me closer. Thanks.",
  'warlock_gambler':     "The drain doesn't care what you rolled.",

  // GAMBLER wins
  'gambler_priest':      "Apparently luck works on Sundays too.",
  'gambler_berserker':   "Rolled max pips. Didn't see that coming.",
  'gambler_wizard':      "Every bet pays if you make enough of them.",
  'gambler_geomancer':   "Lines, schmines. Coin's gold.",
  'gambler_sapper':      "One bad roll before the good one.",
  'gambler_archer':      "Today the house won.",
  'gambler_jester':      "Tricks run out. Coins don't.",
  'gambler_cannoneer':   "We both waited. One of us was luckier.",
  'gambler_duelist':     "One deflection. Six more coming.",
  'gambler_necromancer': "Even the skeleton was a roll.",
  'gambler_reaper':      "Even the reaper can't harvest a coin.",
  'gambler_ronin':       "By the time you swung, I'd rolled four times.",
  'gambler_witch':       "The curse improved my odds.",
  'gambler_hunter':      "Best fisherman I've ever beaten.",
  'gambler_warlock':     "Instant luck beats slow corruption.",

  '_default_': "Another day, another fight.",
};
