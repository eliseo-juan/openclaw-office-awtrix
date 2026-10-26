import {readFile, writeFile, rename, mkdir, chmod} from 'node:fs/promises';
import {dirname, isAbsolute, join} from 'node:path';
import {homedir, networkInterfaces} from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {pairGateway} from './pair.mjs';
import {localCredentials} from './credentials.mjs';
import {diagnose, verifyDisplay} from './doctor.mjs';
const execute = promisify(execFile);

export function defaultHost(interfaces = networkInterfaces()) {
  const candidates = Object.values(interfaces).flat().filter(item => !item.internal && item.family === 'IPv4' && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(item.address));
  return candidates[0]?.address;
}

export function localGateway(hostConfig) {
  if (hostConfig.gateway?.mode === 'remote') throw new Error('Remote Gateway: supply --gateway-url and --token-file or --password-file.');
  return `ws://127.0.0.1:${hostConfig.gateway?.port ?? 18789}`;
}

export async function privateJson(path, value) {
  await mkdir(dirname(path), {recursive: true, mode: 0o700});
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(value, null, 2) + '\n', {mode: 0o600, flag: 'wx'});
  await rename(temporary, path);
  await chmod(path, 0o600);
}

export async function runSetup(options = {}, dependencies = {}) {
  const hostConfig = dependencies.hostConfig ?? {};
  const log = dependencies.log ?? console.log;
  const confirm = dependencies.confirm ?? (async () => false);
  const pair = dependencies.pair ?? pairGateway;
  const check = dependencies.check ?? diagnose;
  const display = dependencies.verifyDisplay ?? verifyDisplay;
  const command = dependencies.command ?? (async args => {
    try { return await execute('openclaw', args, {timeout: 60000, maxBuffer: 1024 * 1024}); }
    catch { throw new Error(`OpenClaw command failed: ${args.slice(0, 3).join(' ')}. Inspect the command locally; no credentials were printed.`); }
  });
  const wait = dependencies.wait ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
  const configPath = options.config ?? dependencies.configPath ?? join(process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config'), 'openclaw-office', 'config.json');
  if (!isAbsolute(configPath)) throw new Error('--config must be an absolute path.');
  let config;
  try { config = JSON.parse(await readFile(configPath, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw new Error('Existing Office configuration cannot be read; it was not replaced.');
  }
  const host = options.host ?? config?.http?.host ?? defaultHost();
  if (!host || host.startsWith('127.') || ['0.0.0.0', '::', '::1', 'localhost'].includes(host)) throw new Error('Choose the LAN address reachable by your clock with --host YOUR_LAN_IP.');
  if (!/^[a-zA-Z0-9.:-]+$/.test(host)) throw new Error('Invalid --host; supply a hostname or IP without a scheme or port.');
  const port = Number(options.port ?? config?.http?.port ?? 8790);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid --port.');
  let gatewayUrl = options.gatewayUrl ?? config?.gateway?.url ?? localGateway(hostConfig);
  let gateway = new URL(gatewayUrl);
  if (gateway.username || gateway.password || gateway.search || gateway.hash || !(gateway.protocol === 'wss:' || gateway.protocol === 'ws:' && ['127.0.0.1', 'localhost', '[::1]'].includes(gateway.hostname))) throw new Error('Use WSS, or WS only on loopback; do not embed credentials in the URL.');
  if (config?.gateway?.url && config.gateway.url !== gatewayUrl) throw new Error('Existing Gateway origin differs; use a separate --config for another Gateway to preserve its device identity.');
  if (!options.yes && !await confirm(`Set up Office at ${host}:${port}? The Gateway may restart.`)) throw new Error('Setup cancelled; no configuration changed.');
  log('Configuring Office...');
  config ??= {gateway: {url: gatewayUrl, stateDirectory: './identity', auth: {mode: 'device'}}, display: {botStyle: 'Jelly'}};
  config.http = {...config.http, host, port};
  await privateJson(configPath, config);
  let result = await pair(configPath);
  if (!result.ok && !options.gatewayUrl && !options.tokenFile && !options.passwordFile && gateway.protocol === 'wss:' && hostConfig.gateway?.mode !== 'remote') {
    if (!options.yes && !await confirm('The saved public Gateway did not authenticate. Set up the Gateway on this machine instead, preserving the previous device files?')) throw new Error('Saved Gateway remains unchanged; provide its private credential file or rerun setup to use the local Gateway.');
    gatewayUrl = localGateway(hostConfig);
    gateway = new URL(gatewayUrl);
    config.gateway = {...config.gateway, url: gatewayUrl, stateDirectory: `${config.gateway.stateDirectory ?? './identity'}-local`, auth: {mode: 'device'}};
    await privateJson(configPath, config);
    result = await pair(configPath);
  }
  if (!result.ok) {
    log('Connecting to OpenClaw...');
    const secret = async path => path ? (await readFile(path, 'utf8')).trim() : undefined;
    const sameLocalGateway = gateway.protocol === 'ws:' && ['localhost', '127.0.0.1', '[::1]'].includes(gateway.hostname) && Number(gateway.port || 80) === Number(hostConfig.gateway?.port ?? 18789);
    const auth = sameLocalGateway ? hostConfig.gateway?.auth ?? {} : {};
    const local = sameLocalGateway && !options.tokenFile && !options.passwordFile ? await (dependencies.credentials ?? localCredentials)(hostConfig) : {};
    const token = await secret(options.tokenFile) ?? local.token;
    const password = await secret(options.passwordFile) ?? local.password;
    if (!token && !password) throw new Error('No local bootstrap credential is available for this Gateway. Rerun with --token-file /private/path or --password-file /private/path; never paste credentials into chat. Existing identity was preserved.');
    const bootstrap = options.passwordFile || !options.tokenFile && auth.mode === 'password' ? {password} : token ? {token} : {password};
    if (!bootstrap.token && !bootstrap.password) throw new Error('The selected Gateway authentication mode has no usable credential; supply the matching private credential file.');
    result = await pair(configPath, bootstrap);
    if (!result.ok && result.requestId) {
      if (!options.yes && !await confirm('Approve the new Office device with operator.read access?')) throw new Error('Pairing awaits approval; rerun setup when ready.');
      await command(['devices', 'approve', result.requestId]);
      result = await pair(configPath, bootstrap);
    }
    if (!result.ok) throw new Error(`Pairing failed (${result.code}); bootstrap was not persisted and device files were preserved.`);
  }
  config.gateway.auth = {mode: 'device'};
  await privateJson(configPath, config);
  result = await pair(configPath);
  if (!result.ok || result.source !== 'paired-device') throw new Error('Paired-device verification failed. Device files were preserved; setup has not activated the bridge.');
  log('Enabling Office...');
  const entry = 'plugins.entries.openclaw-office';
  await command(['config', 'set', `${entry}.hooks`, '{"allowPromptInjection":false,"allowConversationAccess":false}', '--strict-json']);
  await command(['config', 'set', `${entry}.config.configPath`, configPath]);
  await command(['plugins', 'enable', 'openclaw-office', '--accept-capabilities']);
  const before = await check(config, host);
  if (before.status !== 'ready') {
    await command(['gateway', 'restart']);
  }
  log('Checking connection...');
  let health;
  for (let attempt = 0; attempt < 20; attempt++) {
    health = await check(config, host);
    if (health.status === 'ready') break;
    await wait(500);
  }
  if (health?.status !== 'ready') throw new Error(`Bridge is not ready (${health?.status ?? 'unknown'}). Keep the configuration and rerun setup; do not reinstall or delete device identity.`);
  if (!await display(config, host)) throw new Error('Bridge health is ready but its display page is invalid or incomplete. Setup is not complete; rerun after synchronization.');
  const bridgeUrl = new URL(health.url).origin;
  log(`Ready.\n\nIn AWTRIX, open OpenClaw Office > Settings.\nSet Bridge URL to: ${bridgeUrl}\nSave the app settings. No script changes are needed.`);
  return {configPath, bridgeUrl};
}
