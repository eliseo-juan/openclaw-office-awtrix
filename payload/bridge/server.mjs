import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {GatewayClient} from '@openclaw/gateway-client';
import {PROTOCOL_VERSION} from '@openclaw/gateway-protocol/version';
import {createAuthStore} from './auth-store.mjs';
import {loadConfig} from './config.mjs';
import {projectSnapshot, readSessions} from './projection.mjs';
import {displaySnapshot} from './display.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const configIndex = process.argv.indexOf('--config');
const config = loadConfig(configIndex >= 0 ? process.argv[configIndex + 1] : process.env.OPENCLAW_OFFICE_CONFIG ?? resolve(root, '.local/gateway.json'));
const store = createAuthStore(config.stateDirectory, config.origin);
const identity = store.loadOrCreateDeviceIdentity();
const saved = store.loadDeviceAuthToken({deviceId: identity.deviceId, role: 'operator'});
let connected = false, generation = 0, revision = 0, busy = false, dirty = false;
let agents = [], sessions = [], complete = false, observedAt = null;
let timer;
const snapshot = () => ({schema: 1, revision, observedAt, botStyle: config.botStyle, ...projectSnapshot(agents, sessions, {connected: connected && observedAt !== null && Date.now() - Date.parse(observedAt) < 30000, complete})});
const invalidate = () => { connected = false; complete = false; generation++; revision++; };
function schedule() {
  dirty = true;
  if (!timer) timer = setTimeout(() => { timer = null; void refresh(); }, 100);
}
async function refresh() {
  if (busy || !connected) return;
  busy = true; dirty = false;
  const version = generation;
  try {
    const roster = await client.request('agents.list', {});
    const result = await readSessions((method, params) => client.request(method, params));
    if (version === generation && connected) {
      agents = roster.agents ?? []; sessions = result.rows; complete = result.complete;
      observedAt = new Date().toISOString(); revision++;
    }
  } catch (error) {
    complete = false; revision++;
    console.error(config.redact(String(error.message)).replaceAll(saved?.token ?? '\u0000', '[redacted]'));
  } finally {
    busy = false;
    if (dirty) schedule();
  }
}
const client = new GatewayClient({
  url: config.gatewayUrl, token: saved?.token ? undefined : config.token,
  password: saved?.token ? undefined : config.password, deviceToken: saved?.token,
  deviceIdentity: identity, hostDeps: store,
  clientDisplayName: 'OpenClaw Office', clientVersion: '0.2.0', role: 'operator', scopes: ['operator.read'], caps: ['agent-kind'],
  minProtocol: PROTOCOL_VERSION, maxProtocol: PROTOCOL_VERSION, requestTimeoutMs: 10000,
  onHelloOk: async () => {
    generation++; connected = true; complete = false;
    try { await client.request('sessions.subscribe', {limit: 100}); schedule(); }
    catch { complete = false; schedule(); }
  },
  onEvent: event => {
    const name = event.event ?? '';
    if (/session/.test(name) || name === 'agent' && event.payload?.stream === 'lifecycle') {
      generation++; complete = false; schedule();
    }
  },
  onGap: () => { generation++; complete = false; schedule(); },
  onClose: invalidate,
  onConnectError: error => {
    invalidate();
    console.error(config.redact(String(error.message)).replaceAll(saved?.token ?? '\u0000', '[redacted]'));
  }
});
const assets = new Map([['/', 'live.html'], ['/live.js', 'live.js'], ['/cafe-motion.js', 'cafe-motion.js'], ['/bot-styles.js', 'bot-styles.js'], ['/kitchen.js', 'kitchen.js'], ['/spike/layout.js', 'spike/layout.js']]);
const server = createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.writeHead(405); res.end(); return; }
  const requestUrl = new URL(req.url, 'http://localhost');
  const path = requestUrl.pathname;
  if (path === '/api/display') {
    const page = Number(requestUrl.searchParams.get('page') ?? 0);
    if (!Number.isInteger(page) || page < 0) { res.writeHead(400); res.end(); return; }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(displaySnapshot(snapshot(), page))); return;
  }
  if (path === '/api/state' || path === '/healthz') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(path === '/api/state' ? snapshot() : {connected, complete})); return;
  }
  const asset = assets.get(path);
  if (!asset) { res.writeHead(404); res.end(); return; }
  try {
    res.setHeader('Content-Type', asset.endsWith('.js') ? 'text/javascript' : 'text/html');
    res.end(await readFile(resolve(root, asset)));
  } catch { res.writeHead(500); res.end('Unable to load asset'); }
});
server.listen(config.http.port, config.http.host, () => console.log(`Office listening on ${config.http.host}:${config.http.port}`));
client.start();
const resync = setInterval(schedule, 15000);
for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, async () => {
  clearInterval(resync); clearTimeout(timer); server.close(); await client.stopAndWait({timeoutMs: 2000});
});
