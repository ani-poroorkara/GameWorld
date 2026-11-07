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
function enemyPortrait(type){return WorldArt.portrait(type==='boar'?'boar':type==='thief'?'thief':'guardian',1,type==='boar'?'Wild boar':type==='thief'?'Road thief':'Stone guardian')}
function drawEnemy(e,x,y,t){
 const foot=y+t*.45,height=e.type==='boar'?.91:e.type==='guardian'?1.65:1.32;
 spriteShadow(x,foot,t*.3,t*.08);WorldArt.draw(ctx,e.type,1,x,foot,t*height,{normalize:true});
 if(distance(state,e)<=3){ctx.fillStyle='#f2d6a4';ctx.font='10px Georgia';ctx.textAlign='center';ctx.fillText(e.type==='guardian'?'Guardian':e.name,x,foot-t*height-7);}
}
