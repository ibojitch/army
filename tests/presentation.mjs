import {apply} from '../core.mjs';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'C:/Users/高田　正樹　（PRV）/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
await fs.mkdir('tests/artifacts',{recursive:true});
try{
 for(const viewport of [{width:390,height:844},{width:1280,height:900}]){
 const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4174/?debug=1');await page.getByRole('button',{name:'出撃する'}).click();
 const counts={infantry:120,artillery:18,tank:15},costs={infantry:1,artillery:3,tank:10};
 for(const type of Object.keys(counts))for(const x of [-3.7,0,3.7]){
  await page.evaluate(({type,points,x})=>{window.__army.start(17);window.__army.setSquad(type,points);window.__army.setX(x);window.__army.step(.6);},{type,points:counts[type]*costs[type],x});
  const positions=await page.evaluate(()=>window.__army.presentation().ally);const half=type==='tank'?.8:type==='artillery'?.63:.3;
  assert(positions.every(p=>Math.abs(p.x)+half<=4.35),'whole formation fits road');
  for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++)assert(Math.hypot(positions[i].x-positions[j].x,positions[i].z-positions[j].z)>.43,'no stacked units');
 }
 await page.evaluate(()=>{window.__army.start(17);window.__army.setSquad('tank',79);window.__army.step(.25);});await page.screenshot({path:`tests/artifacts/${viewport.width}-diorama-tank.png`});
 await page.evaluate(()=>{window.__army.start(17);window.__army.setSquad('artillery',79);window.__army.step(.25);});await page.screenshot({path:`tests/artifacts/${viewport.width}-diorama-artillery.png`});
 await page.evaluate(()=>{window.__army.start(17);window.__army.setSquad('tank',300);window.__army.setX(3);for(let i=0;i<250&&window.__army.state().mode!=='battle';i++)window.__army.step(.05);window.__army.step(.4);window.__army.impact(true);});
 await page.screenshot({path:`tests/artifacts/${viewport.width}-diorama-effect.png`});const fx=await page.evaluate(()=>window.__army.presentation());assert(fx.effects.shots>0);assert(fx.effects.impacts>0);assert(fx.effects.smoke>0);assert(fx.effects.activeWrecks>0);assert(fx.calls<250,'bounded instanced rendering');
 await page.getByRole('button',{name:'一時停止'}).click();const before=await page.evaluate(()=>window.__army.presentation().effects);await page.evaluate(()=>window.__army.step(1));assert.deepEqual(await page.evaluate(()=>window.__army.presentation().effects),before,'pause freezes FX');
 await page.getByRole('button',{name:'再開する'}).click();await page.evaluate(()=>window.__army.step(3));assert((await page.evaluate(()=>window.__army.presentation().effects.activeWrecks))<=16);
 await page.evaluate(()=>window.__army.start(17));await page.waitForTimeout(50);const clean=await page.evaluate(()=>window.__army.presentation().effects);assert.equal(clean.smoke,0);assert.equal(clean.activeWrecks,0);assert.equal(clean.debris,0);
 const initial=await page.evaluate(()=>window.__army.renderer().geometries);
 for(let i=0;i<20;i++){await page.evaluate(i=>{window.__army.start(17);window.__army.setSquad(['tank','artillery','infantry'][i%3],100);window.__army.step(.05);window.__army.impact(true);},i);await page.waitForTimeout(20);}
 await page.evaluate(()=>{window.__army.start(17);window.__army.step(.1);});await page.waitForTimeout(50);const end=await page.evaluate(()=>window.__army.renderer().geometries);assert(end<=initial+4,'shared geometry is not leaked on retry');
 if(viewport.width===390){
  await page.evaluate(()=>window.__army.start(17));
  for(let i=0;i<500;i++){
   const s=await page.evaluate(()=>window.__army.state());
   if(s.mode==='battle'&&s.enemy.type==='tank'){await page.evaluate(()=>window.__army.step(.4));await page.screenshot({path:'tests/artifacts/390-diorama-battle.png'});break;}
   if(s.mode==='battle'){await page.evaluate(()=>window.__army.step(.25));continue;}
   if(s.options){let lane;if(typeof s.options[0]==='string'){const text=await page.locator('#intel').innerText(),et=text.includes('対戦車砲兵')?'artillery':text.includes('戦車')?'tank':'infantry';lane=s.options.indexOf({infantry:'tank',artillery:'infantry',tank:'artillery'}[et]);}else lane=apply(s.points,s.options[0])>=apply(s.points,s.options[1])?0:1;
    await page.evaluate(x=>window.__army.setX(x),s.options.length===3?(lane-1)*2.83:lane===0?-2.1:2.1);
   }
   await page.evaluate(()=>window.__army.step(.25));
  }
 }
 assert.deepEqual(errors,[]);console.log(viewport.width,'diorama PASS',fx.effects,'draw calls',fx.calls,'geometries',initial,end);await page.close();
 }
}finally{await browser.close();}
