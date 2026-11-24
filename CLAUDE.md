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
