import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RuneBadge } from '@/components/RuneBadge';
import { CubePathTree } from '@/components/CubePathTree';
import { useRuneInventory } from '@/hooks/useRuneInventory';
import { getRuneLadder } from '@/lib/runeUpgradeCalc';

const runes = getRuneLadder();

export function CubeCalculator() {
  const { counts } = useRuneInventory();
  const [mode, setMode] = useState<'forward' | 'reverse'>('reverse');
  const [selectedRune, setSelectedRune] = useState('Ber');

  const selectedEntry = runes.find(r => r.name === selectedRune);
  const below = runes.find(r => r.cubeUpTo === selectedRune);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Horadric Cube Calculator</h1>
        <p className="text-sm text-muted-foreground">
          Calculate rune upgrade paths. Inventory-aware — green means you have enough.
        </p>
      </div>

      {/* Mode Toggle + Rune Selector */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setMode('forward')}
          className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
            mode === 'forward' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent'
          }`}
        >
          Forward (Upgrade)
        </button>
        <button
          onClick={() => setMode('reverse')}
          className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
            mode === 'reverse' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent'
          }`}
        >
          Reverse (I Need...)
        </button>
        <span className="border-l border-border mx-1" />
        <select
          value={selectedRune}
          onChange={e => setSelectedRune(e.target.value)}
          className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 text-sm border-0"
        >
          {runes.map(r => (
            <option key={r.name} value={r.name}>{r.name} (#{r.number})</option>
          ))}
        </select>
      </div>

      {/* Forward Mode */}
      {mode === 'forward' && selectedEntry && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RuneBadge rune={selectedRune} />
              Upgrade {selectedRune}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedEntry.cubeUpTo ? (
              <div className="space-y-3">
                <div className="p-3 bg-accent/30 rounded-md">
                  <p className="text-sm font-medium mb-2">Recipe:</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm">{selectedEntry.cubeUpCount}x</span>
                    <RuneBadge rune={selectedRune} />
                    {selectedEntry.catalyst && (
                      <>
                        <span className="text-sm text-muted-foreground">+</span>
                        <span className="text-sm">{selectedEntry.catalyst}</span>
                      </>
                    )}
                    <span className="text-sm text-muted-foreground">=</span>
                    <span className="text-sm">1x</span>
                    <RuneBadge rune={selectedEntry.cubeUpTo} />
                  </div>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">You have: </span>
                  <span className={(counts[selectedRune] ?? 0) >= selectedEntry.cubeUpCount ? 'text-green-400' : 'text-red-400'}>
                    {counts[selectedRune] ?? 0}x {selectedRune}
                  </span>
                  {(counts[selectedRune] ?? 0) >= selectedEntry.cubeUpCount
                    ? <span className="text-green-400 ml-2">Ready to cube!</span>
                    : <span className="text-red-400 ml-2">(need {selectedEntry.cubeUpCount - (counts[selectedRune] ?? 0)} more)</span>
                  }
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Zod is the highest rune and cannot be upgraded further.</p>
            )}

            {/* Also show what cubes INTO this rune */}
            {below && (
              <div className="border-t border-border pt-3">
                <p className="text-sm text-muted-foreground mb-2">To create {selectedRune}:</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm">{below.cubeUpCount}x</span>
                  <RuneBadge rune={below.name} />
                  {below.catalyst && (
                    <>
                      <span className="text-sm text-muted-foreground">+</span>
                      <span className="text-sm">{below.catalyst}</span>
                    </>
                  )}
                  <span className="text-sm text-muted-foreground">=</span>
                  <span className="text-sm">1x</span>
                  <RuneBadge rune={selectedRune} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reverse Mode */}
      {mode === 'reverse' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RuneBadge rune={selectedRune} />
              Path to {selectedRune}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(counts[selectedRune] ?? 0) >= 1 ? (
              <p className="text-sm text-green-400">You already have {counts[selectedRune]}x {selectedRune}!</p>
            ) : (
              <div className="space-y-1">
                <CubePathTree
                  targetRune={selectedRune}
                  count={1}
                  inventory={counts}
                  maxDepth={5}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Reference: Full Rune Ladder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rune Ladder — Quick Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-1.5 px-2 font-medium text-muted-foreground">#</th>
                  <th className="py-1.5 px-2 font-medium text-muted-foreground">Rune</th>
                  <th className="py-1.5 px-2 font-medium text-muted-foreground">Recipe</th>
                  <th className="py-1.5 px-2 font-medium text-muted-foreground">Inventory</th>
                </tr>
              </thead>
              <tbody>
                {runes.map(r => {
                  const have = counts[r.name] ?? 0;
                  return (
                    <tr
                      key={r.name}
                      className={`border-b border-border/30 hover:bg-accent/30 cursor-pointer ${
                        selectedRune === r.name ? 'bg-accent/50' : ''
                      }`}
                      onClick={() => setSelectedRune(r.name)}
                    >
                      <td className="py-1 px-2 text-xs text-muted-foreground">{r.number}</td>
                      <td className="py-1 px-2"><RuneBadge rune={r.name} /></td>
                      <td className="py-1 px-2 text-xs text-muted-foreground">
                        {r.cubeUpTo
                          ? `${r.cubeUpCount}x ${r.name}${r.catalyst ? ` + ${r.catalyst}` : ''} = ${r.cubeUpTo}`
                          : '—'
                        }
                      </td>
                      <td className={`py-1 px-2 text-xs ${have > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
                        {have}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
