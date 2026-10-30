# Task 1 implementation report

Implemented only the pure campaign model and its tests. No existing dirty files were modified, staged or committed by this task.

Files created:

- `prototype/act1-state.js`
- `prototype/act1-state.test.cjs`
- This report.

## API and data contract

UMD browser global `Act1State`; CommonJS `require('./act1-state.js')`. No DOM, storage, RNG, combat or content-publication dependency.

```js
createCampaign() -> CampaignV1
hydrateCampaign(value) -> CampaignV1
applyEvent(campaign, {type, mapId?}) -> CampaignV1
questCard(campaign) -> null | {
  id, name, quantity, level, status, stage, nextObjective
}
```

All functions return detached JSON-serializable data. `applyEvent` never mutates its input. Invalid, repeated and prerequisite-blocked events return an independent campaign equal in value to the input. `questCard` returns null until accepted; accepting adds exactly one `save-the-kid` inventory entry and produces the updating journal view.

```js
CampaignV1 = {
  version: 1,
  status: 'available' | 'declined' | 'active' | 'complete',
  stage: 'village' | 'preparing' | 'road' | 'cave' | 'cave-battle' |
    'north' | 'air-battle' | 'revelation' | 'dilemma',
  inventory: {[canonicalCardId]: {quantity: positiveInteger, level: positiveInteger}},
  flags: {
    accepted, declined, villageInformation, homeGear, roadLead,
    caveRevealed, caveDefeated, northernPassage,
    airMonsterDefeated, dilemmaPresented // all booleans
  },
  claimedRewardIds: string[],
  localMapIds: string[],
  completedEvents: string[]
}
```

Exported constants: `VERSION`, frozen `CARDS`, frozen `EVENTS`, frozen `STAGES`.

`CARDS` maps `PUNCH`, `HAND_BLOCK`, `PICKAXE`, `SHIELD`, `STAFF`, `THROW`, `BLOCK`, `BOW`, `ARROWS`, `APPLE`, `STEAK`, `PET`, `MAP`, `QUEST` to the corresponding canonical catalogue IDs (`STAFF` is `stone-staff`; `QUEST` is `save-the-kid`). Starting inventory contains only Punch and Hand Block, each quantity 1 and level 1. Equipment grants use level 1 without defining any leveling mechanic.

`EVENTS` keys and exact serialized names:

| Constant | Serialized type | Prerequisite/effect |
| --- | --- | --- |
| QUEST_ACCEPTED | quest-accepted | Accept once, automatically create Quest Card |
| QUEST_DECLINED | quest-declined | Before acceptance only; permits later acceptance |
| VILLAGE_INFORMATION | village-information | Remember conversation, including before acceptance |
| HOME_GEAR_COLLECTED | home-gear-collected | Claim Pickaxe/Shield once; precollection counts |
| LOCAL_MAP_COLLECTED | local-map-collected | Requires stable `mapId`; claim each settlement map once |
| ROAD_THIEF_DEFEATED | road-thief-defeated | Requires accepted + information + home gear; grants lead without Bow |
| CAVE_REVEALED | cave-revealed | Requires road lead |
| CAVE_DEFEATED | cave-defeated | Requires cave revealed; grants Staff once |
| THROW_CHEST_CLAIMED | throw-chest-claimed | Independent optional chest; grants Throw once |
| BLOCK_CHEST_CLAIMED | block-chest-claimed | Requires cave victory; grants Block once |
| NORTHERN_PASSAGE_REACHED | northern-passage-reached | Requires cave victory |
| AIR_MONSTER_DEFEATED | air-monster-defeated | Requires northern passage reached |
| DILEMMA_PRESENTED | dilemma-presented | Requires air victory; freezes main quest at unresolved Act 1 ending |

Map IDs use lowercase letters/numbers/hyphens, start with a letter and have at most 64 characters. Example: `{type: Act1State.EVENTS.LOCAL_MAP_COLLECTED, mapId: 'village'}`. Map quantity counts owned settlement maps; map ownership records no physically explored tiles or region boundaries.

Reward IDs: `home-gear`, `cave-staff`, `chest-stone-throw`, `chest-stone-block`, `map:<mapId>`. Completed event keys are the serialized event type, except local maps append `:<mapId>`.

## Safe save handling

`hydrateCampaign(null)` and `hydrateCampaign(undefined)` create a fresh campaign. An existing unsupported version throws an Error with `code: 'ACT1_UNSUPPORTED_VERSION'`; malformed v1 data throws `code: 'ACT1_INVALID_SAVE'`. Inputs remain intact. `applyEvent` and `questCard` also validate through hydration.

Adapter requirement: on either error, retain the original `state.act1`, display the issue, and disable campaign writes. Never recover by assigning `createCampaign()` over the unreadable save. This model does not attempt a speculative migration.

## TDD and verification evidence

Red: wrote the 13 tests before creating `act1-state.js`, then ran `node --test prototype/act1-state.test.cjs`. Exit 1: 13 failed, 0 passed. First failure was the explicit assertion `campaign API must exist` (`undefined` versus `function`); remaining failures were the absent API/module. This confirmed the new contract was unimplemented.

Green: created the implementation and reran the same command. Exit 0: 13 passed, 0 failed. Tests cover starting inventory, no unaccepted Quest Card, decline/reload/reaccept, home collection before/after acceptance, local-map idempotence, malformed/out-of-order events, independent Bow-free road lead, cave reveal/victory gating, separate one-time chest rewards, northern prerequisites, the unresolved terminal journal, detached results, unsupported versions, malformed saves, every main-stage JSON round trip and browser UMD loading.

Regression commands also passed:

- `node prototype/smoke-check.cjs`
- `node prototype/combat-check.cjs`
- `node prototype/access-check.cjs`
- `node --test editor/model.test.cjs editor/server.test.cjs` — 11 passed, 0 failed.

## Confidence and remaining boundaries

High confidence in the tested pure state transitions and repeated/reloaded reward handling. Combat outcome authenticity, designated encounter identity, road-only spawn placement, practice isolation, storage error presentation, dialogue escaping and actual map boundaries remain adapter/runtime responsibilities. Outcome event constants must only be dispatched for verified real victories, never dialogue or practice. No card power, random drop chance, upgrade recipe, child location, kidnapper identity or Act 2 outcome was introduced. Optional chests are unnecessary for main-route completion. No builds or browser checks were needed for this pure-model task; no deployment occurred.
