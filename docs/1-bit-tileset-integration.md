# 1-Bit Roguelike Tileset Integration

> Documentation for the palette-based tileset system using "The Roguelike 1-Bit Alpha.png"

## Overview

This document explains the integration of the 1-bit roguelike tileset into 60 Second Legend. The tileset provides a cohesive visual style with multiple color palettes, enabling floor-based visual progression throughout the game.

### Tileset Specifications

| Property | Value |
|----------|-------|
| File | `assets/The Roguelike 1-Bit Alpha.png` |
| Dimensions | 1408 x 624 pixels |
| Tile Size | 16 x 16 pixels |
| Grid | 88 columns x 39 rows |
| Total Frames | 3,432 |
| Theme Used | Fantasy (columns ~7-21 per palette) |

---

## Palette System

The tileset contains 6 distinct color palettes, each occupying a horizontal section of approximately 22 columns. Only the Fantasy theme tiles are used (not Ancient Greece).

### Palette Progression

| Floor | Palette | Visual Style |
|-------|---------|--------------|
| 1 | White | Light/neutral starting area |
| 2 | Blue | Cool dungeon depths |
| 3 | Teal | Underwater/cave aesthetic |
| 4 | Magenta | Magical/corrupted zone |
| 5 | Yellow | Ancient/golden ruins |
| Bonus | Mixed | Random palette per tile |

### Frame Calculation

Frames are calculated using a simple formula:

```typescript
frameIndex = (row * 88) + column
```

Where:
- `row` = vertical position (0-38)
- `column` = horizontal position (0-87)
- `88` = total columns in tileset

---

## Architecture

### Key Files

| File | Purpose |
|------|---------|
| `src/config/TilesetMapping.ts` | Central palette/frame configuration |
| `src/systems/WallTileResolver.ts` | Wall edge detection logic |
| `src/systems/FloorThemeSystem.ts` | Floor-based palette management |
| `src/config/AssetManifest.ts` | Tileset loading definition |

### Data Flow

```
FloorThemeSystem
    │
    ▼ getPalette(floorNumber)
TilesetMapping.FLOOR_PALETTE_MAP
    │
    ▼ getFrameMapping()
PALETTE_FRAMES[palette]
    │
    ├──► Tiles (floors, walls)
    ├──► Characters (player, enemies)
    ├──► Items (weapons, pickups)
    └──► UI (hearts, icons)
```

---

## TilesetMapping.ts

This is the central configuration file for the tileset system.

### TilesetPalette Enum

```typescript
export enum TilesetPalette {
  WHITE = 'white',
  BLUE = 'blue',
  TEAL = 'teal',
  MAGENTA = 'magenta',
  YELLOW = 'yellow',
  ORANGE = 'orange',
}
```

### Floor-to-Palette Mapping

```typescript
export const FLOOR_PALETTE_MAP: Record<number, TilesetPalette> = {
  1: TilesetPalette.WHITE,
  2: TilesetPalette.BLUE,
  3: TilesetPalette.TEAL,
  4: TilesetPalette.MAGENTA,
  5: TilesetPalette.YELLOW,
  6: TilesetPalette.ORANGE, // Bonus floor default
};
```

### PaletteFrameMapping Interface

Each palette provides a complete set of frame indices:

```typescript
interface PaletteFrameMapping {
  tiles: {
    floors: number[];      // Floor tile variants
    walls: TileFrameSet;   // Wall tiles by edge type
  };
  characters: {
    player: number[];      // Player sprite frames
    slime: number[];       // Slime enemy frames
    bat: number[];         // Bat enemy frames
    rat: number[];         // Rat enemy frames
  };
  items: {
    weapons: number[];     // Weapon sprites
    pickups: number[];     // Pickup items
  };
  ui: {
    heartFull: number;     // Full heart icon
    heartEmpty: number;    // Empty heart icon
    icons: number[];       // Other UI icons
  };
}
```

### Accessing Frame Data

```typescript
import { PALETTE_FRAMES, TilesetPalette, TILESET } from '@config/TilesetMapping';

// Get white palette frames
const whiteFrames = PALETTE_FRAMES[TilesetPalette.WHITE];

// Get a floor tile frame
const floorFrame = whiteFrames.tiles.floors[0];

// Create sprite with frame
this.add.sprite(x, y, TILESET.KEY, floorFrame);
```

---

## Wall Edge Detection

The `WallTileResolver.ts` system determines which wall sprite to use based on neighboring tiles.

### Wall Types

```typescript
export enum WallType {
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right',
  CORNER_TL = 'corner_tl',
  CORNER_TR = 'corner_tr',
  CORNER_BL = 'corner_bl',
  CORNER_BR = 'corner_br',
  INNER_TL = 'inner_tl',
  INNER_TR = 'inner_tr',
  INNER_BL = 'inner_bl',
  INNER_BR = 'inner_br',
  SINGLE = 'single',
}
```

### Neighbor Analysis

The system checks 8 neighboring tiles to determine the correct wall sprite:

```typescript
interface TileNeighbors {
  n: boolean;   // North
  s: boolean;   // South
  e: boolean;   // East
  w: boolean;   // West
  ne: boolean;  // Northeast
  nw: boolean;  // Northwest
  se: boolean;  // Southeast
  sw: boolean;  // Southwest
}
```

### Usage in GameScene

```typescript
import { resolveWallType, getWallFrame, getNeighbors } from '@systems/WallTileResolver';

// In createTilemap():
const neighbors = getNeighbors(x, y, tiles, width, height);
const wallType = resolveWallType(neighbors);
const wallFrame = getWallFrame(wallType, frameMapping.tiles.walls);

this.add.sprite(worldX, worldY, TILESET.KEY, wallFrame);
```

---

## FloorThemeSystem Integration

The `FloorThemeSystem` manages palette selection based on the current floor.

### Key Methods

```typescript
class FloorThemeSystem {
  // Get the current palette for the floor
  getTilesetPalette(): TilesetPalette;

  // Get complete frame mapping for current palette
  getFrameMapping(): PaletteFrameMapping;

  // Get random palette frame mapping (for bonus floor)
  getRandomFrameMapping(): PaletteFrameMapping;

  // Check if current floor is bonus floor
  isBonusFloor(): boolean;

  // Set bonus floor state
  setBonusFloor(isBonus: boolean): void;
}
```

### Floor Transitions

When moving to a new floor, update entity sprites:

```typescript
// In GameScene after floor change:
const frameMapping = this.floorThemeSystem.getFrameMapping();

// Update player sprite
this.player.updateSprite(frameMapping);

// Update all enemies
this.enemies.forEach(enemy => enemy.updateSprite(frameMapping));
```

---

## Entity Sprite Updates

### Player

The Player class has an `updateSprite()` method:

```typescript
class Player {
  updateSprite(frameMapping: PaletteFrameMapping): void {
    const playerFrames = frameMapping.characters.player;
    if (playerFrames && playerFrames.length > 0) {
      this.currentFrame = playerFrames[0];
      this.setTexture(TILESET.KEY, this.currentFrame);
    }
  }
}
```

### Enemies

Each enemy type has an `enemyType` property used for sprite lookup:

```typescript
class Enemy {
  protected enemyType: EnemyType = 'slime';

  updateSprite(frameMapping: PaletteFrameMapping): void {
    const enemyFrames = frameMapping.characters[this.enemyType];
    if (enemyFrames && enemyFrames.length > 0) {
      this.setTexture(TILESET.KEY, enemyFrames[0]);
    }
  }
}
```

Enemy types: `'slime'`, `'bat'`, `'rat'`

---

## HUD Integration

The HUD uses white palette UI frames for consistency:

```typescript
class HUD {
  private createHealthDisplay(): void {
    const uiFrames = PALETTE_FRAMES[TilesetPalette.WHITE].ui;
    this.heartFullFrame = uiFrames.heartFull;
    this.heartEmptyFrame = uiFrames.heartEmpty;

    // Create heart sprites
    for (let i = 0; i < maxHealth; i++) {
      const heart = this.scene.add.sprite(
        x + i * spacing,
        y,
        TILESET.KEY,
        this.heartFullFrame
      );
      this.hearts.push(heart);
    }
  }
}
```

---

## Bonus Floor: Mixed Palettes

The bonus floor creates visual chaos by randomly selecting palettes:

```typescript
// In createTilemap() for bonus floor:
if (isBonusFloor) {
  // Each tile gets a random palette
  const randomMapping = this.floorThemeSystem.getRandomFrameMapping();
  const floorFrame = randomMapping.tiles.floors[
    Math.floor(Math.random() * randomMapping.tiles.floors.length)
  ];
  // ... create tile with random frame
}
```

This creates a visually distinct "ultimate" level with all colors mixed together.

---

## Modifying Frame Mappings

To adjust which sprites are used for different elements:

### 1. Identify Row/Column in Tileset

Open `The Roguelike 1-Bit Alpha.png` and find the sprite you want. Note its row (0-indexed from top) and column (0-indexed from left).

### 2. Calculate Frame Index

```typescript
const frame = row * 88 + column;
```

### 3. Update PALETTE_FRAMES

Edit `src/config/TilesetMapping.ts`:

```typescript
function generatePaletteFrames(
  palette: TilesetPalette
): PaletteFrameMapping {
  const offset = PALETTE_FANTASY_COLUMN_OFFSET[palette];

  return {
    tiles: {
      floors: [
        calculateFrame(2, offset + 0),  // Adjust row/column offsets
        calculateFrame(2, offset + 1),
        // Add more floor variants...
      ],
      // ...
    },
    // ...
  };
}
```

### 4. Test Changes

Run the game and verify sprites appear correctly:

```bash
npm run dev
```

---

## Troubleshooting

### Sprite Shows Wrong Image

1. Verify frame calculation: `frame = row * 88 + column`
2. Check palette column offset in `PALETTE_FANTASY_COLUMN_OFFSET`
3. Ensure using `TILESET.KEY` ('tileset-1bit') as texture key

### Wall Sprites Not Rendering Correctly

1. Check neighbor detection in `getNeighbors()`
2. Verify wall type resolution in `resolveWallType()`
3. Ensure wall frame set has all required wall types

### Tests Failing

Ensure mock sprites have required methods:

```typescript
// In src/test/mocks/phaser.ts
setTexture: vi.fn().mockReturnThis(),
setFrame: vi.fn().mockReturnThis(),
```

---

## File Reference

### Created Files

- `src/config/TilesetMapping.ts` - Palette and frame configuration
- `src/systems/WallTileResolver.ts` - Wall edge detection

### Modified Files

- `src/config/AssetManifest.ts` - Added tileset-1bit spritesheet
- `src/systems/FloorThemeSystem.ts` - Added palette methods
- `src/scenes/GameScene.ts` - Refactored createTilemap()
- `src/entities/Player.ts` - Added updateSprite()
- `src/entities/Enemy.ts` - Added enemyType, updateSprite()
- `src/entities/enemies/Slime.ts` - Set enemyType
- `src/entities/enemies/Bat.ts` - Set enemyType
- `src/entities/enemies/Rat.ts` - Set enemyType
- `src/ui/HUD.ts` - Updated heart sprites
- `src/test/mocks/phaser.ts` - Added sprite method mocks
