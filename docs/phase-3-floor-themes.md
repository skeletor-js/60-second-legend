# Phase 3: Floor Themes & Hazards

> Distinct biomes with unique mechanics and visual identity

## Overview

Phase 3 introduces the floor theme system, giving each section of the dungeon a unique visual style and gameplay hazards. The MVP includes 2 biomes with their signature hazard types.

---

## What Was Implemented

### 1. Floor Theme System

**File Created:**
- `src/systems/FloorThemeSystem.ts`

**Features:**
- Theme selection based on floor number
- Color palette management (primary, secondary, accent colors)
- Enemy modifier calculation per biome
- Hazard type determination

### 2. Hazard System

**File Created:**
- `src/systems/HazardSystem.ts`

**Features:**
- Hazard placement on floor tiles
- Player position tracking for hazard effects
- Speed multiplier calculation
- Event emission (HAZARD_ENTERED, HAZARD_EXITED, HAZARD_EFFECT_APPLIED)

### 3. Biome Definitions

**File Created:**
- `src/data/biomes.ts`

**Two Biomes Implemented:**

#### Verdant Ruins (Floors 1-2)
| Property | Value |
|----------|-------|
| Palette | Greens (0x2D5A27, 0x8BC34A, 0x4CAF50) |
| Hazard | Overgrowth |
| Enemy Modifier | Normal speed, normal health |
| Ambience | "Shattered remnants of the Tree's garden" |

**Overgrowth Hazard:**
- Spawns on 15% of floor tiles
- Slows player to 70% movement speed
- Visual: Green tinted tiles

#### Frozen Archive (Floors 3-4)
| Property | Value |
|----------|-------|
| Palette | Blues (0x4FC3F7, 0xE1F5FE, 0x0288D1) |
| Hazard | Ice Tiles |
| Enemy Modifier | 20% faster enemies |
| Ambience | "The kingdom's frozen library of memories" |

**Ice Tile Hazard:**
- Spawns on 25% of floor tiles
- Causes player to slide 2 tiles in movement direction
- Visual: Blue/white tinted tiles

---

## Files Modified

- `src/config/Constants.ts` - Added BIOMES and HAZARDS constants
- `src/systems/DungeonGenerator.ts` - Added floorNumber parameter
- `src/systems/index.ts` - Exported new systems

---

## Test Coverage

- `src/systems/__tests__/FloorThemeSystem.test.ts` - 23 tests
- `src/systems/__tests__/HazardSystem.test.ts` - 26 tests

**Total: 49 new tests**

---

## What to Test & Confirm

### Floor Theme System

- [ ] **Floor 1-2 should be Verdant Ruins**
  - Green color palette applied to environment
  - Overgrowth hazards spawn on floor tiles
  - Enemies have normal speed

- [ ] **Floor 3-4 should be Frozen Archive**
  - Blue/ice color palette applied
  - Ice tile hazards spawn
  - Enemies move 20% faster

### Hazard Testing

- [ ] **Overgrowth (Verdant Ruins)**
  - Walking on overgrowth tiles slows movement
  - Movement speed returns to normal when exiting
  - ~15% of floor tiles have overgrowth

- [ ] **Ice Tiles (Frozen Archive)**
  - Walking on ice causes sliding
  - Player slides 2 tiles in movement direction
  - ~25% of floor tiles are ice

### Visual Testing

- [ ] Floor tiles have appropriate color tinting
- [ ] Hazard tiles are visually distinct
- [ ] Palette changes when transitioning floors

### Known Limitations

1. Currently only 2 of 5 planned biomes
2. Biome visuals use tinting (not unique tilesets)
3. Floor progression not fully implemented (starts at floor 1)
4. Ice slide mechanic needs GameScene physics integration

---

## Integration Notes

To use the floor theme system in GameScene:

```typescript
// Initialize with current floor
this.floorThemeSystem = new FloorThemeSystem(this, this.currentFloor);

// Get biome info
const biome = this.floorThemeSystem.getCurrentBiome();
const palette = this.floorThemeSystem.getPalette();

// Place hazards
const hazardTypes = this.floorThemeSystem.getHazardTypes();
this.hazardSystem.placeHazards(dungeon.tiles, hazardTypes, TILE_SIZE);

// Apply enemy modifiers
const enemyMod = this.floorThemeSystem.getEnemyModifier();
// Multiply enemy speed by enemyMod.speedMultiplier

// In update loop
this.hazardSystem.updatePlayerPosition(playerTileX, playerTileY);
const speedMult = this.hazardSystem.getSpeedMultiplier();
```

---

## Constants Reference

```typescript
BIOMES: {
  VERDANT_RUINS: {
    id: 'verdant_ruins',
    name: 'Verdant Ruins',
    floors: [1, 2],
    palette: { primary: 0x2d5a27, secondary: 0x8bc34a, accent: 0x4caf50 },
    hazards: ['overgrowth'],
    enemyModifier: { speedMultiplier: 1.0, healthMultiplier: 1.0 },
  },
  FROZEN_ARCHIVE: {
    id: 'frozen_archive',
    name: 'Frozen Archive',
    floors: [3, 4],
    palette: { primary: 0x4fc3f7, secondary: 0xe1f5fe, accent: 0x0288d1 },
    hazards: ['ice_tile'],
    enemyModifier: { speedMultiplier: 1.2, healthMultiplier: 1.0 },
  },
}

HAZARDS: {
  OVERGROWTH: { slowMultiplier: 0.7, spawnRate: 0.15 },
  ICE_TILE: { slideDistance: 2, spawnRate: 0.25 },
}
```

---

## Next Steps (Future Iteration)

1. Implement remaining 3 biomes (Ember Depths, Void Sanctum, Shadow Throne)
2. Add more hazard types (lava, eruption vents, gravity wells)
3. Create unique tilesets per biome
4. Implement weapon synergies per biome
5. Add ambient audio per biome
6. Implement floor progression/transitions
