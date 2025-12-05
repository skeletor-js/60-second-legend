/**
 * Enemy Entity
 * Base enemy class with testable logic and Phaser sprite wrapper
 */

import Phaser from 'phaser';
import { GameEvents } from '../config/Constants';

/**
 * Enemy configuration interface
 */
export interface EnemyConfig {
  maxHealth: number;
  moveSpeed: number;   // pixels per second
  damage: number;      // contact damage
  timeReward: number;  // seconds added on kill
}

/**
 * EnemyLogic - Pure logic class for testing
 * Handles all game logic without Phaser dependencies
 */
export class EnemyLogic {
  private health: number;
  private maxHealth: number;
  private moveSpeed: number;
  private damage: number;
  private timeReward: number;
  private dead: boolean = false;

  constructor(config: EnemyConfig) {
    this.maxHealth = config.maxHealth;
    this.health = config.maxHealth;
    this.moveSpeed = config.moveSpeed;
    this.damage = config.damage;
    this.timeReward = config.timeReward;
  }

  /**
   * Apply damage to the enemy
   * Returns object with died flag and timeReward (if killed)
   */
  takeDamage(amount: number): { died: boolean; timeReward: number } {
    // Cannot take damage when already dead
    if (this.dead) {
      return { died: false, timeReward: 0 };
    }

    // Apply damage
    this.health = Math.max(0, this.health - amount);

    // Check if enemy died
    if (this.health === 0) {
      this.dead = true;
      return { died: true, timeReward: this.timeReward };
    }

    return { died: false, timeReward: 0 };
  }

  /**
   * Calculate velocity to chase a target
   * Returns normalized velocity scaled by moveSpeed
   */
  calculateChaseVelocity(
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

    // Normalize and scale by moveSpeed
    return {
      x: (dx / distance) * this.moveSpeed,
      y: (dy / distance) * this.moveSpeed,
    };
  }

  /**
   * Get current health
   */
  getHealth(): number {
    return this.health;
  }

  /**
   * Get maximum health
   */
  getMaxHealth(): number {
    return this.maxHealth;
  }

  /**
   * Get move speed in pixels per second
   */
  getMoveSpeed(): number {
    return this.moveSpeed;
  }

  /**
   * Get contact damage
   */
  getDamage(): number {
    return this.damage;
  }

  /**
   * Get time reward for killing this enemy
   */
  getTimeReward(): number {
    return this.timeReward;
  }

  /**
   * Check if enemy is dead
   */
  isDead(): boolean {
    return this.dead;
  }
}

/**
 * Enemy Phaser Sprite Wrapper
 * Handles Phaser-specific rendering and physics
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  protected logic: EnemyLogic;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: EnemyConfig,
    texture: string = 'enemy'
  ) {
    super(scene, x, y, texture);

    // Initialize logic
    this.logic = new EnemyLogic(config);

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Configure physics body
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setCollideWorldBounds(true);
    }
  }

  /**
   * Take damage and emit events
   */
  takeDamage(amount: number): boolean {
    const result = this.logic.takeDamage(amount);

    if (result.died) {
      this.onDeath(result.timeReward);
      return true;
    }

    if (this.logic.getHealth() < this.logic.getMaxHealth()) {
      // Emit damage event
      this.scene.events.emit(GameEvents.ENEMY_DAMAGED, {
        enemy: this,
        health: this.logic.getHealth(),
        maxHealth: this.logic.getMaxHealth(),
        amount,
      });

      // Visual feedback - flash sprite
      this.setTint(0xff0000);
      this.scene.time.delayedCall(100, () => {
        this.clearTint();
      });
    }

    return result.died;
  }

  /**
   * Handle enemy death
   */
  protected onDeath(timeReward: number): void {
    // Guard against duplicate death events
    if (!this.active) {
      return;
    }

    // Disable immediately to prevent duplicate calls
    this.setActive(false);
    this.setVisible(false);

    // Emit death event with time reward
    this.scene.events.emit(GameEvents.ENEMY_KILLED, {
      enemy: this,
      timeReward,
    });

    // Destroy after a short delay
    this.scene.time.delayedCall(100, () => {
      this.destroy();
    });
  }

  /**
   * Update method - chase player
   */
  update(targetX: number, targetY: number): void {
    if (this.logic.isDead()) {
      return;
    }

    // Calculate chase velocity
    const velocity = this.logic.calculateChaseVelocity(
      this.x,
      this.y,
      targetX,
      targetY
    );

    // Apply velocity to physics body
    this.setVelocity(velocity.x, velocity.y);
  }

  /**
   * Get current health
   */
  getHealth(): number {
    return this.logic.getHealth();
  }

  /**
   * Get maximum health
   */
  getMaxHealth(): number {
    return this.logic.getMaxHealth();
  }

  /**
   * Get contact damage value
   */
  getDamage(): number {
    return this.logic.getDamage();
  }

  /**
   * Get time reward for killing this enemy
   */
  getTimeReward(): number {
    return this.logic.getTimeReward();
  }

  /**
   * Check if enemy is dead
   */
  isDead(): boolean {
    return this.logic.isDead();
  }
}
