# Task 2 and delivered milestone review

Date: October 29, 2026. Independent review of the village prologue and its integration with the previously reviewed state model. Scope is Tasks 1–3, not future Tasks 4–13.

Verdicts: **spec compliance PASS; code quality PASS**. No critical or important findings requiring changes.

Reviewed the scoped baseline diff and complete added files in `2026-10-29-task2-review-package.txt`, Task 2/global constraints in the implementation plan, the design spec, and current adapter/check files including the later `--builds` checks. Examined existing generation, boot/UI bindings, resident construction, dialogue escaping, home interaction and practice restoration seams. Task 1's separately reviewed 13-test state model was checked only at integration boundaries.

The actual index loads the state model before the adapter, after existing overrides and before boot. The adapter explicitly rebinds eager binder/touch handlers; later boot binds the wrapped journal. It installs residents for the already-generated world and through subsequent hydration. The narrow generation change preserves existing campaign payloads across landscape changes; explicit valid new-character creation clears the replaced journey's preview.

Opt-in adds campaign data without resetting legacy character, inventory, gold or world progress. Existing Mara is reused; Ivo/Tessa have distinct IDs. Dialogue uses the existing escaped speech renderer. Acceptance/reacceptance, home equipment and local-map grants use the state model's idempotent events. Equipment collection before acceptance counts. The appended home UI preserves Rest's callback. Inventory separates quantity from level and clearly labels legacy combat versus preview cards.

Map ownership opens a dedicated landmark view filtered to `homeBounds`; it does not consult outside terrain or change `seen`, exploration percentage or atlas behavior. Unsupported, malformed and present-null payloads remain intact and disable preview mutation, including during eager startup. Existing whole-state practice snapshots include campaign data; no practice outcome enters the campaign event adapter.

The adapter's event allowlist stops at village preparation. Journal/map/binder reads cannot award road, cave, chest, northern or ending outcomes. No new probability, balance, upgrade, kidnapping or child-location assumptions were added. Main-story model capabilities are not presented as playable story completion.

Packaging registers both modules in standalone and Pages outputs and retains the public allowlist. The integration check loads actual source script order, binds/clicks rendered dialogue actions, covers repeat claims/reload/practice/new-character behavior, and preloads unreadable saves before initial generation. Its final `--builds` mode also loads both generated products, checks exact module contents and excludes editor/server/check files.

Validation evidence: the parent independently reports 24/24 combined campaign/editor Node tests passing; `act1-check.cjs`, smoke, combat and access checks passing; both builds passing; and `act1-check.cjs --builds` passing against both generated products. Its `git diff --check` findings are pre-existing EOF blank lines in workflow/README; the scoped README diff introduces no whitespace error. This reviewer did not duplicate those runs, as requested.

The browser host is unavailable; headless action coverage does not establish desktop/phone layout, speech reachability or visual polish. This is a documented verification limitation, not an inferred code defect. The delivered milestone is ready to report as a locally built, verified prologue, with future Tasks 4–13 left open.
