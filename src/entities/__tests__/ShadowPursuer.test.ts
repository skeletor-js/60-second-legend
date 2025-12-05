import { describe, it, expect, beforeEach } from 'vitest';
import { ShadowPursuerLogic } from '../ShadowPursuer';
import { SHADOW } from '@config/Constants';

describe('ShadowPursuerLogic', () => {
  let pursuer: ShadowPursuerLogic;

  beforeEach(() => {
    pursuer = new ShadowPursuerLogic();
  });

  describe('initialization', () => {
    it('should have correct stats', () => {
      expect(pursuer.getHealth()).toBe(999);
      expect(pursuer.getMaxHealth()).toBe(999);
      expect(pursuer.getMoveSpeed()).toBe(SHADOW.PURSUER_SPEED);
      expect(pursuer.getDamage()).toBe(SHADOW.PURSUER_DAMAGE);
      expect(pursuer.getTimeReward()).toBe(0);
    });

    it('should start with no cleared rooms', () => {
      const clearedRooms = pursuer.getClearedRooms();
      expect(clearedRooms.size).toBe(0);
    });
  });

  describe('calculateChaseVelocity', () => {
    it('should calculate velocity toward target', () => {
      const velocity = pursuer.calculateChaseVelocity(0, 0, 16, 0);

      expect(velocity.x).toBe(SHADOW.PURSUER_SPEED);
      expect(velocity.y).toBe(0);
    });

    it('should calculate velocity at angle', () => {
      // Target 1 tile right, 1 tile up (diagonal)
      const velocity = pursuer.calculateChaseVelocity(0, 0, 16, -16);

      // Should be normalized to PURSUER_SPEED
      const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      expect(speed).toBeCloseTo(SHADOW.PURSUER_SPEED, 1);
    });

    it('should return zero velocity at same position', () => {
      const velocity = pursuer.calculateChaseVelocity(10, 10, 10, 10);

      expect(velocity.x).toBe(0);
      expect(velocity.y).toBe(0);
    });

    it('should always move at same speed regardless of distance', () => {
      // Close distance
      const vel1 = pursuer.calculateChaseVelocity(0, 0, 32, 0);
      const speed1 = Math.sqrt(vel1.x ** 2 + vel1.y ** 2);

      // Far distance
      const vel2 = pursuer.calculateChaseVelocity(0, 0, 320, 0);
      const speed2 = Math.sqrt(vel2.x ** 2 + vel2.y ** 2);

      expect(speed1).toBeCloseTo(speed2, 1);
      expect(speed1).toBeCloseTo(SHADOW.PURSUER_SPEED, 1);
    });
  });

  describe('room tracking', () => {
    it('should mark rooms as cleared', () => {
      pursuer.markRoomCleared(1);
      pursuer.markRoomCleared(2);

      const clearedRooms = pursuer.getClearedRooms();
      expect(clearedRooms.has(1)).toBe(true);
      expect(clearedRooms.has(2)).toBe(true);
      expect(clearedRooms.has(3)).toBe(false);
    });

    it('should check if Shadow can enter room', () => {
      expect(pursuer.canEnterRoom(1)).toBe(true);

      pursuer.markRoomCleared(1);
      expect(pursuer.canEnterRoom(1)).toBe(false);
      expect(pursuer.canEnterRoom(2)).toBe(true);
    });

    it('should not duplicate cleared room entries', () => {
      pursuer.markRoomCleared(1);
      pursuer.markRoomCleared(1);
      pursuer.markRoomCleared(1);

      const clearedRooms = pursuer.getClearedRooms();
      expect(clearedRooms.size).toBe(1);
    });
  });

  describe('damage immunity', () => {
    it('should be immune to damage', () => {
      const result = pursuer.takeDamage(100);

      expect(result.died).toBe(false);
      expect(result.timeReward).toBe(0);
      expect(pursuer.getHealth()).toBe(999);
    });

    it('should remain immune to massive damage', () => {
      const result = pursuer.takeDamage(9999);

      expect(result.died).toBe(false);
      expect(pursuer.getHealth()).toBe(999);
    });

    it('should not be marked as dead after taking damage', () => {
      pursuer.takeDamage(999);
      expect(pursuer.isDead()).toBe(false);
    });
  });

  describe('cleared rooms set', () => {
    it('should return a copy of cleared rooms', () => {
      pursuer.markRoomCleared(1);
      const rooms1 = pursuer.getClearedRooms();
      const rooms2 = pursuer.getClearedRooms();

      // Should be different objects (defensive copy)
      expect(rooms1).not.toBe(rooms2);
      expect(rooms1.size).toBe(rooms2.size);
    });

    it('should not allow external modification of internal state', () => {
      const rooms = pursuer.getClearedRooms();
      rooms.add(99);

      // Internal state should not be affected
      expect(pursuer.canEnterRoom(99)).toBe(true);
    });
  });
});
