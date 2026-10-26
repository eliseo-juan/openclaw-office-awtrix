# Install OpenClaw Office

Run host commands as the same operating-system user that runs the OpenClaw Gateway. A plugin installation is not complete until the bridge reports both `connected: true` and `complete: true`, and the clock can reach it.

## Install the plugin

```sh
openclaw plugins install git:github.com/eliseo-juan/openclaw-office-awtrix
```

Trust and capability approval prompts are normal. In OpenClaw 2026.9.2, prompt injection defaults to allowed even though this plugin declares no prompt hooks. The package cannot override this host policy. You may accept installation, then explicitly restrict it before enabling. The plugin requires configuration, so a fresh install is left disabled.

```sh
openclaw config set plugins.entries.openclaw-office.hooks \
  '{"allowPromptInjection":false,"allowConversationAccess":false}' --strict-json
```

If installation says the manifest ID differs from the npm package name, use **`openclaw-office`** for all configuration and plugin commands. This is informational.

## Create the private configuration

Create a working checkout for configuration examples, pairing and diagnostics. The checkout is not where secrets belong:

```sh
git clone https://github.com/eliseo-juan/openclaw-office-awtrix.git
cd openclaw-office-awtrix
npm ci --ignore-scripts --legacy-peer-deps
mkdir -p "$HOME/.config/openclaw-office"
chmod 700 "$HOME/.config/openclaw-office"
cp payload/config/config.example.json "$HOME/.config/openclaw-office/config.json"
chmod 600 "$HOME/.config/openclaw-office/config.json"
```

Do not overwrite an existing configuration. Edit your new file:

- `gateway.url`: your Gateway's `wss://` URL; `ws://127.0.0.1:18789` is accepted only for a same-host Gateway. Use the actual port and retain the same origin after pairing.
- `gateway.stateDirectory`: `./identity` stores the paired identity beside this private configuration. Keep all files in that directory together.
- `gateway.auth`: initially `{"mode":"device","tokenFile":"./gateway-token"}`.
- `http.host`: a specific LAN IP reachable by the clock, or `0.0.0.0` on a network you intend to expose the metadata endpoint to. `127.0.0.1` allows only same-machine access. The HTTP endpoint has no access token and exposes agent names/status; choose the interface accordingly.
- `http.port`: a free port; the examples use `8790`.

On the Gateway host, use `openclaw gateway auth-token --show` if supported by your version. Save the value using a private editor in `$HOME/.config/openclaw-office/gateway-token`; do not paste it into chat, issues, screenshots or shell command arguments. Set file mode `600`. For password authentication and configurable secret sources see [authentication reference](../payload/docs/SETUP.md#2-choose-gateway-authentication).

From the working checkout, run:

```sh
node payload/bridge/inspect.mjs --config "$HOME/.config/openclaw-office/config.json"
```

The diagnostic writes a private report in the state directory. If pairing is required:

```sh
openclaw devices list
openclaw devices approve YOUR_EXACT_REQUEST_ID
```

Approve only the device just created by this installation and its requested `operator.read` scope. Rerun the diagnostic. Require `authenticated: true` and the intended agent roster. After pairing, set `gateway.auth` to `{"mode":"device"}`, remove the bootstrap file selector, then remove the unneeded bootstrap file. Rerun the diagnostic to verify `authenticationSource: "paired-device"`. Never delete the identity directory during troubleshooting.

```sh
openclaw config set plugins.entries.openclaw-office.config.configPath \
  "$HOME/.config/openclaw-office/config.json"
```

## Enable and verify

```sh
openclaw plugins enable openclaw-office
openclaw gateway restart
```

A warning that configuration exists while the plugin is disabled can occur during setup. It is not a successful-start receipt. Inspect startup errors if enabling or restarting fails.

Health checks must use the configured `http.host` and port. If the listener is a specific LAN IP, checking `127.0.0.1` fails even while the bridge is running. For `0.0.0.0`, use the actual host LAN IP, never `0.0.0.0` as the clock's URL.

From the working checkout:

```sh
node scripts/doctor.mjs --config "$HOME/.config/openclaw-office/config.json"
```

For a wildcard listener add `--host YOUR_LAN_IP`. The helper prints only endpoint and boolean health, and exits zero only when synchronized. Alternatively:

```sh
curl --fail-with-body --show-error --max-time 5 http://YOUR_LAN_IP:8790/healthz
```

Expected response:

```json
{"connected":true,"complete":true}
```

A successful HTTP response with false flags is **not** a complete installation. Once ready, verify `/api/display?page=0` and reachability from another device on the clock's network. Do not consider setup complete until these checks pass.

## Install the AWTRIX app

1. Open the TC002 AWTRIX web UI and its script editor.
2. Paste the entire [OpenClawOfficeLive.ax](../OpenClawOfficeLive.ax), save, and open its settings.
3. Set `bridge_url` to `http://YOUR_LAN_IP:8790`, with no trailing slash. This is the bridge address, not the OpenClaw WSS address. Do not put Gateway credentials on the clock.
4. Start the script. `show_in_rotation=true` includes it in normal rotation; false skips automatic turns while background refresh continues.
5. Confirm the roster, status indicator and floor count. Other settings control bot style, palette, cafe movement and floor switching.

AWTRIX app version and plugin package version are independent. No AWTRIX Hub listing has been published by this repository.

## Recover a missing authentication token

Use this procedure when HTTP responds with `connected:false` and the private diagnostic or Gateway logs show `token_missing`. An identity file alone is not a paired device: `gateway.auth: {"mode":"device"}` requires a valid saved token in the configured state directory. Installation and capability approval do not create that token.

Run these steps as the Gateway's OS user. Keep the existing `gateway.url`, `gateway.stateDirectory`, identity files and HTTP settings. Do not delete the identity or copy an unrelated device token.

1. Pause the plugin while repairing its credentials:

   ```sh
   openclaw plugins disable openclaw-office
   openclaw gateway restart
   ```

2. On the Gateway host, retrieve the bootstrap token in a private interactive terminal:

   ```sh
   openclaw gateway auth-token --show
   ```

   Open `$HOME/.config/openclaw-office/gateway-token` in a private text editor and save only that token. Do not paste it in chat, command arguments or screenshots. Then protect the file:

   ```sh
   chmod 600 "$HOME/.config/openclaw-office/gateway-token"
   ```

3. Edit `$HOME/.config/openclaw-office/config.json`. Replace **only** `gateway.auth` with:

   ```json
   {"mode":"device","tokenFile":"./gateway-token"}
   ```

   This relative filename assumes the token and configuration are in the same private directory. Preserve the other fields.

4. From the repository checkout with dependencies installed, run:

   ```sh
   node payload/bridge/inspect.mjs --config "$HOME/.config/openclaw-office/config.json"
   ```

   If it requests pairing, run `openclaw devices list` and approve only the exact request generated for this device, using `openclaw devices approve YOUR_EXACT_REQUEST_ID`. Confirm it requests only `operator.read`. Rerun the diagnostic after approval. If no request is pending and authentication fails, stop and inspect the diagnostic; do not approve unrelated devices or increase permissions.

5. Require a successful diagnostic with `authenticated: true` and `deviceTokenStored: true`. Run it a second time and require `authenticationSource: "paired-device"`. If the token is not stored or the second run fails, **keep the bootstrap file and configuration** and diagnose the failure before continuing.

6. Change `gateway.auth` to `{"mode":"device"}`, removing `tokenFile`, and run the diagnostic again. Require paired-device authentication without the bootstrap selector. Only then delete the unneeded bootstrap file:

   ```sh
   rm "$HOME/.config/openclaw-office/gateway-token"
   ```

7. Enable the plugin and apply the change:

   ```sh
   openclaw plugins enable openclaw-office
   openclaw gateway restart
   ```

   Follow [enable and verify](#enable-and-verify) to check the actual HTTP interface. Both health flags must become true. This procedure is documented, not an assertion that pairing has already succeeded on your host.

## Troubleshooting

| Observation | Meaning and next check |
| --- | --- |
| curl cannot connect / doctor `unreachable` | Check the exact configured interface/port and whether the child is running. Do not infer an auth failure from a network failure. |
| HTTP 200, `connected:false` | HTTP is running; Gateway authentication or reachability failed. Run the private pairing diagnostic with the same configuration, OS user and identity directory. |
| `token_missing` | Follow [recover a missing authentication token](#recover-a-missing-authentication-token). A device identity without a valid saved token needs bootstrap pairing. |
| `device_token_mismatch` | The saved token is rejected. Inspect device management and re-pair the exact installation if required; do not reuse unrelated identities or increase scopes. |
| `connected:true`, `complete:false` | Session synchronization is incomplete; idle status is not established. Check plugin-specific errors and retry the diagnostic before claiming success. |
| HTTP works on host, clock is stale | Check LAN reachability, firewall, scheme, port and `bridge_url`; localhost on the clock means the clock itself. |
| Port already in use | Identify the process owning the configured port. Choose a free port or stop that specific process only when authorized. |
| Plugin exits | Inspect plugin-specific logs, configuration path and dependency installation. Child output is not forwarded to shared logs; use the private diagnostic instead. |

For user systemd Gateway installations, inspect logs locally with `journalctl --user -u openclaw-gateway.service -n 100 --no-pager`. Logs can contain private network and device metadata: redact them before sharing. Do not use `curl -s` alone; it hides connection errors.

## Stop or uninstall

Disable this plugin and restart the Gateway to stop its bridge. Preserve private pairing files if you intend to reinstall. To remove the package, use `openclaw plugins uninstall openclaw-office`; review its confirmation before accepting. Installation does not authorize deleting unrelated services or device identities.
