import assert from 'node:assert/strict';
import {carryBonus,supplyState,takeItem,travelSupply,logisticsPair} from '../logistics.mjs';
import {seededRandom,apply} from '../core.mjs';
assert.equal(carryBonus(50,30),15);assert.equal(carryBonus(1000,30),30);assert.equal(carryBonus(100000,95),95);
const s=supplyState();takeItem(s,'truck');assert.equal(s.b,40);takeItem(s,'poison');travelSupply(s,100);assert.equal(s.b,34);travelSupply(s,10000);assert.equal(s.b,5);
let items=0,normal=0,jackpot=0,bad=0;const rng=seededRandom(8);
for(let i=0;i<50000;i++){
 const pair=logisticsPair(100,i%8,'infantry',rng);
 for(const op of pair){if(!op.item){normal++;continue;}items++;const payoff=apply(100,op);if(op.item==='truck'&&payoff>200)jackpot++;if(op.item==='poison'&&payoff<100)bad++;}
}
assert(items/(normal+items)>.10&&items/(normal+items)<.12);assert(jackpot>0&&bad>0);
console.log('Carry cap / B bounds / distance poison / item frequency / jackpots: PASS',items/(normal+items));
