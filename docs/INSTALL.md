# Install OpenClaw Office

Run host commands as the same operating-system user that runs the OpenClaw Gateway. A plugin installation is not complete until the bridge reports both `connected: true` and `complete: true`, and the clock can reach it.

## Choose your starting point

- **Existing working Office bridge:** preserve its private configuration and entire identity directory. Go to [reuse an existing bridge](#reuse-an-existing-bridge).
- **First installation:** create private configuration and pair a device using [first installation](#first-installation).
- **Installed but not working:** use [troubleshooting](#troubleshooting). Do not reinstall repeatedly or rotate tokens without diagnosing the failure.

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

## Reuse an existing bridge

Set the actual absolute path of its existing private configuration; do not recreate it or copy just the token:

```sh
OFFICE_CONFIG="$HOME/.config/openclaw-office/config.json"
test -r "$OFFICE_CONFIG"
openclaw config set plugins.entries.openclaw-office.config.configPath "$OFFICE_CONFIG"
```

If the file does not exist, stop and follow first installation. Preserve `gateway.url`, `gateway.stateDirectory`, authentication mode and HTTP binding. Relative credential and identity paths resolve relative to this file, not to the plugin directory.

Before enabling, identify how the previous bridge is managed. Stop only that bridge to release its HTTP port. For a user systemd service actually named `openclaw-office.service`:

```sh
systemctl --user stop openclaw-office.service
```

Do not disable its automatic startup until the plugin's health is verified. Keep this as the rollback path.

Continue to [enable and verify](#enable-and-verify).

## First installation

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

A successful HTTP response with false flags is **not** a complete installation. Once ready, verify `/api/display?page=0` and reachability from another device on the clock's network. Only after success, disable the old standalone service if one was replaced:

```sh
systemctl --user disable openclaw-office.service
```

Use that command only if this was the previous service's actual name.

## Install the AWTRIX app

1. Open the TC002 AWTRIX web UI and its script editor.
2. Paste the entire [OpenClawOfficeLive.ax](../OpenClawOfficeLive.ax), save, and open its settings.
3. Set `bridge_url` to `http://YOUR_LAN_IP:8790`, with no trailing slash. This is the bridge address, not the OpenClaw WSS address. Do not put Gateway credentials on the clock.
4. Start the script. `show_in_rotation=true` includes it in normal rotation; false skips automatic turns while background refresh continues.
5. Confirm the roster, status indicator and floor count. Other settings control bot style, palette, cafe movement and floor switching.

AWTRIX app version and plugin package version are independent. No AWTRIX Hub listing has been published by this repository.

## Troubleshooting

| Observation | Meaning and next check |
| --- | --- |
| curl cannot connect / doctor `unreachable` | Check the exact configured interface/port and whether the child is running. Do not infer an auth failure from a network failure. |
| HTTP 200, `connected:false` | HTTP is running; Gateway authentication or reachability failed. Run the private pairing diagnostic with the same configuration, OS user and identity directory. |
| `token_missing` | No usable credential reached the Gateway. Check the exact origin and identity directory, paired token availability, secret-file permissions and bootstrap configuration. A saved token alone does not prove the Gateway still accepts it. |
| `device_token_mismatch` | The saved token is rejected. Inspect device management and re-pair the exact installation if required; do not reuse unrelated identities or increase scopes. |
| `connected:true`, `complete:false` | Session synchronization is incomplete; idle status is not established. Check plugin-specific errors and retry the diagnostic before claiming success. |
| HTTP works on host, clock is stale | Check LAN reachability, firewall, scheme, port and `bridge_url`; localhost on the clock means the clock itself. |
| Port already in use | Stop the identified old bridge, not arbitrary processes. Keep the previous configuration for rollback. |
| Plugin exits | Inspect plugin-specific logs, configuration path and dependency installation. Child output is not forwarded to shared logs; use the private diagnostic instead. |

For user systemd Gateway installations, inspect logs locally with `journalctl --user -u openclaw-gateway.service -n 100 --no-pager`. Logs can contain private network and device metadata: redact them before sharing. Do not use `curl -s` alone; it hides connection errors.

## Rollback

Disable this plugin and restart the Gateway before starting the previous bridge service. Restore only settings changed for this installation. Preserve private pairing files. Never run both bridge owners on the same port.
