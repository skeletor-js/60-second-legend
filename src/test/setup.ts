/**
 * Vitest test setup file
 * Configures global test environment and mocks
 */

import { vi } from 'vitest';

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
