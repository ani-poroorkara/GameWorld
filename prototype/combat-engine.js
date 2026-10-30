'use strict';
// Review prototype: balance choices are deliberately collected here.
const BATTLE = {
 dice:3, defenseUses:5, dodgeUses:2, dodgeChance:.55, dieLow:.65, dieHigh:1.5,
 meleeUses:12, spellUses:3, healUses:1, defenseBase:3, defensePerResilience:2,
 fleeAttempts:3, fleeBase:.35, fleePerInstinct:.05, negotiateBase:.12,
 negotiatePerPillar:.035, enemyCardChance:.65, enemyDieChance:.35,
 enemies:{
  boar:{name:'Wild Boar',hp:38,attack:9,defense:5,attackName:'Tusk charge'},
  thief:{name:'Road Thief',hp:42,attack:10,defense:6,attackName:'Knife strike'},
  guardian:{name:'Hollow Sentinel',hp:55,attack:12,defense:8,attackName:'Stone strike',special:'Rift pulse'},
  bear:{name:'Forest Bear',hp:55,attack:12,defense:7,attackName:'Claw',special:'Growl'}
 }
};
function battleCard(id,name,kind,power,uses,extra={}){return {id,name,kind,power,uses,mana:0,...extra}}
function battleFighter(name,hp,mana,cards){return {name,hp,maxHP:hp,mana,cards,dice:BATTLE.dice}}
function battleEnemy(type){const e=BATTLE.enemies[type]||BATTLE.enemies.guardian;return battleFighter(e.name,e.hp,0,[
 battleCard('strike',e.attackName,'attack',e.attack,BATTLE.meleeUses),
 battleCard('guard','Defense','defense',e.defense,BATTLE.defenseUses),
 ...(type==='bear'?[battleCard('dodge','Dodge','dodge',BATTLE.dodgeChance,BATTLE.dodgeUses)]:[]),
 ...(e.special?[battleCard('special',e.special,'attack',8,2)]:[])
])}
function battleValid(fighter,hand){const ids=new Set();let mana=0,dice=0;for(const pick of hand){const card=fighter.cards.find(c=>c.id===pick.id);if(!card||card.uses<=0||ids.has(card.id))return false;ids.add(card.id);mana+=card.mana;dice+=pick.die?1:0}return mana<=fighter.mana&&dice<=fighter.dice}
function battleChoose(fighter,rng){let hand=fighter.cards.filter(c=>c.uses>0&&(c.kind==='attack'||rng()<BATTLE.enemyCardChance)).map(c=>({id:c.id,die:false}));let dice=fighter.dice;for(const p of hand)if(dice>0&&rng()<BATTLE.enemyDieChance){p.die=true;dice--}return hand}
// Both effect sets are evaluated before either HP total changes. No rolls are returned.
function battleResolve(player,enemy,playerHand,enemyHand,rng=Math.random){
 if(!battleValid(player,playerHand)||!battleValid(enemy,enemyHand))throw new Error('Invalid committed hand');
 const effects=(fighter,hand)=>{const out={attacks:[],block:0,heal:0,dodge:0,names:[]};for(const pick of hand){const c=fighter.cards.find(c=>c.id===pick.id);c.uses--;fighter.mana-=c.mana;let factor=1;if(pick.die){fighter.dice--;factor=rng()<.34?BATTLE.dieLow:BATTLE.dieHigh}const power=Math.max(0,Math.round(c.power*factor));out.names.push(c.name+(pick.die?' ✦':''));if(c.kind==='attack')out.attacks.push({name:c.name,power});if(c.kind==='defense')out.block+=power;if(c.kind==='heal')out.heal+=power;if(c.kind==='dodge')out.dodge=Math.min(.95,c.power*factor)}return out};
 const p=effects(player,playerHand),e=effects(enemy,enemyHand);
 const receive=(target,incoming,own)=>{let attacks=[...incoming.attacks],dodged=null;if(own.dodge&&attacks.length&&rng()<own.dodge){const index=Math.floor(rng()*attacks.length);dodged=attacks.splice(index,1)[0].name}const raw=attacks.reduce((sum,a)=>sum+a.power,0),blocked=Math.min(raw,own.block),damage=raw-blocked,healed=Math.min(own.heal,target.maxHP-target.hp);return {damage,blocked,healed,dodged,hp:Math.max(0,target.hp+healed-damage)}};
 const pr=receive(player,e,p),er=receive(enemy,p,e);player.hp=pr.hp;enemy.hp=er.hp;
 for(const fighter of [player,enemy])fighter.cards=fighter.cards.filter(card=>!card.consumable||card.uses>0);
 return {player:pr,enemy:er,playerCards:p.names,enemyCards:e.names,outcome:player.hp<=0?(enemy.hp<=0?'draw':'defeat'):enemy.hp<=0?'victory':null};
}
if(typeof module!=='undefined')module.exports={BATTLE,battleCard,battleFighter,battleEnemy,battleValid,battleChoose,battleResolve};
