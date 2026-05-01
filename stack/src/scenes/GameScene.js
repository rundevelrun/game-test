class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const W = 400, H = 700;
    this.W = W;
    this.H = H;

    this.BLOCK_H = 28;
    this.BASE_Y = H - 90;  // screen Y of level-0 block top

    this.COLORS = [
      0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xffeaa7,
      0xff6b9d, 0xa29bfe, 0xfd79a8, 0x00b894,
      0x6c5ce7, 0x00cec9, 0xe17055, 0x74b9ff,
      0x55efc4, 0xfdcb6e, 0xe84393, 0x0984e3
    ];

    const initWidth = 180;
    this.stack = [{
      x: (W - initWidth) / 2,
      width: initWidth,
      level: 0,
      color: 0x2a3a50
    }];

    this.score = 0;
    this.cameraOffset = 0;
    this.gameActive = true;
    this.perfectStreak = 0;
    this.blockSpeed = 200;
    this.movingDir = 1;

    this.movingBlock = {
      x: -initWidth - 20,
      width: initWidth,
      color: this.COLORS[0],
      dir: 1
    };

    this.cutPieces = [];

    // Stars background
    const starGfx = this.add.graphics().setDepth(0);
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = Math.random() * 1.2 + 0.2;
      const a = Math.random() * 0.3 + 0.05;
      starGfx.fillStyle(0xffffff, a);
      starGfx.fillCircle(x, y, r);
    }

    this.gfx = this.add.graphics().setDepth(5);

    // Score display (large faint background)
    this.scoreTxt = this.add.text(W / 2, 90, '0', {
      fontSize: '120px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setAlpha(0.07).setDepth(1);

    // Feedback text
    this.feedbackTxt = this.add.text(W / 2, H * 0.45, '', {
      fontSize: '20px',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      color: '#00ffff'
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    // Guide line label
    this.guideTxt = this.add.text(W / 2, H * 0.15, 'TAP', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#223344',
      letterSpacing: 4
    }).setOrigin(0.5).setDepth(10);

    this.tweens.add({
      targets: this.guideTxt,
      alpha: 0.15,
      duration: 700,
      yoyo: true,
      repeat: -1
    });

    this.input.on('pointerdown', this.onTap, this);
    this.input.keyboard?.on('keydown-SPACE', this.onTap, this);
  }

  getColor(level) {
    return this.COLORS[level % this.COLORS.length];
  }

  blockScreenY(level) {
    return this.BASE_Y - (level - this.cameraOffset) * this.BLOCK_H;
  }

  onTap() {
    if (!this.gameActive) return;
    this.placeBlock();
  }

  placeBlock() {
    const top = this.stack[this.stack.length - 1];
    const cur = this.movingBlock;

    const left = Math.max(cur.x, top.x);
    const right = Math.min(cur.x + cur.width, top.x + top.width);
    const overlap = right - left;

    if (overlap <= 2) {
      this.gameActive = false;
      // Drop the missed block
      this.cutPieces.push({
        x: cur.x, y: this.blockScreenY(top.level + 1),
        width: cur.width, color: cur.color,
        vy: 2, vx: 0, alpha: 1
      });
      this.cameras.main.shake(250, 0.012);
      this.time.delayedCall(900, () => {
        const best = Math.max(this.score, parseInt(localStorage.getItem('stack_best') || '0'));
        localStorage.setItem('stack_best', best);
        this.scene.start('GameOverScene', { score: this.score, best });
      });
      return;
    }

    const PERFECT_THRESHOLD = 8;
    const isPerfect = Math.abs(cur.x - top.x) < PERFECT_THRESHOLD;
    const newX = isPerfect ? top.x : left;
    const newWidth = isPerfect ? top.width : Math.round(overlap);

    if (isPerfect) {
      this.perfectStreak++;
      const msg = this.perfectStreak >= 3
        ? 'PERFECT x' + this.perfectStreak
        : 'PERFECT';
      this.showFeedback(msg, '#00ffff');
    } else {
      this.perfectStreak = 0;
      // Cut piece falls away
      const cutOnLeft = cur.x < top.x;
      const cutX = cutOnLeft ? cur.x : (newX + newWidth);
      const cutWidth = cur.width - Math.round(overlap);
      this.cutPieces.push({
        x: cutX,
        y: this.blockScreenY(top.level + 1),
        width: cutWidth,
        color: cur.color,
        vy: -1,
        vx: cutOnLeft ? -3 : 3,
        alpha: 1
      });
    }

    const newLevel = top.level + 1;
    this.stack.push({
      x: newX,
      width: newWidth,
      level: newLevel,
      color: this.getColor(newLevel)
    });

    this.score++;
    this.scoreTxt.setText(this.score);

    // Camera scroll
    const targetOffset = Math.max(0, newLevel - 8);
    if (targetOffset > this.cameraOffset) {
      this.tweens.add({
        targets: this,
        cameraOffset: targetOffset,
        duration: 160,
        ease: 'Power2'
      });
    }

    // Speed up (cap at 520)
    this.blockSpeed = Math.min(200 + this.score * 5, 520);

    // New moving block from opposite side
    const goRight = this.movingBlock.dir < 0;
    this.movingBlock = {
      x: goRight ? -newWidth - 20 : this.W + 20,
      width: newWidth,
      color: this.getColor(newLevel + 1),
      dir: goRight ? 1 : -1
    };
  }

  showFeedback(text, color) {
    this.feedbackTxt.setText(text).setColor(color).setAlpha(1).setY(this.H * 0.45);
    this.tweens.killTweensOf(this.feedbackTxt);
    this.tweens.add({
      targets: this.feedbackTxt,
      alpha: 0,
      y: this.H * 0.38,
      duration: 1000,
      ease: 'Power2'
    });
  }

  update(time, delta) {
    const dt = delta / 1000;

    if (this.gameActive) {
      this.movingBlock.x += this.blockSpeed * this.movingBlock.dir * dt;
      if (this.movingBlock.x > this.W + 20) this.movingBlock.dir = -1;
      if (this.movingBlock.x < -this.movingBlock.width - 20) this.movingBlock.dir = 1;
    }

    // Update cut pieces
    for (let i = this.cutPieces.length - 1; i >= 0; i--) {
      const p = this.cutPieces[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4;
      p.alpha -= 0.022;
      if (p.alpha <= 0) this.cutPieces.splice(i, 1);
    }

    this.gfx.clear();

    // Draw placed blocks
    for (const block of this.stack) {
      const y = this.blockScreenY(block.level);
      if (y < -this.BLOCK_H || y > this.H + 10) continue;

      this.gfx.fillStyle(block.color, 1);
      this.gfx.fillRect(block.x, y, block.width, this.BLOCK_H - 2);
      this.gfx.fillStyle(0xffffff, 0.18);
      this.gfx.fillRect(block.x, y, block.width, 3);
      this.gfx.fillStyle(0x000000, 0.25);
      this.gfx.fillRect(block.x, y + this.BLOCK_H - 4, block.width, 2);
    }

    // Guide rect on top block (shows perfect zone)
    if (this.gameActive && this.stack.length > 0) {
      const top = this.stack[this.stack.length - 1];
      const movY = this.blockScreenY(top.level + 1);

      // Subtle guide outline
      this.gfx.lineStyle(1, 0xffffff, 0.06);
      this.gfx.strokeRect(top.x, movY, top.width, this.BLOCK_H - 2);

      // Moving block
      const mb = this.movingBlock;
      this.gfx.fillStyle(mb.color, 1);
      this.gfx.fillRect(mb.x, movY, mb.width, this.BLOCK_H - 2);
      this.gfx.fillStyle(0xffffff, 0.18);
      this.gfx.fillRect(mb.x, movY, mb.width, 3);
    }

    // Draw cut pieces
    for (const p of this.cutPieces) {
      this.gfx.fillStyle(p.color, Math.max(0, p.alpha));
      this.gfx.fillRect(p.x, p.y, p.width, this.BLOCK_H - 2);
    }
  }
}
