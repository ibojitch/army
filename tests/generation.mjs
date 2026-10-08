import assert from 'node:assert/strict';
import {numberPair,seededRandom,apply,gateDisplay,TYPES} from '../core.mjs';
const seen=new Set(),kinds=new Set();let left=0,right=0,reversals=0;
for(let seed=1;seed<=500;seed++){
 const rng=seededRandom(seed),pair=numberPair(100,4,'infantry',rng);
 seen.add(pair.map(o=>o.label).join('|'));pair.forEach(o=>kinds.add(o.kind));
 const diff=apply(100,pair[0])-apply(100,pair[1]);left+=diff>0;right+=diff<0;
 const a=apply(50,pair[0])-apply(50,pair[1]),b=apply(200,pair[0])-apply(200,pair[1]);reversals+=a*b<0;
 for(const type of Object.keys(TYPES))for(const points of [30,79,300,1000])for(let i=0;i<8;i++){
  const ops=numberPair(points,i,type,rng);assert.equal(ops.length,2);assert.notEqual(ops[0].kind,ops[1].kind);
  assert.notEqual(apply(points,ops[0]),apply(points,ops[1]));
  for(const op of ops){assert(!/÷|[×÷].*%/.test(gateDisplay(op,type,points).label));if(op.kind==='add')assert.equal(Math.abs(op.value%TYPES[type].cost),0);}
  assert.equal(ops.every(o=>o.kind==='div'||o.value<0),i===2||i===5);
 }
}
assert(seen.size>80);assert(left>150&&right>150);assert(reversals>450);
assert.deepEqual(numberPair(100,4,'tank',seededRandom(17)),numberPair(100,4,'tank',seededRandom(17)));
console.log({uniquePairs:seen.size,leftBetter:left,rightBetter:right,headcountReversals:reversals});
console.log('Random gate variety, crossover, cost units and seeded reproduction: PASS.');
