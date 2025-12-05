/**
 * Vitest test setup file
 * Configures global test environment and mocks
 */

import { vi } from 'vitest';

// Mock Phaser EventEmitter
class MockEventEmitter {
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
}

// Mock Phaser globally since it requires browser APIs
vi.mock('phaser', () => ({
  default: {
    Scene: class MockScene {
      constructor(_config: unknown) {}
      create() {}
      update() {}
    },
    Game: class MockGame {
      constructor(_config: unknown) {}
    },
    Events: {
      EventEmitter: MockEventEmitter,
    },
    GameObjects: {
      Container: class MockContainer {
        scene: unknown;
        x: number;
        y: number;
        constructor(scene: unknown, x: number, y: number) {
          this.scene = scene;
          this.x = x;
          this.y = y;
        }
        add(_child: unknown) {}
        destroy(_fromScene?: boolean) {}
      },
      Text: class MockText {
        constructor() {}
        setOrigin(_x: number, _y: number) { return this; }
        setText(_text: string) { return this; }
        setColor(_color: string) { return this; }
        setAlpha(_alpha: number) { return this; }
        destroy() {}
      },
      Sprite: class MockSprite {
        constructor() {}
        setOrigin(_x: number, _y: number) { return this; }
        setAlpha(_alpha: number) { return this; }
        destroy() {}
      },
    },
    Physics: {
      Arcade: {
        Sprite: class MockSprite {
          constructor() {}
        },
      },
    },
  },
  Scene: class MockScene {
    constructor(_config: unknown) {}
    create() {}
    update() {}
  },
  Game: class MockGame {
    constructor(_config: unknown) {}
  },
  Events: {
    EventEmitter: MockEventEmitter,
  },
  GameObjects: {
    Container: class MockContainer {
      scene: unknown;
      x: number;
      y: number;
      constructor(scene: unknown, x: number, y: number) {
        this.scene = scene;
        this.x = x;
        this.y = y;
      }
      add(_child: unknown) {}
      destroy(_fromScene?: boolean) {}
    },
    Text: class MockText {
      constructor() {}
      setOrigin(_x: number, _y: number) { return this; }
      setText(_text: string) { return this; }
      setColor(_color: string) { return this; }
      setAlpha(_alpha: number) { return this; }
      destroy() {}
    },
    Sprite: class MockSprite {
      constructor() {}
      setOrigin(_x: number, _y: number) { return this; }
      setAlpha(_alpha: number) { return this; }
      destroy() {}
    },
  },
  Physics: {
    Arcade: {
      Sprite: class MockSprite {
        constructor() {}
      },
    },
  },
}));

// Export mocks for use in tests
export * from './mocks/phaser';
