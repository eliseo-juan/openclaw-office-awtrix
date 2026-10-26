import test from 'node:test';
import assert from 'node:assert/strict';
import plugin from './index.mjs';

test('setup CLI registers before private configuration exists and starts no bridge', () => {
  let registration;
  plugin.register({pluginConfig: {}, registerCli: (registrar, metadata) => { registration = {registrar, metadata}; }, registerService() { assert.fail('Unconfigured plugin must not start a bridge'); }});
  assert.deepEqual(registration.metadata.commands, ['office']);
  assert.equal(registration.metadata.descriptors[0].name, 'office');
  const calls = [];
  const command = {command(value) { calls.push(value); return this; }, description() { return this; }, option() { return this; }, action(callback) { assert.equal(typeof callback, 'function'); return this; }};
  registration.registrar({program: command});
  assert.deepEqual(calls, ['office', 'setup']);
});
