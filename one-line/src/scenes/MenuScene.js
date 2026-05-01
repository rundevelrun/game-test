class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const W = 400, H = 700;
    const gfx = this.add.graphics();
    for (let i = 0; i < 70; i++) {
      gfx.fillStyle(0xffffff, Math.random() * 0.3 + 0.05);
      gfx.fillCircle(Math.random() * W, Math.random() * H, Math.random() * 1.3 + 0.2);
    }

    this.add.text(W / 2, H * 0.28, 'ONE LINE', {
      fontSize: '52px', fontFamily: 'Arial Black, Arial',
      color: '#ffffff', stroke: '#00cfff', strokeThickness: 2
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.28 + 64, '손 떼지 말고 모든 선을 그어라', {
      fontSize: '13px', fontFamily: 'Arial', color: '#445566', letterSpacing: 1
    }).setOrigin(0.5);

    const best = parseInt(localStorage.getItem('one_line_best') || '0');
    if (best > 0) {
      this.add.text(W / 2, H * 0.55, 'LEVEL ' + best + ' 완료', {
        fontSize: '16px', fontFamily: 'Arial', color: '#00cfff', letterSpacing: 2
      }).setOrigin(0.5);
    }

    const tapTxt = this.add.text(W / 2, H * 0.72, 'TAP TO PLAY', {
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
