/**
 * Game Constants
 * Core configuration values for 60 Second Legend
 */

// =============================================================================
// TIME SETTINGS
// =============================================================================

export const TIME = {
  /** Starting time in seconds */
  BASE_TIME: 60,
  /** Maximum time cap in seconds */
  MAX_TIME: 120,
  /** Yellow warning threshold in seconds */
  WARNING_THRESHOLD: 30,
  /** Red critical threshold in seconds */
  CRITICAL_THRESHOLD: 10,
  /** Base drain rate (seconds lost per second) */
  DRAIN_RATE: 1.0,
} as const;

// =============================================================================
// TIME EXTENSIONS
// =============================================================================

export const TIME_EXTENSIONS = {
  /** Time gained per enemy kill */
  ENEMY_KILL: 3,
  /** Time gained when room is cleared */
  ROOM_CLEARED: 8,
  /** Bonus time for clearing room without taking damage */
  ROOM_PERFECT: 10,
  /** Bonus time for clearing room under 30 seconds */
  SPEED_BONUS: 5,
  /** Small hourglass pickup */
  SMALL_HOURGLASS: 10,
  /** Large hourglass pickup */
  LARGE_HOURGLASS: 20,
  /** Bonus for finding secret */
  SECRET_FOUND: 15,
  /** Bonus for defeating floor boss */
  BOSS_DEFEATED: 30,
  /** Bonus for acquiring a relic */
  RELIC_ACQUIRED: 25,
} as const;

// =============================================================================
// DISPLAY SETTINGS
// =============================================================================

export const DISPLAY = {
  /** Game width in pixels */
  WIDTH: 320,
  /** Game height in pixels */
  HEIGHT: 180,
  /** Pixel scale factor */
  SCALE: 4,
  /** Tile size in pixels */
  TILE_SIZE: 16,
} as const;

// =============================================================================
// PLAYER SETTINGS
// =============================================================================

export const PLAYER = {
  /** Starting max health */
  MAX_HEALTH: 5,
  /** Movement speed in tiles per second */
  MOVE_SPEED: 5,
  /** Invincibility frame duration in seconds */
  I_FRAME_DURATION: 0.5,
  /** Maximum relics that can be held */
  MAX_RELICS: 5,
} as const;

// =============================================================================
// DASH SETTINGS
// =============================================================================

export const DASH = {
  /** Dash distance in pixels */
  DISTANCE: 48,
  /** Dash duration in milliseconds */
  DURATION: 150,
  /** Cooldown between dashes in milliseconds */
  COOLDOWN: 800,
  /** Whether dash grants invincibility frames */
  I_FRAMES: true,
} as const;

// =============================================================================
// COMBAT SETTINGS
// =============================================================================

export const COMBAT = {
  /** Perfect dodge window in seconds */
  PERFECT_DODGE_WINDOW: 0.15,
  /** Duration of invincibility after perfect dodge */
  PERFECT_DODGE_I_FRAMES: 0.3,
  /** Damage multiplier after perfect dodge */
  PERFECT_DODGE_DAMAGE_MULT: 2,
  /** Time reward for perfect dodge */
  PERFECT_DODGE_TIME: 1,
  /** Execute health threshold (percentage) - disabled (set to 0) */
  EXECUTE_THRESHOLD: 0,
  /** Bonus time for execute kill */
  EXECUTE_TIME_BONUS: 2,
  /** Memory Blade base damage */
  MEMORY_BLADE_DAMAGE: 3,
  /** Attack cooldown in seconds */
  ATTACK_COOLDOWN: 0.4,
  /** Attack range in pixels */
  ATTACK_RANGE: 24,
  /** Knockback force in pixels per second */
  KNOCKBACK_FORCE: 150,
} as const;

// =============================================================================
// KILL STREAKS
// =============================================================================

export const KILL_STREAKS = {
  3: { bonus: 2, announcement: 'Triple!', color: 0xffff00 },
  5: { bonus: 5, announcement: 'Rampage!', color: 0xff8800 },
  8: { bonus: 10, announcement: 'Unstoppable!', color: 0xff4400 },
  12: { bonus: 20, announcement: 'LEGENDARY!', color: 0xff0000 },
} as const;

// =============================================================================
// COMBO SYSTEM
// =============================================================================

export const COMBO = {
  /** Time window in seconds to maintain combo */
  COMBO_WINDOW: 4.0,
  /** Combo thresholds for time bonuses */
  THRESHOLDS: {
    5: { multiplier: 1.2, announcement: '5-Hit Combo!', color: 0x00ff00 },
    10: { multiplier: 1.5, announcement: '10-Hit Combo!', color: 0x00ffff },
    15: { multiplier: 2.0, announcement: '15-Hit Combo!', color: 0xff00ff },
    20: { multiplier: 2.5, announcement: 'MAXIMUM COMBO!', color: 0xff0000 },
  },
} as const;

// =============================================================================
// WEAPON DEFINITIONS
// =============================================================================

export interface WeaponStats {
  /** Weapon name */
  name: string;
  /** Base damage per hit */
  damage: number;
  /** Attack speed (cooldown in seconds) */
  attackSpeed: number;
  /** Attack range in pixels */
  range: number;
  /** Knockback force in pixels per second */
  knockback: number;
  /** Time gained per kill with this weapon */
  timePerKill: number;
  /** Time gained per hit (non-killing) */
  timePerHit: number;
  /** AOE radius (0 for single-target) */
  aoeRadius?: number;
}

export interface ComboRequirement {
  /** Type of combo requirement */
  type: 'hits_without_damage' | 'kills_without_damage' | 'multi_kills';
  /** Number required to activate */
  count: number;
}

export interface ComboEffect {
  /** Type of combo effect */
  type: 'damage_multiplier' | 'heal' | 'stun_aoe';
  /** Effect value (damage multiplier, heal amount, stun duration, etc.) */
  value: number;
  /** Effect radius for AOE effects */
  radius?: number;
}

export interface WeaponCombo {
  /** Requirement to activate combo */
  requirement: ComboRequirement;
  /** Effect when combo activates */
  effect: ComboEffect;
  /** Display name of combo */
  name: string;
}

export interface WeaponDefinition {
  stats: WeaponStats;
  combo: WeaponCombo;
}

export const WEAPONS = {
  SWIFT_DAGGERS: {
    stats: {
      name: 'Swift Daggers',
      damage: 1,
      attackSpeed: 0.2,
      range: 16,
      knockback: 100,
      timePerKill: 2,
      timePerHit: 0.3,
      aoeRadius: 0,
    },
    combo: {
      requirement: {
        type: 'hits_without_damage' as const,
        count: 5,
      },
      effect: {
        type: 'damage_multiplier' as const,
        value: 3,
      },
      name: 'Triple Strike',
    },
  },
  MEMORY_BLADE: {
    stats: {
      name: 'Memory Blade',
      damage: 3,
      attackSpeed: 0.6,
      range: 24,
      knockback: 150,
      timePerKill: 4,
      timePerHit: 0,
      aoeRadius: 0,
    },
    combo: {
      requirement: {
        type: 'kills_without_damage' as const,
        count: 3,
      },
      effect: {
        type: 'heal' as const,
        value: 1,
      },
      name: 'Life Steal',
    },
  },
  SHATTER_HAMMER: {
    stats: {
      name: 'Shatter Hammer',
      damage: 5,
      attackSpeed: 1.2,
      range: 20,
      knockback: 200,
      timePerKill: 6,
      timePerHit: 0,
      aoeRadius: 24,
    },
    combo: {
      requirement: {
        type: 'multi_kills' as const,
        count: 2,
      },
      effect: {
        type: 'stun_aoe' as const,
        value: 1.5,
        radius: 32,
      },
      name: 'Ground Pound',
    },
  },
} as const;

// =============================================================================
// ENEMY SETTINGS
// =============================================================================

export const ENEMIES = {
  /** Slime - Basic slow-moving enemy */
  SLIME: {
    maxHealth: 2,
    moveSpeed: 30,
    damage: 1,
    timeReward: 3,
  },
  /** Bat - Fast flying enemy with erratic movement */
  BAT: {
    maxHealth: 1,
    moveSpeed: 60,
    damage: 1,
    timeReward: 2,
  },
  /** Rat - Swarm enemy with pack behavior */
  RAT: {
    maxHealth: 1,
    moveSpeed: 40,
    damage: 1,
    timeReward: 1,
  },
} as const;

// =============================================================================
// SPAWN SETTINGS
// =============================================================================

export const SPAWN = {
  /** Minimum enemies per combat room */
  MIN_PER_ROOM: 5,
  /** Maximum enemies per combat room */
  MAX_PER_ROOM: 8,
  /** Respawn interval in milliseconds */
  RESPAWN_INTERVAL: 6000,
  /** Maximum active enemies at once */
  MAX_ACTIVE_ENEMIES: 30,
  /** Chance to spawn enemies in corridors (0-1) */
  CORRIDOR_SPAWN_CHANCE: 0.3,
} as const;

// =============================================================================
// RELIC SETTINGS
// =============================================================================

export const RELIC = {
  /** Relic selection UI padding */
  SELECTION_PADDING: 16,
  /** Relic card width in UI */
  CARD_WIDTH: 80,
  /** Relic card height in UI */
  CARD_HEIGHT: 100,
  /** Relic icon size */
  ICON_SIZE: 32,
  /** Cooldown display refresh rate (ms) */
  COOLDOWN_REFRESH_MS: 100,
} as const;

// =============================================================================
// FLOOR PROGRESSION
// =============================================================================

export const FLOORS = {
  VERDANT_RUINS: [1, 2],
  FROZEN_ARCHIVE: [3, 4],
  EMBER_DEPTHS: [5, 6],
  VOID_SANCTUM: [7, 8],
  SHADOW_THRONE: [9, 10],
} as const;

// =============================================================================
// BIOMES
// =============================================================================

export const BIOMES = {
  VERDANT_RUINS: {
    id: 'verdant_ruins',
    name: 'Verdant Ruins',
    floors: [1, 2],
    palette: {
      primary: 0x2d5a27,
      secondary: 0x8bc34a,
      accent: 0x4caf50,
    },
    enemyModifier: {
      speedMultiplier: 1.0,
      healthMultiplier: 1.0,
    },
  },
  FROZEN_ARCHIVE: {
    id: 'frozen_archive',
    name: 'Frozen Archive',
    floors: [3, 4],
    palette: {
      primary: 0x4fc3f7,
      secondary: 0xe1f5fe,
      accent: 0x0288d1,
    },
    enemyModifier: {
      speedMultiplier: 1.2,
      healthMultiplier: 1.0,
    },
  },
} as const;

// =============================================================================
// HAZARDS
// =============================================================================

export const HAZARDS = {
  OVERGROWTH: {
    id: 'overgrowth',
    name: 'Overgrowth',
    slowMultiplier: 0.7,
    spawnRate: 0.15,
    tint: 0x2d5a27,
  },
  ICE_TILE: {
    id: 'ice_tile',
    name: 'Ice Tile',
    slideDistance: 2,
    spawnRate: 0.25,
    tint: 0x4fc3f7,
  },
} as const;

// =============================================================================
// CORRUPTION THRESHOLDS
// =============================================================================

export const CORRUPTION = {
  WHISPERS_BEGIN: 25,
  CREEPING_DARKNESS: 50,
  HIS_GAZE: 75,
  SHADOW_HUNTS: 100,
} as const;

// =============================================================================
// SHADOW SYSTEM
// =============================================================================

export const SHADOW = {
  /** Shadow Pursuer movement speed in pixels per second (1 tile/sec) */
  PURSUER_SPEED: 16,
  /** Shadow Pursuer damage (instant death) */
  PURSUER_DAMAGE: 999,
  /** Time drain multiplier at 50% corruption */
  DRAIN_MULTIPLIER_50: 1.1,

  /** Corruption sources and amounts */
  CORRUPTION_SOURCES: {
    FLOOR_ENTER: 5,
    IDLE_10S: 1,
    DARK_ENEMY_KILL: 2,
    RELIC_ACQUIRED: -10,
    BOSS_DEFEATED: -15,
    SECRET_FOUND: -5,
  },
} as const;

// =============================================================================
// META PROGRESSION - UPGRADES
// =============================================================================

export interface UpgradeDefinition {
  /** Display name */
  name: string;
  /** Upgrade description */
  description: string;
  /** Cost in memory shards */
  cost: number;
  /** Effect type */
  effect: 'maxTime' | 'baseDamage' | 'maxHealth' | 'startingRelic';
  /** Effect value */
  value: number;
  /** Tree category */
  tree: 'time' | 'combat' | 'survival' | 'relic';
}

export const UPGRADES = {
  EXPANDED_HOURGLASS: {
    name: 'Expanded Hourglass',
    description: 'Maximum time increased to 150s',
    cost: 50,
    effect: 'maxTime' as const,
    value: 150,
    tree: 'time' as const,
  },
  SHARPENED_BLADE: {
    name: 'Sharpened Blade',
    description: 'All weapons deal +1 damage',
    cost: 75,
    effect: 'baseDamage' as const,
    value: 1,
    tree: 'combat' as const,
  },
  THICK_SKIN: {
    name: 'Thick Skin',
    description: 'Maximum health increased to 6',
    cost: 60,
    effect: 'maxHealth' as const,
    value: 6,
    tree: 'survival' as const,
  },
  RELIC_ATTUNEMENT: {
    name: 'Relic Attunement',
    description: 'Start runs with 1 random common relic',
    cost: 100,
    effect: 'startingRelic' as const,
    value: 1,
    tree: 'relic' as const,
  },
} as const;

// =============================================================================
// META PROGRESSION - SHARD SOURCES
// =============================================================================

export const SHARD_SOURCES = {
  /** Shards gained per enemy kill */
  ENEMY_KILL: 1,
  /** Shards gained per room cleared */
  ROOM_CLEARED: 5,
  /** Shards gained per boss defeated */
  BOSS_DEFEATED: 25,
  /** Shards gained per floor completed */
  FLOOR_COMPLETED: 10,
} as const;

// =============================================================================
// GAME EVENTS
// =============================================================================

export enum GameEvents {
  // Time events
  TIME_TICK = 'time:tick',
  TIME_EXTENDED = 'time:extended',
  TIME_WARNING = 'time:warning',
  TIME_CRITICAL = 'time:critical',
  TIME_EXPIRED = 'time:expired',

  // Combat events
  ENEMY_DAMAGED = 'combat:enemy_damaged',
  ENEMY_KILLED = 'combat:enemy_killed',
  PLAYER_DAMAGED = 'combat:player_damaged',
  COMBO_ACHIEVED = 'combat:combo',
  KILL_STREAK = 'combat:streak',
  PERFECT_DODGE = 'combat:perfect_dodge',

  // Weapon events
  WEAPON_SWITCHED = 'weapon:switched',
  WEAPON_COMBO_READY = 'weapon:combo_ready',
  WEAPON_COMBO_ACTIVATED = 'weapon:combo_activated',

  // Room events
  ROOM_ENTERED = 'room:entered',
  ROOM_CLEARED = 'room:cleared',
  ROOM_PERFECT = 'room:perfect',
  FLOOR_COMPLETE = 'floor:complete',

  // Relic events
  RELIC_ACQUIRED = 'relic:acquired',
  RELIC_ACTIVATED = 'relic:activated',
  RELIC_COOLDOWN = 'relic:cooldown',

  // Shadow events
  CORRUPTION_CHANGED = 'shadow:corruption',
  SHADOW_SPAWNED = 'shadow:spawned',
  SHADOW_APPROACHING = 'shadow:approaching',
  ROOM_CORRUPTED = 'shadow:room_corrupted',

  // Hazard events
  HAZARD_ENTERED = 'hazard:entered',
  HAZARD_EXITED = 'hazard:exited',
  HAZARD_EFFECT_APPLIED = 'hazard:effect_applied',

  // Progression events
  SHARDS_EARNED = 'progression:shards_earned',
  UPGRADE_PURCHASED = 'progression:upgrade_purchased',
  RUN_ENDED = 'progression:run_ended',
}
