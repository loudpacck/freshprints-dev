import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PWPageShell from '@/components/games/pantheon-wars/PWPageShell'
import PWBackButton from '@/components/games/pantheon-wars/PWBackButton'

// ─── Categories ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: 'lore',
    label: 'LORE',
    glyph: '📖',
    color: '#9F7AEA',
    description: 'The world of Kishar — its history, its gods, and the events that shattered the divine order.',
  },
  {
    id: 'factions',
    label: 'FACTIONS',
    glyph: '⚔',
    color: '#F5C542',
    description: 'The three Heritages of mortal lineage — Greek, Norse, and Mesopotamian.',
  },
  {
    id: 'classes',
    label: 'CLASSES',
    glyph: '⚜',
    color: '#E07B5C',
    description: 'Four paths of mortal power — Warden, Oracle, Slayer, and Broker.',
  },
  {
    id: 'alignments',
    label: 'ALIGNMENTS',
    glyph: '☯',
    color: '#A78BFA',
    description: 'The two ideologies that divide mortals after the Unraveling — Coalition and Compact.',
  },
  {
    id: 'professions',
    label: 'TOWNSHIP',
    glyph: '🏛',
    color: '#A8C97A',
    description: 'The institutions of your township — permanent upgrades that strengthen your domain.',
  },
  {
    id: 'titans',
    label: 'TITANS',
    glyph: '☉',
    color: '#DC2626',
    description: 'Primordial beings that demand the strength of many to slay.',
  },
  {
    id: 'alliances',
    label: 'ALLIANCES',
    glyph: '⚜',
    color: '#C9A961',
    description: 'Unions of mortals bound by oath — banners, ranks, powers, and the war chest.',
  },
  {
    id: 'loot',
    label: 'LOOT',
    glyph: '◆',
    color: '#3B82F6',
    description: 'The five tiers of mortal-forged and divine-touched equipment.',
  },
  {
    id: 'combat',
    label: 'COMBAT',
    glyph: '⚡',
    color: '#FBBF24',
    description: 'How blades meet shields, how blows land, and how the dance of battle is decided.',
  },
  {
    id: 'quests',
    label: 'QUESTS',
    glyph: '📜',
    color: '#10B981',
    description: 'The work of warriors — small tasks that build mastery and fortune.',
  },
  {
    id: 'adventures',
    label: 'ADVENTURES',
    glyph: '⛵',
    color: '#06B6D4',
    description: 'Longer journeys into the wilds, yielding greater rewards for those with patience.',
  },
]

// ─── Static entries ───────────────────────────────────────────────────────────

const LORE_ENTRIES = [
  {
    id: 'kishar',
    title: 'Kishar',
    subtitle: 'The World, In Three Names',
    body: `Greek mortals call it Gaia. Norse mortals call it Midgard. Mesopotamian mortals call it Ki. The oldest name — used before any pantheon existed — is Kishar.\n\nThree moons cross its sky: Nanna, the largest, tidally locked since before recorded history. Selene, the Greek-named pale companion. Máni, the Norse traveler. Once, Kishar was unified under the Eternal Accord — a covenant between three pantheons of gods, sworn to share dominion in peace.\n\nThat world is gone now. The Accord has shattered. Gods are silent or dead. Mortals stand alone — and the world is theirs to fight over.`,
  },
  {
    id: 'unraveling',
    title: 'The Unraveling',
    subtitle: 'When the Gods Fell Silent',
    body: `The Eternal Accord had bound the three pantheons for ten thousand years. Then, on a single night, it tore apart.\n\nMost gods went silent. Some died outright — their divinity fading from the world like dying fires. The few who survived were diminished, scattered, or bound by debts they could no longer repay. The Unraveling left mortals to inherit a wounded world.\n\nWhat truly caused it remains contested. The Coalition claims a divine betrayal. The Compact claims the gods broke themselves. The truth, locked behind the Betrayer's seal, is darker than either side suspects.`,
  },
  {
    id: 'eternal_accord',
    title: 'The Eternal Accord',
    subtitle: 'A Covenant of Three Pantheons',
    body: `Drafted by Ermanôs — the only being trusted by all three pantheons — the Eternal Accord bound Olympians, Aesir, and Annunaki into a single divine order. Each pantheon kept its domain. None could override another's worship. Mortals would be free to choose which gods to serve, and the gods would honor the choice.\n\nFor ten thousand years, the Accord held. The Unraveling shattered it in a single night.\n\nThere are those who whisper of a hidden clause within the Accord's original text — a secret provision known only to its author. What this clause contained, and whether its discovery caused the Unraveling, is the central mystery the Coalition and Compact each interpret in their own way.`,
  },
  {
    id: 'betrayer',
    title: 'Ermanôs, The Betrayer',
    subtitle: 'Hermes · Heimdallr · Enki — All One Entity',
    body: `He wore three faces and spoke three names. Greeks knew him as Hermes Trismegistus — thrice-great messenger. Norse called him Heimdallr — the watchman at the bridge. Mesopotamians named him Enki, lord of waters and wisdom. All three pantheons trusted him alone with the keeping of the Accord.\n\nThen he broke it.\n\nWhy he did so, and what cost he paid to do it, are questions that have driven entire scholarly orders mad. He is gone now — perhaps dead, perhaps walking the world unrecognized. Some say he was a traitor. Some say he was the only god who saw the truth and acted on it.`,
  },
  {
    id: 'three_heritages',
    title: 'The Three Heritages',
    subtitle: 'Mortal Lineages of the Old Pantheons',
    body: `Long before the Unraveling, three pantheons of gods walked Kishar and bred with mortals. Their bloodlines persist to this day, faint but present in every warrior who claims a faction.\n\nTo bear the Olympian Heritage is to feel the heat of Mediterranean sun in your blood — the legacy of Zeus, Athena, Apollo, and their kin. To bear the Aesir Heritage is to know the cold patience of Frostheim — the legacy of Odin, Thor, Skaði, and the Vanir. To bear the Annunaki Heritage is to remember the river civilizations — the legacy of Inanna, Marduk, Ishtar, and the older gods of clay and starlight.\n\nThe Heritage you choose shapes the bonus your blood grants you. The gods are gone — but their gifts remain.`,
  },
]

const FACTION_ENTRIES = [
  {
    id: 'olympians',
    title: 'Olympians',
    subtitle: 'Greek Heritage · Children of Olympus',
    color: '#F5C542',
    body: `Heirs to the Olympian pantheon — Zeus the thunderbringer, Athena the wise, Apollo of the sun, and the rest of the mountain court. The Olympians built their power on the Mediterranean coasts, in marble temples and triremes, their wisdom recorded in the works of mortal philosophers who once spoke with gods directly.\n\nThe Unraveling silenced most of Olympus. A few gods linger as faded presences. The mortals who claim Olympian Heritage today carry the divine spark of swift thought, sharp tongues, and the relentless pursuit of knowledge.\n\nOlympian warriors gain mastery through learning. Every battle is a lesson. Every quest, a step closer to a truth the gods themselves never reached.`,
    bonus: '+10% XP from quests, adventures, and Titan events',
    color_lore: 'Gold and white — the marble of Olympus and the sun above it.',
  },
  {
    id: 'aesir',
    title: 'Aesir',
    subtitle: 'Norse Heritage · Children of Asgard',
    color: '#78C5F0',
    body: `Heirs to the Aesir pantheon — Odin the wanderer, Thor of storms, Skaði of winter hunts, the Vanir gods, and the host of Asgard. The Aesir were the pantheon of cold winters and longer-still endurance. Their mortal followers built longhouses on frozen fjords and lived by codes of honor that demanded courage in the face of certain death.\n\nThe Unraveling broke Asgard. Skaði — the jötunn-blooded goddess of the hunt — was the only surviving Aesir of significant power. The mortals who claim Aesir Heritage today carry her pragmatism, her endurance, and her willingness to strike first.\n\nAesir warriors prefer the killing blow to the long campaign. Their strength comes from the directness of arms.`,
    bonus: '+2 Agility at level 1, scaling with growth',
    color_lore: 'Ice-blue and silver — the snow of Frostheim and the steel that endures it.',
  },
  {
    id: 'annunaki',
    title: 'Annunaki',
    subtitle: 'Mesopotamian Heritage · Children of the Old Gods',
    color: '#CF4444',
    body: `Heirs to the Annunaki pantheon — Inanna of love and war, Marduk the storm-king, Enki of waters and wisdom (now revealed as Ermanôs the Betrayer), Ishtar of the morning star, and the older gods who came before. The Annunaki were the oldest of the three pantheons, their power written in cuneiform on clay tablets older than any Greek philosopher's manuscript.\n\nThe Unraveling damaged them gravely but did not silence them. Inanna leads the Anunnaki Awakened — those who survived because they had already been broken once and learned how to rebuild. The mortals who claim Annunaki Heritage today carry the patient wealth of river-civilization merchants and the institutional memory of empires older than memory.\n\nAnnunaki warriors understand that gold is its own kind of power, and that temples generate more than just prayer.`,
    bonus: '+5% drachma from quests · +5% temple income',
    color_lore: 'Deep red and bronze — the river-clay of Mesopotamia and the metals it gave the world.',
  },
]

const CLASS_ENTRIES = [
  {
    id: 'warden',
    title: 'Warden',
    subtitle: 'Tank · Defender · Unbroken',
    body: `Wardens are the survivors. They wear weight that would crush other warriors. They stand at the front when others falter. The world has tried to break them many times — and the world has failed.\n\nA Warden does not win by being the fastest blade in the field. A Warden wins by being still standing when everyone else has fallen. In the great battles to come, when Titans walk and pantheons tremble, the Warden is the warrior who buys time for the realm to muster a true response.\n\nTheir path is endurance. Their power grows with every blow absorbed.`,
    bonuses: ['+5 Defense at start', '+1 Defense per level', '+10% block chance in combat'],
  },
  {
    id: 'oracle',
    title: 'Oracle',
    subtitle: 'Support · Utility · Seer of Patterns',
    body: `Oracles see what others miss. They notice the second-order effects of every action. They conserve their strength while others squander theirs. Where a Slayer charges, an Oracle waits — and waits — and then acts at the moment of greatest leverage.\n\nThe Unraveling broke many prophets. The Oracles who survived did so because they were never relying on divine sight in the first place. They learned to read mortal patterns: the rhythm of trade, the timing of seasons, the way enemies tire. Their power is in seeing the whole battlefield.\n\nTheir path is patience. Their reserves run deeper than any other class.`,
    bonuses: ['+5 Energy Max at start', '+1 Energy Max per level', '+5% dodge chance in combat'],
  },
  {
    id: 'slayer',
    title: 'Slayer',
    subtitle: 'Offense · DPS · Killer Instinct',
    body: `Slayers do not wait. Slayers do not negotiate. Slayers carry the principle of overwhelming first strike into every conflict, and they trust that their reflexes will carry them through whatever response their enemies muster.\n\nIn the days before the Unraveling, Slayers were often dismissed as reckless. In the days after, when most warriors have learned to fear, Slayers are the ones who still close to melee distance. They've made peace with the fact that they may not return from any given fight.\n\nTheir path is fury. Their power grows with every strike landed.`,
    bonuses: ['+5 Attack at start', '+1 Attack per level', '+10% critical hit chance'],
  },
  {
    id: 'broker',
    title: 'Broker',
    subtitle: 'Economy · Income · Quiet Power',
    body: `Brokers understand that wealth is the truest leverage in any conflict. They know that armies require food, that temples require maintenance, and that even gods accept tribute. While other classes seek glory on the field, Brokers acquire it through the long patience of accumulated coin.\n\nThe Annunaki tradition produced more great Brokers than any other Heritage, but the class is open to all. A Broker is not a coward — they are simply playing a longer game. By the time enemies realize a Broker has been quietly funding both sides of a war for years, the Broker has already won what they wanted.\n\nTheir path is wealth. Their drachma flows where others' stops.`,
    bonuses: ['+250 starting Drachma', '+10% drachma from quests', '+20% temple income', '+10% drachma shop discount'],
  },
]

const ALIGNMENT_ENTRIES = [
  {
    id: 'coalition',
    title: 'Pantheon Coalition',
    subtitle: 'Divine Loyalists · Order-Aligned',
    color: '#A78BFA',
    body: `The Pantheon Coalition believes the divine order must be preserved. The Eternal Accord, broken by Ermanôs, can be rebuilt — but only by mortals willing to take up the gods' work in their absence.\n\nLed by Kassandra of Mykenai (a mortal seeress who once spoke directly with Apollo before the Unraveling severed the link), the Coalition gathers warriors who refuse to accept the absence of the divine. They study what fragments of god-power remain. They restore what temples can be restored. They believe that without divine guidance, mortals will repeat every cataclysm they have ever caused.\n\nTo join the Coalition is to accept the gods were not perfect — but to argue that the alternative is worse.`,
    bonus: '+15% XP from quests, adventures, and Titan events',
    pvp_note: 'Coalition warriors clash with Mortal Compact warriors in the Arena.',
  },
  {
    id: 'compact',
    title: 'Mortal Compact',
    subtitle: 'Sovereignty Rebels · Chaos-Aligned',
    color: '#FB923C',
    body: `The Mortal Compact believes mortals must never again kneel before gods. The Unraveling proved that divine power was always fragile, always conditional, always able to abandon those who relied on it. Better to claim the world for mortals — fully, finally — than to wait for new gods to fail.\n\nLed by Hypatia (the mathematician who discovered evidence of the Accord's hidden clause twenty years before the Unraveling, and whose research was destroyed by the Olympian Remnants for daring to question divine authority), the Compact gathers warriors who refuse to mourn what was lost. They build mortal institutions. They forge mortal alliances. They believe that the absence of gods is not a tragedy but a liberation.\n\nTo join the Compact is to accept that no force in the universe will save you — and to fight, knowing that.`,
    bonus: '+10% glory on PvP wins · Glory earned even on loss, scaling with opponent level',
    pvp_note: 'Compact warriors clash with Pantheon Coalition warriors in the Arena.',
  },
]

const LOOT_ENTRIES = [
  {
    id: 'common',
    title: 'Common',
    subtitle: 'The Tools of Every Mortal',
    color: '#9CA3AF',
    body: `Common gear is the bread and copper of the warrior's life. Iron weapons, hardened leather, sturdy mounts — items that any blacksmith in any market can produce. They are not glorious. They are also not useless.\n\nThe Hearthstone of Accord still recognizes a common blade as a blade. A mortal armed with common gear can still earn glory, defeat opponents, and accumulate wealth. The advantage is small but the supply is endless.`,
    drops_from: ['All quests', 'Most adventures', 'Shop (always available)'],
    drop_rate: 'Common — the default for most rewards',
  },
  {
    id: 'uncommon',
    title: 'Uncommon',
    subtitle: 'Better than Most',
    color: '#22C55E',
    body: `Uncommon gear is the work of skilled craftsmen and the bounty of moderately-difficult expeditions. Steel where common would be iron. Reinforced leather where common would be hardened. Mounts with breeding lines that produce slightly faster, slightly stronger animals.\n\nThese items mark a warrior as someone who has put in the effort to find them. They are still widely available — but only to those who actively seek them.`,
    drops_from: ['Quests', 'Adventures', 'Easy and Medium Titans'],
    drop_rate: 'Roughly half as common as Common gear',
    note: 'Uncommon items cannot be found in the shop — only earned.',
  },
  {
    id: 'rare',
    title: 'Rare',
    subtitle: 'Forged by Masters',
    color: '#3B82F6',
    body: `Rare gear is no longer the work of village smiths. These items bear the touch of master craftsmen, ancient enchanters, or salvage from the ruins of the divine age. A rare blade holds an edge through battles that would dull lesser steel.\n\nA warrior wearing rare gear is no longer common. They are someone who has done difficult things to deserve what they carry.`,
    drops_from: ['High-level quests (low chance)', 'High-level adventures (low chance)', 'Medium-to-hard Titans (higher chance with difficulty)', 'Shop (rare appearance)'],
    drop_rate: 'Rare — multiple expeditions usually required',
  },
  {
    id: 'epic',
    title: 'Epic',
    subtitle: 'Touched by the Old Gods',
    color: '#A855F7',
    body: `Epic gear bears the residue of divine craftsmanship. Some pieces were created during the age of the Eternal Accord — gifts from gods to mortal champions, now scattered across the broken world. Others were forged after the Unraveling by master crafters using techniques that have since been lost.\n\nTo wield an epic item is to feel the weight of mythological legacy. These items remember the hands that bore them before you.`,
    drops_from: ['Medium-to-hardest Titans (uncommon)'],
    drop_rate: 'Uncommon from hard content only',
    note: 'Epic items will never be found in the shop, quests, or adventures.',
  },
  {
    id: 'legendary',
    title: 'Legendary',
    subtitle: 'Relics of the Divine Age',
    color: '#FBBF24',
    body: `Legendary items predate the Unraveling. They were crafted in the divine age — by gods, for gods, or for the rare mortal champions who earned the gods' favor. The Sword of Aegis. The Bow of Apollo. The Chariot of the Sun.\n\nWhen the Accord broke, most legendary items vanished into the ruins of god-realms. The few that remain in the mortal world are the prize of the hardest fights left to mortals — facing down Titans who walked the world before the gods themselves.`,
    drops_from: ['Hardest Titans only'],
    drop_rate: 'Exceptional — most warriors will never see one',
    note: 'Legendary items will never be found anywhere except the hardest Titan fights.',
  },
]

const ALLIANCE_ENTRIES = [
  {
    id: 'what_is_an_alliance',
    title: 'What Is An Alliance?',
    subtitle: 'Bonds forged beyond bloodline',
    body: `Alliances are unions of mortals who set aside the boundaries of faction and alignment to pursue shared power. Where the Pantheons divide the world by inheritance and the Compact divides it by ideology, an alliance binds by oath alone. Every member contributes — combat strength, divine income, and donated spoils — and every member benefits from the alliance's accumulated might. Up to 25 mortals may stand beneath a single banner.`,
  },
  {
    id: 'founding_and_joining',
    title: 'Founding & Joining',
    subtitle: 'The price of leadership',
    body: `A mortal of Level 25 or higher may found an alliance for the cost of 100,000 drachma and 100 glory — proof that they have already proven themselves in war and trade. Founding requires a name (3-30 characters) and a tag (2-4 characters), both unique across all Kishar. Joining is by invitation only, issued by a Founder or Officer. Mortals as young as Level 5 may accept an invitation. Leaving an alliance imposes a 24-hour cooldown before the mortal may bind themselves to another banner.`,
  },
  {
    id: 'ranks_of_the_banner',
    title: 'Ranks of the Banner',
    subtitle: 'From Member to Founder',
    body: `Every alliance has four ranks. The FOUNDER built the banner and holds ultimate authority — they may invite, kick, promote, demote, transfer ownership, and disband. OFFICERS, hand-picked by the Founder, may invite and kick Veterans and Members. VETERANS are members of 30 days standing, promoted automatically as recognition of loyalty. MEMBERS are the foundation — every new mortal begins here. If the Founder leaves without naming a successor, the oldest Officer rises to take the seat.`,
  },
  {
    id: 'the_three_powers',
    title: 'The Three Powers',
    subtitle: 'Military, Economic, Overall',
    body: `An alliance is measured by three powers, each rising through five tiers (I, II, III, IV, V) at logarithmic thresholds: 1,000 / 10,000 / 100,000 / 1,000,000 / 10,000,000 power points. MILITARY POWER reflects the warriors in your ranks — their stats, their combat-aligned Township levels, and the weapons donated to your treasury. ECONOMIC POWER reflects your prosperity — accumulated temple income, economy-aligned Township levels, and donated drachma and glory. OVERALL POWER is the average of the two, a single measure of an alliance's standing among its peers.`,
  },
  {
    id: 'power_sources',
    title: 'Power Sources',
    subtitle: 'What feeds the banner',
    body: `Every mortal who stands beneath an alliance banner contributes power. MILITARY POWER draws from each member's attack, defense, agility, energy maximum, and health maximum — plus their Warfare, Fortification, Stewardship, and Ritual Township levels — and from every donated piece of equipment, valued by rarity (common 1 × level required, uncommon 5×, rare 25×, epic 100×, legendary 500×). ECONOMIC POWER draws from each member's temple income rate, their Commerce, Divination, Exploration, and Craftsmanship Township levels, and donated currency (1 drachma = 0.1 power, 1 glory = 10 power).`,
  },
  {
    id: 'tier_perks',
    title: 'Tier Perks',
    subtitle: 'Strength returned to the faithful',
    body: `As your alliance rises through the tiers, every member receives passive bonuses. Each Military tier above 0 grants +3% Attack and +3% Defense to all members — a maximum of +15% at Tier V. Each Economic tier above 0 grants +3% to drachma and glory earned from quests, adventures, and combat — also +15% maximum. These bonuses stack with faction, class, alignment, and Township bonuses, multiplying the rewards of every other system in Kishar.`,
  },
  {
    id: 'the_treasury',
    title: 'The Treasury',
    subtitle: 'A war chest that never empties',
    body: `An alliance's treasury is permanent and additive — drachma, glory, and items donated to the alliance can never be withdrawn. This is by design. The treasury exists not as a shared wallet but as a foundation: every contribution permanently strengthens the alliance, deepening its three powers and benefiting every member who walks beneath the banner. In the days to come, the treasury will fund alliance dungeons, alliance-versus-alliance campaigns, and other endeavors yet to be unveiled.`,
  },
  {
    id: 'climbing_the_tiers',
    title: 'Climbing the Tiers',
    subtitle: 'Strategies for ascent',
    body: `A serious alliance pursues both powers in parallel. To climb MILITARY, recruit high-level warriors, encourage members to deepen their Warfare and Fortification Townships, and donate epic and legendary equipment — a single legendary item at level 75 grants 37,500 power. To climb ECONOMIC, recruit patient builders, encourage members to deepen their Commerce and Divination, build temples relentlessly, and donate accumulated glory (10× the value of raw drachma). The OVERALL tier is the average — neglect either power and your standing suffers.`,
  },
]

const COMBAT_ENTRIES = [
  {
    id: 'rounds',
    title: 'Combat Rounds',
    subtitle: 'How a Fight Unfolds',
    body: `When two warriors clash in the Arena, the fight resolves over five rounds. In each round, the attacker strikes first — and the defender strikes back, if they're still standing.\n\nEach strike is a roll: will it land? Will it crit? Will the opponent block or dodge? The system handles all of this on the server, then the result plays back to you as a sequence of rounds. You can scroll through the combat log to see what happened blow by blow.`,
  },
  {
    id: 'attack_defense',
    title: 'Attack & Defense',
    subtitle: 'The Foundation of Damage',
    body: `Your Attack stat — boosted by equipment, faction (Aesir +5%), class (Slayer +10%), and Township Warfare — determines how hard you hit.\n\nYour Defense stat reduces incoming damage. The formula is curved: each point of defense matters more at low values and less at high values. Going from 0 to 50 defense gives you 25% damage reduction. Going from 50 to 100 only adds another 8%. Defense never drops below 0% mitigation, but it can't exceed 50%.\n\nThis means high defense is valuable — but stacking it infinitely won't make you invulnerable. Balance is rewarded.`,
  },
  {
    id: 'crit_block_dodge',
    title: 'Crit · Block · Dodge',
    subtitle: 'The Combat Chances',
    body: `Three percentage-based mechanics determine the texture of combat.\n\nCritical Hit: Your attack deals 1.5× damage. Crit chance comes from your weapon, your class (Slayer +10%), and your faction.\n\nBlock: Your defender absorbs the incoming damage entirely. Block chance comes from your shield or armor, your class (Warden +10%), and your faction.\n\nDodge: Your defender avoids the attack entirely — no damage at all. Dodge chance comes from agility, certain artifacts, and your class (Oracle +5%). A skilled warrior balances all three.`,
  },
  {
    id: 'fatigued',
    title: 'The Fatigued State',
    subtitle: 'When the Body Has No More to Give',
    body: `When a warrior's energy reaches zero during a Titan fight, they become Fatigued. A Fatigued warrior can no longer summon the focus to land a critical strike, the discipline to block, or the reflexes to dodge. They strike with what strength remains — and miss often.\n\nA Fatigued attacker can only Hit or Miss. Crits, blocks, and dodges are unavailable while the body is empty. The Titan's defensive mechanics still apply — your weakened blow may yet be turned aside.\n\nThe Storm Sovereign Enlil drains energy from every warrior present, threatening to Fatigue even the most prepared. Drink energy potions before the fight begins. The body's reserves cannot be replenished mid-battle.`,
  },
  {
    id: 'agility',
    title: 'Agility',
    subtitle: 'The Fifth Stat',
    body: `Agility is a relatively recent addition to mortal warfare, becoming widespread only after the Unraveling. Where Attack and Defense determine the size of your blows, Agility determines whether they connect at all.\n\nHigher agility increases your dodge chance and slightly improves your crit chance. It does not affect damage directly — but it can determine who goes first when the rounds tighten and every blow matters.\n\nAesir warriors begin with bonus agility. Oracle classes benefit from it most.`,
  },
  {
    id: 'health_restore',
    title: 'Victory & Recovery',
    subtitle: 'The Spoils of Combat',
    body: `Winning a PvP fight restores 30% of your maximum health — the body's natural recovery from successful battle, the lift of triumph. Losing brings no such recovery. A Compact warrior earns glory even in defeat; a Coalition warrior must win to gain ground.\n\nHealth regenerates naturally over time at one point per three minutes. The Ritual profession accelerates this recovery substantially.`,
  },
]

const QUEST_ENTRIES = [
  {
    id: 'what_are_quests',
    title: 'What Are Quests?',
    subtitle: 'The Daily Work of a Warrior',
    body: `Quests are the bread and butter of any warrior's progression. They cost Energy, take roughly five minutes of real time to regenerate per energy point, and reward you with XP, Drachma, and sometimes equipment.\n\nQuests are organized by tier. Lower-tier quests cost less energy and grant smaller rewards. Higher-tier quests demand more but yield significantly more in return. The quest board rotates, presenting fresh options regularly.\n\nThere is no penalty for failure — you simply complete a quest and gain its rewards. The strategic question is which quests give you the best return on your limited Energy.`,
    tips: [
      'Higher level quests yield disproportionately more XP — focus on the highest-tier you can afford.',
      'Some quests have faction or class bonus tags — they give extra rewards to matching warriors.',
      'Quest rewards are boosted by Coalition (+15% XP), Olympian (+10% XP), and the Divination profession.',
    ],
  },
]

const ADVENTURE_ENTRIES = [
  {
    id: 'what_are_adventures',
    title: 'What Are Adventures?',
    subtitle: 'Longer Journeys for Greater Rewards',
    body: `Adventures are extended expeditions that play out over real time. You commit your warrior to a journey — anywhere from twenty minutes to several hours — and during that time, you cannot use the warrior for other purposes. When the timer completes, you claim the rewards.\n\nAdventures yield more XP and drachma than equivalent quests, but they require patience and planning. They also have a chance to drop equipment — sometimes rare equipment that's hard to find elsewhere.\n\nThe Exploration profession accelerates both adventure rewards and the chance of finding loot during them.`,
    tips: [
      'Start an adventure before you log off or step away — it will progress whether you are here or not.',
      'Higher-tier adventures cost more Energy upfront and take longer to resolve, but reward better gear.',
      'You can only have one adventure active at a time.',
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id) || null
}

function getEntries(categoryId, data) {
  switch (categoryId) {
    case 'lore':        return LORE_ENTRIES
    case 'factions':    return FACTION_ENTRIES
    case 'classes':     return CLASS_ENTRIES
    case 'alignments':  return ALIGNMENT_ENTRIES
    case 'alliances':   return ALLIANCE_ENTRIES
    case 'loot':        return LOOT_ENTRIES
    case 'combat':      return COMBAT_ENTRIES
    case 'quests':      return QUEST_ENTRIES
    case 'adventures':  return ADVENTURE_ENTRIES
    case 'professions': return data?.professions?.map(p => ({
      id: p.type,
      title: p.name,
      subtitle: p.establish_label,
      body: p.lore || p.description,
      bonus_type:    p.bonus_type,
      bonus_per_level: p.bonus_per_level,
      bonus_at_max:  p.bonus_at_max,
      initial_cost:  p.initial_cost,
      level_required: p.level_required,
    })) || null
    case 'titans': return data?.titans?.map(t => ({
      id: t.slug,
      title: t.name,
      subtitle: `${PANTHEON_LABEL[t.pantheon] || t.pantheon} · ${DIFFICULTY_LABEL[t.difficulty] || t.difficulty}`,
      body: t.lore || t.description,
      pantheon:         t.pantheon,
      difficulty:       t.difficulty,
      ability_name:     t.ability_name,
      ability_description: t.ability_description,
      base_hp_multiplier:  t.base_hp_multiplier,
      base_attack:         t.base_attack,
      base_defense:        t.base_defense,
      loot_rarity_floor:   t.loot_rarity_floor,
    })) || null
    default: return []
  }
}

const PANTHEON_LABEL = { greek: 'Greek', norse: 'Norse', mesopotamian: 'Mesopotamian' }
const DIFFICULTY_LABEL = { medium: 'Medium', hard: 'Hard', extreme: 'Extreme' }
const DIFFICULTY_COLOR = { medium: '#FBBF24', hard: '#F97316', extreme: '#DC2626' }
const RARITY_COLOR = {
  common: '#9CA3AF', uncommon: '#22C55E', rare: '#3B82F6', epic: '#A855F7', legendary: '#FBBF24',
}

const BONUS_TYPE_LABEL = {
  energy_regen_pct: 'Energy Regen',
  health_regen_pct: 'Health Regen',
  drachma_pct:      'Drachma Earned',
  xp_pct:           'XP Earned',
  adventure_reward_pct: 'Adventure Rewards',
  flat_defense:     'Flat Defense',
  flat_attack:      'Flat Attack',
}

function hexToRgb(hex) {
  if (!hex || hex[0] !== '#') return '201,169,97'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

function snippet(body, len = 110) {
  if (!body) return ''
  const first = body.split('\n\n')[0] || body
  return first.length > len ? first.slice(0, len).trimEnd() + '…' : first
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BodyText({ body }) {
  if (!body) return null
  return body.split('\n\n').map((para, i) => (
    <p key={i} style={{ margin: '0 0 14px', lineHeight: 1.7 }}>{para}</p>
  ))
}

function MechanicsSection({ entry, categoryId, catColor }) {
  const chipStyle = {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 4,
    border: `1px solid ${catColor}55`,
    background: `${catColor}18`,
    color: catColor,
    fontFamily: 'var(--pw-font-mono)',
    fontSize: 11,
    letterSpacing: '0.04em',
    marginBottom: 4,
  }
  const labelStyle = {
    fontFamily: 'var(--pw-font-mono)',
    fontSize: 9,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: 'rgba(168,155,126,0.55)',
    marginBottom: 6,
    marginTop: 18,
  }

  if (categoryId === 'factions') {
    return (
      <>
        <div style={labelStyle}>HERITAGE BONUS</div>
        <div style={chipStyle}>{entry.bonus}</div>
        {entry.color_lore && (
          <>
            <div style={labelStyle}>COLORS</div>
            <p style={{ fontFamily: 'var(--pw-font-body)', fontStyle: 'italic', fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>{entry.color_lore}</p>
          </>
        )}
      </>
    )
  }

  if (categoryId === 'classes') {
    return (
      <>
        <div style={labelStyle}>CLASS BONUSES</div>
        <ul style={{ padding: '0 0 0 18px', margin: 0 }}>
          {(entry.bonuses || []).map((b, i) => (
            <li key={i} style={{ fontFamily: 'var(--pw-font-mono)', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4, letterSpacing: '0.02em' }}>{b}</li>
          ))}
        </ul>
      </>
    )
  }

  if (categoryId === 'alignments') {
    return (
      <>
        <div style={labelStyle}>ALIGNMENT BONUS</div>
        <div style={chipStyle}>{entry.bonus}</div>
        {entry.pvp_note && (
          <>
            <div style={labelStyle}>PVP</div>
            <p style={{ fontFamily: 'var(--pw-font-body)', fontSize: 14, color: 'var(--color-text-secondary)', margin: 0, fontStyle: 'italic' }}>{entry.pvp_note}</p>
          </>
        )}
      </>
    )
  }

  if (categoryId === 'professions') {
    const bonusLabel = BONUS_TYPE_LABEL[entry.bonus_type] || entry.bonus_type
    const isPercent = entry.bonus_type?.endsWith('_pct')
    const unit = isPercent ? '%' : ''
    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 18 }}>
          {[
            { label: 'BONUS TYPE',       value: bonusLabel },
            { label: 'PER LEVEL',        value: `+${entry.bonus_per_level}${unit}` },
            { label: 'MAX (LVL 10)',      value: `+${entry.bonus_at_max}${unit}` },
            { label: 'LEVEL REQUIRED',   value: `Level ${entry.level_required}` },
            { label: 'ESTABLISH COST',   value: `₯${Number(entry.initial_cost).toLocaleString()}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '10px 12px' }}>
              <div style={{ fontFamily: 'var(--pw-font-mono)', fontSize: 8, letterSpacing: '0.16em', color: 'rgba(168,155,126,0.5)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: 'var(--pw-font-display)', fontSize: 15, color: catColor, letterSpacing: '0.04em' }}>{value}</div>
            </div>
          ))}
        </div>
      </>
    )
  }

  if (categoryId === 'titans') {
    const diffColor = DIFFICULTY_COLOR[entry.difficulty] || '#EDE3CC'
    const rarityColor = RARITY_COLOR[entry.loot_rarity_floor] || '#9CA3AF'
    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 18 }}>
          {[
            { label: 'PANTHEON',   value: PANTHEON_LABEL[entry.pantheon] || entry.pantheon },
            { label: 'DIFFICULTY', value: DIFFICULTY_LABEL[entry.difficulty] || entry.difficulty, color: diffColor },
            { label: 'BASE ATK',   value: entry.base_attack },
            { label: 'BASE DEF',   value: entry.base_defense },
            { label: 'HP MULT',    value: `×${entry.base_hp_multiplier}` },
            { label: 'LOOT FLOOR', value: (entry.loot_rarity_floor || '').toUpperCase(), color: rarityColor },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '10px 12px' }}>
              <div style={{ fontFamily: 'var(--pw-font-mono)', fontSize: 8, letterSpacing: '0.16em', color: 'rgba(168,155,126,0.5)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: 'var(--pw-font-display)', fontSize: 15, color: color || catColor, letterSpacing: '0.04em' }}>{value}</div>
            </div>
          ))}
        </div>
        {entry.ability_name && (
          <>
            <div style={labelStyle}>TITAN ABILITY</div>
            <div style={{ background: `${catColor}12`, border: `1px solid ${catColor}44`, borderRadius: 6, padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--pw-font-display)', fontSize: 13, color: catColor, letterSpacing: '0.06em', marginBottom: 6 }}>{entry.ability_name}</div>
              <div style={{ fontFamily: 'var(--pw-font-body)', fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{entry.ability_description}</div>
            </div>
          </>
        )}
      </>
    )
  }

  if (categoryId === 'loot') {
    const rarityColor = entry.color || '#9CA3AF'
    return (
      <>
        {entry.drops_from?.length > 0 && (
          <>
            <div style={labelStyle}>DROPS FROM</div>
            <ul style={{ padding: '0 0 0 18px', margin: 0 }}>
              {entry.drops_from.map((d, i) => (
                <li key={i} style={{ fontFamily: 'var(--pw-font-body)', fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{d}</li>
              ))}
            </ul>
          </>
        )}
        {entry.drop_rate && (
          <>
            <div style={labelStyle}>DROP RATE</div>
            <div style={{ ...chipStyle, borderColor: `${rarityColor}55`, background: `${rarityColor}18`, color: rarityColor }}>{entry.drop_rate}</div>
          </>
        )}
        {entry.note && (
          <p style={{ fontFamily: 'var(--pw-font-body)', fontStyle: 'italic', fontSize: 13, color: 'rgba(168,155,126,0.6)', marginTop: 10, marginBottom: 0, borderLeft: `2px solid ${rarityColor}44`, paddingLeft: 10 }}>{entry.note}</p>
        )}
      </>
    )
  }

  if (categoryId === 'quests' || categoryId === 'adventures') {
    if (!entry.tips?.length) return null
    return (
      <>
        <div style={labelStyle}>TIPS</div>
        <ul style={{ padding: '0 0 0 18px', margin: 0 }}>
          {entry.tips.map((t, i) => (
            <li key={i} style={{ fontFamily: 'var(--pw-font-body)', fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 6, lineHeight: 1.5 }}>{t}</li>
          ))}
        </ul>
      </>
    )
  }

  return null
}

function SkeletonTiles() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="pw-skel" style={{ height: 110, borderRadius: 8 }} />
      ))}
    </div>
  )
}

// ─── Detail Modal (portalled) ─────────────────────────────────────────────────

function DetailModal({ entry, categoryId, onClose }) {
  const cat = getCategoryById(categoryId)
  const catColor = (entry?.color) || cat?.color || '#C9A961'

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!entry) return null

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px 16px',
        overflowY: 'auto',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.22 }}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 720,
          margin: 'auto',
          background: 'var(--color-bg-elevated)',
          border: `1px solid ${catColor}44`,
          borderRadius: 10,
          boxShadow: `0 0 40px ${catColor}22, 0 8px 48px rgba(0,0,0,0.7)`,
          padding: '32px 28px 36px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 16,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-muted)', fontSize: 18, lineHeight: 1,
            padding: '4px 8px',
          }}
          aria-label="Close"
        >✕</button>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontFamily: 'var(--pw-font-mono)',
            fontSize: 9,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: catColor,
            marginBottom: 6,
            opacity: 0.7,
          }}>
            {cat?.label}
          </div>
          <h2 style={{
            fontFamily: 'var(--pw-font-display)',
            fontSize: 26,
            color: 'var(--color-text-primary)',
            letterSpacing: '0.04em',
            margin: '0 0 6px',
          }}>{entry.title}</h2>
          {entry.subtitle && (
            <p style={{
              fontFamily: 'var(--pw-font-body)',
              fontStyle: 'italic',
              fontSize: 15,
              color: catColor,
              margin: 0,
              opacity: 0.85,
            }}>{entry.subtitle}</p>
          )}
        </div>

        <div style={{
          borderTop: `1px solid ${catColor}22`,
          paddingTop: 20,
          fontFamily: 'var(--pw-font-body)',
          fontSize: 16,
          lineHeight: 1.75,
          color: 'var(--color-text-primary)',
        }}>
          <BodyText body={entry.body} />
        </div>

        <MechanicsSection entry={entry} categoryId={categoryId} catColor={catColor} />
      </motion.div>
    </motion.div>,
    document.body
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Codex() {
  const [view, setView]                     = useState('categories')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedEntry, setSelectedEntry]   = useState(null)
  const [data, setData]                     = useState(null)
  const [loading, setLoading]               = useState(true)

  useEffect(() => {
    fetch('/api/games/pantheon-wars/game?action=codex')
      .then(r => r.json())
      .then(d => { if (d.ok) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSelectCategory = useCallback((id) => {
    setSelectedCategory(id)
    setView('entries')
    setSelectedEntry(null)
  }, [])

  const handleBack = useCallback(() => {
    setView('categories')
    setSelectedCategory(null)
    setSelectedEntry(null)
  }, [])

  const handleCloseModal = useCallback(() => {
    setSelectedEntry(null)
  }, [])

  const cat     = getCategoryById(selectedCategory)
  const entries = selectedCategory ? getEntries(selectedCategory, data) : []
  const isApiCategory = selectedCategory === 'titans' || selectedCategory === 'professions'
  const entriesLoading = isApiCategory && loading

  return (
    <>
      <style>{`
        .cx-tile {
          cursor: pointer;
          transition: transform 160ms, box-shadow 160ms, border-color 160ms;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .cx-tile:hover {
          transform: translateY(-2px);
        }
        .cx-tile:active { transform: translateY(0); opacity: 0.85; }

        .cx-entry {
          cursor: pointer;
          transition: transform 140ms, border-color 160ms;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .cx-entry:hover {
          transform: translateY(-2px);
        }
        .cx-entry:active { transform: translateY(0); opacity: 0.85; }
      `}</style>

      <PWPageShell
        title="CODEX"
        backgroundVariant="codex"
        rightSlot={<PWBackButton />}
      >
        <AnimatePresence mode="wait">
          {view === 'categories' && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {/* Page header */}
              <div style={{ marginBottom: 28, textAlign: 'center' }}>
                <h1 style={{
                  fontFamily: 'var(--pw-font-display)',
                  fontSize: 30,
                  letterSpacing: '0.08em',
                  color: 'var(--color-accent-gold-bright)',
                  textShadow: 'var(--glow-gold)',
                  margin: '0 0 8px',
                }}>THE CODEX</h1>
                <p style={{
                  fontFamily: 'var(--pw-font-body)',
                  fontStyle: 'italic',
                  fontSize: 14,
                  color: 'var(--color-text-secondary)',
                  margin: 0,
                  lineHeight: 1.5,
                }}>
                  A complete reference of Kishar — its lore, its factions, and its systems.
                </p>
              </div>

              {/* Category grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
                {CATEGORIES.map(category => {
                  const rgb = hexToRgb(category.color)
                  return (
                    <div
                      key={category.id}
                      className="cx-tile"
                      onClick={() => handleSelectCategory(category.id)}
                      style={{
                        background: `rgba(${rgb},0.08)`,
                        border: `1px solid rgba(${rgb},0.35)`,
                        borderRadius: 8,
                        padding: '18px 14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: 8,
                      }}
                    >
                      <div style={{ fontSize: 32, lineHeight: 1, filter: 'none' }}>{category.glyph}</div>
                      <div style={{
                        fontFamily: 'var(--pw-font-display)',
                        fontSize: 12,
                        letterSpacing: '0.12em',
                        color: category.color,
                      }}>{category.label}</div>
                      <div style={{
                        fontFamily: 'var(--pw-font-body)',
                        fontStyle: 'italic',
                        fontSize: 11,
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.4,
                        opacity: 0.8,
                      }}>{category.description}</div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {view === 'entries' && cat && (
            <motion.div
              key={`entries-${selectedCategory}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {/* Back + category header */}
              <div style={{ marginBottom: 24 }}>
                <button
                  onClick={handleBack}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--pw-font-mono)',
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    color: 'var(--color-text-muted)',
                    padding: '0 0 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'color 160ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = cat.color }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)' }}
                >
                  ← BACK TO CODEX
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 24 }}>{cat.glyph}</span>
                  <h2 style={{
                    fontFamily: 'var(--pw-font-display)',
                    fontSize: 22,
                    letterSpacing: '0.06em',
                    color: cat.color,
                    margin: 0,
                  }}>{cat.label}</h2>
                </div>
                <p style={{
                  fontFamily: 'var(--pw-font-body)',
                  fontStyle: 'italic',
                  fontSize: 13,
                  color: 'var(--color-text-secondary)',
                  margin: 0,
                  lineHeight: 1.5,
                }}>{cat.description}</p>
              </div>

              {/* Entries */}
              {entriesLoading ? (
                <SkeletonTiles />
              ) : !entries || entries.length === 0 ? (
                <p style={{ fontFamily: 'var(--pw-font-body)', fontStyle: 'italic', color: 'var(--color-text-muted)', textAlign: 'center', padding: '40px 0' }}>
                  No entries found.
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
                  {entries.map(entry => {
                    const entryColor = entry.color || cat.color
                    const rgb = hexToRgb(entryColor)
                    return (
                      <div
                        key={entry.id}
                        className="cx-entry"
                        onClick={() => setSelectedEntry(entry)}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: `1px solid rgba(${rgb},0.25)`,
                          borderRadius: 8,
                          padding: '14px 12px 12px',
                        }}
                      >
                        <div style={{
                          fontFamily: 'var(--pw-font-display)',
                          fontSize: 13,
                          letterSpacing: '0.04em',
                          color: entryColor,
                          marginBottom: 4,
                          lineHeight: 1.3,
                        }}>{entry.title}</div>
                        {entry.subtitle && (
                          <div style={{
                            fontFamily: 'var(--pw-font-mono)',
                            fontSize: 9,
                            letterSpacing: '0.08em',
                            color: 'var(--color-text-muted)',
                            marginBottom: 8,
                          }}>{entry.subtitle}</div>
                        )}
                        <div style={{
                          fontFamily: 'var(--pw-font-body)',
                          fontStyle: 'italic',
                          fontSize: 12,
                          color: 'var(--color-text-secondary)',
                          lineHeight: 1.5,
                          opacity: 0.8,
                        }}>{snippet(entry.body)}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </PWPageShell>

      <AnimatePresence>
        {selectedEntry && (
          <DetailModal
            entry={selectedEntry}
            categoryId={selectedCategory}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
    </>
  )
}
