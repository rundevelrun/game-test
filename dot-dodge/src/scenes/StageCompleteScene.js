class StageCompleteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StageCompleteScene' });
  }

  init(data) {
    this.stage = data.stage || 1;
    this.hp = data.hp || 100;
    this.maxHp = data.maxHp || 100;
    this.defense = data.defense || 0;
    this.cash = data.cash || 0;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor('#050510');
    this.cameras.main.setAlpha(0);
    this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: 300 });

    for (let i = 0; i < 80; i++) {
      this.add.circle(
        Phaser.Math.Between(0, W), Phaser.Math.Between(0, H),
        Phaser.Math.FloatBetween(0.5, 1.5), 0xffffff, Phaser.Math.FloatBetween(0.1, 0.5)
      );
    }

    // Stage clear
    this.add.text(W / 2, H * 0.1, `STAGE ${this.stage}`, {
      fontSize: '13px', fontFamily: 'Arial', color: '#667799', letterSpacing: 6
    }).setOrigin(0.5);

    this.add.text(W / 2, H * 0.18, 'CLEAR!', {
      fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff',
      shadow: { offsetX: 0, offsetY: 0, color: '#00cfff', blur: 20, fill: true }
    }).setOrigin(0.5);

    // HP recover
    const recover = Math.round(this.maxHp * 0.2);
    const newHp = Math.min(this.hp + recover, this.maxHp);
    this.add.text(W / 2, H * 0.27, `HP +${recover} 회복`, {
      fontSize: '13px', fontFamily: 'Arial', color: '#00cfff'
    }).setOrigin(0.5);

    // Cash display
    this.add.text(W / 2, H * 0.34, `💰 보유 캐시: ${this.cash}`, {
      fontSize: '13px', fontFamily: 'Arial', color: '#ffd700'
    }).setOrigin(0.5);

    // Upgrade title
    this.add.text(W / 2, H * 0.41, 'UPGRADE', {
      fontSize: '12px', fontFamily: 'Arial', color: '#667799', letterSpacing: 5
    }).setOrigin(0.5);

    // 업그레이드 버튼
    const upgrades = this._getUpgrades();
    this.cashDisplay = this.cash; // 버튼에서 갱신용
    upgrades.forEach((upg, i) => {
      const y = H * 0.5 + i * (H * 0.155);
      this._createUpgradeBtn(W, y, upg, newHp);
    });

    // 스킵 버튼
    const skipBtn = this.add.text(W / 2, H * 0.93, 'SKIP →', {
      fontSize: '14px', fontFamily: 'Arial', color: '#334466', letterSpacing: 4
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    skipBtn.on('pointerup', () => {
      this.scene.start('GameScene', {
        stage: this.stage + 1,
        hp: newHp,
        maxHp: this.maxHp,
        defense: this.defense,
        cash: this.cash
      });
    });
  }

  _getUpgrades() {
    const baseCost = 10 + this.stage * 5;
    return [
      {
        label: 'MAX HP +50',
        cost: baseCost,
        desc: `최대 체력 증가`,
        apply: (data) => ({ ...data, maxHp: data.maxHp + 50, hp: Math.min(data.hp + 50, data.maxHp + 50) })
      },
      {
        label: '방어력 +10%',
        cost: baseCost + 5,
        desc: `피해 감소 (현재 ${this.defense}%)`,
        apply: (data) => ({ ...data, defense: data.defense + 10 })
      },
      {
        label: 'HP 50% 회복',
        cost: baseCost - 5,
        desc: '추가 체력 회복',
        apply: (data) => ({ ...data, hp: Math.min(data.hp + Math.round(data.maxHp * 0.5), data.maxHp) })
      }
    ];
  }

  _createUpgradeBtn(W, y, upg, currentHp) {
    const canAfford = this.cash >= upg.cost;
    const bgColor = canAfford ? 0x0a1a2a : 0x0a0a0a;
    const borderColor = canAfford ? 0x1a3a5a : 0x222222;
    const labelColor = canAfford ? '#ffffff' : '#444444';
    const costColor = canAfford ? '#ffd700' : '#443300';

    const bg = this.add.rectangle(W / 2, y, W * 0.82, 62, bgColor)
      .setStrokeStyle(1, borderColor);

    if (canAfford) bg.setInteractive({ useHandCursor: true });

    this.add.text(W / 2, y - 12, upg.label, {
      fontSize: '15px', fontFamily: 'Arial', fontStyle: 'bold', color: labelColor
    }).setOrigin(0.5);

    this.add.text(W / 2 - 10, y + 10, upg.desc, {
      fontSize: '10px', fontFamily: 'Arial', color: '#667799'
    }).setOrigin(0.5);

    this.add.text(W / 2 + W * 0.3, y + 10, `💰${upg.cost}`, {
      fontSize: '11px', fontFamily: 'Arial', color: costColor
    }).setOrigin(1, 0.5);

    if (canAfford) {
      bg.on('pointerover', () => bg.setFillStyle(0x112233));
      bg.on('pointerout', () => bg.setFillStyle(bgColor));
      bg.on('pointerup', () => {
        const base = {
          stage: this.stage + 1,
          hp: currentHp,
          maxHp: this.maxHp,
          defense: this.defense,
          cash: this.cash - upg.cost
        };
        const next = upg.apply(base);
        this.scene.start('GameScene', next);
      });
    }
  }
}
