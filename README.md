# @dev-bb/eslint-plugin-alias-extensions

[![npm version](https://img.shields.io/npm/v/@dev-bb/eslint-plugin-alias-extensions?style=flat-square)](https://www.npmjs.com/package/@dev-bb/eslint-plugin-alias-extensions)
[![license](https://img.shields.io/npm/l/@dev-bb/eslint-plugin-alias-extensions?style=flat-square)](LICENSE)

> Normalize imports in your project — convert relative imports to aliases and enforce file extensions on alias paths, automatically.

This ESLint plugin provides two rules that form a complete import standardization pipeline:

- **[`no-relative-imports`](#rule-no-relative-imports)** — detects relative imports (`./`, `../`) and autofixes them to the resolved alias path by reading your `package.json` `imports` and `tsconfig.json` `paths`.
- **[`require-alias-extension`](#rule-require-alias-extension)** — ensures every alias import, export, or re-export includes the correct file extension, with support for **directory index resolution** (e.g. `#src/lib/ui` → `#src/lib/ui/index.ts`).

Together, they let you standardize every import in your project:

```js
// ❌ Before
import { Menu } from './Menu'
import Loading from '#src/lib/ui/Loading'
import { utils } from '#src/lib/ui'

// ✅ After (auto-fixed)
import { Menu } from '#src/features/sidebar/Menu.tsx'
import Loading from '#src/lib/ui/Loading.tsx'
import { utils } from '#src/lib/ui/index.ts'
```

*This combined result runs both rules. `no-relative-imports` is opt-in — see [Quick Start](#quick-start) to enable the full pipeline.*

The [`configs.recommended`](#using-the-recommended-config) preset enables `require-alias-extension` with `'error'` severity by default. [`no-relative-imports`](#rule-no-relative-imports) is **opt-in** — it is not included in the recommended config because it actively rewrites relative imports into aliases, which may be disruptive on existing projects. Enable it explicitly when you are ready to adopt full alias-based imports.

Both rules handle `ImportDeclaration`, `ExportNamedDeclaration`, `ExportAllDeclaration`, and dynamic `import()` expressions (`ImportExpression`), so static imports, re-exports, and dynamic imports are all covered.

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

**2.** Create an `eslint.config.js` with the recommended config, your alias mappings, and the `no-relative-imports` rule. The recommended config enables `require-alias-extension` with `'error'` severity. [`no-relative-imports`](#rule-no-relative-imports) is **opt-in** — enable it alongside the recommended config to achieve the full standardization pipeline:

```js
import aliasExtensions from '@dev-bb/eslint-plugin-alias-extensions'

export default [
  ...aliasExtensions.configs.recommended,
  {
    rules: {
      // Convert relative imports (./ ../) to alias paths — opt-in
      'alias-extensions/no-relative-imports': 'error',
      // Enforce file extensions on alias imports
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

> `require-alias-extension` needs explicit `mappings` because it must know which aliases to check. `no-relative-imports` automatically reads alias mappings from `package.json` `imports` and `tsconfig.json` `paths`, so it typically requires no additional options beyond enabling the rule.

**3.** Run ESLint with the `--fix` flag:

```bash
npx eslint . --fix
```

> For details on the opt-in rule, see [Opting into `no-relative-imports`](#opting-into-no-relative-imports).

---

## Configuration

### TypeScript configuration

Because the `require-alias-extension` rule enforces explicit file extensions (`.ts`, `.tsx`, …) on alias imports, TypeScript must be configured to allow importing those extensions — otherwise `tsc` will reject paths like `#src/lib/ui/index.ts` with error `TS5097`.

Add the following to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}
```

> `allowImportingTsExtensions` requires `moduleResolution` to be `bundler` (or `node16`/`nodenext`) and either `noEmit` or `emitDeclarationOnly` to be set, because TypeScript cannot rewrite `.ts` extensions into `.js` in the emitted output. If you still need `tsc` to emit JavaScript, keep `noEmit` false and set `emitDeclarationOnly: true` instead, then compile your JS with a separate build tool (e.g. Vite, esbuild, swc).

### Using the recommended config

The `aliasExtensions.configs.recommended` config object registers the plugin and enables `require-alias-extension` with `'error'` severity. [`no-relative-imports`](#rule-no-relative-imports) is not included by default — it is **opt-in** because it actively rewrites relative imports, which can be disruptive on existing projects.

```js
import aliasExtensions from '@dev-bb/eslint-plugin-alias-extensions'

export default [
  ...aliasExtensions.configs.recommended,
]
```

> **Important:** The recommended config enables `require-alias-extension` but does **not** provide any `mappings`. Since `mappings` defaults to `[]`, the rule will not flag any imports until you configure at least one mapping. You **must** add a separate config object that sets the `require-alias-extension` options with your project's aliases.

A complete setup for `require-alias-extension`:

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

#### Opting into `no-relative-imports`

If you want to convert all relative imports to aliases as well, enable the rule explicitly alongside the recommended config:

```js
import aliasExtensions from '@dev-bb/eslint-plugin-alias-extensions'

export default [
  ...aliasExtensions.configs.recommended,
  {
    rules: {
      'alias-extensions/no-relative-imports': 'error',
    },
  },
]
```

The rule automatically reads alias mappings from `package.json` `imports` and `tsconfig.json` `paths`, so it typically works without any additional options.

### Rule: require-alias-extension

This rule ensures that every alias import (e.g. `#src/*`) includes a file extension. It resolves the import path against your configured aliases, checks whether a file exists on disk, and reports when a matching file lacks an extension — with autofix support.

#### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `projectRoot` | `string` | `context.cwd` | Absolute path to the project root used to resolve alias targets. |
| `mappings` | `Array<{ alias: string; target: string }>` | `[]` | Maps an import alias to a directory (relative to `projectRoot`). Each entry has an `alias` (e.g. `#src`) and a `target` (e.g. `src`). |
| `extensions` | `string[]` | `['.tsx', '.ts', '.jsx', '.js']` | File extensions to try when resolving, checked in order. Both direct file (`foo.ts`) and index file (`foo/index.ts`) resolution are attempted for each extension. |

#### Manual configuration

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

### Rule: no-relative-imports

This rule detects relative imports (`./`, `../`) and autofixes them to the resolved alias path. It automatically reads alias mappings from `package.json` `imports` and `tsconfig.json` `paths`, with three levels of priority: explicit `mappings` option > `package.json` `imports` > `tsconfig.json` `paths`. Together with [`require-alias-extension`](#rule-require-alias-extension), they form a complete import standardization pipeline.

This rule replaces the unmaintained [`eslint-plugin-no-relative-import-paths`](https://www.npmjs.com/package/eslint-plugin-no-relative-import-paths), which is broken on ESLint 9+.

```js
// ❌ Before
import { Menu } from './Menu'
import { auth } from '../../lib/auth.server'
import type { Theme } from '../../../types'

// ✅ After (auto-fixed)
import { Menu } from '#src/features/sidebar/Menu'
import { auth } from '#src/lib/auth.server'
import type { Theme } from '#src/types'
```

The rule also covers `export ... from './...'` and dynamic `import('./...')`.

#### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `allowSameFolder` | `boolean` | `false` | Allow `./` imports that resolve to a file in the same directory as the importing file. |
| `mappings` | `Array<{ alias: string; target: string }>` | `[]` | Explicit alias mappings, merged on top of the auto-detected ones (highest priority). `target` is a path relative to `projectRoot`. |
| `projectRoot` | `string` | `context.cwd` | Root directory for resolving `package.json` and `tsconfig.json`. |

> If a relative import cannot be resolved to any alias, the rule reports an error without providing an autofix: `Cannot resolve alias for relative import '...'`.

#### Manual configuration

Enable the rule explicitly — it is not included in `configs.recommended` by default. Because `no-relative-imports` automatically reads alias mappings from `package.json` `imports` and `tsconfig.json` `paths`, you typically do not need any additional options beyond enabling the rule:

```js
import aliasExtensions from '@dev-bb/eslint-plugin-alias-extensions'

export default [
  ...aliasExtensions.configs.recommended,
  {
    rules: {
      'alias-extensions/no-relative-imports': 'error',
    },
  },
]
```

To customize behavior — for example, to allow same-folder relative imports or to add explicit alias mappings — pass the rule options in a separate config block:

```js
import aliasExtensions from '@dev-bb/eslint-plugin-alias-extensions'

export default [
  ...aliasExtensions.configs.recommended,
  {
    rules: {
      'alias-extensions/no-relative-imports': ['error', {
        allowSameFolder: true,
        mappings: [{ alias: '#shared', target: 'shared' }],
      }],
    },
  },
]
```

Explicit `mappings` are merged on top of the auto-detected ones and take the highest priority — they will override any automatically discovered alias with the same name.

### Working with monorepos

In a monorepo, each sub-package typically has its own alias configuration — for example, every package maps `#src` to its own `src/` directory via Node.js subpath imports (`"#src/*": "./src/*"` in `package.json`). Because ESLint applies rule configurations project-wide by default, a single set of rule options will incorrectly resolve aliases for packages that share the same alias name but point to different directories.

To handle this, scope both rules per package using ESLint's `files` glob. Each package gets its own config block with the correct aliases for that package. The two rules differ in how they discover aliases:

- **`require-alias-extension`** needs explicit `mappings` with a `target` for each package, since it must know which directory to check for file extensions.
- **`no-relative-imports`** only needs a `projectRoot` pointing to the sub-package directory — it automatically discovers aliases from that package's `package.json` `imports` (or `tsconfig.json` `paths`), making it more concise.

The following example configures both rules for two monorepo packages, `apps/web` and `packages/ui`:

```js
import aliasExtensions from '@dev-bb/eslint-plugin-alias-extensions'

export default [
  ...aliasExtensions.configs.recommended,

  // Web app
  {
    files: ['apps/web/**'],
    rules: {
      'alias-extensions/require-alias-extension': ['error', {
        mappings: [{ alias: '#src', target: 'apps/web/src' }],
      }],
      'alias-extensions/no-relative-imports': ['error', {
        projectRoot: 'apps/web',
      }],
    },
  },

  // Shared UI package
  {
    files: ['packages/ui/**'],
    rules: {
      'alias-extensions/require-alias-extension': ['error', {
        mappings: [{ alias: '#src', target: 'packages/ui/src' }],
      }],
      'alias-extensions/no-relative-imports': ['error', {
        projectRoot: 'packages/ui',
      }],
    },
  },
]
```

Each sub-package should declare the corresponding `"imports"` entry in its own `package.json` (e.g. `"#src/*": "./src/*"`), so that the alias resolves consistently both at runtime (Node.js subpath imports) and for these rules.

---

## Rules

🔧 Automatically fixable by [`--fix`](https://eslint.org/docs/latest/use/command-line-interface#--fix).

| Name | Description | Recommended | 🔧 |
|---|---|---|---|
| [`require-alias-extension`](#rule-require-alias-extension) | Require file extensions on alias imports (e.g. `#src/*`) | ✅ | 🔧 |
| [`no-relative-imports`](#rule-no-relative-imports) | Disallow relative imports (`./`, `..`) and autofix to the resolved alias path | — | 🔧 |

---

## How It Works

When both rules are enabled, they form a complete import standardization pipeline:

```
relative import (./, ../)  ──►  no-relative-imports  ──►  alias import  ──►  require-alias-extension  ──►  alias import with extension
```

### require-alias-extension

The `require-alias-extension` rule inspects every `ImportDeclaration`, `ExportNamedDeclaration`, `ExportAllDeclaration`, and `ImportExpression` (dynamic `import()`) node in your source files.

1. **Matching phase** — only import paths that match one of your configured aliases (e.g. `#src/*`) are checked. Relative imports (`./foo`), absolute imports (`/foo`), and bare specifiers (`lodash`) are ignored. For dynamic `import()` expressions, only **literal** sources (e.g. `import('#src/foo')`) are checked; variable or template-literal sources (e.g. `import(someVar)`, `` import(`#src/${x}`) ``) are skipped since the path cannot be determined statically.
2. **Skip phase** — if the import path already ends with one of the configured `extensions`, it is skipped (no false positive).
3. **Resolution phase** — for each configured extension (in order), the rule tries two lookups:
   - **Direct file**: `{importPath}{ext}` (e.g. `#src/lib/Loading.tsx`)
   - **Index file**: `{importPath}/index{ext}` (e.g. `#src/lib/ui/index.ts`)
4. **Reporting** — if a matching file is found, the rule reports a `missingExtension` error and, when `--fix` is used, appends the missing extension while preserving the original quote style (`'` or `"`).
5. **Silent on miss** — if no file on disk matches, the rule does **not** report an error. This avoids false positives when the import references a file that will be resolved at build time (e.g. a bundler plugin).

### no-relative-imports

The `no-relative-imports` rule inspects every `ImportDeclaration`, `ExportNamedDeclaration`, `ExportAllDeclaration`, and `ImportExpression` (dynamic `import()`) node in your source files.

1. **Detection phase** — only import sources that start with `./` or `../` are checked. Absolute paths (`/foo`), bare specifiers (`lodash`), and alias paths (`#src/foo`) are ignored. For dynamic `import()` expressions, only **literal** sources (e.g. `import('./foo')`) are checked; variable or template-literal sources are skipped since the path cannot be determined statically.

2. **Alias resolution** — the rule automatically loads alias mappings from your project configuration, with three levels of priority:
   - **Explicit `mappings` option** (highest priority) — manually specified aliases override any auto-detected ones with the same name.
   - **`package.json` `imports`** — entries ending with `/*` (e.g. `"#src/*": "./src/*"`) are parsed into alias mappings.
   - **`tsconfig.json` `paths`** — entries ending with `/*` (e.g. `"#src/*": ["src/*"]`) are parsed, only if not already defined by `package.json`.

   Mappings are sorted by `target` length descending so the longest (most specific) prefix is matched first.

3. **`allowSameFolder`** — if enabled, `./` imports that resolve to a file in the same directory as the importing file are allowed and not flagged.

4. **Reporting & fix** — when a matching alias is found, the rule reports a `preferAlias` error and, when `--fix` is used, replaces the relative path with the alias path. The original file extension is preserved exactly as-is — no extensions are added or removed by this rule.

5. **Unresolvable** — if no matching alias can be found for the relative import, the rule reports an `unresolvable` error without providing an autofix: `Cannot resolve alias for relative import '...'`.

6. **Virtual files** — files whose path contains `?` (e.g. Astro's virtual modules) are silently skipped, as their relative imports cannot be meaningfully resolved against disk-based aliases.

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
