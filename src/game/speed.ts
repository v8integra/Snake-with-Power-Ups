import { speedMultiplier } from './powerups'
import type { GameState } from './types'

export const BASE_SPEED = 7 // moves per second
export const SPEED_STEP = 0.5
export const FOOD_PER_SPEED_STEP = 5
export const MAX_SPEED = 14

/** The food-based speed: +0.5 every 5 food, capped at 14. */
export function baseSpeed(state: Pick<GameState, 'foodEaten'>): number {
  const steps = Math.floor(state.foodEaten / FOOD_PER_SPEED_STEP)
  return Math.min(MAX_SPEED, BASE_SPEED + steps * SPEED_STEP)
}

/** Moves per second right now: the capped base speed, times Boost (1.5×) or Slow-mo (0.6×). */
export function movesPerSecond(state: Pick<GameState, 'foodEaten' | 'effect'>): number {
  return baseSpeed(state) * speedMultiplier(state.effect)
}
