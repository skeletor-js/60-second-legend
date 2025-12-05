/**
 * Slime Enemy
 * Basic slow-moving enemy variant
 */

import { Enemy, EnemyConfig } from '../Enemy';
import { TIME_EXTENSIONS } from '../../config/Constants';
import { TILESET } from '../../config/TilesetMapping';

/**
 * Slime configuration
 * - Low health (2 HP)
 * - Slow movement (30 px/s)
 * - Low damage (1 HP)
 * - Standard time reward (3 seconds)
 */
const SLIME_CONFIG: EnemyConfig = {
  maxHealth: 2,
  moveSpeed: 30,
  damage: 1,
  timeReward: TIME_EXTENSIONS.ENEMY_KILL, // 3 seconds
};

/**
 * Slime - Basic enemy that chases the player
 */
export class Slime extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number, frame?: number) {
    super(scene, x, y, SLIME_CONFIG, TILESET.KEY, frame);
    this.enemyType = 'slime';
  }
}
