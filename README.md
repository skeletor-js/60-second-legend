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

**Phase 1: Foundation - COMPLETE** ✅

All Phase 1 deliverables have been implemented with 170 passing tests:

- ✅ Project scaffolding with Vite + Phaser + TypeScript
- ✅ Asset loading pipeline (sprites, UI elements)
- ✅ TimeManager with visual HUD (countdown, color changes, +time popups)
- ✅ rot.js dungeon generation (60x40 tiles, 10-12 rooms per floor)
- ✅ Player movement (8-directional, physics-based)
- ✅ Camera following player with bounds
- ✅ Room transition detection and clearing
- ✅ Slime enemies with chase AI
- ✅ Time extension on enemy kill (+3s) and room clear (+8s)

### Controls

| Key | Action |
|-----|--------|
| Arrow Keys / WASD | Move |
| L | Attack |
| P | Pause |

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
- [ ] **Phase 2: Combat** - Weapons, combos, enemies
- [ ] **Phase 3: Floor Themes** - 5 distinct biomes with hazards
- [ ] **Phase 4: Relics** - Build variety through relic combinations
- [ ] **Phase 5: The Shadow** - Corruption system and pursuer
- [ ] **Phase 6: Meta Progression** - Between-run upgrades
- [ ] **Phase 7: Polish** - Juice, audio, accessibility

## License

MIT
