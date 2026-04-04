import type { CubePath, CubeStep, RuneEntry } from '@/types';
import runesData from '@/data/runes.json';

const runes = runesData as RuneEntry[];

const runeByName: Record<string, RuneEntry> = {};
for (const r of runes) {
  runeByName[r.name] = r;
}

export function getRuneByName(name: string): RuneEntry | undefined {
  return runeByName[name];
}

export function getRuneLadder(): RuneEntry[] {
  return runes;
}

export function calculateCubePath(
  targetRune: string,
  currentInventory: Record<string, number>,
  maxDepth = 3
): CubePath {
  const target = runeByName[targetRune];
  if (!target) {
    return { targetRune, canAfford: false, steps: [], totalLowerRunesNeeded: {} };
  }

  const have = currentInventory[targetRune] ?? 0;
  if (have >= 1) {
    return { targetRune, canAfford: true, steps: [], totalLowerRunesNeeded: {} };
  }

  // Walk down the ladder to find cube path
  const steps: CubeStep[] = [];
  const totalNeeded: Record<string, number> = {};

  function findPath(runeName: string, needed: number, depth: number): boolean {
    const current = currentInventory[runeName] ?? 0;
    if (current >= needed) return true;

    if (depth >= maxDepth) return false;

    const rune = runeByName[runeName];
    if (!rune) return false;

    // Find the rune below this one
    const below = runes.find(r => r.cubeUpTo === runeName);
    if (!below) return false;

    const shortfall = needed - current;
    const lowerNeeded = shortfall * below.cubeUpCount;

    steps.push({
      from: below.name,
      count: lowerNeeded,
      to: runeName,
      catalyst: below.catalyst,
    });

    totalNeeded[below.name] = (totalNeeded[below.name] ?? 0) + lowerNeeded;

    return findPath(below.name, lowerNeeded, depth + 1);
  }

  const canAfford = findPath(targetRune, 1, 0);

  return { targetRune, canAfford, steps, totalLowerRunesNeeded: totalNeeded };
}
