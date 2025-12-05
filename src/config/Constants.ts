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
  /** Execute health threshold (percentage) */
  EXECUTE_THRESHOLD: 0.2,
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
// CORRUPTION THRESHOLDS
// =============================================================================

export const CORRUPTION = {
  WHISPERS_BEGIN: 25,
  CREEPING_DARKNESS: 50,
  HIS_GAZE: 75,
  SHADOW_HUNTS: 100,
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
}
