'use strict';
// Every opponent is an entity in the world, including random travel encounters.
let enemies=[];
function buildEnemies(){
 enemies=[];state.defeatedEnemies=Array.isArray(state.defeatedEnemies)?state.defeatedEnemies:[];
 for(const p of landmarks.filter(p=>p.kind==='ruin'))enemies.push({id:'guardian-'+p.id,type:'guardian',name:'The Hollow Sentinel',x:p.x,y:p.y+1,place:p});
 const choose=rng(hash(state.seed+'-creatures'));
 for(const type of ['thief','boar'])for(let n=0;n<6;n++){
  for(let attempt=0;attempt<1000;attempt++){
   const x=4+Math.floor(choose()*(CFG.size-8)),y=4+Math.floor(choose()*(CFG.size-8));
   if(isSafe(x,y)||enemies.some(e=>distance(e,{x,y})<5)||distance({x,y},{x:40,y:44})<14)continue;
   const tile=tiles[idx(x,y)].type;
   if(type==='thief'?tile!=='path':tile!=='grass'||![[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>tiles[idx(x+dx,y+dy)].type==='path'))continue;
   enemies.push({id:type+'-'+n,type,name:type==='thief'?'Road Thief':'Wild Boar',x,y});break;
  }
 }
 enemies=enemies.filter(enemyAlive);
}
function enemyAlive(e){return e.type==='guardian'?!state.cleared.includes(e.place.id):!state.defeatedEnemies.includes(e.id)}
function nearbyEnemy(){return enemies.filter(enemyAlive).filter(e=>distance(state,e)<=1).sort((a,b)=>distance(state,a)-distance(state,b))[0]||null}
function enemyPlace(e){return e.type==='guardian'?{...e.place,enemy:e.name,enemyType:e.type,entityId:e.id}:{id:e.id,name:e.type==='thief'?'Roadside Ambush':'Forest Encounter',enemy:e.name,enemyType:e.type,entityId:e.id,encounter:true}}
function fightEnemy(e){dismissSpeech();startCombat(enemyPlace(e))}
function enemyDialogue(e){
 const line=e.type==='guardian'?'I have kept this relic through a hundred winters. Prove your purpose, traveller.':e.type==='thief'?'A toll for the road. Eight gold, or we settle this another way.':'The boar snorts and paws the ground. It is frightened, and ready to defend itself.';
 const actions=[{label:e.type==='boar'?'Defend yourself':'Fight',run:()=>fightEnemy(e)}];
 if(e.type==='thief')actions.push({label:'Pay 8 gold',run:()=>{if(state.gold<8){showSpeech(e,'Not enough gold. Choose your next move carefully.',[{label:'Fight',run:()=>fightEnemy(e)},{label:'Leave',run:dismissSpeech}]);return}state.gold-=8;state.defeatedEnemies.push(e.id);dismissSpeech();save();updateUI();notify('The thief takes the toll and leaves.')}});
 actions.push({label:e.type==='boar'?'Leave it alone':'Step away',run:dismissSpeech});showSpeech(e,line,actions);
}
function spawnTravelEnemy(type){
 const possibilities=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:state.x+dx,y:state.y+dy}));
 const pos=possibilities.find(p=>p.x>0&&p.y>0&&p.x<CFG.size-1&&p.y<CFG.size-1&&!isSafe(p.x,p.y)&&!['water','mountain','tree'].includes(tiles[idx(p.x,p.y)].type)&&!enemies.some(e=>enemyAlive(e)&&distance(e,p)<2));
 if(!pos)return null;const e={id:'ambush-'+state.steps,type:type==='robber'?'thief':'boar',name:type==='robber'?'Road Thief':'Wild Boar',...pos};enemies.push(e);return e;
}
function enemyPortrait(type){
 const body=type==='boar'?'<path fill="#876d56" d="M5 13h21v12H5zm18-5h9v15h-9zM7 24h4v6H7zm13 0h4v6h-4z"/><path fill="#dfd5b2" d="M30 20h3v7h-3z"/><path fill="#252f24" d="M28 12h2v2h-2z"/>':type==='thief'?'<path fill="#393d39" d="M10 3h16v19H10zM6 19h24v11H6z"/><path fill="#b79d7b" d="M13 10h11v8H13z"/><path fill="#151f19" d="M11 14h15v6H11z"/><path fill="#99a49a" d="M29 16h3v16h-3z"/>':'<path fill="#7d9081" d="M10 2h17v15H10zM6 17h25v14H6z"/><path fill="#b2c2a7" d="M11 3h14v3H11z"/><path fill="#e4ce83" d="M13 9h3v3h-3zm8 0h3v3h-3zM16 20h6v7h-6z"/>';
 return `<svg viewBox="0 0 36 36" role="img" aria-label="${type==='boar'?'Wild boar':type==='thief'?'Road thief':'Stone guardian'}" shape-rendering="crispEdges">${body}</svg>`;
}
function drawEnemy(e,x,y,t){
 if(e.type==='boar'){
  drawAnimal({species:'boar',x:e.x},x,y,t);rect(x+t*.29,y+t*.04,t*.06,t*.22,'#e1d7b7');
 }else if(e.type==='thief'){
  drawVillager({...e,color:'#454a40'},x,y,t);rect(x-t*.15,y-t*.43,t*.35,t*.14,'#373d34');rect(x-t*.12,y-t*.19,t*.28,t*.09,'#27362d');rect(x+t*.25,y-t*.04,t*.055,t*.38,'#b7bc9f');
 }else{
  const pulse=.65+Math.sin(animationTime()/600)*.2;rect(x-t*.3,y+t*.28,t*.65,t*.14,'#192e2455');
  rect(x-t*.3,y-t*.18,t*.6,t*.55,'#788b79');rect(x-t*.22,y-t*.66,t*.44,t*.46,'#8d9e86');rect(x-t*.25,y-t*.72,t*.5,t*.1,'#b2b99b');
  rect(x-t*.38,y-t*.1,t*.12,t*.4,'#677e6b');rect(x+t*.26,y-t*.1,t*.12,t*.4,'#677e6b');rect(x-t*.24,y+t*.3,t*.17,t*.2,'#6c806a');rect(x+t*.07,y+t*.3,t*.17,t*.2,'#6c806a');
  ctx.globalAlpha=pulse;rect(x-t*.13,y-t*.5,t*.08,t*.06,'#ecd495');rect(x+t*.05,y-t*.5,t*.08,t*.06,'#ecd495');rect(x-t*.06,y,t*.12,t*.2,'#e1c47b');ctx.globalAlpha=1;
 }
 ctx.fillStyle='#e1b98c';ctx.font='9px Georgia';ctx.textAlign='center';ctx.fillText(e.type==='guardian'?'Guardian':e.name,x,y-t*(e.type==='guardian'?.95:.65));
}
function drawEnemies(ox,oy,t){if(atlas)return;for(const e of enemies)if(enemyAlive(e)&&state.seen.has(idx(e.x,e.y)))drawEnemy(e,ox+(e.x+.5)*t,oy+(e.y+.5)*t,t)}
