import { Badge } from '@/components/ui/badge';

function getRuneTier(runeName: string): string {
  const highRunes = ['Lem', 'Pul', 'Um', 'Mal', 'Ist', 'Gul', 'Vex', 'Ohm', 'Lo', 'Sur', 'Ber', 'Jah', 'Cham', 'Zod'];
  const midRunes = ['Amn', 'Sol', 'Shael', 'Dol', 'Hel', 'Io', 'Lum', 'Ko', 'Fal'];

  if (highRunes.includes(runeName)) return 'bg-amber-800/80 text-amber-100 border-amber-600';
  if (midRunes.includes(runeName)) return 'bg-blue-800/80 text-blue-100 border-blue-600';
  return 'bg-gray-700/80 text-gray-200 border-gray-500';
}

export function RuneBadge({ rune }: { rune: string }) {
  return (
    <Badge className={`${getRuneTier(rune)} text-xs font-mono border`}>
      {rune}
    </Badge>
  );
}
