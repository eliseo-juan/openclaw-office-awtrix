---
name: install-openclaw-office
description: Install, configure, verify, or troubleshoot OpenClaw Office for AWTRIX using its setup command, with private read-only device pairing and clock connection.
---

# Install OpenClaw Office

Use [installation and troubleshooting](../../docs/INSTALL.md). For first install, run the standard Git plugin installer and `openclaw office setup`. Do not manually construct JSON or ask a user to copy tokens when setup can use the local Gateway credential. Before plugin installation, load this skill from a trusted repository checkout; do not assume an uninstalled plugin's skill is already discovered.

## Execution

Identify the Gateway host and OS user, confirm plugin source and version, and inspect whether the plugin was left disabled. Update older versions, review the new `office` CLI capability and explicitly enable the plugin after installation or updating so `openclaw office setup --help` works. Do not dump Gateway config, environment or private state into tool output.

Run setup on the Gateway machine. A user request to install does not authorize unrelated service changes or publishing data. Explain that setup can approve its newly created read-only device and restart the Gateway; use `--yes` for unattended execution only when that authorization is clear. Otherwise run interactively. Do not approve other devices or widen scopes.

Setup detects local plain token/password credentials or inherited standard environment variables, retains them only in memory, verifies a saved `operator.read` token, denies prompt/conversation hooks, and prints a clock-reachable bridge URL. If it asks for a private credential file or LAN address, obtain only the missing information. Never request tokens in chat, command arguments, screenshots or repository files. Remote Gateway credentials must be supplied explicitly with a protected file; local credentials must not be sent to unrelated Gateway origins.

Preserve existing configuration, origin and identity. Use a separate `--config` for a different Gateway. On failure, follow the guide's specific error, with at most three diagnostic retries; do not repeatedly reinstall or delete identity files. Setup does not stop arbitrary services or change firewall rules.

## Acceptance

Do not claim completion unless setup prints `Ready`, both health flags are true and `/api/display?page=0` is valid. Verify clock-network reachability separately. HTTP reachable but `connected:false` is an authentication/connection failure; `complete:false` is incomplete synchronization. Use the actual configured interface rather than assuming loopback.

Install or update `OpenClawOfficeLive.ax` through available AWTRIX controls. Preserve existing native settings and display power. Set `bridge_url` to the setup output; never use the Gateway WSS URL, localhost on another device, or a wildcard listener address. Report bridge verification separately from native script errors, roster rendering and unobserved real working-to-idle transitions.
