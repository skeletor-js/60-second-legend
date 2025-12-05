import Phaser from 'phaser';
import { TIME, PLAYER, DISPLAY, GameEvents } from '@config/Constants';
import { TimeManager } from '@systems/TimeManager';

/**
 * Interface for time extension popup tracking
 */
export interface TimeExtensionPopup {
  id: number;
  amount: number;
  source: string;
  createdAt: number;
}

/**
 * HUD color constants
 */
export const HUD_COLORS = {
  TIME_NORMAL: '#00ff88',
  TIME_WARNING: '#ffff00',
  TIME_CRITICAL: '#ff0000',
} as const;

/**
 * HUDLogic
 * Pure logic class for HUD calculations and state management.
 * Fully testable without Phaser dependencies.
 */
export class HUDLogic {
  private popups: TimeExtensionPopup[] = [];
  private popupIdCounter: number = 0;

  /**
   * Formats time in MM:SS format
   * @param seconds Time in seconds
   * @returns Formatted time string (e.g., "1:00", "0:05")
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Gets the appropriate color for the given time remaining
   * @param seconds Time remaining in seconds
   * @returns Color hex string
   */
  getColorForTime(seconds: number): string {
    if (seconds <= TIME.CRITICAL_THRESHOLD) {
      return HUD_COLORS.TIME_CRITICAL;
    }
    if (seconds <= TIME.WARNING_THRESHOLD) {
      return HUD_COLORS.TIME_WARNING;
    }
    return HUD_COLORS.TIME_NORMAL;
  }

  /**
   * Calculates the number of filled and empty hearts to display
   * @param currentHealth Current player health
   * @param maxHealth Maximum player health
   * @returns Object with filled and empty heart counts
   */
  getHeartCount(currentHealth: number, maxHealth: number): { filled: number; empty: number } {
    const filled = Math.max(0, currentHealth);
    const empty = maxHealth - filled;
    return {
      filled,
      empty,
    };
  }

  /**
   * Adds a new time extension popup
   * @param amount Time amount added
   * @param source Source of the time extension
   * @returns The created popup
   */
  addPopup(amount: number, source: string): TimeExtensionPopup {
    const popup: TimeExtensionPopup = {
      id: ++this.popupIdCounter,
      amount,
      source,
      createdAt: Date.now(),
    };
    this.popups.push(popup);
    return popup;
  }

  /**
   * Removes a popup by ID
   * @param id Popup ID to remove
   */
  removePopup(id: number): void {
    this.popups = this.popups.filter((p) => p.id !== id);
  }

  /**
   * Gets all active popups
   * @returns Array of active popups (copy to prevent mutations)
   */
  getActivePopups(): TimeExtensionPopup[] {
    return [...this.popups];
  }
}

/**
 * HUD
 * Phaser container for displaying game HUD elements:
 * - Timer display with color-coded warnings
 * - Health hearts
 * - Time extension popups
 */
export class HUD extends Phaser.GameObjects.Container {
  private logic: HUDLogic;
  private timeManager: TimeManager;
  private timerText!: Phaser.GameObjects.Text;
  private hearts: Phaser.GameObjects.Sprite[] = [];
  private popupTexts: Map<number, Phaser.GameObjects.Text> = new Map();
  private timeTickHandler: (data: unknown) => void;
  private timeExtendedHandler: (data: unknown) => void;

  private static readonly POPUP_DURATION = 2000; // 2 seconds
  private static readonly POPUP_Y_START = 40;
  private static readonly POPUP_Y_OFFSET = 12;

  constructor(scene: Phaser.Scene, timeManager: TimeManager) {
    super(scene, 0, 0);
    this.logic = new HUDLogic();
    this.timeManager = timeManager;

    // Store handler references for cleanup
    this.timeTickHandler = (data: unknown) => {
      this.onTimeTick(data as { timeRemaining: number });
    };
    this.timeExtendedHandler = (data: unknown) => {
      this.onTimeExtended(data as { amount: number; source: string });
    };

    this.createTimerDisplay();
    this.createHealthDisplay();
    this.setupEventListeners();

    scene.add.existing(this);

    // Keep HUD fixed on screen (doesn't scroll with camera)
    this.setScrollFactor(0);
    this.setDepth(100);
  }

  /**
   * Creates the timer display at the top center of the screen
   */
  private createTimerDisplay(): void {
    this.timerText = this.scene.add.text(DISPLAY.WIDTH / 2, 8, '1:00', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: HUD_COLORS.TIME_NORMAL,
    });
    this.timerText.setOrigin(0.5, 0);
    this.add(this.timerText);
  }

  /**
   * Creates the health display at the top left of the screen
   */
  private createHealthDisplay(): void {
    const startX = 8;
    const startY = 8;
    const heartSpacing = 18;

    // Create heart sprites using ui-icons-16 sprite sheet
    for (let i = 0; i < PLAYER.MAX_HEALTH; i++) {
      const heart = this.scene.add.sprite(
        startX + i * heartSpacing,
        startY,
        'ui-icons-16',
        0 // First frame - adjust if heart is at different index
      );
      heart.setOrigin(0, 0);
      heart.setScrollFactor(0);
      this.hearts.push(heart);
      this.add(heart);
    }

    this.updateHealthDisplay(PLAYER.MAX_HEALTH);
  }

  /**
   * Sets up event listeners for time and health changes
   */
  private setupEventListeners(): void {
    // Listen for time tick events
    this.timeManager.on(GameEvents.TIME_TICK, this.timeTickHandler);

    // Listen for time extension events
    this.timeManager.on(GameEvents.TIME_EXTENDED, this.timeExtendedHandler);

    // Note: Health events would be handled by a PlayerManager/CombatManager
    // For now, we'll support manual updates via updateHealthDisplay
  }

  /**
   * Updates the timer display
   */
  private onTimeTick(data: { timeRemaining: number }): void {
    const timeRemaining = data.timeRemaining;
    this.timerText.setText(this.logic.formatTime(timeRemaining));
    this.timerText.setColor(this.logic.getColorForTime(timeRemaining));
  }

  /**
   * Handles time extension events by creating popups
   */
  private onTimeExtended(data: { amount: number; source: string }): void {
    const popup = this.logic.addPopup(data.amount, data.source);
    this.createPopupText(popup);

    // Auto-remove after duration
    this.scene.time.delayedCall(HUD.POPUP_DURATION, () => {
      this.removePopupText(popup.id);
    });
  }

  /**
   * Creates a visual text popup for time extension
   */
  private createPopupText(popup: TimeExtensionPopup): void {
    const activePopups = this.logic.getActivePopups();
    const index = activePopups.findIndex((p) => p.id === popup.id);

    const text = this.scene.add.text(
      DISPLAY.WIDTH / 2,
      HUD.POPUP_Y_START + index * HUD.POPUP_Y_OFFSET,
      `+${popup.amount}s ${popup.source}`,
      {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: HUD_COLORS.TIME_NORMAL,
      }
    );
    text.setOrigin(0.5, 0);
    this.add(text);
    this.popupTexts.set(popup.id, text);

    // Fade out animation
    this.scene.tweens.add({
      targets: text,
      alpha: 0,
      duration: HUD.POPUP_DURATION,
      ease: 'Power2',
    });
  }

  /**
   * Removes a popup text from display
   */
  private removePopupText(popupId: number): void {
    const text = this.popupTexts.get(popupId);
    if (text) {
      text.destroy();
      this.popupTexts.delete(popupId);
    }
    this.logic.removePopup(popupId);
  }

  /**
   * Updates the health display
   * @param currentHealth Current player health
   */
  public updateHealthDisplay(currentHealth: number): void {
    const heartData = this.logic.getHeartCount(currentHealth, PLAYER.MAX_HEALTH);

    // Update heart sprites
    // In real implementation, you'd set different frames/textures
    // For now, we just track the state
    for (let i = 0; i < this.hearts.length; i++) {
      if (i < heartData.filled) {
        // Show filled heart
        this.hearts[i].setAlpha(1.0);
      } else {
        // Show empty heart
        this.hearts[i].setAlpha(0.3);
      }
    }
  }

  /**
   * Cleanup when HUD is destroyed
   */
  public destroy(fromScene?: boolean): void {
    this.timeManager.off(GameEvents.TIME_TICK, this.timeTickHandler);
    this.timeManager.off(GameEvents.TIME_EXTENDED, this.timeExtendedHandler);
    super.destroy(fromScene);
  }
}
