import type { GameState } from './game'

/** What a screen reader hears when the score changes. */
export function scoreMessage(score: number): string {
  return `Score ${score}`
}

/** What a screen reader hears when a game ends. */
export function endMessage(state: Pick<GameState, 'status' | 'score'>, newHighScore: boolean): string {
  const opening = state.status === 'won' ? 'You win!' : 'Game over.'
  const parts = [opening, `Score ${state.score}.`]
  if (newHighScore) parts.push('New high score!')
  parts.push('Press Enter or Play again to start a new game.')
  return parts.join(' ')
}

/** Gap between clearing the live region and filling it, so screen readers see a change. */
const ANNOUNCE_DELAY_MS = 50

/**
 * Speaks messages through a visually hidden live region.
 * The region is cleared first, so the same message twice in a row is still read out.
 * Uses a timer, not requestAnimationFrame, so it doesn't wait on the page repainting.
 */
export function createAnnouncer(region: HTMLElement) {
  let pending: ReturnType<typeof setTimeout> | undefined
  return function announce(message: string): void {
    region.textContent = ''
    clearTimeout(pending)
    pending = setTimeout(() => {
      region.textContent = message
    }, ANNOUNCE_DELAY_MS)
  }
}
