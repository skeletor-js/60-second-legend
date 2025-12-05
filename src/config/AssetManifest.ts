/**
 * Asset Manifest
 * Centralized asset definitions for loading
 */

export interface SpriteSheetConfig {
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
}

export interface ImageConfig {
  key: string;
  path: string;
}

export interface AudioConfig {
  key: string;
  path: string;
}

// =============================================================================
// SPRITE SHEETS
// =============================================================================

export const SPRITE_SHEETS: SpriteSheetConfig[] = [
  // Player
  {
    key: 'player',
    path: 'assets/SGQ_Dungeon/characters/main/elf.png',
    frameWidth: 16,
    frameHeight: 16,
  },

  // Enemies
  {
    key: 'enemy-bat',
    path: 'assets/SGQ_Dungeon/characters/enemies/bat.png',
    frameWidth: 16,
    frameHeight: 16,
  },
  {
    key: 'enemy-rat',
    path: 'assets/SGQ_Dungeon/characters/enemies/rat.png',
    frameWidth: 16,
    frameHeight: 16,
  },
  {
    key: 'enemy-slime',
    path: 'assets/SGQ_Dungeon/characters/enemies/slime.png',
    frameWidth: 16,
    frameHeight: 16,
  },

  // Props & Pickups
  {
    key: 'props',
    path: 'assets/SGQ_Dungeon/props/props.png',
    frameWidth: 16,
    frameHeight: 16,
  },
  {
    key: 'props-animated',
    path: 'assets/SGQ_Dungeon/props/animated_props.png',
    frameWidth: 16,
    frameHeight: 16,
  },
  {
    key: 'pickups',
    path: 'assets/SGQ_Dungeon/props/pickup_items_animated.png',
    frameWidth: 16,
    frameHeight: 16,
  },

  // Weapons & Projectiles
  {
    key: 'weapons',
    path: 'assets/SGQ_Dungeon/weapons_and_projectiles/weapons_animated.png',
    frameWidth: 16,
    frameHeight: 16,
  },
  {
    key: 'projectiles',
    path: 'assets/SGQ_Dungeon/weapons_and_projectiles/projectiles_animated.png',
    frameWidth: 16,
    frameHeight: 16,
  },

  // UI
  {
    key: 'ui-hud',
    path: 'assets/SGQ_ui/game_ui/hud.png',
    frameWidth: 16,
    frameHeight: 16,
  },
  {
    key: 'ui-icons-16',
    path: 'assets/SGQ_ui/game_ui/icons_16x16.png',
    frameWidth: 16,
    frameHeight: 16,
  },
  {
    key: 'ui-icons-8',
    path: 'assets/SGQ_ui/game_ui/icons_8x8.png',
    frameWidth: 8,
    frameHeight: 8,
  },
  {
    key: 'ui-elements',
    path: 'assets/SGQ_ui/game_ui/ui_elements.png',
    frameWidth: 16,
    frameHeight: 16,
  },
];

// =============================================================================
// IMAGES (non-animated)
// =============================================================================

export const IMAGES: ImageConfig[] = [
  // Tilesets
  { key: 'tileset-grounds', path: 'assets/SGQ_Dungeon/grounds_and_walls/grounds.png' },
  { key: 'tileset-surround', path: 'assets/SGQ_Dungeon/grounds_and_walls/surground.png' },
  { key: 'tileset-walls', path: 'assets/SGQ_Dungeon/grounds_and_walls/walls.png' },

  // UI
  { key: 'ui-inventory', path: 'assets/SGQ_ui/game_ui/inventory.png' },
  { key: 'ui-keyboard', path: 'assets/SGQ_ui/inputs/keyboard.png' },
  { key: 'ui-gamepad', path: 'assets/SGQ_ui/inputs/gamepad.png' },
];

// =============================================================================
// AUDIO
// =============================================================================

export const AUDIO: AudioConfig[] = [
  // Audio will be added later
];
