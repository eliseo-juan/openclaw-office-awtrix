# OpenClaw Office

A 52 × 16 pixel office for OpenClaw agents on AWTRIX NG / Ulanzi TC002. Working agents sit at desks; idle agents move around the office kitchenette. Agent count controls the layout and floors.

This repository is a native OpenClaw plugin. It manages the companion bridge process and keeps Gateway credentials on the OpenClaw host. The clock polls small HTTP display pages.

## Install and configure

Follow the [complete installation guide](docs/INSTALL.md). It separates first-time pairing, reuse of an existing bridge, plugin activation, correct-interface health checks, AWTRIX configuration, troubleshooting and rollback. No steps depend on a previous chat or a pre-existing private configuration.

```sh
openclaw plugins install git:github.com/eliseo-juan/openclaw-office-awtrix
```

Installation alone is not setup: the plugin is initially disabled until its private `configPath` is configured. The guide explains OpenClaw 2026.9.2 capability prompts and how to deny unused prompt/conversation hooks. The package cannot override the host's permission defaults.

For an agent-assisted installation, load [install-openclaw-office](skills/install-openclaw-office/SKILL.md). The plugin declares its bundled skill directory. Before installing the plugin, an agent can clone this repository and load the skill from the checkout. It must verify bridge health and clock reachability before claiming completion.

[Example host configuration](plugin-config.example.json) · [Example bridge configuration](payload/config/config.example.json)

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

Tests cover authentication storage, projection, bounded display pages, configuration, child lifecycle, actual offline HTTP endpoints and port cleanup. The plugin was observed loading on OpenClaw 2026.9.2 and serving HTTP on its configured LAN interface. Successful paired Gateway connectivity under the plugin and a real working-to-idle transition on the clock remain unverified. The plugin reports unexpected child exit; automatic crash restart is not implemented.

To roll back, disable this plugin before restarting your previous standalone bridge. Reuse the same private configuration and state.

## Licence

MIT. This repository contains the Office application and bridge, not AWTRIX firmware.
