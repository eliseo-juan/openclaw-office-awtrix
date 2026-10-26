# Advanced authentication reference

For normal installation use [the setup command](../../docs/INSTALL.md). It handles private configuration, bootstrap pairing, saved-token verification and activation without copying tokens.

The bridge also supports manually authored configuration for advanced deployments. Keep it outside the source repository with file mode 600; protect its identity directory with mode 700. Relative file/state paths resolve relative to the configuration file.

| `gateway.auth` | Purpose |
| --- | --- |
| `{"mode":"device"}` | Use a saved paired token and device identity. A fresh identity alone does not authenticate. |
| `{"mode":"device","tokenFile":"./gateway-token"}` | Bootstrap manually from a private token file. |
| `{"mode":"token","tokenEnv":"OPENCLAW_GATEWAY_TOKEN"}` | Load a token from the specified environment variable. |
| `{"mode":"password","passwordFile":"./gateway-password"}` | Bootstrap with a private password file; pairing may still be required. |

For file/env secret sources use `tokenFile` / `passwordFile` or `tokenEnv` / `passwordEnv`. Interactive environment variables do not automatically reach a systemd service. Setup resolves built-in store/env SecretRefs with the official SDK. Custom file/exec providers require an explicit private credential file; setup does not decode or copy OpenClaw's secret store.

A paired token belongs to the exact Gateway origin, role and device identity. Do not copy only the token, delete identity files as a retry strategy, or increase scopes to solve authentication. Setup requests `operator.read` and reconnects without bootstrap before considering authentication complete.

Manual private diagnostic from a source checkout with dependencies installed:

```sh
node payload/bridge/inspect.mjs --config /absolute/private/config.json
```

Its report can contain network/device/roster metadata. Inspect it privately and redact before sharing. The plugin's hook policy is independent from device authentication: denying prompt/conversation hooks does not revoke the paired Gateway token.
