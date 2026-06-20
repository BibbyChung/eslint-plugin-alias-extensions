import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import fs from 'node:fs'
import path from 'node:path'

export type RequireSrcExtensionOptions = {
  /** Project root directory, defaults to context.cwd */
  projectRoot?: string
  /** alias → target mappings; target is a path relative to projectRoot */
  mappings?: Array<{ alias: string; target: string }>
  /** File extensions to try when resolving */
  extensions?: string[]
}

type MessageIds = 'missingExtension'
type Options = [RequireSrcExtensionOptions?]

const DEFAULT_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js']

type DeclarationNode =
  | TSESTree.ImportDeclaration
  | TSESTree.ExportNamedDeclaration
  | TSESTree.ExportAllDeclaration

const rule: TSESLint.RuleModule<MessageIds, Options> = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require file extensions on subpath imports (e.g. #src/*)',
      url: 'https://github.com/dev-bb/eslint-plugin-alias-extensions#configuration',
    },
    fixable: 'code',
    messages: {
      missingExtension:
        'Missing file extension "{{ext}}" for "{{importPath}}". Run ESLint with --fix to add it.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          projectRoot: { type: 'string' },
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
          extensions: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] ?? {}
    const projectRoot = options.projectRoot ?? context.cwd
    const mappings = options.mappings ?? []
    // Sort by alias length descending so longer (more specific) aliases match first
    const sortedMappings = [...mappings].sort(
      (a, b) => b.alias.length - a.alias.length,
    )
    const extensions = options.extensions ?? DEFAULT_EXTENSIONS
    const sourceCode = context.sourceCode

    /**
     * Core check logic shared by static (ImportDeclaration/ExportNamedDeclaration/ExportAllDeclaration)
     * and dynamic (ImportExpression) imports.
     *
     * @param src         The import path string (e.g. '#src/lib/utils')
     * @param sourceNode  The AST node representing the source value (used for reporting/fixing)
     */
    function checkImportPath(src: string, sourceNode: TSESTree.Node): void {
      // Already has one of the expected extensions → skip
      if (extensions.some((ext) => src.endsWith(ext))) return

      // Find the matching alias mapping
      const mapping = sortedMappings.find(
        (m) => src === m.alias || src.startsWith(m.alias + '/'),
      )
      if (!mapping) return

      // Resolve the actual file path
      const relPath = src.slice(mapping.alias.length) // Starts with '/' or is empty
      const targetAbs = path.resolve(projectRoot, mapping.target)
      const fullPath = relPath
        ? path.join(targetAbs, relPath)
        : targetAbs

      // Try resolving: direct file first, then index file
      let found: string | null = null
      for (const ext of extensions) {
        if (fs.existsSync(fullPath + ext)) {
          found = ext
          break
        }
      }
      if (!found) {
        for (const ext of extensions) {
          if (fs.existsSync(path.join(fullPath, `index${ext}`))) {
            found = `/index${ext}`
            break
          }
        }
      }
      if (!found) return

      // Preserve the original quote style
      const raw = sourceCode.getText(sourceNode)
      const quote = raw[0]

      context.report({
        node: sourceNode,
        messageId: 'missingExtension',
        data: { ext: found, importPath: src },
        fix(fixer) {
          return fixer.replaceText(
            sourceNode,
            `${quote}${src}${found}${quote}`,
          )
        },
      })
    }

    /**
     * Handler for ImportDeclaration / ExportNamedDeclaration / ExportAllDeclaration.
     * These always have a StringLiteral as source.
     */
    function checkSource(node: DeclarationNode): void {
      // Bail out when source is null (e.g. ExportNamedDeclaration without source)
      const srcNode = node.source
      if (!srcNode) return
      const src = srcNode.value
      if (typeof src !== 'string') return
      checkImportPath(src, srcNode)
    }

    /**
     * Handler for dynamic import() expressions.
     * Only handles literal string sources (e.g. `import('#src/foo')`).
     * Skips non-literal sources like template literals or identifiers.
     */
    function checkDynamicImport(node: TSESTree.ImportExpression): void {
      const source = node.source
      // Only handle literal string values; skip TemplateLiteral, Identifier, etc.
      if (source.type !== 'Literal') return
      if (typeof source.value !== 'string') return
      checkImportPath(source.value, source)
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
