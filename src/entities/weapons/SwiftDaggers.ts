/**
 * Swift Daggers
 * Fast, low-damage weapon with hit-based combo
 *
 * Stats:
 * - Damage: 1
 * - Attack Speed: 0.2s (5 attacks/sec)
 * - Range: 16px
 * - Time per Kill: 2s
 * - Time per Hit: 0.3s
 *
 * Combo: Triple Strike
 * - Requirement: 5 hits without taking damage
 * - Effect: Next attack deals 3x damage (3 damage)
 */

import Phaser from 'phaser';
import { WeaponLogic } from '@systems/WeaponSystem';
import { WEAPONS } from '@config/Constants';

/**
 * SwiftDaggers - Phaser sprite wrapper for visual effects
 */
export class SwiftDaggers extends Phaser.GameObjects.Sprite {
  private logic: WeaponLogic;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'weapon-daggers');

    this.logic = new WeaponLogic(WEAPONS.SWIFT_DAGGERS);

    // Add to scene
    scene.add.existing(this);
    this.setVisible(false);
  }

  /**
   * Play attack animation
   */
  attack(direction: { x: number; y: number }): void {
    // Position weapon in front of player
    const offset = 12;
    this.setPosition(this.x + direction.x * offset, this.y + direction.y * offset);

    // Show weapon briefly
    this.setVisible(true);

    // Rotate based on direction
    this.setRotation(Math.atan2(direction.y, direction.x));

    // Flash and hide
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 1, to: 0 },
      duration: 100,
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
    // Glow effect
    this.setTint(0x00ffff);
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
