# MyWorld — The Wilderlands

A local browser prototype exploring generated, walkable 2D worlds while preserving MyWorld's card encounters and Bustagam concept.

Open `index.html` directly, or run `node serve.cjs` from this folder and visit http://127.0.0.1:4173.

The first screen offers Single Player, disabled Multiplayer and Create a Campaign entries, and Settings. Single Player supports a saved journey or a new generic male/female traveller, with eight points to distribute above the six pillars' base of one. Stats affect health, mana, melee damage, magic, dice, negotiation, and store prices. Appearance has no stat effect.

Hearthstead is the player's safe village. The fields behind the home, horse pen to the left, and animals to the right follow the supplied sketch. Residents offer dialogue; shops sell food and permanent cards. Use Food & companion to eat, or E beside a friendly animal to pet it or keep it as your one companion. Replacing a companion requires a separate confirmation. Pets persist in the save and when generating another landscape; creating a new character starts without a companion.

Time passes through day and night, with village lights after sunset. Menus and dialogs pause the clock. Settings control day length, interface text size, ambient sound volume, and reduced motion. Towns never spawn hostile encounters. Outside towns, roads can produce robbers; wilderness has a higher chance of hostile wildlife, with at least 22 steps between encounters. Friendly woodland animals can also become companions.

The playable world fills the browser viewport. Health, gold, companion status, Bustagam, food, quests, settings, and menu controls sit over the game canvas. Quests open only from their button. Exploration percentage and coordinates appear only inside the atlas.

WASD / arrows move; E interacts; M opens the explored atlas. Nearby open tiles support click-to-walk. NPC and animal conversations appear above the speaker, leaving movement available. Speech ends when you walk away or after a reading interval; there is no dialogue X button. Existing touch direction buttons remain available on narrow screens.

Follow the trails, recover three relics from their guardians, and open the northern gate. Rest at settlements, use cards and optional dice in encounters, or attempt negotiation. Seeds and three landscape palettes create repeatable terrain when starting a character. The current journey saves in browser storage. The in-game world generator and How to Play controls have been removed.

Scope: browser-local single player, a fixed home village within generated terrain, seeded adventure landmarks, simplified guardian/wildlife/robber card encounters, simple shops and inventory, one companion, simplified death and Vault behavior, and one chapter ending. Farming is a basic repeatable harvest; animals have idle animation and companions follow, rather than a complete animal simulation. Character customization beyond the two presets, online multiplayer, campaign editing, full progression, fatigue, and full reincarnation are not implemented.

Run `node smoke-check.cjs` for world and gameplay checks. Run `node bundle.cjs` after changes to rebuild the standalone `MyWorld.html` file.

The optional Google Fonts request improves typography; local serif and sans-serif fallbacks work offline. The game itself requires no packages or external assets.
