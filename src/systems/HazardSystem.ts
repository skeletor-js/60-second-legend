import { HAZARDS, GameEvents } from '@config/Constants';

/**
 * Hazard tile data
 */
export interface HazardTile {
  x: number;
  y: number;
  type: 'overgrowth' | 'ice_tile';
}

/**
 * Hazard effect data for events
 */
export interface HazardEffectData {
  hazardType: string;
  x: number;
  y: number;
  effect: string;
}

/**
 * HazardLogic
 * Pure logic class for managing hazard placement and effects.
 * No Phaser dependencies - fully testable.
 */
export class HazardLogic {
  private hazardTiles: Map<string, HazardTile>;
  private playerPosition: { x: number; y: number } | null;
  private currentHazard: HazardTile | null;
  private listeners: Map<string, Set<(...args: unknown[]) => void>>;

  constructor() {
    this.hazardTiles = new Map();
    this.playerPosition = null;
    this.currentHazard = null;
    this.listeners = new Map();
  }

  /**
   * Places hazards on floor tiles based on biome hazard types
   * @param tiles - 2D array of dungeon tiles (0 = wall, 1 = floor)
   * @param hazardTypes - Array of hazard type IDs for this biome
   */
  placeHazards(tiles: number[][], hazardTypes: string[]): void {
    this.hazardTiles.clear();

    // Get all floor tile positions
    const floorTiles: Array<{ x: number; y: number }> = [];
    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[y].length; x++) {
        if (tiles[y][x] === 1) {
          floorTiles.push({ x, y });
        }
      }
    }

    // Place each hazard type
    hazardTypes.forEach((hazardType) => {
      this.placeHazardType(floorTiles, hazardType);
    });
  }

  /**
   * Places a specific hazard type on random floor tiles
   */
  private placeHazardType(
    floorTiles: Array<{ x: number; y: number }>,
    hazardType: string
  ): void {
    let spawnRate: number;
    let type: 'overgrowth' | 'ice_tile';

    if (hazardType === 'overgrowth') {
      spawnRate = HAZARDS.OVERGROWTH.spawnRate;
      type = 'overgrowth';
    } else if (hazardType === 'ice_tile') {
      spawnRate = HAZARDS.ICE_TILE.spawnRate;
      type = 'ice_tile';
    } else {
      return; // Unknown hazard type
    }

    // Randomly select floor tiles for hazards
    const shuffled = [...floorTiles].sort(() => Math.random() - 0.5);
    const hazardCount = Math.floor(floorTiles.length * spawnRate);

    for (let i = 0; i < hazardCount && i < shuffled.length; i++) {
      const { x, y } = shuffled[i];
      const key = `${x},${y}`;
      this.hazardTiles.set(key, { x, y, type });
    }
  }

  /**
   * Updates player position and checks for hazard interactions
   * @param x - Player x tile coordinate
   * @param y - Player y tile coordinate
   */
  updatePlayerPosition(x: number, y: number): void {
    const previousPosition = this.playerPosition;
    this.playerPosition = { x, y };

    const key = `${x},${y}`;
    const hazard = this.hazardTiles.get(key);

    // Check if entering a new hazard
    if (hazard && hazard !== this.currentHazard) {
      this.currentHazard = hazard;
      this.emit(GameEvents.HAZARD_ENTERED, {
        hazardType: hazard.type,
        x: hazard.x,
        y: hazard.y,
      });
      this.applyHazardEffect(hazard);
    }
    // Check if exiting a hazard
    else if (!hazard && this.currentHazard && previousPosition) {
      const previousKey = `${previousPosition.x},${previousPosition.y}`;
      const previousHazard = this.hazardTiles.get(previousKey);
      if (previousHazard) {
        this.emit(GameEvents.HAZARD_EXITED, {
          hazardType: this.currentHazard.type,
          x: this.currentHazard.x,
          y: this.currentHazard.y,
        });
      }
      this.currentHazard = null;
    }
  }

  /**
   * Applies the effect of a hazard (emits event with effect data)
   */
  private applyHazardEffect(hazard: HazardTile): void {
    let effect: string;

    if (hazard.type === 'overgrowth') {
      effect = `slow_${HAZARDS.OVERGROWTH.slowMultiplier}`;
    } else if (hazard.type === 'ice_tile') {
      effect = `slide_${HAZARDS.ICE_TILE.slideDistance}`;
    } else {
      return;
    }

    this.emit(GameEvents.HAZARD_EFFECT_APPLIED, {
      hazardType: hazard.type,
      x: hazard.x,
      y: hazard.y,
      effect,
    });
  }

  /**
   * Gets all hazard tiles
   */
  getHazardTiles(): HazardTile[] {
    return Array.from(this.hazardTiles.values());
  }

  /**
   * Gets the hazard at a specific tile position
   */
  getHazardAt(x: number, y: number): HazardTile | undefined {
    const key = `${x},${y}`;
    return this.hazardTiles.get(key);
  }

  /**
   * Gets the current hazard the player is standing on
   */
  getCurrentHazard(): HazardTile | null {
    return this.currentHazard;
  }

  /**
   * Checks if a tile position has a hazard
   */
  hasHazard(x: number, y: number): boolean {
    const key = `${x},${y}`;
    return this.hazardTiles.has(key);
  }

  /**
   * Gets the movement speed multiplier for the current hazard
   * Returns 1.0 if no hazard or hazard doesn't affect speed
   */
  getSpeedMultiplier(): number {
    if (!this.currentHazard) {
      return 1.0;
    }

    if (this.currentHazard.type === 'overgrowth') {
      return HAZARDS.OVERGROWTH.slowMultiplier;
    }

    return 1.0;
  }

  // Event emitter methods

  on(event: string, callback: (...args: unknown[]) => void): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return this;
  }

  off(event: string, callback: (...args: unknown[]) => void): this {
    this.listeners.get(event)?.delete(callback);
    return this;
  }

  private emit(event: string, ...args: unknown[]): boolean {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(...args));
      return true;
    }
    return false;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
    return this;
  }
}

/**
 * HazardSystem
 * Phaser-integrated hazard manager.
 * Handles hazard visualization and player interaction.
 */
export class HazardSystem {
  private logic: HazardLogic;
  private scene: Phaser.Scene;
  private hazardSprites: Map<string, Phaser.GameObjects.Rectangle>;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.logic = new HazardLogic();
    this.hazardSprites = new Map();

    // Forward logic events to Phaser scene events
    this.logic.on(GameEvents.HAZARD_ENTERED, (data) => {
      this.scene.events.emit(GameEvents.HAZARD_ENTERED, data);
    });

    this.logic.on(GameEvents.HAZARD_EXITED, (data) => {
      this.scene.events.emit(GameEvents.HAZARD_EXITED, data);
    });

    this.logic.on(GameEvents.HAZARD_EFFECT_APPLIED, (data) => {
      this.scene.events.emit(GameEvents.HAZARD_EFFECT_APPLIED, data);
    });
  }

  /**
   * Places hazards and creates visual representations
   * @param tiles - 2D array of dungeon tiles
   * @param hazardTypes - Array of hazard type IDs
   * @param tileSize - Size of each tile in pixels (default: 16)
   */
  placeHazards(tiles: number[][], hazardTypes: string[], tileSize: number = 16): void {
    // Clear existing hazard visuals
    this.clearHazardSprites();

    // Place hazards in logic
    this.logic.placeHazards(tiles, hazardTypes);

    // Create visual representations
    const hazards = this.logic.getHazardTiles();
    hazards.forEach((hazard) => {
      const x = hazard.x * tileSize + tileSize / 2;
      const y = hazard.y * tileSize + tileSize / 2;

      // Create a colored rectangle to represent the hazard
      const rect = this.scene.add.rectangle(x, y, tileSize, tileSize);

      // Set color based on hazard type
      if (hazard.type === 'overgrowth') {
        rect.setFillStyle(HAZARDS.OVERGROWTH.tint, 0.3);
      } else if (hazard.type === 'ice_tile') {
        rect.setFillStyle(HAZARDS.ICE_TILE.tint, 0.3);
      }

      rect.setDepth(0); // Below player and enemies

      const key = `${hazard.x},${hazard.y}`;
      this.hazardSprites.set(key, rect);
    });
  }

  /**
   * Updates player position for hazard interaction
   * @param tileX - Player x tile coordinate
   * @param tileY - Player y tile coordinate
   */
  updatePlayerPosition(tileX: number, tileY: number): void {
    this.logic.updatePlayerPosition(tileX, tileY);
  }

  /**
   * Gets all hazard tiles
   */
  getHazardTiles(): HazardTile[] {
    return this.logic.getHazardTiles();
  }

  /**
   * Gets the hazard at a specific tile position
   */
  getHazardAt(x: number, y: number): HazardTile | undefined {
    return this.logic.getHazardAt(x, y);
  }

  /**
   * Gets the current hazard the player is standing on
   */
  getCurrentHazard(): HazardTile | null {
    return this.logic.getCurrentHazard();
  }

  /**
   * Gets the movement speed multiplier for the current hazard
   */
  getSpeedMultiplier(): number {
    return this.logic.getSpeedMultiplier();
  }

  /**
   * Checks if a tile has a hazard
   */
  hasHazard(x: number, y: number): boolean {
    return this.logic.hasHazard(x, y);
  }

  /**
   * Clears all hazard sprites from the scene
   */
  private clearHazardSprites(): void {
    this.hazardSprites.forEach((sprite) => sprite.destroy());
    this.hazardSprites.clear();
  }

  /**
   * Destroys the hazard system and cleans up resources
   */
  destroy(): void {
    this.clearHazardSprites();
    this.logic.removeAllListeners();
  }
}
