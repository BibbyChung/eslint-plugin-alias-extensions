# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.2] - 2026-06-21

### Added

- "TypeScript configuration" guide to README, documenting the required `tsconfig.json` settings (`allowImportingTsExtensions`, `moduleResolution: "bundler"`, `noEmit`) for consumers — since the rule enforces explicit `.ts`/`.tsx` extensions on alias imports, TypeScript must be configured to allow importing those extensions.

## [0.2.1] - 2026-06-21

### Added

- "Working with monorepos" guide to README, documenting how to scope the rule per-package via ESLint's `files` glob when multiple packages share the same alias (e.g. `#src`).
- Regression test documenting that duplicate aliases resolve to the first matching target.

### Changed

- Unified `author` field to `BibbyChung` for brand consistency with the GitHub organization.

### Fixed

- Stale `github.com/dev-bb` URLs (404) in the published package — 0.2.0 shipped a `dist/` built before the source URLs were updated to `BibbyChung`.

## [0.2.0] - 2026-06-20

### ⚠️ BREAKING CHANGES

- **Rule renamed:** `require-src-extension` → `require-alias-extension`. The rule has been renamed to better reflect that it works with any alias (not limited to `#src`). Update your ESLint config to use `alias-extensions/require-alias-extension` instead of `alias-extensions/require-src-extension`.
- **Public type renamed:** `RequireSrcExtensionOptions` → `RequireAliasExtensionOptions` (re-exported from the package entry point). The shape is unchanged; update the import name if you reference this type directly.

### Changed

- `peerDependencies.eslint`: `>=10.0.0` → `>=9.0.0`. The plugin is now compatible with ESLint 9+ (flat config only), lowering the barrier for projects still on ESLint 9.
- Expanded `keywords` in `package.json` to include `typescript` and `flat-config`.

### Internal

- Renamed implementation files via `git mv` (history preserved): `src/rules/require-src-extension.ts` → `src/rules/require-alias-extension.ts`, `tests/rules/require-src-extension.test.ts` → `tests/rules/require-alias-extension.test.ts`.

## [0.1.9] - 2026-06-20

### Fixed

- Pinned `@emnapi/core` and `@emnapi/runtime` to `1.10.0` via `package.json` `optionalDependencies` to resolve cross-platform `npm ci` failures on Linux/Windows CI. Without these explicit top-level entries, npm tried to resolve `@napi-rs/wasm-runtime`'s peer dependency `@emnapi/*@^1.7.1` to the registry's latest `1.11.1`, which was absent from the lock file (EUSAGE error). macOS was unaffected because the `@rolldown/binding-wasm32-wasi` chain is optional and skipped on non-wasm32 platforms.

## [0.1.8] - 2026-06-21

### Added

- `@microsoft/api-extractor` added to devDependencies. It is required by `vite-plugin-dts` v5's `bundleTypes` option (declared as an optional peer dependency, hence not auto-installed).

### Fixed

- `bundleTypes: true` now actually takes effect during build. Previously, the missing `@microsoft/api-extractor` optional peer dependency caused `unplugin-dts` to silently skip the bundling step, leaving `dist/rules/require-src-extension.d.ts` as a separate file and an unresolved `import('./rules/require-src-extension.ts')` reference in `dist/index.d.ts`. This issue was introduced in `0.1.6` and affects that release's published types.

### Removed

- `ajv` from devDependencies. Previously added as a workaround for `@rushstack/node-core-library`'s transitive dependency, it is now pulled in correctly by the explicit `@microsoft/api-extractor` installation.

## [0.1.7] - 2026-06-21

### Fixed

- Rebuilt `package-lock.json` to resolve cross-platform `npm ci` failures; missing `@emnapi/*@1.10.0` entries from the `@rolldown/binding-wasm32-wasi` optional dependency chain had caused `EUSAGE` errors on Linux/Windows CI while macOS (which skips the wasm32-wasi binding) installed successfully.

## [0.1.6] - 2026-06-20

### Added

- Subpath imports support via the `package.json` `"imports"` field (`"#src/*": "./src/*"`); internal modules are now imported through `#src/*` instead of relative paths.
- `tsconfig.json` `paths` mapping (`"#src/*": ["./src/*"]`) plus `allowImportingTsExtensions` to permit `.ts` extensions in imports (enabled by `noEmit`).
- Enabled the `alias-extensions/require-src-extension` rule in `eslint.config.mjs` with `mappings: [{ alias: "#src", target: "src" }]` so the rule now lints `#src/*` imports.
- `RequireSrcExtensionOptions` is now re-exported from `src/index.ts` as a public type; consumers can `import type { RequireSrcExtensionOptions } from '@dev-bb/eslint-plugin-alias-extensions'`.
- `"packageManager": "npm@11.6.2"` field in `package.json` to lock the package manager.
- `types: ["node"]` in `tsconfig.json` (TypeScript 6 changed `types` default to `[]`).
- `ajv` added to devDependencies (required transitively by `@rushstack/node-core-library` during `vite-plugin-dts` v5 `bundleTypes` flow).

### Changed

- `eslint.config.mjs` now imports the plugin via Node.js self-referencing (`@dev-bb/eslint-plugin-alias-extensions`) instead of the relative `./dist/index.js` path.
- Internal imports in `src/` and `tests/` switched from relative paths to `#src/*` subpath imports with explicit `.ts` extensions.
- **Toolchain upgrades:** `typescript` ^5.9 → ^6.0, `eslint` and `@eslint/js` ^9 → ^10, `vite` ^6 → ^8 (**now bundles with Rolldown by default**), `vitest` ^3 → ^4, `vite-plugin-dts` ^4 → ^5, `typescript-eslint` / `@typescript-eslint/*` ^8.0 → ^8.61.
- `engines.node`: `>=18.18.0` → `>=20.19.0` (required by ESLint 10).
- `peerDependencies.eslint`: `>=9.0.0` → `>=10.0.0`.
- `vite.config.ts`: `rollupOptions` renamed to `rolldownOptions` (Vite 8 + Rolldown).
- `vite.config.ts`: dts plugin now uses `bundleTypes: true` with `compilerOptions: { rootDir: "src" }`; all `.d.ts` are bundled into a single `dist/index.d.ts` (fixes the published-types resolution issue where `import('./rules/...ts')` could not be resolved by consumers).
- `src/rules/require-src-extension.ts`: simplified `context.sourceCode ?? context.getSourceCode()` to `context.sourceCode` (`getSourceCode()` was removed in ESLint 10).

### Removed

- Redundant `resolve.alias` configuration in `vite.config.ts` and `vitest.config.ts`; Vite 6 and Vitest 3 natively resolve the `package.json` `"imports"` field.
- Unused imports and variables in `vitest.config.ts` (`resolve`, `fileURLToPath`, `__dirname`) that only existed to support the removed alias.
- `baseUrl` from `tsconfig.json` (paths resolve relative to the tsconfig since TypeScript 4.1+).
- `rollupTypes: false` from `vite.config.ts` (`vite-plugin-dts` v5 dropped this option).
- pnpm leftovers: `node_modules/.pnpm/` directory (~120 MB of stale packages) and `node_modules/.pnpm-workspace-state-v1.json` (the project has migrated from pnpm to npm).

## [0.1.5] - 2026-06-20

### Fixed

- Version number synchronization during release: integrated the release workflow into npm scripts (`release:patch`, `release:minor`, `release:major`) to keep `package.json`, `package-lock.json`, and `CHANGELOG.md` version numbers in sync within a single release commit.

## [0.1.4] - 2026-06-20

- Added `pubv` to publish tools

## [0.1.3] - 2026-06-20

### Added

- `CHANGELOG.md` following the [Keep a Changelog](https://keepachangelog.com/) format.
- `CONTRIBUTING.md` with development setup, code style guide, and contribution workflow.

### Changed

- Added `"sideEffects": false` to `package.json` to enable safe tree-shaking for consumers.
- Adopted [`pubv`](https://github.com/runwisp/pubv) for automated CHANGELOG version bumping and release tagging.

### Fixed

- Alias prefix collision: when multiple aliases share a common prefix (e.g. `#src` and `#src/components`), the longest alias now matches first to prevent incorrect path resolution.

## [0.1.1] - 2026-06-20

### Added

- Support for dynamic `import()` expressions (`ImportExpression`) with literal sources, e.g. `import('#src/foo')`. Non-literal sources (template literals, variables) are skipped.
- Support for `import type` and `export type` statements when using `@typescript-eslint/parser`.
- Build-time version injection via `__PKG_VERSION__` define in Vite config — the plugin version is now read from `package.json` at build time instead of being hardcoded.
- Package metadata: `author`, `repository`, `bugs`, `homepage` fields in `package.json`.
- Expanded `keywords`: `import`, `extension`, `alias`, `file-extension`, `subpath`.
- `meta.docs.url` on the `require-src-extension` rule pointing to the README configuration section.
- GitHub Actions release workflow (`.github/workflows/release.yml`).
- Comprehensive README covering installation, configuration, rule options, rule details, and development guide.
- `engines.node` field (`>=18.18.0`) in `package.json`.
- `vitest.config.ts` with `__PKG_VERSION__` define for the test environment.
- `@typescript-eslint/parser` as a dev dependency for testing TypeScript-specific syntax.

### Changed

- Core rule logic refactored: extracted shared `checkImportPath()` function, introduced `checkDynamicImport()` handler.
- Removed `pnpm-lock.yaml` from version control (only `package-lock.json` is kept).

### Fixed

- Upgraded `actions/checkout` and `actions/setup-node` from `@v4` to `@v5` to resolve the Node.js 20 deprecation warning on GitHub Actions runners.

## [0.1.0] - 2026-06-20

### Added

- Initial ESLint plugin boilerplate with TypeScript, Vite, and Vitest.
- `require-src-extension` rule: enforces file extensions on alias imports (e.g. `#src/*`).
- Support for `ImportDeclaration`, `ExportNamedDeclaration`, and `ExportAllDeclaration` AST nodes.
- Auto-fix support (`--fix`): appends the missing file extension while preserving the original quote style.
- Directory index resolution: if `#src/lib/ui` resolves to `#src/lib/ui/index.ts`, the rule suggests the index file as the fix.
- Configurable `projectRoot` option (defaults to `context.cwd`).
- Configurable `mappings` option for defining alias-to-directory mappings.
- Configurable `extensions` option for defining which file extensions to check (defaults to `.tsx`, `.ts`, `.jsx`, `.js`).
- Recommended flat config (`aliasExtensions.configs.recommended`) that registers the plugin and enables the rule with `error` severity.

[Unreleased]: https://github.com/BibbyChung/eslint-plugin-alias-extensions/compare/v0.2.2...main
[0.2.2]: https://github.com/BibbyChung/eslint-plugin-alias-extensions/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/BibbyChung/eslint-plugin-alias-extensions/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/BibbyChung/eslint-plugin-alias-extensions/compare/v0.1.9...v0.2.0
[0.1.9]: https://github.com/BibbyChung/eslint-plugin-alias-extensions/compare/v0.1.8...v0.1.9
[0.1.8]: https://github.com/BibbyChung/eslint-plugin-alias-extensions/compare/v0.1.7...v0.1.8
[0.1.7]: https://github.com/BibbyChung/eslint-plugin-alias-extensions/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/BibbyChung/eslint-plugin-alias-extensions/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/BibbyChung/eslint-plugin-alias-extensions/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/BibbyChung/eslint-plugin-alias-extensions/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/BibbyChung/eslint-plugin-alias-extensions/compare/v0.1.1...v0.1.3
[0.1.1]: https://github.com/BibbyChung/eslint-plugin-alias-extensions/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/BibbyChung/eslint-plugin-alias-extensions/releases/tag/v0.1.0
