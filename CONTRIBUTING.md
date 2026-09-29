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

| Command                 | What it does                                   |
| ----------------------- | ---------------------------------------------- |
| `npm run build`         | Builds CommonJS, ES modules and types to dist/ |
| `npm test`              | Runs the Jest test suite                       |
| `npm run test:coverage` | Runs the tests with a coverage report          |
| `npm run typecheck`     | Type checks the source and tests               |
| `npm run lint`          | Lints with ESLint                              |
| `npm run format`        | Formats every file with Prettier               |
| `npm run format:check`  | Checks formatting without writing              |

Run `npm run format:check && npm run lint && npm run typecheck && npm test && npm run build` before you open a pull request. CI runs the same checks on Node.js 20 and 22.

## Project layout

- `src/` holds the library. Each provider lives in `src/drivers/<provider>/` with its resources, mappers and error mapper.
- `tests/` mirrors `src/` and uses mocked provider clients, so no network access or API keys are needed.

## Guidelines

- Keep the public API the same for every provider. When a provider cannot support an operation, reject with `UnsupportedOperationError`.
- Map every provider error to a `CashierError` subclass. Never let a raw provider error escape.
- Return amounts in minor units and currency codes in uppercase.
- Add or update tests for every change in behavior.
- Keep code free of comments and JSDoc. Document behavior in the README instead.
- Use neutral example data in tests, such as `pro-monthly` or `customer-42`.

## Commits and pull requests

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/), for example `feat: add coupons resource` or `fix(recurly): map expired card errors`.

Keep pull requests focused on one change and describe what you changed and why. Update `CHANGELOG.md` under an `Unreleased` heading when the change affects users.

## Reporting security issues

Please follow [SECURITY.md](SECURITY.md) and do not open a public issue.
