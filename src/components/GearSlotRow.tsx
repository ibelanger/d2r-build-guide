import type { GearSlot, EquippedItem, RareTier, BISStatus } from '@/types';
import { QualityBadge } from './QualityBadge';
import { RareQualityDropdown } from './RareQualityDropdown';
import { Badge } from '@/components/ui/badge';
import { checkBISStatus } from '@/lib/bisChecker';

const statusStyles: Record<BISStatus['status'], { label: string; className: string }> = {
  bis: { label: 'BIS', className: 'bg-green-700/80 text-green-100' },
  near_bis: { label: 'NEAR-BIS', className: 'bg-teal-700/80 text-teal-100' },
  upgrade_available: { label: 'UPGRADE AVL', className: 'bg-gray-600/80 text-gray-200' },
  empty: { label: 'EMPTY', className: 'bg-red-800/80 text-red-200' },
};

interface Props {
  characterId: string;
  slot: GearSlot;
  item?: EquippedItem;
  rareTier?: RareTier;
  onRareTierChange?: (tier: RareTier) => void;
}

export function GearSlotRow({ characterId, slot, item, rareTier, onRareTierChange }: Props) {
  const bisStatus = checkBISStatus(characterId, slot, item, rareTier);
  const style = statusStyles[bisStatus.status];
  const isRareType = item && (item.quality === 'Rare' || item.quality === 'Magic' || item.quality === 'Crafted');

  return (
    <tr className="border-b border-border/50 hover:bg-accent/30">
      <td className="px-3 py-2 font-medium text-sm whitespace-nowrap">{slot}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">{item?.name ?? '—'}</span>
          {item?.is_ethereal && <Badge className="bg-purple-800/60 text-purple-200 text-[10px]">ETH</Badge>}
          {item?.overridden && <Badge className="bg-slate-700/60 text-slate-300 text-[10px]">OVR</Badge>}
        </div>
        {item?.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
      </td>
      <td className="px-3 py-2">{item && <QualityBadge quality={item.quality} />}</td>
      <td className="px-3 py-2 text-sm text-muted-foreground">{bisStatus.bisItem}</td>
      <td className="px-3 py-2">
        <Badge className={`${style.className} text-xs`}>{style.label}</Badge>
      </td>
      <td className="px-3 py-2">
        {isRareType && onRareTierChange && (
          <RareQualityDropdown value={rareTier} onChange={onRareTierChange} />
        )}
      </td>
    </tr>
  );
}
