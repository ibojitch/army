import assert from 'node:assert/strict';
import {IDS,TYPES,apply,operation,numberPair,squad,units,simulate,course,gateDisplay} from '../core.mjs';
assert.equal(apply(9,operation('add',10)),19);assert.equal(apply(9,operation('mul',2)),18);
assert.equal(apply(20,operation('add',-10)),10);assert.equal(apply(20,operation('div',3)),6);
for(const p of [0,1,9,19,40,99990]){const s=squad('infantry',p);for(const t of IDS){s.type=t;assert.equal(units(s)*TYPES[t].cost+s.points%TYPES[t].cost,p);}assert.equal(s.points,p);}
for(let i=0;i<12;i++){const pair=numberPair(80,i);assert.equal(pair.length,2);assert.equal(pair.every(o=>o.kind==='div'||o.value<0),[2,5].includes(i%8));}
for(const [a,b] of [['infantry','artillery'],['artillery','tank'],['tank','infantry']]){const r=simulate(a,300,b,300);console.log(a,'vs',b,r.winner,'remaining',r.a.points,r.b.points,'seconds',r.time.toFixed(2));assert.equal(r.winner,'ally');assert(r.a.points<300);const reverse=simulate(b,1200,a,300);assert.equal(reverse.winner,'ally','mass must overcome disadvantage');}
for(const t of IDS)for(const b of IDS)for(const p of [10,30,100,300]){const r=simulate(t,p,b,p);assert(r.time<120);assert(r.a.points>=0&&r.b.points>=0);}
assert.equal(course(1).filter(e=>e.kind==='battle').length,4);
console.log('Core balance and conservation checks passed.');

for(const type of IDS)for(const points of [1,9,19,79,300,99989,99990])for(let i=0;i<9;i++){
 const op=numberPair(points,i,type).find(op=>op.kind==='add');if(!op)continue;assert.equal(Math.abs(op.value%TYPES[type].cost),0);
 const d=gateDisplay(op,type,points),expected=Math.floor(apply(points,op)/TYPES[type].cost)-Math.floor(points/TYPES[type].cost);
 assert.equal(d.label,(expected>=0?'+':'−')+Math.abs(expected));
}
assert.equal(gateDisplay(operation('add',50),'tank',79).label,'+5');
assert.equal(gateDisplay(operation('add',30),'artillery',79).label,'+10');
assert.equal(gateDisplay(operation('mul',2),'tank',79).label,'×2');
console.log('Unit-cost labels and actual deltas: PASS.');

assert.equal(operation('div',3).label,'1/3');
assert.equal(operation('percent',20).label,'+20%');
assert.equal(operation('percent',-30).label,'−30%');
assert.equal(operation('mul',1.2).label,'×1.2');
assert.equal(apply(100,operation('percent',20)),120);
assert.equal(apply(100,operation('percent',-30)),70);
for(let n=1;n<=1000;n++)assert.equal(apply(n,operation('percent',20)),apply(n,operation('mul',1.2)));
for(let i=0;i<8;i++)for(const op of numberPair(100,i))assert(!/[×÷].*%|÷/.test(op.label));
console.log('Fractions and signed percentage gates: PASS.');
