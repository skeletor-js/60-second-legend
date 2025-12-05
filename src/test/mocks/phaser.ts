import { vi } from 'vitest';

/**
 * Mock Phaser EventEmitter for testing event-driven systems
 */
export class MockEventEmitter {
  private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();

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

  emit(event: string, ...args: unknown[]): boolean {
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

  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

/**
 * Mock Phaser.Time.TimerEvent
 */
export class MockTimerEvent {
  callback: () => void;
  delay: number;
  loop: boolean;
  paused: boolean = false;
  elapsed: number = 0;

  constructor(config: { delay: number; callback: () => void; loop?: boolean }) {
    this.callback = config.callback;
    this.delay = config.delay;
    this.loop = config.loop ?? false;
  }

  remove(): void {
    // Timer removed
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }
}

/**
 * Mock Phaser Scene for testing
 */
export function createMockScene() {
  const events = new MockEventEmitter();
  const timerEvents: MockTimerEvent[] = [];

  return {
    events,
    time: {
      addEvent: vi.fn((config: { delay: number; callback: () => void; callbackScope?: unknown; loop?: boolean }) => {
        const timerEvent = new MockTimerEvent({
          delay: config.delay,
          callback: config.callbackScope ? config.callback.bind(config.callbackScope) : config.callback,
          loop: config.loop,
        });
        timerEvents.push(timerEvent);
        return timerEvent;
      }),
      removeEvent: vi.fn((event: MockTimerEvent) => {
        const index = timerEvents.indexOf(event);
        if (index !== -1) {
          timerEvents.splice(index, 1);
        }
      }),
    },
    add: {
      text: vi.fn(() => ({
        setOrigin: vi.fn().mockReturnThis(),
        setScrollFactor: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setText: vi.fn().mockReturnThis(),
        setColor: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
      })),
      sprite: vi.fn(() => ({
        setOrigin: vi.fn().mockReturnThis(),
        setScale: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setTexture: vi.fn().mockReturnThis(),
        setFrame: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        setScrollFactor: vi.fn().mockReturnThis(),
        play: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
      })),
      rectangle: vi.fn(() => ({
        setOrigin: vi.fn().mockReturnThis(),
        setScrollFactor: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setStrokeStyle: vi.fn().mockReturnThis(),
        setFillStyle: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
      })),
      container: vi.fn(() => ({
        add: vi.fn().mockReturnThis(),
        setScrollFactor: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
      })),
    },
    tweens: {
      add: vi.fn(() => ({
        stop: vi.fn(),
      })),
    },
    physics: {
      pause: vi.fn(),
      resume: vi.fn(),
    },
    cameras: {
      main: {
        width: 320,
        height: 180,
        fadeIn: vi.fn(),
        fadeOut: vi.fn(),
      },
    },
    input: {
      keyboard: {
        on: vi.fn(),
        once: vi.fn(),
      },
    },
    // Helper to simulate time passing and trigger timer callbacks
    __simulateTick: (count: number = 1) => {
      for (let i = 0; i < count; i++) {
        timerEvents.forEach((event) => {
          if (!event.paused) {
            event.callback();
          }
        });
      }
    },
    __getTimerEvents: () => timerEvents,
  };
}

/**
 * Mock Phaser.Physics.Arcade.Sprite for entity testing
 */
export function createMockSprite() {
  return {
    x: 0,
    y: 0,
    body: {
      velocity: { x: 0, y: 0 },
      setVelocity: vi.fn(function (this: { velocity: { x: number; y: number } }, x: number, y: number) {
        this.velocity.x = x;
        this.velocity.y = y;
      }),
      setVelocityX: vi.fn(),
      setVelocityY: vi.fn(),
    },
    setVelocity: vi.fn(),
    setPosition: vi.fn(function (this: { x: number; y: number }, x: number, y: number) {
      this.x = x;
      this.y = y;
    }),
    play: vi.fn(),
    anims: {
      play: vi.fn(),
      stop: vi.fn(),
    },
    setOrigin: vi.fn().mockReturnThis(),
    setScale: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setTint: vi.fn().mockReturnThis(),
    clearTint: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    setTexture: vi.fn().mockReturnThis(),
    setFrame: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };
}
