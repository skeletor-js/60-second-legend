import Phaser from 'phaser';
import { DISPLAY, TIME_EXTENSIONS, GameEvents } from '@config/Constants';
import { TimeManager } from '@systems/TimeManager';
import { DungeonGenerator, DungeonData, RoomType } from '@systems/DungeonGenerator';
import { CombatSystem } from '@systems/CombatSystem';
import { Player } from '@entities/Player';
import { Enemy } from '@entities/Enemy';
import { Slime } from '@entities/enemies/Slime';
import { HUD } from '@ui/HUD';

/**
 * GameScene
 * Main gameplay scene - dungeon exploration and combat
 */
export class GameScene extends Phaser.Scene {
  // Systems
  private timeManager!: TimeManager;
  private dungeonGenerator!: DungeonGenerator;
  private combatSystem!: CombatSystem;

  // Entities
  private player!: Player;
  private enemies!: Phaser.Physics.Arcade.Group;

  // UI
  private hud!: HUD;

  // Dungeon data
  private dungeonData!: DungeonData;

  // Tilemap
  private tilemap!: Phaser.Tilemaps.Tilemap;
  private wallLayer!: Phaser.Tilemaps.TilemapLayer;

  // State
  private isPaused: boolean = false;
  private currentRoomId: number = -1;
  private clearedRooms: Set<number> = new Set();

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.cameras.main.fadeIn(500);

    // 1. Initialize systems
    this.timeManager = new TimeManager();
    this.dungeonGenerator = new DungeonGenerator();
    this.combatSystem = new CombatSystem(this);

    // 2. Generate dungeon
    this.dungeonData = this.dungeonGenerator.generate();
    this.createTilemap();

    // 3. Spawn player at entrance
    const entrance = this.dungeonData.entranceRoom;
    this.player = new Player(
      this,
      entrance.centerX * DISPLAY.TILE_SIZE,
      entrance.centerY * DISPLAY.TILE_SIZE
    );

    // 4. Create enemy group and spawn in combat rooms
    this.enemies = this.physics.add.group();
    this.spawnEnemies();

    // 5. Create HUD
    this.hud = new HUD(this, this.timeManager);

    // 6. Set up camera to follow player
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(
      0,
      0,
      this.dungeonData.width * DISPLAY.TILE_SIZE,
      this.dungeonData.height * DISPLAY.TILE_SIZE
    );

    // 7. Set up physics collisions
    this.setupCollisions();

    // 8. Set up event listeners
    this.setupEventListeners();

    // 9. Start game loop timer (1 tick per second)
    this.time.addEvent({
      delay: 1000,
      callback: () => this.timeManager.tick(1),
      loop: true,
    });

    // 10. Set up input handlers
    this.setupInputHandlers();
  }

  update(time: number, delta: number): void {
    if (this.isPaused) return;

    // Update player movement
    this.updatePlayerMovement();
    this.player.update(time, delta);

    // Update enemies (chase AI)
    this.enemies.getChildren().forEach((enemy: Phaser.GameObjects.GameObject) => {
      if (enemy instanceof Enemy) {
        if (enemy.active && !enemy.isDead()) {
          enemy.update(this.player.x, this.player.y);
        }
      }
    });

    // Update combat cooldowns
    this.combatSystem.update(delta / 1000);

    // Check room clear status
    this.checkRoomCleared();

    // Update HUD health display
    this.hud.updateHealthDisplay(this.player.getHealth());
  }

  /**
   * Create tilemap from dungeon data using actual tileset sprites
   */
  private createTilemap(): void {
    const { width, height, tiles } = this.dungeonData;
    const tileSize = DISPLAY.TILE_SIZE;

    // Create tilemap data array for Phaser
    // 0 = empty, 1 = floor, 2 = wall
    const mapData: number[][] = [];
    for (let y = 0; y < height; y++) {
      mapData[y] = [];
      for (let x = 0; x < width; x++) {
        mapData[y][x] = tiles[y][x] === 0 ? 2 : 1;
      }
    }

    // Create the tilemap from the data
    this.tilemap = this.make.tilemap({
      data: mapData,
      tileWidth: tileSize,
      tileHeight: tileSize,
    });

    // Add the tilesets (loaded as spritesheets in BootScene)
    const groundTileset = this.tilemap.addTilesetImage(
      'tileset-grounds',
      'tileset-grounds',
      tileSize,
      tileSize,
      0,
      0
    );
    const wallTileset = this.tilemap.addTilesetImage(
      'tileset-walls',
      'tileset-walls',
      tileSize,
      tileSize,
      0,
      0
    );

    // Create floor layer first (below everything)
    const floorLayer = this.tilemap.createBlankLayer('floor', groundTileset!, 0, 0);
    if (floorLayer) {
      floorLayer.setDepth(-2);
      // Fill floor tiles
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (tiles[y][x] === 1) {
            // Floor tile - use a random floor tile for variety
            const floorFrame = Phaser.Math.Between(0, 3);
            floorLayer.putTileAt(floorFrame, x, y);
          }
        }
      }
    }

    // Create wall layer
    this.wallLayer = this.tilemap.createBlankLayer('walls', wallTileset!, 0, 0)!;
    this.wallLayer.setDepth(-1);

    // Place wall tiles
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (tiles[y][x] === 0) {
          // Wall tile - use frame 0 from walls tileset
          this.wallLayer.putTileAt(0, x, y);
        }
      }
    }

    // CRITICAL: Set collision on wall tiles (tile index 0 in the wall layer)
    this.wallLayer.setCollision(0);
  }

  /**
   * Spawn enemies in combat rooms
   */
  private spawnEnemies(): void {
    this.dungeonData.rooms
      .filter((room) => room.type === RoomType.COMBAT)
      .forEach((room) => {
        const count = Phaser.Math.Between(2, 4);
        for (let i = 0; i < count; i++) {
          const x = Phaser.Math.Between(room.x + 1, room.x + room.width - 2);
          const y = Phaser.Math.Between(room.y + 1, room.y + room.height - 2);
          const slime = new Slime(
            this,
            x * DISPLAY.TILE_SIZE,
            y * DISPLAY.TILE_SIZE
          );
          this.enemies.add(slime as unknown as Phaser.GameObjects.GameObject);
        }
      });
  }

  /**
   * Set up physics collisions
   */
  private setupCollisions(): void {
    // Use combat system to set up collisions
    this.combatSystem.setupCollisions(this.player, this.enemies, this.wallLayer);
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // TIME_EXPIRED -> game over
    this.timeManager.on(GameEvents.TIME_EXPIRED, () => {
      this.gameOver();
    });

    // ENEMY_KILLED -> extend time
    this.events.on(GameEvents.ENEMY_KILLED, (data: { timeReward: number }) => {
      this.timeManager.extendTime(data.timeReward, 'enemy_kill');
    });

    // ROOM_CLEARED -> bonus time
    this.events.on(GameEvents.ROOM_CLEARED, () => {
      this.timeManager.extendTime(TIME_EXTENSIONS.ROOM_CLEARED, 'room_cleared');
    });

    // PLAYER_DAMAGED -> update HUD
    this.events.on(GameEvents.PLAYER_DAMAGED, () => {
      this.hud.updateHealthDisplay(this.player.getHealth());

      // Check for player death
      if (this.player.isDead()) {
        this.gameOver();
      }
    });
  }

  /**
   * Set up input handlers
   */
  private setupInputHandlers(): void {
    // ESC to pause
    this.input.keyboard?.on('keydown-ESC', () => {
      this.togglePause();
    });

    // L to attack
    this.input.keyboard?.on('keydown-L', () => {
      if (!this.isPaused && this.combatSystem.canAttack()) {
        const direction = this.player.getFacingDirection();

        // Create attack visual
        const attackSprite = this.add.sprite(
          this.player.x + direction.x * DISPLAY.TILE_SIZE,
          this.player.y + direction.y * DISPLAY.TILE_SIZE,
          'weapons',
          0
        );
        attackSprite.setDepth(10);
        attackSprite.setRotation(Math.atan2(direction.y, direction.x));

        // Remove after short duration
        this.time.delayedCall(150, () => {
          attackSprite.destroy();
        });

        // Process attack
        this.combatSystem.attackNearbyEnemies(this.player, this.enemies, direction);
      }
    });
  }

  /**
   * Update player movement based on input
   */
  private updatePlayerMovement(): void {
    const cursors = this.input.keyboard?.createCursorKeys();
    if (!cursors) return;

    let inputX = 0;
    let inputY = 0;

    if (cursors.left.isDown) inputX -= 1;
    if (cursors.right.isDown) inputX += 1;
    if (cursors.up.isDown) inputY -= 1;
    if (cursors.down.isDown) inputY += 1;

    this.player.handleMovement(inputX, inputY);
  }

  /**
   * Check if current room is cleared
   */
  private checkRoomCleared(): void {
    // Find which room the player is in
    const playerTileX = Math.floor(this.player.x / DISPLAY.TILE_SIZE);
    const playerTileY = Math.floor(this.player.y / DISPLAY.TILE_SIZE);

    const currentRoom = this.dungeonData.rooms.find(
      (room) =>
        playerTileX >= room.x &&
        playerTileX < room.x + room.width &&
        playerTileY >= room.y &&
        playerTileY < room.y + room.height
    );

    if (!currentRoom || currentRoom.type !== RoomType.COMBAT) {
      return;
    }

    // Check if we entered a new room
    if (this.currentRoomId !== currentRoom.id) {
      this.currentRoomId = currentRoom.id;
    }

    // Skip if already cleared
    if (this.clearedRooms.has(currentRoom.id)) {
      return;
    }

    // Check if all enemies in this room are dead
    const enemiesInRoom = this.enemies
      .getChildren()
      .filter((enemy) => {
        if (!(enemy instanceof Enemy)) return false;
        if (!enemy.active || enemy.isDead()) return false;

        const enemyTileX = Math.floor(enemy.x / DISPLAY.TILE_SIZE);
        const enemyTileY = Math.floor(enemy.y / DISPLAY.TILE_SIZE);

        return (
          enemyTileX >= currentRoom.x &&
          enemyTileX < currentRoom.x + currentRoom.width &&
          enemyTileY >= currentRoom.y &&
          enemyTileY < currentRoom.y + currentRoom.height
        );
      });

    if (enemiesInRoom.length === 0) {
      this.clearedRooms.add(currentRoom.id);
      this.events.emit(GameEvents.ROOM_CLEARED, { roomId: currentRoom.id });
    }
  }

  /**
   * Toggle pause state
   */
  private togglePause(): void {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.physics.pause();
      this.timeManager.pause();

      // Show pause overlay
      this.add
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
      this.timeManager.resume();

      // Remove pause overlay
      this.children.getByName('pauseOverlay')?.destroy();
      this.children.getByName('pauseText')?.destroy();
    }
  }

  /**
   * Handle game over
   */
  private gameOver(): void {
    this.physics.pause();
    this.timeManager.pause();

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

    const reason = this.player.isDead() ? 'PLAYER DEFEATED' : 'TIME EXPIRED';

    this.add
      .text(DISPLAY.WIDTH / 2, DISPLAY.HEIGHT / 2 - 10, reason, {
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
