ITHUB SETUP

Initialize repo d2r-season13-build-guide
Vite + React + TypeScript setup
Tailwind CSS + shadcn/ui
GitHub Pages deployment via npm run deploy using gh-pages
README.md with: project description, setup instructions, data update workflow (how to re-run parser and update JSON), folder structure


SEED FILES TO PLACE IN src/data/
I will provide these files — place them as-is:

d2r_seed_data.json → source of truth for characters, stash, rune inventory
parse_d2r_v2.py → Python save file parser (reference only, not used by React app)

Generate all other data files (characters.json, bis.json, runewords.json, runes.json, stash.json) from the seed data. The BIS data and runeword data should be hardcoded content — you have enough context from this prompt to populate them fully.

STRETCH GOALS (implement if time allows, otherwise stub)

Horadric Cube recipe calculator: input any 3 runes → show output rune + catalyst needed
"Farm target" suggestions: for missing runes/items, suggest which act/area to target farm
Merc gear tracker: each character's mercenary equipped items (weapon/helm/armor)
Export to PDF: print-friendly character sheet

Begin by generating the full project scaffold, all data files, and a working / dashboard page with character cards and rune inventory widget. Then implement the character detail page. Then runewords. Then stash browser. Then recommendations. Commit each major section.

Build all files according to orginization in the "D2R_REPO_BUILD_PLAN.md" file - move any current files if necessary. 
