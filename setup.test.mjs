import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, readdir, rm, stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {WebSocketServer} from 'ws';
import {runSetup, defaultHost, localGateway, privateJson} from './scripts/setup.mjs';
import {pairGateway} from './scripts/pair.mjs';

const ready = {status: 'ready', url: 'http://192.0.2.20:8790/healthz'};
async function sandbox(run) {
  const dir = await mkdtemp(join(tmpdir(), 'office-setup-'));
  try { await run(dir); } finally { await rm(dir, {recursive: true, force: true}); }
}

test('fresh setup pairs, verifies saved credentials, restricts hooks and restarts before reporting ready', async () => sandbox(async dir => {
  const configPath = join(dir, 'config.json');
  const commands = [], logs = [], calls = [];
  let restarted = false;
  await runSetup({config: configPath, host: '192.0.2.20', yes: true}, {
    hostConfig: {gateway: {port: 18789, auth: {token: 'bootstrap-private-fixture'}}},
    log: value => logs.push(value), wait: async () => {},
    pair: async (path, bootstrap) => {
      calls.push(bootstrap);
      if (calls.length === 1) return {ok: false, code: 'TOKEN_MISSING'};
      if (calls.length === 2) { assert.equal(bootstrap.token, 'bootstrap-private-fixture'); return {ok: false, requestId: 'request-1'}; }
      return {ok: true, source: 'paired-device'};
    },
    command: async args => { commands.push(args); if (args[0] === 'gateway') restarted = true; },
    verifyDisplay: async () => true,
    check: async () => restarted ? ready : {status: 'unreachable'}
  });
  assert.equal(commands[0].join(' '), 'devices approve request-1');
  assert.ok(commands.find(args => args.includes('{"allowPromptInjection":false,"allowConversationAccess":false}')));
  assert.ok(restarted);
  assert.ok(!JSON.stringify(logs).includes('bootstrap-private-fixture'));
  assert.ok(!JSON.stringify(commands).includes('bootstrap-private-fixture'));
  assert.ok(!(await readFile(configPath, 'utf8')).includes('bootstrap-private-fixture'));
  assert.deepEqual(JSON.parse(await readFile(configPath, 'utf8')).gateway.auth, {mode: 'device'});
  assert.equal((await stat(configPath)).mode & 0o777, 0o600);
  assert.deepEqual(await readdir(dir), ['config.json']);
}));

test('cancelled setup leaves no configuration behind', async () => sandbox(async dir => {
  await assert.rejects(runSetup({config: join(dir, 'config.json'), host: '192.0.2.20'}, {confirm: async () => false}), /cancelled/);
  assert.deepEqual(await readdir(dir), []);
}));

test('existing identity paths and working setup are preserved on repeat runs', async () => sandbox(async dir => {
  const path = join(dir, 'config.json');
  await privateJson(path, {gateway: {url: 'wss://gateway.example.com', stateDirectory: './my-existing-identity', auth: {mode: 'device'}}, http: {host: '192.0.2.20', port: 8790}});
  const commands = [];
  await runSetup({config: path, yes: true}, {log() {}, pair: async () => ({ok: true, source: 'paired-device'}), command: async args => commands.push(args), verifyDisplay: async () => true, check: async () => ready});
  assert.equal(JSON.parse(await readFile(path)).gateway.stateDirectory, './my-existing-identity');
  assert.ok(!commands.find(args => args[0] === 'devices' || args[0] === 'gateway'));
}));

test('setup cannot report success when health remains offline', async () => sandbox(async dir => {
  await assert.rejects(runSetup({config: join(dir, 'config.json'), host: '192.0.2.20', yes: true}, {
    hostConfig: {}, log() {}, pair: async () => ({ok: true, source: 'paired-device'}), command: async () => {}, check: async () => ({status: 'gateway-disconnected'}), wait: async () => {}
  }), /not ready/);
}));

test('remote Gateway never receives the local Gateway bootstrap secret', async () => sandbox(async dir => {
  let calls = 0;
  await assert.rejects(runSetup({config: join(dir, 'config.json'), gatewayUrl: 'wss://remote.example.com', host: '192.0.2.20', yes: true}, {
    hostConfig: {gateway: {auth: {token: 'local-secret'}}}, log() {}, pair: async () => { calls++; return {ok: false}; }
  }), /No local bootstrap/);
  assert.equal(calls, 1);
}));

test('host selection chooses a LAN interface and remote mode requires an explicit URL', () => {
  assert.equal(defaultHost({lo: [{family: 'IPv4', address: '127.0.0.1', internal: true}], eth: [{family: 'IPv4', address: '192.168.2.4', internal: false}]}), '192.168.2.4');
  assert.throws(() => localGateway({gateway: {mode: 'remote'}}), /Remote Gateway/);
});

test('real SDK pairing saves a scoped device token and reconnects without bootstrap', async () => sandbox(async dir => {
  const server = new WebSocketServer({host: '127.0.0.1', port: 0});
  await new Promise(resolve => server.once('listening', resolve));
  const authSeen = [];
  server.on('connection', socket => {
    socket.send(JSON.stringify({type: 'event', event: 'connect.challenge', payload: {nonce: 'fixture-nonce', ts: Date.now()}}));
    socket.on('message', raw => {
      const message = JSON.parse(raw);
      if (message.method !== 'connect') return;
      authSeen.push(message.params.auth);
      assert.deepEqual(message.params.scopes, ['operator.read']);
      socket.send(JSON.stringify({type: 'res', id: message.id, ok: true, payload: {type: 'hello-ok', protocol: 4, server: {version: 'fixture', connId: 'fixture'}, features: {methods: [], events: []}, snapshot: {}, auth: {role: 'operator', scopes: ['operator.read'], deviceToken: 'paired-fixture-secret'}, policy: {tickIntervalMs: 30000}}}));
    });
  });
  try {
    const path = join(dir, 'config.json');
    await privateJson(path, {gateway: {url: `ws://127.0.0.1:${server.address().port}`, auth: {mode: 'device'}, stateDirectory: './identity'}});
    assert.equal((await pairGateway(path, {token: 'bootstrap-fixture-secret'})).ok, true);
    const second = await pairGateway(path);
    assert.equal(second.ok, true);
    assert.equal(second.source, 'paired-device');
    assert.ok(JSON.stringify(authSeen[0]).includes('bootstrap-fixture-secret'));
    assert.ok(!JSON.stringify(authSeen[1]).includes('bootstrap-fixture-secret'));
    assert.equal((await stat(join(dir, 'identity/device-token.json'))).mode & 0o777, 0o600);
  } finally { for (const socket of server.clients) socket.terminate(); await new Promise(resolve => server.close(resolve)); }
}));

test('unpaired public configuration can switch to the local Gateway without sending its credential to the public endpoint', async () => sandbox(async dir => {
  const path = join(dir, 'config.json');
  await privateJson(path, {gateway: {url: 'wss://public.example.com', stateDirectory: './identity', auth: {mode: 'device'}}, http: {host: '192.0.2.20', port: 8790}});
  const seen = [];
  await runSetup({config: path, yes: true}, {
    hostConfig: {gateway: {port: 18789, auth: {token: 'local-only-fixture-secret'}}}, log() {},
    pair: async (file, bootstrap) => {
      const config = JSON.parse(await readFile(file));
      seen.push({url: config.gateway.url, bootstrap});
      if (seen.length < 3) return {ok: false};
      return {ok: true, source: 'paired-device'};
    }, command: async () => {}, verifyDisplay: async () => true, check: async () => ready
  });
  assert.equal(seen[0].url, 'wss://public.example.com');
  assert.equal(seen[0].bootstrap, undefined);
  assert.ok(seen.filter(row => row.bootstrap).every(row => row.url === 'ws://127.0.0.1:18789'));
  const config = JSON.parse(await readFile(path));
  assert.equal(config.gateway.stateDirectory, './identity-local');
}));
