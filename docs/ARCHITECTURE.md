# Architecture

Vite + React + TypeScript (strict). State is Zustand with localStorage persistence. Rules logic is pure and unit-tested.

```
src/
  types/schema.ts        Types, CHARACTER_SCHEMA_VERSION
  engine/                Pure rules code. No React, no storage. (abilities, bending)
  data/                  Built-in rules content, split by topic (classes, lineages, features, ...)
  lib/                   Pure helpers: migrations, zod schemas, import/export, normalize, generator, random
  store/                 Zustand stores (content edits, character library, NPCs, active character hook)
  screens/               Top-level screens (Library, Builder, NPC Studio, Campaign Data)
  character-builder/     Builder step panels
  campaign-data/         Campaign Data editor panels
```

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
