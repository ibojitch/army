import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {carryBonus} from '../logistics.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'C:/Users/高田　正樹　（PRV）/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
try{
 for(const viewport of [{width:390,height:844},{width:1280,height:900}]){
 const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4174/?debug=1');await page.getByRole('button',{name:'出撃する'}).click();
 const pickups=await page.evaluate(()=>{
  const a=window.__army,results=[];
  for(const item of ['truck','poison']){
   a.newGame();let lane;
   for(let seed=1;seed<1000;seed++){a.start(seed);lane=a.state().options.findIndex(o=>o.item===item);if(lane>=0)break;}
   a.setX(lane===0?-2.1:2.1);a.step(3);results.push(a.state());
  }
  return results;
 });
 assert.equal(pickups[0].b,.4,'truck gate actually applies B increase');assert.equal(pickups[1].poison,true);assert(pickups[1].b<.3,'poison gate starts distance drain');
 const state=await page.evaluate(()=>{
  const a=window.__army;a.newGame();a.setLogistics(.5,'poison');a.step(1);const moving=a.state();a.pause();a.step(2);const paused=a.state();a.pause();
  // Guarantee survival to isolate campaign bookkeeping from combat outcomes.
  for(let i=0;i<700&&a.state().mode!=='stopped';i++){a.setSquad('tank',5000);a.step(.25);}
  return {moving,paused,clear:a.state()};
 });
 assert(state.moving.b<.5);assert.equal(state.paused.b,state.moving.b);assert(state.clear.distance>304);
 const bonus=carryBonus(state.clear.points,state.clear.b*100);
 await page.getByRole('button',{name:'次のセクター'}).click();
 const second=await page.evaluate(()=>window.__army.state());assert.equal(second.stage,2);assert.equal(second.points,40+bonus);assert.equal(second.b,state.clear.b);assert.equal(second.poison,false);
 await page.evaluate(()=>{const a=window.__army;a.setLogistics(.1,'poison');a.setSquad('infantry',0);a.step(15);});
 await page.getByRole('button',{name:'コンティニュー'}).click();
 const retry=await page.evaluate(()=>window.__army.state());assert.equal(retry.stage,2);assert.equal(retry.points,40+bonus);assert.equal(retry.b,second.b);assert.equal(retry.bonus,bonus);assert.equal(retry.distance,0);
 await page.getByRole('button',{name:'一時停止'}).click();await page.getByRole('button',{name:'NEW GAME / 最初から'}).click();
 const fresh=await page.evaluate(()=>window.__army.state());assert.equal(fresh.stage,1);assert.equal(fresh.points,40);assert.equal(fresh.b,.3);assert.equal(fresh.bonus,0);
 // Find an item on the first pair for a readable mobile/desktop visual check.
 await page.evaluate(()=>{for(let seed=1;seed<200;seed++){window.__army.start(seed);if(window.__army.state().options.some(o=>o.item))break;}window.__army.step(1.6);window.__army.pause();});
 await fs.mkdir('tests/artifacts',{recursive:true});await page.getByRole('button',{name:'再開する'}).click();await page.screenshot({path:`tests/artifacts/${viewport.width}-logistics.png`});
 assert.deepEqual(errors,[]);console.log(viewport.width,'campaign carry / poison / retry / NEW GAME: PASS');await page.close();
 }
}finally{await browser.close();}
