class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const W = 400, H = 700;

    // Stars
    const gfx = this.add.graphics();
    for (let i = 0; i < 70; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = Math.random() * 1.3 + 0.2;
      const a = Math.random() * 0.35 + 0.05;
      gfx.fillStyle(0xffffff, a);
      gfx.fillCircle(x, y, r);
    }

    // Title
    this.add.text(W / 2, H * 0.3, 'STACK', {
      fontSize: '72px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffffff',
      stroke: '#00cfff',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.add.text(W / 2, H * 0.3 + 72, '블록을 완벽하게 쌓아라', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#445566',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Best score
    const best = parseInt(localStorage.getItem('stack_best') || '0');
    if (best > 0) {
      this.add.text(W / 2, H * 0.52, 'BEST', {
        fontSize: '11px',
        fontFamily: 'Arial',
        color: '#334455',
        letterSpacing: 4
      }).setOrigin(0.5);

      this.add.text(W / 2, H * 0.52 + 22, best.toString(), {
        fontSize: '36px',
        fontFamily: 'Arial Black, Arial',
        color: '#00cfff'
      }).setOrigin(0.5);
    }

    // Tap to play
    const tapTxt = this.add.text(W / 2, H * 0.7, 'TAP TO PLAY', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#00cfff',
      letterSpacing: 5
    }).setOrigin(0.5);

    this.tweens.add({
      targets: tapTxt,
      alpha: 0.25,
      duration: 900,
      yoyo: true,
      repeat: -1
    });

    // Back to hub
    const backBtn = this.add.text(20, 20, '< GAMES', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#334455',
      letterSpacing: 2
    }).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setColor('#00cfff'));
    backBtn.on('pointerout', () => backBtn.setColor('#334455'));
    backBtn.on('pointerdown', () => { window.location.href = '../'; });

    this.input.on('pointerdown', (ptr) => {
      if (ptr.x < 100 && ptr.y < 60) return;
      this.scene.start('GameScene');
    });
  }
}
