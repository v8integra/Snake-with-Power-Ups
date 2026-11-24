import './style.css'
import {
  createInitialState,
  createRng,
  movesPerSecond,
  queueTurn,
  startGame,
  step,
  takenPowerUp,
  togglePause,
  type GameState,
  type Point,
  type PowerUpKind,
} from './game'
import { createHud } from './hud'
import { attachKeyboard } from './input'
import { consumeTime } from './loop'
import { createOverlay } from './overlay'
import { drawGame, fitCanvas, readPalette, type Flash } from './render'

/** How long the pickup flash lasts. Visual only, so wall-clock time is fine here. */
const FLASH_MS = 300

function must<T>(value: T | null, what: string): T {
  if (value === null) throw new Error(`Missing ${what}`)
  return value
}
const byId = (id: string) => must(document.getElementById(id), `#${id}`)

const canvas = must(document.querySelector<HTMLCanvasElement>('#board'), '#board')
const ctx = must(canvas.getContext('2d'), '2D canvas support')
const palette = readPalette(canvas)

// The seed is the only wall-clock value, and it's used once, outside the game logic.
const rng = createRng(Date.now())
let state: GameState = createInitialState(rng)
let accMs = 0
let lastFrame = performance.now()
let flash: { kind: PowerUpKind; at: Point; startMs: number } | null = null

const updateHud = createHud({
  score: byId('score'),
  effect: byId('effect'),
  effectName: byId('effect-name'),
  effectBar: byId('effect-bar'),
  effectFill: byId('effect-fill'),
})

const updateOverlay = createOverlay(byId('overlay'), {
  start: () => setState(startGame(state)),
  resume: () => setState(togglePause(state)),
  playAgain: newGame,
})

function setState(next: GameState): void {
  if (next.status !== state.status) accMs = 0 // a fresh start or resume never "catches up"
  state = next
  updateOverlay(state)
  updateHud(state)
}

/** A fresh game that starts straight away. */
function newGame(): void {
  flash = null
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
    // The speed is read before this frame's ticks; a speed-up starts on the next frame.
    const clock = consumeTime(accMs, elapsed, 1000 / movesPerSecond(state))
    let next = state
    for (let i = 0; i < clock.ticks && next.status === 'playing'; i++) {
      const prev = next
      next = step(prev, rng)
      const taken = takenPowerUp(prev, next)
      if (taken) flash = { ...taken, startMs: now }
    }
    setState(next)
    accMs = clock.accMs
  }

  let flashNow: Flash | null = null
  if (flash) {
    const progress = (now - flash.startMs) / FLASH_MS
    if (progress >= 1) flash = null
    else flashNow = { kind: flash.kind, at: flash.at, progress }
  }

  fitCanvas(canvas)
  drawGame(ctx, state, palette, flashNow)
  requestAnimationFrame(frame)
}

setState(state)
requestAnimationFrame(frame)
