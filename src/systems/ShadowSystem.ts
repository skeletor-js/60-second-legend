import Phaser from 'phaser';
import { CORRUPTION, SHADOW, GameEvents } from '@config/Constants';

/**
 * Corruption change data
 */
export interface CorruptionChangeData {
  corruption: number;
  previousCorruption: number;
  source: string;
  threshold?: number;
}

/**
 * ShadowLogic
 * Pure logic class for corruption tracking and threshold management
 * Fully testable without Phaser dependencies
 */
export class ShadowLogic {
  private corruption: number = 0;
  private thresholdsReached: Set<number> = new Set();

  /**
   * Add corruption and return threshold data if crossed
   */
  addCorruption(amount: number, source: string): {
    corruption: number;
    previousCorruption: number;
    source: string;
    thresholdCrossed: number | null;
  } {
    const previous = this.corruption;
    this.corruption = Math.min(100, Math.max(0, this.corruption + amount));

    // Check if we crossed any threshold
    const thresholdCrossed = this.checkThresholdCrossed(previous, this.corruption);

    return {
      corruption: this.corruption,
      previousCorruption: previous,
      source,
      thresholdCrossed,
    };
  }

  /**
   * Reduce corruption
   */
  reduceCorruption(amount: number, source: string): {
    corruption: number;
    previousCorruption: number;
    source: string;
  } {
    const previous = this.corruption;
    this.corruption = Math.min(100, Math.max(0, this.corruption - amount));

    // Reset threshold flags if we go below them
    if (this.corruption < CORRUPTION.SHADOW_HUNTS && this.thresholdsReached.has(CORRUPTION.SHADOW_HUNTS)) {
      this.thresholdsReached.delete(CORRUPTION.SHADOW_HUNTS);
    }
    if (this.corruption < CORRUPTION.HIS_GAZE && this.thresholdsReached.has(CORRUPTION.HIS_GAZE)) {
      this.thresholdsReached.delete(CORRUPTION.HIS_GAZE);
    }
    if (this.corruption < CORRUPTION.CREEPING_DARKNESS && this.thresholdsReached.has(CORRUPTION.CREEPING_DARKNESS)) {
      this.thresholdsReached.delete(CORRUPTION.CREEPING_DARKNESS);
    }
    if (this.corruption < CORRUPTION.WHISPERS_BEGIN && this.thresholdsReached.has(CORRUPTION.WHISPERS_BEGIN)) {
      this.thresholdsReached.delete(CORRUPTION.WHISPERS_BEGIN);
    }

    return {
      corruption: this.corruption,
      previousCorruption: previous,
      source,
    };
  }

  /**
   * Check if corruption crossed a threshold
   */
  private checkThresholdCrossed(previous: number, current: number): number | null {
    // Check thresholds from highest to lowest
    const thresholds = [
      CORRUPTION.SHADOW_HUNTS,
      CORRUPTION.HIS_GAZE,
      CORRUPTION.CREEPING_DARKNESS,
      CORRUPTION.WHISPERS_BEGIN,
    ];

    for (const threshold of thresholds) {
      if (previous < threshold && current >= threshold && !this.thresholdsReached.has(threshold)) {
        this.thresholdsReached.add(threshold);
        return threshold;
      }
    }

    return null;
  }

  /**
   * Get current corruption level
   */
  getCorruption(): number {
    return this.corruption;
  }

  /**
   * Check if a specific threshold has been reached
   */
  hasReachedThreshold(threshold: number): boolean {
    return this.thresholdsReached.has(threshold);
  }

  /**
   * Get corruption percentage (0-1)
   */
  getCorruptionPercentage(): number {
    return this.corruption / 100;
  }
}

/**
 * ShadowSystem
 * Phaser wrapper for corruption system with visual effects
 */
export class ShadowSystem {
  private logic: ShadowLogic;
  private scene: Phaser.Scene;
  private vignetteOverlay: Phaser.GameObjects.Rectangle | null = null;
  private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.logic = new ShadowLogic();
  }

  /**
   * Add corruption from a specific source
   */
  addCorruption(amount: number, source: string): void {
    const result = this.logic.addCorruption(amount, source);

    // Emit corruption changed event
    this.emit(GameEvents.CORRUPTION_CHANGED, {
      corruption: result.corruption,
      previousCorruption: result.previousCorruption,
      source: result.source,
    });

    // Handle threshold crossing
    if (result.thresholdCrossed !== null) {
      this.onThresholdCrossed(result.thresholdCrossed);
    }
  }

  /**
   * Reduce corruption from a specific source
   */
  reduceCorruption(amount: number, source: string): void {
    const result = this.logic.reduceCorruption(amount, source);

    // Emit corruption changed event
    this.emit(GameEvents.CORRUPTION_CHANGED, {
      corruption: result.corruption,
      previousCorruption: result.previousCorruption,
      source: result.source,
    });

    // Update visual effects
    this.updateVisuals();
  }

  /**
   * Handle threshold crossing
   */
  private onThresholdCrossed(threshold: number): void {
    console.log(`Corruption threshold crossed: ${threshold}%`);

    switch (threshold) {
      case CORRUPTION.WHISPERS_BEGIN:
        // 25% - Whispers begin (no visual effect in MVP)
        break;

      case CORRUPTION.CREEPING_DARKNESS:
        // 50% - Creeping Darkness: vignette + faster drain
        this.createVignette();
        this.emit(GameEvents.CORRUPTION_CHANGED, {
          corruption: this.logic.getCorruption(),
          previousCorruption: threshold - 1,
          source: 'threshold_50',
          threshold: CORRUPTION.CREEPING_DARKNESS,
        });
        break;

      case CORRUPTION.HIS_GAZE:
        // 75% - His Gaze (intensify visuals in future)
        this.updateVisuals();
        break;

      case CORRUPTION.SHADOW_HUNTS:
        // 100% - Shadow Hunts: spawn pursuer
        this.emit(GameEvents.SHADOW_SPAWNED, {
          corruption: this.logic.getCorruption(),
        });
        this.createPulseEffect();
        break;
    }
  }

  /**
   * Create dark vignette overlay at 50% corruption
   */
  private createVignette(): void {
    if (this.vignetteOverlay) {
      return; // Already exists
    }

    // Create gradient vignette effect using multiple rectangles
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const edgeSize = 40;

    this.vignetteOverlay = this.scene.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0
    );
    this.vignetteOverlay.setScrollFactor(0);
    this.vignetteOverlay.setDepth(90);

    // Fade in the vignette
    this.scene.tweens.add({
      targets: this.vignetteOverlay,
      alpha: 0.15,
      duration: 2000,
      ease: 'Power2',
    });
  }

  /**
   * Update visual effects based on corruption level
   */
  private updateVisuals(): void {
    if (this.vignetteOverlay) {
      const corruption = this.logic.getCorruption();

      if (corruption < CORRUPTION.CREEPING_DARKNESS) {
        // Remove vignette if below 50%
        this.scene.tweens.add({
          targets: this.vignetteOverlay,
          alpha: 0,
          duration: 1000,
          ease: 'Power2',
          onComplete: () => {
            this.vignetteOverlay?.destroy();
            this.vignetteOverlay = null;
          },
        });
      } else {
        // Scale vignette intensity with corruption (50-100%)
        const intensity = 0.15 + ((corruption - 50) / 50) * 0.15; // 0.15 to 0.3
        this.scene.tweens.add({
          targets: this.vignetteOverlay,
          alpha: intensity,
          duration: 500,
          ease: 'Power2',
        });
      }
    }
  }

  /**
   * Create screen pulse effect at 100% corruption
   */
  private createPulseEffect(): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const pulse = this.scene.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.5
    );
    pulse.setScrollFactor(0);
    pulse.setDepth(95);

    // Pulse animation
    this.scene.tweens.add({
      targets: pulse,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        pulse.destroy();
      },
    });
  }

  /**
   * Get current corruption level
   */
  getCorruption(): number {
    return this.logic.getCorruption();
  }

  /**
   * Get corruption as percentage (0-1)
   */
  getCorruptionPercentage(): number {
    return this.logic.getCorruptionPercentage();
  }

  /**
   * Check if threshold has been reached
   */
  hasReachedThreshold(threshold: number): boolean {
    return this.logic.hasReachedThreshold(threshold);
  }

  // Event emitter methods

  on(event: string, callback: (...args: unknown[]) => void): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return this;
  }

  off(event: string, callback: (...args: unknown[]) => void): this {
    this.listeners.get(event)?.delete(callback);
    return this;
  }

  once(event: string, callback: (...args: unknown[]) => void): this {
    const wrapper = (...args: unknown[]) => {
      this.off(event, wrapper);
      callback(...args);
    };
    return this.on(event, wrapper);
  }

  private emit(event: string, ...args: unknown[]): boolean {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(...args));
      return true;
    }
    return false;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
    return this;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.vignetteOverlay) {
      this.vignetteOverlay.destroy();
      this.vignetteOverlay = null;
    }
    this.removeAllListeners();
  }
}
