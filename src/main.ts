import './style.css'
import { createAnnouncer, endMessage, scoreMessage } from './announce'
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
  type Direction,
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
import { attachDirectionPad, attachSwipe, showPauseButton } from './touch'

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
let palette = readPalette(canvas)

// Dark mode: CSS swaps the colors; the canvas re-reads them when the system setting changes.
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  palette = readPalette(canvas)
})
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)')
const boardWrap = byId('board-wrap')
const announce = createAnnouncer(byId('announcer'))

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

const pauseButton = byIdAs('dpad-pause', HTMLButtonElement)

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
  const prev = state
  const ended = next.status !== prev.status && (next.status === 'over' || next.status === 'won')
  const nowPlaying = next.status === 'playing' && prev.status !== 'playing'
  if (next.status !== prev.status) accMs = 0 // a fresh start or resume never "catches up"
  state = next
  if (ended) recordFinishedGame()

  if (ended) announce(endMessage(state, madeHighScores))
  // Only gains are read out; a new game resetting to 0 isn't news.
  else if (state.score > prev.score) announce(scoreMessage(state.score))

  // Once play starts, keys belong to the game, not to whichever button was last clicked
  // (a focused button would take Space for itself instead of pausing).
  if (nowPlaying && !scoresPanel.isOpen()) boardWrap.focus({ preventScroll: true })

  updateOverlay(state, madeHighScores)
  updateHud(state, bestScore(highScores))
  showPauseButton(pauseButton, state.status)
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

/** Turns from any input (keys, swipe, pad) only count while playing and the panel is closed. */
function turn(dir: Direction): void {
  if (!scoresPanel.isOpen() && state.status === 'playing') setState(queueTurn(state, dir))
}

// Leaving the tab pauses the game, so a hidden tab never plays on without you.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.status === 'playing') setState(togglePause(state))
})

attachSwipe(boardWrap, turn)
attachDirectionPad(byId('dpad'), turn)
pauseButton.addEventListener('click', () => {
  if (!scoresPanel.isOpen()) setState(togglePause(state))
})

// Game keys do nothing while the high-scores panel is open.
attachKeyboard({
  turn,
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
      // With "reduce motion" on, there's no flash; the effect bar still shows what changed.
      if (taken && !reduceMotion.matches) flash = { ...taken, startMs: now }
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
