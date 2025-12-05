/**
 * Player Entity Tests
 * TDD approach - tests written first
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlayerLogic, PlayerConfig } from '../Player';
import { PLAYER, DISPLAY } from '../../config/Constants';

describe('PlayerLogic', () => {
  let playerLogic: PlayerLogic;
  const defaultConfig: PlayerConfig = {
    maxHealth: PLAYER.MAX_HEALTH,
    moveSpeed: PLAYER.MOVE_SPEED * DISPLAY.TILE_SIZE, // 5 tiles/sec * 16px = 80px/sec
    iFrameDuration: PLAYER.I_FRAME_DURATION,
  };

  beforeEach(() => {
    playerLogic = new PlayerLogic(defaultConfig);
    vi.useFakeTimers();
  });

  describe('Initialization', () => {
    it('should initialize with correct max health (5 HP)', () => {
      expect(playerLogic.getHealth()).toBe(5);
      expect(playerLogic.getMaxHealth()).toBe(5);
    });

    it('should initialize with correct move speed (80 pixels/sec)', () => {
      const velocity = playerLogic.calculateVelocity(1, 0);
      expect(Math.abs(velocity.x)).toBe(80);
    });

    it('should initialize without i-frames active', () => {
      expect(playerLogic.isInvulnerable()).toBe(false);
    });

    it('should not be dead initially', () => {
      expect(playerLogic.isDead()).toBe(false);
    });
  });

  describe('Movement - 8 Directions', () => {
    it('should move right (1, 0)', () => {
      const velocity = playerLogic.calculateVelocity(1, 0);
      expect(velocity.x).toBe(80);
      expect(velocity.y).toBe(0);
    });

    it('should move left (-1, 0)', () => {
      const velocity = playerLogic.calculateVelocity(-1, 0);
      expect(velocity.x).toBe(-80);
      expect(velocity.y).toBe(0);
    });

    it('should move down (0, 1)', () => {
      const velocity = playerLogic.calculateVelocity(0, 1);
      expect(velocity.x).toBe(0);
      expect(velocity.y).toBe(80);
    });

    it('should move up (0, -1)', () => {
      const velocity = playerLogic.calculateVelocity(0, -1);
      expect(velocity.x).toBe(0);
      expect(velocity.y).toBe(-80);
    });

    it('should move diagonally up-right (1, -1) with normalized speed', () => {
      const velocity = playerLogic.calculateVelocity(1, -1);
      // Diagonal should maintain 80px/sec total speed
      const magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      expect(magnitude).toBeCloseTo(80, 1);
      expect(velocity.x).toBeCloseTo(80 / Math.sqrt(2), 1);
      expect(velocity.y).toBeCloseTo(-80 / Math.sqrt(2), 1);
    });

    it('should move diagonally down-left (-1, 1) with normalized speed', () => {
      const velocity = playerLogic.calculateVelocity(-1, 1);
      const magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      expect(magnitude).toBeCloseTo(80, 1);
      expect(velocity.x).toBeCloseTo(-80 / Math.sqrt(2), 1);
      expect(velocity.y).toBeCloseTo(80 / Math.sqrt(2), 1);
    });

    it('should return zero velocity when no input (0, 0)', () => {
      const velocity = playerLogic.calculateVelocity(0, 0);
      expect(velocity.x).toBe(0);
      expect(velocity.y).toBe(0);
    });

    it('should normalize large input values', () => {
      const velocity = playerLogic.calculateVelocity(100, 0);
      expect(velocity.x).toBe(80);
      expect(velocity.y).toBe(0);
    });
  });

  describe('Health and Damage', () => {
    it('should take damage correctly', () => {
      const damaged = playerLogic.takeDamage(1);
      expect(damaged).toBe(true);
      expect(playerLogic.getHealth()).toBe(4);
    });

    it('should take multiple damage instances', () => {
      playerLogic.takeDamage(2);
      expect(playerLogic.getHealth()).toBe(3);

      vi.advanceTimersByTime(600); // Wait for i-frames to expire
      playerLogic.update(0.6);

      playerLogic.takeDamage(1);
      expect(playerLogic.getHealth()).toBe(2);
    });

    it('should not go below 0 health', () => {
      playerLogic.takeDamage(10);
      expect(playerLogic.getHealth()).toBe(0);
    });

    it('should die when health reaches 0', () => {
      playerLogic.takeDamage(5);
      expect(playerLogic.isDead()).toBe(true);
      expect(playerLogic.getHealth()).toBe(0);
    });
  });

  describe('Invincibility Frames (i-frames)', () => {
    it('should activate i-frames after taking damage', () => {
      playerLogic.takeDamage(1);
      expect(playerLogic.isInvulnerable()).toBe(true);
    });

    it('should not take damage during i-frames', () => {
      playerLogic.takeDamage(1);
      expect(playerLogic.getHealth()).toBe(4);

      const damaged = playerLogic.takeDamage(1);
      expect(damaged).toBe(false);
      expect(playerLogic.getHealth()).toBe(4); // Should still be 4
    });

    it('should expire i-frames after 0.5 seconds', () => {
      playerLogic.takeDamage(1);
      expect(playerLogic.isInvulnerable()).toBe(true);

      // Advance time by 0.4 seconds
      vi.advanceTimersByTime(400);
      playerLogic.update(0.4);
      expect(playerLogic.isInvulnerable()).toBe(true);

      // Advance time by 0.2 more seconds (total 0.6)
      vi.advanceTimersByTime(200);
      playerLogic.update(0.2);
      expect(playerLogic.isInvulnerable()).toBe(false);
    });

    it('should allow damage again after i-frames expire', () => {
      playerLogic.takeDamage(1);
      expect(playerLogic.getHealth()).toBe(4);

      // Wait for i-frames to expire
      vi.advanceTimersByTime(600);
      playerLogic.update(0.6);

      const damaged = playerLogic.takeDamage(1);
      expect(damaged).toBe(true);
      expect(playerLogic.getHealth()).toBe(3);
    });

    it('should not activate i-frames when damage is blocked', () => {
      playerLogic.takeDamage(1);
      expect(playerLogic.isInvulnerable()).toBe(true);

      // Try to take damage during i-frames (should be blocked)
      const damaged = playerLogic.takeDamage(1);
      expect(damaged).toBe(false);

      // I-frames should still be active from first hit
      expect(playerLogic.isInvulnerable()).toBe(true);
    });
  });

  describe('Attack', () => {
    it('should have an attack method', () => {
      expect(playerLogic.attack).toBeDefined();
    });

    it('should return attack state when attacking', () => {
      const result = playerLogic.attack();
      expect(result).toBe(true);
    });
  });

  describe('Health Accessors', () => {
    it('should have getHealth() accessor', () => {
      expect(playerLogic.getHealth()).toBe(5);
      playerLogic.takeDamage(2);

      vi.advanceTimersByTime(600);
      playerLogic.update(0.6);

      expect(playerLogic.getHealth()).toBe(3);
    });

    it('should have getMaxHealth() accessor', () => {
      expect(playerLogic.getMaxHealth()).toBe(5);
      playerLogic.takeDamage(3);
      expect(playerLogic.getMaxHealth()).toBe(5); // Max health shouldn't change
    });
  });

  describe('Edge Cases', () => {
    it('should handle taking 0 damage', () => {
      playerLogic.takeDamage(0);
      expect(playerLogic.getHealth()).toBe(5);
    });

    it('should handle negative damage (no healing)', () => {
      playerLogic.takeDamage(-1);
      expect(playerLogic.getHealth()).toBe(5); // Should not heal
    });

    it('should not allow damage when already dead', () => {
      playerLogic.takeDamage(5);
      expect(playerLogic.isDead()).toBe(true);

      const damaged = playerLogic.takeDamage(1);
      expect(damaged).toBe(false);
      expect(playerLogic.getHealth()).toBe(0);
    });
  });
});
