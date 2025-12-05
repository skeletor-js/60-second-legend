/**
 * Wall Tile Resolver
 * Determines appropriate wall sprites based on neighboring tiles
 */

import { TileFrameSet } from '@config/TilesetMapping';

// =============================================================================
// WALL TYPES
// =============================================================================

export enum WallType {
  // Edge walls (one side exposed to floor)
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right',

  // Outer corners (two perpendicular sides exposed)
  CORNER_TL = 'corner_tl',
  CORNER_TR = 'corner_tr',
  CORNER_BL = 'corner_bl',
  CORNER_BR = 'corner_br',

  // Inner corners (L-shaped wall junctions)
  INNER_TL = 'inner_tl',
  INNER_TR = 'inner_tr',
  INNER_BL = 'inner_bl',
  INNER_BR = 'inner_br',

  // Special cases
  SINGLE = 'single', // Isolated wall tile
  SOLID = 'solid', // Completely surrounded by walls
}

// =============================================================================
// NEIGHBOR DETECTION
// =============================================================================

export interface TileNeighbors {
  n: boolean; // north (floor above)
  s: boolean; // south (floor below)
  e: boolean; // east (floor right)
  w: boolean; // west (floor left)
  ne: boolean; // northeast
  nw: boolean; // northwest
  se: boolean; // southeast
  sw: boolean; // southwest
}

/**
 * Get neighboring tile information for a position
 */
export function getNeighbors(
  x: number,
  y: number,
  tiles: number[][],
  width: number,
  height: number
): TileNeighbors {
  const isFloor = (tx: number, ty: number): boolean => {
    if (tx < 0 || ty < 0 || tx >= width || ty >= height) {
      return false;
    }
    return tiles[ty][tx] === 1;
  };

  return {
    n: isFloor(x, y - 1),
    s: isFloor(x, y + 1),
    e: isFloor(x + 1, y),
    w: isFloor(x - 1, y),
    ne: isFloor(x + 1, y - 1),
    nw: isFloor(x - 1, y - 1),
    se: isFloor(x + 1, y + 1),
    sw: isFloor(x - 1, y + 1),
  };
}

// =============================================================================
// WALL TYPE RESOLUTION
// =============================================================================

/**
 * Determines the wall type based on neighboring floor tiles
 */
export function resolveWallType(neighbors: TileNeighbors): WallType {
  const { n, s, e, w, ne, nw, se, sw } = neighbors;

  // Count exposed sides (adjacent to floor)
  const exposedSides = [n, s, e, w].filter(Boolean).length;

  // Completely surrounded by walls - solid fill
  if (exposedSides === 0) {
    // Check for inner corners (diagonal floor with no cardinal floor)
    if (se && !s && !e) return WallType.INNER_TL;
    if (sw && !s && !w) return WallType.INNER_TR;
    if (ne && !n && !e) return WallType.INNER_BL;
    if (nw && !n && !w) return WallType.INNER_BR;

    return WallType.SOLID;
  }

  // Single isolated wall (exposed on all sides)
  if (exposedSides === 4) {
    return WallType.SINGLE;
  }

  // Outer corners (two perpendicular sides exposed)
  if (exposedSides === 2) {
    if (n && w) return WallType.CORNER_BR;
    if (n && e) return WallType.CORNER_BL;
    if (s && w) return WallType.CORNER_TR;
    if (s && e) return WallType.CORNER_TL;
  }

  // Edge walls (one side exposed)
  if (n && !s) return WallType.BOTTOM;
  if (s && !n) return WallType.TOP;
  if (e && !w) return WallType.LEFT;
  if (w && !e) return WallType.RIGHT;

  // Three sides exposed - treat as edge based on closed side
  if (exposedSides === 3) {
    if (!n) return WallType.TOP;
    if (!s) return WallType.BOTTOM;
    if (!e) return WallType.RIGHT;
    if (!w) return WallType.LEFT;
  }

  // Default fallback
  return WallType.SOLID;
}

// =============================================================================
// FRAME SELECTION
// =============================================================================

/**
 * Gets the appropriate frame index for a wall type
 */
export function getWallFrame(wallType: WallType, tiles: TileFrameSet): number {
  switch (wallType) {
    case WallType.TOP:
      return tiles.wallTop;
    case WallType.BOTTOM:
      return tiles.wallBottom;
    case WallType.LEFT:
      return tiles.wallLeft;
    case WallType.RIGHT:
      return tiles.wallRight;

    case WallType.CORNER_TL:
      return tiles.wallCornerTL;
    case WallType.CORNER_TR:
      return tiles.wallCornerTR;
    case WallType.CORNER_BL:
      return tiles.wallCornerBL;
    case WallType.CORNER_BR:
      return tiles.wallCornerBR;

    case WallType.INNER_TL:
      return tiles.wallInnerTL;
    case WallType.INNER_TR:
      return tiles.wallInnerTR;
    case WallType.INNER_BL:
      return tiles.wallInnerBL;
    case WallType.INNER_BR:
      return tiles.wallInnerBR;

    case WallType.SINGLE:
      return tiles.wallSingle;

    case WallType.SOLID:
    default:
      return tiles.wallTop; // Default to top wall for solid areas
  }
}

/**
 * Convenience function to get wall frame directly from position
 */
export function resolveWallFrame(
  x: number,
  y: number,
  tiles: number[][],
  width: number,
  height: number,
  tileFrames: TileFrameSet
): number {
  const neighbors = getNeighbors(x, y, tiles, width, height);
  const wallType = resolveWallType(neighbors);
  return getWallFrame(wallType, tileFrames);
}
