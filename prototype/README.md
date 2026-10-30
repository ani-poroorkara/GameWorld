# MyWorld - Act 1

The full browser-local Act 1 campaign is playable. Choose **Single Player -> New Act 1 campaign**, create a character, and start in the expanded 144 by 144 world. Starting this named new journey intentionally replaces the current browser save. Existing journeys continue through their original legacy or prologue modes.

Speak with Mara near the fields, collect Pickaxe and Shield at home, follow the road thief's lead to the living cave, and travel to the northern air opponent. Act 1 ends with the unresolved choice between your own missing child and the neighbor's child; the decision belongs to Act 2. Optional chests, five puzzles, irrigation, a runaway-animal escort and a Pickaxe shortcut add activities along the route.

Your Bustagam tracks canonical card quantities and separate levels. Apple and Steak heal 5/15 HP in exploration and combat, Bow attacks consume Arrows, and one companion unlocks a 50% distraction once per fight. Spare/kill choices after animal victories persist across reloads; killing gives exactly one Steak. Independent configured thief drops have no guaranteed first Bow. Local Map Cards belong to individual settlements and do not mark terrain explored. Character Resilience determines maximum health; 60 HP is the balanced baseline.

Combat stays on the world map with simultaneous committed hands, hidden dice, limited uses, the existing HUD/animations and isolated practice. Food and Pet Distraction cannot take dice. Quantities appear on combat cards; keyboard focus remains on a selected card or puzzle action after its UI updates. The quest journal and Quest Cards show current main and side objectives, including each step of following animal clues.

**Run locally:** open `index.html`, open the standalone `MyWorld.html`, or run `node serve.cjs` in this folder and visit http://127.0.0.1:4173. WASD/arrows move, E/touch Interact acts, and M opens the explored atlas. Mouse wheel/pinch/+/- zoom; 0 frames the map. Reduced motion is available in Settings.

Approved runtime data is generated from the separate [local content editor](../editor/README.md). Authored NPC topics, quest stage text, settlement bounds/map IDs, puzzle rules/choices/solutions, positions, card/enemy values, drops and rewards reach gameplay. Draft definitions are excluded; unavailable full-world enemies do not silently receive legacy guardian stats. Custom or renamed quest stages act as dependency milestones: after accepting their quest, their declared requirements resolve recursively. Shipped victory/interaction stage IDs retain their explicit achievement rules, and terminal stages still require completing the quest.

Run `node act1-campaign-check.cjs --builds` for the actual-index campaign journey and authoring/runtime integration suite, `node act1-check.cjs --builds` for preserved legacy/prologue saves, and the module tests documented in the [runtime report](../docs/superpowers/plans/2026-10-30-runtime-report.md). After source/data changes run `node bundle.cjs` and `node build-pages.cjs` before the build checks.

Verification uses a headless DOM/runtime harness, including real move/card/puzzle handlers and source/standalone/Pages startup. The connected browser host was unavailable and a native browser request timed out. No new browser screenshot or phone-layout verification is claimed. Local builds do not publish automatically.

## Alternative legacy journey

The following documentation describes the earlier relic journey reached through **Create a character**, rather than the named full Act 1 campaign choice.

A local browser prototype exploring generated, walkable 2D worlds while preserving MyWorld's card encounters and Bustagam concept.

Combat takes place on the world map, with a zooming camera and an overlaid card tray. Use the mouse wheel, pinch, or the +/− buttons to zoom; use 0 or the percentage button to reset or frame an encounter. Guided practice uses real terrain and restores your saved journey afterwards. Player, NPC and animal art uses a coarse pixel grid with bold outlines. Combat rules remain simultaneous card commitments with limited uses and hidden dice.

Open `index.html` directly, or run `node serve.cjs` from this folder and visit http://127.0.0.1:4173.

The first screen offers Single Player, disabled Multiplayer and Create a Campaign entries, and Settings. Single Player supports a saved journey or a new generic male/female traveller, with eight points to distribute above the six pillars' base of one. Stats affect health, mana, melee damage, magic, dice, negotiation, and store prices. Appearance has no stat effect.

Hearthstead is the player's safe village. The fields behind the home, horse pen to the left, and animals to the right follow the supplied sketch. Residents offer dialogue; shops sell food and permanent cards. Use Food & companion to eat, or E beside a friendly animal to pet it or keep it as your one companion. Replacing a companion requires a separate confirmation. Pets persist in the save and when generating another landscape; creating a new character starts without a companion.

Time passes through day and night, with village lights after sunset. Menus and dialogs pause the clock. Settings control day length, interface text size, ambient sound volume, and reduced motion. Towns never spawn hostile encounters. Outside towns, roads can produce robbers; wilderness has a higher chance of hostile wildlife, with at least 22 steps between encounters. Friendly woodland animals can also become companions.

The playable world fills the browser viewport. Health, gold, companion status, Bustagam, food, quests, settings, and menu controls sit over the game canvas. Quests open only from their button. Exploration percentage and coordinates appear only inside the atlas.

WASD / arrows move; E interacts; M opens the explored atlas. Nearby open tiles support click-to-walk. NPC and animal conversations appear above the speaker, leaving movement available. Speech ends when you walk away or after a reading interval; there is no dialogue X button. Existing touch direction buttons remain available on narrow screens.

Follow the trails, recover three relics from their guardians, and open the northern gate. Rest at settlements, use cards and optional dice in encounters, or attempt negotiation. Seeds and three landscape palettes create repeatable terrain when starting a character. The current journey saves in browser storage. The in-game world generator and How to Play controls have been removed.

Scope: browser-local single player, a fixed home village within generated terrain, seeded adventure landmarks, simplified guardian/wildlife/robber card encounters, simple shops and inventory, one companion, simplified death and Vault behavior, and one chapter ending. Farming is a basic repeatable harvest; animals have idle animation and companions follow, rather than a complete animal simulation. Character customization beyond the two presets, online multiplayer, full progression, fatigue, and full reincarnation are not implemented.

Run `node smoke-check.cjs` for world and gameplay checks. Run `node bundle.cjs` after changes to rebuild the standalone `MyWorld.html` file.

## Alternative legacy village prologue preview

While playing, open **Quests → Start prologue preview** to opt in within your current journey. This preserves your character, gold, legacy inventory and world progress. The preview uses its own saved `state.act1` inventory; the existing battle tray still uses legacy cards and rules.

Walk to Mara near the fields (37, 37), Ivo (43, 38), or Tessa (44, 46), and press **E** or the touch interact button. Choose **Normal topic** for ordinary conversation or **Quest topic** for preview actions. Mara offers **I will help** or **Not yet**; declining lets you return later, including after reloading. Acceptance creates one **Save the Kid** Quest Card. Tessa's **Ask about preparations** records village information. At **Your Home** (40, 42), interact and choose **Collect Pickaxe and Shield** once; collection before acceptance counts. Rest remains available.

Ivo offers **Take local Map Card** once. **View village map** then opens a dedicated village landmark map, also available through Quests. It covers only the home village (x 29–51, y 31–53), and changes neither explored tiles nor atlas fog. **Bustagam** shows a separate preview inventory with quantities and levels; the journal and Quest Card show the next objective. No Quest Card exists before acceptance.

Preview progress survives reloads, landscape generation and practice restoration. Intentionally creating a new character replaces the journey and clears its preview. Unreadable or unsupported campaign data is retained, shown in Quests/Bustagam, and cannot be overwritten by preview actions. Browser storage failures retain only session progress, as in the existing prototype.

This older opt-in preview deliberately stops at the village prologue. The expanded world, road/cave/northern encounters, canonical combat, animal choices and puzzles are available through the separate New Act 1 campaign choice described above. Legacy victories do not advance this preview, and neither journal offers story-progress shortcuts.

Run `node act1-check.cjs` for headless startup and UI-action integration checks and `node --test act1-state.test.cjs` for the pure campaign model. These checks do not establish visual or phone-layout verification.

The optional Google Fonts request improves typography; local serif and sans-serif fallbacks work offline. The game itself requires no packages or external assets.

## Opponents and touch controls

Guardians wait at ruins, thieves occupy roads, and boars appear near woodland trails. All have world sprites, overhead conversations, and combat portraits. Travel encounters create visible entities rather than an introductory blocking dialog. Defeated static enemies stay gone in the saved journey.

Phone and tablet layouts include 44–48px direction controls, an interact button, compact status, a More menu, safe-area spacing, and scrollable combat and inventory panels. Portrait and landscape layouts are supported.

## GitHub Pages

The `prototype` directory is ready to become the repository root. `node build-pages.cjs` prepares only the allowlisted runtime files and art assets in `dist/`. `.github/workflows/pages.yml` runs checks and deploys `dist/` when manually started. Select GitHub Actions as the repository Pages source. The publishing repository is https://github.com/ani-poroorkara/GameWorld.

## Private playtest prompt

A shared access-code prompt appears before the menu, with an authorized-playtesters-only notice. Successful entry is remembered in this tab session. The code itself is kept out of the repository. This is a client-side courtesy gate and is bypassable; it is not a substitute for protected hosting.

Live playtest: https://ani-poroorkara.github.io/GameWorld/ — future deployments are manual. The shared playtest code is distributed separately. Run `node access-check.cjs` to verify the gate.

