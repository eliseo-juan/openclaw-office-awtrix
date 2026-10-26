import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {connectionPresentation,offlinePixels,offlineLetters,setupPreview}=require('./payload/connection-ui.js');
const {overlaps,obstaclesFor}=require('./payload/cafe-motion.js');

test('healthy walls stay normal; disconnect and timeout warn, then fresh data restores normal', () => {
  assert.deepEqual(connectionPresentation(true,1000,1500,15000),{offline:false,wallColor:0x364655});
  assert.equal(connectionPresentation(false,1000,1500,15000).wallColor,0xffa63d);
  assert.equal(connectionPresentation(true,1000,16001,15000).offline,true);
  assert.equal(connectionPresentation(true,17000,17001,15000).offline,false);
});
test('offline label is centered within 52 by 16 and does not reserve a status pixel', async () => {
  const pixels=offlinePixels();
  assert.equal(Math.min(...pixels.map(p=>p[0])),12);
  assert.equal(Math.max(...pixels.map(p=>p[0])),38);
  assert.equal(Math.min(...pixels.map(p=>p[1])),5);
  assert.equal(Math.max(...pixels.map(p=>p[1])),9);
  const source=await readFile(new URL('./OpenClawOfficeLive.ax',import.meta.url),'utf8');
  assert.deepEqual(JSON.parse(source.match(/var offline_letters = (\[[^\n]+\])/)[1]),offlineLetters);
  assert.doesNotMatch(source,/@config show_status\b|pixel\(1,14,/);
});
test('all six setup bots fit in the cafe without overlapping each other or furniture', async () => {
  const preview=setupPreview();
  assert.equal(preview.positions.length,6);
  const footprints=preview.positions.map(([x,y])=>[x-1,y,5,3]);
  for(const [i,footprint] of footprints.entries()) {
    assert.ok(footprint[0]>=1 && footprint[0]+5<preview.divider);
    for(const obstacle of obstaclesFor(preview.divider)) assert.equal(overlaps(footprint,obstacle),false);
    for(const other of footprints.slice(i+1)) assert.equal(overlaps(footprint,other),false);
  }
  assert.ok(preview.x>preview.divider && preview.x+preview.letters.length*4-1<51);
  const source=await readFile(new URL('./OpenClawOfficeLive.ax',import.meta.url),'utf8');
  assert.deepEqual(JSON.parse(source.match(/self.positions = (\[\[3,4\][^\n]+)/)[1]),preview.positions);
  assert.deepEqual(JSON.parse(source.match(/var setup_letters = (\[[^\n]+\])/)[1]),preview.letters);
});
