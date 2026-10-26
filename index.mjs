import {createBridgeService} from './service.mjs';

export default {
  id: 'openclaw-office',
  name: 'OpenClaw Office',
  register(api) {
    api.registerService(createBridgeService(api.pluginConfig ?? {}, api.logger));
  }
};
