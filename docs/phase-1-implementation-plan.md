# 60 Second Legend - Phase 1 Implementation Plan

> **Status:** Complete ✅
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
- [x] Step 0: Test Infrastructure (Vitest + Phaser mocks)
- [x] Step 1: Core Systems (TimeManager, DungeonGenerator, Player)
- [x] Step 2: Enemies & UI (Enemy base, Slime, HUD)
- [x] Step 3: Integration (CombatSystem, GameScene refactor)

### Bug Fixes (User Testing Round)
- [x] Fixed tilemap texture error (`Texture key "tiles" not found`)
- [x] Fixed HUD not following camera (`setScrollFactor(0)`)
- [x] Fixed Slime texture key mismatch (`slime` → `enemy-slime`)
- [x] Added heart sprite for health display (using `ui-icons-16`)
- [x] Added player facing direction for attacks
- [x] Changed attack key from SPACE to L
- [x] Rewrote tilemap to use actual SGQ sprites (`tileset-walls`, `tileset-grounds`)
- [x] Fixed wall collision (proper `setCollision()` setup)
- [x] Added attack visual with weapon sprite

### Test Results
- **165 tests passing** across 8 test files
- **Build succeeds** with no TypeScript errors

---

## Execution Steps

### Step 0: Test Infrastructure ✅
**Status:** Complete

Files created:
```
├── vitest.config.ts
├── src/test/
│   ├── setup.ts
│   └── mocks/
│       └── phaser.ts
└── package.json (vitest devDependency added)
```

Tasks:
- [x] Install vitest, @vitest/coverage-v8, happy-dom
- [x] Configure vitest.config.ts for TypeScript and path aliases
- [x] Create Phaser mock utilities for testing
- [x] Add npm scripts: `test`, `test:watch`, `test:coverage`
- [x] Verify test setup with a simple passing test

---

### Step 1: Core Systems (Parallel - 3 Agents) ✅
**Status:** Complete

#### Agent A: TimeManager ✅
Files:
- `src/systems/__tests__/TimeManager.test.ts` - 30 tests
- `src/systems/TimeManager.ts`

Test Cases:
- [x] Initializes with BASE_TIME (60s)
- [x] Ticks down at DRAIN_RATE (1s/sec)
- [x] Extends time correctly (capped at MAX_TIME)
- [x] Emits TIME_WARNING at 30s threshold
- [x] Emits TIME_CRITICAL at 10s threshold
- [x] Emits TIME_EXPIRED at 0s
- [x] Supports pause/resume
- [x] Tracks recent extensions for UI popups

Implementation:
- [x] Extract time logic from existing GameScene
- [x] Implement TimeConfig interface
- [x] Add event emission via custom EventEmitter
- [x] Support drain rate modification

---

#### Agent B: DungeonGenerator ✅
Files:
- `src/systems/__tests__/DungeonGenerator.test.ts` - 16 tests
- `src/systems/DungeonGenerator.ts`

Test Cases:
- [x] Generates dungeon of specified dimensions (60x40)
- [x] Creates reasonable number of rooms (3-15)
- [x] Places ENTRANCE room
- [x] Places EXIT room
- [x] All rooms are connected
- [x] Returns valid tile data for tilemap
- [x] Rooms have correct types (COMBAT, TREASURE, etc.)

Implementation:
- [x] Integrate rot.js Map.Digger
- [x] Define Room interface with bounds, type, connections
- [x] Define DungeonConfig interface
- [x] Extract rooms from rot.js output
- [x] Assign room types (entrance, combat, exit)
- [x] Generate corridor connections
- [x] Output tilemap-compatible data

---

#### Agent C: Player Entity ✅
Files:
- `src/entities/__tests__/Player.test.ts` - 28 tests
- `src/entities/Player.ts`

Test Cases:
- [x] Initializes with correct health (5 HP)
- [x] Moves in 8 directions
- [x] Movement speed is 80 pixels/sec (5 tiles/sec)
- [x] Takes damage correctly
- [x] Has i-frames after damage (0.5s)
- [x] Dies at 0 HP
- [x] Can attack (basic melee)

Implementation:
- [x] PlayerLogic class (pure logic, testable)
- [x] Player class extending Phaser.Physics.Arcade.Sprite
- [x] 8-directional velocity calculation
- [x] Health management with events
- [x] I-frame system with visual feedback

---

### Step 2: Enemies & UI (Parallel - 2 Agents) ✅
**Status:** Complete

#### Agent D: Enemy System ✅
Files:
- `src/entities/__tests__/Enemy.test.ts` - 23 tests
- `src/entities/Enemy.ts`
- `src/entities/enemies/Slime.ts`

Test Cases:
- [x] Enemy initializes with correct stats
- [x] Chase AI moves toward player
- [x] Enemy takes damage
- [x] Enemy dies at 0 HP
- [x] Death emits ENEMY_KILLED event
- [x] Slime has correct stats (low HP, slow, simple AI)

Implementation:
- [x] EnemyLogic class (pure logic, testable)
- [x] Enemy class extending Phaser.Physics.Arcade.Sprite
- [x] EnemyConfig interface for stats
- [x] Simple chase AI using distance-based movement
- [x] Death sequence with event emission
- [x] Slime subclass with specific stats (2 HP, 30 speed, 1 damage, +3s reward)

---

#### Agent E: HUD System ✅
Files:
- `src/ui/__tests__/HUD.test.ts` - 24 tests
- `src/ui/HUD.ts`

Test Cases:
- [x] Displays current time (MM:SS format)
- [x] Updates time color at thresholds (green → yellow → red)
- [x] Displays health hearts
- [x] Updates hearts when player damaged
- [x] Shows time extension popups
- [x] Popups fade out after duration

Implementation:
- [x] HUDLogic class (pure logic, testable)
- [x] HUD container with fixed camera position
- [x] Timer text with color transitions
- [x] Heart sprites for health display
- [x] Popup system for +time notifications
- [x] Subscribe to TimeManager events

---

### Step 3: Combat & Integration (Parallel - 2 Agents) ✅
**Status:** Complete

#### Agent F: CombatSystem ✅
Files:
- `src/systems/__tests__/CombatSystem.test.ts` - 27 tests
- `src/systems/CombatSystem.ts`

Test Cases:
- [x] Player attack creates hitbox
- [x] Attack has correct range (24 pixels)
- [x] Enemy receives damage from attack (3 damage)
- [x] Kill triggers time extension (+3s)
- [x] Knockback pushes enemy away (150 force)
- [x] Attack has cooldown (0.4s)

Implementation:
- [x] CombatLogic class (pure logic, testable)
- [x] CombatSystem class (Phaser wrapper)
- [x] Attack hitbox creation and range detection
- [x] Damage calculation (Memory Blade: 3 damage)
- [x] Knockback physics
- [x] Time extension on kill via TimeManager

---

#### Agent G: GameScene Integration ✅
Files:
- `src/scenes/__tests__/GameScene.test.ts` - 14 tests
- `src/scenes/GameScene.ts` (refactored)

Test Cases:
- [x] Scene initializes all systems
- [x] Dungeon generates on create
- [x] Player spawns at entrance
- [x] Enemies spawn in combat rooms
- [x] Camera follows player
- [x] Room clear grants +8s bonus
- [x] Game over triggers at TIME_EXPIRED

Implementation:
- [x] Remove inline timer logic (use TimeManager)
- [x] Initialize DungeonGenerator, TimeManager, CombatSystem
- [x] Create tilemap from dungeon data
- [x] Spawn Player at entrance room
- [x] Spawn enemies based on room type
- [x] Configure camera follow
- [x] Wire up all event listeners

---

## Phase 1 Completion Checklist

When Phase 1 is complete, the game should:

- [x] Start with 60 seconds on the timer
- [x] Generate a medium dungeon (60x40, ~10-12 rooms)
- [x] Spawn player at entrance room
- [x] Allow real-time 8-directional movement
- [x] Display health hearts and timer in HUD
- [x] Spawn slime enemies in combat rooms
- [x] Enable basic melee attack (Memory Blade)
- [x] Kill enemies → +3s time extension
- [x] Clear room → +8s bonus
- [x] Timer reaches 0 → Game Over
- [x] All tests passing (165 tests)

---

## Technical Reference

### Key Files (Implemented)
- `src/config/Constants.ts` - All game balance values
- `src/config/GameConfig.ts` - Phaser configuration
- `src/config/AssetManifest.ts` - Asset definitions
- `src/systems/TimeManager.ts` - Time management system
- `src/systems/DungeonGenerator.ts` - Procedural dungeon generation
- `src/systems/CombatSystem.ts` - Combat and damage handling
- `src/entities/Player.ts` - Player entity with movement and health
- `src/entities/Enemy.ts` - Base enemy class
- `src/entities/enemies/Slime.ts` - Slime enemy variant
- `src/ui/HUD.ts` - Heads-up display
- `src/scenes/GameScene.ts` - Main game scene (refactored)

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

COMBAT: {
  MEMORY_BLADE_DAMAGE: 3,
  ATTACK_COOLDOWN: 0.4,
  ATTACK_RANGE: 24,
  KNOCKBACK_FORCE: 150,
}
```

### Event Architecture
GameEvents enum used for system communication:
- TIME_TICK, TIME_EXTENDED, TIME_WARNING, TIME_CRITICAL, TIME_EXPIRED
- ENEMY_DAMAGED, ENEMY_KILLED, PLAYER_DAMAGED
- ROOM_ENTERED, ROOM_CLEARED, ROOM_PERFECT

---

## Commands

```bash
npm run dev       # Start development server
npm test          # Run all tests (165 tests)
npm run build     # Production build
npm test:watch    # Watch mode for tests
npm test:coverage # Coverage report
```

---

## Controls

| Key | Action |
|-----|--------|
| Arrow Keys | Move (8-directional) |
| L | Attack (Memory Blade) |
| ESC | Pause/Resume |
| SPACE | Start game / Retry after game over |

---

## Notes

- All systems implemented with TDD approach
- Pure logic classes (PlayerLogic, EnemyLogic, etc.) for testability
- rot.js integrated for dungeon generation
- Path aliases configured: @systems, @entities, @ui, @config, etc.
- All SGQ sprites loaded and ready to use (walls, floors, enemies, weapons, UI)
- Tilesets loaded as spritesheets for proper tile extraction
- Audio will be sourced during Phase 2 (placeholder/free assets)

---

## Known Bugs (Active Debugging)

### Bug 1: Player Spawns in Walls
**Status:** Under investigation
**Symptom:** Player sometimes spawns inside a wall tile and cannot move.

### Bug 2: Invisible Wall Halfway Down Screen
**Status:** Under investigation
**Symptom:** Player hits an invisible collision barrier approximately halfway down the screen, regardless of horizontal position. The floor tiles are visible but the player cannot pass.

---

## Debugging Configuration

Debug logging is enabled in `GameScene.ts`. Open browser console (F12) when playing to see:

### Console Output on Game Start:
```
=== DUNGEON DEBUG ===
Dimensions: 60x40 (2400 total tiles)
Floor tiles: XXX (XX.X%)
Wall tiles: XXX (XX.X%)
Rooms: XX
Entrance room: {id, x, y, width, height, centerX, centerY, type, connections}
Entrance room center tile value: 1 (should be 1 for floor)
Entrance room bounds: XX floors, XX walls

=== SPAWN DEBUG ===
Entrance room: {...}
Spawn position (tile): {x: XX, y: XX}
Spawn position (pixel): {x: XXX, y: XXX}
Tile at spawn: 1 (should be 1 for floor)
3x3 area around spawn:
...  (. = floor, # = wall)
...
...

=== COLLISION LAYER DEBUG ===
Wall layer dimensions: 60 x 40
Tilemap dimensions: 60 x 40
Tiles with collision enabled: XXXX
Expected wall tiles: XXXX (these should match!)

=== PLAYER BODY DEBUG ===
Body size: 12 x 12
Body offset: 2, 2
World bounds: XXX x XXX
```

### Console Output During Gameplay:
```
[Frame 60] Player pos: (XXX.X, XXX.X) | Tile: (XX, XX) = FLOOR | Blocked: L=false R=false U=false D=false
BLOCKED! Pos: (XXX.X, XXX.X) | Tile: (XX, XX) | L=true R=false U=false D=false
```

### Key Things to Check:
1. **"Tiles with collision enabled" vs "Expected wall tiles"** - These MUST match. If collision tiles > expected walls, there's a collision layer bug.
2. **"Tile at spawn"** - Must be 1 (floor). If 0, player spawns in wall.
3. **"3x3 area around spawn"** - Should be all dots (floors). If any #, player hitbox overlaps wall.
4. **"BLOCKED!" messages** - Check tile position when blocked. If tile = FLOOR but blocked = true, collision layer is wrong.

### Attempted Fixes (Not Working):
1. Changed `setCollisionByExclusion([-1])` to `setCollision([1])` - Should only collide with tile ID 1
2. Added `isWalkableArea()` to check 3x3 area around spawn position
3. Added `updateRoomFloorCenters()` to find actual floor tile for room centers
4. Increased `dugPercentage` from 0.2 to 0.4 for more floor tiles
5. Added 12.5% minimum floor coverage validation

### Files Modified for Debugging:
- `src/scenes/GameScene.ts` - Added debug logging in create(), createTilemap(), and updateDebugOverlay()
- `src/systems/DungeonGenerator.ts` - Added updateRoomFloorCenters() and findFloorCenter()

### To Reproduce:
1. Run `npm run dev`
2. Open http://localhost:3000
3. Press F12 to open browser console
4. Click "Start Game"
5. Copy/paste the console output to diagnose issues
