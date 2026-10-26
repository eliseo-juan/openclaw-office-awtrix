import {writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {GatewayClient} from '@openclaw/gateway-client';
import {PROTOCOL_VERSION} from '@openclaw/gateway-protocol/version';
import {createAuthStore} from './auth-store.mjs';
import {loadConfig} from './config.mjs';
import stateProjection from '../spike/agent-state.cjs';

const defaultPath = resolve(dirname(fileURLToPath(import.meta.url)), '../.local/gateway.json');
const configIndex = process.argv.indexOf('--config');
const config = loadConfig(configIndex >= 0 ? process.argv[configIndex + 1] : process.env.OPENCLAW_OFFICE_CONFIG ?? defaultPath);
const directory = config.stateDirectory;
const url = new URL(config.gatewayUrl);
const origin = new URL(config.origin);
const store = createAuthStore(directory, origin.origin);
const identity = store.loadOrCreateDeviceIdentity();
const saved = store.loadDeviceAuthToken({deviceId: identity.deviceId, role: 'operator'});
const safeError = error => ({
  code: error.code ?? error.name,
  detailCode: error.details?.code ?? error.details?.reason ?? null,
  requestId: error.details?.requestId ?? null,
  message: String(error.message ?? 'Connection failed').replaceAll(config.token || '\u0000', '[redacted]').replaceAll(config.password || '\u0000', '[redacted]').replaceAll(saved?.token || '\u0000', '[redacted]')
});
const report = {observedAt: new Date().toISOString(), gateway: origin.origin, requestedScopes: ['operator.read'], deviceId: identity.deviceId};
const ready = Promise.withResolvers();
const client = new GatewayClient({
  url: url.toString(),
  token: saved?.token ? undefined : config.token,
  password: saved?.token ? undefined : config.password,
  deviceToken: saved?.token,
  deviceIdentity: identity,
  hostDeps: store,
  clientDisplayName: 'OpenClaw Office',
  clientVersion: '0.2.0-spike',
  role: 'operator',
  scopes: ['operator.read'],
  caps: ['agent-kind'],
  minProtocol: PROTOCOL_VERSION,
  maxProtocol: PROTOCOL_VERSION,
  requestTimeoutMs: 10000,
  onHelloOk: hello => ready.resolve(hello),
  onConnectError: error => ready.reject(error)
});
const deadline = setTimeout(() => ready.reject(new Error('Gateway authentication timed out')), 15000);
try {
  client.start();
  const hello = await ready.promise;
  clearTimeout(deadline);
  report.authenticated = true;
  report.protocol = hello.protocol;
  report.serverVersion = hello.server?.version ?? null;
  report.grantedScopes = hello.auth?.scopes ?? null;
  const roster = await client.request('agents.list', {});
  const agents = (roster.agents ?? []).filter(agent => agent.kind !== 'system');
  report.agentCount = agents.length;
  report.agents = agents.map(agent => ({id: agent.id, kind: agent.kind ?? 'unspecified'}));
  const snapshot = await client.request('sessions.list', {limit: 60});
  const rows = snapshot.sessions ?? [];
  report.firstSessionPage = {
    count: rows.length,
    hasMore: snapshot.hasMore ?? null,
    nextOffset: snapshot.nextOffset ?? null,
    sessionFields: [...new Set(rows.flatMap(row => Object.keys(row)))].sort(),
    withAggregateActivity: rows.filter(row => typeof row.hasActiveRun === 'boolean').length,
    withExactRunIds: rows.filter(row => Array.isArray(row.activeRunIds)).length
  };
  const subscription = await client.request('sessions.subscribe', {limit: 60});
  report.subscription = {subscribed: subscription.subscribed === true, initialListPresent: Boolean(subscription.list)};
  const unassigned = rows.filter(row => typeof row.agentId !== 'string');
  report.agentStates = agents.map(agent => {
    const sessions = rows.filter(row => row.agentId === agent.id);
    return {id: agent.id, sessions: sessions.length, state: stateProjection.projectAgentState(sessions, {rosterComplete: snapshot.hasMore === false && unassigned.length === 0})};
  });
  report.unassignedSessions = unassigned.length;
  report.deviceTokenStored = Boolean(store.loadDeviceAuthToken({deviceId: identity.deviceId, role: 'operator'})?.token);
  report.authenticationSource = saved?.token ? 'paired-device' : 'bootstrap';
} catch (error) {
  report.authenticated ??= false;
  report.error = safeError(error);
  process.exitCode = 1;
} finally {
  clearTimeout(deadline);
  await client.stopAndWait({timeoutMs: 2000});
}
await writeFile(resolve(directory, 'gateway-inspection.json'), JSON.stringify(report, null, 2) + '\n', {mode: 0o600});
console.log(JSON.stringify(report, null, 2));
