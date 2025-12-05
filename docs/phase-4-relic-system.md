# Phase 4: Relic System

> Build variety through relic choices and synergies

## Overview

Phase 4 introduces the relic system, allowing players to collect powerful items that modify gameplay through passive effects and active abilities. The MVP includes 6 relics with distinct playstyles.

---

## What Was Implemented

### 1. Relic System

**File Created:**
- `src/systems/RelicSystem.ts`

**Features:**
- Equip up to 5 relics
- Passive effect tracking and stacking
- Active ability management with cooldowns
- Relic swap when at max capacity

### 2. Relic Definitions

**File Created:**
- `src/data/relics.ts`

**Six MVP Relics:**

#### Verdant Relics (Nature Theme)

| Relic | Rarity | Passive | Active (Cooldown) |
|-------|--------|---------|-------------------|
| **Seed of Swiftness** | Common | +20% movement speed | Dash through enemies (8s) |
| **Root of Resilience** | Rare | Regen 1 HP / 30s | Cleanse debuffs + 5s time (45s) |

#### Frozen Relics (Ice Theme)

| Relic | Rarity | Passive | Active (Cooldown) |
|-------|--------|---------|-------------------|
| **Crystal of Clarity** | Common | See enemy HP bars | Reveal floor map for 10s (60s) |
| **Ice of Isolation** | Rare | Ranged attacks slow 20% | Create ice wall (15s) |

#### Generic Relics

| Relic | Rarity | Passive | Active (Cooldown) |
|-------|--------|---------|-------------------|
| **Temporal Shard** | Common | +10% time from kills | Pause timer for 2s (30s) |
| **Combat Charm** | Common | +1 damage to attacks | Next 3 attacks deal 2x (20s) |

### 3. Relic Selection UI

**File Created:**
- `src/ui/RelicSelectUI.ts`

**Features:**
- Modal overlay pauses game
- Shows 3 random relic choices
- Displays name, passive, and active descriptions
- Click to select
- Swap interface when at 5 relics

### 4. HUD Integration

**Modified:**
- `src/ui/HUD.ts`

**Added:**
- Relic slot display (top right)
- Cooldown visualization
- Relic icons with borders

---

## Files Modified

- `src/config/Constants.ts` - Added RELIC constants
- `src/entities/Player.ts` - Added modifier methods (setSpeedModifier, heal)
- `src/systems/index.ts` - Exported RelicSystem

---

## Test Coverage

- `src/systems/__tests__/RelicSystem.test.ts` - 27 tests
- `src/data/__tests__/relics.test.ts` - 21 tests
- `src/entities/__tests__/PlayerRelics.test.ts` - 13 tests

**Total: 61 new tests**

---

## What to Test & Confirm

### Relic Equipping

- [ ] **Can equip up to 5 relics**
- [ ] **6th relic triggers swap interface**
- [ ] **Relics display in HUD slots**

### Passive Effects

- [ ] **Seed of Swiftness**
  - Movement speed increases by 20%
  - Effect stacks with multiple speed relics

- [ ] **Root of Resilience**
  - Regenerate 1 HP every 30 seconds
  - Health doesn't exceed max

- [ ] **Crystal of Clarity**
  - Enemy HP bars visible above enemies

- [ ] **Temporal Shard**
  - Kill time rewards increased by 10%
  - 3s kill becomes ~3.3s

- [ ] **Combat Charm**
  - All attacks deal +1 damage

### Active Abilities

- [ ] **Dash (Seed of Swiftness)**
  - Press relic key to dash
  - 8 second cooldown shown

- [ ] **Cleanse (Root of Resilience)**
  - Removes debuffs
  - Grants +5s time
  - 45 second cooldown

- [ ] **Reveal Map (Crystal of Clarity)**
  - Shows entire floor for 10s
  - 60 second cooldown

- [ ] **Pause Timer (Temporal Shard)**
  - Freezes countdown for 2s
  - 30 second cooldown

- [ ] **Damage Boost (Combat Charm)**
  - Next 3 attacks deal 2x damage
  - Uses tracked per activation
  - 20 second cooldown

### Relic Selection UI

- [ ] **Appears after room clear or boss defeat**
- [ ] **Shows 3 random choices**
- [ ] **Displays passive and active descriptions**
- [ ] **Click selects relic**
- [ ] **Game pauses during selection**

### Known Limitations

1. Relic icons use colored circles (placeholder)
2. Some active effects need GameScene integration
3. Relic selection trigger not fully connected
4. Set bonuses not implemented in MVP

---

## Integration Notes

To integrate relics into GameScene:

```typescript
// Initialize
this.relicSystem = new RelicSystem(this);
this.relicSelectUI = new RelicSelectUI(this);

// Pass to HUD
this.hud = new HUD(this, timeManager, combatMechanics, relicSystem);

// Update cooldowns
update(time, delta) {
  this.relicSystem.update(delta / 1000);
  this.hud.updateRelicDisplay();
}

// Apply passive modifiers
const speedBonus = this.relicSystem.getTotalPassiveValue('movement_speed');
this.player.setSpeedModifier(speedBonus);

// Activate relic (keys 1-5 or Q/E)
this.relicSystem.useActive(0); // First relic

// Show selection UI
this.relicSelectUI.show(excludeIds, (relic) => {
  this.relicSystem.equipRelic(relic);
});
```

---

## Relic Data Structure

```typescript
interface RelicDefinition {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'legendary';
  theme: 'verdant' | 'frozen' | 'ember' | 'void' | 'shadow' | 'generic';
  passive: {
    type: PassiveEffectType;
    value: number;
    description: string;
  };
  active: {
    type: ActiveEffectType;
    value: number;
    cooldown: number;
    description: string;
  };
}
```

---

## Next Steps (Future Iteration)

1. Add remaining 7 relics (Ember, Void, Shadow sets)
2. Implement set bonuses (2/3/4 of same theme)
3. Create unique relic icons
4. Add visual effects for active abilities
5. Connect relic selection to boss defeats
6. Add relic-combat synergies
7. Implement Shadow counter effects
