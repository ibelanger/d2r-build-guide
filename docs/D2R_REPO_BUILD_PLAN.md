D2R Season 13 Build Guide — Repo Build Plan
What This Is
A React web app replacing and extending the Excel spreadsheet. Tracks 5 characters' gear against BIS targets, provides a runeword planner with cube-upgrade paths, browses shared stash, and generates cross-character optimization suggestions.

Folder Structure
d2r-season13-build-guide/
├── src/
│   ├── data/                        ← JSON data layer (human-editable)
│   │   ├── characters.json          ← Equipped gear, skills, known overrides
│   │   ├── bis.json                 ← BIS lists per build per slot
│   │   ├── runewords.json           ← Runeword recipes, bases, build targets
│   │   ├── runes.json               ← Full rune ladder + cube recipes + current count
│   │   └── stash.json               ← Parsed shared stash items by page
│   ├── components/
│   │   ├── GearSlotRow.tsx          ← Single gear slot row with status badge
│   │   ├── RareQualityDropdown.tsx  ← Rare/Magic/Crafted quality tier selector
│   │   ├── RuneBadge.tsx            ← Styled rune abbreviation badge
│   │   ├── RunewordCard.tsx         ← Runeword feasibility card
│   │   ├── CharacterCard.tsx        ← Dashboard character summary card
│   │   ├── SkillTreeTable.tsx       ← Warlock skill comparison table
│   │   └── QualityBadge.tsx        ← Item quality color badge
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── CharacterDetail.tsx
│   │   ├── RunewordPlanner.tsx
│   │   ├── StashBrowser.tsx
│   │   └── Recommendations.tsx
│   ├── hooks/
│   │   ├── useRareTiers.ts          ← localStorage rare quality tier persistence
│   │   └── useRunewordFeasibility.ts ← Computes can-build status from rune counts
│   └── lib/
│       ├── runeUpgradeCalc.ts       ← Cube upgrade path calculator
│       └── bisChecker.ts            ← Compares equipped item to BIS list
├── parser/                          ← Python save file parser (not used by app)
│   ├── parse_d2r_v2.py
│   ├── build_excel_v3.py
│   └── README_parser.md
├── assets/
│   └── seed/
│       └── d2r_seed_data.json       ← Source of truth snapshot
├── public/
│   └── favicon.ico
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── package.json
└── README.md

Build Phases
Phase 1 — Scaffold + Data Layer

Vite + React + TypeScript + Tailwind + shadcn/ui
Populate all src/data/ JSON files from seed data + hardcoded BIS/runeword knowledge
GitHub Pages deploy pipeline

Phase 2 — Dashboard

Character cards with BIS coverage badges
Rune inventory widget
"Ready to build" runeword callouts

Phase 3 — Character Detail

Gear table with status badges
Rare quality tier dropdown (localStorage)
Skill comparison table (Warlocks)

Phase 4 — Runeword Planner

Full runeword table with feasibility
Cube upgrade path calculations
Base item recommendations

Phase 5 — Stash Browser

Tabbed stash pages
Filter by quality
"Would upgrade" highlights

Phase 6 — Recommendations Engine

Cross-character swap suggestions
Stash → character upgrade suggestions
Runeword build priority ranking
BlizzSorc Tal Rasha lock respected


Data Update Workflow
When you play and update gear:

Copy updated .d2s save files into the parser/ folder
Run: python parser/parse_d2r_v2.py → regenerates d2r_items_v2.json
Run: python parser/update_data.py → converts parsed JSON to src/data/characters.json
For newly identified RotW Season 13 items with unknown codes, add entries to the known_gear_overrides block in src/data/characters.json
npm run deploy

The parser is intentionally separate from the app — it's a Python data pipeline that feeds the static JSON layer.

The Rare Item Quality Tier System
For any equipped item that is Rare / Magic / Crafted, a dropdown appears in the gear table:
TierDisplayBIS StatusUse CaseRare — PlaceholderGrayUPGRADE AVLYou have something in the slot but it's mediocreRare — Right StatsTealNEAR-BIS ★Item has the key affixes (e.g. +2 skills, FCR, res)Rare — Right Stats, Find Higher RollGreenBIS ✓Item is excellent, only a better roll would improve it
Stored in localStorage — survives page refresh, resets if you clear browser storage.
Examples in current data:

ESWarlock belt: Crafted, +9% FCR +17% FHR → right_stats
RivvyZon gloves: +2 J&S / +20% IAS → right_stats (note: +3/20% would be right_stats_find_roll)
RivFOHPally amulet: +2 combat skills / 6% lifesteal / +6 all res → right_stats


Runeword Feasibility Logic
Can build NOW:     all runes in inventory
1 rune away:       missing exactly 1 distinct rune (may have multiples)
2+ runes away:     missing 2+ distinct runes
Cube path:         show how many lower runes needed to cube-up to missing rune
Cube formula: 3 of rune N + gem catalyst = 1 of rune N+1. Catalysts are trivial (chipped→flawed→normal gems) and assumed available.

Current Rune Status vs Key Runewords
RunewordStatusNotesCall to Arms✓ BUILD NOWAmn+Ral+Mal+Ist+Ohm all in stash. Crystal Sword 5os recommended.Heart of the Oak✓ BUILD NOWKo+Vex+Pul+Thul all in stash. Flail base.Spirit (sword or shield)✓ BUILD NOWTal+Thul+Ort+Amn all in stash. Crystal Sword 4os or Monarch 4os.Insight (merc)✓ BUILD NOWRal+Tir+Tal+Sol all in stash. Eth Thresher/Great Poleaxe.Treachery (merc)✓ BUILD NOWShael+Thul+Lem all in stash. Good IAS merc armor.EnigmaMISSING BERHave Jah ✓, Ith ✓. Need 1× Ber (r30). Sur×1 in stash — need 2 more Sur to cube 1 Ber.Chains of HonorMISSING BERHave Dol ✓, Um ✓, Ist ✓. Need 1× Ber. Same gate as Enigma.Infinity (merc)MISSING 2× BERNeeds Ber×2+Mal+Ist. Long-term farm target.GriefMISSING LOHave Eth✓, Tir✓, Mal✓, Ral✓. Need 1× Lo (r28). Ohm→Lo needs 3× Ohm — have 1.FortitudeMISSING EL+LOEl is low — farmable. Lo is the real gate.
Priority recommendation: Build Call to Arms first (high-impact, all chars benefit from BO). Then Insight for merc. Focus farming on Sur/Ber to unlock Enigma.

REVISION NOTE ON RUNES - RUNE INVENTORY — USER-MANAGED
Do NOT rely on the parsed rune counts from the seed data — they are incorrect because the Season 13 stacked rune format is not fully parsed. Instead, build the rune inventory as a live-editable table in the UI:

One row per rune type (El through Zod, 33 runes)
Quantity field: number input, editable inline, persisted to localStorage under key d2r_rune_counts
Pre-populate all quantities at 0 (user will fill in their actual counts)
All runeword feasibility checks, cube upgrade paths, and "can build now" callouts read from this live count
Include an "Import from text" convenience field: user can paste a list like "Tir:17, Tal:33, Ort:29" and it parses into the quantity fields

On the runeword planner page, for each missing rune, show the cube upgrade path: e.g. "Need 1× Ber — you have 1× Sur, need 2 more Sur → then cube 3× Sur + Flawless Amethyst = 1× Ber." Show the full chain if it spans multiple steps.
Known quantities to pre-populate (user-provided, accurate):

Tir: 17, Tal: 33, Ort: 29, Fal: 9, Ohm: 3
All other rune quantities: 0 (user will update)

Notes on Season 13 Parser Gaps
Several new Rise of the Warlock item codes (ctss, mrgy, wwww, bt) are not present in the bundled TXT reference files (which ship with the pre-RotW parser). This causes the parser to either:

Misassign the item position (slot = None), or
Lose subsequent items in the bit stream due to size miscalculation

Workaround: known_gear_overrides in the data layer manually records these items with correct names and stats. The proper long-term fix is extracting updated TXT files from the Season 13 game data (from the game's CASC data files or from d2mods community sources).
Items currently patched via override:

RivvyZon: Amulet, Armor, RingR, RingL, Belt, Boots (6 slots)
ESWarlock: Belt (1 slot — crafted)
RivvySorc: RingL, Belt, Boots (3 slots)
RivFOHPally: WeaponL, Gloves (2 slots)
