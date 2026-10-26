import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {CafeMotion,stepToward,collisionBox,overlaps,obstaclesFor}=require('./payload/cafe-motion.js');
const {kitchenFor,tableFor}=require('./payload/kitchen.js');
const {layoutFor}=require('./payload/spike/layout.js');

test('three-pixel bodies can pass even when five-pixel sprite edges overlap', () => {
  const position=[2,4],peer=[5,4];
  assert.equal(overlaps([...position,5,3],[...peer,5,3]),true);
  assert.equal(overlaps(collisionBox(position),collisionBox(peer)),false);
  assert.deepEqual(stepToward(position,[2,5],26,{peers:[peer]}),[2,5]);
});
test('six and eight agents reserve separate cafe stops while crossing freely', () => {
  for(const count of [6,8]) {
    const layout=layoutFor(Array.from({length:count},(_,i)=>`bot-${i}`));
    const positions=layout.seats.map(s=>[s.bot.x,s.bot.y]);
    const motions=positions.map((_,i)=>new CafeMotion(400+i,{caffeine:'Espresso'}));
    const admitted=new Set();
    for(let now=0;now<60000;now+=135) {
      for(let i=0;i<count;i++) {
        const peers=positions.filter((_,j)=>j!==i);
        const reserved=motions.filter((_,j)=>j!==i).map(m=>m.target).filter(Boolean);
        positions[i]=motions[i].advance(positions[i],[layout.seats[i].bot.x,layout.seats[i].bot.y],'idle',layout.divider,now,{peers,reserved,desktops:layout.desktops});
        const body=collisionBox(positions[i]);
        if(motions[i].target?.join(',')===positions[i].join(',')&&positions[i][0]+3<layout.divider) {
          for(let j=0;j<count;j++) {
            if(j!==i&&motions[j].target?.join(',')===positions[j].join(',')&&positions[j][0]+3<layout.divider)
              assert.equal(overlaps(body,collisionBox(positions[j])),false,'stopped agents do not overlap');
          }
        }
        for(const obstacle of obstaclesFor(layout.divider,layout.desktops)) assert.equal(overlaps(body,obstacle),false);
        if(admitted.has(i))assert.ok(positions[i][0]+3<layout.divider,'idle body stays in cafe');
        if(positions[i][0]+3<layout.divider)admitted.add(i);
      }
    }
    assert.ok(admitted.size>0);
  }
});
test('all room sizes have a two-pixel kitchenette and one centered table without legs', async () => {
  const source=await readFile(new URL('./OpenClawOfficeLive.ax',import.meta.url),'utf8');
  const native=JSON.parse(source.match(/self.rooms = (\{[^\n]+\})/)[1]);
  for(const divider of [19,26,33]) {
    const geometry=kitchenFor(divider,{wood:-1,edge:-2,plant:-3});
    assert.deepEqual(native[divider],geometry);
    const table=tableFor(divider);
    assert.deepEqual(table.slice(1),[7,7,2]);
    assert.ok(Math.abs(table[0]+3.5-divider/2)<=0.5);
    assert.equal(geometry.filter(rect=>rect[1]>=3).length,1);
    for(const rect of geometry.filter(rect=>rect[1]<3))assert.ok(rect[1]+rect[3]<=3);
  }
});

test('returning to work follows the same route even with agents blocking every step', () => {
  const layout=layoutFor(Array.from({length:8},(_,i)=>`bot-${i}`));
  const desk=[layout.seats[0].bot.x,layout.seats[0].bot.y];
  let position=[2,3];
  const motion=new CafeMotion(1);
  let steps=0;
  while(position.join(',')!==desk.join(',')&&steps<100) {
    const expected=stepToward(position,desk,layout.divider,{desktops:layout.desktops});
    assert.notDeepEqual(expected,position,'furniture leaves a route to the desk');
    const actual=motion.advance(position,desk,'working',layout.divider,steps*100,{peers:[expected,desk],desktops:layout.desktops});
    assert.deepEqual(actual,expected,'other agents never delay the return');
    position=actual;steps++;
  }
  assert.deepEqual(position,desk);
});
