import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QualityBadge } from '@/components/QualityBadge';
import stashData from '@/data/stash.json';
import bisData from '@/data/bis.json';
import charactersData from '@/data/characters.json';
import type { StashPage, BISItem, Character } from '@/types';

const stash = stashData as { pages: StashPage[] };
const bis = bisData as Record<string, Record<string, BISItem>>;
const characters = charactersData as Record<string, Character>;

function findUpgradeMatches(itemName: string): string[] {
  const matches: string[] = [];
  const nameLower = itemName.toLowerCase();
  for (const [charId, slots] of Object.entries(bis)) {
    const char = characters[charId];
    if (!char) continue;
    for (const [slot, bisItem] of Object.entries(slots)) {
      const bisLower = bisItem.name.split('(')[0].trim().toLowerCase();
      if (nameLower.includes(bisLower) || bisLower.includes(nameLower)) {
        const equipped = char.equipped[slot as keyof typeof char.equipped];
        if (!equipped || equipped.name.toLowerCase() !== itemName.toLowerCase()) {
          matches.push(`${charId} ${slot}`);
        }
      }
    }
  }
  return matches;
}

const QUALITIES = ['Unique', 'Set', 'Rare', 'Magic', 'Crafted', 'Runeword'];

export function StashBrowser() {
  const [activeTab, setActiveTab] = useState(0);
  const [qualityFilter, setQualityFilter] = useState<Set<string>>(new Set(QUALITIES));

  const page = stash.pages[activeTab];
  const filteredItems = page?.items.filter(item => {
    if (!item.quality && !item.is_runeword) return qualityFilter.has('Normal');
    if (item.is_runeword && item.runeword_name) return qualityFilter.has('Runeword');
    return qualityFilter.has(item.quality);
  }) ?? [];

  const toggleQuality = (q: string) => {
    setQualityFilter(prev => {
      const next = new Set(prev);
      if (next.has(q)) next.delete(q); else next.add(q);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Stash Browser</h1>
        <p className="text-sm text-muted-foreground">Browse shared stash items by page</p>
      </div>

      {/* Page Tabs */}
      <div className="flex flex-wrap gap-1">
        {stash.pages.map((p, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              activeTab === i
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Quality Filter */}
      <div className="flex flex-wrap gap-2">
        {QUALITIES.map(q => (
          <button
            key={q}
            onClick={() => toggleQuality(q)}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              qualityFilter.has(q)
                ? 'bg-accent text-accent-foreground'
                : 'bg-secondary/50 text-muted-foreground'
            }`}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {filteredItems.map((item, i) => {
          const upgrades = findUpgradeMatches(item.name);
          return (
            <Card key={`${item.name}-${i}`} className={upgrades.length > 0 ? 'border-green-800/60' : ''}>
              <CardContent className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm truncate">{item.name}</span>
                  {item.is_ethereal && <Badge className="bg-purple-800/60 text-purple-200 text-[10px]">ETH</Badge>}
                  {item.is_runeword && item.runeword_name && (
                    <Badge className="bg-slate-600/80 text-slate-100 text-[10px]">{item.runeword_name}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <QualityBadge quality={item.quality || (item.is_runeword ? 'Runeword' : 'Normal')} />
                  {upgrades.length > 0 && (
                    <Badge className="bg-green-800/60 text-green-200 text-[10px]">
                      Upgrades: {upgrades.join(', ')}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filteredItems.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No items match filters on this page.</p>
        )}
      </div>
    </div>
  );
}
