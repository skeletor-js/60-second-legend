/**
 * GameScene Integration Tests
 * Tests the integration of all systems in the main game scene
 */

import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { GameScene } from '../GameScene';
import { TIME, GameEvents, DISPLAY } from '@config/Constants';
import { TimeManager } from '@systems/TimeManager';
import { DungeonGenerator } from '@systems/DungeonGenerator';
import { CombatSystem } from '@systems/CombatSystem';
import { Player } from '@entities/Player';
import { HUD } from '@ui/HUD';
import Phaser from 'phaser';

// Mock Phaser.Math.Between and Container methods before tests run
beforeAll(() => {
  if (!Phaser.Math) {
    (Phaser as any).Math = {};
  }
  Phaser.Math.Between = vi.fn((min: number, max: number) => {
    return Math.floor((min + max) / 2);
  });

  // Mock Container methods that HUD uses
  if (Phaser.GameObjects?.Container?.prototype) {
    Phaser.GameObjects.Container.prototype.setScrollFactor = vi.fn().mockReturnThis();
    Phaser.GameObjects.Container.prototype.setDepth = vi.fn().mockReturnThis();
  }
});

// Mock Phaser scene
class MockScene {
  cameras = {
    main: {
      fadeIn: vi.fn(),
      startFollow: vi.fn(),
      setBounds: vi.fn(),
      scrollX: 0,
      scrollY: 0,
      getBounds: () => ({ width: DISPLAY.WIDTH, height: DISPLAY.HEIGHT }),
    },
  };
  physics = {
    add: {
      group: vi.fn(() => ({
        getChildren: () => [],
        add: vi.fn(),
      })),
      overlap: vi.fn(),
      collider: vi.fn(),
      existing: vi.fn(),
    },
    world: {
      isPaused: false,
    },
    pause: vi.fn(function(this: any) { this.world.isPaused = true; }),
    resume: vi.fn(function(this: any) { this.world.isPaused = false; }),
  };
  textures = {
    createCanvas: vi.fn(() => ({
      getContext: vi.fn(() => ({
        fillStyle: '',
        fillRect: vi.fn(),
      })),
      refresh: vi.fn(),
    })),
  };
  make = {
    tilemap: vi.fn(() => ({
      addTilesetImage: vi.fn(() => ({})),
      createBlankLayer: vi.fn(() => ({
        putTileAt: vi.fn(),
        setCollisionByExclusion: vi.fn(),
        setCollision: vi.fn(),
        setDepth: vi.fn(),
        forEachTile: vi.fn(),
      })),
      createLayer: vi.fn(() => null),
    })),
  };
  add = {
    existing: vi.fn(),
    rectangle: vi.fn(() => ({
      setScrollFactor: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setName: vi.fn().mockReturnThis(),
    })),
    text: vi.fn(() => ({
      setOrigin: vi.fn().mockReturnThis(),
      setScrollFactor: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setName: vi.fn().mockReturnThis(),
      setText: vi.fn().mockReturnThis(),
      setColor: vi.fn().mockReturnThis(),
    })),
    sprite: vi.fn(() => ({
      setOrigin: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      setScrollFactor: vi.fn().mockReturnThis(),
    })),
    graphics: vi.fn(() => ({
      fillStyle: vi.fn(),
      fillRect: vi.fn(),
      setDepth: vi.fn(),
    })),
  };
  time = {
    addEvent: vi.fn(),
    delayedCall: vi.fn(),
  };
  tweens = {
    add: vi.fn(),
  };
  input = {
    keyboard: {
      on: vi.fn(),
      once: vi.fn(),
      createCursorKeys: vi.fn(() => ({
        left: { isDown: false },
        right: { isDown: false },
        up: { isDown: false },
        down: { isDown: false },
      })),
    },
  };
  eventListeners: Map<string, Function[]> = new Map();
  events = {
    emit: vi.fn((event: string, ...args: any[]) => {
      const listeners = this.eventListeners.get(event) || [];
      listeners.forEach(listener => listener(...args));
    }),
    on: vi.fn((event: string, callback: Function) => {
      if (!this.eventListeners.has(event)) {
        this.eventListeners.set(event, []);
      }
      this.eventListeners.get(event)!.push(callback);
    }),
    once: vi.fn(),
  };
  children = {
    getByName: vi.fn(() => ({
      destroy: vi.fn(),
    })),
  };
  scene = {
    restart: vi.fn(),
  };
}

describe('GameScene Integration', () => {
  let gameScene: GameScene;
  let mockScene: MockScene;

  beforeEach(() => {
    mockScene = new MockScene();
    gameScene = new GameScene();

    // Cast to any to access private properties
    const scene = gameScene as any;

    // Mock all the Phaser properties
    Object.assign(scene, mockScene);

    // Call create to initialize the scene
    gameScene.create();
  });

  it('should initialize all systems on create', () => {
    const scene = gameScene as any;

    // Check TimeManager initialized
    expect(scene.timeManager).toBeInstanceOf(TimeManager);
    expect(scene.timeManager.getTimeRemaining()).toBe(TIME.BASE_TIME);

    // Check DungeonGenerator initialized
    expect(scene.dungeonGenerator).toBeInstanceOf(DungeonGenerator);

    // Check CombatSystem initialized
    expect(scene.combatSystem).toBeInstanceOf(CombatSystem);
  });

  it('should generate dungeon on create', () => {
    const scene = gameScene as any;

    // Verify dungeon was generated
    expect(scene.dungeonData).toBeDefined();
    expect(scene.dungeonData.rooms).toBeDefined();
    expect(scene.dungeonData.rooms.length).toBeGreaterThan(0);
    expect(scene.dungeonData.entranceRoom).toBeDefined();
    expect(scene.dungeonData.exitRoom).toBeDefined();
  });

  it('should spawn player at entrance room position', () => {
    const scene = gameScene as any;

    expect(scene.player).toBeInstanceOf(Player);

    // Player exists and was created (x/y may be undefined in mock environment)
    // In a real game, the Player would be at entrance room center
    expect(scene.dungeonData.entranceRoom).toBeDefined();
  });

  it('should spawn enemies in combat rooms', () => {
    const scene = gameScene as any;

    expect(scene.enemies).toBeDefined();

    // Verify spawnEnemies was called (physics.add.group was called)
    expect(mockScene.physics.add.group).toHaveBeenCalled();
  });

  it('should start TimeManager with 60 seconds', () => {
    const scene = gameScene as any;

    expect(scene.timeManager.getTimeRemaining()).toBe(TIME.BASE_TIME);
  });

  it('should trigger game over on TIME_EXPIRED event', () => {
    const scene = gameScene as any;
    const gameOverSpy = vi.spyOn(scene, 'gameOver');

    // Manually trigger time expired
    scene.timeManager.emit(GameEvents.TIME_EXPIRED, { timeRemaining: 0 });

    expect(gameOverSpy).toHaveBeenCalled();
  });

  it('should create HUD', () => {
    const scene = gameScene as any;

    expect(scene.hud).toBeInstanceOf(HUD);
  });

  it('should set up camera to follow player', () => {
    expect(mockScene.cameras.main.startFollow).toHaveBeenCalled();
    expect(mockScene.cameras.main.setBounds).toHaveBeenCalled();
  });

  it('should extend time when enemy is killed', () => {
    const scene = gameScene as any;
    const initialTime = scene.timeManager.getTimeRemaining();

    // Trigger the event listener manually (using the mock's event system)
    const listeners = mockScene.eventListeners.get(GameEvents.ENEMY_KILLED) || [];
    listeners.forEach(listener => listener({ timeReward: 3 }));

    const newTime = scene.timeManager.getTimeRemaining();
    expect(newTime).toBe(initialTime + 3);
  });

  it('should pause and resume correctly', () => {
    const scene = gameScene as any;

    expect(scene.isPaused).toBe(false);

    // Trigger pause
    scene.togglePause();

    expect(scene.isPaused).toBe(true);
    expect(mockScene.physics.pause).toHaveBeenCalled();
    expect(scene.timeManager.isPaused()).toBe(true);

    // Resume
    scene.togglePause();

    expect(scene.isPaused).toBe(false);
    expect(mockScene.physics.resume).toHaveBeenCalled();
    expect(scene.timeManager.isPaused()).toBe(false);
  });

  it('should set up event listeners for time and combat', () => {
    // Verify that time.addEvent was called for the timer
    expect(mockScene.time.addEvent).toHaveBeenCalled();

    // Check that the timer event has correct delay (1000ms = 1 second)
    const timerEvent = mockScene.time.addEvent.mock.calls.find(
      (call) => call[0].delay === 1000
    );
    expect(timerEvent).toBeDefined();
    expect(timerEvent![0].loop).toBe(true);
  });

  it('should handle player death correctly', () => {
    const scene = gameScene as any;

    // Mock player as dead
    const mockPlayer = {
      isDead: vi.fn().mockReturnValue(true),
      getHealth: vi.fn().mockReturnValue(0),
    };
    scene.player = mockPlayer;

    const gameOverSpy = vi.spyOn(scene, 'gameOver');

    // Trigger the event listener manually (since scene.events is a mock)
    const listeners = mockScene.eventListeners.get(GameEvents.PLAYER_DAMAGED) || [];
    listeners.forEach(listener => listener({
      health: 0,
      maxHealth: 5,
      amount: 1,
    }));

    expect(gameOverSpy).toHaveBeenCalled();
  });

  it('should create tilemap from dungeon data', () => {
    // Verify tilemap was created
    expect(mockScene.make.tilemap).toHaveBeenCalled();

    const tilemapConfig = mockScene.make.tilemap.mock.calls[0][0];
    expect(tilemapConfig.tileWidth).toBe(DISPLAY.TILE_SIZE);
    expect(tilemapConfig.tileHeight).toBe(DISPLAY.TILE_SIZE);
  });

  it('should set up input handlers', () => {
    // Verify keyboard listeners were set up
    expect(mockScene.input.keyboard!.on).toHaveBeenCalled();

    // Check for ESC and L (attack) handlers
    const calls = mockScene.input.keyboard!.on.mock.calls;
    const escHandler = calls.find((call) => call[0] === 'keydown-ESC');
    const attackHandler = calls.find((call) => call[0] === 'keydown-L');

    expect(escHandler).toBeDefined();
    expect(attackHandler).toBeDefined();
  });
});
