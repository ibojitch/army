import {townBlock} from './town.mjs';
import * as T from './vendor/three.module.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Shared geometry, vertex-colour models and instanced fleets keep draw load bounded.
export class Diorama {
 constructor(scene){
  this.scene=scene;this.box=new T.BoxGeometry(1,1,1);this.sphere=new T.SphereGeometry(1,12,8);this.cylinder=new T.CylinderGeometry(1,1,1,12);this.cone=new T.ConeGeometry(1,1,8);this.prototypes=new Map();this.fleets=new Map();
  this.paint=new T.MeshStandardMaterial({vertexColors:true,roughness:.72,metalness:.12});this.propsMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.94});
  this.effects=[];this.wrecks=[];this.shake=0;this.lastDistance=0;this.stats={shots:0,impacts:0,wrecks:0};this.buildWorld();this.buildEffects();
 }
 part(list,shape,color,pos,scale,rotation=[0,0,0]){list.push({geo:this[shape],color,pos,scale,rotation});}
 bake(parts){
  const p=[],n=[],colors=[],matrix=new T.Matrix4(),q=new T.Quaternion(),s=new T.Vector3(),v=new T.Vector3(),normal=new T.Vector3();
  for(const item of parts){const geo=item.geo.toNonIndexed(),c=new T.Color(item.color);q.setFromEuler(new T.Euler(...item.rotation));matrix.compose(v.set(...item.pos),q,s.set(...item.scale));const nm=new T.Matrix3().getNormalMatrix(matrix);
   for(let i=0;i<geo.attributes.position.count;i++){v.fromBufferAttribute(geo.attributes.position,i).applyMatrix4(matrix);normal.fromBufferAttribute(geo.attributes.normal,i).applyMatrix3(nm).normalize();p.push(v.x,v.y,v.z);n.push(normal.x,normal.y,normal.z);colors.push(c.r,c.g,c.b);}geo.dispose();
  }
  return new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(p,3)).setAttribute('normal',new T.Float32BufferAttribute(n,3)).setAttribute('color',new T.Float32BufferAttribute(colors,3));
 }
 prototype(type,enemy){
  const key=type+enemy;if(this.prototypes.has(key))return this.prototypes.get(key);
  const parts=[],gun=[],legs=[],body=enemy?'#ad6045':'#3b8994',trim=enemy?'#683f32':'#294c55',steel='#343b36',skin='#d7b995';const add=(shape,color,x,y,z,sx,sy,sz,list=parts,rot)=>this.part(list,shape,color,[x,y,z],[sx,sy,sz],rot);
  let muzzle;
  if(type==='infantry'){
   add('box',body,0,.67,0,.34,.43,.26);add('box',trim,0,.59,-.145,.3,.22,.07);add('box','#b6a580',0,.43,0,.37,.06,.3);
   add('sphere',skin,0,1.0,0,.16,.18,.15);add('sphere',trim,0,1.13,0,.205,.105,.2);add('box',trim,0,1.1,-.11,.36,.025,.21);
   add('box',body,-.23,.69,-.04,.12,.35,.14,parts,[0,0,.2]);add('box',body,.23,.72,-.06,.13,.32,.14,parts,[.3,0,-.2]);
   add('box',trim,0,.71,.18,.29,.32,.12);add('box','#bba77b',-.12,.56,-.18,.075,.12,.07);add('box','#bba77b',.12,.56,-.18,.075,.12,.07);
   add('box',steel,.2,.75,-.34,.07,.075,.53);add('box','#806546',.2,.72,-.15,.11,.1,.24);add('box',steel,.2,.65,-.27,.055,.12,.06);
   for(const side of [-1,1]){const l=[];add('box',trim,0,-.19,0,.14,.38,.15,l);add('box',steel,0,-.4,-.035,.16,.09,.25,l);legs.push({geo:this.bake(l),x:side*.105,y:.44});}
   muzzle=new T.Vector3(.2,.76,-.63);
  }else if(type==='artillery'){
   add('box',steel,0,.29,.1,.18,.15,.92);add('box',body,0,.66,-.03,.88,.64,.11);add('box',trim,0,.66,-.11,.48,.35,.06);
   for(const side of [-1,1]){
    add('cylinder',steel,side*.52,.31,.14,.3,.13,.3,parts,[0,0,Math.PI/2]);add('cylinder','#aa9e82',side*.59,.31,.14,.17,.025,.17,parts,[0,0,Math.PI/2]);
    add('box',trim,side*.31,.17,.68,.09,.13,1.15,parts,[0,side*.25,0]);add('box',steel,side*.43,.12,1.18,.25,.08,.22);
    add('box',body,side*.47,.5,.65,.23,.31,.25);add('sphere',skin,side*.47,.77,.65,.135,.14,.135);add('sphere',trim,side*.47,.87,.65,.17,.08,.17);
   }
   add('cylinder',steel,0,.73,-.78,.095,1.45,.095,gun,[Math.PI/2,0,0]);add('box',steel,0,.73,-1.49,.24,.17,.15,gun);add('box',body,0,.68,-.08,.25,.25,.48,gun);
   muzzle=new T.Vector3(0,.73,-1.58);
  }else{
   add('box',body,0,.5,0,1.23,.38,1.83);add('box',body,0,.67,-.58,1.13,.17,.7,parts,[-.16,0,0]);add('box',trim,0,.72,.53,.88,.08,.65);
   for(const side of [-1,1]){
    add('box',steel,side*.62,.28,0,.3,.4,1.86);add('box',trim,side*.62,.49,0,.36,.11,1.93);
    for(let j=0;j<6;j++)add('cylinder','#777965',side*.78,.28,-.68+j*.27,.155,.035,.155,parts,[0,0,Math.PI/2]);
    for(let j=0;j<10;j++){add('box','#656855',side*.62,.095,-.81+j*.18,.31,.055,.11);add('box','#656855',side*.62,.465,-.81+j*.18,.31,.025,.09);}
    add('box','#d7ccab',side*.45,.61,-.91,.14,.09,.06);add('box','#9ca58e',side*.47,.85,.55,.16,.2,.3);
   }
   add('box',body,0,.89,-.12,.81,.34,.89,gun);add('box',trim,0,1.08,-.07,.37,.06,.38,gun);
   add('cylinder',steel,0,.92,-1.02,.07,1.25,.07,gun,[Math.PI/2,0,0]);add('box',steel,0,.92,-1.66,.19,.14,.17,gun);
   add('cylinder',trim,0,.92,-.4,.16,.26,.16,gun,[Math.PI/2,0,0]);add('box','#b6c5bc',.43,.74,-.22,.025,.07,.26);
   add('cylinder','#403e34',-.38,.69,.84,.09,.5,.09,parts,[0,0,Math.PI/2]);add('box','#d2c19c',.25,1.08,-.12,.16,.025,.13,gun);add('cylinder','#414c43',-.29,1.36,.13,.012,.62,.012,gun);
   muzzle=new T.Vector3(0,.92,-1.77);
  }
  const result={body:this.bake(parts),gun:gun.length?this.bake(gun):null,legs,muzzle};this.prototypes.set(key,result);return result;
 }
 unit(type,enemy){const g=new T.Group();g.userData={type,enemy,recoil:0,legs:type==='infantry'?[new T.Object3D(),new T.Object3D()]:null};return g;}
 fleet(root,list,type,enemy){
  let fleet=this.fleets.get(root);const key=type+enemy;
  if(!fleet||fleet.key!==key){
   if(fleet)for(const m of fleet.meshes){root.remove(m);m.dispose();}
   const p=this.prototype(type,enemy),channels=[{geo:p.body}];if(p.gun)channels.push({geo:p.gun,gun:true});p.legs.forEach((l,i)=>channels.push({...l,leg:i}));
   const meshes=channels.map(c=>{const m=new T.InstancedMesh(c.geo,this.paint,120);m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;root.add(m);return m;});fleet={key,channels,meshes};this.fleets.set(root,fleet);
  }
  const matrix=new T.Matrix4(),local=new T.Matrix4(),q=new T.Quaternion(),pos=new T.Vector3(),scale=new T.Vector3(1,1,1);
  fleet.channels.forEach((channel,j)=>{const mesh=fleet.meshes[j];mesh.count=list.length;mesh.visible=list.length>0;
   list.forEach((g,i)=>{g.updateMatrix();local.identity();if(channel.gun)local.makeTranslation(0,0,g.userData.recoil*.16);if(channel.leg!==undefined){q.setFromEuler(g.userData.legs[channel.leg].rotation);local.compose(pos.set(channel.x,channel.y,0),q,scale);}matrix.multiplyMatrices(g.matrix,local);mesh.setMatrixAt(i,matrix);});mesh.instanceMatrix.needsUpdate=true;
  });
 }
 buildWorld(){
  const all=[],road=[];const add=(shape,c,x,y,z,sx,sy,sz,list=all,rot)=>this.part(list,shape,c,[x,y,z],[sx,sy,sz],rot);
  let seed=8439;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  this.world=new T.Group();this.scene.add(this.world);this.tiles=[];
  this.townPeriod=144;this.townStats={houses:0,buildings:0,fields:0,cars:0,bunkers:0};
  for(let i=0;i<24;i++){
   const items=[],z=-i*6,counts=townBlock(i,rnd,add,items);for(const key of Object.keys(counts))this.townStats[key]+=counts[key];
   const geo=this.bake(items),mesh=new T.Mesh(geo,this.propsMaterial);mesh.castShadow=true;mesh.receiveShadow=true;mesh.position.z=z;this.world.add(mesh);this.tiles.push({mesh,z});
  }
  // A mottled, baked miniature grass surface and a dusty road with wheel ruts.
  const texture=(road=false)=>{const c=document.createElement('canvas');c.width=c.height=256;const p=c.getContext('2d');p.fillStyle=road?'#777e75':'#9aa77d';p.fillRect(0,0,256,256);for(let i=0;i<5000;i++){p.fillStyle=road?(rnd()<.5?'#91958b':'#626a63'):(rnd()<.5?'#a7b58b':'#87976e');p.globalAlpha=.35;p.fillRect(rnd()*256,rnd()*256,1+rnd()*3,1+rnd()*3);}if(road){p.globalAlpha=.18;p.fillStyle='#3d4841';for(const x of [33,54,199,220])p.fillRect(x,0,5,256);}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(road?1:25,road?12:25);return t;};
  this.grass=new T.Mesh(new T.PlaneGeometry(180,160),new T.MeshStandardMaterial({map:texture(),roughness:1}));this.grass.rotation.x=-Math.PI/2;this.grass.position.set(0,-.05,-32);this.grass.receiveShadow=true;this.scene.add(this.grass);
  this.road=new T.Mesh(new T.PlaneGeometry(9,120),new T.MeshStandardMaterial({map:texture(true),roughness:1}));this.road.rotation.x=-Math.PI/2;this.road.position.set(0,.015,-40);this.road.receiveShadow=true;this.scene.add(this.road);
  for(const side of [-1,1])add('box','#c4bea0',side*4.7,.07,-40,.18,.2,120,road);
  const border=new T.Mesh(this.bake(road),this.propsMaterial);border.receiveShadow=true;this.scene.add(border);
 }
 buildEffects(){
  const tex=(fire=false)=>{const c=document.createElement('canvas');c.width=c.height=128;const p=c.getContext('2d'),g=p.createRadialGradient(64,64,0,64,64,64);if(fire){g.addColorStop(0,'#fff9db');g.addColorStop(.18,'#ffe29a');g.addColorStop(.45,'#ee8528dd');g.addColorStop(1,'#d3450000');}else{g.addColorStop(0,'#ffffffcc');g.addColorStop(.5,'#ffffff88');g.addColorStop(1,'#ffffff00');}p.fillStyle=g;p.fillRect(0,0,128,128);if(!fire){p.globalCompositeOperation='destination-out';for(let i=0;i<450;i++){p.globalAlpha=Math.random()*.15;p.fillRect(Math.random()*128,Math.random()*128,2,2);}}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;};
  this.smokeTexture=tex();this.fireTexture=tex(true);this.pool=[];
  for(let i=0;i<80;i++){const m=new T.SpriteMaterial({map:i<24?this.fireTexture:this.smokeTexture,transparent:true,depthWrite:false,blending:T.NormalBlending});const sprite=new T.Sprite(m);sprite.visible=false;this.scene.add(sprite);this.pool.push({sprite,fire:i<24,active:false});}
  this.rings=Array.from({length:8},()=>{const o=new T.Mesh(new T.RingGeometry(.8,1,32),new T.MeshBasicMaterial({color:'#c8b28b',transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}));o.rotation.x=-Math.PI/2;o.visible=false;this.scene.add(o);return {o,active:false};});
  this.debris=new T.InstancedMesh(this.box,new T.MeshStandardMaterial({vertexColors:false,color:'#b29c70',roughness:1}),160);this.debris.frustumCulled=false;this.scene.add(this.debris);this.bits=[];
  this.lights=Array.from({length:2},()=>{const l=new T.PointLight('#ffc278',0,7,2);this.scene.add(l);return l;});
 }
 puff(pos,{fire=false,size=1,life=1,color='#696a60',velocity=new T.Vector3(),growth=1}={}){
  const slot=this.pool.find(p=>!p.active&&p.fire===fire);if(!slot)return;slot.active=true;slot.age=0;slot.life=life;slot.size=size;slot.growth=growth;slot.velocity=velocity;slot.sprite.visible=true;slot.sprite.position.copy(pos);slot.sprite.scale.setScalar(size);slot.sprite.material.color.set(color);slot.sprite.material.opacity=fire?.9:.46;slot.sprite.material.rotation=Math.random()*6;
 }
 worldPoint(unit,point){return point.clone().applyAxisAngle(new T.Vector3(0,1,0),unit.rotation.y).add(unit.position);}
 fire(unit){
  const type=unit.userData.type,p=this.prototype(type,unit.userData.enemy),pos=this.worldPoint(unit,p.muzzle);unit.userData.recoil=1;this.stats.shots++;
  this.puff(pos,{fire:true,size:type==='infantry'?.35:.85,life:.075,color:'#ffffff',growth:2});
  if(type!=='infantry'){this.puff(pos,{size:.5,life:.65,color:'#b6ae99',velocity:new T.Vector3(0,.8,0),growth:2});if(!unit.userData.enemy&&type==='tank')this.shake=Math.max(this.shake,.09);}
  return pos;
 }
 impact(pos,heavy=false){
  this.stats.impacts++;const ground=pos.clone();ground.y=.12;
  if(heavy){this.puff(pos,{fire:true,size:1,life:.3,color:'#ffffff',growth:4});const light=this.lights[this.stats.impacts%2];light.position.copy(pos);light.intensity=5;this.shake=Math.max(this.shake,.055);}
  for(let i=0;i<(heavy?5:2);i++)this.puff(pos.clone().add(new T.Vector3((Math.random()-.5)*.7,Math.random()*.5,(Math.random()-.5)*.7)),{size:heavy?.6:.22,life:heavy?1.8:.5,color:heavy?'#585b56':'#b6a783',velocity:new T.Vector3((Math.random()-.5)*.9,heavy?.8:.4,(Math.random()-.5)*.9),growth:heavy?1.8:1});
  if(heavy){const ring=this.rings.find(r=>!r.active);if(ring){ring.active=true;ring.age=0;ring.o.visible=true;ring.o.position.copy(ground);}}
  for(let i=0;i<(heavy?12:4)&&this.bits.length<160;i++)this.bits.push({pos:pos.clone(),v:new T.Vector3((Math.random()-.5)*5,1+Math.random()*4,(Math.random()-.5)*5),life:.5+Math.random()*.7,size:.04+Math.random()*.07});
 }
 casualty(unit){
  if(this.wrecks.length>=16)return;const p=this.prototype(unit.userData.type,unit.userData.enemy),material=new T.MeshStandardMaterial({color:unit.userData.type==='infantry'?'#6d7d6c':'#555747',roughness:1,transparent:true}),o=new T.Mesh(p.body,material);o.position.copy(unit.position);o.rotation.y=unit.rotation.y;o.castShadow=true;
  const infantry=unit.userData.type==='infantry';if(infantry){o.rotation.z=Math.PI/2;o.position.y=.1;}else{o.rotation.z=(Math.random()-.5)*.18;this.puff(o.position.clone().add(new T.Vector3(0,.5,0)),{fire:true,size:.65,life:.5,color:'#ffac50',growth:.5});}
  if(!infantry&&p.gun){const turret=new T.Mesh(p.gun,material);turret.rotation.z=.12;turret.castShadow=true;o.add(turret);}
  this.scene.add(o);this.wrecks.push({o,life:infantry?.8:2.4,infantry});this.stats.wrecks++;
 }
 gateBurst(x,z,n){for(let i=0;i<Math.min(n,20)&&this.bits.length<160;i++)this.bits.push({pos:new T.Vector3(x,.5,z),v:new T.Vector3((Math.random()-.5)*3,2+Math.random()*2,(Math.random()-.5)*3),life:.35+Math.random()*.3,size:.035});}
 update(dt,distance,paused=false){
  const advance=distance-this.lastDistance;this.lastDistance=distance;
  this.tiles.forEach(({mesh,z})=>mesh.position.z=((z+distance+112)%this.townPeriod+this.townPeriod)%this.townPeriod-112);
  // Plane UV v decreases toward +z: positive offset moves road features toward the camera.
  this.road.material.map.offset.y=(distance/10)%1;this.grass.material.map.offset.y=(distance/(160/25))%1;
  if(paused)return;this.shake*=Math.exp(-dt*15);
  for(const p of this.pool){if(!p.active)continue;p.age+=dt;const t=p.age/p.life;if(t>=1){p.active=false;p.sprite.visible=false;continue;}p.sprite.position.z+=advance;p.sprite.position.addScaledVector(p.velocity,dt);p.sprite.scale.setScalar(p.size+p.growth*p.age);p.sprite.material.opacity=(p.fire?.95:.45)*Math.pow(1-t,p.fire?1:1.2);}
  for(const r of this.rings){if(!r.active)continue;r.o.position.z+=advance;r.age+=dt;if(r.age>.45){r.active=false;r.o.visible=false;continue;}r.o.scale.setScalar(.5+r.age*5);r.o.material.opacity=.2*(1-r.age/.45);}
  const obj=new T.Object3D();for(let i=this.bits.length-1;i>=0;i--){const b=this.bits[i];b.pos.z+=advance;b.life-=dt;b.v.y-=dt*9;b.pos.addScaledVector(b.v,dt);if(b.pos.y<.05){b.pos.y=.05;b.v.multiplyScalar(.3);}if(b.life<=0)this.bits.splice(i,1);}
  this.debris.count=this.bits.length;this.bits.forEach((b,i)=>{obj.position.copy(b.pos);obj.rotation.set(b.life*5,b.life*3,0);obj.scale.setScalar(b.size);obj.updateMatrix();this.debris.setMatrixAt(i,obj.matrix);});this.debris.instanceMatrix.needsUpdate=true;
  for(let i=this.wrecks.length-1;i>=0;i--){const w=this.wrecks[i];w.o.position.z+=advance;w.life-=dt;w.o.material.opacity=Math.min(1,w.life*2);if(w.life<=0){this.scene.remove(w.o);w.o.material.dispose();this.wrecks.splice(i,1);}}
  this.lights.forEach(l=>l.intensity*=Math.exp(-dt*18));
 }
 clear(){for(const p of this.pool){p.active=false;p.sprite.visible=false;}for(const r of this.rings){r.active=false;r.o.visible=false;}for(const w of this.wrecks){this.scene.remove(w.o);w.o.material.dispose();}this.wrecks=[];this.bits=[];this.debris.count=0;this.lights.forEach(l=>l.intensity=0);this.shake=0;this.lastDistance=0;}
 townDebug(){return {counts:{...this.townStats},distance:this.lastDistance,roadOffset:this.road.material.map.offset.y,grassOffset:this.grass.material.map.offset.y,period:this.townPeriod,tiles:this.tiles.map(t=>t.mesh.position.z)};}
 debug(){return {...this.stats,smoke:this.pool.filter(p=>p.active&&!p.fire).length,fire:this.pool.filter(p=>p.active&&p.fire).length,debris:this.bits.length,activeWrecks:this.wrecks.length};}
}
