import { useState, useCallback } from 'react';
import type { RareTier } from '@/types';

const STORAGE_KEY = 'd2r_rare_tiers';

function loadTiers(): Record<string, RareTier> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function useRareTiers() {
  const [tiers, setTiers] = useState<Record<string, RareTier>>(loadTiers);

  const getTier = useCallback((characterId: string, slot: string): RareTier | undefined => {
    return tiers[`${characterId}:${slot}`];
  }, [tiers]);

  const setTier = useCallback((characterId: string, slot: string, tier: RareTier) => {
    setTiers(prev => {
      const next = { ...prev, [`${characterId}:${slot}`]: tier };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { tiers, getTier, setTier };
}
