'use strict';
// Opt-in village preview. Legacy inventory and combat continue to use their existing rules.
const ACT1_MAP_ID='home-village';
const ACT1_NAMES={punch:'Punch','hand-block':'Hand Block',pickaxe:'Pickaxe',shield:'Shield','stone-staff':'Stone Staff','stone-throw':'Stone Throw','stone-block':'Stone Block',bow:'Bow',arrows:'Arrows',apple:'Apple',steak:'Steak','pet-distraction':'Pet Distraction',map:'Local Map Card','save-the-kid':'Save the Kid'};
function act1Campaign(){
 if(!Object.prototype.hasOwnProperty.call(state,'act1'))return null;
 if(state.act1===null||state.act1===undefined)return null;
 try{return Act1State.hydrateCampaign(state.act1)}catch{return null}
}
function act1Unreadable(){return Object.prototype.hasOwnProperty.call(state,'act1')&&!act1Campaign()}
function act1InstallResidents(){
 if(!act1Campaign())return;
 for(const resident of [
  {id:'act1-ivo',name:'Ivo the map-giver',x:43,y:38,color:'#bfa46e',text:'A map shows landmarks. Walking a place is a different kind of knowing.'},
  {id:'act1-tessa',name:'Tessa the card guide',x:44,y:46,color:'#a19ab8',text:'Keep your cards in your Bustagam. Quantity and level describe different things.'}
 ])if(!villagers.some(v=>v.id===resident.id))villagers.push(resident);
}
function act1StartPreview(){
 // Presence, including a null/unsupported payload, prevents accidental replacement.
 if(Object.prototype.hasOwnProperty.call(state,'act1')||combat)return;
 state.act1=Act1State.createCampaign();act1InstallResidents();save();showQuests();
}
function act1AtHome(){const home=landmarks.find(p=>p.id==='home');return home&&distance(state,home)<=2}
function act1Event(type){
 const campaign=act1Campaign();if(!campaign||combat)return false;
 // Only prologue events can enter through this adapter. Real encounters are a later milestone.
 const E=Act1State.EVENTS;
 if(![E.QUEST_ACCEPTED,E.QUEST_DECLINED,E.VILLAGE_INFORMATION,E.HOME_GEAR_COLLECTED,E.LOCAL_MAP_COLLECTED].includes(type))return false;
 if(type===E.HOME_GEAR_COLLECTED&&!act1AtHome())return false;
 state.act1=Act1State.applyEvent(campaign,{type,...(type===E.LOCAL_MAP_COLLECTED?{mapId:ACT1_MAP_ID}:{})});save();return true;
}
function act1JournalHTML(){
 if(act1Unreadable())return '<section><h2>Act 1 prologue preview</h2><p>This campaign save cannot be read by this version. Its original data is retained; preview changes are disabled.</p></section>';
 const c=act1Campaign();
 if(!c)return '<section><h2>Act 1 prologue preview</h2><p>Try the village conversations, home equipment and local map in your current world. The existing battles and battle cards still use legacy rules.</p>'+actionButton('Start prologue preview','act1Start')+'</section>';
 const q=Act1State.questCard(c);
 return `<section><h2>Act 1 prologue preview</h2><p>Village conversations, home equipment and a local map are available. Main story encounters and final Act 1 combat are not available in this preview.</p>${q?`<div class="play-card"><strong>${escapeText(q.name)}</strong><small>Quantity ${q.quantity} · Level ${q.level}</small><p>${escapeText(q.nextObjective)}</p></div>`:`<p>${c.status==='declined'?'You said “Not yet.” You can revisit Mara when ready.':'Talk to Mara about her request. Accepting creates the Save the Kid Quest Card.'}</p>`}<p>Find Mara near the fields (37, 37), Ivo at (43, 38) and Tessa at (44, 46). Equipment is at Your Home (40, 42). Choose Normal topic or Quest topic when speaking.</p>${c.localMapIds.includes(ACT1_MAP_ID)?actionButton('View village map','act1Map'):''}</section>`;
}
const act1LegacyQuests=showQuests;
showQuests=function(){
 act1LegacyQuests();$('modalContent').insertAdjacentHTML('beforeend',act1JournalHTML());
 if(!Object.prototype.hasOwnProperty.call(state,'act1'))$('act1Start').onclick=act1StartPreview;
 if(act1Campaign()?.localMapIds.includes(ACT1_MAP_ID))$('act1Map').onclick=act1ShowMap;
};
function act1MapKnows(x,y){return !!act1Campaign()?.localMapIds.includes(ACT1_MAP_ID)&&insideVillage(x,y)}
function act1ShowMap(){
 if(!act1Campaign()?.localMapIds.includes(ACT1_MAP_ID)||combat)return;
 // Dedicated settlement view: no atlas/fog/seen mutation and no outside terrain lookup.
 const places=landmarks.filter(p=>insideVillage(p.x,p.y));
 showModal(`<div class="eyebrow">VILLAGE MAP · PROLOGUE PREVIEW</div><h2>Your local Map Card</h2><p>Only the home village: x ${homeBounds.left}–${homeBounds.right}, y ${homeBounds.top}–${homeBounds.bottom}. Map knowledge does not count as exploration.</p><div role="img" aria-label="Village landmark map"><svg viewBox="0 0 460 460" style="width:100%;max-width:460px;background:#243f30" aria-hidden="true">${places.map(p=>{const x=(p.x-homeBounds.left+.5)*20,y=(p.y-homeBounds.top+.5)*20;return `<circle cx="${x}" cy="${y}" r="5" fill="#e8d49a"/><text x="${x+7}" y="${y}" fill="#fff" font-size="9">${escapeText(p.name)}</text>`}).join('')}</svg></div><ul>${places.map(p=>`<li>${escapeText(p.name)}: (${p.x}, ${p.y})</li>`).join('')}</ul><p>Beyond these bounds, use the explored atlas and your own travels.</p>`);
}
function act1Conversation(entity,topic='menu'){
 if(!act1Campaign())return;
 const menu=[{label:'Normal topic',run:()=>act1Conversation(entity,'normal')},{label:'Quest topic',run:()=>act1Conversation(entity,'quest')}];
 if(topic==='menu'){showSpeech(entity,'What would you like to talk about?',menu);return}
 if(topic==='normal'){showSpeech(entity,entity.text,menu);return}
 const c=act1Campaign(),E=Act1State.EVENTS;
 if(entity.id==='mara'){
  if(c.flags.accepted){showSpeech(entity,'Thank you for helping. Ask around the village and collect the equipment at your home. The road lead continues in a later preview update.',menu);return}
  showSpeech(entity,`${c.flags.declined?'You came back. ':''}My child is missing. Will you help me look? You remember your own lost son; his fate remains unknown.`,[
   {label:'I will help',run:()=>{if(act1Event(E.QUEST_ACCEPTED))act1Conversation(entity,'quest')}},
   {label:'Not yet',run:()=>{if(act1Event(E.QUEST_DECLINED))showSpeech(entity,'I understand. Come back when you are ready.',menu)}}]);return;
 }
 if(entity.id==='act1-ivo'){
  const owned=c.localMapIds.includes(ACT1_MAP_ID);
  showSpeech(entity,'This Map Card covers only our village. It does not explore the wider world for you.',[
   ...(owned?[{label:'View village map',run:act1ShowMap}]:[{label:'Take local Map Card',run:()=>{if(act1Event(E.LOCAL_MAP_COLLECTED))act1Conversation(entity,'quest')}}]),...menu]);return;
 }
 showSpeech(entity,'Your preview starts with Punch and Hand Block. Collect Pickaxe and Shield at your home. Quantity counts copies; level is separate. Legacy battles keep their current cards for now.',[
  {label:'Ask about preparations',run:()=>{if(act1Event(E.VILLAGE_INFORMATION))showSpeech(entity,'The village information is recorded. Collect your home equipment if you have not already. Main story encounters are not yet connected.',menu)}},...menu]);
}
const act1LegacyInteractLife=interactLife;
interactLife=function(){
 if(act1Campaign()){
  const entity=nearestLifeEntity();
  if(entity&&['mara','act1-ivo','act1-tessa'].includes(entity.id)){act1Conversation(entity);return true}
 }
 return act1LegacyInteractLife();
};
// Let the original home interaction render and bind Rest before appending equipment.
const act1LegacyInteract=interact;
interact=function(){
 const eligible=lifeMode==='play'&&!combat&&!$('modal').open&&!nearestLifeEntity()&&near?.id==='home'&&act1AtHome();
 act1LegacyInteract();
 const c=act1Campaign();if(!eligible||!c||!$('modal').open)return;
 $('modalContent').insertAdjacentHTML('beforeend',`<section><h3>Prologue equipment</h3>${c.flags.homeGear?'<p>Pickaxe and Shield already collected.</p>':actionButton('Collect Pickaxe and Shield','act1Gear')}</section>`);
 if(!c.flags.homeGear)$('act1Gear').onclick=()=>{if(!act1Event(Act1State.EVENTS.HOME_GEAR_COLLECTED))return;closeModal();notify('Pickaxe and Shield added to your prologue inventory.');showBinder()};
};
// game.js eagerly bound these functions before this adapter loaded.
$('touchInteract').onclick=()=>interact();
const act1LegacyBinder=showBinder;
showBinder=function(){
 act1LegacyBinder();const c=act1Campaign();
 if(!c){if(act1Unreadable())$('modalContent').insertAdjacentHTML('beforeend',act1JournalHTML());return}
 const q=Act1State.questCard(c);
 $('modalContent').insertAdjacentHTML('beforeend',`<section><h2>Prologue preview inventory</h2><p>Separate from the legacy battle tray. Quantity counts copies; level has no upgrade mechanic in this preview.</p><div class="card-grid">${Object.entries(c.inventory).map(([id,item])=>`<div class="play-card"><strong>${escapeText(ACT1_NAMES[id]||id)}</strong><small>Quantity ${item.quantity} · Level ${item.level}</small>${id===Act1State.CARDS.QUEST&&q?`<p>${escapeText(q.nextObjective)}</p>`:''}</div>`).join('')}</div></section>`);
};
$('binder').onclick=()=>showBinder();
const act1LegacyHydrateLife=hydrateLife;
hydrateLife=function(){act1LegacyHydrateLife();act1InstallResidents()};
const act1LegacyStartJourney=startJourney;
startJourney=function(){
 // A new character explicitly replaces this journey; changing landscapes does not.
 if(validCharacter({...draft,name:draft.name.trim()}))delete state.act1;
 act1LegacyStartJourney();
};
// Initial generation already happened in game.js; later generations use the hydration seam.
act1InstallResidents();
