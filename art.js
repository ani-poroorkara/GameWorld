'use strict';
// Shared sprite loading, stable foot anchors, nearest-neighbor rendering and portraits.
const WorldArt=(()=>{
 const sources=new Map(),cache=new Map(),groundCache=new Map();let loaded=false,error=null;
 const headless=typeof Image==='undefined';
 const sourceURL=name=>globalThis.MYWORLD_EMBEDDED_ART?.[name]||ART_MANIFEST.sources[name].file;
 const reduced=()=>typeof preferences!=='undefined'&&(preferences.reduceMotion||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
 function draw(g,name,frame,x,y,height,{normalize=false,alpha=1}={}){
  if(headless)return;
  const meta=ART_MANIFEST.sources[name],image=sources.get(name);if(!image||!meta)return;
  const f=meta.frames[frame]||meta.frames[0],factor=height/(normalize?meta.maxHeight:f.h),w=Math.max(1,Math.round(f.w*factor)),h=Math.max(1,Math.round(f.h*factor));
  // Cache at 2× the intended display size to preserve detail on high-DPI screens.
  const key=`${name}:${frame}:${w}:${h}`;let painted=cache.get(key);
  if(!painted){painted=document.createElement('canvas');painted.width=w*2;painted.height=h*2;const p=painted.getContext('2d');p.imageSmoothingEnabled=false;p.drawImage(image,f.x,f.y,f.w,f.h,0,0,w*2,h*2);cache.set(key,painted);}
  g.save();g.imageSmoothingEnabled=false;g.globalAlpha*=alpha;g.drawImage(painted,Math.round(x-w/2),Math.round(y-h),w,h);g.restore();
 }
 function portrait(name,frame,label){const meta=ART_MANIFEST.sources[name],f=meta.frames[frame]||meta.frames[0];return `<svg viewBox="${f.x} ${f.y} ${f.w} ${f.h}" role="img" aria-label="${label}" class="sprite-portrait" shape-rendering="crispEdges"><image href="${sourceURL(name)}" width="${meta.width}" height="${meta.height}" style="image-rendering:pixelated" /></svg>`;}
 function frame(row=0,walking=false,time=0){return row*3+(walking&&!reduced()?[0,1,2,1][Math.floor(time/135)%4]:1);}
 const readyPromise=headless?Promise.resolve():Promise.all(Object.keys(ART_MANIFEST.sources).map(async name=>{const image=new Image();image.src=sourceURL(name);await image.decode();sources.set(name,image);})).then(()=>{loaded=true;document.getElementById('artLoading')?.setAttribute('hidden','');}).catch(cause=>{error=cause;const message=document.getElementById('artLoading');if(message){message.hidden=false;message.textContent='The artwork could not load. Refresh the page to try again.';}console.error('Sprite assets failed to load',cause);throw cause;});
 if(headless)loaded=true;
 // The approved preview uses code-drawn ground with the same texture and color ramps.
 const colorSets={woodland:{grass:['#7c8c40','#7f8f43','#829146','#879548'],tuft:['#617534','#a1aa54'],path:['#baa367','#c1aa6b','#bea76a','#c6ae73'],sand:['#c4b17b','#c8b47d','#c2ac72','#cbbb8b'],water:['#4e7970','#527d73','#507a72','#547e74'],farm:['#766039','#7d653b','#80683d','#755c35']},autumn:{grass:['#96904b','#9b9450','#928b47','#a09852'],tuft:['#756a37','#c4ac65'],path:['#c0a26a','#c9ae74','#bea367','#cbb17a'],sand:['#cabb89','#c1b17c','#c6b37e','#d0c08c'],water:['#4f746d','#52766e','#4d726c','#557971'],farm:['#7d6039','#86673e','#80643b','#755b35']},frost:{grass:['#a8bbae','#b0c1b4','#a6b9ac','#b6c7bb'],tuft:['#7e9a8c','#d5dfc8'],path:['#b7b89b','#bdbea1','#b6b59c','#c6c7ac'],sand:['#c7d0bc','#c5ceba','#c9d4bf','#d1dac7'],water:['#5f909a','#63949d','#5a8b97','#6596a0'],farm:['#7c7b63','#85846b','#817d64','#77755e']}};
 function random(x,y,s=0){let n=Math.imul(x+1,374761393)^Math.imul(y+7,668265263)^Math.imul(s+17,144269);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;}
 function ground(g,tile,x,y,t,tx,ty,climate,neighbors){
  if(headless)return;
  const kind=['path','sand','water','farm'].includes(tile.type)?tile.type:'grass',variant=(tx*7+ty*11)&7;
  const mask=neighbors||0,key=`${climate}:${kind}:${variant}:${mask}`;let c=groundCache.get(key);
  if(!c){c=document.createElement('canvas');c.width=c.height=32;const p=c.getContext('2d'),colors=colorSets[climate]||colorSets.woodland,ramp=colors[kind],px=(a,b,w,h,color)=>{p.fillStyle=color;p.fillRect(a,b,w,h);};
   for(let b=0;b<32;b++)for(let a=0;a<32;a++){
    let palette=ramp;
    // Ragged grass fringes soften path edges while preserving the tile's walkability.
    if(kind==='path'&&(((mask&1)&&b<2+random(a,variant,2)*2)||((mask&2)&&a>28-random(b,variant,3)*2)||((mask&4)&&b>28-random(a,variant,4)*2)||((mask&8)&&a<2+random(b,variant,5)*2)))palette=colors.grass;
    px(a,b,1,1,palette[Math.floor(random(a+variant*33,b,3)*palette.length)]);
   }
   if(kind==='grass')for(let i=0;i<17;i++){const a=1+Math.floor(random(i,variant,11)*29),b=3+Math.floor(random(i,variant,13)*27);px(a,b,4,1,colors.tuft[0]);px(a,b-2,1,2,colors.tuft[0]);px(a+2,b-3,1,3,colors.tuft[1]);px(a+3,b-1,1,1,colors.tuft[1]);}
   if(kind==='grass'&&variant===3){px(18,21,1,4,colors.tuft[0]);px(17,19,3,3,'#e1d7a3');px(16,20,5,1,'#e1d7a3');px(18,20,1,1,'#caa250');}
   if(kind==='path'||kind==='sand')for(let i=0;i<8;i++){const a=Math.floor(random(i,variant,19)*31),b=Math.floor(random(i,variant,23)*31);px(a,b,2,1,climate==='frost'?'#9ca88e':'#9c8858');px(a,b-1,2,1,climate==='frost'?'#d8dec7':'#d5bd84');}
   if(kind==='water')for(let i=0;i<5;i++){const a=2+Math.floor(random(i,variant,31)*22),b=2+i*6;px(a,b,5,1,'#a9c8b76a');px(a+5,b-1,2,1,'#b6d5c148');}
   if(kind==='farm')for(let row=0;row<3;row++){px(1,row*10+6,30,3,'#534b2e');px(1,row*10+5,30,1,'#a0824c');}
   groundCache.set(key,c);
  }
  g.imageSmoothingEnabled=false;g.drawImage(c,Math.round(x),Math.round(y),Math.ceil(t),Math.ceil(t));
 }
 return {draw,portrait,frame,ground,get ready(){return loaded;},get error(){return error;},readyPromise,manifest:ART_MANIFEST,sourceURL};
})();
// Loading failures are reported in the page; prevent an unhandled rejection at startup.
WorldArt.readyPromise.catch(()=>{});
