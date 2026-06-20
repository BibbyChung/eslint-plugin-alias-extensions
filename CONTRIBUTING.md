# Contributing

Thanks for your interest in contributing to `@dev-bb/eslint-plugin-alias-extensions`!

This document provides guidelines and instructions for setting up the project locally, writing code, and submitting pull requests.

---

## Prerequisites

- **Node.js** `>=18.18.0`
- **npm** (this project uses npm, not pnpm or yarn)

---

## Getting Started

1. **Fork and clone** the repository:

   ```bash
   git clone https://github.com/<your-username>/eslint-plugin-alias-extensions.git
   cd eslint-plugin-alias-extensions
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Verify the setup:**

   ```bash
   npm test         # runs test suite
   npm run build    # builds dist/
   npm run typecheck  # type-checks without emitting
   ```

---

## Development Commands

| Script | Description |
|---|---|
| `npm run dev` | Watch mode — runs tests on every change (`vitest watch`) |
| `npm test` | Run all tests (`vitest run`) |
| `npm run build` | Build `dist/` via Vite |
| `npm run typecheck` | Type-check with `tsc --noEmit` |
| `npm run lint` | Build then self-lint the project with ESLint |
| `npm run lint:fast` | Self-lint without rebuilding first |
| `npm run lint:fix` | Self-lint and auto-fix |

---

## Project Structure

```
src/
├── index.ts                  # Plugin entry — registers rules & configs
└── rules/
    └── require-alias-extension.ts   # The single rule implementation
├── tests/
│   └── rules/
│       └── require-alias-extension.test.ts
├── vite.config.ts            # Build config (Vite library mode)
├── vitest.config.ts          # Test config
├── vitest.setup.ts           # Adapter: ESLint RuleTester → Vitest
├── eslint.config.mjs         # Self-lint config
├── tsconfig.json
└── package.json
```

- **`src/rules/`** — rule implementations. Each file exports a `TSESLint.RuleModule`.
- **`src/index.ts`** — imports all rules and exposes them as an ESLint plugin with a `recommended` config.
- **`tests/rules/`** — test files mirroring `src/rules/`. Each test uses `TSESLint.RuleTester` with Vitest.

---

## Adding a New Rule

1. **Create the rule file** at `src/rules/<rule-name>.ts`. Use the existing `require-alias-extension.ts` as a template — it exports a `TSESLint.RuleModule<MessageIds, Options>` with typed message IDs and options.

2. **Register the rule** in `src/index.ts` by importing it and adding it to the `rules` object.

3. **Create tests** at `tests/rules/<rule-name>.test.ts`. Use `TSESLint.RuleTester`:

   ```ts
   import { TSESLint } from '@typescript-eslint/utils'
   import rule from '../../src/rules/<rule-name>.js'

   const ruleTester = new TSESLint.RuleTester({ /* ... */ })

   ruleTester.run('<rule-name>', rule, {
     valid: [
       /* code that should pass */
     ],
     invalid: [
       /* code that should fail, with expected errors/output */
     ],
   })
   ```

   For TypeScript-specific tests, use `@typescript-eslint/parser` as the parser (see the existing test file for reference).

4. **Update the plugin config** if the rule should be included in the `recommended` config.

5. **Run tests and type-check:**

   ```bash
   npm test && npm run typecheck
   ```

---

## Testing

- Tests are run with **Vitest**.
- ESLint's `RuleTester` is adapted to Vitest via `vitest.setup.ts`.
- Test files use the `.test.ts` extension and are placed under `tests/rules/`.
- To run a single test file:

  ```bash
  npx vitest run tests/rules/require-alias-extension.test.ts
  ```

- For TypeScript parser–specific tests, create a separate `RuleTester` instance with `@typescript-eslint/parser`.

---

## Code Style

This project follows consistent conventions. Please adhere to them:

- **TypeScript strict mode** (`strict: true` in `tsconfig.json`)
- **Single quotes** for strings (in `.ts` files)
- **No semicolons**
- **`type` over `interface`** for type definitions
- **`import type`** for type-only imports (e.g. `import type { TSESLint } from '@typescript-eslint/utils'`)
- **`??` over `||`** for nullish coalescing
- **`node:` prefix** for Node.js built-in modules (e.g. `import fs from 'node:fs'`)
- **JSDoc comments** on exported types and non-trivial functions
- **ESLint Flat Config only** — no legacy `.eslintrc*` support

---

## Commit & Pull Request

- **Commit messages**: Use concise, descriptive messages. There is no strict convention, but aim for a clear summary of the change (e.g. `feat: add rule for X`, `fix: handle edge case in Y`).
- **Before submitting a PR**:
  - Ensure all tests pass: `npm test`
  - Ensure type-check passes: `npm run typecheck`
  - Ensure lint passes: `npm run lint:fast`
- **Pull requests** should target the `main` branch. Include a brief description of the change and any relevant issue references.

---

## Releasing

This project uses [pubv](https://github.com/runwisp/pubv) to automate version bumping and CHANGELOG graduation.

1. Make sure all changes are committed and the `[Unreleased]` section in `CHANGELOG.md` is up to date.
2. Run the release:

   ```bash
   npx pubv --yes patch   # or minor / major
   ```

   pubv will automatically:
   - Graduate `[Unreleased]` into a new versioned section with today's date
   - Add a fresh empty `[Unreleased]` section
   - Update `[Unreleased]` and version reference links at the bottom
   - Bump the version in `package.json`
   - Create a git commit and tag (`vX.Y.Z`)
   - Push to remote

3. The `v*` tag push triggers the GitHub Actions workflow (`.github/workflows/release.yml`), which runs `npm publish`.

> **Tip**: Use `npx pubv --dry-run patch` to preview the changes before committing.

The `prepublishOnly` script runs `typecheck`, `build`, and `test` before publishing to npm.
