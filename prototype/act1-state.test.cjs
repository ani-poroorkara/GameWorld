const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const modulePath = path.join(__dirname, 'act1-state.js');
// The first red run reports the missing public API as an assertion, not a loader error.
const api = fs.existsSync(modulePath) ? require(modulePath) : {};
const {EVENTS: E, createCampaign, hydrateCampaign, applyEvent, questCard} = api;
const event = (state, type, extra = {}) => applyEvent(state, {type, ...extra});
function prepared() {
  let state = createCampaign();
  for (const type of [E.QUEST_ACCEPTED, E.VILLAGE_INFORMATION, E.HOME_GEAR_COLLECTED]) state = event(state, type);
  return state;
}
function caveWon() {
  let state = prepared();
  for (const type of [E.ROAD_THIEF_DEFEATED, E.CAVE_REVEALED, E.CAVE_DEFEATED]) state = event(state, type);
  return state;
}

test('new campaign owns only canonical starting cards and no unaccepted Quest Card', () => {
  assert.equal(typeof createCampaign, 'function', 'campaign API must exist');
  const state = createCampaign();
  assert.equal(state.version, 1);
  assert.deepEqual(state.inventory, {punch: {quantity: 1, level: 1}, 'hand-block': {quantity: 1, level: 1}});
  assert.equal(questCard(state), null);
  assert.equal(state.status, 'available');
  assert.equal(state.stage, 'village');
});

test('decline survives reload, later acceptance creates exactly one updating card', () => {
  let state = event(createCampaign(), E.QUEST_DECLINED);
  assert.equal(state.status, 'declined');
  assert.equal(questCard(state), null);
  state = hydrateCampaign(JSON.parse(JSON.stringify(state)));
  state = event(state, E.QUEST_ACCEPTED);
  assert.equal(questCard(state).id, 'save-the-kid');
  assert.equal(questCard(state).name, 'Save the Kid');
  assert.equal(state.inventory['save-the-kid'].quantity, 1);
  assert.equal(state.stage, 'preparing');
  const accepted = structuredClone(state);
  state = event(event(state, E.QUEST_ACCEPTED), E.QUEST_DECLINED);
  assert.deepEqual(state, accepted);
});

test('home gear before acceptance counts and repeated collection cannot duplicate it', () => {
  let state = event(createCampaign(), E.HOME_GEAR_COLLECTED);
  assert.equal(state.inventory.pickaxe.quantity, 1);
  assert.equal(state.inventory.shield.quantity, 1);
  assert.equal(questCard(state), null);
  state = event(event(state, E.QUEST_ACCEPTED), E.VILLAGE_INFORMATION);
  assert.equal(state.stage, 'road');
  const before = structuredClone(state);
  state = event(hydrateCampaign(JSON.parse(JSON.stringify(state))), E.HOME_GEAR_COLLECTED);
  assert.deepEqual(state, before);
});

test('preparation journal updates when information and home gear are collected after accepting', () => {
  let state = event(createCampaign(), E.QUEST_ACCEPTED);
  assert.match(questCard(state).nextObjective, /villag/i);
  state = event(state, E.VILLAGE_INFORMATION);
  assert.match(questCard(state).nextObjective, /home/i);
  state = event(state, E.HOME_GEAR_COLLECTED);
  assert.equal(state.stage, 'road');
  assert.match(questCard(state).nextObjective, /road/i);
});

test('settlement map ownership is local and idempotent, with quantity separate from level', () => {
  let state = event(createCampaign(), E.LOCAL_MAP_COLLECTED, {mapId: 'village'});
  assert.deepEqual(state.localMapIds, ['village']);
  assert.deepEqual(state.inventory.map, {quantity: 1, level: 1});
  const once = structuredClone(state);
  state = event(hydrateCampaign(state), E.LOCAL_MAP_COLLECTED, {mapId: 'village'});
  assert.deepEqual(state, once);
  state = event(state, E.LOCAL_MAP_COLLECTED, {mapId: 'other-settlement'});
  assert.deepEqual(state.localMapIds, ['village', 'other-settlement']);
  assert.deepEqual(state.inventory.map, {quantity: 2, level: 1});
  assert.equal(state.seen, undefined);
  for (const mapId of [undefined, '', '__proto__', '*', 123]) {
    assert.deepEqual(event(state, E.LOCAL_MAP_COLLECTED, {mapId}), state);
  }
});

test('invalid and out-of-order events cannot advance an unaccepted or unprepared quest', () => {
  for (const state of [createCampaign(), event(createCampaign(), E.QUEST_ACCEPTED)]) {
    for (const type of [E.ROAD_THIEF_DEFEATED, E.CAVE_REVEALED, E.CAVE_DEFEATED,
      E.BLOCK_CHEST_CLAIMED, E.NORTHERN_PASSAGE_REACHED, E.AIR_MONSTER_DEFEATED, E.DILEMMA_PRESENTED]) {
      assert.deepEqual(event(state, type), state, type);
    }
    for (const bad of [null, {}, [], 'quest-accepted', {type: 'choose-own-child'}, {type: '__proto__'}]) {
      assert.deepEqual(applyEvent(state, bad), state);
    }
  }
});

test('road victory supplies the lead without a Bow and cave victory requires cave reveal', () => {
  let state = prepared();
  assert.deepEqual(event(state, E.CAVE_REVEALED), state);
  state = event(state, E.ROAD_THIEF_DEFEATED);
  assert.equal(state.stage, 'cave');
  assert.equal(state.inventory.bow, undefined);
  assert.equal(state.inventory.arrows, undefined);
  assert.deepEqual(event(state, E.CAVE_DEFEATED), state);
  state = event(state, E.CAVE_REVEALED);
  assert.equal(state.stage, 'cave-battle');
  state = event(state, E.CAVE_DEFEATED);
  assert.deepEqual(state.inventory['stone-staff'], {quantity: 1, level: 1});
  assert.equal(state.inventory['stone-throw'], undefined);
  assert.equal(state.inventory['stone-block'], undefined);
  assert.deepEqual(event(hydrateCampaign(state), E.CAVE_DEFEATED), state);
});

test('Throw chest is independent while Block chest requires cave victory and both are one-time', () => {
  let state = event(createCampaign(), E.THROW_CHEST_CLAIMED);
  assert.equal(state.inventory['stone-throw'].quantity, 1);
  assert.equal(questCard(state), null);
  assert.deepEqual(event(state, E.BLOCK_CHEST_CLAIMED), state);
  state = caveWon();
  for (const type of [E.THROW_CHEST_CLAIMED, E.BLOCK_CHEST_CLAIMED]) {
    state = event(state, type);
    assert.deepEqual(event(hydrateCampaign(state), type), state);
  }
  assert.equal(state.inventory['stone-throw'].quantity, 1);
  assert.equal(state.inventory['stone-block'].quantity, 1);
  assert.equal(new Set(state.claimedRewardIds).size, state.claimedRewardIds.length);
});

test('main route reaches unresolved dilemma without either optional chest or random drops', () => {
  let state = prepared();
  assert.deepEqual(event(state, E.NORTHERN_PASSAGE_REACHED), state);
  state = caveWon();
  assert.deepEqual(event(state, E.AIR_MONSTER_DEFEATED), state);
  assert.deepEqual(event(state, E.DILEMMA_PRESENTED), state);
  state = event(state, E.NORTHERN_PASSAGE_REACHED);
  assert.deepEqual(event(state, E.DILEMMA_PRESENTED), state);
  state = event(state, E.AIR_MONSTER_DEFEATED);
  assert.equal(state.status, 'active');
  state = event(state, E.DILEMMA_PRESENTED);
  assert.equal(state.status, 'complete');
  assert.equal(state.stage, 'dilemma');
  const card = questCard(state);
  assert.match(card.nextObjective, /Act 1 complete.*decision continues in Act 2/i);
  assert.equal(card.choices, undefined);
  assert.equal(state.inventory['stone-block'], undefined);
  for (const type of Object.values(E)) {
    if ([E.LOCAL_MAP_COLLECTED, E.THROW_CHEST_CLAIMED, E.BLOCK_CHEST_CLAIMED].includes(type)) continue;
    assert.deepEqual(event(state, type), state, type);
  }
  assert.deepEqual(event(state, 'choose-neighbor-child'), state);
});

test('event application and hydration return independent serializable data without input mutation', () => {
  const state = prepared();
  const saved = JSON.stringify(state);
  Object.freeze(state.flags);
  Object.freeze(state.inventory);
  Object.freeze(state);
  const next = event(state, E.ROAD_THIEF_DEFEATED);
  assert.equal(JSON.stringify(state), saved);
  next.inventory.punch.quantity = 7;
  assert.equal(state.inventory.punch.quantity, 1);
  const loaded = hydrateCampaign(JSON.parse(JSON.stringify(next)));
  assert.deepEqual(loaded, next);
  loaded.localMapIds.push('another-map');
  assert.deepEqual(next.localMapIds, []);
  const card = questCard(next);
  card.name = 'edited';
  assert.equal(questCard(next).name, 'Save the Kid');
});

test('missing save initializes but unknown versions and malformed saves throw without data loss', () => {
  assert.deepEqual(hydrateCampaign(null), createCampaign());
  assert.deepEqual(hydrateCampaign(undefined), createCampaign());
  for (const value of [{version: 2, progress: 'keep me'}, {version: 0}, {version: '1'}]) {
    const before = JSON.stringify(value);
    assert.throws(() => hydrateCampaign(value), error => error.code === 'ACT1_UNSUPPORTED_VERSION');
    assert.throws(() => applyEvent(value, {type: E.QUEST_ACCEPTED}), error => error.code === 'ACT1_UNSUPPORTED_VERSION');
    assert.equal(JSON.stringify(value), before);
  }
  const malformed = [[], 'saved', {}, {version: 1}, {...prepared(), inventory: {punch: {quantity: -1, level: 1}}},
    {...prepared(), localMapIds: ['village', 'village']}, {...prepared(), stage: 'dilemma'}];
  for (const value of malformed) {
    assert.throws(() => hydrateCampaign(value), error => error.code === 'ACT1_INVALID_SAVE');
  }
});

test('JSON round trip preserves all intermediate stages and one-time claims', () => {
  let state = createCampaign();
  for (const type of [E.QUEST_DECLINED, E.HOME_GEAR_COLLECTED, E.QUEST_ACCEPTED, E.VILLAGE_INFORMATION,
    E.ROAD_THIEF_DEFEATED, E.CAVE_REVEALED, E.CAVE_DEFEATED, E.BLOCK_CHEST_CLAIMED,
    E.THROW_CHEST_CLAIMED, E.NORTHERN_PASSAGE_REACHED, E.AIR_MONSTER_DEFEATED, E.DILEMMA_PRESENTED]) {
    state = event(state, type);
    assert.deepEqual(hydrateCampaign(JSON.parse(JSON.stringify(state))), state);
    assert.deepEqual(event(state, type), state);
  }
});

test('browser UMD global exposes the same campaign API without CommonJS', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(modulePath, 'utf8'), context);
  assert.equal(typeof context.Act1State.applyEvent, 'function');
  assert.deepEqual(JSON.parse(JSON.stringify(context.Act1State.createCampaign())), createCampaign());
});
