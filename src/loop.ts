/**
 * Fixed-timestep clock. Frames can arrive at any rate (60 Hz, 144 Hz, uneven);
 * this turns elapsed time into a whole number of game ticks and carries the leftover.
 */

/** A long gap (a hitch, or a tab coming back) counts as at most this much time, so the snake never jumps. */
export const MAX_FRAME_MS = 250

export type ClockResult = { ticks: number; accMs: number }

export function consumeTime(accMs: number, elapsedMs: number, tickMs: number): ClockResult {
  const acc = accMs + Math.min(Math.max(elapsedMs, 0), MAX_FRAME_MS)
  const ticks = Math.floor(acc / tickMs)
  return { ticks, accMs: acc - ticks * tickMs }
}
