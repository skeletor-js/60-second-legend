import { describe, it, expect, beforeEach } from 'vitest';
import { CombatLogic, AttackData, HitResult, CombatConfig } from '../CombatSystem';
import { EnemyLogic, EnemyConfig } from '@entities/Enemy';
import { COMBAT, TIME_EXTENSIONS } from '@config/Constants';

describe('CombatLogic', () => {
  let combatLogic: CombatLogic;

  beforeEach(() => {
    combatLogic = new CombatLogic();
  });

  describe('Initialization', () => {
    it('should initialize with default values from Constants', () => {
      const logic = new CombatLogic();
      expect(logic).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<CombatConfig> = {
        weaponDamage: 10,
        attackCooldown: 1.0,
        attackRange: 50,
        knockbackForce: 200,
      };
      const logic = new CombatLogic(customConfig);
      expect(logic).toBeDefined();
    });
  });

  describe('Attack System', () => {
    it('creates attack data at player position with direction', () => {
      const attackData = combatLogic.startAttack(100, 200, { x: 1, y: 0 });

      expect(attackData).toBeDefined();
      expect(attackData?.x).toBe(100);
      expect(attackData?.y).toBe(200);
      expect(attackData?.direction).toEqual({ x: 1, y: 0 });
    });

    it('attack has correct range (24 pixels)', () => {
      const attackData = combatLogic.startAttack(0, 0, { x: 1, y: 0 });

      expect(attackData?.range).toBe(COMBAT.ATTACK_RANGE);
    });

    it('attack has correct damage (3 for Memory Blade)', () => {
      const attackData = combatLogic.startAttack(0, 0, { x: 1, y: 0 });

      expect(attackData?.damage).toBe(COMBAT.MEMORY_BLADE_DAMAGE);
    });

    it('attack has cooldown (0.4 seconds)', () => {
      combatLogic.startAttack(0, 0, { x: 1, y: 0 });

      expect(combatLogic.canAttack()).toBe(false);
    });

    it('cannot attack during cooldown', () => {
      // First attack succeeds
      const firstAttack = combatLogic.startAttack(0, 0, { x: 1, y: 0 });
      expect(firstAttack).not.toBeNull();

      // Second attack immediately after fails
      const secondAttack = combatLogic.startAttack(0, 0, { x: 1, y: 0 });
      expect(secondAttack).toBeNull();
    });

    it('cooldown resets after duration', () => {
      // Perform attack
      combatLogic.startAttack(0, 0, { x: 1, y: 0 });
      expect(combatLogic.canAttack()).toBe(false);

      // Update for cooldown duration
      combatLogic.update(COMBAT.ATTACK_COOLDOWN);

      // Should be able to attack again
      expect(combatLogic.canAttack()).toBe(true);
    });

    it('cooldown decrements properly with partial updates', () => {
      combatLogic.startAttack(0, 0, { x: 1, y: 0 });

      // Update halfway through cooldown
      combatLogic.update(COMBAT.ATTACK_COOLDOWN / 2);
      expect(combatLogic.canAttack()).toBe(false);

      // Update the rest of the way
      combatLogic.update(COMBAT.ATTACK_COOLDOWN / 2);
      expect(combatLogic.canAttack()).toBe(true);
    });
  });

  describe('Damage Calculation', () => {
    it('calculateDamage returns weapon damage', () => {
      const damage = combatLogic.calculateDamage();
      expect(damage).toBe(COMBAT.MEMORY_BLADE_DAMAGE);
    });

    it('calculateDamage respects custom weapon damage', () => {
      const customLogic = new CombatLogic({ weaponDamage: 5 });
      const damage = customLogic.calculateDamage();
      expect(damage).toBe(5);
    });
  });

  describe('Knockback', () => {
    it('calculateKnockback returns force vector away from attacker', () => {
      // Attacker at (0, 0), target at (100, 0) - should knock right
      const knockback = combatLogic.calculateKnockback(0, 0, 100, 0);

      expect(knockback.x).toBeGreaterThan(0);
      expect(knockback.y).toBe(0);
    });

    it('knockback force is 150 pixels/sec', () => {
      const knockback = combatLogic.calculateKnockback(0, 0, 100, 0);

      // Calculate magnitude
      const magnitude = Math.sqrt(knockback.x ** 2 + knockback.y ** 2);
      expect(magnitude).toBeCloseTo(COMBAT.KNOCKBACK_FORCE, 1);
    });

    it('knockback direction is normalized', () => {
      // Test at 45-degree angle
      const knockback = combatLogic.calculateKnockback(0, 0, 100, 100);

      // Both components should be equal for 45-degree angle
      expect(Math.abs(knockback.x)).toBeCloseTo(Math.abs(knockback.y), 1);

      // Magnitude should still be KNOCKBACK_FORCE
      const magnitude = Math.sqrt(knockback.x ** 2 + knockback.y ** 2);
      expect(magnitude).toBeCloseTo(COMBAT.KNOCKBACK_FORCE, 1);
    });

    it('handles zero distance by returning default knockback', () => {
      // Attacker and target at same position
      const knockback = combatLogic.calculateKnockback(50, 50, 50, 50);

      // Should return some default knockback (spec says right direction)
      expect(knockback.x).toBe(COMBAT.KNOCKBACK_FORCE);
      expect(knockback.y).toBe(0);
    });

    it('knockback works in all directions', () => {
      // Test left
      const left = combatLogic.calculateKnockback(100, 0, 0, 0);
      expect(left.x).toBeLessThan(0);

      // Test up
      const up = combatLogic.calculateKnockback(0, 100, 0, 0);
      expect(up.y).toBeLessThan(0);

      // Test down
      const down = combatLogic.calculateKnockback(0, 0, 0, 100);
      expect(down.y).toBeGreaterThan(0);
    });
  });

  describe('Hit Processing', () => {
    let enemyLogic: EnemyLogic;

    beforeEach(() => {
      const enemyConfig: EnemyConfig = {
        maxHealth: 10,
        moveSpeed: 50,
        damage: 1,
        timeReward: TIME_EXTENSIONS.ENEMY_KILL,
      };
      enemyLogic = new EnemyLogic(enemyConfig);
    });

    it('applies damage to enemy using EnemyLogic.takeDamage', () => {
      const initialHealth = enemyLogic.getHealth();

      combatLogic.processHit(enemyLogic, 0, 0, 100, 0);

      expect(enemyLogic.getHealth()).toBe(initialHealth - COMBAT.MEMORY_BLADE_DAMAGE);
    });

    it('returns hit result with damage amount', () => {
      const result = combatLogic.processHit(enemyLogic, 0, 0, 100, 0);

      expect(result.hit).toBe(true);
      expect(result.damage).toBe(COMBAT.MEMORY_BLADE_DAMAGE);
    });

    it('returns knockback vector in hit result', () => {
      const result = combatLogic.processHit(enemyLogic, 0, 0, 100, 0);

      expect(result.knockback).toBeDefined();
      expect(result.knockback.x).toBeGreaterThan(0);
    });

    it('detects when enemy dies from attack', () => {
      // Create enemy with low health
      const weakEnemy = new EnemyLogic({
        maxHealth: 2,
        moveSpeed: 50,
        damage: 1,
        timeReward: TIME_EXTENSIONS.ENEMY_KILL,
      });

      const result = combatLogic.processHit(weakEnemy, 0, 0, 100, 0);

      expect(result.killed).toBe(true);
    });

    it('returns time reward on kill (3 seconds)', () => {
      // Create enemy with low health
      const weakEnemy = new EnemyLogic({
        maxHealth: 2,
        moveSpeed: 50,
        damage: 1,
        timeReward: TIME_EXTENSIONS.ENEMY_KILL,
      });

      const result = combatLogic.processHit(weakEnemy, 0, 0, 100, 0);

      expect(result.killed).toBe(true);
      expect(result.timeReward).toBe(TIME_EXTENSIONS.ENEMY_KILL);
    });

    it('returns zero time reward when enemy survives', () => {
      const result = combatLogic.processHit(enemyLogic, 0, 0, 100, 0);

      expect(result.killed).toBe(false);
      expect(result.timeReward).toBe(0);
    });
  });

  describe('Attack Range Detection', () => {
    it('isInRange returns true when target is within range', () => {
      const attackData: AttackData = {
        x: 0,
        y: 0,
        direction: { x: 1, y: 0 },
        range: COMBAT.ATTACK_RANGE,
        damage: COMBAT.MEMORY_BLADE_DAMAGE,
      };

      // Target at exactly the range limit
      expect(combatLogic.isInRange(attackData, COMBAT.ATTACK_RANGE, 0)).toBe(true);

      // Target within range
      expect(combatLogic.isInRange(attackData, 10, 0)).toBe(true);
    });

    it('isInRange returns false when target is beyond range', () => {
      const attackData: AttackData = {
        x: 0,
        y: 0,
        direction: { x: 1, y: 0 },
        range: COMBAT.ATTACK_RANGE,
        damage: COMBAT.MEMORY_BLADE_DAMAGE,
      };

      // Target beyond range
      expect(combatLogic.isInRange(attackData, COMBAT.ATTACK_RANGE + 1, 0)).toBe(false);
      expect(combatLogic.isInRange(attackData, 100, 100)).toBe(false);
    });
  });

  describe('Update Method', () => {
    it('does not affect cooldown when not attacking', () => {
      expect(combatLogic.canAttack()).toBe(true);

      combatLogic.update(1.0);

      expect(combatLogic.canAttack()).toBe(true);
    });

    it('handles zero delta time', () => {
      combatLogic.startAttack(0, 0, { x: 1, y: 0 });

      combatLogic.update(0);

      // Should still be on cooldown
      expect(combatLogic.canAttack()).toBe(false);
    });

    it('does not allow cooldown to go negative', () => {
      combatLogic.startAttack(0, 0, { x: 1, y: 0 });

      // Update with excessive time
      combatLogic.update(999);

      expect(combatLogic.canAttack()).toBe(true);

      // Should still be able to attack after
      const attackData = combatLogic.startAttack(0, 0, { x: 1, y: 0 });
      expect(attackData).not.toBeNull();
    });
  });
});
