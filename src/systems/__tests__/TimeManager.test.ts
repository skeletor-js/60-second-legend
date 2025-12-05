import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimeManager } from '../TimeManager';
import { TIME, TIME_EXTENSIONS, GameEvents } from '@config/Constants';

describe('TimeManager', () => {
  let timeManager: TimeManager;
  let mockEventCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    timeManager = new TimeManager();
    mockEventCallback = vi.fn();
  });

  describe('Initialization', () => {
    it('should initialize with BASE_TIME (60 seconds)', () => {
      expect(timeManager.getTimeRemaining()).toBe(TIME.BASE_TIME);
    });

    it('should not be paused on initialization', () => {
      expect(timeManager.isPaused()).toBe(false);
    });

    it('should start with no recent extensions', () => {
      expect(timeManager.getRecentExtensions()).toEqual([]);
    });
  });

  describe('tick()', () => {
    it('should decrease time by DRAIN_RATE', () => {
      const initialTime = timeManager.getTimeRemaining();
      timeManager.tick(1);
      expect(timeManager.getTimeRemaining()).toBe(initialTime - TIME.DRAIN_RATE);
    });

    it('should handle multiple ticks', () => {
      const initialTime = timeManager.getTimeRemaining();
      timeManager.tick(5);
      expect(timeManager.getTimeRemaining()).toBe(initialTime - TIME.DRAIN_RATE * 5);
    });

    it('should emit TIME_TICK event on each tick', () => {
      timeManager.on(GameEvents.TIME_TICK, mockEventCallback);
      timeManager.tick(1);
      expect(mockEventCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          timeRemaining: expect.any(Number),
        })
      );
    });

    it('should not decrease time below 0', () => {
      timeManager.tick(100); // More than BASE_TIME
      expect(timeManager.getTimeRemaining()).toBe(0);
    });

    it('should not tick when paused', () => {
      const initialTime = timeManager.getTimeRemaining();
      timeManager.pause();
      timeManager.tick(5);
      expect(timeManager.getTimeRemaining()).toBe(initialTime);
    });
  });

  describe('extendTime()', () => {
    it('should add time correctly', () => {
      const initialTime = timeManager.getTimeRemaining();
      timeManager.extendTime(TIME_EXTENSIONS.ENEMY_KILL, 'enemy_kill');
      expect(timeManager.getTimeRemaining()).toBe(initialTime + TIME_EXTENSIONS.ENEMY_KILL);
    });

    it('should cap time at MAX_TIME', () => {
      // Set time to near max
      timeManager.tick(1); // Reduce from 60 to 59
      timeManager.extendTime(TIME_EXTENSIONS.BOSS_DEFEATED * 3, 'test'); // Try to add 90s
      expect(timeManager.getTimeRemaining()).toBe(TIME.MAX_TIME);
    });

    it('should emit TIME_EXTENDED event with correct data', () => {
      timeManager.on(GameEvents.TIME_EXTENDED, mockEventCallback);
      const amount = TIME_EXTENSIONS.ROOM_CLEARED;
      timeManager.extendTime(amount, 'room_cleared');

      expect(mockEventCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: expect.any(Number),
          source: 'room_cleared',
          timeRemaining: expect.any(Number),
        })
      );
    });

    it('should not emit TIME_EXTENDED if time is already at MAX_TIME', () => {
      timeManager.on(GameEvents.TIME_EXTENDED, mockEventCallback);

      // Fill to max
      timeManager.extendTime(TIME.MAX_TIME, 'test');
      mockEventCallback.mockClear();

      // Try to add more
      timeManager.extendTime(10, 'test');
      expect(mockEventCallback).not.toHaveBeenCalled();
    });

    it('should track recent extensions', () => {
      timeManager.extendTime(TIME_EXTENSIONS.ENEMY_KILL, 'enemy_kill');
      const extensions = timeManager.getRecentExtensions();

      expect(extensions).toHaveLength(1);
      expect(extensions[0]).toMatchObject({
        amount: TIME_EXTENSIONS.ENEMY_KILL,
        source: 'enemy_kill',
      });
    });

    it('should limit recent extensions to last 5', () => {
      for (let i = 0; i < 7; i++) {
        timeManager.extendTime(1, `test_${i}`);
      }

      const extensions = timeManager.getRecentExtensions();
      expect(extensions).toHaveLength(5);
      expect(extensions[0].source).toBe('test_2'); // Oldest should be test_2
      expect(extensions[4].source).toBe('test_6'); // Newest should be test_6
    });
  });

  describe('Threshold Events', () => {
    it('should emit TIME_WARNING when crossing 30s threshold', () => {
      timeManager.on(GameEvents.TIME_WARNING, mockEventCallback);

      // Drain from 60 to 29 (crossing 30s threshold)
      timeManager.tick(31);

      expect(mockEventCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          timeRemaining: expect.any(Number),
        })
      );
    });

    it('should only emit TIME_WARNING once when crossing threshold', () => {
      timeManager.on(GameEvents.TIME_WARNING, mockEventCallback);

      // Cross threshold
      timeManager.tick(31);
      const firstCallCount = mockEventCallback.mock.calls.length;

      // Continue ticking below threshold
      timeManager.tick(5);

      expect(mockEventCallback).toHaveBeenCalledTimes(firstCallCount);
    });

    it('should emit TIME_CRITICAL when crossing 10s threshold', () => {
      timeManager.on(GameEvents.TIME_CRITICAL, mockEventCallback);

      // Drain from 60 to 9 (crossing 10s threshold)
      timeManager.tick(51);

      expect(mockEventCallback).toHaveBeenCalled();
    });

    it('should only emit TIME_CRITICAL once when crossing threshold', () => {
      timeManager.on(GameEvents.TIME_CRITICAL, mockEventCallback);

      // Cross threshold
      timeManager.tick(51);
      const firstCallCount = mockEventCallback.mock.calls.length;

      // Continue ticking below threshold
      timeManager.tick(5);

      expect(mockEventCallback).toHaveBeenCalledTimes(firstCallCount);
    });

    it('should re-emit warnings if time is extended above threshold and drops again', () => {
      const warningCallback = vi.fn();
      timeManager.on(GameEvents.TIME_WARNING, warningCallback);

      // Cross warning threshold
      timeManager.tick(31); // 29s remaining
      expect(warningCallback).toHaveBeenCalledTimes(1);

      // Extend back above threshold
      timeManager.extendTime(20, 'test'); // 49s remaining

      // Cross threshold again
      timeManager.tick(20); // 29s remaining
      expect(warningCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe('TIME_EXPIRED Event', () => {
    it('should emit TIME_EXPIRED when time reaches 0', () => {
      timeManager.on(GameEvents.TIME_EXPIRED, mockEventCallback);

      // Drain all time
      timeManager.tick(60);

      expect(mockEventCallback).toHaveBeenCalled();
      expect(timeManager.getTimeRemaining()).toBe(0);
    });

    it('should only emit TIME_EXPIRED once', () => {
      timeManager.on(GameEvents.TIME_EXPIRED, mockEventCallback);

      // Drain all time and beyond
      timeManager.tick(65);

      expect(mockEventCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('pause() and resume()', () => {
    it('should pause time progression', () => {
      const initialTime = timeManager.getTimeRemaining();
      timeManager.pause();
      timeManager.tick(5);

      expect(timeManager.getTimeRemaining()).toBe(initialTime);
      expect(timeManager.isPaused()).toBe(true);
    });

    it('should resume time progression', () => {
      const initialTime = timeManager.getTimeRemaining();
      timeManager.pause();
      timeManager.tick(5);

      timeManager.resume();
      timeManager.tick(5);

      expect(timeManager.getTimeRemaining()).toBe(initialTime - TIME.DRAIN_RATE * 5);
      expect(timeManager.isPaused()).toBe(false);
    });

    it('should allow time extensions while paused', () => {
      const initialTime = timeManager.getTimeRemaining();
      timeManager.pause();

      timeManager.extendTime(10, 'test');

      expect(timeManager.getTimeRemaining()).toBe(initialTime + 10);
    });
  });

  describe('Event Emitter Integration', () => {
    it('should support on() for event listeners', () => {
      const callback = vi.fn();
      timeManager.on(GameEvents.TIME_TICK, callback);
      timeManager.tick(1);

      expect(callback).toHaveBeenCalled();
    });

    it('should support off() to remove event listeners', () => {
      const callback = vi.fn();
      timeManager.on(GameEvents.TIME_TICK, callback);
      timeManager.off(GameEvents.TIME_TICK, callback);
      timeManager.tick(1);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should support once() for one-time event listeners', () => {
      const callback = vi.fn();
      timeManager.once(GameEvents.TIME_TICK, callback);
      timeManager.tick(1);
      timeManager.tick(1);

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle tick with 0 count', () => {
      const initialTime = timeManager.getTimeRemaining();
      timeManager.tick(0);
      expect(timeManager.getTimeRemaining()).toBe(initialTime);
    });

    it('should handle negative time extension (should be no-op or clamped)', () => {
      const initialTime = timeManager.getTimeRemaining();
      timeManager.extendTime(-10, 'test');
      expect(timeManager.getTimeRemaining()).toBe(initialTime);
    });

    it('should handle very small time extensions', () => {
      const initialTime = timeManager.getTimeRemaining();
      timeManager.extendTime(0.1, 'test');
      expect(timeManager.getTimeRemaining()).toBeCloseTo(initialTime + 0.1);
    });
  });
});
