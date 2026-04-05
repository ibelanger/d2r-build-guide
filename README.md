# D2R Season 13 Build Guide

A modern web app for tracking your Diablo II Resurrected Season 13 characters, optimizing gear with BIS comparisons, planning runewords with cube upgrade paths, and discovering cross-character upgrade opportunities.

**Live:** https://yourusername.github.io/d2r-build-guide/

---

## Features

### Dashboard
- **5 Character Summary Cards**: Name, class, level, build, BIS completion %, progress bar
- **Rune Inventory Table**: Editable counts for all 33 runes with import-from-text field
- **Ready to Build Callouts**: Runewords where you have all runes available right now
- **D2S Import Instructions**: How to parse save files and update character data

### Character Detail
- **Gear Table** (10 slots): Equipped item, quality badge, BIS target, status badge
- **Mercenary Gear Table**: Weapon, Helm, Armor for each character's merc with quality badges
- **Rare Quality Tiers**: Dropdown selector for Rare/Magic/Crafted items (persisted)
  - Placeholder (gray) = mediocre, upgrade available
  - Right Stats (teal) = has key affixes, near-BIS
  - Right Stats, Find Roll (green) = excellent, only better roll needed
- **BIS Completion**: Visual breakdown of how many slots match BIS targets
- **Print / PDF Export**: Print-friendly character sheet via browser print
- **Parser Override Notice**: Items that were manually patched due to Season 13 parser gaps

### Runeword Planner (95 Runewords)
- **Full D2R Runeword Database**: All 95 runewords including Ladder-only and Season 13 additions
- **Feasibility Status**: Can build NOW / 1 rune away / 2+ runes away (live-updated)
- **Cube Upgrade Paths**: Correct 3:1 (El-Lem) and 2:1 (Pul-Zod) ratios with proper gem catalysts
- **Sort Options**: Priority, name, level, feasibility, rune count
- **Search**: Filter by runeword name or stats text
- **Filters**: Feasibility status, target build, base type, rune count
- **View Toggle**: Grid cards or compact table view

### Horadric Cube Calculator
- **Forward Mode**: Select a rune, see what it cubes into (count + catalyst)
- **Reverse Mode**: Select a target rune, see the full upgrade tree with inventory awareness
- **Inventory-Aware**: Green = have enough, Red = need more
- **Rune Ladder Reference**: Clickable table of all 33 runes with recipes and current counts

### Stash Browser
- **Tabbed Pages**: 6 stash pages (5 regular + Materials/Runes-Gems)
- **Quality Filters**: Unique, Set, Rare, Magic, Crafted, Runeword (toggle any combination)
- **Upgrade Highlights**: Items in stash that match BIS for any character
- **Ethereal & Runeword Markers**: Quick visual cues

### Recommendations
- **Runeword Build Priority**: Ordered by feasibility + impact (can build now at top)
- **Farm Target Suggestions**: For missing runes, shows best farm locations (Countess, LK, Travincal, etc.)
- **Stash-to-Character Upgrades**: Items in stash that upgrade someone to BIS
- **Cross-Character Swaps**: Items character A has that are BIS for character B
- **Tal Rasha Lock**: Never suggests removing Tal Rasha set pieces from RivvySorc

---

## Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/d2r-build-guide.git
cd d2r-build-guide
npm install
```

### 2. Run Locally
```bash
npm run dev
# Opens http://localhost:5173/ automatically
```

### 3. Edit Rune Counts
Dashboard -> Show Rune Table -> Edit quantities or import from text:
```
Tir:17, Tal:33, Ort:29, Fal:9, Ohm:3
```

### 4. Set Rare Item Tiers
CharacterDetail -> Gear Table -> Click dropdown for any Rare/Magic/Crafted item

### 5. Deploy to GitHub Pages
```bash
npm run build   # Verify no errors
npm run deploy  # Push to gh-pages branch
```

---

## Data Update Workflow

### Parsing D2R Save Files
1. Copy your `.d2s` save files into the `saves/` directory
2. Run: `npm run parse`
3. Output goes to `assets/seed/d2r_items_v2.json`
4. Manually update `src/data/characters.json` with new equipped gear
5. Apply any Season 13 item code patches to overrides if needed
6. Rebuild: `npm run build && npm run deploy`

The parser uses a pre-built `parser/item_lookup.json` (no external TXT files required). To regenerate the lookup data: `python3 parser/generate_lookup.py`. Override parser paths via environment variables: `D2S_DIR`, `TXT_DIR`.

### Adding a New Character
1. Edit `src/data/characters.json`: add new character entry with equipped gear + merc data
2. Edit `src/data/bis.json`: add BIS targets for the new character
3. No rebuild needed — hot reload works
4. Character appears in nav automatically

---

## Project Structure

```
d2r-build-guide/
├── src/
│   ├── data/                    (characters, bis, runewords, runes, stash, farmTargets)
│   ├── components/              (Layout, CharacterCard, GearSlotRow, RunewordCard,
│   │                             CubePathTree, QualityBadge, RuneBadge, RareQualityDropdown)
│   ├── pages/                   (Dashboard, CharacterDetail, RunewordPlanner,
│   │                             CubeCalculator, StashBrowser, Recommendations)
│   ├── hooks/                   (useRareTiers, useRuneInventory, useRunewordFeasibility)
│   ├── lib/                     (bisChecker, runeUpgradeCalc)
│   ├── types/index.ts
│   ├── App.tsx                  (HashRouter + 6 routes)
│   └── main.tsx
├── assets/seed/                 (Original seed data for reference & regeneration)
├── parser/                      (Python D2S parser + item lookup + Excel builder)
├── saves/                       (Drop .d2s files here, gitignored)
├── docs/                        (D2R_REPO_BUILD_PLAN.md)
├── index.html
├── vite.config.ts               (base: /d2r-build-guide/)
├── package.json
├── CLAUDE.md                    (Developer guide)
└── README.md
```

---

## Characters

**5 Season 13 Characters:**

| Name | Class | Level | Build |
|------|-------|-------|-------|
| **ESWarlock** | Warlock | 90 | Echoing Strike |
| **RivvyZon** | Amazon | 89 | Lightning Fury / Charged Strike |
| **RivvySorc** | Sorceress | 91 | Blizzard (Tal Rasha Set) |
| **RivFOHPally** | Paladin | 89 | Fist of the Heavens |
| **Warriv** | Warlock | 93 | Warlock (Main) |

---

## Tech Stack

- **Vite 8** — Lightning-fast build tooling + HMR
- **React 19** — UI framework
- **TypeScript** — Strict mode enabled
- **Tailwind CSS v4** — Utility-first styling with @tailwindcss/vite
- **shadcn/ui** — High-quality, headless React components
- **React Router v7** — HashRouter for GitHub Pages compatibility
- **JSON imports** — Vite handles natively, no fetch needed

---

## Development

```bash
npm install          # Install dependencies
npm run dev          # Dev server (HMR enabled)
npm run build        # Build for production
npm run lint         # Lint code
npm run parse        # Parse D2S save files (requires Python 3)
npm run deploy       # Deploy to GitHub Pages
```

For detailed dev guide, see [CLAUDE.md](./CLAUDE.md).

---

## Known Limitations

### Parser Gaps
Season 13 introduced new item codes not in base D2R data files. The pre-built `item_lookup.json` includes hardcoded S13 entries, but truly new items may show as `Set?[id=1234]` or are skipped. Workaround: manually patch via `known_gear_overrides` in the data layer, or update the S13 extras in `parser/generate_lookup.py`.

### Rune Stacking
D2R S13 stacks runes in inventory to save space. The parser doesn't fully decode stacked counts. Current solution: editable rune table (user-managed source of truth).

---

## License

MIT — See [LICENSE](./LICENSE) file.

---

## Credits

- **D2 Data:** Diablo II Resurrected (Blizzard), [diablo2.io](https://diablo2.io/) (authoritative reference)
- **Parser:** Ported from [Paladijn/d2rsavegameparser](https://github.com/Paladijn/d2rsavegameparser) (LGPL-2.1)
- **Item Data:** [pinkufairy/D2R-Excel](https://github.com/pinkufairy/D2R-Excel) (D2R data files)
- **UI:** Built with shadcn/ui + React
- **Build:** Vite + TypeScript

---

## Questions?

- **Development:** See [CLAUDE.md](./CLAUDE.md) for architecture, commands, and debugging
- **Build Spec:** See [docs/D2R_REPO_BUILD_PLAN.md](./docs/D2R_REPO_BUILD_PLAN.md) for detailed requirements
- **Data Source:** See `assets/seed/d2r_seed_data.json` (ground truth for characters)
