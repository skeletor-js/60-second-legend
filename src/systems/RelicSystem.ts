/**
 * Relic System
 * Manages equipped relics, cooldowns, and active ability triggers
 */

import { PLAYER, GameEvents } from '@config/Constants';
import { RelicDefinition, PassiveEffectType, ActiveEffectType } from '@data/relics';

export interface EquippedRelic {
  definition: RelicDefinition;
  currentCooldown: number; // Time remaining on cooldown
  activeCharges?: number; // For limited-use actives (like Combat Charm's 3 attacks)
  passiveState?: Record<string, unknown>; // Passive-specific state (e.g., regen timer)
}

/**
 * RelicLogic - Pure logic class
 * Handles relic state without Phaser dependencies
 */
export class RelicLogic {
  private equippedRelics: EquippedRelic[] = [];
  private maxRelics: number;

  constructor(maxRelics: number = PLAYER.MAX_RELICS) {
    this.maxRelics = maxRelics;
  }

  /**
   * Equip a relic
   * @returns true if successfully equipped, false if slots are full
   */
  equipRelic(relic: RelicDefinition): boolean {
    if (this.equippedRelics.length >= this.maxRelics) {
      return false;
    }

    const equipped: EquippedRelic = {
      definition: relic,
      currentCooldown: 0,
      passiveState: this.initializePassiveState(relic),
    };

    // Initialize active charges if needed
    if (relic.active.type === ActiveEffectType.DAMAGE_MULTIPLIER) {
      equipped.activeCharges = 0;
    }

    this.equippedRelics.push(equipped);
    return true;
  }

  /**
   * Initialize passive state for specific passives that need tracking
   */
  private initializePassiveState(relic: RelicDefinition): Record<string, unknown> {
    const state: Record<string, unknown> = {};

    if (relic.passive.type === PassiveEffectType.HEALTH_REGEN) {
      state.regenTimer = 0;
    }

    return state;
  }

  /**
   * Unequip a relic at the given index
   * @returns The unequipped relic, or undefined if index is invalid
   */
  unequipRelic(index: number): EquippedRelic | undefined {
    if (index < 0 || index >= this.equippedRelics.length) {
      return undefined;
    }

    return this.equippedRelics.splice(index, 1)[0];
  }

  /**
   * Replace a relic at the given index
   */
  replaceRelic(index: number, newRelic: RelicDefinition): boolean {
    if (index < 0 || index >= this.equippedRelics.length) {
      return false;
    }

    const equipped: EquippedRelic = {
      definition: newRelic,
      currentCooldown: 0,
      passiveState: this.initializePassiveState(newRelic),
    };

    if (newRelic.active.type === ActiveEffectType.DAMAGE_MULTIPLIER) {
      equipped.activeCharges = 0;
    }

    this.equippedRelics[index] = equipped;
    return true;
  }

  /**
   * Check if a relic's active ability is ready
   */
  isActiveReady(index: number): boolean {
    const relic = this.equippedRelics[index];
    return relic !== undefined && relic.currentCooldown <= 0;
  }

  /**
   * Use a relic's active ability
   * @returns The relic if successfully activated, undefined if on cooldown or invalid
   */
  useActive(index: number): EquippedRelic | undefined {
    if (!this.isActiveReady(index)) {
      return undefined;
    }

    const relic = this.equippedRelics[index];
    relic.currentCooldown = relic.definition.active.cooldown;

    // Initialize charges for certain actives
    if (relic.definition.active.type === ActiveEffectType.DAMAGE_MULTIPLIER) {
      relic.activeCharges = relic.definition.active.value;
    }

    return relic;
  }

  /**
   * Consume one charge from a relic (for limited-use actives)
   */
  consumeCharge(index: number): boolean {
    const relic = this.equippedRelics[index];
    if (!relic || relic.activeCharges === undefined || relic.activeCharges <= 0) {
      return false;
    }

    relic.activeCharges--;
    return true;
  }

  /**
   * Get remaining charges for a relic
   */
  getRemainingCharges(index: number): number {
    const relic = this.equippedRelics[index];
    return relic?.activeCharges ?? 0;
  }

  /**
   * Update cooldowns
   * @param deltaTime Time elapsed in seconds
   */
  updateCooldowns(deltaTime: number): void {
    for (const relic of this.equippedRelics) {
      if (relic.currentCooldown > 0) {
        relic.currentCooldown = Math.max(0, relic.currentCooldown - deltaTime);
      }
    }
  }

  /**
   * Update passive states (e.g., health regen timer)
   * @param deltaTime Time elapsed in seconds
   * @returns Array of passive effects that triggered this update
   */
  updatePassives(
    deltaTime: number
  ): Array<{ index: number; effect: PassiveEffectType; data: Record<string, unknown> }> {
    const triggered: Array<{ index: number; effect: PassiveEffectType; data: Record<string, unknown> }> = [];

    for (let i = 0; i < this.equippedRelics.length; i++) {
      const relic = this.equippedRelics[i];

      // Health regen passive
      if (relic.definition.passive.type === PassiveEffectType.HEALTH_REGEN) {
        const state = relic.passiveState as { regenTimer: number };
        state.regenTimer += deltaTime;

        if (state.regenTimer >= relic.definition.passive.value) {
          state.regenTimer = 0;
          triggered.push({
            index: i,
            effect: PassiveEffectType.HEALTH_REGEN,
            data: { amount: 1 },
          });
        }
      }
    }

    return triggered;
  }

  /**
   * Get all equipped relics
   */
  getEquippedRelics(): EquippedRelic[] {
    return [...this.equippedRelics];
  }

  /**
   * Get count of equipped relics
   */
  getEquippedCount(): number {
    return this.equippedRelics.length;
  }

  /**
   * Check if relic slots are full
   */
  isFull(): boolean {
    return this.equippedRelics.length >= this.maxRelics;
  }

  /**
   * Get max relic slots
   */
  getMaxRelics(): number {
    return this.maxRelics;
  }

  /**
   * Calculate total passive effect value of a specific type
   * Used for stat calculations (e.g., total movement speed bonus)
   */
  getTotalPassiveValue(effectType: PassiveEffectType): number {
    return this.equippedRelics.reduce((total, relic) => {
      if (relic.definition.passive.type === effectType) {
        return total + relic.definition.passive.value;
      }
      return total;
    }, 0);
  }

  /**
   * Check if player has a specific passive effect
   */
  hasPassive(effectType: PassiveEffectType): boolean {
    return this.equippedRelics.some((relic) => relic.definition.passive.type === effectType);
  }

  /**
   * Clear all relics (for testing or reset)
   */
  clearAll(): void {
    this.equippedRelics = [];
  }
}

/**
 * RelicSystem - Phaser wrapper
 * Handles event emission and integration with game systems
 */
export class RelicSystem {
  private logic: RelicLogic;
  private scene: Phaser.Scene;
  private listeners: Map<string, Set<(...args: unknown[]) => void>>;

  constructor(scene: Phaser.Scene, maxRelics?: number) {
    this.scene = scene;
    this.logic = new RelicLogic(maxRelics);
    this.listeners = new Map();
  }

  /**
   * Equip a relic and emit event
   */
  equipRelic(relic: RelicDefinition): boolean {
    const success = this.logic.equipRelic(relic);

    if (success) {
      this.emit(GameEvents.RELIC_ACQUIRED, {
        relic,
        totalEquipped: this.logic.getEquippedCount(),
      });
    }

    return success;
  }

  /**
   * Unequip a relic at the given index
   */
  unequipRelic(index: number): EquippedRelic | undefined {
    return this.logic.unequipRelic(index);
  }

  /**
   * Replace a relic at the given index
   */
  replaceRelic(index: number, newRelic: RelicDefinition): boolean {
    return this.logic.replaceRelic(index, newRelic);
  }

  /**
   * Use a relic's active ability
   */
  useActive(index: number): EquippedRelic | undefined {
    const relic = this.logic.useActive(index);

    if (relic) {
      this.emit(GameEvents.RELIC_ACTIVATED, {
        relic: relic.definition,
        index,
        effect: relic.definition.active,
      });

      this.emit(GameEvents.RELIC_COOLDOWN, {
        index,
        cooldown: relic.definition.active.cooldown,
      });
    }

    return relic;
  }

  /**
   * Consume one charge from a relic
   */
  consumeCharge(index: number): boolean {
    return this.logic.consumeCharge(index);
  }

  /**
   * Get remaining charges for a relic
   */
  getRemainingCharges(index: number): number {
    return this.logic.getRemainingCharges(index);
  }

  /**
   * Update cooldowns - call this from scene's update loop
   */
  update(deltaTime: number): void {
    this.logic.updateCooldowns(deltaTime);

    // Update passives and emit events for triggers
    const triggered = this.logic.updatePassives(deltaTime);
    for (const trigger of triggered) {
      this.scene.events.emit(`relic:passive:${trigger.effect}`, {
        index: trigger.index,
        ...trigger.data,
      });
    }
  }

  /**
   * Check if a relic's active is ready
   */
  isActiveReady(index: number): boolean {
    return this.logic.isActiveReady(index);
  }

  /**
   * Get all equipped relics
   */
  getEquippedRelics(): EquippedRelic[] {
    return this.logic.getEquippedRelics();
  }

  /**
   * Get count of equipped relics
   */
  getEquippedCount(): number {
    return this.logic.getEquippedCount();
  }

  /**
   * Check if relic slots are full
   */
  isFull(): boolean {
    return this.logic.isFull();
  }

  /**
   * Calculate total passive effect value
   */
  getTotalPassiveValue(effectType: PassiveEffectType): number {
    return this.logic.getTotalPassiveValue(effectType);
  }

  /**
   * Check if player has a specific passive
   */
  hasPassive(effectType: PassiveEffectType): boolean {
    return this.logic.hasPassive(effectType);
  }

  /**
   * Clear all relics
   */
  clearAll(): void {
    this.logic.clearAll();
  }

  // Event emitter methods

  /**
   * Register an event listener
   */
  on(event: string, callback: (...args: unknown[]) => void): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return this;
  }

  /**
   * Remove an event listener
   */
  off(event: string, callback: (...args: unknown[]) => void): this {
    this.listeners.get(event)?.delete(callback);
    return this;
  }

  /**
   * Emit an event to all registered listeners
   */
  private emit(event: string, ...args: unknown[]): boolean {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(...args));
      return true;
    }
    return false;
  }
}
