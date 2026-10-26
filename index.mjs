import {createBridgeService} from './service.mjs';

const descriptor = {name: 'office', description: 'Set up the AWTRIX Office bridge', hasSubcommands: true};

export default {
  id: 'openclaw-office',
  name: 'OpenClaw Office',
  register(api) {
    api.registerCli(({program}) => {
      program.command('office').description(descriptor.description)
        .command('setup').description('Configure, pair and verify the Office bridge')
        .option('--config <path>', 'Absolute private configuration path')
        .option('--host <address>', 'LAN address reachable by the AWTRIX clock')
        .option('--port <port>', 'Bridge HTTP port')
        .option('--gateway-url <url>', 'Gateway WSS URL; defaults to the local Gateway')
        .option('--token-file <path>', 'Private bootstrap token file for a remote Gateway or SecretRef')
        .option('--password-file <path>', 'Private bootstrap password file')
        .option('-y, --yes', 'Approve read-only device pairing and required Gateway restart')
        .action(async options => {
          const {runSetup} = await import('./scripts/setup.mjs');
          const {createInterface} = await import('node:readline/promises');
          const confirm = async question => {
            if (!process.stdin.isTTY) return false;
            const input = createInterface({input: process.stdin, output: process.stdout});
            try { return /^y(es)?$/i.test((await input.question(`${question} [y/N] `)).trim()); }
            finally { input.close(); }
          };
          try { await runSetup(options, {hostConfig: api.config, configPath: api.pluginConfig?.configPath, confirm}); }
          catch (error) { console.error(error.message); process.exitCode = 1; }
        });
    }, {commands: ['office'], descriptors: [descriptor]});
    if (api.pluginConfig?.configPath) api.registerService(createBridgeService(api.pluginConfig, api.logger));
  }
};
