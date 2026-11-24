import { describe, expect, it } from 'vitest'
import { containsPoint, samePoint } from './grid'
import {
  BOOST_FOOD_POINTS,
  EFFECT_TICKS,
  FOOD_POINTS,
  POWERUP_LIFETIME_TICKS,
  takePowerUp,
  takenPowerUp,
} from './powerups'
import { createRng } from './rng'
import { togglePause } from './status'
import { step } from './step'
import { makeState, rng } from './testUtils'
import type { GameState, PowerUpKind } from './types'
import { WALL_LAYOUT } from './walls'

// The default test snake heads right from (10,10). Food just ahead is eaten on the next step.
const foodAhead = { food: { x: 11, y: 10 } }
// Somewhere out of the way, for power-ups and food the snake shouldn't reach.
const farAway = { x: 0, y: 19 }

function steps(s: GameState, n: number): GameState {
  for (let i = 0; i < n; i++) s = step(s, rng())
  return s
}

const CLOCKWISE = { right: 'down', down: 'left', left: 'up', up: 'right' } as const

/** Steps `n` ticks with a short snake turning every tick, so it circles a 2x2 square forever. */
function circle(s: GameState, n: number): GameState {
  for (let i = 0; i < n; i++) s = step({ ...s, queuedTurns: [CLOCKWISE[s.direction]] }, rng())
  return s
}

/** A straight snake of `length` along row 10, head at (15,10), heading right. */
function snakeOf(length: number) {
  return Array.from({ length }, (_, i) => ({ x: 15 - i, y: 10 }))
}

describe('spawning', () => {
  it('spawns a power-up when the 4th food is eaten', () => {
    const s = step(makeState({ foodEaten: 3, ...foodAhead }), rng())
    expect(s.foodEaten).toBe(4)
    expect(s.powerUp).not.toBeNull()
    expect(s.powerUp?.ticksLeft).toBe(POWERUP_LIFETIME_TICKS)
  })

  it('does not spawn on the 3rd or 5th food', () => {
    expect(step(makeState({ foodEaten: 2, ...foodAhead }), rng()).powerUp).toBeNull()
    expect(step(makeState({ foodEaten: 4, ...foodAhead }), rng()).powerUp).toBeNull()
  })

  it('spawns again on the 8th food', () => {
    expect(step(makeState({ foodEaten: 7, ...foodAhead }), rng()).powerUp).not.toBeNull()
  })

  it('does not spawn a second one while one is on the board', () => {
    const existing = { kind: 'shrink' as const, at: farAway, ticksLeft: 30 }
    const s = step(makeState({ foodEaten: 3, ...foodAhead, powerUp: existing }), rng())
    expect(s.powerUp).toEqual({ ...existing, ticksLeft: 29 })
  })

  it('never lands on the snake, a wall or the food (seeded, many runs)', () => {
    const walls = WALL_LAYOUT.slice(0, 16)
    const kinds = new Set<PowerUpKind>()
    for (let seed = 0; seed < 300; seed++) {
      const s = step(makeState({ foodEaten: 3, ...foodAhead, walls }), createRng(seed))
      const p = s.powerUp
      expect(p).not.toBeNull()
      if (!p) continue
      kinds.add(p.kind)
      expect(containsPoint(s.snake, p.at)).toBe(false)
      expect(containsPoint(s.walls, p.at)).toBe(false)
      expect(samePoint(s.food, p.at)).toBe(false)
    }
    expect(kinds).toEqual(new Set(['boost', 'slowmo', 'shrink']))
  })

  it('also keeps new food off the power-up', () => {
    for (let seed = 0; seed < 300; seed++) {
      const powerUp = { kind: 'boost' as const, at: { x: 5, y: 5 }, ticksLeft: 30 }
      const s = step(makeState({ ...foodAhead, powerUp }), createRng(seed))
      expect(samePoint(s.food, powerUp.at)).toBe(false)
    }
  })
})

describe('expiring', () => {
  it('disappears 40 ticks after it spawns if it is not taken', () => {
    let s = step(makeState({ foodEaten: 3, ...foodAhead }), rng())
    expect(s.powerUp?.ticksLeft).toBe(POWERUP_LIFETIME_TICKS)
    // Move the power-up and food out of reach; the snake circles in the middle.
    s = { ...s, food: { x: 19, y: 0 }, powerUp: s.powerUp && { ...s.powerUp, at: farAway } }

    s = circle(s, 39)
    expect(s.status).toBe('playing')
    expect(s.powerUp?.ticksLeft).toBe(1)
    s = circle(s, 1)
    expect(s.powerUp).toBeNull()
  })
})

describe('taking a power-up', () => {
  const take = (kind: PowerUpKind, extra: Partial<GameState> = {}) =>
    step(makeState({ powerUp: { kind, at: { x: 11, y: 10 }, ticksLeft: 5 }, ...extra }), rng())

  it('removes it from the board', () => {
    expect(take('boost').powerUp).toBeNull()
  })

  it('Boost starts a 50-tick effect', () => {
    expect(take('boost').effect).toEqual({ kind: 'boost', ticksLeft: EFFECT_TICKS })
  })

  it('Slow-mo starts a 50-tick effect', () => {
    expect(take('slowmo').effect).toEqual({ kind: 'slowmo', ticksLeft: EFFECT_TICKS })
  })

  it('a new effect replaces the old one and its timer', () => {
    const s = take('slowmo', { effect: { kind: 'boost', ticksLeft: 7 } })
    expect(s.effect).toEqual({ kind: 'slowmo', ticksLeft: EFFECT_TICKS })
    const t = take('boost', { effect: { kind: 'boost', ticksLeft: 7 } })
    expect(t.effect).toEqual({ kind: 'boost', ticksLeft: EFFECT_TICKS })
  })

  it('an effect lasts exactly 50 ticks', () => {
    let s = take('boost', { food: farAway })
    let ticks = 0
    while (s.effect && ticks < 100) {
      s = circle(s, 1)
      ticks++
    }
    expect(s.status).toBe('playing')
    expect(ticks).toBe(EFFECT_TICKS)
  })
})

describe('Shrink', () => {
  it('takes length 4 down to 3', () => {
    const s = takePowerUp(makeState({ snake: snakeOf(4) }), 'shrink')
    expect(s.snake).toEqual(snakeOf(4).slice(0, 3))
  })

  it('takes length 10 down to 7, keeping the head end', () => {
    const s = takePowerUp(makeState({ snake: snakeOf(10) }), 'shrink')
    expect(s.snake).toEqual(snakeOf(10).slice(0, 7))
  })

  it('leaves length 3 alone', () => {
    const snake = snakeOf(3)
    expect(takePowerUp(makeState({ snake }), 'shrink').snake).toEqual(snake)
  })

  it('does not touch the active effect', () => {
    const effect = { kind: 'boost' as const, ticksLeft: 12 }
    expect(takePowerUp(makeState({ snake: snakeOf(8), effect }), 'shrink').effect).toEqual(effect)
  })

  it('works as a pickup inside step()', () => {
    const snake = snakeOf(10)
    const s = step(makeState({ snake, powerUp: { kind: 'shrink', at: { x: 16, y: 10 }, ticksLeft: 5 } }), rng())
    expect(s.snake).toHaveLength(7)
    expect(s.snake[0]).toEqual({ x: 16, y: 10 })
  })
})

describe('points', () => {
  it('food scores 10 with no effect and with Slow-mo', () => {
    expect(step(makeState(foodAhead), rng()).score).toBe(FOOD_POINTS)
    const slow = { kind: 'slowmo' as const, ticksLeft: 10 }
    expect(step(makeState({ ...foodAhead, effect: slow }), rng()).score).toBe(FOOD_POINTS)
  })

  it('Boost doubles food points to 20', () => {
    const boost = { kind: 'boost' as const, ticksLeft: 10 }
    expect(step(makeState({ ...foodAhead, effect: boost }), rng()).score).toBe(BOOST_FOOD_POINTS)
  })

  it('Boost still counts on its last tick', () => {
    const boost = { kind: 'boost' as const, ticksLeft: 1 }
    const s = step(makeState({ ...foodAhead, effect: boost }), rng())
    expect(s.score).toBe(BOOST_FOOD_POINTS)
    expect(s.effect).toBeNull()
  })

  it('Boost jumping the score from 90 to 110 brings in the walls', () => {
    const boost = { kind: 'boost' as const, ticksLeft: 10 }
    const s = step(makeState({ score: 90, ...foodAhead, effect: boost }), rng())
    expect(s.score).toBe(110)
    expect(s.walls.length).toBeGreaterThan(0)
  })
})

describe('pausing', () => {
  it('does not change any timer', () => {
    const playing = makeState({
      effect: { kind: 'boost', ticksLeft: 23 },
      powerUp: { kind: 'shrink', at: farAway, ticksLeft: 17 },
    })
    let s = togglePause(playing)
    s = steps(s, 100)
    expect(s.effect).toEqual({ kind: 'boost', ticksLeft: 23 })
    expect(s.powerUp?.ticksLeft).toBe(17)
    expect(togglePause(s)).toEqual(playing)
  })

  it('timers do count down while playing', () => {
    const s = step(
      makeState({ effect: { kind: 'boost', ticksLeft: 23 }, powerUp: { kind: 'shrink', at: farAway, ticksLeft: 17 } }),
      rng(),
    )
    expect(s.effect?.ticksLeft).toBe(22)
    expect(s.powerUp?.ticksLeft).toBe(16)
  })
})

describe('takenPowerUp (tells the screen when to flash)', () => {
  const powerUp = { kind: 'slowmo' as const, at: { x: 11, y: 10 }, ticksLeft: 5 }

  it('reports the kind and cell when the snake takes one', () => {
    const prev = makeState({ powerUp })
    expect(takenPowerUp(prev, step(prev, rng()))).toEqual({ kind: 'slowmo', at: { x: 11, y: 10 } })
  })

  it('reports nothing when the snake moves past it', () => {
    const prev = makeState({ powerUp: { ...powerUp, at: farAway } })
    expect(takenPowerUp(prev, step(prev, rng()))).toBeNull()
  })

  it('reports nothing when it expires', () => {
    const prev = makeState({ powerUp: { ...powerUp, at: farAway, ticksLeft: 1 } })
    const next = step(prev, rng())
    expect(next.powerUp).toBeNull()
    expect(takenPowerUp(prev, next)).toBeNull()
  })

  it('reports nothing when no tick happened', () => {
    const prev = makeState({ powerUp, status: 'paused' })
    expect(takenPowerUp(prev, step(prev, rng()))).toBeNull()
  })
})
