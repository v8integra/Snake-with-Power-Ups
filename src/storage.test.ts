import { describe, expect, it } from 'vitest'
import { BACKUP_KEY, STORAGE_KEY, loadHighScores, saveHighScores, type KeyValueStore } from './storage'

/** An in-memory stand-in for localStorage. */
function fakeStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  const store: KeyValueStore = {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => {
      data.set(k, String(v))
    },
  }
  return { store, data }
}

/** A store where every call throws, like a blocked or private-mode browser. */
const blockedStore: KeyValueStore = {
  getItem: () => {
    throw new Error('SecurityError')
  },
  setItem: () => {
    throw new Error('QuotaExceededError')
  },
}

const valid = JSON.stringify({
  version: 1,
  highScores: [
    { score: 120, date: '2026-11-20' },
    { score: 60, date: '2026-11-21' },
  ],
})

describe('loadHighScores', () => {
  it('starts empty when nothing is saved', () => {
    const { store, data } = fakeStore()
    expect(loadHighScores(store)).toEqual([])
    expect(data.has(BACKUP_KEY)).toBe(false)
  })

  it('reads saved scores', () => {
    const { store } = fakeStore({ [STORAGE_KEY]: valid })
    expect(loadHighScores(store)).toEqual([
      { score: 120, date: '2026-11-20' },
      { score: 60, date: '2026-11-21' },
    ])
  })

  it.each([
    ['not JSON', '{oops'],
    ['JSON null', 'null'],
    ['a plain number', '42'],
    ['the wrong version', JSON.stringify({ version: 2, highScores: [] })],
    ['scores that are not a list', JSON.stringify({ version: 1, highScores: 'lots' })],
    ['a score that is not a number', JSON.stringify({ version: 1, highScores: [{ score: '90', date: '2026-11-01' }] })],
    ['a score of 0', JSON.stringify({ version: 1, highScores: [{ score: 0, date: '2026-11-01' }] })],
    ['a bad date', JSON.stringify({ version: 1, highScores: [{ score: 90, date: 'yesterday' }] })],
  ])('starts empty and backs up the broken text when it is %s', (_, broken) => {
    const { store, data } = fakeStore({ [STORAGE_KEY]: broken })
    expect(loadHighScores(store)).toEqual([])
    expect(data.get(BACKUP_KEY)).toBe(broken)
  })

  it('sorts and trims a hand-edited table to the top 5', () => {
    const scores = [10, 70, 30, 90, 50, 80].map((score) => ({ score, date: '2026-11-01' }))
    const { store } = fakeStore({ [STORAGE_KEY]: JSON.stringify({ version: 1, highScores: scores }) })
    expect(loadHighScores(store).map((h) => h.score)).toEqual([90, 80, 70, 50, 30])
  })

  it('starts empty when storage is blocked, without throwing', () => {
    expect(loadHighScores(blockedStore)).toEqual([])
  })
})

describe('saveHighScores', () => {
  it('saves under one key in the versioned format, and loads back the same', () => {
    const { store, data } = fakeStore()
    const scores = [{ score: 80, date: '2026-11-24' }]
    expect(saveHighScores(store, scores)).toBe(true)
    expect(JSON.parse(data.get(STORAGE_KEY) ?? '')).toEqual({ version: 1, highScores: scores })
    expect(loadHighScores(store)).toEqual(scores)
  })

  it('reports failure instead of throwing when storage refuses', () => {
    expect(saveHighScores(blockedStore, [{ score: 10, date: '2026-11-24' }])).toBe(false)
  })

  it('a later save replaces broken data, and the backup stays', () => {
    const { store, data } = fakeStore({ [STORAGE_KEY]: '{oops' })
    loadHighScores(store)
    saveHighScores(store, [{ score: 10, date: '2026-11-24' }])
    expect(loadHighScores(store)).toEqual([{ score: 10, date: '2026-11-24' }])
    expect(data.get(BACKUP_KEY)).toBe('{oops')
  })
})
