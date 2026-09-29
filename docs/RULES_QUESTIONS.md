# Rules Questions and Conflicts

Source of truth: `reference/atla-homebrew-gmbinder.txt` (cited below as `GB L<line>`).
Status legend: **OPEN** = needs your decision, **DECIDED** = already settled in CLAUDE.md, **NOTE** = no decision needed, recorded for the record.
"Proposed default" is what I will implement if you just say "go with your defaults". Nothing below has been implemented yet.

---

## Decisions log (from the user)

| Item | Decision |
|------|----------|
| A1 | **Baseline 5e allowed** for anything gmbinder does not cover. Always labelled "Baseline 5e" in the UI. gmbinder wins on any conflict. |
| A2 | **Backgrounds like D&D Beyond:** pick a premade (SRD) background **or** build a custom one (name, 2 skills, tools/languages, optional feature). |
| A3 | **Show heavy-armor Stealth disadvantage** (Baseline 5e). Where Iron Will / Lighter Materials removes it, simply do not show it (simplest; the removing feature is still listed under the character's features). |
| A4/A5 | 5e hit dice: spend on short rest; long rest = full HP + regain half of hit dice (min 1). **Spark Points refill on a long rest.** |
| A6 | Practiced = 1, Trained = 2, Mastered = 3 (engine's call, per gmbinder). Technique Bonus = 2 x level. **Universal Technique Slots are a separate resource** from Practiced/Trained/Mastered slots (long-rest, flat count, no down-casting). This supersedes A10. |
| A7 | **House rule: upcasting is allowed, like spell slots.** A known technique may be paid for with a higher-level slot and is used at that slot's level (never below what the slot pays: a lower technique may also use 2 slots of the level below, as written). Upcast effects use the technique's own "for each level above Practiced" text; techniques with no scaling text get authored flavor/extra effect in data. This overrides "can not be used at a higher level than the individual knows" (GB L116). |
| A8 | Non-bender / other-element targets roll **their own element's Elemental Affinity save**; where the technique text names a fallback, use it; GM override per roll. |
| A9 | A technique is an attack roll **only when its text says so**. |
| A14 | Player chooses **roll or average** each level (level 1 = full die + Con). |
| A15 | Offer **standard array, point buy (27), 4d6 drop lowest, and manual entry**. |
| B1-B3 | **Follow each class table** for ASI: Weaponsmaster and Tech-Engineer 4/8/12/16; Bender classes 4/9/12/16/19. (Class text mentioning 19th for Weaponsmaster/Tech-Engineer and 8th for benders is treated as the typo.) |
| Deps/git | Zustand, Vitest, zod approved. Small commits on branch `overhaul`. `reference/` stays git-ignored. No hard deadline: full roadmap in order. |
| Sharing | **Installable web app**: one web link that friends can also install (see `docs/HOSTING.md`). A Windows .exe is not needed. |
| L1 | Combustionbender's *Telekinetic Firebending* starts at **level 3**, when the Principle is chosen. |
| L3 / LT4 | **Per-character switch** for the GM-permitted alternate bending ability (Airbending: Dexterity instead of Wisdom; Tech-Engineer: Wisdom instead of Intelligence). Off by default. |
| L5 | **Healing techniques** (Water Glove, Submerge) can be learned by **any Waterbender**, not only the Healer path. |
| L6 | **Energy Guidance** is a **Firebending** technique, as printed. |
| L10 | Airbending **Shockwave** and similar "each level above Practiced" damage **stacks**. |
| LT2 | **Improved Critical** (Multidisciplinary Specialist) stays at **level 9**. |
| M1 | **Bolas, Net and War Fan** get Baseline 5e-style stand-in stats (only the Net is in the SRD; Bolas and War Fan values are this app's). Net deals no damage. |
| M2 | **Crossbows** proficiency covers every crossbow, including the hand crossbow. |
| M3 | **Air Nomads** with a non-Airbending class: a **warning note only**. |
| M7 | **SRD feats** are added (Alert, Savage Attacker, Skilled, Grappler; written as short summaries, labelled Baseline 5e). More can be added later from the owner's D&D Beyond books. |
| M8 | The misprinted "Bender Bender (Mage Slayer)" feat is named **Bender Slayer**. |
| NPC levels | Any technique can be Trained or Mastered; only the number of Mastered / Trained techniques is capped by the class table's slots. The NPC generator's approach (as many as the slots) stays. |

Still open: A11-A13 (defaults assumed: no Mixed nation with optional GM-approved extra lineage feature, Species step Human/Variant Human, gmbinder stays local). A10 is superseded by A6.

---

## A. Blocking questions (decide before Phase 4 content work)

| # | Question | Evidence | Proposed default |
|---|----------|----------|------------------|
| A1 | **gmbinder is a D&D 5e patch, not a full ruleset.** It never defines: armor/weapon tables, base skill list, conditions, death saves, hit-dice recovery, short-rest healing, feats that were "kept the same", backgrounds. CLAUDE.md says do not substitute general D&D. Which baseline do we use for the gaps? | Species "Human" is 5e's (GB L338-350). "Created for Dungeons & Dragons 5th Edition" (GB L4648). Feats: "the rest were kept the same" (GB L2306). | Use the D&D 5e SRD as an explicit, labelled **"Baseline 5e"** layer for gaps only. Every such rule is tagged `source: 'Baseline 5e'` in the UI so it is visibly not gmbinder. Anything gmbinder states wins. |
| A2 | **Backgrounds do not exist in gmbinder.** Equipment lines say "in addition to the equipment granted by your background" (GB L380, L429, L512, L559) but no backgrounds are defined. Seed has two invented ones. | Grep: no "Background" section. | Use SRD backgrounds (Acolyte, Criminal, Folk Hero, ...) as Baseline 5e, delete the 2 invented ones. Or: free-form background (name + 2 skills + tool) with no features. Your call. |
| A3 | **Heavy-armor Stealth disadvantage** is only *implied*: Iron Will "no longer have disadvantage on Stealth Checks when wearing Heavy Armor" (GB L1852) and Lighter Materials (GB L905). The base rule is never stated. You asked for it only "if gmbinder says so". | GB L905, L1852. | Show it, labelled **Baseline 5e (removed by Iron Will / Lighter Materials per gmbinder)**. Need armor table from A1 to know which armor has the flag. |
| A4 | **Hit dice recovery and short-rest healing** are not defined. Only the hit die size per lineage is (d6/d8/d10/d12, GB L370, L419, L502, L549). | No "regain ... hit dice" text anywhere. | 5e: spend hit dice on short rest (roll die + Con); long rest restores all HP and half your hit dice (min 1). |
| A5 | **Spark Points (Tech-Engineer) never say when they recharge.** Combat Expertise Points say long rest (GB L712). | GB L761-782, L790-835. | Long rest, same as Combat Expertise Points. |
| A6 | **Numeric value of Practiced / Trained / Mastered.** "Technique Bonus = 2 (x Technique Level)" (GB L699) and "DC = 10 + 3x the technique's level" (GB L733). Practiced/Trained/Mastered are never mapped to 1/2/3. | GB L699-701, L733. | Practiced = 1, Trained = 2, Mastered = 3 (Weaponsmaster "Basic" = Practiced). Technique Bonus = 2/4/6. |
| A7 | **Can a higher-level slot pay for a lower-level technique?** Rule says "expend a slot of the technique's level or 2 slots from a lower level" (GB L1092). Silent on the reverse. | GB L116-121, L1092. | Literal reading: **no**. A Practiced technique can only use Practiced slots. |
| A8 | **"Elemental Affinity Saving Throw (if they aren't)" for targets.** Techniques say "Constitution Save (if they're an earthbender) or an Elemental Affinity Saving Throw (if they aren't)" (e.g. GB L3178, L3213). Elemental Affinity is defined as the save for *the element of the one making it* (GB L115). A non-bender or other-element target has no Earth affinity. What ability do they roll? | GB L115, L3178-3290 (about 50 techniques). | Interpret as **the target's own Elemental Affinity save** (Str/Dex/Con/Wis/Cha by their element). Non-benders: technique author's stated fallback where given (e.g. "Strength Saving Throw if they aren't", GB L3178); where none given, GM chooses in the app (defaults to Dex). |
| A9 | **Attack roll or saving throw?** Earthbending says "if you are directly affecting a target make a Bending Attack Roll" (GB L1531), but most techniques are pure save-based with no attack roll. | GB L1531 vs technique bodies. | Technique data carries an explicit `resolution: 'attack' \| 'save' \| 'none'`. Save-based techniques use Bending Save DC. Attack-based only if the technique text says so. Basic attacks always use attack rolls. |
| A10 | **What level are Universal Technique Slots?** Weaponsmaster/Tech-Engineer get "3 slots" (GB L664) of an unspecified level. | GB L664, L719. | Practiced-level slots (they cannot exceed the tier known). Consequence: at Trained/Mastered they follow the normal down-cast/2-slot rule. |
| A11 | **Two-parent / Mixed characters.** gmbinder: choose one parent's lineage; combined traits only if the GM allows (GB L211). Do you want a "GM-approved second lineage feature" toggle? | GB L211. | No `Mixed` nation. Add an optional single "Extra lineage feature (GM approved)" pick, off by default. |
| A12 | **Species step.** GB L336-350 gives Human (+1 all abilities) and Variant Human (+1 to two, 1 skill, 1 feat). Current builder has no species step. | GB L336-350. | Add a Species step (Human / Variant Human). Variant Human gets a feat from the kept/changed feat list. |
| A13 | **Where does the rules source live in git?** CLAUDE.md says `gmbinder.txt` in the project; the file is `reference/atla-homebrew-gmbinder.txt` and `reference/` is git-ignored (commit b5bbbf8). It is someone else's homebrew (Bulldozer56), so I will not commit or ship it. | .gitignore, GB L15. | Leave it ignored and local. Update CLAUDE.md path. Rules data is re-encoded as our own structured data, with a credit line in the app. |

| A14 | **HP per level above 1st: roll or fixed?** "1d12 + Constitution Modifier per level above 1st" (GB L421) does not say roll vs average. | GB L372, L421, L504, L551 | Let the player choose per level-up: roll, or the 5e average (die/2 + 1). Level 1 is the full die + Con. |
| A15 | **Ability score generation is not in gmbinder** (no standard array, point buy, or rolling). | none | Standard array, point buy (27), and manual entry, all labelled Baseline 5e (A1). |

---

## B. gmbinder disagrees with itself

| # | Conflict | Where | Proposed default |
|---|----------|-------|------------------|
| B1 | **Weaponsmaster Ability Score Improvement levels.** Text: 4th, 8th, 12th, 16th **and 19th** (GB L726). Class table: ASI at 4/8/12/16 only; 19th row says only "Journeyman's Lesson Feature" (GB L667-682). (Known.) | GB L667-682 vs L726 | Grant ASI at 4/8/12/16/**19** (text is more specific and matches every other class). |
| B2 | **Tech-Engineer ASI levels.** Same split: table 4/8/12/16 (GB L766-778) vs text "4th, 8th, 12th, 16th and 19th" (GB L814). Table row 19 lists "Specialization Feature". | GB L766-781 vs L814 | 4/8/12/16/19. |
| B3 | **Bender table puts ASI at 9th, not 8th.** Table: ASI at 4, **9**, 12, 16, 19; 8th is "Bending Feature" (GB L1070-1085). Every element's text says 4th, 8th, 12th, 16th, 19th (GB L1150, L1558, L1924, L2247). | GB L1070-1085 vs L1150/1558/1924/2247 | 4/8/12/16/19 (text). |
| B4 | **Generic Bender table "Bending Feature" rows do not match each element's real feature levels.** Table has Bending Feature at 5, 8, 11, 14, 16, 19 and Teaching at 3, 7, 10, 13, 15, 18. Examples: Fire Action Surge is 2nd (GB L1918) but table row 2 is "---"; Airbender Feather Fall 4th, Stillness of Mind 7th; Earth Neutral Jing 5th, Resilient 11th. | GB L1065-1086 vs per-element text | Per-element text wins. Class table used only for slots, proficiency bonus, known techniques. |
| B5 | **Airbending has no sub-class, but the Bender table lists "Bending Teaching" at 3rd and "Teaching Improvement" later**, and Character Progression says every class picks a Path/Tradition/Principle (GB L218). Air lists none. | GB L1069, L218, L2168-2266 | Air characters have no subclass. UI shows "Airbenders have no Teaching" instead of an empty picker. |
| B6 | **Combustionbending starts at level 1, but sub-classes are chosen at level 3.** Telekinetic Firebending: "Starting at level 1" (GB L2139) inside a Principle unlocked at level 3 (GB L1922). Build notes say "choosing that principle initially" (GB L2161). | GB L1922, L2139, L2161 | Combustionbender may be chosen at level 1 (its level-1 text) and its later features follow the listed levels. Firebender Principle stays level 3. |
| B7 | **Optional rule: sub-bending styles must be learned via Training** (GB L145-148) vs. "choose your sub-class at level 3" (GB L1556). | GB L145-148, L1556 | Sub-class is picked at 3. The Training-to-unlock rule is an optional toggle, off by default. |
| B8 | **Universal Techniques text says "Known Techniques Slots column"**, but Weaponsmaster/Tech-Engineer tables call it "Universal Technique Slots". | GB L719, L803 vs L662, L761 | Same thing (see A10). |
| B9 | **Terminology drift:** "Spell Save DC" (GB L1119), "Save DC", "Bending Save DC", "Bending DC"; "Bending Attack Modifier" vs "Bending Attack Bonus" (GB L2154). | Many | All mean Bending Save DC / Bending Attack Modifier. Weaponsmaster and Tech-Engineer use their own Save DC lines. |
| B10 | **Training rules are underspecified.** DC 15, "on a fail the DC decreases by 1" (does it reset after success? per technique?). 5 TP to level. "Only 2 techniques trained at once" but mastering "consumes a training slot" (GB L125-127). | GB L125-127 | Implement: per-technique TP counter (0-5), DC starts 15, -1 per failure on that technique, resets to 15 on success. Mastery is a separate DC 25 attempt, -1 per fail, once per day, counts toward the 2-slot limit. |
| B11 | **Chi Clotting / Chi Blocker leg rows say "can not bend using that arm"** for legs, and Chi Blocker refers to "the Chi Clotting effect" (GB L1255-1256, L2514-2515). | GB L1255, L2514 | Treat as typo for "leg". NPC/character chi *points on limbs* are target-status effects, not a resource (consistent with removing Chi). |
| B12 | **Nimble Wit is garbled:** "add your Spark Points to any Saving Throw that you aren't proficient in, 2 your roll increases by 2 for every 1 Spark Point spent" (GB L791). | GB L791 | Interpret as: spend Spark Points, +2 per point on a save you lack proficiency in. Confirm. |
| B13 | **Metalbending Tradition "must forgo one use of your Ability Score Improvements"** (GB L1591). With ASI at 4/8/12/16/19 that is one of five. | GB L1591 | Track as a flag: character loses one ASI slot and gains Seismic Sense. |
| B14 | **Multiclass rules are incomplete.** Effective class level = levels in your largest sub-class (GB L223-226), gated by ability 13+, but nothing says how HP, hit dice, proficiency bonus (total level?) or feature choices work across a split. | GB L114, L219-229, L654, L753 | Slice ships single-class only. Multiclass is a later phase; HP/hit dice stay lineage-based, proficiency bonus uses total level. |
| B15 | **Meditation Wisdom cap:** "can not be increased to no more than 6" then "no more than 7" at 16 (GB L2188, L2190) while the bonus is +1/+2 to a *modifier*. | GB L2187-2190 | Cap modifier at +6 (+7 at 16th). |
| B16 | **Lay of the Land wording** ("proficiency bonus doubled if you are proficient") fine, but "Intelligence or Constitution Check related to your favored terrain" has no rule for *which checks are terrain-related*. | GB L448 | Player toggles "terrain applies" per roll. |
| B17 | **"Gust" is an Airbending class feature (GB L2234), not a technique.** The seed treats it as a technique. | GB L2234 vs seed | See D6. |
| B18 | **Earth Kingdom starting equipment offers a halberd (a martial weapon), but the Earth weapon proficiency list has no halberds or glaives** (GB L424, L430). A character who takes the starting halberd is not proficient with it. The same list has no proficiency for "any martial melee weapon", the other starting choice (GB L430). | GB L424, L430 | The sheet follows the proficiency list exactly. Tell me if Earth Kingdom should also be proficient with halberds, or with whatever martial weapon they pick. |
| B19 | **Rock Glove damage at Mastered is ambiguous.** "At Trained level the damage is increased by 1d8. When this ability reaches Mastered, you can throw 2 rock gloves, the damage increases by 1d8 per glove" (GB L3301). Is that 3d8 total across both gloves, or 2 extra dice per glove? | GB L3301 | The sheet rolls 1d8 (+1d8 per level) per glove, so Mastered is 3d8 for each of two gloves. Tell me if it should be different. |
| B20 | **Mastery check can be retried "once per day"** (GB L127) but the app has no calendar. | GB L127 | The app lets you press the button any time; keep to once per day at the table. |
| B21 | **"Known Techniques" versus "prepared".** The Benders table gives Known Techniques (GB L1067-1086) while Using Techniques says you prepare that many each long rest (GB L1093). | GB L1093 | The sheet treats it as the number of techniques you know, and lets you cast any known technique. No daily preparing step. |

---

## C. Decisions already made (from CLAUDE.md)

| # | Decision | Status |
|---|----------|--------|
| C1 | Remove Guardian and its subclasses. | DECIDED |
| C2 | Remove Chi from characters and NPCs. | DECIDED |
| C3 | 3 technique levels: Practiced / Trained / Mastered. | DECIDED |
| C4 | Bending derived from class; remove bendingType/style selectors. Sub-classes are Paths/Traditions/Principles. | DECIDED |
| C5 | Bending abilities: Water Cha, Earth Con, Fire Str, Air Wis, Tech-Engineer Int, Weaponsmaster Dex. Attack = d20 + prof + ability. Save DC = 8 + prof + ability. | DECIDED, **verified** against GB L1113-1116, L1533-1536, L1903-1906, L2173-2176, L697, L788. Two GM-permission options recorded: Airbender may use Dex (GB L2171), Tech-Engineer may use Wis (GB L787). Weaponsmaster techniques add Technique Bonus at Trained/Mastered (GB L699-701), so "attack = d20 + prof + ability" is exact only for basic attacks. |
| C6 | AC from a rules engine (Earth Unarmored Defense = 10 + Dex + Con, GB L446). | DECIDED, verified |
| C7 | Advantage/disadvantage badges only where gmbinder grants them. | DECIDED. See catalogue in section F. |

---

## D. Code disagrees with gmbinder

| # | Code | gmbinder | Fix |
|---|------|----------|-----|
| D1 | Class `Guardian` + `guardian-stonewall`, `guardian-vanguard` + 4 features (`src/data/seed.ts`). | Not in gmbinder. | Remove (C1). |
| D2 | `Character.chi`, chi inputs on NPC form and NPC list (`schema.ts`, `App.tsx`, `generator.ts`). | Chi is a limb status effect only (B11). | Remove (C2). Migration drops the field. |
| D3 | `TechniqueTier = 1\|2\|3\|4`. | 3 levels. | Replace (C3). Existing tier 4 data cannot map; there is none in the seed. |
| D4 | Separate `bendingType` and `style` fields, `Style` entities incl. "Weapons Specialist", "Martial Artist", "Tactician". | Bending comes from class. Only "Weaponsmaster" and "Tech-Engineer" exist for non-benders. | Remove (C4). |
| D5 | `Nation` includes `'Mixed'`; `Mixed Heritage` lineage; Mixed weights in NPC templates. | Choose one parent (A11). | Remove `Mixed`. Migration maps existing `Mixed` characters to a chosen nation (prompt user on load). |
| D6 | Placeholder techniques Gust, Water Whip, Stone Guard, Flame Kick, each with `tier` and prose only. | Real list: 8 universal, 40 Water, 48 Earth (incl. Metal/Lava), 30 Fire, 41 Air (about 167). "Water Whip/Water Rope" and "Gust" exist but not as those. "Stone Guard" and "Flame Kick" do not exist. | Replace with gmbinder-derived data. |
| D7 | Feature `Brave` ("advantage on saves against fear"). | Not in gmbinder (5e halfling trait). | Remove. Fear-related advantage in gmbinder is only Stillness of Mind (clears Frightened), not advantage. |
| D8 | Backgrounds `Community Helper` / `Street Survivor` with languages "Local Dialect" and "Underworld Cant". | No backgrounds (A2). Only language is Common (GB L163). | Replace per A2. Languages collapse to Common. |
| D9 | `Religion` uses Intelligence in `BuilderPreviewPanel.tsx`. | Religion uses Wisdom (GB L151). | Fix in engine. |
| D10 | Defense = `10 + Dex` (`BuilderPreviewPanel.tsx:162`). Earth Unarmored Defense is only text. | 10 + Dex + Con when no armor (GB L446). | Rules engine (C6). |
| D11 | Initiative = Dex mod only (`BuilderPreviewPanel.tsx:161`). | Weaponsmaster Quickdraw adds proficiency (7th, GB L731); Airbender Quick Reflexes adds Wis (10th, GB L2261); Alert feat (kept from 5e). | Engine effects. |
| D12 | Weaponsmaster grants are incomplete: no Journeyman's Lesson picks at 4/7/10/13/16/19, no Adapted Fighting upgrade at 10, no Universal Techniques Improvement at 13, no Extra Attack at 11/20, no Action Surge x2 at 17, no ASI at 19, no Combat Expertise Points / Universal Slots tables. `uses`/`recharge` are unset on the limited-use features (Adapted Fighting, Universal Techniques). | GB L662-683, L704-737 | Encode both tables as data; Weaponsmaster is slice option 2. |
| D13 | Class `hitDie: 'Lineage-based'` string; lineage `hitDiceText` is prose ("1d12 per level"). Nothing parses it. | Hit die/HP are lineage-based (GB L370-372 etc.). | Structured `hitDie: 6\|8\|10\|12` on lineage. |
| D14 | **Resolved (section M):** all four lineages are now encoded. Was: only the Earth Kingdom lineage has mechanics. Water/Fire/Air are stubs; Human/Mixed are generic. Earth is missing starting equipment. Earth data otherwise matches GB L419-454 (checked: HP, armor, 9 weapons, Con save + 1, 3 tools, 8 skills, Unarmored Defense, Lay of the Land). | GB L370-454, L502-522, L549-570 | Encode Water/Fire/Air later. Water lineage feature "Community" (GB L398-399) and Fire "Lessons of the Schools", "Dragon's Fury", Air "Negative Jing", "Twinkletoes" need Effects. |
| D15 | Missing classes: Tech-Engineer, Waterbending, Earthbending, Firebending, Airbending. Missing subclasses: 4 Tech-Engineer Specializations, 3 Paths, 3 Traditions, 2 Principles. | GB L748-1878 | Slice: Earthbending (+Tradition of Earthbending) first. |
| D16 | `Feature` has no structured effects, only `description`, `uses`, `recharge`. `recharge` allows `'Manual'`; gmbinder rests are Short / Long / "short or long" / per day. | GB rests catalogue (F2) | New `Effect` and `Resource` model. |
| D17 | Ability modifier, proficiency bonus, `formatModifier` are re-implemented in 3 files. Proficiency bonus table is correct (+2 to +6, GB L662-683). | | Move to engine. |

---

## E. Code bugs (verified by reading the code)

| # | Bug | Location |
|---|-----|----------|
| E1 | `availableTemplate` `useMemo` depends on `[selectedRole]` but reads `editableNpcTemplates`; editing template weights does not change generation. | `App.tsx:111-114` |
| E2 | `weightedPick` throws when every weight is 0. New/edited templates can have all-zero weights, so Generate NPC can crash the tab. | `generator.ts:10-28`, `generator.ts:133-134` |
| E3 | Generated NPC lineage ignores nation. It picks from a hard-coded list `['human','mixed-heritage','air-nomad-human']`, and even rolls a second unused `lineage` variable. Result: Fire Nation NPC with `air-nomad-human`. `classId` is `''`, so no class/proficiency logic runs. | `generator.ts:4,137,150` |
| E4 | Names are picked from 8 hard-coded names, HP is random 8-15, ability scores all 10. No stat block. | `generator.ts` |
| E5 | No persistence anywhere. Everything, including campaign data edits, is `useState`. Reload loses everything. | `App.tsx` |
| E6 | `exportCharacter` is only used by the commented-out `BuilderOverviewPanel`. Dead. Also dead: `pickWeighted`, `emptyNationWeights`, `emptyBendingWeights`, `selectedNpcLineage` in `App.tsx`; `BuilderOverviewPanel.tsx` (unused file). | `App.tsx` |
| E7 | HP is one number (`hp`); no max, temp HP, hit dice, death saves. `hp` is also NPC HP. | `schema.ts` |
| E8 | Multiple `useEffect`s overwrite `character` in a chain (styles, lineage, proficiencies x4). Fragile; will fight persisted/migrated data. | `App.tsx:727-908` |
| E9 | Campaign Data Import validates almost nothing (`Array.isArray` only) and silently replaces data. | `App.tsx:375-414` |
| E10 | `App.tsx` is 1,614 lines with 30+ `useState`s and a prop-drilled `editing*Id` setter mess. | `App.tsx` |

Baseline health: `tsc --noEmit` passes and `vite build` succeeds today (52 modules, 249 kB JS). There is no test runner and no test file.

---

## F. Catalogue of gmbinder-granted advantage / disadvantage / bonuses (for the Effects engine)

Only these should ever produce an A/D badge. Sources are the exact feature name so the hover text can cite it.

### F1. Ones the vertical slice needs (Earth Kingdom + Earthbender/Weaponsmaster)
| Effect | Target | Condition |
|--------|--------|-----------|
| **Neutral Jing** (Earthbending 5th, GB L1563) | Advantage on all saving throws | vs a creature that takes its turn before you in initiative. Also: attacks made with your reaction have advantage. |
| **Unarmored Defense** (Earth lineage, GB L446) | AC = 10 + Dex + Con | no armor worn |
| **Lay of the Land** (Earth lineage, GB L448) | + proficiency (or 2x if proficient) | Int/Con check related to favored terrain |
| **Rock Hanging** (technique) | Advantage on Athletics | climbing, while active |
| **Badgermole's Endurance** (Tradition of Earthbending 18th) | Advantage on saves | vs effects that paralyze, stun, unconscious |
| **Iron Will** (Metalbending 10th) | Removes Stealth disadvantage | Heavy Armor (see A3) |
| **Quickdraw** (Weaponsmaster 7th, GB L731) | + proficiency bonus to initiative | always |
| **Superior Critical** (Weaponsmaster 11th) | Crit range 18-20 | weapon attacks |
| **Bender Bender** feat | Advantage on saves | vs techniques from creatures within 5 ft |
| **Focused Fighting** (Adapted Fighting) | Advantage on next attack | spend Combat Expertise Point |
| **Daze** (Adapted Fighting) | target: disadvantage on attack rolls | until its next turn |

### F2. Rest / recharge rules found
- **Long rest:** all technique slots (GB L1092), Combat Expertise Points (GB L712), Universal Technique Slots, Oceanic Master, Dragon's Flame, Sparky Sparky Boom Boom, Badgermole's Endurance, Fleetfooted Earthbending, Metallurgy, La's Calling, Body Heat Manipulation.
- **Short or long rest:** Action Surge (GB L723, L1919), Iron Will integration (GB L1851).
- **Short rest:** Lava Pool (x2, GB L1866, L1870), Tactical Cover (x2, GB L985), Meditation from 16th (GB L2190).
- **Per day:** Efficient Bender, Sovereign Teachings, Spiritual Projection.
- **Not stated:** hit dice (A4), Spark Points (A5).

### F3. Other-nation badges (later phases)
Water: Community (max damage die), Oceanic Master rerolls. Fire: Positive Jing (reaction attack with advantage), Dragon's Blessing (advantage on Intimidation vs burning). Air: Negative Jing, Twinkletoes, Quick Reflexes, Last Resort. Universal: Fear, Vicious Mockery (disadvantage), Motivational Speech (advantage on Wis saves), Taunt.

---

## G. Verified consistent (no action)

- Proficiency bonus by level matches every class table (+2 at 1-4, +3 at 5-8, +4 at 9-12, +5 at 13-16, +6 at 17-20).
- Bender technique slots and the "Benders may only master 6 techniques" cap agree (6 Mastered slots at 20th, GB L1086, L119).
- Down-cast costs agree in both statements (1 Trained = 2 Practiced; 1 Mastered = 2 Trained = 4 Practiced, GB L116-121, L1092).
- Weaponsmaster Combat Expertise Points and Universal slot counts in the seed's prose match the table.
- Earth Kingdom lineage data in the seed matches gmbinder (D14). Typos in gmbinder ("Aracana", "Thieve's Tools", "Motiavtional") are ignored and normalized.

---

## H. Phase 1 status (branch `overhaul`)

Fixed: **C1** Guardian removed. **C2** Chi removed. **C3** three technique levels (`Practiced/Trained/Mastered`). **C4** `bendingType`/`style` and Styles removed; bending derives from `CharacterClass.element` (no bender classes exist yet, so Earth/Fire NPCs show "No class" until Phase 4). **D5** `Mixed` removed (old data migrates with an explanatory note). **D6, D7** placeholder techniques and the invented Brave feature removed. **D9** Religion uses Wisdom. **D17** shared ability math in `engine/abilities.ts`. **E1** template edits now take effect. **E2** all-zero weights no longer crash the generator. **E3** NPC lineage follows nation and benders only get their nation's element. **E5** everything persists. **E6** dead code deleted. **E8** effect chain replaced by `normalizeCharacter`. **E9** campaign import is validated with zod. **E10** `App.tsx` is 60 lines.

Still open (by design, later phases): **A2/D8** the two invented backgrounds remain until SRD + custom backgrounds are built. **D10/D11** AC and initiative (Phase 4 engine). **D12-D16** Weaponsmaster grants, lineage mechanics, missing classes (Phase 4). **E4/E7** stat-block NPCs and HP structure (Phases 2 and 6). Three older files exceed 300 lines: `FeaturesPanel.tsx` (413), `NpcTemplatesPanel.tsx` (380), `BuilderPreviewPanel.tsx` (497, replaced by the play sheet in Phase 2).

---

## I. Phase 2 assumptions (please confirm or correct)

These were needed to build the play sheet. Each is labelled in the UI where it applies.

| # | Assumption | Basis |
|---|------------|-------|
| I1 | **Max HP** = full hit die + Con at level 1, then (roll or average) + Con per level, minimum 1 per level. Multiclass is not modelled (single class, hit dice = level). | GB L370-372 etc.; A14 |
| I2 | **Mixed slot payment:** a Mastered technique may be paid with 1 Trained + 2 Practiced (slot values Practiced 1, Trained 2, Mastered 4), not only "2 Trained" or "4 Practiced". Slots above the cast level are never spent. | Extends "1 Mastered = 2 Trained = 4 Practiced" (GB L119-121) |
| I3 | **Upcasting** (house rule A7) is enabled in the slot spender: casting at a higher level than the technique's known level. What the extra level *does* comes from each technique's own "above Practiced" text (Phase 4). | A7 |
| I4 | **Unarmored Defense** applies whenever no *armor* is worn; a shield does not count as armor. | GB L446 says "aren't wearing any armor" |
| I5 | **Armor proficiency penalty (Baseline 5e):** wearing armor or a shield you are not proficient with gives disadvantage on Str/Dex saves, Str/Dex checks and attack rolls. Proficiencies come from the lineage table. Lineages with no armor list are never penalised. The Water/Fire/Air lineages now carry their gmbinder armor lists. | GB L374, L506, L553 |
| I6 | **Stealth disadvantage** comes from the armor table (padded, scale mail, half plate, and all heavy armor except none), not just heavy armor, as in 5e. Any feature with a `suppressDisadvantage` effect hides it (used by Iron Will / Lighter Materials in Phase 4). | A3; 5e SRD |
| I7 | **Temp HP** are cleared on a long rest and do not stack (higher wins). | 5e SRD |
| I8 | **Long rest** restores all HP, clears death saves, regains half your hit dice (min 1), reduces exhaustion by 1, and refreshes every Short/Long-rest resource. **Short rest** refreshes only "Short Rest" resources (Action Surge). | A4; GB rest text |
| I9 | **Exhaustion** uses the 5e track (1: disadvantage on checks and initiative; 3: also saves and attacks). Halved speed/HP at higher levels is not modelled. gmbinder adds exhaustion to several Bloodbender abilities but defines no effects. | 5e SRD |
| I10 | **Nothing on the play sheet rolls yet.** Rolling arrives in Phase 3. Hit dice on a short rest are the only dice rolled today. | roadmap |
| I11 | **Earthbending class is a shell:** element, hit die from lineage, and the bender technique-slot table only. Grounded, Move Earth, Neutral Jing, Tradition features come in Phase 4. | roadmap |

---

## J. Phase 3 assumptions (please confirm or correct)

| # | Assumption | Basis |
|---|------------|-------|
| J1 | **Weapon table** = the gmbinder Items section (throwing dart, knives, stars, boomerang, throwing axe) plus the 5e SRD weapon list, marked "Baseline 5e". Nets and improvised weapons are not included. War fans (Air Nomad proficiency) have no stats in gmbinder, so they are missing. | GB L4567-4580; 5e SRD |
| J2 | **Weapon proficiency** is read from the lineage list ("Simple Weapons", or a named group such as "Longswords" or "Axes"). A lineage with no list means not proficient. See B18. | GB L375, L424, L507, L554 |
| J3 | **Attack ability:** melee uses Strength, ranged uses Dexterity, Finesse uses whichever is higher. Thrown melee weapons (spear, handaxe) use Strength. | 5e SRD |
| J4 | **Attack roll** = d20 + ability + proficiency (if proficient) + weapon bonus; **damage** = weapon dice + ability + weapon bonus. Bending attacks use the Bending Attack Modifier (proficiency + bending ability) and are always proficient. Unarmed strike is 1 + Strength. | CLAUDE.md; GB L1113-1116 etc.; 5e |
| J5 | **Critical hits:** a natural 20, or the lowest number a feature sets (Superior Critical: weapon attacks on 18-20). Damage dice are rolled twice, modifiers once. Superior Critical does not apply to bending or unarmed strikes. Automatic hit/miss is not decided: no target AC is tracked, so you read your total against the target, and only crits are automatic. | GB L735; 5e |
| J6 | **Death saves:** d20, 10+ succeeds, under 10 fails, natural 1 is two failures, natural 20 gets you up with 1 HP. Only the "next roll" toggle can give them advantage or disadvantage; feature effects on death saves are not applied. | 5e SRD |
| J7 | **Advantage and disadvantage** from any number of sources cancel to a normal roll. The "Advantage/Disadvantage" toggle, Shift-click and Alt-click add one more source for a single roll. | 5e SRD |
| J8 | **Situational rules** (like Earthbending's Neutral Jing, "vs a creature that takes its turn before you") are not applied automatically. Clicking a roll asks which ones apply. | GB L1564 |
| J9 | **Ability checks** get exhaustion disadvantage, and Str/Dex checks get the armor-proficiency disadvantage. | 5e SRD |
| J10 | **Not automated yet:** Extra Attack (shown as feature text), the Weaponsmaster Technique Bonus, Adapted Fighting, and everything technique-based (Phase 4). Airbender's option to use Dexterity, and Tech-Engineer's option to use Wisdom, need a chooser. Current rules use Wisdom and Intelligence. | GB L787, L2171 |

---

## K. Phase 4 assumptions (please confirm or correct)

| # | Assumption | Basis |
|---|------------|-------|
| K1 | **Technique text is verbatim from gmbinder** (extracted by `scripts/extract-techniques.mjs`, typos in names fixed). Save DC and damage on the sheet come from a small hand-authored list (`data/techniques/mechanics.ts`) covering the ~20 techniques whose rules are clear. Everything else is shown as text only. | GB technique list |
| K2 | **Damage per level** uses each technique's own "for each level above Practiced" line. Upcasting a technique (casting it at a higher level than you know it) uses that same scaling. | A7 |
| K3 | **Save DC** is your Bending Save DC for every technique. The save the target rolls is named from the technique text; where the text only says "Elemental Affinity Saving Throw" for non-benders with no fallback, the sheet says the GM decides (A8). | GB L115 |
| K4 | **Known techniques** are capped by the class: Benders by the table's Known Techniques column (Earth and Universal count together). Weaponsmaster: Universal 2 (+1 at 6th, +1 at 13th), Fighting one at 1st and one more every 3 levels. Rare techniques unlock at level 8, and prerequisites (like Earthquake needing Trained Tremors) are enforced when learning. | GB L719-721, L717, L1157 |
| K5 | **Training:** 2 slots, Training Points 0-5, DC 15 (drops 1 per failure, back to 15 on success), a natural 20 gives 2 points, 5 points make Practiced -> Trained. Mastered needs a master's guidance and a DC 25 check (drops 1 per failure), and you can hold at most 6 Mastered techniques. The check is a plain ability check with your bending ability. | GB L123-127; B10 |
| K6 | **Weaponsmaster Universal techniques** cost one Universal Technique Slot each and cannot be upcast; the Fighting techniques cost nothing on the sheet (some spend Combat Expertise Points, tracked as pips). Fighting techniques are text only for now. | A6 decision |
| K7 | **Earthbending Ability Score Improvement** is granted at 4th, 9th, 12th, 16th, 19th (Benders table) even though the Earthbending text says 8th. The feature text says so. | B3 decision |
| K8 | **Tradition of Earthbending only.** Metalbending and Lavabending Traditions, their techniques, and the Water, Fire and Air classes are not built yet. | scope |
| K9 | **Neutral Jing, Badgermole's Endurance, Lay of the Land** are situational: the roll prompt asks whether they apply. Lay of the Land adds your proficiency bonus (proficient or not, the doubling comes to the same +PB) on Intelligence and Constitution checks, and Int skills, in favored terrain. Choosing favored terrain does not change the number. | GB L448, L1564, L1585 |
| K10 | **Backgrounds:** 13 premade, using the standard 5e skill and tool pairings with feature text written for this app, plus a custom builder (name, 2 skills, tools, one feature). No background grants languages. The old two invented backgrounds are gone; characters that had them are told to choose again. | A2, A1 |
| K11 | **Not automated:** Earth Armor's AC bonus while concentrating, concentration tracking, Move Earth's damage roll, Reflect Missiles, Grounded range on targets, Extra Attack. They are shown as text. | scope |

## NPC Studio defaults (need an owner look, all editable per NPC)

These are choices the NPC generator makes where gmbinder gives no rule. None of them changes player rules.

1. **Technique levels for generated benders.** gmbinder's Benders table gives slots per level, not which known techniques
   are Trained or Mastered. The generator makes as many known techniques Mastered and Trained as the table has
   Mastered and Trained slots at that level; the rest are Practiced. Fighting and Universal techniques stay Practiced.
2. **Ability scores.** Standard array by priority (class key ability, then Constitution and Dexterity), plus +2 per
   Ability Score Improvement the class table has reached. Weaponsmasters pick Strength or Dexterity at random.
3. **Armor and weapons.** Only what the lineage is proficient in. Armor is whichever proficient piece gives the best AC
   (Baseline 5e armor). Each role has a `combat` chance (0-1) of wearing armor and carrying a second weapon.
4. **Missing classes.** Any class not in the app yet leaves NPCs of that nation as non-benders, and the Studio says so.
   (Waterbending, Firebending and Airbending are now in; see section L.)
5. **Names, personality, ideals, bonds, flaws** are invented flavor text, not gmbinder content.
6. **Sharing.** Sending an NPC to a campaign removes its notes and personality fields; the stat block is what players see
   once the GM reveals it.

## L. Waterbending, Firebending, Airbending (please confirm or correct)

Class and subclass wording is copied from gmbinder by `scripts/extract-class-features.mjs`; technique text by
`scripts/extract-techniques.mjs`. These are the places where the source is unclear or disagrees with itself. Each one
has a default so play is not blocked; tell me to change any of them.

| # | Question | Default used in the app |
|---|----------|--------------------------|
| L1 | **Combustionbender: "Telekinetic Firebending" says "Starting at level 1"**, but the Principle is chosen at level 3. | Granted at level 3, with a note on the feature. |
| L2 | **Airbending has no Teaching, Path or Principle**, so no subclass. Every other bender picks one at level 3. Its class text also has no Extra Attack. | No subclass and no Extra Attack for Airbenders, as written. |
| L3 | **Airbender ability option:** "with your GM's permission" an Airbender may use Dexterity instead of Wisdom for the Elemental Affinity save, basic attack and Bending Save DC. | Wisdom only. A per-character Dexterity switch is not built. |
| L4 | **Ability Score Improvement levels:** the Water, Fire and Air text says 4th, 8th, 12th, 16th, 19th; the Benders class table says 9th instead of 8th. | Follows the table (4, 9, 12, 16, 19), as already decided for Earthbending. All bender classes now carry all five grants. |
| L5 | **Healing techniques** (Water Glove, Submerge) are printed in the Waterbending list. Nothing says they need Path of the Healer. | Any Waterbender can learn them. |
| L6 | **"Energy Guidance"** (label: Healing, uses Wisdom) is printed in the Firebending list. It does not obviously belong to Firebenders. | Left out of the app until you say who can learn it. |
| L7 | **Lightningbending techniques** (Stunning Strike, Arc Lightning, Lightning Blast) are unlocked by the *Lightning Generation* feat, not by a class. | Done: choosing that feat unlocks them for any Firebender's technique list. The feat's "Must be a Firebender" line is not enforced. |
| L8 | **Bloodbending techniques** need Path of the Bloodbender ("you can use Bloodbending Techniques"); **Combustionbending techniques** need the Combustionbender Principle. | Enforced when learning techniques (a subclass can grant a "discipline"). |
| L9 | **Chi:** the Healer and Bloodbender features talk about chi points and chi paths. The decision to remove Chi was about the character resource. | Feature text is kept exactly as printed; nothing tracks chi points. |
| L10 | **Technique overlays:** where the text raises damage only at one level ("At Trained level, the damage increases by 2d8"), Mastered is not raised further. Where it says "for each level above Practiced", each step adds the dice. Shockwave says both Trained and Mastered add 2d8 without saying whether they stack. | Stacks (each level above Practiced adds 2d8). Flagged in the technique's note. |
| L11 | **Not automated:** Flow's two-technique concentration, changing water to ice/steam, Dragon's Blessing burning, Meditation's Wisdom bonus, Spiritual Companion, Path features (Ebb, Fluidity, Energy Balancing dice pool, Positive Jing, Jet Stepping). They are shown as text. Only Quick Reflexes (Air, level 10) and Fluidity (advantage prompt) are wired into rolls. | Text only. |

### L-TE. Tech-Engineer (please confirm or correct)

| # | Question | Default used in the app |
|---|----------|--------------------------|
| LT1 | **Ability Score Improvement:** the text lists 4th, 8th, 12th, 16th and 19th; the class table lists 4th, 8th, 12th, 16th only. | Follows the table (your earlier decision). |
| LT2 | **Improved Critical** (Multidisciplinary Specialist) says "Starting at level 9"; the class table puts Specialization features at 7, 13 and 19. | Level 9, as written in the feature. |
| LT3 | **Spark Points** have no stated recharge. | Long rest (your earlier decision). |
| LT4 | **Save DC ability:** the text allows Wisdom instead of Intelligence "with your GM's permission". | Intelligence only; a Wisdom switch is not built. |
| LT5 | **Creative Mind contraptions and Gadgeteering upgrades** are choices ("you can only choose one of the gadgets" per tier, and upgrades per level). | Each is an optional feature you add in the builder from its level; the app does not enforce how many you take. |
| LT6 | **Armor and Weapons Specialist upgrades** are crafting choices (one per tier, applied to a specific item). | Each tier is one feature that shows the whole menu as text; upgrades are not applied to equipment automatically. |
| LT7 | **Tool proficiency:** the Specialization line gives Tinker's Tools or Smith's Tools, your choice. **Nimble Wit** also swaps Wisdom for Intelligence on Survival and Insight, and lets you add Spark Points to non-proficient saves. | Text only; not applied to the sheet. |

## M. Lineages and feats (please confirm or correct)

Water Tribe, Fire Nation and Air Nomads lineages are now encoded from gmbinder (hit die, saving throw plus one choice,
2 skills, 1 tool, armor and weapon proficiencies, lineage features), the same way Earth Kingdom already was. Feats come
from the Feats section.

| # | Question | Default used in the app |
|---|----------|--------------------------|
| M1 | **Bolas, Nets and War Fans** are listed as proficiencies (Water Tribe, Air Nomads) but the Items section gives them no stats. | Kept as proficiency names only. They cannot be picked as weapons until the source gives damage and properties. |
| M2 | **Crossbows (light and heavy)** for Water Tribe and Fire Nation. The hand crossbow is not named. | The "Crossbows" group is used, which also covers the hand crossbow. |
| M3 | **Air Nomads must be benders** ("all individuals of Air Nomad lineage are airbenders"). Nothing stops choosing a non-bending class. | Not enforced; shown as a note only. |
| M4 | **Lessons of the Schools** (Fire Nation) doubles the proficiency bonus for two chosen proficiencies (an expertise pick). There is no expertise choice in the sheet yet. | Feature text only. |
| M5 | **Starting equipment choices** ("(a) a rapier or (b) a shortsword") for every lineage. | Text is not applied; equipment is chosen by hand in the builder. |
| M6 | **Species (Human / Variant Human):** +1 to all abilities, or +1 to two, one skill and a feat. | Built (Abilities tab). New player characters start as Human. Older characters and NPCs are set to "scores are final" so no number changes. A bonus never lifts a score past 20. The Variant Human feat is added by hand on the Features tab. |
| M6b | **Ways to set ability scores** (your earlier decision): standard array, point buy (27 points, 8-15), roll 4d6 drop lowest, or type them. | Built. Point buy and the standard array are the same 27-point budget. The rolled set is not saved, only the scores you hand out. |
| M7 | **Feats:** the source lists 30 removed feats and 24 homebrew or changed ones, and says the rest are unchanged 5e feats without printing them. | Only the 24 printed feats are in the app, as optional features you add in the builder. Standard 5e feats (Alert, Athlete, Resilient, Observant ...) that the Firebending and Airbending build notes recommend are missing until you decide whether to add the SRD versions. |
| M8 | **"Bender Bender (Mage Slayer)"** looks like a typo in the source. | Kept as "Bender Bender". Tell me the intended name. |
| M9 | **Feat effects:** ability score increases, expertise picks, extra techniques and the like are shown as text; nothing is applied to the sheet automatically. | Text only. |
