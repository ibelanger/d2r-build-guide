"""
Generate parser/item_lookup.json from D2R TXT data files.

Usage:
  # Download from pinkufairy/D2R-Excel (default):
  python3 parser/generate_lookup.py

  # Use local TXT files:
  python3 parser/generate_lookup.py --txt-dir /path/to/txt

Output: parser/item_lookup.json
"""
import csv, json, os, sys, io

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_PATH = os.path.join(SCRIPT_DIR, "item_lookup.json")

GITHUB_RAW = "https://raw.githubusercontent.com/pinkufairy/D2R-Excel/main"
REQUIRED_FILES = ["armor.txt", "weapons.txt", "misc.txt", "uniqueitems.txt", "setitems.txt", "runes.txt"]

# Season 13 (Rise of the Warlock) items not in base D2R TXT files.
# These are hardcoded from known_gear_overrides in the seed data.
S13_EXTRAS = {
    "armor": {
        "ctss": {"name": "Caster Shield", "type": "shie"},
        "ctsb": {"name": "Caster Body Armor", "type": "tors"},
        "ctwf": {"name": "Caster Weapon Focus", "type": "wand"},
        "ewww": {"name": "Warlock Circlet", "type": "helm"},
        "ncsd": {"name": "Necro Shield", "type": "shie"},
    },
    "weapons": {
        "9z7p": {"name": "Warlock Staff", "type": "staf", "stackable": False, "maxstack": 0},
        "wwww": {"name": "Warlock Wand", "type": "wand", "stackable": False, "maxstack": 0},
    },
    "misc": {
        "mrgy": {"name": "Warlock Orb", "type": "misc", "stackable": False, "maxstack": 0, "advancedStashStackable": False},
        "bt":   {"name": "Bounty Token", "type": "misc", "stackable": True, "maxstack": 50, "advancedStashStackable": False},
        "rpur": {"name": "Purification Rune", "type": "rune", "stackable": True, "maxstack": 1, "advancedStashStackable": True},
    },
}


def load_tsv_from_text(text):
    """Parse TSV text into list of dicts."""
    return list(csv.DictReader(io.StringIO(text), delimiter='\t'))


def load_tsv_from_file(path):
    """Parse TSV file into list of dicts."""
    with open(path, encoding='utf-8', errors='replace') as f:
        return list(csv.DictReader(f, delimiter='\t'))


def download_file(fname):
    """Download a file from pinkufairy/D2R-Excel."""
    import urllib.request
    url = f"{GITHUB_RAW}/{fname}"
    print(f"  Downloading {fname}...", end=" ", flush=True)
    with urllib.request.urlopen(url) as resp:
        text = resp.read().decode('utf-8', errors='replace')
    print(f"OK ({len(text)} bytes)")
    return text


def load_all(txt_dir=None):
    """Load all TXT files, either from local dir or GitHub."""
    data = {}
    for fname in REQUIRED_FILES:
        if txt_dir:
            path = os.path.join(txt_dir, fname)
            if not os.path.exists(path):
                print(f"ERROR: {path} not found")
                sys.exit(1)
            data[fname] = load_tsv_from_file(path)
        else:
            text = download_file(fname)
            data[fname] = load_tsv_from_text(text)
    return data


def get_col_170_value(row):
    """Check column index 170 (0-indexed) for AdvancedStashStackable."""
    values = list(row.values())
    if len(values) > 170:
        return values[170] == '1'
    return False


def build_lookup(data):
    """Build the minimal lookup JSON from raw TSV data."""
    result = {"armor": {}, "weapons": {}, "misc": {}, "uniques": {}, "setitems": {}, "runewords": []}

    # Armor
    for r in data["armor.txt"]:
        code = r.get("code", "").strip()
        if not code:
            continue
        result["armor"][code] = {
            "name": r.get("name", "").strip(),
            "type": r.get("type", "").strip(),
        }

    # Weapons
    for r in data["weapons.txt"]:
        code = r.get("code", "").strip()
        if not code:
            continue
        result["weapons"][code] = {
            "name": r.get("name", "").strip(),
            "type": r.get("type", "").strip(),
            "stackable": r.get("stackable", "").strip() == "1",
            "maxstack": int(r.get("maxstack", "0").strip() or 0),
        }

    # Misc (with advancedStashStackable from column 170)
    for r in data["misc.txt"]:
        code = r.get("code", "").strip()
        if not code:
            continue
        result["misc"][code] = {
            "name": r.get("name", "").strip(),
            "type": r.get("type", "").strip(),
            "stackable": r.get("stackable", "").strip() == "1",
            "maxstack": int(r.get("maxstack", "0").strip() or 0),
            "advancedStashStackable": get_col_170_value(r),
        }

    # Unique items
    for r in data["uniqueitems.txt"]:
        uid = r.get("*ID", "").strip()
        if not uid.isdigit():
            continue
        result["uniques"][uid] = {
            "index": r.get("index", "").strip(),
            "code": r.get("code", "").strip(),
        }

    # Set items
    for r in data["setitems.txt"]:
        uid = r.get("*ID", "").strip()
        if not uid.isdigit():
            continue
        result["setitems"][uid] = {
            "index": r.get("index", "").strip(),
            "code": r.get("code", "").strip(),
            "set": r.get("set", "").strip(),
        }

    # Runewords
    for r in data["runes.txt"]:
        if r.get("complete", "").strip() != "1":
            continue
        name = r.get("*Rune Name", "").strip() or r.get("Name", "").strip()
        runes = [r.get(f"Rune{i}", "").strip() for i in range(1, 7)]
        runes = [rc for rc in runes if rc]
        if name and runes:
            result["runewords"].append({"name": name, "runes": runes})

    # Add Season 13 extras
    for category, items in S13_EXTRAS.items():
        for code, info in items.items():
            if code not in result[category]:
                result[category][code] = info

    return result


def main():
    txt_dir = None
    if "--txt-dir" in sys.argv:
        idx = sys.argv.index("--txt-dir")
        if idx + 1 < len(sys.argv):
            txt_dir = sys.argv[idx + 1]
        else:
            print("ERROR: --txt-dir requires a path argument")
            sys.exit(1)

    if txt_dir:
        print(f"Loading TXT files from {txt_dir}...")
    else:
        print("Downloading TXT files from pinkufairy/D2R-Excel...")

    data = load_all(txt_dir)

    print("Building lookup JSON...")
    lookup = build_lookup(data)

    # Stats
    print(f"  armor:     {len(lookup['armor'])} items")
    print(f"  weapons:   {len(lookup['weapons'])} items")
    print(f"  misc:      {len(lookup['misc'])} items")
    print(f"  uniques:   {len(lookup['uniques'])} items")
    print(f"  setitems:  {len(lookup['setitems'])} items")
    print(f"  runewords: {len(lookup['runewords'])} entries")

    with open(OUTPUT_PATH, "w") as f:
        json.dump(lookup, f, indent=2, ensure_ascii=False)
    print(f"\nSaved {OUTPUT_PATH} ({os.path.getsize(OUTPUT_PATH)} bytes)")


if __name__ == "__main__":
    main()
