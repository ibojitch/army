import * as THREE from './vendor/three.module.js';
import {TYPES,IDS,clamp,apply,numberPair,squad,units,combatStep,course,gateDisplay,createCombat,seededRandom} from './core.mjs';
import {Diorama} from './diorama.mjs';
import {INITIAL_B,carryBonus,supplyState,takeItem,travelSupply,logisticsPair} from './logistics.mjs';
import {ArmyAudio} from './sound.mjs';
const audio=new ArmyAudio();
const $=id=>document.getElementById(id),shell=$('shell');
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch(e){$('message').textContent='3D表示を開始できません。WebGL対応のブラウザで開いてください。';$('start').disabled=true;throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;$('field').append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#c2ccb6');scene.fog=new THREE.Fog('#a7c3ba',34,95);
const camera=new THREE.PerspectiveCamera(48,1,.1,150);camera.position.set(0,17,24);camera.lookAt(0,0,-9);
scene.add(new THREE.HemisphereLight('#d8f1ff','#575f36',2));
const sun=new THREE.DirectionalLight('#fff0c9',2.8);sun.position.set(-12,24,9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-15,right:15,top:22,bottom:-35,near:1,far:70});sun.shadow.bias=-.001;scene.add(sun);
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.8,...extra});
const materials={ground:mat('#78866a'),road:mat('#525e55'),edge:mat('#bcc4aa'),dark:mat('#202e2c'),blue:mat('#2795b2'),red:mat('#b84a3b'),skin:mat('#d2ad79'),helmet:mat('#274f52'),gold:mat('#edcf75'),rock:mat('#899082'),leaf:mat('#687957')};
const boxGeo=new THREE.BoxGeometry(1,1,1),sphereGeo=new THREE.SphereGeometry(1,8,6),cylGeo=new THREE.CylinderGeometry(1,1,1,10);
function mesh(geo,m,x,y,z,sx,sy,sz,parent){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function box(m,x,y,z,sx,sy,sz,parent){return mesh(boxGeo,m,x,y,z,sx,sy,sz,parent);}
const diorama=new Diorama(scene);
const glowMat=color=>new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85});
const allyRoot=new THREE.Group(),enemyRoot=new THREE.Group();scene.add(allyRoot,enemyRoot);
function model(type,enemy=false){return diorama.unit(type,enemy);}
let battleRandom=null,gateRandom=Math.random;
let a=squad('infantry',40),enemy=null,events=[],eventIndex=0,distance=0,stage=1,mode='ready',aim=0,groupX=0,time=0,battleClock=0,shotClock=0,toastTime=0,pausedFrom='run';
let supply=supplyState(),checkpoint={b:INITIAL_B,bonus:0};
const allyModels=[],enemyModels=[],gateRoot=new THREE.Group();scene.add(gateRoot);let gateObjects=[],visualKey='',enemyKey='';
function syncModels(root,list,s,key){
 const n=Math.min(units(s),s.type==='infantry'?120:s.type==='tank'?15:18),desired=s.type+':'+n;
 if(desired===key)return key;
 while(list.length){const g=list.pop();root.remove(g);g.traverse(o=>{if(o.isMesh&&o.geometry.type==='CircleGeometry'){o.geometry.dispose();o.material.dispose();}});}
 for(let i=0;i<n;i++){const g=model(s.type,root===enemyRoot);list.push(g);root.add(g);}
 return desired;
}
function layout(list,type,x,z,enemyFlag=false){
 const gap=type==='tank'?1.65:type==='artillery'?1.4:.6;
 const max=type==='tank'?(Math.abs(x)>1?3:5):type==='artillery'?(Math.abs(x)>1?3:5):(Math.abs(x)>1?8:12);
 const cols=Math.min(max,Math.max(1,Math.ceil(Math.sqrt(list.length)*1.4))),half=((cols-1)*gap+(type==='tank'?1.55:type==='artillery'?1.25:.5))/2;
 const center=clamp(x,-4.25+half,4.25-half),rowGap=type==='tank'?1.95:type==='artillery'?1.65:.6;
 list.forEach((g,i)=>{const row=Math.floor(i/cols),len=Math.min(cols,list.length-row*cols);const tx=center+(i%cols-(len-1)/2)*gap,tz=z+row*rowGap*(enemyFlag?-1:1);
 const ease=mode==='paused'?0:g.userData.placed?.22:1;g.position.x+=(tx-g.position.x)*ease;g.position.z+=(tz-g.position.z)*ease;g.userData.placed=true;g.rotation.y=enemyFlag?Math.PI:0;if(mode!=='paused')g.userData.recoil*=.83;
 if(g.userData.legs&&mode!=='paused'){const swing=mode==='run'&&!enemyFlag?Math.sin(time*13+i*2)*.45:0;g.userData.legs[0].rotation.x=swing;g.userData.legs[1].rotation.x=-swing;g.position.y=mode==='run'&&!enemyFlag?Math.abs(Math.sin(time*13+i))*.035:0;}
 });
}
function label(text,color,item){
 const c=document.createElement('canvas');c.width=512;c.height=320;const p=c.getContext('2d');
 p.fillStyle='#101f19';p.fillRect(0,0,512,320);p.strokeStyle=color;p.lineWidth=10;p.strokeRect(5,5,502,310);
 p.textAlign='center';p.textBaseline='middle';p.fillStyle=color;
 const lines=text.split('\n');p.font=(lines.length>1?'900 112px':item?'900 190px':'900 220px')+' Arial, system-ui, sans-serif';
 lines.forEach((line,i)=>p.fillText(line,256,(item?110:160)+(i-(lines.length-1)/2)*132,464));
 if(item){p.fillStyle=item==='truck'?'#9ee6ff':'#ffac83';p.font='900 76px Arial, system-ui, sans-serif';p.fillText(item==='truck'?'補給 B+10':'毒 B↓',256,260,460);}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
 return new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}));
}
function disposeGates(){for(const g of gateObjects)g.traverse(o=>{if(o.isMesh){if(o.material.map)o.material.map.dispose();if(o.userData.owned){if(o.geometry!==boxGeo)o.geometry.dispose();o.material.dispose();}}});gateRoot.clear();gateObjects=[];}
function showGate(e){
 disposeGates();if(!e||e.kind==='battle')return;
 e.options??=e.kind==='class'?IDS:logisticsPair(a.points,e.index,a.type,gateRandom);
 const w=8.5/e.options.length;
 e.options.forEach((op,i)=>{
 const g=new THREE.Group();g.position.x=(i-(e.options.length-1)/2)*w;const color=e.kind==='class'?'#8ddcff':(op.kind==='add'||op.kind==='percent')&&op.value<0||op.kind==='div'?'#ffad83':'#ddff85';
 const gm=mat(color,{emissive:color,emissiveIntensity:.35});for(const side of [-1,1]){const p=box(gm,side*(w/2-.1),2.1,0,.16,4.2,.2,g);p.userData.owned=true;}const bar=box(gm,0,4.2,0,w,.16,.2,g);bar.userData.owned=true;
 const display=e.kind==='class'?{label:op==='artillery'?'対戦車\n砲兵':TYPES[op].name}:gateDisplay(op,a.type,a.points);
 const sign=label(display.label,color,op.item);sign.scale.set(w-.08,2.8,1);sign.position.y=2.9;sign.userData.owned=true;g.add(sign);
 const veil=new THREE.Mesh(new THREE.PlaneGeometry(w-.2,1.2),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.1,side:THREE.DoubleSide,depthWrite:false}));veil.position.y=.7;veil.userData.owned=true;g.add(veil);gateRoot.add(g);gateObjects.push(g);
 });
}
const tracers=[],pMats=[glowMat('#ffda86'),glowMat('#ffeac2'),glowMat('#ffc16c')];
let visualFire={ally:-10,enemy:-10};
function burst(x,z,n=12){diorama.gateBurst(x,z,n);}
function casualties(list,type,count){
 for(let i=0;i<Math.min(count,type==='infantry'?3:2,list.length);i++){const unit=list[(i*7+Math.floor(Math.random()*list.length))%list.length];diorama.impact(unit.position.clone().add(new THREE.Vector3(0,.4,0)),type!=='infantry');diorama.casualty(unit);}
}
function shoot(list,target,enemyFlag){
 if(!list.length||!target.length||tracers.length>=64)return;
 const g=list[Math.floor(Math.random()*list.length)],t=target[Math.floor(Math.random()*target.length)],type=g.userData.type;
 const o=new THREE.Mesh(boxGeo,pMats[enemyFlag?2:1]);o.scale.set(type==='infantry'?.035:.11,type==='infantry'?.035:.11,type==='infantry'?.35:.65);o.position.copy(diorama.fire(g));
 const end=t.position.clone();end.y=.55;o.lookAt(end);scene.add(o);tracers.push({o,end,start:o.position.clone(),age:0,duration:type==='infantry'?.17:.34,heavy:type!=='infantry'});
}
$('sound').textContent=audio.enabled?'音 ON':'音 OFF';
$('sound').onclick=()=>{$('sound').textContent=audio.toggle()?'音 ON':'音 OFF';};
function toast(text){$('toast').textContent=text;toastTime=1.8;}
function hud(){
 $('points').textContent=a.points.toLocaleString();$('type').textContent=TYPES[a.type].name+' / 余り '+(a.points%TYPES[a.type].cost)+(units(a)>allyModels.length?' / 表示 '+allyModels.length:'');$('units').innerHTML=units(a).toLocaleString()+'<span>'+(a.type==='tank'?'両':'体')+'</span>';$('stage').textContent=String(stage).padStart(2,'0');$('progress').firstElementChild.style.width=(Math.min(100,distance/304*100))+'%';
 $('logistics').textContent=`兵站 B ${supply.b.toFixed(1)}%${supply.poison?' ↓':''} / 上限 ${carryBonus(100,supply.b)} PT`;
 [...$('classes').children].forEach((el,i)=>el.classList.toggle('active',IDS[i]===a.type));
 const e=events[eventIndex];
 if(mode==='battle')$('intel').textContent='交戦中：'+TYPES[enemy.type].name+' '+units(enemy)+(enemy.type==='tank'?'両':'体');
 else if(e?.kind==='class')$('intel').textContent='敵接近：'+TYPES[e.enemy.type].name+' '+units(e.enemy)+'体 → 兵種を選べ';
 else $('intel').textContent='';
}
function panel(title,text,button){mode='stopped';audio.setMode(mode);audio.cue(title.startsWith('SECTOR')?'clear':'defeat');$('overlay').hidden=false;$('overlay').querySelector('h1').innerHTML=title;$('message').textContent=text;$('start').innerHTML=button+' <span>→</span>';$('intel').textContent='';}
let advance=false;
function start(seed){gateRandom=typeof seed==='number'?seededRandom(seed):Math.random;audio.unlock();toastTime=0;$('toast').textContent='';$('toast').style.opacity=0;pointer=null;keys.clear();if(advance){checkpoint={b:supply.b,bonus:carryBonus(a.points,supply.b)};stage++;}advance=false;supply=supplyState(checkpoint.b);a=squad('infantry',40+checkpoint.bonus);events=course(stage);eventIndex=0;distance=0;aim=groupX=0;enemy=null;mode='run';audio.setMode(mode);battleClock=shotClock=0;clearFX();$('overlay').hidden=true;showGate(events[0]);hud();}
function newGame(){stage=1;advance=false;checkpoint={b:INITIAL_B,bonus:0};start();}
$('new-game').onclick=newGame;
function clearFX(){for(const t of tracers)scene.remove(t.o);tracers.length=0;diorama.clear();}
function togglePause(){if(mode==='run'||mode==='battle'){pausedFrom=mode;mode='paused';audio.setMode(mode);$('overlay').hidden=false;$('overlay').querySelector('h1').innerHTML='PAUSED';$('message').textContent='ひと休み。部隊は待機中。';$('start').innerHTML='再開する →';}else if(mode==='paused'){mode=pausedFrom;audio.unlock();audio.setMode(mode);$('overlay').hidden=true;}}
$('pause').onclick=togglePause;$('start').onclick=()=>mode==='paused'?togglePause():start();
let pointer=null,startX=0,startAim=0;const view=renderer.domElement;
view.addEventListener('pointerdown',e=>{if(mode!=='run')return;pointer=e.pointerId;startX=e.clientX;startAim=aim;view.setPointerCapture(e.pointerId);});
view.addEventListener('pointermove',e=>{const r=view.getBoundingClientRect();if(e.pointerType==='mouse'&&mode==='run')aim=clamp(((e.clientX-r.left)/r.width-.5)*9,-3.7,3.7);else if(e.pointerId===pointer)aim=clamp(startAim+(e.clientX-startX)/r.width*10,-3.7,3.7);});
for(const event of ['pointerup','pointercancel','lostpointercapture'])view.addEventListener(event,()=>pointer=null);
const keys=new Set();addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key==='Escape')togglePause();keys.add(e.key.toLowerCase());});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>{keys.clear();pointer=null;if(mode==='run'||mode==='battle')togglePause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&(mode==='run'||mode==='battle'))togglePause();});
function next(){eventIndex++;showGate(events[eventIndex]);}
function tick(dt){
 if(mode!=='paused')time+=dt;toastTime-=dt;$('toast').style.opacity=toastTime>0?1:0;
 if(mode==='run'){
 if(keys.has('arrowleft')||keys.has('a'))aim-=dt*6;if(keys.has('arrowright')||keys.has('d'))aim+=dt*6;aim=clamp(aim,-3.7,3.7);groupX+=(aim-groupX)*(1-Math.exp(-dt*12));distance+=dt*6.7;travelSupply(supply,dt*6.7);
 const e=events[eventIndex];if(e&&distance>=e.z){
 if(e.kind==='battle'){enemy={...e.enemy};battleRandom=createCombat();visualFire={ally:-10,enemy:-10};mode='battle';audio.setMode(mode);audio.cue('class');battleClock=shotClock=0;a.wound=0;burst(groupX,2);toast('交戦開始');}
 else{
 const lane=clamp(Math.floor((groupX+4.25)/8.5*e.options.length),0,e.options.length-1);
 if(e.kind==='class'){const type=e.options[lane];if(a.points<TYPES[type].cost)toast('編成不足：'+TYPES[type].name);else{a.type=type;a.wound=0;toast(TYPES[type].name+'に編成');audio.cue('class');}}
 else{const before=a.points,display=gateDisplay(e.options[lane],a.type,before);a.points=apply(a.points,e.options[lane]);toast(display.label+(e.options[lane].kind==='add'?(a.type==='tank'?'両':'体'):'')+' → '+units(a)+(a.type==='tank'?'両':'体'));audio.cue('gate',a.points>=before);if(e.options[lane].item){takeItem(supply,e.options[lane].item);toast(e.options[lane].item==='truck'?'補給トラック / B＋10':'補給障害 / 走行中にB減少');}}
 burst(groupX,2,28);next();if(!units(a)){advance=false;panel('UNIT<br><em>LOST</em>','部隊が全滅。ゲートと兵種を選び直そう。','コンティニュー');}
 }
 }
 if(!events[eventIndex]&&distance>304){advance=true;panel('SECTOR<br><em>CLEAR</em>',`ステージ ${stage} 突破！ 残存 ${a.points} PT / 兵站 ${supply.b.toFixed(1)}%。次は40＋ボーナス${carryBonus(a.points,supply.b)} PTで出撃。`,'次のセクター');}
 }else if(mode==='battle'){
 battleClock+=dt;shotClock+=dt;const [lost,killed]=combatStep(a,enemy,dt,battleRandom);if(lost){casualties(allyModels,a.type,lost);audio.explosion(a.type!=='infantry');}if(killed){casualties(enemyModels,enemy.type,killed);audio.explosion(enemy.type!=='infantry');}
 if(shotClock>.12){shotClock=0;audio.shot(a.type);audio.shot(enemy.type,true);if(battleClock-visualFire.ally>=TYPES[a.type].interval){visualFire.ally=battleClock;for(let i=0;i<Math.min(a.type==='infantry'?3:2,units(a));i++)shoot(allyModels,enemyModels,false);}if(battleClock-visualFire.enemy>=TYPES[enemy.type].interval){visualFire.enemy=battleClock;for(let i=0;i<Math.min(enemy.type==='infantry'?3:2,units(enemy));i++)shoot(enemyModels,allyModels,true);}}
 if(!units(a)){advance=false;panel('UNIT<br><em>LOST</em>',`敵の${TYPES[enemy.type].name}に敗北。相性と編成ポイントを見直そう。`,'コンティニュー');}
 else if(!units(enemy)){mode='run';audio.setMode(mode);audio.cue('gate');toast('突破 / '+a.points+' PT');enemy=null;next();}
 }
 visualKey=syncModels(allyRoot,allyModels,a,visualKey);layout(allyModels,a.type,groupX,2);diorama.fleet(allyRoot,allyModels,a.type,false);
 let preview=enemy;if(!preview&&(mode==='run'||mode==='ready')){const upcoming=events.slice(eventIndex).find(e=>e.kind==='battle');if(upcoming&&upcoming.z-distance<38)preview=upcoming.enemy;}
 if(preview){enemyKey=syncModels(enemyRoot,enemyModels,preview,enemyKey);enemyRoot.visible=true;const b=events.slice(eventIndex).find(e=>e.kind==='battle');layout(enemyModels,preview.type,0,enemy?-12:-(b.z-distance)-12,true);diorama.fleet(enemyRoot,enemyModels,preview.type,true);}else enemyRoot.visible=false;
 const e=events[eventIndex];if(e&&e.kind!=='battle'){gateRoot.position.z=2-(e.z-distance);gateObjects.forEach((g,i)=>{const lane=clamp(Math.floor((groupX+4.25)/8.5*gateObjects.length),0,gateObjects.length-1);g.scale.y=i===lane?1.06:1;});}

 if(mode!=='paused'){
 for(let i=tracers.length-1;i>=0;i--){const t=tracers[i];t.age+=dt;const f=Math.min(1,t.age/t.duration);t.o.position.lerpVectors(t.start,t.end,f);if(t.heavy)t.o.position.y+=Math.sin(f*Math.PI)*.22;if(f>=1){diorama.impact(t.end,t.heavy);scene.remove(t.o);tracers.splice(i,1);}}

 }
 diorama.update(dt,distance,mode==='paused');
 camera.position.set(Math.sin(time*73)*diorama.shake,17+Math.cos(time*61)*diorama.shake*.4,24);camera.lookAt(0,0,-9);
 hud();
}
function resize(){renderer.setSize(shell.clientWidth,shell.clientHeight);camera.aspect=shell.clientWidth/shell.clientHeight;camera.fov=camera.aspect>.65?52:58;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(shell);resize();
events=course(stage);showGate(events[0]);let last=performance.now(),acc=0;
function frame(now){const dt=Math.min((now-last)/1000,.1);last=now;acc+=dt;while(acc>=1/60){tick(1/60);acc-=1/60;}renderer.render(scene,camera);requestAnimationFrame(frame);}requestAnimationFrame(frame);
if(new URLSearchParams(location.search).has('debug'))window.__army={state:()=>({mode,stage,b:supply.b/100,poison:supply.poison,bonus:checkpoint.bonus,checkpoint:{...checkpoint},points:a.points,type:a.type,units:units(a),distance,eventIndex,enemy:enemy?{...enemy,units:units(enemy)}:null,gateLabels:events[eventIndex]?.options?.map(op=>typeof op==='string'?op:gateDisplay(op,a.type,a.points)),audio:audio.stats(),options:events[eventIndex]?.options}),start,newGame,setLogistics:(b,item)=>{supply=supplyState(b*100);takeItem(supply,item);},step:n=>{for(let i=0;i<Math.round(n*60);i++)tick(1/60);},setX:x=>{aim=groupX=clamp(x,-3.7,3.7);},setSquad:(type,points)=>{a=squad(type,points);if(events[eventIndex])delete events[eventIndex].options;showGate(events[eventIndex]);},renderer:()=>({calls:renderer.info.render.calls,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures}),pause:togglePause,presentation:()=>({town:diorama.townDebug(),effects:diorama.debug(),ally:allyModels.map(g=>({x:g.position.x,z:g.position.z,type:g.userData.type})),calls:renderer.info.render.calls}),impact:(heavy=true)=>diorama.impact(new THREE.Vector3(0,.55,-2),heavy)};
