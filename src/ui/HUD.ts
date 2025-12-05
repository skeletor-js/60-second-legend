import Phaser from 'phaser';
import { TIME, PLAYER, DISPLAY, CORRUPTION, GameEvents, RELIC } from '@config/Constants';
import { TILESET, TilesetPalette, PALETTE_FRAMES } from '@config/TilesetMapping';
import { TimeManager } from '@systems/TimeManager';
import { CombatMechanics, KillStreakData, ComboData } from '@systems/CombatMechanics';
import { RelicSystem, EquippedRelic } from '@systems/RelicSystem';
import { ShadowSystem } from '@systems/ShadowSystem';

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
 * - Combo counter
 * - Kill streak announcements
 */
export class HUD extends Phaser.GameObjects.Container {
  private logic: HUDLogic;
  private timeManager: TimeManager;
  private combatMechanics: CombatMechanics | null = null;
  private relicSystem: RelicSystem | null = null;
  private shadowSystem: ShadowSystem | null = null;
  private timerText!: Phaser.GameObjects.Text;
  private hearts: Phaser.GameObjects.Sprite[] = [];
  private heartFullFrame: number = 0;
  private heartEmptyFrame: number = 0;
  private popupTexts: Map<number, Phaser.GameObjects.Text> = new Map();
  private timeTickHandler: (data: unknown) => void;
  private timeExtendedHandler: (data: unknown) => void;
  private killStreakHandler: (data: unknown) => void;
  private comboHandler: (data: unknown) => void;
  private perfectDodgeHandler: (data: unknown) => void;
  private corruptionChangedHandler: (data: unknown) => void;

  // Combo display
  private comboText!: Phaser.GameObjects.Text;
  private comboContainer!: Phaser.GameObjects.Container;

  // Relic display
  private relicSlots: Phaser.GameObjects.Container[] = [];
  private relicCooldownTexts: Phaser.GameObjects.Text[] = [];

  // Corruption meter
  private corruptionBarBg!: Phaser.GameObjects.Rectangle;
  private corruptionBarFill!: Phaser.GameObjects.Rectangle;
  private corruptionText!: Phaser.GameObjects.Text;

  private static readonly POPUP_DURATION = 2000; // 2 seconds
  private static readonly POPUP_Y_START = 40;
  private static readonly POPUP_Y_OFFSET = 12;
  private static readonly ANNOUNCEMENT_DURATION = 1500; // 1.5 seconds

  constructor(scene: Phaser.Scene, timeManager: TimeManager, combatMechanics?: CombatMechanics, relicSystem?: RelicSystem, shadowSystem?: ShadowSystem) {
    super(scene, 0, 0);
    this.logic = new HUDLogic();
    this.timeManager = timeManager;
    this.combatMechanics = combatMechanics || null;
    this.relicSystem = relicSystem || null;
    this.shadowSystem = shadowSystem || null;

    // Store handler references for cleanup
    this.timeTickHandler = (data: unknown) => {
      this.onTimeTick(data as { timeRemaining: number });
    };
    this.timeExtendedHandler = (data: unknown) => {
      this.onTimeExtended(data as { amount: number; source: string });
    };
    this.killStreakHandler = (data: unknown) => {
      this.onKillStreak(data as KillStreakData);
    };
    this.comboHandler = (data: unknown) => {
      this.onComboAchieved(data as ComboData);
    };
    this.perfectDodgeHandler = (data: unknown) => {
      this.onPerfectDodge();
    };
    this.corruptionChangedHandler = (data: unknown) => {
      this.onCorruptionChanged(data as { corruption: number });
    };

    this.createTimerDisplay();
    this.createHealthDisplay();
    this.createCorruptionMeter();
    this.createComboDisplay();
    this.createRelicDisplay();
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
   * Uses the 1-bit tileset with white palette for consistent UI
   */
  private createHealthDisplay(): void {
    const startX = 8;
    const startY = 8;
    const heartSpacing = 18;

    // Get UI frames from white palette (consistent UI regardless of floor)
    const uiFrames = PALETTE_FRAMES[TilesetPalette.WHITE].ui;
    this.heartFullFrame = uiFrames.heartFull;
    this.heartEmptyFrame = uiFrames.heartEmpty;

    // Create heart sprites using 1-bit tileset
    for (let i = 0; i < PLAYER.MAX_HEALTH; i++) {
      const heart = this.scene.add.sprite(
        startX + i * heartSpacing,
        startY,
        TILESET.KEY,
        this.heartFullFrame
      );
      heart.setOrigin(0, 0);
      heart.setScrollFactor(0);
      this.hearts.push(heart);
      this.add(heart);
    }

    this.updateHealthDisplay(PLAYER.MAX_HEALTH);
  }

  /**
   * Creates the corruption meter below the timer
   */
  private createCorruptionMeter(): void {
    const barWidth = 100;
    const barHeight = 4;
    const centerX = DISPLAY.WIDTH / 2;
    const y = 28; // Below timer

    // Background bar
    this.corruptionBarBg = this.scene.add.rectangle(
      centerX,
      y,
      barWidth,
      barHeight,
      0x333333
    );
    this.corruptionBarBg.setOrigin(0.5, 0.5);
    this.add(this.corruptionBarBg);

    // Fill bar (purple/dark corruption color)
    this.corruptionBarFill = this.scene.add.rectangle(
      centerX - barWidth / 2,
      y,
      0, // Start at 0 width
      barHeight,
      0x8800ff
    );
    this.corruptionBarFill.setOrigin(0, 0.5);
    this.add(this.corruptionBarFill);

    // Corruption text (percentage)
    this.corruptionText = this.scene.add.text(centerX, y + 8, 'Corruption: 0%', {
      fontFamily: 'monospace',
      fontSize: '6px',
      color: '#888888',
    });
    this.corruptionText.setOrigin(0.5, 0);
    this.add(this.corruptionText);
  }

  /**
   * Creates the combo display at the bottom center
   */
  private createComboDisplay(): void {
    this.comboContainer = this.scene.add.container(DISPLAY.WIDTH / 2, DISPLAY.HEIGHT - 20);
    this.comboContainer.setScrollFactor(0);

    this.comboText = this.scene.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
    });
    this.comboText.setOrigin(0.5, 0.5);
    this.comboContainer.add(this.comboText);
    this.add(this.comboContainer);

    // Initially hidden
    this.comboContainer.setAlpha(0);
  }

  /**
   * Creates the relic display at the top right
   */
  private createRelicDisplay(): void {
    const slotSize = 20;
    const slotSpacing = 4;
    const startX = DISPLAY.WIDTH - 8;
    const startY = 8;

    for (let i = 0; i < PLAYER.MAX_RELICS; i++) {
      const slot = this.scene.add.container(
        startX - i * (slotSize + slotSpacing),
        startY
      );

      // Slot background
      const bg = this.scene.add.rectangle(0, 0, slotSize, slotSize, 0x333333);
      bg.setStrokeStyle(1, 0x666666);
      bg.setOrigin(1, 0);
      slot.add(bg);

      // Cooldown text (initially hidden)
      const cooldownText = this.scene.add.text(0, slotSize / 2, '', {
        fontFamily: 'monospace',
        fontSize: '6px',
        color: '#ffff00',
      });
      cooldownText.setOrigin(1, 0.5);
      cooldownText.setVisible(false);
      slot.add(cooldownText);
      this.relicCooldownTexts.push(cooldownText);

      // Key hint
      const keyHint = this.scene.add.text(0, slotSize + 2, String(i + 1), {
        fontFamily: 'monospace',
        fontSize: '6px',
        color: '#888888',
      });
      keyHint.setOrigin(1, 0);
      slot.add(keyHint);

      this.relicSlots.push(slot);
      this.add(slot);
    }
  }

  /**
   * Sets up event listeners for time and health changes
   */
  private setupEventListeners(): void {
    // Listen for time tick events
    this.timeManager.on(GameEvents.TIME_TICK, this.timeTickHandler);

    // Listen for time extension events
    this.timeManager.on(GameEvents.TIME_EXTENDED, this.timeExtendedHandler);

    // Listen for combat mechanics events
    this.scene.events.on(GameEvents.KILL_STREAK, this.killStreakHandler);
    this.scene.events.on(GameEvents.COMBO_ACHIEVED, this.comboHandler);
    this.scene.events.on(GameEvents.PERFECT_DODGE, this.perfectDodgeHandler);

    // Listen for corruption changes
    if (this.shadowSystem) {
      this.shadowSystem.on(GameEvents.CORRUPTION_CHANGED, this.corruptionChangedHandler);
    }

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

    // Update heart sprites with appropriate frames
    for (let i = 0; i < this.hearts.length; i++) {
      if (i < heartData.filled) {
        // Show filled heart
        this.hearts[i].setFrame(this.heartFullFrame);
        this.hearts[i].setAlpha(1.0);
      } else {
        // Show empty heart
        this.hearts[i].setFrame(this.heartEmptyFrame);
        this.hearts[i].setAlpha(1.0);
      }
    }
  }

  /**
   * Handle corruption changed events
   */
  private onCorruptionChanged(data: { corruption: number }): void {
    const corruption = data.corruption;
    const barWidth = 100;
    const fillWidth = (corruption / 100) * barWidth;

    // Update fill bar width
    this.corruptionBarFill.width = fillWidth;

    // Update text
    this.corruptionText.setText(`Corruption: ${Math.floor(corruption)}%`);

    // Change color based on threshold
    if (corruption >= CORRUPTION.SHADOW_HUNTS) {
      this.corruptionBarFill.setFillStyle(0xff0000); // Red at 100%
      this.corruptionText.setColor('#ff0000');
    } else if (corruption >= CORRUPTION.HIS_GAZE) {
      this.corruptionBarFill.setFillStyle(0xaa00ff); // Dark purple at 75%
      this.corruptionText.setColor('#aa00ff');
    } else if (corruption >= CORRUPTION.CREEPING_DARKNESS) {
      this.corruptionBarFill.setFillStyle(0x8800ff); // Purple at 50%
      this.corruptionText.setColor('#8800ff');
    } else if (corruption >= CORRUPTION.WHISPERS_BEGIN) {
      this.corruptionBarFill.setFillStyle(0x6600cc); // Light purple at 25%
      this.corruptionText.setColor('#6600cc');
    } else {
      this.corruptionBarFill.setFillStyle(0x8800ff);
      this.corruptionText.setColor('#888888');
    }

    // Flash effect when crossing threshold
    if (corruption >= CORRUPTION.CREEPING_DARKNESS) {
      this.scene.tweens.add({
        targets: this.corruptionBarFill,
        alpha: 0.5,
        duration: 200,
        yoyo: true,
        repeat: 2,
      });
    }
  }

  /**
   * Handle kill streak events
   */
  private onKillStreak(data: KillStreakData): void {
    // Create floating announcement text
    const text = this.scene.add.text(
      DISPLAY.WIDTH / 2,
      DISPLAY.HEIGHT / 2 - 20,
      data.announcement,
      {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: `#${data.color.toString(16).padStart(6, '0')}`,
      }
    );
    text.setOrigin(0.5, 0.5);
    text.setScrollFactor(0);
    text.setDepth(101);
    this.add(text);

    // Animate: scale up and fade out
    this.scene.tweens.add({
      targets: text,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      y: DISPLAY.HEIGHT / 2 - 40,
      duration: HUD.ANNOUNCEMENT_DURATION,
      ease: 'Power2',
      onComplete: () => {
        text.destroy();
      },
    });
  }

  /**
   * Handle combo achieved events
   */
  private onComboAchieved(data: ComboData): void {
    if (data.announcement) {
      // Create floating announcement text
      const text = this.scene.add.text(
        DISPLAY.WIDTH / 2,
        DISPLAY.HEIGHT / 2 + 10,
        data.announcement,
        {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: data.color ? `#${data.color.toString(16).padStart(6, '0')}` : '#ffffff',
        }
      );
      text.setOrigin(0.5, 0.5);
      text.setScrollFactor(0);
      text.setDepth(101);
      this.add(text);

      // Animate: scale up and fade out
      this.scene.tweens.add({
        targets: text,
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 0,
        y: DISPLAY.HEIGHT / 2 - 10,
        duration: HUD.ANNOUNCEMENT_DURATION,
        ease: 'Power2',
        onComplete: () => {
          text.destroy();
        },
      });
    }
  }

  /**
   * Handle perfect dodge events
   */
  private onPerfectDodge(): void {
    // Create flash effect
    const flash = this.scene.add.rectangle(
      DISPLAY.WIDTH / 2,
      DISPLAY.HEIGHT / 2,
      DISPLAY.WIDTH,
      DISPLAY.HEIGHT,
      0xffffff,
      0.3
    );
    flash.setScrollFactor(0);
    flash.setDepth(101);
    this.add(flash);

    // Fade out quickly
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        flash.destroy();
      },
    });

    // Show "PERFECT!" text
    const text = this.scene.add.text(DISPLAY.WIDTH / 2, DISPLAY.HEIGHT / 2, 'PERFECT DODGE!', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#00ffff',
    });
    text.setOrigin(0.5, 0.5);
    text.setScrollFactor(0);
    text.setDepth(102);
    this.add(text);

    this.scene.tweens.add({
      targets: text,
      alpha: 0,
      y: DISPLAY.HEIGHT / 2 - 20,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        text.destroy();
      },
    });
  }

  /**
   * Update combo display
   * Called from game scene's update loop
   */
  public updateComboDisplay(): void {
    if (!this.combatMechanics) return;

    const comboCount = this.combatMechanics.getComboCount();

    if (comboCount > 0) {
      const multiplier = this.combatMechanics.getComboMultiplier();
      this.comboText.setText(`${comboCount} HIT COMBO! x${multiplier.toFixed(1)}`);
      this.comboContainer.setAlpha(1);
    } else {
      this.comboContainer.setAlpha(0);
    }
  }

  /**
   * Update relic display with cooldowns
   * Called from game scene's update loop
   */
  public updateRelicDisplay(): void {
    if (!this.relicSystem) return;

    const equippedRelics = this.relicSystem.getEquippedRelics();

    for (let i = 0; i < PLAYER.MAX_RELICS; i++) {
      const slot = this.relicSlots[i];
      const cooldownText = this.relicCooldownTexts[i];
      const bg = slot.getAt(0) as Phaser.GameObjects.Rectangle;

      if (i < equippedRelics.length) {
        const relic = equippedRelics[i];

        // Update slot color based on cooldown status
        if (relic.currentCooldown > 0) {
          bg.setFillStyle(0x666666);
          cooldownText.setText(Math.ceil(relic.currentCooldown).toString());
          cooldownText.setVisible(true);
        } else {
          bg.setFillStyle(0x00ff00);
          cooldownText.setVisible(false);
        }

        // Show charges for multi-use actives
        if (relic.activeCharges !== undefined && relic.activeCharges > 0) {
          const chargeText = slot.getAt(1) as Phaser.GameObjects.Text;
          chargeText.setText(`x${relic.activeCharges}`);
          chargeText.setVisible(true);
        }
      } else {
        // Empty slot
        bg.setFillStyle(0x333333);
        cooldownText.setVisible(false);
      }
    }
  }

  /**
   * Cleanup when HUD is destroyed
   */
  public destroy(fromScene?: boolean): void {
    this.timeManager.off(GameEvents.TIME_TICK, this.timeTickHandler);
    this.timeManager.off(GameEvents.TIME_EXTENDED, this.timeExtendedHandler);
    this.scene.events.off(GameEvents.KILL_STREAK, this.killStreakHandler);
    this.scene.events.off(GameEvents.COMBO_ACHIEVED, this.comboHandler);
    this.scene.events.off(GameEvents.PERFECT_DODGE, this.perfectDodgeHandler);
    if (this.shadowSystem) {
      this.shadowSystem.off(GameEvents.CORRUPTION_CHANGED, this.corruptionChangedHandler);
    }
    super.destroy(fromScene);
  }
}
