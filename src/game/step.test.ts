import { describe, expect, it } from 'vitest'
import { GRID_SIZE, containsPoint } from './grid'
import { createInitialState } from './state'
import { FOOD_POINTS } from './powerups'
import { step } from './step'
import { makeState, pts, rng } from './testUtils'
import { queueTurn } from './turns'
import type { Direction, GameState, Point } from './types'

const headOf = (s: GameState): Point | undefined => s.snake[0]

describe('moving', () => {
  const cases: [Direction, Point[], Point][] = [
    ['right', pts([10, 10], [9, 10], [8, 10]), { x: 11, y: 10 }],
    ['left', pts([10, 10], [11, 10], [12, 10]), { x: 9, y: 10 }],
    ['up', pts([10, 10], [10, 11], [10, 12]), { x: 10, y: 9 }],
    ['down', pts([10, 10], [10, 9], [10, 8]), { x: 10, y: 11 }],
  ]
  it.each(cases)('moves one cell %s each tick, keeping its length', (direction, snake, expected) => {
    const next = step(makeState({ snake, direction }), rng())
    expect(headOf(next)).toEqual(expected)
    expect(next.snake).toHaveLength(3)
    expect(next.snake.slice(1)).toEqual(snake.slice(0, 2))
    expect(next.tick).toBe(1)
    expect(next.status).toBe('playing')
  })

  it('does nothing unless the game is playing', () => {
    for (const status of ['ready', 'paused', 'over', 'won'] as const) {
      const s = makeState({ status })
      expect(step(s, rng())).toBe(s)
    }
  })
})

describe('turning', () => {
  it('ignores a turn straight back into the neck', () => {
    const s = queueTurn(makeState({ direction: 'right' }), 'left')
    expect(s.queuedTurns).toEqual([])
    expect(headOf(step(s, rng()))).toEqual({ x: 11, y: 10 })
  })

  it('ignores a turn that matches the current direction', () => {
    expect(queueTurn(makeState({ direction: 'right' }), 'right').queuedTurns).toEqual([])
  })

  it('ignores a turn that matches the last queued direction', () => {
    const s = queueTurn(queueTurn(makeState(), 'up'), 'up')
    expect(s.queuedTurns).toEqual(['up'])
  })

  it('ignores a turn back against the last queued direction', () => {
    const s = queueTurn(queueTurn(makeState(), 'up'), 'down')
    expect(s.queuedTurns).toEqual(['up'])
  })

  it('makes a clean U-turn from two quick turns over two ticks', () => {
    let s = makeState({ direction: 'right' })
    s = queueTurn(s, 'up')
    s = queueTurn(s, 'left')
    expect(s.queuedTurns).toEqual(['up', 'left'])

    s = step(s, rng())
    expect(headOf(s)).toEqual({ x: 10, y: 9 })
    expect(s.direction).toBe('up')
    expect(s.queuedTurns).toEqual(['left'])

    s = step(s, rng())
    expect(headOf(s)).toEqual({ x: 9, y: 9 })
    expect(s.direction).toBe('left')
    expect(s.queuedTurns).toEqual([])
    expect(s.status).toBe('playing')
  })

  it('drops a third queued turn', () => {
    let s = makeState({ direction: 'right' })
    s = queueTurn(s, 'up')
    s = queueTurn(s, 'left')
    s = queueTurn(s, 'down')
    expect(s.queuedTurns).toEqual(['up', 'left'])
  })
})

describe('the tail', () => {
  // A 2x2 loop: the head moves down into the cell the tail is leaving.
  const loop = pts([0, 0], [1, 0], [1, 1], [0, 1])

  it('can follow its own tail', () => {
    const next = step(makeState({ snake: loop, direction: 'down' }), rng())
    expect(next.status).toBe('playing')
    expect(next.snake).toEqual(pts([0, 1], [0, 0], [1, 0], [1, 1]))
  })

  it('hits its own tail while growing', () => {
    const next = step(makeState({ snake: loop, direction: 'down', growPending: 1 }), rng())
    expect(next.status).toBe('over')
  })

  it('hits any other part of its body', () => {
    // Head at (1,1) moving up into (1,0), which is the 4th segment, not the tail.
    const snake = pts([1, 1], [0, 1], [0, 0], [1, 0], [2, 0])
    const next = step(makeState({ snake, direction: 'up' }), rng())
    expect(next.status).toBe('over')
  })
})

describe('walls and edges', () => {
  const last = GRID_SIZE - 1
  const cases: [Direction, Point[]][] = [
    ['up', pts([5, 0], [5, 1], [5, 2])],
    ['down', pts([5, last], [5, last - 1], [5, last - 2])],
    ['left', pts([0, 5], [1, 5], [2, 5])],
    ['right', pts([last, 5], [last - 1, 5], [last - 2, 5])],
  ]
  it.each(cases)('ends the game at the %s edge (no wrap-around)', (direction, snake) => {
    const next = step(makeState({ snake, direction }), rng())
    expect(next.status).toBe('over')
    expect(next.snake).toEqual(snake)
  })

  it('ends the game on an inner wall', () => {
    const next = step(makeState({ walls: pts([11, 10]) }), rng())
    expect(next.status).toBe('over')
  })
})

describe('food', () => {
  it('eating food grows the snake by exactly 1 and scores', () => {
    let s = makeState({ food: { x: 11, y: 10 } })
    s = step(s, rng())
    expect(s.snake).toEqual(pts([11, 10], [10, 10], [9, 10], [8, 10]))
    expect(s.score).toBe(FOOD_POINTS)
    expect(s.foodEaten).toBe(1)
    expect(s.growPending).toBe(0)

    for (let i = 0; i < 3; i++) s = step(s, rng())
    expect(s.snake).toHaveLength(4)
  })

  it('respawns food on a free cell', () => {
    for (let i = 0; i < 200; i++) {
      const s = step(makeState({ food: { x: 11, y: 10 }, walls: pts([0, 0], [5, 5]) }), () => i / 200)
      expect(containsPoint(s.snake, s.food)).toBe(false)
      expect(containsPoint(s.walls, s.food)).toBe(false)
    }
  })

  it('wins when there is no free cell left for food', () => {
    // Snake fills every cell but one, which holds the food next to the head.
    const cells: Point[] = []
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let i = 0; i < GRID_SIZE; i++) cells.push({ x: y % 2 === 0 ? i : GRID_SIZE - 1 - i, y })
    }
    const [food, ...snake] = cells
    if (!food) throw new Error('no cells')
    const next = step(makeState({ snake, food, direction: 'left' }), rng())
    expect(next.snake).toHaveLength(GRID_SIZE * GRID_SIZE)
    expect(next.status).toBe('won')
  })
})

describe('createInitialState', () => {
  it('starts with a length-3 snake heading right, ready, and food off the snake', () => {
    const s = createInitialState(rng())
    expect(s.snake).toEqual(pts([10, 10], [9, 10], [8, 10]))
    expect(s.direction).toBe('right')
    expect(s.status).toBe('ready')
    expect(containsPoint(s.snake, s.food)).toBe(false)
  })
})
