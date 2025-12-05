import { Map as RotMap } from 'rot-js';

export enum RoomType {
  ENTRANCE = 'entrance',
  COMBAT = 'combat',
  TREASURE = 'treasure',
  EXIT = 'exit',
}

export interface Room {
  id: number;
  x: number;        // top-left x
  y: number;        // top-left y
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  type: RoomType;
  connections: number[];  // connected room IDs
}

export interface DungeonConfig {
  width: number;
  height: number;
  roomCount?: { min: number; max: number };
  floorNumber?: number;
}

export interface DungeonData {
  width: number;
  height: number;
  tiles: number[][];     // 0 = wall, 1 = floor
  rooms: Room[];
  entranceRoom: Room;
  exitRoom: Room;
  floorNumber: number;
}

/**
 * DungeonGenerator uses rot.js to procedurally generate dungeons.
 * Implements a dungeon with entrance, exit, and combat rooms connected by corridors.
 */
export class DungeonGenerator {
  /**
   * Generates a dungeon based on the provided configuration.
   * Will retry generation if validation fails.
   * @param config - Optional configuration for dungeon dimensions, room count, and floor number
   * @returns DungeonData containing tiles and room information
   */
  public generate(config?: DungeonConfig): DungeonData {
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = this.generateAttempt(config);

      if (this.validateDungeon(result)) {
        return result;
      }

      console.warn(`Dungeon generation attempt ${attempt + 1} failed validation, retrying...`);
    }

    // If all attempts fail, return the last attempt anyway
    console.error('All dungeon generation attempts failed validation');
    return this.generateAttempt(config);
  }

  /**
   * Single attempt at generating a dungeon
   */
  private generateAttempt(config?: DungeonConfig): DungeonData {
    const width = config?.width ?? 60;
    const height = config?.height ?? 40;
    const roomCount = config?.roomCount ?? { min: 10, max: 12 };
    const floorNumber = config?.floorNumber ?? 1;

    // Create rot.js digger
    const digger = new RotMap.Digger(width, height, {
      roomWidth: [3, 9],
      roomHeight: [3, 9],
      corridorLength: [2, 6],
      dugPercentage: 0.4, // Increase from default 0.2 to ensure more floor tiles
    });

    // Initialize tiles array with walls (0)
    const tiles: number[][] = [];
    for (let y = 0; y < height; y++) {
      tiles[y] = [];
      for (let x = 0; x < width; x++) {
        tiles[y][x] = 0; // wall
      }
    }

    // Generate dungeon and mark floors (1)
    digger.create((x, y, value) => {
      // In rot.js: 0 = floor, 1 = wall
      // We invert this: 0 = wall, 1 = floor
      tiles[y][x] = value === 0 ? 1 : 0;
    });

    // Extract rooms from rot.js
    const rotRooms = digger.getRooms();
    const rooms = this.convertRotRooms(rotRooms, roomCount);

    // Update room centers to be actual floor tiles (not just geometric centers)
    this.updateRoomFloorCenters(rooms, tiles);

    // Build connection graph
    this.buildConnectionGraph(digger, rooms);

    // Assign room types
    const entranceRoom = this.assignRoomTypes(rooms);
    const exitRoom = rooms.find(room => room.type === RoomType.EXIT)!;

    return {
      width,
      height,
      tiles,
      rooms,
      entranceRoom,
      exitRoom,
      floorNumber,
    };
  }

  /**
   * Validates that a generated dungeon is playable
   */
  private validateDungeon(dungeon: DungeonData): boolean {
    // Count floor tiles
    let floorCount = 0;
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        if (dungeon.tiles[y][x] === 1) {
          floorCount++;
        }
      }
    }

    // Must have at least 12.5% floor coverage for playability
    const minFloorTiles = Math.floor(dungeon.width * dungeon.height * 0.125);
    if (floorCount < minFloorTiles) {
      console.warn(`Validation failed: only ${floorCount} floor tiles (minimum ${minFloorTiles} required for ${dungeon.width}x${dungeon.height} dungeon)`);
      return false;
    }

    // Entrance room must have at least one floor tile at or near center
    const entrance = dungeon.entranceRoom;
    let entranceHasFloor = false;

    // Check entrance room area for floor tiles
    for (let y = entrance.y; y < entrance.y + entrance.height && !entranceHasFloor; y++) {
      for (let x = entrance.x; x < entrance.x + entrance.width && !entranceHasFloor; x++) {
        if (dungeon.tiles[y]?.[x] === 1) {
          entranceHasFloor = true;
        }
      }
    }

    if (!entranceHasFloor) {
      console.warn('Validation failed: entrance room has no floor tiles');
      return false;
    }

    // Must have at least 2 rooms
    if (dungeon.rooms.length < 2) {
      console.warn(`Validation failed: only ${dungeon.rooms.length} rooms`);
      return false;
    }

    return true;
  }

  /**
   * Updates room centers to be actual floor tiles instead of geometric centers.
   * This ensures spawning at room.centerX/centerY is always valid.
   */
  private updateRoomFloorCenters(rooms: Room[], tiles: number[][]): void {
    rooms.forEach(room => {
      const floorCenter = this.findFloorCenter(room, tiles);
      if (floorCenter) {
        room.centerX = floorCenter.x;
        room.centerY = floorCenter.y;
      }
    });
  }

  /**
   * Finds the closest floor tile to the geometric center of a room.
   * Returns null if no floor tiles exist in the room.
   */
  private findFloorCenter(room: Room, tiles: number[][]): { x: number; y: number } | null {
    const geometricCenterX = room.x + Math.floor(room.width / 2);
    const geometricCenterY = room.y + Math.floor(room.height / 2);

    // First try geometric center
    if (tiles[geometricCenterY]?.[geometricCenterX] === 1) {
      return { x: geometricCenterX, y: geometricCenterY };
    }

    // Search entire room for any floor tile, prefer tiles closest to geometric center
    let bestTile: { x: number; y: number; dist: number } | null = null;

    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (tiles[y]?.[x] === 1) {
          const dist = Math.abs(x - geometricCenterX) + Math.abs(y - geometricCenterY);
          if (!bestTile || dist < bestTile.dist) {
            bestTile = { x, y, dist };
          }
        }
      }
    }

    return bestTile ? { x: bestTile.x, y: bestTile.y } : null;
  }

  /**
   * Converts rot.js room objects to our Room interface.
   */
  private convertRotRooms(rotRooms: any[], roomCount: { min: number; max: number }): Room[] {
    const rooms: Room[] = [];

    // Limit to desired room count range
    const targetCount = Math.floor(
      Math.random() * (roomCount.max - roomCount.min + 1) + roomCount.min
    );
    const roomsToUse = rotRooms.slice(0, Math.min(targetCount, rotRooms.length));

    roomsToUse.forEach((rotRoom, index) => {
      const [x, y, width, height] = this.getRotRoomBounds(rotRoom);

      rooms.push({
        id: index,
        x,
        y,
        width,
        height,
        centerX: x + Math.floor(width / 2),
        centerY: y + Math.floor(height / 2),
        type: RoomType.COMBAT, // Default, will be reassigned
        connections: [],
      });
    });

    return rooms;
  }

  /**
   * Extracts room bounds from a rot.js room object.
   */
  private getRotRoomBounds(rotRoom: any): [number, number, number, number] {
    // rot.js rooms have methods to get their bounds
    const left = rotRoom.getLeft();
    const top = rotRoom.getTop();
    const right = rotRoom.getRight();
    const bottom = rotRoom.getBottom();

    return [
      left,
      top,
      right - left + 1,
      bottom - top + 1,
    ];
  }

  /**
   * Builds the connection graph between rooms based on corridors.
   */
  private buildConnectionGraph(_digger: unknown, rooms: Room[]): void {
    // For simplicity, connect rooms that are close to each other
    // A more sophisticated approach would trace corridors
    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        const room1 = rooms[i];
        const room2 = rooms[j];

        // Calculate Manhattan distance
        const distance = Math.abs(room1.centerX - room2.centerX) +
                        Math.abs(room1.centerY - room2.centerY);

        // If rooms are relatively close, consider them connected
        // This is a heuristic; rot.js digger connects all rooms via corridors
        if (distance < 30) {
          if (!room1.connections.includes(room2.id)) {
            room1.connections.push(room2.id);
          }
          if (!room2.connections.includes(room1.id)) {
            room2.connections.push(room1.id);
          }
        }
      }
    }

    // Ensure all rooms have at least one connection (rot.js guarantees connectivity)
    // Add nearest neighbor if isolated
    rooms.forEach(room => {
      if (room.connections.length === 0) {
        let nearestId = -1;
        let minDistance = Infinity;

        rooms.forEach(otherRoom => {
          if (otherRoom.id !== room.id) {
            const distance = Math.abs(room.centerX - otherRoom.centerX) +
                           Math.abs(room.centerY - otherRoom.centerY);
            if (distance < minDistance) {
              minDistance = distance;
              nearestId = otherRoom.id;
            }
          }
        });

        if (nearestId !== -1) {
          room.connections.push(nearestId);
          rooms[nearestId].connections.push(room.id);
        }
      }
    });
  }

  /**
   * Assigns room types: ENTRANCE, EXIT, and COMBAT.
   * Returns the entrance room.
   */
  private assignRoomTypes(rooms: Room[]): Room {
    if (rooms.length === 0) {
      throw new Error('No rooms generated');
    }

    // First room is entrance
    const entranceRoom = rooms[0];
    entranceRoom.type = RoomType.ENTRANCE;

    // Find the farthest room from entrance for the exit
    let maxDistance = -1;
    let exitRoomIndex = rooms.length - 1; // Fallback to last room

    for (let i = 1; i < rooms.length; i++) {
      const room = rooms[i];
      const distance = Math.abs(room.centerX - entranceRoom.centerX) +
                      Math.abs(room.centerY - entranceRoom.centerY);

      if (distance > maxDistance) {
        maxDistance = distance;
        exitRoomIndex = i;
      }
    }

    rooms[exitRoomIndex].type = RoomType.EXIT;

    // All other rooms remain as COMBAT (already set as default)
    return entranceRoom;
  }
}
