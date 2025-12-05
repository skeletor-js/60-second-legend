import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SaveManager, SaveData } from '../SaveManager';

describe('SaveManager', () => {
  // Clean up localStorage before and after each test
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('createDefaultSave', () => {
    it('should create a default save with zero values', () => {
      const save = SaveManager.createDefaultSave();

      expect(save.version).toBe('1.0.0');
      expect(save.memoryShardsTotal).toBe(0);
      expect(save.memoryShardsSpent).toBe(0);
      expect(save.unlockedUpgrades).toEqual([]);
      expect(save.highestFloorReached).toBe(0);
      expect(save.totalRuns).toBe(0);
      expect(save.statistics.enemiesKilled).toBe(0);
      expect(save.statistics.timeExtended).toBe(0);
      expect(save.statistics.perfectDodges).toBe(0);
    });
  });

  describe('save and load', () => {
    it('should save and load data correctly', () => {
      const testData: SaveData = {
        version: '1.0.0',
        memoryShardsTotal: 100,
        memoryShardsSpent: 50,
        unlockedUpgrades: ['EXPANDED_HOURGLASS', 'THICK_SKIN'],
        highestFloorReached: 3,
        totalRuns: 5,
        statistics: {
          enemiesKilled: 42,
          timeExtended: 120,
          perfectDodges: 8,
        },
      };

      const saveSuccess = SaveManager.save(testData);
      expect(saveSuccess).toBe(true);

      const loaded = SaveManager.load();
      expect(loaded).toEqual(testData);
    });

    it('should return default save when no data exists', () => {
      const loaded = SaveManager.load();
      const defaultSave = SaveManager.createDefaultSave();

      expect(loaded).toEqual(defaultSave);
    });

    it('should handle corrupted save data gracefully', () => {
      // Manually corrupt the localStorage
      localStorage.setItem('60sl_save', 'invalid json {{{');

      const loaded = SaveManager.load();
      const defaultSave = SaveManager.createDefaultSave();

      expect(loaded).toEqual(defaultSave);
    });
  });

  describe('reset', () => {
    it('should remove save data from localStorage', () => {
      const testData = SaveManager.createDefaultSave();
      testData.memoryShardsTotal = 100;

      SaveManager.save(testData);
      expect(SaveManager.exists()).toBe(true);

      SaveManager.reset();
      expect(SaveManager.exists()).toBe(false);
    });

    it('should return default save after reset', () => {
      const testData = SaveManager.createDefaultSave();
      testData.memoryShardsTotal = 100;

      SaveManager.save(testData);
      SaveManager.reset();

      const loaded = SaveManager.load();
      const defaultSave = SaveManager.createDefaultSave();

      expect(loaded).toEqual(defaultSave);
    });
  });

  describe('exists', () => {
    it('should return false when no save exists', () => {
      expect(SaveManager.exists()).toBe(false);
    });

    it('should return true when save exists', () => {
      SaveManager.save(SaveManager.createDefaultSave());
      expect(SaveManager.exists()).toBe(true);
    });
  });

  describe('version migration', () => {
    it('should migrate old save versions to current version', () => {
      const oldSave = {
        version: '0.9.0',
        memoryShardsTotal: 50,
        // Old schema
      };

      localStorage.setItem('60sl_save', JSON.stringify(oldSave));

      const loaded = SaveManager.load();

      // Should return default save when version mismatch
      expect(loaded.version).toBe('1.0.0');
      expect(loaded.memoryShardsTotal).toBe(0); // Reset to default
    });
  });

  describe('data integrity', () => {
    it('should preserve all fields during save/load cycle', () => {
      const testData: SaveData = {
        version: '1.0.0',
        memoryShardsTotal: 250,
        memoryShardsSpent: 175,
        unlockedUpgrades: ['EXPANDED_HOURGLASS', 'SHARPENED_BLADE', 'THICK_SKIN'],
        highestFloorReached: 7,
        totalRuns: 15,
        statistics: {
          enemiesKilled: 342,
          timeExtended: 567,
          perfectDodges: 23,
        },
      };

      SaveManager.save(testData);
      const loaded = SaveManager.load();

      // Check each field individually
      expect(loaded.version).toBe(testData.version);
      expect(loaded.memoryShardsTotal).toBe(testData.memoryShardsTotal);
      expect(loaded.memoryShardsSpent).toBe(testData.memoryShardsSpent);
      expect(loaded.unlockedUpgrades).toEqual(testData.unlockedUpgrades);
      expect(loaded.highestFloorReached).toBe(testData.highestFloorReached);
      expect(loaded.totalRuns).toBe(testData.totalRuns);
      expect(loaded.statistics).toEqual(testData.statistics);
    });
  });
});
