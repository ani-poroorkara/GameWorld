'use strict';
// Original low-resolution artwork. Integer pixels, small palettes and strong silhouettes.
const cuteSpriteCache=new Map();
function makeCuteSprite(kind,gender='male'){
 if(!document.createElement)return null;
 const key=kind+gender;if(cuteSpriteCache.has(key))return cuteSpriteCache.get(key);
 const image=document.createElement('canvas');image.width=40;image.height=40;const g=image.getContext('2d');g.imageSmoothingEnabled=false;
 const box=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
 const ellipse=(cx,cy,rx,ry,c)=>{for(let y=Math.floor(cy-ry);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++)if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1)box(x,y,1,1,c)};
 const ink='#22222c',skin='#edb783',shade='#ce8f61';
 if(['hero','thief','guardian','villager'].includes(kind)){
  const hair=kind==='thief'?'#323a4d':kind==='guardian'?'#63767b':'#513d38',hairLight=kind==='thief'?'#50617a':kind==='guardian'?'#9fadb0':'#85604b',cloth=kind==='thief'?'#35445a':kind==='guardian'?'#71858b':gender==='female'?'#5b927d':'#b38948',light=kind==='thief'?'#67758c':kind==='guardian'?'#b8c7bd':gender==='female'?'#8cb49b':'#dfb76c';
  box(12,3,16,2,ink);box(9,5,22,3,ink);box(7,8,26,15,ink);box(10,23,20,12,ink);box(11,34,8,5,ink);box(22,34,8,5,ink);
  box(10,8,20,13,kind==='guardian'?'#889a98':skin);box(10,15,3,6,kind==='guardian'?'#71817f':shade);box(14,19,14,2,kind==='guardian'?'#b1bba9':'#f6c996');
  box(11,5,17,3,hair);box(9,8,22,3,hair);box(9,10,5,5,hair);box(12,6,12,2,hairLight);box(24,8,7,3,hairLight);box(8,10,3,10,hair);
  if(gender==='female'&&['hero','villager'].includes(kind)){box(8,17,4,7,hair);box(28,12,4,12,hair);box(29,15,2,6,hairLight)}
  box(16,13,2,4,kind==='guardian'?'#f2d76e':ink);box(24,13,2,4,kind==='guardian'?'#f2d76e':ink);box(15,17,3,1,'#df946f');
  if(kind==='thief'){box(12,17,17,4,hair);box(15,18,11,1,hairLight)}
  box(12,23,16,9,cloth);box(12,24,4,6,light);box(17,23,7,2,light);box(16,30,13,2,kind==='guardian'?'#59676b':'#77523a');box(20,30,3,2,'#e2bf70');
  box(8,24,4,8,ink);box(29,24,4,8,ink);box(9,25,3,5,cloth);box(29,25,3,5,cloth);box(9,30,3,2,skin);box(29,30,3,2,skin);
  box(13,33,5,4,'#4d5964');box(23,33,5,4,'#4d5964');box(12,37,6,1,'#89664b');box(23,37,6,1,'#89664b');
 }else{
  const species=kind,base={bear:'#8e6746',boar:'#a65f2c',ox:'#ac6328',horse:'#986a46',sheep:'#ded7bf',dog:'#b48b4e',cat:'#777c85',fox:'#c97932',rabbit:'#c4b49d',chicken:'#e6dcc5'}[species]||'#a65f2c';
  const hi={bear:'#b99866',boar:'#d88a39',ox:'#db8b33',horse:'#bf9465',sheep:'#f5ecd6',dog:'#ddba7a',cat:'#a4a5a7',fox:'#eba64b',rabbit:'#e3d7bb',chicken:'#fff2d4'}[species]||'#d88a39';
  const dark={bear:'#5c402e',boar:'#713d26',ox:'#7f4125',horse:'#684733',sheep:'#aaa58d',dog:'#7b593b',cat:'#4f5864',fox:'#934a28',rabbit:'#988b76',chicken:'#b3a993'}[species]||'#713d26';
  const small=['cat','dog','fox','rabbit','chicken'].includes(species),legBottom=species==='horse'?36:33;
  for(const x of [14,20,28,33]){box(x,24,4,legBottom-24,ink);box(x+1,24,2,legBottom-26,dark);box(x,legBottom-2,4,2,ink);box(x+1,legBottom-2,1,1,'#82817a')}
  ellipse(24,20,13,9,ink);ellipse(24,19,12,7,base);ellipse(24,16,10,4,hi);ellipse(26,24,10,3,dark);box(18,18,15,4,base);box(20,14,8,2,hi);
  if(species==='sheep'){for(const [x,y]of[[16,15],[22,12],[29,13],[33,18],[18,21],[25,19],[29,24]]){ellipse(x,y,4,4,ink);ellipse(x,y-1,3,3,hi)}}
  ellipse(10,19,8,9,ink);ellipse(10,18,7,7,base);box(5,15,7,4,hi);box(8,21,8,4,dark);
  box(4,8,4,7,ink);box(5,10,2,4,base);box(12,7,5,7,ink);box(13,9,3,4,hi);
  if(species==='bear'){ellipse(5,9,4,4,ink);ellipse(5,9,2,2,base);ellipse(15,9,4,4,ink);ellipse(15,9,2,2,base)}
  if(species==='rabbit'){box(4,2,4,11,ink);box(5,3,2,10,hi);box(12,1,4,12,ink);box(13,3,2,8,'#c49b90')}
  if(species==='horse'){box(6,4,4,10,ink);box(13,4,4,10,ink);box(7,6,2,7,hi);box(3,15,4,9,dark)}
  ellipse(6,25,6,4,ink);ellipse(6,24,5,3,species==='boar'||species==='ox'?'#b8ac94':hi);box(2,23,2,2,ink);box(8,23,2,2,ink);box(4,27,5,1,dark);
  box(7,16,2,3,ink);box(13,16,2,3,ink);box(7,16,1,1,'#fff1ce');box(13,16,1,1,'#fff1ce');
  if(species==='boar'){box(1,21,2,5,'#f2e4bd');box(2,20,1,2,'#fff2cd');box(13,22,2,5,'#f2e4bd');box(14,20,1,4,'#fff2cd');box(18,11,4,2,ink);box(23,10,4,2,ink);box(28,12,4,2,ink)}
  if(species==='ox'){for(const x of [0,15]){box(x,10,5,3,ink);box(x,5,3,7,ink);box(x+1,6,2,6,'#c6bca3');box(x+2,10,3,2,'#ebe1c6')}}
  if(species==='fox'||species==='cat'||species==='dog'){box(36,17,3,9,ink);box(35,24,3,4,ink);box(36,18,2,8,base);if(species==='fox')box(36,16,3,4,'#eee0bb')}
  if(species==='chicken'){ellipse(19,20,10,10,ink);ellipse(19,19,9,8,hi);box(9,18,6,4,'#deb45d');box(12,9,5,6,'#c65745');box(16,16,2,3,ink);box(15,32,3,3,'#d8a34c');box(24,32,3,3,'#d8a34c')}
  if(species==='cat'){g.clearRect(0,5,19,25);ellipse(9,18,8,8,ink);ellipse(9,18,7,6,base);box(2,8,5,8,ink);box(3,10,3,5,hi);box(12,8,5,8,ink);box(13,10,3,5,hi);box(5,16,2,3,'#b6ca79');box(12,16,2,3,'#b6ca79');box(6,17,1,2,ink);box(12,17,1,2,ink);box(9,21,2,1,'#c68b83');box(2,21,4,1,'#ded8c7');box(14,21,4,1,'#ded8c7')}
  if(species==='chicken'){g.clearRect(0,0,40,40);ellipse(23,23,11,9,ink);ellipse(22,22,10,8,hi);ellipse(14,16,7,8,ink);ellipse(14,16,6,6,hi);box(11,5,3,7,'#bd5144');box(15,7,3,5,'#d66e4e');box(5,16,6,4,'#e2ad48');box(13,14,2,3,ink);ellipse(25,23,5,4,base);box(18,30,2,5,'#bc8e44');box(27,30,2,5,'#bc8e44');box(16,34,5,1,'#bc8e44');box(25,34,5,1,'#bc8e44');box(32,14,4,9,ink);box(33,15,2,6,base)}
 }
 cuteSpriteCache.set(key,image);return image;
}
function paintCuteSprite(kind,x,y,t,gender='male',flip=false){const image=makeCuteSprite(kind,gender);if(!image)return false;const humanoid=['hero','guardian','thief','villager'].includes(kind),size=t*(humanoid?1.5:['horse','boar','bear','ox','sheep'].includes(kind)?1.6:1.1);ctx.save();ctx.imageSmoothingEnabled=false;const bounce=kind==='hero'&&!combat&&performance.now()<motion.walkUntil&&!preferences.reduceMotion&&!reducedMotion?.matches?Math.sin(performance.now()/60)*t*.025:0;ctx.translate(Math.round(x),Math.round(y+t*.48+bounce));if(flip)ctx.scale(-1,1);ctx.fillStyle='#14251b50';ctx.beginPath();ctx.ellipse(0,0,size*.32,size*.09,0,0,7);ctx.fill();const rows=humanoid?39:kind==='horse'?36:34,drawHeight=size*rows/40;ctx.drawImage(image,0,0,40,rows,Math.round(-size/2),Math.round(-drawHeight),Math.round(size),Math.round(drawHeight));if(typeof mapSpriteHitFlash==='function'){const flash=mapSpriteHitFlash(kind,x,y,t);if(flash){ctx.globalAlpha=flash;ctx.filter='brightness(1.9)';ctx.drawImage(image,0,0,40,rows,Math.round(-size/2),Math.round(-drawHeight),Math.round(size),Math.round(drawHeight))}}ctx.restore();return true}
const oldMapPlayer=player;player=function(x,y,t){if(!paintCuteSprite('hero',x,y,t,state.character.gender,motion.facing<0))oldMapPlayer(x,y,t)};
const oldMapAnimal=drawAnimal;drawAnimal=function(a,x,y,t,following=false){if(!paintCuteSprite(a.species,x,y,t,'male',following&&motion.facing<0))oldMapAnimal(a,x,y,t,following)};
const oldMapEnemy=drawEnemy;drawEnemy=function(e,x,y,t){if(!paintCuteSprite(e.type,x,y,t,'male',!!(combat?.onMap&&state.x>e.x)))oldMapEnemy(e,x,y,t);else if(!combat){ctx.font=Math.max(9,t*.19)+'px Georgia';ctx.textAlign='center';ctx.fillStyle='#f1d8a9';ctx.fillText(e.name,x,y-t*1.1)}};

const oldMapVillager=drawVillager;drawVillager=function(n,x,y,t){const gender=['mara','tess','sage'].includes(n.id)?'female':'male';if(!paintCuteSprite('villager',x,y,t,gender))oldMapVillager(n,x,y,t)};

const oldCutePortrait=characterPortrait;characterPortrait=function(gender){const image=makeCuteSprite('hero',gender);return image?`<img class="cute-avatar" src="${image.toDataURL()}" alt="Generic ${gender} pixel character">`:oldCutePortrait(gender)};
$('travellerAvatar').dataset.gender='';
