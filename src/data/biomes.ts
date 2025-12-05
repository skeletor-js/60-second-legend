/**
 * Biome Definitions
 * Defines the floor themes and their properties for 60 Second Legend
 */

export interface BiomePalette {
  primary: number;
  secondary: number;
  accent: number;
}

export interface EnemyModifier {
  speedMultiplier: number;
  healthMultiplier: number;
}

export interface BiomeDefinition {
  id: string;
  name: string;
  floors: number[];
  palette: BiomePalette;
  hazards: string[];
  enemyModifier: EnemyModifier;
}

/**
 * Verdant Ruins (Floors 1-2)
 * The overgrown entrance to the dungeon
 */
export const VERDANT_RUINS: BiomeDefinition = {
  id: 'verdant_ruins',
  name: 'Verdant Ruins',
  floors: [1, 2],
  palette: {
    primary: 0x2d5a27,
    secondary: 0x8bc34a,
    accent: 0x4caf50,
  },
  hazards: ['overgrowth'],
  enemyModifier: {
    speedMultiplier: 1.0,
    healthMultiplier: 1.0,
  },
};

/**
 * Frozen Archive (Floors 3-4)
 * Ice-covered halls with slippery floors
 */
export const FROZEN_ARCHIVE: BiomeDefinition = {
  id: 'frozen_archive',
  name: 'Frozen Archive',
  floors: [3, 4],
  palette: {
    primary: 0x4fc3f7,
    secondary: 0xe1f5fe,
    accent: 0x0288d1,
  },
  hazards: ['ice_tile'],
  enemyModifier: {
    speedMultiplier: 1.2,
    healthMultiplier: 1.0,
  },
};

/**
 * All biome definitions indexed by ID
 */
export const BIOME_DEFINITIONS: Record<string, BiomeDefinition> = {
  verdant_ruins: VERDANT_RUINS,
  frozen_archive: FROZEN_ARCHIVE,
};

/**
 * Gets the appropriate biome for a given floor number
 * @param floorNumber - The current floor number
 * @returns The biome definition for that floor, or Verdant Ruins as default
 */
export function getBiomeForFloor(floorNumber: number): BiomeDefinition {
  for (const biome of Object.values(BIOME_DEFINITIONS)) {
    if (biome.floors.includes(floorNumber)) {
      return biome;
    }
  }
  // Default to Verdant Ruins for floors outside defined ranges
  return VERDANT_RUINS;
}
