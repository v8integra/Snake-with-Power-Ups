import { describe, expect, it } from 'vitest'
import { MAX_SPEED, movesPerSecond } from './speed'
import { step } from './step'
import { makeState, rng } from './testUtils'

describe('movesPerSecond', () => {
  it.each([
    [0, 7],
    [4, 7],
    [5, 7.5],
    [9, 7.5],
    [10, 8],
    [65, 13.5],
    [70, 14],
  ])('after %i food the speed is %f', (foodEaten, speed) => {
    expect(movesPerSecond({ foodEaten })).toBe(speed)
  })

  it('is capped at 14', () => {
    expect(movesPerSecond({ foodEaten: 75 })).toBe(MAX_SPEED)
    expect(movesPerSecond({ foodEaten: 1000 })).toBe(14)
  })

  it('goes up when the 5th food is eaten', () => {
    const before = makeState({ foodEaten: 4, food: { x: 11, y: 10 } })
    expect(movesPerSecond(before)).toBe(7)
    expect(movesPerSecond(step(before, rng()))).toBe(7.5)
  })
})
