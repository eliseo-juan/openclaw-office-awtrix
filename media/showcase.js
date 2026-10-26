const params=new URLSearchParams(location.search);
const mode=params.get('scene')??'crew';
const capture=params.has('capture');
if(capture)document.body.classList.add('capture');
if(mode==='cover')document.body.classList.add('cover');
if(mode==='film')document.body.classList.add('film');
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
const pixels=document.createElement('canvas');pixels.width=52;pixels.height=16;
const px=pixels.getContext('2d',{willReadFrequently:true});
const {scenes,agentsFor}=officeShowcase;
let scene,agents,positions,motions,page=0,time=0,last=0,elapsed=0,lastStep=0,chapter='',cue='',lastDraw=0,started=performance.now();
function configure(name){
  scene=scenes[name];agents=agentsFor(scene);page=0;positions=new Map();motions=new Map();time=0;lastStep=0;
  document.body.classList.toggle('styles',name==='styles');
  const h=document.querySelector('h1');h.replaceChildren(document.createTextNode(scene.title[0]),document.createElement('br'));
  const em=document.createElement('em');em.textContent=scene.title[1];h.append(em);
  document.querySelector('#subtitle').textContent=scene.subtitle;
  document.querySelector('#scene-label').textContent=scene.label;
  document.querySelector('#configuration').textContent=`${scene.count} AGENTS / ${scene.style.toUpperCase()} / ${scene.caffeine.toUpperCase()}`;
  seedPositions();
}
function seedPositions(){
  for(let floor=0;floor<Math.ceil(agents.length/8);floor++){
    const layout=layoutFor(agents.map(a=>a.id),floor);
    layout.seats.forEach((seat,i)=>{positions.set(seat.agentId,[seat.bot.x,seat.bot.y]);motions.set(seat.agentId,new CafeMotion(700+floor*8+i,{caffeine:scene.caffeine}));});
    for(let t=0;t<20000;t+=100)advanceFloor(floor,t);
  }
}
function advanceFloor(floor,stamp){
  const layout=layoutFor(agents.map(a=>a.id),floor);
  layout.seats.forEach(seat=>{
    const agent=agents.find(a=>a.id===seat.agentId);
    const peers=layout.seats.filter(s=>s.agentId!==agent.id).map(s=>positions.get(s.agentId));
    const reserved=layout.seats.filter(s=>s.agentId!==agent.id).map(s=>motions.get(s.agentId).target).filter(Boolean);
    positions.set(agent.id,motions.get(agent.id).advance(positions.get(agent.id),[seat.bot.x,seat.bot.y],agent.state,layout.divider,stamp,{peers,reserved,desktops:layout.desktops}));
  });
}
function rect(x,y,w,h,color){px.fillStyle='#'+color.toString(16).padStart(6,'0');px.fillRect(x,y,w,h);}
function drawMap(){
  const layout=layoutFor(agents.map(a=>a.id),page);
  rect(0,0,52,16,0x080c10);rect(0,0,layout.divider,16,0x120e09);
  const wall=0x364655;
  rect(0,0,52,1,wall);rect(0,15,52,1,wall);rect(0,0,1,16,wall);
  for(const x of [layout.divider,51]){rect(x,0,1,6,wall);rect(x,10,1,6,wall);}
  for(const [x,y,w,h,color] of kitchenFor(layout.divider,{wood:0x92613a,edge:0x4a3326,plant:0x488d55}))rect(x,y,w,h,color);
  for(const d of layout.desktops)rect(d.x,d.y,d.width,d.height,0x92613a);
  const style=botStyles.find(s=>s.name===scene.style);
  for(const seat of layout.seats){
    const agent=agents.find(a=>a.id===seat.agentId),p=positions.get(agent.id);
    if(p[0]!==seat.bot.x||p[1]!==seat.bot.y){rect(seat.chair.x,seat.chair.y,3,2,wall);rect(seat.chair.x+1,seat.chair.y+(seat.facing==='up'?0:1),1,1,0x27353e);}
    rect(seat.screen.x,seat.screen.y,3,2,agent.state==='working'?0x69d6bd:0x27353e);
  }
  for(const seat of layout.seats){
    const agent=agents.find(a=>a.id===seat.agentId),[x,y]=positions.get(agent.id);
    style.rows.forEach((row,r)=>[...row].forEach((cell,c)=>{if(cell==='o')rect(x+Math.floor((5-style.width)/2)+c,y+3-style.rows.length+r,1,1,agent.color);}));
  }
  const data=px.getImageData(0,0,52,16).data;
  ctx.clearRect(0,0,1248,384);ctx.fillStyle='#080e0b';ctx.fillRect(0,0,1248,384);
  for(let y=0;y<16;y++)for(let x=0;x<52;x++){
    const i=(y*52+x)*4,r=data[i],g=data[i+1],b=data[i+2];
    ctx.fillStyle=`rgb(${r},${g},${b})`;
    ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=Math.max(r,g,b)>90?9:0;
    ctx.beginPath();ctx.roundRect(x*24+3,y*24+3,18,18,4);ctx.fill();
    ctx.shadowBlur=0;
  }
  const working=agents.filter(a=>a.state==='working').length;
  document.querySelector('#working').textContent=working;
  document.querySelector('#idle').textContent=agents.length-working;
  document.querySelector('#floor').textContent=layout.pageCount>1?`FLOOR ${page+1} / ${layout.pageCount} · ${agents.length} AGENTS`:'ONE OFFICE. YOUR WHOLE CREW.';
  const focus=agents.find(a=>a.id===layout.seats[0].agentId);
  document.querySelector('#activity').textContent=focus.label+' · '+focus.task;
  document.querySelector('#working-label').textContent=layout.pageCount>1?'working across 2 floors':'working';
}
function stylesGrid(){
  const grid=document.createElement('div');grid.className='style-grid';
  const preferred=['Orbit','Jelly','Wisp','Circuit'];
  const gallery=[...preferred.map(name=>botStyles.find(s=>s.name===name)),...botStyles.filter(s=>!preferred.includes(s.name))];
  gallery.forEach((style,i)=>{
    const card=document.createElement('div');card.className='style-card';
    const c=document.createElement('canvas');c.width=100;c.height=75;const cx=c.getContext('2d');
    cx.fillStyle='#'+[0xa4e6ce,0xa59aeb,0xf19865,0xe8c25e][i%4].toString(16);
    const scale=13,ox=(100-style.width*scale)/2,oy=(75-style.rows.length*scale)/2;
    style.rows.forEach((row,y)=>[...row].forEach((cell,x)=>{if(cell==='o')cx.fillRect(ox+x*scale,oy+y*scale,scale-2,scale-2);}));
    const name=document.createElement('strong');name.textContent=style.name;
    const size=document.createElement('small');size.textContent=`${style.width} PX WIDE`;
    card.append(c,name,size);grid.append(card);
  });document.querySelector('main').append(grid);
}
function tick(stamp){
  elapsed=stamp-started;
  if(mode==='film'){
    const t=elapsed%36000;
    const next=t<11000?'crew':t<16000?'small':t<22000?'busy':t<28000?'fleet':'crew';
    const shot=t<2200?'Meet your crew.':t<6500?'Back to work.':t<11000?'Coffee break.':t<16000?'Start small.':t<22000?'Room for eight.':t<28000?'Keep growing.':t<33000?'Make it yours.':'OpenClaw Office.';
    if(next!==chapter){
      const old=document.createElement('canvas');old.width=canvas.width;old.height=canvas.height;old.getContext('2d').drawImage(canvas,0,0);
      old.style.cssText='position:absolute;top:11px;left:29px;pointer-events:none';canvas.parentElement.append(old);
      old.animate([{opacity:1},{opacity:0}],{duration:350,easing:'ease-out'}).finished.then(()=>old.remove());
      configure(next);chapter=next;last=stamp;time=0;
      document.querySelector('.device-wrap').animate([{transform:t<1000?'scale(1.12) translateY(12px)':'scale(.98) translateY(7px)'},{transform:'scale(1) translateY(0)'}],{duration:t<1000?2300:1800,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'});
    }
    if(next==='fleet')page=t>=25000?1:0;
    if(t>=28000)scene={...scene,style:t<29250?'Wisp':t<30500?'Circuit':t<31750?'Orbit':'Jelly'};
    if(shot!==cue){
      cue=shot;document.querySelector('h1').textContent=shot;
      document.querySelector('h1').animate([{opacity:0,transform:'translateY(12px)',filter:'blur(4px)'},{opacity:1,transform:'translateY(0)',filter:'blur(0)'}],{duration:650,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'});
    }
  }
  if(mode==='cover'&&elapsed>=14000){configure('crew');started=stamp;elapsed=0;last=stamp;time=0;}
  if(mode==='cover')scene={...scene,style:elapsed<3500?'Jelly':elapsed<7000?'Orbit':elapsed<10500?'Wisp':'Circuit'};
  if(last)time+=Math.min(stamp-last,250);last=stamp;
  const activeCrew=(mode==='cover'||(mode==='film'&&chapter==='crew'));
  if(activeCrew){
    if(time>2200)agents[2].state='working';
    if(time>6500)agents[4].state='idle';
    document.querySelector('#activity').textContent=time>2200&&time<6500?'Researcher · Back to the desk':time>6500?'Writer · Taking a coffee break':'Builder · Implementing the settings panel';
  }
  if(time-lastStep>=caffeineProfiles[scene.caffeine].stepMs){
    for(let floor=0;floor<Math.ceil(agents.length/8);floor++)advanceFloor(floor,20000+time);
    lastStep=time;
  }
  if(stamp-lastDraw>=90){drawMap();lastDraw=stamp;}
  if(activeCrew&&time>2200)document.querySelector('#activity').textContent=time<6500?'Researcher · Back to the desk':'Writer · Taking a coffee break';
  requestAnimationFrame(tick);
}
configure(['film','cover'].includes(mode)?'crew':scenes[mode]?mode:'crew');
stylesGrid();document.querySelector('.style-grid').hidden=mode!=='styles';
for(const b of document.querySelectorAll('nav button'))b.onclick=()=>{location.search=new URLSearchParams({scene:b.dataset.scene});};
window.showcase={get state(){return {scene:chapter||mode,page,agents:agents.map(a=>({...a,position:positions.get(a.id)}))};},setPage(value){page=value;drawMap();}};
if(params.has('floor'))page=Number(params.get('floor'))||0;
if(botStyles.some(s=>s.name===params.get('style')))scene={...scene,style:params.get('style')};
if(mode==='film'&&params.has('still'))document.querySelector('h1').textContent='Meet your crew.';
if(params.has('still'))drawMap();else requestAnimationFrame(tick);
