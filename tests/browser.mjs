import {apply} from '../core.mjs';
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH || 'C:/Users/高田　正樹　（PRV）/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
const errors=[];
await fs.mkdir('tests/artifacts',{recursive:true});
try{
 for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
 const context=await browser.newContext({viewport,hasTouch:viewport.width===390,isMobile:viewport.width===390});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4174/?debug=1');await page.waitForFunction(()=>window.__army);
 await page.getByRole('button',{name:'出撃する'}).click();
 assert.equal(await page.evaluate(()=>window.__army.state().mode),'run');
 // Stop wall-clock progression while using deterministic debug stepping.
 await page.evaluate(()=>window.__army.pause());
 const canvas=page.locator('canvas').first(),r=await canvas.boundingBox();
 await page.evaluate(()=>window.__army.pause());
 if(viewport.width===390){
 const cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width*.5,y:650}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:r.x+r.width*.25,y:650}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }else await page.mouse.move(r.x+r.width*.1,r.y+400);
 const before=await page.evaluate(()=>window.__army.state());const expected=apply(before.points,before.options[0]);
 await page.evaluate(()=>window.__army.step(3));
 const result=await page.evaluate(()=>window.__army.state());assert.equal(result.points,expected,'left gate chosen by real pointer input');
 await page.screenshot({path:`tests/artifacts/${viewport.width}-infantry.png`});
 await page.evaluate(()=>window.__army.start(17));
 let guard=0;
 while(guard++<600){
 const s=await page.evaluate(()=>window.__army.state());
 if(s.mode==='stopped')break;
 if(s.mode==='battle'){await page.evaluate(()=>window.__army.step(.5));continue;}
 if(s.options){let lane=0;
 if(typeof s.options[0]==='string'){
 const counter={infantry:'tank',artillery:'infantry',tank:'artillery'};
 const target=await page.evaluate(()=>{const st=window.__army.state();return document.getElementById('intel').textContent;});
 const et=target.includes('対戦車砲兵')?'artillery':target.includes('戦車')?'tank':'infantry';lane=s.options.indexOf(counter[et]);
 }else{const score=o=>o.kind==='add'?s.points+o.value:o.kind==='mul'?s.points*o.value:o.kind==='percent'?Math.floor(s.points*(100+o.value)/100):Math.floor(s.points/o.value);lane=score(s.options[0])>=score(s.options[1])?0:1;}
 await page.evaluate(x=>window.__army.setX(x),s.options.length===3?(lane-1)*2.83:lane===0?-2.1:2.1);
 }
 await page.evaluate(()=>window.__army.step(.25));
 }
 const final=await page.evaluate(()=>window.__army.state());assert.equal(final.mode,'stopped');assert(final.distance>304,'optimal route clears');assert(final.units>0);
 console.log(viewport.width,'clear',final.points,final.type,'steps',guard);
 await page.getByRole('button',{name:'次のセクター'}).click();assert.equal(await page.evaluate(()=>window.__army.state().stage),2);
 // Tank render, remainder conservation, loss and pause flows.
 await page.evaluate(()=>{window.__army.start();window.__army.setSquad('tank',79);window.__army.step(.1);});
 assert.equal(await page.evaluate(()=>window.__army.state().units),7);
 await page.screenshot({path:`tests/artifacts/${viewport.width}-tank.png`});
 await page.getByRole('button',{name:'一時停止'}).click();const d=await page.evaluate(()=>window.__army.state().distance);await page.evaluate(()=>window.__army.step(5));assert.equal(await page.evaluate(()=>window.__army.state().distance),d);
 await page.getByRole('button',{name:'再開する'}).click();assert.equal(await page.evaluate(()=>window.__army.state().mode),'run');
 await page.evaluate(()=>{window.__army.setSquad('infantry',0);const ops=window.__army.state().options;window.__army.setX(ops.findIndex(o=>o.kind!=='add')===0?-2:2);window.__army.step(4);});assert.equal(await page.evaluate(()=>window.__army.state().mode),'stopped');
 await context.close();
 }
 assert.deepEqual(errors,[]);console.log('Desktop / touch / clear / next sector / loss / pause: PASS, no page errors.');
}finally{await browser.close();}
