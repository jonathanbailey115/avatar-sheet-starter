# Architecture

Vite + React + TypeScript (strict). State is Zustand with localStorage persistence. Rules logic is pure and unit-tested.

```
src/
  types/schema.ts        Types, CHARACTER_SCHEMA_VERSION
  engine/                Pure rules code. No React, no storage.
                         abilities, bending, hitPoints, dice, features, resources, rests, effects, sheet
  data/                  Built-in rules content, split by topic (classes, lineages, features, ...)
  lib/                   Pure helpers: migrations, zod schemas, import/export, normalize, generator, random
  store/                 Zustand stores (content edits, character library, NPCs, active character hook)
  screens/               Top-level screens (Library, Play, Builder, NPC Studio, Campaign Data)
  play/                  Play-sheet components (HP, rests, resources, stats, badges)
  character-builder/     Builder step panels
  campaign-data/         Campaign Data editor panels
```

## The play sheet

`engine/sheet.ts` `computeSheet(character, content)` is the single source for everything on the Play screen: HP, AC, initiative, saves, skills, passives, resources and features. Every number carries a `breakdown` (label + value) and every advantage or disadvantage carries the names of its sources, so the UI can always say why.

Effects (`engine/effects.ts`) are how a rule reaches the sheet. A feature in `data/features.ts` declares `effects: [...]` (`bonus`, `setBase`, `advantage`, `disadvantage`, `suppressDisadvantage`); armor, shields and exhaustion add Baseline 5e effects. To add a rule, add an effect to the feature. Do not add special cases to the UI.

Resources (`engine/resources.ts`) come from three places: the class's technique slot table, the class's `resources` (pools that scale by level), and features that declare `uses` and `recharge`. Spent counts live on the character as `resourcesUsed[id]`.

## Persistence

| localStorage key        | Contents |
|-------------------------|----------|
| `avatar-dnd:library`    | Player characters, active id, quarantined records |
| `avatar-dnd:npcs`       | Saved NPCs and quarantined records |
| `avatar-dnd:content`    | Only the user's *edits* to built-in rules content |

- **Characters carry their own `schemaVersion`.** On load every record goes through `migrateCharacter` (lib/migrations.ts), zod validation, then `normalizeCharacter`. A record that fails is moved to `quarantine` and can be downloaded. Nothing is silently deleted.
- **Content is stored as edits** (upserts + removed ids) over the built-in seed, so shipping new rules in an app update reaches existing users while their own changes are kept.
- If the browser blocks storage, the app keeps working from memory and shows a warning banner.

## Changing the character schema

1. Bump `CHARACTER_SCHEMA_VERSION` in `types/schema.ts`.
2. Add an `n -> n+1` function to `MIGRATIONS` in `lib/migrations.ts` and record it in the history comment.
3. Update `lib/characterSchema.ts` and `lib/character.ts` (`createBlankCharacter`).
4. Add a migration test using a fixture of the old shape (see `lib/testFixtures.ts`).

## Normalization

`normalizeCharacter` (lib/normalize.ts) replaces the old chain of `useEffect`s: it drops references to content that no longer exists and recomputes derived proficiencies. The library store applies it on every update and whenever content is edited. It returns the same object when nothing changed.

## Commands

```
npm run dev         Vite dev server
npm run typecheck   tsc --noEmit
npm test            Vitest
npm run build       tsc + vite build
```
