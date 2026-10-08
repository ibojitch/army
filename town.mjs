// Original roadside streetscape, baked into one mesh per block.
export function townBlock(index,rnd,add,items){
 const totals={houses:0,buildings:0,fields:0,cars:0,bunkers:0};
 const p=(shape,c,x,y,z,sx,sy,sz,rot)=>add(shape,c,x,y,z,sx,sy,sz,items,rot);
 const box=(c,x,y,z,sx,sy,sz,rot)=>p('box',c,x,y,z,sx,sy,sz,rot);
 const pick=a=>a[Math.floor(rnd()*a.length)];
 function tree(x,z){p('cylinder','#6e6047',x,.8,z,.095,1.6,.095);for(const [dx,dy,dz]of[[0,1.85,0],[.4,1.65,.15],[-.4,1.65,-.1]])p('sphere',pick(['#758b60','#7f965f','#69815b']),x+dx,dy,z+dz,.6,.62,.55);}
 function fence(x,z,length,axis='z'){
  const n=Math.ceil(length/.65);for(let i=0;i<=n;i++){const d=(i/n-.5)*length;box('#a08d6a',x+(axis==='x'?d:0),.34,z+(axis==='z'?d:0),.07,.68,.07);}
  for(const y of [.22,.5])box('#b9a885',x,y,z,axis==='x'?length:.05,.065,axis==='z'?length:.05);
 }
 function car(x,z){
  totals.cars++;const body=pick(['#759fa1','#a65948','#ded6ba','#536974','#8b9475']);
  box('#323a37',x,.14,z,.92,.18,1.85);box(body,x,.34,z,1.02,.3,2.12);box(body,x,.59,z-.12,.9,.3,1.17);box('#354b50',x,.62,z-.73,.79,.23,.025);box('#42585c',x,.61,z+.48,.8,.22,.025);
  for(const s of[-1,1]){box('#384e52',x+s*.458,.61,z-.12,.018,.23,.96);box(body,x+s*.473,.61,z-.1,.025,.25,.06);box('#353b39',x,.24,z+s*1.08,.94,.09,.06);
   for(const wz of[-.65,.65]){p('cylinder','#282c29',x+s*.5,.2,z+wz,.2,.085,.2,[0,0,Math.PI/2]);p('cylinder','#a6ac9f',x+s*.547,.2,z+wz,.105,.008,.105,[0,0,Math.PI/2]);}
   box('#fff0c2',x+s*.32,.36,z+1.065,.2,.09,.03);box('#9b4439',x+s*.32,.36,z-1.065,.19,.08,.03);
  }
  box('#c5c9b6',x,.3,z+1.102,.24,.06,.015);
 }
 function house(side,x,z){
  totals.houses++;const wall=pick(['#d7cbb0','#dcd7c3','#c5bfa8','#d5c1a1']),roof=pick(['#a36b50','#96785e','#777b72']);
  box('#858372',x,.1,z,3.05,.2,3.3);box(wall,x,1.03,z,2.8,1.86,3.0);
  for(const s of[-1,1]){box(roof,x+s*.71,2.14,z,1.85,.13,3.48,[0,0,-s*.46]);for(let band=0;band<7;band++)box('#7e6350',x+s*.71,2.213,z-1.45+band*.48,1.78,.012,.025,[0,0,-s*.46]);}
  box(roof,x,2.55,z,.12,.12,3.48);box('#a18c75',x+.8,2.5,z-.65,.32,.9,.38);box('#6d655a',x+.8,2.96,z-.65,.4,.08,.45);
  // Street-facing entrance and windows, plus a second facade toward the camera.
  const front=x-side*1.415;box('#655c4e',front,.72,z,.045,1.3,.58);box('#ae9980',front-side*.28,.07,z,.55,.12,.85);box('#ddd9bd',front-side*.13,1.46,z,.43,.09,.81);
  for(const dz of[-.96,.96]){box('#e7e0c9',front,1.14,z+dz,.05,.77,.71);box('#49616b',front-side*.035,1.14,z+dz,.015,.62,.56);box('#dfdcc3',front-side*.05,1.14,z+dz,.016,.62,.025);}
  for(const dx of[-.78,.78]){box('#e6dfc6',x+dx,1.17,z+1.515,.66,.76,.04);box('#435b64',x+dx,1.17,z+1.546,.52,.62,.02);box('#dfd8bc',x+dx,1.17,z+1.56,.025,.62,.014);}
  box('#9b9d84',x-side*1.95,.04,z,1.1,.07,4.5);box('#a3a087',side*6.65,.055,z+.82,1.45,.08,2.75);if(rnd()<.85)car(side*6.65,z+.82);
  fence(x-side*1.85,z-2.22,2.4,'x');fence(x+side*1.65,z,4.6);tree(x+side*2.3,z-1.4);
  box('#6f7a66',front-side*.1,.23,z-1.68,.16,.42,.14);box('#aa9a7d',front-side*.15,.48,z-1.68,.32,.15,.22);
 }
 function building(side,x,z){
  totals.buildings++;const height=pick([2,2.6,3.1]),width=3.6,depth=4.55,wall=pick(['#b8b6a6','#c8c3b2','#babfaf','#c7bda9']);
  box('#8d8b7c',x,.1,z,width+.2,.2,depth+.2);box(wall,x,height/2+.16,z,width,height,depth);box('#808679',x,height+.22,z,width+.16,.14,depth+.16);
  for(const s of[-1,1]){box(wall,x+s*(width/2-.08),height+.38,z,.12,.32,depth);box(wall,x,height+.38,z+s*(depth/2-.08),width,.32,.12);}
  const front=x-side*(width/2+.01);for(let floor=0;floor<(height>2.2?2:1);floor++)for(let j=0;j<4;j++){const y=.83+floor*1.13,dz=z-1.65+j*1.1;box('#777c71',front,y,dz,.035,.71,.76);box('#4c6267',front-side*.025,y,dz,.012,.6,.66);box('#d2d1bd',front-side*.04,y,dz,.013,.6,.025);}
  for(let j=0;j<3;j++){box('#d8d5bf',x-1.15+j*1.15,1.0,z+depth/2+.02,.84,.77,.04);box('#4c6064',x-1.15+j*1.15,1.0,z+depth/2+.045,.7,.63,.02);}
  box('#40524f',front-side*.025,.7,z,.04,1.26,.72);box('#978a72',front-side*.24,1.58,z,.46,.09,1.05);
  for(let j=0;j<2;j++){box('#adb1a6',x-.65+j*1.3,height+.46,z+.4,.65,.4,.75);for(let k=0;k<4;k++)box('#626e68',x-.65+j*1.3,height+.67,z+.17+k*.13,.5,.025,.025);}
  p('cylinder','#787d72',x+.95,height+.62,z-1.3,.12,.65,.12);box('#9d9b88',side*6.38,.04,z,1.55,.065,4.8);car(side*6.45,z+1.0);
  box('#858a7c',x+side*2.3,.4,z+.6,.42,.8,.6);box('#6d7468',x+side*2.3,.84,z+.6,.45,.08,.65);
 }
 function field(side,x,z){
  totals.fields++;box('#827254',x,.025,z,4.7,.08,4.95);const wheat=rnd()<.4;
  for(let row=0;row<7;row++){const xx=x+(row-3)*.61;box('#a58b63',xx,.08,z,.32,.13,4.55);box('#6e634a',xx+.27,.06,z,.1,.04,4.6);
   for(let j=0;j<9;j++){const zz=z-2+j*.48;if(wheat){p('cone',pick(['#b8ac69','#c9b87c','#acac65']),xx,.31,zz,.095,.49,.1);box('#8c9658',xx,.14,zz,.04,.25,.04);}else{p('sphere',pick(['#587c4d','#718e51','#82975b']),xx,.2,zz,.2,.13,.2);box('#466443',xx,.12,zz,.04,.18,.04);}}
  }
  fence(x-side*2.45,z,5.05);fence(x,z-2.57,4.8,'x');box('#98a28b',x+side*2.52,.03,z,.24,.07,4.9);box('#788675',x+side*2.52,.04,z,.12,.018,4.8);
  box('#b89d72',x-side*1.6,.26,z+2.2,.57,.48,.51);box('#ab8f62',x-side*.85,.22,z+2.2,.48,.4,.45);
 }
 for(const side of[-1,1]){
  const x=side*(index%4===0?9.25:8.9),kind=(index+(side===1?3:0))%8;
  box(kind===2?'#9b9e78':'#a8ad90',side*8.9,-.015,0,6.1,.06,5.93); // one contiguous lot
  box('#bcbca8',side*5.5,.025,0,1.5,.08,6);for(let j=0;j<6;j++)box('#999d8d',side*5.5,.069,-2.5+j,1.5,.006,.013);
  box('#90988a',side*4.75,.04,0,.15,.1,6);box('#6b756b',side*4.63,.02,0,.14,.022,6);
  if(kind===0||kind===4||kind===7)house(side,x,0);
  else if(kind===1||kind===5)building(side,x+.15*side,0);
  else if(kind===2)field(side,x+.25*side,0);
  else if(kind===3){
   box('#8a8e81',x,.015,0,4.6,.06,5.4);for(let j=0;j<3;j++){box('#d7d3b9',x+(j-1)*1.38,.052,0,.035,.016,4.5);car(x+(j-1)*1.38,j%2?.5:-.5);}tree(x+side*2.7,1.7);fence(x, -2.65,4.8,'x');
  }else{
   totals.bunkers++;box('#878b7b',x,.54,0,3.1,1.08,2.8);box('#a8ad9b',x,1.1,0,3.37,.18,3.04);box('#334039',x,.71,1.41,1.95,.2,.035);
   for(let row=0;row<2;row++)for(let j=0;j<7;j++)p('sphere','#b9aa83',x+(j-3)*.37+(row?.1:0),.13+row*.2,1.85,.23,.14,.21);
   for(let j=0;j<4;j++)box('#978565',x+side*2.25,.28+(j>1?.45:0),(j%2)*.65,.55,.5,.55);tree(x-side*1.9,-1.55);
  }
  // Street furniture anchors the houses to a human-sized sidewalk.
  if(index%2===0){p('cylinder','#626e65',side*5.68,1.45,-2.45,.035,2.9,.035);box('#626e65',side*5.38,2.93,-2.45,.65,.04,.055);box('#e0dac0',side*5.1,2.87,-2.45,.31,.06,.16);}
  if(index%4===1){tree(side*5.5,2.1);box('#7d8b6d',side*5.5,.06,2.1,.64,.11,.64);}
 }
 for(let j=0;j<3;j++)box('#dedbc6',0,.028,-2+j*2,.1,.022,.9);
 if(index%8===3)for(let j=0;j<8;j++)box('#d1cfba',-3.5+j,.034,0,.59,.014,1.9);
 return totals;
}
