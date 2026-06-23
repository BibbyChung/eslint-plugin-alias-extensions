import fs from 'node:fs'
import path from 'node:path'

export type AliasMapping = {
  /** alias 前綴，不含萬用字元，例如 '#src' 或 '@' */
  alias: string
  /** 對應的絕對目標目錄路徑，例如 '/Users/.../src' */
  target: string
}

/**
 * Lightweight JSONC comment stripper.
 * Removes // line comments and /* *\/ block comments while preserving string content.
 * Does NOT handle trailing commas (if present, JSON.parse will fail – caller handles that).
 */
function stripJsonComments(jsonc: string): string {
  const len = jsonc.length
  const out: string[] = []
  let i = 0

  while (i < len) {
    const ch = jsonc[i]

    // String literal – copy verbatim (handles escaped quotes)
    if (ch === '"') {
      out.push(ch)
      i++
      while (i < len) {
        const c = jsonc[i]
        out.push(c)
        i++
        if (c === '\\') {
          if (i < len) {
            out.push(jsonc[i])
            i++
          }
        } else if (c === '"') {
          break
        }
      }
      continue
    }

    // Line comment //
    if (ch === '/' && i + 1 < len && jsonc[i + 1] === '/') {
      i += 2
      while (i < len && jsonc[i] !== '\n') i++
      continue
    }

    // Block comment /* */
    if (ch === '/' && i + 1 < len && jsonc[i + 1] === '*') {
      i += 2
      while (i < len - 1 && !(jsonc[i] === '*' && jsonc[i + 1] === '/')) i++
      i += 2 // skip the closing */
      continue
    }

    out.push(ch)
    i++
  }

  return out.join('')
}

// Cache for auto-detected base only (package.json imports + tsconfig paths).
// Explicit mappings are NEVER cached — they are merged fresh on each call.
const autoAliasCache = new Map<string, AliasMapping[]>()

/**
 * Load the auto-detected alias base from package.json `imports` and
 * tsconfig.json `compilerOptions.paths`. Results are cached by `projectRoot`
 * so repeated calls with the same root skip re-parsing.
 */
function loadAutoAliases(projectRoot: string): AliasMapping[] {
  const cached = autoAliasCache.get(projectRoot)
  if (cached) return cached

  // Map<alias, absoluteTarget>
  const aliasMap = new Map<string, string>()

  // ── 1. package.json `imports` ──────────────────────────────────────────
  const pkgPath = path.join(projectRoot, 'package.json')
  try {
    const pkgRaw = fs.readFileSync(pkgPath, 'utf-8')
    const pkg = JSON.parse(pkgRaw) as Record<string, unknown>
    const imports = pkg.imports as Record<string, unknown> | undefined
    if (imports && typeof imports === 'object') {
      for (const [key, value] of Object.entries(imports)) {
        if (key.endsWith('/*') && typeof value === 'string' && value.endsWith('/*')) {
          const alias = key.slice(0, -2) // '#src'
          const target = value.slice(0, -2) // './src'
          const absTarget = path.resolve(path.dirname(pkgPath), target)
          if (!aliasMap.has(alias)) {
            aliasMap.set(alias, absTarget)
          }
        }
      }
    }
  } catch {
    // Silently skip if package.json is missing or malformed
  }

  // ── 2. tsconfig.json `compilerOptions.paths` ──────────────────────────
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json')
  try {
    const tsconfigRaw = fs.readFileSync(tsconfigPath, 'utf-8')
    const tsconfig = JSON.parse(stripJsonComments(tsconfigRaw)) as Record<string, unknown>
    const compilerOptions = tsconfig.compilerOptions as Record<string, unknown> | undefined
    if (compilerOptions?.paths && typeof compilerOptions.paths === 'object') {
      const baseUrl = (compilerOptions.baseUrl as string | undefined) ?? '.'
      const baseDir = path.resolve(path.dirname(tsconfigPath), baseUrl)
      const paths = compilerOptions.paths as Record<string, string[]>
      for (const [key, value] of Object.entries(paths)) {
        if (key.endsWith('/*') && Array.isArray(value) && value.length > 0 && typeof value[0] === 'string' && value[0].endsWith('/*')) {
          const alias = key.slice(0, -2)
          // Only add if not already present (package.json has higher priority)
          if (!aliasMap.has(alias)) {
            const target = value[0].slice(0, -2)
            const absTarget = path.resolve(baseDir, target)
            aliasMap.set(alias, absTarget)
          }
        }
      }
    }
  } catch {
    // Silently skip if tsconfig.json is missing or malformed
  }

  const result: AliasMapping[] = Array.from(aliasMap.entries())
    .map(([alias, target]) => ({ alias, target }))

  autoAliasCache.set(projectRoot, result)
  return result
}

/**
 * Load alias mappings from package.json `imports`, tsconfig.json `compilerOptions.paths`,
 * and explicit user-provided mappings.
 *
 * Priority (higher overrides lower):
 *   1. Explicit mappings (via `explicitMappings` param)
 *   2. package.json `imports`
 *   3. tsconfig.json `paths`
 *
 * Only the auto-detected base (package.json + tsconfig) is cached. Explicit mappings
 * are merged fresh on every call, guaranteeing they are never stale.
 *
 * Results are sorted by `target.length` descending so the longest (most specific) prefix
 * is checked first during matching.
 */
export function loadAliasMappings(
  projectRoot: string,
  explicitMappings?: Array<{ alias: string; target: string }>,
): AliasMapping[] {
  // Get auto-detected base from cache (or parse config files)
  const autoDetected = loadAutoAliases(projectRoot)

  // Build a mutable map from the auto-detected base
  const aliasMap = new Map<string, string>()
  for (const { alias, target } of autoDetected) {
    aliasMap.set(alias, target)
  }

  // ── 3. Explicit mappings (highest priority, always fresh) ────────────
  if (explicitMappings) {
    for (const { alias, target } of explicitMappings) {
      const absTarget = path.resolve(projectRoot, target)
      aliasMap.set(alias, absTarget)
    }
  }

  // ── 4. Convert to array, sort by target length descending ─────────────
  return Array.from(aliasMap.entries())
    .map(([alias, target]) => ({ alias, target }))
    .sort((a, b) => b.target.length - a.target.length)
}

/**
 * Clear the module-level auto-detect alias cache. Useful in test teardown
 * or when config files change at runtime.
 */
export function clearAliasCache(): void {
  autoAliasCache.clear()
}
