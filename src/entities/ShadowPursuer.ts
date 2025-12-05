/**
 * Shadow Pursuer Entity
 * The ultimate threat at 100% corruption - phases through walls and deals instant death
 */

import Phaser from 'phaser';
import { SHADOW, DISPLAY, GameEvents } from '@config/Constants';
import { Enemy, EnemyLogic, EnemyConfig } from './Enemy';

/**
 * ShadowPursuerLogic
 * Pure logic for Shadow Pursuer behavior
 */
export class ShadowPursuerLogic extends EnemyLogic {
  private clearedRooms: Set<number> = new Set();

  constructor() {
    super({
      maxHealth: 999, // Unkillable
      moveSpeed: SHADOW.PURSUER_SPEED,
      damage: SHADOW.PURSUER_DAMAGE,
      timeReward: 0, // No reward for killing (it's unkillable anyway)
    });
  }

  /**
   * Calculate velocity toward player (1 tile per second, no normalization needed)
   * Shadow moves in straight line regardless of distance
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

    // Normalize and scale by moveSpeed (SHADOW.PURSUER_SPEED = 16px/s = 1 tile/s)
    return {
      x: (dx / distance) * this.getMoveSpeed(),
      y: (dy / distance) * this.getMoveSpeed(),
    };
  }

  /**
   * Mark a room as cleared (Shadow cannot enter cleared rooms)
   */
  markRoomCleared(roomId: number): void {
    this.clearedRooms.add(roomId);
  }

  /**
   * Check if Shadow is allowed in a specific room
   */
  canEnterRoom(roomId: number): boolean {
    return !this.clearedRooms.has(roomId);
  }

  /**
   * Get cleared rooms
   */
  getClearedRooms(): Set<number> {
    return new Set(this.clearedRooms);
  }

  /**
   * Shadow Pursuer is unkillable
   */
  takeDamage(amount: number): { died: boolean; timeReward: number } {
    // Immune to damage
    return { died: false, timeReward: 0 };
  }
}

/**
 * ShadowPursuer Phaser Sprite
 * Phases through walls, moves slowly, instant death on contact
 */
export class ShadowPursuer extends Enemy {
  protected logic: ShadowPursuerLogic;
  private particleEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private currentRoomId: number = -1;
  private retreating: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    roomData?: {
      rooms: Array<{ id: number; x: number; y: number; width: number; height: number }>;
    }
  ) {
    // Use a dark shadow texture (we'll use a simple circle for MVP)
    super(scene, x, y, {
      maxHealth: 999,
      moveSpeed: SHADOW.PURSUER_SPEED,
      damage: SHADOW.PURSUER_DAMAGE,
      timeReward: 0,
    }, 'enemy-slime'); // Temporary texture, will be tinted dark

    // Replace the logic with ShadowPursuerLogic
    this.logic = new ShadowPursuerLogic();

    // Visual setup - dark tint for shadow effect
    this.setTint(0x000000);
    this.setAlpha(0.7);
    this.setScale(1.2);
    this.setDepth(5);

    // Disable collision with walls (phases through)
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setCollideWorldBounds(false);
    }

    // Create dark particle effect
    this.createParticleEffect();

    // Listen for room cleared events
    this.scene.events.on(GameEvents.ROOM_CLEARED, this.onRoomCleared, this);
  }

  /**
   * Create dark particle trail effect
   */
  private createParticleEffect(): void {
    // Create particles manually without particle manager
    // For MVP, we'll just use a simple pulsing glow effect
    const glow = this.scene.add.circle(this.x, this.y, 16, 0x000000, 0.3);
    glow.setDepth(4);

    // Pulse animation
    this.scene.tweens.add({
      targets: glow,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 1000,
      repeat: -1,
      ease: 'Power2',
    });

    // Update glow position to follow shadow
    this.scene.events.on('update', () => {
      if (glow && this.active) {
        glow.setPosition(this.x, this.y);
      } else if (glow) {
        glow.destroy();
      }
    });
  }

  /**
   * Handle room cleared event
   */
  private onRoomCleared(data: { roomId: number }): void {
    this.logic.markRoomCleared(data.roomId);

    // If we're currently in a cleared room, start retreating
    if (this.currentRoomId === data.roomId) {
      this.retreating = true;
    }
  }

  /**
   * Update - chase player or retreat from cleared rooms
   */
  update(targetX: number, targetY: number): void {
    if (this.logic.isDead()) {
      return;
    }

    // Determine which room we're in
    const myTileX = Math.floor(this.x / DISPLAY.TILE_SIZE);
    const myTileY = Math.floor(this.y / DISPLAY.TILE_SIZE);

    // Check current room - this would need room data passed in
    // For MVP, we'll just chase the player

    // If retreating from a cleared room, move away from player
    if (this.retreating) {
      const velocity = this.logic.calculateChaseVelocity(
        this.x,
        this.y,
        targetX,
        targetY
      );
      // Reverse direction to retreat
      this.setVelocity(-velocity.x, -velocity.y);

      // Stop retreating once we're far enough away (2 tiles)
      const distance = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
      if (distance > DISPLAY.TILE_SIZE * 3) {
        this.retreating = false;
      }
    } else {
      // Normal chase behavior
      const velocity = this.logic.calculateChaseVelocity(
        this.x,
        this.y,
        targetX,
        targetY
      );
      this.setVelocity(velocity.x, velocity.y);
    }
  }

  /**
   * Override takeDamage - Shadow is immune
   */
  takeDamage(amount: number): boolean {
    // Visual feedback - flicker slightly but no damage
    this.scene.tweens.add({
      targets: this,
      alpha: 0.9,
      duration: 50,
      yoyo: true,
      repeat: 1,
    });

    return false; // Never dies
  }

  /**
   * Set current room (called by game scene)
   */
  setCurrentRoom(roomId: number): void {
    this.currentRoomId = roomId;

    // Check if this room is cleared
    if (!this.logic.canEnterRoom(roomId)) {
      this.retreating = true;
    } else {
      this.retreating = false;
    }
  }

  /**
   * Get ShadowPursuerLogic instance
   */
  getShadowLogic(): ShadowPursuerLogic {
    return this.logic;
  }

  /**
   * Cleanup
   */
  destroy(fromScene?: boolean): void {
    this.scene.events.off(GameEvents.ROOM_CLEARED, this.onRoomCleared, this);
    super.destroy(fromScene);
  }
}
