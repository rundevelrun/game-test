class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.W = 400; this.H = 700;
    this.COLS = 5;
    this.MAX_ROWS = 10;
    this.TILE_SIZE = 56;
    this.TILE_GAP = 6;
    this.GRID_X = 52;
    this.GRID_BOTTOM = 640;

    this.TILE_COLORS = {
      2: 0x4ecdc4, 4: 0x45b7d1, 8: 0xa29bfe, 16: 0xffd32a,
      32: 0xff9f43, 64: 0xff6b6b, 128: 0xfd79a8, 256: 0x00b894,
      512: 0x6c5ce7, 1024: 0xe17055, 2048: 0xffeaa7
    };

    this.grid = [[], [], [], [], []];
    this.score = 0;
    this.gameActive = true;
    this.currentCol = 2;
    this.currentValue = this.nextTile();
    this.mergeMsg = '';
    this.mergeMsgTimer = 0;
    this.tileObjects = [];

    const sg = this.add.graphics().setDepth(0);
    for (let i = 0; i < 60; i++) {
      sg.fillStyle(0xffffff, Math.random() * 0.28 + 0.04);
      sg.fillCircle(Math.random() * this.W, Math.random() * this.H, Math.random() * 1.2 + 0.2);
    }

    this.bgGfx = this.add.graphics().setDepth(1);
    this.drawGridBg();

    this.gfx = this.add.graphics().setDepth(5);

    this.scoreTxt = this.add.text(this.W / 2, 55, '0', {
      fontSize: '80px', fontFamily: 'Arial Black, Arial', color: '#ffffff'
    }).setOrigin(0.5).setAlpha(0.08).setDepth(2);

    this.nextLabel = this.add.text(this.W / 2, 95, 'NEXT', {
      fontSize: '10px', fontFamily: 'Arial', color: '#334455', letterSpacing: 4
    }).setOrigin(0.5).setDepth(10);

    this.mergeTxt = this.add.text(this.W / 2, this.H / 2, '', {
      fontSize: '22px', fontFamily: 'Arial Black, Arial', color: '#00ffff'
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    this.tileLayer = this.add.container(0, 0).setDepth(6);

    this.input.on('pointerdown', this.onTap, this);

    this.rebuildTileDisplay();
  }

  nextTile() {
    const r = Math.random();
    if (r < 0.6) return 2;
    if (r < 0.9) return 4;
    return 8;
  }

  tileColor(v) {
    return this.TILE_COLORS[v] || 0xffffff;
  }

  colX(col) {
    return this.GRID_X + col * (this.TILE_SIZE + this.TILE_GAP) + this.TILE_SIZE / 2;
  }

  tileY(row) {
    return this.GRID_BOTTOM - row * (this.TILE_SIZE + this.TILE_GAP) - this.TILE_SIZE / 2;
  }

  drawGridBg() {
    for (let c = 0; c < this.COLS; c++) {
      const x = this.GRID_X + c * (this.TILE_SIZE + this.TILE_GAP);
      for (let r = 0; r < this.MAX_ROWS; r++) {
        const y = this.GRID_BOTTOM - r * (this.TILE_SIZE + this.TILE_GAP) - this.TILE_SIZE;
        this.bgGfx.fillStyle(0x0a0f1a, 0.8);
        this.bgGfx.fillRoundedRect(x, y, this.TILE_SIZE, this.TILE_SIZE, 6);
      }
    }
  }

  rebuildTileDisplay() {
    this.tileLayer.removeAll(true);

    for (let c = 0; c < this.COLS; c++) {
      for (let r = 0; r < this.grid[c].length; r++) {
        const v = this.grid[c][r];
        this.addTileVisual(c, r, v);
      }
    }
  }

  addTileVisual(col, row, value) {
    const x = this.colX(col);
    const y = this.tileY(row);
    const color = this.tileColor(value);
    const g = this.add.graphics();
    const px = this.GRID_X + col * (this.TILE_SIZE + this.TILE_GAP);
    const py = this.GRID_BOTTOM - row * (this.TILE_SIZE + this.TILE_GAP) - this.TILE_SIZE;
    g.fillStyle(color, 1);
    g.fillRoundedRect(px, py, this.TILE_SIZE, this.TILE_SIZE, 6);
    g.fillStyle(0xffffff, 0.15);
    g.fillRoundedRect(px, py, this.TILE_SIZE, 5, { tl: 6, tr: 6, bl: 0, br: 0 });

    const fontSize = value >= 1000 ? '14px' : value >= 100 ? '18px' : '22px';
    const t = this.add.text(x, y, value.toString(), {
      fontSize, fontFamily: 'Arial Black, Arial', color: '#ffffff'
    }).setOrigin(0.5);

    this.tileLayer.add(g);
    this.tileLayer.add(t);
  }

  onTap(ptr) {
    if (!this.gameActive) return;
    const col = Math.floor((ptr.x - this.GRID_X) / (this.TILE_SIZE + this.TILE_GAP));
    if (col < 0 || col >= this.COLS) return;
    this.dropIntoCol(col);
  }

  dropIntoCol(col) {
    this.grid[col].push(this.currentValue);
    let merged = this.runMerge(col);

    if (this.grid[col].length > this.MAX_ROWS) {
      this.gameOver();
      return;
    }

    if (merged > 0) {
      this.showMerge(merged);
    }

    this.currentValue = this.nextTile();
    this.rebuildTileDisplay();
    this.gfx.clear();
    this.drawCurrentTile();
  }

  runMerge(col) {
    let totalMerged = 0;
    let again = true;
    while (again) {
      again = false;
      const len = this.grid[col].length;
      if (len >= 2 && this.grid[col][len - 1] === this.grid[col][len - 2]) {
        const newVal = this.grid[col][len - 1] * 2;
        this.grid[col].splice(len - 2, 2, newVal);
        this.score += newVal;
        this.scoreTxt.setText(this.score);
        totalMerged++;
        again = true;
      }
    }
    return totalMerged;
  }

  showMerge(count) {
    const msg = count >= 3 ? 'CHAIN x' + count + '!' : 'MERGE!';
    this.mergeTxt.setText(msg).setAlpha(1).setY(this.H / 2);
    this.tweens.killTweensOf(this.mergeTxt);
    this.tweens.add({ targets: this.mergeTxt, alpha: 0, y: this.H / 2 - 50, duration: 900 });
  }

  gameOver() {
    this.gameActive = false;
    this.cameras.main.shake(220, 0.012);
    const best = Math.max(this.score, parseInt(localStorage.getItem('merge_drop_best') || '0'));
    localStorage.setItem('merge_drop_best', best);
    this.time.delayedCall(800, () => {
      this.scene.start('GameOverScene', { score: this.score, best });
    });
  }

  drawCurrentTile() {
    const x = this.colX(this.currentCol);
    const px = this.GRID_X + this.currentCol * (this.TILE_SIZE + this.TILE_GAP);
    const py = 112;
    const color = this.tileColor(this.currentValue);

    this.gfx.fillStyle(color, 1);
    this.gfx.fillRoundedRect(px, py, this.TILE_SIZE, this.TILE_SIZE, 6);
    this.gfx.fillStyle(0xffffff, 0.15);
    this.gfx.fillRoundedRect(px, py, this.TILE_SIZE, 5, { tl: 6, tr: 6, bl: 0, br: 0 });

    const colHighX = this.GRID_X + this.currentCol * (this.TILE_SIZE + this.TILE_GAP);
    this.gfx.lineStyle(1, color, 0.25);
    this.gfx.lineBetween(colHighX, py + this.TILE_SIZE, colHighX, this.GRID_BOTTOM);
    this.gfx.lineBetween(colHighX + this.TILE_SIZE, py + this.TILE_SIZE, colHighX + this.TILE_SIZE, this.GRID_BOTTOM);
  }

  update(time, delta) {
    this.gfx.clear();
    if (this.gameActive) {
      this.drawCurrentTile();
    }

    // Column tap guides
    for (let c = 0; c < this.COLS; c++) {
      const cx = this.colX(c);
      const topY = this.tileY(this.grid[c].length);
      if (this.grid[c].length < this.MAX_ROWS) {
        this.gfx.fillStyle(0x112233, 0.4);
        this.gfx.fillCircle(cx, topY - 22, 10);
        this.gfx.fillStyle(0x334455, 1);
        this.gfx.fillTriangle(cx - 5, topY - 26, cx + 5, topY - 26, cx, topY - 18);
      }
    }
  }
}
