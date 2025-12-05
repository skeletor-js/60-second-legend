/**
 * Bat Enemy Tests
 * TDD approach - testing bat-specific behavior
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BatLogic } from '../enemies/Bat';
import { ENEMIES } from '../../config/Constants';

describe('BatLogic', () => {
  let batLogic: BatLogic;

  beforeEach(() => {
    batLogic = new BatLogic(ENEMIES.BAT);
  });

  describe('Initialization', () => {
    it('should initialize with correct stats from ENEMIES.BAT config', () => {
      expect(batLogic.getHealth()).toBe(1);
      expect(batLogic.getMaxHealth()).toBe(1);
      expect(batLogic.getMoveSpeed()).toBe(60);
      expect(batLogic.getDamage()).toBe(1);
      expect(batLogic.getTimeReward()).toBe(2);
    });

    it('should start in charging state', () => {
      expect(batLogic.isChargingState()).toBe(true);
    });

    it('should have zero timers initially', () => {
      expect(batLogic.getChargeTimer()).toBe(0);
      expect(batLogic.getRetreatTimer()).toBe(0);
    });
  });

  describe('AI State Management', () => {
    it('should remain in charge state during charge duration', () => {
      // Update for 1 second (less than 1.5s charge duration)
      batLogic.updateAI(1.0);
      expect(batLogic.isChargingState()).toBe(true);
      expect(batLogic.getChargeTimer()).toBe(1.0);
    });

    it('should switch to retreat state after charge duration', () => {
      // Update for 1.5 seconds (charge duration)
      batLogic.updateAI(1.5);
      expect(batLogic.isChargingState()).toBe(false);
      expect(batLogic.getChargeTimer()).toBe(0); // Timer resets
    });

    it('should remain in retreat state during retreat duration', () => {
      // First charge, then retreat for 0.5s (less than 1s retreat duration)
      batLogic.updateAI(1.5); // Charge complete
      batLogic.updateAI(0.5); // Retreating
      expect(batLogic.isChargingState()).toBe(false);
      expect(batLogic.getRetreatTimer()).toBe(0.5);
    });

    it('should switch back to charge state after retreat duration', () => {
      // Charge -> Retreat -> Charge cycle
      batLogic.updateAI(1.5); // Charge complete
      expect(batLogic.isChargingState()).toBe(false);

      batLogic.updateAI(1.0); // Retreat complete
      expect(batLogic.isChargingState()).toBe(true);
      expect(batLogic.getRetreatTimer()).toBe(0); // Timer resets
    });

    it('should cycle between charge and retreat states', () => {
      // First cycle
      batLogic.updateAI(1.5); // Charge
      expect(batLogic.isChargingState()).toBe(false);

      batLogic.updateAI(1.0); // Retreat
      expect(batLogic.isChargingState()).toBe(true);

      // Second cycle
      batLogic.updateAI(1.5); // Charge again
      expect(batLogic.isChargingState()).toBe(false);

      batLogic.updateAI(1.0); // Retreat again
      expect(batLogic.isChargingState()).toBe(true);
    });

    it('should accumulate delta time across multiple updates', () => {
      // Multiple small updates should accumulate
      batLogic.updateAI(0.5);
      batLogic.updateAI(0.5);
      batLogic.updateAI(0.5);
      // Total: 1.5s - should switch to retreat
      expect(batLogic.isChargingState()).toBe(false);
    });
  });

  describe('Charge Behavior', () => {
    it('should move toward target when charging', () => {
      // Bat at (0, 0), target at (100, 0)
      const velocity = batLogic.calculateBatVelocity(0, 0, 100, 0);

      expect(velocity.x).toBe(60); // Moving right at 60 px/s
      expect(velocity.y).toBe(0);
    });

    it('should respect moveSpeed when charging', () => {
      // Bat at (0, 0), target far away at (1000, 0)
      const velocity = batLogic.calculateBatVelocity(0, 0, 1000, 0);

      const magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      expect(magnitude).toBeCloseTo(60, 1);
    });

    it('should charge diagonally correctly', () => {
      // Bat at (0, 0), target at (10, 10)
      const velocity = batLogic.calculateBatVelocity(0, 0, 10, 10);

      const magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      expect(magnitude).toBeCloseTo(60, 1);
      expect(velocity.x).toBeCloseTo(60 / Math.sqrt(2), 1);
      expect(velocity.y).toBeCloseTo(60 / Math.sqrt(2), 1);
    });
  });

  describe('Retreat Behavior', () => {
    beforeEach(() => {
      // Switch bat to retreat mode
      batLogic.updateAI(1.5);
    });

    it('should move away from target when retreating', () => {
      // Bat at (0, 0), target at (100, 0)
      // Should move LEFT (away from target on the right)
      const velocity = batLogic.calculateBatVelocity(0, 0, 100, 0);

      expect(velocity.x).toBe(-60); // Moving left at 60 px/s
      expect(Math.abs(velocity.y)).toBe(0); // Use Math.abs to handle -0 vs 0
    });

    it('should retreat at full moveSpeed', () => {
      // Bat at (50, 50), target at (100, 100)
      const velocity = batLogic.calculateBatVelocity(50, 50, 100, 100);

      const magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      expect(magnitude).toBeCloseTo(60, 1);
    });

    it('should retreat in opposite direction of target', () => {
      // Bat at (50, 50), target at (0, 0)
      // Should move away toward (100, 100) direction
      const velocity = batLogic.calculateBatVelocity(50, 50, 0, 0);

      expect(velocity.x).toBeGreaterThan(0); // Moving right (away from left target)
      expect(velocity.y).toBeGreaterThan(0); // Moving down (away from up target)
    });

    it('should retreat diagonally correctly', () => {
      // Bat at (50, 50), target at (60, 60)
      // Should retreat toward (40, 40) direction
      const velocity = batLogic.calculateBatVelocity(50, 50, 60, 60);

      const magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      expect(magnitude).toBeCloseTo(60, 1);
      expect(velocity.x).toBeLessThan(0); // Moving left
      expect(velocity.y).toBeLessThan(0); // Moving up
    });
  });

  describe('Edge Cases', () => {
    it('should return zero velocity when at same position as target', () => {
      const velocity = batLogic.calculateBatVelocity(50, 50, 50, 50);
      expect(velocity.x).toBe(0);
      expect(velocity.y).toBe(0);
    });

    it('should handle zero delta time in updateAI', () => {
      batLogic.updateAI(0);
      expect(batLogic.isChargingState()).toBe(true);
      expect(batLogic.getChargeTimer()).toBe(0);
    });

    it('should not take damage when already dead', () => {
      batLogic.takeDamage(1); // Kill bat (1 HP)
      expect(batLogic.isDead()).toBe(true);

      const result = batLogic.takeDamage(1);
      expect(result.died).toBe(false);
      expect(result.timeReward).toBe(0);
    });

    it('should die from 1 damage (1 HP)', () => {
      const result = batLogic.takeDamage(1);
      expect(result.died).toBe(true);
      expect(result.timeReward).toBe(2); // BAT time reward
      expect(batLogic.isDead()).toBe(true);
    });
  });

  describe('Velocity Direction Changes', () => {
    it('should reverse velocity direction when switching from charge to retreat', () => {
      // Charge velocity
      const chargeVel = batLogic.calculateBatVelocity(0, 0, 100, 0);
      expect(chargeVel.x).toBe(60);

      // Switch to retreat
      batLogic.updateAI(1.5);

      // Retreat velocity - should be opposite
      const retreatVel = batLogic.calculateBatVelocity(0, 0, 100, 0);
      expect(retreatVel.x).toBe(-60);
    });

    it('should maintain speed magnitude when switching states', () => {
      const chargeVel = batLogic.calculateBatVelocity(0, 0, 100, 100);
      const chargeMagnitude = Math.sqrt(
        chargeVel.x ** 2 + chargeVel.y ** 2
      );

      batLogic.updateAI(1.5); // Switch to retreat

      const retreatVel = batLogic.calculateBatVelocity(0, 0, 100, 100);
      const retreatMagnitude = Math.sqrt(
        retreatVel.x ** 2 + retreatVel.y ** 2
      );

      expect(chargeMagnitude).toBeCloseTo(retreatMagnitude, 1);
      expect(chargeMagnitude).toBeCloseTo(60, 1);
    });
  });
});
