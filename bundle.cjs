'use strict';
const fs=require('node:fs'),path=require('node:path'),manifest=require('./art-manifest.js');
let html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
html=html.replace('<link rel="stylesheet" href="style.css">',()=>'<style>'+fs.readFileSync(path.join(__dirname,'style.css'),'utf8')+'</style>');
html=html.replaceAll("assets/fonts/pixelify-sans.ttf",'data:font/ttf;base64,'+fs.readFileSync(path.join(__dirname,'assets/fonts/pixelify-sans.ttf')).toString('base64'));
const fontLicense=fs.readFileSync(path.join(__dirname,'assets/fonts/OFL.txt'),'utf8').replaceAll('--','—');
html=html.replace('</head>',()=>`<!-- Pixelify Sans license\n${fontLicense}\n-->\n</head>`);
// A standalone export must include artwork, not just scripts and styles.
const embedded=Object.fromEntries(Object.entries(manifest.sources).map(([name,source])=>[name,'data:image/png;base64,'+fs.readFileSync(path.join(__dirname,source.file)).toString('base64')]));
html=html.replace('<script src="art-manifest.js"></script>',()=>`<script>globalThis.MYWORLD_EMBEDDED_ART=${JSON.stringify(embedded)};</script>\n<script src="art-manifest.js"></script>`);
for(const file of ['art-manifest.js','art.js','access.js','world-life.js','encounters.js','game.js'])html=html.replace(`<script src="${file}"></script>`,()=>'<script>'+fs.readFileSync(path.join(__dirname,file),'utf8')+'</script>');
fs.writeFileSync(path.join(__dirname,'MyWorld.html'),html);
console.log('Standalone MyWorld.html rebuilt with every PNG embedded.');
