import { describe, it, expect, beforeEach } from 'vitest';
import { FloorThemeLogic } from '../FloorThemeSystem';
import { VERDANT_RUINS, FROZEN_ARCHIVE } from '../../data/biomes';

describe('FloorThemeSystem', () => {
  describe('FloorThemeLogic', () => {
    let themeLogic: FloorThemeLogic;

    beforeEach(() => {
      themeLogic = new FloorThemeLogic(1);
    });

    describe('Initialization', () => {
      it('should initialize with floor 1 by default', () => {
        expect(themeLogic.getCurrentFloor()).toBe(1);
      });

      it('should initialize with Verdant Ruins biome for floor 1', () => {
        const biome = themeLogic.getCurrentBiome();
        expect(biome.id).toBe('verdant_ruins');
        expect(biome.name).toBe('Verdant Ruins');
      });

      it('should accept custom initial floor', () => {
        const theme = new FloorThemeLogic(3);
        expect(theme.getCurrentFloor()).toBe(3);
        expect(theme.getBiomeId()).toBe('frozen_archive');
      });
    });

    describe('setFloor()', () => {
      it('should update current floor number', () => {
        themeLogic.setFloor(3);
        expect(themeLogic.getCurrentFloor()).toBe(3);
      });

      it('should update biome when floor changes to Frozen Archive range', () => {
        themeLogic.setFloor(3);
        const biome = themeLogic.getCurrentBiome();
        expect(biome.id).toBe('frozen_archive');
        expect(biome.name).toBe('Frozen Archive');
      });

      it('should update biome when floor changes to Verdant Ruins range', () => {
        themeLogic.setFloor(3);
        themeLogic.setFloor(2);
        const biome = themeLogic.getCurrentBiome();
        expect(biome.id).toBe('verdant_ruins');
      });
    });

    describe('Biome Selection', () => {
      it('should use Verdant Ruins for floor 1', () => {
        themeLogic.setFloor(1);
        expect(themeLogic.getBiomeId()).toBe('verdant_ruins');
        expect(themeLogic.getBiomeName()).toBe('Verdant Ruins');
      });

      it('should use Verdant Ruins for floor 2', () => {
        themeLogic.setFloor(2);
        expect(themeLogic.getBiomeId()).toBe('verdant_ruins');
      });

      it('should use Frozen Archive for floor 3', () => {
        themeLogic.setFloor(3);
        expect(themeLogic.getBiomeId()).toBe('frozen_archive');
        expect(themeLogic.getBiomeName()).toBe('Frozen Archive');
      });

      it('should use Frozen Archive for floor 4', () => {
        themeLogic.setFloor(4);
        expect(themeLogic.getBiomeId()).toBe('frozen_archive');
      });

      it('should default to Verdant Ruins for undefined floors', () => {
        themeLogic.setFloor(99);
        expect(themeLogic.getBiomeId()).toBe('verdant_ruins');
      });
    });

    describe('getPalette()', () => {
      it('should return Verdant Ruins palette for floor 1', () => {
        themeLogic.setFloor(1);
        const palette = themeLogic.getPalette();
        expect(palette.primary).toBe(VERDANT_RUINS.palette.primary);
        expect(palette.secondary).toBe(VERDANT_RUINS.palette.secondary);
        expect(palette.accent).toBe(VERDANT_RUINS.palette.accent);
      });

      it('should return Frozen Archive palette for floor 3', () => {
        themeLogic.setFloor(3);
        const palette = themeLogic.getPalette();
        expect(palette.primary).toBe(FROZEN_ARCHIVE.palette.primary);
        expect(palette.secondary).toBe(FROZEN_ARCHIVE.palette.secondary);
        expect(palette.accent).toBe(FROZEN_ARCHIVE.palette.accent);
      });

      it('should return correct color values for Verdant Ruins', () => {
        themeLogic.setFloor(1);
        const palette = themeLogic.getPalette();
        expect(palette.primary).toBe(0x2d5a27);
        expect(palette.secondary).toBe(0x8bc34a);
        expect(palette.accent).toBe(0x4caf50);
      });

      it('should return correct color values for Frozen Archive', () => {
        themeLogic.setFloor(3);
        const palette = themeLogic.getPalette();
        expect(palette.primary).toBe(0x4fc3f7);
        expect(palette.secondary).toBe(0xe1f5fe);
        expect(palette.accent).toBe(0x0288d1);
      });
    });

    describe('getHazardTypes()', () => {
      it('should return overgrowth for Verdant Ruins', () => {
        themeLogic.setFloor(1);
        const hazards = themeLogic.getHazardTypes();
        expect(hazards).toEqual(['overgrowth']);
      });

      it('should return ice_tile for Frozen Archive', () => {
        themeLogic.setFloor(3);
        const hazards = themeLogic.getHazardTypes();
        expect(hazards).toEqual(['ice_tile']);
      });

      it('should return a copy of hazards array', () => {
        themeLogic.setFloor(1);
        const hazards1 = themeLogic.getHazardTypes();
        const hazards2 = themeLogic.getHazardTypes();
        expect(hazards1).toEqual(hazards2);
        expect(hazards1).not.toBe(hazards2);
      });
    });

    describe('getEnemyModifier()', () => {
      it('should return 1.0x modifiers for Verdant Ruins', () => {
        themeLogic.setFloor(1);
        const modifier = themeLogic.getEnemyModifier();
        expect(modifier.speedMultiplier).toBe(1.0);
        expect(modifier.healthMultiplier).toBe(1.0);
      });

      it('should return 1.2x speed for Frozen Archive', () => {
        themeLogic.setFloor(3);
        const modifier = themeLogic.getEnemyModifier();
        expect(modifier.speedMultiplier).toBe(1.2);
        expect(modifier.healthMultiplier).toBe(1.0);
      });

      it('should return a copy of enemy modifiers', () => {
        themeLogic.setFloor(1);
        const modifier1 = themeLogic.getEnemyModifier();
        const modifier2 = themeLogic.getEnemyModifier();
        expect(modifier1).toEqual(modifier2);
        expect(modifier1).not.toBe(modifier2);
      });
    });

    describe('getBiomeName() and getBiomeId()', () => {
      it('should return correct name and ID for Verdant Ruins', () => {
        themeLogic.setFloor(1);
        expect(themeLogic.getBiomeName()).toBe('Verdant Ruins');
        expect(themeLogic.getBiomeId()).toBe('verdant_ruins');
      });

      it('should return correct name and ID for Frozen Archive', () => {
        themeLogic.setFloor(3);
        expect(themeLogic.getBiomeName()).toBe('Frozen Archive');
        expect(themeLogic.getBiomeId()).toBe('frozen_archive');
      });
    });
  });
});
