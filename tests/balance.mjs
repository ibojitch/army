import assert from 'node:assert/strict';
import {TYPES,simulate,units,createCombat,seededRandom,squad,combatStep,course,numberPair,apply} from '../core.mjs';
const pairs=[['infantry','artillery'],['artillery','tank'],['tank','infantry']],samples=300;
for(const [a,b] of pairs)for(const budget of [10,30,100,300,1000]){
 let wins=0,total=0;
 for(let seed=1;seed<=samples;seed++){
  const r=simulate(a,budget,b,budget,{seed});wins+=r.winner==='ally';total+=units(r.a)*TYPES[a].cost/budget;
  assert(r.time<120);assert(r.a.points>=0&&r.b.points>=0);
 }
 const rate=wins/samples,left=total/samples;
 assert(rate>=.97,`${a} vs ${b} at ${budget}: ${rate}`);
 if(budget>=100)assert(left>=.35&&left<=.65,`${a} too weak/strong: ${left}`);
 console.log(`${a} > ${b}, ${budget} PT: win ${(rate*100).toFixed(1)}%, mean remaining ${(left*100).toFixed(1)}%`);
}
for(const t of Object.keys(TYPES)){
 let wins=0;for(let seed=1;seed<=samples;seed++)wins+=simulate(t,100,t,100,{seed}).winner==='ally';
 assert(wins/samples>.4&&wins/samples<.6,'same class has no side bias');
}
for(const [good,bad] of pairs)for(let seed=1;seed<=100;seed++)assert.equal(simulate(bad,600,good,300,{seed}).winner,'ally','2x budget overcomes disadvantage');
const outcomes=[];for(let seed=1;seed<=samples;seed++)outcomes.push(simulate('artillery',300,'tank',350,{seed}));
const nearWins=outcomes.filter(r=>r.winner==='ally').length;assert(nearWins>samples*.1&&nearWins<samples*.9,'close battles vary by seed');
assert(new Set(outcomes.map(r=>r.a.points+':'+r.b.points)).size>3);
assert.deepEqual(simulate('artillery',100,'tank',100,{seed:97}),simulate('artillery',100,'tank',100,{seed:97}));
const a=squad('artillery',300),b=squad('tank',300),random=createCombat(seededRandom(42));
for(let i=0;i<240;i++){combatStep(a,b,1/60,random);assert(random.allyScale>=.9&&random.allyScale<=1.1);assert(random.enemyScale>=.9&&random.enemyScale<=1.1);}
for(let seed=1;seed<=100;seed++){
 const x=simulate('artillery',300,'tank',300,{seed,dt:1/60}),y=simulate('artillery',300,'tank',300,{seed,dt:1/120});
 assert.equal(x.winner,y.winner);assert(Math.abs(units(x.a)-units(y.a))<=2,'frame-rate independent balance');
}
let clears=0,min=99999;
for(let seed=1;seed<=samples;seed++){
 let points=40,type='infantry';const gateRng=seededRandom(seed);
 for(const e of course(1)){
  if(e.kind==='number')points=Math.max(...numberPair(points,e.index,type,gateRng).map(o=>apply(points,o)));
  else if(e.kind==='class')type={infantry:'tank',artillery:'infantry',tank:'artillery'}[e.enemy.type];
  else{const r=simulate(type,points,e.enemy.type,e.enemy.points,{seed:seed*17+e.z});points=r.a.points;if(r.winner!=='ally')break;}
 }
 if(points>=10)clears++;min=Math.min(min,points);
}
assert(clears>=samples*.98,`Random routes clear only ${clears}/${samples}`);
console.log(`Near-even fight: artillery wins ${nearWins}/${samples}. Optimal sector 1: ${clears}/${samples}, min ${min} PT. All balance checks passed.`);
