import { TSESLint } from '@typescript-eslint/utils'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { afterAll } from 'vitest'
import * as tsParser from '@typescript-eslint/parser'
import rule from '#src/rules/require-alias-extension.ts'

// Create tmpDir synchronously at module level so it's available
// when the ruleTester.run() options objects are created.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'alias-ext-test-'))

const mkdir = (p: string) =>
  fs.mkdirSync(path.join(tmpDir, p), { recursive: true })
const touch = (p: string) => {
  mkdir(path.dirname(p))
  fs.writeFileSync(path.join(tmpDir, p), '')
}

touch('src/lib/ui/Loading.tsx')
touch('src/lib/ui/index.ts')
touch('src/lib/utils.ts')
touch('src/components/Button.tsx')
touch('shared/helpers.ts')
// Separate fixture dir to test the relPath === '' branch (alias exactly equals import path)
touch('src2/index.ts')

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

const ruleTester = new TSESLint.RuleTester(
  { languageOptions: { ecmaVersion: 'latest', sourceType: 'module' } } as unknown as ConstructorParameters<typeof TSESLint.RuleTester>[0],
)

ruleTester.run('require-alias-extension', rule, {
  valid: [
    // 1. Non-alias relative/bare imports → ignored
    "import x from './foo'",
    "import x from 'react'",

    // 2. Alias import that already has an extension → skipped
    {
      code: "import x from '#src/lib/utils.ts'",
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
    },

    // 3. Alias import whose target file does not exist → not reported
    {
      code: "import x from '#src/lib/nonexistent'",
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
    },

    // 4. No mappings configured → everything ignored
    {
      code: "import x from '#src/lib/utils'",
      options: [{ projectRoot: tmpDir }],
    },

    // 5. Export without source → ignored
    'export const foo = 1',

    // 6. Custom extensions: only .tsx accepted, but the file is .ts → not reported
    {
      code: "import { foo } from '#src/lib/utils'",
      options: [
        {
          projectRoot: tmpDir,
          mappings: [{ alias: '#src', target: 'src' }],
          extensions: ['.tsx'],
        },
      ],
    },

    // ── Dynamic import() tests ──

    // 7. Dynamic import: alias import already has an extension → skipped
    {
      code: "import('#src/lib/utils.ts')",
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
    },

    // 8. Dynamic import: template literal source → skipped (only Literal sources are checked)
    {
      code: "import(`#src/lib/utils`)",
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
    },

    // 9. Regression guard: #src-v2 prefix should NOT be matched by #src (trailing slash protection)
    {
      code: "import x from '#src-v2/foo'",
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
    },
  ],

  invalid: [
    // 1. ImportDeclaration: direct file hit, .tsx
    {
      code: "import Loading from '#src/lib/ui/Loading'",
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
      errors: [
        {
          messageId: 'missingExtension' as const,
          data: { ext: '.tsx', importPath: '#src/lib/ui/Loading' },
        },
      ],
      output: "import Loading from '#src/lib/ui/Loading.tsx'",
    },

    // 2. Directory import: resolves to index.ts → fixed to /index.ts
    {
      code: "import ui from '#src/lib/ui'",
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
      errors: [
        {
          messageId: 'missingExtension' as const,
          data: { ext: '/index.ts', importPath: '#src/lib/ui' },
        },
      ],
      output: "import ui from '#src/lib/ui/index.ts'",
    },

    // 3. relPath === '' branch: alias exactly equals import path, resolves to index.ts
    {
      code: "import x from '#src2'",
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src2', target: 'src2' }] },
      ],
      errors: [
        {
          messageId: 'missingExtension' as const,
          data: { ext: '/index.ts', importPath: '#src2' },
        },
      ],
      output: "import x from '#src2/index.ts'",
    },

    // 5. ImportDeclaration: direct file hit, .ts
    {
      code: "import { foo } from '#src/lib/utils'",
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
      errors: [
        {
          messageId: 'missingExtension' as const,
          data: { ext: '.ts', importPath: '#src/lib/utils' },
        },
      ],
      output: "import { foo } from '#src/lib/utils.ts'",
    },

    // 6a. Single-quote preserved
    {
      code: "import x from '#src/lib/utils'",
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
      errors: [
        {
          messageId: 'missingExtension' as const,
          data: { ext: '.ts', importPath: '#src/lib/utils' },
        },
      ],
      output: "import x from '#src/lib/utils.ts'",
    },

    // 6b. Double-quote preserved
    {
      code: 'import x from "#src/lib/utils"',
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
      errors: [
        {
          messageId: 'missingExtension' as const,
          data: { ext: '.ts', importPath: '#src/lib/utils' },
        },
      ],
      output: 'import x from "#src/lib/utils.ts"',
    },

    // 7. ExportAllDeclaration
    {
      code: "export * from '#src/lib/utils'",
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
      errors: [
        {
          messageId: 'missingExtension' as const,
          data: { ext: '.ts', importPath: '#src/lib/utils' },
        },
      ],
      output: "export * from '#src/lib/utils.ts'",
    },

    // 8. ExportNamedDeclaration
    {
      code: "export { foo } from '#src/lib/utils'",
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
      errors: [
        {
          messageId: 'missingExtension' as const,
          data: { ext: '.ts', importPath: '#src/lib/utils' },
        },
      ],
      output: "export { foo } from '#src/lib/utils.ts'",
    },

    // 9. Hazard #1 fix: every invalid case above passes options.projectRoot pointing to the fixture dir,
    //    which already covers this verification.

    // 10. Multiple mappings
    {
      code: "import helpers from '#shared/helpers'",
      options: [
        {
          projectRoot: tmpDir,
          mappings: [
            { alias: '#src', target: 'src' },
            { alias: '#shared', target: 'shared' },
          ],
        },
      ],
      errors: [
        {
          messageId: 'missingExtension' as const,
          data: { ext: '.ts', importPath: '#shared/helpers' },
        },
      ],
      output: "import helpers from '#shared/helpers.ts'",
    },

    // ── Dynamic import() tests ──

    // 11. Dynamic import: missing extension, resolves to .ts → fixed
    {
      code: "import('#src/lib/utils')",
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
      errors: [
        {
          messageId: 'missingExtension' as const,
          data: { ext: '.ts', importPath: '#src/lib/utils' },
        },
      ],
      output: "import('#src/lib/utils.ts')",
    },

    // ── Alias conflict resolution (longest prefix wins) tests ──

    // 12. Long alias should take precedence over shorter alias when both match the import path
    //     #src/ui (target=src/lib/ui) is more specific than #src (target=src).
    //     Without the fix, #src matches first and resolves to src/ui/Loading which doesn't exist → no error (wrong).
    //     With the fix, #src/ui matches first and resolves to src/lib/ui/Loading which exists → error (correct).
    {
      code: "import Loading from '#src/ui/Loading'",
      options: [
        {
          projectRoot: tmpDir,
          mappings: [
            { alias: '#src', target: 'src' },
            { alias: '#src/ui', target: 'src/lib/ui' },
          ],
        },
      ],
      errors: [
        {
          messageId: 'missingExtension' as const,
          data: { ext: '.tsx', importPath: '#src/ui/Loading' },
        },
      ],
      output: "import Loading from '#src/ui/Loading.tsx'",
    },

    // 13. Short alias still matches non-conflicting paths
    //     #src/lib/utils does NOT start with #src/ui/, so it falls through to #src → resolved correctly.
    {
      code: "import { foo } from '#src/lib/utils'",
      options: [
        {
          projectRoot: tmpDir,
          mappings: [
            { alias: '#src', target: 'src' },
            { alias: '#src/ui', target: 'src/lib/ui' },
          ],
        },
      ],
      errors: [
        {
          messageId: 'missingExtension' as const,
          data: { ext: '.ts', importPath: '#src/lib/utils' },
        },
      ],
      output: "import { foo } from '#src/lib/utils.ts'",
    },
  ],
})

// ── TypeScript-specific tests with @typescript-eslint/parser ──
const tsRuleTester = new TSESLint.RuleTester(
  {
    languageOptions: {
      parser: tsParser as never,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  } as unknown as ConstructorParameters<typeof TSESLint.RuleTester>[0],
)

tsRuleTester.run('require-alias-extension (TS)', rule, {
  valid: [
    // export type with extension already present → skipped
    {
      code: "export type { Foo } from '#src/lib/utils.ts'",
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
    },
  ],
  invalid: [
    // export type { X } from '...' without extension
    {
      code: "export type { Foo } from '#src/lib/utils'",
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
      errors: [
        {
          messageId: 'missingExtension' as const,
          data: { ext: '.ts', importPath: '#src/lib/utils' },
        },
      ],
      output: "export type { Foo } from '#src/lib/utils.ts'",
    },
    // import type { X } from '...' without extension
    {
      code: "import type { Foo } from '#src/lib/utils'",
      options: [
        { projectRoot: tmpDir, mappings: [{ alias: '#src', target: 'src' }] },
      ],
      errors: [
        {
          messageId: 'missingExtension' as const,
          data: { ext: '.ts', importPath: '#src/lib/utils' },
        },
      ],
      output: "import type { Foo } from '#src/lib/utils.ts'",
    },
  ],
})
