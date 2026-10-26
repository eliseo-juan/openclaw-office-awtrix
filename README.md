# OpenClaw Office for AWTRIX

A 52 × 16 pixel office for OpenClaw agents on AWTRIX NG / Ulanzi TC002. Working agents sit at desks; idle agents move around the kitchenette. Agent count controls the layout and floors.

## Get started

On the OpenClaw Gateway machine:

```sh
openclaw plugins install git:github.com/eliseo-juan/openclaw-office-awtrix
openclaw plugins enable openclaw-office
openclaw office setup
```

Confirm read-only device pairing if requested. Setup prepares private configuration, verifies authentication, enables the bridge and prints the URL to put in AWTRIX. It may restart the Gateway. Gateway credentials stay on the host.

Then paste [OpenClawOfficeLive.ax](OpenClawOfficeLive.ax) into your clock's script editor and set its `bridge_url` to the printed URL.

[Installation and troubleshooting](docs/INSTALL.md) · [Agent installation skill](skills/install-openclaw-office/SKILL.md)

Already installed an older version? Run `openclaw plugins update openclaw-office`, review the new CLI capability, and enable the plugin if it was previously disabled. Then run setup. Remote Gateways, private credential files and LAN address overrides are covered in the guide.

## How it works

The native OpenClaw plugin manages a read-only companion bridge. The clock polls bounded HTTP display pages; it does not hold a Gateway credential or read conversation transcripts. Setup requests only `operator.read` and disables unused prompt/conversation hooks. OpenClaw 2026.9.2's initial capability prompt uses host defaults; the package cannot override that prompt.

All runtime files are committed; installation requires no build step. The AWTRIX script's visual/rotation settings are independent from the bridge plugin version. No AWTRIX Hub listing has been submitted.

## Development

```sh
npm ci --ignore-scripts --legacy-peer-deps
npm test
```

Tests cover setup from an empty private directory, configuration preservation, scoped SDK pairing and reconnect without bootstrap, secret handling, offline health, projection, child lifecycle, and display payloads. Gateway and clock integration checks are reported separately from fixtures; a simulated Gateway does not prove target-host pairing or physical clock behavior.

MIT. This repository contains the Office application and bridge, not AWTRIX firmware.
