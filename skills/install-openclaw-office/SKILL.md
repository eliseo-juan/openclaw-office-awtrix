---
name: install-openclaw-office
description: Install, configure, verify, or troubleshoot the OpenClaw Office bridge plugin and its AWTRIX TC002 script, including fresh device pairing and migration from an existing bridge.
---

# Install OpenClaw Office

Use the repository's [installation guide](../../docs/INSTALL.md) as the command reference. This skill is shipped by the plugin; it can guide configuration after plugin installation. For bootstrap before installation, clone the repository and load this file explicitly using the agent's skill mechanism. Do not assume the host has already discovered a skill from an uninstalled plugin.

## Establish the target

Identify the Gateway host, OS user, installed OpenClaw version, desired clock-reachable HTTP address/port, and whether this is a fresh installation or an existing Office bridge. Inspect current plugin status and only relevant non-secret configuration fields before changing them. Do not dump the Gateway configuration or environment into tool output.

An install request authorizes preparing this plugin and its private configuration; do not infer authorization to publish data, change unrelated plugins, weaken Gateway authentication, or revoke devices. Explain any required Gateway restart and obtain approval if the user's authorization does not cover interrupting it.

## Select the correct path

For an existing bridge, preserve its configuration and entire identity directory. Reuse the absolute configuration path. Record how it was managed and its enabled state; stop only the identified old bridge immediately before enabling the plugin. Retain rollback until verified.

For a fresh installation, follow the guide's private-config and device-pairing steps. Create directories with mode 700 and secret/config files with mode 600, without overwriting existing files. Ask only for missing non-secret addresses and preferences. If the user authorized reading an existing local Gateway credential, transfer it programmatically into a protected bootstrap file without printing it. Otherwise have the user enter it privately; never request a token in chat or place it in command arguments, repository files or shared logs. Use the diagnostic with `operator.read`; approve only the newly created device request when authorized, and stop if approval requests broader scopes. Remove bootstrap configuration only after paired-device authentication succeeds.

## Configure and activate

Use manifest ID `openclaw-office`, not the npm package name, in host configuration. Set both `hooks.allowPromptInjection` and `hooks.allowConversationAccess` to false. On OpenClaw 2026.9.2 the installer's prompt defaults are host-owned; do not claim an empty manifest disables them. Preserve other configuration entries.

Set `config.configPath` to the absolute private bridge file. Enable the plugin and apply the Gateway restart/reload appropriate to the installed version. Installing a configured-required plugin can leave it disabled; installation success does not imply runtime readiness.

## Verify before reporting success

Run the repository's `scripts/doctor.mjs` with the private config path. Use the configured HTTP interface, not assumed loopback. Wildcard listeners require an explicit reachable host via `--host`. Never configure AWTRIX with localhost, `0.0.0.0`, or the OpenClaw WSS URL when the bridge lives on another machine.

Distinguish:

- Unreachable: listener, interface, port, process or network failure.
- HTTP reachable but `connected:false`: Gateway connection/authentication failure; run the private diagnostic with the same config, origin, OS user and device state.
- Connected but incomplete: synchronization is not ready; never infer idle from missing evidence.
- Ready: both booleans true, valid `/api/display?page=0`, and reachability from the clock network.

Use finite request timeouts, visible error output and at most three diagnostic retries before reporting an unresolved blocker. Do not repeatedly reinstall, rotate credentials, or delete identity files as a generic retry strategy. Report only sanitized error codes and actionable next steps.

After bridge verification, install or update the single-file `OpenClawOfficeLive.ax` through the user's available AWTRIX controls. Preserve an existing script's settings and the display power state. Set only its reachable `bridge_url` and requested visual parameters. Verify native script errors and roster when supported. Distinguish a verified bridge from untested clock behavior or unobserved working-to-idle transitions.

Only after successful migration disable the identified old bridge's automatic startup. On failure disable the new plugin before restoring the previous bridge owner. Report checks actually run, remaining limitations, and rollback state without including credentials or private identifiers.
