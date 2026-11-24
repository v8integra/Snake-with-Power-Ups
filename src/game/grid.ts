import type { Direction, Point, Rng } from './types'

export const GRID_SIZE = 20

export function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y
}

export function isInside(p: Point): boolean {
  return p.x >= 0 && p.x < GRID_SIZE && p.y >= 0 && p.y < GRID_SIZE
}

export function containsPoint(points: readonly Point[], p: Point): boolean {
  return points.some((q) => samePoint(q, p))
}

const DELTAS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export function movePoint(p: Point, dir: Direction): Point {
  const d = DELTAS[dir]
  return { x: p.x + d.x, y: p.y + d.y }
}

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

export function opposite(dir: Direction): Direction {
  return OPPOSITE[dir]
}

/**
 * Picks a uniformly random cell that isn't in `occupied`, or null if the board is full.
 * Lists the free cells first, so it never loops and never lands on a taken cell.
 */
export function randomFreeCell(rng: Rng, occupied: readonly Point[]): Point | null {
  const taken = new Set(occupied.map((p) => p.y * GRID_SIZE + p.x))
  const free: Point[] = []
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!taken.has(y * GRID_SIZE + x)) free.push({ x, y })
    }
  }
  if (free.length === 0) return null
  return free[Math.floor(rng() * free.length)] ?? null
}
