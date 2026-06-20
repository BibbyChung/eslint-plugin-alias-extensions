import { TSESLint } from '@typescript-eslint/utils'
import requireSrcExtension from './rules/require-src-extension.js'

const plugin = {
  meta: {
    name: '@dev-bb/eslint-plugin-alias-extensions',
    version: '0.1.0',
    namespace: 'alias-extensions',
  },
  configs: {} as Record<string, TSESLint.FlatConfig.ConfigArray>,
  rules: {
    'require-src-extension': requireSrcExtension,
  },
} satisfies TSESLint.FlatConfig.Plugin

plugin.configs.recommended = [
  {
    name: 'alias-extensions/recommended',
    plugins: {
      'alias-extensions': plugin,
    },
    rules: {
      'alias-extensions/require-src-extension': 'error',
    },
  },
]

export default plugin
