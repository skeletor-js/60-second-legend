import Phaser from 'phaser';
import { DISPLAY, TIME_EXTENSIONS, CORRUPTION, SHADOW, GameEvents, SHARD_SOURCES, SPAWN } from '@config/Constants';
import { TILESET, PaletteFrameMapping } from '@config/TilesetMapping';
import { TimeManager } from '@systems/TimeManager';
import { DungeonGenerator, DungeonData, RoomType } from '@systems/DungeonGenerator';
import { CombatSystem } from '@systems/CombatSystem';
import { ProgressionSystem } from '@systems/ProgressionSystem';
import { ShadowSystem } from '@systems/ShadowSystem';
import { FloorThemeSystem, getNeighbors, resolveWallType, getWallFrame } from '@systems/index';
import { Player } from '@entities/Player';
import { Enemy } from '@entities/Enemy';
import { Slime } from '@entities/enemies/Slime';
import { Bat } from '@entities/enemies/Bat';
import { Rat } from '@entities/enemies/Rat';
import { ShadowPursuer } from '@entities/ShadowPursuer';
import { Projectile } from '@entities/Projectile';
import { HUD } from '@ui/HUD';
import type { RunConfig } from '@scenes/HubScene';

/**
 * GameScene
 * Main gameplay scene - dungeon exploration and combat
 */
export class GameScene extends Phaser.Scene {
  // Systems
  private timeManager!: TimeManager;
  private dungeonGenerator!: DungeonGenerator;
  private combatSystem!: CombatSystem;
  private progressionSystem!: ProgressionSystem;
  private shadowSystem!: ShadowSystem;
  private floorThemeSystem!: FloorThemeSystem;

  // Entities
  private player!: Player;
  private enemies!: Phaser.Physics.Arcade.Group;
  private shadowPursuer: ShadowPursuer | null = null;

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

  // Weapon state (0=Swift Daggers, 1=Memory Blade, 2=Shatter Hammer)
  private currentWeapon: number = 1; // Default to Memory Blade
  private projectiles!: Phaser.Physics.Arcade.Group;

  // TODO: Apply RunConfig upgrades to player/systems in future phase
  // private runConfig?: RunConfig;

  // Run statistics
  private runStats = {
    shardsEarned: 0,
    enemiesKilled: 0,
    timeExtended: 0,
    perfectDodges: 0,
    floorReached: 1,
  };

  // DEBUG
  private debugLogCounter: number = 0;
  private debugEnabled: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(_data?: RunConfig): void {
    // TODO: Apply runConfig upgrades in future phase
    // this.runConfig = data;

    // Get progression system from registry
    if (this.game.registry.has('progressionSystem')) {
      this.progressionSystem = this.game.registry.get('progressionSystem') as ProgressionSystem;
    } else {
      // Create if it doesn't exist (for direct launches)
      this.progressionSystem = new ProgressionSystem();
      this.game.registry.set('progressionSystem', this.progressionSystem);
    }

    // Reset run stats
    this.runStats = {
      shardsEarned: 0,
      enemiesKilled: 0,
      timeExtended: 0,
      perfectDodges: 0,
      floorReached: 1,
    };
  }

  create(): void {
    this.cameras.main.fadeIn(500);

    // 1. Initialize systems
    this.timeManager = new TimeManager();
    this.dungeonGenerator = new DungeonGenerator();
    this.combatSystem = new CombatSystem(this);
    this.shadowSystem = new ShadowSystem(this);
    this.floorThemeSystem = new FloorThemeSystem(this, this.runStats.floorReached);

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

    // Get frame mapping for player sprite
    const frameMapping = this.floorThemeSystem.getFrameMapping();

    this.player = new Player(
      this,
      spawnPos.x * DISPLAY.TILE_SIZE + DISPLAY.TILE_SIZE / 2,
      spawnPos.y * DISPLAY.TILE_SIZE + DISPLAY.TILE_SIZE / 2,
      TILESET.KEY,
      frameMapping.characters.player[0]
    );

    // Initialize player sprite with current floor palette
    this.player.updateSprite(frameMapping);

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

    // 4b. Create projectile group
    // Note: Don't set classType since we're manually creating Projectile instances
    this.projectiles = this.physics.add.group({
      runChildUpdate: false,
    });

    // 5. Create HUD
    this.hud = new HUD(this, this.timeManager, undefined, undefined, this.shadowSystem);

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

    // 10. Start enemy respawn timer
    this.time.addEvent({
      delay: SPAWN.RESPAWN_INTERVAL,
      callback: () => this.respawnEnemies(),
      loop: true,
    });

    // 11. Set up input handlers
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

    // Update enemies (chase AI with deltaTime for Bat AI state)
    this.enemies.getChildren().forEach((enemy: Phaser.GameObjects.GameObject) => {
      if (enemy instanceof Bat) {
        // Bat needs deltaTime for charge/retreat timing
        if (enemy.active && !enemy.isDead()) {
          const shouldFire = enemy.update(this.player.x, this.player.y, delta / 1000);

          // Fire projectile when bat starts retreating
          if (shouldFire) {
            this.fireBatProjectile(enemy);
          }
        }
      } else if (enemy instanceof Enemy) {
        // Other enemies use standard update
        if (enemy.active && !enemy.isDead()) {
          enemy.update(this.player.x, this.player.y);
        }
      }
    });

    // Update combat cooldowns
    this.combatSystem.update(delta / 1000);

    // Update projectiles and clean up expired ones
    this.projectiles.getChildren().forEach((proj: Phaser.GameObjects.GameObject) => {
      const projectile = proj as Projectile;
      if (projectile.active && projectile.updateProjectile(delta)) {
        projectile.destroy();
      }
    });

    // Update Shadow Pursuer if spawned
    if (this.shadowPursuer && this.shadowPursuer.active) {
      this.shadowPursuer.update(this.player.x, this.player.y);
    }

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
   * Uses the 1-bit roguelike tileset with palette-based coloring per floor
   */
  private createTilemap(): void {
    const { width, height, tiles } = this.dungeonData;
    const tileSize = DISPLAY.TILE_SIZE;

    // Get frame mapping for current floor palette
    const isBonusFloor = this.floorThemeSystem.isBonusFloor();
    const frameMapping = this.floorThemeSystem.getFrameMapping();

    // Create a simple tilemap for collision purposes only
    this.tilemap = this.make.tilemap({
      tileWidth: tileSize,
      tileHeight: tileSize,
      width: width,
      height: height,
    });

    // Add tileset for collision layer (using 1-bit tileset)
    const tileset = this.tilemap.addTilesetImage(
      TILESET.KEY,
      TILESET.KEY,
      tileSize,
      tileSize,
      0,
      0
    );

    // Create collision layer for walls
    this.wallLayer = this.tilemap.createBlankLayer('walls', tileset!, 0, 0)!;
    this.wallLayer.setDepth(1); // Walls render above floor

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelX = x * tileSize;
        const pixelY = y * tileSize;

        // Get frame mapping (random for bonus floor)
        const currentFrames: PaletteFrameMapping = isBonusFloor
          ? this.floorThemeSystem.getRandomFrameMapping()
          : frameMapping;

        if (tiles[y][x] === 1) {
          // FLOOR tile - walkable area
          const floorFrames = currentFrames.tiles.floors;
          const floorFrame = floorFrames[Phaser.Math.Between(0, floorFrames.length - 1)];
          const floorSprite = this.add.sprite(pixelX, pixelY, TILESET.KEY, floorFrame);
          floorSprite.setOrigin(0, 0);
          floorSprite.setDepth(-2);
        } else {
          // WALL tile - use edge detection to select appropriate wall sprite
          const neighbors = getNeighbors(x, y, tiles, width, height);
          const wallType = resolveWallType(neighbors);
          const wallFrame = getWallFrame(wallType, currentFrames.tiles);

          const wallSprite = this.add.sprite(pixelX, pixelY, TILESET.KEY, wallFrame);
          wallSprite.setOrigin(0, 0);
          wallSprite.setDepth(-1);

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
    console.log('Current floor palette:', this.floorThemeSystem.getTilesetPalette());

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
   * Spawns variety of enemies with weighted randomization:
   * - 50% Slime (basic slow enemy)
   * - 30% Bat (fast flying enemy)
   * - 20% Rat pack (3-5 rats with pack behavior)
   */
  private spawnEnemies(): void {
    // Get frame mapping for current floor palette
    const frameMapping = this.floorThemeSystem.getFrameMapping();

    this.dungeonData.rooms
      .filter((room) => room.type === RoomType.COMBAT)
      .forEach((room) => {
        const count = Phaser.Math.Between(SPAWN.MIN_PER_ROOM, SPAWN.MAX_PER_ROOM);
        for (let i = 0; i < count; i++) {
          const x = Phaser.Math.Between(room.x + 1, room.x + room.width - 2);
          const y = Phaser.Math.Between(room.y + 1, room.y + room.height - 2);

          // Weighted random selection: 50% Slime, 30% Bat, 20% Rat pack
          const rand = Math.random() * 100;

          if (rand < 50) {
            // 50% - Spawn Slime
            const slime = new Slime(
              this,
              x * DISPLAY.TILE_SIZE,
              y * DISPLAY.TILE_SIZE,
              frameMapping.characters.slime[0]
            );
            slime.updateSprite(frameMapping);
            this.enemies.add(slime as unknown as Phaser.GameObjects.GameObject);
          } else if (rand < 80) {
            // 30% - Spawn Bat
            const bat = new Bat(
              this,
              x * DISPLAY.TILE_SIZE,
              y * DISPLAY.TILE_SIZE,
              frameMapping.characters.bat[0]
            );
            bat.updateSprite(frameMapping);
            this.enemies.add(bat as unknown as Phaser.GameObjects.GameObject);
          } else {
            // 20% - Spawn Rat pack (3-5 rats)
            const packSize = Phaser.Math.Between(3, 5);
            const rats: Rat[] = [];

            // Spawn rats in a cluster
            for (let j = 0; j < packSize; j++) {
              // Offset from spawn point by small amount
              const offsetX = Phaser.Math.Between(-1, 1);
              const offsetY = Phaser.Math.Between(-1, 1);
              const ratX = Math.max(
                room.x + 1,
                Math.min(room.x + room.width - 2, x + offsetX)
              );
              const ratY = Math.max(
                room.y + 1,
                Math.min(room.y + room.height - 2, y + offsetY)
              );

              const rat = new Rat(
                this,
                ratX * DISPLAY.TILE_SIZE,
                ratY * DISPLAY.TILE_SIZE,
                frameMapping.characters.rat[0]
              );
              rat.updateSprite(frameMapping);
              rats.push(rat);
              this.enemies.add(rat as unknown as Phaser.GameObjects.GameObject);
            }

            // Set pack members for each rat
            rats.forEach((rat) => rat.setPackMembers(rats));
          }
        }
      });
  }

  /**
   * Respawn enemies periodically in rooms near the player.
   * Spawns 1-3 enemies in a random uncleared combat room.
   * Respects MAX_ACTIVE_ENEMIES cap.
   */
  private respawnEnemies(): void {
    // Count active enemies
    const activeEnemies = this.enemies.getChildren().filter(
      (e) => (e as Enemy).active && !(e as Enemy).isDead()
    ).length;

    // Don't spawn if at or above cap
    if (activeEnemies >= SPAWN.MAX_ACTIVE_ENEMIES) {
      return;
    }

    // Find uncleared combat rooms
    const unclearedRooms = this.dungeonData.rooms.filter(
      (room) => room.type === RoomType.COMBAT && !this.clearedRooms.has(room.id)
    );

    if (unclearedRooms.length === 0) {
      return;
    }

    // Pick a random uncleared room
    const room = Phaser.Utils.Array.GetRandom(unclearedRooms);

    // Get frame mapping for current floor palette
    const frameMapping = this.floorThemeSystem.getFrameMapping();

    // Spawn 1-3 enemies (respecting cap)
    const spawnCount = Math.min(
      Phaser.Math.Between(1, 3),
      SPAWN.MAX_ACTIVE_ENEMIES - activeEnemies
    );

    for (let i = 0; i < spawnCount; i++) {
      const x = Phaser.Math.Between(room.x + 1, room.x + room.width - 2);
      const y = Phaser.Math.Between(room.y + 1, room.y + room.height - 2);

      // 60% Slime, 25% Bat, 15% Rat
      const rand = Math.random() * 100;

      if (rand < 60) {
        const slime = new Slime(this, x * DISPLAY.TILE_SIZE, y * DISPLAY.TILE_SIZE, frameMapping.characters.slime[0]);
        slime.updateSprite(frameMapping);
        this.enemies.add(slime as unknown as Phaser.GameObjects.GameObject);
      } else if (rand < 85) {
        const bat = new Bat(this, x * DISPLAY.TILE_SIZE, y * DISPLAY.TILE_SIZE, frameMapping.characters.bat[0]);
        bat.updateSprite(frameMapping);
        this.enemies.add(bat as unknown as Phaser.GameObjects.GameObject);
      } else {
        const rat = new Rat(this, x * DISPLAY.TILE_SIZE, y * DISPLAY.TILE_SIZE, frameMapping.characters.rat[0]);
        rat.updateSprite(frameMapping);
        this.enemies.add(rat as unknown as Phaser.GameObjects.GameObject);
      }
    }
  }

  /**
   * Spawn Shadow Pursuer at 100% corruption
   */
  private spawnShadowPursuer(): void {
    if (this.shadowPursuer) {
      return; // Already spawned
    }

    // Find a distant uncleared combat room to spawn the Shadow
    const unclearedRooms = this.dungeonData.rooms.filter(
      (room) => room.type === RoomType.COMBAT && !this.clearedRooms.has(room.id)
    );

    if (unclearedRooms.length === 0) {
      // Fallback: spawn in any room far from player
      const room = this.dungeonData.rooms.find((r) => r.type !== RoomType.ENTRANCE);
      if (room) {
        const spawnX = room.centerX * DISPLAY.TILE_SIZE;
        const spawnY = room.centerY * DISPLAY.TILE_SIZE;
        this.shadowPursuer = new ShadowPursuer(this, spawnX, spawnY);
      }
      return;
    }

    // Find the room furthest from player
    const playerTileX = Math.floor(this.player.x / DISPLAY.TILE_SIZE);
    const playerTileY = Math.floor(this.player.y / DISPLAY.TILE_SIZE);

    let furthestRoom = unclearedRooms[0];
    let maxDistance = 0;

    for (const room of unclearedRooms) {
      const distance = Math.sqrt(
        (room.centerX - playerTileX) ** 2 + (room.centerY - playerTileY) ** 2
      );
      if (distance > maxDistance) {
        maxDistance = distance;
        furthestRoom = room;
      }
    }

    // Spawn Shadow in the furthest room
    const spawnX = furthestRoom.centerX * DISPLAY.TILE_SIZE;
    const spawnY = furthestRoom.centerY * DISPLAY.TILE_SIZE;
    this.shadowPursuer = new ShadowPursuer(this, spawnX, spawnY);

    // Set up collision with player for instant death
    this.physics.add.overlap(this.player, this.shadowPursuer, () => {
      if (!this.player.isDead()) {
        this.player.takeDamage(SHADOW.PURSUER_DAMAGE);
        this.gameOver();
      }
    });

    console.log('Shadow Pursuer spawned at room', furthestRoom.id);
  }

  /**
   * Set up physics collisions
   */
  private setupCollisions(): void {
    // Use combat system to set up collisions
    this.combatSystem.setupCollisions(this.player, this.enemies, this.wallLayer);

    // Player projectiles hit enemies
    this.physics.add.overlap(
      this.projectiles,
      this.enemies,
      (projectileObj, enemyObj) => {
        const projectile = projectileObj as Projectile;
        const enemy = enemyObj as Enemy;

        if (projectile.isEnemyProjectile() || !enemy.active || enemy.isDead()) {
          return;
        }

        // Apply damage
        const damage = projectile.getDamage();
        const killed = enemy.takeDamage(damage);

        // Destroy projectile (unless piercing)
        projectile.onHit();
      }
    );

    // Projectiles collide with walls
    this.physics.add.collider(this.projectiles, this.wallLayer, (obj1, obj2) => {
      // Determine which object is the projectile (has isEnemyProjectile method)
      const projectile =
        typeof (obj1 as any).isEnemyProjectile === 'function'
          ? (obj1 as Projectile)
          : (obj2 as Projectile);
      projectile.destroy();
    });

    // Enemy projectiles hit player
    this.physics.add.overlap(
      this.projectiles,
      this.player,
      (obj1, obj2) => {
        // Determine which object is the projectile (has isEnemyProjectile method)
        const projectile =
          typeof (obj1 as any).isEnemyProjectile === 'function'
            ? (obj1 as Projectile)
            : (obj2 as Projectile);

        if (!projectile.isEnemyProjectile() || projectile.hasHitTarget()) {
          return;
        }

        // Apply damage to player
        const damage = projectile.getDamage();
        this.player.takeDamage(damage);

        // Destroy projectile
        projectile.onHit();
      }
    );
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // TIME_EXPIRED -> game over
    this.timeManager.on(GameEvents.TIME_EXPIRED, () => {
      this.gameOver();
    });

    // ENEMY_KILLED -> extend time and award shards
    this.events.on(GameEvents.ENEMY_KILLED, (data: { timeReward: number }) => {
      this.timeManager.extendTime(data.timeReward, 'enemy_kill');

      // Track stats
      this.runStats.enemiesKilled++;
      this.runStats.shardsEarned += SHARD_SOURCES.ENEMY_KILL;
    });

    // ROOM_CLEARED -> bonus time and award shards
    this.events.on(GameEvents.ROOM_CLEARED, () => {
      this.timeManager.extendTime(TIME_EXTENSIONS.ROOM_CLEARED, 'room_cleared');

      // Track stats
      this.runStats.shardsEarned += SHARD_SOURCES.ROOM_CLEARED;
    });

    // TIME_EXTENDED -> track total time extended
    this.timeManager.on(GameEvents.TIME_EXTENDED, (...args: unknown[]) => {
      const data = args[0] as { amount: number };
      this.runStats.timeExtended += data.amount;
    });

    // PERFECT_DODGE -> track stat
    this.events.on(GameEvents.PERFECT_DODGE, () => {
      this.runStats.perfectDodges++;
    });

    // PLAYER_DAMAGED -> update HUD
    this.events.on(GameEvents.PLAYER_DAMAGED, () => {
      this.hud.updateHealthDisplay(this.player.getHealth());

      // Check for player death
      if (this.player.isDead()) {
        this.gameOver();
      }
    });

    // CORRUPTION_CHANGED -> handle drain rate changes and shadow spawn
    this.shadowSystem.on(GameEvents.CORRUPTION_CHANGED, (...args: unknown[]) => {
      const data = args[0] as { corruption: number; threshold?: number };
      // At 50% corruption, increase time drain rate
      if (data.threshold === CORRUPTION.CREEPING_DARKNESS) {
        this.timeManager.setDrainRate(SHADOW.DRAIN_MULTIPLIER_50);
        console.log('Corruption reached 50% - time drains faster');
      }

      // Reset drain rate if corruption drops below 50%
      if (data.corruption < CORRUPTION.CREEPING_DARKNESS && this.timeManager.getDrainRate() > 1.0) {
        this.timeManager.resetDrainRate();
      }
    });

    // SHADOW_SPAWNED -> spawn Shadow Pursuer at 100% corruption
    this.shadowSystem.on(GameEvents.SHADOW_SPAWNED, () => {
      this.spawnShadowPursuer();
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

    // Weapon switching: 1 = Swift Daggers, 2 = Memory Blade, 3 = Shatter Hammer
    this.input.keyboard?.on('keydown-ONE', () => {
      this.currentWeapon = 0;
      console.log('Switched to Swift Daggers');
    });
    this.input.keyboard?.on('keydown-TWO', () => {
      this.currentWeapon = 1;
      console.log('Switched to Memory Blade');
    });
    this.input.keyboard?.on('keydown-THREE', () => {
      this.currentWeapon = 2;
      console.log('Switched to Shatter Hammer');
    });

    // M to dash/dodge
    this.input.keyboard?.on('keydown-M', () => {
      if (!this.isPaused && this.player.canDash()) {
        // Get current movement direction from input
        let dirX = 0;
        let dirY = 0;

        if (this.cursors.left.isDown || this.wasdKeys.A.isDown) dirX -= 1;
        if (this.cursors.right.isDown || this.wasdKeys.D.isDown) dirX += 1;
        if (this.cursors.up.isDown || this.wasdKeys.W.isDown) dirY -= 1;
        if (this.cursors.down.isDown || this.wasdKeys.S.isDown) dirY += 1;

        // If no direction held, use facing direction
        if (dirX === 0 && dirY === 0) {
          const facing = this.player.getFacingDirection();
          dirX = facing.x;
          dirY = facing.y;
        }

        this.player.dash(dirX, dirY);
      }
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
        attackSprite.setScale(1.5); // Make weapon more visible

        // Calculate base rotation from attack direction
        const baseRotation = Math.atan2(direction.y, direction.x);

        // Swing animation - rotate through arc
        this.tweens.add({
          targets: attackSprite,
          rotation: { from: baseRotation - 0.5, to: baseRotation + 0.5 },
          scale: { from: 1.5, to: 1.2 },
          alpha: { from: 1, to: 0.3 },
          duration: 200,
          ease: 'Power2',
          onUpdate: () => {
            // Update position to follow player during swing
            attackSprite.setPosition(
              this.player.x + direction.x * DISPLAY.TILE_SIZE,
              this.player.y + direction.y * DISPLAY.TILE_SIZE
            );
          },
          onComplete: () => {
            attackSprite.destroy();
          }
        });

        // Process melee attack
        this.combatSystem.attackNearbyEnemies(this.player, this.enemies, direction);

        // Swift Daggers (weapon 0) also fires a projectile
        if (this.currentWeapon === 0) {
          this.fireProjectile(direction, false);
        }
      }
    });
  }

  /**
   * Fire a projectile in the given direction
   * @param direction Normalized direction vector
   * @param isEnemy Whether this is an enemy projectile
   */
  private fireProjectile(direction: { x: number; y: number }, isEnemy: boolean): void {
    const projectile = new Projectile(
      this,
      this.player.x,
      this.player.y,
      'projectiles',
      0, // First frame of projectiles spritesheet
      direction,
      {
        speed: 200,
        damage: 1,
        lifetime: 2000,
        piercing: false,
        isEnemy: isEnemy,
      }
    );

    this.projectiles.add(projectile as unknown as Phaser.GameObjects.GameObject);

    // Activate velocity AFTER adding to group (Phaser groups can reset body properties)
    projectile.activate();
  }

  /**
   * Fire a projectile from a bat toward the player
   */
  private fireBatProjectile(bat: Bat): void {
    const direction = bat.getDirectionToTarget(this.player.x, this.player.y);

    const projectile = new Projectile(
      this,
      bat.x,
      bat.y,
      'projectiles',
      1, // Different frame for enemy projectiles
      direction,
      {
        speed: 150, // Faster than bat movement speed (60) but slower than player projectiles (200)
        damage: 1,
        lifetime: 3000,
        piercing: false,
        isEnemy: true,
      }
    );

    // Tint enemy projectile red
    projectile.setTint(0xff0000);

    this.projectiles.add(projectile as unknown as Phaser.GameObjects.GameObject);

    // Activate velocity AFTER adding to group (Phaser groups can reset body properties)
    projectile.activate();
  }

  /**
   * Update player movement based on input
   */
  private updatePlayerMovement(): void {
    // Don't process regular movement input while dashing
    if (this.player.isDashing()) {
      return;
    }

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

    // Save run statistics and award shards (if progression system exists)
    if (this.progressionSystem) {
      this.progressionSystem.earnShards(this.runStats.shardsEarned);
      this.progressionSystem.recordRunStats({
        enemiesKilled: this.runStats.enemiesKilled,
        timeExtended: this.runStats.timeExtended,
        perfectDodges: this.runStats.perfectDodges,
        floorReached: this.runStats.floorReached,
      });
    }

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
      .text(DISPLAY.WIDTH / 2, DISPLAY.HEIGHT / 2 - 30, reason, {
        fontSize: '16px',
        color: '#ff0000',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1000);

    // Show stats
    this.add
      .text(DISPLAY.WIDTH / 2, DISPLAY.HEIGHT / 2 - 5, `Shards Earned: ${this.runStats.shardsEarned}`, {
        fontSize: '8px',
        color: '#00ffff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1000);

    this.add
      .text(DISPLAY.WIDTH / 2, DISPLAY.HEIGHT / 2 + 5, `Enemies Killed: ${this.runStats.enemiesKilled}`, {
        fontSize: '8px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1000);

    this.add
      .text(DISPLAY.WIDTH / 2, DISPLAY.HEIGHT / 2 + 25, 'Press SPACE to return to hub', {
        fontSize: '8px',
        color: '#888888',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1000);

    this.input.keyboard?.once('keydown-SPACE', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('HubScene');
      });
    });
  }
}
