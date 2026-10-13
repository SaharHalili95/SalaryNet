import { describe, expect, it } from 'vitest'
import en from '../en'
import he from '../he'

type Tree = { [key: string]: string | Tree }

function keys(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : keys(value, `${prefix}${key}.`))
}

function placeholders(text: string) {
  return [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
}

function lookup(tree: Tree, path: string): string {
  return path.split('.').reduce<string | Tree>((node, key) => (node as Tree)[key]!, tree) as string
}

describe('translations', () => {
  it('Hebrew has exactly the same keys as English', () => {
    expect(keys(he as Tree).sort()).toEqual(keys(en as Tree).sort())
  })

  it('every Hebrew message keeps the same placeholders as its English source', () => {
    for (const key of keys(en as Tree)) {
      expect(placeholders(lookup(he as Tree, key)), key).toEqual(placeholders(lookup(en as Tree, key)))
    }
  })

  it('no Hebrew message is left empty', () => {
    for (const key of keys(he as Tree)) {
      expect(lookup(he as Tree, key).trim(), key).not.toBe('')
    }
  })
})
