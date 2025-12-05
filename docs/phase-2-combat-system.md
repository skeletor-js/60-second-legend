# Phase 2: Combat System

> Weapons, enemy variety, and advanced combat mechanics

## Overview

Phase 2 transforms the basic combat from Phase 1 into a deep, satisfying system with weapon variety, enemy types, and skill-rewarding mechanics like kill streaks and perfect dodges.

---

## What Was Implemented

### 1. Weapon System

**Files Created:**
- `src/systems/WeaponSystem.ts` - Core weapon management
- `src/entities/weapons/SwiftDaggers.ts`
- `src/entities/weapons/MemoryBlade.ts`
- `src/entities/weapons/ShatterHammer.ts`
- `src/entities/weapons/index.ts`

**Three Distinct Weapons:**

| Weapon | Damage | Speed | Range | Time/Kill | Special |
|--------|--------|-------|-------|-----------|---------|
| **Swift Daggers** | 1 | 0.2s | 16px | +2s | +0.3s per hit, combo: triple strike |
| **Memory Blade** | 3 | 0.6s | 24px | +4s | Balanced, combo: heal 1 HP |
| **Shatter Hammer** | 5 | 1.2s | 20px | +6s | AOE (24px radius), combo: ground pound |

**Weapon Switching:**
- Press `1` for Swift Daggers
- Press `2` for Memory Blade
- Press `3` for Shatter Hammer

### 2. Enemy Variety

**Files Created:**
- `src/entities/enemies/Bat.ts`
- `src/entities/enemies/Rat.ts`

**Three Enemy Types:**

| Enemy | HP | Speed | Behavior | Time Reward |
|-------|-----|-------|----------|-------------|
| **Slime** | 2 | 30 px/s | Simple chase | +3s |
| **Bat** | 1 | 60 px/s | Charge/retreat cycles | +2s |
| **Rat** | 1 | 40 px/s | Pack behavior, swarm | +1s (spawns in groups) |

**Spawn Distribution:**
- 50% Slimes
- 30% Bats
- 20% Rat packs (3-5 rats per pack)

### 3. Combat Mechanics

**File Created:**
- `src/systems/CombatMechanics.ts`

**Kill Streak System:**
| Streak | Bonus Time | Announcement |
|--------|------------|--------------|
| 3 kills | +2s | "Triple!" |
| 5 kills | +5s | "Rampage!" |
| 8 kills | +10s | "Unstoppable!" |
| 12 kills | +20s | "LEGENDARY!" |

- Resets when player takes damage

**Combo System:**
- Tracks consecutive hits within 4-second window
- Multipliers at 5/10/15/20 hits (1.2x to 2.5x)
- Visual counter on HUD

**Perfect Dodge:**
- 150ms window to avoid incoming damage
- Rewards: +1s time, 2x damage on next attack, 0.3s i-frames
- Visual flash effect

**Execute Mechanic:**
- Enemies below 20% HP can be instantly killed
- Grants +2s bonus time on top of normal kill reward

---

## Files Modified

- `src/config/Constants.ts` - Added WEAPONS, ENEMIES, COMBO constants
- `src/systems/CombatSystem.ts` - Integrated weapon system
- `src/ui/HUD.ts` - Added combo counter, streak announcements
- `src/scenes/GameScene.ts` - Weapon switching, enemy spawning

---

## Test Coverage

- `src/systems/__tests__/WeaponSystem.test.ts` - 23 tests
- `src/systems/__tests__/CombatMechanics.test.ts` - 38 tests
- `src/entities/__tests__/Bat.test.ts` - 22 tests
- `src/entities/__tests__/Rat.test.ts` - 21 tests

**Total: 104 new tests**

---

## What to Test & Confirm

### Weapon Testing

- [ ] **Swift Daggers (press 1)**
  - Fast attack speed (0.2s between attacks)
  - Low damage (1 per hit)
  - Short range
  - Get +0.3s per hit landed

- [ ] **Memory Blade (press 2)**
  - Medium attack speed (0.6s)
  - Medium damage (3 per hit)
  - Medium range
  - Default starting weapon

- [ ] **Shatter Hammer (press 3)**
  - Slow attack speed (1.2s)
  - High damage (5 per hit)
  - Hits multiple enemies in AOE
  - Good for crowd control

### Enemy Testing

- [ ] **Slimes**
  - Slow, predictable movement
  - 2 hits to kill with Memory Blade

- [ ] **Bats**
  - Fast movement
  - Charge at you, then retreat
  - 1 hit to kill

- [ ] **Rats**
  - Spawn in packs of 3-5
  - Move together as a group
  - 1 hit each but dangerous in numbers

### Kill Streak Testing

- [ ] Kill 3 enemies without taking damage → "Triple!" appears, +2s bonus
- [ ] Kill 5 enemies without taking damage → "Rampage!" appears, +5s bonus
- [ ] Take damage → streak resets to 0
- [ ] Kill 8 enemies → "Unstoppable!" +10s
- [ ] Kill 12 enemies → "LEGENDARY!" +20s

### Combo Testing

- [ ] Hit enemies rapidly → combo counter appears
- [ ] Stop hitting for 4 seconds → combo expires
- [ ] Reach 5 hits → "5-Hit Combo!" announcement
- [ ] Reach 10/15/20 hits → higher announcements

### Known Limitations

1. Weapon switching is instant (no animation)
2. Weapon sprites use placeholders
3. Combos don't yet affect damage multiplier in gameplay
4. Perfect dodge requires more GameScene integration to fully test

---

## Integration Notes

The weapon system is integrated into CombatSystem but some features need explicit GameScene hookup:

```typescript
// Weapon switching is handled via keyboard input
// Keys 1, 2, 3 switch weapons

// Attack uses current weapon stats
this.combatSystem.attackNearbyEnemies(...)
```

---

## Next Steps (Future Iteration)

1. Add weapon swing animations
2. Implement weapon-specific visual effects
3. Add remaining weapons (Echo Staff, Temporal Gauntlets)
4. Polish perfect dodge timing and feedback
5. Add weapon unlock progression
