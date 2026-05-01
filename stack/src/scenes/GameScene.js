class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.W = 400; this.H = 700;
    this.BLOCK_H = 28;
    this.DX = 10; this.DY = 8; // 3D depth
    this.BASE_Y = this.H - 100;
    this.INIT_WIDTH = 180;

    this.items = { slowLeft: 0, bigZoneLeft: 0, shield: false, magnetLeft: 0, doubleLeft: 0, ghostLeft: 0 };

    const iw = this.INIT_WIDTH;
    this.stack = [{ x: (this.W - iw) / 2, width: iw, level: 0, color: this.getColor(0) }];

    this.score = 0;
    this.blockCount = 0;
    this.cameraOffset = 0;
    this.gameActive = true;
    this.selectingItem = false;
    this.perfectStreak = 0;
    this.blockSpeed = 200;
    this.particles = [];
    this.cutPieces = [];
    this.pulseT = 0;
    this.itemOverlay = null;

    this.movingBlock = { x: -iw - 20, width: iw, dir: 1 };

    // Static stars
    this.starGfx = this.add.graphics().setDepth(0);
    this.starData = Array.from({ length: 60 }, () => ({
      x: Math.random() * this.W, y: Math.random() * this.H,
      r: Math.random() * 1.2 + 0.2, a: Math.random() * 0.3 + 0.05
    }));
    this.redrawStars();

    this.gfx = this.add.graphics().setDepth(5);

    this.scoreTxt = this.add.text(this.W / 2, 90, '0', {
      fontSize: '120px', fontFamily: 'Arial Black, Arial', color: '#ffffff'
    }).setOrigin(0.5).setAlpha(0.07).setDepth(1);

    this.feedbackTxt = this.add.text(this.W / 2, this.H * 0.42, '', {
      fontSize: '20px', fontFamily: 'Arial Black, Arial', color: '#00ffff'
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    this.itemBarTxt = this.add.text(this.W / 2, this.H - 32, '', {
      fontSize: '11px', fontFamily: 'Arial', color: '#556677', letterSpacing: 2
    }).setOrigin(0.5).setDepth(10);

    this.shieldTxt = this.add.text(this.W / 2, this.H - 52, '', {
      fontSize: '11px', fontFamily: 'Arial', color: '#a29bfe', letterSpacing: 3
    }).setOrigin(0.5).setDepth(10);

    this.milestoneTxt = this.add.text(this.W - 20, this.H - 20, 'ITEM @10', {
      fontSize: '10px', fontFamily: 'Arial', color: '#1a2a3a', letterSpacing: 1
    }).setOrigin(1, 1).setDepth(10);

    this.input.on('pointerdown', this.onTap, this);
    this.input.keyboard?.on('keydown-SPACE', this.onTap, this);
  }

  getColor(level) {
    const hue = (200 + level * 10) % 360;
    return Phaser.Display.Color.HSLToColor(hue / 360, 0.72, 0.58).color;
  }

  lighten(color, amt = 45) {
    const r = (color >> 16) & 0xff, g = (color >> 8) & 0xff, b = color & 0xff;
    return Phaser.Display.Color.GetColor(
      Math.min(255, r + amt), Math.min(255, g + amt), Math.min(255, b + amt)
    );
  }

  darken(color, amt = 65) {
    const r = (color >> 16) & 0xff, g = (color >> 8) & 0xff, b = color & 0xff;
    return Phaser.Display.Color.GetColor(
      Math.max(0, r - amt), Math.max(0, g - amt), Math.max(0, b - amt)
    );
  }

  blockScreenY(level) {
    return this.BASE_Y - (level - this.cameraOffset) * this.BLOCK_H;
  }

  redrawStars() {
    this.starGfx.clear();
    for (const s of this.starData) {
      this.starGfx.fillStyle(0xffffff, s.a);
      this.starGfx.fillCircle(s.x, s.y, s.r);
    }
  }

  draw3DBlock(x, y, width, color, alpha = 1) {
    const H = this.BLOCK_H - 2;
    const DX = this.DX, DY = this.DY;

    // Front face
    this.gfx.fillStyle(color, alpha);
    this.gfx.fillRect(x, y, width, H);

    // Top face
    this.gfx.fillStyle(this.lighten(color, 50), alpha);
    this.gfx.fillPoints([
      { x, y }, { x: x + width, y },
      { x: x + width + DX, y: y - DY }, { x: x + DX, y: y - DY }
    ], true);

    // Right side
    this.gfx.fillStyle(this.darken(color, 65), alpha);
    this.gfx.fillPoints([
      { x: x + width, y }, { x: x + width + DX, y: y - DY },
      { x: x + width + DX, y: y - DY + H }, { x: x + width, y: y + H }
    ], true);

    // Front highlight
    this.gfx.fillStyle(0xffffff, 0.12 * alpha);
    this.gfx.fillRect(x, y, width, 3);
  }

  onTap() {
    if (!this.gameActive || this.selectingItem) return;
    this.placeBlock();
  }

  placeBlock() {
    const top = this.stack[this.stack.length - 1];
    const cur = this.movingBlock;
    const left = Math.max(cur.x, top.x);
    const right = Math.min(cur.x + cur.width, top.x + top.width);
    const overlap = right - left;

    if (overlap <= 2) {
      if (this.items.shield) {
        this.items.shield = false;
        this.updateItemBar();
        this.showFeedback('SHIELD!', '#a29bfe');
        this.movingBlock.dir = -this.movingBlock.dir;
        return;
      }
      this.gameActive = false;
      this.cutPieces.push({
        x: cur.x, y: this.blockScreenY(top.level + 1),
        width: cur.width, color: this.getColor(top.level + 1),
        vy: 2, vx: 0, alpha: 1, rot: 0, rotSpd: (Math.random() - 0.5) * 0.2
      });
      this.cameras.main.shake(260, 0.013);
      this.time.delayedCall(900, () => {
        const best = Math.max(this.score, parseInt(localStorage.getItem('stack_best') || '0'));
        localStorage.setItem('stack_best', best);
        this.scene.start('GameOverScene', { score: this.score, best });
      });
      return;
    }

    const threshold = this.items.bigZoneLeft > 0 ? 20 : 8;
    const isPerfect = Math.abs(cur.x - top.x) < threshold;
    const useMagnet = this.items.magnetLeft > 0 && !isPerfect;
    const snap = isPerfect || useMagnet;
    const newX = snap ? top.x : left;
    const newWidth = snap ? top.width : Math.round(overlap);

    if (useMagnet) {
      this.items.magnetLeft--;
      this.showFeedback('MAGNET!', '#ff9f43');
    } else if (isPerfect) {
      this.perfectStreak++;
      const msg = this.perfectStreak >= 3 ? 'PERFECT x' + this.perfectStreak : 'PERFECT';
      this.showFeedback(msg, '#00ffff');
      this.spawnParticles(newX + newWidth / 2, this.blockScreenY(top.level + 1), this.getColor(top.level + 1));
    } else {
      this.perfectStreak = 0;
      const leftCut = cur.x < top.x;
      const cutX = leftCut ? cur.x : newX + newWidth;
      this.cutPieces.push({
        x: cutX, y: this.blockScreenY(top.level + 1),
        width: cur.width - Math.round(overlap), color: this.getColor(top.level + 1),
        vy: -2, vx: leftCut ? -4 : 4, alpha: 1,
        rot: 0, rotSpd: (Math.random() - 0.5) * 0.18
      });
    }

    const newLevel = top.level + 1;
    this.stack.push({ x: newX, width: newWidth, level: newLevel, color: this.getColor(newLevel) });

    const pts = this.items.doubleLeft > 0 ? 2 : 1;
    this.score += pts;
    this.blockCount++;
    this.scoreTxt.setText(this.score);

    if (this.items.slowLeft > 0) this.items.slowLeft--;
    if (this.items.bigZoneLeft > 0) this.items.bigZoneLeft--;
    if (this.items.doubleLeft > 0) this.items.doubleLeft--;
    if (this.items.ghostLeft > 0) this.items.ghostLeft--;
    this.updateItemBar();

    const targetOffset = Math.max(0, newLevel - 8);
    if (targetOffset > this.cameraOffset) {
      this.tweens.add({ targets: this, cameraOffset: targetOffset, duration: 160, ease: 'Power2' });
    }

    const base = Math.min(200 + this.blockCount * 4, 520);
    this.blockSpeed = this.items.slowLeft > 0 ? base * 0.5 : base;

    const goRight = this.movingBlock.dir < 0;
    this.movingBlock = { x: goRight ? -newWidth - 20 : this.W + 20, width: newWidth, dir: goRight ? 1 : -1 };

    // Background color shift
    const bgHue = (220 + this.blockCount * 3) % 360;
    this.cameras.main.setBackgroundColor(
      Phaser.Display.Color.HSLToColor(bgHue / 360, 0.55, 0.04).color
    );

    // Item milestone every 10 blocks
    if (this.blockCount > 0 && this.blockCount % 10 === 0) {
      this.time.delayedCall(200, () => this.showItemSelection());
    } else {
      const next = (Math.floor(this.blockCount / 10) + 1) * 10;
      this.milestoneTxt.setText('ITEM @' + next);
    }
  }

  spawnParticles(cx, cy, color) {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const spd = 3 + Math.random() * 4;
      this.particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd - 1,
        r: 2 + Math.random() * 3, color, alpha: 1
      });
    }
  }

  showFeedback(text, color) {
    this.feedbackTxt.setText(text).setColor(color).setAlpha(1).setY(this.H * 0.42);
    this.tweens.killTweensOf(this.feedbackTxt);
    this.tweens.add({ targets: this.feedbackTxt, alpha: 0, y: this.H * 0.34, duration: 1000, ease: 'Power2' });
  }

  updateItemBar() {
    const parts = [];
    if (this.items.slowLeft > 0) parts.push('SLOW ' + this.items.slowLeft);
    if (this.items.bigZoneLeft > 0) parts.push('ZONE ' + this.items.bigZoneLeft);
    if (this.items.doubleLeft > 0) parts.push('x2 ' + this.items.doubleLeft);
    if (this.items.ghostLeft > 0) parts.push('GHOST ' + this.items.ghostLeft);
    if (this.items.magnetLeft > 0) parts.push('MAG ' + this.items.magnetLeft);
    this.itemBarTxt.setText(parts.join('  ·  '));
    this.shieldTxt.setText(this.items.shield ? '[ SHIELD ACTIVE ]' : '');
  }

  showItemSelection() {
    if (!this.gameActive) return;
    this.selectingItem = true;

    const POOL = [
      { id: 'wide',    name: 'WIDE BLOCK',   desc: '블록 너비 +30% 즉시 회복', color: 0x4ecdc4 },
      { id: 'restore', name: 'RESTORE',      desc: '블록 너비 초기화',          color: 0xe17055 },
      { id: 'slow',    name: 'SLOW MOTION',  desc: '이동속도 50% · 8블록',      color: 0x45b7d1 },
      { id: 'zone',    name: 'BIG ZONE',     desc: 'Perfect 범위 2배 · 5블록',  color: 0xffd32a },
      { id: 'shield',  name: 'SHIELD',       desc: '미스 1회 자동 방어',        color: 0xa29bfe },
      { id: 'magnet',  name: 'MAGNET',       desc: '자동 스냅 3회',             color: 0xff9f43 },
      { id: 'double',  name: 'DOUBLE SCORE', desc: '점수 2배 · 5블록',          color: 0xff6b9d },
      { id: 'ghost',   name: 'GHOST',        desc: '착지 위치 미리보기 · 5블록', color: 0x00b894 },
    ];

    const picks = POOL.sort(() => Math.random() - 0.5).slice(0, 3);
    this.itemOverlay = this.add.container(0, 0).setDepth(20);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.78);
    bg.fillRect(0, 0, this.W, this.H);
    this.itemOverlay.add(bg);

    this.itemOverlay.add(
      this.add.text(this.W / 2, 190, 'CHOOSE ITEM', {
        fontSize: '15px', fontFamily: 'Arial Black, Arial', color: '#ffffff', letterSpacing: 7
      }).setOrigin(0.5)
    );
    this.itemOverlay.add(
      this.add.text(this.W / 2, 213, 'BLOCK ' + this.blockCount, {
        fontSize: '11px', fontFamily: 'Arial', color: '#334455', letterSpacing: 3
      }).setOrigin(0.5)
    );

    const CW = 300, CH = 72, startY = 268, gap = 84;

    picks.forEach((item, i) => {
      const cx = (this.W - CW) / 2, cy = startY + i * gap;

      const cg = this.add.graphics();
      const drawCard = (hover) => {
        cg.clear();
        cg.fillStyle(hover ? 0x0f2035 : 0x0a1525, hover ? 1 : 0.95);
        cg.fillRoundedRect(cx, cy, CW, CH, 10);
        cg.lineStyle(2, item.color, hover ? 1 : 0.55);
        cg.strokeRoundedRect(cx, cy, CW, CH, 10);
        cg.fillStyle(item.color, 1);
        cg.fillRoundedRect(cx, cy + 1, 6, CH - 2, { tl: 10, bl: 10, tr: 0, br: 0 });
      };
      drawCard(false);
      this.itemOverlay.add(cg);

      this.itemOverlay.add(
        this.add.text(cx + 22, cy + 16, item.name, {
          fontSize: '15px', fontFamily: 'Arial Black, Arial', color: '#ffffff'
        })
      );
      this.itemOverlay.add(
        this.add.text(cx + 22, cy + 38, item.desc, {
          fontSize: '12px', fontFamily: 'Arial', color: '#556677'
        })
      );

      const zone = this.add.zone(cx + CW / 2, cy + CH / 2, CW, CH).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => drawCard(true));
      zone.on('pointerout', () => drawCard(false));
      zone.on('pointerdown', () => this.selectItem(item.id));
      this.itemOverlay.add(zone);
    });

    this.itemOverlay.setAlpha(0);
    this.tweens.add({ targets: this.itemOverlay, alpha: 1, duration: 220 });
  }

  selectItem(id) {
    const top = this.stack[this.stack.length - 1];
    switch (id) {
      case 'wide':
        top.width = Math.min(this.INIT_WIDTH, Math.round(top.width * 1.3));
        this.movingBlock.width = top.width;
        break;
      case 'restore':
        top.width = this.INIT_WIDTH;
        this.movingBlock.width = this.INIT_WIDTH;
        break;
      case 'slow':   this.items.slowLeft = 8; break;
      case 'zone':   this.items.bigZoneLeft = 5; break;
      case 'shield': this.items.shield = true; break;
      case 'magnet': this.items.magnetLeft = 3; break;
      case 'double': this.items.doubleLeft = 5; break;
      case 'ghost':  this.items.ghostLeft = 5; break;
    }
    this.updateItemBar();
    const next = (Math.floor(this.blockCount / 10) + 1) * 10;
    this.milestoneTxt.setText('ITEM @' + next);

    this.tweens.add({
      targets: this.itemOverlay, alpha: 0, duration: 200,
      onComplete: () => {
        if (this.itemOverlay) { this.itemOverlay.destroy(true); this.itemOverlay = null; }
        this.selectingItem = false;
      }
    });
  }

  update(time, delta) {
    const dt = delta / 1000;
    this.pulseT += dt;

    if (this.gameActive && !this.selectingItem) {
      this.movingBlock.x += this.blockSpeed * this.movingBlock.dir * dt;
      if (this.movingBlock.x > this.W + 20) this.movingBlock.dir = -1;
      if (this.movingBlock.x < -this.movingBlock.width - 20) this.movingBlock.dir = 1;
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.alpha -= 0.038;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.cutPieces.length - 1; i >= 0; i--) {
      const p = this.cutPieces[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.42; p.rot += p.rotSpd; p.alpha -= 0.022;
      if (p.alpha <= 0) this.cutPieces.splice(i, 1);
    }

    this.gfx.clear();

    // Placed blocks (3D)
    for (const block of this.stack) {
      const y = this.blockScreenY(block.level);
      if (y < -this.BLOCK_H - this.DY || y > this.H + 10) continue;
      this.draw3DBlock(block.x, y, block.width, block.color);
    }

    if (this.gameActive && this.stack.length > 0) {
      const top = this.stack[this.stack.length - 1];
      const movY = this.blockScreenY(top.level + 1);
      const mb = this.movingBlock;
      const mbColor = this.getColor(top.level + 1);

      // Ghost preview
      if (this.items.ghostLeft > 0) {
        this.gfx.lineStyle(2, 0xffffff, 0.18);
        this.gfx.strokeRect(top.x, movY, top.width, this.BLOCK_H - 2);
        this.gfx.lineStyle(1, 0xffffff, 0.08);
        this.gfx.strokeRect(top.x + this.DX, movY - this.DY, top.width, this.BLOCK_H - 2);
      }

      // Slow motion glow
      if (this.items.slowLeft > 0) {
        const gAlpha = 0.07 + 0.04 * Math.sin(this.pulseT * 5);
        this.gfx.fillStyle(mbColor, gAlpha);
        this.gfx.fillRect(mb.x - 8, movY - 8, mb.width + 16, this.BLOCK_H + 14);
      }

      // Guide outline
      this.gfx.lineStyle(1, 0xffffff, 0.06);
      this.gfx.strokeRect(top.x, movY, top.width, this.BLOCK_H - 2);

      // Moving block (3D)
      this.draw3DBlock(mb.x, movY, mb.width, mbColor);
    }

    // Particles
    for (const p of this.particles) {
      this.gfx.fillStyle(p.color, Math.max(0, p.alpha));
      this.gfx.fillCircle(p.x, p.y, p.r);
    }

    // Cut pieces (with rotation via canvas transform)
    for (const cp of this.cutPieces) {
      if (cp.alpha <= 0) continue;
      const cx = cp.x + cp.width / 2;
      const cy = cp.y + (this.BLOCK_H - 2) / 2;
      this.gfx.save();
      this.gfx.translateCanvas(cx, cy);
      this.gfx.rotateCanvas(cp.rot);
      this.gfx.fillStyle(cp.color, Math.max(0, cp.alpha));
      this.gfx.fillRect(-cp.width / 2, -(this.BLOCK_H - 2) / 2, cp.width, this.BLOCK_H - 2);
      this.gfx.restore();
    }

    // Shield pulse ring around top block
    if (this.items.shield && this.stack.length > 0) {
      const top = this.stack[this.stack.length - 1];
      const ty = this.blockScreenY(top.level);
      const pulse = 0.4 + 0.3 * Math.sin(this.pulseT * 4);
      this.gfx.lineStyle(2, 0xa29bfe, pulse);
      this.gfx.strokeRect(top.x - 5, ty - 5, top.width + 10 + this.DX, this.BLOCK_H + 10);
    }
  }
}
