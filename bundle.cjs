const fs=require('node:fs');
const path=require('node:path');
let html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
html=html.replace('<link rel="stylesheet" href="style.css">',()=>'<style>'+fs.readFileSync(path.join(__dirname,'style.css'),'utf8')+'</style>');
for(const file of ['access.js','world-life.js','encounters.js','game.js'])html=html.replace(`<script src="${file}"></script>`,()=>'<script>'+fs.readFileSync(path.join(__dirname,file),'utf8')+'</script>');
fs.writeFileSync(path.join(__dirname,'MyWorld.html'),html);
console.log('Standalone MyWorld.html rebuilt.');
