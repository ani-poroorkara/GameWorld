(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ContentModel=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const categories=['attack','defense','utility','quest'];
 const effects=['attack','block','heal','distraction','ammo','map','quest'];
 const consumption=['permanent','consumable','ammunition','unlock'];
 const sources=['enemy','chest','farm','home','quest','pet','npc'];
 function validateContent(data){
  const errors=[],warnings=[],add=(path,message)=>errors.push({path,message}),warn=(path,message)=>warnings.push({path,message});
  const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
  const number=(v,path,{nullable=false,min=0,max=1e6,integer=false}={})=>{if(v===null&&nullable){warn(path,'Value not decided yet.');return}if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max||(integer&&!Number.isInteger(v)))add(path,`Must be a finite ${integer?'integer':'number'} between ${min} and ${max}.`)};
  const text=(v,path,required=true)=>{if(typeof v!=='string'||v.length>4000||(required&&!v.trim()))add(path,'Must be text'+(required?' and cannot be empty.':'.'))};
  const choice=(v,values,path)=>{if(!values.includes(v))add(path,'Choose one of: '+values.join(', ')+'.')};
  if(!object(data)){add('content','Expected a content object.');return {errors,warnings}}
  if(data.schemaVersion!==1)add('schemaVersion','Unsupported content version.');text(data.title,'title');
  const identities={};
  for(const group of ['cards','enemies','drops']){identities[group]=new Set();if(!Array.isArray(data[group])){add(group,'Expected a list.');continue}if(data[group].length>1000)add(group,'Maximum 1000 entries.');if(group==='cards'&&!data[group].length)add(group,'At least one card is required.');for(const [i,item]of data[group].entries()){const p=`${group}[${i}]`;if(!object(item)){add(p,'Expected an entry object.');continue}if(typeof item.id!=='string'||!/^[a-z][a-z0-9-]{0,63}$/.test(item.id))add(p+'.id','Use a lowercase ID with letters, numbers and hyphens.');else if(identities[group].has(item.id))add(p+'.id','Duplicate ID: '+item.id);else identities[group].add(item.id);text(item.name,p+'.name')}}
  for(const [i,c]of (Array.isArray(data.cards)?data.cards:[]).entries()){if(!object(c))continue;const p=`cards[${i}]`;choice(c.category,categories,p+'.category');choice(c.effect,effects,p+'.effect');choice(c.consumption,consumption,p+'.consumption');text(c.description,p+'.description',false);text(c.acquisition,p+'.acquisition',false);number(c.perFightUses,p+'.perFightUses',{nullable:true,min:1,max:999,integer:true});if(c.effect==='distraction')number(c.successChance,p+'.successChance',{nullable:true,max:1});else if(c.successChance!==null)number(c.successChance,p+'.successChance',{max:1});if(c.ammoCardId!==null&&!identities.cards.has(c.ammoCardId))add(p+'.ammoCardId','Unknown card: '+c.ammoCardId);if(!Array.isArray(c.levels)||!c.levels.length){add(p+'.levels','At least one level is required.');continue}const seen=new Set();for(const [j,l]of c.levels.entries()){const q=`${p}.levels[${j}]`;if(!object(l)){add(q,'Expected a level object.');continue}number(l.level,q+'.level',{min:1,max:99,integer:true});if(seen.has(l.level))add(q+'.level','Duplicate level: '+l.level);seen.add(l.level);number(l.power,q+'.power',{nullable:true});text(l.note,q+'.note',false)}}
  for(const [i,e]of (Array.isArray(data.enemies)?data.enemies:[]).entries()){if(!object(e))continue;const p=`enemies[${i}]`;for(const key of ['hp','attack','defense'])number(e[key],p+'.'+key,{nullable:true,min:key==='hp'?1:0});text(e.attackName,p+'.attackName',false);text(e.note,p+'.note',false)}
  for(const [i,d]of (Array.isArray(data.drops)?data.drops:[]).entries()){if(!object(d))continue;const p=`drops[${i}]`;choice(d.sourceType,sources,p+'.sourceType');text(d.sourceId,p+'.sourceId');if(d.sourceType==='enemy'&&!identities.enemies.has(d.sourceId))add(p+'.sourceId','Unknown enemy: '+d.sourceId);if(!identities.cards.has(d.cardId))add(p+'.cardId','Unknown card: '+d.cardId);choice(d.status,['draft','confirmed'],p+'.status');number(d.min,p+'.min',{min:1,max:9999,integer:true});number(d.max,p+'.max',{min:1,max:9999,integer:true});if(d.min>d.max)add(p+'.max','Quantity maximum must be at least the minimum.');if(d.chance===null&&d.status==='confirmed')add(p+'.chance','A confirmed drop needs a probability.');else number(d.chance,p+'.chance',{nullable:d.status==='draft',max:1});text(d.condition,p+'.condition',false);text(d.note,p+'.note',false)}
  if(data.campaign){validateCampaign(data.campaign,identities.cards,add);const campaign=data.campaign;for(const [i,d]of (Array.isArray(data.drops)?data.drops:[]).entries()){const group={chest:'chests',npc:'npcs',quest:'quests'}[d?.sourceType];if(group&&Array.isArray(campaign[group])&&!campaign[group].some(e=>e?.id===d.sourceId))add('drops['+i+'].sourceId','Unknown '+d.sourceType+': '+d.sourceId)}}
  for(const group of ['cards','enemies'])for(const [i,e]of (Array.isArray(data[group])?data[group]:[]).entries()){if(!object(e))continue;if(e.status!==undefined)choice(e.status,['draft','approved'],group+'['+i+'].status');if(group==='cards'){if(e.diceAllowed!==undefined&&typeof e.diceAllowed!=='boolean')add('cards['+i+'].diceAllowed','Expected a boolean.');if(e.requiresCardId&&!identities.cards.has(e.requiresCardId))add('cards['+i+'].requiresCardId','Unknown card: '+e.requiresCardId)}}
  const cardMap=new Map((Array.isArray(data.cards)?data.cards:[]).filter(object).map(c=>[c.id,c])),visiting=new Set(),visited=new Set();
  function cardVisit(id){if(visiting.has(id)){add('cards.'+id+'.requiresCardId','Card prerequisite cycle at '+id);return}if(visited.has(id))return;visiting.add(id);const ref=cardMap.get(id)?.requiresCardId;if(cardMap.has(ref))cardVisit(ref);visiting.delete(id);visited.add(id)}for(const id of cardMap.keys())cardVisit(id);
  return {errors,warnings};
 }
 function summarizeContent(data){return {cards:data.cards.length,enemies:data.enemies.length,drops:data.drops.length,levels:data.cards.reduce((n,c)=>n+c.levels.length,0)}}


 function validateTerminal(e,p,add){
  const required=e.status==='approved'&&e.id==='save-the-kid';
  if(required&&(typeof e.terminalStageId!=='string'||!e.terminalStageId.trim()))add(p+'.terminalStageId','Approved main quest requires an explicit terminal stage ID.');
  if(e.terminalStageId!==undefined&&e.terminalStageId!==null&&e.terminalStageId!==''){
   const last=Array.isArray(e.stages)?e.stages.at(-1):null;
   if(!last||last.id!==e.terminalStageId||last.terminal!==true)add(p+'.terminalStageId','Terminal stage must exist, be last, and have terminal: true.');
  }
  for(const [i,t]of (Array.isArray(e.stages)?e.stages:[]).entries())if(t&&t.terminal!==undefined){if(typeof t.terminal!=='boolean')add(p+'.stages['+i+'].terminal','Terminal flag must be a boolean.');if(t.terminal===true&&(t.id!==e.terminalStageId||i!==e.stages.length-1))add(p+'.stages['+i+'].terminal','Only the referenced final terminal stage may be terminal.');}
 }
 function validatePuzzle(e,p,add){
  const kinds=['channels','mechanism','witnesses','forest','passage'];
  if(!kinds.includes(e.kind)){add(p+'.kind','Unsupported puzzle kind. Choose '+kinds.join(', ')+'.');return}
  const optional=e.status!=='approved',missing=v=>v===undefined||v===null;
  for(const k of ['instructions','hint'])if(!(optional&&missing(e[k]))&&(typeof e[k]!=='string'||!e[k].trim()||e[k].length>4000))add(p+'.'+k,'Puzzle clue must be nonempty text up to 4000 characters.');
  if(optional&&missing(e.solution))return;
  if(!Array.isArray(e.solution)||!e.solution.length||e.solution.length>32){add(p+'.solution','Solution must contain 1 to 32 values.');return}
  if(['channels','mechanism'].includes(e.kind)){
   if(e.modulus!==3)add(p+'.modulus','Dial modulus must be 3.');
   const dials=Array.isArray(e.initialDials)?e.initialDials:[];
   if(dials.length!==e.solution.length)add(p+'.initialDials','Initial dials must match solution length.');
   for(const [k,values]of [['solution',e.solution],['initialDials',dials]])if(values.some(v=>!Number.isInteger(v)||v<0||v>=3))add(p+'.'+k,'Dial values must be finite integers from 0 to 2.');
  }else{
   const choices=Array.isArray(e.choices)?e.choices:[],seen=new Set();
   if(!choices.length||choices.length>32)add(p+'.choices','Sequence puzzle needs 1 to 32 labeled choices.');
   for(const [i,c]of choices.entries()){if(!c||typeof c.label!=='string'||!c.label.trim()||typeof c.value!=='string'||!c.value.trim()){add(p+'.choices['+i+']','Choice needs nonempty label and value.');continue}if(seen.has(c.value))add(p+'.choices['+i+'].value','Duplicate choice value.');seen.add(c.value)}
   if(e.solution.some(v=>typeof v!=='string'||!seen.has(v)))add(p+'.solution','Every solution value must reference a supported choice.');
  }
 }
 function migrateContent(input,campaign){const data=JSON.parse(JSON.stringify(input));if(!data||typeof data!=='object'||Array.isArray(data))return data;for(const group of ['cards','enemies'])for(const e of Array.isArray(data[group])?data[group]:[]){if(!e||typeof e!=='object')continue;if(e.status===undefined)e.status='draft';if(group==='cards'&&e.diceAllowed===undefined&&e.status==='draft')e.diceAllowed=['attack','block'].includes(e.effect)}if(!data.campaign&&campaign)data.campaign=JSON.parse(JSON.stringify(campaign));return data}
 function validateCampaign(c,cardIds,add){
  const obj=v=>v&&typeof v==='object'&&!Array.isArray(v),groups=['quests','npcs','chests','puzzles','regions','passages'];
  if(!obj(c)){add('campaign','Expected an object.');return}
  const size=c.world?.size;if(!Number.isInteger(size)||size<1||size>512)add('campaign.world.size','World size must be an integer from 1 to 512.');
  const position=(e,p)=>{for(const k of ['x','y'])if(!(e?.status==='draft'&&e[k]===null)&&(!Number.isInteger(e?.[k])||e[k]<0||e[k]>=size))add(p+'.'+k,'Coordinate outside world bounds.')};
  position(c.world?.home,'campaign.world.home');position(c.world?.spawn,'campaign.world.spawn');
  const nodes=new Map();
  for(const g of groups){if(!Array.isArray(c[g])){add('campaign.'+g,'Expected a list.');continue}for(const [i,e]of c[g].entries()){const p='campaign.'+g+'['+i+']';if(!obj(e)){add(p,'Expected an object.');continue}if(typeof e.id!=='string'||!/^[a-z][a-z0-9-]{0,63}$/.test(e.id))add(p+'.id','Invalid ID.');if(nodes.has(e.id))add(p+'.id','Duplicate ID: '+e.id);nodes.set(e.id,{e,p});if(typeof e.name!=='string'||!e.name.trim())add(p+'.name','Name required.');if(e.status!==undefined&&!['draft','approved'].includes(e.status))add(p+'.status','Invalid approval status.');if(g!=='quests'&&g!=='regions')position(e,p);
   if(g==='regions'){if(e.status==='approved'&&!['village','town','forest','cracked','mountains'].includes(e.kind))add(p+'.kind','Unsupported approved region kind. Choose village, town, forest, cracked or mountains.');const b=e.bounds;if(!obj(b)||!['x1','x2','y1','y2'].every(k=>Number.isInteger(b[k])&&b[k]>=0&&b[k]<size)||b.x1>b.x2||b.y1>b.y2)add(p+'.bounds','Invalid region bounds.')}
   if(g==='passages'&&typeof e.northern!=='boolean')add(p+'.northern','Expected a boolean.');
   if(g==='puzzles')validatePuzzle(e,p,add);
   if(g==='npcs'){if(typeof e.role!=='string'||!e.role.trim())add(p+'.role','Role required.');if(!Array.isArray(e.topics))add(p+'.topics','Expected topics list.');else for(const [j,t]of e.topics.entries())if(!obj(t)||typeof t.id!=='string'||typeof t.text!=='string')add(p+'.topics['+j+']','Topic needs id and text.')}
   if(g==='quests'){validateTerminal(e,p,add);if(!Array.isArray(e.stages)||!e.stages.length)add(p+'.stages','At least one stage required.');else for(const [j,t]of e.stages.entries()){const q=p+'.stages['+j+']';if(!obj(t)||typeof t.id!=='string'||typeof t.text!=='string'){add(q,'Stage needs id and text.');continue}if(nodes.has(t.id))add(q+'.id','Duplicate ID: '+t.id);nodes.set(t.id,{e:t,p:q})}}
   if(g==='chests'&&e.status==='approved'){const canonical={'chest-stone-throw':'stone-throw','chest-stone-block':'stone-block'}[e.id];if(canonical&&(!Array.isArray(e.rewards)||!e.rewards.some(r=>r?.cardId===canonical&&Number.isInteger(r.quantity)&&r.quantity>=1)))add(p+'.rewards','Approved '+e.id+' must retain at least one '+canonical+' reward. Additional rewards and quantities remain editable.')}
   if(['chests','puzzles'].includes(g)){if(!Array.isArray(e.rewards))add(p+'.rewards','Expected rewards list.');else for(const [j,r]of e.rewards.entries()){if(!obj(r)||!cardIds.has(r.cardId))add(p+'.rewards['+j+']','Unknown card: '+r?.cardId);if(!Number.isInteger(r?.quantity)||r.quantity<1||r.quantity>9999)add(p+'.rewards['+j+'].quantity','Quantity must be a positive integer.')}}
  }}
  const visiting=new Set(),visited=new Set();
  function visit(id){if(visiting.has(id)){add(nodes.get(id).p+'.requires','Prerequisite cycle at '+id);return}if(visited.has(id))return;visiting.add(id);const {e,p}=nodes.get(id);if(e.requires!==undefined&&!Array.isArray(e.requires))add(p+'.requires','Expected prerequisite IDs list.');else for(const ref of e.requires||[]){if(!nodes.has(ref)&&!cardIds.has(ref))add(p+'.requires','Unknown prerequisite: '+ref);else if(nodes.has(ref))visit(ref)}visiting.delete(id);visited.add(id)}
  for(const id of nodes.keys())visit(id);
 }
 return {migrateContent,validateCampaign,validateContent,summarizeContent,categories,effects,consumption,sources};
});
