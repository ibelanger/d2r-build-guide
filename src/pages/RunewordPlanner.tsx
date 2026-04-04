import { useState, useMemo } from 'react';
import { RunewordCard } from '@/components/RunewordCard';
import { RuneBadge } from '@/components/RuneBadge';
import { Badge } from '@/components/ui/badge';
import { useRuneInventory } from '@/hooks/useRuneInventory';
import { useRunewordFeasibility } from '@/hooks/useRunewordFeasibility';
import runewordsData from '@/data/runewords.json';
import type { Runeword, RunewordFeasibility } from '@/types';

const runewords = runewordsData as Runeword[];

type SortOption = 'priority' | 'name' | 'level' | 'feasibility' | 'runeCount';

const feasibilityOrder: Record<string, number> = {
  can_build: 0,
  one_away: 1,
  two_plus_away: 2,
};

const statusStyles: Record<string, { label: string; className: string }> = {
  can_build: { label: 'BUILD NOW', className: 'bg-green-700 text-green-100' },
  one_away: { label: '1 AWAY', className: 'bg-yellow-700 text-yellow-100' },
  two_plus_away: { label: '2+ AWAY', className: 'bg-red-800 text-red-200' },
};

export function RunewordPlanner() {
  const { counts } = useRuneInventory();
  const { getFeasibility } = useRunewordFeasibility(counts);
  const [filter, setFilter] = useState<RunewordFeasibility | 'all'>('all');
  const [buildFilter, setBuildFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [search, setSearch] = useState('');
  const [baseFilter, setBaseFilter] = useState<string>('all');
  const [runeCountFilter, setRuneCountFilter] = useState<number | 'all'>('all');
  const [view, setView] = useState<'grid' | 'table'>('grid');

  const allBuilds = useMemo(
    () => [...new Set(runewords.flatMap(rw => rw.targetBuilds))].sort(),
    []
  );

  const allBaseTypes = useMemo(
    () => [...new Set(runewords.map(rw => rw.baseType))].sort(),
    []
  );

  const allRuneCounts = useMemo(
    () => [...new Set(runewords.map(rw => rw.runes.length))].sort((a, b) => a - b),
    []
  );

  const filtered = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return runewords
      .map(rw => ({ rw, feasibility: getFeasibility(rw) }))
      .filter(({ rw, feasibility }) => {
        if (filter !== 'all' && feasibility.status !== filter) return false;
        if (buildFilter !== 'all' && !rw.targetBuilds.includes(buildFilter)) return false;
        if (baseFilter !== 'all' && rw.baseType !== baseFilter) return false;
        if (runeCountFilter !== 'all' && rw.runes.length !== runeCountFilter) return false;
        if (search && !rw.name.toLowerCase().includes(lowerSearch) && !rw.keyStats.toLowerCase().includes(lowerSearch)) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name': return a.rw.name.localeCompare(b.rw.name);
          case 'level': return a.rw.level - b.rw.level;
          case 'feasibility': return (feasibilityOrder[a.feasibility.status] ?? 9) - (feasibilityOrder[b.feasibility.status] ?? 9) || a.rw.priority - b.rw.priority;
          case 'runeCount': return a.rw.runes.length - b.rw.runes.length || a.rw.priority - b.rw.priority;
          default: return a.rw.priority - b.rw.priority;
        }
      });
  }, [counts, filter, buildFilter, sortBy, search, baseFilter, runeCountFilter, getFeasibility]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Runeword Planner</h1>
        <p className="text-sm text-muted-foreground">
          {runewords.length} runewords. Feasibility based on your rune inventory. Edit counts on the Dashboard.
        </p>
      </div>

      {/* Search + Sort */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search runewords..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 text-sm border-0 w-56 placeholder:text-muted-foreground"
          />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 text-sm border-0"
          >
            <option value="priority">Sort: Priority</option>
            <option value="name">Sort: Name</option>
            <option value="level">Sort: Level</option>
            <option value="feasibility">Sort: Feasibility</option>
            <option value="runeCount">Sort: Rune Count</option>
          </select>
          <span className="border-l border-border mx-1" />
          <button
            onClick={() => setView(view === 'grid' ? 'table' : 'grid')}
            className="px-3 py-1.5 rounded-md text-sm bg-secondary text-secondary-foreground hover:bg-accent"
          >
            {view === 'grid' ? 'Table View' : 'Grid View'}
          </button>
        </div>

        {/* Feasibility + Build + Base + Rune Count filters */}
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
          <select
            value={baseFilter}
            onChange={e => setBaseFilter(e.target.value)}
            className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 text-sm border-0"
          >
            <option value="all">All Base Types</option>
            {allBaseTypes.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select
            value={runeCountFilter}
            onChange={e => setRuneCountFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 text-sm border-0"
          >
            <option value="all">All Rune Counts</option>
            {allRuneCounts.map(n => (
              <option key={n} value={n}>{n}-rune</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">{filtered.length} runewords shown</p>

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(({ rw, feasibility }) => (
            <RunewordCard key={rw.name} runeword={rw} feasibility={feasibility} />
          ))}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 px-2 font-medium text-muted-foreground">#</th>
                <th className="py-2 px-2 font-medium text-muted-foreground">Name</th>
                <th className="py-2 px-2 font-medium text-muted-foreground">Status</th>
                <th className="py-2 px-2 font-medium text-muted-foreground">Runes</th>
                <th className="py-2 px-2 font-medium text-muted-foreground">Lvl</th>
                <th className="py-2 px-2 font-medium text-muted-foreground">Base</th>
                <th className="py-2 px-2 font-medium text-muted-foreground">Key Stats</th>
                <th className="py-2 px-2 font-medium text-muted-foreground">Builds</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ rw, feasibility }) => {
                const style = statusStyles[feasibility.status];
                return (
                  <tr key={rw.name} className="border-b border-border/50 hover:bg-accent/30">
                    <td className="py-1.5 px-2 text-xs text-muted-foreground">{rw.priority}</td>
                    <td className="py-1.5 px-2 font-medium whitespace-nowrap">
                      {rw.name}
                      {rw.ladderOnly && <span className="text-[10px] text-yellow-500 ml-1">L</span>}
                    </td>
                    <td className="py-1.5 px-2">
                      <Badge className={`${style.className} text-[10px]`}>{style.label}</Badge>
                    </td>
                    <td className="py-1.5 px-2">
                      <div className="flex flex-wrap gap-0.5">
                        {rw.runes.map((r, i) => (
                          <RuneBadge key={`${r}-${i}`} rune={r} />
                        ))}
                      </div>
                    </td>
                    <td className="py-1.5 px-2 text-xs">{rw.level}</td>
                    <td className="py-1.5 px-2 text-xs text-muted-foreground">{rw.baseType}</td>
                    <td className="py-1.5 px-2 text-xs text-muted-foreground max-w-xs truncate">{rw.keyStats}</td>
                    <td className="py-1.5 px-2">
                      <div className="flex flex-wrap gap-0.5">
                        {rw.targetBuilds.map(b => (
                          <Badge key={b} className="bg-secondary text-secondary-foreground text-[9px]">{b}</Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-muted-foreground text-center py-8">No runewords match the current filters.</p>
      )}
    </div>
  );
}
