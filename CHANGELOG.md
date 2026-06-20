# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Subpath imports support via the `package.json` `"imports"` field (`"#src/*": "./src/*"`); internal modules are now imported through `#src/*` instead of relative paths.
- `tsconfig.json` `paths` mapping (`"#src/*": ["./src/*"]`) plus `allowImportingTsExtensions` to permit `.ts` extensions in imports (enabled by `noEmit`).
- Enabled the `alias-extensions/require-src-extension` rule in `eslint.config.mjs` with `mappings: [{ alias: "#src", target: "src" }]` so the rule now lints `#src/*` imports.

### Changed

- `eslint.config.mjs` now imports the plugin via Node.js self-referencing (`@dev-bb/eslint-plugin-alias-extensions`) instead of the relative `./dist/index.js` path.
- Internal imports in `src/` and `tests/` switched from relative paths to `#src/*` subpath imports with explicit `.ts` extensions.

### Removed

- Redundant `resolve.alias` configuration in `vite.config.ts` and `vitest.config.ts`; Vite 6 and Vitest 3 natively resolve the `package.json` `"imports"` field.
- Unused imports and variables in `vitest.config.ts` (`resolve`, `fileURLToPath`, `__dirname`) that only existed to support the removed alias.
- `baseUrl` from `tsconfig.json` (paths resolve relative to the tsconfig since TypeScript 4.1+).

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

[Unreleased]: https://github.com/BibbyChung/eslint-plugin-alias-extensions/compare/v0.1.5...main
[0.1.5]: https://github.com/BibbyChung/eslint-plugin-alias-extensions/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/BibbyChung/eslint-plugin-alias-extensions/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/BibbyChung/eslint-plugin-alias-extensions/compare/v0.1.1...v0.1.3
[0.1.1]: https://github.com/dev-bb/eslint-plugin-alias-extensions/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/dev-bb/eslint-plugin-alias-extensions/releases/tag/v0.1.0
