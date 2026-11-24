# Build log: Snake With Power-Ups

One entry per slice, added by `/checkpoint` after each slice is approved. Changes between slices get their own entry (5b, 5c). The notes are what make the episode: what surprised me, what the AI got wrong, what I changed.

## Slice 1 · Project setup
- Date: 2026-11-24
- My note: Everything looks good
- What changed:
  - Vite + TypeScript (strict, no framework) with Vitest; scripts for dev, test, typecheck, build and preview
  - One `tsconfig.json` instead of three, so `vite.config.ts` needs no `@types/node`
  - Blank page with a square `<canvas>` board, and a placeholder smoke test
  - `.gitignore` for `node_modules` and `dist`
- Problems and fixes: None
- Lesson: Keep setup to just what the plan names (three dev dependencies) and prove every script runs before writing any game code.
- Plan changes: None
- Tests: 1 passed, 0 failed
- Size: 9 files changed, +144 / −0 lines (package-lock.json left out: +1585)
- Hand-coding estimate: 15–30 minutes; mostly scaffolding Vite and getting the TypeScript and Vitest config right

## Slice 2 · Core game logic
- Date: 2026-11-24
- My note: Code loks good, lets continue
- What changed:
  - Pure `step(state, rng)` in `src/game/`: one move per tick, turn queue (max 2), edge/wall/self collision, food growth and respawn, win on a full board
  - Seeded random generator (mulberry32) and `randomFreeCell`, which picks from a list of free cells so it never lands on a taken one
  - Plan data model as TypeScript types, plus `createInitialState` (length 3, centered, heading right)
  - 28 tests covering every movement rule in the plan; placeholder smoke test removed
- Problems and fixes:
  - The first shell command that wrote the test files failed with a quoting error (apostrophes inside the heredoc); rewrote them with the file tool, nothing lost
  - The first deliberate-bug check of the tail test was too broad (the snake never dropped its tail, 6 tests failed); narrowed it to the collision check alone, which failed exactly the tail-follow test
- Lesson: Break a rule on purpose to prove its test actually guards it; the tail-follow test only counts if removing the "skip the tail" check turns it red.
- Plan changes: None
- Tests: 28 passed, 0 failed
- Size: 11 files changed, +422 / −8 lines
- Hand-coding estimate: 2–3 hours; mostly the turn queue and tail-collision edge cases and writing the tests for them

## Slice 3 · Playable game
- Date: 2026-11-24
- My note: Everything looks good. Game has correct controls
- What changed:
  - Fixed-timestep clock (`src/loop.ts`) so speed doesn't depend on refresh rate; long gaps capped at 250 ms
  - Canvas renderer with high-DPI sizing and colors from CSS variables
  - Keyboard controls (arrows/WASD, Space/P, Enter) and Ready/Paused/Game over/Win overlays; tap to start or resume
  - Pure `startGame`/`togglePause` rules with tests, including "pausing changes nothing"
- Problems and fixes:
  - The first draft of the loop test counted ticks over exactly 1 s, right on a tick boundary where float rounding could give 6; changed it to 1.1 s before running
  - Two edits were refused because the files had been written by shell commands and not read yet; read them first, nothing broke
- Lesson: Count game time in ticks fed by a fixed-timestep clock, and test the clock at several refresh rates; that's what keeps a 144 Hz monitor from playing a faster game.
- Plan changes: None
- Tests: 42 passed, 0 failed
- Size: 11 files changed, +469 / −16 lines
- Hand-coding estimate: 2–3 hours; mostly the game loop, high-DPI canvas sizing, and getting Enter/Space right on focused buttons
