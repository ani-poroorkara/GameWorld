// Headless logic checks only; this does not replace visual browser verification.
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const elements=new Map(),storage=new Map();
let clock=1000;const motionPreference={matches:false};
const paint=new Proxy({measureText:s=>({width:s.length*6}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{}});
function element(id){if(!elements.has(id))elements.set(id,{value:id==='climate'?'woodland':'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},getContext:()=>paint,getBoundingClientRect:()=>({width:1000,height:520,left:0,top:0}),querySelector:()=>element(id+'child'),querySelectorAll:()=>[],addEventListener(){},focus(){},showModal(){this.open=true},close(){this.open=false},open:false});return elements.get(id)}
const context=vm.createContext({console,Set,Map,Math,Date,JSON,Number,document:{body:element('body'),documentElement:{style:{setProperty(){}}},getElementById:element,querySelectorAll:()=>[],addEventListener(){}},window:{devicePixelRatio:1,matchMedia:()=>motionPreference,addEventListener(){}},localStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)||null},performance:{now:()=>clock},setTimeout:()=>0,clearTimeout(){},requestAnimationFrame(){}});
vm.runInContext(fs.readFileSync(__dirname+'/world-life.js','utf8'),context);
vm.runInContext(fs.readFileSync(__dirname+'/game.js','utf8'),context);
const run=code=>vm.runInContext(code,context);
run("lifeMode='play'");
function reachable(){return run(`(()=>{const q=[{x:40,y:44}],seen=new Set([idx(40,44)]);for(let i=0;i<q.length;i++){const p=q[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){let x=p.x+dx,y=p.y+dy;if(x<1||y<1||x>=CFG.size-1||y>=CFG.size-1)continue;let id=idx(x,y);if(seen.has(id)||['water','tree','mountain'].includes(tiles[id].type))continue;seen.add(id);q.push({x,y})}}return landmarks.every(p=>seen.has(idx(p.x,p.y)))})()`)}
for(let i=0;i<100;i++){run(`generate('CHECK-${i}', '${['woodland','autumn','frost'][i%3]}')`);assert(reachable(),'Disconnected landmark for seed '+i)}
run("generate('ASHWOOD-724','woodland')");const terrain=run('JSON.stringify(tiles)');run("generate('ASHWOOD-724','woodland')");assert.equal(run('JSON.stringify(tiles)'),terrain,'Same seed must reproduce terrain');run("generate('OTHER-SEED','woodland')");assert.notEqual(run('JSON.stringify(tiles)'),terrain,'Different seeds must change terrain');
run("generate('ASHWOOD-724','woodland'); draw(); showBinder(); closeModal(); toggleAtlas(); draw(); toggleAtlas()");
assert.equal(run('state.hp'),60);run('interact(); $("doRest").onclick()');assert.equal(run('state.mana'),20);
for(let i=1;i<=3;i++){
 run(`state.x=landmarks.find(p=>p.id==='ruin${i}').x; state.y=landmarks.find(p=>p.id==='ruin${i}').y; state.hp=60;state.mana=20;reveal();updateUI();interact();$('fight').onclick()`);
 for(let turn=0;turn<8&&run('combat!==null');turn++)run('playCard(state.mana>=5?2:0)');
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
run('state.hp=CFG.maxHP;state.mana=maxMana();startCombat({id:"test-road",name:"Road",enemy:"Road Robber",encounter:true})');assert(element('modalContent').innerHTML.includes('Ember Spark'));run('playCard(4)');assert.equal(run('state.mana'),run('maxMana()-4'));run('victory("clear");closeModal()');assert.equal(run('state.relics.length'),0);assert.equal(run('state.gold'),12);
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
console.log('PASS: world, character, economy, combat, save, pet and clock regressions; full-screen UI structure; non-blocking NPC and animal speech; distance dismissal; atlas-only progress; quests opened on demand.');
