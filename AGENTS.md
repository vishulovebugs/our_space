# AGENTS.md

Guidelines for anyone — human or AI agent — working in this repository.
The prime directive: **keep the codebase simple.** Complexity is the default
failure mode; simplicity must be chosen deliberately, every time.

## Ponytail's anti-over-engineering principles

1. **Solve the problem you have**, not the one you might have someday.
   YAGNI is not a suggestion — it is the rule.
2. **No speculative abstractions.** No interfaces, factories, plugin systems,
   strategy patterns, or base classes with exactly one implementation. If a
   second implementation never arrives, you built dead code with extra steps.
3. **Rule of three.** Duplicating a small piece of logic three times is cheaper
   than maintaining the wrong abstraction forever. Generalize only after the
   pattern proves itself.
4. **Every layer of indirection must earn its keep.** If you can't say in one
   sentence why a wrapper, adapter, or "provider" exists, delete it.
5. **If it fits on one screen, don't split it.** Small functions spread across
   files are often harder to understand than one honest, readable block.
6. **The deletion test.** If removing a piece of code/structure wouldn't break
   anything, it was over-engineering. Delete it.
7. **Working > correct-looking > elegant.** Ship the boring version that works.
   You can always make it nicer later; you can rarely make it simpler later.
8. **Prefer data over logic.** A lookup table or a plain object beats a class
   hierarchy doing the same job.

## Dependencies

- **Default to zero dependencies.** The standard library and platform built-ins
  come first.
- Add a dependency only when ALL of these hold:
  - It solves a genuinely nontrivial, well-understood problem (crypto, DB
    drivers, parsing a complex format — not one-liners).
  - It is actively maintained and widely used.
  - It is smaller than the code you would have to write and maintain instead.
- **Never** add packages for trivial utilities (deep clone, simple string or
  date formatting, tiny helpers you can write in ten lines).
- Never add a package to solve a problem you haven't actually hit yet.
- Before adding anything, check what the project already uses: **one library
  per job**, not five overlapping ones.
- Removing a dependency is a contribution, same as fixing a bug.

## Workflow rules

- Make the fewest changes that address the task. Do not refactor, reformat, or
  "improve" unrelated code.
- Match the existing conventions of the file you are editing; this repo's style
  beats your personal style.
- No new config files, build steps, frameworks, or tooling without a
  demonstrated, concrete need stated in the change.
- Verify your work: run the project's typecheck and relevant tests before
  declaring a change done.
- When in doubt between two options, pick the one that is easier to delete.
