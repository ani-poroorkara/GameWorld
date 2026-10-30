// Headless logic checks only; this does not replace visual browser verification.
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const elements=new Map(),storage=new Map();
let clock=1000;const motionPreference={matches:false},windowEvents=new Map();
const paint=new Proxy({measureText:s=>({width:s.length*6}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{}});
function element(id){if(!elements.has(id))elements.set(id,{value:id==='climate'?'woodland':'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},getContext:()=>paint,getBoundingClientRect:()=>({width:1000,height:520,left:0,top:0}),querySelector:()=>element(id+'child'),querySelectorAll:()=>[],addEventListener(){},focus(){},showModal(){this.open=true},close(){this.open=false},open:false});return elements.get(id)}
const context=vm.createContext({console,Set,Map,Math,Date,JSON,Number,document:{body:element('body'),documentElement:{style:{setProperty(){}}},getElementById:element,querySelectorAll:()=>[],addEventListener(){}},window:{devicePixelRatio:1,matchMedia:()=>motionPreference,addEventListener:(event,fn)=>{if(!windowEvents.has(event))windowEvents.set(event,[]);windowEvents.get(event).push(fn)}},localStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)||null},performance:{now:()=>clock},setTimeout:()=>0,clearTimeout(){},requestAnimationFrame(){}});
vm.runInContext(fs.readFileSync(__dirname+'/world-life.js','utf8'),context);
vm.runInContext(fs.readFileSync(__dirname+'/encounters.js','utf8'),context);
vm.runInContext(fs.readFileSync(__dirname+'/game.js','utf8'),context);
vm.runInContext(fs.readFileSync(__dirname+'/combat-engine.js','utf8'),context);
vm.runInContext(fs.readFileSync(__dirname+'/combat-scene.js','utf8'),context);
vm.runInContext(fs.readFileSync(__dirname+'/guided-scene.js','utf8'),context);
vm.runInContext(fs.readFileSync(__dirname+'/combat.js','utf8'),context);
vm.runInContext(fs.readFileSync(__dirname+'/pixel-sprites.js','utf8'),context);
vm.runInContext(fs.readFileSync(__dirname+'/map-effects.js','utf8'),context);
vm.runInContext(fs.readFileSync(__dirname+'/map-combat.js','utf8'),context);
const run=code=>vm.runInContext(code,context);
run("lifeMode='play'");
function reachable(){return run(`(()=>{const q=[{x:40,y:44}],seen=new Set([idx(40,44)]);for(let i=0;i<q.length;i++){const p=q[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){let x=p.x+dx,y=p.y+dy;if(x<1||y<1||x>=CFG.size-1||y>=CFG.size-1)continue;let id=idx(x,y);if(seen.has(id)||['water','tree','mountain'].includes(tiles[id].type))continue;seen.add(id);q.push({x,y})}}return landmarks.every(p=>seen.has(idx(p.x,p.y)))})()`)}
for(let i=0;i<100;i++){run(`generate('CHECK-${i}', '${['woodland','autumn','frost'][i%3]}')`);assert(reachable(),'Disconnected landmark for seed '+i)}
run("generate('ASHWOOD-724','woodland')");const terrain=run('JSON.stringify(tiles)');run("generate('ASHWOOD-724','woodland')");assert.equal(run('JSON.stringify(tiles)'),terrain,'Same seed must reproduce terrain');run("generate('OTHER-SEED','woodland')");assert.notEqual(run('JSON.stringify(tiles)'),terrain,'Different seeds must change terrain');
run("generate('ASHWOOD-724','woodland'); draw(); showBinder(); closeModal(); toggleAtlas(); draw(); toggleAtlas()");
assert.equal(run('state.hp'),60);run('interact(); $("doRest").onclick()');assert.equal(run('state.mana'),20);
for(let i=1;i<=3;i++){
 run(`state.x=landmarks.find(p=>p.id==='ruin${i}').x; state.y=landmarks.find(p=>p.id==='ruin${i}').y; state.hp=60;state.mana=20;reveal();updateUI();fightEnemy(enemies.find(e=>e.id==='guardian-ruin${i}'))`);
 for(let turn=0;turn<8&&run('combat!==null');turn++)run("combat.hand=combat.player.cards.filter(c=>c.uses>0&&(c.mana===0||combat.player.mana>=5)).map(c=>({id:c.id,die:false}));commitBattleHand();nextBattleRound()");
 assert.equal(run(`state.relics.includes('ruin${i}')`),true,'Relic encounter must be winnable');run('closeModal()');
}
run("state.x=landmarks.find(p=>p.id==='rift').x;state.y=landmarks.find(p=>p.id==='rift').y;reveal();updateUI();interact()");assert.equal(run('state.won'),true,'Campaign must finish');run('closeModal();save()');const saved=run('JSON.stringify({...state,seen:[...state.seen]})');run(`generate('ASHWOOD-724','woodland',JSON.parse(${JSON.stringify(saved)}))`);assert.equal(run('state.relics.length'),3);assert.equal(run('state.won'),true);
run("generate('DEATH-CHECK','frost');startCombat(landmarks.find(p=>p.kind==='ruin'));state.hp=0;finishTurn()");assert.equal(run('state.vaults'),0);assert.equal(run('state.hp'),60);assert.equal(run('state.x'),40);
run("closeModal();generate('ASHWOOD-724','woodland');move(0,-1)");
assert.equal(run('state.y'),43);assert.equal(run('motion.y'),44,'Visual position starts at previous tile');
clock+=55;run('sampleMotion(performance.now())');assert.equal(run('motion.y'),43.5,'Position interpolates halfway through a step');
clock+=55;run('sampleMotion(performance.now())');assert.equal(run('motion.y'),43,'Position reaches destination');
motionPreference.matches=true;run('move(0,-1);sampleMotion(performance.now())');assert.equal(run('motion.y'),42,'Reduced motion skips interpolation');assert.equal(run('animationTime()'),0,'Reduced motion stops ambient animation');
motionPreference.matches=false;run('goHome(false)');assert.equal(run('motion.cameraY'),44,'Returning home resets camera immediately');
run('for(const p of landmarks){state.x=p.x;state.y=p.y;resetMotion();reveal();draw()}');
// Opening, character rules, and the real creation handler.
run('bootGame()');assert.equal(run('lifeMode'),'menu');assert(element('opening').innerHTML.includes('Multiplayer'));assert(element('opening').innerHTML.includes('Create a Campaign'));
run('singlePlayerMenu();characterScreen()');assert.equal(run('allocationRemaining()'),8);assert.equal(element('startJourney').disabled,true);
run('$("balancedBuild").onclick();draft.gender="female";draft.name="Rowan"');assert.equal(run('validCharacter(draft)'),true);assert.equal(run('allocationRemaining()'),0);
run('draft.pillars.might=7');assert.equal(run('validCharacter(draft)'),false);run('$("balancedBuild").onclick()');
element('startSeed').value='VILLAGE-CHECK';element('startClimate').value='woodland';run('startJourney()');assert.equal(run('lifeMode'),'play');assert.equal(run('state.character.gender'),'female');assert.equal(run('state.character.name'),'Rowan');assert.equal(run('state.hasCharacter'),true);assert.equal(run('state.x'),40);assert.equal(run('state.y'),44);assert.equal(run('state.hp'),run('CFG.maxHP'));assert.equal(run('state.pet'),null);
assert.equal(run('villagers.length>=6'),true);assert.equal(run('animals.length>=8'),true);assert.equal(run('landmarks.filter(p=>p.kind==="shop").length'),2);
for(let y=31;y<=53;y++)for(let x=29;x<=51;x++)assert.equal(run(`encounterTypeAt(${x},${y},0)`),null,'Village must be safe even with the riskiest roll');
run('tiles[idx(5,5)]={type:"path",v:0}');assert.equal(run('encounterTypeAt(5,5,0)'),'robber');assert.equal(run('encounterTypeAt(5,5,.1)'),null);run('tiles[idx(5,5)]={type:"grass",v:0}');assert.equal(run('encounterTypeAt(5,5,.1)'),'wildlife');
// Buying and eating must preserve money and inventory invariants.
const gold=run('state.gold');assert.equal(run('buyGood("bread")'),true);assert.equal(run('state.gold'),gold-6);assert.equal(run('state.food.bread'),3);
assert.equal(run('eatFood("bread")'),false);assert.equal(run('state.food.bread'),3);run('state.hp=30');assert.equal(run('eatFood("bread")'),true);assert.equal(run('state.hp'),45);assert.equal(run('state.food.bread'),2);
assert.equal(run('buyGood("fire")'),true);assert.equal(run('buyGood("fire")'),false);run('state.gold=0');assert.equal(run('buyGood("stew")'),false);assert.equal(run('state.gold'),0);
run('state.hp=CFG.maxHP;state.mana=maxMana();startCombat({id:"test-road",name:"Road",enemy:"Road Robber",encounter:true})');assert(element('mapBattlePanel').innerHTML.includes('Ember Spark'));run('combat.hand=[{id:"fire",die:false}];commitBattleHand()');assert.equal(run('state.mana'),run('maxMana()-4'));run('victory("clear");closeModal()');assert.equal(run('state.relics.length'),0);assert.equal(run('state.gold'),12);
// A pet replacement is explicit, and a save restores exactly one companion.
assert.equal(run('keepPet(animals.find(a=>a.species==="dog"))'),true);assert.equal(run('keepPet(animals.find(a=>a.species==="fox"))'),false);assert.equal(run('state.pet.species'),'dog');assert.equal(run('keepPet(animals.find(a=>a.species==="fox"),true)'),true);
run('save()');const lifeSave=run('JSON.stringify({...state,seen:[...state.seen]})');run(`generate('VILLAGE-CHECK','woodland',JSON.parse(${JSON.stringify(lifeSave)}))`);assert.equal(run('state.pet.species'),'fox');assert.equal(run('state.character.gender'),'female');assert.equal(run('state.ownedCards.includes("fire")'),true);
run('generate("ANOTHER-LANDSCAPE","autumn")');assert.equal(run('state.pet.species'),'fox');assert.equal(run('state.character.name'),'Rowan');
// Menus and dialogs pause time; active exploration advances it.
run('lifeMode="play";lastClockFrame=1000;state.clock=.32;advanceClock(2000)');assert(run('state.clock')>.32);const day=run('state.clock');run('lifeMode="menu";advanceClock(3000)');assert.equal(run('state.clock'),day);run('lifeMode="play";showModal("Paused");advanceClock(4000)');assert.equal(run('state.clock'),day);run('closeModal();state.clock=.9;goHome(false);draw()');
run('settingsScreen("play");$("dayLength").value="4";$("textScale").value="115";$("ambientVolume").value="15";$("lessMotion").checked=true;$("saveSettings").onclick()');assert.equal(run('preferences.reduceMotion'),true);assert.equal(run('preferences.dayMinutes'),4);assert(storage.has('myworld-settings-v1'));assert.equal(run('animationTime()'),0);
run('$("settingsBack").onclick();mainMenu()');

// Full-screen presentation and character dialogue stay within the world.
const html=fs.readFileSync(__dirname+'/index.html','utf8');
for(const removed of ['helpButton','randomSeed','id="generate"','class="sidebar"','questList','journal-strip'])assert(!html.includes(removed),'Removed UI must be absent: '+removed);
assert(html.includes('id="questButton"'));assert(html.includes('id="atlasInfo" class="atlas-info" hidden'));
run('lifeMode="play";closeModal();goHome(false);state.x=37;state.y=37;updateUI();interact()');
assert.equal(element('modal').open,false,'NPC speech must not open a blocking dialog');assert.equal(run('speech.entity.id'),'mara');assert(element('speechBubble').innerHTML.includes('This farm is yours'));assert(!element('speechBubble').innerHTML.includes('Close dialog'));assert.equal(element('speechBubble').hidden,false);
run('positionSpeech(1000,520,0,0,32)');assert.equal(element('speechBubble').hidden,false);
run('state.x=40;state.y=44;positionSpeech(1000,520,0,0,32)');assert.equal(run('speech'),null,'Walking away ends the conversation');
run('state.x=42;state.y=43;updateUI();interact()');assert.equal(element('modal').open,false,'Animal conversation must stay over its head');assert.equal(run('speech.entity.id'),'dog1');assert(element('speechBubble').innerHTML.includes('Pet Bramble'));
run('toggleAtlas()');assert.equal(element('atlasInfo').hidden,false);assert.equal(run('speech'),null);run('toggleAtlas()');assert.equal(element('atlasInfo').hidden,true);
run('showQuests()');assert.equal(element('modal').open,true);assert(element('modalContent').innerHTML.includes('The sleeping gate'));run('closeModal();mainMenu()');
// Opponents exist as world entities and only living ones remain after a win.
run('closeModal();generate("ENEMY-CHECK","woodland");lifeMode="play"');
assert.equal(run('enemies.filter(e=>e.type==="guardian").length'),3);assert(run('enemies.some(e=>e.type==="boar")'));assert(run('enemies.some(e=>e.type==="thief")'));
assert.equal(run('enemies.every(e=>!isSafe(e.x,e.y))'),true);
for(const type of ['guardian','thief','boar']){run(`(()=>{const e=enemies.find(e=>e.type==='${type}');state.x=e.x;state.y=e.y;reveal();enemyDialogue(e);drawEnemy(e,100,100,32)})()`);assert.equal(element('modal').open,false);assert(run('speech!==null'));assert(run(`enemyPortrait('${type}').includes('svg')`))}
run('(()=>{const e=enemies.find(e=>e.type==="thief");fightEnemy(e);victory("test");closeModal()})()');assert(run('state.defeatedEnemies.some(id=>id.startsWith("thief"))'));assert.equal(run('enemyAlive(enemies.find(e=>e.type==="thief"))'),false);
run('save()');const opponentSave=run('JSON.stringify({...state,seen:[...state.seen]})');run(`generate('ENEMY-CHECK','woodland',JSON.parse(${JSON.stringify(opponentSave)}))`);assert.equal(run('enemies.some(e=>state.defeatedEnemies.includes(e.id))'),false);
assert(html.includes('viewport-fit=cover'));assert(html.includes('moreControls'));
const css=fs.readFileSync(__dirname+'/style.css','utf8');assert(css.includes('(pointer:coarse)'));assert(css.includes('safe-area-inset-bottom'));
const beforePractice=run('JSON.stringify({...state,seen:[...state.seen]})');
run('startCombat({name:"Lab",enemyType:"bear",practice:true,encounter:true})');
const committedHand=run('JSON.stringify(combat.enemyHand)');run('renderCombat();renderCombat()');assert.equal(run('JSON.stringify(combat.enemyHand)'),committedHand,'Enemy hand must stay committed during selection');
assert.equal(run('combat.player.cards.find(c=>c.id==="guard").uses'),5);assert.equal(run('combat.player.cards.some(c=>c.kind==="dodge")'),false);
run('combat.hand=[{id:"melee",die:true},{id:"guard"},{id:"ember"}];commitBattleHand()');
assert.equal(run('combat.snapshot'),beforePractice,'Map practice keeps an exact checkpoint of the saved journey');
assert.equal(run('combat.player.cards.some(c=>c.id==="ember")'),false,'Consumed practice card disappears');
const firstResult=run('JSON.stringify(combat.result)');run('commitBattleHand()');assert.equal(run('JSON.stringify(combat.result)'),firstResult,'Commit is idempotent after reveal');
run('leavePractice();startCombat({name:"Lab",enemyType:"bear",practice:true,encounter:true})');assert.equal(run('combat.player.cards.find(c=>c.id==="guard").uses'),5);assert.equal(run('combat.player.dice'),3);run('leavePractice()');
const scheduled=[];context.setTimeout=fn=>{scheduled.push(fn);return scheduled.length};
run('preferences.reduceMotion=false;startCombat({name:"Guided",enemyType:"boar",practice:true,guided:true,encounter:true})');
assert(run('combatGuide(combat).includes("1 · Choose your hand")'));
run('combat.hand=[{id:"melee",die:true},{id:"guard"}]');assert(run('combatGuide(combat).includes("3 · Commit your hand")'));
const guideState=run('JSON.stringify({...state,seen:[...state.seen]})');run('commitBattleHand()');assert.equal(element('commitHand').disabled,true,'Do not advance while the exchange animates');assert(run('combatGuide(combat).includes("4 · Read what happened")'));
scheduled.pop()();assert.equal(element('commitHand').disabled,false,'Next round unlocks after animation');
assert.equal(run('JSON.stringify({...state,seen:[...state.seen]})'),guideState,'Guided practice must preserve journey');
run('preferences.reduceMotion=true');const pending=scheduled.length;run('animateCombatRound(combat)');assert.equal(scheduled.length,pending,'Reduced motion skips timed playback');run('preferences.reduceMotion=false;leavePractice()');
const beforeArtPractice=run('JSON.stringify({...state,seen:[...state.seen]})');
for(const outcome of ['victory','defeat','draw','escaped','negotiated']){
 run('startCombat({name:"Guided",enemyType:"boar",practice:true,guided:true,encounter:true})');
 assert.equal(element('modal').open,false,'Guided combat must not open a dialog');
 run(`showPracticeResult('${outcome}')`);assert.equal(run('combat'),null);assert.equal(element('modal').open,false,'Aftermath must remain on the map');
 assert(element('mapBattlePanel').innerHTML.includes('unchanged'));
 run('leavePractice()');
}
assert.equal(run('JSON.stringify({...state,seen:[...state.seen]})'),beforeArtPractice,'Outcome previews must not mutate the saved world');
run('startCombat({name:"Guided",enemyType:"boar",practice:true,guided:true,encounter:true});combat.hand=[{id:"bolt"}];commitBattleHand()');
assert(run('combat.onMap'));assert.equal(element('guidedCombat').hidden,true);assert(!element('mapBattlePanel').innerHTML.includes('<img'),'Map combat must not mount separate battle artwork');run('leavePractice()');
run('setMapZoom(99)');assert.equal(run('mapCamera.target'),5);run('setMapZoom(0)');assert.equal(run('mapCamera.target'),.75);run('setMapZoom(1)');
const unchangedTerrain=run('JSON.stringify(tiles)');run('showEncounterWalkthrough()');assert.equal(run('JSON.stringify(tiles)'),unchangedTerrain,'Map practice uses the existing terrain');assert.equal(run('move(1,0)'),false,'Movement pauses during card commitment');run('leavePractice()');assert.equal(run('mapCamera.target'),1);
run('generate("MAP-OUTCOME-CHECK","woodland");lifeMode="play";save()');const storageBeforeMapPractice=storage.get(run('CFG.saveKey'));
run('showEncounterWalkthrough();save()');for(const callback of windowEvents.get('pagehide')||[])callback();assert.equal(storage.get(run('CFG.saveKey')),storageBeforeMapPractice,'Direct saves and reload/page-hide handlers must never overwrite the saved map during practice');run('leavePractice()');
run('(()=>{const e=enemies.find(e=>e.type==="boar");state.x=e.x-1;state.y=e.y;resetMotion();reveal();startCombat(enemyPlace(e));combat.enemy.hp=1;combat.enemyHand=[];combat.hand=[{id:"melee"}];})()');
const winPosition=run('JSON.stringify({x:state.x,y:state.y})'),winEntity=run('combat.place.entityId'),winGold=run('state.gold');run('commitBattleHand();nextBattleRound()');assert.equal(run('combat'),null);assert.equal(run('state.gold'),winGold+12);assert.equal(run('JSON.stringify({x:state.x,y:state.y})'),winPosition,'Victory returns control at the same map position');assert(run(`state.defeatedEnemies.includes('${winEntity}')`));assert.equal(element('modal').open,false);
run('startCombat({name:"Defeat",enemyType:"boar",encounter:true});state.hp=0;finishTurn()');assert.equal(run('state.x'),40);assert.equal(run('state.y'),44);assert.equal(run('state.vaults'),0);assert.equal(element('modal').open,false,'Defeat uses a map result, not a dialog');
run('setMapZoom(2);mapCamera.zoom=2;draw()');assert.equal(run('view.t'),run('CFG.tile*2'),'World zoom scales the existing canvas grid');run('setMapZoom(1)');
run('generate("SPACING-CHECK","woodland");lifeMode="play";(()=>{const e=enemies.find(e=>e.type==="boar");state.x=e.x;state.y=e.y;resetMotion();startCombat(enemyPlace(e))})()');
assert(run('Math.hypot(state.x-combat.mapEnemy.x,state.y-combat.mapEnemy.y)>=3'),'Starting from an overlapping save must separate the fighters');
assert(!run('["water","tree","mountain"].includes(tiles[idx(state.x,state.y)].type)'),'Staging must use open terrain');
run('finishMapEncounter("escaped");generate("STEP-CHECK","woodland");lifeMode="play";(()=>{const e=enemies.find(e=>e.type==="boar");state.x=e.x-1;state.y=e.y;resetMotion()})()');
assert.equal(run('move(1,0)'),false,'Exploration must never step onto an enemy tile');
// Effects preserve the committed hands and delay visible health changes until impact.
run('showEncounterWalkthrough();combat.hand=[{id:"bolt"}];commitBattleHand()');
assert(run('mapEffectPlan(combat).some(e=>e.side==="player"&&e.kind==="bolt")'));
assert(!run('mapEffectPlan(combat).some(e=>e.side==="player"&&e.kind==="slash")'),'A spell-only hand must not swing a sword');
const originalHands=run('JSON.stringify([combat.hand,combat.enemyHand,combat.result])');
run('drawMapEncounter(0,0,32)');assert.equal(element('mapUnitEnemyValue').textContent,run('combat.beforeHP.enemy+"/"+combat.enemy.maxHP'),'Health stays unchanged before impact');
clock+=500;run('drawMapEncounter(0,0,32)');
clock+=500;run('drawMapEncounter(0,0,32)');assert.equal(element('mapUnitEnemyValue').textContent,run('combat.enemy.hp+"/"+combat.enemy.maxHP'),'Health changes at impact');
assert.equal(run('JSON.stringify([combat.hand,combat.enemyHand,combat.result])'),originalHands,'Animation must not change combat rules or results');
run('leavePractice()');assert.equal(element('mapUnitPlayer').hidden,true);assert.equal(element('mapUnitEnemy').hidden,true);
for(let i=0;i<15;i++){
 run('generate("GAP-'+i+'","woodland");lifeMode="play";(()=>{const e=enemies.find(e=>e.type==="boar");state.x=e.x;state.y=e.y;resetMotion();startCombat(enemyPlace(e))})()');
 assert(run('Math.hypot(state.x-combat.mapEnemy.x,state.y-combat.mapEnemy.y)>=3'),'Separate an overlapping encounter for seed '+i);
 run('finishMapEncounter("escaped")');
}
console.log('PASS: world and combat regressions; save isolation, uses and dice; map outcomes and rewards; zoom and movement pause; overlap recovery and enemy-tile blocking.');
