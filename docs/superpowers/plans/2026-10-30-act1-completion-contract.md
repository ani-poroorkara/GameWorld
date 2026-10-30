# Act 1 completion contract and execution briefs

The user explicitly requested **finish everything** after being told Tasks 4–13 remain. This supersedes the previous session's prologue-only execution boundary and resumes previously parked implementation choices. The builder now selects reversible playtest balance, loot and puzzle defaults, documents them as new choices, and completes the playable act and authoring workflow. Existing confirmed story/card rules remain binding. No publishing or unrelated commits.

## Shared contracts

Three independent ownership areas may run concurrently, then integration and independent review follow. No overlapping writes:

1. Content worker owns `content/`, `editor/`, `prototype/act1-data.js`, content-export script/tests only.
2. World worker owns `prototype/act1-world.js`, `prototype/act1-puzzles.js`, their tests only.
3. Runtime worker owns remaining `prototype/` code (including `act1-state.js`, adapter, CSS, script/build registration and runtime tests). Does not edit worker 1/2 files.

Dependency-free browser UMD/CommonJS patterns throughout. Preserve legacy journeys and old prologue saves. Full campaign is a separately named new-game choice; actual full campaign state uses `state.act1.mode='campaign'`. Old preview remains opt-in for old worlds. Actual script order: data, world, puzzles, state before adapter; final runtime overrides after existing `act1.js` and combat/map overrides. Initial eager game.js startup must support saved campaign dimensions and not truncate data.

### Content API

Generated `prototype/act1-data.js`: UMD global `Act1Data`, CommonJS exports plain object `{schemaVersion:1,title,cards:[],enemies:[],drops:[],world:{size:144,home:{x:72,y:72},spawn:{x:72,y:74}},npcs:[],quests:[],chests:[],puzzles:[],passages:[]}`.

Cards retain current catalogue schema/IDs; add `status:'approved'|'draft'`, `diceAllowed:boolean`, optional `requiresCardId`. Runtime consumes only approved definitions. Attack/block/heal power is `levels[0].power`; fight limits `perFightUses`. Enemy stats hp/attack/defense are numeric. Drops retain sourceType/sourceId/cardId/min/max/chance/status/condition. Existing drop status is confirmed/draft; export confirmed numeric entries only.

Playtest defaults: Punch 9 damage/12 fight uses; Hand Block 6 block/5; Pickaxe 15/10; Shield 10/5; Stone Staff 18/8; Bow 14/10 plus one Arrow each attack; Stone Throw 20/5 requiring owned Staff; Stone Block 16/4. Apple 5 and Steak 15 healing (inventory-limited, perFightUses 999); no dice on food or Pet Distraction. Food at full HP is legal in combat, consumed, heals zero; exploration eating at full HP is disabled. Pet Distraction .5/1 fight use, cancels at most one attack even on multiple attacks. No leveling recipe or bonuses.

Enemy defaults: thief 42/10/6; boar 38/9/5; bear 55/12/7; cave-monster 78/13/7; air-monster 92/15/8. Explicit independent thief rolls: Bow .25 quantity1, Arrows .6 quantity5–10 inclusive. No first-drop guarantee/pity. These are newly chosen playtest defaults, not claims of prior user decisions. All remain editable.

Campaign entities use stable IDs and fields `{id,name,...}`. Quests have `stages:[{id,text,requires:[]}]`; NPCs have `role,x,y,topics:[{id,text}]`; chests `x,y,requires:[],rewards:[{cardId,quantity}]`; puzzles `kind,x,y,requires:[],rewards:[...]`; passages `x,y,northern:boolean`. Validate structure, IDs, bounds, references and prerequisite cycles with errors, retaining null/drafts in authoring but rejecting unresolved approved runtime definitions. Runtime export must reject rather than default null powers.

Quest prerequisite semantics: shipped stage IDs correspond to actual completed gameplay milestones (acceptance, thief/cave/air victories, search/northern progress, clues/escort, irrigation and cleared path). Additional or renamed nonterminal authored stages are dependency milestones within an accepted quest: their prerequisites must all be satisfied recursively. They do not manufacture a combat victory or grant quest acceptance. Cycles are rejected at export and guarded at runtime. The main terminal declaration remains bound to the unresolved Act 1 dilemma.

### World API

`Act1World.build(seed,definition?)` -> `{size,tiles,landmarks,regions,passages,spawn,homeBounds,villagers,animals,enemies}`. All arrays/data serializable. Tile `{type,v}`; size144; home center(72,72), player(72,74), safe bounds x61–83/y61–83. Use runtime-known types grass/tree/path/mountain/water/farm/pen/clearing; cracked tiles may use `region:'cracked'` plus known walkable grass/clearing type until renderer supports color.

Landmarks stable IDs: `home` (72,72), `farm` (72,64), `town` (44,85), `act1-cave` (106,35), `act1-north` (72,7), `chest-apple` (59,72), `chest-stone-throw` (43,55), `chest-stone-block` (110,32), puzzle landmarks `farmers-channels` (77,65), `three-witnesses` (68,68), `changing-forest` (42,58), `stone-mechanism` (103,40), `northern-passage` (74,14), side activity landmarks `animal-clue-1` (61,65), `animal-clue-2` (54,62), `runaway-animal` (49,62), `animal-pen` (64,71), `blocked-footpath` (91,50). Landmark kind may be 'chest','puzzle','story','passage','farm','safe','shop','house','town'. All interactable sites and NPCs must have connected walkable approaches; opponents do not make single-tile corridors impassable.

Passages 9 with IDs `passage-1`..`passage-9`, positions (72,5),(116,18),(138,53),(138,104),(100,138),(40,138),(5,98),(5,42),(32,8); first northern, others future-act descriptions, no teleport.

NPCs: reuse `mara` neighbor (69,67); `act1-ivo` map-giver(75,68); `act1-tessa` guide(76,76); `nell` farmer(77,66); town map-giver `town-map-giver`(44,86), town card-guide `town-card-guide`(46,85). Other village template residents/animals optional preserved/translated. Include safe region around town (x40–48,y81–89) separate map card `millers-cross` versus home `home-village`.

Enemy entities: designated `act1-road-thief`, type thief, (88,55) must tile path; `act1-cave-monster`, type cave-monster,(106,36); `act1-air-monster`,type air-monster,(72,9). Wildlife/other thieves stable IDs and correct habitats; all thieves including travel destination must be path only. Main boss gates/prerequisites are runtime responsibility.

`Act1World.regionAt(x,y)` -> 'village'|'town'|'forest'|'cracked'|'mountains'; allow definition optional if useful. Seeded world should vary details but guarantee full connectivity and distinct regions/nine passages. Do not build another battle system.

### Puzzle API

`Act1Puzzles.DEFINITIONS` array and `initial(id) -> serializable state`; `act(id,state,action) -> {state,solved,feedback}`. All puzzles resettable, unlimited retry, no resource consumption. Expected five IDs above. `action` has `{type,...}`; exported definition includes readable instructions, action descriptors and stable solution/test. Data-driven UI may inspect `DEFINITIONS` for `actions:[{label,action}]` and `hint`. No hidden random unsolvable states. Runtime persists states in `state.act1.puzzles`, grants rewards exactly once and supports textual clues/keyboard/touch.

Suggested rules: channels rotate three junctions to target [1,2,1]; witnesses select supported road direction after three statements; changing forest follows left/right/left environmental signs; stone mechanism aligns [2,0,1] after observing runes; northern passage orders shelter/bell/bridge switches (no child decision). Display clues supporting the solutions in actual UI.

## Runtime completion requirements

Implement real new Act1 journey/menu, canonical inventory/binder/satchel/food+ammo combat, one companion distraction, map knowledge distinct from exploration, main quest road→living cave→chests→north air opponent→unresolved dilemma, persistent animal choice, chance thief drops, side quests/escort/footpath, all five puzzles and editor-driven data. Do not expose events via debug/journal shortcuts as a substitute for playable encounters. Legacy victories never advance a preview. Boss negotiation/escape cannot grant story victory or clear required bosses. Side quests/chests/puzzles must not hardlock the main route.

Full state extras may be additive to V1: mode, sideQuests, puzzles, pendingAnimal, claimed rewards, inventory with zero quantity permitted for consumables (or remove exhausted entries), map IDs. Ensure hydrate does not reject own legitimate consumed inventory. Immutable pure event APIs remain valid. Old unsupported payload preserved. Practice does not save/consume/award permanent progress.

Final verification: all current checks plus full campaign actual-runtime tests for full main path and reload/decline/pregear/practice/animal/drops/puzzles/maps, source + standalone + Pages startup, public export exclusion and editor save/roundtrip/conflicts. Try browser again if available; record concrete limitation if unavailable. Update plan/ledger only with verified completed work. Local builds only.
