# Local Content Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Deliver a usable local JSON content editor for Act 1 cards, levels, enemies and drop rules.

**Architecture:** Browser forms and previews share a validator with a loopback-only Node service. A versioned JSON catalogue is saved atomically with backups and optimistic concurrency. Draft authoring is explicitly separate from runtime gameplay and publishing.

**Tech Stack:** Existing JavaScript, Node built-ins, HTML and CSS; no package installation.

**Spec:** `docs/content-editor-design.md`

## Global Constraints

- Keep the editor outside `prototype/` and its public build allowlist.
- Preserve unknown values and deferred gameplay decisions; import 14 Act 1 cards.
- Preserve game saves and existing gameplay.
- No cloud publishing; loopback binding only.

## Review Focus

- Stale browser tab must not overwrite a newer disk revision.
- Invalid references and probabilities must block saving without losing edits.
- Unknown probabilities must remain null, not accidentally become zero.
- Exported data and visible previews must preserve names containing markup as text.
- Off-origin requests and client paths must not write arbitrary files.

### Task 1: Catalogue and validation

**Files:** `content/act1.json`, `editor/model.js`, `editor/model.test.cjs`.
**Interfaces:** `validateContent(data) -> {errors, warnings}`, `summarizeContent(data) -> counts`.

- [x] Write tests for the confirmed catalogue, unresolved values, references, duplicate levels, invalid probabilities and quantities.
- [x] Run tests and confirm the missing implementation fails.
- [x] Implement catalogue and shared validator; run tests to green.

### Task 2: Safe local persistence

**Files:** `editor/server.cjs`, `editor/server.test.cjs`.
**Interfaces:** `createEditorServer({contentFile,backupDir}) -> http.Server`; GET `/api/content` returns data/revision/writeToken, PUT accepts token and If-Match revision.

- [x] Write integration tests using a temporary catalogue for read/save, backup, rejection of invalid edits, stale saves, external origins, and traversal.
- [x] Run and observe missing implementation failure.
- [x] Implement fixed-path atomic persistence and loopback service; run tests to green.

### Task 3: Usable authoring UI

**Files:** `editor/index.html`, `editor/style.css`, `editor/app.js`, `editor/README.md`, `editor/start.cmd`, `editor/.gitignore`.

- [x] Build searchable Cards, Enemies and Drops views with editable forms, level rows and card preview.
- [x] Add explicit validation, save, reload and export; retain unsaved draft on errors and stale revisions.
- [x] Verify real save/reload, invalid save, blank probability, level edits, and mobile layout through browser.
- [x] Run editor tests and existing combat/world/access checks, build public output, and confirm editor is excluded.

## Completion record

- Eleven content/persistence tests pass, including stale saves, parallel writes, invalid on-disk structure, and split Unicode characters.
- Existing combat, world, and access regressions pass; public game build excludes the editor and catalogue.
- Browser verified save/reload, level addition/preview/removal, invalid probability blocking, blank preservation, reload recovery, narrow layout, and no console errors. Test edits restored.
- Read-only review found two issues; both were reproduced by failing tests and fixed.
- Ruling: this increment is authoring-only, with no runtime migration or publishing, because card progression and loot semantics are still undecided.
- No changes committed or published; existing unrelated prototype work preserved.
