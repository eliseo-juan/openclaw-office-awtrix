# Changelog

## 0.2.3

- Identify the setup command as a CLI client so local Gateway authentication follows normal device pairing instead of the backend self-pairing shortcut, which can succeed without issuing a saved device token.
- Reproduce the no-token backend behavior in the SDK regression fixture. Runtime bridge mode is unchanged.

## 0.2.2

- Align the npm package name with the existing plugin ID, `openclaw-office`, to remove the installer naming warning. Repository URL, configuration keys and CLI commands are unchanged.

## 0.2.1

- Resolve built-in store/env Gateway SecretRefs through the official SDK during local setup, without printing or persisting bootstrap credentials.
- Fail closed when a configured reference cannot resolve; do not silently borrow another credential.

## 0.2.0

- Add `openclaw office setup` for local Gateway detection, private configuration, read-only device pairing, hook restrictions, plugin activation and health verification.
- Reconnect using only the saved device token before enabling the bridge; bootstrap credentials remain in memory.
- Register setup before Office configuration exists. No running bridge is required to discover the command.
- Add explicit remote/private-file and LAN host/port options, unattended consent, bounded retries and actionable sanitized failures.
- Make setup the primary path in the README, installation guide and bundled agent skill. Manual authentication remains an advanced reference.
- Validate scoped SDK pairing against an isolated Gateway fixture and CLI discovery with OpenClaw 2026.9.2 in an isolated profile. Fixture verification does not prove pairing against an individual's live Gateway.

## 0.1.1

- Add the agent installation skill, manual installation guide and interface-aware health diagnostic.

## 0.1.0

- Package the existing bridge as an OpenClaw-managed service with the single-file AWTRIX application.
