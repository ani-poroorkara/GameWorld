# Act 1 runtime independent review

Review scope: actual final campaign adapter, startup/state/combat/map seams, source/bundle registrations, runtime harness and modified presentation rules against the completion contract. Content validation and world-module implementation belong to the separate data review. This report records the source observed during concurrent integration; later fixes need targeted rechecks.

## Verdicts

- **Specification: pass for the reviewed runtime scope.** All original runtime findings are addressed, including shipped and authored nonterminal stage prerequisites.
- **Quality: pass for the reviewed source/headless and static scope.** The animation lock, repeated-action focus and per-tile cloning findings are addressed. Browser visual acceptance remains unverified.

## Original findings (all addressed by final re-review)

1. **P1 — valid authored stage prerequisites are not implemented.** `prototype/act1-campaign.js:107` maps only `search-accepted`, `road-lead`, `cave-victory` and `air-victory`; other exported stage IDs never become flags/events/claims. Probe: advance accepted/home/info/thief/reveal/cave through the actual pure event seam. `campaignQuestCard().stageId` is `search-chests`, but `campaignRequirements(['search-chests'])` remains false. A chest or puzzle edited to require this existing approved stage therefore never opens. The same unsupported-ID problem affects terminal and side-quest stage references. Define consistent completion semantics for every supported exported quest stage and use them in runtime checks, or reject unsupported references before export.

2. **P2 — commitment immediately discards the resolving lock.** `prototype/act1-campaign.js:33` invokes the original commit (which renders and disables Next during animation), then invokes `renderCombat()` again. `prototype/map-combat.js:16` replaces the panel's HTML and `prototype/combat.js:24` clears animation state; the new Next button is enabled immediately. Fresh actual-index probe with `preferences.reduceMotion=false`, boar practice and a Punch hand returns `phase='reveal'` and `commitHand.disabled===false`; no timer ran in the harness. Consume validated campaign inventory before the original render/animation, or update quantities without replacing that animated surface. Preserve invalid-hand no-spend and exactly-once spending.

3. **P2 — native keyboard focus is lost on repeated interactive updates (static evidence).** Card/die callbacks in `prototype/combat.js:32` re-render through `prototype/map-combat.js:16`, which removes the focused button using `innerHTML`; no focus restoration follows. `prototype/act1-campaign.js:106` likewise replaces the open modal for every puzzle action. Keyboard users must recover their place after each selection/action. Restore the corresponding control, or deliberately move focus to the appropriate next action, while retaining dialog focus containment. This is a DOM-semantics finding, not a real-browser assertion.

4. **P2 advisory — campaign validation/cloning runs in the tile draw loop.** `prototype/act1-campaign.js:4` calls `act1Campaign()`/`hydrateCampaign()` (including cloning campaign state), and `prototype/act1-campaign.js:128` calls that predicate for each rendered tile. Thirty headless draws averaged 8.88 ms with the current predicate versus 2.44 ms with a mode-only predicate in the same VM. Cache validated campaign identity at load/mutation boundaries; keep full validation outside the frame loop. This is CPU evidence from a stub canvas, not a browser frame-time measurement.

## Positive evidence and boundaries

A targeted independent traversal used BFS only to select routes, then executed every step through real `move()` without assigning coordinates. A fresh Balanced campaign accepted Mara's rendered request, collected home gear, spoke to Tessa, fought the road thief/cave/air opponent through rendered Fight/card/Commit/Next controls, and reached `stage='dilemma'` in 160 walking steps. No optional puzzle/chest/Bow reward was needed. The rendered ending leaves the decision to Act 2.

Static inspection confirms canonical card uses/food/ammo, separate owned map bounds versus seen fog, real-victory story gates, unresolved ending, persistent pending animal decisions and full practice snapshots. The integration suite already exercises defaults, eager campaign reload, legacy/preview save boundaries, rewards, side quests and five puzzle UIs; this review did not repeat all reported broad checks.

Latest authoring and character HP changes were observed in source: configured puzzle `getDefinition`/actions/rewards, authored settlement map IDs/bounds/safety, authored NPC topics and quest text, and `CFG.maxHP` food/rest caps. The named Throw/Block chest canonical-reward finding was routed to content validation: the parent confirmed canonical rewards are binding and will reject removing them, while quantity/extras remain editable.

Mobile/static check: touch controls and combat actions use native buttons; card tray is horizontally scrollable, battle panel vertically scrollable with a sticky commitment footer; landscape rules shorten/hide auxiliary text; puzzle clues and state are textual. Focus-visible button styles exist. Native browser testing, screenshots, actual mobile overflow and measured browser movement/frame-time remain unavailable because browser hosting was unavailable and the native app approval attempt timed out. No visual pass is claimed.

No implementation edits, commits, publishing or subagents were used by this reviewer.

## Targeted fix re-review

The reviewer subsequently added the separately authorized verification-only `prototype/act1-walk-check.cjs`. Its source run passed the same 160-step route; `--builds` is available for the parent's rebuilt artifacts. No production file was edited by this reviewer.

- **Finding 1 — PARTIALLY ADDRESSED.** `prototype/act1-campaign.js:132` now resolves every shipped stage, retained irrigation claims, and arbitrary terminal aliases. Independent probe confirmed all ten shipped stage IDs resolve after the corresponding achievements. However, editor validation still accepts renaming/adding nonterminal stage IDs, while the runtime's generic fallback at `prototype/act1-campaign.js:147` reads `completedQuestStageIds` without any code recording these generic IDs. Rename `search-chests` to `authored-search` and use that approved ID as a chest/puzzle prerequisite: it never resolves. Enforce supported nonterminal IDs at authoring/export or map the authored stages to implemented achievements.
- **Finding 2 — ADDRESSED.** `prototype/act1-campaign.js:51` retains the original commit render/animation and updates quantity badges without replacing the surface. Independent fresh-index normal-motion commitment keeps `commitHand.disabled===true` before any timeout callback.
- **Finding 3 — ADDRESSED.** The adapter captures/restores card/die focus around its final combat render, and puzzle actions capture/restore their controls. Independent probes focused a Punch toggle and a channel dial; the final active elements remained Punch and `puzzleAction0`. Static inspection confirms native `contains`/`activeElement` guards and disabled-control checks. Real-browser testing remains unavailable.
- **Finding 4 — ADDRESSED.** The validity WeakMap at `prototype/act1-campaign.js:4` validates newly encountered campaign objects once. An independent wrapper counter around `hydrateCampaign` recorded one hydration across two draws after replacing the campaign object identity.

The named chest canonical-reward boundary is now enforced in `editor/model.js:71`: approved Throw/Block chests must retain their required canonical reward. Extra rewards and quantities stay editable. Source inspection also confirms the reported character HP cap and approved-enemy fallback guard changes; no new defect was found in those changes.

## Final re-review verdict

**Specification: PASS. Quality: PASS for source/headless and static review. No unresolved blocking runtime findings.** Actual-browser visual/mobile acceptance remains unverified under the previously recorded environment limitation.

The remaining generic-stage issue is **ADDRESSED** by recursive `achieved()` resolution in `prototype/act1-campaign.js:143`: approved enclosing quest acceptance is required, authored prerequisite lists resolve through shipped milestones or other authored stages, terminal aliases retain completion checks, and a visiting guard prevents recursion cycles.

An independent export-plus-runtime probe renamed `search-chests` to `authored-search`, added `extra-authored-stage` requiring the renamed stage and Stone Staff, and added a chest requiring that new stage. The real exporter accepted the authored data. Runtime rejected the gate before quest acceptance and again before cave victory; after the cave event granted Staff, both stages resolved and the chest awarded two Apples exactly once. This targeted probe closes the original prerequisite finding without repeating broad suites.

The parent separately reports the final rebuilt source/standalone/Pages suites and the new actual-movement check all passing, with 160 real moves per artifact. Those build runs are parent evidence; this review independently ran the source movement probe and targeted fix probes described above.


