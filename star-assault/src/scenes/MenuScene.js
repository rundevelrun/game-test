// MenuScene.js - Star Assault Menu Scene

class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // 배경
    this.add.rectangle(W / 2, H / 2, W, H, 0x050510);

    // 별 생성
    this._stars = [];
    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const r = Math.random() * 1.8 + 0.3;
      const alpha = Math.random() * 0.7 + 0.3;
      const star = this.add.circle(x, y, r, 0xffffff, alpha);
      this._stars.push({ obj: star, baseAlpha: alpha, phase: Math.random() * Math.PI * 2 });
    }

    // 타이틀 글로우 효과 (뒤 레이어)
    const glowText = this.add.text(W / 2, H * 0.32, 'STAR ASSAULT', {
      fontSize: Math.floor(W * 0.1) + 'px',
      fontFamily: 'Arial Black, Arial',
      color: '#00cfff',
      alpha: 0.25,
      stroke: '#00cfff',
      strokeThickness: 18
    }).setOrigin(0.5);

    // 타이틀 메인
    const titleText = this.add.text(W / 2, H * 0.32, 'STAR ASSAULT', {
      fontSize: Math.floor(W * 0.1) + 'px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffffff',
      stroke: '#00cfff',
      strokeThickness: 4
    }).setOrigin(0.5);

    // 부제목
    this.add.text(W / 2, H * 0.32 + titleText.height * 0.65, '2387 · AI REBELLION', {
      fontSize: Math.floor(W * 0.045) + 'px',
      fontFamily: 'Arial',
      color: '#88ddff',
      letterSpacing: 3
    }).setOrigin(0.5);

    // 장식 라인
    const lineY = H * 0.32 + titleText.height * 1.1;
    const lineGraphics = this.add.graphics();
    lineGraphics.lineStyle(1, 0x00cfff, 0.5);
    lineGraphics.beginPath();
    lineGraphics.moveTo(W * 0.1, lineY);
    lineGraphics.lineTo(W * 0.9, lineY);
    lineGraphics.strokePath();

    // 함선 데코 그래픽
    this._drawMenuShip(W / 2, H * 0.52, W);

    // TAP TO START
    this._tapText = this.add.text(W / 2, H * 0.72, 'TAP TO START', {
      fontSize: Math.floor(W * 0.065) + 'px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffdd44',
      stroke: '#aa8800',
      strokeThickness: 3
    }).setOrigin(0.5);

    // 깜빡임
    this.tweens.add({
      targets: this._tapText,
      alpha: 0,
      duration: 700,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    // 저장된 게임 확인
    const savedData = this._loadSave();
    if (savedData && savedData.stage > 1) {
      const continueBtn = this.add.text(W / 2, H * 0.82, `CONTINUE  (Stage ${savedData.stage})`, {
        fontSize: Math.floor(W * 0.05) + 'px',
        fontFamily: 'Arial Black, Arial',
        color: '#22c55e',
        stroke: '#155e35',
        strokeThickness: 3,
        backgroundColor: '#0a1f10',
        padding: { x: 18, y: 10 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      continueBtn.on('pointerover', () => continueBtn.setColor('#88ffaa'));
      continueBtn.on('pointerout', () => continueBtn.setColor('#22c55e'));
      continueBtn.on('pointerdown', () => {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.time.delayedCall(420, () => {
          this.scene.start('GameScene', { newGame: false });
        });
      });
    }

    // 버전 텍스트
    this.add.text(W - 8, H - 6, 'v0.1', {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#334466',
      alpha: 0.6
    }).setOrigin(1, 1);

    // 전체 탭으로 시작
    this.input.on('pointerdown', (pointer) => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(420, () => {
        this.scene.start('GameScene', { newGame: true });
      });
    });

    // 카메라 페이드 인
    this.cameras.main.fadeIn(600, 0, 0, 0);

    // 타이틀 펄스
    this.tweens.add({
      targets: glowText,
      alpha: 0.4,
      duration: 1800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    this._time = 0;
  }

  _drawMenuShip(cx, cy, W) {
    const g = this.add.graphics();
    const size = W * 0.12;

    // 함선 본체 (하늘색 삼각형, 오른쪽 방향)
    g.fillStyle(0x00cfff, 0.9);
    g.beginPath();
    g.moveTo(cx + size, cy);
    g.lineTo(cx - size * 0.6, cy - size * 0.55);
    g.lineTo(cx - size * 0.3, cy);
    g.lineTo(cx - size * 0.6, cy + size * 0.55);
    g.closePath();
    g.fillPath();

    // 함선 강조
    g.lineStyle(2, 0xffffff, 0.6);
    g.beginPath();
    g.moveTo(cx + size, cy);
    g.lineTo(cx - size * 0.6, cy - size * 0.55);
    g.lineTo(cx - size * 0.3, cy);
    g.lineTo(cx - size * 0.6, cy + size * 0.55);
    g.closePath();
    g.strokePath();

    // 엔진 불꽃
    g.fillStyle(0xff6600, 0.8);
    g.fillTriangle(
      cx - size * 0.3, cy - size * 0.18,
      cx - size * 0.3, cy + size * 0.18,
      cx - size * 0.8, cy
    );

    g.fillStyle(0xffcc00, 0.9);
    g.fillTriangle(
      cx - size * 0.3, cy - size * 0.09,
      cx - size * 0.3, cy + size * 0.09,
      cx - size * 0.6, cy
    );

    // 글로우 효과
    this.tweens.add({
      targets: g,
      alpha: 0.75,
      duration: 1200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  _loadSave() {
    try {
      const raw = localStorage.getItem('starAssault_save');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  update(time, delta) {
    this._time += delta * 0.001;
    // 별 반짝임
    for (const s of this._stars) {
      s.obj.setAlpha(s.baseAlpha * (0.6 + 0.4 * Math.sin(this._time * 1.5 + s.phase)));
    }
  }
}
