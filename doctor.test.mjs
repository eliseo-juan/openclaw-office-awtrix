import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnose, healthUrl, verifyDisplay} from './scripts/doctor.mjs';

test('health check respects the configured interface instead of assuming loopback', () => {
  assert.equal(healthUrl({http: {host: '192.0.2.10', port: 8791}}), 'http://192.0.2.10:8791/healthz');
  assert.throws(() => healthUrl({http: {host: '0.0.0.0'}}), /--host/);
  assert.equal(healthUrl({http: {host: '0.0.0.0'}}, 'localhost'), 'http://localhost:8790/healthz');
});
test('distinguishes network failure, authentication/sync failure, and ready state without leaking response content', async () => {
  const config = {http: {host: 'localhost'}};
  assert.equal((await diagnose(config, undefined, async () => { throw new Error('private'); })).status, 'unreachable');
  for (const [connected, complete, status] of [[false, false, 'gateway-disconnected'], [true, false, 'incomplete'], [true, true, 'ready']]) {
    const result = await diagnose(config, undefined, async () => ({ok: true, json: async () => ({connected, complete, secret: 'never-print'})}));
    assert.equal(result.status, status);
    assert.ok(!JSON.stringify(result).includes('never-print'));
    assert.equal(result.code, status === 'ready' ? 0 : 1);
  }
});

test('setup display verification requires a valid complete display page', async () => {
  const response = body => async () => ({ok: true, json: async () => body});
  const valid = {schema: 1, connected: true, complete: true, pages: 1, agents: []};
  assert.equal(await verifyDisplay({}, 'localhost', response(valid)), true);
  assert.equal(await verifyDisplay({}, 'localhost', response({...valid, complete: false})), false);
  assert.equal(await verifyDisplay({}, 'localhost', response({connected: true, complete: true})), false);
});
