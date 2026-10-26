const canvas = document.querySelector('canvas'), ctx = canvas.getContext('2d');
const palette = [0x55c8c0,0xa59aeb,0xf19865,0xe8c25e,0xe281ad,0x8bc775,0x6da9ee,0xccccba];
const motions = new Map();
let data = {connected: false, complete: false, agents: []}, page = 0, receivedAt = 0;
const positions = new Map();
let lastLayout;
const caffeineSelect = document.querySelector('#caffeine-level');
caffeineSelect.onchange = () => motions.clear();
const styleSelect = document.querySelector('#bot-style');
for (const style of botStyles) {
  const option = document.createElement('option'); option.value = style.name;
  option.textContent = `${style.name} · ${style.width} × ${style.rows.length}`; styleSelect.append(option);
}
let preferredStyle;
try { preferredStyle = localStorage.getItem('office.botStyle'); } catch {}
styleSelect.value = botStyles.some(s => s.name === preferredStyle) ? preferredStyle : 'Jelly';
styleSelect.onchange = () => { preferredStyle = styleSelect.value; try { localStorage.setItem('office.botStyle',preferredStyle); } catch {} };
function rect(x,y,w,h,color) {
  ctx.fillStyle = '#' + color.toString(16).padStart(6,'0');
  ctx.fillRect(x*10,y*10,w*10,h*10);
}
function draw() {
  const fresh = Date.now() - receivedAt < 20000 && data.connected;
  const layout = layoutFor(data.agents.map(a => a.id), page); page = layout.page;
  const signature=layout.seats.map(s=>`${s.agentId}:${s.bot.x},${s.bot.y}`).join(';');
  if(signature!==lastLayout){positions.clear();motions.clear();lastLayout=signature;}
  document.querySelectorAll('#agents small').forEach((label,i) => { label.textContent = fresh ? data.agents[i].state : 'unknown'; });
  rect(0,0,52,16,0x080c10); rect(0,0,layout.divider,16,0x120e09);
  rect(0,0,52,1,0x364655); rect(0,15,52,1,0x364655); rect(0,0,1,16,0x364655);
  for (const x of [layout.divider,51]) { rect(x,0,1,6,0x364655); rect(x,10,1,6,0x364655); }
  for (const [x,y,w,h,color] of kitchenFor(layout.divider,{wood:0x92613a,edge:0x4a3326,plant:0x488d55})) rect(x,y,w,h,color);
  for (const d of layout.desktops) rect(d.x,d.y,d.width,d.height,0x92613a);
  const bots = [];
  layout.seats.forEach((seat,i) => {
    const agent = data.agents[page*8+i], state = fresh ? agent.state : 'unknown';
    const key = `${page}:${agent.id}`;
    let pos = positions.get(key) ?? [seat.bot.x,seat.bot.y];
    if (!motions.has(key)) motions.set(key,new CafeMotion(undefined,{caffeine:caffeineSelect.value}));
    const peers=layout.seats.filter(s=>s.agentId!==agent.id).map(s=>positions.get(`${page}:${s.agentId}`)??[s.bot.x,s.bot.y]);
    const reserved=layout.seats.filter(s=>s.agentId!==agent.id).map(s=>motions.get(`${page}:${s.agentId}`)?.target).filter(Boolean);
    pos = motions.get(key).advance(pos,[seat.bot.x,seat.bot.y],state,layout.divider,Date.now(),{peers,reserved,desktops:layout.desktops});
    positions.set(key,pos);
    if (pos[0] !== seat.bot.x || pos[1] !== seat.bot.y) {
      rect(seat.chair.x,seat.chair.y,3,2,0x364655); rect(seat.chair.x+1,seat.chair.y+(seat.facing==='up'?0:1),1,1,0x27353e);
    }
    rect(seat.screen.x,seat.screen.y,3,2,state==='working'?0x69d6bd:0x27353e);
    const hash = [...agent.id].reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,0);
    bots.push({pos, color: state==='unknown'?0x66717d:palette[hash%palette.length]});
  });
  const style = botStyles.find(s => s.name === styleSelect.value) ?? botStyles.find(s => s.name === 'Jelly');
  for (const {pos:[x,y],color} of bots) style.rows.forEach((row,r) => [...row].forEach((cell,c) => {
    if (cell === 'o') rect(x+Math.floor((5-style.width)/2)+c,y+3-style.rows.length+r,1,1,color);
  }));
  rect(1,14,1,1,fresh&&data.complete?0x69d6bd:0xff5b65);
  document.querySelector('#floor').textContent = `Floor ${page+1} / ${layout.pageCount}`;
  document.querySelector('#status').textContent = fresh ? (data.complete ? `${data.agents.length} agents · Live` : 'Synchronizing · incomplete activity remains unknown') : 'Offline · activity unknown';
}
async function refresh() {
  try {
    const response = await fetch('/api/state', {signal: AbortSignal.timeout(5000)});
    if (!response.ok) throw Error('Bridge unavailable');
    const next = await response.json();
    if (next.schema !== 1 || !Array.isArray(next.agents)) throw Error('Unsupported snapshot');
    data = next; receivedAt = Date.now();
    if (!preferredStyle && botStyles.some(s => s.name === next.botStyle)) styleSelect.value = next.botStyle;
    const list = document.querySelector('#agents'); list.replaceChildren();
    for (const agent of data.agents) {
      const item = document.createElement('li'), name = document.createElement('strong'), state = document.createElement('small');
      name.textContent = agent.label; state.textContent = data.connected ? agent.state : 'unknown';
      item.append(name,state); list.append(item);
    }
  } catch { data = {...data, connected:false}; }
  finally { setTimeout(refresh,1000); }
}
document.querySelector('#previous').onclick = () => { page = Math.max(0,page-1); };
document.querySelector('#next').onclick = () => { page++; };
function frame() { draw(); setTimeout(frame,caffeineProfiles[caffeineSelect.value].stepMs); }
frame(); void refresh();
