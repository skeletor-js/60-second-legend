/**
 * CombatSystem
 * Manages combat interactions between player and enemies
 * Implements testable logic with CombatLogic and Phaser wrapper
 */

import Phaser from 'phaser';
import { Player } from '@entities/Player';
import { Enemy, EnemyLogic } from '@entities/Enemy';
import { COMBAT, GameEvents } from '@config/Constants';
import { CombatMechanics } from './CombatMechanics';
import { WeaponSystem, WeaponAttackData } from './WeaponSystem';

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
  private mechanics: CombatMechanics;
  private weaponSystem: WeaponSystem | null = null;

  constructor(scene: Phaser.Scene, config?: Partial<CombatConfig>) {
    this.scene = scene;
    this.logic = new CombatLogic(config);
    this.mechanics = new CombatMechanics(scene);
  }

  /**
   * Set the weapon system to use for attacks
   */
  setWeaponSystem(weaponSystem: WeaponSystem): void {
    this.weaponSystem = weaponSystem;
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
          // Update dodge timing for perfect dodge window
          this.mechanics.updateDodgeTime();

          // Try to take damage (may be blocked by i-frames)
          const damaged = p.takeDamage(e.getDamage());

          if (damaged) {
            // Player was damaged, reset kill streak
            this.mechanics.resetKillStreak();
          }
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
    // Use weapon system if available, otherwise use legacy system
    let attackData: (AttackData | WeaponAttackData) | null;
    let weaponTimeReward = 0;

    if (this.weaponSystem) {
      attackData = this.weaponSystem.attack(player.x, player.y, direction);
    } else {
      attackData = this.logic.startAttack(player.x, player.y, direction);
    }

    if (!attackData) {
      return 0; // On cooldown
    }

    // Get damage multiplier from perfect dodge
    const baseDamage = attackData.damage;
    const finalDamage = this.mechanics.calculateDamage(baseDamage);

    // Consume perfect dodge after using it
    if (this.mechanics.isPerfectDodgeActive()) {
      this.mechanics.consumePerfectDodge();
    }

    let totalTimeReward = 0;
    let hitCount = 0;
    let killCount = 0;

    // Check each enemy
    enemies.getChildren().forEach((enemyObj) => {
      const enemy = enemyObj as Enemy;
      if (enemy.active && !enemy.isDead()) {
        // Check if in range
        const inRange = this.isInAttackRange(attackData, enemy.x, enemy.y);

        if (inRange) {
          hitCount++;

          // Apply knockback
          const knockback = this.calculateKnockbackForAttack(
            attackData,
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

          // Check for execute
          const canExecute = this.mechanics.canExecute(
            enemy.getHealth(),
            enemy.getMaxHealth()
          );

          let wasKilled: boolean;
          let executeBonus = 0;

          if (canExecute) {
            // Execute: instant kill
            wasKilled = enemy.takeDamage(enemy.getHealth());
            if (wasKilled) {
              const executeData = this.mechanics.processExecute();
              executeBonus = executeData.bonusTime;

              // Emit execute event for visual feedback
              this.scene.events.emit('combat:execute', {
                enemy,
                bonusTime: executeBonus,
              });
            }
          } else {
            // Normal damage
            wasKilled = enemy.takeDamage(finalDamage);
          }

          if (wasKilled) {
            killCount++;
            totalTimeReward += enemy.getTimeReward() + executeBonus;
            this.mechanics.registerKill();

            // Add weapon-specific time reward
            if (this.weaponSystem) {
              weaponTimeReward += this.weaponSystem.getCurrentWeapon().getTimeReward(true);
              this.weaponSystem.recordHit(true);
            }
          } else {
            // Non-killing hit
            if (this.weaponSystem) {
              weaponTimeReward += this.weaponSystem.getCurrentWeapon().getTimeReward(false);
              this.weaponSystem.recordHit(false);
            }
          }
        }
      }
    });

    // Register multi-kill for weapon combo
    if (this.weaponSystem && killCount >= 2) {
      this.weaponSystem.recordMultiKill(killCount);
    }

    // Register hits for combo system
    if (hitCount > 0) {
      for (let i = 0; i < hitCount; i++) {
        this.mechanics.registerHit();
      }
    }

    return totalTimeReward + weaponTimeReward;
  }

  /**
   * Check if target is in range (handles both AttackData and WeaponAttackData)
   */
  private isInAttackRange(
    attackData: AttackData | WeaponAttackData,
    targetX: number,
    targetY: number
  ): boolean {
    const dx = targetX - attackData.x;
    const dy = targetY - attackData.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check standard range
    if (distance <= attackData.range) {
      return true;
    }

    // Check AOE radius if it exists
    if ('aoeRadius' in attackData && attackData.aoeRadius) {
      return distance <= attackData.aoeRadius;
    }

    return false;
  }

  /**
   * Calculate knockback (handles both AttackData and WeaponAttackData)
   */
  private calculateKnockbackForAttack(
    attackData: AttackData | WeaponAttackData,
    attackerX: number,
    attackerY: number,
    targetX: number,
    targetY: number
  ): { x: number; y: number } {
    const dx = targetX - attackerX;
    const dy = targetY - attackerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Get knockback force
    const knockbackForce = 'knockback' in attackData ? attackData.knockback : COMBAT.KNOCKBACK_FORCE;

    // Handle zero distance case
    if (distance === 0) {
      return { x: knockbackForce, y: 0 };
    }

    // Normalize and scale by knockback force
    return {
      x: (dx / distance) * knockbackForce,
      y: (dy / distance) * knockbackForce,
    };
  }

  /**
   * Update combat system (handle cooldowns and mechanics)
   */
  update(deltaTime: number): void {
    this.logic.update(deltaTime);
    this.mechanics.update(deltaTime * 1000); // Convert to ms for mechanics
    if (this.weaponSystem) {
      this.weaponSystem.update(deltaTime);
    }
  }

  /**
   * Check if attack is ready
   */
  canAttack(): boolean {
    if (this.weaponSystem) {
      return this.weaponSystem.canAttack();
    }
    return this.logic.canAttack();
  }

  /**
   * Get the underlying logic instance (for testing)
   */
  getLogic(): CombatLogic {
    return this.logic;
  }

  /**
   * Get the combat mechanics instance
   */
  getMechanics(): CombatMechanics {
    return this.mechanics;
  }

  /**
   * Get the weapon system instance
   */
  getWeaponSystem(): WeaponSystem | null {
    return this.weaponSystem;
  }

  /**
   * Handle player taking damage (resets kill streak and weapon combo)
   */
  onPlayerDamaged(): void {
    this.mechanics.resetKillStreak();
    if (this.weaponSystem) {
      this.weaponSystem.onPlayerDamaged();
    }
  }

  /**
   * Attempt perfect dodge
   */
  attemptPerfectDodge(): void {
    this.mechanics.attemptPerfectDodge();
  }

  /**
   * Update dodge timing (called when enemy would damage player)
   */
  updateDodgeTime(): void {
    this.mechanics.updateDodgeTime();
  }
}
