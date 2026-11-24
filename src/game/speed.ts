import type { GameState } from './types'

export const BASE_SPEED = 7 // moves per second
export const SPEED_STEP = 0.5
export const FOOD_PER_SPEED_STEP = 5
export const MAX_SPEED = 14

/** Moves per second: +0.5 every 5 food, capped at 14. Effects (slice 5) will multiply this. */
export function movesPerSecond(state: Pick<GameState, 'foodEaten'>): number {
  const steps = Math.floor(state.foodEaten / FOOD_PER_SPEED_STEP)
  return Math.min(MAX_SPEED, BASE_SPEED + steps * SPEED_STEP)
}
