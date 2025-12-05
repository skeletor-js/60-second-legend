/**
 * Player Relic Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PlayerLogic } from '../Player';

describe('PlayerLogic - Relic Integration', () => {
  let player: PlayerLogic;

  beforeEach(() => {
    player = new PlayerLogic({
      maxHealth: 5,
      moveSpeed: 80, // pixels per second
      iFrameDuration: 0.5,
    });
  });

  describe('Speed Modifier', () => {
    it('should start with no speed modifier', () => {
      expect(player.getSpeedModifier()).toBe(0);
    });

    it('should apply speed modifier to velocity', () => {
      // Set +20% speed modifier (Seed of Swiftness)
      player.setSpeedModifier(0.2);

      const velocity = player.calculateVelocity(1, 0); // Move right
      expect(velocity.x).toBeCloseTo(80 * 1.2); // 96 pixels/sec
      expect(velocity.y).toBe(0);
    });

    it('should apply speed modifier to diagonal movement', () => {
      player.setSpeedModifier(0.2); // +20%

      const velocity = player.calculateVelocity(1, 1);
      const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      expect(speed).toBeCloseTo(80 * 1.2); // 96 pixels/sec
    });

    it('should allow multiple speed modifiers to stack', () => {
      // Simulate two speed-boosting relics
      const totalModifier = 0.2 + 0.15; // +35% total
      player.setSpeedModifier(totalModifier);

      const velocity = player.calculateVelocity(1, 0);
      expect(velocity.x).toBeCloseTo(80 * 1.35); // 108 pixels/sec
    });
  });

  describe('Damage Modifier', () => {
    it('should start with no damage modifier', () => {
      expect(player.getDamageModifier()).toBe(0);
    });

    it('should set damage modifier', () => {
      player.setDamageModifier(1); // Combat Charm: +1 damage
      expect(player.getDamageModifier()).toBe(1);
    });
  });

  describe('Heal', () => {
    it('should heal the player', () => {
      player.takeDamage(2); // Reduce to 3 HP
      expect(player.getHealth()).toBe(3);

      const healed = player.heal(1);
      expect(healed).toBe(true);
      expect(player.getHealth()).toBe(4);
    });

    it('should not heal above max health', () => {
      const healed = player.heal(1);
      expect(healed).toBe(false);
      expect(player.getHealth()).toBe(5);
    });

    it('should cap heal at max health', () => {
      player.takeDamage(2); // Reduce to 3 HP

      player.heal(10); // Heal more than needed
      expect(player.getHealth()).toBe(5); // Capped at max
    });

    it('should not heal with 0 or negative amount', () => {
      player.takeDamage(2);

      const healed = player.heal(0);
      expect(healed).toBe(false);
      expect(player.getHealth()).toBe(3);
    });

    it('should simulate Root of Resilience passive', () => {
      // Root of Resilience: Regenerate 1 HP every 30 seconds
      player.takeDamage(3); // Reduce to 2 HP

      // Simulate 30 seconds passing and triggering regen
      player.heal(1);
      expect(player.getHealth()).toBe(3);
    });
  });

  describe('Combined Relic Effects', () => {
    it('should apply both speed and damage modifiers', () => {
      player.setSpeedModifier(0.2); // +20% speed
      player.setDamageModifier(1); // +1 damage

      expect(player.getSpeedModifier()).toBe(0.2);
      expect(player.getDamageModifier()).toBe(1);

      const velocity = player.calculateVelocity(1, 0);
      expect(velocity.x).toBeCloseTo(96);
    });

    it('should allow healing while at reduced health with speed modifier', () => {
      player.setSpeedModifier(0.2);
      player.takeDamage(2);

      const healed = player.heal(1);
      expect(healed).toBe(true);
      expect(player.getHealth()).toBe(4);

      // Speed modifier should still be active
      const velocity = player.calculateVelocity(1, 0);
      expect(velocity.x).toBeCloseTo(96);
    });
  });
});
