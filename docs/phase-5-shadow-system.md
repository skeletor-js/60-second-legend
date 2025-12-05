# Phase 5: The Whispering Shadow

> Escalating threat that permeates the entire experience

## Overview

Phase 5 introduces the Shadow corruption system, creating an ever-present threat that grows stronger as the player progresses. At maximum corruption, the Whispering Shadow itself begins hunting the player.

---

## What Was Implemented

### 1. Shadow System

**File Created:**
- `src/systems/ShadowSystem.ts`

**Features:**
- Corruption meter (0-100)
- Four threshold effects (25/50/75/100)
- Source tracking for corruption changes
- Visual overlay effects
- Event emission for UI updates

### 2. Shadow Pursuer

**File Created:**
- `src/entities/ShadowPursuer.ts`

**Features:**
- Spawns at 100% corruption
- Phases through walls
- Moves at 1 tile/second toward player
- Instant death on contact (999 damage)
- Cannot enter cleared rooms
- Dark visual effects with particle glow

### 3. HUD Integration

**Modified:**
- `src/ui/HUD.ts`

**Added:**
- Corruption meter (purple bar below timer)
- Threshold indicators
- Flash effect on major thresholds

---

## Corruption Thresholds

| Level | Name | Effect |
|-------|------|--------|
| 25% | Whispers Begin | Subtle audio cue (future) |
| 50% | Creeping Darkness | Time drains 10% faster, dark vignette |
| 75% | His Gaze Upon You | Increased visual intensity |
| 100% | The Shadow Hunts | Shadow Pursuer spawns |

---

## Corruption Sources

### Increases Corruption

| Source | Amount |
|--------|--------|
| Entering new floor | +5 |
| Idling for 10 seconds | +1 |
| Killing dark enemies | +2 |

### Decreases Corruption

| Source | Amount |
|--------|--------|
| Acquiring a relic | -10 |
| Defeating a boss | -15 |
| Finding a secret | -5 |

---

## Shadow Pursuer Behavior

1. **Spawns** in the furthest uncleared combat room from player
2. **Moves** at 1 tile per second (16 px/s) toward player
3. **Phases** through all walls - no collision with environment
4. **Kills** instantly on contact (999 damage)
5. **Avoids** cleared rooms - retreats when player enters safe zone
6. **Persists** until player dies or reduces corruption below 100%

---

## Files Modified

- `src/config/Constants.ts` - Added SHADOW and CORRUPTION constants
- `src/systems/TimeManager.ts` - Added setDrainRate(), getDrainRate(), resetDrainRate()
- `src/scenes/GameScene.ts` - Shadow system integration
- `src/systems/index.ts` - Exported ShadowSystem

---

## Test Coverage

- `src/systems/__tests__/ShadowSystem.test.ts` - 18 tests
- `src/entities/__tests__/ShadowPursuer.test.ts` - 14 tests

**Total: 32 new tests**

---

## What to Test & Confirm

### Corruption Meter

- [ ] **Meter displays below timer**
  - Purple progress bar
  - Percentage text visible
  - Color changes at thresholds

- [ ] **Corruption increases**
  - +5 when entering new floor
  - +1 every 10 seconds of not killing
  - Meter fills visually

- [ ] **Corruption decreases**
  - -10 when acquiring relic
  - -15 when defeating boss
  - Meter depletes visually

### Threshold Effects

- [ ] **At 25% - Whispers Begin**
  - Event fires (audio ready for future)

- [ ] **At 50% - Creeping Darkness**
  - Time drains 10% faster
  - Dark vignette overlay appears
  - Console logs confirmation

- [ ] **At 75% - His Gaze**
  - Visual intensity increases

- [ ] **At 100% - Shadow Hunts**
  - Shadow Pursuer spawns
  - Screen pulse effect
  - Console logs spawn location

### Shadow Pursuer

- [ ] **Spawns in distant room**
  - Appears in furthest uncleared room

- [ ] **Moves toward player**
  - Slow, relentless movement
  - Phases through walls

- [ ] **Instant death on contact**
  - Player dies immediately
  - Game over triggers

- [ ] **Avoids cleared rooms**
  - When player clears a room, pursuer retreats
  - Creates temporary safe zones

### TimeManager Drain Rate

- [ ] **Normal drain rate = 1.0**
- [ ] **At 50% corruption, drain = 1.1**
- [ ] **Dropping below 50% resets to 1.0**

### Known Limitations

1. Pursuer visual is basic (tinted sprite)
2. No audio for whispers yet
3. Room corruption types not implemented
4. Boss corruption variants not implemented

---

## Integration Notes

Shadow system is integrated into GameScene:

```typescript
// Initialization
this.shadowSystem = new ShadowSystem(this);

// Pass to HUD
this.hud = new HUD(this, timeManager, combatMechanics, relicSystem, shadowSystem);

// Event handlers
this.shadowSystem.on(GameEvents.CORRUPTION_CHANGED, (data) => {
  if (data.threshold === CORRUPTION.CREEPING_DARKNESS) {
    this.timeManager.setDrainRate(SHADOW.DRAIN_MULTIPLIER_50);
  }
});

this.shadowSystem.on(GameEvents.SHADOW_SPAWNED, () => {
  this.spawnShadowPursuer();
});

// Manual corruption (for testing)
this.shadowSystem.addCorruption(50, 'test');
```

---

## Constants Reference

```typescript
CORRUPTION: {
  WHISPERS_BEGIN: 25,
  CREEPING_DARKNESS: 50,
  HIS_GAZE: 75,
  SHADOW_HUNTS: 100,
}

SHADOW: {
  PURSUER_SPEED: 16,          // pixels per second
  PURSUER_DAMAGE: 999,        // instant death
  DRAIN_MULTIPLIER_50: 1.1,   // 10% faster time drain

  CORRUPTION_SOURCES: {
    FLOOR_ENTER: 5,
    IDLE_10S: 1,
    DARK_ENEMY_KILL: 2,
    RELIC_ACQUIRED: -10,
    BOSS_DEFEATED: -15,
    SECRET_FOUND: -5,
  }
}
```

---

## Next Steps (Future Iteration)

1. Add whisper audio at 25% threshold
2. Implement room corruption types:
   - Shadow tiles (drain time)
   - Dark enemies (heal on death)
   - Inverted time (pickups drain)
   - Shadow clone (mirror attacks)
3. Add boss corruption variants
4. Create unique Shadow Pursuer sprite
5. Add particle effects and trail
6. Implement relic shadow counters
