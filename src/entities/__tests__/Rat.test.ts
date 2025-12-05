/**
 * Rat Enemy Tests
 * TDD approach - testing rat-specific pack behavior
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RatLogic } from '../enemies/Rat';
import { ENEMIES } from '../../config/Constants';

describe('RatLogic', () => {
  let ratLogic: RatLogic;

  beforeEach(() => {
    ratLogic = new RatLogic(ENEMIES.RAT);
  });

  describe('Initialization', () => {
    it('should initialize with correct stats from ENEMIES.RAT config', () => {
      expect(ratLogic.getHealth()).toBe(1);
      expect(ratLogic.getMaxHealth()).toBe(1);
      expect(ratLogic.getMoveSpeed()).toBe(40);
      expect(ratLogic.getDamage()).toBe(1);
      expect(ratLogic.getTimeReward()).toBe(1);
    });

    it('should not be dead initially', () => {
      expect(ratLogic.isDead()).toBe(false);
    });
  });

  describe('Solo Behavior (No Pack)', () => {
    it('should chase player when no pack members exist', () => {
      // Rat at (0, 0), player at (100, 0), no pack
      const velocity = ratLogic.calculatePackVelocity(0, 0, 100, 0, []);

      expect(velocity.x).toBe(40); // Moving right at 40 px/s
      expect(velocity.y).toBe(0);
    });

    it('should respect moveSpeed when alone', () => {
      // Rat at (0, 0), player far away at (1000, 0)
      const velocity = ratLogic.calculatePackVelocity(0, 0, 1000, 0, []);

      const magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      expect(magnitude).toBeCloseTo(40, 1);
    });

    it('should chase diagonally when alone', () => {
      // Rat at (0, 0), player at (10, 10)
      const velocity = ratLogic.calculatePackVelocity(0, 0, 10, 10, []);

      const magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      expect(magnitude).toBeCloseTo(40, 1);
      expect(velocity.x).toBeCloseTo(40 / Math.sqrt(2), 1);
      expect(velocity.y).toBeCloseTo(40 / Math.sqrt(2), 1);
    });
  });

  describe('Pack Behavior', () => {
    it('should move toward pack center when pack exists', () => {
      // Rat at (0, 0), player at (100, 0), pack at (50, 0)
      const packPositions = [{ x: 50, y: 0 }];
      const velocity = ratLogic.calculatePackVelocity(
        0,
        0,
        100,
        0,
        packPositions
      );

      // Velocity should be between pure player chase (40, 0) and pack center (40, 0)
      // Since pack is between rat and player, both pull in same direction
      expect(velocity.x).toBeGreaterThan(0);
      expect(velocity.y).toBe(0);
    });

    it('should balance player chase (70%) and pack cohesion (30%)', () => {
      // Rat at (0, 0)
      // Player at (100, 0) - right
      // Pack at (0, 100) - down
      const packPositions = [{ x: 0, y: 100 }];
      const velocity = ratLogic.calculatePackVelocity(
        0,
        0,
        100,
        0,
        packPositions
      );

      // Should move right (toward player) more than down (toward pack)
      expect(velocity.x).toBeGreaterThan(0);
      expect(velocity.y).toBeGreaterThan(0);
      // X component should be larger due to 70% weight
      expect(Math.abs(velocity.x)).toBeGreaterThan(Math.abs(velocity.y));
    });

    it('should maintain total speed with pack behavior', () => {
      // Rat at (0, 0), player at (100, 100), pack at (50, 50)
      const packPositions = [{ x: 50, y: 50 }];
      const velocity = ratLogic.calculatePackVelocity(
        0,
        0,
        100,
        100,
        packPositions
      );

      const magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      expect(magnitude).toBeCloseTo(40, 1);
    });

    it('should calculate pack center from multiple rats', () => {
      // Rat at (0, 0)
      // Player at (100, 0)
      // Pack members at (50, 0), (50, 100), (50, -100)
      // Pack center: (50, 0)
      const packPositions = [
        { x: 50, y: 0 },
        { x: 50, y: 100 },
        { x: 50, y: -100 },
      ];
      const velocity = ratLogic.calculatePackVelocity(
        0,
        0,
        100,
        0,
        packPositions
      );

      // Pack center is at (50, 0), same as player direction
      // Both player chase and pack cohesion pull right
      expect(velocity.x).toBeGreaterThan(0);
      // Y components from pack should cancel out
      expect(Math.abs(velocity.y)).toBeLessThan(5);
    });

    it('should move primarily toward player when pack is behind player', () => {
      // Rat at (0, 0)
      // Player at (50, 0)
      // Pack at (100, 0) - beyond player
      const packPositions = [{ x: 100, y: 0 }];
      const velocity = ratLogic.calculatePackVelocity(
        0,
        0,
        50,
        0,
        packPositions
      );

      // Both player and pack are in same direction (right)
      expect(velocity.x).toBeCloseTo(40, 1);
      expect(velocity.y).toBe(0);
    });

    it('should be pulled back when pack is behind rat', () => {
      // Rat at (100, 0)
      // Player at (200, 0) - ahead
      // Pack at (0, 0) - behind
      const packPositions = [{ x: 0, y: 0 }];
      const velocity = ratLogic.calculatePackVelocity(
        100,
        0,
        200,
        0,
        packPositions
      );

      // Player chase pulls right (70%), pack pulls left (30%)
      // Net should still be right but reduced
      expect(velocity.x).toBeGreaterThan(0);
      const magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      expect(magnitude).toBeCloseTo(40, 1);
    });
  });

  describe('Edge Cases', () => {
    it('should return zero velocity when at same position as player (no pack)', () => {
      const velocity = ratLogic.calculatePackVelocity(50, 50, 50, 50, []);
      expect(velocity.x).toBe(0);
      expect(velocity.y).toBe(0);
    });

    it('should chase player when at pack center', () => {
      // Rat at (50, 50), player at (100, 100), pack at (50, 50)
      const packPositions = [{ x: 50, y: 50 }];
      const velocity = ratLogic.calculatePackVelocity(
        50,
        50,
        100,
        100,
        packPositions
      );

      // At pack center, only player chase matters
      const magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      expect(magnitude).toBeCloseTo(40, 1);
      expect(velocity.x).toBeGreaterThan(0);
      expect(velocity.y).toBeGreaterThan(0);
    });

    it('should handle empty pack array', () => {
      const velocity = ratLogic.calculatePackVelocity(0, 0, 100, 0, []);
      expect(velocity.x).toBe(40);
      expect(velocity.y).toBe(0);
    });

    it('should die from 1 damage (1 HP)', () => {
      const result = ratLogic.takeDamage(1);
      expect(result.died).toBe(true);
      expect(result.timeReward).toBe(1); // RAT time reward
      expect(ratLogic.isDead()).toBe(true);
    });

    it('should not take damage when already dead', () => {
      ratLogic.takeDamage(1); // Kill rat
      expect(ratLogic.isDead()).toBe(true);

      const result = ratLogic.takeDamage(1);
      expect(result.died).toBe(false);
      expect(result.timeReward).toBe(0);
    });
  });

  describe('Pack Size Effects', () => {
    it('should handle single pack member', () => {
      const packPositions = [{ x: 50, y: 50 }];
      const velocity = ratLogic.calculatePackVelocity(
        0,
        0,
        100,
        0,
        packPositions
      );

      const magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      expect(magnitude).toBeCloseTo(40, 1);
    });

    it('should handle large pack (5 members)', () => {
      const packPositions = [
        { x: 40, y: 40 },
        { x: 50, y: 50 },
        { x: 60, y: 60 },
        { x: 45, y: 55 },
        { x: 55, y: 45 },
      ];
      const velocity = ratLogic.calculatePackVelocity(
        0,
        0,
        100,
        100,
        packPositions
      );

      const magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      expect(magnitude).toBeCloseTo(40, 1);
    });
  });

  describe('Movement Priorities', () => {
    it('should prioritize player over pack (70/30 split)', () => {
      // Setup where player and pack are in opposite directions
      // Rat at (50, 50)
      // Player at (100, 50) - right
      // Pack at (0, 50) - left
      const packPositions = [{ x: 0, y: 50 }];
      const velocity = ratLogic.calculatePackVelocity(
        50,
        50,
        100,
        50,
        packPositions
      );

      // Should move right (toward player) since player has 70% weight
      expect(velocity.x).toBeGreaterThan(0);
      expect(velocity.y).toBeCloseTo(0, 1);
    });

    it('should move diagonally when player and pack are perpendicular', () => {
      // Rat at (0, 0)
      // Player at (100, 0) - right
      // Pack at (0, 100) - down
      const packPositions = [{ x: 0, y: 100 }];
      const velocity = ratLogic.calculatePackVelocity(
        0,
        0,
        100,
        0,
        packPositions
      );

      // Should move right-down diagonal
      expect(velocity.x).toBeGreaterThan(0);
      expect(velocity.y).toBeGreaterThan(0);
      // X should be larger (70% weight to player)
      expect(velocity.x).toBeGreaterThan(velocity.y);
    });
  });

  describe('Velocity Normalization', () => {
    it('should always return normalized velocity at moveSpeed', () => {
      // Test various positions
      const positions = [
        { rat: { x: 0, y: 0 }, player: { x: 100, y: 0 }, pack: [] },
        { rat: { x: 0, y: 0 }, player: { x: 100, y: 100 }, pack: [] },
        {
          rat: { x: 50, y: 50 },
          player: { x: 0, y: 0 },
          pack: [{ x: 100, y: 100 }],
        },
        {
          rat: { x: 25, y: 75 },
          player: { x: 200, y: 200 },
          pack: [{ x: 50, y: 50 }],
        },
      ];

      positions.forEach((pos) => {
        const velocity = ratLogic.calculatePackVelocity(
          pos.rat.x,
          pos.rat.y,
          pos.player.x,
          pos.player.y,
          pos.pack
        );

        const magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
        // Should be close to 40 (moveSpeed) unless at target position
        if (magnitude > 0) {
          expect(magnitude).toBeCloseTo(40, 1);
        }
      });
    });
  });
});
