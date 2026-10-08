import {clamp,numberPair,apply,operation} from './core.mjs';
export const INITIAL_B=30; // Hundredths: B=0.30, displayed as 30%.
export function carryBonus(points,b){return Math.floor(clamp(b,5,95)*Math.min(100,Math.max(0,points))/100+1e-8);}
export function supplyState(b=INITIAL_B){return {b:clamp(b,5,95),poison:false};}
export function takeItem(state,item){if(item==='truck')state.b=clamp(state.b+10,5,95);if(item==='poison')state.poison=true;}
export function travelSupply(state,meters){if(state.poison)state.b=clamp(state.b-Math.max(0,meters)*.06,5,95);}
export function logisticsPair(points,index,type,rng=Math.random){
 return numberPair(points,index,type,rng).map(op=>{
  if(rng()>=.11)return op;
  const item=rng()<.5?'truck':'poison',typical=rng()<.8;
  const generous=(item==='poison')===typical;
  // Correlate numeric payoff with item cost, with occasional jackpots and bad deals.
  const result=apply(points,op)*(generous?1.45:.8);
  const adjusted=points>0?operation('mul',Math.max(.1,Math.round(result/points*20)/20)):op;
  return {...adjusted,item};
 });
}
