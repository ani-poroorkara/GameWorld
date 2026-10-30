const fs=require('node:fs');
const path=require('node:path');
const output=path.join(__dirname,'dist');
fs.mkdirSync(output,{recursive:true});
// An explicit allowlist keeps local screenshots, saves, and development tools out.
for(const name of ['index.html','style.css','combat.css','combat-polish.css','guided.css','map-combat.css','act1-data.js','act1-world.js','act1-puzzles.js','access.js','world-life.js','encounters.js','game.js','combat-engine.js','combat-scene.js','guided-scene.js','combat.js','pixel-sprites.js','map-effects.js','map-combat.js','act1-state.js','act1.js','act1-campaign.js'])fs.copyFileSync(path.join(__dirname,name),path.join(output,name));
fs.mkdirSync(path.join(output,'assets/guided'),{recursive:true});for(const name of ['adventurer.png','boar.png','clearing.png'])fs.copyFileSync(path.join(__dirname,'assets/guided',name),path.join(output,'assets/guided',name));
fs.writeFileSync(path.join(output,'.nojekyll'),'');
console.log('GitHub Pages build ready in prototype/dist (campaign game files and 3 art assets, no runtime dependencies).');
