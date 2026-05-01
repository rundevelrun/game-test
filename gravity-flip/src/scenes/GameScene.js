class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.W = 400; this.H = 700;
    this.player = { x: 90, y: this.H / 2, vy: 0, gravity: 520 };
    this.pipes = [];
    this.pipeSpeed = 180;
    this.pipeInterval = 1800;
    this.gapSize = 160;
    this.lastPipe = 0;
    this.pipeCount = 0;
    this.score = 0;
    this.gameActive = true;

    const sg = this.add.graphics().setDepth(0);
    for (let i = 0; i < 60; i++) {
      sg.fillStyle(0xffffff, Math.random() * 0.28 + 0.04);
      sg.fillCircle(Math.random() * this.W, Math.random() * this.H, Math.random() * 1.2 + 0.2);
    }

    this.gfx = this.add.graphics().setDepth(5);

    this.scoreTxt = this.add.text(this.W / 2, 80, '0', {
      fontSize: '100px', fontFamily: 'Arial Black, Arial', color: '#ffffff'
    }).setOrigin(0.5).setAlpha(0.08).setDepth(1);

    this.input.on('pointerdown', this.tap, this);
    this.input.keyboard?.on('keydown-SPACE', this.tap, this);
  }

  tap() {
    if (!this.gameActive) return;
    this.player.gravity = -this.player.gravity;
    this.player.vy *= 0.2;
  }

  spawnPipe() {
    const gap = Math.max(110, this.gapSize - this.pipeCount * 1.2);
    const gapY = 80 + Math.random() * (this.H - 160 - gap);
    this.pipes.push({ x: this.W + 30, gapY, gap, width: 42, scored: false });
    this.pipeCount++;
  }

  die() {
    if (!this.gameActive) return;
    this.gameActive = false;
    this.cameras.main.shake(220, 0.012);
    const best = Math.max(this.score, parseInt(localStorage.getItem('gravity_flip_best') || '0'));
    localStorage.setItem('gravity_flip_best', best);
    this.time.delayedCall(750, () => {
      this.scene.start('GameOverScene', { score: this.score, best });
    });
  }

  update(time, delta) {
    const dt = delta / 1000;

    if (this.gameActive) {
      if (time - this.lastPipe > this.pipeInterval) {
        this.spawnPipe();
        this.lastPipe = time;
        this.pipeInterval = Math.max(1050, this.pipeInterval - 18);
        this.pipeSpeed = Math.min(340, this.pipeSpeed + 4);
      }

      this.player.vy += this.player.gravity * dt;
      this.player.vy = Math.max(-500, Math.min(500, this.player.vy));
      this.player.y += this.player.vy * dt;

      for (const p of this.pipes) {
        p.x -= this.pipeSpeed * dt;
        if (!p.scored && p.x + p.width < this.player.x) {
          p.scored = true;
          this.score++;
          this.scoreTxt.setText(this.score);
        }
      }
      this.pipes = this.pipes.filter(p => p.x > -60);

      if (this.player.y < 6 || this.player.y > this.H - 6) { this.die(); return; }

      const r = 9;
      for (const p of this.pipes) {
        if (this.player.x + r > p.x && this.player.x - r < p.x + p.width) {
          if (this.player.y - r < p.gapY || this.player.y + r > p.gapY + p.gap) {
            this.die(); return;
          }
        }
      }
    }

    this.gfx.clear();

    for (const p of this.pipes) {
      this.gfx.fillStyle(0x0d2035, 1);
      this.gfx.fillRect(p.x, 0, p.width, p.gapY);
      this.gfx.fillRect(p.x, p.gapY + p.gap, p.width, this.H - p.gapY - p.gap);
      this.gfx.fillStyle(0x1a4a7a, 1);
      this.gfx.fillRect(p.x - 2, p.gapY - 10, p.width + 4, 10);
      this.gfx.fillRect(p.x - 2, p.gapY + p.gap, p.width + 4, 10);
    }

    const py = this.player.y;
    this.gfx.fillStyle(0x00cfff, 1);
    this.gfx.fillCircle(this.player.x, py, 10);
    this.gfx.fillStyle(0xffffff, 0.55);
    this.gfx.fillCircle(this.player.x - 3, py - 3, 3);

    const arrowDir = this.player.gravity > 0 ? 1 : -1;
    this.gfx.lineStyle(2, 0x00cfff, 0.4);
    this.gfx.lineBetween(this.player.x, py + arrowDir * 14, this.player.x, py + arrowDir * 24);
  }
}
