-- Pantheon Wars seed data
-- Re-runnable: TRUNCATE resets serial IDs and cascades to pw_quest_progress
TRUNCATE pw_quests RESTART IDENTITY CASCADE;

-- ─── pw_quests ───────────────────────────────────────────────────────────────
-- Columns: name, description, tier, energy_cost, xp_reward,
--          drachma_base, drachma_range, loot_chance, level_required, mastery_target
--
-- Tier 1 │ Level  1–9  │ Energy  3–5  │ Mortal errands          (8 quests)
-- Tier 2 │ Level 10–24 │ Energy  6–10 │ Faction warfare         (8 quests)
-- Tier 3 │ Level 25–49 │ Energy 11–18 │ Divine conflict         (9 quests)
-- Tier 4 │ Level 50–74 │ Energy 19–25 │ Mythic campaigns        (8 quests)
-- Tier 5 │ Level 75–100│ Energy 25–30 │ Endgame / Ascension     (7 quests)

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
VALUES

-- ── Tier 1: Mortal errands ────────────────────────────────────────────────────

  ('Collect the Tribute',
   'Olympian tax collectors were driven off twice. Collect what is owed — by whatever means necessary.',
   1, 3, 20, 30, 20, 0, 1, 100),

  ('Scout the Borderlands',
   'The eastern frontier has gone silent. That silence conceals something. Ride out and find it before your enemies do.',
   1, 3, 20, 30, 20, 0, 1, 100),

  ('Deliver the Divine Message',
   'A sealed scroll bearing Hermes'' seal must reach the oracle at Delphi before the third sunrise or the vision dies with it.',
   1, 4, 28, 40, 25, 2, 2, 100),

  ('Gather Storm-Touched Timber',
   'Wood struck by Mjolnir''s lightning holds a divine charge. The skald''s workshop needs ten such planks before the solstice.',
   1, 4, 28, 40, 25, 2, 3, 100),

  ('Track the Runaway Thrall',
   'A sworn thrall fled northward carrying secrets that cannot reach the frost giants. Retrieve them both.',
   1, 5, 36, 50, 30, 3, 4, 100),

  ('Tithe to the Great Ziggurat',
   'The priests of Marduk grow impatient. Deliver the grain tribute before their patience — and their prayers — run dry.',
   1, 5, 36, 50, 30, 3, 5, 100),

  ('Guard the Silk Road Caravan',
   'A merchant caravan crossing the Fertile Crescent carries more than silk. Ensure it arrives intact.',
   1, 5, 36, 52, 32, 4, 6, 100),

  ('Silence the Street Prophet',
   'A loud-mouthed seer preaches the gods'' downfall in the open market. Such words cannot go unanswered.',
   1, 5, 38, 55, 35, 5, 7, 100),

-- ── Tier 2: Faction warfare ───────────────────────────────────────────────────

  ('Raid the Rival Shrine',
   'The shrine of Ares holds offerings meant for Olympus. Reclaim them before the next moon rises.',
   2, 6, 55, 80, 40, 5, 10, 75),

  ('Escort the Seer to Olympus',
   'A prophet carrying a war-critical vision must cross fifty miles of enemy territory alive. Fifty miles.',
   2, 7, 65, 95, 45, 6, 11, 75),

  ('Sabotage the Winter Stores',
   'An enemy fortress will not survive the season if its grain supply is compromised. Make it so.',
   2, 7, 65, 95, 45, 6, 12, 75),

  ('Silence the War-Skald',
   'His songs double enemy courage and halve their fear of death. The performance ends tonight.',
   2, 8, 76, 110, 50, 7, 14, 75),

  ('Intercept the War Column',
   'A supply column moves through the valley at dawn. Intelligence is only useful if someone acts on it.',
   2, 8, 76, 112, 50, 8, 15, 75),

  ('Defile the Sacred Spring',
   'The healing spring outside the enemy camp has kept their wounded fighting for weeks. Poison the source.',
   2, 9, 87, 125, 55, 8, 17, 75),

  ('Steal the Battle Standard',
   'An army without its divine banner loses more than cloth and dye. Take it before the assault begins.',
   2, 10, 98, 140, 60, 10, 20, 75),

  ('Remove the Enemy Commander',
   'The general planning tomorrow''s offensive must not see tomorrow. Discreet. Decisive.',
   2, 10, 100, 145, 60, 10, 22, 75),

-- ── Tier 3: Divine conflict ───────────────────────────────────────────────────

  ('Breach the Titan''s Gate',
   'The bronze doors sealing Kronos''s prison have held for an age. Something stirs behind them. Find out what — or seal it forever.',
   3, 11, 130, 200, 80, 8, 25, 50),

  ('Steal the Golden Fleece',
   'It hangs in a sacred grove guarded by a dragon that never sleeps. Twelve attempted this before you. You will be the first to return.',
   3, 12, 145, 220, 85, 10, 27, 50),

  ('Infiltrate Valhalla',
   'Walk among the einherjar undetected. Odin''s hall holds intelligence that could shift the entire war in a single night.',
   3, 13, 160, 240, 90, 10, 30, 50),

  ('Break Heimdall''s Watch',
   'The Bifrost guardian''s gaze has not faltered since the first age of the world. Tonight you change that.',
   3, 13, 162, 242, 90, 12, 32, 50),

  ('Drive Back Fenrir''s Brood',
   'The great wolf''s offspring descended from the northern peaks three days ago. The villages below cannot survive another night.',
   3, 14, 175, 260, 95, 12, 34, 50),

  ('Descent into Tartarus',
   'Hades permits no living soul past the Styx. You will go anyway, retrieve what was stolen from the upper world, and leave before he notices.',
   3, 15, 195, 280, 100, 14, 37, 50),

  ('Storm the Hanging Gardens',
   'The Annunaki''s sky-fortress has repelled every assault launched from below. You will not come from below.',
   3, 16, 210, 300, 110, 14, 40, 50),

  ('Seize the Tablet of Destinies',
   'Whoever holds the Tablet of Destinies controls the arc of fate itself. It has been in enemy hands long enough.',
   3, 17, 225, 315, 115, 15, 44, 50),

  ('Slay the Stone Gorgon',
   'The archive''s guardian has turned twelve champions to marble and arranged them as warnings. You are not a warning.',
   3, 18, 240, 330, 120, 15, 47, 50),

-- ── Tier 4: Mythic campaigns ──────────────────────────────────────────────────

  ('Hunt the Serpent''s Children',
   'Jormungandr''s spawn encircle Yggdrasil''s roots, slowly strangling the world tree from below. Each one slain buys another century.',
   4, 19, 350, 600, 200, 12, 50, 40),

  ('Collapse the Dimensional Rift',
   'A tear between realms floods enemy territory with raw divine energy. The rift must be sealed from the inside.',
   4, 20, 380, 650, 220, 14, 53, 40),

  ('Forge the Godkiller Blade',
   'Seven divine bloodlines. Seven drops of ichor. One blade capable of ending an immortal. The forge has been waiting for someone like you.',
   4, 21, 410, 700, 240, 15, 56, 40),

  ('Raid the Vault of Dead Gods',
   'Odin''s armory holds weapons from deities who fell in older wars. They have been waiting for someone worthy enough to use them.',
   4, 22, 440, 750, 250, 16, 59, 40),

  ('Bind the Chaos Spawn',
   'Tiamat''s lesser offspring shattered its celestial chains three nights ago. Rebind it before it breaches the mortal plane.',
   4, 22, 440, 760, 250, 16, 62, 40),

  ('Disrupt the High Pantheon Council',
   'The divine council convenes at the summit to decide the war''s next move. They must not reach consensus.',
   4, 23, 470, 800, 270, 18, 65, 40),

  ('Blind the Pythia''s Vision',
   'The oracle has foreseen your enemy''s victory in vivid detail. Alter her sight before the prophecy can be spoken aloud.',
   4, 24, 490, 850, 280, 18, 68, 40),

  ('Sever the World Tree''s Root',
   'Strike at Yggdrasil itself. The shockwave will reach all nine realms simultaneously and scatter your enemies across every one of them.',
   4, 25, 520, 900, 300, 20, 72, 40),

-- ── Tier 5: Endgame / Ascension ───────────────────────────────────────────────

  ('Dethrone the Olympian Father',
   'Zeus has grown fat on certainty. The father of gods has forgotten what it means to face a real threat. It is time he remembered.',
   5, 25, 800, 1500, 500, 20, 75, 25),

  ('Rewrite the Tablets of Fate',
   'The clay tablets governing all existence have been inscribed by others long enough. Your hand now.',
   5, 26, 870, 1650, 550, 22, 78, 25),

  ('Tear the Mortal Veil',
   'The boundary between divine and mortal was woven as a prison as much as a protection. It has served its purpose. Unmake it.',
   5, 27, 940, 1800, 600, 22, 80, 25),

  ('Free the Bound Titan',
   'Prometheus was chained for giving fire to mortals. His knowledge of divine weakness is worth far more than fire ever was. Free him.',
   5, 28, 1010, 1950, 650, 24, 83, 25),

  ('Sound the First Horn of Ragnarok',
   'The end cannot be stopped — only aimed. Strike the first blow and choose which world burns first.',
   5, 28, 1020, 2000, 650, 24, 86, 25),

  ('Aid the Wolves'' Hunt',
   'Hati and Skoll have chased the sun and moon since the first age. They grow tired. Lend them your strength for the final sprint.',
   5, 29, 1080, 2100, 700, 25, 90, 25),

  ('Unmake the First Temple',
   'The oldest structure in existence predates every god ever worshipped. Reduce it to rubble. What rises from the ruin belongs to no one but you.',
   5, 30, 1150, 2250, 750, 25, 95, 25);
