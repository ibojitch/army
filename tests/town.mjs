import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'C:/Users/高田　正樹　（PRV）/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:4174/?debug=1');await page.waitForFunction(()=>window.__army);
 const {before,after,paused,end,reset}=await page.evaluate(()=>{
  const a=window.__army;a.start(17);a.step(.05);const before=a.presentation().town;a.step(.1);const after=a.presentation().town;
  a.pause();const paused=a.presentation().town;a.step(1);const end=a.presentation().town;a.start(17);a.step(0);const reset=a.presentation().town;
  return {before,after,paused,end,reset};
 });
 const delta=after.distance-before.distance,near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
 assert(delta>0);
 // Plane lengths and texture repeats define UV-to-world scale; all layers must move +z together.
 near((after.roadOffset-before.roadOffset)*120/12,delta);
 near((after.grassOffset-before.grassOffset)*160/25,delta);
 for(let i=0;i<before.tiles.length;i++)near((after.tiles[i]-before.tiles[i]+after.period)%after.period,delta);
 assert.deepEqual(paused,end,'pause freezes every streetscape layer');
 for(const key of ['houses','buildings','fields','cars','bunkers'])assert(after.counts[key]>=6,`${key} present throughout town`);
 assert.deepEqual(reset.counts,after.counts,'retry reuses town without duplicating props');
 console.log('Town lots / matching road and terrain scroll / pause / retry: PASS',after.counts);
}finally{await browser.close();}
