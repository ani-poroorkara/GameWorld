const test=require('node:test'),assert=require('node:assert/strict'),exists=require('node:fs').existsSync;
test('puzzle API exists',()=>assert.ok(exists(__dirname+'/act1-puzzles.js')));
const P=exists(__dirname+'/act1-puzzles.js')?require('./act1-puzzles.js'):null;
const fixtures={
 'farmers-channels':[{type:'rotate',index:0},{type:'rotate',index:1},{type:'rotate',index:1},{type:'rotate',index:2}],
 'three-witnesses':[{type:'choose',direction:'east'}],
 'changing-forest':[{type:'step',direction:'left'},{type:'step',direction:'right'},{type:'step',direction:'left'}],
 'stone-mechanism':[{type:'rotate',index:0},{type:'rotate',index:0},{type:'rotate',index:2}],
 'northern-passage':[{type:'press',switch:'shelter'},{type:'press',switch:'bell'},{type:'press',switch:'bridge'}]
};
test('five puzzles solve from visible clues, survive save/load, reset and allow unlimited retry',{skip:!P},()=>{
 assert.equal(P.DEFINITIONS.length,5);
 for(const [id,solution]of Object.entries(fixtures)){
 const d=P.DEFINITIONS.find(d=>d.id===id);assert.ok(d.instructions&&d.hint&&d.actions.length);assert.ok(d.actions.every(a=>a.label&&a.action.type));
 let s=P.initial(id);assert.equal(s.solved,false);
 for(let i=0;i<30;i++){let r=P.act(id,s,{type:'invalid'});assert.equal(r.solved,false);assert.ok(r.feedback);s=r.state;}
 for(const action of solution){const before=JSON.stringify(s),r=P.act(id,s,action);assert.equal(JSON.stringify(s),before,'must not mutate');s=JSON.parse(JSON.stringify(r.state));}
 assert.equal(s.solved,true,id);assert.equal(P.act(id,s,{type:'invalid'}).solved,true);
 assert.deepEqual(P.act(id,s,{type:'reset'}).state,P.initial(id));
 }
});
test('incorrect answers reset sequence progress without solving or consuming resources',{skip:!P},()=>{
 for(const [id,action]of [['three-witnesses',{type:'choose',direction:'west'}],['changing-forest',{type:'step',direction:'right'}],['northern-passage',{type:'press',switch:'bridge'}]]){
 const r=P.act(id,P.initial(id),action);assert.equal(r.solved,false);assert.ok(r.feedback);assert.equal(r.state.progress,0);
 }
 assert.throws(()=>P.initial('missing'),/Unknown/);
});
test('each puzzle can be solved using only its advertised UI actions',{skip:!P},()=>{
 for(const d of P.DEFINITIONS){const q=[P.initial(d.id)],visited=new Set();let solved=false;
 for(let i=0;i<q.length&&i<1000;i++){const s=q[i],key=JSON.stringify(s);if(visited.has(key))continue;visited.add(key);if(s.solved){solved=true;break;}for(const descriptor of d.actions)q.push(P.act(d.id,s,descriptor.action).state);}
 assert.ok(solved,d.id+' has no button-based solution');}
});
test('browser UMD exports support puzzle actions without Node dependencies',{skip:!P},()=>{
 const vm=require('node:vm'),fs=require('node:fs'),sandbox={};vm.runInNewContext(fs.readFileSync(__dirname+'/act1-puzzles.js','utf8'),sandbox);const api=sandbox.Act1Puzzles;assert.equal(api.act('three-witnesses',api.initial('three-witnesses'),{type:'choose',direction:'east'}).solved,true);
});
test('edited clues and solutions control existing puzzles and arbitrary approved puzzle IDs',{skip:!P},()=>{
 const configs=[{id:'farmers-channels',kind:'channels',instructions:'Set the new two junctions to 2,1.',hint:'Two then one.',modulus:3,initialDials:[1,0],solution:[2,1]},{id:'custom-witnesses',name:'New witnesses',kind:'witnesses',instructions:'All witnesses saw the western road.',hint:'Go west.',solution:['west'],choices:[{label:'West road',value:'west'},{label:'East road',value:'east'}]},{id:'custom-route',kind:'forest',instructions:'Right then right.',hint:'Two rights.',solution:['right','right'],choices:[{label:'Left fork',value:'left'},{label:'Right fork',value:'right'}]}];
 const before=JSON.stringify(configs),d=P.getDefinition('farmers-channels',configs);assert.equal(d.instructions,configs[0].instructions);assert.equal(d.actions.filter(a=>a.action.type==='rotate').length,2);
 let s=P.initial('farmers-channels',configs);assert.deepEqual(s.dials,[1,0]);s=P.act(s.id,s,{type:'rotate',index:0},configs).state;s=P.act(s.id,s,{type:'rotate',index:1},configs).state;assert.equal(s.solved,true);assert.deepEqual(P.act(s.id,s,{type:'reset'},configs).state.dials,[1,0]);
 const custom=P.getDefinition('custom-witnesses',configs);assert.equal(custom.hint,'Go west.');assert.equal(P.act(custom.id,P.initial(custom.id,configs),custom.actions[0].action,configs).solved,true);
 let route=P.initial('custom-route',configs);for(let i=0;i<2;i++)route=P.act(route.id,JSON.parse(JSON.stringify(route)),{type:'step',direction:'right'},configs).state;assert.equal(route.solved,true);assert.equal(JSON.stringify(configs),before);
 assert.throws(()=>P.initial('changing-forest',configs),/Unknown/);assert.throws(()=>P.initial('farmers-channels',[]),/Unknown/);assert.throws(()=>P.initial('hidden',[{...configs[0],id:'hidden',status:'draft'}]),/Unknown/);
});
test('invalid authored puzzle rules fail clearly before creating unsolvable states',{skip:!P},()=>{
 for(const config of [{id:'bad',kind:'unsupported'},{id:'bad',kind:'channels',instructions:'Clue',hint:'Hint',modulus:3,solution:[3],initialDials:[0]},{id:'bad',kind:'forest',instructions:'Clue',hint:'Hint',solution:['missing'],choices:[{label:'Only left',value:'left'}]}])assert.throws(()=>P.initial('bad',[config]),/Invalid puzzle/);
});
