---
description: After I approve a slice (or a change like 5b), log my note, commit it, and tag it
argument-hint: <slice: 5 or 5b> <one or two sentences: what surprised you, what the AI got wrong, what you changed>
---

I just approved a slice. Save a checkpoint for it. Arguments: `$ARGUMENTS`

1. The first word of the arguments is the slice id (S): a number like `5`, or a number and a letter like `5b` for a change made between slices. Everything after it is my note. Use my note word for word. If there is no note, stop and ask for one; don't commit.
2. Find the title:
   - For a number, use slice S's title from the "Build slices" section of the plan file (`*-plan.md`).
   - For a number and a letter, use the title from that line under "Changes during the build" at the end of the plan. If the line isn't there, stop and tell me; don't commit.
3. If `package.json` has a `test` script, run the tests once (`npm test -- --run`) and record how many passed and failed. If there are no tests yet, write "No tests yet". If any test fails, stop and tell me; don't commit.
4. Measure the size: run `git add -A`, then `git diff --cached --shortstat`, and record files changed, lines added and lines removed. Leave out `package-lock.json` and anything under `dist/` or `node_modules/` from the line counts (say so if you left something out).
5. Append this section to the end of `build-log.md`, filling in the brackets:

   ```md
   ## Slice S · [title]
   - Date: [today, YYYY-MM-DD]
   - My note: [my note, word for word]
   - What changed: [2–4 short bullets, from the staged diff]
   - Problems and fixes: [each problem hit during this slice and how it was fixed, one short bullet each, taken from the review summary in this session: failing tests, type errors, bugs I reported, wrong guesses about the plan. Write "None" if there were none. Don't invent any.]
   - Lesson: [one sentence: the most useful takeaway from this slice for someone building along]
   - Plan changes: [the plan lines added or changed in this checkpoint, or "None"]
   - Tests: [result from step 3]
   - Size: [N files changed, +A / −R lines, from step 4]
   - Hand-coding estimate: [a rough range for how long a developer who knows the stack would take to write this slice by hand, e.g. "1–2 hours", with a few words on what drives it]
   ```

6. Commit everything: `git add -A` again (so `build-log.md` is included), then `git commit -m "Slice S: [title]"`. Then tag it: `git tag slice-S`.
7. Reply with only the short commit hash and the tag. Don't change any other files, and don't start the next slice.
