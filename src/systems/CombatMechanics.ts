/**
 * CombatMechanics
 * Manages advanced combat mechanics: kill streaks, combos, perfect dodges, executes
 */

import Phaser from 'phaser';
import { KILL_STREAKS, COMBO, COMBAT, GameEvents } from '@config/Constants';

/**
 * Kill streak data
 */
export interface KillStreakData {
  count: number;
  bonus: number;
  announcement: string;
  color: number;
}

/**
 * Combo data
 */
export interface ComboData {
  count: number;
  multiplier: number;
  announcement?: string;
  color?: number;
}

/**
 * Perfect dodge data
 */
export interface PerfectDodgeData {
  timeReward: number;
  damageMultiplier: number;
  iFrameDuration: number;
}

/**
 * Execute data
 */
export interface ExecuteData {
  wasExecute: boolean;
  bonusTime: number;
}

/**
 * CombatMechanicsLogic - Pure logic class for testing
 * Handles kill streaks, combos, perfect dodges, and executes
 */
export class CombatMechanicsLogic {
  // Kill streak tracking
  private killStreak: number = 0;
  private lastStreakThreshold: number = 0;

  // Combo tracking
  private comboCount: number = 0;
  private comboTimer: number = 0;
  private lastComboThreshold: number = 0;

  // Perfect dodge tracking
  private perfectDodgeActive: boolean = false;
  private lastDodgeTime: number = 0;

  // Constants
  private comboWindow: number;
  private perfectDodgeWindow: number;
  private perfectDodgeDamageMult: number;
  private perfectDodgeTime: number;
  private perfectDodgeIFrames: number;
  private executeThreshold: number;
  private executeTimeBonus: number;

  constructor() {
    this.comboWindow = COMBO.COMBO_WINDOW;
    this.perfectDodgeWindow = COMBAT.PERFECT_DODGE_WINDOW;
    this.perfectDodgeDamageMult = COMBAT.PERFECT_DODGE_DAMAGE_MULT;
    this.perfectDodgeTime = COMBAT.PERFECT_DODGE_TIME;
    this.perfectDodgeIFrames = COMBAT.PERFECT_DODGE_I_FRAMES;
    this.executeThreshold = COMBAT.EXECUTE_THRESHOLD;
    this.executeTimeBonus = COMBAT.EXECUTE_TIME_BONUS;
  }

  /**
   * Update timers (combo window, etc.)
   */
  update(delta: number): void {
    // Update combo timer
    if (this.comboCount > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.resetCombo();
      }
    }
  }

  /**
   * Register a kill and update kill streak
   * Returns kill streak data if a threshold was reached
   */
  registerKill(): KillStreakData | null {
    this.killStreak++;

    // Check if we hit a new streak threshold
    const thresholds = Object.keys(KILL_STREAKS)
      .map(Number)
      .sort((a, b) => a - b);

    for (const threshold of thresholds) {
      if (this.killStreak >= threshold && threshold > this.lastStreakThreshold) {
        this.lastStreakThreshold = threshold;
        const streakData = KILL_STREAKS[threshold as keyof typeof KILL_STREAKS];
        return {
          count: this.killStreak,
          bonus: streakData.bonus,
          announcement: streakData.announcement,
          color: streakData.color,
        };
      }
    }

    return null;
  }

  /**
   * Register a hit and update combo
   * Returns combo data if a threshold was reached
   */
  registerHit(): ComboData {
    this.comboCount++;
    this.comboTimer = this.comboWindow;

    // Check if we hit a new combo threshold
    const thresholds = Object.keys(COMBO.THRESHOLDS)
      .map(Number)
      .sort((a, b) => a - b);

    for (const threshold of thresholds) {
      if (this.comboCount === threshold && threshold > this.lastComboThreshold) {
        this.lastComboThreshold = threshold;
        const comboData = COMBO.THRESHOLDS[threshold as keyof typeof COMBO.THRESHOLDS];
        return {
          count: this.comboCount,
          multiplier: comboData.multiplier,
          announcement: comboData.announcement,
          color: comboData.color,
        };
      }
    }

    // Return current combo data without announcement
    return {
      count: this.comboCount,
      multiplier: this.getCurrentComboMultiplier(),
    };
  }

  /**
   * Reset kill streak (when player takes damage)
   */
  resetKillStreak(): void {
    this.killStreak = 0;
    this.lastStreakThreshold = 0;
  }

  /**
   * Reset combo counter
   */
  resetCombo(): void {
    this.comboCount = 0;
    this.comboTimer = 0;
    this.lastComboThreshold = 0;
  }

  /**
   * Attempt to register a perfect dodge
   * Returns perfect dodge data if successful
   */
  attemptPerfectDodge(currentTime: number): PerfectDodgeData | null {
    // Check if within perfect dodge window
    const timeSinceLastDodge = currentTime - this.lastDodgeTime;

    if (timeSinceLastDodge <= this.perfectDodgeWindow) {
      this.perfectDodgeActive = true;
      return {
        timeReward: this.perfectDodgeTime,
        damageMultiplier: this.perfectDodgeDamageMult,
        iFrameDuration: this.perfectDodgeIFrames,
      };
    }

    return null;
  }

  /**
   * Update last dodge time (called when enemy attacks)
   */
  updateDodgeTime(currentTime: number): void {
    this.lastDodgeTime = currentTime;
  }

  /**
   * Check if perfect dodge is active
   */
  isPerfectDodgeActive(): boolean {
    return this.perfectDodgeActive;
  }

  /**
   * Consume perfect dodge (after next attack)
   */
  consumePerfectDodge(): void {
    this.perfectDodgeActive = false;
  }

  /**
   * Check if enemy can be executed
   */
  canExecute(currentHealth: number, maxHealth: number): boolean {
    const healthPercent = currentHealth / maxHealth;
    return healthPercent <= this.executeThreshold && healthPercent > 0;
  }

  /**
   * Process an execute
   * Returns execute data
   */
  processExecute(): ExecuteData {
    return {
      wasExecute: true,
      bonusTime: this.executeTimeBonus,
    };
  }

  /**
   * Get current kill streak count
   */
  getKillStreak(): number {
    return this.killStreak;
  }

  /**
   * Get current combo count
   */
  getComboCount(): number {
    return this.comboCount;
  }

  /**
   * Get current combo multiplier
   */
  getCurrentComboMultiplier(): number {
    // Find the highest threshold we've passed
    const thresholds = Object.keys(COMBO.THRESHOLDS)
      .map(Number)
      .sort((a, b) => b - a); // Sort descending

    for (const threshold of thresholds) {
      if (this.comboCount >= threshold) {
        return COMBO.THRESHOLDS[threshold as keyof typeof COMBO.THRESHOLDS].multiplier;
      }
    }

    return 1.0; // Default multiplier
  }

  /**
   * Get combo time remaining
   */
  getComboTimeRemaining(): number {
    return Math.max(0, this.comboTimer);
  }

  /**
   * Calculate total damage with all multipliers
   */
  calculateDamage(baseDamage: number): number {
    let damage = baseDamage;

    // Apply perfect dodge multiplier
    if (this.perfectDodgeActive) {
      damage *= this.perfectDodgeDamageMult;
    }

    return Math.round(damage);
  }
}

/**
 * CombatMechanics - Phaser wrapper
 * Integrates combat mechanics with event system
 */
export class CombatMechanics extends Phaser.Events.EventEmitter {
  private logic: CombatMechanicsLogic;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    super();
    this.scene = scene;
    this.logic = new CombatMechanicsLogic();
  }

  /**
   * Update mechanics (combo timer, etc.)
   */
  update(delta: number): void {
    this.logic.update(delta / 1000); // Convert ms to seconds
  }

  /**
   * Register a kill
   * Emits KILL_STREAK event if threshold reached
   */
  registerKill(): void {
    const streakData = this.logic.registerKill();

    if (streakData) {
      this.emit(GameEvents.KILL_STREAK, streakData);
      this.scene.events.emit(GameEvents.KILL_STREAK, streakData);
    }
  }

  /**
   * Register a hit
   * Emits COMBO_ACHIEVED event if threshold reached
   */
  registerHit(): ComboData {
    const comboData = this.logic.registerHit();

    if (comboData.announcement) {
      this.emit(GameEvents.COMBO_ACHIEVED, comboData);
      this.scene.events.emit(GameEvents.COMBO_ACHIEVED, comboData);
    }

    return comboData;
  }

  /**
   * Reset kill streak (when player takes damage)
   */
  resetKillStreak(): void {
    this.logic.resetKillStreak();
  }

  /**
   * Reset combo
   */
  resetCombo(): void {
    this.logic.resetCombo();
  }

  /**
   * Attempt perfect dodge
   * Emits PERFECT_DODGE event if successful
   */
  attemptPerfectDodge(): PerfectDodgeData | null {
    const currentTime = this.scene.time.now / 1000; // Convert to seconds
    const dodgeData = this.logic.attemptPerfectDodge(currentTime);

    if (dodgeData) {
      this.emit(GameEvents.PERFECT_DODGE, dodgeData);
      this.scene.events.emit(GameEvents.PERFECT_DODGE, dodgeData);
    }

    return dodgeData;
  }

  /**
   * Update dodge time (called when enemy would damage player)
   */
  updateDodgeTime(): void {
    const currentTime = this.scene.time.now / 1000; // Convert to seconds
    this.logic.updateDodgeTime(currentTime);
  }

  /**
   * Check if perfect dodge is active
   */
  isPerfectDodgeActive(): boolean {
    return this.logic.isPerfectDodgeActive();
  }

  /**
   * Consume perfect dodge
   */
  consumePerfectDodge(): void {
    this.logic.consumePerfectDodge();
  }

  /**
   * Check if enemy can be executed
   */
  canExecute(currentHealth: number, maxHealth: number): boolean {
    return this.logic.canExecute(currentHealth, maxHealth);
  }

  /**
   * Process execute
   */
  processExecute(): ExecuteData {
    return this.logic.processExecute();
  }

  /**
   * Get current kill streak
   */
  getKillStreak(): number {
    return this.logic.getKillStreak();
  }

  /**
   * Get current combo count
   */
  getComboCount(): number {
    return this.logic.getComboCount();
  }

  /**
   * Get combo multiplier
   */
  getComboMultiplier(): number {
    return this.logic.getCurrentComboMultiplier();
  }

  /**
   * Get combo time remaining
   */
  getComboTimeRemaining(): number {
    return this.logic.getComboTimeRemaining();
  }

  /**
   * Calculate damage with all multipliers
   */
  calculateDamage(baseDamage: number): number {
    return this.logic.calculateDamage(baseDamage);
  }

  /**
   * Get the underlying logic instance (for testing)
   */
  getLogic(): CombatMechanicsLogic {
    return this.logic;
  }
}
