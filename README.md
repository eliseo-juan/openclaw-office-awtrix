# OpenClaw Office

A 52 × 16 pixel office for OpenClaw agents on AWTRIX NG / Ulanzi TC002. Working agents sit at desks; idle agents move around the office kitchenette. Agent count controls the layout and floors.

This repository is a native OpenClaw plugin. It manages the companion bridge process and keeps Gateway credentials on the OpenClaw host. The clock polls small HTTP display pages.

## Install

First merge the restricted plugin policy from [plugin-config.example.json](plugin-config.example.json) into your OpenClaw configuration, preserving existing entries and setting your own absolute `configPath`. Keep the entry disabled until the bridge configuration is ready. Then, with an OpenClaw version supporting Git plugin installation:

```sh
openclaw plugins install git:github.com/eliseo-juan/openclaw-office-awtrix
```

The plugin manifest and all runtime files are committed at the repository root; no build step is required. OpenClaw installs the pinned bridge dependencies. Git installation support varies by host version; local archive installation is also supported.

The repository cannot override host-owned capability policy. Reinstalling or updating alone does not revoke a previously accepted permission: apply the `hooks` values below in your OpenClaw configuration first. The installation prompt should then report prompt injection and conversation access as denied.

## Configure

1. Follow [Gateway authentication and bridge setup](payload/docs/SETUP.md), using the files under `payload/` as the project directory. For manual diagnostics use `node payload/bridge/inspect.mjs --config /absolute/path/config.json`. For standalone troubleshooting use `node payload/bridge/server.mjs --config /absolute/path/config.json`.
2. Set the plugin configuration to the absolute path of your private bridge configuration:

```json
{
  "plugins": {
    "entries": {
      "openclaw-office": {
        "enabled": true,
        "hooks": {
          "allowPromptInjection": false,
          "allowConversationAccess": false
        },
        "config": {
          "configPath": "/home/your-user/.config/openclaw-office/config.json"
        }
      }
    }
  }
}
```

3. Stop any existing standalone Office bridge before enabling the plugin: only one process can bind the configured port. Apply the configuration using your normal OpenClaw restart procedure.
4. Confirm `http://YOUR_HOST:8790/healthz` reports `connected: true` and `complete: true`. Bind the bridge to a reachable interface when the clock is on another device; loopback alone is not reachable from the clock.
5. Paste [OpenClawOfficeLive.ax](OpenClawOfficeLive.ax) into AWTRIX and set `bridge_url` to `http://YOUR_HOST:8790`. Its settings control rotation, bot design, palette, movement, and floor switching. No Gateway token belongs on the clock.

A [generic bridge configuration](payload/config/config.example.json) is included. Keep your real configuration, pairing identity, and tokens outside this repository. This plugin does not provide a browser sign-in flow or automatically pair the device.

## Update

```sh
openclaw plugins update openclaw-office
```

## Development and validation

```sh
npm install --ignore-scripts --legacy-peer-deps
npm test
```

Node.js must meet your installed OpenClaw requirements. Minimum declared host version is 2026.9.2; Git installation and plugin-host compatibility still need testing on the target installation.

Tests cover authentication storage, projection, bounded display pages, configuration, child lifecycle, actual offline HTTP endpoints and port cleanup. Live plugin installation, paired Gateway connectivity under the plugin, and a real working-to-idle transition on the clock remain unverified. The plugin reports unexpected child exit; automatic crash restart is not implemented.

To roll back, disable this plugin before restarting your previous standalone bridge. Reuse the same private configuration and state.

## Licence

MIT. This repository contains the Office application and bridge, not AWTRIX firmware.
