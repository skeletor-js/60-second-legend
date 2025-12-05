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

## Project Structure

```
60-second-legend/
├── src/
│   ├── main.ts              # Entry point
│   ├── config/              # Game configuration
│   ├── scenes/              # Phaser scenes
│   ├── systems/             # Core game systems
│   ├── entities/            # Player, enemies, pickups
│   ├── components/          # ECS-style components
│   ├── ui/                  # HUD and menus
│   └── utils/               # Utility functions
├── assets/
│   ├── SGQ_Dungeon/         # Sprite assets
│   └── SGQ_ui/              # UI assets
├── public/                  # Static files
└── package.json
```

## Development Phases

1. **Foundation** - Playable dungeon with timer mechanic
2. **Combat** - Weapons, combos, enemies
3. **Floor Themes** - 5 distinct biomes with hazards
4. **Relics** - Build variety through relic combinations
5. **The Shadow** - Corruption system and pursuer
6. **Meta Progression** - Between-run upgrades
7. **Polish** - Juice, audio, accessibility

## License

MIT
