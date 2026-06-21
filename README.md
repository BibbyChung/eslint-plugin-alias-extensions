# @dev-bb/eslint-plugin-alias-extensions

[![npm version](https://img.shields.io/npm/v/@dev-bb/eslint-plugin-alias-extensions?style=flat-square)](https://www.npmjs.com/package/@dev-bb/eslint-plugin-alias-extensions)
[![license](https://img.shields.io/npm/l/@dev-bb/eslint-plugin-alias-extensions?style=flat-square)](LICENSE)

> Enforce file extensions on alias imports in your project.

When using import aliases (e.g. `#src/*`, `#shared/*`), it's easy to forget the file extension. This ESLint plugin checks that every alias import, export, or re-export includes the correct file extension — and can auto-fix violations for you.

It supports **directory index resolution** too. If `#src/lib/ui` resolves to `#src/lib/ui/index.ts`, the rule will suggest `#src/lib/ui/index.ts` as the fix.

```js
// ❌ Before
import Loading from '#src/lib/ui/Loading'
import { utils } from '#src/lib/ui'

// ✅ After (auto-fixed)
import Loading from '#src/lib/ui/Loading.tsx'
import { utils } from '#src/lib/ui/index.ts'
```

The plugin handles `ImportDeclaration`, `ExportNamedDeclaration`, `ExportAllDeclaration`, and dynamic `import()` expressions (`ImportExpression`), so static imports, re-exports, and dynamic imports are all covered.

---

## Requirements

| Dependency | Version |
|---|---|
| **Node.js** | `>=20.19.0` |
| **ESLint** | `>=9.0.0` |

> This plugin only supports ESLint's **Flat Config** (`eslint.config.js`). It does **not** work with the legacy `.eslintrc*` format.

---

## Getting Started

### Installation

```bash
npm install eslint @dev-bb/eslint-plugin-alias-extensions --save-dev
```

> pnpm or yarn users: replace `npm install` with `pnpm add` or `yarn add` respectively, keeping the `--save-dev` (or `--dev`) flag.

### Quick Start

**1.** Install the package (see above).

**2.** Create an `eslint.config.js` with the recommended config and your alias mappings:

```js
import aliasExtensions from '@dev-bb/eslint-plugin-alias-extensions'

export default [
  ...aliasExtensions.configs.recommended,
  {
    rules: {
      'alias-extensions/require-alias-extension': [
        'error',
        {
          mappings: [{ alias: '#src', target: 'src' }],
        },
      ],
    },
  },
]
```

**3.** Run ESLint with the `--fix` flag:

```bash
npx eslint . --fix
```

---

## Configuration

### Using the recommended config

The `aliasExtensions.configs.recommended` config object registers the plugin and enables the rule with `'error'` severity:

```js
import aliasExtensions from '@dev-bb/eslint-plugin-alias-extensions'

export default [
  ...aliasExtensions.configs.recommended,
]
```

> **Important:** The recommended config enables the rule but does **not** provide any `mappings`. Since `mappings` defaults to `[]`, the rule will not flag any imports until you configure at least one mapping. You **must** add a separate config object that sets the `require-alias-extension` options with your project's aliases.

A complete working setup:

```js
import aliasExtensions from '@dev-bb/eslint-plugin-alias-extensions'

export default [
  ...aliasExtensions.configs.recommended,
  {
    rules: {
      'alias-extensions/require-alias-extension': [
        'error',
        {
          mappings: [{ alias: '#src', target: 'src' }],
        },
      ],
    },
  },
]
```

### Manual configuration (without recommended)

If you prefer full control, set up the plugin and rule manually:

```js
import aliasExtensions from '@dev-bb/eslint-plugin-alias-extensions'

export default [
  {
    plugins: {
      'alias-extensions': aliasExtensions,
    },
    rules: {
      'alias-extensions/require-alias-extension': [
        'error',
        {
          projectRoot: process.cwd(),
          mappings: [
            { alias: '#src', target: 'src' },
            { alias: '#shared', target: 'shared' },
          ],
          extensions: ['.tsx', '.ts', '.jsx', '.js'],
        },
      ],
    },
  },
]
```

### Working with monorepos

In a monorepo, multiple packages often share the same alias (e.g. each package uses `#src` to point to its own `src/` directory, resolved per-package via Node.js subpath imports). Because the rule picks the **first matching mapping** for a given alias, listing multiple targets for the same alias in a single rule entry won't work — only the first one takes effect, and imports in other packages will be silently skipped.

To handle this, scope the rule to each package with ESLint's `files` glob. Each block configures its own `mappings`, so files in every package are linted against the correct target — mirroring how Node.js resolves subpath imports per `package.json`.

```js
import aliasExtensions from '@dev-bb/eslint-plugin-alias-extensions'

export default [
  ...aliasExtensions.configs.recommended,

  // Web app — its `#src` points to apps/web/src
  {
    files: ['apps/web/**'],
    rules: {
      'alias-extensions/require-alias-extension': ['error', {
        mappings: [{ alias: '#src', target: 'apps/web/src' }],
      }],
    },
  },

  // Shared UI package — its `#src` points to packages/ui/src
  {
    files: ['packages/ui/**'],
    rules: {
      'alias-extensions/require-alias-extension': ['error', {
        mappings: [{ alias: '#src', target: 'packages/ui/src' }],
      }],
    },
  },
]
```

Each package should also declare the matching `"imports"` entry in its own `package.json` (e.g. `"#src/*": "./src/*"`) so Node.js resolves `#src` the same way at runtime.

### Rule Options

| Option | Type | Default | Description |
|---|---|---|---|
| `projectRoot` | `string` | `context.cwd` | Absolute path to the project root used to resolve alias targets. |
| `mappings` | `Array<{ alias: string; target: string }>` | `[]` | Maps an import alias to a directory (relative to `projectRoot`). Each entry has an `alias` (e.g. `#src`) and a `target` (e.g. `src`). |
| `extensions` | `string[]` | `['.tsx', '.ts', '.jsx', '.js']` | File extensions to try when resolving, checked in order. Both direct file (`foo.ts`) and index file (`foo/index.ts`) resolution are attempted for each extension. |

---

## Rules

🔧 Automatically fixable by [`--fix`](https://eslint.org/docs/latest/use/command-line-interface#--fix).

| Name | Description | Recommended | 🔧 |
|---|---|---|---|
| [`require-alias-extension`](#configuration) | Require file extensions on alias imports (e.g. `#src/*`) | ✅ | 🔧 |

---

## How It Works

The `require-alias-extension` rule inspects every `ImportDeclaration`, `ExportNamedDeclaration`, `ExportAllDeclaration`, and `ImportExpression` (dynamic `import()`) node in your source files.

1. **Matching phase** — only import paths that match one of your configured aliases (e.g. `#src/*`) are checked. Relative imports (`./foo`), absolute imports (`/foo`), and bare specifiers (`lodash`) are ignored. For dynamic `import()` expressions, only **literal** sources (e.g. `import('#src/foo')`) are checked; variable or template-literal sources (e.g. `import(someVar)`, `` import(`#src/${x}`) ``) are skipped since the path cannot be determined statically.
2. **Skip phase** — if the import path already ends with one of the configured `extensions`, it is skipped (no false positive).
3. **Resolution phase** — for each configured extension (in order), the rule tries two lookups:
   - **Direct file**: `{importPath}{ext}` (e.g. `#src/lib/Loading.tsx`)
   - **Index file**: `{importPath}/index{ext}` (e.g. `#src/lib/ui/index.ts`)
4. **Reporting** — if a matching file is found, the rule reports a `missingExtension` error and, when `--fix` is used, appends the missing extension while preserving the original quote style (`'` or `"`).
5. **Silent on miss** — if no file on disk matches, the rule does **not** report an error. This avoids false positives when the import references a file that will be resolved at build time (e.g. a bundler plugin).

---

## Development

```bash
npm install          # install dependencies
npm test             # run tests (vitest)
npm run build        # build dist/ (vite)
npm run typecheck    # type-check without emitting (tsc --noEmit)
npm run lint         # build then self-lint the project
npm run lint:fast    # self-lint without rebuilding (faster)
```

---

## License

MIT — see [LICENSE](LICENSE).
