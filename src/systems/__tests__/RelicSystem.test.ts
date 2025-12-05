/**
 * RelicSystem Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RelicLogic } from '../RelicSystem';
import { RELICS, RelicDefinition, PassiveEffectType } from '@data/relics';

describe('RelicLogic', () => {
  let relicLogic: RelicLogic;

  beforeEach(() => {
    relicLogic = new RelicLogic(5); // Max 5 relics
  });

  describe('equipRelic', () => {
    it('should equip a relic when slots are available', () => {
      const relic = RELICS.SEED_OF_SWIFTNESS;
      const success = relicLogic.equipRelic(relic);

      expect(success).toBe(true);
      expect(relicLogic.getEquippedCount()).toBe(1);
    });

    it('should not equip a relic when slots are full', () => {
      // Fill all slots
      const relics = Object.values(RELICS);
      for (let i = 0; i < 5; i++) {
        relicLogic.equipRelic(relics[i]);
      }

      // Try to equip one more
      const success = relicLogic.equipRelic(RELICS.TEMPORAL_SHARD);
      expect(success).toBe(false);
      expect(relicLogic.getEquippedCount()).toBe(5);
    });

    it('should initialize passive state for health regen relic', () => {
      const relic = RELICS.ROOT_OF_RESILIENCE;
      relicLogic.equipRelic(relic);

      const equipped = relicLogic.getEquippedRelics()[0];
      expect(equipped.passiveState).toHaveProperty('regenTimer', 0);
    });

    it('should initialize active charges for damage multiplier relic', () => {
      const relic = RELICS.COMBAT_CHARM;
      relicLogic.equipRelic(relic);

      const equipped = relicLogic.getEquippedRelics()[0];
      expect(equipped.activeCharges).toBe(0);
    });
  });

  describe('unequipRelic', () => {
    it('should unequip a relic at valid index', () => {
      relicLogic.equipRelic(RELICS.SEED_OF_SWIFTNESS);
      relicLogic.equipRelic(RELICS.TEMPORAL_SHARD);

      const unequipped = relicLogic.unequipRelic(0);
      expect(unequipped).toBeDefined();
      expect(unequipped?.definition.id).toBe(RELICS.SEED_OF_SWIFTNESS.id);
      expect(relicLogic.getEquippedCount()).toBe(1);
    });

    it('should return undefined for invalid index', () => {
      const unequipped = relicLogic.unequipRelic(10);
      expect(unequipped).toBeUndefined();
    });
  });

  describe('replaceRelic', () => {
    it('should replace a relic at valid index', () => {
      relicLogic.equipRelic(RELICS.SEED_OF_SWIFTNESS);
      const success = relicLogic.replaceRelic(0, RELICS.TEMPORAL_SHARD);

      expect(success).toBe(true);
      const equipped = relicLogic.getEquippedRelics()[0];
      expect(equipped.definition.id).toBe(RELICS.TEMPORAL_SHARD.id);
    });

    it('should return false for invalid index', () => {
      const success = relicLogic.replaceRelic(5, RELICS.TEMPORAL_SHARD);
      expect(success).toBe(false);
    });
  });

  describe('useActive', () => {
    it('should activate a relic when ready', () => {
      relicLogic.equipRelic(RELICS.SEED_OF_SWIFTNESS);

      const relic = relicLogic.useActive(0);
      expect(relic).toBeDefined();
      expect(relic?.currentCooldown).toBe(RELICS.SEED_OF_SWIFTNESS.active.cooldown);
    });

    it('should not activate a relic on cooldown', () => {
      relicLogic.equipRelic(RELICS.SEED_OF_SWIFTNESS);
      relicLogic.useActive(0); // First activation

      const secondActivation = relicLogic.useActive(0);
      expect(secondActivation).toBeUndefined();
    });

    it('should initialize charges for damage multiplier relic', () => {
      relicLogic.equipRelic(RELICS.COMBAT_CHARM);
      relicLogic.useActive(0);

      const equipped = relicLogic.getEquippedRelics()[0];
      expect(equipped.activeCharges).toBe(3); // Combat Charm gives 3 charged attacks
    });
  });

  describe('isActiveReady', () => {
    it('should return true when relic is ready', () => {
      relicLogic.equipRelic(RELICS.SEED_OF_SWIFTNESS);
      expect(relicLogic.isActiveReady(0)).toBe(true);
    });

    it('should return false when relic is on cooldown', () => {
      relicLogic.equipRelic(RELICS.SEED_OF_SWIFTNESS);
      relicLogic.useActive(0);
      expect(relicLogic.isActiveReady(0)).toBe(false);
    });
  });

  describe('updateCooldowns', () => {
    it('should decrease cooldown over time', () => {
      relicLogic.equipRelic(RELICS.SEED_OF_SWIFTNESS);
      relicLogic.useActive(0);

      const initialCooldown = relicLogic.getEquippedRelics()[0].currentCooldown;
      relicLogic.updateCooldowns(2); // 2 seconds

      const newCooldown = relicLogic.getEquippedRelics()[0].currentCooldown;
      expect(newCooldown).toBe(initialCooldown - 2);
    });

    it('should not go below 0', () => {
      relicLogic.equipRelic(RELICS.SEED_OF_SWIFTNESS);
      relicLogic.useActive(0);

      relicLogic.updateCooldowns(100); // More than cooldown duration

      const cooldown = relicLogic.getEquippedRelics()[0].currentCooldown;
      expect(cooldown).toBe(0);
    });

    it('should mark relic as ready when cooldown reaches 0', () => {
      relicLogic.equipRelic(RELICS.SEED_OF_SWIFTNESS);
      relicLogic.useActive(0);

      relicLogic.updateCooldowns(RELICS.SEED_OF_SWIFTNESS.active.cooldown);
      expect(relicLogic.isActiveReady(0)).toBe(true);
    });
  });

  describe('updatePassives', () => {
    it('should trigger health regen after interval', () => {
      relicLogic.equipRelic(RELICS.ROOT_OF_RESILIENCE);

      // Update just before threshold
      let triggered = relicLogic.updatePassives(29);
      expect(triggered).toHaveLength(0);

      // Update to cross threshold (30s total)
      triggered = relicLogic.updatePassives(1);
      expect(triggered).toHaveLength(1);
      expect(triggered[0].effect).toBe(PassiveEffectType.HEALTH_REGEN);
      expect(triggered[0].data.amount).toBe(1);
    });

    it('should reset regen timer after trigger', () => {
      relicLogic.equipRelic(RELICS.ROOT_OF_RESILIENCE);

      relicLogic.updatePassives(30); // First trigger
      const triggered = relicLogic.updatePassives(29); // Should not trigger yet
      expect(triggered).toHaveLength(0);
    });
  });

  describe('consumeCharge', () => {
    it('should consume a charge', () => {
      relicLogic.equipRelic(RELICS.COMBAT_CHARM);
      relicLogic.useActive(0); // Activates with 3 charges

      const consumed = relicLogic.consumeCharge(0);
      expect(consumed).toBe(true);
      expect(relicLogic.getRemainingCharges(0)).toBe(2);
    });

    it('should not consume when no charges remain', () => {
      relicLogic.equipRelic(RELICS.COMBAT_CHARM);
      // Don't activate, so charges remain at 0

      const consumed = relicLogic.consumeCharge(0);
      expect(consumed).toBe(false);
    });
  });

  describe('getTotalPassiveValue', () => {
    it('should sum passive values of same type', () => {
      relicLogic.equipRelic(RELICS.TEMPORAL_SHARD); // +10% time bonus
      relicLogic.equipRelic(RELICS.SEED_OF_SWIFTNESS); // +20% movement speed

      const timeBonus = relicLogic.getTotalPassiveValue(PassiveEffectType.TIME_BONUS);
      expect(timeBonus).toBe(0.1);

      const speedBonus = relicLogic.getTotalPassiveValue(PassiveEffectType.MOVEMENT_SPEED);
      expect(speedBonus).toBe(0.2);
    });

    it('should return 0 when no relics have the passive', () => {
      relicLogic.equipRelic(RELICS.SEED_OF_SWIFTNESS);

      const damageBonus = relicLogic.getTotalPassiveValue(PassiveEffectType.DAMAGE_BONUS);
      expect(damageBonus).toBe(0);
    });
  });

  describe('hasPassive', () => {
    it('should return true when player has the passive', () => {
      relicLogic.equipRelic(RELICS.CRYSTAL_OF_CLARITY);

      expect(relicLogic.hasPassive(PassiveEffectType.SHOW_ENEMY_HP)).toBe(true);
    });

    it('should return false when player does not have the passive', () => {
      relicLogic.equipRelic(RELICS.SEED_OF_SWIFTNESS);

      expect(relicLogic.hasPassive(PassiveEffectType.DAMAGE_BONUS)).toBe(false);
    });
  });

  describe('isFull', () => {
    it('should return false when slots are available', () => {
      relicLogic.equipRelic(RELICS.SEED_OF_SWIFTNESS);
      expect(relicLogic.isFull()).toBe(false);
    });

    it('should return true when all slots are full', () => {
      const relics = Object.values(RELICS);
      for (let i = 0; i < 5; i++) {
        relicLogic.equipRelic(relics[i]);
      }

      expect(relicLogic.isFull()).toBe(true);
    });
  });

  describe('clearAll', () => {
    it('should remove all equipped relics', () => {
      relicLogic.equipRelic(RELICS.SEED_OF_SWIFTNESS);
      relicLogic.equipRelic(RELICS.TEMPORAL_SHARD);

      relicLogic.clearAll();
      expect(relicLogic.getEquippedCount()).toBe(0);
    });
  });
});
