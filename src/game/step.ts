import { containsPoint, isInside, movePoint, randomFreeCell, samePoint } from './grid'
import type { GameState, Point, Rng } from './types'

export const FOOD_POINTS = 10

/** Advances the game by one tick (one snake move). Does nothing unless the game is playing. */
export function step(state: GameState, rng: Rng): GameState {
  if (state.status !== 'playing') return state

  const head = state.snake[0]
  if (!head) throw new Error('Snake has no head')

  const [nextTurn, ...restTurns] = state.queuedTurns
  const direction = nextTurn ?? state.direction
  const newHead = movePoint(head, direction)

  const eats = samePoint(newHead, state.food)
  // Growing this tick means the tail stays where it is.
  const growing = state.growPending > 0 || eats
  const body = growing ? state.snake : state.snake.slice(0, -1)

  const tick = state.tick + 1

  if (!isInside(newHead) || containsPoint(state.walls, newHead) || containsPoint(body, newHead)) {
    return { ...state, direction, queuedTurns: restTurns, status: 'over', tick }
  }

  const snake: Point[] = [newHead, ...body]
  let growPending = state.growPending + (eats ? 1 : 0)
  if (growing) growPending -= 1

  let next: GameState = { ...state, snake, direction, queuedTurns: restTurns, growPending, tick }

  if (eats) {
    next = { ...next, score: next.score + FOOD_POINTS, foodEaten: next.foodEaten + 1 }
    const occupied = [...snake, ...next.walls, ...(next.powerUp ? [next.powerUp.at] : [])]
    const food = randomFreeCell(rng, occupied)
    next = food ? { ...next, food } : { ...next, status: 'won' }
  }

  return next
}
