import type { RareTier } from '@/types';

const options: { value: RareTier; label: string; color: string }[] = [
  { value: 'placeholder', label: 'Placeholder', color: 'text-gray-400' },
  { value: 'right_stats', label: 'Right Stats', color: 'text-teal-400' },
  { value: 'right_stats_find_roll', label: 'Right Stats (Find Roll)', color: 'text-green-400' },
];

interface Props {
  value?: RareTier;
  onChange: (tier: RareTier) => void;
}

export function RareQualityDropdown({ value, onChange }: Props) {
  return (
    <select
      value={value ?? 'placeholder'}
      onChange={e => onChange(e.target.value as RareTier)}
      className="bg-background border border-input rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value} className={opt.color}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
