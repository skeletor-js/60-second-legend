/**
 * CombatSystem
 * Manages combat interactions between player and enemies
 * Implements testable logic with CombatLogic and Phaser wrapper
 */

import Phaser from 'phaser';
import { Player } from '@entities/Player';
import { Enemy, EnemyLogic } from '@entities/Enemy';
import { COMBAT } from '@config/Constants';

/**
 * Attack data interface
 */
export interface AttackData {
  x: number;
  y: number;
  direction: { x: number; y: number };
  range: number;
  damage: number;
}

/**
 * Hit result interface
 */
export interface HitResult {
  hit: boolean;
  damage: number;
  killed: boolean;
  timeReward: number;
  knockback: { x: number; y: number };
}

/**
 * Combat configuration interface
 */
export interface CombatConfig {
  attackCooldown: number;
  weaponDamage: number;
  attackRange: number;
  knockbackForce: number;
}

/**
 * CombatLogic - Pure logic class for testing
 * Handles all combat logic without Phaser dependencies
 */
export class CombatLogic {
  private attackCooldown: number;
  private cooldownRemaining: number = 0;
  private weaponDamage: number;
  private attackRange: number;
  private knockbackForce: number;

  constructor(config?: Partial<CombatConfig>) {
    this.attackCooldown = config?.attackCooldown ?? COMBAT.ATTACK_COOLDOWN;
    this.weaponDamage = config?.weaponDamage ?? COMBAT.MEMORY_BLADE_DAMAGE;
    this.attackRange = config?.attackRange ?? COMBAT.ATTACK_RANGE;
    this.knockbackForce = config?.knockbackForce ?? COMBAT.KNOCKBACK_FORCE;
  }

  /**
   * Check if attack is ready (no cooldown)
   */
  canAttack(): boolean {
    return this.cooldownRemaining <= 0;
  }

  /**
   * Start an attack
   * Returns AttackData if successful, null if on cooldown
   */
  startAttack(
    x: number,
    y: number,
    direction: { x: number; y: number }
  ): AttackData | null {
    if (!this.canAttack()) {
      return null;
    }

    this.cooldownRemaining = this.attackCooldown;

    return {
      x,
      y,
      direction,
      range: this.attackRange,
      damage: this.weaponDamage,
    };
  }

  /**
   * Update cooldown timer
   */
  update(delta: number): void {
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining = Math.max(0, this.cooldownRemaining - delta);
    }
  }

  /**
   * Calculate damage for current weapon
   */
  calculateDamage(): number {
    return this.weaponDamage;
  }

  /**
   * Calculate knockback vector from attacker to target
   */
  calculateKnockback(
    attackerX: number,
    attackerY: number,
    targetX: number,
    targetY: number
  ): { x: number; y: number } {
    const dx = targetX - attackerX;
    const dy = targetY - attackerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Handle zero distance case
    if (distance === 0) {
      return { x: this.knockbackForce, y: 0 };
    }

    // Normalize and scale by knockback force
    return {
      x: (dx / distance) * this.knockbackForce,
      y: (dy / distance) * this.knockbackForce,
    };
  }

  /**
   * Process a hit on an enemy
   * Returns HitResult with damage, kill status, time reward, and knockback
   */
  processHit(
    enemyLogic: EnemyLogic,
    attackerX: number,
    attackerY: number,
    enemyX: number,
    enemyY: number
  ): HitResult {
    const damageResult = enemyLogic.takeDamage(this.weaponDamage);
    const knockback = this.calculateKnockback(attackerX, attackerY, enemyX, enemyY);

    return {
      hit: true,
      damage: this.weaponDamage,
      killed: damageResult.died,
      timeReward: damageResult.timeReward,
      knockback,
    };
  }

  /**
   * Check if a target is in range of an attack
   */
  isInRange(attackData: AttackData, targetX: number, targetY: number): boolean {
    const dx = targetX - attackData.x;
    const dy = targetY - attackData.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= attackData.range;
  }
}

/**
 * CombatSystem - Phaser wrapper
 * Handles Phaser-specific collision detection and rendering
 */
export class CombatSystem {
  private scene: Phaser.Scene;
  private logic: CombatLogic;

  constructor(scene: Phaser.Scene, config?: Partial<CombatConfig>) {
    this.scene = scene;
    this.logic = new CombatLogic(config);
  }

  /**
   * Set up collision between player and enemies
   */
  setupCollisions(
    player: Player,
    enemies: Phaser.Physics.Arcade.Group,
    walls?: Phaser.Tilemaps.TilemapLayer
  ): void {
    // Player takes damage when touching enemies
    this.scene.physics.add.overlap(
      player,
      enemies,
      (_playerObj, _enemyObj) => {
        const p = _playerObj as unknown as Player;
        const e = _enemyObj as unknown as Enemy;
        if (!e.isDead()) {
          p.takeDamage(e.getDamage());
        }
      }
    );

    // Enemies collide with walls
    if (walls) {
      this.scene.physics.add.collider(enemies, walls);
      this.scene.physics.add.collider(player, walls);
    }
  }

  /**
   * Process player attack against nearby enemies
   * Returns time reward if any enemies were killed
   */
  attackNearbyEnemies(
    player: Player,
    enemies: Phaser.Physics.Arcade.Group,
    direction: { x: number; y: number }
  ): number {
    const attackData = this.logic.startAttack(player.x, player.y, direction);

    if (!attackData) {
      return 0; // On cooldown
    }

    let totalTimeReward = 0;

    // Check each enemy
    enemies.getChildren().forEach((enemyObj) => {
      const enemy = enemyObj as Enemy;
      if (enemy.active && !enemy.isDead()) {
        // Check if in range
        if (this.logic.isInRange(attackData, enemy.x, enemy.y)) {
          // Apply knockback
          const knockback = this.logic.calculateKnockback(
            player.x,
            player.y,
            enemy.x,
            enemy.y
          );

          // Apply knockback velocity
          if (enemy.body) {
            const body = enemy.body as Phaser.Physics.Arcade.Body;
            body.setVelocity(knockback.x, knockback.y);
          }

          // Apply damage and check for kill
          const wasKilled = enemy.takeDamage(attackData.damage);

          if (wasKilled) {
            totalTimeReward += enemy.getTimeReward();
          }
        }
      }
    });

    return totalTimeReward;
  }

  /**
   * Update combat system (handle cooldowns)
   */
  update(deltaTime: number): void {
    this.logic.update(deltaTime);
  }

  /**
   * Check if attack is ready
   */
  canAttack(): boolean {
    return this.logic.canAttack();
  }

  /**
   * Get the underlying logic instance (for testing)
   */
  getLogic(): CombatLogic {
    return this.logic;
  }
}
