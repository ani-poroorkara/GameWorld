'use strict';
// Full Act 1 is an explicit new journey. Preview and legacy worlds retain their adapters.
let campaignNewGame=false;
const campaignValidity=new WeakMap();
function fullAct1(){
 const campaign=state?.act1;
 if(!campaign||campaign.mode!=='campaign'||campaign.version!==Act1State.VERSION)return false;
 if(!campaignValidity.has(campaign)){try{Act1State.hydrateCampaign(campaign);campaignValidity.set(campaign,true)}catch{campaignValidity.set(campaign,false)}}
 return campaignValidity.get(campaign);
}
function campaignCard(id){return Act1Data.cards.find(c=>c.id===id&&c.status==='approved')}
function campaignQuantity(id){return state.act1.inventory[id]?.quantity||0}
function campaignGrant(id,quantity=1){if(!campaignCard(id)&&!Act1Data.quests.some(q=>q.id===id))throw new Error('Unapproved card '+id);const inventory=state.act1.inventory;inventory[id]??={quantity:0,level:1};inventory[id].quantity+=quantity}
function campaignClaim(id,rewards=[]){if(state.act1.claimedRewardIds.includes(id))return false;for(const r of rewards)campaignGrant(r.cardId,r.quantity);state.act1.claimedRewardIds.push(id);save();return true}
function campaignEvent(type,extra={}){state.act1=Act1State.applyEvent(state.act1,{type,...extra});save()}
function campaignInit(){const c=Act1State.createCampaign();Object.assign(c,{mode:'campaign',puzzles:{},sideQuests:{},pendingAnimal:null,animalChoices:{}});return c}
const campaignOldSingle=singlePlayerMenu;
singlePlayerMenu=function(){campaignNewGame=false;campaignOldSingle();$('opening').insertAdjacentHTML('beforeend','<div class="flow-panel narrow"><button class="primary" id="newAct1Campaign">New Act 1 campaign</button><p>Start a new character in the expanded world. Starting replaces the current browser journey.</p></div>');$('newAct1Campaign').onclick=()=>{campaignNewGame=true;draft={gender:'male',name:'Traveller',pillars:Object.fromEntries(PILLAR_INFO.map(([id])=>[id,1]))};characterScreen()}};
const campaignOldStart=startJourney;
startJourney=function(){if(!campaignNewGame){campaignOldStart();return}if(!validCharacter({...draft,name:draft.name.trim()}))return;state.act1=campaignInit();act1LegacyStartJourney();state.act1.mode='campaign';campaignNewGame=false;save();notify('A peaceful village. Speak with Mara near the fields to begin the search.')};
const campaignOldHome=goHome;
goHome=function(restore){if(!fullAct1()){campaignOldHome(restore);return}state.x=72;state.y=74;if(restore){state.hp=CFG.maxHP;state.mana=maxMana()}resetMotion();reveal();updateUI();save()};
const campaignOldHydrate=hydrateLife;
hydrateLife=function(){campaignOldHydrate();if(fullAct1()){state.act1.puzzles??={};state.act1.sideQuests??={};state.act1.animalChoices??={};state.hp=Math.min(CFG.maxHP,state.hp)}};
// Avoid installing preview residents over the canonical campaign coordinates.
const campaignOldResidents=act1InstallResidents;
act1InstallResidents=function(){if(!fullAct1())campaignOldResidents()};
const campaignOldCards=playerBattleCards;
playerBattleCards=function(){if(!fullAct1())return campaignOldCards();return Object.entries(state.act1.inventory).flatMap(([id,item])=>{const c=campaignCard(id);if(!c||item.quantity<=0||!['attack','block','heal','distraction'].includes(c.effect)||c.requiresCardId&&!campaignQuantity(c.requiresCardId)||id==='pet-distraction'&&!state.pet)return[];return [battleCard(id,c.name,c.effect==='block'?'defense':c.effect==='distraction'?'dodge':c.effect,c.levels[0].power,Math.min(c.perFightUses,c.effect==='heal'?item.quantity:Infinity),{diceAllowed:c.diceAllowed,quantity:item.quantity,level:item.level,consumable:false})]})};
const campaignOldEnemy=battleEnemy;
battleEnemy=function(type){if(!fullAct1())return campaignOldEnemy(type);const e=Act1Data.enemies.find(e=>e.id===type&&e.status==='approved');if(!e){if(combat?.practice)return campaignOldEnemy(type);throw new Error('No approved enemy definition for '+type)};return battleFighter(e.name,e.hp,0,[battleCard('strike',e.attackName||'Attack','attack',e.attack,12),battleCard('guard','Defense','defense',e.defense,5),...(type==='bear'?[battleCard('dodge','Dodge','dodge',BATTLE.dodgeChance,BATTLE.dodgeUses)]:[])])};
const campaignOldValid=battleValid;
battleValid=function(fighter,hand){if(!campaignOldValid(fighter,hand))return false;return hand.every(p=>{const card=fighter.cards.find(c=>c.id===p.id);return !(p.die&&card.diceAllowed===false)&&!(card.id==='bow'&&fullAct1()&&!(combat?.practice?combat.ammo>0:campaignQuantity('arrows')>0))})};
const campaignOldCombatStart=startCombat;
startCombat=function(place){if(fullAct1()&&!place.practice){if(!Act1Data.enemies.some(e=>e.id===place.enemyType&&e.status==='approved')){notify('This encounter is unavailable until its approved definition is restored.');return}const f=state.act1.flags;if(place.entityId==='act1-road-thief'&&!(f.accepted&&f.homeGear&&f.villageInformation)){notify('Speak to Mara and the villagers, then collect your home equipment before following this lead.');return}if(place.enemyType==='cave-monster'&&!f.caveRevealed){notify('Follow the lead from the road thief and inspect the cave first.');return}if(place.enemyType==='air-monster'&&!f.northernPassage){notify('Investigate the northern passage after the cave encounter.');return}if(state.act1.pendingAnimal){campaignAnimalChoice();return}}campaignOldCombatStart(place);if(fullAct1()){combat.ammo=campaignQuantity('arrows');renderCombat()}};
const campaignOldRender=renderCombat;
renderCombat=function(){campaignOldRender();if(!fullAct1()||!combat)return;const c=combat;document.querySelectorAll('[data-die]').forEach(b=>{const card=c.player.cards.find(c=>c.id===b.dataset.die);if(card?.diceAllowed===false){b.disabled=true;b.textContent='No dice on this card';b.onclick=null}});document.querySelectorAll('[data-pick]').forEach(b=>{const card=c.player.cards.find(c=>c.id===b.dataset.pick);if(!card)return;const quantity=card.id==='bow'?(c.practice?c.ammo:campaignQuantity('arrows')):c.practice?card.quantity:campaignQuantity(card.id);b.insertAdjacentHTML('beforeend',`<small class="campaign-quantity">Quantity ${quantity} / Level ${card.level}</small>`);if(card.id==='pet-distraction'){b.querySelector('.card-power').innerHTML='50% <small>one attack misses</small>';b.querySelector('.card-kind').textContent='COMPANION'}if(card.id==='bow'&&quantity<=0){b.disabled=true;b.onclick=null}})};
function campaignFocusToken(panel){
 const active=document.activeElement;if(!active||!panel.contains(active))return null;
 if(active.dataset?.pick)return {kind:'pick',value:active.dataset.pick,panel:panel.id};
 if(active.dataset?.die)return {kind:'die',value:active.dataset.die,panel:panel.id};
 return active.id?{kind:'id',value:active.id,panel:panel.id}:null;
}
function campaignRestoreFocus(token){
 if(!token)return;
 const panel=$(token.panel),target=token.kind==='id'?$(token.value):[...document.querySelectorAll('[data-'+token.kind+']')].find(button=>button.dataset[token.kind]===token.value&&panel.contains(button));
 if(target&&panel.contains(target)&&!target.disabled)target.focus();
}
const campaignRenderWithQuantities=renderCombat;
renderCombat=function(){const focused=fullAct1()?campaignFocusToken($('mapBattlePanel')):null;campaignRenderWithQuantities();campaignRestoreFocus(focused)};
const campaignOldCommit=commitBattleHand;
commitBattleHand=function(){const c=combat;if(!fullAct1()||!c){campaignOldCommit();return}if(c.phase!=='choose'||!battleValid(c.player,c.hand)){notify('Check card uses, arrows and allowed dice.');return}const used=c.hand.map(p=>p.id);campaignOldCommit();for(const id of used){if(['apple','steak'].includes(id)){if(!c.practice)state.act1.inventory[id].quantity--;else{const card=c.player.cards.find(c=>c.id===id);if(card)card.quantity--}} if(id==='bow'){c.ammo--;if(!c.practice)state.act1.inventory.arrows.quantity--}}if(!c.practice)save();campaignRefreshQuantities(c)};
function campaignRefreshQuantities(c){
 document.querySelectorAll('[data-pick]').forEach(button=>{
  const card=c.player.cards.find(card=>card.id===button.dataset.pick),badge=button.querySelector('.campaign-quantity');
  if(card&&badge){const quantity=card.id==='bow'?(c.practice?c.ammo:campaignQuantity('arrows')):c.practice?card.quantity:campaignQuantity(card.id);badge.textContent='Quantity '+quantity+' / Level '+card.level;}
 });
}
function campaignDrops(type){for(const d of Act1Data.drops.filter(d=>d.sourceType==='enemy'&&d.sourceId===type&&d.condition==='victory'&&d.status==='confirmed')){if(random()<d.chance)campaignGrant(d.cardId,d.min+Math.floor(random()*(d.max-d.min+1)))}}
const campaignOldFinish=finishMapEncounter;
finishMapEncounter=function(outcome){const c=combat;if(!fullAct1()||!c||c.practice){campaignOldFinish(outcome);return}const id=c.place.entityId,type=c.place.enemyType;if(outcome==='negotiated'){campaignOldFinish('escaped');notify('You part peacefully. This opponent remains; the search needs a real victory.');return}if(outcome==='victory'){if(['boar','bear'].includes(type))state.act1.pendingAnimal={id,type,name:c.enemy.name};else if(type==='thief')campaignDrops(type);const E=Act1State.EVENTS;if(id==='act1-road-thief')campaignEvent(E.ROAD_THIEF_DEFEATED);if(id==='act1-cave-monster')campaignEvent(E.CAVE_DEFEATED);if(id==='act1-air-monster'){campaignEvent(E.AIR_MONSTER_DEFEATED);campaignEvent(E.DILEMMA_PRESENTED)}}campaignOldFinish(outcome);if(outcome==='victory'&&state.act1.pendingAnimal)campaignAnimalChoice();else if(outcome==='victory'&&id==='act1-air-monster')campaignDilemma();else if(outcome==='victory'&&id==='act1-road-thief')notify('The thief saw a child near the old cave in the Cracked Lands (106,35).');else if(outcome==='victory'&&id==='act1-cave-monster')notify('The living cave falls. Stone Staff acquired. Search separate chests for Stone Throw and Stone Block.')};
function campaignAnimalChoice(){const p=state.act1.pendingAnimal;if(!p)return;showModal(`<h2>${escapeText(p.name)} is defeated.</h2><p>The animal can leave peacefully. Killing it gives exactly one Steak.</p>${actionButton('Spare the animal','spareAnimal')}${actionButton('Kill for one Steak','killAnimal','quiet')}`);$('spareAnimal').onclick=()=>campaignResolveAnimal(false);$('killAnimal').onclick=()=>campaignResolveAnimal(true)}
function campaignResolveAnimal(kill){const p=state.act1.pendingAnimal;if(!p)return;if(!state.act1.animalChoices[p.id]){state.act1.animalChoices[p.id]=kill?'killed':'spared';if(kill)campaignGrant('steak')}state.act1.pendingAnimal=null;closeModal();save()}
function campaignDilemma(){showModal('<div class="eyebrow">ACT 1 COMPLETE</div><h2>Two children. One demand.</h2><p>The air monster asks: &quot;Will you save your own missing child, or your neighbor&rsquo;s child?&quot;</p><p>You do not answer yet. The location and fate of both children remain unknown. Your decision continues in Act 2.</p><p>'+escapeText(campaignQuestCard()?.nextObjective||'')+'</p>')}
const campaignOldEnemyDialogue=enemyDialogue;
enemyDialogue=function(e){if(!fullAct1()){campaignOldEnemyDialogue(e);return}const c=state.act1;if(e.id==='act1-road-thief'&&!(c.flags.accepted&&c.flags.homeGear&&c.flags.villageInformation)){showSpeech(e,'You are not ready to follow this lead. Speak with Mara and the villagers, and collect your home equipment.');return}if(e.type==='cave-monster'&&!c.flags.caveRevealed){showSpeech(e,'The rock walls breathe. Inspect the old cave entrance to understand what waits here.');return}if(e.type==='air-monster'&&!c.flags.northernPassage){showSpeech(e,'The wind bars your way. Inspect the northern passage after defeating the living cave.');return}showSpeech(e,e.type==='thief'?'A child? Perhaps I saw something near the old cave. You must stand your ground to learn more.':e.type==='cave-monster'?'The cave walls shift. The entire cave is alive.':e.type==='air-monster'?'The wind gathers at the northern passage. A final opponent awaits.':'The animal prepares to defend itself.',[{label:'Fight',run:()=>fightEnemy(e)},{label:'Step away',run:dismissSpeech}])};
const campaignOldPet=keepPet;
keepPet=function(a,replace=false){const kept=campaignOldPet(a,replace);if(kept&&fullAct1()&&!campaignQuantity('pet-distraction')){campaignGrant('pet-distraction');save()}return kept};
const campaignOldAfter=afterTravel;
afterTravel=function(){if(!fullAct1()){campaignOldAfter();return}const side=state.act1.sideQuests;if(side['runaway-animal']?.stage==='escorting'){side['runaway-animal'].position={x:state.x,y:Math.min(CFG.size-2,state.y+1)};const animal=animals.find(a=>a.id==='act1-runaway');if(animal)Object.assign(animal,side['runaway-animal'].position);save()}};
const campaignOldTravelSpawn=spawnTravelEnemy;
spawnTravelEnemy=function(type){if(!fullAct1())return campaignOldTravelSpawn(type);const wanted=type==='robber'?'thief':type;if(wanted==='thief'&&tiles[idx(state.x,state.y)].type!=='path')return null;const e=campaignOldTravelSpawn(type);if(e?.type==='thief'&&tiles[idx(e.x,e.y)].type!=='path'){enemies=enemies.filter(v=>v!==e);return null}return e};
function campaignRegions(){return (Act1Data.regions||[]).filter(r=>r.status==='approved')}
function campaignBounds(region){const b=region.bounds||region;return {left:b.x1??b.left,right:b.x2??b.right,top:b.y1??b.top,bottom:b.y2??b.bottom}}
function campaignWithin(region,x,y){const b=campaignBounds(region);return x>=b.left&&x<=b.right&&y>=b.top&&y<=b.bottom}
function campaignMapId(x=state.x,y=state.y){return campaignRegions().find(r=>r.mapId&&campaignWithin(r,x,y))?.mapId||null}
const campaignOldMapKnows=act1MapKnows;
act1MapKnows=function(x,y){if(!fullAct1())return campaignOldMapKnows(x,y);const id=campaignMapId(x,y);return !!id&&state.act1.localMapIds.includes(id)};
const campaignOldShowMap=act1ShowMap;
act1ShowMap=function(mapId){
 if(!fullAct1()){campaignOldShowMap();return}
 const id=typeof mapId==='string'?mapId:campaignMapId(),region=campaignRegions().find(r=>r.mapId===id);
 if(!region||!state.act1.localMapIds.includes(id)||combat)return;
 const b=campaignBounds(region),places=landmarks.filter(p=>campaignWithin(region,p.x,p.y));
 showModal(`<h2>${escapeText(region.name)} Map Card</h2><p>Local bounds x ${b.left}-${b.right}, y ${b.top}-${b.bottom}. Map knowledge is separate from explored ground.</p><svg viewBox="0 0 480 480" style="max-width:480px;width:100%;background:#243f30" role="img" aria-label="Local settlement landmarks">${places.map(p=>`<circle cx="${(p.x-b.left+.5)*480/(b.right-b.left+1)}" cy="${(p.y-b.top+.5)*480/(b.bottom-b.top+1)}" r="5" fill="#edd799"/>`).join('')}</svg><ul>${places.map(p=>`<li>${escapeText(p.name)} (${p.x},${p.y})</li>`).join('')}</ul>`)
};
function campaignQuestCard(id='save-the-kid'){
 const definition=Act1Data.quests.find(q=>q.id===id&&q.status==='approved');
 if(!definition||!campaignQuantity(id))return null;
 const c=state.act1,side=c.sideQuests[id],main=id==='save-the-kid';
 const stageId=main?({preparing:'search-accepted',road:'road-lead',cave:'cave-victory','cave-battle':'cave-victory',north:'search-chests','air-battle':'air-victory',revelation:definition.terminalStageId||'dilemma',dilemma:definition.terminalStageId||'dilemma'}[c.stage]):side?.stage==='complete'?definition.terminalStageId:({irrigation:'water-flow',footpath:'path-open','runaway-animal':side?.stage==='escorting'?'animal-home':'animal-clues'}[id]);
 const stage=definition.stages.find(s=>s.id===stageId)||definition.stages[0];
 let nextObjective=stage.text;
 if(!main&&side){
  const where=siteId=>{const p=landmarks.find(p=>p.id===siteId);return p?' ('+p.x+','+p.y+')':''};
  if(side.stage==='complete')nextObjective='Complete: '+definition.name+'.';
  else if(id==='runaway-animal'){
   const clues=side.clues||[];
   nextObjective+=' '+(side.stage==='escorting'?'Bring the animal to its pen'+where('animal-pen')+'.':clues.length>=2?'Approach the runaway animal'+where('runaway-animal')+'.':clues.length===1?'Follow the next tracks'+where('animal-clue-2')+'.':'Find the first tracks'+where('animal-clue-1')+'.');
  }else if(id==='footpath')nextObjective+=' '+(campaignQuantity('pickaxe')?'Clear the blocked footpath'+where('blocked-footpath')+'.':'Collect the Pickaxe at home'+where('home')+'.');
 }
 return {id,name:definition.name,quantity:campaignQuantity(id),level:c.inventory[id].level,stageId:stage.id,status:main?c.status:side?.stage,nextObjective};
}
function campaignTopicText(entity,topic){
 const authored=Act1Data.npcs.find(n=>n.id===entity.id&&n.status==='approved');
 const topics=authored?.topics||[];
 if(topic==='normal')return topics.filter(t=>['normal','other'].includes(t.id)).map(t=>t.text).join(' ')||authored?.topics[0]?.text||entity.text||'';
 return topics.filter(t=>!['normal','other'].includes(t.id)).map(t=>t.text).join(' ')||entity.text||'';
}
function campaignConversation(entity,topic='menu'){
 const e={...entity,...Act1Data.npcs.find(n=>n.id===entity.id&&n.status==='approved')};
 const menu=[{label:'Normal topic',run:()=>campaignConversation(e,'normal')},{label:'Quest topic',run:()=>campaignConversation(e,'quest')}];
 if(topic==='menu'){showSpeech(e,'What would you like to discuss?',menu);return}
 if(topic==='normal'){showSpeech(e,campaignTopicText(e,'normal'),menu);return}
 const c=state.act1,E=Act1State.EVENTS;
 if(e.id==='mara'){
  if(!c.flags.accepted){showSpeech(e,campaignTopicText(e,'quest')+' Your own son was lost long ago; his fate is still unknown.',[{label:'I will help',run:()=>{campaignEvent(E.QUEST_ACCEPTED);campaignConversation(e,'quest')}},{label:'Not yet',run:()=>{campaignEvent(E.QUEST_DECLINED);showSpeech(e,'Come back whenever you are ready.',menu)}}]);return}
  showSpeech(e,campaignQuestCard()?.nextObjective||campaignTopicText(e,'quest'),menu);return;
 }
 if(e.role==='map-giver'){
  const id=e.mapId;
  if(!id||!campaignRegions().some(r=>r.mapId===id)){showSpeech(e,campaignTopicText(e,'quest'),menu);return}
  showSpeech(e,campaignTopicText(e,'quest')+' A local Map Card covers this settlement only; map knowledge does not explore terrain.',[{label:c.localMapIds.includes(id)?'View local map':'Take local Map Card',run:()=>{if(!c.localMapIds.includes(id))campaignEvent(E.LOCAL_MAP_COLLECTED,{mapId:id});else act1ShowMap(id);campaignConversation(e,'quest')}},...menu]);return;
 }
 campaignEvent(E.VILLAGE_INFORMATION);
 const actions=[...menu];
 if(e.id==='nell')actions.unshift({label:'Help with irrigation',run:()=>campaignAcceptSide('irrigation')},{label:'Find the runaway animal',run:()=>campaignAcceptSide('runaway-animal')});
 showSpeech(e,campaignTopicText(e,'quest'),actions);
}
function campaignAcceptSide(id){state.act1.sideQuests[id]??={stage:id==='irrigation'&&state.act1.puzzles?.['farmers-channels']?.solved?'complete':'accepted',clues:[]};if(!campaignQuantity(id))campaignGrant(id);save();showSpeech(villagers.find(v=>v.id==='nell'),'Thank you. '+(id==='runaway-animal'?'Find tracks at (61,65), then follow the clues to the animal. Bring it to the pen at (64,71).':'The channels at (77,65) need water. Read the clues and rotate the junctions.'))}
function campaignPuzzle(id,action){const config=Act1Data.puzzles.find(p=>p.id===id&&p.status==='approved');if(!config||!campaignRequirements(config.requires)){notify('This mechanism is not ready yet. Follow its clues and return later.');return}const def=Act1Puzzles.getDefinition(id,Act1Data.puzzles);if(!def)return;const focused=campaignFocusToken($('modalContent'));const c=state.act1;c.puzzles??={};let current=c.puzzles[id]||Act1Puzzles.initial(id,Act1Data.puzzles);let feedback='';if(action){const result=Act1Puzzles.act(id,current,action,Act1Data.puzzles);current=result.state;feedback=result.feedback;if(result.solved){const reward=config.rewards;campaignClaim('puzzle:'+id,reward);if(c.sideQuests[id==='farmers-channels'?'irrigation':id])c.sideQuests[id==='farmers-channels'?'irrigation':id].stage='complete'}}c.puzzles[id]=current;save();showModal(`<div class="eyebrow">WORLD PUZZLE / UNLIMITED RETRIES</div><h2>${escapeText(def.name||id)}</h2><p>${escapeText(def.instructions||'')}</p><p>${escapeText(def.hint||'')}</p><div class="campaign-puzzle-state" aria-live="polite">${current.dials?current.dials.map((n,i)=>`<div><small>${['Left','Middle','Right'][i]}</small><b>${n}</b></div>`).join(''):`<p>${current.solved?'Solved':`Steps followed: ${current.progress||0}`}</p>`}</div><p role="status">${escapeText(feedback)}</p>${def.actions.map((a,i)=>actionButton(escapeText(a.label),'puzzleAction'+i,'quiet')).join('')}`);def.actions.forEach((a,i)=>$('puzzleAction'+i).onclick=()=>campaignPuzzle(id,a.action));campaignRestoreFocus(focused)}
function campaignRequirements(list=[]){
 const c=state.act1,f=c.flags,side=c.sideQuests||{},claimed=c.claimedRewardIds;
 const milestones={
  'search-accepted':f.accepted,'road-lead':f.roadLead,'cave-victory':f.caveDefeated,
  'search-chests':claimed.includes('chest-stone-throw')||claimed.includes('chest-stone-block')||f.northernPassage,
  'air-victory':f.airMonsterDefeated,dilemma:f.dilemmaPresented,
  'animal-clues':(side['runaway-animal']?.clues?.length||0)>=2,
  'animal-home':side['runaway-animal']?.stage==='complete',
  'water-flow':claimed.includes('puzzle:farmers-channels')||c.puzzles?.['farmers-channels']?.solved===true,
  'path-open':side.footpath?.stage==='complete'
 };
 function achieved(id,visiting=new Set()){
  if(Object.prototype.hasOwnProperty.call(milestones,id))return !!milestones[id];
  const terminalQuest=Act1Data.quests.find(q=>q.status==='approved'&&q.terminalStageId===id);
  if(terminalQuest)return terminalQuest.id==='save-the-kid'?f.dilemmaPresented:side[terminalQuest.id]?.stage==='complete';
  if(f[id]===true||c.completedEvents.includes(id)||claimed.includes(id)||campaignQuantity(id)>0||c.puzzles?.[id]?.solved===true||(c.completedQuestStageIds||[]).includes(id))return true;
  const quest=Act1Data.quests.find(q=>q.status==='approved'&&q.stages.some(stage=>stage.id===id));
  if(!quest||visiting.has(id))return false;
  const accepted=quest.id==='save-the-kid'?f.accepted:campaignQuantity(quest.id)>0||!!side[quest.id];
  if(!accepted)return false;
  const stage=quest.stages.find(stage=>stage.id===id);visiting.add(id);
  const complete=stage.requires.every(requirement=>achieved(requirement,visiting));visiting.delete(id);return complete;
 }
 return list.every(id=>achieved(id));
}
function campaignChest(p){const def=Act1Data.chests.find(c=>c.id===p.id);if(!def)return;if(!campaignRequirements(def.requires)){notify('Return after the living cave encounter.');return}const E=Act1State.EVENTS;if(p.id==='chest-stone-block'&&!state.act1.flags.caveDefeated){notify('The living cave must fall first.');return}if(['chest-stone-throw','chest-stone-block'].includes(p.id)){const claimed=state.act1.claimedRewardIds.includes(p.id);campaignEvent(p.id==='chest-stone-throw'?E.THROW_CHEST_CLAIMED:E.BLOCK_CHEST_CLAIMED);if(!claimed){const canonical=p.id==='chest-stone-throw'?'stone-throw':'stone-block';for(const reward of def.rewards){const extra=reward.quantity-(reward.cardId===canonical?1:0);if(extra>0)campaignGrant(reward.cardId,extra)}save()}}else campaignClaim(p.id,def.rewards);showModal(`<h2>${escapeText(p.name)}</h2><p>Chest searched. Its cards are recorded once in your Bustagam.</p><p>${def.rewards.map(r=>escapeText(campaignCard(r.cardId)?.name||r.cardId)+'  '+r.quantity).join(', ')}</p><p>Quantity tracks copies. Level is separate; no combining recipe is available.</p>`)}
function campaignHome(){showModal(`<h2>Your home</h2><p>A warm place to rest, and your equipment chest.</p>${actionButton('Rest by the fire','campaignRest')}${state.act1.flags.homeGear?'<p>Pickaxe and Shield collected.</p>':actionButton('Collect Pickaxe and Shield','campaignGear')}`);$('campaignRest').onclick=()=>{state.hp=CFG.maxHP;state.mana=maxMana();closeModal();updateUI()};if(!state.act1.flags.homeGear)$('campaignGear').onclick=()=>{campaignEvent(Act1State.EVENTS.HOME_GEAR_COLLECTED);campaignHome()}}
function campaignSideSite(p){const c=state.act1,side=c.sideQuests['runaway-animal'];if(p.id.startsWith('animal-clue-')){if(!side){notify('Ask Nell about the runaway animal.');return}const n=p.id==='animal-clue-1'?1:2;if(n===2&&!side.clues.includes('animal-clue-1')){notify('First find the tracks at (61,65).');return}if(!side.clues.includes(p.id))side.clues.push(p.id);save();showModal(`<h2>Animal tracks</h2><p>${n===1?'Hoofprints bend northwest toward (54,62).':'Fresh prints lead west to (49,62). A frightened farm animal waits there.'}</p>`);return}if(p.id==='runaway-animal'){if(side?.stage==='complete'){notify('The runaway is safely home.');return}if(!side||side.clues.length<2){notify('Follow the two sets of tracks before approaching.');return}side.stage='escorting';save();showModal('<h2>A familiar animal</h2><p>It follows you now. Walk back to the home pen at (64,71), then interact there.</p>');return}if(p.id==='animal-pen'){if(side?.stage!=='escorting'){notify('The pen waits for the runaway animal.');return}side.stage='complete';const animal=animals.find(a=>a.id==='act1-runaway');if(animal)Object.assign(animal,{x:p.x,y:p.y});campaignClaim('quest:runaway-animal',[{cardId:'apple',quantity:3}]);save();showModal('<h2>Safely home</h2><p>The animal settles in its pen. Nell gives you three Apples.</p>');return}if(p.id==='blocked-footpath'){if(!campaignQuantity('footpath')){state.act1.sideQuests['footpath']={stage:'accepted'};campaignGrant('footpath')}if(!campaignQuantity('pickaxe')){save();notify('Your Pickaxe from home can clear these stones.');return}campaignClaim('quest:blocked-footpath',[{cardId:'apple',quantity:2}]);state.act1.sideQuests['footpath'].stage='complete';for(let x=p.x-3;x<=p.x+3;x++)tiles[idx(x,p.y)]={type:'path',v:0};save();showModal('<h2>A path reopened</h2><p>Your Pickaxe clears a short route through the stones. Two Apples were tucked beside the old trail.</p>')}}
const campaignOldInteract=interact;
interact=function(){if(!fullAct1()){campaignOldInteract();return}if(lifeMode!=='play'||combat||$('modal').open)return;if(state.act1.pendingAnimal){campaignAnimalChoice();return}const closestSite=landmarks.filter(p=>distance(state,p)<=2).sort((a,b)=>distance(state,a)-distance(state,b))[0];const e=nearestLifeEntity();if(e&&!e.species&&(!closestSite||distance(state,e)<=distance(state,closestSite))){campaignConversation(e);return}if(e?.species&&e.id!=='act1-runaway'&&(!closestSite||distance(state,e)<distance(state,closestSite))){animalDialog(e);return}const hostileFirst=nearbyEnemy();if(hostileFirst&&((!['cave-monster','air-monster'].includes(hostileFirst.type))||(hostileFirst.type==='cave-monster'&&state.act1.flags.caveRevealed)||(hostileFirst.type==='air-monster'&&state.act1.flags.northernPassage))){enemyDialogue(hostileFirst);return}const p=landmarks.filter(p=>distance(state,p)<=2).sort((a,b)=>distance(state,a)-distance(state,b))[0];if(p){if(p.id==='home'){campaignHome();return}if(p.kind==='puzzle'||Act1Data.puzzles.some(d=>d.id===p.id)){campaignPuzzle(p.id);return}if(p.kind==='chest'){campaignChest(p);return}if(['animal-clue-1','animal-clue-2','runaway-animal','animal-pen','blocked-footpath'].includes(p.id)){campaignSideSite(p);return}if(p.id==='act1-cave'){if(!state.act1.flags.roadLead){showModal('<h2>The forbidden cave</h2><p>Find a lead from the road thief before investigating this place.</p>');return}campaignEvent(Act1State.EVENTS.CAVE_REVEALED);showModal('<h2>The cave is alive</h2><p>The walls breathe. A living cave monster guards the way. Approach it at (106,36) and fight.</p>');return}if(p.id==='act1-north'||p.id==='passage-1'){if(state.act1.flags.dilemmaPresented){campaignDilemma();return}if(!state.act1.flags.caveDefeated){showModal('<h2>The northern passage</h2><p>Follow the cave lead before confronting the wind.</p>');return}campaignEvent(Act1State.EVENTS.NORTHERN_PASSAGE_REACHED);showModal('<h2>The northern passage</h2><p>An air monster waits at (72,9). Defeat it to hear its demand.</p>');return}if(p.kind==='passage'){showModal('<h2>A road to another act</h2><p>This mountain passage continues beyond the current journey. It is a route, not a teleport.</p>');return}if(p.kind==='farm'){showModal(`<h2>Your farm</h2><p>Apples restore 5 HP and can be used in combat.</p>${actionButton('Gather two Apples','campaignHarvest')}`);$('campaignHarvest').disabled=state.steps<(state.act1.nextHarvest||0);$('campaignHarvest').onclick=()=>{if(state.steps<(state.act1.nextHarvest||0))return;campaignGrant('apple',2);state.act1.nextHarvest=state.steps+60;closeModal()};return}if(p.kind==='shop'||p.id==='town'){campaignShop(p);return}}const hostile=nearbyEnemy();if(hostile){enemyDialogue(hostile);return}if(e?.species){animalDialog(e);return}if(p){showModal(`<h2>${escapeText(p.name)}</h2><p>${escapeText(p.desc||'A quiet place on your travels.')}</p>`);return}};
function campaignShop(p){showModal(`<h2>${escapeText(p.name)}</h2><p>${state.gold} gold. Supplies are cards in your Bustagam.</p>${actionButton('Apple   3 gold','buyApple')}${actionButton('Steak   8 gold','buySteak','quiet')}`);for(const [id,price,button]of[['apple',3,'buyApple'],['steak',8,'buySteak']]){$(button).disabled=state.gold<price;$(button).onclick=()=>{if(state.gold<price)return;state.gold-=price;campaignGrant(id);save();campaignShop(p)}}}
const campaignOldBinder=showBinder;
showBinder=function(){if(!fullAct1()){campaignOldBinder();return}showModal(`<h2>Your Bustagam</h2><p>Quantity counts copies. Level is separate. Equipment uses reset each fight; food and ammunition are consumed.</p><div class="card-grid">${Object.entries(state.act1.inventory).map(([id,item])=>`<div class="play-card"><strong>${escapeText(campaignCard(id)?.name||Act1Data.quests.find(q=>q.id===id)?.name||id)}</strong><small>Quantity ${item.quantity}   Level ${item.level}</small>${id==='save-the-kid'?`<p>${escapeText(campaignQuestCard().nextObjective)}</p>`:''}${state.act1.sideQuests[id]?`<p>${escapeText(campaignQuestCard(id)?.nextObjective||state.act1.sideQuests[id].stage)}</p>`:''}</div>`).join('')}</div>`)};
const campaignOldSatchel=openSatchel;
openSatchel=function(){if(!fullAct1()){campaignOldSatchel();return}showModal(`<h2>Food & companion</h2><p>${state.hp} / ${CFG.maxHP} HP   ${state.gold} gold</p>${['apple','steak'].map(id=>`<p>${campaignCard(id).name}   Quantity ${campaignQuantity(id)}   Heals ${campaignCard(id).levels[0].power}</p>${actionButton('Eat '+campaignCard(id).name,'eat'+id,'quiet')}`).join('')}<p>${state.pet?'Companion: '+escapeText(state.pet.name)+'   Pet Distraction once per fight.':'Choose a companion by greeting an animal.'}</p>`);for(const id of ['apple','steak']){$('eat'+id).disabled=!campaignQuantity(id)||state.hp>=CFG.maxHP;$('eat'+id).onclick=()=>{if(!campaignQuantity(id)||state.hp>=CFG.maxHP)return;state.act1.inventory[id].quantity--;state.hp=Math.min(CFG.maxHP,state.hp+campaignCard(id).levels[0].power);save();updateUI();openSatchel()}}};
const campaignOldQuests=showQuests;
showQuests=function(){if(!fullAct1()){campaignOldQuests();return}const q=campaignQuestCard();showModal(`<h2>${escapeText(q?.name||'Act 1 / The search')}</h2><p>${escapeText(q?.nextObjective||'Speak to Mara near the fields (69,67). You may decline and return later.')}</p><p>Home (72,72)   Road thief (88,55)   Cave (106,35)   Northern passage (72,7)</p><h3>Side quest cards</h3>${Object.entries(state.act1.sideQuests).map(([id,s])=>`<p>${escapeText(campaignQuestCard(id)?.name||id)}: ${escapeText(campaignQuestCard(id)?.nextObjective||s.stage)} (${escapeText(s.stage)})</p>`).join('')}${state.act1.localMapIds.map((id,i)=>actionButton('View '+id+' map','campaignMap'+i,'quiet')).join('')}`);state.act1.localMapIds.forEach((id,i)=>$('campaignMap'+i).onclick=()=>act1ShowMap(id))};
$('binder').onclick=()=>showBinder();$('satchel').onclick=()=>openSatchel();$('questButton').onclick=()=>showQuests();$('touchInteract').onclick=()=>interact();
if(fullAct1()){hydrateLife();const escort=state.act1.sideQuests?.['runaway-animal'];const animal=animals.find(a=>a.id==='act1-runaway');if(animal&&escort?.position)Object.assign(animal,escort.stage==='complete'?{x:64,y:71}:escort.position);if(state.act1.sideQuests?.['footpath']?.stage==='complete'){const p=landmarks.find(p=>p.id==='blocked-footpath');for(let x=p.x-3;x<=p.x+3;x++)tiles[idx(x,p.y)]={type:'path',v:0}}save()}

const campaignOldUI=updateUI;
updateUI=function(){campaignOldUI();if(!fullAct1())return;$('cardCount').textContent=Object.values(state.act1.inventory).filter(i=>i.quantity>0).length+' cards';near=landmarks.filter(p=>distance(state,p)<=2).sort((a,b)=>distance(state,a)-distance(state,b))[0]||null;const entity=nearestLifeEntity();const target=entity&&(!near||distance(state,entity)<=distance(state,near))?entity:near;if(target){$('prompt').hidden=atlas;$('prompt').querySelector('span').textContent='Interact with '+target.name;$('locationName').textContent=target.name}};
const campaignOldSafe=isSafe;
isSafe=function(x,y){return fullAct1()?campaignRegions().some(r=>(r.safe===true||['village','town'].includes(r.kind))&&campaignWithin(r,x,y)):campaignOldSafe(x,y)};
const campaignOldTile=drawLifeTile;
drawLifeTile=function(tile,x,y,t,tx,ty){campaignOldTile(tile,x,y,t,tx,ty);if(fullAct1()&&tile.region==='cracked'&&['grass','clearing','sand'].includes(tile.type)){rect(x+t*.2,y+t*.1,t*.05,t*.35,'#695b43');rect(x+t*.2,y+t*.42,t*.36,t*.05,'#695b43');rect(x+t*.52,y+t*.44,t*.05,t*.25,'#695b43');rect(x+t*.55,y+t*.67,t*.25,t*.05,'#695b43')}};
if(fullAct1())updateUI();
