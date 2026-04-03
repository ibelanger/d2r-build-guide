# CLAUDE.md — D2R Season 13 Build Guide Development

## Project Overview

A React + TypeScript web app for tracking Diablo II Resurrected Season 13 characters, planning runewords, browsing stash inventory, and generating cross-character optimization recommendations.

**Tech Stack:** Vite + React 19 + TypeScript + Tailwind CSS + shadcn/ui + React Router (HashRouter for GitHub Pages)

---

## Development Commands

```bash
# Start dev server (HMR enabled)
npm run dev

# Build for production
npm run build

# Lint code
npm lint

# Deploy to GitHub Pages (requires git push first)
npm run deploy
```

Dev server runs on `http://localhost:5173/`. Opens automatically.

---

## Project Structure

```
d2r-season13-build-guide/
├── src/
│   ├── data/                    # Static JSON data (no fetch, imported directly)
│   │   ├── characters.json      # 5 characters + equipped gear (merged with overrides)
│   │   ├── bis.json            # BIS targets per character per gear slot
│   │   ├── runewords.json       # 10 runewords with recipes, bases, priority
│   │   ├── runes.json           # 33-rune ladder with cube recipes
│   │   └── stash.json           # Shared stash items, grouped by page
│   │
│   ├── components/
│   │   ├── Layout.tsx           # Header nav + character links + footer
│   │   ├── CharacterCard.tsx    # Dashboard summary card (level, build, BIS %)
│   │   ├── GearSlotRow.tsx      # Gear table row with BIS comparison
│   │   ├── RunewordCard.tsx     # Runeword card with feasibility + cube paths
│   │   ├── QualityBadge.tsx     # Item quality color badge
│   │   ├── RuneBadge.tsx        # Rune badge with tier coloring
│   │   ├── RareQualityDropdown.tsx  # Tier selector (placeholder/right_stats/find_roll)
│   │   └── ui/                  # shadcn/ui components (card, badge, table, etc.)
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx        # Main landing page (char cards, rune inventory)
│   │   ├── CharacterDetail.tsx  # Gear table + BIS comparison per character
│   │   ├── RunewordPlanner.tsx  # Runeword feasibility planner with filtering
│   │   ├── StashBrowser.tsx     # Tabbed stash browser with quality filters
│   │   └── Recommendations.tsx  # Cross-character swaps + upgrades + priority
│   │
│   ├── hooks/
│   │   ├── useRareTiers.ts      # localStorage: { "CharName:Slot": tier, ... }
│   │   ├── useRuneInventory.ts  # localStorage: { "runeName": count, ... }
│   │   └── useRunewordFeasibility.ts  # Compute can_build/one_away/two_plus_away
│   │
│   ├── lib/
│   │   ├── bisChecker.ts        # Compare equipped vs BIS, factor in rare tiers
│   │   └── runeUpgradeCalc.ts   # Calculate cube upgrade paths recursively
│   │
│   ├── types/index.ts           # All TypeScript interfaces
│   ├── App.tsx                  # HashRouter setup + 5 routes
│   ├── main.tsx                 # React entry point
│   └── index.css                # Tailwind imports + theme
│
├── assets/seed/                 # Original seed data (reference only)
│   ├── d2r_seed_data.json       # Raw parsed from save files
│   ├── d2r_items_v2.json        # Full parsed items (for regeneration)
│   └── d2r_stash_v1.json        # Raw stash data (source for stash.json)
│
├── parser/                      # Python parser scripts
│   ├── parse_d2r_v2.py          # D2R save file parser (reference)
│   └── build_excel_v3.py        # Excel generation (optional)
│
├── docs/
│   └── D2R_REPO_BUILD_PLAN.md   # Detailed build specification & business rules
│
├── index.html                   # HTML entry point
├── vite.config.ts               # Vite config (base: /d2r-build-guide/)
├── tailwind.config.ts           # (empty, Tailwind v4 uses @tailwindcss/vite)
├── tsconfig.json                # Root TypeScript config
├── tsconfig.app.json            # App TypeScript config (strict mode)
├── package.json                 # Dependencies + scripts
└── README.md                    # Project readme
```

---

## Key Design Decisions

### HashRouter, Not BrowserRouter
GitHub Pages serves `index.html` for `/` but 404s on `/character/abc`. HashRouter uses `/#/character/abc`, so all routes load index.html first. This is required for static hosting without server-side routing.

### Static JSON Imports
All data files are imported via `import characters from '@/data/characters.json'`. Vite handles JSON natively with tree-shaking. No async loading or fetch needed — data is ~50KB total.

### localStorage for User State Only
Two keys:
- `d2r_rune_counts`: `{ "Tir": 17, "Tal": 33, ... }` — rune inventory (editable table on Dashboard)
- `d2r_rare_tiers`: `{ "ESWarlock:Helm": "right_stats", ... }` — rare quality tiers (persisted per slot)

Everything else is derived from static JSON.

### Rune Counts Are User-Managed
The spec is explicit: parsed rune counts are unreliable due to Season 13's stacked rune format. The rune inventory table is the source of truth, pre-populated with known accurate quantities (Tir:17, Tal:33, Ort:29, Fal:9, Ohm:3), all others at 0.

### Known Gear Overrides Baked Into characters.json
When the parser hits unknown Season 13 item codes (e.g., `mrgy` for RivvyZon gloves), a `known_gear_overrides` section in the seed data patches them. These overrides are applied at build time when generating `characters.json`. The `overridden: boolean` flag is kept for UI display.

### Cube Path Calculation Caps at 3 Levels
Showing "need 81 El runes to cube up to Vex" is noise. For runes more than 3 levels below the target, the UI shows "Farm directly."

### Tal Rasha Lock
Recommendations engine never suggests removing Tal Rasha set pieces from RivvySorc. This is hardcoded rule in the swap detection logic.

---

## Development Workflow

### Adding a New Character
1. Update `src/data/characters.json` with equipped gear
2. Add build name and BIS targets to `src/data/bis.json`
3. Character links auto-populate in Layout nav

### Editing BIS Targets
1. Edit `src/data/bis.json` per character per slot
2. Dashboard + CharacterDetail pages auto-update (no rebuild needed)

### Updating Rune Inventory
1. Dashboard → Show Rune Table → Edit quantities
2. Or paste `Tir:17, Tal:33, Ort:29` into "Import from text" field
3. Persists to localStorage, survives refresh

### Changing Rare Item Tier
1. CharacterDetail → Gear Table → Click dropdown for Rare/Magic/Crafted items
2. Select: Placeholder (gray), Right Stats (teal), Right Stats Find Higher Roll (green)
3. Persists to localStorage, affects BIS status badge immediately

### Regenerating Data Files
If you re-run the Python parser on updated save files:

```bash
# Run parser (in parser/ dir)
python parse_d2r_v2.py

# New output goes to d2r_items_v2.json
# Manually update src/data/characters.json with new equipped gear
# Apply known_gear_overrides as needed

# Rebuild app
npm run build
```

---

## localStorage Keys

### d2r_rune_counts
```json
{
  "El": 0,
  "Eld": 0,
  "Tir": 17,
  "Nef": 0,
  "Eth": 0,
  "Ith": 0,
  "Tal": 33,
  ...
}
```
All 33 runes, one entry per. Defaults to hardcoded in `runes.json`.

### d2r_rare_tiers
```json
{
  "ESWarlock:Helm": undefined,
  "ESWarlock:Belt": "right_stats",
  "RivvYZon:Gloves": "right_stats",
  "RivvySorc:RingL": undefined,
  ...
}
```
Key format: `"${characterId}:${slot}"`. Values: `undefined | "placeholder" | "right_stats" | "right_stats_find_roll"`.

---

## Debugging

### Check Current Rune Counts
```javascript
JSON.parse(localStorage.getItem('d2r_rune_counts'))
```

### Check Rare Tiers
```javascript
JSON.parse(localStorage.getItem('d2r_rare_tiers'))
```

### Reset to Defaults
Dashboard → Rune Inventory → "Reset" button. Or:
```javascript
localStorage.removeItem('d2r_rune_counts');
localStorage.removeItem('d2r_rare_tiers');
location.reload();
```

### View Console for Warnings
All TypeScript strict mode enabled. Unused variables/parameters caught at build time.

---

## Deployment

### GitHub Pages Setup
1. Repo must be named `d2r-build-guide` on GitHub (matches `vite.config.ts` base)
2. Enable GitHub Pages in repo settings → Deploy from `gh-pages` branch
3. Deploy:
   ```bash
   npm run deploy
   ```
   This runs `npm run build`, then commits to `gh-pages` branch and pushes

### First-Time Setup
```bash
git remote add origin https://github.com/yourusername/d2r-build-guide.git
git push -u origin main
npm run deploy
```

Live at: `https://yourusername.github.io/d2r-build-guide/`

---

## Testing/Verification

### Build Test
```bash
npm run build  # Should succeed with no errors
```

### Dev Server Test
```bash
npm run dev
# Click links: Dashboard → Character → Runewords → Stash → Recommendations
# Edit rune counts → feasibility updates live
# Edit rare tiers → BIS status changes immediately
```

### localStorage Persistence
1. Set rune count
2. Refresh page → count preserved
3. Open DevTools → Application → localStorage → check keys

---

## Known Limitations / Future Work

### Stretch Goals (Not Yet Implemented)
- Horadric Cube recipe calculator (input 3 runes → output + catalyst)
- Farm target suggestions (for missing runes, suggest act/area)
- Merc gear tracker (equipphed items per merc per character)
- Export to PDF (print-friendly character sheet)

### Parser Gaps
Season 13 Rise of the Warlock introduced new item codes not in bundled TXT files. Workaround: `known_gear_overrides` in seed data. If new unknown codes appear, add entries manually and regenerate `characters.json`.

### Rune Stacking
D2R S13 stacks runes in inventory (saves space). Parser doesn't fully decode stacked rune counts. Manual entry via rune table is the current solution.

---

## Contact / Issues

For questions about the build spec, see `docs/D2R_REPO_BUILD_PLAN.md`.
For questions about data, check `assets/seed/d2r_seed_data.json` (source of truth for characters).
