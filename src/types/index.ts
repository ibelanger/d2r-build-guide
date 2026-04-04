export type GearSlot = "Helm" | "Armor" | "WeaponR" | "WeaponL" | "Gloves" | "Boots" | "Belt" | "Amulet" | "RingR" | "RingL";

export type ItemQuality = "Unique" | "Set" | "Rare" | "Magic" | "Crafted" | "Runeword" | "Normal" | "Inferior" | "";

export type RareTier = "placeholder" | "right_stats" | "right_stats_find_roll";

export type RunewordFeasibility = "can_build" | "one_away" | "two_plus_away";

export interface EquippedItem {
  name: string;
  quality: ItemQuality;
  code: string;
  is_ethereal: boolean;
  is_runeword: boolean;
  runeword_name: string;
  notes?: string;
  overridden?: boolean;
}

export interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  build: string;
  equipped: Partial<Record<GearSlot, EquippedItem>>;
}

export interface BISItem {
  name: string;
  quality: string;
  notes: string;
  alternatives: string[];
}

export type BISData = Record<string, Partial<Record<GearSlot, BISItem>>>;

export interface Runeword {
  name: string;
  runes: string[];
  bases: string[];
  baseType: string;
  level: number;
  targetBuilds: string[];
  priority: number;
  keyStats: string;
  ladderOnly?: boolean;
}

export interface RuneEntry {
  name: string;
  code: string;
  number: number;
  cubeUpTo: string | null;
  cubeUpCount: number;
  catalyst: string;
  defaultCount: number;
}

export interface StashItem {
  name: string;
  quality: string;
  code: string;
  is_ethereal: boolean;
  is_runeword: boolean;
  runeword_name: string;
  stash_page: number;
  stash_page_name: string;
}

export interface StashPage {
  index: number;
  name: string;
  items: StashItem[];
}

export interface BISStatus {
  status: "bis" | "near_bis" | "upgrade_available" | "empty";
  currentItem: string;
  bisItem: string;
  notes: string;
}

export interface CubeStep {
  from: string;
  count: number;
  to: string;
  catalyst: string;
}

export interface CubePath {
  targetRune: string;
  canAfford: boolean;
  steps: CubeStep[];
  totalLowerRunesNeeded: Record<string, number>;
}

export interface RunewordFeasibilityResult {
  status: RunewordFeasibility;
  missingRunes: { rune: string; have: number; need: number }[];
  cubePaths: CubePath[];
}
