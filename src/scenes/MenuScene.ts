import Phaser from 'phaser';

/**
 * MenuScene
 * Main menu with title and start game option
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Title
    this.add
      .text(width / 2, height / 3, '60 Second Legend', {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Subtitle
    this.add
      .text(width / 2, height / 3 + 24, 'A Time-Loop Roguelike', {
        fontSize: '8px',
        color: '#888888',
      })
      .setOrigin(0.5);

    // Start prompt
    const startText = this.add
      .text(width / 2, height * 0.7, 'Press SPACE to Start', {
        fontSize: '10px',
        color: '#00ff88',
      })
      .setOrigin(0.5);

    // Blink effect
    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Input handling
    this.input.keyboard?.once('keydown-SPACE', () => {
      this.startGame();
    });

    // Also allow click/tap
    this.input.once('pointerdown', () => {
      this.startGame();
    });
  }

  private startGame(): void {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }
}
