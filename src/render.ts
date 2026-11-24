import { GRID_SIZE, type GameState, type Point } from './game'

export type Palette = {
  board: string
  boardAlt: string
  snake: string
  snakeHead: string
  food: string
  wall: string
}

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

export function drawGame(ctx: CanvasRenderingContext2D, state: GameState, palette: Palette): void {
  const size = ctx.canvas.width
  const cell = size / GRID_SIZE

  // Board with a faint checkerboard so cells are easy to read.
  ctx.fillStyle = palette.board
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = palette.boardAlt
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = (y % 2); x < GRID_SIZE; x += 2) {
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
}

function fillCell(ctx: CanvasRenderingContext2D, p: Point, cell: number, inset: number): void {
  ctx.fillRect(p.x * cell + inset, p.y * cell + inset, cell - inset * 2, cell - inset * 2)
}
