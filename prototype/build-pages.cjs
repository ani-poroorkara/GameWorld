const fs=require('node:fs');
const path=require('node:path');
const output=path.join(__dirname,'dist');
fs.mkdirSync(output,{recursive:true});
// An explicit allowlist keeps local screenshots, saves, and development tools out.
for(const name of ['index.html','style.css','world-life.js','encounters.js','game.js'])fs.copyFileSync(path.join(__dirname,name),path.join(output,name));
fs.writeFileSync(path.join(output,'.nojekyll'),'');
console.log('GitHub Pages build ready in prototype/dist (5 game files, no runtime dependencies).');
