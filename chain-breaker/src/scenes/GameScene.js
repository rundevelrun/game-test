class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.W = 400; this.H = 700;
    this.CX = 200; this.CY = 310;
    this.RADIUS = 130;

    this.markerAngle = 0;
    this.markerSpeed = 1.8;
    this.targetAngle = Math.PI * 0.5;
    this.targetArcSize = 0.72;
    this.lives = 3;
    this.score = 0;
    this.gameActive = true;
    this.flashTimer = 0;
    this.flashMsg = '';
    this.flashColor = 0x00ffff;

    const sg = this.add.graphics().setDepth(0);
    for (let i = 0; i < 60; i++) {
      sg.fillStyle(0xffffff, Math.random() * 0.28 + 0.04);
      sg.fillCircle(Math.random() * this.W, Math.random() * this.H, Math.random() * 1.2 + 0.2);
    }

    this.gfx = this.add.graphics().setDepth(5);

    this.scoreTxt = this.add.text(this.CX, 90, '0', {
      fontSize: '100px', fontFamily: 'Arial Black, Arial', color: '#ffffff'
    }).setOrigin(0.5).setAlpha(0.08).setDepth(1);

    this.flashTxt = this.add.text(this.CX, this.CY + 180, '', {
      fontSize: '22px', fontFamily: 'Arial Black, Arial', color: '#00ffff'
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    this.input.on('pointerdown', this.onTap, this);
    this.input.keyboard?.on('keydown-SPACE', this.onTap, this);
  }

  onTap() {
    if (!this.gameActive) return;
    const diff = this.angleDiff(this.markerAngle, this.targetAngle);
    if (Math.abs(diff) <= this.targetArcSize / 2) {
      this.score++;
      this.scoreTxt.setText(this.score);
      this.targetAngle = Math.random() * Math.PI * 2;
      this.markerSpeed = Math.min(6.5, this.markerSpeed + 0.13);
      this.targetArcSize = Math.max(0.22, this.targetArcSize - 0.022);
      this.showFlash('BREAK!', 0x00ffff);
    } else {
      this.lives--;
      this.cameras.main.shake(150, 0.009);
      this.showFlash('MISS', 0xff4444);
      if (this.lives <= 0) {
        this.gameActive = false;
        const best = Math.max(this.score, parseInt(localStorage.getItem('chain_breaker_best') || '0'));
        localStorage.setItem('chain_breaker_best', best);
        this.time.delayedCall(700, () => {
          this.scene.start('GameOverScene', { score: this.score, best });
        });
      }
    }
  }

  angleDiff(a, b) {
    let d = ((a - b) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    return d;
  }

  showFlash(msg, color) {
    const hex = '#' + color.toString(16).padStart(6, '0');
    this.flashTxt.setText(msg).setColor(hex).setAlpha(1);
    this.tweens.killTweensOf(this.flashTxt);
    this.tweens.add({
      targets: this.flashTxt, alpha: 0, duration: 800, ease: 'Power2'
    });
  }

  update(time, delta) {
    const dt = delta / 1000;
    if (this.gameActive) {
      this.markerAngle = (this.markerAngle + this.markerSpeed * dt) % (Math.PI * 2);
    }

    this.gfx.clear();

    const toScreen = (angle) => ({
      x: this.CX + this.RADIUS * Math.cos(angle - Math.PI / 2),
      y: this.CY + this.RADIUS * Math.sin(angle - Math.PI / 2)
    });

    // Base ring
    this.gfx.lineStyle(6, 0x1a2a3a, 1);
    this.gfx.beginPath();
    this.gfx.arc(this.CX, this.CY, this.RADIUS, 0, Math.PI * 2, false);
    this.gfx.strokePath();

    // Tick marks
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const inner = this.RADIUS - 8, outer = this.RADIUS + 2;
      this.gfx.lineStyle(1, 0x2a4a6a, 0.6);
      this.gfx.lineBetween(
        this.CX + inner * Math.cos(a), this.CY + inner * Math.sin(a),
        this.CX + outer * Math.cos(a), this.CY + outer * Math.sin(a)
      );
    }

    // Target arc
    const tStart = this.targetAngle - this.targetArcSize / 2 - Math.PI / 2;
    const tEnd = this.targetAngle + this.targetArcSize / 2 - Math.PI / 2;
    this.gfx.lineStyle(10, 0x00cfff, 0.9);
    this.gfx.beginPath();
    this.gfx.arc(this.CX, this.CY, this.RADIUS, tStart, tEnd, false);
    this.gfx.strokePath();

    // Glow on target arc
    this.gfx.lineStyle(18, 0x00cfff, 0.15);
    this.gfx.beginPath();
    this.gfx.arc(this.CX, this.CY, this.RADIUS, tStart, tEnd, false);
    this.gfx.strokePath();

    // Marker
    const mp = toScreen(this.markerAngle);
    this.gfx.fillStyle(0xffffff, 0.25);
    this.gfx.fillCircle(mp.x, mp.y, 15);
    this.gfx.fillStyle(0xffffff, 1);
    this.gfx.fillCircle(mp.x, mp.y, 8);

    // Lives
    for (let i = 0; i < 3; i++) {
      const lx = this.CX - 24 + i * 24;
      const alive = i < this.lives;
      this.gfx.fillStyle(alive ? 0x00cfff : 0x1a2a3a, 1);
      this.gfx.fillCircle(lx, this.H - 50, 7);
      if (alive) {
        this.gfx.lineStyle(1, 0x00cfff, 0.4);
        this.gfx.strokeCircle(lx, this.H - 50, 11);
      }
    }

    // Speed label
    const round = Math.floor((this.markerSpeed - 1.8) / 0.13) + 1;
    this.gfx.fillStyle(0x223344, 1);
  }
}
