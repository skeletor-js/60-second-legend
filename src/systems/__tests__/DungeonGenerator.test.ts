import { describe, it, expect, beforeEach } from 'vitest';
import { DungeonGenerator, RoomType, type DungeonConfig, type DungeonData, type Room } from '../DungeonGenerator';

describe('DungeonGenerator', () => {
  let generator: DungeonGenerator;

  beforeEach(() => {
    generator = new DungeonGenerator();
  });

  describe('Basic Generation', () => {
    it('should generate dungeon of specified dimensions (60x40 default)', () => {
      const dungeon = generator.generate();

      expect(dungeon.width).toBe(60);
      expect(dungeon.height).toBe(40);
      expect(dungeon.tiles).toHaveLength(40); // height
      expect(dungeon.tiles[0]).toHaveLength(60); // width
    });

    it('should generate dungeon of custom dimensions', () => {
      const config: DungeonConfig = {
        width: 80,
        height: 50,
      };
      const dungeon = generator.generate(config);

      expect(dungeon.width).toBe(80);
      expect(dungeon.height).toBe(50);
      expect(dungeon.tiles).toHaveLength(50);
      expect(dungeon.tiles[0]).toHaveLength(80);
    });

    it('should return valid tile data (0s for walls and 1s for floors)', () => {
      const dungeon = generator.generate();

      // Check that all tiles are either 0 or 1
      for (let y = 0; y < dungeon.height; y++) {
        for (let x = 0; x < dungeon.width; x++) {
          expect([0, 1]).toContain(dungeon.tiles[y][x]);
        }
      }

      // Check that there are some walls and some floors
      const flatTiles = dungeon.tiles.flat();
      expect(flatTiles).toContain(0); // has walls
      expect(flatTiles).toContain(1); // has floors
    });
  });

  describe('Room Generation', () => {
    it('should create a reasonable number of rooms by default', () => {
      const dungeon = generator.generate();

      // rot.js Digger generates rooms based on available space
      // We expect at least 3 rooms (entrance, exit, and at least one combat room)
      // and typically around 8-12 for a 60x40 dungeon
      expect(dungeon.rooms.length).toBeGreaterThanOrEqual(3);
      expect(dungeon.rooms.length).toBeLessThanOrEqual(15);
    });

    it('should create rooms within configured range', () => {
      const config: DungeonConfig = {
        width: 60,
        height: 40,
        roomCount: { min: 5, max: 8 },
      };
      const dungeon = generator.generate(config);

      expect(dungeon.rooms.length).toBeGreaterThanOrEqual(5);
      expect(dungeon.rooms.length).toBeLessThanOrEqual(8);
    });

    it('should have valid room properties', () => {
      const dungeon = generator.generate();

      dungeon.rooms.forEach((room, index) => {
        expect(room.id).toBe(index);
        expect(room.x).toBeGreaterThanOrEqual(0);
        expect(room.y).toBeGreaterThanOrEqual(0);
        expect(room.width).toBeGreaterThan(0);
        expect(room.height).toBeGreaterThan(0);
        expect(room.centerX).toBe(room.x + Math.floor(room.width / 2));
        expect(room.centerY).toBe(room.y + Math.floor(room.height / 2));
        expect(Array.isArray(room.connections)).toBe(true);
      });
    });

    it('should have all rooms within dungeon dimensions', () => {
      const dungeon = generator.generate();

      dungeon.rooms.forEach(room => {
        expect(room.x).toBeGreaterThanOrEqual(0);
        expect(room.y).toBeGreaterThanOrEqual(0);
        expect(room.x + room.width).toBeLessThanOrEqual(dungeon.width);
        expect(room.y + room.height).toBeLessThanOrEqual(dungeon.height);
      });
    });
  });

  describe('Room Types', () => {
    it('should place exactly one ENTRANCE room', () => {
      const dungeon = generator.generate();

      const entranceRooms = dungeon.rooms.filter(room => room.type === RoomType.ENTRANCE);
      expect(entranceRooms).toHaveLength(1);
      expect(dungeon.entranceRoom).toBeDefined();
      expect(dungeon.entranceRoom.type).toBe(RoomType.ENTRANCE);
    });

    it('should place exactly one EXIT room', () => {
      const dungeon = generator.generate();

      const exitRooms = dungeon.rooms.filter(room => room.type === RoomType.EXIT);
      expect(exitRooms).toHaveLength(1);
      expect(dungeon.exitRoom).toBeDefined();
      expect(dungeon.exitRoom.type).toBe(RoomType.EXIT);
    });

    it('should assign COMBAT type to non-entrance/exit rooms', () => {
      const dungeon = generator.generate();

      const combatRooms = dungeon.rooms.filter(room => room.type === RoomType.COMBAT);
      expect(combatRooms.length).toBe(dungeon.rooms.length - 2); // all except entrance and exit
    });

    it('should have all valid room types', () => {
      const dungeon = generator.generate();

      const validTypes = Object.values(RoomType);
      dungeon.rooms.forEach(room => {
        expect(validTypes).toContain(room.type);
      });
    });
  });

  describe('Room Connectivity', () => {
    it('should have all rooms connected (reachable from entrance)', () => {
      const dungeon = generator.generate();

      // BFS to check all rooms are reachable from entrance
      const visited = new Set<number>();
      const queue: number[] = [dungeon.entranceRoom.id];
      visited.add(dungeon.entranceRoom.id);

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        const currentRoom = dungeon.rooms[currentId];

        currentRoom.connections.forEach(connectedId => {
          if (!visited.has(connectedId)) {
            visited.add(connectedId);
            queue.push(connectedId);
          }
        });
      }

      // All rooms should be visited
      expect(visited.size).toBe(dungeon.rooms.length);
    });

    it('should have entrance room in the rooms array', () => {
      const dungeon = generator.generate();

      expect(dungeon.rooms).toContain(dungeon.entranceRoom);
    });

    it('should have exit room in the rooms array', () => {
      const dungeon = generator.generate();

      expect(dungeon.rooms).toContain(dungeon.exitRoom);
    });
  });

  describe('Deterministic Generation', () => {
    it('should generate different dungeons on subsequent calls', () => {
      const dungeon1 = generator.generate();
      const dungeon2 = generator.generate();

      // Room positions should likely be different (very low probability of being identical)
      let isDifferent = false;
      if (dungeon1.rooms.length !== dungeon2.rooms.length) {
        isDifferent = true;
      } else {
        for (let i = 0; i < dungeon1.rooms.length; i++) {
          if (dungeon1.rooms[i].x !== dungeon2.rooms[i].x ||
              dungeon1.rooms[i].y !== dungeon2.rooms[i].y) {
            isDifferent = true;
            break;
          }
        }
      }

      expect(isDifferent).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum viable dungeon size', () => {
      const config: DungeonConfig = {
        width: 30,
        height: 20,
        roomCount: { min: 3, max: 5 },
      };
      const dungeon = generator.generate(config);

      expect(dungeon.width).toBe(30);
      expect(dungeon.height).toBe(20);
      // rot.js may generate fewer rooms than requested for small dungeons
      // Just verify we have at least 2 rooms (entrance + exit minimum)
      expect(dungeon.rooms.length).toBeGreaterThanOrEqual(2);
      expect(dungeon.entranceRoom).toBeDefined();
      expect(dungeon.exitRoom).toBeDefined();
    });
  });
});
