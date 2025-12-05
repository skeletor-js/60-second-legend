/**
 * Systems Module Exports
 * Core game systems for 60 Second Legend
 */

export { TimeManager } from './TimeManager';
export type { TimeExtension } from './TimeManager';
export { DungeonGenerator } from './DungeonGenerator';
export { WeaponSystem, WeaponLogic } from './WeaponSystem';
export type { WeaponAttackData } from './WeaponSystem';
export { CombatSystem, CombatLogic } from './CombatSystem';
export type { AttackData, HitResult, CombatConfig } from './CombatSystem';
export { CombatMechanics, CombatMechanicsLogic } from './CombatMechanics';
export type { KillStreakData, ComboData, PerfectDodgeData, ExecuteData } from './CombatMechanics';
export { RelicSystem, RelicLogic } from './RelicSystem';
export type { EquippedRelic } from './RelicSystem';
export { FloorThemeSystem, FloorThemeLogic } from './FloorThemeSystem';
export {
  WallType,
  getNeighbors,
  resolveWallType,
  getWallFrame,
  resolveWallFrame,
} from './WallTileResolver';
export type { TileNeighbors } from './WallTileResolver';
export { HazardSystem, HazardLogic } from './HazardSystem';
export type { HazardTile, HazardEffectData } from './HazardSystem';
export { ShadowSystem, ShadowLogic } from './ShadowSystem';
export type { CorruptionChangeData } from './ShadowSystem';
