import type { GameState, GameStatus } from './game'

export type OverlayHandlers = {
  start: () => void
  resume: () => void
  playAgain: () => void
}

/**
 * The message laid over the board for Ready, Paused, Game over and Win.
 * Rebuilds only when the status changes, not every frame.
 */
export function createOverlay(el: HTMLElement, handlers: OverlayHandlers) {
  let shown: GameStatus | null = null

  // Tapping the Ready or Paused overlay starts or resumes the game.
  el.addEventListener('click', (e) => {
    if (e.target instanceof HTMLButtonElement) return
    if (shown === 'ready') handlers.start()
    else if (shown === 'paused') handlers.resume()
  })

  /** `newHighScore` is only read when the game has just ended. */
  return function update(state: GameState, newHighScore = false): void {
    if (state.status === shown) return
    shown = state.status
    el.replaceChildren()
    el.dataset.status = state.status

    if (state.status === 'playing') {
      el.hidden = true
      return
    }
    el.hidden = false

    if (state.status === 'ready') {
      el.append(
        heading('Snake'),
        para('Press Enter or tap to start'),
        para('Arrows or WASD to turn · Space or P to pause', 'hint keys-only'),
        para('Swipe on the board or use the pad to turn', 'hint touch-only'),
      )
    } else if (state.status === 'paused') {
      el.append(
        heading('Paused'),
        para('Press Space or P, or tap, to resume', 'keys-only'),
        para('Tap the board or press Resume to continue', 'touch-only'),
      )
    } else {
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = 'Play again'
      button.addEventListener('click', handlers.playAgain)
      el.append(
        heading(state.status === 'won' ? 'You win!' : 'Game over'),
        para(`Score: ${state.score}`, 'final-score'),
        ...(newHighScore ? [para('New high score!', 'new-high')] : []),
        button,
        para('or press Enter', 'hint keys-only'),
      )
      button.focus()
    }
  }
}

function heading(text: string): HTMLElement {
  const h = document.createElement('h2')
  h.textContent = text
  return h
}

function para(text: string, className?: string): HTMLElement {
  const p = document.createElement('p')
  p.textContent = text
  if (className) p.className = className
  return p
}
