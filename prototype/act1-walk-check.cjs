const assert=require('node:assert/strict');
const fs=require('node:fs');
const {launch}=require('./act1-check.cjs');

// Independent route acceptance: BFS selects directions, but move() performs every
// world step. No position/HP assignments, story dispatches or forced outcomes.
function check(label,markup,directory){
 const {run,click,element}=launch(undefined,markup,directory);
 run('singlePlayerMenu()');
 click('opening','newAct1Campaign');
 click('opening','Balanced build');
 click('opening','startJourney');
 assert.equal(run('state.act1.mode'),'campaign');
 assert.equal(run('state.steps'),0);
 // Existing deterministic no-Bow scenario; real opponent hands/resolver remain.
 run('preferences.reduceMotion=true;random=()=>.99');
 const legs=[];
 function walk(name,x,y,range=0){
  run('closeModal();dismissSpeech()');
  const route=JSON.parse(run(`JSON.stringify((()=>{
   const q=[{x:state.x,y:state.y,path:[]}],seen=new Set([idx(state.x,state.y)]);
   const blocked=new Set(enemies.filter(enemyAlive).map(e=>idx(e.x,e.y)));
   for(let i=0;i<q.length;i++){
    const n=q[i];
    if(Math.abs(n.x-${x})+Math.abs(n.y-${y})<=${range})return n.path;
    for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
     const x=n.x+dx,y=n.y+dy,k=idx(x,y);
     if(x<1||y<1||x>=CFG.size-1||y>=CFG.size-1||seen.has(k)||blocked.has(k)||['tree','mountain','water'].includes(tiles[k].type))continue;
     seen.add(k);q.push({x,y,path:[...n.path,[dx,dy]]});
    }
   }
   throw new Error('No traversable route to '+${JSON.stringify(name)});
  })())`));
  for(const [dx,dy]of route)assert.equal(run(`move(${dx},${dy})`),true,name+' real move');
  legs.push({name,steps:route.length});
  run('interact()'); // The same function reached through E / touch Interact.
 }
 function fight(id){
  click('speechBubble','Fight');
  assert.equal(run('combat.place.entityId'),id);
  let rounds=0;
  while(run('!!combat')&&rounds++<30){
   const ids=JSON.parse(run(`JSON.stringify(combat.player.cards.filter(c=>c.uses>0&&['attack','defense','heal'].includes(c.kind)).map(c=>c.id))`));
   for(const id of ids){
    const button=element('mapBattlePanel').children.find(b=>b.dataset.pick===id);
    assert(button,'Rendered card '+id);assert(!button.disabled);button.onclick();
   }
   click('mapBattlePanel','commitHand');
   click('mapBattlePanel','commitHand');
  }
  assert.equal(run('!!combat'),false,'Encounter must resolve through rendered controls');
  assert.equal(run(`state.defeatedEnemies.includes(${JSON.stringify(id)})`),true,'Real victory '+id);
  // The final ending is a modal above the result panel; do not click behind it.
  if(!element('modal').open)click('mapBattlePanel','continueOnMap');
 }
 walk('Mara',69,67);click('speechBubble','Quest topic');click('speechBubble','I will help');
 walk('Home gear',72,72);click('modalContent','Collect Pickaxe and Shield');
 walk('Tessa',76,76);click('speechBubble','Quest topic');
 walk('Road thief',88,55,1);fight('act1-road-thief');
 assert.equal(run('state.act1.flags.roadLead'),true);
 walk('Living cave entrance',106,35);
 assert.equal(run('state.act1.flags.caveRevealed'),true);
 run('closeModal();interact()');fight('act1-cave-monster');
 assert.equal(run('campaignQuantity("stone-staff")'),1);
 walk('Northern watch',72,7);
 assert.equal(run('state.act1.flags.northernPassage'),true);
 walk('Air monster',72,9,1);fight('act1-air-monster');
 assert.equal(run('state.act1.stage'),'dilemma');
 assert(element('modalContent').innerHTML.includes('decision continues in Act 2'));
 for(const id of ['bow','stone-throw','stone-block'])assert.equal(run(`campaignQuantity(${JSON.stringify(id)})`),0,'No optional '+id);
 assert.equal(run('Object.keys(state.act1.puzzles).length'),0);
 assert.equal(run('Object.keys(state.act1.sideQuests).length'),0);
 const steps=legs.reduce((n,leg)=>n+leg.steps,0);
 assert.equal(run('state.steps'),steps,'Every step was performed by move()');
 console.log(`PASS: ${label} real walking main route, ${steps} steps; ${legs.map(l=>l.name+' '+l.steps).join(' -> ')}; rendered real victories, no optional rewards, unresolved dilemma.`);
}

check('source');
if(process.argv.includes('--builds')){
 check('standalone',fs.readFileSync(__dirname+'/MyWorld.html','utf8'),__dirname);
 check('Pages',fs.readFileSync(__dirname+'/dist/index.html','utf8'),__dirname+'/dist');
}
