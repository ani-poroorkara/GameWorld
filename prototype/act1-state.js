(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Act1State = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const VERSION = 1;
  const CARDS = Object.freeze({
    PUNCH: 'punch', HAND_BLOCK: 'hand-block', PICKAXE: 'pickaxe', SHIELD: 'shield',
    STAFF: 'stone-staff', THROW: 'stone-throw', BLOCK: 'stone-block', BOW: 'bow',
    ARROWS: 'arrows', APPLE: 'apple', STEAK: 'steak', PET: 'pet-distraction',
    MAP: 'map', QUEST: 'save-the-kid'
  });
  // Pass {type: EVENTS.NAME}. LOCAL_MAP_COLLECTED also requires mapId: a stable
  // settlement-region ID. Outcome events are for verified real encounters only;
  // this pure model neither runs combat nor decides whether an encounter was won.
  const EVENTS = Object.freeze({
    QUEST_ACCEPTED: 'quest-accepted', QUEST_DECLINED: 'quest-declined',
    VILLAGE_INFORMATION: 'village-information', HOME_GEAR_COLLECTED: 'home-gear-collected',
    LOCAL_MAP_COLLECTED: 'local-map-collected', ROAD_THIEF_DEFEATED: 'road-thief-defeated',
    CAVE_REVEALED: 'cave-revealed', CAVE_DEFEATED: 'cave-defeated',
    THROW_CHEST_CLAIMED: 'throw-chest-claimed', BLOCK_CHEST_CLAIMED: 'block-chest-claimed',
    NORTHERN_PASSAGE_REACHED: 'northern-passage-reached', AIR_MONSTER_DEFEATED: 'air-monster-defeated',
    DILEMMA_PRESENTED: 'dilemma-presented'
  });
  const STAGES = Object.freeze({
    VILLAGE: 'village', PREPARING: 'preparing', ROAD: 'road', CAVE: 'cave',
    CAVE_BATTLE: 'cave-battle', NORTH: 'north', AIR_BATTLE: 'air-battle',
    REVELATION: 'revelation', DILEMMA: 'dilemma'
  });
  const flagNames = ['accepted', 'declined', 'villageInformation', 'homeGear', 'roadLead',
    'caveRevealed', 'caveDefeated', 'northernPassage', 'airMonsterDefeated', 'dilemmaPresented'];
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const id = value => typeof value === 'string' && /^[a-z][a-z0-9-]{0,63}$/.test(value);
  const positive = value => Number.isSafeInteger(value) && value > 0;
  const clone = value => JSON.parse(JSON.stringify(value));
  function error(code, message) { const result = new Error(message); result.code = code; return result; }
  function invalid() { throw error('ACT1_INVALID_SAVE', 'Invalid Act 1 save; retain the original saved data.'); }

  function progress(flags) {
    if (!flags.accepted) return {status: flags.declined ? 'declined' : 'available', stage: STAGES.VILLAGE};
    let stage = STAGES.PREPARING;
    if (flags.homeGear && flags.villageInformation) stage = STAGES.ROAD;
    if (flags.roadLead) stage = STAGES.CAVE;
    if (flags.caveRevealed) stage = STAGES.CAVE_BATTLE;
    if (flags.caveDefeated) stage = STAGES.NORTH;
    if (flags.northernPassage) stage = STAGES.AIR_BATTLE;
    if (flags.airMonsterDefeated) stage = STAGES.REVELATION;
    if (flags.dilemmaPresented) stage = STAGES.DILEMMA;
    return {status: flags.dilemmaPresented ? 'complete' : 'active', stage};
  }

  /** createCampaign() -> CampaignV1. No legacy inventory or world state is read. */
  function createCampaign() {
    return {
      version: VERSION, status: 'available', stage: STAGES.VILLAGE,
      inventory: {[CARDS.PUNCH]: {quantity: 1, level: 1}, [CARDS.HAND_BLOCK]: {quantity: 1, level: 1}},
      flags: Object.fromEntries(flagNames.map(name => [name, false])),
      claimedRewardIds: [], localMapIds: [], completedEvents: []
    };
  }

  /** hydrateCampaign(value) -> detached CampaignV1. null/undefined means absent.
   * Throws ACT1_UNSUPPORTED_VERSION / ACT1_INVALID_SAVE for existing unreadable
   * saves. Callers must preserve that original save and disable campaign writes;
   * do not catch these errors by replacing the save with createCampaign().
   */
  function hydrateCampaign(value) {
    if (value === null || value === undefined) return createCampaign();
    if (!record(value)) invalid();
    if (own(value, 'version') && value.version !== VERSION) {
      throw error('ACT1_UNSUPPORTED_VERSION', 'Unsupported Act 1 version; retain the original saved data.');
    }
    if (value.version !== VERSION || !record(value.inventory) || !record(value.flags)) invalid();
    if (own(value,'mode') && value.mode !== 'campaign') invalid();
    if (value.mode === 'campaign') {
      for (const key of ['puzzles','sideQuests','animalChoices']) if (own(value,key) && !record(value[key])) invalid();
      if (own(value,'pendingAnimal') && value.pendingAnimal !== null && (!record(value.pendingAnimal) || !id(value.pendingAnimal.id) || typeof value.pendingAnimal.type !== 'string' || typeof value.pendingAnimal.name !== 'string')) invalid();
    }
    for (const name of flagNames) if (typeof value.flags[name] !== 'boolean') invalid();
    for (const key of ['claimedRewardIds', 'localMapIds', 'completedEvents']) {
      if (!Array.isArray(value[key]) || value[key].some(item => typeof item !== 'string') ||
        new Set(value[key]).size !== value[key].length) invalid();
    }
    if (!value.localMapIds.every(id)) invalid();
    const canonicalIds = Object.values(CARDS);
    for (const [key, item] of Object.entries(value.inventory)) {
      if (!(canonicalIds.includes(key) || (value.mode === 'campaign' && id(key))) || !record(item) || !(positive(item.quantity) || (value.mode === 'campaign' && item.quantity === 0)) || !positive(item.level)) invalid();
    }
    for (const key of [CARDS.PUNCH, CARDS.HAND_BLOCK]) if (!own(value.inventory, key)) invalid();
    const f = value.flags;
    if ((f.roadLead && !(f.accepted && f.homeGear && f.villageInformation)) ||
      (f.caveRevealed && !f.roadLead) || (f.caveDefeated && !f.caveRevealed) ||
      (f.northernPassage && !f.caveDefeated) || (f.airMonsterDefeated && !f.northernPassage) ||
      (f.dilemmaPresented && !f.airMonsterDefeated)) invalid();
    const derived = progress(f);
    if (value.stage !== derived.stage || value.status !== derived.status) invalid();
    if (own(value.inventory, CARDS.QUEST) !== f.accepted ||
      (f.accepted && value.inventory[CARDS.QUEST].quantity !== 1)) invalid();
    for (const [claimed, keys] of [
      ['home-gear', [CARDS.PICKAXE, CARDS.SHIELD]], ['cave-staff', [CARDS.STAFF]],
      ['chest-stone-throw', [CARDS.THROW]], ['chest-stone-block', [CARDS.BLOCK]]
    ]) {
      if (value.claimedRewardIds.includes(claimed) && keys.some(key => !own(value.inventory, key))) invalid();
    }
    if (value.claimedRewardIds.includes('home-gear') !== f.homeGear ||
      value.claimedRewardIds.includes('cave-staff') !== f.caveDefeated ||
      (value.claimedRewardIds.includes('chest-stone-block') && !f.caveDefeated)) invalid();
    for (const mapId of value.localMapIds) {
      if (!value.claimedRewardIds.includes('map:' + mapId)) invalid();
    }
    if (value.localMapIds.length && (!value.inventory[CARDS.MAP] ||
      value.inventory[CARDS.MAP].quantity !== value.localMapIds.length)) invalid();
    try { return clone(value); } catch (_) { invalid(); }
  }

  function grant(state, cardId) {
    if (own(state.inventory, cardId)) state.inventory[cardId].quantity += 1;
    else state.inventory[cardId] = {quantity: 1, level: 1};
  }
  function claim(state, rewardId, cardIds) {
    if (state.claimedRewardIds.includes(rewardId)) return false;
    state.claimedRewardIds.push(rewardId);
    for (const cardId of cardIds) grant(state, cardId);
    return true;
  }

  /** applyEvent(campaign, {type, mapId?}) -> detached CampaignV1.
   * Unknown, malformed, repeated and prerequisite-blocked events are value no-ops.
   * Fixed reward IDs, rather than caller-supplied IDs, prevent duplicate grants.
   */
  function applyEvent(campaign, event) {
    const state = hydrateCampaign(campaign);
    if (!record(event) || !Object.values(EVENTS).includes(event.type)) return state;
    const f = state.flags;
    let applied = false;
    let eventKey = event.type;
    function set(name, allowed = true) {
      if (allowed && !f[name]) { f[name] = true; applied = true; }
    }
    switch (event.type) {
      case EVENTS.QUEST_ACCEPTED:
        if (!f.accepted) { set('accepted'); grant(state, CARDS.QUEST); }
        break;
      case EVENTS.QUEST_DECLINED: set('declined', !f.accepted); break;
      case EVENTS.VILLAGE_INFORMATION: set('villageInformation'); break;
      case EVENTS.HOME_GEAR_COLLECTED:
        if (claim(state, 'home-gear', [CARDS.PICKAXE, CARDS.SHIELD])) set('homeGear');
        break;
      case EVENTS.LOCAL_MAP_COLLECTED:
        if (id(event.mapId) && !state.localMapIds.includes(event.mapId)) {
          claim(state, 'map:' + event.mapId, [CARDS.MAP]);
          state.localMapIds.push(event.mapId);
          eventKey += ':' + event.mapId;
          applied = true;
        }
        break;
      case EVENTS.ROAD_THIEF_DEFEATED: set('roadLead', f.accepted && f.homeGear && f.villageInformation); break;
      case EVENTS.CAVE_REVEALED: set('caveRevealed', f.roadLead); break;
      case EVENTS.CAVE_DEFEATED:
        if (f.caveRevealed && !f.caveDefeated) {
          set('caveDefeated'); claim(state, 'cave-staff', [CARDS.STAFF]);
        }
        break;
      case EVENTS.THROW_CHEST_CLAIMED: applied = claim(state, 'chest-stone-throw', [CARDS.THROW]); break;
      case EVENTS.BLOCK_CHEST_CLAIMED:
        if (f.caveDefeated) applied = claim(state, 'chest-stone-block', [CARDS.BLOCK]);
        break;
      case EVENTS.NORTHERN_PASSAGE_REACHED: set('northernPassage', f.caveDefeated); break;
      case EVENTS.AIR_MONSTER_DEFEATED: set('airMonsterDefeated', f.northernPassage); break;
      case EVENTS.DILEMMA_PRESENTED: set('dilemmaPresented', f.airMonsterDefeated); break;
    }
    if (applied) {
      if (!state.completedEvents.includes(eventKey)) state.completedEvents.push(eventKey);
      Object.assign(state, progress(f));
    }
    return state;
  }

  /** questCard(campaign) -> null | {id,name,quantity,level,status,stage,nextObjective}.
   * This journal view has no Act 2 choice controls or resolved story facts.
   */
  function questCard(campaign) {
    const state = hydrateCampaign(campaign);
    if (!state.flags.accepted) return null;
    const objectives = {
      [STAGES.PREPARING]: !state.flags.villageInformation ? 'Speak with the villagers about the search.' : 'Collect the Pickaxe and Shield at home.',
      [STAGES.ROAD]: 'Find the lead from the designated thief on the road.',
      [STAGES.CAVE]: 'Follow the road lead to the old cave.',
      [STAGES.CAVE_BATTLE]: 'Defeat the living cave monster.',
      [STAGES.NORTH]: 'Reach the northern passage. You may search the area for optional chests.',
      [STAGES.AIR_BATTLE]: 'Confront the air monster at the northern passage.',
      [STAGES.REVELATION]: "Hear the air monster's demand.",
      [STAGES.DILEMMA]: 'Act 1 complete — decision continues in Act 2.'
    };
    return {id: CARDS.QUEST, name: 'Save the Kid', quantity: 1, level: 1,
      status: state.status, stage: state.stage, nextObjective: objectives[state.stage]};
  }

  return {VERSION, CARDS, EVENTS, STAGES, createCampaign, hydrateCampaign, applyEvent, questCard};
});
