/**
 * Shatter Hammer
 * Slow, high-damage AOE weapon with multi-kill combo
 *
 * Stats:
 * - Damage: 5
 * - Attack Speed: 1.2s
 * - Range: 20px
 * - AOE Radius: 24px
 * - Time per Kill: 6s
 * - Time per Hit: 0s
 *
 * Combo: Ground Pound
 * - Requirement: 2 multi-kills (2+ enemies per swing)
 * - Effect: Stun nearby enemies for 1.5s in 32px radius
 */

import Phaser from 'phaser';
import { WeaponLogic } from '@systems/WeaponSystem';
import { WEAPONS } from '@config/Constants';

/**
 * ShatterHammer - Phaser sprite wrapper for visual effects
 */
export class ShatterHammer extends Phaser.GameObjects.Sprite {
  private logic: WeaponLogic;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'weapon-hammer');

    this.logic = new WeaponLogic(WEAPONS.SHATTER_HAMMER);

    // Add to scene
    scene.add.existing(this);
    this.setVisible(false);
    this.setScale(1.5); // Larger weapon
  }

  /**
   * Play attack animation
   */
  attack(direction: { x: number; y: number }): void {
    // Position weapon in front of player
    const offset = 18;
    this.setPosition(this.x + direction.x * offset, this.y + direction.y * offset);

    // Show weapon
    this.setVisible(true);

    // Rotate based on direction
    this.setRotation(Math.atan2(direction.y, direction.x));

    // Heavy slam animation
    const startY = this.y - 10;
    const endY = this.y + 5;

    this.scene.tweens.add({
      targets: this,
      y: { from: startY, to: endY },
      alpha: { from: 1, to: 0 },
      duration: 300,
      ease: 'Cubic.In',
      onComplete: () => {
        this.setVisible(false);
        this.setAlpha(1);
      },
    });

    // Create impact effect
    this.createImpactEffect();
  }

  /**
   * Create visual impact effect for AOE
   */
  private createImpactEffect(): void {
    const circle = this.scene.add.circle(this.x, this.y, 0, 0xffffff, 0.3);

    this.scene.tweens.add({
      targets: circle,
      radius: 24,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        circle.destroy();
      },
    });
  }

  /**
   * Visual feedback for combo ready
   */
  showComboReady(): void {
    // Explosive glow effect
    this.setTint(0xff4400);
    this.scene.time.delayedCall(500, () => {
      this.clearTint();
    });
  }

  /**
   * Play ground pound combo effect
   */
  playGroundPound(): void {
    // Large shockwave effect
    const circle = this.scene.add.circle(this.x, this.y, 0, 0xff4400, 0.4);

    this.scene.tweens.add({
      targets: circle,
      radius: 32,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        circle.destroy();
      },
    });
  }

  /**
   * Get the underlying logic instance
   */
  getLogic(): WeaponLogic {
    return this.logic;
  }
}
