'use strict';
const fs=require('node:fs'),path=require('node:path');
const output=path.join(__dirname,'dist'),manifest=require('./art-manifest.js');
fs.mkdirSync(output,{recursive:true});
// Explicit allowlists keep saves, workshop files and development screenshots out.
const runtime=['index.html','style.css','art-manifest.js','art.js','access.js','world-life.js','encounters.js','game.js'];
for(const name of runtime)fs.copyFileSync(path.join(__dirname,name),path.join(output,name));
for(const source of Object.values(manifest.sources)){if(!/^assets\/art\/[a-z-]+\.png$/.test(source.file))throw Error('Unexpected art path');const destination=path.join(output,source.file);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(path.join(__dirname,source.file),destination);}
fs.mkdirSync(path.join(output,'assets/fonts'),{recursive:true});
for(const name of ['pixelify-sans.ttf','OFL.txt'])fs.copyFileSync(path.join(__dirname,'assets/fonts',name),path.join(output,'assets/fonts',name));
fs.writeFileSync(path.join(output,'.nojekyll'),'');
console.log(`GitHub Pages build ready in dist/ (${runtime.length} runtime files and ${Object.keys(manifest.sources).length} PNG sprite sources).`);
