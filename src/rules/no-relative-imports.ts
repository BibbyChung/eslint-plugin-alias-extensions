import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import path from 'node:path'
import { loadAliasMappings, type AliasMapping } from '#src/utils/alias.ts'

export type NoRelativeImportsOptions = {
  /** 允許同資料夾內的 ./ 相對 import（指向直接同層檔案），預設 false */
  allowSameFolder?: boolean
  /** 顯式 alias mappings，會與自動解析結果合併（顯式優先） */
  mappings?: Array<{ alias: string; target: string }>
  /** 解析設定檔的根目錄，預設 context.cwd */
  projectRoot?: string
}

type MessageIds = 'preferAlias' | 'unresolvable'
type Options = [NoRelativeImportsOptions?]

type SourceNode =
  | TSESTree.ImportDeclaration
  | TSESTree.ExportNamedDeclaration
  | TSESTree.ExportAllDeclaration

const rule: TSESLint.RuleModule<MessageIds, Options> = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow relative imports (./ ../) and autofix to the resolved alias path',
      url: 'https://github.com/BibbyChung/eslint-plugin-alias-extensions#readme',
    },
    fixable: 'code',
    messages: {
      preferAlias:
        "Relative import '{{source}}' should use alias '{{resolved}}'.",
      unresolvable:
        "Cannot resolve alias for relative import '{{source}}'. No matching subpath import or tsconfig path found.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowSameFolder: { type: 'boolean' },
          mappings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                alias: { type: 'string' },
                target: { type: 'string' },
              },
              required: ['alias', 'target'],
              additionalProperties: false,
            },
          },
          projectRoot: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] ?? {}
    const projectRoot = options.projectRoot ?? context.cwd
    const allowSameFolder = options.allowSameFolder ?? false

    // ── Virtual file guard ──────────────────────────────────────────────
    const filename = context.filename
    if (!filename || filename.includes('?')) {
      return {}
    }

    const mappings: AliasMapping[] = loadAliasMappings(
      projectRoot,
      options.mappings,
    )

    // If no mappings are available, there's nothing to check
    if (mappings.length === 0) {
      return {}
    }

    const importingDir = path.dirname(path.resolve(filename))
    const sourceCode = context.sourceCode

    /**
     * Report a relative import that should be converted to an alias import.
     */
    function reportIfRelative(src: string, sourceNode: TSESTree.Node): void {
      // Only handle relative imports (starting with ./ or ../)
      if (!src.startsWith('./') && !src.startsWith('../')) return

      const targetAbs = path.resolve(importingDir, src)

      // allowSameFolder: skip imports that stay in the same directory
      if (allowSameFolder && path.dirname(targetAbs) === importingDir) return

      // Find the best matching alias (longest target prefix first due to sort order)
      const mapping = mappings.find(
        (m) =>
          targetAbs === m.target ||
          targetAbs.startsWith(m.target + path.sep),
      )

      if (!mapping) {
        // No matching alias found → report unresolvable (no fix)
        context.report({
          node: sourceNode,
          messageId: 'unresolvable',
          data: { source: src },
        })
        return
      }

      // Compute the remainder path and construct the alias
      let remainder = path.relative(mapping.target, targetAbs)
      // Normalize path separators to forward slashes
      remainder = remainder.split(path.sep).join('/')
      const resolved = mapping.alias + (remainder ? '/' + remainder : '')

      // Preserve the original quote style
      const raw = sourceCode.getText(sourceNode)
      const quote = raw[0]

      context.report({
        node: sourceNode,
        messageId: 'preferAlias',
        data: { source: src, resolved },
        fix(fixer) {
          return fixer.replaceText(
            sourceNode,
            `${quote}${resolved}${quote}`,
          )
        },
      })
    }

    /**
     * Handler for ImportDeclaration / ExportNamedDeclaration / ExportAllDeclaration.
     */
    function checkSource(node: SourceNode): void {
      const srcNode = node.source
      if (!srcNode) return
      const src = srcNode.value
      if (typeof src !== 'string') return
      reportIfRelative(src, srcNode)
    }

    /**
     * Handler for dynamic import() expressions.
     * Only handles literal string sources.
     */
    function checkDynamicImport(node: TSESTree.ImportExpression): void {
      const source = node.source
      if (!source || source.type !== 'Literal') return
      if (typeof source.value !== 'string') return
      reportIfRelative(source.value, source)
    }

    return {
      ImportDeclaration: checkSource,
      ExportNamedDeclaration: checkSource,
      ExportAllDeclaration: checkSource,
      ImportExpression: checkDynamicImport,
    }
  },
}

export default rule
