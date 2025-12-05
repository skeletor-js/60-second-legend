import { describe, it, expect, beforeEach } from 'vitest';
import { ShadowLogic } from '../ShadowSystem';
import { CORRUPTION, SHADOW } from '@config/Constants';

describe('ShadowLogic', () => {
  let shadowLogic: ShadowLogic;

  beforeEach(() => {
    shadowLogic = new ShadowLogic();
  });

  describe('addCorruption', () => {
    it('should add corruption and return current level', () => {
      const result = shadowLogic.addCorruption(10, 'test');

      expect(result.corruption).toBe(10);
      expect(result.previousCorruption).toBe(0);
      expect(result.source).toBe('test');
      expect(result.thresholdCrossed).toBeNull();
    });

    it('should not exceed 100 corruption', () => {
      shadowLogic.addCorruption(95, 'test1');
      const result = shadowLogic.addCorruption(20, 'test2');

      expect(result.corruption).toBe(100);
    });

    it('should detect 25% threshold crossing', () => {
      const result = shadowLogic.addCorruption(25, 'floor_enter');

      expect(result.thresholdCrossed).toBe(CORRUPTION.WHISPERS_BEGIN);
      expect(result.corruption).toBe(25);
    });

    it('should detect 50% threshold crossing', () => {
      shadowLogic.addCorruption(25, 'test1');
      const result = shadowLogic.addCorruption(25, 'test2');

      expect(result.thresholdCrossed).toBe(CORRUPTION.CREEPING_DARKNESS);
      expect(result.corruption).toBe(50);
    });

    it('should detect 75% threshold crossing', () => {
      shadowLogic.addCorruption(50, 'test1');
      const result = shadowLogic.addCorruption(25, 'test2');

      expect(result.thresholdCrossed).toBe(CORRUPTION.HIS_GAZE);
      expect(result.corruption).toBe(75);
    });

    it('should detect 100% threshold crossing', () => {
      shadowLogic.addCorruption(75, 'test1');
      const result = shadowLogic.addCorruption(25, 'test2');

      expect(result.thresholdCrossed).toBe(CORRUPTION.SHADOW_HUNTS);
      expect(result.corruption).toBe(100);
    });

    it('should not trigger same threshold twice', () => {
      shadowLogic.addCorruption(50, 'test1');
      const result = shadowLogic.addCorruption(10, 'test2');

      expect(result.thresholdCrossed).toBeNull();
      expect(result.corruption).toBe(60);
    });
  });

  describe('reduceCorruption', () => {
    it('should reduce corruption', () => {
      shadowLogic.addCorruption(50, 'test1');
      const result = shadowLogic.reduceCorruption(10, 'relic_acquired');

      expect(result.corruption).toBe(40);
      expect(result.previousCorruption).toBe(50);
      expect(result.source).toBe('relic_acquired');
    });

    it('should not go below 0 corruption', () => {
      shadowLogic.addCorruption(10, 'test1');
      const result = shadowLogic.reduceCorruption(20, 'test2');

      expect(result.corruption).toBe(0);
    });

    it('should reset threshold flags when going below them', () => {
      shadowLogic.addCorruption(75, 'test1');
      shadowLogic.reduceCorruption(30, 'test2'); // Now at 45%

      // Should be able to trigger 50% threshold again
      const result = shadowLogic.addCorruption(5, 'test3'); // 50%
      expect(result.thresholdCrossed).toBe(CORRUPTION.CREEPING_DARKNESS);
    });
  });

  describe('getCorruption', () => {
    it('should return current corruption level', () => {
      expect(shadowLogic.getCorruption()).toBe(0);

      shadowLogic.addCorruption(42, 'test');
      expect(shadowLogic.getCorruption()).toBe(42);
    });
  });

  describe('getCorruptionPercentage', () => {
    it('should return corruption as percentage (0-1)', () => {
      expect(shadowLogic.getCorruptionPercentage()).toBe(0);

      shadowLogic.addCorruption(50, 'test');
      expect(shadowLogic.getCorruptionPercentage()).toBe(0.5);

      shadowLogic.addCorruption(50, 'test2');
      expect(shadowLogic.getCorruptionPercentage()).toBe(1.0);
    });
  });

  describe('hasReachedThreshold', () => {
    it('should track which thresholds have been reached', () => {
      expect(shadowLogic.hasReachedThreshold(CORRUPTION.WHISPERS_BEGIN)).toBe(false);

      shadowLogic.addCorruption(30, 'test');
      expect(shadowLogic.hasReachedThreshold(CORRUPTION.WHISPERS_BEGIN)).toBe(true);
      expect(shadowLogic.hasReachedThreshold(CORRUPTION.CREEPING_DARKNESS)).toBe(false);
    });

    it('should clear threshold flags when corruption is reduced below them', () => {
      shadowLogic.addCorruption(60, 'test1');
      expect(shadowLogic.hasReachedThreshold(CORRUPTION.CREEPING_DARKNESS)).toBe(true);

      shadowLogic.reduceCorruption(20, 'test2'); // 40%
      expect(shadowLogic.hasReachedThreshold(CORRUPTION.CREEPING_DARKNESS)).toBe(false);
    });
  });

  describe('corruption sources', () => {
    it('should add correct amount for FLOOR_ENTER', () => {
      const result = shadowLogic.addCorruption(SHADOW.CORRUPTION_SOURCES.FLOOR_ENTER, 'floor_enter');
      expect(result.corruption).toBe(5);
    });

    it('should add correct amount for IDLE_10S', () => {
      const result = shadowLogic.addCorruption(SHADOW.CORRUPTION_SOURCES.IDLE_10S, 'idle');
      expect(result.corruption).toBe(1);
    });

    it('should reduce correct amount for RELIC_ACQUIRED', () => {
      shadowLogic.addCorruption(50, 'test');
      const result = shadowLogic.reduceCorruption(
        Math.abs(SHADOW.CORRUPTION_SOURCES.RELIC_ACQUIRED),
        'relic'
      );
      expect(result.corruption).toBe(40);
    });

    it('should reduce correct amount for BOSS_DEFEATED', () => {
      shadowLogic.addCorruption(50, 'test');
      const result = shadowLogic.reduceCorruption(
        Math.abs(SHADOW.CORRUPTION_SOURCES.BOSS_DEFEATED),
        'boss'
      );
      expect(result.corruption).toBe(35);
    });
  });
});
