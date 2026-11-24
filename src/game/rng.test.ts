import { describe, expect, it } from 'vitest'
import { GRID_SIZE, containsPoint, randomFreeCell } from './grid'
import { createRng } from './rng'
import { pts } from './testUtils'
import type { Point } from './types'

describe('createRng', () => {
  it('gives the same sequence for the same seed', () => {
    const a = createRng(123)
    const b = createRng(123)
    expect(Array.from({ length: 10 }, () => a())).toEqual(Array.from({ length: 10 }, () => b()))
  })

  it('gives a different sequence for a different seed', () => {
    expect(createRng(1)()).not.toBe(createRng(2)())
  })

  it('stays in [0, 1)', () => {
    const r = createRng(7)
    for (let i = 0; i < 10_000; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('randomFreeCell', () => {
  it('never lands on an occupied cell (seeded, many runs)', () => {
    const occupied = pts([0, 0], [1, 0], [2, 0], [10, 10], [19, 19], [5, 7])
    for (let seed = 0; seed < 500; seed++) {
      const cell = randomFreeCell(createRng(seed), occupied)
      expect(cell).not.toBeNull()
      if (cell) expect(containsPoint(occupied, cell)).toBe(false)
    }
  })

  it('returns null when the board is full', () => {
    const all: Point[] = []
    for (let y = 0; y < GRID_SIZE; y++) for (let x = 0; x < GRID_SIZE; x++) all.push({ x, y })
    expect(randomFreeCell(createRng(1), all)).toBeNull()
  })
})
