import { randomFreeCell, samePoint } from './grid'
import type { GameState, PowerUpKind, Rng } from './types'

export const POWERUP_EVERY_FOOD = 4
export const POWERUP_LIFETIME_TICKS = 40
export const EFFECT_TICKS = 50
export const BOOST_SPEED = 1.5
export const SLOWMO_SPEED = 0.6
export const FOOD_POINTS = 10
export const BOOST_FOOD_POINTS = 20
export const SHRINK_BY = 3
export const MIN_LENGTH = 3

const KINDS: readonly PowerUpKind[] = ['boost', 'slowmo', 'shrink']

type Effect = GameState['effect']

/** Points for one food, given the effect active this tick. */
export function foodPoints(effect: Effect): number {
  return effect?.kind === 'boost' ? BOOST_FOOD_POINTS : FOOD_POINTS
}

/** How the active effect scales the speed. */
export function speedMultiplier(effect: Effect): number {
  if (effect?.kind === 'boost') return BOOST_SPEED
  if (effect?.kind === 'slowmo') return SLOWMO_SPEED
  return 1
}

/** Applies a power-up the snake just took. */
export function takePowerUp(state: GameState, kind: PowerUpKind): GameState {
  if (kind === 'shrink') {
    const length = Math.max(MIN_LENGTH, state.snake.length - SHRINK_BY)
    return length < state.snake.length ? { ...state, snake: state.snake.slice(0, length) } : state
  }
  // Only one timed effect at a time: a new one replaces the old one and its timer.
  return { ...state, effect: { kind, ticksLeft: EFFECT_TICKS } }
}

/**
 * Runs once per tick, after the snake has moved and eaten:
 * 1. the active effect counts down the tick it was just used for,
 * 2. the power-up on the board is taken (if the head is on it) or ages by one tick,
 * 3. a new power-up spawns if this tick's food was a 4th food and the board has none.
 */
export function updatePowerUps(state: GameState, ateFood: boolean, rng: Rng): GameState {
  let next = state

  if (next.effect) {
    const ticksLeft = next.effect.ticksLeft - 1
    next = { ...next, effect: ticksLeft > 0 ? { ...next.effect, ticksLeft } : null }
  }

  const head = next.snake[0]
  if (next.powerUp && head) {
    if (samePoint(head, next.powerUp.at)) {
      next = takePowerUp({ ...next, powerUp: null }, next.powerUp.kind)
    } else {
      const ticksLeft = next.powerUp.ticksLeft - 1
      next = { ...next, powerUp: ticksLeft > 0 ? { ...next.powerUp, ticksLeft } : null }
    }
  }

  if (ateFood && next.foodEaten % POWERUP_EVERY_FOOD === 0 && !next.powerUp) {
    const at = randomFreeCell(rng, [...next.snake, ...next.walls, next.food])
    if (at) {
      const kind = KINDS[Math.floor(rng() * KINDS.length)] ?? 'boost'
      next = { ...next, powerUp: { kind, at, ticksLeft: POWERUP_LIFETIME_TICKS } }
    }
  }

  return next
}
