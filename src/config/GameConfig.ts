import Phaser from 'phaser';
import { DISPLAY } from './Constants';
import { BootScene } from '@scenes/BootScene';
import { MenuScene } from '@scenes/MenuScene';
import { HubScene } from '@scenes/HubScene';
import { GameScene } from '@scenes/GameScene';

/**
 * Phaser Game Configuration
 */
export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: DISPLAY.WIDTH,
  height: DISPLAY.HEIGHT,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: DISPLAY.SCALE,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: import.meta.env.DEV,
    },
  },
  scene: [BootScene, MenuScene, HubScene, GameScene],
  backgroundColor: '#1a1a2e',
};
