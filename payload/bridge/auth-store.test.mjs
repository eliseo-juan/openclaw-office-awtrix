import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {verify} from 'node:crypto';
import {createAuthStore} from './auth-store.mjs';

test('device identity survives process restarts and its signatures verify', () => {
  const directory = mkdtempSync(join(tmpdir(), 'office-auth-'));
  const store = createAuthStore(directory, 'https://gateway.example');
  const identity = store.loadOrCreateDeviceIdentity();
  const resumed = createAuthStore(directory, 'https://gateway.example').loadOrCreateDeviceIdentity();
  assert.equal(resumed.deviceId, identity.deviceId);
  assert.equal(verify(null, Buffer.from('challenge'), identity.publicKeyPem, Buffer.from(store.signDevicePayload(identity.privateKeyPem, 'challenge'), 'base64url')), true);
  assert.equal(Buffer.from(store.publicKeyRawBase64UrlFromPem(identity.publicKeyPem), 'base64url').length, 32);
  assert.equal(statSync(join(directory, 'device-identity.json')).mode & 0o777, 0o600);
});

test('device tokens are bound to origin, identity and role', () => {
  const directory = mkdtempSync(join(tmpdir(), 'office-auth-'));
  const store = createAuthStore(directory, 'https://gateway.example');
  const params = {deviceId: 'device', role: 'operator', token: 'synthetic-token', scopes: ['operator.read']};
  store.storeDeviceAuthToken(params);
  assert.equal(store.loadDeviceAuthToken(params).token, 'synthetic-token');
  assert.equal(store.loadDeviceAuthToken({...params, deviceId: 'other'}), null);
  assert.equal(store.loadDeviceAuthToken({...params, role: 'node'}), null);
  assert.equal(createAuthStore(directory, 'https://other.example').loadDeviceAuthToken(params), null);
  assert.equal(statSync(join(directory, 'device-token.json')).mode & 0o777, 0o600);
});

test('clearing one binding does not erase another binding', () => {
  const directory = mkdtempSync(join(tmpdir(), 'office-auth-'));
  const store = createAuthStore(directory, 'https://gateway.example');
  const params = {deviceId: 'device', role: 'operator', token: 'synthetic-token', scopes: ['operator.read']};
  store.storeDeviceAuthToken(params);
  store.clearDeviceAuthToken({...params, deviceId: 'other'});
  assert.ok(store.loadDeviceAuthToken(params));
  store.clearDeviceAuthToken(params);
  assert.equal(store.loadDeviceAuthToken(params), null);
});
