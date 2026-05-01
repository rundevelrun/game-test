class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create(data) {
    const W = 400, H = 700;
    const score = data.score || 0;
    const best = data.best || parseInt(localStorage.getItem('chain_breaker_best') || '0');
    const isNewBest = score > 0 && score >= best;

    const gfx = this.add.graphics();
    for (let i = 0; i < 70; i++) {
      gfx.fillStyle(0xffffff, Math.random() * 0.3 + 0.05);
      gfx.fillCircle(Math.random() * W, Math.random() * H, Math.random() * 1.3 + 0.2);
    }

    this.add.text(W / 2, H * 0.22, 'GAME OVER', {
      fontSize: '30px', fontFamily: 'Arial Black, Arial', color: '#ffffff', letterSpacing: 4
    }).setOrigin(0.5);

    this.add.text(W / 2, H * 0.38, 'SCORE', {
      fontSize: '11px', fontFamily: 'Arial', color: '#334455', letterSpacing: 5
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.38 + 20, score.toString(), {
      fontSize: '64px', fontFamily: 'Arial Black, Arial', color: '#ffffff'
    }).setOrigin(0.5);

    if (isNewBest && score > 0) {
      const nb = this.add.text(W / 2, H * 0.38 + 90, 'NEW BEST', {
        fontSize: '13px', fontFamily: 'Arial', color: '#00cfff', letterSpacing: 4
      }).setOrigin(0.5);
      this.tweens.add({ targets: nb, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
    } else if (best > 0) {
      this.add.text(W / 2, H * 0.38 + 88, 'BEST  ' + best, {
        fontSize: '14px', fontFamily: 'Arial', color: '#334455', letterSpacing: 2
      }).setOrigin(0.5);
    }

    const retryBtn = this.add.text(W / 2, H * 0.65, 'RETRY', {
      fontSize: '18px', fontFamily: 'Arial Black, Arial', color: '#ffffff',
      backgroundColor: '#0a1a2a', padding: { x: 32, y: 14 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    retryBtn.on('pointerover', () => retryBtn.setColor('#00cfff'));
    retryBtn.on('pointerout', () => retryBtn.setColor('#ffffff'));
    retryBtn.on('pointerdown', () => this.scene.start('GameScene'));

    const menuBtn = this.add.text(W / 2, H * 0.75, 'MENU', {
      fontSize: '14px', fontFamily: 'Arial', color: '#334455', letterSpacing: 3
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menuBtn.on('pointerover', () => menuBtn.setColor('#7a9aaa'));
    menuBtn.on('pointerout', () => menuBtn.setColor('#334455'));
    menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
