export const TYPES = {
 infantry: {name:'歩兵', cost:1, hp:1, damage:[1,.2,.18], interval:.32},
 artillery: {name:'対戦車砲兵', cost:3, hp:2.4, damage:[.55,.8,2.7], interval:.9},
 tank: {name:'戦車', cost:10, hp:14, damage:[1.7,3.8,3], interval:1.1}
};
export const IDS=Object.keys(TYPES);
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function apply(points,op){
 const result=op.kind==='add'?points+op.value:op.kind==='mul'?points*op.value:op.kind==='percent'?points*(100+op.value)/100:points/op.value;
 return clamp(Math.floor(result+1e-8),0,99990);
}
export function operation(kind,value){
 const label=kind==='add'||kind==='percent'?(value>=0?'+':'−')+Math.abs(value)+(kind==='percent'?'%':''):kind==='mul'?'×'+value:'1/'+value;
 return {kind,value,label};
}
export function numberPair(points,index,type='infantry',rng=Math.random){
 const cost=TYPES[type].cost,slot=index%8,negative=slot===2||slot===5;
 const pick=values=>values[Math.floor(rng()*values.length)];
 const roundAdd=value=>Math.max(cost,Math.round(value/cost)*cost);
 let scale;
 if(slot===2)scale=operation('div',pick([2,3]));
 else if(slot===5)scale=operation('percent',-pick([20,25,30,35]));
 else{
  const target=[2.2,2.2,0,2,1.4,0,1.4,1.35][slot];
  const factor=Math.max(1.15,Math.round((target+(rng()-.5)*.3)*20)/20);
  // Plain percentages are represented as multipliers, never ×120%.
  scale=rng()<.5?operation('mul',factor):operation('percent',Math.round((factor-1)*100));
 }
 const ratio=scale.kind==='div'?1/scale.value:scale.kind==='percent'?1+scale.value/100:scale.value;
 const change=roundAdd(Math.max(cost,points*Math.abs(ratio-1))*(.85+rng()*.3));
 let pair=[operation('add',negative?-change:change),scale];
 // Reject rounded ties while keeping the choice near the current headcount.
 if(apply(points,pair[0])===apply(points,pair[1])){
  const direction=rng()<.5?-1:1;
  pair[0]=operation('add',(negative?-1:1)*Math.max(cost,change+direction*cost));
  if(apply(points,pair[0])===apply(points,pair[1]))pair[0]=operation('add',(negative?-1:1)*(change+cost));
 }
 if(rng()<.5)pair.reverse();
 return pair;
}
export function squad(type,points){return {type,points:Math.floor(points),wound:0};}
export function units(s){return Math.floor(s.points/TYPES[s.type].cost);}
// A damaged surviving unit contributes proportionally less firepower. This avoids
// full-power last tanks reversing the matchup only at small army sizes.
export function power(s,target){return Math.max(0,units(s)-s.wound/TYPES[s.type].hp)*TYPES[s.type].damage[IDS.indexOf(target)];}
export function damage(s,amount){
 const t=TYPES[s.type]; s.wound+=amount;
 const dead=Math.min(units(s),Math.floor((s.wound+1e-8)/t.hp));
 s.points-=dead*t.cost;s.wound-=dead*t.hp;
 if(!units(s))s.wound=0;
 return dead;
}
// Bounded volley variation, sampled on a simulation clock rather than every frame.
export function seededRandom(seed=1){
 let state=seed>>>0;
 return ()=>{state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
export function createCombat(rng=Math.random){return {rng,untilRoll:0,allyScale:1,enemyScale:1};}
export function combatStep(a,b,dt,combat=null){
 let remaining=dt,lost=0,killed=0;
 while(remaining>1e-9&&units(a)>0&&units(b)>0){
  if(combat&&combat.untilRoll<=1e-9){combat.allyScale=.9+combat.rng()*.2;combat.enemyScale=.9+combat.rng()*.2;combat.untilRoll=.25;}
  const slice=Math.min(remaining,combat?combat.untilRoll:remaining);
  const da=power(a,b.type)*slice*(combat?.allyScale??1),db=power(b,a.type)*slice*(combat?.enemyScale??1);
  lost+=damage(a,db);killed+=damage(b,da);remaining-=slice;if(combat)combat.untilRoll-=slice;
 }
 return [lost,killed];
}
export function simulate(at,ap,bt,bp,{seed=1,random=true,dt=1/120}={}){
 const a=squad(at,ap),b=squad(bt,bp),combat=random?createCombat(seededRandom(seed)):null;let time=0;
 while(units(a)&&units(b)&&time<120){combatStep(a,b,dt,combat);time+=dt;}
 return {winner:units(a)?'ally':units(b)?'enemy':'draw',a,b,time};
}
export function enemyFor(stage,wave){return squad(IDS[(wave+stage-1)%3],Math.round((38+wave*24)*(1+(stage-1)*.18)));}
export function course(stage){
 const out=[];
 for(let w=0;w<4;w++){
 const z=w*76;
 out.push({kind:'number',z:z+18,index:w*2},{kind:'number',z:z+36,index:w*2+1},{kind:'class',z:z+52,enemy:enemyFor(stage,w)},{kind:'battle',z:z+66,enemy:enemyFor(stage,w)});
 }
 return out;
}

export function gateDisplay(op,type,points){
 if(op.kind!=='add')return {label:op.label};
 const cost=TYPES[type].cost;
 const delta=points===undefined?op.value/cost:Math.floor(apply(points,op)/cost)-Math.floor(points/cost);
 return {label:(delta>=0?'+':'−')+Math.abs(delta)};
}
