import Phaser from 'phaser';
import { SPRITE_SHEETS, IMAGES, AUDIO } from '@config/AssetManifest';

/**
 * BootScene
 * Handles asset preloading and displays loading progress
 */
export class BootScene extends Phaser.Scene {
  private loadingBar!: Phaser.GameObjects.Graphics;
  private progressBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.createLoadingUI();
    this.loadAssets();
  }

  create(): void {
    // Transition to menu after loading
    this.scene.start('MenuScene');
  }

  private createLoadingUI(): void {
    const { width, height } = this.cameras.main;
    const barWidth = width * 0.6;
    const barHeight = 8;
    const x = (width - barWidth) / 2;
    const y = height / 2;

    // Background bar
    this.loadingBar = this.add.graphics();
    this.loadingBar.fillStyle(0x222222, 1);
    this.loadingBar.fillRect(x, y, barWidth, barHeight);

    // Progress bar
    this.progressBar = this.add.graphics();

    // Loading text
    this.add
      .text(width / 2, y - 20, '60 Second Legend', {
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, y + 20, 'Loading...', {
        fontSize: '8px',
        color: '#888888',
      })
      .setOrigin(0.5);

    // Progress events
    this.load.on('progress', (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0x00ff88, 1);
      this.progressBar.fillRect(x + 2, y + 2, (barWidth - 4) * value, barHeight - 4);
    });

    this.load.on('complete', () => {
      this.progressBar.destroy();
      this.loadingBar.destroy();
    });
  }

  private loadAssets(): void {
    // Load sprite sheets
    for (const sheet of SPRITE_SHEETS) {
      this.load.spritesheet(sheet.key, sheet.path, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
      });
    }

    // Load images
    for (const image of IMAGES) {
      this.load.image(image.key, image.path);
    }

    // Load audio
    for (const audio of AUDIO) {
      this.load.audio(audio.key, audio.path);
    }
  }
}
