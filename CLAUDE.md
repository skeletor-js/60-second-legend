# CLAUDE.md - AI Assistant Guide for 60 Second Legend

> A time-loop roguelike built with Phaser 3, TypeScript, and rot.js

## Quick Reference

```bash
npm run dev          # Start development server (http://localhost:5173)
npm test             # Run tests (170 tests)
npm run build        # Production build
npm run test:watch   # Watch mode for TDD
npm run test:coverage # Coverage report
```

## Project Overview

**60 Second Legend** is a time-loop roguelike where players navigate procedurally generated dungeons under constant time pressure. The core mechanic: every kill extends the clock (+3s), every hesitation drains it.

### Current Status: Phase 2 Complete

- 450+ passing tests
- Three weapons: Swift Daggers (ranged), Memory Blade, Shatter Hammer (AOE)
- Three enemy types: Slime, Bat (projectile), Rat (pack behavior)
- Projectile system for player and enemies
- Kill streak bonuses (+2s to +20s)
- Manual dash/dodge with i-frames
- Continuous enemy respawning

### Game Controls

| Key | Action |
|-----|--------|
| Arrow Keys / WASD | Move (8-directional) |
| L | Attack |
| M | Dash/Dodge |
| 1 | Swift Daggers (fires projectile) |
| 2 | Memory Blade (default) |
| 3 | Shatter Hammer (AOE) |
| P / ESC | Pause/Resume |

## Tech Stack

- **Phaser 3.80+** - Game engine (rendering, input, physics)
- **TypeScript 5.x** - Type safety
- **rot.js 2.2** - Roguelike toolkit (dungeon generation)
- **Vite 5.x** - Build tool and dev server
- **Vitest 4.x** - Test runner

## Project Structure

```
60-second-legend/
├── src/
│   ├── main.ts                    # Entry point - creates Phaser game
│   ├── config/
│   │   ├── GameConfig.ts          # Phaser configuration (320x180, 4x scale)
│   │   ├── Constants.ts           # ALL game balance values and events
│   │   └── AssetManifest.ts       # Asset definitions and keys
│   ├── scenes/
│   │   ├── BootScene.ts           # Asset preloading with progress bar
│   │   ├── MenuScene.ts           # Main menu
│   │   └── GameScene.ts           # Main gameplay loop
│   ├── systems/
│   │   ├── TimeManager.ts         # Core time mechanic (event emitter)
│   │   ├── DungeonGenerator.ts    # rot.js integration (60x40 tiles)
│   │   ├── CombatSystem.ts        # Weapons and damage
│   │   ├── WeaponSystem.ts        # Weapon management and stats
│   │   ├── CombatMechanics.ts     # Kill streaks, combos, dodges
│   │   └── index.ts               # Barrel export
│   ├── entities/
│   │   ├── Player.ts              # PlayerLogic + Phaser sprite
│   │   ├── Enemy.ts               # EnemyLogic + Phaser sprite base
│   │   ├── Projectile.ts          # Player and enemy projectiles
│   │   ├── enemies/
│   │   │   ├── Slime.ts           # Slime enemy (chase)
│   │   │   ├── Bat.ts             # Bat enemy (charge/retreat, projectile)
│   │   │   └── Rat.ts             # Rat enemy (pack behavior)
│   │   └── weapons/
│   │       ├── SwiftDaggers.ts    # Fast, ranged weapon
│   │       ├── MemoryBlade.ts     # Balanced melee weapon
│   │       └── ShatterHammer.ts   # Slow AOE weapon
│   ├── ui/
│   │   └── HUD.ts                 # Timer, health, popups
│   └── test/
│       ├── setup.ts               # Vitest setup
│       └── mocks/
│           └── phaser.ts          # Phaser mocks for unit tests
├── assets/
│   ├── SGQ_Dungeon/               # Main sprite pack
│   │   ├── characters/            # Player and enemy sprites
│   │   ├── grounds_and_walls/     # Tileset sprites
│   │   └── weapons_and_projectiles/
│   ├── SGQ_Enemies/               # Additional enemy sprites
│   └── SGQ_ui/                    # UI elements and icons
├── docs/
│   ├── 60-second-legend-implementation-plan.md  # Full game design
│   └── phase-1-implementation-plan.md           # Phase 1 details
└── public/
    └── index.html
```

## Architecture Patterns

### 1. Logic/Sprite Separation

All game entities use a two-class pattern for testability:

```typescript
// Pure logic class - fully testable, no Phaser dependencies
export class PlayerLogic {
  private health: number;
  calculateVelocity(inputX: number, inputY: number): { x: number; y: number };
  takeDamage(amount: number): boolean;
  update(deltaTime: number): void;
}

// Phaser wrapper - handles rendering and physics
export class Player extends Phaser.Physics.Arcade.Sprite {
  private logic: PlayerLogic;
  handleMovement(inputX: number, inputY: number): void;
  // Delegates to logic, adds visual effects
}
```

### 2. Event-Driven Communication

Systems communicate via events defined in `GameEvents` enum:

```typescript
// In Constants.ts
export enum GameEvents {
  TIME_TICK = 'time:tick',
  TIME_EXTENDED = 'time:extended',
  TIME_WARNING = 'time:warning',      // At 30s
  TIME_CRITICAL = 'time:critical',    // At 10s
  TIME_EXPIRED = 'time:expired',
  ENEMY_KILLED = 'combat:enemy_killed',
  PLAYER_DAMAGED = 'combat:player_damaged',
  ROOM_CLEARED = 'room:cleared',
  // ... more events
}

// Usage
timeManager.on(GameEvents.TIME_WARNING, (data) => {
  // Handle warning state
});
```

### 3. Centralized Constants

ALL game balance values are in `src/config/Constants.ts`:

```typescript
// Time settings
TIME.BASE_TIME = 60;           // Starting seconds
TIME.MAX_TIME = 120;           // Maximum cap
TIME.WARNING_THRESHOLD = 30;   // Yellow warning
TIME.CRITICAL_THRESHOLD = 10;  // Red critical

// Time extensions
TIME_EXTENSIONS.ENEMY_KILL = 3;
TIME_EXTENSIONS.ROOM_CLEARED = 8;

// Player settings
PLAYER.MAX_HEALTH = 5;
PLAYER.MOVE_SPEED = 5;         // Tiles per second
PLAYER.I_FRAME_DURATION = 0.5; // Seconds

// Combat
COMBAT.MEMORY_BLADE_DAMAGE = 3;
COMBAT.ATTACK_COOLDOWN = 0.4;
COMBAT.ATTACK_RANGE = 24;      // Pixels
```

## Path Aliases

Configured in both `tsconfig.json` and `vitest.config.ts`:

```typescript
import { TimeManager } from '@systems/TimeManager';
import { Player } from '@entities/Player';
import { PLAYER, TIME } from '@config/Constants';
import { HUD } from '@ui/HUD';
```

Available aliases:
- `@/*` → `src/*`
- `@config/*` → `src/config/*`
- `@scenes/*` → `src/scenes/*`
- `@systems/*` → `src/systems/*`
- `@entities/*` → `src/entities/*`
- `@ui/*` → `src/ui/*`
- `@utils/*` → `src/utils/*`

## Testing Strategy

### TDD Approach
All code follows Test-Driven Development:
1. Write failing test first
2. Write minimal code to pass
3. Refactor while keeping tests green

### Test Structure
Tests are colocated with source code in `__tests__/` directories:

```
src/systems/
├── TimeManager.ts
├── __tests__/
│   └── TimeManager.test.ts
```

### Testing Pure Logic
Use the `*Logic` classes for unit tests (no Phaser mocking needed):

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { PlayerLogic } from '../Player';

describe('PlayerLogic', () => {
  let player: PlayerLogic;

  beforeEach(() => {
    player = new PlayerLogic({
      maxHealth: 5,
      moveSpeed: 80,
      iFrameDuration: 0.5,
    });
  });

  it('should calculate normalized diagonal velocity', () => {
    const velocity = player.calculateVelocity(1, 1);
    const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
    expect(speed).toBeCloseTo(80);
  });
});
```

### Phaser Mocking
For Phaser-dependent tests, mocks are in `src/test/mocks/phaser.ts`.

## Key Files Reference

### Game Balance
- `src/config/Constants.ts:10-21` - Time settings
- `src/config/Constants.ts:27-46` - Time extension values
- `src/config/Constants.ts:67-76` - Player stats
- `src/config/Constants.ts:82-103` - Combat values

### Core Systems
- `src/systems/TimeManager.ts` - Time countdown and events
- `src/systems/DungeonGenerator.ts` - rot.js dungeon generation
- `src/systems/CombatSystem.ts` - Attack handling and damage

### Main Game Loop
- `src/scenes/GameScene.ts` - Primary gameplay scene

## Display Settings

```typescript
DISPLAY.WIDTH = 320;     // Game width in pixels
DISPLAY.HEIGHT = 180;    // Game height in pixels
DISPLAY.SCALE = 4;       // Pixel scale factor
DISPLAY.TILE_SIZE = 16;  // Tile size in pixels
```

Actual window size: 1280x720 (320x4, 180x4)

## Dungeon Generation

Uses rot.js `Map.Digger` for procedural generation:

```typescript
const dungeon = new DungeonGenerator();
const data = dungeon.generate({
  width: 60,
  height: 40,
  roomCount: { min: 8, max: 12 },
});
// Returns: tiles[][], rooms[], corridors
```

Room types: `ENTRANCE`, `COMBAT`, `TREASURE`, `SECRET`, `BOSS`, `EXIT`

## Development Phases

- [x] **Phase 1: Foundation** - Playable dungeon with timer (COMPLETE)
- [x] **Phase 2: Combat** - Weapons, combos, enemy variety (COMPLETE)
- [ ] **Phase 3: Floor Themes** - 5 biomes with hazards
- [ ] **Phase 4: Relics** - Build variety through relic system
- [ ] **Phase 5: The Shadow** - Corruption and pursuer mechanics
- [ ] **Phase 6: Meta** - Between-run upgrades
- [ ] **Phase 7: Polish** - Juice, audio, accessibility

## Known Issues

1. **Player Spawn in Walls** - Occasionally player spawns inside wall tiles
2. **Invisible Wall Bug** - Collision barrier appears mid-screen in some dungeons

Debug logging is enabled in `GameScene.ts` - check browser console (F12) for diagnostic output.

## Coding Conventions

### TypeScript
- Strict mode enabled (`strict: true` in tsconfig)
- No unused locals or parameters
- Use `as const` for constant objects
- Prefer interfaces over type aliases for objects

### Naming
- Classes: PascalCase (`TimeManager`, `PlayerLogic`)
- Methods/functions: camelCase (`getTimeRemaining`, `calculateVelocity`)
- Constants: SCREAMING_SNAKE_CASE (`BASE_TIME`, `MAX_HEALTH`)
- Events: prefixed and namespaced (`time:tick`, `combat:enemy_killed`)

### File Organization
- One class per file (exception: Logic + Sprite pair)
- Barrel exports via `index.ts` when needed
- Tests colocated in `__tests__/` directories

### Comments
- Use JSDoc for public methods
- Section headers with `// ===` for Constants.ts

## Asset Keys

Sprites are loaded in `BootScene.ts`. Common keys:

```typescript
// Player
'player'              // Main character sprite

// Enemies
'enemy-slime'         // Slime enemy

// Tiles
'tileset-walls'       // Wall tileset
'tileset-grounds'     // Floor tileset

// UI
'ui-icons-16'         // 16x16 icons (hearts, etc.)
'weapon-blade'        // Memory Blade weapon sprite
```

## Adding New Features

### New Enemy Type
1. Create `src/entities/enemies/NewEnemy.ts`
2. Extend `EnemyLogic` for game logic
3. Extend `Enemy` for Phaser sprite
4. Add to spawn logic in `GameScene.ts`
5. Write tests in `src/entities/__tests__/`

### New System
1. Create `src/systems/NewSystem.ts`
2. Use event emitter pattern for communication
3. Add to `src/systems/index.ts` barrel export
4. Initialize in `GameScene.create()`
5. Write tests with pure logic

### New Game Event
1. Add to `GameEvents` enum in `Constants.ts`
2. Document in event consumer
3. Emit with appropriate data shape
