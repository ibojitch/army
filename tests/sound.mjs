import {apply,TYPES} from '../core.mjs';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/高田　正樹　（PRV）/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4174/?debug=1');await page.getByRole('button',{name:'出撃する'}).click();
 await page.waitForTimeout(850);
 let state=await page.evaluate(()=>window.__army.state());assert.equal(state.audio.context,'running');assert(state.audio.counts.music>0);assert(state.audio.rms>.001,'BGM produces an audio signal');
 await page.evaluate(()=>{window.__army.start();window.__army.setSquad('tank',79);});
 state=await page.evaluate(()=>window.__army.state());const selected=state.options.findIndex(o=>o.kind==='add'),expected=apply(state.points,state.options[selected]);assert(/^([+−]\d+|[+−]\d+%|×[\d.]+|1\/\d+)$/.test(state.gateLabels[0].label));assert.equal(state.gateLabels[0].sub,undefined);
 await page.screenshot({path:'tests/artifacts/390-unit-gate.png'});
 await page.evaluate(x=>{window.__army.setX(x);window.__army.step(3);},selected===0?-2:2);state=await page.evaluate(()=>window.__army.state());assert.equal(state.points,expected);assert.equal(state.units,Math.floor(expected/TYPES.tank.cost));assert(state.audio.counts.gate>0);
 await page.evaluate(()=>{window.__army.setX(3);for(let i=0;i<300&&window.__army.state().mode!=='battle';i++)window.__army.step(.05);window.__army.step(.15);});
 state=await page.evaluate(()=>window.__army.state());assert.equal(state.mode,'battle');assert(state.audio.counts.shot>0);assert(state.audio.counts.class>0);
 await page.evaluate(()=>window.__army.step(3));state=await page.evaluate(()=>window.__army.state());assert(state.audio.counts.explosion>0);
 await page.getByRole('button',{name:'一時停止'}).click();await page.waitForTimeout(300);state=await page.evaluate(()=>window.__army.state());assert.equal(state.audio.mode,'paused');assert(state.audio.rms<.001);const steps=state.audio.counts.music;
 await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>window.__army.state().audio.counts.music),steps);
 await page.getByRole('button',{name:'再開する'}).click();await page.waitForTimeout(400);assert((await page.evaluate(()=>window.__army.state().audio.counts.music))>steps);
 await page.getByRole('button',{name:'音 ON',exact:true}).click();await page.waitForTimeout(300);state=await page.evaluate(()=>window.__army.state());assert(!state.audio.enabled);assert(state.audio.rms<.001);
 await page.reload();await page.waitForFunction(()=>window.__army);assert(!(await page.evaluate(()=>window.__army.state().audio.enabled)));
 await page.getByRole('button',{name:'出撃する'}).click();await page.getByRole('button',{name:'音 OFF',exact:true}).click();await page.waitForTimeout(350);state=await page.evaluate(()=>window.__army.state());assert.equal(state.audio.context,'running');assert(state.audio.rms>.001);assert(state.audio.voices<96);
 assert.deepEqual(errors,[]);console.log('Gate labels / BGM signal / firing / explosions / pause / mute / preference: PASS.');
 console.log('Audio',state.audio);
}finally{await browser.close();}
