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

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  // Dungeon data
  private dungeonData!: DungeonData;

  // Tilemap
  private tilemap!: Phaser.Tilemaps.Tilemap;
  private wallLayer!: Phaser.Tilemaps.TilemapLayer;

  // State
  private isPaused: boolean = false;
  private currentRoomId: number = -1;
  private clearedRooms: Set<number> = new Set();

  // DEBUG
  private debugLogCounter: number = 0;
  private debugEnabled: boolean = true;

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

    // DEBUG: Log dungeon stats
    this.debugLogDungeonStats();

    this.createTilemap();

    // 3. Spawn player at entrance (centered within tile)
    const entrance = this.dungeonData.entranceRoom;
    const spawnPos = this.findValidSpawnPosition(entrance);

    // DEBUG: Log spawn information
    console.log('=== SPAWN DEBUG ===');
    console.log('Entrance room:', entrance);
    console.log('Spawn position (tile):', spawnPos);
    console.log('Spawn position (pixel):', {
      x: spawnPos.x * DISPLAY.TILE_SIZE + DISPLAY.TILE_SIZE / 2,
      y: spawnPos.y * DISPLAY.TILE_SIZE + DISPLAY.TILE_SIZE / 2
    });
    console.log('Tile at spawn:', this.dungeonData.tiles[spawnPos.y]?.[spawnPos.x]);
    console.log('3x3 area around spawn:');
    for (let dy = -1; dy <= 1; dy++) {
      let row = '';
      for (let dx = -1; dx <= 1; dx++) {
        const tile = this.dungeonData.tiles[spawnPos.y + dy]?.[spawnPos.x + dx];
        row += tile === 1 ? '.' : '#';
      }
      console.log(row);
    }

    this.player = new Player(
      this,
      spawnPos.x * DISPLAY.TILE_SIZE + DISPLAY.TILE_SIZE / 2,
      spawnPos.y * DISPLAY.TILE_SIZE + DISPLAY.TILE_SIZE / 2
    );

    // DEBUG: Draw spawn position marker
    this.add.circle(
      spawnPos.x * DISPLAY.TILE_SIZE + DISPLAY.TILE_SIZE / 2,
      spawnPos.y * DISPLAY.TILE_SIZE + DISPLAY.TILE_SIZE / 2,
      4,
      0x00ff00
    ).setDepth(100);

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

    // Set physics world bounds to match dungeon size
    this.physics.world.setBounds(
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

    // 11. DEBUG: Log player body info after creation
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    console.log('=== PLAYER BODY DEBUG ===');
    console.log('Body size:', body?.width, 'x', body?.height);
    console.log('Body offset:', body?.offset.x, body?.offset.y);
    console.log('World bounds:', this.physics.world.bounds.width, 'x', this.physics.world.bounds.height);
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

    // DEBUG: Update debug overlay
    this.updateDebugOverlay();
  }

  /**
   * DEBUG: Log player position and collision info periodically
   */
  private updateDebugOverlay(): void {
    this.debugLogCounter++;

    // Log every 60 frames (about once per second)
    if (this.debugLogCounter % 60 === 0) {
      const playerTileX = Math.floor(this.player.x / DISPLAY.TILE_SIZE);
      const playerTileY = Math.floor(this.player.y / DISPLAY.TILE_SIZE);
      const currentTile = this.dungeonData.tiles[playerTileY]?.[playerTileX];
      const body = this.player.body as Phaser.Physics.Arcade.Body;

      console.log(`[Frame ${this.debugLogCounter}] Player pos: (${this.player.x.toFixed(1)}, ${this.player.y.toFixed(1)}) | Tile: (${playerTileX}, ${playerTileY}) = ${currentTile === 1 ? 'FLOOR' : 'WALL'} | Blocked: L=${body?.blocked.left} R=${body?.blocked.right} U=${body?.blocked.up} D=${body?.blocked.down}`);
    }

    // Log immediately if player is blocked
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (body && (body.blocked.left || body.blocked.right || body.blocked.up || body.blocked.down)) {
      const playerTileX = Math.floor(this.player.x / DISPLAY.TILE_SIZE);
      const playerTileY = Math.floor(this.player.y / DISPLAY.TILE_SIZE);
      console.log(`BLOCKED! Pos: (${this.player.x.toFixed(1)}, ${this.player.y.toFixed(1)}) | Tile: (${playerTileX}, ${playerTileY}) | L=${body.blocked.left} R=${body.blocked.right} U=${body.blocked.up} D=${body.blocked.down}`);
    }
  }

  /**
   * Check if a 3x3 area around a position is all walkable floor tiles.
   * This ensures the player's hitbox won't overlap with walls.
   */
  private isWalkableArea(centerX: number, centerY: number): boolean {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        if (this.dungeonData.tiles[y]?.[x] !== 1) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Find a valid floor tile position within a room for spawning.
   * Validates that a 3x3 area around the spawn position is walkable
   * to prevent the player's hitbox from overlapping with walls.
   */
  private findValidSpawnPosition(room: { x: number; y: number; width: number; height: number; centerX: number; centerY: number }): { x: number; y: number } {
    // Try center first with 3x3 validation
    if (this.isWalkableArea(room.centerX, room.centerY)) {
      return { x: room.centerX, y: room.centerY };
    }

    // Search room for positions with walkable 3x3 area
    // Skip edges since we need 3x3 area
    let bestTile: { x: number; y: number; dist: number } | null = null;

    for (let y = room.y + 1; y < room.y + room.height - 1; y++) {
      for (let x = room.x + 1; x < room.x + room.width - 1; x++) {
        if (this.isWalkableArea(x, y)) {
          const dist = Math.abs(x - room.centerX) + Math.abs(y - room.centerY);
          if (!bestTile || dist < bestTile.dist) {
            bestTile = { x, y, dist };
          }
        }
      }
    }

    if (bestTile) {
      return { x: bestTile.x, y: bestTile.y };
    }

    // Fallback: find any single floor tile (less ideal but still valid)
    console.warn('No 3x3 walkable area found in room, using single tile');
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (this.dungeonData.tiles[y]?.[x] === 1) {
          return { x, y };
        }
      }
    }

    // Last resort: search entire dungeon
    console.warn('No floor in room, searching entire dungeon');
    for (let y = 0; y < this.dungeonData.height; y++) {
      for (let x = 0; x < this.dungeonData.width; x++) {
        if (this.dungeonData.tiles[y][x] === 1) {
          return { x, y };
        }
      }
    }

    // This should never happen with a valid dungeon
    console.error('CRITICAL: No floor tiles in entire dungeon!');
    return { x: room.centerX, y: room.centerY };
  }

  /**
   * Create tilemap from dungeon data using sprite-based rendering
   * Uses individual sprites for reliable tile rendering
   */
  private createTilemap(): void {
    const { width, height, tiles } = this.dungeonData;
    const tileSize = DISPLAY.TILE_SIZE;

    // Create a simple tilemap for collision purposes only
    this.tilemap = this.make.tilemap({
      tileWidth: tileSize,
      tileHeight: tileSize,
      width: width,
      height: height,
    });

    // Add wall tileset for collision layer
    const wallTileset = this.tilemap.addTilesetImage(
      'tileset-walls',
      'tileset-walls',
      tileSize,
      tileSize,
      0,
      0
    );

    // Create collision layer for walls
    this.wallLayer = this.tilemap.createBlankLayer('walls', wallTileset!, 0, 0)!;
    this.wallLayer.setDepth(1); // Walls render above floor

    // Floor tile frames from grounds.png
    // grounds.png is 13 columns wide (208px / 16px)
    // Row 15 (frames 195+) contains simple solid beige floor tiles
    const FLOOR_FRAMES = [195, 196, 197, 198];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelX = x * tileSize;
        const pixelY = y * tileSize;

        if (tiles[y][x] === 1) {
          // FLOOR tile - walkable area
          const floorFrame = FLOOR_FRAMES[Phaser.Math.Between(0, FLOOR_FRAMES.length - 1)];
          const floorSprite = this.add.sprite(pixelX, pixelY, 'tileset-grounds', floorFrame);
          floorSprite.setOrigin(0, 0);
          floorSprite.setDepth(-2);
        } else {
          // WALL tile - render as solid black rectangle
          const wallRect = this.add.rectangle(pixelX, pixelY, tileSize, tileSize, 0x000000);
          wallRect.setOrigin(0, 0);
          wallRect.setDepth(-1);

          // Add to collision layer for physics (use tile ID 1, not 0)
          this.wallLayer.putTileAt(1, x, y);
        }
      }
    }

    // Set collision ONLY on wall tiles (ID 1), not empty/default tiles (ID 0)
    this.wallLayer.setCollision([1]);

    // DEBUG: Log collision layer info
    console.log('=== COLLISION LAYER DEBUG ===');
    console.log('Wall layer dimensions:', this.wallLayer.width, 'x', this.wallLayer.height);
    console.log('Tilemap dimensions:', this.tilemap.width, 'x', this.tilemap.height);

    // Count collision tiles
    let collisionTileCount = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = this.wallLayer.getTileAt(x, y);
        if (tile && tile.collides) {
          collisionTileCount++;
        }
      }
    }
    console.log('Tiles with collision enabled:', collisionTileCount);
    console.log('Expected wall tiles:', this.dungeonData.tiles.flat().filter(t => t === 0).length);
  }

  /**
   * DEBUG: Log dungeon statistics
   */
  private debugLogDungeonStats(): void {
    const { width, height, tiles, rooms, entranceRoom } = this.dungeonData;
    const floorCount = tiles.flat().filter(t => t === 1).length;
    const wallCount = tiles.flat().filter(t => t === 0).length;

    console.log('=== DUNGEON DEBUG ===');
    console.log(`Dimensions: ${width}x${height} (${width * height} total tiles)`);
    console.log(`Floor tiles: ${floorCount} (${((floorCount / (width * height)) * 100).toFixed(1)}%)`);
    console.log(`Wall tiles: ${wallCount} (${((wallCount / (width * height)) * 100).toFixed(1)}%)`);
    console.log(`Rooms: ${rooms.length}`);
    console.log('Entrance room:', entranceRoom);
    console.log('Entrance room center tile value:', tiles[entranceRoom.centerY]?.[entranceRoom.centerX]);

    // Check if room bounds contain walls
    let entranceWallsInBounds = 0;
    let entranceFloorsInBounds = 0;
    for (let y = entranceRoom.y; y < entranceRoom.y + entranceRoom.height; y++) {
      for (let x = entranceRoom.x; x < entranceRoom.x + entranceRoom.width; x++) {
        if (tiles[y]?.[x] === 0) entranceWallsInBounds++;
        else if (tiles[y]?.[x] === 1) entranceFloorsInBounds++;
      }
    }
    console.log(`Entrance room bounds: ${entranceFloorsInBounds} floors, ${entranceWallsInBounds} walls`);
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
    // Initialize cursor keys (arrow keys)
    this.cursors = this.input.keyboard!.createCursorKeys();

    // Initialize WASD keys
    this.wasdKeys = this.input.keyboard!.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
    }) as {
      W: Phaser.Input.Keyboard.Key;
      A: Phaser.Input.Keyboard.Key;
      S: Phaser.Input.Keyboard.Key;
      D: Phaser.Input.Keyboard.Key;
    };

    // ESC to pause
    this.input.keyboard?.on('keydown-ESC', () => {
      this.togglePause();
    });

    // L to attack
    this.input.keyboard?.on('keydown-L', () => {
      if (!this.isPaused && this.combatSystem.canAttack()) {
        const direction = this.player.getFacingDirection();

        // Determine weapon frame based on facing direction
        // weapons_animated.png has sword swings organized by direction
        // Each direction has frames for animation (using first 2 frames per direction)
        let frameStart = 0;

        // Map direction to weapon sprite row
        // Down: row 0 (frames 0-3)
        // Up: row 1 (frames 4-7)
        // Left: row 2 (frames 8-11)
        // Right: row 3 (frames 12-15)
        if (direction.y > 0) {
          // Facing down
          frameStart = 0;
        } else if (direction.y < 0) {
          // Facing up
          frameStart = 4;
        } else if (direction.x < 0) {
          // Facing left
          frameStart = 8;
        } else {
          // Facing right (default)
          frameStart = 12;
        }

        // Create attack visual with directional frame
        const attackSprite = this.add.sprite(
          this.player.x + direction.x * DISPLAY.TILE_SIZE,
          this.player.y + direction.y * DISPLAY.TILE_SIZE,
          'weapons',
          frameStart
        );
        attackSprite.setDepth(10);

        // Simple 2-frame swing animation
        this.tweens.addCounter({
          from: 0,
          to: 1,
          duration: 75,
          onUpdate: (tween) => {
            const value = tween.getValue() ?? 0;
            const frame = frameStart + Math.floor(value);
            attackSprite.setFrame(frame);
          }
        });

        // Remove after animation completes
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
    let inputX = 0;
    let inputY = 0;

    // Check arrow keys
    if (this.cursors.left.isDown) inputX -= 1;
    if (this.cursors.right.isDown) inputX += 1;
    if (this.cursors.up.isDown) inputY -= 1;
    if (this.cursors.down.isDown) inputY += 1;

    // Check WASD keys
    if (this.wasdKeys.A.isDown) inputX -= 1;
    if (this.wasdKeys.D.isDown) inputX += 1;
    if (this.wasdKeys.W.isDown) inputY -= 1;
    if (this.wasdKeys.S.isDown) inputY += 1;

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

      // Debug toggle button
      const debugButton = this.add
        .text(
          DISPLAY.WIDTH / 2,
          DISPLAY.HEIGHT / 2 + 30,
          `Debug: ${this.debugEnabled ? 'ON' : 'OFF'}`,
          {
            fontSize: '12px',
            color: this.debugEnabled ? '#00ff00' : '#ff0000',
            backgroundColor: '#333333',
            padding: { x: 8, y: 4 },
          }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1000)
        .setName('debugButton')
        .setInteractive({ useHandCursor: true });

      debugButton.on('pointerdown', () => {
        this.toggleDebug();
        debugButton.setText(`Debug: ${this.debugEnabled ? 'ON' : 'OFF'}`);
        debugButton.setColor(this.debugEnabled ? '#00ff00' : '#ff0000');
      });
    } else {
      this.physics.resume();
      this.timeManager.resume();

      // Remove pause overlay
      this.children.getByName('pauseOverlay')?.destroy();
      this.children.getByName('pauseText')?.destroy();
      this.children.getByName('debugButton')?.destroy();
    }
  }

  /**
   * Toggle debug visualization
   */
  private toggleDebug(): void {
    this.debugEnabled = !this.debugEnabled;
    this.physics.world.drawDebug = this.debugEnabled;

    if (!this.debugEnabled) {
      this.physics.world.debugGraphic?.clear();
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
