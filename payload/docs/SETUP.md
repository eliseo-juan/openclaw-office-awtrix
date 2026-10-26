# Setup

## Requirements

- OpenClaw Gateway with permission to pair a read-only device.
- Node.js 22.19 or newer and npm on the bridge machine.
- An AWTRIX NG TC002 with a 52 × 16 display for the physical office.
- Network access from the bridge to the Gateway and from the clock to the bridge.

The bridge may run on the Gateway machine, a Raspberry Pi, a NAS, or your computer. SSH is optional and its username depends on the server owner. This project does not assume a shared username or hostname.

## 1. Create private configuration

From the project directory:

```sh
mkdir -p .local
chmod 700 .local
cp payload/config/config.example.json .local/config.json
chmod 600 .local/config.json
cd bridge
npm ci
```

Edit `.local/config.json`. Set `gateway.url` to your own `wss://` address. Use `ws://127.0.0.1:18789` only when the Gateway is on the same machine. Embedded URL credentials and query-string secrets are rejected. Paths in configuration are relative to the config file, independently of your working directory.

The default HTTP listener is loopback. Leave it there for the local preview. To let a clock on a trusted LAN connect directly, bind `http.host` to the bridge machine's LAN address and allow the selected port only from trusted devices. The status endpoint contains agent names and activity and has no built-in HTTP authentication. Do not expose it directly to the public internet. A remote clock deployment needs a private network or an authenticated HTTPS reverse proxy.

## 2. Choose Gateway authentication

Recommended: **device pairing**, bootstrapped with your Gateway's token. The paired token is stored separately with the device identity and reused on restart.

On the Gateway machine, display the token interactively:

```sh
openclaw gateway auth-token --show
```

Save it in `.local/gateway-token` with a text editor, then:

```sh
chmod 600 .local/gateway-token
```

Do not paste tokens into issues, screenshots, shell commands, or chat. If your OpenClaw version does not recognize this command, consult `openclaw gateway --help` and that version's authentication documentation rather than guessing a configuration key.

Use one of these `gateway.auth` objects:

| Mode | Configuration | Behavior |
| --- | --- | --- |
| Device (recommended) | `{"mode":"device","tokenFile":"./gateway-token"}` | Bootstrap and pair; reuse the saved scoped device token. |
| Token | `{"mode":"token","tokenEnv":"OPENCLAW_GATEWAY_TOKEN"}` | Load the configured token; reuse a paired token if one is issued. Pairing may still be required by Gateway policy. |
| Password | `{"mode":"password","passwordFile":"./gateway-password"}` | Load the configured password; reuse a paired token if issued. Pairing may still be required. |
| Already paired | `{"mode":"device"}` | Use an existing identity and device token in `gateway.stateDirectory`. |

For either secret, use `tokenFile` / `passwordFile` or `tokenEnv` / `passwordEnv`. Environment variable names are configurable. File paths resolve relative to the config file. Modes do not bypass Gateway device policy or request additional scopes. A fresh device without a bootstrap credential may be rejected.

Run:

```sh
node payload/bridge/inspect.mjs --config .local/config.json
```

If pairing is required, find the request ID in the diagnostic and approve that exact request **on the Gateway machine**:

```sh
openclaw devices list
openclaw devices approve YOUR_REQUEST_ID
```

Rerun the diagnostic. Verify `authenticated: true`, the intended roster, and `operator.read` in the granted scopes. A subsequent run should report `authenticationSource: "paired-device"`. Keep both identity and token files; copying only the token does not recreate the device identity. Treat the entire state directory as private.

After successful pairing, change `gateway.auth` to `{"mode":"device"}` and remove the bootstrap token file if it is no longer needed. Remove its file/environment selector from configuration before deleting the file. Restart and verify the connection. Moving an identity between operating systems can require a new metadata approval and invalidate its old token; repeat the bootstrap/pairing process on the destination if required.

Each Gateway should use a separate `stateDirectory`. Changing Gateway origin does not reuse a token bound to the old origin. To revoke access, remove this device through OpenClaw's device management and stop the bridge.

## 3. Run the bridge

```sh
node payload/bridge/server.mjs --config .local/config.json
```

Open `http://127.0.0.1:8790`. `/healthz` reports synchronization; `/api/state` supplies the complete roster; `/api/display?page=0` supplies one bounded clock page. These endpoints contain no Gateway credential or session transcript. A complete, connected snapshot establishes idle; disconnections and incomplete coverage produce unknown states.

## 4. Optional SSH and Linux service

Use your own SSH user, for example `ssh your-user@your-server`, or create an alias in `~/.ssh/config`:

```sshconfig
Host office-server
  HostName YOUR_SERVER_ADDRESS
  User YOUR_SSH_USERNAME
  IdentityFile ~/.ssh/id_ed25519
```

Test with `ssh office-server`. Set `deployment.sshTarget` to this alias if you want to record it in your installation config; the bridge does not connect over SSH at runtime.

On the Linux server, install the project at `~/.local/share/openclaw-office`, run `npm ci` in its `bridge` directory, and create private config at `~/.config/openclaw-office/config.json`. Configure absolute state and secret paths there, or paths relative to that config directory. Pair the device on that machine. Do not include credentials in a distributable archive.

Copy `deploy/openclaw-office.service` into `~/.config/systemd/user/` and then run:

```sh
systemctl --user daemon-reload
systemctl --user enable --now openclaw-office.service
systemctl --user status openclaw-office.service
journalctl --user -u openclaw-office.service -n 50
```

The template resolves `node` from the service PATH. If Node is installed through a version manager, replace `/usr/bin/env node` in the service with its absolute executable path. To keep the user service running after logout, check `loginctl show-user "$USER" -p Linger`; an administrator may need to enable lingering for that specific account.

For a loopback-only remote preview:

```sh
ssh -L 8790:127.0.0.1:8790 office-server
```

Then open the local preview URL. This tunnel does not make the bridge reachable from the clock: configure LAN access separately if needed.

## 5. Install the live clock app

Open the AWTRIX web UI, create a new script named `OpenClawOfficeLive`, and paste `OpenClawOfficeLive.ax`. Save and check for script errors. In its app configuration, set **Bridge URL** to your bridge's reachable address, such as `http://YOUR_BRIDGE_LAN_ADDRESS:8790` (no trailing slash). This is the bridge address, not the Gateway address.

Choose **Bot style** in the same app settings to select any of the 16 designs at 3 or 5 pixels wide. Jelly remains the default. Idle bots spend most of their time stopped, with independent 10–25 second pauses between short cafe walks.

The browser has its own persistent style selector; `display.botStyle` in bridge configuration supplies its default.

After saving, the app joins the normal rotation. Enable it in Apps and use Show to preview it immediately. Keep the original `OpenClawOffice` demo as a rollback. The new app should show the real roster within a few seconds. For more than eight agents, press right to change floor.

## Troubleshooting

- **Pairing required:** approve the exact pending device request on your Gateway, then retry.
- **Unauthorized:** check the selected secret source and Gateway policy. Do not grant admin scope to fix a read-only integration.
- **Unknown agents:** inspect `/healthz`; incomplete session pagination, reconnects, or stale data intentionally prevent idle inference.
- **WAIT on clock:** confirm Bridge URL, LAN binding, Wi-Fi routing and firewall. A loopback URL on the clock refers to the clock itself.
- **Red indicator:** check bridge reachability and Gateway connectivity. An existing office remains visible, but stale bots turn gray.
- **Missing agents:** system agents are excluded. Agents after the eighth are on additional floors.
- **Clock script error:** keep the original demo, inspect the app's error in AWTRIX, and record firmware and Gateway versions when reporting the issue. Do not attach credentials or private state files.

Stop a service with `systemctl --user stop openclaw-office.service`. To uninstall, disable its unit, remove that unit and the live AWTRIX script, then revoke the paired Gateway device. Deleting the local files alone does not revoke server-side access.

## Native clock parameters

The script exposes 14 settings, grouped under Connection, Appearance, Movement and Floors. See `hub/SETTINGS.md` for defaults, ranges and dependency rules. Save changes in the AWTRIX Apps settings; no source edit is needed. Gateway authentication and the Linux service remain configured on the bridge host.
