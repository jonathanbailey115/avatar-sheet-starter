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

## Rolling

`engine/rolls.ts` is pure: `rollD20` (advantage, disadvantage, crit range), `rollExpression` ("2d6+3", doubled dice on a critical), `deathSaveOutcome`, and the `RollEntry` type. Randomness is injected (`Rng`), so tests are deterministic; play uses `crypto.getRandomValues`.

`engine/attacks.ts` builds the attack list from the sheet: equipped weapons (`data/weapons.ts`), the class's basic bending attack, and an unarmed strike, plus Bending Save DC and Attack Modifier.

In the UI, `play/RollContext.tsx` turns a `StatLine` into a roll: it merges automatic advantage/disadvantage sources, the "next roll" toggle and Shift/Alt clicks, asks about situational rules, rolls, and writes a `RollEntry` to `store/rollLog.ts`. Phase 5 will send those same entries to the campaign log.

## Techniques

`scripts/extract-techniques.mjs` reads the git-ignored gmbinder source and writes `src/data/techniques/*.generated.ts` (committed). `data/techniques/mechanics.ts` layers hand-authored saves and damage on top by technique id; the extractor never touches it. To add a technique's mechanics, add an entry there.

`engine/techniques.ts` (damage by level, save wording, limits, prerequisites), `engine/casting.ts` (slot or Universal Slot cost) and `engine/training.ts` (Training Points and mastery) are pure and tested. `play/TechniqueCard.tsx` is the only UI that uses them on the play sheet.

Classes cap known techniques with `techniqueLimits`. A class gets technique slots from `techniqueSlots` (benders) or spends a `resources` pool (Weaponsmaster).

## Campaigns

`src/campaign/types.ts` defines a small `CampaignBackend` interface. Two implementations exist and `campaign/backend.ts` picks one:

- **Supabase** (`supabaseBackend.ts`, lazy-loaded) when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set. Setup: `docs/SUPABASE_SETUP.md`. The database rules live in `supabase/schema.sql` and are tested on a real Postgres (PGlite) in `campaign/schema.test.ts`.
- **Local test mode** (`localBackend.ts`) otherwise: each browser tab is a separate player, `localStorage` is the server, `BroadcastChannel` carries live updates.

`campaign/server.ts` is the same rules written in TypeScript. It powers test mode and reads as the specification of the SQL. If you change a rule, change both, and both test files.

`store/campaign.ts` holds your display name, which character is playing in which campaign, and the open campaign's live data. `play/RollContext.tsx` publishes each roll to the bound campaign, and `campaign/CampaignSync.tsx` keeps the party board current. Only a small summary of a character (name, class, HP, AC, state) is ever shared, never the whole sheet.

## Classes, lineages and feats

Class, subclass and feat wording is copied from gmbinder by `scripts/extract-class-features.mjs` into
`src/data/classText.generated.ts`; technique text by `scripts/extract-techniques.mjs` into `src/data/techniques/*.generated.ts`.
Both generated files are committed, so the app builds without the (git-ignored) source. What is authored by hand: levels,
feature types and effects in `src/data/{waterbending,firebending,airbending,techEngineer,earthbending}.ts`, and rollable
technique mechanics in `src/data/techniques/mechanics.ts` and `elementMechanics.ts`. A technique can belong to a
*discipline* (Bloodbending, Combustionbending, Lightningbending); it is only learnable when the subclass or a feat grants
that discipline (`disciplinesOf` in `engine/techniques.ts`).

Ability scores: `engine/abilityScores.ts` adds the species bonus (Human +1 all, Variant Human +1 to two, capped at 20) to the
typed scores, and holds the standard array, point buy and 4d6 rules. Everything on the sheet reads `abilityScoresOf`.

## NPC Studio

`src/npc/` is pure: `generate.ts` builds a full NPC from a role template (weights) and an optional nation, class and level;
`rerollPart` redoes one part and only what depends on it. `statBlock.ts` turns a character into a stat block using the same
`computeSheet` as a player sheet. The GM can save an NPC to a campaign (`campaign_npcs`); players only receive revealed ones,
without notes.

## Account sync

Characters and NPCs follow the signed-in account. `sync/plan.ts` (pure) decides what to download, upload or delete from
last-changed times and delete tombstones (the newer side wins); `sync/syncRun.ts` performs one pass through the backend;
`sync/cloudSync.ts` watches the stores and schedules passes. Each account only uploads items it owns on the device; items that
were already on the device before the account are added on request. The database rule that an older copy never replaces a
newer one lives in `save_synced_characters` (`supabase/schema.sql`) and is tested on a real Postgres.

## Persistence

| localStorage key        | Contents |
|-------------------------|----------|
| `avatar-dnd:library`    | Player characters, active id, quarantined records |
| `avatar-dnd:npcs`       | Saved NPCs and quarantined records |
| `avatar-dnd:content`    | Only the user's *edits* to built-in rules content |
| `avatar-dnd:rolls`      | The last 200 rolls |
| `avatar-dnd:campaigns`  | Display name, which character plays in which campaign, GM recovery keys |

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
