class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.W = 400; this.H = 700;
    this.BLOCK_H = 30;
    this.DX = 16; this.DY = 14;
    this.INIT_WIDTH = 180;

    // Slots at top — below score, above gameplay
    this.SLOT = { W: 88, H: 50, GAP: 8, Y: 148 };
    this.SLOT.startX = (this.W - (3 * this.SLOT.W + 2 * this.SLOT.GAP)) / 2;
    this.BASE_Y = this.H - 100; // stack base at bottom

    this.ITEM_DEFS = {
      wide:    { name: 'WIDE',  abbr: 'WD', color: 0x4ecdc4, desc: '너비 +35%' },
      restore: { name: 'RESET', abbr: 'RS', color: 0xe17055, desc: '너비 초기화' },
      slow:    { name: 'SLOW',  abbr: 'SL', color: 0x45b7d1, desc: '속도 50% · 8블록' },
      x5:      { name: 'X5',    abbr: 'X5', color: 0xffd32a, desc: '다음 탭 5블록 한번에' },
    };
    this.ITEM_IDS = Object.keys(this.ITEM_DEFS);

    this.itemSlots = [null, null, null];
    this.fx = { slowLeft: 0 };
    this.x5Active = false;
    this.x5Running = false;

    const iw = this.INIT_WIDTH;
    this.stack = [{ x: (this.W - iw) / 2, width: iw, level: 0, color: this.getColor(0) }];
    this.movingBlock = { x: -iw - 20, width: iw, dir: 1 };

    this.score = 0;
    this.blockCount = 0;
    this.cameraOffset = 0;
    this.gameActive = true;
    this.perfectStreak = 0;
    this.blockSpeed = 200;
    this.pulseT = 0;
    this.particles = [];
    this.cutPieces = [];

    // Stars
    this.starGfx = this.add.graphics().setDepth(0);
    this.starData = Array.from({ length: 60 }, () => ({
      x: Math.random() * this.W, y: Math.random() * this.H,
      r: Math.random() * 1.2 + 0.2, a: Math.random() * 0.28 + 0.04
    }));
    this.drawStars();

    this.gfx = this.add.graphics().setDepth(5);

    // Score (large faint bg text)
    this.scoreTxt = this.add.text(this.W / 2, 85, '0', {
      fontSize: '120px', fontFamily: 'Arial Black, Arial', color: '#ffffff'
    }).setOrigin(0.5).setAlpha(0.07).setDepth(1);

    // Feedback popup
    this.feedbackTxt = this.add.text(this.W / 2, this.H * 0.38, '', {
      fontSize: '20px', fontFamily: 'Arial Black, Arial', color: '#00ffff'
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    // Active effect indicator (top-right)
    this.fxTxt = this.add.text(this.W - 14, 14, '', {
      fontSize: '10px', fontFamily: 'Arial', color: '#445566',
      letterSpacing: 1, align: 'right'
    }).setOrigin(1, 0).setDepth(10);

    // Item get notification (just above slots)
    this.itemNotifTxt = this.add.text(this.W / 2, this.SLOT.Y + this.SLOT.H + 22, '', {
      fontSize: '11px', fontFamily: 'Arial', color: '#aaaaaa', letterSpacing: 2
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    // Slot panel background — top strip only
    const panelGfx = this.add.graphics().setDepth(9);
    panelGfx.fillStyle(0x020508, 0.92);
    panelGfx.fillRect(0, this.SLOT.Y - 28, this.W, this.SLOT.H + 56);
    panelGfx.lineStyle(1, 0x1a2a3a, 1);
    panelGfx.lineBetween(0, this.SLOT.Y + this.SLOT.H + 8, this.W, this.SLOT.Y + this.SLOT.H + 8);

    // Milestone progress bar
    this.barGfx = this.add.graphics().setDepth(10);

    // Slot graphics + text
    this.slotGfx = this.add.graphics().setDepth(11);
    this.slotTexts = [];
    this.slotZones = [];
    this.initSlots();

    // Input — tap only in gameplay area (below slot panel)
    this.input.on('pointerdown', (ptr) => {
      if (ptr.y <= this.SLOT.Y + this.SLOT.H + 8) return; // slot panel area — ignore
      this.onTap();
    });
    this.input.keyboard?.on('keydown-SPACE', this.onTap, this);
  }

  // ── Slot UI ────────────────────────────────────────────

  initSlots() {
    const { W, H, GAP, Y, startX } = this.SLOT;
    for (let i = 0; i < 3; i++) {
      const sx = startX + i * (W + GAP);
      this.slotTexts.push({
        abbr: this.add.text(sx + W / 2, Y + 16, '', {
          fontSize: '15px', fontFamily: 'Arial Black, Arial', color: '#ffffff'
        }).setOrigin(0.5).setDepth(12),
        sub: this.add.text(sx + W / 2, Y + 36, '', {
          fontSize: '10px', fontFamily: 'Arial', color: '#aaaaaa', letterSpacing: 1
        }).setOrigin(0.5).setDepth(12)
      });
      const zone = this.add.zone(sx + W / 2, Y + H / 2, W, H).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.activateSlot(i));
      this.slotZones.push(zone);
    }
    this.redrawSlots();
  }

  redrawSlots() {
    const { W, H, GAP, Y, startX } = this.SLOT;
    this.slotGfx.clear();
    this.barGfx.clear();

    // Progress bar
    const barW = 3 * W + 2 * GAP;
    const progress = (this.blockCount % 10) / 10;
    this.barGfx.fillStyle(0x0a1525, 1);
    this.barGfx.fillRoundedRect(startX, Y - 22, barW, 10, 5);
    if (progress > 0) {
      this.barGfx.fillStyle(0x00cfff, 0.5);
      this.barGfx.fillRoundedRect(startX, Y - 22, barW * progress, 10, 5);
    }

    for (let i = 0; i < 3; i++) {
      const sx = startX + i * (W + GAP);
      const item = this.itemSlots[i];
      const txt = this.slotTexts[i];
      if (item) {
        const def = this.ITEM_DEFS[item.id];
        this.slotGfx.fillStyle(def.color, 0.88);
        this.slotGfx.fillRoundedRect(sx, Y, W, H, 8);
        this.slotGfx.fillStyle(0xffffff, 0.14);
        this.slotGfx.fillRoundedRect(sx, Y, W, 6, { tl: 8, tr: 8, bl: 0, br: 0 });
        this.slotGfx.lineStyle(1, 0xffffff, 0.1);
        this.slotGfx.strokeRoundedRect(sx, Y, W, H, 8);
        txt.abbr.setText(def.abbr).setColor('#ffffff');
        txt.sub.setText('TAP').setColor('#ffffff88');
      } else {
        this.slotGfx.lineStyle(1, 0x1a2a3a, 0.9);
        this.slotGfx.strokeRoundedRect(sx, Y, W, H, 8);
        txt.abbr.setText('');
        txt.sub.setText('');
      }
    }
  }

  activateSlot(i) {
    if (!this.itemSlots[i] || !this.gameActive || this.x5Running) return;
    this.applyItem(this.itemSlots[i].id);
    this.itemSlots[i] = null;
    this.redrawSlots();
  }

  applyItem(id) {
    const top = this.stack[this.stack.length - 1];
    switch (id) {
      case 'wide': {
        const nw = Math.min(this.INIT_WIDTH, Math.round(top.width * 1.35));
        top.width = nw; top.x = (this.W - nw) / 2;
        this.movingBlock.width = nw;
        this.movingBlock.x = -(nw + 20); this.movingBlock.dir = 1;
        this.showFeedback('WIDE!', '#4ecdc4'); break;
      }
      case 'restore':
        top.width = this.INIT_WIDTH; top.x = (this.W - this.INIT_WIDTH) / 2;
        this.movingBlock.width = this.INIT_WIDTH;
        this.movingBlock.x = -(this.INIT_WIDTH + 20); this.movingBlock.dir = 1;
        this.showFeedback('RESTORED!', '#e17055'); break;
      case 'slow':
        this.fx.slowLeft = 8; this.showFeedback('SLOW MOTION', '#45b7d1'); break;
      case 'x5':
        this.x5Active = true; this.showFeedback('NEXT TAP → x5!', '#ffd32a'); break;
    }
    this.updateFxDisplay();
  }

  collectItem() {
    const existing = this.itemSlots.filter(Boolean).map(s => s.id);
    const pool = this.ITEM_IDS.filter(id => !existing.includes(id));
    const src = pool.length > 0 ? pool : this.ITEM_IDS;
    const id = src[Math.floor(Math.random() * src.length)];
    const empty = this.itemSlots.findIndex(s => s === null);
    if (empty >= 0) this.itemSlots[empty] = { id };
    else { this.itemSlots.shift(); this.itemSlots.push({ id }); }
    this.redrawSlots();
    const def = this.ITEM_DEFS[id];
    this.itemNotifTxt.setText('ITEM: ' + def.name + ' — ' + def.desc).setAlpha(1);
    this.tweens.killTweensOf(this.itemNotifTxt);
    this.tweens.add({ targets: this.itemNotifTxt, alpha: 0, duration: 1400, delay: 1000 });
  }

  updateFxDisplay() {
    const p = [];
    if (this.fx.slowLeft > 0) p.push('SLOW ' + this.fx.slowLeft);
    if (this.x5Active) p.push('X5 READY');
    this.fxTxt.setText(p.join('\n'));
  }

  // ── 3D Rendering ───────────────────────────────────────

  getColor(level) {
    const hue = (200 + level * 10) % 360;
    return Phaser.Display.Color.HSLToColor(hue / 360, 0.72, 0.58).color;
  }

  lighten(c, a) {
    const r=(c>>16)&0xff, g=(c>>8)&0xff, b=c&0xff;
    return Phaser.Display.Color.GetColor(Math.min(255,r+a), Math.min(255,g+a), Math.min(255,b+a));
  }

  darken(c, a) {
    const r=(c>>16)&0xff, g=(c>>8)&0xff, b=c&0xff;
    return Phaser.Display.Color.GetColor(Math.max(0,r-a), Math.max(0,g-a), Math.max(0,b-a));
  }

  blockScreenY(level) {
    return this.BASE_Y - (level - this.cameraOffset) * this.BLOCK_H;
  }

  drawStars() {
    this.starGfx.clear();
    for (const s of this.starData) {
      this.starGfx.fillStyle(0xffffff, s.a);
      this.starGfx.fillCircle(s.x, s.y, s.r);
    }
  }

  draw3DBlock(x, y, w, color, alpha = 1) {
    const H = this.BLOCK_H - 3, DX = this.DX, DY = this.DY;
    this.gfx.fillStyle(color, alpha);
    this.gfx.fillRect(x, y, w, H);
    this.gfx.fillStyle(this.lighten(color, 80), alpha);
    this.gfx.fillPoints([
      { x, y }, { x: x+w, y },
      { x: x+w+DX, y: y-DY }, { x: x+DX, y: y-DY }
    ], true);
    this.gfx.fillStyle(this.darken(color, 90), alpha);
    this.gfx.fillPoints([
      { x: x+w, y }, { x: x+w+DX, y: y-DY },
      { x: x+w+DX, y: y-DY+H }, { x: x+w, y: y+H }
    ], true);
    this.gfx.lineStyle(1, 0x000000, 0.45 * alpha);
    this.gfx.lineBetween(x+DX, y-DY, x+w+DX, y-DY);
    this.gfx.lineBetween(x+w+DX, y-DY, x+w+DX, y-DY+H);
    this.gfx.lineBetween(x+w+DX, y-DY+H, x+w, y+H);
    this.gfx.lineBetween(x, y, x+DX, y-DY);
    this.gfx.lineBetween(x+w, y, x+w+DX, y-DY);
    this.gfx.fillStyle(0xffffff, 0.13 * alpha);
    this.gfx.fillRect(x, y, w, 3);
  }

  // ── Game logic ─────────────────────────────────────────

  onTap() {
    if (!this.gameActive || this.x5Running) return;
    if (this.x5Active) {
      this.x5Active = false;
      this.updateFxDisplay();
      this.doX5Combo();
      return;
    }
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

    const isPerfect = Math.abs(cur.x - top.x) < 8;
    const newX = isPerfect ? top.x : left;
    const newWidth = isPerfect ? top.width : Math.round(overlap);

    if (isPerfect) {
      this.perfectStreak++;
      this.showFeedback(this.perfectStreak >= 3 ? 'PERFECT x' + this.perfectStreak : 'PERFECT', '#00ffff');
      this.spawnParticles(newX + newWidth / 2, this.blockScreenY(top.level + 1), this.getColor(top.level + 1));
    } else {
      this.perfectStreak = 0;
      const leftCut = cur.x < top.x;
      this.cutPieces.push({
        x: leftCut ? cur.x : newX + newWidth,
        y: this.blockScreenY(top.level + 1),
        width: cur.width - Math.round(overlap),
        color: this.getColor(top.level + 1),
        vy: -2, vx: leftCut ? -5 : 5, alpha: 1,
        rot: 0, rotSpd: (Math.random() - 0.5) * 0.2
      });
    }

    this.addBlock(newX, newWidth);
  }

  addBlock(x, width) {
    const top = this.stack[this.stack.length - 1];
    const newLevel = top.level + 1;
    this.stack.push({ x, width, level: newLevel, color: this.getColor(newLevel) });
    this.score++;
    this.blockCount++;
    this.scoreTxt.setText(this.score);

    if (this.fx.slowLeft > 0) this.fx.slowLeft--;
    this.updateFxDisplay();

    const targetOffset = Math.max(0, newLevel - 8);
    if (targetOffset > this.cameraOffset) {
      this.tweens.add({ targets: this, cameraOffset: targetOffset, duration: 160, ease: 'Power2' });
    }

    const base = Math.min(200 + this.blockCount * 4, 520);
    this.blockSpeed = this.fx.slowLeft > 0 ? base * 0.5 : base;

    const goRight = this.movingBlock.dir < 0;
    this.movingBlock = { x: goRight ? -width - 20 : this.W + 20, width, dir: goRight ? 1 : -1 };

    const bgHue = (220 + this.blockCount * 2) % 360;
    this.cameras.main.setBackgroundColor(
      Phaser.Display.Color.HSLToColor(bgHue / 360, 0.5, 0.04).color
    );

    if (this.blockCount % 10 === 0) {
      this.time.delayedCall(300, () => this.collectItem());
    }
    this.redrawSlots();
  }

  doX5Combo() {
    this.x5Running = true;
    const top = this.stack[this.stack.length - 1];
    let count = 0;

    const doOne = () => {
      if (count >= 5) {
        this.x5Running = false;
        this.cameras.main.flash(250, 255, 215, 0, true);
        return;
      }
      const t = this.stack[this.stack.length - 1];
      const newLevel = t.level + 1;
      const newColor = this.getColor(newLevel);
      const cy = this.blockScreenY(newLevel);
      this.stack.push({ x: t.x, width: t.width, level: newLevel, color: newColor });
      this.spawnParticles(t.x + t.width / 2, cy, newColor);
      this.score++;
      this.blockCount++;
      this.scoreTxt.setText(this.score);

      const targetOffset = Math.max(0, newLevel - 8);
      if (targetOffset > this.cameraOffset) this.cameraOffset = targetOffset;

      if (this.blockCount % 10 === 0) {
        this.time.delayedCall(600 + count * 100, () => this.collectItem());
      }

      count++;
      this.time.delayedCall(110, doOne);
    };

    this.showFeedback('X5 COMBO!', '#ffd32a');
    doOne();

    this.time.delayedCall(660, () => {
      const t = this.stack[this.stack.length - 1];
      const goRight = this.movingBlock.dir < 0;
      this.movingBlock = { x: goRight ? -t.width - 20 : this.W + 20, width: t.width, dir: goRight ? 1 : -1 };
      const bgHue = (220 + this.blockCount * 2) % 360;
      this.cameras.main.setBackgroundColor(
        Phaser.Display.Color.HSLToColor(bgHue / 360, 0.5, 0.04).color
      );
      this.redrawSlots();
      this.updateFxDisplay();
    });
  }

  spawnParticles(cx, cy, color) {
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const spd = 2 + Math.random() * 5;
      this.particles.push({ x: cx, y: cy, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd - 1.5, r: 2+Math.random()*4, color, alpha: 1 });
    }
  }

  showFeedback(text, color) {
    this.feedbackTxt.setText(text).setColor(color).setAlpha(1).setY(this.H * 0.38);
    this.tweens.killTweensOf(this.feedbackTxt);
    this.tweens.add({ targets: this.feedbackTxt, alpha: 0, y: this.H * 0.3, duration: 1000, ease: 'Power2' });
  }

  // ── Update loop ────────────────────────────────────────

  update(time, delta) {
    const dt = delta / 1000;
    this.pulseT += dt;

    if (this.gameActive && !this.x5Running) {
      this.movingBlock.x += this.blockSpeed * this.movingBlock.dir * dt;
      if (this.movingBlock.x > this.W + 20) this.movingBlock.dir = -1;
      if (this.movingBlock.x < -this.movingBlock.width - 20) this.movingBlock.dir = 1;
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.alpha -= 0.04;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.cutPieces.length - 1; i >= 0; i--) {
      const p = this.cutPieces[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.42; p.rot += p.rotSpd; p.alpha -= 0.022;
      if (p.alpha <= 0) this.cutPieces.splice(i, 1);
    }

    this.gfx.clear();

    for (const block of this.stack) {
      const y = this.blockScreenY(block.level);
      if (y < -this.BLOCK_H - this.DY || y > this.H + 10) continue;
      this.draw3DBlock(block.x, y, block.width, block.color);
    }

    if (this.gameActive && this.stack.length > 0 && !this.x5Running) {
      const top = this.stack[this.stack.length - 1];
      const movY = this.blockScreenY(top.level + 1);
      const mb = this.movingBlock;
      const mbColor = this.getColor(top.level + 1);

      if (this.fx.slowLeft > 0) {
        const ga = 0.05 + 0.04 * Math.sin(this.pulseT * 5);
        this.gfx.fillStyle(mbColor, ga);
        this.gfx.fillRect(mb.x - 10, movY - 10, mb.width + 20, this.BLOCK_H + 14);
      }

      if (this.x5Active) {
        const pa = 0.15 + 0.1 * Math.sin(this.pulseT * 6);
        this.gfx.lineStyle(2, 0xffd32a, pa + 0.2);
        this.gfx.strokeRect(mb.x - 4, movY - 4, mb.width + 8, this.BLOCK_H + 5);
      }

      this.gfx.lineStyle(1, 0xffffff, 0.06);
      this.gfx.strokeRect(top.x, movY, top.width, this.BLOCK_H - 3);
      this.draw3DBlock(mb.x, movY, mb.width, mbColor);
    }

    for (const p of this.particles) {
      this.gfx.fillStyle(p.color, Math.max(0, p.alpha));
      this.gfx.fillCircle(p.x, p.y, p.r);
    }

    for (const cp of this.cutPieces) {
      if (cp.alpha <= 0) continue;
      const cx = cp.x + cp.width / 2, cy = cp.y + (this.BLOCK_H - 3) / 2;
      this.gfx.save();
      this.gfx.translateCanvas(cx, cy);
      this.gfx.rotateCanvas(cp.rot);
      this.gfx.fillStyle(cp.color, Math.max(0, cp.alpha));
      this.gfx.fillRect(-cp.width / 2, -(this.BLOCK_H - 3) / 2, cp.width, this.BLOCK_H - 3);
      this.gfx.restore();
    }
  }
}
