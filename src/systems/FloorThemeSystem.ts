import { BiomeDefinition, getBiomeForFloor, BiomePalette, EnemyModifier } from '../data/biomes';

/**
 * FloorThemeLogic
 * Pure logic class for managing floor themes and biomes.
 * No Phaser dependencies - fully testable.
 */
export class FloorThemeLogic {
  private currentFloor: number;
  private currentBiome: BiomeDefinition;

  constructor(initialFloor: number = 1) {
    this.currentFloor = initialFloor;
    this.currentBiome = getBiomeForFloor(initialFloor);
  }

  /**
   * Sets the current floor number and updates the biome
   * @param floorNumber - The new floor number
   */
  setFloor(floorNumber: number): void {
    this.currentFloor = floorNumber;
    this.currentBiome = getBiomeForFloor(floorNumber);
  }

  /**
   * Gets the current floor number
   */
  getCurrentFloor(): number {
    return this.currentFloor;
  }

  /**
   * Gets the current biome definition
   */
  getCurrentBiome(): BiomeDefinition {
    return this.currentBiome;
  }

  /**
   * Gets the color palette for the current biome
   */
  getPalette(): BiomePalette {
    return this.currentBiome.palette;
  }

  /**
   * Gets the hazard types for the current biome
   */
  getHazardTypes(): string[] {
    return [...this.currentBiome.hazards];
  }

  /**
   * Gets the enemy modifiers for the current biome
   */
  getEnemyModifier(): EnemyModifier {
    return { ...this.currentBiome.enemyModifier };
  }

  /**
   * Gets the biome name
   */
  getBiomeName(): string {
    return this.currentBiome.name;
  }

  /**
   * Gets the biome ID
   */
  getBiomeId(): string {
    return this.currentBiome.id;
  }
}

/**
 * FloorThemeSystem
 * Phaser-integrated floor theme manager.
 * Handles applying visual theming to game objects.
 */
export class FloorThemeSystem {
  private logic: FloorThemeLogic;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, initialFloor: number = 1) {
    this.scene = scene;
    this.logic = new FloorThemeLogic(initialFloor);
  }

  /**
   * Sets the current floor and updates theming
   * @param floorNumber - The new floor number
   */
  setFloor(floorNumber: number): void {
    this.logic.setFloor(floorNumber);
  }

  /**
   * Gets the current floor number
   */
  getCurrentFloor(): number {
    return this.logic.getCurrentFloor();
  }

  /**
   * Gets the current biome definition
   */
  getCurrentBiome(): BiomeDefinition {
    return this.logic.getCurrentBiome();
  }

  /**
   * Gets the color palette for the current biome
   */
  getPalette(): BiomePalette {
    return this.logic.getPalette();
  }

  /**
   * Gets the hazard types for the current biome
   */
  getHazardTypes(): string[] {
    return this.logic.getHazardTypes();
  }

  /**
   * Gets the enemy modifiers for the current biome
   */
  getEnemyModifier(): EnemyModifier {
    return this.logic.getEnemyModifier();
  }

  /**
   * Gets the biome name
   */
  getBiomeName(): string {
    return this.logic.getBiomeName();
  }

  /**
   * Gets the biome ID
   */
  getBiomeId(): string {
    return this.logic.getBiomeId();
  }

  /**
   * Applies theme tinting to a sprite or image
   * @param gameObject - The Phaser game object to tint
   * @param tintType - Which color from the palette to use (default: primary)
   */
  applyTint(
    gameObject: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image,
    tintType: 'primary' | 'secondary' | 'accent' = 'primary'
  ): void {
    const palette = this.getPalette();
    const tintColor = palette[tintType];
    gameObject.setTint(tintColor);
  }

  /**
   * Removes tinting from a game object
   * @param gameObject - The Phaser game object to clear
   */
  clearTint(gameObject: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image): void {
    gameObject.clearTint();
  }

  /**
   * Applies theme tinting to an array of game objects
   * @param gameObjects - Array of game objects to tint
   * @param tintType - Which color from the palette to use
   */
  applyTintToArray(
    gameObjects: Array<Phaser.GameObjects.Sprite | Phaser.GameObjects.Image>,
    tintType: 'primary' | 'secondary' | 'accent' = 'primary'
  ): void {
    gameObjects.forEach((obj) => this.applyTint(obj, tintType));
  }
}
