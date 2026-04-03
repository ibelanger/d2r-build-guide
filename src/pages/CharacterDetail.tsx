import { useParams, Navigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GearSlotRow } from '@/components/GearSlotRow';
import { useRareTiers } from '@/hooks/useRareTiers';
import { getBISCompletion } from '@/lib/bisChecker';
import charactersData from '@/data/characters.json';
import type { Character, GearSlot } from '@/types';

const characters = charactersData as Record<string, Character>;
const GEAR_SLOTS: GearSlot[] = ['Helm', 'Armor', 'WeaponR', 'WeaponL', 'Gloves', 'Boots', 'Belt', 'Amulet', 'RingR', 'RingL'];

export function CharacterDetail() {
  const { characterId } = useParams<{ characterId: string }>();
  const { tiers, getTier, setTier } = useRareTiers();

  if (!characterId || !characters[characterId]) {
    return <Navigate to="/" replace />;
  }

  const char = characters[characterId];
  const equipped = char.equipped as Record<string, (typeof char.equipped)[keyof typeof char.equipped]>;
  const { total, bis } = getBISCompletion(char.id, equipped, tiers);
  const overriddenSlots = GEAR_SLOTS.filter(slot => equipped[slot]?.overridden);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{char.name}</h1>
          <p className="text-sm text-muted-foreground">{char.class} — {char.build}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-secondary text-secondary-foreground">Level {char.level}</Badge>
          <Badge className={`${bis === total ? 'bg-green-700 text-green-100' : 'bg-secondary text-secondary-foreground'}`}>
            {bis}/{total} BIS
          </Badge>
        </div>
      </div>

      {/* Override notice */}
      {overriddenSlots.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-md px-4 py-2 text-xs text-muted-foreground">
          Parser override active on {overriddenSlots.length} slot(s): {overriddenSlots.join(', ')}.
          These items were manually patched due to Season 13 parser gaps.
        </div>
      )}

      {/* Gear Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Equipment</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">Slot</th>
                  <th className="px-3 py-2 text-left font-medium">Equipped</th>
                  <th className="px-3 py-2 text-left font-medium">Quality</th>
                  <th className="px-3 py-2 text-left font-medium">BIS Target</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-left font-medium">Tier</th>
                </tr>
              </thead>
              <tbody>
                {GEAR_SLOTS.map(slot => (
                  <GearSlotRow
                    key={slot}
                    characterId={char.id}
                    slot={slot}
                    item={equipped[slot]}
                    rareTier={getTier(char.id, slot)}
                    onRareTierChange={tier => setTier(char.id, slot, tier)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
