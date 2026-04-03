import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Character, RareTier } from '@/types';
import { getBISCompletion } from '@/lib/bisChecker';

const classColors: Record<string, string> = {
  Warlock: 'text-purple-400',
  Amazon: 'text-yellow-400',
  Sorceress: 'text-blue-400',
  Paladin: 'text-orange-400',
};

interface Props {
  character: Character;
  rareTiers: Record<string, RareTier | undefined>;
}

export function CharacterCard({ character, rareTiers }: Props) {
  const equipped = character.equipped as Record<string, typeof character.equipped[keyof typeof character.equipped]>;
  const { total, bis } = getBISCompletion(character.id, equipped, rareTiers);
  const pct = Math.round((bis / total) * 100);

  return (
    <Link to={`/character/${character.id}`} className="block">
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{character.name}</CardTitle>
            <Badge className="bg-secondary text-secondary-foreground text-xs">
              Lv {character.level}
            </Badge>
          </div>
          <p className={`text-sm ${classColors[character.class] ?? 'text-muted-foreground'}`}>
            {character.class}
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">{character.build}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-secondary rounded-full h-2">
              <div
                className="bg-green-600 rounded-full h-2 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-sm font-mono text-muted-foreground">
              {bis}/{total} BIS
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
