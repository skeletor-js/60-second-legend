/**
 * ProgressionSystem
 * Manages meta-progression: memory shards, upgrades, and persistent stats
 */

import Phaser from 'phaser';
import { SaveManager, SaveData } from '@/utils/SaveManager';
import { UPGRADES, UpgradeDefinition, GameEvents } from '@config/Constants';

/**
 * Pure logic class for progression mechanics
 */
export class ProgressionLogic {
  private memoryShardsTotal: number;
  private memoryShardsSpent: number;
  private unlockedUpgrades: Set<string>;
  private statistics: SaveData['statistics'];

  constructor(saveData?: SaveData) {
    if (saveData) {
      this.memoryShardsTotal = saveData.memoryShardsTotal;
      this.memoryShardsSpent = saveData.memoryShardsSpent;
      this.unlockedUpgrades = new Set(saveData.unlockedUpgrades);
      this.statistics = { ...saveData.statistics };
    } else {
      this.memoryShardsTotal = 0;
      this.memoryShardsSpent = 0;
      this.unlockedUpgrades = new Set();
      this.statistics = {
        enemiesKilled: 0,
        timeExtended: 0,
        perfectDodges: 0,
      };
    }
  }

  /**
   * Get available memory shards (total - spent)
   */
  getAvailableShards(): number {
    return this.memoryShardsTotal - this.memoryShardsSpent;
  }

  /**
   * Get total shards earned
   */
  getTotalShards(): number {
    return this.memoryShardsTotal;
  }

  /**
   * Get shards spent
   */
  getSpentShards(): number {
    return this.memoryShardsSpent;
  }

  /**
   * Earn memory shards
   */
  earnShards(amount: number): void {
    if (amount <= 0) return;
    this.memoryShardsTotal += amount;
  }

  /**
   * Check if player can afford an upgrade
   */
  canAfford(upgradeCost: number): boolean {
    return this.getAvailableShards() >= upgradeCost;
  }

  /**
   * Check if an upgrade is already unlocked
   */
  isUnlocked(upgradeKey: string): boolean {
    return this.unlockedUpgrades.has(upgradeKey);
  }

  /**
   * Purchase an upgrade
   * Returns true if successful, false if already owned or can't afford
   */
  purchaseUpgrade(upgradeKey: string, upgradeCost: number): boolean {
    if (this.isUnlocked(upgradeKey)) {
      return false;
    }

    if (!this.canAfford(upgradeCost)) {
      return false;
    }

    this.memoryShardsSpent += upgradeCost;
    this.unlockedUpgrades.add(upgradeKey);
    return true;
  }

  /**
   * Get all unlocked upgrades
   */
  getUnlockedUpgrades(): string[] {
    return Array.from(this.unlockedUpgrades);
  }

  /**
   * Update statistics
   */
  addStatistic(stat: keyof SaveData['statistics'], amount: number): void {
    this.statistics[stat] += amount;
  }

  /**
   * Get current statistics
   */
  getStatistics(): SaveData['statistics'] {
    return { ...this.statistics };
  }

  /**
   * Export data for saving
   */
  exportData(): Omit<SaveData, 'version' | 'highestFloorReached' | 'totalRuns'> {
    return {
      memoryShardsTotal: this.memoryShardsTotal,
      memoryShardsSpent: this.memoryShardsSpent,
      unlockedUpgrades: this.getUnlockedUpgrades(),
      statistics: { ...this.statistics },
    };
  }
}

/**
 * Progression system with save/load functionality
 */
export class ProgressionSystem extends Phaser.Events.EventEmitter {
  private logic: ProgressionLogic;
  private saveData: SaveData;

  constructor() {
    super();

    // Load save data
    this.saveData = SaveManager.load();
    this.logic = new ProgressionLogic(this.saveData);
  }

  /**
   * Get the progression logic instance
   */
  getLogic(): ProgressionLogic {
    return this.logic;
  }

  /**
   * Earn shards and save
   */
  earnShards(amount: number): void {
    this.logic.earnShards(amount);
    this.save();
    this.emit(GameEvents.SHARDS_EARNED, { amount, total: this.logic.getTotalShards() });
  }

  /**
   * Purchase an upgrade
   */
  purchaseUpgrade(upgradeKey: string): boolean {
    const upgradeData = (UPGRADES as Record<string, UpgradeDefinition>)[upgradeKey];
    if (!upgradeData) {
      console.error(`Unknown upgrade: ${upgradeKey}`);
      return false;
    }

    const success = this.logic.purchaseUpgrade(upgradeKey, upgradeData.cost);
    if (success) {
      this.save();
      this.emit(GameEvents.UPGRADE_PURCHASED, { upgradeKey, upgrade: upgradeData });
    }
    return success;
  }

  /**
   * Get all available upgrades (with purchase status)
   */
  getAvailableUpgrades(): Array<{ key: string; upgrade: UpgradeDefinition; unlocked: boolean; canAfford: boolean }> {
    const upgrades = Object.entries(UPGRADES).map(([key, upgrade]) => ({
      key,
      upgrade: upgrade as UpgradeDefinition,
      unlocked: this.logic.isUnlocked(key),
      canAfford: this.logic.canAfford(upgrade.cost),
    }));

    return upgrades;
  }

  /**
   * Record run statistics and save
   */
  recordRunStats(stats: {
    enemiesKilled?: number;
    timeExtended?: number;
    perfectDodges?: number;
    floorReached?: number;
  }): void {
    if (stats.enemiesKilled) {
      this.logic.addStatistic('enemiesKilled', stats.enemiesKilled);
    }
    if (stats.timeExtended) {
      this.logic.addStatistic('timeExtended', stats.timeExtended);
    }
    if (stats.perfectDodges) {
      this.logic.addStatistic('perfectDodges', stats.perfectDodges);
    }
    if (stats.floorReached) {
      this.saveData.highestFloorReached = Math.max(
        this.saveData.highestFloorReached,
        stats.floorReached
      );
    }

    this.saveData.totalRuns++;
    this.save();
    this.emit(GameEvents.RUN_ENDED, stats);
  }

  /**
   * Get player statistics
   */
  getStatistics(): SaveData['statistics'] {
    return this.logic.getStatistics();
  }

  /**
   * Get highest floor reached
   */
  getHighestFloor(): number {
    return this.saveData.highestFloorReached;
  }

  /**
   * Get total runs completed
   */
  getTotalRuns(): number {
    return this.saveData.totalRuns;
  }

  /**
   * Save current state to localStorage
   */
  save(): void {
    const logicData = this.logic.exportData();
    this.saveData = {
      version: this.saveData.version,
      ...logicData,
      highestFloorReached: this.saveData.highestFloorReached,
      totalRuns: this.saveData.totalRuns,
    };
    SaveManager.save(this.saveData);
  }

  /**
   * Reset all progression (for testing or new game+)
   */
  reset(): void {
    SaveManager.reset();
    this.saveData = SaveManager.load();
    this.logic = new ProgressionLogic(this.saveData);
  }
}
