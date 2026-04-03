import { useState } from 'react';
import { RunewordCard } from '@/components/RunewordCard';
import { useRuneInventory } from '@/hooks/useRuneInventory';
import { useRunewordFeasibility } from '@/hooks/useRunewordFeasibility';
import runewordsData from '@/data/runewords.json';
import type { Runeword, RunewordFeasibility } from '@/types';

const runewords = runewordsData as Runeword[];

export function RunewordPlanner() {
  const { counts } = useRuneInventory();
  const { getFeasibility } = useRunewordFeasibility(counts);
  const [filter, setFilter] = useState<RunewordFeasibility | 'all'>('all');
  const [buildFilter, setBuildFilter] = useState<string>('all');

  const allBuilds = [...new Set(runewords.flatMap(rw => rw.targetBuilds))];

  const filtered = runewords
    .map(rw => ({ rw, feasibility: getFeasibility(rw) }))
    .filter(({ feasibility }) => filter === 'all' || feasibility.status === filter)
    .filter(({ rw }) => buildFilter === 'all' || rw.targetBuilds.includes(buildFilter))
    .sort((a, b) => a.rw.priority - b.rw.priority);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Runeword Planner</h1>
        <p className="text-sm text-muted-foreground">
          Feasibility based on your rune inventory. Edit counts on the Dashboard.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'can_build', 'one_away', 'two_plus_away'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            {f === 'all' ? 'All' : f === 'can_build' ? 'Can Build' : f === 'one_away' ? '1 Away' : '2+ Away'}
          </button>
        ))}
        <span className="border-l border-border mx-1" />
        <select
          value={buildFilter}
          onChange={e => setBuildFilter(e.target.value)}
          className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 text-sm border-0"
        >
          <option value="all">All Builds</option>
          {allBuilds.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Runeword Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(({ rw, feasibility }) => (
          <RunewordCard key={rw.name} runeword={rw} feasibility={feasibility} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-muted-foreground text-center py-8">No runewords match the current filters.</p>
      )}
    </div>
  );
}
