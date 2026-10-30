# Task 2 implementation report

Implemented the opt-in village prologue adapter only. This is not complete Act 1 gameplay. No commits, pushes, deployment, dependencies or subagents were used by this implementer. Existing dirty work was preserved.

## Files

- Created `prototype/act1.js`: browser adapter consuming the reviewed `Act1State` API.
- Created `prototype/act1-check.cjs`: actual-index-order VM integration checks, with parsed and clickable rendered speech/modal buttons; optional generated-output checks.
- Modified `prototype/index.html`: loads state module then adapter after the existing overrides and before boot.
- Modified `prototype/bundle.cjs` and `prototype/build-pages.cjs`: explicitly include both campaign modules; editor remains outside runtime allowlists.
- Modified `prototype/game.js`: two-line generation seam preserves the existing `act1` property before the generator's own eager save, including unreadable payloads. Comparison against the provided reviewer baseline confirms this is the only change to this existing runtime file.
- Modified `prototype/README.md`: exact preview controls, state separation, save behavior and remaining scope; corrected outdated Pages output description.
- Regenerated local `prototype/MyWorld.html` and `prototype/dist/` outputs.
- Created this report.

No edits were made to `world-life.js`, `smoke-check.cjs`, the pure campaign model or editor by this task. Existing files in `dist`, including pre-existing `macaron.css`, were preserved. The generated output directory was inspected; no editor, backup, server, token, test or check files were present.

## UI and behavior

1. In play mode, **Quests → Start prologue preview** starts campaign state within the existing journey. Before this action there is no campaign state, preview resident or campaign inventory. Legacy quest content remains available.
2. Talk to existing `mara` at (37, 37). **Normal topic** retains her farm conversation. **Quest topic** offers **I will help** / **Not yet**. Decline survives reload and permits later acceptance. Acceptance grants exactly one **Save the Kid** Quest Card. No unaccepted card is shown.
3. Ivo at (43, 38), ID `act1-ivo`, offers **Take local Map Card** once, then **View village map**. Tessa at (44, 46), ID `act1-tessa`, offers **Ask about preparations**. They are distinct from legacy `tess` and `sage`; Mara is never duplicated. Their normal and quest topics use the existing escaped speech renderer.
4. At the actual `home` landmark (40, 42, existing interaction range), **E → Collect Pickaxe and Shield** grants each once. Rest retains its original callback. Equipment collected before acceptance counts.
5. Quests and **Bustagam** show the accepted card's changing next objective. Bustagam appends a separately labeled preview inventory with explicit quantity and level for every owned preview card. Legacy inventory, gold, food, character, relics and battle-card claims remain intact.
6. The dedicated local-map dialog displays only landmarks within `homeBounds` (x 29–51, y 31–53), with a visual map and equivalent coordinate list. `act1MapKnows` is limited to those bounds. Map ownership/viewing never changes `state.seen`, explored percentage, atlas fog or terrain outside the village. The wider legacy atlas remains based on actual exploration.

The adapter explicitly accepts only the five prologue event types. No dialogue or journal action dispatches thief, cave, chest, northern or ending progression. It adds no combat outcomes, powers, drop probabilities, upgrade mechanic, settlement names, child locations, kidnapper identity or Act 2 resolution. Existing world encounters remain legacy gameplay. The UI repeatedly labels this as the prologue preview and explains that main story encounters/final Act 1 combat are unavailable.

## Startup, save and callback integration

All campaign data stays under `state.act1`. The adapter never resets the character or legacy inventory on opt-in. Ordinary landscape generation carries the campaign property before the original generator saves; saved-world hydration and practice restoration use the existing whole-state mechanisms. A hydration wrapper restores the two preview residents after later world generation; initial adapter installation handles the world that game.js already generated eagerly.

Quests binds during boot, after the adapter replaces `showQuests`. Binder and touch-interact callbacks bind eagerly in game.js, so the adapter explicitly rebinds them to its final functions. Keyboard interaction resolves the final `interact` binding. Appended dialog content uses `insertAdjacentHTML`, preserving already-bound Close and Rest handlers. The integration stub checks those real rendered callbacks.

Unsupported versions, malformed v1 payloads and present `null` are retained and treated as unreadable. Quests/Bustagam display the issue and disable preview mutation/reinitialization. Tests preseed an unknown version before loading the actual complete index order and verify both the in-memory property and the payload saved eagerly by game.js. A present undefined property is also disabled in memory and can survive landscape generation without JSON parse failure; undefined is not a JSON-save format.

Intentional new-character creation differs from landscape continuation: the adapter's `startJourney` wrapper clears the old campaign only after character validation, before the original replacement journey starts. Rendered character-creation controls are tested. This prevents one character inheriting another's quest and fixed rewards.

## TDD evidence

Initial red: wrote `act1-check.cjs` before the adapter and ran `node prototype/act1-check.cjs`. Exit 1: `Rendered button missing: Start prologue preview`. The test had loaded the real index scripts and clicked the actual Quests handler, demonstrating that opt-in was absent.

Implemented the adapter, runtime/build registration and minimal test DOM support. Initial green: the same command exited 0, covering actual startup, rendered conversations, decline/reload/reacceptance, one-time gear/map, binder, legacy preservation, practice and unsupported save handling.

Additional review-driven red/green checks:

- Present-null payload: test failed with `Present invalid campaign must be retained and disabled`; explicit null/undefined guard made it pass.
- Intentional new character: clicked rendered menu/creation buttons; test failed because the old accepted campaign and home rewards survived. The validated `startJourney` wrapper made it pass.
- Undefined property on landscape generation: test failed with `SyntaxError: "undefined" is not valid JSON`; guarded generation carry-over made it pass.

Test-harness corrections during development included capitalized dialogue assertion, actual button IDs for decorated menu labels, and preserving existing callback identities while emulating `insertAdjacentHTML`. These were harness issues, not runtime behavior changes.

## Actual verification commands/results

All commands ran from the repository root on October 29, 2026:

| Command | Result |
| --- | --- |
| `node prototype/act1-check.cjs` | Exit 0; actual startup, UI actions, persistence and invalid-payload checks passed |
| `node --test prototype/act1-state.test.cjs` | Exit 0; 13 passed, 0 failed |
| `node prototype/smoke-check.cjs` | Exit 0; world/combat/save/map/movement regressions passed |
| `node prototype/combat-check.cjs` | Exit 0; simultaneous combat, uses, duplicate restrictions, dice, consumption and mana checks passed |
| `node prototype/access-check.cjs` | Exit 0; gate/code/session/notice checks passed |
| `node prototype/bundle.cjs` | Exit 0; standalone rebuilt |
| `node prototype/build-pages.cjs` | Exit 0; explicit 19 runtime files plus 3 art assets copied locally |
| `node prototype/act1-check.cjs --builds` | Exit 0; all integration checks plus actual standalone and Pages startup, opt-in, exact campaign-module inclusion and editor/server/check exclusion passed |

The VM test loads scripts from the actual index HTML, including access, eager generation, all combat overrides, both campaign modules and inline boot. Its speech parser creates action buttons from rendered markup and invokes their bound callbacks. Assertions cover decline/reload/accept, absent unaccepted card, gear before and after acceptance, repeated collection, map idempotence, journal updates, quantity/level display, unchanged legacy state and `seen`, map bounds, practice restoration, continuation generation, replacement character, unreadable payloads and rejected later encounter events.

The build check also starts the generated standalone's inline scripts and the generated Pages index/scripts rather than checking only filenames. It verifies copied campaign modules exactly match source, the standalone embeds both modules with no external script tags, and editor/server code is absent.

## Limits and handoff

Headless verification only: a browser host was unavailable. No claim is made about visual map-label layout, speech placement, touch reachability, focus behavior or phone portrait/landscape presentation. These still need real browser inspection.

The preview stops after preparation. Task 1's pure model contains later events, but this adapter deliberately does not connect them to legacy fights. Approved combat/card metadata, full inventory integration, expanded world, authentic main-story encounter rewards, animal choices, puzzles, side quests and editor publication remain later tasks. Browser-local storage retains its existing session-only fallback when storage fails.

Independent review and the parent session's final verification/ledger update are outside this implementer's Task 2 scope. All builds remain local.
