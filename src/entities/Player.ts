/**
 * Player Entity
 * Implements player logic and Phaser sprite wrapper
 */

import Phaser from 'phaser';
import { PLAYER, DISPLAY, GameEvents } from '../config/Constants';

/**
 * Player configuration interface
 */
export interface PlayerConfig {
  maxHealth: number;
  moveSpeed: number; // pixels per second
  iFrameDuration: number; // seconds
}

/**
 * PlayerLogic - Pure logic class for testing
 * Handles all game logic without Phaser dependencies
 */
export class PlayerLogic {
  private health: number;
  private maxHealth: number;
  private moveSpeed: number;
  private iFrameDuration: number;
  private iFrameActive: boolean = false;
  private iFrameTimer: number = 0;
  private dead: boolean = false;
  private facingX: number = 1; // Default facing right
  private facingY: number = 0;

  // Relic-related modifiers
  private speedModifier: number = 0; // Additive speed bonus (0.2 = +20%)
  private damageModifier: number = 0; // Additive damage bonus

  constructor(config: PlayerConfig) {
    this.maxHealth = config.maxHealth;
    this.health = config.maxHealth;
    this.moveSpeed = config.moveSpeed;
    this.iFrameDuration = config.iFrameDuration;
  }

  /**
   * Calculate velocity for 8-directional movement
   * Normalizes diagonal movement to maintain consistent speed
   * Updates facing direction when moving
   */
  calculateVelocity(inputX: number, inputY: number): { x: number; y: number } {
    // No input = no movement
    if (inputX === 0 && inputY === 0) {
      return { x: 0, y: 0 };
    }

    // Update facing direction when moving
    this.facingX = inputX;
    this.facingY = inputY;

    // Calculate magnitude of input vector
    const length = Math.sqrt(inputX * inputX + inputY * inputY);

    // Apply speed modifiers from relics
    const modifiedSpeed = this.moveSpeed * (1 + this.speedModifier);

    // Normalize and scale by modified move speed
    const velocityX = (inputX / length) * modifiedSpeed;
    const velocityY = (inputY / length) * modifiedSpeed;

    return { x: velocityX, y: velocityY };
  }

  /**
   * Get facing direction (normalized)
   */
  getFacingDirection(): { x: number; y: number } {
    const length = Math.sqrt(this.facingX * this.facingX + this.facingY * this.facingY);
    if (length === 0) {
      return { x: 1, y: 0 }; // Default right
    }
    return {
      x: this.facingX / length,
      y: this.facingY / length,
    };
  }

  /**
   * Apply damage to the player
   * Returns true if damage was applied, false if blocked (i-frames or dead)
   */
  takeDamage(amount: number): boolean {
    // Cannot take damage when dead
    if (this.dead) {
      return false;
    }

    // Cannot take damage during i-frames
    if (this.iFrameActive) {
      return false;
    }

    // Ignore zero or negative damage
    if (amount <= 0) {
      return false;
    }

    // Apply damage
    this.health = Math.max(0, this.health - amount);

    // Check if dead
    if (this.health <= 0) {
      this.dead = true;
    }

    // Activate i-frames
    this.activateIFrames(this.iFrameDuration);

    return true;
  }

  /**
   * Activate invincibility frames
   * Can be called by perfect dodge or damage
   */
  activateIFrames(duration: number): void {
    this.iFrameActive = true;
    this.iFrameTimer = duration;
  }

  /**
   * Update method - handles i-frame timer
   */
  update(deltaTime: number): void {
    if (this.iFrameActive) {
      this.iFrameTimer -= deltaTime;
      if (this.iFrameTimer <= 0) {
        this.iFrameActive = false;
        this.iFrameTimer = 0;
      }
    }
  }

  /**
   * Attack method - placeholder for attack logic
   */
  attack(): boolean {
    return true;
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
   * Check if player has invincibility frames active
   */
  isInvulnerable(): boolean {
    return this.iFrameActive;
  }

  /**
   * Check if player is dead
   */
  isDead(): boolean {
    return this.dead;
  }

  /**
   * Set speed modifier (from relics)
   */
  setSpeedModifier(modifier: number): void {
    this.speedModifier = modifier;
  }

  /**
   * Get current speed modifier
   */
  getSpeedModifier(): number {
    return this.speedModifier;
  }

  /**
   * Set damage modifier (from relics)
   */
  setDamageModifier(modifier: number): void {
    this.damageModifier = modifier;
  }

  /**
   * Get current damage modifier
   */
  getDamageModifier(): number {
    return this.damageModifier;
  }

  /**
   * Heal the player
   * @param amount Amount of health to restore
   * @returns true if healed, false if already at max health
   */
  heal(amount: number): boolean {
    if (this.health >= this.maxHealth || amount <= 0) {
      return false;
    }

    this.health = Math.min(this.maxHealth, this.health + amount);
    return true;
  }
}

/**
 * Player Phaser Sprite Wrapper
 * Handles Phaser-specific rendering and physics
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private logic: PlayerLogic;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string = 'player') {
    super(scene, x, y, texture);

    // Initialize logic
    this.logic = new PlayerLogic({
      maxHealth: PLAYER.MAX_HEALTH,
      moveSpeed: PLAYER.MOVE_SPEED * DISPLAY.TILE_SIZE,
      iFrameDuration: PLAYER.I_FRAME_DURATION,
    });

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Configure physics body
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setCollideWorldBounds(true);
      // Use smaller hitbox to avoid wall clipping at tile boundaries
      const hitboxSize = 12;
      const offset = (DISPLAY.TILE_SIZE - hitboxSize) / 2;
      body.setSize(hitboxSize, hitboxSize);
      body.setOffset(offset, offset);
    }
  }

  /**
   * Handle player movement input
   */
  handleMovement(inputX: number, inputY: number): void {
    const velocity = this.logic.calculateVelocity(inputX, inputY);
    this.setVelocity(velocity.x, velocity.y);
  }

  /**
   * Take damage and emit event
   */
  takeDamage(amount: number): boolean {
    const damaged = this.logic.takeDamage(amount);

    if (damaged) {
      // Emit damage event
      this.scene.events.emit(GameEvents.PLAYER_DAMAGED, {
        health: this.logic.getHealth(),
        maxHealth: this.logic.getMaxHealth(),
        amount,
      });

      // Visual feedback - flash sprite
      this.setTint(0xff0000);
      this.scene.time.delayedCall(100, () => {
        this.clearTint();
      });

      // Check if dead
      if (this.logic.isDead()) {
        this.onDeath();
      }
    }

    return damaged;
  }

  /**
   * Activate invincibility frames (for perfect dodge)
   */
  activateIFrames(duration: number): void {
    this.logic.activateIFrames(duration);
  }

  /**
   * Handle player death
   */
  private onDeath(): void {
    // Could emit death event, play animation, etc.
    this.setActive(false);
    this.setVisible(false);
  }

  /**
   * Perform attack
   */
  attack(): void {
    this.logic.attack();
    // Add attack visuals, hitbox, etc.
  }

  /**
   * Update method - called every frame
   */
  update(time: number, delta: number): void {
    // Convert delta from ms to seconds
    const deltaSeconds = delta / 1000;
    this.logic.update(deltaSeconds);

    // Update sprite based on i-frame state (visual feedback)
    if (this.logic.isInvulnerable()) {
      // Flicker effect during i-frames
      const flicker = Math.floor(time / 100) % 2 === 0;
      this.setAlpha(flicker ? 0.5 : 1);
    } else {
      this.setAlpha(1);
    }
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
   * Check if player is dead
   */
  isDead(): boolean {
    return this.logic.isDead();
  }

  /**
   * Check if player is invulnerable
   */
  isInvulnerable(): boolean {
    return this.logic.isInvulnerable();
  }

  /**
   * Get the direction the player is facing
   */
  getFacingDirection(): { x: number; y: number } {
    return this.logic.getFacingDirection();
  }

  /**
   * Set speed modifier (from relics)
   */
  setSpeedModifier(modifier: number): void {
    this.logic.setSpeedModifier(modifier);
  }

  /**
   * Get current speed modifier
   */
  getSpeedModifier(): number {
    return this.logic.getSpeedModifier();
  }

  /**
   * Set damage modifier (from relics)
   */
  setDamageModifier(modifier: number): void {
    this.logic.setDamageModifier(modifier);
  }

  /**
   * Get current damage modifier
   */
  getDamageModifier(): number {
    return this.logic.getDamageModifier();
  }

  /**
   * Heal the player
   */
  heal(amount: number): boolean {
    const healed = this.logic.heal(amount);

    if (healed) {
      // Visual feedback - green flash
      this.setTint(0x00ff00);
      this.scene.time.delayedCall(100, () => {
        this.clearTint();
      });
    }

    return healed;
  }
}
