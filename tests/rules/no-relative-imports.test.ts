import { TSESLint } from '@typescript-eslint/utils'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { afterAll } from 'vitest'
import * as tsParser from '@typescript-eslint/parser'
import rule from '#src/rules/no-relative-imports.ts'
import { clearAliasCache } from '#src/utils/alias.ts'

// ── Fixture setup ──────────────────────────────────────────────────────────

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'no-rel-import-test-'))

const mkdir = (p: string) =>
  fs.mkdirSync(path.join(tmpDir, p), { recursive: true })
const touch = (p: string) => {
  mkdir(path.dirname(p))
  fs.writeFileSync(path.join(tmpDir, p), '')
}

// Fixture files that are referenced as `filename` in test cases
touch('src/components/Button.tsx')
touch('src/lib/utils.ts')

// For cross-level test (../../lib/auth.server)
touch('src/app/deep/file.ts')

// For tsconfig-only auto-detection test
touch('tsconfig-only/src/helpers.ts')

// Write package.json with imports for auto-detection tests
fs.writeFileSync(
  path.join(tmpDir, 'package.json'),
  JSON.stringify({
    name: 'test-fixture',
    imports: {
      '#src/*': './src/*',
    },
  }),
)

// Write tsconfig.json with paths for auto-detection tests
fs.writeFileSync(
  path.join(tmpDir, 'tsconfig.json'),
  JSON.stringify({
    compilerOptions: {
      baseUrl: '.',
      paths: {
        '@/*': ['./src/*'],
      },
    },
  }),
)

// Write a separate tsconfig.json in a subdirectory with NO package.json
mkdir('tsconfig-only')
fs.writeFileSync(
  path.join(tmpDir, 'tsconfig-only/tsconfig.json'),
  JSON.stringify({
    compilerOptions: {
      baseUrl: '.',
      paths: {
        '@/*': ['./src/*'],
      },
    },
  }),
)

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

// ── RuleTester setup ───────────────────────────────────────────────────────

const ruleTester = new TSESLint.RuleTester(
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  } as unknown as ConstructorParameters<typeof TSESLint.RuleTester>[0],
)

// Clear cache between runs to avoid stale data across test files
afterAll(() => {
  clearAliasCache()
})

ruleTester.run('no-relative-imports', rule, {
  valid: [
    // ── Already an alias import ──
    {
      code: "import x from '#src/lib/utils.ts'",
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
    },

    // ── Bare module import ──
    "import React from 'react'",

    // ── allowSameFolder: true – sibling in same folder ──
    {
      code: "import { other } from './other'",
      filename: path.join(tmpDir, 'src/components/Button.tsx'),
      options: [
        {
          projectRoot: tmpDir,
          mappings: [{ alias: '#src', target: 'src' }],
          allowSameFolder: true,
        },
      ],
    },

    // ── Dynamic import already alias ──
    {
      code: "import('#src/foo.ts')",
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
    },

    // ── Export without source ──
    'export const foo = 1',

    // ── Non-relative import (bare specifier) ──
    "import lodash from 'lodash'",

    // ── allowSameFolder: true with `../` that goes above fixture root → still
    //     resolved but outside alias → reported (no special treatment).
    //     This is actually invalid semantically but valid in terms of not crashing.
    //     Instead test a cross-folder case that doesn't match: allowSameFolder
    //     only applies to same-dir, NOT to `../` which will still be reported.
    //     For a truly valid allowSameFolder test, only `./` matters.

    // ── Virtual file (e.g., Astro .astro?astro) should be ignored ──
    {
      code: "import x from './foo'",
      filename: path.join(tmpDir, 'src/pages/index.astro?astro'),
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
    },
  ],

  invalid: [
    // ── 1. ImportDeclaration: relative same-directory ──
    {
      code: "import { Menu, Item } from './Menu'",
      filename: path.join(tmpDir, 'src/components/Button.tsx'),
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
      errors: [
        {
          messageId: 'preferAlias' as const,
          data: { source: './Menu', resolved: '#src/components/Menu' },
        },
      ],
      output: "import { Menu, Item } from '#src/components/Menu'",
    },

    // ── 2. ImportDeclaration: cross-directory ──
    {
      code: "import { auth } from '../../lib/auth.server'",
      filename: path.join(tmpDir, 'src/app/deep/file.ts'),
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
      errors: [
        {
          messageId: 'preferAlias' as const,
          data: {
            source: '../../lib/auth.server',
            resolved: '#src/lib/auth.server',
          },
        },
      ],
      output: "import { auth } from '#src/lib/auth.server'",
    },

    // ── 3. ExportNamedDeclaration ──
    {
      code: "export { x } from './foo'",
      filename: path.join(tmpDir, 'src/components/Button.tsx'),
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
      errors: [
        {
          messageId: 'preferAlias' as const,
          data: { source: './foo', resolved: '#src/components/foo' },
        },
      ],
      output: "export { x } from '#src/components/foo'",
    },

    // ── 4. ExportAllDeclaration ──
    {
      code: "export * from './foo'",
      filename: path.join(tmpDir, 'src/components/Button.tsx'),
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
      errors: [
        {
          messageId: 'preferAlias' as const,
          data: { source: './foo', resolved: '#src/components/foo' },
        },
      ],
      output: "export * from '#src/components/foo'",
    },

    // ── 5. Dynamic import ──
    // ImportExpression node type needs filename to resolve relative path
    {
      code: "import('./foo')",
      filename: path.join(tmpDir, 'src/components/Button.tsx'),
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
      errors: [
        {
          messageId: 'preferAlias' as const,
          data: { source: './foo', resolved: '#src/components/foo' },
        },
      ],
      output: "import('#src/components/foo')",
    },

    // ── 6. Unresolvable relative import (no matching alias target) ──
    // `../../outside/foo` resolves outside any alias target → no fix
    {
      code: "import { x } from '../../outside/foo'",
      filename: path.join(tmpDir, 'src/components/Button.tsx'),
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
      errors: [
        {
          messageId: 'unresolvable' as const,
          data: { source: '../../outside/foo' },
        },
      ],
      // No `output` → autofix is NOT provided for unresolvable
    },

    // ── 7. allowSameFolder: false (default) – same-dir relative IS an error ──
    {
      code: "import { sibling } from './sibling'",
      filename: path.join(tmpDir, 'src/components/Button.tsx'),
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
        // allowSameFolder defaults to false
      ],
      errors: [
        {
          messageId: 'preferAlias' as const,
          data: { source: './sibling', resolved: '#src/components/sibling' },
        },
      ],
      output: "import { sibling } from '#src/components/sibling'",
    },

    // ── 8. Quote style preservation: double-quote ──
    {
      code: 'import { x } from "./foo"',
      filename: path.join(tmpDir, 'src/components/Button.tsx'),
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
      errors: [
        {
          messageId: 'preferAlias' as const,
          data: { source: './foo', resolved: '#src/components/foo' },
        },
      ],
      output: 'import { x } from "#src/components/foo"',
    },
  ],
})

// ── TypeScript parser tests (export type, import type) ──

const tsRuleTester = new TSESLint.RuleTester(
  {
    languageOptions: {
      parser: tsParser as never,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  } as unknown as ConstructorParameters<typeof TSESLint.RuleTester>[0],
)

tsRuleTester.run('no-relative-imports (TS)', rule, {
  valid: [
    // Alias import with TS parser (no error)
    {
      code: "import type { Foo } from '#src/lib/utils.ts'",
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
    },
  ],
  invalid: [
    // export type with relative import → should be converted
    {
      code: "export type { Foo } from './foo-type'",
      filename: path.join(tmpDir, 'src/components/Button.tsx'),
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
      errors: [
        {
          messageId: 'preferAlias' as const,
          data: {
            source: './foo-type',
            resolved: '#src/components/foo-type',
          },
        },
      ],
      output: "export type { Foo } from '#src/components/foo-type'",
    },
  ],
})

// ── Auto-detection from package.json `imports` ──
// Clear cache to avoid pollution from earlier tests that used explicit mappings
clearAliasCache()

tsRuleTester.run('no-relative-imports (auto-detect: package.json imports)', rule, {
  valid: [
    // Already alias import
    {
      code: "import x from '#src/lib/utils.ts'",
      filename: path.join(tmpDir, 'src/components/Button.tsx'),
      options: [{ projectRoot: tmpDir }],
    },
  ],
  invalid: [
    // Should auto-detect #src mapping from package.json
    {
      code: "import { x } from './foo'",
      filename: path.join(tmpDir, 'src/components/Button.tsx'),
      options: [{ projectRoot: tmpDir }],
      errors: [
        {
          messageId: 'preferAlias' as const,
          data: { source: './foo', resolved: '#src/components/foo' },
        },
      ],
      output: "import { x } from '#src/components/foo'",
    },
  ],
})

// ── Auto-detection from tsconfig.json `paths` (no package.json imports) ──
// Clear cache so this test uses a fresh parse of the tsconfig-only fixture
clearAliasCache()

tsRuleTester.run(
  'no-relative-imports (auto-detect: tsconfig paths)',
  rule,
  {
    valid: [],
    invalid: [
      {
        code: "import { x } from './helpers'",
        filename: path.join(tmpDir, 'tsconfig-only/src/helpers.ts'),
        // This projectRoot has a tsconfig.json but no package.json imports
        // tsconfig has @/* → ./src/*, so ./helpers should resolve to @/helpers
        options: [{ projectRoot: path.join(tmpDir, 'tsconfig-only') }],
        errors: [
          {
            messageId: 'preferAlias' as const,
            data: { source: './helpers', resolved: '@/helpers' },
          },
        ],
        output: "import { x } from '@/helpers'",
      },
    ],
  },
)
