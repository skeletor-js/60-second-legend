import Phaser from 'phaser';
import { DISPLAY, TIME, GameEvents } from '@config/Constants';

/**
 * GameScene
 * Main gameplay scene - dungeon exploration and combat
 */
export class GameScene extends Phaser.Scene {
  private timeRemaining: number = TIME.BASE_TIME;
  private timerText!: Phaser.GameObjects.Text;
  private isPaused: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.cameras.main.fadeIn(500);

    // Initialize time
    this.timeRemaining = TIME.BASE_TIME;

    // Create UI
    this.createHUD();

    // Create placeholder content
    this.createPlaceholderContent();

    // Start time countdown
    this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });

    // Debug: Press T to add time
    this.input.keyboard?.on('keydown-T', () => {
      this.extendTime(5, 'debug');
    });

    // Press ESC to pause
    this.input.keyboard?.on('keydown-ESC', () => {
      this.togglePause();
    });
  }

  update(_time: number, _delta: number): void {
    if (this.isPaused) return;

    // Game update logic will go here
  }

  private createHUD(): void {
    const padding = 8;

    // Timer display
    this.timerText = this.add
      .text(DISPLAY.WIDTH / 2, padding, this.formatTime(this.timeRemaining), {
        fontSize: '16px',
        color: '#00ff88',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1000);
  }

  private createPlaceholderContent(): void {
    const { width, height } = this.cameras.main;

    // Placeholder text
    this.add
      .text(width / 2, height / 2, 'Game Scene\n(Development)', {
        fontSize: '12px',
        color: '#666666',
        align: 'center',
      })
      .setOrigin(0.5);

    // Instructions
    this.add
      .text(width / 2, height - 20, 'Press T to add time | ESC to pause', {
        fontSize: '6px',
        color: '#444444',
      })
      .setOrigin(0.5);
  }

  private updateTimer(): void {
    if (this.isPaused) return;

    this.timeRemaining -= TIME.DRAIN_RATE;

    // Update display
    this.timerText.setText(this.formatTime(this.timeRemaining));

    // Update color based on thresholds
    if (this.timeRemaining <= TIME.CRITICAL_THRESHOLD) {
      this.timerText.setColor('#ff0000');
      this.events.emit(GameEvents.TIME_CRITICAL);

      // Pulse effect
      this.tweens.add({
        targets: this.timerText,
        scale: 1.2,
        duration: 100,
        yoyo: true,
      });
    } else if (this.timeRemaining <= TIME.WARNING_THRESHOLD) {
      this.timerText.setColor('#ffff00');
      this.events.emit(GameEvents.TIME_WARNING);
    } else {
      this.timerText.setColor('#00ff88');
    }

    // Check for time expired
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.events.emit(GameEvents.TIME_EXPIRED);
      this.gameOver();
    }
  }

  private extendTime(amount: number, source: string): void {
    const previousTime = this.timeRemaining;
    this.timeRemaining = Math.min(this.timeRemaining + amount, TIME.MAX_TIME);
    const actualGain = this.timeRemaining - previousTime;

    if (actualGain > 0) {
      this.events.emit(GameEvents.TIME_EXTENDED, { amount: actualGain, source });
      this.showTimePopup(actualGain);
    }
  }

  private showTimePopup(amount: number): void {
    const popup = this.add
      .text(DISPLAY.WIDTH / 2, 30, `+${amount}s`, {
        fontSize: '10px',
        color: '#00ff88',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1001);

    this.tweens.add({
      targets: popup,
      y: popup.y - 20,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => popup.destroy(),
    });
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.physics.pause();
      // Show pause overlay
      const pauseOverlay = this.add
        .rectangle(
          DISPLAY.WIDTH / 2,
          DISPLAY.HEIGHT / 2,
          DISPLAY.WIDTH,
          DISPLAY.HEIGHT,
          0x000000,
          0.7
        )
        .setScrollFactor(0)
        .setDepth(999)
        .setName('pauseOverlay');

      this.add
        .text(DISPLAY.WIDTH / 2, DISPLAY.HEIGHT / 2, 'PAUSED', {
          fontSize: '16px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1000)
        .setName('pauseText');
    } else {
      this.physics.resume();
      // Remove pause overlay
      this.children.getByName('pauseOverlay')?.destroy();
      this.children.getByName('pauseText')?.destroy();
    }
  }

  private gameOver(): void {
    this.physics.pause();

    // Game over overlay
    this.add
      .rectangle(
        DISPLAY.WIDTH / 2,
        DISPLAY.HEIGHT / 2,
        DISPLAY.WIDTH,
        DISPLAY.HEIGHT,
        0x000000,
        0.8
      )
      .setScrollFactor(0)
      .setDepth(999);

    this.add
      .text(DISPLAY.WIDTH / 2, DISPLAY.HEIGHT / 2 - 10, 'TIME EXPIRED', {
        fontSize: '16px',
        color: '#ff0000',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1000);

    this.add
      .text(DISPLAY.WIDTH / 2, DISPLAY.HEIGHT / 2 + 20, 'Press SPACE to retry', {
        fontSize: '8px',
        color: '#888888',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1000);

    this.input.keyboard?.once('keydown-SPACE', () => {
      this.scene.restart();
    });
  }
}
