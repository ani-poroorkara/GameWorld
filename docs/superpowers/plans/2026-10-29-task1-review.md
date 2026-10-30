# Task 1 independent review

Date: October 29, 2026.
Scope: `prototype/act1-state.js` and `prototype/act1-state.test.cjs`, checked against Task 1 in `2026-10-29-act1.md`, the Act 1 design spec, and confirmed `docs/Act 1.md`. The report file was absent at review time. Complete additions were reviewed; no runtime or test files were edited.

Spec verdict: PASS. No blocking spec findings.

- The UMD/CommonJS API, versioned campaign fields, canonical card identifiers, detached event application and journal API satisfy Task 1.
- Starting inventory is exactly Punch and Hand Block. Quest acceptance creates one Quest Card; decline/reload/later acceptance and repeated events preserve its quantity. Equipment collected before acceptance counts.
- Road progress requires acceptance, village information and home equipment. Cave reveal, cave victory, northern arrival, air victory and dilemma presentation have the intended ordered prerequisites. No Bow or optional chest gates the main route.
- Cave victory grants only Staff. Throw has a separate claim; Block is separately cave-gated. Fixed reward and local map claims are idempotent across ordinary save/reload.
- The terminal journal contains the unresolved Act 2 handoff and no decision controls or invented child locations, identity, drops, probabilities, combat values or upgrade rules.
- All 14 exported card IDs match `content/act1.json`.

Quality verdict: PASS for the Task 1 gate. No actionable correctness findings on states produced by the public event API.

The module is small and dependency-free; progression is derived centrally, event prerequisites are explicit, and reward claims have stable internal IDs. Hydration rejects unsupported versions without resetting input and checks the main progression chain. Tests cover the requested public behavior, immutability, intermediate JSON round trips, one-time claims, and browser UMD loading. The already independently verified 13 passing tests were not rerun for this read-only review.

Non-blocking improvement: add a catalogue consistency assertion to the tests so future edits to `content/act1.json` cannot silently drift from exported `CARDS`. The current identifiers were compared during this review and match.

Limit: malformed-save validation is selective rather than a complete proof that every accepted object is reachable through events. This does not affect ordinary API-produced saves reviewed here; adapters should retain the documented preserve-and-disable behavior on hydration errors. Browser integration and save ownership belong to Task 2 and were not reviewed in this gate.
