# 60 Second Legend — Comprehensive Implementation Plan

> **A time-loop roguelike built with Phaser 3, TypeScript, and rot.js**  
> *Restore the Tree of Memories. Defeat the Whispering Shadow. Race against time.*

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technical Stack](#2-technical-stack)
3. [Core Systems Architecture](#3-core-systems-architecture)
4. [Phase 1: Foundation](#4-phase-1-foundation)
5. [Phase 2: Combat System](#5-phase-2-combat-system)
6. [Phase 3: Floor Themes & Hazards](#6-phase-3-floor-themes--hazards)
7. [Phase 4: Relic System](#7-phase-4-relic-system)
8. [Phase 5: The Whispering Shadow](#8-phase-5-the-whispering-shadow)
9. [Phase 6: Meta Progression](#9-phase-6-meta-progression)
10. [Phase 7: Polish & Juice](#10-phase-7-polish--juice)
11. [Asset Requirements](#11-asset-requirements)
12. [Milestone Schedule](#12-milestone-schedule)
13. [Technical Specifications](#13-technical-specifications)

---

## 1. Project Overview

### Game Concept

**60 Second Legend** is a time-loop roguelike where players navigate procedurally generated dungeons under constant time pressure. Every action either costs or earns time—kills extend the clock, hesitation drains it. The Whispering Shadow corrupts the world as you progress, creating escalating tension across a 10-floor journey to restore the Tree of Memories.

### Core Pillars

| Pillar | Description |
|--------|-------------|
| **Time Tension** | Every second matters. The countdown never stops. |
| **Build Variety** | Weapon + Relic combinations create distinct playstyles |
| **Escalating Threat** | Shadow corruption increases, changing the game dynamically |
| **Skill Expression** | Perfect dodges, kill streaks, and speed bonuses reward mastery |
| **Meaningful Choices** | Fight for time vs. rush ahead vs. explore for secrets |

### Lore Foundation

The kingdom of Elaria was unified around the magical **Tree of Memories** until **Alaric**, a hero corrupted by ambition, struck it with dark lightning. The tree shattered, creating temporal anomalies that trapped dungeons in endless time-loops. Now **The Whispering Shadow**, Alaric's dark form, seeks to manipulate memories and rule Elaria. As a **Relic Seeker**, you must collect fragments of the shattered tree, defeat the Shadow, and restore balance at the **Nexus of Memories**.

---

## 2. Technical Stack

### Core Technologies

```
├── Phaser 3.60+          # Game engine (rendering, input, physics)
├── TypeScript 5.x        # Type safety, better DX
├── rot.js                # Roguelike toolkit (dungeon gen, FOV, pathfinding)
├── Vite                  # Build tool and dev server
└── LocalStorage/IndexedDB # Save data persistence
```

### Project Structure

```
60-second-legend/
├── src/
│   ├── main.ts                    # Entry point
│   ├── config/
│   │   ├── GameConfig.ts          # Phaser configuration
│   │   ├── Constants.ts           # Game constants
│   │   └── AssetManifest.ts       # Asset loading definitions
│   ├── scenes/
│   │   ├── BootScene.ts           # Asset preloading
│   │   ├── MenuScene.ts           # Main menu
│   │   ├── HubScene.ts            # Between-run hub (Nexus)
│   │   ├── GameScene.ts           # Main gameplay
│   │   ├── BossScene.ts           # Boss encounters
│   │   └── GameOverScene.ts       # Death/victory screen
│   ├── systems/
│   │   ├── TimeManager.ts         # Core time mechanic
│   │   ├── DungeonGenerator.ts    # rot.js integration
│   │   ├── CombatSystem.ts        # Weapons, damage, combos
│   │   ├── RelicSystem.ts         # Relic management
│   │   ├── ShadowSystem.ts        # Corruption & pursuer
│   │   ├── FloorThemeSystem.ts    # Biome hazards
│   │   └── ProgressionSystem.ts   # Meta upgrades, shards
│   ├── entities/
│   │   ├── Player.ts              # Player character
│   │   ├── Enemy.ts               # Base enemy class
│   │   ├── enemies/               # Enemy variants per biome
│   │   ├── Boss.ts                # Boss base class
│   │   ├── bosses/                # Boss variants
│   │   └── Pickup.ts              # Items, hourglasses
│   ├── components/
│   │   ├── HealthComponent.ts
│   │   ├── MovementComponent.ts
│   │   ├── WeaponComponent.ts
│   │   └── AIComponent.ts
│   ├── ui/
│   │   ├── HUD.ts                 # Timer, health, relics
│   │   ├── PauseMenu.ts
│   │   ├── RelicSelectUI.ts
│   │   └── CorruptionOverlay.ts
│   └── utils/
│       ├── MathUtils.ts
│       ├── TileUtils.ts
│       └── SaveManager.ts
├── assets/
│   ├── sprites/                   # From SGQ asset packs
│   ├── audio/
│   └── fonts/
├── public/
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 3. Core Systems Architecture

### System Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                        GAME SCENE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ TimeManager  │───▶│ CombatSystem │───▶│ RelicSystem  │       │
│  │              │    │              │    │              │       │
│  │ • countdown  │    │ • weapons    │    │ • passives   │       │
│  │ • extensions │    │ • combos     │    │ • actives    │       │
│  │ • warnings   │    │ • streaks    │    │ • cooldowns  │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                   ShadowSystem                        │       │
│  │  • corruption meter  • room effects  • pursuer AI    │       │
│  └──────────────────────────┬───────────────────────────┘       │
│                             │                                    │
│         ┌───────────────────┼───────────────────┐               │
│         ▼                   ▼                   ▼                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │FloorTheme    │    │ Dungeon      │    │ Progression  │       │
│  │System        │    │ Generator    │    │ System       │       │
│  │              │    │              │    │              │       │
│  │ • hazards    │    │ • rot.js     │    │ • shards     │       │
│  │ • palettes   │    │ • rooms      │    │ • upgrades   │       │
│  │ • modifiers  │    │ • spawning   │    │ • unlocks    │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Event Flow

```typescript
// Central event bus for system communication
enum GameEvents {
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
  ROOM_CORRUPTED = 'shadow:room_corrupted'
}
```

---

## 4. Phase 1: Foundation

**Goal:** Playable dungeon navigation with working time mechanic

### 4.1 Time Manager System

```typescript
// src/systems/TimeManager.ts

interface TimeConfig {
  baseTime: number;           // Starting seconds (60)
  maxTime: number;            // Cap (120)
  warningThreshold: number;   // Yellow warning (30)
  criticalThreshold: number;  // Red + pulse (10)
  drainRate: number;          // Seconds lost per second (1.0)
}

interface TimeExtension {
  source: string;
  amount: number;
  timestamp: number;
}

class TimeManager {
  private currentTime: number;
  private maxTime: number;
  private isPaused: boolean;
  private drainRate: number;
  private extensions: TimeExtension[];
  
  // Core methods
  tick(delta: number): void;
  extend(amount: number, source: string): void;
  drain(amount: number, source: string): void;
  setDrainRate(rate: number): void;
  
  // State queries
  getTimeRemaining(): number;
  getTimePercent(): number;
  isWarning(): boolean;
  isCritical(): boolean;
  
  // Visual feedback hooks
  getTimerColor(): number;  // Green → Yellow → Red
  shouldPulse(): boolean;
  getRecentExtensions(): TimeExtension[];
}
```

### Time Extension Sources

| Source | Base Amount | Notes |
|--------|-------------|-------|
| Enemy kill | +3s | Modified by weapon |
| Room cleared | +8s | Base bonus |
| Room perfect (no damage) | +10s | Bonus on top of clear |
| Speed bonus (<30s clear) | +5s | Additional bonus |
| Small hourglass pickup | +10s | Common drop |
| Large hourglass pickup | +20s | Rare drop |
| Secret discovered | +15s | Exploration reward |
| Boss defeated | +30s | Major milestone |
| Relic acquired | +25s | Floor completion |

### 4.2 Dungeon Generator

```typescript
// src/systems/DungeonGenerator.ts

interface DungeonConfig {
  width: number;
  height: number;
  roomCount: { min: number; max: number };
  corridorWidth: number;
  floorTheme: FloorTheme;
}

interface Room {
  id: string;
  bounds: Phaser.Geom.Rectangle;
  type: RoomType;
  enemies: EnemySpawn[];
  hazards: HazardPlacement[];
  pickups: PickupSpawn[];
  isCleared: boolean;
  isCorrupted: boolean;
  connections: string[];  // Connected room IDs
}

enum RoomType {
  ENTRANCE = 'entrance',
  COMBAT = 'combat',
  TREASURE = 'treasure',
  SECRET = 'secret',
  BOSS = 'boss',
  EXIT = 'exit'
}

class DungeonGenerator {
  private map: ROT.Map.Digger;
  private rooms: Map<string, Room>;
  
  generate(config: DungeonConfig): DungeonData;
  placeEnemies(room: Room, theme: FloorTheme, corruption: number): void;
  placeHazards(room: Room, theme: FloorTheme): void;
  connectRooms(): void;
  
  // rot.js integration
  private createMap(): void;
  private extractRooms(): void;
  private createCorridors(): void;
}
```

### 4.3 Player Controller

```typescript
// src/entities/Player.ts

interface PlayerStats {
  maxHealth: number;
  currentHealth: number;
  moveSpeed: number;
  iFrameDuration: number;
}

class Player extends Phaser.Physics.Arcade.Sprite {
  private stats: PlayerStats;
  private weapon: Weapon;
  private relics: Relic[];
  private isInvulnerable: boolean;
  private comboCount: number;
  private killStreak: number;
  
  // Movement (8-directional grid-based)
  move(direction: Phaser.Math.Vector2): void;
  dash(): void;  // If unlocked via relic
  
  // Combat
  attack(): void;
  takeDamage(amount: number, source: Entity): void;
  dodge(): boolean;  // Returns true if perfect dodge
  
  // State
  equipWeapon(weapon: Weapon): void;
  addRelic(relic: Relic): void;
  useRelicActive(index: number): void;
}
```

### Phase 1 Deliverables

- [ ] Project scaffolding with Vite + Phaser + TypeScript
- [ ] Asset loading pipeline (sprites, audio)
- [ ] TimeManager with visual HUD (countdown, color changes, +time popups)
- [ ] rot.js dungeon generation (single floor, multiple rooms)
- [ ] Player movement (8-directional, grid-aligned)
- [ ] Basic camera following player
- [ ] Room transition detection
- [ ] Placeholder enemy (stationary, killable)
- [ ] Time extension on kill

**Milestone:** Navigate procedural dungeon, kill enemies, watch timer tick.

---

## 5. Phase 2: Combat System

**Goal:** Satisfying combat with weapon variety and combo mechanics

### 5.1 Weapon System

```typescript
// src/systems/CombatSystem.ts

interface WeaponStats {
  damage: number;
  attackSpeed: number;      // Seconds between attacks
  range: number;            // Tiles
  knockback: number;
  timePerKill: number;      // Base time extension
  timePerHit: number;       // For fast weapons
}

interface ComboBonus {
  threshold: number;        // Hits/kills needed
  reward: ComboReward;
  duration: number;         // Seconds to achieve
}

interface ComboReward {
  timeBonus: number;
  damageMultiplier?: number;
  specialEffect?: string;
}

abstract class Weapon {
  protected stats: WeaponStats;
  protected comboBonus: ComboBonus;
  protected floorSynergies: Map<FloorTheme, string>;
  
  abstract attack(player: Player, direction: Vector2): void;
  abstract getComboProgress(): number;
  
  applyFloorSynergy(theme: FloorTheme): void;
  onKill(enemy: Enemy): TimeExtension;
}
```

### Weapon Definitions

```typescript
const WEAPONS = {
  swift_daggers: {
    stats: {
      damage: 1,
      attackSpeed: 0.2,
      range: 1,
      knockback: 0,
      timePerKill: 2,
      timePerHit: 0.3
    },
    combo: {
      threshold: 5,  // 5 hits without getting hit
      reward: { timeBonus: 3, damageMultiplier: 2, specialEffect: 'triple_strike' },
      duration: 4
    },
    synergies: {
      frozen_archive: 'Hits prevent enemy movement for 0.5s',
      ember_depths: 'Attacks extinguish enemy fire trails'
    },
    description: 'Dance around enemies, death by a thousand cuts'
  },
  
  memory_blade: {
    stats: {
      damage: 3,
      attackSpeed: 0.6,
      range: 1.5,
      knockback: 1,
      timePerKill: 4,
      timePerHit: 0
    },
    combo: {
      threshold: 3,  // 3 kills without getting hit
      reward: { timeBonus: 8, specialEffect: 'heal_1' },
      duration: 10
    },
    synergies: {
      verdant_ruins: 'Kills stop enemy regeneration zone-wide for 5s',
      void_sanctum: 'Kills create light burst, reveals area'
    },
    description: 'Balanced, reliable, the hero\'s classic'
  },
  
  shatter_hammer: {
    stats: {
      damage: 5,
      attackSpeed: 1.2,
      range: 1,
      knockback: 2,
      timePerKill: 6,
      timePerHit: 0,
      aoeRadius: 1.5
    },
    combo: {
      threshold: 2,  // 2 multi-kills (2+ enemies one swing)
      reward: { timeBonus: 10, specialEffect: 'ground_pound' },
      duration: 15
    },
    synergies: {
      frozen_archive: 'Shatters ice crystals safely, stuns nearby',
      ember_depths: 'Destroys lava tiles permanently'
    },
    description: 'Slow but devastating, crowd control king'
  },
  
  echo_staff: {
    stats: {
      damage: 2,
      attackSpeed: 0.8,
      range: 4,
      knockback: 0,
      timePerKill: 3,
      timePerHit: 0.5,
      projectileSpeed: 8
    },
    combo: {
      threshold: 4,  // 4 ranged kills without moving
      reward: { timeBonus: 5, specialEffect: 'piercing_shots' },
      duration: 8
    },
    synergies: {
      void_sanctum: 'Projectiles light up fog permanently where they travel',
      shadow_throne: 'Projectiles damage your shadow clone'
    },
    description: 'Kite and control, stay safe at distance'
  },
  
  temporal_gauntlets: {
    stats: {
      damage: 2,
      attackSpeed: 0.4,
      range: 1,
      knockback: 0.5,
      timePerKill: 3,
      timePerHit: 1  // Best time-per-hit ratio
    },
    combo: {
      threshold: 10,  // 10 hits in 5 seconds
      reward: { timeBonus: 15, specialEffect: 'time_freeze_2s' },
      duration: 5
    },
    synergies: {
      all_floors: 'Hazard timers pause while attacking',
      shadow_throne: 'Memory drain paused during combos'
    },
    description: 'Aggressive rushdown, punch the clock'
  }
};
```

### 5.2 Kill Streaks & Perfect Dodge

```typescript
// Kill streak system
const KILL_STREAKS = {
  3:  { bonus: 2,  announcement: 'Triple!',      color: 0xFFFF00 },
  5:  { bonus: 5,  announcement: 'Rampage!',     color: 0xFF8800 },
  8:  { bonus: 10, announcement: 'Unstoppable!', color: 0xFF4400 },
  12: { bonus: 20, announcement: 'LEGENDARY!',   color: 0xFF0000 }
};

// Perfect dodge window
const PERFECT_DODGE = {
  window: 0.15,           // 150ms window
  iFrames: 0.3,           // Invulnerability duration
  timeReward: 1,          // +1s per perfect dodge
  damageMultiplier: 2,    // Next attack deals double
  visualEffect: 'time_slow_brief'
};

// Execute mechanic
const EXECUTE = {
  healthThreshold: 0.2,   // Below 20% HP
  timeBonus: 2,           // +2s bonus
  animation: 'execute_finish',
  requirement: 'melee_range'
};
```

### 5.3 Enemy System

```typescript
// src/entities/Enemy.ts

interface EnemyConfig {
  health: number;
  damage: number;
  moveSpeed: number;
  attackPattern: AttackPattern;
  timeReward: number;
  biome: FloorTheme;
}

enum AttackPattern {
  MELEE_CHASE = 'melee_chase',
  RANGED_STATIONARY = 'ranged_stationary',
  PATROL_AMBUSH = 'patrol_ambush',
  SWARM = 'swarm',
  TELEPORT = 'teleport'
}

abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
  protected config: EnemyConfig;
  protected aiComponent: AIComponent;
  protected isCorrupted: boolean;
  
  abstract update(delta: number): void;
  abstract attack(): void;
  
  takeDamage(amount: number, weapon: Weapon): void;
  die(): void;
  corrupt(): void;  // Shadow corruption effect
}
```

### Phase 2 Deliverables

- [ ] Weapon base class with attack animations
- [ ] All 5 weapon types implemented
- [ ] Combo system with visual feedback
- [ ] Kill streak announcements
- [ ] Perfect dodge detection with i-frames
- [ ] Execute mechanic for low-HP enemies
- [ ] 3-4 enemy types with distinct AI patterns
- [ ] Damage numbers and hit effects
- [ ] Knockback physics

**Milestone:** Combat feels responsive and satisfying, weapons feel distinct.

---

## 6. Phase 3: Floor Themes & Hazards

**Goal:** Five distinct biomes with unique mechanics and visual identity

### 6.1 Floor Theme Definitions

```typescript
// src/systems/FloorThemeSystem.ts

interface FloorTheme {
  id: string;
  name: string;
  floors: [number, number];  // Floor range
  palette: ColorPalette;
  hazards: Hazard[];
  enemyModifiers: EnemyModifiers;
  ambience: string;
}

interface Hazard {
  type: HazardType;
  spawnRate: number;
  damage?: number;
  effect?: StatusEffect;
  visual: string;
}

interface EnemyModifiers {
  bonus: string;
  weakness: DamageType;
  weaknessMultiplier: number;
}
```

### Floor Theme Specifications

#### Verdant Ruins (Floors 1-2)

```typescript
const VERDANT_RUINS: FloorTheme = {
  id: 'verdant_ruins',
  name: 'Verdant Ruins',
  floors: [1, 2],
  palette: {
    primary: 0x2D5A27,      // Deep forest green
    secondary: 0x8BC34A,    // Light green
    accent: 0x4CAF50,       // Vibrant green
    background: 0x1A331A    // Dark green
  },
  hazards: [
    {
      type: 'overgrowth',
      spawnRate: 0.15,
      effect: { type: 'slow', value: 0.3 },
      visual: 'vine_tile'
    },
    {
      type: 'spore_cloud',
      spawnRate: 0.1,
      damage: 1,
      effect: { type: 'poison', duration: 3 },
      visual: 'spore_particles'
    },
    {
      type: 'crumbling_floor',
      spawnRate: 0.08,
      effect: { type: 'collapse', delay: 1.5 },
      visual: 'cracked_tile'
    }
  ],
  enemyModifiers: {
    bonus: 'Enemies regenerate 1 HP every 5s',
    weakness: 'fire',
    weaknessMultiplier: 1.5
  },
  ambience: 'Shattered remnants of the Tree\'s garden'
};
```

#### Frozen Archive (Floors 3-4)

```typescript
const FROZEN_ARCHIVE: FloorTheme = {
  id: 'frozen_archive',
  name: 'Frozen Archive',
  floors: [3, 4],
  palette: {
    primary: 0x4FC3F7,      // Ice blue
    secondary: 0xE1F5FE,    // Light ice
    accent: 0x0288D1,       // Deep blue
    background: 0x1A237E    // Dark blue
  },
  hazards: [
    {
      type: 'ice_tile',
      spawnRate: 0.25,
      effect: { type: 'momentum', extraTiles: 2 },
      visual: 'ice_floor'
    },
    {
      type: 'frozen_enemy',
      spawnRate: 0.1,
      effect: { type: 'dormant', wakeRadius: 3 },
      visual: 'ice_encased'
    },
    {
      type: 'shatter_crystal',
      spawnRate: 0.08,
      damage: 2,
      effect: { type: 'explosion', radius: 1.5 },
      visual: 'crystal_formation'
    }
  ],
  enemyModifiers: {
    bonus: 'Enemies move 20% faster',
    weakness: 'stun',
    weaknessMultiplier: 2
  },
  ambience: 'The kingdom\'s frozen library of memories'
};
```

#### Ember Depths (Floors 5-6)

```typescript
const EMBER_DEPTHS: FloorTheme = {
  id: 'ember_depths',
  name: 'Ember Depths',
  floors: [5, 6],
  palette: {
    primary: 0xFF5722,      // Deep orange
    secondary: 0xFFAB91,    // Light coral
    accent: 0xDD2C00,       // Bright red
    background: 0x3E2723    // Dark brown
  },
  hazards: [
    {
      type: 'lava_tile',
      spawnRate: 0.12,
      damage: 2,
      effect: { type: 'instant_damage', destroysItems: true },
      visual: 'lava_pool'
    },
    {
      type: 'heat_wave',
      spawnRate: 0.15,
      effect: { type: 'distortion', visionReduction: 0.3 },
      visual: 'heat_shimmer'
    },
    {
      type: 'eruption_vent',
      spawnRate: 0.1,
      damage: 3,
      effect: { type: 'timed_eruption', interval: 5 },
      visual: 'vent_glow'
    }
  ],
  enemyModifiers: {
    bonus: 'Enemies leave fire trails (1 dmg/sec)',
    weakness: 'water',
    weaknessMultiplier: 1.5
  },
  ambience: 'Forges where memory-weapons were once crafted'
};
```

#### Void Sanctum (Floors 7-8)

```typescript
const VOID_SANCTUM: FloorTheme = {
  id: 'void_sanctum',
  name: 'Void Sanctum',
  floors: [7, 8],
  palette: {
    primary: 0x7C4DFF,      // Bright purple
    secondary: 0xB388FF,    // Light purple
    accent: 0x651FFF,       // Deep violet
    background: 0x12005E    // Near black purple
  },
  hazards: [
    {
      type: 'limited_vision',
      spawnRate: 1.0,  // Always active
      effect: { type: 'fog_of_war', radius: 3 },
      visual: 'void_fog'
    },
    {
      type: 'gravity_well',
      spawnRate: 0.08,
      effect: { type: 'pull', strength: 2 },
      visual: 'gravity_spiral'
    },
    {
      type: 'phase_wall',
      spawnRate: 0.1,
      effect: { type: 'flicker', onTime: 3, offTime: 2 },
      visual: 'phasing_wall'
    }
  ],
  enemyModifiers: {
    bonus: 'Enemies can teleport short distances',
    weakness: 'light',
    weaknessMultiplier: 1.5
  },
  ambience: 'Where forgotten memories dissolve into nothing'
};
```

#### Shadow Throne (Floors 9-10)

```typescript
const SHADOW_THRONE: FloorTheme = {
  id: 'shadow_throne',
  name: 'Shadow Throne',
  floors: [9, 10],
  palette: {
    primary: 0x212121,      // Near black
    secondary: 0x424242,    // Dark gray
    accent: 0x9C27B0,       // Shadow purple
    background: 0x000000    // Pure black
  },
  hazards: [
    {
      type: 'all_previous',
      spawnRate: 0.1,
      effect: { type: 'random_biome_hazard' },
      visual: 'varies'
    },
    {
      type: 'shadow_clone',
      spawnRate: 0.05,
      damage: 'player_damage',
      effect: { type: 'mirror_player', attackInterval: 3 },
      visual: 'dark_silhouette'
    },
    {
      type: 'memory_drain',
      spawnRate: 1.0,  // Always active
      effect: { type: 'time_drain_multiplier', value: 1.25 },
      visual: 'dark_particles'
    }
  ],
  enemyModifiers: {
    bonus: 'Enemies gain random abilities from other zones',
    weakness: 'relic_powered',
    weaknessMultiplier: 2
  },
  ambience: 'Alaric\'s domain — the heart of corruption'
};
```

### 6.2 Hazard Implementation

```typescript
// src/systems/HazardSystem.ts

abstract class Hazard extends Phaser.GameObjects.Sprite {
  abstract onPlayerEnter(player: Player): void;
  abstract onPlayerStay(player: Player, delta: number): void;
  abstract onPlayerExit(player: Player): void;
  abstract update(delta: number): void;
}

class LavaTile extends Hazard {
  onPlayerEnter(player: Player): void {
    player.takeDamage(2, this);
    this.destroyPlayerItems();
  }
  
  onPlayerStay(player: Player, delta: number): void {
    // Continuous damage if somehow stuck
  }
}

class IceTile extends Hazard {
  onPlayerEnter(player: Player): void {
    player.applyMomentum(player.lastDirection, 2);
  }
}

class EruptionVent extends Hazard {
  private timer: number = 0;
  private interval: number = 5;
  private warningTime: number = 1.5;
  
  update(delta: number): void {
    this.timer += delta;
    
    if (this.timer > this.interval - this.warningTime) {
      this.showWarning();
    }
    
    if (this.timer >= this.interval) {
      this.erupt();
      this.timer = 0;
    }
  }
  
  private erupt(): void {
    // Damage anything in range
    // Spawn fire column visual
  }
}
```

### Phase 3 Deliverables

- [ ] FloorThemeSystem managing biome state
- [ ] Color palette swapping per biome
- [ ] All hazard types implemented
- [ ] Enemy modifiers per biome (regen, speed, etc.)
- [ ] Weapon synergies per biome
- [ ] Visual effects for each hazard
- [ ] Tileset variations per biome
- [ ] Ambient audio per biome

**Milestone:** Each biome feels distinct and affects gameplay meaningfully.

---

## 7. Phase 4: Relic System

**Goal:** Build variety through relic choices and synergies

### 7.1 Relic Architecture

```typescript
// src/systems/RelicSystem.ts

interface Relic {
  id: string;
  name: string;
  set: RelicSet;
  tier: 'common' | 'rare' | 'legendary';
  passive: PassiveEffect;
  active: ActiveAbility;
  shadowCounter: string;
  combatSynergy: CombatSynergy;
  icon: string;
}

interface PassiveEffect {
  type: string;
  value: number;
  description: string;
}

interface ActiveAbility {
  effect: () => void;
  cooldown: number;
  currentCooldown: number;
  description: string;
}

interface CombatSynergy {
  trigger: string;
  reward: { time?: number; damage?: number; heal?: number };
}

class RelicSystem {
  private equippedRelics: Relic[];
  private maxRelics: number = 5;
  private setBonus: Map<RelicSet, number>;
  
  equipRelic(relic: Relic): void;
  swapRelic(oldIndex: number, newRelic: Relic): Relic;
  useActive(index: number): boolean;
  updateCooldowns(delta: number): void;
  
  // Set bonuses
  checkSetBonus(set: RelicSet): number;
  applySetBonus(set: RelicSet, count: number): void;
  
  // Combat integration
  onEnemyKilled(enemy: Enemy, weapon: Weapon): void;
  onDamageTaken(amount: number, source: Entity): void;
  onRoomCleared(): void;
}
```

### 7.2 Relic Definitions by Set

#### Verdant Set (Floors 1-2)

```typescript
const VERDANT_RELICS = {
  root_of_resilience: {
    id: 'root_of_resilience',
    name: 'Root of Resilience',
    set: 'verdant',
    tier: 'rare',
    passive: {
      type: 'regeneration',
      value: 1,  // HP per 30s
      description: 'Regenerate 1 HP every 30s'
    },
    active: {
      effect: () => {
        player.cleanse();
        timeManager.extend(5, 'Root of Resilience');
      },
      cooldown: 45,
      description: 'Cleanse all debuffs, +5s'
    },
    shadowCounter: 'Immune to Shadow\'s decay aura',
    combatSynergy: {
      trigger: 'kill_while_poisoned',
      reward: { time: 6 }  // 2x normal
    }
  },
  
  seed_of_swiftness: {
    id: 'seed_of_swiftness',
    name: 'Seed of Swiftness',
    set: 'verdant',
    tier: 'common',
    passive: {
      type: 'move_speed',
      value: 0.2,  // +20%
      description: 'Movement speed +20%'
    },
    active: {
      effect: () => {
        player.dash(player.facing, { damage: true, iFrames: true });
      },
      cooldown: 8,
      description: 'Dash through enemies, damaging them'
    },
    shadowCounter: 'Can dash through Shadow\'s barriers',
    combatSynergy: {
      trigger: 'dash_kill',
      reward: { time: 3 }
    }
  },
  
  bloom_of_binding: {
    id: 'bloom_of_binding',
    name: 'Bloom of Binding',
    set: 'verdant',
    tier: 'legendary',
    passive: {
      type: 'enemy_slow_aura',
      value: 0.15,  // 15% slow
      description: 'Enemies near you are slowed 15%'
    },
    active: {
      effect: () => {
        currentRoom.enemies.forEach(e => e.root(3));
      },
      cooldown: 30,
      description: 'Root all enemies in room for 3s'
    },
    shadowCounter: 'Shadow cannot teleport near you',
    combatSynergy: {
      trigger: 'kill_rooted_enemy',
      reward: { time: 5 }
    }
  }
};
```

#### Frozen Set (Floors 3-4)

```typescript
const FROZEN_RELICS = {
  crystal_of_clarity: {
    id: 'crystal_of_clarity',
    name: 'Crystal of Clarity',
    set: 'frozen',
    tier: 'rare',
    passive: {
      type: 'enemy_info',
      value: 1,
      description: 'See enemy HP bars and attack patterns'
    },
    active: {
      effect: () => {
        dungeonGenerator.revealFloor(10);  // 10 seconds
      },
      cooldown: 60,
      description: 'Reveal entire floor map for 10s'
    },
    shadowCounter: 'Always see Shadow\'s location',
    combatSynergy: {
      trigger: 'first_hit_revealed_enemy',
      reward: { damage: 2 }  // Critical hit
    }
  },
  
  shard_of_stillness: {
    id: 'shard_of_stillness',
    name: 'Shard of Stillness',
    set: 'frozen',
    tier: 'legendary',
    passive: {
      type: 'perfect_dodge_window',
      value: 0.5,  // +50%
      description: 'Perfect dodge window +50%'
    },
    active: {
      effect: () => {
        timeManager.pause();
        setTimeout(() => timeManager.resume(), 3000);
        // Player can still move during freeze
      },
      cooldown: 90,
      description: 'Freeze time for 3s (you still move)'
    },
    shadowCounter: 'Shadow\'s attacks frozen during activation',
    combatSynergy: {
      trigger: 'kill_frozen_enemy',
      reward: { time: 4 }
    }
  },
  
  ice_of_isolation: {
    id: 'ice_of_isolation',
    name: 'Ice of Isolation',
    set: 'frozen',
    tier: 'common',
    passive: {
      type: 'ranged_slow',
      value: 0.2,  // 20% slow on hit
      description: 'Ranged attacks slow enemies'
    },
    active: {
      effect: () => {
        player.createIceWall(player.facing, 3);  // 3 tiles wide
      },
      cooldown: 15,
      description: 'Create ice wall, blocks projectiles'
    },
    shadowCounter: 'Block Shadow\'s corruption beams',
    combatSynergy: {
      trigger: 'kill_against_wall',
      reward: { time: 3 }
    }
  }
};
```

#### Ember Set (Floors 5-6)

```typescript
const EMBER_RELICS = {
  flame_of_fury: {
    id: 'flame_of_fury',
    name: 'Flame of Fury',
    set: 'ember',
    tier: 'rare',
    passive: {
      type: 'low_health_damage',
      value: 0.25,  // +25% damage below 50% HP
      description: 'Damage +25% when below 50% HP'
    },
    active: {
      effect: () => {
        currentRoom.enemies.forEach(e => e.applyBurn(3, 5));  // 3 dmg over 5s
      },
      cooldown: 25,
      description: 'Ignite all enemies in room (DOT)'
    },
    shadowCounter: 'Burn away Shadow\'s darkness zones',
    combatSynergy: {
      trigger: 'kill_burning_enemy',
      reward: { time: 4 }
    }
  },
  
  coal_of_consumption: {
    id: 'coal_of_consumption',
    name: 'Coal of Consumption',
    set: 'ember',
    tier: 'common',
    passive: {
      type: 'lifesteal',
      value: 1,  // 1 HP per kill
      description: 'Kills restore 1 HP'
    },
    active: {
      effect: () => {
        player.takeDamage(2, 'self');
        timeManager.extend(15, 'Coal of Consumption');
      },
      cooldown: 20,
      description: 'Sacrifice 2 HP for +15s'
    },
    shadowCounter: 'Shadow cannot drain your HP',
    combatSynergy: {
      trigger: 'kill_at_low_health',
      reward: { time: 6 }  // 2x normal
    }
  },
  
  ember_of_eruption: {
    id: 'ember_of_eruption',
    name: 'Ember of Eruption',
    set: 'ember',
    tier: 'legendary',
    passive: {
      type: 'explosion_chance',
      value: 0.2,  // 20% chance
      description: 'Attacks have 20% chance to explode'
    },
    active: {
      effect: () => {
        player.createExplosion(player.position, 3);  // 3 tile radius
        // Player immune to own explosion
      },
      cooldown: 40,
      description: 'Massive explosion centered on you (immune)'
    },
    shadowCounter: 'Explosion dispels Shadow illusions',
    combatSynergy: {
      trigger: 'multi_kill_explosion',
      reward: { time: 8 }
    }
  }
};
```

#### Void Set (Floors 7-8)

```typescript
const VOID_RELICS = {
  tear_of_the_abyss: {
    id: 'tear_of_the_abyss',
    name: 'Tear of the Abyss',
    set: 'void',
    tier: 'rare',
    passive: {
      type: 'phase_on_dodge',
      value: 0.5,  // 0.5s phase through walls
      description: 'Phase through walls briefly after dodge'
    },
    active: {
      effect: () => {
        player.teleport(player.targetTile);
      },
      cooldown: 12,
      description: 'Teleport to any visible tile'
    },
    shadowCounter: 'Escape Shadow\'s grasp attacks',
    combatSynergy: {
      trigger: 'backstab_after_teleport',
      reward: { time: 5 }
    }
  },
  
  fragment_of_forgetting: {
    id: 'fragment_of_forgetting',
    name: 'Fragment of Forgetting',
    set: 'void',
    tier: 'legendary',
    passive: {
      type: 'stealth',
      value: 3,  // 3s of no combat = invisible
      description: 'Enemies forget you after 3s of no combat'
    },
    active: {
      effect: () => {
        currentRoom.enemies.forEach(e => e.loseAggro());
        currentRoom.enemies.forEach(e => e.wander(5));
      },
      cooldown: 35,
      description: 'All enemies lose aggro, wander confused'
    },
    shadowCounter: 'Shadow loses track of you for 10s',
    combatSynergy: {
      trigger: 'stealth_kill',
      reward: { time: 6 }
    }
  },
  
  lens_of_lost_light: {
    id: 'lens_of_lost_light',
    name: 'Lens of Lost Light',
    set: 'void',
    tier: 'common',
    passive: {
      type: 'attack_light',
      value: 1,  // 1 tile permanent light per attack
      description: 'Your attacks create light, expanding vision'
    },
    active: {
      effect: () => {
        currentRoom.applyPermanentLight();
      },
      cooldown: 20,
      description: 'Permanent light in current room'
    },
    shadowCounter: 'Purify Shadow corruption in lit areas',
    combatSynergy: {
      trigger: 'kill_in_darkness',
      reward: { time: 3 }
    }
  }
};
```

#### Shadow Set (Final Boss)

```typescript
const SHADOW_RELICS = {
  alarics_regret: {
    id: 'alarics_regret',
    name: 'Alaric\'s Regret',
    set: 'shadow',
    tier: 'legendary',
    passive: {
      type: 'cooldown_reduction',
      value: 0.25,  // All relic actives 25% faster
      description: 'All previous relic actives cooldown 25% faster'
    },
    active: {
      effect: () => {
        player.channelShadowPower(3);  // 3s massive damage burst
      },
      cooldown: 120,
      description: 'Channel Alaric\'s power — massive damage burst'
    },
    shadowCounter: 'N/A — Alaric is defeated',
    combatSynergy: {
      trigger: 'every_10_kills',
      reward: { special: 'trigger_all_passives' }
    },
    special: 'Only obtainable by defeating the Whispering Shadow'
  }
};
```

### 7.3 Set Synergies

```typescript
const SET_SYNERGIES = {
  // Having multiple relics from same set
  2: {
    effect: 'effect_strength_bonus',
    value: 0.1,  // +10%
    description: '+10% effect strength'
  },
  3: {
    effect: 'cooldown_reduction',
    value: 0.2,  // -20%
    description: 'Active cooldowns -20%'
  },
  4: {
    effect: 'unique_set_bonus',
    bonuses: {
      verdant: 'Continuous regeneration (1 HP / 10s)',
      frozen: 'Enemies spawn frozen for 2s',
      ember: 'All attacks have fire DOT',
      void: 'Permanent expanded vision'
    }
  }
};
```

### 7.4 Relic Selection UI

```typescript
// src/ui/RelicSelectUI.ts

class RelicSelectUI extends Phaser.GameObjects.Container {
  private options: Relic[];
  private selectedIndex: number;
  private currentRelics: Relic[];
  
  show(options: Relic[], currentRelics: Relic[]): void;
  
  // Display
  private renderRelicCard(relic: Relic, index: number): void;
  private highlightSelection(): void;
  private showRelicDetails(relic: Relic): void;
  private showSetProgress(set: RelicSet): void;
  
  // Interaction
  onSelect(index: number): void;
  onConfirm(): void;
  
  // If at max relics
  showSwapUI(newRelic: Relic): void;
}
```

### Phase 4 Deliverables

- [ ] RelicSystem with passive/active management
- [ ] All 13 relics implemented (3 per biome + 1 final)
- [ ] Relic selection UI after boss kills
- [ ] Set bonus tracking and display
- [ ] Cooldown visualization on HUD
- [ ] Combat synergy triggers
- [ ] Shadow counter effects
- [ ] Relic swap mechanic when at max

**Milestone:** Builds feel distinct based on relic choices, synergies reward planning.

---

## 8. Phase 5: The Whispering Shadow

**Goal:** Escalating threat that permeates the entire experience

### 8.1 Corruption System

```typescript
// src/systems/ShadowSystem.ts

interface CorruptionState {
  level: number;           // 0-100
  activeEffects: CorruptionEffect[];
  isPursuerActive: boolean;
  pursuerPosition: Vector2 | null;
}

interface CorruptionEffect {
  threshold: number;
  name: string;
  visualEffect: string;
  gameplayEffect: () => void;
}

class ShadowSystem {
  private corruption: number = 0;
  private pursuer: ShadowPursuer | null = null;
  
  // Corruption management
  addCorruption(amount: number, source: string): void;
  reduceCorruption(amount: number, source: string): void;
  
  // Threshold effects
  private checkThresholds(): void;
  private applyThresholdEffect(effect: CorruptionEffect): void;
  
  // Pursuer mechanics
  spawnPursuer(): void;
  updatePursuer(delta: number): void;
  private pursuerPathfind(): void;
  
  // Room corruption
  corruptRoom(room: Room): void;
  purifyRoom(room: Room): void;
  
  // Boss integration
  applyBossCorruption(boss: Boss): void;
}
```

### 8.2 Corruption Thresholds

```typescript
const CORRUPTION_THRESHOLDS = {
  25: {
    name: 'Whispers Begin',
    effects: {
      visual: 'subtle_screen_vignette',
      audio: 'faint_whisper_loop',
      gameplay: () => {
        // 5% chance corrupted enemy spawns
        enemySpawner.setCorruptionChance(0.05);
      }
    }
  },
  
  50: {
    name: 'Creeping Darkness',
    effects: {
      visual: 'darker_vignette',
      audio: 'whispers_intensify',
      gameplay: () => {
        // Time drains 10% faster
        timeManager.setDrainRate(1.1);
        // Random shadow zones appear in rooms
        roomGenerator.enableShadowZones();
      }
    }
  },
  
  75: {
    name: 'His Gaze Upon You',
    effects: {
      visual: 'shadow_figure_in_background',
      audio: 'heartbeat_pulse',
      gameplay: () => {
        // Shadow Hunters spawn
        enemySpawner.enableShadowHunters();
      }
    }
  },
  
  100: {
    name: 'The Shadow Hunts',
    effects: {
      visual: 'screen_pulses_darkness',
      audio: 'shadow_theme',
      gameplay: () => {
        // Whispering Shadow himself pursues
        shadowSystem.spawnPursuer();
      }
    }
  }
};
```

### 8.3 Corruption Sources

```typescript
const CORRUPTION_SOURCES = {
  // Increases
  floor_entered: 5,
  idle_10_seconds: 1,
  player_death: 15,
  dark_enemy_killed: 2,
  
  // Decreases
  secret_found: -5,
  relic_acquired: -10,
  room_purified: -8,
  boss_defeated: -15,
  
  // Neutral
  room_cleared_fast: 0,  // Speed rewards don't affect corruption
};
```

### 8.4 Shadow Pursuer

```typescript
// src/entities/ShadowPursuer.ts

class ShadowPursuer extends Phaser.Physics.Arcade.Sprite {
  private moveSpeed: number = 1;  // Tiles per second (slow)
  private phasesThroughWalls: boolean = true;
  private damageOnContact: number = 999;  // Instant death
  
  update(delta: number): void {
    // Relentless pathfinding toward player
    this.pathfindToPlayer();
    
    // Check for relic counters
    this.checkRelicCounters();
    
    // Cannot enter cleared rooms
    if (this.isInClearedRoom()) {
      this.retreatToUncleared();
    }
  }
  
  // Counterplay
  pushBack(distance: number, source: string): void;
  stun(duration: number): void;
  
  // Visual
  private renderShadowTrail(): void;
  private pulseDarkness(): void;
}
```

### 8.5 Corrupted Rooms

```typescript
interface CorruptedRoom {
  originalRoom: Room;
  corruptionType: CorruptionType;
  purificationMethod: string;
}

enum CorruptionType {
  SHADOW_TILES = 'shadow_tiles',      // Drain 1s every 2s while standing
  DARK_ENEMIES = 'dark_enemies',       // Enemies heal each other on death
  INVERTED_TIME = 'inverted_time',     // Time pickups DRAIN instead
  SHADOW_CLONE = 'shadow_clone'        // Your reflection attacks you
}

const ROOM_CORRUPTION = {
  shadow_tiles: {
    spawnChance: (corruption) => 0.1 + (corruption / 1000),
    effect: (player, delta) => {
      if (player.isOnShadowTile()) {
        timeManager.drain(0.5 * delta, 'shadow_tile');
      }
    },
    purification: 'Kill all enemies + use light relic active',
    reward: { time: 15 }
  },
  
  dark_enemies: {
    spawnChance: (corruption) => 0.08 + (corruption / 1250),
    effect: () => {
      // On enemy death, nearby enemies heal 20% max HP
    },
    purification: 'Kill all enemies within 10 seconds of each other',
    reward: { time: 12 }
  },
  
  inverted_time: {
    spawnChance: (corruption) => 0.05 + (corruption / 2000),
    effect: () => {
      // Time pickups drain instead of extend
      // Visual: pickups glow dark purple
    },
    purification: 'Avoid all pickups, kill enemies only',
    reward: { time: 20 }
  },
  
  shadow_clone: {
    spawnChance: (corruption) => 0.03 + (corruption / 3000),
    effect: () => {
      // Dark reflection copies player, attacks every 3s
    },
    purification: 'Defeat your shadow clone',
    reward: { time: 18, corruption: -10 }
  }
};
```

### 8.6 Boss Corruption Variants

```typescript
const BOSS_CORRUPTION_MODIFIERS = {
  below50: {
    description: 'Normal boss fight',
    modifiers: []
  },
  
  above50: {
    description: 'Boss has shadow phase',
    modifiers: [
      {
        type: 'shadow_phase',
        effect: 'Boss invulnerable until shadow orbs destroyed',
        orbCount: 3,
        orbHealth: 2
      }
    ]
  },
  
  above75: {
    description: 'Boss summons Shadow Hunters',
    modifiers: [
      {
        type: 'shadow_summon',
        effect: 'Shadow Hunters spawn at 75% and 25% boss HP',
        hunterCount: 2
      }
    ]
  },
  
  at100: {
    description: 'Whispering Shadow joins the fight',
    modifiers: [
      {
        type: 'shadow_assist',
        effect: 'Shadow appears, attacks independently',
        shadowBehavior: 'aggressive_but_avoidable'
      }
    ]
  }
};
```

### Phase 5 Deliverables

- [ ] ShadowSystem with corruption tracking
- [ ] Visual effects per corruption threshold
- [ ] Audio integration (whispers, heartbeat)
- [ ] Shadow Pursuer AI and visuals
- [ ] All 4 room corruption types
- [ ] Purification mechanics
- [ ] Boss corruption variants
- [ ] Shadow-relic counter interactions

**Milestone:** Shadow presence creates escalating tension throughout runs.

---

## 9. Phase 6: Meta Progression

**Goal:** Long-term progression that respects player time

### 9.1 Currency System

```typescript
// src/systems/ProgressionSystem.ts

interface PlayerProgression {
  memoryShardsTotal: number;
  memoryShardsSpent: number;
  unlockedUpgrades: string[];
  unlockedWeapons: string[];
  highestFloorReached: number;
  totalRuns: number;
  bossesDefeated: string[];
}

class ProgressionSystem {
  private progression: PlayerProgression;
  
  // Shard earning
  earnShards(amount: number, source: string): void;
  
  // Spending
  purchaseUpgrade(upgradeId: string): boolean;
  unlockWeapon(weaponId: string): boolean;
  
  // Queries
  canAfford(cost: number): boolean;
  isUnlocked(id: string): boolean;
  
  // Persistence
  save(): void;
  load(): PlayerProgression;
}
```

### 9.2 Shard Sources

```typescript
const SHARD_SOURCES = {
  // Per-run earnings
  enemy_kill: 1,
  elite_enemy_kill: 3,
  room_cleared: 5,
  room_perfect: 8,
  floor_boss_kill: 25,
  secret_found: 10,
  
  // Milestone bonuses (first time only)
  first_boss_kill: 50,
  reach_floor_3: 30,
  reach_floor_5: 50,
  reach_floor_7: 75,
  reach_floor_9: 100,
  defeat_shadow: 200,
  
  // Achievement bonuses
  no_damage_floor: 20,
  sub_60_floor: 15,
  full_relic_set: 40
};
```

### 9.3 Upgrade Tree

```typescript
const UPGRADE_TREE = {
  // TIME UPGRADES
  time_tree: {
    expanded_hourglass: {
      cost: 50,
      effect: 'Max time increased from 90s to 120s',
      prerequisite: null
    },
    efficient_collection: {
      cost: 100,
      effect: 'All time pickups give +25% more',
      prerequisite: 'expanded_hourglass'
    },
    combat_momentum: {
      cost: 150,
      effect: 'Kill streaks grant bonus time (3-kill = +5s)',
      prerequisite: 'efficient_collection'
    },
    starting_buffer: {
      cost: 200,
      effect: 'Start each floor with +15s',
      prerequisite: 'combat_momentum'
    },
    temporal_mastery: {
      cost: 500,
      effect: 'Time drain reduced by 10%',
      prerequisite: 'starting_buffer'
    }
  },
  
  // COMBAT UPGRADES
  combat_tree: {
    sharpened_blade: {
      cost: 75,
      effect: 'Base weapon damage +1',
      prerequisite: null
    },
    combo_training: {
      cost: 125,
      effect: 'Combo thresholds reduced by 1',
      prerequisite: 'sharpened_blade'
    },
    perfect_form: {
      cost: 175,
      effect: 'Perfect dodge window +25%',
      prerequisite: 'combo_training'
    },
    execute_mastery: {
      cost: 250,
      effect: 'Execute threshold raised to 30% HP',
      prerequisite: 'perfect_form'
    },
    weapon_affinity: {
      cost: 400,
      effect: 'Weapon floor synergies +50% stronger',
      prerequisite: 'execute_mastery'
    }
  },
  
  // SURVIVAL UPGRADES
  survival_tree: {
    thick_skin: {
      cost: 60,
      effect: 'Max HP +1',
      prerequisite: null
    },
    second_wind: {
      cost: 120,
      effect: 'Heal 1 HP on floor transition',
      prerequisite: 'thick_skin'
    },
    danger_sense: {
      cost: 180,
      effect: 'See hazard activation 1s earlier',
      prerequisite: 'second_wind'
    },
    shadow_resistance: {
      cost: 300,
      effect: 'Corruption gain reduced by 20%',
      prerequisite: 'danger_sense'
    },
    last_stand: {
      cost: 500,
      effect: 'Once per run: survive lethal hit with 1 HP',
      prerequisite: 'shadow_resistance'
    }
  },
  
  // RELIC UPGRADES
  relic_tree: {
    relic_attunement: {
      cost: 100,
      effect: 'Start with 1 random common relic',
      prerequisite: null
    },
    expanded_memory: {
      cost: 200,
      effect: 'Can hold 6 relics instead of 5',
      prerequisite: 'relic_attunement'
    },
    rapid_recovery: {
      cost: 250,
      effect: 'All relic cooldowns -15%',
      prerequisite: 'expanded_memory'
    },
    set_seeker: {
      cost: 350,
      effect: 'Boss relic choice includes 1 from current set',
      prerequisite: 'rapid_recovery'
    },
    memory_keeper: {
      cost: 600,
      effect: 'Keep 1 relic between runs',
      prerequisite: 'set_seeker'
    }
  }
};
```

### 9.4 Weapon Unlocks

```typescript
const WEAPON_UNLOCKS = {
  swift_daggers: {
    cost: 0,  // Starting weapon
    requirement: null
  },
  memory_blade: {
    cost: 0,  // Starting weapon
    requirement: null
  },
  shatter_hammer: {
    cost: 150,
    requirement: 'Reach Floor 3'
  },
  echo_staff: {
    cost: 200,
    requirement: 'Reach Floor 5'
  },
  temporal_gauntlets: {
    cost: 300,
    requirement: 'Defeat a boss with over 60s remaining'
  }
};
```

### 9.5 Hub Area (Nexus of Memories)

```typescript
// src/scenes/HubScene.ts

class HubScene extends Phaser.Scene {
  private upgradeShrine: UpgradeShrine;
  private weaponRack: WeaponRack;
  private relicAltar: RelicAltar;
  private dungeonGate: DungeonGate;
  private memoryWall: MemoryWall;
  
  // Interactions
  onUpgradeShrineInteract(): void;   // Purchase upgrades
  onWeaponRackInteract(): void;       // Select starting weapon
  onRelicAltarInteract(): void;       // View collected relics, equip kept relic
  onDungeonGateInteract(): void;      // Start run
  onMemoryWallInteract(): void;       // View stats, achievements
  
  // Visuals
  private updateShrineGlow(): void;   // Shows available upgrades
  private updateTreeProgress(): void; // Background tree restoration visual
}
```

### Phase 6 Deliverables

- [ ] ProgressionSystem with save/load
- [ ] Shard earning across all sources
- [ ] Full upgrade tree implementation
- [ ] Weapon unlock system
- [ ] Hub scene with all interactive elements
- [ ] Persistent stats tracking
- [ ] Achievement system
- [ ] Visual progression (tree restoration)

**Milestone:** Players feel meaningful progress between runs.

---

## 10. Phase 7: Polish & Juice

**Goal:** Make every action feel impactful and satisfying

### 10.1 Screen Effects

```typescript
const SCREEN_EFFECTS = {
  hit_stop: {
    duration: 50,  // ms
    scale: (damage) => damage * 10,  // Stronger hits = longer stop
    trigger: 'heavy_attack_connect'
  },
  
  screen_shake: {
    duration: 100,
    intensity: (damage) => damage * 2,
    trigger: 'player_damaged, explosion, boss_attack'
  },
  
  time_slow: {
    duration: 300,
    scale: 0.3,  // 30% speed
    trigger: 'perfect_dodge, critical_hit'
  },
  
  flash: {
    duration: 50,
    color: 0xFFFFFF,
    trigger: 'player_damaged'
  },
  
  vignette_pulse: {
    duration: 500,
    intensity: 0.3,
    trigger: 'time_critical, corruption_threshold'
  }
};
```

### 10.2 Particle Systems

```typescript
const PARTICLE_CONFIGS = {
  enemy_death: {
    texture: 'particle_spark',
    count: 15,
    speed: { min: 50, max: 150 },
    lifespan: 500,
    tint: 'enemy_color'
  },
  
  time_pickup: {
    texture: 'particle_time',
    count: 20,
    speed: { min: 20, max: 80 },
    lifespan: 800,
    tint: 0x00FF00,
    gravity: -100  // Float upward
  },
  
  weapon_trail: {
    texture: 'particle_slash',
    count: 8,
    followPath: true,
    lifespan: 200,
    tint: 'weapon_color'
  },
  
  corruption_aura: {
    texture: 'particle_shadow',
    count: 30,
    continuous: true,
    speed: { min: 10, max: 30 },
    lifespan: 1000,
    tint: 0x4A0080
  }
};
```

### 10.3 Audio Design

```typescript
const AUDIO_LAYERS = {
  // Dynamic music system
  music: {
    exploration: { bpm: 100, intensity: 'low' },
    combat: { bpm: 140, intensity: 'medium' },
    boss: { bpm: 160, intensity: 'high' },
    shadow_pursuit: { bpm: 180, intensity: 'critical' }
  },
  
  // Adaptive elements
  adaptive: {
    time_warning: 'Add tension percussion at 30s',
    time_critical: 'Add heartbeat at 10s',
    corruption_high: 'Add whisper layer',
    low_health: 'Add heartbeat, muffle other audio'
  },
  
  // SFX priorities
  sfx: {
    player_attack: { volume: 1.0, interrupt: false },
    player_damaged: { volume: 1.0, interrupt: true },
    time_extended: { volume: 0.8, interrupt: false },
    enemy_death: { volume: 0.6, interrupt: false },
    pickup: { volume: 0.5, interrupt: false }
  }
};
```

### 10.4 UI Juice

```typescript
const UI_ANIMATIONS = {
  time_display: {
    normal: { color: 0x00FF00, scale: 1.0 },
    warning: { color: 0xFFFF00, scale: 1.0, pulse: false },
    critical: { color: 0xFF0000, scale: 1.1, pulse: true, pulseSpeed: 0.5 }
  },
  
  time_popup: {
    positive: {
      text: '+{amount}s',
      color: 0x00FF00,
      float: { y: -30, duration: 800 },
      fade: { delay: 500, duration: 300 }
    },
    negative: {
      text: '-{amount}s',
      color: 0xFF0000,
      shake: true,
      fade: { delay: 300, duration: 200 }
    }
  },
  
  damage_number: {
    normal: { color: 0xFFFFFF, size: 12 },
    critical: { color: 0xFFFF00, size: 16, shake: true },
    heal: { color: 0x00FF00, size: 12 }
  },
  
  kill_streak: {
    announcement: {
      scale: { from: 2.0, to: 1.0, duration: 300 },
      shake: true,
      glow: true
    }
  }
};
```

### 10.5 Accessibility Options

```typescript
const ACCESSIBILITY_OPTIONS = {
  visual: {
    screenShake: { default: true, option: 'toggle' },
    flashEffects: { default: true, option: 'toggle' },
    colorblindMode: { default: 'none', options: ['none', 'deuteranopia', 'protanopia', 'tritanopia'] },
    highContrast: { default: false, option: 'toggle' },
    uiScale: { default: 1.0, range: [0.8, 1.5] }
  },
  
  audio: {
    masterVolume: { default: 1.0, range: [0, 1] },
    musicVolume: { default: 0.7, range: [0, 1] },
    sfxVolume: { default: 1.0, range: [0, 1] },
    screenReaderMode: { default: false, option: 'toggle' }
  },
  
  gameplay: {
    autoAim: { default: false, option: 'toggle' },
    extendedDodgeWindow: { default: false, option: 'toggle' },
    reducedTimePressure: { default: false, option: 'toggle' }  // +50% base time
  }
};
```

### Phase 7 Deliverables

- [ ] Hit stop and screen shake system
- [ ] All particle effects
- [ ] Dynamic music system
- [ ] Adaptive audio layers
- [ ] UI animation library
- [ ] Damage/time popup system
- [ ] Kill streak announcements
- [ ] Full accessibility options menu
- [ ] Controller support
- [ ] Tutorial/onboarding flow

**Milestone:** Game feels polished and professional.

---

## 11. Asset Requirements

### From SGQ Asset Packs

| Asset Type | Source | Usage |
|------------|--------|-------|
| Player sprites | SGQ_Dungeon/characters/main/ | Player animations |
| Enemy sprites | SGQ_Dungeon/characters/enemies/ | Enemy variants |
| Tileset | SGQ_Dungeon/grounds_and_walls/ | Floor tiles, walls |
| Objects | SGQ_Dungeon/objects/ | Pickups, hazards, props |
| UI elements | SGQ_ui/game_ui/ | HUD, menus, buttons |
| Icons | SGQ_ui/game_ui/icons_16x16.png | Item/relic icons |

### Custom Assets Needed

| Asset | Description | Priority |
|-------|-------------|----------|
| Relic icons | 13 unique relic icons | High |
| Weapon sprites | 5 weapon swing animations | High |
| Boss sprites | 5 floor bosses + Shadow | High |
| Biome tilesets | Color-shifted variants | Medium |
| Particle textures | Spark, slash, shadow, time | Medium |
| Shadow pursuer | Distinct ghostly sprite | Medium |
| UI mockups | Timer, relic bar, corruption | Medium |
| Logo/title | Game branding | Low |

### Audio Needs

| Audio Type | Count | Notes |
|------------|-------|-------|
| Music tracks | 7 | Hub, 5 biomes, boss |
| Ambient loops | 5 | One per biome |
| Player SFX | ~20 | Attack, dodge, hurt, etc. |
| Enemy SFX | ~15 | Per enemy type |
| UI SFX | ~10 | Menu, pickup, notification |
| Stingers | 5 | Boss intro, death, victory |

---

## 12. Milestone Schedule

### Overview

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1: Foundation | 2 weeks | Playable dungeon with timer |
| Phase 2: Combat | 2 weeks | All weapons, satisfying combat |
| Phase 3: Floors | 2 weeks | 5 distinct biomes |
| Phase 4: Relics | 2 weeks | Full relic system |
| Phase 5: Shadow | 1.5 weeks | Corruption, pursuer |
| Phase 6: Meta | 1.5 weeks | Progression, hub |
| Phase 7: Polish | 2 weeks | Juice, accessibility |
| **Total** | **13 weeks** | **Full game** |

### Detailed Breakdown

#### Weeks 1-2: Foundation
- Day 1-2: Project setup, asset pipeline
- Day 3-4: TimeManager + HUD
- Day 5-6: rot.js dungeon generation
- Day 7-8: Player movement + camera
- Day 9-10: Basic enemy, room transitions

#### Weeks 3-4: Combat
- Day 1-3: Weapon base class, attack system
- Day 4-6: All 5 weapons
- Day 7-8: Combo + kill streak systems
- Day 9-10: Enemy AI variants

#### Weeks 5-6: Floor Themes
- Day 1-2: FloorThemeSystem architecture
- Day 3-4: Verdant + Frozen biomes
- Day 5-6: Ember + Void biomes
- Day 7-8: Shadow Throne biome
- Day 9-10: Hazard polish, weapon synergies

#### Weeks 7-8: Relics
- Day 1-2: RelicSystem architecture
- Day 3-5: All 13 relics implemented
- Day 6-7: Relic selection UI
- Day 8-9: Set bonuses
- Day 10: Combat synergy integration

#### Weeks 9-10: Shadow
- Day 1-2: Corruption system
- Day 3-4: Threshold effects
- Day 5-6: Shadow pursuer
- Day 7: Room corruption types
- Day 8: Boss corruption variants

#### Weeks 10.5-11.5: Meta Progression
- Day 1-2: Shard system + save/load
- Day 3-4: Upgrade tree
- Day 5-6: Hub scene
- Day 7: Weapon unlocks, achievements

#### Weeks 12-13: Polish
- Day 1-3: Screen effects, particles
- Day 4-5: Audio integration
- Day 6-7: UI animations
- Day 8-9: Accessibility, controller
- Day 10: Final testing, bug fixes

---

## 13. Technical Specifications

### Performance Targets

| Metric | Target |
|--------|--------|
| Frame rate | 60 FPS stable |
| Load time | <3s initial, <1s between floors |
| Memory | <200MB |
| Bundle size | <10MB (excluding audio) |

### Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

### Save Data Structure

```typescript
interface SaveData {
  version: string;
  progression: PlayerProgression;
  settings: GameSettings;
  statistics: GameStatistics;
  achievements: Achievement[];
  lastPlayed: number;
}
```

### Build Configuration

```typescript
// vite.config.ts
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
          rotjs: ['rot-js']
        }
      }
    }
  }
});
```

---

## Next Steps

1. **Confirm scope** — Review this plan, flag any changes
2. **Set up repository** — Initialize project with Vite + Phaser + TS
3. **Asset audit** — Verify SGQ packs have everything needed
4. **Begin Phase 1** — TimeManager is the heart of the game

---

*Document version: 1.0*  
*Last updated: December 2025*  
*Ready to build the legend.*
