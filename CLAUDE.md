# Avatar DND App

A standalone, D&D Beyond-style app for a homebrew Avatar campaign. Friends create characters,
play from the sheet, roll dice, and join campaigns with a shared game log. The GM also gets an NPC tool.

## Source of truth
- `reference/atla-homebrew-gmbinder.txt` (git-ignored, local only) is the ONLY source for Avatar rules and content.
- Do not substitute Avatar lore or Avatar Legends mechanics.
- Gaps gmbinder does not cover (armor, weapons, conditions, rests, SRD backgrounds, etc.) use base D&D 5e SRD
  rules, always tagged `source: 'Baseline 5e'` and labelled that way in the UI. gmbinder wins any conflict.
- Owner decisions are logged in the "Decisions log" at the top of `docs/RULES_QUESTIONS.md`.
- Before claiming a feature exists, is missing, or works a certain way, read the relevant files.
- If gmbinder.txt is ambiguous, contradicts itself, or conflicts with the code, STOP and list the conflict
  for me to decide. Do not guess. Log each one in `docs/RULES_QUESTIONS.md`.

## Decisions already made
- Remove the placeholder "Guardian" class and its subclasses (test data only).
- Remove Chi from characters and NPCs. Bending uses technique slots per gmbinder.
- Technique levels are Practiced / Trained / Mastered (3 levels, not 4), with down-casting
  and the Training Point system as written in gmbinder. House rule: higher slots may upcast a technique.
  Universal Technique Slots are a separate resource.
- Bending is derived from the class. Remove the separate bendingType/style selectors.
  Subclasses are Paths/Traditions/Principles.
- Bending abilities: Water = Cha, Earth = Con, Fire = Str, Air = Wis. Tech-Engineer = Int, Weaponsmaster = Dex.
  Attack = d20 + proficiency + ability mod. Save DC = 8 + proficiency + ability mod. Verify each against gmbinder.
- Defense/AC is computed by a rules engine (Earth Unarmored Defense is 10 + Dex + Con), not a fixed formula.
- Only show advantage/disadvantage badges that gmbinder actually grants (no D&D Beyond dwarf features, etc.).

## Engineering rules
- TypeScript strict. Keep `tsc` and `vite build` passing at every step.
- Split large files. No file over ~300 lines without a reason.
- Persist all user data. Version the character schema and write migrations. Old data must still load.
- Rules logic lives in a pure, unit-tested engine (no React inside). UI only renders engine output.
- Every source of a bonus, advantage, or disadvantage is an "Effect" with a `source` label so the UI can show why.
- Small, reviewable commits. One logical change each.