/**
 * Memory Blade
 * Balanced weapon with kill-based healing combo
 *
 * Stats:
 * - Damage: 3
 * - Attack Speed: 0.6s
 * - Range: 24px
 * - Time per Kill: 4s
 * - Time per Hit: 0s
 *
 * Combo: Life Steal
 * - Requirement: 3 kills without taking damage
 * - Effect: Heal 1 HP
 */

import Phaser from 'phaser';
import { WeaponLogic } from '@systems/WeaponSystem';
import { WEAPONS } from '@config/Constants';

/**
 * MemoryBlade - Phaser sprite wrapper for visual effects
 */
export class MemoryBlade extends Phaser.GameObjects.Sprite {
  private logic: WeaponLogic;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'weapon-blade');

    this.logic = new WeaponLogic(WEAPONS.MEMORY_BLADE);

    // Add to scene
    scene.add.existing(this);
    this.setVisible(false);
  }

  /**
   * Play attack animation
   */
  attack(direction: { x: number; y: number }): void {
    // Position weapon in front of player
    const offset = 16;
    this.setPosition(this.x + direction.x * offset, this.y + direction.y * offset);

    // Show weapon
    this.setVisible(true);

    // Rotate based on direction
    this.setRotation(Math.atan2(direction.y, direction.x));

    // Swing animation
    const startAngle = this.rotation - Math.PI / 4;
    const endAngle = this.rotation + Math.PI / 4;

    this.scene.tweens.add({
      targets: this,
      rotation: { from: startAngle, to: endAngle },
      alpha: { from: 1, to: 0 },
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.setVisible(false);
        this.setAlpha(1);
      },
    });
  }

  /**
   * Visual feedback for combo ready
   */
  showComboReady(): void {
    // Healing glow effect
    this.setTint(0x00ff00);
    this.scene.time.delayedCall(500, () => {
      this.clearTint();
    });
  }

  /**
   * Get the underlying logic instance
   */
  getLogic(): WeaponLogic {
    return this.logic;
  }
}
