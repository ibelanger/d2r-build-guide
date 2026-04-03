import { useState, useCallback } from 'react';
import runesData from '@/data/runes.json';
import type { RuneEntry } from '@/types';

const runes = runesData as RuneEntry[];
const STORAGE_KEY = 'd2r_rune_counts';

function getDefaults(): Record<string, number> {
  const defaults: Record<string, number> = {};
  for (const r of runes) {
    defaults[r.name] = r.defaultCount;
  }
  return defaults;
}

function loadCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* use defaults */ }
  return getDefaults();
}

export function useRuneInventory() {
  const [counts, setCounts] = useState<Record<string, number>>(loadCounts);

  const setCount = useCallback((runeName: string, count: number) => {
    setCounts(prev => {
      const next = { ...prev, [runeName]: Math.max(0, count) };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const importFromText = useCallback((text: string) => {
    const pairs = text.split(/[,\n;]+/).map(s => s.trim()).filter(Boolean);
    setCounts(prev => {
      const next = { ...prev };
      for (const pair of pairs) {
        const match = pair.match(/^(\w+)\s*[:=]\s*(\d+)$/);
        if (match) {
          const [, name, count] = match;
          if (name in next) {
            next[name] = parseInt(count, 10);
          }
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    const defaults = getDefaults();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    setCounts(defaults);
  }, []);

  return { counts, setCount, importFromText, resetToDefaults };
}
