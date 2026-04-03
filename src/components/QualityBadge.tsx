import { Badge } from '@/components/ui/badge';

const qualityColors: Record<string, string> = {
  Unique: 'bg-amber-700/80 text-amber-100 hover:bg-amber-700',
  Set: 'bg-green-700/80 text-green-100 hover:bg-green-700',
  Rare: 'bg-yellow-600/80 text-yellow-100 hover:bg-yellow-600',
  Magic: 'bg-blue-700/80 text-blue-100 hover:bg-blue-700',
  Crafted: 'bg-orange-600/80 text-orange-100 hover:bg-orange-600',
  Runeword: 'bg-slate-600/80 text-slate-100 hover:bg-slate-600',
  Normal: 'bg-gray-600/80 text-gray-100 hover:bg-gray-600',
};

export function QualityBadge({ quality }: { quality: string }) {
  const color = qualityColors[quality] ?? qualityColors.Normal;
  return (
    <Badge className={`${color} text-xs font-medium`}>
      {quality || 'Normal'}
    </Badge>
  );
}
