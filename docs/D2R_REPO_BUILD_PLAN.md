D2R Season 13 Build Guide — Repo Build Plan
What This Is
A React web app replacing and extending the Excel spreadsheet. Tracks 5 characters' gear against BIS targets, provides a runeword planner with cube-upgrade paths, browses shared stash, tracks mercenary gear, calculates cube recipes, suggests farm targets, and generates cross-character optimization suggestions.

Folder Structure
d2r-build-guide/
├── src/
│   ├── data/                        <- JSON data layer (human-editable)
│   │   ├── characters.json          <- Equipped gear, merc data, known overrides
│   │   ├── bis.json                 <- BIS lists per build per slot
│   │   ├── runewords.json           <- 95 runewords with recipes, bases, build targets
│   │   ├── runes.json               <- Full rune ladder + cube recipes (3:1 and 2:1)
│   │   ├── stash.json               <- Parsed shared stash items by page
│   │   └── farmTargets.json         <- Farm locations for low/mid/high runes
│   ├── components/
│   │   ├── GearSlotRow.tsx          <- Single gear slot row with status badge
│   │   ├── RareQualityDropdown.tsx  <- Rare/Magic/Crafted quality tier selector
│   │   ├── RuneBadge.tsx            <- Styled rune abbreviation badge
│   │   ├── RunewordCard.tsx         <- Runeword feasibility card
│   │   ├── CharacterCard.tsx        <- Dashboard character summary card
│   │   ├── CubePathTree.tsx         <- Recursive cube upgrade tree visualization
│   │   └── QualityBadge.tsx         <- Item quality color badge
│   ├── pages/
│   │   ├── Dashboard.tsx            <- Char cards, rune inventory, import instructions
│   │   ├── CharacterDetail.tsx      <- Gear table + merc gear + BIS + print/PDF
│   │   ├── RunewordPlanner.tsx      <- 95 runewords with search/sort/filter/views
│   │   ├── CubeCalculator.tsx       <- Horadric Cube forward/reverse calculator
│   │   ├── StashBrowser.tsx         <- Tabbed stash with quality filters
│   │   └── Recommendations.tsx      <- Swaps + upgrades + priority + farm targets
│   ├── hooks/
│   │   ├── useRareTiers.ts          <- localStorage rare quality tier persistence
│   │   ├── useRuneInventory.ts      <- localStorage rune count persistence
│   │   └── useRunewordFeasibility.ts <- Computes can-build status from rune counts
│   └── lib/
│       ├── runeUpgradeCalc.ts       <- Cube upgrade path calculator (uses cubeUpCount)
│       └── bisChecker.ts            <- Compares equipped item to BIS list
├── parser/                          <- Python save file parser
│   ├── parse_d2r_v2.py             <- D2R save file parser (auto-discovers saves/)
│   └── build_excel_v3.py           <- Excel generation (optional)
├── saves/                           <- Drop .d2s files here (gitignored)
├── assets/
│   └── seed/
│       └── d2r_seed_data.json       <- Source of truth snapshot
├── public/
│   └── favicon.ico
├── index.html
├── vite.config.ts
├── package.json
└── README.md

Build Phases (All Complete)
Phase 1 — Scaffold + Data Layer

Vite + React + TypeScript + Tailwind + shadcn/ui
Populate all src/data/ JSON files from seed data + hardcoded BIS/runeword knowledge
GitHub Pages deploy pipeline

Phase 2 — Dashboard

Character cards with BIS coverage badges
Rune inventory widget with import-from-text
"Ready to build" runeword callouts
D2S import instructions section

Phase 3 — Character Detail

Gear table with status badges
Rare quality tier dropdown (localStorage)
Mercenary gear table (Weapon, Helm, Armor)
Print / PDF export button

Phase 4 — Runeword Planner

95 runewords (all D2R + Season 13 + Ladder-only)
Feasibility status with cube upgrade paths
Search, sort (priority/name/level/feasibility/rune count)
Filters (feasibility, build, base type, rune count)
Grid and table view toggle

Phase 5 — Horadric Cube Calculator

Forward mode: select rune, see upgrade recipe
Reverse mode: select target, see full upgrade tree
Inventory-aware: green/red status based on rune counts
Full rune ladder reference table

Phase 6 — Stash Browser

Tabbed stash pages
Filter by quality
"Would upgrade" highlights

Phase 7 — Recommendations Engine

Cross-character swap suggestions
Stash → character upgrade suggestions
Runeword build priority ranking
Farm target suggestions for missing runes
BlizzSorc Tal Rasha lock respected

Phase 8 — D2S File Import

saves/ directory (gitignored) for .d2s files
Parser auto-discovers saves, configurable paths
npm run parse script
Output to assets/seed/d2r_items_v2.json


Data Update Workflow
When you play and update gear:

Copy updated .d2s save files into the saves/ folder
Run: npm run parse (requires Python 3 + TXT files in parser/txt/)
Output: assets/seed/d2r_items_v2.json
Manually update src/data/characters.json with new equipped gear + merc data
For newly identified RotW Season 13 items with unknown codes, add overrides
npm run deploy

Override parser paths via env vars: D2S_DIR, TXT_DIR.

The parser is intentionally separate from the app — it's a Python data pipeline that feeds the static JSON layer.

The Rare Item Quality Tier System
For any equipped item that is Rare / Magic / Crafted, a dropdown appears in the gear table:
- Rare — Placeholder (Gray): UPGRADE AVL — mediocre item
- Rare — Right Stats (Teal): NEAR-BIS — has key affixes (e.g. +2 skills, FCR, res)
- Rare — Right Stats, Find Higher Roll (Green): BIS — excellent, only better roll would improve

Stored in localStorage — survives page refresh, resets if you clear browser storage.

Runeword Feasibility Logic
Can build NOW:     all runes in inventory
1 rune away:       missing exactly 1 distinct rune (may have multiples)
2+ runes away:     missing 2+ distinct runes
Cube path:         show how many lower runes needed to cube-up to missing rune

Rune cube recipes (per diablo2.io):
- El through Ort (#1-9): 3 runes, no gem
- Thul through Lem (#10-20): 3 runes + chipped/flawed gem
- Pul through Cham (#21-32): 2 runes + gem

Cube path calculation uses the rune's cubeUpCount field from runes.json, capped at maxDepth levels.

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

Farm Target Data
Farm locations are stored in src/data/farmTargets.json, grouped by rune tier:
- Low runes (El-Thul): Countess Normal/Nightmare
- Mid runes (Amn-Fal): Countess Hell, Hellforge NM, Arcane Sanctuary
- High runes (Lem-Zod): LK Superchests, Travincal, Chaos Sanctuary, Cows, WSK

Integrated into the Recommendations page — shows best farm locations for each missing rune needed by "one_away" runewords.

Reference: https://diablo2.io/ — authoritative source for all D2R game data.
