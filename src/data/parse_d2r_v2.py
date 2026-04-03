"""
D2R Season 13 (v105) save file parser.
Ported from Paladijn/d2rsavegameparser v3.0.0 Java source (LGPL-2.1).

Key implementation details:
- Flags use readFlippedInt → flag bit positions are translated to LSB positions
- readInt/readShort use flipByte+unflip → net result is standard LSB-first
- Simple items (is_simple=True) have special boundary-skip logic from Java
- GUID handling differs by item type (128 bits vs 3 bits)
- Chronicle data is AFTER properties/socketed items, not before
- TXT lookups use the *ID column, not row index
"""
import struct, os, json, csv

D2S_DIR = "/sessions/peaceful-admiring-cerf/mnt/Diablo II Resurrected"
TXT_DIR = "/sessions/peaceful-admiring-cerf/d2rsavegameparser/txt"

# ── TXT data loading ──────────────────────────────────────────────────────────
def load_tsv(path):
    with open(path, encoding='utf-8', errors='replace') as f:
        return list(csv.DictReader(f, delimiter='\t'))

def build_lookups():
    code_name = {}
    armor_rows = {}
    weapon_rows = {}
    misc_rows = {}

    for fname in ['armor.txt', 'weapons.txt', 'misc.txt']:
        rows = load_tsv(f"{TXT_DIR}/{fname}")
        target = armor_rows if fname == 'armor.txt' else (weapon_rows if fname == 'weapons.txt' else misc_rows)
        for r in rows:
            code = r.get('code', '').strip()
            name = r.get('name', '').strip()
            if code:
                target[code] = r
                if name:
                    code_name[code] = name

    # TXT lookups use the *ID column (not row index)
    unique_by_id = {}
    for r in load_tsv(f"{TXT_DIR}/uniqueitems.txt"):
        uid = r.get('*ID', '').strip()
        if uid.isdigit():
            unique_by_id[int(uid)] = (r.get('index', ''), r.get('code', ''))

    setitem_by_id = {}
    for r in load_tsv(f"{TXT_DIR}/setitems.txt"):
        uid = r.get('*ID', '').strip()
        if uid.isdigit():
            setitem_by_id[int(uid)] = (r.get('index', ''), r.get('code', ''), r.get('set', ''))

    # Rune code -> name (e.g. 'r07' -> 'Tal')
    rune_names = {}
    for code, r in misc_rows.items():
        name = r.get('name', '').strip()
        if code.startswith('r') and code[1:].isdigit():
            rune_names[code] = name.replace(' Rune', '')

    # Runeword: rune tuple -> name
    rune_to_runeword = {}
    for r in load_tsv(f"{TXT_DIR}/runes.txt"):
        if r.get('complete', '').strip() != '1':
            continue
        name = r.get('*Rune Name', '').strip() or r.get('Name', '').strip()
        runes = tuple(r.get(f'Rune{i}', '').strip() for i in range(1, 7) if r.get(f'Rune{i}', '').strip())
        if name and runes:
            rune_to_runeword[runes] = name

    return code_name, armor_rows, weapon_rows, misc_rows, unique_by_id, setitem_by_id, rune_names, rune_to_runeword

CODE_NAME, ARMOR_ROWS, WEAPON_ROWS, MISC_ROWS, UNIQUE_BY_ID, SETITEM_BY_ID, RUNE_NAMES, RUNE_TO_RW = build_lookups()

ARMOR_CODES  = set(ARMOR_ROWS)
WEAPON_CODES = set(WEAPON_ROWS)
MISC_CODES   = set(MISC_ROWS)

# ── Huffman decoder ───────────────────────────────────────────────────────────
HUFFMAN_RAW = {
    "11110": 'a', "0101": 'b', "01000": 'c', "110001": 'd', "110000": 'e',
    "010011": 'f', "11010": 'g', "00011": 'h', "1111110": 'i', "000101110": 'j',
    "010010": 'k', "11101": 'l', "01101": 'm', "001101": 'n', "1111111": 'o',
    "11011001": 'q', "11001": 'p', "11100": 'r', "0010": 's', "01100": 't',
    "00001": 'u', "1101110": 'v', "00000": 'w', "00111": 'x', "0001010": 'y',
    "11011000": 'z', "10": ' ', "11111011": '0', "1111100": '1', "001100": '2',
    "1101101": '3', "11111010": '4', "00010110": '5', "1101111": '6', "01111": '7',
    "000100": '8', "01110": '9',
}
HUFFMAN_TRIE = {}
for bits, ch in HUFFMAN_RAW.items():
    node = HUFFMAN_TRIE
    for b in bits[:-1]:
        node = node.setdefault(b, {})
    node[bits[-1]] = ch

# ── BitReader (LSB-first) ─────────────────────────────────────────────────────
class BitReader:
    def __init__(self, data, start_bit=0):
        self.data = data
        self.pos = start_bit

    def read(self, n):
        r = 0
        for i in range(n):
            byte_i = self.pos // 8
            bit_i  = self.pos % 8
            self.pos += 1
            if byte_i < len(self.data):
                r |= ((self.data[byte_i] >> bit_i) & 1) << i
        return r

    def peek(self, n):
        saved = self.pos
        v = self.read(n)
        self.pos = saved
        return v

    def peek_from_boundary(self, n):
        """Peek n bits starting from next byte boundary (Java peekNextBytes behavior)."""
        boundary = (self.pos + 7) & ~7
        saved = self.pos
        self.pos = boundary
        v = self.read(n)
        self.pos = saved
        return v

    def peek_next_byte(self):
        """Java peekNextByte: returns current byte if on boundary, else next byte."""
        bits_to_next = self.bits_to_boundary()
        if bits_to_next == 0:
            peek_byte = self.pos // 8
        else:
            peek_byte = (self.pos // 8) + 1
        if peek_byte < len(self.data):
            return self.data[peek_byte]
        return 0xFF

    def current_byte_value(self):
        """Java getCurrentByte: the byte currently being read from."""
        byte_i = self.pos // 8
        if byte_i < len(self.data):
            return self.data[byte_i]
        return 0

    def skip(self, n):
        self.pos += n

    def align(self):
        """Move to next byte boundary (Java moveToNextByteBoundary)."""
        self.pos = (self.pos + 7) & ~7

    def bits_to_boundary(self):
        return ((self.pos + 7) & ~7) - self.pos

    def read_huffman_char(self):
        node = HUFFMAN_TRIE
        for _ in range(12):
            b = str(self.read(1))
            if b in node:
                v = node[b]
                if isinstance(v, str):
                    return v
                node = v
        return '?'

    def read_huffman_string(self):
        result = []
        while len(result) < 4:
            ch = self.read_huffman_char()
            if ch == ' ':
                break
            result.append(ch)
        return ''.join(result)

    def bit_pos(self):
        return self.pos

    def byte_pos(self):
        return self.pos // 8

def _find_prop_end(data, bp, mx=8000):
    """Scan for 9 consecutive 1-bits (0x1FF property list terminator)."""
    for i in range(mx):
        v = 0
        pos = bp + i
        for j in range(9):
            byte_i = (pos + j) // 8
            bit_i  = (pos + j) % 8
            if byte_i < len(data):
                v |= ((data[byte_i] >> bit_i) & 1) << j
        if v == 0x1FF:
            return bp + i + 9
    return -1

# ── Constants ─────────────────────────────────────────────────────────────────
QUALITY_MAP = {1:'Inferior', 2:'Normal', 3:'Superior', 4:'Magic',
               5:'Set', 6:'Rare', 7:'Unique', 8:'Crafted'}
LOCATION_MAP = {0:'Stored', 1:'Equipped', 2:'Belt', 3:'Cursor', 6:'Stash'}
POSITION_MAP = {
    0: None, 1: 'Helm', 2: 'Amulet', 3: 'Armor',
    4: 'WeaponR', 5: 'WeaponL', 6: 'RingR', 7: 'RingL',
    8: 'Belt', 9: 'Boots', 10: 'Gloves', 11: 'WeaponR2', 12: 'WeaponL2',
}

def _is_stackable(code):
    r = MISC_ROWS.get(code) or WEAPON_ROWS.get(code)
    return r and r.get('stackable', '').strip() == '1'

def _is_advanced_stash_stackable(code):
    r = MISC_ROWS.get(code)
    return r and r.get('advancedStashStackable', '').strip() == '1' or \
           (r and len(list(r.keys())) > 170 and list(r.values())[170] == '1')

def _item_type(code):
    if code in ARMOR_CODES: return 'armor'
    if code in WEAPON_CODES: return 'weapon'
    return 'misc'

def _guid_full(code):
    """
    Returns True if this item should get a full 128-bit GUID read.
    Java: rune, gem-type, amulet-type, ring-type, charm, or non-misc item.
    """
    is_charm = code in ('cm1', 'cm2', 'cm3')
    is_rune  = code.startswith('r') and len(code) <= 3 and code[1:].isdigit()
    itype_str = ''
    if code in ARMOR_ROWS:  itype_str = ARMOR_ROWS[code].get('type', '')
    elif code in WEAPON_ROWS: itype_str = WEAPON_ROWS[code].get('type', '')
    elif code in MISC_ROWS: itype_str = MISC_ROWS[code].get('type', '')
    is_gem  = itype_str.startswith('gem')
    is_amu  = itype_str.startswith('amu')
    is_rin  = itype_str.startswith('rin')
    no_misc = code not in MISC_CODES
    return is_rune or is_gem or is_amu or is_rin or is_charm or no_misc

# ── Main item parser ──────────────────────────────────────────────────────────
def parse_item(br):
    """
    Parse one D2R item from the BitReader.
    Ported from ItemParser.java (Paladijn/d2rsavegameparser v3.0.0).
    """
    data = br.data

    # Flags (readFlippedInt → isBitChecked mapping):
    # idx→LSB: 5→4, 12→11, 17→16, 22→21, 23→22, 25→24, 27→26, 29→28
    flags = br.read(32)
    is_identified   = bool(flags & (1 << 4))
    is_socketed     = bool(flags & (1 << 11))
    is_ear          = bool(flags & (1 << 16))
    is_simple       = bool(flags & (1 << 21))
    is_ethereal     = bool(flags & (1 << 22))
    is_personalized = bool(flags & (1 << 24))
    is_runeword     = bool(flags & (1 << 26))
    has_chronicle   = bool(flags & (1 << 28))

    br.skip(3)  # version
    location  = br.read(3)
    position  = br.read(4)
    y         = br.read(4)
    x         = br.read(4)
    container = br.read(3)

    slot = POSITION_MAP.get(position) if location == 1 else LOCATION_MAP.get(location, f'loc{location}')

    # ── Ear item ──
    if is_ear:
        br.read(3); br.read(7)
        for _ in range(16):
            if br.read(7) == 0: break
        _simple_item_end(br, 'ear')
        return {'is_ear': True, 'location': location, 'slot': slot}

    code = br.read_huffman_string()
    base_name = CODE_NAME.get(code, f'[{code}]')

    item = {
        'code': code, 'base_name': base_name,
        'is_identified': is_identified, 'is_socketed': is_socketed,
        'is_simple': is_simple, 'is_ethereal': is_ethereal,
        'is_personalized': is_personalized, 'is_runeword': is_runeword,
        'has_chronicle': has_chronicle,
        'location': location, 'position': position,
        'x': x, 'y': y, 'container': container,
        'slot': slot,
        'item_name': base_name,
    }

    # ── Simple item ──
    if is_simple:
        _simple_item_end(br, code)
        return item

    # ── Extended item data (parseExtendedPart1) ──
    cnt_filled_sockets = br.read(3)
    fingerprint = br.read(32)
    item_level  = br.read(7)
    quality_id  = br.read(4)
    quality = QUALITY_MAP.get(quality_id, f'?{quality_id}')
    item['item_level'] = item_level
    item['quality'] = quality
    item['quality_id'] = quality_id

    has_pic = br.read(1)
    if has_pic:
        br.skip(3)

    has_class_info = br.read(1)
    if has_class_info:
        br.skip(11)

    # Quality-specific data
    set_id = -1
    unique_id = -1

    if quality_id == 1:      # Inferior
        br.skip(3)
    elif quality_id == 2:    # Normal
        if code in ('tbk', 'ibk'):  # tome
            br.skip(5)
    elif quality_id == 3:    # Superior
        br.skip(3)
    elif quality_id == 4:    # Magic
        br.skip(11)  # prefix
        br.skip(11)  # suffix
    elif quality_id == 5:    # Set
        set_id = br.read(12)
        item['set_id'] = set_id
        si = SETITEM_BY_ID.get(set_id)
        if si:
            item['item_name'] = si[0]
            item['set_name'] = si[2]
        else:
            item['item_name'] = f'Set?[id={set_id}]'
    elif quality_id == 6:    # Rare
        br.read(8); br.read(8)
        item['item_name'] = f'Rare {base_name}'
        for _ in range(3):
            if br.read(1): br.skip(11)
            if br.read(1): br.skip(11)
    elif quality_id == 7:    # Unique
        unique_id = br.read(12)
        item['unique_id'] = unique_id
        ui = UNIQUE_BY_ID.get(unique_id)
        if ui:
            item['item_name'] = ui[0]
        else:
            item['item_name'] = f'Unique?[id={unique_id}]'
    elif quality_id == 8:    # Crafted
        br.read(8); br.read(8)
        item['item_name'] = f'Crafted {base_name}'
        for _ in range(3):
            if br.read(1): br.skip(11)
            if br.read(1): br.skip(11)

    # Runeword skip (12 + 4 bits)
    if is_runeword:
        br.skip(12); br.skip(4)

    # Personalized name (up to 16 x 8 bits)
    if is_personalized:
        for _ in range(16):
            if br.read(8) == 0: break

    # ── GUID (between parseExtendedPart1 and parseExtendedPart2) ──
    has_guid = br.read(1)
    if has_guid:
        if _guid_full(code):
            br.skip(128)   # 4 x 32-bit GUID
        else:
            if code != 'bks':
                br.skip(3)

    # ── parseExtendedPart2 ──
    itype = _item_type(code)
    max_stacks = 0

    if itype == 'armor':
        br.skip(11)   # base defense
        max_dur = br.read(8)
        if max_dur != 0:
            br.skip(9)  # current durability
    elif itype == 'weapon':
        max_dur = br.read(8)
        if max_dur != 0:
            br.skip(9)
        wr = WEAPON_ROWS.get(code)
        if wr and wr.get('stackable', '').strip() == '1':
            br.skip(1)   # RotW stackable flag
            br.skip(9)   # stacks
            max_stacks = int(wr.get('maxstack', '0') or 0)
    else:  # misc
        mr = MISC_ROWS.get(code)
        if mr and mr.get('stackable', '').strip() == '1':
            br.skip(1)
            br.skip(9)
            max_stacks = int(mr.get('maxstack', '0') or 0)

    # RotW: skip 1 extra bit if not stackable (and not Potion of Life)
    if max_stacks == 0 and code != 'xyz':
        br.skip(1)

    # Socket count
    if is_socketed:
        item['cnt_sockets'] = br.read(4)

    # Set bonus bits (5 bits)
    lset = [0] * 5
    if quality_id == 5:
        for i in range(5):
            lset[i] = br.read(1)

    # Main magic properties list (terminated by 0x1FF)
    pe = _find_prop_end(data, br.pos)
    if pe < 0:
        item['parse_error'] = 'prop_end_not_found'
        br.align()
        return item
    br.pos = pe

    # Set bonus properties
    if quality_id == 5:
        for i in range(5):
            if lset[i]:
                pe2 = _find_prop_end(data, br.pos)
                if pe2 < 0: break
                br.pos = pe2

    # Runeword properties
    if is_runeword:
        pe2 = _find_prop_end(data, br.pos)
        if pe2 >= 0:
            br.pos = pe2

    # RotW material stash count (1 + optional 8 bits)
    has_stash = br.read(1)
    if has_stash:
        br.skip(8)

    # Socketed sub-items
    rune_codes = []
    if cnt_filled_sockets > 0:
        br.align()  # moveToNextByteBoundary before socketed items
        for _ in range(cnt_filled_sockets):
            sub = parse_item(br)
            if sub and not sub.get('is_ear'):
                rc = sub.get('code', '')
                if rc.startswith('r') and rc[1:].isdigit():
                    rune_codes.append(rc)

    # Resolve runeword name from socketed runes
    if is_runeword and rune_codes:
        rk = tuple(rune_codes)
        rw_name = RUNE_TO_RW.get(rk, '+'.join(RUNE_NAMES.get(r, r) for r in rune_codes))
        item['item_name'] = f'{rw_name} ({base_name})'
        item['runeword_name'] = rw_name
        item['rune_codes'] = rune_codes

    # Chronicle data (after properties, after sub-items)
    if has_chronicle and quality_id in (5, 7):
        _skip_chronicle_data(br)

    # Handle Potion of Life special case
    if code == 'xyz':
        br.skip(16)

    # End: move to next byte boundary
    br.align()
    return item


def _simple_item_end(br, code):
    """
    Java's simple item end handling (after Huffman decode + align).
    Implements the peekedNextByte boundary-skip logic.
    """
    # For advancedStashStackable items: read 1 bit (+ optional 8 bits)
    mr = MISC_ROWS.get(code)
    if mr:
        # Check advancedStashStackable: column index 170 in misc.txt
        cols = list(mr.keys())
        adv_stash = len(cols) > 170 and list(mr.values())[170] == '1'
        if adv_stash:
            has_data = br.read(1)
            if has_data:
                br.skip(8)

    # Align to byte boundary first
    br.align()

    # Java: peekNextByte check (peeked at current byte when on boundary)
    peeked = br.peek_next_byte()   # data[pos//8] when bitsToNextBoundary()==0
    btb = br.bits_to_boundary()    # should be 0 after align

    # Condition 1: on boundary, peeked != 16, and next16 != 0 OR next24 == 0
    if btb == 0 and peeked != 16:
        next16 = br.peek_from_boundary(16)
        next24 = br.peek_from_boundary(24)
        if next16 != 0 or next24 == 0:
            br.skip(1)

    # Condition 2: peeked == 0, current byte != 0, next16 != 0
    # Re-read peeked after possible skip
    peeked2 = br.peek_next_byte()
    cur_byte = br.current_byte_value()
    next16_2 = br.peek_from_boundary(16)
    if peeked2 == 0 and cur_byte != 0 and next16_2 != 0:
        br.skip(8)

    br.align()


def _skip_chronicle_data(br):
    """
    Skip Season 13 chronicle data for Set/Unique items.
    Java: reads 5-7 bytes based on whether next 2 bytes are 0.
    """
    br.read(8); br.read(8); br.read(8); br.read(8)  # bytes 0-3

    # Peek next 16 bits from current byte boundary
    saved = br.pos
    boundary = (br.pos + 7) & ~7
    br.pos = boundary
    peek16 = br.read(16)
    br.pos = saved

    br.read(8)  # byte 4

    if peek16 == 0:
        # 6 bytes total: read remaining bits to next boundary
        btb = br.bits_to_boundary()
        if btb > 0:
            br.read(btb)
    else:
        # 7 bytes total
        br.read(8)  # byte 5
        btb = br.bits_to_boundary()
        if btb > 0:
            br.read(btb)


# ── Character file parser ─────────────────────────────────────────────────────
CLASS_MAP = {0:'Amazon', 1:'Sorceress', 2:'Necromancer', 3:'Paladin',
             4:'Barbarian', 5:'Druid', 6:'Assassin', 7:'Warlock'}

def parse_character(path):
    with open(path, 'rb') as f:
        data = f.read()

    if len(data) < 50:
        return None

    class_id = data[0x18]
    level    = data[0x1B]
    name     = data[0x12B:0x12B+16].split(b'\x00')[0].decode('latin-1', 'replace')

    jm_pos = data.find(b'JM')
    if jm_pos < 0:
        return {'name': name, 'class': CLASS_MAP.get(class_id, '?'), 'level': int(level), 'error': 'no JM'}

    cnt = struct.unpack_from('<H', data, jm_pos + 2)[0]
    start_bit = (jm_pos + 4) * 8

    br = BitReader(data, start_bit)
    items = []
    errors = 0

    for i in range(cnt):
        br.align()
        try:
            item = parse_item(br)
            items.append(item)
        except Exception as e:
            errors += 1
            items.append({'parse_error': str(e), 'index': i})
            if errors > 10:
                break

    return {
        'name': name,
        'class': CLASS_MAP.get(class_id, f'?{class_id}'),
        'level': int(level),
        'items_total': cnt,
        'items_parsed': len(items),
        'parse_errors': errors,
        'items': items,
    }


# ── Main ──────────────────────────────────────────────────────────────────────
CHARS = [
    "ESWarlock", "RivvyZon", "RivvySorc", "RivFOHPally", "Warriv",
    "ArmorMule", "BootMule", "CharmMule", "JeweleryMule",
    "OSItemMule", "RunewordMule",
]

all_data = {}
for cname in CHARS:
    path = f"{D2S_DIR}/{cname}.d2s"
    if not os.path.exists(path):
        continue
    print(f"\nParsing {cname}...", end=' ', flush=True)
    result = parse_character(path)
    if result is None:
        print("FAILED")
        continue
    all_data[cname] = result

    equipped = [i for i in result['items']
                if i.get('location') == 1 and not i.get('is_ear') and not i.get('is_simple')]
    print(f"parsed={result['items_parsed']}/{result['items_total']} "
          f"errors={result['parse_errors']} equipped={len(equipped)}")

    for item in equipped:
        name    = item.get('item_name', item.get('base_name', '?'))
        quality = item.get('quality', '?')
        slot    = item.get('slot', '?') or '?'
        eth     = " (eth)" if item.get('is_ethereal') else ""
        rw      = f" [{item.get('runeword_name', '')}]" if item.get('is_runeword') else ""
        print(f"  [{slot:12s}] {name}{eth}{rw}  ({quality})")

with open('/sessions/peaceful-admiring-cerf/d2r_items_v2.json', 'w') as f:
    json.dump(all_data, f, indent=2, default=str)
print("\nSaved d2r_items_v2.json")
