# Snake With Power-Ups: Build Plan

Build-along #2 · Game · Difficulty: Easy · Target release: Sat Nov 28, 2026

## Goal

A classic snake game that runs in the browser, with three power-ups, a wall layout that shows up as you get better, and a local high-score table. Keyboard on desktop, swipes or an on-screen pad on a phone. No accounts, no server.

**One sentence:** For anyone with five spare minutes, it's a quick, fair snake game with a twist, so they can chase a better high score.

## How to work (instructions for Claude Code)

1. Read this whole plan first. Then build **one slice at a time**, in the order under "Build slices".
2. After each slice, stop and summarize what changed, any problems you hit and how you fixed them, and how to test it. Wait for my OK before the next slice.
3. Keep changes small and focused. Don't add features from "Not in this version".
4. Write tests for the game rules before or alongside the code (slice 2 and slice 5).
5. If anything in this plan is unclear or seems wrong, ask instead of guessing.
6. I'm on Windows. Use commands that work in PowerShell.
7. `CLAUDE.md` already exists. Keep it as it is; don't recreate it in slice 1.

## Must have

- A snake on a 20 × 20 grid that moves on its own; the arrow keys and WASD turn it.
- Food: eating it grows the snake by one and scores 10 points.
- Game over when the snake hits a wall or itself.
- The game speeds up a little every 5 food, up to a maximum speed.
- A fixed layout of inner walls appears once the score reaches 100.
- Three power-ups (see "Power-up rules"): **Boost**, **Slow-mo** and **Shrink**.
- Start, pause (Space or P) and restart (Enter), with a clear message for each state.
- Top 5 high scores saved in localStorage, with the date.
- Works on a phone: swipe on the board, or use an on-screen direction pad.
- Light and dark mode, following the system setting.

## Not in this version

- Sound and music.
- Online leaderboards, accounts or sharing.
- More than one wall layout, a level editor, or skins.
- Two-player mode.
- Power-ups beyond the three listed (note new ideas as future work only).

## Tech stack

- Vite + TypeScript, **no UI framework**: the board is an HTML `<canvas>`, menus and scores are plain HTML.
- Vitest for tests.
- No other dependencies without asking me first.

## Data model

```ts
type Point = { x: number; y: number };           // grid cells, 0–19
type Direction = 'up' | 'down' | 'left' | 'right';
type PowerUpKind = 'boost' | 'slowmo' | 'shrink';

type GameState = {
  snake: Point[];                // head first
  direction: Direction;
  queuedTurns: Direction[];      // at most 2, see "Movement rules"
  food: Point;
  powerUp: { kind: PowerUpKind; at: Point; ticksLeft: number } | null; // on the board
  effect: { kind: 'boost' | 'slowmo'; ticksLeft: number } | null;      // active on the snake
  walls: Point[];
  score: number;
  foodEaten: number;
  growPending: number;
  status: 'ready' | 'playing' | 'paused' | 'over' | 'won';
  tick: number;
};

type HighScore = { score: number; date: string }; // date: local "YYYY-MM-DD"
type SavedData = { version: 1; highScores: HighScore[] };
```

- The game logic is a pure function: `step(state, rng) → state`. Randomness comes from a seeded random number generator passed in, so tests are repeatable.
- Time is counted in **ticks** (one snake move), never in wall-clock time, so pausing can't eat a power-up's time.
- Store high scores under one localStorage key: `snake:v1`. If saved data is missing or broken, start with an empty table and copy the broken text to `snake:v1:backup` first (the lesson from the habit tracker's 3b).

## Movement rules (put these in tests)

- Each tick the snake moves one cell in its direction.
- A turn straight back into the snake's neck (for example left while moving right) is ignored.
- Up to 2 turns can be queued between ticks, and each tick uses one. So pressing up then left quickly makes a clean U-turn over two ticks instead of dropping the second key. A turn that matches the current or last queued direction is ignored.
- Moving into the cell the tail is leaving is allowed, unless the snake is growing this tick (then the tail stays, and it's a collision).
- Hitting a wall or any other part of the snake ends the game. There's no wrap-around at the edges.

Test cases to include at minimum: moving in each direction; ignoring a reverse turn; two quick turns over two ticks; a third queued turn dropped; following its own tail (allowed); following its own tail while growing (game over); hitting each edge; hitting an inner wall; eating food grows by exactly 1.

## Food and power-up rules (put these in tests)

- Food and power-ups only spawn on free cells: not on the snake, a wall, or each other.
- If there's no free cell left for food, the player wins (`status: 'won'`).
- A power-up appears after every 4th food, if none is on the board. It disappears after 40 ticks if it isn't eaten.
- **Boost:** for 50 ticks the snake moves at 1.5× speed and food scores 20 instead of 10.
- **Slow-mo:** for 50 ticks the snake moves at 0.6× speed. Points are normal.
- **Shrink:** removes up to 3 tail segments at once, but never shortens the snake below 3.
- Only one timed effect at a time: taking Boost or Slow-mo replaces the current effect and its timer.
- Speed: starts at 7 moves per second and goes up by 0.5 every 5 food, to a maximum of 14. Boost and Slow-mo multiply the current speed.
- The inner walls appear on the tick the score first reaches 100 or more (Boost can jump from 90 to 110). If a wall would land on the snake or the food, that wall cell waits until the cell is free.

Test cases: spawning never lands on an occupied cell (seeded, many runs); win when the board is full; a power-up expiring after 40 ticks; Boost doubling food points; Shrink at length 4 (goes to 3) and length 10 (goes to 7); a new effect replacing the old one; pausing doesn't change any timer; speed capped at 14; walls appearing at 100 (and when Boost jumps past it) and waiting for a blocked cell.

## High scores (put these in tests)

- Only saved at game over (or on a win).
- Keep the top 5. A score that ties an existing one goes below it (the earlier score stays above).
- A score of 0 is never saved.

## Screens

1. **Game** (the only page)
   - The square board, as large as fits the screen, sharp on high-density displays.
   - Above it: the score, the best score, and the active effect with a bar showing its time left.
   - Overlays on the board for Ready ("Press Enter or tap to start"), Paused and Game over (score, "New high score!" when it is one, and "Play again").
   - On phones: an on-screen direction pad below the board, with a Pause button beside it (it also resumes). Swiping on the board also turns the snake.
   - Each power-up has its own color **and** a symbol (B for Boost, S for Slow-mo, − for Shrink), so color isn't the only clue.
2. **High scores** (a panel opened from the game screen): the top 5 with dates, and a button to clear them (with a confirm step).

## Build slices (in order)

1. **Project setup.** Vite + TypeScript (no framework), Vitest, a blank page with a canvas, `npm run dev`, `npm test` and `npm run typecheck` all working.
2. **Core game logic.** Pure `step()` and helpers in `src/game/` with the movement tests above. Seeded random number generator. No drawing yet.
3. **Playable game.** A fixed-timestep game loop, drawing the board on the canvas, keyboard controls, and the Ready, Paused and Game over states.
4. **Scoring and difficulty.** Score display, the speed-up every 5 food, and the inner walls at 100, with tests.
5. **Power-up logic.** Spawning, expiring, the three effects and their timers, with the tests above. Nothing drawn yet.
6. **Power-ups on screen.** Draw the power-ups with their symbols, the effect bar, and a short flash when one is taken.
7. **High scores.** `src/storage.ts` with safe handling of missing or broken data, the high-score panel, and "New high score!", with tests.
8. **Phone controls.** Swipe on the board, the on-screen direction pad, and a layout that fits a 375 px wide screen.
9. **Polish.** Dark mode, auto-pause when the tab is hidden, screen reader announcements for score changes and game over, keyboard focus, and "reduce motion" respected.
10. **Ship.** A production build, deploy steps for GitHub Pages, and a README with how to play and how to run it.

## Definition of done

- All tests pass with `npm test`.
- No TypeScript errors, and no console errors in the browser.
- The game runs smoothly at 60 frames per second, and the snake's speed doesn't depend on the screen's refresh rate.
- High scores survive a page refresh.
- Fully playable at 375 px wide with touch, and at 1440 px wide with the keyboard.
- Every button can be used with the keyboard and has an accessible label.

## Suggested CLAUDE.md

```md
# Snake With Power-Ups

## Commands
- Dev server: npm run dev
- Tests: npm test
- Type check: npm run typecheck
- Build: npm run build

## Rules
- TypeScript strict mode. No `any`.
- Game rules live in src/game as pure functions with tests. Drawing and input stay out of src/game.
- Time is counted in ticks, never wall-clock time, inside the game logic.
- Randomness always comes from the seeded generator passed in.
- No new dependencies without asking.
- Build one slice at a time and stop for review after each.
- After I approve a slice, I run /checkpoint, which commits it. Don't commit on your own.

## Each slice
- When I say "let's do slice N", start with a short kickoff before writing any code: the slice's goal in one sentence, its tasks from the plan as a checklist, and the files you expect to create or change. Then build it.
- When something goes wrong (a failing test, a type error, a bug I report, a wrong guess about the plan), say so plainly in one line before you fix it: what broke and why. Don't fix things silently.
- When you stop for review, list any problems you hit and how you fixed them, or say there were none.

## Changes during the build
- The plan (`snake-with-power-ups-plan.md`) is the source of truth. When I ask for something the plan doesn't cover, or that changes it, don't build it yet. First propose the exact plan edit, and add a line under "Changes during the build": `- Nb · <short title>: <one sentence>, from my slice N note`.
- Wait for my OK on the plan edit, then build only that change and stop. I'll run `/checkpoint Nb` for it.
- Never fold a change into the next numbered slice.
```

## Notes for the video (not for Claude Code)

- **Hook (first 20 seconds):** a long run with a Boost active and the walls closing in, then "Let's build this from scratch with Claude Code."
- **Moments to show on screen:** the tail-following test (the classic snake bug); the queued-turn rule (pressing two keys fast); why ticks instead of seconds matters when you pause; testing on a phone with swipes.
- **Shorts from this build:** "The snake bug almost every clone has" (the tail and growing rule) and "Why my game counts ticks, not seconds."
- **End screen:** link to the Habit Tracker build and the next build-along.
- **Before recording:**
  - Commit `CLAUDE.md` and the updated `.claude/commands/checkpoint.md` (with Problems and fixes, Lesson, Size and Hand-coding estimate) in the build folder first. Last time, uncommitted setup files were lost before the recording.
  - Start a brand-new Claude Code session in the build folder, opened on that folder from the start (last time the session began in a scratch folder and moved, which put a path with my username on screen).
  - Keep OBS's default file name. Close file dialogs and the Chrome bookmarks bar, or keep them out of frame.
  - Record a 45-second demo of the finished game at the end.

## Changes during the build

<!-- One line each: `- Nb · <title>: <what changed>, from my slice N note` -->
- 8b · Phone pause button: a Pause/Resume button beside the direction pad on touch screens, since phones have no Space or P key, from my slice 8 note
