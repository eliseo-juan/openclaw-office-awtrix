import {test} from 'node:test';
import assert from 'node:assert/strict';
import {displaySnapshot} from './display.mjs';
test('every agent has exactly one floor and packets fit the clock HTTP limit', () => {
  const agents = Array.from({length: 200}, (_, i) => ({id: `agent-${i}`, state:'working'}));
  const seen = [];
  for(let page = 0; page < 25; page++) {
    const packet = displaySnapshot({agents,connected:true,complete:true},page);
    assert.ok(Buffer.byteLength(JSON.stringify(packet)) < 8192);
    assert.equal(packet.pages,25); seen.push(...packet.agents.map(a => a.id));
  }
  assert.deepEqual(seen, agents.map(a => a.id));
});
