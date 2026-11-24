import { GRID_SIZE, type GameState, type Point, type PowerUpKind } from './game'

export type Palette = {
  board: string
  boardAlt: string
  snake: string
  snakeHead: string
  food: string
  wall: string
  powerUp: Record<PowerUpKind, string>
  powerUpText: string
}

/** Each power-up has a symbol as well as a color, so color is never the only clue. */
export const POWERUP_SYMBOL: Record<PowerUpKind, string> = {
  boost: 'B',
  slowmo: 'S',
  shrink: '−', // a real minus sign, not a hyphen
}

/** A short burst drawn when a power-up is taken. `progress` runs from 0 to 1. */
export type Flash = { kind: PowerUpKind; at: Point; progress: number }

/** Colors come from CSS variables on the canvas, so themes live in CSS. */
export function readPalette(el: Element): Palette {
  const css = getComputedStyle(el)
  const v = (name: string) => css.getPropertyValue(name).trim()
  return {
    board: v('--board'),
    boardAlt: v('--board-alt'),
    snake: v('--snake'),
    snakeHead: v('--snake-head'),
    food: v('--food'),
    wall: v('--wall'),
    powerUp: { boost: v('--boost'), slowmo: v('--slowmo'), shrink: v('--shrink') },
    powerUpText: v('--powerup-text'),
  }
}

/** Matches the canvas's pixel size to its on-screen size times the device pixel ratio, so it stays sharp. */
export function fitCanvas(canvas: HTMLCanvasElement): void {
  const dpr = window.devicePixelRatio || 1
  const size = Math.max(1, Math.round(canvas.clientWidth * dpr))
  if (canvas.width !== size || canvas.height !== size) {
    canvas.width = size
    canvas.height = size
  }
}

export function drawGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  palette: Palette,
  flash: Flash | null = null,
): void {
  const size = ctx.canvas.width
  const cell = size / GRID_SIZE

  // Board with a faint checkerboard so cells are easy to read.
  ctx.fillStyle = palette.board
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = palette.boardAlt
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = y % 2; x < GRID_SIZE; x += 2) {
      ctx.fillRect(x * cell, y * cell, cell, cell)
    }
  }

  ctx.fillStyle = palette.wall
  for (const w of state.walls) fillCell(ctx, w, cell, 0)

  // Food: a circle.
  ctx.fillStyle = palette.food
  ctx.beginPath()
  ctx.arc((state.food.x + 0.5) * cell, (state.food.y + 0.5) * cell, cell * 0.36, 0, Math.PI * 2)
  ctx.fill()

  if (state.powerUp) drawPowerUp(ctx, state.powerUp.kind, state.powerUp.at, cell, palette)

  // Snake: body first, then the head on top in a darker shade.
  ctx.fillStyle = palette.snake
  for (let i = state.snake.length - 1; i >= 1; i--) {
    const p = state.snake[i]
    if (p) fillCell(ctx, p, cell, cell * 0.08)
  }
  const head = state.snake[0]
  if (head) {
    ctx.fillStyle = palette.snakeHead
    fillCell(ctx, head, cell, cell * 0.04)
  }

  if (flash) drawFlash(ctx, flash, cell, palette)
}

/** A rounded tile in the power-up's color with its symbol in the middle. */
function drawPowerUp(ctx: CanvasRenderingContext2D, kind: PowerUpKind, at: Point, cell: number, palette: Palette): void {
  const inset = cell * 0.06
  ctx.fillStyle = palette.powerUp[kind]
  ctx.beginPath()
  ctx.roundRect(at.x * cell + inset, at.y * cell + inset, cell - inset * 2, cell - inset * 2, cell * 0.22)
  ctx.fill()

  ctx.fillStyle = palette.powerUpText
  ctx.font = `700 ${Math.round(cell * 0.62)}px system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(POWERUP_SYMBOL[kind], (at.x + 0.5) * cell, (at.y + 0.53) * cell)
}

/** A quick tint over the board plus a ring spreading out from where the power-up was. */
function drawFlash(ctx: CanvasRenderingContext2D, flash: Flash, cell: number, palette: Palette): void {
  const fade = 1 - flash.progress
  const color = palette.powerUp[flash.kind]
  ctx.save()

  ctx.globalAlpha = 0.18 * fade
  ctx.fillStyle = color
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  ctx.globalAlpha = fade
  ctx.strokeStyle = color
  ctx.lineWidth = cell * 0.18
  ctx.beginPath()
  ctx.arc((flash.at.x + 0.5) * cell, (flash.at.y + 0.5) * cell, cell * (0.5 + flash.progress * 2.5), 0, Math.PI * 2)
  ctx.stroke()

  ctx.restore()
}

function fillCell(ctx: CanvasRenderingContext2D, p: Point, cell: number, inset: number): void {
  ctx.fillRect(p.x * cell + inset, p.y * cell + inset, cell - inset * 2, cell - inset * 2)
}
