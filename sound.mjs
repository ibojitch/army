// Original procedural soundtrack and effects. No external recordings.
export class ArmyAudio {
 constructor(){
  this.enabled=true;try{this.enabled=localStorage.getItem('armySound')!=='off';}catch{}
  this.mode='ready';this.ctx=null;this.voices=new Set();this.lastShots={};this.lastExplosion=-10;this.step=0;this.nextBeat=0;this.counts={music:0,shot:0,explosion:0,gate:0,class:0,clear:0,defeat:0};
 }
 async unlock(){
  if(!this.enabled)return;
  try{
   if(!this.ctx){
    const C=window.AudioContext||window.webkitAudioContext;if(!C){this.enabled=false;return;}
    this.ctx=new C();const c=this.ctx;
    this.master=c.createGain();this.master.gain.value=.55;
    this.compressor=c.createDynamicsCompressor();this.compressor.threshold.value=-18;this.compressor.knee.value=16;this.compressor.ratio.value=5;
    this.analyser=c.createAnalyser();this.analyser.fftSize=512;
    this.master.connect(this.compressor);this.compressor.connect(this.analyser);this.analyser.connect(c.destination);
    this.music=c.createGain();this.music.gain.value=.5;this.music.connect(this.master);
    this.fx=c.createGain();this.fx.gain.value=.75;this.fx.connect(this.master);
    this.delay=c.createDelay(.5);this.delay.delayTime.value=.23;
    const feedback=c.createGain(),wet=c.createGain();feedback.gain.value=.24;wet.gain.value=.2;
    this.delay.connect(feedback);feedback.connect(this.delay);this.delay.connect(wet);wet.connect(this.music);
    this.noise=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const data=this.noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
    this.timer=setInterval(()=>this.schedule(),50);
   }
   if(this.ctx.state==='suspended')await this.ctx.resume();
   this.master.gain.setTargetAtTime(this.enabled&&this.mode!=='paused'?.55:0,this.ctx.currentTime,.03);
   this.nextBeat=Math.max(this.nextBeat,this.ctx.currentTime+.04);
  }catch{this.enabled=false;}
 }
 toggle(){this.enabled=!this.enabled;try{localStorage.setItem('armySound',this.enabled?'on':'off');}catch{}
  if(!this.enabled){this.stopVoices();if(this.ctx)this.master.gain.setTargetAtTime(0,this.ctx.currentTime,.025);}else this.unlock();return this.enabled;
 }
 stopVoices(){for(const v of this.voices)try{v.stop();}catch{}this.voices.clear();}
 setMode(mode){
  if(this.mode===mode)return;this.mode=mode;
  if(!this.ctx)return;
  if(mode==='paused'||mode==='stopped'||mode==='ready'){this.stopVoices();this.step=0;this.nextBeat=this.ctx.currentTime+.04;}
  this.master.gain.setTargetAtTime(this.enabled&&mode!=='paused'?.55:0,this.ctx.currentTime,.03);
 }
 voice({frequency=100,end=frequency,duration=.2,volume=.1,type='sine',noise=false,filter=1000,pan=0,time,channel='fx',echo=false}){
  if(!this.enabled||!this.ctx||this.ctx.state!=='running'||this.mode==='paused'||this.voices.size>=96)return;
  const c=this.ctx,t=time??c.currentTime,source=noise?c.createBufferSource():c.createOscillator(),gain=c.createGain(),panner=c.createStereoPanner();
  if(noise){source.buffer=this.noise;source.loop=true;}else{source.type=type;source.frequency.setValueAtTime(frequency,t);source.frequency.exponentialRampToValueAtTime(Math.max(15,end),t+duration);}
  const tone=c.createBiquadFilter();tone.type=noise?'bandpass':'lowpass';tone.frequency.value=filter;tone.Q.value=noise?.65:.8;
  gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),t+.008);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
  panner.pan.value=pan;source.connect(tone);tone.connect(gain);gain.connect(panner);panner.connect(channel==='music'?this.music:this.fx);if(echo)panner.connect(this.delay);
  this.voices.add(source);source.onended=()=>{this.voices.delete(source);source.disconnect();tone.disconnect();gain.disconnect();panner.disconnect();};source.start(t);source.stop(t+duration+.025);
 }
 schedule(){
  if(!this.enabled||!this.ctx||this.ctx.state!=='running'||!['run','battle'].includes(this.mode))return;
  const now=this.ctx.currentTime;if(this.nextBeat<now-.2)this.nextBeat=now+.02;
  const beat=60/108/4;
  while(this.nextBeat<now+.12){const t=this.nextBeat,s=this.step%64,battle=this.mode==='battle',root=[55,43.65,65.41,49][Math.floor(s/16)];
   if(s%4===0){this.voice({frequency:135,end:42,duration:.2,volume:battle?.33:.24,time:t,channel:'music',filter:900});this.voice({frequency:root,duration:.23,volume:.13,type:'sawtooth',filter:230,time:t,channel:'music'});}
   if(s%8===4)this.voice({noise:true,filter:1800,duration:.13,volume:battle?.19:.1,time:t,channel:'music'});
   if(s%2===0)this.voice({noise:true,filter:8000,duration:.035,volume:.035,time:t,channel:'music',pan:s%4?-.2:.2});
   if(s%16===0)for(const ratio of [2,2.3784,2.9966])this.voice({frequency:root*ratio,duration:1.9,volume:.035,type:'triangle',filter:900,time:t,channel:'music',echo:true,pan:(ratio-2.5)*.5});
   const arp=[4,5.9932,4.7568,8,5.9932,4.7568,4,2.9966][s%8];
   if(battle||s%2===0)this.voice({frequency:root*arp,duration:.16,volume:battle?.045:.032,type:'triangle',filter:1800,time:t,channel:'music',echo:true,pan:Math.sin(s)*.3});
   this.counts.music++;this.step++;this.nextBeat+=beat;
  }
 }
 shot(type,enemy=false){
  if(!this.enabled||!this.ctx)return;const t=this.ctx.currentTime,key=enemy?'enemy':'ally',interval=type==='tank'?.95:type==='artillery'?.7:.2;
  if(t-(this.lastShots[key]??-10)<interval)return;this.lastShots[key]=t;this.counts.shot++;
  const pan=enemy?.3:-.25;
  if(type==='infantry'){
   for(let i=0;i<2;i++)this.voice({noise:true,filter:2200,duration:.055,volume:enemy?.1:.16,pan,time:t+i*.035});
   this.voice({frequency:170,end:65,duration:.07,volume:.09,pan});
  }else{
   this.voice({frequency:type==='tank'?100:145,end:28,duration:.38,volume:enemy?.2:.34,pan});
   this.voice({noise:true,filter:type==='tank'?750:1500,duration:.3,volume:.24,pan});
   this.voice({noise:true,filter:4000,duration:.035,volume:.13,pan});
  }
 }
 explosion(heavy=false){
  if(!this.enabled||!this.ctx)return;const t=this.ctx.currentTime;if(t-this.lastExplosion<.15)return;this.lastExplosion=t;this.counts.explosion++;
  this.voice({noise:true,filter:heavy?480:1000,duration:heavy?.6:.22,volume:heavy?.25:.12,pan:(Math.random()-.5)*.6});
  this.voice({frequency:heavy?75:160,end:22,duration:heavy?.5:.15,volume:heavy?.22:.08});
 }
 cue(name,positive=true){
  if(!this.enabled||!this.ctx||this.mode==='paused')return;this.counts[name]=(this.counts[name]||0)+1;
  const now=this.ctx.currentTime;
  const notes=name==='clear'?[261.63,329.63,392,523.25]:name==='defeat'?[220,174.61,130.81]:name==='class'?[146.83,220,293.66]:positive?[440,554.37,659.25]:[293.66,220,146.83];
  notes.forEach((f,i)=>this.voice({frequency:f,duration:name==='clear'?.45:.23,volume:.13,type:'triangle',filter:2200,time:now+i*.085,echo:true}));
  if(name==='class')this.voice({noise:true,filter:2200,duration:.4,volume:.1});
 }
 stats(){const data=new Float32Array(512);if(this.analyser)this.analyser.getFloatTimeDomainData(data);return {enabled:this.enabled,context:this.ctx?.state??'locked',mode:this.mode,voices:this.voices.size,counts:{...this.counts},rms:Math.sqrt(data.reduce((s,v)=>s+v*v,0)/data.length)};}
}
