import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RuneBadge } from './RuneBadge';
import type { Runeword, RunewordFeasibilityResult } from '@/types';

const statusStyles: Record<string, { label: string; className: string }> = {
  can_build: { label: 'BUILD NOW', className: 'bg-green-700 text-green-100' },
  one_away: { label: '1 RUNE AWAY', className: 'bg-yellow-700 text-yellow-100' },
  two_plus_away: { label: '2+ AWAY', className: 'bg-red-800 text-red-200' },
};

interface Props {
  runeword: Runeword;
  feasibility: RunewordFeasibilityResult;
}

export function RunewordCard({ runeword, feasibility }: Props) {
  const style = statusStyles[feasibility.status];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-base">{runeword.name}</CardTitle>
          <Badge className={`${style.className} text-xs shrink-0`}>{style.label}</Badge>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {runeword.runes.map((r, i) => (
            <RuneBadge key={`${r}-${i}`} rune={r} />
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">{runeword.keyStats}</p>
        <div className="text-xs">
          <span className="text-muted-foreground">Base: </span>
          <span>{runeword.baseType}</span>
        </div>
        {runeword.targetBuilds.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {runeword.targetBuilds.map(b => (
              <Badge key={b} className="bg-secondary text-secondary-foreground text-[10px]">
                {b}
              </Badge>
            ))}
          </div>
        )}
        {feasibility.missingRunes.length > 0 && (
          <div className="border-t border-border/50 pt-2 mt-2">
            <p className="text-xs font-medium text-red-400 mb-1">Missing:</p>
            {feasibility.missingRunes.map(m => (
              <p key={m.rune} className="text-xs text-muted-foreground">
                {m.rune}: have {m.have}, need {m.need}
              </p>
            ))}
            {feasibility.cubePaths.filter(p => p.steps.length > 0).map(path => (
              <div key={path.targetRune} className="mt-1">
                <p className="text-xs text-yellow-500">Cube path to {path.targetRune}:</p>
                {path.steps.map((step, i) => (
                  <p key={i} className="text-[11px] text-muted-foreground ml-2">
                    {step.count}x {step.from} + {step.catalyst} = {step.to}
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
