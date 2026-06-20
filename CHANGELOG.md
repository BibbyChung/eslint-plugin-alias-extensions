# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/BibbyChung/eslint-plugin-alias-extensions/compare/v0.1.4...main
[0.1.4]: https://github.com/BibbyChung/eslint-plugin-alias-extensions/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/BibbyChung/eslint-plugin-alias-extensions/compare/v0.1.1...v0.1.3
[0.1.1]: https://github.com/dev-bb/eslint-plugin-alias-extensions/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/dev-bb/eslint-plugin-alias-extensions/releases/tag/v0.1.0
