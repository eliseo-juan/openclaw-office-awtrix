import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
const {CafeMotion,caffeineProfiles}=createRequire(import.meta.url)('./payload/cafe-motion.js');

test('caffeine levels produce increasingly active cafe motion with identical seeded conditions', () => {
  const steps = {};
  for (const [caffeine,profile] of Object.entries(caffeineProfiles)) {
    const motion = new CafeMotion(1337,{caffeine});
    let position = [2,5], moved = 0;
    for (let time=0;time<180000;time+=profile.stepMs) {
      const next=motion.advance(position,[40,5],'idle',26,time);
      if (next.join(',')!==position.join(',')) moved++;
      assert.ok(next[0]+4<26,'idle motion stays in cafe');
      position=next;
    }
    steps[caffeine]=moved;
  }
  assert.ok(steps.Decaf>0);
  assert.ok(steps.Decaf<steps.Coffee,JSON.stringify(steps));
  assert.ok(steps.Coffee<steps.Espresso,JSON.stringify(steps));
});

test('native caffeine presets match browser behavior and replace low-level movement settings', async () => {
  const source=await readFile(new URL('./OpenClawOfficeLive.ax',import.meta.url),'utf8');
  const native=JSON.parse(source.match(/var caffeine_profiles = (\{[^\n]+\})/)[1]);
  for (const [name,profile] of Object.entries(caffeineProfiles)) assert.deepEqual(native[name],[profile.pauseMin,profile.pauseMax,profile.stepMs]);
  assert.match(source,/@config caffeine_level select "Caffeine level" default=Coffee options=Decaf,Coffee,Espresso/);
  assert.doesNotMatch(source,/@config (wander_enabled|cafe_pause_min|cafe_pause_max|walk_ms)\b/);
  for (const caffeine of Object.keys(caffeineProfiles)) {
    const motion=new CafeMotion(1337,{caffeine});
    assert.deepEqual(motion.advance([2,5],[40,5],'unknown',26,1000),[2,5]);
  }
});
