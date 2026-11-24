import './style.css'
import {
  createInitialState,
  createRng,
  queueTurn,
  startGame,
  step,
  togglePause,
  type GameState,
} from './game'
import { attachKeyboard } from './input'
import { consumeTime } from './loop'
import { createOverlay } from './overlay'
import { drawGame, fitCanvas, readPalette } from './render'

/** Moves per second. Fixed for now; the speed-up arrives in slice 4. */
const MOVES_PER_SECOND = 7

function must<T>(value: T | null, what: string): T {
  if (value === null) throw new Error(`Missing ${what}`)
  return value
}

const canvas = must(document.querySelector<HTMLCanvasElement>('#board'), '#board')
const overlayEl = must(document.querySelector<HTMLElement>('#overlay'), '#overlay')
const ctx = must(canvas.getContext('2d'), '2D canvas support')
const palette = readPalette(canvas)

// The seed is the only wall-clock value, and it's used once, outside the game logic.
const rng = createRng(Date.now())
let state: GameState = createInitialState(rng)
let accMs = 0
let lastFrame = performance.now()

const updateOverlay = createOverlay(overlayEl, {
  start: () => setState(startGame(state)),
  resume: () => setState(togglePause(state)),
  playAgain: newGame,
})

function setState(next: GameState): void {
  if (next.status !== state.status) accMs = 0 // a fresh start or resume never "catches up"
  state = next
  updateOverlay(state)
}

/** A fresh game that starts straight away. */
function newGame(): void {
  setState(startGame(createInitialState(rng)))
}

attachKeyboard({
  turn: (dir) => {
    if (state.status === 'playing') setState(queueTurn(state, dir))
  },
  pause: () => setState(togglePause(state)),
  enter: () => {
    if (state.status === 'ready') setState(startGame(state))
    else if (state.status !== 'playing') newGame()
  },
})

function frame(now: number): void {
  const elapsed = now - lastFrame
  lastFrame = now

  if (state.status === 'playing') {
    const clock = consumeTime(accMs, elapsed, 1000 / MOVES_PER_SECOND)
    let next = state
    for (let i = 0; i < clock.ticks && next.status === 'playing'; i++) next = step(next, rng)
    setState(next)
    accMs = clock.accMs
  }

  fitCanvas(canvas)
  drawGame(ctx, state, palette)
  requestAnimationFrame(frame)
}

updateOverlay(state)
requestAnimationFrame(frame)
