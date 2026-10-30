# MyWorld Studio

A local Act 1 authoring tool. Requires Node.js; no packages or account are needed.

Start `node editor/server.cjs` from the project root, then open http://127.0.0.1:4180/. `editor/start.cmd` also starts the service and opens the page on Windows. Keep its terminal running.

## Authoring

- Cards: names, descriptions, effects, acquisition, numeric power and fight uses, ammunition and owned-card requirements, dice permission, and approval status. Quantity belongs to player inventory; levels do not imply an upgrade recipe.
- Enemies: numeric health, attack, defense, attack description and approval status.
- Drops: source/card references, inclusive quantity range, independent probability, condition, and draft/confirmed status. Chances are percentages in the UI and 0-1 numbers in JSON.
- Quests: stable IDs and ordered stages, each with text and prerequisite IDs.
- NPCs: positions, separate service roles, local map ID and conversation topics.
- Chests and puzzles: positions, prerequisites, card rewards and approval status. Puzzle kind chooses one of the five retryable mechanics implemented in Act1Puzzles; the editor does not execute arbitrary puzzle code.
- Regions: kind, map ID and inclusive coordinate bounds. Passages: positions, description and northern-route flag. Positions and bounds are checked against the campaign world size.

Nested topic/stage/reward/prerequisite lists use labeled JSON text areas with examples. The escaped preview updates as valid edits are made. Invalid JSON remains in its field when switching sections and blocks saving/export until corrected. Structural validation checks identities, references, bounds and prerequisite cycles. Numeric blanks remain null; no missing power becomes zero.

`draft` and `approved` are editable runtime inclusion statuses. The supplied approved content uses newly selected October 30 playtest defaults; this label does not claim prior user approval of balance, loot, placements or dialogue. Runtime export rejects unresolved required fields of approved content. Draft null values remain editable and are excluded from the playable export.

## Save and export

Save changes validates and atomically writes `content/act1.json`, retaining the previous file in `editor/.backups/`. Existing write tokens, origin restrictions, revisions and conflict handling protect saves. Reload requires an explicit discard action when edits exist. Export JSON downloads the current complete authoring document without saving it.

The initial campaign source is `content/campaign-act1.json`. When loading an older catalogue without a campaign, the editor additively imports that source into the authoring document's `campaign` property. After the first save, the embedded `content/act1.json` campaign is authoritative. Both CLI and editor runtime exports prefer that saved embedded campaign. Editing the seed after an embedded campaign exists does not override the saved authoring document.

After saving, run:

```
node content/export.cjs
```

This validates the saved source and generates `prototype/act1-data.js`, a dependency-free UMD/CommonJS `Act1Data` object. Then run the existing prototype build commands to refresh standalone/Pages artifacts. Export runtime JS in the editor downloads the current valid approved content as a JS file for inspection; it does not write the project file. Saving, exporting and building locally do not publish or alter player saves.

Restore a backup by stopping the service, copying the desired JSON from `editor/.backups/` over `content/act1.json`, and restarting. Source files and this editor stay outside the public build allowlist.

## Checks

```
node --test editor/*.test.cjs content/*.test.cjs
node --test editor/*.test.cjs content/*.test.cjs prototype/*.test.cjs
```

Tests cover numeric and reference validation, additive migration, approval filtering, generated UMD parity, escaped previews, incomplete JSON, authoring-to-runtime roundtrip, atomic backups, conflict detection and off-origin rejection. The server binds only to loopback; do not expose this local service publicly.

Puzzle parameters are authored alongside placement/rewards: approved configurations require instructions/hint, a solution array and either initialDials plus modulus 3 (channels/mechanism) or unique labeled choices covering every solution step (witnesses/forest/passage). New stable puzzle IDs can use any supported kind. Main quest stages explicitly name terminalStageId; the final matching stage must carry terminal:true. Removing the ending or silently replacing a missing approved ending is rejected.
