import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProgressionLogic, ProgressionSystem } from '../ProgressionSystem';
import { SaveManager } from '@/utils/SaveManager';
import { UPGRADES } from '@config/Constants';

describe('ProgressionLogic', () => {
  let logic: ProgressionLogic;

  beforeEach(() => {
    logic = new ProgressionLogic();
  });

  describe('initialization', () => {
    it('should initialize with zero values', () => {
      expect(logic.getTotalShards()).toBe(0);
      expect(logic.getAvailableShards()).toBe(0);
      expect(logic.getSpentShards()).toBe(0);
      expect(logic.getUnlockedUpgrades()).toEqual([]);
    });

    it('should initialize from save data', () => {
      const saveData = SaveManager.createDefaultSave();
      saveData.memoryShardsTotal = 100;
      saveData.memoryShardsSpent = 50;
      saveData.unlockedUpgrades = ['EXPANDED_HOURGLASS'];

      const logicWithSave = new ProgressionLogic(saveData);

      expect(logicWithSave.getTotalShards()).toBe(100);
      expect(logicWithSave.getAvailableShards()).toBe(50);
      expect(logicWithSave.getSpentShards()).toBe(50);
      expect(logicWithSave.getUnlockedUpgrades()).toEqual(['EXPANDED_HOURGLASS']);
    });
  });

  describe('earning shards', () => {
    it('should increase total shards when earning', () => {
      logic.earnShards(10);
      expect(logic.getTotalShards()).toBe(10);
      expect(logic.getAvailableShards()).toBe(10);
    });

    it('should accumulate shards across multiple earns', () => {
      logic.earnShards(5);
      logic.earnShards(10);
      logic.earnShards(3);

      expect(logic.getTotalShards()).toBe(18);
      expect(logic.getAvailableShards()).toBe(18);
    });

    it('should not change shards when amount is zero', () => {
      logic.earnShards(0);
      expect(logic.getTotalShards()).toBe(0);
    });

    it('should ignore negative amounts', () => {
      logic.earnShards(10);
      logic.earnShards(-5);
      expect(logic.getTotalShards()).toBe(10);
    });
  });

  describe('purchasing upgrades', () => {
    beforeEach(() => {
      logic.earnShards(200); // Enough to buy all upgrades
    });

    it('should purchase upgrade when affordable', () => {
      const cost = UPGRADES.EXPANDED_HOURGLASS.cost;
      const success = logic.purchaseUpgrade('EXPANDED_HOURGLASS', cost);

      expect(success).toBe(true);
      expect(logic.isUnlocked('EXPANDED_HOURGLASS')).toBe(true);
      expect(logic.getSpentShards()).toBe(cost);
      expect(logic.getAvailableShards()).toBe(200 - cost);
    });

    it('should not purchase upgrade when already owned', () => {
      const cost = UPGRADES.EXPANDED_HOURGLASS.cost;
      logic.purchaseUpgrade('EXPANDED_HOURGLASS', cost);

      const secondPurchase = logic.purchaseUpgrade('EXPANDED_HOURGLASS', cost);
      expect(secondPurchase).toBe(false);
      expect(logic.getSpentShards()).toBe(cost); // Should not double charge
    });

    it('should not purchase upgrade when not affordable', () => {
      const logic = new ProgressionLogic();
      logic.earnShards(10);

      const success = logic.purchaseUpgrade('EXPANDED_HOURGLASS', UPGRADES.EXPANDED_HOURGLASS.cost);

      expect(success).toBe(false);
      expect(logic.isUnlocked('EXPANDED_HOURGLASS')).toBe(false);
      expect(logic.getSpentShards()).toBe(0);
    });

    it('should track multiple purchased upgrades', () => {
      logic.purchaseUpgrade('EXPANDED_HOURGLASS', UPGRADES.EXPANDED_HOURGLASS.cost);
      logic.purchaseUpgrade('THICK_SKIN', UPGRADES.THICK_SKIN.cost);

      expect(logic.isUnlocked('EXPANDED_HOURGLASS')).toBe(true);
      expect(logic.isUnlocked('THICK_SKIN')).toBe(true);
      expect(logic.getUnlockedUpgrades()).toHaveLength(2);
    });
  });

  describe('affordability checks', () => {
    it('should return true when can afford', () => {
      logic.earnShards(100);
      expect(logic.canAfford(50)).toBe(true);
    });

    it('should return false when cannot afford', () => {
      logic.earnShards(30);
      expect(logic.canAfford(50)).toBe(false);
    });

    it('should account for spent shards', () => {
      logic.earnShards(100);
      logic.purchaseUpgrade('EXPANDED_HOURGLASS', UPGRADES.EXPANDED_HOURGLASS.cost);

      expect(logic.canAfford(UPGRADES.THICK_SKIN.cost)).toBe(false);
    });
  });

  describe('statistics', () => {
    it('should track statistics', () => {
      logic.addStatistic('enemiesKilled', 5);
      logic.addStatistic('timeExtended', 10);
      logic.addStatistic('perfectDodges', 2);

      const stats = logic.getStatistics();
      expect(stats.enemiesKilled).toBe(5);
      expect(stats.timeExtended).toBe(10);
      expect(stats.perfectDodges).toBe(2);
    });

    it('should accumulate statistics', () => {
      logic.addStatistic('enemiesKilled', 5);
      logic.addStatistic('enemiesKilled', 10);

      const stats = logic.getStatistics();
      expect(stats.enemiesKilled).toBe(15);
    });
  });

  describe('data export', () => {
    it('should export complete data', () => {
      logic.earnShards(100);
      logic.purchaseUpgrade('EXPANDED_HOURGLASS', UPGRADES.EXPANDED_HOURGLASS.cost);
      logic.addStatistic('enemiesKilled', 10);

      const exported = logic.exportData();

      expect(exported.memoryShardsTotal).toBe(100);
      expect(exported.memoryShardsSpent).toBe(UPGRADES.EXPANDED_HOURGLASS.cost);
      expect(exported.unlockedUpgrades).toContain('EXPANDED_HOURGLASS');
      expect(exported.statistics.enemiesKilled).toBe(10);
    });
  });
});

describe('ProgressionSystem', () => {
  let system: ProgressionSystem;

  beforeEach(() => {
    localStorage.clear();
    system = new ProgressionSystem();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should load from localStorage on creation', () => {
      const saveData = SaveManager.createDefaultSave();
      saveData.memoryShardsTotal = 50;
      SaveManager.save(saveData);

      const newSystem = new ProgressionSystem();
      expect(newSystem.getLogic().getTotalShards()).toBe(50);
    });

    it('should load default save if none exists', () => {
      expect(system.getLogic().getTotalShards()).toBe(0);
      expect(system.getLogic().getAvailableShards()).toBe(0);
    });
  });

  describe('earning shards', () => {
    it('should earn shards and save', () => {
      system.earnShards(10);

      expect(system.getLogic().getTotalShards()).toBe(10);

      // Verify it was saved
      const loaded = SaveManager.load();
      expect(loaded.memoryShardsTotal).toBe(10);
    });

    it('should emit event when earning shards', () => {
      return new Promise<void>((resolve) => {
        system.on('progression:shards_earned', (data: { amount: number; total: number }) => {
          expect(data.amount).toBe(15);
          expect(data.total).toBe(15);
          resolve();
        });

        system.earnShards(15);
      });
    });
  });

  describe('purchasing upgrades', () => {
    beforeEach(() => {
      system.earnShards(200);
    });

    it('should purchase upgrade and save', () => {
      const success = system.purchaseUpgrade('EXPANDED_HOURGLASS');

      expect(success).toBe(true);
      expect(system.getLogic().isUnlocked('EXPANDED_HOURGLASS')).toBe(true);

      // Verify it was saved
      const loaded = SaveManager.load();
      expect(loaded.unlockedUpgrades).toContain('EXPANDED_HOURGLASS');
    });

    it('should emit event when purchasing upgrade', () => {
      return new Promise<void>((resolve) => {
        system.on('progression:upgrade_purchased', (data: { upgradeKey: string }) => {
          expect(data.upgradeKey).toBe('THICK_SKIN');
          resolve();
        });

        system.purchaseUpgrade('THICK_SKIN');
      });
    });

    it('should return false for unknown upgrade', () => {
      const success = system.purchaseUpgrade('UNKNOWN_UPGRADE');
      expect(success).toBe(false);
    });
  });

  describe('available upgrades', () => {
    it('should return all upgrades with status', () => {
      system.earnShards(60);

      const upgrades = system.getAvailableUpgrades();

      expect(upgrades).toHaveLength(4);

      const expandedHourglass = upgrades.find((u) => u.key === 'EXPANDED_HOURGLASS');
      expect(expandedHourglass?.unlocked).toBe(false);
      expect(expandedHourglass?.canAfford).toBe(true);

      const relicAttunement = upgrades.find((u) => u.key === 'RELIC_ATTUNEMENT');
      expect(relicAttunement?.canAfford).toBe(false);
    });

    it('should mark purchased upgrades as unlocked', () => {
      system.earnShards(100);
      system.purchaseUpgrade('EXPANDED_HOURGLASS');

      const upgrades = system.getAvailableUpgrades();
      const purchased = upgrades.find((u) => u.key === 'EXPANDED_HOURGLASS');

      expect(purchased?.unlocked).toBe(true);
    });
  });

  describe('run statistics', () => {
    it('should record run stats and save', () => {
      system.recordRunStats({
        enemiesKilled: 10,
        timeExtended: 20,
        perfectDodges: 3,
        floorReached: 2,
      });

      const stats = system.getStatistics();
      expect(stats.enemiesKilled).toBe(10);
      expect(stats.timeExtended).toBe(20);
      expect(stats.perfectDodges).toBe(3);

      expect(system.getHighestFloor()).toBe(2);
      expect(system.getTotalRuns()).toBe(1);
    });

    it('should accumulate stats across runs', () => {
      system.recordRunStats({ enemiesKilled: 5 });
      system.recordRunStats({ enemiesKilled: 10 });

      expect(system.getStatistics().enemiesKilled).toBe(15);
      expect(system.getTotalRuns()).toBe(2);
    });

    it('should track highest floor reached', () => {
      system.recordRunStats({ floorReached: 3 });
      system.recordRunStats({ floorReached: 2 });
      system.recordRunStats({ floorReached: 5 });

      expect(system.getHighestFloor()).toBe(5);
    });

    it('should emit event when run ends', () => {
      return new Promise<void>((resolve) => {
        system.on('progression:run_ended', (data) => {
          expect(data.enemiesKilled).toBe(7);
          resolve();
        });

        system.recordRunStats({ enemiesKilled: 7 });
      });
    });
  });

  describe('reset', () => {
    it('should reset all progression', () => {
      system.earnShards(100);
      system.purchaseUpgrade('EXPANDED_HOURGLASS');
      system.recordRunStats({ enemiesKilled: 10 });

      system.reset();

      expect(system.getLogic().getTotalShards()).toBe(0);
      expect(system.getLogic().getUnlockedUpgrades()).toEqual([]);
      expect(system.getStatistics().enemiesKilled).toBe(0);
      expect(SaveManager.exists()).toBe(false);
    });
  });

  describe('persistence', () => {
    it('should persist data across system instances', () => {
      system.earnShards(50);
      system.purchaseUpgrade('EXPANDED_HOURGLASS');

      // Create new system instance
      const newSystem = new ProgressionSystem();

      expect(newSystem.getLogic().getTotalShards()).toBe(50);
      expect(newSystem.getLogic().isUnlocked('EXPANDED_HOURGLASS')).toBe(true);
    });
  });
});
