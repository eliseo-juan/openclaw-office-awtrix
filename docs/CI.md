# Repository checks

## Required gate

The `CI` job requires all three Node test jobs (22, 24, 26), package/plugin integrity and the history secret scan to succeed. It fails if a dependency job fails, is cancelled or is skipped. The same workflow runs for pull requests, main pushes, manual dispatches and a weekly dependency check.

- Tests exercise pairing, credential redaction, setup, bridge lifecycle, display projection and motion with synthetic fixtures.
- Integrity checks syntax, package/manifest identity and lockfile metadata. It packs and extracts the actual npm archive, verifies required runtime files and relative imports, excludes test/private/development files and probes CLI registration from the extracted archive.
- The pinned official `@openclaw/plugin-inspector` runs both static inspection and registration capture with its mocked SDK. Reports are uploaded even on failure. Warnings remain visible instead of being silently suppressed.
- `npm audit` fails on high or critical advisories, including development tools.
- Gitleaks scans Git history with comments and secret-bearing artifact uploads disabled.

Workflows have read-only tokens, no stored checkout credentials and no `pull_request_target` execution. Actions are pinned to full commit SHAs. The repository permits GitHub-owned actions and the pinned Gitleaks action, requires SHA pinning and does not allow Actions to approve pull requests. Dependabot proposes dependency and action updates weekly; nothing is automatically merged or published.

The inspector currently reports a missing explicit plugin API compatibility range and gaps in isolated dependency/runtime-service evidence. These are advisories, not confirmed compatibility failures. This repository does not invent an API range without verifying the declared host baseline. Live installation, Gateway behavior and native AWTRIX execution remain separate integration checks.

## Reference study

Reviewed on 26 October 2026:

| Repository | Observed checks | Applied here |
| --- | --- | --- |
| [memory-lancedb-pro](https://github.com/CortexReach/memory-lancedb-pro/blob/main/.github/workflows/ci.yml) | Version consistency, CLI smoke, regression, storage/schema, authentication and packaging | Metadata consistency, existing CLI/auth regression suite and a real package smoke check |
| [DingTalk](https://github.com/soimy/openclaw-channel-dingtalk/blob/main/.github/workflows/ci-tests.yml) | Frozen dependencies, format/type/lint checks, tests, coverage, build and runtime package verification | Frozen install, syntax checks, tests and runtime package verification; this JavaScript plugin has no TypeScript build |
| [A2A Gateway](https://github.com/win4r/openclaw-a2a-gateway/blob/master/.github/workflows/test.yml) | Node matrix, TypeScript check and tests | Node compatibility matrix and tests |
| [Official kitchen-sink](https://github.com/openclaw/kitchen-sink/blob/main/.github/workflows/check.yml) | Tests, runtime plugin inspector, package checks and report artifacts | Pinned official inspector with mock runtime capture, package checks and artifacts |

Two other highly starred WeCom plugins inspected had no `.github/workflows` directory at review time. Popularity alone is not evidence of comprehensive CI. No release, deployment, registry-publishing or live-provider workflow was copied.

## Owner review

`.github/CODEOWNERS` assigns all files to `@eliseo-juan`. The independent `Owner review` ruleset requires one code-owner approval and dismisses stale reviews after code changes. CODEOWNERS must be merged to main before GitHub can use it for automatic review requests; drafts request review when marked ready.

GitHub forbids approving your own PR. A PR-only administrator exception applies exclusively to the review ruleset. At configuration time, the sole administrator is `@eliseo-juan`. The separate `Protect main` ruleset has no bypass actors, so the exception cannot skip CI, PRs, resolved discussions, up-to-date branches or the restrictions on direct/force pushes and deletion. Granting someone else administrator access would also grant the review exception and should be reviewed deliberately.
