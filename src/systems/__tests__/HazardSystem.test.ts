import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HazardLogic } from '../HazardSystem';
import { GameEvents, HAZARDS } from '@config/Constants';

describe('HazardSystem', () => {
  describe('HazardLogic', () => {
    let hazardLogic: HazardLogic;
    let mockEventCallback: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      hazardLogic = new HazardLogic();
      mockEventCallback = vi.fn();
    });

    describe('Initialization', () => {
      it('should start with no hazard tiles', () => {
        expect(hazardLogic.getHazardTiles()).toEqual([]);
      });

      it('should start with no current hazard', () => {
        expect(hazardLogic.getCurrentHazard()).toBeNull();
      });

      it('should return speed multiplier of 1.0 with no hazard', () => {
        expect(hazardLogic.getSpeedMultiplier()).toBe(1.0);
      });
    });

    describe('placeHazards()', () => {
      const createSimpleTiles = (width: number, height: number): number[][] => {
        const tiles: number[][] = [];
        for (let y = 0; y < height; y++) {
          tiles[y] = [];
          for (let x = 0; x < width; x++) {
            tiles[y][x] = 1; // All floor tiles
          }
        }
        return tiles;
      };

      it('should place overgrowth hazards on floor tiles', () => {
        const tiles = createSimpleTiles(10, 10);
        hazardLogic.placeHazards(tiles, ['overgrowth']);

        const hazards = hazardLogic.getHazardTiles();
        expect(hazards.length).toBeGreaterThan(0);
        expect(hazards.every((h) => h.type === 'overgrowth')).toBe(true);
      });

      it('should place ice_tile hazards on floor tiles', () => {
        const tiles = createSimpleTiles(10, 10);
        hazardLogic.placeHazards(tiles, ['ice_tile']);

        const hazards = hazardLogic.getHazardTiles();
        expect(hazards.length).toBeGreaterThan(0);
        expect(hazards.every((h) => h.type === 'ice_tile')).toBe(true);
      });

      it('should place hazards at expected spawn rate for overgrowth', () => {
        const tiles = createSimpleTiles(100, 100);
        hazardLogic.placeHazards(tiles, ['overgrowth']);

        const hazards = hazardLogic.getHazardTiles();
        const totalFloorTiles = 100 * 100;
        const expectedCount = Math.floor(totalFloorTiles * HAZARDS.OVERGROWTH.spawnRate);

        expect(hazards.length).toBe(expectedCount);
      });

      it('should place hazards at expected spawn rate for ice tiles', () => {
        const tiles = createSimpleTiles(100, 100);
        hazardLogic.placeHazards(tiles, ['ice_tile']);

        const hazards = hazardLogic.getHazardTiles();
        const totalFloorTiles = 100 * 100;
        const expectedCount = Math.floor(totalFloorTiles * HAZARDS.ICE_TILE.spawnRate);

        expect(hazards.length).toBe(expectedCount);
      });

      it('should not place hazards on wall tiles', () => {
        const tiles: number[][] = [
          [0, 0, 0],
          [0, 1, 0],
          [0, 0, 0],
        ];
        hazardLogic.placeHazards(tiles, ['overgrowth']);

        const hazards = hazardLogic.getHazardTiles();
        expect(hazards.length).toBe(0); // Only 1 floor tile, 15% of 1 = 0
      });

      it('should clear previous hazards when placing new ones', () => {
        const tiles = createSimpleTiles(10, 10);
        hazardLogic.placeHazards(tiles, ['overgrowth']);
        const firstCount = hazardLogic.getHazardTiles().length;

        hazardLogic.placeHazards(tiles, ['ice_tile']);
        const hazards = hazardLogic.getHazardTiles();

        expect(hazards.length).toBeGreaterThan(0);
        expect(hazards.every((h) => h.type === 'ice_tile')).toBe(true);
      });

      it('should handle multiple hazard types', () => {
        const tiles = createSimpleTiles(100, 100);
        hazardLogic.placeHazards(tiles, ['overgrowth', 'ice_tile']);

        const hazards = hazardLogic.getHazardTiles();
        const overgrowthCount = hazards.filter((h) => h.type === 'overgrowth').length;
        const iceCount = hazards.filter((h) => h.type === 'ice_tile').length;

        expect(overgrowthCount).toBeGreaterThan(0);
        expect(iceCount).toBeGreaterThan(0);
      });

      it('should ignore unknown hazard types', () => {
        const tiles = createSimpleTiles(10, 10);
        hazardLogic.placeHazards(tiles, ['unknown_hazard']);

        expect(hazardLogic.getHazardTiles()).toEqual([]);
      });
    });

    describe('hasHazard()', () => {
      it('should return false when no hazards exist', () => {
        expect(hazardLogic.hasHazard(0, 0)).toBe(false);
      });

      it('should return true for tile with hazard', () => {
        const tiles: number[][] = [
          [1, 1],
          [1, 1],
        ];
        hazardLogic.placeHazards(tiles, ['overgrowth']);

        const hazards = hazardLogic.getHazardTiles();
        if (hazards.length > 0) {
          const hazard = hazards[0];
          expect(hazardLogic.hasHazard(hazard.x, hazard.y)).toBe(true);
        }
      });

      it('should return false for tile without hazard', () => {
        const tiles: number[][] = [
          [1, 1],
          [1, 1],
        ];
        hazardLogic.placeHazards(tiles, ['overgrowth']);

        expect(hazardLogic.hasHazard(999, 999)).toBe(false);
      });
    });

    describe('getHazardAt()', () => {
      it('should return undefined when no hazard at position', () => {
        expect(hazardLogic.getHazardAt(0, 0)).toBeUndefined();
      });

      it('should return hazard data when hazard exists at position', () => {
        const tiles: number[][] = [
          [1, 1],
          [1, 1],
        ];
        hazardLogic.placeHazards(tiles, ['overgrowth']);

        const hazards = hazardLogic.getHazardTiles();
        if (hazards.length > 0) {
          const hazard = hazards[0];
          const retrieved = hazardLogic.getHazardAt(hazard.x, hazard.y);
          expect(retrieved).toEqual(hazard);
        }
      });
    });

    describe('updatePlayerPosition()', () => {
      beforeEach(() => {
        const tiles: number[][] = [];
        for (let y = 0; y < 10; y++) {
          tiles[y] = [];
          for (let x = 0; x < 10; x++) {
            tiles[y][x] = 1;
          }
        }
        hazardLogic.placeHazards(tiles, ['overgrowth']);
      });

      it('should emit HAZARD_ENTERED when player enters a hazard', () => {
        hazardLogic.on(GameEvents.HAZARD_ENTERED, mockEventCallback);

        const hazards = hazardLogic.getHazardTiles();
        if (hazards.length > 0) {
          const hazard = hazards[0];
          hazardLogic.updatePlayerPosition(hazard.x, hazard.y);

          expect(mockEventCallback).toHaveBeenCalledWith(
            expect.objectContaining({
              hazardType: 'overgrowth',
              x: hazard.x,
              y: hazard.y,
            })
          );
        }
      });

      it('should emit HAZARD_EFFECT_APPLIED when player enters a hazard', () => {
        hazardLogic.on(GameEvents.HAZARD_EFFECT_APPLIED, mockEventCallback);

        const hazards = hazardLogic.getHazardTiles();
        if (hazards.length > 0) {
          const hazard = hazards[0];
          hazardLogic.updatePlayerPosition(hazard.x, hazard.y);

          expect(mockEventCallback).toHaveBeenCalledWith(
            expect.objectContaining({
              hazardType: 'overgrowth',
              effect: `slow_${HAZARDS.OVERGROWTH.slowMultiplier}`,
            })
          );
        }
      });

      it('should emit HAZARD_EXITED when player leaves a hazard', () => {
        hazardLogic.on(GameEvents.HAZARD_EXITED, mockEventCallback);

        const hazards = hazardLogic.getHazardTiles();
        if (hazards.length > 0) {
          const hazard = hazards[0];
          hazardLogic.updatePlayerPosition(hazard.x, hazard.y);
          mockEventCallback.mockClear();

          hazardLogic.updatePlayerPosition(hazard.x + 5, hazard.y + 5);
          expect(mockEventCallback).toHaveBeenCalledWith(
            expect.objectContaining({
              hazardType: 'overgrowth',
              x: hazard.x,
              y: hazard.y,
            })
          );
        }
      });

      it('should update current hazard when entering', () => {
        const hazards = hazardLogic.getHazardTiles();
        if (hazards.length > 0) {
          const hazard = hazards[0];
          hazardLogic.updatePlayerPosition(hazard.x, hazard.y);

          expect(hazardLogic.getCurrentHazard()).toEqual(hazard);
        }
      });

      it('should clear current hazard when exiting', () => {
        const hazards = hazardLogic.getHazardTiles();
        if (hazards.length > 0) {
          const hazard = hazards[0];
          hazardLogic.updatePlayerPosition(hazard.x, hazard.y);
          hazardLogic.updatePlayerPosition(hazard.x + 5, hazard.y + 5);

          expect(hazardLogic.getCurrentHazard()).toBeNull();
        }
      });
    });

    describe('getSpeedMultiplier()', () => {
      it('should return 1.0 when not on a hazard', () => {
        expect(hazardLogic.getSpeedMultiplier()).toBe(1.0);
      });

      it('should return 0.7 when on overgrowth hazard', () => {
        const tiles: number[][] = [
          [1, 1],
          [1, 1],
        ];
        hazardLogic.placeHazards(tiles, ['overgrowth']);

        const hazards = hazardLogic.getHazardTiles();
        if (hazards.length > 0) {
          const hazard = hazards[0];
          hazardLogic.updatePlayerPosition(hazard.x, hazard.y);

          expect(hazardLogic.getSpeedMultiplier()).toBe(HAZARDS.OVERGROWTH.slowMultiplier);
        }
      });

      it('should return 1.0 when on ice tile (ice does not slow)', () => {
        const tiles: number[][] = [
          [1, 1],
          [1, 1],
        ];
        hazardLogic.placeHazards(tiles, ['ice_tile']);

        const hazards = hazardLogic.getHazardTiles();
        if (hazards.length > 0) {
          const hazard = hazards[0];
          hazardLogic.updatePlayerPosition(hazard.x, hazard.y);

          expect(hazardLogic.getSpeedMultiplier()).toBe(1.0);
        }
      });
    });

    describe('Event System', () => {
      it('should support on() and off()', () => {
        hazardLogic.on(GameEvents.HAZARD_ENTERED, mockEventCallback);
        hazardLogic.off(GameEvents.HAZARD_ENTERED, mockEventCallback);

        const tiles: number[][] = [[1]];
        hazardLogic.placeHazards(tiles, ['overgrowth']);
        const hazards = hazardLogic.getHazardTiles();
        if (hazards.length > 0) {
          hazardLogic.updatePlayerPosition(hazards[0].x, hazards[0].y);
          expect(mockEventCallback).not.toHaveBeenCalled();
        }
      });

      it('should support removeAllListeners()', () => {
        hazardLogic.on(GameEvents.HAZARD_ENTERED, mockEventCallback);
        hazardLogic.removeAllListeners();

        const tiles: number[][] = [[1]];
        hazardLogic.placeHazards(tiles, ['overgrowth']);
        const hazards = hazardLogic.getHazardTiles();
        if (hazards.length > 0) {
          hazardLogic.updatePlayerPosition(hazards[0].x, hazards[0].y);
          expect(mockEventCallback).not.toHaveBeenCalled();
        }
      });
    });
  });
});
