# Contributing

Thanks for helping improve Cashier. Bug reports, fixes and new provider features are all welcome.

## Getting started

You need Node.js 20 or later and npm.

```bash
git clone https://github.com/fellahealth/cashier.git
cd cashier
npm install
```

## Scripts

| Command                 | What it does                          |
| ----------------------- | ------------------------------------- |
| `npm run build`         | Builds every package to its own dist/ |
| `npm test`              | Runs the Jest test suite              |
| `npm run test:coverage` | Runs the tests with a coverage report |
| `npm run typecheck`     | Type checks the source and tests      |
| `npm run lint`          | Lints with ESLint                     |
| `npm run format`        | Formats every file with Prettier      |
| `npm run format:check`  | Checks formatting without writing     |

Run every script from the repository root. Run `npm run format:check && npm run lint && npm run typecheck && npm test && npm run build` before you open a pull request. CI runs the same checks on Node.js 20 and 22.

## Project layout

The repository is an npm workspaces monorepo. Every folder in `packages/` is published to npm as its own package.

| Folder             | npm package             | Contents                     |
| ------------------ | ----------------------- | ---------------------------- |
| `packages/cashier` | `@aios-medical/cashier` | The core library and drivers |

Inside a package:

- `src/` holds the code. In `packages/cashier`, each provider lives in `src/drivers/<provider>/` with its resources, mappers and error mapper.
- `tests/` mirrors `src/` and uses mocked provider clients, so no network access or API keys are needed.
- `package.json`, `tsconfig.json` and `tsup.config.ts` hold the package's own settings. Linting, formatting, testing and the shared TypeScript options live at the root.

Documentation for every package lives in `docs/` at the root. The root `README.md`, `LICENSE` and `CHANGELOG.md` are copied into `packages/cashier` when it is packed, so do not edit the copies.

## Guidelines

- Keep the public API the same for every provider. When a provider cannot support an operation, reject with `UnsupportedOperationError`.
- Map every provider error to a `CashierError` subclass. Never let a raw provider error escape.
- Return amounts in minor units and currency codes in uppercase.
- Add or update tests for every change in behavior.
- Keep code free of comments and JSDoc. Document behavior in `docs/` instead, and keep the README short.
- Use neutral example data in tests, such as `pro-monthly` or `customer-42`.

## Commits and pull requests

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/), for example `feat: add coupons resource` or `fix(recurly): map expired card errors`.

Keep pull requests focused on one change and describe what you changed and why. If you squash merge, make sure the pull request title is a Conventional Commit too, since it becomes the commit message on `main`.

## Releases

Releases are fully automated with [semantic-release](https://semantic-release.gitbook.io/). Every push to `main` runs the Release workflow, which runs all checks and then reads the commits since the last release to decide the next version:

| Commit                                              | Release                  |
| --------------------------------------------------- | ------------------------ |
| `fix: ...`, `perf: ...` or `docs: ...`              | Patch, for example 0.1.1 |
| `feat: ...`                                         | Minor, for example 0.2.0 |
| `feat!: ...` or a `BREAKING CHANGE:` footer         | Major, for example 1.0.0 |
| `chore`, `ci`, `test`, `build`, `refactor`, `style` | No release               |

When there is something to release, the workflow creates the `vX.Y.Z` tag, publishes a GitHub Release with notes generated from the commits, and publishes every package in `packages/` to npm under [`@aios-medical`](https://www.npmjs.com/org/aios-medical) with provenance. All packages are released together with the same version. Nothing is committed back to the repository, so the `version` in each `package.json` stays at `0.0.0-development`. The published version comes from the tag.

`docs` commits publish a patch because npm only updates the README shown on npmjs.com when a new version is published. Use `chore` for changes that should not be released, such as typo fixes in CONTRIBUTING.md.

Never bump the version or publish by hand.

## Reporting security issues

Please follow [SECURITY.md](SECURITY.md) and do not open a public issue.
