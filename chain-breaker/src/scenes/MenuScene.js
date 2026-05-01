class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const W = 400, H = 700;
    const gfx = this.add.graphics();
    for (let i = 0; i < 70; i++) {
      gfx.fillStyle(0xffffff, Math.random() * 0.3 + 0.05);
      gfx.fillCircle(Math.random() * W, Math.random() * H, Math.random() * 1.3 + 0.2);
    }

    this.add.text(W / 2, H * 0.26, 'CHAIN', {
      fontSize: '54px', fontFamily: 'Arial Black, Arial', color: '#ffffff'
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.26 + 60, 'BREAKER', {
      fontSize: '54px', fontFamily: 'Arial Black, Arial',
      color: '#00cfff', stroke: '#00cfff', strokeThickness: 1
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.26 + 120, '정확한 타이밍에 체인을 끊어라', {
      fontSize: '13px', fontFamily: 'Arial', color: '#445566', letterSpacing: 1
    }).setOrigin(0.5);

    const best = parseInt(localStorage.getItem('chain_breaker_best') || '0');
    if (best > 0) {
      this.add.text(W / 2, H * 0.57, 'BEST', {
        fontSize: '11px', fontFamily: 'Arial', color: '#334455', letterSpacing: 4
      }).setOrigin(0.5);
      this.add.text(W / 2, H * 0.57 + 22, best.toString(), {
        fontSize: '36px', fontFamily: 'Arial Black, Arial', color: '#00cfff'
      }).setOrigin(0.5);
    }

    const tapTxt = this.add.text(W / 2, H * 0.73, 'TAP TO PLAY', {
      fontSize: '15px', fontFamily: 'Arial', color: '#00cfff', letterSpacing: 5
    }).setOrigin(0.5);
    this.tweens.add({ targets: tapTxt, alpha: 0.25, duration: 900, yoyo: true, repeat: -1 });

    const back = this.add.text(20, 20, '< GAMES', {
      fontSize: '12px', fontFamily: 'Arial', color: '#334455', letterSpacing: 2
    }).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#00cfff'));
    back.on('pointerout', () => back.setColor('#334455'));
    back.on('pointerdown', () => { window.location.href = '../'; });

    this.input.on('pointerdown', (ptr) => {
      if (ptr.x < 100 && ptr.y < 60) return;
      this.scene.start('GameScene');
    });
  }
}
