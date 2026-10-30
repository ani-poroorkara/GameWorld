(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory();else root.Act1Puzzles=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const reset={label:'Reset puzzle',action:{type:'reset'}};
 const turns=()=>[0,1,2].map(index=>({label:'Turn '+['left','middle','right'][index]+' dial',action:{type:'rotate',index}}));
 const DEFINITIONS=[
  {id:'farmers-channels',name:"The Farmer's Channels",kind:'channels',instructions:'Three junctions each turn through 0, 1, 2. The scratched irrigation plan reads: left 1, middle 2, right 1. Turn the junctions to carry water to every field.',hint:'Match the junctions to 1, 2, 1.',actions:[...turns(),reset],solution:[1,2,1]},
  {id:'three-witnesses',name:'Three Witnesses',kind:'witnesses',instructions:'The miller saw the traveller head toward sunrise. The shepherd says the northern bridge is broken. The baker saw no one on the western road. Which road matches all three accounts?',hint:'The sun rises in the east.',actions:[...['north','east','south','west'].map(direction=>({label:'Choose '+direction,action:{type:'choose',direction}})),reset],solution:'east'},
  {id:'changing-forest',name:'The Changing Forest',kind:'sequence',instructions:'Follow the trail signs in order: moss points LEFT at the first fork; the sunlit branch bends RIGHT at the second; the fallen log points LEFT at the last. A wrong turn returns you to the entrance.',hint:'Left, right, left. You can always start again.',actions:[...['left','right'].map(direction=>({label:'Follow '+direction+' trail',action:{type:'step',direction}})),reset],solution:['left','right','left']},
  {id:'stone-mechanism',name:'The Stone Mechanism',kind:'dials',instructions:'Each rune dial cycles through 0, 1, 2. The mural shows two peaks on the left, an empty circle in the middle, and one peak on the right. Align the dials with the mural.',hint:'Two, zero, one: 2, 0, 1.',actions:[...turns(),reset],solution:[2,0,1]},
  {id:'northern-passage',name:'The Northern Passage',kind:'sequence',instructions:'The inscription reads: First seek SHELTER, then ring the BELL, then cross the BRIDGE. Press the three named switches in that order. An incorrect switch returns them all to rest.',hint:'Shelter, bell, bridge.',actions:[...['shelter','bell','bridge'].map(key=>({label:'Press '+key+' switch',action:{type:'press',switch:key}})),reset],solution:['shelter','bell','bridge']}
 ];
 function getDefinition(id,configs){
  if(configs!==undefined&&!Array.isArray(configs))throw new Error('Invalid puzzle configurations: expected an array');
  const fallback=configs===undefined,source=(fallback?DEFINITIONS:configs).find(d=>d.id===id&&d.status!=='draft');
  if(!source)throw new Error('Unknown puzzle: '+id);
  const d=JSON.parse(JSON.stringify(source));
  if(fallback){
   if(d.kind==='dials')d.kind='mechanism';
   if(d.kind==='sequence')d.kind=d.id==='northern-passage'?'passage':'forest';
   if(d.kind==='channels'||d.kind==='mechanism'){d.initialDials=d.solution.map(()=>0);d.modulus=3;}
   else {if(typeof d.solution==='string')d.solution=[d.solution];d.choices=d.actions.filter(a=>a.action.type!=='reset').map(a=>({label:a.label,value:a.action.direction||a.action.switch}));}
  }
  const invalid=()=>{throw new Error('Invalid puzzle: '+id);};
  if(!['channels','mechanism','dials','witnesses','forest','passage','sequence'].includes(d.kind)||typeof d.instructions!=='string'||!d.instructions.trim()||typeof d.hint!=='string'||!d.hint.trim()||!Array.isArray(d.solution)||!d.solution.length)invalid();
  if(['channels','mechanism','dials'].includes(d.kind)){
   if(d.modulus!==3||!Array.isArray(d.initialDials)||d.initialDials.length!==d.solution.length||![...d.solution,...d.initialDials].every(n=>Number.isInteger(n)&&n>=0&&n<d.modulus))invalid();
   d.actions=d.solution.map((value,index)=>({label:'Turn '+(d.solution.length===3?['left','middle','right'][index]:'dial '+(index+1)),action:{type:'rotate',index}}));
  }else{
   if(!Array.isArray(d.choices)||!d.choices.length||d.choices.some(c=>typeof c.label!=='string'||!c.label.trim()||typeof c.value!=='string'||!c.value.trim())||new Set(d.choices.map(c=>c.value)).size!==d.choices.length||d.solution.some(v=>typeof v!=='string'||!d.choices.some(c=>c.value===v)))invalid();
   const type=d.kind==='witnesses'?'choose':d.kind==='forest'?'step':d.kind==='passage'?'press':'select',key=type==='press'?'switch':type==='select'?'value':'direction';
   d.actions=d.choices.map(c=>({label:c.label,action:{type,[key]:c.value}}));
  }
  d.actions.push({label:reset.label,action:{type:'reset'}});return d;
 }
 function initial(id,configs){const d=getDefinition(id,configs);return {id,solved:false,progress:0,...(d.initialDials?{dials:d.initialDials.slice()}:{})};}
 function act(id,state,action,configs){
  const d=getDefinition(id,configs),s=state&&state.id===id?JSON.parse(JSON.stringify(state)):initial(id,configs),a=action||{};
  const result=feedback=>({state:s,solved:s.solved===true,feedback});
  if(a.type==='reset')return {state:initial(id,configs),solved:false,feedback:'The puzzle is reset. Try again whenever you like.'};
  if(s.solved)return result('The mechanism is complete. You may reset it to try again.');
  if(!d.actions.some(item=>item.action.type===a.type&&Object.keys(item.action).every(k=>item.action[k]===a[k])))return result('Choose one of the puzzle actions. '+d.hint);
  if(a.type==='rotate'){
   if(!Array.isArray(s.dials)||s.dials.length!==d.initialDials.length||!s.dials.every(v=>Number.isInteger(v)&&v>=0&&v<d.modulus))s.dials=d.initialDials.slice();
   s.dials[a.index]=(s.dials[a.index]+1)%d.modulus;s.solved=s.dials.every((v,i)=>v===d.solution[i]);
   return result(s.solved?'All three align. The mechanism opens.':'Dials: '+s.dials.join(', ')+'. '+d.hint);
  }
  const choice=a.type==='select'?a.value:a.type==='press'?a.switch:a.direction;
  if(!Number.isInteger(s.progress)||s.progress<0||s.progress>=d.solution.length)s.progress=0;
  if(choice!==d.solution[s.progress]){s.progress=0;return result('That order does not match the signs. Back to the beginning. '+d.hint);}
  s.progress++;s.solved=s.progress===d.solution.length;
  return result(s.solved?'The route is complete. The way opens.':'Correct: '+s.progress+' of '+d.solution.length+'. '+d.hint);
 }
 return {DEFINITIONS,getDefinition,initial,act};
});
