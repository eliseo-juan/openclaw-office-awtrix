import test from 'node:test';
import assert from 'node:assert/strict';
import {localCredentials} from './scripts/credentials.mjs';

test('local setup resolves a secure-store reference using the exact Gateway path', async () => {
  const reference = {source: 'store', provider: 'default', id: 'fixture-gateway-token'};
  const config = {gateway: {auth: {mode: 'token', token: reference}}};
  const result = await localCredentials(config, {resolve: async (cfg, value, path) => {
    assert.equal(cfg, config); assert.equal(value, reference); assert.equal(path, 'gateway.auth.token');
    return {value: 'fixture-resolved-secret'};
  }});
  assert.deepEqual(result, {token: 'fixture-resolved-secret'});
});
test('unavailable SecretRef fails closed without printing provider errors or using ambient fallback', async () => {
  const config = {gateway: {auth: {token: {source: 'store', provider: 'default', id: 'fixture'}}}};
  await assert.rejects(localCredentials(config, {env: {OPENCLAW_GATEWAY_TOKEN: 'unrelated-fallback'}, resolve: async () => { throw new Error('sensitive-provider-detail'); }}), error => !error.message.includes('sensitive-provider-detail') && /could not resolve/.test(error.message));
});
test('only selected password credential is resolved and exec providers require explicit input', async () => {
  assert.deepEqual(await localCredentials({gateway: {auth: {mode: 'password', password: ' fixture-password ', token: {source: 'store'}}}}), {password: 'fixture-password'});
  await assert.rejects(localCredentials({gateway: {auth: {token: {source: 'exec'}}}}), /explicit/);
});
