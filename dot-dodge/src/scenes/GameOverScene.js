class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.stage = data.stage || 1;
    if (this.stage > (window.BEST_STAGE || 1)) window.BEST_STAGE = this.stage;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor('#050510');
    this.cameras.main.setAlpha(0);
    this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: 400 });

    // Stars
    for (let i = 0; i < 80; i++) {
      this.add.circle(
        Phaser.Math.Between(0, W), Phaser.Math.Between(0, H),
        Phaser.Math.FloatBetween(0.5, 1.5), 0xffffff, Phaser.Math.FloatBetween(0.1, 0.5)
      );
    }

    this.add.text(W / 2, H * 0.27, 'GAME OVER', {
      fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff',
      letterSpacing: 8,
      shadow: { offsetX: 0, offsetY: 0, color: '#ff2255', blur: 16, fill: true }
    }).setOrigin(0.5);

    this.add.text(W / 2, H * 0.4, `STAGE ${this.stage}`, {
      fontSize: '52px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(W / 2, H * 0.5, '까지 도달', {
      fontSize: '14px', fontFamily: 'Arial', color: '#667799', letterSpacing: 4
    }).setOrigin(0.5);

    this.add.text(W / 2, H * 0.59, `BEST  STAGE ${window.BEST_STAGE}`, {
      fontSize: '15px', fontFamily: 'Arial', color: '#334466', letterSpacing: 4
    }).setOrigin(0.5);

    // Retry
    const retryBtn = this.add.text(W / 2, H * 0.72, 'RETRY', {
      fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff', letterSpacing: 8
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retryBtn.on('pointerover', () => retryBtn.setAlpha(0.6));
    retryBtn.on('pointerout', () => retryBtn.setAlpha(1));
    retryBtn.on('pointerup', () => this.scene.start('GameScene', { stage: 1, hp: 100, maxHp: 100, defense: 0 }));

    // Ad revive
    const adBtn = this.add.text(W / 2, H * 0.83, '▶  WATCH AD TO REVIVE', {
      fontSize: '13px', fontFamily: 'Arial', color: '#334466', letterSpacing: 3
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    adBtn.on('pointerover', () => adBtn.setAlpha(0.6));
    adBtn.on('pointerout', () => adBtn.setAlpha(1));
    adBtn.on('pointerup', () => {
      // Placeholder
      this.scene.start('GameScene', { stage: this.stage, hp: 50, maxHp: 100, defense: 0 });
    });

    const menuBtn = this.add.text(W / 2, H * 0.91, 'MENU', {
      fontSize: '13px', fontFamily: 'Arial', color: '#334466', letterSpacing: 4
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerup', () => this.scene.start('MenuScene'));
  }
}
