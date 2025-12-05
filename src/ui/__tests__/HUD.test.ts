import { describe, it, expect, beforeEach } from 'vitest';
import { HUDLogic, HUD_COLORS } from '../HUD';
import { TIME, PLAYER } from '@config/Constants';

describe('HUDLogic', () => {
  let hudLogic: HUDLogic;

  beforeEach(() => {
    hudLogic = new HUDLogic();
  });

  describe('Timer Display', () => {
    it('formats time as MM:SS (e.g., "1:00" for 60 seconds)', () => {
      const result = hudLogic.formatTime(60);
      expect(result).toBe('1:00');
    });

    it('formats time with leading zero (e.g., "0:05" for 5 seconds)', () => {
      const result = hudLogic.formatTime(5);
      expect(result).toBe('0:05');
    });

    it('formats time with two digits for minutes (e.g., "2:30" for 150 seconds)', () => {
      const result = hudLogic.formatTime(150);
      expect(result).toBe('2:30');
    });

    it('formats time with no leading zero for seconds when >= 10', () => {
      const result = hudLogic.formatTime(75);
      expect(result).toBe('1:15');
    });

    it('returns correct color for normal state (green: #00ff88)', () => {
      expect(HUD_COLORS.TIME_NORMAL).toBe('#00ff88');
    });

    it('returns correct color for warning state (yellow: #ffff00)', () => {
      expect(HUD_COLORS.TIME_WARNING).toBe('#ffff00');
    });

    it('returns correct color for critical state (red: #ff0000)', () => {
      expect(HUD_COLORS.TIME_CRITICAL).toBe('#ff0000');
    });

    it('getColorForTime(35) returns green', () => {
      const result = hudLogic.getColorForTime(35);
      expect(result).toBe(HUD_COLORS.TIME_NORMAL);
    });

    it('getColorForTime(25) returns yellow', () => {
      const result = hudLogic.getColorForTime(25);
      expect(result).toBe(HUD_COLORS.TIME_WARNING);
    });

    it('getColorForTime(8) returns red', () => {
      const result = hudLogic.getColorForTime(8);
      expect(result).toBe(HUD_COLORS.TIME_CRITICAL);
    });

    it('returns yellow for exactly WARNING_THRESHOLD (30)', () => {
      const result = hudLogic.getColorForTime(TIME.WARNING_THRESHOLD);
      expect(result).toBe(HUD_COLORS.TIME_WARNING);
    });

    it('returns red for exactly CRITICAL_THRESHOLD (10)', () => {
      const result = hudLogic.getColorForTime(TIME.CRITICAL_THRESHOLD);
      expect(result).toBe(HUD_COLORS.TIME_CRITICAL);
    });

    it('returns green for exactly WARNING_THRESHOLD + 1', () => {
      const result = hudLogic.getColorForTime(TIME.WARNING_THRESHOLD + 1);
      expect(result).toBe(HUD_COLORS.TIME_NORMAL);
    });
  });

  describe('Health Display', () => {
    it('calculates correct hearts to show for full health (5)', () => {
      const result = hudLogic.getHeartCount(5, PLAYER.MAX_HEALTH);
      expect(result).toEqual({
        filled: 5,
        empty: 0,
      });
    });

    it('calculates correct hearts for damaged health (3)', () => {
      const result = hudLogic.getHeartCount(3, PLAYER.MAX_HEALTH);
      expect(result).toEqual({
        filled: 3,
        empty: 2,
      });
    });

    it('calculates correct hearts for empty health (0)', () => {
      const result = hudLogic.getHeartCount(0, PLAYER.MAX_HEALTH);
      expect(result).toEqual({
        filled: 0,
        empty: 5,
      });
    });

    it('handles negative health values gracefully', () => {
      const result = hudLogic.getHeartCount(-1, PLAYER.MAX_HEALTH);
      expect(result).toEqual({
        filled: 0,
        empty: 5,
      });
    });

    it('handles overheal scenarios', () => {
      const result = hudLogic.getHeartCount(7, PLAYER.MAX_HEALTH);
      expect(result).toEqual({
        filled: 7,
        empty: -2, // More health than max
      });
    });
  });

  describe('Popup System', () => {
    it('creates popup data with correct format', () => {
      const popup = hudLogic.addPopup(10, 'Enemy Kill');

      expect(popup).toMatchObject({
        id: expect.any(Number),
        amount: 10,
        source: 'Enemy Kill',
        createdAt: expect.any(Number),
      });
      expect(popup.id).toBeGreaterThan(0);
    });

    it('tracks active popups', () => {
      const popup1 = hudLogic.addPopup(5, 'Kill');
      const popup2 = hudLogic.addPopup(10, 'Room Clear');

      const activePopups = hudLogic.getActivePopups();
      expect(activePopups).toHaveLength(2);
      expect(activePopups).toContainEqual(popup1);
      expect(activePopups).toContainEqual(popup2);
    });

    it('removes popup after duration', () => {
      const popup1 = hudLogic.addPopup(5, 'Kill');
      const popup2 = hudLogic.addPopup(10, 'Room Clear');

      expect(hudLogic.getActivePopups()).toHaveLength(2);

      hudLogic.removePopup(popup1.id);

      const activePopups = hudLogic.getActivePopups();
      expect(activePopups).toHaveLength(1);
      expect(activePopups).toContainEqual(popup2);
      expect(activePopups).not.toContainEqual(popup1);
    });

    it('assigns unique IDs to each popup', () => {
      const popup1 = hudLogic.addPopup(5, 'Kill');
      const popup2 = hudLogic.addPopup(10, 'Room Clear');
      const popup3 = hudLogic.addPopup(15, 'Boss Kill');

      expect(popup1.id).not.toBe(popup2.id);
      expect(popup2.id).not.toBe(popup3.id);
      expect(popup1.id).not.toBe(popup3.id);
    });

    it('returns a copy of popups array to prevent external mutations', () => {
      const popup = hudLogic.addPopup(5, 'Kill');
      const popups1 = hudLogic.getActivePopups();
      const popups2 = hudLogic.getActivePopups();

      expect(popups1).not.toBe(popups2); // Different array references
      expect(popups1).toEqual(popups2); // But same content
    });

    it('handles removing non-existent popup gracefully', () => {
      hudLogic.addPopup(5, 'Kill');

      expect(() => hudLogic.removePopup(999)).not.toThrow();
      expect(hudLogic.getActivePopups()).toHaveLength(1);
    });
  });
});
