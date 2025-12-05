# Weapon System Integration Guide

## Summary

The weapon system has been successfully implemented for Phase 2 of 60 Second Legend. All 23 weapon system tests pass, bringing the total test count from 170 to 260+ tests.

## Files Created

### Core System
- `/src/systems/WeaponSystem.ts` - Main weapon system with `WeaponLogic` (pure logic) and `WeaponSystem` (Phaser wrapper)
- `/src/systems/__tests__/WeaponSystem.test.ts` - 23 comprehensive tests for weapon logic and combos

### Weapon Entities
- `/src/entities/weapons/SwiftDaggers.ts` - Fast, low-damage weapon with hit combo
- `/src/entities/weapons/MemoryBlade.ts` - Balanced weapon with kill-based healing combo
- `/src/entities/weapons/ShatterHammer.ts` - Slow AOE weapon with multi-kill combo
- `/src/entities/weapons/index.ts` - Barrel export

### Configuration
- Updated `/src/config/Constants.ts`:
  - Added `WEAPONS` constant with 3 weapon definitions
  - Added weapon-related interfaces: `WeaponStats`, `ComboRequirement`, `ComboEffect`, `WeaponCombo`, `WeaponDefinition`
  - Added `GameEvents.WEAPON_SWITCHED`, `WEAPON_COMBO_READY`, `WEAPON_COMBO_ACTIVATED`

### Integration
- Updated `/src/systems/CombatSystem.ts`:
  - Added `setWeaponSystem()` method
  - Modified `attackNearbyEnemies()` to use weapon system when available
  - Added weapon-specific time rewards
  - Added combo tracking (hits, kills, multi-kills)
  - Falls back to legacy system if no weapon system attached

## Weapon Definitions

### Swift Daggers
```typescript
Stats:
- Damage: 1
- Attack Speed: 0.2s (5 attacks/sec)
- Range: 16px
- Time per Kill: +2s
- Time per Hit: +0.3s

Combo: Triple Strike
- Requirement: 5 hits without taking damage
- Effect: Next attack deals 3x damage
```

### Memory Blade (Default)
```typescript
Stats:
- Damage: 3
- Attack Speed: 0.6s
- Range: 24px
- Time per Kill: +4s
- Time per Hit: 0s

Combo: Life Steal
- Requirement: 3 kills without taking damage
- Effect: Heal 1 HP
```

### Shatter Hammer
```typescript
Stats:
- Damage: 5
- Attack Speed: 1.2s
- Range: 20px
- AOE Radius: 24px
- Time per Kill: +6s
- Time per Hit: 0s

Combo: Ground Pound
- Requirement: 2 multi-kills (2+ enemies per swing)
- Effect: Stun nearby enemies for 1.5s in 32px radius
```

## Integration Points for GameScene

To integrate the weapon system into GameScene, add the following:

### 1. Import WeaponSystem
```typescript
import { WeaponSystem } from '@systems/WeaponSystem';
import { WEAPONS } from '@config/Constants';
```

### 2. Initialize in create()
```typescript
// After creating CombatSystem
const weaponSystem = new WeaponSystem(this, {
  SWIFT_DAGGERS: WEAPONS.SWIFT_DAGGERS,
  MEMORY_BLADE: WEAPONS.MEMORY_BLADE,
  SHATTER_HAMMER: WEAPONS.SHATTER_HAMMER,
});

// Connect to combat system
this.combatSystem.setWeaponSystem(weaponSystem);
```

### 3. Listen for Weapon Events
```typescript
// Weapon switched (1/2/3 keys)
this.events.on(GameEvents.WEAPON_SWITCHED, (data) => {
  console.log(`Switched to ${data.weaponName}`);
  // Update HUD, play sound, etc.
});

// Combo ready
this.events.on(GameEvents.WEAPON_COMBO_READY, (data) => {
  console.log(`${data.comboName} ready!`);
  // Show visual indicator
});

// Combo activated
this.events.on(GameEvents.WEAPON_COMBO_ACTIVATED, (data) => {
  console.log(`${data.comboName} activated!`);
  // Play special effects

  // Handle heal combo specifically
  if (data.effect.type === 'heal') {
    this.player.heal(data.effect.value); // You'll need to add heal() to Player
    weaponSystem.getCurrentWeapon().consumeCombo();
  }
});
```

### 4. Handle Player Damage
The weapon system already integrates with CombatSystem's `onPlayerDamaged()` method, so combos reset automatically when the player takes damage.

## Keyboard Controls

Weapon switching is automatically set up via `WeaponSystem`:
- **1** - Switch to Swift Daggers
- **2** - Switch to Memory Blade
- **3** - Switch to Shatter Hammer

## Architecture

The weapon system follows the established Logic/Sprite separation pattern:

- **WeaponLogic** - Pure TypeScript class, fully testable, no Phaser dependencies
  - Handles stats, cooldowns, combo tracking
  - All game logic is isolated here

- **WeaponSystem** - Phaser wrapper
  - Manages weapon collection
  - Handles input (keyboard switching)
  - Emits events
  - Integrates with game systems

## Combo System Details

### Combo Types

1. **hits_without_damage** (Swift Daggers)
   - Tracks any hit (kill or non-kill)
   - Resets when player takes damage

2. **kills_without_damage** (Memory Blade)
   - Only counts kills
   - Resets when player takes damage

3. **multi_kills** (Shatter Hammer)
   - Only counts when 2+ enemies killed in one attack
   - Uses `recordMultiKill(killCount)` method

### Combo Effects

1. **damage_multiplier** - Automatically applied to next attack damage
2. **heal** - Must be manually applied via event listener (see integration example)
3. **stun_aoe** - To be implemented (emits event with radius and duration)

## Time Rewards

Each weapon has different time rewards:

- **timePerKill** - Bonus time when killing enemy with this weapon
- **timePerHit** - Bonus time on any hit (even non-killing)

These stack with enemy base time rewards and are automatically added by CombatSystem.

## Test Coverage

All 23 weapon tests pass:
- Basic weapon functionality (stats, cooldowns)
- Swift Daggers combo (5 hits → triple damage)
- Memory Blade combo (3 kills → heal)
- Shatter Hammer combo (2 multi-kills → stun)
- Time reward calculation
- Combo reset on player damage
- AOE detection for Shatter Hammer

## Next Steps

1. **Add heal() method to Player class** for Memory Blade combo
2. **Implement stun effect** for Shatter Hammer combo
3. **Add weapon indicators to HUD** showing current weapon and combo progress
4. **Create weapon sprites** (currently using placeholder texture keys)
5. **Add visual/audio feedback** for weapon switching and combo activation
6. **Test in actual gameplay** - The system is integrated but needs live testing

## Backward Compatibility

The CombatSystem maintains full backward compatibility:
- Works without WeaponSystem (uses legacy logic)
- `setWeaponSystem()` is optional
- All existing tests still pass (260+ total)
