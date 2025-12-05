/**
 * Relic Data Definitions
 * Defines all relics in the game with their passive and active abilities
 */

export enum RelicRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export enum RelicTheme {
  VERDANT = 'verdant',
  FROZEN = 'frozen',
  EMBER = 'ember',
  VOID = 'void',
  GENERIC = 'generic',
}

export enum PassiveEffectType {
  MOVEMENT_SPEED = 'movement_speed',
  HEALTH_REGEN = 'health_regen',
  SHOW_ENEMY_HP = 'show_enemy_hp',
  SLOW_ON_HIT = 'slow_on_hit',
  TIME_BONUS = 'time_bonus',
  DAMAGE_BONUS = 'damage_bonus',
}

export enum ActiveEffectType {
  DASH = 'dash',
  CLEANSE_AND_TIME = 'cleanse_and_time',
  REVEAL_MAP = 'reveal_map',
  ICE_WALL = 'ice_wall',
  PAUSE_TIMER = 'pause_timer',
  DAMAGE_MULTIPLIER = 'damage_multiplier',
}

export interface PassiveEffect {
  type: PassiveEffectType;
  value: number;
  description: string;
}

export interface ActiveEffect {
  type: ActiveEffectType;
  value: number;
  cooldown: number; // in seconds
  description: string;
}

export interface RelicDefinition {
  id: string;
  name: string;
  rarity: RelicRarity;
  theme: RelicTheme;
  passive: PassiveEffect;
  active: ActiveEffect;
  iconFrame?: number; // Frame index in relic sprite sheet
}

/**
 * All relic definitions
 */
export const RELICS: Record<string, RelicDefinition> = {
  // ========== VERDANT RELICS ==========
  SEED_OF_SWIFTNESS: {
    id: 'seed_of_swiftness',
    name: 'Seed of Swiftness',
    rarity: RelicRarity.COMMON,
    theme: RelicTheme.VERDANT,
    passive: {
      type: PassiveEffectType.MOVEMENT_SPEED,
      value: 0.2, // 20% increase
      description: '+20% movement speed',
    },
    active: {
      type: ActiveEffectType.DASH,
      value: 150, // dash distance in pixels
      cooldown: 8,
      description: 'Dash through enemies',
    },
    iconFrame: 0,
  },

  ROOT_OF_RESILIENCE: {
    id: 'root_of_resilience',
    name: 'Root of Resilience',
    rarity: RelicRarity.RARE,
    theme: RelicTheme.VERDANT,
    passive: {
      type: PassiveEffectType.HEALTH_REGEN,
      value: 30, // regenerate 1 HP every 30 seconds
      description: 'Regenerate 1 HP every 30s',
    },
    active: {
      type: ActiveEffectType.CLEANSE_AND_TIME,
      value: 5, // 5 seconds of time
      cooldown: 45,
      description: 'Cleanse debuffs + 5s time',
    },
    iconFrame: 1,
  },

  // ========== FROZEN RELICS ==========
  CRYSTAL_OF_CLARITY: {
    id: 'crystal_of_clarity',
    name: 'Crystal of Clarity',
    rarity: RelicRarity.COMMON,
    theme: RelicTheme.FROZEN,
    passive: {
      type: PassiveEffectType.SHOW_ENEMY_HP,
      value: 1, // boolean flag
      description: 'See enemy HP bars',
    },
    active: {
      type: ActiveEffectType.REVEAL_MAP,
      value: 10, // duration in seconds
      cooldown: 60,
      description: 'Reveal floor map for 10s',
    },
    iconFrame: 2,
  },

  ICE_OF_ISOLATION: {
    id: 'ice_of_isolation',
    name: 'Ice of Isolation',
    rarity: RelicRarity.RARE,
    theme: RelicTheme.FROZEN,
    passive: {
      type: PassiveEffectType.SLOW_ON_HIT,
      value: 0.2, // 20% slow
      description: 'Ranged attacks slow enemies 20%',
    },
    active: {
      type: ActiveEffectType.ICE_WALL,
      value: 5, // duration in seconds
      cooldown: 15,
      description: 'Create ice wall blocking projectiles',
    },
    iconFrame: 3,
  },

  // ========== GENERIC RELICS ==========
  TEMPORAL_SHARD: {
    id: 'temporal_shard',
    name: 'Temporal Shard',
    rarity: RelicRarity.COMMON,
    theme: RelicTheme.GENERIC,
    passive: {
      type: PassiveEffectType.TIME_BONUS,
      value: 0.1, // 10% bonus
      description: '+10% time from kills',
    },
    active: {
      type: ActiveEffectType.PAUSE_TIMER,
      value: 2, // pause for 2 seconds
      cooldown: 30,
      description: 'Pause timer for 2s',
    },
    iconFrame: 4,
  },

  COMBAT_CHARM: {
    id: 'combat_charm',
    name: 'Combat Charm',
    rarity: RelicRarity.COMMON,
    theme: RelicTheme.GENERIC,
    passive: {
      type: PassiveEffectType.DAMAGE_BONUS,
      value: 1, // +1 damage
      description: '+1 damage to all attacks',
    },
    active: {
      type: ActiveEffectType.DAMAGE_MULTIPLIER,
      value: 3, // next 3 attacks
      cooldown: 20,
      description: 'Next 3 attacks have 2x damage',
    },
    iconFrame: 5,
  },
};

/**
 * Get a random selection of relics
 * @param count Number of relics to select
 * @param exclude Optional array of relic IDs to exclude
 * @returns Array of random relic definitions
 */
export function getRandomRelics(count: number, exclude: string[] = []): RelicDefinition[] {
  const availableRelics = Object.values(RELICS).filter((relic) => !exclude.includes(relic.id));

  // Shuffle and take first 'count' relics
  const shuffled = [...availableRelics].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get relic definition by ID
 */
export function getRelicById(id: string): RelicDefinition | undefined {
  return Object.values(RELICS).find((relic) => relic.id === id);
}
