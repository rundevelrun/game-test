class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.W = 400; this.H = 700;
    this.BLOCK_H = 30;
    this.DX = 16; this.DY = 14;
    this.BASE_Y = this.H - 115;
    this.INIT_WIDTH = 180;

    this.SLOT = { W: 82, H: 52, GAP: 8, Y: this.H - 70 };
    this.SLOT.startX = (this.W - (3 * this.SLOT.W + 2 * this.SLOT.GAP)) / 2;

    this.ITEM_DEFS = {
      wide:    { name: 'WIDE',   abbr: 'WD', color: 0x4ecdc4 },
      restore: { name: 'RESTORE',abbr: 'RS', color: 0xe17055 },
      slow:    { name: 'SLOW',   abbr: 'SL', color: 0x45b7d1 },
      zone:    { name: 'ZONE',   abbr: 'BZ', color: 0xffd32a },
      shield:  { name: 'SHIELD', abbr: 'SH', color: 0xa29bfe },
      magnet:  { name: 'MAGNET', abbr: 'MG', color: 0xff9f43 },
      double:  { name: '2X',     abbr: '2X', color: 0xff6b9d },
      ghost:   { name: 'GHOST',  abbr: 'GH', color: 0x00b894 },
    };
    this.ITEM_IDS = Object.keys(this.ITEM_DEFS);

    this.itemSlots = [null, null, null];
    this.fx = { slowLeft: 0, bigZoneLeft: 0, shield: false, magnetLeft: 0, doubleLeft: 0, ghostLeft: 0 };

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

    this.scoreTxt = this.add.text(this.W / 2, 85, '0', {
      fontSize: '120px', fontFamily: 'Arial Black, Arial', color: '#ffffff'
    }).setOrigin(0.5).setAlpha(0.07).setDepth(1);

    this.feedbackTxt = this.add.text(this.W / 2, this.H * 0.38, '', {
      fontSize: '20px', fontFamily: 'Arial Black, Arial', color: '#00ffff'
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    this.fxTxt = this.add.text(this.W - 14, 14, '', {
      fontSize: '10px', fontFamily: 'Arial', color: '#445566',
      letterSpacing: 1, align: 'right'
    }).setOrigin(1, 0).setDepth(10);

    // Item notification
    this.itemNotifTxt = this.add.text(this.W / 2, this.H - 115, '', {
      fontSize: '12px', fontFamily: 'Arial', color: '#ffffff', letterSpacing: 2
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    // Item slots
    this.slotGfx = this.add.graphics().setDepth(11);
    this.slotTexts = [];
    this.slotZones = [];
    this.initSlots();

    this.input.on('pointerdown', this.onTap, this);
    this.input.keyboard?.on('keydown-SPACE', this.onTap, this);
  }

  // ── Slots ──────────────────────────────────────────────

  initSlots() {
    const { W, H, GAP, Y, startX } = this.SLOT;
    for (let i = 0; i < 3; i++) {
      const sx = startX + i * (W + GAP);
      this.slotTexts.push({
        abbr: this.add.text(sx + W / 2, Y + 15, '', {
          fontSize: '14px', fontFamily: 'Arial Black, Arial', color: '#ffffff'
        }).setOrigin(0.5).setDepth(12),
        tap: this.add.text(sx + W / 2, Y + 35, '', {
          fontSize: '10px', fontFamily: 'Arial', color: '#aaaaaa'
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

    // Milestone bar above slots
    const next = (Math.floor(this.blockCount / 10) + 1) * 10;
    this.slotGfx.fillStyle(0x1a2a3a, 0.7);
    this.slotGfx.fillRoundedRect(startX, Y - 22, 3 * W + 2 * GAP, 16, 4);
    const fill = ((this.blockCount % 10) / 10) * (3 * W + 2 * GAP);
    this.slotGfx.fillStyle(0x00cfff, 0.4);
    this.slotGfx.fillRoundedRect(startX, Y - 22, fill, 16, 4);

    for (let i = 0; i < 3; i++) {
      const sx = startX + i * (W + GAP);
      const item = this.itemSlots[i];
      const txt = this.slotTexts[i];
      if (item) {
        const def = this.ITEM_DEFS[item.id];
        this.slotGfx.fillStyle(def.color, 0.85);
        this.slotGfx.fillRoundedRect(sx, Y, W, H, 8);
        this.slotGfx.fillStyle(0xffffff, 0.12);
        this.slotGfx.fillRoundedRect(sx, Y, W, 6, { tl: 8, tr: 8, bl: 0, br: 0 });
        txt.abbr.setText(def.abbr).setColor('#ffffff');
        txt.tap.setText('TAP').setColor('#ffffff99');
      } else {
        this.slotGfx.lineStyle(1, 0x1a2a3a, 1);
        this.slotGfx.strokeRoundedRect(sx, Y, W, H, 8);
        txt.abbr.setText('');
        txt.tap.setText('');
      }
    }
  }

  activateSlot(i) {
    if (!this.itemSlots[i] || !this.gameActive) return;
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
        this.showFeedback('WIDE BLOCK!', '#4ecdc4'); break;
      }
      case 'restore':
        top.width = this.INIT_WIDTH; top.x = (this.W - this.INIT_WIDTH) / 2;
        this.movingBlock.width = this.INIT_WIDTH;
        this.movingBlock.x = -(this.INIT_WIDTH + 20); this.movingBlock.dir = 1;
        this.showFeedback('RESTORED!', '#e17055'); break;
      case 'slow':   this.fx.slowLeft = 8; this.showFeedback('SLOW MOTION', '#45b7d1'); break;
      case 'zone':   this.fx.bigZoneLeft = 5; this.showFeedback('BIG ZONE!', '#ffd32a'); break;
      case 'shield': this.fx.shield = true; this.showFeedback('SHIELD ON!', '#a29bfe'); break;
      case 'magnet': this.fx.magnetLeft = 3; this.showFeedback('MAGNET x3', '#ff9f43'); break;
      case 'double': this.fx.doubleLeft = 5; this.showFeedback('DOUBLE!', '#ff6b9d'); break;
      case 'ghost':  this.fx.ghostLeft = 5; this.showFeedback('GHOST ON!', '#00b894'); break;
    }
    this.updateFxDisplay();
  }

  collectItem() {
    const id = this.ITEM_IDS[Math.floor(Math.random() * this.ITEM_IDS.length)];
    const empty = this.itemSlots.findIndex(s => s === null);
    if (empty >= 0) {
      this.itemSlots[empty] = { id };
    } else {
      this.itemSlots.shift();
      this.itemSlots.push({ id });
    }
    this.redrawSlots();
    const def = this.ITEM_DEFS[id];
    this.itemNotifTxt.setText('ITEM: ' + def.name).setAlpha(1);
    this.tweens.killTweensOf(this.itemNotifTxt);
    this.tweens.add({ targets: this.itemNotifTxt, alpha: 0, duration: 1400, delay: 900 });
  }

  updateFxDisplay() {
    const p = [];
    if (this.fx.slowLeft > 0) p.push('SLOW ' + this.fx.slowLeft);
    if (this.fx.bigZoneLeft > 0) p.push('ZONE ' + this.fx.bigZoneLeft);
    if (this.fx.doubleLeft > 0) p.push('2X ' + this.fx.doubleLeft);
    if (this.fx.ghostLeft > 0) p.push('GHOST ' + this.fx.ghostLeft);
    if (this.fx.magnetLeft > 0) p.push('MAG ' + this.fx.magnetLeft);
    if (this.fx.shield) p.push('SHIELD');
    this.fxTxt.setText(p.join('\n'));
  }

  // ── Rendering helpers ──────────────────────────────────

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

    // Front face
    this.gfx.fillStyle(color, alpha);
    this.gfx.fillRect(x, y, w, H);

    // Top face — lighter
    this.gfx.fillStyle(this.lighten(color, 80), alpha);
    this.gfx.fillPoints([
      { x, y }, { x: x+w, y },
      { x: x+w+DX, y: y-DY }, { x: x+DX, y: y-DY }
    ], true);

    // Right side — darker
    this.gfx.fillStyle(this.darken(color, 90), alpha);
    this.gfx.fillPoints([
      { x: x+w, y }, { x: x+w+DX, y: y-DY },
      { x: x+w+DX, y: y-DY+H }, { x: x+w, y: y+H }
    ], true);

    // Edge lines for crispness
    this.gfx.lineStyle(1, 0x000000, 0.5 * alpha);
    this.gfx.lineBetween(x+DX, y-DY, x+w+DX, y-DY);       // top-back
    this.gfx.lineBetween(x+w+DX, y-DY, x+w+DX, y-DY+H);   // right-back
    this.gfx.lineBetween(x+w+DX, y-DY+H, x+w, y+H);       // bottom-right
    this.gfx.lineBetween(x, y, x+DX, y-DY);                // top-left ridge
    this.gfx.lineBetween(x+w, y, x+w+DX, y-DY);            // top-right ridge

    // Front face top highlight
    this.gfx.fillStyle(0xffffff, 0.13 * alpha);
    this.gfx.fillRect(x, y, w, 3);
  }

  // ── Game logic ─────────────────────────────────────────

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
      if (this.fx.shield) {
        this.fx.shield = false;
        this.updateFxDisplay();
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

    const threshold = this.fx.bigZoneLeft > 0 ? 20 : 8;
    const isPerfect = Math.abs(cur.x - top.x) < threshold;
    const useMagnet = this.fx.magnetLeft > 0 && !isPerfect;
    const snap = isPerfect || useMagnet;
    const newX = snap ? top.x : left;
    const newWidth = snap ? top.width : Math.round(overlap);

    if (useMagnet) {
      this.fx.magnetLeft--;
      this.showFeedback('MAGNET!', '#ff9f43');
    } else if (isPerfect) {
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

    const newLevel = top.level + 1;
    this.stack.push({ x: newX, width: newWidth, level: newLevel, color: this.getColor(newLevel) });

    this.score += this.fx.doubleLeft > 0 ? 2 : 1;
    this.blockCount++;
    this.scoreTxt.setText(this.score);

    if (this.fx.slowLeft > 0) this.fx.slowLeft--;
    if (this.fx.bigZoneLeft > 0) this.fx.bigZoneLeft--;
    if (this.fx.doubleLeft > 0) this.fx.doubleLeft--;
    if (this.fx.ghostLeft > 0) this.fx.ghostLeft--;
    this.updateFxDisplay();

    const targetOffset = Math.max(0, newLevel - 8);
    if (targetOffset > this.cameraOffset) {
      this.tweens.add({ targets: this, cameraOffset: targetOffset, duration: 160, ease: 'Power2' });
    }

    const base = Math.min(200 + this.blockCount * 4, 520);
    this.blockSpeed = this.fx.slowLeft > 0 ? base * 0.5 : base;

    const goRight = this.movingBlock.dir < 0;
    this.movingBlock = { x: goRight ? -newWidth - 20 : this.W + 20, width: newWidth, dir: goRight ? 1 : -1 };

    // Background hue shift
    const bgHue = (220 + this.blockCount * 2) % 360;
    this.cameras.main.setBackgroundColor(
      Phaser.Display.Color.HSLToColor(bgHue / 360, 0.5, 0.04).color
    );

    // Item every 10 blocks
    if (this.blockCount % 10 === 0) {
      this.time.delayedCall(300, () => this.collectItem());
    }

    this.redrawSlots(); // update progress bar
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

    if (this.gameActive) {
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

    // Stack (3D)
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
      if (this.fx.ghostLeft > 0) {
        this.gfx.lineStyle(2, 0xffffff, 0.22);
        this.gfx.strokeRect(top.x, movY, top.width, this.BLOCK_H - 3);
      }

      // Slow glow
      if (this.fx.slowLeft > 0) {
        const ga = 0.05 + 0.04 * Math.sin(this.pulseT * 5);
        this.gfx.fillStyle(mbColor, ga);
        this.gfx.fillRect(mb.x - 10, movY - 10, mb.width + 20, this.BLOCK_H + 14);
      }

      // Guide outline
      this.gfx.lineStyle(1, 0xffffff, 0.06);
      this.gfx.strokeRect(top.x, movY, top.width, this.BLOCK_H - 3);

      // Moving block (3D)
      this.draw3DBlock(mb.x, movY, mb.width, mbColor);
    }

    // Particles
    for (const p of this.particles) {
      this.gfx.fillStyle(p.color, Math.max(0, p.alpha));
      this.gfx.fillCircle(p.x, p.y, p.r);
    }

    // Cut pieces (rotating)
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

    // Shield pulse ring
    if (this.fx.shield && this.stack.length > 0) {
      const top = this.stack[this.stack.length - 1];
      const ty = this.blockScreenY(top.level);
      this.gfx.lineStyle(2, 0xa29bfe, 0.4 + 0.3 * Math.sin(this.pulseT * 4));
      this.gfx.strokeRect(top.x - 5, ty - 5, top.width + 10 + this.DX, this.BLOCK_H + 10);
    }
  }
}
