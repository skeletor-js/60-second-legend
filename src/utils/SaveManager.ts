/**
 * SaveManager
 * Handles save/load operations for player progression data
 */

export interface SaveData {
  /** Save data version for migration */
  version: string;
  /** Total memory shards earned across all runs */
  memoryShardsTotal: number;
  /** Memory shards spent on upgrades */
  memoryShardsSpent: number;
  /** List of purchased upgrade keys */
  unlockedUpgrades: string[];
  /** Highest floor reached */
  highestFloorReached: number;
  /** Total number of runs completed */
  totalRuns: number;
  /** Game statistics */
  statistics: {
    /** Total enemies killed */
    enemiesKilled: number;
    /** Total time extended in seconds */
    timeExtended: number;
    /** Number of perfect dodges */
    perfectDodges: number;
  };
}

const SAVE_KEY = '60sl_save';
const CURRENT_VERSION = '1.0.0';

export class SaveManager {
  /**
   * Create a new default save data object
   */
  static createDefaultSave(): SaveData {
    return {
      version: CURRENT_VERSION,
      memoryShardsTotal: 0,
      memoryShardsSpent: 0,
      unlockedUpgrades: [],
      highestFloorReached: 0,
      totalRuns: 0,
      statistics: {
        enemiesKilled: 0,
        timeExtended: 0,
        perfectDodges: 0,
      },
    };
  }

  /**
   * Save data to localStorage
   */
  static save(data: SaveData): boolean {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(SAVE_KEY, serialized);
      return true;
    } catch (error) {
      console.error('Failed to save data:', error);
      return false;
    }
  }

  /**
   * Load data from localStorage
   * Returns default save if no data exists or loading fails
   */
  static load(): SaveData {
    try {
      const serialized = localStorage.getItem(SAVE_KEY);
      if (!serialized) {
        return this.createDefaultSave();
      }

      const data = JSON.parse(serialized) as SaveData;

      // Migrate old save versions if needed
      if (data.version !== CURRENT_VERSION) {
        return this.migrateSave(data);
      }

      return data;
    } catch (error) {
      console.error('Failed to load save data:', error);
      return this.createDefaultSave();
    }
  }

  /**
   * Reset save data to defaults
   */
  static reset(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  /**
   * Check if a save exists
   */
  static exists(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  /**
   * Migrate save data from older versions
   * Currently just returns default save, but can be extended for future migrations
   */
  private static migrateSave(oldData: SaveData): SaveData {
    console.warn(`Migrating save from version ${oldData.version} to ${CURRENT_VERSION}`);
    // For now, just create a fresh save
    // In the future, this could preserve some data during migration
    return this.createDefaultSave();
  }
}
