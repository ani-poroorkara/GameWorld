'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {inspectSource,ART_SOURCES}=require('./prepare-art.cjs'),manifest=require('./art-manifest.js');
assert.deepEqual(Object.keys(manifest.sources).sort(),Object.keys(ART_SOURCES).sort(),'The manifest must cover every registered asset.');
for(const [name,grid]of Object.entries(ART_SOURCES)){
 const actual=inspectSource(name,grid);assert.deepEqual(manifest.sources[name],actual,`${name}: PNG or bounds changed; run node prepare-art.cjs and inspect the result.`);
 for(const frame of actual.frames){assert(frame.w>5&&frame.h>5);assert(frame.x>=0&&frame.y>=0&&frame.x+frame.w<=actual.width&&frame.y+frame.h<=actual.height);}
}
const files=['art-manifest.js','art.js','access.js','world-life.js','encounters.js','game.js'];
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');let previous=-1;
for(const file of files){const index=html.indexOf(`<script src="${file}">`);assert(index>previous,`${file} must be loaded in dependency order`);previous=index;}
for(const name of ['traveler-male','dog','cottage','oak']){
 const original=name==='traveler-male'?'traveler':name;
 assert(fs.readFileSync(path.join(__dirname,'assets/art',name+'.png')).equals(fs.readFileSync(path.join(__dirname,'art-preview/assets',original+'.png'))),`The approved ${name} reference must remain unchanged.`);
}
console.log(`PASS: ${Object.keys(ART_SOURCES).length} PNG sources, all transparent sheet cells/bounds, complete manifest, dependency order and exact approved reference assets.`);
