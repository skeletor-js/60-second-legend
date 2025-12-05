/**
 * Relic Data Tests
 */

import { describe, it, expect } from 'vitest';
import { RELICS, getRandomRelics, getRelicById, RelicRarity, RelicTheme } from '../relics';

describe('Relic Data', () => {
  describe('RELICS', () => {
    it('should have all 6 MVP relics defined', () => {
      expect(Object.keys(RELICS)).toHaveLength(6);
      expect(RELICS.SEED_OF_SWIFTNESS).toBeDefined();
      expect(RELICS.ROOT_OF_RESILIENCE).toBeDefined();
      expect(RELICS.CRYSTAL_OF_CLARITY).toBeDefined();
      expect(RELICS.ICE_OF_ISOLATION).toBeDefined();
      expect(RELICS.TEMPORAL_SHARD).toBeDefined();
      expect(RELICS.COMBAT_CHARM).toBeDefined();
    });

    it('should have correct rarities', () => {
      expect(RELICS.SEED_OF_SWIFTNESS.rarity).toBe(RelicRarity.COMMON);
      expect(RELICS.ROOT_OF_RESILIENCE.rarity).toBe(RelicRarity.RARE);
      expect(RELICS.CRYSTAL_OF_CLARITY.rarity).toBe(RelicRarity.COMMON);
      expect(RELICS.ICE_OF_ISOLATION.rarity).toBe(RelicRarity.RARE);
      expect(RELICS.TEMPORAL_SHARD.rarity).toBe(RelicRarity.COMMON);
      expect(RELICS.COMBAT_CHARM.rarity).toBe(RelicRarity.COMMON);
    });

    it('should have correct themes', () => {
      expect(RELICS.SEED_OF_SWIFTNESS.theme).toBe(RelicTheme.VERDANT);
      expect(RELICS.ROOT_OF_RESILIENCE.theme).toBe(RelicTheme.VERDANT);
      expect(RELICS.CRYSTAL_OF_CLARITY.theme).toBe(RelicTheme.FROZEN);
      expect(RELICS.ICE_OF_ISOLATION.theme).toBe(RelicTheme.FROZEN);
      expect(RELICS.TEMPORAL_SHARD.theme).toBe(RelicTheme.GENERIC);
      expect(RELICS.COMBAT_CHARM.theme).toBe(RelicTheme.GENERIC);
    });

    describe('Seed of Swiftness', () => {
      const relic = RELICS.SEED_OF_SWIFTNESS;

      it('should have movement speed passive', () => {
        expect(relic.passive.type).toBe('movement_speed');
        expect(relic.passive.value).toBe(0.2); // 20%
      });

      it('should have dash active', () => {
        expect(relic.active.type).toBe('dash');
        expect(relic.active.value).toBe(150); // pixels
        expect(relic.active.cooldown).toBe(8); // seconds
      });
    });

    describe('Root of Resilience', () => {
      const relic = RELICS.ROOT_OF_RESILIENCE;

      it('should have health regen passive', () => {
        expect(relic.passive.type).toBe('health_regen');
        expect(relic.passive.value).toBe(30); // every 30 seconds
      });

      it('should have cleanse and time active', () => {
        expect(relic.active.type).toBe('cleanse_and_time');
        expect(relic.active.value).toBe(5); // 5 seconds
        expect(relic.active.cooldown).toBe(45);
      });
    });

    describe('Crystal of Clarity', () => {
      const relic = RELICS.CRYSTAL_OF_CLARITY;

      it('should have show enemy HP passive', () => {
        expect(relic.passive.type).toBe('show_enemy_hp');
        expect(relic.passive.value).toBe(1);
      });

      it('should have reveal map active', () => {
        expect(relic.active.type).toBe('reveal_map');
        expect(relic.active.value).toBe(10); // 10 seconds
        expect(relic.active.cooldown).toBe(60);
      });
    });

    describe('Ice of Isolation', () => {
      const relic = RELICS.ICE_OF_ISOLATION;

      it('should have slow on hit passive', () => {
        expect(relic.passive.type).toBe('slow_on_hit');
        expect(relic.passive.value).toBe(0.2); // 20%
      });

      it('should have ice wall active', () => {
        expect(relic.active.type).toBe('ice_wall');
        expect(relic.active.value).toBe(5); // 5 seconds
        expect(relic.active.cooldown).toBe(15);
      });
    });

    describe('Temporal Shard', () => {
      const relic = RELICS.TEMPORAL_SHARD;

      it('should have time bonus passive', () => {
        expect(relic.passive.type).toBe('time_bonus');
        expect(relic.passive.value).toBe(0.1); // 10%
      });

      it('should have pause timer active', () => {
        expect(relic.active.type).toBe('pause_timer');
        expect(relic.active.value).toBe(2); // 2 seconds
        expect(relic.active.cooldown).toBe(30);
      });
    });

    describe('Combat Charm', () => {
      const relic = RELICS.COMBAT_CHARM;

      it('should have damage bonus passive', () => {
        expect(relic.passive.type).toBe('damage_bonus');
        expect(relic.passive.value).toBe(1); // +1 damage
      });

      it('should have damage multiplier active', () => {
        expect(relic.active.type).toBe('damage_multiplier');
        expect(relic.active.value).toBe(3); // 3 attacks
        expect(relic.active.cooldown).toBe(20);
      });
    });
  });

  describe('getRandomRelics', () => {
    it('should return requested number of relics', () => {
      const relics = getRandomRelics(3);
      expect(relics).toHaveLength(3);
    });

    it('should not exceed available relics', () => {
      const relics = getRandomRelics(10); // Request more than available
      expect(relics.length).toBeLessThanOrEqual(6);
    });

    it('should exclude specified relics', () => {
      const exclude = [RELICS.SEED_OF_SWIFTNESS.id, RELICS.TEMPORAL_SHARD.id];
      const relics = getRandomRelics(3, exclude);

      relics.forEach(relic => {
        expect(exclude).not.toContain(relic.id);
      });
    });

    it('should return unique relics', () => {
      const relics = getRandomRelics(3);
      const ids = relics.map(r => r.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(relics.length);
    });
  });

  describe('getRelicById', () => {
    it('should return relic by id', () => {
      const relic = getRelicById('seed_of_swiftness');
      expect(relic).toBeDefined();
      expect(relic?.name).toBe('Seed of Swiftness');
    });

    it('should return undefined for invalid id', () => {
      const relic = getRelicById('nonexistent_relic');
      expect(relic).toBeUndefined();
    });
  });
});
