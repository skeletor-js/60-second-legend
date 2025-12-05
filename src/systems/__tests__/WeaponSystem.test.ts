/**
 * WeaponSystem Tests
 * Tests for weapon logic, switching, and combo tracking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WeaponLogic } from '../WeaponSystem';
import { WEAPONS } from '@config/Constants';

describe('WeaponLogic', () => {
  describe('Basic weapon functionality', () => {
    let weapon: WeaponLogic;

    beforeEach(() => {
      weapon = new WeaponLogic(WEAPONS.MEMORY_BLADE);
    });

    it('should initialize with weapon stats', () => {
      expect(weapon.getStats().name).toBe('Memory Blade');
      expect(weapon.getStats().damage).toBe(3);
      expect(weapon.getStats().attackSpeed).toBe(0.6);
      expect(weapon.getStats().range).toBe(24);
    });

    it('should start with attack ready', () => {
      expect(weapon.canAttack()).toBe(true);
    });

    it('should return attack data when attacking', () => {
      const attackData = weapon.startAttack(100, 100, { x: 1, y: 0 });

      expect(attackData).not.toBeNull();
      expect(attackData?.x).toBe(100);
      expect(attackData?.y).toBe(100);
      expect(attackData?.damage).toBe(3);
      expect(attackData?.range).toBe(24);
      expect(attackData?.knockback).toBe(150);
    });

    it('should enter cooldown after attacking', () => {
      weapon.startAttack(0, 0, { x: 1, y: 0 });
      expect(weapon.canAttack()).toBe(false);
    });

    it('should return null when attacking during cooldown', () => {
      weapon.startAttack(0, 0, { x: 1, y: 0 });
      const secondAttack = weapon.startAttack(0, 0, { x: 1, y: 0 });
      expect(secondAttack).toBeNull();
    });

    it('should cooldown over time', () => {
      weapon.startAttack(0, 0, { x: 1, y: 0 });
      expect(weapon.canAttack()).toBe(false);

      // Update for half cooldown
      weapon.update(0.3);
      expect(weapon.canAttack()).toBe(false);

      // Update for remaining cooldown
      weapon.update(0.3);
      expect(weapon.canAttack()).toBe(true);
    });
  });

  describe('Swift Daggers - hits_without_damage combo', () => {
    let weapon: WeaponLogic;

    beforeEach(() => {
      weapon = new WeaponLogic(WEAPONS.SWIFT_DAGGERS);
    });

    it('should track hits', () => {
      weapon.recordHit(false); // Not a kill
      expect(weapon.getComboProgress()).toBe(1);
    });

    it('should track hits from kills', () => {
      weapon.recordHit(true); // Kill also counts as hit
      expect(weapon.getComboProgress()).toBe(1);
    });

    it('should activate combo after 5 hits', () => {
      weapon.recordHit(false);
      weapon.recordHit(false);
      weapon.recordHit(false);
      weapon.recordHit(false);
      expect(weapon.isComboReady()).toBe(false);

      weapon.recordHit(false);
      expect(weapon.isComboReady()).toBe(true);
    });

    it('should reset combo when taking damage', () => {
      weapon.recordHit(false);
      weapon.recordHit(false);
      weapon.recordHit(false);
      expect(weapon.getComboProgress()).toBe(3);

      weapon.onPlayerDamaged();
      expect(weapon.getComboProgress()).toBe(0);
      expect(weapon.isComboReady()).toBe(false);
    });

    it('should apply triple damage when combo activates', () => {
      // Build combo
      for (let i = 0; i < 5; i++) {
        weapon.recordHit(false);
      }
      expect(weapon.isComboReady()).toBe(true);

      // Next attack should have 3x damage
      const attackData = weapon.startAttack(0, 0, { x: 1, y: 0 });
      expect(attackData?.damage).toBe(3); // 1 base * 3 multiplier
    });

    it('should reset combo after activation', () => {
      // Build combo
      for (let i = 0; i < 5; i++) {
        weapon.recordHit(false);
      }
      weapon.startAttack(0, 0, { x: 1, y: 0 }); // Activate combo

      expect(weapon.isComboReady()).toBe(false);
      expect(weapon.getComboProgress()).toBe(0);
    });
  });

  describe('Memory Blade - kills_without_damage combo', () => {
    let weapon: WeaponLogic;

    beforeEach(() => {
      weapon = new WeaponLogic(WEAPONS.MEMORY_BLADE);
    });

    it('should track kills only', () => {
      weapon.recordHit(false); // Hit, not kill
      expect(weapon.getComboProgress()).toBe(0);

      weapon.recordHit(true); // Kill
      expect(weapon.getComboProgress()).toBe(1);
    });

    it('should activate combo after 3 kills', () => {
      weapon.recordHit(true);
      weapon.recordHit(true);
      expect(weapon.isComboReady()).toBe(false);

      weapon.recordHit(true);
      expect(weapon.isComboReady()).toBe(true);
    });

    it('should reset combo when taking damage', () => {
      weapon.recordHit(true);
      weapon.recordHit(true);
      weapon.onPlayerDamaged();

      expect(weapon.getComboProgress()).toBe(0);
    });

    it('should return heal effect when combo ready', () => {
      for (let i = 0; i < 3; i++) {
        weapon.recordHit(true);
      }

      const effect = weapon.getComboEffect();
      expect(effect?.type).toBe('heal');
      expect(effect?.value).toBe(1);
    });
  });

  describe('Shatter Hammer - multi_kills combo', () => {
    let weapon: WeaponLogic;

    beforeEach(() => {
      weapon = new WeaponLogic(WEAPONS.SHATTER_HAMMER);
    });

    it('should track multi-kills', () => {
      weapon.recordMultiKill(2); // Killed 2 enemies in one swing
      expect(weapon.getComboProgress()).toBe(1);
    });

    it('should not track single kills for multi-kill combo', () => {
      weapon.recordHit(true); // Single kill
      expect(weapon.getComboProgress()).toBe(0);
    });

    it('should activate combo after 2 multi-kills', () => {
      weapon.recordMultiKill(2);
      expect(weapon.isComboReady()).toBe(false);

      weapon.recordMultiKill(3);
      expect(weapon.isComboReady()).toBe(true);
    });

    it('should return stun effect when combo ready', () => {
      weapon.recordMultiKill(2);
      weapon.recordMultiKill(2);

      const effect = weapon.getComboEffect();
      expect(effect?.type).toBe('stun_aoe');
      expect(effect?.value).toBe(1.5);
      expect(effect?.radius).toBe(32);
    });

    it('should have AOE attack', () => {
      const attackData = weapon.startAttack(0, 0, { x: 1, y: 0 });
      expect(attackData?.aoeRadius).toBe(24);
    });
  });

  describe('Time rewards', () => {
    it('should return time reward for kills', () => {
      const daggers = new WeaponLogic(WEAPONS.SWIFT_DAGGERS);
      expect(daggers.getTimeReward(true)).toBe(2); // timePerKill

      const blade = new WeaponLogic(WEAPONS.MEMORY_BLADE);
      expect(blade.getTimeReward(true)).toBe(4);

      const hammer = new WeaponLogic(WEAPONS.SHATTER_HAMMER);
      expect(hammer.getTimeReward(true)).toBe(6);
    });

    it('should return time reward for hits', () => {
      const daggers = new WeaponLogic(WEAPONS.SWIFT_DAGGERS);
      expect(daggers.getTimeReward(false)).toBe(0.3); // timePerHit

      const blade = new WeaponLogic(WEAPONS.MEMORY_BLADE);
      expect(blade.getTimeReward(false)).toBe(0); // No time per hit

      const hammer = new WeaponLogic(WEAPONS.SHATTER_HAMMER);
      expect(hammer.getTimeReward(false)).toBe(0);
    });
  });
});
