class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.W = 400; this.H = 700;
    this.CX = 200; this.CY = 350;

    this.enemies = [];
    this.spawnInterval = 1200;
    this.enemySpeed = 62;
    this.lives = 3;
    this.score = 0;
    this.kills = 0;
    this.gameActive = true;
    this.activeLaser = null;
    this.laserTimer = 0;
    this.pulseT = 0;

    this.ENEMY_COLORS = [0xff6b6b, 0xff9f43, 0xffd32a, 0xa29bfe, 0xff6b9d, 0x00b894, 0x74b9ff];

    const sg = this.add.graphics().setDepth(0);
    for (let i = 0; i < 60; i++) {
      sg.fillStyle(0xffffff, Math.random() * 0.28 + 0.04);
      sg.fillCircle(Math.random() * this.W, Math.random() * this.H, Math.random() * 1.2 + 0.2);
    }

    this.gfx = this.add.graphics().setDepth(5);

    this.scoreTxt = this.add.text(this.CX, 80, '0', {
      fontSize: '100px', fontFamily: 'Arial Black, Arial', color: '#ffffff'
    }).setOrigin(0.5).setAlpha(0.08).setDepth(1);

    this.multiTxt = this.add.text(this.CX, this.CY - 80, '', {
      fontSize: '20px', fontFamily: 'Arial Black, Arial', color: '#00ffff'
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    this.spawnTimer = this.time.addEvent({
      delay: this.spawnInterval, callback: this.spawnEnemy, callbackScope: this, loop: true
    });

    this.input.on('pointerdown', this.onTap, this);
    this.input.keyboard?.on('keydown-UP', () => this.fireDir('up'), this);
    this.input.keyboard?.on('keydown-DOWN', () => this.fireDir('down'), this);
    this.input.keyboard?.on('keydown-LEFT', () => this.fireDir('left'), this);
    this.input.keyboard?.on('keydown-RIGHT', () => this.fireDir('right'), this);
  }

  spawnEnemy() {
    if (!this.gameActive) return;
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = Math.random() * this.W; y = -20; }
    else if (side === 1) { x = this.W + 20; y = Math.random() * this.H; }
    else if (side === 2) { x = Math.random() * this.W; y = this.H + 20; }
    else { x = -20; y = Math.random() * this.H; }
    this.enemies.push({
      x, y,
      color: this.ENEMY_COLORS[Math.floor(Math.random() * this.ENEMY_COLORS.length)],
      size: 22
    });
  }

  onTap(ptr) {
    if (!this.gameActive) return;
    const dx = ptr.x - this.CX;
    const dy = ptr.y - this.CY;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.fireDir(dx > 0 ? 'right' : 'left');
    } else {
      this.fireDir(dy > 0 ? 'down' : 'up');
    }
  }

  fireDir(dir) {
    if (!this.gameActive) return;
    this.activeLaser = dir;
    this.laserTimer = 160;

    let killed = 0;
    this.enemies = this.enemies.filter(e => {
      let hit = false;
      const hs = e.size / 2;
      if (dir === 'up' && Math.abs(e.x - this.CX) < 20 + hs && e.y < this.CY) hit = true;
      if (dir === 'down' && Math.abs(e.x - this.CX) < 20 + hs && e.y > this.CY) hit = true;
      if (dir === 'left' && Math.abs(e.y - this.CY) < 20 + hs && e.x < this.CX) hit = true;
      if (dir === 'right' && Math.abs(e.y - this.CY) < 20 + hs && e.x > this.CX) hit = true;
      if (hit) killed++;
      return !hit;
    });

    if (killed > 0) {
      this.score += killed;
      this.kills += killed;
      this.scoreTxt.setText(this.score);

      if (killed >= 2) {
        this.multiTxt.setText('MULTI x' + killed).setAlpha(1);
        this.tweens.killTweensOf(this.multiTxt);
        this.tweens.add({ targets: this.multiTxt, alpha: 0, y: this.CY - 110, duration: 900,
          onComplete: () => { this.multiTxt.y = this.CY - 80; } });
      }

      if (this.kills % 10 === 0) {
        this.enemySpeed = Math.min(140, this.enemySpeed + 8);
        this.spawnInterval = Math.max(500, this.spawnInterval - 80);
        this.spawnTimer.reset({ delay: this.spawnInterval, callback: this.spawnEnemy, callbackScope: this, loop: true });
      }
    }
  }

  die() {
    if (!this.gameActive) return;
    this.gameActive = false;
    this.cameras.main.shake(250, 0.013);
    const best = Math.max(this.score, parseInt(localStorage.getItem('signal_best') || '0'));
    localStorage.setItem('signal_best', best);
    this.time.delayedCall(800, () => {
      this.scene.start('GameOverScene', { score: this.score, best });
    });
  }

  update(time, delta) {
    const dt = delta / 1000;
    this.pulseT += dt;
    if (this.laserTimer > 0) this.laserTimer -= delta;

    if (this.gameActive) {
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        const angle = Math.atan2(this.CY - e.y, this.CX - e.x);
        e.x += Math.cos(angle) * this.enemySpeed * dt;
        e.y += Math.sin(angle) * this.enemySpeed * dt;
        const dist = Math.hypot(e.x - this.CX, e.y - this.CY);
        if (dist < 28) {
          this.enemies.splice(i, 1);
          this.lives--;
          this.cameras.main.shake(120, 0.008);
          if (this.lives <= 0) { this.die(); return; }
        }
      }
    }

    this.gfx.clear();

    // Danger zone
    const pulse = 0.04 + 0.02 * Math.sin(this.pulseT * 4);
    this.gfx.lineStyle(1, 0x334466, pulse);
    this.gfx.strokeCircle(this.CX, this.CY, 28);

    // Laser
    if (this.activeLaser && this.laserTimer > 0) {
      const a = this.laserTimer / 160;
      this.gfx.lineStyle(3, 0x00cfff, a * 0.9);
      if (this.activeLaser === 'up') this.gfx.lineBetween(this.CX, this.CY, this.CX, 0);
      else if (this.activeLaser === 'down') this.gfx.lineBetween(this.CX, this.CY, this.CX, this.H);
      else if (this.activeLaser === 'left') this.gfx.lineBetween(this.CX, this.CY, 0, this.CY);
      else this.gfx.lineBetween(this.CX, this.CY, this.W, this.CY);

      this.gfx.lineStyle(12, 0x00cfff, a * 0.12);
      if (this.activeLaser === 'up') this.gfx.lineBetween(this.CX, this.CY, this.CX, 0);
      else if (this.activeLaser === 'down') this.gfx.lineBetween(this.CX, this.CY, this.CX, this.H);
      else if (this.activeLaser === 'left') this.gfx.lineBetween(this.CX, this.CY, 0, this.CY);
      else this.gfx.lineBetween(this.CX, this.CY, this.W, this.CY);
    }

    // Direction hint arrows
    const dirs = [
      { x: this.CX, y: 30, label: '^' }, { x: this.CX, y: this.H - 30, label: 'v' },
      { x: 22, y: this.CY, label: '<' }, { x: this.W - 22, y: this.CY, label: '>' }
    ];
    for (const d of dirs) {
      this.gfx.fillStyle(0x223344, 0.5);
      this.gfx.fillCircle(d.x, d.y, 14);
    }

    // Enemies
    for (const e of this.enemies) {
      this.gfx.fillStyle(e.color, 0.9);
      this.gfx.fillRect(e.x - e.size / 2, e.y - e.size / 2, e.size, e.size);
      this.gfx.lineStyle(1, e.color, 0.4);
      this.gfx.strokeRect(e.x - e.size / 2 - 3, e.y - e.size / 2 - 3, e.size + 6, e.size + 6);
    }

    // Player
    const glowR = 14 + 2 * Math.sin(this.pulseT * 3);
    this.gfx.fillStyle(0xffffff, 0.12);
    this.gfx.fillCircle(this.CX, this.CY, glowR + 6);
    this.gfx.fillStyle(0x00cfff, 0.35);
    this.gfx.fillCircle(this.CX, this.CY, glowR);
    this.gfx.fillStyle(0xffffff, 1);
    this.gfx.fillCircle(this.CX, this.CY, 10);

    // Lives
    for (let i = 0; i < 3; i++) {
      const lx = this.CX - 24 + i * 24;
      this.gfx.fillStyle(i < this.lives ? 0x00cfff : 0x1a2a3a, 1);
      this.gfx.fillCircle(lx, this.H - 50, 7);
    }
  }
}
