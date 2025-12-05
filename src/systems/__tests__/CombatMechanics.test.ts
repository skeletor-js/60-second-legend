/**
 * CombatMechanics Tests
 * Tests for kill streaks, combos, perfect dodges, and executes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CombatMechanicsLogic } from '../CombatMechanics';

describe('CombatMechanicsLogic', () => {
  let mechanics: CombatMechanicsLogic;

  beforeEach(() => {
    mechanics = new CombatMechanicsLogic();
  });

  // =============================================================================
  // KILL STREAK TESTS
  // =============================================================================

  describe('Kill Streaks', () => {
    it('should start with zero kill streak', () => {
      expect(mechanics.getKillStreak()).toBe(0);
    });

    it('should increment kill streak on each kill', () => {
      mechanics.registerKill();
      expect(mechanics.getKillStreak()).toBe(1);

      mechanics.registerKill();
      expect(mechanics.getKillStreak()).toBe(2);

      mechanics.registerKill();
      expect(mechanics.getKillStreak()).toBe(3);
    });

    it('should trigger streak bonus at 3 kills', () => {
      mechanics.registerKill(); // 1
      mechanics.registerKill(); // 2

      const result = mechanics.registerKill(); // 3
      expect(result).not.toBeNull();
      expect(result?.count).toBe(3);
      expect(result?.announcement).toBe('Triple!');
      expect(result?.bonus).toBe(2);
      expect(result?.color).toBe(0xffff00);
    });

    it('should trigger streak bonus at 5 kills', () => {
      for (let i = 0; i < 4; i++) {
        mechanics.registerKill();
      }

      const result = mechanics.registerKill(); // 5
      expect(result).not.toBeNull();
      expect(result?.announcement).toBe('Rampage!');
      expect(result?.bonus).toBe(5);
    });

    it('should trigger streak bonus at 8 kills', () => {
      for (let i = 0; i < 7; i++) {
        mechanics.registerKill();
      }

      const result = mechanics.registerKill(); // 8
      expect(result).not.toBeNull();
      expect(result?.announcement).toBe('Unstoppable!');
      expect(result?.bonus).toBe(10);
    });

    it('should trigger streak bonus at 12 kills', () => {
      for (let i = 0; i < 11; i++) {
        mechanics.registerKill();
      }

      const result = mechanics.registerKill(); // 12
      expect(result).not.toBeNull();
      expect(result?.announcement).toBe('LEGENDARY!');
      expect(result?.bonus).toBe(20);
    });

    it('should not trigger bonus on non-threshold kills', () => {
      mechanics.registerKill(); // 1
      expect(mechanics.registerKill()).toBeNull(); // 2
      expect(mechanics.registerKill()).not.toBeNull(); // 3 - triggers
      expect(mechanics.registerKill()).toBeNull(); // 4
    });

    it('should only trigger each threshold once', () => {
      // First time at 3
      for (let i = 0; i < 2; i++) {
        mechanics.registerKill();
      }
      expect(mechanics.registerKill()).not.toBeNull(); // 3 - triggers

      // Continue to 4, should not trigger again
      expect(mechanics.registerKill()).toBeNull(); // 4
    });

    it('should reset kill streak', () => {
      mechanics.registerKill();
      mechanics.registerKill();
      expect(mechanics.getKillStreak()).toBe(2);

      mechanics.resetKillStreak();
      expect(mechanics.getKillStreak()).toBe(0);
    });

    it('should reset streak threshold tracking on reset', () => {
      // Get to 5 kills
      for (let i = 0; i < 5; i++) {
        mechanics.registerKill();
      }

      mechanics.resetKillStreak();

      // Should trigger 3-kill bonus again
      for (let i = 0; i < 2; i++) {
        mechanics.registerKill();
      }
      const result = mechanics.registerKill();
      expect(result).not.toBeNull();
      expect(result?.announcement).toBe('Triple!');
    });
  });

  // =============================================================================
  // COMBO TESTS
  // =============================================================================

  describe('Combo System', () => {
    it('should start with zero combo', () => {
      expect(mechanics.getComboCount()).toBe(0);
    });

    it('should increment combo on hit', () => {
      mechanics.registerHit();
      expect(mechanics.getComboCount()).toBe(1);

      mechanics.registerHit();
      expect(mechanics.getComboCount()).toBe(2);
    });

    it('should reset combo timer on each hit', () => {
      mechanics.registerHit();
      expect(mechanics.getComboTimeRemaining()).toBeGreaterThan(3.9);

      // Wait a bit
      mechanics.update(1.0);
      expect(mechanics.getComboTimeRemaining()).toBeCloseTo(3.0, 1);

      // Hit again resets timer
      mechanics.registerHit();
      expect(mechanics.getComboTimeRemaining()).toBeGreaterThan(3.9);
    });

    it('should reset combo when timer expires', () => {
      mechanics.registerHit();
      mechanics.registerHit();
      expect(mechanics.getComboCount()).toBe(2);

      // Let timer expire
      mechanics.update(4.1);
      expect(mechanics.getComboCount()).toBe(0);
    });

    it('should trigger combo announcement at 5 hits', () => {
      for (let i = 0; i < 4; i++) {
        mechanics.registerHit();
      }

      const result = mechanics.registerHit(); // 5
      expect(result.count).toBe(5);
      expect(result.announcement).toBe('5-Hit Combo!');
      expect(result.multiplier).toBe(1.2);
      expect(result.color).toBe(0x00ff00);
    });

    it('should trigger combo announcement at 10 hits', () => {
      for (let i = 0; i < 9; i++) {
        mechanics.registerHit();
      }

      const result = mechanics.registerHit(); // 10
      expect(result.announcement).toBe('10-Hit Combo!');
      expect(result.multiplier).toBe(1.5);
    });

    it('should trigger combo announcement at 15 hits', () => {
      for (let i = 0; i < 14; i++) {
        mechanics.registerHit();
      }

      const result = mechanics.registerHit(); // 15
      expect(result.announcement).toBe('15-Hit Combo!');
      expect(result.multiplier).toBe(2.0);
    });

    it('should trigger combo announcement at 20 hits', () => {
      for (let i = 0; i < 19; i++) {
        mechanics.registerHit();
      }

      const result = mechanics.registerHit(); // 20
      expect(result.announcement).toBe('MAXIMUM COMBO!');
      expect(result.multiplier).toBe(2.5);
    });

    it('should return correct multiplier for combo count', () => {
      expect(mechanics.getCurrentComboMultiplier()).toBe(1.0); // 0 hits

      mechanics.registerHit();
      expect(mechanics.getCurrentComboMultiplier()).toBe(1.0); // 1-4 hits

      for (let i = 0; i < 4; i++) {
        mechanics.registerHit();
      }
      expect(mechanics.getCurrentComboMultiplier()).toBe(1.2); // 5-9 hits

      for (let i = 0; i < 5; i++) {
        mechanics.registerHit();
      }
      expect(mechanics.getCurrentComboMultiplier()).toBe(1.5); // 10-14 hits

      for (let i = 0; i < 5; i++) {
        mechanics.registerHit();
      }
      expect(mechanics.getCurrentComboMultiplier()).toBe(2.0); // 15-19 hits

      for (let i = 0; i < 5; i++) {
        mechanics.registerHit();
      }
      expect(mechanics.getCurrentComboMultiplier()).toBe(2.5); // 20+ hits
    });

    it('should maintain combo across multiple hits within window', () => {
      mechanics.registerHit();
      mechanics.update(1.0); // Wait 1 second

      mechanics.registerHit();
      mechanics.update(1.0); // Wait 1 second

      mechanics.registerHit();
      expect(mechanics.getComboCount()).toBe(3);
    });

    it('should manually reset combo', () => {
      mechanics.registerHit();
      mechanics.registerHit();
      expect(mechanics.getComboCount()).toBe(2);

      mechanics.resetCombo();
      expect(mechanics.getComboCount()).toBe(0);
      expect(mechanics.getComboTimeRemaining()).toBe(0);
    });
  });

  // =============================================================================
  // PERFECT DODGE TESTS
  // =============================================================================

  describe('Perfect Dodge', () => {
    it('should not be active initially', () => {
      expect(mechanics.isPerfectDodgeActive()).toBe(false);
    });

    it('should activate perfect dodge within window', () => {
      const currentTime = 1.0;
      mechanics.updateDodgeTime(currentTime);

      // Attempt dodge within 150ms window
      const result = mechanics.attemptPerfectDodge(currentTime + 0.1);
      expect(result).not.toBeNull();
      expect(result?.timeReward).toBe(1);
      expect(result?.damageMultiplier).toBe(2);
      expect(result?.iFrameDuration).toBe(0.3);
      expect(mechanics.isPerfectDodgeActive()).toBe(true);
    });

    it('should not activate perfect dodge outside window', () => {
      const currentTime = 1.0;
      mechanics.updateDodgeTime(currentTime);

      // Attempt dodge after 200ms (outside 150ms window)
      const result = mechanics.attemptPerfectDodge(currentTime + 0.2);
      expect(result).toBeNull();
      expect(mechanics.isPerfectDodgeActive()).toBe(false);
    });

    it('should activate at exact window boundary', () => {
      const currentTime = 1.0;
      mechanics.updateDodgeTime(currentTime);

      // Attempt dodge at exactly 150ms
      const result = mechanics.attemptPerfectDodge(currentTime + 0.15);
      expect(result).not.toBeNull();
    });

    it('should consume perfect dodge', () => {
      const currentTime = 1.0;
      mechanics.updateDodgeTime(currentTime);
      mechanics.attemptPerfectDodge(currentTime + 0.1);

      expect(mechanics.isPerfectDodgeActive()).toBe(true);
      mechanics.consumePerfectDodge();
      expect(mechanics.isPerfectDodgeActive()).toBe(false);
    });

    it('should apply damage multiplier when perfect dodge active', () => {
      const currentTime = 1.0;
      mechanics.updateDodgeTime(currentTime);
      mechanics.attemptPerfectDodge(currentTime + 0.1);

      const damage = mechanics.calculateDamage(10);
      expect(damage).toBe(20); // 2x multiplier
    });

    it('should not apply multiplier when perfect dodge inactive', () => {
      const damage = mechanics.calculateDamage(10);
      expect(damage).toBe(10); // No multiplier
    });
  });

  // =============================================================================
  // EXECUTE TESTS
  // =============================================================================

  describe('Execute Mechanic', () => {
    // NOTE: Execute mechanic is currently DISABLED (EXECUTE_THRESHOLD = 0)
    // These tests verify that execute always returns false when disabled

    it('should not execute when threshold is 0 (disabled)', () => {
      // With threshold at 0, no enemy should be executable
      expect(mechanics.canExecute(2, 10)).toBe(false);
      expect(mechanics.canExecute(1, 10)).toBe(false);
    });

    it('should not execute enemy above 0% health (disabled)', () => {
      expect(mechanics.canExecute(3, 10)).toBe(false);
      expect(mechanics.canExecute(5, 10)).toBe(false);
      expect(mechanics.canExecute(10, 10)).toBe(false);
    });

    it('should not execute at any threshold when disabled', () => {
      // Execute is disabled, so never executable
      expect(mechanics.canExecute(2, 10)).toBe(false);
    });

    it('should not execute dead enemy', () => {
      expect(mechanics.canExecute(0, 10)).toBe(false);
    });

    it('should return execute data when processing', () => {
      const result = mechanics.processExecute();
      expect(result.wasExecute).toBe(true);
      expect(result.bonusTime).toBe(2);
    });

    it('should not execute with any health pool when disabled', () => {
      // Execute is disabled (threshold = 0), so all checks return false
      // 100 HP enemy
      expect(mechanics.canExecute(20, 100)).toBe(false);
      expect(mechanics.canExecute(21, 100)).toBe(false);

      // 5 HP enemy
      expect(mechanics.canExecute(1, 5)).toBe(false);
      expect(mechanics.canExecute(2, 5)).toBe(false);

      // 1 HP enemy
      expect(mechanics.canExecute(1, 1)).toBe(false);
    });
  });

  // =============================================================================
  // INTEGRATION TESTS
  // =============================================================================

  describe('Integration', () => {
    it('should track kill streak and combo independently', () => {
      mechanics.registerKill();
      mechanics.registerHit();
      mechanics.registerHit();

      expect(mechanics.getKillStreak()).toBe(1);
      expect(mechanics.getComboCount()).toBe(2);
    });

    it('should reset kill streak but not combo when damaged', () => {
      mechanics.registerKill();
      mechanics.registerKill();
      mechanics.registerHit();
      mechanics.registerHit();

      mechanics.resetKillStreak();

      expect(mechanics.getKillStreak()).toBe(0);
      expect(mechanics.getComboCount()).toBe(2); // Unchanged
    });

    it('should apply perfect dodge multiplier to damage calculation', () => {
      const currentTime = 1.0;
      mechanics.updateDodgeTime(currentTime);
      mechanics.attemptPerfectDodge(currentTime + 0.1);

      const baseDamage = 15;
      const finalDamage = mechanics.calculateDamage(baseDamage);

      expect(finalDamage).toBe(30); // 2x multiplier
    });

    it('should handle complex combat scenario', () => {
      // Build up combo
      for (let i = 0; i < 5; i++) {
        mechanics.registerHit();
      }
      expect(mechanics.getComboCount()).toBe(5);
      expect(mechanics.getCurrentComboMultiplier()).toBe(1.2);

      // Get some kills
      mechanics.registerKill();
      mechanics.registerKill();
      const streakResult = mechanics.registerKill();
      expect(streakResult).not.toBeNull();
      expect(streakResult?.announcement).toBe('Triple!');

      // Perfect dodge
      const currentTime = 1.0;
      mechanics.updateDodgeTime(currentTime);
      const dodgeResult = mechanics.attemptPerfectDodge(currentTime + 0.1);
      expect(dodgeResult).not.toBeNull();

      // Damage with all multipliers
      const damage = mechanics.calculateDamage(10);
      expect(damage).toBe(20); // Perfect dodge multiplier
    });
  });
});
