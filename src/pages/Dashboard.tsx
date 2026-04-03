import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CharacterCard } from '@/components/CharacterCard';
import { RuneBadge } from '@/components/RuneBadge';
import { RunewordCard } from '@/components/RunewordCard';
import { useRareTiers } from '@/hooks/useRareTiers';
import { useRuneInventory } from '@/hooks/useRuneInventory';
import { useRunewordFeasibility } from '@/hooks/useRunewordFeasibility';
import charactersData from '@/data/characters.json';
import runewordsData from '@/data/runewords.json';
import runesData from '@/data/runes.json';
import type { Character, Runeword, RuneEntry } from '@/types';

const characters = Object.values(charactersData) as Character[];
const runewords = runewordsData as Runeword[];
const runes = runesData as RuneEntry[];

export function Dashboard() {
  const { tiers } = useRareTiers();
  const { counts, setCount, importFromText, resetToDefaults } = useRuneInventory();
  const { getFeasibility } = useRunewordFeasibility(counts);
  const [importText, setImportText] = useState('');
  const [showRuneTable, setShowRuneTable] = useState(false);

  const readyToBuild = runewords.filter(rw => getFeasibility(rw).status === 'can_build');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Season 13 Build Guide</h1>
        <p className="text-sm text-muted-foreground">Track gear, plan runewords, optimize builds</p>
      </div>

      {/* Character Cards */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Characters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {characters.map(char => (
            <CharacterCard key={char.id} character={char} rareTiers={tiers} />
          ))}
        </div>
      </section>

      {/* Ready to Build */}
      {readyToBuild.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">
            Ready to Build
            <Badge className="bg-green-700 text-green-100 ml-2 text-xs">{readyToBuild.length}</Badge>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readyToBuild.map(rw => (
              <RunewordCard key={rw.name} runeword={rw} feasibility={getFeasibility(rw)} />
            ))}
          </div>
        </section>
      )}

      {/* Rune Inventory */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Rune Inventory</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowRuneTable(!showRuneTable)}
              className="text-xs px-3 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-accent"
            >
              {showRuneTable ? 'Hide' : 'Show'} Table
            </button>
            <button
              onClick={resetToDefaults}
              className="text-xs px-3 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-accent"
            >
              Reset
            </button>
          </div>
        </div>

        {showRuneTable && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Edit Rune Counts</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Import from text */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder='Paste: "Tir:17, Tal:33, Ort:29"'
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  className="flex-1 bg-background border border-input rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  onClick={() => { importFromText(importText); setImportText(''); }}
                  className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/80"
                >
                  Import
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2">
                {runes.map(rune => (
                  <div key={rune.name} className="flex flex-col items-center gap-1">
                    <RuneBadge rune={rune.name} />
                    <input
                      type="number"
                      min={0}
                      value={counts[rune.name] ?? 0}
                      onChange={e => setCount(rune.name, parseInt(e.target.value) || 0)}
                      className="w-14 bg-background border border-input rounded text-center text-sm py-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compact rune summary when collapsed */}
        {!showRuneTable && (
          <div className="flex flex-wrap gap-2">
            {runes.filter(r => (counts[r.name] ?? 0) > 0).map(r => (
              <div key={r.name} className="flex items-center gap-1">
                <RuneBadge rune={r.name} />
                <span className="text-xs font-mono text-muted-foreground">x{counts[r.name]}</span>
              </div>
            ))}
            {runes.filter(r => (counts[r.name] ?? 0) > 0).length === 0 && (
              <p className="text-sm text-muted-foreground">No runes in inventory. Click "Show Table" to add counts.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
