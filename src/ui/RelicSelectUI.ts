/**
 * Relic Selection UI
 * Modal interface for choosing relics
 */

import Phaser from 'phaser';
import { DISPLAY, RELIC } from '@config/Constants';
import { RelicDefinition, getRandomRelics } from '@data/relics';

/**
 * RelicSelectUI
 * Displays a modal with relic choices when player can acquire a relic
 */
export class RelicSelectUI extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Rectangle;
  private title: Phaser.GameObjects.Text;
  private relicCards: Phaser.GameObjects.Container[] = [];
  private onSelectCallback?: (relic: RelicDefinition) => void;
  private currentChoices: RelicDefinition[] = [];

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    // Create semi-transparent background overlay
    this.background = scene.add.rectangle(
      0,
      0,
      DISPLAY.WIDTH,
      DISPLAY.HEIGHT,
      0x000000,
      0.8
    );
    this.background.setOrigin(0, 0);
    this.add(this.background);

    // Create title text
    this.title = scene.add.text(DISPLAY.WIDTH / 2, 20, 'Choose a Relic', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
    });
    this.title.setOrigin(0.5, 0);
    this.add(this.title);

    scene.add.existing(this);

    // Keep UI fixed on screen
    this.setScrollFactor(0);
    this.setDepth(200);

    // Initially hidden
    this.setVisible(false);
  }

  /**
   * Show the relic selection UI with random choices
   * @param excludeIds Relic IDs to exclude from selection
   * @param onSelect Callback when a relic is selected
   */
  show(excludeIds: string[] = [], onSelect?: (relic: RelicDefinition) => void): void {
    this.onSelectCallback = onSelect;
    this.currentChoices = getRandomRelics(3, excludeIds);

    // Clear existing cards
    this.relicCards.forEach(card => card.destroy());
    this.relicCards = [];

    // Create relic cards
    this.createRelicCards();

    this.setVisible(true);

    // Pause the game
    this.scene.scene.pause();
  }

  /**
   * Hide the relic selection UI
   */
  hide(): void {
    this.setVisible(false);

    // Resume the game
    this.scene.scene.resume();
  }

  /**
   * Create interactive cards for each relic choice
   */
  private createRelicCards(): void {
    const cardWidth = RELIC.CARD_WIDTH;
    const cardHeight = RELIC.CARD_HEIGHT;
    const spacing = RELIC.SELECTION_PADDING;
    const totalWidth = cardWidth * 3 + spacing * 2;
    const startX = (DISPLAY.WIDTH - totalWidth) / 2;
    const cardY = DISPLAY.HEIGHT / 2;

    for (let i = 0; i < this.currentChoices.length; i++) {
      const relic = this.currentChoices[i];
      const cardX = startX + i * (cardWidth + spacing);

      const card = this.createRelicCard(relic, cardX, cardY, cardWidth, cardHeight);
      this.relicCards.push(card);
      this.add(card);
    }
  }

  /**
   * Create a single relic card
   */
  private createRelicCard(
    relic: RelicDefinition,
    x: number,
    y: number,
    width: number,
    height: number
  ): Phaser.GameObjects.Container {
    const card = this.scene.add.container(x, y);

    // Card background
    const bg = this.scene.add.rectangle(0, 0, width, height, this.getRarityColor(relic.rarity), 1);
    bg.setStrokeStyle(2, 0xffffff);
    card.add(bg);

    // Relic name
    const nameText = this.scene.add.text(0, -height / 2 + 8, relic.name, {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: width - 8 },
    });
    nameText.setOrigin(0.5, 0);
    card.add(nameText);

    // Relic icon placeholder (can replace with actual sprite later)
    const icon = this.scene.add.circle(0, -8, RELIC.ICON_SIZE / 2, this.getThemeColor(relic.theme));
    card.add(icon);

    // Passive description
    const passiveText = this.scene.add.text(0, 18, `P: ${relic.passive.description}`, {
      fontFamily: 'monospace',
      fontSize: '6px',
      color: '#aaaaaa',
      align: 'center',
      wordWrap: { width: width - 8 },
    });
    passiveText.setOrigin(0.5, 0);
    card.add(passiveText);

    // Active description
    const activeText = this.scene.add.text(0, 32, `A: ${relic.active.description}`, {
      fontFamily: 'monospace',
      fontSize: '6px',
      color: '#ffff00',
      align: 'center',
      wordWrap: { width: width - 8 },
    });
    activeText.setOrigin(0.5, 0);
    card.add(activeText);

    // Cooldown
    const cooldownText = this.scene.add.text(0, height / 2 - 8, `CD: ${relic.active.cooldown}s`, {
      fontFamily: 'monospace',
      fontSize: '6px',
      color: '#888888',
      align: 'center',
    });
    cooldownText.setOrigin(0.5, 0);
    card.add(cooldownText);

    // Make card interactive
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      bg.setStrokeStyle(3, 0xffff00);
    });
    bg.on('pointerout', () => {
      bg.setStrokeStyle(2, 0xffffff);
    });
    bg.on('pointerdown', () => {
      this.selectRelic(relic);
    });

    return card;
  }

  /**
   * Handle relic selection
   */
  private selectRelic(relic: RelicDefinition): void {
    if (this.onSelectCallback) {
      this.onSelectCallback(relic);
    }
    this.hide();
  }

  /**
   * Get color for rarity
   */
  private getRarityColor(rarity: string): number {
    switch (rarity) {
      case 'common':
        return 0x888888;
      case 'rare':
        return 0x4444ff;
      case 'epic':
        return 0x8844ff;
      case 'legendary':
        return 0xffaa00;
      default:
        return 0x666666;
    }
  }

  /**
   * Get color for theme
   */
  private getThemeColor(theme: string): number {
    switch (theme) {
      case 'verdant':
        return 0x4caf50;
      case 'frozen':
        return 0x4fc3f7;
      case 'ember':
        return 0xff5722;
      case 'void':
        return 0x9c27b0;
      case 'generic':
      default:
        return 0xffffff;
    }
  }

  /**
   * Show swap UI when player has max relics
   */
  showSwapUI(
    newRelic: RelicDefinition,
    currentRelics: RelicDefinition[],
    onSwap?: (index: number) => void
  ): void {
    // Clear existing cards
    this.relicCards.forEach(card => card.destroy());
    this.relicCards = [];

    this.title.setText('Choose Relic to Replace');

    const cardWidth = RELIC.CARD_WIDTH;
    const cardHeight = RELIC.CARD_HEIGHT;
    const spacing = 8;
    const cardsPerRow = 3;
    const totalWidth = cardWidth * cardsPerRow + spacing * (cardsPerRow - 1);
    const startX = (DISPLAY.WIDTH - totalWidth) / 2;
    const cardY = DISPLAY.HEIGHT / 2;

    // Show new relic at top
    const newRelicCard = this.createRelicCard(
      newRelic,
      DISPLAY.WIDTH / 2,
      cardY - 60,
      cardWidth,
      cardHeight
    );
    this.relicCards.push(newRelicCard);
    this.add(newRelicCard);

    // Add label
    const newLabel = this.scene.add.text(DISPLAY.WIDTH / 2, cardY - 95, 'NEW RELIC', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffff00',
    });
    newLabel.setOrigin(0.5, 0);
    this.add(newLabel);

    // Show current relics
    for (let i = 0; i < currentRelics.length; i++) {
      const relic = currentRelics[i];
      const row = Math.floor(i / cardsPerRow);
      const col = i % cardsPerRow;
      const cardX = startX + col * (cardWidth + spacing);
      const cardYPos = cardY + row * (cardHeight + spacing);

      const card = this.createSwapCard(relic, i, cardX, cardYPos, cardWidth, cardHeight, onSwap);
      this.relicCards.push(card);
      this.add(card);
    }

    // Add skip button
    const skipButton = this.createSkipButton();
    this.add(skipButton);

    this.setVisible(true);
    this.scene.scene.pause();
  }

  /**
   * Create a swappable relic card
   */
  private createSwapCard(
    relic: RelicDefinition,
    index: number,
    x: number,
    y: number,
    width: number,
    height: number,
    onSwap?: (index: number) => void
  ): Phaser.GameObjects.Container {
    const card = this.createRelicCard(relic, x, y, width, height);

    // Add interactive handler
    const bg = card.getAt(0) as Phaser.GameObjects.Rectangle;
    bg.removeAllListeners();
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      bg.setStrokeStyle(3, 0xff0000);
    });
    bg.on('pointerout', () => {
      bg.setStrokeStyle(2, 0xffffff);
    });
    bg.on('pointerdown', () => {
      if (onSwap) {
        onSwap(index);
      }
      this.hide();
    });

    return card;
  }

  /**
   * Create skip button
   */
  private createSkipButton(): Phaser.GameObjects.Container {
    const button = this.scene.add.container(DISPLAY.WIDTH / 2, DISPLAY.HEIGHT - 20);

    const bg = this.scene.add.rectangle(0, 0, 60, 16, 0x444444);
    bg.setStrokeStyle(1, 0xffffff);
    bg.setInteractive({ useHandCursor: true });

    const text = this.scene.add.text(0, 0, 'Skip', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffffff',
    });
    text.setOrigin(0.5, 0.5);

    bg.on('pointerover', () => {
      bg.setStrokeStyle(2, 0xffff00);
    });
    bg.on('pointerout', () => {
      bg.setStrokeStyle(1, 0xffffff);
    });
    bg.on('pointerdown', () => {
      this.hide();
    });

    button.add([bg, text]);
    return button;
  }

  /**
   * Cleanup
   */
  destroy(fromScene?: boolean): void {
    this.relicCards.forEach(card => card.destroy());
    super.destroy(fromScene);
  }
}
