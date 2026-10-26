# Authentication reference

Start with the [complete installation guide](../../docs/INSTALL.md). It is the canonical walkthrough for first installation, migration, verification and the AWTRIX app. This page describes the bridge's credential options.

## 2. Choose Gateway authentication

Recommended: device pairing with `operator.read`. Bootstrap with your own Gateway credential, approve the exact new device request, then retain the private device identity and scoped token together.

| Mode | `gateway.auth` | Behavior |
| --- | --- | --- |
| New device | `{"mode":"device","tokenFile":"./gateway-token"}` | Bootstrap pairing from a private credential file. |
| Already paired | `{"mode":"device"}` | Reuse the device identity and token stored in `gateway.stateDirectory`. |
| Token | `{"mode":"token","tokenEnv":"OPENCLAW_GATEWAY_TOKEN"}` | Read the token from the specified environment variable; reuse a saved paired token if available. |
| Password | `{"mode":"password","passwordFile":"./gateway-password"}` | Read a private password file; pairing can still be required by Gateway policy. |

Use `tokenFile` / `passwordFile` for private files or `tokenEnv` / `passwordEnv` for configurable environment variable names. File paths, including `stateDirectory`, resolve relative to the private configuration file. The OpenClaw service must have permission to read them. Interactive shell environment variables do not automatically reach a systemd Gateway service; private files are simpler for that deployment.

The default example stores `./identity` and `./gateway-token` next to the private configuration. A fresh install needs a bootstrap credential; creating an empty identity directory does not authenticate it. The inspection command is:

```sh
node payload/bridge/inspect.mjs --config /absolute/path/to/config.json
```

Run it from a source checkout with its dependencies installed. It writes its detailed report in the private state directory. Inspect it locally; device IDs, roster and network details should not be copied to public issues.

Pairing approval is separate from installation consent. On the Gateway host:

```sh
openclaw devices list
openclaw devices approve YOUR_EXACT_REQUEST_ID
```

Verify that the request belongs to this installation and requests only `operator.read`. Rerun the diagnostic after approval. Require `authenticated: true`; a subsequent run should use `authenticationSource: "paired-device"`.

Only after verification, change `gateway.auth` to `{"mode":"device"}` and remove the bootstrap selector before deleting its unneeded credential file. A saved device token is bound to its Gateway origin, device identity and role. Moving identities between operating systems may require a new metadata approval. Do not recreate, delete or copy only part of a working identity directory as a generic repair step.

The plugin's prompt/conversation hook policy is independent from bridge authentication. Disabling both hooks does not grant or revoke the paired Gateway credential. This plugin does not need conversation hooks and never requests conversation transcripts through its display projection.
