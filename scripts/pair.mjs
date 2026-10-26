import {GatewayClient} from '@openclaw/gateway-client';
import {PROTOCOL_VERSION} from '@openclaw/gateway-protocol/version';
import {loadConfig} from '../payload/bridge/config.mjs';
import {createAuthStore} from '../payload/bridge/auth-store.mjs';

export async function pairGateway(path, bootstrap = {}) {
  let config;
  try { config = loadConfig(path); }
  catch { return {ok: false, code: 'CONFIG_UNREADABLE'}; }
  const store = createAuthStore(config.stateDirectory, config.origin);
  const identity = store.loadOrCreateDeviceIdentity();
  const saved = store.loadDeviceAuthToken({deviceId: identity.deviceId, role: 'operator'});
  let client, timer;
  const ready = new Promise(resolve => {
    timer = setTimeout(() => resolve({ok: false, code: 'GATEWAY_TIMEOUT'}), 15000);
    client = new GatewayClient({
      url: config.gatewayUrl,
      token: bootstrap.token ?? (saved?.token ? undefined : config.token),
      password: bootstrap.password ?? (saved?.token ? undefined : config.password),
      deviceToken: bootstrap.token || bootstrap.password ? undefined : saved?.token,
      preferBootstrapToken: Boolean(bootstrap.token || bootstrap.password),
      deviceIdentity: identity, hostDeps: store,
      clientDisplayName: 'OpenClaw Office', clientVersion: '0.2.3', mode: 'cli', role: 'operator', scopes: ['operator.read'], caps: ['agent-kind'],
      minProtocol: PROTOCOL_VERSION, maxProtocol: PROTOCOL_VERSION, requestTimeoutMs: 10000,
      onHelloOk: hello => resolve({ok: true, scopes: hello.auth?.scopes ?? []}),
      onConnectError: error => {
        const requestId = error.details?.requestId;
        resolve({ok: false, code: String(error.details?.code ?? error.code ?? 'AUTHENTICATION_FAILED'), ...(typeof requestId === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(requestId) ? {requestId} : {})});
      }
    });
  });
  try {
    client.start();
    const result = await ready;
    if (!result.ok) return result;
    const token = store.loadDeviceAuthToken({deviceId: identity.deviceId, role: 'operator'});
    if (!token?.token || !token.scopes?.includes('operator.read') || token.scopes.some(scope => scope !== 'operator.read')) return {ok: false, code: 'READ_ONLY_TOKEN_NOT_STORED'};
    return {ok: true, source: saved?.token && !bootstrap.token && !bootstrap.password ? 'paired-device' : 'bootstrap', deviceId: identity.deviceId};
  } finally {
    clearTimeout(timer);
    await client.stopAndWait({timeoutMs: 2000});
  }
}
