/**
 * Rat Enemy
 * Swarm enemy with pack behavior - moves toward other rats while chasing player
 */

import { Enemy, EnemyConfig, EnemyLogic } from '../Enemy';
import { ENEMIES } from '../../config/Constants';

/**
 * RatLogic - Pure logic class for Rat AI
 * Implements pack behavior - rats move toward each other while chasing player
 */
export class RatLogic extends EnemyLogic {
  constructor(config: EnemyConfig) {
    super(config);
  }

  /**
   * Calculate velocity with pack behavior
   * Combines player chase with pack cohesion
   *
   * @param myX - Rat's X position
   * @param myY - Rat's Y position
   * @param targetX - Player's X position
   * @param targetY - Player's Y position
   * @param packPositions - Array of other rat positions [{x, y}]
   * @returns Velocity vector
   */
  calculatePackVelocity(
    myX: number,
    myY: number,
    targetX: number,
    targetY: number,
    packPositions: Array<{ x: number; y: number }> = []
  ): { x: number; y: number } {
    // Calculate player chase direction
    const playerDx = targetX - myX;
    const playerDy = targetY - myY;
    const playerDist = Math.sqrt(playerDx * playerDx + playerDy * playerDy);

    // If at same position as player, return zero velocity
    if (playerDist === 0) {
      return { x: 0, y: 0 };
    }

    // Normalize player direction
    const playerDirX = playerDx / playerDist;
    const playerDirY = playerDy / playerDist;

    // Calculate pack center (average position of other rats)
    if (packPositions.length === 0) {
      // No pack, just chase player
      return {
        x: playerDirX * this.getMoveSpeed(),
        y: playerDirY * this.getMoveSpeed(),
      };
    }

    // Calculate pack center
    let packCenterX = 0;
    let packCenterY = 0;
    for (const pos of packPositions) {
      packCenterX += pos.x;
      packCenterY += pos.y;
    }
    packCenterX /= packPositions.length;
    packCenterY /= packPositions.length;

    // Calculate direction to pack center
    const packDx = packCenterX - myX;
    const packDy = packCenterY - myY;
    const packDist = Math.sqrt(packDx * packDx + packDy * packDy);

    // If already at pack center, just chase player
    if (packDist === 0) {
      return {
        x: playerDirX * this.getMoveSpeed(),
        y: playerDirY * this.getMoveSpeed(),
      };
    }

    // Normalize pack direction
    const packDirX = packDx / packDist;
    const packDirY = packDy / packDist;

    // Combine player chase (70%) and pack cohesion (30%)
    const combinedDirX = playerDirX * 0.7 + packDirX * 0.3;
    const combinedDirY = playerDirY * 0.7 + packDirY * 0.3;

    // Normalize combined direction
    const combinedDist = Math.sqrt(
      combinedDirX * combinedDirX + combinedDirY * combinedDirY
    );

    if (combinedDist === 0) {
      return { x: 0, y: 0 };
    }

    // Return velocity
    return {
      x: (combinedDirX / combinedDist) * this.getMoveSpeed(),
      y: (combinedDirY / combinedDist) * this.getMoveSpeed(),
    };
  }
}

/**
 * Rat - Swarm enemy that moves in packs
 * Spawns in groups of 3-5
 */
export class Rat extends Enemy {
  protected logic: RatLogic;
  private packMembers: Rat[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Use Rat config from ENEMIES constant
    super(scene, x, y, ENEMIES.RAT, 'enemy-rat');

    // Replace base logic with RatLogic
    this.logic = new RatLogic(ENEMIES.RAT);
  }

  /**
   * Set pack members for this rat
   * Used to coordinate pack behavior
   */
  setPackMembers(rats: Rat[]): void {
    // Filter out this rat from pack members
    this.packMembers = rats.filter((rat) => rat !== this);
  }

  /**
   * Get pack members
   */
  getPackMembers(): Rat[] {
    return this.packMembers;
  }

  /**
   * Update method - use rat-specific pack AI
   */
  update(targetX: number, targetY: number): void {
    if (this.logic.isDead()) {
      return;
    }

    // Get positions of pack members that are still alive
    const packPositions = this.packMembers
      .filter((rat) => !rat.isDead())
      .map((rat) => ({ x: rat.x, y: rat.y }));

    // Calculate pack velocity
    const velocity = this.logic.calculatePackVelocity(
      this.x,
      this.y,
      targetX,
      targetY,
      packPositions
    );

    // Apply velocity to physics body
    this.setVelocity(velocity.x, velocity.y);
  }

  /**
   * Override to expose RatLogic
   */
  getRatLogic(): RatLogic {
    return this.logic;
  }
}
