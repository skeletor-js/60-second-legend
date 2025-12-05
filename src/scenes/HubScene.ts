/**
 * HubScene
 * Hub area between menu and gameplay
 * Features: Dungeon entrance, upgrade shrine, shard display
 */

import Phaser from 'phaser';
import { ProgressionSystem } from '@systems/ProgressionSystem';
import { UPGRADES, TIME, PLAYER, UpgradeDefinition } from '@config/Constants';

export interface RunConfig {
  /** Modified max time based on upgrades */
  maxTime: number;
  /** Modified max health based on upgrades */
  maxHealth: number;
  /** Additional weapon damage from upgrades */
  bonusDamage: number;
  /** Starting relic count */
  startingRelics: number;
}

/**
 * HubScene - Meta progression hub
 */
export class HubScene extends Phaser.Scene {
  private progressionSystem!: ProgressionSystem;
  private upgradePanel?: Phaser.GameObjects.Container;
  private shardDisplay!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'HubScene' });
  }

  init(): void {
    // Initialize or get existing progression system
    if (!this.game.registry.has('progressionSystem')) {
      this.progressionSystem = new ProgressionSystem();
      this.game.registry.set('progressionSystem', this.progressionSystem);
    } else {
      this.progressionSystem = this.game.registry.get('progressionSystem') as ProgressionSystem;
    }
  }

  create(): void {
    this.cameras.main.fadeIn(500);

    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

    // Title
    this.add
      .text(width / 2, 20, 'Memory Nexus', {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Shard display (top right)
    const availableShards = this.progressionSystem.getLogic().getAvailableShards();
    this.shardDisplay = this.add
      .text(width - 10, 10, `Shards: ${availableShards}`, {
        fontSize: '10px',
        color: '#00ffff',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0);

    // Dungeon Gate (left side)
    this.createDungeonGate(60, height / 2);

    // Upgrade Shrine (right side)
    this.createUpgradeShrine(width - 60, height / 2);

    // Instructions
    this.add
      .text(width / 2, height - 15, 'Click Dungeon Gate to start run | Click Shrine to view upgrades', {
        fontSize: '7px',
        color: '#888888',
      })
      .setOrigin(0.5);
  }

  /**
   * Create the dungeon gate entrance
   */
  private createDungeonGate(x: number, y: number): void {
    const gate = this.add.container(x, y);

    // Gate visual (placeholder rectangle)
    const gateRect = this.add.rectangle(0, 0, 40, 60, 0x4a4a6a).setStrokeStyle(2, 0x8888aa);
    gate.add(gateRect);

    // Gate label
    const gateLabel = this.add
      .text(0, 35, 'Enter\nDungeon', {
        fontSize: '8px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5);
    gate.add(gateLabel);

    // Make interactive
    gateRect.setInteractive({ useHandCursor: true });
    gateRect.on('pointerdown', () => {
      this.startRun();
    });

    gateRect.on('pointerover', () => {
      gateRect.setFillStyle(0x5a5a7a);
    });

    gateRect.on('pointerout', () => {
      gateRect.setFillStyle(0x4a4a6a);
    });

    // Pulse animation
    this.tweens.add({
      targets: gateRect,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Create the upgrade shrine
   */
  private createUpgradeShrine(x: number, y: number): void {
    const shrine = this.add.container(x, y);

    // Shrine visual (placeholder rectangle)
    const shrineRect = this.add.rectangle(0, 0, 40, 50, 0x6a4a6a).setStrokeStyle(2, 0xaa88aa);
    shrine.add(shrineRect);

    // Shrine label
    const shrineLabel = this.add
      .text(0, 32, 'Upgrade\nShrine', {
        fontSize: '8px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5);
    shrine.add(shrineLabel);

    // Make interactive
    shrineRect.setInteractive({ useHandCursor: true });
    shrineRect.on('pointerdown', () => {
      this.toggleUpgradePanel();
    });

    shrineRect.on('pointerover', () => {
      shrineRect.setFillStyle(0x7a5a7a);
    });

    shrineRect.on('pointerout', () => {
      shrineRect.setFillStyle(0x6a4a6a);
    });

    // Glow animation
    this.tweens.add({
      targets: shrineRect,
      alpha: 0.7,
      duration: 1200,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Toggle upgrade panel visibility
   */
  private toggleUpgradePanel(): void {
    if (this.upgradePanel) {
      this.upgradePanel.destroy();
      this.upgradePanel = undefined;
      return;
    }

    this.createUpgradePanel();
  }

  /**
   * Create upgrade panel UI
   */
  private createUpgradePanel(): void {
    const { width, height } = this.cameras.main;

    // Panel container
    this.upgradePanel = this.add.container(width / 2, height / 2);

    // Background
    const bg = this.add.rectangle(0, 0, 280, 160, 0x2a2a3e, 0.95).setStrokeStyle(2, 0x8888aa);
    this.upgradePanel.add(bg);

    // Title
    const title = this.add
      .text(0, -70, 'Upgrade Shrine', {
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.upgradePanel.add(title);

    // Get upgrades
    const upgrades = this.progressionSystem.getAvailableUpgrades();

    // Display upgrades
    let yOffset = -45;
    upgrades.forEach(({ key, upgrade, unlocked, canAfford }) => {
      const upgradeItem = this.createUpgradeItem(key, upgrade, unlocked, canAfford, yOffset);
      this.upgradePanel!.add(upgradeItem);
      yOffset += 25;
    });

    // Close button
    const closeBtn = this.add
      .text(0, 70, '[Close]', {
        fontSize: '9px',
        color: '#00ff88',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      this.toggleUpgradePanel();
    });

    closeBtn.on('pointerover', () => {
      closeBtn.setColor('#00ffaa');
    });

    closeBtn.on('pointerout', () => {
      closeBtn.setColor('#00ff88');
    });

    this.upgradePanel.add(closeBtn);

    // Make background interactive to prevent click-through
    bg.setInteractive();
  }

  /**
   * Create a single upgrade item UI element
   */
  private createUpgradeItem(
    key: string,
    upgrade: UpgradeDefinition,
    unlocked: boolean,
    canAfford: boolean,
    yOffset: number
  ): Phaser.GameObjects.Container {
    const container = this.add.container(0, yOffset);

    // Status indicator
    const statusColor = unlocked ? 0x00ff00 : canAfford ? 0xffff00 : 0x888888;
    const statusBox = this.add.rectangle(-125, 0, 8, 8, statusColor);
    container.add(statusBox);

    // Upgrade name
    const nameText = this.add
      .text(-115, 0, upgrade.name, {
        fontSize: '8px',
        color: unlocked ? '#888888' : '#ffffff',
      })
      .setOrigin(0, 0.5);
    container.add(nameText);

    // Cost
    const costText = this.add
      .text(60, 0, `${upgrade.cost} shards`, {
        fontSize: '7px',
        color: unlocked ? '#666666' : canAfford ? '#00ffff' : '#ff6666',
      })
      .setOrigin(0, 0.5);
    container.add(costText);

    // Purchase button
    if (!unlocked) {
      const btnText = this.add
        .text(115, 0, canAfford ? '[Buy]' : '[---]', {
          fontSize: '8px',
          color: canAfford ? '#00ff88' : '#444444',
        })
        .setOrigin(0.5);

      if (canAfford) {
        btnText.setInteractive({ useHandCursor: true });

        btnText.on('pointerdown', () => {
          const success = this.progressionSystem.purchaseUpgrade(key);
          if (success) {
            // Refresh panel
            this.toggleUpgradePanel();
            this.toggleUpgradePanel();

            // Update shard display
            const availableShards = this.progressionSystem.getLogic().getAvailableShards();
            this.shardDisplay.setText(`Shards: ${availableShards}`);
          }
        });

        btnText.on('pointerover', () => {
          btnText.setColor('#00ffaa');
        });

        btnText.on('pointerout', () => {
          btnText.setColor('#00ff88');
        });
      }

      container.add(btnText);
    } else {
      // Owned indicator
      const ownedText = this.add
        .text(115, 0, '[Owned]', {
          fontSize: '7px',
          color: '#666666',
        })
        .setOrigin(0.5);
      container.add(ownedText);
    }

    return container;
  }

  /**
   * Start a dungeon run with applied upgrades
   */
  private startRun(): void {
    const runConfig = this.buildRunConfig();

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene', runConfig);
    });
  }

  /**
   * Build run configuration based on purchased upgrades
   */
  private buildRunConfig(): RunConfig {
    const unlockedUpgrades = this.progressionSystem.getLogic().getUnlockedUpgrades();

    const config: RunConfig = {
      maxTime: TIME.MAX_TIME,
      maxHealth: PLAYER.MAX_HEALTH,
      bonusDamage: 0,
      startingRelics: 0,
    };

    // Apply each upgrade
    unlockedUpgrades.forEach((upgradeKey) => {
      const upgrade = (UPGRADES as Record<string, UpgradeDefinition>)[upgradeKey];
      if (!upgrade) return;

      switch (upgrade.effect) {
        case 'maxTime':
          config.maxTime = upgrade.value;
          break;
        case 'maxHealth':
          config.maxHealth = upgrade.value;
          break;
        case 'baseDamage':
          config.bonusDamage += upgrade.value;
          break;
        case 'startingRelic':
          config.startingRelics += upgrade.value;
          break;
      }
    });

    return config;
  }
}
