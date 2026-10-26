# Security

Report suspected vulnerabilities through [GitHub private vulnerability reporting](https://github.com/eliseo-juan/openclaw-office-awtrix/security/advisories/new). Do not publish credentials, exploit details or private Gateway information in issues or pull requests.

Include the plugin and OpenClaw versions, affected component, expected impact and a minimal reproduction using fictional data. Redact tokens, device identities and personal hostnames.

The bridge holds a scoped read-only OpenClaw device credential on its host. Its HTTP endpoint exposes agent names and activity without authentication, so it belongs on a trusted, reachable network. Do not expose that endpoint to the public internet without an appropriate access layer. Gateway credentials and conversation transcripts do not belong on the clock.

Secret scanning and push protection are enabled on this repository. CI checks known dependency advisories, runs Gitleaks and inspects plugin/package integrity. These checks reduce risk; they are not a guarantee that a plugin or deployment has no vulnerabilities.
