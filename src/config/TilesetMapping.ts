/**
 * Tileset Mapping
 * Frame index calculations for the 1-bit roguelike tileset
 *
 * Tileset: assets/The Roguelike 1-Bit Alpha.png
 * Dimensions: 1408 x 624 pixels (88 columns x 39 rows at 16x16)
 */

// =============================================================================
// TILESET CONSTANTS
// =============================================================================

export const TILESET = {
  KEY: 'tileset-1bit',
  COLUMNS: 88,
  ROWS: 39,
  TILE_SIZE: 16,
} as const;

// =============================================================================
// PALETTE DEFINITIONS
// =============================================================================

export enum TilesetPalette {
  WHITE = 'white',
  BLUE = 'blue',
  TEAL = 'teal',
  MAGENTA = 'magenta',
  YELLOW = 'yellow',
  ORANGE = 'orange',
}

/**
 * Maps floor number to palette
 * Floor 6+ uses ORANGE as the final palette before bonus
 */
export const FLOOR_PALETTE_MAP: Record<number, TilesetPalette> = {
  1: TilesetPalette.WHITE,
  2: TilesetPalette.BLUE,
  3: TilesetPalette.TEAL,
  4: TilesetPalette.MAGENTA,
  5: TilesetPalette.YELLOW,
  6: TilesetPalette.ORANGE,
};

/**
 * Column offset for Fantasy theme section in each palette
 * The tileset alternates: Ancient Greece | Fantasy for each color
 * These offsets point to the START of the Fantasy section
 */
export const PALETTE_COLUMN_OFFSET: Record<TilesetPalette, number> = {
  [TilesetPalette.WHITE]: 7,
  [TilesetPalette.BLUE]: 22,
  [TilesetPalette.TEAL]: 37,
  [TilesetPalette.MAGENTA]: 52,
  [TilesetPalette.YELLOW]: 67,
  [TilesetPalette.ORANGE]: 82,
};

// =============================================================================
// TILE TYPE ROW POSITIONS
// =============================================================================

/**
 * Row positions for different tile types within the Fantasy section
 * These are approximate and may need adjustment based on visual inspection
 */
export const TILE_ROWS = {
  // Terrain
  FLOOR_VARIANTS: [5, 6], // Rows containing floor tile variants
  WALL_TOP: 8,
  WALL_SIDE: 9,
  WALL_CORNER: 10,

  // Characters
  PLAYER: 14,
  ENEMY_SLIME: 16,
  ENEMY_BAT: 17,
  ENEMY_RAT: 18,

  // Items
  WEAPONS: 22,
  PICKUPS: 24,

  // UI
  HEARTS: 28,
  ICONS: 29,
} as const;

// =============================================================================
// FRAME MAPPING INTERFACES
// =============================================================================

export interface TileFrameSet {
  floors: number[];
  wallTop: number;
  wallBottom: number;
  wallLeft: number;
  wallRight: number;
  wallCornerTL: number;
  wallCornerTR: number;
  wallCornerBL: number;
  wallCornerBR: number;
  wallInnerTL: number;
  wallInnerTR: number;
  wallInnerBL: number;
  wallInnerBR: number;
  wallSingle: number;
}

export interface CharacterFrameSet {
  player: number[];
  slime: number[];
  bat: number[];
  rat: number[];
}

export interface ItemFrameSet {
  dagger: number;
  sword: number;
  hammer: number;
  heart: number;
  hourglass: number;
}

export interface UIFrameSet {
  heartFull: number;
  heartEmpty: number;
}

export interface PaletteFrameMapping {
  tiles: TileFrameSet;
  characters: CharacterFrameSet;
  items: ItemFrameSet;
  ui: UIFrameSet;
}

// =============================================================================
// FRAME CALCULATION HELPERS
// =============================================================================

/**
 * Calculate frame index from row and column
 */
export function calculateFrame(row: number, column: number): number {
  return row * TILESET.COLUMNS + column;
}

/**
 * Generate frame mapping for a specific palette
 */
export function generatePaletteFrames(palette: TilesetPalette): PaletteFrameMapping {
  const col = PALETTE_COLUMN_OFFSET[palette];

  return {
    tiles: {
      // Floor tiles - multiple variants for visual variety
      floors: [
        calculateFrame(TILE_ROWS.FLOOR_VARIANTS[0], col),
        calculateFrame(TILE_ROWS.FLOOR_VARIANTS[0], col + 1),
        calculateFrame(TILE_ROWS.FLOOR_VARIANTS[0], col + 2),
        calculateFrame(TILE_ROWS.FLOOR_VARIANTS[1], col),
        calculateFrame(TILE_ROWS.FLOOR_VARIANTS[1], col + 1),
      ],

      // Wall tiles - directional
      wallTop: calculateFrame(TILE_ROWS.WALL_TOP, col),
      wallBottom: calculateFrame(TILE_ROWS.WALL_TOP, col + 1),
      wallLeft: calculateFrame(TILE_ROWS.WALL_SIDE, col),
      wallRight: calculateFrame(TILE_ROWS.WALL_SIDE, col + 1),

      // Outer corners
      wallCornerTL: calculateFrame(TILE_ROWS.WALL_CORNER, col),
      wallCornerTR: calculateFrame(TILE_ROWS.WALL_CORNER, col + 1),
      wallCornerBL: calculateFrame(TILE_ROWS.WALL_CORNER, col + 2),
      wallCornerBR: calculateFrame(TILE_ROWS.WALL_CORNER, col + 3),

      // Inner corners (for L-shaped wall junctions)
      wallInnerTL: calculateFrame(TILE_ROWS.WALL_CORNER + 1, col),
      wallInnerTR: calculateFrame(TILE_ROWS.WALL_CORNER + 1, col + 1),
      wallInnerBL: calculateFrame(TILE_ROWS.WALL_CORNER + 1, col + 2),
      wallInnerBR: calculateFrame(TILE_ROWS.WALL_CORNER + 1, col + 3),

      // Single/isolated wall
      wallSingle: calculateFrame(TILE_ROWS.WALL_TOP, col + 2),
    },

    characters: {
      // Player animation frames
      player: [
        calculateFrame(TILE_ROWS.PLAYER, col),
        calculateFrame(TILE_ROWS.PLAYER, col + 1),
      ],

      // Enemy animation frames
      slime: [
        calculateFrame(TILE_ROWS.ENEMY_SLIME, col),
        calculateFrame(TILE_ROWS.ENEMY_SLIME, col + 1),
      ],
      bat: [
        calculateFrame(TILE_ROWS.ENEMY_BAT, col),
        calculateFrame(TILE_ROWS.ENEMY_BAT, col + 1),
      ],
      rat: [
        calculateFrame(TILE_ROWS.ENEMY_RAT, col),
        calculateFrame(TILE_ROWS.ENEMY_RAT, col + 1),
      ],
    },

    items: {
      dagger: calculateFrame(TILE_ROWS.WEAPONS, col),
      sword: calculateFrame(TILE_ROWS.WEAPONS, col + 1),
      hammer: calculateFrame(TILE_ROWS.WEAPONS, col + 2),
      heart: calculateFrame(TILE_ROWS.PICKUPS, col),
      hourglass: calculateFrame(TILE_ROWS.PICKUPS, col + 1),
    },

    ui: {
      heartFull: calculateFrame(TILE_ROWS.HEARTS, col),
      heartEmpty: calculateFrame(TILE_ROWS.HEARTS, col + 1),
    },
  };
}

// =============================================================================
// PRE-GENERATED PALETTE MAPPINGS
// =============================================================================

export const PALETTE_FRAMES: Record<TilesetPalette, PaletteFrameMapping> = {
  [TilesetPalette.WHITE]: generatePaletteFrames(TilesetPalette.WHITE),
  [TilesetPalette.BLUE]: generatePaletteFrames(TilesetPalette.BLUE),
  [TilesetPalette.TEAL]: generatePaletteFrames(TilesetPalette.TEAL),
  [TilesetPalette.MAGENTA]: generatePaletteFrames(TilesetPalette.MAGENTA),
  [TilesetPalette.YELLOW]: generatePaletteFrames(TilesetPalette.YELLOW),
  [TilesetPalette.ORANGE]: generatePaletteFrames(TilesetPalette.ORANGE),
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get palette for a given floor number
 */
export function getPaletteForFloor(floorNumber: number): TilesetPalette {
  return FLOOR_PALETTE_MAP[floorNumber] || TilesetPalette.ORANGE;
}

/**
 * Get frame mapping for a floor number
 */
export function getFrameMappingForFloor(floorNumber: number): PaletteFrameMapping {
  const palette = getPaletteForFloor(floorNumber);
  return PALETTE_FRAMES[palette];
}

/**
 * Get a random palette (for bonus floor mixed mode)
 */
export function getRandomPalette(): TilesetPalette {
  const palettes = Object.values(TilesetPalette);
  return palettes[Math.floor(Math.random() * palettes.length)];
}

/**
 * Get random frame mapping (for bonus floor)
 */
export function getRandomFrameMapping(): PaletteFrameMapping {
  return PALETTE_FRAMES[getRandomPalette()];
}

/**
 * Get all palettes as array
 */
export function getAllPalettes(): TilesetPalette[] {
  return Object.values(TilesetPalette);
}
