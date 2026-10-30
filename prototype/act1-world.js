(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory();else root.Act1World=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const SIZE=144;
 const inside=(x,y,b)=>x>=b.left&&x<=b.right&&y>=b.top&&y<=b.bottom;
 const DEFAULT_REGIONS=[
  {id:'mountains',kind:'mountains',name:'Outer Mountains',bounds:{x1:0,y1:0,x2:143,y2:143}},
  {id:'cracked',kind:'cracked',name:'Cracked Lands',parentId:'mountains',bounds:{x1:5,y1:5,x2:138,y2:138}},
  {id:'forest',kind:'forest',name:'Living Forest',parentId:'cracked',bounds:{x1:25,y1:25,x2:118,y2:118}},
  {id:'home-village',kind:'village',name:'Home Village',mapId:'home-village',parentId:'forest',bounds:{x1:61,y1:61,x2:83,y2:83}},
  {id:'millers-cross',kind:'town',name:"Miller's Cross",mapId:'millers-cross',parentId:'forest',bounds:{x1:40,y1:81,x2:48,y2:89}}
 ];
 const owns=(object,key)=>object&&Object.prototype.hasOwnProperty.call(object,key);
 function regionsFor(definition){
  const source=owns(definition,'regions')?definition.regions:DEFAULT_REGIONS;
  if(!Array.isArray(source))throw new Error('Invalid regions: expected an array');
  return source.filter(r=>r.status!=='draft').map(region=>{
   const r=JSON.parse(JSON.stringify(region)),b=r.bounds;
   if(!b||![b.x1,b.x2,b.y1,b.y2].every(Number.isInteger)||b.x1<0||b.y1<0||b.x2>=SIZE||b.y2>=SIZE||b.x1>b.x2||b.y1>b.y2||!['village','town','forest','cracked','mountains'].includes(r.kind))throw new Error('Invalid region: '+r.id);
   return {...r,left:b.x1,right:b.x2,top:b.y1,bottom:b.y2,safe:r.safe===true||['village','town'].includes(r.kind)};
  });
 }
 function lookup(regions,x,y){return regions.filter(r=>inside(x,y,r)).sort((a,b)=>Number(b.safe)-Number(a.safe)||(a.right-a.left+1)*(a.bottom-a.top+1)-(b.right-b.left+1)*(b.bottom-b.top+1))[0];}
 function regionAt(x,y,definition){const region=lookup(regionsFor(definition),x,y);return region?region.kind:'mountains';}
 function randomFor(seed){let s=2166136261;for(const c of String(seed)){s^=c.charCodeAt(0);s=Math.imul(s,16777619);}return function(){s+=0x6D2B79F5;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
 function build(seed,definition){
  const rand=randomFor(seed),tiles=[],landmarks=[],passages=[],spawn={x:72,y:74},regions=regionsFor(definition);
  const regionCells=[],safeCells=[];
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){const r=lookup(regions,x,y),k=y*SIZE+x;regionCells[k]=r?r.kind:'mountains';safeCells[k]=!!(r&&r.safe);}
  const at=(x,y)=>regionCells[y*SIZE+x]||'mountains',safe=(x,y)=>safeCells[y*SIZE+x]===true;
  const set=(x,y,type)=>{if(x>=0&&y>=0&&x<SIZE&&y<SIZE)tiles[y*SIZE+x]={type,v:Math.floor(rand()*4),region:at(x,y)};};
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
   const region=at(x,y),r=rand();let type='grass';
   if(region==='forest'&&r<.27)type='tree';
   if(region==='cracked'&&r<.17)type='mountain';
   if(region==='mountains'&&r<.62)type='mountain';
   // A regular system of broad glades joins the natural terrain. No isolated floor pockets.
   if(x%6<2||y%6<2)type='grass';
   // Glades stop before the enclosure; only an explicitly authored edge approach can cut through it.
   if(x<3||y<3||x>140||y>140)type='mountain';
   set(x,y,type);
  }
  function clear(x,y,r=2,type='clearing'){for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)set(x+dx,y+dy,type);}
  function road(a,b){let x=a.x,y=a.y;clear(x,y,1,'path');while(x!==b.x){x+=Math.sign(b.x-x);clear(x,y,1,'path');}while(y!==b.y){y+=Math.sign(b.y-y);clear(x,y,1,'path');}}
  function site(id,name,x,y,kind,extra){const p={id,name,x,y,kind,...extra};landmarks.push(p);return p;}
  site('home','Your Home',72,72,'safe',{desc:'Rest and collect your travelling equipment.'});
  site('farm','Village Fields',72,64,'farm');site('town',"Miller's Cross",44,85,'town',{mapId:'millers-cross'});
  site('act1-cave','The Living Cave',106,35,'story');site('act1-north','Northern Watch',72,7,'story');
  site('chest-apple','Orchard Chest',59,72,'chest');site('chest-stone-throw','Forest Stone Chest',43,55,'chest');site('chest-stone-block','Cave Stone Chest',110,32,'chest');
  site('farmers-channels',"The Farmer's Channels",77,65,'puzzle');site('three-witnesses','Three Witnesses',68,68,'puzzle');site('changing-forest','The Changing Forest',42,58,'puzzle');site('stone-mechanism','The Stone Mechanism',103,40,'puzzle');site('northern-passage','Northern Switches',74,14,'puzzle');
  site('animal-clue-1','Tracks by the Fields',61,65,'story');site('animal-clue-2','Tracks toward the Forest',54,62,'story');site('runaway-animal','The Runaway Animal',49,62,'story');site('animal-pen','Animal Pen',64,71,'farm');site('blocked-footpath','The Fallen Branches',91,50,'story');
  site('bakery','The Hearth and Loaf',68,76,'shop',{shop:'food'});site('cards','The Cardkeeper',77,76,'shop',{shop:'cards'});site('inn','The Wayfarer Inn',72,79,'safe');
  const coordinates=[[72,5],[116,18],[138,53],[138,104],[100,138],[40,138],[5,98],[5,42],[32,8]];
  coordinates.forEach(([x,y],i)=>{const p={id:'passage-'+(i+1),name:i===0?'The Northern Passage':'Distant Passage '+(i+1),x,y,northern:i===0,kind:'passage',desc:i===0?'A physical route toward the northern heights.':'A route to a future act. Continue exploring this land for now.'};passages.push(p);landmarks.push({...p});});
  const villagers=[
   {id:'mara',name:'Mara',role:'neighbor',x:69,y:67,color:'#c98972',text:'Please help me find the child. We can talk whenever you are ready.'},
   {id:'act1-ivo',name:'Ivo the map-giver',role:'map-giver',x:75,y:68,color:'#bfa46e',text:'A local map describes this village. Explore to learn what lies beyond it.'},
   {id:'act1-tessa',name:'Tessa the card guide',role:'card-guide',x:76,y:76,color:'#a19ab8',text:'Your Bustagam holds every card. Put the cards you need in your satchel.'},
   {id:'nell',name:'Nell the farmer',role:'farmer',x:77,y:66,color:'#b8b57a',text:'A runaway animal left tracks by the fields. Can you bring it home?'},
   {id:'town-map-giver',name:'Orin the town map-giver',role:'map-giver',x:44,y:86,color:'#bfa46e',text:"This map shows Miller's Cross, a different settlement from your home village."},
   {id:'town-card-guide',name:'Ada the card guide',role:'card-guide',x:46,y:85,color:'#a19ab8',text:'Equipment can be rearranged before an encounter.'}
  ];
  const animals=[{id:'act1-village-dog',name:'Clover',species:'dog',x:65,y:72,homeX:65,homeY:72},{id:'act1-village-cat',name:'Pebble',species:'cat',x:70,y:77,homeX:70,homeY:77},{id:'act1-runaway',name:'Runaway Sheep',species:'sheep',x:49,y:62,homeX:64,homeY:71}];
  // Explicit exported groups are authoritative, including empty groups. Defaults only fill absent properties.
  if(definition){
   for(const [key,target,kind]of [['npcs',villagers,null],['chests',landmarks,'chest'],['puzzles',landmarks,'puzzle'],['passages',passages,'passage']]){
    if(!owns(definition,key))continue;
    if(!Array.isArray(definition[key]))throw new Error('Invalid entity list: '+key);
    const defaults=target.map(p=>({...p}));
    if(kind)for(let i=landmarks.length-1;i>=0;i--)if(landmarks[i].kind===kind)landmarks.splice(i,1);
    if(target!==landmarks)target.length=0;
    for(const entry of definition[key]){if(entry.status==='draft'||!Number.isInteger(entry.x)||!Number.isInteger(entry.y)||entry.x<0||entry.y<0||entry.x>=SIZE||entry.y>=SIZE)continue;const previous=defaults.find(p=>p.id===entry.id),data={...previous,...JSON.parse(JSON.stringify(entry)),...(kind?{kind}:{})};target.push(data);if(key==='passages')landmarks.push({...data});}
   }
  }
  // Radial roads are three tiles wide; actors cannot seal an entire route.
  for(const p of landmarks){road(spawn,p);clear(p.x,p.y,2);}
  for(const p of [...villagers,...animals]){road(spawn,p);clear(p.x,p.y,1);}
  for(const r of regions.filter(r=>r.safe))for(let y=r.top;y<=r.bottom;y++)for(let x=r.left;x<=r.right;x++)if(tiles[y*SIZE+x].type!=='path')set(x,y,'grass');
  for(let y=62;y<=64;y++)for(let x=69;x<=75;x++)set(x,y,'farm');
  for(let y=70;y<=72;y++)for(let x=63;x<=65;x++)set(x,y,'pen');
  const enemies=[{id:'act1-road-thief',type:'thief',name:'Road Thief',x:88,y:55},{id:'act1-cave-monster',type:'cave-monster',name:'Living Cave Monster',x:106,y:36},{id:'act1-air-monster',type:'air-monster',name:'Northern Air Monster',x:72,y:9}];
  road({x:88,y:55},{x:91,y:50});road(spawn,{x:88,y:55});clear(106,36,2);clear(72,9,2);
  const footpath=landmarks.find(p=>p.id==='blocked-footpath');
  if(footpath){
   // The Pickaxe opens a shorter straight row. Two parallel lanes keep it optional.
   for(let dx=-4;dx<=4;dx++){set(footpath.x+dx,footpath.y-1,'path');set(footpath.x+dx,footpath.y+1,'path');set(footpath.x+dx,footpath.y,Math.abs(dx)>0&&Math.abs(dx)<=3?'tree':'path');}
  }
  // A safe-region edit can cover a former fixed encounter. Move it to the closest eligible approach.
  for(const enemy of enemies)if(safe(enemy.x,enemy.y)){
   const candidates=[];for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)if(!safe(x,y)&&!['tree','mountain','water'].includes(tiles[y*SIZE+x].type)&&(enemy.type!=='thief'||tiles[y*SIZE+x].type==='path')&&![...landmarks,...villagers,...animals,...enemies].some(p=>p!==enemy&&p.x===x&&p.y===y))candidates.push({x,y});
   candidates.sort((a,b)=>Math.abs(a.x-enemy.x)+Math.abs(a.y-enemy.y)-Math.abs(b.x-enemy.x)-Math.abs(b.y-enemy.y));
   if(candidates[0])Object.assign(enemy,candidates[0]);
  }
  for(let i=enemies.length-1;i>=0;i--)if(safe(enemies[i].x,enemies[i].y))enemies.splice(i,1);
  const used=new Set([...landmarks,...villagers,...animals,...enemies].map(e=>e.x+','+e.y));
  const roads=[],forest=[];
  for(let y=3;y<141;y++)for(let x=3;x<141;x++){const region=at(x,y),t=tiles[y*SIZE+x].type;if(used.has(x+','+y)||safe(x,y)||landmarks.some(p=>Math.abs(p.x-x)+Math.abs(p.y-y)<4))continue;if(t==='path')roads.push({x,y});else if(region==='forest'&&t==='grass')forest.push({x,y});}
  for(const type of ['thief','boar','bear'])for(let n=0;n<5;n++){
   const candidates=(type==='thief'?roads:forest).filter(p=>!used.has(p.x+','+p.y)&&enemies.every(e=>Math.abs(e.x-p.x)+Math.abs(e.y-p.y)>=4));
   const p=candidates[Math.floor(rand()*candidates.length)];if(p){used.add(p.x+','+p.y);enemies.push({id:'act1-'+type+'-'+(n+1),type,name:type==='thief'?'Road Thief':type==='boar'?'Wild Boar':'Forest Bear',...p});}
  }
  // Join any enclosed natural floor to a glade. Carving only adds walkable tiles.
  const walk=t=>!['tree','water','mountain'].includes(t.type),seen=new Set([spawn.y*SIZE+spawn.x]),queue=[spawn.y*SIZE+spawn.x];
  function flood(){for(let i=0;i<queue.length;i++){const k=queue[i],x=k%SIZE,y=Math.floor(k/SIZE);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=y+dy,j=b*SIZE+a;if(a>=0&&b>=0&&a<SIZE&&b<SIZE&&!seen.has(j)&&walk(tiles[j])){seen.add(j);queue.push(j);}}}}
  flood();for(let k=0;k<tiles.length;k++)if(walk(tiles[k])&&!seen.has(k)){const x=k%SIZE,y=Math.floor(k/SIZE),target=Math.max(6,Math.min(138,x-x%6));for(let a=x;;a+=Math.sign(target-x)){set(a,y,'grass');if(a===target)break;}seen.add(k);queue.length=0;queue.push(k);flood();}
  const homeRegion=regions.find(r=>r.mapId==='home-village'||r.kind==='village');
  return {size:SIZE,tiles,landmarks,regions,passages,spawn,homeBounds:homeRegion?{left:homeRegion.left,right:homeRegion.right,top:homeRegion.top,bottom:homeRegion.bottom}:null,villagers,animals,enemies};
 }
 return {build,regionAt};
});
