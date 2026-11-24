import type { Direction } from './game'

export type KeyboardHandlers = {
  turn: (dir: Direction) => void
  pause: () => void
  enter: () => void
}

const TURN_KEYS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
}

/** Listens for game keys on the window. Returns a function that stops listening. */
export function attachKeyboard(handlers: KeyboardHandlers): () => void {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    // A focused button handles its own Enter/Space as a click; don't do it twice.
    const onButton = e.target instanceof HTMLButtonElement
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key

    const dir = TURN_KEYS[key]
    if (dir) {
      e.preventDefault() // stop arrow keys scrolling the page
      handlers.turn(dir)
      return
    }
    if ((key === ' ' || key === 'p') && !(onButton && key === ' ')) {
      e.preventDefault()
      if (!e.repeat) handlers.pause()
      return
    }
    if (key === 'Enter' && !onButton) {
      e.preventDefault()
      if (!e.repeat) handlers.enter()
    }
  }
  window.addEventListener('keydown', onKeyDown)
  return () => window.removeEventListener('keydown', onKeyDown)
}
