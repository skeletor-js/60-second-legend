/**
 * Enemy Entity Tests
 * TDD approach - tests written first
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EnemyLogic, EnemyConfig } from '../Enemy';
import { TIME_EXTENSIONS } from '../../config/Constants';

describe('EnemyLogic', () => {
  let enemyLogic: EnemyLogic;
  const defaultConfig: EnemyConfig = {
    maxHealth: 3,
    moveSpeed: 40,
    damage: 1,
    timeReward: 3,
  };

  beforeEach(() => {
    enemyLogic = new EnemyLogic(defaultConfig);
  });

  describe('Initialization', () => {
    it('should initialize with correct stats from config', () => {
      expect(enemyLogic.getHealth()).toBe(3);
      expect(enemyLogic.getMaxHealth()).toBe(3);
      expect(enemyLogic.getMoveSpeed()).toBe(40);
      expect(enemyLogic.getDamage()).toBe(1);
      expect(enemyLogic.getTimeReward()).toBe(3);
    });

    it('should not be dead initially', () => {
      expect(enemyLogic.isDead()).toBe(false);
    });
  });

  describe('Health and Damage', () => {
    it('should reduce health when taking damage', () => {
      const result = enemyLogic.takeDamage(1);
      expect(result.died).toBe(false);
      expect(result.timeReward).toBe(0);
      expect(enemyLogic.getHealth()).toBe(2);
    });

    it('should not go below 0 HP', () => {
      enemyLogic.takeDamage(10);
      expect(enemyLogic.getHealth()).toBe(0);
    });

    it('should die at 0 HP and set isDead = true', () => {
      enemyLogic.takeDamage(3);
      expect(enemyLogic.getHealth()).toBe(0);
      expect(enemyLogic.isDead()).toBe(true);
    });

    it('should return died=true and timeReward when killed', () => {
      enemyLogic.takeDamage(2); // 3 -> 1 HP
      const result = enemyLogic.takeDamage(1); // 1 -> 0 HP (dies)

      expect(result.died).toBe(true);
      expect(result.timeReward).toBe(3);
    });

    it('should not take damage when already dead', () => {
      enemyLogic.takeDamage(3); // Kill it
      expect(enemyLogic.isDead()).toBe(true);

      const result = enemyLogic.takeDamage(1);
      expect(result.died).toBe(false);
      expect(result.timeReward).toBe(0);
      expect(enemyLogic.getHealth()).toBe(0);
    });
  });

  describe('Chase AI', () => {
    it('should calculate velocity toward target', () => {
      // Enemy at (0, 0), target at (100, 0)
      const velocity = enemyLogic.calculateChaseVelocity(0, 0, 100, 0);

      expect(velocity.x).toBe(40); // Moving right at full speed
      expect(velocity.y).toBe(0);
    });

    it('should respect moveSpeed limit', () => {
      // Enemy at (0, 0), target at (1000, 0) - far away
      const velocity = enemyLogic.calculateChaseVelocity(0, 0, 1000, 0);

      // Velocity magnitude should equal moveSpeed
      const magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      expect(magnitude).toBeCloseTo(40, 1);
    });

    it('should calculate diagonal chase velocity correctly', () => {
      // Enemy at (0, 0), target at (10, 10) - diagonal
      const velocity = enemyLogic.calculateChaseVelocity(0, 0, 10, 10);

      // Should move at 45-degree angle with total speed = moveSpeed
      const magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      expect(magnitude).toBeCloseTo(40, 1);
      expect(velocity.x).toBeCloseTo(40 / Math.sqrt(2), 1);
      expect(velocity.y).toBeCloseTo(40 / Math.sqrt(2), 1);
    });

    it('should return zero velocity when at same position as target', () => {
      const velocity = enemyLogic.calculateChaseVelocity(50, 50, 50, 50);

      expect(velocity.x).toBe(0);
      expect(velocity.y).toBe(0);
    });

    it('should chase left when target is to the left', () => {
      // Enemy at (100, 0), target at (0, 0)
      const velocity = enemyLogic.calculateChaseVelocity(100, 0, 0, 0);

      expect(velocity.x).toBe(-40); // Moving left
      expect(velocity.y).toBe(0);
    });

    it('should chase up when target is above', () => {
      // Enemy at (0, 100), target at (0, 0)
      const velocity = enemyLogic.calculateChaseVelocity(0, 100, 0, 0);

      expect(velocity.x).toBe(0);
      expect(velocity.y).toBe(-40); // Moving up
    });

    it('should chase down when target is below', () => {
      // Enemy at (0, 0), target at (0, 100)
      const velocity = enemyLogic.calculateChaseVelocity(0, 0, 0, 100);

      expect(velocity.x).toBe(0);
      expect(velocity.y).toBe(40); // Moving down
    });
  });

  describe('Getters', () => {
    it('should have getHealth() accessor', () => {
      expect(enemyLogic.getHealth()).toBe(3);
      enemyLogic.takeDamage(1);
      expect(enemyLogic.getHealth()).toBe(2);
    });

    it('should have getMaxHealth() accessor', () => {
      expect(enemyLogic.getMaxHealth()).toBe(3);
      enemyLogic.takeDamage(2);
      expect(enemyLogic.getMaxHealth()).toBe(3); // Max health shouldn't change
    });

    it('should have getMoveSpeed() accessor', () => {
      expect(enemyLogic.getMoveSpeed()).toBe(40);
    });

    it('should have getDamage() accessor', () => {
      expect(enemyLogic.getDamage()).toBe(1);
    });

    it('should have getTimeReward() accessor', () => {
      expect(enemyLogic.getTimeReward()).toBe(3);
    });
  });
});

describe('Slime Enemy Variant', () => {
  it('should have correct maxHealth (2)', () => {
    // This will be tested after Slime.ts is created
    // For now, we're just testing the config
    const slimeConfig: EnemyConfig = {
      maxHealth: 2,
      moveSpeed: 30,
      damage: 1,
      timeReward: TIME_EXTENSIONS.ENEMY_KILL,
    };

    const slime = new EnemyLogic(slimeConfig);
    expect(slime.getMaxHealth()).toBe(2);
  });

  it('should have correct moveSpeed (30)', () => {
    const slimeConfig: EnemyConfig = {
      maxHealth: 2,
      moveSpeed: 30,
      damage: 1,
      timeReward: TIME_EXTENSIONS.ENEMY_KILL,
    };

    const slime = new EnemyLogic(slimeConfig);
    expect(slime.getMoveSpeed()).toBe(30);
  });

  it('should have correct damage (1)', () => {
    const slimeConfig: EnemyConfig = {
      maxHealth: 2,
      moveSpeed: 30,
      damage: 1,
      timeReward: TIME_EXTENSIONS.ENEMY_KILL,
    };

    const slime = new EnemyLogic(slimeConfig);
    expect(slime.getDamage()).toBe(1);
  });

  it('should have correct timeReward (3 from TIME_EXTENSIONS.ENEMY_KILL)', () => {
    const slimeConfig: EnemyConfig = {
      maxHealth: 2,
      moveSpeed: 30,
      damage: 1,
      timeReward: TIME_EXTENSIONS.ENEMY_KILL,
    };

    const slime = new EnemyLogic(slimeConfig);
    expect(slime.getTimeReward()).toBe(3);
    expect(slime.getTimeReward()).toBe(TIME_EXTENSIONS.ENEMY_KILL);
  });
});
