import type { Direction } from './game'
import { swipeDirection } from './swipe'

/**
 * Swipes on the board. After each recognised swipe the start point moves to where the
 * finger is now, so one drag can chain turns (an L-shaped swipe = two turns).
 */
export function attachSwipe(area: HTMLElement, turn: (dir: Direction) => void): void {
  let start: { id: number; x: number; y: number } | null = null

  area.addEventListener('pointerdown', (e) => {
    if (e.target instanceof HTMLButtonElement) return // let overlay buttons work normally
    start = { id: e.pointerId, x: e.clientX, y: e.clientY }
  })

  area.addEventListener('pointermove', (e) => {
    if (!start || e.pointerId !== start.id) return
    const dir = swipeDirection(e.clientX - start.x, e.clientY - start.y)
    if (!dir) return
    turn(dir)
    start = { id: e.pointerId, x: e.clientX, y: e.clientY }
  })

  const end = (e: PointerEvent) => {
    if (start && e.pointerId === start.id) start = null
  }
  area.addEventListener('pointerup', end)
  area.addEventListener('pointercancel', end)
}

/**
 * The on-screen direction pad. A touch turns on pointerdown, without waiting for release.
 * Keyboard users can still focus a pad button and press Enter or Space (a click with detail 0).
 */
export function attachDirectionPad(pad: HTMLElement, turn: (dir: Direction) => void): void {
  for (const button of pad.querySelectorAll<HTMLButtonElement>('button[data-dir]')) {
    const dir = button.dataset.dir
    if (dir !== 'up' && dir !== 'down' && dir !== 'left' && dir !== 'right') continue

    button.addEventListener('pointerdown', (e) => {
      e.preventDefault() // no focus ring or text selection from a thumb press
      turn(dir)
    })
    button.addEventListener('click', (e) => {
      if (e.detail === 0) turn(dir) // keyboard activation only; pointer presses were handled above
    })
  }
}
