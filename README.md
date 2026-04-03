# D2R Season 13 Build Guide

A modern web app for tracking your Diablo II Resurrected Season 13 characters, optimizing gear with BIS comparisons, planning runewords with cube upgrade paths, and discovering cross-character upgrade opportunities.

**Live:** https://yourusername.github.io/d2r-build-guide/

---

## Features

### 📊 Dashboard
- **5 Character Summary Cards**: Name, class icon, level, build, BIS completion %, progress bar
- **Rune Inventory Table**: Editable counts for all 33 runes with import-from-text field
- **Ready to Build Callouts**: Runewords where you have all runes available right now

### 👤 Character Detail
- **Gear Table** (10 slots): Equipped item, quality badge, BIS target, status badge
- **Rare Quality Tiers**: Dropdown selector for Rare/Magic/Crafted items (persisted)
  - Placeholder (gray) = mediocre, upgrade available
  - Right Stats (teal) = has key affixes, near-BIS
  - Right Stats, Find Roll (green) = excellent, only better roll needed
- **BIS Completion**:  Visual breakdown of how many slots match BIS targets
- **Parser Override Notice**: Items that were manually patched due to Season 13 parser gaps

### 🔮 Runeword Planner
- **Feasibility Status**: Can build NOW / 1 rune away / 2+ runes away (live-updated as you edit rune counts)
- **Cube Upgrade Paths**: For each missing rune, show how many lower runes + catalysts needed
- **Base Recommendations**: Suggested base items for each runeword
- **Filter by Build**: Focus on runewords for specific characters
- **Sort by Priority**: 10 key runewords ordered by impact

### 💾 Stash Browser
- **Tabbed Pages**: 6 stash pages (5 regular + Materials/Runes-Gems)
- **Quality Filters**: Unique, Set, Rare, Magic, Crafted, Runeword (toggle any combination)
- **Upgrade Highlights**: Items in stash that match BIS for any character who doesn't have them
- **Ethereal & Runeword Markers**: Quick visual cues

### 🎯 Recommendations
- **Runeword Build Priority**: Ordered by feasibility + impact (can build now at top)
- **Stash→Character Upgrades**: Items in stash that upgrade someone to BIS
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
Dashboard → Show Rune Table → Edit quantities or import from text:
```
Tir:17, Tal:33, Ort:29, Fal:9, Ohm:3
```

### 4. Set Rare Item Tiers
CharacterDetail → Gear Table → Click dropdown for any Rare/Magic/Crafted item

### 5. Deploy to GitHub Pages
```bash
npm run build   # Verify no errors
npm run deploy  # Push to gh-pages branch
```

---

## Data Update Workflow

### If You Get New Items / Equipment
1. Run the D2R save parser on your updated save files:
   ```bash
   cd parser
   python parse_d2r_v2.py > ../assets/seed/d2r_items_v2.json
   ```
2. Manually update `src/data/characters.json` with new equipped gear
3. Apply any unknown Season 13 item code patches to `known_gear_overrides` (if needed)
4. Rebuild:
   ```bash
   npm run build
   npm run deploy
   ```

### If You Want to Add a New Character
1. Edit `src/data/characters.json`: add new character entry with equipped gear
2. Edit `src/data/bis.json`: add BIS targets for the new character
3. No rebuild needed — hot reload works
4. Character appears in nav automatically

### If You Find a Parser Gap
Some Season 13 item codes (e.g., `mrgy` for Amazon gloves, `ctss` for belt) are unknown. Workaround:
1. Add entry to `known_gear_overrides` in `src/data/characters.json`
2. Rebuild app

---

## Project Structure

**Key Files:**
- `src/data/` — Static JSON (characters, BIS, runewords, runes, stash)
- `src/components/` — React components (Layout, cards, badges, rows)
- `src/pages/` — Page components (Dashboard, CharacterDetail, RunewordPlanner, StashBrowser, Recommendations)
- `src/hooks/` — Custom hooks (useRareTiers, useRuneInventory, useRunewordFeasibility)
- `src/lib/` — Utility functions (bisChecker, runeUpgradeCalc)
- `assets/seed/` — Original seed data (for reference & regeneration)
- `parser/` — Python parser scripts
- `docs/` — Detailed build specification (D2R_REPO_BUILD_PLAN.md)

For full architecture details, see [CLAUDE.md](./CLAUDE.md).

---

## Folder Structure

```
d2r-season13-build-guide/
├── src/
│   ├── data/		        (characters.json, bis.json, runewords.json, runes.json, stash.json)
│   ├── components/          (UI components + shadcn/ui)
│   ├── pages/               (Dashboard, CharacterDetail, RunewordPlanner, StashBrowser, Recommendations)
│   ├── hooks/               (useRareTiers, useRuneInventory, useRunewordFeasibility)
│   ├── lib/                 (bisChecker, runeUpgradeCalc)
│   ├── types/index.ts       (All TypeScript interfaces)
│   ├── App.tsx              (Router setup)
│   └── main.tsx
├── assets/seed/             (Original d2r_seed_data.json, d2r_items_v2.json, d2r_stash_v1.json)
├── parser/                  (Python scripts: parse_d2r_v2.py, build_excel_v3.py)
├── docs/                    (D2R_REPO_BUILD_PLAN.md — detailed spec)
├── index.html               (HTML entry point)
├── vite.config.ts           (Vite config with base: /d2r-build-guide/)
├── tailwind.config.ts       (Tailwind v4 config)
├── tsconfig.json            (TypeScript root config)
├── package.json             (Dependencies + npm scripts)
├── CLAUDE.md                (Developer guide)
└── README.md                (This file)
```

---

## Characters

**5 Season 13 Characters:**

| Name | Class | Level | Build |
|------|-------|-------|-------|
| **ESWarlock** | Warlock | 90 | Energy Shield + Combat |
| **RivvyZon** | Amazon | 89 | Lightning Fury / Charged Strike |
| **RivvySorc** | Sorceress | 91 | Blizzard (Tal Rasha Set) |
| **RivFOHPally** | Paladin | 89 | Fist of the Heavens |
| **Warriv** | Warlock | 93 | Warlock (Main) |

---

## Key Runewords (10 Tracked)

| Runeword | Runes | Status | Priority |
|----------|-------|--------|----------|
| Call to Arms | Amn+Ral+Mal+Ist+Ohm | **BUILD NOW** | 1st |
| Heart of the Oak | Ko+Vex+Pul+Thul | **BUILD NOW** | 2nd |
| Spirit | Tal+Thul+Ort+Amn | **BUILD NOW** | 3rd |
| Insight | Ral+Tir+Tal+Sol | **BUILD NOW** | 4th |
| Treachery | Shael+Thul+Lem | **BUILD NOW** | 5th |
| Enigma | Jah+Ith+Ber | 1 RUNE AWAY | 6th |
| Chains of Honor | Dol+Um+Ber+Ist | 1 RUNE AWAY | 7th |
| Infinity | Ber+Mal+Ber+Ist | 2+ AWAY | 8th |
| Grief | Eth+Tir+Lo+Mal+Ral | 2+ AWAY | 9th |
| Fortitude | El+Sol+Dol+Lo | 2+ AWAY | 10th |

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
# Install
npm install

# Dev server (HMR enabled)
npm run dev

# Build for production
npm run build

# Lint
npm lint

# Deploy (requires npm run build first)
npm run deploy
```

For detailed dev guide, see [CLAUDE.md](./CLAUDE.md).

---

## Known Limitations

### Parser Gaps
Season 13 introduced new item codes that aren't in the bundled D2 TXT reference files. Items with unknown codes show as `Set?[id=1234]` or are skipped. Workaround: manually patch via `known_gear_overrides` in the data layer.

### Rune Stacking
D2R S13 stacks runes in inventory to save space. The parser doesn't fully decode stacked counts. Current solution: editable rune table (user-managed source of truth).

### Stash Item Parsing
Stash items from `d2r_stash_v1.json` are parsed but some garbage entries with empty codes are filtered out at generation time.

---

## Future Work (Stretch Goals)

- [ ] Horadric Cube recipe calculator (pick 3 runes → show output + catalyst)
- [ ] Farm target suggestions (for missing runes, suggest Act/Area to farm)
- [ ] Mercenary gear tracker (equipped items per merc per character)
- [ ] Export to PDF (print-friendly character sheet)

---

## License

MIT — See [LICENSE](./LICENSE) file.

---

## Credits

- **D2 Data:** Diablo II Resurrected (Blizzard)
- **Parser:** Ported from [Paladijn/d2rsavegameparser](https://github.com/Paladijn/d2rsavegameparser) (LGPL-2.1)
- **UI:** Built with shadcn/ui + React
- **Build:** Vite + TypeScript

---

## Questions?

- **Development:** See [CLAUDE.md](./CLAUDE.md) for architecture, commands, and debugging
- **Build Spec:** See [docs/D2R_REPO_BUILD_PLAN.md](./docs/D2R_REPO_BUILD_PLAN.md) for detailed requirements
- **Data Source:** See `assets/seed/d2r_seed_data.json` (ground truth for characters)

Happy building! ⚔️
