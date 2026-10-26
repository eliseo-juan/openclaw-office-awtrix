# Contributing

Open an issue for bugs or a proposal for substantial changes. Keep pull requests focused and use English for code, documentation and discussion.

## Local checks

Use Node.js 22.22.3 or newer. CI runs tests on Node 22, 24 and 26.

```sh
npm ci --ignore-scripts --legacy-peer-deps
npm test
npm run check
npm run plugin:check
npm audit --audit-level=high --legacy-peer-deps
```

`--legacy-peer-deps` leaves the OpenClaw host peer to the actual Gateway installation; tests use credential-free fixtures. `--ignore-scripts` avoids dependency lifecycle hooks.

The integrity check creates a real npm archive in a temporary directory, verifies runtime files and local imports, and imports its entrypoint to check CLI registration without private configuration. The pinned official OpenClaw inspector checks the plugin statically and captures registration with a mocked SDK. Reports are retained by CI. Inspector warnings remain visible; a pass does not prove compatibility with every OpenClaw release or a live Gateway.

For changes to authentication, test failure and redaction paths. For display changes, include a deterministic simulation or useful regression test. Native Berry execution and physical display behavior still need a clock check; the Node checks cannot replace that.

## Pull requests

`main` requires a pull request, resolved discussions and a passing `CI` check. Direct pushes, force pushes and deletion are blocked, including for administrators. Eliseo Juan (`@eliseo-juan`) is the sole code owner for every file, including CODEOWNERS itself. Contributor pull requests require one approving code-owner review; code changes dismiss stale approvals. Draft pull requests request code-owner review when marked ready, after CODEOWNERS is present on the base branch.

GitHub does not allow self-approval. The repository administrator (currently only `@eliseo-juan`) may bypass the separate review rule through a pull request to review their own changes when merging. This exception does not bypass the independent main protection: CI, up-to-date branches, resolved discussions, blocked direct/force pushes and blocked deletion still apply. Merge with squash; merged branches are deleted automatically.

Do not include credentials, device identities, private configuration, transcripts or personal hostnames. Use `example.com` and reserved documentation addresses in examples. See [Security](SECURITY.md) for private vulnerability reporting.

## Media

Use [the media kit](media/README.md) to reproduce browser captures with fictional agents. Keep the Hub GIF at or below 10 seconds and 8 MB. Avoid describing simulated activity as real Gateway activity.
