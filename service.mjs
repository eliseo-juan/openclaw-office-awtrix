import {spawn} from 'node:child_process';
import {access} from 'node:fs/promises';
import {isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';

export function createBridgeService(config, logger, launch = spawn) {
  let child;
  let stopping = false;
  return {
    id: 'openclaw-office',
    async start() {
      if (child) return;
      if (typeof config.configPath !== 'string' || !isAbsolute(config.configPath)) {
        throw new Error('OpenClaw Office configPath must be an absolute path');
      }
      await access(config.configPath);
      stopping = false;
      const processHandle = launch(process.execPath, [fileURLToPath(new URL('./payload/bridge/server.mjs', import.meta.url)), '--config', config.configPath], {
        stdio: ['ignore', 'ignore', 'ignore'], shell: false
      });
      child = processHandle;
      await new Promise((resolve, reject) => {
        processHandle.once('spawn', resolve);
        processHandle.once('error', reject);
      }).catch(error => { child = undefined; throw error; });
      processHandle.on('error', () => logger.error('OpenClaw Office bridge process failed; check its private configuration.'));
      processHandle.once('exit', code => {
        if (child === processHandle) child = undefined;
        if (!stopping) logger.error(`OpenClaw Office bridge exited (${code ?? 'signal'}); reload the plugin after checking its configuration and port.`);
      });
      logger.info('OpenClaw Office bridge started. Use the configured HTTP host and port as the AWTRIX bridge URL.');
    },
    async stop() {
      stopping = true;
      const processHandle = child;
      if (!processHandle) return;
      await new Promise(resolve => {
        const timer = setTimeout(() => processHandle.kill('SIGKILL'), 3000);
        processHandle.once('exit', () => { clearTimeout(timer); resolve(); });
        processHandle.kill('SIGTERM');
      });
      if (child === processHandle) child = undefined;
    }
  };
}
