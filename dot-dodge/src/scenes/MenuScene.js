class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor('#050510');
    this._createStars(W, H);

    // Title
    this.add.text(W / 2, H * 0.28, 'DOT DODGE', {
      fontSize: '42px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff',
      letterSpacing: 8,
      shadow: { offsetX: 0, offsetY: 0, color: '#00cfff', blur: 20, fill: true }
    }).setOrigin(0.5);

    // Animated player preview (square)
    const glow = this.add.rectangle(W / 2, H * 0.46, 44, 44, 0x00cfff, 0.15);
    this.add.rectangle(W / 2, H * 0.46, 28, 28, 0x00cfff);
    this.tweens.add({ targets: glow, scaleX: 1.3, scaleY: 1.3, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Best stage
    if (window.BEST_STAGE > 1) {
      this.add.text(W / 2, H * 0.57, `BEST  STAGE ${window.BEST_STAGE}`, {
        fontSize: '15px', fontFamily: 'Arial', color: '#667799', letterSpacing: 4
      }).setOrigin(0.5);
    }

    // Start
    const startText = this.add.text(W / 2, H * 0.68, 'TAP TO START', {
      fontSize: '20px', fontFamily: 'Arial', color: '#ffffff', letterSpacing: 6
    }).setOrigin(0.5);

    this.tweens.add({ targets: startText, alpha: 0.3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.input.once('pointerup', () => {
      this.scene.start('GameScene', { stage: 1, hp: 100, maxHp: 100, defense: 0 });
    });
  }

  _createStars(W, H) {
    for (let i = 0; i < 120; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, W), Phaser.Math.Between(0, H),
        Phaser.Math.FloatBetween(0.5, 2), 0xffffff, Phaser.Math.FloatBetween(0.2, 0.9)
      );
      this.tweens.add({
        targets: star, alpha: 0.05,
        duration: Phaser.Math.Between(800, 3000),
        yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      });
    }
  }
}
