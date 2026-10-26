import {test} from 'node:test';
import assert from 'node:assert/strict';
import {projectSnapshot, readSessions} from './projection.mjs';
const roster = [{id: 'one'}, {id: 'two'}, {id: 'internal', kind: 'system'}];
test('only a complete connected snapshot establishes idle; active wins over idle sessions', () => {
  const sessions = [{agentId: 'one', hasActiveRun: true}, {agentId: 'one', hasActiveRun: false}];
  assert.deepEqual(projectSnapshot(roster, sessions, {complete: true}).agents.map(a => a.state), ['working', 'idle']);
  assert.deepEqual(projectSnapshot(roster, sessions).agents.map(a => a.state), ['working', 'unknown']);
  assert.deepEqual(projectSnapshot(roster, sessions, {connected: false, complete: true}).agents.map(a => a.state), ['unknown', 'unknown']);
});
test('unattributed sessions prevent false idle states and transcripts are excluded', () => {
  const result = projectSnapshot(roster, [{prompt: 'private'}], {complete: true});
  assert.equal(result.complete, false);
  assert.equal(result.agents[0].state, 'unknown');
  assert.equal(JSON.stringify(result).includes('private'), false);
});
test('all pages are read, but broken cursors never establish completeness', async () => {
  const offsets = [];
  const result = await readSessions(async (_, {offset}) => {
    offsets.push(offset);
    return {sessions: [{agentId: 'one'}], hasMore: offset === 0, nextOffset: offset === 0 ? 100 : null};
  });
  assert.deepEqual(offsets, [0, 100]); assert.equal(result.complete, true);
  assert.equal((await readSessions(async () => ({sessions: [], hasMore: true, nextOffset: 0}))).complete, false);
});
