'use strict';
(() => {
  const canvas=document.getElementById('scene'),ctx=canvas.getContext('2d');
  const W=960,H=640,keys=new Set(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const byId=id=>document.getElementById(id);
  const player={x:450,y:455,row:0,moving:false,step:0};
  const dog={x:524,y:470,row:1,moving:false,step:0};
  let zoom=1,camera={x:W/2,y:H/2},last=0,target=null,route=[],petUntil=0,started=false,captionTimer;
  const sprites={},objects=[{name:'oak',x:245,y:335,height:330,depth:335},{name:'cottage',x:647,y:292,height:290,depth:292}];
  const petButton=byId('pet'),status=byId('status');
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const rand=(x,y,s=0)=>{let n=Math.imul(x+1,374761393)^Math.imul(y+7,668265263)^Math.imul(s+17,144269);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;};
  const pixel=(g,x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),w,h);};
  function caption(message){byId('caption').textContent=message;byId('caption').classList.remove('hidden');clearTimeout(captionTimer);captionTimer=setTimeout(()=>byId('caption').classList.add('hidden'),4200);}

  // The image is the artwork. Alpha bounds only remove empty padding when drawing it.
  async function loadSprite(name,sheet=false){
    const img=new Image();img.src=`assets/${name}.png`;await img.decode();
    const scan=document.createElement('canvas');scan.width=img.width;scan.height=img.height;
    const g=scan.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0);
    const data=g.getImageData(0,0,img.width,img.height).data;
    const bounds=(sx,sy,sw,sh)=>{
      let left=sw,top=sh,right=-1,bottom=-1;
      for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)if(data[((sy+y)*img.width+sx+x)*4+3]>48){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
      if(right<left)throw new Error(`Empty sprite cell in ${name}`);
      return {x:sx+left,y:sy+top,w:right-left+1,h:bottom-top+1};
    };
    const frames=[];
    if(sheet){const cw=img.width/3,ch=img.height/4;for(let row=0;row<4;row++)for(let col=0;col<3;col++)frames.push(bounds(Math.round(col*cw),Math.round(row*ch),Math.round(cw),Math.round(ch)));}
    else frames.push(bounds(0,0,img.width,img.height));
    sprites[name]={img,frames,maxHeight:Math.max(...frames.map(f=>f.h))};
  }
  function frameFor(entity){return entity.row*3+(entity.moving&&!reduced.matches?[0,1,2,1][Math.floor(entity.step*8)%4]:1);}
  function drawSprite(g,name,index,x,y,height,normalize=false){
    const s=sprites[name],f=s.frames[index],scale=height/(normalize?s.maxHeight:f.h);
    const dw=Math.round(f.w*scale),dh=Math.round(f.h*scale);
    g.drawImage(s.img,f.x,f.y,f.w,f.h,Math.round(x-dw/2),Math.round(y-dh),dw,dh);
  }

  const pathPoints=[[414,670],[425,582],[472,516],[551,450],[605,378],[645,282]];
  function pathDistance(x,y){let best=Infinity;for(let i=1;i<pathPoints.length;i++){
    const [ax,ay]=pathPoints[i-1],[bx,by]=pathPoints[i],dx=bx-ax,dy=by-ay;
    const t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy),0,1);
    best=Math.min(best,Math.hypot(x-ax-t*dx,y-ay-t*dy));
  }return best;}
  function makeGround(){
    const ground=document.createElement('canvas');ground.width=W/2;ground.height=H/2;
    const g=ground.getContext('2d');g.imageSmoothingEnabled=false;
    const grass=['#7c8c40','#7f8f43','#829146','#879548','#7a893d','#8b984b'];
    const soil=['#b9a265','#c1aa6b','#bda669','#c6ae73','#b59e62'];
    for(let y=0;y<H/2;y++)for(let x=0;x<W/2;x++){
      const d=pathDistance(x*2,y*2),ragged=(rand(Math.floor(x/3),Math.floor(y/3),3)-.5)*12;
      const onPath=d<47+ragged,n=rand(x,y,5);
      let color=onPath?soil[Math.floor(n*soil.length)]:grass[Math.floor(rand(Math.floor(x/6),Math.floor(y/6),4)*grass.length)];
      if(!onPath&&n>.96)color='#8d994c';
      if(onPath&&n>.96)color='#d1b981';
      pixel(g,x,y,1,1,color);
    }
    // Small asymmetric clusters avoid a repeated tile/checkerboard pattern.
    for(let i=0;i<3000;i++){
      const x=Math.floor(rand(i,0,19)*(W/2)),y=Math.floor(rand(i,1,23)*(H/2)),d=pathDistance(x*2,y*2);
      if(d<45){if(i%5===0){pixel(g,x,y,2,1,'#958451');pixel(g,x,y-1,2,1,'#d4bd85');}continue;}
      const shade=i%3===0?'#586e32':'#687d37',light=i%4===0?'#acb15b':'#9da64e';
      pixel(g,x,y,4,1,shade);pixel(g,x,y-2,1,2,shade);pixel(g,x+2,y-3,1,3,light);pixel(g,x+3,y-1,1,1,light);if(i%4===0)pixel(g,x-1,y-1,1,1,'#bbc071');
    }
    for(let i=0;i<105;i++){
      const x=8+Math.floor(rand(i,4,22)*(W/2-16)),y=12+Math.floor(rand(i,7,18)*(H/2-24));
      if(pathDistance(x*2,y*2)<57||((x>245&&x<395)&&(y>55&&y<155)))continue;
      pixel(g,x,y,1,4,'#486332');pixel(g,x-2,y+2,2,1,'#607e38');
      const petal=i%5===0?'#dac18e':'#e3d8a5';pixel(g,x-1,y-2,3,3,petal);pixel(g,x-2,y-1,5,1,petal);pixel(g,x,y-1,1,1,'#d0a659');
    }
    return ground;
  }
  const ground=makeGround();
  function shadow(x,y,rx,ry,alpha=.2){ctx.fillStyle=`rgba(37,53,24,${alpha})`;ctx.beginPath();ctx.ellipse(Math.round(x),Math.round(y),rx,ry,0,0,Math.PI*2);ctx.fill();}
  function fence(){
    // Small scene dressing on the same two-pixel grid as the ground.
    const x=744,y=471;
    for(let i=0;i<3;i++){
      const xx=x+i*53;pixel(ctx,xx+4,y+20,62,5,'#3b472735');
      pixel(ctx,xx,y-19,59,9,'#574a2e');pixel(ctx,xx+2,y-19,55,3,'#d0ae68');pixel(ctx,xx+2,y-15,55,3,'#9a7542');
      pixel(ctx,xx,y+1,59,9,'#574a2e');pixel(ctx,xx+2,y+1,55,3,'#c8a25c');pixel(ctx,xx+2,y+5,55,3,'#8a683b');
    }
    for(let i=0;i<4;i++){
      const xx=x-3+i*53;pixel(ctx,xx,y-28,13,52,'#4b452c');pixel(ctx,xx+2,y-30,9,53,'#987440');pixel(ctx,xx+2,y-29,4,48,'#d0ae6b');pixel(ctx,xx+4,y-31,6,2,'#e0c083');pixel(ctx,xx+9,y-24,2,46,'#735531');pixel(ctx,xx+5,y-16,2,2,'#5f4d2f');pixel(ctx,xx+5,y+4,2,2,'#5f4d2f');
    }
  }
  function drawScene(now){
    ctx.imageSmoothingEnabled=false;ctx.fillStyle='#7c8c40';ctx.fillRect(0,0,canvas.width,canvas.height);
    const fit=Math.max(canvas.width/W,canvas.height/H),scale=fit*zoom;
    camera.x=zoom===1&&fit===canvas.width/W?W/2:clamp(player.x,canvas.width/(scale*2),W-canvas.width/(scale*2));
    camera.y=zoom===1&&fit===canvas.height/H?H/2:clamp(player.y,canvas.height/(scale*2),H-canvas.height/(scale*2));
    ctx.save();ctx.translate(Math.round(canvas.width/2-camera.x*scale),Math.round(canvas.height/2-camera.y*scale));ctx.scale(scale,scale);
    ctx.drawImage(ground,0,0,W,H);
    shadow(273,330,113,31,.17);shadow(665,292,144,25,.17);
    shadow(player.x,player.y-2,19,5,.24);shadow(dog.x,dog.y-2,19,5,.2);
    const layers=objects.map(o=>({depth:o.depth,draw:()=>drawSprite(ctx,o.name,0,o.x,o.y,o.height)}));
    layers.push({depth:player.y,draw:()=>drawSprite(ctx,'traveler',frameFor(player),player.x,player.y,85,true)});
    layers.push({depth:dog.y,draw:()=>drawSprite(ctx,'dog',frameFor(dog),dog.x,dog.y,52,true)});
    layers.push({depth:490,draw:fence});layers.sort((a,b)=>a.depth-b.depth).forEach(o=>o.draw());
    if(target){ctx.strokeStyle='#eee0a4';ctx.lineWidth=2/scale;ctx.beginPath();ctx.ellipse(target.x,target.y,8,3,0,0,Math.PI*2);ctx.stroke();}
    if(now<petUntil){const age=reduced.matches?0:1-(petUntil-now)/1400;ctx.globalAlpha=1-age;ctx.fillStyle='#f2d1a0';ctx.font='22px Georgia';ctx.textAlign='center';ctx.fillText('♥',dog.x,dog.y-57-age*35);ctx.globalAlpha=1;}
    ctx.restore();
  }

  // Fixed world coordinates keep collision and movement independent of screen size.
  function blocked(x,y){
    if(x<24||y<55||x>W-24||y>H-18)return true;
    if(x>522&&x<771&&y>137&&y<299)return true;
    if(Math.hypot((x-245)/1.15,y-324)<23)return true;
    if(x>727&&x<925&&y>452&&y<492)return true;
    return false;
  }
  function moveBody(body,dx,dy){
    let moved=false;
    if(!blocked(body.x+dx,body.y)){body.x+=dx;moved=dx!==0;}
    if(!blocked(body.x,body.y+dy)){body.y+=dy;moved=moved||dy!==0;}
    if(moved){if(Math.abs(dx)>Math.abs(dy))body.row=dx<0?1:2;else body.row=dy<0?3:0;}
    return moved;
  }
  const GRID=16,COLS=W/GRID,ROWS=H/GRID;
  function findRoute(dest){
    const start={x:Math.floor(player.x/GRID),y:Math.floor(player.y/GRID)},end={x:Math.floor(dest.x/GRID),y:Math.floor(dest.y/GRID)};
    const id=(x,y)=>y*COLS+x,queue=[start],parents=new Map([[id(start.x,start.y),null]]);let found=null;
    for(let i=0;i<queue.length;i++){
      const n=queue[i];if(n.x===end.x&&n.y===end.y){found=n;break;}
      for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){
        const x=n.x+dx,y=n.y+dy,k=id(x,y);if(x<0||y<0||x>=COLS||y>=ROWS||parents.has(k)||blocked(x*GRID+GRID/2,y*GRID+GRID/2))continue;
        parents.set(k,n);queue.push({x,y});
      }
    }
    if(!found)return [];
    const result=[];let n=found;while(n){result.unshift({x:n.x*GRID+GRID/2,y:n.y*GRID+GRID/2});n=parents.get(id(n.x,n.y));}
    result.shift();result.push(dest);return result;
  }
  function update(dt,now){
    let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
    let dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
    if(dx||dy){target=null;route=[];}
    else if(route.length){const next=route[0],d=Math.hypot(next.x-player.x,next.y-player.y);if(d<4){route.shift();if(!route.length)target=null;}else{dx=(next.x-player.x)/d;dy=(next.y-player.y)/d;}}
    const magnitude=Math.hypot(dx,dy);player.moving=magnitude>0&&moveBody(player,dx/(magnitude||1)*132*dt,dy/(magnitude||1)*132*dt);
    if(player.moving){player.step+=dt;byId('caption').classList.add('hidden');}
    const distance=Math.hypot(player.x-dog.x,player.y-dog.y);
    dog.moving=false;
    if(distance>58){
      // The companion uses the same obstacle-aware route search when direct following is blocked.
      let tx=player.x,ty=player.y;
      const alongBlocked=Array.from({length:8},(_,i)=>blocked(dog.x+(player.x-dog.x)*(i+1)/9,dog.y+(player.y-dog.y)*(i+1)/9)).some(Boolean);
      if(alongBlocked){const savedX=player.x,savedY=player.y;player.x=dog.x;player.y=dog.y;const follow=findRoute({x:savedX,y:savedY});player.x=savedX;player.y=savedY;if(follow.length){tx=follow[0].x;ty=follow[0].y;}}
      const d=Math.hypot(tx-dog.x,ty-dog.y),speed=Math.min(d,155*dt);dog.moving=d>0&&moveBody(dog,(tx-dog.x)/d*speed,(ty-dog.y)/d*speed);if(dog.moving)dog.step+=dt;
    }
    petButton.disabled=distance>105;petButton.style.opacity=distance>105?'.55':'1';
    if(now>petUntil&&status.textContent!=='Your companion will follow you.')status.textContent='Your companion will follow you.';
  }
  function render(now){const dt=Math.min(.04,(now-last)/1000||0);last=now;update(dt,now);drawScene(now);requestAnimationFrame(render);}
  function pet(){if(Math.hypot(player.x-dog.x,player.y-dog.y)>105){caption('Walk a little closer to your companion.');return;}petUntil=performance.now()+1400;status.textContent='A happy tail wag. A friend for the road.';canvas.focus({preventScroll:true});}
  function reset(){Object.assign(player,{x:450,y:455,row:0,moving:false,step:0});Object.assign(dog,{x:524,y:470,row:1,moving:false,step:0});target=null;route=[];keys.clear();caption('Click the ground to explore');canvas.focus({preventScroll:true});}
  function resize(){const box=canvas.getBoundingClientRect();const w=960,h=Math.round(w*box.height/box.width);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}ctx.imageSmoothingEnabled=false;}
  function study(){
    const row=Number(byId('direction').value);
    for(const [name,height]of[['traveler',195],['dog',133],['cottage',203],['oak',210]]){
      const c=byId(name+'-study'),g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);g.imageSmoothingEnabled=false;
      g.fillStyle='#62734922';g.beginPath();g.ellipse(130,213,name==='cottage'?89:45,8,0,0,Math.PI*2);g.fill();
      drawSprite(g,name,name==='traveler'||name==='dog'?row*3+1:0,130,213,height,false);
    }
  }
  const movementKeys=['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'];
  window.addEventListener('keydown',event=>{
    if(['SELECT','BUTTON','INPUT','TEXTAREA'].includes(document.activeElement?.tagName))return;
    const key=event.key.toLowerCase();if(movementKeys.includes(key)){event.preventDefault();keys.add(key);}if(key==='e'&&!event.repeat)pet();
  });
  window.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
  document.addEventListener('visibilitychange',()=>{keys.clear();last=0;});
  canvas.addEventListener('pointerdown',event=>{
    if(!started)return;canvas.focus({preventScroll:true});const box=canvas.getBoundingClientRect(),fit=Math.max(canvas.width/W,canvas.height/H),scale=fit*zoom;
    const x=(event.clientX-box.left)/box.width*canvas.width,y=(event.clientY-box.top)/box.height*canvas.height;
    const dest={x:(x-canvas.width/2)/scale+camera.x,y:(y-canvas.height/2)/scale+camera.y};
    if(blocked(dest.x,dest.y)){caption(dest.x>510&&dest.y<300?'A warm light in the window. Walk around the cottage.':'Find a little open ground.');return;}
    route=findRoute(dest);if(route.length)target=dest;else caption('Try a spot on this side of the fence.');
  });
  byId('zoom').addEventListener('change',event=>{zoom=Number(event.target.value);canvas.focus({preventScroll:true});});byId('direction').addEventListener('change',study);
  byId('reset').addEventListener('click',reset);petButton.addEventListener('click',pet);
  for(const button of document.querySelectorAll('[data-direction]')){
    const key={up:'w',down:'s',left:'a',right:'d'}[button.dataset.direction];
    button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);keys.add(key);});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>keys.delete(key));
  }
  new ResizeObserver(resize).observe(canvas);
  Promise.all([loadSprite('traveler',true),loadSprite('dog',true),loadSprite('cottage'),loadSprite('oak')]).then(()=>{
    started=true;resize();study();byId('loading').hidden=true;canvas.dataset.ready='true';captionTimer=setTimeout(()=>byId('caption').classList.add('hidden'),5500);requestAnimationFrame(render);
  }).catch(error=>{byId('loading').textContent='The artwork could not load. Open this preview through the local game server and refresh.';console.error(error);});
})();
