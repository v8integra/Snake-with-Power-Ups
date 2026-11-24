import type { Direction } from './game'

/** How far (in CSS pixels) a finger must move before it counts as a swipe. */
export const SWIPE_THRESHOLD_PX = 20

/**
 * The direction of a drag, or null if it's too short to count.
 * The longer axis wins; screen y grows downward, like the grid.
 */
export function swipeDirection(dx: number, dy: number, threshold = SWIPE_THRESHOLD_PX): Direction | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return null
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left'
  return dy > 0 ? 'down' : 'up'
}
