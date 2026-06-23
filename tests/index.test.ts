import { describe, it, expect } from 'vitest'
import plugin from '#src/index.ts'

describe('plugin.rules', () => {
  it('registers both rules', () => {
    expect(plugin.rules).toHaveProperty('require-alias-extension')
    expect(plugin.rules).toHaveProperty('no-relative-imports')
  })
})

describe('configs.recommended', () => {
  it('enables require-alias-extension in the recommended config', () => {
    const recommended = plugin.configs.recommended
    expect(Array.isArray(recommended)).toBe(true)
    expect(recommended[0].rules).toHaveProperty(
      'alias-extensions/require-alias-extension',
    )
    expect(
      recommended[0].rules?.['alias-extensions/require-alias-extension'],
    ).toBe('error')
  })

  it('does NOT enable no-relative-imports in the recommended config', () => {
    const recommended = plugin.configs.recommended
    expect(recommended[0].rules).not.toHaveProperty(
      'alias-extensions/no-relative-imports',
    )
  })
})
