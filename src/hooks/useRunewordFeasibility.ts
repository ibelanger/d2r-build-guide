import { useMemo } from 'react';
import type { Runeword, RunewordFeasibilityResult } from '@/types';
import { calculateCubePath } from '@/lib/runeUpgradeCalc';

export function useRunewordFeasibility(runeCounts: Record<string, number>) {
  const getFeasibility = useMemo(() => {
    return (runeword: Runeword): RunewordFeasibilityResult => {
      // Count how many of each rune is needed
      const needed: Record<string, number> = {};
      for (const r of runeword.runes) {
        needed[r] = (needed[r] ?? 0) + 1;
      }

      const missingRunes: { rune: string; have: number; need: number }[] = [];

      for (const [rune, need] of Object.entries(needed)) {
        const have = runeCounts[rune] ?? 0;
        if (have < need) {
          missingRunes.push({ rune, have, need });
        }
      }

      const cubePaths = missingRunes.map(m =>
        calculateCubePath(m.rune, runeCounts)
      );

      let status: RunewordFeasibilityResult['status'];
      if (missingRunes.length === 0) {
        status = 'can_build';
      } else if (missingRunes.length === 1 && missingRunes[0].need - missingRunes[0].have === 1) {
        status = 'one_away';
      } else {
        status = 'two_plus_away';
      }

      return { status, missingRunes, cubePaths };
    };
  }, [runeCounts]);

  return { getFeasibility };
}
