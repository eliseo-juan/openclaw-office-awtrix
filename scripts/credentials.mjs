async function resolveReference(config, value, path, env) {
  const {resolveConfiguredSecretInputString} = await import('openclaw/plugin-sdk/secret-input-runtime');
  return resolveConfiguredSecretInputString({config, env, value, path});
}

export async function localCredentials(config, {env = process.env, resolve = resolveReference} = {}) {
  const auth = config.gateway?.auth ?? {};
  const field = auth.mode === 'password' ? 'password' : 'token';
  const input = auth[field];
  let value;
  if (typeof input === 'string') value = input.trim();
  else if (input && typeof input === 'object') {
    if (!['env', 'store'].includes(input.source)) throw new Error('This Gateway credential provider needs an explicit --token-file or --password-file for setup.');
    try {
      const result = await resolve(config, input, `gateway.auth.${field}`, env);
      if (typeof result.value !== 'string' || !result.value.trim() || result.unresolvedRefReason) throw new Error('unresolved');
      value = result.value.trim();
    } catch {
      throw new Error('OpenClaw could not resolve its configured Gateway credential. Run setup as the Gateway OS user with the same OpenClaw profile; no secret was printed or copied.');
    }
  } else value = env[field === 'token' ? 'OPENCLAW_GATEWAY_TOKEN' : 'OPENCLAW_GATEWAY_PASSWORD']?.trim();
  return value ? {[field]: value} : {};
}
