const test=require('node:test'),assert=require('node:assert/strict');
const exists=require('node:fs').existsSync;
test('campaign world builder exists',()=>assert.ok(exists(__dirname+'/act1-world.js')));
const W=exists(__dirname+'/act1-world.js')?require('./act1-world.js'):null;
const walk=t=>!['tree','mountain','water'].includes(t.type);
function reachable(w,blocked=new Set()){
 const seen=new Set(),q=[w.spawn.y*w.size+w.spawn.x];seen.add(q[0]);
 for(let i=0;i<q.length;i++){let n=q[i],x=n%w.size,y=Math.floor(n/w.size);for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){let a=x+dx,b=y+dy,k=b*w.size+a;if(a<0||b<0||a>=w.size||b>=w.size||seen.has(k)||blocked.has(k)||!walk(w.tiles[k]))continue;seen.add(k);q.push(k)}}return seen;
}
test('all campaign sites and nine physical passages remain reachable with opponents blocking their tiles',{skip:!W},()=>{
 const start=performance.now();
 for(let seed=0;seed<24;seed++){
 const w=W.build('route-'+seed),seen=reachable(w,new Set(w.enemies.map(e=>e.y*144+e.x)));
 assert.equal(w.size,144);assert.equal(w.tiles.length,144*144);assert.equal(w.passages.length,9);
 assert.deepEqual(w.spawn,{x:72,y:74});assert.deepEqual(w.homeBounds,{left:61,right:83,top:61,bottom:83});
 for(const p of [...w.landmarks,...w.passages,...w.villagers,...w.animals]){
 assert.ok(walk(w.tiles[p.y*144+p.x]),p.id+' blocked');
 assert.ok(seen.has(p.y*144+p.x),p.id+' unreachable');
 assert.ok([[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>seen.has((p.y+dy)*144+p.x+dx)).length>=2,p.id+' narrow approach');}
 for(const e of w.enemies){assert.ok(!['village','town'].includes(W.regionAt(e.x,e.y)));if(e.type==='thief')assert.equal(w.tiles[e.y*144+e.x].type,'path');}
 assert.equal(w.enemies.find(e=>e.id==='act1-road-thief').x,88);
 for(const p of w.passages)assert.ok(seen.has(p.y*144+p.x));
 const all=reachable(w);for(let i=0;i<w.tiles.length;i++)if(walk(w.tiles[i]))assert.ok(all.has(i),'isolated walkable tile '+i);
 }
 assert.ok(performance.now()-start<5000,'generation and flood checks exceed 5s');
});
test('world is deterministic, serializable, varied and exposes nested regions',{skip:!W},()=>{
 const a=W.build('oak');assert.deepEqual(a,W.build('oak'));assert.deepEqual(JSON.parse(JSON.stringify(a)),a);assert.notDeepEqual(a.tiles,W.build('ash').tiles);
 for(const [x,y,r]of[[72,72,'village'],[44,85,'town'],[42,58,'forest'],[130,32,'cracked'],[142,53,'mountains']])assert.equal(W.regionAt(x,y),r);
 for(const id of ['home','farm','town','act1-cave','act1-north','chest-apple','chest-stone-throw','chest-stone-block','farmers-channels','three-witnesses','changing-forest','stone-mechanism','northern-passage','animal-clue-1','animal-clue-2','runaway-animal','animal-pen','blocked-footpath'])assert.ok(a.landmarks.some(p=>p.id===id),id);
});
test('authored regions control lookup, tiles, returned bounds and safe enemy habitats',{skip:!W},()=>{
 const definition={regions:[{id:'outer',kind:'mountains',bounds:{x1:0,y1:0,x2:143,y2:143}},{id:'green',kind:'forest',bounds:{x1:20,y1:20,x2:120,y2:120}},{id:'home-village',kind:'village',mapId:'home-village',bounds:{x1:60,y1:60,x2:84,y2:84}},{id:'new-town',kind:'town',mapId:'new-town',bounds:{x1:85,y1:50,x2:95,y2:60}}]};
 const before=JSON.stringify(definition),w=W.build('regions',definition);
 assert.equal(W.regionAt(30,60),'forest');assert.equal(W.regionAt(30,60,definition),'forest');assert.equal(W.regionAt(10,60,definition),'mountains');assert.equal(w.tiles[60*144+30].region,'forest');
 assert.deepEqual(w.homeBounds,{left:60,right:84,top:60,bottom:84});assert.deepEqual(w.regions.find(r=>r.id==='green').bounds,definition.regions[1].bounds);assert.equal(w.regions.length,4);
 for(const e of w.enemies)assert.ok(!['village','town'].includes(W.regionAt(e.x,e.y,definition)),e.id+' is in authored safe region');
 assert.equal(JSON.stringify(definition),before);assert.equal(W.regionAt(72,72,{regions:[]}),'mountains');
});
test('explicit authored entity arrays remove excluded defaults and drafts rather than reinstalling them',{skip:!W},()=>{
 const definition={npcs:[],chests:[{id:'chest-apple',status:'draft',x:59,y:72}],puzzles:[],passages:[]},w=W.build('removed',definition);
 assert.equal(w.villagers.length,0);assert.equal(w.passages.length,0);assert.equal(w.landmarks.filter(p=>['chest','puzzle','passage'].includes(p.kind)).length,0);
 assert.ok(W.build('fallback',{chests:[]}).villagers.some(p=>p.id==='mara'));assert.equal(W.build('fallback',{chests:[]}).landmarks.filter(p=>p.kind==='chest').length,0);
});
test('authored edge positions remain reachable and mechanic kinds cannot replace interaction kinds',{skip:!W},()=>{
 const input={npcs:[{id:'mara',x:0,y:0,name:'Mara by the edge'}],puzzles:[{id:'changing-forest',kind:'sequence',x:1,y:142}],chests:[{id:'custom-chest',x:143,y:143,name:'Edge chest'}],passages:[{id:'passage-9',x:0,y:143}]},before=JSON.stringify(input),w=W.build('edits',input),seen=reachable(w);
 assert.equal(JSON.stringify(input),before);
 assert.deepEqual([w.villagers.find(p=>p.id==='mara').x,w.villagers.find(p=>p.id==='mara').y],[0,0]);
 for(const id of ['changing-forest','custom-chest','passage-9']){const p=w.landmarks.find(p=>p.id===id);assert.ok(p,id);assert.ok(seen.has(p.y*144+p.x));}
 assert.equal(w.landmarks.find(p=>p.id==='changing-forest').kind,'puzzle');
 assert.deepEqual(w.passages.find(p=>p.id==='passage-9').x,0);
});
test('browser script exposes the same dependency-free world API',{skip:!W},()=>{
 const vm=require('node:vm'),fs=require('node:fs'),sandbox={};vm.runInNewContext(fs.readFileSync(__dirname+'/act1-world.js','utf8'),sandbox);const w=sandbox.Act1World.build('browser');assert.equal(w.tiles.length,20736);assert.equal(w.landmarks.find(p=>p.id==='home').x,72);
});
test('fallen footpath has physical blockers and a walkable detour before Pickaxe clearing',{skip:!W},()=>{
 const w=W.build('shortcut'),site=w.landmarks.find(p=>p.id==='blocked-footpath');
 assert.ok(!walk(w.tiles[50*144+88]));assert.ok(!walk(w.tiles[50*144+94]));
 assert.ok(walk(w.tiles[site.y*144+site.x]));
 assert.ok(reachable(w).has(50*144+95));
 for(const e of w.enemies)assert.ok(walk(w.tiles[e.y*144+e.x]),e.id+' spawned on fallen branches');
 // Runtime's recorded Pickaxe effect opens precisely this seven-tile row.
 for(let x=88;x<=94;x++)w.tiles[50*144+x]={type:'path',v:0};
 assert.ok(Array.from({length:9},(_,i)=>w.tiles[50*144+87+i]).every(walk));
});
test('the default world has a visible solid mountain enclosure beyond its nine interior entrances',{skip:!W},()=>{
 const w=W.build('mountain-enclosure');for(let y=0;y<144;y++)for(let x=0;x<144;x++)if(x<3||y<3||x>140||y>140)assert.equal(w.tiles[y*144+x].type,'mountain',x+','+y);
 const seen=reachable(w);assert.equal(w.passages.length,9);for(const p of w.passages)assert.ok(seen.has(p.y*144+p.x));
});
