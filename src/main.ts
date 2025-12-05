import Phaser from 'phaser';
import { gameConfig } from '@config/GameConfig';

/**
 * 60 Second Legend
 * A time-loop roguelike built with Phaser 3, TypeScript, and rot.js
 *
 * Restore the Tree of Memories. Defeat the Whispering Shadow. Race against time.
 */

// Create and start the game
const game = new Phaser.Game(gameConfig);

// Export for debugging in development
if (import.meta.env.DEV) {
  (window as unknown as { game: Phaser.Game }).game = game;
}

export default game;
