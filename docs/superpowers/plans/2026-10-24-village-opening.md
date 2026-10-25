# MyWorld Village Opening Implementation Plan

**Goal:** Extend the existing browser prototype with a menu, single-player character creation, a safe home village, shops, animals, one companion, time of day, and travel encounters.

**Architecture:** Keep the existing buildless canvas game. Add `prototype/world-life.js` for the opening flow, village content, economy, pets, settings, and clock; integrate through explicit hooks in the existing renderer and movement. Keep both browser and standalone HTML versions current.

**Scope:** User's current message and village sketch. Multiplayer and campaign creation are visible but disabled. Each single-player journey owns its saved village; there is no online shared world. Generic male/female appearances have equal stats. Six pillars start at one with eight additional points, capped at six. Default time runs from morning through night, pausing in menus and dialogs. Village and settlements cannot trigger hostile encounters. Roads outside towns have a lower encounter probability than wilderness.

- [x] Add the opening menu, settings, character presets and allocation validation, with continue support for saves.
- [x] Expand the home clearing into a safe village with farm behind the home, horse pen to its left, animals to its right, multiple houses, NPCs, food and card shops.
- [x] Add saved coins, inventory, food consumption, card purchases and stat-driven combat.
- [x] Add petting and one persistent companion; replacing a companion requires a deliberate UI choice.
- [x] Add saved day/night progression, village lighting and encounter risk outside safe zones.
- [x] Verify allocation, economy, safety, pets, save migration, paused time, connected worlds and campaign regression. Rebuild standalone HTML and verify the local server serves the new files.

Verification uses the existing Node VM harness and focused behavior checks. Browser visual verification remains dependent on available preview access. No dependencies, online features, or external asset services are required.

Browser verification completed: main menu, allocation creator and disabled-start behavior, Continue migration, village rendering, pet interaction, and settings. Main menu screenshot saved under prototype/output/.
