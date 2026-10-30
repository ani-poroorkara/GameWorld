# Act 1 content/editor completion report

Implemented Tasks 4/12 within the shared October 30 completion contract. No commits, pushes or deployment. Existing dirty workspace files outside the assigned ownership were preserved.

## Delivered

- `content/act1.json`: all 14 scoped cards have explicit editable playtest power/use/dice values; Stone Throw requires owned Stone Staff; food and distraction have no dice. Five enemy definitions have finite stats. Thief Bow .25 and Arrows .6 use independent drop definitions with inclusive quantities and no first guarantee/pity. Other reward/story rules preserved.
- `content/campaign-act1.json`: initial 144-square campaign definition, six role-specific NPCs with topics, four quests with staged prerequisite text, three chests, five puzzle metadata entries, four regions and nine physical passages. Main narrative ends at the unresolved dilemma, without deciding the child's fate/location or kidnapper identity.
- `content/export.cjs`: `buildRuntimeContent(catalogue,campaign)`, `serializeRuntimeContent(data)` and `writeRuntimeContent(options)` generate the plain UMD/CommonJS `Act1Data` object in `prototype/act1-data.js`. Rejects unresolved approved required numbers, missing dice policies, unapproved dependencies and invalid structures; no null-to-zero fallback. Filters drafts and unconfirmed drops.
- `editor/model.js`: additive old-draft migration, approval/dice validation, ownership-reference cycles, campaign IDs/references/prerequisite cycles/bounds/structure. Preserves nulls in drafts.
- `editor/app.js`, `index.html`, `style.css`: campaign tabs, coordinate/status/role/kind editors, structured nested JSON fields and escaped live previews. Card approval/dice/ownership prerequisite editors added. Invalid JSON remains visible across navigation and blocks saving even after editing another field. Runtime export is explicit.
- `editor/server.cjs`: existing tokens, local origin restrictions, 1 MB bound, optimistic revisions, serialized writes, atomic replacement and backups retained. GET migrates old catalogue and imports campaign seed; explicit saves persist the campaign in the same protected document. Token-protected POST `/api/runtime-export` returns escaped JS without filesystem mutation.
- `editor/README.md`: run/save/export/restore instructions and source precedence.

All selected balance, loot, dialogue, placements and puzzle reward defaults are identified as new reversible playtest choices; `approved` denotes enabled content, not prior user approval.

## Source coherence

Before a campaign is embedded, `content/campaign-act1.json` supplies the initial campaign. The editor adds it into the returned document's `campaign` property and explicit saves store the complete authoring document in `content/act1.json`. Exporters prefer that embedded campaign. Therefore saved quest/NPC/chest/region/passage/puzzle edits flow into generated Act1Data, rather than being disconnected from the runtime source. Seed changes intentionally do not override an already embedded campaign.

Start editor: `node editor/server.cjs`, open http://127.0.0.1:4180/. Save source explicitly, then run `node content/export.cjs` and rebuild the prototype. Editor runtime-download permits inspection of unsaved valid data; it does not modify project runtime files. Full standalone/Pages registration/build is owned by the runtime integrator.

## Verification evidence

Observed meaningful red tests before implementation: absent exporter/migration, missing campaign validation, missing campaign editing/escaping, disconnected save/export, approved missing dice policy accepted, draft null coordinates rejected, missing card dependency-cycle detection, and malformed JSON saving after another edit. Implemented and reran green.

`node --test editor/*.test.cjs content/*.test.cjs`: 22/22 passed.

`node --test editor/*.test.cjs content/*.test.cjs prototype/*.test.cjs`: 45/45 passed at the recorded run (concurrent runtime/world work may add more tests later).

`node content/export.cjs`: exported 14 approved cards and four quests successfully. Generated-file equality against current sources and browser UMD execution pass. Server integration confirms saved campaign topic text roundtrips into runtime export, including literal script-like text escaped safely in the generated source. Existing backup/conflict/origin/split-Unicode tests all pass. UI logic tested in a DOM harness; no claim of visual browser QA from this worker. Parent integration owns actual runtime browser/build verification.

## Round 1 review corrections (findings 3 and 4)

Added fully authored puzzle configurations: every approved puzzle now supplies instructions, hint, solution and either initialDials/modulus or labeled choices. Supported authoring kinds are channels, mechanism, witnesses, forest and passage; arbitrary new IDs use these mechanics. Validation rejects unknown kinds, nonfinite/off-map positions, missing clues, empty/oversized solutions, mismatched dial lengths, out-of-range/noninteger dials, unsupported modulus, duplicate choice values and sequence steps absent from choices. Drafts may retain missing parameter blocks until authored. Editor fields expose clues, solutions, starting dials, modulus and choices; changing kind refreshes the appropriate parameter controls. Runtime export uses the same validation and preserves authored parameters. The world/puzzle worker supplies the corresponding data-driven API; this worker did not modify its files.

The main quest explicitly declares terminalStageId `dilemma`, and its final stage has terminal:true. Approved main quests cannot omit this declaration or delete, move or unmark the referenced final stage. Other quests may opt into the same terminal contract. The editor exposes terminalStageId and the staged JSON terminal marker. Migration does not repair a broken approved terminal contract by guessing a replacement.

Observed failing regression tests first for custom unsupported/invalid puzzle configurations, missing/deleted/nonfinal/unmarked terminal stages, and absent parameter/terminal editor controls. After implementation: `node --test content/*.test.cjs editor/*.test.cjs` passes 25/25. `node content/export.cjs` succeeds, and generated UMD/source parity remains covered. Fixed several accidentally encoded question-mark punctuation characters in the supplied new metadata while retaining actual dialogue question marks.

## Final acquisition invariant review

The approved named progression chests are contract-bound acquisitions: chest-stone-throw must include at least one Stone Throw, and chest-stone-block must include at least one Stone Block. Shared validation now rejects approved definitions that remove their canonical card. Additional rewards and quantities remain editable, and draft definitions may omit the canonical reward and remain excluded. This makes successful authoring/export agree with the runtime's canonical story-event bridge rather than accepting an unrelated reward and silently granting the original card. Terminal-stage validation remains in force unchanged.

Observed the targeted canonical-chest test fail before implementation. After implementation `node --test content/*.test.cjs editor/*.test.cjs` passes 26/26, including removal rejection, draft exclusion and editable quantity/additional reward coverage. `node content/export.cjs` regenerated the valid current runtime data successfully.

## Round 2 authored-region boundary guard

Confirmed Act1World supports exactly village, town, forest, cracked and mountains. Approved region definitions now use the same shared validator allowlist, and the editor presents those kinds as a dropdown. An unsupported draft region remains authorable but is excluded by runtime export. Observed the new unsupported-approved-kind test fail before implementation, then pass with all five supported kinds and draft exclusion covered. Focused editor/content suite passes 27/27; `node content/export.cjs` regenerated current valid data successfully. No world/runtime worker files changed.
