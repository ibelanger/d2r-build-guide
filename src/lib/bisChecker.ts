import type { GearSlot, EquippedItem, BISStatus, RareTier, BISItem } from '@/types';
import bisData from '@/data/bis.json';

const bis = bisData as Record<string, Record<string, BISItem>>;

export function checkBISStatus(
  characterId: string,
  slot: GearSlot,
  equippedItem: EquippedItem | undefined,
  rareTier?: RareTier
): BISStatus {
  const charBis = bis[characterId];
  if (!charBis) {
    return { status: 'empty', currentItem: '', bisItem: '', notes: '' };
  }

  const bisItem = charBis[slot];
  if (!bisItem) {
    return { status: 'empty', currentItem: equippedItem?.name ?? '', bisItem: '', notes: '' };
  }

  if (!equippedItem) {
    return { status: 'empty', currentItem: '', bisItem: bisItem.name, notes: bisItem.notes };
  }

  // Check if equipped matches BIS by name (fuzzy — strip parenthetical)
  const equippedBase = equippedItem.name.split('(')[0].trim().toLowerCase();
  const bisBase = bisItem.name.split('(')[0].trim().toLowerCase();

  if (equippedBase === bisBase) {
    return { status: 'bis', currentItem: equippedItem.name, bisItem: bisItem.name, notes: bisItem.notes };
  }

  // For rare/magic/crafted items, check the rare tier
  const quality = equippedItem.quality;
  if (quality === 'Rare' || quality === 'Magic' || quality === 'Crafted') {
    if (rareTier === 'right_stats_find_roll') {
      return { status: 'bis', currentItem: equippedItem.name, bisItem: bisItem.name, notes: 'Right stats, find higher roll' };
    }
    if (rareTier === 'right_stats') {
      return { status: 'near_bis', currentItem: equippedItem.name, bisItem: bisItem.name, notes: 'Has key affixes' };
    }
    return { status: 'upgrade_available', currentItem: equippedItem.name, bisItem: bisItem.name, notes: bisItem.notes };
  }

  // Check if it's a runeword matching BIS
  if (equippedItem.is_runeword && equippedItem.runeword_name) {
    const rwName = equippedItem.runeword_name.toLowerCase();
    if (bisBase.includes(rwName)) {
      return { status: 'bis', currentItem: equippedItem.name, bisItem: bisItem.name, notes: bisItem.notes };
    }
  }

  return { status: 'upgrade_available', currentItem: equippedItem.name, bisItem: bisItem.name, notes: bisItem.notes };
}

export function getBISCompletion(characterId: string, equipped: Record<string, EquippedItem | undefined>, rareTiers: Record<string, RareTier | undefined>): { total: number; bis: number } {
  const slots: GearSlot[] = ['Helm', 'Armor', 'WeaponR', 'WeaponL', 'Gloves', 'Boots', 'Belt', 'Amulet', 'RingR', 'RingL'];
  let bisCount = 0;
  for (const slot of slots) {
    const tierKey = `${characterId}:${slot}`;
    const status = checkBISStatus(characterId, slot, equipped[slot], rareTiers[tierKey]);
    if (status.status === 'bis') bisCount++;
  }
  return { total: slots.length, bis: bisCount };
}
