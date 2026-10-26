# Changelog

## 0.4.1

- Replace Show in rotation with Always on. Use AWTRIX rotation.show/pause to hold Office, and release its pause when leaving the app. Disabled uses normal rotation; manual navigation remains available.
- AWTRIX script version is 0.5.1.

## 0.4.0

- Show a clearly labeled setup preview with six example cafe bots when Bridge URL is empty or still the old placeholder. Configuring the URL switches to live data; configured outages remain OFFLINE.
- Remove the one-pixel connection indicator and its setting. Healthy connections use the normal office view; disconnection and stale data show orange walls and a centered OFFLINE label.
- Match setup/offline presentation in the browser preview. AWTRIX script version is 0.5.0.

## 0.3.0

- Replace four movement controls with one Caffeine level setting: Decaf, Coffee (default), or Espresso. Levels adjust both cafe pauses and walking pace. Existing low-level movement values are no longer read.
- Match caffeine presets in the browser preview. AWTRIX script version is 0.4.0.
- Remove redundant script-editing commentary from setup success output.

## 0.2.4

- Shorten setup messages and replace skipped step numbers with plain progress messages.
- Direct users to the AWTRIX app settings and the Bridge URL field; URL configuration does not require editing the script.

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
