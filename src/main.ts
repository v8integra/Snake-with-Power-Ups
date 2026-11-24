import './style.css'
import {
  bestScore,
  createInitialState,
  createRng,
  localDate,
  movesPerSecond,
  queueTurn,
  recordScore,
  startGame,
  step,
  takenPowerUp,
  togglePause,
  type GameState,
  type HighScore,
  type Point,
  type PowerUpKind,
} from './game'
import { createHud } from './hud'
import { attachKeyboard } from './input'
import { consumeTime } from './loop'
import { createOverlay } from './overlay'
import { drawGame, fitCanvas, readPalette, type Flash } from './render'
import { createScoresPanel } from './scoresPanel'
import { browserStore, loadHighScores, saveHighScores } from './storage'

/** How long the pickup flash lasts. Visual only, so wall-clock time is fine here. */
const FLASH_MS = 300

function must<T>(value: T | null, what: string): T {
  if (value === null) throw new Error(`Missing ${what}`)
  return value
}
const byId = (id: string) => must(document.getElementById(id), `#${id}`)
const byIdAs = <T extends HTMLElement>(id: string, type: new () => T): T => {
  const el = byId(id)
  if (!(el instanceof type)) throw new Error(`#${id} is the wrong kind of element`)
  return el
}

const canvas = must(document.querySelector<HTMLCanvasElement>('#board'), '#board')
const ctx = must(canvas.getContext('2d'), '2D canvas support')
const palette = readPalette(canvas)

// The seed is the only wall-clock value, and it's used once, outside the game logic.
const rng = createRng(Date.now())
let state: GameState = createInitialState(rng)
let accMs = 0
let lastFrame = performance.now()
let flash: { kind: PowerUpKind; at: Point; startMs: number } | null = null

// High scores live in localStorage. If it's blocked, the game still runs with an empty table.
const store = browserStore()
let highScores: HighScore[] = store ? loadHighScores(store) : []
/** Whether the game that just ended made the top 5. */
let madeHighScores = false

const updateHud = createHud({
  score: byId('score'),
  best: byId('best'),
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

const scoresPanel = createScoresPanel(
  {
    dialog: byIdAs('scores-panel', HTMLDialogElement),
    body: byId('scores-body'),
    empty: byId('scores-empty'),
    actions: byId('panel-actions'),
    clear: byIdAs('clear-scores', HTMLButtonElement),
    close: byIdAs('close-scores', HTMLButtonElement),
    confirm: byId('confirm-clear'),
    confirmYes: byIdAs('confirm-yes', HTMLButtonElement),
    confirmNo: byIdAs('confirm-no', HTMLButtonElement),
  },
  () => {
    highScores = []
    if (store) saveHighScores(store, highScores)
    updateHud(state, bestScore(highScores))
    return highScores
  },
)

byId('open-scores').addEventListener('click', () => {
  if (state.status === 'playing') setState(togglePause(state))
  scoresPanel.open(highScores)
})

function setState(next: GameState): void {
  const ended = next.status !== state.status && (next.status === 'over' || next.status === 'won')
  if (next.status !== state.status) accMs = 0 // a fresh start or resume never "catches up"
  state = next
  if (ended) recordFinishedGame()
  updateOverlay(state, madeHighScores)
  updateHud(state, bestScore(highScores))
}

/** Scores are only saved here, when a game ends (game over or a win). */
function recordFinishedGame(): void {
  const result = recordScore(highScores, { score: state.score, date: localDate(new Date()) })
  madeHighScores = result.rank !== null
  if (madeHighScores) {
    highScores = result.highScores
    if (store) saveHighScores(store, highScores)
  }
}

/** A fresh game that starts straight away. */
function newGame(): void {
  flash = null
  setState(startGame(createInitialState(rng)))
}

// Game keys do nothing while the high-scores panel is open.
attachKeyboard({
  turn: (dir) => {
    if (!scoresPanel.isOpen() && state.status === 'playing') setState(queueTurn(state, dir))
  },
  pause: () => {
    if (!scoresPanel.isOpen()) setState(togglePause(state))
  },
  enter: () => {
    if (scoresPanel.isOpen()) return
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
