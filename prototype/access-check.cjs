const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/access.js','utf8');
assert(/const ACCESS_CODE_HASH='[a-f0-9]{64}'/.test(source),'The gate needs a valid configured digest');
const testCode='TEST-MYWORLD',digest=crypto.createHash('sha256').update(testCode).digest('hex');
const nodes=new Map(),session=new Map(),classes=new Set(['access-locked']);
function node(id){if(!nodes.has(id))nodes.set(id,{value:'',hidden:false,textContent:'',disabled:false,attrs:{},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},focus(){this.focused=true}});return nodes.get(id)}
const context=vm.createContext({crypto:crypto.webcrypto,TextEncoder,Uint8Array,sessionStorage:{getItem:k=>session.get(k)||null,setItem:(k,v)=>session.set(k,v)},document:{body:{classList:{add:s=>classes.add(s),remove:s=>classes.delete(s)}}},$:node});
vm.runInContext(source.replace(/const ACCESS_CODE_HASH='[a-f0-9]{64}';/,`const ACCESS_CODE_HASH='${digest}';`),context);
const run=s=>vm.runInContext(s,context);
(async()=>{
 assert.equal(await run('accessCodeMatches("wrong")'),false);assert.equal(await run('accessCodeMatches("")'),false);assert.equal(await run('accessCodeMatches("  test-myworld  ")'),true);
 run('initializeAccessGate()');assert.equal(node('accessGate').hidden,false);
 node('accessCode').value='WRONG';await node('accessForm').onsubmit({preventDefault(){}});assert.equal(node('accessGate').hidden,false);assert(node('accessError').textContent.includes('not valid'));assert.equal(node('accessCode').attrs['aria-invalid'],'true');assert.equal(session.size,0);
 node('accessCode').oninput();assert.equal(node('accessError').textContent,'');assert.equal(node('accessCode').attrs['aria-invalid'],undefined);
 node('accessCode').value='test-myworld';await node('accessForm').onsubmit({preventDefault(){}});assert.equal(node('accessGate').hidden,true);assert.equal(classes.has('access-locked'),false);assert.equal(session.size,1);assert.equal(node('accessCode').value,'');
 node('accessGate').hidden=false;run('initializeAccessGate()');assert.equal(node('accessGate').hidden,true,'Valid tab session restores entry');
 session.clear();run('initializeAccessGate()');assert.equal(node('accessGate').hidden,false,'New tab needs a code');
 const html=fs.readFileSync(__dirname+'/index.html','utf8');assert(html.includes('in-menu access-locked'));assert(html.includes('Authorized playtesters only.'));assert(html.includes('Unauthorized access, use, copying, or sharing is not permitted.'));
 console.log('PASS: access-code validation, normalization, invalid-entry feedback, tab-session access, locked initial screen, and playtest notice.');
})().catch(error=>{console.error(error);process.exitCode=1});
