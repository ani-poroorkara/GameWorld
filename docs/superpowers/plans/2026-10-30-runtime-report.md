# Full Act 1 runtime completion report

The separately named **New Act 1 campaign** choice now creates a real campaign (
`state.act1.mode='campaign'`) through character creation. The existing character
choice and the old opt-in prologue remain available. Only an intentional new
character/new campaign replaces the current saved journey.

## Runtime files

- `prototype/act1-campaign.js`: final adapter after the existing map-combat and
  preview adapters. Approved runtime card/enemy/drop definitions, canonical
  inventory, combat consumption, conversations, local maps, world interactions,
  chests, all five puzzle UIs, side quests, animal decisions and Act 1 ending.
- `prototype/game.js`: eager campaign generation/restoration uses
  `Act1World.build(seed,Act1Data)`, 144-square indexing, campaign entity arrays,
  home bounds and correct saved coordinate validation before any startup save.
- `prototype/act1-state.js`: consumed zero quantities and side-quest card IDs
  survive hydration in full campaigns. Additional campaign containers are checked.
  Legacy strict inventory behavior and unreadable-payload preservation remain.
- `prototype/map-combat.css`: combat quantity/level badges and readable puzzle
  dial/progress presentation. Existing map combat HUD and animations remain.
- `prototype/index.html`, `bundle.cjs`, `build-pages.cjs`: data/world/puzzles and
  final campaign adapter included in source, standalone and public allowlist builds.
- `prototype/act1-check.cjs`: reusable launch harness export, faithful button data
  attributes and callbacks. Existing legacy regression suite still runs unchanged
  when invoked as the executable.
- `prototype/act1-campaign-check.cjs`: actual-index runtime integration coverage.

Content, editor and world/puzzle module sources belong to their independent workers.

## Playable controls and route

Single Player -> New Act 1 campaign -> choose character/build -> Begin journey.
Move with WASD/arrows or touch arrows; press E/tap Interact near a person or site.
Map locations and exact controls are also recorded in the live quest journal.

1. Mara (69,67): Quest topic, accept or decline; return later after declining.
2. Home (72,72): collect Pickaxe and Shield, including before quest acceptance.
3. Tessa (76,76), Nell (77,66) and other residents: separate Normal/Quest topics,
   preparation/card explanations, optional chest hints and side quests.
4. Defeat designated road thief (88,55) to obtain the cave lead. Independent
   configured Bow/Arrow rolls have no guaranteed first drop.
5. Inspect living cave entrance (106,35), fight its opponent (106,36), receive
   Stone Staff. Separate chests at (43,55) and (110,32) grant Stone Throw and
   post-cave Stone Block respectively; optional rewards never gate the main route.
6. Inspect northern watch (72,7), defeat air monster (72,9), hear the unresolved
   own-child versus neighbor-child dilemma. No Act 2 decision controls appear.

The Ivo and town map-giver cards cover separate home/town bounds and never mark
terrain explored. The farm provides two Apples per harvest with a walking cooldown;
shops use canonical quantities. Apple/Steak heal 5/15, consume at full HP in combat,
and cannot take dice. Bow consumes one Arrow per committed attack. A companion
unlocks one 50% no-dice distraction per fight, cancelling at most one attack.

Animal victory saves a pending spare/kill decision. Killing grants exactly one
Steak, spare grants none; either choice remains cleared. Pending choices survive
reload and reappear on Interact. Negotiation/escape never clear required opponents
or advance main-story events. Practice restores the complete campaign snapshot.

Nell accepts irrigation and runaway quest cards. Tracks at (61,65)/(54,62), animal
at (49,62), walking escort and pen (64,71) complete the runaway. Pickaxe opens the
physical blocked footpath (91,50), grants its quest card and persists the shortcut.
All five world puzzles use module action descriptors, visible clues, buttons,
readable state, unlimited retries/reset and once-only configured rewards.

## Verification evidence

The first new campaign test failed because the rendered New Act 1 campaign button
was absent. After implementation the following commands pass:

`node prototype/access-check.cjs`

`node prototype/combat-check.cjs`

`node prototype/smoke-check.cjs`

`node --test prototype/act1-state.test.cjs prototype/act1-world.test.cjs prototype/act1-puzzles.test.cjs`

29/29 module tests pass, including world connectivity with blocking opponents and
all five puzzles solved with only their advertised actions.

`node prototype/bundle.cjs`

`node prototype/build-pages.cjs`

`node prototype/act1-check.cjs --builds`

`node prototype/act1-campaign-check.cjs --builds`

Actual source startup tests click rendered conversation buttons, combat card picks,
Commit/Next buttons and puzzle actions. Main fights preserve the real locked enemy
hands and simultaneous resolver; reduced motion removes animation waits in the
headless harness. Main-route tests complete both with optional content and with only
canonical home/cave gear and no random drops. Tests cover pregear, decline/reaccept,
reload, map ownership/fog isolation, quantity zero, food healing and no dice, ammo
exhaustion, Pet one-attack cancellation/one use, full practice snapshot isolation,
negotiation gates, independent drops/Arrow endpoints, separate/idempotent chests,
persistent animal choice/exact Steak, all five puzzle rewards/reset, side quest
cards/clues/escort/pen and shortcut restoration. Campaign draw executes headlessly.

Standalone and Pages builds both boot intentional new campaigns and eagerly reload
a completed campaign at x110/y32 without truncation or loss of the unresolved ending.
Legacy/prologue journeys and unsupported saves still pass their actual-startup suite.
Public output allowlist checks exclude editor/server/test tooling.

These are headless JavaScript/DOM-harness checks, not browser screenshot evidence.
The parent task owns the separate real-browser attempt and visual QA report.
No commits, pushes or deployments were performed.

## Integration review fixes

The full runtime now passes the authoritative exported puzzle configs to
`Act1Puzzles.getDefinition`, `initial` and `act`. A custom exported puzzle ID,
custom choices/solution/clues and its configured reward were exercised through the
actual Interact UI. Region bounds/map IDs/safety come from `Act1Data.regions`, and
map-givers use their authored `mapId`. Moved/expanded town bounds and changed map
ownership were verified without changing exploration. Authored NPC topics and quest
stage text appear in real conversations, the journal and the binder.

Main Quest Card stages select the authored stable stage text; terminal display uses
`terminalStageId`. Side cards add the live next action to authored stage text:
first tracks -> second tracks -> runaway -> pen -> complete, irrigation -> complete,
and collect Pickaxe -> clear footpath -> complete. The harness verifies clue progress
changes the journal/binder instructions immediately.

All shipped prerequisite milestone IDs have explicit achievement semantics:

- `search-accepted`: main quest accepted.
- `road-lead`: designated thief actually defeated.
- `cave-victory`: living cave actually defeated.
- `search-chests`: either special chest searched, or northern passage reached;
  optional chest exploration never blocks the main story.
- `air-victory`: air opponent actually defeated.
- `dilemma`: unresolved Act 1 dilemma presented.
- `animal-clues`: both clue sites investigated.
- `animal-home`: escort delivered to the pen.
- `water-flow`: channels solved; remains achieved after a replay/reset.
- `path-open`: Pickaxe shortcut completed.

Authored terminal stage IDs also resolve when their quest completes. Explicit
`completedQuestStageIds` history can preserve other completed stage IDs. Actual
configured chests and puzzles gated by a quest stage reject interaction before the
achievement and open after it.

Resilience-derived maximum health is preserved. A rendered nonbalanced character
shows 40 HP in creation, starts with 40, reloads with 40, and food caps at 40 while
keeping the confirmed 5/15 healing. Cave/air practice encounters also execute the
map draw path. Bear retains its established two .55 Dodge uses, and enemy attack
labels consume authored `attackName`. Removed/draft full-world enemy definitions
stay unavailable instead of falling back to legacy guardian stats; explicitly
isolated legacy practice opponents remain supported.

Combat commitment updates quantity badges in place after resolution, preserving
the normal-motion animation class and disabled Next button until the existing
animation finishes. Keyboard focus is restored to the matching enabled card/die or
puzzle action after rerender; opening a new surface does not steal focus. The
headless harness now models active-element disconnection, so focus regressions
produce real failing assertions.

Campaign validity is cached per campaign object rather than cloning the complete
campaign for every rendered tile. State hydration/event/practice restoration creates
new objects and validates them once; unsupported versions still fail the guard.
The runtime regression counts at most one hydration across two map draws. A
50-frame headless comparison measured **2.669 ms/frame cached versus 8.812 ms/frame
with the old per-tile hydration**, about 3.30x faster on this machine. These are
headless timing measurements, not browser frame-rate claims.

The README now leads with the full campaign entry and marks legacy/prologue
instructions as alternative modes. Real-browser visual QA remains unverified:
the connected browser host was unavailable and a native request timed out after
300 seconds in the parent task. No additional browser success is claimed.

Approved custom/renamed quest stages use dependency-milestone semantics: the quest
must be accepted (the main acceptance flag or an owned/accepted side quest), then
all declared `requires` must be achieved recursively. Root custom stages with no
requirements become available after acceptance. A cycle guard prevents recursive
loops even if malformed data bypasses the exporter. Shipped event-specific IDs
retain their explicit real-victory/interaction predicates, and terminal stages
still require actual quest completion.

A real exporter-to-index regression renames `search-chests` to
`authored-search`, adds `authored-midpoint` depending on it, and gates a new chest
on that intermediate stage. The export validates; the actual chest stays unavailable
before the living cave fight, then opens after real rendered-card victory. This
establishes that approved stage references are executable rather than inert metadata.
