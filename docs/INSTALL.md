# Install OpenClaw Office

Run these commands on the OpenClaw Gateway machine, as the same OS user that runs the Gateway. You need AWTRIX NG on a Ulanzi TC002 (52 × 16), with network access to that machine.

## 1. Install

```sh
openclaw plugins install git:github.com/eliseo-juan/openclaw-office-awtrix
openclaw plugins enable openclaw-office
```

Accept the source and capability review if you trust this repository. On OpenClaw 2026.9.2 the review can say `Prompt injection: allowed` because this is a host default, not a hook used by this plugin. The setup command explicitly disables prompt injection and conversation access.

If you already installed an older Office version, update it first:

```sh
openclaw plugins update openclaw-office
```

Review the new `office` CLI capability when requested. Always run `openclaw plugins enable openclaw-office` after installation or updating. Reinstallation can preserve an existing `enabled:false` entry; installed does not mean enabled. The setup command is unavailable while the plugin is disabled. With no Office configuration yet, enabling registers the CLI without starting a bridge.

## 2. Run setup

```sh
openclaw office setup
```

Confirm preparation and, if requested, approval of the read-only Office device. If an unauthenticated public Gateway address was saved before, setup can offer the Gateway on this machine instead; it uses a separate local identity directory and preserves the previous device files. Setup:

- Detects the local Gateway and a LAN address for the clock.
- Creates private configuration and a device identity, or preserves existing settings and identity paths.
- Uses the local Gateway credential in memory to bootstrap pairing. It does not print it, write it into Office configuration, or pass it as a command argument.
- Verifies a saved `operator.read` device token by reconnecting without the bootstrap credential.
- Disables prompt/conversation hooks, enables the plugin and restarts the Gateway if the bridge is not already healthy.
- Waits for HTTP connectivity and complete agent synchronization.

The command prints `Ready` only when those checks pass, followed by the exact Bridge URL to enter in the AWTRIX app settings. It does not configure the clock automatically. A Gateway restart briefly interrupts active connections; the initial confirmation covers that action.

If the detected address is not reachable from the clock, select one:

```sh
openclaw office setup --host YOUR_LAN_IP
```

For unattended setup after authorizing pairing and the restart, add `--yes`. No token is needed in the command.

## 3. Add the AWTRIX app

1. If the app is not installed yet, import [OpenClawOfficeLive.ax](../OpenClawOfficeLive.ax) once using AWTRIX's script editor.
2. In the AWTRIX web UI, open **OpenClaw Office → Settings**.
3. Set **Bridge URL** (`bridge_url`) to the URL printed by setup and save the app settings.
4. Start the app. **Always on** keeps the office on screen; turn it off for normal app rotation. Manual navigation can still leave the office. Choose **Caffeine level**: **Decaf** for relaxed movement, **Coffee** for a balanced pace (default), or **Espresso** for more activity. Other settings control bot style, palette and floors. Agents can cross each other while walking; cafe stops reserve separate 3×3 spaces. Agents returning to work take the shortest available route around furniture without waiting for other agents.

Before Bridge URL is configured, the clock shows six example bots in the cafe and **SETUP** over the desks. These are decorative placeholders, not discovered agents. Enter and save Bridge URL in the app settings to switch to live data.

A healthy connection uses the normal office view, with no status dot. On disconnection or stale data, walls turn orange and **OFFLINE** appears in the center; agent activity is treated as unknown. The warning clears when fresh connected data returns.

The bridge and clock must be on mutually reachable networks. Publishing the Gateway under HTTPS does not publish the bridge's separate HTTP port. No AWTRIX Hub listing has been submitted by this repository.

## If setup needs more information

### Remote Gateway or a custom credential provider

Local automatic credential detection supports a configured token/password, standard Gateway environment variables, and built-in `store` or `env` SecretRefs through the official OpenClaw SDK. Run as the same OS user and with the same OpenClaw profile so its secure store is available. Setup does not resolve custom file/exec providers automatically or read another OS user's secrets.

Provide a private file containing the bootstrap credential, never the token itself:

```sh
openclaw office setup --gateway-url wss://gateway.example.com \
  --token-file /absolute/private/gateway-token --host YOUR_LAN_IP
```

For password authentication use `--password-file`. Files remain yours; setup does not delete them. It retains only the scoped paired token in its private identity directory. See [authentication reference](../payload/docs/SETUP.md) for alternatives.

### Configuration and ports

Defaults: `~/.config/openclaw-office/config.json` (or `$XDG_CONFIG_HOME/openclaw-office/config.json`) and HTTP port `8790`. For a separate configuration or another free port:

```sh
openclaw office setup --config /absolute/private/config.json --port 8791
```

The LAN HTTP endpoint has no access token and exposes agent names/status, but no Gateway credentials or transcripts. Bind only to an interface/network you intend to expose it to. Setup does not change firewall rules or publish a public URL.

## Troubleshooting

Rerun `openclaw office setup`; it preserves the existing identity and verifies authentication before claiming completion. Do not repeatedly reinstall or delete pairing files.

| Result | What to do |
| --- | --- |
| `office` is unknown | Update the plugin, accept the new CLI capability and enable it if it was left disabled. Use `openclaw office setup --help` to confirm discovery. |
| No local bootstrap credential | Run as the Gateway OS user, or supply `--token-file` / `--password-file`. Never paste credentials into chat. |
| Pairing awaits approval | Rerun interactively and approve the device created by this attempt. Do not approve unrelated devices. |
| `READ_ONLY_TOKEN_NOT_STORED` on an older setup version | Update to 0.2.3 or newer and rerun setup. Earlier versions identified setup as a backend, allowing loopback authentication to skip persistent device pairing. Do not increase scopes or delete identity files. If it persists on the current version, setup has not verified authentication. |
| Existing origin differs | Keep the existing identity. Use a separate `--config` for a different Gateway. |
| `unreachable` | Check the reported listener address/port and process. A bridge bound to a specific LAN IP is not reachable through `127.0.0.1`. |
| `gateway-disconnected` | HTTP is running but Gateway connectivity/authentication failed. Rerun setup; successful device pairing must precede service activation. |
| `incomplete` | Gateway connected, but the complete agent state is not available yet. Setup must not call this ready. |
| Address already in use | Identify the process holding that port or choose `--port`; setup never kills arbitrary processes. |
| Clock stale while setup is ready | Check the clock's LAN reachability and `bridge_url`, not Gateway authentication. |

For an independent check from a source checkout with dependencies installed:

```sh
node scripts/doctor.mjs --config /absolute/private/config.json
```

Or use the actual address printed by setup:

```sh
curl --fail-with-body --show-error --max-time 5 http://YOUR_LAN_IP:8790/healthz
```

Success is `{"connected":true,"complete":true}`. False flags are not readiness. Do not use `curl -s` alone; it hides connection errors.

## Stop or uninstall

Disable `openclaw-office` and apply your normal Gateway restart to stop its bridge. Use `openclaw plugins uninstall openclaw-office` to remove the package. Keep the private pairing files if you intend to reinstall. No unrelated services or identities should be deleted.
