import { describe, expect, it } from 'vitest'
import { MAX_SPEED, baseSpeed, movesPerSecond } from './speed'
import { step } from './step'
import { makeState, rng } from './testUtils'

describe('baseSpeed', () => {
  it.each([
    [0, 7],
    [4, 7],
    [5, 7.5],
    [9, 7.5],
    [10, 8],
    [65, 13.5],
    [70, 14],
  ])('after %i food the speed is %f', (foodEaten, speed) => {
    expect(baseSpeed({ foodEaten })).toBe(speed)
  })

  it('is capped at 14', () => {
    expect(baseSpeed({ foodEaten: 75 })).toBe(MAX_SPEED)
    expect(baseSpeed({ foodEaten: 1000 })).toBe(14)
  })

  it('goes up when the 5th food is eaten', () => {
    const before = makeState({ foodEaten: 4, food: { x: 11, y: 10 } })
    expect(movesPerSecond(before)).toBe(7)
    expect(movesPerSecond(step(before, rng()))).toBe(7.5)
  })
})

describe('movesPerSecond with effects', () => {
  it('is the base speed with no effect', () => {
    expect(movesPerSecond({ foodEaten: 10, effect: null })).toBe(8)
  })

  it('Boost multiplies the current speed by 1.5', () => {
    expect(movesPerSecond({ foodEaten: 0, effect: { kind: 'boost', ticksLeft: 10 } })).toBe(10.5)
  })

  it('Slow-mo multiplies the current speed by 0.6', () => {
    expect(movesPerSecond({ foodEaten: 0, effect: { kind: 'slowmo', ticksLeft: 10 } })).toBeCloseTo(4.2)
  })

  it('caps the base speed at 14 before the effect multiplies it', () => {
    expect(movesPerSecond({ foodEaten: 1000, effect: null })).toBe(14)
    expect(movesPerSecond({ foodEaten: 1000, effect: { kind: 'boost', ticksLeft: 1 } })).toBe(21)
    expect(movesPerSecond({ foodEaten: 1000, effect: { kind: 'slowmo', ticksLeft: 1 } })).toBeCloseTo(8.4)
  })
})
