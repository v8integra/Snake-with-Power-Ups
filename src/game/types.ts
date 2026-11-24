export type Point = { x: number; y: number } // grid cells, 0–19
export type Direction = 'up' | 'down' | 'left' | 'right'
export type PowerUpKind = 'boost' | 'slowmo' | 'shrink'

export type GameStatus = 'ready' | 'playing' | 'paused' | 'over' | 'won'

export type GameState = {
  snake: Point[] // head first
  direction: Direction
  queuedTurns: Direction[] // at most 2
  food: Point
  powerUp: { kind: PowerUpKind; at: Point; ticksLeft: number } | null // on the board
  effect: { kind: 'boost' | 'slowmo'; ticksLeft: number } | null // active on the snake
  walls: Point[]
  score: number
  foodEaten: number
  growPending: number
  status: GameStatus
  tick: number
}

/** Returns a number in [0, 1). Always pass a seeded one into game logic. */
export type Rng = () => number
