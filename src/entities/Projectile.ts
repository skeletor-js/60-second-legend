/**
 * Projectile
 * Generic projectile class for weapons and enemies
 */

import Phaser from 'phaser';

export interface ProjectileConfig {
  speed: number;       // Pixels per second
  damage: number;      // Damage on hit
  lifetime: number;    // Max lifetime in ms
  piercing?: boolean;  // Can hit multiple enemies
  isEnemy?: boolean;   // Is this an enemy projectile (damages player)
}

/**
 * Projectile sprite class
 */
export class Projectile extends Phaser.Physics.Arcade.Sprite {
  private config: ProjectileConfig;
  private direction: { x: number; y: number };
  private lifetimeRemaining: number;
  private hasHit: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    frame: number,
    direction: { x: number; y: number },
    config: ProjectileConfig
  ) {
    super(scene, x, y, texture, frame);

    this.config = config;
    this.direction = direction;
    this.lifetimeRemaining = config.lifetime;

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set rotation to face direction
    this.setRotation(Math.atan2(direction.y, direction.x));

    // Set velocity
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(direction.x * config.speed, direction.y * config.speed);
      body.setAllowGravity(false);
    }

    this.setDepth(5);
  }

  /**
   * Update projectile
   * Returns true if projectile should be destroyed
   */
  updateProjectile(delta: number): boolean {
    this.lifetimeRemaining -= delta;

    if (this.lifetimeRemaining <= 0) {
      return true; // Should be destroyed
    }

    return false;
  }

  /**
   * Called when projectile hits a target
   * Returns damage dealt
   */
  onHit(): number {
    if (this.hasHit && !this.config.piercing) {
      return 0;
    }

    this.hasHit = true;

    if (!this.config.piercing) {
      // Non-piercing projectiles are destroyed on hit
      this.destroy();
    }

    return this.config.damage;
  }

  /**
   * Get damage value
   */
  getDamage(): number {
    return this.config.damage;
  }

  /**
   * Check if this is an enemy projectile
   */
  isEnemyProjectile(): boolean {
    return this.config.isEnemy ?? false;
  }

  /**
   * Check if projectile has already hit
   */
  hasHitTarget(): boolean {
    return this.hasHit;
  }

  /**
   * Activate projectile - sets velocity
   * Call this AFTER adding to a physics group to ensure velocity is applied
   */
  activate(): void {
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(
        this.direction.x * this.config.speed,
        this.direction.y * this.config.speed
      );
      body.setAllowGravity(false);
    }
  }
}
