'use strict';
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {validateContent,migrateContent}=require('./model.js');
const {buildRuntimeContent,serializeRuntimeContent}=require('../content/export.cjs');
const hash=raw=>crypto.createHash('sha256').update(raw).digest('hex');
function createEditorServer({contentFile=path.join(__dirname,'../content/act1.json'),backupDir=path.join(__dirname,'.backups'),campaignFile=path.join(__dirname,'../content/campaign-act1.json')}={}){
 const writeToken=crypto.randomBytes(32).toString('hex');let writes=Promise.resolve();
 const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value))};
 const read=async()=>{const raw=await fs.readFile(contentFile,'utf8');return {raw,data:JSON.parse(raw),revision:hash(raw)}};
 async function save(data,expected){const current=await read();if(current.revision!==expected)return {status:409,body:{error:'The file changed since you opened it. Export your edits, then reload the latest copy.'}};const result=validateContent(data);if(result.errors.length)return {status:422,body:{error:'Fix the validation errors before saving.',...result}};await fs.mkdir(backupDir,{recursive:true});const stamp=new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomBytes(3).toString('hex');await fs.writeFile(path.join(backupDir,stamp+'.json'),current.raw,{flag:'wx'});const raw=JSON.stringify(data,null,2)+'\n',temp=contentFile+'.'+crypto.randomBytes(6).toString('hex')+'.tmp';try{await fs.writeFile(temp,raw,{flag:'wx'});const latest=await read();if(latest.revision!==expected)return {status:409,body:{error:'The file changed while saving. Export your draft and reload.'}};await fs.rename(temp,contentFile)}finally{await fs.unlink(temp).catch(()=>{})}return {status:200,body:{revision:hash(raw),...result}}}
 return http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  try{
   const port=req.socket.localPort,hosts=new Set(['127.0.0.1:'+port,'localhost:'+port]),host=req.headers.host;if(!hosts.has(host)){json(res,403,{error:'This editor is available only through its local address.'});return}
   const origin=req.headers.origin;if(origin&&origin!=='http://'+host){json(res,403,{error:'Requests must come from this editor.'});return}
   if(req.headers['sec-fetch-site']==='cross-site'){json(res,403,{error:'Cross-site requests are not allowed.'});return}
   const url=new URL(req.url,'http://'+host);
   if(url.pathname==='/api/content'&&req.method==='GET'){const saved=await read(),revision=saved.revision,data=migrateContent(saved.data,JSON.parse(await fs.readFile(campaignFile,'utf8'))),checks=validateContent(data);if(checks.errors.length){json(res,422,{error:'The saved content needs repair. Fix the listed fields in content/act1.json, then reload.',...checks});return}json(res,200,{data,revision,writeToken,...checks});return}
   if((url.pathname==='/api/content'&&req.method==='PUT')||(url.pathname==='/api/runtime-export'&&req.method==='POST')){
    if(req.headers['x-editor-token']!==writeToken){json(res,403,{error:'Reopen the editor to reconnect before saving.'});return}
    if(!req.headers['content-type']?.startsWith('application/json')){json(res,415,{error:'Expected JSON content.'});return}
    if(url.pathname==='/api/content'&&!req.headers['if-match']){json(res,428,{error:'Reload the current content before saving.'});return}
    const chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>1024*1024){json(res,413,{error:'Content is larger than the 1 MB limit.'});return}chunks.push(chunk)}const raw=Buffer.concat(chunks).toString('utf8');
    let data;try{data=JSON.parse(raw)}catch{json(res,400,{error:'This is not valid JSON.'});return}
    if(url.pathname==='/api/runtime-export'){try{json(res,200,{source:serializeRuntimeContent(buildRuntimeContent(data,data.campaign))})}catch(error){json(res,422,{error:error.message})}return}
    const task=writes.then(()=>save(data,req.headers['if-match']));writes=task.catch(()=>{});const result=await task;json(res,result.status,result.body);return;
   }
   const files={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js','/model.js':'model.js'},file=files[url.pathname];
   if(!file||req.method!=='GET'){json(res,404,{error:'Not found.'});return}
   const body=await fs.readFile(path.join(__dirname,file));res.writeHead(200,{'Content-Type':file.endsWith('.css')?'text/css; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8'});res.end(body);
  }catch(error){console.error('Editor request failed:',error.message);json(res,500,{error:'The local content file could not be read or saved. Your draft is still in the editor; export a copy before closing.'})}
 });
}
if(require.main===module){const server=createEditorServer();server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'The editor is already running. Open http://127.0.0.1:4180/':error.message);process.exitCode=1});server.listen(4180,'127.0.0.1',()=>console.log('MyWorld content editor: http://127.0.0.1:4180/'))}
module.exports={createEditorServer};
