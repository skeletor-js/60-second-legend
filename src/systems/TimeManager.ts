import { TIME, GameEvents } from '@config/Constants';

/**
 * Interface for time extension tracking
 */
export interface TimeExtension {
  amount: number;
  source: string;
  timestamp: number;
}

/**
 * TimeManager
 * Handles all time-related logic for the 60 Second Legend game.
 * Manages time countdown, extensions, threshold warnings, and pause state.
 */
export class TimeManager {
  private timeRemaining: number;
  private paused: boolean;
  private recentExtensions: TimeExtension[];
  private warningEmitted: boolean;
  private criticalEmitted: boolean;
  private expiredEmitted: boolean;
  private listeners: Map<string, Set<(...args: unknown[]) => void>>;
  private static readonly MAX_RECENT_EXTENSIONS = 5;

  constructor() {
    this.timeRemaining = TIME.BASE_TIME;
    this.paused = false;
    this.recentExtensions = [];
    this.warningEmitted = false;
    this.criticalEmitted = false;
    this.expiredEmitted = false;
    this.listeners = new Map();
  }

  /**
   * Advances time by the specified number of ticks
   * @param count Number of ticks to process (default: 1)
   */
  tick(count: number = 1): void {
    if (this.paused || count <= 0) return;

    const previousTime = this.timeRemaining;
    this.timeRemaining = Math.max(0, this.timeRemaining - TIME.DRAIN_RATE * count);

    // Emit tick event
    this.emit(GameEvents.TIME_TICK, {
      timeRemaining: this.timeRemaining,
      delta: previousTime - this.timeRemaining,
    });

    // Check threshold crossings
    this.checkThresholds(previousTime, this.timeRemaining);

    // Check for time expired
    if (this.timeRemaining === 0 && !this.expiredEmitted) {
      this.emit(GameEvents.TIME_EXPIRED, { timeRemaining: 0 });
      this.expiredEmitted = true;
    }
  }

  /**
   * Extends time by the specified amount, capped at MAX_TIME
   * @param amount Time to add in seconds
   * @param source Description of what caused the time extension
   */
  extendTime(amount: number, source: string): void {
    // Don't allow negative extensions
    if (amount <= 0) return;

    const previousTime = this.timeRemaining;
    this.timeRemaining = Math.min(this.timeRemaining + amount, TIME.MAX_TIME);
    const actualGain = this.timeRemaining - previousTime;

    // Only emit event and track if time was actually gained
    if (actualGain > 0) {
      this.emit(GameEvents.TIME_EXTENDED, {
        amount: actualGain,
        source,
        timeRemaining: this.timeRemaining,
      });

      // Track recent extension
      this.recentExtensions.push({
        amount: actualGain,
        source,
        timestamp: Date.now(),
      });

      // Keep only the most recent extensions
      if (this.recentExtensions.length > TimeManager.MAX_RECENT_EXTENSIONS) {
        this.recentExtensions.shift();
      }

      // Reset warning flags if we're back above thresholds
      if (previousTime <= TIME.WARNING_THRESHOLD && this.timeRemaining > TIME.WARNING_THRESHOLD) {
        this.warningEmitted = false;
      }
      if (previousTime <= TIME.CRITICAL_THRESHOLD && this.timeRemaining > TIME.CRITICAL_THRESHOLD) {
        this.criticalEmitted = false;
      }
    }
  }

  /**
   * Pauses time progression
   */
  pause(): void {
    this.paused = true;
  }

  /**
   * Resumes time progression
   */
  resume(): void {
    this.paused = false;
  }

  /**
   * Returns whether time is currently paused
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * Returns the current time remaining
   */
  getTimeRemaining(): number {
    return this.timeRemaining;
  }

  /**
   * Returns the list of recent time extensions
   */
  getRecentExtensions(): TimeExtension[] {
    return [...this.recentExtensions];
  }

  /**
   * Checks if time crossed any warning thresholds
   */
  private checkThresholds(previousTime: number, currentTime: number): void {
    // Check critical threshold (10s)
    if (previousTime > TIME.CRITICAL_THRESHOLD && currentTime <= TIME.CRITICAL_THRESHOLD && !this.criticalEmitted) {
      this.emit(GameEvents.TIME_CRITICAL, {
        timeRemaining: currentTime,
      });
      this.criticalEmitted = true;
    }
    // Check warning threshold (30s)
    else if (previousTime > TIME.WARNING_THRESHOLD && currentTime <= TIME.WARNING_THRESHOLD && !this.warningEmitted) {
      this.emit(GameEvents.TIME_WARNING, {
        timeRemaining: currentTime,
      });
      this.warningEmitted = true;
    }
  }

  // Event emitter methods

  /**
   * Register an event listener
   */
  on(event: string, callback: (...args: unknown[]) => void): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return this;
  }

  /**
   * Remove an event listener
   */
  off(event: string, callback: (...args: unknown[]) => void): this {
    this.listeners.get(event)?.delete(callback);
    return this;
  }

  /**
   * Register a one-time event listener
   */
  once(event: string, callback: (...args: unknown[]) => void): this {
    const wrapper = (...args: unknown[]) => {
      this.off(event, wrapper);
      callback(...args);
    };
    return this.on(event, wrapper);
  }

  /**
   * Emit an event to all registered listeners
   */
  private emit(event: string, ...args: unknown[]): boolean {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(...args));
      return true;
    }
    return false;
  }

  /**
   * Remove all listeners for a specific event or all events
   */
  removeAllListeners(event?: string): this {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
    return this;
  }
}
