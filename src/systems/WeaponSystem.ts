/**
 * WeaponSystem
 * Manages weapon stats, switching, combos, and attack logic
 * Implements testable logic with WeaponLogic and Phaser wrapper
 */

import Phaser from 'phaser';
import { WeaponDefinition, WeaponStats, WeaponCombo, ComboEffect, GameEvents } from '@config/Constants';

/**
 * Attack data interface
 */
export interface WeaponAttackData {
  x: number;
  y: number;
  direction: { x: number; y: number };
  range: number;
  damage: number;
  knockback: number;
  aoeRadius?: number;
}

/**
 * WeaponLogic - Pure logic class for testing
 * Handles weapon stats, cooldowns, and combo tracking
 */
export class WeaponLogic {
  private definition: WeaponDefinition;
  private cooldownRemaining: number = 0;
  private comboProgress: number = 0;
  private comboReady: boolean = false;

  constructor(definition: WeaponDefinition) {
    this.definition = definition;
  }

  /**
   * Get weapon stats
   */
  getStats(): WeaponStats {
    return this.definition.stats;
  }

  /**
   * Get weapon combo definition
   */
  getCombo(): WeaponCombo {
    return this.definition.combo;
  }

  /**
   * Check if attack is ready (no cooldown)
   */
  canAttack(): boolean {
    return this.cooldownRemaining <= 0;
  }

  /**
   * Start an attack
   * Returns WeaponAttackData if successful, null if on cooldown
   */
  startAttack(
    x: number,
    y: number,
    direction: { x: number; y: number }
  ): WeaponAttackData | null {
    if (!this.canAttack()) {
      return null;
    }

    this.cooldownRemaining = this.definition.stats.attackSpeed;

    // Calculate damage (apply combo multiplier if ready)
    let damage = this.definition.stats.damage;
    if (this.comboReady && this.definition.combo.effect.type === 'damage_multiplier') {
      damage *= this.definition.combo.effect.value;
      this.resetCombo();
    }

    return {
      x,
      y,
      direction,
      range: this.definition.stats.range,
      damage,
      knockback: this.definition.stats.knockback,
      aoeRadius: this.definition.stats.aoeRadius,
    };
  }

  /**
   * Update cooldown timer
   */
  update(delta: number): void {
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining = Math.max(0, this.cooldownRemaining - delta);
    }
  }

  /**
   * Record a hit (for combo tracking)
   */
  recordHit(wasKill: boolean): void {
    const requirement = this.definition.combo.requirement;

    switch (requirement.type) {
      case 'hits_without_damage':
        // Any hit counts
        this.comboProgress++;
        break;

      case 'kills_without_damage':
        // Only kills count
        if (wasKill) {
          this.comboProgress++;
        }
        break;

      case 'multi_kills':
        // This is handled separately via recordMultiKill
        break;
    }

    this.checkComboActivation();
  }

  /**
   * Record a multi-kill (2+ enemies killed in one attack)
   */
  recordMultiKill(killCount: number): void {
    const requirement = this.definition.combo.requirement;

    if (requirement.type === 'multi_kills' && killCount >= 2) {
      this.comboProgress++;
      this.checkComboActivation();
    }
  }

  /**
   * Called when player takes damage (resets combo progress)
   */
  onPlayerDamaged(): void {
    this.resetCombo();
  }

  /**
   * Check if combo requirement is met
   */
  private checkComboActivation(): void {
    const requirement = this.definition.combo.requirement;
    if (this.comboProgress >= requirement.count) {
      this.comboReady = true;
    }
  }

  /**
   * Reset combo progress
   */
  private resetCombo(): void {
    this.comboProgress = 0;
    this.comboReady = false;
  }

  /**
   * Check if combo is ready to activate
   */
  isComboReady(): boolean {
    return this.comboReady;
  }

  /**
   * Get current combo progress
   */
  getComboProgress(): number {
    return this.comboProgress;
  }

  /**
   * Get combo effect (for external systems to apply)
   */
  getComboEffect(): ComboEffect | null {
    if (!this.comboReady) {
      return null;
    }
    return this.definition.combo.effect;
  }

  /**
   * Manually consume combo (for external effects like heal)
   */
  consumeCombo(): void {
    this.resetCombo();
  }

  /**
   * Get time reward for hit/kill
   */
  getTimeReward(wasKill: boolean): number {
    if (wasKill) {
      return this.definition.stats.timePerKill;
    }
    return this.definition.stats.timePerHit;
  }
}

/**
 * WeaponSystem - Phaser wrapper
 * Manages weapon switching and integrates with game systems
 */
export class WeaponSystem {
  private scene: Phaser.Scene;
  private weapons: Map<string, WeaponLogic> = new Map();
  private currentWeapon: WeaponLogic;
  private weaponKeys: string[] = [];

  constructor(scene: Phaser.Scene, weaponDefinitions: Record<string, WeaponDefinition>) {
    this.scene = scene;

    // Initialize all weapons
    for (const [key, definition] of Object.entries(weaponDefinitions)) {
      const weaponLogic = new WeaponLogic(definition);
      this.weapons.set(key, weaponLogic);
      this.weaponKeys.push(key);
    }

    // Default to first weapon
    const firstKey = this.weaponKeys[0];
    this.currentWeapon = this.weapons.get(firstKey)!;

    // Set up weapon switching input
    this.setupInput();
  }

  /**
   * Set up keyboard input for weapon switching
   */
  private setupInput(): void {
    if (!this.scene.input.keyboard) return;

    // 1, 2, 3 keys for weapon switching
    this.scene.input.keyboard.on('keydown-ONE', () => this.switchWeapon(0));
    this.scene.input.keyboard.on('keydown-TWO', () => this.switchWeapon(1));
    this.scene.input.keyboard.on('keydown-THREE', () => this.switchWeapon(2));
  }

  /**
   * Switch to weapon at given index
   */
  switchWeapon(index: number): void {
    if (index < 0 || index >= this.weaponKeys.length) {
      return;
    }

    const key = this.weaponKeys[index];
    const weapon = this.weapons.get(key);

    if (weapon && weapon !== this.currentWeapon) {
      this.currentWeapon = weapon;

      // Emit weapon switched event
      this.scene.events.emit(GameEvents.WEAPON_SWITCHED, {
        weaponName: weapon.getStats().name,
        weaponIndex: index,
      });
    }
  }

  /**
   * Get current weapon
   */
  getCurrentWeapon(): WeaponLogic {
    return this.currentWeapon;
  }

  /**
   * Update weapon system (handle cooldowns)
   */
  update(deltaTime: number): void {
    // Update all weapons (for cooldowns)
    this.weapons.forEach((weapon) => {
      weapon.update(deltaTime);
    });
  }

  /**
   * Process player attack with current weapon
   */
  attack(x: number, y: number, direction: { x: number; y: number }): WeaponAttackData | null {
    const attackData = this.currentWeapon.startAttack(x, y, direction);

    if (attackData) {
      // Check for combo effects that trigger on attack
      const comboEffect = this.currentWeapon.getComboEffect();
      if (comboEffect && comboEffect.type === 'damage_multiplier') {
        // Damage multiplier is already applied in startAttack
        this.scene.events.emit(GameEvents.WEAPON_COMBO_ACTIVATED, {
          weaponName: this.currentWeapon.getStats().name,
          comboName: this.currentWeapon.getCombo().name,
          effect: comboEffect,
        });
      }
    }

    return attackData;
  }

  /**
   * Record a hit for combo tracking
   */
  recordHit(wasKill: boolean): void {
    this.currentWeapon.recordHit(wasKill);

    // Emit combo ready event if combo just became ready
    if (this.currentWeapon.isComboReady()) {
      this.scene.events.emit(GameEvents.WEAPON_COMBO_READY, {
        weaponName: this.currentWeapon.getStats().name,
        comboName: this.currentWeapon.getCombo().name,
      });
    }
  }

  /**
   * Record a multi-kill for combo tracking
   */
  recordMultiKill(killCount: number): void {
    this.currentWeapon.recordMultiKill(killCount);

    // Emit combo ready event if combo just became ready
    if (this.currentWeapon.isComboReady()) {
      this.scene.events.emit(GameEvents.WEAPON_COMBO_READY, {
        weaponName: this.currentWeapon.getStats().name,
        comboName: this.currentWeapon.getCombo().name,
      });
    }
  }

  /**
   * Called when player takes damage
   */
  onPlayerDamaged(): void {
    this.currentWeapon.onPlayerDamaged();
  }

  /**
   * Check if current weapon can attack
   */
  canAttack(): boolean {
    return this.currentWeapon.canAttack();
  }

  /**
   * Get the weapon logic instance (for testing)
   */
  getWeaponLogic(key: string): WeaponLogic | undefined {
    return this.weapons.get(key);
  }
}
