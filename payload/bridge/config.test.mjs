import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {loadConfig} from './config.mjs';
function fixture(input, run) {
  const dir = mkdtempSync(join(tmpdir(), 'office-config-'));
  const path = join(dir, 'config.json');
  writeFileSync(path, JSON.stringify(input));
  try { run(path, dir); } finally { rmSync(dir, {recursive: true, force: true}); }
}
test('users select their own Gateway, SSH alias, port and private state location', () => {
  fixture({gateway: {url: 'wss://gateway.example.com', stateDirectory: 'identity'}, deployment: {sshTarget: 'my-office'}, http: {port: 9000}}, (path, dir) => {
    const config = loadConfig(path, {});
    assert.equal(config.stateDirectory, join(dir, 'identity'));
    assert.equal(config.deployment.sshTarget, 'my-office');
    assert.equal(config.http.port, 9000);
  });
});
test('token and password are loaded from configurable environment names and redacted', () => {
  for (const mode of ['token', 'password']) fixture({gateway: {url: 'wss://example.com', auth: {mode, [`${mode}Env`]: 'MY_SECRET'}}}, path => {
    const config = loadConfig(path, {MY_SECRET: 'private-value'});
    assert.equal(config[mode], 'private-value');
    assert.equal(config.redact('failure private-value'), 'failure [redacted]');
  });
});
test('file credentials resolve relative to the configuration file', () => {
  fixture({gateway: {url: 'ws://localhost:18789', auth: {mode: 'token', tokenFile: 'token'}}}, (path, dir) => {
    writeFileSync(join(dir, 'token'), 'test-secret\n');
    assert.equal(loadConfig(path).token, 'test-secret');
  });
});
test('rejects unsafe URLs, missing secrets, unsupported modes and additional scopes', () => {
  for (const input of [
    {gateway: {url: 'ws://remote.example.com'}},
    {gateway: {url: 'wss://user:secret@example.com'}},
    {gateway: {url: 'wss://example.com?token=secret'}},
    {gateway: {url: 'wss://example.com', auth: {mode: 'token', tokenEnv: 'ABSENT'}}},
    {gateway: {url: 'wss://example.com', auth: {mode: 'other'}}},
    {gatewayUrl: 'wss://example.com', requestedScopes: ['operator.admin']}
  ]) fixture(input, path => assert.throws(() => loadConfig(path, {})));
});
test('bot style is configurable and unsupported designs are rejected', () => {
 fixture({gateway:{url:'wss://example.com'},display:{botStyle:'Capsule'}},path=>assert.equal(loadConfig(path).botStyle,'Capsule'));
 fixture({gateway:{url:'wss://example.com'},display:{botStyle:'Visor'}},path=>assert.throws(()=>loadConfig(path),/Unknown display.botStyle/));
});
