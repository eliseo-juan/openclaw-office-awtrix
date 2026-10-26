import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

export function healthUrl(config, reachableHost) {
  const host = reachableHost ?? config.http?.host ?? '127.0.0.1';
  if (host === '0.0.0.0' || host === '::') throw new Error('Wildcard listener: pass --host with a reachable host or IP');
  return `http://${host.includes(':') ? `[${host}]` : host}:${config.http?.port ?? 8790}/healthz`;
}

export async function diagnose(config, reachableHost, request = fetch) {
  const url = healthUrl(config, reachableHost);
  try {
    const response = await request(url, {signal: AbortSignal.timeout(5000)});
    if (!response.ok) return {status: 'http-error', code: 2, httpStatus: response.status, url};
    const body = await response.json();
    if (typeof body.connected !== 'boolean' || typeof body.complete !== 'boolean') return {status: 'invalid-response', code: 2, url};
    const healthy = body.connected && body.complete;
    return {status: healthy ? 'ready' : body.connected ? 'incomplete' : 'gateway-disconnected', code: healthy ? 0 : 1, connected: body.connected, complete: body.complete, url};
  } catch { return {status: 'unreachable', code: 2, url}; }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2);
    const value = name => args[args.indexOf(name) + 1];
    if (!args.includes('--config') || !value('--config')) throw new Error('Usage: node scripts/doctor.mjs --config /absolute/config.json [--host REACHABLE_HOST]');
    const config = JSON.parse(await readFile(value('--config'), 'utf8'));
    const result = await diagnose(config, args.includes('--host') ? value('--host') : undefined);
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.code;
  } catch (error) {
    console.error(error.code === 'ENOENT' ? 'Configuration file not found' : error instanceof SyntaxError ? 'Configuration is not valid JSON' : error.message);
    process.exitCode = 2;
  }
}

export async function verifyDisplay(config, reachableHost, request = fetch) {
  const url = new URL('/api/display?page=0', healthUrl(config, reachableHost));
  try {
    const response = await request(url, {signal: AbortSignal.timeout(5000)});
    if (!response.ok) return false;
    const body = await response.json();
    return body.schema === 1 && body.connected === true && body.complete === true && Array.isArray(body.agents) && Number.isInteger(body.pages) && body.pages >= 1;
  } catch { return false; }
}
