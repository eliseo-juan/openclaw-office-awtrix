import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';

const styles = createRequire(import.meta.url)('../bot-styles.js');

export function loadConfig(path, env = process.env) {
  const filename = resolve(path);
  const input = JSON.parse(readFileSync(filename, 'utf8'));
  const base = dirname(filename);
  const gateway = input.gateway ?? {url: input.gatewayUrl, auth: {mode: 'device', bootstrapToken: input.bootstrapToken}};
  const url = new URL(gateway.url);
  if (url.username || url.password || url.search || url.hash) throw new Error('Gateway URL must not contain credentials, query parameters, or fragments');
  if (url.protocol !== 'wss:' && !(url.protocol === 'ws:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) throw new Error('Use WSS, or WS on loopback only');
  const auth = gateway.auth ?? {mode: 'device'};
  if (!['device', 'token', 'password'].includes(auth.mode)) throw new Error('Authentication mode must be device, token, or password');
  const secret = (name) => {
    if (auth[`${name}Env`]) return env[auth[`${name}Env`]]?.trim();
    if (auth[`${name}File`]) return readFileSync(resolve(base, auth[`${name}File`]), 'utf8').trim();
    return undefined;
  };
  const token = secret('token') ?? auth.bootstrapToken;
  const password = secret('password');
  if (auth.mode === 'token' && !token) throw new Error('Configured Gateway token is missing');
  if (auth.mode === 'password' && !password) throw new Error('Configured Gateway password is missing');
  if (input.requestedScopes?.some(scope => scope !== 'operator.read')) throw new Error('Only operator.read is supported');
  const botStyle = input.display?.botStyle ?? 'Jelly';
  if (!styles.some(style => style.name === botStyle)) throw new Error('Unknown display.botStyle');
  const port = input.http?.port ?? 8790;
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('HTTP port must be between 1 and 65535');
  const origin = new URL(url); origin.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
  return {
    gatewayUrl: url.toString(), origin: origin.origin, authMode: auth.mode, token, password,
    stateDirectory: resolve(base, gateway.stateDirectory ?? '.'),
    http: {host: input.http?.host ?? '127.0.0.1', port},
    deployment: input.deployment ?? {}, botStyle,
    redact(value) { let result = String(value); for (const s of [token, password]) if (s) result = result.replaceAll(s, '[redacted]'); return result; }
  };
}
