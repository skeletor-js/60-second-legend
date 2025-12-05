# Phase 6: Meta Progression

> Long-term progression that respects player time

## Overview

Phase 6 introduces the meta progression system, allowing players to earn Memory Shards during runs and spend them on permanent upgrades between runs. The MVP includes 4 basic upgrades and a functional hub scene.

---

## What Was Implemented

### 1. Progression System

**File Created:**
- `src/systems/ProgressionSystem.ts`

**Features:**
- Memory shard tracking (earned, spent, available)
- Upgrade purchase system
- Run statistics tracking
- Event emission for UI updates

### 2. Save Manager

**File Created:**
- `src/utils/SaveManager.ts`

**Features:**
- LocalStorage persistence
- Save data versioning (v1.0.0)
- Automatic migration support
- Save/load/reset methods

### 3. Hub Scene

**File Created:**
- `src/scenes/HubScene.ts`

**Features:**
- Memory Nexus hub between runs
- Dungeon Gate to start runs
- Upgrade Shrine with purchase UI
- Shard counter display
- Interactive upgrade panel

### 4. Upgrade System

**Four MVP Upgrades:**

| Upgrade | Tree | Cost | Effect |
|---------|------|------|--------|
| **Expanded Hourglass** | Time | 50 shards | Max time: 120s → 150s |
| **Sharpened Blade** | Combat | 75 shards | All weapons: +1 damage |
| **Thick Skin** | Survival | 60 shards | Max HP: 5 → 6 |
| **Relic Attunement** | Relic | 100 shards | Start with 1 random relic |

---

## Shard Economy

### Earning Shards (During Runs)

| Source | Amount |
|--------|--------|
| Enemy kill | +1 shard |
| Room cleared | +5 shards |
| Boss defeated | +25 shards |
| Floor completed | +10 shards |

### Spending Shards (In Hub)

- Upgrades cost 50-100 shards
- Purchased upgrades are permanent
- Upgrades apply to all future runs

---

## Save Data Structure

```typescript
interface SaveData {
  version: string;
  memoryShardsTotal: number;
  memoryShardsSpent: number;
  unlockedUpgrades: string[];
  highestFloorReached: number;
  totalRuns: number;
  statistics: {
    enemiesKilled: number;
    timeExtended: number;
    perfectDodges: number;
  };
}
```

---

## Scene Flow

```
MenuScene → HubScene → GameScene → [Death] → HubScene
                ↑__________________________|
```

1. **MenuScene**: Press SPACE to enter hub
2. **HubScene**: View upgrades, start run
3. **GameScene**: Play, earn shards
4. **Game Over**: Return to hub with earned shards

---

## Files Modified

- `src/config/Constants.ts` - Added UPGRADES, SHARD_SOURCES, GameEvents
- `src/config/GameConfig.ts` - Added HubScene to scene array
- `src/scenes/MenuScene.ts` - Changed to navigate to HubScene
- `src/scenes/GameScene.ts` - Added shard tracking, run stats

---

## Test Coverage

- `src/systems/__tests__/ProgressionSystem.test.ts` - 31 tests
- `src/utils/__tests__/SaveManager.test.ts` - 10 tests

**Total: 41 new tests**

---

## What to Test & Confirm

### Hub Scene

- [ ] **Hub displays after menu**
  - Press SPACE at menu
  - Memory Nexus hub appears

- [ ] **Shard counter visible**
  - Shows current shard balance
  - Updates when shards earned

- [ ] **Dungeon Gate works**
  - Click "Enter Dungeon" button
  - Game starts

- [ ] **Upgrade Shrine shows upgrades**
  - Four upgrades listed
  - Each shows name, description, cost
  - Affordable upgrades highlighted

### Earning Shards

- [ ] **Killing enemies**
  - Each kill adds +1 shard (tracked, not displayed during run)

- [ ] **Clearing rooms**
  - Room clear adds +5 shards

- [ ] **End of run**
  - Death shows shards earned
  - Shards added to total
  - Return to hub

### Purchasing Upgrades

- [ ] **Can buy affordable upgrades**
  - Click upgrade with enough shards
  - Shards deducted
  - Upgrade marked as owned

- [ ] **Cannot buy unaffordable**
  - Upgrades without enough shards are dimmed
  - Click does nothing

- [ ] **Owned upgrades persist**
  - Refresh page
  - Previously bought upgrades still owned

### Upgrade Effects

- [ ] **Expanded Hourglass**
  - Max time increases from 120s to 150s
  - Timer can go higher

- [ ] **Sharpened Blade**
  - All weapon damage +1
  - Memory Blade does 4 instead of 3

- [ ] **Thick Skin**
  - Max HP increases from 5 to 6
  - Extra heart in HUD

- [ ] **Relic Attunement**
  - Start run with 1 random common relic
  - Relic appears in slots immediately

### Save/Load

- [ ] **Progress saves automatically**
  - After each run
  - When purchasing upgrades

- [ ] **Progress loads on start**
  - Refresh page
  - Shards and upgrades preserved

- [ ] **Reset available (dev)**
  - Can clear save data
  - Starts fresh

### Known Limitations

1. Upgrade effects need GameScene integration to apply
2. Boss/floor completion shards not triggered (no boss/floor system yet)
3. Hub visuals are placeholder
4. Only 4 of 20 planned upgrades

---

## Integration Notes

GameScene tracks run stats:

```typescript
// Track during gameplay
this.runStats = {
  shardsEarned: 0,
  enemiesKilled: 0,
  timeExtended: 0,
  perfectDodges: 0,
  floorReached: 1,
};

// On enemy kill
this.runStats.shardsEarned += SHARD_SOURCES.ENEMY_KILL;
this.runStats.enemiesKilled++;

// On room clear
this.runStats.shardsEarned += SHARD_SOURCES.ROOM_CLEARED;

// On game over
if (this.progressionSystem) {
  this.progressionSystem.earnShards(this.runStats.shardsEarned);
  this.progressionSystem.recordRunStats({...});
}
```

Hub applies upgrades:

```typescript
// Get unlocked upgrades
const upgrades = this.progressionSystem.getUnlockedUpgrades();

// Create run config
const runConfig = {
  maxTime: upgrades.includes('expanded_hourglass') ? 150 : 120,
  baseDamage: upgrades.includes('sharpened_blade') ? 1 : 0,
  maxHealth: upgrades.includes('thick_skin') ? 6 : 5,
  startingRelic: upgrades.includes('relic_attunement'),
};

// Pass to GameScene
this.scene.start('GameScene', runConfig);
```

---

## Constants Reference

```typescript
UPGRADES: {
  EXPANDED_HOURGLASS: {
    id: 'expanded_hourglass',
    name: 'Expanded Hourglass',
    description: 'Maximum time increased from 120s to 150s',
    cost: 50,
    tree: 'time',
    effect: { type: 'maxTime', value: 150 },
  },
  // ... other upgrades
}

SHARD_SOURCES: {
  ENEMY_KILL: 1,
  ROOM_CLEARED: 5,
  BOSS_DEFEATED: 25,
  FLOOR_COMPLETED: 10,
}
```

---

## Next Steps (Future Iteration)

1. Implement remaining 16 upgrades (4 more per tree)
2. Add upgrade prerequisites (unlock order)
3. Create proper hub scene visuals
4. Add weapon unlock system
5. Implement achievement system
6. Add statistics display (Memory Wall)
7. Apply upgrade effects in GameScene
8. Add visual upgrade tree UI
