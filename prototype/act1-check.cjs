// Actual index startup order, rendered speech buttons, and browser-local save integration.
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
function launch(initial,markup=html,directory=__dirname){
 const elements=new Map(),storage=new Map(initial||[]);let activeElement=null;
 const paint=new Proxy({measureText:s=>({width:s.length*6}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{}});
 function element(id){
  if(elements.has(id))return elements.get(id);
  const e={id,contains(node){return this===node||this.children.includes(node)},value:'',style:{setProperty(){}},dataset:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},getContext:()=>paint,getBoundingClientRect:()=>({width:1000,height:520,left:0,top:0}),addEventListener(){},focus(){activeElement=this},showModal(){this.open=true},close(){this.open=false},open:false,children:[],querySelector(selector){return this.children.find(c=>selector==='.close'&&c.className==='close')||element(id+'child')},querySelectorAll(selector){return selector==='[data-speech-action]'?this.children.filter(c=>c.dataset.speechAction!==undefined):[]}};
  let markup='';Object.defineProperty(e,'innerHTML',{get:()=>markup,set(value){if(e.children.includes(activeElement))activeElement=null;markup=value;e.children=[];for(const match of value.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)){const attrs=match[1],key=/\bid="([^"]+)"/.exec(attrs)?.[1],b=enhance(key||id+'button'+e.children.length);b.label=match[2].replace(/<[^>]*>/g,'');b.className=/class="([^"]+)"/.exec(attrs)?.[1];const action=/data-speech-action="([^"]+)"/.exec(attrs);for(const attribute of attrs.matchAll(/data-([a-z-]+)="([^"]*)"/g))b.dataset[attribute[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=attribute[2];b.disabled=/\bdisabled\b/.test(attrs);b.onclick=null;e.children.push(b)}}});elements.set(id,e);return e;
 }
 function enhance(id){const e=element(id);e.insertAdjacentHTML=(position,value)=>{assert.equal(position,'beforeend');const temp=element(id+'append'+e.children.length);temp.innerHTML=value;const previous=e.children.map(button=>({button,onclick:button.onclick}));const old=e.innerHTML;e.innerHTML=old+value;for(const {button,onclick} of previous)button.onclick=onclick;e.children=[...previous.map(p=>p.button),...temp.children]};return e}
 const context=vm.createContext({console,Set,Map,Math,Date,JSON,Number,TextEncoder,sessionStorage:{getItem:()=>null,setItem(){}},document:{get activeElement(){return activeElement},body:element('body'),documentElement:{style:{setProperty(){}}},getElementById:enhance,querySelectorAll:selector=>{const m=/^\[data-([a-z-]+)\]$/.exec(selector);if(!m)return[];const key=m[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase());return [...elements.values()].filter(e=>e.dataset[key]!==undefined)},addEventListener(){}},window:{devicePixelRatio:1,matchMedia:()=>({matches:false}),addEventListener(){}},localStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)||null},performance:{now:()=>1000},setTimeout:()=>0,clearTimeout(){},requestAnimationFrame(){}});
 for(const script of markup.matchAll(/<script(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g))vm.runInContext(script[1]?fs.readFileSync(directory+'/'+script[1],'utf8'):script[2],context,{filename:script[1]||'index boot'});
 const run=code=>vm.runInContext(code,context);
 const click=(parent,label)=>{const b=element(parent).children.find(b=>b.label===label||b===elements.get(label));assert(b,'Rendered button missing: '+label);assert.equal(typeof b.onclick,'function');assert(!b.disabled);b.focus();b.onclick()};
 run("lifeMode='play'");return {run,element,storage,click};
}
module.exports={launch};
if(require.main===module){
let app=launch();let {run,element,click}=app;
assert.equal(run('state.act1'),undefined);
element('questButton').onclick();assert(element('modalContent').innerHTML.includes('The sleeping gate'));
click('modalContent','×');assert.equal(element('modal').open,false,'Appending preview journal keeps original Close callback');element('questButton').onclick();
click('modalContent','Start prologue preview');
assert.equal(run('state.act1.inventory.punch.quantity'),1);assert.equal(run('state.act1.inventory[Act1State.CARDS.QUEST]'),undefined);
assert.equal(run('villagers.filter(v=>v.id==="mara").length'),1);assert(run('villagers.some(v=>v.id==="tess")'));
const legacy=run('JSON.stringify([state.character,state.gold,state.ownedCards,state.relics,state.food])');
function talk(id){run(`closeModal();state.x=villagers.find(v=>v.id===${JSON.stringify(id)}).x;state.y=villagers.find(v=>v.id===${JSON.stringify(id)}).y;updateUI();interact()`)}
talk('mara');click('speechBubble','Quest topic');assert(element('speechBubble').innerHTML.includes('My child'));click('speechBubble','Not yet');
run('save()');app=launch(app.storage);({run,element,click}=app);
assert.equal(run('state.act1.status'),'declined');talk('mara');click('speechBubble','Quest topic');click('speechBubble','I will help');
assert.equal(run('state.act1.inventory[Act1State.CARDS.QUEST].quantity'),1);
talk('mara');click('speechBubble','Normal topic');assert(element('speechBubble').innerHTML.includes('farm'));
talk('act1-tessa');click('speechBubble','Quest topic');click('speechBubble','Ask about preparations');
run('closeModal();state.x=40;state.y=42;updateUI();interact()');click('modalContent','Collect Pickaxe and Shield');
assert.equal(run('state.act1.flags.homeGear'),true);
run('closeModal();interact()');assert(!element('modalContent').innerHTML.includes('id="act1Gear"'));assert.equal(run('state.act1.inventory.pickaxe.quantity'),1);
const seen=run('JSON.stringify([...state.seen])'),explored=element('explored').textContent;
talk('act1-ivo');click('speechBubble','Quest topic');click('speechBubble','Take local Map Card');
const mapSeen=run('JSON.stringify([...state.seen])');click('speechBubble','View village map');
assert(element('modalContent').innerHTML.includes('VILLAGE MAP'));assert.equal(run('JSON.stringify([...state.seen])'),mapSeen);assert.equal(mapSeen,seen);assert.equal(element('explored').textContent,explored);
assert.equal(run('act1MapKnows(homeBounds.left-1,homeBounds.top)'),false);assert.equal(run('act1MapKnows(homeBounds.left,homeBounds.top)'),true);
talk('act1-ivo');click('speechBubble','Quest topic');assert(!element('speechBubble').innerHTML.includes('Take local Map Card'));assert.equal(run('state.act1.inventory.map.quantity'),1);
assert.equal(run('state.act1.stage'),'road');const beforeJournal=run('JSON.stringify(state.act1)');element('questButton').onclick();assert(element('modalContent').innerHTML.includes(run('Act1State.questCard(state.act1).nextObjective')));assert.equal(run('JSON.stringify(state.act1)'),beforeJournal);
assert.equal(run('act1Event(Act1State.EVENTS.ROAD_THIEF_DEFEATED)'),false,'Preview cannot dispatch later main encounters');assert.equal(run('JSON.stringify(state.act1)'),beforeJournal);
element('binder').onclick();assert(element('modalContent').innerHTML.includes('Quantity 1'));assert(element('modalContent').innerHTML.includes('Level 1'));assert(element('modalContent').innerHTML.includes('Save the Kid'));
assert.equal(run('JSON.stringify([state.character,state.gold,state.ownedCards,state.relics,state.food])'),legacy);
const checkpoint=run('JSON.stringify(state.act1)');run('closeModal();showEncounterWalkthrough();state.act1.inventory.punch.quantity=99;leavePractice()');assert.equal(run('JSON.stringify(state.act1)'),checkpoint);
run('save()');app=launch(app.storage);({run,element,click}=app);assert.equal(run('JSON.stringify(state.act1)'),checkpoint);
run('generate("OTHER","woodland")');assert.equal(run('JSON.stringify(state.act1)'),checkpoint);assert.equal(run('villagers.filter(v=>v.id==="act1-ivo").length'),1);
// Exercise actual rendered home and map controls before acceptance as a separate journey.
const fresh=launch();fresh.element('questButton').onclick();fresh.click('modalContent','Start prologue preview');fresh.run('closeModal();state.x=40;state.y=42;state.hp=1;updateUI();interact()');
fresh.click('modalContent','Rest by the fire');assert.equal(fresh.run('state.hp'),60,'Appending equipment keeps original Rest callback');
fresh.run('interact()');fresh.click('modalContent','Collect Pickaxe and Shield');assert.equal(fresh.run('state.act1.flags.accepted'),false);
fresh.run('closeModal();state.x=37;state.y=37;updateUI();interact()');fresh.click('speechBubble','Quest topic');fresh.click('speechBubble','I will help');assert.equal(fresh.run('state.act1.flags.homeGear'),true);assert.equal(fresh.run('state.act1.inventory.pickaxe.quantity'),1);
fresh.run('mainMenu()');fresh.click('opening','singlePlayer');fresh.click('opening','newCharacter');fresh.click('opening','Balanced build');fresh.click('opening','startJourney');assert.equal(fresh.run('state.act1'),undefined,'An intentional new character starts without the old preview');
// Seed an unknown version before game.js performs its eager generation/save.
const raw=JSON.parse(app.storage.get(run('CFG.saveKey')));raw.act1={version:99,opaque:{keep:['exactly',42]}};
app=launch(new Map([[run('CFG.saveKey'),JSON.stringify(raw)]]));({run,element,click}=app);
const opaque=JSON.stringify(raw.act1);assert.equal(run('JSON.stringify(state.act1)'),opaque);assert.equal(JSON.stringify(JSON.parse(app.storage.get(run('CFG.saveKey'))).act1),opaque);
element('questButton').onclick();assert(element('modalContent').innerHTML.includes('cannot be read'));assert(!element('modalContent').innerHTML.includes('id="act1Start"'));
run('act1StartPreview();act1Event(Act1State.EVENTS.QUEST_ACCEPTED);save()');assert.equal(run('JSON.stringify(state.act1)'),opaque);
for(const payload of [null,{version:1,broken:true}]){
 raw.act1=payload;const invalid=launch(new Map([[run('CFG.saveKey'),JSON.stringify(raw)]]));invalid.element('questButton').onclick();
 assert(invalid.element('modalContent').innerHTML.includes('cannot be read'),'Present invalid campaign must be retained and disabled');
 invalid.run('act1StartPreview();act1Event(Act1State.EVENTS.QUEST_ACCEPTED);save()');assert.equal(invalid.run('JSON.stringify(state.act1)'),JSON.stringify(payload));
}
run('state.act1=undefined;generate("UNDEFINED","woodland")');assert.equal(run('act1Unreadable()'),true);
if(process.argv.includes('--builds')){
 const bundle=fs.readFileSync(__dirname+'/MyWorld.html','utf8');assert(!/<script src=/.test(bundle));
 for(const file of ['act1-state.js','act1.js']){const source=fs.readFileSync(__dirname+'/'+file,'utf8');assert(bundle.includes(source));assert.equal(fs.readFileSync(__dirname+'/dist/'+file,'utf8'),source)}
 for(const [markup,directory] of [[bundle,__dirname],[fs.readFileSync(__dirname+'/dist/index.html','utf8'),__dirname+'/dist']]){const built=launch(undefined,markup,directory);built.element('questButton').onclick();built.click('modalContent','Start prologue preview');assert.equal(built.run('state.act1.version'),1)}
 const publicFiles=fs.readdirSync(__dirname+'/dist',{recursive:true});assert(!publicFiles.some(name=>/editor|backup|server|token|\.test\.|-check\.cjs/.test(name)));
 assert(!bundle.includes('createEditorServer'));assert(!bundle.includes('ContentModel'));
 console.log('PASS: standalone and Pages actual startup, exact campaign modules, public output excludes editor/server/check files.');
}
console.log('PASS: actual startup, opt-in, rendered dialogue, reacceptance, gear/map, binder, legacy preservation, reload, practice and unreadable saves. Headless only.');

}
