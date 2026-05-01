class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.W = 400; this.H = 700;

    this.LEVELS = [
      { name: 'TRIANGLE',
        nodes: [[200,240],[120,430],[280,430]],
        edges: [[0,1],[1,2],[2,0]] },
      { name: 'SQUARE',
        nodes: [[130,230],[270,230],[270,440],[130,440]],
        edges: [[0,1],[1,2],[2,3],[3,0]] },
      { name: 'CROSS',
        nodes: [[130,230],[270,230],[270,440],[130,440]],
        edges: [[0,1],[1,2],[2,3],[3,0],[0,2]] },
      { name: 'DIAMOND',
        nodes: [[200,200],[120,350],[280,350],[200,500]],
        edges: [[0,1],[0,2],[1,2],[1,3],[2,3]] },
      { name: 'HOUSE',
        nodes: [[200,200],[120,330],[280,330],[120,480],[280,480]],
        edges: [[0,1],[0,2],[1,2],[1,3],[2,4],[3,4]] },
      { name: 'STAR',
        nodes: [[200,182],[323,292],[277,437],[123,437],[77,292]],
        edges: [[0,1],[1,2],[2,3],[3,4],[4,0],[0,2],[2,4],[4,1],[1,3],[3,0]] }
    ];

    this.levelIdx = 0;
    this.score = parseInt(localStorage.getItem('one_line_best') || '0');
    this.currentNode = null;
    this.usedEdges = new Set();
    this.errorTimer = 0;
    this.errorEdge = null;
    this.clearTimer = 0;

    const sg = this.add.graphics().setDepth(0);
    for (let i = 0; i < 60; i++) {
      sg.fillStyle(0xffffff, Math.random() * 0.28 + 0.04);
      sg.fillCircle(Math.random() * this.W, Math.random() * this.H, Math.random() * 1.2 + 0.2);
    }

    this.gfx = this.add.graphics().setDepth(5);

    this.levelTxt = this.add.text(this.W / 2, 40, '', {
      fontSize: '11px', fontFamily: 'Arial', color: '#334455', letterSpacing: 5
    }).setOrigin(0.5).setDepth(10);

    this.nameTxt = this.add.text(this.W / 2, 60, '', {
      fontSize: '20px', fontFamily: 'Arial Black, Arial', color: '#ffffff'
    }).setOrigin(0.5).setDepth(10);

    this.scoreTxt = this.add.text(this.W / 2, this.H - 45, '', {
      fontSize: '13px', fontFamily: 'Arial', color: '#334455', letterSpacing: 3
    }).setOrigin(0.5).setDepth(10);

    this.feedbackTxt = this.add.text(this.W / 2, this.H / 2 - 20, '', {
      fontSize: '22px', fontFamily: 'Arial Black, Arial', color: '#00ffff'
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    // Reset button
    const resetBtn = this.add.text(this.W - 20, 20, '↺', {
      fontSize: '24px', fontFamily: 'Arial', color: '#334455'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(10);
    resetBtn.on('pointerover', () => resetBtn.setColor('#00cfff'));
    resetBtn.on('pointerout', () => resetBtn.setColor('#334455'));
    resetBtn.on('pointerdown', () => this.resetLevel());

    const backBtn = this.add.text(20, 20, '< MENU', {
      fontSize: '12px', fontFamily: 'Arial', color: '#334455', letterSpacing: 2
    }).setInteractive({ useHandCursor: true }).setDepth(10);
    backBtn.on('pointerover', () => backBtn.setColor('#00cfff'));
    backBtn.on('pointerout', () => backBtn.setColor('#334455'));
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'));

    this.input.on('pointerdown', this.onTap, this);
    this.loadLevel(0);
  }

  edgeKey(a, b) { return Math.min(a, b) + '-' + Math.max(a, b); }

  loadLevel(idx) {
    this.levelIdx = idx % this.LEVELS.length;
    this.currentNode = null;
    this.usedEdges = new Set();
    this.errorEdge = null;
    const lv = this.LEVELS[this.levelIdx];
    this.levelTxt.setText('LEVEL ' + (this.levelIdx + 1));
    this.nameTxt.setText(lv.name);
    this.scoreTxt.setText('COMPLETED: ' + this.score);
  }

  resetLevel() {
    this.currentNode = null;
    this.usedEdges = new Set();
    this.errorEdge = null;
  }

  onTap(ptr) {
    if (this.clearTimer > 0) return;
    const lv = this.LEVELS[this.levelIdx];
    let nearest = -1, nearDist = 45;
    for (let i = 0; i < lv.nodes.length; i++) {
      const d = Math.hypot(ptr.x - lv.nodes[i][0], ptr.y - lv.nodes[i][1]);
      if (d < nearDist) { nearDist = d; nearest = i; }
    }
    if (nearest === -1) return;

    if (this.currentNode === null) {
      this.currentNode = nearest;
      return;
    }
    if (nearest === this.currentNode) {
      this.currentNode = null;
      return;
    }

    const key = this.edgeKey(this.currentNode, nearest);
    const edgeExists = lv.edges.some(e => this.edgeKey(e[0], e[1]) === key);
    if (!edgeExists) return;

    if (this.usedEdges.has(key)) {
      this.errorEdge = key;
      this.errorTimer = 500;
      this.showFeedback('ALREADY USED', '#ff4444');
      return;
    }

    this.usedEdges.add(key);
    this.currentNode = nearest;

    if (this.usedEdges.size === lv.edges.length) {
      this.score++;
      if (this.score > parseInt(localStorage.getItem('one_line_best') || '0')) {
        localStorage.setItem('one_line_best', this.score);
      }
      this.scoreTxt.setText('COMPLETED: ' + this.score);
      this.clearTimer = 1200;
      this.showFeedback('CLEAR!', '#00ffff');
      this.time.delayedCall(1200, () => {
        this.clearTimer = 0;
        this.loadLevel(this.levelIdx + 1);
      });
    }
  }

  showFeedback(msg, color) {
    this.feedbackTxt.setText(msg).setColor(color).setAlpha(1).setY(this.H / 2 - 20);
    this.tweens.killTweensOf(this.feedbackTxt);
    this.tweens.add({ targets: this.feedbackTxt, alpha: 0, y: this.H / 2 - 60, duration: 900 });
  }

  update(time, delta) {
    if (this.errorTimer > 0) this.errorTimer -= delta;
    else this.errorEdge = null;

    this.gfx.clear();
    const lv = this.LEVELS[this.levelIdx];

    for (const edge of lv.edges) {
      const [a, b] = edge;
      const key = this.edgeKey(a, b);
      const used = this.usedEdges.has(key);
      const isError = this.errorEdge === key;

      let color = 0x2a4a6a, alpha = 0.65, lw = 3;
      if (used) { color = 0x00cfff; alpha = 1; lw = 4; }
      if (isError) { color = 0xff4444; alpha = 1; lw = 5; }

      this.gfx.lineStyle(lw, color, alpha);
      this.gfx.lineBetween(
        lv.nodes[a][0], lv.nodes[a][1],
        lv.nodes[b][0], lv.nodes[b][1]
      );
    }

    for (let i = 0; i < lv.nodes.length; i++) {
      const [x, y] = lv.nodes[i];
      const isActive = i === this.currentNode;

      if (isActive) {
        this.gfx.fillStyle(0x00cfff, 0.2);
        this.gfx.fillCircle(x, y, 22);
        this.gfx.fillStyle(0x00cfff, 1);
        this.gfx.fillCircle(x, y, 14);
        this.gfx.fillStyle(0x050510, 1);
        this.gfx.fillCircle(x, y, 6);
      } else {
        this.gfx.fillStyle(0x1a3a5a, 1);
        this.gfx.fillCircle(x, y, 12);
        this.gfx.lineStyle(2, 0x3a6a9a, 0.8);
        this.gfx.strokeCircle(x, y, 12);
      }
    }
  }
}
