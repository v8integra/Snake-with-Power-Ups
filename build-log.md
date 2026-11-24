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

## Slice 4 · Scoring and difficulty
- Date: 2026-11-24
- My note: Everything looks good. Lets continue
- What changed:
  - Score shown above the board
  - `movesPerSecond`: 7, +0.5 every 5 food, capped at 14; the game loop now uses it
  - Inner walls (four corner brackets, 32 cells) placed once the score reaches 100; cells under the snake, food or a power-up wait for a later tick, with no new state field
  - 17 new tests for speed steps, the cap, walls at exactly 100, jumping past 100, and blocked cells waiting
  - Code was committed by hand as f129eae; this commit adds the log entry and the tag
- Problems and fixes:
  - The first browser preview of the wall layout was drawn over by the running game loop within a frame; drew it on a separate temporary canvas instead
  - A `Missing #score` console error came from a hot reload of main.ts that ran before the index.html edit landed; a full reload showed no new error
  - The kickoff said the layout had 36 cells; it has 32 (each bracket's arms share the corner cell)
- Lesson: Derive state you can already compute (walls are switched on once score >= 100, and score never goes down) instead of adding a field that can get out of sync.
- Plan changes: None
- Tests: 59 passed, 0 failed
- Size: 9 files changed, +199 / −6 lines (from f129eae)
- Hand-coding estimate: 1–2 hours; mostly choosing a fair wall layout and the rule for wall cells that are blocked

## Slice 5 · Power-up logic
- Date: 2026-11-24
- My note: The code is looking good. Everything is clean. Game is running good.
- What changed:
  - `src/game/powerups.ts`: spawn after every 4th food on a free cell, expire after 40 ticks, Boost (1.5×, food 20), Slow-mo (0.6×), Shrink (−3, never below 3); a new effect replaces the old one
  - `step()` scores food with the effect active that tick, then runs the power-up update and wall placement
  - Speed split into `baseSpeed` (capped at 14) and `movesPerSecond` (times the effect), so Boost at the cap gives 21
  - 27 new tests covering every power-up case in the plan, plus spawn timing, exact 50-tick effects and timers frozen while paused
  - Code was committed by hand as c674479; this commit adds the log entry and the tag
- Problems and fixes:
  - Two first-draft tests (40-tick expiry, 50-tick effect) let the snake wander or run off the board; replaced with a helper that keeps a length-3 snake circling a 2x2 square
  - Type error: an unused `pts` import left in the power-up tests after that rewrite; removed it
  - A console error ("step.ts does not provide FOOD_POINTS") came from a hot reload between two edits while the constant moved; a full reload ran clean
- Lesson: Pin down tick order before writing timer tests (effects count the tick they were used on; power-ups age after the pickup check), because "lasts 50 ticks" means nothing until you say which 50.
- Plan changes: None
- Tests: 86 passed, 0 failed
- Size: 7 files changed, +333 / −16 lines (from c674479)
- Hand-coding estimate: 2–3 hours; mostly the timer order and writing tests that keep the snake alive long enough to measure them

## Slice 6 · Power-ups on screen
- Date: 2026-11-24
- My note: Everything looking good. Boosts are working correctly.
- What changed:
  - Power-ups drawn as rounded tiles with a color and a symbol: B (Boost, amber), S (Slow-mo, blue), − (Shrink, purple)
  - New `src/hud.ts`: score plus the active effect's name and a progress bar for its time left; the effect keeps its space when hidden so the score never shifts
  - Pickup flash (board tint plus a spreading ring, about 300 ms), triggered by a pure `takenPowerUp(prev, next)` with 4 tests
  - Code was committed by hand as 1ce33fd; this commit adds the log entry and the tag
- Problems and fixes:
  - The first Boost color (#c97a00) was about 3:1 contrast for the small "Boost" label; darkened it to #a85f00 (about 4.5:1) before checking
- Lesson: Give every color-coded thing a second clue (a letter, a label) and check small text against its background, not just the big shapes.
- Plan changes: None
- Tests: 90 passed, 0 failed
- Size: 8 files changed, +245 / −15 lines (from 1ce33fd)
- Hand-coding estimate: 1–2 hours; mostly canvas text placement, the HUD layout, and timing the flash

## Slice 7 · High scores
- Date: 2026-11-24
- My note: Everything looks good. High score is showing. Delete works correctly.
- What changed:
  - `recordScore` in `src/game/highscores.ts`: top 5, ties go below, 0 never saved; scores only recorded when a game ends
  - `src/storage.ts`: one `snake:v1` key in a versioned format; missing data gives an empty table, broken data is copied to `snake:v1:backup` first, and blocked storage never throws
  - High-scores panel (modal dialog) with rank, score and date, and a Clear button with a confirm step; opening it mid-game pauses the game
  - "New high score!" on Game over and "Best" next to Score; 25 new tests with a fake localStorage
- Problems and fixes:
  - A console error (`Cannot set properties of undefined`) came from a hot reload between the hud.ts and main.ts edits; a full reload ran clean
  - A saved button reference went stale after a page reload mid-check; clicked the button from the page instead
- Lesson: Pass storage in as a parameter so tests can hand it broken, missing and blocked data; that's where save code actually fails.
- Plan changes: None
- Tests: 115 passed, 0 failed
- Size: 11 files changed, +579 / −17 lines
- Hand-coding estimate: 2–3 hours; mostly the broken-data handling and the dialog's focus and confirm flow

## Slice 8 · Phone controls
- Date: 2026-11-24
- My note: Code looks clean. Yes, propse slice 8b
- What changed:
  - `swipeDirection` (20 px threshold, longer axis wins) with 8 tests; swipes on the board chain, so an L-shaped drag makes two turns
  - On-screen direction pad on touch screens: turns on touch-down, still usable from the keyboard
  - Keys, swipes and the pad share one `turn()`; the layout fits 375 px wide (board 343 px at 375×812, 319 px at 375×667) with no sideways scroll
  - Touch hints on phones in place of the keyboard ones
- Problems and fixes:
  - Two CSS mistakes caught before testing: a stray `--chrome` line, and a `vh` fallback that can't work because custom properties always use their last declaration; kept `dvh` only
  - At 375 px with 4-digit scores, "Slow-mo" wrapped onto two lines and pushed the board down; stopped the wrap and tightened narrow-screen spacing
  - The first U-turn swipe test ran after the snake had already hit a wall; restarted and swiped in the same step
- Lesson: Test the narrow layout with the longest real content (4-digit scores, the longest effect name), not the empty start screen; that's where it breaks.
- Plan changes: None (phone pause proposed as 8b)
- Tests: 123 passed, 0 failed
- Size: 7 files changed, +226 / −9 lines
- Hand-coding estimate: 2–3 hours; mostly pointer-event handling and fitting the board, HUD and pad on small screens
