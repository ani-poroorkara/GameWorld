const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {validateContent,summarizeContent}=require('./model.js');
const sample=()=>JSON.parse(fs.readFileSync(__dirname+'/../content/act1.json','utf8'));
test('Act 1 catalogue includes all 14 cards and agreed food and distraction rules',()=>{
 const data=sample();assert.equal(data.cards.length,14);assert.deepEqual(validateContent(data).errors,[]);
 assert.equal(data.cards.find(c=>c.id==='apple').levels[0].power,5);
 assert.equal(data.cards.find(c=>c.id==='steak').levels[0].power,15);
 assert.equal(data.cards.find(c=>c.id==='pet-distraction').perFightUses,1);
 assert.equal(data.cards.find(c=>c.id==='pet-distraction').successChance,.5);
 assert.equal(data.drops.find(d=>d.cardId==='bow').chance,.25);
 assert.equal(summarizeContent(data).cards,14);
});
test('rejects duplicate identities and levels, invalid references, and non-finite stats',()=>{
 const data=sample();data.cards[1].id=data.cards[0].id;data.cards[0].levels.push({...data.cards[0].levels[0]});
 data.drops[0].cardId='missing-card';data.enemies[0].hp=Infinity;
 const text=validateContent(data).errors.map(e=>e.message).join(' ');
 assert.match(text,/Duplicate ID/);assert.match(text,/Duplicate level/);assert.match(text,/Unknown card/);assert.match(text,/finite/);
});
test('rejects impossible drop probabilities and quantity ranges',()=>{
 for(const chance of [-.1,1.01,'25',NaN]){const data=sample();data.drops[0].chance=chance;assert(validateContent(data).errors.length>0)}
 const data=sample();data.drops[0].min=5;data.drops[0].max=2;assert(validateContent(data).errors.some(e=>e.message.includes('maximum')));
});
test('draft probabilities may be null but confirmed drops require a decision',()=>{
 const data=sample(),bow=data.drops.find(d=>d.cardId==='bow');bow.chance=null;bow.status='draft';assert.deepEqual(validateContent(data).errors,[]);
 bow.status='confirmed';assert(validateContent(data).errors.some(e=>e.message.includes('confirmed')));
});
test('rejects missing structure and invalid use counts without throwing',()=>{
 for(const bad of [null,[],{}, {schemaVersion:1,cards:[],enemies:[],drops:[]}])assert(validateContent(bad).errors.length);
 const data=sample();data.cards[0].perFightUses=-1;assert(validateContent(data).errors.length);
});
