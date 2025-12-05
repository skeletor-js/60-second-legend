# 60 Second Legend

> A time-loop roguelike built with Phaser 3, TypeScript, and rot.js

*Restore the Tree of Memories. Defeat the Whispering Shadow. Race against time.*

## Game Concept

**60 Second Legend** is a time-loop roguelike where players navigate procedurally generated dungeons under constant time pressure. Every action either costs or earns time - kills extend the clock, hesitation drains it. The Whispering Shadow corrupts the world as you progress, creating escalating tension across a 10-floor journey to restore the Tree of Memories.

### Core Pillars

| Pillar | Description |
|--------|-------------|
| **Time Tension** | Every second matters. The countdown never stops. |
| **Build Variety** | Weapon + Relic combinations create distinct playstyles |
| **Escalating Threat** | Shadow corruption increases, changing the game dynamically |
| **Skill Expression** | Perfect dodges, kill streaks, and speed bonuses reward mastery |
| **Meaningful Choices** | Fight for time vs. rush ahead vs. explore for secrets |

## Tech Stack

- **Phaser 3** - Game engine (rendering, input, physics)
- **TypeScript** - Type safety and better DX
- **rot.js** - Roguelike toolkit (dungeon generation, FOV, pathfinding)
- **Vite** - Build tool and dev server

## Current Status

**Phase 6: Meta Progression - IMPLEMENTED** 🔧

All core systems have been implemented and are ready for integration testing. See the [docs/](docs/) folder for detailed documentation on each phase.

### Implemented Phases

| Phase | Status | Summary |
|-------|--------|---------|
| **Phase 1: Foundation** | ✅ Complete | Playable dungeon with timer mechanic |
| **Phase 2: Combat** | ✅ Complete | Weapons, combos, enemy variety |
| **Phase 3: Floor Themes** | 🔧 Implemented | 2 biomes (Verdant Ruins, Frozen Archive), hazard system |
| **Phase 4: Relics** | 🔧 Implemented | 6 relics with passives/actives, selection UI |
| **Phase 5: Shadow** | 🔧 Implemented | Corruption system, Shadow Pursuer entity |
| **Phase 6: Meta** | 🔧 Implemented | Save system, Hub scene, 4 upgrades |

### Phase Highlights

**Phase 3: Floor Themes** ([docs](docs/phase-3-floor-themes.md))
- Floor theme system with color palettes and enemy modifiers
- Hazard system with overgrowth (slow) and ice tiles (slide)
- 49 new tests

**Phase 4: Relic System** ([docs](docs/phase-4-relic-system.md))
- 6 relics with passive effects and active abilities
- Relic selection UI with modal overlay
- HUD integration with cooldown visualization
- 61 new tests

**Phase 5: Shadow System** ([docs](docs/phase-5-shadow-system.md))
- Corruption meter (0-100) with threshold effects
- Shadow Pursuer spawns at 100% corruption
- Time drain increases at 50% corruption
- 32 new tests

**Phase 6: Meta Progression** ([docs](docs/phase-6-meta-progression.md))
- Memory Shard economy (earn during runs, spend in hub)
- LocalStorage persistence with save versioning
- Hub Scene with upgrade shrine
- 4 permanent upgrades (time, combat, survival, relic)
- 41 new tests

### Controls

| Key | Action |
|-----|--------|
| Arrow Keys / WASD | Move (8-directional) |
| L | Attack |
| M | Dash/Dodge |
| 1 | Swift Daggers (ranged) |
| 2 | Memory Blade (default) |
| 3 | Shatter Hammer (AOE) |
| P / ESC | Pause |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/skeletor-js/60-second-legend.git
cd 60-second-legend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run test suite (170 tests) |

## Project Structure

```
60-second-legend/
├── src/
│   ├── main.ts                    # Entry point
│   ├── config/
│   │   ├── GameConfig.ts          # Phaser configuration
│   │   ├── Constants.ts           # Game balance values
│   │   └── AssetManifest.ts       # Asset definitions
│   ├── scenes/
│   │   ├── BootScene.ts           # Asset preloading
│   │   ├── MenuScene.ts           # Main menu
│   │   └── GameScene.ts           # Main gameplay
│   ├── systems/
│   │   ├── TimeManager.ts         # Core time mechanic
│   │   ├── DungeonGenerator.ts    # rot.js integration
│   │   └── CombatSystem.ts        # Weapons and damage
│   ├── entities/
│   │   ├── Player.ts              # Player character
│   │   ├── Enemy.ts               # Base enemy class
│   │   └── enemies/
│   │       └── Slime.ts           # Slime enemy variant
│   ├── ui/
│   │   └── HUD.ts                 # Timer, health, popups
│   └── test/
│       └── mocks/                 # Phaser mocks for testing
├── assets/
│   └── SGQ_Dungeon/               # Sprite assets
├── public/                        # Static files
└── docs/                          # Documentation
```

## Development Phases

- [x] **Phase 1: Foundation** - Playable dungeon with timer mechanic ✅
- [x] **Phase 2: Combat** - Weapons, combos, enemy variety ✅
- [x] **Phase 3: Floor Themes** - 2 biomes with hazards 🔧 *Integration pending*
- [x] **Phase 4: Relics** - 6 relics with passives/actives 🔧 *Integration pending*
- [x] **Phase 5: The Shadow** - Corruption system and pursuer 🔧 *Integration pending*
- [x] **Phase 6: Meta Progression** - Hub scene, save system, upgrades 🔧 *Integration pending*
- [ ] **Phase 7: Polish** - Juice, audio, accessibility

**Legend:** ✅ Complete & Integrated | 🔧 Implemented, awaiting integration

**Test Coverage:** 170 base + 183 new = 353 total tests

## License

MIT

