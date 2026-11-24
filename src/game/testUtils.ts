import { createRng } from './rng'
import type { GameState, Point } from './types'

/** A playing state with sensible defaults; override what a test cares about. */
export function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    snake: [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ],
    direction: 'right',
    queuedTurns: [],
    food: { x: 19, y: 19 },
    powerUp: null,
    effect: null,
    walls: [],
    score: 0,
    foodEaten: 0,
    growPending: 0,
    status: 'playing',
    tick: 0,
    ...overrides,
  }
}

export const rng = () => createRng(42)

export const pts = (...coords: [number, number][]): Point[] => coords.map(([x, y]) => ({ x, y }))
