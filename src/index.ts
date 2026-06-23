import type { TSESLint } from '@typescript-eslint/utils'
import requireAliasExtension from '#src/rules/require-alias-extension.ts'
import noRelativeImports from '#src/rules/no-relative-imports.ts'

export type { RequireAliasExtensionOptions } from '#src/rules/require-alias-extension.ts'
export type { NoRelativeImportsOptions } from '#src/rules/no-relative-imports.ts'

declare const __PKG_VERSION__: string

const plugin = {
  meta: {
    name: '@dev-bb/eslint-plugin-alias-extensions',
    version: __PKG_VERSION__,
    namespace: 'alias-extensions',
  },
  configs: {} as Record<string, TSESLint.FlatConfig.ConfigArray>,
  rules: {
    'require-alias-extension': requireAliasExtension,
    'no-relative-imports': noRelativeImports,
  },
} satisfies TSESLint.FlatConfig.Plugin

plugin.configs.recommended = [
  {
    name: 'alias-extensions/recommended',
    plugins: {
      'alias-extensions': plugin,
    },
    rules: {
      'alias-extensions/require-alias-extension': 'error',
    },
  },
]

export default plugin
