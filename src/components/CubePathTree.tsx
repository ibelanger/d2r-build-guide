import { RuneBadge } from './RuneBadge';
import { getRuneByName, getRuneLadder } from '@/lib/runeUpgradeCalc';

interface Props {
  targetRune: string;
  count: number;
  inventory: Record<string, number>;
  depth?: number;
  maxDepth?: number;
}

export function CubePathTree({ targetRune, count, inventory, depth = 0, maxDepth = 4 }: Props) {
  const have = inventory[targetRune] ?? 0;
  const satisfied = have >= count;
  const runes = getRuneLadder();
  const below = runes.find(r => r.cubeUpTo === targetRune);

  if (satisfied) {
    return (
      <div className="flex items-center gap-1.5" style={{ marginLeft: depth * 16 }}>
        <RuneBadge rune={targetRune} />
        <span className="text-xs text-green-400">{count}x (have {have})</span>
      </div>
    );
  }

  const shortfall = count - have;
  const rune = getRuneByName(targetRune);

  if (!below || !rune || depth >= maxDepth) {
    return (
      <div className="flex items-center gap-1.5" style={{ marginLeft: depth * 16 }}>
        <RuneBadge rune={targetRune} />
        <span className="text-xs text-red-400">
          {count}x needed (have {have}) — {!below ? 'lowest rune' : 'farm directly'}
        </span>
      </div>
    );
  }

  const lowerNeeded = shortfall * below.cubeUpCount;

  return (
    <div>
      <div className="flex items-center gap-1.5" style={{ marginLeft: depth * 16 }}>
        <RuneBadge rune={targetRune} />
        <span className="text-xs text-red-400">
          {count}x needed (have {have}, need {shortfall} more)
        </span>
      </div>
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground" style={{ marginLeft: depth * 16 + 8 }}>
        Cube: {lowerNeeded}x {below.name}
        {below.catalyst && <> + {below.catalyst}</>}
        {' = '}{shortfall}x {targetRune}
      </div>
      <CubePathTree
        targetRune={below.name}
        count={lowerNeeded}
        inventory={inventory}
        depth={depth + 1}
        maxDepth={maxDepth}
      />
    </div>
  );
}
