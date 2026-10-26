import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
await import('./scenes.js');
const {scenes,agentsFor}=globalThis.officeShowcase;
const styles=require('../payload/bot-styles.js');
const {layoutFor}=require('../payload/spike/layout.js');
const {CafeMotion,collisionBox,overlaps,obstaclesFor}=require('../payload/cafe-motion.js');

test('showcase scenarios use supported styles, realistic tasks and mostly working agents',()=>{
  for(const scene of Object.values(scenes)){
    const agents=agentsFor(scene);
    assert.equal(agents.length,scene.count);
    assert.ok(agents.filter(a=>a.state==='working').length>agents.length/2);
    assert.ok(styles.some(s=>s.name===scene.style));
    assert.ok(agents.every(a=>a.task&&a.label&&!a.id.includes('@')));
    for(let page=0;page<Math.ceil(scene.count/8);page++){
      const layout=layoutFor(agents.map(a=>a.id),page);
      assert.ok(layout.seats.length<=8);
      assert.equal(layout.page,page);
    }
  }
});
test('every showcase scenario settles all idle agents in the cafe away from furniture',()=>{
  for(const scene of Object.values(scenes)){
    const agents=agentsFor(scene);
    for(let page=0;page<Math.ceil(scene.count/8);page++){
      const layout=layoutFor(agents.map(a=>a.id),page);
      const positions=layout.seats.map(s=>[s.bot.x,s.bot.y]);
      const motions=positions.map((_,i)=>new CafeMotion(700+page*8+i,{caffeine:scene.caffeine}));
      for(let stamp=0;stamp<20000;stamp+=100){
        layout.seats.forEach((seat,i)=>{
          const agent=agents.find(a=>a.id===seat.agentId);
          positions[i]=motions[i].advance(positions[i],[seat.bot.x,seat.bot.y],agent.state,layout.divider,stamp,{peers:positions.filter((_,j)=>j!==i),reserved:motions.filter((_,j)=>j!==i).map(m=>m.target).filter(Boolean),desktops:layout.desktops});
        });
      }
      const idle=layout.seats.map((s,i)=>({agent:agents.find(a=>a.id===s.agentId),p:positions[i]})).filter(a=>a.agent.state==='idle');
      for(const {p} of idle){
        assert.ok(p[0]+3<layout.divider);
        assert.ok(obstaclesFor(layout.divider,layout.desktops).every(o=>!overlaps(collisionBox(p),o)));
      }
    }
  }
});

test('film changes the whole-office configuration or activity at least every three seconds',()=>{
  const {filmShots,filmDuration,filmShotAt}=globalThis.officeShowcase;
  let agents,previousScene,style;
  const demonstrated=new Set();
  for(let i=0;i<filmShots.length;i++){
    const shot=filmShots[i];
    assert.equal(filmShotAt(shot.at),shot);
    const next=filmShots[i+1]?.at??filmDuration;
    assert.ok(next-shot.at<=3000,'no long hold without a new shot');
    if(shot.scene!==previousScene){agents=agentsFor(scenes[shot.scene]);style=scenes[shot.scene].style;previousScene=shot.scene;}
    if(shot.style)style=shot.style;
    demonstrated.add(style);
    for(const [index,state] of shot.states??[])agents[index].state=state;
    assert.ok(agents.filter(a=>a.state==='working').length>agents.length/2,'most agents keep working');
    assert.ok(styles.some(s=>s.name===style),'one supported style for the whole office');
    assert.ok((shot.page??0)<Math.ceil(agents.length/8));
  }
  assert.deepEqual([...demonstrated].sort(),['Circuit','Jelly','Orbit','Wisp']);
  assert.equal(filmShotAt(filmDuration),filmShots[0]);
  assert.equal(filmShotAt(-16),filmShots[0],'the first animation timestamp can precede script startup');
});
