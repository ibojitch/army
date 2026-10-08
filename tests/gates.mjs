import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {apply,course} from '../core.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'C:/Users/高田　正樹　（PRV）/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});await page.goto('http://127.0.0.1:4174/?debug=1');await page.getByRole('button',{name:'出撃する'}).click();const shots=new Set();
 for(let attempt=1;attempt<=12&&shots.size<5;attempt++){
 await page.evaluate(seed=>window.__army.start(seed),attempt);
 for(let i=0;i<600;i++){
  const s=await page.evaluate(()=>window.__army.state());if(s.mode==='stopped')break;
  if(s.mode==='battle'){await page.evaluate(()=>window.__army.step(.25));continue;}
  const ops=s.options;if(!ops){await page.evaluate(()=>window.__army.step(.25));continue;}
  const kind=typeof ops[0]==='string'?'class':ops.some(o=>o.kind==='div')?'fraction':ops.some(o=>o.kind==='percent'&&o.value<0)?'negative-percent':ops.some(o=>o.kind==='percent')?'percent':ops.some(o=>o.kind==='mul'&&o.value%1!==0)?'decimal':null;
  if(kind&&!shots.has(kind)){
   const remain=course(s.stage)[s.eventIndex].z-s.distance;
   if(remain>13)await page.evaluate(n=>window.__army.step(n),(remain-13)/6.7);
   await page.screenshot({path:`tests/artifacts/390-${kind}-gate.png`});shots.add(kind);
  }
  let lane;
  if(typeof ops[0]==='string'){
   const intel=await page.locator('#intel').innerText();const enemy=intel.includes('対戦車砲兵')?'artillery':intel.includes('戦車')?'tank':'infantry';lane=ops.indexOf({infantry:'tank',artillery:'infantry',tank:'artillery'}[enemy]);
  }else lane=apply(s.points,ops[0])>=apply(s.points,ops[1])?0:1;
  await page.evaluate(x=>window.__army.setX(x),ops.length===3?(lane-1)*2.83:lane===0?-2.1:2.1);await page.evaluate(()=>window.__army.step(.25));
 }
 }
 assert.deepEqual([...shots].sort(),['class','decimal','fraction','negative-percent','percent']);console.log('All gate types rendered at mobile size:',[...shots]);
}finally{await browser.close();}
