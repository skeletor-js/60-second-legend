/**
 * Bat Enemy
 * Fast flying enemy with erratic charge/retreat behavior
 */

import { Enemy, EnemyConfig, EnemyLogic } from '../Enemy';
import { ENEMIES } from '../../config/Constants';

/**
 * BatLogic - Pure logic class for Bat AI
 * Implements charge/retreat behavior pattern
 */
export class BatLogic extends EnemyLogic {
  private chargeTimer: number = 0;
  private retreatTimer: number = 0;
  private isCharging: boolean = true;
  private readonly chargeDuration: number = 1.5; // Charge for 1.5 seconds
  private readonly retreatDuration: number = 1.0; // Retreat for 1 second
  private justStartedRetreat: boolean = false; // Track retreat start for projectile

  constructor(config: EnemyConfig) {
    super(config);
  }

  /**
   * Update bat AI state
   * Switches between charging and retreating
   * Returns true if bat just started retreating (should fire projectile)
   */
  updateAI(deltaTime: number): boolean {
    this.justStartedRetreat = false;

    if (this.isCharging) {
      this.chargeTimer += deltaTime;
      if (this.chargeTimer >= this.chargeDuration) {
        // Switch to retreat
        this.isCharging = false;
        this.chargeTimer = 0;
        this.justStartedRetreat = true; // Signal to fire projectile
      }
    } else {
      this.retreatTimer += deltaTime;
      if (this.retreatTimer >= this.retreatDuration) {
        // Switch to charge
        this.isCharging = true;
        this.retreatTimer = 0;
      }
    }

    return this.justStartedRetreat;
  }

  /**
   * Check if bat just started retreating (for projectile firing)
   */
  shouldFireProjectile(): boolean {
    return this.justStartedRetreat;
  }

  /**
   * Calculate velocity with charge/retreat behavior
   * When charging: move toward player at full speed
   * When retreating: move away from player at full speed
   */
  calculateBatVelocity(
    myX: number,
    myY: number,
    targetX: number,
    targetY: number
  ): { x: number; y: number } {
    // Calculate direction vector
    const dx = targetX - myX;
    const dy = targetY - myY;

    // Calculate distance
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If at same position, return zero velocity
    if (distance === 0) {
      return { x: 0, y: 0 };
    }

    // Normalize direction
    const normalizedX = dx / distance;
    const normalizedY = dy / distance;

    // When retreating, reverse direction
    const direction = this.isCharging ? 1 : -1;

    // Return velocity scaled by moveSpeed
    return {
      x: normalizedX * this.getMoveSpeed() * direction,
      y: normalizedY * this.getMoveSpeed() * direction,
    };
  }

  /**
   * Check if bat is currently charging
   */
  isChargingState(): boolean {
    return this.isCharging;
  }

  /**
   * Get charge timer value (for testing)
   */
  getChargeTimer(): number {
    return this.chargeTimer;
  }

  /**
   * Get retreat timer value (for testing)
   */
  getRetreatTimer(): number {
    return this.retreatTimer;
  }
}

/**
 * Bat - Flying enemy that charges and retreats
 * Can pass over obstacles
 */
export class Bat extends Enemy {
  protected logic: BatLogic;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Use Bat config from ENEMIES constant
    super(scene, x, y, ENEMIES.BAT, 'enemy-bat');

    // Replace base logic with BatLogic
    this.logic = new BatLogic(ENEMIES.BAT);

    // Configure physics - bats can fly, so disable world collision
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      // Bats fly, so they don't collide with world bounds in the same way
      body.setCollideWorldBounds(true);
    }
  }

  /**
   * Update method - use bat-specific AI
   * Returns true if bat should fire a projectile this frame
   */
  update(targetX: number, targetY: number, deltaTime: number = 0.016): boolean {
    if (this.logic.isDead()) {
      return false;
    }

    // Update AI state - returns true if just started retreat
    const shouldFire = this.logic.updateAI(deltaTime);

    // Calculate bat velocity (charge or retreat)
    const velocity = this.logic.calculateBatVelocity(
      this.x,
      this.y,
      targetX,
      targetY
    );

    // Apply velocity to physics body
    this.setVelocity(velocity.x, velocity.y);

    return shouldFire;
  }

  /**
   * Override to expose BatLogic
   */
  getBatLogic(): BatLogic {
    return this.logic;
  }

  /**
   * Get direction toward a target (for projectile aiming)
   */
  getDirectionToTarget(targetX: number, targetY: number): { x: number; y: number } {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) {
      return { x: 1, y: 0 };
    }

    return { x: dx / distance, y: dy / distance };
  }
}
