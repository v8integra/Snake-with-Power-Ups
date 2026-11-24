import { describe, expect, it } from 'vitest'
import { GRID_SIZE, containsPoint, samePoint } from './grid'
import { createInitialState } from './state'
import { step } from './step'
import { makeState, pts, rng } from './testUtils'
import type { Point } from './types'
import { WALL_LAYOUT, placeWalls } from './walls'

/** Same cells, any order. */
function sameCells(a: readonly Point[], b: readonly Point[]): boolean {
  return a.length === b.length && a.every((p) => containsPoint(b, p))
}

// The default test snake heads right from (10,10), with food just ahead.
const aboutToEat = { food: { x: 11, y: 10 } }

describe('the wall layout', () => {
  it('stays inside the board with no repeated cells', () => {
    for (const p of WALL_LAYOUT) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThan(GRID_SIZE)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThan(GRID_SIZE)
    }
    const unique = new Set(WALL_LAYOUT.map((p) => `${p.x},${p.y}`))
    expect(unique.size).toBe(WALL_LAYOUT.length)
  })

  it('leaves the starting snake and its first moves clear', () => {
    const start = createInitialState(rng()).snake
    for (let x = 8; x < GRID_SIZE; x++) {
      expect(containsPoint(WALL_LAYOUT, { x, y: 10 })).toBe(false)
    }
    for (const p of start) expect(containsPoint(WALL_LAYOUT, p)).toBe(false)
  })
})

describe('walls appearing', () => {
  it('has no walls below 100', () => {
    const s = step(makeState({ score: 80, ...aboutToEat }), rng())
    expect(s.score).toBe(90)
    expect(s.walls).toEqual([])
  })

  it('adds the walls on the tick the score reaches exactly 100', () => {
    const s = step(makeState({ score: 90, ...aboutToEat }), rng())
    expect(s.score).toBe(100)
    // The new food may have landed on a layout cell; that one cell waits.
    const expected = WALL_LAYOUT.filter((p) => !samePoint(p, s.food))
    expect(sameCells(s.walls, expected)).toBe(true)
  })

  it('adds the walls when the score jumps past 100 (Boost: 90 to 110)', () => {
    // Boost arrives in slice 5; this sets up the same jump by hand.
    const s = placeWalls(makeState({ score: 110, food: { x: 10, y: 0 } }))
    expect(sameCells(s.walls, WALL_LAYOUT)).toBe(true)
  })

  it('holds back a wall cell under the snake until the snake leaves it', () => {
    // Snake lies along the top-left bracket's row (y = 3), about to head down off it.
    const blocked = pts([5, 3], [4, 3], [3, 3])
    let s = makeState({ snake: blocked, direction: 'down', score: 100, food: { x: 0, y: 19 } })

    s = placeWalls(s)
    for (const p of blocked) expect(containsPoint(s.walls, p)).toBe(false)
    expect(s.walls).toHaveLength(WALL_LAYOUT.length - 3)

    // Move down three times: the snake leaves row 3 and each freed cell becomes a wall.
    for (let i = 0; i < 3; i++) s = step(s, rng())
    expect(s.status).toBe('playing')
    expect(sameCells(s.walls, WALL_LAYOUT)).toBe(true)
  })

  it('holds back a wall cell under the food until the food is eaten', () => {
    const onLayout = WALL_LAYOUT[0]
    if (!onLayout) throw new Error('empty layout')
    const s = placeWalls(makeState({ score: 100, food: onLayout }))
    expect(containsPoint(s.walls, onLayout)).toBe(false)
    expect(s.walls).toHaveLength(WALL_LAYOUT.length - 1)
  })

  it('never puts a wall on the snake', () => {
    let s = makeState({ score: 90, ...aboutToEat })
    s = step(s, rng())
    for (const p of s.snake) expect(containsPoint(s.walls, p)).toBe(false)
  })
})
