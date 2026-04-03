import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRuneInventory } from '@/hooks/useRuneInventory';
import { useRunewordFeasibility } from '@/hooks/useRunewordFeasibility';
import { checkBISStatus } from '@/lib/bisChecker';
import { useRareTiers } from '@/hooks/useRareTiers';
import charactersData from '@/data/characters.json';
import bisData from '@/data/bis.json';
import stashData from '@/data/stash.json';
import runewordsData from '@/data/runewords.json';
import type { Character, GearSlot, BISItem, StashPage, Runeword } from '@/types';

const characters = Object.values(charactersData) as Character[];
const bis = bisData as Record<string, Record<string, BISItem>>;
const stash = stashData as { pages: StashPage[] };
const runewords = runewordsData as Runeword[];

const GEAR_SLOTS: GearSlot[] = ['Helm', 'Armor', 'WeaponR', 'WeaponL', 'Gloves', 'Boots', 'Belt', 'Amulet', 'RingR', 'RingL'];

function isTalRashaLocked(charId: string, itemName: string): boolean {
  return charId === 'RivvySorc' && itemName.toLowerCase().includes('tal rasha');
}

export function Recommendations() {
  const { counts } = useRuneInventory();
  const { getFeasibility } = useRunewordFeasibility(counts);
  const { tiers } = useRareTiers();

  // 1. Stash→Character upgrades
  const stashUpgrades: { item: string; charId: string; slot: string }[] = [];
  const allStashItems = stash.pages.flatMap(p => p.items);

  for (const char of characters) {
    for (const slot of GEAR_SLOTS) {
      const charBis = bis[char.id]?.[slot];
      if (!charBis) continue;

      const equipped = char.equipped[slot];
      const status = checkBISStatus(char.id, slot, equipped, tiers[`${char.id}:${slot}`]);
      if (status.status === 'bis') continue;

      const bisNameLower = charBis.name.split('(')[0].trim().toLowerCase();
      const stashMatch = allStashItems.find(
        item => item.name.toLowerCase().includes(bisNameLower) || bisNameLower.includes(item.name.toLowerCase())
      );
      if (stashMatch) {
        stashUpgrades.push({ item: stashMatch.name, charId: char.id, slot });
      }
    }
  }

  // 2. Cross-character swap opportunities
  const swaps: { from: string; to: string; item: string; slot: string }[] = [];
  for (const charA of characters) {
    for (const slot of GEAR_SLOTS) {
      const itemA = charA.equipped[slot];
      if (!itemA) continue;
      if (isTalRashaLocked(charA.id, itemA.name)) continue;

      for (const charB of characters) {
        if (charA.id === charB.id) continue;
        const charBBis = bis[charB.id]?.[slot];
        if (!charBBis) continue;

        const bisNameLower = charBBis.name.split('(')[0].trim().toLowerCase();
        const itemNameLower = itemA.name.split('(')[0].trim().toLowerCase();

        if (itemNameLower === bisNameLower) {
          const statusB = checkBISStatus(charB.id, slot, charB.equipped[slot], tiers[`${charB.id}:${slot}`]);
          if (statusB.status !== 'bis') {
            swaps.push({ from: charA.id, to: charB.id, item: itemA.name, slot });
          }
        }
      }
    }
  }

  // 3. Runeword priority
  const runewordPriority = runewords
    .map(rw => ({ rw, feasibility: getFeasibility(rw) }))
    .filter(({ feasibility }) => feasibility.status !== 'two_plus_away')
    .sort((a, b) => {
      if (a.feasibility.status === 'can_build' && b.feasibility.status !== 'can_build') return -1;
      if (a.feasibility.status !== 'can_build' && b.feasibility.status === 'can_build') return 1;
      return a.rw.priority - b.rw.priority;
    });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Recommendations</h1>
        <p className="text-sm text-muted-foreground">Cross-character optimization suggestions</p>
      </div>

      {/* Runeword Build Priority */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Runeword Build Priority</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {runewordPriority.length === 0 && (
            <p className="text-sm text-muted-foreground">No runewords within reach. Farm more runes!</p>
          )}
          {runewordPriority.map(({ rw, feasibility }) => (
            <div key={rw.name} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
              <div>
                <span className="text-sm font-medium">{rw.name}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({rw.targetBuilds.join(', ') || 'General'})
                </span>
              </div>
              <Badge className={`text-xs ${
                feasibility.status === 'can_build'
                  ? 'bg-green-700 text-green-100'
                  : 'bg-yellow-700 text-yellow-100'
              }`}>
                {feasibility.status === 'can_build' ? 'BUILD NOW' : '1 RUNE AWAY'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Stash Upgrades */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stash Items That Upgrade Characters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {stashUpgrades.length === 0 && (
            <p className="text-sm text-muted-foreground">No stash items match BIS targets for any character.</p>
          )}
          {stashUpgrades.map((u, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
              <span className="text-sm">{u.item}</span>
              <Badge className="bg-green-800/60 text-green-200 text-xs">
                {u.charId} {u.slot}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cross-Character Swaps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cross-Character Swap Opportunities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {swaps.length === 0 && (
            <p className="text-sm text-muted-foreground">No swap opportunities found.</p>
          )}
          {swaps.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
              <span className="text-sm">
                Move <span className="font-medium">{s.item}</span> from {s.from}
              </span>
              <Badge className="bg-blue-800/60 text-blue-200 text-xs">
                {s.to} {s.slot}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
