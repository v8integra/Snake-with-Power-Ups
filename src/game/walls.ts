import { containsPoint } from './grid'
import type { GameState, Point } from './types'

export const WALLS_AT_SCORE = 100

/** Builds an L-shaped bracket: a 5-cell arm along x and a 3-cell arm along y from the same corner. */
function bracket(cornerX: number, cornerY: number, dx: 1 | -1, dy: 1 | -1): Point[] {
  const cells: Point[] = []
  for (let i = 0; i < 5; i++) cells.push({ x: cornerX + i * dx, y: cornerY })
  for (let i = 1; i < 4; i++) cells.push({ x: cornerX, y: cornerY + i * dy })
  return cells
}

/**
 * The one fixed layout: four L-shaped brackets, one toward each corner.
 * The center (where the snake starts) and the outer two lanes stay open.
 */
export const WALL_LAYOUT: readonly Point[] = [
  ...bracket(3, 3, 1, 1), // top-left
  ...bracket(16, 3, -1, 1), // top-right
  ...bracket(3, 16, 1, -1), // bottom-left
  ...bracket(16, 16, -1, -1), // bottom-right
]

/**
 * Once the score has reached 100, adds every layout cell that isn't a wall yet,
 * unless the snake, the food or a power-up is on it. Blocked cells wait for a later tick.
 * Score never goes down, so "score >= 100" is all the state this needs.
 */
export function placeWalls(state: GameState): GameState {
  if (state.score < WALLS_AT_SCORE || state.walls.length >= WALL_LAYOUT.length) return state

  const blocked = [...state.snake, state.food, ...(state.powerUp ? [state.powerUp.at] : [])]
  const added = WALL_LAYOUT.filter((p) => !containsPoint(state.walls, p) && !containsPoint(blocked, p))
  return added.length === 0 ? state : { ...state, walls: [...state.walls, ...added] }
}
