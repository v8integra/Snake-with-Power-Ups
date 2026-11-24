import { randomFreeCell } from './grid'
import type { GameState, Rng } from './types'

/** A fresh game: length-3 snake in the middle, heading right, waiting to start. */
export function createInitialState(rng: Rng): GameState {
  const snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]
  const food = randomFreeCell(rng, snake)
  if (!food) throw new Error('No room for food on an empty board')
  return {
    snake,
    direction: 'right',
    queuedTurns: [],
    food,
    powerUp: null,
    effect: null,
    walls: [],
    score: 0,
    foodEaten: 0,
    growPending: 0,
    status: 'ready',
    tick: 0,
  }
}
