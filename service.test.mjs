import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {mkdtemp, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createBridgeService} from './service.mjs';

const logger = {info() {}, error() {}};
test('rejects ambiguous relative config paths', async () => {
  await assert.rejects(createBridgeService({configPath: 'config.json'}, logger).start(), /absolute path/);
});
test('starts once without a shell and joins the child on stop', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'office-plugin-'));
  const configPath = join(dir, 'config.json');
  await writeFile(configPath, '{}');
  let launches = 0;
  const child = new EventEmitter();
  child.kill = signal => { assert.equal(signal, 'SIGTERM'); queueMicrotask(() => child.emit('exit', 0)); };
  const service = createBridgeService({configPath}, logger, (command, args, options) => {
    launches++;
    assert.equal(command, process.execPath);
    assert.equal(args.at(-1), configPath);
    assert.equal(options.shell, false);
    queueMicrotask(() => child.emit('spawn'));
    return child;
  });
  try { await service.start(); await service.start(); assert.equal(launches, 1); await service.stop(); await service.stop(); }
  finally { await rm(dir, {recursive: true, force: true}); }
});
test('reports unexpected child exit and permits a clean restart', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'office-plugin-'));
  const configPath = join(dir, 'config.json');
  await writeFile(configPath, '{}');
  const errors = [];
  let child;
  const service = createBridgeService({configPath}, {info() {}, error: message => errors.push(message)}, () => {
    child = new EventEmitter();
    child.kill = () => queueMicrotask(() => child.emit('exit', 0));
    queueMicrotask(() => child.emit('spawn'));
    return child;
  });
  try {
    await service.start(); child.emit('exit', 1);
    assert.equal(errors.length, 1);
    await service.start(); await service.stop(); assert.equal(errors.length, 1);
  } finally { await rm(dir, {recursive: true, force: true}); }
});

test('packaged bridge serves offline health and releases its port on stop', async () => {
  const {createServer} = await import('node:net');
  const reservation = createServer();
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const dir = await mkdtemp(join(tmpdir(), 'office-plugin-http-'));
  const configPath = join(dir, 'config.json');
  await writeFile(configPath, JSON.stringify({gateway: {url: 'ws://127.0.0.1:1', auth: {mode: 'device'}, stateDirectory: './state'}, http: {host: '127.0.0.1', port}}));
  const errors = [];
  const service = createBridgeService({configPath}, {info() {}, error: message => errors.push(message)});
  try {
    await service.start();
    let health;
    for (let i = 0; i < 60; i++) {
      try { health = await (await fetch(`http://127.0.0.1:${port}/healthz`)).json(); break; }
      catch { await new Promise(resolve => setTimeout(resolve, 50)); }
    }
    assert.deepEqual(health, {connected: false, complete: false});
    const display = await (await fetch(`http://127.0.0.1:${port}/api/display?page=0`)).json();
    assert.equal(display.connected, false);
    assert.equal(display.schema, 1);
    assert.equal((await fetch(`http://127.0.0.1:${port}/`)).status, 200);
    await service.stop();
    await assert.rejects(fetch(`http://127.0.0.1:${port}/healthz`));
    assert.deepEqual(errors, []);
  } finally { await service.stop(); await rm(dir, {recursive: true, force: true}); }
});
