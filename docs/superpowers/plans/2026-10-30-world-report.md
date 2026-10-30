# Act 1 world and puzzles completion report

Scope: pure modules `prototype/act1-world.js`, `prototype/act1-puzzles.js`, their new tests, and this report. No runtime, content, editor, build, dependency, commit or publishing changes by this worker.

## APIs delivered

Both modules work as dependency-free browser UMD globals and CommonJS exports.

`Act1World.build(seed, definition?)` returns serializable `{size,tiles,landmarks,regions,passages,spawn,homeBounds,villagers,animals,enemies}`. Tiles are a flat row-major 144 by 144 array, each `{type,v,region}` using existing renderer terrain types. `Act1World.regionAt(x,y)` returns village, town, forest, cracked or mountains. Bounds and fixed entity positions follow the completion contract. Region metadata includes safe settlement bounds, home-village/millers-cross map IDs, and nested parent IDs.

The seeded world varies terrain and wildlife while preserving story positions, all nine physical passages, three-tile roads, connected glades, interactable approaches and enemy habitats. Home/town contain no hostile spawns; all thieves occupy path tiles. The 18 opponents comprise the three designated story opponents plus five each of thieves, boars and bears. Nonstory enemies remain spaced apart. Flood repair connects any enclosed natural walkable pockets.

Optional exported definitions provide authoritative NPC, chest, puzzle and passage arrays without mutating input. An explicitly empty group installs no entities from that group; fallback defaults apply only when the property is absent. Valid edge positions are supported; draft entries are skipped. Puzzle mechanic `kind` values remain in content while physical landmarks retain `kind:'puzzle'` for interaction. Invalid coordinates are ignored by this low-level builder; approved content validation remains the exporter's responsibility.

The fallen-footpath landmark stays walkable at (91,50), with physical tree blockers on x88..90 and92..94 at y50. Parallel north/south detours prevent a progression dependency. Runtime's agreed Pickaxe clear of x88..94,y50 opens the straight shortcut, and runtime records/restores that effect. Generation reserves no opponent on a blocker. This placement follows the authored landmark if moved.

`Act1Puzzles.DEFINITIONS` exposes five fallback definitions with `id,name,kind,instructions,hint,actions:[{label,action}],solution`. `getDefinition(id,configs?)` supplies the configured definition and generated actions. `initial(id,configs?)` creates fresh serializable state. `act(id,state,action,configs?)` returns independent `{state,solved,feedback}` without mutating its input. Unknown IDs throw. Reset `{type:'reset'}` is always accepted, including after solution; every puzzle permits unlimited retries and consumes no resource.

States contain `{id,solved,progress}` with `dials:[0,0,0]` for rotation puzzles. Actions and selected playtest solutions:

| Puzzle | Action | Solution |
| --- | --- | --- |
| farmers-channels | `{type:'rotate',index:0..2}` | dials 1,2,1 |
| three-witnesses | `{type:'choose',direction}` | east |
| changing-forest | `{type:'step',direction}` | left,right,left |
| stone-mechanism | `{type:'rotate',index:0..2}` | dials 2,0,1 |
| northern-passage | `{type:'press',switch}` | shelter,bell,bridge |

These rules are new reversible playtest choices authorized by the completion contract, not earlier user-confirmed decisions. Instructions and hints explicitly supply nonvisual clues. Incorrect sequences restart their sequence; wrong witness choices remain retryable; dials rotate modulo three. A solved state stays solved until reset. Runtime owns persistence, one-time rewards, keyboard/touch controls and prerequisites.

## Verification evidence

- Tests written first and observed failing because modules were absent; authoring edge/kind regression and physical footpath regression were also observed failing before implementation fixes.
- `node --test prototype/act1-world.test.cjs prototype/act1-puzzles.test.cjs`: 11 passed, 0 failed, about 1.25 seconds.
- A 24-seed breadth-first corpus checks every site, NPC, animal and passage with all enemy tiles treated as blocked. Each entity has at least two reachable orthogonal approaches. A second flood proves every walkable tile belongs to the spawn component. Tests cover serialization, seed repeatability/variation, safe habitats, authored edge locations, and actual browser UMD globals through Node VM.
- Puzzle fixtures exercise each independently pinned solution, 30 invalid retries per puzzle, reset after completion, wrong answers, JSON save/load between steps, input immutability and solved-state stability. A separate breadth-first search solves all five using only advertised UI buttons.
- `node --test`: 46 passed, 0 failed at completion (includes current content/editor/state tests; runtime integration remains owned by its worker).
- `node prototype/smoke-check.cjs`, `node prototype/combat-check.cjs`, `node prototype/access-check.cjs`, `node prototype/act1-check.cjs`: all passed. These are headless existing regression checks.
- A 50-seed standalone native Node generation benchmark before the minor footpath carve measured median 14.31 ms, p95 30.72 ms, maximum 37.41 ms. This is generation CPU time, not browser frame-time or visual QA.

No actual-browser or whole-campaign completion claim is made by this module report. Script registration, actual rendering, travel spawn rules, saved-world installation, quest gates and one-time reward handling require the runtime worker's integration checks.

## Independent review round 1 fixes

Addressed findings 1–3 of `2026-10-30-data-review.md` plus the parent's concrete mountain-enclosure check. New regression tests were observed failing before the corresponding fixes. Final command for this round: `node --test prototype/act1-world.test.cjs prototype/act1-puzzles.test.cjs` — **16 passed, 0 failed**, approximately 1.8 seconds. Broader tests were intentionally left to the integrator in this round.

- Authored `definition.regions` is authoritative, including an explicit empty list. Regions use `kind` and `bounds:{x1,x2,y1,y2}` consistently in generation, `regionAt(x,y,definition?)`, habitat classification, safe-area exclusion and returned metadata. Returned regions preserve those authoring fields and add flat `left,right,top,bottom,safe` aliases. Overlaps prefer safe settlements, then the smallest matching region. The outer unspecified biome is mountains. Fallback bounds now match campaign metadata: forest25–118 and cracked5–138. `(30,60)` is forest. `homeBounds` follows the authored village bounds and is null when no village exists in an explicit region list. Story encounters covered by edited safe bounds move to the nearest eligible approach, excluding interaction sites and other actors; if the whole map is safe they are omitted rather than placed in safety.
- Explicit NPC/chest/puzzle/passage arrays replace defaults. Removed or draft default entities remain absent physically. Missing group properties retain compatibility defaults. Custom and edge-position entities still receive connected approaches.
- Configured puzzles support arbitrary IDs with channels/mechanism/witnesses/forest/passage kinds. Dial configurations use `solution:number[]`, `initialDials:number[]` of equal nonzero length with values0–2, and `modulus:3`. Sequence configurations use `solution:string[]` and unique `choices:[{label,value}]`. Both require textual `instructions` and `hint`. Runtime configurations are authoritative; no fallback ID is reinstated when omitted, empty or draft. Unsupported or unsolvable parameters fail clearly before initial state is produced. Actions are generated from configured choices and dial count. Legacy signatures and the five fallback definitions remain supported; compatibility aliases dials/sequence are accepted internally.
- Config regression coverage edits an existing channels puzzle's clue, initial dial count and solution; creates a custom witness answer west; solves a custom forest route right/right with JSON reloads; checks reset restores configured initial dials; rejects unsupported kinds, out-of-range targets and solutions absent from choices. No configuration input is mutated.
- The default perimeter x0–2/x141–143/y0–2/y141–143 stays solid mountain. Glades and flood repair stay inside it. All nine fixed passage entrances remain inside and reachable; explicitly authored edge sites can carve their physical approaches. The 24-seed all-floor/enemy-blocking connectivity corpus remains green after the enclosure change.
