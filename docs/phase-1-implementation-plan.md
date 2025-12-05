# 60 Second Legend - Phase 1 Implementation Plan

> **Status:** In Progress
> **Last Updated:** December 4, 2025
> **Goal:** Playable dungeon navigation with working time mechanic

---

## Development Approach: Test-Driven Development (TDD)

All implementation follows TDD principles:
1. **Red** - Write failing tests first
2. **Green** - Write minimal code to pass tests
3. **Refactor** - Clean up while keeping tests green

### Testing Strategy
- **Vitest** for fast, Vite-native test runner
- **Pure logic tests** for systems (TimeManager, DungeonGenerator, CombatSystem)
- **Lighter testing** for Phaser-dependent code (focus on behavior, not rendering)
- Tests colocated with source: `__tests__/` directories

---

## User Decisions

| Question | Answer |
|----------|--------|
| Movement Style | **Real-time smooth movement** (action roguelike) |
| TDD Testing Scope | **Pure logic tests**, lighter Phaser testing |
| Dungeon Size | **Medium: 60x40 tiles** (~10-12 rooms) |
| Audio | **Source placeholder/free audio** during implementation |

---

## Current Progress

### Completed
- [x] Project scaffolding (Vite + Phaser 3 + TypeScript)
- [x] Asset loading pipeline with SGQ asset packs
- [x] BootScene (loading screen with progress bar)
- [x] MenuScene (main menu with animations)
- [x] GameConfig.ts (Phaser configuration)
- [x] Constants.ts (game balance values, events, thresholds)
- [x] AssetManifest.ts (sprite sheet and image references)
- [x] Basic timer display in GameScene (inline)

### In Progress
- [ ] Step 0: Test Infrastructure

### Not Started
- [ ] Step 1: Core Systems (TimeManager, DungeonGenerator, Player)
- [ ] Step 2: Enemies & UI (Enemy base, Slime, HUD)
- [ ] Step 3: Integration (CombatSystem, GameScene refactor)

---

## Execution Steps

### Step 0: Test Infrastructure ⏳
**Status:** Not Started
**Must complete before parallel work begins**

Files to create:
```
├── vitest.config.ts
├── src/test/
│   ├── setup.ts
│   └── mocks/
│       └── phaser.ts
└── package.json (add vitest devDependency)
```

Tasks:
- [ ] Install vitest, @vitest/coverage-v8, happy-dom
- [ ] Configure vitest.config.ts for TypeScript and path aliases
- [ ] Create Phaser mock utilities for testing
- [ ] Add npm scripts: `test`, `test:watch`, `test:coverage`
- [ ] Verify test setup with a simple passing test

---

### Step 1: Core Systems (Parallel - 3 Agents)
**Status:** Not Started
**Dependencies:** Step 0 complete

#### Agent A: TimeManager
Files:
- `src/systems/__tests__/TimeManager.test.ts` (write first)
- `src/systems/TimeManager.ts`

Test Cases:
- [ ] Initializes with BASE_TIME (60s)
- [ ] Ticks down at DRAIN_RATE (1s/sec)
- [ ] Extends time correctly (capped at MAX_TIME)
- [ ] Emits TIME_WARNING at 30s threshold
- [ ] Emits TIME_CRITICAL at 10s threshold
- [ ] Emits TIME_EXPIRED at 0s
- [ ] Supports pause/resume
- [ ] Tracks recent extensions for UI popups

Implementation:
- [ ] Extract time logic from existing GameScene
- [ ] Implement TimeConfig interface
- [ ] Add event emission via Phaser EventEmitter
- [ ] Support drain rate modification

---

#### Agent B: DungeonGenerator
Files:
- `src/systems/__tests__/DungeonGenerator.test.ts` (write first)
- `src/systems/DungeonGenerator.ts`

Test Cases:
- [ ] Generates dungeon of specified dimensions (60x40)
- [ ] Creates 10-12 rooms
- [ ] Places ENTRANCE room
- [ ] Places EXIT room
- [ ] All rooms are connected
- [ ] Returns valid tile data for tilemap
- [ ] Rooms have correct types (COMBAT, TREASURE, etc.)

Implementation:
- [ ] Integrate rot.js Map.Digger
- [ ] Define Room interface with bounds, type, connections
- [ ] Define DungeonConfig interface
- [ ] Extract rooms from rot.js output
- [ ] Assign room types (entrance, combat, exit)
- [ ] Generate corridor connections
- [ ] Output tilemap-compatible data

---

#### Agent C: Player Entity
Files:
- `src/entities/__tests__/Player.test.ts` (write first)
- `src/entities/Player.ts`

Test Cases:
- [ ] Initializes with correct health (5 HP)
- [ ] Moves in 8 directions
- [ ] Movement speed is 80 pixels/sec (5 tiles/sec)
- [ ] Cannot move through walls (collision)
- [ ] Takes damage correctly
- [ ] Has i-frames after damage (0.5s)
- [ ] Dies at 0 HP
- [ ] Can attack (basic melee)

Implementation:
- [ ] Extend Phaser.Physics.Arcade.Sprite
- [ ] WASD + Arrow key input handling
- [ ] 8-directional velocity calculation
- [ ] Health management with events
- [ ] I-frame system with visual feedback
- [ ] Basic attack trigger (SPACE or click)
- [ ] Animation state machine (idle, walk, attack, hurt)

---

### Step 2: Enemies & UI (Parallel - 2 Agents)
**Status:** Not Started
**Dependencies:** Step 1 complete (needs Player for collision reference)

#### Agent D: Enemy System
Files:
- `src/entities/__tests__/Enemy.test.ts` (write first)
- `src/entities/Enemy.ts`
- `src/entities/enemies/Slime.ts`

Test Cases:
- [ ] Enemy initializes with correct stats
- [ ] Chase AI moves toward player
- [ ] Enemy takes damage
- [ ] Enemy dies at 0 HP
- [ ] Death emits ENEMY_KILLED event
- [ ] Slime has correct stats (low HP, slow, simple AI)

Implementation:
- [ ] Base Enemy class extending Phaser.Physics.Arcade.Sprite
- [ ] EnemyConfig interface for stats
- [ ] Simple chase AI using distance-based pathfinding
- [ ] Death sequence with event emission
- [ ] Slime subclass with specific stats

---

#### Agent E: HUD System
Files:
- `src/ui/__tests__/HUD.test.ts` (write first)
- `src/ui/HUD.ts`

Test Cases:
- [ ] Displays current time
- [ ] Updates time color at thresholds (green → yellow → red)
- [ ] Displays health hearts
- [ ] Updates hearts when player damaged
- [ ] Shows time extension popups
- [ ] Popups fade out after duration

Implementation:
- [ ] HUD container with fixed camera position
- [ ] Timer text with color transitions
- [ ] Heart sprites for health display
- [ ] Popup system for +time notifications
- [ ] Subscribe to TimeManager and Player events

---

### Step 3: Combat & Integration (Parallel - 2 Agents)
**Status:** Not Started
**Dependencies:** Step 2 complete

#### Agent F: CombatSystem
Files:
- `src/systems/__tests__/CombatSystem.test.ts` (write first)
- `src/systems/CombatSystem.ts`

Test Cases:
- [ ] Player attack creates hitbox
- [ ] Hitbox detects enemy collision
- [ ] Enemy receives damage from attack
- [ ] Kill triggers time extension (+3s)
- [ ] Knockback pushes enemy away
- [ ] Attack has cooldown

Implementation:
- [ ] Attack hitbox creation and detection
- [ ] Damage calculation (Memory Blade: 3 damage)
- [ ] Knockback physics
- [ ] Time extension on kill via TimeManager
- [ ] Attack animation sync

---

#### Agent G: GameScene Integration
Files:
- `src/scenes/__tests__/GameScene.test.ts` (write first)
- `src/scenes/GameScene.ts` (refactor)

Test Cases:
- [ ] Scene initializes all systems
- [ ] Dungeon generates on create
- [ ] Player spawns at entrance
- [ ] Enemies spawn in combat rooms
- [ ] Camera follows player
- [ ] Room detection works
- [ ] Room clear grants +8s bonus
- [ ] Game over triggers at TIME_EXPIRED

Implementation:
- [ ] Remove inline timer logic (use TimeManager)
- [ ] Initialize DungeonGenerator, TimeManager, CombatSystem
- [ ] Create tilemap from dungeon data
- [ ] Spawn Player at entrance room
- [ ] Spawn enemies based on room type
- [ ] Configure camera follow
- [ ] Room tracking and clear detection
- [ ] Wire up all event listeners

---

## Phase 1 Completion Checklist

When Phase 1 is complete, the game should:

- [ ] Start with 60 seconds on the timer
- [ ] Generate a medium dungeon (60x40, ~10-12 rooms)
- [ ] Spawn player at entrance room
- [ ] Allow real-time 8-directional movement
- [ ] Display health hearts and timer in HUD
- [ ] Spawn slime enemies in combat rooms
- [ ] Enable basic melee attack (Memory Blade)
- [ ] Kill enemies → +3s time extension
- [ ] Clear room → +8s bonus
- [ ] Timer reaches 0 → Game Over
- [ ] All tests passing

---

## Technical Reference

### Key Files (Existing)
- `src/config/Constants.ts` - All game balance values
- `src/config/GameConfig.ts` - Phaser configuration
- `src/config/AssetManifest.ts` - Asset definitions
- `src/scenes/GameScene.ts` - Main scene (to be refactored)

### Key Constants (from Constants.ts)
```typescript
TIME: {
  BASE_TIME: 60,
  MAX_TIME: 120,
  WARNING_THRESHOLD: 30,
  CRITICAL_THRESHOLD: 10,
  DRAIN_RATE: 1.0
}

TIME_EXTENSIONS: {
  ENEMY_KILL: 3,
  ROOM_CLEARED: 8,
  ROOM_PERFECT: 10,
  // ...
}

PLAYER: {
  MAX_HEALTH: 5,
  MOVE_SPEED: 5,  // tiles per second
  I_FRAME_DURATION: 0.5
}
```

### Event Architecture
GameEvents enum already defined - use for system communication:
- TIME_TICK, TIME_EXTENDED, TIME_WARNING, TIME_CRITICAL, TIME_EXPIRED
- ENEMY_DAMAGED, ENEMY_KILLED, PLAYER_DAMAGED
- ROOM_ENTERED, ROOM_CLEARED, ROOM_PERFECT

---

## Notes

- rot.js is installed but not yet used
- Path aliases configured: @systems, @entities, @ui, @config, etc.
- All SGQ sprites are loaded and ready to use
- Audio will be sourced during implementation (placeholder/free assets)
